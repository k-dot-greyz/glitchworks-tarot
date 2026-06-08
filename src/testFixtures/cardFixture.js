/**
 * Constructor-based card fixture for deterministic, reusable test data.
 * Avoids scattering magic values across security and domain tests.
 */
export class CardFixture {
  constructor(overrides = {}) {
    this.id = overrides.id ?? '001';
    this.name = overrides.name ?? 'Test Card';
    this.sub = overrides.sub ?? 'Test Sub';
    this.type = overrides.type ?? 'fire';
    this.stats = {
      atk: overrides.atk ?? 50,
      def: overrides.def ?? 40,
      spd: overrides.spd ?? 30,
      ...(overrides.stats ?? {}),
    };
    this.desc = overrides.desc ?? 'Test description';
    this.ability = overrides.ability ?? null;
  }

  withId(id) {
    return new CardFixture({ ...this.toOverrides(), id });
  }

  withType(type) {
    return new CardFixture({ ...this.toOverrides(), type });
  }

  withStats(stats) {
    return new CardFixture({
      ...this.toOverrides(),
      stats: { ...this.stats, ...stats },
    });
  }

  withAbility(ability) {
    return new CardFixture({ ...this.toOverrides(), ability });
  }

  toOverrides() {
    return {
      id: this.id,
      name: this.name,
      sub: this.sub,
      type: this.type,
      atk: this.stats.atk,
      def: this.stats.def,
      spd: this.stats.spd,
      desc: this.desc,
      ability: this.ability,
    };
  }

  build() {
    const card = {
      id: this.id,
      name: this.name,
      sub: this.sub,
      type: this.type,
      stats: { ...this.stats },
      desc: this.desc,
    };
    if (this.ability) {
      card.ability = this.ability;
    }
    return card;
  }
}

export class DeckStateFixture {
  constructor(overrides = {}) {
    this.activeDeckId = overrides.activeDeckId ?? 'default';
    this.deckName = overrides.deckName ?? 'AETHER DECK';
    this.deckBack = overrides.deckBack ?? 'standard';
    this.cards = overrides.cards ?? [new CardFixture().build()];
  }

  withActiveDeckId(activeDeckId) {
    return new DeckStateFixture({ ...this.toOverrides(), activeDeckId });
  }

  withCards(cards) {
    return new DeckStateFixture({ ...this.toOverrides(), cards });
  }

  withInvalidCards() {
    return new DeckStateFixture({
      ...this.toOverrides(),
      cards: [{ id: '', name: 'Broken', type: 'void' }],
    });
  }

  toOverrides() {
    return {
      activeDeckId: this.activeDeckId,
      deckName: this.deckName,
      deckBack: this.deckBack,
      cards: this.cards,
    };
  }

  build() {
    return {
      activeDeckId: this.activeDeckId,
      decks: [
        {
          id: this.activeDeckId,
          name: this.deckName,
          deckBack: this.deckBack,
          cards: this.cards,
        },
      ],
    };
  }

  serialize() {
    return JSON.stringify(this.build());
  }
}
