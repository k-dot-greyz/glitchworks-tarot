import { render, screen, fireEvent, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import App from './App.jsx';

describe('App', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random').mockReturnValue(0.42);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders root shell and default dex view', () => {
    render(<App />);
    expect(screen.getByTestId('aether-root')).toBeInTheDocument();
    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();
    expect(screen.getByTestId('aether-main')).toBeInTheDocument();
  });

  it('switches views when nav tabs are clicked', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();

    await user.click(screen.getByTestId('aether-nav-arena'));
    expect(screen.queryByTestId('aether-view-dex')).not.toBeInTheDocument();
    expect(screen.getByTestId('aether-view-arena')).toBeInTheDocument();

    await user.click(screen.getByTestId('aether-nav-oracle'));
    expect(screen.getByTestId('aether-view-oracle')).toBeInTheDocument();

    await user.click(screen.getByTestId('aether-nav-forge'));
    expect(screen.getByTestId('aether-view-forge')).toBeInTheDocument();

    await user.click(screen.getByTestId('aether-nav-dex'));
    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();
  });

  it('opens and closes settings modal', () => {
    render(<App />);
    expect(screen.queryByTestId('aether-modal-settings')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('aether-settings-open-desktop'));
    expect(screen.getByTestId('aether-modal-settings')).toBeInTheDocument();
    expect(screen.getByTestId('aether-modal-settings-panel')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('aether-settings-close'));
    expect(screen.queryByTestId('aether-modal-settings')).not.toBeInTheDocument();
  });

  it('opens card detail modal from dex and closes it', async () => {
    const user = userEvent.setup();
    render(<App />);

    expect(screen.getByText('The Fool')).toBeInTheDocument();
    await user.click(screen.getByText('The Fool'));

    const modal = screen.getByTestId('aether-modal-card');
    expect(modal).toBeInTheDocument();
    expect(within(modal).getByText('The Fool')).toBeInTheDocument();

    await user.click(screen.getByTestId('aether-modal-card-close'));
    expect(screen.queryByTestId('aether-modal-card')).not.toBeInTheDocument();
  });

  it('oracle draw populates spread', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-oracle'));

    expect(screen.getByTestId('aether-view-oracle')).toBeInTheDocument();
    await user.click(screen.getByTestId('aether-oracle-draw'));

    expect(screen.getByText('T-Minus (Past)')).toBeInTheDocument();
  });

  it('renders successfully when localStorage contains corrupted JSON', () => {
    localStorage.setItem(
      'aether-decks',
      '{"broken json that will never parse][',
    );
    render(<App />);
    expect(screen.getByTestId('aether-root')).toBeInTheDocument();
    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();
    // The corrupted value must be gone — either removed (null) or replaced with valid JSON by
    // the persistence effect. Either way, the stored string must not be the corrupted payload.
    const stored = localStorage.getItem('aether-decks');
    if (stored !== null) {
      expect(() => JSON.parse(stored)).not.toThrow();
    }
  });

  it('forge compiles a card with a unique ID that does not collide with existing deck', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));
    await user.click(screen.getByTestId('aether-forge-compile'));

    const saved = localStorage.getItem('aether-decks');
    const savedState = JSON.parse(saved);
    const savedDeck = savedState.decks.find(
      (d) => d.id === savedState.activeDeckId,
    ).cards;
    const ids = savedDeck.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);

    const forgedCard = savedDeck[savedDeck.length - 1];
    expect(forgedCard.id).not.toBe('018');
    expect(forgedCard.id).not.toBe('019');
  });

  it('handleImageUpload: forge field edits during async file read are not overwritten (no stale closure)', async () => {
    const user = userEvent.setup();

    let capturedOnloadend = null;
    const fakeResult = 'data:image/png;base64,FAKE';
    vi.stubGlobal('FileReader', class {
      constructor() { this.result = fakeResult; }
      set onloadend(fn) { capturedOnloadend = fn; }
      readAsDataURL() {}
    });

    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));

    // Edit the name BEFORE triggering the upload so it's in the closure
    const nameInput = screen.getByDisplayValue('New Entity');
    await user.clear(nameInput);
    await user.type(nameInput, 'Cosmic Terror');

    // Trigger the file input (fires onloadend asynchronously via our mock)
    const fileInput = document.querySelector('input[type="file"]');
    const fakeFile = new File(['data'], 'art.png', { type: 'image/png' });
    fireEvent.change(fileInput, { target: { files: [fakeFile] } });

    // Edit name AGAIN while the "async" read is in-flight
    await user.clear(nameInput);
    await user.type(nameInput, 'Void Specter');

    // Now fire onloadend — with the stale-closure bug, this would overwrite the name
    // back to 'Cosmic Terror'; with the fix it should leave 'Void Specter' intact
    expect(capturedOnloadend).toBeTruthy();
    capturedOnloadend();

    expect(nameInput.value).toBe('Void Specter');

    vi.unstubAllGlobals();
  });

  it('usePersistedDeck logs telemetry warning when storage.save reports quota failure', async () => {
    const { createMemoryDeckStorage } =
      await import('./adapters/memoryDeckStorage.js');

    const storage = createMemoryDeckStorage();
    const alwaysFailSave = {
      load: storage.load,
      save: () => ({ ok: false, error: 'QuotaExceededError: exceeded quota' }),
      clear: storage.clear,
    };
    const telemetry = { log: vi.fn() };

    render(<App storage={alwaysFailSave} telemetry={telemetry} />);

    // The persistence effect fires on mount; the save should fail and be logged
    expect(telemetry.log).toHaveBeenCalledWith(
      'warn',
      'DECKS_SAVE_QUOTA_EXCEEDED',
      expect.objectContaining({
        error: expect.stringContaining('QuotaExceededError'),
      }),
    );
  });

  it('Arena Mode Selector updates UI and disables combat when Combat Disabled is selected', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-arena'));

    expect(screen.getByTestId('aether-arena-mode-select')).toBeInTheDocument();
    expect(screen.getByTestId('aether-arena-log')).toHaveTextContent(
      'WAITING FOR DATA INPUT',
    );

    // Select 'Combat Disabled' mode
    const select = screen.getByTestId('aether-arena-mode-select');
    await user.selectOptions(select, 'combatDisabled');

    expect(screen.getByTestId('aether-arena-log')).toHaveTextContent(
      'SYSTEMS IN HARMONY. NO CLASH POSSIBLE.',
    );
    expect(screen.getByTestId('aether-arena-clash')).toBeDisabled();
    expect(screen.getByTestId('aether-arena-clash')).toHaveTextContent(
      'COMBAT DISABLED',
    );
  });

  it('allows selecting a custom deck back in the Settings modal', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Open settings modal
    await user.click(screen.getByTestId('aether-settings-open-desktop'));
    expect(screen.getByTestId('aether-modal-settings')).toBeInTheDocument();

    // Select 'Cyberpunk Grid' deck back
    const select = screen.getByTestId('aether-settings-deckback');
    expect(select).toBeInTheDocument();
    expect(select.value).toBe('standard');

    await user.selectOptions(select, 'cyberpunkGrid');
    expect(select.value).toBe('cyberpunkGrid');
  });

  it('allows customizing frame, hat, rarity, and ability in the Forge view', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));

    // Check selectors exist
    const frameSelect = screen.getByTestId('aether-forge-frame');
    const hatSelect = screen.getByTestId('aether-forge-hat');
    const raritySelect = screen.getByTestId('aether-forge-rarity');
    const abilitySelect = screen.getByTestId('aether-forge-ability');

    expect(frameSelect).toBeInTheDocument();
    expect(hatSelect).toBeInTheDocument();
    expect(raritySelect).toBeInTheDocument();
    expect(abilitySelect).toBeInTheDocument();

    // Select custom properties
    await user.selectOptions(frameSelect, 'glitchMatrix');
    await user.selectOptions(hatSelect, 'cyberCrown');
    await user.selectOptions(raritySelect, 'glitched');
    await user.selectOptions(abilitySelect, 'voidShield');

    expect(frameSelect.value).toBe('glitchMatrix');
    expect(hatSelect.value).toBe('cyberCrown');
    expect(raritySelect.value).toBe('glitched');
    expect(abilitySelect.value).toBe('voidShield');
  });

  it('allows changing Oracle layouts and drawing different card counts', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-oracle'));

    const layoutSelect = screen.getByTestId('aether-oracle-layout-select');
    expect(layoutSelect).toBeInTheDocument();
    expect(layoutSelect.value).toBe('threeCard');

    // Draw standard 3 card spread
    await user.click(screen.getByTestId('aether-oracle-draw'));
    expect(screen.getByText('T-Minus (Past)')).toBeInTheDocument();

    // Change to Celtic Cross (clears spread)
    await user.selectOptions(layoutSelect, 'celticCross');
    expect(screen.queryByText('T-Minus (Past)')).not.toBeInTheDocument();

    // Draw Celtic Cross (5 cards)
    await user.click(screen.getByTestId('aether-oracle-draw'));
    expect(screen.getByText('Goal')).toBeInTheDocument();
    expect(screen.getByText('Past')).toBeInTheDocument();
    expect(screen.getByText('Future')).toBeInTheDocument();

    // Change to The Clash
    await user.selectOptions(layoutSelect, 'theClash');
    expect(screen.queryByText('Goal')).not.toBeInTheDocument();

    // Draw The Clash (3 cards)
    await user.click(screen.getByTestId('aether-oracle-draw'));
    expect(screen.getByText('Alpha (Thesis)')).toBeInTheDocument();
    expect(screen.getByText('Omega (Antithesis)')).toBeInTheDocument();
    expect(screen.getByText('Synthesis (Outcome)')).toBeInTheDocument();
  });

  it('supports multiple deck management (create, switch, duplicate, rename, delete)', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Check initial deck selector exists
    const deckSelect = screen.getByTestId('aether-deck-select');
    expect(deckSelect).toBeInTheDocument();
    expect(deckSelect.value).toBe('default');

    // Create a new deck
    await user.click(screen.getByText(/NEW_DECK/i));
    const nameInput = screen.getByPlaceholderText('DECK NAME');
    await user.type(nameInput, 'MY CUSTOM DECK');
    await user.click(nameInput.parentElement.querySelector('button')); // click Check button

    // Check we switched to the new deck
    expect(deckSelect.value).not.toBe('default');
    expect(screen.getByText('MY CUSTOM DECK')).toBeInTheDocument();

    // Duplicate deck
    await user.click(screen.getByText(/CLONE_DECK/i));
    expect(screen.getByText('MY CUSTOM DECK COPY')).toBeInTheDocument();

    // Delete deck
    await user.click(screen.getByText(/DELETE_DECK/i));
    expect(screen.queryByText('MY CUSTOM DECK COPY')).not.toBeInTheDocument();
  });

  it('supports interactive card flipping and reveals', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Toggle card backs in Dex view
    const cardBacksBtn = screen.getByText('CARD_BACKS');
    await user.click(cardBacksBtn);
    // When card backs are shown, cards are face-down (isFlipped={false})

    // Go to Oracle view
    await user.click(screen.getByTestId('aether-nav-oracle'));
    await user.click(screen.getByTestId('aether-oracle-draw'));

    // Cards start face-down (unrevealed). "REVEAL ALL" button should be visible.
    const revealAllBtn = screen.getByText('REVEAL ALL');
    expect(revealAllBtn).toBeInTheDocument();

    // Click "REVEAL ALL"
    await user.click(revealAllBtn);
    expect(screen.queryByText('REVEAL ALL')).not.toBeInTheDocument();
  });

  it('supports TCG playmat layouts (MTG, Yu-Gi-Oh, Pokémon) in the Arena view', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-arena'));

    const rulesetSelect = screen.getByTestId('aether-arena-ruleset-select');
    expect(rulesetSelect).toBeInTheDocument();

    // MTG Battlefield
    await user.selectOptions(rulesetSelect, 'mtg');
    expect(screen.getByText('P1 Battlefield')).toBeInTheDocument();
    expect(screen.getByText('P1 Hand')).toBeInTheDocument();
    expect(screen.getByText('P1 Graveyard')).toBeInTheDocument();
    expect(screen.getByText('P1 Library')).toBeInTheDocument();
    expect(screen.getByText('P1 Commander')).toBeInTheDocument();

    // Yu-Gi-Oh! Duel Field
    await user.selectOptions(rulesetSelect, 'yugioh');
    expect(screen.getByText('P1 Monster Zone')).toBeInTheDocument();
    expect(screen.getByText('P1 Spell & Trap')).toBeInTheDocument();
    expect(screen.getByText('P1 Field Spell')).toBeInTheDocument();
    expect(screen.getByText('P1 Graveyard')).toBeInTheDocument();
    expect(screen.getByText('Shadow Realm')).toBeInTheDocument();

    // Pokémon TCG Arena
    await user.selectOptions(rulesetSelect, 'pokemon');
    expect(screen.getByText('P1 Active Pokémon')).toBeInTheDocument();
    expect(screen.getByText('P1 Bench')).toBeInTheDocument();
    expect(screen.getByText('P1 Prizes')).toBeInTheDocument();
    expect(screen.getByText('P1 Discard Pile')).toBeInTheDocument();
  });

  it('validates banlist at the boundary in the Arena view', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-arena'));

    const rulesetSelect = screen.getByTestId('aether-arena-ruleset-select');
    await user.selectOptions(rulesetSelect, 'mtg');

    // Click on 'The Magician' (ID '001') which is banned in MTG ruleset
    const magicianCard = screen.getByText('The Magician');
    expect(magicianCard).toBeInTheDocument();

    await user.click(magicianCard);

    // It should show a ban warning in the battle log
    expect(screen.getByTestId('aether-arena-log')).toHaveTextContent('BANNED IN MTG BATTLEFIELD');
  });
});
