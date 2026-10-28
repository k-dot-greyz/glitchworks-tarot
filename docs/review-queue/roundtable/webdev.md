# Roundtable input from Web Dev: tarot as the review queue

NOT VERSIONED YET. Based on IMPL-PLAN.md rev 2, GAP-MATRIX.md and spec v0.2. Spec v0.3 (the PR decision surface) hasn't landed yet.

## Weakest points of my own plan
1. **The UI runs on a broken baseline.** The `ci-cd.yml` runs since 2026-09-29 had 0 jobs, and `rulesets.test.js` likely fails (`calculateScore` doesn't exist). Without PR-0, every PR depends on gate output pasted into its description. Nothing re-runs it.
2. **It all goes through the 58 KB `App.jsx`.** PR-5 through PR-10 each touch it, so merge conflicts between those PRs are close to certain. They're "small" only in their own files.
3. **Too much machinery.** It's 15 PRs, around 5k lines, a new server and 2 flags, built to protect a product whose real core is 3 item types. The client mirror (PR-1b) duplicates the server's rules: two sources of truth that can drift.
4. **D3 is load-bearing.** If greyZ doesn't create the new repo, PR-2 lives in `server/outbox/` inside an auto-deploying repo. Holding off is a process rule; nothing technical enforces it.
5. **The tarot metaphor costs extra.** Every review feature needs a guard against the matching tarot feature (K1-K4, K9, K10): localStorage, fallback refill, duplicate, Forge-derived fields, random spreads.
6. The line counts are estimates from reading the code, not measured.

## MVP cut
Keep: PR-1a (merged with a slim 1b: state, token and flags only), PR-2 (server skeleton), PR-3a/3b, PR-6a/6b (the Dex popup as the review sheet, with the confirm sheet) and a slim PR-11.
Cut or defer: PR-4 swipe and keys (buttons only at first), PR-5 batch (single items only), PR-7 Oracle triage, PR-8 Forge edit (reject and re-draft upstream instead), PR-9 Arena diff and PR-10 the outbox tab (a hold toast in the popup instead).
That leaves about 7 PRs and about 2.4k lines. Every safety rule stays (hard blocks, token bound to content_hash, ack per flag, undo hold). Only convenience features go.

## Effort per PR (estimate: cloud-agent build plus greyZ review)
| PR | Size | Build | Review |
|---|---|---|---|
| 0 CI fix | S | 0.5 h | 10 min |
| 1a / 1b domain | M / M | 2 h / 2.5 h | 30 / 30 min |
| 2 server skeleton | L (may split in two) | 4 h | 45 min |
| 3a / 3b adapter, decks | M / M | 2 h / 2 h | 20 / 30 min |
| 4 input hooks | M | 2 h | 20 min |
| 5 Dex list and batch | M | 3 h | 30 min |
| 6a / 6b review sheet, sheets | L / M | 3.5 h / 2.5 h | 40 / 30 min |
| 7 / 8 / 9 / 10 | M each | 2-3 h each | 20-30 min each |
| 11 e2e and docs | M | 3 h | 20 min |
The full plan is roughly 40 agent-hours and about 7 h of review. The MVP is roughly 20 agent-hours and about 4 h of review. Rebase overhead on `App.jsx` adds about 15%.

## What the PR decision-surface pivot exposes in the plan
- **A different domain.** The plan models outbound drafts (outreach, alerts, pr_push) and their approval. The pivot is a read-only view of GitHub PRs. Approval tokens, holds and the outbox service don't matter there; a PR view model and a signal ranking do. Product's v0.3 needs to say whether these are two products or one queue with PR cards as one item type.
- **No data source yet.** It needs a GitHub read path without tokens in the browser: a server-side proxy or a cached snapshot (e.g. a JSON file built by a scheduled `run:`-only workflow), with rate limits, caching and staleness shown on every card. None of this is in the plan.
- **Card and spread model.** The central PR card stats (CI, reviews, mergeability, size, age, labels, flags) need to be mapped onto AetherCard's stats, rarity and band. Sidecar card types: check runs, reviews, linked issues, file groups, stacked PRs and repo sidecar files. The Oracle spread currently uses fixed positions (3-card or Celtic Cross) with random draws; the pivot needs a deterministic radial layout for a variable number of sidecars, with overflow handled.
- **Portal modal.** It needs a true portal (focus trap, Esc, scroll lock, deep-linkable URL) with a references index of URL buttons. Today's Dex popup is an inline modal inside `App.jsx`, not a portal.
- **Signal-to-noise ranking.** Its rules need defining: what decides a merge (failing required checks, changes requested, conflicts, a protected base) goes first, and noise (bots, passing optional checks) is collapsed.
- **Stacked PRs and linked issues.** Both need graph queries the connector may return only partly, so the fixtures must show gaps honestly (fail closed, never invent).
- **Never merges.** The surface has zero write actions. That makes it an easy first ship on its own, and it can come before the outbox work.

**Recommendation:** ship the read-only PR decision surface first (about 4 PRs: view model plus tests, snapshot data path, spread layout, portal modal). Defer the outbox/approval stack until D3 is settled.
