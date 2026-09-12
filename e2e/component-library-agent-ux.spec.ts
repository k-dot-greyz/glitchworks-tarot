import { test, expect, type Page } from '@playwright/test';

/**
 * Component library UX + boundary scenarios (extracted views, hostile strings, oracle/forge flows).
 * Selectors and baseURL come from playwright.config.ts / docs/TESTIDS.md — no hardcoded hosts.
 */
class ComponentLibraryE2EFixtures {
  readonly selectors;
  readonly hostileStrings;
  readonly oracleLayouts;
  readonly cardNames;

  constructor(options: {
    selectors?: Record<string, string>;
    hostileStrings?: Record<string, string>;
    oracleLayouts?: Record<string, string>;
    cardNames?: Record<string, string>;
  } = {}) {
    this.selectors = {
      root: options.selectors?.root ?? 'aether-root',
      navOracle: options.selectors?.navOracle ?? 'aether-nav-oracle',
      navForge: options.selectors?.navForge ?? 'aether-nav-forge',
      viewOracle: options.selectors?.viewOracle ?? 'aether-view-oracle',
      viewForge: options.selectors?.viewForge ?? 'aether-view-forge',
      oracleDraw: options.selectors?.oracleDraw ?? 'aether-oracle-draw',
      oracleLayout: options.selectors?.oracleLayout ?? 'aether-oracle-layout-select',
      forgeCompile: options.selectors?.forgeCompile ?? 'aether-forge-compile',
      deckSelect: options.selectors?.deckSelect ?? 'aether-deck-select',
    };

    this.hostileStrings = {
      deckName:
        options.hostileStrings?.deckName ??
        '<img src=x onerror=__pwned__>HOSTILE DECK',
      forgeName:
        options.hostileStrings?.forgeName ??
        '<script>window.__forgePwned=true</script>ENTITY',
    };

    this.oracleLayouts = {
      celticCross: options.oracleLayouts?.celticCross ?? 'celticCross',
      theClash: options.oracleLayouts?.theClash ?? 'theClash',
    };

    this.cardNames = {
      fool: options.cardNames?.fool ?? 'The Fool',
    };
  }
}

const fixtures = new ComponentLibraryE2EFixtures();

async function assertNoScriptExecution(page: Page) {
  const pwned = await page.evaluate(() => ({
    body: document.body.dataset.pwned,
    forge: (window as Window & { __forgePwned?: boolean }).__forgePwned,
  }));
  expect(pwned.body).toBeUndefined();
  expect(pwned.forge).toBeUndefined();
}

test.describe('Component library — agent UX and hostile input boundaries', () => {
  test('P0: shell exposes component-library markers on load', async ({ page }) => {
    await page.goto('/');
    const root = page.getByTestId(fixtures.selectors.root);
    await expect(root).toBeVisible();
    await expect(root).toHaveAttribute('data-aether-ui', 'main');
    await expect(root).toHaveAttribute('data-theme', 'glitch-dark');
    await expect(page.getByTestId('aether-view-dex')).toBeVisible();
  });

  test('P1: forge compile with hostile entity name does not execute scripts', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navForge).click();
    await expect(page.getByTestId(fixtures.selectors.viewForge)).toBeVisible();

    const nameInput = page
      .getByTestId(fixtures.selectors.viewForge)
      .locator('input[type="text"]')
      .first();
    await nameInput.fill(fixtures.hostileStrings.forgeName);
    await page.getByTestId(fixtures.selectors.forgeCompile).click();

    await expect(page.getByTestId('aether-view-dex')).toBeVisible();
    await assertNoScriptExecution(page);
    await expect(page.getByText(fixtures.hostileStrings.forgeName)).toBeVisible();
  });

  test('P1: oracle layout switch clears prior spread labels safely', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navOracle).click();
    await page.getByTestId(fixtures.selectors.oracleDraw).click();
    await expect(page.getByText('T-Minus (Past)')).toBeVisible();

    await page
      .getByTestId(fixtures.selectors.oracleLayout)
      .selectOption(fixtures.oracleLayouts.celticCross);
    await expect(page.getByText('T-Minus (Past)')).toHaveCount(0);

    await page.getByTestId(fixtures.selectors.oracleDraw).click();
    await expect(page.getByText('Goal')).toBeVisible();
    await assertNoScriptExecution(page);
  });

  test('P2: creating a deck with hostile name keeps shell stable', async ({ page }) => {
    await page.goto('/');

    await page.getByText(/NEW_DECK/i).click();
    const nameInput = page.getByPlaceholder('DECK NAME');
    await nameInput.fill(fixtures.hostileStrings.deckName);
    await nameInput.press('Enter');

    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();
    await expect(page.getByTestId(fixtures.selectors.deckSelect)).toBeVisible();
    await assertNoScriptExecution(page);
  });
});
