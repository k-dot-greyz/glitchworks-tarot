# REVIEW-QUEUE-SPEC v0.2 (draft, extends Aether Deck / glitchworks-tarot)

Owner: Product. Status: proposal, pending greyZ lock-in. Base: `k-dot-greyz/glitchworks-tarot` @ `dc851590583b50b54ea0dc4aa500ca8a4033edb8`. Gap analysis: `GAP-MATRIX.md` (same folder). Previous version: `REVIEW-QUEUE-SPEC-v0.1.md`.
Principle (unchanged): **nothing leaves without a human approval that is single-use, bound to an exact content hash, and recorded.** The queue fails closed: if anything is missing or unverifiable, the card can't be sealed.

> **v2.1 caveat.** The canonical v2.1 deck spec (`dev-master: dex/08-projects/Glitchworks Tarot-Aether Deck Spec.md`) was **not found** at dev-master `43ff86cb29446702a2b46f769dd49f4ca5a7bc2b`. v0.2 aligns to the v2.1 contract as the code enforces it at dc85159 (`validateCard`, four views, `schemaVersion: '2.1'`, `docs/SPEC.md` summary) and to the dev-master `aether-deck` example. See D1.

## Changelog v0.1 → v0.2
- **Reframed as an extension of the Aether Deck app**, not a new app. Every feature now has an owning view (Dex / Oracle / Forge / Arena). One clearly marked **NEW** view (`outbox`) and one **NEW** server service (Outbox) cover what has no home in the app.
- **Item = Card.** The schema is now a v2.1 Card plus one optional `review` block (same pattern as the existing `frame/hat/rarity/ability` extras). v2.1 required fields (`id, name, sub, type, stats, desc`) are derived from the item (§1.2).
- **Renamed to avoid v2.1 collisions:** item `type` → `review.kind` (Card `type` stays the elemental core); item ULID → `review.item_id` (Card `id` stays the deck-local id). Approve → **Seal** in UI copy, so the seal token is distinct from deck "draw".
- **Night mode:** dropped the time-based dark switch because the app is dark-only. Added: no glitch/animation classes on safety content (flags, sources, draft, action bar).
- **Queue order:** new deterministic Oracle layout `triage` (expiry order). Random spreads untouched.
- **Fail-closed exception** to the repo's "graceful degradation" rule (CONTRIBUTING §2.6) for the review path. Approval state never lives in `localStorage`.
- Gates, ACs and tests kept. IDs unchanged; wording mapped to app terms and `aether-review-*` test ids added.
- Open decisions replaced. v0.1 D1–D3 (hold 60 s, expiry 24 h/7 d/72 h, batch approve rules) are now **adopted defaults** (§7). New D1–D3 cover the v2.1 source, the NEW view and where the approval core lives.

## 0. Scope
In: security-alert posts (Marketing, CISA KEV / NVD sourced), client outreach drafts (Sales, passive-audit playbook), later PR push requests (bots).
Out (v0.2): the posting adapters' internals, analytics, multi-reviewer approval. Single reviewer = greyZ.

**Architecture (who owns what)**
| Layer | Where | Status |
|---|---|---|
| Card UI, queue, triage, edit, diff | glitchworks-tarot `src/App.jsx` views + `src/components/Card.jsx` | extend |
| Review rules (flag codes, hard blocks, holds, expiry) | `src/domain/reviewRules.js`, serializable data like `src/domain/rulesets.js` | NEW file, existing pattern |
| Review client | `src/adapters/reviewQueueApi.js` behind an injectable `reviewQueue` prop (like `storage`, `telemetry`) | NEW file, existing pattern (CONTRIBUTING §2.2) |
| Audit sink | `telemetry` interface, server adapter `src/adapters/serverAuditTelemetry.js` | NEW adapter, existing interface |
| **Outbox service** (hash, seal token, source checker, expiry clock, audit store, posting adapters) | server side, outside the SPA (see D3) | **NEW** |

The SPA is a client only. It can request transitions; the Outbox service decides them. The client never holds a reusable token and never computes the authoritative hash.

## 1. Card schema (v2.1 Card + `review` extension)

### 1.1 `review` block (new, optional on Card; required for cards in review decks)
| Field | Type | Req | Notes (v0.1 name) |
|---|---|---|---|
| `review.item_id` | string (ULID) | yes | immutable identity for server, seal token and audit (was `id`) |
| `review.kind` | enum `security_alert` \| `outreach` \| `pr_push` | yes | (was `type`; renamed for v2.1, see C1) |
| `review.channel` | enum `x` \| `linkedin` \| `email` \| `github` \| `blog` | yes | |
| `review.target` | object | yes | recipient / account / repo+branch; for `outreach` company + contact role only |
| `review.draft` | `{title?, body, attachments[]}` | yes | channel length limits checked |
| `review.content_hash` | sha256 of canonical `channel+target+draft` | yes | computed by the Outbox service only |
| `review.sources[]` | `{url, label, kind: cisa_kev\|nvd\|vendor_advisory\|public_page\|repo\|other, verification: verified\|unverified\|failed\|stale, checked_at, evidence_note}` | yes (≥1 for alert/outreach) | set by the checker, not the drafting bot |
| `review.claims[]` | `{text, source_ref[]}` | yes for alert/outreach | unmapped claim → flag |
| `review.risk_flags[]` | `{code, severity: red\|amber, detail, auto}` | yes (may be empty) | codes below |
| `review.created_by` | `{bot_id, bot_name, run_id}` | yes | |
| `review.created_at` / `review.expires_at` | RFC 3339 UTC | yes | UI shows local time; default expiry §7 |
| `review.state` | enum (§2) | yes | **server-authoritative**; client copy is a read cache |
| `review.seal` | `{token_id, content_hash, sealed_at, sealed_by, used}` \| null | no | (was `approval`). The client sees only `token_id`; the token secret stays server-side |
| `review.post_result` | `{posted_at, external_url, adapter_response}` \| null | no | |
| `review.audit_ref` | string | yes | pointer to the server audit stream. Entries are not stored on the card (was `audit[]`) |

**Risk flag codes** (unchanged, live in `reviewRules.flagCodes`): `NAMES_COMPANY`, `UNVERIFIED_CLAIM`, `SOURCE_FAILED_OR_STALE`, `PII`, `EXPLOIT_DETAIL`, `OUTBOUND_TO_NEW_CONTACT`, `LEGAL_SENSITIVE`, `PR_PROTECTED_BRANCH`. Severities and meanings are as in v0.1. `reviewRules.hardBlocks = ['PII', 'PR_PROTECTED_BRANCH']`, the review analog of `rulesets.*.bannedCardIds`.

### 1.2 v2.1 required Card fields: derived, never typed in
| Card field (v2.1) | Value for a review card |
|---|---|
| `id` | deck-local id (as Forge assigns today); display only |
| `name` | `draft.title`, else the target label |
| `sub` | `` `${channel} · ${kind}` `` |
| `type` (element) | fixed table: `security_alert`→`fire`, `outreach`→`wind`, `pr_push`→`electric` |
| `stats.atk` (Action) | risk 0–99 from flag severities (red 40, amber 15, cap 99) |
| `stats.def` (Resilience) | % of sources `verified` |
| `stats.spd` (Momentum) | urgency 0–99 from time left to `expires_at` |
| `desc` | first 140 chars of `draft.body` |
| `rarity` | `glitched` if any red flag, `ultra-rare` if amber only, `common` if clean (the colour band) |
| `image`, `icon` | per `kind` from a config table (zero hardcoding, CONTRIBUTING §2.1) |

`validateCard` keeps passing unchanged. A new `validateReviewCard` (in `src/domain/deckValidation.js`) adds the §1.1 checks at the same boundary.

### 1.3 Decks
- `review-queue`: cards in `needs_review` / `snoozed`. Reserved, can't be renamed or deleted (guard in `usePersistedDeck` `renameDeck`/`deleteDeck`).
- `review-archive`: terminal cards (`posted`, `rejected`, `expired`), read-only.
- Both decks are hydrated from the Outbox service (CONTRIBUTING §2.5), not from `localStorage`. The local copy is a cache for display only.

## 2. States and transitions (enforced by the Outbox service)
State machine and rules are **unchanged from v0.1**, with renames: approve → **seal**, token → **seal token**. The client sends intents; the service validates them like the KERNEL `legal()`/`reduce()` model: an illegal intent changes nothing and is logged.

```
draft → needs_review → sealed → holding → posting → posted
                     ↘ edited → needs_review
                     ↘ rejected (terminal)
                     ↘ snoozed → needs_review (at snooze_until)
any non-terminal     → expired (terminal, at expires_at)
sealed/holding       → needs_review (undo or edit; seal token burned)
posting              → post_failed → needs_review (no auto-retry)
```

| From | Intent / event | To | Rules | Triggered from (view) |
|---|---|---|---|---|
| draft | bot submits | needs_review | `validateReviewCard` + hash + source check + flags; else stays draft with errors | bot → Outbox API |
| needs_review | seal | sealed | §4 gates pass; mints single-use seal token bound to `content_hash` | Dex review sheet / Oracle triage |
| needs_review | edit (re-compile) | needs_review | new hash, flags+sources rechecked, audit `edited` | Forge (edit mode) |
| sealed / holding | edit | needs_review | **seal revoked**, token burned | Forge (edit mode) |
| sealed | hold starts | holding | hold window §7 | Outbox service |
| holding | undo | needs_review | token burned, nothing sent | NEW `outbox` view / toast |
| holding | window ends | posting → posted | adapter re-checks token unused + hash match; marks used **before** send | Outbox service |
| posting | adapter error | post_failed → needs_review | no auto-retry; new seal needed | Outbox service |
| needs_review | reject (reason required, preset list ok) | rejected | terminal | Dex review sheet / Oracle triage |
| needs_review | snooze (1h / tonight / tomorrow) | snoozed | can't pass `expires_at` | Dex review sheet / Oracle triage |
| any non-terminal | clock ≥ `expires_at` | expired | terminal; resubmit = new card via Forge "mint" | Outbox service |

**Audit entry** (every event incl. source views): `{at, actor (greyZ|bot_id|system), action, from_state, to_state, content_hash_before, content_hash_after, diff?, reason?, device, client_ip_hash}`. Append-only in the Outbox audit store, JSONL export. The app emits them through the existing `telemetry.log(level, event, meta)` interface, with event names `REVIEW_*` (e.g. `REVIEW_SOURCE_VIEWED`, `REVIEW_SEALED`). The server adapter is authoritative; the console adapter stays for dev only.

**Single-use:** unchanged. One token per seal, consumed at send; reuse refused and logged `token_reuse`. A seal never carries over to an edited or resubmitted card.

## 3. Views, card layout and flow (mobile-first, night use)

### 3.1 Owning views
| Feature | Owning view | Extends |
|---|---|---|
| Queue + history list, grouping, sort, multi-select, batch | **Dex** (deck select → `review-queue` / `review-archive`) | Dex grid + `aether-deck-select` |
| Card review sheet (§3.2) | **Dex** card modal (`aether-modal-card`) | modal + `Card.jsx` |
| One-at-a-time triage with gestures/keys | **Oracle**, new layout `triage` (1 card, `expires_at` order) | `oracleLayout` select, face-down reveal |
| Edit / resubmit | **Forge**, edit mode: "LOAD ENTITY" from a review card; button reads **RECOMPILE → REVIEW** | Forge live preview + `compileForgeCard` (needs an update-in-place path) |
| Diff of edit vs sealed version | **Arena**: slot Alpha = last sealed/previous version, Omega = edited; the "clash" shows the diff. Combat off for review rulesets | Arena slots |
| Hold countdown + undo, posted, post_failed, audit export | **NEW view `outbox`** (5th nav tab, D2) | none (nothing fits) |

### 3.2 Card review sheet (top to bottom, unchanged order)
1. Header strip (`Card.jsx` header): kind icon + channel + target · bot · "expires in 5h" countdown. Colour band = `rarity` per §1.2.
2. **Flags block**: full width, red/amber, one line per flag, not collapsible.
3. **Sources block**: label, domain, badge ✓/?/✗/⏱, checked-at; tap opens in-app reader; tap a claim → highlights its source. Each source is a face-down chip until opened; opening is tracked like Oracle `revealedCardIds` and logged.
4. Draft preview as the channel renders it (char count vs limit); `pr_push`: repo, branch, diff stat, PR link.
5. Sticky bottom action bar in thumb reach (same fixed-bottom + safe-area pattern as `aether-nav`): **Reject · Snooze · Edit · Seal**.

Readability rule: elements 2–5 never get `glitch-text` or animation classes and use large type (≥16 px body). CRT/noise overlays still follow the user's Settings sliders (v2.1 aesthetic).

### 3.3 Gestures / keys (Oracle `triage` and Dex review sheet)
| Action | Swipe | Key |
|---|---|---|
| Seal | right (only flag-free; else opens confirm sheet) | `A` |
| Reject | left → reason sheet | `R` |
| Snooze | down | `S` |
| Edit (→ Forge) | tap body | `E` |
| Next / prev | up / — | `J` / `K` |
| Open source n | — | `1`–`9` |
| Undo (in hold) | toast button | `U` / `Cmd-Z` |

Implemented as pointer events (the app's existing drag-and-drop is mouse-oriented and is not reused for this).

### 3.4 Batch (Dex, `review-queue` deck)
List mode toggle on Dex: grouped by `review.kind`, sorted by `expires_at` soonest first. Row = kind, target, first line, flag dots, expiry. Multi-select allows **reject, snooze only**. Batch seal is allowed only for zero-flag, all-verified cards, max 10, with a summary sheet (§7).

### 3.5 Night use
App is dark-only (v2.1), with no time-based switch. Large type per §3.2, no sounds (the app has none), **300 ms input lockout** after the card changes in triage or the sheet (generalises the `isClashing` re-entrancy guard).

## 4. Safety gates (unchanged intent, mapped to app terms)
1. **Sources before seal**: Seal disabled until the sources block has been in view on this card, and with any red flag, until each red-flagged source chip has been revealed once. Logged `REVIEW_SOURCE_VIEWED`.
2. **Red flags unmissable**: `glitched` band + flags block first + count on the button ("Seal with 2 flags").
3. **No one-tap seal with flags**: any flag → confirm sheet with one checkbox per flag; red adds a 1.5 s press-and-hold. `reviewRules.hardBlocks` (`PII`, `PR_PROTECTED_BRANCH`) **can't be sealed**, only edited or rejected. Enforced at the client boundary (like `bannedCardIds`) **and** re-checked by the Outbox service.
4. **Hold + undo**: after sealing, the card sits in `holding` (§7, default 60 s) with countdown + Undo. The hold runs server-side, so closing the app doesn't cancel it; Undo is reachable from the `outbox` view and a toast.
5. **Re-verification at seal time**: sources older than 24 h are re-checked; any flip to failed → refused, `SOURCE_FAILED_OR_STALE` added.
6. **Fail closed**: if the checker, hash service or audit store is unreachable, Seal is disabled with the reason shown. **Exception to CONTRIBUTING §2.6:** the review path never falls back to defaults or cached state for anything that grants a seal.
7. **Expired cards can't be revived**, only re-minted as new via Forge.

## 5. Acceptance criteria (IDs unchanged)
- AC1 A card missing any required v2.1 or `review` field never reaches `needs_review` (`validateCard` + `validateReviewCard`, client and server).
- AC2 Seal is impossible before the sources block is viewed (and red-flag source chips revealed).
- AC3 Any flag → no single-gesture seal; red → acknowledge + hold; `PII` / `PR_PROTECTED_BRANCH` → no seal at all.
- AC4 Any edit (Forge recompile) after a seal revokes it and returns the card to `needs_review` with a new hash.
- AC5 A seal token posts at most once; content whose hash differs from the sealed hash is never posted.
- AC6 Undo during hold sends nothing and returns the card to review.
- AC7 Cards past `expires_at` become `expired` and can't be sealed or posted.
- AC8 Every action creates exactly one audit entry; the log can't be altered through the UI or API.
- AC9 Batch seal rejects any selection containing a flagged or unverified card.
- AC10 Works one-handed on a 375 px phone (Capacitor Android + web) and on iPad, with keyboard shortcuts on iPad with keyboard. Playwright gains phone and iPad projects (today: Desktop Chrome only).
- AC11 Times shown in local time, stored UTC.

## 6. Test cases (IDs unchanged; Vitest/RTL + Playwright, test ids `aether-review-*` per docs/TESTIDS.md)
| # | Setup | Action | Expected |
|---|---|---|---|
| T1 | clean alert, 2 verified sources | open in Oracle triage, scroll sources, swipe right | holding 60 s → posted; audit: source_viewed, sealed, posted |
| T2 | same | swipe right before sources viewed | refused, hint "check sources first" |
| T3 | alert with `UNVERIFIED_CLAIM` | swipe right | confirm sheet; needs ack + hold |
| T4 | outreach containing an email address | try seal | hard block `PII`; only edit/reject |
| T5 | sealed card | Forge: edit one char, recompile | seal revoked, needs_review, new hash; Arena shows the diff |
| T6 | sealed, holding | Undo in `outbox` at 30 s | nothing sent, needs_review |
| T7 | posted card | replay same seal token | refused, logged `token_reuse` |
| T8 | `expires_at` passes while snoozed | — | expired; gone from `review-queue`, visible in `review-archive` |
| T9 | source returns 404 at seal time (>24 h old) | seal | refused, `SOURCE_FAILED_OR_STALE` added |
| T10 | batch of 5 clean + 1 flagged | batch seal in Dex | refused, flagged card named |
| T11 | adapter returns 500 | post | post_failed → needs_review, no retry |
| T12 | audit store down | open card | Seal disabled, reason shown (no fallback to cache) |
| T13 | pr_push to `main` | seal | hard block `PR_PROTECTED_BRANCH` |
| T14 | double-tap right after card change | — | 300 ms lockout, no seal |
| T15 | snooze past expiry | "tomorrow" on a card expiring tonight | option disabled |
| T16 (new) | review card in localStorage tampered to `state: sealed` | reload | client ignores it; state re-hydrated from Outbox; nothing posted |
| T17 (new) | review card rendered | inspect | `validateCard` passes (v2.1 derived fields present); no `glitch-text` on flags/sources/draft |

## 7. Adopted defaults (were open decisions D1–D3 in v0.1; greyZ can change any of them)
- Hold window **60 s** for security_alert and outreach; `pr_push` **0 s**.
- Default expiry **security_alert 24 h**, **outreach 7 d**, **pr_push 72 h**.
- Batch seal **only zero-flag, all-verified, max 10, with summary confirm**.

## 8. Open decisions for greyZ (max 3)
- **D1 Where is the canonical v2.1 deck spec?** It's missing at `dex/08-projects/Glitchworks Tarot-Aether Deck Spec.md` in dev-master `43ff86c`. **Default:** treat the v2.1 contract enforced in code at dc85159 (`validateCard`, four views, dark glitch aesthetic) plus the dev-master `aether-deck` example as binding, and re-run the conflict check when the file turns up.
- **D2 Add a 5th nav tab `outbox` (NEW view)?** v2.1 defines four views; hold/undo, posted/failed and audit export fit none of them. **Default:** yes, one NEW `outbox` tab, marked as a v2.1 extension. Alt: put it in a Dex deck filter (`review-holding`), which hides the live countdown.
- **D3 Where does the approval core run?** The app has no backend (client-only, `localStorage`). **Default:** a NEW server-side Outbox service owns hash, seal tokens, source checks, expiry clock, audit and posting adapters; glitchworks-tarot is a client through a `reviewQueue` adapter. Alt: a separate repo for the service, sharing only `Card.jsx`.

## Not decided here (flag, not advice)
Whether naming a company as vulnerable in public posts or cold outreach carries legal/defamation or unauthorized-scanning risk: route to **Legal + Compliance before the first live post naming a company**. Passive-audit evidence must be public-only.
