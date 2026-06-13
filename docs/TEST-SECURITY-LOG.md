# Test security log — agentic coverage pass

**Branch:** `greyzxc/agentic-security-test-coverage-96f4`  
**Trigger:** CI automation on dependabot PR #29 (`npm_and_yarn` group bump)  
**Date:** 2026-06-13

## Attack surface map

| Surface | Entry | Risk | Mitigation tested |
|---------|-------|------|-------------------|
| **localStorage `aether-decks`** | `usePersistedDeck` init | Corrupt JSON, invalid schema, prototype pollution | `usePersistedDeck.test.js` |
| **Legacy `aether-deck` key** | Migration path | Stale/malformed single-deck blob | `usePersistedDeck.test.js` |
| **Deck import JSON** | `parseStoredDeck` | Parse errors, schema bypass, type coercion | `deckValidation.test.js` |
| **Runtime deck mutation** | `setDeck` | Invalid card injection into active state | `usePersistedDeck.test.js` |
| **Arena card assignment** | Click + drag-drop | Banned card bypass | `App.test.jsx`, `e2e/arena-rulesets.spec.ts` |
| **Ruleset selector** | UI / future agent payload | Unknown ruleset ID → scoring drift | `battleEngine.test.js`, `rulesets.test.js` |
| **Battle resolution** | `resolveBattleWithEngine` | Mode/ruleset confusion, incomplete fighters | `battleEngine.test.js` |

## Prioritization rationale

| Area | Impact | Cost | Speed | Decision |
|------|--------|------|-------|----------|
| `rulesets.js` (low prior cov) | High — scoring + banlist blast radius | Low — pure functions | Fast | **Added** `rulesets.test.js` |
| `usePersistedDeck` branches | High — persistence is trust boundary | Medium — hook harness | Fast | **Added** `usePersistedDeck.test.js` |
| Ruleset × mode interaction | Medium — wrong winner UX | Low | Fast | **Extended** `battleEngine.test.js` |
| Arena clash E2E | High — primary Arena UX | Medium — 600ms async clash | Slower | **Added** `e2e/arena-rulesets.spec.ts` |
| Cosmetic-only paths | Low | — | — | **Skipped** |

## Test files added/updated

| File | Change |
|------|--------|
| `src/testFixtures/cardFixture.js` | Constructor-based fixtures (no scattered magic values) |
| `src/domain/rulesets.test.js` | Schema + `calculateScore` per ruleset |
| `src/domain/battleEngine.test.js` | MTG/Yu-Gi-Oh/Pokémon scoring + unknown ruleset fallback |
| `src/domain/deckValidation.test.js` | Empty input, NaN stats, type coercion edges |
| `src/hooks/usePersistedDeck.test.js` | Corrupt storage, pollution-shaped JSON, quota telemetry |
| `src/App.test.jsx` | Full standard clash resolution (async waitFor) |
| `e2e/arena-rulesets.spec.ts` | Playwright user-story flows for rulesets + banlist |

## Playwright user story (priority)

> As an Arena operator, I select a TCG playmat, assign two clash cards, and receive a resolved battle log — with banned cards rejected at the boundary and no console errors when cycling rulesets.

Covered in `e2e/arena-rulesets.spec.ts`.

## Follow-ups (not in this PR)

- Drag-drop banlist E2E (RTL covers click path; drop uses same `bannedCardIds` check)
- `elemental.js` `getTypeColor` fallback — cosmetic, low security signal
- `deckStorage.js` adapter error paths — low blast radius, memory adapter already covered
- Fuzz property tests for `validateCard` — useful but out of scope for minimal diff

## Verification commands

```bash
npm install --legacy-peer-deps
npm run test
npm run test:e2e   # requires Playwright chromium; CI installs via Actions
```

**Local E2E note:** Cloud agent VM may not download Playwright browsers reliably. E2E specs mirror RTL coverage; CI is the authoritative E2E runner per `CONTRIBUTING.md`.
