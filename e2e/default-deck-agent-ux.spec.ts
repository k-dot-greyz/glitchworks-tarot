import { test, expect } from '@playwright/test';

/**
 * User story (PR #25 / #34): Fresh visitor loads the canonical default deck —
 * tarot cards from default_deck.json, no Last.fm overlay, Dex → Oracle flow intact.
 */
test.describe('Default deck — canonical UX and agent edge', () => {
  test('loads canonical tarot cards on first visit', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId('aether-view-dex')).toBeVisible();
    await expect(page.getByText('The Fool')).toBeVisible();
    await expect(page.getByText('The Glitch')).toBeVisible();
    expect(errors, `console errors: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('oracle draw uses canonical deck without external stats labels', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-oracle').click();
    await page.getByTestId('aether-oracle-draw').click();

    await expect(page.getByText('T-Minus (Past)')).toBeVisible();
    const bodyText = await page.locator('body').innerText();
    expect(bodyText).not.toMatch(/lastfm|scrobble|playcount/i);
  });

  test('forge compile appends to canonical deck without id collision on 404', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-forge').click();
    await page.getByTestId('aether-forge-compile').click();
    await page.getByTestId('aether-nav-dex').click();

    await expect(page.getByText('The Glitch')).toBeVisible();
    await expect(page.getByText('New Entity')).toBeVisible();
  });

  test('corrupted localStorage does not white-screen the shell', async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem('aether-decks', '{"decks":[{"id":"broken"');
    });

    await page.goto('/');
    await expect(page.getByTestId('aether-root')).toBeVisible();
    await expect(page.getByTestId('aether-view-dex')).toBeVisible();
    await expect(page.getByText('The Fool')).toBeVisible();
  });
});
