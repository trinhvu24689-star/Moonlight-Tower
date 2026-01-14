import React, { useEffect } from 'react';
import { Customer, Enemy, Projectile, TowerType, Civilian } from '../types';
import { Axe, ChefHat, User, Magnet, Sword, Crown, Diamond, Flame, Package } from 'lucide-react';

const getSpriteUrl = (id: number) => `/Class_Monster_${id}.png`;

const SPRITE_IDS = {
  HERO_ICE: 100, HERO_ARCHER: 107, HERO_FIRE: 105, HERO_CANNON: 112,
  ENEMY_PUMPKIN: 119, ENEMY_SKELETON: 125, ENEMY_BAT: 131,
  BOSS_TREE: 60, BOSS_FIRE: 150, BOSS_SKELETON: 128, BOSS_ICE: 155,
  CIVILIAN: 1, WOLF_MAN: 135,
  // Đã xóa các ID GRILL, COUNTER, HOUSE vì sẽ tự vẽ
  LOOT_MEAT: 137, LOOT_GOLD: 51, MAIN_HERO: 103, TREE: 60
};

// ... Các hàm style giữ nguyên ...
export const EntitiesStyle = () => (
  <style>{`
    @keyframes walk { 0%, 100% { transform: rotate(-5deg); } 50% { transform: rotate(5deg) translateY(-3px); } }
    @keyframes attack { 0% { transform: scale(1); } 50% { transform: scale(1.3) rotate(45deg); } 100% { transform: scale(1); } }
    @keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
    .anim-walk { animation: walk 0.5s infinite ease-in-out; }
    .anim-attack { animation: attack 0.3s linear; }
    .anim-float { animation: float 2s infinite ease-in-out; }
  `}</style>
);

const BaseEntity: React.FC<any> = ({ x, y, children, className, scale = 1, flip = false }) => (
  <div className={`absolute flex flex-col items-center justify-end pointer-events-none transition-transform duration-100 ${className}`}
    style={{ left: 0, top: 0, transform: `translate(${x}px, ${y}px) scale(${scale}) ${flip ? 'scaleX(-1)' : ''}`, zIndex: Math.floor(y) }}>
    {children}
    <div className="absolute bottom-1 w-8 h-2 bg-black/30 rounded-full blur-[2px] -z-10" />
  </div>
);

const SpriteImage: React.FC<{ id: number; className?: string }> = ({ id, className }) => (
  <img src={getSpriteUrl(id)} className={`object-contain drop-shadow-md rendering-pixelated ${className}`} onError={(e) => (e.target as HTMLImageElement).src = '/Class_Monster_1.png'} />
);

// --- BUILDING ENTITY (Tự vẽ Lò nướng và Quầy bằng CSS) ---
export const BuildingEntity: React.FC<{ x: number, y: number, type: 'grill' | 'counter' }> = ({ x, y, type }) => {
    const isGrill = type === 'grill';
    return (
        <BaseEntity x={x} y={y} className="-ml-10 -mt-[60px]" scale={1.5}>
            <div className={`w-16 h-16 relative rounded-lg border-4 ${isGrill ? 'bg-stone-700 border-stone-900' : 'bg-amber-700 border-amber-900'}`}>
                {/* Mặt trên */}
                <div className={`absolute top-0 left-0 w-full h-1/2 rounded-t-md ${isGrill ? 'bg-stone-600' : 'bg-amber-600'}`}></div>
                {/* Hiệu ứng lửa cho lò nướng */}
                {isGrill && <div className="absolute -top-4 left-1/2 -translate-x-1/2 animate-pulse text-red-500"><Flame size={24} fill="red" /></div>}
                {/* Chân bàn (vẽ đơn giản) */}
                <div className="absolute bottom-0 left-2 w-2 h-4 bg-black/50"></div>
                <div className="absolute bottom-0 right-2 w-2 h-4 bg-black/50"></div>
            </div>
        </BaseEntity>
    );
};

// --- WAREHOUSE ENTITY (Tự vẽ Kho gỗ) ---
export const WarehouseEntity: React.FC<{ x: number, y: number }> = ({ x, y }) => (
    <BaseEntity x={x} y={y} className="-ml-16 -mt-[80px]" scale={1.2}>
        <div className="w-24 h-24 relative rounded-xl border-4 bg-amber-800 border-amber-950 flex items-center justify-center">
            <div className="absolute top-0 left-0 w-full h-1/3 bg-amber-700 rounded-t-lg"></div>
            <Package size={40} className="text-amber-200" />
            <div className="absolute bottom-1 text-[10px] font-bold text-amber-200">KHO GỖ</div>
        </div>
    </BaseEntity>
);

// --- LOOT ENTITY ---
export const LootEntity: React.FC<{ x: number, y: number, type: 'meat' | 'gold' | 'ruby' }> = ({ x, y, type }) => {
    let icon;
    // Vẫn dùng ảnh cho thịt và vàng vì nó đơn giản, nếu lỗi sẽ tính sau
    if (type === 'meat') icon = <SpriteImage id={SPRITE_IDS.LOOT_MEAT} className="w-8 h-8" />;
    else if (type === 'gold') icon = <SpriteImage id={SPRITE_IDS.LOOT_GOLD} className="w-8 h-8" />;
    else if (type === 'ruby') icon = <Diamond size={20} className="text-red-500 fill-red-300 animate-pulse" />;
    return <div className="absolute anim-float z-20" style={{ left: x, top: y }}>{icon}</div>;
};

// --- MAIN HERO ---
export const MainHeroEntity: React.FC<{ x: number, y: number, state: string, flip: boolean }> = ({ x, y, state, flip }) => (
    <BaseEntity x={x} y={y} className="-ml-8 -mt-[80px]" scale={1.3} flip={flip}>
        <div className={state === 'attacking' ? 'anim-attack' : 'anim-walk'}>
            <SpriteImage id={SPRITE_IDS.MAIN_HERO} className="w-16 h-16" />
            {state === 'attacking' && <div className="absolute top-0 right-0 text-white"><Sword size={24} className="text-yellow-400 fill-yellow-200"/></div>}
        </div>
        <div className="absolute -top-10 bg-yellow-500 text-black text-[10px] font-bold px-1 rounded border border-white">ANH HÙNG</div>
    </BaseEntity>
);

// Các entity khác giữ nguyên
export const HeroEntity: React.FC<{ x: number, y: number }> = ({ x, y }) => (<BaseEntity x={x} y={y} className="-ml-8 -mt-[80px]" scale={1.2} animType="walk"><SpriteImage id={SPRITE_IDS.HERO_ICE} className="w-16 h-16" /></BaseEntity>);
export const CustomerEntity: React.FC<{ customer: Customer }> = ({ customer }) => (<BaseEntity x={customer.position.x} y={customer.position.y} className="-ml-6 -mt-[70px] anim-walk"><SpriteImage id={1} className="w-14 h-14" /></BaseEntity>);
export const CivilianEntity: React.FC<{ civilian: Civilian }> = ({ civilian }) => (<BaseEntity x={civilian.position.x} y={civilian.position.y} className="-ml-6 -mt-[70px] anim-walk"><SpriteImage id={1} className="w-14 h-14 opacity-80" /></BaseEntity>);
export const EnemyEntity: React.FC<{ enemy: any }> = ({ enemy }) => {
  const hpPercent = (enemy.hp / enemy.maxHp) * 100;
  let spriteId = SPRITE_IDS.ENEMY_PUMPKIN;
  let scale = 1;
  if (enemy.isBoss) { scale = 2.5; if (enemy.season === 'spring') spriteId = SPRITE_IDS.BOSS_TREE; else if (enemy.season === 'summer') spriteId = SPRITE_IDS.BOSS_FIRE; else if (enemy.season === 'autumn') spriteId = SPRITE_IDS.BOSS_SKELETON; else spriteId = SPRITE_IDS.BOSS_ICE; }
  else { if (enemy.type === 'skeleton') spriteId = SPRITE_IDS.ENEMY_SKELETON; if (enemy.type === 'bat') spriteId = SPRITE_IDS.ENEMY_BAT; }
  return (
    <BaseEntity x={enemy.position.x} y={enemy.position.y} className={`-ml-8 ${enemy.isBoss ? '-mt-[120px]' : '-mt-[80px]'}`} scale={scale} flip={true}>
      <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-10 h-1.5 bg-gray-900 rounded border border-black overflow-hidden z-50"><div className={`h-full transition-all ${enemy.isBoss ? 'bg-purple-600' : 'bg-red-500'}`} style={{ width: `${hpPercent}%` }}></div></div>
      <div className={enemy.state==='attacking'?'anim-attack':'anim-walk'}><SpriteImage id={spriteId} className="w-16 h-16" /></div>
      {enemy.isBoss && <div className="absolute -top-10 text-[10px] font-black text-red-500 bg-black/80 px-2 rounded border border-red-500 animate-pulse">BOSS</div>}
    </BaseEntity>
  );
};
export const WallEntity: React.FC<{ x: number, y: number, hp: number, maxHp: number, level: number }> = ({ x, y, hp, maxHp, level }) => { const damageLevel = hp / maxHp; let filter = ""; if (damageLevel < 0.5) filter = "sepia(1)"; if (hp <= 0) return null; return (<BaseEntity x={x} y={y} className="-ml-8 -mt-[90px]" scale={1.5}><div className="absolute -top-10 left-1/2 -translate-x-1/2 w-16 h-2 bg-black rounded border border-white/50 z-50"><div className="h-full bg-blue-500" style={{ width: `${damageLevel * 100}%` }}></div></div><div className="relative flex flex-col items-center"><img src="/Class_Item_12.png" className="w-16 h-12 object-cover rounded-sm border border-black/30" style={{ filter }} /><img src="/Class_Item_12.png" className="w-16 h-12 object-cover -mt-8 rounded-sm border border-black/30" style={{ filter }} /></div></BaseEntity>); };
export const ProjectileEntity: React.FC<{ projectile: Projectile }> = ({ projectile }) => (<BaseEntity x={projectile.position.x} y={projectile.position.y} className="w-8 h-8 -mt-4 -ml-4 z-50"><div className="w-3 h-3 rounded-full bg-yellow-400 shadow-[0_0_10px_yellow] animate-spin" /></BaseEntity>);
export const TowerVisual: React.FC<{ type: TowerType }> = ({ type }) => (<div className="relative flex flex-col items-center"><div className="absolute bottom-0 opacity-80"><img src="/Class_Item_1.png" className="w-12 h-8 object-cover grayscale brightness-50" /></div><div className="absolute bottom-2 anim-walk"><SpriteImage id={100} className="w-14 h-14" /></div></div>);
export const TreeEntity: React.FC<{ x: number, y: number, hp: number }> = ({ x, y, hp }) => (<BaseEntity x={x} y={y} className="-ml-12 -mt-[120px]"><SpriteImage id={60} className="w-24 h-24" /></BaseEntity>);
export const LumberjackEntity: React.FC<any> = ({x,y}) => (<BaseEntity x={x} y={y} className="-ml-6 -mt-[60px]"><User/></BaseEntity>);
export const ChefEntity: React.FC<any> = ({x,y}) => (<BaseEntity x={x} y={y} className="-ml-6 -mt-[60px]"><ChefHat/></BaseEntity>);
export const ServerEntity: React.FC<any> = ({x,y}) => (<BaseEntity x={x} y={y} className="-ml-6 -mt-[60px]"><User/></BaseEntity>);
export const CollectorEntity: React.FC<any> = ({x,y}) => (<BaseEntity x={x} y={y} className="-ml-6 -mt-[60px]"><Magnet/></BaseEntity>);

export const SPRITE_SHEET_SRC = ''; export const SPRITE_SCALE = 1; export const SPRITES = {}; export { SpriteRenderer }; const SpriteRenderer = () => null;