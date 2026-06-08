import { describe, it, expect } from 'vitest';
import { createMemoryDeckStorage } from './memoryDeckStorage.js';

describe('deckStorage with memory adapter', () => {
  it('loads, saves, and clears correctly', () => {
    const storage = createMemoryDeckStorage({ 'test-key': 'test-val' });

    expect(storage.load('test-key')).toBe('test-val');
    expect(storage.load('missing')).toBeNull();

    const saveResult = storage.save('new-key', 'new-val');
    expect(saveResult.ok).toBe(true);
    expect(storage.load('new-key')).toBe('new-val');

    const clearResult = storage.clear('new-key');
    expect(clearResult.ok).toBe(true);
    expect(storage.load('new-key')).toBeNull();
  });
});
