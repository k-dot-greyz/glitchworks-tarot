import { test, expect, type Page } from '@playwright/test';

/**
 * Arena UX + boundary scenarios (rulesets, banlist, clash resolution, hostile storage).
 * Selectors and baseURL come from playwright.config.ts / docs/TESTIDS.md — no hardcoded hosts.
 */
class ArenaE2EFixtures {
  readonly selectors;
  readonly cardNames;
  readonly rulesetIds;
  readonly arenaModes;
  readonly storageKey;

  constructor(options: {
    selectors?: Record<string, string>;
    cardNames?: Record<string, string>;
    rulesetIds?: Record<string, string>;
    arenaModes?: Record<string, string>;
    storageKey?: string;
  } = {}) {
    this.selectors = {
      root: options.selectors?.root ?? 'aether-root',
      navArena: options.selectors?.navArena ?? 'aether-nav-arena',
      viewArena: options.selectors?.viewArena ?? 'aether-view-arena',
      rulesetSelect: options.selectors?.rulesetSelect ?? 'aether-arena-ruleset-select',
      modeSelect: options.selectors?.modeSelect ?? 'aether-arena-mode-select',
      clash: options.selectors?.clash ?? 'aether-arena-clash',
      flush: options.selectors?.flush ?? 'aether-arena-flush',
      log: options.selectors?.log ?? 'aether-arena-log',
    };

    this.cardNames = {
      fool: options.cardNames?.fool ?? 'The Fool',
      priestess: options.cardNames?.priestess ?? 'High Priestess',
      magician: options.cardNames?.magician ?? 'The Magician',
    };

    this.rulesetIds = {
      standard: options.rulesetIds?.standard ?? 'standard',
      mtg: options.rulesetIds?.mtg ?? 'mtg',
      yugioh: options.rulesetIds?.yugioh ?? 'yugioh',
    };

    this.arenaModes = {
      combatDisabled: options.arenaModes?.combatDisabled ?? 'combatDisabled',
    };

    this.storageKey = options.storageKey ?? 'aether-decks';
  }

  async clickBenchCard(page: Page, cardName: string) {
    const benchCard = page
      .getByTestId(this.selectors.viewArena)
      .locator('div.cursor-grab:not(.pointer-events-none)')
      .filter({ hasText: cardName });
    await benchCard.first().click();
  }

  collectUnexpectedConsoleErrors(page: Page, errors: string[]) {
    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (text.includes('[AETHER_TELEMETRY]')) return;
      if (text.includes('Failed to load resource')) return;
      errors.push(text);
    });
  }
}

const fixtures = new ArenaE2EFixtures();

test.describe('Arena — rulesets, clash, and hostile storage', () => {
  test('user story: place two cards and resolve a standard clash', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navArena).click();
    await expect(page.getByTestId(fixtures.selectors.viewArena)).toBeVisible();

    await fixtures.clickBenchCard(page, fixtures.cardNames.fool);
    await fixtures.clickBenchCard(page, fixtures.cardNames.priestess);

    const clash = page.getByTestId(fixtures.selectors.clash);
    await expect(clash).toBeEnabled();
    await clash.click();

    const log = page.getByTestId(fixtures.selectors.log);
    await expect(log).toHaveText(/DATA COLLISION|OVERWRITES|EQUILIBRIUM/i, {
      timeout: 3000,
    });
  });

  test('ruleset switch reinitializes playmat and enables clash only with valid slots', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navArena).click();

    await page.getByTestId(fixtures.selectors.rulesetSelect).selectOption(
      fixtures.rulesetIds.mtg,
    );
    await expect(page.getByText('P1 Battlefield')).toBeVisible();
    await expect(page.getByTestId(fixtures.selectors.clash)).toBeDisabled();

    await page.getByTestId(fixtures.selectors.rulesetSelect).selectOption(
      fixtures.rulesetIds.yugioh,
    );
    await expect(page.getByText('P1 Monster Zone')).toBeVisible();
    await expect(page.getByText('Shadow Realm')).toBeVisible();
  });

  test('mtg banlist blocks banned card at arena boundary', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navArena).click();
    await page.getByTestId(fixtures.selectors.rulesetSelect).selectOption(
      fixtures.rulesetIds.mtg,
    );

    await fixtures.clickBenchCard(page, fixtures.cardNames.magician);
    await expect(page.getByTestId(fixtures.selectors.log)).toHaveText(
      /BANNED IN MTG BATTLEFIELD/i,
    );
    await expect(page.getByTestId(fixtures.selectors.clash)).toBeDisabled();
  });

  test('flush resets arena slots after card placement', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navArena).click();

    await fixtures.clickBenchCard(page, fixtures.cardNames.fool);
    await page.getByTestId(fixtures.selectors.flush).click();
    await expect(page.getByTestId(fixtures.selectors.log)).toHaveText(/ARENA WIPED/i);
    await expect(page.getByTestId(fixtures.selectors.clash)).toBeDisabled();
  });

  test('malformed localStorage does not white-screen the shell', async ({ page }) => {
    await page.addInitScript((storageKey) => {
      localStorage.setItem(storageKey, '{"decks":[broken json');
    }, fixtures.storageKey);

    const errors: string[] = [];
    fixtures.collectUnexpectedConsoleErrors(page, errors);

    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();

    const stored = await page.evaluate((key) => localStorage.getItem(key), fixtures.storageKey);
    if (stored !== null) {
      await page.evaluate((raw) => {
        JSON.parse(raw as string);
      }, stored);
    }

    expect(errors, `console errors: ${errors.join('\n')}`).toHaveLength(0);
  });

  test('combat disabled mode keeps clash button inert', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navArena).click();
    await page.getByTestId(fixtures.selectors.modeSelect).selectOption(
      fixtures.arenaModes.combatDisabled,
    );
    await expect(page.getByTestId(fixtures.selectors.log)).toHaveText(
      /SYSTEMS IN HARMONY/i,
    );

    await fixtures.clickBenchCard(page, fixtures.cardNames.fool);
    await fixtures.clickBenchCard(page, fixtures.cardNames.priestess);

    const clash = page.getByTestId(fixtures.selectors.clash);
    await expect(clash).toBeDisabled();
    await expect(clash).toHaveText(/COMBAT DISABLED/i);
  });
});
