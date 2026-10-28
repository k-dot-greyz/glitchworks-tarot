import { describe, it, expect } from 'vitest';
import {
  buildSurface,
  buildPrViewModel,
  computeFlags,
  verdict,
  summarizeChecks,
  summarizeReviews,
  groupFiles,
  repoSidecar,
  sizeClass,
  stackChain,
  parseRefNumbers,
  closingRefs,
  isGithubHtmlUrl,
  ageDays,
  formatLocal,
  offsetLabel,
  COLLAPSE_BELOW,
} from './index.js';
import { exampleRepoFixtures, assembleFixtures, loadLocalFixtures } from '../../fixtures/github/index.js';

const basePull = (over = {}) => ({
  number: 1,
  title: 't',
  state: 'open',
  draft: false,
  merged: false,
  mergeable: true,
  mergeable_state: 'clean',
  additions: 10,
  deletions: 2,
  changed_files: 2,
  base: { ref: 'main' },
  head: { ref: 'feat/x', sha: 'abcdef1234' },
  html_url: 'https://github.com/o/r/pull/1',
  ...over,
});
const okCi = { total: 1, passed: 1, failed: 0, pending: 0 };
const approved = { approved: 1, changesRequested: 0, pending: 0 };
const ids = (fl) => fl.map((f) => f.id);

describe('prSurface/flags + verdict', () => {
  it('clean, approved, green PR on a non-protected branch is OK (ready)', () => {
    const f = computeFlags(
      { pull: basePull({ base: { ref: 'dev' } }), ci: okCi, reviews: approved },
      { protectedBranches: ['main'] },
    );
    expect(f).toEqual([]);
    expect(verdict(f).id).toBe('ready');
  });

  it('draft, conflicts, failing checks and changes requested all block', () => {
    const f = computeFlags({
      pull: basePull({
        draft: true,
        mergeable: false,
        mergeable_state: 'dirty',
      }),
      ci: { total: 2, passed: 1, failed: 1, pending: 0 },
      reviews: { approved: 0, changesRequested: 1, pending: 0 },
    });
    expect(ids(f)).toEqual(expect.arrayContaining(['draft', 'conflicts', 'failing-checks', 'changes-requested']));
    expect(f.filter((x) => x.severity === 'block')).toHaveLength(4);
    expect(verdict(f).id).toBe('no-merge');
  });

  it('flags protected target, large diff, no checks and missing approval as warnings', () => {
    const f = computeFlags({
      pull: basePull({ additions: 1979, deletions: 0, changed_files: 29 }),
      ci: { total: 0, passed: 0, failed: 0, pending: 0 },
      reviews: { approved: 0, changesRequested: 0, pending: 0 },
    });
    expect(ids(f)).toEqual(expect.arrayContaining(['protected-target', 'large-diff', 'no-checks', 'no-approval']));
    expect(f.every((x) => x.severity === 'warn')).toBe(true);
    expect(verdict(f).id).toBe('needs-review');
  });

  it('unknown mergeability is a warning, not a pass', () => {
    const f = computeFlags({
      pull: basePull({
        mergeable: null,
        mergeable_state: 'unknown',
        base: { ref: 'dev' },
      }),
      ci: okCi,
      reviews: approved,
    });
    expect(ids(f)).toEqual(['mergeable-unknown']);
  });

  it('workflow/CODEOWNERS changes are surfaced', () => {
    const repo = {
      workflows: ['.github/workflows/ci.yml'],
      codeownersTouched: ['.github/CODEOWNERS'],
      unowned: [],
      codeownersKnown: true,
    };
    const f = computeFlags({
      pull: basePull({ base: { ref: 'dev' } }),
      ci: okCi,
      reviews: approved,
      repo,
    });
    expect(ids(f)).toEqual(['workflows-touched', 'codeowners-touched']);
  });
});

describe('prSurface/checks', () => {
  it('merges check runs and statuses, failures first', () => {
    const ci = summarizeChecks(
      {
        check_runs: [
          {
            name: 'b-lint',
            status: 'completed',
            conclusion: 'success',
            html_url: 'https://github.com/o/r/runs/1',
          },
          {
            name: 'a-test',
            status: 'completed',
            conclusion: 'failure',
            html_url: 'https://github.com/o/r/runs/2',
          },
          {
            name: 'c-build',
            status: 'in_progress',
            conclusion: null,
            html_url: 'https://github.com/o/r/runs/3',
          },
        ],
      },
      {
        statuses: [{ context: 'CodeRabbit', state: 'success', target_url: null }],
      },
    );
    expect(ci.state).toBe('failure');
    expect([ci.total, ci.passed, ci.failed, ci.pending]).toEqual([4, 2, 1, 1]);
    expect(ci.items[0].name).toBe('a-test');
    expect(ci.refs).toHaveLength(3); // status with null target_url has no ref
  });

  it('reports none when nothing ran', () => {
    expect(summarizeChecks({ total_count: 0, check_runs: [] }, { statuses: [] }).state).toBe('none');
  });
});

describe('prSurface/reviews', () => {
  it('uses latest decisive review per user; COMMENTED does not override', () => {
    const r = summarizeReviews(
      [
        {
          user: { login: 'a' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2026-01-01T00:00:00Z',
        },
        {
          user: { login: 'a' },
          state: 'APPROVED',
          submitted_at: '2026-01-02T00:00:00Z',
        },
        {
          user: { login: 'a' },
          state: 'COMMENTED',
          submitted_at: '2026-01-03T00:00:00Z',
        },
        {
          user: { login: 'b' },
          state: 'CHANGES_REQUESTED',
          submitted_at: '2026-01-02T00:00:00Z',
        },
      ],
      { requested_reviewers: [{ login: 'c' }], requested_teams: [] },
    );
    expect([r.approved, r.changesRequested, r.pending]).toEqual([1, 1, 1]);
  });
});

describe('prSurface/files', () => {
  const files = [
    {
      filename: 'a/b/c/x.md',
      additions: 5,
      deletions: 0,
      changes: 5,
      status: 'added',
    },
    {
      filename: 'a/b/d/y.png',
      additions: 0,
      deletions: 0,
      changes: 0,
      status: 'added',
    },
    {
      filename: 'a/b/c/z.py',
      additions: 3,
      deletions: 1,
      changes: 4,
      status: 'modified',
    },
  ];
  it('groups below the shared prefix and by type', () => {
    const g = groupFiles(files);
    expect(g.commonDir).toBe('a/b');
    expect(g.byDir.map((d) => d.key)).toEqual(['a/b/c', 'a/b/d']);
    expect(g.byType.map((t) => t.key).sort()).toEqual(['md', 'png', 'py']);
    expect(g.binaryLike).toBe(1);
  });
  it('size buckets', () => {
    expect([sizeClass(5), sizeClass(50), sizeClass(400), sizeClass(800), sizeClass(1979)]).toEqual([
      'XS',
      'S',
      'M',
      'L',
      'XL',
    ]);
  });
  it('CODEOWNERS exact-path coverage and sidecar detection', () => {
    const r = repoSidecar(
      [
        ...files,
        {
          filename: '.github/workflows/ci.yml',
          blob_url: 'https://github.com/o/r/blob/s/.github/workflows/ci.yml',
        },
      ],
      {
        html_url: 'https://github.com/o/r/blob/main/.github/CODEOWNERS',
        lines: ['a/b/c/z.py @me'],
      },
    );
    expect(r.owned).toEqual([{ filename: 'a/b/c/z.py', owners: ['@me'] }]);
    expect(r.unowned).toHaveLength(3);
    expect(r.workflows).toEqual(['.github/workflows/ci.yml']);
    expect(r.refs.map((x) => x.kind)).toEqual(['file', 'file']);
  });
});

describe('prSurface/stack', () => {
  const index = [
    {
      number: 10,
      title: 'root',
      state: 'open',
      base: { ref: 'main' },
      head: { ref: 'feat/root' },
      html_url: 'https://github.com/o/r/pull/10',
    },
    {
      number: 11,
      title: 'mid',
      state: 'open',
      base: { ref: 'feat/root' },
      head: { ref: 'feat/mid' },
      html_url: 'https://github.com/o/r/pull/11',
    },
    {
      number: 12,
      title: 'top',
      state: 'open',
      base: { ref: 'feat/mid' },
      head: { ref: 'feat/top' },
      html_url: 'https://github.com/o/r/pull/12',
    },
    {
      number: 13,
      title: 'sib',
      state: 'open',
      base: { ref: 'feat/root' },
      head: { ref: 'feat/sib' },
      html_url: 'https://github.com/o/r/pull/13',
    },
  ];
  it('walks base chain to the default branch and finds PRs on top and siblings', () => {
    const s = stackChain({ number: 11, base: { ref: 'feat/root' }, head: { ref: 'feat/mid' } }, index, 'main');
    expect(s.stacked).toBe(true);
    expect(s.below.map((b) => b.number)).toEqual([10]);
    expect(s.root).toBe('main');
    expect(s.above.map((b) => b.number)).toEqual([12]);
    expect(s.siblings.map((b) => b.number)).toEqual([13]);
  });
  it('direct PR to main is not stacked', () => {
    expect(stackChain({ number: 10, base: { ref: 'main' }, head: { ref: 'feat/root' } }, index, 'main').stacked).toBe(
      false,
    );
  });
});

describe('prSurface/issues + refs + time', () => {
  it('parses #N refs but not URL anchors or HTML entities', () => {
    expect(parseRefNumbers('Epic: #120\n- part one: #121 see https://x.io/a#12 and &#39; (#199)')).toEqual([
      120, 121, 199,
    ]);
    expect(closingRefs('Closes #5, fixes #6 and mentions #7')).toEqual([5, 6]);
  });
  it('only github.com HTML URLs are allowed as references', () => {
    expect(isGithubHtmlUrl('https://github.com/o/r/pull/1')).toBe(true);
    expect(isGithubHtmlUrl('https://api.github.com/repos/o/r')).toBe(false);
    expect(isGithubHtmlUrl('javascript:alert(1)')).toBe(false);
    expect(isGithubHtmlUrl(null)).toBe(false);
  });
  it('ages and formats Z timestamps with a UTC-offset label', () => {
    expect(ageDays('2026-10-15T13:42:00Z', '2026-10-17T23:18:00Z')).toBe(2);
    // Explicit offsets: deterministic regardless of the runtime time zone.
    expect(formatLocal('2026-10-15T13:42:00Z', { offsetMinutes: 120 })).toBe('2026-10-15 15:42 UTC+2');
    expect(formatLocal('2026-07-01T12:00:00Z', { offsetMinutes: 180 })).toBe('2026-07-01 15:00 UTC+3');
    expect(formatLocal('2026-10-27T23:30:00Z', { offsetMinutes: 120 })).toBe('2026-10-28 01:30 UTC+2');
    expect(formatLocal('2026-10-15T13:42:00Z', { offsetMinutes: 0 })).toBe('2026-10-15 13:42 UTC');
    expect(formatLocal('2026-10-15T13:42:00Z', { offsetMinutes: -330 })).toBe('2026-10-15 08:12 UTC-5:30');
    expect(formatLocal('nope')).toBe('unknown');
    expect(offsetLabel(330)).toBe('UTC+5:30');
    // Default = runtime local time; vitest pins TZ to a fixed UTC+2 zone (vitest.config.js).
    expect(formatLocal('2026-10-15T13:42:00Z')).toBe('2026-10-15 15:42 UTC+2');
  });
});

describe('prSurface/view model on synthetic example-repo fixtures', () => {
  const fx = exampleRepoFixtures;
  const surface = buildSurface(fx);
  const pr = (n) => surface.prs.find((p) => p.number === n);
  const flagIds = (n) => pr(n).flags.map((f) => f.id);
  const WEB = 'https://github.com/example-org/example-repo';

  it('loads the four synthetic PRs (fictional public repo) ordered by signal', () => {
    expect(surface.repo).toBe('example-org/example-repo');
    expect(surface.sourceLabel).toBe('synthetic fixtures');
    expect(surface.prs.map((p) => p.number).sort()).toEqual([142, 145, 147, 149]);
    const signals = surface.prs.map((p) => p.signal);
    expect([...signals].sort((a, b) => b - a)).toEqual(signals);
    for (const { pull } of fx.prs) {
      expect(pull.base.repo.private).toBe(false);
      expect(pull.base.repo.full_name).toBe('example-org/example-repo');
      expect(pull.html_url.startsWith(`${WEB}/pull/`)).toBe(true);
      expect(pull.head.sha).toMatch(/^[0-9a-f]{40}$/);
      expect(pull.created_at).toMatch(/Z$/);
    }
    expect(JSON.stringify(fx)).not.toMatch(/git@|@[\w.-]+\.(com|net|org|io)\b/);
  });

  it('verdicts across the four states: NO-MERGE ×2, NOT YET, OK', () => {
    const v = Object.fromEntries(surface.prs.map((p) => [p.number, p.verdict.label]));
    expect(v).toEqual({ 142: 'NO-MERGE', 145: 'NO-MERGE', 147: 'NOT YET', 149: 'OK' });
  });

  it('(a) #142: draft stacked on open #138 → NO-MERGE; stack sidecar shows parent and sibling', () => {
    const p = pr(142);
    expect(p.draft).toBe(true);
    expect(p.verdict.id).toBe('no-merge');
    expect(p.verdict.reasons).toContain('Draft');
    expect(flagIds(142)).toEqual(expect.arrayContaining(['draft', 'stacked', 'no-approval']));
    expect(p.flags.find((f) => f.id === 'stacked')).toMatchObject({ severity: 'warn' });
    const stack = p.sidecars.find((s) => s.id === 'stack');
    expect(stack.summary).toBe('On #138 → main');
    expect(stack.severity).toBe('warn');
    expect(stack.sections[2].rows.map((r) => r.label)).toEqual(['#140']);
    expect(stack.refs.map((r) => r.url)).toEqual(expect.arrayContaining([`${WEB}/pull/138`, `${WEB}/pull/140`]));
  });

  it('(b) #145: draft with linked issues → NO-MERGE; #120/#121 resolve, #199 stays unresolved', () => {
    const p = pr(145);
    expect(p.verdict.id).toBe('no-merge');
    expect(p.base).toBe('main');
    const issues = p.sidecars.find((s) => s.id === 'issues');
    expect(issues.summary).toBe('2 issues, 0 PRs, 1 unresolved');
    const rows = issues.sections[0].rows;
    expect(rows.map((r) => r.label)).toEqual(['#120 (closes)', '#121', '#199']);
    expect(rows[0].value).toContain('open');
    expect(rows[1].value).toContain('closed');
    expect(rows[2].value).toBe('not in fixtures (title/state not fetched)');
    expect(issues.refs.map((r) => r.url)).toEqual(
      expect.arrayContaining([`${WEB}/issues/120`, `${WEB}/issues/121`, `${WEB}/issues/199`]),
    );
  });

  it('(c) #147: large diff, unreviewed, clean CI 2/2, targets main → NOT YET', () => {
    const p = pr(147);
    expect(p.verdict.id).toBe('needs-review');
    expect(p.verdict.reasons).toEqual(['No approval']);
    expect(flagIds(147)).toEqual(expect.arrayContaining(['no-approval', 'protected-target', 'large-diff']));
    expect(p.flags.filter((f) => f.severity === 'block')).toEqual([]);
    expect(p.ci).toMatchObject({ state: 'success', total: 2, passed: 2, failed: 0, pending: 0 });
    expect(p.mergeability).toMatchObject({ mergeable: true, state: 'clean' });
    expect(p.stats).toMatchObject({ additions: 1890, deletions: 410, changedFiles: 30, size: 'XL' });
    expect(p.reviews).toMatchObject({ approved: 0, pending: 1 });
    expect(p.createdAt).toBe('2026-10-17 17:45 UTC+2');
  });

  it('(d) #149: approved, green, clean, small → OK', () => {
    const p = pr(149);
    expect(p.verdict).toMatchObject({ id: 'ready', label: 'OK' });
    expect(p.flags.filter((f) => f.severity === 'block')).toEqual([]);
    expect(flagIds(149)).not.toContain('no-approval');
    expect(p.reviews).toMatchObject({ approved: 1, changesRequested: 0 });
    expect(p.ci).toMatchObject({ state: 'success', total: 2, passed: 2 });
    expect(p.stats).toMatchObject({ additions: 14, deletions: 3, changedFiles: 2, size: 'S' });
    const repo = p.sidecars.find((s) => s.id === 'repo');
    expect(repo.sections[1].rows[0]).toMatchObject({ label: 'src/cli/config.js', tone: 'ok' });
  });

  it('every sidecar is sorted by signal, low signal collapsed, all refs github.com', () => {
    for (const p of surface.prs) {
      expect(p.sidecars).toHaveLength(6);
      const sig = p.sidecars.map((s) => s.signal);
      expect([...sig].sort((a, b) => b - a)).toEqual(sig);
      for (const s of p.sidecars) {
        expect(s.collapsed).toBe(s.signal < COLLAPSE_BELOW);
        for (const r of s.refs) expect(isGithubHtmlUrl(r.url)).toBe(true);
      }
      for (const r of p.refs) expect(isGithubHtmlUrl(r.url)).toBe(true);
    }
  });

  it('is pure: same input → same output, inputs not mutated', () => {
    const one = fx.prs[0];
    const before = JSON.stringify(one);
    const ctx = { now: fx.meta.snapshot_at, pullsIndex: fx.pullsIndex, codeowners: fx.codeowners };
    expect(buildPrViewModel(one, ctx)).toEqual(buildPrViewModel(one, ctx));
    expect(JSON.stringify(one)).toBe(before);
  });
});

describe('fixtures/github loader', () => {
  it('assembles a module map with the shared layout', () => {
    const fxs = assembleFixtures({
      './x/_meta.json': { repo: 'o/r', prs: [7] },
      './x/pulls-index.json': [{ number: 7 }],
      './x/pr-7/pull.json': { number: 7 },
      './x/pr-7/files.json': [{ filename: 'a.js' }],
      './x/pr-7/issues/3.json': { number: 3 },
      './x/pr-8/files.json': [],
    });
    expect(fxs.meta.repo).toBe('o/r');
    expect(fxs.prs).toHaveLength(1);
    expect(fxs.prs[0]).toMatchObject({ pull: { number: 7 }, reviews: [], issues: { 3: { number: 3 } } });
  });

  it('local captures are off unless VITE_PR_LOCAL_FIXTURES=1', async () => {
    expect(await loadLocalFixtures()).toBeNull();
  });
});
