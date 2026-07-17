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
