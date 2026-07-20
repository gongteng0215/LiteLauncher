import assert from "node:assert/strict";
import test from "node:test";

import { LaunchItem } from "../shared/types";
import { executePluginCommand } from "../main/plugins";
import {
  generateFakeData,
  maskSensitiveText
} from "../main/plugins/webtools-data-mask";

function createSelectedItem(): LaunchItem {
  return {
    id: "plugin:webtools-data-mask:test",
    type: "command",
    title: "文本脱敏 / 假数据",
    subtitle: "test",
    target: "command:plugin:webtools-data-mask",
    keywords: ["plugin", "data-mask"]
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

test("maskSensitiveText masks phone email and id card", () => {
  const input =
    "手机13812345678，邮箱zhangsan@example.com，身份证110101199001011234";
  const output = maskSensitiveText(input, {
    maskPhone: true,
    maskEmail: true,
    maskIdCard: true
  });
  assert.match(output, /138\*\*\*\*5678/);
  assert.match(output, /z\*\*\*@example\.com/);
  assert.match(output, /110101\*\*\*\*\*\*\*\*1234/);
  assert.doesNotMatch(output, /13812345678/);
});

test("generateFakeData returns requested count", () => {
  const lines = generateFakeData("uuid", 3);
  assert.equal(lines.length, 3);
  for (const line of lines) {
    assert.match(line, /^[0-9a-f-]{36}$/i);
  }
});

test("webtools-data-mask generate action returns output lines", async () => {
  const { window } = createMockWindow();
  const params = new URLSearchParams();
  params.set("action", "generate");
  params.set("fakeKind", "name");
  params.set("fakeCount", "2");

  const result = await executePluginCommand(
    `webtools-data-mask?${params.toString()}`,
    window as never,
    createSelectedItem()
  );

  assert.equal(result.ok, true);
  assert.equal(typeof result.data?.output, "string");
  assert.equal(String(result.data?.output).split("\n").length, 2);
});
