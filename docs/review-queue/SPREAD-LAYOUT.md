# SPREAD-LAYOUT: `prSpread` + portal (v0.3.2)
Companion to REVIEW-QUEUE-SPEC v0.3.2 §3.1 and §4. Picture version: `SPREAD-LAYOUT.svg`. All data below is a fictional example. v0.3.2: verdict line under the band; the example PR has a failing check + changes requested, so it is NO-MERGE and Seal is off.

## A. Tablet/desktop (≥768 px): 3×3, centre = PR, everything dealt face-up
```
 REVIEW MODE · review-queue                                   [Exit]
+----------------------------------------------------------------------+
| ▲ 2 RED · ◆ 3 AMBER                       (band, full width, 16px+)  |
| ✕ NO-MERGE · CHECK_FAILING                (verdict, derived, 14px+)  |
+----------------------+----------------------+------------------------+
| [1] FLAGS        5   | [2] CHECKS     2/3 ✓ | [3] REVIEWS            |
| ▲ CHECK_FAILING      | ✗ e2e   failure      | ▲ changes requested 1  |
| ▲ CHANGES_REQUESTED  | ✓ build success      | ✓ approved 0           |
| ◆ BEHIND_BASE  (+2)  | – deploy skipped     | 💬 3 comments          |
|                      | (required view)      | (required view)        |
+----------------------+----------------------+------------------------+
| [4] ISSUES       2   | [0]  PULL REQUEST    | [5] STACK              |
| #31 open             | ┌──risk ring───────┐ | parent: #38            |
| #29 closed           | │ glitchworks-     │ | children: none         |
|                      | │ tarot#40         │ |                        |
|                      | │ +355/−24 · 10f   │ |                        |
|                      | │ flags list (art) │ |                        |
|                      | └──────────────────┘ |                        |
|                      | RISK 99 · VERIFIED   |                        |
|                      | 67% · DUE 3d  (14px+)|                        |
|                      | [blocked][M][3 lbl]  |  ← chips, each a link  |
+----------------------+----------------------+------------------------+
| [6] REPO FILES       | [7] FILES        10  | [8] MORE           +2  |
| not fetched          | src/domain (4)       | deployments            |
| (no sidecars @sha)   | tests (3) · ci (1)…  | security notes         |
+----------------------+----------------------+------------------------+
 Order inside a group: worst first, then newest. One card per group,
 top 3 on the face, full list in the portal (≤10, then "+N on GitHub").
 Empty = dim "none"; data gap = "not fetched". Never more than 9 positions.
 Verdict: ✕ NO-MERGE / ◔ NOT YET / ✓ OK, computed from band + flags only; OK only
 when the band is ✓ CLEAN and the data is fresh. Never shown as CLEAN/OK if blocked.
```

## B. Phone (<768 px, e.g. 375×667): PR card + compact rows (56 px)
```
+-----------------------------------+
| REVIEW MODE · review-queue  [Exit]|
| ▲ 2 RED · ◆ 3 AMBER               |  ← band 16px+, shape + word
| ✕ NO-MERGE · CHECK_FAILING        |  ← verdict 14px+, derived
| RISK 99 · VERIFIED 67% · DUE 3d   |  ← 14px+
| ┌───────────── PR card (md) ────┐ |
| │ glitchworks-tarot#40          │ |
| │ test(security): scoreFormula… │ |
| │ flags list in the art centre  │ |
| └───────────────────────────────┘ |
| Read-only preview: decisions      |  ← phase 0 (no buttons)
| arrive in phase 1                 |
|-----------------------------------| ↓ scroll
| ▲ Flags          5          ›     |
| ✗ Checks         2/3        ›     |
| ⚑ Reviews        1 chg req  ›     |
| ↕ Stack          parent #38 ›     |
| # Issues         2          ›     |
| ≡ Files          10         ›     |
| … More           +2         ›     |
+-----------------------------------+
 Empty groups are hidden. Tapping a row opens the portal for that group.
```

## C. Portal modal (any card; shown for the PR card)
```
+----------------------------------------------- [Esc ✕] ---+
| ▲ 2 RED · ◆ 3 AMBER                                       |
| ✕ NO-MERGE · CHECK_FAILING, CHANGES_REQUESTED             |
| test(security): scoreFormula registry, deck contract…     | ≤80
| [open] [blocked] [+355/−24 M] [review required] [37d]     | chips ≤24
|-----------------------------------------------------------|
| FLAGS   ▲ CHECK_FAILING: required e2e = failure           | ≤120 + [src]
| SUMMARY • Adds a scoreFormula registry + tests       [src]| ≤3 × ≤140
|         • Moves CI secrets into job env              [src]|
| FACTS   base main@ed9566b · head @dedc109          (≤8)   |
|-----------------------------------------------------------|
| REFERENCES                                                |
| [PR ↗] [Checks ↗] [Files ↗] [Commits ↗]                   |
| [Compare base…head ↗] [Issue #31 ↗]                       |
| [Sidecar: RESOURCES.json @dedc109 ↗]  (blob/{head_sha})   |
| [Stack: #38 ↗]                                            |
| ▸ More (collapsed, ≤10 + "+N on GitHub")                  |
|-----------------------------------------------------------|
| Phase 0: "Read-only preview: decisions arrive in phase 1" |
| Phase 1: [Reject] [Snooze] [Request changes]              |
|          [SEAL off · CHECK_FAILING, CHANGES_REQ]  (greyed)|
|          (when allowed: SEAL ▲n → request merge; WebAuthn)|
|  Snooze sheet: [1 h] [localTonight] [localTomorrow]       |
|  (local zone from config; disabled past expiry)           |
|  Seal sheet: "I take editorial responsibility" (greyZ)    |
+-----------------------------------------------------------+
 Plain text only; links inside text are never buttons; no fact without a source.
```
