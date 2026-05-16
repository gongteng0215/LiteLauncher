import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ClipboardWorkbenchStore } from "../main/plugins/clipboard-workbench/store";

async function withTempStore(
  runner: (store: ClipboardWorkbenchStore, root: string) => Promise<void>
): Promise<void> {
  const root = path.join(
    os.tmpdir(),
    `litelauncher-clipboard-workbench-${randomUUID()}`
  );
  await fs.mkdir(root, { recursive: true });
  const store = new ClipboardWorkbenchStore(
    path.join(root, "litelauncher.db"),
    path.join(root, "assets")
  );
  await store.init();

  try {
    await runner(store, root);
  } finally {
    await store.close().catch(() => undefined);
    await fs.rm(root, { recursive: true, force: true }).catch(() => undefined);
  }
}

test("store upserts by hash and removes asset files on delete", async () => {
  await withTempStore(async (store, root) => {
    const first = await store.saveItem({
      kind: "image",
      source: "manual",
      summary: "shot-1.png",
      hash: "hash-image-1",
      mimeType: "image/png",
      byteSize: 8,
      assetFileName: "shot-1.png",
      assetBytes: Buffer.from("first-image")
    });

    assert.ok(first.assetPath);
    await fs.access(path.join(root, "assets", first.assetPath));

    const second = await store.saveItem({
      kind: "image",
      source: "manual",
      summary: "shot-2.png",
      hash: "hash-image-1",
      mimeType: "image/png",
      byteSize: 9,
      assetFileName: "shot-2.png",
      assetBytes: Buffer.from("second-img")
    });

    assert.equal(second.id, first.id);
    assert.notEqual(second.assetPath, first.assetPath);
    await assert.rejects(
      fs.access(path.join(root, "assets", first.assetPath ?? "")),
      /ENOENT/
    );
    await fs.access(path.join(root, "assets", second.assetPath ?? ""));

    const items = await store.listItems();
    assert.equal(items.length, 1);
    assert.equal(items[0]?.summary, "shot-2.png");
    assert.equal(items[0]?.assetPath, second.assetPath ?? null);

    const deleted = await store.deleteItems([second.id]);
    assert.equal(deleted, 1);
    await assert.rejects(
      fs.access(path.join(root, "assets", second.assetPath ?? "")),
      /ENOENT/
    );
    assert.deepEqual(await store.listItems(), []);
  });
});

test("store reads default settings and persists updates in the shared settings table", async () => {
  await withTempStore(async (store) => {
    const defaults = await store.getSettings();
    assert.equal(defaults.maxItems, 50);
    assert.equal(defaults.sensitiveMode, false);

    await store.saveSettings({
      ...defaults,
      autoCollect: false,
      sensitiveMode: true,
      maxItems: 24
    });

    const next = await store.getSettings();
    assert.equal(next.autoCollect, false);
    assert.equal(next.sensitiveMode, true);
    assert.equal(next.maxItems, 24);
  });
});
