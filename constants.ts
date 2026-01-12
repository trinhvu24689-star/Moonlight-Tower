
import { CropData, TowerConfig } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const FPS = 60;
export const TICK_RATE = 1000 / FPS;

// Positions
export const COUNTER_POS = { x: 550, y: 250 };
export const SPAWN_POINT = { x: 900, y: 150 };
export const EXIT_POINT = { x: 900, y: 550 };
export const ENEMY_SPAWN = { x: -100, y: 500 };

// NEW AREAS
export const FOREST_AREA = { x: 100, y: 80 }; // Top Left area
export const WOOD_STORAGE_POS = { x: 200, y: 150 };
export const LUMBERJACK_HUT = { x: 50, y: 50 };

// Generate MANY Tower Slots along the road
const generateTowerSlots = () => {
    const slots = [];
    // Upper curve
    for(let i=0; i<8; i++) slots.push({ id: slots.length, x: 450 + (i*40), y: 100 });
    // Middle vertical left side
    for(let i=0; i<6; i++) slots.push({ id: slots.length, x: 480, y: 200 + (i*50) });
    // Middle vertical right side
    for(let i=0; i<6; i++) slots.push({ id: slots.length, x: 620, y: 300 + (i*50) });
    // Bottom road
    for(let i=0; i<8; i++) slots.push({ id: slots.length, x: 500 + (i*50), y: 500 });
    // Defensive cluster near grill
    slots.push({ id: slots.length, x: 300, y: 350 });
    slots.push({ id: slots.length, x: 300, y: 450 });
    slots.push({ id: slots.length, x: 400, y: 400 });
    
    return slots;
};

export const TOWER_SLOTS = generateTowerSlots();

export const GRILL_POS = { x: 350, y: 450 };
export const HERO_POS = { x: 250, y: 380 }; 

// Garden Positions (Grid layout)
export const GARDEN_PLOTS_POS = [
  { x: 50, y: 430 }, { x: 120, y: 430 },
  { x: 50, y: 500 }, { x: 120, y: 500 },
  { x: 190, y: 500 }, { x: 190, y: 430 } 
];

// Logic
export const QUEUE_SPACING = 30; // Tighter queue
export const CUSTOMER_SPEED = 2;
export const ENEMY_SPEED = 0.5;
export const PROJECTILE_SPEED = 8;
export const GACHA_COST = 100;
export const ENEMY_SPAWN_RATE = 4000;
// 24 Real Hours = 4 Seasons => 1 Season = 6 Real Hours = 21600 seconds
export const SEASON_DURATION = 21600; 

// STAFF CONFIG
export const STAFF_COSTS = {
    chef: { base: 500, scale: 2 },
    server: { base: 300, scale: 1.5 },
    lumberjack: { base: 200, scale: 1.5 },
    collector: { base: 1000, scale: 2 }
};

// --- TOWER (HERO) DATA ---
// Updated to be "Heroes" on towers with significant cost scaling
export const TOWER_TYPES: Record<string, TowerConfig> = {
    ice: {
        id: 'ice', name: 'Băng Nữ', 
        baseCost: 150, // Entry level
        baseDmg: 20, baseSpeed: 1500, range: 250, unlockLevel: 1,
        desc: 'Triệu hồi Băng Nữ. Bắn cầu tuyết làm chậm kẻ thù.'
    },
    archer: {
        id: 'archer', name: 'Xạ Thủ Elf', 
        baseCost: 500, // Mid level
        baseDmg: 35, baseSpeed: 500, range: 200, unlockLevel: 3,
        desc: 'Triệu hồi Xạ Thủ Tinh Linh. Tốc độ bắn cực nhanh.'
    },
    fire: {
        id: 'fire', name: 'Hỏa Thần', 
        baseCost: 1500, // High level
        baseDmg: 80, baseSpeed: 2000, range: 300, unlockLevel: 5,
        desc: 'Triệu hồi Pháp Sư Lửa. Sát thương lan (AOE).'
    },
    cannon: {
        id: 'cannon', name: 'Pháo Thủ Dwarf', 
        baseCost: 3000, // Elite level
        baseDmg: 200, baseSpeed: 3000, range: 400, unlockLevel: 8,
        desc: 'Triệu hồi Người Lùn Pháo Thủ. Bắn đạn pháo gây choáng.'
    }
};

// --- FARMING DATA ---
export const CROPS: Record<string, CropData> = {
  meat: { id: 'meat', name: 'Cây Thịt', seedCost: 5, sellPrice: 0, growTime: 5000, color: '#ef4444' },
  wheat: { id: 'wheat', name: 'Lúa Mì', seedCost: 5, sellPrice: 8, growTime: 6000, color: '#fde047' },
  potato: { id: 'potato', name: 'Khoai Tây', seedCost: 8, sellPrice: 15, growTime: 8000, color: '#d6d3d1' },
  carrot: { id: 'carrot', name: 'Cà Rốt', seedCost: 10, sellPrice: 20, growTime: 10000, color: '#f97316' },
  corn: { id: 'corn', name: 'Bắp Ngô', seedCost: 20, sellPrice: 45, growTime: 15000, color: '#eab308' },
  tomato: { id: 'tomato', name: 'Cà Chua', seedCost: 30, sellPrice: 70, growTime: 20000, color: '#dc2626' },
  eggplant: { id: 'eggplant', name: 'Cà Tím', seedCost: 35, sellPrice: 85, growTime: 25000, color: '#7e22ce' },
  chili: { id: 'chili', name: 'Ớt Hiểm', seedCost: 40, sellPrice: 95, growTime: 28000, color: '#b91c1c' },
  radish: { id: 'radish', name: 'Củ Cải', seedCost: 50, sellPrice: 120, growTime: 35000, color: '#f5f5f4' },
  pumpkin: { id: 'pumpkin', name: 'Bí Ngô', seedCost: 80, sellPrice: 200, growTime: 45000, color: '#d97706' },
  strawberry: { id: 'strawberry', name: 'Dâu Tây', seedCost: 100, sellPrice: 250, growTime: 60000, color: '#be185d' },
  grapes: { id: 'grapes', name: 'Nho Tím', seedCost: 150, sellPrice: 400, growTime: 90000, color: '#6b21a8' },
  watermelon: { id: 'watermelon', name: 'Dưa Hấu', seedCost: 200, sellPrice: 550, growTime: 120000, color: '#15803d' },
  banana: { id: 'banana', name: 'Chuối Vàng', seedCost: 250, sellPrice: 700, growTime: 150000, color: '#facc15' },
  apple: { id: 'apple', name: 'Táo Đỏ', seedCost: 300, sellPrice: 850, growTime: 180000, color: '#991b1b' },
  mushroom: { id: 'mushroom', name: 'Nấm Ma', seedCost: 400, sellPrice: 1200, growTime: 240000, color: '#a855f7' },
  golden_apple: { id: 'golden_apple', name: 'Táo Vàng', seedCost: 1000, sellPrice: 3000, growTime: 300000, color: '#fffbeb' }
};

export const INITIAL_UPGRADES = {
  grill: { level: 1, speed: 3000, power: 1, cost: 50 },
};
