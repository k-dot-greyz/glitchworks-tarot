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

**Branch:** `greyzxcursor/agentic-security-test-coverage-pr34`  
**Trigger context:** PR #34 (`dependabot/npm_and_yarn-4e5eecd30c`) — dependency bumps on top of merged #25 canonical default deck restoration  
**Date:** 2026-09-12

## Attack surface reviewed (default deck + persistence)

| Surface | Risk | Mitigation tested |
|---------|------|-------------------|
| `default_deck.json` shipped artifact | Corrupt or API-coupled cards break fresh installs | `DefaultDeckHarness` + `defaultDeck.test.js` schema, count, anchor cards, forbidden patterns |
| Forge ID collision with `404` (The Glitch) | Duplicate ids corrupt arena/oracle draws | `nextForgedCard` unit + Playwright compile flow |
| Orphan `activeDeckId` in `aether-decks` | Active deck undefined → crash or empty dex | `usePersistedDeck` falls back to `decks[0]` |
| Legacy `aether-deck` migration path | Stale single-key storage ignored after multi-deck rollout | `usePersistedDeck` legacy hydrate + Playwright init-script |
| Agentic deck JSON injection | Malformed legacy/multi payloads white-screen shell | Existing `maliciousStoredDeckPayloads` + new legacy E2E |

## Prioritization (impact vs cost)

| Added coverage | Impact | Cost | Speed |
|----------------|--------|------|-------|
| `DefaultDeckHarness` + `defaultDeck.test.js` | High — #25 regression guard for shipped data | Low | Vitest ~ms |
| `usePersistedDeck` orphan + legacy paths | High — persistence blast radius | Low | Vitest + renderHook |
| `e2e/default-deck-agent-ux.spec.ts` | High — real UX for fresh + migrated users | Medium | Playwright + preview |

**Deferred (follow-up if PR #34 merges):**

- Normalize orphan `activeDeckId` to first deck id on load (product decision).
- JSON Schema artifact for `default_deck.json` (machine-readable drift gate in CI).
- Dedicated RTL test asserting every shipped card renders in dex grid (cosmetic signal only).

## Test files added / updated

| File | Change |
|------|--------|
| `src/test/fixtures/DefaultDeckHarness.js` | **New** — constructor-instantiated shipped-deck harness |
| `src/domain/defaultDeck.test.js` | **New** — canonical deck invariants + forge id boundary |
| `src/hooks/usePersistedDeck.test.js` | Orphan `activeDeckId` + legacy storage migration |
| `e2e/default-deck-agent-ux.spec.ts` | **New** — Playwright user-story flows |

## Playwright user stories (priority)

1. **P0 — Fresh canonical deck:** Dex shows The Fool and The Glitch on first load.
2. **P1 — Legacy migration:** `aether-deck` only → shell renders, Fool visible, no unexpected console errors.
3. **P1 — Forge collision guard:** Compile on default deck → unique ids, new card not `404`/`018`/`019`.
4. **P2 — Deck selector stability:** `default` active id survives reload.

## Validation commands

```bash
npm ci --legacy-peer-deps
npm run lint
npm run test
npm run build
npm run test:e2e
```
