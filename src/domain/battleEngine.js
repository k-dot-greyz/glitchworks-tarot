import { ELEMENTAL_ADVANTAGE } from './elemental.js';

export const baseScoreComponent = {
  id: 'baseScore',
  calculate: (card) => card.stats.atk + card.stats.spd
};

export const elementalComponent = {
  id: 'elemental',
  calculate: (card, opponent, advantages = ELEMENTAL_ADVANTAGE) => {
    return advantages[card.type]?.[opponent.type] || 1.0;
  }
};

export const arenaModes = {
  standard: {
    id: 'standard',
    name: 'Standard Clash',
    description: 'Standard rules: (ATK + SPD) * Elemental Advantage',
    modifiers: []
  },
  speedBlitz: {
    id: 'speedBlitz',
    name: 'Speed Blitz',
    description: 'Speed is doubled: (ATK + SPD * 2) * Elemental Advantage',
    modifiers: [
      {
        id: 'speedMultiplier',
        applyBase: (card) => card.stats.atk + (card.stats.spd * 2)
      }
    ]
  },
  suddenDeath: {
    id: 'suddenDeath',
    name: 'Sudden Death',
    description: 'Pure power clash: (ATK * 3) with no elemental advantages',
    modifiers: [
      {
        id: 'atkOnlyMultiplier',
        applyBase: (card) => card.stats.atk * 3
      },
      {
        id: 'ignoreElemental',
        applyElemental: () => 1.0
      }
    ]
  },
  combatDisabled: {
    id: 'combatDisabled',
    name: 'Combat Disabled (Pure Tarot)',
    description: 'Combat mechanics are disabled. Ideal for peaceful tarot pulls.',
    modifiers: [
      {
        id: 'zeroCombat',
        applyBase: () => 0,
        applyElemental: () => 1.0
      }
    ]
  }
};

export function resolveBattleWithEngine(p1, p2, modeId = 'standard') {
  if (!p1 || !p2) {
    return {
      winner: null,
      logLine: '[ ERR: INCOMPLETE DATA ]',
      p1Advantage: 1.0,
      p2Advantage: 1.0,
      p1Score: 0,
      p2Score: 0,
    };
  }

  const mode = arenaModes[modeId] || arenaModes.standard;

  // 1. Resolve Base Score
  const baseModifier = mode.modifiers.find(m => m.applyBase);
  const p1Base = baseModifier ? baseModifier.applyBase(p1) : baseScoreComponent.calculate(p1);
  const p2Base = baseModifier ? baseModifier.applyBase(p2) : baseScoreComponent.calculate(p2);

  // 2. Resolve Elemental Multiplier
  const elementalModifier = mode.modifiers.find(m => m.applyElemental);
  const p1Adv = elementalModifier ? elementalModifier.applyElemental(p1, p2) : elementalComponent.calculate(p1, p2);
  const p2Adv = elementalModifier ? elementalModifier.applyElemental(p2, p1) : elementalComponent.calculate(p2, p1);

  // 3. Aggregate Scores
  const p1Score = p1Base * p1Adv;
  const p2Score = p2Base * p2Adv;

  if (modeId === 'combatDisabled') {
    return {
      winner: null,
      logLine: '> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.',
      p1Advantage: 1.0,
      p2Advantage: 1.0,
      p1Score: 0,
      p2Score: 0
    };
  }

  // 4. Determine Winner
  if (p1Score > p2Score) {
    return {
      winner: 'p1',
      logLine: `> ${p1.name.toUpperCase()} OVERWRITES ${p2.name.toUpperCase()}${p1Adv > 1.0 ? " (TYPE_ADVANTAGE)" : ""}`,
      p1Advantage: p1Adv,
      p2Advantage: p2Adv,
      p1Score,
      p2Score
    };
  } else if (p2Score > p1Score) {
    return {
      winner: 'p2',
      logLine: `> ${p2.name.toUpperCase()} OVERWRITES ${p1.name.toUpperCase()}${p2Adv > 1.0 ? " (TYPE_ADVANTAGE)" : ""}`,
      p1Advantage: p1Adv,
      p2Advantage: p2Adv,
      p1Score,
      p2Score
    };
  } else {
    return {
      winner: null,
      logLine: "> EQUILIBRIUM ACHIEVED. NO DELETION.",
      p1Advantage: p1Adv,
      p2Advantage: p2Adv,
      p1Score,
      p2Score
    };
  }
}
