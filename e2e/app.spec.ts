import { test, expect } from '@playwright/test';

test.describe('Aether deck — core flows', () => {
  test('loads shell and dex view', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    await page.goto('/');
    await expect(page.getByTestId('aether-root')).toBeVisible();
    await expect(page.getByTestId('aether-view-dex')).toBeVisible();
    expect(errors, `console errors: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('nav switches views', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-arena').click();
    await expect(page.getByTestId('aether-view-arena')).toBeVisible();
    await page.getByTestId('aether-nav-oracle').click();
    await expect(page.getByTestId('aether-view-oracle')).toBeVisible();
    await page.getByTestId('aether-nav-forge').click();
    await expect(page.getByTestId('aether-view-forge')).toBeVisible();
    await page.getByTestId('aether-nav-dex').click();
    await expect(page.getByTestId('aether-view-dex')).toBeVisible();
  });

  test('settings modal opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-settings-open-desktop').click();
    await expect(page.getByTestId('aether-modal-settings')).toBeVisible();
    await page.getByTestId('aether-settings-close').click();
    await expect(page.getByTestId('aether-modal-settings')).toHaveCount(0);
  });

  test('oracle draw shows spread labels', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-oracle').click();
    await page.getByTestId('aether-oracle-draw').click();
    await expect(page.getByText('T-Minus (Past)')).toBeVisible();
  });

  test('dex: open card modal and close', async ({ page }) => {
    await page.goto('/');
    await page.getByText('The Fool').click();
    await expect(page.getByTestId('aether-modal-card')).toBeVisible();
    await page.getByTestId('aether-modal-card-close').click();
    await expect(page.getByTestId('aether-modal-card')).toHaveCount(0);
  });

  test('arena clash button disabled without slots', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-arena').click();
    const clash = page.getByTestId('aether-arena-clash');
    await expect(clash).toBeDisabled();
  });

  test('double-click spam on oracle draw does not break UI', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('aether-nav-oracle').click();
    const draw = page.getByTestId('aether-oracle-draw');
    await draw.dblclick();
    await expect(page.getByTestId('aether-view-oracle')).toBeVisible();
  });
});
