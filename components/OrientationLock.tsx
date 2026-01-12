
import React, { useEffect, useState } from 'react';
import { Smartphone, RefreshCw } from 'lucide-react';

export const OrientationLock: React.FC = () => {
  const [isPortrait, setIsPortrait] = useState(false);

  useEffect(() => {
    const checkOrientation = () => {
      // Logic: Nếu là thiết bị di động (chiều rộng < 1024) VÀ chiều cao > chiều rộng
      // PC thường có chiều rộng lớn, nên sẽ không bị ảnh hưởng
      const isMobile = window.innerWidth <= 1024 && ('ontouchstart' in window || navigator.maxTouchPoints > 0);
      const isVert = window.innerHeight > window.innerWidth;

      if (isMobile && isVert) {
        setIsPortrait(true);
      } else {
        setIsPortrait(false);
      }
    };

    // Check ngay lập tức
    checkOrientation();

    // Lắng nghe sự kiện xoay và resize
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);

  if (!isPortrait) return null;

  return (
    <div className="fixed inset-0 z-[99999] bg-[#0f111a] flex flex-col items-center justify-center text-white p-4 text-center">
      <div className="relative mb-8 animate-[spin_3s_linear_infinite]">
         <div className="absolute inset-0 bg-blue-500/20 blur-xl rounded-full"></div>
         <RefreshCw size={80} className="text-blue-500 relative z-10" />
      </div>
      
      <div className="animate-bounce mb-6">
        <Smartphone size={100} className="text-white rotate-90" />
      </div>

      <h2 className="text-2xl font-black font-['Mali'] text-yellow-400 mb-2">VUI LÒNG XOAY NGANG</h2>
      <p className="text-stone-400 max-w-xs">
        Game được tối ưu hóa cho màn hình ngang để có trải nghiệm tốt nhất.
      </p>
    </div>
  );
};
