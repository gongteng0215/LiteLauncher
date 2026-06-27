import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const pinPreloadPath = path.join(process.cwd(), "src", "preload", "litesnap-pin.ts");

test("LiteSnap pin preload exposes visual state bridge", () => {
  const source = fs.readFileSync(pinPreloadPath, "utf8");

  assert.match(
    source,
    /contextBridge\.exposeInMainWorld\("liteSnapPin"/,
    "LiteSnap pin preload should expose a dedicated bridge"
  );
  assert.match(
    source,
    /setVisualState\(scale: number, opacity: number\)/,
    "LiteSnap pin preload should resize the native window for zoom and opacity changes"
  );
  assert.match(
    source,
    /ipcRenderer\.send\(PIN_VISUAL_STATE_CHANNEL, scale, opacity\)/,
    "LiteSnap pin preload should send visual state updates to the main process"
  );
  assert.match(
    source,
    /copyToClipboard\(\): void[\s\S]*ipcRenderer\.send\(PIN_COPY_CHANNEL\)/,
    "LiteSnap pin preload should copy pinned images to the clipboard"
  );
});
