import { describe, it, expect } from 'vitest';
import { ORACLE_LAYOUTS, spreadCardCount } from './oracleLayouts.js';

describe('oracleLayouts', () => {
  it('returns 3 cards for the default past/present/future spread', () => {
    expect(spreadCardCount('threeCard')).toBe(3);
  });

  it('returns 5 cards for Celtic Cross', () => {
    expect(spreadCardCount('celticCross')).toBe(5);
  });

  it('returns 3 cards for The Clash', () => {
    expect(spreadCardCount('theClash')).toBe(3);
  });

  it('falls back to 3 cards for an unknown layout', () => {
    expect(spreadCardCount('not-a-spread')).toBe(3);
  });

  it('exposes classic tarot layouts for the generator UI', () => {
    expect(Object.keys(ORACLE_LAYOUTS)).toEqual([
      'threeCard',
      'celticCross',
      'theClash',
    ]);
    expect(ORACLE_LAYOUTS.threeCard.label).toMatch(/PAST/);
  });
});
