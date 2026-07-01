export const BAIDU_TRANSLATE_ENDPOINT =
  "https://fanyi-api.baidu.com/api/trans/vip/translate";

export const BAIDU_LLM_TRANSLATE_ENDPOINT =
  "https://fanyi-api.baidu.com/ait/api/aiTextTranslate";

export const BAIDU_DEFAULT_FROM = "auto";
export const BAIDU_DEFAULT_TO = "zh";

/** Baidu standard API documents a 6000-byte limit for q. */
export const BAIDU_MAX_QUERY_BYTES = 6000;

const BAIDU_ERROR_MESSAGES: Record<string, string> = {
  "52001": "百度翻译请求超时，请稍后重试。",
  "52002": "百度翻译系统错误，请稍后重试。",
  "52003": "百度翻译 AppID 或密钥无效，请检查 LiteSnap 设置。",
  "54000": "百度翻译请求参数不完整。",
  "54001": "百度翻译签名错误，请检查 AppID 与密钥是否配对正确。",
  "54003": "百度翻译请求过于频繁，请稍后再试。",
  "54004": "百度翻译账户余额不足，请登录百度翻译开放平台充值。",
  "54005": "百度翻译长文本请求过于频繁，请稍后再试。",
  "58000": "当前 IP 未在百度翻译白名单中，请在开放平台添加 IP。",
  "58001": "百度翻译不支持该语言方向。",
  "58002": "百度翻译服务暂不可用，请稍后再试。",
  "90107": "百度翻译认证未通过，请确认 AppID 与密钥已生效。"
};

export function splitTextByUtf8ByteLimit(
  text: string,
  maxBytes: number
): string[] {
  const encoder = new TextEncoder();
  const parts: string[] = [];
  let buffer = "";

  for (const character of text) {
    const candidate = buffer + character;
    if (encoder.encode(candidate).length > maxBytes) {
      if (buffer) {
        parts.push(buffer);
      }
      buffer = character;
      continue;
    }
    buffer = candidate;
  }

  if (buffer) {
    parts.push(buffer);
  }

  return parts;
}

export function chunkTextForBaidu(
  text: string,
  maxBytes = BAIDU_MAX_QUERY_BYTES - 32
): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) {
    return [];
  }

  const encoder = new TextEncoder();
  if (encoder.encode(normalized).length <= maxBytes) {
    return [normalized];
  }

  const chunks: string[] = [];
  let current = "";

  for (const line of normalized.split("\n")) {
    const candidate = current ? `${current}\n${line}` : line;
    if (encoder.encode(candidate).length <= maxBytes) {
      current = candidate;
      continue;
    }

    if (current) {
      chunks.push(current);
      current = "";
    }

    if (encoder.encode(line).length <= maxBytes) {
      current = line;
      continue;
    }

    const segments = splitTextByUtf8ByteLimit(line, maxBytes);
    if (segments.length > 1) {
      chunks.push(...segments.slice(0, -1));
      current = segments[segments.length - 1] ?? "";
      continue;
    }

    if (segments[0]) {
      current = segments[0];
    }
  }

  if (current) {
    chunks.push(current);
  }

  return chunks;
}

export function buildBaiduTranslateSignSource(
  appId: string,
  query: string,
  salt: string,
  secret: string
): string {
  return `${appId}${query}${salt}${secret}`;
}

export type BaiduTranslateResponsePayload = {
  from?: string;
  to?: string;
  trans_result?: Array<{ src?: string; dst?: string }>;
  error_code?: string | number;
  error_msg?: string;
};

export function extractBaiduTranslatedText(
  payload: BaiduTranslateResponsePayload
): string {
  return (payload.trans_result ?? [])
    .map((entry) => entry.dst ?? "")
    .join("")
    .replace(/\r\n/g, "\n")
    .trim();
}

export function readBaiduTranslateError(
  payload: BaiduTranslateResponsePayload
): string | null {
  if (payload.error_code === undefined || payload.error_code === null) {
    return null;
  }

  const code = String(payload.error_code).trim();
  if (!code || code === "0") {
    return null;
  }

  return formatBaiduTranslateError(payload.error_code, payload.error_msg);
}

export function formatBaiduTranslateError(
  errorCode: string | number | null | undefined,
  errorMessage?: string | null
): string {
  const code = String(errorCode ?? "").trim();
  if (code && BAIDU_ERROR_MESSAGES[code]) {
    return BAIDU_ERROR_MESSAGES[code];
  }

  const detail = typeof errorMessage === "string" ? errorMessage.trim() : "";
  if (detail) {
    return `百度翻译失败（${code || "未知"}）：${detail}`;
  }

  return code
    ? `百度翻译失败（错误码 ${code}），请检查 AppID 与密钥。`
    : "百度翻译失败，请稍后重试。";
}
