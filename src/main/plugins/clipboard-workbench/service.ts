import { execFile } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import fsPromises from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";

import {
  ClipboardWorkbenchListScope,
  ClipboardWorkbenchMergeMode,
  ClipboardWorkbenchPasteMode,
  ClipboardWorkbenchSettings,
  createDefaultClipboardWorkbenchSettings,
  mergeClipboardWorkbenchFilePaths,
  mergeClipboardWorkbenchTextItems,
  normalizeClipboardWorkbenchText,
  selectClipboardWorkbenchEvictionIds
} from "../../../shared/clipboard-workbench";
import {
  ClipboardWorkbenchCollectedInput,
  ClipboardWorkbenchCollectorRuntime,
  ClipboardWorkbenchImageLike,
  collectClipboardWorkbenchSnapshot,
  createEmptyClipboardWorkbenchImage
} from "./collector";
import {
  ClipboardWorkbenchPasteRuntime,
  performClipboardWorkbenchSequentialPaste
} from "./paste";
import {
  ClipboardWorkbenchStore,
  ClipboardWorkbenchStoredItem
} from "./store";

type ClipboardWorkbenchQueryState = {
  search: string;
  scope: ClipboardWorkbenchListScope;
  groupId: string;
};

export type ClipboardWorkbenchActionType =
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

export interface ClipboardWorkbenchActionInput {
  type: ClipboardWorkbenchActionType;
  search?: string;
  scope?: ClipboardWorkbenchListScope;
  groupId?: string;
  itemIds?: string[];
  manualText?: string;
  pasteMode?: ClipboardWorkbenchPasteMode;
  mergeSeparatorMode?: ClipboardWorkbenchMergeMode;
  mergeCustomSeparator?: string;
}

export interface ClipboardWorkbenchPanelItem {
  id: string;
  kind: ClipboardWorkbenchStoredItem["kind"];
  source: ClipboardWorkbenchStoredItem["source"];
  title: string;
  summary: string;
  note: string;
  tags: string[];
  favorite: boolean;
  pinned: boolean;
  sensitive: boolean;
  createdAt: number;
  updatedAt: number;
  previewText?: string;
  filePaths?: string[];
  assetPath?: string;
  assetUrl?: string;
}

export interface ClipboardWorkbenchPanelPayload {
  items: ClipboardWorkbenchPanelItem[];
  groups: Array<{ id: string; name: string; count: number }>;
  settings: ClipboardWorkbenchSettings;
  stats: { totalItems: number; totalBytes: number };
  query: ClipboardWorkbenchQueryState;
}

export interface ClipboardWorkbenchActionResult {
  message: string;
  payload: ClipboardWorkbenchPanelPayload;
}

export interface ClipboardWorkbenchRuntime
  extends ClipboardWorkbenchCollectorRuntime,
    ClipboardWorkbenchPasteRuntime {
  writeText(text: string): void;
  writeImageBytes(bytes: Buffer): void;
  writeBuffer(format: string, buffer: Buffer): void;
}

type ClipboardWorkbenchServiceOptions = {
  dbPath: string;
  assetsDir: string;
  runtime?: ClipboardWorkbenchRuntime;
  pollIntervalMs?: number;
  cleanupRoot?: string | null;
  onAutoTextCollected?: (text: string) => Promise<void> | void;
};

const DEFAULT_POLL_INTERVAL_MS = 700;

function hashClipboardWorkbenchValue(value: string | Buffer): string {
  return createHash("sha1").update(value).digest("hex");
}

function createClipboardWorkbenchRuntimeForTests(
  overrides: Partial<ClipboardWorkbenchRuntime> = {}
): ClipboardWorkbenchRuntime {
  return {
    readText: () => "",
    readImage: () => createEmptyClipboardWorkbenchImage(),
    readBuffer: () => Buffer.alloc(0),
    writeText: () => undefined,
    writeImageBytes: () => undefined,
    writeBuffer: () => undefined,
    hash: hashClipboardWorkbenchValue,
    sendPasteShortcut: async () => ({ ok: true, mode: "sequential" }),
    isLikelyScreenshot: () => false,
    ...overrides
  };
}

function createClipboardWorkbenchRuntime(): ClipboardWorkbenchRuntime {
  const electron = require("electron") as typeof import("electron");

  return {
    readText: () => {
      try {
        return electron.clipboard.readText();
      } catch {
        return "";
      }
    },
    readImage: () => {
      try {
        const image = electron.clipboard.readImage();
        if (image && typeof image.isEmpty === "function") {
          return image as unknown as ClipboardWorkbenchImageLike;
        }
      } catch {
        return createEmptyClipboardWorkbenchImage();
      }
      return createEmptyClipboardWorkbenchImage();
    },
    readBuffer: (format: string) => {
      try {
        return electron.clipboard.readBuffer(format);
      } catch {
        return Buffer.alloc(0);
      }
    },
    writeText: (text: string) => {
      electron.clipboard.writeText(text);
    },
    writeImageBytes: (bytes: Buffer) => {
      const image = electron.nativeImage.createFromBuffer(bytes);
      electron.clipboard.writeImage(image);
    },
    writeBuffer: (format: string, buffer: Buffer) => {
      electron.clipboard.writeBuffer(format, buffer);
    },
    hash: hashClipboardWorkbenchValue,
    sendPasteShortcut: (script: string) => runPowerShellShortcut(script),
    isLikelyScreenshot: () => false
  };
}

function runPowerShellShortcut(
  script: string
): Promise<{ ok: boolean; mode: "sequential" | "restore-only" }> {
  if (process.platform !== "win32") {
    return Promise.resolve({ ok: false, mode: "restore-only" });
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result: { ok: boolean; mode: "sequential" | "restore-only" }) => {
      if (settled) {
        return;
      }
      settled = true;
      resolve(result);
    };

    const child = execFile(
      "powershell.exe",
      [
        "-NoProfile",
        "-NonInteractive",
        "-ExecutionPolicy",
        "Bypass",
        "-Command",
        script
      ],
      (error) => {
        finish(error ? { ok: false, mode: "restore-only" } : { ok: true, mode: "sequential" });
      }
    );

    child.once("error", () => {
      finish({ ok: false, mode: "restore-only" });
    });
  });
}

function parseClipboardWorkbenchFileList(
  value: string | null
): string[] | undefined {
  if (!value) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(value) as unknown;
    if (!Array.isArray(parsed)) {
      return undefined;
    }
    const next = parsed.filter(
      (item): item is string => typeof item === "string" && item.trim().length > 0
    );
    return next.length > 0 ? next : undefined;
  } catch {
    return undefined;
  }
}

function encodeClipboardWorkbenchFileNameW(filePaths: string[]): Buffer {
  return Buffer.from(`${filePaths.join("\0")}\0\0`, "utf16le");
}

function normalizeQueryState(
  input: Partial<ClipboardWorkbenchQueryState> = {}
): ClipboardWorkbenchQueryState {
  return {
    search: typeof input.search === "string" ? input.search : "",
    scope: input.scope ?? "all",
    groupId: typeof input.groupId === "string" ? input.groupId : ""
  };
}

export class ClipboardWorkbenchService {
  private readonly runtime: ClipboardWorkbenchRuntime;

  private readonly pollIntervalMs: number;

  private readonly cleanupRoot: string | null;

  private readonly dbPath: string;

  private readonly assetsDir: string;

  private readonly onAutoTextCollected:
    | ((text: string) => Promise<void> | void)
    | null;

  private store: ClipboardWorkbenchStore | null = null;

  private settings: ClipboardWorkbenchSettings =
    createDefaultClipboardWorkbenchSettings();

  private timer: NodeJS.Timeout | null = null;

  private collecting = false;

  private lastAutoCaptureHash = "";

  private initialized = false;

  public constructor(options: ClipboardWorkbenchServiceOptions) {
    this.dbPath = options.dbPath;
    this.assetsDir = options.assetsDir;
    this.runtime = options.runtime ?? createClipboardWorkbenchRuntime();
    this.pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    this.cleanupRoot = options.cleanupRoot ?? null;
    this.onAutoTextCollected = options.onAutoTextCollected ?? null;
  }

  public static async createForTest(
    overrides: Partial<ClipboardWorkbenchRuntime> = {},
    options: Pick<ClipboardWorkbenchServiceOptions, "onAutoTextCollected"> = {}
  ): Promise<ClipboardWorkbenchService> {
    const root = await fsPromises.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-cbw-")
    );
    const service = new ClipboardWorkbenchService({
      dbPath: path.join(root, "litelauncher.db"),
      assetsDir: path.join(root, "assets"),
      runtime: createClipboardWorkbenchRuntimeForTests(overrides),
      cleanupRoot: root,
      pollIntervalMs: 25,
      onAutoTextCollected: options.onAutoTextCollected
    });
    await service.init();
    return service;
  }

  public async init(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.store = new ClipboardWorkbenchStore(this.dbPath, this.assetsDir);
    await this.store.init();
    this.settings = await this.store.getSettings();
    this.initialized = true;
  }

  public start(): void {
    if (this.timer) {
      return;
    }

    this.timer = setInterval(() => {
      void this.collectNow();
    }, this.pollIntervalMs);
  }

  public stop(): void {
    if (!this.timer) {
      return;
    }

    clearInterval(this.timer);
    this.timer = null;
  }

  public async close(): Promise<void> {
    this.stop();

    if (this.store) {
      await this.store.close().catch(() => undefined);
      this.store = null;
    }

    if (this.cleanupRoot) {
      await fsPromises
        .rm(this.cleanupRoot, { recursive: true, force: true })
        .catch(() => undefined);
    }

    this.initialized = false;
  }

  public async perform(
    input: ClipboardWorkbenchActionInput
  ): Promise<ClipboardWorkbenchActionResult> {
    switch (input.type) {
      case "open":
      case "refresh":
        return this.refresh(input);
      case "save-current":
        return this.saveCurrentClipboard();
      case "save-manual-text":
        return this.saveManualText(input.manualText ?? "");
      case "toggle-collect":
        return this.setAutoCollect(!this.settings.autoCollect);
      case "toggle-sensitive":
        return this.setSensitiveMode(!this.settings.sensitiveMode);
      case "restore-item":
        return this.restoreItem(input.itemIds?.[0] ?? "");
      case "paste-batch":
        return this.pasteItems(
          input.itemIds ?? [],
          input.pasteMode ?? "sequential",
          input.mergeSeparatorMode ?? "newline",
          input.mergeCustomSeparator ?? ""
        );
      default:
        return this.refresh(input);
    }
  }

  public async refresh(
    query: Partial<ClipboardWorkbenchQueryState> = {}
  ): Promise<ClipboardWorkbenchActionResult> {
    return this.buildActionResult(
      "剪贴板工作台已刷新。",
      normalizeQueryState(query)
    );
  }

  public async collectNow(): Promise<boolean> {
    if (this.collecting) {
      return false;
    }
    if (!this.settings.autoCollect || this.settings.sensitiveMode) {
      return false;
    }

    this.collecting = true;
    try {
      const snapshot = collectClipboardWorkbenchSnapshot(
        this.runtime,
        this.settings
      );
      if (!snapshot) {
        return false;
      }
      if (snapshot.hash === this.lastAutoCaptureHash) {
        return false;
      }

      await this.requireStore().saveItem({
        ...snapshot,
        sensitive: this.settings.sensitiveMode ? 1 : 0
      });
      this.lastAutoCaptureHash = snapshot.hash;
      if (snapshot.kind === "text" && snapshot.textContent) {
        await Promise.resolve(this.onAutoTextCollected?.(snapshot.textContent)).catch(
          () => undefined
        );
      }
      await this.applyRetention();
      return true;
    } catch {
      return false;
    } finally {
      this.collecting = false;
    }
  }

  public async saveCurrentClipboard(): Promise<ClipboardWorkbenchActionResult> {
    const snapshot = collectClipboardWorkbenchSnapshot(this.runtime, this.settings);
    if (!snapshot) {
      return this.buildActionResult("当前剪贴板没有可保存的内容。");
    }

    const saved = await this.requireStore().saveItem(
      this.toManualStoredInput(snapshot)
    );
    await this.applyRetention();
    return this.buildActionResult(`已保存当前剪贴板：${saved.summary}`);
  }

  public async saveManualText(
    text: string
  ): Promise<ClipboardWorkbenchActionResult> {
    const normalized = normalizeClipboardWorkbenchText(text);
    if (!normalized) {
      return this.buildActionResult("没有可保存的内容。");
    }

    const saved = await this.requireStore().saveItem({
      kind: "text",
      source: "manual",
      summary: normalized.split("\n")[0] ?? normalized,
      textContent: normalized,
      byteSize: Buffer.byteLength(normalized, "utf8"),
      hash: this.runtime.hash(`manual:${normalized}`),
      sensitive: this.settings.sensitiveMode ? 1 : 0
    });
    await this.applyRetention();
    return this.buildActionResult(`已保存手动文本：${saved.summary}`);
  }

  public async setAutoCollect(
    enabled: boolean
  ): Promise<ClipboardWorkbenchActionResult> {
    this.settings = await this.requireStore().saveSettings({
      ...this.settings,
      autoCollect: enabled
    });
    return this.buildActionResult(
      enabled ? "已开启剪贴板采集。" : "已暂停剪贴板采集。"
    );
  }

  public async setSensitiveMode(
    enabled: boolean
  ): Promise<ClipboardWorkbenchActionResult> {
    this.settings = await this.requireStore().saveSettings({
      ...this.settings,
      sensitiveMode: enabled
    });
    return this.buildActionResult(
      enabled ? "已开启敏感模式。" : "已关闭敏感模式。"
    );
  }

  public async restoreItem(
    itemId: string
  ): Promise<ClipboardWorkbenchActionResult> {
    const items = await this.requireStore().getItemsByIds(itemId ? [itemId] : []);
    const item = items[0];
    if (!item) {
      return this.buildActionResult("未找到对应记录。");
    }

    const restored = await this.restoreStoredItemToClipboard(item);
    return this.buildActionResult(
      restored
        ? `已恢复到剪贴板：${item.summary}`
        : `恢复失败：${item.summary}`
    );
  }

  public async pasteItems(
    ids: string[],
    mode: ClipboardWorkbenchPasteMode,
    mergeMode: ClipboardWorkbenchMergeMode = "newline",
    customSeparator = ""
  ): Promise<ClipboardWorkbenchActionResult> {
    const items = await this.requireStore().getItemsByIds(ids);
    if (items.length === 0) {
      return this.buildActionResult("尚未选择任何记录。");
    }

    if (mode === "merge-once") {
      return this.pasteMergedItems(items, mergeMode, customSeparator);
    }

    for (const item of items) {
      const restored = await this.restoreStoredItemToClipboard(item);
      if (!restored) {
        return this.buildActionResult(`恢复失败：${item.summary}`);
      }

      const result = await performClipboardWorkbenchSequentialPaste(
        1,
        this.settings.batchPasteDelayMs,
        this.runtime
      );
      if (!result.ok) {
        return this.buildActionResult(
          "已恢复到剪贴板，请手动使用 Ctrl+V 粘贴。"
        );
      }
    }

    return this.buildActionResult(
      items.length === 1 ? "已顺序粘贴 1 条记录。" : `已顺序粘贴 ${items.length} 条记录。`
    );
  }

  private async pasteMergedItems(
    items: ClipboardWorkbenchStoredItem[],
    mergeMode: ClipboardWorkbenchMergeMode,
    customSeparator: string
  ): Promise<ClipboardWorkbenchActionResult> {
    const textItems = items.filter((item) => item.kind === "text");
    const fileItems = items.filter((item) => item.kind === "files");

    if (textItems.length === items.length) {
      const merged = mergeClipboardWorkbenchTextItems(
        textItems.map((item) => item.textContent ?? ""),
        mergeMode,
        customSeparator
      );
      this.runtime.writeText(merged);
      return this.buildActionResult("已将合并文本恢复到剪贴板。");
    }

    if (fileItems.length === items.length) {
      const merged = mergeClipboardWorkbenchFilePaths(
        fileItems.flatMap((item) => parseClipboardWorkbenchFileList(item.fileListJson) ?? []),
        mergeMode,
        customSeparator
      );
      this.runtime.writeText(merged);
      return this.buildActionResult("已将合并文件路径恢复到剪贴板。");
    }

    return this.buildActionResult(
      "合并粘贴目前仅支持纯文本或纯文件路径记录。"
    );
  }

  private toManualStoredInput(
    snapshot: ClipboardWorkbenchCollectedInput
  ): ClipboardWorkbenchCollectedInput {
    if (snapshot.kind === "text") {
      const text = snapshot.textContent ?? "";
      return {
        ...snapshot,
        source: "manual",
        hash: this.runtime.hash(`manual:${text}`),
        sensitive: this.settings.sensitiveMode ? 1 : 0
      };
    }

    if (snapshot.kind === "files") {
      const fileListJson = snapshot.fileListJson ?? "[]";
      return {
        ...snapshot,
        source: "manual",
        hash: this.runtime.hash(`manual-files:${fileListJson}`),
        sensitive: this.settings.sensitiveMode ? 1 : 0
      };
    }

    return {
      ...snapshot,
      source: snapshot.source === "screenshot" ? "screenshot" : "manual",
      hash:
        snapshot.assetBytes && snapshot.assetBytes.length > 0
          ? this.runtime.hash(snapshot.assetBytes)
          : this.runtime.hash(`manual-image:${snapshot.summary}`),
      sensitive: this.settings.sensitiveMode ? 1 : 0
    };
  }

  private async buildActionResult(
    message: string,
    query: ClipboardWorkbenchQueryState = normalizeQueryState()
  ): Promise<ClipboardWorkbenchActionResult> {
    return {
      message,
      payload: await this.buildPayload(query)
    };
  }

  private async buildPayload(
    query: ClipboardWorkbenchQueryState
  ): Promise<ClipboardWorkbenchPanelPayload> {
    const allItems = await this.requireStore().listItems();
    const filteredItems = this.filterItems(allItems, query);

    return {
      items: await Promise.all(
        filteredItems.map(async (item) => ({
          id: item.id,
          kind: item.kind,
          source: item.source,
          title: item.title ?? item.summary,
          summary: item.summary,
          note: item.note ?? "",
          tags: item.tags,
          favorite: item.favorite === 1,
          pinned: item.pinned === 1,
          sensitive: item.sensitive === 1,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
          previewText: item.textContent ?? undefined,
          filePaths: parseClipboardWorkbenchFileList(item.fileListJson),
          assetPath: item.assetPath ?? undefined,
          assetUrl: this.resolveAssetFileUrl(item.assetPath)
        }))
      ),
      groups: [],
      settings: this.settings,
      stats: {
        totalItems: filteredItems.length,
        totalBytes: filteredItems.reduce((sum, item) => sum + item.byteSize, 0)
      },
      query
    };
  }

  private filterItems(
    items: ClipboardWorkbenchStoredItem[],
    query: ClipboardWorkbenchQueryState
  ): ClipboardWorkbenchStoredItem[] {
    const search = query.search.trim().toLowerCase();
    return items.filter((item) => {
      if (query.scope === "favorites" && item.favorite !== 1) {
        return false;
      }
      if (query.scope === "pinned" && item.pinned !== 1) {
        return false;
      }
      if (query.scope === "text" && item.kind !== "text") {
        return false;
      }
      if (query.scope === "image" && item.kind !== "image") {
        return false;
      }
      if (query.scope === "files" && item.kind !== "files") {
        return false;
      }
      if (query.scope === "screenshots" && item.source !== "screenshot") {
        return false;
      }
      if (query.groupId && item.groupId !== query.groupId) {
        return false;
      }
      if (!search) {
        return true;
      }

      return [
        item.summary,
        item.title ?? "",
        item.note ?? "",
        item.textContent ?? "",
        item.tags.join(" ")
      ]
        .join("\n")
        .toLowerCase()
        .includes(search);
    });
  }

  private async applyRetention(): Promise<void> {
    const items = await this.requireStore().listItems();
    const evictionIds = selectClipboardWorkbenchEvictionIds(
      items.map((item) => ({
        id: item.id,
        pinned: item.pinned,
        favorite: item.favorite,
        byteSize: item.byteSize,
        createdAt: item.createdAt
      })),
      {
        maxItems: this.settings.maxItems,
        maxBytes: this.settings.maxBytes
      }
    );

    if (evictionIds.length > 0) {
      await this.requireStore().deleteItems(evictionIds);
    }
  }

  private async restoreStoredItemToClipboard(
    item: ClipboardWorkbenchStoredItem
  ): Promise<boolean> {
    if (item.kind === "text") {
      this.runtime.writeText(item.textContent ?? "");
      return true;
    }

    if (item.kind === "files") {
      const filePaths = parseClipboardWorkbenchFileList(item.fileListJson);
      if (!filePaths || filePaths.length === 0) {
        return false;
      }
      this.runtime.writeBuffer(
        "FileNameW",
        encodeClipboardWorkbenchFileNameW(filePaths)
      );
      this.runtime.writeText(filePaths.join("\n"));
      return true;
    }

    if (!item.assetPath) {
      return false;
    }

    const assetBytes = await this.readAssetBytes(item.assetPath);
    if (!assetBytes || assetBytes.length === 0) {
      return false;
    }

    this.runtime.writeImageBytes(assetBytes);
    return true;
  }

  private async readAssetBytes(relativePath: string): Promise<Buffer | null> {
    const assetPath = this.resolveAssetAbsolutePath(relativePath);
    if (!assetPath) {
      return null;
    }

    try {
      return await fsPromises.readFile(assetPath);
    } catch {
      return null;
    }
  }

  private resolveAssetFileUrl(relativePath: string | null): string | undefined {
    if (!relativePath) {
      return undefined;
    }

    const assetPath = this.resolveAssetAbsolutePath(relativePath);
    if (!assetPath) {
      return undefined;
    }

    return pathToFileURL(assetPath).toString();
  }

  private resolveAssetAbsolutePath(relativePath: string): string | null {
    const assetsRoot = path.resolve(this.assetsDir);
    const assetPath = path.resolve(this.assetsDir, relativePath);
    if (
      assetPath === assetsRoot ||
      !assetPath.startsWith(`${assetsRoot}${path.sep}`)
    ) {
      return null;
    }

    return assetPath;
  }

  private requireStore(): ClipboardWorkbenchStore {
    if (!this.store) {
      throw new Error("剪贴板工作台存储尚未初始化。");
    }
    return this.store;
  }
}
