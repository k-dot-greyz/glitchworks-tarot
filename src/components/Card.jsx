import React from 'react';
import {
  Sword, Shield, Wind, Sparkles, RotateCcw, Flame, Droplets, Zap, Skull, Eye, Star, Hammer
} from 'lucide-react';
import { getTypeColor } from '../domain/elemental.js';

const iconMap = {
  Sparkles: <Sparkles size={64} />, Flame: <Flame size={64} />, Droplets: <Droplets size={64} />,
  Zap: <Zap size={64} />, Skull: <Skull size={64} />, Wind: <Wind size={64} />,
  Eye: <Eye size={64} />, Star: <Star size={64} />, Sword: <Sword size={64} />,
  Shield: <Shield size={64} />, Hammer: <Hammer size={64} />,
};

export const Card = ({ data, isFlipped, onClick, size = 'md', showStats = true, clashing = false }) => {
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
