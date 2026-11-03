// Portable approval-queue decision core.
// Extracted from the PR decision surface prototype so it can be tested
// without the full React UI, or later ported to Rust.

export const SEVERITY_WEIGHT = { block: 100, warn: 20, ok: 4, info: 1 };
export const COLLAPSE_BELOW = 20;

export const DEFAULT_THRESHOLDS = {
  largeDiffLines: 1000,
  largeDiffFiles: 25,
  staleDays: 14,
};

const flag = (id, severity, label, reason, derived = false) => ({
  id,
  severity,
  label,
  reason,
  derived,
});

export function computeFlags({ pull, ci, reviews, repo, stack, ageDays }, opts = {}) {
  const t = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
  const protectedBranches = opts.protectedBranches || ['main'];
  const out = [];
  const lines = (pull.additions || 0) + (pull.deletions || 0);

  if (pull.merged) out.push(flag('merged', 'info', 'Merged', 'Already merged.'));
  else if (pull.state === 'closed') out.push(flag('closed', 'block', 'Closed', 'PR is closed.'));
  if (pull.draft) out.push(flag('draft', 'block', 'Draft', 'Marked as draft; not ready for merge.'));

  if (pull.mergeable === false || pull.mergeable_state === 'dirty') {
    out.push(flag('conflicts', 'block', 'Conflicts', `Not mergeable (mergeable_state: ${pull.mergeable_state}).`));
  } else if (pull.mergeable == null) {
    out.push(flag('mergeable-unknown', 'warn', 'Mergeability unknown', 'GitHub has not computed mergeability yet.'));
  } else if (pull.mergeable_state === 'behind') {
    out.push(flag('behind', 'warn', 'Behind base', 'Head is behind the base branch.'));
  } else if (pull.mergeable_state === 'blocked') {
    out.push(flag('blocked', 'block', 'Blocked by rules', 'Branch rules block merge.'));
  } else if (pull.mergeable_state === 'unstable') {
    out.push(flag('unstable', 'warn', 'Unstable', 'Mergeable, but some non-required checks are not passing.'));
  }

  if (ci?.failed) out.push(flag('failing-checks', 'block', 'Failing checks', `${ci.failed} of ${ci.total} checks failing.`));
  if (ci?.pending) out.push(flag('pending-checks', 'warn', 'Checks pending', `${ci.pending} of ${ci.total} checks not finished.`));
  if ((ci?.total ?? 0) === 0) out.push(flag('no-checks', 'warn', 'No checks', 'No check runs or statuses on the head commit.'));

  if (reviews?.changesRequested) {
    out.push(flag('changes-requested', 'block', 'Changes requested', `${reviews.changesRequested} reviewer(s) requested changes.`));
  }
  if (!reviews?.approved) {
    out.push(flag('no-approval', 'warn', 'No approval', `0 approvals${reviews?.pending ? `, ${reviews.pending} review(s) requested` : ''}.`));
  }

  if (protectedBranches.includes(pull.base?.ref)) {
    out.push(flag('protected-target', 'warn', `Targets ${pull.base.ref}`, `Base ${pull.base.ref} is protected.`, true));
  }
  if (lines > t.largeDiffLines || (pull.changed_files || 0) > t.largeDiffFiles) {
    out.push(flag('large-diff', 'warn', 'Large diff', `+${pull.additions}/-${pull.deletions} across ${pull.changed_files} files.`));
  }
  if (repo?.workflows?.length) {
    out.push(flag('workflows-touched', 'warn', 'Workflows touched', `${repo.workflows.length} CI workflow file(s) changed.`));
  }
  if (repo?.codeownersTouched?.length) {
    out.push(flag('codeowners-touched', 'warn', 'CODEOWNERS touched', 'Ownership rules changed in this PR.'));
  }
  if (stack?.stacked) {
    const parent = stack.below?.[0];
    const open = parent?.number && parent.state === 'open';
    out.push(flag('stacked', open ? 'warn' : 'info', 'Stacked', parent?.number ? `Stacked on #${parent.number}${open ? ' (still open)' : ''}.` : 'Stacked.', true));
  }
  if (typeof ageDays === 'number' && ageDays > t.staleDays) {
    out.push(flag('stale', 'info', 'Stale', `Open ${ageDays} days.`));
  }
  return out;
}

export function verdict(flags) {
  const blocks = flags.filter((f) => f.severity === 'block');
  if (blocks.length) return { id: 'no-merge', label: 'NO-MERGE', reasons: blocks.map((f) => f.label) };
  const gating = flags.filter((f) => ['no-approval', 'pending-checks', 'no-checks', 'mergeable-unknown', 'behind'].includes(f.id));
  if (gating.length) return { id: 'needs-review', label: 'NOT YET', reasons: gating.map((f) => f.label) };
  return { id: 'ready', label: 'OK', reasons: ['No blocking signals'] };
}

export function prSignalScore(flags, ageDays = 0) {
  return flags.reduce((s, f) => s + (SEVERITY_WEIGHT[f.severity] || 0), 0) + Math.min(ageDays || 0, 30) * 0.5;
}

export function decide(input, opts) {
  const flags = computeFlags(input, opts);
  return {
    flags,
    verdict: verdict(flags),
    score: prSignalScore(flags, input.ageDays),
  };
}
