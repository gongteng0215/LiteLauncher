import { BrowserWindow, type Display, type NativeImage } from "electron";
import {
  captureDisplayFramesWithFallback,
  captureSourceImageWithFallback,
  type LiteSnapCaptureProvider
} from "./capture-provider";

type DisplayFrameCache = {
  displayId: number;
  scaleFactor: number;
  previewImage: NativeImage;
  previewImageDataUrl: string;
  sourceImage: NativeImage | null;
  capturedAt: number;
};

export type LiteSnapResolvedCaptureFrames = {
  previewImage: NativeImage;
  previewImageDataUrl: string;
  sourceImage: NativeImage;
  fromCache: boolean;
};

const FRAME_CACHE_TTL_MS = 1200;
const PREVIEW_JPEG_QUALITY = 92;

export class LiteSnapFrameCacheService {
  private frameCache: DisplayFrameCache | null = null;
  private warmPromise: Promise<void> | null = null;
  private warmDisplayId: number | null = null;
  private warmGeneration = 0;

  public constructor(private readonly provider: LiteSnapCaptureProvider) {}

  public abortWarm(): void {
    this.warmGeneration += 1;
    this.warmPromise = null;
    this.warmDisplayId = null;
  }

  public shouldRefreshIdle(): boolean {
    return BrowserWindow.getAllWindows().some(
      (window) => !window.isDestroyed() && window.isFocused()
    );
  }

  public warmDisplay(display: Display): void {
    this.scheduleWarm(display, () => this.captureAndStoreFrames(display));
  }

  public warmPreview(display: Display): void {
    this.scheduleWarm(display, () => this.captureAndStorePreview(display));
  }

  public encodePreviewDataUrl(image: NativeImage): string {
    return `data:image/jpeg;base64,${image.toJPEG(PREVIEW_JPEG_QUALITY).toString("base64")}`;
  }

  public store(display: Display, frames: LiteSnapResolvedCaptureFrames): void {
    this.frameCache = {
      displayId: display.id,
      scaleFactor: display.scaleFactor,
      previewImage: frames.previewImage,
      previewImageDataUrl: frames.previewImageDataUrl,
      sourceImage: frames.sourceImage,
      capturedAt: Date.now()
    };
  }

  public async resolve(display: Display): Promise<LiteSnapResolvedCaptureFrames | null> {
    const cached = this.getCached(display);
    if (cached?.sourceImage && !cached.sourceImage.isEmpty()) {
      return { ...cached, sourceImage: cached.sourceImage, fromCache: true };
    }
    if (cached) {
      const sourceImage = await captureSourceImageWithFallback(this.provider, display);
      return sourceImage && !sourceImage.isEmpty()
        ? { previewImage: cached.previewImage, previewImageDataUrl: cached.previewImageDataUrl, sourceImage, fromCache: false }
        : null;
    }
    const frames = await captureDisplayFramesWithFallback(this.provider, display);
    if (!frames) return null;
    await new Promise<void>((resolve) => setImmediate(resolve));
    return {
      previewImage: frames.previewImage,
      previewImageDataUrl: this.encodePreviewDataUrl(frames.previewImage),
      sourceImage: frames.sourceImage,
      fromCache: false
    };
  }

  private getCached(display: Display): DisplayFrameCache | null {
    const cache = this.frameCache;
    if (
      !cache || cache.displayId !== display.id || cache.scaleFactor !== display.scaleFactor ||
      Date.now() - cache.capturedAt > FRAME_CACHE_TTL_MS
    ) return null;
    return cache;
  }

  private scheduleWarm(display: Display, task: () => Promise<void>): void {
    if (this.warmPromise && this.warmDisplayId === display.id) return;
    const generation = this.warmGeneration;
    this.warmDisplayId = display.id;
    this.warmPromise = task().finally(() => {
      if (this.warmGeneration === generation) this.warmPromise = null;
    });
  }

  private async captureAndStoreFrames(display: Display): Promise<void> {
    const generation = this.warmGeneration;
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (generation !== this.warmGeneration) return;
    const frames = await this.provider.captureDisplayFrames(display);
    if (!frames || frames.previewImage.isEmpty() || frames.sourceImage.isEmpty()) return;
    this.frameCache = {
      displayId: display.id,
      scaleFactor: display.scaleFactor,
      previewImage: frames.previewImage,
      previewImageDataUrl: this.encodePreviewDataUrl(frames.previewImage),
      sourceImage: frames.sourceImage,
      capturedAt: Date.now()
    };
  }

  private async captureAndStorePreview(display: Display): Promise<void> {
    const generation = this.warmGeneration;
    await new Promise<void>((resolve) => setImmediate(resolve));
    if (generation !== this.warmGeneration) return;
    const previewImage = await this.provider.capturePreviewImage(display);
    if (!previewImage || previewImage.isEmpty()) return;
    this.frameCache = {
      displayId: display.id,
      scaleFactor: display.scaleFactor,
      previewImage,
      previewImageDataUrl: this.encodePreviewDataUrl(previewImage),
      sourceImage: null,
      capturedAt: Date.now()
    };
  }
}
