import { describe, it, expect, beforeEach } from 'vitest';
import INITIAL_DECK from './default_deck.json';
import { validateDeck } from './domain/deckValidation.js';
import { AetherTestFixtures } from './test/fixtures/AetherTestFixtures.js';

describe('default_deck.json (canonical shipped deck)', () => {
  let fixtures;

  beforeEach(() => {
    fixtures = new AetherTestFixtures();
  });

  it('passes schema validation for every card', () => {
    expect(validateDeck(INITIAL_DECK)).toBe(true);
  });

  it('ships tarot canon without Last.fm scrobble overlay in sub or desc', () => {
    const scrobblePattern = /scrobble|Sync:/i;

    for (const card of INITIAL_DECK) {
      expect(card.sub).not.toMatch(scrobblePattern);
      expect(card.desc).not.toMatch(scrobblePattern);
    }
  });

  it('exposes expected anchor cards for dex and arena boundary tests', () => {
    const fool = INITIAL_DECK.find((card) => card.id === '000');
    const magician = INITIAL_DECK.find((card) => card.id === '001');

    expect(fool?.name).toBe(fixtures.cardTemplate.name);
    expect(fool?.sub).toBe('Infinite Potential');
    expect(magician?.name).toBe('The Magician');
    expect(magician?.type).toBe('fire');
  });
});
