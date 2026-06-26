# LiteSnap Overlay Design

## Goal

Replace the temporary Windows `ms-screenclip:` handoff with a first-party LiteSnap capture overlay that allows post-selection adjustment and direct `copy / save / pin / cancel` actions inside LiteLauncher.

## Scope

This batch adds:

- a dedicated LiteSnap overlay window on Windows
- drag-to-select capture for the display nearest the cursor
- post-selection adjustment with move and resize handles
- a floating toolbar with `copy`, `save`, `pin`, and `cancel`
- keyboard handling for `Enter` confirm and `Esc` cancel
- main-process commit handling that crops the captured bitmap and executes the selected action

This batch does not add:

- annotation tools
- screenshot history
- multi-display simultaneous overlays
- advanced pin interactions such as opacity, wheel zoom, or context menus

## Product Decision

LiteSnap should own the full capture loop instead of delegating to the OS snipping tool. The first useful milestone is not a full Snipaste clone. It is a stable adjustable selection flow with a small action toolbar.

## Architecture

The capture loop should be split into four parts:

1. `capture-session-manager.ts`
   Starts and tracks one active capture session, obtains a display screenshot, opens the overlay window, and routes commit/cancel events.

2. `overlay-window.ts`
   Creates the dedicated transparent fullscreen LiteSnap overlay `BrowserWindow` on the target display and loads the overlay renderer entry.

3. `litesnap-overlay.html` + `litesnap-overlay.ts`
   Renders the screenshot background, selection rectangle, resize handles, size readout, and toolbar. It owns only temporary UI state and sends normalized selection rectangles back to the main process.

4. `image-store.ts` + `pin-window-manager.ts`
   Convert a committed crop into the requested action:
   - `copy`: write image to clipboard
   - `save`: save image to the configured LiteSnap directory
   - `pin`: open a minimal pinned-image window

## Interaction Model

The first batch should support these states:

- `idle`
- `selecting`
- `ready`
- `moving`
- `resizing`

Behavior rules:

- dragging from empty space creates a selection
- dragging inside the existing selection moves it
- dragging a handle resizes it
- the size label updates live
- toolbar appears only when a valid selection exists
- `Enter` executes `copy`
- `Esc` closes the overlay without side effects

## Action Rules

- `copy`: crop the selected bitmap, write to clipboard, close overlay
- `save`: crop the bitmap, save to the LiteSnap default output path, close overlay
- `pin`: crop the bitmap, create a pinned image window, close overlay
- `cancel`: close overlay and discard selection

## Testing Strategy

This batch should rely on:

- source-level regression tests for new LiteSnap overlay modules, channels, and asset copying
- `pnpm run build`
- targeted `node dist/test/...` regressions for LiteSnap source contracts and panel integration
- one manual smoke pass after wiring completes:
  - `F1`
  - drag selection
  - adjust selection
  - copy
  - save
  - pin

## Success Criteria

This batch is complete when:

- `F1` opens LiteSnap’s own overlay instead of `ms-screenclip:`
- releasing the mouse does not end the flow immediately
- the user can continue adjusting the selection
- the toolbar actions work end-to-end
- the launcher shell remains stable if the overlay is cancelled or fails
