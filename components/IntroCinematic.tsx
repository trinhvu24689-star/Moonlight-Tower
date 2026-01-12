
import React, { useState, useEffect } from 'react';
import { Skull, Ghost, Flame, ArrowRight, SkipForward } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface IntroCinematicProps {
  onComplete: () => void;
}

export const IntroCinematic: React.FC<IntroCinematicProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [fade, setFade] = useState(true);

  const scenes = [
    {
      text: "Vào một đêm trăng máu...",
      subText: "Tại ngã tư bị lãng quên...",
      voice: "Vào một đêm trăng máu. Tại ngã tư bị lãng quên.",
      icon: <div className="w-4 h-4 rounded-full bg-red-600 shadow-[0_0_50px_red] animate-pulse"></div>,
      bg: "bg-black"
    },
    {
      text: "Lời nguyền trỗi dậy.",
      subText: "Những linh hồn đói khát thức giấc.",
      voice: "Lời nguyền trỗi dậy. Những linh hồn đói khát thức giấc.",
      icon: <Ghost size={80} className="text-white/50 animate-bounce" />,
      bg: "bg-purple-950"
    },
    {
      text: "Họ không cần linh hồn bạn...",
      subText: "HỌ CẦN THỊT NƯỚNG!",
      voice: "Họ không cần linh hồn bạn. Họ cần thịt nướng!",
      icon: <Flame size={80} className="text-orange-500 animate-[pulse_0.2s_infinite]" />,
      bg: "bg-orange-950"
    },
    {
      text: "Bạn là Đầu Bếp Địa Ngục.",
      subText: "Nướng thịt. Kiếm vàng. Sống sót.",
      voice: "Bạn là Đầu Bếp Địa Ngục. Hãy nướng thịt, kiếm vàng, và sống sót.",
      icon: <Skull size={80} className="text-stone-300" />,
      bg: "bg-stone-900"
    }
  ];

  useEffect(() => {
    // Play dark ambient sound on mount
    soundManager.playBGM();
    
    if (step < scenes.length) {
      // Trigger Voice
      const currentScene = scenes[step];
      soundManager.speak(currentScene.voice, 'narrator');

      // Fade in
      setFade(true);
      
      const timer = setTimeout(() => {
        // Prepare Fade out
        if (step < scenes.length - 1) {
            setFade(false);
            setTimeout(() => {
                setStep(s => s + 1);
            }, 500); // Wait for fade out transition
        } else {
             // Last slide waits a bit longer then shows button
        }
      }, 4000); // Slide duration slightly longer for voice

      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleFinish = () => {
    soundManager.playCoin();
    // Stop voice if user skips
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    onComplete();
  };

  return (
    <div className={`fixed inset-0 z-[200] flex flex-col items-center justify-center text-center font-['Mali'] overflow-hidden transition-colors duration-1000 ${scenes[step]?.bg || 'bg-black'}`}>
      
      {/* Cinematic Content */}
      <div className={`transition-opacity duration-1000 ease-in-out px-4 flex flex-col items-center gap-6 ${fade ? 'opacity-100' : 'opacity-0'}`}>
         
         <div className="scale-150 mb-8 transition-transform duration-[4000ms] ease-linear transform hover:scale-110">
             {scenes[step]?.icon}
         </div>

         <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-400 drop-shadow-md">
            {scenes[step]?.text}
         </h1>
         
         <p className="text-xl md:text-2xl text-red-400 font-bold italic tracking-widest mt-2 animate-pulse">
            {scenes[step]?.subText}
         </p>

      </div>

      {/* Controls */}
      <div className="absolute bottom-10 flex flex-col items-center gap-4 w-full px-6">
         {step === scenes.length - 1 && fade && (
             <button 
                onClick={handleFinish}
                className="bg-red-600 hover:bg-red-500 text-white px-8 py-4 rounded-full font-black text-xl flex items-center gap-3 animate-bounce shadow-[0_0_20px_rgba(220,38,38,0.5)] border-4 border-red-800"
             >
                BẮT ĐẦU KINH DOANH <ArrowRight size={24} />
             </button>
         )}

         {step < scenes.length - 1 && (
             <button 
               onClick={handleFinish}
               className="text-stone-500 hover:text-white flex items-center gap-2 text-sm font-bold opacity-50 hover:opacity-100 transition-opacity"
             >
               <SkipForward size={16} /> Bỏ qua giới thiệu
             </button>
         )}
      </div>

      {/* Film Grain Effect Overlay */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.05] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>
      <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_100px_rgba(0,0,0,0.9)]"></div>
    </div>
  );
};
