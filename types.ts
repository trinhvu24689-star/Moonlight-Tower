
export interface Vector2 {
  x: number;
  y: number;
}

export interface GameEntity {
  id: string;
  position: Vector2;
  target?: Vector2;
  speed: number;
}

export interface Customer extends GameEntity {
  state: 'walking_in' | 'waiting' | 'buying' | 'leaving';
  patience: number;
  requestAmount: number;
  skin: 'barbarian' | 'wolf'; 
  type: 'warrior'; // Regular meat buyer
}

export interface Civilian extends GameEntity {
  state: 'walking_in' | 'buying_wood' | 'leaving';
  type: 'civilian'; // Wood buyer
}

export type EnemyType = 'pumpkin' | 'skeleton' | 'bat' | 'boss' | 'ice_pumpkin'; // Added ice_pumpkin

export interface Enemy extends GameEntity {
  type: EnemyType;
  hp: number;
  maxHp: number;
  state: 'walking' | 'attacking' | 'dead';
  isBoss: boolean;
  isFrozen?: boolean; // Visual effect for winter
}

export interface Projectile extends GameEntity {
  targetId: string;
  damage: number;
  effect?: 'slow' | 'burn' | 'splash' | 'stun';
  color: string;
}

export type GameDifficulty = 'normal' | 'hardcore';

// --- FARMING & QUEST TYPES ---

export type CropType = 
  | 'meat' 
  | 'wheat' | 'potato' | 'carrot' 
  | 'corn' | 'tomato' | 'eggplant' | 'chili' 
  | 'pumpkin' | 'strawberry' | 'grapes' | 'watermelon' 
  | 'mushroom' | 'radish' | 'apple' | 'banana' 
  | 'golden_apple';

export interface CropData {
  id: CropType;
  name: string;
  seedCost: number;
  sellPrice: number;
  growTime: number; 
  color: string;
}

export interface Quest {
  id: string;
  type: 'harvest' | 'kill' | 'earn';
  targetId?: string; 
  description: string;
  targetAmount: number;
  currentAmount: number;
  rewardGold: number;
  rewardRuby: number;
  isCompleted: boolean;
}

export interface Resources {
  wood: number; // NEW RESOURCE
  [key: string]: number; 
}

export interface GardenPlot {
  id: number;
  state: 'empty' | 'growing' | 'ready';
  cropType?: CropType; 
  plantTime: number; 
  growDuration: number;
  position: Vector2;
}

// SERVER INFO INTERFACE
export interface ServerInfo {
  id: string;
  name: string;
  region: 'Asia' | 'VietNam' | 'HK/TW' | 'China';
  status: 'Good' | 'Busy' | 'Full' | 'Maintenance';
  isNew: boolean;
  label: string; // e.g. "Tử Lưu Ly"
  ping: number; // NEW: Realtime ping simulation
}

export interface UserProfile {
  username: string;
  role?: 'user' | 'admin' | 'nph' | 'bot'; 
  serverId?: string; // NEW: Track which server the user belongs to
  serverName?: string; // NEW: Store display name
  level: number;
  exp: number;
  gold: number;
  ruby: number;
  avatar: string; 
  inventory: string[];
  playTime: number; 
  lastActiveDate?: string; 
  hasSeenIntro?: boolean; 
  tutorialCompleted?: boolean; 
  savedResources?: Resources;
  gardenPlots?: GardenPlot[]; 
  staffLevels?: StaffLevels; 
}

export interface StaffLevels {
  chef: number;
  server: number;
  lumberjack: number;
  collector: number;
}

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

// Define In-Game Clock Interface
export interface GameClock {
  day: number;
  month: number;
  year: number;
  hour: number;
  minute: number;
}

export interface GameState {
  gold: number;
  ruby: number; 
  cookedMeat: number; 
  meatCapacity: number;
  towerDamageBuff: number; 
  grillSpeedBuff: number; 
  lastTick: number;
  mana: number; 
  maxMana: number;
  season: Season;      
  seasonTimer: number; // Seconds left in season
  gameTime: GameClock; // NEW: Stores current logical game time
}

export interface StationStats {
  level: number;
  speed: number; 
  power: number; 
  cost: number;
}

export type TowerType = 'ice' | 'archer' | 'fire' | 'cannon';

export interface TowerConfig {
  id: TowerType;
  name: string;
  baseCost: number;
  baseDmg: number;
  baseSpeed: number;
  range: number;
  unlockLevel: number;
  desc: string;
}

export interface BuiltTower {
  id: string; 
  slotId: number;
  type: TowerType;
  level: number;
  position: Vector2;
  lastShot: number;
}

export interface UpgradeConfig {
  grill: StationStats;
}

export interface Particle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  type: 'text' | 'circle' | 'spark' | 'icon' | 'snow' | 'rain' | 'leaf'; // Added weather types
  text?: string;
  icon?: any;
}

export interface LumberjackState {
  state: 'idle' | 'walking_to_tree' | 'chopping' | 'walking_back';
  position: Vector2;
  targetTreeIndex: number | null;
}
