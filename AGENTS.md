# LiteLauncher Agent Notes

## Verification Strategy

- During iterative UI or panel work, avoid running full smoke / e2e flows repeatedly.
- Prefer this verification order while changes are still in motion:
  1. source-level regression checks for the touched area
  2. `pnpm run build`
  3. smoke / e2e only after a related batch is finished, before release, or when the user explicitly asks
- Batch related panel migrations together before running smoke so the user is not interrupted by repeated app launches.
- If a smoke run is truly needed before the end of a batch, keep it targeted and explain why first.
- When verification depends on `dist` output, do not run `pnpm run build` and `node dist/test/...` in parallel; build first, then run the `dist` tests sequentially to avoid stale-artifact false positives.

## Local Workflow

- When the user is actively reviewing UI changes, prefer `pnpm dev` and lightweight source checks over repeated Electron smoke runs.
- Use PowerShell command chains in the form `cmd; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; next-cmd`.
