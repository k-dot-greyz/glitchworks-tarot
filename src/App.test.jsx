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
    const { createMemoryDeckStorage } = await import('./adapters/memoryDeckStorage.js');
    const { createConsoleTelemetry } = await import('./adapters/consoleTelemetry.js');

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
});
