import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("dictionary plugin is registered with IPC lookup and renderer panel", () => {
  const pluginsSource = readSource("src/main/plugins/index.ts");
  const pluginSource = readSource("src/main/plugins/dictionary/index.ts");
  const sharedSource = readSource("src/shared/dictionary.ts");
  const panelImplsSource = readSource("src/renderer/plugin-panel-impls.ts");
  const handlerConfigSource = readSource("src/renderer/plugin-handler-config.ts");
  const iconsSource = readSource("src/main/plugins/webtools-shared/index.ts");
  const constantsSource = readSource("src/renderer/plugin-constants.ts");
  const mainIndexSource = readSource("src/main/index.ts");

  assert.match(pluginsSource, /dictionaryPlugin/);
  assert.match(pluginsSource, /"dictionary"/);
  assert.match(pluginSource, /const PLUGIN_ID = DICTIONARY_PLUGIN_ID/);
  assert.match(pluginSource, /离线词典/);
  assert.match(sharedSource, /DICTIONARY_PLUGIN_ID\s*=\s*"dictionary"/);
  assert.match(panelImplsSource, /DICTIONARY_PLUGIN_ID/);
  assert.match(
    panelImplsSource,
    /renderDictionaryPanel[\s\S]*dictionary-query[\s\S]*dictionary-result-card/
  );
  assert.match(panelImplsSource, /lookupDictionaryCandidates/);
  assert.match(panelImplsSource, /其他释义/);
  assert.match(panelImplsSource, /收藏备注|updateDictionaryFavoriteNote/);
  assert.match(panelImplsSource, /dictionary-history-filters/);
  assert.match(panelImplsSource, /getDictionaryPanelState/);
  assert.match(panelImplsSource, /recordDictionaryLookup/);
  assert.match(panelImplsSource, /toggleDictionaryFavorite/);
  assert.match(
    panelImplsSource,
    /dictionary-side-section[\s\S]*最近查询[\s\S]*收藏/
  );
  assert.match(panelImplsSource, /applyDictionaryPanelPayload/);
  assert.match(handlerConfigSource, /dictionary-form/);
  assert.match(handlerConfigSource, /dictionary-lookup/);
  assert.match(iconsSource, /"dictionary"/);
  assert.match(constantsSource, /DICTIONARY_PLUGIN_ID:\s*"dictionary"/);
  assert.match(constantsSource, /"dictionary"/);
  assert.match(mainIndexSource, /"dictionary"/);
});
