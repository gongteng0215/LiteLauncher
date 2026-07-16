import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { DatabaseSync } from "node:sqlite";

import {
  formatDictionaryMultilineText,
  stemDictionaryLookupCandidates,
  type DictionaryEntry,
  normalizeDictionaryLookupWord
} from "../../shared/dictionary";

type DictionaryRow = {
  word: string;
  phonetic: string | null;
  definition: string | null;
  translation: string | null;
  pos: string | null;
  collins: number | null;
  oxford: number | null;
  tag: string | null;
  exchange: string | null;
};

function pushCandidate(candidates: string[], value: string | null | undefined): void {
  if (!value) {
    return;
  }
  const normalized = path.normalize(value);
  if (!candidates.includes(normalized)) {
    candidates.push(normalized);
  }
}

function resolveEcdictDbCandidates(): string[] {
  const candidates: string[] = [];
  pushCandidate(candidates, path.join(__dirname, "../../assets/ecdict.db"));
  pushCandidate(candidates, path.join(process.cwd(), "dist/assets/ecdict.db"));
  pushCandidate(candidates, path.join(process.cwd(), "src/assets/ecdict.db"));

  try {
    const appPath = app.getAppPath();
    pushCandidate(candidates, path.join(appPath, "dist/assets/ecdict.db"));
    pushCandidate(candidates, path.join(appPath, "assets/ecdict.db"));
    if (appPath.includes("app.asar")) {
      pushCandidate(
        candidates,
        path.join(appPath.replace("app.asar", "app.asar.unpacked"), "dist/assets/ecdict.db")
      );
    }
  } catch {
    // app may be unavailable in unit tests
  }

  const resourcesPath = process.resourcesPath;
  if (typeof resourcesPath === "string" && resourcesPath.length > 0) {
    pushCandidate(
      candidates,
      path.join(resourcesPath, "app.asar.unpacked", "dist", "assets", "ecdict.db")
    );
    pushCandidate(candidates, path.join(resourcesPath, "app", "dist", "assets", "ecdict.db"));
  }

  return candidates;
}

function mapRow(row: DictionaryRow): DictionaryEntry {
  return {
    word: row.word,
    phonetic: row.phonetic ?? "",
    definition: formatDictionaryMultilineText(row.definition ?? ""),
    translation: formatDictionaryMultilineText(row.translation ?? ""),
    pos: row.pos ?? "",
    tags: row.tag ?? "",
    collins: typeof row.collins === "number" ? row.collins : 0,
    oxford: typeof row.oxford === "number" ? row.oxford : 0,
    exchange: row.exchange ?? ""
  };
}

export class DictionaryStore {
  private db: DatabaseSync | null = null;
  private openAttempted = false;
  private missingWarned = false;
  private readonly dbPathOverride: string | null;

  public constructor(dbPathOverride?: string) {
    this.dbPathOverride = dbPathOverride?.trim() ? path.normalize(dbPathOverride) : null;
  }

  public lookup(word: string): DictionaryEntry | undefined {
    const db = this.ensureOpen();
    if (!db) {
      return undefined;
    }

    for (const candidate of stemDictionaryLookupCandidates(word)) {
      const row = db
        .prepare(
          `SELECT word, phonetic, definition, translation, pos, collins, oxford, tag, exchange
           FROM entries
           WHERE word = ?
           LIMIT 1`
        )
        .get(normalizeDictionaryLookupWord(candidate)) as DictionaryRow | undefined;
      if (row) {
        return mapRow(row);
      }
    }

    return undefined;
  }

  public close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  private ensureOpen(): DatabaseSync | null {
    if (this.db) {
      return this.db;
    }
    if (this.openAttempted) {
      return null;
    }
    this.openAttempted = true;

    const candidates = this.dbPathOverride
      ? [this.dbPathOverride]
      : resolveEcdictDbCandidates();
    const existing = candidates.find((candidate) => fs.existsSync(candidate));
    if (!existing) {
      if (!this.missingWarned) {
        this.missingWarned = true;
        console.warn(
          "[dictionary] ecdict.db not found; offline lookup disabled.",
          candidates.slice(0, 3)
        );
      }
      return null;
    }

    try {
      this.db = new DatabaseSync(existing, { readOnly: true });
      return this.db;
    } catch (error) {
      console.warn("[dictionary] failed to open ecdict.db", existing, error);
      this.db = null;
      return null;
    }
  }
}
