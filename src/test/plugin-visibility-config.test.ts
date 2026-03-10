import assert from "node:assert/strict";
import test from "node:test";

import {
  getPluginCatalogItems,
  getVisiblePluginIds,
  setVisiblePluginIds
} from "../main/plugins";

function parsePluginIdFromTarget(target: string): string | null {
  const normalized = target.trim();
  const prefix = "command:plugin:";
  if (!normalized.toLowerCase().startsWith(prefix)) {
    return null;
  }

  const body = normalized.slice(prefix.length);
  const [pluginId] = body.split("?");
  const parsed = (pluginId ?? "").trim().toLowerCase();
  return parsed || null;
}

test(
  "setVisiblePluginIds filters unknown values and normalizes casing",
  { concurrency: false },
  () => {
  const original = getVisiblePluginIds();
  try {
    const applied = setVisiblePluginIds([
      " WEBTOOLS-JSON ",
      "webtools-json",
      "webtools-cron",
      "unknown-plugin"
    ]);

    assert.deepEqual(applied, ["webtools-json", "webtools-cron"]);
    assert.deepEqual(
      [...getVisiblePluginIds()].sort(),
      ["webtools-json", "webtools-cron"].sort()
    );
  } finally {
    setVisiblePluginIds(original);
  }
  }
);

test(
  "plugin catalog follows current visible plugin ids",
  { concurrency: false },
  () => {
  const original = getVisiblePluginIds();
  try {
    setVisiblePluginIds(["webtools-json"]);
    const catalogItems = getPluginCatalogItems();

    assert.ok(catalogItems.length >= 1);
    for (const item of catalogItems) {
      const pluginId = parsePluginIdFromTarget(item.target);
      assert.equal(pluginId, "webtools-json");
    }
  } finally {
    setVisiblePluginIds(original);
  }
  }
);

test("setVisiblePluginIds supports empty list", { concurrency: false }, () => {
  const original = getVisiblePluginIds();
  try {
    const applied = setVisiblePluginIds([]);
    assert.deepEqual(applied, []);
    assert.equal(getPluginCatalogItems().length, 0);
  } finally {
    setVisiblePluginIds(original);
  }
});
