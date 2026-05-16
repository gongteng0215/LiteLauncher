# Cron Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the `webtools-cron` plugin into a compact Cron Studio with synchronized templates, field editing, richer parse feedback, and denser preview results.

**Architecture:** Extend the main-process Cron plugin so it returns a richer parse payload with status, warnings, field metadata, and template matches while keeping the existing `open`, `parse`, and `random` action shape. Rework the renderer panel into four compact sections driven by a shared Cron state model in `renderer.ts`, then verify the behavior with targeted unit and regression tests instead of frequent smoke runs.

**Tech Stack:** TypeScript, Electron renderer/main plugin architecture, Node test runner, existing plugin panel infrastructure, CSS in `src/renderer/styles.css`

---

## File Structure

- Modify: `src/main/plugins/webtools-cron/index.ts`
  - Extend parse result types, add template helpers, warnings, field metadata, and richer readable output while preserving the existing plugin entrypoints.
- Modify: `src/renderer/plugin-panel-impls.ts`
  - Replace the current Cron panel markup with compact workbench sections for input, templates, fields, and results.
- Modify: `src/renderer/renderer.ts`
  - Add Cron UI state, template actions, field synchronization, parse-state refresh helpers, and copy feedback handling.
- Modify: `src/renderer/styles.css`
  - Add Cron-specific compact layout and state styling without regressing other plugin panels.
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
  - Add assertions that the new Cron structure and styling hooks are present in source.
- Create: `src/test/webtools-cron-plugin.test.ts`
  - Add direct tests for parse output, warnings, template generation, and field-specific error metadata.
- Optional touch: `src/test/e2e-plugin-panels-smoke.test.ts`
  - Only update if selectors break because of renamed Cron nodes; do not broaden smoke usage.

### Task 1: Lock the parse contract with failing tests

**Files:**
- Create: `src/test/webtools-cron-plugin.test.ts`
- Modify: `src/main/plugins/webtools-cron/index.ts`

- [ ] **Step 1: Write the failing plugin tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { __cronTestUtils } from "../main/plugins/webtools-cron";

test("parse returns success state for common weekday schedule", () => {
  const result = __cronTestUtils.parseCronExpression("0 9 * * 1-5");
  assert.equal(result.status, "success");
  assert.equal(result.errorMessage, "");
  assert.equal(result.errorField, "");
  assert.equal(result.templateKey, "workdays-morning");
  assert.match(result.readable, /工作日.*09:00/);
  assert.equal(result.fieldMeta.length, 5);
  assert.equal(result.upcoming.length, 7);
});

test("parse returns field-level error metadata for invalid minute values", () => {
  const result = __cronTestUtils.tryParseCronExpression("70 9 * * *");
  assert.equal(result.status, "error");
  assert.equal(result.errorField, "minute");
  assert.match(result.errorMessage, /分钟|无效值/);
  assert.equal(result.upcoming.length, 0);
});

test("parse returns warning state for every-minute schedules", () => {
  const result = __cronTestUtils.parseCronExpression("* * * * *");
  assert.equal(result.status, "warning");
  assert.match(result.warnings.join(" "), /频率|每分钟/);
});

test("quick preset generation builds a matching expression", () => {
  const preset = __cronTestUtils.applyTemplate("weekday-9am");
  assert.equal(preset.expression, "0 9 * * 1-5");
  assert.equal(preset.templateKey, "weekday-9am");
});
```

- [ ] **Step 2: Run the new Cron plugin test and verify it fails**

Run: `node --test src/test/webtools-cron-plugin.test.ts`  
Expected: FAIL because `__cronTestUtils`, `status`, `templateKey`, and richer parse result fields do not exist yet.

- [ ] **Step 3: Export a minimal test seam from the Cron plugin**

```ts
export const __cronTestUtils = {
  parseCronExpression,
  tryParseCronExpression,
  applyTemplate
};
```

Add this export near the bottom of `src/main/plugins/webtools-cron/index.ts` without changing runtime plugin registration behavior.

- [ ] **Step 4: Run the new test again to verify the failure narrows**

Run: `node --test src/test/webtools-cron-plugin.test.ts`  
Expected: FAIL on assertion mismatches instead of import errors.

- [ ] **Step 5: Commit the red test seam**

```bash
git add src/test/webtools-cron-plugin.test.ts src/main/plugins/webtools-cron/index.ts
git commit -m "test: lock cron studio parse contract"
```

### Task 2: Implement richer parse states and template helpers

**Files:**
- Modify: `src/main/plugins/webtools-cron/index.ts`
- Test: `src/test/webtools-cron-plugin.test.ts`

- [ ] **Step 1: Define the Cron result and field metadata types**

Add or replace the current types in `src/main/plugins/webtools-cron/index.ts` with:

```ts
type CronStatus = "success" | "warning" | "error";
type CronFieldName = "minute" | "hour" | "day" | "month" | "weekday";

interface CronFieldMeta {
  key: CronFieldName;
  label: string;
  value: string;
  hint: string;
  hasError: boolean;
}

interface CronParseResult {
  expression: string;
  readable: string;
  nextRun: string;
  upcoming: string[];
  status: CronStatus;
  errorMessage: string;
  errorField: CronFieldName | "";
  warnings: string[];
  templateKey: string;
  templateSummary: string;
  fieldMeta: CronFieldMeta[];
}
```

- [ ] **Step 2: Add template definitions and a generator**

Add a compact template registry in `src/main/plugins/webtools-cron/index.ts`:

```ts
interface CronTemplateDefinition {
  key: string;
  label: string;
  summary: string;
  expression: string;
}

const QUICK_TEMPLATES: CronTemplateDefinition[] = [
  { key: "every-5-minutes", label: "每 5 分钟", summary: "适合高频轮询任务", expression: "*/5 * * * *" },
  { key: "every-15-minutes", label: "每 15 分钟", summary: "适合常规同步任务", expression: "*/15 * * * *" },
  { key: "hourly", label: "每小时", summary: "每小时第 0 分钟执行", expression: "0 * * * *" },
  { key: "daily-9am", label: "每天 09:00", summary: "适合日常固定任务", expression: "0 9 * * *" },
  { key: "weekday-9am", label: "工作日 09:00", summary: "适合工作时间任务", expression: "0 9 * * 1-5" },
  { key: "monday-9am", label: "每周一 09:00", summary: "适合周例行任务", expression: "0 9 * * 1" },
  { key: "month-start-9am", label: "每月 1 日 09:00", summary: "适合月初任务", expression: "0 9 1 * *" },
  { key: "month-mid-9am", label: "每月 15 日 09:00", summary: "适合月中任务", expression: "0 9 15 * *" },
  { key: "yearly-jan-1", label: "每年 1 月 1 日", summary: "适合年度任务", expression: "0 9 1 1 *" }
];

function applyTemplate(key: string): Pick<CronParseResult, "expression" | "templateKey" | "templateSummary"> {
  const template = QUICK_TEMPLATES.find((item) => item.key === key) ?? QUICK_TEMPLATES[0];
  return {
    expression: template.expression,
    templateKey: template.key,
    templateSummary: template.summary
  };
}
```

- [ ] **Step 3: Add field metadata and field-aware parse errors**

Implement helpers that keep field labeling centralized:

```ts
const FIELD_ORDER: Array<{ key: CronFieldName; label: string; hint: string; min: number; max: number }> = [
  { key: "minute", label: "分", hint: "0-59", min: 0, max: 59 },
  { key: "hour", label: "时", hint: "0-23", min: 0, max: 23 },
  { key: "day", label: "日", hint: "1-31", min: 1, max: 31 },
  { key: "month", label: "月", hint: "1-12", min: 1, max: 12 },
  { key: "weekday", label: "周", hint: "0-6", min: 0, max: 6 }
];
```

Then add:

```ts
function buildFieldMeta(parts: string[], errorField: CronFieldName | ""): CronFieldMeta[] {
  return FIELD_ORDER.map((field, index) => ({
    key: field.key,
    label: field.label,
    value: parts[index] ?? "*",
    hint: field.hint,
    hasError: errorField === field.key
  }));
}
```

Update field parsing so each field parse is wrapped with explicit field context:

```ts
function parseFieldWithContext(
  key: CronFieldName,
  raw: string,
  min: number,
  max: number
): number[] {
  try {
    return parseField(raw, min, max);
  } catch (error) {
    const message = error instanceof Error ? error.message : "字段解析失败";
    throw new Error(`${key}:${message}`);
  }
}
```

- [ ] **Step 4: Implement `tryParseCronExpression()` and warning generation**

Add a safe wrapper that always returns a `CronParseResult`:

```ts
function buildWarnings(expression: string, readable: string): string[] {
  const warnings: string[] = [];
  if (expression === "* * * * *") {
    warnings.push("该表达式会每分钟执行一次，请确认是否需要这么高的频率。");
  }
  if (readable.includes("范围(") && expression.includes(",")) {
    warnings.push("当前表达式包含多种组合规则，建议再次确认执行范围。");
  }
  return warnings;
}

function tryParseCronExpression(expression: string): CronParseResult {
  const normalized = expression.trim() || DEFAULT_EXPRESSION;
  const parts = normalized.split(/\s+/);
  const safeParts = [...parts];
  while (safeParts.length < 5) {
    safeParts.push("*");
  }

  if (parts.length !== 5) {
    return {
      expression: normalized,
      readable: "",
      nextRun: "",
      upcoming: [],
      status: "error",
      errorMessage: "Cron 表达式必须是 5 段（分 时 日 月 周）",
      errorField: "",
      warnings: [],
      templateKey: "custom",
      templateSummary: "自定义表达式",
      fieldMeta: buildFieldMeta(safeParts, "")
    };
  }

  try {
    return parseCronExpression(normalized);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Cron 解析失败";
    const [fieldKey, fieldMessage] = message.includes(":")
      ? message.split(/:(.+)/)
      : ["", message];
    const errorField = FIELD_ORDER.some((field) => field.key === fieldKey)
      ? (fieldKey as CronFieldName)
      : "";

    return {
      expression: normalized,
      readable: "",
      nextRun: "",
      upcoming: [],
      status: "error",
      errorMessage: fieldMessage,
      errorField,
      warnings: [],
      templateKey: "custom",
      templateSummary: "自定义表达式",
      fieldMeta: buildFieldMeta(parts, errorField)
    };
  }
}
```

- [ ] **Step 5: Update `parseCronExpression()` to produce the richer result**

Make `parseCronExpression()` return `CronParseResult` directly:

```ts
function parseCronExpression(expression: string): CronParseResult {
  const normalized = expression.trim() || DEFAULT_EXPRESSION;
  const parts = normalized.split(/\s+/);
  if (parts.length !== 5) {
    throw new Error("Cron 表达式必须是 5 段（分 时 日 月 周）");
  }

  FIELD_ORDER.forEach((field, index) => {
    parseFieldWithContext(field.key, parts[index] ?? "*", field.min, field.max);
  });

  const upcoming = nextRuns(normalized, 7);
  const readable = buildReadable(parts);
  const matched = QUICK_TEMPLATES.find((item) => item.expression === normalized);
  const warnings = buildWarnings(normalized, readable);

  return {
    expression: normalized,
    readable,
    nextRun: upcoming[0] ?? "",
    upcoming,
    status: warnings.length > 0 ? "warning" : "success",
    errorMessage: "",
    errorField: "",
    warnings,
    templateKey: matched?.key ?? "custom",
    templateSummary: matched?.summary ?? "自定义表达式",
    fieldMeta: buildFieldMeta(parts, "")
  };
}
```

- [ ] **Step 6: Route plugin execution through `tryParseCronExpression()`**

Where the plugin handles the `parse` and `random` actions, make sure it now returns the richer safe result:

```ts
if (command.action === "random") {
  const expression = randomExpression();
  return {
    ok: true,
    message: "已生成随机 Cron 表达式",
    data: tryParseCronExpression(expression)
  };
}

return {
  ok: true,
  message: "Cron 解析完成",
  data: tryParseCronExpression(command.expression)
};
```

- [ ] **Step 7: Run the focused Cron plugin tests**

Run: `node --test src/test/webtools-cron-plugin.test.ts`  
Expected: PASS

- [ ] **Step 8: Commit the parse contract implementation**

```bash
git add src/main/plugins/webtools-cron/index.ts src/test/webtools-cron-plugin.test.ts
git commit -m "feat: enrich cron studio parse results"
```

### Task 3: Improve readable output for common patterns

**Files:**
- Modify: `src/main/plugins/webtools-cron/index.ts`
- Test: `src/test/webtools-cron-plugin.test.ts`

- [ ] **Step 1: Extend the tests with more human-readable expectations**

Append these tests to `src/test/webtools-cron-plugin.test.ts`:

```ts
test("readable output formats monthly schedules in plain Chinese", () => {
  const result = __cronTestUtils.parseCronExpression("30 8 1 * *");
  assert.equal(result.readable, "每月 1 日 08:30 执行");
});

test("readable output falls back to structured phrasing for complex expressions", () => {
  const result = __cronTestUtils.parseCronExpression("15 9-18 * * 1-5");
  assert.match(result.readable, /分钟|小时|周/);
});
```

- [ ] **Step 2: Run the readable-output tests to verify the gap**

Run: `node --test src/test/webtools-cron-plugin.test.ts`  
Expected: FAIL if the current human-readable wording does not match the stronger assertions.

- [ ] **Step 3: Refine `buildReadable()` with additional common-pattern branches**

Update `buildReadable()` in `src/main/plugins/webtools-cron/index.ts` to explicitly handle:

```ts
if (
  minute === "*" &&
  hour === "*" &&
  day === "*" &&
  month === "*" &&
  week === "1-5"
) {
  return "每个工作日每分钟执行";
}

if (
  isNumberToken(minute) &&
  isNumberToken(hour) &&
  day === "*" &&
  month === "*" &&
  week === "1-5"
) {
  return `每个工作日 ${pad2(hour)}:${pad2(minute)} 执行`;
}

if (
  minute.startsWith("*/") &&
  hour === "*" &&
  day === "*" &&
  month === "*" &&
  week === "1-5"
) {
  return `每个工作日每 ${minute.slice(2)} 分钟执行`;
}
```

Keep the structured fallback path for expressions that do not fit a natural template cleanly.

- [ ] **Step 4: Run the focused Cron plugin tests again**

Run: `node --test src/test/webtools-cron-plugin.test.ts`  
Expected: PASS

- [ ] **Step 5: Commit the readable-output improvements**

```bash
git add src/main/plugins/webtools-cron/index.ts src/test/webtools-cron-plugin.test.ts
git commit -m "feat: improve cron studio readable descriptions"
```

### Task 4: Add renderer state for templates, fields, and copy feedback

**Files:**
- Modify: `src/renderer/renderer.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`

- [ ] **Step 1: Add Cron renderer state variables**

Near the existing Cron renderer state in `src/renderer/renderer.ts`, add:

```ts
let webtoolsCronStatus: "success" | "warning" | "error" = "success";
let webtoolsCronErrorMessage = "";
let webtoolsCronErrorField = "";
let webtoolsCronWarnings: string[] = [];
let webtoolsCronTemplateKey = "custom";
let webtoolsCronTemplateSummary = "自定义表达式";
let webtoolsCronFieldMeta: Array<{
  key: string;
  label: string;
  value: string;
  hint: string;
  hasError: boolean;
}> = [];
let webtoolsCronCopyState: "" | "expression" | "readable" = "";
```

- [ ] **Step 2: Update Cron payload application to reset and hydrate all state**

Replace the current `applyWebtoolsCronPanelPayload()` body with:

```ts
applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
  if (panel.data && typeof panel.data.expression === "string") {
    webtoolsCronExpression = panel.data.expression;
  } else {
    webtoolsCronExpression = "5 4 * * *";
  }
  webtoolsCronReadable = "";
  webtoolsCronNextRun = "";
  webtoolsCronUpcoming = [];
  webtoolsCronStatus = "success";
  webtoolsCronErrorMessage = "";
  webtoolsCronErrorField = "";
  webtoolsCronWarnings = [];
  webtoolsCronTemplateKey = "custom";
  webtoolsCronTemplateSummary = "自定义表达式";
  webtoolsCronFieldMeta = [];
  webtoolsCronCopyState = "";
}
```

- [ ] **Step 3: Update `executeWebtoolsCronAction()` to hydrate the richer state**

Inside `executeWebtoolsCronAction()` in `src/renderer/renderer.ts`, add:

```ts
webtoolsCronStatus =
  data && typeof data.status === "string" && (data.status === "warning" || data.status === "error")
    ? data.status
    : "success";
webtoolsCronErrorMessage =
  data && typeof data.errorMessage === "string" ? data.errorMessage : "";
webtoolsCronErrorField =
  data && typeof data.errorField === "string" ? data.errorField : "";
webtoolsCronTemplateKey =
  data && typeof data.templateKey === "string" ? data.templateKey : "custom";
webtoolsCronTemplateSummary =
  data && typeof data.templateSummary === "string" ? data.templateSummary : "自定义表达式";

const nextWarnings: string[] = [];
if (data && Array.isArray(data.warnings)) {
  for (const value of data.warnings) {
    if (typeof value === "string") {
      nextWarnings.push(value);
    }
  }
}
webtoolsCronWarnings = nextWarnings;

const nextFieldMeta: typeof webtoolsCronFieldMeta = [];
if (data && Array.isArray(data.fieldMeta)) {
  for (const value of data.fieldMeta) {
    const item = toRecord(value);
    if (!item) {
      continue;
    }
    nextFieldMeta.push({
      key: typeof item.key === "string" ? item.key : "",
      label: typeof item.label === "string" ? item.label : "",
      value: typeof item.value === "string" ? item.value : "*",
      hint: typeof item.hint === "string" ? item.hint : "",
      hasError: item.hasError === true
    });
  }
}
webtoolsCronFieldMeta = nextFieldMeta;
```

- [ ] **Step 4: Add a helper to compute field meta fallback from the expression**

In `src/renderer/renderer.ts`, add:

```ts
function getWebtoolsCronFieldMeta(): Array<{
  key: string;
  label: string;
  value: string;
  hint: string;
  hasError: boolean;
}> {
  if (webtoolsCronFieldMeta.length > 0) {
    return webtoolsCronFieldMeta;
  }
  const values = getWebtoolsCronPartValues(webtoolsCronExpression);
  return [
    { key: "minute", label: "分", value: values[0] ?? "*", hint: "0-59", hasError: false },
    { key: "hour", label: "时", value: values[1] ?? "*", hint: "0-23", hasError: false },
    { key: "day", label: "日", value: values[2] ?? "*", hint: "1-31", hasError: false },
    { key: "month", label: "月", value: values[3] ?? "*", hint: "1-12", hasError: false },
    { key: "weekday", label: "周", value: values[4] ?? "*", hint: "0-6", hasError: false }
  ];
}
```

- [ ] **Step 5: Commit the renderer state groundwork**

```bash
git add src/renderer/renderer.ts src/renderer/plugin-panel-impls.ts
git commit -m "refactor: add cron studio renderer state model"
```

### Task 5: Rebuild the Cron panel into a compact workbench

**Files:**
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/renderer.ts`
- Modify: `src/renderer/styles.css`
- Test: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Add source-level regression assertions for the new Cron sections**

Append this test to `src/test/plugin-panel-impls-regression.test.ts`:

```ts
test("Cron Studio panel exposes compact workspace sections", () => {
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();

  assert.match(panelImplsSource, /webtools-cron-toolbar/);
  assert.match(panelImplsSource, /webtools-cron-template-grid/);
  assert.match(panelImplsSource, /webtools-cron-field-grid/);
  assert.match(panelImplsSource, /webtools-cron-results-grid/);
  assert.match(panelImplsSource, /name=\"webtoolsCronField-minute\"/);
  assert.match(panelImplsSource, /data-webtools-cron-template=/);
  assert.match(stylesSource, /\.webtools-cron-toolbar/);
  assert.match(stylesSource, /\.webtools-cron-field-card/);
});
```

- [ ] **Step 2: Run the panel regression test to verify it fails**

Run: `node --test src/test/plugin-panel-impls-regression.test.ts`  
Expected: FAIL because the new Cron section classes and field inputs do not exist yet.

- [ ] **Step 3: Replace the Cron panel markup with compact sections**

In `src/renderer/plugin-panel-impls.ts`, rebuild `renderWebtoolsCronPanel()` around this structure:

```ts
const toolbar = document.createElement("div");
toolbar.className = "webtools-cron-toolbar";

const templatesSection = document.createElement("section");
templatesSection.className = "webtools-cron-section";

const templateGrid = document.createElement("div");
templateGrid.className = "webtools-cron-template-grid";

const fieldGrid = document.createElement("div");
fieldGrid.className = "webtools-cron-field-grid";

const resultsGrid = document.createElement("div");
resultsGrid.className = "webtools-cron-results-grid";
```

For each field card, use explicit input names:

```ts
input.name = `webtoolsCronField-${field.key}`;
input.setAttribute("data-webtools-cron-field", field.key);
```

For each quick template button:

```ts
button.setAttribute("data-webtools-cron-template", template.key);
button.className = template.key === webtoolsCronTemplateKey
  ? "settings-btn webtools-cron-template-chip is-active"
  : "settings-btn webtools-cron-template-chip";
```

- [ ] **Step 4: Add compact Cron-specific styles**

In `src/renderer/styles.css`, add:

```css
.webtools-cron-form {
  width: min(100%, 980px);
  gap: 14px;
}

.webtools-cron-toolbar,
.webtools-cron-results-grid {
  display: grid;
  gap: 10px;
}

.webtools-cron-workspace {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(0, 1.2fr) minmax(280px, 0.8fr);
}

.webtools-cron-template-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.webtools-cron-template-chip.is-active {
  border-color: var(--accent-color);
  background: color-mix(in srgb, var(--accent-color) 14%, transparent);
}

.webtools-cron-field-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
}

.webtools-cron-field-card {
  display: grid;
  gap: 6px;
  padding: 10px;
  border: 1px solid var(--panel-border);
  border-radius: 8px;
  min-width: 0;
}

.webtools-cron-field-card.is-error {
  border-color: var(--danger-color);
}

@media (max-width: 1080px) {
  .webtools-cron-workspace,
  .webtools-cron-results-grid,
  .webtools-cron-field-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Wire field inputs to rebuild the expression**

In `src/renderer/renderer.ts`, add:

```ts
function rebuildWebtoolsCronExpressionFromFields(form: HTMLFormElement): string {
  const keys = ["minute", "hour", "day", "month", "weekday"];
  return keys
    .map((key) => {
      const node = form.elements.namedItem(`webtoolsCronField-${key}`);
      return node instanceof HTMLInputElement && node.value.trim() ? node.value.trim() : "*";
    })
    .join(" ");
}
```

Use this inside field input listeners:

```ts
input.addEventListener("input", () => {
  const nextExpression = rebuildWebtoolsCronExpressionFromFields(form);
  const expressionNode = form.elements.namedItem("webtoolsCronExpression");
  if (expressionNode instanceof HTMLInputElement) {
    expressionNode.value = nextExpression;
  }
  scheduleWebtoolsCronAutoParse(form);
});
```

- [ ] **Step 6: Update `refreshWebtoolsCronResultInForm()` for the new structure**

Replace the current table-cell refresh with:

```ts
getWebtoolsCronFieldMeta().forEach((field) => {
  const node = form.elements.namedItem(`webtoolsCronField-${field.key}`);
  if (node instanceof HTMLInputElement) {
    node.value = field.value;
  }
  const card = form.querySelector(`[data-webtools-cron-field-card="${field.key}"]`);
  if (card instanceof HTMLElement) {
    card.classList.toggle("is-error", field.hasError);
  }
});
```

Also update the status text nodes so they switch between readable copy, warnings, and errors.

- [ ] **Step 7: Run the panel regression test**

Run: `node --test src/test/plugin-panel-impls-regression.test.ts`  
Expected: PASS

- [ ] **Step 8: Commit the compact Cron panel rebuild**

```bash
git add src/renderer/plugin-panel-impls.ts src/renderer/renderer.ts src/renderer/styles.css src/test/plugin-panel-impls-regression.test.ts
git commit -m "feat: rebuild cron studio panel layout"
```

### Task 6: Add template interactions and copy feedback

**Files:**
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/renderer.ts`
- Test: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Add regression checks for template activation and copy feedback**

Append this test to `src/test/plugin-panel-impls-regression.test.ts`:

```ts
test("Cron Studio exposes active template styling and copy feedback hooks", () => {
  const panelImplsSource = readPanelImplsSource();
  const rendererSource = readRendererSource();

  assert.match(panelImplsSource, /webtools-cron-template-chip is-active/);
  assert.match(panelImplsSource, /webtoolsCronCopyState/);
  assert.match(rendererSource, /copyTextToClipboard\(webtoolsCronExpression\)/);
  assert.match(rendererSource, /copyTextToClipboard\(webtoolsCronReadable\)/);
});
```

- [ ] **Step 2: Run the regression test and verify it fails**

Run: `node --test src/test/plugin-panel-impls-regression.test.ts`  
Expected: FAIL because active template and readable-copy hooks are not in place yet.

- [ ] **Step 3: Add template button handling**

In `src/renderer/plugin-panel-impls.ts`, bind each template chip:

```ts
button.addEventListener("click", () => {
  const expressionNode = form.elements.namedItem("webtoolsCronExpression");
  if (expressionNode instanceof HTMLInputElement) {
    expressionNode.value = template.expression;
  }
  void executeWebtoolsCronAction("parse", template.expression, {
    render: false,
    form
  });
});
```

- [ ] **Step 4: Add copy feedback for expression and readable text**

In `src/renderer/plugin-panel-impls.ts`, add a second copy button for readable output and route both through renderer state:

```ts
const copyReadableButton = document.createElement("button");
copyReadableButton.type = "button";
copyReadableButton.className = "settings-btn settings-btn-secondary";
copyReadableButton.textContent = webtoolsCronCopyState === "readable" ? "已复制说明" : "复制说明";
copyReadableButton.addEventListener("click", () => {
  void copyWebtoolsCronText("readable", webtoolsCronReadable || webtoolsCronErrorMessage, form);
});
```

Then add in `src/renderer/renderer.ts`:

```ts
async function copyWebtoolsCronText(
  kind: "" | "expression" | "readable",
  text: string,
  form?: HTMLFormElement
): Promise<void> {
  if (!text.trim()) {
    setStatus("当前没有可复制的内容");
    return;
  }
  const copied = await copyTextToClipboard(text);
  webtoolsCronCopyState = copied ? kind : "";
  setStatus(copied ? "Cron 内容已复制" : "复制失败");
  if (form) {
    refreshWebtoolsCronResultInForm(form);
  }
}
```

- [ ] **Step 5: Clear copy feedback on fresh parse**

At the start of `executeWebtoolsCronAction()` in `src/renderer/renderer.ts`, add:

```ts
webtoolsCronCopyState = "";
```

- [ ] **Step 6: Run the panel regression tests**

Run: `node --test src/test/plugin-panel-impls-regression.test.ts`  
Expected: PASS

- [ ] **Step 7: Commit template and copy interactions**

```bash
git add src/renderer/plugin-panel-impls.ts src/renderer/renderer.ts src/test/plugin-panel-impls-regression.test.ts
git commit -m "feat: add cron studio template actions"
```

### Task 7: Verify build and keep smoke impact minimal

**Files:**
- Modify only if needed: `src/test/e2e-plugin-panels-smoke.test.ts`

- [ ] **Step 1: Run the focused Cron tests**

Run: `node --test src/test/webtools-cron-plugin.test.ts src/test/plugin-panel-impls-regression.test.ts`  
Expected: PASS

- [ ] **Step 2: Run the app build**

Run: `pnpm run build`  
Expected: build completes successfully

- [ ] **Step 3: Only if the build reveals selector breakage, patch the Cron smoke selector**

If `src/test/e2e-plugin-panels-smoke.test.ts` needs an update, keep the existing smoke scenario minimal:

```ts
const cronForm = page.locator("form.webtools-cron-form");
await assertFormFitsViewport("form.webtools-cron-form");
await cronForm.locator('input[name="webtoolsCronExpression"]').fill("*/15 9-18 * * 1-5");
await cronForm.locator('input[name="webtoolsCronExpression"]').press("Enter");
await page.waitForFunction(() => {
  const node = document.querySelector(".webtools-cron-readable") as HTMLDivElement | null;
  return Boolean(node && node.textContent && node.textContent !== "-");
});
```

- [ ] **Step 4: Re-run only the exact verification command that failed**

Run either:
- `pnpm run build`
- or `node --test src/test/plugin-panel-impls-regression.test.ts`

Expected: PASS after the targeted fix

- [ ] **Step 5: Commit the verification pass**

```bash
git add src/test/webtools-cron-plugin.test.ts src/test/plugin-panel-impls-regression.test.ts src/test/e2e-plugin-panels-smoke.test.ts src/main/plugins/webtools-cron/index.ts src/renderer/plugin-panel-impls.ts src/renderer/renderer.ts src/renderer/styles.css
git commit -m "test: verify cron studio implementation"
```

## Self-Review

- Spec coverage: layout, templates, field editor, parse status, warnings, copy feedback, and verification are all covered by Tasks 1 through 7.
- Placeholder scan: all test, code, and verification steps include concrete file paths, snippets, and commands.
- Type consistency: plan uses `templateKey`, `templateSummary`, `fieldMeta`, `status`, `errorMessage`, and `errorField` consistently across plugin and renderer tasks.

