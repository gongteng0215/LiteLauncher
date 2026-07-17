import fs from "node:fs";
import path from "node:path";
import { app } from "electron";
import { DatabaseSync } from "node:sqlite";

import {
  formatDictionaryMultilineText,
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
      const entry = this.lookupExact(db, candidate);
      if (entry) {
        return entry;
      }
    }

    return this.lookupHyphenCompound(db, word);
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
