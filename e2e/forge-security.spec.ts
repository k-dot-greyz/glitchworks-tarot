import { test, expect } from '@playwright/test';

/**
 * Forge UX + compile boundary (unique IDs, cosmetic reset, persistence).
 * Selectors and storage keys are constructor-instantiated — no scattered literals.
 */
class ForgeE2EFixtures {
  readonly selectors;
  readonly storageKey;
  readonly defaultForgeName;
  readonly resetCosmeticValues;

  constructor(options: {
    selectors?: Record<string, string>;
    storageKey?: string;
    defaultForgeName?: string;
    resetCosmeticValues?: Record<string, string>;
  } = {}) {
    this.selectors = {
      root: options.selectors?.root ?? 'aether-root',
      navForge: options.selectors?.navForge ?? 'aether-nav-forge',
      viewForge: options.selectors?.viewForge ?? 'aether-view-forge',
      navDex: options.selectors?.navDex ?? 'aether-nav-dex',
      viewDex: options.selectors?.viewDex ?? 'aether-view-dex',
      compile: options.selectors?.compile ?? 'aether-forge-compile',
      frame: options.selectors?.frame ?? 'aether-forge-frame',
      hat: options.selectors?.hat ?? 'aether-forge-hat',
      rarity: options.selectors?.rarity ?? 'aether-forge-rarity',
      ability: options.selectors?.ability ?? 'aether-forge-ability',
    };

    this.storageKey = options.storageKey ?? 'aether-decks';
    this.defaultForgeName = options.defaultForgeName ?? 'New Entity';
    this.resetCosmeticValues = {
      frame: options.resetCosmeticValues?.frame ?? 'standard',
      hat: options.resetCosmeticValues?.hat ?? 'none',
      rarity: options.resetCosmeticValues?.rarity ?? 'common',
      ability: options.resetCosmeticValues?.ability ?? 'none',
    };
  }
}

const fixtures = new ForgeE2EFixtures();

test.describe('Forge — compile boundary and cosmetic reset', () => {
  test('user story: compile entity persists unique card id and returns to dex', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navForge).click();
    await expect(page.getByTestId(fixtures.selectors.viewForge)).toBeVisible();

    const nameInput = page
      .getByTestId(fixtures.selectors.viewForge)
      .locator('input[type="text"]')
      .first();
    await nameInput.fill('Compiled Specter');

    await page.getByTestId(fixtures.selectors.compile).click();
    await expect(page.getByTestId(fixtures.selectors.viewDex)).toBeVisible();

    const stored = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }, fixtures.storageKey);

    expect(stored).toBeTruthy();
    const activeDeck = stored.decks.find(
      (d: { id: string }) => d.id === stored.activeDeckId,
    );
    const ids = activeDeck.cards.map((c: { id: string }) => c.id);
    expect(new Set(ids).size).toBe(ids.length);

    const compiled = activeDeck.cards.find(
      (c: { name: string }) => c.name === 'Compiled Specter',
    );
    expect(compiled).toBeTruthy();
    expect(compiled.id).not.toBe('018');
    expect(compiled.id).not.toBe('019');
  });

  test('user story: cosmetic overrides reset after compile when returning to forge', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navForge).click();

    await page.getByTestId(fixtures.selectors.frame).selectOption('neonGlow');
    await page.getByTestId(fixtures.selectors.hat).selectOption('cyberCrown');
    await page.getByTestId(fixtures.selectors.rarity).selectOption('ultra-rare');
    await page.getByTestId(fixtures.selectors.ability).selectOption('overdrive');

    await page.getByTestId(fixtures.selectors.compile).click();
    await page.getByTestId(fixtures.selectors.navForge).click();

    await expect(page.getByTestId(fixtures.selectors.frame)).toHaveValue(
      fixtures.resetCosmeticValues.frame,
    );
    await expect(page.getByTestId(fixtures.selectors.hat)).toHaveValue(
      fixtures.resetCosmeticValues.hat,
    );
    await expect(page.getByTestId(fixtures.selectors.rarity)).toHaveValue(
      fixtures.resetCosmeticValues.rarity,
    );
    await expect(page.getByTestId(fixtures.selectors.ability)).toHaveValue(
      fixtures.resetCosmeticValues.ability,
    );
  });

  test('rapid double compile does not produce duplicate card ids', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navForge).click();

    const compile = page.getByTestId(fixtures.selectors.compile);
    await compile.click();
    await page.getByTestId(fixtures.selectors.navForge).click();
    await compile.click();

    const ids = await page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      const parsed = raw ? JSON.parse(raw) : null;
      const deck = parsed.decks.find(
        (d: { id: string }) => d.id === parsed.activeDeckId,
      );
      return deck.cards.map((c: { id: string }) => c.id);
    }, fixtures.storageKey);

    expect(new Set(ids).size).toBe(ids.length);
  });
});
