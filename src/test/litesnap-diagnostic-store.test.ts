import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { LiteDatabase } from "../main/database";
import { LiteSnapDiagnosticStore } from "../main/litesnap/diagnostic-store";

async function createStore(): Promise<LiteSnapDiagnosticStore> {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "litelauncher-litesnap-diagnostics-"));
  const database = new LiteDatabase(path.join(directory, "launcher.db"));
  await database.init();
  return new LiteSnapDiagnosticStore(database);
}

test("LiteSnap diagnostics retains only the most recent twenty anonymous entries", async () => {
  const store = await createStore();
  for (let index = 0; index < 22; index += 1) {
    await store.record({
      operation: index % 2 === 0 ? "capture" : "ocr",
      status: "success",
      startedAt: Date.now() - index,
      message: `capture ${index}`,
      metrics: { index, width: 1200, height: 800 }
    });
  }

  const entries = await store.list();
  assert.equal(entries.length, 20);
  assert.ok(entries.every((entry) => entry.operation === "capture" || entry.operation === "ocr"));
});

test("LiteSnap diagnostics strips image, OCR and path-bearing values", async () => {
  const store = await createStore();
  await store.record({
    operation: "long-capture",
    status: "failed",
    startedAt: Date.now(),
    message: "failed at C:\\Users\\example\\Pictures\\capture.png",
    metrics: {
      frames: 3,
      filePath: "C:\\Users\\example\\Pictures\\capture.png",
      imageData: "data:image/png;base64,secret",
      ocrText: "private text",
      capturePath: "windows-native"
    }
  });

  const [entry] = await store.list();
  assert.ok(entry);
  assert.equal(entry.metrics.frames, 3);
  assert.equal(entry.metrics.capturePath, "windows-native");
  assert.equal("filePath" in entry.metrics, false);
  assert.equal("imageData" in entry.metrics, false);
  assert.equal("ocrText" in entry.metrics, false);
  assert.doesNotMatch(entry.message, /Users|capture\.png/);
});

test("LiteSnap diagnostics can be cleared", async () => {
  const store = await createStore();
  await store.record({
    operation: "history-edit",
    status: "cancelled",
    startedAt: Date.now(),
    message: "cancelled"
  });
  assert.equal(await store.clear(), 1);
  assert.deepEqual(await store.list(), []);
});
