import { useState, useEffect } from 'react';
import { parseStoredDeck, validateDeck } from "../domain/deckValidation.js";
import { hydrateDeck, forgeCard } from "../domain/deckState.js";
import { aetherConfig } from '../config/aetherConfig.js';

export function usePersistedDeck(storage, telemetry, fallbackDeck) {
  // Load and migrate state on initialization
  const [state, setState] = useState(() => {
    const rawDecks = storage.load("aether-decks");
    let parsed = null;

    if (rawDecks) {
      try {
        parsed = JSON.parse(rawDecks);
      } catch (e) {
        if (telemetry) {
          telemetry.log("error", "DECKS_PARSE_FAILED", { error: e.message });
        }
      }
    }

    // If we have valid multiple decks state, use it
    if (
      parsed &&
      Array.isArray(parsed.decks) &&
      parsed.decks.length > 0 &&
      parsed.activeDeckId
    ) {
      // Validate each deck's cards
      const validatedDecks = parsed.decks.map((d) => {
        if (validateDeck(d.cards)) {
          return d;
        }
        return { ...d, cards: fallbackDeck };
      });
      return {
        activeDeckId: parsed.activeDeckId,
        decks: validatedDecks,
      };
    }

    // Fallback/Migration: Check if old single deck exists
    const oldRaw = storage.load(aetherConfig.storageKey);
    const parsedOld = parseStoredDeck(oldRaw, telemetry);
    const initialCards = hydrateDeck(fallbackDeck, parsedOld);

    const defaultDeck = {
      id: "default",
      name: "AETHER DECK",
      deckBack: "standard",
      cards: initialCards,
    };

    return {
      activeDeckId: "default",
      decks: [defaultDeck],
    };
  });

  // Persist to storage whenever state changes
  useEffect(() => {
    try {
      const serialized = JSON.stringify(state);
      const result = storage.save("aether-decks", serialized);
      if (result && !result.ok && telemetry) {
        telemetry.log("warn", "DECKS_SAVE_QUOTA_EXCEEDED", {
          error: result.error,
        });
      }
    } catch (err) {
      if (telemetry) {
        telemetry.log("error", "DECKS_SAVE_FAILED", { error: err.message });
      }
    }
  }, [state, storage, telemetry]);

  // Derived active deck
  const activeDeck =
    state.decks.find((d) => d.id === state.activeDeckId) || state.decks[0];
  const deck = activeDeck.cards;

  // Setter for active deck cards (backward compatibility)
  const setDeck = (newCardsOrFn) => {
    setState((prev) => {
      const currentActiveDeck =
        prev.decks.find((d) => d.id === prev.activeDeckId) || prev.decks[0];
      const newCards =
        typeof newCardsOrFn === "function"
          ? newCardsOrFn(currentActiveDeck.cards)
          : newCardsOrFn;

      if (!validateDeck(newCards)) {
        throw new Error("Cannot set invalid deck");
      }

      return {
        ...prev,
        decks: prev.decks.map((d) =>
          d.id === prev.activeDeckId ? { ...d, cards: newCards } : d,
        ),
      };
    });
  };

  // Switch active deck
  const switchDeck = (id) => {
    if (state.decks.some((d) => d.id === id)) {
      setState((prev) => ({ ...prev, activeDeckId: id }));
    }
  };

  // Create a new deck
  const createDeck = (name) => {
    const newId = `deck-${Date.now()}`;
    const newDeck = {
      id: newId,
      name: name || `DECK_${state.decks.length + 1}`,
      deckBack: "standard",
      cards: [...fallbackDeck],
    };
    setState((prev) => ({
      activeDeckId: newId,
      decks: [...prev.decks, newDeck],
    }));
    return newDeck;
  };

  // Duplicate an existing deck
  const duplicateDeck = (id) => {
    const target = state.decks.find((d) => d.id === id);
    if (!target) return;

    const newId = `deck-${Date.now()}`;
    const duplicated = {
      ...target,
      id: newId,
      name: `${target.name} COPY`,
      cards: [...target.cards],
    };
    setState((prev) => ({
      activeDeckId: newId,
      decks: [...prev.decks, duplicated],
    }));
  };

  // Rename a deck
  const renameDeck = (id, newName) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) => (d.id === id ? { ...d, name: newName } : d)),
    }));
  };

  // Delete a deck
  const deleteDeck = (id) => {
    if (state.decks.length <= 1) return; // Cannot delete last deck
    setState((prev) => {
      const remaining = prev.decks.filter((d) => d.id !== id);
      const nextActiveId =
        prev.activeDeckId === id ? remaining[0].id : prev.activeDeckId;
      return {
        activeDeckId: nextActiveId,
        decks: remaining,
      };
    });
  };

  // Set deck back for active deck
  const setDeckBack = (back) => {
    setState((prev) => ({
      ...prev,
      decks: prev.decks.map((d) =>
        d.id === prev.activeDeckId ? { ...d, deckBack: back } : d,
      ),
    }));
  };

  const compileForgeCard = (forgeData) => {
    const newCard = forgeCard(deck, forgeData);
    setDeck((prevDeck) => [...prevDeck, newCard]);
    return newCard;
  };

  return {
    decks: state.decks,
    activeDeckId: state.activeDeckId,
    deck,
    setDeck,
    deckBack: activeDeck.deckBack,
    setDeckBack,
    switchDeck,
    createDeck,
    duplicateDeck,
    renameDeck,
    deleteDeck,
    compileForgeCard,
  };
}
