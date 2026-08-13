import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const projectRoot = process.cwd();
const rendererRoot = path.join(projectRoot, "src", "renderer");
const liteSnapRoot = path.join(projectRoot, "src", "main", "litesnap");

function read(relativePath: string): string {
  return fs.readFileSync(path.join(projectRoot, relativePath), "utf8");
}

function lineCount(relativePath: string): number {
  return read(relativePath).split(/\r?\n/).length;
}

test("renderer panel facade and feature modules stay within their size budgets", () => {
  assert.ok(
    lineCount("src/renderer/plugin-panel-impls.ts") <= 17_000,
    "plugin panel facade must remain below 17,000 lines"
  );

  const featureModules = fs
    .readdirSync(path.join(rendererRoot, "panel-modules"))
    .filter((name) => name.endsWith(".ts"));
  assert.ok(featureModules.length >= 20, "panel implementations should be split by feature group");
  for (const fileName of featureModules) {
    assert.ok(
      lineCount(`src/renderer/panel-modules/${fileName}`) <= 3_500,
      `${fileName} exceeds the 3,500 line feature-module budget`
    );
  }

  const facade = read("src/renderer/plugin-panel-impls.ts");
  for (const implementation of [
    "function renderLiteSnapPanel",
    "function renderCodeAgentSwitchPanel",
    "function renderCashflowPanel",
    "function renderHardwareInspectorPanel",
    "function renderClipboardWorkbenchPanel"
  ]) {
    assert.equal(
      facade.includes(implementation),
      false,
      `${implementation} must not move back into the compatibility facade`
    );
  }
});

test("renderer entry and controllers stay split and load before panel modules", () => {
  const controllerFiles = [
    "renderer.ts",
    "renderer-foundation.ts",
    "renderer-window-mode-controller.ts",
    "renderer-settings-controller.ts",
    "renderer-home-search-controller.ts",
    "renderer-panel-bridge.ts"
  ];
  for (const fileName of controllerFiles) {
    assert.ok(
      lineCount(`src/renderer/${fileName}`) <= 3_000,
      `${fileName} exceeds the 3,000 line renderer-controller budget`
    );
  }

  const html = read("src/renderer/index.html");
  const foundationIndex = html.indexOf("renderer-foundation.js");
  const registryIndex = html.indexOf("panel-module-registry.js");
  const facadeIndex = html.indexOf("plugin-panel-impls.js");
  const bridgeIndex = html.indexOf("renderer-panel-bridge.js");
  const entryIndex = html.indexOf('src="./renderer.js"');
  assert.ok(foundationIndex >= 0 && foundationIndex < registryIndex);
  assert.ok(registryIndex < facadeIndex && facadeIndex < bridgeIndex);
  assert.ok(bridgeIndex < entryIndex, "renderer entry must run after the panel bridge");
});

test("LiteSnap session manager delegates cache, OCR, composition, commit, diagnostics and overlay lifecycle", () => {
  assert.ok(
    lineCount("src/main/litesnap/capture-session-manager.ts") <= 1_800,
    "LiteSnap session manager exceeds the 1,800 line budget"
  );
  for (const fileName of [
    "frame-cache-service.ts",
    "ocr-service.ts",
    "capture-image-service.ts",
    "capture-commit-service.ts",
    "capture-diagnostic-service.ts",
    "overlay-lifecycle-service.ts"
  ]) {
    assert.ok(fs.existsSync(path.join(liteSnapRoot, fileName)), `${fileName} must exist`);
  }

  const manager = read("src/main/litesnap/capture-session-manager.ts");
  for (const serviceName of [
    "frameCacheService",
    "ocrService",
    "imageService",
    "commitService",
    "diagnostics",
    "overlayLifecycle"
  ]) {
    assert.match(manager, new RegExp(`this\\.${serviceName}`));
  }
});

test("shared UI foundations load last and enforce the responsive design tokens", () => {
  const html = read("src/renderer/index.html");
  const legacyIndex = html.indexOf("styles.css");
  const sharedStyles = [
    "styles-foundation.css",
    "styles-app-shell.css",
    "styles-settings-unified.css",
    "styles-common-panels.css",
    "styles-feature-panels.css"
  ];
  let previousIndex = legacyIndex;
  for (const styleName of sharedStyles) {
    const styleIndex = html.indexOf(styleName);
    assert.ok(styleIndex > previousIndex, `${styleName} has an invalid load order`);
    previousIndex = styleIndex;
    assert.ok(fs.existsSync(path.join(rendererRoot, styleName)));
  }

  const theme = read("src/renderer/styles-theme.css");
  for (const token of [
    "--ll-space-1: 4px",
    "--ll-space-2: 8px",
    "--ll-space-3: 12px",
    "--ll-space-4: 16px",
    "--ll-space-6: 24px",
    "--ll-radius-control: 8px",
    "--ll-radius-card: 12px",
    "--ll-control-height: 36px"
  ]) {
    assert.ok(theme.includes(token), `missing shared UI token: ${token}`);
  }

  const responsiveStyles = sharedStyles.map((name) => read(`src/renderer/${name}`)).join("\n");
  assert.match(responsiveStyles, /@media \(max-width: 960px\)/);
  assert.match(responsiveStyles, /overflow-x:\s*hidden/);
  assert.match(responsiveStyles, /focus-visible/);
});
