import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PrSpreadView } from './PrSpreadView.jsx';

describe('PrSpreadView (read-only PR decision surface)', () => {
  it('renders central card + 6 sidecars for the highest-signal PR', () => {
    render(<PrSpreadView />);
    expect(screen.getByTestId('pr-central-card')).toBeInTheDocument();
    for (const id of ['checks', 'reviews', 'issues', 'files', 'stack', 'repo']) {
      expect(screen.getByTestId(`pr-sidecar-${id}`)).toBeInTheDocument();
    }
    expect(screen.getAllByRole('button', { name: /^#\d+/ })).toHaveLength(4);
    expect(screen.getByText(/example-org\/example-repo · synthetic fixtures/)).toBeInTheDocument();
  });

  it('has no write actions (no merge/approve/comment controls)', () => {
    render(<PrSpreadView />);
    const labels = screen.getAllByRole('button').map((b) => b.textContent + (b.getAttribute('aria-label') || ''));
    for (const l of labels) expect(l).not.toMatch(/\b(merge now|approve|comment|close pr|request changes)\b/i);
  });

  it('switches PR and shows the stack for #142', async () => {
    const user = userEvent.setup();
    render(<PrSpreadView />);
    await user.click(screen.getByTestId('pr-select-142'));
    expect(screen.getByTestId('pr-verdict')).toHaveTextContent('NO-MERGE');
    expect(screen.getByTestId('pr-sidecar-stack')).toHaveTextContent('#138');
  });

  it('PR picker shows the four verdicts', () => {
    render(<PrSpreadView />);
    const v = (n) => screen.getByTestId(`pr-select-${n}`).textContent;
    expect(v(142)).toContain('NO-MERGE');
    expect(v(145)).toContain('NO-MERGE');
    expect(v(147)).toContain('NOT YET');
    expect(v(149)).toContain('OK');
  });

  it('keyboard: card opens modal, focus moves in, Tab is trapped, Esc closes and restores focus', async () => {
    const user = userEvent.setup();
    render(<PrSpreadView />);
    const card = screen.getByTestId('pr-sidecar-checks');
    card.focus();
    await user.keyboard('{Enter}');
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByTestId('pr-modal-close')).toHaveFocus();

    const links = within(dialog).getAllByTestId('pr-modal-ref');
    expect(links.length).toBeGreaterThan(0);
    for (const a of links) {
      expect(a.getAttribute('href')).toMatch(/^https:\/\/github\.com\//);
      expect(a).toHaveAttribute('rel', 'noopener noreferrer');
    }

    // Shift+Tab from the first focusable wraps to the last one inside the dialog.
    await user.keyboard('{Shift>}{Tab}{/Shift}');
    expect(dialog.contains(document.activeElement)).toBe(true);
    await user.tab();
    expect(screen.getByTestId('pr-modal-close')).toHaveFocus();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(card).toHaveFocus();
  });

  it('low-signal sidecars start collapsed and can be expanded', async () => {
    const user = userEvent.setup();
    render(<PrSpreadView />);
    const collapsed = () => document.querySelectorAll('[data-collapsed="true"]').length;
    const before = collapsed();
    expect(before).toBeGreaterThan(0);
    await user.click(screen.getByTestId('pr-toggle-low-signal'));
    expect(collapsed()).toBe(0);
  });
});
