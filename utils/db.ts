
import { neon } from '@neondatabase/serverless';
import { UserProfile } from '../types';

// CONNECTION STRING (Giữ nguyên của bạn)
const DATABASE_URL = 'postgresql://neondb_owner:npg_wiPFJ7CjWu9V@ep-mute-hat-a1ne8jd9-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require';

const sql = neon(DATABASE_URL);

// --- 1. USER SYNC & AUTH ---

export async function getUserData(username: string) {
  try {
    const result = await sql`SELECT * FROM users WHERE username = ${username}`;
    if (result.length === 0) return null;
    
    // Merge DB role into game_data to ensure client has permissions
    const userData = result[0].game_data;
    userData.role = result[0].role || 'user';
    
    return { ...result[0], game_data: userData };
  } catch (e) {
    console.error("DB Get User Error:", e);
    return null;
  }
}

export async function saveUserData(user: UserProfile) {
  try {
    // Preserve Role: Do not let client overwrite role easily unless handled carefully
    // Only update game_data, role is managed separately or implicitly via the first insert default
    await sql`
      INSERT INTO users (username, game_data, role, last_login)
      VALUES (${user.username}, ${JSON.stringify(user)}, 'user', NOW())
      ON CONFLICT (username) 
      DO UPDATE SET game_data = ${JSON.stringify(user)}, last_login = NOW()
    `;
    return true;
  } catch (e) {
    console.error("DB Save User Error:", e);
    return false;
  }
}

// --- 2. ADMIN & MODERATION ---

export async function banUser(username: string, durationHours: number, reason: string) {
    try {
        // Security Check: Cannot ban Admin or NPH
        const target = await sql`SELECT role FROM users WHERE username = ${username}`;
        if (target.length > 0) {
            const role = target[0].role;
            if (role === 'admin' || role === 'nph') {
                return { success: false, msg: "KHÔNG THỂ BAN QUẢN TRỊ VIÊN/NPH!" };
            }
        }

        let expiresAt = null;
        if (durationHours < 999999) {
            const date = new Date();
            date.setHours(date.getHours() + durationHours);
            expiresAt = date.toISOString();
        } else {
            expiresAt = '3000-01-01T00:00:00Z'; // Vĩnh viễn
        }

        await sql`
            UPDATE users 
            SET is_banned = TRUE, ban_expires_at = ${expiresAt}, ban_reason = ${reason}
            WHERE username = ${username}
        `;
        return { success: true, msg: "Đã Ban thành công." };
    } catch (e) {
        return { success: false, error: e };
    }
}

export async function deleteUser(username: string, key: string) {
    try {
        // Verify Key
        if (key !== "NPH-DELETETK") {
            return { success: false, msg: "Mã khóa NPH không chính xác!" };
        }

        // Security Check: Cannot delete NPH
        if (username === 'Quang Hổ') {
            return { success: false, msg: "KHÔNG THỂ XÓA TÀI KHOẢN NPH TỐI CAO!" };
        }

        await sql`DELETE FROM users WHERE username = ${username}`;
        return { success: true, msg: `Đã xóa vĩnh viễn tài khoản ${username}.` };
    } catch (e) {
        return { success: false, msg: "Lỗi hệ thống khi xóa." };
    }
}

export async function unbanUser(username: string) {
    try {
        await sql`
            UPDATE users 
            SET is_banned = FALSE, ban_expires_at = NULL, ban_reason = NULL
            WHERE username = ${username}
        `;
        return { success: true };
    } catch (e) {
        return { success: false, error: e };
    }
}

// --- 3. BOT SYSTEM ---

export async function runBotScan() {
    try {
        // Logic: Scan users with suspicious data
        // 1. Gold > 1 Billion but Level < 50
        // 2. Ruby > 100,000 but Level < 10
        const suspiciousUsers = await sql`
            SELECT username, game_data FROM users 
            WHERE role = 'user' AND is_banned = FALSE
        `;

        const bannedList = [];
        
        for (const u of suspiciousUsers) {
            const data = u.game_data;
            let reason = '';
            
            if (data.gold > 1000000000 && data.level < 50) reason = "Hack Vàng (Bot Auto-Detect)";
            else if (data.ruby > 100000 && data.level < 10) reason = "Hack Ruby (Bot Auto-Detect)";

            if (reason) {
                await banUser(u.username, 999999, reason);
                bannedList.push(`${u.username}: ${reason}`);
                // Log bot action
                await sql`INSERT INTO bot_logs (action_type, target_user, details) VALUES ('AUTO_BAN', ${u.username}, ${reason})`;
            }
        }
        return { success: true, banned: bannedList };
    } catch (e) {
        return { success: false, error: e };
    }
}

// --- 4. MAIL & OTHERS ---

export async function sendMail(toUser: string, title: string, content: string, rewards: any) {
    try {
        // Updated INSERT to include sender, is_claimed, and explicit created_at
        await sql`
            INSERT INTO mails (username, title, content, rewards, sender, is_claimed, created_at)
            VALUES (${toUser}, ${title}, ${content}, ${JSON.stringify(rewards)}, 'NPH', FALSE, NOW())
        `;
        return { success: true };
    } catch (e) {
        console.error("Send Mail Error:", e);
        return { success: false, error: e };
    }
}

export async function getMails(username: string) {
    try {
        // Simplified query logic to ensure delivery
        const result = await sql`
            SELECT * FROM mails 
            WHERE username = ${username} OR username = 'ALL'
            ORDER BY created_at DESC
        `;
        return result;
    } catch (e) {
        console.error("Get Mails Error:", e);
        return [];
    }
}

export async function markMailClaimed(mailId: number) {
    try {
        await sql`UPDATE mails SET is_claimed = TRUE WHERE id = ${mailId}`;
        return true;
    } catch (e) { return false; }
}

// NEW: Delete a single mail
export async function deleteMail(mailId: number) {
    try {
        await sql`DELETE FROM mails WHERE id = ${mailId}`;
        return true;
    } catch (e) { return false; }
}

// NEW: Delete all private mails for a user (Cannot delete 'ALL' server mails)
export async function deleteAllUserMails(username: string) {
    try {
        await sql`DELETE FROM mails WHERE username = ${username}`;
        return true;
    } catch (e) { return false; }
}

// NEW: Mark multiple mails as claimed
export async function markMailsClaimed(ids: number[]) {
    try {
        if (ids.length === 0) return true;
        await sql`UPDATE mails SET is_claimed = TRUE WHERE id = ANY(${ids})`;
        return true;
    } catch (e) { return false; }
}

export async function createGiftcode(code: string, rewards: any, limit: number) {
     try {
        await sql`
            INSERT INTO giftcodes (code, rewards, usage_limit)
            VALUES (${code}, ${JSON.stringify(rewards)}, ${limit})
        `;
        return { success: true };
    } catch (e) { return { success: false, error: e }; }
}

export async function redeemGiftcode(username: string, code: string) {
    try {
        const codeData = await sql`SELECT * FROM giftcodes WHERE code = ${code}`;
        if (codeData.length === 0) return { success: false, msg: "Mã không tồn tại!" };
        
        const gc = codeData[0];
        if (gc.used_count >= gc.usage_limit) return { success: false, msg: "Mã đã hết lượt sử dụng!" };

        const history = await sql`SELECT * FROM giftcode_history WHERE code = ${code} AND username = ${username}`;
        if (history.length > 0) return { success: false, msg: "Bạn đã nhập mã này rồi!" };

        await sql`UPDATE giftcodes SET used_count = used_count + 1 WHERE code = ${code}`;
        await sql`INSERT INTO giftcode_history (code, username) VALUES (${code}, ${username})`;

        await sendMail(username, "Quà Giftcode", `Bạn đã đổi mã [${code}] thành công!`, gc.rewards);

        return { success: true, msg: "Đổi mã thành công! Kiểm tra hòm thư." };
    } catch (e) {
        return { success: false, msg: "Lỗi hệ thống." };
    }
}

export async function logTransaction(username: string, amount: number, gems: number, note: string) {
  try {
    const result = await sql`
      INSERT INTO payment_transactions (username, amount_vn, gems_received, transaction_code, status)
      VALUES (${username}, ${amount}, ${gems}, ${note}, 'pending')
      RETURNING id, created_at
    `;
    return { success: true, data: result[0] };
  } catch (error) {
    console.error("NeonDB Error:", error);
    return { success: false, error };
  }
}
