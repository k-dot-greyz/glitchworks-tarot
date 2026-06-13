import { test, expect } from '@playwright/test';

/**
 * User story: Arena operator selects a TCG playmat, assigns clash cards,
 * and expects banlist enforcement + clash resolution without console errors.
 */
test.describe('Arena — rulesets and hostile edge UX', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-arena').click();
    await expect(page.getByTestId('aether-view-arena')).toBeVisible();
  });

  test('ruleset switch renders MTG zones and resets log', async ({ page }) => {
    const rulesetSelect = page.getByTestId('aether-arena-ruleset-select');
    await rulesetSelect.selectOption('mtg');

    await expect(page.getByText('P1 Battlefield')).toBeVisible();
    await expect(page.getByTestId('aether-arena-log')).toContainText(
      'MTG BATTLEFIELD INITIALIZED',
    );
  });

  test('MTG banlist blocks banned card assignment via click', async ({ page }) => {
    await page.getByTestId('aether-arena-ruleset-select').selectOption('mtg');
    await page.getByText('The Magician').click();

    await expect(page.getByTestId('aether-arena-log')).toContainText(
      'BANNED IN MTG BATTLEFIELD',
    );
    await expect(page.getByTestId('aether-arena-clash')).toBeDisabled();
  });

  test('standard clash resolves after both slots filled', async ({ page }) => {
    await page.getByText('The Fool').click();
    await page.getByText('High Priestess').click();

    const clash = page.getByTestId('aether-arena-clash');
    await expect(clash).toBeEnabled();
    await clash.click();

    await expect(page.getByTestId('aether-arena-log')).toContainText(
      'DATA COLLISION DETECTED',
    );
    await expect(page.getByTestId('aether-arena-log')).toContainText(
      /OVERWRITES|EQUILIBRIUM/,
      { timeout: 3000 },
    );
  });

  test('switching ruleset clears in-progress slot assignments', async ({ page }) => {
    await page.getByText('The Fool').click();
    await expect(page.getByTestId('aether-arena-log')).toContainText('FILLED');

    await page.getByTestId('aether-arena-ruleset-select').selectOption('yugioh');
    await expect(page.getByTestId('aether-arena-clash')).toBeDisabled();
  });

  test('no console errors during ruleset navigation', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    const rulesetSelect = page.getByTestId('aether-arena-ruleset-select');
    for (const value of ['mtg', 'yugioh', 'pokemon', 'standard']) {
      await rulesetSelect.selectOption(value);
      await expect(page.getByTestId('aether-view-arena')).toBeVisible();
    }

    expect(errors, `console errors: ${errors.join('\n')}`).toHaveLength(0);
  });
});
