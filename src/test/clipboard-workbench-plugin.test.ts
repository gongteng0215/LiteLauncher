import assert from "node:assert/strict";
import test from "node:test";

import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import { executePluginCommand } from "../main/plugins";
import { setClipboardWorkbenchServiceForTest } from "../main/plugins/clipboard-workbench";
import type { ClipboardWorkbenchActionInput } from "../main/plugins/clipboard-workbench";

type SentMessage = {
  channel: string;
  payload: unknown;
};

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:clipboard-workbench:test",
    type: "command",
    title: "Clipboard Workbench test",
    subtitle: "plugin contract test",
    target: "command:plugin:clipboard-workbench",
    keywords: ["clipboard", "workbench", "test"]
  };
}

function createMockWindow(): {
  window: { webContents: { send: (channel: string, payload: unknown) => void } };
  sent: SentMessage[];
} {
  const sent: SentMessage[] = [];
  return {
    window: {
      webContents: {
        send(channel: string, payload: unknown): void {
          sent.push({ channel, payload });
        }
      }
    },
    sent
  };
}

test("Clipboard Workbench open sends plugin panel payload", async () => {
  const actions: ClipboardWorkbenchActionInput[] = [];
  setClipboardWorkbenchServiceForTest({
    async perform(action) {
      actions.push(action);
      return {
        message: "Opened Clipboard Workbench",
        payload: {
          items: [],
          groups: [],
          settings: {
            version: 1,
            autoCollect: true,
            sensitiveMode: false,
            maxItems: 50,
            maxBytes: 512 * 1024 * 1024,
            ignoreShortCodes: true,
            shortCodeLengthMax: 8,
            ignoredAppHints: [],
            batchPasteDelayMs: 180
          },
          stats: {
            totalItems: 0,
            totalBytes: 0
          },
          query: {
            search: "",
            scope: "all",
            groupId: ""
          }
        }
      };
    }
  });

  try {
    const { window, sent } = createMockWindow();
    const result = await executePluginCommand(
      "clipboard-workbench",
      window as never,
      createSelectedItem()
    );

    assert.equal(actions.length, 1);
    assert.equal(actions[0]?.type, "open");
    assert.equal(result.ok, true);
    assert.equal(result.keepOpen, true);
    assert.equal(sent.length, 1);
    assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);

    const payload = sent[0]?.payload as
      | {
          panel?: string;
          pluginId?: string;
          title?: string;
          subtitle?: string;
          data?: { settings?: { maxItems?: number } };
        }
      | undefined;
    assert.equal(payload?.panel, "plugin");
    assert.equal(payload?.pluginId, "clipboard-workbench");
    assert.equal(payload?.title, "剪贴板工作台");
    assert.equal(payload?.subtitle, "集中采集、整理和回放文本、图片、截图与文件列表");
    assert.equal(payload?.data?.settings?.maxItems, 50);
  } finally {
    setClipboardWorkbenchServiceForTest(null);
  }
});
