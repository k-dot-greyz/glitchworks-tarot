import INITIAL_DECK from '../../default_deck.json';
import { validateDeck } from '../../domain/deckValidation.js';
import { forgeCard } from '../../domain/deckState.js';

/**
 * Constructor-instantiated harness for shipped default_deck.json invariants.
 * Override expected values via options — specs should not scatter magic literals.
 */
export class DefaultDeckHarness {
  constructor(options = {}) {
    this.shippedDeck = options.shippedDeck ?? INITIAL_DECK;

    this.expectedCardCount = options.expectedCardCount ?? 17;

    this.anchorCards = {
      first: {
        id: options.firstCardId ?? '000',
        name: options.firstCardName ?? 'The Fool',
      },
      glitch: {
        id: options.glitchCardId ?? '404',
        name: options.glitchCardName ?? 'The Glitch',
      },
    };

    this.forbiddenPayloadPatterns =
      options.forbiddenPayloadPatterns ?? [
        /last\.?fm/i,
        /scrobble/i,
        /recenttracks/i,
        /api_key/i,
      ];

    this.legacyStorageKey = options.legacyStorageKey ?? 'aether-deck';
    this.multiDeckStorageKey = options.multiDeckStorageKey ?? 'aether-decks';

    this.nextForgeIdAfterShipped =
      options.nextForgeIdAfterShipped ?? '405';
  }

  cardIds() {
    return this.shippedDeck.map((card) => card.id);
  }

  findCardById(id) {
    return this.shippedDeck.find((card) => card.id === id);
  }

  assertSchemaValid() {
    return validateDeck(this.shippedDeck);
  }

  assertUniqueIds() {
    const ids = this.cardIds();
    return new Set(ids).size === ids.length;
  }

  assertForbiddenPatternsAbsent() {
    const serialized = JSON.stringify(this.shippedDeck);
    return this.forbiddenPayloadPatterns.every(
      (pattern) => !pattern.test(serialized),
    );
  }

  assertAnchorCardsPresent() {
    const first = this.findCardById(this.anchorCards.first.id);
    const glitch = this.findCardById(this.anchorCards.glitch.id);
    return (
      first?.name === this.anchorCards.first.name &&
      glitch?.name === this.anchorCards.glitch.name
    );
  }

  assertExpectedCount() {
    return this.shippedDeck.length === this.expectedCardCount;
  }

  nextForgedCard(forgeData = {}) {
    const payload = {
      name: forgeData.name ?? 'Harness Forged',
      sub: forgeData.sub ?? 'Test Origin',
      type: forgeData.type ?? 'void',
      stats: forgeData.stats ?? { atk: 1, def: 1, spd: 1 },
      desc: forgeData.desc ?? 'Forged by harness.',
      ...forgeData,
    };
    return forgeCard(this.shippedDeck, payload);
  }

  legacyDeckRaw(cards = this.shippedDeck) {
    return JSON.stringify(cards);
  }

  orphanActiveDeckState(deckId = 'default') {
    return JSON.stringify({
      activeDeckId: 'orphan-active-deck-id',
      decks: [
        {
          id: deckId,
          name: 'AETHER DECK',
          deckBack: 'standard',
          cards: this.shippedDeck,
        },
      ],
    });
  }
}
