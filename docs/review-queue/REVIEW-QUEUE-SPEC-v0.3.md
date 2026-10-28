# REVIEW-QUEUE-SPEC v0.3 (draft): Aether Deck as a decision surface for git PRs

Owner: Product. Status: proposal, pending greyZ lock-in. Base: `k-dot-greyz/glitchworks-tarot` @ `dc851590583b50b54ea0dc4aa500ca8a4033edb8`.
Companions (same folder): `GAP-MATRIX.md`, `SPREAD-LAYOUT.md` + `SPREAD-LAYOUT.svg`, `IMPL-PLAN.md` (Web Dev), `roundtable/*.md` (R1: Product, Web Dev, Design QA, Architect, Compliance, GitHub). Previous versions: `REVIEW-QUEUE-SPEC-v0.2.md`, `REVIEW-QUEUE-SPEC-v0.1.md`.

Principle: **nothing leaves and nothing merges without greyZ's own signed approval. That approval is single-use, bound to the exact content and PR head, and recorded in a tamper-evident log.** Decisions fail closed. **The app never merges, never posts, never holds a GitHub token, and never stores review data in the browser.**

> **v2.1 binding (v0.2 D1, resolved by no answer).** The canonical v2.1 deck spec (`dev-master: dex/08-projects/Glitchworks Tarot-Aether Deck Spec.md`) was not found at dev-master `43ff86cb29446702a2b46f769dd49f4ca5a7bc2b`. greyZ gave no answer, so **the in-repo stand-ins stay binding**, labelled "v2.1 (surrogate)": `validateCard` (`src/domain/deckValidation.js`), the four views, `schemaVersion: '2.1'` (`src/config/aetherConfig.js`), the `docs/SPEC.md` summary, and the dev-master `aether-deck` example. For stack facts, `package.json` wins over the docs. No conformance to the real v2.1 is claimed. If the file turns up, re-run GAP-MATRIX "Conflicts" and IMPL-PLAN §2.

## Changelog v0.2 → v0.3
- **Pivot to a PR decision surface.** New kind `pull_request` (absorbs `pr_push`). Each PR is a central card with **sidecar cards** around it in a new Oracle spread `prSpread`. `security_alert` and `outreach` stay as other `review.kind`s.
- **Every card is a portal:** a true modal (focus trap, Esc, deep link) that grows out of the Dex card popup. It shows a summary first, capped text, and a references index of SHA-pinned URL buttons.
- **Seal = greyZ's WebAuthn signature** over the seal payload. That payload covers item, content hash, action, target incl. base+head SHA, approver, expiry, single-use id, rules hash and key id, hashed as sha256 over RFC 8785 JCS. The seal is verified at issue and again right before send. The token is consumed and the audit line written atomically before anything goes out. Bots get **submit-only** credentials. (Architect, Compliance RQ-1/RQ-2.)
- **Seal → merge request only.** The handoff to the GitHub bot carries the expected head SHA and an idempotency key. The bot re-checks, asks greyZ for an explicit yes, and merges with `sha=` pinned. The server never merges. **Request changes = a draft review for greyZ**, never auto-posted. (GitHub.)
- **Read-only GitHub path:** server-side fine-grained token, read-only, limited to named repos. A snapshot older than **10 min**, or checks that can't be verified (403/404), disables Seal.
- **New safety rules:** kill switch `publishing_enabled` (RQ-5); hash-chained audit kept out of git (RQ-4); plain-text rendering, a CSP, and a locally bundled noise texture (RQ-6); new `UNPATCHED` flag; `EXPLOIT_DETAIL` is now a hard block; lint re-runs at submit, seal and send (RQ-7); no review data in localStorage, sessionStorage or IndexedDB, and Android `allowBackup` off (RQ-9).
- **Design QA rules:**
  - A 375 px glance test (AC18).
  - A full-width risk band, at least 16 px bold, with a shape and a word for every state (▲ red, ◆ amber `#ffb400`, ⛔ blocked, ✓ clean, ⏱ stale, ? unknown).
  - Stats are text at 14 px or more, relabelled **RISK / VERIFIED / DUE**.
  - Review cards use the standard frame, risk owns the border, nothing pulses, and "glitched" / "ultra-rare" never appear.
  - **Dex list mode is the default queue view.**
- **Phased MVP (§12).** Phase 0 is a read-only PR surface with no decision buttons, building on tarot PR #40 for CI. Phase 1 adds the whole seal path and ships as one unit.
- **Rulings on IMPL-PLAN §2** (§10). Hold for PRs goes from 0 s to **60 s** with undo (Product R1). `PR_PROTECTED_BRANCH` now means "needs a bypass", not "targets main". Merge methods are limited to `merge|rebase`, because squash is disabled on the repo.
- **Decisions.** v0.2 D1 is closed (stand-ins bind). v0.2 D3 is closed: a separate private `aether-outbox` repo is the unanimous recommendation and needs greyZ's yes to create. D2 (5th tab) stays the one real split. New open decisions are in §9. There's a placeholder for Legal (§13).

## 0. Scope and architecture
In: (1) **PR decisions** on allowlisted repos: seal (= merge request), request changes, snooze, reject. (2) Security-alert posts. (3) Client outreach drafts. (2) and (3) only get live posting after Legal + Compliance sign-off.
Out: any GitHub write by the app or the Outbox, auto-posted reviews or comments, multi-reviewer approval. Single reviewer = greyZ.

| Layer | Where | Holds | Status |
|---|---|---|---|
| UI: Dex list, `prSpread`, portal, triage | glitchworks-tarot `src/App.jsx` views; `Card.jsx` **unchanged** + NEW `src/components/review/ReviewCardFrame.jsx` | display data only (memory) | extend |
| Display rules (band states, caps, derivations, spread composer) | `src/domain/reviewRules.js`, `src/domain/review/*` (pure) | no secrets | NEW, existing patterns |
| Review client | `src/adapters/reviewQueueApi.js` (injectable `reviewQueue` prop) | session handled by the browser (httpOnly cookie), no tokens | NEW |
| **Outbox service** (authority): GitHub reader, snapshots, hashing, lint, seal verification, single-use store, kill switch, hash-chained audit, handoff sinks | **separate private repo `k-dot-greyz/aether-outbox`** (recommended; greyZ creates it; until then local-only, never inside the auto-deploying tarot repo) | read-only GitHub token, WebAuthn public key pin, audit store | **NEW** |
| **Publisher** (send side of the Outbox: posting adapters, merge-request sender) | separate process/user that agents can't read | posting credentials (none for GitHub writes) | **NEW** |
| **GitHub bot** (existing fleet agent) | outside this system | its own write credentials | contract in §2.5 |

**Credentials (Architect must-change 1, Compliance RQ-3):**
- **Bots:** per-bot credential, scope `submit` only (submit, edit or withdraw their own drafts). No route to seal, undo, reject, snooze, request changes or the kill-switch "on".
- **greyZ:** a signed-in session (WebAuthn login; httpOnly + Secure + SameSite=Strict cookie; 15 min idle timeout; CSRF token on every intent) can undo, reject, snooze and request changes. **Seal** also needs a per-seal WebAuthn assertion (§2.3).
- **Publisher:** `post` only, and it re-verifies seals.
- **Audit `actor`** always comes from the authenticated principal, never from the request body.
- Seal-verification config, posting credentials and the GitHub read token live in a process agents can't read. Rotation: GitHub token ≤90 days, session keys ≤30 days.

## 1. Card schema (v2.1 surrogate Card + `review` extension)

### 1.1 Common `review` block
As in v0.2 §1.1, with these changes:
- `review.kind`: `pull_request` \| `security_alert` \| `outreach`.
- `review.schema`: `reviewSchemaVersion` = `'0.3'`. `schemaVersion: '2.1'` stays (ruling K6).
- `review.channel`: adds `github_merge`.
- `review.target` for PRs: `{repo, number, base_ref}`.
- `review.draft`: null for PRs (the app never edits PR content). For alerts and outreach, attachments are hashed **by bytes**: `{name, media_type, size, sha256}` (RQ-2).
- `review.content_hash`: sha256 over RFC 8785 JCS of the canonical content. PRs use §2.2.
- `review.sources[]`: for PRs, the sidecar URLs; verification happens at snapshot time.
- `review.seal`: `{token_id, content_hash, sealed_at, approver, exp, key_id}`. The client never sees signatures or secrets.

### 1.2 `review.pr` (server-filled, read-only)
```
pr: { url, title, state: open|draft|closed|merged,
  base: {ref, sha}, head: {ref, sha},
  ci:        {rollup: success|failure|pending|none|unverified, passed, failed, pending, total, required:[names], required_failing},
  reviews:   {decision: approved|changes_requested|review_required|none, approvals, changes_requested, comments},
  mergeable: {state: clean|blocked|behind|dirty|unstable|unknown, blocked_reason?},
  size:      {additions, deletions, changed_files, bucket: XS|S|M|L|XL},
  age:       {opened_at, last_push_at, decision_due_at},     // RFC 3339 UTC
  labels:    [string], linked_issues: [{number,title,state,url}],
  stack:     {parent|null, children[]},
  snapshot:  {fetched_at, checks_digest, reviews_digest, source: "github-rest|graphql", gaps:[...]} }
```
- GitHub handles are shown as GitHub shows them. They're never resolved to names, and commit emails are never fetched.
- `gaps[]` lists data the reader couldn't get, e.g. stack or linked issues. Gaps are shown as such; nothing is invented.

### 1.3 Card fields for review cards: derived, never typed in
| Card field (v2.1 surrogate) | Value |
|---|---|
| `id` | deck-local id (display only); identity = `review.item_id` |
| `name` | PR title (40 chars on the face; full title in the portal) / draft title |
| `sub` | PR: `` `${repo}#${n} · +${add}/−${del} · ${files}f` `` / alert, outreach: `` `${channel} · ${kind}` `` |
| `type` (element) | **`dark` for every review card** (neutral grey). Kind is shown by icon + text label, not element colour (Design QA: electric/fire collided with amber/red) |
| `frame` / `hat` / `rarity` / `ability` | forced `standard` / `none` / `common` / `none` |
| `stats.atk` → shown as **RISK** | 0–99. Σ flags (red 40, amber 15) + size bucket (XS 0, S 5, M 10, L 20, XL 30; by additions+deletions <10/<100/<500/<1000/≥1000), capped at 99 |
| `stats.def` → shown as **VERIFIED** | 0–99 %. PR: checks with conclusion `success` ÷ checks with a conclusion (skipped/neutral excluded); `—` + "no CI" if none or unverified. Alert/outreach: % of sources `verified` |
| `stats.spd` → shown as **DUE** | hours left, clamped 0–99. PR: until `decision_due_at` (= `last_push_at` + 72 h, or the seal/merge-request expiry once sealed). Alert/outreach: until `expires_at`. Shown as `DUE 5h` / `DUE 3d` / `OVERDUE 2d` |
| `hideStats` | `true`. Card.jsx's icon stats (10 px) are hidden; `ReviewCardFrame` renders `RISK 55 · VERIFIED 50% · DUE 5h` as text at **≥14 px** |
| `desc` | first sentence of the PR body / draft, markdown stripped, ≤140 chars |
| `icon` / `image` | `reviewRules.kindVisuals` (config) |

**Where the remaining PR stats go:** review decision, mergeability, size bucket, age and labels (max 3, then "+N") are **chips** in `ReviewCardFrame`, each one a link. Flags go in the **risk band** and the Flags sidecar. The full values are in `review.pr`. `validateCard` passes unchanged.

### 1.4 Risk band (all review surfaces: list row, card frame, portal header)
| State | Rule | Shape + word (shown) | Colour |
|---|---|---|---|
| blocked | any hard-block flag | `⛔ BLOCKED · <CODE>` | red `#ef4444` on red-950 |
| red | ≥1 red flag | `▲ <n> RED` | red `#ef4444` |
| amber | amber flags only | `◆ <n> AMBER` | amber `#ffb400` |
| stale | snapshot >10 min / unverifiable | `⏱ STALE · seal off` | slate-300 on slate-800 |
| unknown | Outbox/reader unavailable | `? UNKNOWN · seal off` | slate-300 on slate-800 |
| clean | no flags, fresh, verified | `✓ CLEAN` | emerald-400 |

Rules (Design QA, ruling O4 = YES):
- Full width, **≥16 px bold**, always text + shape. Colour is never the only signal (protan/deutan safe).
- Risk owns the border: `ReviewCardFrame` draws a 3 px ring in the band colour. Card's own border stays neutral (`common`, `standard`, `dark`).
- **Nothing pulses or glitches** on review surfaces. `prefers-reduced-motion` is honoured and review surfaces have no animation at all.
- The words "glitched" and "ultra-rare" are never rendered in review UI.
- On review cards, a static flags list covers the art centre (rendered by the wrapper; Card.jsx unchanged).

### 1.5 Risk flags (existing codes + `UNPATCHED`)
| Code | Severity | Hard block | Meaning (PR / alert-outreach) |
|---|---|---|---|
| `PR_PROTECTED_BRANCH` | red | **yes** | the merge would need a branch-protection bypass/admin override, or a force-push to a protected base. A merge that is blocked **only** because it's waiting for greyZ's own GitHub approval is not this flag |
| `PII` | red | **yes** | personal data or secrets in the diff/draft (detector + runtime denylist) |
| `EXPLOIT_DETAIL` | red | **yes** (RQ-7) | PoC, payloads or steps beyond the public advisory |
| `UNPATCHED` | red | no (but the draft is restricted to the Compliance 0-day template) | the vulnerability has no fixed version (RQ-7) |
| `SOURCE_FAILED_OR_STALE` | red | no (but Seal stays off while stale) | snapshot >10 min and re-fetch failed, check-runs 403/404 ("not verified", never green), or a sidecar/POL link unresolvable at the pinned SHA |
| `UNVERIFIED_CLAIM` | amber (PR) / red (alert) | no | text claims tests/CI/facts the snapshot or sources don't show |
| `LEGAL_SENSITIVE` | amber | no | license changes; accusatory phrasing about a named org |
| `NAMES_COMPANY`, `OUTBOUND_TO_NEW_CONTACT` | as v0.1 | no | alerts/outreach, press sidecars |

**Lint (flag detection) runs on the server at submit, at seal and at send** (RQ-7). A new hard block at send burns the seal.

### 1.6 Sidecar cards (ephemeral, never in a deck, never stored)
- Generated per PR by the service: `id: sc-<group>-<item6>`, `type: 'dark'`, `stats: {0,0,0}` with `hideStats: true`, `review.sidecar = {group, parent_item_id, total, items[≤50], worst_status, required_view, source_urls[]}`.
- Groups: `flags`, `checks`, `reviews`, `issues`, `stack`, `file_groups`, `repo_files` (release/press/distribution sidecars, `RESOURCES.json`, POL-xxx links via `reviewRules.sidecarGlobs` + `policyRegistry`), `more`.
- **Fail-closed note:** glitchworks-tarot @ dc85159 has no such repo sidecar files, and a code search found no `RESOURCES.json` / `POL-001` in greyZ's repos (the index may be incomplete).

### 1.7 Decks and storage
- Reserved decks: `review-queue`, `review-archive`, `review-outbox`. They can't be renamed, deleted, duplicated, or used as the source or target of create/clone (ruling K3). `setDeck` refuses review cards in non-reserved decks.
- **No review data in `localStorage`, `sessionStorage` or IndexedDB (RQ-9).** Reserved decks and sidecars live in memory only and are re-hydrated from the Outbox. The tarot persistence (`usePersistedDeck`, key `aether-decks`) strips reserved decks before saving and never repairs them with `fallbackDeck` (K1, K2). Logout and session expiry wipe the in-memory cache. **Nothing cached ever enables Seal.**
- Android: `android:allowBackup="false"` (or WebView storage excluded) **before any build with the review flag on**.

## 2. States, seal, handoff (Outbox-enforced)

### 2.1 States
As v0.2 (`draft → needs_review → sealed → holding → posting → posted`, plus rejected/snoozed/expired/post_failed). PR labels: holding = "Sealed · 60 s undo"; posting = **"Merge requested"**; posted = **"Merged by bot"**; post_failed = "Declined / failed" (back to needs_review, never auto-retried). PR cards leave the queue when GitHub shows the PR merged or closed (`closed_externally`; any open seal is burned).

### 2.2 PR content hash
`content_hash = sha256(JCS(c))` where `c = {kind:"pull_request", repo, number, base_ref, base_sha, head_sha, merge_method, checks: sort(app_id,name)[{app_id,name,check_run_id,conclusion,head_sha}], reviews: sort(review_id)[{review_id,state,commit_id}], mergeable_state, labels: sort}`. A new push, a base move, a changed check or review, mergeability or labels each produce a different hash.

### 2.3 Seal (greyZ's signature; RQ-1 + Architect must-change 2)
Seal payload (the WebAuthn challenge = `sha256(JCS(payload))`):
```
{ item_id, kind, action: "merge_request"|"post", content_hash,
  target: {repo, number, base_ref, base_sha, head_sha} | {channel, target_digest},
  approver: "greyZ" (+ WebAuthn credential id), nonce = token_id (ULID),
  issued_at, exp (≤ review.expires_at; PR: issued_at + 72 h), rules_hash (sha256 of reviewRules), key_id }
```
- **Issue:** the session principal must be greyZ. The WebAuthn assertion must have user verification and match the pinned public key. Gates §6 must pass, the kill switch must be on, lint must re-run clean of hard blocks, and the snapshot must be ≤10 min old (re-fetched if older). Only then is the seal stored.
- **Before every send:** the publisher re-verifies the signature and every payload field against live state: re-fetch, recompute `content_hash`, kill switch, lint, `exp`, `rules_hash`. Then, in **one atomic transaction** in a durable store, it does a compare-and-set of `token_id: unused→used` and appends the audit line `send_attempt`. Only if that commit succeeds does anything go out. A failure leaves nothing sent and the token unused.
- Single-use: reusing a `token_id` is refused and logged `token_reuse`. A seal never carries over to an edited, re-pushed or resubmitted item.
- **No bot route to seal** exists in the API; the route needs greyZ's session plus the assertion.

### 2.4 Transitions (PR rows; v0.2 rows still apply to alerts/outreach)
| From | Event | To | Rules | Actor |
|---|---|---|---|---|
| none | PR opened/updated on an allowlisted repo | needs_review | snapshot, hash, lint, sidecars | Outbox (webhook / ETag poll) |
| needs_review | seal | holding (60 s) | §2.3 issue checks | greyZ (session + WebAuthn) |
| holding | undo | needs_review | token burned, nothing sent | greyZ (session) |
| holding | 60 s ends | posting ("Merge requested") | §2.3 pre-send checks + atomic consume/audit → handoff §2.5 | publisher |
| any non-terminal | push / base move / checks or reviews change / new hard block | needs_review | **seal burned**; audit `seal_invalidated{reason}` | Outbox |
| needs_review | request changes | needs_review + `pending_draft` | draft review only (§2.5) | greyZ (session) |
| needs_review | reject ("won't merge", reason required) | rejected | local verdict; nothing happens on GitHub | greyZ (session) |
| needs_review | snooze | snoozed | as v0.2 | greyZ (session) |
| posting | bot reports merged / declined / error | posted / post_failed→needs_review | audit | publisher |
| sealed/posting | `exp` passes unanswered | expired → card back to needs_review as a fresh decision | old seal can't be revived | Outbox |

### 2.5 Handoff contracts (the server never merges or posts on GitHub)
**Merge request** (publisher → GitHub bot), stored and audited:
`{repo, pr_number, expected_head_sha, base_ref, base_sha, merge_method ∈ {merge, rebase}, ci_snapshot: [{name, check_run_id, conclusion}], reviews_snapshot, content_hash, token_id, sealer: "greyZ", sealed_at, exp, idempotency_key = sha256(item_id ‖ token_id), portal_url}`.
The GitHub bot MUST:
1. re-read the PR, check runs and reviews, and **refuse** if the head moved, any required check isn't `success`, or `mergeable_state` isn't `clean`. Required checks = GitHub's required checks ∪ `reviewRules.requiredChecks[repo]` (glitchworks-tarot default: `build`, `e2e`).
2. raise a merge card and act only on **greyZ's explicit yes**. GitHub's "1 approval" rule is met by greyZ's own GitHub review, never by a bypass.
3. merge with `sha = expected_head_sha` (a moved head → 409 → refused).
4. treat a repeated `idempotency_key` as a no-op.
5. report back to the Outbox, which audits it.

**Request changes** → a `draft_review` `{item_id, commit_id: head_sha, event: "REQUEST_CHANGES", body ≤2000, comments[{path, line, body ≤500}] ≤10}`. It goes to the GitHub bot **as a draft for greyZ** and is posted only after his explicit yes. A moved head marks it "outdated".

### 2.6 Audit (RQ-4, Architect must-change 6)
- JSONL in the Outbox audit store, **never in git**.
- Fixed fields only: `{seq, at, actor_principal, action, item_id, from_state, to_state, content_hash_before, content_hash_after, diff_sha256?, diff_lines?, reason_code?, token_id?, prev_hash, line_hash, retain_until}`. No free-form `meta`, no raw diffs, no client IP (dropped).
- Hash chain: `line_hash = sha256(JCS(line without line_hash) ‖ prev_hash)`. The head hash is anchored daily outside the Outbox. The API is append-only (PUT/DELETE → 405).
- Retention placeholders, **pending Legal (§13):** queue items 30 d after terminal, archive 180 d, audit 1 y, snapshots 30 d.
- Client telemetry `meta` is whitelisted to `item_id`, `repo#n`, SHAs, hashes, codes and states (K13).

### 2.7 Kill switch (RQ-5)
- `publishing_enabled` lives in the Outbox and is checked **at seal and right before send**.
- Missing, unreadable or stale = **off**.
- Any agent or greyZ can turn it off. Only greyZ can turn it on, with a WebAuthn assertion.
- When it's off, Seal is disabled with the reason shown, and a pending send is held (the seal stays valid until `exp`, then expires).

## 3. Views
| Feature | Owning view | Extends |
|---|---|---|
| **Queue (default): list mode** for reserved decks. Row = risk band chip (shape + word), title (≤2 lines), `repo#n · kind`, `RISK · VERIFIED · DUE` (≥14 px), flag count as text. No grid toggle on reserved decks | **Dex** | deck select + grid area |
| PR decision spread | **Oracle** layout `prSpread` | `renderOracleZone`, celticCross 3-column grid |
| Alert/outreach one-at-a-time | **Oracle** layout `triage` | as v0.2 |
| Portal (every card) | **Dex card modal**, grown into a true portal; opens from any view | modal + flip |
| Edit alert/outreach drafts (PR cards are never editable) | **Forge** edit mode (phase 2) | as v0.2 |
| Since-seal diff (phase 2) | **Arena** `reviewDiff` | Arena slots |
| Sealed / merge-requested / draft reviews | **Dex** reserved deck `review-outbox` + a global "holding" pill (D1) | Dex |

Cards appear only in the portal and in spreads/triage, never as the queue (Design QA).
**Mode lock (ruling K10):** while a reserved deck is active, Oracle offers only `prSpread`/`triage` and Arena only `reviewDiff`. A visible `REVIEW MODE · <deck>` chip and an **Exit** button return to the last tarot deck.

### 3.1 `prSpread` (full diagram: `SPREAD-LAYOUT.md` / `.svg`)
3×3 grid, centre = PR card. **All cards are dealt face-up** (no card backs, so no pulsing back art).
| Pos | Idx | Slot | Content |
|---|---|---|---|
| TL | 1 | Flags | risk flags (hidden if none) |
| T | 2 | Checks | check runs + statuses · `required_view` |
| TR | 3 | Reviews | reviews + comments · `required_view` |
| L | 4 | Issues | linked/closing issues |
| C | 0 | **PR** | central card (`md`; `lg` ≥1280 px) |
| R | 5 | Stack | parent/child PRs |
| BL | 6 | Repo files | release/press/distribution sidecars, RESOURCES.json, POL links |
| B | 7 | Files | changed-file groups |
| BR | 8 | More | overflow groups |

- **Reuse:** `renderOracleZone(card, label, index, size, {locked:true})` (drag-and-drop off). `handleDrawSpread` gets a `prSpread` branch that calls `composePrSpread` (deterministic). `drawSpread` and the tarot layouts are untouched.
- **Ordering inside a group:** worst first (failure > pending > success; changes_requested > commented > approved; open > closed), then newest. Bots and passing optional checks are collapsed into "+N passing/bot".
- **Overflow:** one card per group (count + top 3). The full list is in the portal (≤10, then "+N on GitHub"). Extra groups go to **More**. The server caps each group at 50 items and reports `total`. Positions never grow beyond 9.
- **Empty groups:** dim `none` placeholder on ≥768 px; hidden on mobile. **Data gaps** show `not fetched`, never "none".
- **Mobile (<768 px):** risk band → PR card → sidecars as 56 px compact rows (icon, title, count, worst status) in the order Flags, Checks, Reviews, Stack, Issues, Files, Repo files, More. Tap = portal.

## 4. Portal modal and references index
- A true portal (React portal at `document.body`): focus trap, Esc closes, scroll lock, deep link `#/review/<item_id>[/<group>]`.
- Order:
  1. **Risk band**.
  2. **Title + chips** (title ≤80; chips ≤24, each a link).
  3. **Flags** (≤120 chars each, each with its source link).
  4. **Summary** (≤3 bullets × ≤140 chars, each ends with a source button).
  5. **Key facts** (≤8 rows; value ≤60, each a link).
  6. **References index (TOC)**: URL buttons, label ≤32. `PR` /pull/{n} · `Checks` /pull/{n}/checks + each run's `html_url` · `Files` /pull/{n}/files · `Commits` /pull/{n}/commits + /commit/{sha} · `Compare` /compare/{base_sha}...{head_sha} · `Issues` /issues/{m} · `Sidecar files` **/blob/{head_sha}/{path} (always SHA-pinned)** · `Stack` /pull/{k}.
  7. **More** (collapsed; lists ≤10 + "+N on GitHub").
  8. **Action bar** (PR card portal only, phase 1+): Reject · Snooze · Request changes · **Seal (request merge)**.
- **Caps (service-enforced, renderer re-checks):** no paragraph longer than 3 lines at 375 px; excerpts ≤200 chars, max 3; markdown stripped; code → `[code]`; file groups ≤6 × 5 paths. **Every fact needs a `source_url`, or it isn't rendered** ("n facts hidden: no source").
- **Untrusted text (RQ-6):** only allowlisted fields are rendered, as plain text (no `dangerouslySetInnerHTML`, no HTML markdown). Links inside the text never become buttons. TOC URLs are built by the service, are https only, and point only at `https://github.com/<allowlisted repo>`. Sources open externally (no in-app reader in v0.3).
- **CSP (RQ-6):** `default-src 'self'; connect-src 'self' <outbox-origin>; img-src 'self' data:; frame-ancestors 'none'; object-src 'none'; base-uri 'none'`. The noise texture (`GlitchStyles.jsx:28`, today loaded from `grainy-gradients.vercel.app`) is **bundled locally**, so there are no remote assets.

## 5. Read-only data path
- Only the Outbox reader talks to GitHub. The client gets rendered JSON + URLs and **no token** (a CI grep for `github_pat_|ghp_|ghs_` in the client bundle fails the build).
- **Token:** fine-grained PAT (a GitHub App is acceptable later). Owner greyZ. **Only select repositories** (D2). Repository permissions, **all Read**: Metadata, Pull requests, Checks, Commit statuses, Actions. Add **Contents: Read** only for file/sidecar blob reads. Issues: Read for linked issues. **No write permissions, no account permissions.**
- **Storage:** server secret store, injected into the reader process only, redacted from logs, expiry ≤90 days with a 14-day rotation reminder. Revoking it → `? UNKNOWN · seal off`. The display shows the last snapshot labelled "stale since HH:MM local".
- **Freshness / stale rule:** stale = `snapshot.fetched_at` older than **10 min**, or any check-runs/reviews call returned 403/404/5xx. Stale **disables Seal** until a re-fetch succeeds.
- **Rate limits:** one GraphQL query per queue refresh; ETag/`If-None-Match`; webhooks for `pull_request`, `pull_request_review`, `check_suite`, `check_run`, `status` (HMAC-verified); short TTL cache. On 403/429, honour `retry-after` / `x-ratelimit-reset`, then exponential backoff.

## 6. Safety gates
1. **Sources before seal:** the portals of **Checks** and **Reviews** (and every flagged sidecar) were opened on the current snapshot. Alerts/outreach: as v0.2.
2. **Flags unmissable:** the risk band (§1.4) first on every surface, and the count on the Seal button.
3. **No one-tap seal with flags:** a confirm sheet with a checkbox per flag **and per non-success check**; red adds a 1.5 s press-and-hold. Hard blocks (`PR_PROTECTED_BRANCH`, `PII`, `EXPLOIT_DETAIL`) mean no seal at all.
4. **Hold + undo:** 60 s for every kind (server-side; it survives app close; a global "holding" pill with Undo).
5. **Re-verification:** snapshot ≤10 min at seal; full re-check before send (§2.3).
6. **Fail closed** (ruling K8): **decisions** and **flags/sources rendering** fail closed when any of these is unavailable or fails: auth, signature verification, kill-switch store, clock skew >60 s, hash service, lint, reader, audit store. **Reading/display** may degrade gracefully (last snapshot, labelled stale). This is a documented, scoped exception to CONTRIBUTING §2.6.
7. **Expired seals can't be revived.**
8. **Kill switch** (§2.7).

## 7. GitHub repo recommendations (glitchworks-tarot; recommendations only, nothing changed)
- **Today, per GitHub R1** (the ruleset was not re-read here): ruleset `def` on main = PR + 1 approval + signed commits + no deletion/force-push. **Risks: no required status checks, and admin/maintain/deploy keys can bypass it.** An admin-scoped agent token could merge with no approval and no green CI.
- **Recommend:**
  - Add required checks `build` and `e2e` to `def`, and remove agent tokens from the bypass list (or document that only greyZ may bypass).
  - New ruleset for `feat/review-queue`: PR required, no force-push/deletion, required checks `build` and `e2e`.
- Squash merge is disabled on the repo, so `merge_method ∈ {merge, rebase}`. Default `merge`.
- CI hardening (RQ-8, part of PR-0): pin actions to full SHAs (incl. `peter-evans/create-pull-request`), top-level `permissions: contents: read`, `persist-credentials: false`, a gitleaks `--redact` job, deploy only from `refs/heads/main` behind a `production` environment with greyZ as required reviewer + `concurrency`.

## 8. Adopted defaults (greyZ can change any)
- Hold **60 s** for all kinds. Expiry: security_alert 24 h; outreach 7 d; PR seal/merge request 72 h; PR `decision_due_at` = last push + 72 h.
- Stale threshold **10 min**. Clock-skew tolerance 60 s.
- Batch seal: only for zero-flag, all-verified alerts/outreach, ≤10. **PRs are never batch-sealed.**
- Channel limits (O8): x 280; linkedin 3000; email subject 120 / body soft 2000; github draft review body 2000, line comment 500.
- Merge method `merge`. Required checks for glitchworks-tarot: `build`, `e2e`.
- Merge-request recipient: the existing fleet GitHub agent (the GitHub R1 contract).
- **Recommendation awaiting greyZ's yes to create:** private repo `k-dot-greyz/aether-outbox` for the Outbox (Architect, Compliance, Web Dev and Product agree). Until it exists, phase-1 server work stays local-only and holds no real credentials.

## 9. Open decisions for greyZ (max 3)
- **D1: 5th nav tab `outbox`?** This is the one split left.
  - *Architect:* yes, behind `features.outboxTab`; a Dex filter hides the countdown, and undo must stay one tap away.
  - *Product + Web Dev:* no tab in phases 0/1. Use the in-sheet hold + a global "holding" pill with Undo + the Dex `review-outbox` deck.
  - **Product default:** no tab in phases 0/1. Add the flagged tab later if the outbox grows beyond the hold view (e.g. drafts + merge requests >10 open). A tab overrides the four-view v2.1 surrogate, so it's greyZ's call.
- **D2: Repo allowlist for the read-only token.** **Default:** `k-dot-greyz/glitchworks-tarot` only in phase 0, with `k-dot-greyz/dev-master` added in phase 1. Each addition means editing the token's selected repositories plus server config, on greyZ's say-so.
- **D3: CI re-arm and repo rules when PR-0 lands** (production impact). **Default:** merge the PR-#40-based PR-0 **with deploy still disarmed** until the `production` environment requires greyZ as reviewer. Apply the §7 rulesets (required `build` + `e2e`, agent bypass removed, `feat/review-queue` ruleset). An agent changes repo settings only after an explicit yes.

## 10. Rulings on IMPL-PLAN §2 (K1–K13) and §9 (O1–O9)
| ID | Ruling | Moot? | Rationale |
|---|---|---|---|
| K1 | Reserved decks + sidecars are never persisted. **Extended by RQ-9:** no review data in localStorage, sessionStorage or IndexedDB | no | Authority is server-side; browser storage is readable by any script |
| K2 | `fallbackDeck` repair skips reserved ids; load error → `? UNKNOWN · seal off` | no | Refilling with tarot cards is fail-open |
| K3 | **Yes to both:** guard create/duplicate/clone (reserved decks are never source or target), and `setDeck` refuses review cards in non-reserved decks | no | Fail closed |
| K4 | Forge refuses `pull_request`; alert/outreach derived fields are read-only (phase 2) | partly (PR) | PR content lives on GitHub |
| K5 / O4 | **O4 = YES** as specified in §1.4: red ▲ / amber `#ffb400` ◆ / text, standard frame, risk owns the border, no pulse, never "glitched/ultra-rare". **Card.jsx unchanged**; all of it lives in `ReviewCardFrame` + forced card fields | no | Design QA: meaning + CVD; protects tarot visuals |
| K6 / O5 | Keep `schemaVersion: '2.1'`; add `reviewSchemaVersion: '0.3'` | no | Additive optional block |
| K7 | Default no 5th tab; stays greyZ's call as **D1** (positions shown) | no | Only greyZ overrides the four-view surrogate |
| K8 / O7 | Scoped exception (§6.6): degrade for display/read, fail closed for decisions + flags/sources. Documented here, as review-path code comments, and as a short CONTRIBUTING §2.6 note | no | Both rules hold, each in its scope |
| K9 | Update-in-place only for alert/outreach (phase 2) | partly (PR) | PRs are never edited in-app |
| K10 / O3 | **Yes:** mode lock with a visible `REVIEW MODE` chip + Exit | no | No random spreads/clashes of decision cards |
| K11 | `package.json` wins for stack facts | no | Stale docs |
| K12 | Keep `review` behind `schema.js`/`derive.js`/`spread.js` | no | Keeps a later KERNEL move local |
| K13 | **Yes:** telemetry meta whitelist, unit-tested | no | PII/noise out of console |
| O1 | CI: build PR-0 on tarot PR #40 (§12), deploy disarmed; re-arming = D3 | no | GitHub R1 |
| O2 | Build-time flags default off everywhere incl. Android: `features.reviewQueue` (phase 0), `features.reviewDecisions` (phase 1) | no | Fail-safe rollout |
| O3 naming | Decks `review-queue`/`review-archive`/`review-outbox`; layouts `prSpread`/`triage`; ruleset `reviewDiff`; test ids `aether-review-*` | no | Stable names |
| O6 | Baseline test: PR #40's title ("scoreFormula registry, deck contract, forge E2E") suggests it covers `rulesets.test.js`/`calculateScore`. Verify in PR-0 review | no | Read-only check, §12 |
| O8 | Channel limits in §8 | no | Char counts |
| O9 | **Bundle `noise.svg` locally** (RQ-6) | no | No third-party request; CSP `img-src 'self'` |

## 11. Acceptance criteria
AC1–AC11 as v0.2 ("seal" = approve; for PRs, "post" = merge-request handoff; AC11 local time). New in v0.3:
- **AC12** A PR seal binds head SHA + base SHA + the checks/reviews snapshot. Any push, base move, check or review change burns it before send.
- **AC13** Neither the app nor the server merges or writes to GitHub. The handoff carries `expected_head_sha` + `idempotency_key`. The bot refuses on a moved head, non-success required checks or non-clean mergeability, merges only on greyZ's yes with `sha=` pinned, and a repeated key is a no-op.
- **AC14** Request changes only ever produces a draft review. Nothing is posted without greyZ's yes.
- **AC15** No GitHub token in the client bundle, storage or logs. The reader token is read-only and limited to allowlisted repos. A stale (>10 min) or unverifiable snapshot disables Seal.
- **AC16** Every portal fact links to its source. The §4 caps hold. Facts without a source are hidden and counted.
- **AC17** `prSpread`: 9 fixed positions on ≥768 px. At 375 px, PR card + compact rows. Overflow never adds positions. Data gaps show "not fetched".
- **AC18 (375 px glance test)** At 375×667, with no scrolling, the first viewport of (a) the Dex queue list and (b) a PR portal shows: the risk band (shape + word, full width, ≥16 px bold), the title, `RISK · VERIFIED · DUE` at ≥14 px, and Seal availability (or "read-only" in phase 0) with its reason. No element there has a running animation. A human check (Design QA): 5/5 fixtures named correctly (state + next action) within 3 s each.
- **AC19** Review surfaces never render the words "glitched"/"ultra-rare", non-standard frames, hats, pulse/glitch classes, or colour-only risk signals.
- **AC20** Bot credentials can't seal, undo, reject, snooze, request changes or turn on publishing (403 + audit). Seal needs greyZ's session **and** a per-seal WebAuthn assertion. `actor` comes from the principal.
- **AC21** The seal is verified at issue and again before send. Token consumption and the audit write commit atomically before any send; if either fails, nothing is sent.
- **AC22** The audit is hash-chained (verifiable end to end), append-only, fixed-field, and stored outside git.
- **AC23** Kill switch: checked at seal and send; missing/unreadable = off; only greyZ (WebAuthn) turns it on.
- **AC24** No review data in localStorage, sessionStorage or IndexedDB. Android `allowBackup` is off before any flag-on build.
- **AC25** CSP as in §4 is served. No remote assets are loaded (the noise texture is bundled). Untrusted text is plain only.
- **AC26** Lint runs at submit, seal and send. `PII`, `EXPLOIT_DETAIL` and `PR_PROTECTED_BRANCH` are hard blocks. `UNPATCHED` forces the restricted template.

## 11.1 Test cases
T1–T17 as v0.2 (read "PR" for `pr_push`; T16 now covers all three browser stores). New:
| # | Setup | Action | Expected |
|---|---|---|---|
| T18 | PR sealed, in hold | new commit pushed | seal burned `head_moved`; nothing handed off |
| T19 | PR sealed | a check re-runs and fails | seal burned `checks_changed` |
| T20 | merge request handed off | greyZ says no to the bot | post_failed → needs_review; not merged |
| T21 | merge request handed off | head moves before the merge | bot refuses / 409; not merged |
| T22 | same merge request delivered twice | bot receives a duplicate | second is a no-op (idempotency key) |
| T23 | client build | grep for `github_pat_\|ghp_\|ghs_` | none; CI fails if found |
| T24 | snapshot 11 min old, or check-runs 403 | open PR portal | band `⏱ STALE · seal off`; Seal disabled |
| T25 | PR with 14 checks + 4 unknown groups | open `prSpread` | Checks shows 14 + top 3; More lists 4; still 9 positions |
| T26 | 375 px | open `prSpread` | band → PR card → rows in fixed order; empty hidden; gaps say "not fetched" |
| T27 | PR body with a link and `<img onerror>` | open portal | plain text; no link button; nothing executes |
| T28 | **375×667 glance** (Playwright + Design QA) | load Dex queue list; open a red-flag PR portal | AC18 assertions: elements within the viewport, font sizes, no running animations; 5/5 human glance |
| T29 | review card with fixture `rarity: glitched`, `frame: neonGlow` | render | forced standard/common/dark; no "glitched" text; no pulse |
| T30 | bot credential | POST seal / undo / reject / publishing-on | 403 each; audited with the bot principal |
| T31 | valid seal, kill switch flipped off during hold | send time | not sent; audit `kill_switch_off` |
| T32 | audit store write fails at send | send | not sent; token stays unused |
| T33 | edit one audit line offline | run the chain verifier | the break is detected at that seq |
| T34 | review data loaded | inspect localStorage/sessionStorage/IndexedDB | no review data |
| T35 | any page load | network log | only `'self'` + the Outbox origin; CSP header present |
| T36 | draft gains exploit steps after seal | send | lint hard block; seal burned; not sent |
| T37 | phase-0 build | inspect portal and network | no decision buttons; only GET requests |

## 12. Phased MVP plan (reconciled)
All work targets `feat/review-queue` (greyZ creates it; ruleset per §7). Nothing goes to `main` without greyZ's merge. Flags default off.

### Phase 0: read-only PR surface (Web Dev's ~4 PRs + PR-0). **It can't seal.**
The portal shows **no action buttons**, only one line: "Read-only preview: decisions arrive in phase 1." This avoids disabled-button confusion and any partial seal UI.
| PR | Scope | Closes |
|---|---|---|
| **PR-0** CI baseline | build on **tarot PR #40** (https://github.com/k-dot-greyz/glitchworks-tarot/pull/40, not rewritten): secrets in job `env`; add `feat/review-queue` to triggers; deploy only from main behind `production` + `concurrency`, **disarmed per D3**; SHA-pinned actions; `permissions: contents: read`; gitleaks job | prerequisite for all tests; O1, O6 (verify) |
| **PR-1** view model + rules (pure) | `src/domain/review/*`, `reviewRules.js`: schema/`validateReviewCard`, derivations (RISK/VERIFIED/DUE, band states), caps, flag catalogue incl. `UNPATCHED`, `composePrSpread`; unit tests | AC1 (client), AC16 (caps), AC17 (composer), AC19 (derivation) |
| **PR-2** read-only data path | Outbox **reader only** (in `aether-outbox` once created; local-only until then): read-only token, allowlist, ETag/webhooks, stale rule, gaps; `reviewQueueApi` (GET only), memory-only cache, reserved decks + K1–K3 guards; fixtures | AC15, AC24 (web), AC11 |
| **PR-3** Dex list + `prSpread` | Dex list mode (default for reserved decks), `ReviewCardFrame` (band, ring, text stats, forced fields), `prSpread` layout + mobile rows, mode lock | AC17, AC18 (list), AC19 |
| **PR-4** portal + TOC + hardening | true portal, summary-first panel, references TOC, plain-text rendering, CSP, bundled `noise.svg`; Playwright phone + iPad projects; glance test T28 | AC16, AC18 (portal), AC25, AC10 (read parts) |

### Phase 1: seal path (Product's). It **ships as one unit**: `features.reviewDecisions` stays off until PR-5–PR-8 have all merged into `feat/review-queue` and T1–T37 pass. No partial seal UI is ever enabled.
| PR | Scope | Closes |
|---|---|---|
| **PR-5** authority core (`aether-outbox`) | credential split (bot submit-only, greyZ WebAuthn session), seal payload + JCS hash, WebAuthn seal verification, single-use store with atomic consume+audit, hash-chained audit, kill switch, lint at submit/seal/send, retention fields | AC5, AC8, AC20, AC21, AC22, AC23, AC26, AC12 (hash) |
| **PR-6** hold/undo + invalidation + **mock** merge request | 60 s hold, undo, expiry, seal burn on push/check/review change (webhook + pre-send re-fetch), mock merge-request sink storing the §2.5 payload with idempotency key (no GitHub write), draft-review store | AC6, AC7, AC12, AC13 (mock), AC14 |
| **PR-7** decision UI | portal action bar, gate G1, confirm sheet (acks + press-hold), hard blocks, WebAuthn prompt, holding pill + Undo, reject/snooze sheets, request-changes draft editor, 300 ms lockout | AC2, AC3, AC6 (UI), AC14 (UI) |
| **PR-8** E2E + security suite | T1–T37 incl. no-write network check, storage checks, 375 px/iPad, bot-403 tests | AC10, AC18, AC20, AC24 (verified) |

**Phase 2+ (deferred):** real GitHub-bot hookup (needs greyZ's yes), alert/outreach live posting (after Legal + Compliance), Android flag-on (allowBackup off first), swipes/keys, batch, Forge edit, Arena diff, the 5th tab (D1), dev-master in the allowlist (D2).

**Disagreements still open:**
1. **D1 tab:** Architect (flagged tab) vs Product + Web Dev (no tab for MVP).
2. **Phase-0 data path:** Web Dev also floated a scheduled-workflow JSON snapshot. Ruled out because it puts the data path inside the auto-deploying public repo (Architect risk 3), and stale/unverified data can't be gated there. Web Dev may still prefer it for speed.
3. **Client rules mirror:** Web Dev worries about drift. Ruling: the client mirror is display-only (band, caps); the server decides; a shared-fixture contract test guards drift.
4. **PR-0 timing:** Architect said hold PR-0 until redeploy is decided. GitHub said build on #40 now. Ruling: land it with deploy disarmed; re-arming is D3.

## 13. Legal (placeholder; Legal R1 pending)
- Retention periods (§2.6), audit minimisation, the third-party noise fetch (removed by RQ-6) and outreach-contact sourcing questions are routed to Legal. No obligation is asserted here.

## Not decided here (flag, not advice)
Whether naming a company as vulnerable in public posts, cold outreach or press/distribution sidecars carries legal/defamation or unauthorized-scanning risk: route to **Legal + Compliance before the first live post naming a company**. Passive-audit evidence must be public-only.
