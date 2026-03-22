import { useState, useEffect } from 'react';
import INITIAL_DECK from './dynamic_deck.json';
import {
  Sword, Shield, Zap, Flame, Droplets, Wind,
  Sparkles, Skull, Eye, RotateCcw, Layers,
  LayoutGrid, X, Shuffle, Star, Hammer, Save, Settings, Upload, EyeOff
} from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';

/**
 * AETHER DECK - Modular TCG/Tarot System (v2.1 Glitchworks Edition)
 * Base App Component for glitchworks-tarot repo
 * 
 * data-testid convention: `aether-<area>-<element>` — see docs/TESTIDS.md
 */

// --- GLOBAL GLITCH STYLES ---
const GlitchStyles = () => (
  <style>{`
    :root {
      --glitch-int: 0.5;
      --crt-opacity: 0.3;
      --noise-opacity: 0.15;
      --safe-area-inset-bottom: env(safe-area-inset-bottom, 0px);
    }

    .crt-overlay {
      pointer-events: none;
      position: fixed;
      inset: 0;
      background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), 
                  linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
      background-size: 100% 4px, 6px 100%;
      z-index: 9999;
      opacity: var(--crt-opacity);
      mix-blend-mode: overlay;
    }

    .noise-overlay {
      pointer-events: none;
      position: fixed;
      inset: 0;
      background-image: url('https://grainy-gradients.vercel.app/noise.svg');
      opacity: var(--noise-opacity);
      z-index: 0;
      mix-blend-mode: multiply;
    }

    @keyframes rgb-split {
      0% { text-shadow: calc(var(--glitch-int) * -4px) 0 red, calc(var(--glitch-int) * 4px) 0 cyan; }
      25% { text-shadow: calc(var(--glitch-int) * 4px) 0 red, calc(var(--glitch-int) * -4px) 0 cyan; }
      50% { text-shadow: calc(var(--glitch-int) * -2px) 0 red, calc(var(--glitch-int) * 2px) 0 cyan; }
      75% { text-shadow: calc(var(--glitch-int) * 2px) 0 red, calc(var(--glitch-int) * -2px) 0 cyan; }
      100% { text-shadow: calc(var(--glitch-int) * -4px) 0 red, calc(var(--glitch-int) * 4px) 0 cyan; }
    }

    .glitch-hover:hover {
      animation: rgb-split 0.2s steps(2, end) infinite;
    }

    .glitch-text {
      text-shadow: calc(var(--glitch-int) * 2px) 0px 0px rgba(255,0,0,0.5), 
                   calc(var(--glitch-int) * -2px) 0px 0px rgba(0,255,255,0.5);
    }

    @keyframes data-collision {
      0%, 100% { transform: translate3d(0, 0, 0); filter: none; }
      10%, 90% { transform: translate3d(-4px, 0, 0) skewX(-2deg); }
      20%, 80% { transform: translate3d(8px, 0, 0) skewX(2deg); filter: hue-rotate(90deg) contrast(150%); }
      30%, 50%, 70% { transform: translate3d(-12px, 2px, 0) skewX(-4deg); }
      40%, 60% { transform: translate3d(12px, -2px, 0) skewX(4deg); filter: invert(1) drop-shadow(0 0 20px red); }
    }

    .animate-collision {
      animation: data-collision 0.6s cubic-bezier(.36,.07,.19,.97) both;
    }

    .hide-scrollbar::-webkit-scrollbar {
      display: none;
    }
    .hide-scrollbar {
      -ms-overflow-style: none;
      scrollbar-width: none;
    }
  `}</style>
);
// --- DATA MOCKUP ---
const ELEMENTAL_ADVANTAGE = {
  fire: { wind: 1.5, electric: 1.2 },
  wind: { electric: 1.5, water: 1.2 },
  electric: { water: 1.5, fire: 1.2 },
  water: { fire: 1.5, wind: 1.2 },
  void: { fire: 1.1, water: 1.1, electric: 1.1, wind: 1.1, dark: 2.0 },
  dark: { fire: 1.2, water: 1.2, electric: 1.2, wind: 1.2 },
};

// --- UTILS ---
const getTypeColor = (type) => {
  const map = {
    fire: 'from-red-900/50 to-orange-900/50 border-red-500/30',
    water: 'from-blue-900/50 to-cyan-900/50 border-blue-500/30',
    electric: 'from-yellow-900/50 to-amber-900/50 border-yellow-500/30',
    wind: 'from-emerald-900/50 to-teal-900/50 border-emerald-500/30',
    void: 'from-indigo-900/50 to-purple-900/50 border-indigo-500/30',
    dark: 'from-gray-900/50 to-slate-900/50 border-gray-500/30',
  };
  return map[type] || 'from-gray-800 to-gray-900 border-gray-700';
};

const iconMap = {
  Sparkles: <Sparkles size={64} />, Flame: <Flame size={64} />, Droplets: <Droplets size={64} />,
  Zap: <Zap size={64} />, Skull: <Skull size={64} />, Wind: <Wind size={64} />,
  Eye: <Eye size={64} />, Star: <Star size={64} />, Sword: <Sword size={64} />,
  Shield: <Shield size={64} />, Hammer: <Hammer size={64} />,
};

// --- CUSTOM UI COMPONENTS ---

const NeonSlider = ({ value, onChange, label, color = "indigo" }) => {
  const blocks = 10;
  const activeColor = {
    indigo: 'bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]',
    emerald: 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]',
    red: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]',
  }[color];

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className="flex justify-between text-xs font-mono text-white/50">
        <span>{label}</span>
        <span className={`text-${color}-400 glitch-text`}>{value}</span>
      </div>
      <div className="flex gap-[2px] h-4 w-full cursor-pointer" 
           onPointerDown={(e) => {
             const rect = e.currentTarget.getBoundingClientRect();
             const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
             onChange(Math.ceil(pct * 100));
           }}
      >
        {[...Array(blocks)].map((_, i) => (
          <div
            key={i}
            className={`flex-1 rounded-[1px] transition-all duration-75 ${
              value >= (i + 1) * (100 / blocks) ? activeColor : 'bg-slate-800'
            }`}
          />
        ))}
      </div>
    </div>
  );
};

const Card = ({ data, isFlipped, onClick, size = 'md', showStats = true, clashing = false }) => {
  const sizeClasses = {
    sm: 'w-24 h-40 text-xs',
    md: 'w-64 h-[28rem]',
    lg: 'w-80 h-[36rem]',
  };

  const IconComponent = iconMap[data.icon] || <Sparkles size={64} />;

  return (
    <div 
      onClick={onClick}
      className={`relative preserve-3d transition-transform duration-500 cursor-pointer group ${sizeClasses[size]} ${isFlipped ? 'rotate-y-180' : ''} ${clashing ? 'animate-collision' : ''}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {/* CARD BACK */}
      <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-xl hover:border-indigo-500 transition-colors">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
        <div className="grid grid-cols-6 grid-rows-6 gap-1 opacity-10 rotate-45 scale-150">
           {[...Array(36)].map((_, i) => <div key={i} className="w-full h-full border border-indigo-500 group-hover:border-red-500 transition-colors duration-1000"></div>)}
        </div>
        <RotateCcw className="text-indigo-500 animate-pulse glitch-hover" size={32} />
      </div>

      {/* CARD FRONT */}
      <div className={`absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-xl bg-gradient-to-br ${getTypeColor(data.type)} border-2 backdrop-blur-md flex flex-col shadow-2xl overflow-hidden`}>
        
        {/* Tarot Inner Frame */}
        <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none z-20"></div>

        {/* Top Header - Minimal */}
        <div className="p-4 flex justify-between items-start z-30">
          <div className="text-[10px] font-mono tracking-widest text-white/50 uppercase">{data.type}</div>
          <div className="text-sm font-serif text-white/80 tracking-widest">{data.id}</div>
        </div>

        {/* Expansive Art Center */}
        <div className={`absolute inset-0 flex items-center justify-center ${data.image}`}>
          {data.customImage && (
            <img src={data.customImage} alt={data.name} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-80" />
          )}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.8)_100%)]"></div>
          {!data.customImage && (
            <div className="relative z-10 scale-125 drop-shadow-[0_0_20px_rgba(255,255,255,0.2)] glitch-hover transition-transform duration-700 group-hover:scale-[1.4]">
              {IconComponent}
            </div>
          )}
        </div>

        {/* Bottom Data Container */}
        <div className="absolute bottom-0 w-full bg-gradient-to-t from-black via-black/90 to-transparent pt-16 z-30">
          <div className="px-4 text-center">
            <h3 className="font-serif text-2xl text-white tracking-widest glitch-hover uppercase">{data.name}</h3>
            <p className="text-[9px] text-white/50 uppercase tracking-[0.2em] mt-1">{data.sub}</p>
          </div>

          {!data.hideDesc && (
            <div className="px-5 py-3 text-center">
              <p className="text-[11px] italic text-white/60 leading-relaxed font-serif line-clamp-3">
                &ldquo;{data.desc}&rdquo;
              </p>
            </div>
          )}

          {showStats && !data.hideStats && (
            <div className="mt-auto grid grid-cols-3 border-t border-white/10 bg-black/60 backdrop-blur-md divide-x divide-white/10">
              <div className="p-2 flex flex-col items-center group/stat">
                <Sword size={12} className="text-red-500 mb-1 group-hover/stat:animate-pulse" />
                <span className="text-[10px] font-bold text-white font-mono">{data.stats.atk}</span>
              </div>
              <div className="p-2 flex flex-col items-center group/stat">
                <Shield size={12} className="text-blue-500 mb-1 group-hover/stat:animate-pulse" />
                <span className="text-[10px] font-bold text-white font-mono">{data.stats.def}</span>
              </div>
              <div className="p-2 flex flex-col items-center group/stat">
                <Wind size={12} className="text-emerald-500 mb-1 group-hover/stat:animate-pulse" />
                <span className="text-[10px] font-bold text-white font-mono">{data.stats.spd}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Root React component for the Glitchworks single-page app that provides the four main views: dex, arena, oracle, and forge.
 *
 * Manages application state (navigation, deck, arena/oracle/forge data, and UI aesthetics), persists the deck to localStorage, and exposes UI controls and modals for interacting with cards.
 *
 * @returns {JSX.Element} The rendered application root element.
 */

export default function App() {
  const [view, setView] = useState('dex'); // 'dex', 'arena', 'oracle', 'forge'
  const [deck, setDeck] = useState(() => {
    const saved = localStorage.getItem('aether-deck');
    return saved ? JSON.parse(saved) : INITIAL_DECK;
  });
  const [selectedCard, setSelectedCard] = useState(null);
  
  // Persistence
  useEffect(() => {
    localStorage.setItem('aether-deck', JSON.stringify(deck));
  }, [deck]);

  // Settings / Aesthetics State
  const [showSettings, setShowSettings] = useState(false);
  const [aesthetics, setAesthetics] = useState({
    glitch: 50,
    crt: 40,
    noise: 15
  });

  // Arena State
  const [arenaSlots, setArenaSlots] = useState({ p1: null, p2: null });
  const [battleLog, setBattleLog] = useState("[ WAITING FOR DATA INPUT ]");
  const [isClashing, setIsClashing] = useState(false);

  // Oracle State
  const [spread, setSpread] = useState([]);

  // Forge State
  const [forgeData, setForgeData] = useState({
    id: '999',
    name: 'New Entity',
    sub: 'Unknown Origin',
    type: 'void',
    stats: { atk: 50, def: 50, spd: 50 },
    desc: 'An anomaly in the system. Properties yet to be defined.',
    image: 'text-indigo-400',
    icon: 'Sparkles',
    customImage: null,
    hideStats: false,
    hideDesc: false
  });

  // Sync CSS variables for Glitchworks aesthetic
  useEffect(() => {
    document.documentElement.style.setProperty('--glitch-int', aesthetics.glitch / 100);
    document.documentElement.style.setProperty('--crt-opacity', aesthetics.crt / 100);
    document.documentElement.style.setProperty('--noise-opacity', aesthetics.noise / 100);
  }, [aesthetics]);

  // Capacitor Mobile Integrations
  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#020617' }); // slate-950
    }
  }, []);

  // --- HANDLERS ---
  const handleArenaSelect = (card) => {
    if (isClashing) return;
    if (!arenaSlots.p1) {
      setArenaSlots({ ...arenaSlots, p1: card });
      setBattleLog("[ ALPHA SLOT FILLED ]");
    } else if (!arenaSlots.p2) {
      setArenaSlots({ ...arenaSlots, p2: card });
      setBattleLog("[ READY FOR COLLISION ]");
    }
  };

  const resolveBattle = () => {
    if (!arenaSlots.p1 || !arenaSlots.p2 || isClashing) return;
    
    setIsClashing(true);
    setBattleLog("[ ERR: DATA COLLISION DETECTED ]");

    setTimeout(() => {
      const p1Advantage = ELEMENTAL_ADVANTAGE[arenaSlots.p1.type]?.[arenaSlots.p2.type] || 1.0;
      const p2Advantage = ELEMENTAL_ADVANTAGE[arenaSlots.p2.type]?.[arenaSlots.p1.type] || 1.0;

      const p1Score = (arenaSlots.p1.stats.atk + arenaSlots.p1.stats.spd) * p1Advantage;
      const p2Score = (arenaSlots.p2.stats.atk + arenaSlots.p2.stats.spd) * p2Advantage;
      
      let result = "";
      if (p1Score > p2Score) {
        result = `> ${arenaSlots.p1.name.toUpperCase()} OVERWRITES ${arenaSlots.p2.name.toUpperCase()}${p1Advantage > 1.0 ? " (TYPE_ADVANTAGE)" : ""}`;
      } else if (p2Score > p1Score) {
        result = `> ${arenaSlots.p2.name.toUpperCase()} OVERWRITES ${arenaSlots.p1.name.toUpperCase()}${p2Advantage > 1.0 ? " (TYPE_ADVANTAGE)" : ""}`;
      } else {
        result = "> EQUILIBRIUM ACHIEVED. NO DELETION.";
      }

      setBattleLog(result);
      setIsClashing(false);
    }, 600);
  };

  const clearArena = () => {
    if (isClashing) return;
    setArenaSlots({ p1: null, p2: null });
    setBattleLog("[ ARENA WIPED ]");
  };

  const drawSpread = () => {
    const shuffled = [...deck].sort(() => 0.5 - Math.random());
    setSpread(shuffled.slice(0, 3));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setForgeData({ ...forgeData, customImage: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const saveForgeCard = () => {
    const newCard = { ...forgeData, id: String(deck.length + 1).padStart(3, '0') };
    setDeck([...deck, newCard]);
    setView('dex');
    setForgeData({ ...forgeData, name: 'Next Entity' });
  };

  // --- VIEWS ---
  const renderDexView = () => (
    <div data-testid="aether-view-dex" className="p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 pb-24">
      {deck.map(card => (
        <div key={card.id} className="flex justify-center transform hover:-translate-y-2 transition-transform duration-300">
          <Card data={card} isFlipped={true} onClick={() => setSelectedCard(card)} />
        </div>
      ))}
    </div>
  );

  const renderArenaView = () => (
    <div data-testid="aether-view-arena" className="flex flex-col h-full p-4 max-w-4xl mx-auto">
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 my-4">
        
        {/* Alpha Slot */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-indigo-400 font-mono text-xs tracking-widest glitch-text">ALPHA SLOT</span>
          {arenaSlots.p1 ? (
            <Card data={arenaSlots.p1} isFlipped={true} clashing={isClashing} onClick={() => setArenaSlots({...arenaSlots, p1: null})} />
          ) : (
            <div className="w-64 h-[28rem] rounded-xl border-2 border-dashed border-indigo-500/20 bg-indigo-900/10 flex items-center justify-center text-indigo-400/30 font-mono text-sm">AWAITING_DATA</div>
          )}
        </div>

        {/* Console / Controls */}
        <div className="flex flex-col items-center gap-4 z-10 w-full md:w-auto">
          <div className={`w-full md:min-w-[240px] bg-black/80 backdrop-blur p-4 rounded border ${isClashing ? 'border-red-500 text-red-500' : 'border-white/10 text-indigo-300'} text-center transition-colors`} data-testid="aether-arena-log">
            <p className={`text-xs font-mono uppercase tracking-wider ${isClashing ? 'glitch-hover animate-pulse' : ''}`}>{battleLog}</p>
          </div>
          
          <button 
            type="button"
            data-testid="aether-arena-clash"
            onClick={resolveBattle} 
            disabled={!arenaSlots.p1 || !arenaSlots.p2 || isClashing}
            className={`w-full md:w-auto px-8 py-3 rounded-none border border-transparent font-bold tracking-widest transition-all ${
              isClashing ? 'bg-white text-black animate-pulse' : 
              (!arenaSlots.p1 || !arenaSlots.p2) ? 'bg-slate-800 text-white/30 cursor-not-allowed' : 
              'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_20px_rgba(220,38,38,0.5)] hover:border-red-400'
            }`}
          >
            {isClashing ? 'PROCESSING...' : 'INITIATE CLASH'}
          </button>
          
          <button type="button" data-testid="aether-arena-flush" onClick={clearArena} className="text-[10px] font-mono text-white/40 hover:text-white uppercase tracking-widest hover:bg-white/5 px-2 py-1 rounded">
            Flush_Memory
          </button>
        </div>

        {/* Omega Slot */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-red-400 font-mono text-xs tracking-widest glitch-text">OMEGA SLOT</span>
          {arenaSlots.p2 ? (
            <Card data={arenaSlots.p2} isFlipped={true} clashing={isClashing} onClick={() => setArenaSlots({...arenaSlots, p2: null})} />
          ) : (
            <div className="w-64 h-[28rem] rounded-xl border-2 border-dashed border-red-500/20 bg-red-900/10 flex items-center justify-center text-red-400/30 font-mono text-sm">AWAITING_DATA</div>
          )}
        </div>
      </div>

      {/* Bench */}
      <div className="mt-auto pt-4 border-t border-white/10 bg-black/20">
        <p className="text-[10px] text-white/30 font-mono text-center mb-2 uppercase">Local_Storage_Array</p>
        <div className="overflow-x-auto hide-scrollbar flex items-center gap-4 px-4 pb-4 [mask-image:linear-gradient(to_right,black_90%,transparent_100%)]">
          {deck.map(card => (
            <div key={card.id} className={`shrink-0 scale-75 origin-bottom hover:scale-90 transition-transform ${arenaSlots.p1?.id === card.id || arenaSlots.p2?.id === card.id ? 'opacity-20 pointer-events-none' : ''}`}>
              <Card data={card} isFlipped={true} onClick={() => handleArenaSelect(card)} size="sm" />
            </div>
          ))}
          <div className="w-12 shrink-0" /> {/* Spacer for scroll mask */}
        </div>
      </div>
    </div>
  );

  const renderOracleView = () => (
    <div data-testid="aether-view-oracle" className="flex flex-col items-center justify-center min-h-[80vh] gap-12 p-4">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-light text-indigo-300 glitch-text tracking-widest">THE ORACLE</h2>
        <p className="text-white/40 font-mono text-xs max-w-md mx-auto">Accessing probabilistic timelines...</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-8 lg:gap-12 perspective-1000">
        {spread.length > 0 ? (
          spread.map((card, index) => (
            <div key={card.id} className="flex flex-col items-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700" style={{animationDelay: `${index * 200}ms`}}>
              <span className="text-[10px] font-mono text-white/40 tracking-widest uppercase border border-white/10 bg-black/50 px-3 py-1 rounded-full">
                {index === 0 ? 'T-Minus (Past)' : index === 1 ? 'T-Zero (Present)' : 'T-Plus (Future)'}
              </span>
              <Card data={card} isFlipped={true} />
            </div>
          ))
        ) : (
          <div className="flex gap-8 lg:gap-12 opacity-30">
             <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed"></div>
             <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed hidden md:block"></div>
             <div className="w-64 h-[28rem] rounded-xl bg-slate-800/50 border border-white/10 border-dashed hidden md:block"></div>
          </div>
        )}
      </div>

      <button type="button" data-testid="aether-oracle-draw" onClick={drawSpread} className="flex items-center gap-2 bg-indigo-900/50 border border-indigo-500 hover:bg-indigo-600 text-white px-8 py-3 rounded font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all active:scale-95 group">
        <Shuffle size={16} className="group-hover:animate-spin" />
        {spread.length > 0 ? 'RECALCULATE' : 'INITIALIZE SEQUENCE'}
      </button>
    </div>
  );

  const renderForgeView = () => (
    <div data-testid="aether-view-forge" className="flex flex-col lg:flex-row items-start justify-center gap-8 lg:gap-16 p-4 md:p-8 max-w-6xl mx-auto min-h-[80vh]">
      <div className="flex flex-col items-center gap-6 lg:sticky lg:top-24 order-1 lg:order-2 w-full lg:w-auto">
        <div className="bg-emerald-900/20 border border-emerald-500/30 px-4 py-1 rounded text-emerald-400 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          Live Preview
        </div>
        <Card data={forgeData} isFlipped={true} />
        <button type="button" data-testid="aether-forge-compile" onClick={saveForgeCard} className="w-64 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-4 rounded font-bold font-mono text-sm tracking-widest shadow-[0_0_20px_rgba(16,185,129,0.5)] transition-all active:scale-95 hover:border-emerald-300 border border-transparent">
          <Save size={18} /> COMPILE ENTITY
        </button>
      </div>

      <div className="w-full max-w-md space-y-8 bg-black/60 backdrop-blur-md p-6 md:p-8 rounded-xl border border-white/10 order-2 lg:order-1 shadow-2xl">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <Hammer className="text-emerald-400" />
          <h2 className="text-xl font-light tracking-widest uppercase glitch-text">The Forge</h2>
        </div>

        <div className="space-y-5">
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">Entity Designation</label>
            <input type="text" value={forgeData.name} onChange={e => setForgeData({...forgeData, name: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-bold focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-colors" />
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">Archetype Class</label>
            <input type="text" value={forgeData.sub} onChange={e => setForgeData({...forgeData, sub: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white focus:outline-none focus:border-emerald-500 focus:bg-slate-800 transition-colors text-sm" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">Elemental Core</label>
            <select value={forgeData.type} onChange={e => setForgeData({...forgeData, type: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none">
              {['void', 'fire', 'water', 'electric', 'wind', 'dark'].map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">Visual Sigil</label>
            <select value={forgeData.icon} onChange={e => setForgeData({...forgeData, icon: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white font-mono text-xs focus:outline-none focus:border-emerald-500 appearance-none">
              {Object.keys(iconMap).map(k => <option key={k} value={k}>{k.toUpperCase()}</option>)}
            </select>
          </div>
        </div>

        <div className="space-y-6 bg-slate-900/50 border border-white/5 p-5 rounded-lg">
          <NeonSlider label="ATK_POTENTIAL" value={forgeData.stats.atk} color="red" onChange={v => setForgeData({...forgeData, stats: {...forgeData.stats, atk: v}})} />
          <NeonSlider label="DEF_RESILIENCE" value={forgeData.stats.def} color="indigo" onChange={v => setForgeData({...forgeData, stats: {...forgeData.stats, def: v}})} />
          <NeonSlider label="SPD_AGILITY" value={forgeData.stats.spd} color="emerald" onChange={v => setForgeData({...forgeData, stats: {...forgeData.stats, spd: v}})} />
        </div>

        <div>
          <label className="block text-[10px] font-mono text-emerald-500/70 mb-2 uppercase tracking-widest">Lore Injection</label>
          <textarea rows="3" value={forgeData.desc} onChange={e => setForgeData({...forgeData, desc: e.target.value})} className="w-full bg-slate-900/50 border border-white/10 rounded px-3 py-3 text-white/70 text-sm italic font-serif focus:outline-none focus:border-emerald-500 transition-colors resize-none" />
        </div>

        <div className="border-t border-white/10 pt-5 space-y-4">
          <label className="block text-[10px] font-mono text-emerald-500/70 uppercase tracking-widest">Presentation Override</label>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setForgeData({...forgeData, hideDesc: !forgeData.hideDesc})}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded font-mono text-xs transition-colors ${forgeData.hideDesc ? 'border-red-500/50 text-red-400 bg-red-900/20' : 'border-white/10 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'}`}
            >
              {forgeData.hideDesc ? <EyeOff size={14}/> : <Eye size={14}/>} {forgeData.hideDesc ? 'LORE HIDDEN' : 'LORE VISIBLE'}
            </button>
            <button 
              onClick={() => setForgeData({...forgeData, hideStats: !forgeData.hideStats})}
              className={`flex-1 flex items-center justify-center gap-2 py-2 border rounded font-mono text-xs transition-colors ${forgeData.hideStats ? 'border-red-500/50 text-red-400 bg-red-900/20' : 'border-white/10 text-white/50 hover:border-emerald-500/50 hover:text-emerald-400'}`}
            >
              {forgeData.hideStats ? <EyeOff size={14}/> : <Eye size={14}/>} {forgeData.hideStats ? 'STATS HIDDEN' : 'STATS VISIBLE'}
            </button>
          </div>

          <div>
            <label className="flex items-center justify-center gap-2 w-full bg-slate-900/50 border border-dashed border-emerald-500/30 hover:border-emerald-500 rounded px-3 py-4 text-emerald-400/70 hover:text-emerald-400 font-mono text-xs cursor-pointer transition-colors">
              <Upload size={16} />
              {forgeData.customImage ? 'REPLACE CUSTOM ARTWORK' : 'UPLOAD CUSTOM ARTWORK'}
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
            {forgeData.customImage && (
              <button onClick={() => setForgeData({...forgeData, customImage: null})} className="w-full mt-2 text-center text-[10px] font-mono text-red-400/70 hover:text-red-400 uppercase tracking-widest">
                Remove Artwork
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div data-testid="aether-root" className="min-h-screen bg-slate-950 text-white font-sans selection:bg-indigo-500/30 overflow-x-hidden">
      <GlitchStyles />
      <div className="noise-overlay"></div>
      <div className="crt-overlay"></div>
      
      {/* Settings Modal */}
      {showSettings && (
        <div data-testid="aether-modal-settings" className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div data-testid="aether-modal-settings-panel" className="bg-slate-900 border border-white/20 p-6 md:p-8 rounded-xl max-w-sm w-full shadow-2xl space-y-8 relative">
            <button type="button" data-testid="aether-settings-close" onClick={() => setShowSettings(false)} className="absolute top-4 right-4 text-white/50 hover:text-white">
              <X size={24} />
            </button>
            <div>
              <h3 className="text-xl font-light tracking-widest glitch-text mb-1">SYSTEM_CFG</h3>
              <p className="text-xs font-mono text-white/40">Adjust UI degradation levels</p>
            </div>
            <div className="space-y-6">
              <NeonSlider label="GLITCH_INTENSITY" value={aesthetics.glitch} color="indigo" onChange={v => setAesthetics(s => ({...s, glitch: v}))} />
              <NeonSlider label="CRT_SCANLINES" value={aesthetics.crt} color="emerald" onChange={v => setAesthetics(s => ({...s, crt: v}))} />
              <NeonSlider label="GRAIN_NOISE" value={aesthetics.noise} color="red" onChange={v => setAesthetics(s => ({...s, noise: v}))} />
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav data-testid="aether-nav" className="fixed bottom-0 md:top-0 md:bottom-auto w-full z-50 bg-black/80 backdrop-blur-xl border-t md:border-b md:border-t-0 border-white/10 px-4 pt-3 pb-[calc(1.5rem+var(--safe-area-inset-bottom))] md:py-3 shadow-2xl">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3 md:gap-0">
          <div className="flex w-full md:w-auto justify-between items-center">
            <div className="flex items-center gap-2 group cursor-pointer">
              <Layers className="text-indigo-500 group-hover:animate-spin" />
              <span className="font-bold tracking-tighter text-xl glitch-hover">GLITCH<span className="font-light text-white/50">WORKS</span></span>
            </div>
            <button type="button" data-testid="aether-settings-open" onClick={() => setShowSettings(true)} className="md:hidden text-white/50 hover:text-indigo-400 p-2">
              <Settings size={20} />
            </button>
          </div>
          
          <div className="flex w-full md:w-auto items-center justify-between md:justify-end gap-2">
            {/* Scroll mask for mobile */}
            <div className="flex gap-2 bg-slate-900/50 p-1.5 rounded-full overflow-x-auto hide-scrollbar flex-nowrap w-full md:w-auto [mask-image:linear-gradient(to_right,black_85%,transparent_100%)] md:[mask-image:none]">
              {[
                { id: 'dex', icon: LayoutGrid, color: 'indigo' },
                { id: 'arena', icon: Sword, color: 'red' },
                { id: 'oracle', icon: Sparkles, color: 'purple' },
                { id: 'forge', icon: Hammer, color: 'emerald' }
              ].map(btn => (
                <button 
                  type="button"
                  data-testid={`aether-nav-${btn.id}`}
                  key={btn.id}
                  onClick={() => setView(btn.id)} 
                  className={`shrink-0 px-4 md:px-5 py-2.5 rounded-full text-xs font-mono uppercase tracking-widest transition-all flex items-center gap-2 border ${
                    view === btn.id 
                      ? `bg-${btn.color}-600/20 border-${btn.color}-500/50 text-${btn.color}-300 shadow-[0_0_15px_rgba(var(--tw-colors-${btn.color}-500),0.3)]` 
                      : 'border-transparent text-white/40 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <btn.icon size={14} className={view === btn.id ? 'animate-pulse' : ''} /> 
                  <span>{btn.id}</span>
                </button>
              ))}
              <div className="w-8 shrink-0 md:hidden" /> {/* Spacer to allow full scroll visibility */}
            </div>
            
            <button type="button" data-testid="aether-settings-open-desktop" onClick={() => setShowSettings(true)} className="hidden md:flex text-white/40 hover:text-indigo-400 p-2 ml-2 bg-slate-900/50 rounded-full border border-transparent hover:border-white/10 transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </div>
      </nav>

      <main data-testid="aether-main" className="relative z-10 pt-4 md:pt-28 pb-32 md:pb-12 max-w-6xl mx-auto min-h-screen">
        {view === 'dex' && renderDexView()}
        {view === 'arena' && renderArenaView()}
        {view === 'oracle' && renderOracleView()}
        {view === 'forge' && renderForgeView()}
      </main>

      {/* Card Details Modal */}
      {selectedCard && view === 'dex' && (
        <div data-testid="aether-modal-card" className="fixed inset-0 z-[900] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-in fade-in duration-200" onClick={() => setSelectedCard(null)}>
          <div className="relative transform transition-transform animate-in zoom-in-95 duration-300" onClick={e => e.stopPropagation()}>
            <button type="button" data-testid="aether-modal-card-close" className="absolute -top-16 right-0 text-white/50 hover:text-white transition-colors bg-white/5 p-2 rounded-full border border-white/10" onClick={() => setSelectedCard(null)}>
              <X size={24} />
            </button>
            <Card data={selectedCard} isFlipped={true} size="lg" />
          </div>
        </div>
      )}
    </div>
  );
}
