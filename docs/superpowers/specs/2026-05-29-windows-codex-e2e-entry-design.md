# Windows Codex E2E Entry Design

**Date:** 2026-05-29

**Status:** Approved for implementation

## Summary

Promote the new Windows Store `Codex` real-machine regression from an ad hoc command into a first-class repository entrypoint. The change should add a dedicated npm script, keep it separate from the existing smoke bundle, and document when to use it.

## Problem

The repository already has a targeted Electron regression for Windows Store `Codex`, but right now it is easiest to run only if you remember the exact `build + dist test` command. That makes the check harder to reuse during release prep, Windows-specific debugging, or regression confirmation after `Codex`-related fixes.

We do not want to solve this by folding the test into the normal smoke chain, because the user has explicitly asked to avoid making routine smoke runs heavier or more disruptive than necessary.

## Goals

1. Add a dedicated script entry for the Windows Store `Codex` real-machine regression.
2. Keep the existing `test:e2e:smoke` cadence unchanged.
3. Document the new entrypoint so it is easy to find later.
4. Re-verify the scripted entry once it is wired in.

## Non-Goals

- Do not add the new regression to `test:e2e:smoke`.
- Do not add the new regression to `test:regression` or `test:regression:full` in this pass.
- Do not broaden the test itself beyond the current search/pin/restart/unpin chain.
- Do not add CI automation for this Windows real-machine check.

## Design

### Script surface

Add a dedicated script in `package.json`:

- `test:e2e:windows-codex`

It should follow the repo's existing verification style:

- build first
- then run the compiled dist test

That keeps the command consistent with the other repo-level test entries and avoids stale `dist` artifacts.

### Documentation

Update `docs/work.md` in two places:

1. Keep the existing "recently completed" note about the new regression itself.
2. Add the new script to the current baseline / quick-reference section so future runs do not require remembering the raw `node dist/test/...` command.

### Verification

Run the new script entry directly:

- `pnpm run test:e2e:windows-codex`

Success means the script builds, launches the Electron shell, detects the locally installed Microsoft Store `Codex`, and passes the persistence check end to end.
