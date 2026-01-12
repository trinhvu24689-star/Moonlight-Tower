
import React, { useState } from 'react';
import { Shield, Search, Ban, Unlock, Gift, Mail, X, CheckCircle, AlertTriangle, User, Database, Bot, Trash2 } from 'lucide-react';
import { getUserData, banUser, unbanUser, sendMail, createGiftcode, deleteUser, runBotScan } from '../utils/db';
import { soundManager } from '../utils/audio';

interface AdminPanelProps {
  onClose: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'users' | 'mail' | 'giftcode' | 'bot'>('users');
  const [targetUser, setTargetUser] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');

  // Forms
  const [banReason, setBanReason] = useState('Vi phạm quy định');
  const [banDuration, setBanDuration] = useState('24'); // hours
  const [nphKey, setNphKey] = useState(''); // Delete key
  
  const [mailTitle, setMailTitle] = useState('Quà từ NPH');
  const [mailContent, setMailContent] = useState('Cảm ơn bạn đã ủng hộ game!');
  const [mailGold, setMailGold] = useState(0);
  const [mailRuby, setMailRuby] = useState(0);
  const [mailItem, setMailItem] = useState('');

  const [gcCode, setGcCode] = useState('');
  const [gcLimit, setGcLimit] = useState(100);

  // Bot Logs
  const [botLogs, setBotLogs] = useState<string[]>([]);

  const handleSearchUser = async () => {
      setLoading(true);
      setUserData(null);
      setStatusMsg('');
      const cleanTarget = targetUser.trim();
      const data = await getUserData(cleanTarget);
      setLoading(false);
      if (data) {
          setUserData(data);
          soundManager.playCoin();
      } else {
          setStatusMsg(`Không tìm thấy người chơi "${cleanTarget}".`);
          soundManager.playHit();
      }
  };

  const handleBan = async () => {
      if (!userData) return;
      const res = await banUser(userData.username, parseInt(banDuration), banReason);
      if (res.success) {
          setStatusMsg(res.msg || `Đã BAN ${userData.username}.`);
          handleSearchUser(); // Refresh
      } else {
          setStatusMsg(res.msg || "Lỗi khi Ban.");
      }
  };

  const handleDeleteUser = async () => {
      if (!userData) return;
      if (!confirm(`CẢNH BÁO: Bạn có chắc muốn xóa vĩnh viễn ${userData.username}?`)) return;

      const res = await deleteUser(userData.username, nphKey);
      setStatusMsg(res.msg || "Lỗi");
      if (res.success) {
          setUserData(null);
          setNphKey('');
      }
  };

  const handleUnban = async () => {
      if (!userData) return;
      const res = await unbanUser(userData.username);
      if (res.success) {
          setStatusMsg(`Đã mở khóa cho ${userData.username}.`);
          handleSearchUser();
      }
  };

  const handleSendMail = async (isAll: boolean = false) => {
      const recipient = isAll ? 'ALL' : targetUser.trim();
      if (!isAll && !userData) { setStatusMsg("Chưa chọn người nhận!"); return; }
      
      const rewards: any = {};
      if (mailGold > 0) rewards.gold = mailGold;
      if (mailRuby > 0) rewards.ruby = mailRuby;
      if (mailItem) rewards.items = [mailItem];

      const res = await sendMail(recipient, mailTitle, mailContent, rewards);
      if (res.success) {
          setStatusMsg(`Đã gửi thư tới ${recipient}!`);
          setMailTitle('Quà từ NPH'); setMailContent('Cảm ơn bạn đã ủng hộ game!');
      } else {
          setStatusMsg("Lỗi gửi thư. Vui lòng kiểm tra lại.");
      }
  };

  const handleCreateCode = async () => {
      if (!gcCode) return;
      const rewards: any = {};
      if (mailGold > 0) rewards.gold = mailGold;
      if (mailRuby > 0) rewards.ruby = mailRuby;
      if (mailItem) rewards.items = [mailItem];

      const res = await createGiftcode(gcCode, rewards, gcLimit);
      if (res.success) {
          setStatusMsg(`Tạo code [${gcCode}] thành công!`);
          setGcCode('');
      } else {
          setStatusMsg("Lỗi tạo code.");
      }
  };

  const handleRunBot = async () => {
      setLoading(true);
      setBotLogs(prev => [...prev, "Đang quét server..."]);
      const res = await runBotScan();
      setLoading(false);
      
      if (res.success && res.banned) {
          if (res.banned.length === 0) setBotLogs(prev => [...prev, "Server sạch. Không phát hiện vi phạm."]);
          else res.banned.forEach((log: string) => setBotLogs(prev => [...prev, `[AUTO-BAN] ${log}`]));
      } else {
          setBotLogs(prev => [...prev, "Lỗi khi chạy Bot."]);
      }
  };

  return (
    <div className="absolute inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 font-sans text-white animate-in zoom-in">
        <div className="w-full max-w-5xl bg-stone-900 border-2 border-red-800 rounded-xl overflow-hidden flex flex-col h-[90vh]">
            {/* Header */}
            <div className="bg-red-900/50 p-4 border-b border-red-800 flex justify-between items-center">
                <h2 className="text-2xl font-bold flex items-center gap-2"><Shield /> NPH CONTROL PANEL (Quang Hổ)</h2>
                <button onClick={onClose}><X /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Sidebar */}
                <div className="w-48 bg-black/50 border-r border-stone-800 p-4 flex flex-col gap-2">
                    <button onClick={() => setActiveTab('users')} className={`p-3 text-left rounded hover:bg-stone-800 font-bold ${activeTab === 'users' ? 'bg-red-900 text-white' : 'text-stone-400'}`}>
                        <User size={18} className="inline mr-2"/> Quản Lý User
                    </button>
                    <button onClick={() => setActiveTab('bot')} className={`p-3 text-left rounded hover:bg-stone-800 font-bold ${activeTab === 'bot' ? 'bg-green-900 text-white' : 'text-stone-400'}`}>
                        <Bot size={18} className="inline mr-2"/> Hệ Thống Bot
                    </button>
                    <button onClick={() => setActiveTab('mail')} className={`p-3 text-left rounded hover:bg-stone-800 font-bold ${activeTab === 'mail' ? 'bg-blue-900 text-white' : 'text-stone-400'}`}>
                        <Mail size={18} className="inline mr-2"/> Gửi Thư / Quà
                    </button>
                    <button onClick={() => setActiveTab('giftcode')} className={`p-3 text-left rounded hover:bg-stone-800 font-bold ${activeTab === 'giftcode' ? 'bg-yellow-900 text-white' : 'text-stone-400'}`}>
                        <Gift size={18} className="inline mr-2"/> Giftcode
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto custom-scrollbar">
                    {statusMsg && (
                        <div className="mb-4 bg-stone-800 border border-stone-600 p-3 rounded text-yellow-400 font-bold animate-pulse whitespace-pre-wrap">
                            {statusMsg}
                        </div>
                    )}

                    {activeTab === 'users' && (
                        <div className="space-y-6">
                            <div className="flex gap-2">
                                <input 
                                    type="text" 
                                    placeholder="Nhập tên nhân vật..." 
                                    className="flex-1 bg-stone-800 border border-stone-600 rounded p-2 text-white"
                                    value={targetUser}
                                    onChange={e => setTargetUser(e.target.value)}
                                />
                                <button onClick={handleSearchUser} className="bg-blue-600 px-4 rounded font-bold hover:bg-blue-500">
                                    {loading ? '...' : <Search />}
                                </button>
                            </div>

                            {userData ? (
                                <div className="bg-stone-800 p-4 rounded border border-stone-600">
                                    <div className="flex justify-between items-start mb-4 border-b border-stone-700 pb-2">
                                        <div>
                                            <h3 className="text-xl font-bold text-green-400 flex items-center gap-2">
                                                {userData.username}
                                                {userData.role === 'nph' && <span className="bg-red-600 text-white text-xs px-2 py-1 rounded">NPH</span>}
                                                {userData.role === 'admin' && <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded">ADMIN</span>}
                                            </h3>
                                            <p className="text-xs text-stone-500">Role: {userData.role || 'user'}</p>
                                        </div>
                                        {userData.is_banned && (
                                            <div className="bg-red-600 text-white px-2 py-1 rounded text-xs font-bold animate-pulse">
                                                BANNED
                                            </div>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm text-stone-300">
                                        <div className="bg-black/30 p-2 rounded">Vàng: <span className="text-yellow-400">{userData.game_data.gold}</span></div>
                                        <div className="bg-black/30 p-2 rounded">Ruby: <span className="text-pink-400">{userData.game_data.ruby}</span></div>
                                        <div className="bg-black/30 p-2 rounded">Level: {userData.game_data.level}</div>
                                        <div className="bg-black/30 p-2 rounded">Exp: {userData.game_data.exp}</div>
                                    </div>

                                    <div className="space-y-4 border-t border-stone-700 pt-4">
                                        <div className="flex flex-col gap-2">
                                            <label className="text-xs font-bold text-red-400 uppercase">Khu vực trừng phạt (BAN)</label>
                                            <div className="flex gap-2">
                                                <select className="bg-stone-900 border border-stone-600 rounded p-2 text-sm" value={banDuration} onChange={e => setBanDuration(e.target.value)}>
                                                    <option value="1">1 Giờ</option>
                                                    <option value="24">1 Ngày</option>
                                                    <option value="168">7 Ngày</option>
                                                    <option value="720">30 Ngày</option>
                                                    <option value="8760">1 Năm</option>
                                                    <option value="999999">Vĩnh Viễn</option>
                                                </select>
                                                <input type="text" className="bg-stone-900 border border-stone-600 rounded p-2 text-sm flex-1" placeholder="Lý do ban..." value={banReason} onChange={e => setBanReason(e.target.value)} />
                                                <button onClick={handleBan} className="bg-red-600 hover:bg-red-500 px-4 py-2 rounded font-bold text-sm">BAN</button>
                                            </div>
                                            {userData.is_banned && (
                                                <button onClick={handleUnban} className="w-full bg-green-600 hover:bg-green-500 py-2 rounded font-bold flex items-center justify-center gap-2">
                                                    <Unlock size={16}/> GỠ BAN (MỞ KHÓA)
                                                </button>
                                            )}
                                        </div>

                                        <div className="flex flex-col gap-2 border-t border-stone-700 pt-4">
                                            <label className="text-xs font-bold text-stone-500 uppercase">Xóa tài khoản vĩnh viễn</label>
                                            <div className="flex gap-2">
                                                <input type="password" placeholder="Nhập Key NPH..." className="bg-stone-900 border border-stone-600 rounded p-2 text-sm flex-1" value={nphKey} onChange={e => setNphKey(e.target.value)} />
                                                <button onClick={handleDeleteUser} className="bg-stone-700 hover:bg-red-700 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2"><Trash2 size={16}/> XÓA</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-center text-stone-500 italic mt-10">Nhập tên để xem thông tin...</div>
                            )}
                        </div>
                    )}

                    {activeTab === 'bot' && (
                        <div className="space-y-4">
                            <div className="bg-green-900/20 border border-green-700 p-4 rounded-xl">
                                <h3 className="text-xl font-bold text-green-400 mb-2 flex items-center gap-2"><Bot /> BOT QUẢN LÝ</h3>
                                <p className="text-sm text-stone-300 mb-4">Bot sẽ tự động quét toàn bộ database để tìm người chơi có dấu hiệu hack (Vàng/Ruby bất thường so với Level) và tự động BAN.</p>
                                <button onClick={handleRunBot} disabled={loading} className="bg-green-600 hover:bg-green-500 px-6 py-3 rounded-lg font-bold shadow-lg flex items-center gap-2">
                                    {loading ? <div className="animate-spin rounded-full h-4 w-4 border-2 border-white"></div> : <Database size={16}/>}
                                    CHẠY QUÉT NGAY
                                </button>
                            </div>

                            <div className="bg-black border border-stone-700 p-4 rounded-xl h-64 overflow-y-auto font-mono text-xs">
                                <div className="text-stone-500 mb-2">--- BOT SYSTEM LOGS ---</div>
                                {botLogs.map((log, i) => (
                                    <div key={i} className="mb-1 text-green-400 border-b border-stone-900/30 pb-1">
                                        <span className="text-stone-600 mr-2">{new Date().toLocaleTimeString()}</span>
                                        {log}
                                    </div>
                                ))}
                                {botLogs.length === 0 && <div className="text-stone-600 italic">Chưa có nhật ký hoạt động...</div>}
                            </div>
                        </div>
                    )}

                    {(activeTab === 'mail' || activeTab === 'giftcode') && (
                        <div className="space-y-4">
                             <div className="bg-stone-800 p-4 rounded border border-stone-600">
                                 <h3 className="font-bold mb-4 text-yellow-400">Cấu hình quà tặng</h3>
                                 <div className="grid grid-cols-3 gap-4 mb-4">
                                     <div>
                                         <label className="text-xs text-stone-400">Vàng</label>
                                         <input type="number" className="w-full bg-stone-900 border border-stone-600 p-2 rounded" value={mailGold} onChange={e => setMailGold(parseInt(e.target.value)||0)} />
                                     </div>
                                     <div>
                                         <label className="text-xs text-stone-400">Ruby</label>
                                         <input type="number" className="w-full bg-stone-900 border border-stone-600 p-2 rounded" value={mailRuby} onChange={e => setMailRuby(parseInt(e.target.value)||0)} />
                                     </div>
                                     <div>
                                         <label className="text-xs text-stone-400">Item ID (vd: skin_red)</label>
                                         <input type="text" className="w-full bg-stone-900 border border-stone-600 p-2 rounded" value={mailItem} onChange={e => setMailItem(e.target.value)} />
                                     </div>
                                 </div>
                             </div>

                             {activeTab === 'mail' && (
                                 <div className="bg-stone-800 p-4 rounded border border-stone-600">
                                     <h3 className="font-bold mb-4 text-blue-400">Soạn Thư</h3>
                                     <input type="text" placeholder="Tiêu đề thư..." className="w-full bg-stone-900 border border-stone-600 p-2 rounded mb-2" value={mailTitle} onChange={e => setMailTitle(e.target.value)} />
                                     <textarea placeholder="Nội dung thư..." className="w-full bg-stone-900 border border-stone-600 p-2 rounded mb-4 h-24" value={mailContent} onChange={e => setMailContent(e.target.value)}></textarea>
                                     
                                     <div className="flex gap-2">
                                         <button onClick={() => handleSendMail(false)} className="flex-1 bg-blue-600 hover:bg-blue-500 py-3 rounded font-bold">Gửi cho {targetUser || '...'}</button>
                                         <button onClick={() => { if(confirm('Gửi cho TOÀN BỘ SERVER?')) handleSendMail(true) }} className="flex-1 bg-red-900 hover:bg-red-700 py-3 rounded font-bold border border-red-500">Gửi ALL SERVER</button>
                                     </div>
                                 </div>
                             )}

                             {activeTab === 'giftcode' && (
                                  <div className="bg-stone-800 p-4 rounded border border-stone-600">
                                     <h3 className="font-bold mb-4 text-green-400">Tạo Giftcode</h3>
                                     <div className="flex gap-2 mb-4">
                                         <input type="text" placeholder="Mã Code (VD: TET2025)..." className="flex-1 bg-stone-900 border border-stone-600 p-2 rounded font-mono font-bold uppercase" value={gcCode} onChange={e => setGcCode(e.target.value)} />
                                         <input type="number" placeholder="Giới hạn..." className="w-32 bg-stone-900 border border-stone-600 p-2 rounded" value={gcLimit} onChange={e => setGcLimit(parseInt(e.target.value))} />
                                     </div>
                                     <button onClick={handleCreateCode} className="w-full bg-green-600 hover:bg-green-500 py-3 rounded font-bold">TẠO CODE</button>
                                  </div>
                             )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    </div>
  );
};
