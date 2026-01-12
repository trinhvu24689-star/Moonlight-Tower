
import React, { useState, useEffect } from 'react';
import { X, User, Shield, Zap, Package, Settings, LogOut, Volume2, Mic, AlertTriangle, Check } from 'lucide-react';
import { UserProfile } from '../types';
import { soundManager } from '../utils/audio';

interface ProfileProps {
  user: UserProfile;
  onClose: () => void;
  onLogout: () => void;
}

// Utility component for counting up numbers
const CountUp: React.FC<{ value: number; duration?: number; className?: string; prefix?: string }> = ({ value, duration = 1000, className, prefix = '' }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * value));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  }, [value, duration]);

  return <span className={className}>{prefix}{count.toLocaleString()}</span>;
};

// Precise digital clock format
const formatDigital = (totalSeconds: number) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h}h ${m}m ${s}s`;
}

export const Profile: React.FC<ProfileProps> = ({ user, onClose, onLogout }) => {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [voiceStatus, setVoiceStatus] = useState<string>("Đang kiểm tra...");
  const [voiceColor, setVoiceColor] = useState<string>("text-stone-400");

  useEffect(() => {
    const checkVoice = () => {
        if (!('speechSynthesis' in window)) {
            setVoiceStatus("Trình duyệt không hỗ trợ.");
            setVoiceColor("text-red-500");
            return;
        }

        const voice = soundManager.getVietnameseVoice();
        const allVoices = window.speechSynthesis.getVoices();
        
        if (voice) {
            setVoiceStatus(`Đã kết nối: ${voice.name}`);
            setVoiceColor("text-green-400");
        } else {
            if (allVoices.length === 0) {
                 setVoiceStatus("Đang tải danh sách giọng...");
                 setVoiceColor("text-yellow-500");
            } else {
                 setVoiceStatus("Không tìm thấy giọng Việt.");
                 setVoiceColor("text-red-400");
            }
        }
    };

    checkVoice();
    const interval = setInterval(checkVoice, 1000);
    return () => clearInterval(interval);
  }, []);

  const toggleSound = () => {
    const newState = !soundEnabled;
    setSoundEnabled(newState);
    soundManager.setMute(!newState);
  };

  const testVoice = () => {
      soundManager.speak("Xin chào! Giọng đọc tiếng Việt đã hoạt động tốt. Chúc bạn chơi game vui vẻ!", "guide");
  };

  return (
    <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in zoom-in duration-300">
       <div className="w-full max-w-2xl bg-[#1e293b] rounded-3xl border border-stone-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          
          {/* Scrollable Container */}
          <div className="overflow-y-auto flex-1 custom-scrollbar">
              {/* Header */}
              <div className="h-32 bg-gradient-to-r from-purple-800 to-indigo-900 relative flex-shrink-0">
                 <button onClick={onClose} className="absolute top-4 right-4 bg-black/30 p-2 rounded-full hover:bg-black/50 text-white transition-colors"><X/></button>
              </div>
              
              <div className="px-8 pb-8 relative">
                 {/* Avatar Area */}
                 <div className="relative -mt-16 mb-4 flex justify-between items-end">
                    <div className="w-32 h-32 bg-stone-900 rounded-full border-4 border-[#1e293b] flex items-center justify-center shadow-xl overflow-hidden group">
                       <div className="w-full h-full bg-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                          <User size={64} className="text-white"/>
                       </div>
                    </div>
                 </div>

                 {/* Info */}
                 <div className="mb-6">
                    <h2 className="text-3xl font-black text-white font-['Mali']">{user.username}</h2>
                    <div className="flex items-center gap-2 text-stone-400 text-sm font-bold">
                       <span className="bg-stone-700 px-2 py-0.5 rounded text-white">LV. {user.level}</span>
                       <span>ID: #839210</span>
                    </div>
                 </div>

                 {/* Stats Grid - Realtime Animated */}
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <div className="bg-stone-800 p-3 rounded-xl border border-stone-700 hover:border-orange-500 transition-colors">
                       <p className="text-xs text-stone-500 font-bold uppercase">Kinh Nghiệm</p>
                       <div className="text-lg font-black text-white flex items-baseline">
                         <CountUp value={user.exp} /> 
                         <span className="text-xs text-stone-500 font-normal ml-1">/ 1000</span>
                       </div>
                    </div>
                     <div className="bg-stone-800 p-3 rounded-xl border border-stone-700 hover:border-yellow-500 transition-colors">
                       <p className="text-xs text-stone-500 font-bold uppercase">Thành Tựu</p>
                       <p className="text-lg font-black text-yellow-400">
                          <CountUp value={12} duration={500} />
                       </p>
                    </div>
                     <div className="bg-stone-800 p-3 rounded-xl border border-stone-700 hover:border-blue-500 transition-colors">
                       <p className="text-xs text-stone-500 font-bold uppercase">Giờ Chơi</p>
                       {/* This makes it look like it's ticking live */}
                       <p className="text-lg font-black text-blue-400 font-mono tracking-tighter">
                          {formatDigital(user.playTime)}
                       </p>
                    </div>
                     <div className="bg-stone-800 p-3 rounded-xl border border-stone-700 hover:border-purple-500 transition-colors">
                       <p className="text-xs text-stone-500 font-bold uppercase">Hạng</p>
                       <p className="text-lg font-black text-purple-400">Vàng III</p>
                    </div>
                 </div>

                 {/* Inventory / Tabs */}
                 <div className="mb-8">
                    <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Package size={18}/> Túi Đồ</h3>
                    <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                       {Array.from({length: 6}).map((_, i) => (
                          <div key={i} className="aspect-square bg-stone-800 rounded-lg border border-stone-700 flex items-center justify-center hover:border-stone-500 cursor-pointer transition-colors group relative overflow-hidden">
                             {i < 1 ? (
                                <Zap className="text-yellow-500 opacity-80 group-hover:scale-110 transition-transform" /> 
                             ) : i === 1 ? (
                                <Shield className="text-blue-500 opacity-80 group-hover:scale-110 transition-transform" />
                             ) : (
                                <div className="text-stone-700 text-2xl group-hover:text-stone-500 transition-colors">+</div>
                             )}
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* Settings Section */}
                 <div className="border-t border-stone-700 pt-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><Settings size={18}/> Cài Đặt</h3>
                    
                    <div className="flex flex-col gap-3">
                        {/* Sound Toggle */}
                        <div className="flex justify-between items-center bg-stone-800 p-4 rounded-xl border border-stone-700">
                             <div className="flex items-center gap-3">
                                 <div className={`p-2 rounded-lg ${soundEnabled ? 'bg-green-900 text-green-400' : 'bg-stone-700 text-stone-500'}`}>
                                     {soundEnabled ? <Volume2 size={20}/> : <X size={20}/>}
                                 </div>
                                 <span className="font-bold text-stone-300">Âm Thanh & Nhạc</span>
                             </div>
                             <button 
                               onClick={toggleSound}
                               className={`w-12 h-6 rounded-full relative transition-colors ${soundEnabled ? 'bg-green-600' : 'bg-stone-600'}`}
                             >
                                 <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${soundEnabled ? 'left-7' : 'left-1'}`}></div>
                             </button>
                        </div>
                        
                        {/* Voice Test Button (IMPROVED) */}
                        <div className="bg-stone-800 p-4 rounded-xl border border-stone-700">
                             <div className="flex justify-between items-center mb-2">
                                 <div className="flex items-center gap-3">
                                     <div className="p-2 rounded-lg bg-blue-900 text-blue-400">
                                         <Mic size={20}/>
                                     </div>
                                     <div>
                                         <span className="font-bold text-stone-300 block">Giọng đọc Tiếng Việt</span>
                                         <span className={`text-xs font-bold ${voiceColor}`}>{voiceStatus}</span>
                                     </div>
                                 </div>
                                 <button 
                                    onClick={testVoice}
                                    className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors"
                                 >
                                    Test
                                 </button>
                             </div>
                             
                             {/* Helper Text */}
                             {voiceStatus.includes("Không tìm thấy") && (
                                 <div className="mt-2 text-xs text-orange-400 bg-orange-900/20 p-2 rounded border border-orange-900/50 flex items-start gap-2">
                                     <AlertTriangle size={12} className="mt-0.5 shrink-0"/>
                                     <span>Vào <b>Settings &gt; Time & Language &gt; Speech</b> trên Windows và tải gói <b>Vietnamese</b>. Sau đó tải lại game.</span>
                                 </div>
                             )}
                        </div>

                        {/* Logout Button */}
                        <button 
                            onClick={onLogout} 
                            className="mt-2 w-full bg-red-900/40 hover:bg-red-600 border border-red-800 hover:border-red-500 text-red-200 hover:text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 transition-all group active:scale-[0.98]"
                        >
                            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform" /> 
                            Đăng Xuất
                        </button>
                    </div>
                 </div>

              </div>
          </div>
       </div>
    </div>
  );
};
