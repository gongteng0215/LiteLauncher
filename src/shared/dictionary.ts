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

/** English word or short phrase (letters, spaces, hyphens, apostrophes). */
export function isEnglishWordOrPhrase(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > 64) {
    return false;
  }
  return /^[A-Za-z][A-Za-z' \-]*$/.test(trimmed);
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

export function stemDictionaryLookupCandidates(word: string): string[] {
  const normalized = normalizeDictionaryLookupWord(word);
  if (!normalized) {
    return [];
  }

  const candidates = [normalized];
  const push = (value: string): void => {
    if (value && value !== normalized && !candidates.includes(value)) {
      candidates.push(value);
    }
  };

  // Phrases are matched verbatim; stemming only applies to single tokens.
  if (normalized.includes(" ")) {
    return candidates;
  }

  if (normalized.endsWith("ies") && normalized.length > 4) {
    push(`${normalized.slice(0, -3)}y`);
  }
  if (normalized.endsWith("es") && normalized.length > 3) {
    push(normalized.slice(0, -2));
  }
  if (normalized.endsWith("s") && normalized.length > 2) {
    push(normalized.slice(0, -1));
  }
  if (normalized.endsWith("ing") && normalized.length > 4) {
    push(normalized.slice(0, -3));
    push(`${normalized.slice(0, -3)}e`);
  }
  if (normalized.endsWith("ed") && normalized.length > 3) {
    push(normalized.slice(0, -2));
    push(`${normalized.slice(0, -1)}`);
  }

  return candidates;
}
