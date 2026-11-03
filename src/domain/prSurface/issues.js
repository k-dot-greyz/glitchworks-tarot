import { ref, compactRefs } from './refs.js';

// "#1234" references in the PR body (not inside URLs / anchors). Derived: the
// REST pull object has no linked-issues field; GraphQL closingIssuesReferences
// was not read.
export const parseRefNumbers = (body = '') => {
  const out = [];
  const re = /(^|[^\w/&#])#(\d{1,6})\b/g;
  let m;
  while ((m = re.exec(body || ''))) {
    const n = Number(m[2]);
    if (!out.includes(n)) out.push(n);
  }
  return out;
};

const CLOSING = /\b(close[sd]?|fix(e[sd])?|resolve[sd]?)\s+#(\d+)/gi;

export const closingRefs = (body = '') => {
  const out = new Set();
  let m;
  while ((m = CLOSING.exec(body || ''))) out.add(Number(m[3]));
  return [...out];
};

export const linkedRefs = (pull, issues = {}, index = [], repoUrl) => {
  const nums = parseRefNumbers(pull.body).filter((n) => n !== pull.number);
  const closes = closingRefs(pull.body);
  const prNums = new Map(index.map((p) => [p.number, p]));
  const items = nums.map((n) => {
    const issue = issues[n];
    if (issue) {
      return {
        number: n,
        kind: issue.pull_request ? 'pull' : 'issue',
        title: issue.title,
        state: issue.state,
        labels: (issue.labels || []).map((l) => l.name),
        closes: closes.includes(n),
        url: issue.html_url,
        resolved: true,
      };
    }
    const pr = prNums.get(n);
    if (pr) {
      return {
        number: n,
        kind: 'pull',
        title: pr.title,
        state: pr.state,
        labels: (pr.labels || []).map((l) => l.name),
        closes: closes.includes(n),
        url: pr.html_url,
        resolved: true,
      };
    }
    return {
      number: n,
      kind: 'unknown',
      title: null,
      state: null,
      labels: [],
      closes: closes.includes(n),
      url: repoUrl ? `${repoUrl}/issues/${n}` : null,
      resolved: false,
    };
  });
  return {
    items,
    issues: items.filter((i) => i.kind === 'issue'),
    pulls: items.filter((i) => i.kind === 'pull'),
    unresolved: items.filter((i) => !i.resolved),
    closes,
    refs: compactRefs(
      items.map((i) => ref(`#${i.number}${i.title ? ` ${i.title}` : ''}`, i.url, i.kind === 'pull' ? 'pull' : 'issue')),
    ),
  };
};
