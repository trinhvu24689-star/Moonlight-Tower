import React, { useState, useEffect } from 'react';
import SpriteCharacter from './SpriteCharacter'; // Dùng lại cái component hồi nãy

const HeroUnit = () => {
  // Định nghĩa bản đồ hành động (Dòng nào làm việc gì)
  const ACTIONS = {
  IDLE: 0,    // Hàng 0: Hiệp sĩ đứng/đi
  RUN: 0,     // (Tạm dùng hàng 0 cho chạy luôn)
  ATTACK: 1,  // Hàng 1: Hiệp sĩ chém
  ULTI: 1,    // (Tạm dùng hàng 1 chém liên tục làm Ulti)
};

  const [currentAction, setCurrentAction] = useState(ACTIONS.IDLE);
  const [isActing, setIsActing] = useState(false); // Đang tung chiêu hay không?

  // Hàm kích hoạt Ulti
  const castUltimate = () => {
    if (isActing) return; // Đang đánh thì không spam nút được
    
    setIsActing(true);
    setCurrentAction(ACTIONS.ULTI); // Chuyển sang dòng Ulti

    // Sau 1 giây (hoặc hết animation) thì quay về đứng yên
    setTimeout(() => {
      setCurrentAction(ACTIONS.IDLE);
      setIsActing(false);
    }, 1000); 
  };

  return (
    <div className="flex flex-col items-center gap-4">
      
      {/* Nhân vật hiển thị */}
      <div className="relative border-2 border-yellow-500 rounded-full p-4 bg-gray-900">
        <SpriteCharacter 
          imageSrc="/knight.png"  // <-- Đã đổi tên đúng file
          row={currentAction} // Dòng thay đổi theo biến state
          totalFrames={6}     // Số khung hình (tuỳ ảnh)
          speed={isActing ? 80 : 150} // Tung chiêu thì tua nhanh hơn
          scale={2} 
        />
        
        {/* Hiệu ứng hào quang khi Ulti */}
        {currentAction === ACTIONS.ULTI && (
          <div className="absolute inset-0 bg-red-500 opacity-30 animate-ping rounded-full"></div>
        )}
      </div>

      {/* Nút bấm test skill */}
      <div className="flex gap-2">
        <button 
          onClick={() => setCurrentAction(ACTIONS.ATTACK)}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 active:scale-95 transition"
        >
         ⚔️ Đánh thường
        </button>

        <button 
          onClick={castUltimate}
          className="px-4 py-2 bg-red-600 text-white font-bold rounded shadow-lg shadow-red-500/50 hover:bg-red-500 active:scale-95 transition"
        >
          🔥 ULTIMATE!
        </button>
      </div>

    </div>
  );
};

export default HeroUnit;