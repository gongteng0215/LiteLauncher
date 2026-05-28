# Renderer Plugin State Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Continue shrinking `src/renderer/renderer.ts` by extracting the remaining plugin panel state and helper logic into focused modules without changing current plugin behavior.

**Architecture:** Keep the existing runtime contract stable. Continue the already-established split where plugin render/apply logic lives in `plugin-panel-impls.ts` or shared helpers, while `renderer.ts` becomes a thinner orchestration shell. Extract by plugin family in small batches so each batch can be verified with source regression and build before touching the next one.

**Tech Stack:** TypeScript, Electron renderer, existing `panelImplsSafe` panel registry, Node-based regression tests, `pnpm run build`.

---

## Scope

This plan covers the remaining renderer-held state and helpers called out in `docs/work.md`:

- `Colors`
- `Strings`
- `Password`
- `JWT`
- `Crypto`
- `Diff`
- `Timestamp`
- `URL`
- `Clipboard`
- `Cashflow`

Already-extracted plugin families such as Cron / ImageBase64 / ImagePrompt / Config / SQL / Unit / Markdown / UA / API / HttpMock / QRCode / FileHash / PortHelper are out of scope except where their patterns should be followed.

## File Structure

- Modify: `src/renderer/renderer.ts`
  - Remove plugin-specific state / helper ownership batch by batch and keep only orchestration wiring.
- Modify: `src/renderer/plugin-panel-impls.ts`
  - Receive any remaining panel state accessors or helper entry points that still belong with panel implementations.
- Modify: `src/renderer/global.d.ts`
  - Sync any renderer-exposed helper signatures that move as part of the extraction.
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
  - Lock regression assertions that prevent migrated logic from flowing back into `renderer.ts`.
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`
  - Only when a batch touches a user-visible interaction that already has smoke coverage.
- Modify: `docs/work.md`
  - Update progress once a meaningful batch lands.

## Guardrails

- Keep behavior unchanged while moving code.
- Prefer existing extraction patterns already used by earlier batches.
- Do not reformat or reorganize unrelated renderer sections while extracting.
- Verify each batch with source regression and `pnpm run build` before moving to the next one.
- Only run smoke at the end of a related visible batch or when the touched area already has targeted smoke coverage that materially reduces risk.

## Batch Outline

### Batch 1: Low-risk formatter / converter state

Target families:

- `Colors`
- `Strings`
- `Timestamp`
- `URL`
- `Diff`

Intent:

- Move remaining local state bags, cached DOM references, and formatter helpers out of `renderer.ts`
- Keep event wiring and panel open orchestration stable

Verification:

- `node dist/test/plugin-panel-impls-regression.test.js`
- `pnpm run build`

### Batch 2: Security / encoding tool state

Target families:

- `Password`
- `JWT`
- `Crypto`

Intent:

- Extract the last remaining generator / encoder state and action helpers
- Keep existing smoke-covered interactions stable

Verification:

- `node dist/test/plugin-panel-impls-regression.test.js`
- `pnpm run build`
- targeted smoke only if a covered flow changes

### Batch 3: Non-WebTools custom panel state

Target families:

- `Clipboard`
- `Cashflow`

Intent:

- Untangle remaining custom panel state that still keeps `renderer.ts` large
- Avoid feature expansion while moving code

Verification:

- source regression for new helper locations
- `pnpm run build`
- targeted smoke only if existing coverage already exercises the touched path

## Suggested Task Order

1. Re-scan `renderer.ts` for the exact remaining plugin-scoped state / helper blocks and map them to the three batches.
2. Add or extend source regression assertions that forbid the moved helper names from remaining in `renderer.ts`.
3. Extract Batch 1 with minimal signature churn.
4. Run regression + build.
5. Extract Batch 2 with the same pattern.
6. Run regression + build.
7. Extract Batch 3 carefully, especially around clipboard and cashflow shared UI helpers.
8. Run regression + build.
9. If any extracted batch touched a smoke-covered visible interaction, run the smallest justified smoke bundle at the end.
10. Update `docs/work.md` with the completed batch progress and new `renderer.ts` line count trend.

## Verification Commands

Primary iteration loop:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; exit $LASTEXITCODE
```

Optional targeted smoke at batch end:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

## Completion Criteria

This plan is considered complete when:

1. The listed remaining plugin families no longer own substantial state / helper blocks inside `src/renderer/renderer.ts`.
2. `renderer.ts` is measurably smaller than the current ~9,049-line baseline.
3. Source regression prevents obvious helper / wrapper backflow.
4. `pnpm run build` passes after each landed batch.
5. `docs/work.md` reflects the new extraction progress and remaining tail, if any.
