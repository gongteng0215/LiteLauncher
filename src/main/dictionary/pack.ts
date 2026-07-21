import crypto from "node:crypto";
import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { app } from "electron";
import { DatabaseSync } from "node:sqlite";

import {
  DICTIONARY_BUNDLED_MIGRATION_MIN,
  type DictionaryPackDownloadProgress,
  type DictionaryPackStatus,
  resolveDictionaryPackTier
} from "../../shared/dictionary";

const USER_PACK_RELATIVE = path.join("dictionary", "ecdict.db");
export const DICTIONARY_BUNDLED_MIGRATED_KEY = "dictionary.bundled_migrated";

const ftsProbeCache = new Map<string, boolean>();
const entryCountCache = new Map<string, number>();

export function resolveUserDictionaryPackPath(): string {
  return path.join(app.getPath("userData"), USER_PACK_RELATIVE);
}

export function clearDictionaryFtsProbeCache(dbPath?: string): void {
  if (!dbPath) {
    ftsProbeCache.clear();
    entryCountCache.clear();
    return;
  }
  const normalized = path.normalize(dbPath);
  ftsProbeCache.delete(normalized);
  entryCountCache.delete(normalized);
}

export function dictionaryFileHasFts(dbPath: string): boolean {
  const normalized = path.normalize(dbPath);
  const cached = ftsProbeCache.get(normalized);
  if (cached !== undefined) {
    return cached;
  }

  if (!fs.existsSync(normalized)) {
    ftsProbeCache.set(normalized, false);
    return false;
  }
  try {
    const db = new DatabaseSync(normalized, { readOnly: true });
    try {
      const row = db
        .prepare(
          "SELECT 1 AS ok FROM sqlite_master WHERE type = 'table' AND name = 'entries_translation_fts' LIMIT 1"
        )
        .get() as { ok?: number } | undefined;
      const hasFts = Boolean(row?.ok);
      ftsProbeCache.set(normalized, hasFts);
      return hasFts;
    } finally {
      db.close();
    }
  } catch {
    ftsProbeCache.set(normalized, false);
    return false;
  }
}

export function countDictionaryEntries(dbPath: string): number {
  const normalized = path.normalize(dbPath);
  const cached = entryCountCache.get(normalized);
  if (cached !== undefined) {
    return cached;
  }

  if (!fs.existsSync(normalized)) {
    entryCountCache.set(normalized, 0);
    return 0;
  }
  try {
    const db = new DatabaseSync(normalized, { readOnly: true });
    try {
      const row = db
        .prepare("SELECT COUNT(*) AS count FROM entries")
        .get() as { count?: number } | undefined;
      const count = Number(row?.count) || 0;
      entryCountCache.set(normalized, count);
      return count;
    } finally {
      db.close();
    }
  } catch {
    entryCountCache.set(normalized, 0);
    return 0;
  }
}

function resolveDictionaryPackUrl(): string {
  const override = process.env.LITELAUNCHER_DICTIONARY_PACK_URL?.trim();
  if (override) {
    return override;
  }
  const version = app.getVersion();
  return `https://github.com/gongteng0215/LiteLauncher/releases/download/v${version}/ecdict-fts.db`;
}

function resolveDictionaryPackShaUrl(packUrl: string): string {
  const override = process.env.LITELAUNCHER_DICTIONARY_PACK_SHA_URL?.trim();
  if (override) {
    return override;
  }
  return `${packUrl}.sha256`;
}

function parseContentLength(header: string | string[] | undefined): number | null {
  const raw = Array.isArray(header) ? header[0] : header;
  if (!raw) {
    return null;
  }
  const parsed = Number(raw);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

function downloadToFile(
  url: string,
  targetPath: string,
  onProgress?: (progress: DictionaryPackDownloadProgress) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("http://") ? http : https;
    const request = client.get(url, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        void downloadToFile(response.headers.location, targetPath, onProgress).then(resolve, reject);
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`下载失败：HTTP ${status}`));
        return;
      }

      const total = parseContentLength(response.headers["content-length"]);
      let received = 0;
      const directory = path.dirname(targetPath);
      fs.mkdirSync(directory, { recursive: true });
      const tempPath = `${targetPath}.download`;
      const file = fs.createWriteStream(tempPath);

      response.on("data", (chunk: Buffer | string) => {
        received += Buffer.isBuffer(chunk) ? chunk.length : Buffer.byteLength(chunk);
        onProgress?.({ received, total });
      });

      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          try {
            fs.renameSync(tempPath, targetPath);
            onProgress?.({ received, total: total ?? received });
            resolve();
          } catch (error) {
            reject(error);
          }
        });
      });
      file.on("error", (error) => {
        try {
          fs.unlinkSync(tempPath);
        } catch {
          // ignore cleanup errors
        }
        reject(error);
      });
    });
    request.on("error", reject);
  });
}

async function downloadText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("http://") ? http : https;
    const request = client.get(url, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        void downloadText(response.headers.location).then(resolve, reject);
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`下载失败：HTTP ${status}`));
        return;
      }
      const chunks: Buffer[] = [];
      response.on("data", (chunk) => {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      response.on("end", () => {
        resolve(Buffer.concat(chunks).toString("utf8").trim());
      });
      response.on("error", reject);
    });
    request.on("error", reject);
  });
}

async function verifyDictionaryPackSha256(
  dbPath: string,
  shaUrl: string
): Promise<void> {
  const shaText = await downloadText(shaUrl);
  const expected = shaText.split(/\s+/)[0]?.trim().toLowerCase();
  if (!expected || !/^[a-f0-9]{64}$/.test(expected)) {
    throw new Error("校验文件格式无效。");
  }
  const actual = crypto
    .createHash("sha256")
    .update(await fsp.readFile(dbPath))
    .digest("hex");
  if (actual !== expected) {
    throw new Error("SHA256 校验失败，文件可能已损坏。");
  }
}

function resolveActivePackPath(
  bundledCandidates: string[]
): { packPath: string | null; usingUserPack: boolean } {
  const userPack = resolveUserDictionaryPackPath();
  if (fs.existsSync(userPack)) {
    return { packPath: userPack, usingUserPack: true };
  }
  const bundled = bundledCandidates.find((candidate) => fs.existsSync(candidate));
  return { packPath: bundled ?? null, usingUserPack: false };
}

export async function migrateBundledDictionaryIfNeeded(
  bundledCandidates: string[],
  settings: {
    readBundledMigrated: () => Promise<boolean>;
    markBundledMigrated: () => Promise<void>;
  }
): Promise<{ migrated: boolean; path?: string; message?: string }> {
  const userPack = resolveUserDictionaryPackPath();
  if (fs.existsSync(userPack)) {
    return { migrated: false };
  }
  if (await settings.readBundledMigrated()) {
    return { migrated: false };
  }

  const userPackNormalized = path.normalize(userPack);
  for (const candidate of bundledCandidates) {
    const normalized = path.normalize(candidate);
    if (normalized === userPackNormalized || !fs.existsSync(normalized)) {
      continue;
    }
    const entryCount = countDictionaryEntries(normalized);
    if (entryCount < DICTIONARY_BUNDLED_MIGRATION_MIN) {
      continue;
    }
    await fsp.mkdir(path.dirname(userPack), { recursive: true });
    await fsp.copyFile(normalized, userPack);
    clearDictionaryFtsProbeCache(userPack);
    await settings.markBundledMigrated();
    return {
      migrated: true,
      path: userPack,
      message: `已将内置完整词库迁移到 ${userPack}`
    };
  }

  return { migrated: false };
}

export class DictionaryPackManager {
  public getStatus(bundledCandidates: string[]): DictionaryPackStatus {
    const { packPath, usingUserPack } = resolveActivePackPath(bundledCandidates);
    const entryCount = packPath ? countDictionaryEntries(packPath) : 0;
    return {
      hasFts: packPath ? dictionaryFileHasFts(packPath) : false,
      usingUserPack,
      packPath,
      downloadAvailable: true,
      entryCount,
      tier: resolveDictionaryPackTier(entryCount)
    };
  }

  public async downloadPack(
    onProgress?: (progress: DictionaryPackDownloadProgress) => void
  ): Promise<{
    ok: boolean;
    message: string;
    packPath?: string;
  }> {
    const targetPath = resolveUserDictionaryPackPath();
    const url = resolveDictionaryPackUrl();
    const shaUrl = resolveDictionaryPackShaUrl(url);
    try {
      await fsp.mkdir(path.dirname(targetPath), { recursive: true });
      await downloadToFile(url, targetPath, onProgress);
      try {
        await verifyDictionaryPackSha256(targetPath, shaUrl);
      } catch (shaError) {
        try {
          await fsp.unlink(targetPath);
        } catch {
          // ignore cleanup errors
        }
        const message =
          shaError instanceof Error ? shaError.message : String(shaError);
        return {
          ok: false,
          message: `词典校验失败：${message}`
        };
      }
      clearDictionaryFtsProbeCache(targetPath);
      if (!dictionaryFileHasFts(targetPath)) {
        try {
          await fsp.unlink(targetPath);
        } catch {
          // ignore cleanup errors
        }
        return {
          ok: false,
          message: "下载完成但未检测到 FTS 索引，请检查发布资产。"
        };
      }
      const entryCount = countDictionaryEntries(targetPath);
      return {
        ok: true,
        message: `完整词库已下载（约 ${Math.round(entryCount / 1000)}k 词）到 ${targetPath}`,
        packPath: targetPath
      };
    } catch (error) {
      try {
        if (fs.existsSync(targetPath)) {
          await fsp.unlink(targetPath);
        }
      } catch {
        // ignore cleanup errors
      }
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        message: `下载完整词库失败：${message}`
      };
    }
  }
}
