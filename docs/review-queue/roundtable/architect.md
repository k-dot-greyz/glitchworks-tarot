Source of record: not versioned yet (box only; route to Chief of Staff for versioning)

# Architect review: Review Queue (SPEC v0.2, IMPL-PLAN rev 2)

Repo: `dc85159` confirmed via GitHub connector (metadata only). File facts are from the local snapshot `tarot-local/` and the plan's access log.

## 1. Verdict
**Go with changes.** The UI-as-client / server-as-authority split is right. But the seal isn't bound to who approved, what action it covers or which PR head it applies to, and the interim "shape A" puts the authority next to auto-deploy.

## 2. Top 3 risks
1. **No operator auth.** Nothing says who may call `seal`; the skeleton only binds `127.0.0.1`. A bot that can `submit` can `seal`. That breaks "approvals count only in the operator's own words".
2. **`pr_push` TOCTOU.** `content_hash` = `channel+target+draft` (§1.1), and the hold is 0 s (§7). If the branch moves after the seal, the seal approves a commit nobody reviewed.
3. **Authority coupled to deploy.** `ci-cd.yml` deploys on push to main with `rsync --delete`, and PR-0 re-enables it (IMPL-PLAN §8.2). Bot branches and a third-party action holding a write PAT (§8.7) share the repo. Option A puts the seal key inside that blast radius.

## 3. Must-changes
1. Split credentials: bots are submit-only; only the operator's authenticated session can `seal`/`undo`/`reject`. Test: a bot calling `seal` is refused and audited.
2. The seal-token HMAC binds `item_id`, `content_hash`, `action`, `kind`, the target (`pr_push`: repo, branch, **head SHA**), the approver, `issued_at`, `expires_at` (≤ `review.expires_at`), a nonce/`token_id`, the `reviewRules` hash and a key id.
3. Canonicalisation follows a named standard (RFC 8785 JCS or a written equivalent). Attachments are hashed by bytes. The hash covers the exact bytes the adapter sends.
4. Verify at mint **and** in the adapter right before send. Consuming the token is an atomic compare-and-set in a durable store. The audit write must succeed before the send. `pr_push` uses an expected-SHA guard.
5. Re-check sources at send time too (§4 gate 5). A flip during the hold burns the token.
6. Hash-chain the JSONL audit lines. Audit data (incl. `client_ip_hash`) and outreach targets never go in git.
7. The browser holds only a display cache, `token_id` and a short-lived session credential. No GitHub token, seal key or adapter credentials; nothing in `localStorage` (T16). Intents are CSRF-protected.
8. GitHub reads go through the server: a fine-grained read-only token (metadata, contents, pull requests), limited to listed repos; ETag caching with `fetched_at`. Data past a max age set in `reviewRules` shows "stale" and Seal is disabled. The push credential is a separate secret, held only by the adapter.
9. Every new file links its versioned home (POL-001).

## 4. D1, D2, D3
- **D1 (v2.1 spec missing):** Treat the `dc85159` contract as provisional, pinned by blob SHA and labelled "v2.1 (surrogate)". Ask the operator to locate the file or declare `dc85159` canonical. Don't claim conformance until then.
- **D2 (`outbox` tab):** Yes, behind `features.outboxTab`. Undo must stay one tap away; a Dex filter hides the countdown.
- **D3:** **Private repo `k-dot-greyz/aether-outbox`.** No UI merge can change or redeploy the authority, it keeps its own secrets and SHA-pinned CI, and authority code has one audit history. Drop the interim shape A: until the operator creates the repo, PR-2 stays local (no silent creates). "No server" is acceptable only as the §7 review-only mode with posting hard-disabled.

## 5. Cut or defer; PR split
- The order (domain → server → adapter → UI) is sound. **Gap:** no PR covers the GitHub read proxy or the PR card / Oracle sidecar spread / references modal. Add these with v0.3.
- **The PR-2a/2b split is mandatory.** Add **PR-2c auth + credential split**.
- Fold PR-4 into PR-7, its only consumer.
- **Defer:** batch seal (keep batch reject/snooze), PR-9 Arena diff (show it in the sheet), swipe-to-seal (keys and button first).
- **Hold PR-0** until the operator decides on redeploy.
- No real posting adapters before Legal + Compliance sign-off.
