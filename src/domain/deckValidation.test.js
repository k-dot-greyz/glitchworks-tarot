import { describe, it, expect, vi, beforeEach } from 'vitest';
import { validateCard, validateDeck, parseStoredDeck } from './deckValidation.js';
import { AetherTestFixtures } from '../test/fixtures/AetherTestFixtures.js';

describe('deckValidation', () => {
  let fixtures;
  let validCard;

  beforeEach(() => {
    fixtures = new AetherTestFixtures();
    validCard = fixtures.validCard();
  });

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

  describe('hostile edge payloads', () => {
    it('rejects empty or whitespace-only ids even when other fields look malicious', () => {
      expect(validateCard(fixtures.validCard({ id: '' }))).toBe(false);
      expect(validateCard(fixtures.validCard({ id: '   ' }))).toBe(false);
      expect(validateCard(fixtures.validCard({ name: '   ' }))).toBe(false);
    });

    it('documents that non-empty script-like strings still pass schema (UI must escape)', () => {
      const injected = fixtures.validCard({
        id: '001',
        name: '<img src=x onerror=alert(1)>',
        desc: '{{constructor.constructor("return this")()}}',
      });
      expect(validateCard(injected)).toBe(true);
    });

    it('rejects non-numeric and non-finite stat values', () => {
      expect(
        validateCard(
          fixtures.validCard({ stats: { atk: '50', def: 50, spd: 50 } }),
        ),
      ).toBe(false);
      expect(
        validateCard(
          fixtures.validCard({ stats: { atk: Number.NaN, def: 50, spd: 50 } }),
        ),
      ).toBe(false);
    });

    it('rejects deck payloads that are objects instead of arrays', () => {
      const telemetry = { log: vi.fn() };
      const result = parseStoredDeck(
        JSON.stringify({ __proto__: { polluted: true }, cards: [validCard] }),
        telemetry,
      );
      expect(result.ok).toBe(false);
      expect(result.code).toBe('INVALID_SCHEMA');
    });

    it('accepts large but schema-valid decks without throwing', () => {
      const largeDeck = fixtures.validDeck(120);
      const result = parseStoredDeck(JSON.stringify(largeDeck));
      expect(result.ok).toBe(true);
      expect(result.value).toHaveLength(120);
    });

    it('returns EMPTY code for nullish raw input without telemetry noise', () => {
      const telemetry = { log: vi.fn() };
      expect(parseStoredDeck(null, telemetry)).toEqual({
        ok: false,
        code: 'EMPTY',
        message: 'No data to parse',
      });
      expect(telemetry.log).not.toHaveBeenCalled();
    });
  });
});
