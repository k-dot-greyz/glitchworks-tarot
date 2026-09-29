# TCG kernel — proposed architecture

**Status: proposed. Not implemented. Not approved for a rewrite.**

Captured 2026-09-29 from the architecture discussion. This document does not replace the v2.1 product spec. That pointer stays in [`SPEC.md`](SPEC.md). No kernel crate, JSON pack, or view rewrite lives in this repo yet.

The next concrete artifact, after an explicit go-ahead, is the JSON schemas plus an Aether fixture pack locked to today's clash numbers. Not a UI rewrite. Not an Astro migration.

## Decision

Do **not** move the app from its current UI stack to Astro in order to make it emulate other card games.

Astro is a site shell. A playfield (drag, flip, zones, clash log) is a client island either way, and that island is still TypeScript. Astro does not change the thing that blocks extensibility: the domain is `AetherCard` plus `resolveClash`, with elements, abilities, protocols, and the advantage table compiled into code. A new game means a new function.

The long-term DX comes from a **Rust rules kernel** fed by **JSON content packs**. TypeScript only draws what the kernel returns and only emits intents the kernel says are legal.

| Layer | Owns | Must not |
| --- | --- | --- |
| Content JSON | Cards, tables, fields, rulesets, layouts | Execute anything |
| `glitch-tcg` (Rust) | Validate content, apply intents, return the next state plus a trace | Import a component, know what a sigil looks like |
| View (TypeScript) | Bind a layout, paint zones, send intents | Compute damage, legality, or shuffle |

Rust is one crate with no I/O. Compile it to WebAssembly for the browser and Capacitor, and later to a binary if a match needs an authority. Same code. The view never scores anything.

## Why this is more extensible

Today a second TCG means forking the clash function and the card struct. After this, a second TCG is a folder of JSON plus a failing fixture. The view protocol does not change.

Dex, Arena, and Oracle stop being three apps. They are three content packs over one reducer:

- **Dex** — a catalog field with no resolve step.
- **Arena** — a duel field plus the clash ruleset.
- **Oracle** — a draw-and-flip ruleset (spread size, reversed chance).
- **Forge** — authoring mode. It writes a template and validates it against the schema. It does not invent a new struct.

Presentation knobs (glitch, CRT, grain, fonts) stay in a view profile. They are not rules.

## Protocol

The view talks in two shapes only. If the UI cannot do it through `legal`, it is not a legal play.

```ts
type Intent =
  | { op: "draw"; zone: string; n: number }
  | { op: "place"; entity: string; zone: string }
  | { op: "clash"; a: string; b: string }
  | { op: "pass" };

type GameView = {
  field: Record<string, EntityView[]>;
  legal: Intent[];
  log: TraceLine[];
  result: "open" | "alpha" | "omega" | "draw";
};
```

`reduce(state, intent, rng) -> (state, trace)` is pure. RNG is injected, seeded, and logged. A clash test is a fixture, not a screenshot. The trace is the clash log. The UI does not invent the sentence.

## Documents, not types

Four files per game, versioned, loaded by id. Aether is the first pack, not the type system. No hardcoded card stats, advantage cells, or ability match-arms in the kernel.

### Template

`content/templates/aether/*.json` — a printed card. Stats and text are data. Modules are ids, not a TypeScript union of `overdrive | ironWall | voidShield`.

```json
{
  "id": "tpl.magician",
  "layout": "layout.tarot.face.v1",
  "tags": ["element.electric"],
  "modules": ["mod.overdrive"],
  "stats": { "atk": 85, "def": 30, "spd": 70 },
  "text": { "name": "The Magician", "upright": "...", "reversed": "..." }
}
```

### Table

`content/tables/advantage.aether.json` — the element grid. The engine looks up a key. It does not contain "void beats dark".

### Field

`content/fields/duel.v1.json` — zones and phases. Arena's two lanes are one field. A grid, a graveyard, or a three-card spread is another field, not another screen.

```json
{
  "id": "field.duel.v1",
  "zones": [
    { "id": "alpha.entity", "side": "alpha", "capacity": 1, "visibility": "public" },
    { "id": "omega.entity", "side": "omega", "capacity": 1, "visibility": "public" }
  ],
  "phases": ["place", "resolve"]
}
```

### Ruleset

`content/rules/aether.clash.v1.json` — a small instruction list. This is today's scoring, written as data. Unknown opcodes and unknown module ids fail at load, not mid-match.

```json
{
  "id": "rules.aether.clash.v1",
  "field": "field.duel.v1",
  "steps": [
    { "id": "overdrive", "when": { "module": "mod.overdrive", "protocol": "blitz" }, "op": "add", "stat": "atk", "value": 10 },
    { "id": "base", "op": "sum", "into": "base", "stats": ["atk", "spd"] },
    { "id": "edge", "op": "lookup", "into": "mult", "table": "advantage.aether", "key": ["self.tag.element", "foe.tag.element"], "default": 1 },
    { "id": "shield", "when": { "foe.module": "mod.voidShield" }, "op": "set", "into": "mult", "value": 1 },
    { "id": "score", "op": "mul", "into": "score", "args": ["base", "mult"] },
    { "id": "winner", "op": "cmp", "args": ["self.score", "foe.score"] }
  ]
}
```

The current formula this must reproduce, before any UI moves:

- Relic field: score = atk + def, multiplier 1.
- Otherwise start from atk and spd.
- `overdrive` and protocol `blitz`: atk += 10.
- Base = atk + spd. Multiplier = advantage lookup, default 1.
- Protocol `blitz`: base = atk + spd * 2.
- Protocol `sudden`: base = atk * 3, multiplier forced to 1.
- `ironWall` and protocol `sudden`: base += 20.
- Foe has `voidShield`: multiplier forced to 1.
- Score = base * multiplier. Higher score wins. Tie is equilibrium.

Blitz, sudden death, relic, and void shield are fixtures, not comments.

### Layout

`content/layouts/tarot.face.v1.json` — slots and renderers. `bind` is a path into the template or the entity. `renderer` is a view-registry key (`text`, `stat`, `sigil.geometric`). The kernel does not care. Reversed is an instance flag. The layout decides which text slot it shows.

## Opcodes

Stay tiny: `add`, `set`, `sum`, `mul`, `lookup`, `cmp`, `move`, `draw`, `reveal`, `win-if`.

A new TCG is new JSON until an opcode is actually missing. Missing twice, then consider a scripting escape hatch (Rhai or WASM guests). Scripting is not the design.

Modules are polymorphic by id. `mod.overdrive` is a bundle of steps, not a match arm. The card points at the module. The ruleset includes the module.

Core nouns, shared by every pack:

| Noun | Meaning |
| --- | --- |
| Template | The printed card. Stats, text, tags, layout id, module ids. |
| Entity | An instance. Template id, instance id, zone, orientation, counters. |
| Zone | Ordered collection. Capacity and visibility. |
| Field | Named zones plus phases. |
| Effect | Data: op, args, when, duration. Not a closure. |
| Event | Append-only log line. The trace. |

## Crate layout (when approved)

```text
glitch-tcg/
  crates/kernel/     serde types, validate, reduce(state, intent, rng) -> (state, trace)
  crates/wasm/       wasm-bindgen: load_pack, apply, view
  content/           JSON packs, including fixtures copied from the current 17
```

`cargo test` replays the canon. Magician vs Fool and the other locked cases must match the current numbers before the board calls the kernel.

The TypeScript that remains:

- `renderers["sigil.geometric"]` reads a layout slot and draws. The kernel never imports it.
- The board renders `GameView.field` by zone id. It does not know "alpha lane".
- Input only emits intents that appear in `legal`.

Shell choice is last. Keep the Vite island this repo already ships and load the WASM. Use Astro only if the product must live inside the Glitchworks site. Not before, and not as the engine.

## What this spec refuses

- Rewriting the playable deck into Astro first. That loses the game and gains a router.
- A TypeScript copy of the rules "for the UI". One authority. WASM or HTTP. The UI displays `GameView` and sends intents.
- Modeling the general case as `AetherCard` with optional fields. That is how the hardcoded union comes back.
- Starting with an embedded scripting language. The clash we have is tables and arithmetic.
- Treating Capacitor as part of the kernel. Capacitor wraps the same WASM later. It does not define rules.

## Order of work

Do not start step 2 until this document is explicitly approved.

1. Write the four JSON schemas. Translate the current canon, advantage table, duel field, and clash formula into fixtures. No behavior change.
2. Rust kernel. Tests locked to today's scores, including blitz, sudden death, relic, and void shield.
3. WASM `apply` / `view`. A thin board replaces direct calls to the clash function. The screens stay.
4. Only then decide the shell. Vite island plus WASM, unless the page must live in the Glitchworks site.

## Open points

These are discussion, not settled:

- Whether protocol variants (`standard`, `blitz`, `sudden`) are ruleset ids or a single ruleset with a `protocol` input. The fixture above uses an input so one file covers all three. Separate ruleset ids are also fine if that reads clearer.
- Whether Oracle's reversed coin is a ruleset step (`draw` + a `flip` op) or a layout concern driven by an entity flag the kernel already set. The kernel must own the coin so tests can seed it. The layout only chooses the text slot.
- Where the crate lives. Default: this repo, `glitch-tcg/`, so the fixtures sit next to the deck. Not a drive-by rewrite of the current UI, and not an Astro app.
