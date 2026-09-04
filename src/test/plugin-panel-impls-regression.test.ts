import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { readRendererSourceBundle } from "./renderer-source-bundle";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");
const rendererHtmlPath = path.join(process.cwd(), "src", "renderer", "index.html");
const rendererStylesPath = path.join(process.cwd(), "src", "renderer", "styles.css");
const commonPanelStylesPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "styles-common-panels.css"
);
const sharedImagePromptBuilderPath = path.join(
  process.cwd(),
  "src",
  "shared",
  "image-prompt-builder.ts"
);
const copyAssetsPath = path.join(process.cwd(), "scripts", "copy-assets.cjs");
const panelImplsPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "plugin-panel-impls.ts"
);
const panelRuntimePaths = [
  "panel-runtime-foundation.ts",
  "panel-modules/password-panel.ts",
  "panel-modules/cashflow-panel.ts",
  "panel-modules/codeagent-panel.ts",
  "panel-modules/clipboard-panel.ts",
  "panel-modules/hardware-panel.ts",
  "panel-modules/webtools-data-runtime.ts",
  "panel-modules/webtools-convert-runtime.ts",
  "panel-modules/webtools-network-runtime.ts",
  "panel-modules/webtools-security-runtime.ts",
  "panel-runtime-core.ts",
  "panel-modules/litesnap-panel.ts",
  "panel-modules/dictionary-translate-panel.ts",
  "panel-routing.ts",
  "panel-modules/webtools-developer-panel.ts",
  "panel-modules/webtools-structured-panel.ts",
  "panel-modules/webtools-security-panel.ts",
  "panel-modules/webtools-media-panel.ts",
  "panel-modules/webtools-text-panel.ts"
].map((relativePath) => path.join(process.cwd(), "src", "renderer", relativePath));
const pluginRuntimeTypesPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "plugin-runtime-types.d.ts"
);
const mainDatabasePath = path.join(process.cwd(), "src", "main", "database.ts");
const clipboardWorkbenchStorePath = path.join(
  process.cwd(),
  "src",
  "main",
  "plugins",
  "clipboard-workbench",
  "store.ts"
);

function readRendererSource(): string {
  return readRendererSourceBundle();
}

function readPanelImplsSource(): string {
  return [...panelRuntimePaths, panelImplsPath]
    .map((filePath) => fs.readFileSync(filePath, "utf8"))
    .join("\n");
}

function readPluginRuntimeTypesSource(): string {
  return fs.readFileSync(pluginRuntimeTypesPath, "utf8");
}

function readMainDatabaseSource(): string {
  return fs.readFileSync(mainDatabasePath, "utf8");
}

function readClipboardWorkbenchStoreSource(): string {
  return fs.readFileSync(clipboardWorkbenchStorePath, "utf8");
}

function readRendererHtmlSource(): string {
  return fs.readFileSync(rendererHtmlPath, "utf8");
}

function readRendererStylesSource(): string {
  return fs.readFileSync(rendererStylesPath, "utf8");
}

function readCommonPanelStylesSource(): string {
  return fs.readFileSync(commonPanelStylesPath, "utf8");
}

function readCopyAssetsSource(): string {
  return fs.readFileSync(copyAssetsPath, "utf8");
}

function readSharedImagePromptBuilderSource(): string {
  return fs.readFileSync(sharedImagePromptBuilderPath, "utf8");
}

function extractFunctionSource(source: string, name: string): string {
  const functionIndex = source.indexOf(`function ${name}`);
  assert.notEqual(functionIndex, -1, `${name} should be present`);
  const bodyStart = source.indexOf("{", functionIndex);
  assert.notEqual(bodyStart, -1, `${name} should have a function body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(functionIndex, index + 1);
      }
    }
  }

  assert.fail(`${name} should have a complete function body`);
}

function extractMethodSource(source: string, name: string): string {
  const methodIndex = source.indexOf(`${name}(): void {`);
  assert.notEqual(methodIndex, -1, `${name} should be present`);
  const bodyStart = source.indexOf("{", methodIndex);
  assert.notEqual(bodyStart, -1, `${name} should have a method body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(methodIndex, index + 1);
      }
    }
  }

  assert.fail(`${name} should have a complete method body`);
}

test("new default plugin panels are implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.equal(
    rendererSource.includes("function renderWebtoolsFileHashPanel"),
    false,
    "File Hash render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function renderWebtoolsPortHelperPanel"),
    false,
    "Port Helper render implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /\[WEBTOOLS_FILE_HASH_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "File Hash handler should render through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /getRegisteredPanelImpls\(\)\.applyWebtoolsFileHashPanelPayload\(panel\)/,
    "File Hash handler should apply payload through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /\[WEBTOOLS_PORT_HELPER_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "Port Helper handler should render through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /getRegisteredPanelImpls\(\)\.applyWebtoolsPortHelperPanelPayload\(panel\)/,
    "Port Helper handler should apply payload through panelImplsSafe"
  );

  assert.match(panelImplsSource, /renderWebtoolsFileHashPanel\(\): void/);
  assert.match(panelImplsSource, /renderWebtoolsPortHelperPanel\(\): void/);
});

test("LiteSnap panel is implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.equal(
    rendererSource.includes("function renderLiteSnapPanel"),
    false,
    "LiteSnap panel implementation should not live in renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /\[LITESNAP_PLUGIN_ID\]:\s*\{/,
    "LiteSnap should render through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /void hydrateLiteSnapPanelFromSettings\(\);/,
    "LiteSnap panel should hydrate persisted settings when opened"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /liteSnapStartCapture[\s\S]{0,120}launcher\.hide\(\)/,
    "LiteSnap panel capture should not hide the launcher window"
  );
  assert.match(panelImplsSource, /applyLiteSnapPanelPayload\(panel: unknown\): void/);
  assert.match(panelImplsSource, /renderLiteSnapPanel\(\): void/);
});

test("LiteSnap settings subview handles Esc inside plugin mode before leaving to search", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    rendererSource,
    /if \(panelImplsSafe\.handleActivePluginPanelEscape\(\)\) \{\s*return true;\s*\}/,
    "renderer plugin-mode keydown should delegate plugin-specific Esc handling before backToSearch"
  );
  assert.match(
    panelImplsSource,
    /handleActivePluginPanelEscape\(\): boolean \{/,
    "panel impls should expose plugin-specific Esc handling"
  );
  assert.match(
    panelImplsSource,
    /let liteSnapPanelView: "main" \| "settings" \| "ocr" \| "translate" \| "history" \| "diagnostics"\s*=\s*"main";/,
    "LiteSnap should keep local main/settings/ocr/translate/history/diagnostics subview state"
  );
  assert.match(
    panelImplsSource,
    /liteSnapPanelView = "settings";/,
    "LiteSnap settings action should switch into a local settings subview"
  );
  assert.match(
    panelImplsSource,
    /liteSnapPanelView === "settings"/,
    "LiteSnap should detect the settings subview when handling Esc"
  );
  assert.match(
    panelImplsSource,
    /normalizeLiteSnapOcrPanelText\(rawOcrText\)/,
    "LiteSnap OCR panel should normalize text when applying payload"
  );
  const rendererHtmlSource = fs.readFileSync(rendererHtmlPath, "utf8");
  assert.match(
    rendererHtmlSource,
    /litesnap-text-utils\.js/,
    "renderer index should load litesnap-text-utils before plugin panels"
  );
});

test("LiteSnap panel covers close-all pins, history view, and color capture controls", () => {
  const panelImplsSource = readPanelImplsSource();
  assert.match(panelImplsSource, /关闭全部贴图/);
  assert.match(panelImplsSource, /liteSnapCloseAllPinnedWindows/);
  assert.match(panelImplsSource, /liteSnapListHistory/);
  assert.match(panelImplsSource, /liteSnapHistoryCopy/);
  assert.match(panelImplsSource, /liteSnapHistoryPin/);
  assert.match(panelImplsSource, /liteSnapStartColorCapture/);
  assert.match(panelImplsSource, /historyEnabled/);
  assert.match(panelImplsSource, /historyMaxItems/);
  assert.match(panelImplsSource, /colorShortcut/);
  assert.match(panelImplsSource, /togglePinClickThroughShortcut/);
  assert.match(
    panelImplsSource,
    /liteSnapPanelView === "history"/,
    "LiteSnap panel should render a history subview"
  );
});

test("standalone password and cashflow panels are implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  [
    "let passwordPanelOptions: PasswordGeneratorOptions = {",
    "let passwordPanelGenerated: string[] = [];",
    "let cashflowState: CashflowState | null = null;",
    "let cashflowReports: CashflowReports | null = null;",
    "let cashflowJobs: CashflowJobOption[] = [];",
    "function clampPasswordCount",
    "function normalizePasswordOptions",
    "function parsePasswordPanelPayload",
    "function parseCashflowPanelPayload",
    "function buildPasswordGenerateTarget",
    "function extractGeneratedPasswords",
    "function createPasswordResultRow",
    "async function generateFromPasswordPanel",
    "function renderPasswordPanel",
    "function cashflowStatusSummary",
    "async function executeCashflowAction",
    "async function nextCashflowTurn",
    "function createCashflowStat",
    "function createCashflowReportList",
    "function createCashflowMetricRow",
    "function renderCashflowPanel",
    "async function openCashflowPanel"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });

  assert.match(
    rendererSource,
    /if \(mode === "password"\) \{\s*panelImplsSafe\.renderPasswordPanel\(\);\s*return;\s*\}/,
    "standalone password mode should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /if \(mode === "cashflow"\) \{\s*panelImplsSafe\.renderCashflowPanel\(\);\s*return;\s*\}/,
    "cashflow mode should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /const ok = await panelImplsSafe\.refreshCashflowPanel\(\);/,
    "cashflow refresh should delegate through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /pushDebugLog\("renderer action: password generate"\);[\s\S]*panelImplsSafe\.handlePasswordPanelEnter\(\);/s,
    "password Enter action should delegate through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /pushDebugLog\("renderer action: cashflow nextTurn"\);[\s\S]*panelImplsSafe\.handleCashflowPanelEnter\(\);/s,
    "cashflow Enter action should delegate through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /const standalonePanelOpen = panelImplsSafe\.handleStandalonePanelPayload\(panelPayload\);/,
    "standalone panel open payloads should delegate through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /function handlePanelModeKeydown\(\s*event: KeyboardEvent,\s*options: \{/,
    "panel mode keydown routing should live in a dedicated renderer shell helper"
  );
  assert.match(
    rendererSource,
    /const handledPanelMode = handlePanelModeKeydown\(event,\s*\{/,
    "handleKeydown should delegate panel mode branches through the dedicated helper"
  );
  {
    const handleKeydownSource = extractFunctionSource(rendererSource, "handleKeydown");
    assert.doesNotMatch(
      handleKeydownSource,
      /if \(mode === "password"\) \{/,
      "handleKeydown should not inline password panel mode branching"
    );
    assert.doesNotMatch(
      handleKeydownSource,
      /if \(mode === "cashflow"\) \{/,
      "handleKeydown should not inline cashflow panel mode branching"
    );
    assert.doesNotMatch(
      handleKeydownSource,
      /if \(mode === "plugin"\) \{/,
      "handleKeydown should not inline plugin panel mode branching"
    );
  }

  assert.match(
    panelImplsSource,
    /let passwordPanelOptions: PasswordGeneratorOptions = \{/,
    "standalone password state should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /let cashflowState: CashflowState \| null = null;/,
    "cashflow state should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /handleStandalonePanelPayload\(panelPayload: unknown\): string \| null \{/,
    "panel impls should accept standalone panel open payloads"
  );
  assert.match(
    panelImplsSource,
    /renderPasswordPanel\(\): void \{/,
    "standalone password render should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /handlePasswordPanelEnter\(\): void \{/,
    "standalone password Enter handler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /renderCashflowPanel\(\): void \{/,
    "cashflow render should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /refreshCashflowPanel\(\): Promise<boolean> \{/,
    "cashflow refresh should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /handleCashflowPanelEnter\(\): void \{/,
    "cashflow Enter handler should live in plugin-panel-impls"
  );
});

test("plugin runtime state and defaults live with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  [
    "let webtoolsPasswordOptions: WebtoolsPasswordOptions = {",
    "let webtoolsPasswordRows: WebtoolsPasswordResultRow[] = [];",
    "let webtoolsJsonState: WebtoolsJsonState = {",
    "const DEFAULT_WEBTOOLS_URL_INPUT =",
    "function createEmptyWebtoolsUrlParts(): WebtoolsUrlParts {",
    "let webtoolsUrlState: WebtoolsUrlState = {",
    "let webtoolsDiffLeft = \"\";",
    "let webtoolsDiffRight = \"\";",
    "let webtoolsDiffIgnoreCase = false;",
    "let webtoolsDiffIgnoreWhitespace = false;",
    "let webtoolsDiffPrettyHtml = \"\";",
    "let webtoolsDiffSummary: WebtoolsDiffSummary | null = null;",
    "let webtoolsDiffAutoTimer: number | null = null;",
    "let webtoolsDiffRequestToken = 0;",
    "let webtoolsTimestampUnixInput = \"\";",
    "let webtoolsTimestampDateInput = \"\";",
    "let webtoolsTimestampDateOutput = \"\";",
    "let webtoolsTimestampTimestampOutput = \"\";",
    "let webtoolsTimestampUnit: \"s\" | \"ms\" = \"s\";",
    "let webtoolsTimestampInfo = \"\";",
    "let webtoolsTimestampAutoTimer: number | null = null;",
    "let webtoolsTimestampClockTimer: number | null = null;",
    "let webtoolsTimestampToDateRequestToken = 0;",
    "let webtoolsTimestampToTimestampRequestToken = 0;",
    "let webtoolsRegexPattern =",
    "let webtoolsRegexFlags = \"g\";",
    "let webtoolsRegexInput =",
    "let webtoolsRegexReplacement = \"\";",
    "let webtoolsRegexOutput = \"\";",
    "let webtoolsRegexInfo = \"\";",
    "let webtoolsRegexError = \"\";",
    "let webtoolsRegexHighlightedHtml = \"\";",
    "let webtoolsRegexRows: WebtoolsRegexMatchRow[] = [];",
    "let webtoolsJsonAutoTimer: number | null = null;",
    "let webtoolsPasswordRequestToken = 0;",
    "let webtoolsJsonRequestToken = 0;",
    "let webtoolsCryptoAlgorithm = \"MD5\";",
    "let webtoolsCryptoMode: \"encrypt\" | \"decrypt\" = \"encrypt\";",
    "let webtoolsCryptoInput = \"\";",
    "let webtoolsCryptoOutput = \"\";",
    "let webtoolsCryptoInfo = \"\";",
    "let webtoolsCryptoSecret = \"\";",
    "let webtoolsCryptoIv = \"\";",
    "let webtoolsCryptoPublicKey = \"\";",
    "let webtoolsCryptoPrivateKey = \"\";",
    "let webtoolsCryptoRsaBits = 2048;",
    "let webtoolsCryptoAutoTimer: number | null = null;",
    "let webtoolsCryptoRequestToken = 0;",
    "let webtoolsJwtToken = \"\";",
    "let webtoolsJwtHeader = \"\";",
    "let webtoolsJwtPayload = \"\";",
    "let webtoolsJwtSecret = \"your-256-bit-secret\";",
    "let webtoolsJwtMode: \"jws\" | \"jwe\" = \"jws\";",
    "let webtoolsJwtAlgorithm: \"HS256\" | \"RS256\" = \"HS256\";",
    "let webtoolsJwtJweAlg: \"dir\" | \"A256KW\" = \"dir\";",
    "let webtoolsJwtJweEnc: \"A256GCM\" | \"A128GCM\" = \"A256GCM\";",
    "let webtoolsJwtVerified: boolean | null = null;",
    "let webtoolsJwtInfo = \"\";",
    "let webtoolsJwtAutoTimer: number | null = null;",
    "let webtoolsJwtSignTimer: number | null = null;",
    "let webtoolsJwtRequestToken = 0;",
    "let webtoolsStringsInput = \"hello_world_variable\";",
    "let webtoolsStringsCaseType = \"camel\";",
    "let webtoolsStringsOutput = \"\";",
    "let webtoolsStringsUuidCount = 5;",
    "let webtoolsStringsUuidItems: string[] = [];",
    "let webtoolsColorsInput = \"#6c5ce7\";",
    "let webtoolsColorsHex = \"#6c5ce7\";",
    "let webtoolsColorsRgb = \"rgb(108, 92, 231)\";",
    "let webtoolsColorsHsl = \"hsl(247, 74%, 63%)\";",
    "let webtoolsColorsShades: string[] = [];",
    "let webtoolsColorsAutoTimer: number | null = null;",
    "let webtoolsColorsRequestToken = 0;",
    "const WEBTOOLS_COLORS_PRESETS = [",
    "const WEBTOOLS_REGEX_DEFAULT_PATTERN =",
    "const WEBTOOLS_REGEX_DEFAULT_INPUT =",
    "const WEBTOOLS_REGEX_SAFE_FLAGS = \"gimsuyd\";",
    "const WEBTOOLS_REGEX_TEMPLATES = [",
    "const WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS = \"!@#$%^&*\";",
    "const WEBTOOLS_JWT_DEFAULT_SECRET = \"your-256-bit-secret\";",
    "const WEBTOOLS_JWT_SAMPLE_TOKEN =",
    "const WEBTOOLS_JWT_SAMPLE_HEADER = `",
    "const WEBTOOLS_JWT_SAMPLE_PAYLOAD = `",
    "function tryParseWebtoolsUrl(input: string): URL | null {"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });

  [
    /let webtoolsPasswordOptions: WebtoolsPasswordOptions = \{/,
    /let webtoolsJsonState: WebtoolsJsonState = \{/,
    /const DEFAULT_WEBTOOLS_URL_INPUT =/,
    /function createEmptyWebtoolsUrlParts\(\): WebtoolsUrlParts \{/,
    /let webtoolsUrlState: WebtoolsUrlState = \{/,
    /let webtoolsDiffLeft = "";/,
    /let webtoolsTimestampUnixInput = "";/,
    /let webtoolsRegexPattern =/,
    /let webtoolsCryptoAlgorithm = "MD5";/,
    /let webtoolsJwtToken = "";/,
    /let webtoolsStringsInput = "hello_world_variable";/,
    /let webtoolsColorsInput = "#6c5ce7";/,
    /const WEBTOOLS_COLORS_PRESETS = \[/,
    /const WEBTOOLS_REGEX_DEFAULT_PATTERN =/,
    /const WEBTOOLS_PASSWORD_DEFAULT_SYMBOLS = "!@#\$%\^&\*";/,
    /const WEBTOOLS_JWT_DEFAULT_SECRET = "your-256-bit-secret";/,
    /const WEBTOOLS_JWT_SAMPLE_TOKEN =/,
    /function tryParseWebtoolsUrl\(input: string\): URL \| null \{/
  ].forEach((pattern) => {
    assert.match(
      panelImplsSource,
      pattern,
      `${pattern} should live in plugin-panel-impls`
    );
  });
});

test("plugin-specific type declarations live outside renderer.ts", () => {
  const rendererSource = readRendererSource();
  const pluginRuntimeTypesSource = readPluginRuntimeTypesSource();

  [
    "interface WebtoolsPasswordOptions {",
    "interface WebtoolsJsonState {",
    "interface WebtoolsUrlState {",
    "type WebtoolsDiffRowType =",
    "interface WebtoolsRegexMatchRow {",
    "interface WebtoolsImagePromptState {",
    "interface HardwareInspectorSnapshot {",
    "type WebtoolsUnitTab =",
    "interface PasswordPanelPayload {",
    "interface GenericPluginPanelPayload {",
    "interface ActivePluginPanelState {",
    "interface PluginPanelHandler {",
    "interface CashflowState {",
    "interface CashflowReports {",
    "interface CashflowJobOption {"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
    assert.equal(
      pluginRuntimeTypesSource.includes(signature),
      true,
      `${signature} should live in plugin-runtime-types.d.ts`
    );
  });
});

test("renderer plugin constants are consumed from plugin-constants instead of duplicated inline", () => {
  const rendererSource = readRendererSource();

  assert.match(
    rendererSource,
    /const pluginConstants = window\.__LL_PLUGIN_CONSTANTS__;/,
    "renderer should read plugin constants from the shared bootstrap global"
  );
  assert.match(
    rendererSource,
    /const \{[\s\S]*DEFAULT_VISIBLE_PLUGIN_IDS[\s\S]*\} = pluginConstants;/,
    "renderer should destructure plugin ids and default visible plugins from the shared constant bag"
  );

  [
    'const CASHFLOW_PLUGIN_ID = "cashflow-game";',
    'const CLIPBOARD_WORKBENCH_PLUGIN_ID = "clipboard-workbench";',
    'const WEBTOOLS_PASSWORD_PLUGIN_ID = "webtools-password";',
    'const WEBTOOLS_API_PLUGIN_ID = "webtools-api-client";',
    "const DEFAULT_VISIBLE_PLUGIN_IDS = ["
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain duplicated inline in renderer.ts`
    );
  });
});

test("Clipboard Workbench panel is implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();

  assert.match(
    panelImplsSource,
    /\[CLIPBOARD_WORKBENCH_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "Clipboard Workbench handler should render through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /getRegisteredPanelImpls\(\)\.applyClipboardWorkbenchPanelPayload\(panel\)/,
    "Clipboard Workbench handler should apply payload through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.clipboard-workbench-form"\s*\)/s,
    "Clipboard Workbench handler should wire Enter to the panel form"
  );
  assert.equal(
    rendererSource.includes("function renderClipboardWorkbenchPanel"),
    false,
    "Clipboard Workbench render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function applyClipboardWorkbenchPanelPayload"),
    false,
    "Clipboard Workbench apply implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /renderClipboardWorkbenchPanel\(\): void/,
    "Clipboard Workbench render implementation should be present in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /applyClipboardWorkbenchPanelPayload\(panel: ActivePluginPanelState\): void/,
    "Clipboard Workbench payload applier should be present in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /clipboard-workbench-preview-image/,
    "Clipboard Workbench should render a dedicated image preview element"
  );
  assert.match(
    panelImplsSource,
    /activeItem\.assetUrl/,
    "Clipboard Workbench image preview should use a resolved asset url"
  );
  assert.match(
    panelImplsSource,
    /clipboard-workbench-item-thumb/,
    "Clipboard Workbench item list should render image thumbnails"
  );
  assert.match(
    panelImplsSource,
    /clipboard-workbench-item-copy/,
    "Clipboard Workbench item list should expose per-row copy actions"
  );
  assert.match(
    panelImplsSource,
    /剪贴板工作台/,
    "Clipboard Workbench panel should use localized Chinese copy"
  );
  assert.match(
    panelImplsSource,
    /label: "最近"/,
    "Clipboard Workbench scopes should expose localized Chinese labels"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-shell/,
    "Clipboard Workbench shell styles should be present"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-item-summary[\s\S]*overflow-wrap:\s*anywhere;/,
    "Clipboard Workbench summaries should wrap long unbroken content"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-item-preview[\s\S]*overflow-wrap:\s*anywhere;/,
    "Clipboard Workbench previews should wrap long unbroken content"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-panel[\s\S]*height:\s*min\(88vh,\s*920px\);/,
    "Clipboard Workbench panel should cap its height for compact browsing"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-list,\s*[\s\S]*\.clipboard-workbench-detail[\s\S]*overflow:\s*auto;/,
    "Clipboard Workbench content panes should scroll internally"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-manual-text[\s\S]*max-height:\s*32px;/,
    "Clipboard Workbench draft box should stay compact by default"
  );
});

test("Clipboard Workbench selection updates detail without rebuilding the whole panel", () => {
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /function updateClipboardWorkbenchActiveItem\(/,
    "clipboard workbench should expose a lightweight active-item updater"
  );
  assert.match(
    panelImplsSource,
    /function syncClipboardWorkbenchSelectionUi\(/,
    "clipboard workbench should expose a partial selection refresh helper"
  );
  assert.match(
    panelImplsSource,
    /updateClipboardWorkbenchActiveItem\(previousActiveId, item\.id\);/,
    "item selection should avoid renderList when the panel is already mounted"
  );
  assert.match(
    panelImplsSource,
    /refreshClipboardWorkbenchPanelAfterPayload\(previousItems, action\);/,
    "clipboard workbench actions should only fully rerender when item structure changes"
  );
});

test("Clipboard Workbench visible copy is localized for the plugin UI", () => {
  const panelImplsSource = readPanelImplsSource();
  const renderSource = extractMethodSource(panelImplsSource, "renderClipboardWorkbenchPanel");
  const timeSource = extractFunctionSource(panelImplsSource, "formatClipboardWorkbenchTime");
  const kindSource = extractFunctionSource(panelImplsSource, "getClipboardWorkbenchKindLabel");
  const sourceLabelSource = extractFunctionSource(
    panelImplsSource,
    "getClipboardWorkbenchSourceLabel"
  );
  const previewSource = extractFunctionSource(
    panelImplsSource,
    "getClipboardWorkbenchItemPreview"
  );

  assert.match(
    panelImplsSource,
    /const CLIPBOARD_WORKBENCH_SCOPE_OPTIONS = \[[\s\S]*key: "all", label: "全部"[\s\S]*key: "recent", label: "最近"[\s\S]*key: "favorites", label: "收藏"[\s\S]*key: "pinned", label: "置顶"[\s\S]*key: "text", label: "文本"[\s\S]*key: "image", label: "图片"[\s\S]*key: "files", label: "文件"[\s\S]*key: "screenshots", label: "截图"/,
    "Clipboard Workbench scope filters should use Chinese labels"
  );
  assert.equal(
    renderSource.includes("Image preview available"),
    false,
    "Clipboard Workbench should not keep English preview copy"
  );
  assert.equal(
    renderSource.includes("Unknown"),
    false,
    "Clipboard Workbench should not keep English fallback time copy"
  );
  assert.match(
    kindSource,
    /return "图片"[\s\S]*return "文件"[\s\S]*return "文本"/,
    "Clipboard Workbench kind labels should be localized"
  );
  assert.match(
    sourceLabelSource,
    /return "手动保存"[\s\S]*return "截图采集"[\s\S]*return "自动采集"/,
    "Clipboard Workbench source labels should be localized"
  );
  assert.match(
    previewSource,
    /return count > 0 \? `\$\{count\} 个文件路径` : item\.summary;[\s\S]*return item\.assetUrl \? "可预览图片" : item\.summary;/,
    "Clipboard Workbench preview summaries should be localized"
  );
  assert.match(
    timeSource,
    /return "未知时间";/,
    "Clipboard Workbench fallback time should be localized"
  );
});

test("Clipboard Workbench enter flow stays inside plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.clipboard-workbench-form"\s*\)/s,
    "Clipboard Workbench Enter handler should submit the panel form instead of keeping renderer-local refresh logic"
  );
  assert.doesNotMatch(
    rendererSource,
    /\[CLIPBOARD_WORKBENCH_PLUGIN_ID\]:\s*\{[\s\S]*onEnter:\s*runWithPluginForm\("form\.clipboard-workbench-form",\s*\(\)\s*=>\s*\{[\s\S]*executeClipboardWorkbenchAction\("refresh"\);/s,
    "Clipboard Workbench handler should not keep a renderer-local refresh action"
  );
  assert.match(
    panelImplsSource,
    /form\.addEventListener\("submit",\s*\(event\)\s*=>\s*\{[\s\S]*event\.preventDefault\(\);[\s\S]*void executeClipboardWorkbenchAction\(\s*"refresh",[\s\S]*buildClipboardWorkbenchQueryParams\(\)[\s\S]*\);[\s\S]*\}\);/s,
    "Clipboard Workbench form submit should trigger refresh inside plugin-panel-impls"
  );
});

test("CodeAgent Switch selection updates list and detail without rebuilding the whole panel", () => {
  const panelImplsSource = readPanelImplsSource();

  assert.match(panelImplsSource, /function syncCodeAgentSwitchSelectionUi\(/);
  assert.match(
    panelImplsSource,
    /syncCodeAgentSwitchSelectionUi\(\);/
  );
  assert.match(
    panelImplsSource,
    /shell\.replaceChild\(nextListPanel, currentListPanel\);/
  );
  assert.match(
    panelImplsSource,
    /shell\.replaceChild\(nextDetailPanel, currentDetailPanel\);/
  );
});

test("CodeAgent Switch panel is implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();
  const handlerConfigSource = fs.readFileSync(
    path.join(process.cwd(), "src", "renderer", "plugin-handler-config.ts"),
    "utf8"
  );

  assert.equal(
    rendererSource.includes("function renderCodeAgentSwitchPanel"),
    false,
    "CodeAgent Switch render implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /\[CODEAGENT_SWITCH_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "CodeAgent Switch handler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.codeagent-switch-form"\s*\)/s,
    "CodeAgent Switch Enter handler should submit the panel form instead of keeping custom renderer-side read logic"
  );
  assert.doesNotMatch(
    rendererSource,
    /\[CODEAGENT_SWITCH_PLUGIN_ID\]:\s*\{[\s\S]*onEnter:\s*runWithPluginForm\("form\.codeagent-switch-form",\s*\(\)\s*=>\s*\{[\s\S]*const launcher = getLauncherApi\(\);/s,
    "CodeAgent Switch handler should not keep a renderer-local launcher bridge block"
  );
  assert.match(panelImplsSource, /renderCodeAgentSwitchPanel\(\): void/);
  assert.match(panelImplsSource, /applyCodeAgentSwitchPanelPayload\(panel: unknown\): void/);
  assert.match(
    panelImplsSource,
    /form\.addEventListener\("submit",\s*\(event\)\s*=>\s*\{[\s\S]*event\.preventDefault\(\);[\s\S]*void executeCodeAgentSwitchAction\("read"\);[\s\S]*\}\);/s,
    "CodeAgent Switch form submit should trigger a read action inside plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchAction\("preview", selectedProfile\.id\)/,
    "CodeAgent Switch profile detail should expose preview actions"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchAction\("apply", selectedProfile\.id\)/,
    "CodeAgent Switch profile detail should expose safe apply actions"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-list-switch-actions/,
    "CodeAgent Switch profile rows should keep inline preview/apply actions visible from the list"
  );
  assert.match(
    panelImplsSource,
    /createCodeAgentSwitchPreviewSection\(\)/,
    "CodeAgent Switch profile detail should expose the shared preview section for diff-based apply flows"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-detail-hero-actions/,
    "CodeAgent Switch profile detail should put preview/apply actions in the visible hero area"
  );
  assert.match(
    panelImplsSource,
    /设为当前/,
    "CodeAgent Switch should label switching as setting the selected profile current"
  );
  assert.match(
    panelImplsSource,
    /deriveCodeAgentSwitchEnvKeyName/,
    "CodeAgent Switch should derive env_key names instead of forcing manual env_key entry"
  );
  assert.match(
    panelImplsSource,
    /deriveCodeAgentSwitchProviderName/,
    "CodeAgent Switch should derive provider display names instead of requiring users to type names"
  );
  assert.match(
    panelImplsSource,
    /makeUniqueCodeAgentSwitchId/,
    "CodeAgent Switch should prefill a non-conflicting Provider ID for new providers"
  );
  assert.match(
    panelImplsSource,
    /providerApiKey/,
    "CodeAgent Switch provider editor should accept a non-persisted API key value for copyable commands"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchSetProviderKey/,
    "CodeAgent Switch provider editor should write API keys into the user environment from the panel"
  );
  assert.match(
    panelImplsSource,
    /set-provider-key/,
    "CodeAgent Switch should expose a command action for writing provider keys"
  );
  assert.match(
    panelImplsSource,
    /写入系统 Key/,
    "CodeAgent Switch should make direct system key writing the primary key action"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-key-box/,
    "CodeAgent Switch provider editor should expose key setup as a dedicated section"
  );
  assert.match(
    panelImplsSource,
    /profileName/,
    "CodeAgent Switch profile editor should expose a separate config-group display name field"
  );
  assert.match(
    panelImplsSource,
    /profile\.name \|\| profile\.id/,
    "CodeAgent Switch should prefer the config-group display name in list and detail titles"
  );
  assert.match(
    panelImplsSource,
    /Provider \/ Key/,
    "CodeAgent Switch should keep a visible Provider/Key entry point from the config-group workflow"
  );
  assert.match(
    panelImplsSource,
    /当前 Provider \/ Key/,
    "CodeAgent Switch current-config actions should make it obvious that Provider\/Key edits belong to the active provider"
  );
  assert.match(
    panelImplsSource,
    /buildCodeAgentSwitchPowerShellUserEnvScript/,
    "CodeAgent Switch should generate provider key PowerShell commands through the shared safe script builder"
  );
  assert.equal(
    panelImplsSource.includes("const escapedValue = apiKey.replace(/'/g, \"''\")"),
    false,
    "CodeAgent Switch should not interpolate raw API key text directly into PowerShell snippets"
  );
  assert.match(
    panelImplsSource,
    /selectCodeAgentSwitchDetail\("provider"/,
    "CodeAgent Switch should let users jump into Provider detail from the config-group UI so the key editor stays discoverable"
  );
  assert.match(
    panelImplsSource,
    /let codeAgentSwitchCopyState:\s*""\s*\|\s*"env"\s*\|\s*"diagnostics"\s*\|\s*"diff"\s*\|\s*"key"\s*=\s*"";/,
    "CodeAgent Switch should keep env, diagnostics, diff, and key copy feedback separate"
  );
  assert.equal(
    panelImplsSource.includes('getCodeAgentSwitchFormValue(container, "providerEnvKey")'),
    false,
    "CodeAgent Switch should not ask users to manually type env_key names"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-diff/,
    "CodeAgent Switch should render a diff preview block"
  );
  assert.match(
    panelImplsSource,
    /copyCodeAgentSwitchText\(\s*"diff"/,
    "CodeAgent Switch should allow copying the generated preview diff directly"
  );
  assert.match(
    panelImplsSource,
    /copyCodeAgentSwitchText\(\s*"diagnostics"/,
    "CodeAgent Switch should expose diagnostic copy feedback"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchAction\("backups"\)/,
    "CodeAgent Switch should expose backup refresh actions"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchAction\("restore", undefined, backup\.id\)/,
    "CodeAgent Switch should expose restore actions for backup entries"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-backups/,
    "CodeAgent Switch should render a backup list section"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-tool-sidebar/,
    "CodeAgent Switch should expose a fixed-width tool sidebar for Codex and planned adapters"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-shell/,
    "CodeAgent Switch should render an app-like shell"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-profile-list/,
    "CodeAgent Switch should always render the config-group section so users can discover where config groups live"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-current-actions/,
    "CodeAgent Switch should move empty config-group actions into the current config card instead of showing a large empty list"
  );
  assert.match(
    panelImplsSource,
    /当前还没有配置组/,
    "CodeAgent Switch should explain the empty config-group state instead of hiding the whole section"
  );
  assert.match(
    panelImplsSource,
    /Root 配置|Root 閰嶇疆/,
    "CodeAgent Switch empty-state copy should explain that the current live setup still comes from the Root config"
  );
  assert.match(
    panelImplsSource,
    /从当前配置生成配置组/,
    "CodeAgent Switch should expose a direct create-from-current-config action when there are no standalone config groups yet"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /当前配置还没有 Profile|当前还没有 Profile 预设/,
    "CodeAgent Switch should not keep the old empty Profile wording once config groups become the primary object"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /createCodeAgentSwitchProviderSwitchSection/,
    "CodeAgent Switch should not keep a duplicate provider-side target selector once detail actions own preview/apply"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-detail-primary-actions/,
    "CodeAgent Switch profile detail should keep preview/apply controls in the primary action section"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-detail-section/,
    "CodeAgent Switch detail pages should be split into grouped sections"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-current-card/,
    "CodeAgent Switch should surface the active config as a scan-friendly current card"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-detail-overview/,
    "CodeAgent Switch detail pages should show a read-only overview before editing"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-state-badge/,
    "CodeAgent Switch should distinguish selected and active states with explicit badges"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-detail-primary-actions/,
    "CodeAgent Switch profile detail should keep preview/apply actions visually primary"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-danger-zone/,
    "CodeAgent Switch delete actions should live in a danger zone"
  );
  assert.match(
    panelImplsSource,
    /codeAgentSwitchData\.active/,
    "CodeAgent Switch should render the active provider/profile summary"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchSaveProvider/,
    "CodeAgent Switch should expose provider save actions"
  );
  assert.match(
    panelImplsSource,
    /providerEnvKeyInstructions/,
    "CodeAgent Switch provider editor should expose env_key_instructions"
  );
  assert.match(
    panelImplsSource,
    /providerHttpHeaders/,
    "CodeAgent Switch provider editor should expose http_headers"
  );
  assert.match(
    panelImplsSource,
    /providerEnvHttpHeaders/,
    "CodeAgent Switch provider editor should expose env_http_headers"
  );
  assert.match(
    panelImplsSource,
    /providerQueryParams/,
    "CodeAgent Switch provider editor should expose query_params"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchDeleteProvider/,
    "CodeAgent Switch should expose provider delete actions"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchSaveProfile/,
    "CodeAgent Switch should expose profile save actions"
  );
  assert.match(
    panelImplsSource,
    /profilePlanReasoning/,
    "CodeAgent Switch profile editor should expose plan_mode_reasoning_effort"
  );
  assert.match(
    panelImplsSource,
    /profileReasoningSummary/,
    "CodeAgent Switch profile editor should expose model_reasoning_summary"
  );
  assert.match(
    panelImplsSource,
    /profileVerbosity/,
    "CodeAgent Switch profile editor should expose model_verbosity"
  );
  assert.match(
    panelImplsSource,
    /profileServiceTier/,
    "CodeAgent Switch profile editor should expose service_tier"
  );
  assert.match(
    panelImplsSource,
    /profileWebSearch/,
    "CodeAgent Switch profile editor should expose web_search"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-runtime/,
    "CodeAgent Switch should expose a root config section"
  );
  assert.match(
    panelImplsSource,
    /save-runtime/,
    "CodeAgent Switch should support saving root config"
  );
  assert.match(
    panelImplsSource,
    /runtimeModel/,
    "CodeAgent Switch root editor should expose the root model field"
  );
  assert.match(
    panelImplsSource,
    /runtimeReviewModel/,
    "CodeAgent Switch root editor should expose the root review model field"
  );
  assert.match(
    panelImplsSource,
    /runtimeReasoningSummary/,
    "CodeAgent Switch root editor should expose the root reasoning summary field"
  );
  assert.match(
    panelImplsSource,
    /runtimeHistoryPersistence/,
    "CodeAgent Switch root editor should expose the root history persistence field"
  );
  assert.match(
    panelImplsSource,
    /runtimePersonality/,
    "CodeAgent Switch root editor should expose the root personality field"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-editor-group/,
    "CodeAgent Switch root editor should group related Root fields for readability"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-editor-group-title/,
    "CodeAgent Switch root editor should render visible group titles"
  );
  assert.match(
    panelImplsSource,
    /模型与接入|推理与上下文|安全与权限|历史与平台/,
    "CodeAgent Switch root editor should label grouped Root sections"
  );
  assert.match(
    panelImplsSource,
    /完整\s*config\.toml/,
    "CodeAgent Switch root preview copy should describe the full saved config.toml"
  );
  assert.match(
    panelImplsSource,
    /保存 Root 配置|Save Provider \+ Root/,
    "CodeAgent Switch actions should describe Root config saving semantics"
  );
  assert.match(
    panelImplsSource,
    /已保存 Codex Provider \+ Root 配置|已保存 Codex Root 配置/,
    "CodeAgent Switch status copy should clearly distinguish combined Provider + Root saves from Root-only saves"
  );
  assert.match(
    panelImplsSource,
    /rootChangedFields|最近更新|createCodeAgentSwitchStateBadge/,
    "CodeAgent Switch root preview should surface a recent Root field change summary after saves"
  );
  assert.match(
    panelImplsSource,
    /save-provider-runtime/,
    "CodeAgent Switch provider detail should support saving provider and root config together"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchSaveProviderAndRuntime/,
    "CodeAgent Switch should expose a combined provider+root save helper"
  );
  assert.match(
    panelImplsSource,
    /createCodeAgentSwitchProviderEditor\(selectedProvider,\s*\{\s*showSaveButton:\s*false\s*\}\)/,
    "CodeAgent Switch provider detail should hide the nested provider save button and rely on the shared action"
  );
  assert.match(
    panelImplsSource,
    /createCodeAgentSwitchRuntimeEditor\(config,\s*\{\s*showSaveButton:\s*false\s*\}\)/,
    "CodeAgent Switch provider detail should hide the nested root save button and rely on the shared action"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchDeleteProfile/,
    "CodeAgent Switch should expose profile delete actions"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-active-pill/,
    "CodeAgent Switch should mark active providers and matching profiles visibly"
  );
  assert.match(
    panelImplsSource,
    /codeAgentSwitchSelectedKind/,
    "CodeAgent Switch should keep an explicit selected Provider/Profile state"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-master-detail/,
    "CodeAgent Switch should use a master-detail layout"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-list-panel/,
    "CodeAgent Switch should render compact config lists"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-detail-panel/,
    "CodeAgent Switch should edit providers and profiles in the detail pane"
  );
  assert.match(
    panelImplsSource,
    /dataset\.selected/,
    "CodeAgent Switch list rows should expose visible selected state"
  );
  assert.equal(
    panelImplsSource.includes("item.append(body, createCodeAgentSwitchProviderEditor(provider), actions)"),
    false,
    "CodeAgent Switch provider list rows should not contain inline editors"
  );
  assert.equal(
    panelImplsSource.includes("item.append(body, createCodeAgentSwitchProfileEditor(profile, providers), actions)"),
    false,
    "CodeAgent Switch profile list rows should not contain inline editors"
  );
  assert.equal(
    panelImplsSource.includes("grid.append(providerSection, profileSection);"),
    false,
    "CodeAgent Switch should not keep the old provider/profile grid mounted"
  );
  assert.equal(
    panelImplsSource.includes("grid.dataset.legacy"),
    false,
    "CodeAgent Switch should not keep legacy provider/profile list construction in V2"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-editor-grid/,
    "CodeAgent Switch should render compact edit forms for providers and profiles"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-editor-field > span[\s\S]*overflow-wrap:\s*anywhere;/,
    "CodeAgent Switch editor labels should wrap instead of overlapping"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-runtime-editor \.codeagent-switch-editor-field[\s\S]*grid-template-rows:\s*minmax\(28px,\s*auto\)\s+minmax\(30px,\s*auto\)\s+minmax\(27px,\s*auto\);/,
    "CodeAgent Switch root editor should reserve consistent rows for label, control, and hint alignment"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-status\[data-state="ok"\]/,
    "CodeAgent Switch should expose a dedicated success-state style for saved Root and Provider updates"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-root-change-list|\.codeagent-switch-root-preview-summary/,
    "CodeAgent Switch should style Root change summaries and field badges in the preview panel"
  );
  assert.match(
    stylesSource,
    /grid-template-columns:\s*112px\s+minmax\(220px,\s*0\.58fr\)\s+minmax\(360px,\s*1\.42fr\)/,
    "CodeAgent Switch shell should reserve a fixed-width tool sidebar and give more room to detail"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-tool-button/,
    "CodeAgent Switch tool buttons should be fixed sidebar buttons instead of auto-stretched tabs"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-list-panel[\s\S]*position:\s*sticky;/,
    "CodeAgent Switch provider list should remain visible while the detail pane scrolls"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-detail-hero[\s\S]*position:\s*sticky;/,
    "CodeAgent Switch detail hero should keep the selected provider/profile context pinned while scrolling"
  );
  assert.match(
    handlerConfigSource,
    /CODEAGENT_SWITCH_PLUGIN_ID/,
    "CodeAgent Switch should have handler config for Enter behavior"
  );
});

test("core webtools panel handlers use plugin-panel-impls without renderer delegates", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const migratedPanels = [
    ["Diff", "WEBTOOLS_DIFF_PLUGIN_ID"],
    ["Config", "WEBTOOLS_CONFIG_PLUGIN_ID"],
    ["Sql", "WEBTOOLS_SQL_PLUGIN_ID"],
    ["Crypto", "WEBTOOLS_CRYPTO_PLUGIN_ID"],
    ["Jwt", "WEBTOOLS_JWT_PLUGIN_ID"]
  ] as const;

  for (const [panelName, pluginIdConstant] of migratedPanels) {
    assert.match(
      panelImplsSource,
      new RegExp(`\\[${pluginIdConstant}\\]:\\s*createSubmitPluginPanelHandler\\(`),
      `${panelName} handler should render through panelImplsSafe`
    );
    assert.match(
      panelImplsSource,
      new RegExp(`getRegisteredPanelImpls\\(\\)\\.applyWebtools${panelName}PanelPayload\\(panel\\)`),
      `${panelName} handler should apply payload through panelImplsSafe`
    );
    assert.equal(
      rendererSource.includes(`function renderWebtools${panelName}Panel`),
      false,
      `${panelName} render implementation should live outside renderer.ts`
    );
    assert.match(
      panelImplsSource,
      new RegExp(`renderWebtools${panelName}Panel\\(\\): void`),
      `${panelName} render implementation should be present in plugin-panel-impls`
    );
  }

  assert.equal(
    panelImplsSource.includes('getPanelDelegate("applyWebtoolsCryptoPanelPayload")'),
    false,
    "Crypto panel should not delegate back to renderer.ts"
  );
  assert.equal(
    panelImplsSource.includes('getPanelDelegate("renderWebtoolsCryptoPanel")'),
    false,
    "Crypto render should not delegate back to renderer.ts"
  );
  assert.equal(
    panelImplsSource.includes('getPanelDelegate("applyWebtoolsJwtPanelPayload")'),
    false,
    "JWT panel should not delegate back to renderer.ts"
  );
  assert.equal(
    panelImplsSource.includes('getPanelDelegate("renderWebtoolsJwtPanel")'),
    false,
    "JWT render should not delegate back to renderer.ts"
  );
  assert.equal(
    rendererSource.includes("window.__LL_PANEL_DELEGATES__"),
    false,
    "renderer.ts should not expose panel delegate callbacks"
  );
});

test("shared webtools layouts stay compact instead of stretching cards edge to edge", () => {
  const stylesSource = readRendererStylesSource();
  const commonPanelStylesSource = readCommonPanelStylesSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    commonPanelStylesSource,
    /Keep plugin operations compact/,
    "plugin panels should share one compact operation-density layer"
  );
  assert.match(
    commonPanelStylesSource,
    /\.webtools-config-bar\s*\{[\s\S]*padding:\s*7px 8px;/,
    "large conversion toolbars should use compact padding"
  );
  assert.match(
    commonPanelStylesSource,
    /\.hardware-inspector-actions/,
    "complex non-webtools plugins should participate in compact action sizing"
  );
  assert.match(
    panelImplsSource,
    /hardware-inspector-more/,
    "hardware export and diagnostic actions should use a compact more menu"
  );
  assert.match(
    commonPanelStylesSource,
    /\.codeagent-switch-list-switch-actions/,
    "CodeAgent list actions should participate in compact action sizing"
  );
  assert.match(
    panelImplsSource,
    /toolbarHead\.appendChild\(toolbarStats\)/,
    "Clipboard Workbench should keep compact metrics beside its title instead of reserving another toolbar row"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-toolbar-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(280px,\s*1fr\)\s+auto;/,
    "Clipboard Workbench search and common actions should share one wide-screen row"
  );

  assert.match(
    stylesSource,
    /\.webtools-tool-editors\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(280px,\s*420px\)\)/,
    "shared webtools editor pairs should use bounded columns instead of full-width 1fr tracks"
  );
  assert.match(
    stylesSource,
    /\.webtools-config-editors\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(280px,\s*420px\)\)/,
    "config editors should keep bounded pane widths"
  );
  assert.match(
    stylesSource,
    /\.webtools-unit-grid\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(132px,\s*176px\)\)/,
    "unit result cards should not auto-stretch across the full row"
  );
  assert.match(
    panelImplsSource,
    /webtools-unit-grid/,
    "unit tool should render the dedicated storage results grid instead of only a loose input stack"
  );
  assert.match(
    panelImplsSource,
    /webtools-unit-card/,
    "unit tool should render reusable result cards for converted values"
  );
  assert.match(
    panelImplsSource,
    /webtools-unit-copy-btn/,
    "unit tool should expose per-result copy actions instead of leaving card actions unused"
  );
  assert.match(
    panelImplsSource,
    /webtools-unit-screen-grid/,
    "unit tool should render the px\/rem summary grid instead of only the raw dual input row"
  );
  assert.match(
    stylesSource,
    /\.webtools-ua-grid\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(180px,\s*240px\)\)/,
    "UA cards should keep compact widths"
  );
  assert.match(
    stylesSource,
    /\.webtools-image-prompt-preset-options\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(136px,\s*188px\)\)/,
    "image prompt preset chips should use bounded widths"
  );
  assert.match(
    stylesSource,
    /\.webtools-config-bar\s*\{[\s\S]*width:\s*fit-content;/,
    "config top toolbar should hug its contents instead of spanning the full row"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-colors-layout,\s*[\s\S]*\.webtools-image-base64-layout[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "colors and image-base64 layouts should stack into one readable column on narrow windows"
  );
  assert.match(
    panelImplsSource,
    /webtools-colors-header/,
    "colors tool should render the dedicated header instead of a loose preview block"
  );
  assert.match(
    panelImplsSource,
    /webtools-colors-layout/,
    "colors tool should use the two-column lab layout that already has responsive support"
  );
  assert.match(
    panelImplsSource,
    /webtools-colors-palette/,
    "colors tool should render preset swatches instead of leaving palette styles unused"
  );
  assert.match(
    panelImplsSource,
    /webtools-colors-output-list/,
    "colors tool should render structured hex\/rgb\/hsl output rows"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-base64-header/,
    "image base64 tool should render its dedicated header instead of loose top-row buttons"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-base64-toolbar/,
    "image base64 tool should group copy and download actions inside the compact toolbar"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-base64-layout/,
    "image base64 tool should use the two-column preview and editor layout that already has responsive support"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-base64-editor/,
    "image base64 tool should restore the structured editor column instead of loose textareas"
  );
  assert.match(
    panelImplsSource,
    /function readWebtoolsImageBase64FileAsDataUrl\(file: File\): Promise<string>/,
    "image base64 tool should keep its local file reader helper with the panel implementation"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-markdown-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "markdown preview should collapse into a single vertical flow on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-regex-layout\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "regex editor and preview should stack when the window narrows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-regex-match-list\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "regex match cards should also stack into one column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-config-bar\s*\{[\s\S]*width:\s*100%/,
    "config toolbar should fill the row instead of floating as a wide loose pill on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-config-editors\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "config editor panes should stack into one column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-url-query-header,\s*[\s\S]*\.webtools-url-query-row\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "URL query rows should stack into one column on narrow windows"
  );
  assert.match(
    panelImplsSource,
    /createWebtoolsUrlPartField\("协议", "protocol"\)/,
    "URL tool should localize the protocol field label"
  );
  assert.match(
    panelImplsSource,
    /createWebtoolsUrlPartField\("主机", "host"\)/,
    "URL tool should localize the host field label"
  );
  assert.match(
    panelImplsSource,
    /createWebtoolsUrlPartField\("端口", "port"\)/,
    "URL tool should localize the port field label"
  );
  assert.match(
    panelImplsSource,
    /createWebtoolsUrlPartField\("锚点", "hash", true\)/,
    "URL tool should localize the hash fragment field label"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-strings-uuid-item\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "string UUID rows should stop stretching into uneven columns on narrow windows"
  );
  assert.match(
    panelImplsSource,
    /webtools-strings-header/,
    "string tool should render a real header instead of a loose textarea row"
  );
  assert.match(
    panelImplsSource,
    /webtools-strings-section/,
    "string tool should split case conversion and UUID generation into separate sections"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /webtools-strings-button-grid/,
    "string tool should not expand mutually exclusive case formats into a full button deck"
  );
  assert.match(
    panelImplsSource,
    /webtools-strings-case-select-field/,
    "string tool should keep case formats in a labeled compact select"
  );
  assert.match(
    stylesSource,
    /\.webtools-strings-case-select\s*\{[\s\S]*display:\s*block;[\s\S]*width:\s*min\(260px,\s*100%\)/,
    "string case selection should stay visible and bounded instead of consuming a button row"
  );
  assert.match(
    panelImplsSource,
    /webtools-strings-uuid-results/,
    "string tool should render a visible UUID results list"
  );
  assert.match(
    panelImplsSource,
    /webtools-strings-uuid-item/,
    "string tool should render UUID result rows with a stable layout hook"
  );
  assert.match(
    panelImplsSource,
    /convert\.textContent = "转换"/,
    "string tool should use Chinese primary action copy instead of the leftover Convert label"
  );
  assert.match(
    panelImplsSource,
    /uuid\.textContent = "生成 UUID"/,
    "string tool should label UUID generation clearly in Chinese"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-crypto-editors\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "crypto editors should stack into one column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-jwt-layout\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "JWT encoded and decoded panes should stack on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-api-request\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "API request blocks should collapse into one column on narrow windows"
  );
  assert.match(
    panelImplsSource,
    /webtools-api-request/,
    "API tool should render its dedicated request row instead of loose method/url/button controls"
  );
  assert.match(
    panelImplsSource,
    /webtools-api-preview-row/,
    "API tool should render a labeled preview row for the resolved request URL"
  );
  assert.match(
    panelImplsSource,
    /webtools-api-preview-label/,
    "API tool should label the request preview instead of showing a bare code block"
  );
  assert.match(
    panelImplsSource,
    /webtools-api-response-head/,
    "API tool should restore the response header shell instead of scattering status metrics across the section"
  );
  assert.match(
    panelImplsSource,
    /webtools-api-metrics/,
    "API tool should keep grouped response metrics in the dedicated response header"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-qrcode-layout[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "QR setup and preview should stop trying to hold two columns on narrow windows"
  );
  assert.match(
    panelImplsSource,
    /webtools-qrcode-header/,
    "QR tool should render the dedicated header instead of loose title/info nodes"
  );
  assert.match(
    panelImplsSource,
    /webtools-qrcode-layout/,
    "QR tool should use the two-column setup and preview layout"
  );
  assert.match(
    panelImplsSource,
    /webtools-qrcode-logo-section/,
    "QR tool should render the structured logo settings section"
  );
  assert.match(
    panelImplsSource,
    /webtools-qrcode-actions/,
    "QR tool should group generate and download actions in the dedicated action bar"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-ua-grid,[\s\S]*?\{[\s\S]*grid-template-columns:\s*1fr/,
    "UA detail cards should stack into one readable column on narrow windows"
  );
  assert.match(
    panelImplsSource,
    /webtools-ua-header/,
    "UA tool should render the dedicated header instead of loose top-row buttons"
  );
  assert.match(
    panelImplsSource,
    /webtools-ua-actions/,
    "UA tool should group current, clear, and copy actions in the compact action bar"
  );
  assert.match(
    panelImplsSource,
    /webtools-ua-editor/,
    "UA tool should render the editor shell instead of a bare textarea plus info block"
  );
  assert.match(
    panelImplsSource,
    /webtools-ua-input-section/,
    "UA tool should render the labeled input section"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-image-prompt-grid\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "image prompt option grid should stack into one column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-image-prompt-text-controls\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "image prompt text controls should stack instead of leaving wide empty side columns"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*680px\)[\s\S]*\.webtools-image-prompt-header\s*\{[\s\S]*flex-direction:\s*column/,
    "image prompt header should switch to a vertical stack on very narrow widths"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-command-deck/,
    "password tool should render a compact command deck so the first screen looks visibly different"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-metric-strip/,
    "password tool should surface key metrics in a compact header strip instead of a separate side summary card"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-toolbar-row/,
    "password tool should group presets and primary actions into a single toolbar row"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-action-rail/,
    "password tool should dedicate a compact action rail for generate and copy shortcuts"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-control-matrix/,
    "password tool should turn the option area into a compact multi-column control matrix"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-insight-strip/,
    "password tool should place strength, preview, and notes into one tight insight strip"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-results-stage/,
    "password tool should promote the result section into the dominant stage area"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-command-deck\s*\{[\s\S]*display:\s*grid;[\s\S]*gap:\s*8px;/,
    "password tool command deck should frame the header content as a distinct compact block"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-metric-strip\s*\{[\s\S]*grid-template-columns:\s*repeat\(4,\s*minmax\(0,\s*1fr\)\)/,
    "password tool metrics should sit in a single horizontal strip before the controls"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-toolbar-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(260px,\s*0\.92fr\)/,
    "password tool should place presets and primary actions on one compressed toolbar row"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-action-rail\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    "password tool action rail should keep the main actions visible without adding extra rows"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-command-deck\s+\.webtools-password-action-row\s*\.settings-btn\s*\{[\s\S]*min-height:\s*34px;[\s\S]*font-size:\s*11px;/,
    "password top action buttons should shrink so the toolbar feels less bulky"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-control-matrix\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    "password tool should use a three-column control matrix instead of a left-right workbench"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-control-matrix\s*\{[\s\S]*align-items:\s*stretch;/,
    "password tool control matrix should stretch each block so the top input groups align cleanly"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-block\s*\{[\s\S]*grid-template-rows:\s*auto\s+minmax\(0,\s*1fr\);[\s\S]*min-height:\s*100%;/,
    "password option blocks should share the same vertical skeleton instead of drifting by content height"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-block-body\s*\{[\s\S]*display:\s*grid;[\s\S]*align-content:\s*start;/,
    "password option block bodies should pin their controls to the top edge for cleaner alignment"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-preset-strip\s*\{[\s\S]*display:\s*flex;[\s\S]*align-items:\s*center;/,
    "password tool should treat presets as a toolbar strip instead of a stacked card block"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-preset-select/,
    "password presets should use one compact selection control instead of a button deck"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /webtools-password-preset-grid/,
    "password presets should not render an expanded button grid"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-preset-select\s*\{[\s\S]*min-height:\s*30px;/,
    "password preset selection should retain a compact control height"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-flag-grid\s*\{[\s\S]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/,
    "password character toggles should stay in one compact row on desktop"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-symbol-stack\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*0\.92fr\)\s+minmax\(0,\s*1\.08fr\)/,
    "password symbol controls should use a tight dual-column pack instead of a tall vertical stack"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-insight-strip\s*\{[\s\S]*grid-template-columns:\s*minmax\(126px,\s*0\.72fr\)\s+minmax\(220px,\s*1fr\)\s+minmax\(0,\s*1\.28fr\)/,
    "password tool should keep strength, preview, and guidance in one compact insight strip"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-tip-list\s*\{[\s\S]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/,
    "password tips should stay in a compact two-column grid instead of stretching the top area taller"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-table-wrap\s*\{[\s\S]*max-height:\s*min\(600px,\s*64vh\)/,
    "password result area should expose more rows before scrolling"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-results-stage\s*\{[\s\S]*padding-top:\s*4px;/,
    "password result stage should reduce top padding so the table starts closer to the heading"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-results-actions\s*\.settings-btn\s*\{[\s\S]*min-height:\s*20px;/,
    "password result toolbar buttons should stay compact so they do not consume table space"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-table th\s*\{[\s\S]*padding:\s*2px\s+4px;/,
    "password result table header should use tighter padding to fit more rows in view"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-table td\s*\{[\s\S]*padding:\s*1px\s+4px;[\s\S]*height:\s*22px;/,
    "password result rows should use tighter padding and row height so more generated rows stay visible"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-results-stage\s+\.webtools-password-copy-btn\s*\{[\s\S]*min-width:\s*44px;[\s\S]*min-height:\s*20px;[\s\S]*font-size:\s*10px;/,
    "password row copy buttons should shrink with the denser result rows"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-sizing-grid\s*\{[\s\S]*align-items:\s*start;/,
    "password length and count fields should align from the same top baseline as the other input groups"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-field-stack\s*\{[\s\S]*align-content:\s*start;/,
    "password length quick actions should stay anchored to the top instead of floating within the block"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-flag-card\s*\{[\s\S]*min-height:\s*38px;/,
    "password toggle cards should share a consistent compact height across the top control deck"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-copy-btn\s*\{[\s\S]*min-width:\s*48px;[\s\S]*white-space:\s*nowrap;/,
    "password row copy buttons should stay on one line instead of collapsing into vertical text"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-generate-copy-btn/,
    "password tool should support generating and copying the first result in one action"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-copy-all-btn/,
    "password tool should support copying all generated rows"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-copy-numbered-btn/,
    "password tool should support copying numbered generated rows"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-copy-json-btn/,
    "password tool should support copying generated rows as JSON"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-mask-btn/,
    "password tool should support masking generated passwords in the result table"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-symbol-quick/,
    "password tool should expose compact symbol preset shortcuts"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-shell/,
    "JSON/CSV tool should render a compact workbench shell instead of loose full-width rows"
  );
  assert.match(
    panelImplsSource,
    /webtoolsJsonRoutePreset/,
    "JSON/CSV tool should compact common conversion routes into a select"
  );
  assert.match(
    panelImplsSource,
    /webtoolsJsonSample/,
    "JSON/CSV tool should compact quick samples into a select"
  );
  assert.match(
    panelImplsSource,
    /webtoolsJsonCleanAction/,
    "JSON/CSV tool should compact cleaning actions into a select"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-route-presets/,
    "JSON/CSV tool should expose one-click route presets for common conversions"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-sample-strip/,
    "JSON/CSV tool should expose sample input shortcuts to fill empty space with useful actions"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-copy-input-btn/,
    "JSON/CSV tool should support copying the current input"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-use-output-btn/,
    "JSON/CSV tool should support using the output as the next input"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /webtools-json-structure-card/,
    "JSON/CSV tool should not reserve editor space for the removed structure preview"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-validate-btn/,
    "JSON/CSV tool should expose a dedicated validate action"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-clean-actions/,
    "JSON/CSV tool should expose one-click cleaning actions"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-fields-card/,
    "JSON/CSV tool should render a field extraction section"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-field-picker/,
    "JSON/CSV field extraction should use a compact dropdown instead of an expanded chip deck"
  );
  assert.match(
    panelImplsSource,
    /webtools-json-sync/,
    "JSON/CSV tool should refresh compact stats when auto-conversion updates the result"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s+minmax\(0,\s*1fr\)/,
    "JSON/CSV editor panes should fill the available width because the text areas are the main workspace"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-control-panel\s*\{[\s\S]*"converter routes samples clean fields"/,
    "JSON/CSV controls should keep converter, routes, samples, cleaning, and field extraction on one wide row"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-lab\s*\{[\s\S]*grid-template-rows:\s*auto\s+auto\s+minmax\(0,\s*1fr\)\s+auto;/,
    "JSON/CSV form should reserve the remaining height for the editor workspace"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-compact-action\s*\{[\s\S]*display:\s*flex;/,
    "JSON/CSV dropdown actions should keep their select and action button aligned"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-pane\s*\{[\s\S]*display:\s*flex;[\s\S]*flex-direction:\s*column;/,
    "JSON/CSV panes should stack header and textarea as a vertical workspace"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-route-presets,\s*[\s\S]*padding:\s*8px;[\s\S]*border:\s*1px solid rgba\(255,\s*255,\s*255,\s*0\.12\)/,
    "JSON/CSV route and sample groups should be framed as compact cards instead of floating in empty space"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-compact-select\s*\{[\s\S]*min-height:\s*30px;/,
    "JSON/CSV compact operation selects should keep a consistent control height"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-field-picker-menu\s*\{[\s\S]*position:\s*absolute;/,
    "JSON/CSV field choices should open without increasing the operation row height"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-textarea\s*\{[\s\S]*flex:\s*1\s+1\s+auto;[\s\S]*min-height:\s*clamp\(260px,\s*50vh,\s*500px\)/,
    "JSON/CSV textareas should expand like an editor and fill more of the lower panel"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*1180px\)[\s\S]*\.codeagent-switch-master-detail\s*\{[\s\S]*grid-template-columns:\s*96px\s+minmax\(0,\s*1fr\)/,
    "CodeAgent Switch should keep a narrow-width two-column shell before collapsing fully"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*1180px\)[\s\S]*@media \(max-width:\s*860px\)[\s\S]*\.codeagent-switch-master-detail\s*\{[\s\S]*grid-template-columns:\s*1fr;/,
    "CodeAgent Switch should place its final single-column collapse after the intermediate breakpoint so it wins on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*980px\)[\s\S]*\.webtools-password-workbench\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "password tool workbench card should keep a single-column stack on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*980px\)[\s\S]*\.webtools-password-toolbar-row\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "password tool toolbar should stack once the viewport narrows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*980px\)[\s\S]*\.webtools-password-symbol-stack\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "password symbol controls should collapse to one column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*980px\)[\s\S]*\.webtools-password-control-matrix\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "password control matrix should collapse to a single column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*980px\)[\s\S]*\.webtools-password-insight-strip\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "password insight strip should stack cleanly on narrow windows"
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
    /@media \(max-width:\s*900px\)[\s\S]*\.clipboard-workbench-shell\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "Clipboard Workbench main shell should collapse into one vertical column on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*900px\)[\s\S]*\.clipboard-workbench-item-list\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "Clipboard Workbench item cards should stop spanning multiple columns on narrow windows"
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
});

test("Cron panel keeps editing on the left, results on the right, and syntax help on a full-width bottom rail", () => {
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();

  assert.match(
    panelImplsSource,
    /leftColumn\.append\(templatesSection,\s*fieldsSection\);/,
    "Cron editor should keep templates grouped with field editing in the left column"
  );
  assert.match(
    panelImplsSource,
    /rightColumn\.append\(summaryCard,\s*resultsSection\);/,
    "Cron result summaries should stay grouped in the right column"
  );
  assert.match(
    panelImplsSource,
    /guideSection\.className\s*=\s*"webtools-cron-section webtools-cron-guide-section";/,
    "Cron syntax help should have its own bottom-rail class hook"
  );
  assert.match(
    panelImplsSource,
    /workspace\.append\(leftColumn,\s*rightColumn\);/,
    "Cron workspace should return to a two-column layout"
  );
  assert.match(
    panelImplsSource,
    /form\.append\(toolbar,\s*workspace,\s*guideSection\);/,
    "Cron syntax help should render below the main workspace instead of competing for a side column"
  );
  assert.match(
    stylesSource,
    /\.webtools-cron-workspace\s*\{[\s\S]*grid-template-columns:\s*minmax\(0,\s*1\.3[0-9]*fr\)\s+minmax\(320px,\s*0\.9[0-9]*fr\)/,
    "Cron workspace should use a balanced two-column split that fills the panel without a third floating column"
  );
  assert.match(
    stylesSource,
    /\.webtools-cron-guide-section\s*\{[\s\S]*grid-column:\s*1\s*\/\s*-1;/,
    "Cron syntax help should explicitly span the full width below the workspace"
  );
});

test("Cron panel exposes editable template list with save, update, delete, and reset flows", () => {
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();
  const commonPanelStylesSource = readCommonPanelStylesSource();

  assert.match(
    panelImplsSource,
    /templatesSection\.append\(templatesHead,\s*templateGrid,\s*templateEditorRow\);/,
    "Cron templates should render chips and an editor row in the left column"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsCronTemplateAction/,
    "Cron template CRUD should execute through plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /buildWebtoolsCronTemplateTarget\([\s\S]*"update-template"/s,
    "Cron template editor should support update-template actions"
  );
  assert.match(
    panelImplsSource,
    /executeWebtoolsCronTemplateAction\("reset-templates"/,
    "Cron template editor should expose reset-templates"
  );
  assert.match(
    panelImplsSource,
    /hydrateWebtoolsCronTemplates\(/,
    "Cron panel should hydrate persisted templates from open/CRUD payloads"
  );
  assert.match(
    stylesSource,
    /\.webtools-cron-template-editor-row\s*\{/,
    "Cron template editor row should have dedicated styling"
  );
  assert.match(
    commonPanelStylesSource,
    /body\.mode-plugin \.webtools-cron-template-chip,[\s\S]*body\.mode-plugin \.webtools-cron-template-delete\s*\{[\s\S]*background:\s*rgba\(255,\s*255,\s*255,\s*0\.06\);[\s\S]*color:\s*var\(--ll-text-accent\);/,
    "Cron template buttons should provide a dark themed surface instead of falling back to native white buttons"
  );
});

test("lightweight webtools wrappers are removed from renderer handlers", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const directPanels = [
    ["Password", "WEBTOOLS_PASSWORD_PLUGIN_ID"],
    ["Json", "WEBTOOLS_JSON_PLUGIN_ID"],
    ["JsonSchema", "WEBTOOLS_JSON_SCHEMA_PLUGIN_ID"],
    ["DataMask", "WEBTOOLS_DATA_MASK_PLUGIN_ID"],
    ["Url", "WEBTOOLS_URL_PLUGIN_ID"],
    ["Timestamp", "WEBTOOLS_TIMESTAMP_PLUGIN_ID"],
    ["Cron", "WEBTOOLS_CRON_PLUGIN_ID"],
    ["Strings", "WEBTOOLS_STRINGS_PLUGIN_ID"],
    ["Colors", "WEBTOOLS_COLORS_PLUGIN_ID"],
    ["Qrcode", "WEBTOOLS_QRCODE_PLUGIN_ID"],
    ["Ua", "WEBTOOLS_UA_PLUGIN_ID"],
    ["Api", "WEBTOOLS_API_PLUGIN_ID"],
    ["HttpMock", "WEBTOOLS_HTTP_MOCK_PLUGIN_ID"]
  ] as const;

  for (const [panelName, pluginIdConstant] of directPanels) {
    assert.match(
      panelImplsSource,
      new RegExp(`\\[${pluginIdConstant}\\]:\\s*createSubmitPluginPanelHandler\\(`),
      `${panelName} handler should render directly through panelImplsSafe`
    );
    assert.match(
      panelImplsSource,
      new RegExp(`getRegisteredPanelImpls\\(\\)\\.applyWebtools${panelName}PanelPayload\\(panel\\)`),
      `${panelName} handler should apply payload directly through panelImplsSafe`
    );
    assert.equal(
      rendererSource.includes(`function renderWebtools${panelName}Panel`),
      false,
      `${panelName} render wrapper should be removed from renderer.ts`
    );
    assert.equal(
      rendererSource.includes(`function applyWebtools${panelName}PanelPayload`),
      false,
      `${panelName} apply wrapper should be removed from renderer.ts`
    );
    assert.match(
      panelImplsSource,
      new RegExp(`renderWebtools${panelName}Panel\\(\\): void`),
      `${panelName} render implementation should stay in plugin-panel-impls`
    );
  }
});

test("dictionary panel is registered with lookup handler", () => {
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /\[DICTIONARY_PLUGIN_ID\]:\s*\{[\s\S]*renderDictionaryPanel/,
    "dictionary handler should render through panel impls"
  );
  assert.match(
    panelImplsSource,
    /maybeAutoRunDictionaryPanelLookup\(\)/,
    "dictionary panel should auto lookup when opened with a query"
  );
  assert.match(
    panelImplsSource,
    /renderDictionaryPanel\(\): void/,
    "dictionary render implementation should stay in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /hydrateDictionaryPanelState\(\)/,
    "dictionary panel should hydrate history and favorites on open"
  );
  assert.match(
    panelImplsSource,
    /recordDictionaryLookup/,
    "dictionary panel should persist successful lookups into history"
  );
});

test("webtools-translate panel is registered with settings hydration", () => {
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /\[WEBTOOLS_TRANSLATE_PLUGIN_ID\]:\s*\{[\s\S]*renderWebtoolsTranslatePanel/,
    "translate handler should render through panel impls"
  );
  assert.match(
    panelImplsSource,
    /hydrateTranslateToolPanelFromSettings\(\)/,
    "translate panel should hydrate settings on open"
  );
  assert.match(
    panelImplsSource,
    /renderWebtoolsTranslatePanel\(\): void/,
    "translate render implementation should stay in plugin-panel-impls"
  );
});

test("remaining submit-driven webtools handlers enter through form submission", () => {
  const panelImplsSource = readPanelImplsSource();

  [
    "webtools-cron",
    "webtools-image-base64",
    "webtools-image-prompt",
    "webtools-config",
    "webtools-sql",
    "webtools-unit",
    "webtools-file-hash",
    "webtools-port-helper",
    "webtools-qrcode",
    "webtools-markdown",
    "webtools-ua",
    "webtools-api",
    "webtools-http-mock",
    "codeagent-switch"
  ].forEach((formClass) => {
    assert.match(
      panelImplsSource,
      new RegExp(
        `createSubmitPluginPanelHandler\\([\\s\\S]*?\"form\\.${formClass}-form\"\\s*\\)`,
        "s"
      ),
      `${formClass} Enter handler should submit the panel form`
    );
  });
});

test("plugin panel cleanup transient state is delegated through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    rendererSource,
    /panelImplsSafe\.cleanupPluginPanelTransientState\(null\)/,
    "setMode should delegate plugin cleanup to panelImplsSafe when leaving plugin mode"
  );
  assert.match(
    panelImplsSource,
    /getRegisteredPanelImpls\(\)\.cleanupPluginPanelTransientState\(\s*plugin\?\.pluginId \?\? null\s*\)/,
    "renderActivePluginPanel should delegate transient cleanup inside plugin-panel-impls"
  );
  assert.equal(
    rendererSource.includes("function clearWebtoolsTimestampAutoTimer"),
    false,
    "timestamp auto-timer cleanup should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function clearWebtoolsTimestampClockTimer"),
    false,
    "timestamp clock cleanup should not remain in renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /cleanupPluginPanelTransientState\(activePluginId: string \| null\): void/,
    "plugin-panel-impls should expose unified transient cleanup"
  );
});

test("generic plugin panel dispatcher shell lives in plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const globalSource = fs.readFileSync(
    path.join(process.cwd(), "src", "renderer", "global.d.ts"),
    "utf8"
  );

  [
    "function parseGenericPluginPanelPayload",
    "function renderPluginPanel",
    "function runWithPluginForm",
    "const pluginPanelHandlers:",
    "function getPluginPanelHandler",
    "function renderActivePluginPanel",
    "function handleActivePluginPanelEnter",
    "function openGenericPluginPanel"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });

  assert.match(
    rendererSource,
    /if \(mode === "plugin"\) \{\s*panelImplsSafe\.renderActivePluginPanel\(\);\s*return;\s*\}/,
    "plugin mode should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /panelImplsSafe\.handleActivePluginPanelEnter\(\);/,
    "plugin Enter action should delegate through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /const genericPluginOpen = panelImplsSafe\.handleGenericPluginPanelPayload\(panelPayload\);/,
    "generic plugin open payloads should delegate through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /const activePluginTitle = panelImplsSafe\.getActivePluginPanelTitle\(\);/,
    "plugin refresh status should read title through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /function handleLauncherOpenPanel\(panelPayload: unknown\): void \{/,
    "openPanel launcher routing should live in a dedicated renderer shell helper"
  );
  assert.match(
    rendererSource,
    /launcher\.onOpenPanel\(handleLauncherOpenPanel\);/,
    "registerEvents should wire launcher openPanel through the dedicated helper"
  );
  {
    const registerEventsSource = extractFunctionSource(rendererSource, "registerEvents");
    assert.doesNotMatch(
      registerEventsSource,
      /const genericPluginOpen = panelImplsSafe\.handleGenericPluginPanelPayload\(panelPayload\);/,
      "registerEvents should not inline generic plugin open routing"
    );
    assert.doesNotMatch(
      registerEventsSource,
      /const standalonePanelOpen = panelImplsSafe\.handleStandalonePanelPayload\(panelPayload\);/,
      "registerEvents should not inline standalone panel open routing"
    );
  }

  assert.match(
    panelImplsSource,
    /function parseGenericPluginPanelPayload\(\s*payload: unknown\s*\): GenericPluginPanelPayload \| null/s,
    "generic plugin payload parser should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function renderPluginPanelFallback\(\): void \{/,
    "generic plugin fallback renderer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function runWithPluginForm\(\s*selector: string,\s*action: \(form: HTMLFormElement\) => void\s*\): \(\) => void/s,
    "plugin form submit helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const pluginPanelHandlers: Readonly<Record<string, PluginPanelHandler>> = \{/,
    "plugin panel handler registry should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /handleGenericPluginPanelPayload\(panelPayload: unknown\): string \| null \{/,
    "plugin-panel-impls should accept generic plugin open payloads"
  );
  assert.match(
    panelImplsSource,
    /renderActivePluginPanel\(\): void \{/,
    "plugin-panel-impls should render the active plugin panel"
  );
  assert.match(
    panelImplsSource,
    /handleActivePluginPanelEnter\(\): void \{/,
    "plugin-panel-impls should handle plugin Enter actions"
  );
  assert.match(
    panelImplsSource,
    /getActivePluginPanelTitle\(\): string \| null \{/,
    "plugin-panel-impls should expose the active plugin title"
  );

  assert.match(
    globalSource,
    /handleGenericPluginPanelPayload\(panelPayload: unknown\): string \| null;/,
    "RendererPanelImpls should expose generic plugin open handling"
  );
  assert.match(
    globalSource,
    /renderActivePluginPanel\(\): void;/,
    "RendererPanelImpls should expose active plugin rendering"
  );
  assert.match(
    globalSource,
    /handleActivePluginPanelEnter\(\): void;/,
    "RendererPanelImpls should expose active plugin Enter handling"
  );
  assert.match(
    globalSource,
    /getActivePluginPanelTitle\(\): string \| null;/,
    "RendererPanelImpls should expose active plugin title lookup"
  );
});

test("hardware inspector helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.hardware-inspector-form"\s*\)/s,
    "Hardware Inspector Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function applyHardwareInspectorSnapshot"),
    false,
    "Hardware Inspector snapshot applier should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function getHardwareInspectorSnapshotFromData"),
    false,
    "Hardware Inspector snapshot reader should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function buildHardwareInspectorSummaryText"),
    false,
    "Hardware Inspector summary builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeHardwareInspectorRefresh"),
    false,
    "Hardware Inspector refresh executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeHardwareInspectorExportReport"),
    false,
    "Hardware Inspector export executor should not remain in renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function applyHardwareInspectorSnapshot\(\s*snapshot: HardwareInspectorSnapshot,\s*infoText\?: string,\s*options\?: \{ loadPreview\?: boolean \}\s*\): void/s,
    "Hardware Inspector snapshot applier should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getHardwareInspectorSnapshotFromData\(\s*data: Record<string, unknown> \| null\s*\): HardwareInspectorSnapshot \| null/s,
    "Hardware Inspector snapshot reader should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildHardwareInspectorSummaryText\(snapshot: HardwareInspectorSnapshot\): string/,
    "Hardware Inspector summary builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeHardwareInspectorRefresh\(\): Promise<void>/,
    "Hardware Inspector refresh executor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeHardwareInspectorExportReport\(\s*format: "markdown" \| "html" \| "image" \| "image-compact"\s*\): Promise<void>/s,
    "Hardware Inspector export executor should live in plugin-panel-impls"
  );
});

test("hardware inspector formatting and diff helpers live with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const helperNames = [
    "formatHardwareInspectorBytes",
    "formatHardwareInspectorClockMhz",
    "formatHardwareInspectorRpm",
    "formatHardwareInspectorDate",
    "formatHardwareInspectorBoolean",
    "formatHardwareInspectorNullableBoolean",
    "formatHardwareInspectorText",
    "formatHardwareInspectorSectorSize",
    "formatHardwareInspectorTemperature",
    "formatHardwareInspectorPercentage",
    "formatHardwareInspectorHours",
    "isHardwareInspectorDiskAtRisk",
    "countHardwareInspectorRiskDisks",
    "getHardwareInspectorCpuKey",
    "getHardwareInspectorMemoryKey",
    "getHardwareInspectorGpuKey",
    "getHardwareInspectorDiskKey",
    "normalizeHardwareInspectorComparableValue",
    "areHardwareInspectorComparableValuesEqual",
    "addHardwareInspectorChange",
    "collectHardwareInspectorObjectChanges",
    "collectHardwareInspectorEntityChanges",
    "createHardwareInspectorInitialDiffState",
    "buildHardwareInspectorDiffState",
    "formatHardwareInspectorResolution"
  ];

  helperNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`function ${name}`),
      false,
      `Hardware Inspector helper ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`function ${name}`),
      true,
      `Hardware Inspector helper ${name} should live in plugin-panel-impls`
    );
  });

  const typeNames = ["HardwareInspectorFieldSpec", "HardwareInspectorEntityEntry"];
  typeNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`type ${name}`),
      false,
      `Hardware Inspector type ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`type ${name}`),
      true,
      `Hardware Inspector type ${name} should live in plugin-panel-impls`
    );
  });
});

test("hardware inspector runtime state lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const stateNames = [
    "hardwareInspectorSnapshot",
    "hardwareInspectorLastSnapshot",
    "hardwareInspectorDiffState",
    "hardwareInspectorInfo",
    "hardwareInspectorError",
    "hardwareInspectorLoading",
    "hardwareInspectorExporting",
    "hardwareInspectorRequestToken",
    "hardwareInspectorExpandedDiskKeys"
  ];

  stateNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`let ${name}`),
      false,
      `Hardware Inspector runtime state ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`let ${name}`),
      true,
      `Hardware Inspector runtime state ${name} should live in plugin-panel-impls`
    );
  });
});

test("markdown panel render/apply lives in plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /\[WEBTOOLS_MARKDOWN_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "Markdown handler should render through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /getRegisteredPanelImpls\(\)\.applyWebtoolsMarkdownPanelPayload\(panel\)/,
    "Markdown handler should apply payload through panelImplsSafe"
  );
  assert.equal(
    rendererSource.includes("function renderWebtoolsMarkdownPanel"),
    false,
    "Markdown render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function applyWebtoolsMarkdownPanelPayload"),
    false,
    "Markdown apply implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /renderWebtoolsMarkdownPanel\(\): void/,
    "Markdown render implementation should be present in plugin-panel-impls"
  );
});

test("image base64 helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-image-base64-form"\s*\)/s,
    "Image Base64 Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsImageBase64Target"),
    false,
    "Image Base64 command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function getWebtoolsImageBase64DownloadName"),
    false,
    "Image Base64 download name helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsImageBase64PanelInForm"),
    false,
    "Image Base64 form refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function scheduleWebtoolsImageBase64AutoNormalize"),
    false,
    "Image Base64 auto-normalize scheduler should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsImageBase64Normalize"),
    false,
    "Image Base64 execute helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsImageBase64Normalize(inputValue)"),
    false,
    "Image Base64 Enter handler should not call execute helper from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsImageBase64Target\(input: string\): string/,
    "Image Base64 command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsImageBase64DownloadName\(\): string/,
    "Image Base64 download name helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsImageBase64PanelInForm\(form: HTMLFormElement\): void/,
    "Image Base64 form refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsImageBase64AutoNormalize\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "Image Base64 auto-normalize scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsImageBase64Normalize\(\s*input: string,\s*options: \{ render\?: boolean; form\?: HTMLFormElement \} = \{\}/s,
    "Image Base64 execute helper should live in plugin-panel-impls"
  );
});

test("image base64 runtime state lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const stateNames = [
    "webtoolsImageBase64Input",
    "webtoolsImageBase64DataUrl",
    "webtoolsImageBase64Raw",
    "webtoolsImageBase64Mime",
    "webtoolsImageBase64SizeText",
    "webtoolsImageBase64Info",
    "webtoolsImageBase64Error",
    "webtoolsImageBase64Dragging",
    "webtoolsImageBase64FileName",
    "webtoolsImageBase64AutoTimer",
    "webtoolsImageBase64RequestToken"
  ];

  stateNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`let ${name}`),
      false,
      `Image Base64 runtime state ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`let ${name}`),
      true,
      `Image Base64 runtime state ${name} should live in plugin-panel-impls`
    );
  });
});

test("config helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-config-form"\s*\)/s,
    "Config Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsConfigTarget"),
    false,
    "Config command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function normalizeWebtoolsConfigFormat"),
    false,
    "Config format normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsConfigResultInForm"),
    false,
    "Config result refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function scheduleWebtoolsConfigAutoConvert"),
    false,
    "Config auto-convert scheduler should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsConfigConvert"),
    false,
    "Config executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsConfigConvert(form)"),
    false,
    "Config Enter handler should not call execute helper from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsConfigTarget\(\): string/,
    "Config command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsConfigFormat\(\s*value: string \| undefined,\s*fallback: "yaml" \| "json" \| "properties"/s,
    "Config format normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsConfigResultInForm\(form: HTMLFormElement\): void/,
    "Config result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsConfigAutoConvert\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "Config auto-convert scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsConfigConvert\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "Config executor should live in plugin-panel-impls"
  );
});

test("sql helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-sql-form"\s*\)/s,
    "SQL Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function normalizeWebtoolsSqlDialect"),
    false,
    "SQL dialect normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function normalizeWebtoolsSqlIndent"),
    false,
    "SQL indent normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsSqlTarget"),
    false,
    "SQL command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsSqlResultInForm"),
    false,
    "SQL result refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function scheduleWebtoolsSqlAutoFormat"),
    false,
    "SQL auto-format scheduler should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsSqlFormat"),
    false,
    "SQL formatter executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsSqlFormat(form)"),
    false,
    "SQL Enter handler should not call execute helper from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsSqlDialect\(value: string \| undefined\): string/,
    "SQL dialect normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsSqlIndent\(value: number \| string \| undefined\): number/,
    "SQL indent normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsSqlTarget\(\): string/,
    "SQL command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsSqlResultInForm\(form: HTMLFormElement\): void/,
    "SQL result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsSqlAutoFormat\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "SQL auto-format scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsSqlFormat\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "SQL formatter executor should live in plugin-panel-impls"
  );
});

test("qrcode helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-qrcode-form"\s*\)/s,
    "Qrcode Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function normalizeWebtoolsQrcodeColor"),
    false,
    "Qrcode color normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function readWebtoolsQrcodeFileAsDataUrl"),
    false,
    "Qrcode file reader should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function loadWebtoolsQrcodeImage"),
    false,
    "Qrcode image loader should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function normalizeWebtoolsQrcodeLogoImage"),
    false,
    "Qrcode logo normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function downloadWebtoolsQrcodePng"),
    false,
    "Qrcode PNG downloader should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsQrcodeTarget"),
    false,
    "Qrcode command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsQrcodePanelInForm"),
    false,
    "Qrcode panel refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function scheduleWebtoolsQrcodeAutoGenerate"),
    false,
    "Qrcode auto-generate scheduler should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsQrcodeGenerateInForm"),
    false,
    "Qrcode generate executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsQrcodeGenerate(form)"),
    false,
    "Qrcode Enter handler should not call the generate executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsQrcodeColor\(value: string,\s*fallback: string\): string/,
    "Qrcode color normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function readWebtoolsQrcodeFileAsDataUrl\(file: File\): Promise<string>/,
    "Qrcode file reader should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function loadWebtoolsQrcodeImage\(src: string\): Promise<HTMLImageElement>/,
    "Qrcode image loader should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function normalizeWebtoolsQrcodeLogoImage\(\s*file: File\s*\): Promise<\{ dataUrl: string; name: string \}>/s,
    "Qrcode logo normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function downloadWebtoolsQrcodePng\(\): Promise<void>/,
    "Qrcode PNG downloader should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsQrcodeTarget\(\): string/,
    "Qrcode command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsQrcodePanelInForm\(form: HTMLFormElement\): void/,
    "Qrcode panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsQrcodeAutoGenerate\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "Qrcode auto-generate scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsQrcodeGenerateInForm\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "Qrcode generate executor should live in plugin-panel-impls"
  );
});

test("markdown helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-markdown-form"\s*\)/s,
    "Markdown Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsMarkdownTarget"),
    false,
    "Markdown command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsMarkdownPanelInForm"),
    false,
    "Markdown panel refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function scheduleWebtoolsMarkdownAutoRender"),
    false,
    "Markdown auto-render scheduler should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsMarkdownRender"),
    false,
    "Markdown render executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsMarkdownRender(form)"),
    false,
    "Markdown Enter handler should not call the render executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsMarkdownTarget\(input: string\): string/,
    "Markdown command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsMarkdownPanelInForm\(form: HTMLFormElement\): void/,
    "Markdown panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsMarkdownAutoRender\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "Markdown auto-render scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsMarkdownRender\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "Markdown render executor should live in plugin-panel-impls"
  );
});

test("markdown runtime state lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const stateNames = [
    "webtoolsMarkdownInput",
    "webtoolsMarkdownHtml",
    "webtoolsMarkdownInfo",
    "webtoolsMarkdownAutoTimer",
    "webtoolsMarkdownRequestToken"
  ];

  stateNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`let ${name}`),
      false,
      `Markdown runtime state ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`let ${name}`),
      true,
      `Markdown runtime state ${name} should live in plugin-panel-impls`
    );
  });
});

test("ua helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-ua-form"\s*\)/s,
    "UA Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsUaTarget"),
    false,
    "UA command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsUaResultInForm"),
    false,
    "UA result refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function scheduleWebtoolsUaAutoParse"),
    false,
    "UA auto-parse scheduler should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsUaParse"),
    false,
    "UA parse executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsUaParse(ua)"),
    false,
    "UA Enter handler should not call the parse executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsUaTarget\(ua: string\): string/,
    "UA command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUaResultInForm\(form: HTMLFormElement\): void/,
    "UA result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsUaAutoParse\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "UA auto-parse scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsUaParse\(\s*ua: string,\s*options: \{ render\?: boolean; form\?: HTMLFormElement \} = \{\}/s,
    "UA parse executor should live in plugin-panel-impls"
  );
});

test("ua runtime state lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const stateNames = [
    "webtoolsUaInput",
    "webtoolsUaResult",
    "webtoolsUaInfo",
    "webtoolsUaError",
    "webtoolsUaAutoTimer",
    "webtoolsUaRequestToken"
  ];

  stateNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`let ${name}`),
      false,
      `UA runtime state ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`let ${name}`),
      true,
      `UA runtime state ${name} should live in plugin-panel-impls`
    );
  });
});

test("api helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-api-form"\s*\)/s,
    "API Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function cloneWebtoolsApiRows",
    "function ensureWebtoolsApiEditableRows",
    "function buildWebtoolsApiPreviewUrl",
    "function buildWebtoolsApiTarget",
    "function getWebtoolsApiRowsByGroup",
    "function setWebtoolsApiRowsByGroup",
    "function refreshWebtoolsApiTabs",
    "function refreshWebtoolsApiPreview",
    "function refreshWebtoolsApiMethodUi",
    "function refreshWebtoolsApiResponseHeadersHost",
    "function refreshWebtoolsApiResponseInForm",
    "function createWebtoolsApiRowsEditor",
    "async function executeWebtoolsApiRequest"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("executeWebtoolsApiRequest(form)"),
    false,
    "API Enter handler should not call the request executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function cloneWebtoolsApiRows\(rows: WebtoolsApiKvRow\[\]\): WebtoolsApiKvRow\[\]/,
    "API rows cloner should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function ensureWebtoolsApiEditableRows\(rows: WebtoolsApiKvRow\[\]\): WebtoolsApiKvRow\[\]/,
    "API rows normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsApiPreviewUrl\(\): string/,
    "API preview URL builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsApiTarget\(\): string/,
    "API command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsApiRowsByGroup\(\s*group: "params" \| "headers" \| "formdata"/s,
    "API group row getter should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function setWebtoolsApiRowsByGroup\(\s*group: "params" \| "headers" \| "formdata",\s*rows: WebtoolsApiKvRow\[\]/s,
    "API group row setter should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsApiTabs\(form: HTMLFormElement\): void/,
    "API tab refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsApiPreview\(form: HTMLFormElement\): void/,
    "API preview refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsApiMethodUi\(form: HTMLFormElement\): void/,
    "API method UI refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsApiResponseHeadersHost\(host: HTMLElement\): void/,
    "API response headers refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsApiResponseInForm\(form: HTMLFormElement\): void/,
    "API response refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsApiRowsEditor\(\s*form: HTMLFormElement,\s*group: "params" \| "headers" \| "formdata"/s,
    "API rows editor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsApiRequest\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "API request executor should live in plugin-panel-impls"
  );
});

test("api runtime state lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const stateNames = [
    "webtoolsApiMethod",
    "webtoolsApiUrl",
    "webtoolsApiRequestTab",
    "webtoolsApiResponseTab",
    "webtoolsApiParams",
    "webtoolsApiHeaders",
    "webtoolsApiBodyType",
    "webtoolsApiBodyContent",
    "webtoolsApiFormRows",
    "webtoolsApiResponseStatus",
    "webtoolsApiResponseBody",
    "webtoolsApiResponseHeaders",
    "webtoolsApiResponseTimeMs",
    "webtoolsApiResponseSizeText",
    "webtoolsApiResponseUrl",
    "webtoolsApiResponseError",
    "webtoolsApiRequestToken",
    "webtoolsApiHasResponse",
    "webtoolsApiIsLoading"
  ];

  stateNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`let ${name}`),
      false,
      `API runtime state ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`let ${name}`),
      true,
      `API runtime state ${name} should live in plugin-panel-impls`
    );
  });
});

test("cron helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-cron-form"\s*\)/s,
    "Cron Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function buildWebtoolsCronTarget",
    "function refreshWebtoolsCronResultInForm",
    "function scheduleWebtoolsCronAutoParse",
    "async function executeWebtoolsCronAction"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes('executeWebtoolsCronAction("parse", expression, {'),
    false,
    "Cron Enter handler should not call the parse executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsCronTarget\(action: "parse" \| "random", expression: string\): string/,
    "Cron command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsCronResultInForm\(form: HTMLFormElement\): void/,
    "Cron result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsCronAutoParse\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "Cron auto-parse scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsCronAction\(\s*action: "parse" \| "random",\s*expression: string,\s*options: \{ render\?: boolean; form\?: HTMLFormElement \} = \{\}/s,
    "Cron executor should live in plugin-panel-impls"
  );
});

test("unit helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-unit-form"\s*\)/s,
    "Unit Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function normalizeWebtoolsUnitNumber",
    "function updateWebtoolsUnitStorageFrom",
    "function updateWebtoolsUnitFromPixel",
    "function updateWebtoolsUnitFromRem",
    "function formatWebtoolsUnitStorageValue",
    "function refreshWebtoolsUnitStorageInputs",
    "function refreshWebtoolsUnitScreenInputs",
    "function refreshWebtoolsUnitInfo",
    "function refreshWebtoolsUnitPanelInForm"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("refreshWebtoolsUnitPanelInForm(form);"),
    false,
    "Unit Enter handler should not refresh the panel through renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsUnitNumber\(value: number,\s*fallback: number\): number/,
    "Unit number normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function updateWebtoolsUnitStorageFrom\(\s*sourceUnit: WebtoolsUnitStorageKey,\s*rawValue: number\s*\): void/s,
    "Unit storage conversion helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function updateWebtoolsUnitFromPixel\(pixelValue: number,\s*basePxValue: number\): void/,
    "Unit pixel conversion helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function updateWebtoolsUnitFromRem\(remValue: number,\s*basePxValue: number\): void/,
    "Unit rem conversion helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function formatWebtoolsUnitStorageValue\(value: number\): string/,
    "Unit storage formatter should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUnitStorageInputs\(form: HTMLFormElement\): void/,
    "Unit storage refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUnitScreenInputs\(form: HTMLFormElement\): void/,
    "Unit screen refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUnitInfo\(form: HTMLFormElement\): void/,
    "Unit info refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUnitPanelInForm\(form: HTMLFormElement\): void/,
    "Unit panel refresh helper should live in plugin-panel-impls"
  );
});

test("file hash helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-file-hash-form"\s*\)/s,
    "File Hash Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function normalizeWebtoolsFileHashAlgorithm",
    "function buildWebtoolsFileHashTarget",
    "function refreshWebtoolsFileHashPanelInForm",
    "async function executeWebtoolsFileHashCalculate"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("executeWebtoolsFileHashCalculate(form)"),
    false,
    "File Hash Enter handler should not call the calculate executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsFileHashAlgorithm\(value: string\): WebtoolsFileHashAlgorithm/,
    "File Hash algorithm normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsFileHashTarget\(action: "hash"\): string/,
    "File Hash command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsFileHashPanelInForm\(form: HTMLFormElement\): void/,
    "File Hash panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsFileHashCalculate\(form: HTMLFormElement\): Promise<void>/,
    "File Hash executor should live in plugin-panel-impls"
  );
});

test("port helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-port-helper-form"\s*\)/s,
    "Port Helper Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function normalizeWebtoolsPortHelperProtocol",
    "function parseWebtoolsPortHelperRecords",
    "function buildWebtoolsPortHelperTarget",
    "function refreshWebtoolsPortHelperPanelInForm",
    "async function executeWebtoolsPortHelperAction"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes('executeWebtoolsPortHelperAction("query", form)'),
    false,
    "Port Helper Enter handler should not call the query executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsPortHelperProtocol\(value: string\): WebtoolsPortHelperProtocol/,
    "Port Helper protocol normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function parseWebtoolsPortHelperRecords\(value: unknown\): WebtoolsPortHelperRecord\[\]/,
    "Port Helper record parser should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsPortHelperTarget\(\s*action: "query" \| "kill",\s*pidOverride\?: string \| null/s,
    "Port Helper command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsPortHelperPanelInForm\(form: HTMLFormElement\): void/,
    "Port Helper panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsPortHelperAction\(\s*action: "query" \| "kill",\s*form\?: HTMLFormElement,\s*pidOverride\?: string \| null/s,
    "Port Helper executor should live in plugin-panel-impls"
  );
});

test("http mock helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-http-mock-form"\s*\)/s,
    "HTTP Mock Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function normalizeWebtoolsHttpMockMethod",
    "function normalizeWebtoolsHttpMockPath",
    "function buildWebtoolsHttpMockTarget",
    "function refreshWebtoolsHttpMockPanelInForm",
    "async function executeWebtoolsHttpMockAction"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes('executeWebtoolsHttpMockAction("start", form)'),
    false,
    "HTTP Mock Enter handler should not call the start executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsHttpMockMethod\(value: string\): WebtoolsHttpMockMethod/,
    "HTTP Mock method normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsHttpMockPath\(value: string\): string/,
    "HTTP Mock path normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsHttpMockTarget\(action: "open" \| "start" \| "stop" \| "status"\): string/,
    "HTTP Mock command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsHttpMockPanelInForm\(form: HTMLFormElement\): void/,
    "HTTP Mock panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsHttpMockAction\(\s*action: "start" \| "stop" \| "status",\s*form\?: HTMLFormElement/s,
    "HTTP Mock executor should live in plugin-panel-impls"
  );
});

test("image prompt helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-image-prompt-form"\s*\)/s,
    "Image Prompt Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function normalizeWebtoolsImagePromptProductId"),
    false,
    "Image Prompt product id normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function filterWebtoolsImagePromptStateForStyle"),
    false,
    "Image Prompt style filter helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function readWebtoolsImagePromptStringList"),
    false,
    "Image Prompt list reader should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function normalizeWebtoolsImagePromptState"),
    false,
    "Image Prompt payload normalizer should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function collectWebtoolsImagePromptState"),
    false,
    "Image Prompt form collector should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function syncWebtoolsImagePromptForm"),
    false,
    "Image Prompt form sync helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function createClearedWebtoolsImagePromptState"),
    false,
    "Image Prompt clear-state helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsImagePromptTarget"),
    false,
    "Image Prompt command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function refreshWebtoolsImagePromptPanelInForm"),
    false,
    "Image Prompt panel refresh helper should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsImagePromptBuild"),
    false,
    "Image Prompt build executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("executeWebtoolsImagePromptBuild(form, { render: false })"),
    false,
    "Image Prompt Enter handler should not call the build executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsImagePromptProductId\(value: string\): WebtoolsImagePromptProductId/,
    "Image Prompt product id normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function filterWebtoolsImagePromptStateForStyle\(\s*state: WebtoolsImagePromptState\s*\): WebtoolsImagePromptState/s,
    "Image Prompt style filter helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function readWebtoolsImagePromptStringList\(value: unknown\): string\[\]/,
    "Image Prompt list reader should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsImagePromptState\(value: unknown\): WebtoolsImagePromptState/,
    "Image Prompt payload normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function collectWebtoolsImagePromptState\(form: HTMLFormElement\): WebtoolsImagePromptState/,
    "Image Prompt form collector should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function syncWebtoolsImagePromptForm\(form: HTMLFormElement,\s*state: WebtoolsImagePromptState\): void/,
    "Image Prompt form sync helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createClearedWebtoolsImagePromptState\(\): WebtoolsImagePromptState/,
    "Image Prompt clear-state helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsImagePromptTarget\(state: WebtoolsImagePromptState\): string/,
    "Image Prompt command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsImagePromptPanelInForm\(form: HTMLFormElement\): void/,
    "Image Prompt panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsImagePromptBuild\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean; state\?: WebtoolsImagePromptState \} = \{\}/s,
    "Image Prompt build executor should live in plugin-panel-impls"
  );
});

test("image prompt runtime state lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  const stateNames = [
    "webtoolsImagePromptState",
    "webtoolsImagePromptOutput",
    "webtoolsImagePromptInfo",
    "webtoolsImagePromptRequestToken"
  ];

  stateNames.forEach((name) => {
    assert.equal(
      rendererSource.includes(`let ${name}`),
      false,
      `Image Prompt runtime state ${name} should not remain in renderer.ts`
    );
    assert.equal(
      panelImplsSource.includes(`let ${name}`),
      true,
      `Image Prompt runtime state ${name} should live in plugin-panel-impls`
    );
  });
});

test("strings helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-strings-form"\s*\)/s,
    "Strings Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("function buildWebtoolsStringsTarget"),
    false,
    "Strings command target builder should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes("async function executeWebtoolsStringsAction"),
    false,
    "Strings executor should not remain in renderer.ts"
  );
  assert.equal(
    rendererSource.includes('executeWebtoolsStringsAction("convert", form)'),
    false,
    "Strings Enter handler should not call the convert executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsStringsTarget\(action: "convert" \| "uuid"\): string/,
    "Strings command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsStringsAction\(\s*action: "convert" \| "uuid",\s*form: HTMLFormElement,\s*options: \{ caseType\?: string \} = \{\}/s,
    "Strings executor should live in plugin-panel-impls"
  );
});

test("colors helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-colors-form"\s*\)/s,
    "Colors Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function buildWebtoolsColorsTarget",
    "function getWebtoolsColorsPreviewTextColor",
    "function refreshWebtoolsColorsPanelInForm",
    "function scheduleWebtoolsColorsAutoConvert",
    "async function executeWebtoolsColorsConvert"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("executeWebtoolsColorsConvert(color)"),
    false,
    "Colors Enter handler should not call the converter from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsColorsTarget\(color: string\): string/,
    "Colors command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsColorsPreviewTextColor\(\): string/,
    "Colors preview text helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsColorsPanelInForm\(form: HTMLFormElement\): void/,
    "Colors panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsColorsAutoConvert\(\s*form: HTMLFormElement,\s*color: string,\s*immediate = false/s,
    "Colors auto-convert scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsColorsConvert\(\s*color: string,\s*options: \{ render\?: boolean; form\?: HTMLFormElement \} = \{\}/s,
    "Colors converter should live in plugin-panel-impls"
  );
});

test("diff helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-diff-form"\s*\)/s,
    "Diff Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function buildWebtoolsDiffTarget",
    "function createWebtoolsDiffStatCard",
    "function refreshWebtoolsDiffResultInForm",
    "function scheduleWebtoolsDiffAutoCompare",
    "async function executeWebtoolsDiffCompare"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("executeWebtoolsDiffCompare(form)"),
    false,
    "Diff Enter handler should not call the comparer from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsDiffTarget\(\): string/,
    "Diff command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsDiffStatCard\(label: string,\s*value: string\): HTMLDivElement/,
    "Diff stat card helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsDiffResultInForm\(form: HTMLFormElement\): void/,
    "Diff result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsDiffAutoCompare\(\s*form: HTMLFormElement,\s*immediate = false/s,
    "Diff auto-compare scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsDiffCompare\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "Diff comparer should live in plugin-panel-impls"
  );
});

test("timestamp helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-timestamp-form"\s*\)/s,
    "Timestamp Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function buildWebtoolsTimestampTarget",
    "function refreshWebtoolsTimestampResultInForm",
    "function scheduleWebtoolsTimestampAutoConvert",
    "async function executeWebtoolsTimestampAction",
    "function normalizeWebtoolsTimestampUnit",
    "function formatWebtoolsTimestampDate",
    "function getWebtoolsTimestampNowUnix",
    "function ensureWebtoolsTimestampDefaults"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes('executeWebtoolsTimestampAction("toDate", input, { render: false, form })'),
    false,
    "Timestamp Enter handler should not call the converter from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsTimestampTarget\(\s*action: "toDate" \| "toTimestamp",\s*input: string\s*\): string/s,
    "Timestamp command target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsTimestampResultInForm\(form: HTMLFormElement\): void/,
    "Timestamp result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsTimestampAutoConvert\(\s*form: HTMLFormElement,\s*action: "toDate" \| "toTimestamp",\s*immediate = false/s,
    "Timestamp auto-convert scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsTimestampAction\(\s*action: "toDate" \| "toTimestamp",\s*input: string,\s*options: \{ render\?: boolean; form\?: HTMLFormElement \} = \{\}/s,
    "Timestamp converter should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsTimestampUnit\(value: unknown\): "s" \| "ms"/,
    "Timestamp unit normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function formatWebtoolsTimestampDate\(value: Date, withMs = false\): string/,
    "Timestamp date formatter should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsTimestampNowUnix\(unit: "s" \| "ms"\): string/,
    "Timestamp current-unix helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function ensureWebtoolsTimestampDefaults\(\): void/,
    "Timestamp default-state initializer should live in plugin-panel-impls"
  );
});

test("url helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-url-form"\s*\)/s,
    "URL Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function parseWebtoolsUrlInput",
    "function rebuildWebtoolsUrlFromQueryRows",
    "function refreshWebtoolsUrlPartsInForm",
    "function renderWebtoolsUrlQueryEditor",
    "function refreshWebtoolsUrlInfoInForm",
    "function refreshWebtoolsUrlPanelInForm",
    "function createWebtoolsUrlPartField"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("parseWebtoolsUrlInput(input)"),
    false,
    "URL Enter handler should not parse URL directly from renderer.ts"
  );
  assert.equal(
    rendererSource.includes('setStatus(webtoolsUrlState.valid === false ? webtoolsUrlState.info : "URL 解析完成")'),
    false,
    "URL Enter handler should not own URL status updates in renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function parseWebtoolsUrlInput\(input: string\): void/,
    "URL parser should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function rebuildWebtoolsUrlFromQueryRows\(\): boolean/,
    "URL query-row rebuild helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUrlPartsInForm\(form: HTMLFormElement\): void/,
    "URL part refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function renderWebtoolsUrlQueryEditor\(\s*form: HTMLFormElement,\s*host: HTMLElement,\s*inputArea: HTMLTextAreaElement\s*\): void/s,
    "URL query editor renderer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUrlInfoInForm\(form: HTMLFormElement\): void/,
    "URL info refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsUrlPanelInForm\(\s*form: HTMLFormElement,\s*options: \{ rebuildQueryRows\?: boolean; syncInput\?: boolean \} = \{\}\s*\): void/s,
    "URL panel refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsUrlPartField\(\s*labelText: string,\s*partKey: keyof WebtoolsUrlParts,\s*full = false\s*\): HTMLLabelElement/s,
    "URL part field factory should live in plugin-panel-impls"
  );
});

test("password helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-password-form"\s*\)/s,
    "Password Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  assert.equal(
    rendererSource.includes("async function generateFromWebtoolsPasswordPanel"),
    false,
    "Password generator executor should not remain in renderer.ts"
  );
  [
    "function buildWebtoolsPasswordGenerateTarget",
    "function createWebtoolsPasswordResultTable",
    "function normalizeWebtoolsPasswordOptions"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("generateFromWebtoolsPasswordPanel(form, { render: false })"),
    false,
    "Password Enter handler should not call the generator from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsPasswordGenerateTarget\(\s*options: WebtoolsPasswordOptions\s*\): string/s,
    "Password target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsPasswordResultTable\(\s*rows: WebtoolsPasswordResultRow\[\]\s*\): HTMLDivElement/s,
    "Password result table renderer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsPasswordOptions\(\s*inputOptions: Partial<WebtoolsPasswordOptions>,\s*base: WebtoolsPasswordOptions = webtoolsPasswordOptions\s*\): WebtoolsPasswordOptions/s,
    "Password option normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function generateFromWebtoolsPasswordPanel\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}/s,
    "Password generator executor should live in plugin-panel-impls"
  );
});

test("json helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-json-form"\s*\)/s,
    "JSON Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function buildWebtoolsJsonTarget",
    "function buildWebtoolsJsonInfoState",
    "function refreshWebtoolsJsonResultInForm",
    "function scheduleWebtoolsJsonAutoConvert",
    "async function executeWebtoolsJsonConvert",
    "function parseWebtoolsJsonPreviewSummary"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes('executeWebtoolsJsonConvert(form, { render: false })'),
    false,
    "JSON Enter handler should not call the converter from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsJsonTarget\(action: "convert" \| "validate" = "convert"\): string/,
    "JSON target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsJsonInfoState\(\): \{\s*text: string;\s*state: "ok" \| "error" \| "idle";\s*\}/s,
    "JSON info-state helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsJsonResultInForm\(form: HTMLFormElement\): void/,
    "JSON result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsJsonAutoConvert\(\s*form: HTMLFormElement,\s*immediate = false\s*\): void/s,
    "JSON auto-convert scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsJsonConvert\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean; action\?: "convert" \| "validate" \} = \{\}\s*\): Promise<void>/s,
    "JSON converter should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function parseWebtoolsJsonPreviewSummary\(value: unknown\): WebtoolsJsonPreviewSummary \| null/,
    "JSON preview summary parser should live in plugin-panel-impls"
  );
});

test("regex helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-regex-form"\s*\)/s,
    "Regex Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function escapeWebtoolsRegexHtml",
    "function sanitizeWebtoolsRegexFlags",
    "function refreshWebtoolsRegexState",
    "function refreshWebtoolsRegexPreviewInForm"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes("refreshWebtoolsRegexState();"),
    false,
    "Regex Enter handler should not refresh state from renderer.ts"
  );
  assert.equal(
    rendererSource.includes("refreshWebtoolsRegexPreviewInForm(form);"),
    false,
    "Regex Enter handler should not refresh preview from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function escapeWebtoolsRegexHtml\(value: string\): string/,
    "Regex HTML escape helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function sanitizeWebtoolsRegexFlags\(flags: string\): string/,
    "Regex flag sanitizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsRegexState\(\): void/,
    "Regex state refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsRegexPreviewInForm\(form: HTMLFormElement\): void/,
    "Regex preview refresh helper should live in plugin-panel-impls"
  );
});

test("crypto helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-crypto-form"\s*\)/s,
    "Crypto Enter handler should submit the panel form instead of calling renderer-local helpers"
  );
  [
    "function normalizeWebtoolsCryptoAlgorithm",
    "function webtoolsCryptoSupportsDecrypt",
    "function isWebtoolsCryptoSymmetricAlgorithm",
    "function isWebtoolsCryptoAsymmetricAlgorithm",
    "function refreshWebtoolsCryptoResultInForm",
    "function buildWebtoolsCryptoTarget",
    "function scheduleWebtoolsCryptoAutoProcess",
    "async function executeWebtoolsCryptoProcess",
    "async function executeWebtoolsCryptoGenerateKeys"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });
  assert.equal(
    rendererSource.includes('executeWebtoolsCryptoProcess(form, { render: false })'),
    false,
    "Crypto Enter handler should not call the processor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsCryptoAlgorithm\(value: string\): string/,
    "Crypto algorithm normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function webtoolsCryptoSupportsDecrypt\(algorithm: string\): boolean/,
    "Crypto decrypt-support helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function isWebtoolsCryptoSymmetricAlgorithm\(algorithm: string\): boolean/,
    "Crypto symmetric helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function isWebtoolsCryptoAsymmetricAlgorithm\(algorithm: string\): boolean/,
    "Crypto asymmetric helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsCryptoResultInForm\(form: HTMLFormElement\): void/,
    "Crypto result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function buildWebtoolsCryptoTarget\(action: "process" \| "generateKeys"\): string/,
    "Crypto target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsCryptoAutoProcess\(\s*form: HTMLFormElement,\s*immediate = false\s*\): void/s,
    "Crypto auto-process scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsCryptoProcess\(\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}\s*\): Promise<void>/s,
    "Crypto processor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsCryptoGenerateKeys\(\s*form: HTMLFormElement,\s*options: \{ autoEncryptAfterRsaKeys\?: boolean \} = \{\}\s*\): Promise<void>/s,
    "Crypto key generator should live in plugin-panel-impls"
  );
});

test("jwt helper flow lives with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    panelImplsSource,
    /createSubmitPluginPanelHandler\([\s\S]*?"form\.webtools-jwt-form"\s*\)/s,
    "JWT Enter handler should submit the panel form instead of calling renderer-local helpers"
  );

  [
    "function buildWebtoolsJwtTarget",
    "function getWebtoolsJwtSecretLabel",
    "function getWebtoolsJwtSecretPlaceholder",
    "function getWebtoolsJwtStatusContent",
    "function refreshWebtoolsJwtModeUi",
    "function refreshWebtoolsJwtResultInForm",
    "function scheduleWebtoolsJwtAutoParse",
    "function scheduleWebtoolsJwtAutoSign",
    "async function executeWebtoolsJwtAction"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });

  assert.equal(
    rendererSource.includes('executeWebtoolsJwtAction("parse", form, { render: false })'),
    false,
    "JWT Enter handler should not call the executor from renderer.ts"
  );

  assert.match(
    panelImplsSource,
    /function buildWebtoolsJwtTarget\(action: "parse" \| "sign" \| "verify"\): string/,
    "JWT target builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsJwtSecretLabel\(mode: "jws" \| "jwe", algorithm: "HS256" \| "RS256"\): string/,
    "JWT secret label helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsJwtSecretPlaceholder\(\s*mode: "jws" \| "jwe",\s*algorithm: "HS256" \| "RS256",\s*jweAlg: "dir" \| "A256KW"\s*\): string/s,
    "JWT secret placeholder helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsJwtStatusContent\(\): \{\s*text: string;\s*state: "ok" \| "error" \| "idle";\s*\}/s,
    "JWT status helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsJwtModeUi\(form: HTMLFormElement\): void/,
    "JWT mode refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function refreshWebtoolsJwtResultInForm\(form: HTMLFormElement\): void/,
    "JWT result refresh helper should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsJwtAutoParse\(form: HTMLFormElement, immediate = false\): void/,
    "JWT auto-parse scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function scheduleWebtoolsJwtAutoSign\(form: HTMLFormElement, immediate = false\): void/,
    "JWT auto-sign scheduler should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /async function executeWebtoolsJwtAction\(\s*action: "parse" \| "sign" \| "verify",\s*form: HTMLFormElement,\s*options: \{ render\?: boolean \} = \{\}\s*\): Promise<void>/s,
    "JWT executor should live in plugin-panel-impls"
  );
});

test("image prompt panel render/apply lives in plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const rendererHtmlSource = readRendererHtmlSource();
  const rendererStylesSource = readRendererStylesSource();
  const sharedImagePromptBuilderSource = readSharedImagePromptBuilderSource();
  const copyAssetsSource = readCopyAssetsSource();
  const panelImplsSource = readPanelImplsSource();
  const pluginRuntimeTypesSource = readPluginRuntimeTypesSource();

  assert.match(
    rendererSource,
    /const \{[\s\S]*WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID[\s\S]*\} = pluginConstants;/,
    "renderer should read the image prompt plugin id from shared plugin constants"
  );
  assert.match(
    rendererHtmlSource,
    /image-prompt-data\.js/,
    "renderer should load generated shared Image Prompt data before panel implementations"
  );
  assert.match(
    copyAssetsSource,
    /image-prompt-builder/,
    "asset copy step should generate renderer Image Prompt data from the shared builder"
  );
  assert.match(
    copyAssetsSource,
    /smartTemplates/,
    "asset copy step should expose shared Image Prompt smart templates to the renderer"
  );
  assert.match(
    copyAssetsSource,
    /typeof builder\.getImagePromptProductTemplates !== "function"/,
    "asset copy step should skip watch-time partial builder exports instead of throwing"
  );
  assert.match(
    panelImplsSource,
    /__LL_IMAGE_PROMPT_DATA__/,
    "panel impls should read Image Prompt config from the generated shared data global"
  );
  assert.equal(
    rendererSource.includes("smartTemplates"),
    false,
    "renderer should not keep Image Prompt smart template data inline"
  );
  assert.equal(
    rendererSource.includes("WebtoolsImagePromptTextDesign"),
    false,
    "renderer should not keep Image Prompt text design type declarations inline"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES = imagePromptData\.smartTemplates/,
    "plugin-panel-impls should hydrate Image Prompt smart templates from shared data"
  );
  assert.match(
    pluginRuntimeTypesSource,
    /designs: WebtoolsImagePromptTextDesign\[\];/,
    "plugin runtime types should declare scene-aware Image Prompt text designs"
  );
  assert.match(
    pluginRuntimeTypesSource,
    /design: string;/,
    "plugin runtime types should track the selected Image Prompt text design"
  );
  assert.match(
    pluginRuntimeTypesSource,
    /designId: string;/,
    "plugin runtime types should track a stable Image Prompt text design id"
  );
  assert.match(
    rendererSource,
    /title:\s*string/,
    "renderer Image Prompt text state should track structured birthday title text"
  );
  assert.equal(
    rendererSource.includes("const WEBTOOLS_IMAGE_PROMPT_ALL_STYLE_PRESETS"),
    false,
    "renderer should not maintain a duplicate Image Prompt style preset table"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /group:\s*"商品商业"/,
    "shared Image Prompt style presets should keep broad style groups"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /id:\s*"livestream-commerce"/,
    "shared Image Prompt data should include livestream commerce"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /id:\s*"medical-health"/,
    "shared Image Prompt data should include medical health"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /id:\s*"birthday-party"/,
    "shared Image Prompt data should include birthday party"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /exact:\s*"3周岁生日"/,
    "shared Image Prompt data should preserve birthday age text defaults"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /寿星照片放在画面中央的圆角照片框中/,
    "shared Image Prompt data should preserve birthday photo options"
  );
  assert.match(
    panelImplsSource,
    /\[WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "Image Prompt handler should render through panelImplsSafe"
  );
  assert.match(
    panelImplsSource,
    /getRegisteredPanelImpls\(\)\.applyWebtoolsImagePromptPanelPayload\(panel\)/,
    "Image Prompt handler should apply payload through panelImplsSafe"
  );
  assert.equal(
    rendererSource.includes("function renderWebtoolsImagePromptPanel"),
    false,
    "Image Prompt render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function applyWebtoolsImagePromptPanelPayload"),
    false,
    "Image Prompt apply implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /renderWebtoolsImagePromptPanel\(\): void/,
    "Image Prompt render implementation should be present in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptSelection-/,
    "Image Prompt panel should render selectable module options"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptStylePreset/,
    "Image Prompt panel should render style preset switching controls"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptStyleGroup/,
    "Image Prompt panel should render broad style group switching controls"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-prompt-preset-group-select/,
    "Image Prompt style groups should use a compact select"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES/,
    "Image Prompt panel should render smart template shortcuts"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptSmartTemplateId/,
    "Image Prompt panel should remember the selected smart template"
  );
  assert.match(
    panelImplsSource,
    /templateButton\.dataset\.selected = String\(webtoolsImagePromptSmartTemplateId === template\.id\)/,
    "Image Prompt smart template buttons should expose selected state"
  );
  assert.match(
    panelImplsSource,
    /syncWebtoolsImagePromptSmartTemplateSelection\(smartTemplateOptions\)/,
    "Image Prompt smart template clicks should refresh the visible selected button immediately"
  );
  assert.match(
    rendererStylesSource,
    /\.webtools-image-prompt-template\[data-selected="true"\]/,
    "Image Prompt smart template buttons should have a visible selected style"
  );
  assert.match(
    panelImplsSource,
    /智能模板/,
    "Image Prompt panel should label smart template shortcuts clearly"
  );
  assert.match(
    panelImplsSource,
    /createWebtoolsImagePromptSmartTemplateState/,
    "Image Prompt panel should apply shared smart templates as complete states"
  );
  assert.match(
    panelImplsSource,
    /state\?:\s*WebtoolsImagePromptState/,
    "Image Prompt build executor should support a direct state override for template shortcuts"
  );
  assert.match(
    panelImplsSource,
    /executeWebtoolsImagePromptBuild\(form,\s*\{[^}]*state:\s*next/s,
    "smart template shortcuts should build from the template state instead of collecting stale form controls"
  );
  {
    const updateSelectionSourceMatch = panelImplsSource.match(
      /const updateSelectionFromState = \(state: WebtoolsImagePromptState\): void => \{[\s\S]*?\n\s+\};/
    );
    assert.ok(
      updateSelectionSourceMatch,
      "Image Prompt panel should keep a local helper for applying template state to the form"
    );
    const updateSelectionSource = updateSelectionSourceMatch[0];
    assert.doesNotMatch(
      updateSelectionSource,
      /collectWebtoolsImagePromptState\(form\)/,
      "smart template application should not recollect stale visible form controls after syncing template text"
    );
    assert.match(
      updateSelectionSource,
      /filterWebtoolsImagePromptStateForStyle\(state\)/,
      "smart template application should keep the template state as the source of truth"
    );
  }
  assert.match(
    panelImplsSource,
    /updateSelectionFromState\(next\);\s*renderList\(\);[\s\S]*executeWebtoolsImagePromptBuild\(form,\s*\{\s*render:\s*true,\s*state:\s*next\s*\}\)/,
    "smart template clicks should rebuild the panel so text style and design controls follow the selected template"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT/,
    "Image Prompt panel should limit visible module options by default"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptExpandedGroups/,
    "Image Prompt panel should allow module option groups to expand"
  );
  assert.match(
    panelImplsSource,
    /更多|收起/,
    "Image Prompt panel should expose more/collapse controls for large option groups"
  );
  assert.match(
    panelImplsSource,
    /getWebtoolsImagePromptOptionGroupsForStyle/,
    "Image Prompt panel should filter module options by the selected style preset"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptInfo = "已复制到剪贴板"/,
    "Image Prompt copy should show a visible copied hint in the output header"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptPhotoDescription/,
    "birthday Image Prompt panel should collect the birthday person's photo description"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextDesign/,
    "Image Prompt panel should expose a scene-aware text design selector"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-prompt-text-design-card/,
    "Image Prompt panel should show the selected text design as a scannable card"
  );
  assert.match(
    panelImplsSource,
    /option\.value = design\.id/,
    "Image Prompt text design selector should use stable design ids as option values"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.typography/,
    "Image Prompt text design card should show typography guidance"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.color/,
    "Image Prompt text design card should show color guidance"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.layout/,
    "Image Prompt text design card should show layout guidance"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.safeArea/,
    "Image Prompt text design card should show safe-area guidance"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextTitle/,
    "birthday Image Prompt panel should expose a structured title field"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextAge/,
    "birthday Image Prompt panel should expose a structured age field"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextName/,
    "birthday Image Prompt panel should expose a structured name field"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextSubtitle/,
    "Image Prompt panel should expose an optional subtitle field"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS\.designs/,
    "Image Prompt panel should populate text design choices from shared data"
  );
  assert.match(
    panelImplsSource,
    /findWebtoolsImagePromptTextDesign/,
    "Image Prompt panel should resolve the selected text design metadata"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /文字设计：/,
    "shared Image Prompt builder should include text design instructions in output prompts"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /文字层级：/,
    "shared Image Prompt builder should include text hierarchy instructions in output prompts"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /生日文字结构：/,
    "shared Image Prompt builder should include structured birthday text instructions"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /温柔生日标题设计/,
    "shared Image Prompt data should include birthday-specific text design"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES/,
    "panel impls should define birthday example templates"
  );
  assert.match(
    panelImplsSource,
    /age:\s*"1周岁"/,
    "birthday example templates should sync one-year age into structured text state"
  );
  assert.match(
    panelImplsSource,
    /age:\s*"6周岁"/,
    "birthday example templates should sync older child age into structured text state"
  );
  assert.match(
    panelImplsSource,
    /1周岁宝宝|长辈温馨/,
    "birthday example templates should cover different birthday scenarios"
  );
  assert.match(
    panelImplsSource,
    /copyButton\.textContent = "已复制"/,
    "Image Prompt copy button should acknowledge a successful copy"
  );
  assert.equal(
    panelImplsSource.includes("webtoolsImagePromptSubject"),
    false,
    "Image Prompt panel should not fall back to the old manual subject textarea"
  );
});

test("image prompt base state helpers live with plugin-panel-impls instead of renderer", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  [
    "const imagePromptData",
    "const WEBTOOLS_IMAGE_PROMPT_PRODUCTS",
    "const WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS",
    "const WEBTOOLS_IMAGE_PROMPT_OPTION_GROUPS",
    "const WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED",
    "const WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES",
    "const WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS",
    "function findWebtoolsImagePromptTextDesign",
    "function createWebtoolsImagePromptTextState",
    "function applyWebtoolsImagePromptTextDesign",
    "function createEmptyWebtoolsImagePromptSelections",
    "function createEmptyWebtoolsImagePromptCustom",
    "function compactWebtoolsImagePromptOptions",
    "function normalizeWebtoolsImagePromptStylePresetId",
    "function getWebtoolsImagePromptStylePreset",
    "function createWebtoolsImagePromptSelectionStateFromPreset",
    "function getWebtoolsImagePromptOptionGroupsForStyle",
    "function createDefaultWebtoolsImagePromptState",
    "function normalizeWebtoolsImagePromptSmartTemplateId",
    "function getWebtoolsImagePromptSmartTemplate",
    "function createWebtoolsImagePromptSmartTemplateState",
    "function cloneWebtoolsImagePromptState",
    "function getWebtoolsImagePromptSelectedOptions",
    "const WEBTOOLS_IMAGE_PROMPT_EXAMPLE",
    "const WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES"
  ].forEach((signature) => {
    assert.equal(
      rendererSource.includes(signature),
      false,
      `${signature} should not remain in renderer.ts`
    );
  });

  assert.match(
    panelImplsSource,
    /const imagePromptData = window\.__LL_IMAGE_PROMPT_DATA__ as WebtoolsImagePromptData \| undefined;/,
    "Image Prompt shared data bootstrap should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_PRODUCTS = imagePromptData\.products;/,
    "Image Prompt product definitions should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_GROUP_KEYS: WebtoolsImagePromptOptionGroupKey\[\] = \[/,
    "Image Prompt option-group keys should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_OPTION_GROUPS = imagePromptData\.optionGroups;/,
    "Image Prompt option groups should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED = imagePromptData\.stylePresets;/,
    "Image Prompt style presets should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES = imagePromptData\.smartTemplates;/,
    "Image Prompt smart templates should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS = imagePromptData\.textOptions;/,
    "Image Prompt text options should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function findWebtoolsImagePromptTextDesign\(idOrLabel: string \| undefined\): WebtoolsImagePromptTextDesign/,
    "Image Prompt text design lookup should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsImagePromptTextState\(\s*defaults: Partial<WebtoolsImagePromptTextState> = \{\}/s,
    "Image Prompt text state builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function applyWebtoolsImagePromptTextDesign\(\s*text: WebtoolsImagePromptTextState,\s*design: WebtoolsImagePromptTextDesign/s,
    "Image Prompt text design applier should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createEmptyWebtoolsImagePromptSelections\(\): Record<[\s\S]*WebtoolsImagePromptOptionGroupKey,\s*string\[\]/,
    "Image Prompt empty selection factory should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createEmptyWebtoolsImagePromptCustom\(\): Record<[\s\S]*Exclude<WebtoolsImagePromptOptionGroupKey, "constraints">,\s*string/s,
    "Image Prompt empty custom-value factory should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function compactWebtoolsImagePromptOptions\(options: string\[\]\): string\[\]/,
    "Image Prompt option compactor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsImagePromptStylePresetId\(\s*value: string \| undefined\s*\): WebtoolsImagePromptStylePresetId/s,
    "Image Prompt style preset normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsImagePromptStylePreset\(\s*id: WebtoolsImagePromptStylePresetId\s*\): WebtoolsImagePromptStylePreset/s,
    "Image Prompt style preset accessor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsImagePromptSelectionStateFromPreset\(\s*stylePresetId: WebtoolsImagePromptStylePresetId\s*\): Record<[\s\S]*WebtoolsImagePromptOptionGroupKey,\s*string\[\]/,
    "Image Prompt preset selection builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsImagePromptOptionGroupsForStyle\(\s*stylePresetId: WebtoolsImagePromptStylePresetId\s*\): WebtoolsImagePromptOptionGroup\[\]/,
    "Image Prompt style option-group accessor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createDefaultWebtoolsImagePromptState\(\s*stylePresetId: WebtoolsImagePromptStylePresetId = "ecommerce-main"\s*\): WebtoolsImagePromptState/s,
    "Image Prompt default state builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function normalizeWebtoolsImagePromptSmartTemplateId\(\s*value: string \| undefined\s*\): WebtoolsImagePromptSmartTemplateId/s,
    "Image Prompt smart-template normalizer should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsImagePromptSmartTemplate\(\s*templateId: WebtoolsImagePromptSmartTemplateId\s*\): WebtoolsImagePromptSmartTemplate/s,
    "Image Prompt smart-template accessor should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function createWebtoolsImagePromptSmartTemplateState\(\s*templateId: WebtoolsImagePromptSmartTemplateId\s*\): WebtoolsImagePromptState/s,
    "Image Prompt smart-template state builder should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function cloneWebtoolsImagePromptState\(\s*state: WebtoolsImagePromptState\s*\): WebtoolsImagePromptState/s,
    "Image Prompt state cloner should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /function getWebtoolsImagePromptSelectedOptions\(\s*state: WebtoolsImagePromptState,\s*key: WebtoolsImagePromptOptionGroupKey\s*\): string\[\]/,
    "Image Prompt selected-option reader should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_EXAMPLE: WebtoolsImagePromptState = \{/,
    "Image Prompt example state should live in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /const WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES: Array<\{/,
    "Image Prompt birthday examples should live in plugin-panel-impls"
  );
});

test("image prompt style filtering does not recurse into itself", () => {
  const panelImplsSource = readPanelImplsSource();
  const filterSource = extractFunctionSource(
    panelImplsSource,
    "filterWebtoolsImagePromptStateForStyle"
  );

  assert.equal(
    filterSource.includes("return filterWebtoolsImagePromptStateForStyle("),
    false,
    "style filtering should return the filtered state instead of recursing"
  );
  assert.match(filterSource, /return next;/);
});

test("image prompt keeps selected style when switching only style groups", () => {
  const panelImplsSource = readPanelImplsSource();
  const collectSource = extractFunctionSource(panelImplsSource, "collectWebtoolsImagePromptState");

  assert.match(
    collectSource,
    /webtoolsImagePromptState\.stylePresetId/,
    "collecting image prompt state should fall back to the current style preset"
  );
  assert.doesNotMatch(
    collectSource,
    /stylePresetId:\s*normalizeWebtoolsImagePromptStylePresetId\(stylePresetValue\)/,
    "missing style radio after switching groups should not reset the selected style"
  );
});

test("launch execution skips stale refresh after panel-opening commands", () => {
  const rendererSource = readRendererSource();
  const executeSelectedSource = extractFunctionSource(rendererSource, "executeSelected");

  assert.match(
    rendererSource,
    /function isPanelOpeningLaunchItem\(item: LaunchItem\): boolean/,
    "panel-opening launch items should be detected explicitly"
  );
  assert.match(
    executeSelectedSource,
    /const modeBeforeExecute = mode;/,
    "executeSelected should remember the mode before executing a launch item"
  );
  assert.match(
    executeSelectedSource,
    /const queryBeforeExecute = currentQuery;/,
    "executeSelected should remember the query before executing a launch item"
  );
  assert.match(
    executeSelectedSource,
    /if\s*\(isPanelOpeningLaunchItem\(selected\.item\)\)\s*{\s*return;\s*}/,
    "plugin panel open commands should not refresh the search list after opening"
  );
  assert.match(
    executeSelectedSource,
    /if\s*\(\s*mode !== modeBeforeExecute \|\| currentQuery !== queryBeforeExecute\s*\)\s*{\s*return;\s*}\s*await refreshEntries\(currentQuery\);/s,
    "keepOpen refresh should be skipped after async mode/query changes"
  );
});

test("json schema and data mask panels live in plugin-panel-impls", () => {
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();

  assert.match(panelImplsSource, /renderWebtoolsJsonSchemaPanel\(\): void/);
  assert.match(
    panelImplsSource,
    /applyWebtoolsJsonSchemaPanelPayload\(panel: ActivePluginPanelState\)/
  );
  assert.match(panelImplsSource, /executeWebtoolsJsonSchemaValidate/);
  assert.match(panelImplsSource, /renderWebtoolsDataMaskPanel\(\): void/);
  assert.match(
    panelImplsSource,
    /applyWebtoolsDataMaskPanelPayload\(panel: ActivePluginPanelState\)/
  );
  assert.match(panelImplsSource, /renderCashflowReviewPanelView/);
  assert.match(panelImplsSource, /cashflowReviewMode/);
  assert.match(stylesSource, /\.webtools-json-schema-editors/);
  assert.match(stylesSource, /\.cashflow-review-timeline/);
});

test("database layers use built-in node:sqlite instead of sqlite3 native addon", () => {
  const mainDatabaseSource = readMainDatabaseSource();
  const clipboardWorkbenchStoreSource = readClipboardWorkbenchStoreSource();

  assert.match(
    mainDatabaseSource,
    /from "node:sqlite"/,
    "LiteDatabase should use the built-in node:sqlite module"
  );
  assert.doesNotMatch(
    mainDatabaseSource,
    /from "sqlite3"/,
    "LiteDatabase should no longer import sqlite3"
  );
  assert.match(
    clipboardWorkbenchStoreSource,
    /from "node:sqlite"/,
    "ClipboardWorkbenchStore should use the built-in node:sqlite module"
  );
  assert.doesNotMatch(
    clipboardWorkbenchStoreSource,
    /from "sqlite3"/,
    "ClipboardWorkbenchStore should no longer import sqlite3"
  );
});
