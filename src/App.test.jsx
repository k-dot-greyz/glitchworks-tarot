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
});
