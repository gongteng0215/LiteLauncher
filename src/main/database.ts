import fs from "node:fs";
import path from "node:path";
import sqlite3 from "sqlite3";

import { ClipItem, LaunchItem, UsageRecord } from "../shared/types";

function ensureParentDirectory(filePath: string): void {
  const parent = path.dirname(filePath);
  fs.mkdirSync(parent, { recursive: true });
}

type SqlParam = string | number | null;

export type CashflowAssetSnapshot = {
  key: string;
  title: string;
  totalCost: number;
  totalCashflow: number;
  count: number;
};

export type CashflowSnapshotInput = {
  role: string;
  turn: number;
  salary: number;
  expenses: number;
  passiveIncome: number;
  cash: number;
  won: boolean;
  action: string;
  message: string;
  snapshotJson: string;
  assets: CashflowAssetSnapshot[];
  archivePreviousActiveGame?: boolean;
};

export type CashflowStatsSummary = {
  totalGames: number;
  wins: number;
  averageTurns: number;
  latestRole: string | null;
  latestTurn: number;
  latestCash: number;
  commonLossReasons: Array<{
    reason: string;
    count: number;
  }>;
};

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
    return this.runWithResult(sql, params).then(() => undefined);
  }

  private runWithChanges(
    sql: string,
    params: SqlParam[] = []
  ): Promise<number> {
    return this.runWithResult(sql, params).then((result) => result.changes);
  }

  private runWithResult(
    sql: string,
    params: SqlParam[] = []
  ): Promise<{ changes: number; lastInsertId: number }> {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function callback(
        this: sqlite3.RunResult,
        error: Error | null
      ) {
        if (error) {
          reject(error);
          return;
        }
        resolve({
          changes: this.changes ?? 0,
          lastInsertId: this.lastID ?? 0
        });
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

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_games (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         status TEXT NOT NULL,
         role TEXT NOT NULL,
         currentTurn INTEGER NOT NULL,
         salary INTEGER NOT NULL,
         expenses INTEGER NOT NULL,
         passiveIncome INTEGER NOT NULL,
         cash INTEGER NOT NULL,
         won INTEGER NOT NULL,
         snapshotJson TEXT NOT NULL,
         createdAt INTEGER NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE INDEX IF NOT EXISTS cashflow_games_status_idx ON cashflow_games(status, updatedAt DESC)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_players (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         name TEXT NOT NULL,
         role TEXT NOT NULL,
         isPrimary INTEGER NOT NULL,
         createdAt INTEGER NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS cashflow_players_game_primary_idx ON cashflow_players(gameId, isPrimary)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_professions (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         playerId INTEGER NOT NULL,
         role TEXT NOT NULL,
         salary INTEGER NOT NULL,
         expenses INTEGER NOT NULL,
         createdAt INTEGER NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE UNIQUE INDEX IF NOT EXISTS cashflow_professions_game_player_idx ON cashflow_professions(gameId, playerId)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_assets (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         playerId INTEGER NOT NULL,
         assetKey TEXT NOT NULL,
         assetTitle TEXT NOT NULL,
         totalCost INTEGER NOT NULL,
         totalCashflow INTEGER NOT NULL,
         count INTEGER NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE INDEX IF NOT EXISTS cashflow_assets_game_player_idx ON cashflow_assets(gameId, playerId)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_debts (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         playerId INTEGER NOT NULL,
         debtKey TEXT NOT NULL,
         debtTitle TEXT NOT NULL,
         principal INTEGER NOT NULL,
         monthlyPayment INTEGER NOT NULL,
         balance INTEGER NOT NULL,
         updatedAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE INDEX IF NOT EXISTS cashflow_debts_game_player_idx ON cashflow_debts(gameId, playerId)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_events (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         turn INTEGER NOT NULL,
         eventType TEXT NOT NULL,
         title TEXT NOT NULL,
         details TEXT,
         createdAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE INDEX IF NOT EXISTS cashflow_events_game_turn_idx ON cashflow_events(gameId, turn DESC)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_decisions (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         turn INTEGER NOT NULL,
         action TEXT NOT NULL,
         message TEXT NOT NULL,
         payload TEXT,
         createdAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE INDEX IF NOT EXISTS cashflow_decisions_game_turn_idx ON cashflow_decisions(gameId, turn DESC)"
    );

    await this.run(
      `CREATE TABLE IF NOT EXISTS cashflow_stats (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         gameId INTEGER NOT NULL,
         turn INTEGER NOT NULL,
         salary INTEGER NOT NULL,
         expenses INTEGER NOT NULL,
         passiveIncome INTEGER NOT NULL,
         cash INTEGER NOT NULL,
         monthlyNet INTEGER NOT NULL,
         netWorth INTEGER NOT NULL,
         snapshotJson TEXT NOT NULL,
         createdAt INTEGER NOT NULL
       )`
    );

    await this.run(
      "CREATE INDEX IF NOT EXISTS cashflow_stats_game_turn_idx ON cashflow_stats(gameId, turn DESC)"
    );
  }

  public async getCashflowActiveSnapshot(): Promise<string | null> {
    const row = await this.get<{ snapshotJson: string }>(
      `SELECT snapshotJson
       FROM cashflow_games
       WHERE status = 'active'
       ORDER BY updatedAt DESC, id DESC
       LIMIT 1`
    );
    return row?.snapshotJson ?? null;
  }

  public async saveCashflowSnapshot(
    input: CashflowSnapshotInput
  ): Promise<void> {
    const now = Date.now();
    const monthlyNet = input.salary + input.passiveIncome - input.expenses;
    const assetsTotal = input.assets.reduce((sum, asset) => sum + asset.totalCost, 0);
    const netWorth = input.cash + assetsTotal;

    await this.run("BEGIN TRANSACTION");
    try {
      if (input.archivePreviousActiveGame) {
        await this.run(
          `UPDATE cashflow_games
           SET status = 'archived',
               updatedAt = ?
           WHERE status = 'active'`,
          [now]
        );
      }

      const active = await this.get<{ id: number }>(
        `SELECT id
         FROM cashflow_games
         WHERE status = 'active'
         ORDER BY updatedAt DESC, id DESC
         LIMIT 1`
      );

      let gameId = active?.id ?? 0;

      if (!gameId) {
        const inserted = await this.runWithResult(
          `INSERT INTO cashflow_games (
             status, role, currentTurn, salary, expenses, passiveIncome, cash, won, snapshotJson, createdAt, updatedAt
           )
           VALUES ('active', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            input.role,
            input.turn,
            input.salary,
            input.expenses,
            input.passiveIncome,
            input.cash,
            input.won ? 1 : 0,
            input.snapshotJson,
            now,
            now
          ]
        );
        gameId = inserted.lastInsertId;
      } else {
        await this.run(
          `UPDATE cashflow_games
           SET role = ?,
               currentTurn = ?,
               salary = ?,
               expenses = ?,
               passiveIncome = ?,
               cash = ?,
               won = ?,
               snapshotJson = ?,
               updatedAt = ?
           WHERE id = ?`,
          [
            input.role,
            input.turn,
            input.salary,
            input.expenses,
            input.passiveIncome,
            input.cash,
            input.won ? 1 : 0,
            input.snapshotJson,
            now,
            gameId
          ]
        );
      }

      let playerId = 0;
      const playerRow = await this.get<{ id: number }>(
        `SELECT id
         FROM cashflow_players
         WHERE gameId = ? AND isPrimary = 1
         LIMIT 1`,
        [gameId]
      );
      if (playerRow?.id) {
        playerId = playerRow.id;
        await this.run(
          `UPDATE cashflow_players
           SET role = ?,
               updatedAt = ?
           WHERE id = ?`,
          [input.role, now, playerId]
        );
      } else {
        const inserted = await this.runWithResult(
          `INSERT INTO cashflow_players (
             gameId, name, role, isPrimary, createdAt, updatedAt
           )
           VALUES (?, 'player', ?, 1, ?, ?)`,
          [gameId, input.role, now, now]
        );
        playerId = inserted.lastInsertId;
      }

      await this.run(
        `INSERT INTO cashflow_professions (
           gameId, playerId, role, salary, expenses, createdAt, updatedAt
         )
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON CONFLICT(gameId, playerId) DO UPDATE SET
           role = excluded.role,
           salary = excluded.salary,
           expenses = excluded.expenses,
           updatedAt = excluded.updatedAt`,
        [gameId, playerId, input.role, input.salary, input.expenses, now, now]
      );

      await this.run(
        "DELETE FROM cashflow_assets WHERE gameId = ? AND playerId = ?",
        [gameId, playerId]
      );
      for (const asset of input.assets) {
        await this.run(
          `INSERT INTO cashflow_assets (
             gameId, playerId, assetKey, assetTitle, totalCost, totalCashflow, count, updatedAt
           )
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            gameId,
            playerId,
            asset.key,
            asset.title,
            asset.totalCost,
            asset.totalCashflow,
            asset.count,
            now
          ]
        );
      }

      await this.run(
        "DELETE FROM cashflow_debts WHERE gameId = ? AND playerId = ?",
        [gameId, playerId]
      );

      await this.run(
        `INSERT INTO cashflow_decisions (
           gameId, turn, action, message, payload, createdAt
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          input.turn,
          input.action,
          input.message,
          JSON.stringify({
            role: input.role,
            won: input.won
          }),
          now
        ]
      );

      await this.run(
        `INSERT INTO cashflow_events (
           gameId, turn, eventType, title, details, createdAt
         )
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          input.turn,
          "state",
          input.message,
          JSON.stringify({
            action: input.action
          }),
          now
        ]
      );

      await this.run(
        `INSERT INTO cashflow_stats (
           gameId, turn, salary, expenses, passiveIncome, cash, monthlyNet, netWorth, snapshotJson, createdAt
         )
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          gameId,
          input.turn,
          input.salary,
          input.expenses,
          input.passiveIncome,
          input.cash,
          monthlyNet,
          netWorth,
          input.snapshotJson,
          now
        ]
      );

      await this.run("COMMIT");
    } catch (error) {
      await this.run("ROLLBACK");
      throw error;
    }
  }

  public async getCashflowStatsSummary(): Promise<CashflowStatsSummary> {
    const aggregate = await this.get<{
      totalGames: number;
      wins: number | null;
      averageTurns: number | null;
    }>(
      `SELECT
         COUNT(*) AS totalGames,
         SUM(CASE WHEN won = 1 THEN 1 ELSE 0 END) AS wins,
         AVG(currentTurn) AS averageTurns
       FROM cashflow_games`
    );

    const latest = await this.get<{
      role: string;
      currentTurn: number;
      cash: number;
    }>(
      `SELECT role, currentTurn, cash
       FROM cashflow_games
       ORDER BY updatedAt DESC, id DESC
       LIMIT 1`
    );

    const snapshots = await this.all<{ snapshotJson: string }>(
      `SELECT snapshotJson
       FROM cashflow_games
       WHERE snapshotJson IS NOT NULL
         AND snapshotJson <> ''`
    );

    const reasonCounter = new Map<string, number>();
    for (const row of snapshots) {
      try {
        const parsed = JSON.parse(row.snapshotJson) as Record<string, unknown>;
        const lost = parsed.lost === true;
        const lossReasonRaw =
          typeof parsed.lossReason === "string" ? parsed.lossReason : "";
        const lossReason = lossReasonRaw.trim();
        if (!lost || !lossReason) {
          continue;
        }
        reasonCounter.set(lossReason, (reasonCounter.get(lossReason) ?? 0) + 1);
      } catch {
        continue;
      }
    }

    const commonLossReasons = Array.from(reasonCounter.entries())
      .sort((left, right) => {
        if (left[1] !== right[1]) {
          return right[1] - left[1];
        }
        return left[0].localeCompare(right[0], "zh-CN");
      })
      .slice(0, 3)
      .map(([reason, count]) => ({ reason, count }));

    return {
      totalGames: aggregate?.totalGames ?? 0,
      wins: aggregate?.wins ?? 0,
      averageTurns: aggregate?.averageTurns ?? 0,
      latestRole: latest?.role ?? null,
      latestTurn: latest?.currentTurn ?? 0,
      latestCash: latest?.cash ?? 0,
      commonLossReasons
    };
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

      const itemIds = items.map((item) => item.id);
      if (itemIds.length > 0) {
        const placeholders = itemIds.map(() => "?").join(", ");
        await this.run(
          `DELETE FROM items WHERE id NOT IN (${placeholders})`,
          itemIds
        );
      } else {
        await this.run("DELETE FROM items");
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
