import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Card } from './Card.jsx';
import { CardModal } from './CardModal.jsx';
import { DexView } from './DexView.jsx';
import { ForgeView } from './ForgeView.jsx';
import { OracleView } from './OracleView.jsx';
import { ComponentLibraryHarness } from '../test/fixtures/ComponentLibraryHarness.js';

describe('Aether Deck component library — hostile edge boundaries', () => {
  let harness;

  beforeEach(() => {
    harness = new ComponentLibraryHarness();
  });

  it('Card renders script-like name/sub/desc as text without executing markup', () => {
    const card = harness.hostileCard();
    const { container } = render(
      <Card data={card} isFlipped={true} deckBack={harness.deckBacks.standard} />,
    );

    expect(screen.getByText(card.name)).toBeInTheDocument();
    expect(screen.getByText(card.sub)).toBeInTheDocument();
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img[onerror]')).toBeNull();
    expect(document.body.dataset.pwned).toBeUndefined();
  });

  it('Card falls back to Sparkles for unknown icon keys (no throw)', () => {
    const card = harness.base.validCard({ icon: 'AgenticInjectionIcon' });
    render(<Card data={card} isFlipped={true} />);
    expect(screen.getByText(card.name)).toBeInTheDocument();
  });

  it('Card uses standard deck back for unknown deckBack values', () => {
    const card = harness.base.validCard();
    const { container } = render(
      <Card
        data={card}
        isFlipped={false}
        deckBack={harness.deckBacks.agenticInjection}
      />,
    );
    expect(container.querySelector('.backface-hidden')).toBeTruthy();
  });

  it('CardModal exposes hostile card name only through escaped text nodes', () => {
    const card = harness.hostileCard();
    render(
      <CardModal
        card={card}
        isFlipped={true}
        deckBack={harness.deckBacks.standard}
        onClose={vi.fn()}
        onToggleFlip={vi.fn()}
      />,
    );

    expect(screen.getByRole('dialog')).toHaveAttribute(
      'aria-label',
      `${card.name} details`,
    );
    expect(screen.getByText(card.name)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('DexView renders hostile deck names in the selector without HTML injection', () => {
    render(<DexView {...harness.dexViewProps()} />);
    const deckEntry = harness.hostileDeckEntry();
    expect(screen.getByText(deckEntry.name.toUpperCase())).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('ForgeView keeps hostile forge strings in controlled input values', () => {
    const props = harness.forgeViewProps();
    render(<ForgeView {...props} />);

    expect(screen.getByDisplayValue(props.forgeData.name)).toBeInTheDocument();
    expect(screen.getByDisplayValue(props.forgeData.sub)).toBeInTheDocument();
    expect(document.querySelector('script')).toBeNull();
  });

  it('OracleView survives agentic layout ids and still exposes draw control', () => {
    render(
      <OracleView
        {...harness.oracleViewProps({
          oracleLayout: harness.oracleLayouts.agenticInjection,
        })}
      />,
    );

    expect(screen.getByTestId('aether-view-oracle')).toBeInTheDocument();
    expect(screen.getByTestId('aether-oracle-draw')).toBeInTheDocument();
  });

  it('OracleView forwards drop payloads to onDropOnZone without mutating deck', () => {
    const onDropOnZone = vi.fn();
    const deck = [harness.base.validCard({ id: harness.forgedCardIds.valid })];

    const { container } = render(
      <OracleView
        {...harness.oracleViewProps({
          deck,
          spread: [null, null, null],
          onDropOnZone,
        })}
      />,
    );

    const zone = container.querySelector('[class*="border-transparent"]');
    expect(zone).toBeTruthy();

    fireEvent.drop(zone, {
      dataTransfer: {
        getData: () => harness.forgedCardIds.unknown,
      },
    });

    expect(onDropOnZone).toHaveBeenCalledWith(
      harness.forgedCardIds.unknown,
      0,
    );
  });
});
