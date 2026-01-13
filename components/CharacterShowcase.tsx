import React from 'react';
import HeroUnit from './HeroUnit';       // Import "con cưng" Hiệp Sĩ
import SpriteCharacter from './SpriteCharacter'; // Import khung hiển thị cho các con khác

// Đổi tên từ GameMap thành CharacterShowcase cho đỡ nhầm
const CharacterShowcase = () => {
  return (
    <div className="relative w-full h-screen bg-stone-900 flex flex-wrap gap-20 p-20 justify-center items-center overflow-hidden">
      
      {/* --- KHU VỰC NGƯỜI CHƠI --- */}
      <div className="flex flex-col items-center">
        <p className="text-yellow-400 font-bold mb-4 uppercase tracking-widest">Player 1</p>
        {/* Chỉ cần gọi 1 dòng này là Hiệp sĩ hiện ra và múa được luôn! */}
        <HeroUnit /> 
      </div>


      {/* --- KHU VỰC ĐỒNG ĐỘI (Pháp Sư) --- */}
      <div className="flex flex-col items-center opacity-90 hover:opacity-100 transition">
        <p className="text-cyan-400 font-bold mb-4">Ice Sorceress</p>
        <SpriteCharacter 
          imageSrc="/sorceress.png"  // Đã đổi tên file
          row={0}                    // Hàng 0: Đứng yên (Idle)
          totalFrames={4}            // Ảnh này thường có 4 khung hình ngang
          speed={200}                // Tốc độ nhún nhảy
          scale={2}                  // Phóng to lên
        />
      </div>


      {/* --- KHU VỰC QUÁI VẬT (Kẻ thù) --- */}
      <div className="flex flex-col items-center">
        <p className="text-red-500 font-bold mb-4">Skeleton Army</p>
        
        {/* Con Xương 1 */}
        <div className="mb-4">
          <SpriteCharacter 
            imageSrc="/dungeon.png"  // Ảnh chứa quái
            row={2}                  // Hàng 2 (Ví dụ: Bộ xương cầm kiếm)
            totalFrames={4}
            speed={150}
            scale={2}
          />
        </div>
      </div>

    </div>
  );
};

export default CharacterShowcase;