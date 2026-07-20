import assert from "node:assert/strict";
import test from "node:test";

import { LaunchItem } from "../shared/types";
import { executePluginCommand } from "../main/plugins";
import { validateJsonSchemaPayload } from "../main/plugins/webtools-json-schema";

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:webtools-json-schema:test",
    type: "command",
    title: "JSON Schema 校验",
    subtitle: "test",
    target: "command:plugin:webtools-json-schema",
    keywords: ["plugin", "json-schema"]
  };
}

function createMockWindow(): {
  window: { webContents: { send: (channel: string, payload: unknown) => void } };
} {
  return {
    window: {
      webContents: {
        send(): void {}
      }
    }
  };
}

test("validateJsonSchemaPayload accepts matching payload", () => {
  const schema = JSON.stringify({
    type: "object",
    required: ["name"],
    properties: {
      name: { type: "string" }
    }
  });
  const payload = JSON.stringify({ name: "Alice" });
  const result = validateJsonSchemaPayload(schema, payload);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("validateJsonSchemaPayload reports path and message for invalid payload", () => {
  const schema = JSON.stringify({
    type: "object",
    required: ["age"],
    properties: {
      age: { type: "integer", minimum: 0 }
    }
  });
  const payload = JSON.stringify({ age: -1 });
  const result = validateJsonSchemaPayload(schema, payload);
  assert.equal(result.valid, false);
  assert.ok(result.errors.length > 0);
  assert.match(result.errors[0]?.path ?? "", /\/age|age/);
  assert.ok(result.errors[0]?.message);
});

test("webtools-json-schema validate action returns structured errors", async () => {
  const { window } = createMockWindow();
  const schema = JSON.stringify({
    type: "object",
    required: ["id"],
    properties: {
      id: { type: "string" }
    }
  });
  const params = new URLSearchParams();
  params.set("action", "validate");
  params.set("schema", schema);
  params.set("payload", JSON.stringify({}));

  const result = await executePluginCommand(
    `webtools-json-schema?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, false);
  assert.equal(result.data?.valid, false);
  assert.ok(Array.isArray(result.data?.errors));
});
