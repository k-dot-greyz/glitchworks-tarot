import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from '../../App.jsx';

describe('App nav → PR decision surface', () => {
  it('the prs nav entry opens the PR spread; other views unaffected', async () => {
    const user = userEvent.setup();
    render(<App />);
    expect(screen.getByTestId('aether-view-dex')).toBeInTheDocument();
    await user.click(screen.getByTestId('aether-nav-prs'));
    expect(await screen.findByTestId('pr-spread')).toBeInTheDocument();
    await user.click(screen.getByTestId('aether-nav-dex'));
    expect(screen.queryByTestId('pr-spread')).not.toBeInTheDocument();
  });
});
