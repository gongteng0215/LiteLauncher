import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");
const ipcPath = path.join(process.cwd(), "src", "main", "ipc.ts");
const stylesPath = path.join(__dirname, "..", "renderer", "styles.css");

function getRuleBody(selector: string): string {
  const css = fs.readFileSync(stylesPath, "utf8");
  const escapedSelector = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = css.match(new RegExp(`${escapedSelector}\\s*\\{([^}]*)\\}`, "m"));
  assert.ok(match, `missing CSS rule for ${selector}`);
  return match[1] ?? "";
}

function getProperty(body: string, name: string): string {
  const match = body.match(new RegExp(`(?:^|;)\\s*${name}\\s*:\\s*([^;]+);`));
  assert.ok(match, `missing CSS property ${name}`);
  return (match[1] ?? "").trim();
}

test("search section grid keeps fixed tiles while distributing extra width", () => {
  const gridBody = getRuleBody(".section-grid");
  const gridTemplateColumns = getProperty(gridBody, "grid-template-columns");
  const justifyContent = getProperty(gridBody, "justify-content");

  assert.match(
    gridTemplateColumns,
    /repeat\(var\(--section-grid-columns,\s*auto-fit\),\s*64px\)/
  );
  assert.equal(justifyContent, "space-between");
});

test("search result tiles stay compact in adaptive grids", () => {
  const tileBody = getRuleBody(".result-item.result-tile");
  const width = getProperty(tileBody, "width");
  const minHeight = getProperty(tileBody, "min-height");

  assert.equal(width, "64px");
  assert.equal(minHeight, "54px");
});

test("search result tile labels are capped at two compact lines", () => {
  const titleBody = getRuleBody(".tile-title");
  const fontSize = getProperty(titleBody, "font-size");
  const webkitLineClamp = getProperty(titleBody, "-webkit-line-clamp");
  const maxHeight = getProperty(titleBody, "max-height");

  assert.equal(fontSize, "9px");
  assert.equal(webkitLineClamp, "2");
  assert.equal(maxHeight, "calc(2 * 1.15em)");
});

test("pinned tile marker is compact and does not cover the icon label", () => {
  const pinBody = getRuleBody(".tile-pin");
  const width = getProperty(pinBody, "width");
  const height = getProperty(pinBody, "height");
  const padding = getProperty(pinBody, "padding");
  const fontSize = getProperty(pinBody, "font-size");

  assert.equal(width, "7px");
  assert.equal(height, "7px");
  assert.equal(padding, "0");
  assert.equal(fontSize, "0");
});

test("settings error log output stays compact and monospace", () => {
  const logBody = getRuleBody(".settings-log-output");
  const minHeight = getProperty(logBody, "min-height");
  const fontSize = getProperty(logBody, "font-size");
  const lineHeight = getProperty(logBody, "line-height");

  assert.equal(minHeight, "clamp(108px, 22vh, 168px)");
  assert.equal(fontSize, "11px");
  assert.equal(lineHeight, "1.3");
});

test("section grid column calculation runs after the grid is attached to the DOM", () => {
  const rendererSource = fs.readFileSync(rendererPath, "utf8");
  const renderSearchSectionsMatch = rendererSource.match(
    /function renderSearchSections\(\): void \{([\s\S]*?)\n\}/
  );
  assert.ok(renderSearchSectionsMatch, "missing renderSearchSections");

  const body = renderSearchSectionsMatch[1] ?? "";
  assert.equal(
    body.includes("applyAdaptiveSectionGridColumns(grid);"),
    false,
    "grid width should not be measured before the section is attached"
  );
  assert.ok(
    body.includes("refreshAdaptiveSectionGrids();"),
    "rendered sections should calculate adaptive columns after DOM attachment"
  );
});

test("section grid columns follow available width instead of per-section item count", () => {
  const rendererSource = fs.readFileSync(rendererPath, "utf8");
  const columnFunctionMatch = rendererSource.match(
    /function getAdaptiveSectionGridColumns\([^)]*\): number \{([\s\S]*?)\n\}/
  );
  assert.ok(columnFunctionMatch, "missing adaptive section grid column function");

  const body = columnFunctionMatch[1] ?? "";
  assert.equal(
    body.includes("Math.min(itemCount, maxColumns)"),
    false,
    "section grids should not shrink their column count just because a section has fewer items"
  );
  assert.equal(
    body.includes("lastRowCount"),
    false,
    "section grids should use the same column geometry instead of balancing rows per section"
  );
  assert.ok(
    body.includes("return maxColumns;"),
    "section grids should derive their column count from available width"
  );
});

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

test("home search sections are not capped by the legacy display limit of 20", () => {
  const rendererSource = fs.readFileSync(rendererPath, "utf8");
  const ipcSource = fs.readFileSync(ipcPath, "utf8");

  assert.equal(
    rendererSource.includes(
      "const pluginPageSize = Math.max(1, searchDisplayConfig.pluginLimit);"
    ),
    false,
    "plugin sections should not page by the fixed plugin display limit"
  );
  assert.match(
    rendererSource,
    /getAdaptiveSectionDisplayLimit\(recentItems\)/,
    "recent section should size itself from the returned items"
  );
  assert.match(
    rendererSource,
    /getAdaptiveSectionDisplayLimit\(pinnedItems\)/,
    "pinned section should size itself from the returned items"
  );
  assert.match(
    rendererSource,
    /getAdaptiveSectionDisplayLimit\(pluginItems\)/,
    "plugin section should size itself from the returned items"
  );
  assert.match(
    ipcSource,
    /getInitialItems\(\s*SEARCH_DISPLAY_LIMIT_MAX\s*\)/,
    "recent items should be requested with the maximum safe fetch size"
  );
  assert.match(
    ipcSource,
    /getPinnedItems\(\s*SEARCH_DISPLAY_LIMIT_MAX\s*\)/,
    "pinned items should be requested with the maximum safe fetch size"
  );
});

test("settings panel only exposes the search result limit that still affects rendering", () => {
  const rendererSource = fs.readFileSync(rendererPath, "utf8");
  const fieldsMatch = rendererSource.match(
    /const fields: FieldItem\[\] = \[([\s\S]*?)\n  \];/
  );
  assert.ok(fieldsMatch, "missing settings display fields");

  const body = fieldsMatch[1] ?? "";
  assert.match(body, /key: "searchLimit"/);
  assert.equal(body.includes('key: "recentLimit"'), false);
  assert.equal(body.includes('key: "pinnedLimit"'), false);
  assert.equal(body.includes('key: "pluginLimit"'), false);
});
