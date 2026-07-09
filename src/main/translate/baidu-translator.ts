import crypto from "node:crypto";

import {
  BAIDU_DEFAULT_FROM,
  BAIDU_DEFAULT_TO,
  BAIDU_LLM_TRANSLATE_ENDPOINT,
  BAIDU_TRANSLATE_ENDPOINT,
  buildBaiduTranslateSignSource,
  chunkTextForBaidu,
  extractBaiduTranslatedText,
  readBaiduTranslateError,
  type BaiduTranslateResponsePayload
} from "../../shared/baidu-translate";
import type { TranslateEngine } from "../../shared/translate";

const BAIDU_REQUEST_TIMEOUT_MS = 12_000;

export type BaiduTranslateOptions = {
  text: string;
  appId: string;
  secret?: string;
  apiKey?: string;
  engine?: TranslateEngine;
  from?: string;
  to?: string;
};

export type BaiduTranslateResult =
  | { ok: true; text: string }
  | { ok: false; message: string };

function buildBaiduTranslateSign(
  appId: string,
  query: string,
  salt: string,
  secret: string
): string {
  return crypto
    .createHash("md5")
    .update(buildBaiduTranslateSignSource(appId, query, salt, secret), "utf8")
    .digest("hex");
}

function createSalt(): string {
  return `${Date.now()}${Math.floor(Math.random() * 1_000_000)}`;
}

type BaiduTranslateChunkResult =
  | { ok: false; message: string }
  | { ok: true; payload: BaiduTranslateResponsePayload };

async function fetchBaiduTranslatePayload(
  url: string,
  init: RequestInit
): Promise<BaiduTranslateChunkResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), BAIDU_REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      ...init,
      signal: controller.signal
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `百度翻译服务不可用（HTTP ${response.status}）。`
      };
    }

    let payload: BaiduTranslateResponsePayload;
    try {
      payload = (await response.json()) as BaiduTranslateResponsePayload;
    } catch (error) {
      console.warn("[translate] Baidu translate response parse failed", error);
      return { ok: false, message: "百度翻译返回了无效数据。" };
    }

    const errorMessage = readBaiduTranslateError(payload);
    if (errorMessage) {
      return { ok: false, message: errorMessage };
    }

    return { ok: true, payload };
  } catch (error) {
    console.warn("[translate] Baidu translate request failed", error);
    const aborted =
      error instanceof Error &&
      (error.name === "AbortError" || error.message.includes("aborted"));
    return {
      ok: false,
      message: aborted
        ? "百度翻译请求超时，请检查网络后重试。"
        : "无法连接百度翻译服务，请检查网络后重试。"
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function translateChunksWithBaidu(
  chunks: string[],
  requestChunk: (chunk: string) => Promise<BaiduTranslateChunkResult>
): Promise<BaiduTranslateResult> {
  const translatedChunks: string[] = [];

  for (const chunk of chunks) {
    const result = await requestChunk(chunk);
    if (!result.ok) {
      return result;
    }

    const translatedText = extractBaiduTranslatedText(result.payload);
    if (!translatedText) {
      return { ok: false, message: "百度翻译未返回译文。" };
    }

    translatedChunks.push(translatedText);
  }

  const translated = translatedChunks.join("\n").replace(/\r\n/g, "\n").trim();
  if (!translated) {
    return { ok: false, message: "未获得译文。" };
  }

  return { ok: true, text: translated };
}

async function translateWithBaiduStandard(
  options: BaiduTranslateOptions
): Promise<BaiduTranslateResult> {
  const appId = options.appId.trim();
  const secret = options.secret?.trim() ?? "";
  if (!appId || !secret) {
    return {
      ok: false,
      message: "通用翻译需要填写百度翻译 AppID 和密钥。"
    };
  }

  const source = options.text.replace(/\r\n/g, "\n").trim();
  if (!source) {
    return { ok: false, message: "没有可翻译的文字。" };
  }

  const chunks = chunkTextForBaidu(source);
  if (chunks.length === 0) {
    return { ok: false, message: "没有可翻译的文字。" };
  }

  const from = options.from?.trim() || BAIDU_DEFAULT_FROM;
  const to = options.to?.trim() || BAIDU_DEFAULT_TO;

  return translateChunksWithBaidu(chunks, async (chunk) => {
    const salt = createSalt();
    const sign = buildBaiduTranslateSign(appId, chunk, salt, secret);
    const body = new URLSearchParams({
      q: chunk,
      from,
      to,
      appid: appId,
      salt,
      sign
    });

    return fetchBaiduTranslatePayload(BAIDU_TRANSLATE_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/x-www-form-urlencoded",
        "User-Agent": "LiteLauncher Translate"
      },
      body: body.toString()
    });
  });
}

async function translateWithBaiduLlm(
  options: BaiduTranslateOptions
): Promise<BaiduTranslateResult> {
  const appId = options.appId.trim();
  const apiKey = options.apiKey?.trim() ?? "";
  if (!appId) {
    return {
      ok: false,
      message: "大模型翻译需要填写百度翻译 AppID。"
    };
  }
  if (!apiKey) {
    return {
      ok: false,
      message: "大模型翻译需要在文本翻译设置中填写百度翻译 API Key。"
    };
  }

  const source = options.text.replace(/\r\n/g, "\n").trim();
  if (!source) {
    return { ok: false, message: "没有可翻译的文字。" };
  }

  const chunks = chunkTextForBaidu(source);
  if (chunks.length === 0) {
    return { ok: false, message: "没有可翻译的文字。" };
  }

  const from = options.from?.trim() || BAIDU_DEFAULT_FROM;
  const to = options.to?.trim() || BAIDU_DEFAULT_TO;

  return translateChunksWithBaidu(chunks, async (chunk) =>
    fetchBaiduTranslatePayload(BAIDU_LLM_TRANSLATE_ENDPOINT, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "User-Agent": "LiteLauncher Translate"
      },
      body: JSON.stringify({
        appid: appId,
        from,
        to,
        q: chunk,
        model_type: "llm"
      })
    })
  );
}

export async function translateWithBaidu(
  options: BaiduTranslateOptions
): Promise<BaiduTranslateResult> {
  const engine = options.engine ?? "standard";
  if (engine === "llm") {
    return translateWithBaiduLlm(options);
  }

  return translateWithBaiduStandard(options);
}
