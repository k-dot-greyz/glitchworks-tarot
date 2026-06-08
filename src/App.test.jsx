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
    localStorage.setItem('aether-deck', '{"broken json that will never parse][');
    render(<App />);
    expect(screen.getByTestId('aether-root')).toBeInTheDocument();
    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();
    // The corrupted value must be gone — either removed (null) or replaced with valid JSON by
    // the persistence effect. Either way, the stored string must not be the corrupted payload.
    const stored = localStorage.getItem('aether-deck');
    if (stored !== null) {
      expect(() => JSON.parse(stored)).not.toThrow();
    }
  });

  it('forge compiles a card with a unique ID that does not collide with existing deck', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));
    await user.click(screen.getByTestId('aether-forge-compile'));

    const saved = localStorage.getItem('aether-deck');
    const savedDeck = JSON.parse(saved);
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
      'DECK_SAVE_QUOTA_EXCEEDED',
      expect.objectContaining({ error: expect.stringContaining('QuotaExceededError') })
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

  it('Celtic Cross with deck < 5 cards shows error message instead of crashing', async () => {
    const { createMemoryDeckStorage } =
      await import('./adapters/memoryDeckStorage.js');

    // Seed storage with a 4-card deck — one fewer than Celtic Cross requires
    const smallDeck = [
      { id: '001', name: 'A', type: 'fire', sub: 'X', icon: 'Sword', desc: 'd', stats: { atk: 10, def: 10, spd: 10 } },
      { id: '002', name: 'B', type: 'water', sub: 'X', icon: 'Shield', desc: 'd', stats: { atk: 10, def: 10, spd: 10 } },
      { id: '003', name: 'C', type: 'wind', sub: 'X', icon: 'Wind', desc: 'd', stats: { atk: 10, def: 10, spd: 10 } },
      { id: '004', name: 'D', type: 'void', sub: 'X', icon: 'Sparkles', desc: 'd', stats: { atk: 10, def: 10, spd: 10 } },
    ];
    const storage = createMemoryDeckStorage({
      'aether-deck': JSON.stringify(smallDeck),
    });

    const user = userEvent.setup();
    render(<App storage={storage} />);
    await user.click(screen.getByTestId('aether-nav-oracle'));

    const layoutSelect = screen.getByTestId('aether-oracle-layout-select');
    await user.selectOptions(layoutSelect, 'celticCross');

    // Draw — should NOT crash, should show the insufficient-cards error
    await user.click(screen.getByTestId('aether-oracle-draw'));
    expect(screen.getByText(/INSUFFICIENT DATA/i)).toBeInTheDocument();
    expect(screen.queryByText('Goal')).not.toBeInTheDocument();
  });

  it('saveForgeCard resets frame, hat, rarity, and ability to defaults after compiling', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));

    // Set non-default cosmetics and TCG properties
    await user.selectOptions(screen.getByTestId('aether-forge-frame'), 'glitchMatrix');
    await user.selectOptions(screen.getByTestId('aether-forge-hat'), 'cyberCrown');
    await user.selectOptions(screen.getByTestId('aether-forge-rarity'), 'glitched');
    await user.selectOptions(screen.getByTestId('aether-forge-ability'), 'overdrive');

    // Compile and navigate back to forge
    await user.click(screen.getByTestId('aether-forge-compile'));
    await user.click(screen.getByTestId('aether-nav-forge'));

    // All four fields must reset to defaults so they don't bleed into the next card
    expect(screen.getByTestId('aether-forge-frame').value).toBe('standard');
    expect(screen.getByTestId('aether-forge-hat').value).toBe('none');
    expect(screen.getByTestId('aether-forge-rarity').value).toBe('common');
    expect(screen.getByTestId('aether-forge-ability').value).toBe('none');
  });

  it('rapid double-click on forge compile produces unique IDs (no stale closure collision)', async () => {
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));

    const compileBtn = screen.getByTestId('aether-forge-compile');
    // Fire two clicks without waiting between them to exercise the race
    await user.dblClick(compileBtn);

    const saved = localStorage.getItem('aether-deck');
    const deck = JSON.parse(saved);
    const ids = deck.map(c => c.id);
    const uniqueIds = new Set(ids);
    expect(uniqueIds.size).toBe(ids.length);
  });
});
