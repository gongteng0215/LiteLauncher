# Panel Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Keep `plugin` / `settings` / `cashflow` panels visible on blur and require explicit user exit.

**Architecture:** Reuse the existing auto-hide suspension bridge instead of adding a separate persistence system. The renderer will toggle shared blur-hide suspension based on the active mode, while focused regressions and smoke tests prove panel modes stay open and search mode behavior remains unchanged.

**Tech Stack:** Electron, TypeScript, existing renderer mode management, Playwright E2E smoke tests

---

## File Structure

- Create: `docs/superpowers/specs/2026-06-18-panel-persistence-design.md`
- Create: `docs/superpowers/plans/2026-06-18-panel-persistence-implementation.md`
- Modify: `src/renderer/renderer.ts`
- Modify: `src/test/renderer-*.test.ts` or a focused new source regression
- Modify: `src/test/e2e-*.test.ts` for one focused persistence smoke
- Modify: `docs/work.md`
- Modify: `TASKS_LiteLauncher.md`

### Task 1: Lock the expected mode behavior in source-level tests

**Files:**
- Modify: `src/test/renderer-error-log-source.test.ts` or create a focused new renderer source regression

- [ ] **Step 1: Write the failing source regression**

- [ ] **Step 2: Run it to confirm it fails against current behavior**

- [ ] **Step 3: Assert the renderer suspends auto-hide for `plugin`, `settings`, and `cashflow`**

- [ ] **Step 4: Assert the renderer resumes normal auto-hide for `search` and `clip`**

### Task 2: Implement shared panel persistence in the renderer

**Files:**
- Modify: `src/renderer/renderer.ts`

- [ ] **Step 1: Add a small mode-based helper for blur-hide suspension**

- [ ] **Step 2: Call it from the mode transition path**

- [ ] **Step 3: Keep existing native-interaction suspension compatible with the new shared rule**

- [ ] **Step 4: Re-run the source regression until it passes**

### Task 3: Prove the real window stays open on blur in panel modes

**Files:**
- Modify: `src/test/e2e-launcher-smoke.test.ts` or create a focused panel persistence smoke

- [ ] **Step 1: Write a failing smoke that opens one panel and deliberately blurs the launcher**

- [ ] **Step 2: Verify the panel mode remains active after blur**

- [ ] **Step 3: Verify `Esc` still exits the panel**

### Task 4: Run targeted verification and update docs

**Files:**
- Modify: `docs/work.md`
- Modify: `TASKS_LiteLauncher.md`

- [ ] **Step 1: Run `pnpm run build`**

- [ ] **Step 2: Run the targeted `node dist/test/...` regressions in sequence**

- [ ] **Step 3: Update work log and task list with the new panel persistence behavior**
