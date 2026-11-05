import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_WORKFLOW_REL = '.github/workflows/ci-cd.yml';

export function loadCiCdWorkflow(rootDir = process.cwd(), relPath = DEFAULT_WORKFLOW_REL) {
  const abs = path.join(rootDir, relPath);
  return fs.readFileSync(abs, 'utf8');
}

/** Lines that declare GitHub Actions `if:` (job or step). */
export function collectIfLines(content) {
  return content
    .split('\n')
    .map((line, index) => ({ line, lineNumber: index + 1 }))
    .filter(({ line }) => /^\s*if:\s/.test(line));
}

export function ifExpression(line) {
  return line.replace(/^\s*if:\s*/, '').trim();
}

export function findSecretsInIfExpressions(content) {
  return collectIfLines(content)
    .filter(({ line }) => /\bsecrets\./.test(line))
    .map(({ line, lineNumber }) => ({
      lineNumber,
      expression: ifExpression(line),
    }));
}

export function extractJobBlock(content, jobId) {
  const marker = new RegExp(`^  ${jobId}:\\s*$`, 'm');
  const match = marker.exec(content);
  if (!match) return null;
  const start = match.index;
  const rest = content.slice(start + match[0].length);
  const nextJob = rest.search(/^  [a-zA-Z0-9_-]+:\s*$/m);
  const block = nextJob === -1 ? rest : rest.slice(0, nextJob);
  return content.slice(start, start + match[0].length + block.length);
}

export function deployJobUsesJobLevelEnvForSecrets(content) {
  const block = extractJobBlock(content, 'deploy');
  if (!block) return { ok: false, reason: 'deploy job missing' };
  const hasEnv =
    /^\s+env:\s*$/m.test(block) &&
    /\bDEPLOY_USER:\s*\$\{\{\s*secrets\.DEPLOY_USER\s*\}\}/.test(block) &&
    /\bDEPLOY_HOST:\s*\$\{\{\s*secrets\.DEPLOY_HOST\s*\}\}/.test(block) &&
    /\bDEPLOY_PATH:\s*\$\{\{\s*secrets\.DEPLOY_PATH\s*\}\}/.test(block);
  return { ok: hasEnv, reason: hasEnv ? null : 'deploy job env missing DEPLOY_* secret mapping' };
}

export function rsyncStepUsesQuotedRemote(content) {
  const block = extractJobBlock(content, 'deploy');
  if (!block) return false;
  return /rsync[^\n]*"\$DEPLOY_USER@\$DEPLOY_HOST:\$DEPLOY_PATH"/.test(block);
}

export function hasSkipDeployAblationStep(content) {
  return (
    /name:\s*Skip deploy when secrets are unset/.test(content) &&
    /if:\s*env\.DEPLOY_HOST == '' \|\| env\.DEPLOY_USER == '' \|\| env\.DEPLOY_PATH == ''/.test(content)
  );
}

export function linearNotifyUsesEnvBearer(content) {
  const block = extractJobBlock(content, 'deploy');
  if (!block) return { usesEnvIf: false, usesEnvBearer: false };
  const usesEnvIf = /if:\s*env\.LINEAR_API_KEY != ''/.test(block);
  const usesEnvBearer = /Authorization: Bearer \$LINEAR_API_KEY/.test(block);
  return { usesEnvIf, usesEnvBearer };
}
