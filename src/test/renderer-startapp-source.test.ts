import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { readRendererSourceBundle } from "./renderer-source-bundle";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");

test("renderer fallback merge scoring treats app:startapp items as preferred Windows Store app results", () => {
  const source = readRendererSourceBundle();

  assert.match(
    source,
    /item\.id\.startsWith\("command:apps-folder:"\)\s*\|\|\s*item\.id\.startsWith\("app:startapp:"\)/,
    "renderer merge scoring should prefer both legacy AppsFolder ids and stable app:startapp ids"
  );
});
