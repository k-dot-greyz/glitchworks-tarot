import { validateDeck } from './deckValidation.js';

export function hydrateDeck(fallback, storedDeckResult) {
  if (storedDeckResult && storedDeckResult.ok) {
    return storedDeckResult.value;
  }
  return fallback;
}

export function dehydrateDeck(deck) {
  if (!validateDeck(deck)) {
    throw new Error('Cannot dehydrate invalid deck');
  }
  return JSON.stringify(deck);
}

export function forgeCard(deck, forgeData) {
  const maxId = deck.reduce((max, c) => {
    const n = parseInt(c.id, 10);
    return !isNaN(n) && n > max ? n : max;
  }, 0);
  const newId = String(maxId + 1).padStart(3, '0');
  return { ...forgeData, id: newId };
}

export function drawSpread(deck, countOrRng = 3, rng = Math.random) {
  if (!Array.isArray(deck) || deck.length === 0) return [];

  let count = 3;
  let activeRng = rng;

  if (typeof countOrRng === 'function') {
    activeRng = countOrRng;
  } else if (typeof countOrRng === 'number') {
    count = countOrRng;
  }

  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(activeRng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, count);
}
