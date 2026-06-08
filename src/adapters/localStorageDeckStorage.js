import { createDeckStorage } from './deckStorage.js';

export function createLocalStorageDeckStorage() {
  return createDeckStorage({
    getItem: (key) => localStorage.getItem(key),
    setItem: (key, value) => localStorage.setItem(key, value),
    removeItem: (key) => localStorage.removeItem(key),
  });
}
