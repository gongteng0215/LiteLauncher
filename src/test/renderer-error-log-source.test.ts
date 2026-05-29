import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");

test("renderer error log formatter translates pin failures into readable Chinese summaries", () => {
  const source = fs.readFileSync(rendererPath, "utf8");

  assert.match(
    source,
    /function formatPinErrorReasonText\(reason: string \| undefined\): string/,
    "pin failure reason helper should exist in renderer.ts"
  );
  assert.match(source, /Pin request rejected/);
  assert.match(source, /Pin request failed/);
  assert.match(source, /\\u5f53\\u524d\\u7ed3\\u679c\\u5df2\\u8fc7\\u671f\\uff0c\\u8bf7\\u91cd\\u65b0\\u641c\\u7d22/);
  assert.match(source, /\\u4fdd\\u5b58\\u5931\\u8d25\\uff0c\\u8bf7\\u91cd\\u8bd5/);
});
