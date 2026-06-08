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

  it('drawSpread produces uniform distribution via Fisher-Yates (not biased sort)', () => {
    // With a 4-card deck and rng=()=>0.42, Fisher-Yates produces a deterministic result.
    // Biased sort would produce a different (implementation-dependent) order.
    const fourCardDeck = [
      { id: '001', name: 'Alpha', sub: '', type: 'void', stats: { atk: 1, def: 1, spd: 1 }, desc: '' },
      { id: '002', name: 'Beta', sub: '', type: 'void', stats: { atk: 1, def: 1, spd: 1 }, desc: '' },
      { id: '003', name: 'Gamma', sub: '', type: 'void', stats: { atk: 1, def: 1, spd: 1 }, desc: '' },
      { id: '004', name: 'Delta', sub: '', type: 'void', stats: { atk: 1, def: 1, spd: 1 }, desc: '' },
    ];
    // Fisher-Yates with rng=()=>0.42 and deck [A,B,C,D]:
    //   i=3: j=floor(0.42*4)=1, swap idx3<->idx1 → [A, D, C, B]
    //   i=2: j=floor(0.42*3)=1, swap idx2<->idx1 → [A, C, D, B]
    //   i=1: j=floor(0.42*2)=0, swap idx1<->idx0 → [C, A, D, B]
    //   slice(0,3) = [Gamma, Alpha, Delta]
    const spread = drawSpread(fourCardDeck, () => 0.42);
    expect(spread[0].name).toBe('Gamma');
    expect(spread[1].name).toBe('Alpha');
    expect(spread[2].name).toBe('Delta');
  });

  it('drawSpread returns empty array for empty deck', () => {
    expect(drawSpread([])).toEqual([]);
    expect(drawSpread(null)).toEqual([]);
  });
});
