import React from 'react';
import { Season } from '../types';
import { GAME_WIDTH, GAME_HEIGHT, WALL_X } from '../constants';

export const GameMap: React.FC<{ season: Season }> = ({ season }) => {
  // Chọn màu nền theo mùa cho đẹp
  const getColors = () => {
    switch (season) {
      case 'spring': return { village: '#86efac', forest: '#14532d' }; // Xuân: Làng xanh nhạt, Rừng xanh thẫm
      case 'summer': return { village: '#fde047', forest: '#1e293b' }; // Hè: Làng vàng nắng, Rừng tối om
      case 'autumn': return { village: '#fdba74', forest: '#451a03' }; // Thu: Làng cam, Rừng nâu đất
      case 'winter': return { village: '#e2e8f0', forest: '#334155' }; // Đông: Làng tuyết, Rừng xám lạnh
      default: return { village: '#86efac', forest: '#14532d' };
    }
  };

  const colors = getColors();

  return (
    <div className="absolute inset-0 overflow-hidden" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
      
      {/* 1. KHU VỰC LÀNG (Bên Trái - An Toàn) */}
      <div className="absolute left-0 top-0 h-full transition-colors duration-1000" 
           style={{ width: WALL_X, backgroundColor: colors.village }}>
          {/* Họa tiết gạch lát sàn mờ mờ */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'linear-gradient(#000 1px, transparent 1px), linear-gradient(90deg, #000 1px, transparent 1px)', backgroundSize: '50px 50px' }}>
          </div>
          {/* Đường đi của khách hàng (Mua thịt) */}
          <div className="absolute top-[220px] left-0 w-full h-[80px] bg-stone-700/20 border-y-2 border-stone-800/30" />
      </div>

      {/* 2. KHU VỰC RỪNG (Bên Phải - Nguy Hiểm) */}
      <div className="absolute right-0 top-0 h-full transition-colors duration-1000" 
           style={{ left: WALL_X, width: GAME_WIDTH - WALL_X, backgroundColor: colors.forest }}>
          {/* Họa tiết cỏ cây rậm rạp */}
          <div className="absolute inset-0 opacity-30" 
               style={{ backgroundImage: 'radial-gradient(#000 2px, transparent 2px)', backgroundSize: '20px 20px' }}>
          </div>
          {/* Vùng tối bí ẩn nơi quái sinh ra */}
          <div className="absolute right-0 top-0 h-full w-20 bg-gradient-to-l from-black/80 to-transparent" />
      </div>

      {/* 3. RANH GIỚI (Chỗ đặt tường thành) */}
      <div className="absolute top-0 h-full w-4 bg-black/30 blur-sm z-0" style={{ left: WALL_X - 2 }}></div>

    </div>
  );
};