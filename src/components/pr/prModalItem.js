// Central PR card → modal content (pure).
const VERDICT_SEVERITY = {
  'no-merge': 'block',
  'needs-review': 'warn',
  ready: 'ok',
};

export const prModalItem = (pr) => ({
  id: 'pr',
  arcana: 'The Querent',
  title: `#${pr.number} ${pr.title}`,
  severity: VERDICT_SEVERITY[pr.verdict.id],
  summary: `${pr.verdict.label}: ${pr.verdict.reasons.join(' · ')}`,
  derived: pr.flags.some((f) => f.derived),
  refs: pr.refs,
  sections: [
    {
      heading: 'Merge decision',
      rows: pr.flags.map((f) => ({
        label: f.label,
        value: `${f.reason}${f.derived ? ' (derived)' : ''}`,
        tone: f.severity === 'info' ? 'info' : f.severity,
      })),
      empty: 'No flags.',
    },
    {
      heading: 'Stats',
      rows: [
        {
          label: 'CI',
          value: `${pr.ci.state} · ${pr.ci.passed}/${pr.ci.total} passing, ${pr.ci.failed} failing, ${pr.ci.pending} pending`,
        },
        {
          label: 'Reviews',
          value: `${pr.reviews.approved} approved · ${pr.reviews.changesRequested} changes requested · ${pr.reviews.pending} requested`,
        },
        {
          label: 'Mergeability',
          value: `mergeable: ${String(pr.mergeability.mergeable)} · state: ${pr.mergeability.state} · rebaseable: ${String(pr.mergeability.rebaseable)}`,
        },
        {
          label: 'Size',
          value: `+${pr.stats.additions} / −${pr.stats.deletions} · ${pr.stats.changedFiles} files · ${pr.stats.commits} commits · ${pr.stats.size}`,
        },
        {
          label: 'Discussion',
          value: `${pr.stats.comments} comments · ${pr.stats.reviewComments} review comments (bodies not fetched)`,
        },
      ],
    },
    {
      heading: 'Branches & timeline',
      rows: [
        { label: 'Base ← head', value: `${pr.base} ← ${pr.head}` },
        { label: 'Head commit', value: pr.headSha },
        { label: 'Author', value: pr.author },
        {
          label: 'Created',
          value: `${pr.createdAt} (${pr.ageDays}d ago at snapshot)`,
        },
        { label: 'Updated', value: pr.updatedAt },
        { label: 'State', value: `${pr.state}${pr.draft ? ' · draft' : ''}` },
      ],
    },
    {
      heading: 'Labels',
      rows: pr.labels.map((l) => ({ label: l, value: 'label' })),
      empty: 'No labels.',
    },
  ],
});
