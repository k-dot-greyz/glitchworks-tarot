import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { usePersistedDeck } from './usePersistedDeck.js';
import { createMemoryDeckStorage } from '../adapters/memoryDeckStorage.js';
import { CardFixture, DeckStateFixture } from '../testFixtures/cardFixture.js';
import { aetherConfig } from '../config/aetherConfig.js';

describe('usePersistedDeck — hostile edge / persistence boundary', () => {
  const fallbackDeck = [
    new CardFixture({ id: '001', name: 'Fallback Alpha' }).build(),
    new CardFixture({ id: '002', name: 'Fallback Beta' }).build(),
  ];

  it('falls back when aether-decks JSON is corrupted', () => {
    const storage = createMemoryDeckStorage({
      'aether-decks': '{"decks":[{"id":"broken"',
    });
    const telemetry = { log: vi.fn() };

    const { result } = renderHook(() =>
      usePersistedDeck(storage, telemetry, fallbackDeck),
    );

    expect(result.current.decks).toHaveLength(1);
    expect(result.current.deck[0].name).toBe('Fallback Alpha');
    expect(telemetry.log).toHaveBeenCalledWith(
      'error',
      'DECKS_PARSE_FAILED',
      expect.objectContaining({ error: expect.any(String) }),
    );
  });

  it('replaces invalid deck cards with fallback deck', () => {
    const corruptState = new DeckStateFixture({
      cards: [{ id: '', name: 'Injected', type: 'void' }],
    }).serialize();

    const storage = createMemoryDeckStorage({ 'aether-decks': corruptState });
    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, fallbackDeck),
    );

    expect(result.current.deck).toEqual(fallbackDeck);
  });

  it('does not pollute Object.prototype from JSON storage payloads', () => {
    const polluted = JSON.stringify({
      activeDeckId: 'default',
      decks: [
        {
          id: 'default',
          name: 'Polluted',
          deckBack: 'standard',
          cards: [new CardFixture({ id: '099', name: 'Proto' }).build()],
        },
      ],
      __proto__: { polluted: true },
    });

    const storage = createMemoryDeckStorage({ 'aether-decks': polluted });
    renderHook(() => usePersistedDeck(storage, null, fallbackDeck));

    expect(Object.prototype.polluted).toBeUndefined();
  });

  it('migrates legacy single-deck storage when aether-decks is absent', () => {
    const legacyDeck = [new CardFixture({ id: '010', name: 'Legacy Card' }).build()];
    const storage = createMemoryDeckStorage({
      [aetherConfig.storageKey]: JSON.stringify(legacyDeck),
    });

    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, fallbackDeck),
    );

    expect(result.current.deck[0].name).toBe('Legacy Card');
  });

  it('setDeck throws when passed an invalid deck', () => {
    const storage = createMemoryDeckStorage();
    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, fallbackDeck),
    );

    let caught = null;
    try {
      act(() => {
        result.current.setDeck([{ id: '', name: 'Bad' }]);
      });
    } catch (err) {
      caught = err;
    }
    expect(caught?.message).toBe('Cannot set invalid deck');
  });

  it('switchDeck ignores unknown deck ids', () => {
    const storage = createMemoryDeckStorage();
    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, fallbackDeck),
    );

    const before = result.current.activeDeckId;
    act(() => {
      result.current.switchDeck('nonexistent-deck-id');
    });
    expect(result.current.activeDeckId).toBe(before);
  });

  it('deleteDeck is a no-op when only one deck remains', () => {
    const storage = createMemoryDeckStorage();
    const { result } = renderHook(() =>
      usePersistedDeck(storage, null, fallbackDeck),
    );

    act(() => {
      result.current.deleteDeck(result.current.activeDeckId);
    });

    expect(result.current.decks).toHaveLength(1);
  });

  it('logs telemetry when persistence save fails', () => {
    const storage = createMemoryDeckStorage();
    const failingStorage = {
      load: storage.load,
      save: () => ({ ok: false, error: 'QuotaExceededError' }),
      clear: storage.clear,
    };
    const telemetry = { log: vi.fn() };

    renderHook(() => usePersistedDeck(failingStorage, telemetry, fallbackDeck));

    expect(telemetry.log).toHaveBeenCalledWith(
      'warn',
      'DECKS_SAVE_QUOTA_EXCEEDED',
      expect.objectContaining({ error: expect.stringContaining('QuotaExceededError') }),
    );
  });
});
