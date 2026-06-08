import { describe, it, expect, vi } from 'vitest';
import { validateCard, validateDeck, parseStoredDeck } from './deckValidation.js';

describe('deckValidation', () => {
  const validCard = {
    id: '001',
    name: 'The Fool',
    sub: 'The Wanderer',
    type: 'void',
    stats: { atk: 50, def: 50, spd: 50 },
    desc: 'An anomaly in the system.',
  };

  it('validateCard returns true for valid card', () => {
    expect(validateCard(validCard)).toBe(true);
  });

  it('validateCard returns false for invalid card structures', () => {
    expect(validateCard(null)).toBe(false);
    expect(validateCard({})).toBe(false);
    expect(validateCard({ ...validCard, id: '' })).toBe(false);
    expect(validateCard({ ...validCard, name: '  ' })).toBe(false);
    expect(validateCard({ ...validCard, stats: { atk: 'fifty', def: 50, spd: 50 } })).toBe(false);
  });

  it('validateDeck returns true for valid array of cards', () => {
    expect(validateDeck([validCard])).toBe(true);
  });

  it('validateDeck returns false if any card is invalid', () => {
    expect(validateDeck([validCard, { ...validCard, id: '' }])).toBe(false);
    expect(validateDeck('not a deck')).toBe(false);
  });

  it('parseStoredDeck handles valid JSON', () => {
    const raw = JSON.stringify([validCard]);
    const result = parseStoredDeck(raw);
    expect(result.ok).toBe(true);
    expect(result.value).toEqual([validCard]);
  });

  it('parseStoredDeck handles corrupted JSON and logs telemetry', () => {
    const telemetry = { log: vi.fn() };
    const result = parseStoredDeck('{"broken json', telemetry);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('PARSE_ERROR');
    expect(telemetry.log).toHaveBeenCalledWith('error', 'DECK_PARSE_FAILED', expect.any(Object));
  });

  it('parseStoredDeck handles invalid schema and logs telemetry', () => {
    const telemetry = { log: vi.fn() };
    const result = parseStoredDeck(JSON.stringify([{ broken: 'schema' }]), telemetry);
    expect(result.ok).toBe(false);
    expect(result.code).toBe('INVALID_SCHEMA');
    expect(telemetry.log).toHaveBeenCalledWith('warn', 'DECK_VALIDATION_FAILED', expect.any(Object));
  });
});
