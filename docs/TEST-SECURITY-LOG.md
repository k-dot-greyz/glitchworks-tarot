# Test security log — agentic coverage pass

**Branch:** `greyzxcursor/agentic-security-test-coverage-3af5`  
**Trigger:** CI automation on PR #34 (`dependabot/npm_and_yarn-4e5eecd30c`) — supplements #25 default deck decoupling  
**Date:** 2026-09-12

## Attack surface map

| Surface | Entry | Risk | Mitigation tested |
|---------|-------|------|-------------------|
| **`default_deck.json` ship boundary** | Vite JSON import | Re-introduced Last.fm / overlay keys, invalid schema | `defaultDeck.test.js`, `DefaultDeckHarness` |
| **`localStorage` `aether-decks`** | `usePersistedDeck` init | Corrupt JSON, invalid schema, prototype pollution, orphan `activeDeckId` | `usePersistedDeck.test.js` |
| **Legacy `aether-deck` key** | Migration path | Stale/malformed single-deck blob | `usePersistedDeck.test.js` |
| **Deck import JSON** | `parseStoredDeck` | Parse errors, schema bypass, type coercion | `deckValidation.test.js` |
| **Runtime deck mutation** | `setDeck` | Invalid card injection into active state | `usePersistedDeck.test.js` |
| **Arena card assignment** | Click + ruleset banlist | Banned card bypass | `App.test.jsx`, `e2e/arena-rulesets.spec.ts` |
| **Ruleset selector** | UI / agent payload | Unknown ruleset ID → scoring drift | `battleEngine.test.js`, `rulesets.test.js` |
| **Battle resolution** | `resolveBattleWithEngine` | Mode/ruleset confusion, incomplete fighters | `battleEngine.test.js` |

## Prioritization rationale

| Area | Impact | Cost | Speed | Decision |
|------|--------|------|-------|----------|
| `default_deck.json` restore (#25) | **High** — shipped truth for all views | Low — pure JSON + harness | Fast | **Added** `defaultDeck.test.js` + Playwright canonical UX |
| `usePersistedDeck` branches | **High** — persistence trust boundary | Medium — hook harness | Fast | **Added** `usePersistedDeck.test.js` |
| `rulesets.js` banlist/scoring | **High** — Arena blast radius | Low — pure functions | Fast | **Added** `rulesets.test.js` |
| Ruleset × mode interaction | Medium — wrong winner UX | Low | Fast | **Extended** `battleEngine.test.js` |
| Dependabot bumps (#34) | Low code delta | — | — | **Regression via full Vitest suite** |
| Cosmetic-only paths | Low | — | — | **Skipped** |

## Test files added/updated

| File | Change |
|------|--------|
| `src/testFixtures/cardFixture.js` | Constructor-based card/deck state fixtures |
| `src/testFixtures/defaultDeckHarness.js` | Constructor-injected default deck policy harness |
| `src/domain/defaultDeck.test.js` | Canonical deck schema + forbidden-field guard |
| `src/hooks/usePersistedDeck.test.js` | Corrupt storage, pollution-shaped JSON, orphan activeDeckId |
| `src/domain/deckValidation.test.js` | Empty input, NaN stats, type coercion edges |
| `src/domain/rulesets.test.js` | Schema + `calculateScore` per ruleset |
| `src/domain/battleEngine.test.js` | MTG/Yu-Gi-Oh/Pokémon scoring + unknown ruleset fallback |
| `src/App.test.jsx` | Canonical deck render + full standard clash resolution |
| `e2e/arena-rulesets.spec.ts` | Playwright Arena ruleset + banlist user story |
| `e2e/default-deck-agent-ux.spec.ts` | Playwright canonical deck + corrupt storage UX |

## Playwright user stories (priority)

1. **Canonical deck (PR #25/#34):** Fresh visitor sees `The Fool` / `The Glitch` from `default_deck.json`, Oracle draw works, corrupt `localStorage` does not white-screen — `e2e/default-deck-agent-ux.spec.ts`.

2. **Arena operator:** Select TCG playmat, assign clash cards, banlist enforced, clash resolves — `e2e/arena-rulesets.spec.ts`.

## Follow-ups (not in this PR)

- Normalize orphan `activeDeckId` to a valid deck id on load (currently falls back to `decks[0]` cards but keeps stale id)
- JSON Schema for `default_deck.json` in CI (harness covers today)
- Drag-drop banlist E2E (RTL covers click path)
- Fuzz property tests for `validateCard`

## Verification commands

```bash
npm ci --legacy-peer-deps
npm run test
npm run build
npm run test:e2e   # CI authoritative; cloud VM may hit Playwright CDN TLS reset
```
