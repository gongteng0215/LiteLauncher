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
