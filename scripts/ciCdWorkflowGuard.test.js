import { describe, it, expect } from 'vitest';
import {
  loadCiCdWorkflow,
  findSecretsInIfExpressions,
  deployJobUsesJobLevelEnvForSecrets,
  rsyncStepUsesQuotedRemote,
  hasSkipDeployAblationStep,
  linearNotifyUsesEnvBearer,
  extractJobBlock,
} from './ciCdWorkflowGuard.js';

const workflow = loadCiCdWorkflow();

describe('CI/CD workflow contract (PR #46 — secrets outside if:)', () => {
  it('CI-DX-001 happy: GitHub accepts workflow (no secrets.* in any if: expression)', () => {
    const violations = findSecretsInIfExpressions(workflow);
    expect(violations).toEqual([]);
  });

  it('CI-DX-002 sad/regression: deploy job if: stays push-to-main only (no secret gating at job level)', () => {
    const deployBlock = extractJobBlock(workflow, 'deploy');
    expect(deployBlock).toBeTruthy();
    const jobIf = deployBlock.match(/^\s+if:\s*(.+)$/m);
    expect(jobIf).toBeTruthy();
    expect(jobIf[1]).toContain('github.event_name');
    expect(jobIf[1]).not.toMatch(/\bsecrets\./);
    expect(jobIf[1]).not.toMatch(/\benv\./);
  });

  it('CI-ABL-001 graceful ablation: explicit skip step when DEPLOY_* env is empty', () => {
    expect(hasSkipDeployAblationStep(workflow)).toBe(true);
  });

  it('CI-DX-003 pipeline integrity: build and e2e jobs remain wired', () => {
    expect(extractJobBlock(workflow, 'build')).toMatch(/npm run test -- --coverage/);
    expect(extractJobBlock(workflow, 'e2e')).toMatch(/needs:\s*build/);
    expect(extractJobBlock(workflow, 'deploy')).toMatch(/needs:\s*\[build, e2e\]/);
  });
});

describe('CI/CD deploy security surface (8020 high-leverage)', () => {
  it('CI-SEC-001: deploy secrets mapped at job env (not evaluated in if:)', () => {
    const { ok, reason } = deployJobUsesJobLevelEnvForSecrets(workflow);
    expect(ok, reason ?? '').toBe(true);
  });

  it('CI-SEC-002: rsync remote path uses quoted expansions (host/path injection hardening)', () => {
    expect(rsyncStepUsesQuotedRemote(workflow)).toBe(true);
  });

  it('CI-SEC-003: Linear notify gates on env.LINEAR_API_KEY and sends Bearer from env var', () => {
    const { usesEnvIf, usesEnvBearer } = linearNotifyUsesEnvBearer(workflow);
    expect(usesEnvIf).toBe(true);
    expect(usesEnvBearer).toBe(true);
    expect(workflow).not.toMatch(
      /Authorization: Bearer \$\{\{\s*secrets\.LINEAR_API_KEY\s*\}\}/
    );
  });
});
