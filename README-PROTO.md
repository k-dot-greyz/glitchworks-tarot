# PR decision surface — prototype (local only)

Read-only "Oracle spread" for git pull requests, built on a local snapshot of
`glitchworks-tarot@dc85159`. One **central PR card** (verdict, CI, reviews,
mergeability, size, age, flags, labels) is surrounded by **sidecar cards**
(check runs, reviews, linked issues, file groups, stacked PRs, repo sidecar
files). Any card opens a **modal** with extended details, a **references
index** (buttons to github.com) and an in-modal contents list.

**Read-only by design:** no merge, comment or any write action; no tokens; no
runtime network. All data is local JSON fixtures bundled at build time; the only
outbound targets are `<a href="https://github.com/...">` links the user clicks.

The committed data is **synthetic**: a fictional repo `example-org/example-repo`
(header: `example-org/example-repo · synthetic fixtures`). Real GitHub captures
are **never committed**; see [Local-only real captures](#local-only-real-captures-_local).

## Run

```bash
export PATH=$HOME/.local/node24/node-v24.22.1-linux-x64/bin:$PATH   # Node 24 (Node 20 fails peer resolution)
npm ci --legacy-peer-deps
npx eslint src
npx vitest run
npm run build                                                      # -> build/
npx vite preview --host 127.0.0.1 --port 4173 --strictPort
# open http://127.0.0.1:4173/?view=prs   (or the "PRS" entry in the nav)
```

Screenshots, network and a11y checks (preview must be running; needs
`npx playwright install chromium` once):

```bash
node scripts/pr-surface-screens.mjs <outDir>
```

Writes `a-desktop-1280x800*.png`, `b-phone-390x844*.png`,
`c-modal-sidecar-stack-142.png` (stack sidecar of the stacked draft),
`c2-modal-central-147.png` (central-card modal of the NOT YET PR) and
`network-and-a11y-report.json`; exits non-zero if any request leaves the
preview origin (data:/blob: allowed).

## Signal-to-noise

Each flag has a severity: **block** (draft, closed, conflicts, blocked,
failing checks, changes requested), **warn** (mergeability unknown, behind,
unstable, pending/no checks, no approval, protected target, large diff,
workflows/CODEOWNERS touched, stacked on an open PR) and **info** (unowned
files, stale >14 d, merged). The verdict is `NO-MERGE` if any block, `NOT YET`
if a gating warn (no approval, pending/no checks, mergeability unknown,
behind), else `OK`. Sidecars are scored (block 100, warn 20, ok 4,
info 1), sorted by score, and anything below warn collapses behind
"Expand N low-signal sidecars". PRs are ordered by score as well.

## Code map

| Path | What |
| --- | --- |
| `src/domain/prSurface/` | Pure functions: checks, reviews, files, stack, issues, flags, signal, refs, time, viewModel (+ `prSurface.test.js`) |
| `src/components/pr/PrSpreadView.jsx` | Spread layout, PR selector, collapse toggle |
| `src/components/pr/PrCard.jsx` | Central and sidecar cards (keyboard `<button>`s), flag chips |
| `src/components/pr/PrModal.jsx` | Dialog: focus trap, Esc, focus return, references index, ToC; portalled to `<body>` |
| `src/components/pr/prModalItem.js` | Central card → modal content |
| `src/components/pr/prTheme.js` | Severity/verdict class maps, focus ring, amber accent |
| `src/fixtures/github/example-repo/` | Synthetic REST fixtures (committed) |
| `src/fixtures/github/index.js` | Eager glob of the synthetic set; flag-gated lazy loader for `_local/` |
| `src/fixtures/github/assemble.js` | Module map → fixture object (shared by synthetic and `_local/`) |
| `scripts/pr-surface-screens.mjs` | Playwright screenshots + network/a11y report |

## Reused from dc85159 (and what changed)

- `src/components/Card.jsx` — `glowColors` / `rarityBorders` moved verbatim to
  `src/components/cardTheme.js`; Card imports them (no behaviour change).
  The PR cards reuse those tokens and Card's front-frame structure (outer glow
  border, inner gradient panel, header row, stat block) but are new
  components: Card renders 8–11 px text, is a non-focusable `div` and does not
  fit long PR titles.
- `src/domain/elemental.js` `getTypeColor` — severity → element gradient
  (block=fire, warn=electric, ok=wind, info=dark).
- `src/App.jsx` — card-modal styling (`fixed inset-0 z-[900] bg-black/90
  backdrop-blur-md`) reused for PrModal; the Oracle `celticCross` spread idea
  reused as a 3-column grid (centre card first on mobile). App changes: a
  `prs` nav entry (`GitPullRequest`, amber), `?view=prs` deep link, and a
  lazy-loaded `PrSpreadView` (fixtures ship in a separate chunk).
- `src/components/GlitchStyles.jsx` — the `.noise-overlay` remote
  `https://grainy-gradients.vercel.app/noise.svg` was replaced with an inline
  SVG `feTurbulence` data URI so the whole app makes no third-party requests.

## Synthetic fixtures

`src/fixtures/github/example-repo/` holds hand-designed fixtures for the
fictional repo `example-org/example-repo` (`private: false`, no SSH clone URL),
in the same REST shapes the domain code reads from GitHub:

| File | Shape of |
| --- | --- |
| `pr-<n>/pull.json` | `GET /repos/{o}/{r}/pulls/{n}` |
| `pr-<n>/files.json` | `GET /repos/{o}/{r}/pulls/{n}/files` |
| `pr-<n>/reviews.json` | `GET /repos/{o}/{r}/pulls/{n}/reviews` |
| `pr-<n>/check-runs.json` | `GET /repos/{o}/{r}/commits/{head_sha}/check-runs` |
| `pr-<n>/status.json` | `GET /repos/{o}/{r}/commits/{head_sha}/status` |
| `pr-<n>/issues/<k>.json` | `GET /repos/{o}/{r}/issues/{k}` |
| `pulls-index.json` | `GET /repos/{o}/{r}/pulls?state=all`, trimmed to number/title/state/draft/user/head/base/labels/dates |
| `codeowners-excerpt.json` | decoded `.github/CODEOWNERS` lines (exact paths) |
| `_meta.json` | derived: repo, snapshot time used as "now", PR list, source label |

Every title, branch, login (`example-dev`, `example-maintainer`,
`example-reviewer`, `example-bot[bot]`), id and 40-hex SHA is made up; SHAs
are random, not derived from anything real. Timestamps are UTC (`Z`); the
snapshot time is `2026-10-20T12:00:00Z`.

| PR | Title | State | Verdict | Exercises |
| --- | --- | --- | --- | --- |
| #142 | feat(widgets): sparkline renderer on the widget registry | open, draft, base `feat/widgets-core` | **NO-MERGE** | stacked on open parent #138 (→ `main`), sibling #140 on the same base |
| #145 | docs(api): cursor pagination guide | open, draft, base `main` | **NO-MERGE** | linked issues: #120 (closes, open), #121 (closed), #199 deliberately absent → unresolved |
| #147 | refactor(storage): split the adapter layer into modules | open, clean, base `main` | **NOT YET** | +1890/-410 in 30 files (large diff), no approval (1 requested), CI 2/2 green, protected target |
| #149 | fix(cli): treat an empty config file as defaults | open, clean, base `main` | **OK** | approved, CI 2/2 green, +14/-3 in 2 files, files covered by CODEOWNERS |

`pulls-index.json` also lists #138 (parent), #140 (sibling), #136 (closed) and
#133 (bot PR) so stack and `#N` resolution have something to find.

## Local-only real captures (`_local/`)

Real captures are never committed. To test against them locally:

1. Put them in `src/fixtures/github/_local/` using the same layout as
   `example-repo/` (`_meta.json`, `pulls-index.json`, `codeowners-excerpt.json`,
   `pr-<n>/…`). The directory is in `.gitignore`.
2. Start with the flag: `VITE_PR_LOCAL_FIXTURES=1 npm run dev` (or
   `VITE_PR_LOCAL_FIXTURES=1 npm run build && npx vite preview …`).
3. The view loads `_local/` lazily and labels the header
   `local captures (_local, not committed)`; `?view=prs&fixtures=synthetic`
   switches back to the synthetic set.

Without the flag (the default for dev, tests and `npm run build`) the
`import.meta.glob('./_local/**/*.json', { eager: false })` call sits in a
statically false branch, so Vite drops it: the default build never references
`_local/` and works whether or not the directory exists. Do not ship a build
made with the flag; it bundles whatever is in `_local/`.

Times: shown in the viewer's local time zone with a UTC-offset label (e.g.
`2026-10-15 15:42 UTC+2`); `formatLocal(iso, { offsetMinutes })` formats at an
explicit offset. No time-zone id is hardcoded; tests pin `TZ=Etc/GMT-2` (a fixed
UTC+2 zone) in `vitest.config.js`.

**Derived (not returned by GitHub as such; marked `derived` in the UI):**
`_meta.json` (snapshot time, PR list); the **protected target** flag —
`main` is assumed protected from policy, the branch-protection endpoint was
*not* read; linked issues/PRs parsed from PR body/title (`#N`); the stack
chain/siblings computed from `pulls-index.json`; CODEOWNERS coverage by exact
path match (no glob support); file grouping,
size class, age and all scores.

**Not fetched / left out:** patch hunks, review & issue comments, the commit
list (only `commits` count from the PR), branch-protection rules, required
checks, and requested-team details beyond the PR payload. The synthetic set
does not model these either; the UI says "none in snapshot" where data is
absent.

## Known gaps

- Data is static; the synthetic set covers four scenarios only. Live data
  means dropping captures into `_local/` (see above). No live sync (by design
  for this prototype).
- Stack/sibling detection and `#N` resolution only see PRs in
  `pulls-index.json` and issues in `pr-<n>/issues/`; anything else is shown
  as an unresolved link (e.g. #199 in the synthetic set).
- Protected-branch status is assumed, not read.
- Existing app chrome (nav labels ~12 px, CRT/scanline overlay) is unchanged;
  the PR surface itself keeps text ≥14 px.
- Lint: the only warning is the pre-existing
  `react-hooks/exhaustive-deps` in `App.jsx`.
- The Android/Capacitor directory was not copied into the local snapshot.
- Not wired to any CI; `scripts/pr-surface-screens.mjs` is a manual check.
