import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import {
  AppNav,
  ArenaView,
  Card,
  CardModal,
  DexView,
  ForgeView,
  GlitchOverlays,
  NeonSlider,
  OracleView,
  SettingsModal,
} from './index.js';

const sampleCard = {
  id: '000',
  name: 'The Fool',
  sub: 'Origin',
  type: 'void',
  stats: { atk: 10, def: 10, spd: 10 },
  desc: 'A beginning.',
  image: 'text-indigo-400',
  icon: 'Sparkles',
};

describe('Aether Deck component library', () => {
  it('exports the tarot generator views and chrome as named components', () => {
    expect(typeof Card).toBe('function');
    expect(typeof NeonSlider).toBe('function');
    expect(typeof DexView).toBe('function');
    expect(typeof ArenaView).toBe('function');
    expect(typeof OracleView).toBe('function');
    expect(typeof ForgeView).toBe('function');
    expect(typeof AppNav).toBe('function');
    expect(typeof SettingsModal).toBe('function');
    expect(typeof CardModal).toBe('function');
    expect(typeof GlitchOverlays).toBe('function');
  });

  it('renders Dex as a library view with stable test ids', () => {
    render(
      <DexView
        decks={[{ id: 'default', name: 'Prime Deck' }]}
        activeDeckId="default"
        deck={[sampleCard]}
        deckBack="standard"
        showDeckBacks={false}
        editingDeckId={null}
        editingDeckName=""
        newDeckName=""
        showCreateDeckInput={false}
        onSwitchDeck={vi.fn()}
        onStartRename={vi.fn()}
        onChangeEditingName={vi.fn()}
        onCommitRename={vi.fn()}
        onToggleCreate={vi.fn()}
        onChangeNewName={vi.fn()}
        onCreateDeck={vi.fn()}
        onCancelCreate={vi.fn()}
        onDuplicateDeck={vi.fn()}
        onDeleteDeck={vi.fn()}
        onToggleCardBacks={vi.fn()}
        onSelectCard={vi.fn()}
      />,
    );
    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();
    expect(screen.getByTestId('aether-deck-select')).toBeInTheDocument();
    expect(screen.getByText('The Fool')).toBeInTheDocument();
  });

  it('renders Oracle as the tarot generator surface', () => {
    render(
      <OracleView
        deck={[sampleCard]}
        deckBack="standard"
        spread={[]}
        oracleLayout="threeCard"
        revealedCardIds={[]}
        oracleDragOverZone={null}
        onChangeLayout={vi.fn()}
        onDraw={vi.fn()}
        onRevealAll={vi.fn()}
        onRevealCard={vi.fn()}
        onDropOnZone={vi.fn()}
        onDragOverZone={vi.fn()}
        onDragLeaveZone={vi.fn()}
      />,
    );
    expect(screen.getByTestId('aether-view-oracle')).toBeInTheDocument();
    expect(screen.getByTestId('aether-oracle-draw')).toBeInTheDocument();
    expect(screen.getByTestId('aether-oracle-layout-select')).toBeInTheDocument();
  });

  it('renders Arena, Forge, nav, and settings chrome independently', async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    const { rerender } = render(
      <AppNav view="dex" onChangeView={onChangeView} onOpenSettings={vi.fn()} />,
    );
    expect(screen.getByTestId('aether-nav')).toBeInTheDocument();
    await user.click(screen.getByTestId('aether-nav-oracle'));
    expect(onChangeView).toHaveBeenCalledWith('oracle');

    rerender(
      <ArenaView
        deck={[sampleCard]}
        deckBack="standard"
        arenaRuleset="standard"
        arenaSlots={{ p1: null, p2: null }}
        battleLog="[ WAITING FOR DATA INPUT ]"
        isClashing={false}
        arenaMode="standard"
        dragOverSlot={null}
        revealedCardIds={[]}
        onSelectRuleset={vi.fn()}
        onSelectMode={vi.fn()}
        onClash={vi.fn()}
        onFlush={vi.fn()}
        onSelectCard={vi.fn()}
        onDropOnZone={vi.fn()}
        onClearZone={vi.fn()}
        onRevealZone={vi.fn()}
        onDragOverSlot={vi.fn()}
        onDragLeaveSlot={vi.fn()}
      />,
    );
    expect(screen.getByTestId('aether-view-arena')).toBeInTheDocument();
    expect(screen.getByTestId('aether-arena-clash')).toBeDisabled();

    rerender(
      <ForgeView
        forgeData={{
          ...sampleCard,
          id: '999',
          name: 'New Entity',
          hideStats: false,
          hideDesc: false,
          frame: 'standard',
          hat: 'none',
          rarity: 'common',
          ability: 'none',
          customImage: null,
        }}
        deckBack="standard"
        onChange={vi.fn()}
        onCompile={vi.fn()}
        onImageUpload={vi.fn()}
      />,
    );
    expect(screen.getByTestId('aether-view-forge')).toBeInTheDocument();
    expect(screen.getByTestId('aether-forge-compile')).toBeInTheDocument();

    rerender(
      <SettingsModal
        aesthetics={{ glitch: 50, crt: 40, noise: 15 }}
        deckBack="standard"
        onChangeAesthetics={vi.fn()}
        onChangeDeckBack={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByTestId('aether-modal-settings')).toBeInTheDocument();

    rerender(
      <CardModal
        card={sampleCard}
        isFlipped
        deckBack="standard"
        onClose={vi.fn()}
        onToggleFlip={vi.fn()}
      />,
    );
    expect(screen.getByTestId('aether-modal-card')).toBeInTheDocument();
  });
});
