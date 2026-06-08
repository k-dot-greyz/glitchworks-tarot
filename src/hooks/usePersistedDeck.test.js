import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedDeck } from './usePersistedDeck.js';
import { createMemoryDeckStorage } from '../adapters/memoryDeckStorage.js';

const CARD_PROTO = { sub: '', type: 'void', stats: { atk: 10, def: 10, spd: 10 }, desc: '' };

const SEED_DECK = [
  { id: '001', name: 'Alpha', ...CARD_PROTO },
];

const FORGE_DATA = { name: 'Forged', ...CARD_PROTO };

describe('usePersistedDeck', () => {
  it('compileForgeCard: two rapid calls before re-render produce unique IDs (no stale-closure collision)', () => {
    const storage = createMemoryDeckStorage();
    const telemetry = { log: vi.fn() };

    const { result } = renderHook(() =>
      usePersistedDeck(storage, telemetry, SEED_DECK)
    );

    // Simulate two compileForgeCard calls in the same synchronous batch (rapid double-click).
    // Before the fix, both calls read the same stale closed-over `deck`, computed the same
    // maxId, and produced duplicate IDs. After the fix, each updater receives the previous
    // committed state, so IDs are sequential and unique.
    act(() => {
      result.current.compileForgeCard(FORGE_DATA);
      result.current.compileForgeCard(FORGE_DATA);
    });

    const ids = result.current.deck.map(c => c.id);
    expect(ids.length).toBe(3); // 1 seed + 2 forged
    expect(new Set(ids).size).toBe(ids.length); // all unique
    expect(ids[1]).toBe('002');
    expect(ids[2]).toBe('003');
  });

  it('compileForgeCard: single forge appends card with next ID', () => {
    const storage = createMemoryDeckStorage();
    const telemetry = { log: vi.fn() };

    const { result } = renderHook(() =>
      usePersistedDeck(storage, telemetry, SEED_DECK)
    );

    act(() => {
      result.current.compileForgeCard(FORGE_DATA);
    });

    expect(result.current.deck.length).toBe(2);
    expect(result.current.deck[1].id).toBe('002');
    expect(result.current.deck[1].name).toBe('Forged');
  });
});
