import fs from "node:fs";
import path from "node:path";

export const RENDERER_SOURCE_FILES = [
  "renderer-foundation.ts",
  "renderer-window-mode-controller.ts",
  "renderer-settings-controller.ts",
  "renderer-home-search-controller.ts",
  "renderer-panel-bridge.ts",
  "renderer.ts"
] as const;

export function readRendererSourceBundle(): string {
  return RENDERER_SOURCE_FILES.map((fileName) =>
    fs.readFileSync(path.join(process.cwd(), "src", "renderer", fileName), "utf8")
  ).join("\n");
}
