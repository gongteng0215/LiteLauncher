import { app, type NativeImage } from "electron";
import type { LiteSnapCaptureProvider } from "./capture-provider";
import { probeLiteSnapOcr } from "./ocr-probe";
import {
  installLiteSnapOcrCapabilities,
  listLiteSnapOcrCapabilities
} from "./ocr-capability-installer";
import {
  formatLiteSnapOcrProbeSummary,
  inferOcrCapabilitiesFromEngineProbe,
  reconcileOcrCapabilitiesWithProbe,
  type LiteSnapOcrCapabilityLanguage,
  type LiteSnapOcrIssue,
  type LiteSnapOcrProbeResult
} from "../../shared/litesnap-ocr-help";
import {
  looksLikeMisrecognizedEnglish,
  scoreLiteSnapOcrText,
  type LiteSnapOcrLanguagePreference
} from "../../shared/litesnap-ocr-quality";
import { normalizeLiteSnapOcrText } from "../../shared/litesnap";

export type LiteSnapOcrRecognitionResult =
  | { ok: true; text: string }
  | { ok: false; message: string; ocrIssue?: LiteSnapOcrIssue };

export class LiteSnapOcrService {
  public constructor(private readonly provider: LiteSnapCaptureProvider) {}

  public async recognize(
    image: NativeImage,
    options?: { languagePreference?: LiteSnapOcrLanguagePreference }
  ): Promise<LiteSnapOcrRecognitionResult> {
    if (!this.provider.supportsTextRecognition()) {
      return {
        ok: false,
        ocrIssue: "module_missing",
        message: "当前未加载 Windows OCR 模块。请完全退出 LiteLauncher 后重新启动；若仍失败，请安装最新版本或重新编译 native 模块。"
      };
    }
    const text = await this.recognizeWithFallback(this.prepareImage(image), options);
    if (text === null) {
      return {
        ok: false,
        ocrIssue: "language_pack",
        message: "未识别到文字。请检查是否已安装 Windows OCR 语言包（英文或中文简体）。"
      };
    }
    const normalized = normalizeLiteSnapOcrText(text);
    return normalized ? { ok: true, text: normalized } : { ok: false, message: "未识别到文字。" };
  }

  public async probe(): Promise<LiteSnapOcrProbeResult> {
    const result = probeLiteSnapOcr(this.provider);
    if (result.moduleLoaded && result.chineseReady && result.englishReady) {
      result.capabilities = inferOcrCapabilitiesFromEngineProbe(result);
    } else {
      try {
        const listed = await listLiteSnapOcrCapabilities();
        if (listed.ok) result.capabilities = reconcileOcrCapabilitiesWithProbe(listed.capabilities, result);
      } catch {
        // Capability listing is best-effort; the engine probe remains useful.
      }
    }
    if (!result.moduleLoaded && result.capabilities?.some((capability) => capability.installed)) {
      result.message = result.nativeAddonExists
        ? "系统 OCR 组件已安装，但 LiteLauncher 的 OCR 原生模块未加载。请完全退出后重新打开，或重新安装最新版本 LiteLauncher。"
        : "系统 OCR 组件已安装，但未找到 LiteLauncher 的 OCR 原生模块（litesnap-capture.node）。请重新安装最新版本；开发者请执行 pnpm run build。";
      result.ocrIssue = "module_missing";
    }
    result.message = `当前版本 v${app.getVersion()}\n${formatLiteSnapOcrProbeSummary(result)}`;
    return result;
  }

  public listCapabilities() {
    return listLiteSnapOcrCapabilities();
  }

  public installCapabilities(languages?: LiteSnapOcrCapabilityLanguage[]) {
    return installLiteSnapOcrCapabilities(languages);
  }

  private prepareImage(image: NativeImage): NativeImage {
    const size = image.getSize();
    const minEdge = Math.min(size.width, size.height);
    if (minEdge >= 56) return image;
    const scale = Math.min(4, Math.ceil(56 / Math.max(1, minEdge)));
    const resized = image.resize({
      width: Math.max(1, Math.round(size.width * scale)),
      height: Math.max(1, Math.round(size.height * scale)),
      quality: "best"
    });
    return resized.isEmpty() ? image : resized;
  }

  private async recognizeWithLanguage(
    image: NativeImage,
    preference: LiteSnapOcrLanguagePreference
  ): Promise<string | null> {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      if (attempt > 0) await new Promise<void>((resolve) => setTimeout(resolve, 80));
      try {
        const text = await this.provider.recognizeText(image, { languagePreference: preference });
        if (typeof text === "string" && text.trim()) return text;
      } catch (error) {
        console.warn("[litesnap] OCR recognition failed", error);
      }
    }
    return null;
  }

  private async recognizeWithFallback(
    image: NativeImage,
    options?: { languagePreference?: LiteSnapOcrLanguagePreference }
  ): Promise<string | null> {
    const preference = options?.languagePreference ?? "chinese";
    if (preference === "english") {
      return (await this.recognizeWithLanguage(image, "english")) ??
        this.recognizeWithLanguage(image, "chinese");
    }
    const chinese = await this.recognizeWithLanguage(image, "chinese");
    if (!chinese) return this.recognizeWithLanguage(image, "english");
    const normalizedChinese = normalizeLiteSnapOcrText(chinese);
    if (normalizedChinese && !looksLikeMisrecognizedEnglish(normalizedChinese)) return chinese;
    const english = await this.recognizeWithLanguage(image, "english");
    if (!english) return chinese;
    const normalizedEnglish = normalizeLiteSnapOcrText(english);
    return !normalizedChinese || scoreLiteSnapOcrText(normalizedEnglish) > scoreLiteSnapOcrText(normalizedChinese)
      ? english
      : chinese;
  }
}
