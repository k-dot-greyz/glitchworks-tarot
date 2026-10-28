import { ref, compactRefs } from './refs.js';

const FAIL = new Set(['failure', 'timed_out', 'cancelled', 'action_required', 'startup_failure', 'stale']);
const NEUTRAL = new Set(['neutral', 'skipped']);

const runOutcome = (run) => {
  if (run.status !== 'completed') return 'pending';
  if (FAIL.has(run.conclusion)) return 'failure';
  if (NEUTRAL.has(run.conclusion)) return 'neutral';
  if (run.conclusion === 'success') return 'success';
  return 'pending';
};

const statusOutcome = (s) => {
  if (s.state === 'success') return 'success';
  if (s.state === 'failure' || s.state === 'error') return 'failure';
  return 'pending';
};

/**
 * Merge check runs (GET /commits/{sha}/check-runs) and combined status
 * (GET /commits/{sha}/status) into one CI summary.
 */
export const summarizeChecks = (checkRunsResp, statusResp) => {
  const runs = (checkRunsResp?.check_runs || []).map((r) => ({
    source: 'check-run',
    name: r.name,
    app: r.app?.slug || null,
    status: r.status,
    conclusion: r.conclusion,
    outcome: runOutcome(r),
    startedAt: r.started_at || null,
    completedAt: r.completed_at || null,
    url: r.html_url || null,
  }));
  const statuses = (statusResp?.statuses || []).map((s) => ({
    source: 'status',
    name: s.context,
    app: null,
    status: s.state,
    conclusion: s.state,
    description: s.description || null,
    outcome: statusOutcome(s),
    startedAt: s.created_at || null,
    completedAt: s.updated_at || null,
    url: s.target_url || null,
  }));
  const items = [...runs, ...statuses];
  const count = (o) => items.filter((i) => i.outcome === o).length;
  const failed = count('failure');
  const pending = count('pending');
  const passed = count('success');
  const neutral = count('neutral');
  let state = 'none';
  if (items.length) state = failed ? 'failure' : pending ? 'pending' : 'success';
  // Order: failures first, then pending, then the rest (signal before noise).
  const rank = { failure: 0, pending: 1, neutral: 2, success: 3 };
  items.sort((a, b) => rank[a.outcome] - rank[b.outcome] || a.name.localeCompare(b.name));
  return {
    state,
    total: items.length,
    passed,
    failed,
    pending,
    neutral,
    items,
    refs: compactRefs(items.map((i) => ref(`${i.name} (${i.outcome})`, i.url, 'check'))),
  };
};
