import { ref, compactRefs } from './refs.js';

/**
 * Latest review state per reviewer (GitHub semantics: later APPROVED /
 * CHANGES_REQUESTED / DISMISSED supersede earlier ones; COMMENTED does not).
 */
export const summarizeReviews = (reviews = [], pull = {}) => {
  const sorted = [...reviews].sort((a, b) => Date.parse(a.submitted_at) - Date.parse(b.submitted_at));
  const latest = new Map();
  for (const r of sorted) {
    const login = r.user?.login || 'unknown';
    const prev = latest.get(login);
    if (r.state === 'COMMENTED' && prev && prev.state !== 'COMMENTED') continue;
    latest.set(login, r);
  }
  const byUser = [...latest.values()];
  const approved = byUser.filter((r) => r.state === 'APPROVED').length;
  const changesRequested = byUser.filter((r) => r.state === 'CHANGES_REQUESTED').length;
  const commented = byUser.filter((r) => r.state === 'COMMENTED').length;
  const requested = [
    ...(pull.requested_reviewers || []).map((u) => u.login),
    ...(pull.requested_teams || []).map((t) => `team:${t.slug || t.name}`),
  ];
  return {
    total: reviews.length,
    approved,
    changesRequested,
    commented,
    pending: requested.length,
    requested,
    latest: byUser.map((r) => ({
      login: r.user?.login || 'unknown',
      state: r.state,
      submittedAt: r.submitted_at || null,
      url: r.html_url || null,
    })),
    refs: compactRefs(byUser.map((r) => ref(`${r.user?.login || 'review'}: ${r.state}`, r.html_url, 'review'))),
  };
};
