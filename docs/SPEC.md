# Specification pointer (Aether Deck)

The **authoritative product/spec document** for Glitchworks / Aether Deck lives in the **dev-master** workspace (not all clones include it):

| Context | Path |
|--------|------|
| **dev-master monorepo** | [`dex/08-projects/Glitchworks Tarot-Aether Deck Spec.md`](../../../08-projects/Glitchworks%20Tarot-Aether%20Deck%20Spec.md) (relative from this file: `dex/09-repos/glitchhub-tarot/docs/` → go up to `dex/` then `08-projects/`) |
| **Standalone clone** of this repo only | Open the same file on GitHub from **dev-master**, or copy the spec into your wiki — the app repo does not vendor the full spec by default. |

**Spec version** referenced in code comments: **v2.1 (Glitchworks Edition)** — see `src/App.jsx` header.

**What the spec covers (summary):** philosophy, stack (React 18, Vite, Tailwind, lucide-react), `Card` entity schema, the four views (Dex, Arena, Oracle, Forge), aesthetics (glitch / CRT / noise).

Keep implementation details (test IDs, CI jobs) in [`TESTIDS.md`](TESTIDS.md) and [`TESTING.md`](TESTING.md).
