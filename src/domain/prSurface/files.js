import { ref, compactRefs } from './refs.js';

export const fileExt = (name) => {
  const base = name.split('/').pop();
  const i = base.lastIndexOf('.');
  return i > 0 ? base.slice(i + 1).toLowerCase() : '(none)';
};

export const fileDir = (name, depth = 2) => {
  const parts = name.split('/');
  parts.pop();
  return parts.length ? parts.slice(0, depth).join('/') : '(root)';
};

const groupBy = (files, keyFn) => {
  const m = new Map();
  for (const f of files) {
    const k = keyFn(f.filename);
    const g = m.get(k) || {
      key: k,
      count: 0,
      additions: 0,
      deletions: 0,
      files: [],
    };
    g.count += 1;
    g.additions += f.additions || 0;
    g.deletions += f.deletions || 0;
    g.files.push(f.filename);
    m.set(k, g);
  }
  return [...m.values()].sort((a, b) => b.additions + b.deletions - (a.additions + a.deletions) || b.count - a.count);
};

// Shared directory prefix of all files (so grouping splits one level below it).
export const commonDir = (names = []) => {
  if (!names.length) return '';
  const split = names.map((n) => n.split('/').slice(0, -1));
  const first = split[0];
  let i = 0;
  while (i < first.length && split.every((s) => s[i] === first[i])) i += 1;
  return first.slice(0, i).join('/');
};

export const groupFiles = (files = []) => {
  const prefix = commonDir(files.map((f) => f.filename));
  const depth = prefix ? prefix.split('/').length + 1 : 2;
  return {
    commonDir: prefix,
    byDir: groupBy(files, (n) => fileDir(n, depth)),
    byType: groupBy(files, fileExt),
    binaryLike: files.filter((f) => (f.changes || 0) === 0).length,
    refs: compactRefs(files.map((f) => ref(f.filename, f.blob_url, 'file'))),
  };
};

export const SIZE_BUCKETS = [
  { max: 9, label: 'XS' },
  { max: 99, label: 'S' },
  { max: 499, label: 'M' },
  { max: 999, label: 'L' },
  { max: Infinity, label: 'XL' },
];

export const sizeClass = (lines) => SIZE_BUCKETS.find((b) => lines <= b.max).label;

const WORKFLOW = /^\.github\/workflows\//;
const CODEOWNERS = /(^|\/)CODEOWNERS$/;

/**
 * Repo sidecar files: workflows / CODEOWNERS touched, and CODEOWNERS coverage.
 * Ownership is an exact-path match against the CODEOWNERS excerpt lines (no
 * glob support; derived, default-branch state).
 */
export const repoSidecar = (files = [], codeowners = null) => {
  const workflows = files.filter((f) => WORKFLOW.test(f.filename));
  const codeownersTouched = files.filter((f) => CODEOWNERS.test(f.filename));
  const owners = new Map();
  for (const line of codeowners?.lines || []) {
    const [path, ...who] = line.trim().split(/\s+/);
    if (path) owners.set(path, who);
  }
  const owned = files.filter((f) => owners.has(f.filename));
  const unowned = codeowners ? files.filter((f) => !owners.has(f.filename)) : [];
  return {
    workflows: workflows.map((f) => f.filename),
    codeownersTouched: codeownersTouched.map((f) => f.filename),
    owned: owned.map((f) => ({
      filename: f.filename,
      owners: owners.get(f.filename),
    })),
    unowned: unowned.map((f) => f.filename),
    unownedAdded: unowned.filter((f) => f.status === 'added').length,
    codeownersKnown: Boolean(codeowners),
    refs: compactRefs([
      codeowners ? ref('CODEOWNERS (default branch)', codeowners.html_url, 'file') : null,
      ...workflows.map((f) => ref(f.filename, f.blob_url, 'file')),
      ...codeownersTouched.map((f) => ref(f.filename, f.blob_url, 'file')),
    ]),
  };
};
