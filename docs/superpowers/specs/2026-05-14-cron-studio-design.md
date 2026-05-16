# Cron Studio Design

Date: 2026-05-14
Owner: Codex + User
Status: Approved for planning

## Summary

Upgrade the existing `webtools-cron` plugin from a loose parse-and-preview form into a compact `Cron Studio` workbench. The first version should serve mixed usage patterns: technical users who already know cron syntax, and general users who need templates and readable guidance.

The plugin should emphasize four outcomes at once:

1. A denser, more mature panel layout that does not stretch awkwardly on wide windows.
2. Faster cron creation through a two-layer template system.
3. Clearer parsing, readable explanations, and field-level feedback.
4. Better verification through upcoming-run previews and inline validation states.

The first version remains scoped to standard 5-field cron expressions (`minute hour day month weekday`).

## Goals

- Make the Cron plugin feel as polished and compact as the newer web tools.
- Support a mixed audience without forcing either template-only or syntax-only usage.
- Keep expression input, templates, field editing, and preview results fully synchronized.
- Improve error visibility so users can tell what is wrong and where it is wrong.
- Preserve the existing plugin architecture and execution flow where possible.

## Non-Goals

- No Quartz 6-field or 7-field support in this iteration.
- No saved templates, import/export, or history management.
- No task execution, shell integration, or scheduler runtime management.
- No provider-specific cron dialect switching in the first version.

## User Experience

### Primary experience

The panel becomes a compact workbench with four coordinated sections:

1. Top action bar
2. Template workspace
3. Field editor
4. Result workspace

Users should be able to start from any of these entry points:

- Type a cron expression directly.
- Click a common preset.
- Choose a parameterized template and fill a few controls.
- Adjust individual cron fields.

All entry points update the same underlying expression and trigger the same preview pipeline.

### Layout behavior

The layout should avoid the current stretched-form look. It should:

- Use a constrained content width within the plugin panel.
- Use a compact grid for the main content areas.
- Render as two columns on wider panels.
- Collapse to a single column when the available width is narrow.
- Keep buttons, field blocks, and result blocks visually dense and aligned.

The design target is a desktop utility feel rather than a large, sparse settings page.

## Information Architecture

### 1. Top action bar

This is the primary working row and stays visible at the top of the panel.

Contents:

- Cron expression input
- `校验` button
- `随机` button
- `复制` button

Directly below or within the same compact region:

- Parse status
- Readable explanation
- Next run time

The `校验` button triggers an immediate parse, while typing still uses debounced auto-parse.

The status area must support three states:

- `success`: readable explanation plus next run
- `warning`: readable explanation plus warning note
- `error`: concise error summary

The status copy should be short and immediate, not verbose.

### 2. Template workspace

Templates are split into two layers.

#### Layer A: quick presets

Single-click presets for high-frequency schedules:

- Every 5 minutes
- Every 15 minutes
- Every hour
- Every day at 09:00
- Weekdays at 09:00
- Every Monday at 09:00
- First day of month at 09:00
- Every month on day 15 at 09:00
- January 1st yearly

These should apply instantly and update the whole panel state.

#### Layer B: parameterized templates

A small template builder with scenario-specific controls:

- Interval task
- Daily task
- Weekly task
- Monthly task
- Workday task

Each template reveals only the controls needed for that scenario. Example:

- Weekly task: weekday + hour + minute
- Interval task: numeric interval + unit
- Monthly task: day-of-month + hour + minute

The template workspace should also show:

- Current template name
- Short human-readable summary
- Template fallback state (`自定义`) when the expression no longer matches a known template

### 3. Field editor

Replace the current mini table with five compact field blocks:

- Minute
- Hour
- Day
- Month
- Weekday

Each block contains:

- Field label
- Current field value input
- Short valid-range hint

The field editor should feel like a small structured control strip rather than a table.

If parsing detects a field-specific problem, the corresponding block is highlighted.

### 4. Result workspace

The result area presents validation and execution confidence.

Sections:

- Upcoming runs
- Syntax quick reference

Upcoming runs should list the next 7 runs, with:

- Date
- Weekday
- Time

The next immediate run may receive subtle emphasis.

Syntax help should be compressed into a small reference block, replacing the oversized table style.

## Interaction Model

### Shared state model

The panel should maintain explicit state for:

- `expression`
- `selectedTemplate`
- `fieldValues`
- `parseState`
- `resultState`
- `uiState`

Suggested meanings:

- `expression`: the canonical cron string shown in the top input
- `selectedTemplate`: matched quick preset or parameterized template key
- `fieldValues`: the five displayed cron fields
- `parseState`: success, warning, or error plus metadata
- `resultState`: readable description, next run, upcoming list
- `uiState`: copy feedback, active highlights, transient selection state

### Synchronization rules

The panel must preserve one-directional consistency across all entry points:

1. Expression edited:
   - parse
   - refresh field values
   - attempt template match
   - update preview
2. Template selected:
   - generate expression
   - parse
   - update field values
   - update preview
3. Field edited:
   - rebuild expression
   - parse
   - update template match
   - update preview

Failure behavior:

- Invalid expressions should remain visible in the input.
- The UI must not silently revert user input.
- Error state replaces success preview, but preserves as much contextual information as possible.

## Parsing and Feedback

### Parse output contract

The main-process plugin should keep returning current fields and add richer metadata so the renderer can stay declarative.

Expected data shape additions:

- `status`: `success | warning | error`
- `errorMessage`
- `errorField`
- `warnings`
- `templateKey`
- `templateSummary`
- `fieldMeta`

Existing fields remain:

- `expression`
- `readable`
- `nextRun`
- `upcoming`

### Human-readable descriptions

Readable output should prefer plain Chinese descriptions for common patterns, such as:

- Every N minutes
- Every hour at minute X
- Every weekday at HH:MM
- Monthly at day X, HH:MM

When a pattern is valid but too complex for a clean natural sentence, fall back to structured field phrasing instead of forcing awkward prose.

### Error handling

Error feedback should support:

- Wrong number of fields
- Invalid numeric ranges
- Invalid step values
- Unsupported weekday formats
- Empty field tokens

Error presentation should include:

- Top-level concise message
- Field-level highlight when identifiable
- Clear distinction between invalid syntax and merely unusual schedules

### Warning handling

Warnings are for valid but potentially surprising inputs, such as very high-frequency schedules or highly unusual combinations. Warnings should not block previews.

## Technical Design

### Main process

File: `src/main/plugins/webtools-cron/index.ts`

Changes:

- Keep `open`, `parse`, and `random` actions.
- Extend parsing helpers to produce field-level metadata and richer status information.
- Add template generation helpers for quick presets and parameterized templates.
- Preserve 5-field parsing as the stable base contract.

### Renderer panel

File: `src/renderer/plugin-panel-impls.ts`

Changes:

- Replace the current linear form layout with the workbench sections described above.
- Render compact template controls and field blocks.
- Render result sections using smaller, denser containers.
- Keep consistent visual language with recently improved plugins.

### Renderer interaction layer

File: `src/renderer/renderer.ts`

Changes:

- Centralize Cron panel refresh logic so one state update path drives all UI updates.
- Keep debounced auto-parse behavior.
- Add template selection handling and field-input synchronization.
- Add copy feedback and field-level error styling hooks.

### Styling

Likely file: `src/renderer/styles.css`

Changes:

- Add compact Cron-specific layout classes.
- Constrain wide-panel stretching.
- Standardize button groups, template chips, field blocks, and preview lists.
- Reuse the denser tool-panel styling language already established in newer plugins.

## Testing Strategy

Use the user's preferred lightweight verification path.

### Automated coverage

Add or update targeted tests for:

- Successful parse results
- Invalid expressions and field-specific errors
- Template generation behavior
- Human-readable description output
- Renderer panel structure for the compact Cron layout

Likely affected test areas:

- `src/test/plugin-panel-impls-regression.test.ts`
- new or expanded Cron plugin unit tests

### Verification commands

Primary verification should be:

- `pnpm run build`
- targeted Node-based Cron tests

Avoid frequent browser or Electron smoke runs during iteration. Use a minimal smoke pass only if needed near the end.

## Rollout Scope

### Included in version 1

- Compact layout redesign
- Quick presets
- Parameterized template builder
- Compact field editor
- Stronger parse status model
- Better readable descriptions
- Field-targeted error highlighting
- Improved upcoming-run preview
- Copy feedback

### Deferred

- Quartz cron formats
- Saved or favorite templates
- Import/export
- Runtime execution integrations
- Provider or platform dialect switching

## Acceptance Criteria

- The Cron panel no longer appears overly stretched on wide layouts.
- Users can create a valid cron from presets, templates, direct input, or field editing.
- All editing paths remain synchronized without stale selected-state issues.
- Invalid input shows a clear error, and field-specific issues highlight the relevant field when possible.
- Valid input shows a readable description, next run, and upcoming runs.
- The panel feels visually aligned with the denser, improved plugin panels elsewhere in the app.
