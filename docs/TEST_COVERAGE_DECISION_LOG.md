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

---

**Branch:** `greyzxcursor/agentic-security-test-coverage-c96f`  
**Trigger context:** PR #36 (`greyzxcursor/complete-xmldom-fast-uri-pins-14d0`) — xmldom/fast-uri patches, canonical default deck (#25), forge stale-closure (#24)  
**Date:** 2026-09-12

## Attack surface reviewed (PR #36 pass)

| Surface | Risk | Mitigation tested |
|---------|------|-------------------|
| `default_deck.json` shipped data | Last.fm/scrobble overlay reintroduced via merge | `DefaultDeckHarness` contamination patterns + E2E modal text scan |
| `dynamic_deck.json` legacy artifact | App loads wrong deck source | File absence assertion |
| Transitive `@xmldom/xmldom` / `fast-uri` | Known CVEs in unpinned lockfile | Lockfile semver floor via `DefaultDeckHarness.assertPinnedDependencies` |
| Orphan `activeDeckId` in storage | Wrong deck slice / crash on hydrate | `usePersistedDeck` falls back to `decks[0]` |
| Empty `activeDeckId` | Multi-deck branch taken with invalid id | Migrates to fallback deck |
| `forgeCard` non-numeric ids | ID collision after agentic deck import | `deckState.test.js` documents numeric-max-only behavior |

## Prioritization (impact vs cost)

| Added coverage | Impact | Cost | Speed |
|----------------|--------|------|-------|
| `DefaultDeckHarness` + `default_deck.test.js` | High — #25 regression guard | Low | Vitest ~ms |
| Lockfile pin assertions | Medium — #36 dep security | Low | Vitest ~ms |
| Orphan `activeDeckId` hook test | Medium — persistence blast radius | Low | Vitest |
| `forgeCard` agentic id edge | Medium — forge compile path | Low | Vitest |
| `e2e/default-deck-agent-ux.spec.ts` | High — real fresh-load UX | Medium | Playwright |

**Deferred (follow-up):**

- Normalize orphan `activeDeckId` on hydrate (rewrite storage to `decks[0].id`).
- JSON Schema for `default_deck.json` (currently `validateDeck` only).
- `forgeCard` collision guard when all ids are non-numeric.

## Test files added / updated (PR #36 pass)

| File | Change |
|------|--------|
| `src/test/fixtures/DefaultDeckHarness.js` | **New** — canonical deck + lockfile harness |
| `src/default_deck.test.js` | **New** — shipped deck + dependency pins |
| `src/hooks/usePersistedDeck.test.js` | Orphan/empty `activeDeckId` |
| `src/domain/deckState.test.js` | Non-numeric id forge edge cases |
| `e2e/default-deck-agent-ux.spec.ts` | **New** — Playwright fresh-load stories |

## Playwright user stories (PR #36 pass)

1. **P0 — Canonical Fool:** Fresh localStorage → Dex → open Fool modal → sub is `Infinite Potential`, no Last.fm/scrobble text.
2. **P1 — Glitch anchor:** Dex grid shows `The Glitch`.
3. **P1 — Arena bench:** Default deck cards visible on arena bench without storage seed.

---

**Branch:** `greyzxcursor/agentic-security-test-coverage-pr36-v2`  
**Trigger context:** PR #36 CI success — supplements `greyzxcursor/complete-xmldom-fast-uri-pins-14d0`  
**Date:** 2026-09-12 (automation pass v2)

## Attack surface reviewed (scoreFormulaRegistry pass)

| Surface | Risk | Mitigation tested |
|---------|------|-------------------|
| `rulesets` inline functions → serializable keys | Non-serializable rulesets break hydration/export | `scoreFormula` string keys + `scoreFormulaRegistry` lookup tests |
| Missing registry entry for ruleset key | Silent fallback to mode base score (wrong UX) | Every ruleset `scoreFormula` resolves in registry |
| Agentic formula key injection | Arbitrary code via forged formula id | Registry rejects unknown keys; battleEngine guards with `if (scoreFunc)` |
| Malformed deck shell in multi-deck storage | Crash or undefined cards on hydrate | `usePersistedDeck` recovers deck without `cards` array |
| Orphan `activeDeckId` | Wrong active deck slice | Normalizes to `validatedDecks[0].id` |

## Prioritization (impact vs cost) — v2 delta

| Added coverage | Impact | Cost | Speed |
|----------------|--------|------|-------|
| `rulesets.test.js` registry rewrite | High — fixes broken `calculateScore` tests after #36 refactor | Low | Vitest ~ms |
| `battleEngine` pokemon + standard path guard | Medium — ruleset blast radius | Low | Vitest ~ms |
| Malformed deck shell recovery | Medium — persistence boundary | Low | Vitest |

**Deferred (follow-up):**

- Runtime test when `scoreFormula` key is valid string but missing from registry (requires test hook or schema).
- JSON Schema tying `rulesets.*.scoreFormula` enum to registry keys.

## Test files added / updated (v2 delta)

| File | Change |
|------|--------|
| `src/domain/rulesets.test.js` | Rewritten for `scoreFormulaRegistry` |
| `src/domain/battleEngine.test.js` | Pokemon ruleset + standard path guard |
| `src/hooks/usePersistedDeck.test.js` | Fixed orphan id expectation; malformed deck shell |
| `src/test/fixtures/AetherTestFixtures.js` | `scoreFormulaExpectations` constructor map |
