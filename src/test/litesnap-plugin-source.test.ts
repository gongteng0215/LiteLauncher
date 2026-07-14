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
    /PIN_MOVE_CHANNEL[\s\S]*resolvePinWindowSize[\s\S]*window\.setBounds\(/,
    "LiteSnap pin windows should move through IPC with size locked to avoid HiDPI growth"
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
    /public prewarmCaptureCache\(\): void[\s\S]*this\.startFrameCacheRefresh\(\)[\s\S]*this\.warmDisplayFrameCache\(/,
    "LiteSnap should warm the screenshot frame cache without waiting for the overlay window"
  );
  assert.match(
    captureSource,
    /async prewarmOverlay\(\): Promise<boolean>[\s\S]*this\.prewarmCaptureCache\(\)[\s\S]*await this\.waitForOverlayReady\(overlayWindow\)/,
    "LiteSnap overlay prewarm should reuse the capture cache prewarm path"
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
    mainIndexSource,
    /const started = await liteSnapCaptureSessionManager\.startCapture[\s\S]*if \(started && !launcherWindow\.isDestroyed\(\) && !launcherWindow\.isFocused\(\)\) \{[\s\S]*liteSnapCaptureSessionManager\.startFrameCacheRefresh\(\);/,
    "LiteSnap should start follow-up frame-cache refresh only after capture when the launcher is not focused"
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
    /registerLiteSnapLocalShortcut\(window, startCapture, pinClipboardImage\)/,
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
