import { describe, it, expect } from 'vitest';
import { rulesets, scoreFormulaRegistry } from '../src/domain/rulesets.js';
import {
  findMissingRegistryBindings,
  findNonSerializableRulesetValues,
  findUnsafeRegistryKeys,
  findRulesetCalculateScoreSpecUsage,
  loadDefaultSources,
} from './scoreFormulaRegistryGuard.js';

describe('scoreFormulaRegistry contract (PR #47 — serializable rulesets)', () => {
  it('RS-DX-001 happy: every ruleset scoreFormula resolves in scoreFormulaRegistry', () => {
    expect(findMissingRegistryBindings(rulesets, scoreFormulaRegistry)).toEqual([]);
  });

  it('RS-DX-002 happy: ruleset objects stay serializable (no embedded calculateScore/functions)', () => {
    expect(findNonSerializableRulesetValues(rulesets)).toEqual([]);
  });

  it('RS-DX-003 sad/regression: rulesets.test.js does not call removed rulesets.*.calculateScore', () => {
    const { rulesetsTestSource } = loadDefaultSources();
    expect(findRulesetCalculateScoreSpecUsage(rulesetsTestSource)).toEqual([]);
  });

  it('RS-SEC-001 security: registry keys are not prototype-pollution vectors', () => {
    expect(findUnsafeRegistryKeys(scoreFormulaRegistry)).toEqual([]);
    for (const ruleset of Object.values(rulesets)) {
      expect(findUnsafeRegistryKeys({ [ruleset.scoreFormula]: () => 0 })).toEqual([]);
    }
  });
});

describe('scoreFormulaRegistry guard helpers (unit)', () => {
  it('RS-DX-004 sad: detect missing registry binding', () => {
    const missing = findMissingRegistryBindings(
      { broken: { id: 'broken', scoreFormula: 'not_registered' } },
      {},
    );
    expect(missing).toHaveLength(1);
    expect(missing[0].reason).toContain('registry');
  });

  it('RS-ABL-002 sad: detect legacy calculateScore on ruleset payload', () => {
    const violations = findNonSerializableRulesetValues({
      legacy: { id: 'legacy', calculateScore: () => 1 },
    });
    expect(violations.some((v) => v.field === 'calculateScore')).toBe(true);
  });
});
