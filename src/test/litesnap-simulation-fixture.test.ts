import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import test from "node:test";
import { matchLiteSnapVerticalFramesBidirectional, prepareLiteSnapStitchFrame } from "../shared/litesnap-stitch";

test("synthetic scrolling frames have an unambiguous seam at different DPI heights", () => {
  const exports: any = {};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, "../main/litesnap/capture-image-service.js"), "utf8"), {
    exports, Buffer,
    require: () => ({ nativeImage: { createFromBitmap: (data: Buffer, size: { width: number; height: number }) => ({
      ...size, data, isEmpty: () => false
    }) } })
  });
  const service = new exports.LiteSnapCaptureImageService();
  for (const height of [240, 300, 360, 450, 600]) {
    let previous = prepareLiteSnapStitchFrame(service.createE2ELongCaptureFrame(320, height, 0));
    for (let index = 1; index <= 6; index++) {
      const next = prepareLiteSnapStitchFrame(service.createE2ELongCaptureFrame(320, height, index));
      const match = matchLiteSnapVerticalFramesBidirectional(previous, next, "down");
      assert.equal(match.confident, true, JSON.stringify({ height, index, match }));
      assert.equal(match.appendedHeight, Math.round(height * 0.7));
      previous = next;
    }
  }
});
