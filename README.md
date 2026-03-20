# glitchhub-tarot (Glitchworks — Aether Deck)

Dark-mode **cyber-mystic** card UI: **Dex** (library), **Arena** (clash), **Oracle** (spread), **Forge** (entity builder). React 18 + Vite + Tailwind + lucide-react.

> **Naming:** GitHub repo may appear as **glitchhub-tarot** or **glitchworks-tarot** — same app; check `git remote -v`.

## Quick start (launch)

**Requirements:** Node **20.x**, npm.

```bash
npm ci --legacy-peer-deps   # install (peer deps: see note below)
npm run dev                 # http://localhost:5173 (Vite default)
```

**Production-like local check:**

```bash
npm run build && npm run preview   # http://localhost:4173
```

**Peer dependencies:** this repo pins ESLint 10 while some plugins expect ESLint 9 — CI and local installs use `npm ci --legacy-peer-deps`. If `npm install` fails, use the same flag.

## Documentation map

| Doc | Purpose |
|-----|---------|
| [`docs/SPEC.md`](docs/SPEC.md) | Where the **full v2.1 product spec** lives (dev-master path + pointers) |
| [`docs/TESTING.md`](docs/TESTING.md) | **Testing methodology** — Vitest, Playwright, CI, commands |
| [`docs/TESTIDS.md`](docs/TESTIDS.md) | `data-testid` convention for RTL + E2E |
| [`docs/AETHER_RAM.ipynb`](docs/AETHER_RAM.ipynb) | Agent / session RAM + optional test run log cells |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Dev server |
| `npm run build` | Production bundle → `build/` |
| `npm run preview` | Serve `build/` |
| `npm run lint` | ESLint |
| `npm run test` | Vitest (coverage in CI) |
| `npm run test:watch` | Vitest watch |
| `npm run test:e2e` | Playwright E2E |
| `npm run test:e2e:ui` | Playwright UI |

## CI

GitHub Actions: **lint** → **Vitest + coverage** → **build** → **Playwright E2E** (artifact-based). **Deploy** runs only on **push** to `main` / `master` (see `.github/workflows/ci-cd.yml`).

## zenOS / dev-master

When embedded in **dev-master**, this repo lives at `dex/09-repos/glitchhub-tarot`. Cross-repo scratchpad: root `AGENT_RAM.ipynb`; app-specific notes: `docs/AETHER_RAM.ipynb`.

---

*Deck spec v2.1 — see `docs/SPEC.md` for the canonical document location.*
