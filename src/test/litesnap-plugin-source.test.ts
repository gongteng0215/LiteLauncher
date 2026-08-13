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
const ocrCapabilityInstallerPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "ocr-capability-installer.ts"
);
const captureProviderPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "capture-provider.ts"
);
const longCaptureWindowCoordinatorPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "long-capture-window-coordinator.ts"
);
const longCaptureCoordinatorPath = path.join(
  process.cwd(),
  "src",
  "main",
  "litesnap",
  "long-capture-coordinator.ts"
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
const longCaptureControllerHtmlPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "litesnap-long-capture.html"
);
const longCaptureGuideHtmlPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "litesnap-long-capture-guide.html"
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
  assert.match(source, /export const LITESNAP_DEFAULT_COLOR_SHORTCUT = "";/);
  assert.match(
    source,
    /export const LITESNAP_DEFAULT_TOGGLE_PIN_CLICK_THROUGH_SHORTCUT = "Ctrl\+Shift\+T";/
  );
  assert.match(source, /recentColors: string\[\]/);
  assert.match(source, /historyEnabled: boolean/);
  assert.match(source, /historyMaxItems: number/);
  assert.match(source, /mode: LiteSnapOverlayMode/);
  assert.match(source, /export function pushLiteSnapRecentColor/);
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
    /liteSnapCloseAllPinnedWindows:\s*"launcher:litesnap-close-all-pinned-windows"/
  );
  assert.match(
    channelsSource,
    /liteSnapStartColorCapture:\s*"launcher:litesnap-start-color-capture"/
  );
  assert.match(
    channelsSource,
    /liteSnapListHistory:\s*"launcher:litesnap-list-history"/
  );
  assert.match(
    channelsSource,
    /liteSnapRecordRecentColor:\s*"launcher:litesnap-record-recent-color"/
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
  assert.match(
    channelsSource,
    /liteSnapSetDisplayFollowLocked:\s*"launcher:litesnap-set-display-follow-locked"/,
    "LiteSnap should expose an IPC channel to lock multi-display follow once selection starts"
  );
  assert.match(
    channelsSource,
    /liteSnapEnsureSourceImage:\s*"launcher:litesnap-ensure-source-image"/
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
  assert.match(
    preloadSource,
    /liteSnapSetDisplayFollowLocked\(locked: boolean\): Promise<boolean>/,
    "LiteSnap preload should bridge display-follow lock updates from the overlay"
  );
  assert.match(preloadSource, /liteSnapEnsureSourceImage\(\): Promise<string \| null>/);
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
  const captureProviderSource = fs.readFileSync(captureProviderPath, "utf8");
  const windowCoordinatorSource = fs.readFileSync(
    longCaptureWindowCoordinatorPath,
    "utf8"
  );
  const longCaptureCoordinatorSource = fs.readFileSync(
    longCaptureCoordinatorPath,
    "utf8"
  );
  const ocrInstallerSource = fs.readFileSync(ocrCapabilityInstallerPath, "utf8");
  const providerSource = fs.readFileSync(captureProviderPath, "utf8");
  const overlaySource = fs.readFileSync(overlayWindowPath, "utf8");
  const pinSource = fs.readFileSync(pinManagerPath, "utf8");
  const nativeAddonSource = fs.readFileSync(nativeAddonSourcePath, "utf8");

  assert.match(settingsSource, /export class LiteSnapSettingsStore/);
  assert.match(
    settingsSource,
    /private cachedSettings: LiteSnapSettings \| null = null;/,
    "LiteSnap settings should keep an in-memory cache to avoid SQLite reads on every capture"
  );
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
  assert.match(
    captureSource,
    /startDisplayFollowWatch\(\)|maybeFollowCursorDisplay\(|switchCaptureDisplay\(/,
    "LiteSnap capture should follow the cursor across displays before a selection locks"
  );
  assert.match(
    captureSource,
    /setDisplayFollowLocked\(locked: boolean\): void/,
    "LiteSnap capture should allow the overlay to lock display following after selection starts"
  );
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
    pinSource,
    /closeAllPinnedWindows\(\): \{ count: number \}/,
    "LiteSnap pin manager should support closing all pinned windows"
  );
  assert.match(
    pinSource,
    /toggleNearestPinClickThrough\(\)/,
    "LiteSnap pin manager should toggle click-through on the nearest pin window"
  );
  assert.match(
    pinSource,
    /setIgnoreMouseEvents\(true, \{ forward: true \}\)/,
    "LiteSnap pin click-through should ignore mouse events with forward tracking"
  );
  assert.match(
    pinSource,
    /disableAllClickThrough\(\)|PIN_CLICK_THROUGH_ESCAPE_ACCELERATOR|globalShortcut\.register/,
    "LiteSnap should register a global Esc escape hatch while pin click-through is active"
  );
  assert.match(
    pinSource,
    /setIgnoreMouseEvents\(false\)/,
    "LiteSnap should restore mouse hit-testing without the forward option"
  );
  assert.match(
    pinSource,
    /PIN_DRAG_END_CHANNEL[\s\S]*getDisplayMatching[\s\S]*rebakePinImageForDisplay/,
    "LiteSnap pin windows should rebake pixels when dragged onto a different-scale display"
  );
  assert.match(
    pinSource,
    /sourceImage:[\s\S]*bakedScaleFactor:[\s\S]*usePng:[\s\S]*clickThrough:/,
    "LiteSnap pin metadata should keep the source image and baked scale factor for DPI rebake"
  );
  assert.match(
    pinSource,
    /toggle-click-through[\s\S]*close-all[\s\S]*notifyDragEnd/,
    "LiteSnap pin menu should expose click-through and close-all commands"
  );
  assert.match(
    nativeAddonSource,
    /GetCurrentProcessId\(\)[\s\S]*EnumWindows\(FindWindowAtPointProc/,
    "LiteSnap native addon should find the underlying app window by skipping the overlay process"
  );
  assert.match(
    nativeAddonSource,
    /captureDisplayFrames/,
    "LiteSnap native addon should capture preview and source frames from one screen read"
  );
  assert.match(
    nativeAddonSource,
    /getWindowRectAtPoint/,
    "LiteSnap native addon should expose a window-rectangle query for Snipaste-style hover selection"
  );
  assert.match(
    providerSource,
    /resolvePreviewOutputSize\(display: Display\)[\s\S]*display\.bounds\.width \* scale[\s\S]*display\.bounds\.height \* scale/,
    "LiteSnap preview capture should use physical pixels (bounds * scaleFactor) so HiDPI overlays stay sharp"
  );
  assert.match(
    providerSource,
    /captureDisplayFrames\(/,
    "LiteSnap capture provider should expose a combined preview+source capture path"
  );
  assert.match(
    providerSource,
    /captureDisplayFrames\([\s\S]*setImmediate\(resolve\)[\s\S]*this\.addon\.captureDisplayFrames/,
    "LiteSnap native display capture should yield the event loop before blocking the main thread"
  );
  assert.match(
    pinSource,
    /wheel[\s\S]*dragging[\s\S]*deltaX[\s\S]*deltaY[\s\S]*event\.ctrlKey[\s\S]*opacity[\s\S]*scale/,
    "LiteSnap pinned images should support wheel zoom and Ctrl+wheel opacity without horizontal-pan zoom"
  );
  assert.match(
    pinSource,
    /pin-menu[\s\S]*pin-opacity-slider[\s\S]*toggle-border[\s\S]*contextmenu/,
    "LiteSnap pinned images should expose a right-click menu with an opacity slider"
  );
  assert.match(
    pinSource,
    /\.pin-shell \{[\s\S]*-webkit-app-region: no-drag/,
    "LiteSnap pin windows should let DOM contextmenu events reach the custom right-click menu"
  );
  assert.match(
    pinSource,
    /PIN_MOVE_CHANNEL[\s\S]*dragOrigin[\s\S]*applyPinnedWindowBounds|applyPinnedWindowBounds[\s\S]*dragOrigin/,
    "LiteSnap pin windows should move through absolute drag origins instead of delta+getBounds"
  );
  assert.match(
    pinSource,
    /PIN_MOVE_CHANNEL[\s\S]*resolvePinWindowSize[\s\S]*window\.setBounds\(|applyPinnedWindowBounds[\s\S]*resolvePinWindowSize[\s\S]*setBounds/,
    "LiteSnap pin windows should move through IPC with size locked to avoid HiDPI growth"
  );
  assert.match(
    pinSource,
    /beginDrag[\s\S]*requestAnimationFrame[\s\S]*moveTo/,
    "LiteSnap pin drag should coalesce pointer moves onto animation frames"
  );
  assert.match(
    pinSource,
    /dblclick[\s\S]*copyToClipboard/,
    "LiteSnap pinned images should copy to clipboard on double-click"
  );
  assert.match(
    pinSource,
    /data-command="save"[\s\S]*保存图片/,
    "LiteSnap pin right-click menu should offer a save-to-file command"
  );
  assert.match(
    pinSource,
    /ipcMain\.on\(PIN_SAVE_CHANNEL[\s\S]*pinSaveImageProvider\(image\)/,
    "LiteSnap pin manager should save pinned images via the injected provider"
  );
  assert.match(
    pinSource,
    /setSaveImageProvider\(provider: PinSaveImageProvider \| null\)/,
    "LiteSnap pin manager should accept a save-image provider"
  );
  assert.match(
    pinSource,
    /async pinImage\(\s*image: NativeImage,\s*placement\?: LiteSnapWindowRect/,
    "LiteSnap pin should accept an explicit placement so captured pins keep their original size and position"
  );
  assert.match(
    captureSource,
    /clipboard\.writeImage\(cropped\)[\s\S]*pinWindowManager\.pinImage\(cropped, placement\)/,
    "LiteSnap pin action should also copy the screenshot to the clipboard"
  );
  assert.match(
    captureSource,
    /const placement = \{[\s\S]*session\.display\.bounds\.x \+ input\.selection\.x[\s\S]*\}\s*;[\s\S]*clipboard\.writeImage\(cropped\)[\s\S]*pinWindowManager\.pinImage\(cropped, placement\)/,
    "LiteSnap should pin captured screenshots at their original on-screen location and size"
  );
  assert.match(
    pinSource,
    /function preparePinDisplayImage\(/,
    "LiteSnap pin windows should downscale oversized bitmaps before rendering"
  );
  assert.match(
    pinSource,
    /transparent: false[\s\S]*hasShadow: false[\s\S]*preload: resolvePinPreloadPath\(\)/,
    "LiteSnap pin windows should use opaque windows with a dedicated drag preload"
  );
  assert.match(
    pinSource,
    /PIN_MOVE_CHANNEL[\s\S]*-webkit-app-region: no-drag/,
    "LiteSnap pin windows should avoid CSS drag regions so the custom right-click menu receives events"
  );
  assert.match(
    pinSource,
    /pinApi\?\.setVisualState\(scale, opacity\)/,
    "LiteSnap pin zoom and opacity should resize the native window instead of CSS transforms"
  );
  assert.match(
    pinSource,
    /await window\.loadFile\(assets\.htmlPath\)/,
    "LiteSnap pin windows should load a local image file instead of a giant data URL"
  );
  assert.match(
    pinSource,
    /resizable: false[\s\S]*backgroundThrottling: false/,
    "LiteSnap pin windows should avoid resize chrome and background throttling during drag"
  );
  assert.match(
    pinSource,
    /public prewarmPinWindow\(\): void/,
    "LiteSnap should prewarm a reusable pin window for faster first pin"
  );
  assert.match(
    pinSource,
    /ready-to-show[\s\S]*window\.show\(\)/,
    "LiteSnap pin windows should wait for ready-to-show before becoming visible"
  );
  assert.match(
    pinSource,
    /toJPEG\(88\)|pin\.jpg/,
    "LiteSnap pin windows should prefer JPEG assets for faster decode when possible"
  );
  assert.match(
    pinSource,
    /roundedCorners: false/,
    "LiteSnap pin windows should disable rounded corners on Windows for cheaper compositing"
  );
  assert.match(
    pinSource,
    /requestAnimationFrame[\s\S]*setVisualState\(scale, opacity\)/,
    "LiteSnap pin zoom should coalesce visual state updates per animation frame"
  );
});

test("LiteSnap capture manager launches a first-party overlay instead of handing off to ms-screenclip", () => {
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");
  const ocrInstallerSource = fs.readFileSync(ocrCapabilityInstallerPath, "utf8");
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
    /litesnap-capture-\$\{sha256\.slice\(0, 16\)\}\.node/,
    "LiteSnap native build helper should publish immutable content-hash filenames"
  );
  assert.match(
    buildNativeSource,
    /litesnap-capture-manifest\.json[\s\S]*renameSync/,
    "LiteSnap native build helper should atomically switch the active manifest"
  );
  assert.match(
    buildNativeSource,
    /computeBuildFingerprint[\s\S]*WindowsSDKVersion/,
    "LiteSnap native build helper should skip recompilation only for the same toolchain fingerprint"
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
    /public prewarmCaptureCache\(\): void[\s\S]*this\.warmDisplayFrameCache\(/,
    "LiteSnap should warm the screenshot frame cache without waiting for the overlay window"
  );
  assert.match(
    captureSource,
    /public prewarmCaptureCache\(\): void[\s\S]*One-shot warm only/,
    "LiteSnap idle prewarm should stay one-shot and avoid periodic full-screen refresh"
  );
  assert.match(
    captureSource,
    /async prewarmOverlay\(\): Promise<boolean>[\s\S]*await this\.waitForOverlayReady\(overlayWindow\)/,
    "LiteSnap overlay prewarm should load the reusable overlay window without blocking on capture"
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
    /await this\.prepareOverlayRenderer\(overlayWindow\)[\s\S]*this\.showPreparingOverlay\(overlayWindow\)/,
    "LiteSnap should reset the reused overlay renderer before showing the preparing overlay"
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
    /const framesPromise = this\.resolveCaptureFrames\(display\)[\s\S]*captureDisplayFramesWithFallback\(/,
    "LiteSnap should capture the display in parallel with overlay preparation"
  );
  assert.match(
    captureSource,
    /await this\.showInteractiveOverlay\(overlayWindow\)/,
    "LiteSnap should reveal the overlay once the screenshot frame is ready"
  );
  assert.match(
    captureSource,
    /type CaptureSession = \{[\s\S]*previewImage: NativeImage \| null;[\s\S]*previewImageDataUrl: string \| null;[\s\S]*sourceImage: NativeImage \| null;/,
    "LiteSnap should keep separate preview and source images for fast start plus full-quality crop"
  );
  assert.match(
    captureSource,
    /this\.showPreparingOverlay\(overlayWindow\)[\s\S]*overlayWindow\.setOpacity\(0\)/,
    "LiteSnap should keep the preparing overlay transparent until the screenshot is painted"
  );
  assert.match(
    captureSource,
    /const frames = await captureDisplayFramesWithFallback\(/,
    "LiteSnap should fall back to desktopCapturer when native capture fails"
  );
  assert.match(
    captureSource,
    /PREVIEW_JPEG_QUALITY/,
    "LiteSnap should encode preview frames at a higher JPEG quality to avoid a soft background"
  );
  assert.match(
    captureSource,
    /this\.session\.sourceImage = resolvedFrames\.sourceImage;[\s\S]*this\.session\.sourceImageDataUrl = null;/,
    "LiteSnap should keep the full source image in the main process without eagerly encoding it for overlay IPC"
  );
  assert.match(
    captureSource,
    /imageDataUrl: this\.session\.previewImageDataUrl/,
    "LiteSnap overlay state should use the display-sized preview so capture starts immediately on high-DPI screens"
  );
  assert.match(
    captureSource,
    /public ensureSourceImageDataUrl\(\): string \| null/,
    "LiteSnap should still expose the full source image to renderer tools that request it"
  );
  assert.match(
    captureSource,
    /resolveCompositedBuffer\([\s\S]*ArrayBuffer\.isView[\s\S]*nativeImage\.createFromBuffer/,
    "LiteSnap should accept binary composited PNG buffers instead of requiring base64 data URLs"
  );
  assert.match(
    captureSource,
    /scheduleNextFrameCacheRefresh\([\s\S]*warmPreviewFrameCache\(display\)/,
    "LiteSnap idle frame-cache refresh should warm preview frames only"
  );
  assert.match(
    captureSource,
    /captureAndStorePreviewCache\([\s\S]*sourceImage: null/,
    "LiteSnap preview-only cache entries should not retain a full source image"
  );
  assert.match(
    captureSource,
    /resolveCaptureFrames\([\s\S]*captureSourceImageWithFallback\(/,
    "LiteSnap should capture the full source image on demand when only preview cache is warm"
  );
  assert.match(
    captureSource,
    /private warmDisplayFrameCache\(display: Display\): void/,
    "LiteSnap should prewarm a short-lived display frame cache for the next capture"
  );
  assert.match(
    captureSource,
    /shouldRefreshIdleFrameCache\([\s\S]*idleFrameCachePaused/,
    "LiteSnap frame cache refresh should pause while the launcher window is focused"
  );
  assert.match(
    captureSource,
    /pauseIdleFrameCache\(\): void[\s\S]*stopFrameCacheRefresh\(\)[\s\S]*abortFrameCacheWarm\(\)/,
    "LiteSnap should stop background frame-cache work when the launcher gains focus"
  );
  assert.match(
    captureSource,
    /startCaptureInternal\([\s\S]*stopFrameCacheRefresh\(\)[\s\S]*abortFrameCacheWarm\(\)/,
    "LiteSnap should abort idle frame-cache work before starting a real capture"
  );
  assert.match(
    captureSource,
    /private async waitForOverlayFrameReady\([\s\S]*Promise<boolean>/,
    "LiteSnap should report whether the overlay screenshot background is ready"
  );
  assert.doesNotMatch(
    captureSource,
    /setFrameRate\(/,
    "LiteSnap overlay should not throttle the visible overlay renderer frame rate"
  );
  assert.match(
    captureSource,
    /startFrameCacheRefresh\(\): void[\s\S]*scheduleNextFrameCacheRefresh\(\)/,
    "LiteSnap should refresh the warmed frame cache periodically while idle"
  );
  assert.match(
    captureSource,
    /if \(this\.session\) \{[\s\S]*await this\.cancelCapture\(\);/,
    "LiteSnap should skip cancel teardown when no capture session is active"
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
    /await this\.emitOverlayStateChanged\(null\)[\s\S]*session\.overlayWindow\.hide\(\)/,
    "LiteSnap should reset overlay renderer state before parking the overlay window"
  );
  assert.match(
    captureSource,
    /private parkOverlayWindow\([\s\S]*overlayWindow\.setOpacity\(0\)/,
    "LiteSnap should keep the parked overlay transparent so the next show cannot flash the previous screenshot"
  );
  assert.match(
    captureSource,
    /overlayWindow\.show\(\);[\s\S]*let frameReady = await this\.waitForOverlayFrameReady\(overlayWindow\)[\s\S]*overlayWindow\.setOpacity\(1\)/,
    "LiteSnap should reveal the overlay only after the new frame has painted into the transparent window"
  );
  assert.match(
    captureSource,
    /waitForOverlayFrameReady\([\s\S]*dataset\.ready === "true"[\s\S]*2500[\s\S]*return result === true/,
    "LiteSnap should wait for the renderer to decode and mark the screenshot ready before revealing the overlay"
  );
});

test("LiteSnap renderer panel actions call the preload bridge for capture and pin flows", () => {
  const panelImplsSource = fs.readFileSync(panelImplsPath, "utf8");
  const settingsSource = fs.readFileSync(settingsStorePath, "utf8");
  const overlayRendererSource = fs.readFileSync(overlayRendererPath, "utf8");
  const stylesSource = fs.readFileSync(
    path.join(process.cwd(), "src", "renderer", "styles.css"),
    "utf8"
  );

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
    /隐藏\/显示贴图/,
    "LiteSnap panel should expose a hide/show all pinned windows action"
  );
  assert.match(
    panelImplsSource,
    /function saveLiteSnapSettings\([\s\S]*launcher\.setLiteSnapSettings\(patch\)/,
    "LiteSnap settings page should persist editable settings through the preload bridge"
  );
  assert.match(
    panelImplsSource,
    /submitButton\.disabled = true[\s\S]*保存中/,
    "LiteSnap settings save should show a saving state and block duplicate submits"
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
  assert.match(
    settingsSource,
    /annotationLineWidth:[\s\S]*base\.annotationLineWidth,[\s\S]*1,[\s\S]*60/,
    "LiteSnap settings should allow a 1–60 px default annotation line width"
  );
  assert.match(
    panelImplsSource,
    /"annotationLineWidth",[\s\S]*annotationLineWidth,[\s\S]*1,[\s\S]*60/,
    "LiteSnap settings panel should allow a 1–60 px default annotation line width"
  );
  assert.match(
    overlayRendererSource,
    /MIN_ANNOTATION_LINE_WIDTH = 1;[\s\S]*MAX_ANNOTATION_LINE_WIDTH = 60;[\s\S]*activeLineWidth = 3;/,
    "LiteSnap overlay should start at 3 px and support the configured 1–60 px range"
  );
  assert.match(
    panelImplsSource,
    /row\.className = "litesnap-settings-field"/,
    "LiteSnap settings fields should use a dedicated layout class rather than the global settings grid"
  );
  assert.match(
    stylesSource,
    /\.litesnap-fields-grid \.litesnap-settings-field \{[\s\S]*display: flex;[\s\S]*flex-direction: column;/,
    "LiteSnap settings fields should stack labels, controls, and hints within each grid card"
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
  assert.doesNotMatch(
    mainIndexSource,
    /liteSnapCaptureSessionManager\.prewarmCaptureCache\(\);[\s\S]*const launcherWindow = createLauncherWindow\(\)/,
    "LiteSnap should not warm screenshot frames during main-process startup"
  );
  assert.doesNotMatch(
    mainIndexSource,
    /liteSnapPinWindowManager\.prewarmPinWindow\(\);[\s\S]*const launcherWindow = createLauncherWindow\(\)/,
    "LiteSnap should not prewarm pin windows during main-process startup"
  );
  const launcherWindowCreationIndex = mainIndexSource.indexOf(
    "const launcherWindow = createLauncherWindow();"
  );
  assert.ok(
    launcherWindowCreationIndex >= 0,
    "LiteSnap regression expects the launcher window creation call to exist"
  );
  assert.doesNotMatch(
    mainIndexSource.slice(0, launcherWindowCreationIndex),
    /liteSnapCaptureSessionManager\.prewarmOverlay\(\)/,
    "LiteSnap should not create the reusable overlay before the launcher window exists"
  );
  assert.match(
    mainIndexSource.slice(launcherWindowCreationIndex),
    /setTimeout\(\(\) => \{[\s\S]*liteSnapCaptureSessionManager\.prewarmOverlay\(\)[\s\S]*\}, LITESNAP_OVERLAY_PREWARM_DELAY_MS\)/,
    "LiteSnap should lazily prewarm the overlay on a delay after the launcher window is ready, without blocking bootstrap"
  );
  assert.match(
    mainIndexSource.slice(launcherWindowCreationIndex),
    /setTimeout\(\(\) => \{[\s\S]*liteSnapCaptureSessionManager\.prewarmCaptureCache\(\)[\s\S]*\}, LITESNAP_CAPTURE_PREWARM_DELAY_MS\)/,
    "LiteSnap should defer screenshot frame-cache prewarm until after startup settles"
  );
  assert.match(
    mainIndexSource,
    /const started = await liteSnapCaptureSessionManager\.startCapture\(\);\s*return started;/,
    "LiteSnap should not restart periodic frame-cache refresh after every capture start"
  );
  assert.match(
    mainIndexSource,
    /liteSnapCaptureShortcutTriggeredAt/,
    "LiteSnap capture shortcut should debounce duplicate global and local triggers"
  );
  assert.match(
    mainIndexSource,
    /launcherWindow\.on\("focus"[\s\S]*pauseIdleFrameCache\(\)/,
    "LiteSnap should pause idle frame-cache warming while the launcher window is focused"
  );
  assert.doesNotMatch(
    mainIndexSource,
    /startCapture\(async[\s\S]{0,200}launcherWindow\.hide\(\)/,
    "LiteSnap capture should keep the launcher window visible"
  );
  assert.match(
    mainIndexSource,
    /registerLiteSnapLocalShortcut\(\s*window,\s*startCapture,\s*pinClipboardImage,\s*startColorCapture,\s*togglePinClickThrough\s*\)/,
    "LiteSnap should also handle screenshot shortcuts locally when the launcher window is focused"
  );
  assert.match(
    mainIndexSource,
    /function matchAcceleratorInput\(input: Input, accelerator: string\)/,
    "LiteSnap local shortcut matching should mirror the configured accelerator"
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
    /shortcutsChanged[\s\S]*hasOwnProperty\.call\(patch, "screenshotShortcut"\)[\s\S]*hasOwnProperty\.call\(patch, "pinShortcut"\)/,
    "LiteSnap should only re-register global shortcuts when shortcut settings change"
  );
  assert.match(
    mainIndexSource,
    /function updateLiteSnapSettingsWithShortcutRegistration[\s\S]*const previous = await store\.getSettings\(\)[\s\S]*const next = await store\.updateSettings\(patch\)/,
    "LiteSnap should keep previous shortcut settings available while testing new shortcuts"
  );
  assert.match(
    mainIndexSource,
    /requestedRegistration\.screenshot[\s\S]*previous\.screenshotShortcut[\s\S]*requestedRegistration\.pin[\s\S]*previous\.pinShortcut/,
    "LiteSnap should roll failed shortcut registrations back to previous working values"
  );
  assert.match(
    mainIndexSource,
    /if \(!shortcutsChanged\) \{\s*return next;\s*\}/,
    "LiteSnap should skip shortcut registration when only non-shortcut settings change"
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
  const ocrInstallerSource = fs.readFileSync(ocrCapabilityInstallerPath, "utf8");

  assert.match(overlayRendererSource, /copy|save|pin|cancel/);
  assert.match(overlayRendererSource, /pointerdown/);
  assert.match(
    overlayRendererSource,
    /function syncDisplayFollowLock\(\): void[\s\S]*liteSnapSetDisplayFollowLocked/,
    "LiteSnap overlay should lock display follow after the user starts selecting"
  );
  assert.match(
    overlayRendererSource,
    /window\.launcher\.onLiteSnapOverlayStateChanged\(\(nextState\) => \{/,
    "LiteSnap overlay should subscribe to pushed overlay-state updates"
  );
  assert.match(
    overlayRendererSource,
    /function isOverlayBackgroundReady\(\)[\s\S]*dataset\.ready === "true"/,
    "LiteSnap overlay should not render selection dimming before the screenshot background is ready"
  );
  assert.match(
    overlayRendererSource,
    /function resetSelectionUi\(\)[\s\S]*lastSelection = null/,
    "LiteSnap overlay should clear remembered selections when a capture session resets"
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
    /function shouldShowToolbar\(\): boolean \{[\s\S]*selectionCommitted/,
    "LiteSnap overlay should only show the toolbar after the user confirms a selection"
  );
  assert.match(
    overlayHtmlSource,
    /litesnap-annotation-frame/,
    "LiteSnap overlay should expose resize handles for selected annotations"
  );
  assert.match(
    overlayRendererSource,
    /annotation-resizing|applyAnnotationResize/,
    "LiteSnap overlay should let users drag annotation handles to scale objects"
  );
  assert.match(
    overlayRendererSource,
    /litesnap-width-slider|width-slider/,
    "LiteSnap overlay should expose a draggable width slider instead of fixed presets"
  );
  assert.match(
    overlayRendererSource,
    /function getEdgeHandleAtPoint\(/,
    "LiteSnap selection should support edge drag resizing, not only tiny corner handles"
  );
  assert.match(
    overlayRendererSource,
    /function wrapCanvasText\(/,
    "LiteSnap text annotations should wrap long strings instead of clipping"
  );
  assert.match(
    overlayRendererSource,
    /toolbarAnchorPoint/,
    "LiteSnap toolbar placement should follow the selection release point"
  );
  assert.match(
    overlayRendererSource,
    /placement = "below"|placement = "above"/,
    "LiteSnap toolbar should prefer below the selection and flip above when space is tight"
  );
  assert.match(
    overlayRendererSource,
    /WeChat-style: prefer below the selection/,
    "LiteSnap toolbar placement should use WeChat-style below-first logic"
  );
  assert.match(
    overlayRendererSource,
    /syncToolbarStyleRow/,
    "LiteSnap toolbar should sync a contextual style row when tools change"
  );
  assert.match(
    fs.readFileSync(overlayHtmlPath, "utf8"),
    /<textarea[\s\S]*id="litesnap-text-input"/,
    "LiteSnap text editor should be a multiline textarea"
  );
  assert.match(
    overlayRendererSource,
    /function isNearFullscreenWindowRect\(/,
    "LiteSnap overlay should suppress full-screen window hints that cover the whole monitor"
  );
  assert.match(
    overlayRendererSource,
    /liteSnapGetWindowRectAtPoint\([\s\S]*hoverWindowRect = normalizeWindowRect/,
    "LiteSnap overlay should preview (not auto-commit) the window under the cursor"
  );
  assert.match(
    overlayRendererSource,
    /if \(wasSelecting && !isValidSelection\(selection\)\)[\s\S]*if \(priorSelection\)[\s\S]*selection = priorSelection[\s\S]*if \(hoverWindowRect && !isNearFullscreenWindowRect\(hoverWindowRect\)\)/,
    "LiteSnap overlay should preserve an existing selection on stray clicks and only adopt hovered windows without a prior selection"
  );
  assert.match(
    overlayRendererSource,
    /bakeRegionEffectOntoLayer[\s\S]*rebuildEffectLayer/,
    "LiteSnap overlay should bake mosaic and blur strokes instead of re-rasterizing every frame"
  );
  assert.match(
    overlayRendererSource,
    /bakeVectorAnnotationOntoLayer[\s\S]*rebuildVectorLayer/,
    "LiteSnap overlay should bake finalized vector annotations onto a reusable layer"
  );
  assert.match(
    overlayRendererSource,
    /renderSelectionDim\([\s\S]*dimTopNode/,
    "LiteSnap overlay should dim outside the selection with edge panels instead of a giant box-shadow"
  );
  assert.match(
    overlayRendererSource,
    /scheduleLoupeUpdate\([\s\S]*requestAnimationFrame[\s\S]*updateLoupe\([\s\S]*getImageData[\s\S]*hoveredColor/,
    "LiteSnap overlay should throttle magnifier updates and sample pixel colors"
  );
  assert.match(
    overlayRendererSource,
    /liteSnapEnsureSourceImage/,
    "LiteSnap overlay should request the full source image only when needed"
  );
  assert.match(
    overlayRendererSource,
    /canvasToPngBuffer[\s\S]*toBlob[\s\S]*imagePngBuffer/,
    "LiteSnap overlay should send composited annotations as async PNG buffers instead of sync base64"
  );
  assert.match(
    overlayRendererSource,
    /ensureLoupeSampleImage\([\s\S]*overlayState\?\.imageDataUrl/,
    "LiteSnap overlay should sample loupe colors from the preview image instead of the full source"
  );
  assert.match(
    overlayRendererSource,
    /scheduleOverlayRender\([\s\S]*requestAnimationFrame[\s\S]*renderSelection/,
    "LiteSnap overlay should coalesce selection redraws to animation frames"
  );
  assert.match(
    overlayRendererSource,
    /async function copyHoveredColor[\s\S]*navigator\.clipboard\?\.writeText\(color\)[\s\S]*liteSnapRecordRecentColor/,
    "LiteSnap overlay should copy the currently sampled color and record it as a recent color"
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
    overlayRendererSource,
    /let lastAnnotationTool: AnnotationTool = "select"/,
    "LiteSnap should retain the last drawing tool separately from selection mode"
  );
  assert.match(
    overlayRendererSource,
    /annotationTool: lastAnnotationTool/,
    "LiteSnap should not overwrite the saved drawing tool when returning to selection mode"
  );
  assert.match(
    overlayRendererSource,
    /restoreLastAnnotationToolAfterSelection\(\)[\s\S]*setActiveTool\(lastAnnotationTool, false\)/,
    "LiteSnap should restore the saved drawing tool only after a valid selection exists"
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
    overlayHtmlSource,
    /litesnap-toolbar-style/,
    "LiteSnap overlay toolbar should expose a contextual style row"
  );
  assert.match(
    overlayCssSource,
    /\.litesnap-overlay__toolbar[\s\S]*flex-direction:\s*column[\s\S]*\.litesnap-overlay__toolbar-row--main/,
    "LiteSnap overlay toolbar should use a WeChat-like main row plus style row"
  );
  assert.match(
    overlayCssSource,
    /#9d63ff/,
    "LiteSnap overlay should use the app violet accent for selection and active tools"
  );
  assert.match(overlayHtmlSource, /litesnap-overlay/);
  assert.match(overlayCssSource, /\.litesnap-overlay/);
  assert.match(copyAssetsSource, /litesnap-overlay\.html/);
  assert.match(copyAssetsSource, /litesnap-overlay\.css/);
  assert.match(
    overlayCssSource,
    /\.litesnap-overlay\[data-ready="false"\][\s\S]*background-color:\s*transparent/,
    "LiteSnap preparing overlay should stay visually transparent instead of flashing black"
  );
  assert.doesNotMatch(
    overlayCssSource,
    /\.litesnap-overlay::before/,
    "LiteSnap should not dim the full screenshot before a selection is drawn"
  );
  assert.match(
    overlayRendererSource,
    /root\.style\.backgroundSize = backgroundSize/,
    "LiteSnap overlay should paint the preview at exact viewport size without upscaling blur"
  );
  assert.match(
    overlayRendererSource,
    /await image\.decode\(\)[\s\S]*root\.dataset\.ready = "true"/,
    "LiteSnap overlay should decode the screenshot before marking the frame ready so the first capture never flashes a grey screen"
  );
});

test("LiteSnap wires Windows OCR text recognition end to end", () => {
  const sharedSource = fs.readFileSync(sharedLiteSnapPath, "utf8");
  const channelsSource = fs.readFileSync(channelsPath, "utf8");
  const preloadSource = fs.readFileSync(preloadPath, "utf8");
  const ipcSource = fs.readFileSync(ipcPath, "utf8");
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");
  const ocrInstallerSource = fs.readFileSync(ocrCapabilityInstallerPath, "utf8");
  const providerSource = fs.readFileSync(captureProviderPath, "utf8");
  const nativeAddonSource = fs.readFileSync(nativeAddonSourcePath, "utf8");
  const buildNativeSource = fs.readFileSync(buildNativeScriptPath, "utf8");
  const mainIndexSource = fs.readFileSync(mainIndexPath, "utf8");
  const overlayHtmlSource = fs.readFileSync(overlayHtmlPath, "utf8");
  const overlayRendererSource = fs.readFileSync(overlayRendererPath, "utf8");
  const panelImplsSource = fs.readFileSync(panelImplsPath, "utf8");

  assert.match(
    nativeAddonSource,
    /winrt\/Windows\.Media\.Ocr\.h/,
    "native addon should include the Windows OCR projection header"
  );
  assert.match(
    nativeAddonSource,
    /"recognizeText"/,
    "native addon should export a recognizeText function"
  );
  assert.match(
    nativeAddonSource,
    /kChinesePrefixes[\s\S]*zh-Hans/,
    "native addon should prefer Chinese OCR language packs"
  );
  assert.match(
    nativeAddonSource,
    /OcrEngine::TryCreateFromUserProfileLanguages\(\)/,
    "native addon should fall back to user profile OCR languages"
  );
  assert.match(
    buildNativeSource,
    /cppwinrt/,
    "native build should add the cppwinrt include directory"
  );
  assert.match(
    nativeAddonSource,
    /languagePreference/,
    "native OCR should accept a language preference"
  );
  assert.match(
    buildNativeSource,
    /WindowsApp\.lib/,
    "native build should link WindowsApp.lib for WinRT"
  );

  assert.match(sharedSource, /interface LiteSnapRecognizeTextResult/);
  assert.match(channelsSource, /liteSnapRecognizeText:/);
  assert.match(preloadSource, /liteSnapRecognizeText\(/);
  assert.match(ipcSource, /IPC_CHANNELS\.liteSnapRecognizeText/);
  assert.match(
    providerSource,
    /recognizeText\([\s\S]*NativeImage[\s\S]*LiteSnapRecognizeTextOptions/,
    "capture provider should expose recognizeText"
  );
  assert.match(
    captureSource,
    /public async recognizeSelection\(/,
    "capture session manager should support recognizeSelection"
  );
  assert.match(
    captureSource,
    /prepareOcrImage\([\s\S]*resize\(/,
    "OCR should upscale very small crops before recognition"
  );
  assert.match(
    captureSource,
    /recognizeOcrWithFallback\([\s\S]*recognizeWithLanguage\(image, "chinese"\)/,
    "OCR should run Chinese and English engines sequentially instead of in parallel"
  );
  assert.match(
    nativeAddonSource,
    /g_ocr_mutex/,
    "native OCR should serialize concurrent recognition requests"
  );
  assert.match(
    mainIndexSource,
    /recognizeLiteSnapTextAndShowPanel[\s\S]*preferredView: "ocr"/,
    "main process should open the OCR panel with recognized text"
  );
  assert.match(
    overlayHtmlSource,
    /data-action="ocr"/,
    "overlay toolbar should have a text-recognition button"
  );
  assert.match(
    overlayRendererSource,
    /liteSnapRecognizeText\(\{ selection \}\)/,
    "overlay should call recognizeText for the current selection"
  );
  assert.match(
    overlayRendererSource,
    /请先框选要识别的区域/,
    "overlay OCR should explain when no valid selection exists"
  );
  assert.match(
    panelImplsSource,
    /setMode\("plugin"\);[\s\S]*renderList\(\);[\s\S]*refreshEntries/,
    "plugin panel open should render immediately before async refresh"
  );
  assert.match(
    panelImplsSource,
    /liteSnapPanelView === "ocr"[\s\S]*litesnap-ocr-textarea/,
    "panel should render an editable OCR result view"
  );
  assert.match(panelImplsSource, /ensureLiteSnapOcrCacheLoaded/);
  assert.match(
    panelImplsSource,
    /formatLiteSnapOcrEngineStatus\(\)[\s\S]*中文：[\s\S]*英文：/,
    "OCR UI should show separate Chinese and English engine readiness states"
  );
  assert.match(
    panelImplsSource,
    /Windows 本地 OCR 会在已就绪的中文\/英文引擎间自动选择/,
    "OCR UI should explain that installed engines are selected automatically"
  );
  assert.match(panelImplsSource, /liteSnapGetOcrProbeCache/);
  assert.match(panelImplsSource, /persistLiteSnapOcrProbeCacheIfReady/);
  assert.match(channelsSource, /liteSnapGetOcrProbeCache:/);
  assert.match(channelsSource, /liteSnapSetOcrProbeCache:/);
  assert.match(
    panelImplsSource,
    /formatLiteSnapOcrInstallActionLabel[\s\S]*missingLanguages/,
    "OCR install button label should reflect missing languages"
  );
  assert.match(channelsSource, /relaunchApp:/);
  assert.match(preloadSource, /relaunchApp\(/);
  assert.match(captureSource, /ocrIssue:\s*"module_missing"/);
  assert.match(channelsSource, /liteSnapProbeOcr:/);
  assert.match(preloadSource, /liteSnapProbeOcr\(/);
  assert.match(ipcSource, /IPC_CHANNELS\.liteSnapProbeOcr/);
  assert.match(
    panelImplsSource,
    /runLiteSnapSettingsOcrProbe[\s\S]*liteSnapProbeOcr/,
    "settings panel should expose an OCR probe action"
  );
  assert.match(nativeAddonSource, /"probeOcr"/);
  assert.match(
    panelImplsSource,
    /runLiteSnapInstallOcrCapabilities[\s\S]*liteSnapInstallOcrCapabilities/,
    "panel should support one-click OCR capability install"
  );
  assert.match(
    channelsSource,
    /liteSnapInstallOcrCapabilities:/
  );
  assert.match(
    captureSource,
    /inferOcrCapabilitiesFromEngineProbe/,
    "OCR probe should skip PowerShell when engines are already ready"
  );
  assert.match(
    ocrInstallerSource,
    /Get-WindowsCapability -Online \| Where-Object \{ \$_.Name -like 'Language\.OCR\*' \}/,
    "OCR capability listing should enumerate Language.OCR packages (Win11 installed state)"
  );
  assert.match(
    ocrInstallerSource,
    /Get-WindowsCapability \| Where-Object \{ \$_.Name -like 'Language\.OCR\*' \}/,
    "OCR capability listing should fall back to local capability state"
  );
  assert.match(
    providerSource,
    /resolveLiteSnapNativeAddonPath/,
    "capture provider should resolve native addon via packaged fallbacks"
  );

  assert.match(
    sharedSource,
    /LiteSnapTranslateSelectionResult.*from "\.\/translate"/
  );
  assert.match(channelsSource, /liteSnapTranslateSelection:/);
  assert.doesNotMatch(
    channelsSource,
    /liteSnapTranslateText:/,
    "text translate should use translateToolTranslateText instead"
  );
  assert.match(preloadSource, /liteSnapTranslateSelection\(/);
  assert.doesNotMatch(
    preloadSource,
    /liteSnapTranslateText\(/,
    "preload should not expose liteSnapTranslateText"
  );
  assert.match(ipcSource, /IPC_CHANNELS\.liteSnapTranslateSelection/);
  assert.doesNotMatch(
    ipcSource,
    /IPC_CHANNELS\.liteSnapTranslateText/,
    "IPC should not register liteSnapTranslateText"
  );
  assert.match(
    captureSource,
    /recognizeTextFromSelection/,
    "capture session manager should expose recognizeTextFromSelection"
  );
  assert.match(
    captureSource,
    /languagePreference:\s*"english"/,
    "translate flow should prefer the English OCR engine"
  );
  assert.match(
    mainIndexSource,
    /正在在线翻译，请稍候/,
    "translate flow should open the panel before Baidu translate returns"
  );
  assert.match(
    mainIndexSource,
    /translateLiteSnapSelectionAndShowPanel[\s\S]*preferredView: "translate"/,
    "main process should open the translate panel"
  );
  assert.match(
    overlayHtmlSource,
    /data-action="translate"/,
    "overlay toolbar should have a translate button"
  );
  assert.match(
    overlayRendererSource,
    /liteSnapTranslateSelection\(\{ selection \}\)/,
    "overlay should call translateSelection for the current selection"
  );
  assert.match(
    panelImplsSource,
    /liteSnapPanelView === "translate"[\s\S]*litesnap-translate-text/,
    "panel should render translate source and result fields"
  );
  assert.match(
    fs.readFileSync(
      path.join(process.cwd(), "src", "main", "translate", "baidu-translator.ts"),
      "utf8"
    ),
    /BAIDU_TRANSLATE_ENDPOINT[\s\S]*BAIDU_LLM_TRANSLATE_ENDPOINT/,
    "Baidu translator should support standard and LLM translate endpoints"
  );
  assert.match(
    fs.readFileSync(
      path.join(process.cwd(), "src", "shared", "baidu-translate.ts"),
      "utf8"
    ),
    /fanyi-api\.baidu\.com\/api\/trans\/vip\/translate[\s\S]*fanyi-api\.baidu\.com\/ait\/api\/aiTextTranslate/,
    "shared Baidu helper should define standard and LLM translate endpoints"
  );
  assert.doesNotMatch(
    panelImplsSource,
    /translateBaiduEngine/,
    "LiteSnap settings should not include Baidu translate credentials"
  );
});

test("LiteSnap history store, color mode, and recent colors are wired", () => {
  const databaseSource = fs.readFileSync(
    path.join(process.cwd(), "src", "main", "database.ts"),
    "utf8"
  );
  const historySource = fs.readFileSync(
    path.join(process.cwd(), "src", "main", "litesnap", "history-store.ts"),
    "utf8"
  );
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");
  const overlayRendererSource = fs.readFileSync(overlayRendererPath, "utf8");
  const settingsSource = fs.readFileSync(settingsStorePath, "utf8");
  const pluginSource = fs.readFileSync(
    path.join(process.cwd(), "src", "main", "plugins", "litesnap", "index.ts"),
    "utf8"
  );
  const mainIndexSource = fs.readFileSync(mainIndexPath, "utf8");

  assert.match(databaseSource, /CREATE TABLE IF NOT EXISTS litesnap_history/);
  assert.match(historySource, /export class LiteSnapHistoryStore/);
  assert.match(historySource, /async add\(/);
  assert.match(captureSource, /startColorCapture\(/);
  assert.match(captureSource, /mode: LiteSnapOverlayMode/);
  assert.match(captureSource, /recordHistory\(/);
  assert.match(captureSource, /recordRecentColor\(/);
  assert.match(captureSource, /"capture-copy"/);
  assert.match(captureSource, /"capture-save"/);
  assert.match(captureSource, /"capture-pin"/);
  assert.match(settingsSource, /recentColors:/);
  assert.match(settingsSource, /historyEnabled:/);
  assert.match(settingsSource, /colorShortcut:/);
  assert.match(overlayRendererSource, /isColorMode\(\)/);
  assert.match(overlayRendererSource, /liteSnapRecordRecentColor/);
  assert.match(overlayRendererSource, /litesnap-overlay__color--recent/);
  assert.match(overlayRendererSource, /mode === "color"/);
  assert.match(pluginSource, /open-history/);
  assert.match(pluginSource, /start-color-capture/);
  assert.match(pluginSource, /snap history|截图历史/);
  assert.match(pluginSource, /取色/);
  assert.match(mainIndexSource, /LiteSnapHistoryStore/);
  assert.match(mainIndexSource, /clipboard-pin/);
  assert.match(mainIndexSource, /startLiteSnapColorCapture/);
});

test("LiteSnap long capture, history editing, and anonymous diagnostics are wired", () => {
  const sharedSource = fs.readFileSync(sharedLiteSnapPath, "utf8");
  const channelsSource = fs.readFileSync(channelsPath, "utf8");
  const ipcSource = fs.readFileSync(ipcPath, "utf8");
  const captureSource = fs.readFileSync(captureManagerPath, "utf8");
  const captureProviderSource = fs.readFileSync(captureProviderPath, "utf8");
  const windowCoordinatorSource = fs.readFileSync(
    longCaptureWindowCoordinatorPath,
    "utf8"
  );
  const longCaptureCoordinatorSource = fs.readFileSync(
    longCaptureCoordinatorPath,
    "utf8"
  );
  const overlayRendererSource = fs.readFileSync(overlayRendererPath, "utf8");
  const controllerSource = fs.readFileSync(longCaptureControllerHtmlPath, "utf8");
  const guideSource = fs.readFileSync(longCaptureGuideHtmlPath, "utf8");
  const panelSource = fs.readFileSync(panelImplsPath, "utf8");
  const databaseSource = fs.readFileSync(
    path.join(process.cwd(), "src", "main", "database.ts"),
    "utf8"
  );
  const diagnosticStoreSource = fs.readFileSync(
    path.join(process.cwd(), "src", "main", "litesnap", "diagnostic-store.ts"),
    "utf8"
  );

  assert.match(sharedSource, /"long-capture"/);
  assert.match(sharedSource, /"history-edit"/);
  assert.match(sharedSource, /LiteSnapLongCaptureProgress/);
  assert.match(sharedSource, /LiteSnapLongCaptureControl = "capture" \| "finish" \| "cancel"/);
  assert.match(channelsSource, /liteSnapStartLongCapture/);
  assert.match(channelsSource, /liteSnapScrollLongCapture/);
  assert.match(channelsSource, /liteSnapControlLongCapture/);
  assert.match(channelsSource, /liteSnapGetLongCaptureProgress/);
  assert.match(channelsSource, /liteSnapGetDiagnostics/);
  assert.match(ipcSource, /startLongCapture/);
  assert.match(ipcSource, /historyEdit/);
  assert.match(captureSource, /matchLiteSnapVerticalFrames/);
  assert.match(captureSource, /LONG_CAPTURE_MAX_HEIGHT = 30_000/);
  assert.match(captureSource, /session\.historyEdit \? "history-edit"/);
  assert.match(captureSource, /reportLongCaptureFailure/);
  assert.match(captureSource, /LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION/);
  assert.match(captureSource, /captureObservedLongCaptureFrame/);
  assert.match(captureSource, /matchLiteSnapVerticalFramesBidirectional/);
  assert.match(captureSource, /advanceLiteSnapStitchRange/);
  assert.match(captureSource, /pendingFrame/);
  assert.match(captureSource, /LONG_CAPTURE_STABILITY_CONFIRM_MS = 80/);
  assert.doesNotMatch(captureSource, /flushLongCapturePendingFrame/);
  assert.doesNotMatch(captureSource, /LONG_CAPTURE_FINISH_SETTLE_TIMEOUT_MS/);
  assert.match(captureSource, /Finish is an explicit user command/);
  assert.match(captureSource, /longCapture\.samplingBurstRemaining = 0/);
  assert.match(longCaptureCoordinatorSource, /pollDueAt/);
  assert.match(longCaptureCoordinatorSource, /resetBaseline/);
  assert.match(captureSource, /fake[\s\S]*upward scroll/);
  assert.match(captureSource, /captureInFlight/);
  assert.match(captureSource, /appendObservedLongCaptureFrame/);
  assert.match(captureSource, /currentToPending\.direction === pendingToNext\.direction/);
  assert.match(captureSource, /findLiteSnapQuietSeamRow/);
  assert.match(longCaptureCoordinatorSource, /trimTop/);
  assert.match(longCaptureCoordinatorSource, /trimBottom/);
  assert.match(captureSource, /nextFrames\.unshift/);
  assert.match(captureSource, /scheduleLongCapturePoll/);
  assert.match(captureSource, /LONG_CAPTURE_SCROLL_SETTLE_MS = 90/);
  assert.match(captureSource, /LONG_CAPTURE_MAX_SETTLE_CONFIRMATIONS = 3/);
  assert.match(captureSource, /LONG_CAPTURE_MAX_POLLS_PER_SCROLL = 8/);
  assert.match(captureSource, /LONG_CAPTURE_PASSIVE_POLL_MS = 120/);
  assert.doesNotMatch(captureSource, /LONG_CAPTURE_MANUAL_POLL_MS/);
  assert.match(captureSource, /Long capture is wheel-event driven/);
  assert.match(captureSource, /Some Windows layered-window combinations/);
  assert.match(captureSource, /Passive observation ignores those/);
  assert.match(captureSource, /Prefer the last accepted/);
  assert.match(
    captureSource,
    /knownMatch \?\? matchLiteSnapVerticalFramesBidirectional\([\s\S]*?longCapture\.expectedDirection \?\? longCapture\.lastDirection/
  );
  assert.match(captureSource, /first post-scroll frame safely matches/);
  assert.match(captureSource, /longCapture\.expectedDirection = deltaY > 0 \? "down" : "up"/);
  assert.match(longCaptureCoordinatorSource, /session\.expectedDirection = null/);
  assert.match(captureSource, /longCapture\.queuedScrollDelta \+ deltaY/);
  assert.match(captureSource, /void this\.scrollLongCapture\(queuedDelta\)/);
  assert.match(captureSource, /本轮采样已停止/);
  assert.match(captureSource, /scrollLongCapture\(deltaY: number\)/);
  assert.match(captureSource, /LiteSnapLongCaptureWindowCoordinator/);
  assert.match(windowCoordinatorSource, /showGuide/);
  assert.match(windowCoordinatorSource, /close\(\)/);
  assert.match(captureSource, /keepLongCaptureWindowsVisible/);
  assert.match(windowCoordinatorSource, /revealMask/);
  assert.match(windowCoordinatorSource, /overlayWindow\.setIgnoreMouseEvents\(true\)/);
  assert.match(windowCoordinatorSource, /GUIDE_BORDER_OUTSET = 4/);
  assert.match(windowCoordinatorSource, /setIgnoreMouseEvents\(false\)/);
  assert.match(windowCoordinatorSource, /STACK_WATCH_INTERVAL_MS = 750/);
  assert.match(windowCoordinatorSource, /requestAnimationFrame\(\(\) => requestAnimationFrame/);
  assert.match(captureSource, /longCaptureSelection/);
  assert.match(windowCoordinatorSource, /guide\.showInactive\(\)/);
  assert.match(
    fs.readFileSync(overlayWindowPath, "utf8"),
    /transparent: true[\s\S]*backgroundColor: "#00000000"/
  );
  assert.match(captureSource, /longCaptureExportWidth/);
  assert.match(captureSource, /normalizeLongCaptureExportSize/);
  assert.match(captureSource, /imageStore\.saveImage\(output, settings\)/);
  assert.match(captureSource, /recordHistory\(output, "capture-save"\)/);
  assert.match(captureSource, /includeLayeredWindows: true/);
  assert.match(fs.readFileSync(overlayWindowPath, "utf8"), /setContentProtection\(true\)/);
  assert.match(captureSource, /session\.overlayWindow\.setContentProtection\(true\)/);
  assert.match(captureSource, /showInteractiveOverlay[\s\S]*setContentProtection\(false\)/);
  assert.match(captureProviderSource, /captureRegionImage/);
  assert.match(captureProviderSource, /resolveLiteSnapPhysicalCaptureRegion/);
  assert.match(captureSource, /LONG_CAPTURE_MAX_MEMORY_BYTES/);
  assert.match(captureSource, /pauseLongCaptureAtSafetyLimit/);
  assert.match(captureSource, /不会自动完成或保存/);
  assert.doesNotMatch(
    captureSource,
    /finishLongCapture\("已达到长截图安全上限/,
    "safety limits must never complete or save a capture without an explicit user action"
  );
  assert.match(controllerSource, /程序不会判断是否到底，也不会自动完成/);
  assert.match(captureSource, /A screenshot shortcut pressed while long capture is active/);
  assert.match(captureSource, /长截图会保持显示并继续重试/);
  assert.doesNotMatch(
    captureSource,
    /目标窗口已关闭或选区已不再属于原窗口，长截图已取消/,
    "temporary target lookup failures must not dismiss long capture"
  );
  assert.match(captureSource, /长截图控制窗口已恢复/);
  assert.doesNotMatch(
    captureSource,
    /长截图辅助窗口意外关闭，本次长截图已取消/,
    "helper window recovery must not cancel long capture"
  );
  assert.match(longCaptureCoordinatorSource, /sampleFrames/);
  assert.match(longCaptureCoordinatorSource, /acceptedFrames/);
  assert.match(longCaptureCoordinatorSource, /confirmFinalFrame/);
  assert.match(longCaptureCoordinatorSource, /estimateMemoryBytes/);
  assert.match(captureSource, /isCurrentLongCapture/);
  assert.doesNotMatch(
    windowCoordinatorSource,
    /controller\.hide\(\)/,
    "long capture must keep the controller visible while the user scrolls"
  );
  assert.match(
    fs.readFileSync(nativeAddonSourcePath, "utf8"),
    /include_layered_windows[\s\S]*CAPTUREBLT/,
    "native capture must be able to omit transparent guide windows"
  );
  assert.doesNotMatch(
    fs.readFileSync(nativeAddonSourcePath, "utf8"),
    /SetForegroundWindow\(root\)/,
    "relayed user scrolling must not push the target above the long-capture guide"
  );
  assert.match(
    captureSource,
    /scrollWindowAtPoint\?\./,
    "long capture may relay only a real user wheel event through the protective overlay"
  );
  assert.match(controllerSource, /可向上或向下滚动/);
  assert.doesNotMatch(controllerSource, /id="capture"/);
  assert.match(overlayRendererSource, /isLongCaptureGuide\(\)[\s\S]*clicks must never leak through/);
  assert.match(
    overlayRendererSource,
    /\(!isOverlayBackgroundReady\(\) && !isLongCaptureGuide\(\)\)/,
    "long-capture dim mask must render after the live background becomes transparent"
  );
  assert.match(overlayRendererSource, /liteSnapScrollLongCapture\?\.\(event\.deltaY\)/);
  assert.match(guideSource, /liteSnapScrollLongCapture\(event\.deltaY\)/);
  assert.match(guideSource, /liteSnapControlLongCapture\("cancel"\)/);
  assert.match(guideSource, /background: rgba\(0, 0, 0, \.01\)/);
  assert.match(guideSource, /fully transparent layered-window pixel is click-through/);
  assert.doesNotMatch(guideSource, /box-shadow/);
  assert.match(
    overlayRendererSource,
    /event\.key === "Escape"[\s\S]*liteSnapControlLongCapture\("cancel"\)/,
    "Escape must cancel a long capture"
  );
  assert.match(
    windowCoordinatorSource,
    /controller\.showInactive\(\)/,
    "the long-capture controller must not take focus away from the scroll target"
  );
  assert.match(databaseSource, /CREATE TABLE IF NOT EXISTS litesnap_diagnostics/);
  assert.match(diagnosticStoreSource, /LITESNAP_DIAGNOSTIC_MAX_ITEMS = 20/);
  assert.match(diagnosticStoreSource, /sanitizeDiagnosticMetrics/);
  assert.match(panelSource, /openLiteSnapDiagnosticsView/);
  assert.match(panelSource, /runLiteSnapHistoryEdit/);
  assert.match(panelSource, /复制诊断/);
});
