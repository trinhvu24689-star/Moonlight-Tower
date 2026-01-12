
import React, { useState, useEffect } from 'react';
import { Mail, X, Gift, Trash2, PackageOpen, CheckCheck, Archive, AlertCircle } from 'lucide-react';
import { getMails, markMailClaimed, deleteMail, deleteAllUserMails, markMailsClaimed } from '../utils/db';
import { soundManager } from '../utils/audio';

interface MailBoxProps {
    username: string;
    onClose: () => void;
    onClaimReward: (rewards: any) => void;
}

export const MailBox: React.FC<MailBoxProps> = ({ username, onClose, onClaimReward }) => {
    const [allMails, setAllMails] = useState<any[]>([]); // Raw data from DB
    const [visibleMails, setVisibleMails] = useState<any[]>([]); // Filtered data
    const [loading, setLoading] = useState(true);
    const [selectedMail, setSelectedMail] = useState<any>(null);
    
    // Local storage key for hidden system mails
    const DELETED_SYSTEM_MAILS_KEY = `moon_defense_deleted_mails_${username}`;

    useEffect(() => {
        loadMails();
    }, []);

    const loadMails = async () => {
        setLoading(true);
        const data = await getMails(username);
        
        // Filter out locally deleted system mails
        const localDeletedIds = JSON.parse(localStorage.getItem(DELETED_SYSTEM_MAILS_KEY) || '[]');
        const filtered = data.filter((m: any) => !localDeletedIds.includes(m.id));
        
        setAllMails(data);
        setVisibleMails(filtered);
        setLoading(false);
    };

    const handleClaim = async (mail: any) => {
        if (mail.is_claimed || !mail.rewards) return;
        
        const success = await markMailClaimed(mail.id);
        if (success) {
            soundManager.playCoin();
            onClaimReward(mail.rewards);
            
            // Update local state
            const updateState = (prev: any[]) => prev.map(m => m.id === mail.id ? { ...m, is_claimed: true } : m);
            setAllMails(updateState);
            setVisibleMails(updateState);
            setSelectedMail((prev: any) => prev && prev.id === mail.id ? { ...prev, is_claimed: true } : prev);
        }
    };

    const handleQuickClaimAll = async () => {
        const claimableMails = visibleMails.filter(m => !m.is_claimed && m.rewards);
        if (claimableMails.length === 0) return;

        // Aggregate rewards
        const totalRewards: any = { gold: 0, ruby: 0, items: [] };
        const idsToMark: number[] = [];

        claimableMails.forEach(m => {
            idsToMark.push(m.id);
            if (m.rewards.gold) totalRewards.gold += m.rewards.gold;
            if (m.rewards.ruby) totalRewards.ruby += m.rewards.ruby;
            if (m.rewards.items) totalRewards.items.push(...m.rewards.items);
        });

        const success = await markMailsClaimed(idsToMark);
        if (success) {
            soundManager.playUltimate();
            onClaimReward(totalRewards);
            
            // Update UI
            const updateState = (prev: any[]) => prev.map(m => idsToMark.includes(m.id) ? { ...m, is_claimed: true } : m);
            setAllMails(updateState);
            setVisibleMails(updateState);
            
            if (selectedMail && idsToMark.includes(selectedMail.id)) {
                setSelectedMail({ ...selectedMail, is_claimed: true });
            }
            alert(`Đã nhận nhanh: ${totalRewards.gold} Vàng, ${totalRewards.ruby} Ruby!`);
        }
    };

    const handleDelete = async (e: React.MouseEvent, mail: any) => {
        e.stopPropagation(); // Prevent selecting the mail when clicking delete
        
        // Handle System Mail (ALL) -> Hide Locally
        if (mail.username === 'ALL') {
            if (!confirm("Thư hệ thống sẽ bị ẩn khỏi danh sách. Tiếp tục?")) return;
            
            const localDeletedIds = JSON.parse(localStorage.getItem(DELETED_SYSTEM_MAILS_KEY) || '[]');
            const newDeletedIds = [...localDeletedIds, mail.id];
            localStorage.setItem(DELETED_SYSTEM_MAILS_KEY, JSON.stringify(newDeletedIds));
            
            soundManager.playHit();
            setVisibleMails(prev => prev.filter(m => m.id !== mail.id));
            if (selectedMail?.id === mail.id) setSelectedMail(null);
        } 
        // Handle Private Mail -> Delete from DB
        else {
            if (!confirm("Bạn muốn xóa vĩnh viễn thư này?")) return;
            const success = await deleteMail(mail.id);
            if (success) {
                soundManager.playHit();
                setVisibleMails(prev => prev.filter(m => m.id !== mail.id));
                if (selectedMail?.id === mail.id) setSelectedMail(null);
            } else {
                alert("Lỗi kết nối.");
            }
        }
    };

    const handleDeleteAll = async () => {
        if (visibleMails.length === 0) return;
        if (!confirm("Xác nhận xóa sạch hộp thư?")) return;
        
        // 1. Delete Private Mails from DB
        const privateMails = visibleMails.filter(m => m.username !== 'ALL');
        if (privateMails.length > 0) {
            await deleteAllUserMails(username);
        }

        // 2. Hide System Mails Locally
        const systemMails = visibleMails.filter(m => m.username === 'ALL');
        if (systemMails.length > 0) {
            const localDeletedIds = JSON.parse(localStorage.getItem(DELETED_SYSTEM_MAILS_KEY) || '[]');
            const newSystemIds = systemMails.map(m => m.id);
            // Merge unique IDs
            const combinedIds = Array.from(new Set([...localDeletedIds, ...newSystemIds]));
            localStorage.setItem(DELETED_SYSTEM_MAILS_KEY, JSON.stringify(combinedIds));
        }

        soundManager.playHit();
        setVisibleMails([]);
        setSelectedMail(null);
    };

    return (
        <div className="absolute inset-0 z-[150] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
            <div className="w-full max-w-4xl bg-stone-900 rounded-xl border-4 border-stone-700 shadow-2xl h-[80vh] flex overflow-hidden">
                {/* Mail List (Left) */}
                <div className="w-1/3 bg-stone-950 border-r border-stone-700 flex flex-col">
                    <div className="p-4 bg-stone-800 border-b border-stone-700">
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="font-bold text-white flex items-center gap-2"><Mail className="text-blue-400"/> Hộp Thư</h2>
                            <span className="text-xs bg-red-600 px-2 rounded-full text-white">{visibleMails.filter(m => !m.is_claimed).length}</span>
                        </div>
                        {/* Action Buttons */}
                        <div className="flex gap-2">
                            <button 
                                onClick={handleQuickClaimAll}
                                disabled={visibleMails.filter(m => !m.is_claimed && m.rewards).length === 0}
                                className="flex-1 bg-green-700 hover:bg-green-600 disabled:opacity-50 disabled:bg-stone-700 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition-colors shadow"
                            >
                                <CheckCheck size={14} /> Nhận Hết
                            </button>
                            <button 
                                onClick={handleDeleteAll}
                                disabled={visibleMails.length === 0}
                                className="flex-1 bg-red-900 hover:bg-red-700 disabled:opacity-50 disabled:bg-stone-700 text-white text-xs font-bold py-2 rounded flex items-center justify-center gap-1 transition-colors shadow"
                            >
                                <Trash2 size={14} /> Xóa Hết
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {loading ? (
                            <div className="p-4 text-stone-500 text-center">Đang tải thư...</div>
                        ) : visibleMails.length === 0 ? (
                            <div className="p-4 text-stone-500 text-center italic flex flex-col items-center gap-2 mt-10">
                                <Archive size={32} />
                                Hộp thư trống
                            </div>
                        ) : (
                            visibleMails.map(mail => (
                                <div 
                                    key={mail.id} 
                                    onClick={() => setSelectedMail(mail)}
                                    className={`relative p-4 border-b border-stone-800 cursor-pointer hover:bg-stone-900 transition-colors group ${selectedMail?.id === mail.id ? 'bg-stone-800 border-l-4 border-l-blue-500' : ''} ${!mail.is_claimed && mail.rewards ? 'text-white' : 'text-stone-400'}`}
                                >
                                    <div className="font-bold truncate pr-6">{mail.title}</div>
                                    <div className="text-xs flex justify-between mt-1 mb-4">
                                        <span className={mail.username === 'ALL' ? 'text-yellow-500 font-bold' : ''}>
                                            {mail.username === 'ALL' ? '[Hệ Thống]' : mail.sender}
                                        </span>
                                        <span>{new Date(mail.created_at).toLocaleDateString()}</span>
                                    </div>
                                    {!mail.is_claimed && mail.rewards && (
                                        <div className="mt-1 text-xs text-yellow-400 flex items-center gap-1"><Gift size={10}/> Có quà</div>
                                    )}

                                    {/* Small Delete Button at bottom right */}
                                    <button 
                                        onClick={(e) => handleDelete(e, mail)}
                                        className="absolute bottom-2 right-2 text-stone-600 hover:text-red-500 p-1.5 rounded-full hover:bg-stone-950 transition-colors z-10"
                                        title="Xóa thư"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Mail Content (Right) */}
                <div className="flex-1 bg-stone-900 flex flex-col relative">
                    <button onClick={onClose} className="absolute top-4 right-4 bg-stone-800 p-2 rounded-full hover:bg-red-600 transition-colors text-white z-10 shadow-lg"><X size={20}/></button>
                    
                    {selectedMail ? (
                        <div className="p-8 flex flex-col h-full animate-in slide-in-from-right duration-200">
                            <h2 className="text-2xl font-bold text-white mb-2">{selectedMail.title}</h2>
                            <div className="text-stone-500 text-sm mb-6 border-b border-stone-700 pb-4">
                                Từ: <span className="text-blue-400 font-bold">{selectedMail.sender}</span> • Ngày: {new Date(selectedMail.created_at).toLocaleString()}
                            </div>
                            
                            <div className="text-stone-300 whitespace-pre-wrap flex-1 leading-relaxed">
                                {selectedMail.content}
                            </div>

                            {selectedMail.rewards && (
                                <div className="mt-6 bg-stone-950 p-4 rounded-xl border border-stone-700">
                                    <h4 className="font-bold text-yellow-500 mb-3 flex items-center gap-2"><Gift size={18}/> Phần Thưởng Đính Kèm</h4>
                                    
                                    {selectedMail.is_claimed ? (
                                        <div className="text-green-500 font-bold flex items-center gap-2 bg-green-900/20 p-2 rounded justify-center border border-green-900/50">
                                            <PackageOpen /> ĐÃ NHẬN
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-4">
                                            <div className="flex gap-4 flex-wrap">
                                                {selectedMail.rewards.gold > 0 && (
                                                    <div className="bg-stone-800 px-3 py-1 rounded border border-yellow-600 text-yellow-400 font-bold">
                                                        +{selectedMail.rewards.gold} Vàng
                                                    </div>
                                                )}
                                                {selectedMail.rewards.ruby > 0 && (
                                                    <div className="bg-stone-800 px-3 py-1 rounded border border-pink-600 text-pink-400 font-bold">
                                                        +{selectedMail.rewards.ruby} Ruby
                                                    </div>
                                                )}
                                                {selectedMail.rewards.items && selectedMail.rewards.items.map((it: string) => (
                                                    <div key={it} className="bg-stone-800 px-3 py-1 rounded border border-purple-600 text-purple-400 font-bold uppercase">
                                                        {it}
                                                    </div>
                                                ))}
                                            </div>
                                            <button 
                                                onClick={() => handleClaim(selectedMail)}
                                                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                                            >
                                                <Gift /> NHẬN QUÀ NGAY
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="flex-1 flex items-center justify-center text-stone-600 flex-col">
                            <Mail size={64} className="mb-4 opacity-20"/>
                            <p>Chọn một lá thư để đọc</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
