import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_RULESETS_REL = 'src/domain/rulesets.js';
const DEFAULT_RULESETS_TEST_REL = 'src/domain/rulesets.test.js';

/** Every playmat ruleset must reference a registry key that exists and is a function. */
export function findMissingRegistryBindings(rulesets, registry) {
  const missing = [];
  for (const [rulesetId, ruleset] of Object.entries(rulesets)) {
    const key = ruleset?.scoreFormula;
    if (typeof key !== 'string' || key.length === 0) {
      missing.push({ rulesetId, reason: 'scoreFormula missing or not a string' });
      continue;
    }
    if (typeof registry[key] !== 'function') {
      missing.push({ rulesetId, scoreFormula: key, reason: 'registry has no function for key' });
    }
  }
  return missing;
}

/** GW-AAP: ruleset payloads stay JSON-serializable (no embedded runtime functions). */
export function findNonSerializableRulesetValues(rulesets) {
  const violations = [];
  for (const [rulesetId, ruleset] of Object.entries(rulesets)) {
    for (const [field, value] of Object.entries(ruleset)) {
      if (typeof value === 'function') {
        violations.push({ rulesetId, field, reason: 'function embedded on ruleset object' });
      }
    }
    if ('calculateScore' in ruleset) {
      violations.push({ rulesetId, field: 'calculateScore', reason: 'legacy calculateScore on ruleset' });
    }
  }
  return violations;
}

/** Registry keys should be plain own keys (not __proto__ / constructor pollution vectors). */
export function findUnsafeRegistryKeys(registry) {
  return Object.keys(registry).filter(
    (key) => key === '__proto__' || key === 'constructor' || key === 'prototype',
  );
}

export function loadSource(rootDir, relPath) {
  return fs.readFileSync(path.join(rootDir, relPath), 'utf8');
}

/** Regression guard: specs must score via scoreFormulaRegistry, not removed rulesets.*.calculateScore. */
export function findRulesetCalculateScoreSpecUsage(content) {
  const hits = [];
  const pattern = /rulesets(?:\.|\[[^\]]+\])\.calculateScore/g;
  let match;
  while ((match = pattern.exec(content)) !== null) {
    hits.push({ index: match.index, snippet: match[0] });
  }
  return hits;
}

export function loadDefaultSources(rootDir = process.cwd()) {
  return {
    rulesetsSource: loadSource(rootDir, DEFAULT_RULESETS_REL),
    rulesetsTestSource: loadSource(rootDir, DEFAULT_RULESETS_TEST_REL),
  };
}
