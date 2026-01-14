import { CropData, TowerConfig } from './types';

export const GAME_WIDTH = 800;
export const GAME_HEIGHT = 600;
export const FPS = 60;
export const TICK_RATE = 1000 / FPS;

// --- PHÂN CHIA LÃNH THỔ ---
// Tường thành nằm giữa
export const WALL_X = 400; 
export const WALL_BASE_HP = 2000; // Máu tường
export const WALL_SEGMENTS_COUNT = 6;

// --- KHU VỰC AN TOÀN (BÊN TRÁI TƯỜNG < 400) ---
export const VILLAGE_AREA = { x: 0, y: 0, w: 400, h: 600 };
export const COUNTER_POS = { x: 200, y: 250 }; // Quầy bán
export const GRILL_POS = { x: 280, y: 350 };   // Lò nướng
export const HERO_POS = { x: 350, y: 300 };    // Tướng đứng sát tường thủ
export const WOOD_STORAGE_POS = { x: 80, y: 150 }; // Kho gỗ góc trái trên
export const LUMBERJACK_HUT = { x: 50, y: 50 };
export const CUSTOMER_SPAWN = { x: -50, y: 250 }; // Khách đi từ trái vào

// --- KHU VỰC NGUY HIỂM (BÊN PHẢI TƯỜNG > 400) ---
export const FOREST_AREA = { x: 450, y: 50, w: 350, h: 550 }; 
export const SPAWN_POINT = { x: 900, y: 150 };
export const EXIT_POINT = { x: -100, y: 250 }; // Khách mua xong đi về bên trái
export const ENEMY_SPAWN = { x: 900, y: 300 }; // Quái ra từ bên phải
export const SPAWN_ZONE = { minX: 850, maxX: 950, minY: 50, maxY: 550 };

// Vị trí tháp (Đặt dọc theo tường phía bên trong để bắn ra)
const generateTowerSlots = () => {
    const slots = [];
    // Hàng sát tường
    for(let i=0; i<6; i++) slots.push({ id: slots.length, x: 360, y: 80 + (i*90) });
    // Hàng hỗ trợ phía sau
    for(let i=0; i<6; i++) slots.push({ id: slots.length, x: 280, y: 120 + (i*90) });
    return slots;
};
export const TOWER_SLOTS = generateTowerSlots();

export const GARDEN_PLOTS_POS = [
  { x: 50, y: 430 }, { x: 120, y: 430 },
  { x: 50, y: 500 }, { x: 120, y: 500 },
  { x: 190, y: 500 }, { x: 190, y: 430 } 
];

// Logic
export const QUEUE_SPACING = 40; 
export const CUSTOMER_SPEED = 2;
export const ENEMY_SPEED = 0.5; // Quái đi chậm lại
export const PROJECTILE_SPEED = 12; 
export const GACHA_COST = 100;
export const ENEMY_SPAWN_RATE = 6000; // 6s mới ra 1 con (Giảm spam)
export const SEASON_DURATION = 21600; 

export const STAFF_COSTS = {
    chef: { base: 500, scale: 2 },
    server: { base: 300, scale: 1.5 },
    lumberjack: { base: 200, scale: 1.5 },
    collector: { base: 1000, scale: 2 }
};

export const TOWER_TYPES: Record<string, TowerConfig> = {
    ice: { id: 'ice', name: 'Băng Nữ', baseCost: 150, baseDmg: 30, baseSpeed: 1500, range: 250, unlockLevel: 1, desc: 'Làm chậm quái.' },
    archer: { id: 'archer', name: 'Xạ Thủ', baseCost: 500, baseDmg: 50, baseSpeed: 400, range: 220, unlockLevel: 3, desc: 'Bắn siêu nhanh.' },
    fire: { id: 'fire', name: 'Hỏa Thần', baseCost: 1500, baseDmg: 120, baseSpeed: 2000, range: 300, unlockLevel: 5, desc: 'Sát thương lan.' },
    cannon: { id: 'cannon', name: 'Pháo Thủ', baseCost: 3000, baseDmg: 300, baseSpeed: 3000, range: 400, unlockLevel: 8, desc: 'Gây choáng.' }
};

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