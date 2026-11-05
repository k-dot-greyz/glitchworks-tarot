import { test, expect } from '@playwright/test';

/**
 * Fresh-load UX for canonical default deck (PR #25 / #36).
 * Selectors from docs/TESTIDS.md; card anchors from DefaultDeckHarness defaults.
 */
class DefaultDeckE2EFixtures {
  readonly selectors;
  readonly anchorCards;
  readonly contaminationPatterns;
  readonly storageKey;

  constructor(options: {
    selectors?: Record<string, string>;
    anchorCards?: Record<string, { name: string; sub: string }>;
    contaminationPatterns?: RegExp[];
    storageKey?: string;
  } = {}) {
    this.selectors = {
      root: options.selectors?.root ?? 'aether-root',
      viewDex: options.selectors?.viewDex ?? 'aether-view-dex',
      modalCard: options.selectors?.modalCard ?? 'aether-modal-card',
      modalClose: options.selectors?.modalClose ?? 'aether-modal-card-close',
      navArena: options.selectors?.navArena ?? 'aether-nav-arena',
      viewArena: options.selectors?.viewArena ?? 'aether-view-arena',
    };

    this.anchorCards = {
      fool: options.anchorCards?.fool ?? {
        name: 'The Fool',
        sub: 'Infinite Potential',
      },
      glitch: options.anchorCards?.glitch ?? {
        name: 'The Glitch',
        sub: 'Anomaly',
      },
    };

    this.contaminationPatterns = options.contaminationPatterns ?? [
      /last\.?fm/i,
      /scrobble/i,
      /^Sync:/i,
    ];

    this.storageKey = options.storageKey ?? 'aether-decks';
  }
}

const fixtures = new DefaultDeckE2EFixtures();

test.describe('Default deck — canonical UX (no external overlay)', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript((key) => {
      localStorage.removeItem(key);
    }, fixtures.storageKey);
  });

  test('user story P0: fresh load shows canonical Fool without Last.fm overlay', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();
    await expect(page.getByTestId(fixtures.selectors.viewDex)).toBeVisible();

    const foolHeading = page.getByRole('heading', {
      name: fixtures.anchorCards.fool.name,
      exact: true,
    });
    await expect(foolHeading).toBeVisible();

    await foolHeading.click();
    const modal = page.getByTestId(fixtures.selectors.modalCard);
    await expect(modal).toBeVisible();
    await expect(modal.getByText(fixtures.anchorCards.fool.sub)).toBeVisible();

    const modalText = await modal.textContent();
    for (const pattern of fixtures.contaminationPatterns) {
      expect(modalText ?? '').not.toMatch(pattern);
    }

    await page.getByTestId(fixtures.selectors.modalClose).click();
    await expect(modal).toHaveCount(0);
  });

  test('user story P1: canonical Glitch card present in dex grid', async ({ page }) => {
    await page.goto('/');
    await expect(
      page.getByRole('heading', {
        name: fixtures.anchorCards.glitch.name,
        exact: true,
      }),
    ).toBeVisible();
  });

  test('user story P1: arena bench lists shipped cards from default deck', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navArena).click();
    const arena = page.getByTestId(fixtures.selectors.viewArena);
    await expect(arena).toBeVisible();
    await expect(
      arena.getByRole('heading', { name: fixtures.anchorCards.fool.name, exact: true }),
    ).toBeVisible();
    await expect(
      arena.getByRole('heading', {
        name: fixtures.anchorCards.glitch.name,
        exact: true,
      }),
    ).toBeVisible();
  });
});
