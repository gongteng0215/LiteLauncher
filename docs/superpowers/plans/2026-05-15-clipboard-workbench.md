# Clipboard Workbench Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a new default-visible `Clipboard Workbench` plugin that can collect, manage, search, and replay multiple clipboard items without modifying the existing `clip`.

**Architecture:** A singleton `ClipboardWorkbenchService` in the main process owns clipboard polling, retention, batch paste orchestration, and view-model assembly. It persists metadata through a dedicated `ClipboardWorkbenchStore` that uses its own sqlite connection against the existing `litelauncher.db` file with new `clipboard_workbench_*` tables plus asset files under `<userData>/clipboard-workbench/assets/`. The renderer keeps only ephemeral UI state such as current selection and draft filters, and always refreshes from plugin payloads returned by plugin actions.

**Tech Stack:** TypeScript, Electron clipboard/dialog APIs, sqlite3, node:test, Playwright, existing LiteLauncher plugin-panel framework.

---

## File Structure

**Create**
- `src/shared/clipboard-workbench.ts`
  Shared types, defaults, query contracts, text normalization, short-code exclusion, merge helpers, retention helpers, and Windows `FileNameW` decoding.
- `src/main/plugins/clipboard-workbench/index.ts`
  Plugin catalog item, query aliases, action parsing, execute dispatcher, and service injection hook.
- `src/main/plugins/clipboard-workbench/store.ts`
  sqlite table setup, settings persistence, item/group CRUD, asset file writes, and cleanup.
- `src/main/plugins/clipboard-workbench/collector.ts`
  Clipboard snapshot classification for text, images, screenshots, and file lists.
- `src/main/plugins/clipboard-workbench/paste.ts`
  Single-item restore and Windows-first best-effort sequential paste helpers.
- `src/main/plugins/clipboard-workbench/service.ts`
  Polling lifecycle, query/filter orchestration, action handlers, and panel payload builder.
- `src/test/clipboard-workbench-normalize.test.ts`
  Text normalization, hash input, and `FileNameW` decoding coverage.
- `src/test/clipboard-workbench-safety-rules.test.ts`
  Short-code exclusion, sensitive-mode flags, and query normalization coverage.
- `src/test/clipboard-workbench-merge.test.ts`
  Sequential merge strategies for text and file-path lists.
- `src/test/clipboard-workbench-retention.test.ts`
  Eviction ordering and byte/item budget coverage.
- `src/test/clipboard-workbench-store.test.ts`
  Store-level persistence, settings, asset cleanup, and retention integration.
- `src/test/clipboard-workbench-service.test.ts`
  Service-level manual save, auto-collect pause/sensitive behavior, and batch paste fallback coverage.
- `src/test/clipboard-workbench-plugin.test.ts`
  Plugin command parsing, `openPanel` contract, and singleton-service forwarding coverage.

**Modify**
- `src/main/plugins/index.ts`
  Register the new plugin and add it to default visible plugins.
- `src/main/index.ts`
  Instantiate/start/stop the new service and update app-level visible plugin migration arrays.
- `src/renderer/plugin-constants.ts`
  Add `CLIPBOARD_WORKBENCH_PLUGIN_ID` and include it in renderer defaults.
- `src/renderer/global.d.ts`
  Extend plugin constants and panel implementation interface.
- `src/renderer/plugin-handler-config.ts`
  Register `form.clipboard-workbench-form` Enter behavior metadata.
- `src/renderer/renderer.ts`
  Add plugin constant, handler wiring, and default-visible array entry.
- `src/renderer/plugin-panel-impls.ts`
  Add panel payload state, action wrappers, renderers, selection model, metadata editor, and batch action UI.
- `src/renderer/styles.css`
  Add the full Clipboard Workbench shell, list, detail, toolbar, selection, and responsive styles.
- `src/test/visible-plugins-regression.test.ts`
  Assert the new plugin is visible by default and upgrade-safe.
- `src/test/plugin-panel-impls-regression.test.ts`
  Assert render/apply live in `plugin-panel-impls.ts` and the shell classes exist.
- `src/test/e2e-plugin-panels-smoke.test.ts`
  Smoke the plugin panel on desktop and narrow widths with manual save + multi-select UI.

**Do Not Modify**
- `src/main/clip-service.ts`
- Existing `clip_items` data and `command:clip` behavior

## Guardrails

- Keep `clip` intact; no shared writes to `clip_items`, no command alias takeover, no UI reuse that changes current `clip` behavior.
- Default `maxItems` must stay `50`.
- Support both collection modes from day one:
  auto clipboard monitoring and manual save/manual supplement.
- Support both multi-item replay modes:
  sequential best-effort paste and merge-then-paste-once.
- Support text, images, screenshots, and file-path lists.
- Windows 11 is the primary automation target for sequential paste; failure must degrade to “already restored to clipboard” instead of hard-failing the whole workflow.
- Sensitive mode must pause auto-collection while still allowing explicit manual saves.

## Shared Terms

- `ClipboardWorkbenchItemKind`: `"text" | "image" | "files"`
- `ClipboardWorkbenchItemSource`: `"auto" | "manual" | "screenshot"`
- `ClipboardWorkbenchListScope`: `"all" | "recent" | "favorites" | "pinned" | "text" | "image" | "files" | "screenshots"`
- `ClipboardWorkbenchPasteMode`: `"sequential" | "merge-once"`
- `ClipboardWorkbenchSettingsKey`: `"plugin.clipboard-workbench.settings"`

### Task 1: Shared Contracts And Pure Helpers

**Files:**
- Create: `src/shared/clipboard-workbench.ts`
- Test: `src/test/clipboard-workbench-normalize.test.ts`
- Test: `src/test/clipboard-workbench-safety-rules.test.ts`
- Test: `src/test/clipboard-workbench-merge.test.ts`
- Test: `src/test/clipboard-workbench-retention.test.ts`

- [ ] **Step 1: Write the failing pure-helper tests**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  createDefaultClipboardWorkbenchSettings,
  decodeClipboardWorkbenchFileNameW,
  mergeClipboardWorkbenchTextItems,
  normalizeClipboardWorkbenchText,
  selectClipboardWorkbenchEvictionIds,
  shouldIgnoreClipboardWorkbenchText
} from "../shared/clipboard-workbench";

test("normalizes CRLF text and trims blank outer lines", () => {
  assert.equal(
    normalizeClipboardWorkbenchText("\r\n  alpha\r\nbeta  \r\n"),
    "alpha\nbeta"
  );
});

test("ignores short numeric verification codes by default", () => {
  const settings = createDefaultClipboardWorkbenchSettings();
  assert.equal(shouldIgnoreClipboardWorkbenchText("123456", settings), true);
  assert.equal(shouldIgnoreClipboardWorkbenchText("release-2026-05", settings), false);
});

test("decodes FileNameW buffers into a path list", () => {
  const buffer = Buffer.from("C:\\\\A.txt\0D:\\\\B.png\0\0", "utf16le");
  assert.deepEqual(decodeClipboardWorkbenchFileNameW(buffer), [
    "C:\\A.txt",
    "D:\\B.png"
  ]);
});

test("merges text items with blank lines", () => {
  const merged = mergeClipboardWorkbenchTextItems(
    ["alpha", "beta", "gamma"],
    "blank-line"
  );
  assert.equal(merged, "alpha\n\nbeta\n\ngamma");
});

test("evicts oldest non-pinned items before pinned rows", () => {
  const ids = selectClipboardWorkbenchEvictionIds(
    [
      { id: "old-free", pinned: 0, favorite: 0, byteSize: 30, createdAt: 1 },
      { id: "old-fav", pinned: 0, favorite: 1, byteSize: 30, createdAt: 2 },
      { id: "new-pin", pinned: 1, favorite: 0, byteSize: 30, createdAt: 3 }
    ],
    { maxItems: 2, maxBytes: 60 }
  );
  assert.deepEqual(ids, ["old-free"]);
});
```

- [ ] **Step 2: Run the new pure-helper tests and confirm they fail**

Run: `pnpm run build && node dist/test/clipboard-workbench-normalize.test.js && node dist/test/clipboard-workbench-safety-rules.test.js && node dist/test/clipboard-workbench-merge.test.js && node dist/test/clipboard-workbench-retention.test.js`

Expected: `ERR_MODULE_NOT_FOUND` or TypeScript build errors because `src/shared/clipboard-workbench.ts` does not exist yet.

- [ ] **Step 3: Implement the shared contracts and defaults**

```ts
export type ClipboardWorkbenchItemKind = "text" | "image" | "files";
export type ClipboardWorkbenchItemSource = "auto" | "manual" | "screenshot";
export type ClipboardWorkbenchListScope =
  | "all"
  | "recent"
  | "favorites"
  | "pinned"
  | "text"
  | "image"
  | "files"
  | "screenshots";
export type ClipboardWorkbenchPasteMode = "sequential" | "merge-once";

export interface ClipboardWorkbenchSettings {
  version: 1;
  autoCollect: boolean;
  sensitiveMode: boolean;
  maxItems: number;
  maxBytes: number;
  ignoreShortCodes: boolean;
  shortCodeLengthMax: number;
  ignoredAppHints: string[];
  batchPasteDelayMs: number;
}

export function createDefaultClipboardWorkbenchSettings(): ClipboardWorkbenchSettings {
  return {
    version: 1,
    autoCollect: true,
    sensitiveMode: false,
    maxItems: 50,
    maxBytes: 512 * 1024 * 1024,
    ignoreShortCodes: true,
    shortCodeLengthMax: 8,
    ignoredAppHints: [],
    batchPasteDelayMs: 180
  };
}
```

- [ ] **Step 4: Implement the pure normalization, exclusion, merge, and retention helpers**

```ts
export function normalizeClipboardWorkbenchText(input: string): string {
  return input.replace(/\r\n/g, "\n").trim();
}

export function shouldIgnoreClipboardWorkbenchText(
  input: string,
  settings: ClipboardWorkbenchSettings
): boolean {
  const normalized = normalizeClipboardWorkbenchText(input);
  if (!normalized) {
    return true;
  }
  if (!settings.ignoreShortCodes) {
    return false;
  }
  return /^\d+$/.test(normalized) && normalized.length <= settings.shortCodeLengthMax;
}

export function decodeClipboardWorkbenchFileNameW(buffer: Buffer): string[] {
  return buffer
    .toString("utf16le")
    .split("\0")
    .map((part) => part.trim())
    .filter(Boolean);
}

export function mergeClipboardWorkbenchTextItems(
  values: string[],
  mode: "direct" | "newline" | "blank-line" | "custom",
  customSeparator = ""
): string {
  const separator =
    mode === "direct"
      ? ""
      : mode === "newline"
        ? "\n"
        : mode === "blank-line"
          ? "\n\n"
          : customSeparator;
  return values.map(normalizeClipboardWorkbenchText).filter(Boolean).join(separator);
}

export function selectClipboardWorkbenchEvictionIds(
  items: Array<{
    id: string;
    pinned: number;
    favorite: number;
    byteSize: number;
    createdAt: number;
  }>,
  limits: { maxItems: number; maxBytes: number }
): string[] {
  const ordered = [...items].sort((left, right) => {
    if (left.pinned !== right.pinned) {
      return left.pinned - right.pinned;
    }
    if (left.favorite !== right.favorite) {
      return left.favorite - right.favorite;
    }
    return left.createdAt - right.createdAt;
  });

  const keep = new Set<string>();
  let bytes = 0;
  for (const item of ordered.slice().reverse()) {
    if (keep.size >= limits.maxItems) {
      continue;
    }
    if (bytes + item.byteSize > limits.maxBytes) {
      continue;
    }
    keep.add(item.id);
    bytes += item.byteSize;
  }
  return ordered.filter((item) => !keep.has(item.id)).map((item) => item.id);
}
```

- [ ] **Step 5: Run the pure-helper tests again**

Run: `pnpm run build && node dist/test/clipboard-workbench-normalize.test.js && node dist/test/clipboard-workbench-safety-rules.test.js && node dist/test/clipboard-workbench-merge.test.js && node dist/test/clipboard-workbench-retention.test.js`

Expected: all four test files pass with exit code `0`.

- [ ] **Step 6: Commit the shared-helper slice**

```bash
git add src/shared/clipboard-workbench.ts src/test/clipboard-workbench-normalize.test.ts src/test/clipboard-workbench-safety-rules.test.ts src/test/clipboard-workbench-merge.test.ts src/test/clipboard-workbench-retention.test.ts
git commit -m "feat: add clipboard workbench shared helpers"
```

### Task 2: Persistent Store And Asset Lifecycle

**Files:**
- Create: `src/main/plugins/clipboard-workbench/store.ts`
- Test: `src/test/clipboard-workbench-store.test.ts`

- [ ] **Step 1: Write the failing store tests against a temp sqlite file and asset directory**

```ts
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import { ClipboardWorkbenchStore } from "../main/plugins/clipboard-workbench/store";

test("store upserts by hash and removes asset files on delete", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ll-clipboard-workbench-store-"));
  const dbPath = path.join(root, "litelauncher.db");
  const assetsDir = path.join(root, "assets");
  const store = new ClipboardWorkbenchStore(dbPath, assetsDir);
  await store.init();

  const saved = await store.saveItem({
    kind: "image",
    source: "manual",
    summary: "shot.png",
    hash: "hash-image-1",
    mimeType: "image/png",
    byteSize: 67,
    assetFileName: "shot.png",
    assetBytes: Buffer.from("iVBORw0KGgo=", "base64")
  });

  assert.ok(saved.assetPath);
  await store.deleteItems([saved.id]);
  assert.equal(await fs.access(path.join(assetsDir, saved.assetPath)).then(() => true, () => false), false);
  await store.close();
});

test("store reads default settings and persists updates in the shared settings table", async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "ll-clipboard-workbench-settings-"));
  const store = new ClipboardWorkbenchStore(
    path.join(root, "litelauncher.db"),
    path.join(root, "assets")
  );
  await store.init();
  const defaults = await store.getSettings();
  assert.equal(defaults.maxItems, 50);
  await store.saveSettings({ ...defaults, sensitiveMode: true });
  const next = await store.getSettings();
  assert.equal(next.sensitiveMode, true);
  await store.close();
});
```

- [ ] **Step 2: Run the store test and confirm it fails**

Run: `pnpm run build && node dist/test/clipboard-workbench-store.test.js`

Expected: build/test fails because `ClipboardWorkbenchStore` does not exist yet.

- [ ] **Step 3: Implement table setup and settings persistence in the store**

```ts
const SETTINGS_KEY = "plugin.clipboard-workbench.settings";

await this.run(`CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
)`);

await this.run(`CREATE TABLE IF NOT EXISTS clipboard_workbench_items (
  id TEXT PRIMARY KEY,
  kind TEXT NOT NULL,
  source TEXT NOT NULL,
  title TEXT,
  summary TEXT NOT NULL,
  textContent TEXT,
  fileListJson TEXT,
  assetPath TEXT,
  mimeType TEXT,
  byteSize INTEGER NOT NULL,
  width INTEGER,
  height INTEGER,
  hash TEXT NOT NULL,
  groupId TEXT,
  tagsJson TEXT NOT NULL,
  note TEXT,
  favorite INTEGER NOT NULL,
  pinned INTEGER NOT NULL,
  sensitive INTEGER NOT NULL,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL,
  lastPastedAt INTEGER
)`);

await this.run(`CREATE TABLE IF NOT EXISTS clipboard_workbench_groups (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  createdAt INTEGER NOT NULL,
  updatedAt INTEGER NOT NULL
)`);
```

- [ ] **Step 4: Implement item save/list/delete and retention support**

```ts
export interface ClipboardWorkbenchStoredInput {
  kind: "text" | "image" | "files";
  source: "auto" | "manual" | "screenshot";
  title?: string;
  summary: string;
  textContent?: string;
  fileListJson?: string;
  mimeType?: string;
  byteSize: number;
  width?: number;
  height?: number;
  hash: string;
  groupId?: string;
  tags?: string[];
  note?: string;
  favorite?: 0 | 1;
  pinned?: 0 | 1;
  sensitive?: 0 | 1;
  assetFileName?: string;
  assetBytes?: Buffer;
}

export interface ClipboardWorkbenchStoredRow {
  id: string;
  assetPath: string | null;
}

export class ClipboardWorkbenchStore {
  async saveItem(input: ClipboardWorkbenchStoredInput): Promise<ClipboardWorkbenchStoredRow> {
    const now = Date.now();
    const existing = await this.get<{ id: string; assetPath: string | null }>(
      "SELECT id, assetPath FROM clipboard_workbench_items WHERE hash = ?",
      [input.hash]
    );

    const id = existing?.id ?? `cbw-${now}-${Math.random().toString(36).slice(2, 10)}`;
    const assetPath = input.assetBytes
      ? await this.writeAssetFile(id, input.assetFileName, input.assetBytes)
      : existing?.assetPath ?? null;

    await this.run(
      `INSERT INTO clipboard_workbench_items (
         id, kind, source, title, summary, textContent, fileListJson, assetPath, mimeType,
         byteSize, width, height, hash, groupId, tagsJson, note, favorite, pinned, sensitive,
         createdAt, updatedAt, lastPastedAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         summary = excluded.summary,
         textContent = excluded.textContent,
         fileListJson = excluded.fileListJson,
         assetPath = excluded.assetPath,
         mimeType = excluded.mimeType,
         byteSize = excluded.byteSize,
         width = excluded.width,
         height = excluded.height,
         updatedAt = excluded.updatedAt`,
      [id, input.kind, input.source, input.title ?? null, input.summary, input.textContent ?? null, input.fileListJson ?? null, assetPath, input.mimeType ?? null, input.byteSize, input.width ?? null, input.height ?? null, input.hash, input.groupId ?? null, JSON.stringify(input.tags ?? []), input.note ?? null, input.favorite ?? 0, input.pinned ?? 0, input.sensitive ?? 0, existing ? now : now, now, null]
    );

    return this.requireItem(id);
  }

  async deleteItems(ids: string[]): Promise<number> {
    const rows = await this.all<{ assetPath: string | null }>(
      `SELECT assetPath FROM clipboard_workbench_items WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    const changes = await this.runWithChanges(
      `DELETE FROM clipboard_workbench_items WHERE id IN (${ids.map(() => "?").join(",")})`,
      ids
    );
    await Promise.all(rows.map((row) => this.removeAssetFile(row.assetPath)));
    return changes;
  }
}
```

- [ ] **Step 5: Run the store test again**

Run: `pnpm run build && node dist/test/clipboard-workbench-store.test.js`

Expected: store tests pass and temp asset cleanup assertions succeed.

- [ ] **Step 6: Commit the store slice**

```bash
git add src/main/plugins/clipboard-workbench/store.ts src/test/clipboard-workbench-store.test.ts
git commit -m "feat: add clipboard workbench store"
```

### Task 3: Service Runtime, Clipboard Collector, And Paste Fallbacks

**Files:**
- Create: `src/main/plugins/clipboard-workbench/collector.ts`
- Create: `src/main/plugins/clipboard-workbench/paste.ts`
- Create: `src/main/plugins/clipboard-workbench/service.ts`
- Test: `src/test/clipboard-workbench-service.test.ts`

- [ ] **Step 1: Write the failing service tests for manual save, paused collection, and sequential-paste fallback**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { ClipboardWorkbenchService } from "../main/plugins/clipboard-workbench/service";

test("manual text save returns a refreshed payload", async () => {
  const service = await ClipboardWorkbenchService.createForTest();
  const result = await service.saveManualText("alpha\nbeta");
  assert.equal(result.payload.items[0]?.summary, "alpha");
});

test("sensitive mode flips panel state but keeps manual save available", async () => {
  const service = await ClipboardWorkbenchService.createForTest();
  const toggled = await service.setSensitiveMode(true);
  assert.equal(toggled.payload.settings.sensitiveMode, true);
  const manualResult = await service.saveManualText("manual-only");
  assert.equal(manualResult.payload.items.length, 1);
});

test("sequential paste falls back to restore-only message when send shortcut fails", async () => {
  const service = await ClipboardWorkbenchService.createForTest({
    sendPasteShortcut: async () => ({ ok: false, mode: "restore-only" })
  });
  const saved = await service.saveManualText("alpha");
  const first = saved.payload.items[0];
  const result = await service.pasteItems([first.id], "sequential");
  assert.match(result.message, /已恢复到系统剪贴板/);
});
```

- [ ] **Step 2: Run the service test and confirm it fails**

Run: `pnpm run build && node dist/test/clipboard-workbench-service.test.js`

Expected: service test fails because the runtime classes do not exist yet.

- [ ] **Step 3: Implement clipboard classification helpers in `collector.ts`**

```ts
export function collectClipboardWorkbenchSnapshot(
  runtime: ClipboardWorkbenchCollectorRuntime,
  settings: ClipboardWorkbenchSettings
): ClipboardWorkbenchCollectedInput | null {
  const fileBuffer = runtime.readBuffer?.("FileNameW") ?? Buffer.alloc(0);
  const filePaths = decodeClipboardWorkbenchFileNameW(fileBuffer);
  if (filePaths.length > 0) {
    return {
      kind: "files",
      source: "auto",
      summary: path.basename(filePaths[0] ?? "files"),
      fileListJson: JSON.stringify(filePaths),
      byteSize: Buffer.byteLength(filePaths.join("\n"), "utf8"),
      hash: runtime.hash(`files:${filePaths.join("\n")}`)
    };
  }

  const image = runtime.readImage();
  if (!image.isEmpty()) {
    const pngBytes = image.toPNG();
    return {
      kind: "image",
      source: runtime.isLikelyScreenshot() ? "screenshot" : "auto",
      summary: `图片 ${image.getSize().width}x${image.getSize().height}`,
      mimeType: "image/png",
      assetBytes: pngBytes,
      assetFileName: "clipboard.png",
      width: image.getSize().width,
      height: image.getSize().height,
      byteSize: pngBytes.length,
      hash: runtime.hash(pngBytes)
    };
  }

  const text = normalizeClipboardWorkbenchText(runtime.readText());
  if (!text || shouldIgnoreClipboardWorkbenchText(text, settings)) {
    return null;
  }
  return {
    kind: "text",
    source: "auto",
    summary: text.split("\n")[0] ?? text,
    textContent: text,
    byteSize: Buffer.byteLength(text, "utf8"),
    hash: runtime.hash(`text:${text}`)
  };
}
```

- [ ] **Step 4: Implement restore and Windows-first sequential paste helpers in `paste.ts`**

```ts
export function buildWindowsSequentialPasteScript(delayMs: number): string {
  return [
    "$ErrorActionPreference='Stop'",
    "Add-Type -AssemblyName System.Windows.Forms",
    `[System.Windows.Forms.SendKeys]::SendWait('^v')`,
    `Start-Sleep -Milliseconds ${delayMs}`
  ].join("; ");
}

export async function performClipboardWorkbenchSequentialPaste(
  itemCount: number,
  delayMs: number,
  runtime: ClipboardWorkbenchPasteRuntime
): Promise<{ ok: boolean; mode: "sequential" | "restore-only" }> {
  if (process.platform !== "win32") {
    return { ok: false, mode: "restore-only" };
  }
  for (let index = 0; index < itemCount; index += 1) {
    const next = await runtime.sendPasteShortcut(buildWindowsSequentialPasteScript(delayMs));
    if (!next.ok) {
      return { ok: false, mode: "restore-only" };
    }
  }
  return { ok: true, mode: "sequential" };
}
```

- [ ] **Step 5: Implement the orchestrating service in `service.ts`**

```ts
export interface ClipboardWorkbenchRuntime {
  readText(): string;
  readImage(): NativeImage;
  readBuffer(format: string): Buffer;
  hash(value: string | Buffer): string;
  sendPasteShortcut(script: string): Promise<{ ok: boolean; mode: "sequential" | "restore-only" }>;
}

export interface ClipboardWorkbenchActionResult {
  message: string;
  payload: ClipboardWorkbenchPanelPayload;
}

function createClipboardWorkbenchRuntimeForTests(
  overrides: Partial<ClipboardWorkbenchRuntime> = {}
): ClipboardWorkbenchRuntime {
  return {
    readText: () => "",
    readImage: () => nativeImage.createEmpty(),
    readBuffer: () => Buffer.alloc(0),
    hash: (value) =>
      createHash("sha1")
        .update(typeof value === "string" ? value : value)
        .digest("hex"),
    sendPasteShortcut: async () => ({ ok: true, mode: "sequential" }),
    ...overrides
  };
}

export class ClipboardWorkbenchService {
  static async createForTest(overrides: Partial<ClipboardWorkbenchRuntime> = {}) {
    const service = new ClipboardWorkbenchService({
      dbPath: path.join(os.tmpdir(), `ll-cbw-${Date.now()}.db`),
      assetsDir: path.join(os.tmpdir(), `ll-cbw-assets-${Date.now()}`),
      runtime: createClipboardWorkbenchRuntimeForTests(overrides)
    });
    await service.init();
    return service;
  }

  async saveManualText(text: string): Promise<ClipboardWorkbenchActionResult> {
    const normalized = normalizeClipboardWorkbenchText(text);
    const saved = await this.store.saveItem({
      kind: "text",
      source: "manual",
      summary: normalized.split("\n")[0] ?? normalized,
      textContent: normalized,
      byteSize: Buffer.byteLength(normalized, "utf8"),
      hash: this.runtime.hash(`manual:${normalized}`),
      sensitive: this.settings.sensitiveMode ? 1 : 0
    });
    await this.applyRetention();
    return this.buildActionResult(`已保存：${saved.summary}`);
  }

  async setSensitiveMode(enabled: boolean): Promise<ClipboardWorkbenchActionResult> {
    this.settings = { ...this.settings, sensitiveMode: enabled };
    await this.store.saveSettings(this.settings);
    return this.buildActionResult(enabled ? "已开启敏感会话模式" : "已关闭敏感会话模式");
  }

  async pasteItems(
    ids: string[],
    mode: ClipboardWorkbenchPasteMode
  ): Promise<ClipboardWorkbenchActionResult> {
    const items = await this.store.getItemsByIds(ids);
    const pasteResult =
      mode === "merge-once"
        ? await this.restoreMergedText(items)
        : await this.restoreSequentialItems(items);
    return this.buildActionResult(pasteResult.message);
  }
}
```

- [ ] **Step 6: Run the service test again**

Run: `pnpm run build && node dist/test/clipboard-workbench-service.test.js`

Expected: service tests pass, including the restore-only fallback message path.

- [ ] **Step 7: Commit the runtime slice**

```bash
git add src/main/plugins/clipboard-workbench/collector.ts src/main/plugins/clipboard-workbench/paste.ts src/main/plugins/clipboard-workbench/service.ts src/test/clipboard-workbench-service.test.ts
git commit -m "feat: add clipboard workbench service runtime"
```

### Task 4: Plugin Command Surface And Main-Process Lifecycle Wiring

**Files:**
- Create: `src/main/plugins/clipboard-workbench/index.ts`
- Modify: `src/main/plugins/index.ts`
- Modify: `src/main/index.ts`
- Test: `src/test/clipboard-workbench-plugin.test.ts`
- Modify: `src/test/visible-plugins-regression.test.ts`

- [ ] **Step 1: Write the failing plugin contract test**

```ts
import assert from "node:assert/strict";
import test from "node:test";

import { IPC_CHANNELS } from "../shared/channels";
import { executePluginCommand } from "../main/plugins";
import { setClipboardWorkbenchServiceForTest } from "../main/plugins/clipboard-workbench";

test("Clipboard Workbench open sends plugin panel payload", async () => {
  const sent: Array<{ channel: string; payload: unknown }> = [];
  setClipboardWorkbenchServiceForTest({
    async perform(action) {
      assert.equal(action.type, "open");
      return {
        message: "已打开 Clipboard Workbench",
        payload: { items: [], groups: [], settings: { maxItems: 50 } }
      };
    }
  });

  const result = await executePluginCommand(
    "clipboard-workbench",
    { webContents: { send: (channel: string, payload: unknown) => sent.push({ channel, payload }) } } as never,
    {
      id: "plugin:clipboard-workbench",
      type: "command",
      title: "Clipboard Workbench",
      subtitle: "test",
      target: "command:plugin:clipboard-workbench",
      keywords: ["plugin"]
    }
  );

  assert.equal(result.ok, true);
  assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);
});
```

- [ ] **Step 2: Run the plugin contract test and confirm it fails**

Run: `pnpm run build && node dist/test/clipboard-workbench-plugin.test.js`

Expected: build fails because the plugin entrypoint and test hook are missing.

- [ ] **Step 3: Implement the plugin action parser and open-panel contract**

```ts
type ClipboardWorkbenchActionType =
  | "open"
  | "refresh"
  | "save-current"
  | "save-manual-text"
  | "toggle-collect"
  | "toggle-sensitive"
  | "restore-item"
  | "paste-batch"
  | "set-favorite"
  | "set-pinned"
  | "assign-group"
  | "save-item-meta"
  | "create-group"
  | "delete-items"
  | "clear-all"
  | "import-image-files"
  | "import-file-list"
  | "export-item";

const QUERY_ALIASES = ["clipx", "cb", "clipboard"];

let clipboardWorkbenchService: ClipboardWorkbenchServiceLike | null = null;

export function setClipboardWorkbenchService(next: ClipboardWorkbenchServiceLike | null): void {
  clipboardWorkbenchService = next;
}

export function setClipboardWorkbenchServiceForTest(
  next: ClipboardWorkbenchServiceLike | null
): void {
  clipboardWorkbenchService = next;
}
```

- [ ] **Step 4: Register the plugin and wire service lifecycle in `src/main/index.ts`**

```ts
let clipboardWorkbenchService: ClipboardWorkbenchService | null = null;

async function ensureDataLayer(): Promise<void> {
  const dbPath = path.join(app.getPath("userData"), "litelauncher.db");
  if (!database) {
    database = new LiteDatabase(dbPath);
    await database.init();
  }

  if (!clipboardWorkbenchService) {
    clipboardWorkbenchService = new ClipboardWorkbenchService({
      dbPath,
      assetsDir: path.join(app.getPath("userData"), "clipboard-workbench", "assets")
    });
    await clipboardWorkbenchService.init();
    setClipboardWorkbenchService(clipboardWorkbenchService);
  }
}

if (clipboardWorkbenchService) {
  clipboardWorkbenchService.start();
}

if (clipboardWorkbenchService) {
  clipboardWorkbenchService.stop();
  await clipboardWorkbenchService.close();
  clipboardWorkbenchService = null;
  setClipboardWorkbenchService(null);
}
```

- [ ] **Step 5: Add the plugin to visible-plugin defaults and upgrade rules**

```ts
const REQUIRED_VISIBLE_PLUGIN_IDS = [
  "hardware-inspector",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-image-prompt",
  "codeagent-switch",
  "clipboard-workbench"
] as const;

const CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "clipboard-workbench",
  "webtools-password",
  "webtools-cron",
  "webtools-json",
  "webtools-crypto",
  "webtools-jwt",
  "webtools-timestamp",
  "webtools-strings",
  "webtools-colors",
  "webtools-diff",
  "webtools-http-mock",
  "webtools-image-base64",
  "webtools-image-prompt",
  "webtools-config-convert",
  "webtools-sql-format",
  "webtools-unit-convert",
  "webtools-file-hash",
  "webtools-port-helper",
  "webtools-regex",
  "webtools-url-parse",
  "webtools-qrcode",
  "webtools-markdown",
  "webtools-ua",
  "webtools-api-client",
  "codeagent-switch"
] as const;
```

- [ ] **Step 6: Run the plugin and visibility regression tests**

Run: `pnpm run build && node dist/test/clipboard-workbench-plugin.test.js && node dist/test/visible-plugins-regression.test.js && node dist/test/plugin-visibility-config.test.js`

Expected: the new plugin opens through `IPC_CHANNELS.openPanel`, and visibility regressions pass with `clipboard-workbench` included.

- [ ] **Step 7: Commit the plugin wiring slice**

```bash
git add src/main/plugins/clipboard-workbench/index.ts src/main/plugins/index.ts src/main/index.ts src/test/clipboard-workbench-plugin.test.ts src/test/visible-plugins-regression.test.ts
git commit -m "feat: register clipboard workbench plugin"
```

### Task 5: Renderer Plumbing And Read-Only Panel Shell

**Files:**
- Modify: `src/renderer/plugin-constants.ts`
- Modify: `src/renderer/global.d.ts`
- Modify: `src/renderer/plugin-handler-config.ts`
- Modify: `src/renderer/renderer.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/styles.css`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Extend the regression test first so renderer wiring is forced through `plugin-panel-impls.ts`**

```ts
test("Clipboard Workbench panel is implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const stylesSource = readRendererStylesSource();

  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderClipboardWorkbenchPanel/,
    "Clipboard Workbench handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyClipboardWorkbenchPanelPayload/,
    "Clipboard Workbench handler should apply payload through panelImplsSafe"
  );
  assert.equal(
    rendererSource.includes("function renderClipboardWorkbenchPanel"),
    false,
    "Clipboard Workbench render implementation should live outside renderer.ts"
  );
  assert.match(panelImplsSource, /renderClipboardWorkbenchPanel\(\): void/);
  assert.match(panelImplsSource, /applyClipboardWorkbenchPanelPayload\(panel: unknown\): void/);
  assert.match(stylesSource, /\.clipboard-workbench-shell/);
});
```

- [ ] **Step 2: Run the renderer regression test and confirm it fails**

Run: `pnpm run build && node dist/test/plugin-panel-impls-regression.test.js`

Expected: assertions fail because there is no Clipboard Workbench handler or shell yet.

- [ ] **Step 3: Add constants and handler signatures**

```ts
HARDWARE_INSPECTOR_PLUGIN_ID: "hardware-inspector",
CLIPBOARD_WORKBENCH_PLUGIN_ID: "clipboard-workbench",
WEBTOOLS_PASSWORD_PLUGIN_ID: "webtools-password",

DEFAULT_VISIBLE_PLUGIN_IDS: [
  "cashflow-game",
  "hardware-inspector",
  "clipboard-workbench",
  "webtools-password"
]

interface RendererPluginConstants {
  CLIPBOARD_WORKBENCH_PLUGIN_ID: string;
  DEFAULT_VISIBLE_PLUGIN_IDS: string[];
}

interface RendererPanelImpls {
  applyClipboardWorkbenchPanelPayload(panel: unknown): void;
  renderClipboardWorkbenchPanel(): void;
}
```

- [ ] **Step 4: Add renderer handler wiring**

```ts
const CLIPBOARD_WORKBENCH_PLUGIN_ID = "clipboard-workbench";

const pluginPanelHandlers: Readonly<Record<string, PluginPanelHandler>> = {
  [CLIPBOARD_WORKBENCH_PLUGIN_ID]: {
    render: panelImplsSafe.renderClipboardWorkbenchPanel,
    onOpen: panelImplsSafe.applyClipboardWorkbenchPanelPayload,
    onEnter: runWithPluginForm("form.clipboard-workbench-form", () => {
      void executeClipboardWorkbenchAction("refresh");
    })
  }
};
```

- [ ] **Step 5: Add read-only panel state and shell rendering in `plugin-panel-impls.ts` and `styles.css`**

```ts
type ClipboardWorkbenchItemView = {
  id: string;
  kind: "text" | "image" | "files";
  source: "auto" | "manual" | "screenshot";
  title: string;
  summary: string;
  note: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  createdAt: number;
  previewText?: string;
  assetDataUrl?: string;
  filePaths?: string[];
};

let clipboardWorkbenchPanelData: {
  items: ClipboardWorkbenchItemView[];
  groups: Array<{ id: string; name: string; count: number }>;
  settings: { autoCollect: boolean; sensitiveMode: boolean; maxItems: number; maxBytes: number };
  stats: { totalItems: number; totalBytes: number };
  query: { search: string; scope: string; groupId: string };
} = {
  items: [],
  groups: [],
  settings: { autoCollect: true, sensitiveMode: false, maxItems: 50, maxBytes: 512 * 1024 * 1024 },
  stats: { totalItems: 0, totalBytes: 0 },
  query: { search: "", scope: "all", groupId: "" }
};
```

```css
.clipboard-workbench-shell {
  display: grid;
  grid-template-columns: minmax(180px, 220px) minmax(300px, 0.95fr) minmax(320px, 1.1fr);
  gap: 14px;
}

.clipboard-workbench-toolbar,
.clipboard-workbench-rail,
.clipboard-workbench-list,
.clipboard-workbench-detail {
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  background: rgba(20, 28, 36, 0.72);
}
```

- [ ] **Step 6: Run the renderer regression test again**

Run: `pnpm run build && node dist/test/plugin-panel-impls-regression.test.js`

Expected: Clipboard Workbench wiring assertions pass and no renderer-owned render function exists.

- [ ] **Step 7: Commit the renderer shell slice**

```bash
git add src/renderer/plugin-constants.ts src/renderer/global.d.ts src/renderer/plugin-handler-config.ts src/renderer/renderer.ts src/renderer/plugin-panel-impls.ts src/renderer/styles.css src/test/plugin-panel-impls-regression.test.ts
git commit -m "feat: scaffold clipboard workbench panel"
```

### Task 6: Interactive Panel Actions, Metadata Editing, And Batch Workflows

**Files:**
- Modify: `src/main/plugins/clipboard-workbench/service.ts`
- Modify: `src/main/plugins/clipboard-workbench/index.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/renderer/styles.css`
- Modify: `src/test/clipboard-workbench-plugin.test.ts`

- [ ] **Step 1: Extend the plugin contract test for action forwarding and payload refresh**

```ts
test("Clipboard Workbench save-manual-text forwards draft text and returns refreshed data", async () => {
  setClipboardWorkbenchServiceForTest({
    async perform(action) {
      assert.equal(action.type, "save-manual-text");
      assert.equal(action.manualText, "alpha");
      return {
        message: "已保存：alpha",
        payload: {
          items: [{ id: "1", kind: "text", source: "manual", summary: "alpha", title: "alpha", note: "", tags: [], favorite: false, pinned: false, createdAt: Date.now() }],
          groups: [],
          settings: { autoCollect: true, sensitiveMode: false, maxItems: 50, maxBytes: 512 * 1024 * 1024 },
          stats: { totalItems: 1, totalBytes: 5 },
          query: { search: "", scope: "all", groupId: "" }
        }
      };
    }
  });
});
```

- [ ] **Step 2: Run the plugin contract test and confirm the new action coverage fails**

Run: `pnpm run build && node dist/test/clipboard-workbench-plugin.test.js`

Expected: action-forwarding assertion fails because the plugin/parser does not yet send `save-manual-text`.

- [ ] **Step 3: Implement the full action payload contract in the main-process plugin/service**

```ts
export interface ClipboardWorkbenchActionInput {
  type: ClipboardWorkbenchActionType;
  search?: string;
  scope?: ClipboardWorkbenchListScope;
  groupId?: string;
  itemIds?: string[];
  manualText?: string;
  note?: string;
  title?: string;
  tags?: string[];
  favorite?: boolean;
  pinned?: boolean;
  pasteMode?: ClipboardWorkbenchPasteMode;
  mergeSeparatorMode?: "direct" | "newline" | "blank-line" | "custom";
  mergeCustomSeparator?: string;
}

async perform(input: ClipboardWorkbenchActionInput): Promise<ClipboardWorkbenchActionResult> {
  switch (input.type) {
    case "save-manual-text":
      return this.saveManualText(input.manualText ?? "");
    case "toggle-collect":
      return this.setAutoCollect(!this.settings.autoCollect);
    case "toggle-sensitive":
      return this.setSensitiveMode(!this.settings.sensitiveMode);
    case "restore-item":
      return this.restoreItem(input.itemIds?.[0] ?? "");
    case "paste-batch":
      return this.pasteItems(input.itemIds ?? [], input.pasteMode ?? "sequential");
    case "set-favorite":
      return this.setFavorite(input.itemIds ?? [], Boolean(input.favorite));
    case "set-pinned":
      return this.setPinned(input.itemIds ?? [], Boolean(input.pinned));
    case "assign-group":
      return this.assignGroup(input.itemIds ?? [], input.groupId ?? "");
    case "save-item-meta":
      return this.saveItemMeta(input.itemIds?.[0] ?? "", input.title ?? "", input.note ?? "", input.tags ?? []);
    default:
      return this.refresh(input);
  }
}
```

- [ ] **Step 4: Implement renderer action builders and selection-aware refresh**

```ts
async function executeClipboardWorkbenchAction(
  action: string,
  params: Record<string, string | string[]> = {}
): Promise<void> {
  const launcher = getLauncherApi();
  if (!launcher) {
    setStatus("桥接层未加载，无法操作 Clipboard Workbench");
    return;
  }

  const searchParams = new URLSearchParams();
  searchParams.set("action", action);
  for (const [key, value] of Object.entries(params)) {
    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, item));
    } else if (value) {
      searchParams.set(key, value);
    }
  }

  const result = await launcher.execute({
    id: `plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}:${action}`,
    type: "command",
    title: "Clipboard Workbench",
    subtitle: "panel action",
    target: `command:plugin:${CLIPBOARD_WORKBENCH_PLUGIN_ID}?${searchParams.toString()}`,
    keywords: ["plugin", "clipboard", "workbench"]
  });

  if (result.ok && activePluginPanel) {
    activePluginPanel.data = result.data ?? activePluginPanel.data;
    panelImplsSafe.applyClipboardWorkbenchPanelPayload(activePluginPanel);
    renderList();
  }
  setStatus(result.message ?? (result.ok ? "Clipboard Workbench 已更新" : "Clipboard Workbench 操作失败"));
}

async function refreshClipboardWorkbenchPanel(): Promise<void> {
  await executeClipboardWorkbenchAction("refresh");
}
```

- [ ] **Step 5: Render interactive controls for manual save, selection, metadata, and batch bars**

```ts
const saveManualButton = document.createElement("button");
saveManualButton.type = "button";
saveManualButton.className = "settings-btn settings-btn-primary";
saveManualButton.dataset.clipboardWorkbenchSaveManual = "1";
saveManualButton.textContent = "保存文本";
saveManualButton.addEventListener("click", () => {
  void executeClipboardWorkbenchAction("save-manual-text", {
    manualText: clipboardWorkbenchManualText
  });
});

const sequentialButton = document.createElement("button");
sequentialButton.type = "button";
sequentialButton.className = "settings-btn settings-btn-secondary";
sequentialButton.textContent = "连续逐条粘贴";
sequentialButton.addEventListener("click", () => {
  void executeClipboardWorkbenchAction("paste-batch", {
    pasteMode: "sequential",
    itemIds: clipboardWorkbenchSelectedIds
  });
});

const mergeButton = document.createElement("button");
mergeButton.type = "button";
mergeButton.className = "settings-btn settings-btn-secondary";
mergeButton.textContent = "合并后一次粘贴";
mergeButton.addEventListener("click", () => {
  void executeClipboardWorkbenchAction("paste-batch", {
    pasteMode: "merge-once",
    mergeSeparatorMode: clipboardWorkbenchMergeSeparatorMode,
    mergeCustomSeparator: clipboardWorkbenchMergeCustomSeparator,
    itemIds: clipboardWorkbenchSelectedIds
  });
});
```

- [ ] **Step 6: Run the plugin contract test again**

Run: `pnpm run build && node dist/test/clipboard-workbench-plugin.test.js`

Expected: plugin action-forwarding tests pass and refreshed payloads keep the panel open.

- [ ] **Step 7: Commit the interactive-action slice**

```bash
git add src/main/plugins/clipboard-workbench/service.ts src/main/plugins/clipboard-workbench/index.ts src/renderer/plugin-panel-impls.ts src/renderer/styles.css src/test/clipboard-workbench-plugin.test.ts
git commit -m "feat: add clipboard workbench batch workflows"
```

### Task 7: Responsive Smoke Coverage And Final Verification

**Files:**
- Modify: `src/test/e2e-plugin-panels-smoke.test.ts`
- Modify: `src/test/visible-plugins-regression.test.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Add the Clipboard Workbench smoke flow**

```ts
await openPluginFromSearch(
  page,
  "clipx",
  "Clipboard Workbench",
  "clipboard-workbench"
);

const clipboardForm = page.locator("form.clipboard-workbench-form");
await assertPanelFitsNarrowViewport("form.clipboard-workbench-form");

await clipboardForm.locator('textarea[name="clipboardWorkbenchManualText"]').fill("alpha");
await clipboardForm.locator('[data-clipboard-workbench-save-manual="1"]').click();
await clipboardForm.locator('textarea[name="clipboardWorkbenchManualText"]').fill("beta");
await clipboardForm.locator('[data-clipboard-workbench-save-manual="1"]').click();

await page.waitForFunction(() => {
  return document.querySelectorAll("[data-clipboard-workbench-item-id]").length >= 2;
});

await clipboardForm
  .locator('[data-clipboard-workbench-item-toggle]')
  .nth(0)
  .click();
await clipboardForm
  .locator('[data-clipboard-workbench-item-toggle]')
  .nth(1)
  .click();

await clipboardForm
  .locator(".clipboard-workbench-bulk-bar")
  .waitFor({ state: "visible", timeout: 10000 });
```

- [ ] **Step 2: Run the smoke test and confirm it fails before UI selectors exist**

Run: `pnpm run build && node dist/test/e2e-plugin-panels-smoke.test.js`

Expected: failure on `clipx` search or missing `form.clipboard-workbench-form`.

- [ ] **Step 3: Implement the missing selectors and narrow-width layout guarantees**

```css
.clipboard-workbench-shell {
  display: grid;
  gap: 14px;
  grid-template-columns: minmax(180px, 220px) minmax(300px, 0.95fr) minmax(320px, 1.1fr);
}

.clipboard-workbench-bulk-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 760px) {
  .clipboard-workbench-shell {
    grid-template-columns: minmax(0, 1fr);
  }
}
```

- [ ] **Step 4: Run the full verification set**

Run: `pnpm run build`

Expected: TypeScript build succeeds.

Run: `pnpm run typecheck`

Expected: `tsc --noEmit` exits `0`.

Run: `node dist/test/clipboard-workbench-normalize.test.js && node dist/test/clipboard-workbench-safety-rules.test.js && node dist/test/clipboard-workbench-merge.test.js && node dist/test/clipboard-workbench-retention.test.js && node dist/test/clipboard-workbench-store.test.js && node dist/test/clipboard-workbench-service.test.js && node dist/test/clipboard-workbench-plugin.test.js && node dist/test/visible-plugins-regression.test.js && node dist/test/plugin-panel-impls-regression.test.js && node dist/test/e2e-plugin-panels-smoke.test.js`

Expected: all targeted Clipboard Workbench tests and affected regressions pass with exit code `0`.

- [ ] **Step 5: Commit the verification slice**

```bash
git add src/test/e2e-plugin-panels-smoke.test.ts src/test/visible-plugins-regression.test.ts src/test/plugin-panel-impls-regression.test.ts
git commit -m "test: cover clipboard workbench regressions"
```

## Spec Coverage Checklist

- New independent plugin, no `clip` modifications: covered by Tasks 2-7, plus explicit “Do Not Modify” guardrail.
- Auto collect + manual save/manual supplement: Tasks 3 and 6.
- Text, image, screenshot, file-path list support: Tasks 1-3.
- Search, favorites, pinning, groups, note/tags: Tasks 2 and 6.
- Single restore + sequential multi-paste + merge-once: Tasks 3 and 6.
- Pause listening + sensitive mode + short-code exclusion: Tasks 1, 3, and 6.
- Item limit `50` + total byte limit + pinned-last eviction: Tasks 1-3.
- Windows-first best-effort sequential auto-paste fallback: Task 3.
- Default visible plugin + query aliases without taking over `clip`: Task 4.
- Three-column responsive workbench UI and smoke coverage: Tasks 5 and 7.

## Placeholder Scan

- Forbidden placeholders such as `TODO`, `TBD`, `implement later`, and “similar to Task N” are intentionally absent.
- Every test command names a concrete compiled test file.
- Every code-change step includes concrete function/type/action names that are reused consistently across later tasks.

## Type Consistency Notes

- Use `ClipboardWorkbenchSettings` everywhere; do not invent `ClipboardWorkbenchConfig`.
- Use `ClipboardWorkbenchPasteMode` with only `"sequential"` and `"merge-once"`.
- Keep the plugin action names exactly aligned between renderer and main process:
  `open`, `refresh`, `save-current`, `save-manual-text`, `toggle-collect`, `toggle-sensitive`, `restore-item`, `paste-batch`, `set-favorite`, `set-pinned`, `assign-group`, `save-item-meta`, `create-group`, `delete-items`, `clear-all`, `import-image-files`, `import-file-list`, `export-item`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-05-15-clipboard-workbench.md`. Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

**Which approach?**
