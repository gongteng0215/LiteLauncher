# LiteSnap Overlay Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the temporary OS snipping handoff with a LiteSnap-owned adjustable capture overlay plus `copy / save / pin / cancel` actions.

**Architecture:** Keep the launcher as the entry point, but move the live capture experience into a dedicated LiteSnap overlay window and renderer. The main process owns screenshot capture, result commit, clipboard/save/pin side effects, and overlay lifecycle.

**Tech Stack:** Electron `BrowserWindow`, Electron clipboard/nativeImage helpers, TypeScript, preload + IPC bridge, vanilla renderer overlay, existing LiteSnap settings/runtime modules

---

## File Structure

- Create: `src/main/litesnap/overlay-window.ts`
- Create: `src/renderer/litesnap-overlay.ts`
- Create: `src/renderer/litesnap-overlay.html`
- Create: `src/renderer/litesnap-overlay.css`
- Modify: `scripts/copy-assets.cjs`
- Modify: `src/shared/channels.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/global.d.ts`
- Modify: `src/main/litesnap/capture-session-manager.ts`
- Modify: `src/main/litesnap/image-store.ts`
- Modify: `src/main/litesnap/pin-window-manager.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/test/litesnap-plugin-source.test.ts`

## Execution Order

1. lock the new overlay contract with failing source tests
2. add overlay page assets and asset-copy support
3. implement main-process overlay session + commit flow
4. implement overlay renderer selection UI and toolbar
5. wire `F1` and panel capture entry to the new session
6. run focused verification and manual smoke
