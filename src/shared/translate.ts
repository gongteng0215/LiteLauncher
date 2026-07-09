export const TRANSLATE_TOOL_PLUGIN_ID = "webtools-translate";

export type TranslateEngine = "standard" | "llm";

export interface TranslateSettings {
  /** Baidu translate open-platform AppID. */
  baiduAppId: string;
  /** Baidu translate open-platform secret key (standard API). */
  baiduSecret: string;
  /** Baidu translate engine: classic VIP API or LLM text translate API. */
  baiduEngine: TranslateEngine;
  /** Baidu LLM text translate API Key (Bearer token). */
  baiduApiKey: string;
}

export interface TranslateTextInput {
  text: string;
  appId?: string;
  secret?: string;
  apiKey?: string;
  engine?: TranslateEngine;
}

export interface TranslateResult {
  ok: boolean;
  sourceText: string;
  translatedText: string;
  message: string;
}

export function createDefaultTranslateSettings(): TranslateSettings {
  return {
    baiduAppId: "",
    baiduSecret: "",
    baiduEngine: "standard",
    baiduApiKey: ""
  };
}
