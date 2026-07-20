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

    assert.match(result.message, /^已保存手动文本：alpha$/);
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

test("auto text collection notifies legacy clipboard history bridge", async () => {
  let mirroredText = "";

  const service = await ClipboardWorkbenchService.createForTest(
    {
      readText: () => "auto mirrored text",
      readBuffer: () => Buffer.alloc(0)
    },
    {
      onAutoTextCollected: (text) => {
        mirroredText = text;
      }
    }
  );

  try {
    const collected = await service.collectNow();
    assert.equal(collected, true);
    await service.close();
    assert.equal(mirroredText, "auto mirrored text");
  } finally {
    await service.close().catch(() => undefined);
  }
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
      assert.match(result.message, /已恢复到剪贴板，请手动使用 Ctrl\+V 粘贴。/);
    }
  );
});

test("auto image collection skips full encode when clipboard fingerprint is unchanged", async () => {
  const pngPixel = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIW2NgYGD4DwABBAEAX+XDSQAAAABJRU5ErkJggg==",
    "base64"
  );
  const thumbJpeg = Buffer.from("thumb-fingerprint");
  let toPngCalls = 0;
  let thumbCalls = 0;

  await withTestService(
    {
      readImage: () => ({
        isEmpty: () => false,
        toPNG: () => {
          toPngCalls += 1;
          return pngPixel;
        },
        getSize: () => ({ width: 1920, height: 1080 }),
        resize: () => ({
          isEmpty: () => false,
          toPNG: () => pngPixel,
          getSize: () => ({ width: 48, height: 48 }),
          toJPEG: () => {
            thumbCalls += 1;
            return thumbJpeg;
          }
        })
      }),
      readBuffer: () => Buffer.alloc(0),
      readText: () => ""
    },
    async (service) => {
      assert.equal(await service.collectNow(), true);
      assert.equal(toPngCalls, 1);
      assert.ok(thumbCalls >= 1);
      const thumbsAfterSave = thumbCalls;

      assert.equal(await service.collectNow(), false);
      assert.equal(await service.collectNow(), false);
      // Unchanged clipboard should probe via thumbnail only, never re-encode PNG.
      assert.equal(toPngCalls, 1);
      assert.ok(thumbCalls > thumbsAfterSave);
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
