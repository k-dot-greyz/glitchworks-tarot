import { describe, it, expect, beforeEach } from 'vitest';
import { existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import INITIAL_DECK from './default_deck.json';
import { DefaultDeckHarness } from './test/fixtures/DefaultDeckHarness.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

describe('default_deck.json — canonical shipped deck', () => {
  let harness;

  beforeEach(() => {
    harness = new DefaultDeckHarness();
  });

  it('passes full canonical invariant suite (schema, ids, anchors, count)', () => {
    expect(() => harness.assertCanonical(INITIAL_DECK)).not.toThrow();
    expect(harness.loadDeck()).toEqual(INITIAL_DECK);
  });

  it('rejects Last.fm / scrobble overlay contamination (PR #25 regression)', () => {
    const contaminated = harness.loadDeck().map((card) =>
      card.id === harness.anchorCards.fool.id
        ? {
            ...card,
            sub: 'Sync: Hako Yamazaki',
            desc: 'Resonance detected (25 scrobbles).',
          }
        : card,
    );
    expect(() => harness.assertNoContamination(contaminated)).toThrow(
      /contamination/i,
    );
  });

  it('dynamic_deck.json is removed — App must not ship overlay artifact', () => {
    const legacyPath = join(__dirname, 'dynamic_deck.json');
    expect(existsSync(legacyPath)).toBe(false);
  });

  it('The Fool sub is canonical, not external stats injection', () => {
    const fool = INITIAL_DECK.find((c) => c.id === harness.anchorCards.fool.id);
    expect(fool.sub).toBe(harness.anchorCards.fool.sub);
    expect(fool.sub).not.toMatch(/sync:|scrobble|last\.?fm/i);
  });
});

describe('package-lock.json — transitive dependency security pins', () => {
  let harness;

  beforeEach(() => {
    harness = new DefaultDeckHarness();
  });

  it('pins @xmldom/xmldom and fast-uri at patched minimums (PR #36)', () => {
    expect(() => harness.assertPinnedDependencies()).not.toThrow();
    expect(harness.resolveLockfileVersion('@xmldom/xmldom')).toBe('0.8.15');
    expect(harness.resolveLockfileVersion('fast-uri')).toBe('3.1.7');
  });
});
