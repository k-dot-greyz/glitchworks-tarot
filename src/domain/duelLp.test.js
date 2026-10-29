import { describe, it, expect } from 'vitest';
import { isLethalCard, applyCombatDamage } from './duelLp.js';

describe('duelLp', () => {
  const glitch = { id: '404', name: 'The Glitch', ability: 'none' };
  const named = { id: 'x1', name: 'Exodia the Forbidden One', ability: 'none' };
  const ability = { id: 'x2', name: 'Normal', ability: 'exodia' };
  const plain = { id: '0', name: 'The Fool', ability: 'none' };

  describe('isLethalCard', () => {
    it('matches id in lethalCardIds', () => {
      expect(isLethalCard(glitch)).toBe(true);
    });
    it('matches lethal ability', () => {
      expect(isLethalCard(ability)).toBe(true);
    });
    it('matches name pattern', () => {
      expect(isLethalCard(named)).toBe(true);
    });
    it('rejects a normal card', () => {
      expect(isLethalCard(plain)).toBe(false);
    });
    it('rejects null', () => {
      expect(isLethalCard(null)).toBe(false);
    });
  });

  describe('applyCombatDamage', () => {
    it('no-ops when there is no winner', () => {
      const result = applyCombatDamage(
        { p1Lp: 8000, p2Lp: 8000 },
        { winner: null, p1Score: 10, p2Score: 10, p1: plain, p2: plain },
      );
      expect(result).toEqual({
        p1Lp: 8000,
        p2Lp: 8000,
        damage: 0,
        gameOver: false,
        loser: null,
      });
    });

    it('applies score-diff damage and clamps at 0', () => {
      const result = applyCombatDamage(
        { p1Lp: 100, p2Lp: 50 },
        { winner: 'p1', p1Score: 80, p2Score: 10, p1: plain, p2: plain },
      );
      expect(result.p2Lp).toBe(0);
      expect(result.damage).toBe(70);
      expect(result.gameOver).toBe(true);
      expect(result.loser).toBe('p2');
    });

    it('lethal sets loser LP to 0 regardless of score', () => {
      const result = applyCombatDamage(
        { p1Lp: 8000, p2Lp: 8000 },
        { winner: 'p1', p1Score: 1, p2Score: 0, p1: glitch, p2: plain },
      );
      expect(result.p2Lp).toBe(0);
      expect(result.damage).toBe('LETHAL');
      expect(result.gameOver).toBe(true);
    });

    it('P1 can lose and be clamped', () => {
      const result = applyCombatDamage(
        { p1Lp: 30, p2Lp: 8000 },
        { winner: 'p2', p1Score: 5, p2Score: 100, p1: plain, p2: plain },
      );
      expect(result.p1Lp).toBe(0);
      expect(result.loser).toBe('p1');
      expect(result.gameOver).toBe(true);
    });

    it('non-lethal damage does not end the duel above 0', () => {
      const result = applyCombatDamage(
        { p1Lp: 8000, p2Lp: 8000 },
        { winner: 'p1', p1Score: 20, p2Score: 10, p1: plain, p2: plain },
      );
      expect(result.p2Lp).toBe(7990);
      expect(result.gameOver).toBe(false);
    });
  });
});
