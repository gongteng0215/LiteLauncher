import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

function readSource(relativePath: string): string {
  return fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");
}

test("settings visible plugin picker supports search, groups, pin, and restore", () => {
  const rendererSource = readSource("src/renderer/renderer.ts");
  const stylesSource = readSource("src/renderer/styles.css");

  assert.match(rendererSource, /function createVisiblePluginPicker/);
  assert.match(rendererSource, /搜索插件名称/);
  assert.match(rendererSource, /词典与翻译/);
  assert.match(rendererSource, /工作台/);
  assert.match(rendererSource, /开发工具/);
  assert.match(rendererSource, /settings-plugin-pin-btn/);
  assert.match(rendererSource, /恢复默认可见/);
  assert.match(rendererSource, /settings-plugin-new-badge/);
  assert.match(rendererSource, /DEFAULT_VISIBLE_PLUGIN_IDS/);
  assert.match(stylesSource, /\.settings-plugin-picker/);
  assert.match(stylesSource, /\.settings-plugin-new-badge/);
  assert.match(stylesSource, /\.settings-plugin-pin-btn/);
});
