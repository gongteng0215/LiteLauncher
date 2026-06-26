# CodeAgent Root Full Config Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the CodeAgent Switch Root preview show the full saved `config.toml` and align the `save-runtime` command with full Root config writes instead of runtime-only fields.

**Architecture:** Keep the existing CodeAgent Switch panel structure, but change the Root editor flow so its preview source is the full computed TOML after applying Root form fields. Reuse shared TOML update logic in the main process, then let the renderer consume the resulting full-source preview while preserving the separate profile switch diff preview.

**Tech Stack:** TypeScript, Electron main/renderer plugin code, Node test runner, source-regression tests

---

## File Structure

- Modify: `src/test/codeagent-switch-plugin.test.ts`
  - Tighten the contract for `save-runtime` and read/open payloads so Root preview semantics are explicitly full-config based.
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
  - Lock in the updated Root preview copy and Root-saving UI wording.
- Modify: `src/main/plugins/codeagent-switch/index.ts`
  - Parse full Root save params, compute/save full Root config, and send full preview source in panel payloads.
- Modify: `src/renderer/plugin-panel-impls.ts`
  - Update Root section wording and bind its preview display to the full computed `config.toml`.

### Task 1: Lock the new contract with failing tests

**Files:**
- Modify: `src/test/codeagent-switch-plugin.test.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Add failing plugin contract expectations**

Update the existing Root/save-runtime expectations so they require full-config preview semantics:

- read/open payload still includes `configSource`
- Root preview-facing field must match full saved TOML expectations
- `save-runtime` must preserve and return full-config output, not only top-level Root snippets

- [ ] **Step 2: Add failing renderer source expectations**

Update the source regression assertions so the Root section wording clearly communicates:

- full `config.toml`
- save-after-edit semantics
- distinction from switch preview

- [ ] **Step 3: Run targeted test to verify red**

Run:
```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/codeagent-switch-plugin.test.js
```

Expected: FAIL on the new Root preview / `save-runtime` assertions.

### Task 2: Align main-process Root save behavior

**Files:**
- Modify: `src/main/plugins/codeagent-switch/index.ts`

- [ ] **Step 1: Extend command parsing for full Root fields**

Make `parseCommand(...)` read the Root-oriented fields already expected by tests, including model/provider/runtime/history/clear-field values.

- [ ] **Step 2: Reuse shared TOML Root updater**

Route `save-runtime` through the full Root config writer so the saved file and returned panel data reflect the full `config.toml` after applying Root edits.

- [ ] **Step 3: Return full preview source to the panel**

Ensure panel payloads expose the full saved config source the renderer should display for Root preview.

- [ ] **Step 4: Run targeted test to verify green**

Run:
```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/codeagent-switch-plugin.test.js
```

Expected: PASS.

### Task 3: Update renderer preview wording and binding

**Files:**
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Point Root preview at full config source**

Render the Root preview area from the full computed/saved `config.toml` source rather than only Root top-level fields.

- [ ] **Step 2: Refresh Root copy**

Adjust labels/status text/buttons so Root editing reads as full config management, while the switch preview remains diff-first.

- [ ] **Step 3: Run targeted renderer regression**

Run:
```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js
```

Expected: PASS.

### Task 4: Final sequential verification

**Files:**
- Modify: none

- [ ] **Step 1: Run sequential verification**

Run:
```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/codeagent-switch-plugin.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js
```

Expected: build succeeds, then both dist tests pass.

- [ ] **Step 2: Check working tree**

Run:
```powershell
git status --short
```

Expected: only the intended CodeAgent Switch files plus pre-existing unrelated dirty files.
