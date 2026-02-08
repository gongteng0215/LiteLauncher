import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

import { ClipItem, LaunchItem, UsageRecord } from "../shared/types";

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

type SqlParam = string | number | null;

export class LiteDatabase {
  private readonly db: sqlite3.Database;

  public constructor(dbPath: string) {
    ensureParentDirectory(dbPath);
    this.db = new sqlite3.Database(dbPath);
  }

  public close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((error) => {
        if (error) {
          reject(error);
          return;
        }
        resolve();
      });
    });
  }

  private run(sql: string, params: SqlParam[] = []): Promise<void> {
    return this.runWithChanges(sql, params).then(() => undefined);
  }

  private runWithChanges(
    sql: string,
    params: SqlParam[] = []
  ): Promise<number> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function callback(error) {
        if (error) {
          reject(error);
          return;
        }
        resolve(this.changes ?? 0);
      });
    });
  }

  private get<T>(sql: string, params: SqlParam[] = []): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, params, (error, row: T | undefined) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(row);
      });
    });
  }

  private all<T>(sql: string, params: SqlParam[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (error, rows: T[]) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(rows);
      });
    });
  }

  public async init(): Promise<void> {
    await this.run(
      `CREATE TABLE IF NOT EXISTS settings (
         key TEXT PRIMARY KEY,
         value TEXT NOT NULL
       )`
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS items (
         id TEXT PRIMARY KEY,
         type TEXT NOT NULL,
         title TEXT NOT NULL,
         subtitle TEXT NOT NULL,
         target TEXT NOT NULL,
         iconPath TEXT,
         keywords TEXT NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS usage (
         itemId TEXT PRIMARY KEY,
         count INTEGER NOT NULL,
         lastUsedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS clip_items (
         id TEXT PRIMARY KEY,
         content TEXT NOT NULL,
         hash TEXT NOT NULL,
         createdAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS clip_items_hash_idx ON clip_items(hash)"
    );
  }

  public async saveItems(items: LaunchItem[]): Promise<void> {
    const now = Date.now();
    await this.run("BEGIN TRANSACTION");
    try {
      for (const item of items) {
        await this.run(
          `INSERT INTO items (
             id, type, title, subtitle, target, iconPath, keywords, updatedAt
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON CONFLICT(id) DO UPDATE SET
             type = excluded.type,
             title = excluded.title,
             subtitle = excluded.subtitle,
             target = excluded.target,
             iconPath = excluded.iconPath,
             keywords = excluded.keywords,
             updatedAt = excluded.updatedAt`,
          [
            item.id,
            item.type,
            item.title,
            item.subtitle,
            item.target,
            item.iconPath ?? null,
            JSON.stringify(item.keywords),
            now
          ]
        );
      }
      await this.run("COMMIT");
    } catch (error) {
      await this.run("ROLLBACK");
      throw error;
    }
  }

  public async getItems(): Promise<LaunchItem[]> {
    type ItemRow = {
      id: string;
      type: LaunchItem["type"];
      title: string;
      subtitle: string;
      target: string;
      iconPath: string | null;
      keywords: string;
    };

    const rows = await this.all<ItemRow>(
      "SELECT id, type, title, subtitle, target, iconPath, keywords FROM items"
    );

    return rows.map((row) => ({
      id: row.id,
      type: row.type,
      title: row.title,
      subtitle: row.subtitle,
      target: row.target,
      iconPath: row.iconPath ?? undefined,
      keywords: JSON.parse(row.keywords)
    }));
  }

  public async recordUsage(itemId: string): Promise<void> {
    const now = Date.now();
    await this.run(
      `INSERT INTO usage (itemId, count, lastUsedAt)
       VALUES (?, 1, ?)
       ON CONFLICT(itemId) DO UPDATE SET
         count = count + 1,
         lastUsedAt = excluded.lastUsedAt`,
      [itemId, now]
    );
  }

  public async getUsageMap(): Promise<Map<string, UsageRecord>> {
    type UsageRow = {
      itemId: string;
      count: number;
      lastUsedAt: number;
    };

    const rows = await this.all<UsageRow>(
      "SELECT itemId, count, lastUsedAt FROM usage"
    );
    return new Map(
      rows.map((row) => [
        row.itemId,
        { count: row.count, lastUsedAt: row.lastUsedAt }
      ])
    );
  }

  public async getSetting(key: string): Promise<string | null> {
    const row = await this.get<{ value: string }>(
      "SELECT value FROM settings WHERE key = ?",
      [key]
    );
    return row?.value ?? null;
  }

  public async setSetting(key: string, value: string): Promise<void> {
    await this.run(
      `INSERT INTO settings (key, value)
       VALUES (?, ?)
       ON CONFLICT(key) DO UPDATE SET
         value = excluded.value`,
      [key, value]
    );
  }

  public async saveClipItem(
    content: string,
    hash: string,
    maxItems: number
  ): Promise<void> {
    const now = Date.now();
    const existing = await this.get<{ id: string }>(
      "SELECT id FROM clip_items WHERE hash = ?",
      [hash]
    );

    if (existing) {
      await this.run(
        "UPDATE clip_items SET content = ?, createdAt = ? WHERE id = ?",
        [content, now, existing.id]
      );
    } else {
      const id = `clip-${now}-${Math.random().toString(36).slice(2, 10)}`;
      await this.run(
        "INSERT INTO clip_items (id, content, hash, createdAt) VALUES (?, ?, ?, ?)",
        [id, content, hash, now]
      );
    }

    await this.run(
      `DELETE FROM clip_items
       WHERE id NOT IN (
         SELECT id FROM clip_items ORDER BY createdAt DESC LIMIT ?
       )`,
      [maxItems]
    );
  }

  public async getClipItems(query: string, limit = 50): Promise<ClipItem[]> {
    type ClipRow = {
      id: string;
      content: string;
      hash: string;
      createdAt: number;
    };

    if (!query.trim()) {
      return this.all<ClipRow>(
        `SELECT id, content, hash, createdAt
         FROM clip_items
         ORDER BY createdAt DESC
         LIMIT ?`,
        [limit]
      );
    }

    const likeQuery = `%${query}%`;
    return this.all<ClipRow>(
      `SELECT id, content, hash, createdAt
       FROM clip_items
       WHERE content LIKE ?
       ORDER BY createdAt DESC
       LIMIT ?`,
      [likeQuery, limit]
    );
  }

  public async getClipItemById(itemId: string): Promise<ClipItem | null> {
    const row = await this.get<ClipItem>(
      `SELECT id, content, hash, createdAt
       FROM clip_items
       WHERE id = ?`,
      [itemId]
    );
    return row ?? null;
  }

  public async deleteClipItem(itemId: string): Promise<boolean> {
    const affected = await this.runWithChanges(
      "DELETE FROM clip_items WHERE id = ?",
      [itemId]
    );
    return affected > 0;
  }

  public async clearClipItems(): Promise<number> {
    return this.runWithChanges("DELETE FROM clip_items");
  }
}
