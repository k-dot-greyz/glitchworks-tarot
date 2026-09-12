import { describe, it, expect } from 'vitest';
import defaultDeck from '../default_deck.json';
import { DefaultDeckHarness } from '../testFixtures/defaultDeckHarness.js';

describe('default_deck.json — canonical shipped deck boundary', () => {
  const harness = new DefaultDeckHarness({
    deck: defaultDeck,
    forbiddenFieldPatterns: [
      /lastfm/i,
      /scrobble/i,
      /playcount/i,
      /listener/i,
      /overlay/i,
      /external/i,
      /__proto__/i,
      /constructor/i,
    ],
    anchorCardNames: ['The Fool', 'The Magician', 'The Glitch'],
    minCardCount: 15,
    maxCardCount: 25,
  });

  it('passes validateDeck and structural invariants', () => {
    expect(() => harness.assertAllInvariants()).not.toThrow();
  });

  it('does not contain dynamic stats injection field names', () => {
    const serialized = JSON.stringify(defaultDeck);
    expect(serialized).not.toMatch(/lastfm|scrobble|playcount|listener/i);
  });

  it('uses canonical tarot ids without duplicate entries', () => {
    const ids = defaultDeck.map((card) => card.id);
    expect(ids).toContain('000');
    expect(ids).toContain('404');
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('rejects agent-crafted deck payloads that mimic default ids with forbidden keys', () => {
    const forged = defaultDeck.map((card) =>
      card.id === '000'
        ? { ...card, lastfm_playcount: 99999, scrobble_rank: 1 }
        : card,
    );
    const forgedHarness = new DefaultDeckHarness({
      deck: forged,
      forbiddenFieldPatterns: harness.forbiddenFieldPatterns,
      anchorCardNames: harness.anchorCardNames,
      minCardCount: harness.minCardCount,
      maxCardCount: harness.maxCardCount,
    });

    expect(() => forgedHarness.assertNoForbiddenFields()).toThrow(/Forbidden field/);
  });
});
