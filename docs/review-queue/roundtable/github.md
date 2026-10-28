# Roundtable R1 — GitHub agent

## Verdict

**go-with-changes.** The integration-branch plan is sound. Before PR-0 lands, three things need fixing: the plan's view of protection on main, deploy gating, and the seal handoff contract.

## Risks

- **CI has been dead on main since 2026-09-12.** main's `ci-cd.yml` uses `secrets.*` in the deploy job's `if` and in the "Notify Linear" step's `if`. That context is not allowed in a job-level `if`, so the file fails validation. Every push makes a 0-job failed run named by file path. The latest one is run 36586208677 on `dc85159`, with 0 jobs. The fix is already written: PR #40's head (`dedc109`) moves the secrets into job `env`. Its run 35311145475 went green (build ✓, e2e ✓, deploy skipped). PR #40 is open against main and blocked on review.
- **Fixing CI re-arms production.** It brings back an rsync `--delete` deploy (secrets named DEPLOY_USER, DEPLOY_HOST, DEPLOY_PATH) and a Linear webhook (LINEAR_API_KEY). There is no `concurrency`, no `permissions:` and no SSH key step. Whether the `production` environment has protection rules was not verified.
- **The plan says main is unprotected. It isn't.** Ruleset `def` is active on the default branch. It blocks deletion and force-push, requires signed commits, and requires a PR with 1 approval. But it has no required status checks, and the admin and maintain roles plus deploy keys can bypass it at any time. An admin-scoped agent token could merge with no approval and no green CI.
- `feat/review-queue` does not exist yet, and no rule covers it. The repo already has stacked bot PRs (#37–#43 target other PR branches). Retargeting them at merge time is a known source of mess.
- Squash merge is disabled on the repo, even though the ruleset lists it. A seal that asks for squash will fail.
- `sync-dev-master.yml` uses `peter-evans/create-pull-request` v6 by tag, with a long-lived DISPATCH_PAT. It also puts `client_payload.sha` into the PR body unchecked.

## Must-changes

1. **PR-0: base it on PR #40's fix, don't rewrite it.** Keep the secrets in job `env` with step-level `env.*` checks. Add `feat/review-queue` to the `pull_request` and `push` branches. Gate deploy on `refs/heads/main` (or tags) only. Put `environment: production` behind a required reviewer, set `concurrency: { group: deploy-production, cancel-in-progress: false }`, and add an explicit SSH key/known_hosts step. Do not let rsync `--delete` run until greyZ has approved the environment.
2. **Rules.** Add a ruleset for `feat/review-queue`: PR required, no force-push, no deletion, required checks `build` and `e2e`. Add the same required checks to `def`. Take the agent's token out of the bypass list, or document that only greyZ may bypass.
3. **Pins and permissions.** Pin `peter-evans/create-pull-request` to commit `5f6978faf089d4d20b00c7766989d076bb2fc7f1` with a `# v8.1.1` comment. This is a major bump from v6 and needs runner ≥ 2.327.1 (Node 24). Pin `actions/checkout`, `setup-node`, `upload-artifact` and `download-artifact` to SHAs the same way. Set top-level `permissions: contents: read`. Give `contents: write` and `pull-requests: write` only to the sync job. Validate `client_payload.sha` as 40 hex characters.
4. **Seal record.** Store `{repo, pr_number, expected_head_sha, base_ref, merge_method ∈ {merge, rebase}, ci_snapshot (check-run names, conclusions and ids), sealer, sealed_at, idempotency_key}`. The server never merges. The GitHub agent re-reads the PR, the check runs and the reviews. It refuses if the head moved, if any required check isn't `success`, or if `mergeable_state` isn't clean. Then it raises a merge card and merges only on greyZ's yes, passing `sha=expected_head_sha` so a moved head gets a 409. Every step goes into an append-only audit log. A repeated idempotency key is a no-op.
5. **Read scopes.** The queue server gets a fine-grained PAT or a GitHub App scoped to this repo only, with read access to Metadata, Pull requests, Checks, Commit statuses and Actions. Add Contents read only if file reads are needed. A 403 or 404 on check-runs means "not verified" and blocks the seal. It never counts as green.
6. **Rate limits.** REST allows 5,000 requests/h per user token; App installations start at 5,000 (15,000 on Enterprise Cloud). GraphQL allows 5,000 points/h. Secondary limits: 100 concurrent requests, and 900 REST or 2,000 GraphQL points per minute per endpoint. Use one GraphQL query per queue refresh, ETag/`If-None-Match` (a 304 is cheap), webhooks for `pull_request`, `check_suite` and `check_run` instead of polling, and a short TTL cache. On 403/429, honour `retry-after` or `x-ratelimit-reset`, then back off exponentially.

## Evidence

- [ci-cd.yml on main](https://github.com/k-dot-greyz/glitchworks-tarot/blob/main/.github/workflows/ci-cd.yml) · [sync-dev-master.yml](https://github.com/k-dot-greyz/glitchworks-tarot/blob/main/.github/workflows/sync-dev-master.yml)
- [Failed 0-job run 36586208677](https://github.com/k-dot-greyz/glitchworks-tarot/actions/runs/36586208677) · [Green run 35311145475](https://github.com/k-dot-greyz/glitchworks-tarot/actions/runs/35311145475) · [PR #40](https://github.com/k-dot-greyz/glitchworks-tarot/pull/40)
- [Ruleset def](https://github.com/k-dot-greyz/glitchworks-tarot/rules/16819647)
- [create-pull-request v8.1.1 commit](https://github.com/peter-evans/create-pull-request/commit/5f6978faf089d4d20b00c7766989d076bb2fc7f1)
- [REST rate limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api)
