import React from 'react';

export const NeonSlider = ({ value, onChange, label, color = "indigo" }) => {
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
