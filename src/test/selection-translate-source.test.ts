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
  assert.match(mainSource, /isDictionaryLookupText/);
  assert.match(mainSource, /dictionaryStore\.lookup/);
  assert.match(mainSource, /translateTextForTool/);
  assert.match(mainSource, /showSelectionPopup/);
  assert.doesNotMatch(mainSource, /不会请求百度翻译/);
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
  assert.match(popupSource, /selection-backdrop\.html/);
  assert.match(popupSource, /resolveBackdropPreloadPath/);
  assert.match(popupSource, /ensureDismissBackdropVisible/);
  assert.match(popupSource, /dismissOnOutsideClickEnabled/);
  assert.match(popupSource, /setAlwaysOnTop\(true, "floating"\)/);
  assert.match(popupSource, /setAlwaysOnTop\(true, "screen-saver"\)/);
  assert.match(popupSource, /POPUP_WIDTH = 420/);
  assert.match(popupSource, /POPUP_HEIGHT_WITH_CANDIDATES = 480/);
  assert.match(popupSource, /popupRequestSequence/);
  assert.match(popupSource, /isCurrentPopupRequest/);
  assert.match(cssSource, /flex:\s*0 0 auto/);
  assert.match(cssSource, /scrollbar-gutter:\s*stable/);
  assert.match(preloadSource, /selectionPopup/);
  assert.match(htmlSource, /selection-popup\.js/);
  assert.match(cssSource, /\.selection-popup/);
  assert.match(tsSource, /mode === "dictionary"/);
  assert.match(tsSource, /其他释义|selection-popup__candidate/);
  assert.match(tsSource, /中→英|英→中/);
  assert.match(tsSource, /^\(\(\) => \{/m);
  assert.doesNotMatch(tsSource, /^import /m);
  assert.match(copyAssets, /selection-popup\.html/);
  assert.match(copyAssets, /selection-backdrop\.html/);
});

test("selection-translate settings store is wired", () => {
  const settingsSource = readSource("src/main/selection-translate/settings.ts");
  const sharedSource = readSource("src/shared/selection-translate.ts");
  const popupSource = readSource("src/main/selection-translate/popup-window.ts");
  const mainSource = readSource("src/main/index.ts");
  const panelImplsSource = readSource("src/renderer/plugin-panel-impls.ts");
  const channelsSource = readSource("src/shared/channels.ts");
  const ipcSource = readSource("src/main/ipc.ts");
  const preloadSource = readSource("src/preload/index.ts");

  assert.match(sharedSource, /dismissOnOutsideClick/);
  assert.match(sharedSource, /anchorPoint\?: \{ x: number; y: number \}/);
  assert.match(sharedSource, /hotkey:\s*"F4"/);
  assert.match(sharedSource, /passthroughWindows/);
  assert.match(settingsSource, /dismissOnOutsideClick/);
  assert.match(settingsSource, /raw === "F2" \? "F4"/);
  assert.match(settingsSource, /selectionTranslateSettings/);
  assert.match(popupSource, /getVirtualDesktopBounds/);
  assert.match(popupSource, /display-metrics-changed/);
  assert.match(popupSource, /passthroughWindows/);
  assert.match(popupSource, /pop-up-menu/);
  assert.match(popupSource, /elevatePassthroughWindows/);
  assert.match(popupSource, /ensureDismissBackdropVisible/);
  assert.match(popupSource, /dismissOnOutsideClickEnabled/);
  assert.match(popupSource, /setAlwaysOnTop\(true, "floating"\)/);
  assert.match(popupSource, /setAlwaysOnTop\(true, "screen-saver"\)/);
  assert.match(mainSource, /dismissOnOutsideClick:\s*settings\.dismissOnOutsideClick/);
  assert.match(
    mainSource,
    /popupAnchorPoint = screen\.getCursorScreenPoint\(\);[\s\S]*anchorPoint: popupAnchorPoint/,
    "selection translation should capture the cursor before async copy/translation work"
  );
  assert.match(
    popupSource,
    /const point = options\.anchorPoint \?\? screen\.getCursorScreenPoint\(\);/,
    "selection popup should use the cursor position captured when the hotkey was pressed"
  );
  assert.match(
    popupSource,
    /window\.on\("focus", \(\) => \{[\s\S]*popupWindow\.isVisible\(\)[\s\S]*closeSelectionPopup\(\);/,
    "dismiss backdrop focus should close a visible popup when an outside click bypasses DOM pointer events"
  );
  assert.match(mainSource, /passthroughWindows:\s*launcherWindow/);
  assert.match(mainSource, /setWindowAutoHideSuspended/);
  assert.match(panelImplsSource, /selectionTranslateDismissOutside/);
  assert.match(panelImplsSource, /默认 F4/);
  assert.doesNotMatch(panelImplsSource, /默认 F2/);
  const backdropHtml = readSource("src/renderer/selection-backdrop.html");
  assert.match(backdropHtml, /screenX/);
  const backdropPreload = readSource("src/preload/selection-backdrop.ts");
  assert.match(backdropPreload, /close\(point/);
  const copyAssets = readSource("scripts/copy-assets.cjs");
  assert.match(copyAssets, /selection-backdrop\.html/);
  assert.ok(
    fs.existsSync(path.join(process.cwd(), "src/renderer/selection-backdrop.html"))
  );
  assert.ok(
    fs.existsSync(path.join(process.cwd(), "src/preload/selection-backdrop.ts"))
  );
  assert.match(channelsSource, /getSelectionTranslateSettings:/);
  assert.match(channelsSource, /setSelectionTranslateSettings:/);
  assert.match(ipcSource, /selectionTranslateProvider/);
  assert.match(preloadSource, /getSelectionTranslateSettings\(/);
  assert.match(preloadSource, /setSelectionTranslateSettings\(/);
});
