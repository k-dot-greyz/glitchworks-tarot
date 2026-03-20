# Testing methodology (Metapod test shield)

## Layers

| Layer | Tool | What it guards |
|-------|------|----------------|
| **Unit / component** | Vitest + Testing Library + `jest-dom` | Default render, nav switching, modals, oracle draw — fast feedback in CI |
| **E2E** | Playwright (Chromium) | Real browser: navigation, settings, oracle, card modal, arena disabled state, double-click spam, no console errors on load |
| **Selectors** | `data-testid` | Stable hooks; convention: `aether-<area>-<element>` — see [`TESTIDS.md`](TESTIDS.md) |

## Commands

```bash
npm run lint          # ESLint (src/)
npm run test          # Vitest once, with coverage in CI
npm run test:watch    # Vitest watch mode (local)
npm run build         # Vite → build/
npm run test:e2e      # Playwright (starts preview; local config may build first — see playwright.config.ts)
npm run test:e2e:ui   # Playwright UI mode
```

**Playwright:** first-time setup may need `npx playwright install chromium`.

**CI:** `CI=true` uses preview-only web server after `build` (see `playwright.config.ts`). GitHub Actions runs `build` → artifact → `e2e` job.

## Where tests live

- `src/App.test.jsx` — RTL tests
- `src/setupTests.js` — `jest-dom` for Vitest
- `e2e/*.spec.ts` — Playwright specs
- `vitest.config.js` — `setupFiles`, coverage globs

## Agent / progress log

- Repo-local scratchpad + optional **pasted or executed test output**: [`AETHER_RAM.ipynb`](AETHER_RAM.ipynb)

## PR expectations

Lint + unit tests + build + E2E run on PRs to `main` / `master` (see `.github/workflows/ci-cd.yml`). Deploy is gated to push-to-default-branch only.
