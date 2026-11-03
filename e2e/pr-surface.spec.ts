import { test, expect } from '@playwright/test';

/**
 * PR decision surface — read-only UX + security boundaries (synthetic fixtures only).
 * Deep link: ?view=prs (see App.jsx). Selectors: pr-* test ids from PrSpreadView / PrModal.
 */
test.describe('PR spread — read-only decision surface', () => {
  test('user story: ?view=prs deep link opens spread without dex shell takeover', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/?view=prs');
    await expect(page.getByTestId('pr-spread')).toBeVisible();
    await expect(page.getByTestId('pr-central-card')).toBeVisible();
    await expect(page.getByText(/read-only · no network · never merges/i)).toBeVisible();

    const unexpected = errors.filter(
      (t) => !t.includes('Failed to load resource') && !t.includes('404'),
    );
    expect(unexpected, unexpected.join('\n')).toHaveLength(0);
  });

  test('user story: picker shows four synthetic verdicts; #142 stack sidecar visible', async ({
    page,
  }) => {
    await page.goto('/?view=prs');
    for (const [n, label] of [
      ['142', 'NO-MERGE'],
      ['145', 'NO-MERGE'],
      ['147', 'NOT YET'],
      ['149', 'OK'],
    ] as const) {
      await expect(page.getByTestId(`pr-select-${n}`)).toContainText(label);
    }
    await page.getByTestId('pr-select-142').click();
    await expect(page.getByTestId('pr-verdict')).toHaveText('NO-MERGE');
    await expect(page.getByTestId('pr-sidecar-stack')).toContainText('#138');
  });

  test('security: modal ref links stay on github.com; preview makes no off-origin fetch', async ({
    page,
    baseURL,
  }) => {
    const appOrigin = baseURL ?? 'http://127.0.0.1:4173';
    const offOrigin: string[] = [];
    page.on('request', (req) => {
      const url = req.url();
      if (url.startsWith('blob:') || url.startsWith('data:')) return;
      if (!url.startsWith(appOrigin)) offOrigin.push(url);
    });

    await page.goto('/?view=prs');
    await page.getByTestId('pr-sidecar-checks').click();
    await expect(page.getByTestId('pr-modal')).toBeVisible();

    const refs = page.getByTestId('pr-modal-ref');
    const count = await refs.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i += 1) {
      const href = await refs.nth(i).getAttribute('href');
      expect(href).toMatch(/^https:\/\/github\.com\//);
    }

    await page.getByTestId('pr-modal-close').click();
    expect(offOrigin, offOrigin.join('\n')).toEqual([]);
  });

  test('sad: no merge/approve/comment write controls in the PR spread', async ({ page }) => {
    await page.goto('/?view=prs');
    const buttons = page.locator('[data-testid^="pr-"] button, [data-testid^="pr-"] [role="button"]');
    const texts = await buttons.evaluateAll((els) =>
      els.map((el) => `${el.textContent ?? ''} ${el.getAttribute('aria-label') ?? ''}`),
    );
    for (const t of texts) {
      expect(t).not.toMatch(/\b(merge now|approve pr|request changes|add comment|close pull)\b/i);
    }
  });
});
