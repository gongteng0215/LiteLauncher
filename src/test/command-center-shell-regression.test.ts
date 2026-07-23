import fs from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    console.error(message);
    process.exit(1);
  }
}

const root = path.resolve(process.cwd());
const indexHtml = fs.readFileSync(path.join(root, "src/renderer/index.html"), "utf8");
const configSource = fs.readFileSync(
  path.join(root, "src/renderer/command-center-config.ts"),
  "utf8"
);
const uiSource = fs.readFileSync(path.join(root, "src/renderer/command-center-ui.ts"), "utf8");
const rendererSource = fs.readFileSync(path.join(root, "src/renderer/renderer.ts"), "utf8");
const windowSource = fs.readFileSync(path.join(root, "src/main/window.ts"), "utf8");
const mainIndexSource = fs.readFileSync(path.join(root, "src/main/index.ts"), "utf8");
const ipcSource = fs.readFileSync(path.join(root, "src/main/ipc.ts"), "utf8");

assert(indexHtml.includes('class="shell launcher-shell"'), "index.html must use launcher-shell");
assert(!indexHtml.includes('recent-grid section-grid'), "command center grids must not use legacy section-grid class");
assert(indexHtml.includes('id="cc-command"'), "index.html must include command zone");
assert(indexHtml.includes('id="search-backdrop"'), "index.html must include search backdrop");
assert(indexHtml.includes("command-center-config.js"), "index.html must load command-center-config.js");
assert(indexHtml.includes("command-center-ui.js"), "index.html must load command-center-ui.js");
assert(indexHtml.includes("ui-theme.js"), "index.html must load ui-theme.js before renderer");
assert(
  indexHtml.indexOf("ui-theme.js") < indexHtml.indexOf("renderer.js"),
  "ui-theme.js must load before renderer.js"
);
assert(indexHtml.includes("styles-command-center.css"), "index.html must load command-center styles");
assert(indexHtml.includes("styles-theme.css"), "index.html must load global theme tokens first");
assert(
  indexHtml.indexOf("styles-theme.css") < indexHtml.indexOf("styles-plugin-theme-remaps.css") &&
    indexHtml.indexOf("styles-plugin-theme-remaps.css") <
      indexHtml.indexOf("styles-command-center.css"),
  "theme → remaps → command-center load order must be preserved"
);
assert(
  fs.readFileSync(path.join(root, "src/renderer/styles-theme.css"), "utf8").includes("--ll-accent:"),
  "styles-theme.css must define --ll-accent for global recolor"
);

assert(configSource.includes("clipboard-workbench"), "quick entries must include clipboard workbench");
assert(configSource.includes("webtools-port-helper"), "system entries must include port helper");
assert(
  /label:\s*"划词翻译",\s*icon:\s*"translate",\s*action:\s*\{\s*type:\s*"plugin",\s*pluginId:\s*"webtools-translate"\s*\}/.test(
    configSource
  ),
  "划词翻译 quick entry must open webtools-translate plugin"
);

assert(uiSource.includes("syncHomeChromeVisibility"), "command center ui must expose home visibility sync");
assert(uiSource.includes("openSettingsOverlay"), "command center ui must expose settings overlay");
assert(uiSource.includes("cc-settings-overlay-dialog"), "settings overlay must use cc dialog class");

assert(rendererSource.includes("renderSearchSections"), "renderer must keep search section rendering");
assert(rendererSource.includes("commandCenterUi.initCommandCenterUi"), "renderer must init command center ui");
assert(rendererSource.includes("renderCommandResults"), "renderer must render inline command results");
assert(rendererSource.includes("cc-settings-shell"), "settings panel must use command-center shell");
assert(rendererSource.includes("settings-body"), "settings panel must include body/nav shell");
assert(rendererSource.includes("showSettingsTab"), "settings panel must switch single group tabs");
assert(rendererSource.includes("resetLauncherToHomeState"), "renderer must reset to home on hide");
assert(rendererSource.includes("__LL_PREPARE_HIDE__"), "renderer must expose prepare-hide hook for main");
assert(
  /onClearInput\([\s\S]*resetLauncherToHomeState/.test(rendererSource),
  "clearInput on hide must synchronously restore home state"
);
assert(
  /resetLauncherToHomeState\(\{\s*refreshHome:\s*false\s*\}\)[\s\S]*launcher\.hide\(/.test(
    rendererSource
  ),
  "Esc hide must paint home chrome before window.hide"
);
assert(
  windowSource.includes("hideLauncherWindow") &&
    windowSource.includes("__LL_PREPARE_HIDE__") &&
    windowSource.includes("prepareLauncherHomeBeforeHide") &&
    windowSource.includes("setOpacity") &&
    windowSource.includes("showLauncherWindowAsync"),
  "main hide/show paths must reset home, wait for paint, and gate opacity"
);
assert(
  /void hideLauncherWindow\(launcherWindow\)/.test(mainIndexSource) &&
    /await hideLauncherWindow\(window\)/.test(ipcSource),
  "blur/close/ipc hide must use hideLauncherWindow"
);
assert(
  mainIndexSource.includes("wm-window-animations-disabled"),
  "main must disable Windows window show/hide animations that replay stale frames"
);
assert(
  rendererSource.includes("onPrepareHide") && rendererSource.includes("ackPrepareHide"),
  "renderer must ack prepare-hide after painting home"
);
assert(
  rendererSource.includes("tryRestoreCachedHomeSections") &&
    rendererSource.includes("markHomeSectionsDirty") &&
    rendererSource.includes("cachedSearchLaunchItems"),
  "renderer must cache home sections and search pages for faster restore"
);
assert(
  /SEARCH_INPUT_DEBOUNCE_MS\s*=\s*320/.test(rendererSource),
  "search debounce should stay snappy (~320ms)"
);
assert(
  !/resolveCommandQuery\(parsedQuery\.query\)/.test(rendererSource),
  "search hot path must not double-fetch dynamic commands via resolveCommandQuery"
);
assert(rendererSource.includes("设置中心"), "settings panel title must be 设置中心");
assert(rendererSource.includes("外观主题"), "settings panel must include appearance theme tab");
assert(
  rendererSource.includes("getUiThemeConfig") &&
    rendererSource.includes("setUiThemeConfig") &&
    rendererSource.includes("applyUiThemeConfig"),
  "renderer must load/apply/persist UI theme from settings"
);
assert(
  fs.existsSync(path.join(root, "src/renderer/ui-theme.ts")) &&
    fs.existsSync(path.join(root, "src/shared/ui-theme.ts")),
  "shared + renderer ui-theme modules must exist"
);
assert(
  fs
    .readFileSync(path.join(root, "src/shared/channels.ts"), "utf8")
    .includes("getUiThemeConfig") &&
    fs
      .readFileSync(path.join(root, "src/shared/channels.ts"), "utf8")
      .includes("setUiThemeConfig"),
  "IPC channels must expose ui theme get/set"
);
assert(
  rendererSource.includes("loadSettingsPanelData") &&
    /async function openSettingsPanel[\s\S]*await loadSettingsPanelData/.test(rendererSource),
  "settings overlay must load version/status data before render"
);

const ccStyles = fs.readFileSync(
  path.join(root, "src/renderer/styles-command-center.css"),
  "utf8"
);
assert(
  ccStyles.includes(".cc-settings-overlay-dialog"),
  "command-center styles must scope settings overlay dialog"
);
assert(
  ccStyles.includes(".settings-theme-presets"),
  "command-center styles must include theme preset picker"
);
assert(
  !/#151127|#1b1535|#9f72e7|rgba\(\s*180\s*,\s*123\s*,\s*255/.test(ccStyles),
  "command-center styles must not hardcode purple surfaces/accents after theme remap"
);
assert(
  ccStyles.includes("var(--ll-accent)") &&
    ccStyles.includes("rgba(var(--ll-accent-rgb)"),
  "command-center styles must use --ll-accent tokens for theme switching"
);
assert(
  ccStyles.includes("body.mode-plugin .settings-btn-primary"),
  "command-center styles must restyle plugin primary buttons"
);
assert(
  ccStyles.includes("body.mode-plugin .webtools-tool-title"),
  "command-center styles must restyle webtools shared title"
);
assert(
  ccStyles.includes("body.mode-plugin .panel-section.results") &&
    ccStyles.includes("overflow-y: auto"),
  "plugin/cashflow panels must allow vertical scrolling"
);
assert(
  ccStyles.includes("body.mode-cashflow .cashflow-panel.settings-panel") &&
    ccStyles.includes("body.mode-cashflow .cashflow-progress-fill") &&
    ccStyles.includes("body.mode-cashflow .cashflow-opportunity-card"),
  "cashflow family must use command-center violet tokens"
);
assert(
  ccStyles.includes(".cc-settings-overlay-dialog .settings-plugin-grid") &&
    ccStyles.includes("repeat(auto-fill, 64px)"),
  "settings plugin picker must keep multi-column tile grid"
);
assert(
  fs.existsSync(path.join(root, "src/renderer/styles-plugin-theme-remaps.css")),
  "plugin theme remaps stylesheet must exist"
);
assert(
  fs
    .readFileSync(path.join(root, "src/renderer/styles-plugin-theme-remaps.css"), "utf8")
    .includes("body.mode-plugin .webtools-password-hero-title"),
  "plugin theme remaps must cover webtools cyan titles"
);

for (const scriptName of ["command-center-config.js", "command-center-ui.js"]) {
  const compiled = fs.readFileSync(path.join(root, "dist/renderer", scriptName), "utf8");
  assert(
    !compiled.includes("exports."),
    `${scriptName} must not emit CommonJS exports (loaded as browser script)`
  );
}

console.log("command-center-shell-regression.test.ts passed");
