# REVIEW-QUEUE-SPEC v0.1 (draft, not versioned)

Owner: Product. Status: proposal, pending greyZ lock-in. Prototype: Web Dev (parallel).
Principle: **nothing leaves without a human approval that is single-use, bound to an exact content hash, and recorded.** The queue fails closed: if anything is missing or unverifiable, the item can't be approved.

## 0. Scope
In: security-alert posts (Marketing, CISA KEV / NVD sourced), client outreach drafts (Sales, passive-audit playbook), later PR push requests (bots).
Out (v0.1): the posting adapters themselves, analytics, multi-reviewer approval. Single reviewer = greyZ.

## 1. Item schema (JSON, Schema 2020-12 to follow)

| Field | Type | Req | Notes |
|---|---|---|---|
| `id` | string (ULID) | yes | sortable, immutable |
| `type` | enum `security_alert` \| `outreach` \| `pr_push` | yes | |
| `channel` | enum `x` \| `linkedin` \| `email` \| `github` \| `blog` | yes | where it would go out |
| `target` | object | yes | recipient / account / repo+branch; for `outreach` the company + contact role (no personal data beyond what's needed to send) |
| `draft` | object `{title?, body, attachments[]}` | yes | `body` plain text/markdown; channel length limits checked |
| `content_hash` | sha256 of canonical `channel+target+draft` | yes | computed server-side, never by the creating bot |
| `sources[]` | `{url, label, kind: cisa_kev\|nvd\|vendor_advisory\|public_page\|repo\|other, verification: verified\|unverified\|failed\|stale, checked_at, evidence_note}` | yes (≥1 for alert/outreach) | verification done by a checker, not the drafting bot |
| `claims[]` | `{text, source_ref[]}` | yes for alert/outreach | every factual sentence maps to ≥1 source; unmapped claim → flag |
| `risk_flags[]` | `{code, severity: red\|amber, detail, auto: bool}` | yes (may be empty) | see codes below |
| `created_by` | `{bot_id, bot_name, run_id}` | yes | |
| `created_at` | RFC 3339 UTC | yes | UI shows local time |
| `expires_at` | RFC 3339 UTC | yes | default per type (D2) |
| `state` | enum (§2) | yes | |
| `approval` | `{token, content_hash, approved_at, approved_by, used: bool}` \| null | no | single-use |
| `post_result` | `{posted_at, external_url, adapter_response}` \| null | no | |
| `audit[]` | append-only, see §2 | yes | |

**Risk flag codes**
- `NAMES_COMPANY` (red for outreach/alert naming a specific org as vulnerable; amber when only the vendor of a public CVE)
- `UNVERIFIED_CLAIM` (red): any claim with no `verified` source
- `SOURCE_FAILED_OR_STALE` (red): source 404/changed, or `checked_at` > 24h before approval
- `PII` (red): personal names, emails, phones, addresses, financial IDs, greyZ's legal name (denylist + detector)
- `EXPLOIT_DETAIL` (red): PoC code, payloads, or steps beyond the public advisory
- `OUTBOUND_TO_NEW_CONTACT` (amber): first contact with this recipient
- `LEGAL_SENSITIVE` (amber): accusatory phrasing ("is vulnerable", "exposed") about a named org
- `PR_PROTECTED_BRANCH` (red, pr_push): push to main/protected or force push

## 2. States and transitions

```
draft → needs_review → approved → (hold) → posted
                     ↘ edited → needs_review
                     ↘ rejected (terminal)
                     ↘ snoozed → needs_review (at snooze_until)
any non-terminal     → expired (terminal, at expires_at)
approved/holding     → needs_review (undo)
holding              → post_failed → needs_review
```

| From | Event | To | Rules |
|---|---|---|---|
| draft | bot submits | needs_review | schema valid, hash computed, sources checked, flags computed; else stays draft with errors |
| needs_review | approve | approved | gates in §4 pass; mints single-use token bound to `content_hash` |
| needs_review | edit (saved) | needs_review | new `content_hash`, flags+sources rechecked; logged as `edited` |
| approved | edit | needs_review | **approval revoked**; token burned |
| approved | hold starts | holding | hold window (D1) |
| holding | undo | needs_review | token burned, nothing sent |
| holding | window ends | posting → posted | adapter re-checks token unused + hash match; marks token used *before* send |
| posting | adapter error | post_failed → needs_review | no auto-retry; new approval needed |
| needs_review | reject (reason required, 1 tap from preset list ok) | rejected | terminal |
| needs_review | snooze (1h / tonight / tomorrow) | snoozed | `expires_at` unchanged; can't snooze past expiry |
| any non-terminal | clock ≥ `expires_at` | expired | terminal; bot may resubmit as a **new** item |

**Audit entry** (every event, including views of sources): `{at, actor (greyZ|bot_id|system), action, from_state, to_state, content_hash_before, content_hash_after, diff?, reason?, device, client_ip_hash}`. Append-only, never edited; export as JSONL.

**Single-use:** one token per approval; consumed at send; a second post attempt with the same token is refused and logged. Approval never carries over to a resubmitted or edited item.

## 3. Card layout and flow (mobile-first: phone/iPad, night use)

**Card (one item, top to bottom)**
1. Header strip: type icon + channel + target · created_by bot · "expires in 5h" countdown. Colour band: red if any red flag, amber if amber only, neutral otherwise.
2. **Flags block** (if any): full-width, red/amber, one line per flag with plain-words detail. Not collapsible.
3. **Sources block**: each source with label, domain, verification badge (✓ verified / ? unverified / ✗ failed / ⏱ stale), checked-at. Tap opens in-app reader. Each claim shows which source backs it (tap a sentence → highlights its source).
4. Draft preview rendered as the channel will show it (char count vs limit). For `pr_push`: repo, branch, diff stat, link to PR.
5. Action bar (sticky bottom, thumb reach): **Reject · Snooze · Edit · Approve**.

**Gestures / keys**
| Action | Swipe | Key |
|---|---|---|
| Approve | right (only when no flags; otherwise opens the confirm sheet) | `A` |
| Reject | left → reason sheet | `R` |
| Snooze | down | `S` |
| Edit | tap body | `E` |
| Next / prev | up / — | `J` / `K` |
| Open source n | — | `1`–`9` |
| Undo (in hold) | toast button | `U` / `Cmd-Z` |

**Batch view**: list grouped by type, sorted by expiry soonest first. Row = type, target, first line, flag dots, expiry. Multi-select allows **reject, snooze only**. Batch approve is allowed only for items with zero flags and all sources verified, up to 10, with a summary sheet listing every item before the confirm (D3).

Night mode: dark theme default after 20:00 local, large type, no sounds, no auto-advance into the Approve button (300 ms input lockout after card change to stop accidental double-taps).

## 4. Safety UX (gates)
1. **Sources before approve**: Approve is disabled until the sources block has been scrolled into view on this card (and, with any red flag, each red-flagged source opened once). Logged.
2. **Red flags unmissable**: colour band + flags block first + flag count on the Approve button ("Approve with 2 flags").
3. **No one-tap approval with flags**: any flag → confirm sheet listing flags, each needs its own checkbox acknowledge; red flags additionally need press-and-hold 1.5 s. `PII` and `PR_PROTECTED_BRANCH` are **hard blocks**: cannot be approved, only edited or rejected.
4. **Hold + undo**: after approve, item sits in `holding` (D1, default 60 s) with a visible countdown and Undo; app closing doesn't cancel the hold, undo stays reachable from the queue.
5. Re-verification at approve time: sources older than 24 h are re-checked; if any flips to failed, approval is refused.
6. Fail closed: if the checker, hash service or audit log is unavailable, Approve is disabled with the reason shown.
7. Expired items can't be revived; only resubmitted as new.

## 5. Acceptance criteria
- AC1 An item missing any required field never reaches `needs_review`.
- AC2 Approve is impossible before the sources block is viewed (and red-flag sources opened).
- AC3 Any flag → no single-gesture approve; red → acknowledge + hold; PII / protected branch → no approve at all.
- AC4 Any edit after approval revokes it and returns the item to `needs_review` with a new hash.
- AC5 A token posts at most once; content whose hash differs from the approved hash is never posted.
- AC6 Undo during hold sends nothing and returns the item to review.
- AC7 Items past `expires_at` become `expired` and can't be approved or posted.
- AC8 Every action creates exactly one audit entry; the log can't be altered through the UI or API.
- AC9 Batch approve rejects any selection containing a flagged or unverified item.
- AC10 Works one-handed on a 375 px wide phone and on iPad, keyboard shortcuts on iPad with keyboard.
- AC11 Times shown in local time, stored UTC.

## 6. Test cases
| # | Setup | Action | Expected |
|---|---|---|---|
| T1 | clean alert, 2 verified sources | open, scroll sources, swipe right | holding 60 s → posted, audit: viewed_sources, approved, posted |
| T2 | same | swipe right before sources viewed | refused, hint "check sources first" |
| T3 | alert with `UNVERIFIED_CLAIM` | swipe right | confirm sheet; needs ack + hold |
| T4 | outreach containing an email address | try approve | hard block `PII`; only edit/reject |
| T5 | approved item | edit one char | approval revoked, state needs_review, new hash |
| T6 | approved, holding | tap Undo at 30 s | nothing sent, needs_review |
| T7 | posted item | replay same token | refused, logged `token_reuse` |
| T8 | item expires_at passes while snoozed | — | expired, not shown in queue (visible in history) |
| T9 | source returns 404 at approve time (>24 h old) | approve | refused, flag `SOURCE_FAILED_OR_STALE` added |
| T10 | batch of 5 clean + 1 flagged | batch approve | refused, flagged item named |
| T11 | adapter returns 500 | post | post_failed → needs_review, no retry |
| T12 | audit store down | open card | Approve disabled, reason shown |
| T13 | pr_push to `main` | approve | hard block `PR_PROTECTED_BRANCH` |
| T14 | double-tap right after card change | — | lockout, no approve |
| T15 | snooze past expiry | snooze "tomorrow" on item expiring tonight | option disabled |

## 7. Open decisions for greyZ (max 3)
- **D1 Hold window before posting.** Default **60 s** (security alerts and outreach); `pr_push` 0 s since GitHub itself is reversible-ish. Alt: 10 s / 5 min.
- **D2 Default expiry.** Default **security_alert 24 h** (stale alerts are worse than none), **outreach 7 d**, **pr_push 72 h**. Alt: one value for all.
- **D3 Batch approve.** Default **allowed only for zero-flag, all-verified items, max 10, with summary confirm**. Alt: never batch-approve (strictest).

## Not decided here (flag, not advice)
Whether naming a company as vulnerable in public posts or cold outreach carries legal/defamation or unauthorized-scanning risk: route to Legal + Compliance before the first live post. Passive-audit evidence must be public-only.
