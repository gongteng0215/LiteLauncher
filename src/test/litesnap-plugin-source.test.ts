import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const sharedLiteSnapPath = path.join(
  process.cwd(),
  "src",
  "shared",
  "litesnap.ts"
);
const channelsPath = path.join(process.cwd(), "src", "shared", "channels.ts");
const preloadPath = path.join(process.cwd(), "src", "preload", "index.ts");
const ipcPath = path.join(process.cwd(), "src", "main", "ipc.ts");
const settingsStorePath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "settings.ts"
);
const captureManagerPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "capture-session-manager.ts"
);
const captureProviderPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "capture-provider.ts"
);
const overlayWindowPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "overlay-window.ts"
);
const pinManagerPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "pin-window-manager.ts"
);
const nativeAddonSourcePath = path.join(
  process.cwd(),
  "native",
  "litesnap-capture",
  "src",
  "addon.cc"
);
const mainIndexPath = path.join(process.cwd(), "src", "main", "index.ts");
const panelImplsPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "plugin-panel-impls.ts"
);
const overlayRendererPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "litesnap-overlay.ts"
);
const overlayHtmlPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "litesnap-overlay.html"
);
const overlayCssPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "litesnap-overlay.css"
);
const copyAssetsPath = path.join(process.cwd(), "scripts", "copy-assets.cjs");
const buildNativeScriptPath = path.join(
  process.cwd(),
  "scripts",
  "build-native.cjs"
);
const packageJsonPath = path.join(process.cwd(), "package.json");

test("LiteSnap shared defaults expose Snipaste-compatible first-version shortcuts", () => {
  const source = fs.readFileSync(sharedLiteSnapPath, "utf8");

  assert.match(
    source,
    /export const LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT = "F1";/
  );
  assert.match(source, /export const LITESNAP_DEFAULT_PIN_SHORTCUT = "F3";/);
  assert.match(source, /export type LiteSnapPanelAction =/);
  assert.match(source, /export interface LiteSnapSettings/);
  assert.match(source, /export interface LiteSnapShortcutRegistrationResult/);
  assert.match(source, /export type LiteSnapSettingsUpdateResult = LiteSnapSettings/);
});

test("LiteSnap IPC channels and preload bridge are defined", () => {
  const channelsSource = fs.readFileSync(channelsPath, "utf8");
  const preloadSource = fs.readFileSync(preloadPath, "utf8");
  const ipcSource = fs.readFileSync(ipcPath, "utf8");

  assert.match(channelsSource, /getLiteSnapSettings:\s*"launcher:get-litesnap-settings"/);
  assert.match(channelsSource, /setLiteSnapSettings:\s*"launcher:set-litesnap-settings"/);
  assert.match(channelsSource, /liteSnapStartCapture:\s*"launcher:litesnap-start-capture"/);
  assert.match(channelsSource, /liteSnapPinClipboard:\s*"launcher:litesnap-pin-clipboard"/);
  assert.match(
    channelsSource,
    /liteSnapTogglePinnedWindows:\s*"launcher:litesnap-toggle-pinned-windows"/
  );
  assert.match(
    channelsSource,
    /liteSnapGetOverlayState:\s*"launcher:litesnap-get-overlay-state"/
  );
  assert.match(
    channelsSource,
    /liteSnapGetWindowRectAtPoint:\s*"launcher:litesnap-get-window-rect-at-point"/
  );
  assert.match(
    channelsSource,
    /liteSnapOverlayStateChanged:\s*"launcher:litesnap-overlay-state-changed"/
  );
  assert.match(
    channelsSource,
    /liteSnapCommitCapture:\s*"launcher:litesnap-commit-capture"/
  );
  assert.match(
    channelsSource,
    /liteSnapCancelCapture:\s*"launcher:litesnap-cancel-capture"/
  );
  assert.match(channelsSource, /pickDirectoryPath:\s*"launcher:pick-directory-path"/);

  assert.match(preloadSource, /getLiteSnapSettings\(\): Promise<LiteSnapSettings>/);
  assert.match(
    preloadSource,
    /setLiteSnapSettings\(\s*patch: Partial<LiteSnapSettings>\s*\): Promise<LiteSnapSettingsUpdateResult>/
  );
  assert.match(preloadSource, /liteSnapStartCapture\(\): Promise<boolean>/);
  assert.match(preloadSource, /liteSnapPinClipboard\(\): Promise<boolean>/);
  assert.match(preloadSource, /liteSnapTogglePinnedWindows\(\): Promise<LiteSnapPinnedWindowsToggleResult>/);
  assert.match(preloadSource, /liteSnapGetOverlayState\(\): Promise/);
  assert.match(
    preloadSource,
    /onLiteSnapOverlayStateChanged\([\s\S]*handler: \(state: LiteSnapOverlayState \| null\) => void[\s\S]*\): Cleanup/
  );
  assert.match(preloadSource, /liteSnapGetWindowRectAtPoint\(/);
  assert.match(preloadSource, /liteSnapCommitCapture\(/);
  assert.match(preloadSource, /liteSnapCancelCapture\(\): Promise<boolean>/);
  assert.match(preloadSource, /pickDirectoryPath\(\): Promise<string \| null>/);
  assert.match(
    ipcSource,
    /IPC_CHANNELS\.pickDirectoryPath[\s\S]*showOpenDialog\(window,[\s\S]*openDirectory/,
    "LiteSnap settings should have a directory picker IPC path for save directories"
  );
});

test("LiteSnap main-process runtime scaffolding exists", () => {
  const settingsSource = fs.readFileSync(settingsStorePath, "utf8");
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");
  const providerSource = fs.readFileSync(captureProviderPath, "utf8");
  const overlaySource = fs.readFileSync(overlayWindowPath, "utf8");
  const pinSource = fs.readFileSync(pinManagerPath, "utf8");
  const nativeAddonSource = fs.readFileSync(nativeAddonSourcePath, "utf8");

  assert.match(settingsSource, /export class LiteSnapSettingsStore/);
  assert.match(settingsSource, /async getSettings\(\): Promise<LiteSnapSettings>/);
  assert.match(
    settingsSource,
    /async updateSettings\(\s*patch: Partial<LiteSnapSettings>\s*\): Promise<LiteSnapSettings>/
  );
  assert.match(captureSource, /export class LiteSnapCaptureSessionManager/);
  assert.match(captureSource, /async startCapture\([\s\S]*\): Promise<boolean>/);
  assert.match(captureSource, /async getOverlayState\(\): Promise/);
  assert.match(captureSource, /async commitCapture\(/);
  assert.match(captureSource, /async cancelCapture\(\): Promise<boolean>/);
  assert.match(providerSource, /export interface LiteSnapCaptureProvider/);
  assert.match(providerSource, /export function createLiteSnapCaptureProvider\(\)/);
  assert.match(overlaySource, /export function createLiteSnapOverlayWindow\(/);
  assert.match(
    overlaySource,
    /preload:\s*path\.join\(__dirname,\s*"\.\.\/\.\.\/preload\/index\.js"\)/,
    "LiteSnap overlay should resolve the built preload bridge from dist/preload"
  );
  assert.match(
    overlaySource,
    /loadFile\(path\.join\(__dirname,\s*"\.\.\/\.\.\/renderer\/litesnap-overlay\.html"\)\)/,
    "LiteSnap overlay should resolve the built overlay page from dist/renderer"
  );
  assert.match(
    overlaySource,
    /show:\s*false/,
    "LiteSnap overlay should stay hidden while it is being prewarmed"
  );
  assert.match(
    overlaySource,
    /focusable:\s*false/,
    "LiteSnap overlay should not steal focus while it is only being prewarmed"
  );
  assert.match(
    overlaySource,
    /alwaysOnTop:\s*false/,
    "LiteSnap overlay should not stay topmost until a capture actually starts"
  );
  assert.match(pinSource, /export class LiteSnapPinWindowManager/);
  assert.match(pinSource, /async pinClipboardImage\(\): Promise<boolean>/);
  assert.match(pinSource, /async pinImage\(/);
  assert.match(
    pinSource,
    /togglePinnedWindowsVisibility\(\): \{ hidden: boolean; count: number \}/,
    "LiteSnap pin manager should support hiding or showing all pinned windows"
  );
  assert.match(
    nativeAddonSource,
    /GetCurrentProcessId\(\)[\s\S]*EnumWindows\(FindWindowAtPointProc/,
    "LiteSnap native addon should find the underlying app window by skipping the overlay process"
  );
  assert.match(
    nativeAddonSource,
    /getWindowRectAtPoint/,
    "LiteSnap native addon should expose a window-rectangle query for Snipaste-style hover selection"
  );
  assert.match(
    pinSource,
    /wheel[\s\S]*event\.ctrlKey[\s\S]*opacity[\s\S]*scale/,
    "LiteSnap pinned images should support wheel zoom and Ctrl+wheel opacity"
  );
  assert.match(
    pinSource,
    /pin-menu[\s\S]*toggle-shadow[\s\S]*toggle-border[\s\S]*contextmenu/,
    "LiteSnap pinned images should expose a right-click menu for local pin controls"
  );
  assert.match(pinSource, /dblclick[\s\S]*window\.close/, "LiteSnap pinned images should close on double-click");
  assert.match(
    pinSource,
    /async pinImage\(\s*image: NativeImage,\s*placement\?: LiteSnapWindowRect/,
    "LiteSnap pin should accept an explicit placement so captured pins keep their original size and position"
  );
  assert.match(
    captureSource,
    /const placement = \{[\s\S]*session\.display\.bounds\.x \+ input\.selection\.x[\s\S]*\}\s*;\s*const pinned = await this\.pinWindowManager\.pinImage\(cropped, placement\)/,
    "LiteSnap should pin captured screenshots at their original on-screen location and size"
  );
});

test("LiteSnap capture manager launches a first-party overlay instead of handing off to ms-screenclip", () => {
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");
  const providerSource = fs.readFileSync(captureProviderPath, "utf8");
  const buildNativeSource = fs.readFileSync(buildNativeScriptPath, "utf8");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8")) as {
    scripts?: Record<string, string>;
  };

  assert.match(
    captureSource,
    /createLiteSnapOverlayWindow/,
    "LiteSnap capture should open its own overlay window"
  );
  assert.match(
    providerSource,
    /desktopCapturer/,
    "LiteSnap should still keep the Electron capture fallback path"
  );
  assert.match(
    providerSource,
    /dipToScreenRect\(null,\s*display\.bounds\)/,
    "LiteSnap native capture should convert Electron DIP bounds into physical screen bounds"
  );
  assert.match(
    providerSource,
    /nativeImage\.createFromBitmap\(/,
    "LiteSnap native capture provider should rebuild Electron NativeImage instances from native bitmap buffers"
  );
  assert.match(
    providerSource,
    /createLiteSnapCaptureProvider\(\): LiteSnapCaptureProvider \{[\s\S]*createNativeLiteSnapCaptureProvider\(\)[\s\S]*new ElectronLiteSnapCaptureProvider\(\)/,
    "LiteSnap should try the Windows native capture provider before falling back to Electron"
  );
  assert.match(
    buildNativeSource,
    /vcvars64\.bat/,
    "LiteSnap native build helper should bootstrap the MSVC environment via vcvars64.bat"
  );
  assert.match(
    buildNativeSource,
    /cl \/nologo \/c/,
    "LiteSnap native build helper should compile the capture addon with cl.exe"
  );
  assert.match(
    buildNativeSource,
    /win_delay_load_hook/,
    "LiteSnap native build helper should include Electron's Windows delay-load hook"
  );
  assert.match(
    buildNativeSource,
    /\/DELAYLOAD:node\.exe/,
    "LiteSnap native build helper should delay-load node.exe for Electron compatibility"
  );
  assert.match(
    buildNativeSource,
    /dwmapi\.lib/,
    "LiteSnap native build helper should link DWM APIs for window frame detection"
  );
  assert.match(
    buildNativeSource,
    /vendor",\s*"node"/,
    "LiteSnap native build helper should compile against vendored N-API headers"
  );
  assert.match(
    buildNativeSource,
    /WindowsSDKVersion/,
    "LiteSnap native build helper should pass Windows SDK environment variables to cl.exe"
  );
  assert.match(
    buildNativeSource,
    /path\.join\(\s*projectRoot,\s*"dist",\s*"native"\s*\)/,
    "LiteSnap native build helper should publish built addons into dist/native"
  );
  assert.match(
    buildNativeSource,
    /EBUSY[\s\S]*pnpm dev/,
    "LiteSnap native build helper should explain dev-runner file locks clearly"
  );
  assert.match(
    packageJson.scripts?.build ?? "",
    /build-native\.cjs/,
    "LiteSnap builds should attempt to prepare the optional native capture addon"
  );
  assert.doesNotMatch(
    captureSource,
    /ms-screenclip:/,
    "LiteSnap capture should no longer depend on the OS screen clip handoff"
  );
  assert.doesNotMatch(
    captureSource,
    /await this\.cancelCapture\(\)\s*;\s*shell\.showItemInFolder\(savedPath\)/,
    "LiteSnap save flow should not synchronously reveal the saved screenshot after hiding the overlay"
  );
  assert.match(
    captureSource,
    /if \(input\.action === "save"\) \{[\s\S]*const settings = await this\.settingsStore\.getSettings\(\)[\s\S]*await this\.cancelCapture\(\)[\s\S]*const savedPath = await this\.imageStore\.saveImage\(cropped, settings\)/,
    "LiteSnap save flow should close the topmost overlay before the potentially slow disk save starts"
  );
  assert.match(
    captureSource,
    /private revealSavedCapture\(savedPath: string\): void[\s\S]*setTimeout\(\(\) => \{[\s\S]*shell\.showItemInFolder\(savedPath\)/,
    "LiteSnap should reveal saved screenshots asynchronously so Explorer cannot block overlay teardown"
  );
  assert.match(
    captureSource,
    /async prewarmOverlay\(\): Promise<boolean>/,
    "LiteSnap should expose a prewarm entry for the reusable overlay window"
  );
  assert.match(
    captureSource,
    /this\.overlayWindow = overlayWindow/,
    "LiteSnap should retain a reusable overlay window instance"
  );
  assert.match(
    captureSource,
    /window\.__LL_LITESNAP_PREPARE_CAPTURE__\?\.\(\);/,
    "LiteSnap should reset the reused overlay renderer before each capture starts"
  );
  assert.match(
    captureSource,
    /await this\.prepareOverlayRenderer\(overlayWindow\)/,
    "LiteSnap should wait for the reused overlay renderer to reset before it becomes interactive"
  );
  assert.match(
    captureSource,
    /private activateOverlayWindow\([\s\S]*overlayWindow\.setIgnoreMouseEvents\(true\)/,
    "LiteSnap should keep the preparing overlay mouse-transparent until the screenshot is ready"
  );
  assert.match(
    captureSource,
    /private async showInteractiveOverlay\([\s\S]*overlayWindow\.setIgnoreMouseEvents\(false\)/,
    "LiteSnap should re-enable pointer capture only after the screenshot becomes interactive"
  );
  assert.match(
    captureSource,
    /const prepared = await this\.prepareSessionImage\(captureId, display\)[\s\S]*this\.showInteractiveOverlay\(overlayWindow\)/,
    "LiteSnap should keep the overlay hidden until the screenshot image is ready"
  );
  assert.match(
    captureSource,
    /type CaptureSession = \{[\s\S]*previewImage: NativeImage \| null;[\s\S]*previewImageDataUrl: string \| null;[\s\S]*sourceImage: NativeImage \| null;/,
    "LiteSnap should keep separate preview and source images for fast start plus full-quality crop"
  );
  assert.match(
    captureSource,
    /this\.session\.previewImage = image;[\s\S]*this\.session\.previewImageDataUrl = image\.toDataURL\(\);/,
    "LiteSnap should populate a lightweight preview image before showing the overlay"
  );
  assert.match(
    captureSource,
    /await this\.upgradeSessionSourceImage\(captureId, display\);[\s\S]*this\.showInteractiveOverlay\(overlayWindow\)/,
    "LiteSnap should capture the full-quality source image before showing the overlay so its UI is not baked into the saved screenshot"
  );
  assert.match(
    captureSource,
    /upgradeSessionSourceImage\([\s\S]*captureId: string,[\s\S]*display: Display[\s\S]*\): Promise<void>/,
    "LiteSnap should own a background source-image upgrade path"
  );
  assert.match(
    captureSource,
    /if \(!session\.sourceImage \|\| session\.sourceImage\.isEmpty\(\)\) \{[\s\S]*"LiteSnap is still preparing the screenshot\."/,
    "LiteSnap should only allow final capture actions once the full source image is ready"
  );
  assert.match(
    captureSource,
    /private readonly captureProvider: LiteSnapCaptureProvider;/,
    "LiteSnap capture manager should depend on a pluggable capture provider"
  );
  assert.match(
    providerSource,
    /getWindowRectAtPoint\([\s\S]*toDisplayDipRect/,
    "LiteSnap native capture provider should convert detected window rectangles back into overlay coordinates"
  );
  assert.match(
    captureSource,
    /public async getWindowRectAtPoint\([\s\S]*this\.captureProvider\.getWindowRectAtPoint/,
    "LiteSnap capture manager should expose detected window rectangles to the overlay"
  );
  assert.match(
    captureSource,
    /await this\.emitOverlayStateChanged\(await this\.getOverlayState\(\)\);/,
    "LiteSnap should push the prepared overlay state once instead of making the renderer poll for it"
  );
  assert.match(
    captureSource,
    /emitOverlayStateChanged\(state: LiteSnapOverlayState \| null\)/,
    "LiteSnap capture manager should own a dedicated overlay state push helper"
  );
  assert.match(
    captureSource,
    /session\.overlayWindow\.hide\(\)[\s\S]*this\.parkOverlayWindow\(session\.overlayWindow\)/,
    "LiteSnap should park the reusable overlay after capture instead of leaving it interactive"
  );
  assert.match(
    captureSource,
    /private parkOverlayWindow\([\s\S]*overlayWindow\.setOpacity\(0\)/,
    "LiteSnap should keep the parked overlay transparent so the next show cannot flash the previous screenshot"
  );
  assert.match(
    captureSource,
    /overlayWindow\.show\(\);[\s\S]*await this\.waitForOverlayPaint\(overlayWindow\)[\s\S]*overlayWindow\.setOpacity\(1\)/,
    "LiteSnap should reveal the overlay only after the new frame has painted into the transparent window"
  );
  assert.match(
    captureSource,
    /waitForOverlayPaint\([\s\S]*requestAnimationFrame\([\s\S]*requestAnimationFrame/,
    "LiteSnap should wait for two animation frames before revealing the overlay window"
  );
});

test("LiteSnap renderer panel actions call the preload bridge for capture and pin flows", () => {
  const panelImplsSource = fs.readFileSync(panelImplsPath, "utf8");

  assert.match(
    panelImplsSource,
    /launcher\.liteSnapStartCapture\(\)/,
    "LiteSnap capture action should invoke the preload bridge directly"
  );
  assert.match(
    panelImplsSource,
    /launcher\.liteSnapPinClipboard\(\)/,
    "LiteSnap pin action should invoke the preload bridge directly"
  );
  assert.match(
    panelImplsSource,
    /launcher\.liteSnapTogglePinnedWindows\(\)/,
    "LiteSnap pin visibility action should invoke the preload bridge directly"
  );
  assert.match(
    panelImplsSource,
    /隐藏\/显示全部贴图/,
    "LiteSnap panel should expose a hide/show all pinned windows action"
  );
  assert.match(
    panelImplsSource,
    /function saveLiteSnapSettings\([\s\S]*launcher\.setLiteSnapSettings\(patch\)/,
    "LiteSnap settings page should persist editable settings through the preload bridge"
  );
  assert.match(
    panelImplsSource,
    /function getLiteSnapShortcutValidationError[\s\S]*F1-F24[\s\S]*Ctrl\/Alt\/Shift/,
    "LiteSnap settings page should validate shortcuts before saving or recording"
  );
  assert.match(
    panelImplsSource,
    /shortcutRegistration[\s\S]*statusMessage/,
    "LiteSnap settings page should display shortcut registration feedback after saving"
  );
  assert.match(
    panelImplsSource,
    /快捷键状态[\s\S]*注册失败时会保留旧的可用快捷键/,
    "LiteSnap settings page should show current shortcut registration status"
  );
  assert.match(
    panelImplsSource,
    /恢复默认快捷键[\s\S]*screenshotInput\.value = "F1"[\s\S]*pinInput\.value = "F3"/,
    "LiteSnap settings page should provide a restore-default-shortcuts action"
  );
  assert.match(
    panelImplsSource,
    /createLiteSnapShortcutControl\([\s\S]*screenshotShortcut[\s\S]*createLiteSnapShortcutControl\([\s\S]*pinShortcut[\s\S]*createLiteSnapDirectoryControl\([\s\S]*saveDirectory/,
    "LiteSnap settings page should expose shortcut recorders and a save-directory picker"
  );
  assert.match(
    panelImplsSource,
    /settings-row-textarea[\s\S]*createLiteSnapShortcutControl[\s\S]*litesnap-settings-inline-btn[\s\S]*录制/,
    "LiteSnap settings page should show shortcut record buttons in a wide control row"
  );
  assert.match(
    panelImplsSource,
    /createLiteSnapDirectoryControl[\s\S]*launcher[\s\S]*pickDirectoryPath\(\)/,
    "LiteSnap settings page should let users choose a save directory"
  );
  assert.match(
    panelImplsSource,
    /name: string,[\s\S]*placeholder = "",[\s\S]*type = "text"[\s\S]*input\.type = type[\s\S]*"color"/,
    "LiteSnap settings page should use a native color picker for annotation color"
  );
  assert.match(
    panelImplsSource,
    /createLiteSnapSelect\([\s\S]*saveFormat[\s\S]*postCaptureBehavior/,
    "LiteSnap settings page should expose editable save-format and post-capture selectors"
  );
  assert.match(
    panelImplsSource,
    /annotationColor[\s\S]*annotationLineWidth[\s\S]*annotationTextSize[\s\S]*annotationFillShapes/,
    "LiteSnap settings page should expose editable annotation defaults"
  );
});

test("LiteSnap main process registers dedicated global shortcuts from stored settings", () => {
  const mainIndexSource = fs.readFileSync(mainIndexPath, "utf8");

  assert.match(
    mainIndexSource,
    /function registerLiteSnapGlobalShortcut\(/,
    "LiteSnap should have a dedicated global shortcut registration helper"
  );
  assert.match(
    mainIndexSource,
    /const liteSnapSettings = await liteSnapSettingsStore\.getSettings\(\);/,
    "LiteSnap startup should load persisted shortcut settings"
  );
  assert.match(
    mainIndexSource,
    /void liteSnapCaptureSessionManager\.prewarmOverlay\(\);/,
    "LiteSnap startup should prewarm the reusable overlay window"
  );
  assert.match(
    mainIndexSource,
    /registerLiteSnapShortcutSet\(\s*liteSnapSettings,\s*launcherWindow,/,
    "LiteSnap screenshot and pin shortcuts should be registered from settings at startup"
  );
  assert.match(
    mainIndexSource,
    /unregisterLiteSnapGlobalShortcut\("screenshot"\)[\s\S]*unregisterLiteSnapGlobalShortcut\("pin"\)/,
    "LiteSnap should unregister old shortcuts before re-registering updated shortcuts"
  );
  assert.match(
    mainIndexSource,
    /shouldRegisterShortcuts[\s\S]*hasOwnProperty\.call\(patch, "screenshotShortcut"\)[\s\S]*hasOwnProperty\.call\(patch, "pinShortcut"\)/,
    "LiteSnap should only re-register global shortcuts when shortcut settings change"
  );
  assert.match(
    mainIndexSource,
    /function updateLiteSnapSettingsWithShortcutRegistration[\s\S]*const previous = await store\.getSettings\(\)[\s\S]*const requested = await store\.updateSettings\(patch\)/,
    "LiteSnap should keep previous shortcut settings available while testing new shortcuts"
  );
  assert.match(
    mainIndexSource,
    /requestedRegistration\.screenshot[\s\S]*previous\.screenshotShortcut[\s\S]*requestedRegistration\.pin[\s\S]*previous\.pinShortcut/,
    "LiteSnap should roll failed shortcut registrations back to previous working values"
  );
  assert.match(
    mainIndexSource,
    /已保留旧快捷键/,
    "LiteSnap settings updates should explain that failed shortcut values were not kept"
  );
  assert.match(
    mainIndexSource,
    /shortcutRegistration: requestedRegistration/,
    "LiteSnap settings updates should return shortcut registration feedback"
  );
});

test("LiteSnap overlay renderer assets and copy-assets support are present", () => {
  const overlayRendererSource = fs.readFileSync(overlayRendererPath, "utf8");
  const overlayHtmlSource = fs.readFileSync(overlayHtmlPath, "utf8");
  const overlayCssSource = fs.readFileSync(overlayCssPath, "utf8");
  const copyAssetsSource = fs.readFileSync(copyAssetsPath, "utf8");
  const settingsSource = fs.readFileSync(settingsStorePath, "utf8");
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");

  assert.match(overlayRendererSource, /copy|save|pin|cancel/);
  assert.match(overlayRendererSource, /pointerdown/);
  assert.match(
    overlayRendererSource,
    /window\.launcher\.onLiteSnapOverlayStateChanged\(\(nextState\) => \{/,
    "LiteSnap overlay should subscribe to pushed overlay-state updates"
  );
  assert.doesNotMatch(
    overlayRendererSource,
    /setPointerCapture|releasePointerCapture|setInterval\(\(\) => \{\s*void syncOverlayState\(\);\s*\},\s*80\)|liteSnapGetOverlayState\(\)/,
    "LiteSnap overlay should keep pointer dragging on regular full-screen events"
  );
  assert.doesNotMatch(
    overlayRendererSource,
    /toolbarNode\.offsetWidth|toolbarNode\.offsetHeight/,
    "LiteSnap overlay should avoid synchronous toolbar layout reads while finishing a selection"
  );
  assert.match(overlayRendererSource, /dblclick/);
  assert.match(
    overlayRendererSource,
    /function shouldShowToolbar\(\): boolean \{[\s\S]*dragMode === "idle"/,
    "LiteSnap overlay should only show the toolbar after the selection is confirmed"
  );
  assert.match(
    overlayRendererSource,
    /liteSnapGetWindowRectAtPoint\([\s\S]*hoverWindowRect = normalizeWindowRect/,
    "LiteSnap overlay should preview (not auto-commit) the window under the cursor"
  );
  assert.match(
    overlayRendererSource,
    /if \(wasSelecting && !isValidSelection\(selection\)\)[\s\S]*if \(priorSelection\)[\s\S]*selection = priorSelection[\s\S]*if \(hoverWindowRect\)/,
    "LiteSnap overlay should preserve an existing selection on stray clicks and only adopt hovered windows without a prior selection"
  );
  assert.match(
    overlayRendererSource,
    /updateLoupe\([\s\S]*getImageData[\s\S]*hoveredColor/,
    "LiteSnap overlay should show a magnifier and sample pixel colors"
  );
  assert.match(
    overlayRendererSource,
    /navigator\.clipboard\?\.writeText\(hoveredColor\)/,
    "LiteSnap overlay should copy the currently sampled color"
  );
  assert.match(
    overlayRendererSource,
    /redoAnnotations[\s\S]*function redoLastAnnotation/,
    "LiteSnap overlay should support redo for annotations"
  );
  assert.match(
    overlayRendererSource,
    /event\.key === "Delete"[\s\S]*deleteLastAnnotation/,
    "LiteSnap overlay should support deleting the last annotation with Delete"
  );
  assert.match(
    overlayRendererSource,
    /selectedAnnotationIndex[\s\S]*function hitTestAnnotation/,
    "LiteSnap overlay should track and hit-test selected annotation objects"
  );
  assert.match(
    overlayRendererSource,
    /dragMode = "annotation-moving"[\s\S]*annotationSnapshot/,
    "LiteSnap overlay should enter an annotation-moving mode when a selected object is dragged"
  );
  assert.match(
    overlayRendererSource,
    /function applyAnnotationMove[\s\S]*moveAnnotation/,
    "LiteSnap overlay should move selected annotation objects as a unit"
  );
  assert.match(
    overlayRendererSource,
    /selectedAnnotationIndex !== null[\s\S]*annotations\.splice/,
    "LiteSnap overlay should delete the selected annotation before falling back to deleting the last annotation"
  );
  assert.match(
    overlayRendererSource,
    /event\.key === "r"[\s\S]*lastSelection/,
    "LiteSnap overlay should support repeating the last selection with R"
  );
  assert.match(
    overlayRendererSource,
    /hintNode\.hidden = shouldShowToolbar\(\)/,
    "LiteSnap overlay should hide the selection hint once the toolbar becomes available"
  );
  assert.match(
    overlayHtmlSource,
    /data-tool="line"[\s\S]*data-tool="highlight"[\s\S]*data-tool="number"[\s\S]*data-tool="mosaic"[\s\S]*data-tool="blur"/,
    "LiteSnap overlay toolbar should expose line, highlighter, number, mosaic, and blur tools"
  );
  assert.match(
    overlayRendererSource,
    /function paintBrushEffect[\s\S]*destination-in/,
    "LiteSnap mosaic/blur should be a masked brush stroke, not a rectangular region"
  );
  assert.match(
    overlayRendererSource,
    /activeTool === "mosaic" \|\| activeTool === "blur"[\s\S]*points:\s*\[point\][\s\S]*brushSize:/,
    "LiteSnap mosaic/blur should paint along a dragged brush path"
  );
  assert.match(
    overlayHtmlSource,
    /id="litesnap-brush-preview"/,
    "LiteSnap overlay should include a brush preview element for paint-style tools"
  );
  assert.match(
    overlayCssSource,
    /litesnap-overlay__brush-preview/,
    "LiteSnap overlay should style the brush preview for mosaic/blur"
  );
  assert.match(
    overlayCssSource,
    /data-tool="mosaic"[\s\S]*data-tool="blur"[\s\S]*cursor:\s*none/,
    "LiteSnap overlay should hide the native cursor for mosaic/blur brush tools"
  );
  assert.match(
    overlayRendererSource,
    /function updateBrushPreview[\s\S]*containsPoint\(selection, x, y\)[\s\S]*brushSizeForLineWidth\(activeLineWidth\)/,
    "LiteSnap overlay should size and position the brush preview inside the active selection"
  );
  assert.match(
    overlayRendererSource,
    /Mosaic\/blur brush strokes are one-shot[\s\S]*continue;/,
    "LiteSnap mosaic/blur strokes should not be re-selectable for secondary editing"
  );
  assert.match(
    overlayRendererSource,
    /setLiteSnapSettings\(\{[\s\S]*annotationColor:[\s\S]*annotationLineWidth:[\s\S]*annotationTool:[\s\S]*annotationFillShapes:/,
    "LiteSnap overlay should persist annotation style and last-tool changes back to settings"
  );
  assert.match(
    settingsSource,
    /annotationTool:[\s\S]*annotationFillShapes:/,
    "LiteSnap settings should remember the last annotation tool and fill state"
  );
  assert.match(
    captureSource,
    /annotationTool:\s*settings\.annotationTool[\s\S]*annotationFillShapes:\s*settings\.annotationFillShapes/,
    "LiteSnap overlay state should include persisted annotation tool defaults"
  );
  assert.match(
    overlayRendererSource,
    /type:\s*"number"[\s\S]*value:\s*numberSequence/,
    "LiteSnap overlay should support auto-incrementing number markers"
  );
  assert.match(
    overlayRendererSource,
    /type:\s*"highlight"[\s\S]*globalAlpha\s*=\s*0\.36[\s\S]*fillRect/,
    "LiteSnap overlay should support a semi-transparent highlighter tool"
  );
  assert.match(
    overlayRendererSource,
    /annotation\.filled[\s\S]*ctx\.fillRect/,
    "LiteSnap overlay should support filled shapes"
  );
  assert.match(
    overlayHtmlSource,
    /data-command="toggle-fill"/,
    "LiteSnap overlay toolbar should expose a shape fill toggle"
  );
  assert.match(
    overlayCssSource,
    /\.litesnap-overlay__toolbar[\s\S]*flex-direction:\s*column[\s\S]*\.litesnap-overlay__toolbar-row/,
    "LiteSnap overlay toolbar should use explicit rows when annotation tools exceed one row"
  );
  assert.match(overlayHtmlSource, /litesnap-overlay/);
  assert.match(overlayCssSource, /\.litesnap-overlay/);
  assert.match(copyAssetsSource, /litesnap-overlay\.html/);
  assert.match(copyAssetsSource, /litesnap-overlay\.css/);
  assert.match(
    overlayCssSource,
    /\.litesnap-overlay\[data-ready="false"\][\s\S]*background:\s*transparent/,
    "LiteSnap preparing overlay should stay visually transparent instead of flashing black"
  );
  assert.match(
    overlayCssSource,
    /\.litesnap-overlay\[data-ready="false"\]::before[\s\S]*display:\s*none/,
    "LiteSnap preparing overlay should not draw a dark dimmer before the screenshot is ready"
  );
});
