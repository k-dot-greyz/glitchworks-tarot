import { useState, useEffect } from 'react';
import { parseStoredDeck } from '../domain/deckValidation.js';
import { hydrateDeck, dehydrateDeck, forgeCard } from '../domain/deckState.js';
import { aetherConfig } from '../config/aetherConfig.js';

export function usePersistedDeck(storage, telemetry, fallbackDeck) {
  const [deck, setDeck] = useState(() => {
    const raw = storage.load(aetherConfig.storageKey);
    const parsedResult = parseStoredDeck(raw, telemetry);
    return hydrateDeck(fallbackDeck, parsedResult);
  });

  useEffect(() => {
    try {
      const serialized = dehydrateDeck(deck);
      const result = storage.save(aetherConfig.storageKey, serialized);
      if (result && !result.ok && telemetry) {
        telemetry.log('warn', 'DECK_SAVE_QUOTA_EXCEEDED', { error: result.error });
      }
    } catch (err) {
      if (telemetry) {
        telemetry.log('error', 'DECK_SAVE_FAILED', { error: err.message });
      }
    }
  }, [deck, storage, telemetry]);

  const compileForgeCard = (forgeData) => {
    // Compute the new card's ID inside the functional updater so that rapid back-to-back
    // calls (e.g. double-click) each see the latest deck rather than a stale closure
    // snapshot, preventing duplicate IDs from being generated.
    setDeck(prevDeck => {
      const newCard = forgeCard(prevDeck, forgeData);
      return [...prevDeck, newCard];
    });
  };

  return {
    deck,
    setDeck,
    compileForgeCard,
  };
}
