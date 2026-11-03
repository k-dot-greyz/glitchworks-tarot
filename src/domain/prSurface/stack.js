import { ref, compactRefs } from './refs.js';

const brief = (p) => ({
  number: p.number,
  title: p.title,
  state: p.state,
  draft: Boolean(p.draft),
  base: p.base?.ref,
  head: p.head?.ref,
  url: p.html_url,
});

/**
 * Base/head chain from a PR list (GET /pulls subset). Walk down: the PR whose
 * head is this PR's base. Walk up: PRs whose base is this PR's head.
 * Limitation: only PRs present in the index are visible.
 */
export const stackChain = (pull, index = [], defaultBranch = 'main') => {
  const open = index.filter((p) => p.number !== pull.number);
  const below = [];
  let base = pull.base?.ref;
  const guard = new Set([pull.number]);
  while (base && base !== defaultBranch) {
    const parent =
      open.find((p) => p.head?.ref === base && p.state === 'open' && !guard.has(p.number)) ||
      open.find((p) => p.head?.ref === base && !guard.has(p.number));
    if (!parent) {
      below.push({
        number: null,
        title: `branch ${base} (no PR in index)`,
        base: null,
        head: base,
        url: null,
      });
      break;
    }
    guard.add(parent.number);
    below.push(brief(parent));
    base = parent.base?.ref;
  }
  const above = open.filter((p) => p.base?.ref === pull.head?.ref).map(brief);
  const siblings =
    pull.base?.ref && pull.base.ref !== defaultBranch
      ? open.filter((p) => p.base?.ref === pull.base.ref && !guard.has(p.number)).map(brief)
      : [];
  const stacked = pull.base?.ref !== defaultBranch;
  return {
    stacked,
    root: below.length ? below[below.length - 1].base || below[below.length - 1].head : pull.base?.ref,
    below,
    above,
    siblings,
    depth: below.filter((b) => b.number).length,
    refs: compactRefs([...below, ...above, ...siblings].map((p) => ref(`#${p.number} ${p.title}`, p.url, 'pull'))),
  };
};
