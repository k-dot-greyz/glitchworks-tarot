/**
 * Duel LP layer — thin, ruleset-aware damage + win condition.
 * Starting LP and lethal triggers are data, not magic numbers in the UI.
 */

export const DUEL_CONFIG = {
  startingLp: 8000,
  // Card ids that act as the demo Exodia proxy (lethal on resolve).
  // '404' = The Glitch in the default deck.
  lethalCardIds: ['404'],
  lethalNamePattern: /exodia/i,
  lethalAbility: 'exodia',
};

export function isLethalCard(card, config = DUEL_CONFIG) {
  if (!card) return false;
  if (config.lethalCardIds.includes(card.id)) return true;
  if (card.ability === config.lethalAbility) return true;
  if (config.lethalNamePattern.test(card.name || '')) return true;
  return false;
}

/**
 * Apply combat damage for a resolved clash.
 * Returns updated LP pair, damage dealt, and whether the duel ended.
 */
export function applyCombatDamage(
  { p1Lp, p2Lp },
  { winner, p1Score, p2Score, p1, p2 },
  config = DUEL_CONFIG,
) {
  if (!winner) {
    return { p1Lp, p2Lp, damage: 0, gameOver: false, loser: null };
  }

  const winnerCard = winner === 'p1' ? p1 : p2;
  const loser = winner === 'p1' ? 'p2' : 'p1';
  const rawDamage = Math.abs((p1Score || 0) - (p2Score || 0));
  const damage = isLethalCard(winnerCard, config) ? Infinity : rawDamage;

  let nextP1 = p1Lp;
  let nextP2 = p2Lp;

  if (loser === 'p2') {
    nextP2 = damage === Infinity ? 0 : Math.max(0, p2Lp - damage);
  } else {
    nextP1 = damage === Infinity ? 0 : Math.max(0, p1Lp - damage);
  }

  const gameOver = nextP1 <= 0 || nextP2 <= 0;

  return {
    p1Lp: nextP1,
    p2Lp: nextP2,
    damage: damage === Infinity ? 'LETHAL' : damage,
    gameOver,
    loser,
  };
}
