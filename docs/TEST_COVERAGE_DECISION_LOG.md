# Test coverage decision log — PR #31 (`claude/claude-md-docs-0xsxa4`)

**Branch:** `greyzxcursor/agentic-security-test-coverage-981a`  
**Trigger context:** CI check suite success on PR #31 — CLAUDE.md + serializable rulesets + persistence hardening  
**Date:** 2026-09-12

## Attack surface reviewed

| Surface | Risk | Mitigation tested |
|---------|------|-------------------|
| `scoreFormulaRegistry` lookup | Agentic/injected formula keys execute arbitrary code or crash scoring | Registry key allowlist; unknown keys fail closed; rulesets stay JSON-serializable |
| `resolveBattleWithEngine` ordering | Mode modifier + ruleset overlay double-count or skip elemental/ability steps | Vitest: speedBlitz+mtg overlay replaces mode base; pokemon/mtg/yugioh paths unchanged |
| Orphan `activeDeckId` in storage | UI dereferences missing deck → rename crash / white screen | `usePersistedDeck` normalizes to first deck; App rename null-safe; E2E orphan payload |
| Malformed deck entries (null / missing `cards`) | `map`/`validateDeck` throws on hostile JSON | Recovery shell with fallback cards; E2E malformed entry |
| `createDeck` / `duplicateDeck` ID generation | Timestamp collisions under rapid agent actions | `crypto.randomUUID` path when available (Vitest stub) |

## Prioritization (impact vs cost)

| Added coverage | Impact | Cost | Speed |
|----------------|--------|------|-------|
| Fix `rulesets.test.js` for `scoreFormulaRegistry` | **Critical** — PR broke 4 Vitest assertions | Low | ms |
| Registry serializability + key mapping | High — new refactor blast radius | Low | ms |
| Mode+ruleset overlay ordering | High — combat math regression | Low | ms |
| Orphan/malformed persistence boundary | High — localStorage is hostile edge | Medium | Vitest + Playwright |
| Rename UX with orphan active id | Medium — user-facing crash fix in PR | Low | RTL + E2E |

**Deferred (follow-up if PR #31 merges):**

- JSON Schema for `default_deck.json` and multi-deck persistence envelope.
- Property-based fuzz for `scoreFormulaRegistry` inputs (`Infinity`, negative stats).
- E2E for deck create/duplicate UUID collision under parallel tabs.

## Test files added / updated

| File | Change |
|------|--------|
| `src/domain/rulesets.test.js` | **Updated** — `scoreFormulaRegistry` + serializability |
| `src/domain/battleEngine.test.js` | **Updated** — mode+ruleset overlay, pokemon path |
| `src/hooks/usePersistedDeck.test.js` | **Updated** — orphan id, malformed entry, UUID ids |
| `src/test/fixtures/AetherTestFixtures.js` | **Updated** — formula/deck id helpers + orphan/malformed builders |
| `src/App.test.jsx` | **Updated** — orphan rename null-safe RTL |
| `e2e/persistence-security.spec.ts` | **New** — Playwright persistence user stories |

## Playwright user stories (priority)

1. **P0 — Orphan activeDeckId:** Corrupt storage points at missing deck → shell loads, selector normalizes to valid deck, Dex renders cards.
2. **P0 — Malformed deck entry:** Deck object without `cards` array → no white screen, Dex still shows valid deck cards.
3. **P1 — Rename with orphan id:** Rename control opens with empty name (no throw from null dereference).

## Validation commands

```bash
npm run lint
npm run test
npm run build
npm run test:e2e
```

## Fixture convention

Per CONTRIBUTING §2.1, literals live in constructor fixtures (`AetherTestFixtures`, `PersistenceE2EFixtures`) — specs override via options, not scattered magic strings.
