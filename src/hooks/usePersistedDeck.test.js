import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedDeck } from './usePersistedDeck.js';
import { createMemoryDeckStorage } from '../adapters/memoryDeckStorage.js';

const fallbackDeck = [
  {
    id: '001',
    name: 'Alpha',
    sub: '',
    type: 'void',
    stats: { atk: 1, def: 1, spd: 1 },
    desc: '',
  },
];

function forged(name) {
  return {
    name,
    sub: '',
    type: 'void',
    stats: { atk: 10, def: 10, spd: 10 },
    desc: '',
  };
}

describe('usePersistedDeck', () => {
  it('compileForgeCard: two rapid compiles before flush get unique IDs (stale-closure regression)', () => {
    const storage = createMemoryDeckStorage();
    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, fallbackDeck),
    );

    // Both compiles land in the same act() — same render closure, no flush in between.
    act(() => {
      result.current.compileForgeCard(forged('One'));
      result.current.compileForgeCard(forged('Two'));
    });

    const ids = result.current.deck.map((c) => c.id);
    expect(ids).toEqual(['001', '002', '003']);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
