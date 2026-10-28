// Signal scoring: how much a PR (or sidecar) bears on the merge decision.
export const SEVERITY_WEIGHT = { block: 100, warn: 20, ok: 4, info: 1 };
export const COLLAPSE_BELOW = 20; // sidecars below this are "noise": collapsed

export const verdict = (flags) => {
  const blocks = flags.filter((f) => f.severity === 'block');
  if (blocks.length)
    return {
      id: 'no-merge',
      label: 'NO-MERGE',
      reasons: blocks.map((f) => f.label),
    };
  const gating = flags.filter((f) =>
    ['no-approval', 'pending-checks', 'no-checks', 'mergeable-unknown', 'behind'].includes(f.id),
  );
  if (gating.length)
    return {
      id: 'needs-review',
      label: 'NOT YET',
      reasons: gating.map((f) => f.label),
    };
  return { id: 'ready', label: 'OK', reasons: ['No blocking signals'] };
};

export const prSignalScore = (flags, ageDays = 0) =>
  flags.reduce((s, f) => s + (SEVERITY_WEIGHT[f.severity] || 0), 0) + Math.min(ageDays || 0, 30) * 0.5;

export const sidecarScore = (severity, count = 0) => (SEVERITY_WEIGHT[severity] || 0) + Math.min(count, 10) * 0.1;

export const isCollapsed = (sidecar) => sidecar.signal < COLLAPSE_BELOW;
