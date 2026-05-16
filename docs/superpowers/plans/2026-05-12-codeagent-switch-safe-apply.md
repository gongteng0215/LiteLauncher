# CodeAgent Switch Safe Apply Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make CodeAgent Switch support Profile-based diff preview and backup-first safe writes for Codex `config.toml`.

**Architecture:** Shared code owns TOML parsing, managed-field rewriting, and text diff creation. The main plugin owns file-system safety: read, preview, backup, write temp file, validate, replace, and reopen panel. Renderer code stays thin and only sends actions, displays selected Profile state, diff, backup path, and copy feedback.

**Tech Stack:** TypeScript, Node `fs/path/os`, Electron plugin command flow, Node test runner.

---

### Task 1: Shared TOML Switch Planner

**Files:**
- Modify: `src/shared/codeagent-switch.ts`
- Test: `src/test/codeagent-switch-parser.test.ts`

- [x] Add failing tests for applying a Profile to top-level managed fields while preserving comments, unknown tables, and provider blocks.
- [x] Add failing tests for creating a compact line diff that never includes environment variable values.
- [x] Implement `buildCodeAgentSwitchProfilePreview()` with validation for missing Profile and missing Provider.
- [x] Re-run parser tests.

### Task 2: Main Plugin Preview And Apply

**Files:**
- Modify: `src/main/plugins/codeagent-switch/index.ts`
- Test: `src/test/codeagent-switch-plugin.test.ts`

- [x] Add failing tests for `action=preview&profile=<id>` returning diff without writing the file.
- [x] Add failing tests for `action=apply&profile=<id>` creating a backup, validating written TOML, replacing the config, and returning refreshed panel data.
- [x] Implement command parsing for `profile`.
- [x] Implement backup paths under a temp/user-data style base, overridable in tests.
- [x] Re-run plugin tests.

### Task 3: Renderer Panel Interaction

**Files:**
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/renderer.ts`
- Modify: `src/renderer/styles.css`
- Test: `src/test/plugin-panel-impls-regression.test.ts`

- [x] Add Profile action buttons for preview/apply.
- [x] Add copy buttons for env commands, diagnostics, and diff with visible status feedback.
- [x] Show selected Profile, preview status, diff, and backup path.
- [x] Keep Enter behavior mapped to refresh/read.

### Task 4: Docs And Regression

**Files:**
- Modify: `README.md`
- Modify: `docs/work.md`
- Modify: `docs/CodeAgent_Switch_PRD.md`
- Modify: `package.json` only if tests need new entry points.

- [x] Update docs to reflect preview/apply availability and remaining backup restore work.
- [x] Run lightweight regression (`pnpm run test:regression`) once at the end.

### Task 5: Backup List And Restore

**Files:**
- Modify: `src/main/plugins/codeagent-switch/index.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/styles.css`
- Test: `src/test/codeagent-switch-plugin.test.ts`
- Test: `src/test/plugin-panel-impls-regression.test.ts`

- [x] Add failing tests for `action=backups` returning backup entries sorted newest first.
- [x] Add failing tests for `action=restore&backup=<backup-id>` restoring a plugin-owned backup and creating a pre-restore backup.
- [x] Implement backup listing and restore path validation.
- [x] Render backup entries with restore buttons and clear status copy.
- [x] Update docs to mark backup list/restore as available.
- [x] Re-run lightweight regression.
