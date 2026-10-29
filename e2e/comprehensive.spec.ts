import { test, expect, type Page } from '@playwright/test';

/**
 * Comprehensive E2E — all Aether / Glitchworks Tarot features.
 *
 * Coverage:
 *   Shell & navigation
 *   Settings modal
 *   Dex: card modal, deck select
 *   Oracle: draw, layout switch, spam resistance
 *   Forge: entity create + compile
 *   Arena: clash disabled, rulesets, banlist, flush, combat-disabled, LP
 *   Yu-Gi-Oh! Duel MVP: 3 rounds → Exodia lethal → DUEL OVER
 */

const sel = {
  root: 'aether-root',
  navDex: 'aether-nav-dex',
  navArena: 'aether-nav-arena',
  navOracle: 'aether-nav-oracle',
  navForge: 'aether-nav-forge',
  viewDex: 'aether-view-dex',
  viewArena: 'aether-view-arena',
  viewOracle: 'aether-view-oracle',
  viewForge: 'aether-view-forge',
  settingsOpen: 'aether-settings-open-desktop',
  settingsClose: 'aether-settings-close',
  modalSettings: 'aether-modal-settings',
  modalCard: 'aether-modal-card',
  modalCardClose: 'aether-modal-card-close',
  deckSelect: 'aether-deck-select',
  oracleDraw: 'aether-oracle-draw',
  oracleLayout: 'aether-oracle-layout-select',
  forgeCompile: 'aether-forge-compile',
  arenaLog: 'aether-arena-log',
  arenaClash: 'aether-arena-clash',
  arenaFlush: 'aether-arena-flush',
  arenaRuleset: 'aether-arena-ruleset-select',
  arenaMode: 'aether-arena-mode-select',
  lpP1: 'aether-arena-lp-p1',
  lpP2: 'aether-arena-lp-p2',
  duelOver: 'aether-arena-duel-over',
};

async function clickBenchCard(page: Page, name: string) {
  await page
    .getByTestId(sel.viewArena)
    .getByRole('heading', { name, exact: true })
    .evaluate((el) => {
      const root = el.closest('.cursor-pointer');
      (root instanceof HTMLElement ? root : el).click();
    });
}

async function resolveClash(page: Page, pattern: RegExp) {
  const clash = page.getByTestId(sel.arenaClash);
  await expect(clash).toBeEnabled();
  await clash.click();
  await expect(page.getByTestId(sel.arenaLog)).toHaveText(pattern, { timeout: 4000 });
  await page.waitForTimeout(200);
}

async function flushArena(page: Page) {
  await page.waitForTimeout(300);
  await page.getByRole('button', { name: /flush_memory/i }).evaluate((el) => (el as HTMLElement).click());
  await expect(page.getByTestId(sel.arenaLog)).toHaveText(/ARENA WIPED/i);
  await expect(page.getByTestId(sel.arenaClash)).toBeDisabled();
}

// ─────────────────────────────────────────────────────────────
test.describe('Shell & navigation', () => {
  test('loads root and default dex view', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId(sel.root)).toBeVisible();
    await expect(page.getByTestId(sel.viewDex)).toBeVisible();
  });

  test('nav switches all four views', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await expect(page.getByTestId(sel.viewArena)).toBeVisible();
    await page.getByTestId(sel.navOracle).click();
    await expect(page.getByTestId(sel.viewOracle)).toBeVisible();
    await page.getByTestId(sel.navForge).click();
    await expect(page.getByTestId(sel.viewForge)).toBeVisible();
    await page.getByTestId(sel.navDex).click();
    await expect(page.getByTestId(sel.viewDex)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
test.describe('Settings', () => {
  test('modal opens and closes', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.settingsOpen).click();
    await expect(page.getByTestId(sel.modalSettings)).toBeVisible();
    await page.getByTestId(sel.settingsClose).click();
    await expect(page.getByTestId(sel.modalSettings)).toHaveCount(0);
  });
});

// ─────────────────────────────────────────────────────────────
test.describe('Dex', () => {
  test('opens and closes card modal', async ({ page }) => {
    await page.goto('/');
    await page.getByText('The Fool').click();
    await expect(page.getByTestId(sel.modalCard)).toBeVisible();
    await page.getByTestId(sel.modalCardClose).click();
    await expect(page.getByTestId(sel.modalCard)).toHaveCount(0);
  });

  test('deck select is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId(sel.deckSelect)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
test.describe('Oracle', () => {
  test('draw shows three-card spread labels', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navOracle).click();
    await page.getByTestId(sel.oracleDraw).click();
    await expect(page.getByText('T-Minus (Past)')).toBeVisible();
    await expect(page.getByText('T-Zero (Present)')).toBeVisible();
    await expect(page.getByText('T-Plus (Future)')).toBeVisible();
  });

  test('layout switch clears spread', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navOracle).click();
    await page.getByTestId(sel.oracleDraw).click();
    await expect(page.getByText('T-Minus (Past)')).toBeVisible();
    await page.getByTestId(sel.oracleLayout).selectOption('celticCross');
    await expect(page.getByText('T-Minus (Past)')).toHaveCount(0);
  });

  test('double-click spam does not break UI', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navOracle).click();
    await page.getByTestId(sel.oracleDraw).dblclick();
    await expect(page.getByTestId(sel.viewOracle)).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
test.describe('Forge', () => {
  test('creates and compiles an entity that appears in Dex', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navForge).click();
    await expect(page.getByTestId(sel.viewForge)).toBeVisible();
    await expect(page.getByRole('heading', { name: /the forge/i })).toBeVisible();

    const inputs = page.locator('[data-testid="aether-view-forge"] input[type="text"]');
    await inputs.nth(0).fill('Neon Leap');
    await inputs.nth(1).fill('Overdrive Entry');

    const selects = page.locator('[data-testid="aether-view-forge"] select');
    await selects.nth(0).selectOption('wind');

    const lore = page.locator('[data-testid="aether-view-forge"] textarea, [data-testid="aether-view-forge"] input[type="text"]').last();
    await lore.fill('Mid-air parkour strike.');

    await page.getByTestId(sel.forgeCompile).click();
    await page.getByTestId(sel.navDex).click();
    await expect(page.getByText('Neon Leap')).toBeVisible();
  });
});

// ─────────────────────────────────────────────────────────────
test.describe('Arena — core', () => {
  test('clash disabled with empty slots', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await expect(page.getByTestId(sel.arenaClash)).toBeDisabled();
  });

  test('place two cards and resolve standard clash', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await clickBenchCard(page, 'The Fool');
    await clickBenchCard(page, 'High Priestess');
    await resolveClash(page, /OVERWRITES|EQUILIBRIUM|DATA COLLISION/i);
  });

  test('flush resets slots', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await clickBenchCard(page, 'The Fool');
    await flushArena(page);
  });

  test('ruleset switch shows yugioh and mtg zones', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await page.getByTestId(sel.arenaRuleset).selectOption('mtg');
    await expect(page.getByText('P1 Battlefield')).toBeVisible();
    await page.getByTestId(sel.arenaRuleset).selectOption('yugioh');
    await expect(page.getByText('P1 Monster Zone')).toBeVisible();
    await expect(page.getByText('Shadow Realm')).toBeVisible();
  });

  test('mtg banlist blocks banned card', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await page.getByTestId(sel.arenaRuleset).selectOption('mtg');
    await clickBenchCard(page, 'The Magician'); // id 001 is banned in mtg
    await expect(page.getByTestId(sel.arenaLog)).toHaveText(/BANNED/i);
  });

  test('combat disabled keeps clash inert', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await page.getByTestId(sel.arenaMode).selectOption('combatDisabled');
    await clickBenchCard(page, 'The Fool');
    await clickBenchCard(page, 'High Priestess');
    await expect(page.getByTestId(sel.arenaClash)).toBeDisabled();
  });
});

// ─────────────────────────────────────────────────────────────
test.describe('Yu-Gi-Oh! Duel MVP', () => {
  test('three rounds end with Exodia lethal and P2 LP 0', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId(sel.navArena).click();
    await page.getByTestId(sel.arenaRuleset).selectOption('yugioh');

    await expect(page.getByText('P1 Monster Zone')).toBeVisible();
    await expect(page.getByTestId(sel.lpP1)).toHaveText(/8000/);
    await expect(page.getByTestId(sel.lpP2)).toHaveText(/8000/);
    await expect(page.getByTestId(sel.arenaClash)).toBeDisabled();

    // Round 1
    await clickBenchCard(page, 'The Magician');
    await expect(page.getByTestId(sel.arenaLog)).toHaveText(/MONSTER_P1 FILLED/i);
    await clickBenchCard(page, 'The Fool');
    await expect(page.getByTestId(sel.arenaLog)).toHaveText(/MONSTER_P2 FILLED/i);
    await resolveClash(page, /OVERWRITES|EQUILIBRIUM/i);

    // Round 2
    await flushArena(page);
    await clickBenchCard(page, 'The Chariot');
    await clickBenchCard(page, 'High Priestess');
    await resolveClash(page, /OVERWRITES|EQUILIBRIUM/i);

    // Round 3 — Exodia proxy
    await flushArena(page);
    await clickBenchCard(page, 'The Glitch');
    await clickBenchCard(page, 'The Fool');
    await resolveClash(page, /THE GLITCH OVERWRITES THE FOOL.*EXODIA LETHAL.*PLAYER B.*LP 0/i);

    await expect(page.getByTestId(sel.lpP2)).toHaveText('P2 LP 0');
    await expect(page.getByTestId(sel.duelOver)).toBeVisible();
    const log = await page.getByTestId(sel.arenaLog).innerText();
    expect(log).toMatch(/EXODIA LETHAL/);
    expect(log).toMatch(/DUEL OVER/);
  });
});
