import assert from "node:assert/strict";
import test from "node:test";

import {
  ClipboardWorkbenchRuntime,
  ClipboardWorkbenchService
} from "../main/plugins/clipboard-workbench/service";

async function withTestService(
  overrides: Partial<ClipboardWorkbenchRuntime>,
  runner: (service: ClipboardWorkbenchService) => Promise<void>
): Promise<void> {
  const service = await ClipboardWorkbenchService.createForTest(overrides);
  try {
    await runner(service);
  } finally {
    await service.close();
  }
}

test("manual text save returns a refreshed payload", async () => {
  await withTestService({}, async (service) => {
    const result = await service.saveManualText("alpha\nbeta");

    assert.equal(result.payload.items[0]?.summary, "alpha");
    assert.equal(result.payload.items[0]?.source, "manual");
    assert.equal(result.payload.settings.maxItems, 50);
  });
});

test("sensitive mode pauses auto collection but keeps manual save available", async () => {
  await withTestService(
    {
      readText: () => "auto captured text"
    },
    async (service) => {
      const toggled = await service.setSensitiveMode(true);
      assert.equal(toggled.payload.settings.sensitiveMode, true);

      const collected = await service.collectNow();
      assert.equal(collected, false);
      assert.equal((await service.refresh()).payload.items.length, 0);

      const manualResult = await service.saveManualText("manual-only");
      assert.equal(manualResult.payload.items.length, 1);
      assert.equal(manualResult.payload.settings.sensitiveMode, true);
    }
  );
});

test("sequential paste falls back to restore-only message when send shortcut fails", async () => {
  await withTestService(
    {
      sendPasteShortcut: async () => ({ ok: false, mode: "restore-only" })
    },
    async (service) => {
      const saved = await service.saveManualText("alpha");
      const first = saved.payload.items[0];
      assert.ok(first);

      const result = await service.pasteItems([first.id], "sequential");
      assert.match(result.message, /restored to the clipboard/i);
    }
  );
});

test("image items expose a preview file url in refreshed payloads", async () => {
  const pngPixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAX+XDSQAAAABJRU5ErkJggg==",
    "base64"
  );

  await withTestService(
    {
      readImage: () => ({
        isEmpty: () => false,
        toPNG: () => pngPixel,
        getSize: () => ({ width: 1, height: 1 })
      }),
      readBuffer: () => Buffer.alloc(0),
      readText: () => ""
    },
    async (service) => {
      const saved = await service.saveCurrentClipboard();
      const first = saved.payload.items[0];
      assert.ok(first);
      assert.equal(first.kind, "image");
      assert.match(first.assetUrl ?? "", /^file:\/\//);
    }
  );
});
