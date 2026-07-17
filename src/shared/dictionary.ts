export const DICTIONARY_PLUGIN_ID = "dictionary";
export const DICTIONARY_HISTORY_MAX = 30;
export const DICTIONARY_FAVORITES_MAX = 100;

export interface DictionaryWordBookmark {
  word: string;
  phonetic: string;
  translationPreview: string;
  note: string;
  savedAt: number;
}

export interface DictionaryPanelState {
  history: DictionaryWordBookmark[];
  favorites: DictionaryWordBookmark[];
}

export function createDefaultDictionaryPanelState(): DictionaryPanelState {
  return { history: [], favorites: [] };
}

export function isDictionaryWordFavorited(
  state: DictionaryPanelState,
  word: string
): boolean {
  const key = normalizeDictionaryLookupWord(word);
  return state.favorites.some(
    (item) => normalizeDictionaryLookupWord(item.word) === key
  );
}

export interface DictionaryEntry {
  word: string;
  phonetic: string;
  translation: string;
  definition: string;
  pos: string;
  tags: string;
  collins: number;
  oxford: number;
  exchange: string;
}

export function isSingleEnglishWord(text: string): boolean {
  return /^[A-Za-z][A-Za-z'\-]*$/.test(text.trim());
}

/** Plain token without spaces/hyphens — safe to skip Baidu when offline miss. */
export function isAtomicEnglishWord(text: string): boolean {
  return /^[A-Za-z][A-Za-z']*$/.test(text.trim());
}

/** English word or short phrase (letters, spaces, hyphens, apostrophes). */
export function isEnglishWordOrPhrase(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 64) {
    return false;
  }
  return /^[A-Za-z][A-Za-z' \-]*$/.test(trimmed);
}

/** Chinese word or short phrase for reverse ECDICT lookup. */
export function isChineseWordOrPhrase(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 32) {
    return false;
  }
  if (!/[\u3400-\u9fff]/.test(trimmed)) {
    return false;
  }
  return /^[\u3400-\u9fffA-Za-z0-9\s·，、；：""''（）()《》【】…—\-]+$/.test(
    trimmed
  );
}

export function isDictionaryLookupText(text: string): boolean {
  return isEnglishWordOrPhrase(text) || isChineseWordOrPhrase(text);
}

export function normalizeChineseLookupText(text: string): string {
  return text.trim().replace(/\s+/g, "");
}

export function buildChineseTranslationFtsQuery(text: string): string {
  const normalized = normalizeChineseLookupText(text);
  if (!normalized) {
    return "";
  }
  return `"${normalized.replace(/"/g, '""')}"`;
}

export function scoreChineseDictionaryMatch(
  query: string,
  entry: DictionaryEntry
): number {
  const normalizedQuery = normalizeChineseLookupText(query);
  if (!normalizedQuery) {
    return 0;
  }

  const translation = formatDictionaryMultilineText(entry.translation);
  let score = 0;
  if (translation.includes(normalizedQuery)) {
    score += 120;
  }

  const boundary = new RegExp(
    `(?:^|[；;\\n\\s])${normalizedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:$|[；;\\s，,])`
  );
  if (boundary.test(translation)) {
    score += 80;
  } else if (normalizedQuery.length === 1) {
    // Single-character queries are very ambiguous; require a boundary hit.
    return 0;
  }

  if (/^[\u3400-\u9fff]+$/.test(normalizedQuery) && entry.word === normalizedQuery) {
    score -= 40;
  }

  score += Math.min(entry.collins, 5) * 8;
  score += entry.oxford ? 20 : 0;
  score -= Math.min(entry.word.length, 24);
  if (normalizedQuery.length === 1) {
    score -= 30;
  }
  return score;
}

export function pickBestChineseDictionaryMatch(
  query: string,
  entries: DictionaryEntry[]
): DictionaryEntry | undefined {
  return rankChineseDictionaryMatches(query, entries, 1)[0];
}

export function rankChineseDictionaryMatches(
  query: string,
  entries: DictionaryEntry[],
  limit = 8
): DictionaryEntry[] {
  if (entries.length === 0 || limit <= 0) {
    return [];
  }
  const ranked = [...entries]
    .map((entry) => ({
      entry,
      score: scoreChineseDictionaryMatch(query, entry)
    }))
    .filter((item) => item.score > 0)
    .sort((left, right) => right.score - left.score);

  const seen = new Set<string>();
  const result: DictionaryEntry[] = [];
  for (const item of ranked) {
    const key = normalizeDictionaryLookupWord(item.entry.word);
    if (!key || seen.has(key)) {
      continue;
    }
    seen.add(key);
    result.push(item.entry);
    if (result.length >= limit) {
      break;
    }
  }
  return result;
}

export function normalizeDictionaryLookupWord(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

/** ECDICT CSV stores line breaks as literal "\\n" sequences. */
export function formatDictionaryMultilineText(text: string): string {
  return text
    .replace(/\\r\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\\r/g, "\r")
    .replace(/\r\n/g, "\n")
    .trim();
}

function pushUnique(candidates: string[], value: string): void {
  if (value && !candidates.includes(value)) {
    candidates.push(value);
  }
}

function pushStemVariants(candidates: string[], token: string): void {
  if (!token || token.includes(" ") || token.includes("-")) {
    return;
  }
  if (token.endsWith("ies") && token.length > 4) {
    pushUnique(candidates, `${token.slice(0, -3)}y`);
  }
  if (token.endsWith("es") && token.length > 3) {
    pushUnique(candidates, token.slice(0, -2));
  }
  if (token.endsWith("s") && token.length > 2) {
    pushUnique(candidates, token.slice(0, -1));
  }
  if (token.endsWith("ing") && token.length > 4) {
    pushUnique(candidates, token.slice(0, -3));
    pushUnique(candidates, `${token.slice(0, -3)}e`);
  }
  if (token.endsWith("ed") && token.length > 3) {
    pushUnique(candidates, token.slice(0, -2));
    pushUnique(candidates, token.slice(0, -1));
  }
}

/**
 * Lookup keys for ECDICT: exact form, hyphen↔space/concat variants, then stems.
 * Example: "user-agent" → ["user-agent", "user agent", "useragent"]
 */
export function stemDictionaryLookupCandidates(word: string): string[] {
  const normalized = normalizeDictionaryLookupWord(word);
  if (!normalized) {
    return [];
  }

  const roots = [normalized];
  if (normalized.includes("-") && !normalized.includes(" ")) {
    pushUnique(roots, normalized.replace(/-/g, " "));
    pushUnique(roots, normalized.replace(/-/g, ""));
  }

  const candidates: string[] = [];
  for (const root of roots) {
    pushUnique(candidates, root);
    // Phrases / hyphenated forms are matched as-is; stem only plain tokens.
    if (!root.includes(" ") && !root.includes("-")) {
      pushStemVariants(candidates, root);
    }
  }

  return candidates;
}

/** Split a hyphen compound into dictionary token parts. */
export function splitHyphenCompoundParts(word: string): string[] {
  const normalized = normalizeDictionaryLookupWord(word);
  if (!normalized.includes("-") || normalized.includes(" ")) {
    return [];
  }
  return normalized.split("-").filter((part) => /^[a-z][a-z']*$/.test(part));
}
