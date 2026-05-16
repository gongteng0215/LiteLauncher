# Plugin Panel High DPI Round 2 Design

**Date:** 2026-05-16

**Status:** Approved for planning

## Summary

Establish the second-round high-DPI and narrow-window baseline for the remaining default-visible plugin panels and the rest of the WebTools panels. This round expands coverage beyond the first baseline so that every plugin panel can hold together at narrow widths, avoid horizontal overflow, and feel meaningfully tighter rather than merely "not broken."

The implementation should stay layout-focused. Shared responsive CSS remains the primary tool. Small panel-structure adjustments are allowed when CSS alone cannot produce a compact first screen or a readable stacked layout, but this round should not turn into a plugin feature rewrite.

## Problem

The first baseline successfully stabilized the search home and a focused set of complex panels:

- `codeagent-switch`
- `clipboard-workbench`
- `webtools-password`
- `webtools-json`
- `webtools-cron`

That work added source-level layout assertions and a small Electron narrow-window baseline, but a large set of plugin panels still falls outside the high-DPI regression net. Many of them are functional but still carry one or more of these problems at mid and narrow widths:

- no explicit narrow-window regression coverage
- over-wide toolbars or button rows
- dual-column layouts that become visually empty or lopsided before they collapse
- stacked layouts that technically fit but look too loose to scan comfortably
- result areas or supporting cards that stay in the wrong order once the layout narrows

The user explicitly wants this round to cover the remaining panels together, go beyond overflow-only fixes, and allow small structural adjustments where needed.

## Goals

1. Extend high-DPI and narrow-window coverage to the remaining default-visible plugin panels and uncovered WebTools panels.
2. Make the affected panels compact and readable at narrow widths, not just technically non-overflowing.
3. Prefer shared responsive rules and repeatable layout patterns over one-off per-panel hacks.
4. Preserve the current plugin feature set and interaction model while improving visual density and first-screen usability.
5. Add stronger regression coverage so the improved baseline does not drift.

## Non-Goals

- No broad visual redesign of the entire plugin system.
- No new plugin features or product-surface expansion.
- No large refactor of `renderer.ts` or plugin execution logic.
- No attempt to make every panel aesthetically identical; the goal is a stable compact baseline, not a flattened UI language.
- No high-frequency Electron smoke workflow during development; keep browser-level verification for batch checkpoints and final confirmation.

## User Constraints

- Cover all remaining relevant panels in this round rather than stopping after one or two.
- Go deeper than "no overflow" by tightening obviously sparse layouts.
- Small structure adjustments are allowed when necessary.
- Do not run smoke/Electron verification excessively because it disrupts the user's work.

## Current Coverage Baseline

The existing narrow-window smoke coverage already exercises:

- `webtools-password`
- `webtools-json`
- `webtools-cron`
- `webtools-file-hash`
- `webtools-port-helper`
- `hardware-inspector`
- `codeagent-switch`
- `clipboard-workbench`

The panels still outside the narrow-window panel-fit baseline include:

- `webtools-colors`
- `webtools-sql-format`
- `webtools-crypto`
- `webtools-jwt`
- `webtools-url-parse`
- `webtools-timestamp`
- `webtools-unit-convert`
- `webtools-http-mock`
- `webtools-api-client`
- `webtools-qrcode`
- `webtools-config-convert`
- `webtools-markdown`
- `webtools-image-base64`
- `webtools-diff`
- `webtools-regex`
- `webtools-strings`
- `webtools-ua`
- `webtools-image-prompt`

## Design Principles

### 1. Shared CSS First

Most of the round should land in `src/renderer/styles.css`. Fix recurring layout problems through shared breakpoint patterns:

- toolbar rows that wrap predictably
- action groups that align to content edges on narrow widths
- editor/preview/result shells that collapse from two columns to one column at consistent breakpoints
- grids that switch from "fill width" to "single readable stack" when there is no real room left
- compact spacing adjustments so narrow layouts do not feel hollow

### 2. Compactness Counts as a Requirement

Passing the viewport-fit check is necessary but not sufficient. Panels should also avoid the "technically fits but looks loose and awkward" state. This round therefore treats the following as real requirements:

- overly wide empty columns should collapse earlier
- oversized spacing should tighten at narrow widths
- primary controls should stay visible in the first screen when reasonably possible
- supportive cards and meta blocks should move below the main workspace when they no longer fit beside it

### 3. Structure Changes Must Stay Small

If CSS alone cannot make a panel compact enough, small panel-implementation adjustments are allowed in `src/renderer/plugin-panel-impls.ts`. Valid examples:

- reordering action groups
- moving secondary summary blocks below primary editors
- splitting one overloaded toolbar into two smaller rows
- adding class hooks for responsive behavior

Invalid examples:

- rewriting plugin logic
- changing plugin capabilities
- rebuilding a panel from scratch just because its layout is old

### 4. Regression Depth Should Match Layout Risk

Light and medium panels can often be protected with source-level breakpoint assertions plus a shared narrow-window fit check. Heavier panels should also gain a more specific regression where layout hierarchy matters.

## Panel Batches

### Batch A: Light and Medium Editor/Converter Panels

Target panels:

- `webtools-colors`
- `webtools-url-parse`
- `webtools-timestamp`
- `webtools-unit-convert`
- `webtools-strings`
- `webtools-regex`
- `webtools-config-convert`
- `webtools-sql-format`
- `webtools-markdown`
- `webtools-image-base64`
- `webtools-diff`

Typical problems:

- top bars or option rows staying too wide
- editor/result pairs leaving empty space before collapsing
- supporting info blocks sitting beside the main editor longer than they should
- visually loose stacked sections after collapse

Preferred treatment:

- shared CSS breakpoint refinements
- earlier column collapse for selected shells
- tighter spacing on narrow widths
- minimal or no DOM reordering

### Batch B: Dense Control / Toolbar-Heavy Panels

Target panels:

- `webtools-crypto`
- `webtools-jwt`
- `webtools-api-client`
- `webtools-qrcode`
- `webtools-http-mock`
- `webtools-ua`

Typical problems:

- mode toggles, selects, and action buttons crowding the same row
- large control surfaces that technically wrap but become hard to scan
- encoded/decoded or config/result areas that need clearer stacking
- metadata blocks competing with primary work areas

Preferred treatment:

- shared CSS plus selective structure adjustment
- explicit responsive grouping for button rows and control clusters
- clearer stacked order for primary workspace first, secondary status/meta second

### Batch C: Custom Large-Surface Panel

Target panel:

- `webtools-image-prompt`

Why separate:

- far more custom than the rest of WebTools
- includes grouped presets, smart templates, module option decks, text design cards, and output controls
- needs layout care beyond generic editor/pane collapse rules

Preferred treatment:

- keep the existing functional model intact
- tighten grouped preset areas and text design cards
- ensure the style/template surface remains scannable at narrow widths
- make output and action sections stay close to the main generation flow

## Acceptance Criteria

Every panel touched in this round should satisfy all of the following:

1. At roughly `620px` panel width, the visible form and shell do not create page-level horizontal overflow.
2. The panel keeps a readable hierarchy when stacked; it should not feel like one long undifferentiated strip.
3. Primary actions remain visible near the main input/work area without immediately requiring users to hunt through a large scroll region.
4. Obvious empty or overly stretched areas are reduced; narrow layouts should feel intentionally compact.
5. Shared patterns are used wherever possible so future panels can follow the same rules.

## Testing Strategy

### Source-Level Regression

Use source-level tests for most iteration work:

- extend `src/test/plugin-panel-impls-regression.test.ts`
- assert the new responsive shells, toolbar rules, and collapse behavior for the added batches
- add targeted assertions only where they protect meaningful layout decisions

This keeps iteration fast and avoids excessive Electron churn.

### Electron Narrow-Window Checks

Expand `src/test/e2e-plugin-panels-smoke.test.ts` so the remaining uncovered panels use the existing narrow-window fit helper:

- `assertPanelFitsNarrowViewport(...)`

For especially layout-sensitive panels, allow one or two additional checks beyond viewport fit, but keep them lightweight and focused on narrow-state usability.

### Final Verification

The round should conclude with one full planned verification pass:

- `pnpm run build`
- `node dist/test/search-section-grid-style.test.js`
- `node dist/test/plugin-panel-impls-regression.test.js`
- `node dist/test/e2e-search-layout-smoke.test.js`
- `node dist/test/e2e-plugin-panels-smoke.test.js`

## Files Expected to Change

Primary files:

- `src/renderer/styles.css`
- `src/renderer/plugin-panel-impls.ts`
- `src/test/plugin-panel-impls-regression.test.ts`
- `src/test/e2e-plugin-panels-smoke.test.ts`

Supporting documentation:

- `docs/work.md`

Files that should stay untouched unless a small hook is proven necessary:

- `src/renderer/renderer.ts`
- `src/renderer/plugin-handler-config.ts`

## Risks

1. Overusing one-off panel overrides could make the stylesheet harder to maintain.
2. Pushing every panel into the same breakpoint pattern could flatten genuinely different workflows.
3. Adding too much Electron coverage detail could make smoke tests expensive again.
4. Structural tweaks inside `plugin-panel-impls.ts` could accidentally drift into behavior changes if not kept disciplined.

## Recommended Approach

Use a shared-CSS-first round with small targeted structure edits where needed. Execute in batches:

1. Batch A shared-layout tightening
2. Batch B control-dense panel tightening
3. Batch C image-prompt tightening
4. Regression expansion
5. Final single Electron verification pass

This gives the best balance of breadth, maintainability, and user-visible improvement without turning the work into a full plugin UI rewrite.
