import type {
  LiteSnapOcrCapabilityInfo,
  LiteSnapOcrProbeCache
} from "../../shared/litesnap-ocr-help";
import { LiteDatabase } from "../database";

const LITESNAP_OCR_PROBE_CACHE_KEY = "litesnapOcrProbeCache";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function normalizeCapabilities(value: unknown): LiteSnapOcrCapabilityInfo[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const capabilities: LiteSnapOcrCapabilityInfo[] = [];
  for (const entry of value) {
    if (!isRecord(entry)) {
      continue;
    }
    const languageTag = entry.languageTag;
    const capabilityName =
      typeof entry.capabilityName === "string" ? entry.capabilityName : "";
    const state = typeof entry.state === "string" ? entry.state : "";
    if (
      (languageTag !== "zh-CN" && languageTag !== "en-US") ||
      !capabilityName
    ) {
      continue;
    }
    capabilities.push({
      languageTag,
      capabilityName,
      state,
      installed: entry.installed === true
    });
  }

  return capabilities.length > 0 ? capabilities : undefined;
}

function normalizeLiteSnapOcrProbeCache(
  value: unknown
): LiteSnapOcrProbeCache | null {
  if (!isRecord(value)) {
    return null;
  }

  const probeState = isRecord(value.probeState) ? value.probeState : null;
  const summary = typeof value.summary === "string" ? value.summary.trim() : "";
  const checkedAt =
    typeof value.checkedAt === "number" && Number.isFinite(value.checkedAt)
      ? value.checkedAt
      : 0;

  if (
    value.ready !== true ||
    !probeState ||
    probeState.ok !== true ||
    probeState.moduleLoaded !== true ||
    probeState.chineseReady !== true ||
    probeState.englishReady !== true ||
    !summary
  ) {
    return null;
  }

  return {
    ready: true,
    summary,
    probeState: {
      ok: true,
      moduleLoaded: true,
      chineseReady: true,
      englishReady: true
    },
    capabilities: normalizeCapabilities(value.capabilities),
    checkedAt
  };
}

export async function getLiteSnapOcrProbeCache(
  db: LiteDatabase
): Promise<LiteSnapOcrProbeCache | null> {
  const raw = await db.getSetting(LITESNAP_OCR_PROBE_CACHE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as unknown;
    const normalized = normalizeLiteSnapOcrProbeCache(parsed);
    if (!normalized) {
      await db.setSetting(LITESNAP_OCR_PROBE_CACHE_KEY, "");
      return null;
    }
    return normalized;
  } catch {
    await db.setSetting(LITESNAP_OCR_PROBE_CACHE_KEY, "");
    return null;
  }
}

export async function setLiteSnapOcrProbeCache(
  db: LiteDatabase,
  cache: LiteSnapOcrProbeCache
): Promise<void> {
  const normalized = normalizeLiteSnapOcrProbeCache(cache);
  if (!normalized) {
    await db.setSetting(LITESNAP_OCR_PROBE_CACHE_KEY, "");
    return;
  }

  await db.setSetting(
    LITESNAP_OCR_PROBE_CACHE_KEY,
    JSON.stringify(normalized)
  );
}

export async function clearLiteSnapOcrProbeCache(
  db: LiteDatabase
): Promise<void> {
  await db.setSetting(LITESNAP_OCR_PROBE_CACHE_KEY, "");
}
