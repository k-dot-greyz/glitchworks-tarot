import { render, screen, fireEvent, within, act } from '@testing-library/react';
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

  it('oracle spread uses Fisher-Yates shuffle — late-deck card appears in first position', async () => {
    // Math.random is mocked to always return 0.42 (see beforeEach).
    // Fisher-Yates on the 17-card dynamic deck with random()=0.42 deterministically
    // places The Hermit (originally at index 9) into position 0 of the spread.
    // The old biased Array.sort comparator (0.5 - 0.42 = 0.08 always positive) leaves
    // every element "greater than" its predecessor, keeping The Fool at position 0.
    const user = userEvent.setup();
    render(<App />);
    await user.click(screen.getByTestId('aether-nav-oracle'));
    await user.click(screen.getByTestId('aether-oracle-draw'));

    expect(screen.getByText('T-Minus (Past)')).toBeInTheDocument();
    // The Hermit lives at index 9 in the original deck array, far from index 0.
    // Its presence at T-Minus proves the shuffle is unbiased (Fisher-Yates),
    // not a sort that keeps early elements near the front.
    expect(screen.getByText('The Hermit')).toBeInTheDocument();
  });

  it('handleImageUpload preserves concurrent forge edits — no stale closure', async () => {
    // The stale-closure bug: reader.onloadend captures forgeData at call-time.
    // If the user edits a field while the FileReader is async-reading a large file,
    // setForgeData({ ...staleForgeData, customImage }) silently discards those edits.
    // The fix: setForgeData(prev => ({ ...prev, customImage })) always uses latest state.
    const user = userEvent.setup();

    let capturedOnloadend = null;
    vi.stubGlobal('FileReader', class {
      constructor() {
        this.result = 'data:image/png;base64,FAKEDATA';
        this.readAsDataURL = vi.fn();
      }
      set onloadend(cb) { capturedOnloadend = cb; }
      get onloadend() { return capturedOnloadend; }
    });

    render(<App />);
    await user.click(screen.getByTestId('aether-nav-forge'));

    // Trigger file upload — sets capturedOnloadend but does NOT fire it yet
    const fileInput = document.querySelector('input[type="file"]');
    await user.upload(fileInput, new File(['img'], 'art.png', { type: 'image/png' }));

    // Simulate the user editing the name while the large file is still loading
    const nameInput = screen.getByDisplayValue('New Entity');
    await user.clear(nameInput);
    await user.type(nameInput, 'Phantom Gate');
    expect(screen.getByDisplayValue('Phantom Gate')).toBeInTheDocument();

    // File read completes — with the stale-closure bug this would reset name to 'New Entity'
    act(() => capturedOnloadend());

    expect(screen.getByDisplayValue('Phantom Gate')).toBeInTheDocument();

    vi.unstubAllGlobals();
  });
});
