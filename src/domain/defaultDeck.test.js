import { describe, it, expect, beforeEach } from 'vitest';
import { validateDeck } from './deckValidation.js';
import { drawSpread } from './deckState.js';
import { DefaultDeckHarness } from '../test/fixtures/DefaultDeckHarness.js';

describe('default_deck.json — shipped canonical deck invariants', () => {
  let harness;

  beforeEach(() => {
    harness = new DefaultDeckHarness();
  });

  it('passes deck schema validation for every shipped card', () => {
    expect(harness.assertSchemaValid()).toBe(true);
    expect(validateDeck(harness.shippedDeck)).toBe(true);
  });

  it('contains the expected card count without duplicate ids', () => {
    expect(harness.assertExpectedCount()).toBe(true);
    expect(harness.assertUniqueIds()).toBe(true);
  });

  it('anchors The Fool and The Glitch as canonical boundary cards', () => {
    expect(harness.assertAnchorCardsPresent()).toBe(true);
    expect(harness.findCardById(harness.anchorCards.first.id)?.name).toBe(
      harness.anchorCards.first.name,
    );
    expect(harness.findCardById(harness.anchorCards.glitch.id)?.name).toBe(
      harness.anchorCards.glitch.name,
    );
  });

  it('does not embed external stats API coupling patterns (Last.fm regression)', () => {
    expect(harness.assertForbiddenPatternsAbsent()).toBe(true);
  });

  it('assigns the next forge id above the shipped max without collision', () => {
    const forged = harness.nextForgedCard();
    expect(forged.id).toBe(harness.nextForgeIdAfterShipped);
    expect(harness.cardIds()).not.toContain(forged.id);
  });

  it('drawSpread handles the full shipped deck deterministically', () => {
    const spread = drawSpread(harness.shippedDeck, 3, () => 0.42);
    expect(spread).toHaveLength(3);
    spread.forEach((card) => {
      expect(harness.cardIds()).toContain(card.id);
    });
  });

  it('rejects tampered shipped deck when constructor overrides inject invalid cards', () => {
    const tampered = new DefaultDeckHarness({
      shippedDeck: [
        {
          id: '',
          name: 'Injected',
          sub: '',
          type: 'void',
          stats: { atk: 1, def: 1, spd: 1 },
          desc: '',
        },
      ],
      expectedCardCount: 1,
    });

    expect(tampered.assertSchemaValid()).toBe(false);
    expect(tampered.assertUniqueIds()).toBe(true);
  });
});
