import fs from "node:fs";
import {
  desktopCapturer,
  nativeImage,
  screen,
  type Display,
  type NativeImage,
  type Rectangle
} from "electron";

import {
  type LiteSnapOcrLanguagePreference
} from "../../shared/litesnap-ocr-quality";
import {
  formatLiteSnapNativeAddonProbePaths,
  isLiteSnapNativeAddonPresent,
  resolveLiteSnapNativeAddonCandidates,
  resolveLiteSnapNativeAddonPath
} from "./native-addon-path";

export interface LiteSnapRecognizeTextOptions {
  languagePreference?: LiteSnapOcrLanguagePreference;
}

export interface LiteSnapSourceCaptureOptions {
  /** Omit transparent/layered helper windows from a Windows screen capture. */
  includeLayeredWindows?: boolean;
}

export type LiteSnapTargetWindowRect = Rectangle & {
  /** Opaque per-process window identity. Never persisted in diagnostics. */
  windowId?: string;
};

export type LiteSnapTargetWindowOptions = {
  targetWindowId?: string;
};

export interface LiteSnapCaptureProvider {
  capturePreviewImage(display: Display): Promise<NativeImage | null>;
  captureSourceImage(
    display: Display,
    options?: LiteSnapSourceCaptureOptions
  ): Promise<NativeImage | null>;
  captureRegionImage?(
    display: Display,
    region: Rectangle,
    options?: LiteSnapSourceCaptureOptions
  ): Promise<NativeImage | null>;
  captureDisplayFrames(
    display: Display
  ): Promise<{ previewImage: NativeImage; sourceImage: NativeImage } | null>;
  getWindowRectAtPoint(
    display: Display,
    x: number,
    y: number
  ): Promise<LiteSnapTargetWindowRect | null>;
  supportsLayeredWindowExclusion?(): boolean;
  scrollWindowAtPoint?(
    display: Display,
    x: number,
    y: number,
    delta: number,
    options?: LiteSnapTargetWindowOptions
  ): Promise<boolean>;
  recognizeText(
    image: NativeImage,
    options?: LiteSnapRecognizeTextOptions
  ): Promise<string | null>;
  supportsTextRecognition(): boolean;
}

type NativeLiteSnapCaptureRequest = {
  x: number;
  y: number;
  captureWidth: number;
  captureHeight: number;
  outputWidth: number;
  outputHeight: number;
  includeLayeredWindows?: boolean;
};

type NativeLiteSnapCaptureResult = {
  width: number;
  height: number;
  data: Buffer;
};

type NativeLiteSnapFramesRequest = {
  x: number;
  y: number;
  captureWidth: number;
  captureHeight: number;
  previewWidth: number;
  previewHeight: number;
};

type NativeLiteSnapFramesResult = {
  source: NativeLiteSnapCaptureResult;
  preview: NativeLiteSnapCaptureResult;
};

type NativeLiteSnapCaptureAddon = {
  captureDisplayRect(
    request: NativeLiteSnapCaptureRequest
  ): NativeLiteSnapCaptureResult | null;
  captureDisplayFrames?(
    request: NativeLiteSnapFramesRequest
  ): NativeLiteSnapFramesResult | null;
  getWindowRectAtPoint?(
    x: number,
    y: number
  ): LiteSnapTargetWindowRect | null;
  scrollWindowAtPoint?(
    x: number,
    y: number,
    delta: number,
    targetWindowId?: string
  ): boolean;
  supportsLayeredWindowExclusion?(): boolean;
  recognizeText?(request: {
    data: Buffer;
    width: number;
    height: number;
    languagePreference?: string;
  }): Promise<string>;
};

type ScreenWithDipTransforms = typeof screen & {
  dipToScreenRect?: (window: null, rect: Rectangle) => Rectangle;
};

const PREVIEW_JPEG_QUALITY = 92;

function resolvePreviewOutputSize(display: Display): { width: number; height: number } {
  // Capture at physical pixels (bounds * scaleFactor). Using DIP-only size made the
  // overlay background soft/blurry on HiDPI displays because CSS stretched a
  // 1x bitmap across a 1.25x/1.5x/2x window backing store, and selection text
  // became unreadable before OCR/translate.
  const scale =
    Number.isFinite(display.scaleFactor) && display.scaleFactor > 0
      ? display.scaleFactor
      : 1;
  return {
    width: Math.max(1, Math.round(display.bounds.width * scale)),
    height: Math.max(1, Math.round(display.bounds.height * scale))
  };
}

function createNativeImageFromResult(
  result: NativeLiteSnapCaptureResult | null | undefined
): NativeImage | null {
  if (!result || !Buffer.isBuffer(result.data) || result.data.length === 0) {
    return null;
  }

  const image = nativeImage.createFromBitmap(result.data, {
    width: result.width,
    height: result.height
  });
  return image.isEmpty() ? null : image;
}

export class ElectronLiteSnapCaptureProvider implements LiteSnapCaptureProvider {
  public async capturePreviewImage(display: Display): Promise<NativeImage | null> {
    const previewSize = resolvePreviewOutputSize(display);
    return this.captureDisplayImage(display, {
      thumbnailWidth: previewSize.width,
      thumbnailHeight: previewSize.height
    });
  }

  public async captureSourceImage(
    display: Display,
    _options?: LiteSnapSourceCaptureOptions
  ): Promise<NativeImage | null> {
    return this.captureDisplayImage(display, {
      thumbnailWidth: Math.max(
        1,
        Math.round(display.bounds.width * display.scaleFactor)
      ),
      thumbnailHeight: Math.max(
        1,
        Math.round(display.bounds.height * display.scaleFactor)
      )
    });
  }

  public async captureRegionImage(): Promise<NativeImage | null> {
    // desktopCapturer cannot reliably exclude our layered guide/mask windows.
    // Long capture therefore never uses this fallback path.
    return null;
  }

  public async captureDisplayFrames(
    display: Display
  ): Promise<{ previewImage: NativeImage; sourceImage: NativeImage } | null> {
    const [previewImage, sourceImage] = await Promise.all([
      this.capturePreviewImage(display),
      this.captureSourceImage(display)
    ]);
    if (!previewImage || previewImage.isEmpty() || !sourceImage || sourceImage.isEmpty()) {
      return null;
    }

    return { previewImage, sourceImage };
  }

  public async getWindowRectAtPoint(): Promise<Rectangle | null> {
    return null;
  }

  public async scrollWindowAtPoint(): Promise<boolean> {
    return false;
  }

  public async recognizeText(
    _image: NativeImage,
    _options?: LiteSnapRecognizeTextOptions
  ): Promise<string | null> {
    // OCR is only provided by the Windows native addon.
    return null;
  }

  public supportsTextRecognition(): boolean {
    return false;
  }

  private async captureDisplayImage(
    display: Display,
    size: {
      thumbnailWidth: number;
      thumbnailHeight: number;
    }
  ): Promise<NativeImage | null> {
    const { thumbnailWidth, thumbnailHeight } = size;
    const sources = await desktopCapturer.getSources({
      types: ["screen"],
      thumbnailSize: {
        width: thumbnailWidth,
        height: thumbnailHeight
      },
      fetchWindowIcons: false
    });

    const matchedSource =
      sources.find((source) => source.display_id === String(display.id)) ?? sources[0];
    if (!matchedSource || !matchedSource.thumbnail || matchedSource.thumbnail.isEmpty()) {
      return null;
    }

    return matchedSource.thumbnail;
  }
}

class NativeLiteSnapCaptureProvider implements LiteSnapCaptureProvider {
  public constructor(private readonly addon: NativeLiteSnapCaptureAddon) {}

  public async capturePreviewImage(display: Display): Promise<NativeImage | null> {
    return this.captureDisplayImage(display, false);
  }

  public async captureSourceImage(
    display: Display,
    options?: LiteSnapSourceCaptureOptions
  ): Promise<NativeImage | null> {
    return this.captureDisplayImage(display, true, options);
  }

  public async captureRegionImage(
    display: Display,
    region: Rectangle,
    options?: LiteSnapSourceCaptureOptions
  ): Promise<NativeImage | null> {
    const physicalRegion = resolveLiteSnapPhysicalCaptureRegion(
      display,
      region,
      (screen as ScreenWithDipTransforms | undefined)?.dipToScreenRect?.bind(screen, null)
    );
    if (physicalRegion.width <= 0 || physicalRegion.height <= 0) {
      return null;
    }
    await new Promise<void>((resolve) => setImmediate(resolve));
    return createNativeImageFromResult(this.addon.captureDisplayRect({
      x: physicalRegion.x,
      y: physicalRegion.y,
      captureWidth: physicalRegion.width,
      captureHeight: physicalRegion.height,
      outputWidth: physicalRegion.width,
      outputHeight: physicalRegion.height,
      includeLayeredWindows: options?.includeLayeredWindows
    }));
  }

  public async captureDisplayFrames(
    display: Display
  ): Promise<{ previewImage: NativeImage; sourceImage: NativeImage } | null> {
    if (typeof this.addon.captureDisplayFrames === "function") {
      const physicalBounds = toPhysicalDisplayBounds(display);
      const previewSize = resolvePreviewOutputSize(display);
      await new Promise<void>((resolve) => setImmediate(resolve));
      const result = this.addon.captureDisplayFrames({
        x: physicalBounds.x,
        y: physicalBounds.y,
        captureWidth: Math.max(1, physicalBounds.width),
        captureHeight: Math.max(1, physicalBounds.height),
        previewWidth: previewSize.width,
        previewHeight: previewSize.height
      });
      const previewImage = createNativeImageFromResult(result?.preview);
      const sourceImage = createNativeImageFromResult(result?.source);
      if (!previewImage || !sourceImage) {
        return null;
      }

      return { previewImage, sourceImage };
    }

    const [previewImage, sourceImage] = await Promise.all([
      this.capturePreviewImage(display),
      this.captureSourceImage(display)
    ]);
    if (!previewImage || previewImage.isEmpty() || !sourceImage || sourceImage.isEmpty()) {
      return null;
    }

    return { previewImage, sourceImage };
  }

  public async getWindowRectAtPoint(
    display: Display,
    x: number,
    y: number,
  ): Promise<LiteSnapTargetWindowRect | null> {
    if (typeof this.addon.getWindowRectAtPoint !== "function") {
      return null;
    }

    const screenPoint = toPhysicalDisplayPoint(display, x, y);
    const rect = this.addon.getWindowRectAtPoint(screenPoint.x, screenPoint.y);
    if (!rect || rect.width <= 8 || rect.height <= 8) {
      return null;
    }

    return {
      ...toDisplayDipRect(display, rect),
      ...(typeof rect.windowId === "string" && rect.windowId
        ? { windowId: rect.windowId }
        : {})
    };
  }

  public async scrollWindowAtPoint(
    display: Display,
    x: number,
    y: number,
    delta: number,
    options?: LiteSnapTargetWindowOptions
  ): Promise<boolean> {
    if (typeof this.addon.scrollWindowAtPoint !== "function") {
      return false;
    }
    const screenPoint = toPhysicalDisplayPoint(display, x, y);
    try {
      return Boolean(this.addon.scrollWindowAtPoint(
        screenPoint.x,
        screenPoint.y,
        delta,
        options?.targetWindowId ?? ""
      ));
    } catch (error) {
      console.warn("[litesnap] native scroll failed", error);
      return false;
    }
  }

  public supportsLayeredWindowExclusion(): boolean {
    return typeof this.addon.supportsLayeredWindowExclusion === "function" &&
      this.addon.supportsLayeredWindowExclusion() === true;
  }

  public async recognizeText(
    image: NativeImage,
    options?: LiteSnapRecognizeTextOptions
  ): Promise<string | null> {
    if (typeof this.addon.recognizeText !== "function") {
      return null;
    }

    const size = image.getSize();
    if (size.width <= 0 || size.height <= 0) {
      return null;
    }

    try {
      const text = await this.addon.recognizeText({
        data: image.toBitmap(),
        width: size.width,
        height: size.height,
        languagePreference: options?.languagePreference
      });
      if (typeof text !== "string") {
        return null;
      }
      return text.trim().length > 0 ? text : null;
    } catch (error) {
      console.warn("[litesnap] native OCR failed", error);
      return null;
    }
  }

  public supportsTextRecognition(): boolean {
    return typeof this.addon.recognizeText === "function";
  }

  private async captureDisplayImage(
    display: Display,
    highResolution: boolean,
    options?: LiteSnapSourceCaptureOptions
  ): Promise<NativeImage | null> {
    const physicalBounds = toPhysicalDisplayBounds(display);
    const previewSize = resolvePreviewOutputSize(display);
    const request: NativeLiteSnapCaptureRequest = {
      x: physicalBounds.x,
      y: physicalBounds.y,
      captureWidth: Math.max(1, physicalBounds.width),
      captureHeight: Math.max(1, physicalBounds.height),
      outputWidth: highResolution
        ? Math.max(1, physicalBounds.width)
        : previewSize.width,
      outputHeight: highResolution
        ? Math.max(1, physicalBounds.height)
        : previewSize.height,
      includeLayeredWindows: options?.includeLayeredWindows
    };

    const result = this.addon.captureDisplayRect(request);
    return createNativeImageFromResult(result);
  }
}

function toPhysicalDisplayBounds(display: Display): Rectangle {
  const screenWithDipTransforms = screen as ScreenWithDipTransforms;
  if (typeof screenWithDipTransforms.dipToScreenRect === "function") {
    return screenWithDipTransforms.dipToScreenRect(null, display.bounds);
  }

  return {
    x: Math.round(display.bounds.x * display.scaleFactor),
    y: Math.round(display.bounds.y * display.scaleFactor),
    width: Math.max(1, Math.round(display.bounds.width * display.scaleFactor)),
    height: Math.max(1, Math.round(display.bounds.height * display.scaleFactor))
  };
}

export function resolveLiteSnapPhysicalCaptureRegion(
  display: Display,
  region: Rectangle,
  dipToScreenRect?: (rect: Rectangle) => Rectangle
): Rectangle {
  const absoluteDipRect = {
    x: display.bounds.x + Math.round(region.x),
    y: display.bounds.y + Math.round(region.y),
    width: Math.max(1, Math.round(region.width)),
    height: Math.max(1, Math.round(region.height))
  };
  if (dipToScreenRect) {
    const transformed = dipToScreenRect(absoluteDipRect);
    return {
      x: Math.round(transformed.x),
      y: Math.round(transformed.y),
      width: Math.max(1, Math.round(transformed.width)),
      height: Math.max(1, Math.round(transformed.height))
    };
  }
  const scale = Number.isFinite(display.scaleFactor) && display.scaleFactor > 0
    ? display.scaleFactor
    : 1;
  return {
    x: Math.round((display.bounds.x + region.x) * scale),
    y: Math.round((display.bounds.y + region.y) * scale),
    width: Math.max(1, Math.round(region.width * scale)),
    height: Math.max(1, Math.round(region.height * scale))
  };
}

function toPhysicalDisplayPoint(
  display: Display,
  x: number,
  y: number
): { x: number; y: number } {
  const physicalBounds = toPhysicalDisplayBounds(display);
  return {
    x: Math.round(physicalBounds.x + x * display.scaleFactor),
    y: Math.round(physicalBounds.y + y * display.scaleFactor)
  };
}

function toDisplayDipRect(display: Display, rect: Rectangle): Rectangle {
  const physicalBounds = toPhysicalDisplayBounds(display);
  const x = (rect.x - physicalBounds.x) / display.scaleFactor;
  const y = (rect.y - physicalBounds.y) / display.scaleFactor;
  const width = rect.width / display.scaleFactor;
  const height = rect.height / display.scaleFactor;
  const left = Math.max(0, Math.round(x));
  const top = Math.max(0, Math.round(y));
  const right = Math.min(
    display.bounds.width,
    Math.round(x + width)
  );
  const bottom = Math.min(
    display.bounds.height,
    Math.round(y + height)
  );
  if (right - left <= 8 || bottom - top <= 8) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  return {
    x: left,
    y: top,
    width: right - left,
    height: bottom - top
  };
}

function loadNativeLiteSnapCaptureAddon(): NativeLiteSnapCaptureAddon | null {
  const requiredHashedAddonExports: Array<keyof NativeLiteSnapCaptureAddon> = [
    "captureDisplayRect",
    "supportsLayeredWindowExclusion",
    "getWindowRectAtPoint",
    "scrollWindowAtPoint",
    "recognizeText"
  ];
  for (const candidate of resolveLiteSnapNativeAddonCandidates()) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    try {
      const addon = require(candidate) as NativeLiteSnapCaptureAddon;
      if (addon && typeof addon.captureDisplayRect === "function") {
        if (/litesnap-capture-[a-f0-9]{16}\.node$/i.test(candidate)) {
          const missing = requiredHashedAddonExports.filter(
            (name) => typeof addon[name] !== "function"
          );
          if (missing.length > 0) {
            console.warn(
              `[litesnap] active native addon is missing required exports: ${missing.join(", ")}`
            );
            continue;
          }
        }
        return addon;
      }
    } catch (error) {
      console.warn(`[litesnap] failed to load native addon from ${candidate}`, error);
    }
  }

  return null;
}

function createNativeLiteSnapCaptureProvider(): LiteSnapCaptureProvider | null {
  if (process.platform !== "win32") {
    return null;
  }

  if (!isLiteSnapNativeAddonPresent()) {
    console.warn(
      "[litesnap] native addon file not found; checked paths:\n",
      formatLiteSnapNativeAddonProbePaths()
    );
    return null;
  }

  try {
    const addon = loadNativeLiteSnapCaptureAddon();
    if (!addon) {
      return null;
    }

    console.info(
      "[litesnap] using Windows native capture provider from",
      resolveLiteSnapNativeAddonPath()
    );
    if (typeof addon.recognizeText !== "function") {
      console.warn(
        "[litesnap] native capture addon loaded without OCR support; run pnpm run build to rebuild litesnap-capture.node"
      );
    }
    return new NativeLiteSnapCaptureProvider(addon);
  } catch (error) {
    console.warn("[litesnap] failed to load Windows native capture addon", error);
    return null;
  }
}

const electronFallbackProvider = new ElectronLiteSnapCaptureProvider();

function isValidCaptureFrames(
  frames: { previewImage: NativeImage; sourceImage: NativeImage } | null
): frames is { previewImage: NativeImage; sourceImage: NativeImage } {
  return Boolean(
    frames &&
      !frames.previewImage.isEmpty() &&
      !frames.sourceImage.isEmpty()
  );
}

export async function captureDisplayFramesWithFallback(
  provider: LiteSnapCaptureProvider,
  display: Display
): Promise<{ previewImage: NativeImage; sourceImage: NativeImage } | null> {
  const primary = await provider.captureDisplayFrames(display);
  if (isValidCaptureFrames(primary)) {
    return primary;
  }

  if (provider instanceof ElectronLiteSnapCaptureProvider) {
    return null;
  }

  console.warn(
    "[litesnap] primary capture failed, falling back to desktopCapturer"
  );
  const fallback = await electronFallbackProvider.captureDisplayFrames(display);
  return isValidCaptureFrames(fallback) ? fallback : null;
}

export async function captureSourceImageWithFallback(
  provider: LiteSnapCaptureProvider,
  display: Display,
  options?: LiteSnapSourceCaptureOptions
): Promise<NativeImage | null> {
  const primary = await provider.captureSourceImage(display, options);
  if (primary && !primary.isEmpty()) {
    return primary;
  }

  if (provider instanceof ElectronLiteSnapCaptureProvider) {
    return null;
  }

  if (options?.includeLayeredWindows === false) {
    // The Electron fallback cannot omit our transparent guide, so returning a
    // frame here would bake it into the saved long screenshot.
    return null;
  }

  console.warn(
    "[litesnap] primary source capture failed, falling back to desktopCapturer"
  );
  const fallback = await electronFallbackProvider.captureSourceImage(display, options);
  return fallback && !fallback.isEmpty() ? fallback : null;
}

export function createLiteSnapCaptureProvider(): LiteSnapCaptureProvider {
  return (
    createNativeLiteSnapCaptureProvider() ??
    new ElectronLiteSnapCaptureProvider()
  );
}
