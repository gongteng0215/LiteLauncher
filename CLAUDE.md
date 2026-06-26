# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Install dependencies
pnpm install

# Build (TypeScript compile + copy assets)
pnpm run build

# Start app (build + launch Electron)
pnpm start

# Development watch mode (auto compile, main-process restart, renderer reload)
pnpm dev

# Type check only
pnpm run typecheck

# Run all regression tests
pnpm run test:regression

# Run a single test suite (build first, then run the compiled JS)
pnpm run build && node dist/test/<test-file>.js

# E2E smoke tests (requires build)
pnpm run test:e2e:smoke

# Full regression + E2E
pnpm run test:regression:full

# Cashflow plugin tests
pnpm run test:cashflow

# Check source file encoding
pnpm run check:encoding

# Package for Windows
pnpm run dist:win
```

## Architecture

**Stack:** Electron + TypeScript + SQLite (`node:sqlite`). Compiled from `src/` to `dist/` via `tsc`. Package manager is `pnpm`.

**Process split:**

- `src/main/` 鈥?Electron main process. Entry point: `src/main/index.ts`. Owns the database, catalog, search worker, IPC handlers, window lifecycle, tray, and global shortcut (`Alt+Space` default).
- `src/renderer/` 鈥?Single-page renderer. Entry: `src/renderer/renderer.ts` (renderer shell / orchestration layer under active decomposition). Search home, settings, shared DOM helpers, and panel dispatch still live here; plugin and standalone tool panel implementations now mostly live in `src/renderer/plugin-panel-impls.ts`. No bundler 鈥?TypeScript compiles directly to `dist/renderer/renderer.js`, loaded by `src/renderer/index.html`.
- `src/preload/` 鈥?Electron preload script exposing `window.electronAPI` to the renderer via `contextBridge`.
- `src/shared/` 鈥?Types, IPC channel names, and settings defaults shared between main and renderer.

**IPC contract:** All main鈫攔enderer communication goes through named channels defined in `src/shared/channels.ts` (`IPC_CHANNELS`). The renderer calls `window.electronAPI.<method>()` (defined in preload), which maps to `ipcRenderer.invoke(channel, ...)`. Main registers handlers in `src/main/ipc.ts`.

**Plugin system:**

- Each plugin lives in `src/main/plugins/<plugin-id>/index.ts` and implements `LauncherPlugin` (`src/main/plugins/types.ts`): `id`, `name`, `createCatalogItems()`, optional `getQueryItems(query)`, and `execute(optionsText, context)`.
- All plugins are registered in `src/main/plugins/index.ts` (`ALL_PLUGINS` array).
- Plugin `target` format: `command:plugin:<plugin-id>?action=<action>&key=value`.
- Plugin UI panels are rendered entirely in the renderer (`src/renderer/plugin-panel-impls.ts`). The main process sends an `openPanel` IPC event; the renderer switches to `PanelMode = "plugin"` and renders the matching panel.
- `src/renderer/index.html` intentionally loads `plugin-constants.js`, `plugin-static-data.js`, `image-prompt-data.js`, `plugin-handler-config.js`, and `plugin-panel-impls.js` before `renderer.js`; keep this ordering stable because the renderer shell depends on pre-registered panel implementations.
- Visible plugins are persisted in SQLite settings and managed via `setVisiblePluginIds` / `getVisiblePluginIds`. Required plugins (`hardware-inspector`, `clipboard-workbench`, `webtools-file-hash`, `webtools-port-helper`, `webtools-image-prompt`, `codeagent-switch`) are always injected even if missing from saved settings.

**Data layer:**

- `src/main/database.ts` (`LiteDatabase`) 鈥?SQLite wrapper for catalog items, usage records, settings (key/value), clipboard history, and error logs, backed by the runtime `node:sqlite` driver.
- `src/main/catalog.ts` 鈥?Builds the `LaunchItem[]` catalog by scanning the filesystem (Program Files, custom dirs).
- `src/main/search.ts` + `src/main/search-worker.ts` 鈥?Search runs in a worker thread (`src/main/search-worker-thread.ts`) to avoid blocking the main process. Falls back to in-process search on worker failure.
- `src/main/usage-store.ts` 鈥?In-memory usage frequency map, persisted to SQLite.

**Settings persistence:** All settings (search display config, catalog scan config, visible plugin IDs, pinned items) are stored as JSON strings in the SQLite `settings` table via `LiteDatabase.getSetting` / `setSetting`.

**Window behavior:** The launcher window hides on blur (auto-hide) and clears the search input on hide. Auto-hide can be suspended during plugin file-picker or download operations via `setAutoHideSuspended` IPC.

## Testing

Tests are plain TypeScript files in `src/test/`, compiled to `dist/test/` and run directly with `node`. No test framework 鈥?tests use `console.assert` / `process.exit(1)` patterns.

E2E tests use **Playwright** (`src/test/e2e-test-utils.ts`) to launch the real Electron app with `LITELAUNCHER_E2E=1` and an isolated temp `userData` dir.

When adding a new plugin, add regression coverage in `src/test/plugin-panel-impls-regression.test.ts` and `src/test/visible-plugins-regression.test.ts`.
When a targeted test depends on `dist` output, build first and then run `node dist/test/...` sequentially; do not parallelize those commands with `pnpm run build`.

## Key conventions

- `LaunchItem.type` for plugins is always `"command"`.
- Plugin IDs are lowercase kebab-case.
- Chinese UI strings are used throughout (this is intentional 鈥?the app targets Chinese-speaking users).
- The renderer has no bundler or framework 鈥?it's vanilla TypeScript compiled to a single JS file. DOM manipulation is done directly.
- `src/renderer/renderer.ts` is now the renderer shell under active decomposition; keep new plugin / standalone panel implementations in `src/renderer/plugin-panel-impls.ts`, and leave only orchestration, search / settings UI, shared helpers, and truly cross-panel state in `renderer.ts`.
- `src/renderer/plugin-static-data.ts` holds static lookup tables for plugin panels (e.g. preset lists, template data).
- `src/renderer/plugin-handler-config.ts` maps plugin IDs to their panel render functions.

