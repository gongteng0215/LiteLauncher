# CodeAgent Switch Config Manager Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Upgrade CodeAgent Switch from read/preview/apply into a Codex-first configuration manager with current-state marking, provider/profile CRUD, editable env key names, and multi-tool navigation placeholders.

**Latest UX decision:** Provider env key names are no longer manually edited. New providers prefill a non-conflicting ID, derive a display name, and derive `CODEAGENT_<PROVIDER>_API_KEY`; users can temporarily paste an API Key and write it directly to the Windows user environment, with copy-command kept as a fallback. Profile switching must be obvious from both the list row and the selected detail hero via “预览 / 设为当前”.

**Architecture:** Keep Codex logic in the existing shared module so main and renderer use the same parsed model. Main-process commands perform backup, temp write, validation, and replace for every write action. Renderer stays a compact tool panel with Codex enabled and Claude/Gemini shown as planned adapters.

**Tech Stack:** Electron main/renderer TypeScript, LiteLauncher plugin command protocol, Node test runner, existing CSS panel system.

---

### Task 1: Shared Codex Config Model

**Files:**
- Modify: `src/shared/codeagent-switch.ts`
- Test: `src/test/codeagent-switch-parser.test.ts`

- [x] Add tests for active provider/profile summary.
- [x] Add tests for provider upsert preserving unknown TOML tables.
- [x] Add tests for profile upsert preserving unknown TOML tables.
- [x] Add tests for delete validation, including blocking active providers and referenced providers.
- [x] Implement pure functions for summary, upsert, and delete.

### Task 2: Plugin Write Commands

**Files:**
- Modify: `src/main/plugins/codeagent-switch/index.ts`
- Test: `src/test/codeagent-switch-plugin.test.ts`

- [x] Add `save-provider`, `delete-provider`, `save-profile`, and `delete-profile` command tests.
- [x] Implement command parsing for Codex write actions.
- [x] Reuse the existing safe-write flow: backup, temp file, parse validation, replace.
- [x] Return updated panel data, active summary, and action flags.

### Task 3: Renderer Config Manager UI

**Files:**
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/styles.css`

- [x] Add tool tabs for Codex, Claude Code, and Gemini CLI.
- [x] Show active provider/profile/current model summary.
- [x] Add provider add/edit/delete controls with env key name editing.
- [x] Add profile add/edit/delete controls.
- [x] Highlight active provider and exact/partial active profile matches.
- [x] Support quoted/non-ASCII profile ids such as `[profiles."淘宝1"]` and keep active matching stable when optional fields are omitted.
- [x] Move Provider/Profile editing into a master-detail UI: compact list on the left, selected detail editor on the right.
- [x] Remove the old inline-editor list path and unreachable legacy renderer so only the master-detail detail editor remains.
- [x] Redesign the panel closer to cc switch: fixed-width tool sidebar, Profile-first middle list, compact Provider strip, and grouped right-side detail sections.
- [x] Move preview, diagnostics, backups, environment commands, primary switch actions, and delete actions into the selected detail page instead of loose bottom sections.
- [x] Add source regression assertions for the new shell/sidebar/profile-list/provider-strip/detail-section structure and fixed tool-button sizing.
- [x] Add a scan-friendly current-config card, read-only detail overview grids, and explicit selected/active badges for list rows and Provider chips.
- [x] Make switching visible from each Profile row with preview/apply actions, and derive Provider env_key names automatically while keeping API Key values copy-only and unpersisted.
- [x] Move the primary switch action into the Profile detail hero, with “设为当前” disabled as “当前配置” for the active profile.
- [x] Split Provider Key setup into a dedicated section, auto-generate Provider ID/name/env key names, and keep key-copy feedback separate from generic env command feedback.
- [x] Add a `set-provider-key` plugin command that writes API keys to Windows user environment variables, syncs `process.env`, and leaves `config.toml` unchanged.
- [x] Switch Codex using only top-level `profile = "<profile-id>"`, clean duplicated root model fields, and keep Provider/model/reasoning values in `[profiles.xxx]` templates.
- [x] Add regression coverage for Chinese Provider/Profile names so UTF-8 values such as `淘宝1` and `银河` survive preview/apply flows.
- [x] Add official Codex advanced Provider fields: `env_key_instructions`, `supports_websockets`, `http_headers`, `env_http_headers`, and `query_params`.
- [x] Add official Codex advanced Profile fields: `plan_mode_reasoning_effort`, `model_reasoning_summary`, `model_verbosity`, `service_tier`, and `web_search`.
- [x] Add a runtime permissions detail section for `approval_policy`, `sandbox_mode`, `default_permissions`, `network_access`, and `[windows] sandbox / sandbox_private_desktop`.

### Task 4: Documentation And Verification

**Files:**
- Modify: `README.md`
- Modify: `docs/work.md`
- Modify: `docs/CodeAgent_Switch_PRD.md`
- Modify: `docs/superpowers/plans/2026-05-12-codeagent-switch-config-manager.md`

- [x] Update docs with completed CRUD, multi-tool placeholder scope, and official Codex advanced/runtime fields.
- [x] Run targeted parser and plugin tests during development.
- [x] Run `pnpm run test:regression` before completion.
- [x] Do not run Electron smoke unless explicitly requested.
