# Test coverage decision log — agentic security pass

## Pass — PR #23 CodeRabbit refactor + canonical deck (2026-09-12)

**Branch:** `greyzxcursor/agentic-security-test-coverage-b61c`  
**Trigger context:** PR #23 (`coderabbitai/autofix/a17c857`) — `scoreFormulaRegistry` serializable rulesets, persistence hardening, deps bump  
**Supplements:** PR #24 (forge stale-closure), PR #25 (canonical `default_deck.json`)

### Attack surface reviewed

| Surface | Risk | Mitigation tested |
|---------|------|-------------------|
| `rulesets` embedded functions | Non-serializable rulesets break GW-AAP hydration | JSON round-trip + `scoreFormula` string keys only |
| `scoreFormulaRegistry` injection | Unknown formula keys alter scoring | Registry lookup fail-closed; battleEngine falls back to base score |
| Orphaned `activeDeckId` in storage | Wrong deck active / crash | `usePersistedDeck` normalizes to first valid deck |
| Deck shell without `cards` array | Type confusion poisons state | Recovery to `fallbackDeck` with preserved deck metadata |
| `default_deck.json` drift | Last.fm overlay or duplicate IDs ship to users | Contract tests: schema, unique ids, forbidden tokens |
| Forge compile rapid-fire | Duplicate card IDs (stale closure) | RTL + Playwright double-compile uniqueness |

### Test files added / updated

| File | Change |
|------|--------|
| `src/domain/rulesets.test.js` | **Updated** — `scoreFormulaRegistry` + serializability |
| `src/domain/battleEngine.test.js` | Pokemon ruleset scoring path |
| `src/domain/defaultDeck.test.js` | **New** — canonical deck contract |
| `src/hooks/usePersistedDeck.test.js` | Orphan `activeDeckId` + malformed deck shell |
| `src/test/fixtures/AetherTestFixtures.js` | Default deck contract + persistence payloads |
| `e2e/forge-security.spec.ts` | **New** — Forge compile UX (P0/P1) |

### Playwright user stories (priority)

1. **P0 — Forge compile:** Name entity → COMPILE → dex view → unique id in `aether-decks`.
2. **P1 — Cosmetic reset:** Non-default frame/hat/rarity/ability → compile → return to forge → defaults restored.
3. **P1 — Rapid compile:** Two compiles without manual flush → no duplicate card ids in storage.

### Deferred follow-ups

- JSON Schema for `default_deck.json` (structural drift vs `validateCard` only).
- Runtime ruleset mutation / prototype pollution on `rulesets` object (low risk — module scope).
- `Infinity` stat fuzzing in battle engine (product decision).

---

## Pass — PR #21 arena rulesets (2026-06-08)

**Branch:** `greyzxc/agentic-security-test-coverage-55dc`  
**Trigger context:** PR #21 (`feat/tcg-arena-rulesets`) — dynamic playmats, rulesets, decoupled damage engine  
**Date:** 2026-06-08

## Attack surface reviewed

| Surface | Risk | Mitigation tested |
|---------|------|-------------------|
| `localStorage` / `aether-decks` JSON | Corrupt or agentic payloads crash or poison state | `usePersistedDeck`, `parseStoredDeck`, E2E init-script corruption |
| Arena ruleset / mode selectors | Unknown ids altering scoring or enabling clash incorrectly | `resolveBattleWithEngine` fallback + E2E ruleset switch |
| MTG banlist boundary | Banned cards placed into clash slots | RTL (`App.test.jsx`) + E2E ban rejection |
| `setDeck` / forge compile | Invalid cards merged into active deck | `usePersistedDeck` throw on invalid schema |
| Ruleset `calculateScore` | Wrong formula per playmat | `rulesets.test.js` + `battleEngine` integration |
| Oracle / deck name strings | XSS via stored card text | Schema accepts strings; React escaping assumed — documented, not snapshot-tested |

## Prioritization (impact vs cost)

| Added coverage | Impact | Cost | Speed |
|----------------|--------|------|-------|
| `rulesets.test.js` | High — new module, zero prior tests | Low | Vitest ~ms |
| `battleEngine` ruleset + injection fallback | High — scoring blast radius | Low | Vitest ~ms |
| `usePersistedDeck.test.js` | High — persistence boundary | Medium | Vitest + renderHook |
| `deckValidation` hostile payloads | Medium — blocks corrupt merges | Low | Vitest ~ms |
| `e2e/arena-security.spec.ts` | High — real UX clash + banlist + storage | Medium | Playwright + preview build |
| `AetherTestFixtures` constructor harness | Medium — T+7 maintainability | Low one-time | Reused across specs |

**Deferred (follow-up, not in this PR):**

- `Infinity` / `Number.MAX_VALUE` stat fuzzing in battle engine (schema currently allows; scoring may produce `Infinity` — needs product decision).
- Dedicated RTL test for every TCG zone drag-drop (bench uses click path in tests; drag API untested).
- MCP / n8n JSON boundary validation (integration configs, not user-facing runtime).

## Test files added / updated

| File | Change |
|------|--------|
| `src/test/fixtures/AetherTestFixtures.js` | **New** — constructor-instantiated fixtures |
| `src/domain/rulesets.test.js` | **New** |
| `src/domain/battleEngine.test.js` | Ruleset integration + unknown id fallback |
| `src/domain/deckValidation.test.js` | Hostile edge payloads |
| `src/hooks/usePersistedDeck.test.js` | **New** — storage boundary |
| `e2e/arena-security.spec.ts` | **New** — Playwright user-story flows |

## Playwright user stories (priority)

1. **P0 — Standard clash:** Navigate Arena → place two bench cards → Initiate Clash → log shows collision outcome.
2. **P0 — MTG banlist:** Select MTG ruleset → click banned card → log shows ban error, clash stays disabled.
3. **P1 — Ruleset switch:** MTG ↔ Yu-Gi-Oh reinitializes zone labels without crash.
4. **P1 — Hostile storage:** Corrupt `aether-decks` before load → shell renders, stored value parseable or absent.
5. **P2 — Flush / combat disabled:** Arena wipe and peaceful mode keep clash inert.

## Validation commands

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Fixture convention

Per CONTRIBUTING §2.1 (zero hardcoding in domain logic), **test literals live in fixture constructors** (`AetherTestFixtures`, `ArenaE2EFixtures`) so specs override via options instead of scattered magic strings.
