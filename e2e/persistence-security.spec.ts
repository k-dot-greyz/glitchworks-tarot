import { test, expect } from '@playwright/test';

/**
 * Persistence boundary UX — orphan activeDeckId, malformed deck entries, agentic storage payloads.
 * Selectors and storage keys are constructor-instantiated; no hardcoded hosts.
 */
class PersistenceE2EFixtures {
  readonly selectors;
  readonly storageKey;
  readonly deckIds;
  readonly expectedTelemetryErrors;

  constructor(options: {
    selectors?: Record<string, string>;
    storageKey?: string;
    deckIds?: Record<string, string>;
    expectedTelemetryErrors?: string[];
  } = {}) {
    this.selectors = {
      root: options.selectors?.root ?? 'aether-root',
      deckSelect: options.selectors?.deckSelect ?? 'aether-deck-select',
      navDex: options.selectors?.navDex ?? 'aether-nav-dex',
    };

    this.storageKey = options.storageKey ?? 'aether-decks';
    this.deckIds = {
      default: options.deckIds?.default ?? 'default',
      orphan: options.deckIds?.orphan ?? 'agentic-orphan-deck-id',
      recovered: options.deckIds?.recovered ?? 'recovered-shell',
    };

    this.expectedTelemetryErrors = options.expectedTelemetryErrors ?? [
      'Failed to load resource: the server responded with a status of 404',
    ];
  }

  validCard(id: string, name: string) {
    return {
      id,
      name,
      sub: 'Boundary card',
      type: 'void',
      stats: { atk: 10, def: 10, spd: 10 },
      desc: 'Persistence fixture card',
    };
  }

  orphanActiveDeckPayload() {
    return JSON.stringify({
      activeDeckId: this.deckIds.orphan,
      decks: [
        {
          id: this.deckIds.default,
          name: 'AETHER DECK',
          deckBack: 'standard',
          cards: [this.validCard('001', 'The Fool'), this.validCard('002', 'High Priestess')],
        },
      ],
    });
  }

  malformedDeckEntryPayload() {
    return JSON.stringify({
      activeDeckId: this.deckIds.default,
      decks: [
        {
          id: this.deckIds.default,
          name: 'AETHER DECK',
          deckBack: 'standard',
          cards: [this.validCard('001', 'The Fool')],
        },
        {
          id: this.deckIds.recovered,
          name: 'RECOVERED DECK',
          deckBack: 'standard',
        },
      ],
    });
  }
}

const fixtures = new PersistenceE2EFixtures();

test.describe('Persistence — orphan ids and malformed deck entries', () => {
  test('user story: orphan activeDeckId loads shell and normalizes deck selector', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ storageKey, payload }) => {
        localStorage.setItem(storageKey, payload);
      },
      { storageKey: fixtures.storageKey, payload: fixtures.orphanActiveDeckPayload() },
    );

    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();

    const deckSelect = page.getByTestId(fixtures.selectors.deckSelect);
    await expect(deckSelect).toBeVisible();
    await expect(deckSelect).toHaveValue(fixtures.deckIds.default);
    await expect(page.getByText('The Fool')).toBeVisible();
  });

  test('user story: malformed deck entry without cards array does not white-screen Dex', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ storageKey, payload }) => {
        localStorage.setItem(storageKey, payload);
      },
      { storageKey: fixtures.storageKey, payload: fixtures.malformedDeckEntryPayload() },
    );

    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto('/');
    await expect(page.getByTestId(fixtures.selectors.root)).toBeVisible();
    await expect(page.getByTestId(fixtures.selectors.navDex)).toBeVisible();
    await expect(page.getByText('The Fool')).toBeVisible();

    const unexpected = errors.filter(
      (text) =>
        !fixtures.expectedTelemetryErrors.some((allowed) => text.includes(allowed)),
    );
    expect(
      unexpected,
      `unexpected console errors: ${unexpected.join('\n')}`,
    ).toHaveLength(0);
  });

  test('user story: rename deck opens after orphan activeDeckId is normalized', async ({
    page,
  }) => {
    await page.addInitScript(
      ({ storageKey, payload }) => {
        localStorage.setItem(storageKey, payload);
      },
      { storageKey: fixtures.storageKey, payload: fixtures.orphanActiveDeckPayload() },
    );

    await page.goto('/');
    await page.getByTitle('Rename Deck').click();

    const nameInput = page.locator('input[type="text"]').first();
    await expect(nameInput).toBeVisible();
    await expect(nameInput).toHaveValue('AETHER DECK');
  });
});
