import assert from "node:assert/strict";
import test from "node:test";

import {
  DEFAULT_SEARCH_DISPLAY_CONFIG,
  SEARCH_DISPLAY_LIMIT_MAX,
  SEARCH_DISPLAY_LIMIT_MIN,
  normalizeCatalogScanConfig,
  normalizeSearchDisplayConfig
} from "../shared/settings";
import { computeSearchItems } from "../shared/search-engine";
import { LaunchItem } from "../shared/types";

function createItem(partial: Partial<LaunchItem> & { id: string }): LaunchItem {
  return {
    id: partial.id,
    type: partial.type ?? "application",
    title: partial.title ?? partial.id,
    subtitle: partial.subtitle ?? "",
    target: partial.target ?? partial.id,
    keywords: partial.keywords ?? []
  };
}

test("normalizeSearchDisplayConfig clamps numeric values and supports recommendedLimit fallback", () => {
  const clamped = normalizeSearchDisplayConfig({
    recentLimit: -100,
    pinnedLimit: 99999,
    pluginLimit: Number.NaN,
    searchLimit: 32
  });

  assert.equal(clamped.recentLimit, SEARCH_DISPLAY_LIMIT_MIN);
  assert.equal(clamped.pinnedLimit, SEARCH_DISPLAY_LIMIT_MAX);
  assert.equal(clamped.pluginLimit, DEFAULT_SEARCH_DISPLAY_CONFIG.pluginLimit);
  assert.equal(clamped.searchLimit, 32);

  const recommended = normalizeSearchDisplayConfig({
    recommendedLimit: 36
  });
  assert.equal(recommended.pinnedLimit, 36);
});

test("normalizeCatalogScanConfig trims, deduplicates and enforces max list length", () => {
  const oversized = Array.from({ length: 80 }, (_, index) => `D:\\Tools\\${index}`);
  const normalized = normalizeCatalogScanConfig({
    scanProgramFiles: true,
    customScanDirs: [
      "  C:\\Program Files\\Apps  ",
      "c:\\program files\\apps",
      " ",
      ...oversized
    ],
    excludeScanDirs: ["  C:\\Windows\\Temp ", "c:\\windows\\temp", ""],
    resultIncludeDirs: ["  E:\\Work  ", "e:\\work"],
    resultExcludeDirs: ["  C:\\Cache ", "c:\\cache", "D:\\Noise"]
  });

  assert.equal(normalized.scanProgramFiles, true);
  assert.equal(normalized.customScanDirs[0], "C:\\Program Files\\Apps");
  assert.equal(new Set(normalized.customScanDirs).size, normalized.customScanDirs.length);
  assert.ok(normalized.customScanDirs.length <= 50);
  assert.deepEqual(normalized.excludeScanDirs, ["C:\\Windows\\Temp"]);
  assert.deepEqual(normalized.resultIncludeDirs, ["E:\\Work"]);
  assert.deepEqual(normalized.resultExcludeDirs, ["C:\\Cache", "D:\\Noise"]);
});

test("dynamic search commands are generated for calc and g prefixes", () => {
  const catalog = [
    createItem({
      id: "app:notepad",
      type: "application",
      title: "Notepad",
      target: "C:\\Windows\\notepad.exe",
      keywords: ["notepad", "editor"]
    })
  ];

  const calcResults = computeSearchItems("calc 1+2*3", catalog, {}, 5, {
    scope: "all"
  });
  assert.ok(calcResults.length >= 1);
  assert.equal(calcResults[0]?.type, "command");
  assert.match(calcResults[0]?.target ?? "", /^command:calc:/);

  const gResults = computeSearchItems("g litelauncher", catalog, {}, 5, {
    scope: "all"
  });
  assert.ok(gResults.length >= 1);
  assert.equal(gResults[0]?.type, "web");
  assert.match(gResults[0]?.target ?? "", /^https:\/\/www\.google\.com\/search\?/);
});

test("plugin scope only keeps plugin commands", () => {
  const catalog = [
    createItem({
      id: "plugin:webtools-json",
      type: "command",
      title: "JSON 工具",
      subtitle: "插件",
      target: "command:plugin:webtools-json?action=open",
      keywords: ["json", "plugin"]
    }),
    createItem({
      id: "command:settings",
      type: "command",
      title: "settings",
      subtitle: "打开设置",
      target: "command:settings",
      keywords: ["settings", "command"]
    }),
    createItem({
      id: "app:json-editor",
      type: "application",
      title: "JSON Editor",
      subtitle: "App",
      target: "C:\\Apps\\json-editor.exe",
      keywords: ["json", "editor"]
    })
  ];

  const pluginOnly = computeSearchItems("json", catalog, {}, 10, {
    scope: "plugin"
  });
  assert.ok(pluginOnly.length >= 1);
  assert.ok(
    pluginOnly.every(
      (item) =>
        item.type === "command" &&
        item.target.trim().toLowerCase().startsWith("command:plugin:")
    )
  );
});

test("pinyin noisy long query suppression keeps relevant results only", () => {
  const catalog = [
    createItem({
      id: "app:baidu",
      type: "application",
      title: "百度网盘",
      subtitle: "C:\\Apps\\BaiduNetdisk.exe",
      target: "C:\\Apps\\BaiduNetdisk.exe",
      keywords: ["百度", "baidu", "bai", "wangpan", "网盘"]
    })
  ];

  const normal = computeSearchItems("bai", catalog, {}, 10, { scope: "all" });
  assert.ok(normal.length >= 1);
  assert.equal(normal[0]?.id, "app:baidu");

  const noisy = computeSearchItems("baiasdsadsadsadsad", catalog, {}, 10, {
    scope: "all"
  });
  assert.equal(noisy.length, 0);
});

test("search result limit is respected", () => {
  const catalog = Array.from({ length: 30 }, (_, index) =>
    createItem({
      id: `app:item-${index}`,
      type: "application",
      title: `App ${index}`,
      subtitle: `C:\\Apps\\app-${index}.exe`,
      target: `C:\\Apps\\app-${index}.exe`,
      keywords: ["app", `app${index}`]
    })
  );

  const results = computeSearchItems("app", catalog, {}, 7, { scope: "all" });
  assert.equal(results.length, 7);
});
