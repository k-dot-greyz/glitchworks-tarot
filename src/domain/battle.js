import { ELEMENTAL_ADVANTAGE } from './elemental.js';

export function resolveBattle(p1, p2) {
  if (!p1 || !p2) {
    return {
      winner: null,
      logLine: '[ ERR: INCOMPLETE DATA ]',
      p1Advantage: 1.0,
      p2Advantage: 1.0,
    };
  }

  const p1Advantage = ELEMENTAL_ADVANTAGE[p1.type]?.[p2.type] || 1.0;
  const p2Advantage = ELEMENTAL_ADVANTAGE[p2.type]?.[p1.type] || 1.0;

  const p1Score = (p1.stats.atk + p1.stats.spd) * p1Advantage;
  const p2Score = (p2.stats.atk + p2.stats.spd) * p2Advantage;

  if (p1Score > p2Score) {
    return {
      winner: 'p1',
      logLine: `> ${p1.name.toUpperCase()} OVERWRITES ${p2.name.toUpperCase()}${p1Advantage > 1.0 ? " (TYPE_ADVANTAGE)" : ""}`,
      p1Advantage,
      p2Advantage,
    };
  } else if (p2Score > p1Score) {
    return {
      winner: 'p2',
      logLine: `> ${p2.name.toUpperCase()} OVERWRITES ${p1.name.toUpperCase()}${p2Advantage > 1.0 ? " (TYPE_ADVANTAGE)" : ""}`,
      p1Advantage,
      p2Advantage,
    };
  } else {
    return {
      winner: null,
      logLine: "> EQUILIBRIUM ACHIEVED. NO DELETION.",
      p1Advantage,
      p2Advantage,
    };
  }
}
