
import React from 'react';
import { Customer, Enemy, Projectile, TowerType, EnemyType, Civilian } from '../types';
import { Axe, ChefHat, User, Magnet } from 'lucide-react';

// --- CONFIGURATION ---
const SPRITE_SHEET_SRC = '/spritesheet.png'; 
const SPRITE_SCALE = 512; 

// Format: [x, y, width, height]
const SPRITES = {
  HERO: [30, 65, 60, 60],          
  
  // HEROES ON TOWERS (Re-using/Mapping sprites)
  // We use characters standing instead of buildings now
  HERO_ICE: [280, 235, 50, 60],    // Blue Wizard look
  HERO_ARCHER: [25, 235, 50, 60],  // Archer look
  HERO_FIRE: [140, 235, 50, 60],   // Red Wizard look
  HERO_CANNON: [80, 235, 50, 60],  // Dwarf look
  
  // TOWER BASE (Pedestal)
  TOWER_BASE: [25, 520, 60, 40],   // Stone block/platform

  // ENEMIES
  ENEMY_PUMPKIN: [25, 415, 85, 80],      
  ENEMY_SKELETON: [130, 415, 60, 80],    
  ENEMY_BAT: [210, 430, 60, 50],
  ENEMY_BOSS: [280, 400, 100, 100], 

  // OTHERS
  WOLF_MAN: [365, 235, 50, 55],    
  MEAT_MAN: [430, 235, 50, 55],  
  CIVILIAN: [200, 235, 50, 55], // Using a different crop for civilian  
  MEAT_PLATE: [460, 480, 40, 30],  
  GOLD_STACK: [350, 470, 30, 40],  
};

interface EntityProps {
  x: number;
  y: number;
  children?: React.ReactNode;
  className?: string;
  flip?: boolean;
}

const Shadow = ({ size = 1 }: { size?: number }) => (
  <div 
    className="absolute bg-black/40 rounded-[50%]"
    style={{
        width: `${40 * size}px`,
        height: `${12 * size}px`,
        bottom: '5px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: -1,
        filter: 'blur(2px)'
    }}
  />
);

const BaseEntity: React.FC<EntityProps> = ({ x, y, children, className, flip }) => (
  <div 
    className={`absolute transition-transform duration-75 flex flex-col items-center justify-end pointer-events-none ${className}`}
    style={{ 
      left: 0, 
      top: 0,
      transform: `translate(${x}px, ${y}px) ${flip ? 'scaleX(-1)' : ''}`,
      zIndex: Math.floor(y) 
    }}
  >
    {children}
  </div>
);

const SpriteRenderer: React.FC<{
  coords: number[]; 
  scale?: number;   
  flip?: boolean;
  filter?: string;
}> = ({ coords, scale = 1, flip = false, filter }) => {
  const [bx, by, w, h] = coords;
  
  return (
    <div className="relative">
        <div 
            style={{
                width: `${w}px`,
                height: `${h}px`,
                backgroundImage: `url(${SPRITE_SHEET_SRC})`,
                backgroundPosition: `-${bx}px -${by}px`,
                backgroundSize: `${SPRITE_SCALE}px auto`,
                backgroundRepeat: 'no-repeat',
                transform: `scale(${scale})`,
                transformOrigin: 'bottom center',
                imageRendering: 'pixelated',
                filter: filter
            }}
        />
        <Shadow size={scale * (w / 60)} />
    </div>
  );
};

export const HeroEntity: React.FC<{ x: number, y: number }> = ({ x, y }) => {
  return (
    <BaseEntity x={x} y={y} className="-ml-8 -mt-[80px]">
       <div className="animate-[bounce_2s_infinite]">
         <SpriteRenderer coords={SPRITES.HERO} scale={1.4} />
       </div>
    </BaseEntity>
  );
};

export const CustomerEntity: React.FC<{ customer: Customer }> = ({ customer }) => {
  const isWaiting = customer.state === 'waiting';
  const spriteCoords = customer.skin === 'wolf' ? SPRITES.WOLF_MAN : SPRITES.MEAT_MAN;

  return (
    <BaseEntity x={customer.position.x} y={customer.position.y} className="-ml-6 -mt-[70px]">
       {isWaiting && (
        <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce z-50">
           <div className="bg-white border-2 border-black rounded-lg px-2 py-1 flex items-center shadow-md gap-1">
              <div style={{ width: '20px', height: '15px', backgroundImage: `url(${SPRITE_SHEET_SRC})`, backgroundPosition: `-${SPRITES.MEAT_PLATE[0]}px -${SPRITES.MEAT_PLATE[1]}px`, backgroundSize: `${SPRITE_SCALE}px auto` }} />
              <span className="text-xs font-black text-black">x{customer.requestAmount}</span>
           </div>
           <div className="w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-black border-r-[6px] border-r-transparent absolute -bottom-1.5 left-1/2 -translate-x-1/2"></div>
        </div>
      )}
      <div className="animate-[bounce_0.8s_infinite]">
         <SpriteRenderer coords={spriteCoords} scale={1.3} />
      </div>
    </BaseEntity>
  );
};

export const CivilianEntity: React.FC<{ civilian: Civilian }> = ({ civilian }) => {
    return (
        <BaseEntity x={civilian.position.x} y={civilian.position.y} className="-ml-6 -mt-[70px]">
            {civilian.state === 'buying_wood' && (
                <div className="absolute -top-10 left-1/2 -translate-x-1/2 animate-bounce z-50 bg-amber-200 border border-amber-800 px-2 rounded text-[10px] font-bold">
                    Mua Gỗ
                </div>
            )}
            <div className="animate-[bounce_1s_infinite]">
                <SpriteRenderer coords={SPRITES.MEAT_MAN} scale={1.0} filter="grayscale(0.5) sepia(0.5)" />
            </div>
        </BaseEntity>
    );
};

export const EnemyEntity: React.FC<{ enemy: Enemy }> = ({ enemy }) => {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;
  
  let coords = SPRITES.ENEMY_PUMPKIN;
  let scale = 1.4;
  let filter = '';

  if (enemy.type === 'skeleton') {
      coords = SPRITES.ENEMY_SKELETON;
      scale = 1.2;
  } else if (enemy.type === 'bat') {
      coords = SPRITES.ENEMY_BAT;
      scale = 1.0;
  } else if (enemy.type === 'boss') {
      coords = SPRITES.ENEMY_BOSS;
      scale = 2.5;
      filter = 'brightness(0.8) sepia(1) hue-rotate(-50deg) saturate(2)'; // Red demon look
  }

  return (
    <BaseEntity x={enemy.position.x} y={enemy.position.y} className={`-ml-10 ${enemy.type === 'boss' ? '-mt-[150px]' : '-mt-[90px]'}`}>
      <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-12 h-2 bg-gray-900 rounded border border-black overflow-hidden z-50">
        <div className={`h-full transition-all duration-200 ${enemy.isBoss ? 'bg-purple-600' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }}></div>
      </div>

      <div className={enemy.type === 'bat' ? "animate-[bounce_0.5s_infinite]" : "animate-[bounce_1s_infinite]"}>
        <SpriteRenderer coords={coords} scale={scale} filter={filter} />
      </div>
      
      {enemy.isBoss && <div className="absolute -top-10 text-xs font-black text-red-500 bg-black/50 px-2 rounded">BOSS</div>}
    </BaseEntity>
  );
};

export const TowerVisual: React.FC<{ type: TowerType }> = ({ type }) => {
    let heroCoords = SPRITES.HERO_ICE;
    let filter = '';
    
    // Select Hero Sprite
    if (type === 'archer') heroCoords = SPRITES.HERO_ARCHER;
    else if (type === 'fire') heroCoords = SPRITES.HERO_FIRE;
    else if (type === 'cannon') heroCoords = SPRITES.HERO_CANNON;

    return (
        <div className="relative flex flex-col items-center">
            {/* The Pedestal/Base */}
            <div className="absolute bottom-0">
                <SpriteRenderer coords={SPRITES.TOWER_BASE} scale={1.0} />
            </div>
            
            {/* The Hero Standing on top */}
            <div className="absolute bottom-4 animate-[bounce_2s_infinite]">
                 <SpriteRenderer coords={heroCoords} scale={1.2} filter={filter} />
            </div>
            
            {/* Visual Effects based on Type */}
            {type === 'ice' && <div className="absolute bottom-4 w-12 h-12 bg-blue-400/20 blur-xl rounded-full animate-pulse"></div>}
            {type === 'fire' && <div className="absolute bottom-4 w-12 h-12 bg-orange-400/20 blur-xl rounded-full animate-pulse"></div>}
        </div>
    );
}

export const ProjectileEntity: React.FC<{ projectile: Projectile }> = ({ projectile }) => (
  <BaseEntity x={projectile.position.x} y={projectile.position.y} className="w-8 h-8 -mt-4 -ml-4 z-50">
    <svg viewBox="0 0 40 40" className="w-full h-full animate-spin">
       <defs>
         <radialGradient id={`projGrad-${projectile.id}`} cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
            <stop offset="0%" stopColor="white" />
            <stop offset="100%" stopColor={projectile.color} />
         </radialGradient>
       </defs>
       <circle cx="20" cy="20" r={projectile.effect === 'splash' ? 12 : 8} fill={`url(#projGrad-${projectile.id})`} filter="blur(1px)" />
    </svg>
  </BaseEntity>
);

// --- NEW ENTITIES ---

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
    <BaseEntity x={x} y={y} className="-ml-10 -mt-[100px]">
        <div className={`flex flex-col items-center ${hp < 50 ? 'opacity-50' : ''}`}>
             <div className="w-16 h-24 bg-green-900 rounded-t-full relative">
                 <div className="absolute bottom-0 w-4 h-8 bg-amber-900 left-1/2 -translate-x-1/2"></div>
             </div>
        </div>
    </BaseEntity>
);

export { SPRITE_SHEET_SRC, SPRITE_SCALE, SPRITES, SpriteRenderer };
