# `data-testid` convention (Aether / Metapod)

Stable hooks for Vitest RTL and Playwright E2E. **Pattern:**

```text
aether-<area>-<element>
```

- **`area`**: shell region or feature (`root`, `nav`, `main`, `view-dex`, `modal-settings`, etc.).
- **`element`**: concrete control or container (`settings-open`, `oracle-draw`, `arena-clash`).

Only add IDs where tests need them (nav, modals, primary actions, key views). Do not spray IDs on every wrapper.

## Current IDs

| `data-testid` | Purpose |
|---------------|---------|
| `aether-root` | App shell |
| `aether-main` | Main content |
| `aether-nav` | Bottom/top nav bar |
| `aether-nav-dex` | Dex tab |
| `aether-nav-arena` | Arena tab |
| `aether-nav-oracle` | Oracle tab |
| `aether-nav-forge` | Forge tab |
| `aether-settings-open` | Open settings (mobile) |
| `aether-settings-open-desktop` | Open settings (desktop) |
| `aether-settings-close` | Close settings modal |
| `aether-modal-settings` | Settings overlay |
| `aether-modal-settings-panel` | Settings panel |
| `aether-view-dex` | Dex grid view |
| `aether-view-arena` | Arena view |
| `aether-arena-log` | Arena status log |
| `aether-arena-clash` | Initiate clash |
| `aether-arena-flush` | Flush arena |
| `aether-view-oracle` | Oracle view |
| `aether-oracle-draw` | Draw / recalculate spread |
| `aether-view-forge` | Forge view |
| `aether-forge-compile` | Compile entity |
| `aether-modal-card` | Card detail overlay (dex) |
| `aether-modal-card-close` | Close card modal |

When splitting `App.jsx`, **keep these IDs stable** on the moved nodes.
