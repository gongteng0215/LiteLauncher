# LiteLauncher Panel Persistence Design

## Goal

Make `plugin` / `settings` / `cashflow` panels stay visible when the launcher window loses focus, and only close them through explicit user actions such as `Esc`, in-panel back buttons, or other deliberate hide flows.

## Scope

This design covers:

- the launcher window blur-to-hide rule in panel modes
- shared panel-mode behavior for `plugin`, `settings`, and `cashflow`
- targeted regression and smoke coverage for the new persistence behavior

This design does not cover:

- changing search mode blur behavior
- changing clipboard mode blur behavior
- redesigning panel layouts or plugin content

## Current Context

Today the main process hides the launcher on `BrowserWindow.blur` unless auto-hide is temporarily suspended. That makes plugin panels, settings, and cashflow disappear as soon as the user clicks outside the window.

The renderer already distinguishes modes and already treats `plugin`, `settings`, and `cashflow` as expanded panel-style shells. It also already reserves explicit exit paths:

- `Esc`
- panel-level back flows
- explicit hide behavior when returning to search

That means the missing piece is not panel navigation. The missing piece is the main-process blur policy.

## Decision

When LiteLauncher is in `plugin`, `settings`, or `cashflow` mode, the launcher window should not auto-hide on blur.

When LiteLauncher is in `search` or `clip` mode, the existing blur-to-hide behavior should remain unchanged.

## User Experience Rules

1. Opening a plugin panel should keep the launcher visible even if the user clicks another app or monitor.
2. Opening settings should behave the same way.
3. Opening cashflow should behave the same way.
4. `Esc` should still return from these panel modes exactly as it does now.
5. Existing explicit close or hide paths should keep working.
6. Search mode should still blur-hide, preserving launcher-style quick-dismiss behavior.
7. Clipboard mode should keep its existing blur-hide behavior unless changed in a separate design.

## Implementation Approach

Use the existing window auto-hide suspension mechanism instead of inventing a second persistence system.

Recommended approach:

- renderer mode changes should drive whether blur auto-hide is suspended
- entering `plugin`, `settings`, or `cashflow` should suspend auto-hide
- returning to `search` or `clip` should resume normal auto-hide
- existing temporary native-interaction suspension should continue to work on top of this shared panel-level rule

This keeps one source of truth for blur-hiding and avoids mode-specific hacks in the main process.

## Error Handling

If the preload bridge call for `setAutoHideSuspended(...)` fails, the renderer should keep its current best-effort behavior and avoid crashing. That matches the existing defensive pattern.

## Test Strategy

Add coverage in this order:

1. source-level regression proving panel modes suspend blur auto-hide and search/clip resume it
2. `pnpm run build`
3. targeted `node dist/test/...` checks
4. one focused Electron smoke proving a panel remains open after a deliberate outside-focus step

## Success Criteria

This work is successful when:

- plugin panels no longer disappear on blur
- settings no longer disappears on blur
- cashflow no longer disappears on blur
- `Esc` and explicit exit flows still work
- search and clipboard keep existing blur-hide behavior
