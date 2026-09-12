import { validateDeck } from '../domain/deckValidation.js';

/**
 * Harness for asserting shipped default deck invariants at the hostile edge.
 * All policy knobs are constructor-injected — no scattered magic literals in tests.
 */
export class DefaultDeckHarness {
  constructor({
    deck,
    forbiddenFieldPatterns = [],
    anchorCardNames = [],
    minCardCount = 1,
    maxCardCount = Number.MAX_SAFE_INTEGER,
  } = {}) {
    if (!deck) {
      throw new Error('DefaultDeckHarness requires a deck array');
    }
    this.deck = deck;
    this.forbiddenFieldPatterns = forbiddenFieldPatterns;
    this.anchorCardNames = anchorCardNames;
    this.minCardCount = minCardCount;
    this.maxCardCount = maxCardCount;
  }

  assertSchemaValid() {
    if (!validateDeck(this.deck)) {
      throw new Error('Default deck failed validateDeck');
    }
    return this;
  }

  assertCardCountInRange() {
    const count = this.deck.length;
    if (count < this.minCardCount || count > this.maxCardCount) {
      throw new Error(
        `Default deck card count ${count} outside [${this.minCardCount}, ${this.maxCardCount}]`,
      );
    }
    return this;
  }

  assertUniqueIds() {
    const ids = this.deck.map((card) => card.id);
    if (new Set(ids).size !== ids.length) {
      throw new Error('Default deck contains duplicate card ids');
    }
    return this;
  }

  assertNoForbiddenFields() {
    for (const card of this.deck) {
      for (const key of Object.keys(card)) {
        for (const pattern of this.forbiddenFieldPatterns) {
          if (pattern.test(key)) {
            throw new Error(`Forbidden field key "${key}" on card ${card.id}`);
          }
        }
      }
      if (card.stats && typeof card.stats === 'object') {
        for (const key of Object.keys(card.stats)) {
          for (const pattern of this.forbiddenFieldPatterns) {
            if (pattern.test(key)) {
              throw new Error(
                `Forbidden stats key "${key}" on card ${card.id}`,
              );
            }
          }
        }
      }
    }
    return this;
  }

  assertAnchorCardsPresent() {
    const names = new Set(this.deck.map((card) => card.name));
    for (const anchor of this.anchorCardNames) {
      if (!names.has(anchor)) {
        throw new Error(`Anchor card "${anchor}" missing from default deck`);
      }
    }
    return this;
  }

  assertAllInvariants() {
    return this.assertSchemaValid()
      .assertCardCountInRange()
      .assertUniqueIds()
      .assertNoForbiddenFields()
      .assertAnchorCardsPresent();
  }
}
