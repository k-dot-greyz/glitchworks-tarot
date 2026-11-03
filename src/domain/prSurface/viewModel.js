import { summarizeChecks } from './checks.js';
import { summarizeReviews } from './reviews.js';
import { groupFiles, repoSidecar, sizeClass } from './files.js';
import { stackChain } from './stack.js';
import { linkedRefs } from './issues.js';
import { computeFlags, sortFlags } from './flags.js';
import { verdict, prSignalScore, sidecarScore, isCollapsed } from './signal.js';
import { ageDays, formatLocal } from './time.js';
import { ref, compactRefs } from './refs.js';

const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'}`;

const checksSidecar = (ci, pull) => {
  const severity = ci.failed ? 'block' : ci.pending || ci.total === 0 ? 'warn' : 'ok';
  const summary =
    ci.total === 0
      ? 'No checks reported on head commit'
      : `${ci.passed}/${ci.total} passing${ci.failed ? `, ${ci.failed} failing` : ''}${ci.pending ? `, ${ci.pending} pending` : ''}`;
  return {
    id: 'checks',
    arcana: 'The Trial',
    title: 'Check runs',
    severity,
    summary,
    metric: ci.total ? `${ci.passed}/${ci.total}` : '0',
    sections: [
      {
        heading: `Checks on ${pull.head.sha.slice(0, 7)}`,
        rows: ci.items.map((i) => ({
          label: `${i.name}${i.app ? ` (${i.app})` : i.source === 'status' ? ' (status)' : ''}`,
          value: `${i.outcome}${i.description ? ` — ${i.description}` : ''}${i.completedAt ? ` · ${formatLocal(i.completedAt)}` : ''}`,
          tone: i.outcome === 'failure' ? 'block' : i.outcome === 'pending' ? 'warn' : 'ok',
          url: i.url,
        })),
        empty: 'No check runs (total_count 0) and no commit statuses.',
      },
    ],
    refs: compactRefs([ref('PR checks tab', `${pull.html_url}/checks`, 'pull'), ...ci.refs]),
    count: ci.total,
  };
};

const reviewsSidecar = (rv, pull) => {
  const severity = rv.changesRequested ? 'block' : rv.approved ? 'ok' : 'warn';
  return {
    id: 'reviews',
    arcana: 'The Council',
    title: 'Reviews',
    severity,
    summary: `${rv.approved} approved · ${rv.changesRequested} changes requested · ${rv.pending} pending`,
    metric: `${rv.approved}✓ ${rv.changesRequested}✗ ${rv.pending} pend`,
    sections: [
      {
        heading: 'Latest review per reviewer',
        rows: rv.latest.map((r) => ({
          label: r.login,
          value: `${r.state}${r.submittedAt ? ` · ${formatLocal(r.submittedAt)}` : ''}`,
          tone: r.state === 'CHANGES_REQUESTED' ? 'block' : r.state === 'APPROVED' ? 'ok' : 'info',
          url: r.url,
        })),
        empty: 'No reviews submitted.',
      },
      {
        heading: 'Requested reviewers',
        rows: rv.requested.map((l) => ({
          label: l,
          value: 'pending',
          tone: 'warn',
        })),
        empty: 'None requested.',
      },
    ],
    refs: compactRefs([ref('PR conversation', pull.html_url, 'pull'), ...rv.refs]),
    count: rv.total,
  };
};

const issuesSidecar = (links) => ({
  id: 'issues',
  arcana: 'The Threads',
  title: 'Linked issues & PRs',
  severity: 'info',
  summary: links.items.length
    ? `${plural(links.issues.length, 'issue')}, ${plural(links.pulls.length, 'PR')}${links.unresolved.length ? `, ${links.unresolved.length} unresolved` : ''}`
    : 'No #references in PR body',
  metric: String(links.items.length),
  derived: true,
  sections: [
    {
      heading: 'Referenced in body (derived from #N mentions)',
      rows: links.items.map((i) => ({
        label: `#${i.number}${i.closes ? ' (closes)' : ''}`,
        value: i.resolved
          ? `${i.kind} · ${i.state} · ${i.title}${i.labels.length ? ` · ${i.labels.join(', ')}` : ''}`
          : 'not in fixtures (title/state not fetched)',
        tone: 'info',
        url: i.url,
      })),
      empty: 'The PR body references no issues or PRs.',
    },
  ],
  refs: links.refs,
  count: links.items.length,
});

const filesSidecar = (groups, pull, large) => ({
  id: 'files',
  arcana: 'The Archive',
  title: 'File groups',
  severity: large ? 'warn' : 'info',
  summary: `${plural(pull.changed_files, 'file')} in ${plural(groups.byDir.length, 'dir')} · ${groups.byType
    .map((g) => `${g.key}×${g.count}`)
    .slice(0, 4)
    .join(' ')}`,
  metric: `${pull.changed_files}`,
  sections: [
    {
      heading: groups.commonDir ? `By directory (under ${groups.commonDir}/)` : 'By directory',
      rows: groups.byDir.map((g) => ({
        label: g.key,
        value: `${plural(g.count, 'file')} · +${g.additions}/-${g.deletions}`,
        tone: 'info',
      })),
    },
    {
      heading: 'By type',
      rows: groups.byType.map((g) => ({
        label: `.${g.key}`,
        value: `${plural(g.count, 'file')} · +${g.additions}/-${g.deletions}`,
        tone: 'info',
      })),
    },
    ...(groups.binaryLike
      ? [
          {
            heading: 'Binary / no-line changes',
            rows: [
              {
                label: 'files with 0 line changes',
                value: String(groups.binaryLike),
                tone: 'info',
              },
            ],
          },
        ]
      : []),
  ],
  refs: compactRefs([ref('PR files tab', `${pull.html_url}/files`, 'pull'), ...groups.refs]),
  count: pull.changed_files,
});

const stackSidecar = (stack, pull) => ({
  id: 'stack',
  arcana: 'The Tower',
  title: 'Stacked PRs',
  severity: stack.stacked && stack.below.some((b) => b.state === 'open') ? 'warn' : 'info',
  summary: stack.stacked
    ? `On ${stack.below.map((b) => (b.number ? `#${b.number}` : b.head)).join(' → ')} → ${stack.root}`
    : stack.above.length
      ? `${plural(stack.above.length, 'PR')} stacked on top`
      : `Direct to ${pull.base.ref}; not stacked`,
  metric: String(stack.depth + stack.above.length),
  derived: true,
  sections: [
    {
      heading: 'Chain (base side)',
      rows: [
        {
          label: `#${pull.number} (this PR)`,
          value: `${pull.head.ref} → ${pull.base.ref}`,
          tone: 'info',
          url: pull.html_url,
        },
        ...stack.below.map((b) => ({
          label: b.number ? `#${b.number}` : 'branch',
          value: b.number ? `${b.head} → ${b.base} · ${b.state}${b.draft ? ' · draft' : ''} · ${b.title}` : b.title,
          tone: 'info',
          url: b.url,
        })),
      ],
    },
    {
      heading: 'Stacked on top (head side)',
      rows: stack.above.map((p) => ({
        label: `#${p.number}`,
        value: `${p.head} → ${p.base} · ${p.title}`,
        tone: 'info',
        url: p.url,
      })),
      empty: 'None in the PR index.',
    },
    {
      heading: 'Siblings (same base)',
      rows: stack.siblings.map((p) => ({
        label: `#${p.number}`,
        value: `${p.head} → ${p.base} · ${p.title}`,
        tone: 'info',
        url: p.url,
      })),
      empty: 'None.',
    },
  ],
  refs: stack.refs,
  count: stack.depth + stack.above.length + stack.siblings.length,
});

const repoSidecarCard = (repo) => ({
  id: 'repo',
  arcana: 'The Keeper',
  title: 'Repo sidecar files',
  severity: repo.workflows.length || repo.codeownersTouched.length ? 'warn' : 'info',
  summary: `${plural(repo.workflows.length, 'workflow')} · CODEOWNERS ${repo.codeownersTouched.length ? 'touched' : 'untouched'} · ${repo.unowned.length} unowned`,
  metric: String(repo.workflows.length + repo.codeownersTouched.length),
  derived: true,
  sections: [
    {
      heading: 'Workflow files touched',
      rows: repo.workflows.map((w) => ({
        label: w,
        value: 'changed',
        tone: 'warn',
      })),
      empty: 'No .github/workflows/* changes.',
    },
    {
      heading: 'CODEOWNERS coverage (exact paths, default branch)',
      rows: [
        ...repo.owned.map((o) => ({
          label: o.filename,
          value: o.owners.join(' '),
          tone: 'ok',
        })),
        ...repo.unowned.slice(0, 12).map((f) => ({ label: f, value: 'unowned', tone: 'info' })),
        ...(repo.unowned.length > 12
          ? [
              {
                label: `…and ${repo.unowned.length - 12} more`,
                value: 'unowned',
                tone: 'info',
              },
            ]
          : []),
      ],
      empty: 'CODEOWNERS not available.',
    },
  ],
  refs: repo.refs,
  count: repo.workflows.length + repo.codeownersTouched.length,
});

export const buildPrViewModel = (fx, ctx = {}) => {
  const { pull } = fx;
  const now = ctx.now || new Date().toISOString();
  const defaultBranch = ctx.defaultBranch || pull.base?.repo?.default_branch || 'main';
  const repoUrl = pull.base?.repo?.html_url || ctx.repoUrl;
  const ci = summarizeChecks(fx.checkRuns, fx.status);
  const reviews = summarizeReviews(fx.reviews, pull);
  const groups = groupFiles(fx.files);
  const repo = repoSidecar(fx.files, ctx.codeowners);
  const stack = stackChain(pull, ctx.pullsIndex, defaultBranch);
  const links = linkedRefs(pull, fx.issues, ctx.pullsIndex, repoUrl);
  const age = ageDays(pull.created_at, now);
  const flags = sortFlags(
    computeFlags(
      { pull, ci, reviews, repo, stack, ageDays: age },
      { protectedBranches: ctx.protectedBranches, thresholds: ctx.thresholds },
    ),
  );
  const large = flags.some((f) => f.id === 'large-diff');

  const sidecars = [
    checksSidecar(ci, pull),
    reviewsSidecar(reviews, pull),
    issuesSidecar(links),
    filesSidecar(groups, pull, large),
    stackSidecar(stack, pull),
    repoSidecarCard(repo),
  ]
    .map((s) => {
      const signal = sidecarScore(s.severity, s.count);
      return { ...s, signal, collapsed: isCollapsed({ signal }) };
    })
    .sort((a, b) => b.signal - a.signal);

  const lines = (pull.additions || 0) + (pull.deletions || 0);
  return {
    number: pull.number,
    title: pull.title,
    url: pull.html_url,
    author: pull.user?.login,
    state: pull.state,
    draft: Boolean(pull.draft),
    base: pull.base?.ref,
    head: pull.head?.ref,
    headSha: pull.head?.sha,
    labels: (pull.labels || []).map((l) => l.name),
    createdAt: formatLocal(pull.created_at),
    updatedAt: formatLocal(pull.updated_at),
    ageDays: age,
    stats: {
      additions: pull.additions,
      deletions: pull.deletions,
      changedFiles: pull.changed_files,
      commits: pull.commits,
      comments: pull.comments,
      reviewComments: pull.review_comments,
      size: sizeClass(lines),
    },
    mergeability: {
      mergeable: pull.mergeable,
      state: pull.mergeable_state,
      rebaseable: pull.rebaseable,
    },
    ci: {
      state: ci.state,
      passed: ci.passed,
      total: ci.total,
      failed: ci.failed,
      pending: ci.pending,
    },
    reviews: {
      approved: reviews.approved,
      changesRequested: reviews.changesRequested,
      pending: reviews.pending,
      total: reviews.total,
    },
    flags,
    verdict: verdict(flags),
    signal: prSignalScore(flags, age),
    sidecars,
    refs: compactRefs([
      ref(`PR #${pull.number}`, pull.html_url, 'pull'),
      ref('Files changed', `${pull.html_url}/files`, 'pull'),
      ref('Checks', `${pull.html_url}/checks`, 'pull'),
      ref('Commits', `${pull.html_url}/commits`, 'pull'),
      repoUrl ? ref(`Base: ${pull.base.ref}`, `${repoUrl}/tree/${pull.base.ref}`, 'branch') : null,
      repoUrl ? ref(`Head: ${pull.head.ref}`, `${repoUrl}/tree/${pull.head.ref}`, 'branch') : null,
      repoUrl ? ref(`Head commit ${pull.head.sha.slice(0, 7)}`, `${repoUrl}/commit/${pull.head.sha}`, 'commit') : null,
    ]),
  };
};

/** All PRs, highest decision signal first. */
export const buildSurface = (fixtures) => {
  const ctx = {
    now: fixtures.meta?.snapshot_at,
    defaultBranch: fixtures.meta?.default_branch,
    protectedBranches: fixtures.meta?.protected_branches,
    repoUrl: fixtures.meta?.repo_html_url,
    pullsIndex: fixtures.pullsIndex,
    codeowners: fixtures.codeowners,
  };
  return {
    repo: fixtures.meta?.repo,
    sourceLabel: fixtures.meta?.source_label || 'fixtures',
    snapshotAt: formatLocal(fixtures.meta?.snapshot_at),
    prs: fixtures.prs.map((fx) => buildPrViewModel(fx, ctx)).sort((a, b) => b.signal - a.signal || b.number - a.number),
  };
};
