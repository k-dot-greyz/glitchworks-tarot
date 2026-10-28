// Turns a flat { './<root>/<path>.json': data } module map into the fixture
// object the PR surface consumes. Layout under <root>/ (same REST shapes for
// synthetic and local captures):
//   _meta.json, pulls-index.json, codeowners-excerpt.json,
//   pr-<n>/{pull,files,reviews,check-runs,status}.json, pr-<n>/issues/<k>.json
const PR_FILE = /\/pr-(\d+)\/(pull|files|reviews|check-runs|status)\.json$/;
const PR_ISSUE = /\/pr-(\d+)\/issues\/(\d+)\.json$/;
const KEY = { pull: 'pull', files: 'files', reviews: 'reviews', 'check-runs': 'checkRuns', status: 'status' };

export const assembleFixtures = (modules) => {
  const out = { meta: null, pullsIndex: [], codeowners: null, prs: [] };
  const prs = new Map();
  const pr = (n) => {
    if (!prs.has(n)) prs.set(n, { issues: {} });
    return prs.get(n);
  };
  for (const [path, data] of Object.entries(modules)) {
    let m;
    if (path.endsWith('/_meta.json')) out.meta = data;
    else if (path.endsWith('/pulls-index.json')) out.pullsIndex = data;
    else if (path.endsWith('/codeowners-excerpt.json')) out.codeowners = data;
    else if ((m = PR_FILE.exec(path))) pr(Number(m[1]))[KEY[m[2]]] = data;
    else if ((m = PR_ISSUE.exec(path))) pr(Number(m[1])).issues[Number(m[2])] = data;
  }
  const order = out.meta?.prs || [...prs.keys()].sort((a, b) => b - a);
  out.prs = order
    .filter((n) => prs.get(n)?.pull)
    .map((n) => {
      const p = prs.get(n);
      return { files: [], reviews: [], checkRuns: null, status: null, ...p };
    });
  return out;
};
