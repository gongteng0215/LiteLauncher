import assert from "node:assert/strict";
import test from "node:test";

import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import {
  executePluginCommand,
  getAllPluginIds,
  getPluginCatalogItems,
  getVisiblePluginIds
} from "../main/plugins";

type SentMessage = {
  channel: string;
  payload: unknown;
};

function createSelectedItem(pluginId: string): LaunchItem {
  return {
    id: `plugin:${pluginId}:regression`,
    type: "command",
    title: `${pluginId} regression`,
    subtitle: "plugin regression check",
    target: `command:plugin:${pluginId}`,
    keywords: ["plugin", "regression"]
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

function parsePluginIdFromTarget(target: string): string | null {
  const normalized = target.trim();
  const prefix = "command:plugin:";
  if (!normalized.toLowerCase().startsWith(prefix)) {
    return null;
  }

  const body = normalized.slice(prefix.length);
  const [pluginId] = body.split("?");
  const result = (pluginId ?? "").trim().toLowerCase();
  return result || null;
}

test("visible plugin ids are stable and subset of all plugins", () => {
  const allPluginIds = getAllPluginIds();
  const visiblePluginIds = getVisiblePluginIds();

  assert.ok(allPluginIds.length >= visiblePluginIds.length);
  assert.equal(new Set(allPluginIds).size, allPluginIds.length);
  assert.equal(new Set(visiblePluginIds).size, visiblePluginIds.length);
  for (const pluginId of visiblePluginIds) {
    assert.ok(
      allPluginIds.includes(pluginId),
      `visible plugin should exist in all plugins: ${pluginId}`
    );
  }
});

test("plugin catalog only exposes visible plugins and covers each visible plugin", () => {
  const visiblePluginIds = new Set(getVisiblePluginIds());
  const catalogItems = getPluginCatalogItems();

  const idsInCatalog = new Set<string>();
  for (const item of catalogItems) {
    const pluginId = parsePluginIdFromTarget(item.target);
    if (!pluginId) {
      continue;
    }
    idsInCatalog.add(pluginId);
    assert.ok(
      visiblePluginIds.has(pluginId),
      `catalog should not expose hidden plugin: ${pluginId}`
    );
  }

  for (const visibleId of visiblePluginIds) {
    assert.ok(
      idsInCatalog.has(visibleId),
      `visible plugin should have catalog entry: ${visibleId}`
    );
  }
});

test("each visible plugin supports default open command", async () => {
  for (const pluginId of getVisiblePluginIds()) {
    const { window, sent } = createMockWindow();
    const result = await executePluginCommand(
      pluginId,
      window as never,
      createSelectedItem(pluginId)
    );

    assert.equal(result.ok, true, `plugin open should succeed: ${pluginId}`);
    assert.equal(result.keepOpen, true, `plugin open should keep panel: ${pluginId}`);
    assert.ok(sent.length >= 1, `plugin should emit openPanel: ${pluginId}`);
    assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);
  }
});
