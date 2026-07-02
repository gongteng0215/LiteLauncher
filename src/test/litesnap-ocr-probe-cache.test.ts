import assert from "node:assert/strict";
import test from "node:test";

import type { LiteSnapOcrProbeCache } from "../shared/litesnap-ocr-help";
import {
  clearLiteSnapOcrProbeCache,
  getLiteSnapOcrProbeCache,
  setLiteSnapOcrProbeCache
} from "../main/litesnap/ocr-probe-cache";
import { LiteDatabase } from "../main/database";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function createTempDatabase(): Promise<LiteDatabase> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "litelauncher-ocr-cache-"));
  const db = new LiteDatabase(path.join(dir, "launcher.db"));
  return db.init().then(() => db);
}

const readyCache: LiteSnapOcrProbeCache = {
  ready: true,
  summary: "OCR 检测通过，可以正常使用截图文字识别。",
  probeState: {
    ok: true,
    moduleLoaded: true,
    chineseReady: true,
    englishReady: true
  },
  capabilities: [
    {
      languageTag: "zh-CN",
      capabilityName: "Language.OCR~~~zh-CN~0.0.1.0",
      state: "Installed",
      installed: true
    },
    {
      languageTag: "en-US",
      capabilityName: "Language.OCR~~~en-US~0.0.1.0",
      state: "Installed",
      installed: true
    }
  ],
  checkedAt: Date.now()
};

test("OCR probe cache persists and reloads ready state", async () => {
  const db = await createTempDatabase();
  await setLiteSnapOcrProbeCache(db, readyCache);
  const loaded = await getLiteSnapOcrProbeCache(db);
  assert.ok(loaded);
  assert.equal(loaded?.ready, true);
  assert.match(loaded?.summary ?? "", /OCR 检测通过/);
  assert.equal(loaded?.probeState.chineseReady, true);
  assert.equal(loaded?.probeState.englishReady, true);
});

test("OCR probe cache rejects incomplete ready payloads", async () => {
  const db = await createTempDatabase();
  await setLiteSnapOcrProbeCache(db, {
    ...readyCache,
    probeState: {
      ...readyCache.probeState,
      englishReady: false
    }
  });
  const loaded = await getLiteSnapOcrProbeCache(db);
  assert.equal(loaded, null);
});

test("OCR probe cache can be cleared", async () => {
  const db = await createTempDatabase();
  await setLiteSnapOcrProbeCache(db, readyCache);
  await clearLiteSnapOcrProbeCache(db);
  const loaded = await getLiteSnapOcrProbeCache(db);
  assert.equal(loaded, null);
});
