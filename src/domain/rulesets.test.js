import { describe, it, expect, beforeEach } from 'vitest';
import { rulesets, scoreFormulaRegistry } from './rulesets.js';
import { AetherTestFixtures } from '../test/fixtures/AetherTestFixtures.js';

describe('rulesets', () => {
  let fixtures;

  beforeEach(() => {
    fixtures = new AetherTestFixtures();
  });

  const requiredRulesetIds = () => [
    fixtures.rulesetIds.standard,
    fixtures.rulesetIds.mtg,
    fixtures.rulesetIds.yugioh,
    fixtures.rulesetIds.pokemon,
  ];

  it('exposes all expected playmat rulesets with stable ids', () => {
    for (const id of requiredRulesetIds()) {
      expect(rulesets[id]).toBeDefined();
      expect(rulesets[id].id).toBe(id);
      expect(rulesets[id].name).toEqual(expect.any(String));
      expect(rulesets[id].zones.length).toBeGreaterThan(0);
    }
  });

  it('keeps clashSlots aligned with declared zone ids', () => {
    for (const id of requiredRulesetIds()) {
      const ruleset = rulesets[id];
      const zoneIds = new Set(ruleset.zones.map((zone) => zone.id));
      for (const slotId of ruleset.clashSlots) {
        expect(zoneIds.has(slotId)).toBe(true);
      }
    }
  });

  it('defines banlist and deck size constraints as arrays and numbers', () => {
    for (const id of requiredRulesetIds()) {
      const ruleset = rulesets[id];
      expect(Array.isArray(ruleset.bannedCardIds)).toBe(true);
      expect(Array.isArray(ruleset.restrictedCardIds)).toBe(true);
      expect(typeof ruleset.maxDeckSize).toBe('number');
      expect(ruleset.maxDeckSize).toBeGreaterThan(0);
    }
  });

  it('keeps ruleset definitions serializable (scoreFormula keys, no inline functions)', () => {
    for (const id of requiredRulesetIds()) {
      const ruleset = rulesets[id];
      expect(typeof ruleset.scoreFormula).toBe('string');
      expect(ruleset.calculateScore).toBeUndefined();
      expect(() => JSON.stringify(ruleset)).not.toThrow();
    }
  });

  it('maps every ruleset scoreFormula key to a registry function', () => {
    for (const id of requiredRulesetIds()) {
      const formulaKey = rulesets[id].scoreFormula;
      expect(typeof scoreFormulaRegistry[formulaKey]).toBe('function');
    }
  });

  describe('scoreFormulaRegistry', () => {
    it('standard formula scores ATK + SPD', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(scoreFormulaRegistry.standard_atk_spd(card)).toBe(20);
    });

    it('mtg formula scores ATK + DEF (power + toughness)', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(scoreFormulaRegistry.mtg_power_toughness(card)).toBe(17);
    });

    it('yugioh formula scores ATK * 2', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(scoreFormulaRegistry.yugioh_atk_x2(card)).toBe(24);
    });

    it('pokemon formula scores ATK + SPD', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(scoreFormulaRegistry.pokemon_atk_spd(card)).toBe(20);
    });

    it('rejects agentic formula keys without registry entries (fail-closed lookup)', () => {
      const card = fixtures.validCard({ stats: { atk: 10, def: 10, spd: 10 } });
      expect(scoreFormulaRegistry[fixtures.formulaIds.unknown]).toBeUndefined();
      expect(scoreFormulaRegistry[fixtures.formulaIds.unknown]?.(card)).toBeUndefined();
    });
  });

  it('mtg banlist includes The Magician (id 001) as boundary example', () => {
    expect(rulesets.mtg.bannedCardIds).toContain('001');
  });
});
