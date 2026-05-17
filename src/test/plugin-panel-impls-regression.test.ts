import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");
const rendererHtmlPath = path.join(process.cwd(), "src", "renderer", "index.html");
const rendererStylesPath = path.join(process.cwd(), "src", "renderer", "styles.css");
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

function readRendererSource(): string {
  return fs.readFileSync(rendererPath, "utf8");
}

function readPanelImplsSource(): string {
  return fs.readFileSync(panelImplsPath, "utf8");
}

function readRendererHtmlSource(): string {
  return fs.readFileSync(rendererHtmlPath, "utf8");
}

function readRendererStylesSource(): string {
  return fs.readFileSync(rendererStylesPath, "utf8");
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
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsFileHashPanel/,
    "File Hash handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsFileHashPanelPayload/,
    "File Hash handler should apply payload through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsPortHelperPanel/,
    "Port Helper handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsPortHelperPanelPayload/,
    "Port Helper handler should apply payload through panelImplsSafe"
  );

  assert.match(panelImplsSource, /renderWebtoolsFileHashPanel\(\): void/);
  assert.match(panelImplsSource, /renderWebtoolsPortHelperPanel\(\): void/);
});

test("Clipboard Workbench panel is implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();

  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderClipboardWorkbenchPanel/,
    "Clipboard Workbench handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyClipboardWorkbenchPanelPayload/,
    "Clipboard Workbench handler should apply payload through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /runWithPluginForm\("form\.clipboard-workbench-form"/,
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
    /\.clipboard-workbench-panel[\s\S]*height:\s*min\(78vh,\s*760px\);/,
    "Clipboard Workbench panel should cap its height for compact browsing"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-list,\s*[\s\S]*\.clipboard-workbench-detail[\s\S]*overflow:\s*auto;/,
    "Clipboard Workbench content panes should scroll internally"
  );
  assert.match(
    stylesSource,
    /\.clipboard-workbench-manual-text[\s\S]*max-height:\s*44px;/,
    "Clipboard Workbench draft box should stay compact by default"
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
    rendererSource,
    /render:\s*panelImplsSafe\.renderCodeAgentSwitchPanel/,
    "CodeAgent Switch handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyCodeAgentSwitchPanelPayload/,
    "CodeAgent Switch handler should apply payload through panelImplsSafe"
  );
  assert.match(panelImplsSource, /renderCodeAgentSwitchPanel\(\): void/);
  assert.match(panelImplsSource, /applyCodeAgentSwitchPanelPayload\(panel: unknown\): void/);
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
    "CodeAgent Switch profile rows should expose visible preview/apply switch actions"
  );
  assert.match(
    panelImplsSource,
    /executeCodeAgentSwitchAction\("apply", profile\.id\)/,
    "CodeAgent Switch profile rows should make switching available without hunting in the detail pane"
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
    /codeAgentSwitchCopyState:\s*"" \| "env" \| "diagnostics" \| "diff" \| "key"/,
    "CodeAgent Switch should keep key copy feedback separate from generic env command copy feedback"
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
    "CodeAgent Switch should make Profile the primary selectable list"
  );
  assert.match(
    panelImplsSource,
    /codeagent-switch-provider-strip/,
    "CodeAgent Switch should keep Provider selection as a compact strip"
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
    "CodeAgent Switch should expose a runtime permissions section"
  );
  assert.match(
    panelImplsSource,
    /save-runtime/,
    "CodeAgent Switch should support saving runtime permissions"
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
    /grid-template-columns:\s*112px\s+minmax\(220px,\s*0\.58fr\)\s+minmax\(360px,\s*1\.42fr\)/,
    "CodeAgent Switch shell should reserve a fixed-width tool sidebar and give more room to detail"
  );
  assert.match(
    stylesSource,
    /\.codeagent-switch-tool-button/,
    "CodeAgent Switch tool buttons should be fixed sidebar buttons instead of auto-stretched tabs"
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
  const migratedPanels = ["Diff", "Config", "Sql", "Crypto", "Jwt"];

  for (const panelName of migratedPanels) {
    assert.match(
      rendererSource,
      new RegExp(`render:\\s*panelImplsSafe\\.renderWebtools${panelName}Panel`),
      `${panelName} handler should render through panelImplsSafe`
    );
    assert.match(
      rendererSource,
      new RegExp(`onOpen:\\s*panelImplsSafe\\.applyWebtools${panelName}PanelPayload`),
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
  const panelImplsSource = readPanelImplsSource();

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
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-strings-uuid-item\s*\{[\s\S]*grid-template-columns:\s*1fr/,
    "string UUID rows should stop stretching into uneven columns on narrow windows"
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
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-qrcode-layout[\s\S]*grid-template-columns:\s*minmax\(0,\s*1fr\)/,
    "QR setup and preview should stop trying to hold two columns on narrow windows"
  );
  assert.match(
    stylesSource,
    /@media \(max-width:\s*\d+px\)[\s\S]*\.webtools-ua-grid,[\s\S]*?\{[\s\S]*grid-template-columns:\s*1fr/,
    "UA detail cards should stack into one readable column on narrow windows"
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
    /webtools-password-workbench/,
    "password tool should render a two-part workbench instead of stretched rows"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-preset-grid/,
    "password tool should expose quick presets to fill the layout with useful actions"
  );
  assert.match(
    panelImplsSource,
    /webtools-password-summary-grid/,
    "password tool should render a real-time summary area instead of leaving the side empty"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-workbench\s*\{[\s\S]*grid-template-columns:\s*minmax\(360px,\s*1\.45fr\)\s+minmax\(230px,\s*0\.75fr\)/,
    "password tool workbench should reserve a compact summary column instead of stretching one giant form"
  );
  assert.match(
    stylesSource,
    /\.webtools-password-preset-grid\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(96px,\s*1fr\)\)/,
    "password preset buttons should use bounded widths instead of auto-stretching across the row"
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
  assert.match(
    panelImplsSource,
    /webtools-json-structure-card/,
    "JSON/CSV tool should render a structure preview section for parsed payloads"
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
    /\.webtools-json-control-panel\s*\{[\s\S]*grid-template-columns:\s*minmax\(340px,\s*400px\)\s+minmax\(260px,\s*1\.1fr\)\s+minmax\(220px,\s*0\.95fr\)/,
    "JSON/CSV controls should use a three-part top deck so the width is filled by converter, routes, and samples"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-lab\s*\{[\s\S]*grid-template-rows:\s*auto\s+auto\s+minmax\(0,\s*1fr\)\s+auto;/,
    "JSON/CSV form should reserve the remaining height for the editor workspace"
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
    /\.webtools-json-sample-grid\s*\{[\s\S]*repeat\(auto-fit,\s*minmax\(116px,\s*148px\)\)/,
    "JSON/CSV sample buttons should use a denser card width that better fills the top deck"
  );
  assert.match(
    stylesSource,
    /\.webtools-json-textarea\s*\{[\s\S]*flex:\s*1\s+1\s+auto;[\s\S]*min-height:\s*clamp\(240px,\s*46vh,\s*460px\)/,
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

test("lightweight webtools wrappers are removed from renderer handlers", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const directPanels = [
    "Password",
    "Json",
    "Url",
    "Timestamp",
    "Cron",
    "Strings",
    "Colors",
    "Qrcode",
    "Ua",
    "Api",
    "HttpMock"
  ];

  for (const panelName of directPanels) {
    assert.match(
      rendererSource,
      new RegExp(`render:\\s*panelImplsSafe\\.renderWebtools${panelName}Panel`),
      `${panelName} handler should render directly through panelImplsSafe`
    );
    assert.match(
      rendererSource,
      new RegExp(`onOpen:\\s*panelImplsSafe\\.applyWebtools${panelName}PanelPayload`),
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

test("markdown panel render/apply lives in plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsMarkdownPanel/,
    "Markdown handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsMarkdownPanelPayload/,
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

test("image prompt panel render/apply lives in plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const rendererHtmlSource = readRendererHtmlSource();
  const rendererStylesSource = readRendererStylesSource();
  const sharedImagePromptBuilderSource = readSharedImagePromptBuilderSource();
  const copyAssetsSource = readCopyAssetsSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    rendererSource,
    /WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID = "webtools-image-prompt"/,
    "renderer should know the image prompt plugin id"
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
    rendererSource,
    /__LL_IMAGE_PROMPT_DATA__/,
    "renderer should read Image Prompt config from the generated shared data global"
  );
  assert.match(
    rendererSource,
    /smartTemplates/,
    "renderer Image Prompt data should include smart templates"
  );
  assert.match(
    rendererSource,
    /designs:\s*WebtoolsImagePromptTextDesign\[\]/,
    "renderer Image Prompt text options should include scene-aware text designs"
  );
  assert.match(
    rendererSource,
    /design:\s*string/,
    "renderer Image Prompt text state should track the selected text design"
  );
  assert.match(
    rendererSource,
    /designId:\s*string/,
    "renderer Image Prompt text state should track a stable text design id"
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
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsImagePromptPanel/,
    "Image Prompt handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsImagePromptPanelPayload/,
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
    rendererSource,
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
      /const updateSelectionFromState = \(state: WebtoolsImagePromptState\): void => \{[\s\S]*?\n    \};/
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
    rendererSource,
    /WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES/,
    "renderer should define birthday example templates"
  );
  assert.match(
    rendererSource,
    /age:\s*"1周岁"/,
    "birthday example templates should sync one-year age into structured text state"
  );
  assert.match(
    rendererSource,
    /age:\s*"6周岁"/,
    "birthday example templates should sync older child age into structured text state"
  );
  assert.match(
    rendererSource,
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

test("image prompt style filtering does not recurse into itself", () => {
  const rendererSource = readRendererSource();
  const filterSource = extractFunctionSource(
    rendererSource,
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
  const rendererSource = readRendererSource();
  const collectSource = extractFunctionSource(rendererSource, "collectWebtoolsImagePromptState");

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
