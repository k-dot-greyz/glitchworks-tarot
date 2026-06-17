import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedDeck } from './usePersistedDeck.js';
import { createMemoryDeckStorage } from '../adapters/memoryDeckStorage.js';
import { AetherTestFixtures } from '../test/fixtures/AetherTestFixtures.js';

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
