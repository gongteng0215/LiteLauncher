import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import { IPC_CHANNELS } from "../shared/channels";
import { LaunchItem } from "../shared/types";
import {
  executePluginCommand,
  getAllPluginIds,
  getPluginCatalogItems,
  getVisiblePluginIds
} from "../main/plugins";

const mainIndexPath = path.join(process.cwd(), "src", "main", "index.ts");

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

function readMainIndexSource(): string {
  return fs.readFileSync(mainIndexPath, "utf8");
}

function extractConstArraySource(source: string, name: string): string {
  const startToken = `const ${name} = [`;
  const start = source.indexOf(startToken);
  assert.notEqual(start, -1, `${name} should be defined as a const array`);
  const bodyStart = start + startToken.length;
  const end = source.indexOf("] as const;", bodyStart);
  assert.notEqual(end, -1, `${name} should end with as const`);
  return source.slice(bodyStart, end);
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
  assert.ok(
    visiblePluginIds.includes("webtools-image-prompt"),
    "image prompt plugin should be visible by default"
  );
});

test("startup visible plugin migration includes image prompt as a new default", () => {
  const mainIndexSource = readMainIndexSource();
  const requiredSource = extractConstArraySource(
    mainIndexSource,
    "REQUIRED_VISIBLE_PLUGIN_IDS"
  );
  const currentDefaultSource = extractConstArraySource(
    mainIndexSource,
    "CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS"
  );

  assert.match(
    requiredSource,
    /"webtools-image-prompt"/,
    "saved visible plugin lists should be upgraded with the new Image Prompt plugin"
  );
  assert.match(
    currentDefaultSource,
    /"webtools-image-prompt"/,
    "current app-level default visible plugin list should include Image Prompt"
  );
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

test("image prompt build command tolerates malformed state fields", async () => {
  const { window } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "build");
  params.set(
    "state",
    JSON.stringify({
      selections: {
        subject: [42, "一款无线蓝牙耳机"],
        mood: ["商业海报", false]
      },
      text: {
        exact: "降噪黑科技",
        designId: "ecommerce-benefit",
        design: "电商卖点标题设计：大号粗体无衬线，贴合顶部留白区，不遮挡产品",
        layout: "主标题放在顶部留白区，和商品保持明确安全距离",
        flags: ["仅出现一次", 1]
      },
      photoDescription: "3岁小女孩，穿白色连衣裙，笑着看镜头",
      constraints: ["无水印", 2]
    })
  );

  const result = await executePluginCommand(
    `webtools-image-prompt?${params.toString()}`,
    window as never,
    createSelectedItem("webtools-image-prompt")
  );

  assert.equal(result.ok, true);
  assert.equal(typeof result.data?.output, "string");
  assert.match(String(result.data?.output), /一款无线蓝牙耳机/);
  assert.match(String(result.data?.output), /商业海报/);
  assert.match(String(result.data?.output), /文字设计：电商卖点标题设计/);
  assert.match(String(result.data?.output), /文字布局：主标题放在顶部留白区/);
  assert.match(String(result.data?.output), /照片人物说明：3岁小女孩/);
  assert.match(String(result.data?.output), /无水印/);
  assert.equal(String(result.data?.output).includes("undefined"), false);
});
