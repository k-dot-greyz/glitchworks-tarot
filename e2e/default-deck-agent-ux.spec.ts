import { test, expect } from '@playwright/test';

/**
 * Canonical default deck UX + persistence boundary (PR #25 restoration, PR #34 deps).
 * Selectors and hosts come from playwright.config.ts / docs/TESTIDS.md.
 */
class DefaultDeckE2EFixtures {
  readonly selectors;
  readonly anchorCards;
  readonly storageKeys;
  readonly expectedTelemetryErrors;

  constructor(options: {
    selectors?: Record<string, string>;
    anchorCards?: Record<string, string>;
    storageKeys?: Record<string, string>;
    expectedTelemetryErrors?: string[];
  } = {}) {
    this.selectors = {
      root: options.selectors?.root ?? 'aether-root',
      viewDex: options.selectors?.viewDex ?? 'aether-view-dex',
      navForge: options.selectors?.navForge ?? 'aether-nav-forge',
      forgeCompile: options.selectors?.forgeCompile ?? 'aether-forge-compile',
      deckSelect: options.selectors?.deckSelect ?? 'aether-deck-select',
    };

    this.anchorCards = {
      fool: options.anchorCards?.fool ?? 'The Fool',
      glitch: options.anchorCards?.glitch ?? 'The Glitch',
    };

    this.storageKeys = {
      multiDeck: options.storageKeys?.multiDeck ?? 'aether-decks',
      legacyDeck: options.storageKeys?.legacyDeck ?? 'aether-deck',
    };

    this.expectedTelemetryErrors =
      options.expectedTelemetryErrors ?? [
        'Failed to load resource: the server responded with a status of 404',
      ];
  }
}

const fixtures = new DefaultDeckE2EFixtures();

test.describe('Default deck — canonical UX and persistence boundary', () => {
  test('user story P0: fresh load renders canonical shipped deck cards', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();
    await expect(page.getByTestId(fixtures.selectors.viewDex)).toBeVisible();
    await expect(
      page.getByText(fixtures.anchorCards.fool, { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText(fixtures.anchorCards.glitch, { exact: true }),
    ).toBeVisible();
  });

  test('user story P1: legacy single-deck storage hydrates without white-screen', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ legacyKey, multiKey }) => {
        localStorage.removeItem(multiKey);
        localStorage.setItem(
          legacyKey,
          JSON.stringify([
            {
              id: '000',
              name: 'The Fool',
              sub: 'Infinite Potential',
              type: 'void',
              stats: { atk: 10, def: 10, spd: 90 },
              desc: 'A blank slate. Beginning of a journey.',
            },
          ]),
        );
      },
      {
        legacyKey: fixtures.storageKeys.legacyDeck,
        multiKey: fixtures.storageKeys.multiDeck,
      },
    );

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();
    await expect(
      page.getByText(fixtures.anchorCards.fool, { exact: true }),
    ).toBeVisible();

    const unexpected = errors.filter(
      (text) =>
        !fixtures.expectedTelemetryErrors.some((allowed) =>
          text.includes(allowed),
        ),
    );
    expect(unexpected, `unexpected console errors:\n${unexpected.join('\n')}`).toHaveLength(
      0,
    );
  });

  test('user story P1: forge compile on default deck avoids id collision with The Glitch', async ({
    page,
  }) => {
    await page.goto('/');
    await page.getByTestId(fixtures.selectors.navForge).click();
    await page.getByTestId(fixtures.selectors.forgeCompile).click();

    const ids = await page.evaluate((storageKey) => {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return [];
      const state = JSON.parse(raw) as {
        activeDeckId: string;
        decks: Array<{ id: string; cards: Array<{ id: string }> }>;
      };
      const active = state.decks.find((deck) => deck.id === state.activeDeckId);
      return (active ?? state.decks[0]).cards.map((card) => card.id);
    }, fixtures.storageKeys.multiDeck);

    expect(ids).toContain('404');
    expect(new Set(ids).size).toBe(ids.length);
    expect(ids[ids.length - 1]).not.toBe('404');
    expect(ids[ids.length - 1]).not.toBe('018');
    expect(ids[ids.length - 1]).not.toBe('019');
  });

  test('user story P2: default deck selector remains on canonical deck after reload', async ({
    page,
  }) => {
    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.deckSelect)).toHaveValue(
      'default',
    );

    await page.reload();
    await expect(page.getByTestId(fixtures.selectors.deckSelect)).toHaveValue(
      'default',
    );
    await expect(
      page.getByText(fixtures.anchorCards.fool, { exact: true }),
    ).toBeVisible();
  });
});
