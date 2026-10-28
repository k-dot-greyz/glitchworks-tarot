# PR decision surface: implementation plan for `glitchworks-tarot` (rev 3)

> **NOT VERSIONED YET.** Draft plan, **rev 3** (2026-10-28, local time UTC+2), owner Web Dev. Not locked; waits on greyZ's lock-in of the spec and the decisions in §8.
> **Aligned to `REVIEW-QUEUE-SPEC.md` v0.3.1** (header confirmed: "REVIEW-QUEUE-SPEC v0.3.1 (draft)"). Section IDs below (§n, AC#, T#, D#, K#, O#) are the spec's; P#/X#/C# are `GAP-MATRIX.md` (v0.3.1, 136 rows) IDs.
> **Inputs read:** spec v0.3.1; `SPREAD-LAYOUT.md` + `.svg`; `GAP-MATRIX.md`; `roundtable/{webdev,architect,github,product,design-qa}.md`; the local prototype in `tarot-local/` (branch `proto/pr-decision-surface-squashed` @ `9064233`, same tree as `f60f994`; read only, not modified). Rev 2 is kept at `/tmp/IMPL-PLAN.rev2.md` (box scratch).
> **Repos:** `k-dot-greyz/glitchworks-tarot` is **public** (base `dc851590583b50b54ea0dc4aa500ca8a4033edb8`, `main` auto-deploys). `k-dot-greyz/dev-master` is **private**. Nothing in this plan was written to GitHub.

---

## 0. Summary

- **What changed since rev 2.** Rev 2 planned an outbound review queue (outbox, seal tokens, triage, Forge edit, Arena diff). v0.3.1 makes the product a **decision surface for git PRs**:
  - a central PR card;
  - sidecar cards in an Oracle spread (`prSpread`);
  - a true portal modal on every card, with a references index of github.com URL buttons;
  - signal-to-noise first: what decides merge / no-merge leads, and the rest is collapsed;
  - **the app never merges, never posts and never holds a GitHub token.**
  
  The seal (= merge request to the GitHub bot) is phase 1 and ships as one unit (spec §12).
- **Plan shape.**
  - **Phase 0** is a read-only PR surface with **no decision buttons**. It's 7 small PRs against `glitchworks-tarot` (PR-0 … PR-4b), plus one reader PR in the private `aether-outbox` repo once greyZ creates it.
  - **PR-1 is the pure domain / view-model module plus tests.** Most of its logic already exists in the prototype.
  - **Phase 1** (seal path) is outlined and deferred.
- **Base for every PR:** `feat/review-queue` (greyZ creates it; ruleset per spec §7), or a draft. **Never `main`.** Flags default off (`features.reviewQueue`, O2).
- **Effort (phase 0, tarot side):** about **18 agent-hours plus about 3.5 h of greyZ review**, plus ~15 % rebase overhead on `App.jsx` (§6).

## 1. Hard rules (apply to every PR and every artefact)

1. **Read-only.** There are no merge, comment, review, label or any other GitHub write paths in the app. Phase 0 has **no decision buttons**, only the line "Read-only preview: decisions arrive in phase 1." (§12, T37).
2. **No tokens in the browser.** The client bundle, storage and logs never contain a GitHub token (AC15). A CI grep for `github_pat_|ghp_|ghs_|gho_` fails the build (T23).
3. **No runtime network except `'self'` and the Outbox origin** (CSP §4, T35). No remote assets (noise texture bundled; the prototype already does this).
4. **No review data in localStorage, sessionStorage or IndexedDB** (§1.7, RQ-9, AC24).
5. **Synthetic fixtures only in the public repo.** Committed fixtures use `example-org/example-repo`, fictional handles, `example.com`/`example.invalid` URLs, and no real PR numbers, titles or branches. The set covers four scenarios:
   - (a) **NO-MERGE**: stacked draft;
   - (b) **NO-MERGE**: draft with linked issues;
   - (c) **NOT YET**: large diff;
   - (d) **OK**: clean, green and approved.
6. **Real captures only through a gitignored, local-only loader, never committed to the public repo** (new hard rule, rev 3).
   - Path `src/fixtures/local/` is in `.gitignore`.
   - The loader is reachable only when `import.meta.env.DEV` is true, and it returns an empty set if the folder is missing.
   - `vite build` **fails** if that folder contains any file. This matters because a glob import would otherwise bundle it.
   - A CI step greps `build/` for an allowlist-external repo slug and fails if one is found.
   - Real data never enters PR descriptions, screenshots that get committed, or test snapshots.
7. **Private-repo data is never publishable in the public app repo or in its build artefacts:**
   - not in fixtures;
   - not in a snapshot JSON baked into `build/`;
   - not in GitHub Pages / rsync output;
   - not in CI artefacts or uploaded screenshots.
   
   It may only be served at runtime by the authenticated Outbox reader (§4).
8. **The local prototype branches stay local.** `proto/pr-decision-surface` and `-squashed` contain real private-repo captures in committed fixtures. **They must never be pushed or used as a PR source.** Only the synthetic-fixture branch `proto/pr-decision-surface-publish` (being prepared in parallel) may seed PR-1.
9. **No city names** in code, identifiers, fixtures, docs or test names. Times show as local time with a UTC-offset label (e.g. `UTC+2`). Snooze helpers are `localTonight`/`localTomorrow` (AC32).
10. Conventional commits ≤100 chars, no new runtime dependencies, and no new `uses:` actions outside PR-0. Local gates go in each PR body until CI runs on the integration branch: `npm ci --legacy-peer-deps && npx eslint src && npx vitest run && npm run build` (+ e2e from PR-4b).

## 2. Prototype vs v0.3.1: done / partial / missing

**About the prototype** (`tarot-local`, local only):
- **Files:**
  - pure module `src/domain/prSurface/` (checks, reviews, files, stack, issues, flags, signal, refs, time, viewModel);
  - components `src/components/pr/{PrCard,PrModal,PrSpreadView,prModalItem,prTheme}`;
  - theme tokens lifted out of `Card.jsx` into `cardTheme.js`;
  - a bundled noise texture in `GlitchStyles.jsx`.
- **Results:** 28 new tests pass. The 4 failing tests are the existing `rulesets.test.js` `calculateScore` failures. Lint shows 0 errors and only the existing warning. The build is OK. The Playwright run made **0 requests to other origins**, and text on the surface is ≥14 px.

| Spec ref (GAP id) | Requirement | Prototype | Status |
|---|---|---|---|
| §0 / AC13 | Never merges, no writes | No write controls at all; asserted by a test | **done** |
| §5 / AC15 (X1) | No token in the client | No token, no fetch; data bundled | **done** (no T23 CI grep yet) |
| §4 / AC25 (X14, C13) | No remote assets | Noise texture inlined as an SVG data URI | **done**; CSP **missing** |
| T35 / T37 | Only `'self'` requests; phase 0 GET only | Verified by Playwright (12 requests, all same-origin) | **done** (no CSP header) |
| §1.7 / AC24 (X15) | No review data in browser storage | PR data lives in memory only | **done** for the PR surface; reserved-deck guards **missing** |
| §1.2 `review.pr` | Server-filled PR block shape | View model has CI / reviews / mergeability / size / age / labels / issues / stack, but **not** in the `review.pr` shape. No `snapshot{fetched_at, digests, gaps[]}`, no `required` checks, no `last_push_at` / `decision_due_at` | **partial** |
| §1.3 (P1, P2, C3, C9) | Derived v2.1 Card fields; RISK / VERIFIED / DUE as text ≥14 px | Text stats ≥14 px, but CI x/y, review counts, size, files, age instead of RISK 0–99 / VERIFIED % / DUE h. No Card / `validateCard` derivation | **partial** |
| §1.3 chips (P3) | Review, mergeable, size, age, labels (≤3 + "+N"), each a link | Shown as stat cells and a label line; not links; no +N | **partial** |
| §1.4 (P14, AC18, AC19) | Full-width risk band ▲ / ◆ / ⛔ / ✓ / ⏱ / ?; ≥16 px; risk owns a 3 px ring; no pulse; never "ultra-rare" | Verdict chip (NO-MERGE / NOT YET / MERGEABLE) and severity colours. No band, no shapes. The central card uses `rarityBorders['ultra-rare']`. Sidecars use element gradients. Header uses `glitch-text` | **missing** (and deviates) |
| §1.5 flags (X12, AC26) | Spec catalogue; `PR_PROTECTED_BRANCH` = needs a bypass; hard blocks `PR_PROTECTED_BRANCH` / `PII` / `EXPLOIT_DETAIL` | Merge-state flags (draft, conflicts, failing / pending checks, changes requested, no approval, behind, large diff, stacked, workflows / CODEOWNERS touched, stale). `protected-target` = "targets main", the reading §10 overturned. No `PII` / `UNVERIFIED_CLAIM` / `SOURCE_FAILED_OR_STALE` | **partial** (and deviates) |
| §1.6 sidecars (P6, P7) | Groups flags, checks, reviews, issues, stack, file_groups, repo_files, more; cap 50 + `total`; top 3 on the face; "not fetched" vs "none" | 6 of 8 (no **Flags**, no **More**). Worst-first inside checks. No cap / total. Empty and not-fetched are not distinguished | **partial** |
| §3.1 (P4, P5, AC17, C7) | `prSpread` 3×3, 9 fixed positions, deterministic `composePrSpread`, inside Oracle via `renderOracleZone` | 3 columns with sidecars ordered by signal score (positions move per PR); standalone view; low-signal cards collapsed behind a toggle | **partial** (and deviates) |
| §3.1 mobile (P8, T26) | <768 px: band, then PR card, then 56 px rows in a fixed order; empty groups hidden | Centre card first, then full sidecar cards stacked; no compact rows | **partial** |
| §3 Dex list (P16, C14) | Dex list mode is the default queue view | Not built (a PR selector row instead) | **missing** |
| §3 mode lock (P17, K10) | `REVIEW MODE · <deck>` chip + Exit | Not built | **missing** |
| §4 portal (P9, C8) | React portal at `document.body`, focus trap, Esc, **scroll lock**, **deep link** `#/review/<item_id>[/<group>]` | Portal, focus trap, Esc, focus return, backdrop close. No scroll lock; deep link only `?view=prs` | **partial** |
| §4 order + caps (P10, AC16) | Band, then title + chips, flags, summary (≤3 × 140, sourced), key facts (≤8), references, More, action bar; caps; unsourced facts hidden and counted | Title, then references, contents, sections. No summary bullets; no caps or "n facts hidden" | **partial** |
| §4 references (P11, P12) | Labels ≤32; PR, Checks + run URLs, Files, Commits + `/commit/{sha}`, **Compare base…head**, Issues, Sidecar `/blob/{head_sha}/…` (SHA-pinned), Stack; allowlisted repo only | PR, Checks (+ run URLs), Files, Commits, head commit, base / head **tree by branch name**, issue / PR links. Labels carry full titles. No Compare; file links use API `blob_url`; URL check is `https://github.com/` only, not repo-allowlisted | **partial** |
| §4 untrusted text (X13, T27) | Plain text, allowlisted fields | React-escaped plain text; links never buttons; no field allowlist | **partial** |
| §5 data path (X1–X3, T24) | Outbox reader, stale >10 min = `⏱ STALE`, gaps shown | Static fixtures; snapshot time shown; no stale rule, no `? UNKNOWN` | **missing** |
| AC11 / §5 | Times in local time with a zone label, stored UTC | `formatLocal` shows viewer-local time + `UTC±h` label; explicit-offset variant; tests pin a fixed UTC+2 zone | **done** (spec says "configured zone": see §3, item 9) |
| §1.1 / O5 (P19) | `reviewSchemaVersion: '0.3'` next to `schemaVersion '2.1'` | Not present | **missing** |
| O3 naming | Test ids `aether-review-*` | `pr-*` test ids | **deviates** |
| AC18 / T28 | 375×667 glance test (band, title, RISK·VERIFIED·DUE, read-only line, no animation) | Screenshots at 390×844 and 1280×800 only; no band | **missing** |
| AC10 | Playwright phone + iPad projects | Script-driven screenshots only (`scripts/pr-surface-screens.mjs`) | **partial** |
| Phase 1: §2 seal, AC12, AC14, AC20–AC23, AC26–AC32 | Seal / hold / handoff / audit / kill switch / Legal fields | Out of scope for the prototype | **missing** (deferred) |

## 3. Deviations of the prototype from v0.3.1 and SPREAD-LAYOUT (each must be fixed before or during porting)

1. **A 5th nav tab `PRS`.** This conflicts with D1 (default: no tab) and with the four-view surrogate (K7, C6). Port into Oracle as layout `prSpread`, reached through the reserved deck. Remove the tab and `?view=prs` (PR-3b).
2. **Floating sidecar positions** ordered by a signal score, plus a "low-signal" collapse toggle. SPREAD-LAYOUT A has **9 fixed slots** (TL Flags, T Checks, TR Reviews, L Issues, C PR, R Stack, BL Repo files, B Files, BR More). Signal-to-noise lives *inside* a group (worst first, "+N passing/bot") and in the band, not in where a card sits. Keep the score only to order the queue list (PR-1).
3. **Verdict words instead of the band.** NO-MERGE / NOT YET / MERGEABLE is not in the spec. The band is ▲ n RED / ◆ n AMBER / ⛔ BLOCKED · CODE / ✓ CLEAN / ⏱ STALE / ? UNKNOWN. Proposal: keep a verdict as a secondary word under the band if Product agrees (decision §8, item 4).
4. **Tarot styling on review surfaces.** The `ultra-rare` border on the central card, element gradients (fire / electric / wind) per severity, and `glitch-text` on the heading break §1.4, AC19, C11 and Design QA. Use `ReviewCardFrame` with a neutral `dark/standard/common` card, a 3 px risk ring, and no animation.
5. **`protected-target` = "base is main".** §1.5 / §10 redefine `PR_PROTECTED_BRANCH` as "needs a bypass/admin override or force-push". Waiting for greyZ's own approval is not the flag. Drop the "targets main" flag; derive the real flag only from mergeability `blocked` + a bypass signal from the reader.
6. **Merge-state signals vs the spec's flag catalogue.** The prototype treats draft, conflicts, failing checks and changes-requested as blocking flags. The spec's catalogue has none of these, so a draft PR with conflicts would show `✓ CLEAN` under §1.4 as written. That's a spec gap: see §8, item 4.
7. **Portal order and references.** References come before content, and labels are full titles (>32 chars). Branch-name `tree/` URLs aren't SHA-pinned, and Compare base…head is missing. Fix in PR-4a: band → title + chips → flags → summary → facts → references (SHA-pinned, ≤32-char labels) → More.
8. **Sidecar names.** Arcana titles ("The Trial", "The Council", "The Threads", "The Archive", "The Tower", "The Keeper") are not spec groups. Use group words (Checks, Reviews, Issues, Files, Stack, Repo files) as the primary label. Tarot flavour may stay as a secondary label if Design QA agrees.
9. **Time zone.** The prototype formats in the *viewer's* runtime zone. The spec says the *configured* zone with its label. PR-1 adds `config.timeZone` (an IANA id held in config, never hardcoded in code). The viewer's zone is the fallback, the explicit-offset formatter stays, and tests pin a fixed-offset zone.
10. **Data provenance.** The prototype's committed fixtures are real private-repo captures (rule 8). The publish branch replaces them with synthetic fixtures (rule 5).
11. **Mobile.** Full sidecar cards are stacked below the PR card. SPREAD-LAYOUT B wants band → RISK · VERIFIED · DUE → PR card → read-only line → 56 px rows in the fixed order Flags, Checks, Reviews, Stack, Issues, Files, More.
12. **Test ids** `pr-*` → `aether-review-*` (O3).

**Reusable as-is or nearly (ported in PR-1 / PR-4a):**
- the check, review and file summarisers;
- the stack walker and `#N` reference parsing (excluding URL anchors);
- `isGithubHtmlUrl` (tightened to the repo allowlist);
- `formatLocal` / `offsetLabel`;
- the modal's focus trap / Esc / focus return / portal;
- the bundled noise texture;
- the `cardTheme.js` extraction (Card.jsx behaviour unchanged).

## 4. Data path: token-free GitHub reads

**Constraints:**
- No token in the browser.
- Stale >10 min or unverifiable → Seal disabled (phase 1), `⏱ STALE` shown (phase 0).
- **Private-repo data never in the public repo or its build artefacts** (rule 7).
- The tarot repo auto-deploys from `main` (deploy currently disarmed / broken; D3).

| Option | How | Works for public repo | Works for private repo | Freshness | Risks | Verdict |
|---|---|---|---|---|---|---|
| **A. Outbox reader (server proxy)** | Spec §5. Private repo `k-dot-greyz/aether-outbox`; fine-grained **read-only** PAT (Metadata, Pull requests, Checks, Commit statuses, Actions; Contents / Issues read only if needed), allowlisted repos; one GraphQL query per refresh + ETag + webhooks; serves rendered JSON + URLs to the client over `connect-src <outbox-origin>` | yes | **yes, but only behind greyZ's authenticated session** (an unauthenticated read API would leak private PRs) | ≤10 min with webhooks | Needs greyZ's yes to create the repo and the token; a small always-on process | **Recommended** (the only path for real data) |
| **B. Snapshot JSON from a `run:`-only workflow in the public tarot repo** | Scheduled job uses the ephemeral `GITHUB_TOKEN` (`pull-requests: read`, `checks: read`) and `run:` steps only (no third-party `uses:`), then writes `snapshot.json` into `build/` or commits it | technically yes | **NO-GO.** It would publish private PR data in a public repo, its Actions artefacts and the deployed site. A tarot workflow's `GITHUB_TOKEN` can't read another private repo anyway, so a cross-repo PAT secret would be needed | Cron ≥5 min and often delayed; with a typical 15–60 min schedule it is **always** past the 10 min rule, so permanently `⏱ STALE` | Couples data to the auto-deploy pipeline (Architect risk 3); committing needs `contents: write` in a public repo; stale data can't be gated | **Rejected** for private repos. **Not recommended** for the public repo either (spec §12 disagreement 2 ruled it out). At most a manual, one-off demo build, never deployed |
| **B′. Same workflow, but in private `aether-outbox`** | Cron job writes the snapshot into the Outbox's own store; the Outbox serves it like A | yes | yes (data stays in the private repo / store, served behind auth) | Cron-bound unless webhooks are added | Same as A plus cron lag | Acceptable as an **implementation detail of A** (batch refresh), not a separate path |
| **C. Synthetic fixtures bundled at build time** | `src/test/fixtures/review/*.json` (example-org / example-repo), the four scenarios from rule 5 | yes (synthetic only) | n/a (never real data) | n/a | None if kept synthetic | **Use now** for unit tests, e2e, Storybook-style demo and the phase 0 flag-off build |
| **C′. Local real captures** | Gitignored `src/fixtures/local/`, DEV-only loader, build fails if present (rule 6) | local dev only | local dev only | manual | Accidental commit / bundle → guarded by `.gitignore`, a build check and a CI slug grep | Allowed for greyZ's local evaluation only |
| D. Client calls the GitHub API directly, without a token | Unauthenticated REST from the browser | 60 req/h per IP; public only | no | live | Breaks CSP / "no runtime network"; rate-limited; leaks the viewer's IP to GitHub | **Rejected** |

**Recommendation:**
- **C now, A as the only real path.**
- All tarot PRs build and test against synthetic fixtures through an injected `prDataSource` adapter with two implementations: `fixturePrDataSource` and `outboxPrDataSource` (GET only).
- The Outbox reader (A) is built in `aether-outbox` once greyZ says yes. Until then it stays local-only with no real credentials.
- Phase 0 allowlist = `glitchworks-tarot` only (spec D2 default). Adding the private `dev-master` (phase 1) **requires** the reader's session auth to be live first.
- B is out for any private repo, and out by default for the public one.

## 5. Rev 2 stack (PR-1a … PR-11) under v0.3.1

| Rev 2 PR | Decision | Why / where it goes |
|---|---|---|
| PR-0 CI fix | **Keep, reshaped** → new PR-0 | Spec §12: build on tarot PR #40 (not rewritten); SHA-pinned actions, `permissions: contents: read`, gitleaks, deploy only from main behind `production` + `concurrency`, **disarmed** (D3); add the T23 token grep and the rule-6 build guard |
| PR-1a rules + schema + derive + canonical + time | **Keep, reshaped** → PR-1 | PR kind, `review.pr`, RISK / VERIFIED / DUE, band, §1.5 catalogue, `composePrSpread`. **`canonical.js` moves to the Outbox** (phase 1 PR-5): the client never hashes |
| PR-1b client mirror (flags, gates, state machine, batch, expiry, lockout, triage, diff, events) | **Split** | Flags (display) + events whitelist (K13) → PR-1. Gates / state machine / lockout / expiry → **defer** to phase 1 PR-7 (display mirror only). Batch → **drop for PRs** (never batch-sealed, §8). Triage → **defer** (alert / outreach, phase 2). Diff → **defer** (Arena diff, phase 2+) |
| PR-2 Outbox skeleton (shape A in `server/outbox/`) | **Drop shape A; defer the rest** | Authority code never lives in the public, auto-deploying repo (Architect D3, spec §0). Reader → `aether-outbox` PR-O1 (phase 0). Seal / audit / kill switch → phase 1 PR-5 |
| PR-3a adapter + telemetry + flags | **Keep, reshaped** → PR-2 | GET-only `prDataSource`, `features.reviewQueue`, telemetry meta whitelist |
| PR-3b reserved decks | **Keep** → PR-2 | K1–K3: memory-only, persistence strips reserved decks, repair skips them, create / duplicate / setDeck guards |
| PR-4 swipe / keys / press-hold / lockout hooks | **Defer** | Swipes / keys: phase 2. Press-hold + lockout: phase 1 PR-7 |
| PR-5 Dex list + batch | **Split** | List mode → PR-3a (default for reserved decks, P16). Batch → defer (alert / outreach only) |
| PR-6a review sheet in the Dex popup | **Reshaped** → PR-4a | Becomes the portal (§4), ported from the prototype's modal |
| PR-6b confirm / reject / snooze sheets | **Defer** → phase 1 PR-7 | No decision UI in phase 0 |
| PR-7 Oracle triage | **Defer** (phase 2, alert / outreach) | PRs use `prSpread` |
| PR-8 Forge edit-in-place | **Drop for PRs** (K4: PRs are never edited); **defer** for alert / outreach | — |
| PR-9 Arena diff | **Defer** (phase 2+, `reviewDiff`) | — |
| PR-10 outbox tab | **Defer** (D1 default: no tab); holding pill in phase 1 PR-7 | — |
| PR-11 e2e + docs | **Keep, reshaped** → PR-4b (phase 0) and phase 1 PR-8 | — |

## 6. New PR split (phase 0, against `glitchworks-tarot`; base `feat/review-queue` or draft, never `main`)

Effort = cloud-agent build time + greyZ review time (same basis as `roundtable/webdev.md`). LOC are estimates.

| # | Title (conventional commit) | Scope | Closes (spec) | Size / build / review | Deps |
|---|---|---|---|---|---|
| **PR-0** | `ci: valid ci-cd on feat/review-queue, deploy disarmed` | Base on tarot PR #40. Branch triggers; SHA pins; `permissions: contents: read`; gitleaks `--redact`; token grep (T23); build guard for `src/fixtures/local/` (rule 6); deploy only from main behind `production` + `concurrency`, kept disarmed | O1, O6 (verify), T23 | S · 1 h · 15 min | greyZ yes on D3 to re-arm |
| **PR-1** | `feat(review): PR view model and display rules (pure) + tests` | `src/domain/reviewRules.js` (data only: flag catalogue §1.5, severities, size buckets, risk weights, band states, caps, `requiredChecks`, `sidecarGroups`, `timeZone` config key) + `src/domain/review/{schema,derive,pr/checks,pr/reviews,pr/files,pr/stack,pr/issues,flags,band,spread,refs,caps,time,events,index}.js`: `validateReviewCard`, derived Card fields (RISK / VERIFIED / DUE), band, `composePrSpread` (9 fixed slots, worst-first, cap 50 + `total`, top 3, "+N passing/bot", `not fetched` vs `none`), SHA-pinned refs with repo allowlist and ≤32-char labels, `formatLocal` / `localTonight` / `localTomorrow`. Synthetic fixtures (rule 5). Ported from the prototype's `prSurface` with the §3 fixes | AC1 (client), AC11, AC16 (caps), AC17 (composer), AC19 (derivation), AC32 (helpers), P1, P2, P5, P7, P12, X24 | M–L, ~450 LOC incl. tests · 3.5 h · 40 min | — |
| **PR-2** | `feat(review): read-only PR data adapter, reserved decks, feature flag` | `src/adapters/{prDataSource,fixturePrDataSource,outboxPrDataSource}.js` (GET only; `? UNKNOWN` on error; stale label); DEV-only local loader (rule 6); `features.reviewQueue` (default off) + `reviewSchemaVersion: '0.3'`; `usePersistedDeck` K1–K3 guards; memory-only reserved decks; telemetry meta whitelist (K13) | AC15 (client), AC24 (web), X15, X18, P18, P19 | M, ~350 · 2.5 h · 30 min | PR-1 |
| **PR-3a** | `feat(dex): review list mode and ReviewCardFrame` | Dex list mode as the default for reserved decks (row = band chip, title, `repo#n`, RISK · VERIFIED · DUE ≥14 px, flag count); `ReviewCardFrame` (band, 3 px ring, text stats, chips as links, flags list over the art; Card.jsx unchanged) | AC18 (list), AC19, P2, P3, P14–P16 | M, ~350 · 3 h · 30 min | PR-2 |
| **PR-3b** | `feat(oracle): prSpread layout, mobile rows, review mode lock` | `prSpread` in Oracle via `renderOracleZone(…, {locked:true})` + `handleDrawSpread` branch → `composePrSpread`; 9 fixed slots, all face-up, no animation; <768 px band → card → 56 px rows; `REVIEW MODE` chip + Exit (K10). No 5th tab | AC17, T25, T26, P4, P6, P8, P17 | M, ~350 · 3 h · 30 min | PR-3a |
| **PR-4a** | `feat(review): portal modal with references index` | Port of the prototype's modal: React portal, focus trap, Esc, focus return, **scroll lock**, **deep link** `#/review/<item_id>[/<group>]`; spec order (band → chips → flags → summary → facts → references → More); caps + "n facts hidden: no source"; plain text, field allowlist; phase-0 read-only line, no buttons | AC16, AC18 (portal), T27, T37, P9–P11 | M, ~380 · 3 h · 35 min | PR-3b |
| **PR-4b** | `test(review): e2e phone/iPad, glance test, CSP and no-network checks` | Playwright phone (375×667) + iPad projects scoped to `e2e/review-*.spec.ts`; T24, T26, T28 (glance), T34, T35, T37; CSP meta (`default-src 'self'`, `connect-src 'self' <outbox-origin>`, `img-src 'self' data:`, …); docs (`TESTIDS`, `TESTING`) | AC10, AC18, AC24, AC25, X13, X14 | M, ~300 · 3 h · 25 min | PR-4a |

**Phase 0 total (tarot):** 7 PRs, ~2.5k LOC, **≈19 agent-h + ≈3.4 h review**, plus ~15 % for `App.jsx` rebases (PR-3a / 3b / 4a touch it; land them in sequence).

**Outside the tarot repo (needs greyZ's yes to create `aether-outbox`):**
- **PR-O1** `feat(reader): read-only GitHub reader and PR snapshot API`.
  - Scope: fine-grained read-only PAT from a secret store, allowlist, GraphQL + ETag + webhooks (HMAC), the stale rule, `gaps[]`, and the `review.pr` JSON (§1.2). The private-repo allowlist only works behind the greyZ session.
  - Closes AC15 and X1–X3. L · 4–5 h · 45 min.
  - Until the repo exists: local-only, no real credentials.

**Phase 1 (deferred; ships as one unit, spec §12):**
- PR-5: authority core in `aether-outbox`. Seal payload, JCS hash, write-once body store, WebAuthn, single-use, hash-chained audit, kill switch, lint, Legal fields. L ×2.
- PR-6: hold / undo / invalidation + mock merge request. M–L.
- PR-7: decision UI. Action bar, confirm sheet, press-hold, lockout, holding pill, snooze and reject sheets, draft-review editor. L.
- PR-8: E2E + security suite (T1–T46). M.
- Estimate ≈ 20–24 agent-h + 4 h review, more for Legal fields.

**Order:** PR-0 ∥ PR-1 → PR-2 → PR-3a → PR-3b → PR-4a → PR-4b. PR-O1 runs in parallel once the repo exists. Promoting `feat/review-queue` to `main` is greyZ's separate call.

## 7. K-conflicts under v0.3.1 (spec §10 rulings)

| ID | Status now | Note |
|---|---|---|
| K1 no persistence of reserved decks | **live** | Extended by RQ-9 to all browser stores (PR-2) |
| K2 no `fallbackDeck` repair for reserved decks | **live** | Error → `? UNKNOWN` (PR-2) |
| K3 create / duplicate / setDeck guards | **live** | Spec accepted both guards (PR-2) |
| K4 Forge derived fields | **moot for PRs** (never edited); live for alert / outreach in phase 2 | — |
| K5 / O4 band colours | **resolved** (O4 = yes; Card.jsx unchanged); live as an implementation item | Prototype deviates (§3, item 4) |
| K6 / O5 schema version | **live** | `reviewSchemaVersion: '0.3'` (PR-2) |
| K7 5th tab | **live as D1** | Prototype's `PRS` tab is removed in PR-3b |
| K8 / O7 fail-closed vs graceful degradation | **live** | Display degrades; decisions + flags / sources fail closed. Comment in code + CONTRIBUTING §2.6 note |
| K9 update-in-place | **moot for PRs**; phase 2 for alert / outreach | — |
| K10 mode lock | **live** | PR-3b |
| K11 docs say React 18 | **moot** (note only; `package.json` wins) | — |
| K12 keep `review` behind schema / derive / spread | **live** | PR-1 module boundaries |
| K13 telemetry meta whitelist | **live** | PR-2 |
| O9 remote noise texture | **moot in the prototype** (bundled); land it in PR-4b | — |
| **K14 (new)** | **live** | Spec flag catalogue lacks merge-state signals (draft, conflicts, failing required checks, changes requested), so the band could read `✓ CLEAN` on a blocked PR. Needs Product (§8, item 4) |
| **K15 (new)** | **live** | Public UI repo vs private source repos: rules 5–7 and data path A only |

## 8. Open decisions for greyZ (top first)

1. **Create `k-dot-greyz/aether-outbox` (private) for the reader?** This is the only path to real PR data (§4 A). Default: yes, local-only until it exists. Without it, phase 0 ships on synthetic fixtures only.
2. **D2 allowlist.** Default: `glitchworks-tarot` only in phase 0. The private `dev-master` comes only after the reader's session auth is live (rule 7). Each addition means editing the token's selected repositories plus config.
3. **D3 CI re-arm and repo rules when PR-0 lands.** Default: merge PR-0 with deploy **disarmed** until `production` requires greyZ as reviewer; apply the §7 rulesets. An agent changes settings only on an explicit yes.
4. **Signal model (for Product, then greyZ).** Add merge-state flags to §1.5 so the band can't say CLEAN on a blocked PR (K14)? Proposal:
   - red: `CI_FAILING_REQUIRED`, `CHANGES_REQUESTED`, `MERGE_CONFLICT`;
   - amber: `PR_DRAFT`, `REVIEW_REQUIRED`, `BEHIND_BASE`, `CHECKS_PENDING`, `LARGE_DIFF`, `WORKFLOWS_TOUCHED`, `STACKED_ON_OPEN`.
   
   Keep the prototype's NO-MERGE / NOT YET / MERGEABLE as a secondary word under the band?
5. **D1 5th tab.** Default (Product + Web Dev): no tab in phases 0/1. The prototype's tab is dropped.
6. **Retention tiers** (spec §8 recommendation). Not needed for phase 0, which stores no bodies. Needed before phase 1 runs on real data.

## 9. CI and repo constraints (carried from rev 2, updated)

- `ci-cd.yml` at `dc85159` runs only on `main` / `master`, and every push run since 2026-09-12 failed validation with 0 jobs (`secrets.*` in a job-level `if`). PR #40 carries the fix. **Fixing it re-arms the rsync `--delete` deploy**, hence D3.
- Ruleset `def` on main: PR + 1 approval, signed commits, no deletion / force-push, **no required checks**, admin / maintain / deploy keys can bypass (per GitHub R1; not re-read here).
- Squash merge is disabled, so `merge_method ∈ {merge, rebase}` (phase 1).
- `sync-dev-master.yml` uses tag-pinned `peter-evans/create-pull-request@v6` with a write PAT. Pin to SHA (outside this plan; GitHub R1 gives the commit).
- Baseline: 4 failing `rulesets.test.js` `calculateScore` tests (confirmed locally on the snapshot). Every PR body lists them as existing, not new; PR #40 is expected to address them (O6, verify).

## 10. Risks

| # | Risk | Mitigation |
|---|---|---|
| R1 | Private PR data leaks into the public repo / build | Rules 5–8; build guard; CI slug grep; synthetic fixtures; reader behind auth |
| R2 | A blocked PR reads as clean (K14) | Decision §8, item 4; until then PR-1 keeps merge-state signals as amber "display flags" |
| R3 | `App.jsx` rebase conflicts | Sequential UI PRs; new code in components; flag-guarded small edits |
| R4 | Tarot regressions | Flags default off; existing unit / e2e must pass unchanged; Card.jsx untouched |
| R5 | Auto-deploy re-armed by the CI fix | PR-0 keeps deploy disarmed; D3 |
| R6 | Client mirror drift from the server | Display-only mirror; shared-fixture contract test once the reader exists |
| R7 | Stale data mistaken for live | `⏱ STALE` / `? UNKNOWN` band with the label "stale since HH:MM (UTC+2)" |

## Appendix: verification and access

- No GitHub reads were needed for rev 3. Facts come from the files listed in the header and the local prototype (read with `git show` on `9064233`; no branch or working tree was changed).
- Nothing was written to GitHub. The only files written are this plan and the backup `/tmp/IMPL-PLAN.rev2.md`.
