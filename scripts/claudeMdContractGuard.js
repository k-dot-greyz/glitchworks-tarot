import fs from 'node:fs';
import path from 'node:path';

/** @typedef {{ root?: string, claudeMd?: string, packageJson?: Record<string, unknown>, ciWorkflow?: string }} ContractOptions */

const LAYOUT_HEADING = '## Repository layout';
const NPM_RUN_RE = /npm run ([\w:-]+)/g;

/** Security anchors agents must keep in CLAUDE.md (agentic doc injection / ablation). */
export const CLAUDE_MD_SECURITY_ANCHORS = [
  'Never commit',
  'deckValidation.js',
  'parseStoredDeck',
  '.env',
  'keystore',
  'dev-master/dex/03-docs/guides/',
];

/** npm scripts documented in CLAUDE.md Commands block must exist in package.json. */
export const CLAUDE_MD_DOCUMENTED_SCRIPTS = [
  'dev',
  'build',
  'preview',
  'lint',
  'test',
  'test:watch',
  'test:e2e',
  'test:e2e:ui',
];
/**
 * Extract repo-relative paths from the ASCII layout tree in CLAUDE.md.
 * @param {string} claudeMd
 * @returns {string[]}
 */
export function extractLayoutPaths(claudeMd) {
  const layoutStart = claudeMd.indexOf(LAYOUT_HEADING);
  if (layoutStart === -1) {
    throw new Error('CLAUDE.md missing "## Repository layout" section');
  }
  const afterHeading = claudeMd.slice(layoutStart);
  const fenceStart = afterHeading.indexOf('```');
  const fenceEnd = afterHeading.indexOf('```', fenceStart + 3);
  if (fenceStart === -1 || fenceEnd === -1) {
    throw new Error('CLAUDE.md repository layout must be fenced in a code block');
  }
  const tree = afterHeading.slice(fenceStart + 3, fenceEnd).replace(/^\n/, '');

  /** @type {string[]} */
  const paths = [];
  /** @type {string[]} prefix stack indexed by depth (2 spaces per level) */
  const prefixStack = [''];

  for (const rawLine of tree.split('\n')) {
    if (!rawLine.trim()) continue;
    const indent = rawLine.match(/^\s*/)?.[0].length ?? 0;
    const depth = Math.floor(indent / 2);
    const body = rawLine.trim();
    const commentIdx = body.indexOf('#');
    const token = (commentIdx === -1 ? body : body.slice(0, commentIdx)).trim();
    if (!token) continue;

    prefixStack.length = depth + 1;
    prefixStack[depth] = prefixStack[depth] ?? '';

    if (token.endsWith('/')) {
      const segments = token.split(',').map((part) => part.trim()).filter(Boolean);
      for (const seg of segments) {
        if (!seg.endsWith('/')) continue;
        const full = `${prefixStack[depth - 1] ?? ''}${seg}`;
        paths.push(full);
      }
      if (segments.length === 1 && !token.includes(',')) {
        prefixStack[depth] = `${prefixStack[depth - 1] ?? ''}${token}`;
      }
      continue;
    }

    if (token.includes('/')) {
      paths.push(`${prefixStack[depth - 1] ?? ''}${token}`);
      continue;
    }

    paths.push(`${prefixStack[depth - 1] ?? ''}${token}`);
  }

  return [...new Set(paths)].sort();
}

/**
 * @param {string} root
 * @param {string[]} relativePaths
 */
export function assertLayoutPathsExist(root, relativePaths) {
  const missing = [];
  for (const rel of relativePaths) {
    const abs = path.join(root, rel);
    if (!fs.existsSync(abs)) {
      missing.push(rel);
    }
  }
  if (missing.length > 0) {
    throw new Error(
      `CLAUDE.md layout references missing paths: ${missing.join(', ')}`,
    );
  }
}

/**
 * @param {string} claudeMd
 * @param {Record<string, unknown>} pkg
 */
export function assertDocumentedNpmScripts(claudeMd, pkg) {
  const scripts = /** @type {Record<string, string>} */ (pkg.scripts ?? {});
  const missing = CLAUDE_MD_DOCUMENTED_SCRIPTS.filter((name) => !scripts[name]);
  if (missing.length > 0) {
    throw new Error(
      `package.json missing scripts documented in CLAUDE.md: ${missing.join(', ')}`,
    );
  }

  const commandsStart = claudeMd.indexOf('## Commands');
  const commandsEnd = claudeMd.indexOf('## Repository layout');
  const commandsBlock = claudeMd.slice(commandsStart, commandsEnd);
  const mentioned = new Set([...commandsBlock.matchAll(NPM_RUN_RE)].map((m) => m[1]));
  for (const name of CLAUDE_MD_DOCUMENTED_SCRIPTS) {
    if (!mentioned.has(name)) {
      throw new Error(`CLAUDE.md Commands block must document npm run ${name}`);
    }
  }
}

/**
 * @param {string} claudeMd
 * @param {readonly string[]} [anchors]
 */
export function assertSecurityAnchors(claudeMd, anchors = CLAUDE_MD_SECURITY_ANCHORS) {
  const missing = anchors.filter((phrase) => !claudeMd.includes(phrase));
  if (missing.length > 0) {
    throw new Error(
      `CLAUDE.md missing agentic security anchors: ${missing.join(' | ')}`,
    );
  }
}

/**
 * @param {string} workflowYaml
 */
export function assertCiWorkflowParity(workflowYaml) {
  const lintIdx = workflowYaml.indexOf('npm run lint');
  const testIdx = workflowYaml.indexOf('npm run test -- --coverage');
  const buildIdx = workflowYaml.indexOf('npm run build');
  const e2eIdx = workflowYaml.indexOf('npm run test:e2e');

  if ([lintIdx, testIdx, buildIdx, e2eIdx].some((i) => i === -1)) {
    throw new Error('ci-cd.yml must run lint, test --coverage, build, and test:e2e');
  }
  if (!(lintIdx < testIdx && testIdx < buildIdx && e2eIdx > buildIdx)) {
    throw new Error(
      'ci-cd.yml build job order must be lint → test --coverage → build (e2e in follow-up job)',
    );
  }
}

/**
 * @param {ContractOptions} [options]
 */
export function assertClaudeMdContract(options = {}) {
  const root = options.root ?? process.cwd();
  const claudePath = path.join(root, 'CLAUDE.md');
  const claudeMd =
    options.claudeMd ?? fs.readFileSync(claudePath, { encoding: 'utf8' });
  const pkg =
    options.packageJson ??
    JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  const ciWorkflow =
    options.ciWorkflow ??
    fs.readFileSync(path.join(root, '.github/workflows/ci-cd.yml'), 'utf8');

  const layoutPaths = extractLayoutPaths(claudeMd);
  assertLayoutPathsExist(root, layoutPaths);
  assertDocumentedNpmScripts(claudeMd, pkg);
  assertSecurityAnchors(claudeMd);
  assertCiWorkflowParity(ciWorkflow);

  return { layoutPaths };
}
