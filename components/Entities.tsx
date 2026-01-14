import React, { useEffect } from 'react';
import { Customer, Enemy, Projectile, TowerType, Civilian } from '../types';
import { Axe, ChefHat, User, Magnet } from 'lucide-react';

// --- HÀM LẤY ẢNH ---
const getSpriteUrl = (id: number) => `/Class_Monster_${id}.png`;

// --- CẤU HÌNH ID ẢNH ---
const SPRITE_IDS = {
  HERO_ICE: 100, HERO_ARCHER: 107, HERO_FIRE: 105, HERO_CANNON: 112,
  ENEMY_PUMPKIN: 119, ENEMY_SKELETON: 125, ENEMY_BAT: 131, ENEMY_BOSS: 60,
  CIVILIAN: 1, WOLF_MAN: 135, MEAT_MAN: 136, GOLD: 51, MEAT: 137,
};

// --- HỆ THỐNG ÂM THANH (GIỌNG NÓI) ---
const speak = (text: string, pitch = 1, rate = 1) => {
    // Chỉ nói với tỷ lệ 30% để đỡ ồn, trừ khi là Boss (luôn nói)
    if (Math.random() > 0.3 && !text.includes("BOSS")) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN'; // Giọng Việt
    utterance.pitch = pitch;  // Độ cao (0-2)
    utterance.rate = rate;    // Tốc độ (0.1-10)
    window.speechSynthesis.speak(utterance);
};

// --- CSS ANIMATION (COMPONENT STYLE) ---
export const EntitiesStyle = () => (
  <style>{`
    @keyframes walk {
      0%, 100% { transform: rotate(-5deg) translateY(0); }
      50% { transform: rotate(5deg) translateY(-3px); }
    }
    @keyframes fly {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }
    @keyframes attack {
      0% { transform: scale(1); }
      50% { transform: scale(1.3) rotate(10deg); }
      100% { transform: scale(1); }
    }
    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      25% { transform: translateX(-2px); }
      75% { transform: translateX(2px); }
    }
    .anim-walk { animation: walk 0.8s infinite ease-in-out; }
    .anim-fly { animation: fly 1.5s infinite ease-in-out; }
    .anim-attack { animation: attack 0.5s infinite; }
    .anim-shake { animation: shake 0.2s infinite; }
  `}</style>
);

interface EntityProps {
  x: number; y: number; children?: React.ReactNode;
  className?: string; flip?: boolean; scale?: number;
  animType?: 'walk' | 'fly' | 'attack' | 'shake' | 'none';
}

// --- KHUNG HIỂN THỊ CƠ BẢN ---
const BaseEntity: React.FC<EntityProps> = ({ x, y, children, className, flip, scale = 1, animType = 'none' }) => (
  <div 
    className={`absolute flex flex-col items-center justify-end pointer-events-none transition-all duration-200 ${className}`}
    style={{ 
      left: 0, top: 0,
      transform: `translate(${x}px, ${y}px) scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
      zIndex: Math.floor(y) 
    }}
  >
    <div className={`anim-${animType}`}>
        {children}
    </div>
    <div className="absolute bottom-1 w-8 h-2 bg-black/30 rounded-full blur-[2px] -z-10" />
  </div>
);

const SpriteImage: React.FC<{ id: number; className?: string }> = ({ id, className }) => (
  <img 
    src={getSpriteUrl(id)} 
    alt={`Sprite ${id}`} 
    className={`object-contain drop-shadow-md rendering-pixelated ${className}`}
    onError={(e) => { (e.target as HTMLImageElement).src = '/Class_Monster_1.png'; }}
  />
);

// --- CÁC ENTITY ---

// 1. TƯỚNG (HERO)
export const HeroEntity: React.FC<{ x: number, y: number }> = ({ x, y }) => {
  return (
    <BaseEntity x={x} y={y} className="-ml-8 -mt-[80px]" scale={1.2} animType="walk">
       <SpriteImage id={SPRITE_IDS.HERO_ICE} className="w-16 h-16" />
    </BaseEntity>
  );
};

// 2. KHÁCH HÀNG (CUSTOMER)
export const CustomerEntity: React.FC<{ customer: Customer }> = ({ customer }) => {
  const isWaiting = customer.state === 'waiting';
  const spriteId = customer.skin === 'wolf' ? SPRITE_IDS.WOLF_MAN : SPRITE_IDS.CIVILIAN;

  useEffect(() => {
    if (customer.state === 'eating') speak("Ngon quá!", 1.2, 1.2);
    if (customer.state === 'leaving') speak("Cảm ơn nha!", 1, 1.5);
  }, [customer.state]);

  return (
    <BaseEntity x={customer.position.x} y={customer.position.y} className="-ml-6 -mt-[70px]" animType={isWaiting ? 'shake' : 'walk'}>
       {isWaiting && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-pulse z-50">
           <div className="bg-white border-2 border-black rounded-lg px-2 py-1 flex items-center shadow-md gap-1">
              <span className="text-xs font-black text-black">🍖 x{customer.requestAmount}</span>
           </div>
        </div>
      )}
      <SpriteImage id={spriteId} className="w-14 h-14" />
    </BaseEntity>
  );
};

// 3. DÂN THƯỜNG
export const CivilianEntity: React.FC<{ civilian: Civilian }> = ({ civilian }) => {
    return (
        <BaseEntity x={civilian.position.x} y={civilian.position.y} className="-ml-6 -mt-[70px]" animType="walk">
            {civilian.state === 'buying_wood' && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-amber-200 border border-amber-800 px-2 rounded text-[10px] font-bold">
                    Gỗ đê!
                </div>
            )}
            <SpriteImage id={SPRITE_IDS.CIVILIAN} className="w-12 h-12 opacity-90" />
        </BaseEntity>
    );
};

// 4. KẺ THÙ (ENEMY)
export const EnemyEntity: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;
  
  let spriteId = SPRITE_IDS.ENEMY_PUMPKIN;
  let anim: 'walk' | 'fly' = 'walk';
  let scale = 1;

  if (enemy.type === 'skeleton') spriteId = SPRITE_IDS.ENEMY_SKELETON;
  else if (enemy.type === 'bat') { spriteId = SPRITE_IDS.ENEMY_BAT; anim = 'fly'; }
  else if (enemy.type === 'boss') { spriteId = SPRITE_IDS.ENEMY_BOSS; scale = 2; }

  useEffect(() => {
    if (enemy.isBoss) speak("Ta là trùm cuối đây!", 0.5, 0.8); 
  }, []); 

  return (
    <BaseEntity x={enemy.position.x} y={enemy.position.y} className={`-ml-8 ${enemy.type === 'boss' ? '-mt-[120px]' : '-mt-[80px]'}`} scale={scale} animType={anim}>
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-900 rounded border border-black overflow-hidden z-50">
        <div className={`h-full transition-all duration-200 ${enemy.isBoss ? 'bg-purple-600' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }}></div>
      </div>

      <SpriteImage id={spriteId} className="w-16 h-16" />
      
      {enemy.isBoss && <div className="absolute -top-8 text-[10px] font-black text-red-500 bg-black/80 px-1 rounded border border-red-500 animate-pulse">BOSS</div>}
    </BaseEntity>
  );
};

// 5. THÁP CANH (TOWER)
export const TowerVisual: React.FC<{ type: TowerType }> = ({ type }) => {
    let heroId = SPRITE_IDS.HERO_ICE;
    if (type === 'archer') heroId = SPRITE_IDS.HERO_ARCHER;
    else if (type === 'fire') heroId = SPRITE_IDS.HERO_FIRE;
    else if (type === 'cannon') heroId = SPRITE_IDS.HERO_CANNON;

    return (
        <div className="relative flex flex-col items-center">
            <div className="absolute bottom-0 opacity-80">
                <img src="/Class_Item_1.png" className="w-12 h-8 object-cover grayscale brightness-50" />
            </div>
            <div className="absolute bottom-2 anim-walk">
                 <SpriteImage id={heroId} className="w-14 h-14" />
            </div>
            {type === 'ice' && <div className="absolute bottom-4 w-12 h-12 bg-blue-400/20 blur-xl rounded-full animate-pulse"></div>}
            {type === 'fire' && <div className="absolute bottom-4 w-12 h-12 bg-orange-400/20 blur-xl rounded-full animate-pulse"></div>}
        </div>
    );
}

// 6. ĐẠN (PROJECTILE)
export const ProjectileEntity: React.FC<{ projectile: Projectile }> = ({ projectile }) => (
  <BaseEntity x={projectile.position.x} y={projectile.position.y} className="w-8 h-8 -mt-4 -ml-4 z-50">
    <div className={`w-4 h-4 rounded-full shadow-lg animate-spin ${projectile.effect === 'slow' ? 'bg-blue-400 shadow-blue-500' : 'bg-orange-500 shadow-red-500'}`} />
  </BaseEntity>
);

// 7. NHÂN VIÊN (STAFF)
export const LumberjackEntity: React.FC<{ x: number, y: number, state: string }> = ({ x, y, state }) => (
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px]" flip={state === 'walking_to_tree' || state === 'chopping'} animType={state==='chopping'?'attack':'walk'}>
        <div className="flex flex-col items-center">
            <div className="relative">
                 <User size={40} className="text-amber-700 fill-amber-900" />
                 <Axe size={24} className={`absolute -right-2 top-0 text-stone-300 fill-stone-500 ${state==='chopping' ? 'rotate-45' : ''}`} />
            </div>
            {state === 'chopping' && <div className="text-[10px] bg-white text-black px-1 rounded font-bold">CHẶT!</div>}
        </div>
    </BaseEntity>
);

export const ChefEntity: React.FC<{ x: number, y: number, level: number }> = ({ x, y, level }) => (
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px] z-50" animType="walk">
         <div className="flex flex-col items-center">
             <div className="relative">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white"><ChefHat size={20} /></div>
                 <User size={40} className="text-white fill-stone-800" />
             </div>
             <span className="text-[9px] bg-black/50 text-white px-1 rounded">Lv.{level}</span>
         </div>
    </BaseEntity>
);

export const ServerEntity: React.FC<{ x: number, y: number, level: number }> = ({ x, y, level }) => (
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px] z-50" animType="walk">
         <div className="flex flex-col items-center">
             <User size={36} className="text-blue-400 fill-blue-900" />
             <span className="text-[9px] bg-blue-900 text-white px-1 rounded">Bàn {level}</span>
         </div>
    </BaseEntity>
);

export const CollectorEntity: React.FC<{ x: number, y: number, level: number }> = ({ x, y, level }) => (
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px] z-50">
         <div className="flex flex-col items-center animate-[spin_3s_linear]">
             <Magnet size={32} className="text-yellow-400 fill-yellow-600" />
             <span className="text-[9px] bg-yellow-900 text-yellow-200 px-1 rounded">Hút Vàng</span>
         </div>
    </BaseEntity>
);

export const TreeEntity: React.FC<{ x: number, y: number, hp: number }> = ({ x, y, hp }) => (
    <BaseEntity x={x} y={y} className="-ml-12 -mt-[120px]" animType="shake">
        <div className={`flex flex-col items-center ${hp < 50 ? 'opacity-50' : ''}`}>
             <SpriteImage id={60} className="w-24 h-24" />
        </div>
    </BaseEntity>
);

// --- 8. TƯỜNG THÀNH (WALL) - QUAN TRỌNG ĐỂ FIX LỖI ---
export const WallEntity: React.FC<{ x: number, y: number, hp: number, maxHp: number }> = ({ x, y, hp, maxHp }) => {
    const damageLevel = hp / maxHp; 
    let filter = ""; 
    
    // Tường nứt dần khi mất máu
    if (damageLevel < 0.7) filter = "sepia(0.5)"; 
    if (damageLevel < 0.4) filter = "sepia(1) hue-rotate(-30deg)"; 
    if (hp <= 0) return null; // Vỡ rồi thì biến mất

    return (
        <BaseEntity x={x} y={y} className="-ml-8 -mt-[60px]" scale={1.6}>
            {/* Thanh máu tường */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-14 h-1.5 bg-black rounded border border-white/50">
                 <div className="h-full bg-blue-500 transition-all" style={{ width: `${damageLevel * 100}%` }}></div>
            </div>

            {/* Dùng ảnh Rương (Item 12) xếp chồng lên làm tường đá */}
            <div className="relative flex flex-col items-center">
                 <img src="/Class_Item_12.png" className="w-16 h-12 object-cover rounded-sm border border-black/30" style={{ filter }} />
                 <img src="/Class_Item_12.png" className="w-16 h-12 object-cover -mt-8 rounded-sm border border-black/30" style={{ filter }} />
            </div>
        </BaseEntity>
    );
};

// Các biến export giả để tương thích code cũ (nếu có)
export const SPRITE_SHEET_SRC = ''; 
export const SPRITE_SCALE = 1; 
export const SPRITES = {}; 
export { SpriteRenderer }; 
const SpriteRenderer = () => null;