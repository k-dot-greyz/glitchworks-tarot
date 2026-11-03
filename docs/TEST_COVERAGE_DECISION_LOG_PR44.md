# Test coverage decision log — PR decision surface (merged #44)

Linked feat: https://github.com/k-dot-greyz/glitchworks-tarot/pull/44

## 80/20 scope

| Story ID | Type | Impact | Covered by |
| --- | --- | --- | --- |
| UX-PR-DEEP-LINK | Happy | **High** — proto entry via `?view=prs` | `e2e/pr-surface.spec.ts` |
| UX-PR-VERDICT-PICKER | Happy | **High** — four synthetic verdict states | `e2e/pr-surface.spec.ts`, existing `PrSpreadView.test.jsx` |
| UX-PR-READ-ONLY | Sad | **High** — no merge/approve/comment affordances | `e2e/pr-surface.spec.ts`, `scripts/prSurfaceContractGuard.js` |
| UX-PR-MODAL-REFS | Happy | **Med** — github.com-only outbound links | `e2e/pr-surface.spec.ts`, existing RTL modal test |
| SEC-PR-URL-INJECT | Sad | **High** — `javascript:` / data / phish URLs in CI payloads | `prSurface.security.test.js` |
| SEC-PR-AGENTIC-TITLE | Sad | **Med** — hostile title/body treated as plain text metadata | `prSurface.security.test.js` |
| SEC-PR-FIXTURE-ABLATION | Sad | **Med** — incomplete assemble → empty surface | `prSurface.security.test.js` |
| DX-PR-MODAL-CONTRACT | Happy | **Med** — verdict → modal severity mapping | `prModalItem.test.js` |

## Deferred (low ROI / already covered)

- Pixel snapshots (`scripts/pr-surface-screens.mjs`) — manual/proto; not wired to CI E2E.
- Duplicate domain flag/verdict matrix — `#44` already ships `prSurface.test.js` (~440 lines).
- Playwright focus-trap keyboard tour — covered in RTL `PrSpreadView.test.jsx`.

## Follow-up issues (docs)

- [ ] Align `rulesets.test.js` `calculateScore` expectations with `feat/review-queue` (4 pre-existing Vitest failures on this branch).
- [ ] Extend CI workflow to run on `feat/review-queue` while proto lands (optional).
