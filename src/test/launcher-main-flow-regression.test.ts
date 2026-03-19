import assert from "node:assert/strict";
import test from "node:test";

import { DEFAULT_CATALOG_SCAN_CONFIG } from "../shared/settings";
import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import { executeItem } from "../main/actions";
import { buildCatalogWithOptions } from "../main/catalog";
import {
  getVisiblePluginIds,
  setVisiblePluginIds
} from "../main/plugins";
import { searchItems } from "../main/search";
import { UsageStore } from "../main/usage-store";

type SentMessage = {
  channel: string;
  payload: unknown;
};

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

function withTemporaryEnv(
  overrides: Partial<Record<"APPDATA" | "PROGRAMDATA" | "LOCALAPPDATA", string>>,
  fn: () => void
): void {
  const previous: Record<string, string | undefined> = {
    APPDATA: process.env.APPDATA,
    PROGRAMDATA: process.env.PROGRAMDATA,
    LOCALAPPDATA: process.env.LOCALAPPDATA
  };

  try {
    for (const [key, value] of Object.entries(overrides)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
    fn();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

function buildCatalogForRegression(): LaunchItem[] {
  let catalog: LaunchItem[] = [];
  withTemporaryEnv(
    {
      APPDATA: "Z:\\LiteLauncherTest\\NoAppData",
      PROGRAMDATA: "Z:\\LiteLauncherTest\\NoProgramData",
      LOCALAPPDATA: "Z:\\LiteLauncherTest\\NoLocalAppData"
    },
    () => {
      catalog = buildCatalogWithOptions({
        ...DEFAULT_CATALOG_SCAN_CONFIG,
        scanProgramFiles: false,
        customScanDirs: [],
        excludeScanDirs: [],
        resultIncludeDirs: [],
        resultExcludeDirs: []
      });
    }
  );
  return catalog;
}

function findTarget(items: LaunchItem[], prefix: string): LaunchItem | undefined {
  const normalized = prefix.trim().toLowerCase();
  return items.find((item) => item.target.trim().toLowerCase().startsWith(normalized));
}

test(
  "main launcher flow keeps settings and visible plugin search/execution stable",
  { concurrency: false },
  async () => {
    const originalVisible = getVisiblePluginIds();
    try {
      setVisiblePluginIds(["webtools-json"]);

      const catalog = buildCatalogForRegression();
      const usage = new UsageStore();

      const settingsResults = searchItems("settings", catalog, usage, 10, {
        scope: "all"
      });
      const settingsItem = findTarget(settingsResults, "command:settings");
      assert.ok(settingsItem, "settings command should be searchable");

      const pluginResults = searchItems("json", catalog, usage, 10, {
        scope: "plugin"
      });
      assert.ok(pluginResults.length >= 1, "json plugin should be searchable in plugin scope");
      const jsonPluginItem = findTarget(pluginResults, "command:plugin:webtools-json");
      assert.ok(jsonPluginItem, "json plugin target should exist");

      const hiddenPluginResults = searchItems("cron", catalog, usage, 10, {
        scope: "plugin"
      });
      assert.equal(
        hiddenPluginResults.some((item) =>
          item.target.trim().toLowerCase().startsWith("command:plugin:webtools-cron")
        ),
        false,
        "hidden plugins should not appear in search results"
      );

      const settingsWindow = createMockWindow();
      const settingsExecuteResult = await executeItem(
        settingsItem as LaunchItem,
        settingsWindow.window as never
      );
      assert.equal(settingsExecuteResult.ok, true);
      assert.equal(settingsExecuteResult.keepOpen, true);
      assert.deepEqual(settingsWindow.sent[0], {
        channel: IPC_CHANNELS.openPanel,
        payload: "settings"
      });

      const pluginWindow = createMockWindow();
      const pluginExecuteResult = await executeItem(
        jsonPluginItem as LaunchItem,
        pluginWindow.window as never
      );
      assert.equal(pluginExecuteResult.ok, true);
      assert.equal(pluginExecuteResult.keepOpen, true);
      assert.equal(pluginWindow.sent[0]?.channel, IPC_CHANNELS.openPanel);
      assert.equal(
        (pluginWindow.sent[0]?.payload as { panel?: string } | undefined)?.panel,
        "plugin"
      );
      assert.equal(
        (pluginWindow.sent[0]?.payload as { pluginId?: string } | undefined)?.pluginId,
        "webtools-json"
      );
    } finally {
      setVisiblePluginIds(originalVisible);
    }
  }
);
