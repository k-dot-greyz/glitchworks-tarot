import { describe, it, expect, beforeEach } from 'vitest';
import { rulesets } from './rulesets.js';
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

  describe('calculateScore', () => {
    it('standard ruleset scores ATK + SPD', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(rulesets.standard.calculateScore(card)).toBe(20);
    });

    it('mtg ruleset scores ATK + DEF (power + toughness)', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(rulesets.mtg.calculateScore(card)).toBe(17);
    });

    it('yugioh ruleset scores ATK * 2', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(rulesets.yugioh.calculateScore(card)).toBe(24);
    });

    it('pokemon ruleset scores ATK + SPD', () => {
      const card = fixtures.validCard({ stats: { atk: 12, def: 5, spd: 8 } });
      expect(rulesets.pokemon.calculateScore(card)).toBe(20);
    });
  });

  it('mtg banlist includes The Magician (id 001) as boundary example', () => {
    expect(rulesets.mtg.bannedCardIds).toContain('001');
  });
});
