import assert from "node:assert/strict";
import test from "node:test";

import {
  filterItemsByPathRules,
  isPathRuleMatch,
  normalizePathRule
} from "../main/path-rule-filter";
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

test("normalizePathRule keeps platform specific separators and case rules", () => {
  assert.equal(
    normalizePathRule("C:/Apps/Test/", "win32"),
    "c:\\apps\\test"
  );
  assert.equal(
    normalizePathRule(" /opt/apps/test/ ", "linux"),
    "/opt/apps/test"
  );
});

test("isPathRuleMatch supports exact and nested directory matches", () => {
  assert.equal(isPathRuleMatch("c:\\apps", "c:\\apps", "win32"), true);
  assert.equal(isPathRuleMatch("c:\\apps\\tool\\a.exe", "c:\\apps", "win32"), true);
  assert.equal(isPathRuleMatch("c:\\app", "c:\\apps", "win32"), false);

  assert.equal(isPathRuleMatch("/opt/apps", "/opt/apps", "linux"), true);
  assert.equal(isPathRuleMatch("/opt/apps/tool/app", "/opt/apps", "linux"), true);
  assert.equal(isPathRuleMatch("/opt/app", "/opt/apps", "linux"), false);
});

test("filterItemsByPathRules keeps non-path items and applies include/exclude rules", () => {
  const items: LaunchItem[] = [
    createItem({
      id: "app:tool",
      type: "application",
      target: "C:\\Apps\\Tool\\tool.exe",
      keywords: ["tool"]
    }),
    createItem({
      id: "app:noise",
      type: "application",
      target: "C:\\Apps\\Noise\\noise.exe",
      keywords: ["noise"]
    }),
    createItem({
      id: "app:other",
      type: "application",
      target: "D:\\Other\\other.exe",
      keywords: ["other"]
    }),
    createItem({
      id: "command:settings",
      type: "command",
      target: "command:settings",
      keywords: ["settings"]
    })
  ];

  const filtered = filterItemsByPathRules(
    items,
    {
      includeDirs: ["C:/Apps"],
      excludeDirs: ["c:\\apps\\noise"]
    },
    "win32"
  );

  assert.deepEqual(
    filtered.map((item) => item.id),
    ["app:tool", "command:settings"]
  );
});

test("filterItemsByPathRules returns original list when rules are empty", () => {
  const items: LaunchItem[] = [
    createItem({
      id: "file:a",
      type: "file",
      target: "/tmp/a.txt",
      keywords: ["a"]
    }),
    createItem({
      id: "command:clip",
      type: "command",
      target: "command:clip",
      keywords: ["clip"]
    })
  ];

  const filtered = filterItemsByPathRules(items, {
    includeDirs: [],
    excludeDirs: []
  });

  assert.equal(filtered.length, items.length);
  assert.equal(filtered[0]?.id, items[0]?.id);
  assert.equal(filtered[1]?.id, items[1]?.id);
});
