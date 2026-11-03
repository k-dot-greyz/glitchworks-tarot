#!/usr/bin/env node
/**
 * CI contract guard for the read-only PR decision surface (feat #44 / README-PROTO).
 * Fails fast on regressions: runtime network, HTML injection, local fixture leaks.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');

const prSources = [
  'src/components/pr/PrSpreadView.jsx',
  'src/components/pr/PrModal.jsx',
  'src/components/pr/PrCard.jsx',
  'src/domain/prSurface/viewModel.js',
  'src/fixtures/github/index.js',
];

const failures = [];

for (const rel of prSources) {
  const src = read(rel);
  if (/\bfetch\s*\(/.test(src)) failures.push(`${rel}: must not call fetch()`);
  if (/dangerouslySetInnerHTML/.test(src)) failures.push(`${rel}: must not use dangerouslySetInnerHTML`);
}

const fixtureIndex = read('src/fixtures/github/index.js');
if (!fixtureIndex.includes('VITE_PR_LOCAL_FIXTURES')) {
  failures.push('fixtures/github/index.js: local captures must stay flag-gated');
}
if (!fixtureIndex.includes("import.meta.env.VITE_PR_LOCAL_FIXTURES === '1'")) {
  failures.push('fixtures/github/index.js: missing explicit VITE_PR_LOCAL_FIXTURES gate');
}

const refs = read('src/domain/prSurface/refs.js');
if (!refs.includes('github.com')) {
  failures.push('refs.js: github.com allowlist missing');
}

const spread = read('src/components/pr/PrSpreadView.jsx');
for (const forbidden of ['merge now', 'approve pull', 'request review changes']) {
  if (spread.toLowerCase().includes(forbidden)) {
    failures.push(`PrSpreadView.jsx: forbidden write copy "${forbidden}"`);
  }
}

if (failures.length) {
  console.error('prSurfaceContractGuard: FAILED\n' + failures.map((f) => `  - ${f}`).join('\n'));
  process.exit(1);
}

console.log('prSurfaceContractGuard: OK');
