// Tiny example of the portable decision core.
// Run with: node --experimental-modules mvp/example.js  (or just import it)

import { decide } from './decision.js';

const synthetic = {
  pull: {
    number: 147,
    title: 'refactor(storage): split the adapter layer',
    state: 'open',
    draft: false,
    merged: false,
    mergeable: true,
    mergeable_state: 'clean',
    additions: 1890,
    deletions: 410,
    changed_files: 30,
    base: { ref: 'main' },
  },
  ci: { total: 2, failed: 0, pending: 0 },
  reviews: { approved: 0, changesRequested: 0, pending: 1 },
  ageDays: 3,
};

const result = decide(synthetic);
console.log(JSON.stringify(result, null, 2));
// Expected: NOT YET (no approval + large diff + protected target)
