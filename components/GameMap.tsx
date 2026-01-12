
import React from 'react';
import { COUNTER_POS, GRILL_POS, TOWER_SLOTS, WOOD_STORAGE_POS, LUMBERJACK_HUT } from '../constants';
import { Trees, Warehouse, Tent } from 'lucide-react';
import { Season } from '../types';

interface GameMapProps {
    season: Season;
}

export const GameMap: React.FC<GameMapProps> = ({ season }) => {
  // Season Overlays
  const getSeasonOverlay = () => {
      switch(season) {
          case 'spring': return 'bg-pink-500/10'; // Nhẹ nhàng
          case 'summer': return 'bg-yellow-500/10'; // Nắng
          case 'autumn': return 'bg-orange-700/20 sepia-[.3]'; // Thu vàng
          case 'winter': return 'bg-blue-300/20 contrast-125'; // Lạnh
          default: return '';
      }
  };

  const getTreeColor = () => {
      switch(season) {
          case 'spring': return 'text-pink-400';
          case 'summer': return 'text-green-800';
          case 'autumn': return 'text-orange-600';
          case 'winter': return 'text-slate-200';
          default: return 'text-green-800';
      }
  }

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#2d3748]">
      {/* --- TERRAIN --- */}
      <div className="absolute inset-0 opacity-80" 
           style={{ 
             backgroundImage: 'repeating-linear-gradient(45deg, #252f3f 0, #252f3f 10px, #1f2937 10px, #1f2937 20px)' 
           }}>
      </div>
      
      {/* --- FOREST AREA (Top Left) --- */}
      <div className={`absolute top-0 left-0 w-[300px] h-[300px] rounded-br-[100px] border-b-4 border-r-4 transition-colors duration-1000 ${season === 'winter' ? 'bg-slate-800 border-slate-600' : 'bg-green-900/20 border-green-900/50'}`}>
           {/* Trees are rendered as entities, but let's add some ground detail */}
           <div className="absolute top-10 left-10 opacity-30"><Trees size={100} className={getTreeColor()} /></div>
           <div className="absolute top-20 left-40 opacity-30"><Trees size={80} className={getTreeColor()} /></div>
      </div>

      {/* --- THE ROAD (Isometric path) --- */}
      <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
        <defs>
          <pattern id="stonePattern" patternUnits="userSpaceOnUse" width="40" height="40">
             <path d="M0 0 L40 0 L40 40 L0 40 Z" fill={season === 'winter' ? "#94a3b8" : "#57534e"} stroke="#44403c" strokeWidth="2" />
             <path d="M5 5 L20 5 L20 20 L5 20 Z" fill={season === 'winter' ? "#cbd5e1" : "#78716c"} opacity="0.5" />
          </pattern>
        </defs>
        <path d="M 900 160 Q 560 160 560 260 L 560 460 L 560 560 L 900 560" 
              fill="none" stroke="black" strokeOpacity="0.3" strokeWidth="150" strokeLinecap="round"
        />
        <path d="M 900 150 Q 550 150 550 250 L 550 450 L 550 550 L 900 550" 
              fill="none" stroke="url(#stonePattern)" strokeWidth="140" strokeLinecap="round"
        />
        <path d="M 900 80 Q 480 80 480 250 L 480 550" fill="none" stroke="#78350f" strokeWidth="5" strokeDasharray="10 20" />
      </svg>
      
      {/* --- STATION PLACEHOLDERS --- */}
      
      {/* GRILL TABLE VISUAL */}
      <div className="absolute" style={{ left: GRILL_POS.x - 70, top: GRILL_POS.y - 40 }}>
         <div className="w-36 h-16 bg-[#3f2e21] border-b-8 border-[#271c19] rounded-lg transform skew-x-12 shadow-2xl flex items-center justify-around px-2">
            <div className="w-8 h-8 rounded-full bg-black/30 border border-black/50"></div>
            <div className="w-8 h-8 rounded-full bg-black/30 border border-black/50"></div>
            <div className="w-8 h-8 rounded-full bg-black/30 border border-black/50"></div>
         </div>
      </div>

       {/* COUNTER TABLE VISUAL */}
       <div className="absolute" style={{ left: COUNTER_POS.x - 60, top: COUNTER_POS.y - 20 }}>
         <div className="w-28 h-12 bg-[#3f2e21] border-b-8 border-[#271c19] rounded-lg transform -skew-x-6 shadow-2xl flex items-center justify-center">
             <div className="w-20 h-8 bg-red-900/20 rounded"></div>
         </div>
      </div>

      {/* WOOD STORAGE */}
      <div className="absolute" style={{ left: WOOD_STORAGE_POS.x - 30, top: WOOD_STORAGE_POS.y - 30 }}>
           <div className="w-20 h-20 bg-amber-900 rounded border-4 border-amber-950 flex items-center justify-center shadow-2xl">
               <Warehouse className="text-amber-500" size={32} />
           </div>
           <div className="absolute -bottom-4 w-full text-center bg-black/50 text-amber-200 text-[10px] font-bold rounded">KHO GỖ</div>
      </div>

      {/* LUMBERJACK HUT */}
      <div className="absolute" style={{ left: LUMBERJACK_HUT.x, top: LUMBERJACK_HUT.y }}>
           <Tent className="text-green-800 fill-green-900" size={64} />
      </div>

      {/* TOWER PLATFORMS - MASSIVE AMOUNT */}
      {TOWER_SLOTS.map((slot, idx) => (
          <div key={idx} className="absolute" style={{ left: slot.x - 25, top: slot.y - 15 }}>
             <div className="w-12 h-12 bg-[#334155] rounded-full border-2 border-[#1e293b] transform scale-y-50 shadow-md opacity-60 flex items-center justify-center">
                <div className="w-8 h-8 rounded-full border border-dashed border-stone-500 opacity-30"></div>
             </div>
          </div>
      ))}

      {/* Fog/Weather Overlay */}
      <div className={`absolute inset-0 pointer-events-none transition-all duration-3000 ${getSeasonOverlay()}`}></div>
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none"></div>
    </div>
  );
};
