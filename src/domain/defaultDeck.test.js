import { describe, it, expect, beforeEach } from 'vitest';
import INITIAL_DECK from '../default_deck.json';
import { validateDeck } from './deckValidation.js';
import { AetherTestFixtures } from '../test/fixtures/AetherTestFixtures.js';

/**
 * Canonical shipped deck contract (PR #25 decoupled Last.fm overlay).
 * Values come from fixture constructor — specs stay free of magic literals.
 */
describe('default_deck.json — canonical contract', () => {
  let fixtures;

  beforeEach(() => {
    fixtures = new AetherTestFixtures();
  });

  it('passes schema validation for every shipped card', () => {
    expect(validateDeck(INITIAL_DECK)).toBe(true);
  });

  it('has stable card count and unique ids', () => {
    const ids = INITIAL_DECK.map((card) => card.id);
    expect(INITIAL_DECK).toHaveLength(fixtures.defaultDeckContract.expectedCardCount);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('anchors The Fool at id 000 for dex/oracle UX', () => {
    const fool = INITIAL_DECK.find(
      (card) => card.id === fixtures.defaultDeckContract.anchorCardId,
    );
    expect(fool?.name).toBe(fixtures.defaultDeckContract.anchorCardName);
  });

  it('does not ship Last.fm or scrobble overlay tokens in deck data', () => {
    const blob = JSON.stringify(INITIAL_DECK).toLowerCase();
    for (const token of fixtures.defaultDeckContract.forbiddenOverlayTokens) {
      expect(blob).not.toContain(token);
    }
  });

  it('includes MTG banlist boundary card The Magician (001)', () => {
    const magician = INITIAL_DECK.find(
      (card) => card.id === fixtures.defaultDeckContract.bannedMtgExampleId,
    );
    expect(magician?.name).toBe('The Magician');
  });
});
