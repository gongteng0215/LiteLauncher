import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { NativeCaptureWorker } from "../main/litesnap/native-capture-worker";

test("native capture returns pixels and keeps cancellation timers responsive during a blocked call", async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "litesnap-worker-"));
  const fixture = path.join(directory, "addon.cjs");
  fs.writeFileSync(fixture, `
    exports.pixels = () => ({ data: Buffer.from([1, 2, 3, 4]), width: 1, height: 1 });
    exports.block = () => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 2000);
    exports.fail = () => { throw new Error('capture failed'); };
  `);
  try {
    const worker = new NativeCaptureWorker(fixture, 500);
    const image = await worker.call<{ data: Uint8Array }>("pixels");
    assert.deepEqual(Buffer.from(image.data), Buffer.from([1, 2, 3, 4]));
    await assert.rejects(worker.call("fail"), /capture failed/);
    let cancelled = false;
    const timer = setTimeout(() => { cancelled = true; }, 20);
    await assert.rejects(worker.call("block"), /timed out/);
    clearTimeout(timer);
    assert.equal(cancelled, true, "main event loop must remain available for cancellation");
    await assert.rejects(worker.call("pixels"), /unavailable/, "do not spawn more workers after a native hang");
  } finally {
    fs.rmSync(directory, { recursive: true });
  }
});
