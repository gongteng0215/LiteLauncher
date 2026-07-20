import path from "node:path";

import {
  ClipboardWorkbenchSettings,
  decodeClipboardWorkbenchFileNameW,
  normalizeClipboardWorkbenchText,
  shouldIgnoreClipboardWorkbenchText
} from "../../../shared/clipboard-workbench";
import { ClipboardWorkbenchStoredInput } from "./store";

export interface ClipboardWorkbenchImageLike {
  isEmpty(): boolean;
  toPNG(): Buffer;
  getSize(): { width: number; height: number };
  /** Electron NativeImage; optional so unit-test doubles stay simple. */
  resize?(options: { width: number; height: number }): ClipboardWorkbenchImageLike;
  toJPEG?(quality: number): Buffer;
}

export interface ClipboardWorkbenchCollectorRuntime {
  readText(): string;
  readImage(): ClipboardWorkbenchImageLike;
  readBuffer(format: string): Buffer;
  hash(value: string | Buffer): string;
  isLikelyScreenshot?(): boolean;
}

export type ClipboardWorkbenchCollectedInput = ClipboardWorkbenchStoredInput;

export function createEmptyClipboardWorkbenchImage(): ClipboardWorkbenchImageLike {
  return {
    isEmpty: () => true,
    toPNG: () => Buffer.alloc(0),
    getSize: () => ({ width: 0, height: 0 })
  };
}

/**
 * Cheap clipboard fingerprint for auto-collect polling.
 * Avoids full-resolution PNG encode on every timer tick when an image sits
 * on the clipboard (a common source of whole-app main-process lag).
 */
export function probeClipboardFingerprint(
  runtime: ClipboardWorkbenchCollectorRuntime,
  settings: ClipboardWorkbenchSettings
): string | null {
  const fileBuffer = runtime.readBuffer("FileNameW");
  const filePaths = decodeClipboardWorkbenchFileNameW(fileBuffer);
  if (filePaths.length > 0) {
    return `files:${runtime.hash(filePaths.join("\n"))}`;
  }

  const image = runtime.readImage();
  if (!image.isEmpty()) {
    const size = image.getSize();
    if (
      typeof image.resize === "function" &&
      (typeof image.toJPEG === "function" || typeof image.toPNG === "function")
    ) {
      try {
        const thumb = image.resize({ width: 48, height: 48 });
        const bytes =
          typeof thumb.toJPEG === "function" ? thumb.toJPEG(35) : thumb.toPNG();
        return `image:${size.width}x${size.height}:${runtime.hash(bytes)}`;
      } catch {
        // Fall through to the tiny full-encode path used by tests.
      }
    }
    return `image:${size.width}x${size.height}:${runtime.hash(image.toPNG())}`;
  }

  const text = normalizeClipboardWorkbenchText(runtime.readText());
  if (!text || shouldIgnoreClipboardWorkbenchText(text, settings)) {
    return null;
  }
  return `text:${runtime.hash(text)}`;
}

export function collectClipboardWorkbenchSnapshot(
  runtime: ClipboardWorkbenchCollectorRuntime,
  settings: ClipboardWorkbenchSettings
): ClipboardWorkbenchCollectedInput | null {
  const fileBuffer = runtime.readBuffer("FileNameW");
  const filePaths = decodeClipboardWorkbenchFileNameW(fileBuffer);
  if (filePaths.length > 0) {
    const summary = path.basename(filePaths[0] ?? "files");
    const joined = filePaths.join("\n");
    return {
      kind: "files",
      source: "auto",
      summary,
      fileListJson: JSON.stringify(filePaths),
      byteSize: Buffer.byteLength(joined, "utf8"),
      hash: runtime.hash(`files:${joined}`)
    };
  }

  const image = runtime.readImage();
  if (!image.isEmpty()) {
    const pngBytes = image.toPNG();
    const size = image.getSize();
    return {
      kind: "image",
      source: runtime.isLikelyScreenshot?.() ? "screenshot" : "auto",
      summary: `Image ${size.width}x${size.height}`,
      mimeType: "image/png",
      assetBytes: pngBytes,
      assetFileName: "clipboard.png",
      width: size.width,
      height: size.height,
      byteSize: pngBytes.length,
      hash: runtime.hash(pngBytes)
    };
  }

  const text = normalizeClipboardWorkbenchText(runtime.readText());
  if (!text || shouldIgnoreClipboardWorkbenchText(text, settings)) {
    return null;
  }

  return {
    kind: "text",
    source: "auto",
    summary: text.split("\n")[0] ?? text,
    textContent: text,
    byteSize: Buffer.byteLength(text, "utf8"),
    hash: runtime.hash(`text:${text}`)
  };
}
