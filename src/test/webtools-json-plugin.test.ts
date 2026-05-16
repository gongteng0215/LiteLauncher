import assert from "node:assert/strict";
import test from "node:test";

import { LaunchItem } from "../shared/types";
import { executePluginCommand } from "../main/plugins";

type SentMessage = {
  channel: string;
  payload: unknown;
};

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:webtools-json:test",
    type: "command",
    title: "JSON 工具",
    subtitle: "test",
    target: "command:plugin:webtools-json",
    keywords: ["plugin", "json"]
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

test("webtools-json validate returns preview and error position for invalid JSON", async () => {
  const { window } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "validate");
  params.set("input", '{"name":"alice",}');

  const result = await executePluginCommand(
    `webtools-json?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, false);
  assert.equal(typeof result.data?.info, "string");
  assert.equal(result.data?.valid, false);
  assert.equal(
    typeof result.data?.errorPosition === "number" || result.data?.errorPosition === null,
    true
  );
  assert.equal(typeof result.data?.preview, "object");
  const preview = result.data?.preview as { summary?: string; kind?: string } | undefined;
  assert.equal(preview?.kind, "text");
  assert.match(preview?.summary ?? "", /\d+\s+字符/);
});

test("webtools-json convert returns structured preview for CSV input", async () => {
  const { window } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "convert");
  params.set("sourceFormat", "csv");
  params.set("targetFormat", "json");
  params.set("input", "name,role\nAlice,Admin\nBob,Editor");

  const result = await executePluginCommand(
    `webtools-json?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  assert.equal(result.data?.valid, null);
  assert.equal(typeof result.data?.output, "string");
  const preview = result.data?.preview as {
    kind?: string;
    summary?: string;
    fields?: Array<{ key?: string; count?: number }>;
    sampleRows?: Array<Record<string, unknown>>;
  } | undefined;
  assert.equal(preview?.kind, "csv");
  assert.match(preview?.summary ?? "", /2\s+行/);
  assert.deepEqual(
    preview?.fields?.map((field) => field.key),
    ["name", "role"]
  );
  assert.equal(preview?.sampleRows?.[0]?.name, "Alice");
});
