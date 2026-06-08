export function validateCard(card) {
  if (!card || typeof card !== 'object') return false;
  if (typeof card.id !== 'string' || !card.id.trim()) return false;
  if (typeof card.name !== 'string' || !card.name.trim()) return false;
  if (typeof card.sub !== 'string') return false;
  if (typeof card.type !== 'string' || !card.type.trim()) return false;
  if (!card.stats || typeof card.stats !== 'object') return false;
  if (typeof card.stats.atk !== 'number' || isNaN(card.stats.atk)) return false;
  if (typeof card.stats.def !== 'number' || isNaN(card.stats.def)) return false;
  if (typeof card.stats.spd !== 'number' || isNaN(card.stats.spd)) return false;
  if (typeof card.desc !== 'string') return false;
  return true;
}

export function validateDeck(deck) {
  if (!Array.isArray(deck)) return false;
  return deck.every(validateCard);
}

export function parseStoredDeck(raw, telemetry = null) {
  if (!raw) {
    return { ok: false, code: 'EMPTY', message: 'No data to parse' };
  }
  try {
    const parsed = JSON.parse(raw);
    if (validateDeck(parsed)) {
      return { ok: true, value: parsed };
    }
    if (telemetry) {
      telemetry.log('warn', 'DECK_VALIDATION_FAILED', { raw });
    }
    return { ok: false, code: 'INVALID_SCHEMA', message: 'Deck data failed schema validation' };
  } catch (err) {
    if (telemetry) {
      telemetry.log('error', 'DECK_PARSE_FAILED', { raw, error: err.message });
    }
    return { ok: false, code: 'PARSE_ERROR', message: err.message };
  }
}
