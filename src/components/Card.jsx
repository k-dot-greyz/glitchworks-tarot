import React from 'react';
import {
  Sword, Shield, Wind, Sparkles, RotateCcw, Flame, Droplets, Zap, Skull, Eye, Star, Hammer, Crown
} from 'lucide-react';
import { getTypeColor } from '../domain/elemental.js';

const iconMap = {
  Sparkles: <Sparkles size={64} />, Flame: <Flame size={64} />, Droplets: <Droplets size={64} />,
  Zap: <Zap size={64} />, Skull: <Skull size={64} />, Wind: <Wind size={64} />,
  Eye: <Eye size={64} />, Star: <Star size={64} />, Sword: <Sword size={64} />,
  Shield: <Shield size={64} />, Hammer: <Hammer size={64} />,
};

const glowColors = {
  fire: 'shadow-[0_0_20px_rgba(239,68,68,0.6)] border-red-500',
  water: 'shadow-[0_0_20px_rgba(59,130,246,0.6)] border-blue-500',
  electric: 'shadow-[0_0_20px_rgba(234,179,8,0.6)] border-yellow-500',
  wind: 'shadow-[0_0_20px_rgba(16,185,129,0.6)] border-emerald-500',
  void: 'shadow-[0_0_20px_rgba(99,102,241,0.6)] border-indigo-500',
  dark: 'shadow-[0_0_20px_rgba(100,116,139,0.6)] border-slate-500',
};

const renderDeckBack = (deckBack) => {
  switch (deckBack) {
    case 'cyberpunkGrid':
      return (
        <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl bg-slate-950 border-2 border-pink-500/50 flex items-center justify-center overflow-hidden shadow-xl hover:border-cyan-400 transition-colors">
          <div className="absolute inset-0 opacity-30 bg-[linear-gradient(to_right,#ec4899_1px,transparent_1px),linear-gradient(to_bottom,#ec4899_1px,transparent_1px)] bg-[size:20px_20px] animate-pulse"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-pink-500/20 via-transparent to-cyan-500/20"></div>
          <Zap className="text-cyan-400 animate-bounce" size={32} />
        </div>
      );
    case 'voidVortex':
      return (
        <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl bg-black border-2 border-purple-900 flex items-center justify-center overflow-hidden shadow-xl hover:border-purple-500 transition-colors">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-purple-900 via-violet-950 to-black animate-spin [animation-duration:10s]"></div>
          <div className="absolute w-32 h-32 rounded-full border border-purple-500/30 animate-ping [animation-duration:3s]"></div>
          <Eye className="text-purple-400 animate-pulse" size={32} />
        </div>
      );
    case 'goldenAether':
      return (
        <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl bg-amber-950 border-2 border-yellow-600 flex items-center justify-center overflow-hidden shadow-xl hover:border-yellow-400 transition-colors">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400 via-amber-950 to-black"></div>
          <div className="absolute inset-4 border border-yellow-600/30 rounded-lg flex items-center justify-center">
            <div className="w-24 h-24 rotate-45 border-2 border-yellow-500/40 flex items-center justify-center">
              <div className="w-16 h-16 -rotate-45 border border-yellow-400/50 flex items-center justify-center">
                <Star className="text-yellow-400 animate-pulse" size={24} />
              </div>
            </div>
          </div>
        </div>
      );
    case 'standard':
    default:
      return (
        <div className="absolute inset-0 backface-hidden w-full h-full rounded-xl bg-slate-900 border-2 border-slate-700 flex items-center justify-center overflow-hidden shadow-xl hover:border-indigo-500 transition-colors">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
          <div className="grid grid-cols-6 grid-rows-6 gap-1 opacity-10 rotate-45 scale-150">
             {[...Array(36)].map((_, i) => <div key={i} className="w-full h-full border border-indigo-500 group-hover:border-red-500 transition-colors duration-1000"></div>)}
          </div>
          <RotateCcw className="text-indigo-500 animate-pulse glitch-hover" size={32} />
        </div>
      );
  }
};

const rarityBorders = {
  common: 'border-white/10',
  rare: 'border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]',
  'ultra-rare': 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
  glitched: 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-pulse-glow',
};

export const Card = ({ data, isFlipped, onClick, size = 'md', showStats = true, clashing = false, deckBack = 'standard' }) => {
  const sizeClasses = {
    sm: 'w-24 h-40 text-xs',
    md: 'w-64 h-[28rem]',
    lg: 'w-80 h-[36rem]',
  };

  const IconComponent = iconMap[data.icon] || <Sparkles size={64} />;
  const activeDeckBack = data.deckBack || deckBack;

  const frameStyles = {
    standard: '',
    neonGlow: `${glowColors[data.type] || glowColors.void} border-2 animate-pulse`,
    goldFoil: 'border-yellow-500 border-4 shadow-[0_0_20px_rgba(234,179,8,0.5)]',
    glitchMatrix: 'border-emerald-500 border-2 shadow-[0_0_20px_rgba(16,185,129,0.5)]',
  };

  const activeFrame = data.frame || 'standard';
  const activeHat = data.hat || 'none';
  const activeRarity = data.rarity || 'common';

  return (
    <div 
      onClick={onClick}
      className={`relative preserve-3d transition-transform duration-500 cursor-pointer group ${sizeClasses[size]} ${isFlipped ? 'rotate-y-180' : ''} ${clashing ? 'animate-collision' : ''}`}
      style={{ perspective: '1000px', transformStyle: 'preserve-3d' }}
    >
      {/* CARD BACK */}
      {renderDeckBack(activeDeckBack)}

      {/* CARD FRONT */}
      <div className={`absolute inset-0 backface-hidden rotate-y-180 w-full h-full rounded-xl bg-gradient-to-br ${getTypeColor(data.type)} border-2 ${rarityBorders[activeRarity]} ${frameStyles[activeFrame]} backdrop-blur-md flex flex-col shadow-2xl overflow-hidden`}>
        
        {/* Decorative Effects */}
        {activeFrame === 'glitchMatrix' && (
          <div className="absolute inset-0 opacity-10 bg-[linear-gradient(to_bottom,rgba(16,185,129,0.15)_50%,transparent_50%)] bg-[size:100%_4px] pointer-events-none z-10"></div>
        )}
        {activeFrame === 'goldFoil' && (
          <div className="absolute inset-0 opacity-10 bg-gradient-to-tr from-transparent via-white to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 pointer-events-none z-10"></div>
        )}

        {/* Tarot Inner Frame */}
        <div className="absolute inset-2 border border-white/10 rounded-lg pointer-events-none z-20"></div>

        {/* Accessories / Hats */}
        {activeHat === 'cyberCrown' && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-50 filter drop-shadow-[0_0_8px_rgba(234,179,8,0.8)] animate-bounce">
            <Crown className="text-yellow-400 fill-yellow-400/20" size={24} />
          </div>
        )}
        {activeHat === 'glitchHalo' && (
          <div className="absolute top-[18%] left-1/2 -translate-x-1/2 z-20 w-16 h-4 rounded-[50%] border-2 border-cyan-400/80 shadow-[0_0_10px_rgba(34,211,238,0.8)] rotate-12 animate-pulse pointer-events-none"></div>
        )}
        {activeHat === 'retroVisor' && (
          <div className="absolute top-[42%] left-0 right-0 h-6 bg-pink-500/30 border-y border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.8)] z-20 pointer-events-none flex items-center justify-center">
            <span className="text-[8px] font-mono text-pink-300 tracking-[0.3em] animate-pulse">SYSTEM_ACTIVE</span>
          </div>
        )}

        {/* Top Header - Minimal */}
        <div className="p-4 flex justify-between items-start z-30">
          <div className="flex flex-col">
            <div className="text-[10px] font-mono tracking-widest text-white/50 uppercase">{data.type}</div>
            {activeRarity !== 'common' && (
              <div className="text-[8px] font-mono font-bold tracking-wider text-indigo-300 uppercase mt-0.5">{activeRarity}</div>
            )}
          </div>
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

          {/* Active Ability display */}
          {data.ability && data.ability !== 'none' && (
            <div className="px-4 py-1 text-center bg-indigo-950/40 border-t border-white/5">
              <span className="text-[8px] font-mono text-indigo-300 font-bold uppercase tracking-wider block">Ability: {data.ability.toUpperCase()}</span>
              <span className="text-[8px] font-mono text-white/40 block">
                {data.ability === 'overdrive' && '+10 ATK in Speed Blitz mode'}
                {data.ability === 'ironWall' && '+20 DEF in Sudden Death mode'}
                {data.ability === 'voidShield' && 'Ignores elemental advantages'}
              </span>
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
