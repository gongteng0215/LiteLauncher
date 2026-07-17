import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { DatabaseSync } from "node:sqlite";

import {
  buildChineseTranslationFtsQuery,
  formatDictionaryMultilineText,
  isChineseWordOrPhrase,
  normalizeChineseLookupText,
  rankChineseDictionaryMatches,
  splitHyphenCompoundParts,
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

function isInsideAsarArchive(filePath: string): boolean {
  const normalized = path.normalize(filePath);
  return normalized.includes(`${path.sep}app.asar${path.sep}`) && !normalized.includes(
    `${path.sep}app.asar.unpacked${path.sep}`
  );
}

function resolveEcdictDbCandidates(): string[] {
  const candidates: string[] = [];

  const resourcesPath = process.resourcesPath;
  if (typeof resourcesPath === "string" && resourcesPath.length > 0) {
    // Prefer real on-disk unpacked paths first — native SQLite cannot open asar.
    pushCandidate(
      candidates,
      path.join(resourcesPath, "app.asar.unpacked", "dist", "assets", "ecdict.db")
    );
    pushCandidate(
      candidates,
      path.join(resourcesPath, "app.asar.unpacked", "assets", "ecdict.db")
    );
    pushCandidate(candidates, path.join(resourcesPath, "app", "dist", "assets", "ecdict.db"));
  }

  try {
    const appPath = app.getAppPath();
    if (appPath.includes("app.asar")) {
      pushCandidate(
        candidates,
        path.join(appPath.replace("app.asar", "app.asar.unpacked"), "dist", "assets", "ecdict.db")
      );
      pushCandidate(
        candidates,
        path.join(appPath.replace("app.asar", "app.asar.unpacked"), "assets", "ecdict.db")
      );
    } else {
      pushCandidate(candidates, path.join(appPath, "dist", "assets", "ecdict.db"));
      pushCandidate(candidates, path.join(appPath, "assets", "ecdict.db"));
    }
  } catch {
    // app may be unavailable in unit tests
  }

  // Dev / unpackaged layouts.
  pushCandidate(candidates, path.join(__dirname, "../../assets/ecdict.db"));
  pushCandidate(candidates, path.join(process.cwd(), "dist/assets/ecdict.db"));
  pushCandidate(candidates, path.join(process.cwd(), "src/assets/ecdict.db"));

  return candidates.filter((candidate) => !isInsideAsarArchive(candidate));
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

  private chineseLookupCache = new Map<string, DictionaryEntry[]>();
  private readonly chineseLookupCacheLimit = 50;

  public constructor(dbPathOverride?: string) {
    this.dbPathOverride = dbPathOverride?.trim() ? path.normalize(dbPathOverride) : null;
  }

  public lookup(word: string): DictionaryEntry | undefined {
    return this.lookupCandidates(word, 1)[0];
  }

  public lookupCandidates(word: string, limit = 8): DictionaryEntry[] {
    const trimmed = word.trim();
    if (!trimmed) {
      return [];
    }

    const db = this.ensureOpen();
    if (!db) {
      return [];
    }

    const safeLimit = Math.min(20, Math.max(1, Math.round(limit)));

    if (isChineseWordOrPhrase(trimmed)) {
      const cacheKey = `${normalizeChineseLookupText(trimmed)}:${safeLimit}`;
      const cached = this.chineseLookupCache.get(cacheKey);
      if (cached) {
        return cached.map((entry) => ({ ...entry }));
      }
      const ranked = this.lookupChineseCandidates(db, trimmed, safeLimit);
      this.chineseLookupCache.set(
        cacheKey,
        ranked.map((entry) => ({ ...entry }))
      );
      if (this.chineseLookupCache.size > this.chineseLookupCacheLimit) {
        const oldest = this.chineseLookupCache.keys().next().value;
        if (oldest) {
          this.chineseLookupCache.delete(oldest);
        }
      }
      return ranked;
    }

    for (const candidate of stemDictionaryLookupCandidates(trimmed)) {
      const entry = this.lookupExact(db, candidate);
      if (entry) {
        return [entry];
      }
    }

    const compound = this.lookupHyphenCompound(db, trimmed);
    return compound ? [compound] : [];
  }

  private lookupChineseCandidates(
    db: DatabaseSync,
    query: string,
    limit: number
  ): DictionaryEntry[] {
    const normalized = normalizeChineseLookupText(query);
    if (!normalized) {
      return [];
    }

    const candidates: DictionaryEntry[] = [];
    if (this.hasTranslationFts(db)) {
      const ftsQuery = buildChineseTranslationFtsQuery(normalized);
      if (ftsQuery) {
        try {
          const rows = db
            .prepare(
              `SELECT e.word, e.phonetic, e.definition, e.translation, e.pos, e.collins, e.oxford, e.tag, e.exchange
               FROM entries_translation_fts fts
               JOIN entries e ON e.word = fts.word
               WHERE fts.translation MATCH ?
               LIMIT 40`
            )
            .all(ftsQuery) as DictionaryRow[];
          candidates.push(...rows.map(mapRow));
        } catch (error) {
          console.warn("[dictionary] chinese fts lookup failed", error);
        }
      }
    }

    if (candidates.length === 0) {
      const escaped = normalized.replace(/[\\%_]/g, (char) => `\\${char}`);
      const rows = db
        .prepare(
          `SELECT word, phonetic, definition, translation, pos, collins, oxford, tag, exchange
           FROM entries
           WHERE translation LIKE ? ESCAPE '\\'
           LIMIT 40`
        )
        .all(`%${escaped}%`) as DictionaryRow[];
      candidates.push(...rows.map(mapRow));
    }

    return rankChineseDictionaryMatches(normalized, candidates, limit);
  }

  private hasTranslationFts(db: DatabaseSync): boolean {
    const row = db
      .prepare(
        `SELECT 1 AS ok
         FROM sqlite_master
         WHERE type = 'table' AND name = 'entries_translation_fts'
         LIMIT 1`
      )
      .get() as { ok?: number } | undefined;
    return row?.ok === 1;
  }

  private lookupExact(db: DatabaseSync, word: string): DictionaryEntry | undefined {
    const row = db
      .prepare(
        `SELECT word, phonetic, definition, translation, pos, collins, oxford, tag, exchange
         FROM entries
         WHERE word = ?
         LIMIT 1`
      )
      .get(normalizeDictionaryLookupWord(word)) as DictionaryRow | undefined;
    return row ? mapRow(row) : undefined;
  }

  /**
   * For compounds like "context-path" that are absent as a whole, compose
   * per-segment dictionary cards when every hyphen part is known.
   */
  private lookupHyphenCompound(
    db: DatabaseSync,
    word: string
  ): DictionaryEntry | undefined {
    const parts = splitHyphenCompoundParts(word);
    if (parts.length < 2 || parts.length > 6) {
      return undefined;
    }

    const segments: DictionaryEntry[] = [];
    for (const part of parts) {
      let entry: DictionaryEntry | undefined;
      for (const candidate of stemDictionaryLookupCandidates(part)) {
        entry = this.lookupExact(db, candidate);
        if (entry) {
          break;
        }
      }
      if (!entry) {
        return undefined;
      }
      segments.push(entry);
    }

    const displayWord = normalizeDictionaryLookupWord(word);
    return {
      word: displayWord,
      phonetic: "",
      translation: segments
        .map((segment) => `${segment.word}\n${segment.translation}`)
        .join("\n\n"),
      definition: segments
        .filter((segment) => Boolean(segment.definition))
        .map((segment) => `${segment.word}\n${segment.definition}`)
        .join("\n\n"),
      pos: "",
      tags: "hyphen-compound",
      collins: 0,
      oxford: 0,
      exchange: ""
    };
  }

  public isReady(): boolean {
    return this.ensureOpen() !== null;
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
    const existing = candidates.filter((candidate) => {
      try {
        return fs.existsSync(candidate) && fs.statSync(candidate).isFile();
      } catch {
        return false;
      }
    });
    if (existing.length === 0) {
      if (!this.missingWarned) {
        this.missingWarned = true;
        console.warn(
          "[dictionary] ecdict.db not found; offline lookup disabled.",
          candidates.slice(0, 5)
        );
      }
      return null;
    }

    for (const candidate of existing) {
      try {
        this.db = new DatabaseSync(candidate, { readOnly: true });
        console.info("[dictionary] opened ecdict.db from", candidate);
        return this.db;
      } catch (error) {
        console.warn("[dictionary] failed to open ecdict.db", candidate, error);
      }
    }

    this.db = null;
    return null;
  }
}
