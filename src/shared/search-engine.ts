import { LaunchItem, UsageRecord } from "./types";

type UsageMap = Record<string, UsageRecord>;

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

function splitQueryTokens(query: string): string[] {
  return query.split(/[\s._\-\\/]+/).map(normalize).filter(Boolean);
}

function isAsciiLetters(value: string): boolean {
  return /^[a-z]+$/.test(value);
}

function isVowel(char: string): boolean {
  return /[aeiou]/.test(char);
}

function buildPinyinFallbackTokens(token: string): string[] {
  if (!isAsciiLetters(token) || token.length < 3) {
    return [];
  }

  const variants = new Set<string>();

  const consonantSkeleton = token.replace(/[aeiou]+/g, "");
  if (consonantSkeleton && consonantSkeleton !== token) {
    variants.add(consonantSkeleton);
  }

  const condensedSkeleton = consonantSkeleton.replace(/(.)\1+/g, "$1");
  if (
    condensedSkeleton &&
    condensedSkeleton !== token &&
    condensedSkeleton !== consonantSkeleton
  ) {
    variants.add(condensedSkeleton);
  }

  let syllableInitials = token[0] ?? "";
  for (let i = 1; i < token.length; i += 1) {
    const current = token[i] ?? "";
    const prev = token[i - 1] ?? "";
    if (isVowel(prev) && !isVowel(current)) {
      syllableInitials += current;
    }
  }
  if (syllableInitials && syllableInitials !== token) {
    variants.add(syllableInitials);
  }

  // Long queries should not degrade to single-letter fallback,
  // otherwise random input (e.g. "baiasds...") can produce noisy matches.
  const minVariantLength = token.length <= 4 ? 1 : 2;
  return Array.from(variants).filter(
    (variant) => Boolean(variant) && variant.length >= minVariantLength
  );
}

function fuzzyScore(text: string, query: string): number {
  if (!query) {
    return 0;
  }

  let queryIndex = 0;
  let consecutive = 0;
  let score = 0;

  for (let i = 0; i < text.length && queryIndex < query.length; i += 1) {
    if (text[i] === query[queryIndex]) {
      queryIndex += 1;
      consecutive += 1;
      score += 1 + consecutive * 0.3;
    } else {
      consecutive = 0;
    }
  }

  if (queryIndex !== query.length) {
    return 0;
  }

  return score / Math.max(text.length, query.length);
}

function startsWithScore(text: string, query: string): number {
  if (!text || !query || !text.startsWith(query)) {
    return 0;
  }
  if (text === query) {
    return 1;
  }
  return 0.96;
}

function includesScore(text: string, query: string): number {
  if (!text || !query) {
    return 0;
  }

  const index = text.indexOf(query);
  if (index === -1) {
    return 0;
  }

  const earlyBonus = Math.max(0, 0.1 - index / Math.max(text.length, 1) * 0.1);
  return 0.78 + earlyBonus;
}

function fuzzyFieldScore(text: string, query: string): number {
  if (!text || !query) {
    return 0;
  }

  // Very short query fuzziness is noisy; rely on prefix/include instead.
  if (query.length <= 2) {
    return 0;
  }

  const score = fuzzyScore(text, query);
  if (score <= 0) {
    return 0;
  }

  // Filter weak fuzzy matches to reduce irrelevant results.
  if (score < 0.42) {
    return 0;
  }

  return Math.min(score, 0.68);
}

function keywordMatchScore(keywords: string[], query: string): number {
  if (!query || keywords.length === 0) {
    return 0;
  }

  let best = 0;
  for (const keyword of keywords) {
    best = Math.max(
      best,
      startsWithScore(keyword, query),
      includesScore(keyword, query),
      fuzzyFieldScore(keyword, query)
    );
  }
  return best;
}

function tokenMatchScore(item: LaunchItem, token: string): number {
  if (!token) {
    return 0;
  }

  const title = normalize(item.title);
  const subtitle = normalize(item.subtitle);
  const keywords = item.keywords.map(normalize);

  const titleScore = Math.max(
    startsWithScore(title, token),
    includesScore(title, token),
    fuzzyFieldScore(title, token)
  );
  const keywordScore = keywordMatchScore(keywords, token);
  // Do not apply fuzzy on subtitle/path to avoid noisy path-character hits.
  const subtitleScore = Math.max(
    startsWithScore(subtitle, token),
    includesScore(subtitle, token)
  ) * 0.72;

  const direct = Math.max(titleScore, keywordScore, subtitleScore);
  if (direct > 0) {
    return direct;
  }

  let fallbackBest = 0;
  for (const variant of buildPinyinFallbackTokens(token)) {
    if (!variant || variant === token) {
      continue;
    }

    const fallbackKeywordScore = keywordMatchScore(keywords, variant);
    if (fallbackKeywordScore <= 0) {
      continue;
    }

    const fallbackWeight = variant.length <= 1 ? 0.62 : 0.76;
    fallbackBest = Math.max(fallbackBest, fallbackKeywordScore * fallbackWeight);
  }

  return fallbackBest;
}

function matchScore(item: LaunchItem, query: string): number {
  if (!query) {
    return 1;
  }

  const tokens = splitQueryTokens(query);
  if (tokens.length === 0) {
    return 0;
  }

  if (tokens.length === 1) {
    return tokenMatchScore(item, tokens[0] ?? "");
  }

  let sum = 0;
  for (const token of tokens) {
    const score = tokenMatchScore(item, token);
    if (score <= 0) {
      return 0;
    }
    sum += score;
  }

  return sum / tokens.length;
}

function minMatchThreshold(query: string): number {
  const normalized = normalize(query);
  if (!normalized) {
    return 0;
  }

  if (normalized.length <= 1) {
    return 0.86;
  }
  if (normalized.length === 2) {
    return 0.66;
  }
  return 0.42;
}

function usageScore(itemId: string, usageMap: UsageMap): number {
  const count = usageMap[itemId]?.count ?? 0;
  return Math.min(Math.log2(count + 1) / 5, 1);
}

function recencyScore(itemId: string, usageMap: UsageMap): number {
  const record = usageMap[itemId];
  if (!record) {
    return 0;
  }

  const ageMs = Date.now() - record.lastUsedAt;
  const oneWeekMs = 7 * 24 * 60 * 60 * 1000;
  const normalizedAge = Math.min(ageMs / oneWeekMs, 1);
  return 1 - normalizedAge;
}

function maybeCreateDynamicItem(rawQuery: string): LaunchItem | null {
  const query = rawQuery.trim();
  const lowerQuery = query.toLowerCase();

  if (lowerQuery.startsWith("g ") && query.length > 2) {
    const keyword = query.slice(2).trim();
    if (!keyword) {
      return null;
    }

    const target = `https://www.google.com/search?q=${encodeURIComponent(
      keyword
    )}`;
    return {
      id: `web:g:${keyword}`,
      type: "web",
      title: `search: ${keyword}`,
      subtitle: "Google search",
      target,
      keywords: ["g", "google", "search", keyword.toLowerCase()]
    };
  }

  if (lowerQuery.startsWith("calc ") && query.length > 5) {
    const expression = query.slice(5).trim();
    if (!expression) {
      return null;
    }

    return {
      id: `command:calc:${expression}`,
      type: "command",
      title: `calc ${expression}`,
      subtitle: "Evaluate expression and copy result",
      target: `command:calc:${expression}`,
      keywords: ["calc", "math", "calculate", expression.toLowerCase()]
    };
  }

  return null;
}

function scoreAndSort(
  items: LaunchItem[],
  query: string,
  usageMap: UsageMap
): LaunchItem[] {
  const lowerQuery = normalize(query);
  const threshold = minMatchThreshold(lowerQuery);

  return items
    .map((item) => {
      const match = matchScore(item, lowerQuery);
      const usage = usageScore(item.id, usageMap);
      const recency = recencyScore(item.id, usageMap);
      const score = match * 0.7 + usage * 0.2 + recency * 0.1;

      return { item, score, match };
    })
    .filter(({ match }) => (lowerQuery ? match >= threshold : true))
    .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
    .map(({ item }) => item);
}

export function computeInitialItems(
  catalog: LaunchItem[],
  usageMap: UsageMap,
  limit = 10
): LaunchItem[] {
  return scoreAndSort(catalog, "", usageMap).slice(0, limit);
}

export function computeSearchItems(
  query: string,
  catalog: LaunchItem[],
  usageMap: UsageMap,
  limit = 20
): LaunchItem[] {
  const dynamic = maybeCreateDynamicItem(query);
  const all = dynamic ? [dynamic, ...catalog] : catalog;
  return scoreAndSort(all, query, usageMap).slice(0, limit);
}
