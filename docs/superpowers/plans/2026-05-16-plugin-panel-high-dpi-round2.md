# Plugin Panel High DPI Round 2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extend the narrow-window / high-DPI baseline to the remaining plugin panels, tighten obviously sparse layouts, and lock the result with source-level and Electron regression coverage.

**Architecture:** Keep this round layout-first. Expand the shared responsive baseline in `styles.css`, then tighten the remaining panels in three batches: light/medium editor panels, dense control surfaces, and the custom image prompt panel. Use `plugin-panel-impls.ts` only for small structure adjustments when CSS alone cannot keep the first screen compact or readable.

**Tech Stack:** TypeScript, Electron renderer CSS, plugin panel DOM renderers in `plugin-panel-impls.ts`, Node test runner, Playwright Electron smoke tests.

---

## File Structure

- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`
  - Add narrow-window coverage for the remaining uncovered panels and keep the helper-based fit checks lightweight.
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
  - Lock the new responsive collapse rules and compactness constraints for Batch A, Batch B, and the image prompt panel.
- Modify: `src/renderer/styles.css`
  - Expand shared responsive rules and add the missing panel-specific compactness fixes.
- Optional touch: `src/renderer/plugin-panel-impls.ts`
  - Only for small DOM ordering or extra class hooks when CSS-only changes still leave a panel too loose or unreadable.
- Modify: `docs/work.md`
  - Record the second-round plugin panel high-DPI baseline after code and tests land.

## Guardrails

- Keep this round layout-only. Do not add new plugin features.
- Prefer shared selectors and grouped breakpoint rules over one-off overrides.
- Do not pull `src/renderer/renderer.ts` into scope unless a tiny class hook or panel title lookup proves unavoidable.
- Keep Electron smoke low-frequency: use source-level regression while iterating, then run focused Electron checks at batch boundaries and once at the end.
- If a panel already has a responsive rule, prefer locking it with tests and tightening it rather than replacing it wholesale.

## Shared Terms

- `narrow window`: approximately `620px` panel width in Electron smoke.
- `batch A`: colors, url, timestamp, unit, strings, regex, config, sql, markdown, image-base64, diff.
- `batch B`: crypto, jwt, api, qrcode, http-mock, ua.
- `batch C`: image prompt.
- `page-level overflow`: `.shell.scrollWidth > .shell.clientWidth + 1`.

### Task 1: Add failing narrow-window smoke coverage for Batch A

**Files:**
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`

- [ ] **Step 1: Add narrow-window checks to the Batch A panels already visited in the smoke flow**

Insert `await assertPanelFitsNarrowViewport(...)` immediately after the existing visible-form checks for the Batch A panels that already appear in the main smoke flow:

```ts
await assertPanelFitsNarrowViewport("form.webtools-colors-form");
await assertPanelFitsNarrowViewport("form.webtools-sql-form");
await assertPanelFitsNarrowViewport("form.webtools-url-form");
await assertPanelFitsNarrowViewport("form.webtools-timestamp-form");
await assertPanelFitsNarrowViewport("form.webtools-unit-form");
await assertPanelFitsNarrowViewport("form.webtools-config-form");
await assertPanelFitsNarrowViewport("form.webtools-markdown-form");
await assertPanelFitsNarrowViewport("form.webtools-image-base64-form");
await assertPanelFitsNarrowViewport("form.webtools-diff-form");
```

- [ ] **Step 2: Add new smoke visits for `strings` and `regex` with narrow-window coverage**

Append these flows near the other WebTools panel visits in `src/test/e2e-plugin-panels-smoke.test.ts`:

```ts
await openPluginFromSearch(
  page,
  "plugin:string",
  "字符串工具",
  "webtools-strings"
);
const stringsForm = page.locator("form.webtools-strings-form");
await assertPanelFitsNarrowViewport("form.webtools-strings-form");
await stringsForm.locator('textarea[name="webtoolsStringsInput"]').fill("hello_world");
await stringsForm.locator(".webtools-strings-case-btn", { hasText: /camel|Camel/i }).click();
await page.waitForFunction(() => {
  const node = document.querySelector(
    'textarea[name="webtoolsStringsInput"]'
  ) as HTMLTextAreaElement | null;
  return Boolean(node && node.value.length > 0);
});
await returnToSearch(page);

await openPluginFromSearch(
  page,
  "plugin:regex",
  "正则测试",
  "webtools-regex"
);
const regexForm = page.locator("form.webtools-regex-form");
await assertPanelFitsNarrowViewport("form.webtools-regex-form");
await regexForm.locator('input[name="webtoolsRegexPattern"]').fill("LiteLauncher");
await regexForm.locator('textarea[name="webtoolsRegexInput"]').fill("LiteLauncher regex smoke");
await page.waitForFunction(() => {
  const node = document.querySelector(".webtools-regex-highlight-box");
  return Boolean(node && node.textContent && node.textContent.includes("LiteLauncher"));
});
await returnToSearch(page);
```

- [ ] **Step 3: Run the Batch A smoke and confirm that at least one panel still exposes a layout gap**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: FAIL on one or more of the newly-added Batch A narrow-window checks.

### Task 2: Tighten Batch A layouts and lock them with source assertions

**Files:**
- Modify: `src/renderer/styles.css`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
- Optional touch: `src/renderer/plugin-panel-impls.ts`

- [ ] **Step 1: Add Batch A source assertions for the responsive rules we want to keep**

Append these assertions inside `test("shared webtools layouts stay compact instead of stretching cards edge to edge", ...)`:

```ts
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-colors-layout,\s*[\s\S]*\.webtools-image-base64-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "colors and image-base64 layouts should stack into one readable column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-markdown-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "markdown preview should collapse into a single vertical flow on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-regex-layout\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "regex editor and preview should stack when the window narrows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-config-bar[\s\S]*width:\s*100%/,
  "config toolbar should fill the row instead of floating as a wide loose pill on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-url-query-header,\s*[\s\S]*\.webtools-url-query-row\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "URL query rows should stack into one column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-strings-uuid-item\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "string UUID rows should stop stretching into two uneven columns on narrow windows"
);
```

- [ ] **Step 2: Add the Batch A responsive CSS block**

Add or extend the `@media (max-width: 980px)` rules in `src/renderer/styles.css` with this block:

```css
@media (max-width: 980px) {
  .webtools-colors-layout,
  .webtools-image-base64-layout {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .webtools-colors-column,
  .webtools-image-base64-preview,
  .webtools-image-base64-editor {
    padding: 12px;
  }

  .webtools-colors-details,
  .webtools-image-base64-editor,
  .webtools-qrcode-preview,
  .webtools-markdown-pane + .webtools-markdown-pane {
    border-left: none;
    border-top: 1px solid rgba(125, 211, 252, 0.16);
  }

  .webtools-markdown-layout,
  .webtools-config-editors,
  .webtools-diff-editors {
    grid-template-columns: minmax(0, 1fr);
    min-height: 0;
  }

  .webtools-regex-input-line,
  .webtools-timestamp-controls,
  .webtools-colors-output-row,
  .webtools-image-base64-toolbar,
  .webtools-markdown-toolbar {
    flex-wrap: wrap;
  }

  .webtools-regex-flags,
  .webtools-timestamp-controls .settings-btn {
    min-width: 0;
  }
}
```

- [ ] **Step 3: Only if the smoke still shows a visibly loose Batch A first screen, make the smallest DOM-order tweak needed**

If a Batch A panel still looks hollow after the CSS pass, keep `src/renderer/plugin-panel-impls.ts` changes to tiny order-only edits such as:

```ts
layout.append(primaryPane, secondaryPane);
form.append(header, toolbar, layout, infoBlock);
```

Use this only when a panel has a secondary pane or info block that clearly belongs below the primary workspace at narrow widths.

- [ ] **Step 4: Run build, source regression, and Batch A smoke again**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: PASS for the Batch A narrow-window checks.

- [ ] **Step 5: Commit Batch A**

```powershell
git add src/renderer/styles.css src/test/plugin-panel-impls-regression.test.ts src/test/e2e-plugin-panels-smoke.test.ts src/renderer/plugin-panel-impls.ts
git commit -m "fix: tighten batch a plugin panel narrow layouts"
```

### Task 3: Add failing narrow-window smoke coverage for Batch B

**Files:**
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`

- [ ] **Step 1: Add narrow-window checks for the Batch B panels already present in the smoke flow**

Add `assertPanelFitsNarrowViewport(...)` to these existing Batch B visits:

```ts
await assertPanelFitsNarrowViewport("form.webtools-crypto-form");
await assertPanelFitsNarrowViewport("form.webtools-jwt-form");
await assertPanelFitsNarrowViewport("form.webtools-http-mock-form");
await assertPanelFitsNarrowViewport("form.webtools-api-form");
await assertPanelFitsNarrowViewport("form.webtools-qrcode-form");
```

- [ ] **Step 2: Add a new smoke visit for `UA 解析`**

Append this flow near the other WebTools visits:

```ts
await openPluginFromSearch(
  page,
  "plugin:ua",
  "UA 解析",
  "webtools-ua"
);
const uaForm = page.locator("form.webtools-ua-form");
await assertPanelFitsNarrowViewport("form.webtools-ua-form");
await uaForm.locator('textarea[name="webtoolsUaInput"]').fill(
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/136.0.0.0 Safari/537.36"
);
await page.waitForFunction(() => {
  const node = document.querySelector(".webtools-ua-grid");
  return Boolean(node && node.textContent && node.textContent.includes("Chrome"));
});
await returnToSearch(page);
```

- [ ] **Step 3: Run the smoke and capture the actual Batch B failures**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: FAIL on one or more of the new Batch B narrow-window checks.

### Task 4: Tighten Batch B layouts and lock the dense control surfaces

**Files:**
- Modify: `src/renderer/styles.css`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
- Optional touch: `src/renderer/plugin-panel-impls.ts`

- [ ] **Step 1: Add Batch B source assertions**

Append these assertions in `src/test/plugin-panel-impls-regression.test.ts`:

```ts
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-crypto-editors\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "crypto editors should stack into one column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-jwt-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "JWT encoded and decoded panes should stack on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-api-request\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "API request blocks should collapse into one column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-qrcode-layout,\s*[\s\S]*\.webtools-api-request\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "QR setup and API request shells should stop trying to hold two columns on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-ua-grid\s*\{[\s\S]*grid-template-columns:\s*1fr/,
  "UA detail cards should stack into one readable column on narrow windows"
);
```

- [ ] **Step 2: Add the Batch B responsive CSS block**

Extend `src/renderer/styles.css` with:

```css
@media (max-width: 980px) {
  .webtools-crypto-toolbar,
  .webtools-jwt-toolbar,
  .webtools-api-response-head,
  .webtools-api-metrics {
    justify-content: flex-start;
  }

  .webtools-api-panel-card,
  .webtools-qrcode-logo-section,
  .webtools-http-mock-form .webtools-tool-pane,
  .webtools-http-mock-form .webtools-tool-bar-group {
    gap: 10px;
  }

  .webtools-api-kv-row {
    grid-template-columns: minmax(0, 1fr);
  }

  .webtools-api-row-btn,
  .webtools-api-add-btn {
    justify-self: stretch;
  }

  .webtools-qrcode-preview {
    border-left: none;
    border-top: 1px solid rgba(125, 211, 252, 0.16);
  }
}
```

- [ ] **Step 3: If a dense toolbar still reads poorly, split its controls into a primary group and a meta group**

Only if the smoke confirms that CSS wrapping alone is still too loose, use a small `plugin-panel-impls.ts` grouping pass such as:

```ts
toolbar.append(primaryActions, secondaryMeta);
header.append(titleGroup, toolbar);
```

Apply this only to the specific Batch B panel that still reads badly in the first screen after the CSS pass.

- [ ] **Step 4: Run build, source regression, and Batch B smoke again**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: PASS for the Batch B narrow-window checks.

- [ ] **Step 5: Commit Batch B**

```powershell
git add src/renderer/styles.css src/test/plugin-panel-impls-regression.test.ts src/test/e2e-plugin-panels-smoke.test.ts src/renderer/plugin-panel-impls.ts
git commit -m "fix: tighten dense plugin panel narrow layouts"
```

### Task 5: Add failing coverage for the image prompt panel

**Files:**
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Add a smoke visit for `图片提示词` with narrow-window coverage**

Append this flow:

```ts
await openPluginFromSearch(
  page,
  "plugin:prompt",
  "图片提示词",
  "webtools-image-prompt"
);
const imagePromptForm = page.locator("form.webtools-image-prompt-form");
await assertPanelFitsNarrowViewport("form.webtools-image-prompt-form");
await imagePromptForm.locator('[data-webtools-image-prompt-style-preset]').first().click();
await imagePromptForm.locator('textarea[name="webtoolsImagePromptOutput"]').waitFor({
  state: "visible",
  timeout: 10000
});
await returnToSearch(page);
```

- [ ] **Step 2: Add source assertions for the image prompt narrow layout**

Append these assertions:

```ts
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-image-prompt-grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "image prompt option grid should stack into one column on narrow windows"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*980px\)[\s\S]*\.webtools-image-prompt-text-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
  "image prompt text controls should stack instead of leaving wide empty side columns"
);
assert.match(
  stylesSource,
  /@media \(max-width:\s*680px\)[\s\S]*\.webtools-image-prompt-header\s*\{[\s\S]*flex-direction:\s*column/,
  "image prompt header should switch to a vertical stack on very narrow widths"
);
```

- [ ] **Step 3: Run the smoke and confirm the image prompt still needs tightening**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: FAIL on the new image prompt narrow-window check or reveal an obviously loose first-screen state that still needs CSS work.

### Task 6: Tighten the image prompt panel and lock the result

**Files:**
- Modify: `src/renderer/styles.css`
- Optional touch: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`

- [ ] **Step 1: Add the image prompt narrow-window CSS pass**

Extend the existing image-prompt responsive rules with:

```css
@media (max-width: 980px) {
  .webtools-image-prompt-preset-options {
    grid-template-columns: repeat(auto-fit, minmax(128px, 1fr));
  }

  .webtools-image-prompt-field,
  .webtools-image-prompt-text-design-card,
  .webtools-image-prompt-template {
    padding: 10px;
  }
}

@media (max-width: 680px) {
  .webtools-image-prompt-preset-options,
  .webtools-image-prompt-template-grid {
    grid-template-columns: minmax(0, 1fr);
  }

  .webtools-image-prompt-actions .settings-btn {
    width: 100%;
  }
}
```

- [ ] **Step 2: Only if the header or output head still feels too wide, add one small grouping hook in `plugin-panel-impls.ts`**

If the image prompt header or output actions still do not stack cleanly, add a single extra wrapper class and keep the DOM move minimal:

```ts
header.append(headerMain, productControls);
outputHead.append(outputMeta, outputActions);
```

Do not rebuild the image prompt panel; only add the wrapper needed for responsive alignment.

- [ ] **Step 3: Run build, source regression, and the smoke again**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: PASS for the image prompt narrow-window checks.

- [ ] **Step 4: Commit Batch C**

```powershell
git add src/renderer/styles.css src/test/plugin-panel-impls-regression.test.ts src/test/e2e-plugin-panels-smoke.test.ts src/renderer/plugin-panel-impls.ts
git commit -m "fix: tighten image prompt narrow layout"
```

### Task 7: Record the round and run the final verification bundle

**Files:**
- Modify: `docs/work.md`
- Modify: `src/test/search-section-grid-style.test.ts` (only if the final run reveals search-home fallout)
- Modify: `src/test/e2e-search-layout-smoke.test.ts` (only if the final run reveals search-home fallout)

- [ ] **Step 1: Update `docs/work.md`**

Add a new bullet to `## 最近完成` describing the second-round baseline, for example:

```md
- 完成插件面板高 DPI / 小窗口第二轮基线：把剩余默认插件与未覆盖 WebTools 面板纳入窄窗口回归，补齐批量 `assertPanelFitsNarrowViewport(...)` 检查，统一收紧共享 toolbar / editor / preview 栅格，并对高密度工具栏与图片提示词面板补了更细的响应式断点。
```

- [ ] **Step 2: Run the full planned verification bundle**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/search-section-grid-style.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-search-layout-smoke.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/e2e-plugin-panels-smoke.test.js; exit $LASTEXITCODE
```

Expected: PASS.

- [ ] **Step 3: Commit the final round**

```powershell
git add docs/work.md src/renderer/styles.css src/test/plugin-panel-impls-regression.test.ts src/test/e2e-plugin-panels-smoke.test.ts src/renderer/plugin-panel-impls.ts
git commit -m "fix: expand plugin panel high dpi baseline"
```
