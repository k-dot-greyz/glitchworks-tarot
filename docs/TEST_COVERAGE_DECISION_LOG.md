# Test coverage decision log — agentic security pass

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
