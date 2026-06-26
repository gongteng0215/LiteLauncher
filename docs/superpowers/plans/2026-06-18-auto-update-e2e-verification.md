# Auto Update E2E Verification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Verify the real Windows updater path from `v1.0.24` to `v1.0.25` and document the result.

**Architecture:** Use the published GitHub Release assets as the update source, run a real local downgrade/install to `v1.0.24`, then exercise the built-in updater and only change code if the manual verification reveals a concrete failure. Documentation is updated after the run so the repo keeps a reusable release-validation record.

**Tech Stack:** GitHub CLI, PowerShell, Electron app UI, existing updater code, existing targeted TypeScript regression tests

---

## File Structure

- Create: `docs/superpowers/specs/2026-06-18-auto-update-e2e-design.md`
- Create: `docs/superpowers/plans/2026-06-18-auto-update-e2e-verification.md`
- Modify: `docs/work.md`
- Modify if needed: `TASKS_LiteLauncher.md`
- Modify if needed: `src/main/app-updater.ts`
- Modify if needed: `src/renderer/renderer.ts`
- Modify if needed: `src/test/app-updater-source.test.ts`

### Task 1: Prepare the local verification baseline

**Files:**
- Modify: `docs/work.md`

- [ ] **Step 1: Create a temp directory for release verification assets**

Run:

```powershell
$verifyDir = Join-Path $env:TEMP "litelauncher-update-e2e"
New-Item -ItemType Directory -Force -Path $verifyDir
```

Expected: a reusable temp folder exists for installer downloads and notes.

- [ ] **Step 2: Download the published `v1.0.24` NSIS installer**

Run:

```powershell
gh release download v1.0.24 -p LiteLauncher-Setup-1.0.24.exe -D $verifyDir
```

Expected: `LiteLauncher-Setup-1.0.24.exe` exists in the temp folder.

- [ ] **Step 3: Inspect current install state before changing anything**

Run:

```powershell
Get-ItemProperty HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\* |
  Where-Object { $_.DisplayName -like "LiteLauncher*" } |
  Select-Object DisplayName, DisplayVersion, InstallLocation
```

Expected: current local install state is visible so the verification notes can distinguish clean install from downgrade-overwrite.

### Task 2: Run the real updater journey

**Files:**
- Modify: `docs/work.md`
- Modify if needed: `TASKS_LiteLauncher.md`

- [ ] **Step 1: Install `v1.0.24` from the downloaded NSIS package**

Run:

```powershell
Start-Process -FilePath (Join-Path $verifyDir "LiteLauncher-Setup-1.0.24.exe")
```

Expected: the installer launches and finishes with LiteLauncher installed as `v1.0.24`.

- [ ] **Step 2: Launch the installed app and capture the displayed current version**

Run:

```powershell
Start-Process -FilePath "$env:LOCALAPPDATA\\Programs\\LiteLauncher\\LiteLauncher.exe"
```

Expected: the app opens and Settings shows current version `v1.0.24`.

- [ ] **Step 3: Trigger a manual update check and observe the transition states**

Manual checklist:

```text
Open Settings -> click "检查更新" -> watch for:
- checking state
- target version changes to v1.0.25
- release notes render
- download progress or downloaded-ready status
```

Expected: the app discovers `v1.0.25` and reaches the downloaded-ready state.

- [ ] **Step 4: Quit the app to allow install-on-quit to run**

Manual checklist:

```text
Close LiteLauncher completely after the update shows downloaded-ready.
Wait for the updater installer handoff to finish.
```

Expected: the app exits and the updater applies the downloaded package.

- [ ] **Step 5: Relaunch and confirm the installed version**

Run:

```powershell
Start-Process -FilePath "$env:LOCALAPPDATA\\Programs\\LiteLauncher\\LiteLauncher.exe"
```

Expected: the relaunched app reports `v1.0.25`.

### Task 3: Fix or harden only if the real run fails

**Files:**
- Modify if needed: `src/main/app-updater.ts`
- Modify if needed: `src/renderer/renderer.ts`
- Modify if needed: `src/test/app-updater-source.test.ts`

- [ ] **Step 1: Capture the exact failing updater stage before changing code**

Run:

```powershell
rg -n "update|updater|install|download" src\\main src\\renderer src\\test
```

Expected: the failing stage is mapped to the relevant source area before edits begin.

- [ ] **Step 2: Add the smallest targeted fix**

Implementation rule:

```text
Only touch updater discovery, status rendering, or install handoff code that directly explains the observed failure.
Do not widen scope into unrelated settings or release workflow changes.
```

Expected: the fix stays narrow and tied to observed evidence.

- [ ] **Step 3: Add or tighten one targeted regression**

Run after the fix:

```powershell
pnpm run build
node dist/test/app-updater-source.test.js
```

Expected: the targeted updater regression passes after the minimal fix.

### Task 4: Record the result and close the loop

**Files:**
- Modify: `docs/work.md`
- Modify if needed: `TASKS_LiteLauncher.md`

- [ ] **Step 1: Write the verification result into project notes**

Update:

```text
docs/work.md
```

Expected: the repo clearly states whether `v1.0.24 -> v1.0.25` auto-update passed or failed, and where it failed if not.

- [ ] **Step 2: Update task status for `LL-404` based on the real run**

Update:

```text
TASKS_LiteLauncher.md
```

Expected: `LL-404` reflects the new real-world validation status instead of staying vague.

- [ ] **Step 3: Run final verification for any code or doc changes made during this task**

Run:

```powershell
pnpm run check:encoding
```

Expected: the final notes or code changes remain encoding-clean.
