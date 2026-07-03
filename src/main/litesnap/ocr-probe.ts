import {
  formatLiteSnapOcrProbeSummary,
  type LiteSnapOcrProbeResult
} from "../../shared/litesnap-ocr-help";
import type { LiteSnapCaptureProvider } from "./capture-provider";
import {
  formatLiteSnapNativeAddonProbePaths,
  isLiteSnapNativeAddonPresent,
  resolveLiteSnapNativeAddonCandidates,
  resolveLiteSnapNativeAddonPath
} from "./native-addon-path";

export type LiteSnapNativeOcrProbe = {
  availableLanguages?: string[];
  chineseReady?: boolean;
  englishReady?: boolean;
  error?: string;
};

export { resolveLiteSnapNativeAddonPath };

function readNativeOcrProbe(): LiteSnapNativeOcrProbe | null {
  if (process.platform !== "win32") {
    return null;
  }

  if (!isLiteSnapNativeAddonPresent()) {
    return null;
  }

  for (const nativeAddonPath of resolveLiteSnapNativeAddonCandidates()) {
    try {
      const addon = require(nativeAddonPath) as {
        probeOcr?: () => LiteSnapNativeOcrProbe;
      };
      if (!addon || typeof addon.probeOcr !== "function") {
        continue;
      }
      return addon.probeOcr();
    } catch (error) {
      console.warn(`[litesnap] native OCR probe failed for ${nativeAddonPath}`, error);
    }
  }

  return null;
}

function normalizeLanguageList(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function probeLiteSnapOcr(
  provider: LiteSnapCaptureProvider
): LiteSnapOcrProbeResult {
  if (process.platform !== "win32") {
    return {
      ok: false,
      message: "文字识别仅支持 Windows。",
      moduleLoaded: false,
      nativeAddonExists: false,
      availableLanguages: [],
      chineseReady: false,
      englishReady: false
    };
  }

  const nativeAddonExists = isLiteSnapNativeAddonPresent();
  const moduleLoaded = provider.supportsTextRecognition();

  if (!moduleLoaded) {
    const result: LiteSnapOcrProbeResult = {
      ok: false,
      ocrIssue: "module_missing",
      message: nativeAddonExists
        ? "OCR 模块未加载：native 文件存在，但 recognizeText 不可用。请完全退出后重启，或重新安装/编译 LiteLauncher。"
        : `OCR 模块未加载：未找到 native 文件。请使用 ZIP 绿色版或重新安装最新版；开发者请执行 pnpm run build。\n已检查路径：\n${formatLiteSnapNativeAddonProbePaths()}`,
      moduleLoaded: false,
      nativeAddonExists,
      availableLanguages: [],
      chineseReady: false,
      englishReady: false
    };
    return {
      ...result,
      message: formatLiteSnapOcrProbeSummary(result)
    };
  }

  const nativeProbe = readNativeOcrProbe();
  const availableLanguages = normalizeLanguageList(
    nativeProbe?.availableLanguages
  );
  const chineseReady = nativeProbe?.chineseReady === true;
  const englishReady = nativeProbe?.englishReady === true;

  if (!chineseReady && !englishReady) {
    const result: LiteSnapOcrProbeResult = {
      ok: false,
      ocrIssue: "language_pack",
      message:
        nativeProbe?.error?.trim() ||
        "未检测到可用的 Windows OCR 语言包。请点「一键安装 OCR」安装缺失组件。",
      moduleLoaded: true,
      nativeAddonExists,
      availableLanguages,
      chineseReady,
      englishReady
    };
    return {
      ...result,
      message: formatLiteSnapOcrProbeSummary(result)
    };
  }

  const result: LiteSnapOcrProbeResult = {
    ok: true,
    message: "OCR 检测通过，可以正常使用截图文字识别。",
    moduleLoaded: true,
    nativeAddonExists,
    availableLanguages,
    chineseReady,
    englishReady
  };
  return {
    ...result,
    message: formatLiteSnapOcrProbeSummary(result)
  };
}
