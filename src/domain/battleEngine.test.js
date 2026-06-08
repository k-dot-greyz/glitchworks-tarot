import { describe, it, expect, beforeEach } from 'vitest';
import {
  baseScoreComponent,
  elementalComponent,
  resolveBattleWithEngine
} from './battleEngine.js';
import { AetherTestFixtures } from '../test/fixtures/AetherTestFixtures.js';

describe('battleEngine', () => {
  let fixtures;
  let p1;
  let p2;

  beforeEach(() => {
    fixtures = new AetherTestFixtures();
    p1 = { ...fixtures.combatants.alpha };
    p2 = { ...fixtures.combatants.omega };
  });

  describe('baseScoreComponent', () => {
    it('calculates score as ATK + SPD', () => {
      expect(baseScoreComponent.calculate(p1)).toBe(70);
      expect(baseScoreComponent.calculate(p2)).toBe(70);
    });
  });

  describe('elementalComponent', () => {
    it('returns correct elemental multiplier', () => {
      // Fire has advantage over wind (1.5x)
      expect(elementalComponent.calculate(p1, p2)).toBe(1.5);
      // Wind has no advantage over fire (1.0x)
      expect(elementalComponent.calculate(p2, p1)).toBe(1.0);
    });
  });

  describe('resolveBattleWithEngine', () => {
    it('handles incomplete data gracefully', () => {
      const result = resolveBattleWithEngine(p1, null);
      expect(result.winner).toBeNull();
      expect(result.logLine).toBe('[ ERR: INCOMPLETE DATA ]');
    });

    it('resolves standard mode correctly', () => {
      // p1 score: (50 + 20) * 1.5 = 105
      // p2 score: (40 + 30) * 1.0 = 70
      const result = resolveBattleWithEngine(p1, p2, 'standard');
      expect(result.winner).toBe('p1');
      expect(result.p1Score).toBe(105);
      expect(result.p2Score).toBe(70);
      expect(result.p1Advantage).toBe(1.5);
      expect(result.p2Advantage).toBe(1.0);
      expect(result.logLine).toContain('ALPHA OVERWRITES OMEGA');
    });

    it('resolves speedBlitz mode correctly (doubles speed)', () => {
      // p1 score: (50 + 20 * 2) * 1.5 = 90 * 1.5 = 135
      // p2 score: (40 + 30 * 2) * 1.0 = 100 * 1.0 = 100
      const result = resolveBattleWithEngine(p1, p2, 'speedBlitz');
      expect(result.winner).toBe('p1');
      expect(result.p1Score).toBe(135);
      expect(result.p2Score).toBe(100);
    });

    it('resolves suddenDeath mode correctly (triples ATK, ignores elemental)', () => {
      // p1 score: (50 * 3) * 1.0 = 150
      // p2 score: (40 * 3) * 1.0 = 120
      const result = resolveBattleWithEngine(p1, p2, 'suddenDeath');
      expect(result.winner).toBe('p1');
      expect(result.p1Score).toBe(150);
      expect(result.p2Score).toBe(120);
      expect(result.p1Advantage).toBe(1.0);
      expect(result.p2Advantage).toBe(1.0);
    });

    it('resolves combatDisabled mode correctly (peaceful harmony)', () => {
      const result = resolveBattleWithEngine(p1, p2, 'combatDisabled');
      expect(result.winner).toBeNull();
      expect(result.p1Score).toBe(0);
      expect(result.p2Score).toBe(0);
      expect(result.logLine).toBe('> SYSTEMS IN HARMONY. NO CLASH POSSIBLE.');
    });

    describe('TCG Active Abilities', () => {
      it('processes overdrive ability correctly in speedBlitz mode', () => {
        const p1Overdrive = { ...p1, ability: 'overdrive' };
        // speedBlitz: (ATK + SPD * 2) * Elemental Advantage
        // p1 standard speedBlitz: (50 + 20 * 2) * 1.5 = 135
        // p1 overdrive speedBlitz: ((50 + 10) + 20 * 2) * 1.5 = 150
        const result = resolveBattleWithEngine(p1Overdrive, p2, 'speedBlitz');
        expect(result.p1Score).toBe(150);

        // standard mode: overdrive should not apply
        const standardResult = resolveBattleWithEngine(p1Overdrive, p2, 'standard');
        expect(standardResult.p1Score).toBe(105);
      });

      it('processes ironWall ability correctly in suddenDeath mode', () => {
        const p1IronWall = { ...p1, ability: 'ironWall' };
        // suddenDeath: (ATK * 3) with no elemental advantages
        // p1 standard suddenDeath: (50 * 3) = 150
        // p1 ironWall suddenDeath: (50 * 3) + 20 = 170
        const result = resolveBattleWithEngine(p1IronWall, p2, 'suddenDeath');
        expect(result.p1Score).toBe(170);

        // standard mode: ironWall should not apply
        const standardResult = resolveBattleWithEngine(p1IronWall, p2, 'standard');
        expect(standardResult.p1Score).toBe(105);
      });

      it('processes voidShield ability correctly by ignoring elemental advantages', () => {
        const p2VoidShield = { ...p2, ability: 'voidShield' };
        // Fire (p1) usually has 1.5x advantage over Wind (p2)
        // With voidShield on p2, p1's advantage is forced to 1.0x
        // p1 score: (50 + 20) * 1.0 = 70
        // p2 score: (40 + 30) * 1.0 = 70
        const result = resolveBattleWithEngine(p1, p2VoidShield, 'standard');
        expect(result.p1Advantage).toBe(1.0);
        expect(result.p1Score).toBe(70);
        expect(result.p2Score).toBe(70);
        expect(result.winner).toBeNull(); // Draw due to equal scores
      });
    });

    describe('ruleset integration and hostile inputs', () => {
      it('applies mtg ruleset scoring (ATK + DEF) with elemental multiplier', () => {
        // p1 base: 50 + 30 = 80, p2 base: 40 + 40 = 80
        // fire vs wind: 1.5x / 1.0x → 120 vs 80
        const result = resolveBattleWithEngine(
          p1,
          p2,
          fixtures.arenaModes.standard,
          fixtures.rulesetIds.mtg,
        );
        expect(result.winner).toBe('p1');
        expect(result.p1Score).toBe(120);
        expect(result.p2Score).toBe(80);
      });

      it('applies yugioh ruleset scoring (ATK * 2)', () => {
        // p1 base: 100, p2 base: 80 → with elemental: 150 vs 80
        const result = resolveBattleWithEngine(
          p1,
          p2,
          fixtures.arenaModes.standard,
          fixtures.rulesetIds.yugioh,
        );
        expect(result.winner).toBe('p1');
        expect(result.p1Score).toBe(150);
        expect(result.p2Score).toBe(80);
      });

      it('falls back safely when mode or ruleset id is injected/unknown', () => {
        const baseline = resolveBattleWithEngine(
          p1,
          p2,
          fixtures.arenaModes.standard,
          fixtures.rulesetIds.standard,
        );
        const injected = resolveBattleWithEngine(
          p1,
          p2,
          fixtures.arenaModes.unknown,
          fixtures.rulesetIds.unknown,
        );
        expect(injected).toEqual(baseline);
      });

      it('does not throw when combatant stats contain non-finite numbers', () => {
        const broken = {
          ...p1,
          stats: { atk: Number.NaN, def: 10, spd: 10 },
        };
        expect(() =>
          resolveBattleWithEngine(
            broken,
            p2,
            fixtures.arenaModes.standard,
            fixtures.rulesetIds.standard,
          ),
        ).not.toThrow();
      });
    });
  });
});
