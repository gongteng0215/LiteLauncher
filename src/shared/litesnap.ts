import type { LiteSnapOcrIssue } from "../shared/litesnap-ocr-help";

export const LITESNAP_PLUGIN_ID = "litesnap";
export const LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT = "F1";
export const LITESNAP_DEFAULT_PIN_SHORTCUT = "F3";

export type { LiteSnapOcrIssue };
export type { LiteSnapOcrProbeResult } from "./litesnap-ocr-help";

export type LiteSnapPanelAction =
  | "open"
  | "start-capture"
  | "pin-from-clipboard"
  | "open-settings";

export type LiteSnapCaptureAction = "copy" | "save" | "pin";

export type LiteSnapAnnotationTool =
  | "select"
  | "rect"
  | "ellipse"
  | "line"
  | "arrow"
  | "pen"
  | "text"
  | "number"
  | "mosaic"
  | "blur"
  | "highlight";

export type LiteSnapBaiduTranslateEngine = "standard" | "llm";

export interface LiteSnapSettings {
  screenshotShortcut: string;
  pinShortcut: string;
  saveDirectory: string;
  saveFormat: "png" | "jpg";
  postCaptureBehavior: "toolbar" | "copy" | "save" | "pin";
  annotationColor: string;
  annotationLineWidth: number;
  annotationTextSize: number;
  annotationTool: LiteSnapAnnotationTool;
  annotationFillShapes: boolean;
  /** Baidu translate open-platform AppID. */
  translateBaiduAppId: string;
  /** Baidu translate open-platform secret key (standard API). */
  translateBaiduSecret: string;
  /** Baidu translate engine: classic VIP API or LLM text translate API. */
  translateBaiduEngine: LiteSnapBaiduTranslateEngine;
  /** Baidu LLM text translate API Key (Bearer token). */
  translateBaiduApiKey: string;
}

export interface LiteSnapPanelPayload {
  settings: LiteSnapSettings;
  statusMessage?: string;
  preferredView?: "main" | "settings" | "ocr" | "translate";
  ocrText?: string;
  ocrIssue?: LiteSnapOcrIssue;
  translateSourceText?: string;
  translateText?: string;
}

export interface LiteSnapOverlaySelection {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type LiteSnapWindowRect = LiteSnapOverlaySelection;

export interface LiteSnapOverlayState {
  captureId: string;
  imageDataUrl: string | null;
  sourceImageDataUrl: string | null;
  viewportWidth: number;
  viewportHeight: number;
  selectionMinSize: number;
  annotationColor: string;
  annotationLineWidth: number;
  annotationTextSize: number;
  annotationTool: LiteSnapAnnotationTool;
  annotationFillShapes: boolean;
}

export interface LiteSnapCommitCaptureInput {
  action: LiteSnapCaptureAction;
  selection: LiteSnapOverlaySelection;
  imageDataUrl?: string;
  imagePngBuffer?: ArrayBuffer | Uint8Array;
}

export interface LiteSnapCommitCaptureResult {
  ok: boolean;
  message: string;
  savedPath?: string;
}

export interface LiteSnapRecognizeTextInput {
  selection: LiteSnapOverlaySelection;
}

export interface LiteSnapRecognizeTextResult {
  ok: boolean;
  text: string;
  message: string;
  ocrIssue?: LiteSnapOcrIssue;
}

export interface LiteSnapTranslateSelectionInput {
  selection: LiteSnapOverlaySelection;
}

export interface LiteSnapTranslateSelectionResult {
  ok: boolean;
  sourceText: string;
  translatedText: string;
  message: string;
}

export interface LiteSnapTranslateTextInput {
  text: string;
  appId?: string;
  secret?: string;
  apiKey?: string;
  engine?: LiteSnapBaiduTranslateEngine;
}

export type LiteSnapTranslateTextResult = LiteSnapTranslateSelectionResult;

export interface LiteSnapPinnedWindowsToggleResult {
  hidden: boolean;
  count: number;
}

export interface LiteSnapShortcutRegistrationResult {
  screenshot: boolean;
  pin: boolean;
  message: string;
}

export type LiteSnapSettingsUpdateResult = LiteSnapSettings & {
  shortcutRegistration?: LiteSnapShortcutRegistrationResult;
};

/** Keep at most one blank-line break; extra OCR blank lines become single newlines. */
export function collapseLiteSnapOcrBlankLines(text: string): string {
  const blocks = text.split(/\n\n+/);
  if (blocks.length <= 2) {
    return text.replace(/\n{3,}/g, "\n\n");
  }
  return `${blocks[0]}\n\n${blocks.slice(1).join("\n")}`;
}

/** Strip erroneous spaces Windows OCR inserts between CJK glyphs; keep paragraph gaps. */
export function normalizeLiteSnapOcrText(text: string): string {
  const cjk =
    "\\u2e80-\\u2eff\\u31c0-\\u31ef\\u3400-\\u4dbf\\u4e00-\\u9fff\\uf900-\\ufaff";
  const cjkPunct = "\\u3001-\\u303f\\uff00-\\uffef";
  const cluster = `[${cjk}${cjkPunct}]`;
  // Include ideographic/fullwidth spaces (U+3000) and other unicode spaces — Windows
  // Chinese OCR frequently uses them between characters.
  const horizontalWhitespace = "[ \\t\\f\\v\\u00a0\\u1680\\u2000-\\u200b\\u202f\\u205f\\u3000\\ufeff]+";
  const betweenCjk = new RegExp(`(${cluster})${horizontalWhitespace}(${cluster})`, "gu");
  const punctBeforeLatin = new RegExp(
    `([${cjkPunct}])${horizontalWhitespace}(?=[A-Za-z0-9])`,
    "g"
  );
  const cjkBeforeLatin = new RegExp(
    `([${cjk}])${horizontalWhitespace}(?=[A-Za-z])`,
    "g"
  );

  let normalized = text.replace(/\r\n/g, "\n");
  let previous = "";
  while (normalized !== previous) {
    previous = normalized;
    normalized = normalized.replace(betweenCjk, "$1$2");
  }

  normalized = normalized
    .replace(punctBeforeLatin, "$1")
    .replace(cjkBeforeLatin, "$1");

  return collapseLiteSnapOcrBlankLines(
    normalized.replace(/\r\n/g, "\n")
  );
}

export function createDefaultLiteSnapSettings(): LiteSnapSettings {
  return {
    screenshotShortcut: LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT,
    pinShortcut: LITESNAP_DEFAULT_PIN_SHORTCUT,
    saveDirectory: "",
    saveFormat: "png",
    postCaptureBehavior: "toolbar",
    annotationColor: "#ff3b30",
    annotationLineWidth: 3,
    annotationTextSize: 16,
    annotationTool: "select",
    annotationFillShapes: false,
    translateBaiduAppId: "",
    translateBaiduSecret: "",
    translateBaiduEngine: "standard",
    translateBaiduApiKey: ""
  };
}
