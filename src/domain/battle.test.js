import { describe, it, expect } from 'vitest';
import { resolveBattle } from './battle.js';

describe('battle', () => {
  const p1 = {
    name: 'Alpha',
    type: 'fire',
    stats: { atk: 50, def: 50, spd: 50 },
  };

  const p2 = {
    name: 'Omega',
    type: 'wind',
    stats: { atk: 50, def: 50, spd: 50 },
  };

  it('resolveBattle determines winner based on stats and elemental advantage', () => {
    // Fire has wind advantage (1.5x)
    const result = resolveBattle(p1, p2);
    expect(result.winner).toBe('p1');
    expect(result.p1Advantage).toBe(1.5);
    expect(result.p2Advantage).toBe(1.0);
    expect(result.logLine).toContain('ALPHA OVERWRITES OMEGA');
  });

  it('resolveBattle handles ties (equilibrium)', () => {
    const p1Same = { ...p1, type: 'void' };
    const p2Same = { ...p2, type: 'void' };
    const result = resolveBattle(p1Same, p2Same);
    expect(result.winner).toBeNull();
    expect(result.logLine).toBe('> EQUILIBRIUM ACHIEVED. NO DELETION.');
  });
});
