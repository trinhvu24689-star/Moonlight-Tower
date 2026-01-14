import React, { useState, useEffect } from 'react';
import { Auth } from './components/Auth';
import { Lobby } from './components/Lobby';
import { GameSession } from './components/GameSession';
import { FarmSession } from './components/FarmSession';
import { StoryPanel } from './components/StoryPanel';
import { Profile } from './components/Profile';
import { TopUp } from './components/TopUp';
import { IntroCinematic } from './components/IntroCinematic';
import { AdminPanel } from './components/AdminPanel'; 
import { MailBox } from './components/MailBox';       
import { PublisherIntro } from './components/PublisherIntro';
import { OrientationLock } from './components/OrientationLock'; 
// --- MỚI: Import bộ sưu tập Sprite để test ---
import { SpriteGallery } from './components/SpriteGallery'; 

import { GameDifficulty, GardenPlot, UserProfile, Resources } from './types';
import { ShoppingBag, Gift, Coins, Gem, Sprout, ArrowUpCircle, X, Shield, Zap, BellRing } from 'lucide-react';
import { soundManager } from './utils/audio';
import { saveUserData, redeemGiftcode } from './utils/db'; 

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Start with 'publisher-logo' instead of 'auth'
  const [screen, setScreen] = useState<'publisher-logo' | 'auth' | 'intro' | 'lobby' | 'game' | 'farm' | 'story'>('publisher-logo');
  
  const [activeOverlay, setActiveOverlay] = useState<'none' | 'profile' | 'topup' | 'shop' | 'gacha' | 'admin' | 'mail'>('none');
  const [difficulty, setDifficulty] = useState<GameDifficulty>('normal');
  const [notification, setNotification] = useState<string | null>(null);
  const [giftcode, setGiftcode] = useState('');

  // --- Real-time Playtime Tracker & AUTO SAVE (DB SYNC) ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (user) {
      // 1. Playtime Tracker
      interval = setInterval(() => {
        setUser(currentUser => {
          if (!currentUser) return null;
          
          const todayStr = new Date().toDateString();
          let newUser = { ...currentUser, playTime: currentUser.playTime + 1 };

          // Check if day changed while playing
          if (currentUser.lastActiveDate !== todayStr) {
             setNotification("🌅 Ngày mới bắt đầu! Reset thời gian chơi.");
             setTimeout(() => setNotification(null), 5000);
             newUser = { ...newUser, playTime: 0, lastActiveDate: todayStr };
          }
          return newUser;
        });
      }, 1000);

      // 2. Auto Save to DB every 30 seconds
      const saveInterval = setInterval(() => {
          if (user) saveUserData(user);
      }, 30000);

      return () => { clearInterval(interval); clearInterval(saveInterval); };
    }
  }, [user]);

  // Handle Publisher Logo Finish
  const handlePublisherIntroComplete = () => {
      setScreen('auth');
  };

  const handleLogin = (loggedInUser: UserProfile) => {
    setUser(loggedInUser);
    if (loggedInUser.hasSeenIntro === false) {
        setScreen('intro');
    } else {
        setScreen('lobby');
    }
  };

  const handleIntroComplete = () => {
      if (user) {
          const updatedUser = { ...user, hasSeenIntro: true };
          setUser(updatedUser);
          saveUserData(updatedUser); // Sync DB
          setScreen('lobby');
      }
  };

  const handleStartGame = (diff: GameDifficulty) => {
    setDifficulty(diff);
    setScreen('game');
  };

  const handleOpenFarm = () => {
    setScreen('farm');
  };

  // Generic exit handler for games
  const handleExitAny = (finalGold: number, finalRuby: number, currentPlots?: GardenPlot[], updatedResources?: Resources) => {
    if (user) {
      const updatedUser: UserProfile = { 
          ...user, 
          gold: finalGold, 
          ruby: finalRuby,
      };
      
      if (currentPlots) updatedUser.gardenPlots = currentPlots;
      if (updatedResources) updatedUser.savedResources = updatedResources;
      
      setUser(updatedUser);
      saveUserData(updatedUser); // Force Sync DB on exit
    }
    setScreen('lobby');
  };

  const handlePurchase = (rubyAmount: number, cost: number) => {
    if (user) {
      const updated = { ...user, ruby: user.ruby + rubyAmount };
      setUser(updated);
      saveUserData(updated);
      soundManager.playCoin();
      alert(`Đã nạp ${rubyAmount} Ruby thành công!`);
      setActiveOverlay('none');
    }
  };

  const handleClaimMailReward = (rewards: any) => {
      if (!user) return;
      let newUser = { ...user };
      
      let msg = [];
      if (rewards.gold) { newUser.gold += rewards.gold; msg.push(`${rewards.gold} Vàng`); }
      if (rewards.ruby) { newUser.ruby += rewards.ruby; msg.push(`${rewards.ruby} Ruby`); }
      if (rewards.items) { 
          newUser.inventory = [...newUser.inventory, ...rewards.items]; 
          msg.push(`${rewards.items.length} Vật phẩm`);
      }

      setUser(newUser);
      saveUserData(newUser);
      setNotification(`Đã nhận: ${msg.join(', ')}`);
      setTimeout(() => setNotification(null), 3000);
  };

  const handleRedeemCode = async () => {
      if (!user || !giftcode) return;
      const res = await redeemGiftcode(user.username, giftcode.trim());
      if (res.success) {
          alert(res.msg);
          setGiftcode('');
      } else {
          alert(res.msg);
      }
  };

  const handleLobbyShopBuy = (item: { id: string, name: string, cost: number, currency: 'gold' | 'ruby', desc: string }) => {
    if (!user) return;
    if (user.inventory.includes(item.id)) { alert("Bạn đã sở hữu!"); return; }

    let newUser = null;
    if (item.currency === 'gold') {
        if (user.gold >= item.cost) {
            newUser = { ...user, gold: user.gold - item.cost, inventory: [...user.inventory, item.id] };
        } else { soundManager.playHit(); alert("Không đủ vàng!"); }
    } else {
         if (user.ruby >= item.cost) {
            newUser = { ...user, ruby: user.ruby - item.cost, inventory: [...user.inventory, item.id] };
        } else { soundManager.playHit(); alert("Không đủ Ruby!"); }
    }

    if (newUser) {
        soundManager.playCoin();
        setUser(newUser);
        saveUserData(newUser);
    }
  };

  const handleLobbyGachaSpin = () => {
    if (!user) return;
    const COST = 100;

    if (user.ruby >= COST) {
        soundManager.playCoin();
        const rand = Math.random();
        let rewardName = '';
        let newUser = { ...user, ruby: user.ruby - COST };

        if (rand < 0.3) {
            newUser.gold += 500; rewardName = '500 Vàng';
        } else if (rand < 0.6) {
            newUser.gold += 1000; rewardName = '1000 Vàng';
        } else if (rand < 0.8) {
            newUser.ruby += 20; rewardName = '20 Ruby';
        } else if (rand < 0.95) {
            newUser.ruby += 150; rewardName = '150 Ruby';
        } else {
            if (!newUser.inventory.includes('crown_moon')) {
                newUser.inventory = [...newUser.inventory, 'crown_moon'];
                rewardName = 'Vương Miện Ánh Trăng';
            } else {
                newUser.ruby += 200;
                rewardName = '200 Ruby (Đã có Item)';
            }
        }
        setUser(newUser);
        saveUserData(newUser);
        alert(`KẾT QUẢ: ${rewardName}`);
    } else {
        soundManager.playHit();
        alert("Thiếu Ruby!");
    }
  };

  const renderLobbyOverlays = () => {
      if (activeOverlay === 'shop' && user) {
          return (
             <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                 <div className="w-full max-w-2xl bg-[#1e293b] rounded-2xl border-4 border-[#334155] p-6 flex flex-col max-h-[90vh]">
                    <div className="flex justify-between items-center mb-6 border-b border-stone-700 pb-4">
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2"><ShoppingBag className="text-indigo-400"/> Cửa Hàng</h2>
                        <button onClick={() => setActiveOverlay('none')}><X className="text-white"/></button>
                    </div>
                    {/* Items */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={() => handleLobbyShopBuy({id:'skin_ghost_red', name:'Bóng Ma Đỏ', cost:2000, currency:'gold', desc:'Trang phục'})} className="bg-stone-800 p-4 rounded text-white border border-stone-600">Mua Bóng Ma Đỏ (2000 Vàng)</button>
                    </div>
                 </div>
             </div>
          );
      }
      if (activeOverlay === 'gacha' && user) {
           return (
             <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
                 <div className="w-full max-w-sm bg-purple-900/90 rounded-2xl border-4 border-purple-500 p-6 text-center">
                    <div className="flex justify-between items-center mb-6"><h2 className="text-2xl font-bold text-white">Gacha</h2><button onClick={() => setActiveOverlay('none')}><X className="text-white"/></button></div>
                    <Gift size={80} className="text-pink-400 mx-auto mb-6 animate-bounce" />
                    <button onClick={handleLobbyGachaSpin} className="bg-gradient-to-r from-pink-600 to-purple-600 w-full py-3 rounded-xl font-black text-white">Quay (100 Ruby)</button>
                 </div>
             </div>
           )
      }
      return null;
  }

  return (
    <>
      {/* --- MỚI: Bật cái này lên để test ảnh. Test xong xóa dòng này đi --- */}
      <SpriteGallery />
      
      <OrientationLock /> {/* Add Orientation Lock Here */}

      {notification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-top duration-500">
              <div className="bg-stone-800 border-2 border-orange-500 text-white px-6 py-3 rounded-full shadow-lg flex items-center gap-3 font-bold">
                  <BellRing className="text-orange-500 animate-pulse" />
                  {notification}
              </div>
          </div>
      )}
      
      {/* 1. PUBLISHER LOGO SCREEN */}
      {screen === 'publisher-logo' && <PublisherIntro onComplete={handlePublisherIntroComplete} />}

      {/* 2. AUTH SCREEN */}
      {screen === 'auth' && <Auth onLogin={handleLogin} />}

      {/* 3. INTRO CINEMATIC */}
      {screen === 'intro' && <IntroCinematic onComplete={handleIntroComplete} />}

      {/* 4. MAIN LOBBY */}
      {screen === 'lobby' && user && (
        <>
            <Lobby 
              user={user}
              onStartGame={handleStartGame} 
              onOpenFarm={handleOpenFarm}
              onOpenStory={() => setScreen('story')}
              onOpenProfile={() => setActiveOverlay('profile')}
              onOpenTopUp={() => setActiveOverlay('topup')}
              onOpenShop={() => setActiveOverlay('shop')}
              onOpenGacha={() => setActiveOverlay('gacha')}
              onOpenMail={() => setActiveOverlay('mail')}
              onOpenAdmin={() => {
                  if (user.role === 'nph') {
                      setActiveOverlay('admin'); // Bypass password for NPH
                  } else {
                      const pass = prompt("Nhập mật khẩu Admin:");
                      if (pass === "admin123") setActiveOverlay('admin');
                      else alert("Sai mật khẩu!");
                  }
              }}
            />
            
            {activeOverlay === 'profile' && (
                <div className="absolute z-[150] inset-0">
                    <Profile user={user} onClose={() => setActiveOverlay('none')} onLogout={() => { setUser(null); setScreen('auth'); }} />
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-stone-900 p-4 rounded-xl border border-yellow-600 z-[160] flex gap-2">
                        <input type="text" placeholder="Nhập Giftcode..." className="bg-black text-white p-2 rounded" value={giftcode} onChange={e => setGiftcode(e.target.value)} />
                        <button onClick={handleRedeemCode} className="bg-yellow-600 px-4 rounded font-bold text-white">Đổi</button>
                    </div>
                </div>
            )}

            {activeOverlay === 'topup' && <TopUp currentUser={user.username} onClose={() => setActiveOverlay('none')} onPurchase={handlePurchase} />}
            {activeOverlay === 'admin' && <AdminPanel onClose={() => setActiveOverlay('none')} />}
            {activeOverlay === 'mail' && <MailBox username={user.username} onClose={() => setActiveOverlay('none')} onClaimReward={handleClaimMailReward} />}
            {renderLobbyOverlays()}
        </>
      )}
      
      {/* 5. GAME MODES */}
      {screen === 'game' && user && (
        <GameSession 
          user={user}
          difficulty={difficulty} 
          onExit={(g, r) => handleExitAny(g, r)}
        />
      )}

      {screen === 'farm' && user && (
        <FarmSession 
          user={user} 
          onExit={(g, r, plots, res) => handleExitAny(g, r, plots, res)} 
        />
      )}

      {screen === 'story' && (
        <StoryPanel onClose={() => setScreen(user ? 'lobby' : 'auth')} />
      )}
    </>
  );
};

export default App;