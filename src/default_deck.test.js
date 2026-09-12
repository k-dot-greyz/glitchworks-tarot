import { describe, it, expect, beforeEach } from 'vitest';
import defaultDeck from './default_deck.json';
import { validateDeck, validateCard } from './domain/deckValidation.js';
import { ComponentLibraryHarness } from './test/fixtures/ComponentLibraryHarness.js';

describe('shipped default_deck.json integrity', () => {
  let harness;

  beforeEach(() => {
    harness = new ComponentLibraryHarness({
      validCardId: '000',
      cardName: 'The Fool',
    });
  });

  it('passes deck schema validation for every shipped card', () => {
    expect(validateDeck(defaultDeck)).toBe(true);
    for (const card of defaultDeck) {
      expect(validateCard(card)).toBe(true);
    }
  });

  it('uses unique string ids across the canonical deck', () => {
    const ids = defaultDeck.map((card) => card.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('includes the Fool as the canonical origin card', () => {
    const fool = defaultDeck.find((card) => card.id === '000');
    expect(fool).toBeTruthy();
    expect(fool.name).toBe('The Fool');
  });

  it('rejects agentic mutations that strip required stats from a valid card', () => {
    const base = defaultDeck[0];
    const mutated = { ...base, stats: { atk: 'fifty', def: 10, spd: 10 } };
    expect(validateCard(mutated)).toBe(false);
    expect(validateCard(harness.base.validCard({ id: base.id }))).toBe(true);
  });
});
