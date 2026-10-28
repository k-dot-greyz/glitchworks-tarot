# Roundtable R1: Compliance (security and privacy lens)
Compliance, 2026-10-28, repo@dc85159 (`k-dot-greyz/glitchworks-tarot`, public), **not versioned yet**. Read: SPEC v0.2, GAP-MATRIX, IMPL-PLAN rev 2, repo clone at dc85159 (gitleaks `--redact`, history and tree), workflows. AI review, not legal advice.

## Verdict
**GO-WITH-CHANGES.** Putting authority on the server (v0.2 §0, §2) is the right shape. But a seal is not yet bound to greyZ's identity, the hash doesn't cover what actually gets pushed, and no real posting or push credential should be connected until RQ-1 to RQ-5 land.

## Top 3 risks
1. **Agents can seal.** No auth anywhere in the spec or plan. The Outbox binds to `127.0.0.1` (IMPL §4), but the box is shared by every agent, so any bot can POST `source_viewed` and then `seal`. The HMAC token from `OUTBOX_SEAL_KEY` proves the *server* minted it, not that *greyZ* approved. The audit `actor` is self-declared.
2. **The seal doesn't cover what is sent.** `pr_push` `target` = repo+branch, with no commit SHA, so a sealed branch can move before the push. `draft.attachments[]` may be hashed by reference. Adapters aren't barred from transforming text (threads, link shortening).
3. **Browser attack surface.** The SPA will render bot-drafted text, flag details and source URLs, and it will hold the Outbox session. At dc85159 there's no CSP (`index.html`), and there's a third-party fetch on every load (`GlitchStyles.jsx:28` → grainy-gradients.vercel.app sends IP, UA and Referer). XSS there means forged seal intents unless sealing needs an out-of-band signature.

## Must-changes
- **RQ-1** (SPEC §2 seal row, §4; IMPL §4 PR-2) → MF-4, MF-12. A seal is valid only with a **WebAuthn assertion from greyZ** (user verification required) over `{item_id, content_hash, intent, nonce, exp}`. The publisher re-verifies it against a public key pinned in publisher config before every send. Bot credentials can call `submit`/`edit`/`reject-self` only and get no route to `seal`. Audit `actor` comes from the authenticated principal, never the request body.
- **RQ-2** (SPEC §1.1 `target`, `content_hash`; §2 posting row) → MF-12, MF-2. The hash covers attachment **bytes** (sha256 each). For `pr_push` it covers remote, base SHA and **head SHA**, and the push must hit that exact SHA (ref compare; no force). Adapters send exactly the hashed bytes. Any split or transform happens before hashing and is shown in the preview.
- **RQ-3** (IMPL §4 "binds 127.0.0.1", Option A/B) → MF-9. Loopback is not a trust boundary on the shared box. Give each caller its own least-privilege credential (bots: submit; publisher: post only). Keep `OUTBOX_SEAL_KEY` and all posting/push credentials in a process agents can't read. Write down a rotation period. Option B repo must be private.
- **RQ-4** (SPEC §2 "Audit entry"; IMPL §4 audit store) → MF-8, MF-6, MF-7. Add a hash chain (`prev_hash` per line, head periodically anchored outside the Outbox). Keep a fixed field list with no free-form `meta`. Swap raw `diff?` for diff hash + line counts. Swap `client_ip_hash` for a keyed HMAC or drop it (an unsalted IPv4 hash is reversible). Add `retain_until` and a retention table (queue, archive, audit, source snapshots).
- **RQ-5** (SPEC §4.6 + new §4.8) → MF-5, MF-10. Add a `publishing_enabled` switch in the Outbox, checked at seal **and** right before send. Missing or unreadable = off. Any agent can turn it off; only greyZ can turn it back on, with WebAuthn. Extend the fail-closed list to cover auth, signature verification, kill-switch store, clock skew and the hash service.
- **RQ-6** (SPEC §3.2 items 2–4 "in-app reader"; `index.html`; `GlitchStyles.jsx`) → MF-1, MF-11. Render only allowlisted fields, as text: no `dangerouslySetInnerHTML`, no HTML markdown. URLs https-only. Sources open externally or in a script-less sandboxed frame. Add CSP (`default-src 'self'`, `connect-src` = Outbox origin, `frame-ancestors 'none'`). Vendor `noise.svg` (O9). Bot/LLM drafts and fetched pages are untrusted data, and LLM drafting steps get no tool that reaches the Outbox.
- **RQ-7** (SPEC §1.1 flag codes; `reviewRules.hardBlocks`) → MF-2, MF-3. Add an `UNPATCHED` flag (no fixed version) that limits the draft to the MF-3 template. Make `EXPLOIT_DETAIL` a hard block. The server re-runs lint at submit, seal **and** send.
- **RQ-8** (`.github/workflows/ci-cd.yml`, `sync-dev-master.yml`) → MF-9. Pin every action to a full SHA (incl. third-party `peter-evans/create-pull-request@v6`). Add top-level `permissions: contents: read` and set per-job minimums (none set today). Replace `DISPATCH_PAT` with a GitHub App or repo-scoped fine-grained token, and set `persist-credentials: false` on checkouts that don't push. Move `LINEAR_API_KEY` from inline `run:` to `env:`. Keep `pull_request_target` absent (it is absent today). Add a gitleaks `--redact` job. Before PR-0 re-enables deploy: require greyZ as reviewer on the `production` environment and turn on real branch protection for `main` (IMPL §8.8: `enabled:false`).
- **RQ-9** (`usePersistedDeck.js` K1/T16; `AndroidManifest.xml:5`) → MF-7. T16 should assert that no review data is in localStorage, sessionStorage **or** IndexedDB. The Outbox session is memory-only or an httpOnly/Secure/SameSite=Strict cookie with a short idle timeout, and logout wipes caches. `android:allowBackup="true"`: set it to false, or exclude WebView storage, before any flag-on Android build. Nothing cached ever enables Seal.

## MF-1..12 mapping (spec/plan; code at dc85159 has **none** of it: 0 hits for hash/token/seal/auth in `src/`)
| MF | Status | Note |
|---|---|---|
| 1 sanitise/allowlist | partial | React escapes text; no field allowlist, URL scheme rule or CSP → RQ-6 |
| 2 lint hard block ×3 | partial | Hash binds sealed=sent; only PII/PR_PROTECTED_BRANCH block; no send-time lint → RQ-2, RQ-7 |
| 3 0-day/unpatched | missing | EXPLOIT_DETAIL is red-ack only → RQ-7 |
| 4 no auto-post/grants | honoured | No auto-post; batch seal is still a human act (≤10, zero-flag). Identity gap → RQ-1 |
| 5 kill switch | missing | → RQ-5 |
| 6 retention | missing | → RQ-4 |
| 7 strip PII | partial | PII hard block, outreach target role-only, K13 meta whitelist; audit `diff`/IP hash remain → RQ-4, RQ-9 |
| 8 audit chain | partial | Append-only, fixed fields, 405 on PUT/DELETE; no hash chain → RQ-4 |
| 9 keys/rotation/scan | partial | Seal key env-only, never committed; no scope/rotation; CI unpinned, PAT → RQ-3, RQ-8 |
| 10 fail-closed table | partial | §4.6 covers checker/hash/audit only → RQ-5 |
| 11 untrusted text/LLM | missing | No prompt-injection or LLM-tool rule → RQ-6 |
| 12 publisher-only, single-use, hash-bound | partial | **CoS claim verified for the spec** (§1.1 `seal.content_hash`, §2 "single-use seal token bound to `content_hash`", consumed before send, `token_reuse`). **Not in code.** Not bound to greyZ's identity or to the PR head SHA → RQ-1, RQ-2 |

## D3 recommendation (SPEC §8 D3 / IMPL §4, §7: where the approval core runs)
**Option B (separate private repo/service), with signed approvals.** Authority = the publisher verifying a WebAuthn signature from greyZ over `item_id+content_hash+nonce`. It never relies on SPA state or a server-minted HMAC alone. Agents propose and edit; they never hold a credential that can seal, re-enable publishing or post. Run the publisher where agent processes can't read its keys (not as a plain process on the shared box). Option A is OK only for the mock-only skeleton (no real credentials, public repo). The "review-only, no server" fallback must never post or push.

## Unverified items
- UNVERIFIED (gh unauthenticated; admin-only APIs): default GITHUB_TOKEN permissions, secret scanning / push protection state, `production` environment reviewers.
- UNVERIFIED: hosting headers (CSP/HSTS) at the rsync deploy target; where the Outbox will be hosted; whether drafting bots use LLMs; who operates grainy-gradients.vercel.app and what it logs.
- Secrets: gitleaks found **1 `generic-api-key` hit in history only**, in `src/test/fixtures/AetherTestFixtures.js:75` at commit `c020c0f7`. The working tree scan is clean. Assessed as a **false positive** (the values are scoring-formula ids also referenced in `src/domain`), but greyZ should confirm. `mcp-server/server-config.yaml` `api_key` is empty.
- Re-scope: IMPL header says v0.3 = read-only PR decision surface. The `proto/pr-decision-surface` branch is identical to the snapshot `47a3340` (no prototype code yet), so it wasn't reviewed. RQ-1/2/8 apply to any PR decision that merges or pushes.
- Privacy questions → Legal (no obligation asserted): IP + UA sent to a third party on load (GDPR Art. 4(1), CJEU C-582/14 *Breyer*; Art. 44 if outside the EEA). Hashed IP stays personal data (Art. 4(5), Recital 26). Minimisation and retention for audit (Art. 5(1)(c),(e), Art. 25). localStorage cache under ePrivacy Dir. 2002/58/EC Art. 5(3) "strictly necessary" exemption. Outreach contacts sourced from public pages → Art. 14 notice and Art. 6(1)(f) basis.
