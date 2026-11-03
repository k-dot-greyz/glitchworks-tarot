// Static, bundled, read-only GitHub REST fixtures (no runtime network).
//
// Default: SYNTHETIC fixtures for the fictional example-org/example-repo
// (src/fixtures/github/example-repo/). Every title, login, branch and SHA there
// is made up.
//
// Optional, local-only: real captures dropped into src/fixtures/github/_local/
// (gitignored, never committed) are loaded ONLY when the dev server or build is
// started with VITE_PR_LOCAL_FIXTURES=1. Without the flag the glob below sits in
// a statically-false branch, so Vite drops it and the default build never
// references _local/ (and works when the directory is absent).
import { assembleFixtures } from './assemble.js';

export { assembleFixtures };

export const exampleRepoFixtures = assembleFixtures(
  import.meta.glob('./example-repo/**/*.json', { eager: true, import: 'default' }),
);

export const LOCAL_FIXTURES_ENABLED = import.meta.env.VITE_PR_LOCAL_FIXTURES === '1';

/** Resolves to the _local/ captures, or null when disabled / absent / incomplete. */
export const loadLocalFixtures = async () => {
  if (import.meta.env.VITE_PR_LOCAL_FIXTURES === '1') {
    const lazy = import.meta.glob('./_local/**/*.json', { eager: false, import: 'default' });
    const entries = Object.entries(lazy);
    if (!entries.length) return null;
    const modules = Object.fromEntries(await Promise.all(entries.map(async ([p, load]) => [p, await load()])));
    const fx = assembleFixtures(modules);
    if (!fx.prs.length) return null;
    return { ...fx, meta: { ...(fx.meta || {}), source_label: 'local captures (_local, not committed)' } };
  }
  return null;
};
