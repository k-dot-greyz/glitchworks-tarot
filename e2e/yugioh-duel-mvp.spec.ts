import { test, expect, type Page } from '@playwright/test';

/**
 * Yu-Gi-Oh! Duel MVP — start-to-finish model demo.
 *
 * The current Arena engine is a clash resolver (not a full LP / phase state machine).
 * This test drives the existing yugioh ruleset through a three-round sequence and
 * asserts the observable game states from start to finish:
 *
 *   1. Start  — enter Arena, select yugioh ruleset, zones + log ready
 *   2. Round 1 — Player A places, Player B places, resolve clash
 *   3. Round 2 — flush, each player places again, resolve
 *   4. Round 3 — Player A plays high-ATK "Exodia" proxy (The Glitch, ATK 99 → 198 under yugioh formula),
 *                Player B plays a low-ATK card, resolve → decisive overwrite (LP wipe proxy)
 *
 * A real LP counter + Exodia win condition would live in the domain layer;
 * this e2e locks the UI state transitions the current MVP already exposes.
 */

const selectors = {
  root: 'aether-root',
  navArena: 'aether-nav-arena',
  viewArena: 'aether-view-arena',
  rulesetSelect: 'aether-arena-ruleset-select',
  clash: 'aether-arena-clash',
  flush: 'aether-arena-flush',
  log: 'aether-arena-log',
  lpP1: 'aether-arena-lp-p1',
  lpP2: 'aether-arena-lp-p2',
  duelOver: 'aether-arena-duel-over',
};

async function clickBenchCard(page: Page, name: string) {
  await page
    .getByTestId(selectors.viewArena)
    .getByRole('heading', { name, exact: true })
    .evaluate((el) => {
      const cardRoot = el.closest('.cursor-pointer');
      (cardRoot instanceof HTMLElement ? cardRoot : el).click();
    });
}

async function resolveAndExpect(page: Page, pattern: RegExp) {
  const clash = page.getByTestId(selectors.clash);
  await expect(clash).toBeEnabled();
  await clash.click();
  // Wait for the final result — do NOT match the intermediate
  // "[ ERR: DATA COLLISION DETECTED ]" (isClashing is still true then).
  await expect(page.getByTestId(selectors.log)).toHaveText(pattern, { timeout: 4000 });
  // Give React a tick so isClashing=false is committed before flush.
  await page.waitForTimeout(200);
}

async function flushAndExpectWipe(page: Page) {
  await page.waitForTimeout(500);
  // Target by visible text to avoid any testid / coordinate ambiguity with the clash button.
  const flushBtn = page.getByRole('button', { name: /flush_memory/i });
  await expect(flushBtn).toBeVisible();
  await flushBtn.evaluate((el) => (el as HTMLElement).click());
  await expect(page.getByTestId(selectors.log)).toHaveText(/ARENA WIPED/i);
  await expect(page.getByTestId(selectors.clash)).toBeDisabled();
}

test.describe('Yu-Gi-Oh! Duel MVP — start to finish', () => {
  test('three-round duel ends with Player A Exodia-proxy overwrite of Player B', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    // ── START ──────────────────────────────────────────────
    await page.goto('/');
    await expect(page.getByTestId(selectors.root)).toBeVisible();
    await page.getByTestId(selectors.navArena).click();
    await expect(page.getByTestId(selectors.viewArena)).toBeVisible();

    // Select yugioh ruleset — zones materialize
    await page.getByTestId(selectors.rulesetSelect).selectOption('yugioh');
    await expect(page.getByText('P1 Monster Zone')).toBeVisible();
    await expect(page.getByText('P2 Monster Zone')).toBeVisible();
    await expect(page.getByText('Shadow Realm')).toBeVisible();
    await expect(page.getByTestId(selectors.clash)).toBeDisabled();
    // Starting LP
    await expect(page.getByTestId(selectors.lpP1)).toHaveText(/8000/);
    await expect(page.getByTestId(selectors.lpP2)).toHaveText(/8000/);

    // ── ROUND 1 ────────────────────────────────────────────
    // Player A (first empty clash slot = monster_p1) places Magician
    await clickBenchCard(page, 'The Magician');
    await expect(page.getByTestId(selectors.log)).toHaveText(/MONSTER_P1 FILLED/i);
    // Player B places Fool
    await clickBenchCard(page, 'The Fool');
    await expect(page.getByTestId(selectors.log)).toHaveText(/MONSTER_P2 FILLED/i);
    await resolveAndExpect(page, /OVERWRITES|EQUILIBRIUM/i);

    // ── ROUND 2 ────────────────────────────────────────────
    await flushAndExpectWipe(page);

    await clickBenchCard(page, 'The Chariot');
    await expect(page.getByTestId(selectors.log)).toHaveText(/MONSTER_P1 FILLED/i);
    await clickBenchCard(page, 'High Priestess');
    await expect(page.getByTestId(selectors.log)).toHaveText(/MONSTER_P2 FILLED/i);
    await resolveAndExpect(page, /OVERWRITES|EQUILIBRIUM/i);

    // ── ROUND 3 — Exodia proxy (The Glitch ATK 99 → 198 under yugioh ATK*2) vs low-ATK Fool
    await flushAndExpectWipe(page);

    // Player A plays Exodia proxy
    await clickBenchCard(page, 'The Glitch');
    await expect(page.getByTestId(selectors.log)).toHaveText(/MONSTER_P1 FILLED/i);
    // Player B places low-ATK card
    await clickBenchCard(page, 'The Fool');
    await expect(page.getByTestId(selectors.log)).toHaveText(/MONSTER_P2 FILLED/i);

    // Combat resolution — Player A (Glitch / Exodia proxy) overwrites Player B
    // Domain treats id '404' (The Glitch) as the demo Exodia proxy → lethal.
    await resolveAndExpect(
      page,
      /THE GLITCH OVERWRITES THE FOOL.*EXODIA LETHAL.*PLAYER B.*LP 0/i,
    );

    // ── END STATE ──────────────────────────────────────────
    await expect(page.getByTestId(selectors.lpP2)).toHaveText('P2 LP 0');
    await expect(page.getByTestId(selectors.duelOver)).toBeVisible();
    const finalLog = await page.getByTestId(selectors.log).innerText();
    expect(finalLog).toMatch(/THE GLITCH OVERWRITES THE FOOL/i);
    expect(finalLog).toMatch(/EXODIA LETHAL/i);
    expect(finalLog).toMatch(/DUEL OVER/i);

    // Filter sandbox 402 noise
    const realErrors = errors.filter(
      (e) => !e.startsWith('Failed to load resource: the server responded with a status of 402'),
    );
    expect(realErrors, `console errors: ${realErrors.join('\n')}`).toHaveLength(0);
  });
});
