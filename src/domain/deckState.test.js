import { describe, it, expect } from 'vitest';
import { hydrateDeck, dehydrateDeck, forgeCard, drawSpread } from './deckState.js';

describe('deckState', () => {
  const mockDeck = [
    { id: '001', name: 'Card 1', sub: '', type: 'void', stats: { atk: 10, def: 10, spd: 10 }, desc: '' },
    { id: '010', name: 'Card 2', sub: '', type: 'void', stats: { atk: 10, def: 10, spd: 10 }, desc: '' },
  ];

  it('hydrateDeck returns stored deck if valid', () => {
    const result = hydrateDeck(mockDeck, { ok: true, value: [{ id: '003', name: 'Stored', sub: '', type: 'void', stats: { atk: 10, def: 10, spd: 10 }, desc: '' }] });
    expect(result[0].name).toBe('Stored');
  });

  it('hydrateDeck returns fallback if stored deck result is invalid', () => {
    const result = hydrateDeck(mockDeck, { ok: false });
    expect(result).toEqual(mockDeck);
  });

  it('dehydrateDeck serializes valid deck', () => {
    const result = dehydrateDeck(mockDeck);
    expect(JSON.parse(result)).toEqual(mockDeck);
  });

  it('dehydrateDeck throws on invalid deck', () => {
    expect(() => dehydrateDeck([{ broken: 'card' }])).toThrow();
  });

  it('forgeCard generates unique ID based on max ID + 1', () => {
    const newCard = forgeCard(mockDeck, { name: 'Forged', stats: { atk: 50, def: 50, spd: 50 } });
    expect(newCard.id).toBe('011');
  });

  it('drawSpread draws 3 cards from deck', () => {
    const deckWithMany = [
      ...mockDeck,
      { id: '011', name: 'Card 3', sub: '', type: 'void', stats: { atk: 10, def: 10, spd: 10 }, desc: '' },
      { id: '012', name: 'Card 4', sub: '', type: 'void', stats: { atk: 10, def: 10, spd: 10 }, desc: '' },
    ];
    const spread = drawSpread(deckWithMany, () => 0.5);
    expect(spread.length).toBe(3);
  });
});
