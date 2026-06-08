import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, it, expect, beforeAll } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function readProjectFile(relPath) {
  return readFileSync(resolve(ROOT, relPath), 'utf-8');
}

describe('CONTRIBUTING.md', () => {
  let content;

  beforeAll(() => {
    content = readProjectFile('CONTRIBUTING.md');
  });

  // ── Existence ────────────────────────────────────────────────────────────────

  it('exists and is non-empty', () => {
    expect(content).toBeTruthy();
    expect(content.length).toBeGreaterThan(100);
  });

  // ── Required top-level sections ──────────────────────────────────────────────

  it('contains a Repository overview section', () => {
    expect(content).toMatch(/##\s+.*Repository overview/i);
  });

  it('contains The Prime Directive section', () => {
    expect(content).toMatch(/##\s+.*Prime Directive/i);
  });

  it('contains an Architecture Protocol section', () => {
    expect(content).toMatch(/##\s+.*Agnostic Architecture Protocol/i);
  });

  it('contains a Fork-and-PR workflow section', () => {
    expect(content).toMatch(/##\s+.*Fork-and-PR/i);
  });

  it('contains a Coding Conventions section', () => {
    expect(content).toMatch(/##\s+.*Coding Conventions/i);
  });

  it('contains a Pre-Commit.*Checklist section', () => {
    expect(content).toMatch(/##\s+.*Pre-Commit.*Checklist/i);
  });

  // ── Technology stack table ────────────────────────────────────────────────────

  it('documents React 18 as the UI technology', () => {
    expect(content).toMatch(/React 18/);
  });

  it('documents Vite 5 as the bundler', () => {
    expect(content).toMatch(/Vite 5/);
  });

  it('documents Vitest and Testing Library for unit/component tests', () => {
    expect(content).toMatch(/Vitest/);
    expect(content).toMatch(/Testing Library/);
  });

  it('documents Playwright for E2E tests', () => {
    expect(content).toMatch(/Playwright/);
  });

  it('documents Capacitor 8 for mobile shell', () => {
    expect(content).toMatch(/Capacitor 8/);
  });

  it('documents ESLint 10 for linting', () => {
    expect(content).toMatch(/ESLint 10/);
  });

  it('documents Conventional Commits via Husky and Commitlint', () => {
    expect(content).toMatch(/Conventional Commits/);
    expect(content).toMatch(/Husky/);
    expect(content).toMatch(/Commitlint/);
  });

  // ── npm script commands match package.json ────────────────────────────────────

  it('documents npm run lint command', () => {
    expect(content).toMatch(/npm run lint/);
  });

  it('documents npm run test command', () => {
    expect(content).toMatch(/npm run test/);
  });

  it('documents npm run build command', () => {
    expect(content).toMatch(/npm run build/);
  });

  it('documents npm run test:e2e command', () => {
    expect(content).toMatch(/npm run test:e2e/);
  });

  it('documents npm run test:watch command', () => {
    expect(content).toMatch(/npm run test:watch/);
  });

  it('documents npm run test:e2e:ui command', () => {
    expect(content).toMatch(/npm run test:e2e:ui/);
  });

  it('cross-references: all documented npm scripts exist in package.json', () => {
    const pkg = JSON.parse(readProjectFile('package.json'));
    const scripts = pkg.scripts || {};

    const documentedScripts = ['lint', 'test', 'build', 'test:e2e', 'test:watch', 'test:e2e:ui'];
    for (const s of documentedScripts) {
      expect(scripts, `package.json should have "scripts.${s}"`).toHaveProperty(s);
    }
  });

  // ── Commit message constraints align with .commitlintrc.yaml ─────────────────

  it('documents a 100-character maximum for commit header length', () => {
    expect(content).toMatch(/100/);
  });

  it('cross-references: documented header-max-length matches .commitlintrc.yaml', () => {
    const commitlintRaw = readProjectFile('.commitlintrc.yaml');
    // The YAML declares header-max-length: 100
    expect(commitlintRaw).toMatch(/header-max-length/);
    expect(commitlintRaw).toMatch(/100/);
    // CONTRIBUTING.md must also state 100 chars
    expect(content).toMatch(/100/);
  });

  it('documents conventional commit format type(scope): subject', () => {
    expect(content).toMatch(/type\(scope\)/i);
  });

  it('documents common branch prefixes including feat/, fix/, docs/, test/, chore/', () => {
    expect(content).toMatch(/feat\//);
    expect(content).toMatch(/fix\//);
    expect(content).toMatch(/docs\//);
    expect(content).toMatch(/test\//);
    expect(content).toMatch(/chore\//);
  });

  // ── Test-ID convention ────────────────────────────────────────────────────────

  it('references docs/TESTIDS.md for test ID conventions', () => {
    expect(content).toMatch(/TESTIDS\.md/);
  });

  it('documents the aether-<area>-<element> test-ID pattern', () => {
    expect(content).toMatch(/aether-<area>-<element>/);
  });

  it('cross-references: docs/TESTIDS.md file actually exists in the repo', () => {
    const testids = readProjectFile('docs/TESTIDS.md');
    expect(testids).toBeTruthy();
    expect(testids).toMatch(/aether-<area>-<element>/);
  });

  // ── Architecture principles (2.1–2.7) ────────────────────────────────────────

  it('documents all 7 architecture principles (2.1 through 2.7)', () => {
    for (let i = 1; i <= 7; i++) {
      expect(content, `Section 2.${i} should be present`).toMatch(
        new RegExp(`2\\.${i}\\.`)
      );
    }
  });

  it('documents Zero Hardcoding principle (2.1)', () => {
    expect(content).toMatch(/Zero Hardcoding/i);
    expect(content).toMatch(/No magic strings/i);
  });

  it('documents Polymorphism by Default principle (2.2)', () => {
    expect(content).toMatch(/Polymorphism by Default/i);
  });

  it('documents Open Piping principle (2.3)', () => {
    expect(content).toMatch(/Open Piping/i);
  });

  it('documents Boundary Validation principle (2.4)', () => {
    expect(content).toMatch(/Boundary Validation/i);
  });

  it('documents State Hydration & Dehydration principle (2.5)', () => {
    expect(content).toMatch(/State Hydration/i);
  });

  it('documents Graceful Degradation principle (2.6)', () => {
    expect(content).toMatch(/Graceful Degradation/i);
  });

  it('documents Agnostic Telemetry & Observability principle (2.7)', () => {
    expect(content).toMatch(/Agnostic Telemetry/i);
  });

  // ── Workflow steps (Step 1–6) ─────────────────────────────────────────────────

  it('documents all 6 workflow steps (Step 1 through Step 6)', () => {
    for (let i = 1; i <= 6; i++) {
      expect(content, `Step ${i} should be documented`).toMatch(
        new RegExp(`Step ${i}:`)
      );
    }
  });

  it('documents configuring upstream remote in Step 1', () => {
    expect(content).toMatch(/git remote add upstream/);
  });

  it('documents branching from upstream/main in Step 2', () => {
    expect(content).toMatch(/git checkout -b/);
    expect(content).toMatch(/upstream\/main/);
  });

  it('documents quality gates in Step 3', () => {
    expect(content).toMatch(/npm install/);
  });

  it('documents using gh pr create in Step 6', () => {
    expect(content).toMatch(/gh pr create/);
  });

  // ── Pre-commit checklist (5 items) ────────────────────────────────────────────

  it('pre-commit checklist covers secrets / credentials item', () => {
    expect(content).toMatch(/Secrets\?|No \.env|keystores|credentials/i);
  });

  it('pre-commit checklist covers generated artifacts item (build/, coverage)', () => {
    expect(content).toMatch(/Generated artifacts\?|Do not commit.*build\//i);
  });

  it('pre-commit checklist covers misplaced docs item', () => {
    expect(content).toMatch(/Misplaced docs\?|Misplaced Files/i);
  });

  it('pre-commit checklist covers diff scope item', () => {
    expect(content).toMatch(/Diff scope\?|Verify Diff Scope/i);
  });

  it('pre-commit checklist covers boundary hygiene item', () => {
    expect(content).toMatch(/Boundary hygiene\?|boundary/i);
  });

  // ── Boundary violation rule ───────────────────────────────────────────────────

  it('explicitly prohibits committing internal parent-workspace docs', () => {
    expect(content).toMatch(/NEVER commit/i);
  });

  it('specifies dev-master/dex/03-docs/guides/ as destination for superproject docs', () => {
    expect(content).toMatch(/dev-master\/dex\/03-docs\/guides\//);
  });

  it('names README.md and CONTRIBUTING.md as allowed files in this repo', () => {
    expect(content).toMatch(/README\.md/);
    expect(content).toMatch(/CONTRIBUTING\.md/);
  });

  // ── Capacitor / Android specifics ────────────────────────────────────────────

  it('documents Capacitor.isNativePlatform() guard for native APIs', () => {
    expect(content).toMatch(/Capacitor\.isNativePlatform\(\)/);
  });

  it('warns against committing local keystores or signing secrets', () => {
    expect(content).toMatch(/keystore|signing secrets/i);
  });

  it('documents npx cap sync android command', () => {
    expect(content).toMatch(/npx cap sync android/);
  });

  // ── Coding conventions ────────────────────────────────────────────────────────

  it('documents RTL test file location pattern src/**/*.test.jsx', () => {
    expect(content).toMatch(/src\/\*\*\/\*\.test\.jsx/);
  });

  it('documents E2E test location in e2e/ directory', () => {
    expect(content).toMatch(/e2e\//);
  });

  it('documents preference for functional React components and hooks', () => {
    expect(content).toMatch(/Functional components/i);
  });

  it('documents use of Tailwind utilities for styling', () => {
    expect(content).toMatch(/Tailwind/i);
  });

  // ── CI parity ─────────────────────────────────────────────────────────────────

  it('documents CI parity expectation for local development', () => {
    expect(content).toMatch(/CI parity/i);
  });

  it('documents GitHub Actions as the CI provider', () => {
    expect(content).toMatch(/GitHub Actions/);
  });

  it('documents --coverage flag for test run in CI', () => {
    expect(content).toMatch(/--coverage/);
  });

  // ── Negative / boundary tests ─────────────────────────────────────────────────

  it('does not contain any hardcoded port numbers outside of documented defaults', () => {
    // The only ports mentioned should be the documented ones: 5173 (dev) and 4173 (preview)
    const portMatches = content.match(/:\d{4,5}/g) || [];
    const allowedPorts = [':5173', ':4173'];
    const unexpected = portMatches.filter((p) => !allowedPorts.includes(p));
    expect(unexpected).toHaveLength(0);
  });

  it('does not reference any private API keys or secrets inline', () => {
    expect(content).not.toMatch(/api[_-]?key\s*=\s*\S+/i);
    expect(content).not.toMatch(/secret\s*=\s*\S+/i);
    expect(content).not.toMatch(/password\s*=\s*\S+/i);
    expect(content).not.toMatch(/token\s*=\s*\S+/i);
  });

  it('does not embed private fork-specific runbook content (zenOS agent RAM)', () => {
    // zenOS is mentioned only in the "move to superproject" section as something NOT to commit
    // The file should not contain actual zenOS runbook content or session notes
    const zenOSMatches = (content.match(/zenOS/g) || []).length;
    // At most one reference (in the "do not commit" instruction) is acceptable
    expect(zenOSMatches).toBeLessThanOrEqual(1);
  });

  it('is valid UTF-8 text with no null bytes', () => {
    expect(content).not.toMatch(/\0/);
  });

  it('opening title line identifies the glitchhub-tarot project', () => {
    const firstLine = content.split('\n')[0];
    expect(firstLine).toMatch(/glitchhub-tarot/i);
  });
});
