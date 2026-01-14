import React from 'react';
import { Customer, Enemy, Projectile, TowerType, EnemyType, Civilian } from '../types';
import { Axe, ChefHat, User, Magnet } from 'lucide-react';

// --- HÀM LẤY ẢNH TỪ KHO (QUAN TRỌNG NHẤT) ---
const getSpriteUrl = (id: number) => `/Class_Monster_${id}.png`;

// --- CẤU HÌNH ID ẢNH CHO TỪNG LOẠI ---
// (Vk có thể đổi số ở đây nếu thấy hình chưa ưng ý)
const SPRITE_IDS = {
  // HERO (Tướng)
  HERO_ICE: 100,    // Pháp sư băng
  HERO_ARCHER: 107, // Cung thủ (Vk thay số 21, 22 nếu muốn)
  HERO_FIRE: 105,   // Pháp sư lửa
  HERO_CANNON: 112, // Pháo thủ (Hiệp sĩ giáp sắt)

  // QUÁI VẬT (Dựa trên bảng Sprite Gallery của vk)
  ENEMY_PUMPKIN: 119, // Bí ngô (Số cũ là 2 -> 117, ck đoán tầm 119)
  ENEMY_SKELETON: 125, // Xương khô
  ENEMY_BAT: 131,      // Dơi
  ENEMY_BOSS: 60,      // Boss (Cây hoặc Golem to)

  // DÂN THƯỜNG & NPC
  CIVILIAN: 1,        // Dân thường
  WOLF_MAN: 135,      // Người sói
  MEAT_MAN: 136,      // Người thịt
  
  // ITEMS
  GOLD: 51,           // Đống vàng
  MEAT: 137,          // Miếng thịt
};

interface EntityProps {
  x: number;
  y: number;
  children?: React.ReactNode;
  className?: string;
  flip?: boolean;
  scale?: number;
}

// --- KHUNG HIỂN THỊ CƠ BẢN ---
const BaseEntity: React.FC<EntityProps> = ({ x, y, children, className, flip, scale = 1 }) => (
  <div 
    className={`absolute transition-transform duration-75 flex flex-col items-center justify-end pointer-events-none ${className}`}
    style={{ 
      left: 0, 
      top: 0,
      transform: `translate(${x}px, ${y}px) scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`,
      zIndex: Math.floor(y) 
    }}
  >
    {children}
    {/* Bóng đổ dưới chân cho thật */}
    <div className="absolute bottom-1 w-8 h-2 bg-black/30 rounded-full blur-[2px] -z-10" />
  </div>
);

// --- COMPONENT HIỂN THỊ ẢNH ---
const SpriteImage: React.FC<{ id: number; className?: string }> = ({ id, className }) => (
  <img 
    src={getSpriteUrl(id)} 
    alt={`Sprite ${id}`} 
    className={`object-contain drop-shadow-md rendering-pixelated ${className}`}
    onError={(e) => {
      // Nếu lỗi ảnh thì hiện hình mặc định (để không bị tàng hình)
      (e.target as HTMLImageElement).src = '/Class_Monster_1.png';
      (e.target as HTMLImageElement).style.filter = 'grayscale(100%)';
    }}
  />
);

// 1. TƯỚNG (HERO)
export const HeroEntity: React.FC<{ x: number, y: number }> = ({ x, y }) => {
  return (
    <BaseEntity x={x} y={y} className="-ml-8 -mt-[80px]" scale={1.2}>
       <div className="animate-bounce">
         <SpriteImage id={SPRITE_IDS.HERO_ICE} className="w-16 h-16" />
       </div>
    </BaseEntity>
  );
};

// 2. KHÁCH HÀNG (CUSTOMER)
export const CustomerEntity: React.FC<{ customer: Customer }> = ({ customer }) => {
  const isWaiting = customer.state === 'waiting';
  // Chọn skin: Nếu là sói thì lấy ảnh sói, không thì lấy ảnh người thường
  const spriteId = customer.skin === 'wolf' ? SPRITE_IDS.WOLF_MAN : SPRITE_IDS.CIVILIAN;

  return (
    <BaseEntity x={customer.position.x} y={customer.position.y} className="-ml-6 -mt-[70px]">
       {isWaiting && (
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 animate-bounce z-50">
           <div className="bg-white border-2 border-black rounded-lg px-2 py-1 flex items-center shadow-md gap-1">
              <span className="text-xs font-black text-black">🍖 x{customer.requestAmount}</span>
           </div>
           <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-black border-r-[6px] border-r-transparent absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
      <div className="animate-[bounce_0.8s_infinite]">
         <SpriteImage id={spriteId} className="w-14 h-14" />
      </div>
    </BaseEntity>
  );
};

// 3. DÂN THƯỜNG (CIVILIAN)
export const CivilianEntity: React.FC<{ civilian: Civilian }> = ({ civilian }) => {
    return (
        <BaseEntity x={civilian.position.x} y={civilian.position.y} className="-ml-6 -mt-[70px]">
            {civilian.state === 'buying_wood' && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce z-50 bg-amber-200 border border-amber-800 px-2 rounded text-[10px] font-bold">
                    Mua Gỗ
                </div>
            )}
            <div className="animate-[bounce_1s_infinite]">
                <SpriteImage id={SPRITE_IDS.CIVILIAN} className="w-12 h-12 opacity-90" />
            </div>
        </BaseEntity>
    );
};

// 4. KẺ THÙ (ENEMY)
export const EnemyEntity: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;
  
  let spriteId = SPRITE_IDS.ENEMY_PUMPKIN; // Mặc định là Bí ngô
  let scale = 1;

  if (enemy.type === 'skeleton') spriteId = SPRITE_IDS.ENEMY_SKELETON;
  else if (enemy.type === 'bat') spriteId = SPRITE_IDS.ENEMY_BAT;
  else if (enemy.type === 'boss') {
      spriteId = SPRITE_IDS.ENEMY_BOSS;
      scale = 2; // Boss to gấp đôi
  }

  return (
    <BaseEntity x={enemy.position.x} y={enemy.position.y} className={`-ml-8 ${enemy.type === 'boss' ? '-mt-[120px]' : '-mt-[80px]'}`} scale={scale}>
      {/* Thanh máu */}
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-900 rounded border border-black overflow-hidden z-50">
        <div className={`h-full transition-all duration-200 ${enemy.isBoss ? 'bg-purple-600' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }}></div>
      </div>

      <div className={enemy.type === 'bat' ? "animate-[bounce_0.5s_infinite]" : "animate-[bounce_1s_infinite]"}>
        <SpriteImage id={spriteId} className="w-16 h-16" />
      </div>
      
      {enemy.isBoss && <div className="absolute -top-8 text-[10px] font-black text-red-500 bg-black/80 px-1 rounded border border-red-500">BOSS</div>}
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
            {/* Bệ đứng (Dùng tạm ảnh cái Rương hoặc Bẫy làm bệ) */}
            <div className="absolute bottom-0 opacity-80">
                <img src="/Class_Item_1.png" className="w-12 h-8 object-cover grayscale brightness-50" />
            </div>
            
            {/* Tướng đứng trên tháp */}
            <div className="absolute bottom-2 animate-[bounce_2s_infinite]">
                 <SpriteImage id={heroId} className="w-14 h-14" />
            </div>
            
            {/* Hiệu ứng hào quang */}
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
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px]" flip={state === 'walking_to_tree' || state === 'chopping'}>
        <div className={`flex flex-col items-center ${state === 'chopping' ? 'animate-[pulse_0.2s_infinite]' : 'animate-bounce'}`}>
            <div className="relative">
                 <User size={40} className="text-amber-700 fill-amber-900" />
                 <Axe size={24} className={`absolute -right-2 top-0 text-stone-300 fill-stone-500 ${state==='chopping' ? 'rotate-45' : ''}`} />
            </div>
            {state === 'chopping' && <div className="text-[10px] bg-white text-black px-1 rounded font-bold">CHẶT!</div>}
        </div>
    </BaseEntity>
);

export const ChefEntity: React.FC<{ x: number, y: number, level: number }> = ({ x, y, level }) => (
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px] z-50">
         <div className="flex flex-col items-center animate-bounce">
             <div className="relative">
                 <div className="absolute -top-4 left-1/2 -translate-x-1/2 text-white"><ChefHat size={20} /></div>
                 <User size={40} className="text-white fill-stone-800" />
             </div>
             <span className="text-[9px] bg-black/50 text-white px-1 rounded">Lv.{level}</span>
         </div>
    </BaseEntity>
);

export const ServerEntity: React.FC<{ x: number, y: number, level: number }> = ({ x, y, level }) => (
    <BaseEntity x={x} y={y} className="-ml-6 -mt-[60px] z-50">
         <div className="flex flex-col items-center animate-[bounce_0.8s_infinite]">
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
    <BaseEntity x={x} y={y} className="-ml-12 -mt-[120px]">
        <div className={`flex flex-col items-center ${hp < 50 ? 'opacity-50' : ''}`}>
             {/* Dùng ảnh Boss Cây (Số 60) làm cây gỗ */}
             <SpriteImage id={60} className="w-24 h-24" />
        </div>
    </BaseEntity>
);

// Mấy cái này giữ lại để không lỗi code cũ import
export const SPRITE_SHEET_SRC = ''; 
export const SPRITE_SCALE = 1; 
export const SPRITES = {}; 
export { SpriteRenderer }; // Xuất hàm rỗng để đỡ lỗi import
const SpriteRenderer = () => null;