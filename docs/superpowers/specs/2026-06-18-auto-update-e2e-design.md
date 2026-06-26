# LiteLauncher Auto Update E2E Verification Design

## Goal

Validate the real Windows NSIS upgrade path from `v1.0.24` to `v1.0.25` on a local machine, then capture the result so future releases can reuse the same verification flow.

## Scope

This design covers one concrete path only:

- download the published `v1.0.24` Windows NSIS installer from GitHub Releases
- install or downgrade the local app to `v1.0.24`
- trigger update discovery against the live `v1.0.25` release
- confirm download, install-on-quit behavior, and post-restart version state
- record the outcome and any failure details in project docs

This design does not include:

- new updater product features
- macOS auto-update verification
- a full new automation harness unless the manual run exposes a gap worth locking with tests

## Current Context

The repository already has:

- packaged update support in `src/main/app-updater.ts`
- settings UI for updater status and release notes in `src/renderer/renderer.ts`
- release asset validation in `scripts/verify-release-output.cjs`
- source-level updater scheduling coverage in `src/test/app-updater-source.test.ts`
- a live `v1.0.25` GitHub Release with `latest.yml`, `LiteLauncher-Setup-1.0.25.exe`, and companion assets

What is still missing is the real user journey proof that an installed `v1.0.24` NSIS build actually discovers and upgrades to `v1.0.25`.

## Recommended Approach

Use the published GitHub Release assets as the source of truth and run a real local upgrade instead of simulating metadata locally.

Why this approach:

- it validates the exact updater inputs that end users receive
- it covers the highest-risk step that static tests do not cover: installer handoff and restart upgrade
- it keeps scope tight and avoids inventing a one-off fake update server

## Execution Flow

1. Download `LiteLauncher-Setup-1.0.24.exe` from the published `v1.0.24` GitHub Release into a local temp verification directory.
2. Inspect the current machine state so we know whether LiteLauncher is already installed and which version is active.
3. Install `v1.0.24` with a repeatable local path.
4. Launch the installed app and confirm the app reports `v1.0.24`.
5. Trigger a manual update check from the app UI and observe:
   - whether `v1.0.25` is discovered
   - whether release notes load
   - whether download starts and reaches completion
6. Exit the app so the downloaded update can install.
7. Relaunch the installed app and confirm the version is now `v1.0.25`.
8. Record result, asset names, and any failure evidence in repo docs.

## Failure Handling

If the update path fails, the first goal is to capture exactly where it failed:

- discovery failure
- metadata parsing failure
- download failure
- install-on-quit failure
- version not updated after relaunch

If a failure is found, the follow-up implementation stays narrow:

- add only the minimum logging, status copy, or code fix needed to explain or correct the failure
- add or update a regression test only for the concrete behavior that broke
- rerun the same `v1.0.24 -> v1.0.25` verification path after the fix

## Environment Note

On this Windows machine, invoking the NSIS installer through PowerShell `Start-Process -ArgumentList` with `/D=...` produced a malformed install path and bad shortcuts. Calling the installer through `cmd /c "<installer>" /S /D=...` preserved the intended path and produced a valid `v1.0.24` install. The verification flow should use the `cmd /c` form for repeatable downgrade/setup on this machine.

## Success Criteria

This work is successful when all of the following are true:

- a local machine run starts from installed `v1.0.24`
- the app discovers live `v1.0.25`
- the download completes
- quitting the app installs the update
- relaunch shows `v1.0.25`
- the verification result is written down in project docs

## Test Strategy

Verification stays in this order:

1. real updater journey on Windows NSIS install
2. if code changes are needed, targeted source regression first
3. `pnpm run build`
4. matching `node dist/test/...` checks in sequence

This follows the repository rule to avoid stale `dist` false positives and avoids running broad Electron smoke flows unless the manual upgrade exposes a reason.
