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

/**
 * True if the card triggers lethal damage on resolve.
 * Checks id list, ability, then name pattern (case-insensitive).
 * @param {object|null} card
 * @param {object} [config]
 * @returns {boolean}
 */
export function isLethalCard(card, config = DUEL_CONFIG) {
  if (!card) return false;
  if (config.lethalCardIds.includes(card.id)) return true;
  if (card.ability === config.lethalAbility) return true;
  if (config.lethalNamePattern.test(card.name || '')) return true;
  return false;
}

/**
 * Apply combat damage for a resolved clash.
 * Lethal winner forces loser LP to 0; otherwise subtracts the score delta
 * and clamps at 0. Game ends when either LP is <= 0.
 * @param {{p1Lp:number,p2Lp:number}} lp
 * @param {{winner:'p1'|'p2'|null,p1Score?:number,p2Score?:number,p1?:object,p2?:object}} battle
 * @param {object} [config]
 * @returns {{p1Lp:number,p2Lp:number,damage:number|'LETHAL',gameOver:boolean,loser:'p1'|'p2'|null}}
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
