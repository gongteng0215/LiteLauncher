import {
  buildDictionaryFavoritesCsv,
  createDefaultDictionaryPanelState,
  DICTIONARY_FAVORITES_MAX,
  DICTIONARY_HISTORY_MAX,
  formatDictionaryMultilineText,
  normalizeDictionaryLookupWord,
  type DictionaryEntry,
  type DictionaryPanelState,
  type DictionaryWordBookmark
} from "../../shared/dictionary";
import { LiteDatabase } from "../database";

const DICTIONARY_PANEL_STATE_KEY = "dictionaryPanelState";

function buildTranslationPreview(translation: string): string {
  const line =
    formatDictionaryMultilineText(translation).split("\n")[0]?.trim() ?? "";
  if (!line) {
    return "";
  }
  return line.length > 72 ? `${line.slice(0, 72)}…` : line;
}

function buildBookmarkFromEntry(
  entry: DictionaryEntry,
  savedAt: number
): DictionaryWordBookmark {
  return {
    word: entry.word,
    phonetic: entry.phonetic,
    translationPreview: buildTranslationPreview(entry.translation),
    note: "",
    savedAt
  };
}

function normalizeBookmark(value: unknown): DictionaryWordBookmark | null {
  if (!value || typeof value !== "object") {
    return null;
  }
  const record = value as Record<string, unknown>;
  const word = typeof record.word === "string" ? record.word.trim() : "";
  if (!word) {
    return null;
  }
  const savedAt =
    typeof record.savedAt === "number" && Number.isFinite(record.savedAt)
      ? record.savedAt
      : Date.now();
  const note =
    typeof record.note === "string" ? record.note.trim().slice(0, 120) : "";
  return {
    word,
    phonetic: typeof record.phonetic === "string" ? record.phonetic : "",
    translationPreview:
      typeof record.translationPreview === "string"
        ? record.translationPreview
        : "",
    note,
    savedAt
  };
}

function dedupeBookmarks(items: DictionaryWordBookmark[]): DictionaryWordBookmark[] {
  const seen = new Set<string>();
  const result: DictionaryWordBookmark[] = [];
  for (const item of items) {
    const key = normalizeDictionaryLookupWord(item.word);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item);
  }
  return result;
}

function normalizePanelState(value: unknown): DictionaryPanelState {
  const fallback = createDefaultDictionaryPanelState();
  if (!value || typeof value !== "object") {
    return fallback;
  }
  const record = value as Record<string, unknown>;
  const history = Array.isArray(record.history)
    ? record.history
        .map((item) => normalizeBookmark(item))
        .filter((item): item is DictionaryWordBookmark => item !== null)
    : [];
  const favorites = Array.isArray(record.favorites)
    ? record.favorites
        .map((item) => normalizeBookmark(item))
        .filter((item): item is DictionaryWordBookmark => item !== null)
    : [];
  return {
    history: dedupeBookmarks(history).slice(0, DICTIONARY_HISTORY_MAX),
    favorites: dedupeBookmarks(favorites).slice(0, DICTIONARY_FAVORITES_MAX),
    ttsEnabled:
      typeof record.ttsEnabled === "boolean" ? record.ttsEnabled : fallback.ttsEnabled
  };
}

function upsertHistory(
  state: DictionaryPanelState,
  bookmark: DictionaryWordBookmark
): DictionaryPanelState {
  const key = normalizeDictionaryLookupWord(bookmark.word);
  const history = [
    bookmark,
    ...state.history.filter(
      (item) => normalizeDictionaryLookupWord(item.word) !== key
    )
  ].slice(0, DICTIONARY_HISTORY_MAX);
  return { ...state, history };
}

function cloneState(state: DictionaryPanelState): DictionaryPanelState {
  return {
    history: [...state.history],
    favorites: [...state.favorites],
    ttsEnabled: state.ttsEnabled
  };
}

export class DictionaryPanelStateStore {
  private cachedState: DictionaryPanelState | null = null;

  public constructor(private readonly db: LiteDatabase) {}

  public async getState(): Promise<DictionaryPanelState> {
    if (this.cachedState) {
      return cloneState(this.cachedState);
    }

    const fallback = createDefaultDictionaryPanelState();
    const raw = await this.db.getSetting(DICTIONARY_PANEL_STATE_KEY);
    if (!raw) {
      await this.db.setSetting(
        DICTIONARY_PANEL_STATE_KEY,
        JSON.stringify(fallback)
      );
      this.cachedState = fallback;
      return cloneState(fallback);
    }

    try {
      const parsed = JSON.parse(raw) as unknown;
      const normalized = normalizePanelState(parsed);
      if (JSON.stringify(normalized) !== raw) {
        await this.persist(normalized);
      } else {
        this.cachedState = normalized;
      }
      return cloneState(normalized);
    } catch {
      await this.persist(fallback);
      return cloneState(fallback);
    }
  }

  public async recordLookup(input: {
    query: string;
    entry?: DictionaryEntry | null;
  }): Promise<DictionaryPanelState> {
    const query = input.query.trim();
    if (!query || !input.entry) {
      return this.getState();
    }

    const current = await this.getState();
    const bookmark = buildBookmarkFromEntry(input.entry, Date.now());
    const next = upsertHistory(current, bookmark);
    await this.persist(next);
    return cloneState(next);
  }

  public async toggleFavorite(input: {
    word: string;
    entry?: DictionaryEntry | null;
  }): Promise<DictionaryPanelState> {
    const word = input.word.trim();
    if (!word) {
      return this.getState();
    }

    const key = normalizeDictionaryLookupWord(word);
    const current = await this.getState();
    const existingIndex = current.favorites.findIndex(
      (item) => normalizeDictionaryLookupWord(item.word) === key
    );
    if (existingIndex >= 0) {
      const favorites = current.favorites.filter((_, index) => index !== existingIndex);
      const next = { ...current, favorites };
      await this.persist(next);
      return cloneState(next);
    }

    const bookmark = input.entry
      ? buildBookmarkFromEntry(input.entry, Date.now())
      : {
          word,
          phonetic: "",
          translationPreview: "",
          note: "",
          savedAt: Date.now()
        };
    const favorites = dedupeBookmarks([bookmark, ...current.favorites]).slice(
      0,
      DICTIONARY_FAVORITES_MAX
    );
    const next = { ...current, favorites };
    await this.persist(next);
    return cloneState(next);
  }

  public async removeHistoryItem(word: string): Promise<DictionaryPanelState> {
    const key = normalizeDictionaryLookupWord(word);
    if (!key) {
      return this.getState();
    }
    const current = await this.getState();
    const next = {
      ...current,
      history: current.history.filter(
        (item) => normalizeDictionaryLookupWord(item.word) !== key
      )
    };
    await this.persist(next);
    return cloneState(next);
  }

  public async clearHistory(): Promise<DictionaryPanelState> {
    const current = await this.getState();
    const next = { ...current, history: [] };
    await this.persist(next);
    return cloneState(next);
  }

  public async removeFavorite(word: string): Promise<DictionaryPanelState> {
    const key = normalizeDictionaryLookupWord(word);
    if (!key) {
      return this.getState();
    }
    const current = await this.getState();
    const next = {
      ...current,
      favorites: current.favorites.filter(
        (item) => normalizeDictionaryLookupWord(item.word) !== key
      )
    };
    await this.persist(next);
    return cloneState(next);
  }

  public async updateFavoriteNote(
    word: string,
    note: string
  ): Promise<DictionaryPanelState> {
    const key = normalizeDictionaryLookupWord(word);
    if (!key) {
      return this.getState();
    }
    const current = await this.getState();
    const trimmedNote = note.trim().slice(0, 120);
    let changed = false;
    const favorites = current.favorites.map((item) => {
      if (normalizeDictionaryLookupWord(item.word) !== key) {
        return item;
      }
      changed = true;
      return { ...item, note: trimmedNote };
    });
    if (!changed) {
      return current;
    }
    const next = { ...current, favorites };
    await this.persist(next);
    return cloneState(next);
  }

  public async setTtsEnabled(enabled: boolean): Promise<DictionaryPanelState> {
    const current = await this.getState();
    const next = { ...current, ttsEnabled: Boolean(enabled) };
    await this.persist(next);
    return cloneState(next);
  }

  public async buildFavoritesCsv(): Promise<string> {
    const state = await this.getState();
    return buildDictionaryFavoritesCsv(state.favorites);
  }

  private async persist(state: DictionaryPanelState): Promise<void> {
    const normalized = normalizePanelState(state);
    await this.db.setSetting(
      DICTIONARY_PANEL_STATE_KEY,
      JSON.stringify(normalized)
    );
    this.cachedState = normalized;
  }
}
