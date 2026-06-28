import { randomUUID } from "node:crypto";
import fs from "node:fs";
import fsPromises from "node:fs/promises";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";

import {
  CLIPBOARD_WORKBENCH_SETTINGS_KEY,
  ClipboardWorkbenchItemKind,
  ClipboardWorkbenchItemSource,
  ClipboardWorkbenchSettings,
  createDefaultClipboardWorkbenchSettings
} from "../../../shared/clipboard-workbench";
import { applySqlitePerformancePragmas } from "../../sqlite-pragmas";

type SqlParam = string | number | null;

function coerceSqliteNumber(value: number | bigint): number {
  return typeof value === "bigint" ? Number(value) : value;
}

type ClipboardWorkbenchStoredItemRow = {
  id: string;
  kind: ClipboardWorkbenchItemKind;
  source: ClipboardWorkbenchItemSource;
  title: string | null;
  summary: string;
  textContent: string | null;
  fileListJson: string | null;
  assetPath: string | null;
  mimeType: string | null;
  byteSize: number;
  width: number | null;
  height: number | null;
  hash: string;
  groupId: string | null;
  tagsJson: string;
  note: string | null;
  favorite: number;
  pinned: number;
  sensitive: number;
  createdAt: number;
  updatedAt: number;
  lastPastedAt: number | null;
};

export interface ClipboardWorkbenchStoredInput {
  kind: ClipboardWorkbenchItemKind;
  source: ClipboardWorkbenchItemSource;
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

export interface ClipboardWorkbenchStoredItem {
  id: string;
  kind: ClipboardWorkbenchItemKind;
  source: ClipboardWorkbenchItemSource;
  title: string | null;
  summary: string;
  textContent: string | null;
  fileListJson: string | null;
  assetPath: string | null;
  mimeType: string | null;
  byteSize: number;
  width: number | null;
  height: number | null;
  hash: string;
  groupId: string | null;
  tags: string[];
  note: string | null;
  favorite: number;
  pinned: number;
  sensitive: number;
  createdAt: number;
  updatedAt: number;
  lastPastedAt: number | null;
}

type ExistingStoredItem = {
  id: string;
  assetPath: string | null;
  createdAt: number;
};

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

function sanitizeAssetBaseName(fileName: string | undefined): string {
  const raw = path.basename(fileName || "asset.bin").trim();
  const fallback = raw || "asset.bin";
  return fallback.replace(/[^a-zA-Z0-9._-]+/g, "-");
}

function parseTags(tagsJson: string): string[] {
  try {
    const parsed = JSON.parse(tagsJson) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed
      .filter((value): value is string => typeof value === "string")
      .map((value) => value.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

function toPositiveInteger(value: unknown, fallback: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return fallback;
  }
  return Math.max(1, Math.round(value));
}

function normalizeClipboardWorkbenchSettings(
  value: unknown
): ClipboardWorkbenchSettings {
  const defaults = createDefaultClipboardWorkbenchSettings();
  if (!value || typeof value !== "object") {
    return defaults;
  }

  const record = value as Record<string, unknown>;
  return {
    version: 1,
    autoCollect:
      typeof record.autoCollect === "boolean"
        ? record.autoCollect
        : defaults.autoCollect,
    sensitiveMode:
      typeof record.sensitiveMode === "boolean"
        ? record.sensitiveMode
        : defaults.sensitiveMode,
    maxItems: toPositiveInteger(record.maxItems, defaults.maxItems),
    maxBytes: toPositiveInteger(record.maxBytes, defaults.maxBytes),
    ignoreShortCodes:
      typeof record.ignoreShortCodes === "boolean"
        ? record.ignoreShortCodes
        : defaults.ignoreShortCodes,
    shortCodeLengthMax: toPositiveInteger(
      record.shortCodeLengthMax,
      defaults.shortCodeLengthMax
    ),
    ignoredAppHints: Array.isArray(record.ignoredAppHints)
      ? record.ignoredAppHints
          .filter((value): value is string => typeof value === "string")
          .map((value) => value.trim())
          .filter(Boolean)
      : defaults.ignoredAppHints,
    batchPasteDelayMs: toPositiveInteger(
      record.batchPasteDelayMs,
      defaults.batchPasteDelayMs
    )
  };
}

function mapStoredItem(
  row: ClipboardWorkbenchStoredItemRow
): ClipboardWorkbenchStoredItem {
  return {
    id: row.id,
    kind: row.kind,
    source: row.source,
    title: row.title,
    summary: row.summary,
    textContent: row.textContent,
    fileListJson: row.fileListJson,
    assetPath: row.assetPath,
    mimeType: row.mimeType,
    byteSize: row.byteSize,
    width: row.width,
    height: row.height,
    hash: row.hash,
    groupId: row.groupId,
    tags: parseTags(row.tagsJson),
    note: row.note,
    favorite: row.favorite,
    pinned: row.pinned,
    sensitive: row.sensitive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastPastedAt: row.lastPastedAt
  };
}

export class ClipboardWorkbenchStore {
  private readonly db: DatabaseSync;

  public constructor(
    private readonly dbPath: string,
    private readonly assetsDir: string
  ) {
    ensureParentDirectory(dbPath);
    this.db = new DatabaseSync(dbPath);
  }

  public async init(): Promise<void> {
    await fsPromises.mkdir(this.assetsDir, { recursive: true });

    await this.run(
      `CREATE TABLE IF NOT EXISTS settings (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL
       )`
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS clipboard_workbench_items (
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
       )`
    );

    await this.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS clipboard_workbench_items_hash_idx ON clipboard_workbench_items(hash)"
    );
    await this.run(
      "CREATE INDEX IF NOT EXISTS clipboard_workbench_items_created_idx ON clipboard_workbench_items(createdAt DESC)"
    );
    await this.run(
      "CREATE INDEX IF NOT EXISTS clipboard_workbench_items_updated_idx ON clipboard_workbench_items(updatedAt DESC)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS clipboard_workbench_groups (
         id TEXT PRIMARY KEY,
         name TEXT NOT NULL,
         color TEXT,
         createdAt INTEGER NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    applySqlitePerformancePragmas(this.db);
  }

  public async close(): Promise<void> {
    this.db.close();
  }

  public async getSettings(): Promise<ClipboardWorkbenchSettings> {
    const row = await this.get<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [CLIPBOARD_WORKBENCH_SETTINGS_KEY]
    );
    if (!row?.value) {
      return createDefaultClipboardWorkbenchSettings();
    }

    try {
      return normalizeClipboardWorkbenchSettings(JSON.parse(row.value));
    } catch {
      return createDefaultClipboardWorkbenchSettings();
    }
  }

  public async saveSettings(
    settings: ClipboardWorkbenchSettings
  ): Promise<ClipboardWorkbenchSettings> {
    const normalized = normalizeClipboardWorkbenchSettings(settings);
    await this.run(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value`,
      [CLIPBOARD_WORKBENCH_SETTINGS_KEY, JSON.stringify(normalized)]
    );
    return normalized;
  }

  public async saveItem(
    input: ClipboardWorkbenchStoredInput
  ): Promise<ClipboardWorkbenchStoredItem> {
    const now = Date.now();
    const existing = await this.get<ExistingStoredItem>(
      `SELECT id, assetPath, createdAt
       FROM clipboard_workbench_items
       WHERE hash = ?`,
      [input.hash]
    );

    const id = existing?.id ?? `cbw-${now}-${randomUUID().slice(0, 8)}`;
    const createdAt = existing?.createdAt ?? now;
    let assetPath = existing?.assetPath ?? null;

    if (input.assetBytes) {
      assetPath = await this.writeAssetFile(id, input.assetFileName, input.assetBytes);
    }

    await this.run(
      `INSERT INTO clipboard_workbench_items (
         id,
         kind,
         source,
         title,
         summary,
         textContent,
         fileListJson,
         assetPath,
         mimeType,
         byteSize,
         width,
         height,
         hash,
         groupId,
         tagsJson,
         note,
         favorite,
         pinned,
         sensitive,
         createdAt,
         updatedAt,
         lastPastedAt
       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         kind = excluded.kind,
         source = excluded.source,
         title = excluded.title,
         summary = excluded.summary,
         textContent = excluded.textContent,
         fileListJson = excluded.fileListJson,
         assetPath = excluded.assetPath,
         mimeType = excluded.mimeType,
         byteSize = excluded.byteSize,
         width = excluded.width,
         height = excluded.height,
         hash = excluded.hash,
         groupId = excluded.groupId,
         tagsJson = excluded.tagsJson,
         note = excluded.note,
         favorite = excluded.favorite,
         pinned = excluded.pinned,
         sensitive = excluded.sensitive,
         updatedAt = excluded.updatedAt`,
      [
        id,
        input.kind,
        input.source,
        input.title?.trim() || null,
        input.summary,
        input.textContent ?? null,
        input.fileListJson ?? null,
        assetPath,
        input.mimeType ?? null,
        input.byteSize,
        input.width ?? null,
        input.height ?? null,
        input.hash,
        input.groupId?.trim() || null,
        JSON.stringify(input.tags ?? []),
        input.note?.trim() || null,
        input.favorite ?? 0,
        input.pinned ?? 0,
        input.sensitive ?? 0,
        createdAt,
        now,
        null
      ]
    );

    if (input.assetBytes && existing?.assetPath && existing.assetPath !== assetPath) {
      await this.removeAssetFile(existing.assetPath);
    }

    return this.requireItem(id);
  }

  public async listItems(): Promise<ClipboardWorkbenchStoredItem[]> {
    const rows = await this.all<ClipboardWorkbenchStoredItemRow>(
      `SELECT
         id,
         kind,
         source,
         title,
         summary,
         textContent,
         fileListJson,
         assetPath,
         mimeType,
         byteSize,
         width,
         height,
         hash,
         groupId,
         tagsJson,
         note,
         favorite,
         pinned,
         sensitive,
         createdAt,
         updatedAt,
         lastPastedAt
       FROM clipboard_workbench_items
       ORDER BY pinned DESC, favorite DESC, updatedAt DESC, createdAt DESC, id DESC`
    );

    return rows.map(mapStoredItem);
  }

  public async getItemsByIds(
    ids: string[]
  ): Promise<ClipboardWorkbenchStoredItem[]> {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => "?").join(", ");
    const rows = await this.all<ClipboardWorkbenchStoredItemRow>(
      `SELECT
         id,
         kind,
         source,
         title,
         summary,
         textContent,
         fileListJson,
         assetPath,
         mimeType,
         byteSize,
         width,
         height,
         hash,
         groupId,
         tagsJson,
         note,
         favorite,
         pinned,
         sensitive,
         createdAt,
         updatedAt,
         lastPastedAt
       FROM clipboard_workbench_items
       WHERE id IN (${placeholders})`,
      ids
    );

    const mapped = new Map(rows.map((row) => [row.id, mapStoredItem(row)]));
    return ids
      .map((id) => mapped.get(id))
      .filter(
        (item): item is ClipboardWorkbenchStoredItem => item !== undefined
      );
  }

  public async deleteItems(ids: string[]): Promise<number> {
    if (ids.length === 0) {
      return 0;
    }

    const placeholders = ids.map(() => "?").join(", ");
    const rows = await this.all<{ assetPath: string | null }>(
      `SELECT assetPath
       FROM clipboard_workbench_items
       WHERE id IN (${placeholders})`,
      ids
    );
    const deleted = await this.runWithChanges(
      `DELETE FROM clipboard_workbench_items
       WHERE id IN (${placeholders})`,
      ids
    );

    for (const row of rows) {
      await this.removeAssetFile(row.assetPath);
    }

    return deleted;
  }

  private async requireItem(id: string): Promise<ClipboardWorkbenchStoredItem> {
    const row = await this.get<ClipboardWorkbenchStoredItemRow>(
      `SELECT
         id,
         kind,
         source,
         title,
         summary,
         textContent,
         fileListJson,
         assetPath,
         mimeType,
         byteSize,
         width,
         height,
         hash,
         groupId,
         tagsJson,
         note,
         favorite,
         pinned,
         sensitive,
         createdAt,
         updatedAt,
         lastPastedAt
       FROM clipboard_workbench_items
       WHERE id = ?`,
      [id]
    );

    if (!row) {
      throw new Error(`Clipboard Workbench item not found: ${id}`);
    }

    return mapStoredItem(row);
  }

  private async writeAssetFile(
    id: string,
    fileName: string | undefined,
    bytes: Buffer
  ): Promise<string> {
    const safeName = sanitizeAssetBaseName(fileName);
    const extension = path.extname(safeName) || ".bin";
    const relativePath = `${id}-${Date.now()}-${randomUUID()}${extension}`;
    const absolutePath = path.join(this.assetsDir, relativePath);
    await fsPromises.mkdir(path.dirname(absolutePath), { recursive: true });
    await fsPromises.writeFile(absolutePath, bytes);
    return relativePath;
  }

  private resolveManagedAssetPath(relativePath: string): string | null {
    const assetsRoot = path.resolve(this.assetsDir);
    const assetPath = path.resolve(this.assetsDir, relativePath);
    if (
      assetPath !== assetsRoot &&
      (assetPath === assetsRoot || assetPath.startsWith(`${assetsRoot}${path.sep}`))
    ) {
      return assetPath;
    }
    return null;
  }

  private async removeAssetFile(relativePath: string | null): Promise<void> {
    if (!relativePath) {
      return;
    }

    const absolutePath = this.resolveManagedAssetPath(relativePath);
    if (!absolutePath) {
      return;
    }

    await fsPromises.rm(absolutePath, { force: true }).catch(() => undefined);
  }

  private run(sql: string, params: SqlParam[] = []): Promise<void> {
    return this.runWithResult(sql, params).then(() => undefined);
  }

  private runWithChanges(sql: string, params: SqlParam[] = []): Promise<number> {
    return this.runWithResult(sql, params).then((result) => result.changes);
  }

  private runWithResult(
    sql: string,
    params: SqlParam[] = []
  ): Promise<{ changes: number; lastInsertId: number }> {
    const result = this.db.prepare(sql).run(...params);
    return Promise.resolve({
      changes: coerceSqliteNumber(result.changes),
      lastInsertId: coerceSqliteNumber(result.lastInsertRowid)
    });
  }

  private get<T>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
    return Promise.resolve(this.db.prepare(sql).get(...params) as T | undefined);
  }

  private all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return Promise.resolve(this.db.prepare(sql).all(...params) as T[]);
  }
}
