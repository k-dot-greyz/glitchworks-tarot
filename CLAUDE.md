# CLAUDE.md

Guidance for AI assistants (Claude Code and others) working in this repository.

## What this is

**glitchworks-tarot** ("Aether Deck") — a dark-mode, cyber-mystic card UI with four views:
**Dex** (card library), **Arena** (1v1/multiplayer clash), **Oracle** (tarot-style spreads), **Forge**
(custom card builder). Stack: React 18 + Vite 5 + Tailwind CSS v4 + lucide-react, packaged for
Android via Capacitor 8.

Read [`README.md`](README.md) for the product pitch and [`CONTRIBUTING.md`](CONTRIBUTING.md) for the
full fork-and-PR workflow and the GlitchWorks Agnostic Architecture Protocol (GW-AAP) — that document
is long-form and authoritative; this file is the short-form map for AI agents.

## Commands

```bash
npm ci --legacy-peer-deps   # install (ESLint 10 vs plugin peer-dep mismatch — always use this flag)
npm run dev                 # Vite dev server → http://localhost:5173
npm run build                # production bundle → build/
npm run preview              # serve build/ → http://localhost:4173
npm run lint                  # ESLint over src/
npm run test                  # Vitest once (CI adds --coverage)
npm run test:watch            # Vitest watch mode
npm run test:e2e              # Playwright, against a built preview on 127.0.0.1:4173
npm run test:e2e:ui           # Playwright UI mode
```

Before opening a PR, match CI: `lint` → `test -- --coverage` → `build` → `test:e2e` (see
`.github/workflows/ci-cd.yml`). First-time Playwright setup needs `npx playwright install chromium`.

## Repository layout

```
src/
  App.jsx                 # Single-file shell: all 4 views, nav, modals, drag-and-drop
  dynamic_deck.json        # Default/fallback card data shipped with the app
  domain/                  # Pure functions — no React, no I/O, no globals
    deckState.js            # hydrate/dehydrate deck, forgeCard (new-card ID gen), drawSpread (Fisher-Yates)
    deckValidation.js        # validateCard / validateDeck / parseStoredDeck (Result-style {ok, ...})
    battleEngine.js           # resolveBattleWithEngine + arenaModes (standard/speedBlitz/suddenDeath/combatDisabled)
    rulesets.js                # TCG-layout definitions (standard/mtg/yugioh/pokemon): zones, banlists, calculateScore
    elemental.js                # ELEMENTAL_ADVANTAGE matrix + getTypeColor
  adapters/                 # Swappable I/O behind small factory functions
    deckStorage.js            # createDeckStorage({getItem,setItem,removeItem}) — generic wrapper, catches + returns {ok}
    localStorageDeckStorage.js # createLocalStorageDeckStorage() — browser localStorage impl
    memoryDeckStorage.js        # in-memory impl, used in tests
    consoleTelemetry.js          # createConsoleTelemetry() — structured console.log/warn/error
  hooks/
    usePersistedDeck.js       # multi-deck state machine: load/migrate, persist, switch/create/duplicate/rename/delete, compileForgeCard
  components/
    Card.jsx                  # The card itself: flip animation, deck-back skins, frames, hats, rarity, ability text
    GlitchStyles.jsx            # Injected CSS for glitch/CRT/noise effects (keyframes, overlays)
    NeonSlider.jsx               # Styled range input used by Settings and Forge stat sliders
  config/aetherConfig.js     # storageKey + schemaVersion (single-deck legacy key, used for migration)
  setupTests.js               # jest-dom setup for Vitest
e2e/app.spec.ts              # Playwright specs against the production-like preview build
docs/
  SPEC.md                     # Pointer to the canonical product spec (lives in dev-master, not vendored here)
  TESTING.md                   # Testing methodology, layers, commands
  TESTIDS.md                    # data-testid naming convention + current ID table — keep in sync with App.jsx
  AETHER_RAM.ipynb               # Agent/session scratch notes (allowed to live in this repo, app-specific only)
android/                      # Capacitor Android project (Gradle) — do not commit keystores/signing secrets
context-chunks/               # Deck/context chunking helper scripts (excluded from lint + coverage globs)
mcp-server/, n8n/, linear/     # Integration configs (MCP server launcher, Slack sync workflow, Linear config)
```

`App.jsx` is intentionally a single large component for now. `docs/TESTIDS.md` explicitly calls out
that when it eventually gets split into per-view files, the existing `data-testid` values must move
with their nodes unchanged.

## Architecture conventions (GW-AAP)

This codebase follows a deliberate "agnostic pipeline" discipline (full rationale in
`CONTRIBUTING.md` §2). The short version, in priority order:

1. **Domain is pure.** Everything in `src/domain/` takes plain data in, returns plain data out — no
   `localStorage`, no DOM, no React. This is what makes it trivially testable and reusable for new
   rulesets/modes.
2. **I/O goes through adapters.** Storage and telemetry are factory functions injected into hooks/
   components (see `App({ storage, telemetry })` and `usePersistedDeck(storage, telemetry, ...)`).
   Tests use `memoryDeckStorage` instead of real `localStorage`. When adding a new persistence or
   logging backend, add an adapter with the same shape rather than calling browser/native APIs
   directly from components.
3. **Boundary validation.** Anything coming from outside the app's own state (imported JSON,
   `localStorage` contents, file uploads) is validated via `deckValidation.js` before it touches
   app state. `parseStoredDeck` returns `{ ok, value }` or `{ ok: false, code, message }` — follow
   that pattern for new boundary parsers instead of throwing.
4. **Rulesets and arena modes are data, not branches.** Adding a new TCG layout means adding an
   entry to `rulesets.js` (zones, `clashSlots`, `bannedCardIds`, `calculateScore`); adding a new
   combat variant means adding an entry to `arenaModes` in `battleEngine.js` (`applyBase` /
   `applyElemental` modifiers). Avoid hardcoding ruleset-specific `if` chains in `App.jsx`.
5. **Capacitor is optional.** Gate native-only calls with `Capacitor.isNativePlatform()` (see the
   `StatusBar` effect in `App.jsx`); the web build must keep working with no Android shell present.
6. **Graceful degradation.** Storage/telemetry failures should surface as logged warnings (see
   `usePersistedDeck`'s `DECKS_SAVE_QUOTA_EXCEEDED` handling) — never crash the shell.

## Key domain mechanics

- **Battle scoring**: `resolveBattleWithEngine(p1, p2, modeId, rulesetId)` in `battleEngine.js`.
  Non-`standard` rulesets use their own `calculateScore`; `standard` ruleset defers to the arena
  mode's `applyBase`/`applyElemental` modifiers, then elemental advantage (`elemental.js`) is
  applied, then card `ability` (`overdrive`, `ironWall`, `voidShield`) adjusts the result. Read this
  function fully before changing combat math — the order of operations (base → ability → elemental
  → ability override → aggregate) is significant.
- **Deck persistence/migration**: `usePersistedDeck` first looks for the new multi-deck shape
  (`{ activeDeckId, decks: [...] }` under key `"aether-decks"`), and falls back to migrating a
  legacy single-deck blob at `aetherConfig.storageKey` (`"aether-deck"`). If you change the deck
  schema, add a migration path here rather than dropping old data.
- **Card schema** (validated by `deckValidation.validateCard`): `id` (string), `name`, `sub`, `type`
  (string), `stats: { atk, def, spd }` (numbers), `desc` (string). Optional cosmetic fields used by
  `Card.jsx`/`App.jsx` forge form: `image`, `icon`, `customImage`, `hideStats`, `hideDesc`, `frame`,
  `hat`, `rarity`, `ability`, `deckBack`.
- **Spread drawing**: `drawSpread(deck, countOrRng, rng)` in `deckState.js` uses Fisher-Yates
  shuffle — note the historical fix (see git log: "replace biased sort shuffle with Fisher-Yates").

## Testing

- **Unit/component**: Vitest + Testing Library + `jest-dom`, config in `vitest.config.js`
  (`environment: jsdom`, coverage via v8 over `src/**/*.{js,jsx}`). Domain modules have dedicated
  `*.test.js` files (`battle.test.js`, `battleEngine.test.js`, `deckState.test.js`,
  `deckValidation.test.js`, `deckStorage.test.js`); `App.test.jsx` covers integration-level RTL
  behavior (nav switching, modals, oracle draw).
- **E2E**: Playwright (`playwright.config.ts`), runs against a built `vite preview` on
  `127.0.0.1:4173`. CI builds first and only runs `preview` for the webServer; locally it builds AND
  previews. Specs live in `e2e/*.spec.ts`.
- **Selectors**: stable `data-testid="aether-<area>-<element>"` hooks — see `docs/TESTIDS.md` for the
  authoritative table. Update that table whenever you add/remove a `data-testid` in `App.jsx`. Don't
  add IDs to every wrapper — only nav, modals, primary actions, and key view roots.
- Run `npm run lint && npm run test && npm run build && npm run test:e2e` before considering a change
  done — this mirrors CI exactly.

## Commit & PR conventions

- **Conventional Commits**, enforced by Husky + Commitlint (`.commitlintrc.yaml`): header format
  `type(scope): subject`, types limited to `build|chore|ci|docs|feat|fix|perf|refactor|revert|style|test`,
  lower-case type, max 100-char header, non-empty subject.
- Branch prefixes: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.
- No redundant comments — comment only the non-obvious *why*, matching this repo's existing style
  (functional components/hooks, Tailwind utilities inline, CSS variables for glitch/CRT intensity).

## Critical boundary rule — read before touching docs or config

This repo is consumed as a **git submodule** inside a parent `dev-master` monorepo. Confusingly, the
reverse link also exists locally: `.gitmodules` in *this* repo registers `dev-master` as a submodule
path here too, for local zenOS/agent tooling. Don't conflate the two — per `CONTRIBUTING.md` §1:

- **Never commit** monorepo-specific SOPs, zenOS agent session notes, fork-runbook docs, or
  `dev-master`-only configuration into this repository.
- **Allowed here**: `README.md`, `CONTRIBUTING.md`, `docs/*.md` describing Aether Deck product
  behavior, and JSON/YAML under `src/`, `n8n/`, `linear/`, `mcp-server/` that ships actual product
  or integration behavior.
- If you (or a task) generate monorepo-specific guidance, it belongs in
  `dev-master/dex/03-docs/guides/`, not here.
- Before committing, sanity-check `git status` / `git diff --name-status` for anything that looks
  like it leaked from a parent workspace, and never commit `node_modules/`, `build/`, coverage HTML,
  Playwright traces, or `.env`/keystore secrets.

## CI/CD

GitHub Actions (`.github/workflows/ci-cd.yml`): `build` job (lint → test+coverage → vite build →
upload artifact) → `e2e` job (download artifact, Playwright Chromium) → `deploy` job (rsync to a
configured host, gated to `push` on `main`/`master` and only if `DEPLOY_HOST` secret is set). A
second workflow watches for `dev-master` updates via `repository_dispatch` and opens a
`chore/bump-dev-master` PR automatically — don't hand-edit submodule pointers that workflow manages.
