import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { LiteDatabase } from "../main/database";
import {
  __webtoolsCronStoreTestUtils,
  initWebtoolsCronStore,
  WebtoolsCronTemplateStore
} from "../main/plugins/webtools-cron/store";
import { CRON_DEFAULT_TEMPLATES } from "../shared/webtools-cron";

async function createStore(): Promise<{
  store: WebtoolsCronTemplateStore;
  cleanup: () => Promise<void>;
}> {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "litelauncher-cron-store-"));
  const dbPath = path.join(dir, "test.db");
  const db = new LiteDatabase(dbPath);
  await db.init();
  initWebtoolsCronStore(db);
  const store = new WebtoolsCronTemplateStore(db);
  return {
    store,
    cleanup: async () => {
      await db.close().catch(() => undefined);
      fs.rmSync(dir, { recursive: true, force: true });
    }
  };
}

test("empty database seeds default cron templates", async () => {
  const { store, cleanup } = await createStore();
  try {
    const templates = await store.getTemplates();
    assert.equal(templates.length, CRON_DEFAULT_TEMPLATES.length);
    assert.equal(templates[0]?.key, "weekday-9am");
    assert.equal(templates[0]?.expression, "0 9 * * 1-5");
  } finally {
    await cleanup();
  }
});

test("update preset template persists edited summary and expression", async () => {
  const { store, cleanup } = await createStore();
  try {
    await store.updateTemplate({
      key: "weekday-9am",
      summary: "早会提醒",
      expression: "30 8 * * 1-5"
    });
    const templates = await store.getTemplates();
    const updated = templates.find((item) => item.key === "weekday-9am");
    assert.ok(updated);
    assert.equal(updated.summary, "早会提醒");
    assert.equal(updated.expression, "30 8 * * 1-5");
  } finally {
    await cleanup();
  }
});

test("save and delete custom templates", async () => {
  const { store, cleanup } = await createStore();
  try {
    const saved = await store.saveTemplate({
      summary: "每 15 分钟",
      expression: "*/15 * * * *"
    });
    const created = saved.find((item) => item.summary === "每 15 分钟");
    assert.ok(created);
    assert.match(created.key, /^user-/);

    const afterDelete = await store.deleteTemplate(created.key);
    assert.equal(
      afterDelete.some((item) => item.key === created.key),
      false
    );
  } finally {
    await cleanup();
  }
});

test("reset templates restores the default five presets", async () => {
  const { store, cleanup } = await createStore();
  try {
    await store.saveTemplate({
      summary: "临时模板",
      expression: "0 1 * * *"
    });
    await store.deleteTemplate("every-minute");
    const reset = await store.resetTemplates();
    assert.equal(reset.length, CRON_DEFAULT_TEMPLATES.length);
    assert.deepEqual(
      reset.map((item) => item.key),
      CRON_DEFAULT_TEMPLATES.map((item) => item.key)
    );
  } finally {
    await cleanup();
  }
});

test("normalizeTemplates drops invalid entries and enforces max count", () => {
  const { normalizeTemplates } = __webtoolsCronStoreTestUtils;
  const normalized = normalizeTemplates([
    { key: "a", summary: "A", expression: "0 0 * * *" },
    { key: "", summary: "bad", expression: "0 0 * * *" },
    { key: "b", summary: "B", expression: "0 1 * * *" },
    { key: "a", summary: "dup", expression: "0 2 * * *" }
  ]);
  assert.equal(normalized.length, 2);
  assert.equal(normalized[0]?.key, "a");
  assert.equal(normalized[1]?.key, "b");
});
