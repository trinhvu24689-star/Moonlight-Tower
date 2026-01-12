
import React, { useEffect, useState } from 'react';
import { soundManager } from '../utils/audio';

interface PublisherIntroProps {
    onComplete: () => void;
}

// --- CSS ANIMATIONS ---
const introStyles = `
  @keyframes reaperFloat {
    0%, 100% { transform: translateY(0px) scale(1); }
    50% { transform: translateY(-15px) scale(1.02); }
  }

  @keyframes scytheShine {
    0% { stroke-opacity: 0.5; filter: brightness(1); }
    50% { stroke-opacity: 1; filter: brightness(1.5) drop-shadow(0 0 10px #fff); }
    100% { stroke-opacity: 0.5; filter: brightness(1); }
  }

  @keyframes soulMist {
    0% { opacity: 0; transform: translateY(20px) scale(0.8); }
    50% { opacity: 0.5; }
    100% { opacity: 0; transform: translateY(-50px) scale(1.5); }
  }

  @keyframes eyeGlowPulse {
    0%, 100% { opacity: 0.7; filter: drop-shadow(0 0 5px #a855f7); }
    50% { opacity: 1; filter: drop-shadow(0 0 20px #d8b4fe); }
  }
`;

// --- GRIM REAPER LOGO (SVG) ---
const ReaperLogo = ({ size = 300 }: { size?: number }) => (
    <svg width={size} height={size} viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_20px_50px_rgba(0,0,0,1)]">
        <defs>
            <linearGradient id="cloakDark" x1="256" y1="50" x2="256" y2="450" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#1e1b4b" /> {/* Dark Indigo */}
                <stop offset="0.6" stopColor="#020617" /> {/* Black */}
                <stop offset="1" stopColor="#000000" />
            </linearGradient>
            <linearGradient id="scytheBlade" x1="350" y1="50" x2="450" y2="200" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#e2e8f0" /> {/* Slate 200 */}
                <stop offset="0.5" stopColor="#64748b" /> {/* Slate 500 */}
                <stop offset="1" stopColor="#1e293b" /> {/* Slate 800 */}
            </linearGradient>
            <linearGradient id="purpleMist" x1="0" y1="0" x2="512" y2="512" gradientUnits="userSpaceOnUse">
                <stop offset="0" stopColor="#a855f7" stopOpacity="0.8"/>
                <stop offset="1" stopColor="#581c87" stopOpacity="0"/>
            </linearGradient>
            <filter id="bladeGlow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" result="blur"/>
                <feComposite in="SourceGraphic" in2="blur" operator="over"/>
            </filter>
        </defs>

        <g className="animate-[reaperFloat_4s_ease-in-out_infinite]">
            
            {/* --- SCYTHE (LƯỠI HÁI) --- */}
            {/* Handle */}
            <path d="M400 450 L150 150" stroke="#713f12" strokeWidth="12" strokeLinecap="round" />
            
            {/* Blade (Behind hood slightly) */}
            <path d="M150 150 C100 80 50 150 40 250 C30 200 60 80 160 60 C200 50 250 100 150 150 Z" 
                  fill="url(#scytheBlade)" 
                  stroke="#94a3b8" 
                  strokeWidth="2"
                  filter="url(#bladeGlow)"
                  className="animate-[scytheShine_3s_infinite]"
            />

            {/* --- CLOAK / HOOD (ÁO CHOÀNG) --- */}
            {/* Back Hood */}
            <path d="M180 150 C120 150 100 250 80 350 L120 450 L392 450 L432 350 C412 250 392 150 332 150 Z" fill="#0f172a" />
            
            {/* Main Hood Shape */}
            <path d="M256 50 C150 50 120 200 120 300 L150 480 H362 L392 300 C392 200 362 50 256 50 Z" fill="url(#cloakDark)" stroke="#000" strokeWidth="5"/>
            
            {/* Hood Opening (The Void) */}
            <path d="M256 120 C200 120 180 220 180 320 C180 380 220 420 256 420 C292 420 332 380 332 320 C332 220 312 120 256 120 Z" fill="#000" />

            {/* --- FACE (SKULL & EYES) --- */}
            {/* Shadow covering top of face */}
            <path d="M180 300 Q256 350 332 300 Q332 200 256 120 Q180 200 180 300" fill="#000"/>

            {/* Glowing Eyes */}
            <g className="animate-[eyeGlowPulse_3s_infinite]">
                <path d="M210 260 L240 270 L210 280 Z" fill="#d8b4fe" filter="url(#bladeGlow)" />
                <path d="M302 260 L272 270 L302 280 Z" fill="#d8b4fe" filter="url(#bladeGlow)" />
                {/* Small pupil */}
                <circle cx="220" cy="270" r="2" fill="#fff" />
                <circle cx="292" cy="270" r="2" fill="#fff" />
            </g>

            {/* Nose socket */}
            <path d="M246 310 L256 295 L266 310 L256 325 Z" fill="#1e1b4b" opacity="0.8"/>

            {/* Skeleton Hands holding Scythe */}
            <path d="M140 160 C130 180 160 200 170 180" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <path d="M130 165 C120 185 150 205 160 185" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />
            <path d="M120 170 C110 190 140 210 150 190" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" />

            {/* --- MIST / SOULS --- */}
            <path d="M150 400 Q200 350 256 400 Q312 450 362 400" stroke="url(#purpleMist)" strokeWidth="10" filter="blur(10px)" opacity="0.5" className="animate-pulse"/>

        </g>
    </svg>
)

export const PublisherIntro: React.FC<PublisherIntroProps> = ({ onComplete }) => {
    const [animationState, setAnimationState] = useState<'initial' | 'reveal' | 'fadeout'>('initial');

    useEffect(() => {
        // 1. Initial delay
        const timer1 = setTimeout(() => {
            setAnimationState('reveal');
            soundManager.playLogoIntro(); 
        }, 500);

        // 2. Hold, then fade out
        const timer2 = setTimeout(() => {
            setAnimationState('fadeout');
        }, 4500);

        // 3. Complete
        const timer3 = setTimeout(() => {
            onComplete();
        }, 5500);

        return () => { clearTimeout(timer1); clearTimeout(timer2); clearTimeout(timer3); };
    }, [onComplete]);

    return (
        <div className={`fixed inset-0 z-[9999] bg-[#020617] flex items-center justify-center transition-all duration-1000 ${animationState === 'fadeout' ? 'opacity-0 scale-110' : 'opacity-100 scale-100'}`}>
            <style>{introStyles}</style>

            {animationState !== 'initial' && (
                <div className="relative flex flex-col items-center w-full h-full justify-center overflow-hidden">
                    
                    {/* --- BACKGROUND EFFECTS --- */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-[#020617] to-black"></div>
                    
                    {/* Soul Mist Particles */}
                    <div className="absolute bottom-10 left-1/3 w-10 h-10 bg-purple-500/20 blur-[20px] rounded-full animate-[soulMist_4s_infinite]"></div>
                    <div className="absolute bottom-20 right-1/3 w-16 h-16 bg-blue-500/20 blur-[30px] rounded-full animate-[soulMist_5s_infinite_1s]"></div>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-900/10 blur-[80px] rounded-full animate-pulse"></div>

                    {/* --- MAIN CONTENT --- */}
                    <div className="relative z-10 flex flex-col items-center animate-in zoom-in duration-1000 fade-in slide-in-from-bottom-10">
                         
                         {/* REAPER LOGO */}
                         <div className="mb-[-30px] relative z-20 hover:scale-105 transition-transform duration-500 cursor-default">
                             <ReaperLogo size={340} />
                         </div>

                        {/* STUDIO NAME */}
                        <div className="text-center relative z-30 pt-10">
                            <h1 
                                className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-gray-200 via-gray-400 to-slate-600 tracking-tighter drop-shadow-[0_4px_0_rgba(0,0,0,1)]" 
                                style={{ 
                                    fontFamily: 'Impact, sans-serif', 
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em'
                                }}
                            >
                                QUANG HỔ
                            </h1>
                            
                            {/* Subtitle */}
                            <div className="flex items-center justify-center gap-3 mt-4 opacity-0 animate-[fade-in_1s_ease-out_0.5s_forwards]">
                                 <div className="h-[1px] w-12 bg-gradient-to-l from-purple-600 to-transparent"></div>
                                 <p className="text-sm md:text-base font-bold text-purple-400 tracking-[0.5em] uppercase drop-shadow-[0_0_5px_rgba(168,85,247,0.5)]">
                                    ENTERTAINMENT
                                 </p>
                                 <div className="h-[1px] w-12 bg-gradient-to-r from-purple-600 to-transparent"></div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Info */}
                    <div className="absolute bottom-8 flex flex-col items-center gap-1 opacity-40">
                         <span className="text-[10px] text-stone-500 font-mono tracking-widest uppercase">Est. 2025 • Vietnam</span>
                    </div>

                </div>
            )}
        </div>
    );
};
