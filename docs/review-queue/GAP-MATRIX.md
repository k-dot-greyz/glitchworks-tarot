# GAP-MATRIX: REVIEW-QUEUE-SPEC v0.1 → v0.3 vs glitchworks-tarot (Aether Deck)

v0.3.2 update (2026-10-28): IMPL-PLAN rev 3 K14/K15 + telemetry. New rows P20–P22, X25–X27, AC33–AC36; conflict C15; X18 updated. v0.3.1 update (2026-10-28): Legal R1 folded in. New rows X19–X24 (§7) and AC27–AC32 (§8), R10/X10 updated, city names dropped from wording. v0.3 update (2026-10-28): statuses re-checked against the clone at `dc85159`. New sections §6 (PR decision surface), §7 (security + data path), §8 (v0.3 ACs). Conflicts C7–C14 added; C1/C3/C6 updated. Previous matrix: not versioned yet.

Date: 2026-10-28 (local, UTC+2). Owner: Product. Read-only review. Nothing was pushed, branched or filed.

## Header

| Item | Value |
|---|---|
| App repo | `k-dot-greyz/glitchworks-tarot` at **`dc851590583b50b54ea0dc4aa500ca8a4033edb8`** (`dc85159`, "docs: correct kernel clash model and lock scores", committed 2026-09-29 17:55 local, UTC+3) |
| Our spec | `REVIEW-QUEUE-SPEC-v0.1.md` (sha256 `f0d7a26d…190e`), 16 schema fields + flag catalogue, 11 ACs |
| v2.1 deck spec, expected location | `k-dot-greyz/dev-master` : `dex/08-projects/Glitchworks Tarot-Aether Deck Spec.md` (pointer in [docs/SPEC.md](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/docs/SPEC.md)) |
| v2.1 deck spec, result | **NOT FOUND / NOT READ.** At dev-master `main` = **`43ff86cb29446702a2b46f769dd49f4ca5a7bc2b`** (2026-10-24 02:25 local, UTC+3) the file does not exist; `dex/08-projects/` has no Aether/Tarot spec. Commit history for that exact path (and for `08-projects/…` without `dex/`) is empty. GitHub code search for "Glitchworks Edition" across greyZ repos hits only glitchworks-tarot `docs/SPEC.md`. glitchworks-tarot `dc85159` declares a `dev-master` submodule in `.gitmodules` but commits **no gitlink**, so there is no pinned dev-master SHA either. |
| v2.1 surrogates used instead | (a) glitchworks-tarot `docs/SPEC.md` v2.1 summary (stack, `Card` entity schema, four views Dex/Arena/Oracle/Forge, glitch/CRT/noise aesthetics); (b) `src/config/aetherConfig.js` `schemaVersion: '2.1'`; (c) the enforced card contract `src/domain/deckValidation.js`; (d) dev-master `dex/07-examples/aether-deck/README.md` (blob `6a63f4e`) and `App.jsx` (blob `efa77eb`) at `43ff86c`, the original Aether Deck ("the card is just a vessel, the data defines the spirit"; Atk/Def/Spd = Action/Resilience/Momentum; elements void/fire/water/electric/wind/dark). Also read, not v2.1: dev-master `dex/03-docs/guides/CARD_MANIFEST_SPEC.md` (LIB-0001 v0.1.0 draft, blob `aea48bf`) and glitchworks-tarot `docs/KERNEL.md` (proposed, not implemented). |
| Effect on the "v2.1 wins" rule | Every "Conflict with v2.1" verdict below is against the **surrogates**, not the canonical text. **v0.3: D1 resolved with no answer from greyZ, so the surrogates are binding.** Re-check only if the real file appears. |
| Counts (146 rows, v0.3.2) | **146 rows: 3 already there · 29 partial · 114 missing.** By section: §1 0/3/14; §2 0/3/12; §3 3/5/13; §4 0/1/7; §5 0/2/9; §6 0/9/13; §7 0/3/24; §8 0/3/22 (there/partial/missing). |

Status key: **there** = in code at dc85159 and usable as is. **partial** = a real mechanism exists that covers part of it or can be extended. **missing** = nothing in the repo does it. Every "there/partial" cites a file at dc85159. Base URL: `https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/`.

## Fit assessment (plain)

**As an approval queue, this app is a poor fit today. It has a good card UI, and none of the safety core.** At dc85159 it is a client-only React 19 / Vite / Capacitor (Android) card game: a Card entity (`id, name, sub, type, stats{atk,def,spd}, desc` + cosmetic extras), decks in `localStorage`, four views, a console telemetry adapter. A grep of `src/`, `e2e/` and `context-chunks/` finds no approve/review/queue/audit/hash/token/snooze/expire logic, no keyboard or swipe handlers, no time-zone handling, no backend, no auth and no outbound posting. (`n8n/slack-sync-workflow.json` is a Linear→Slack webhook stub and `mcp-server/` is a config file only. Neither is wired to the app or gated.) There is no state machine on cards. The proposed reducer in `docs/KERNEL.md` is explicitly unimplemented. **Nothing at this commit shows it is "the review queue implementation".** It is a deck/tarot app that a review queue could be built on top of.

What is reusable: the Card renderer and the Dex grid + detail modal (card UI), multi-deck persistence behind an injectable storage adapter (queue partitions), boundary validation with typed failure (`validateCard`/`parseStoredDeck`), the banlist-at-the-boundary pattern with telemetry and an E2E test (hard blocks), face-down reveal tracking (gate "viewed before approve"), the Forge live-preview editor (Edit), mobile bottom nav with safe-area + Capacitor (mobile shell), and the `data-testid` convention (tests).

What has to be NEW: a server-side approval core (hash, single-use token, append-only audit, source checker, expiry clock, posting adapters). A browser `localStorage` app can't hold approval authority. The app's "graceful degradation" falls back to defaults when data is bad. That is fail-*safe*, which is the opposite of what approval needs: approval must fail *closed*.

**Mapping used (v0.2 builds on this):**

| Review-queue concept | Aether Deck concept |
|---|---|
| Item | **Card** (entity) with a new optional `review` block; v2.1 required fields are derived from the item |
| Queue / history | Reserved **decks** `review-queue` and `review-archive` (Dex deck select) |
| Card view (§3) | **Dex** card detail modal (`aether-modal-card`) extended into a review sheet |
| One-at-a-time triage | **Oracle**, new layout `triage` (1 card, ordered by expiry, face-down until revealed) |
| Edit | **Forge** in edit mode (load card → edit draft → re-compile = resubmit) |
| Diff on edit | **Arena** two slots: approved version (Alpha) vs edited (Omega) |
| Gates / hard blocks | Serializable **ruleset** (like `rulesets.js`) checked at the boundary, like `bannedCardIds` |
| Severity colour | ~~rarity border~~ **v0.3:** `ReviewCardFrame` band + ring (▲ red / ◆ amber `#ffb400` / ⛔ / ✓ / ⏱ / ?); rarity forced `common` |
| Audit | **Telemetry** adapter interface, re-pointed at the server audit log (console stays for dev) |
| Hold / undo / posted / failed | Dex reserved deck `review-outbox` + global holding pill (tab = D1) + NEW Outbox service (private `aether-outbox`, recommended) |
| (v0.3) PR + sidecars | Oracle `prSpread` (3×3, centre PR) |
| (v0.3) Detail + references | Dex modal grown into a portal with a URL-button TOC |

**v0.3 (PR decision surface):** the fit is better for a **read-only PR viewer** (phase 0). The card renderer, Oracle 3-column grid, Dex modal and test conventions get a viewer most of the way, and nothing there needs authority. The **decision** part (seal → merge request) still has zero support in the repo and lives entirely in the new Outbox service, and the GitHub bot does the merge. Three repo patterns work against the safety rules and need scoped exceptions: localStorage persistence (C12), the remote noise asset (C13), and pulsing rarity styles (C11).

## Matrix

### §1 Item schema

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| S1 | `id` ULID, sortable, immutable | partial | [src/domain/deckState.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckState.js#L17-L24) (`forgeCard`), [deckValidation.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckValidation.js#L1-L13) | Card `id` is a required non-empty string. Forge assigns `maxId+1` zero-padded (`"017"`). Decks use `crypto.randomUUID`. No ULID. | **yes (C2)**: card `id` is the deck-sequence id. v0.2 keeps it and puts the ULID in `review.item_id` |
| S2 | `type` enum security_alert/outreach/pr_push | missing | Card model | Card `type` exists but holds the **elemental core** (`void/fire/water/electric/wind/dark`, Forge select in [App.jsx](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L985-L999)) and drives colours and clash advantage | **yes (C1)**: name collision. v0.2 renames ours to `review.kind` · **v0.3: kinds `pull_request` (replaces `pr_push`) / `security_alert` / `outreach`; Card `type` forced to `dark` for every review card (C1 update)** |
| S3 | `channel` enum x/linkedin/email/github/blog | missing | none | No channel concept anywhere | no |
| S4 | `target` object (recipient/account/repo+branch; company + role only) | missing | none | Nothing | no |
| S5 | `draft {title?, body, attachments[]}` + channel length check | partial | Card `name`/`sub`/`desc` + `customImage` ([Card.jsx](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L158-L190)) | Card carries short text and one image (data URL from Forge upload). No body/markdown, no attachments list, no length limits | no (v0.2 derives `name/sub/desc` from the draft, see C3) |
| S6 | `content_hash` sha256 of channel+target+draft, server-side | missing | none | No hashing in repo (grep `hash|sha256`: no hits in src) | no |
| S7 | `sources[]` with kind, verification, checked_at, evidence_note | missing | none | Nothing | no |
| S8 | `claims[]` each mapped to ≥1 source | missing | none | Nothing | no |
| S9 | `risk_flags[] {code, severity, detail, auto}` | missing | (visual only: [Card.jsx `rarityBorders`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L68-L73)) | No data field. Rarity borders can show severity but carry no meaning | no · **v0.3: adds `UNPATCHED`; `EXPLOIT_DETAIL` becomes a hard block; meaning goes in the wrapper band, not rarity** |
| S10 | `created_by {bot_id, bot_name, run_id}` | missing | none | Nothing | no |
| S11 | `created_at` RFC 3339 UTC | missing | none | No timestamps on cards | no |
| S12 | `expires_at` RFC 3339 UTC | missing | none | Nothing | no |
| S13 | `state` enum | missing | none | Cards have no lifecycle; decks only hold arrays ([usePersistedDeck.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js)) | no |
| S14 | `approval {token, content_hash, approved_at, approved_by, used}` | missing | none | No auth, no tokens | no |
| S15 | `post_result {posted_at, external_url, adapter_response}` | missing | none | No outbound adapters in the app | no |
| S16 | `audit[]` append-only | partial | [src/adapters/consoleTelemetry.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/adapters/consoleTelemetry.js), injected in [App.jsx](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L35-L39) | Structured `telemetry.log(level, event, meta)` seam (e.g. `CARD_BAN_VIOLATION`, `DECKS_SAVE_FAILED`). Console only, not stored, not append-only, not per item | no |
| S17 | Risk flag catalogue (NAMES_COMPANY … PR_PROTECTED_BRANCH) | missing | none | No detectors, no denylist | no · **v0.3: PR flags reuse existing codes; `PR_PROTECTED_BRANCH` = needs a bypass; lint at submit/seal/send** |

### §2 States, transitions, single-use, audit

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| R1 | draft→needs_review only if schema valid, hash, sources checked, flags computed; else stays draft with errors | partial | [deckValidation.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckValidation.js), [usePersistedDeck.js `setDeck`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js#L99-L117) | Boundary validation exists: invalid cards are rejected (`setDeck` throws), and stored data is parsed into typed `{ok, code}` results. Only v2.1 card fields are checked; no states, no hash/source/flag step | no |
| R2 | approve → mints single-use token bound to content_hash (gates pass) | missing | none | No approve action, no tokens | no |
| R3 | edit in needs_review → new hash, flags+sources rechecked, logged `edited` | partial | Forge ([App.jsx `renderForgeView`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L922-L945), [`saveForgeCard`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L230-L244)) | Forge is a live-preview entity editor, but only **creates**: `compileForgeCard` appends a new card with a new id. It can't edit an existing card. No re-hash/re-check | no |
| R4 | edit after approve → approval revoked, token burned | missing | none | Nothing | no |
| R5 | approved → holding for hold window | missing | none | Only timer in app is the 600 ms clash beat ([App.jsx](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L181-L190)) | no |
| R6 | holding → undo → needs_review, token burned, nothing sent | missing | none | Nothing | no |
| R7 | window ends → posting → posted; adapter re-checks token unused + hash; marks used before send | missing | none | No outbound posting from the app. `n8n/slack-sync-workflow.json` (webhook→Slack) is unrelated and ungated | no |
| R8 | adapter error → post_failed → needs_review, no auto-retry | missing | none | Nothing | no |
| R9 | reject with required reason (preset list) → terminal | missing | none | No card removal at all (only `deleteDeck` for whole decks) | no |
| R10 | snooze 1 h / `localTonight` / `localTomorrow` (configured zone, DST-safe), not past expiry | missing | none | No time/zone code in the clone (grep). **v0.3.1:** helpers renamed from city-named ones; the GitHub bot's redacted docs PR was **not found** among open glitchworks-tarot PRs on 2026-10-28 (newest open: #43); unverified | no |
| R11 | clock ≥ expires_at → expired (terminal); resubmit only as new item | missing | none | No clock logic | no |
| R12 | single-use token: second post attempt refused + logged `token_reuse` | missing | none | Nothing | no |
| R13 | approval never carries over to edited/resubmitted item | missing | none | Nothing | no |
| R14 | audit entry on every event (incl. source views), fixed schema, append-only, JSONL export | missing | (seam: telemetry adapter, see S16) | Telemetry is console output; no store, no export, no immutability | no |
| R15 | state persists across app close (needed for hold/undo) | partial | [src/adapters/deckStorage.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/adapters/deckStorage.js), [localStorageDeckStorage.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/adapters/localStorageDeckStorage.js) | Decks persist to `localStorage` through a swappable adapter. One device, client-writable, so it can't be the source of truth for approvals | no · **v0.3: **conflict C12**: review state may not use browser storage (RQ-9); persistence is server-side only** |

### §3 Card layout, gestures, batch, night use

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| U1 | Header strip: type icon + channel + target · bot · expiry countdown | partial | [Card.jsx header](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L136-L156) | Card face has a header (type label, name/sub) and a sigil icon. No channel/target/bot/countdown | no |
| U2 | Colour band: red / amber / neutral by flags | partial | [Card.jsx `rarityBorders`/`frameStyles`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L68-L92) | Border/glow variants exist (rarity `glitched` pulsing pink, `ultra-rare` yellow). Not driven by data meaning | no · **v0.3: superseded by P14 (wrapper band ▲/◆/⛔/✓/⏱/?); rarity forced `common`, no pulse** |
| U3 | Flags block first, full width, not collapsible | missing | none | Nothing | no |
| U4 | Sources block: badges ✓/?/✗/⏱, checked-at, in-app reader, claim→source highlight | missing | none | Nothing | no |
| U5 | Draft preview as the channel renders it + char count; pr_push repo/branch/diff stat | missing | none | Card shows `desc` text only | no |
| U6 | Sticky bottom action bar Reject · Snooze · Edit · Approve | missing | (pattern: fixed bottom nav, [App.jsx](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L1294-L1297)) | No action bar. The fixed-bottom, safe-area nav shows the pattern works on mobile | no |
| U7 | Approve: swipe right (only flag-free, else confirm sheet) / `A` | missing | none | No touch/swipe or keydown handlers anywhere in `src/` (grep). Only HTML5 drag-and-drop, which is mouse-oriented | no |
| U8 | Reject: swipe left → reason sheet / `R` | missing | none | As U7 | no |
| U9 | Snooze: swipe down / `S` | missing | none | As U7 | no |
| U10 | Edit: tap body / `E` | partial | Dex card `onClick` → detail modal ([App.jsx](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L370-L380), [modal](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L1370-L1400)) | Tap opens/flips a card. No edit entry point (Forge can't load an existing card) | no |
| U11 | Next/prev: swipe up / `J` `K` | missing | none | As U7 | no |
| U12 | Open source n: `1`–`9` | missing | none | As U7 | no |
| U13 | Undo in hold: toast button / `U` / `Cmd-Z` | missing | none | No toasts, no undo | no |
| U14 | Batch view: list grouped by type, sorted by expiry; row = type, target, first line, flag dots, expiry | partial | Dex ([deck select](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L272-L285), [grid](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L363-L381)) | Dex shows a deck as a card grid with deck switching. No grouping, sort, list rows or flag dots | no · **v0.3: becomes Dex **list mode**, the default for reserved decks (P16)** |
| U15 | Multi-select: reject, snooze only | missing | none | No selection model | no |
| U16 | Batch approve: zero flags + all verified, ≤10, summary sheet | missing | none | Nothing | no |
| U17 | Dark theme default at night | there | [App.jsx root `bg-slate-950`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L1216-L1222), [StatusBar dark](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L133-L139) | App is dark-only, always. No light theme exists | **yes (C4)**: v0.1 assumed a time-based switch (after 20:00 local). v2.1 aesthetic is dark-only, so v0.2 drops the switch |
| U18 | Large type in review surfaces | missing | none | Card text is `text-[10px]`–`text-sm` mono | no · **v0.3: band ≥16 px bold, stats ≥14 px (P2, P14)** |
| U19 | No sounds | there | whole `src/` | No audio code in the app (grep: no `Audio`/sound APIs) | no |
| U20 | 300 ms input lockout after card change (no accidental double-tap approve) | partial | [App.jsx `isClashing` guard](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L142-L144), [e2e double-click test](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/e2e/app.spec.ts#L57) | A re-entrancy guard on clash plus an E2E test for double-click spam. No lockout on card change | no |
| U21 | Mobile shell: one-handed, bottom nav, safe area, native wrapper | there | [App.jsx nav](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L1294-L1357), [capacitor.config.json](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/capacitor.config.json), `android/` | Bottom nav on mobile (top on md+), safe-area padding, Capacitor Android app `com.glitchworks.aetherdeck` | no |

### §4 Safety gates

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| G1 | Sources before approve: Approve disabled until sources block seen (+ each red-flag source opened); logged | missing | (reuse: [Oracle `revealedCardIds`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L77)) | No gate. The face-down reveal tracker is a working "has the user looked at X" mechanism to extend | no · **v0.3: dealt face-up; the gate = Checks + Reviews portals opened on the current snapshot** |
| G2 | Red flags unmissable: band + flags first + count on Approve | missing | none | Nothing | no |
| G3a | Any flag → confirm sheet with per-flag checkbox; red adds 1.5 s press-and-hold | missing | none | No confirm sheets, no press-and-hold | no |
| G3b | Hard blocks: `PII`, `PR_PROTECTED_BRANCH` can't be approved, only edited/rejected | partial | [rulesets.js `bannedCardIds`](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/rulesets.js#L16), [App.jsx boundary check](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L150-L157), [e2e banlist test](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/e2e/arena-security.spec.ts#L115) | Real pattern: a serializable ruleset bans ids, the check runs at the drop/select boundary, logs `CARD_BAN_VIOLATION`, and is E2E-tested. It bans card ids, not flag codes, and it's client-side only | no · **v0.3: hard blocks = `PII`, `PR_PROTECTED_BRANCH`, `EXPLOIT_DETAIL`** |
| G4 | Hold + undo with countdown; survives app close; undo reachable from queue | missing | none | Nothing | no |
| G5 | Re-verify sources >24 h at approve; refuse if any failed | missing | none | Nothing | no |
| G6 | Fail closed if checker/hash/audit unavailable; reason shown | missing | (contrary pattern: [usePersistedDeck.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js#L30-L47), CONTRIBUTING §2.6) | App policy is graceful degradation **to defaults** (bad data → `fallbackDeck`). For approvals that would be fail-open, so v0.2 states the exception explicitly | no (repo convention, not v2.1; v0.2 overrides it for the review path only) · **v0.3: scoped exception (ruling K8): display degrades, decisions + flags/sources fail closed** |
| G7 | Expired items can't be revived, only resubmitted new | missing | none | Nothing | no |

### §5 Acceptance criteria

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| AC1 | Item missing a required field never reaches needs_review | partial | [deckValidation.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckValidation.js#L1-L13) | Enforced for v2.1 card fields only (invalid cards are refused). Review fields and states don't exist | no |
| AC2 | Approve impossible before sources viewed | missing | none | See G1 | no |
| AC3 | Flag → no single-gesture approve; red → ack + hold; PII/protected branch → no approve | missing | none | See G3a/G3b. Only the banlist pattern exists, so nothing in this AC is met today | no |
| AC4 | Edit after approval revokes it, new hash | missing | none | See R4 | no |
| AC5 | Token posts at most once; hash mismatch never posted | missing | none | See R7/R12 | no |
| AC6 | Undo during hold sends nothing | missing | none | See R6 | no |
| AC7 | Past expires_at → expired; can't approve/post | missing | none | See R11 | no |
| AC8 | Every action = exactly one audit entry; log unalterable via UI/API | missing | none | See R14 | no |
| AC9 | Batch approve rejects selection with flagged/unverified item | missing | none | See U16 | no |
| AC10 | One-handed on 375 px phone + iPad; keyboard shortcuts on iPad | partial | [App.jsx nav + grid](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L363-L364), [playwright.config.ts](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/playwright.config.ts#L21) | Responsive grid + mobile bottom nav + Android build. No keyboard shortcuts; E2E runs **Desktop Chrome only** (no phone/iPad project) | no |
| AC11 | Times shown in the configured local zone (labelled), stored UTC | missing | none | App has no timestamps or time-zone code | no |

### §6 v0.3 PR decision surface (spec §1.3–§4)

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| P1 | Central PR card, derived v2.1 fields | partial | Dex/Oracle · Card.jsx + ReviewCardFrame | Card renderer + [validateCard](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckValidation.js) tolerate extra fields; nothing PR-specific | C9, C11 |
| P2 | RISK / VERIFIED / DUE as text ≥14 px | partial | ReviewCardFrame | 3 stat slots exist as 10 px icon numbers, `hideStats` supported ([Card.jsx#L207](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L207)) | C9 |
| P3 | PR chips: review, mergeable, size, age, labels (linked) | missing | ReviewCardFrame | Nothing | no |
| P4 | `prSpread` 3×3, centre PR, 9 fixed positions | partial | Oracle | celticCross 3-column grid ([App.jsx#L756](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L756)), `renderOracleZone` ([#L661](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L661)); no 9-slot layout | C7 |
| P5 | Deterministic composer, worst-first ordering | missing | src/domain/review/spread.js | Only random `drawSpread` ([deckState.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckState.js)) | C7 |
| P6 | Sidecar cards, ephemeral (never in a deck) | missing | service + Oracle | Spreads draw only from the active deck | C10 |
| P7 | Overflow: count + top 3, More slot, server cap 50 | missing | Oracle + portal | Nothing | no |
| P8 | Mobile collapse: PR card + 56 px rows | partial | Oracle | celticCross stacks `flex-col` below md ([App.jsx#L756](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L756)); no compact rows | no |
| P9 | Portal: true modal, focus trap, Esc, deep link, from any view | partial | Dex modal | Dex-only modal ([App.jsx#L1370-L1400](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L1370-L1400)); grep finds no `createPortal`/`Escape`/`aria-modal` in src | C8 |
| P10 | Summary-first + text caps | partial | portal | Only `line-clamp-3` on desc ([Card.jsx#L186](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L186)) | no |
| P11 | References TOC of URL buttons | missing | portal | No `href`/`window.open` in src | no |
| P12 | SHA-pinned blob URLs for sidecar files | missing | service | Nothing | no |
| P13 | Repo sidecar files: release/press/distribution, RESOURCES.json, POL links | missing | service | No such files in the dc85159 tree; code search across greyZ repos found 0 (index may be incomplete) | no |
| P14 | Risk band ▲/◆/⛔/✓/⏱/?, full width ≥16 px, risk owns the border | missing | ReviewCardFrame | Only rarity borders ([Card.jsx#L68](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L68)), incl. pulsing `glitched` | C11 |
| P15 | Forced standard/common/dark; no pulse; never "glitched"/"ultra-rare" | partial | derive.js | Fields `frame`/`rarity`/`type` exist and can be set; pulse lives in `glitched` ([Card.jsx#L68](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/Card.jsx#L68)) | C11 |
| P16 | Dex list mode, default queue view | missing | Dex | Dex is grid-only ([App.jsx#L364](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/App.jsx#L364)) | C14 |
| C15 | (v0.3.2) telemetry = ids, hashes, codes only (Compliance MF-8, no-PII telemetry) | Validation/parse failures log the raw stored deck JSON and parser messages | `deckValidation.js` L29–L36 @ `dc85159`; `consoleTelemetry.js` passes meta through | Log `{code, raw_length, raw_sha256?}`; the adapter drops other keys (AC36, T57) |
| P17 | Mode lock: REVIEW MODE chip + Exit | missing | App shell | Nothing | no |
| P18 | Reserved-deck guards (create/duplicate/setDeck) | partial | usePersistedDeck | `createDeck`/`duplicateDeck` exist ([usePersistedDeck.js#L129](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js#L129), [#L145](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js#L145)); no guards | no |
| P19 | `reviewSchemaVersion` next to `schemaVersion 2.1` | partial | aetherConfig | `schemaVersion: '2.1'` ([aetherConfig.js#L3](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/config/aetherConfig.js#L3)) | no |
| P20 | Merge-state flags `PR_DRAFT`, `MERGE_CONFLICT`, `CHECK_FAILING`, `CHANGES_REQUESTED`, `CHECKS_PENDING`, `BEHIND_BASE`, `REVIEW_REQUIRED`, `MERGE_STATE_UNCLEAR` with band + Seal mapping (K14) | missing | reviewRules / reader | No PR or flag code in the clone (grep for `mergeable`, `draft`, `CHANGES_REQUESTED` in `src/` finds nothing PR-related) | no |
| P21 | CLEAN invariant: band never CLEAN while any merge-state condition holds; unexplained non-clean merge state fails closed | missing | deriveBand (planned) | Nothing | no |
| P22 | Verdict line `NO-MERGE` / `NOT YET` / `OK` under the band, derived only; OK only if CLEAN + fresh | missing | ReviewCardFrame, portal (planned) | Nothing in the clone; Web Dev reports a local prototype with these words (not read by this review, which stays at `dc85159`) | no |

### §7 v0.3 security + read-only data path (spec §0, §2, §5; Architect, Compliance, GitHub)

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| X1 | GitHub reads only via server; no token in the browser | missing | Outbox reader | App makes no network calls at all (no `fetch` in src) | no |
| X2 | Fine-grained read-only token, named repos, server secret store | missing | Outbox | Nothing | no |
| X3 | Stale >10 min or 403/404 checks → Seal disabled | missing | Outbox + UI | Nothing | no |
| X4 | Seal hash: sha256(JCS) binds head + base SHA + checks/reviews snapshot | missing | Outbox | No hashing in src | no |
| X5 | Push/check/review change burns the seal (webhooks + pre-send re-fetch) | missing | Outbox | Nothing | no |
| X6 | Merge-request handoff: expected head SHA + idempotency key; bot pins `sha=` | missing | publisher → GitHub bot | Nothing | no |
| X7 | Request changes = draft review, never auto-posted | missing | Outbox | Nothing | no |
| X8 | Bots submit-only; greyZ session + per-seal WebAuthn | missing | Outbox | No auth in repo | no |
| X9 | Verify at issue + before send; atomic token consume + audit | missing | publisher | Nothing | no |
| X10 | Hash-chained, fixed-field audit kept out of git | missing | Outbox audit | Only a console telemetry adapter ([consoleTelemetry.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/adapters/consoleTelemetry.js)) **v0.3.1:** hashes only in lines; body + segment tombstones keep the chain verifiable (spec §2.6, proposal) | no |
| X11 | Kill switch `publishing_enabled`, checked at seal + send | missing | Outbox | Nothing | no |
| X12 | Lint at submit/seal/send; `EXPLOIT_DETAIL` hard; `UNPATCHED` | missing | Outbox | Nothing | no |
| X13 | Untrusted text as plain text only | partial | portal | React escapes text; grep finds no `dangerouslySetInnerHTML` in src; no field allowlist | no |
| X14 | CSP + no remote assets | missing | index.html, GlitchStyles | No CSP in `index.html`; remote noise texture ([GlitchStyles.jsx#L28](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/components/GlitchStyles.jsx#L28)) | C13 |
| X15 | No review data in localStorage/sessionStorage/IndexedDB; Android `allowBackup` off | missing | usePersistedDeck, AndroidManifest | Decks persist to localStorage ([usePersistedDeck.js#L80](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js#L80)); `android:allowBackup="true"` ([AndroidManifest.xml#L5](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/android/app/src/main/AndroidManifest.xml#L5)) | C12 |
| X16 | Green CI baseline (PR-0 on tarot PR #40) | partial | .github/workflows | PR #40 (read via the API 2026-10-28): open, head `dedc109`, base main@`ed9566b`, checks build ✓ / e2e ✓ / deploy skipped (run 35311145475), `mergeable_state: blocked` (needs 1 approval; base is behind current main). That main CI fails at dc85159 comes from GitHub R1 and was not re-read here | no |
| X17 | `feat/review-queue` ruleset with required checks (recommendation) | missing | GitHub settings | Per GitHub R1: branch + ruleset don't exist; `def` has no required checks and is bypassable (not re-read here: admin API) | no |
| X18 | Telemetry meta whitelist (K13) | partial | consoleTelemetry | Adapter exists ([consoleTelemetry.js](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/adapters/consoleTelemetry.js)); no whitelist. **v0.3.2:** raw payloads are logged today, see X27 | C15 |
| X19 | Seal stores canonical content in a write-once body store; re-hash = `content_hash` (Legal must-fix 1) | missing | Outbox | Nothing (no server in the clone) | no |
| X20 | Alert seal binds sorted source ids; company-naming sentences need a verified primary source (must-fix 3) | missing | Outbox, lint | Nothing | no |
| X21 | Outreach seal: lawful basis, data source, suppression `clear`, Art 21 notice detected (must-fix 2) | missing | Outbox | Nothing | no |
| X22 | Seal records greyZ's editorial responsibility; AI disclosure on AI-assisted public alerts (must-fix 6; Art 50(4) not verified on EUR-Lex) | missing | Outbox, seal sheet | Nothing | no |
| X23 | Retention 1 y / 30 d / 14 d, rejected body purged at 14 d, tombstones (proposal awaiting greyZ's yes) | missing | Outbox audit + body store | Nothing | no |
| X24 | Snooze helpers `localTonight` / `localTomorrow`; no city names in identifiers | missing | review/time.js (planned) | No time code in the clone | no |
| X25 | Real review data only via the authenticated `aether-outbox` reader or a gitignored DEV-only loader; public repo = synthetic fixtures only (K15) | missing | adapters (planned), .gitignore | [.gitignore](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/.gitignore) has no `src/fixtures/local/` entry; no review data source exists | no |
| X26 | CI fixture scan (allowlist/denylist) + `src/fixtures/local/` build guard + `build/` denylist grep (K15) | missing | .github/workflows, vite config | No gitleaks / fixture scan / build guard in `.github` or `vite.config` at `dc85159` (grep) | no |
| X27 | Telemetry logs ids, hashes and error codes only; never the payload | missing | deckValidation, consoleTelemetry | **Conflict, verified in the clone at `dc85159`:** [deckValidation.js#L29-L36](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/deckValidation.js#L29-L36) logs `{ raw }` on `DECK_VALIDATION_FAILED` and `{ raw, error: err.message }` on `DECK_PARSE_FAILED`. [consoleTelemetry.js#L3-L11](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/adapters/consoleTelemetry.js#L3-L11) passes `meta` to the console unfiltered. Related: [usePersistedDeck.js#L16-L17](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/hooks/usePersistedDeck.js#L16-L17) logs `e.message` from parsing (may echo payload text) | C15 |

### §8 v0.3 acceptance criteria

| Req ID | Requirement | Status | Owning view / component | Evidence | Conflict with v2.1 |
|---|---|---|---|---|---|
| AC12 | Seal binds head/base SHA + snapshot; push burns it | missing | spec §11 | See X4/X5 | no |
| AC13 | Never merges; handoff with expected SHA + idempotency key | missing | spec §11 | See X6 | no |
| AC14 | Request changes = draft only | missing | spec §11 | See X7 | no |
| AC15 | No token in client; read-only allowlisted; stale disables Seal | missing | spec §11 | See X1–X3 | no |
| AC16 | Portal facts linked; caps; unsourced hidden | partial | spec §11 | `line-clamp-3` only (P10) | no |
| AC17 | prSpread 9 positions; mobile rows; gaps "not fetched" | partial | spec §11 | celticCross grid (P4, P8) | no |
| AC18 | 375 px glance test | missing | spec §11 | No band, stats 10 px | no |
| AC19 | No glitched/ultra-rare/pulse/colour-only on review surfaces | missing | spec §11 | Default rarity styles pulse (P15) | C11 |
| AC20 | Bots can't seal/undo/reject; WebAuthn seal | missing | spec §11 | See X8 | no |
| AC21 | Verify issue + send; atomic consume + audit | missing | spec §11 | See X9 | no |
| AC22 | Hash-chained audit outside git | missing | spec §11 | See X10 | no |
| AC23 | Kill switch fail-closed | missing | spec §11 | See X11 | no |
| AC24 | No review data in browser storage; allowBackup off | missing | spec §11 | See X15 | C12 |
| AC25 | CSP; no remote assets; plain text | missing | spec §11 | See X13/X14 | C13 |
| AC26 | Lint at submit/seal/send; hard blocks ×3; UNPATCHED | partial | spec §11 | Banlist-at-boundary pattern ([rulesets.js#L16](https://github.com/k-dot-greyz/glitchworks-tarot/blob/dc85159/src/domain/rulesets.js#L16)) | no |
| AC27 | Seal stores canonical content; publisher sends those bytes | missing | spec §11 | See X19 | no |
| AC28 | Alert seal binds source ids; unsourced company claim blocks | missing | spec §11 | See X20 | no |
| AC29 | Outreach lawful basis / source / suppression / Art 21 | missing | spec §11 | See X21 | no |
| AC30 | Editorial responsibility + AI disclosure | missing | spec §11 | See X22 | no |
| AC31 | Purge + segment deletion keep the chain verifiable; 14 d rejected purge | missing | spec §11 | See X23 | no |
| AC32 | `localTonight` / `localTomorrow`, DST-safe | missing | spec §11 | See X24 | no |
| AC33 | Merge-state flags disable Seal (UI + server); never CLEAN while any holds | missing | spec §11 | See P20/P21 | no |
| AC34 | Derived verdict line; OK only when CLEAN + fresh; 375 px glance | missing | spec §11 | See P22 | no |
| AC35 | No real data in public repo/build/artefacts; CI fixture scan + build guard | missing | spec §11 | See X25/X26 | no |
| AC36 | Telemetry: ids, hashes, codes only | missing | spec §11 | See X27 | C15 |

## Conflicts (against v2.1 surrogates; v2.1 wins)

Canonical v2.1 text was **not readable** (see header). Each item cites the surrogate it rests on. v0.2 aligns to the surrogate. If greyZ supplies the real v2.1 and it differs, these get re-checked.

| # | v0.1 said | v2.1 (surrogate) says | Source | v0.2 change |
|---|---|---|---|---|
| C1 | `type` = security_alert / outreach / pr_push | Card `type` = elemental core (void, fire, water, electric, wind, dark). Drives colour and clash advantage | `validateCard` requires `type`; Forge element select; dev-master aether-deck README "Element Types" | Ours becomes `review.kind`. Card `type` is derived from kind with a fixed table (security_alert→`fire`, outreach→`wind`, pr_push→`electric`) so v2.1 rendering keeps working. **v0.3:** every review card is `type: 'dark'` (neutral grey). Kind = icon + label. Fixes the electric/fire vs amber/red collision (Design QA) |
| C2 | `id` = ULID, the item's identity | Card `id` = deck-scoped string id assigned by Forge (`maxId+1`, zero-padded) | `forgeCard` in `deckState.js`; `validateCard` | Card `id` stays v2.1 (deck-local, display only). The immutable ULID lives in `review.item_id` and is the only id the server, tokens and audit use |
| C3 | Item has no stats; text is `draft.title/body` | Card **requires** `name`, `sub`, `desc` strings and `stats {atk, def, spd}` numbers; stats are Action / Resilience / Momentum | `validateCard`; dev-master aether-deck README "Stats Mapping" | Required fields are **derived**, never typed in: `name` = draft title or target label, `sub` = `channel · kind`, `desc` = first 140 chars of body. `stats.atk` = risk (0–99 from flag severities), `stats.def` = % sources verified, `stats.spd` = urgency (time to expiry). Meaning of stats is still Action/Resilience/Momentum. **v0.3:** shown as text **RISK / VERIFIED / DUE** (≥14 px) by the wrapper with `hideStats: true`. PR: RISK = flags + size, VERIFIED = % checks passing, DUE = hours to decision due |
| C4 | Night mode: dark theme default after 20:00 local | App is dark-only, with glitch/CRT/noise aesthetics as user sliders | `docs/SPEC.md` "aesthetics (glitch / CRT / noise)"; root `bg-slate-950` | Time-based theme switch removed (always dark). Global sliders untouched. Added rule: review text (flags, sources, draft, action bar) never gets `glitch-text`/animation classes, so the effects never garble safety content |
| C5 | Queue order = soonest expiry first, one card at a time | Oracle = random spread (Fisher-Yates `drawSpread`), layouts threeCard / celticCross / theClash | `deckState.js drawSpread`; Oracle layout select | Random layouts unchanged. New **additive** Oracle layout `triage` draws 1 card in deterministic `expires_at` order. Randomness is never used for the queue |
| C6 | A standalone queue app with its own screens | Four views: Dex, Arena, Oracle, Forge | `docs/SPEC.md`; `App.jsx` nav | Every feature that fits is placed in one of the four. Exactly one NEW nav tab, `outbox` (hold/undo, posted, failed, audit), is proposed as a v2.1 extension, and it's open decision D2. **v0.3:** now D1. Default: **no tab** in phases 0/1 (Product + Web Dev); Architect wants a flagged tab |
| C7 | (v0.3) PR spread = deterministic, 9 fixed positions | Oracle = random `drawSpread` with fixed counts 3/4/5 | `App.jsx handleDrawSpread` L208; `deckState.js` | Additive layout `prSpread` + `composePrSpread`; tarot layouts and `drawSpread` untouched |
| C8 | (v0.3) every card opens a portal from any view | Dex modal is Dex-only, tap = flip; Oracle tap = reveal | `App.jsx` L1370–1400, `renderOracleZone` L661 | Review spreads are dealt face-up; tap = portal. Tarot tap/flip unchanged |
| C9 | (v0.3) 7+ PR signals | Card shows 3 icon-only numeric stats | `Card.jsx` L207; `validateCard` | Numeric stats still filled (validator passes); text stats + chips in the wrapper |
| C10 | (v0.3) sidecars are cards but not deck members | Spreads draw cards from the active deck | `handleDrawSpread` | Sidecars are ephemeral, built per PR, never stored |
| C11 | (v0.3) risk owns the border; no pulse | Element colours, rarity (`glitched` pulses), frames are the card's look | `Card.jsx` L68; `elemental.js getTypeColor` | Review cards forced `dark`/`standard`/`common`; band + ring in `ReviewCardFrame`; Card.jsx unchanged |
| C12 | (v0.3) no review data in browser storage (RQ-9) | All decks persist to localStorage `aether-decks` | `usePersistedDeck.js` L9/L80; `localStorageDeckStorage.js` | Reserved decks stripped before save, memory-only; tarot persistence unchanged |
| C13 | (v0.3) CSP `default-src 'self'`, no remote assets | Noise aesthetic loads a remote SVG | `GlitchStyles.jsx` L28 | Same texture, bundled locally (O9) |
| C14 | (v0.3) queue = list | Dex = card grid | `App.jsx` L364 | List mode added; default only for reserved decks |

Tension (not v2.1, flagged so nobody is surprised): `docs/KERNEL.md` (proposed, unapproved) refuses "modeling the general case as `AetherCard` with optional fields". v0.2 adds a single optional `review` block, the same way the repo already added `frame/hat/rarity/ability` (PR #19). If KERNEL is approved later, `review` moves into a separate content pack/template rather than living on the card.
