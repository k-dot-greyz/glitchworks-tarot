// Card theme tokens, extracted verbatim from Card.jsx so the PR spread can
// reuse the same tarot frame styling.
export const glowColors = {
  fire: 'shadow-[0_0_20px_rgba(239,68,68,0.6)] border-red-500',
  water: 'shadow-[0_0_20px_rgba(59,130,246,0.6)] border-blue-500',
  electric: 'shadow-[0_0_20px_rgba(234,179,8,0.6)] border-yellow-500',
  wind: 'shadow-[0_0_20px_rgba(16,185,129,0.6)] border-emerald-500',
  void: 'shadow-[0_0_20px_rgba(99,102,241,0.6)] border-indigo-500',
  dark: 'shadow-[0_0_20px_rgba(100,116,139,0.6)] border-slate-500',
};

export const rarityBorders = {
  common: 'border-white/10',
  rare: 'border-slate-300 shadow-[0_0_10px_rgba(203,213,225,0.4)]',
  'ultra-rare': 'border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]',
  glitched: 'border-pink-500 shadow-[0_0_15px_rgba(236,72,153,0.5)] animate-pulse-glow',
};
