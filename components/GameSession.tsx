
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
    Coins, Beef, ArrowUpCircle, X, LogOut, Gem, 
    Zap, Flame, Star, Ghost, MessageCircle, Shield, Hammer,
    AlertCircle, Users, Axe, Trees, Crown, CloudRain, Sun, Snowflake, Leaf, Calendar, Clock
} from 'lucide-react';
import { GameMap } from './GameMap';
import { 
    CustomerEntity, EnemyEntity, ProjectileEntity, HeroEntity, TowerVisual,
    LumberjackEntity, ChefEntity, ServerEntity, CollectorEntity, TreeEntity, CivilianEntity
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
  COUNTER_POS, SPAWN_POINT, EXIT_POINT, 
  INITIAL_UPGRADES, CUSTOMER_SPEED, ENEMY_SPAWN, ENEMY_SPEED,
  TOWER_SLOTS, PROJECTILE_SPEED, GRILL_POS, HERO_POS,
  TOWER_TYPES, ENEMY_SPAWN_RATE, CROPS,
  FOREST_AREA, WOOD_STORAGE_POS, LUMBERJACK_HUT, STAFF_COSTS,
  SEASON_DURATION
} from '../constants';
import { soundManager } from '../utils/audio';

interface GameSessionProps {
    user: UserProfile;
    difficulty: GameDifficulty;
    onExit: (earnedGold: number, earnedRuby: number) => void;
}

const calculateGameTime = (): { season: Season, timeLeft: number, clock: GameClock } => {
    const now = new Date();
    const msToday = now.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    
    const seasonBlockMs = 6 * 60 * 60 * 1000; 
    const seasonIdx = Math.floor(msToday / seasonBlockMs); 
    const seasons: Season[] = ['spring', 'summer', 'autumn', 'winter'];
    const season = seasons[seasonIdx];
    
    const msInCurrentSeason = msToday % seasonBlockMs;
    const timeLeft = Math.floor((seasonBlockMs - msInCurrentSeason) / 1000);

    const dayProgress = msToday / 86400000;
    const totalGameDaysPassed = Math.floor(dayProgress * 360);
    
    const gameMonth = Math.floor(totalGameDaysPassed / 30) + 1;
    const gameDay = (totalGameDaysPassed % 30) + 1;
    
    const gameYear = 1 + Math.floor(Date.now() / 86400000);

    const msPerGameDay = 240000; 
    const msInCurrentGameDay = msToday % msPerGameDay;
    const gameTimeProgress = msInCurrentGameDay / msPerGameDay;
    
    const gameHour = Math.floor(gameTimeProgress * 24);
    const gameMinute = Math.floor((gameTimeProgress * 1440) % 60);

    return {
        season,
        timeLeft,
        clock: { day: gameDay, month: gameMonth, year: gameYear, hour: gameHour, minute: gameMinute }
    };
};

const formatTime = (h: number, m: number) => `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

export const GameSession: React.FC<GameSessionProps> = ({ user, difficulty, onExit }) => {
  const isHardcore = difficulty === 'hardcore';
  const ENEMY_HP_MULTIPLIER = isHardcore ? 1.5 : 1.0;
  
  // --- STATE ---
  const [localUser, setLocalUser] = useState<UserProfile>(user);
  
  const [resources, setResources] = useState<Resources>(user.savedResources || { 'prod_meat': 0, 'wood': 0 });
  const [staff, setStaff] = useState<StaffLevels>(user.staffLevels || { chef: 0, server: 0, lumberjack: 0, collector: 0 });

  const initialTimeData = calculateGameTime();

  const [gameState, setGameState] = useState<GameState>({
    gold: user.gold, 
    ruby: user.ruby,
    cookedMeat: 5, 
    meatCapacity: 20 + (staff.chef * 10),
    towerDamageBuff: 0,
    grillSpeedBuff: 0,
    lastTick: Date.now(),
    mana: 0,
    maxMana: 100,
    season: initialTimeData.season,
    seasonTimer: initialTimeData.timeLeft,
    gameTime: initialTimeData.clock
  });

  const [quests, setQuests] = useState<Quest[]>([]);
  const [upgrades, setUpgrades] = useState<UpgradeConfig>(INITIAL_UPGRADES);
  
  const [towers, setTowers] = useState<BuiltTower[]>([]);
  const [selectedSlotId, setSelectedSlotId] = useState<number | null>(null);

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [civilians, setCivilians] = useState<Civilian[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]); 
  
  const [lumberjackState, setLumberjackState] = useState<LumberjackState>({ 
      state: 'idle', 
      position: LUMBERJACK_HUT, 
      targetTreeIndex: null 
  });
  const [trees, setTrees] = useState(Array.from({length: 5}).map((_, i) => ({ 
      id: i, 
      x: FOREST_AREA.x + (Math.random() * 100), 
      y: FOREST_AREA.y + (Math.random() * 100), 
      hp: 100 
  })));

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

  useEffect(() => {
    if (!user.tutorialCompleted) setShowTutorial(true);
    generateNewQuest(); 

    if (user.level > 1 && towers.length === 0) {
        setTowers([{
            id: 'init-tower',
            slotId: 0,
            type: 'ice',
            level: 1,
            position: TOWER_SLOTS[0],
            lastShot: 0
        }]);
    }

    const handleResize = () => {
      const wRatio = window.innerWidth / GAME_WIDTH;
      const hRatio = window.innerHeight / GAME_HEIGHT;
      const scale = Math.min(wRatio, hRatio) * 0.98; 
      setScale(scale);
    };
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const generateNewQuest = () => {
      const types: Quest['type'][] = ['kill', 'earn'];
      const type = types[Math.floor(Math.random() * types.length)];
      const id = Date.now().toString();
      let quest: Quest;
      const scale = Math.max(1, localUser.level);

      switch(type) {
          case 'kill':
              const amountK = 10 + Math.floor(Math.random() * 10 * scale);
              quest = {
                  id, type, targetAmount: amountK, currentAmount: 0, isCompleted: false,
                  description: `Tiêu diệt ${amountK} quái vật`,
                  rewardGold: amountK * 15 * scale, rewardRuby: 2
              };
              break;
          case 'earn':
              const amountE = 500 * scale + Math.floor(Math.random() * 500);
              quest = {
                  id, type, targetAmount: amountE, currentAmount: 0, isCompleted: false,
                  description: `Kiếm ${amountE} vàng`,
                  rewardGold: Math.floor(amountE * 0.2), rewardRuby: 1
              };
              break;
          default: quest = { id, type: 'kill', description: 'Error', targetAmount: 1, currentAmount: 0, isCompleted: true, rewardGold: 0, rewardRuby: 0 };
      }
      setQuests(prev => {
          if (prev.filter(q => !q.isCompleted).length >= 3) return prev;
          return [...prev, quest];
      });
  };

  const updateQuestProgress = (type: Quest['type'], amount: number) => {
      setQuests(prev => prev.map(q => {
          if (q.isCompleted) return q;
          if (q.type === type) {
              const newAmount = q.currentAmount + amount;
              if (newAmount >= q.targetAmount) {
                  soundManager.playCoin();
                  return { ...q, currentAmount: q.targetAmount, isCompleted: true };
              }
              return { ...q, currentAmount: newAmount };
          }
          return q;
      }));
  };

  const getDistance = (p1: Vector2, p2: Vector2) => Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  const moveTowards = (current: Vector2, target: Vector2, speed: number): Vector2 => {
    const dist = getDistance(current, target);
    if (dist <= speed) return target;
    const ratio = speed / dist;
    return { x: current.x + (target.x - current.x) * ratio, y: current.y + (target.y - current.y) * ratio };
  };

  const spawnParticle = (x: number, y: number, type: Particle['type'], color: string, text?: string, icon?: any) => {
    setParticles(prev => [...prev, {
      id: Math.random().toString(),
      x, y,
      vx: (Math.random() - 0.5) * 4,
      vy: type === 'snow' || type === 'rain' || type === 'leaf' ? Math.random() * 2 + 1 : -Math.random() * 4 - 2,
      life: type === 'snow' || type === 'rain' || type === 'leaf' ? 3.0 : 1.0,
      maxLife: type === 'snow' || type === 'rain' || type === 'leaf' ? 3.0 : 1.0,
      color,
      size: Math.random() * 5 + 2,
      type,
      text,
      icon
    }]);
  };

  const addExp = (amount: number) => {
      const xpNeeded = localUser.level * 100;
      let newExp = localUser.exp + amount;
      let newLevel = localUser.level;
      let didLevelUp = false;

      if (newExp >= xpNeeded) {
          newExp -= xpNeeded;
          newLevel++;
          didLevelUp = true;
          soundManager.playUltimate(); 
      }

      setLocalUser(prev => ({ ...prev, level: newLevel, exp: newExp }));
      if (didLevelUp) {
          setLevelUpModal({ show: true, oldLevel: newLevel - 1, newLevel: newLevel });
          setGameState(prev => ({ ...prev, ruby: prev.ruby + 20, gold: prev.gold + 200 }));
      }
  };

  const tick = useCallback(() => {
    if (showTutorial || activeModal !== 'none' || levelUpModal || showExitConfirm) return;

    const now = Date.now();
    
    if (now - lastTimeCheck.current > 100) {
        setGameState(prev => {
            const timeData = calculateGameTime();
            if (timeData.season !== prev.season) {
                 let msg = "";
                 if (timeData.season === 'spring') msg = "Mùa Xuân đến! Cây cối đâm chồi.";
                 if (timeData.season === 'summer') msg = "Mùa Hè oi bức! Lũ dơi đang đến.";
                 if (timeData.season === 'autumn') msg = "Mùa Thu vàng! Cẩn thận xương khô.";
                 if (timeData.season === 'winter') msg = "Mùa Đông giá rét! Băng giá bao phủ.";
                 soundManager.speak(msg, 'guide');
                 setGuideMessage(msg);
            }
            return { ...prev, season: timeData.season, seasonTimer: timeData.timeLeft, gameTime: timeData.clock };
        });
        lastTimeCheck.current = now;
    }

    if (Math.random() < 0.2) { 
        if (gameState.season === 'spring') spawnParticle(Math.random() * GAME_WIDTH, -10, 'leaf', '#f472b6', undefined, <Leaf size={10} className="text-pink-400 rotate-45" />);
        if (gameState.season === 'winter') spawnParticle(Math.random() * GAME_WIDTH, -10, 'snow', '#fff', undefined, <Snowflake size={10} className="text-white" />);
        if (gameState.season === 'autumn') spawnParticle(Math.random() * GAME_WIDTH, -10, 'leaf', '#ea580c', undefined, <Leaf size={10} className="text-orange-600 rotate-180" />);
        if (gameState.season === 'summer' && Math.random() < 0.05) spawnParticle(Math.random() * GAME_WIDTH, Math.random() * GAME_HEIGHT, 'spark', '#fbbf24');
    }

    if (localUser.level < 3 && now - lastGuideTip.current > 6000) {
        if (enemies.length > 5) setGuideMessage("Đông quá! Xây thêm tháp đi!");
        else if (resources['prod_meat'] === 0 && gameState.cookedMeat === 0) setGuideMessage("Hết thịt! Diệt quái hoặc trồng trọt ngay!");
        else setGuideMessage(null);
        lastGuideTip.current = now;
    }

    const MAX_CUSTOMERS = 10 + (staff.server * 2);
    if (now - lastCustomerSpawn.current > Math.max(1000, 3000 - (localUser.level * 100)) && customers.length < MAX_CUSTOMERS) {
      setCustomers(prev => [...prev, {
        id: `cust-${now}`, position: { ...SPAWN_POINT }, speed: CUSTOMER_SPEED + (staff.server * 0.1), state: 'walking_in', patience: 100 + (staff.server * 20), requestAmount: 1, skin: Math.random() > 0.5 ? 'barbarian' : 'wolf', type: 'warrior'
      }]);
      lastCustomerSpawn.current = now;
    }

    if (resources['wood'] > 0 && now - lastCivilianSpawn.current > 5000 && civilians.length < 5) {
        setCivilians(prev => [...prev, { id: `civ-${now}`, position: { ...SPAWN_POINT }, speed: CUSTOMER_SPEED * 0.8, state: 'walking_in', type: 'civilian' }]);
        lastCivilianSpawn.current = now;
    }

    const currentSpawnRate = Math.max(500, ENEMY_SPAWN_RATE - (localUser.level * 300));
    const MAX_ENEMIES = 50 + (localUser.level * 10);
    
    if (now - lastEnemySpawn.current > currentSpawnRate && enemies.length < MAX_ENEMIES) {
       let type: EnemyType = 'pumpkin';
       let speed = ENEMY_SPEED;
       let hpMulti = 1;
       if (gameState.season === 'spring') { if (Math.random() > 0.8) { type = 'skeleton'; speed *= 1.2; } } 
       else if (gameState.season === 'summer') { if (Math.random() > 0.5) { type = 'bat'; speed *= 2.0; hpMulti = 0.6; } else { type = 'pumpkin'; speed *= 1.5; } } 
       else if (gameState.season === 'autumn') { if (Math.random() > 0.4) { type = 'skeleton'; hpMulti = 1.3; } } 
       else if (gameState.season === 'winter') { type = 'ice_pumpkin'; hpMulti = 2.0; speed *= 0.7; }
       const baseHp = (100 + (localUser.level * 20)) * hpMulti;
       
       setEnemies(prev => [...prev, { id: `enemy-${now}`, position: { ...ENEMY_SPAWN }, speed: speed * (isHardcore ? 1.2 : 1), hp: baseHp * ENEMY_HP_MULTIPLIER, maxHp: baseHp * ENEMY_HP_MULTIPLIER, state: 'walking', type: type, isBoss: false, isFrozen: gameState.season === 'winter' }]);
       lastEnemySpawn.current = now;
    }

    if (localUser.level >= 5 && now - lastBossSpawn.current > 60000) {
         setEnemies(prev => [...prev, { id: `BOSS-${now}`, position: { ...ENEMY_SPAWN }, speed: ENEMY_SPEED * 0.4, hp: 3000 * (localUser.level / 2), maxHp: 3000 * (localUser.level / 2), state: 'walking', type: 'boss', isBoss: true }]);
         spawnParticle(GAME_WIDTH/2, GAME_HEIGHT/2, 'text', '#ef4444', 'BOSS XUẤT HIỆN!');
         soundManager.playUltimate();
         soundManager.speak("Boss đã xuất hiện! Cẩn thận!", "guide");
         lastBossSpawn.current = now;
    }

    const chefBoost = staff.chef * 500;
    const seasonBoost = gameState.season === 'summer' ? 500 : 0;
    const grillSpeed = Math.max(200, upgrades.grill.speed - chefBoost - seasonBoost - (gameState.grillSpeedBuff * 10));
    
    if (now - lastCookTime.current > grillSpeed && gameState.cookedMeat < gameState.meatCapacity) {
        if ((resources['prod_meat'] || 0) > 0) {
            setResources(prev => ({ ...prev, 'prod_meat': prev['prod_meat'] - 1 }));
            setGameState(prev => ({ ...prev, cookedMeat: Math.min(prev.cookedMeat + upgrades.grill.power, prev.meatCapacity) }));
            soundManager.playCook();
            spawnParticle(GRILL_POS.x, GRILL_POS.y, 'spark', '#ef4444');
            setNoMeatWarning(false);
        } else {
            if (!noMeatWarning) setNoMeatWarning(true);
        }
        lastCookTime.current = now;
    }

    setTowers(prevTowers => prevTowers.map(tower => {
        const conf = TOWER_TYPES[tower.type];
        const currentDmg = conf.baseDmg + (tower.level * 5) + (tower.type === 'fire' ? tower.level * 10 : 0);
        let currentSpeed = Math.max(200, conf.baseSpeed - (tower.level * 50));
        if (gameState.season === 'winter') currentSpeed *= 1.1;

        if (enemies.length > 0 && now - tower.lastShot > currentSpeed) {
            const target = enemies.find(e => getDistance(tower.position, e.position) <= conf.range);
            if (target) {
                 const totalDmg = currentDmg * (1 + gameState.towerDamageBuff / 100);
                 let effect: Projectile['effect'] = undefined;
                 let color = '#fff';
                 if (tower.type === 'ice') { effect = 'slow'; color = '#38bdf8'; }
                 else if (tower.type === 'fire') { effect = 'splash'; color = '#f97316'; }
                 else if (tower.type === 'archer') { color = '#fbbf24'; }
                 else if (tower.type === 'cannon') { effect = 'stun'; color = '#1e293b'; } 

                 setProjectiles(prev => [...prev, { id: `proj-${now}-${tower.id}`, position: { ...tower.position }, targetId: target.id, speed: PROJECTILE_SPEED, damage: totalDmg, effect, color }]);
                soundManager.playShoot();
                return { ...tower, lastShot: now };
            }
        }
        return tower;
    }));

    if (staff.lumberjack > 0 && now - lastLumberAction.current > 50) {
         let nextPos = lumberjackState.position;
         let nextState = lumberjackState.state;
         let nextTarget = lumberjackState.targetTreeIndex;
         const SPEED = 1.5 + (staff.lumberjack * 0.2);

         if (lumberjackState.state === 'idle') {
             const treeIdx = trees.findIndex(t => t.hp > 0);
             if (treeIdx !== -1) { nextState = 'walking_to_tree'; nextTarget = treeIdx; }
         } else if (lumberjackState.state === 'walking_to_tree' && nextTarget !== null) {
             const tree = trees[nextTarget];
             if (getDistance(lumberjackState.position, {x: tree.x, y: tree.y}) < 5) nextState = 'chopping';
             else nextPos = moveTowards(lumberjackState.position, {x: tree.x, y: tree.y}, SPEED);
         } else if (lumberjackState.state === 'chopping' && nextTarget !== null) {
              if (Math.random() < 0.1) { 
                  setTrees(prev => prev.map((t, i) => i === nextTarget ? { ...t, hp: t.hp - 10 } : t));
                  spawnParticle(trees[nextTarget].x, trees[nextTarget].y - 20, 'text', '#fbbf24', '-10', <Axe size={12}/>);
                  if (trees[nextTarget].hp <= 10) { 
                      nextState = 'walking_back';
                      setResources(prev => ({ ...prev, wood: (prev.wood || 0) + 5 })); 
                      spawnParticle(trees[nextTarget].x, trees[nextTarget].y - 40, 'text', '#854d0e', '+5 Gỗ');
                  }
              }
         } else if (lumberjackState.state === 'walking_back') {
             if (getDistance(lumberjackState.position, WOOD_STORAGE_POS) < 5) {
                 nextState = 'idle'; nextTarget = null;
                 if (trees.every(t => t.hp <= 0)) setTrees(prev => prev.map(t => ({...t, hp: 100})));
             } else nextPos = moveTowards(lumberjackState.position, WOOD_STORAGE_POS, SPEED);
         }
         setLumberjackState({ state: nextState, position: nextPos, targetTreeIndex: nextTarget });
         lastLumberAction.current = now;
    }

    setCivilians(prev => prev.map(civ => {
        let nextPos = civ.position;
        let nextState = civ.state;
        const TARGET = WOOD_STORAGE_POS;
        if (civ.state === 'walking_in') {
            if (getDistance(civ.position, TARGET) < 5) {
                if (resources['wood'] > 0) nextState = 'buying_wood';
                else nextState = 'leaving'; 
            } else nextPos = moveTowards(civ.position, TARGET, civ.speed);
        } else if (civ.state === 'buying_wood') {
             setResources(prev => ({ ...prev, wood: Math.max(0, prev.wood - 1) }));
             setGameState(prev => ({ ...prev, gold: prev.gold + 50 })); 
             spawnParticle(civ.position.x, civ.position.y, 'text', '#fbbf24', '+50g');
             nextState = 'leaving';
        } else if (civ.state === 'leaving') nextPos = moveTowards(civ.position, EXIT_POINT, civ.speed);
        return { ...civ, position: nextPos, state: nextState };
    }).filter(c => getDistance(c.position, EXIT_POINT) > 10));

    setCustomers(prev => prev.map((cust, index) => {
        let nextPos = cust.position;
        let nextState = cust.state;
        if (cust.state === 'walking_in' || cust.state === 'waiting') {
           if (index === 0) {
             if (getDistance(cust.position, COUNTER_POS) < 5) nextState = 'buying';
             else { nextPos = moveTowards(cust.position, COUNTER_POS, cust.speed); nextState = 'walking_in'; }
           } else {
             const queuePos = { x: COUNTER_POS.x + 60 + (index * 20), y: COUNTER_POS.y - (index * 30) + 100 }; 
             if (getDistance(cust.position, queuePos) < 5) nextState = 'waiting';
             else nextPos = moveTowards(cust.position, queuePos, cust.speed);
           }
        } else if (cust.state === 'buying') nextPos = COUNTER_POS;
        else if (cust.state === 'leaving') nextPos = moveTowards(cust.position, EXIT_POINT, cust.speed);
        return { ...cust, position: nextPos, state: nextState };
    }).filter(c => getDistance(c.position, EXIT_POINT) > 10));

    const pathTarget = { x: TOWER_SLOTS[0].x - 50, y: TOWER_SLOTS[0].y }; 
    setEnemies(prev => prev.map(enemy => {
         let target = pathTarget;
         if (enemy.type === 'bat') target = EXIT_POINT; 
         let nextPos = enemy.position;
         if (getDistance(enemy.position, target) > 10) nextPos = moveTowards(enemy.position, target, enemy.speed);
         else if (enemy.type !== 'bat') nextPos = moveTowards(enemy.position, EXIT_POINT, enemy.speed);
         return { ...enemy, position: nextPos };
    }).filter(e => e.hp > 0));

    setProjectiles(prev => {
      const activeProjs: Projectile[] = [];
      const hits: string[] = []; 
      prev.forEach(p => {
        const targetEnemy = enemies.find(e => e.id === p.targetId);
        if (!targetEnemy) return; 
        const dist = getDistance(p.position, targetEnemy.position);
        if (dist < 10) hits.push(p.targetId);
        else activeProjs.push({ ...p, position: moveTowards(p.position, targetEnemy.position, p.speed) });
      });
      if (hits.length > 0) {
        soundManager.playHit();
        setEnemies(old => old.map(e => {
          if (hits.includes(e.id)) {
             const hitter = prev.find(p => p.targetId === e.id);
             const dmg = hitter ? hitter.damage : 0;
             const effect = hitter ? hitter.effect : undefined;
             spawnParticle(e.position.x, e.position.y, 'text', '#f87171', `-${Math.floor(dmg)}`);
             let newSpeed = e.speed;
             if (effect === 'slow') newSpeed = e.speed * 0.7;
             if (effect === 'stun') newSpeed = 0.2; 
             let newHp = e.hp - dmg;
             if (e.isBoss) spawnParticle(e.position.x, e.position.y - 20, 'spark', '#ff0000');
             if (newHp <= 0) {
                 addExp(e.isBoss ? 100 : 5); updateQuestProgress('kill', 1);
                 if (Math.random() < 0.3) { setResources(r => ({ ...r, 'prod_meat': (r['prod_meat'] || 0) + 1 })); spawnParticle(e.position.x, e.position.y, 'text', '#ef4444', '+1 Thịt', <Beef size={12}/>); }
                 if (staff.collector > 0) { let goldDrop = 5 + (localUser.level); if (gameState.season === 'autumn') goldDrop = Math.floor(goldDrop * 1.5); setGameState(gs => ({...gs, gold: gs.gold + goldDrop})); spawnParticle(e.position.x, e.position.y - 10, 'text', '#fbbf24', `+${goldDrop}g`); }
                 setGameState(gs => ({ ...gs, mana: Math.min(gs.mana + (e.isBoss?50:10), gs.maxMana) }));
             }
             return { ...e, hp: newHp, speed: newSpeed };
          }
          const hitterSplash = prev.find(p => hits.includes(p.targetId) && p.effect === 'splash' && getDistance(p.position, e.position) < 100);
          if (hitterSplash && !hits.includes(e.id)) return { ...e, hp: e.hp - (hitterSplash.damage * 0.5) };
          return e;
        }));
      }
      return activeProjs;
    });

    setParticles(prev => prev.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, vy: p.vy + 0.1, life: p.life - 0.02 })).filter(p => p.life > 0));
    setGameState(prev => ({ ...prev, lastTick: now }));
  }, [customers, civilians, enemies, towers, gameState, showTutorial, activeModal, levelUpModal, showExitConfirm, localUser.level, resources, noMeatWarning, lumberjackState, staff]);

  useEffect(() => {
    const firstCustomer = customers[0];
    if (firstCustomer && firstCustomer.state === 'buying' && gameState.cookedMeat > 0) {
      const earnings = 15 + (upgrades.grill.level * 2);
      soundManager.playCoin();
      spawnParticle(COUNTER_POS.x, COUNTER_POS.y, 'text', '#fbbf24', `+${earnings}g`);
      addExp(10); updateQuestProgress('earn', earnings);
      setGameState(prev => ({ ...prev, cookedMeat: prev.cookedMeat - 1, gold: prev.gold + earnings }));
      setCustomers(prev => { const newCusts = [...prev]; newCusts[0] = { ...newCusts[0], state: 'leaving' }; return newCusts; });
    }
  }, [customers, gameState.cookedMeat]);

  useEffect(() => {
    const loop = () => { tick(); requestRef.current = requestAnimationFrame(loop); };
    requestRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(requestRef.current!);
  }, [tick]);

  const handleTowerSlotClick = (slotId: number) => { setSelectedSlotId(slotId); setActiveModal('build_tower'); };

  const buildOrUpgradeTower = (type: TowerType) => {
      if (selectedSlotId === null) return;
      const existing = towers.find(t => t.slotId === selectedSlotId);
      const conf = TOWER_TYPES[type];
      if (localUser.level < conf.unlockLevel) { alert(`Cần cấp độ ${conf.unlockLevel} để mở khóa!`); return; }
      if (existing) {
          if (existing.type !== type) { alert("Vị trí này đã có anh hùng khác trấn thủ!"); return; }
          const cost = Math.floor(conf.baseCost * Math.pow(1.5, existing.level));
          if (gameState.gold >= cost) {
              soundManager.playCoin(); setGameState(prev => ({ ...prev, gold: prev.gold - cost }));
              setTowers(prev => prev.map(t => t.slotId === selectedSlotId ? { ...t, level: t.level + 1 } : t));
              spawnParticle(existing.position.x, existing.position.y, 'text', '#fbbf24', 'UPGRADE!');
              if (type === 'ice') soundManager.speak("Sức mạnh băng giá tăng lên!", 'ice');
              if (type === 'fire') soundManager.speak("Ngọn lửa bùng cháy dữ dội hơn!", 'fire');
              if (type === 'archer') soundManager.speak("Mũi tên của ta sẽ nhanh hơn!", 'archer');
              if (type === 'cannon') soundManager.speak("Nạp thêm thuốc súng!", 'cannon');
              setActiveModal('none');
          }
      } else {
          if (gameState.gold >= conf.baseCost) {
              soundManager.playCoin(); setGameState(prev => ({ ...prev, gold: prev.gold - conf.baseCost }));
              setTowers(prev => [...prev, { id: `tower-${Date.now()}`, slotId: selectedSlotId, type: type, level: 1, position: TOWER_SLOTS[selectedSlotId], lastShot: 0 }]);
              spawnParticle(TOWER_SLOTS[selectedSlotId].x, TOWER_SLOTS[selectedSlotId].y, 'text', '#fbbf24', 'SUMMONED!');
              if (type === 'ice') soundManager.speak("Băng Nữ đã sẵn sàng! Đóng băng tất cả!", 'ice');
              if (type === 'fire') soundManager.speak("Hỏa Thần giáng thế! Thiêu rụi chúng!", 'fire');
              if (type === 'archer') soundManager.speak("Tinh Linh Xạ Thủ tham chiến!", 'archer');
              if (type === 'cannon') soundManager.speak("Đại bác sẵn sàng khai hỏa!", 'cannon');
              setActiveModal('none');
          }
      }
  };

  const hireStaff = (type: keyof StaffLevels) => {
      const currentLevel = staff[type];
      const cost = Math.floor(STAFF_COSTS[type].base * Math.pow(STAFF_COSTS[type].scale, currentLevel));
      if (gameState.gold >= cost) {
          soundManager.playCoin(); setGameState(prev => ({ ...prev, gold: prev.gold - cost }));
          setStaff(prev => ({ ...prev, [type]: prev[type] + 1 }));
          spawnParticle(GAME_WIDTH/2, GAME_HEIGHT/2, 'text', '#fbbf24', 'HIRED!');
          if (type === 'lumberjack') soundManager.speak("Tôi sẽ đi chặt gỗ ngay!", 'cannon'); 
          else soundManager.speak("Cảm ơn ông chủ!", 'guide');
      }
  };

  const triggerUltimate = () => {
      if (gameState.mana >= gameState.maxMana) {
          soundManager.playUltimate(); soundManager.speak("Thiên thạch hủy diệt!!!", 'fire');
          setGameState(prev => ({ ...prev, mana: 0 })); setUltimateActive(true);
          setTimeout(() => setUltimateActive(false), 1500);
          setEnemies(prev => prev.map(e => ({ ...e, hp: e.hp - 500 })));
      }
  };

  const handleExit = () => { localUser.staffLevels = staff; localUser.savedResources = resources; onExit(gameState.gold, gameState.ruby); };

  const getSeasonIcon = () => {
      switch(gameState.season) {
          case 'spring': return <Leaf className="text-pink-400" size={20}/>;
          case 'summer': return <Sun className="text-yellow-400" size={20}/>;
          case 'autumn': return <Leaf className="text-orange-500" size={20}/>;
          case 'winter': return <Snowflake className="text-blue-200" size={20}/>;
      }
  }

  return (
    <div className="w-full h-full bg-[#0f111a] flex items-center justify-center overflow-hidden relative">
      <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
          <div className="relative shadow-2xl overflow-hidden border-4 border-stone-800 rounded-xl" style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}>
            <GameMap season={gameState.season} />
            
            {trees.map(t => <TreeEntity key={t.id} x={t.x} y={t.y} hp={t.hp} />)}
            {staff.lumberjack > 0 && <LumberjackEntity x={lumberjackState.position.x} y={lumberjackState.position.y} state={lumberjackState.state} />}
            {staff.chef > 0 && <ChefEntity x={GRILL_POS.x} y={GRILL_POS.y - 20} level={staff.chef} />}
            {staff.server > 0 && <ServerEntity x={COUNTER_POS.x - 30} y={COUNTER_POS.y} level={staff.server} />}
            {staff.collector > 0 && <CollectorEntity x={GAME_WIDTH/2} y={GAME_HEIGHT/2 + 50} level={staff.collector} />}

            <div className="absolute flex flex-col items-center group cursor-pointer hover:scale-105 transition-transform" style={{ left: GRILL_POS.x - 70, top: GRILL_POS.y - 50, zIndex: GRILL_POS.y + 10 }} onClick={() => setActiveModal('staff_hire')}>
                 <div className="absolute -top-6 bg-black/80 px-2 py-0.5 rounded text-[10px] text-center z-50 border border-red-500 whitespace-nowrap"><span className="text-red-400 font-bold">Lò Lv.{upgrades.grill.level}</span></div>
                 <div className="w-36 h-20"></div> 
                 <div className="absolute top-2 w-full flex justify-around pointer-events-none">
                    {Array.from({length: Math.min(3, gameState.cookedMeat)}).map((_, i) => (
                       <div key={i} className="animate-pulse"><Beef size={20} className="text-red-500 drop-shadow-md" /></div>
                    ))}
                 </div>
            </div>

            {TOWER_SLOTS.map((slot, idx) => {
                const builtTower = towers.find(t => t.slotId === idx);
                return (
                    <div key={idx} className="absolute flex flex-col items-center group cursor-pointer hover:scale-110 transition-transform" style={{ left: slot.x - 50, top: slot.y - 80, zIndex: slot.y }} onClick={() => handleTowerSlotClick(idx)}>
                        {builtTower ? (
                             <div className="relative pointer-events-none -mt-4"><TowerVisual type={builtTower.type} /></div>
                        ) : (
                             <div className="w-12 h-12 flex items-center justify-center animate-pulse opacity-0 group-hover:opacity-100 transition-opacity">
                                 <Hammer size={24} className="text-white drop-shadow-md" />
                             </div>
                        )}
                    </div>
                );
            })}

            <div className="absolute" style={{ left: COUNTER_POS.x - 40, top: COUNTER_POS.y - 40, zIndex: COUNTER_POS.y + 10 }}>
                {gameState.cookedMeat > 0 ? (
                    <div className="bg-white/90 rounded-full px-2 py-1 border border-black shadow-md flex items-center gap-1 animate-bounce">
                        <Beef size={14} className="text-red-600"/><span className="font-bold text-xs text-black">{gameState.cookedMeat}</span>
                    </div>
                ) : (
                     <div className="bg-red-500/90 rounded-full px-2 py-1 border border-white shadow-md"><span className="font-bold text-[10px] text-white">HẾT HÀNG</span></div>
                )}
            </div>

            <HeroEntity x={HERO_POS.x} y={HERO_POS.y} />
            
            {noMeatWarning && (
                <div className="absolute top-32 left-1/2 -translate-x-1/2 bg-red-900/90 border-2 border-red-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 animate-bounce z-[60]">
                    <AlertCircle /> CẦN THỊT!
                </div>
            )}

            {customers.map(c => <CustomerEntity key={c.id} customer={c} />)}
            {civilians.map(c => <CivilianEntity key={c.id} civilian={c} />)}
            {enemies.map(e => <EnemyEntity key={e.id} enemy={e} />)}
            {projectiles.map(p => <ProjectileEntity key={p.id} projectile={p} />)}
            {particles.map(p => <div key={p.id} className="absolute pointer-events-none font-black z-[100]" style={{ left: p.x, top: p.y, color: p.color, fontSize: p.size + 10, opacity: p.life, transform: 'translate(-50%, -50%)', textShadow: '1px 1px 0 #000' }}>{p.type === 'icon' || p.type === 'snow' || p.type === 'rain' || p.type === 'leaf' ? p.icon : p.text}</div>)}
            {ultimateActive && <div className="absolute inset-0 z-[200] pointer-events-none animate-pulse bg-red-500/20 flex items-center justify-center"><h1 className="text-6xl font-black text-red-500 drop-shadow-[0_4px_0_#000] animate-bounce">THIÊN THẠCH!!!</h1></div>}

            {/* --- UI HUD (Inside Scaled Container) --- */}
            <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-50">
                {/* Top Stats */}
                <div className="flex justify-between items-start pointer-events-auto w-full">
                    <div className="flex gap-2 items-center">
                        <div className="bg-black/80 border border-stone-500 rounded-full px-3 py-1 flex items-center gap-2 h-10">
                            <div className="text-sm font-bold text-stone-300">Lv.{localUser.level}</div>
                        </div>
                        
                        <div className="bg-black/80 border border-yellow-500 rounded-full px-4 py-1 flex items-center gap-2 h-10">
                            <Coins size={20} className="fill-yellow-500 text-yellow-500" />
                            <span className="text-xl font-black text-yellow-400 font-sans">{gameState.gold.toLocaleString()}</span>
                        </div>

                        <div className="bg-black/80 border border-blue-400 rounded-full px-4 py-1 flex items-center gap-2 h-10">
                            {getSeasonIcon()}
                            <span className="font-mono font-bold text-sm text-blue-200">{formatTime(gameState.gameTime.hour, gameState.gameTime.minute)}</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                            <div className={`bg-black/80 border ${resources['prod_meat'] === 0 ? 'border-red-600 animate-pulse' : 'border-green-600'} rounded-full px-4 py-1 flex items-center gap-2 h-10`}>
                                    <Beef size={20} className="fill-red-900 text-red-500" />
                                    <span className="text-xl font-black text-white">{resources['prod_meat'] || 0}</span>
                            </div>
                            <button onClick={() => setShowExitConfirm(true)} className="bg-red-600 hover:bg-red-500 rounded-lg p-2 text-white shadow-md transition-transform active:scale-95"><LogOut size={24}/></button>
                    </div>
                </div>
                
                {/* Guide Message */}
                {guideMessage && (
                    <div className="absolute top-20 left-4 max-w-[250px] animate-in slide-in-from-left duration-500 pointer-events-none z-[60]">
                        <div className="bg-stone-900/90 border-2 border-purple-500 p-3 rounded-xl rounded-tl-none shadow-xl flex flex-col">
                            <p className="text-yellow-300 font-bold text-xs uppercase mb-1">Tiểu Quỷ mách:</p>
                            <p className="text-white text-sm font-medium leading-tight">{guideMessage}</p>
                        </div>
                    </div>
                )}

                {/* Bottom Bar */}
                <div className="flex items-end justify-center w-full pointer-events-auto relative h-16">
                        <button onClick={() => setActiveModal('staff_hire')} className="absolute left-0 bottom-0 bg-stone-800 border-2 border-blue-500 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-stone-700 shadow-xl text-sm transition-transform active:scale-95">
                            <Users size={20} className="text-blue-300"/> TUYỂN NV
                        </button>

                        <div className="absolute right-0 bottom-0 flex flex-col items-center gap-1">
                            <div className="w-4 h-24 bg-stone-900 rounded-full border-2 border-stone-600 relative overflow-hidden">
                                <div className="absolute bottom-0 w-full bg-cyan-500 transition-all duration-300" style={{ height: `${(gameState.mana / gameState.maxMana) * 100}%` }}></div>
                            </div>
                            <button onClick={triggerUltimate} disabled={gameState.mana < gameState.maxMana} className={`w-14 h-14 rounded-full border-4 shadow-xl flex items-center justify-center transition-all ${gameState.mana >= gameState.maxMana ? 'bg-red-600 border-red-400 hover:scale-110 animate-[bounce_1s_infinite] cursor-pointer' : 'bg-stone-800 border-stone-600 opacity-50 cursor-not-allowed'}`}>
                                <Flame size={28} className={gameState.mana >= gameState.maxMana ? "text-yellow-300 fill-yellow-500 animate-pulse" : "text-stone-500"} />
                            </button>
                        </div>
                </div>
            </div>

          </div>
      </div>

      {showTutorial && <TutorialSystem onComplete={() => { setShowTutorial(false); setLocalUser(prev => ({...prev, tutorialCompleted: true})); localStorage.setItem('moon_defense_user_' + user.username, JSON.stringify({...user, tutorialCompleted: true})); }} />}

      {activeModal === 'build_tower' && selectedSlotId !== null && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
               <div className="bg-[#1e293b] rounded-2xl border-2 border-blue-900 p-4 max-w-lg w-full max-h-[90vh] overflow-y-auto" style={{transform: `scale(${1/scale})`}}>
                   <div className="flex justify-between items-center mb-4 border-b border-stone-700 pb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2"><Crown size={18} className="text-yellow-500"/> Triệu Hồi</h3>
                       <button onClick={() => { setActiveModal('none'); setSelectedSlotId(null); }}><X size={18} className="text-white"/></button>
                   </div>
                   
                   <div className="grid grid-cols-1 gap-2">
                       {Object.values(TOWER_TYPES).map((tower) => {
                           const existing = towers.find(t => t.slotId === selectedSlotId);
                           const isLocked = localUser.level < tower.unlockLevel;
                           const isCurrent = existing && existing.type === tower.id;
                           const upgradeCost = existing ? Math.floor(tower.baseCost * Math.pow(1.5, existing.level)) : tower.baseCost;
                           return (
                               <button 
                                 key={tower.id}
                                 disabled={isLocked || (!!existing && !isCurrent)}
                                 onClick={() => buildOrUpgradeTower(tower.id)}
                                 className={`flex items-center justify-between p-2 rounded-xl border transition-all ${isLocked ? 'bg-stone-900 border-stone-800 opacity-50' : (existing && !isCurrent) ? 'bg-stone-900 border-stone-800 opacity-30' : 'bg-stone-800 border-stone-600 hover:border-yellow-500'}`}
                               >
                                   <div className="flex items-center gap-3">
                                       <div className={`w-12 h-12 rounded-lg flex items-center justify-center border border-stone-600 bg-stone-900`}><div className="transform scale-50"><TowerVisual type={tower.id as TowerType} /></div></div>
                                       <div className="text-left">
                                           <div className="font-bold text-white text-sm">{tower.name} {existing && isCurrent && `(Lv.${existing.level})`}</div>
                                           <div className="text-[10px] text-stone-400">{tower.desc}</div>
                                       </div>
                                   </div>
                                   {!isLocked && (!existing || isCurrent) && (
                                       <div className="flex flex-col items-end">
                                            <div className="text-yellow-500 font-bold flex items-center gap-1 text-xs"><Coins size={12}/> {upgradeCost}</div>
                                       </div>
                                   )}
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
                   <div className="flex justify-between items-center mb-4 border-b border-stone-700 pb-2">
                       <h3 className="text-lg font-bold text-white flex items-center gap-2"><Users size={18} className="text-amber-500"/> Tuyển Dụng</h3>
                       <button onClick={() => setActiveModal('none')}><X size={18} className="text-white"/></button>
                   </div>
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[{ id: 'chef', name: 'Đầu Bếp', desc: 'Nướng nhanh hơn.', icon: <Flame className="text-red-500"/> }, { id: 'server', name: 'Bồi Bàn', desc: 'Phục vụ nhiều khách.', icon: <Users className="text-blue-500"/> }, { id: 'lumberjack', name: 'Thợ Gỗ', desc: 'Tự động chặt gỗ.', icon: <Trees className="text-green-500"/> }, { id: 'collector', name: 'Hút Vàng', desc: 'Tự động nhặt vàng.', icon: <Gem className="text-yellow-500"/> }].map((s) => {
                            const type = s.id as keyof StaffLevels; const level = staff[type]; const cost = Math.floor(STAFF_COSTS[type].base * Math.pow(STAFF_COSTS[type].scale, level));
                            return (
                                <div key={s.id} className="bg-stone-800 p-3 rounded-xl border border-stone-700 flex flex-col justify-between">
                                    <div className="flex justify-between items-start mb-1">
                                        <div className="flex items-center gap-2">
                                            <div className="bg-black/40 p-2 rounded-lg">{s.icon}</div>
                                            <div><h4 className="font-bold text-white text-sm">{s.name}</h4><div className="text-[10px] text-stone-400">Lv: {level}</div></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-stone-500 mb-2 h-4">{s.desc}</p>
                                    <button onClick={() => hireStaff(type)} className="w-full bg-amber-700 hover:bg-amber-600 text-white py-1.5 rounded-lg font-bold flex items-center justify-center gap-1 text-xs"><Coins size={12}/> {cost} - Up</button>
                                </div>
                            )
                        })}
                   </div>
               </div>
          </div>
      )}

      {showExitConfirm && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center bg-black/90 p-4">
             <div className="bg-stone-800 p-6 rounded-xl text-center border-2 border-stone-600" style={{transform: `scale(${1/scale})`}}>
                 <h3 className="text-white text-lg font-bold mb-2">Về Sảnh Chờ?</h3>
                 <p className="text-stone-400 mb-4 text-sm">Nhận được: <span className="text-yellow-400 font-bold">{gameState.gold - user.gold} Vàng</span></p>
                 <div className="flex gap-4 justify-center">
                     <button onClick={() => setShowExitConfirm(false)} className="px-4 py-2 bg-stone-600 text-white rounded-lg text-sm">Ở lại</button>
                     <button onClick={handleExit} className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold text-sm">Thoát</button>
                 </div>
             </div>
        </div>
      )}

      {levelUpModal && (
          <div className="absolute inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in zoom-in duration-300">
              <div className="bg-stone-900 rounded-xl p-6 text-center border-4 border-yellow-400 relative" style={{transform: `scale(${1/scale})`}}>
                  <h2 className="text-3xl font-black text-white mb-2 font-['Mali'] uppercase">Lên Cấp!</h2>
                  <div className="flex items-center justify-center gap-4 text-xl font-bold text-stone-300 mb-4">
                      <span>Lv.{levelUpModal.oldLevel}</span><ArrowUpCircle size={24} className="text-green-500 animate-bounce" /><span className="text-yellow-400 text-3xl">Lv.{levelUpModal.newLevel}</span>
                  </div>
                  <button onClick={() => setLevelUpModal(null)} className="bg-green-600 text-white py-2 px-6 rounded-full font-black text-lg">Tiếp Tục</button>
              </div>
          </div>
      )}
    </div>
  );
};
