import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedDeck } from './usePersistedDeck.js';
import { createMemoryDeckStorage } from '../adapters/memoryDeckStorage.js';
import { AetherTestFixtures } from '../test/fixtures/AetherTestFixtures.js';

const forgeFallbackDeck = [
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
  let fixtures;
  let fallbackDeck;
  let telemetry;

  beforeEach(() => {
    fixtures = new AetherTestFixtures();
    fallbackDeck = fixtures.validDeck(3);
    telemetry = { log: vi.fn() };
  });

  function renderPersistedDeck(storageSeed = {}) {
    const storage = createMemoryDeckStorage(storageSeed);
    return renderHook(() =>
      usePersistedDeck(storage, telemetry, fallbackDeck),
    );
  }

  it('compileForgeCard: two rapid compiles before flush get unique IDs (stale-closure regression)', () => {
    const storage = createMemoryDeckStorage();
    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, forgeFallbackDeck),
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

  it('hydrates valid multi-deck state from storage', () => {
    const persisted = fixtures.multiDeckState({
      cards: fixtures.validDeck(2),
    });
    const { result } = renderPersistedDeck({
      [fixtures.storageKeys.multiDeck]: JSON.stringify(persisted),
    });

    expect(result.current.activeDeckId).toBe(persisted.activeDeckId);
    expect(result.current.deck).toHaveLength(2);
  });

  it('replaces invalid stored cards with fallback deck at boundary', () => {
    const corrupted = fixtures.multiDeckState({
      cards: [{ id: '', name: 'Broken', stats: { atk: 1 } }],
    });
    const { result } = renderPersistedDeck({
      [fixtures.storageKeys.multiDeck]: JSON.stringify(corrupted),
    });

    expect(result.current.deck).toEqual(fallbackDeck);
  });

  it('logs parse failure and migrates when multi-deck JSON is corrupted', () => {
    const { result } = renderPersistedDeck({
      [fixtures.storageKeys.multiDeck]: '{"decks":[broken',
    });

    expect(telemetry.log).toHaveBeenCalledWith(
      'error',
      'DECKS_PARSE_FAILED',
      expect.objectContaining({ error: expect.any(String) }),
    );
    expect(result.current.deck).toEqual(fallbackDeck);
  });

  it('rejects setDeck updates that fail schema validation', () => {
    const { result } = renderPersistedDeck();

    expect(() => {
      act(() => {
        result.current.setDeck([{ injected: true }]);
      });
    }).toThrow('Cannot set invalid deck');
  });

  it('ignores switchDeck to unknown deck ids (no state corruption)', () => {
    const persisted = fixtures.multiDeckState();
    const { result } = renderPersistedDeck({
      [fixtures.storageKeys.multiDeck]: JSON.stringify(persisted),
    });

    act(() => {
      result.current.switchDeck('agentic-unknown-deck-id');
    });

    expect(result.current.activeDeckId).toBe(persisted.activeDeckId);
  });

  it('normalizes orphan activeDeckId to the first valid deck at hydration boundary', () => {
    const orphaned = fixtures.orphanActiveDeckState();
    const { result } = renderPersistedDeck({
      [fixtures.storageKeys.multiDeck]: JSON.stringify(orphaned),
    });

    expect(result.current.activeDeckId).toBe(fixtures.deckIds.default);
    expect(result.current.deck).toHaveLength(2);
    expect(result.current.decks.every((d) => Array.isArray(d.cards))).toBe(true);
  });

  it('recovers malformed deck entries missing cards array with fallback deck', () => {
    const malformed = fixtures.malformedDeckEntryState({
      malformedEntry: { id: fixtures.deckIds.recovered, name: 'BROKEN SHELL' },
    });
    const { result } = renderPersistedDeck({
      [fixtures.storageKeys.multiDeck]: JSON.stringify(malformed),
    });

    const recovered = result.current.decks.find(
      (d) => d.id === fixtures.deckIds.recovered,
    );
    expect(recovered).toBeDefined();
    expect(recovered.name).toBe('BROKEN SHELL');
    expect(recovered.cards).toEqual(fallbackDeck);
  });

  it('createDeck and duplicateDeck use crypto.randomUUID when available', () => {
    const createUuid = '00000000-0000-4000-8000-000000000001';
    const duplicateUuid = '00000000-0000-4000-8000-000000000002';
    vi.stubGlobal('crypto', {
      randomUUID: vi
        .fn()
        .mockReturnValueOnce(createUuid)
        .mockReturnValueOnce(duplicateUuid),
    });

    const { result } = renderPersistedDeck();

    let created;
    act(() => {
      created = result.current.createDeck('UUID DECK');
    });
    expect(created.id).toBe(`deck-${createUuid}`);

    act(() => {
      result.current.duplicateDeck(fixtures.deckIds.default);
    });
    const ids = result.current.decks.map((d) => d.id);
    expect(ids).toContain(`deck-${createUuid}`);
    expect(ids).toContain(`deck-${duplicateUuid}`);
    expect(new Set(ids).size).toBe(ids.length);

    vi.unstubAllGlobals();
  });

  it('survives malicious stored payloads without crashing', () => {
    const payloads = fixtures.maliciousStoredDeckPayloads();

    for (const raw of Object.values(payloads)) {
      const { result, unmount } = renderPersistedDeck({
        [fixtures.storageKeys.multiDeck]: raw,
      });
      expect(result.current.deck.length).toBeGreaterThan(0);
      expect(() => JSON.parse(JSON.stringify(result.current.decks))).not.toThrow();
      unmount();
    }
  });

  it('surfaces save quota failures through telemetry', () => {
    const storage = createMemoryDeckStorage();
    const failingStorage = {
      load: storage.load,
      save: () => ({ ok: false, error: 'QuotaExceededError' }),
      clear: storage.clear,
    };

    renderHook(() => usePersistedDeck(failingStorage, telemetry, fallbackDeck));

    expect(telemetry.log).toHaveBeenCalledWith(
      'warn',
      'DECKS_SAVE_QUOTA_EXCEEDED',
      expect.objectContaining({ error: 'QuotaExceededError' }),
    );
  });
});
