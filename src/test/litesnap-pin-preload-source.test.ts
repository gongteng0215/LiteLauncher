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
  assert.match(
    source,
    /saveToFile\(\): void[\s\S]*ipcRenderer\.send\(PIN_SAVE_CHANNEL\)/,
    "LiteSnap pin preload should let the pin window save the image to disk"
  );
  assert.match(
    source,
    /beginDrag\(screenX: number, screenY: number\)[\s\S]*ipcRenderer\.send\(PIN_DRAG_BEGIN_CHANNEL, screenX, screenY\)/,
    "LiteSnap pin preload should begin absolute pin drags from the pointer screen position"
  );
  assert.match(
    source,
    /moveTo\(screenX: number, screenY: number\)[\s\S]*ipcRenderer\.send\(PIN_MOVE_CHANNEL, screenX, screenY\)/,
    "LiteSnap pin preload should move frameless pin windows with absolute screen coordinates"
  );
  assert.match(
    source,
    /notifyDragEnd\(\): void[\s\S]*ipcRenderer\.send\(PIN_DRAG_END_CHANNEL\)/,
    "LiteSnap pin preload should notify main process when a drag ends for DPI rebake"
  );
  assert.match(
    source,
    /setClickThrough\(enabled: boolean\): void[\s\S]*ipcRenderer\.send\(PIN_SET_CLICK_THROUGH_CHANNEL/,
    "LiteSnap pin preload should toggle click-through"
  );
  assert.match(
    source,
    /closeAllPins\(\): void[\s\S]*ipcRenderer\.send\(PIN_CLOSE_ALL_CHANNEL\)/,
    "LiteSnap pin preload should request closing all pinned windows"
  );
  assert.match(
    source,
    /onImageRefresh\(callback: \(\) => void\)/,
    "LiteSnap pin preload should refresh the pin image after DPI rebake"
  );
});
