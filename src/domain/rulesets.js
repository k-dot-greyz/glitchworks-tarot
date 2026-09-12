// GlitchWorks Agnostic Architecture Protocol (GW-AAP) Rulesets Module
// This module defines the schemas, layouts, restrictions, and formulas for TCG playmats.
// It is fully serializable and design-agnostic.

// Serializable ruleset definitions (no runtime functions)
export const rulesets = {
  standard: {
    id: 'standard',
    name: 'Standard Clash',
    description: 'Standard rules: (ATK + SPD) * Elemental Advantage. 2 Slots (Alpha & Omega).',
    zones: [
      { id: 'p1', label: 'ALPHA SLOT', size: 'md', scope: 'player', player: 1 },
      { id: 'p2', label: 'OMEGA SLOT', size: 'md', scope: 'player', player: 2 }
    ],
    clashSlots: ['p1', 'p2'],
    bannedCardIds: [],
    restrictedCardIds: [],
    maxDeckSize: 60,
    scoreFormula: 'standard_atk_spd'
  },
  mtg: {
    id: 'mtg',
    name: 'MTG Battlefield',
    description: 'Magic: The Gathering layout. Supports Commander mode with multiple players and banlists.',
    zones: [
      { id: 'battlefield_p1', label: 'P1 Battlefield', size: 'sm', scope: 'player', player: 1 },
      { id: 'battlefield_p2', label: 'P2 Battlefield', size: 'sm', scope: 'player', player: 2 },
      { id: 'hand_p1', label: 'P1 Hand', size: 'sm', scope: 'player', player: 1 },
      { id: 'hand_p2', label: 'P2 Hand', size: 'sm', scope: 'player', player: 2 },
      { id: 'graveyard_p1', label: 'P1 Graveyard', size: 'sm', scope: 'player', player: 1 },
      { id: 'graveyard_p2', label: 'P2 Graveyard', size: 'sm', scope: 'player', player: 2 },
      { id: 'library_p1', label: 'P1 Library', size: 'sm', scope: 'player', player: 1, isFaceDown: true },
      { id: 'library_p2', label: 'P2 Library', size: 'sm', scope: 'player', player: 2, isFaceDown: true },
      { id: 'commander_p1', label: 'P1 Commander', size: 'sm', scope: 'player', player: 1 },
      { id: 'commander_p2', label: 'P2 Commander', size: 'sm', scope: 'player', player: 2 }
    ],
    clashSlots: ['battlefield_p1', 'battlefield_p2'],
    bannedCardIds: ['001'], // Example banned card
    restrictedCardIds: [],
    maxDeckSize: 100,
    scoreFormula: 'mtg_power_toughness'
  },
  yugioh: {
    id: 'yugioh',
    name: 'Yu-Gi-Oh! Duel Field',
    description: 'Classic Yu-Gi-Oh! layout. Flip trap cards, summon monsters, and banish to the Shadow Realm.',
    zones: [
      { id: 'monster_p1', label: 'P1 Monster Zone', size: 'sm', scope: 'player', player: 1 },
      { id: 'monster_p2', label: 'P2 Monster Zone', size: 'sm', scope: 'player', player: 2 },
      { id: 'spellTrap_p1', label: 'P1 Spell & Trap', size: 'sm', scope: 'player', player: 1 },
      { id: 'spellTrap_p2', label: 'P2 Spell & Trap', size: 'sm', scope: 'player', player: 2 },
      { id: 'fieldSpell_p1', label: 'P1 Field Spell', size: 'sm', scope: 'player', player: 1 },
      { id: 'fieldSpell_p2', label: 'P2 Field Spell', size: 'sm', scope: 'player', player: 2 },
      { id: 'graveyard_p1', label: 'P1 Graveyard', size: 'sm', scope: 'player', player: 1 },
      { id: 'graveyard_p2', label: 'P2 Graveyard', size: 'sm', scope: 'player', player: 2 },
      { id: 'shadowRealm', label: 'Shadow Realm', size: 'sm', scope: 'global' }
    ],
    clashSlots: ['monster_p1', 'monster_p2'],
    bannedCardIds: [],
    restrictedCardIds: [],
    maxDeckSize: 60,
    scoreFormula: 'yugioh_atk_x2'
  },
  pokemon: {
    id: 'pokemon',
    name: 'Pokémon TCG Arena',
    description: 'Pokémon TCG layout. Active Pokémon, Bench, Prize Cards, and Discard Pile.',
    zones: [
      { id: 'active_p1', label: 'P1 Active Pokémon', size: 'sm', scope: 'player', player: 1 },
      { id: 'active_p2', label: 'P2 Active Pokémon', size: 'sm', scope: 'player', player: 2 },
      { id: 'bench_p1', label: 'P1 Bench', size: 'sm', scope: 'player', player: 1 },
      { id: 'bench_p2', label: 'P2 Bench', size: 'sm', scope: 'player', player: 2 },
      { id: 'prize_p1', label: 'P1 Prizes', size: 'sm', scope: 'player', player: 1, isFaceDown: true },
      { id: 'prize_p2', label: 'P2 Prizes', size: 'sm', scope: 'player', player: 2, isFaceDown: true },
      { id: 'discard_p1', label: 'P1 Discard Pile', size: 'sm', scope: 'player', player: 1 },
      { id: 'discard_p2', label: 'P2 Discard Pile', size: 'sm', scope: 'player', player: 2 }
    ],
    clashSlots: ['active_p1', 'active_p2'],
    bannedCardIds: [],
    restrictedCardIds: [],
    maxDeckSize: 60,
    scoreFormula: 'pokemon_atk_spd'
  }
};

// Score formula registry: maps formula keys to actual functions
export const scoreFormulaRegistry = {
  'standard_atk_spd': (card) => {
    return card.stats.atk + card.stats.spd;
  },
  'mtg_power_toughness': (card) => {
    // MTG: Power (ATK) + Toughness (DEF)
    return card.stats.atk + card.stats.def;
  },
  'yugioh_atk_x2': (card) => {
    // Yu-Gi-Oh: ATK * 2
    return card.stats.atk * 2;
  },
  'pokemon_atk_spd': (card) => {
    // Pokemon: ATK + SPD
    return card.stats.atk + card.stats.spd;
  }
};
