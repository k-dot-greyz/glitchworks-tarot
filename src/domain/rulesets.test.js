import { describe, it, expect } from 'vitest';
import { rulesets } from './rulesets.js';
import { CardFixture } from '../testFixtures/cardFixture.js';

describe('rulesets', () => {
  const baseCard = new CardFixture({
    id: '010',
    name: 'Arena Unit',
    type: 'fire',
    atk: 50,
    def: 40,
    spd: 30,
  });

  const rulesetIds = Object.keys(rulesets);

  it.each(rulesetIds)('%s has required schema fields', (id) => {
    const ruleset = rulesets[id];
    expect(ruleset.id).toBe(id);
    expect(typeof ruleset.name).toBe('string');
    expect(Array.isArray(ruleset.zones)).toBe(true);
    expect(ruleset.zones.length).toBeGreaterThan(0);
    expect(Array.isArray(ruleset.clashSlots)).toBe(true);
    expect(ruleset.clashSlots.length).toBe(2);
    expect(Array.isArray(ruleset.bannedCardIds)).toBe(true);
    expect(typeof ruleset.maxDeckSize).toBe('number');
    expect(typeof ruleset.calculateScore).toBe('function');
  });

  it.each(rulesetIds)('%s clash slots reference defined zones', (id) => {
    const ruleset = rulesets[id];
    const zoneIds = new Set(ruleset.zones.map((z) => z.id));
    for (const slotId of ruleset.clashSlots) {
      expect(zoneIds.has(slotId)).toBe(true);
    }
  });

  it('standard calculateScore uses ATK + SPD', () => {
    const card = baseCard.build();
    expect(rulesets.standard.calculateScore(card)).toBe(80);
  });

  it('mtg calculateScore uses ATK + DEF', () => {
    const card = baseCard.build();
    expect(rulesets.mtg.calculateScore(card)).toBe(90);
  });

  it('yugioh calculateScore doubles ATK', () => {
    const card = baseCard.build();
    expect(rulesets.yugioh.calculateScore(card)).toBe(100);
  });

  it('pokemon calculateScore uses ATK + SPD', () => {
    const card = baseCard.build();
    expect(rulesets.pokemon.calculateScore(card)).toBe(80);
  });

  it('mtg banlist blocks The Magician (id 001)', () => {
    expect(rulesets.mtg.bannedCardIds).toContain('001');
  });

  it('calculateScore returns finite numbers for valid stats', () => {
    const card = baseCard.build();
    for (const id of rulesetIds) {
      const score = rulesets[id].calculateScore(card);
      expect(Number.isFinite(score)).toBe(true);
    }
  });
});
