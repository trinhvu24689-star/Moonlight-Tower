import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Coins, Beef, ArrowUpCircle, X, LogOut, Gem, 
    Zap, Flame, Star, Ghost, MessageCircle, Shield, Hammer,
    AlertCircle, Users, Axe, Trees, Crown, CloudRain, Sun, Snowflake, Leaf, Calendar, Clock,
    ShieldAlert, ArrowLeftCircle 
} from 'lucide-react';
import { GameMap } from './GameMap';
import { 
    CustomerEntity, EnemyEntity, ProjectileEntity, HeroEntity, TowerVisual,
    LumberjackEntity, ChefEntity, ServerEntity, CollectorEntity, TreeEntity, CivilianEntity,
    WallEntity, HouseEntity, WarehouseEntity, EntitiesStyle 
} from './Entities';
import { TutorialSystem } from './TutorialSystem';
import { 
  GameState, Customer, Enemy, Projectile, UpgradeConfig, 
  Vector2, GameDifficulty, UserProfile, Particle,
  Resources, Quest, BuiltTower, TowerType, EnemyType,
  StaffLevels, LumberjackState, Civilian, Season, GameClock
} from '../types';
import { 
  GAME_WIDTH, GAME_HEIGHT, 
  COUNTER_POS, CUSTOMER_SPAWN, EXIT_POINT, 
  INITIAL_UPGRADES, CUSTOMER_SPEED, ENEMY_SPAWN, ENEMY_SPEED,
  TOWER_SLOTS, PROJECTILE_SPEED, GRILL_POS, HERO_POS,
  TOWER_TYPES, ENEMY_SPAWN_RATE, CROPS,
  FOREST_AREA, WOOD_STORAGE_POS, LUMBERJACK_HUT, STAFF_COSTS,
  SEASON_DURATION,
  WALL_X, WALL_BASE_HP, WALL_SEGMENTS_COUNT, SPAWN_ZONE
} from '../constants';
import { soundManager } from '../utils/audio';

// --- CÁC HÀM TIỆN ÍCH (HELPER FUNCTIONS) ---

// 1. Rút gọn số (10k, 1tr...)
const formatNumber = (num: number) => {
    if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace('.0','') + ' tỷ';
    if (num >= 1000000) return (num / 1000000).toFixed(1).replace('.0','') + ' tr';
    if (num >= 1000) return (num / 1000).toFixed(1).replace('.0','') + ' k';
    return num.toString();
};

// 2. Định dạng giờ (08:05) - ĐÂY LÀ HÀM BỊ THIẾU LÚC NÃY
const formatTime = (h: number, m: number) => 
    `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

interface WallSegment { id: number; y: number; hp: number; maxHp: number; }
interface GameSessionProps { user: UserProfile; difficulty: GameDifficulty; onExit: (earnedGold: number, earnedRuby: number) => void; }

// 3. Tính thời gian game
const calculateGameTime = (): { season: Season, timeLeft: number, clock: GameClock } => {
    const now = new Date();
    const msToday = now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const seasonBlockMs = 6 * 60 * 60 * 1000; 
    const seasonIdx = Math.floor(msToday / seasonBlockMs); 
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    return { season: seasons[seasonIdx], timeLeft: 0, clock: { day: 1, month: 1, year: 1, hour: 12, minute: 0 } };
};

// --- COMPONENT CHÍNH ---
export const GameSession: React.FC<GameSessionProps> = ({ user, difficulty, onExit }) => {
  const isHardcore = difficulty === 'hardcore';
  const ENEMY_HP_MULTIPLIER = isHardcore ? 1.5 : 1.0;
  
  const [localUser, setLocalUser] = useState<UserProfile>(user);
  const [resources, setResources] = useState<Resources>(user.savedResources || { 'prod_meat': 0, 'wood': 0 });
  const [staff, setStaff] = useState<StaffLevels>(user.staffLevels || { chef: 0, server: 0, lumberjack: 0, collector: 0 });
  const [gameState, setGameState] = useState<GameState>({
    gold: user.gold, ruby: user.ruby, cookedMeat: 5, meatCapacity: 20 + (staff.chef * 10),
    towerDamageBuff: 0, grillSpeedBuff: 0, lastTick: Date.now(), mana: 0, maxMana: 100,
    season: 'spring', seasonTimer: 0, gameTime: { day:1, month:1, year:1, hour:12, minute:0 }
  });

  const [wallLevel, setWallLevel] = useState(1);
  const [walls, setWalls] = useState<WallSegment[]>(() => {
      const segments = [];
      const segmentHeight = GAME_HEIGHT / WALL_SEGMENTS_COUNT;
      for (let i = 0; i < WALL_SEGMENTS_COUNT; i++) segments.push({ id: i, y: i * segmentHeight + 60, hp: WALL_BASE_HP, maxHp: WALL_BASE_HP });
      return segments;
  });

  const [trees, setTrees] = useState(Array.from({length: 25}).map((_, i) => ({ 
      id: i, x: FOREST_AREA.x + (Math.random() * FOREST_AREA.w), y: FOREST_AREA.y + (Math.random() * FOREST_AREA.h), hp: 100 
  })));

  const [quests, setQuests] = useState<Quest[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeConfig>(INITIAL_UPGRADES);
  const [towers, setTowers] = useState<BuiltTower[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [civilians, setCivilians] = useState<Civilian[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]); 
  const [lumberjackState, setLumberjackState] = useState<LumberjackState>({ state: 'idle', position: LUMBERJACK_HUT, targetTreeIndex: null });
  const [activeModal, setActiveModal] = useState<'none' | 'build_tower' | 'staff_hire'>('none');
  const [scale, setScale] = useState(1);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [ultimateActive, setUltimateActive] = useState(false);
  const [noMeatWarning, setNoMeatWarning] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [levelUpModal, setLevelUpModal] = useState<{show: boolean, oldLevel: number, newLevel: number} | null>(null);
  const [guideMessage, setGuideMessage] = useState<string | null>(null);

  const lastCustomerSpawn = useRef(0);
  const lastCivilianSpawn = useRef(0);
  const lastEnemySpawn = useRef(0);
  const lastCookTime = useRef(0);
  const lastBossSpawn = useRef(0);
  const lastGuideTip = useRef(0);
  const lastLumberAction = useRef(0);
  const lastTimeCheck = useRef(0);
  const requestRef = useRef<number>(0);

  const generateNewQuest = () => {
      const id = Date.now().toString();
      const scale = Math.max(1, localUser.level);
      const isKill = Math.random() > 0.5;
      const target = isKill ? 10 + Math.floor(Math.random() * 20) : 500 + Math.floor(Math.random() * 1000);
      const newQuest: Quest = {
          id, type: isKill ? 'kill' : 'earn',
          targetAmount: target, currentAmount: 0, isCompleted: false,
          description: isKill ? `Diệt ${target} quái` : `Kiếm ${formatNumber(target)} vàng`,
          rewardGold: isKill ? target * 25 : Math.floor(target * 0.5), rewardRuby: Math.floor(Math.random() * 3) + 1
      };
      setQuests(prev => [...prev.filter(q => !q.isCompleted), newQuest].slice(0, 3));
  };

  const updateQuestProgress = (type: Quest['type'], amount: number) => {
      setQuests(prev => prev.map(q => {
          if (q.isCompleted || q.type !== type) return q;
          const newAmount = q.currentAmount + amount;
          if (newAmount >= q.targetAmount) {
              soundManager.playCoin();
              setGameState(gs => ({...gs, gold: gs.gold + q.rewardGold, ruby: gs.ruby + q.rewardRuby}));
              spawnParticle(GAME_WIDTH/2, 100, 'text', '#fbbf24', `Xong NV! +${formatNumber(q.rewardGold)}g`, <Crown size={20}/>);
              setTimeout(generateNewQuest, 2000);
              return { ...q, currentAmount: q.targetAmount, isCompleted: true };
          }
          return { ...q, currentAmount: newAmount };
      }));
  };

  const upgradeWall = () => {
      const cost = wallLevel * 1000;
      if (gameState.gold >= cost) {
          setGameState(prev => ({ ...prev, gold: prev.gold - cost }));
          setWallLevel(l => l + 1);
          setWalls(prev => prev.map(w => ({ ...w, hp: w.maxHp + 500, maxHp: w.maxHp + 500 })));
          spawnParticle(WALL_X, 300, 'text', '#fbbf24', 'Tường UP!', <Shield size={20}/>);
          soundManager.playCoin();
      } else spawnParticle(WALL_X, 300, 'text', '#ef4444', 'Thiếu tiền!');
  };

  const getDistance = (p1: Vector2, p2: Vector2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const moveTowards = (current: Vector2, target: Vector2, speed: number): Vector2 => {
    const dist = getDistance(current, target);
    if (dist <= speed) return target;
    const ratio = speed / dist;
    return { x: current.x + (target.x - current.x) * ratio, y: current.y + (target.y - current.y) * ratio };
  };
  const spawnParticle = (x: number, y: number, type: Particle['type'], color: string, text?: string, icon?: any) => {
    setParticles(prev => [...prev, { id: Math.random().toString(), x, y, vx: (Math.random() - 0.5)*4, vy: -3, life: 1.0, maxLife: 1.0, color, size: 10, type, text, icon }]);
  };
  const addExp = (amount: number) => {
      const xpNeeded = localUser.level * 100;
      let newExp = localUser.exp + amount;
      let newLevel = localUser.level;
      if (newExp >= xpNeeded) { newExp -= xpNeeded; newLevel++; soundManager.playUltimate(); setLevelUpModal({ show: true, oldLevel: newLevel - 1, newLevel: newLevel }); setGameState(prev => ({ ...prev, ruby: prev.ruby + 20, gold: prev.gold + 200 })); }
      setLocalUser(prev => ({ ...prev, level: newLevel, exp: newExp }));
  };

  useEffect(() => {
    if (!user.tutorialCompleted) setShowTutorial(true);
    if (quests.length === 0) generateNewQuest(); 
    if (user.level > 1 && towers.length === 0) { setTowers([{ id: 'init-tower', slotId: 0, type: 'ice', level: 1, position: TOWER_SLOTS[0], lastShot: 0 }]); }
    const handleResize = () => { setScale(Math.min(window.innerWidth / GAME_WIDTH, window.innerHeight / GAME_HEIGHT) * 0.98); };
    window.addEventListener('resize', handleResize); handleResize();
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const tick = useCallback(() => {
    if (showTutorial || activeModal !== 'none' || levelUpModal || showExitConfirm) return;
    const now = Date.now();
    
    if (now - lastTimeCheck.current > 100) {
        setGameState(prev => {
            const timeData = calculateGameTime();
            if (timeData.season !== prev.season) {
                 let msg = "";
                 if (timeData.season === 'spring') msg = "Mùa Xuân đến!";
                 if (timeData.season === 'summer') msg = "Mùa Hè oi bức!";
                 if (timeData.season === 'autumn') msg = "Mùa Thu vàng!";
                 if (timeData.season === 'winter') msg = "Mùa Đông giá rét!";
                 soundManager.speak(msg, 'guide'); setGuideMessage(msg);
            }
            return { ...prev, season: timeData.season, seasonTimer: timeData.timeLeft, gameTime: timeData.clock };
        });
        lastTimeCheck.current = now;
    }

    // --- SPAWN KHÁCH TỪ TRÁI ---
    const MAX_CUSTOMERS = 10 + (staff.server * 2);
    if (now - lastCustomerSpawn.current > Math.max(1000, 3000 - (localUser.level * 100)) && customers.length < MAX_CUSTOMERS) {
      setCustomers(prev => [...prev, { id: `cust-${now}`, position: { ...CUSTOMER_SPAWN }, speed: CUSTOMER_SPEED + (staff.server * 0.1), state: 'walking_in', patience: 100, requestAmount: 1, skin: Math.random()>0.5?'barbarian':'wolf', type: 'warrior' }]);
      lastCustomerSpawn.current = now;
    }
    if (resources['wood'] > 0 && now - lastCivilianSpawn.current > 5000 && civilians.length < 5) {
        setCivilians(prev => [...prev, { id: `civ-${now}`, position: { ...CUSTOMER_SPAWN }, speed: CUSTOMER_SPEED * 0.8, state: 'walking_in', type: 'civilian' }]);
        lastCivilianSpawn.current = now;
    }

    // --- SPAWN QUÁI TỪ PHẢI (MÁU YẾU HƠN) ---
    const currentSpawnRate = Math.max(500, ENEMY_SPAWN_RATE - (localUser.level * 300));
    if (now - lastEnemySpawn.current > currentSpawnRate && enemies.length < 50) {
       let type: EnemyType = 'pumpkin';
       let speed = ENEMY_SPEED;
       const isBoss = Math.random() < 0.05; 
       
       const hpMulti = 1 + (localUser.level * 0.1); // Giảm độ khó tăng máu
       const baseHp = (isBoss ? 1000 : 80) * hpMulti; // Máu gốc giảm

       const randomY = Math.random() * (SPAWN_ZONE.maxY - SPAWN_ZONE.minY) + SPAWN_ZONE.minY;
       const randomX = Math.random() * (SPAWN_ZONE.maxX - SPAWN_ZONE.minX) + SPAWN_ZONE.minX;

       setEnemies(prev => [...prev, { 
           id: `e-${now}`, position: { x: randomX, y: randomY }, path: [], currentPathIndex: 0,
           speed: (isBoss ? 0.4 : speed) * (isHardcore ? 1.2 : 1), 
           hp: baseHp, maxHp: baseHp, state: 'walking', 
           type: isBoss ? 'boss' : (Math.random()>0.5?'skeleton':'pumpkin'), 
           isBoss, isFrozen: gameState.season === 'winter' 
       }]);
       lastEnemySpawn.current = now;
    }

    setEnemies(prev => prev.map(enemy => {
        let { x, y } = enemy.position;
        let isAttacking = false;
        const targetWall = walls.find(w => w.hp > 0 && Math.abs(w.y - y) < 80);

        if (targetWall && x > WALL_X) {
            const dist = x - WALL_X;
            if (dist > 40) { x -= enemy.speed; y += Math.sin(now / 300) * 0.5; } 
            else { isAttacking = true; targetWall.hp -= 0.5; }
        } else {
            x -= enemy.speed; 
            if (y < 300) y += 0.2; else y -= 0.2;
        }
        return { ...enemy, position: {x, y}, state: isAttacking ? 'attacking' : 'walking' };
    }).filter(e => e.hp > 0 && e.position.x > -50));

    setWalls(prev => prev.filter(w => w.hp > 0));

    setProjectiles(prev => {
      const active: Projectile[] = [];
      const hits: string[] = []; 
      prev.forEach(p => {
        const target = enemies.find(e => e.id === p.targetId);
        if (!target) return; 
        const dist = getDistance(p.position, target.position);
        if (dist < 10) hits.push(p.targetId);
        else active.push({ ...p, position: moveTowards(p.position, target.position, p.speed) });
      });
      if (hits.length > 0) {
        soundManager.playHit();
        setEnemies(old => old.map(e => {
          if (hits.includes(e.id)) {
             const hitter = prev.find(p => p.targetId === e.id);
             const dmg = hitter ? hitter.damage : 0;
             spawnParticle(e.position.x, e.position.y, 'text', '#f87171', `-${Math.floor(dmg)}`);
             let newHp = e.hp - dmg;
             if (newHp <= 0) {
                 updateQuestProgress('kill', 1);
                 addExp(e.isBoss ? 100 : 5);
                 if (e.isBoss) {
                     const goldDrop = 500 + (localUser.level * 100);
                     setGameState(gs => ({...gs, gold: gs.gold + goldDrop, ruby: gs.ruby + 5}));
                     spawnParticle(e.position.x, e.position.y, 'text', '#fbbf24', `+${formatNumber(goldDrop)}g`, <Crown size={16}/>);
                 } else if (Math.random() < 0.3) {
                     setResources(r => ({ ...r, 'prod_meat': (r['prod_meat'] || 0) + 1 })); 
                     spawnParticle(e.position.x, e.position.y, 'text', '#ef4444', '+1 Thịt', <Beef size={12}/>);
                 }
                 if (staff.collector > 0) { let goldDrop = 10 + localUser.level; setGameState(gs => ({...gs, gold: gs.gold + goldDrop})); spawnParticle(e.position.x, e.position.y - 10, 'text', '#fbbf24', `+${goldDrop}g`); }
                 setGameState(gs => ({ ...gs, mana: Math.min(gs.mana + (e.isBoss?50:10), gs.maxMana) }));
             }
             return { ...e, hp: newHp };
          }
          return e;
        }));
      }
      return active;
    });

    setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, life: p.life - 0.02 })).filter(p => p.life > 0));
    setGameState(prev => ({ ...prev, lastTick: now }));
    
    const chefBoost = staff.chef * 500;
    const grillSpeed = Math.max(200, upgrades.grill.speed - chefBoost - (gameState.grillSpeedBuff * 10));
    if (now - lastCookTime.current > grillSpeed && gameState.cookedMeat < gameState.meatCapacity) {
        if ((resources['prod_meat'] || 0) > 0) {
            setResources(prev => ({ ...prev, 'prod_meat': prev['prod_meat'] - 1 }));
            setGameState(prev => ({ ...prev, cookedMeat: Math.min(prev.cookedMeat + upgrades.grill.power, prev.meatCapacity) }));
            soundManager.playCook();
            spawnParticle(GRILL_POS.x, GRILL_POS.y, 'spark', '#ef4444');
            setNoMeatWarning(false);
        } else if (!noMeatWarning) setNoMeatWarning(true);
        lastCookTime.current = now;
    }
    
    setTowers(prev => prev.map(t => {
        const conf = TOWER_TYPES[t.type];
        if (enemies.length > 0 && now - t.lastShot > Math.max(200, conf.baseSpeed - (t.level * 50))) {
            const target = enemies.find(e => getDistance(t.position, e.position) <= conf.range);
            if (target) {
                 const totalDmg = (conf.baseDmg + (t.level * 5)) * (1 + gameState.towerDamageBuff / 100);
                 setProjectiles(prev => [...prev, { id: `p-${now}-${t.id}`, position: {...t.position}, targetId: target.id, speed: PROJECTILE_SPEED, damage: totalDmg, color: '#fff' }]);
                 soundManager.playShoot();
                 return { ...t, lastShot: now };
            }
        }
        return t;
    }));

    setCivilians(prev => prev.map(c => {
        let {x, y} = c.position;
        if (c.state === 'walking_in' && getDistance(c.position, WOOD_STORAGE_POS) < 5) {
             if (resources['wood'] > 0) {
                 setResources(r => ({...r, wood: r.wood - 1}));
                 setGameState(g => ({...g, gold: g.gold + 50}));
                 spawnParticle(x, y, 'text', '#fbbf24', '+50g');
                 return {...c, state: 'leaving'};
             }
             return {...c, state: 'leaving'};
        }
        if (c.state === 'walking_in') return {...c, position: moveTowards(c.position, WOOD_STORAGE_POS, c.speed)};
        return {...c, position: moveTowards(c.position, EXIT_POINT, c.speed)};
    }).filter(c => getDistance(c.position, EXIT_POINT) > 10));

    setCustomers(prev => prev.map((c, i) => {
        let target = i===0 ? COUNTER_POS : {x: COUNTER_POS.x-60-(i*20), y: COUNTER_POS.y-(i*30)+100}; // Xếp hàng bên trái
        if (c.state === 'walking_in' || c.state === 'waiting') {
            if (getDistance(c.position, target) < 5) return {...c, state: i===0 ? 'buying' : 'waiting'};
            return {...c, position: moveTowards(c.position, target, c.speed)};
        }
        if (c.state === 'buying') return {...c, position: COUNTER_POS};
        return {...c, position: moveTowards(c.position, EXIT_POINT, c.speed)};
    }).filter(c => getDistance(c.position, EXIT_POINT) > 10));

  }, [customers, civilians, enemies, towers, gameState, showTutorial, activeModal, levelUpModal, showExitConfirm, localUser.level, resources, noMeatWarning, lumberjackState, staff, walls]);

  useEffect(() => {
    const first = customers[0];
    if (first && first.state === 'buying' && gameState.cookedMeat > 0) {
      const earn = 15 + (upgrades.grill.level * 2);
      soundManager.playCoin();
      spawnParticle(COUNTER_POS.x, COUNTER_POS.y, 'text', '#fbbf24', `+${earn}g`);
      addExp(10); updateQuestProgress('earn', earn);
      setGameState(prev => ({ ...prev, cookedMeat: prev.cookedMeat - 1, gold: prev.gold + earn }));
      setCustomers(prev => { const n = [...prev]; n[0] = { ...n[0], state: 'leaving' }; return n; });
    }
  }, [customers, gameState.cookedMeat]);

  useEffect(() => {
    const loop = () => { tick(); requestRef.current = requestAnimationFrame(loop); };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [tick]);

  const handleTowerSlotClick = (id: number) => { setSelectedSlotId(id); setActiveModal('build_tower'); };
  const buildOrUpgradeTower = (type: TowerType) => {
      if (selectedSlotId === null) return;
      const existing = towers.find(t => t.slotId === selectedSlotId);
      const conf = TOWER_TYPES[type];
      const cost = existing ? Math.floor(conf.baseCost * Math.pow(1.5, existing.level)) : conf.baseCost;
      if (gameState.gold >= cost) {
          setGameState(p => ({...p, gold: p.gold - cost}));
          if (existing) {
              setTowers(p => p.map(t => t.slotId === selectedSlotId ? {...t, level: t.level+1} : t));
              spawnParticle(TOWER_SLOTS[selectedSlotId].x, TOWER_SLOTS[selectedSlotId].y, 'text', '#fbbf24', 'UPGRADE!');
          } else {
              setTowers(p => [...p, { id: `t-${Date.now()}`, slotId: selectedSlotId, type, level: 1, position: TOWER_SLOTS[selectedSlotId], lastShot: 0 }]);
              spawnParticle(TOWER_SLOTS[selectedSlotId].x, TOWER_SLOTS[selectedSlotId].y, 'text', '#fbbf24', 'NEW!');
          }
          soundManager.playCoin(); setActiveModal('none');
      }
  };

  const hireStaff = (type: keyof StaffLevels) => {
      const cost = Math.floor(STAFF_COSTS[type].base * Math.pow(STAFF_COSTS[type].scale, staff[type]));
      if (gameState.gold >= cost) {
          setGameState(p => ({...p, gold: p.gold - cost}));
          setStaff(p => ({...p, [type]: p[type]+1}));
          soundManager.playCoin();
      }
  };

  const triggerUltimate = () => {
      if (gameState.mana >= gameState.maxMana) {
          soundManager.playUltimate(); setGameState(p => ({...p, mana: 0})); setUltimateActive(true);
          setTimeout(() => setUltimateActive(false), 1500);
          setEnemies(p => p.map(e => ({...e, hp: e.hp - 500})));
      }
  };

  const handleExit = () => { localUser.staffLevels = staff; localUser.savedResources = resources; onExit(gameState.gold, gameState.ruby); };
  const getSeasonIcon = () => {
      if (gameState.season === 'spring') return <Leaf className="text-pink-400" size={20}/>;
      if (gameState.season === 'summer') return <Sun className="text-yellow-400" size={20}/>;
      if (gameState.season === 'autumn') return <Leaf className="text-orange-500" size={20}/>;
      return <Snowflake className="text-blue-200" size={20}/>;
  }

  return (
    <div className="w-full h-full bg-[#0f111a] flex items-center justify-center overflow-hidden relative">
      <EntitiesStyle /> 
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
          <div className="relative shadow-2xl overflow-hidden border-4 border-stone-800 rounded-xl" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            <GameMap season={gameState.season} />
            
            <div className="absolute inset-0 z-10 pointer-events-none">
                {walls.map(w => <WallEntity key={w.id} x={WALL_X} y={w.y} hp={w.hp} maxHp={w.maxHp} level={wallLevel} />)}
            </div>
            {walls.length > 0 && (
                <button onClick={upgradeWall} className="absolute bg-blue-700 hover:bg-blue-600 text-white text-[10px] px-2 py-1 rounded-lg font-bold border border-blue-400 shadow-lg z-50 flex items-center gap-1 animate-bounce" style={{ left: WALL_X - 30, top: 15 }}>
                    <ArrowUpCircle size={12}/> UP ({formatNumber(wallLevel*1000)}g)
                </button>
            )}

            <HouseEntity x={100} y={200} />
            <HouseEntity x={150} y={400} />
            <HouseEntity x={80} y={550} />
            <WarehouseEntity x={WOOD_STORAGE_POS.x} y={WOOD_STORAGE_POS.y} />

            {trees.map(t => <TreeEntity key={t.id} x={t.x} y={t.y} hp={t.hp} />)}
            {staff.lumberjack > 0 && <LumberjackEntity x={lumberjackState.position.x} y={lumberjackState.position.y} state={lumberjackState.state} />}
            {staff.chef > 0 && <ChefEntity x={GRILL_POS.x} y={GRILL_POS.y - 20} level={staff.chef} />}
            {staff.server > 0 && <ServerEntity x={COUNTER_POS.x - 30} y={COUNTER_POS.y} level={staff.server} />}
            {staff.collector > 0 && <CollectorEntity x={GAME_WIDTH/2} y={GAME_HEIGHT/2 + 50} level={staff.collector} />}

            {TOWER_SLOTS.map((slot, idx) => {
                const builtTower = towers.find(t => t.slotId === idx);
                return (
                    <div key={idx} className="absolute flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform" style={{ left: slot.x - 50, top: slot.y - 80, zIndex: slot.y }} onClick={() => handleTowerSlotClick(idx)}>
                        {builtTower ? <div className="relative pointer-events-none -mt-4"><TowerVisual type={builtTower.type} /></div> : <div className="w-12 h-12 flex items-center justify-center animate-pulse opacity-0 group-hover:opacity-100 transition-opacity"><Hammer size={24} className="text-white drop-shadow-md" /></div>}
                    </div>
                );
            })}

            <div className="absolute flex flex-col items-center cursor-pointer hover:scale-105" style={{ left: GRILL_POS.x - 70, top: GRILL_POS.y - 50, zIndex: GRILL_POS.y + 10 }} onClick={() => setActiveModal('staff_hire')}>
                 <div className="absolute -top-6 bg-black/80 px-2 py-0.5 rounded text-[10px] text-center z-50 border border-red-500 whitespace-nowrap"><span className="text-red-400 font-bold">Lò Lv.{upgrades.grill.level}</span></div>
                 <div className="w-36 h-20"></div> 
                 <div className="absolute top-2 w-full flex justify-around pointer-events-none">{Array.from({length: Math.min(3, gameState.cookedMeat)}).map((_, i) => <div key={i} className="animate-pulse"><Beef size={20} className="text-red-500 drop-shadow-md" /></div>)}</div>
            </div>

            <div className="absolute" style={{ left: COUNTER_POS.x - 40, top: COUNTER_POS.y - 40, zIndex: COUNTER_POS.y + 10 }}>
                {gameState.cookedMeat > 0 ? <div className="bg-white/90 rounded-full px-2 py-1 border border-black shadow-md flex items-center gap-1 animate-bounce"><Beef size={14} className="text-red-600"/><span className="font-bold text-xs text-black">{gameState.cookedMeat}</span></div> : <div className="bg-red-500/90 rounded-full px-2 py-1 border border-white shadow-md"><span className="font-bold text-[10px] text-white">HẾT HÀNG</span></div>}
            </div>

            <HeroEntity x={HERO_POS.x} y={HERO_POS.y} />
            {noMeatWarning && <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-red-900/90 border-2 border-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce z-[60]"><AlertCircle /> CẦN THỊT!</div>}

            {customers.map(c => <CustomerEntity key={c.id} customer={c} />)}
            {civilians.map(c => <CivilianEntity key={c.id} civilian={c} />)}
            {enemies.map(e => <EnemyEntity key={e.id} enemy={e} />)}
            {projectiles.map(p => <ProjectileEntity key={p.id} projectile={p} />)}
            {particles.map(p => <div key={p.id} className="absolute pointer-events-none font-black z-[100]" style={{ left: p.x, top: p.y, color: p.color, fontSize: p.size + 10, opacity: p.life, transform: 'translate(-50%, -50%)', textShadow: '1px 1px 0 #000' }}>{p.type === 'icon' || p.type === 'snow' || p.type === 'rain' || p.type === 'leaf' ? p.icon : p.text}</div>)}
            {ultimateActive && <div className="absolute inset-0 z-[200] pointer-events-none animate-pulse bg-red-500/20 flex items-center justify-center"><h1 className="text-6xl font-black text-red-500 drop-shadow-[0_4px_0_#000] animate-bounce">THIÊN THẠCH!!!</h1></div>}

            {/* --- UI HUD --- */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-50">
                <div className="flex justify-between items-start pointer-events-auto w-full">
                    <div className="flex gap-2 items-center">
                        <div className="bg-black/80 border border-stone-500 rounded-full px-3 py-1 flex items-center gap-2 h-10"><div className="text-sm font-bold text-stone-300">Lv.{localUser.level}</div></div>
                        <div className="bg-black/80 border border-yellow-500 rounded-full px-4 py-1 flex items-center gap-2 h-10"><Coins size={20} className="fill-yellow-500 text-yellow-500" /><span className="text-xl font-black text-yellow-400 font-sans">{formatNumber(gameState.gold)}</span></div>
                        <div className="bg-black/80 border border-blue-400 rounded-full px-4 py-1 flex items-center gap-2 h-10">{getSeasonIcon()}<span className="font-mono font-bold text-sm text-blue-200">{formatTime(gameState.gameTime.hour, gameState.gameTime.minute)}</span></div>
                    </div>
                    <div className="flex items-center gap-2">
                            <div className={`bg-black/80 border ${resources['prod_meat'] === 0 ? 'border-red-600 animate-pulse' : 'border-green-600'} rounded-full px-4 py-1 flex items-center gap-2 h-10`}><Beef size={20} className="fill-red-900 text-red-500" /><span className="text-xl font-black text-white">{resources['prod_meat'] || 0}</span></div>
                            <button onClick={() => setShowExitConfirm(true)} className="bg-red-600 hover:bg-red-500 rounded-lg p-2 text-white shadow-md transition-transform active:scale-95"><ArrowLeftCircle size={24}/></button>
                    </div>
                </div>
                {guideMessage && <div className="absolute top-20 left-4 max-w-[250px] animate-in slide-in-from-left duration-500 pointer-events-none z-[60]"><div className="bg-stone-900/90 border-2 border-purple-500 p-3 rounded-xl rounded-tl-none shadow-xl flex flex-col"><p className="text-yellow-300 font-bold text-xs uppercase mb-1">Tiểu Quỷ mách:</p><p className="text-white text-sm font-medium leading-tight">{guideMessage}</p></div></div>}
                
                {/* Danh Sách Nhiệm Vụ */}
                <div className="absolute top-16 left-4 flex flex-col gap-2 pointer-events-none">
                    {quests.map(q => (
                        <div key={q.id} className="bg-black/60 border-l-4 border-yellow-500 p-2 rounded w-48 text-white">
                            <div className="flex justify-between items-center text-xs font-bold text-yellow-400">
                                <span>{q.description}</span>
                                <span>{q.type==='kill' ? <Gem size={10} className="inline text-red-500"/> : <Coins size={10} className="inline text-yellow-500"/>}</span>
                            </div>
                            <div className="w-full bg-gray-700 h-1 mt-1 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full transition-all duration-500" style={{width: `${(q.currentAmount/q.targetAmount)*100}%`}}></div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="absolute top-20 right-4 bg-black/50 text-white p-2 rounded border border-red-500 animate-pulse flex items-center gap-2 pointer-events-none"><ShieldAlert className="text-red-500"/><span className="font-bold text-xs">BẢO VỆ TƯỜNG THÀNH!</span></div>

                <div className="flex items-end justify-center w-full pointer-events-auto relative h-16">
                        <button onClick={() => setActiveModal('staff_hire')} className="absolute left-0 bottom-0 bg-stone-800 border-2 border-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-700 shadow-xl text-sm transition-transform active:scale-95"><Users size={20} className="text-blue-300"/> TUYỂN NV</button>
                        <div className="absolute right-0 bottom-0 flex flex-col items-center gap-1">
                            <div className="w-4 h-24 bg-stone-900 rounded-full border-2 border-stone-600 relative overflow-hidden"><div className="absolute bottom-0 w-full bg-cyan-500 transition-all duration-300" style={{ height: `${(gameState.mana / gameState.maxMana) * 100}%` }}></div></div>
                            <button onClick={triggerUltimate} disabled={gameState.mana < gameState.maxMana} className={`w-14 h-14 rounded-full border-4 shadow-xl flex items-center justify-center transition-all ${gameState.mana >= gameState.maxMana ? 'bg-red-600 border-red-400 hover:scale-110 animate-[bounce_1s_infinite] cursor-pointer' : 'bg-stone-800 border-stone-600 opacity-50 cursor-not-allowed'}`}><Flame size={28} className={gameState.mana >= gameState.maxMana ? "text-yellow-300 fill-yellow-500 animate-pulse" : "text-stone-500"} /></button>
                        </div>
                </div>
            </div>
          </div>
      </div>

      {showTutorial && <TutorialSystem onComplete={() => { setShowTutorial(false); setLocalUser(prev => ({...prev, tutorialCompleted: true})); localStorage.setItem('moon_defense_user_' + user.username, JSON.stringify({...user, tutorialCompleted: true})); }} />}

      {activeModal === 'build_tower' && selectedSlotId !== null && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-[#1e293b] rounded-2xl border-2 border-blue-900 p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{transform: `scale(${1/scale})`}}>
                   <div className="flex justify-between items-center mb-4 border-b border-stone-700 pb-2"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Crown size={18} className="text-yellow-500"/> Triệu Hồi</h3><button onClick={() => { setActiveModal('none'); setSelectedSlotId(null); }}><X size={18} className="text-white"/></button></div>
                   <div className="grid grid-cols-1 gap-2">
                       {Object.values(TOWER_TYPES).map((tower) => {
                           const existing = towers.find(t => t.slotId === selectedSlotId);
                           const isLocked = localUser.level < tower.unlockLevel;
                           const isCurrent = existing && existing.type === tower.id;
                           const upgradeCost = existing ? Math.floor(tower.baseCost * Math.pow(1.5, existing.level)) : tower.baseCost;
                           return (
                               <button key={tower.id} disabled={isLocked || (!!existing && !isCurrent)} onClick={() => buildOrUpgradeTower(tower.id)} className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isLocked ? 'bg-stone-900 border-stone-800 opacity-50' : (existing && !isCurrent) ? 'bg-stone-900 border-stone-800 opacity-30' : 'bg-stone-800 border-stone-600 hover:border-yellow-500'}`}>
                                   <div className="flex items-center gap-3"><div className={`w-12 h-12 rounded-lg flex items-center justify-center border border-stone-600 bg-stone-900`}><div className="transform scale-50"><TowerVisual type={tower.id as TowerType} /></div></div><div className="text-left"><div className="font-bold text-white text-sm">{tower.name} {existing && isCurrent && `(Lv.${existing.level})`}</div><div className="text-[10px] text-stone-400">{tower.desc}</div></div></div>
                                   {!isLocked && (!existing || isCurrent) && (<div className="flex flex-col items-end"><div className="text-yellow-500 font-bold flex items-center gap-1 text-xs"><Coins size={12}/> {formatNumber(upgradeCost)}</div></div>)}
                               </button>
                           )
                       })}
                   </div>
               </div>
          </div>
      )}

      {activeModal === 'staff_hire' && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-[#1e293b] rounded-2xl border-2 border-amber-900 p-4 max-w-2xl w-full max-h-[90vh] overflow-y-auto" style={{transform: `scale(${1/scale})`}}>
                   <div className="flex justify-between items-center mb-4 border-b border-stone-700 pb-2"><h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-amber-500"/> Tuyển Dụng</h3><button onClick={() => setActiveModal('none')}><X size={18} className="text-white"/></button></div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[{ id: 'chef', name: 'Đầu Bếp', desc: 'Nướng nhanh hơn.', icon: <Flame className="text-red-500"/> }, { id: 'server', name: 'Bồi Bàn', desc: 'Phục vụ nhiều khách.', icon: <Users className="text-blue-500"/> }, { id: 'lumberjack', name: 'Thợ Gỗ', desc: 'Tự động chặt gỗ.', icon: <Trees className="text-green-500"/> }, { id: 'collector', name: 'Hút Vàng', desc: 'Tự động nhặt vàng.', icon: <Gem className="text-yellow-500"/> }].map((s) => {
                            const type = s.id as keyof StaffLevels; const level = staff[type]; const cost = Math.floor(STAFF_COSTS[type].base * Math.pow(STAFF_COSTS[type].scale, level));
                            return (
                                <div key={s.id} className="bg-stone-800 p-3 rounded-xl border border-stone-700 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-1"><div className="flex items-center gap-2"><div className="bg-black/40 p-2 rounded-lg">{s.icon}</div><div><h4 className="font-bold text-white text-sm">{s.name}</h4><div className="text-[10px] text-stone-400">Lv: {level}</div></div></div></div>
                                    <p className="text-[10px] text-stone-500 mb-2 h-4">{s.desc}</p>
                                    <button onClick={() => hireStaff(type)} className="w-full bg-amber-700 hover:bg-amber-600 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 text-xs"><Coins size={12}/> {formatNumber(cost)} - Up</button>
                                </div>
                            )
                        })}
                   </div>
               </div>
          </div>
      )}

      {showExitConfirm && <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/90 p-4"><div className="bg-stone-800 p-6 rounded-xl text-center border-2 border-stone-600" style={{transform: `scale(${1/scale})`}}><h3 className="text-white text-lg font-bold mb-2">Về Sảnh Chờ?</h3><p className="text-stone-400 mb-4 text-sm">Nhận được: <span className="text-yellow-400 font-bold">{gameState.gold - user.gold} Vàng</span></p><div className="flex gap-4 justify-center"><button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 bg-stone-600 text-white rounded-lg text-sm">Ở lại</button><button onClick={handleExit} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Thoát</button></div></div></div>}
      {levelUpModal && <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in duration-300"><div className="bg-stone-900 rounded-xl p-6 text-center border-4 border-yellow-400 relative" style={{transform: `scale(${1/scale})`}}><h2 className="text-3xl font-black text-white mb-2 font-['Mali'] uppercase">Lên Cấp!</h2><div className="flex items-center justify-center gap-4 text-xl font-bold text-stone-300 mb-4"><span>Lv.{levelUpModal.oldLevel}</span><ArrowUpCircle size={24} className="text-green-500 animate-bounce" /><span className="text-yellow-400 text-3xl">Lv.{levelUpModal.newLevel}</span></div><button onClick={() => setLevelUpModal(null)} className="bg-green-600 text-white py-2 px-6 rounded-full font-black text-lg">Tiếp Tục</button></div></div>}
    </div>
  );
};