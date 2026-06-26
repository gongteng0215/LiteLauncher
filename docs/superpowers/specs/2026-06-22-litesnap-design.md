# LiteLauncher LiteSnap Design

## Goal

Add a built-in `LiteSnap` plugin to LiteLauncher that delivers a smooth first version of screenshot, basic annotation, copy, save, and screen pinning on Windows, while keeping the architecture ready for future macOS support.

## Scope

This design covers:

- a built-in `LiteSnap` plugin entry inside the existing LiteLauncher plugin system
- Snipaste-style default global shortcuts for the first version
- a dedicated screenshot overlay window flow
- a dedicated pinned-image window flow
- basic annotation tools for screenshots
- LiteSnap settings inside LiteLauncher
- command entry points such as `snap`, `pin`, and `snap settings`

This design does not cover:

- screenshot history in the first version
- OCR in the first version
- color picker in the first version
- long screenshot / scrolling capture
- recording or video capture
- a full image editor or multi-layer editing system

## Product Decision

LiteSnap should be implemented as a LiteLauncher built-in plugin with two dedicated window systems behind it:

1. a screenshot overlay window for capture and annotation
2. one or more pin windows for floating pasted screenshots

The launcher main window should act as the control hub, not as the screenshot canvas itself.

This keeps the plugin integrated with LiteLauncher while avoiding tight coupling between the launcher shell, screenshot interaction, and pinned desktop windows.

## First Version Boundaries

The first version should ship the following user-visible behavior:

1. `F1` starts screenshot capture
2. user drags to select an area
3. the selected image can be annotated with:
   - rectangle
   - arrow
   - freehand pen
   - text
   - undo
4. the result can be:
   - copied
   - saved
   - pinned to the screen
5. `F3` pins the current clipboard image to the screen
6. LiteLauncher exposes a LiteSnap plugin panel and LiteSnap settings

The first version should not include screenshot history yet. History should remain a planned next step so the first milestone stays focused on capture and pinning smoothness.

## Platform Strategy

The implementation should be architected for cross-platform extension, but the first version should treat Windows as the primary supported environment and validation target.

That means:

- Windows is the release acceptance target
- data structures, IPC, and services should avoid Windows-only assumptions where reasonable
- macOS support can be added later without redesigning the public LiteSnap model

## Current Codebase Fit

LiteLauncher already has a stable built-in plugin system and already separates:

- main-process plugin execution
- renderer plugin panel presentation
- shared types and command payloads

It also already has clipboard-related image handling through `clipboard-workbench`, which makes LiteSnap a natural extension instead of a disconnected subsystem.

The design should therefore follow the existing project direction:

- add a new built-in plugin under `src/main/plugins`
- keep launcher-panel UI integration inside `src/renderer/plugin-panel-impls.ts`
- place heavy screenshot and pin-window behavior in dedicated LiteSnap modules instead of growing the launcher shell

## Architecture

LiteSnap should be split into four layers.

### Shared Layer

Recommended location:

- `src/shared/litesnap/*`

Responsibilities:

- settings types
- command enums and action payloads
- capture session states
- annotation model types
- pin window metadata
- shared constants and default shortcuts

This layer should be the single source of truth for all cross-process contracts.

### Main LiteSnap Runtime

Recommended location:

- `src/main/litesnap/*`

Responsibilities:

- global shortcut registration
- capture session lifecycle
- screenshot overlay window creation and cleanup
- pin window creation and lifecycle management
- image temp-file handling and save logic
- future extension points for history / OCR / color picker

Recommended modules:

- `shortcut-service.ts`
- `capture-session-manager.ts`
- `overlay-window.ts`
- `pin-window-manager.ts`
- `image-store.ts`
- `settings-store.ts`
- `capture-ipc.ts`

### Plugin Integration Layer

Recommended location:

- `src/main/plugins/litesnap/*`

Responsibilities:

- register `LiteSnap` as a built-in plugin
- expose command aliases such as `snap`, `pin`, and `snap settings`
- open the LiteSnap plugin panel in the launcher window
- delegate actions to the main LiteSnap runtime

This layer should look and behave like the existing built-in plugins, not like a separate desktop app.

### Renderer Layer

Recommended locations:

- `src/renderer/plugin-panel-impls.ts`
- `src/renderer/litesnap/*`

Responsibilities:

- LiteSnap plugin panel inside the launcher shell
- screenshot overlay renderer
- annotation toolbar rendering
- annotation canvas interaction
- pin window renderer

Important rule:

The launcher renderer should only host the LiteSnap panel shell. The screenshot overlay and pin window UI should live in dedicated LiteSnap renderer files instead of being mixed back into the main launcher renderer flow.

## User Flows

### Flow 1: Screenshot -> Copy / Save / Pin

1. User presses `F1`
2. Main process starts a LiteSnap capture session
3. A full-screen overlay window opens
4. User drags to select an area
5. Overlay shows the selection size
6. On mouse release, a floating toolbar appears near the selection
7. User may annotate
8. User chooses:
   - copy
   - save
   - pin
9. Session closes and returns to idle

### Flow 2: Clipboard Image -> Pin

1. User copies an image
2. User presses `F3`
3. LiteSnap reads the clipboard image
4. A pin window is created immediately
5. User can move, scale, copy, or close the pin

### Flow 3: Launcher Command Entry

1. User opens LiteLauncher
2. User types:
   - `snap`
   - `pin`
   - `snap settings`
3. LiteLauncher triggers the corresponding LiteSnap action or opens the LiteSnap panel

## Interaction Model

The screenshot session should use a compact state machine:

- `idle`
- `selecting`
- `ready`
- `annotating`

Definitions:

- `idle`: no active screenshot session
- `selecting`: user is dragging the selection box
- `ready`: selection exists and toolbar is visible
- `annotating`: user is actively using one of the annotation tools

Session completion rules:

- `Esc` exits the session from any active screenshot state
- copy, save, and pin all terminate the current session
- cancel also terminates the current session

## Shortcut Policy

The first version should default to Snipaste-compatible entry keys:

- `F1`: start screenshot capture
- `F3`: pin clipboard image

During screenshot interaction:

- `Esc`: cancel and close
- `Ctrl+Z`: undo the latest annotation
- double-click inside a valid selection: confirm the selection state

For pin windows:

- drag: move
- mouse wheel: scale
- double-click: copy the pinned image
- `Esc`: close the focused pin window

The first version should avoid overloading many tool-specific keyboard shortcuts until the core capture loop is stable.

## Annotation Scope

First-version annotation tools:

- rectangle
- arrow
- pen
- text
- undo

Recommended implementation rule:

All annotations should be stored as lightweight draw operations on top of the captured bitmap, then flattened only when the user performs copy, save, or pin.

This keeps undo straightforward and avoids repeatedly rewriting image buffers during live editing.

Text annotation requirement:

- must support Chinese input correctly
- should use a temporary editable input layer before flattening to canvas

## Pin Window Rules

Pin windows should be independent desktop-level windows managed by a dedicated main-process service.

First-version behavior:

- always on top by default
- frameless
- transparent-capable shell
- draggable
- resizable by scale interaction
- closable individually
- support multiple simultaneous pins

The first version should prioritize:

- create
- move
- scale
- copy
- close

Opacity control and rich right-click menus may be prepared in the model, but they do not need to be first-batch implementation blockers.

## Settings Design

LiteSnap should have a dedicated settings section inside LiteLauncher.

First-version settings should include:

- screenshot shortcut
- pin shortcut
- default save directory
- save format: `png` or `jpg`
- default post-capture behavior:
  - show toolbar
  - auto copy
  - auto save
  - auto pin
- default annotation color
- default line width
- default text size

The settings panel should not depend on screenshot history existing yet.

## Data and File Handling

The first version should support temporary capture artifacts and user-requested saved files.

Suggested storage split:

- temp capture files for active sessions and pins
- user save output for persistent screenshots

Suggested directories:

- temp: app data temp area under LiteLauncher
- saved output: configurable directory, defaulting to a LiteSnap screenshot folder

Suggested file naming:

- `LiteSnap_yyyyMMdd_HHmmss.png`

The first version does not need SQLite-backed history records yet, but `image-store.ts` should be written so history can later attach metadata without changing the capture flow API.

## IPC Design

LiteSnap should not be folded into the already-large generic IPC registration flow as inline ad hoc handlers. It should add dedicated LiteSnap registration functions and channel definitions.

Suggested IPC groups:

- start capture
- cancel capture
- commit capture result
- create pin from image
- create pin from clipboard
- close pin
- list active pins
- read settings
- write settings

Key design rule:

IPC should move typed image references or temp-file references where possible, instead of pushing large raw image payloads through every renderer round-trip.

## Error Handling

Expected failure cases:

1. screenshot shortcut registration fails
2. clipboard has no image when `F3` is pressed
3. save path is unavailable
4. overlay window fails to initialize
5. pin window creation fails
6. image temp file is missing or corrupt

User-facing behavior:

- shortcut registration failure should surface in settings diagnostics
- clipboard pin failure should show a short clear message such as “当前剪贴板没有图片”
- save failure should not destroy the active capture immediately; user should be able to retry
- renderer-side failures must not crash the launcher shell

Privacy and safety rules:

- all screenshot and pin data stays local by default
- no screenshot content is written to logs
- OCR or cloud upload is not part of the first version

## Testing Strategy

Recommended verification order:

1. source-level regression tests for:
   - LiteSnap plugin registration
   - LiteSnap shared type / command contracts
   - panel integration boundaries
2. `pnpm run build`
3. focused `node dist/test/...` checks for:
   - shortcut registration
   - command dispatch
   - image save flow
   - pin window lifecycle
4. targeted Electron smoke for:
   - `F1` capture entry
   - area selection
   - copy result
   - save result
   - pin creation
   - `F3` clipboard pin

The first version should avoid broad repeated end-to-end runs during iteration. Focused smoke coverage is enough until the feature batch is ready.

## Milestones

### Milestone 1: Capture Base

- register `F1`
- launch overlay window
- drag-select area
- show selection size
- copy and save selected image

### Milestone 2: Pin Base

- register `F3`
- create pin from clipboard image
- create pin from capture result
- move, scale, and close pins

### Milestone 3: Annotation Base

- rectangle
- arrow
- pen
- text
- undo

### Milestone 4: LiteLauncher Integration

- plugin entry
- launcher panel shell
- command aliases
- settings section

## Success Criteria

This design is successful when:

- `F1` reliably enters screenshot mode on Windows
- capture selection is visually accurate under common DPI settings
- copy works into normal Windows apps
- save works with the configured default directory
- pin windows open quickly and stay independently usable
- rectangle, arrow, pen, text, and undo all affect the final copied/saved/pinned image
- LiteSnap is integrated into LiteLauncher as a built-in plugin rather than a detached side app
- the implementation boundary does not push screenshot and pin logic back into the launcher shell
