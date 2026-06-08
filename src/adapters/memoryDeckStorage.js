import { createDeckStorage } from './deckStorage.js';

export function createMemoryDeckStorage(initialStore = {}) {
  const store = new Map(Object.entries(initialStore));
  return createDeckStorage({
    getItem: (key) => (store.has(key) ? store.get(key) : null),
    setItem: (key, value) => {
      store.set(key, String(value));
    },
    removeItem: (key) => {
      store.delete(key);
    },
  });
}
