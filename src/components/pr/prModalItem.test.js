import { describe, it, expect } from 'vitest';
import { prModalItem } from './prModalItem.js';

const basePr = (over = {}) => ({
  number: 42,
  title: 'Example PR',
  verdict: { id: 'ready', label: 'OK', reasons: [] },
  flags: [],
  refs: [{ label: 'PR', url: 'https://github.com/o/r/pull/42', kind: 'pull' }],
  ci: { state: 'success', passed: 1, total: 1, failed: 0, pending: 0 },
  reviews: { approved: 1, changesRequested: 0, pending: 0 },
  mergeability: { mergeable: true, state: 'clean', rebaseable: true },
  stats: {
    additions: 1,
    deletions: 0,
    changedFiles: 1,
    commits: 1,
    size: 'XS',
    comments: 0,
    reviewComments: 0,
  },
  base: 'main',
  head: 'feat/x',
  headSha: 'abc',
  author: 'dev',
  createdAt: '2026-10-01 12:00 UTC',
  updatedAt: '2026-10-01 12:00 UTC',
  ageDays: 1,
  state: 'open',
  draft: false,
  labels: [],
  ...over,
});

describe('prModalItem (central PR modal contract)', () => {
  it('maps ready verdict to ok severity and surfaces merge-decision rows', () => {
    const item = prModalItem(
      basePr({
        flags: [{ label: 'Clean CI', reason: 'All checks passed', severity: 'ok', derived: false }],
      }),
    );
    expect(item.severity).toBe('ok');
    expect(item.sections[0].heading).toBe('Merge decision');
    expect(item.sections[0].rows[0].label).toBe('Clean CI');
  });

  it('maps no-merge verdict to block severity and marks derived flags', () => {
    const item = prModalItem(
      basePr({
        verdict: { id: 'no-merge', label: 'NO-MERGE', reasons: ['Draft'] },
        flags: [{ label: 'Draft', reason: 'Still a draft', severity: 'block', derived: true }],
      }),
    );
    expect(item.severity).toBe('block');
    expect(item.derived).toBe(true);
    expect(item.summary).toContain('NO-MERGE');
    expect(item.sections[0].rows[0].value).toContain('(derived)');
  });

  it('sad: empty flags show graceful empty copy, refs pass through unchanged', () => {
    const refs = [{ label: 'PR', url: 'https://github.com/o/r/pull/42', kind: 'pull' }];
    const item = prModalItem(basePr({ flags: [], refs }));
    expect(item.sections[0].empty).toBe('No flags.');
    expect(item.refs).toEqual(refs);
  });
});
