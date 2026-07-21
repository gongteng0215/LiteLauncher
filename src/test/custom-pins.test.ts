import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { test } from "node:test";
import {
  buildCustomPinId,
  buildLaunchItemFromPath,
  isCustomPinId,
  parsePinnedCustomItems,
  resolvePinItemForPath
} from "../main/custom-pins";

test("buildLaunchItemFromPath creates custom pin item for existing file", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-custom-pin-"));
  const filePath = path.join(tempDir, "demo-tool.exe");
  fs.writeFileSync(filePath, "demo");

  const item = buildLaunchItemFromPath(filePath);
  assert.ok(item);
  assert.equal(item?.type, "application");
  assert.equal(item?.target, path.resolve(filePath));
  assert.ok(isCustomPinId(item?.id ?? ""));
});

test("resolvePinItemForPath prefers catalog item with same target", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "ll-custom-pin-"));
  const filePath = path.join(tempDir, "demo.exe");
  fs.writeFileSync(filePath, "demo");

  const catalogItem = {
    id: `app:${filePath}`,
    type: "application" as const,
    title: "Demo",
    subtitle: filePath,
    target: filePath,
    keywords: ["demo"]
  };

  const resolved = resolvePinItemForPath(filePath, [catalogItem]);
  assert.equal(resolved?.id, catalogItem.id);
});

test("parsePinnedCustomItems drops missing paths", () => {
  const id = buildCustomPinId("C:\\missing\\app.exe");
  const parsed = parsePinnedCustomItems({
    [id]: {
      id,
      type: "application",
      title: "Missing",
      subtitle: "C:\\missing\\app.exe",
      target: "C:\\missing\\app.exe",
      keywords: []
    }
  });

  assert.equal(parsed.size, 0);
});
