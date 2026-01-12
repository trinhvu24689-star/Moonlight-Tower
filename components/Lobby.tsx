
import React, { useState, useEffect } from 'react';
import { Play, Skull, Scroll, Settings, ChevronRight, X, Trophy, Plus, User, ShoppingBag, Gift, Coins, Gem, Ghost, Sprout, Mail, Shield } from 'lucide-react';
import { GameDifficulty, UserProfile } from '../types';
import { soundManager } from '../utils/audio';

interface LobbyProps {
  user: UserProfile;
  onStartGame: (difficulty: GameDifficulty) => void;
  onOpenFarm: () => void;
  onOpenStory: () => void;
  onOpenProfile: () => void;
  onOpenTopUp: () => void;
  onOpenShop: () => void;
  onOpenGacha: () => void;
  onOpenMail: () => void;
  onOpenAdmin: () => void; 
}

export const Lobby: React.FC<LobbyProps> = ({ 
  user, onStartGame, onOpenFarm, onOpenStory, onOpenProfile, onOpenTopUp, onOpenShop, onOpenGacha, onOpenMail, onOpenAdmin
}) => {
  const [showModes, setShowModes] = useState(false);
  
  const isAdminOrNPH = user.role === 'admin' || user.role === 'nph';

  useEffect(() => {
    soundManager.playBGM();
  }, []);

  const handleModeSelect = (diff: GameDifficulty) => {
    soundManager.playUltimate(); 
    onStartGame(diff);
  };

  const playClick = () => soundManager.playCoin();

  return (
    <div className="w-full h-screen bg-[#0f111a] flex flex-col font-sans text-white relative overflow-hidden">
      {/* --- BACKGROUND EFFECTS --- */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/40 via-[#0f111a] to-black pointer-events-none"></div>
      
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
         <div className="absolute top-1/4 left-1/4 animate-[bounce_3s_infinite] opacity-10"><Ghost size={64} /></div>
         <div className="absolute top-3/4 right-1/4 animate-[bounce_4s_infinite] opacity-10"><Skull size={48} /></div>
         {Array.from({length: 20}).map((_,i) => (
             <div 
               key={i}
               className="absolute w-1 h-1 bg-orange-500 rounded-full animate-[ping_3s_infinite]"
               style={{
                   left: `${Math.random() * 100}%`,
                   top: `${Math.random() * 100}%`,
                   animationDelay: `${Math.random() * 5}s`
               }}
             ></div>
         ))}
      </div>

      {/* --- ADMIN BUTTON --- */}
      {isAdminOrNPH && (
          <button 
            onClick={() => { playClick(); onOpenAdmin(); }}
            className="fixed bottom-2 left-2 z-[999] bg-red-900/90 border border-red-500 text-white px-2 py-1 rounded-full font-bold flex items-center gap-1 hover:bg-red-700 transition-colors shadow-lg cursor-pointer pointer-events-auto text-[10px] md:text-xs"
          >
              <Shield size={10} /> ADMIN
          </button>
      )}

      {/* --- HEADER (Compact) --- */}
      <div className="relative z-50 px-3 py-2 flex justify-between items-center shrink-0 bg-black/20 backdrop-blur-sm border-b border-white/5 h-12">
         {/* Left: User Info */}
         <div 
            onClick={() => { playClick(); onOpenProfile(); }}
            className="flex items-center gap-2 cursor-pointer group"
        >
            <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center border-2 border-white/20 overflow-hidden">
                {user.role === 'nph' ? <Shield className="text-white" size={14}/> : <User className="text-white" size={14} />}
            </div>
            <div className="flex flex-col">
                <span className={`font-bold font-['Mali'] leading-none text-xs md:text-sm ${user.role === 'nph' ? 'text-yellow-400' : 'text-white'}`}>
                    {user.username}
                </span>
                <span className="text-[9px] text-stone-400 font-bold">Lv. {user.level}</span>
            </div>
        </div>

        {/* Right: Currencies */}
        <div className="flex items-center gap-2">
            <div className="bg-black/60 border border-yellow-600/50 rounded-full px-2 py-0.5 flex items-center gap-1.5 h-7">
                <Coins size={12} className="text-yellow-500 fill-yellow-500" />
                <span className="font-bold text-yellow-400 text-xs">{user.gold.toLocaleString()}</span>
                <button onClick={playClick} className="bg-yellow-700 w-4 h-4 rounded-full flex items-center justify-center ml-1"><Plus size={8} /></button>
            </div>
            
            <div className="bg-black/60 border border-pink-600/50 rounded-full px-2 py-0.5 flex items-center gap-1.5 h-7">
                <Gem size={12} className="text-pink-500 fill-pink-500" />
                <span className="font-bold text-pink-400 text-xs">{user.ruby.toLocaleString()}</span>
                <button onClick={() => { playClick(); onOpenTopUp(); }} className="bg-pink-700 w-4 h-4 rounded-full flex items-center justify-center ml-1"><Plus size={8} /></button>
            </div>
        </div>
      </div>

      {/* --- MAIN CONTENT (Side-by-Side Layout for Landscape Mobile) --- */}
      <div className="flex-1 relative z-10 flex flex-row items-center justify-center w-full px-2 md:px-12 gap-4 md:gap-12 overflow-hidden">
        
        {/* LEFT COLUMN: Logo (Shrinks on small screens) */}
        <div className="flex flex-col items-center justify-center shrink-0 w-1/3 md:w-auto">
           <div className="text-center transform hover:scale-105 transition-transform duration-500 group cursor-default">
               <h1 className="text-2xl md:text-6xl font-['Mali'] font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-red-500 to-purple-900 drop-shadow-[0_2px_0_#000] tracking-tighter animate-[pulse_3s_infinite] leading-none">
                 THỦ
               </h1>
               <h1 className="text-2xl md:text-6xl font-['Mali'] font-black text-transparent bg-clip-text bg-gradient-to-b from-orange-400 via-red-500 to-purple-900 drop-shadow-[0_2px_0_#000] tracking-tighter animate-[pulse_3s_infinite] leading-none">
                 THÀNH
               </h1>
               <div className="relative inline-block mt-1">
                   <h2 className="text-xl md:text-4xl font-['Mali'] font-black text-white drop-shadow-[0_2px_0_#ea580c] -rotate-2">
                     ÁNH TRĂNG
                   </h2>
               </div>
           </div>
        </div>

        {/* RIGHT COLUMN: Controls */}
        <div className="flex flex-col gap-2 md:gap-4 w-2/3 md:w-auto max-w-lg justify-center h-full py-4">
            
            {/* Row 1: Big Game Modes */}
            <div className="flex gap-2 w-full h-1/2 md:h-32">
                <button 
                    onClick={() => { playClick(); onOpenFarm(); }}
                    className="flex-1 group relative bg-gradient-to-b from-green-600 to-emerald-800 hover:from-green-500 hover:to-emerald-700 rounded-xl font-black shadow-[0_3px_0_#064e3b] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border-t border-green-400 p-2"
                >
                    <Sprout size={20} className="md:w-8 md:h-8 text-white drop-shadow-md animate-bounce" />
                    <span className="text-shadow text-xs md:text-lg uppercase">Nông Trại</span>
                </button>

                {!showModes ? (
                    <button 
                        onClick={() => { playClick(); setShowModes(true); }}
                        className="flex-1 group relative bg-gradient-to-b from-orange-600 to-red-800 hover:from-orange-500 hover:to-red-700 rounded-xl font-black shadow-[0_3px_0_#7f1d1d] active:shadow-none active:translate-y-1 transition-all flex flex-col items-center justify-center gap-1 border-t border-orange-400 p-2"
                    >
                        <div className="relative">
                            <Skull size={20} className="md:w-8 md:h-8 text-white drop-shadow-md" />
                            <div className="absolute inset-0 animate-ping opacity-50"><Skull size={20} className="md:w-8 md:h-8"/></div>
                        </div>
                        <span className="text-shadow uppercase text-center text-xs md:text-lg">Chiến Đấu</span>
                    </button>
                ) : (
                    <div className="flex-1 bg-stone-900/95 backdrop-blur-xl rounded-xl p-2 border border-stone-600 animate-in zoom-in duration-200 shadow-xl flex flex-col justify-between">
                        <div className="flex justify-between items-center border-b border-stone-700 pb-1 mb-1">
                            <span className="font-bold text-[10px] text-stone-300">ĐỘ KHÓ</span>
                            <button onClick={() => { playClick(); setShowModes(false); }}><X size={12} className="text-stone-400 hover:text-white" /></button>
                        </div>
                        <div className="flex gap-2 h-full items-center">
                            <button onClick={() => handleModeSelect('normal')} className="flex-1 bg-stone-800 hover:bg-green-900/50 text-green-400 text-[10px] font-bold py-2 rounded border border-stone-700 hover:border-green-500 text-center">Bình Thường</button>
                            <button onClick={() => handleModeSelect('hardcore')} className="flex-1 bg-stone-800 hover:bg-red-900/50 text-red-400 text-[10px] font-bold py-2 rounded border border-stone-700 hover:border-red-500 text-center">Ác Mộng</button>
                        </div>
                    </div>
                )}
            </div>

            {/* Row 2: Small Functional Buttons */}
            <div className="grid grid-cols-4 gap-2 h-1/3 md:h-20">
                <button onClick={() => { playClick(); onOpenShop(); }} className="bg-stone-800/80 hover:bg-indigo-900/80 rounded-lg border border-stone-600 hover:border-indigo-400 flex flex-col items-center justify-center gap-1 transition-all">
                    <ShoppingBag className="text-indigo-400" size={16} />
                    <span className="text-[9px] font-bold uppercase text-stone-300">Shop</span>
                </button>
                <button onClick={() => { playClick(); onOpenGacha(); }} className="bg-stone-800/80 hover:bg-pink-900/80 rounded-lg border border-stone-600 hover:border-pink-400 flex flex-col items-center justify-center gap-1 transition-all">
                    <Gift className="text-pink-400 animate-bounce" size={16} />
                    <span className="text-[9px] font-bold uppercase text-stone-300">Gacha</span>
                </button>
                <button onClick={() => { playClick(); onOpenMail(); }} className="bg-stone-800/80 hover:bg-blue-900/80 rounded-lg border border-stone-600 hover:border-blue-400 flex flex-col items-center justify-center gap-1 transition-all relative">
                    <Mail className="text-blue-400" size={16} />
                    <span className="text-[9px] font-bold uppercase text-stone-300">Thư</span>
                </button>
                <button onClick={() => { playClick(); onOpenStory(); }} className="bg-stone-800/80 hover:bg-amber-900/80 rounded-lg border border-stone-600 hover:border-amber-400 flex flex-col items-center justify-center gap-1 transition-all">
                    <Scroll className="text-amber-400" size={16} />
                    <span className="text-[9px] font-bold uppercase text-stone-300">Truyện</span>
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
