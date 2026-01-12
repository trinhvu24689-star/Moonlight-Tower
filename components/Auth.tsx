
import React, { useState, useEffect } from 'react';
import { Ghost, ArrowRight, AlertCircle, Loader2, Globe, ChevronDown, Check, Signal } from 'lucide-react';
import { UserProfile, ServerInfo } from '../types';
import { soundManager } from '../utils/audio';
import { getUserData, saveUserData } from '../utils/db';
import { generateServerList } from '../utils/serverSystem';

interface AuthProps {
  onLogin: (user: UserProfile) => void;
}

export const Auth: React.FC<AuthProps> = ({ onLogin }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Server Logic
  const [serverList, setServerList] = useState<ServerInfo[]>([]);
  const [selectedServer, setSelectedServer] = useState<ServerInfo | null>(null);
  const [showServerList, setShowServerList] = useState(false);
  const [activeRegion, setActiveRegion] = useState<string>('Asia');

  useEffect(() => {
      const list = generateServerList();
      setServerList(list);
      // Mặc định chọn server mới nhất hoặc server đầu tiên
      setSelectedServer(list[0]);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!username.trim()) {
        setError("Vui lòng nhập tên nhân vật!");
        return;
    }
    if (!selectedServer) {
        setError("Vui lòng chọn Server!");
        return;
    }
    if (selectedServer.status === 'Maintenance') {
        setError("Server này đang bảo trì! Vui lòng chọn server khác.");
        soundManager.playHit();
        return;
    }

    setLoading(true);
    soundManager.playCoin(); 

    try {
        const cleanName = username.trim();
        const dbUser = await getUserData(cleanName);

        // --- CHECK BAN ---
        if (dbUser && dbUser.is_banned) {
            const expireDate = new Date(dbUser.ban_expires_at);
            if (expireDate > new Date()) {
                const reason = dbUser.ban_reason || "Vi phạm quy định";
                setError(`TÀI KHOẢN BỊ KHÓA!\nLý do: ${reason}\nMở khóa lúc: ${expireDate.toLocaleString()}`);
                soundManager.playHit();
                setLoading(false);
                return;
            }
        }

        if (isRegister) {
            if (dbUser) {
                setError(`Tên "${cleanName}" đã có người sử dụng!\nVui lòng chọn tên khác.`);
                soundManager.playHit();
            } else {
                const newUser: UserProfile = {
                    username: cleanName,
                    level: 1,
                    exp: 0,
                    gold: 1000,
                    ruby: 50,
                    avatar: 'ghost',
                    inventory: [],
                    playTime: 0,
                    lastActiveDate: new Date().toDateString(),
                    hasSeenIntro: false,
                    role: 'user',
                    serverId: selectedServer.id,
                    serverName: selectedServer.name
                };
                
                const success = await saveUserData(newUser);
                if (success) {
                    onLogin(newUser);
                } else {
                    setError("Lỗi kết nối DB.");
                }
            }
        } else {
            // LOGIN
            if (!dbUser) {
                setError("Tài khoản không tồn tại! Hãy đăng ký.");
                setIsRegister(true);
                soundManager.playHit();
            } else {
                const userData = dbUser.game_data as UserProfile;
                userData.role = dbUser.role || 'user';
                
                // Update server info on login if changed
                userData.serverId = selectedServer.id;
                userData.serverName = selectedServer.name;

                const todayStr = new Date().toDateString();
                if (userData.lastActiveDate !== todayStr) {
                    userData.playTime = 0;
                    userData.lastActiveDate = todayStr;
                }

                // Async save to update server info
                saveUserData(userData); 
                onLogin(userData);
            }
        }
    } catch (err) {
        console.error(err);
        setError("Lỗi hệ thống. Vui lòng thử lại.");
    } finally {
        setLoading(false);
    }
  };

  // Filter servers by region
  const filteredServers = serverList.filter(s => 
    activeRegion === 'ALL' ? true : s.region === activeRegion
  );

  // Status Helper Helpers
  const getStatusColor = (status: ServerInfo['status']) => {
      switch(status) {
          case 'Good': return 'bg-green-500 shadow-[0_0_10px_lime]';
          case 'Busy': return 'bg-yellow-500 shadow-[0_0_10px_orange]';
          case 'Full': return 'bg-red-500 shadow-[0_0_10px_red]';
          case 'Maintenance': return 'bg-stone-500';
          default: return 'bg-stone-500';
      }
  };

  const getPingColor = (ping: number) => {
      if (ping < 50) return 'text-green-500';
      if (ping < 100) return 'text-yellow-500';
      return 'text-red-500';
  }

  return (
    <div className="w-full h-screen bg-[#0f111a] flex items-center justify-center font-sans text-white relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900/30 via-[#0f111a] to-black"></div>
      
      {/* --- SERVER SELECT MODAL --- */}
      {showServerList && (
          <div className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-in zoom-in duration-200">
              <div className="w-full max-w-4xl bg-stone-900 rounded-2xl border-2 border-stone-700 h-[80vh] flex flex-col shadow-2xl overflow-hidden">
                  {/* Header */}
                  <div className="p-4 bg-stone-800 border-b border-stone-700 flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center gap-2 text-white"><Globe size={20}/> Chọn Máy Chủ</h3>
                      <button onClick={() => setShowServerList(false)} className="p-2 hover:bg-stone-700 rounded-full"><AlertCircle className="rotate-45" size={24}/></button>
                  </div>

                  {/* LEGEND BAR (Explain Colors) */}
                  <div className="bg-stone-950 p-2 flex justify-center gap-6 border-b border-stone-800 text-xs font-bold text-stone-400">
                       <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-green-500 shadow-[0_0_5px_lime]"></div>
                           <span className="text-green-500">Tốt (Mượt)</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-yellow-500 shadow-[0_0_5px_orange]"></div>
                           <span className="text-yellow-500">Đông</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_5px_red]"></div>
                           <span className="text-red-500">Đầy (Lag)</span>
                       </div>
                       <div className="flex items-center gap-2">
                           <div className="w-3 h-3 rounded-full bg-stone-500"></div>
                           <span className="text-stone-500">Bảo Trì</span>
                       </div>
                  </div>

                  {/* Body */}
                  <div className="flex-1 flex overflow-hidden">
                      {/* Left: Region Tabs */}
                      <div className="w-1/3 md:w-1/4 bg-stone-950 border-r border-stone-700 overflow-y-auto">
                          {['Asia', 'VietNam', 'China', 'HK/TW'].map(region => (
                              <button 
                                key={region}
                                onClick={() => setActiveRegion(region)}
                                className={`w-full text-left p-4 font-bold border-l-4 transition-colors flex justify-between items-center ${activeRegion === region ? 'bg-stone-800 border-l-green-500 text-white' : 'border-l-transparent text-stone-500 hover:bg-stone-900'}`}
                              >
                                  {region}
                                  {activeRegion === region && <Check size={16} className="text-green-500"/>}
                              </button>
                          ))}
                      </div>

                      {/* Right: Server Grid */}
                      <div className="flex-1 bg-stone-900 p-4 overflow-y-auto custom-scrollbar">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {filteredServers.map(server => (
                                  <button 
                                    key={server.id}
                                    onClick={() => { 
                                        if(server.status !== 'Maintenance') {
                                            setSelectedServer(server); 
                                            setShowServerList(false); 
                                            soundManager.playCoin(); 
                                        } else {
                                            soundManager.playHit();
                                        }
                                    }}
                                    className={`relative p-3 rounded-xl border-2 flex items-center justify-between group transition-all 
                                        ${selectedServer?.id === server.id ? 'bg-green-900/30 border-green-500' : 'bg-stone-800 border-stone-700 hover:border-stone-500'}
                                        ${server.status === 'Maintenance' ? 'opacity-60 cursor-not-allowed grayscale' : ''}
                                    `}
                                  >
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2 h-2 rounded-full ${getStatusColor(server.status)}`}></div>
                                          <div className="text-left">
                                              <div className={`font-bold text-sm ${selectedServer?.id === server.id ? 'text-green-400' : 'text-stone-300'}`}>{server.name}</div>
                                              <div className="text-[10px] text-stone-500 flex items-center gap-1">
                                                  <Signal size={10} className={getPingColor(server.ping)}/> 
                                                  <span className={getPingColor(server.ping)}>{server.ping}ms</span>
                                              </div>
                                          </div>
                                      </div>
                                      {server.isNew && (
                                          <div className="absolute top-0 right-0 bg-red-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-bl-lg rounded-tr-lg animate-pulse">
                                              NEW
                                          </div>
                                      )}
                                      {server.status === 'Maintenance' && (
                                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center font-bold text-xs uppercase text-stone-300">
                                              BẢO TRÌ
                                          </div>
                                      )}
                                      {selectedServer?.id === server.id && <Check size={18} className="text-green-500"/>}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}
      
      <div className="relative z-10 w-full max-w-md p-8 animate-in zoom-in duration-500">
        <div className="text-center mb-6">
           <div className="w-24 h-24 bg-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center shadow-[0_0_30px_#ea580c] animate-bounce">
              <Ghost size={48} className="text-white" />
           </div>
           <h1 className="text-4xl font-['Mali'] font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-purple-500">
             {isRegister ? 'GIA NHẬP HỘI' : 'CHÀO MỪNG TRỞ LẠI'}
           </h1>
           
           {/* SERVER SELECTOR TRIGGER */}
           <button 
             onClick={() => { setShowServerList(true); soundManager.playHit(); }}
             className="mt-4 bg-stone-800 hover:bg-stone-700 border border-stone-600 text-green-400 px-6 py-2 rounded-full text-sm font-bold flex items-center gap-2 mx-auto transition-all shadow-lg group"
           >
               <div className={`w-2 h-2 rounded-full animate-pulse shadow-[0_0_8px_currentColor] ${selectedServer ? getStatusColor(selectedServer.status).split(' ')[0] : 'bg-gray-500'}`}></div>
               {selectedServer ? selectedServer.name : "Đang tải server..."}
               <ChevronDown size={14} className="group-hover:translate-y-1 transition-transform"/>
           </button>
           {selectedServer && (
               <div className="text-[10px] text-stone-500 mt-1 flex justify-center gap-2">
                   <span>Ping: <b className={getPingColor(selectedServer.ping)}>{selectedServer.ping}ms</b></span>
                   <span>Status: <b>{selectedServer.status === 'Good' ? 'Tốt' : selectedServer.status === 'Busy' ? 'Đông' : selectedServer.status === 'Full' ? 'Đầy' : 'Bảo trì'}</b></span>
               </div>
           )}
        </div>

        <form onSubmit={handleSubmit} className="bg-stone-800/50 backdrop-blur-md p-6 rounded-2xl border border-stone-700 shadow-2xl">
           
           {error && (
               <div className="mb-4 bg-red-900/50 border border-red-500 text-red-200 p-3 rounded-xl flex items-center gap-2 text-sm font-bold animate-pulse whitespace-pre-wrap">
                   <AlertCircle size={16} className="shrink-0" /> <span>{error}</span>
               </div>
           )}

           <div className="mb-6">
              <label className="block text-xs font-bold uppercase text-stone-500 mb-2">Tên Nhân Vật</label>
              <input 
                type="text" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-stone-900 border-2 border-stone-700 rounded-xl p-4 text-white focus:border-orange-500 focus:outline-none transition-colors font-bold"
                placeholder="Nhập tên duy nhất..."
                disabled={loading}
              />
           </div>

           <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-orange-600 to-red-600 py-4 rounded-xl font-black text-lg shadow-lg group relative overflow-hidden disabled:opacity-50">
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform"></div>
              <span className="relative flex items-center justify-center gap-2">
                {loading ? <Loader2 className="animate-spin"/> : (
                    <>
                        {isRegister ? 'TẠO TÀI KHOẢN' : 'VÀO GAME NGAY'} <ArrowRight size={20}/>
                    </>
                )}
              </span>
           </button>
        </form>

        <div className="mt-6 text-center">
           <button 
             onClick={() => { setIsRegister(!isRegister); setError(null); soundManager.playHit(); }}
             className="text-stone-500 hover:text-white text-sm font-bold transition-colors"
           >
             {isRegister ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký ngay'}
           </button>
        </div>
        
        {/* Updated Footer Info */}
        <p className="text-center text-xs text-stone-600 mt-8 font-mono">
            System Ready • Region: {selectedServer?.region || 'Auto'}
        </p>
      </div>
    </div>
  );
};
