import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("webtools-translate plugin is registered with IPC and renderer panel", () => {
  const pluginsSource = readSource("src/main/plugins/index.ts");
  const pluginSource = readSource("src/main/plugins/webtools-translate/index.ts");
  const sharedSource = readSource("src/shared/translate.ts");
  const channelsSource = readSource("src/shared/channels.ts");
  const preloadSource = readSource("src/preload/index.ts");
  const ipcSource = readSource("src/main/ipc.ts");
  const mainIndexSource = readSource("src/main/index.ts");
  const panelImplsSource = readSource("src/renderer/plugin-panel-impls.ts");
  const handlerConfigSource = readSource("src/renderer/plugin-handler-config.ts");
  const iconsSource = readSource("src/main/plugins/webtools-shared/index.ts");
  const constantsSource = readSource("src/renderer/plugin-constants.ts");

  assert.match(pluginsSource, /webtoolsTranslatePlugin/);
  assert.match(pluginsSource, /"webtools-translate"/);
  assert.match(pluginSource, /const PLUGIN_ID = TRANSLATE_TOOL_PLUGIN_ID/);
  assert.match(pluginSource, /文本翻译/);
  assert.match(sharedSource, /TRANSLATE_TOOL_PLUGIN_ID\s*=\s*"webtools-translate"/);
  assert.match(channelsSource, /getTranslateToolSettings:/);
  assert.match(channelsSource, /setTranslateToolSettings:/);
  assert.match(channelsSource, /translateToolTranslateText:/);
  assert.match(preloadSource, /getTranslateToolSettings\(/);
  assert.match(preloadSource, /setTranslateToolSettings\(/);
  assert.match(preloadSource, /translateToolTranslateText\(/);
  assert.match(ipcSource, /TranslateToolProvider/);
  assert.match(ipcSource, /IPC_CHANNELS\.translateToolTranslateText/);
  assert.match(mainIndexSource, /translateSettingsStore/);
  assert.match(mainIndexSource, /translateTextForTool/);
  assert.match(mainIndexSource, /translateToolProvider/);
  assert.match(panelImplsSource, /WEBTOOLS_TRANSLATE_PLUGIN_ID/);
  assert.match(
    panelImplsSource,
    /renderWebtoolsTranslatePanel[\s\S]*webtools-translate-source[\s\S]*webtools-translate-result/
  );
  assert.match(
    panelImplsSource,
    /translateToolTranslateText[\s\S]*baiduAppId/
  );
  assert.match(
    panelImplsSource,
    /applyWebtoolsTranslatePanelPayload[\s\S]*translateToolSourceText = ""/,
    "translate panel should clear previous text on open"
  );
  assert.match(panelImplsSource, /selectionTranslateEnabled/);
  assert.match(panelImplsSource, /selectionTranslateHotkey/);
  assert.match(panelImplsSource, /webtools-translate-dictionary-card/);
  assert.match(panelImplsSource, /lookupDictionaryWord/);
  assert.match(panelImplsSource, /setSelectionTranslateSettings/);
  assert.match(handlerConfigSource, /webtools-translate-form/);
  assert.match(handlerConfigSource, /translate-run/);
  assert.match(iconsSource, /"webtools-translate"/);
  assert.match(constantsSource, /WEBTOOLS_TRANSLATE_PLUGIN_ID:\s*"webtools-translate"/);
  assert.match(constantsSource, /"webtools-translate"/);
});
