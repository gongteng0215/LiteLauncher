import fs from "node:fs";
import fsp from "node:fs/promises";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import { app } from "electron";
import { DatabaseSync } from "node:sqlite";

const USER_PACK_RELATIVE = path.join("dictionary", "ecdict.db");

const ftsProbeCache = new Map<string, boolean>();

export function resolveUserDictionaryPackPath(): string {
  return path.join(app.getPath("userData"), USER_PACK_RELATIVE);
}

export function clearDictionaryFtsProbeCache(dbPath?: string): void {
  if (!dbPath) {
    ftsProbeCache.clear();
    return;
  }
  ftsProbeCache.delete(path.normalize(dbPath));
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

function resolveDictionaryPackUrl(): string {
  const override = process.env.LITELAUNCHER_DICTIONARY_PACK_URL?.trim();
  if (override) {
    return override;
  }
  const version = app.getVersion();
  return `https://github.com/gongteng0215/LiteLauncher/releases/download/v${version}/ecdict-fts.db`;
}

function downloadToFile(url: string, targetPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith("http://") ? http : https;
    const request = client.get(url, (response) => {
      const status = response.statusCode ?? 0;
      if (status >= 300 && status < 400 && response.headers.location) {
        response.resume();
        void downloadToFile(response.headers.location, targetPath).then(resolve, reject);
        return;
      }
      if (status !== 200) {
        response.resume();
        reject(new Error(`下载失败：HTTP ${status}`));
        return;
      }
      const directory = path.dirname(targetPath);
      fs.mkdirSync(directory, { recursive: true });
      const tempPath = `${targetPath}.download`;
      const file = fs.createWriteStream(tempPath);
      response.pipe(file);
      file.on("finish", () => {
        file.close(() => {
          try {
            fs.renameSync(tempPath, targetPath);
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

export class DictionaryPackManager {
  public getStatus(bundledCandidates: string[]): {
    hasFts: boolean;
    usingUserPack: boolean;
    packPath: string | null;
    downloadAvailable: boolean;
  } {
    const userPack = resolveUserDictionaryPackPath();
    if (fs.existsSync(userPack)) {
      return {
        hasFts: dictionaryFileHasFts(userPack),
        usingUserPack: true,
        packPath: userPack,
        downloadAvailable: true
      };
    }

    const bundled = bundledCandidates.find((candidate) => fs.existsSync(candidate));
    return {
      hasFts: bundled ? dictionaryFileHasFts(bundled) : false,
      usingUserPack: false,
      packPath: bundled ?? null,
      downloadAvailable: true
    };
  }

  public async downloadPack(): Promise<{
    ok: boolean;
    message: string;
    packPath?: string;
  }> {
    const targetPath = resolveUserDictionaryPackPath();
    const url = resolveDictionaryPackUrl();
    try {
      await fsp.mkdir(path.dirname(targetPath), { recursive: true });
      await downloadToFile(url, targetPath);
      clearDictionaryFtsProbeCache(targetPath);
      if (!dictionaryFileHasFts(targetPath)) {
        return {
          ok: false,
          message: "下载完成但未检测到 FTS 索引，请检查发布资产。"
        };
      }
      return {
        ok: true,
        message: `完整词典索引已下载到 ${targetPath}`,
        packPath: targetPath
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return {
        ok: false,
        message: `下载词典索引失败：${message}`
      };
    }
  }
}
