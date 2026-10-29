# TCG kernel — proposed architecture

**Status: proposed. Not implemented. Scoring model corrected 2026-09-29.**

This document does not replace the v2.1 product spec. That pointer stays in [`SPEC.md`](SPEC.md). No kernel crate and no view rewrite live in this repo. The normative clash numbers are [`../content/aether/fixtures/clash.json`](../content/aether/fixtures/clash.json).

Do not start the Rust crate until this document is explicitly approved. The fixture file is a lock, not an implementation.

## Decision

Do **not** move the app to Astro to make it emulate other card games. Astro is a site shell. A playfield is a client island either way.

The long-term DX is a **Rust rules kernel** fed by **JSON content packs**. TypeScript only draws what the kernel returns and only emits intents the kernel says are legal.

| Layer | Owns | Must not |
| --- | --- | --- |
| Content JSON | Cards, tables, fields, laws, rulesets, layouts | Execute anything |
| `glitch-tcg` (Rust) | Validate content, apply intents, return the next state plus a trace | Import a component, know what a sigil looks like |
| View (TypeScript) | Bind a layout, paint zones, send intents | Compute damage, legality, or shuffle |

One crate, no I/O. WebAssembly for the browser and Capacitor. The same crate as a binary later, if a match needs an authority. The view never scores anything.

## Reducer

```text
load(pack) -> Pack | LoadError
reduce(pack, state, intent, rng) -> (state, trace)
legal(pack, state) -> Intent[]
view(state) -> GameView
```

`load` fails closed. An unknown opcode, an unresolved id, or a multiplier that is not a tenth is a load error. It is not a skipped step.

`reduce` is pure. `rng` is an injected stream. The kernel never calls `Math.random`. The 640ms "DATA COLLISION" beat is the view's timer. The kernel returns on the same call.

```ts
type Intent =
  | { op: "draw"; zone: string; n: number }
  | { op: "place"; entity: string; zone: string }
  | { op: "clash" }
  | { op: "pass" };

type GameView = {
  field: Record<string, EntityView[]>;
  legal: Intent[];
  log: TraceLine[];
  result: "open" | "alpha" | "omega" | "draw";
};
```

There is no `score()` export. If the UI can call one, the second authority is already back.

## Match state

```text
Match
  field: zone-id -> [Entity]
  input: { protocol, law }     # standard|blitz|sudden , clash|relic
  phase: place | resolve
  result: open | alpha | omega | draw
  log: TraceLine[]

Entity
  id: instance id              # not the template id
  template: template id
  orientation: upright | reversed
  counters: {}                 # empty for Aether
```

Scratch registers exist only while a step list runs, then they are discarded: `atk`, `def`, `spd`, `base`, `multTenths`, `scoreTenths`, plus `self` and `foe`.

Both lanes score in one clash. It is not a directed strike. Alpha is scored against omega, then omega against alpha, then one compare.

Instance ids are required even though the canon deck has one copy of each card. "Already live" is the Aether field rule `distinctBy: template`. Another game can run a playset with `distinctBy: instance`.

## Settled: relic is a law, not a field

Arena's two lanes do not change when Relic is selected. Relic changes scoring and one placement ban. Protocol is ignored, which is what the UI already says: "Relic law ignores the protocol." Abilities do not fire. Advantage does not fire.

The Glitch ban is content. Relic denies template `404`. It does not deny every `dark` card. Death stays legal.

```json
{
  "id": "field.duel.v1",
  "zones": [
    { "id": "alpha.entity", "side": "alpha", "capacity": 1, "visibility": "public" },
    { "id": "omega.entity", "side": "omega", "capacity": 1, "visibility": "public" }
  ],
  "phases": ["place", "resolve"],
  "distinctBy": "template",
  "deny": [
    {
      "when": { "law": "relic" },
      "templates": ["404"],
      "trace": "[ ERR: THE GLITCH IS BARRED UNDER RELIC LAW ]"
    }
  ]
}
```

`legal` runs before `reduce`. An illegal intent does not change state.

- `place` only into a zone that has room, and only in phase `place`.
- `distinctBy: template` rejects a template that is already in the other lane.
- The relic deny rejects `404`.
- `clash` is legal only when both zones hold one entity.
- `draw` is legal for the Oracle pack because that pack lists it. The duel pack does not. Same reducer.

## Settled: one ruleset, two inputs

`protocol` and `law` are match inputs. They are not four ruleset ids. One file covers Standard, Blitz, Sudden, and Relic. The first matching branch runs. Later branches do not run.

This matches the current scorer. Standard writes `base`, then Blitz and Sudden **replace** that value. A single straight pipeline would score Blitz twice and is wrong. Do not "simplify" the branches back into one list.

```text
law == relic:
  base = atk + def
  multTenths = 10
  scoreTenths = base * multTenths
  stop this branch

law == clash, protocol == blitz:
  if self has mod.overdrive: atk += 10
  base = atk + spd * 2
  multTenths = lookup(self.element, foe.element) or 10
  if foe has mod.voidShield: multTenths = 10
  scoreTenths = base * multTenths

law == clash, protocol == sudden:
  base = atk * 3
  multTenths = 10
  if self has mod.ironWall: base += 20
  if foe has mod.voidShield: multTenths = 10
  scoreTenths = base * multTenths

law == clash, protocol == standard:
  base = atk + spd
  multTenths = lookup(self.element, foe.element) or 10
  if foe has mod.voidShield: multTenths = 10
  scoreTenths = base * multTenths
```

Opcodes stay `add`, `set`, `sum`, `mul`, `lookup`, `cmp`. `spd * 2` is a `mul` into a scratch register, then a `sum`. No formula language. No `stop` opcode: the branch selector is the stop.

`when` on a step skips that step. It is not an error.

Module order is the ruleset's order, never the card's. `add` stacks. `set` replaces. Aether's single rite is `modules.max: 1` on that pack. The kernel allows more than one.

### Ability semantics that the copy strings get slightly wrong

- **Overdrive** adds 10 to `atk` before the Blitz base is built. It does not add 10 to the finished score. It does not fire outside Blitz.
- **Iron wall** does `base += 20` after Sudden has set `base = atk * 3`. The printed line "+20 score" is true only because Sudden already forced the multiplier to 1. Fixtures lock `base`, `multTenths`, and `scoreTenths`, so a later edit cannot preserve the displayed score while moving the +20.
- **Void shield** is an unconditional `multTenths = 10` on the attacker when the foe has the module. It is not "if multiplier > 1". Under Sudden the multiplier is already 10, so the shield changes nothing. It also changes nothing when the attacker had no table edge.

Nothing in the advantage table beats `void`. Hierophant's shield therefore never changes a current canon score. The shield case that flips a winner is Fool (`void`, edge 2 against `dark`) versus The Glitch (`dark`, `mod.voidShield`). Without the module Fool scores 200 and wins. With it Fool scores 100 and loses. That pair is in the fixture file. Chariot versus Hierophant on Blitz is included as the negative: wind has no edge against void, so the shield is a no-op.

## Numbers

Do not lock IEEE-754 dust. In the current JavaScript scorer, `1.1 * 100` is `110.00000000000001`. Store multipliers as tenths (`11` means 1.1). `scoreTenths = base * multTenths`, which is already the displayed score times 10. Compare those integers. Display divides by 10. A value that is not an exact tenth fails at load (`1.25` with scale 10).

The table JSON keeps human decimals (`1.5`, `1.2`, `1.1`, `2`). The loader scales them. Missing keys default to 10, not to an error. The current grid:

| Attacker | Edges (defender: tenths) |
| --- | --- |
| fire | wind 15, electric 12 |
| wind | electric 15, water 12 |
| electric | water 15, fire 12 |
| water | fire 15, wind 12 |
| void | fire 11, water 11, electric 11, wind 11, dark 20 |
| dark | fire 12, water 12, electric 12, wind 12 |

No row lists itself. No row except `void` lists `dark`. No row lists `void`. Dark does not beat void.

Locked cases, winner included, live in the fixture file. Do not retype them into a test by hand.

The result sentence is pack data, not a Rust format string:

```json
{
  "gt": "> {winner} OVERWRITES {loser}{suffix}",
  "eq": "> EQUILIBRIUM. NO DELETION.",
  "suffixWhen": "winner.multTenths > 10",
  "suffix": "  ·  TYPE ADVANTAGE",
  "name": "upper"
}
```

Equal `scoreTenths` is `draw`. The trace of each fired step (id, register before, register after) is what a test asserts. The human line is the last template in that trace.

## Documents

Aether is the first pack, not the type system. Template ids are the printed ids (`001`, `404`), so fixtures name the cards the app already uses.

```json
{
  "id": "001",
  "layout": "layout.tarot.face.v1",
  "tags": ["element.fire"],
  "modules": [],
  "stats": { "atk": 85, "def": 40, "spd": 70 },
  "text": { "name": "The Magician", "upright": "...", "reversed": "..." }
}
```

The Magician is fire, defense 40, and has no rite. Overdrive is The Chariot (`007`), not The Magician. An earlier draft of this document had both of those wrong.

`content/layouts/tarot.face.v1.json` is slots and renderers. `bind` is a path. `renderer` is a view-registry key (`text`, `stat`, `sigil.geometric`). The kernel does not care. Reversed is an instance flag. The layout picks `text.upright` or `text.reversed`.

`seedNumber` stays in the sigil renderer. It is not a rule.

Stat caps are pack constraints. Aether's 99 is not a constant in Rust. A bad Forge draft fails `load`, not the Arena.

## Oracle

The kernel owns the coin. `draw` takes `n` from the ruleset (Signal 1, Thread 3, Cross 5). Shuffle is Fisher-Yates over the injected RNG. Each drawn entity then takes `orientation` from the next bit. Aether's probability is `1/2`, stored on the pack. A seed replays the same spread. The layout only reads the flag.

## Crate cut, when approved

```text
glitch-tcg/crates/kernel    serde, integer tenths, load, legal, reduce
glitch-tcg/crates/wasm      load_pack, apply, view. No rules.
content/aether/             templates, tables, field, ruleset, layouts
content/aether/fixtures/    clash.json, already in this repo
```

`cargo test` replays `clash.json` before any board calls the kernel. WASM exposes `load_pack`, `apply(state, intent)`, `view(state)`.

The TypeScript that remains:

- `renderers["sigil.geometric"]` reads a layout slot and draws.
- The board renders `GameView.field` by zone id. It does not know "alpha lane".
- Input only emits intents that appear in `legal`.

Shell choice is last. Keep the Vite island this repo already ships and load the WASM. Use Astro only if the product must live inside the Glitchworks site.

## What this spec refuses

- Rewriting the playable deck into Astro first.
- A TypeScript copy of the rules "for the UI".
- Modeling the general case as `AetherCard` with optional fields.
- An embedded scripting language. The clash we have is tables and arithmetic. Scripting is the escape hatch after an opcode is missing twice.
- Treating Capacitor as part of the kernel.
- Locking the JavaScript float dust.
- One straight step list for all three protocols.

## Order of work

1. Done as a lock, not as a loader: the clash fixture. Schemas for the other three documents are still unwritten.
2. Rust kernel. Tests read the fixture. Do not start until this document is explicitly approved.
3. WASM `apply` / `view`. A thin board replaces direct calls to the clash function. The screens stay.
4. Only then decide the shell.

## Open points

Settled, do not relitigate without a reason: Relic is a law. One ruleset, two inputs. Integer tenths. The kernel owns the Oracle coin. The crate lives in this repo at `glitch-tcg/`.

Still open: the JSON Schema files for template, table, field, and layout. The fixture is deliberately self-contained so those schemas can land without moving the locked numbers.
