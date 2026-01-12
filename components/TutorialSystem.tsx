
import React, { useState, useEffect } from 'react';
import { Ghost, ArrowRight, CheckCircle } from 'lucide-react';
import { GRILL_POS, TOWER_SLOTS, COUNTER_POS, GARDEN_PLOTS_POS } from '../constants';
import { soundManager } from '../utils/audio';

interface TutorialSystemProps {
  onComplete: () => void;
}

export const TutorialSystem: React.FC<TutorialSystemProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);

  const steps = [
    {
      target: { x: 400, y: 300 }, // Center
      title: "Chào mừng đến Địa Ngục!",
      text: "Ta là Tiểu Quỷ, người hướng dẫn của ngươi. Hãy cùng ta học cách quản lý tiệm đồ nướng này nhé!",
      voice: "Ta là Tiểu Quỷ! Hãy cùng ta học cách quản lý tiệm đồ nướng này nhé!",
      action: "Tiếp tục"
    },
    {
      target: { x: GRILL_POS.x, y: GRILL_POS.y - 50 },
      title: "Lò Nướng Ma Quái",
      text: "Đây là nơi kiếm cơm! Lò nướng sẽ tự động nướng thịt. Nâng cấp nó để nướng nhanh hơn.",
      voice: "Đây là lò nướng ma quái! Nó sẽ tự động nướng thịt. Hãy nâng cấp để nướng nhanh hơn!",
      action: "Đã hiểu"
    },
    {
      target: { x: COUNTER_POS.x, y: COUNTER_POS.y },
      title: "Quầy Phục Vụ",
      text: "Khách hàng (Ocs, Sói...) sẽ đến đây mua thịt. Đừng để họ chờ lâu, họ sẽ bỏ đi đấy!",
      voice: "Khách hàng sẽ đến đây mua thịt. Đừng để họ chờ lâu nhé!",
      action: "Tiếp theo"
    },
    {
      target: { x: GARDEN_PLOTS_POS[0].x + 40, y: GARDEN_PLOTS_POS[0].y + 40 },
      title: "Vườn Ánh Trăng",
      text: "Hết thịt? Hãy bấm vào các ô đất này để trồng thêm thịt từ 'Hạt Giống'.",
      voice: "Nếu hết thịt, hãy trồng thêm ở Vườn Ánh Trăng.",
      action: "Tuyệt"
    },
    {
      target: { x: TOWER_SLOTS[0].x, y: TOWER_SLOTS[0].y - 100 },
      title: "Tháp Bảo Vệ",
      text: "Lũ bí ngô xấu xa sẽ tấn công lò nướng. Tháp này sẽ tự động bắn chúng. Nhớ nâng cấp nhé!",
      voice: "Cẩn thận lũ bí ngô! Hãy xây anh hùng để bảo vệ lò nướng.",
      action: "Sẵn sàng!"
    }
  ];

  const currentStep = steps[step];

  useEffect(() => {
      // Play guide voice whenever step changes
      soundManager.speak(currentStep.voice, 'guide');
  }, [step]);

  const handleNext = () => {
    soundManager.playCoin();
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onComplete();
    }
  };

  return (
    <div className="absolute inset-0 z-[300] pointer-events-auto">
      {/* Dark Overlay with Hole punch effect via clip-path is complex in CSS alone, 
          so we use a simpler semi-transparent overlay with a highlighted ring */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px]"></div>

      {/* Highlighter Ring */}
      <div 
        className="absolute w-24 h-24 border-4 border-yellow-400 rounded-full animate-ping opacity-75 shadow-[0_0_50px_yellow]"
        style={{ 
            left: currentStep.target.x, 
            top: currentStep.target.y,
            transform: 'translate(-50%, -50%)'
        }}
      ></div>
      <div 
        className="absolute w-20 h-20 border-2 border-white rounded-full animate-bounce shadow-lg"
        style={{ 
            left: currentStep.target.x, 
            top: currentStep.target.y,
            transform: 'translate(-50%, -50%)'
        }}
      ></div>

      {/* Character & Dialog Box - SMALLER & HIGHER */}
      <div 
        className="absolute w-60 bg-stone-900 border-2 border-stone-500 rounded-xl p-3 shadow-2xl flex flex-col gap-2 animate-in slide-in-from-bottom duration-300"
        style={{
            // Smart positioning: if target is in top half, show dialog higher up at top (10%), else at mid-bottom (50% instead of 70%)
            left: '50%',
            top: currentStep.target.y > 300 ? '15%' : '55%',
            transform: 'translate(-50%, 0)'
        }}
      >
          {/* Avatar - Smaller */}
          <div className="absolute -top-6 -left-4 bg-purple-700 w-12 h-12 rounded-full border-2 border-stone-800 flex items-center justify-center shadow-lg animate-[bounce_3s_infinite]">
             <Ghost size={24} className="text-white" />
          </div>

          <div className="pl-8">
              <h3 className="text-yellow-400 font-black text-sm font-['Mali']">{currentStep.title}</h3>
              <p className="text-stone-300 text-xs leading-tight font-medium">{currentStep.text}</p>
          </div>

          <div className="flex justify-end mt-1">
              <button 
                onClick={handleNext}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-1 px-4 rounded-full flex items-center gap-1 shadow-lg transition-transform active:scale-95 text-xs"
              >
                  {currentStep.action} <ArrowRight size={12} />
              </button>
          </div>
      </div>
    </div>
  );
};
