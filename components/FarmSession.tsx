
import React, { useState, useEffect } from 'react';
import { 
    Sprout, X, LogOut, Store, Clock, Leaf, Coins, Beef, 
    Wheat, Egg, Apple, Flower, Droplets, Sun, Carrot
} from 'lucide-react';
import { UserProfile, GardenPlot, Resources, CropType } from '../types';
import { CROPS } from '../constants';
import { soundManager } from '../utils/audio';

const FARM_WIDTH = 800;
const FARM_HEIGHT = 600;

interface FarmSessionProps {
    user: UserProfile;
    onExit: (earnedGold: number, earnedRuby: number, currentPlots: GardenPlot[], updatedResources: Resources) => void;
}

export const FarmSession: React.FC<FarmSessionProps> = ({ user, onExit }) => {
    const [gold, setGold] = useState(user.gold);
    const [ruby, setRuby] = useState(user.ruby);
    const [scale, setScale] = useState(1);
    
    const [resources, setResources] = useState<Resources>(() => {
        const base = user.savedResources || { 'seed_meat': 5, 'prod_meat': 0, 'wood': 0 };
        if (typeof base.wood === 'undefined') {
            return { ...base, wood: 0 };
        }
        return base;
    });
    
    const [gardenPlots, setGardenPlots] = useState<GardenPlot[]>(() => {
        const TARGET_PLOTS = 30;
        let plots = user.gardenPlots || [];
        
        if (plots.length < TARGET_PLOTS) {
             const newPlots = Array.from({ length: TARGET_PLOTS - plots.length }).map((_, idx) => ({ 
                id: plots.length + idx, 
                state: 'empty', 
                plantTime: 0, 
                growDuration: 0, 
                position: { x: 0, y: 0 }
            }));
            plots = [...plots, ...newPlots] as GardenPlot[];
        }
        return plots;
    });

    const [activeModal, setActiveModal] = useState<'none' | 'seed_select' | 'market'>('none');
    const [selectedPlotId, setSelectedPlotId] = useState<number | null>(null);
    const [notifications, setNotifications] = useState<{id: string, text: string, color: string}[]>([]);

    useEffect(() => {
        soundManager.playBGM();
        
        const handleResize = () => {
            const wRatio = window.innerWidth / FARM_WIDTH;
            const hRatio = window.innerHeight / FARM_HEIGHT;
            const s = Math.min(wRatio, hRatio) * 0.98; 
            setScale(s);
        };
        window.addEventListener('resize', handleResize);
        handleResize();

        const interval = setInterval(() => {
            setGardenPlots(prev => prev.map(plot => {
                if (plot.state === 'growing' && Date.now() - plot.plantTime > plot.growDuration) {
                    return { ...plot, state: 'ready' };
                }
                return plot;
            }));
        }, 1000);
        return () => { clearInterval(interval); window.removeEventListener('resize', handleResize); };
    }, []);

    const spawnNotification = (text: string, color: string = '#fbbf24') => {
        const id = Math.random().toString();
        setNotifications(prev => [...prev, { id, text, color }]);
        setTimeout(() => setNotifications(prev => prev.filter(n => n.id !== id)), 1500);
    };

    const handleGardenClick = (plotId: number) => {
        const plot = gardenPlots.find(p => p.id === plotId);
        if (!plot) return;

        if (plot.state === 'empty') {
            setSelectedPlotId(plotId);
            setActiveModal('seed_select');
        } else if (plot.state === 'ready') {
            soundManager.playCoin();
            const crop = plot.cropType || 'meat';
            const prodKey = `prod_${crop}`;
            setResources(prev => ({ ...prev, [prodKey]: (prev[prodKey] || 0) + 1 }));
            setGardenPlots(prev => prev.map(p => p.id === plotId ? { ...p, state: 'empty', cropType: undefined } : p));
            spawnNotification(`+1 ${CROPS[crop].name}`, CROPS[crop].color);
        }
    };

    const plantSeed = (cropId: CropType) => {
        if (selectedPlotId === null) return;
        const seedKey = `seed_${cropId}`;
        if ((resources[seedKey] || 0) > 0) {
            soundManager.playPlant();
            setResources(prev => ({ ...prev, [seedKey]: prev[seedKey] - 1 }));
            setGardenPlots(prev => prev.map(p => p.id === selectedPlotId ? { ...p, state: 'growing', cropType: cropId, plantTime: Date.now(), growDuration: CROPS[cropId].growTime } : p));
            setActiveModal('none');
            setSelectedPlotId(null);
        } else {
            alert("Hết hạt giống! Mua thêm tại chợ.");
        }
    };

    const buyItem = (seed: boolean, cropId: string, cost: number) => {
        if (gold >= cost) {
            soundManager.playCoin();
            setGold(g => g - cost);
            const key = seed ? `seed_${cropId}` : `prod_${cropId}`;
            setResources(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
        }
    };

    const sellItem = (cropId: string, price: number) => {
        const key = `prod_${cropId}`;
        if ((resources[key] || 0) > 0) {
            soundManager.playCoin();
            setResources(prev => ({ ...prev, [key]: prev[key] - 1 }));
            setGold(g => g + price);
        }
    };

    const renderSpecificIcon = (type: CropType, size: number = 24) => { 
        const color = CROPS[type].color;
        const props = { size, color, fill: color, fillOpacity: 0.2 };
        switch(type) {
            case 'meat': return <Beef {...props} />;
            case 'wheat': case 'corn': return <Wheat {...props} />;
            case 'carrot': case 'radish': return <Carrot {...props} />;
            case 'potato': case 'eggplant': return <Egg {...props} />;
            case 'tomato': case 'apple': case 'golden_apple': return <Apple {...props} />;
            case 'grapes': return <div className="rounded-full border-2 border-purple-500 bg-purple-500/20 w-4 h-4"></div>; // Grape icon placeholder
            case 'banana': return <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>;
            case 'strawberry': case 'chili': return <div className="w-3 h-3 bg-red-500 rotate-45"></div>;
            case 'pumpkin': case 'watermelon': return <div className="rounded-full border-2" style={{width: size, height: size, borderColor: color, backgroundColor: color + '40'}}></div>;
            case 'mushroom': return <Flower {...props} />;
            default: return <Leaf {...props} />;
        }
    };

    const renderGrowthStage = (plot: GardenPlot) => {
        if (plot.state === 'empty') return null;
        if (!plot.cropType) return null;

        if (plot.state === 'ready') {
            return (
                <div className="animate-bounce relative z-10 drop-shadow-lg">
                    <div className="absolute inset-0 bg-white/30 animate-ping rounded-full blur-sm"></div>
                    {renderSpecificIcon(plot.cropType, 24)} 
                </div>
            );
        }

        const elapsed = Date.now() - plot.plantTime;
        const progress = Math.min(100, (elapsed / plot.growDuration) * 100);

        if (progress < 25) {
            return (
                <div className="w-3 h-1.5 bg-[#5d4037] rounded-t-full border border-[#3e2723] mt-2 relative"></div>
            );
        }
        
        if (progress < 60) {
            return <Sprout size={16} className="text-green-400 animate-[pulse_3s_infinite]" />;
        }

        const foliageColor = progress > 80 ? CROPS[plot.cropType].color : '#4ade80';
        return (
            <div className="relative">
                <Leaf size={20} color={foliageColor} fill={foliageColor} fillOpacity={0.3} className="animate-[bounce_4s_infinite]" />
            </div>
        );
    };

    return (
        <div className="w-full h-full bg-[#111827] flex items-center justify-center overflow-hidden font-sans">
            <div style={{ transform: `scale(${scale})`, transformOrigin: 'center' }}>
                <div className="relative bg-[#1f2937] shadow-2xl overflow-hidden border-4 border-stone-800 rounded-xl flex flex-col" style={{ width: FARM_WIDTH, height: FARM_HEIGHT }}>
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none"></div>
                    
                    {/* SCALED HEADER */}
                    <div className="bg-[#111827] p-4 flex justify-between items-center z-50 border-b border-stone-700 shrink-0 h-16">
                        <div className="flex items-center gap-4">
                            <div className="bg-stone-900 border border-yellow-600 rounded-full px-4 py-1 flex items-center gap-2 text-yellow-400 whitespace-nowrap h-10">
                                <Coins size={20} /> <span className="font-bold text-xl">{gold.toLocaleString()}</span>
                            </div>
                            <div className="bg-stone-900 border border-red-600 rounded-full px-4 py-1 flex items-center gap-2 text-red-400 whitespace-nowrap h-10">
                                <Beef size={20} /> <span className="font-bold text-xl">{resources['prod_meat'] || 0}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => setActiveModal('market')} 
                                className="bg-gradient-to-r from-yellow-700 to-amber-600 hover:from-yellow-600 hover:to-amber-500 text-white px-4 py-2 rounded-xl font-black text-sm flex items-center gap-2 shadow-lg border-b-4 border-yellow-900 active:border-b-0 active:translate-y-1 transition-all h-10"
                            >
                                <Store size={18} /> CHỢ
                            </button>
                            <button onClick={() => onExit(gold, ruby, gardenPlots, resources)} className="bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg shadow-sm active:scale-95 transition-transform h-10 w-10 flex items-center justify-center">
                                <LogOut size={20} />
                            </button>
                        </div>
                    </div>

                    {/* SCALED GRID CONTENT */}
                    <div className="flex-1 p-6 flex flex-col items-center justify-center relative">
                        <div className="grid grid-cols-6 gap-3">
                            {gardenPlots.map(plot => {
                                let progress = 0;
                                if (plot.state === 'growing' && plot.plantTime > 0) {
                                    const elapsed = Date.now() - plot.plantTime;
                                    progress = Math.min(100, (elapsed / plot.growDuration) * 100);
                                }

                                return (
                                    <div 
                                        key={plot.id}
                                        onClick={() => handleGardenClick(plot.id)}
                                        className={`
                                            w-24 h-24 rounded-xl border-4 transition-all cursor-pointer group shadow-lg flex flex-col items-center justify-center overflow-hidden relative
                                            ${plot.state === 'empty' 
                                                ? 'bg-[#3e2723]/50 border-[#5d4037] hover:bg-[#3e2723]/80 hover:border-[#8d6e63]' 
                                                : 'bg-[#2e1a14] border-[#4e342e]'
                                            }
                                            ${plot.state === 'ready' ? 'shadow-[0_0_15px_rgba(255,255,255,0.2)] border-yellow-500/50' : ''}
                                        `}
                                    >
                                        <div className="absolute inset-1 rounded-lg bg-[#281813] opacity-60 border border-dashed border-[#5d4037]/30 pointer-events-none"></div>

                                        <div className="relative z-10 flex flex-col items-center">
                                            {plot.state === 'empty' ? (
                                                <div className="flex flex-col items-center opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <Sprout size={24} className="text-stone-400 mb-1" />
                                                </div>
                                            ) : (
                                                renderGrowthStage(plot)
                                            )}

                                            {plot.state === 'growing' && (
                                                <div className="absolute bottom-1 w-full px-2 flex flex-col items-center">
                                                    <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden border border-white/10">
                                                        <div className="h-full bg-green-500" style={{ width: `${progress}%` }}></div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                        
                        {/* Notifications Overlay inside Scaled Box */}
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 pointer-events-none flex flex-col gap-2 z-[100]">
                            {notifications.map(n => (
                                <div key={n.id} className="text-2xl font-black animate-[bounce_1s_ease-out] drop-shadow-[0_2px_0_rgba(0,0,0,0.8)]" style={{ color: n.color }}>
                                    {n.text}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* MODALS - SCALED INSIDE THE BOX */}
                    {activeModal === 'seed_select' && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 animate-in fade-in">
                            <div className="bg-[#1e293b] rounded-2xl border-2 border-stone-600 w-full max-w-md flex flex-col max-h-full shadow-2xl">
                                <div className="p-4 border-b border-stone-700 flex justify-between items-center bg-[#111827] rounded-t-2xl">
                                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><Sprout size={20} className="text-green-500"/> Kho Hạt Giống</h3>
                                    <button onClick={() => setActiveModal('none')}><X size={20} className="text-stone-400 hover:text-white"/></button>
                                </div>
                                
                                <div className="p-4 overflow-y-auto grid grid-cols-1 gap-2 custom-scrollbar flex-1">
                                    {Object.values(CROPS).map(crop => {
                                        const count = resources[`seed_${crop.id}`] || 0;
                                        return (
                                            <button 
                                                key={crop.id} 
                                                onClick={() => plantSeed(crop.id)} 
                                                disabled={count === 0}
                                                className={`flex justify-between items-center p-3 rounded-xl border-2 transition-all ${
                                                    count > 0 
                                                    ? 'bg-stone-800 border-stone-600 hover:border-green-500 hover:bg-stone-700' 
                                                    : 'bg-stone-900 border-stone-800 opacity-40 cursor-not-allowed grayscale'
                                                }`}
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-lg bg-black/40 flex items-center justify-center border border-white/10">
                                                        {renderSpecificIcon(crop.id, 20)}
                                                    </div>
                                                    <div className="text-left">
                                                        <div className="font-bold text-white text-base">{crop.name}</div>
                                                        <div className="text-xs text-stone-400 flex items-center gap-1"><Clock size={12}/> {(crop.growTime/1000).toFixed(0)}s</div>
                                                    </div>
                                                </div>
                                                <div className="font-mono font-bold text-white bg-black/50 px-3 py-1 rounded-lg text-sm">x{count}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                                
                                <div className="p-4 border-t border-stone-700 bg-[#111827] rounded-b-2xl">
                                    <button onClick={() => setActiveModal('market')} className="w-full py-3 bg-stone-800 hover:bg-stone-700 text-green-400 font-bold rounded-xl border border-stone-600 transition-colors text-sm">
                                        + Mua thêm tại Chợ
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {activeModal === 'market' && (
                        <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in zoom-in">
                            <div className="bg-[#1e293b] w-full max-w-4xl rounded-xl border-4 border-yellow-700 shadow-2xl flex flex-col h-full overflow-hidden">
                                <div className="p-4 bg-gradient-to-r from-yellow-900 to-amber-900 border-b border-yellow-700 flex justify-between items-center shrink-0">
                                    <h2 className="text-xl font-black text-white flex items-center gap-3 drop-shadow-md">
                                        <Store size={24} className="text-yellow-400"/> CHỢ ĐẦU MỐI
                                    </h2>
                                    <button onClick={() => setActiveModal('none')} className="bg-black/30 p-2 rounded-full text-white hover:bg-red-600 transition-colors"><X size={20}/></button>
                                </div>

                                <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-green-400 font-bold uppercase text-sm border-b border-stone-700 pb-2">
                                                <Droplets size={16}/> Mua Hạt Giống
                                            </div>
                                            <div className="space-y-2">
                                                {Object.values(CROPS).map(crop => (
                                                    <div key={`buy-${crop.id}`} className="bg-stone-800 p-2 rounded-xl flex justify-between items-center group hover:bg-stone-750 border border-stone-700 hover:border-stone-500 transition-all">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-8 h-8 rounded bg-black/30 flex items-center justify-center">
                                                                {renderSpecificIcon(crop.id, 16)}
                                                            </div>
                                                            <div>
                                                                <div className="font-bold text-white text-xs group-hover:text-green-300 transition-colors">{crop.name}</div>
                                                            </div>
                                                        </div>
                                                        <button onClick={() => buyItem(true, crop.id, crop.seedCost)} className="bg-green-700 hover:bg-green-600 text-white px-3 py-1.5 rounded-lg font-bold text-xs shadow-md active:scale-95 transition-transform flex items-center gap-1">
                                                            <Coins size={10}/> {crop.seedCost}
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase text-sm border-b border-stone-700 pb-2">
                                                <Sun size={16}/> Bán Nông Sản
                                            </div>
                                            <div className="space-y-2">
                                                {Object.values(CROPS).map(crop => {
                                                    if (crop.sellPrice === 0) return null;
                                                    const count = resources[`prod_${crop.id}`] || 0;
                                                    return (
                                                        <div key={`sell-${crop.id}`} className="bg-stone-800 p-2 rounded-xl flex justify-between items-center border border-stone-700">
                                                            <div className="flex items-center gap-3">
                                                                <div className="w-8 h-8 rounded bg-black/30 flex items-center justify-center">
                                                                    {renderSpecificIcon(crop.id, 16)}
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold text-white text-xs">{crop.name}</div>
                                                                    <div className="text-[10px] text-stone-400">Có: <span className="text-white font-bold">{count}</span></div>
                                                                </div>
                                                            </div>
                                                            <button 
                                                                onClick={() => sellItem(crop.id, crop.sellPrice)} 
                                                                disabled={count === 0} 
                                                                className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1 shadow-md active:scale-95 transition-transform ${count > 0 ? 'bg-yellow-600 hover:bg-yellow-500 text-white' : 'bg-stone-700 text-stone-500 cursor-not-allowed opacity-50'}`}
                                                            >
                                                                + {crop.sellPrice} <Coins size={10}/>
                                                            </button>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
