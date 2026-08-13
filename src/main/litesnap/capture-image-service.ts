import { nativeImage, type Display, type NativeImage } from "electron";
import type {
  LiteSnapCommitCaptureInput,
  LiteSnapOverlaySelection
} from "../../shared/litesnap";
import type {
  LiteSnapCaptureSession,
  LiteSnapCaptureSessionWithImage
} from "./capture-session-types";

export class LiteSnapCaptureImageService {
  public normalizeSelection(
    selection: LiteSnapOverlaySelection,
    display: Display
  ): LiteSnapOverlaySelection | null {
    const x = Math.max(0, Math.round(selection.x));
    const y = Math.max(0, Math.round(selection.y));
    const width = Math.min(display.bounds.width - x, Math.round(selection.width));
    const height = Math.min(display.bounds.height - y, Math.round(selection.height));
    return width >= 24 && height >= 24 ? { x, y, width, height } : null;
  }

  public createE2ELongCaptureFrame(
    width: number,
    height: number,
    frameIndex: number
  ): NativeImage | null {
    if (width <= 0 || height <= 0) return null;
    const data = Buffer.allocUnsafe(width * height * 4);
    const edge = Math.round(height * 0.12);
    const contentHeight = Math.max(1, height - edge * 2);
    const step = Math.max(1, Math.round(height * 0.7));
    const offset = frameIndex * step;
    const bottomMarkerStart = 6 * step + Math.max(0, contentHeight - 10);
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const index = (y * width + x) * 4;
        const contentRow = offset + y - edge;
        const topMarker = y >= edge && contentRow >= 4 && contentRow <= 8;
        const bottomMarker = y < height - edge && contentRow >= bottomMarkerStart && contentRow <= bottomMarkerStart + 4;
        const value = y < edge ? 245 : y >= height - edge ? 12 : (contentRow * 37 + x * 17) % 251;
        data[index] = topMarker ? 255 : bottomMarker ? 0 : value;
        data[index + 1] = topMarker ? 0 : bottomMarker ? 255 : (value * 3) % 255;
        data[index + 2] = topMarker || bottomMarker ? 255 : (value * 7) % 255;
        data[index + 3] = 255;
      }
    }
    const image = nativeImage.createFromBitmap(data, { width, height });
    return image.isEmpty() ? null : image;
  }

  public ensureSourceDataUrl(session: LiteSnapCaptureSession | null): string | null {
    if (!session?.sourceImage || session.sourceImage.isEmpty()) return null;
    if (!session.sourceImageDataUrl) session.sourceImageDataUrl = session.sourceImage.toDataURL();
    return session.sourceImageDataUrl;
  }

  public resolveCommitImage(
    session: LiteSnapCaptureSessionWithImage,
    input: LiteSnapCommitCaptureInput
  ): NativeImage | null {
    const buffer = this.resolveCompositedBuffer(input);
    if (buffer) {
      const composited = nativeImage.createFromBuffer(buffer);
      if (!composited.isEmpty()) return composited;
    }
    if (typeof input.imageDataUrl === "string" && input.imageDataUrl.startsWith("data:image/")) {
      const composited = nativeImage.createFromDataURL(input.imageDataUrl);
      if (!composited.isEmpty()) return composited;
    }
    if (session.longCaptureExportWidth) return session.sourceImage;
    return this.cropSelection(session, input.selection);
  }

  public normalizeLongCaptureExportSize(
    session: LiteSnapCaptureSession,
    image: NativeImage
  ): NativeImage {
    const targetWidth = session.longCaptureExportWidth;
    const size = image.getSize();
    if (!targetWidth || size.width <= 0 || size.height <= 0 || Math.abs(size.width - targetWidth) <= 1) {
      return image;
    }
    const resized = image.resize({
      width: targetWidth,
      height: Math.max(1, Math.round((size.height * targetWidth) / size.width)),
      quality: "best"
    });
    return resized.isEmpty() ? image : resized;
  }

  public cropImageForSelection(
    image: NativeImage,
    display: Display,
    selection: LiteSnapOverlaySelection
  ): NativeImage | null {
    const size = image.getSize();
    const ratioX = size.width / Math.max(1, display.bounds.width);
    const ratioY = size.height / Math.max(1, display.bounds.height);
    const x = Math.max(0, Math.floor(selection.x * ratioX));
    const y = Math.max(0, Math.floor(selection.y * ratioY));
    const width = Math.max(1, Math.round(selection.width * ratioX));
    const height = Math.max(1, Math.round(selection.height * ratioY));
    if (x + width > size.width || y + height > size.height) return null;
    return image.crop({ x, y, width, height });
  }

  public cropSelection(
    session: LiteSnapCaptureSessionWithImage,
    selection: LiteSnapOverlaySelection
  ): NativeImage | null {
    const { sourceImage, display } = session;
    const size = sourceImage.getSize();
    const ratioX = size.width / Math.max(1, display.bounds.width);
    const ratioY = size.height / Math.max(1, display.bounds.height);
    const left = Math.max(0, Math.floor(selection.x * ratioX));
    const top = Math.max(0, Math.floor(selection.y * ratioY));
    const right = Math.min(size.width, left + Math.max(1, Math.round(selection.width * ratioX)));
    const bottom = Math.min(size.height, top + Math.max(1, Math.round(selection.height * ratioY)));
    return right > left && bottom > top
      ? sourceImage.crop({ x: left, y: top, width: right - left, height: bottom - top })
      : null;
  }

  private resolveCompositedBuffer(input: LiteSnapCommitCaptureInput): Buffer | null {
    const { imagePngBuffer } = input;
    if (imagePngBuffer instanceof ArrayBuffer && imagePngBuffer.byteLength > 0) {
      return Buffer.from(imagePngBuffer);
    }
    if (ArrayBuffer.isView(imagePngBuffer) && imagePngBuffer.byteLength > 0) {
      return Buffer.from(imagePngBuffer.buffer, imagePngBuffer.byteOffset, imagePngBuffer.byteLength);
    }
    return null;
  }
}
