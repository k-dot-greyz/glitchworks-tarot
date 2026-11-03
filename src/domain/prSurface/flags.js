// Merge-decision flags. severity: 'block' (no-merge), 'warn' (decide
// consciously), 'info' (context). Every flag carries a human reason.
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

export const computeFlags = ({ pull, ci, reviews, repo, stack, ageDays }, opts = {}) => {
  const t = { ...DEFAULT_THRESHOLDS, ...(opts.thresholds || {}) };
  const protectedBranches = opts.protectedBranches || ['main'];
  const out = [];
  const lines = (pull.additions || 0) + (pull.deletions || 0);

  if (pull.merged) out.push(flag('merged', 'info', 'Merged', 'Already merged.'));
  else if (pull.state === 'closed') out.push(flag('closed', 'block', 'Closed', 'PR is closed.'));
  if (pull.draft) out.push(flag('draft', 'block', 'Draft', 'Marked as draft; not ready for merge.'));

  if (pull.mergeable === false || pull.mergeable_state === 'dirty') {
    out.push(flag('conflicts', 'block', 'Conflicts', `Not mergeable (mergeable_state: ${pull.mergeable_state}).`));
  } else if (pull.mergeable === null || pull.mergeable === undefined) {
    out.push(flag('mergeable-unknown', 'warn', 'Mergeability unknown', 'GitHub has not computed mergeability yet.'));
  } else if (pull.mergeable_state === 'behind') {
    out.push(flag('behind', 'warn', 'Behind base', 'Head is behind the base branch.'));
  } else if (pull.mergeable_state === 'blocked') {
    out.push(flag('blocked', 'block', 'Blocked by rules', 'Branch rules block merge (mergeable_state: blocked).'));
  } else if (pull.mergeable_state === 'unstable') {
    out.push(flag('unstable', 'warn', 'Unstable', 'Mergeable, but some non-required checks are not passing.'));
  }

  if (ci.failed)
    out.push(flag('failing-checks', 'block', 'Failing checks', `${ci.failed} of ${ci.total} checks failing.`));
  if (ci.pending)
    out.push(flag('pending-checks', 'warn', 'Checks pending', `${ci.pending} of ${ci.total} checks not finished.`));
  if (ci.total === 0) out.push(flag('no-checks', 'warn', 'No checks', 'No check runs or statuses on the head commit.'));

  if (reviews.changesRequested) {
    out.push(
      flag(
        'changes-requested',
        'block',
        'Changes requested',
        `${reviews.changesRequested} reviewer(s) requested changes.`,
      ),
    );
  }
  if (!reviews.approved) {
    out.push(
      flag(
        'no-approval',
        'warn',
        'No approval',
        `0 approvals${reviews.pending ? `, ${reviews.pending} review(s) requested` : ', no reviewers requested'}.`,
      ),
    );
  }

  if (protectedBranches.includes(pull.base?.ref)) {
    out.push(
      flag(
        'protected-target',
        'warn',
        `Targets ${pull.base.ref}`,
        `Base ${pull.base.ref} is protected and auto-deploys on merge.`,
        true,
      ),
    );
  }
  if (lines > t.largeDiffLines || (pull.changed_files || 0) > t.largeDiffFiles) {
    out.push(
      flag(
        'large-diff',
        'warn',
        'Large diff',
        `+${pull.additions}/-${pull.deletions} across ${pull.changed_files} files.`,
      ),
    );
  }
  if (repo?.workflows?.length) {
    out.push(
      flag('workflows-touched', 'warn', 'Workflows touched', `${repo.workflows.length} CI workflow file(s) changed.`),
    );
  }
  if (repo?.codeownersTouched?.length) {
    out.push(flag('codeowners-touched', 'warn', 'CODEOWNERS touched', 'Ownership rules changed in this PR.'));
  }
  if (repo?.codeownersKnown && repo.unowned.length) {
    out.push(
      flag(
        'unowned-files',
        'info',
        'Unowned files',
        `${repo.unowned.length} file(s) not listed in CODEOWNERS on the default branch.`,
        true,
      ),
    );
  }
  if (stack?.stacked) {
    const parent = stack.below[0];
    const open = parent?.number && parent.state === 'open';
    out.push(
      flag(
        'stacked',
        open ? 'warn' : 'info',
        'Stacked',
        parent?.number
          ? `Merges into ${pull.base.ref} (head of #${parent.number}${open ? ', still open' : ''}), not ${stack.root}.`
          : `Base is ${pull.base?.ref}.`,
        true,
      ),
    );
  }
  if (typeof ageDays === 'number' && ageDays > t.staleDays) {
    out.push(flag('stale', 'info', 'Stale', `Open ${ageDays} days.`));
  }
  return out;
};

export const SEVERITY_RANK = { block: 0, warn: 1, info: 2 };
export const sortFlags = (flags) => [...flags].sort((a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity]);
