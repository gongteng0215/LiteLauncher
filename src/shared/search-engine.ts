import { LaunchItem, UsageRecord } from "./types";

type UsageMap = Record<string, UsageRecord>;

function normalize(value: string): string {
  return value.trim().toLowerCase();
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

function matchScore(item: LaunchItem, query: string): number {
  if (!query) {
    return 1;
  }

  const title = normalize(item.title);
  const subtitle = normalize(item.subtitle);
  const keywords = item.keywords.map(normalize);

  if (title.startsWith(query)) {
    return 1;
  }

  if (keywords.some((keyword) => keyword.startsWith(query))) {
    return 0.9;
  }

  if (title.includes(query) || subtitle.includes(query)) {
    return 0.72;
  }

  const fuzzyTarget = `${title} ${subtitle} ${keywords.join(" ")}`;
  return Math.min(fuzzyScore(fuzzyTarget, query), 0.65);
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

  return items
    .map((item) => {
      const match = matchScore(item, lowerQuery);
      const usage = usageScore(item.id, usageMap);
      const recency = recencyScore(item.id, usageMap);
      const score = match * 0.7 + usage * 0.2 + recency * 0.1;

      return { item, score, match };
    })
    .filter(({ match }) => (lowerQuery ? match > 0 : true))
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
