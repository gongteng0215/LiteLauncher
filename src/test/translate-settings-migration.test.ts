import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { LiteDatabase } from "../main/database";
import { TranslateSettingsStore } from "../main/translate/settings";

async function withTempDatabase(
  runner: (db: LiteDatabase) => Promise<void>
): Promise<void> {
  const tempDir = path.join(os.tmpdir(), `litelauncher-translate-${randomUUID()}`);
  fs.mkdirSync(tempDir, { recursive: true });
  const dbPath = path.join(tempDir, "translate-settings-test.db");
  const db = new LiteDatabase(dbPath);
  await db.init();

  try {
    await runner(db);
  } finally {
    await db.close().catch(() => undefined);
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

test("TranslateSettingsStore migrates legacy LiteSnap Baidu credentials on first read", async () => {
  await withTempDatabase(async (db) => {
    await db.setSetting(
      "litesnapSettings",
      JSON.stringify({
        screenshotShortcut: "F1",
        translateBaiduAppId: "legacy-app",
        translateBaiduSecret: "legacy-secret",
        translateBaiduEngine: "llm",
        translateBaiduApiKey: "legacy-key"
      })
    );

    const store = new TranslateSettingsStore(db);
    const settings = await store.getSettings();

    assert.equal(settings.baiduAppId, "legacy-app");
    assert.equal(settings.baiduSecret, "legacy-secret");
    assert.equal(settings.baiduEngine, "llm");
    assert.equal(settings.baiduApiKey, "legacy-key");

    const persisted = await db.getSetting("translateToolSettings");
    assert.ok(persisted);
    const parsed = JSON.parse(persisted) as {
      baiduAppId: string;
      baiduSecret: string;
      baiduEngine: string;
      baiduApiKey: string;
    };
    assert.equal(parsed.baiduAppId, "legacy-app");
    assert.equal(parsed.baiduSecret, "legacy-secret");
    assert.equal(parsed.baiduEngine, "llm");
    assert.equal(parsed.baiduApiKey, "legacy-key");
  });
});

test("TranslateSettingsStore uses defaults when no legacy translate fields exist", async () => {
  await withTempDatabase(async (db) => {
    await db.setSetting(
      "litesnapSettings",
      JSON.stringify({
        screenshotShortcut: "F1",
        pinShortcut: "F3"
      })
    );

    const store = new TranslateSettingsStore(db);
    const settings = await store.getSettings();

    assert.equal(settings.baiduAppId, "");
    assert.equal(settings.baiduSecret, "");
    assert.equal(settings.baiduEngine, "standard");
    assert.equal(settings.baiduApiKey, "");
  });
});
