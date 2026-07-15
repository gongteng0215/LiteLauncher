import type { LiteSnapOcrIssue } from "../shared/litesnap-ocr-help";

export const LITESNAP_PLUGIN_ID = "litesnap";
export const LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT = "F1";
export const LITESNAP_DEFAULT_PIN_SHORTCUT = "F3";
export const LITESNAP_DEFAULT_COLOR_SHORTCUT = "F4";
export const LITESNAP_DEFAULT_TOGGLE_PIN_CLICK_THROUGH_SHORTCUT = "Ctrl+Shift+T";
export const LITESNAP_RECENT_COLORS_MAX = 8;
export const LITESNAP_HISTORY_MAX_ITEMS_DEFAULT = 20;
export const LITESNAP_HISTORY_MAX_ITEMS_MIN = 5;
export const LITESNAP_HISTORY_MAX_ITEMS_MAX = 50;

export type { LiteSnapOcrIssue };
export type { LiteSnapOcrProbeResult } from "./litesnap-ocr-help";

export type LiteSnapPanelAction =
  | "open"
  | "start-capture"
  | "pin-from-clipboard"
  | "open-settings"
  | "open-history"
  | "start-color-capture";

export type LiteSnapCaptureAction = "copy" | "save" | "pin";

export type LiteSnapOverlayMode = "capture" | "color";

export type LiteSnapHistorySource =
  | "capture-copy"
  | "capture-save"
  | "capture-pin"
  | "clipboard-pin";

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

export interface LiteSnapSettings {
  screenshotShortcut: string;
  pinShortcut: string;
  colorShortcut: string;
  togglePinClickThroughShortcut: string;
  saveDirectory: string;
  saveFormat: "png" | "jpg";
  postCaptureBehavior: "toolbar" | "copy" | "save" | "pin";
  annotationColor: string;
  annotationLineWidth: number;
  annotationTextSize: number;
  annotationTool: LiteSnapAnnotationTool;
  annotationFillShapes: boolean;
  recentColors: string[];
  historyEnabled: boolean;
  historyMaxItems: number;
}

export interface LiteSnapPanelPayload {
  settings: LiteSnapSettings;
  statusMessage?: string;
  preferredView?: "main" | "settings" | "ocr" | "translate" | "history";
  ocrText?: string;
  ocrIssue?: LiteSnapOcrIssue;
  translateSourceText?: string;
  translateText?: string;
}

export interface LiteSnapHistoryItem {
  id: string;
  filePath: string;
  thumbPath: string | null;
  width: number;
  height: number;
  source: LiteSnapHistorySource;
  createdAt: number;
}

export interface LiteSnapCloseAllPinnedWindowsResult {
  count: number;
}

export interface LiteSnapTogglePinClickThroughResult {
  toggled: boolean;
  enabled: boolean;
  count: number;
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
  mode: LiteSnapOverlayMode;
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
  recentColors: string[];
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

export type { TranslateResult as LiteSnapTranslateSelectionResult } from "./translate";

export interface LiteSnapPinnedWindowsToggleResult {
  hidden: boolean;
  count: number;
}

export interface LiteSnapShortcutRegistrationResult {
  screenshot: boolean;
  pin: boolean;
  color: boolean;
  togglePinClickThrough: boolean;
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

export function normalizeLiteSnapRecentColors(
  value: unknown,
  fallback: string[] = []
): string[] {
  const source = Array.isArray(value) ? value : fallback;
  const colors: string[] = [];
  const seen = new Set<string>();
  for (const entry of source) {
    if (typeof entry !== "string") {
      continue;
    }
    const color = entry.trim().toLowerCase();
    if (!/^#[0-9a-f]{6}$/.test(color) || seen.has(color)) {
      continue;
    }
    seen.add(color);
    colors.push(color);
    if (colors.length >= LITESNAP_RECENT_COLORS_MAX) {
      break;
    }
  }
  return colors;
}

export function pushLiteSnapRecentColor(
  colors: string[],
  nextColor: string
): string[] {
  const color = nextColor.trim().toLowerCase();
  if (!/^#[0-9a-f]{6}$/.test(color)) {
    return normalizeLiteSnapRecentColors(colors);
  }
  return normalizeLiteSnapRecentColors([color, ...colors]);
}

export function createDefaultLiteSnapSettings(): LiteSnapSettings {
  return {
    screenshotShortcut: LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT,
    pinShortcut: LITESNAP_DEFAULT_PIN_SHORTCUT,
    colorShortcut: LITESNAP_DEFAULT_COLOR_SHORTCUT,
    togglePinClickThroughShortcut: LITESNAP_DEFAULT_TOGGLE_PIN_CLICK_THROUGH_SHORTCUT,
    saveDirectory: "",
    saveFormat: "png",
    postCaptureBehavior: "toolbar",
    annotationColor: "#ff3b30",
    annotationLineWidth: 3,
    annotationTextSize: 16,
    annotationTool: "select",
    annotationFillShapes: false,
    recentColors: [],
    historyEnabled: true,
    historyMaxItems: LITESNAP_HISTORY_MAX_ITEMS_DEFAULT
  };
}
