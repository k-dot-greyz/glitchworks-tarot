import { test, expect } from '@playwright/test';

test.describe('Forge — entity builder live demo', () => {
  test('create and compile an action pose entity', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId('aether-root')).toBeVisible();

    // Open Forge
    await page.getByTestId('aether-nav-forge').click();
    await expect(page.getByTestId('aether-view-forge')).toBeVisible();
    await expect(page.getByRole('heading', { name: /the forge/i })).toBeVisible();

    // Fill name and sub via the forge view inputs (first two text inputs)
    const forgeInputs = page.locator('[data-testid="aether-view-forge"] input[type="text"]');
    await forgeInputs.nth(0).fill('Neon Leap');
    await forgeInputs.nth(1).fill('Overdrive Entry');

    // Elemental core → wind (first select in the forge view)
    const forgeSelects = page.locator('[data-testid="aether-view-forge"] select');
    await forgeSelects.nth(0).selectOption('wind');

    // Lore (textarea or last text input / by label context — look for the desc field)
    const lore = page.locator('[data-testid="aether-view-forge"] textarea, [data-testid="aether-view-forge"] input[type="text"]').last();
    await lore.fill('Mid-air parkour strike. The city becomes the weapon.');

    // Compile
    await page.getByTestId('aether-forge-compile').click();

    // Switch to Dex and verify the card appears
    await page.getByTestId('aether-nav-dex').click();
    await expect(page.getByText('Neon Leap')).toBeVisible();

    // Filter out known sandbox 402 noise if present
    const realErrors = errors.filter((e) => !e.includes('402'));
    expect(realErrors, `console errors: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});
