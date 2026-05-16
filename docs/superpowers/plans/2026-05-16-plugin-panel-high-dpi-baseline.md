# Plugin Panel High DPI Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a stable high-DPI and narrow-window baseline for the search home and the default-visible plugin panels, then tighten the focused complex plugins without turning smoke tests into a high-frequency workflow.

**Architecture:** Lock the baseline in three layers: source-level layout assertions, shared responsive CSS, and a single final round of narrow-window Electron checks. Fix common shell and grid behavior first in `styles.css`, then tighten the focused plugin shells (`codeagent-switch`, `clipboard-workbench`, `webtools-password`, `webtools-json`, `webtools-cron`) with small, layout-only adjustments instead of feature rewrites.

**Tech Stack:** TypeScript, Electron renderer styles and panel implementations, Node test runner, Playwright-based Electron E2E, existing `plugin-panel-impls.ts` and `styles.css` infrastructure.

---

## File Structure

- Modify: `src/test/search-section-grid-style.test.ts`
  - Add source-level assertions for narrow-shell search section behavior.
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
  - Add source-level assertions for responsive shell breakpoints and focused plugin compactness.
- Modify: `src/test/e2e-search-layout-smoke.test.ts`
  - Add one narrow-window search-home overflow check.
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`
  - Reuse narrow-window fit assertions for the focused plugin panels and keep the run lightweight.
- Modify: `src/renderer/styles.css`
  - Add shared search-home and plugin-shell responsive rules, then focused plugin breakpoint refinements.
- Optional touch: `src/renderer/plugin-panel-impls.ts`
  - Only if a focused panel needs one extra class hook or a small action-group reorder to keep the first screen usable.
- Optional touch: `src/renderer/renderer.ts`
  - Only if the new search-home narrow check exposes a small adaptive-grid issue that CSS alone cannot fix.
- Modify: `docs/work.md`
  - Record the new high-DPI / narrow-window baseline round after the code and tests land.

## Guardrails

- Keep this round layout-only; do not fold in unrelated feature work.
- Prefer shared CSS fixes over per-plugin special cases.
- Do not grow `renderer.ts` unless a tiny search-layout helper change is required.
- Keep smoke usage low: source-level tests can iterate freely, Electron E2E should be run once at the end of the implementation batch unless a selector fails unexpectedly.
- Do not loosen existing compact assertions just to make new checks pass.

## Shared Terms

- `narrow window`: renderer viewport around `620px` wide for plugin panels and `900px` wide for the search home.
- `page-level overflow`: `.shell.scrollWidth > .shell.clientWidth + 1`.
- `first-screen actions`: the primary input, primary action buttons, and at least part of the main result area are visible without scrolling away from the panel header.

### Task 1: Lock the source-level high-DPI baseline with failing tests

**Files:**
- Modify: `src/test/search-section-grid-style.test.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
- Modify: `src/renderer/styles.css`

- [ ] **Step 1: Add failing search-home source assertions**

Append these tests to `src/test/search-section-grid-style.test.ts`:

```ts
test("search section cards can shrink inside narrow shells", () => {
  const sectionBlockBody = getRuleBody(".section-block");
  const minWidth = getProperty(sectionBlockBody, "min-width");
  assert.equal(minWidth, "0");
});

test("search section grids stay top-aligned and fill the available row width", () => {
  const gridBody = getRuleBody(".section-grid");
  const width = getProperty(gridBody, "width");
  const alignContent = getProperty(gridBody, "align-content");
  assert.equal(width, "100%");
  assert.equal(alignContent, "start");
});

test("search section title rows can wrap instead of forcing horizontal squeeze", () => {
  const titleRowBody = getRuleBody(".section-title-row");
  const flexWrap = getProperty(titleRowBody, "flex-wrap");
  assert.equal(flexWrap, "wrap");
});
```

- [ ] **Step 2: Add failing focused-panel responsive assertions**

Append these assertions inside `test("shared webtools layouts stay compact instead of stretching cards edge to edge", ...)` in `src/test/plugin-panel-impls-regression.test.ts`:

```ts
assert.match(
  stylesSource,
  /@media \(max-width:\s*1180px\)[\s\S]*\.codeagent-switch-master-detail\s*\{[\s\S]*grid-template-columns:\s*96px\s+minmax\(0,\s*1fr\)/,
  "CodeAgent Switch should keep a narrow-width two-column shell before collapsing fully"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-password-workbench\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "password tool should stack into one column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-json-control-panel\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "JSON control deck should collapse to a single column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-cron-workspace\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "Cron workspace should stack cleanly on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.clipboard-workbench-detail-actions[\s\S]*justify-content:\s*flex-start/,
  "Clipboard Workbench detail actions should stop hugging the far edge on narrow windows"
);
```

- [ ] **Step 3: Run the targeted source tests and confirm they fail**

Run:

```bash
pnpm run build && node dist/test/search-section-grid-style.test.js && node dist/test/plugin-panel-impls-regression.test.js
```

Expected: FAIL because the new `min-width`, `width`, `align-content`, `flex-wrap`, and responsive breakpoint assertions are not all present yet.

- [ ] **Step 4: Add the shared CSS baseline rules**

Update `src/renderer/styles.css` with these narrow-shell baseline rules near the existing search section and responsive panel rules:

```css
.section-block {
  min-width: 0;
}

.section-title-row {
  flex-wrap: wrap;
  align-items: flex-start;
}

.section-pager {
  margin-left: auto;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.section-grid {
  width: 100%;
  align-content: start;
}

@media (max-width: 1180px) {
  .codeagent-switch-master-detail {
    grid-template-columns: 96px minmax(0, 1fr);
  }
}

@media (max-width: 980px) {
  .webtools-password-workbench,
  .webtools-json-control-panel,
  .webtools-cron-workspace {
    grid-template-columns: minmax(0, 1fr);
  }

  .clipboard-workbench-detail-actions {
    justify-content: flex-start;
  }
}
```

- [ ] **Step 5: Re-run the targeted source tests and commit**

Run:

```bash
pnpm run build && node dist/test/search-section-grid-style.test.js && node dist/test/plugin-panel-impls-regression.test.js
```

Expected: PASS.

Commit:

```bash
git add src/test/search-section-grid-style.test.ts src/test/plugin-panel-impls-regression.test.ts src/renderer/styles.css
git commit -m "test: lock high dpi panel shell baseline"
```

### Task 2: Tighten the search-home narrow layout with one lightweight E2E check

**Files:**
- Modify: `src/test/e2e-search-layout-smoke.test.ts`
- Modify: `src/renderer/styles.css`
- Optional touch: `src/renderer/renderer.ts`

- [ ] **Step 1: Add a failing narrow-window search-home E2E assertion**

In `src/test/e2e-search-layout-smoke.test.ts`, after the existing `1280x640` verification, add a second pass at `900x640`:

```ts
await page.setViewportSize({ width: 900, height: 640 });
await refreshSearchHome(page);
await waitForSearchSections(page);

const hasHorizontalOverflow = await page.evaluate(() => {
  const shell = document.querySelector<HTMLElement>(".shell");
  return Boolean(shell && shell.scrollWidth > shell.clientWidth + 1);
});
assert.equal(hasHorizontalOverflow, false, "search home should not create page-level horizontal overflow");

const sectionFitsViewport = await page.evaluate(() => {
  return Array.from(document.querySelectorAll<HTMLElement>(".section-block")).every(
    (node) => node.getBoundingClientRect().right <= window.innerWidth + 1
  );
});
assert.equal(sectionFitsViewport, true, "search sections should stay within the viewport");
```

- [ ] **Step 2: Run the search-home E2E check and confirm it catches the narrow-state gap**

Run:

```bash
pnpm run build && node dist/test/e2e-search-layout-smoke.test.js
```

Expected: FAIL if the search section shell or pager row still pushes beyond the narrow viewport.

- [ ] **Step 3: Adjust the search-home container rules without changing tile geometry**

If the new E2E fails, keep the fix constrained to the existing search-home selectors in `src/renderer/styles.css`:

```css
@media (max-width: 980px) {
  .result-list.search-sections {
    gap: 6px;
  }

  .section-block {
    padding: 5px;
  }

  .section-title-row {
    gap: 6px;
  }

  .section-page-info {
    min-width: 0;
  }
}
```

Only touch `src/renderer/renderer.ts` if the E2E failure proves the adaptive grid helper itself is wrong. If so, keep the change limited to the section-grid sizing helper and do not alter result ordering.

- [ ] **Step 4: Re-run the search-home E2E and confirm it passes**

Run:

```bash
pnpm run build && node dist/test/e2e-search-layout-smoke.test.js
```

Expected: PASS with no `.shell` horizontal overflow at `900x640`.

- [ ] **Step 5: Commit the search-home narrow-window baseline**

```bash
git add src/test/e2e-search-layout-smoke.test.ts src/renderer/styles.css src/renderer/renderer.ts
git commit -m "fix: tighten narrow search home layout"
```

If `src/renderer/renderer.ts` was not touched, leave it out of `git add`.

### Task 3: Tighten the focused complex plugin shells without feature churn

**Files:**
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
- Modify: `src/renderer/styles.css`
- Optional touch: `src/renderer/plugin-panel-impls.ts`

- [ ] **Step 1: Add failing responsive assertions for the focused complex panels**

Append these assertions to `src/test/plugin-panel-impls-regression.test.ts`:

```ts
assert.match(
  stylesSource,
  /@media \(max-width:\s*1180px\)[\s\S]*\.codeagent-switch-detail-hero-actions[\s\S]*justify-content:\s*flex-start/,
  "CodeAgent Switch hero actions should move toward the content edge on narrower windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*1180px\)[\s\S]*\.codeagent-switch-detail-pills[\s\S]*justify-content:\s*flex-start/,
  "CodeAgent Switch state pills should stop floating to the far edge on narrower windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.clipboard-workbench-toolbar\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "Clipboard Workbench toolbar should collapse into a single readable column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-json-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "JSON editor panes should stack when there is no room for two editors"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-cron-guide-section\s*\{[\s\S]*order:\s*3/,
  "Cron guide rail should stay below the main workspace when the layout stacks"
);
```

- [ ] **Step 2: Run the focused regression test and confirm it fails**

Run:

```bash
pnpm run build && node dist/test/plugin-panel-impls-regression.test.js
```

Expected: FAIL because the new narrow-width action-alignment and shell-stacking assertions do not all exist yet.

- [ ] **Step 3: Add the focused panel breakpoint rules**

Update `src/renderer/styles.css` with these focused rules near each panel's existing selector block:

```css
@media (max-width: 1180px) {
  .codeagent-switch-detail-hero-actions,
  .codeagent-switch-detail-pills,
  .codeagent-switch-list-switch-actions {
    justify-content: flex-start;
  }

  .codeagent-switch-current-head {
    align-items: flex-start;
  }
}

@media (max-width: 980px) {
  .webtools-json-shell,
  .webtools-json-editors,
  .webtools-json-control-panel,
  .webtools-cron-workspace,
  .webtools-password-workbench {
    grid-template-columns: minmax(0, 1fr);
  }

  .webtools-json-textarea {
    min-height: clamp(200px, 38vh, 360px);
  }

  .webtools-cron-guide-section {
    order: 3;
  }
}
```

If one focused panel still needs a layout hook that does not exist, add only the missing class or wrapper in `src/renderer/plugin-panel-impls.ts`. Keep those changes limited to class names or local section order, not behavior.

- [ ] **Step 4: Re-run the focused regression test and confirm it passes**

Run:

```bash
pnpm run build && node dist/test/plugin-panel-impls-regression.test.js
```

Expected: PASS.

- [ ] **Step 5: Commit the focused panel responsive tightening**

```bash
git add src/test/plugin-panel-impls-regression.test.ts src/renderer/styles.css src/renderer/plugin-panel-impls.ts
git commit -m "fix: tighten focused plugin panel shells"
```

If `src/renderer/plugin-panel-impls.ts` was not touched, leave it out of `git add`.

### Task 4: Add the final lightweight narrow-window panel checks and close the loop

**Files:**
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`
- Modify: `docs/work.md`

- [ ] **Step 1: Add focused narrow-window checks to the plugin panel smoke test**

In `src/test/e2e-plugin-panels-smoke.test.ts`, change the focused plugins to reuse the existing narrow helper and add a minimal CodeAgent Switch check:

```ts
await openPluginFromSearch(page, "plugin:password", "瀵嗙爜宸ュ叿", "webtools-password");
await assertPanelFitsNarrowViewport("form.webtools-password-form");
await returnToSearch(page);

await openPluginFromSearch(page, "plugin:json", "JSON 宸ュ叿", "webtools-json");
await assertPanelFitsNarrowViewport("form.webtools-json-form");
await returnToSearch(page);

await openPluginFromSearch(page, "plugin:cron", "Cron 鐢熸垚鍣?", "webtools-cron");
await assertPanelFitsNarrowViewport("form.webtools-cron-form");
await returnToSearch(page);

await openPluginFromSearch(page, "plugin:codeagent-switch", "CodeAgent Switch", "codeagent-switch");
await assertPanelFitsNarrowViewport("form.codeagent-switch-form");
await page.locator(".codeagent-switch-shell").waitFor({ state: "visible", timeout: 10000 });
await returnToSearch(page);
```

In the dedicated Clipboard Workbench smoke block, add:

```ts
await assertPanelFitsNarrowViewport("form.clipboard-workbench-form");
```

- [ ] **Step 2: Run the focused panel E2E once and confirm the remaining layout issues are real**

Run:

```bash
pnpm run build && node dist/test/e2e-plugin-panels-smoke.test.js
```

Expected: Either PASS immediately, or FAIL on one of the focused panel selectors because a narrow-window shell still overflows.

- [ ] **Step 3: Record the baseline round in `docs/work.md`**

Add a single bullet under the recent work section:

```md
- Added a high-DPI / narrow-window baseline round for the search home and focused plugin panels: shared shell guards now keep section cards, CodeAgent Switch, Clipboard Workbench, Password, JSON, and Cron compact under narrow widths, with new source-level and lightweight Electron layout assertions to prevent regressions.
```

- [ ] **Step 4: Run the final verification bundle exactly once**

Run:

```bash
pnpm run build && node dist/test/search-section-grid-style.test.js && node dist/test/plugin-panel-impls-regression.test.js && node dist/test/e2e-search-layout-smoke.test.js && node dist/test/e2e-plugin-panels-smoke.test.js
```

Expected: PASS. This is the only full narrow-window Electron verification run for the batch.

- [ ] **Step 5: Commit the final high-DPI baseline round**

```bash
git add src/test/e2e-plugin-panels-smoke.test.ts docs/work.md
git commit -m "test: cover narrow plugin panel baseline"
```

---

## Spec Coverage Check

- Search-home baseline: Task 1 and Task 2
- Shared shell and responsive rules: Task 1 and Task 3
- Focused plugins (`codeagent-switch`, `clipboard-workbench`, `webtools-password`, `webtools-json`, `webtools-cron`): Task 3 and Task 4
- Lightweight regression first, one real E2E round last: Task 1 through Task 4
- Docs update: Task 4

## Placeholder Scan

- No `TODO`, `TBD`, `implement later`, or “similar to Task N” markers remain.
- Every command is explicit.
- Every code step includes concrete snippets.

## Type And Selector Consistency Check

- Search-home selectors: `.result-list.search-sections`, `.section-block`, `.section-title-row`, `.section-pager`, `.section-grid`
- Focused plugin selectors: `.codeagent-switch-master-detail`, `.codeagent-switch-detail-hero-actions`, `.clipboard-workbench-toolbar`, `.clipboard-workbench-detail-actions`, `.webtools-password-workbench`, `.webtools-json-shell`, `.webtools-json-control-panel`, `.webtools-cron-workspace`, `.webtools-cron-guide-section`
- E2E form selectors: `form.webtools-password-form`, `form.webtools-json-form`, `form.webtools-cron-form`, `form.codeagent-switch-form`, `form.clipboard-workbench-form`
