import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("selection-translate capture restores clipboard and uses SendKeys ^c", () => {
  const captureSource = readSource("src/main/selection-translate/capture.ts");
  assert.match(captureSource, /SendWait\('\^c'\)/);
  assert.match(captureSource, /clipboard\.writeText\(baseline\)/);
  assert.match(captureSource, /export async function captureSelectedText/);
});

test("selection-translate global shortcut and word/sentence routing exist", () => {
  const mainSource = readSource("src/main/index.ts");
  assert.match(mainSource, /registerSelectionTranslateShortcut/);
  assert.match(mainSource, /runSelectionTranslate/);
  assert.match(mainSource, /isEnglishWordOrPhrase/);
  assert.match(mainSource, /isSingleEnglishWord/);
  assert.match(mainSource, /dictionaryStore\.lookup/);
  assert.match(mainSource, /离线词典未收录该单词，不会请求百度翻译/);
  assert.match(mainSource, /translateTextForTool/);
  assert.match(mainSource, /showSelectionPopup/);
});

test("selection-translate popup window and renderer assets exist", () => {
  const popupSource = readSource("src/main/selection-translate/popup-window.ts");
  const preloadSource = readSource("src/preload/selection-popup.ts");
  const htmlSource = readSource("src/renderer/selection-popup.html");
  const cssSource = readSource("src/renderer/selection-popup.css");
  const tsSource = readSource("src/renderer/selection-popup.ts");
  const copyAssets = readSource("scripts/copy-assets.cjs");

  assert.match(popupSource, /showSelectionPopup/);
  assert.match(popupSource, /getCursorScreenPoint/);
  assert.match(popupSource, /dismissBackdropWindow/);
  assert.match(popupSource, /before-input-event/);
  assert.match(preloadSource, /selectionPopup/);
  assert.match(htmlSource, /selection-popup\.js/);
  assert.match(cssSource, /\.selection-popup/);
  assert.match(tsSource, /mode === "dictionary"/);
  assert.match(tsSource, /^\(\(\) => \{/m);
  assert.doesNotMatch(tsSource, /^import /m);
  assert.match(copyAssets, /selection-popup\.html/);
});

test("selection-translate settings store is wired", () => {
  const settingsSource = readSource("src/main/selection-translate/settings.ts");
  const sharedSource = readSource("src/shared/selection-translate.ts");
  const channelsSource = readSource("src/shared/channels.ts");
  const ipcSource = readSource("src/main/ipc.ts");
  const preloadSource = readSource("src/preload/index.ts");

  assert.match(sharedSource, /hotkey:\s*"F2"/);
  assert.match(settingsSource, /selectionTranslateSettings/);
  assert.match(channelsSource, /getSelectionTranslateSettings:/);
  assert.match(channelsSource, /setSelectionTranslateSettings:/);
  assert.match(ipcSource, /selectionTranslateProvider/);
  assert.match(preloadSource, /getSelectionTranslateSettings\(/);
  assert.match(preloadSource, /setSelectionTranslateSettings\(/);
});
