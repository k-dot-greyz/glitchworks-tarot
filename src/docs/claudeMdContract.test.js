import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  assertCiWorkflowParity,
  assertClaudeMdContract,
  assertDocumentedNpmScripts,
  assertLayoutPathsExist,
  assertSecurityAnchors,
  CLAUDE_MD_SECURITY_ANCHORS,
  extractLayoutPaths,
} from '../../scripts/claudeMdContractGuard.js';

const repoRoot = path.resolve(import.meta.dirname, '../..');

describe('DX-CLAUDE — agent guide contract (PR #31)', () => {
  it('happy: layout tree paths exist on disk', () => {
    const claudeMd = fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8');
    const paths = extractLayoutPaths(claudeMd);
    expect(paths).toContain('src/default_deck.json');
    expect(() => assertLayoutPathsExist(repoRoot, paths)).not.toThrow();
  });

  it('happy: documented npm scripts match package.json and Commands block', () => {
    const claudeMd = fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8');
    const pkg = JSON.parse(fs.readFileSync(path.join(repoRoot, 'package.json'), 'utf8'));
    expect(() => assertDocumentedNpmScripts(claudeMd, pkg)).not.toThrow();
  });

  it('happy: CI workflow matches lint → coverage test → build → e2e story', () => {
    const workflow = fs.readFileSync(
      path.join(repoRoot, '.github/workflows/ci-cd.yml'),
      'utf8',
    );
    expect(() => assertCiWorkflowParity(workflow)).not.toThrow();
  });

  it('happy: full CLAUDE.md contract passes', () => {
    expect(() => assertClaudeMdContract({ root: repoRoot })).not.toThrow();
  });
});

describe('SEC-CLAUDE — agentic doc injection / ablation', () => {
  it('sad: missing layout paths fail closed (fake module injection)', () => {
    expect(() =>
      assertLayoutPathsExist(repoRoot, ['src/agentic-backdoor-loader.js']),
    ).toThrow(/missing paths/);
  });

  it('sad: ablated security anchors fail (omit never-commit / validation guidance)', () => {
    const claudeMd = fs.readFileSync(path.join(repoRoot, 'CLAUDE.md'), 'utf8');
    const stripped = CLAUDE_MD_SECURITY_ANCHORS.reduce(
      (text, phrase) => text.replaceAll(phrase, ''),
      claudeMd,
    );
    expect(() => assertSecurityAnchors(stripped)).toThrow(/security anchors/);
  });

  it('sad: empty CLAUDE.md fails layout extraction', () => {
    expect(() => extractLayoutPaths('')).toThrow(/Repository layout/);
  });
});
