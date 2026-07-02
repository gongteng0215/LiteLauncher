import assert from "node:assert/strict";
import test from "node:test";

import type { LiteSnapCaptureProvider } from "../main/litesnap/capture-provider";
import { probeLiteSnapOcr } from "../main/litesnap/ocr-probe";

function createProvider(
  supportsTextRecognition: boolean
): LiteSnapCaptureProvider {
  return {
    capturePreviewImage: async () => null,
    captureSourceImage: async () => null,
    captureDisplayFrames: async () => null,
    getWindowRectAtPoint: async () => null,
    recognizeText: async () => null,
    supportsTextRecognition: () => supportsTextRecognition
  };
}

test("probeLiteSnapOcr reports module_missing when recognizeText is unavailable", () => {
  const originalPlatform = process.platform;
  Object.defineProperty(process, "platform", { value: "win32" });

  try {
    const result = probeLiteSnapOcr(createProvider(false));
    assert.equal(result.ok, false);
    assert.equal(result.ocrIssue, "module_missing");
    assert.equal(result.moduleLoaded, false);
    assert.match(result.message, /OCR 模块：未加载/);
  } finally {
    Object.defineProperty(process, "platform", { value: originalPlatform });
  }
});
