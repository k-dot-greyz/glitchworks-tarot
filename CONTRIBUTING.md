# Contributing to glitchworks-tarot (Aether Deck) 🔮

Welcome! **glitchworks-tarot** is a dark-mode glitch-art tarot / TCG deck experience — modular card views (Dex, Arena, Oracle, Forge), dynamic deck data, and optional Android packaging via Capacitor.

For a quick product overview, see [README.md](./README.md). For stable E2E/RTL selectors, see [docs/TESTIDS.md](./docs/TESTIDS.md).

---

## 📦 Repository overview

| Area | Technology |
|------|------------|
| UI | [React 18](https://react.dev/) (JSX in `src/`) |
| Bundler / dev server | [Vite 5](https://vitejs.dev/) (`vite.config.js`, output → `build/`) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com/) (`tailwind.config.js`, `postcss.config.js`, `src/index.css`) |
| Icons | [Lucide React](https://lucide.dev/) |
| Mobile shell | [Capacitor 8](https://capacitorjs.com/) (`capacitor.config.json`, `android/`) |
| Unit / component tests | [Vitest](https://vitest.dev/) + [Testing Library](https://testing-library.com/react) (`vitest.config.js`, `src/setupTests.js`) |
| E2E tests | [Playwright](https://playwright.dev/) (`e2e/`, `playwright.config.ts` — preview on `127.0.0.1:4173`) |
| Lint | ESLint 10 + React plugins (`eslint.config.mjs`) |
| Commits | [Conventional Commits](https://www.conventionalcommits.org/) via Husky + Commitlint (`.commitlintrc.yaml`) |
| CI | GitHub Actions (`.github/workflows/ci-cd.yml`) — lint, unit tests + coverage, build, E2E |

### Layout

```
src/                 # React app (App.jsx, dynamic_deck.json, styles)
e2e/                 # Playwright specs (production-like preview server)
docs/                # Product docs (TESTIDS.md, AETHER_RAM.ipynb)
android/             # Capacitor Android project (Gradle)
context-chunks/      # Deck/context chunking helpers
mcp-server/          # MCP server config and launcher
n8n/                 # Automation workflow JSON (Slack sync)
linear/              # Linear integration config
```

**Local dev:** `npm install` → `npm run dev` → [http://localhost:5173](http://localhost:5173) (Vite default). Override with `vite --port` or env as needed — do not hardcode ports in domain logic.

---

## 🌌 1. The Prime Directive: Pure Code in Submodules, Guides in Superproject

This repository (`glitchworks-tarot`) is tracked as a git submodule within parent environments (such as the `dev-master` monorepo). We enforce a strict boundary between parent workspaces and this upstream codebase.

### ⚠️ The Boundary Violation Rule

**NEVER commit internal parent-workspace documentation, fork-specific guides, or monorepo-specific configurations into this repository.**

* **Why?** Doing so pollutes the upstream repository, causes Pull Request rejections, and leaks proprietary or local architectural details.
* **The Standard**: This codebase must strictly consist of **pure code changes** and **product-facing docs** that describe *this* project only.
* All local guides, environment setups, and monorepo-specific documentation must remain within the superproject (e.g., under `dev-master/dex/03-docs/guides/`) and never be committed here.

**Allowed in this repo:** `README.md`, `CONTRIBUTING.md`, and docs under `docs/` that describe Aether Deck behavior (e.g., `TESTIDS.md`). JSON/YAML under `src/`, `n8n/`, `linear/`, and `mcp-server/` are first-class artifacts when they ship product or integration behavior.

**Move to superproject:** Private fork runbooks, zenOS agent session notes, `dev-master` SOPs, and submodule bump workflows → `dev-master/dex/03-docs/guides/` (see [SUBMODULE_CONTRIBUTING_WORKFLOW.md](https://github.com/k-dot-greyz/dev-master/blob/main/dex/03-docs/guides/SUBMODULE_CONTRIBUTING_WORKFLOW.md)).

---

## 🏛️ 2. GlitchWorks Agnostic Architecture Protocol

Every feature, integration, or refactor in `glitchworks-tarot` must be designed as an agnostic data pipeline. Core deck/oracle logic must not assume a specific deployment context or direct parent monorepo coupling.

### 2.1. Zero Hardcoding (Dynamic State Configuration)

* **Rule**: No magic strings, static network ports, or fixed directory paths in domain logic.
* **Application**: Vite dev/preview ports, Capacitor `webDir`, and external API endpoints (e.g., optional validated custom deck JSON injection) belong in config, env, or injected options — not scattered literals in components. Playwright uses `baseURL` from `playwright.config.ts`; override via env only at the test harness edge.

### 2.2. Polymorphism by Default (Interface-Driven Contracts)

* **Rule**: Depend on abstractions, not concretions.
* **Application**: Deck loading, persistence, and stats providers should be swappable (e.g., JSON file vs. remote API vs. Capacitor storage) without rewriting view components. Prefer small adapter modules over embedding fetch/storage logic inside `App.jsx`.

### 2.3. Open Piping (Strict Inter-Process Communication)

* **Rule**: Communicate via strictly typed, isolated message events rather than direct state mutation.
* **Application**: Cross-view updates (Dex ↔ Arena ↔ Oracle ↔ Forge) should flow through explicit state transitions or event payloads. MCP and n8n integrations must use structured JSON at boundaries — not shared globals outside the React tree.

### 2.4. Boundary Validation (The "Hostile Edge")

* **Rule**: Never trust incoming payloads. Protect core application state with a rigorous validation layer.
* **Application**: Validate imported deck JSON, uploaded card packs, and external API responses before merging into `dynamic_deck.json` or in-memory deck state. Malformed input should surface a typed error in the UI, not a white screen.

### 2.5. State Hydration & Dehydration

* **Rule**: The application must be capable of exporting its truth and resuming from a snapshot.
* **Application**: Deck edits, forge compilations, and settings (glitch intensity, CRT/noise toggles) should serialize to JSON (localStorage, file export, or Capacitor Preferences) via explicit save/load paths — see existing save/upload flows in the Forge and settings modals.

### 2.6. Graceful Degradation (Predictable Failure)

* **Rule**: Fail safely, fail cleanly, and fail transparently.
* **Application**: If Capacitor plugins, external stats APIs, or network assets (e.g., noise textures) are unavailable, catch errors and fall back to offline-safe defaults instead of crashing the shell. Web and Android builds should both degrade predictably.

### 2.7. Agnostic Telemetry & Observability

* **Rule**: Domain logic must emit telemetry without knowing the final ingestion endpoint.
* **Application**: Use structured console logging or an injectable logger at integration boundaries. CI, local dev, and future production hooks should attach observability without editing feature modules.

---

## 🔄 3. The Fork-and-PR Submodule Workflow

When contributing back to this repository, follow this clean git workflow:

### Step 1: Configure Your Remotes

Ensure you have configured both your personal fork (`origin`) and the official upstream repository (`upstream`):

```bash
git remote -v

# If upstream is missing, configure it
git remote add upstream https://github.com/k-dot-greyz/glitchworks-tarot.git
```

### Step 2: Checkout a Fresh Branch

Branch off the latest upstream default branch (`upstream/main`):

```bash
git fetch upstream
git checkout -b feat/your-feature-name upstream/main
```

Use a descriptive prefix: `feat/`, `fix/`, `docs/`, `refactor/`, `test/`, `chore/`.

### Step 3: Implement and Verify

Write standards-compliant React/JS code. Before committing, run the project quality gates:

```bash
npm install

# Lint (ESLint 10 + React plugins)
npm run lint

# Unit / component tests (Vitest + jsdom)
npm run test

# Production build (Vite → build/)
npm run build

# E2E (build + vite preview on 127.0.0.1:4173; first time: npx playwright install chromium)
npm run test:e2e

# Optional: interactive E2E debugging
npm run test:e2e:ui

# Optional: watch mode for unit tests
npm run test:watch
```

**CI parity:** GitHub Actions runs `npm run lint`, `npm run test -- --coverage`, `npm run build`, then E2E against the preview server — match this locally before opening a PR.

**Android (optional):** After `npm run build`, sync and open the native project with Capacitor CLI (`npx cap sync android`). Gradle build lives under `android/`; do not commit local keystore or signing secrets.

### Step 4: Run the Pre-Commit Audit Checklist

Before staging or committing:

1. **Check for Misplaced Files**: Run `git status`. Any markdown describing *monorepo* workflows, fork setup, or `dev-master` SOPs? Move them to the superproject or delete before committing.
2. **Verify Diff Scope**: Run `git diff --name-status upstream/main`. Revert unrelated changes (`node_modules/`, `build/`, Playwright reports, local `.env`).
3. **Minimize Diff Noise**: Remove debug `console.log`, trailing whitespace, and drive-by formatting.
4. **Test IDs**: When adding UI that E2E/RTL depends on, follow `aether-<area>-<element>` in [docs/TESTIDS.md](./docs/TESTIDS.md) and update the table.
5. **Commits**: Messages must pass Commitlint — `type(scope): subject` (max 100 chars header).

### Step 5: Commit and Push

```bash
git commit -m "feat(oracle): add spread validation for imported decks"
git push -u origin HEAD
```

### Step 6: Create Your Pull Request

Submit your PR to `k-dot-greyz/glitchworks-tarot` `main`:

```bash
gh pr create --repo k-dot-greyz/glitchworks-tarot --base main \
  --title "feat(oracle): short summary" \
  --body "$(cat <<'EOF'
## Summary
- …

## Test plan
- [ ] `npm run lint`
- [ ] `npm run test`
- [ ] `npm run build`
- [ ] `npm run test:e2e`
EOF
)"
```

> **Note:** If `origin` already points at `k-dot-greyz/glitchworks-tarot` (no personal fork), push your branch to `origin` and open the PR the same way.

---

## 🎯 4. Coding Conventions

* **React**: Functional components and hooks; keep view logic in `src/` and deck data in JSON or dedicated modules.
* **Styling**: Tailwind utilities in components; global glitch/CRT tokens in `App.jsx` CSS variables or `src/index.css` — prefer CSS variables for theme intensity (`--glitch-int`, etc.).
* **Icons**: Lucide React — import only what each view needs.
* **Capacitor**: Gate native-only APIs with `Capacitor.isNativePlatform()`; web builds must remain fully functional without Android.
* **Tests**: Add RTL tests in `src/**/*.test.jsx`; E2E in `e2e/` using `data-testid` selectors from `docs/TESTIDS.md`.
* **No redundant comments**: Comments explain *why* or non-obvious constraints — not what the code obviously does.
* **Conventional commits**: `type(scope): message` — types enforced by `.commitlintrc.yaml`.

---

## 📋 5. Pre-Commit Submodule Audit Checklist

1. **Misplaced docs?** Monorepo-only markdown → `dev-master/dex/03-docs/guides/`.
2. **Diff scope?** Only files relevant to the feature/fix.
3. **Secrets?** No `.env`, keystores, or deploy credentials in the tree.
4. **Generated artifacts?** Do not commit `build/`, coverage HTML, or Playwright traces unless intentionally updating fixtures.
5. **Boundary hygiene?** Product docs in `docs/` only; no zenOS agent RAM or superproject runbooks.

---

🧘 *Keep the deck glitchy, the pipes clean, and the architecture agnostic.*
