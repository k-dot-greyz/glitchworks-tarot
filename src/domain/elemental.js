export const ELEMENTAL_ADVANTAGE = {
  fire: { wind: 1.5, electric: 1.2 },
  wind: { electric: 1.5, water: 1.2 },
  electric: { water: 1.5, fire: 1.2 },
  water: { fire: 1.5, wind: 1.2 },
  void: { fire: 1.1, water: 1.1, electric: 1.1, wind: 1.1, dark: 2.0 },
  dark: { fire: 1.2, water: 1.2, electric: 1.2, wind: 1.2 },
};

export const getTypeColor = (type) => {
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
