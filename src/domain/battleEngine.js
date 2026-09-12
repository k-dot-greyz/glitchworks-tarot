import { ELEMENTAL_ADVANTAGE } from './elemental.js';
import { rulesets, scoreFormulaRegistry } from './rulesets.js';

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

export function resolveBattleWithEngine(p1, p2, modeId = 'standard', rulesetId = 'standard') {
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
  const activeRuleset = rulesets[rulesetId] || rulesets.standard;

  // 1. Resolve Base Score with Ability modifiers
  const baseModifier = mode.modifiers.find(m => m.applyBase);

  // Apply Overdrive ability (+10 ATK in Speed Blitz)
  const p1Stats = { ...p1.stats };
  const p2Stats = { ...p2.stats };
  if (p1.ability === 'overdrive' && modeId === 'speedBlitz') p1Stats.atk += 10;
  if (p2.ability === 'overdrive' && modeId === 'speedBlitz') p2Stats.atk += 10;

  const p1Modified = { ...p1, stats: p1Stats };
  const p2Modified = { ...p2, stats: p2Stats };

  // Compute base scores: use baseModifier if available, otherwise use base score component
  let p1Base;
  let p2Base;

  if (baseModifier) {
    p1Base = baseModifier.applyBase(p1Modified);
    p2Base = baseModifier.applyBase(p2Modified);
  } else {
    p1Base = baseScoreComponent.calculate(p1Modified);
    p2Base = baseScoreComponent.calculate(p2Modified);
  }

  // Apply custom ruleset calculation if defined for non-standard rulesets
  if (activeRuleset && activeRuleset.id !== 'standard' && activeRuleset.scoreFormula) {
    const scoreFunc = scoreFormulaRegistry[activeRuleset.scoreFormula];
    if (scoreFunc) {
      p1Base = scoreFunc(p1Modified, p2Modified);
      p2Base = scoreFunc(p2Modified, p1Modified);
    }
  }

  // Apply Iron Wall ability (+20 base score in Sudden Death)
  if (p1.ability === 'ironWall' && modeId === 'suddenDeath') p1Base += 20;
  if (p2.ability === 'ironWall' && modeId === 'suddenDeath') p2Base += 20;

  // 2. Resolve Elemental Multiplier with Ability modifiers
  const elementalModifier = mode.modifiers.find(m => m.applyElemental);
  let p1Adv = elementalModifier ? elementalModifier.applyElemental(p1, p2) : elementalComponent.calculate(p1, p2);
  let p2Adv = elementalModifier ? elementalModifier.applyElemental(p2, p1) : elementalComponent.calculate(p2, p1);

  // Apply Void Shield ability (ignores elemental advantages)
  if (p2.ability === 'voidShield') {
    p1Adv = 1.0;
  }
  if (p1.ability === 'voidShield') {
    p2Adv = 1.0;
  }

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
