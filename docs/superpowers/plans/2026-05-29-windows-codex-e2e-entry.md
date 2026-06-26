# Windows Codex E2E Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated npm script and documentation reference for the Windows Store Codex real-machine regression without making the default smoke flow heavier.

**Architecture:** Keep the existing regression test file unchanged and expose it through a new `package.json` script that follows the repo's build-then-dist-test pattern. Update `docs/work.md` so the new entrypoint is visible both in the recent work log and the current baseline command list.

**Tech Stack:** TypeScript/Electron repo scripts, npm package scripts, Markdown docs

---

## File Structure

- Modify: `package.json`
  - Add a dedicated `test:e2e:windows-codex` script next to the existing regression and smoke entries.
- Modify: `docs/work.md`
  - Add a baseline command reference for the new Windows Codex regression entrypoint.
- Reference only: `src/test/e2e-windows-codex-regression.test.ts`
  - Existing targeted regression that the new script should execute.

### Task 1: Expose the dedicated script entry

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Add the script entry**

Add this script in the existing `scripts` block near the other E2E commands:

```json
"test:e2e:windows-codex": "pnpm run build && node dist/test/e2e-windows-codex-regression.test.js"
```

- [ ] **Step 2: Verify the script definition is present**

Run: `rg -n "\"test:e2e:windows-codex\"" package.json`  
Expected: one match showing the exact new script key.

### Task 2: Document the entrypoint

**Files:**
- Modify: `docs/work.md`

- [ ] **Step 1: Add a baseline command bullet**

Add a short bullet in the current baseline section describing the new script:

```md
- Windows Store Codex 真机回归：`pnpm run test:e2e:windows-codex`
```

- [ ] **Step 2: Verify the doc reference exists**

Run: `rg -n "Windows Store Codex 真机回归|test:e2e:windows-codex" docs/work.md`  
Expected: matches for the new baseline bullet and the recent-work note.

### Task 3: Run the scripted entry

**Files:**
- Modify: none

- [ ] **Step 1: Run the dedicated script**

Run: `pnpm run test:e2e:windows-codex`  
Expected: build succeeds, the Electron regression runs, and the TAP summary reports one passing test with zero failures.

- [ ] **Step 2: Check the working tree**

Run: `git status --short`  
Expected: only the intended doc/script/test-entry changes appear, plus any known untracked local files such as `AGENTS.md` / `CLAUDE.md`.
