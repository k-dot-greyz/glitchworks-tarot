/**
 * Constructor-instantiated fixtures for domain and hook tests.
 * Override defaults via constructor options — no scattered magic literals in specs.
 */
export class AetherTestFixtures {
  constructor(options = {}) {
    this.cardTemplate = {
      id: options.cardId ?? '001',
      name: options.cardName ?? 'The Fool',
      sub: options.cardSub ?? 'The Wanderer',
      type: options.cardType ?? 'void',
      stats: {
        atk: options.atk ?? 50,
        def: options.def ?? 30,
        spd: options.spd ?? 20,
      },
      desc: options.desc ?? 'An anomaly in the system.',
    };

    this.combatants = {
      alpha: {
        name: options.p1Name ?? 'Alpha',
        type: options.p1Type ?? 'fire',
        stats: {
          atk: options.p1Atk ?? 50,
          def: options.p1Def ?? 30,
          spd: options.p1Spd ?? 20,
        },
      },
      omega: {
        name: options.p2Name ?? 'Omega',
        type: options.p2Type ?? 'wind',
        stats: {
          atk: options.p2Atk ?? 40,
          def: options.p2Def ?? 40,
          spd: options.p2Spd ?? 30,
        },
      },
    };

    this.storageKeys = {
      multiDeck: options.multiDeckKey ?? 'aether-decks',
      legacyDeck: options.legacyDeckKey ?? 'aether-deck',
    };

    this.rulesetIds = {
      standard: options.standardRulesetId ?? 'standard',
      mtg: options.mtgRulesetId ?? 'mtg',
      yugioh: options.yugiohRulesetId ?? 'yugioh',
      pokemon: options.pokemonRulesetId ?? 'pokemon',
      unknown: options.unknownRulesetId ?? 'agentic-injection-ruleset',
    };

    this.arenaModes = {
      standard: options.standardModeId ?? 'standard',
      speedBlitz: options.speedBlitzModeId ?? 'speedBlitz',
      suddenDeath: options.suddenDeathModeId ?? 'suddenDeath',
      combatDisabled: options.combatDisabledModeId ?? 'combatDisabled',
      unknown: options.unknownModeId ?? 'agentic-injection-mode',
    };

    this.formulaIds = {
      standard: options.standardFormulaId ?? 'standard_atk_spd',
      mtg: options.mtgFormulaId ?? 'mtg_power_toughness',
      yugioh: options.yugiohFormulaId ?? 'yugioh_atk_x2',
      pokemon: options.pokemonFormulaId ?? 'pokemon_atk_spd',
      unknown: options.unknownFormulaId ?? 'agentic-injection-formula',
    };

    this.deckIds = {
      default: options.defaultDeckId ?? 'default',
      orphan: options.orphanDeckId ?? 'agentic-orphan-deck-id',
      recovered: options.recoveredDeckId ?? 'recovered-deck',
    };
  }

  validCard(overrides = {}) {
    const { stats: statsOverride, ...rest } = overrides;
    return {
      ...this.cardTemplate,
      ...rest,
      stats: { ...this.cardTemplate.stats, ...(statsOverride ?? {}) },
    };
  }

  validDeck(count = 1) {
    return Array.from({ length: count }, (_, index) =>
      this.validCard({
        id: String(index).padStart(3, '0'),
        name: `Card ${index}`,
      }),
    );
  }

  multiDeckState(overrides = {}) {
    const deckId = overrides.deckId ?? this.deckIds.default;
    return {
      activeDeckId: overrides.activeDeckId ?? deckId,
      decks: overrides.decks ?? [
        {
          id: deckId,
          name: overrides.deckName ?? 'AETHER DECK',
          deckBack: overrides.deckBack ?? 'standard',
          cards: overrides.cards ?? this.validDeck(2),
        },
      ],
    };
  }

  orphanActiveDeckState(overrides = {}) {
    const deckId = overrides.deckId ?? this.deckIds.default;
    return this.multiDeckState({
      activeDeckId: overrides.activeDeckId ?? this.deckIds.orphan,
      deckId,
      cards: overrides.cards ?? this.validDeck(2),
      deckName: overrides.deckName,
    });
  }

  malformedDeckEntryState(overrides = {}) {
    const validDeck = {
      id: this.deckIds.default,
      name: overrides.validDeckName ?? 'AETHER DECK',
      deckBack: 'standard',
      cards: overrides.cards ?? this.validDeck(2),
    };

    return {
      activeDeckId: overrides.activeDeckId ?? this.deckIds.default,
      decks: overrides.decks ?? [
        validDeck,
        overrides.malformedEntry ?? null,
      ],
    };
  }

  maliciousStoredDeckPayloads() {
    const valid = this.validCard();
    return {
      prototypePollution: JSON.stringify({
        decks: [{ id: 'default', name: 'X', deckBack: 'standard', cards: [valid] }],
        activeDeckId: 'default',
        __proto__: { polluted: true },
      }),
      nonArrayDecks: JSON.stringify({
        decks: 'not-an-array',
        activeDeckId: 'default',
      }),
      emptyActiveDeckId: JSON.stringify({
        decks: [{ id: 'default', name: 'X', deckBack: 'standard', cards: [valid] }],
        activeDeckId: '',
      }),
      invalidCardInjection: JSON.stringify({
        decks: [
          {
            id: 'default',
            name: 'X',
            deckBack: 'standard',
            cards: [{ id: '<script>alert(1)</script>', name: 'Injected' }],
          },
        ],
        activeDeckId: 'default',
      }),
      oversizedDeck: JSON.stringify({
        decks: [
          {
            id: 'default',
            name: 'X',
            deckBack: 'standard',
            cards: Array.from({ length: 500 }, (_, i) =>
              this.validCard({ id: String(i).padStart(3, '0'), name: `Bulk ${i}` }),
            ),
          },
        ],
        activeDeckId: 'default',
      }),
    };
  }
}
