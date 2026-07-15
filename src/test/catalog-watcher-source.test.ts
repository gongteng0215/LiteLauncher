import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const watcherPath = path.join(process.cwd(), "src", "main", "catalog-watcher.ts");
const catalogPath = path.join(process.cwd(), "src", "main", "catalog.ts");

test("catalog change watcher covers Start Menu installs and uninstalls", () => {
  const watcherSource = fs.readFileSync(watcherPath, "utf8");
  const catalogSource = fs.readFileSync(catalogPath, "utf8");

  assert.match(catalogSource, /export function getCatalogWatchDirectories/);
  assert.match(catalogSource, /getStartMenuDirs\(\)/);
  assert.match(watcherSource, /export class CatalogChangeWatcher/);
  assert.match(watcherSource, /fs\.watch\(dir, \{ recursive: true \}/);
  assert.match(watcherSource, /CATALOG_WATCH_DEBOUNCE_MS/);
  assert.match(watcherSource, /maybeRefreshIfStale/);
});
