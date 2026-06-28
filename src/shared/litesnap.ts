export const LITESNAP_PLUGIN_ID = "litesnap";
export const LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT = "F1";
export const LITESNAP_DEFAULT_PIN_SHORTCUT = "F3";

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
}

export interface LiteSnapPanelPayload {
  settings: LiteSnapSettings;
  statusMessage?: string;
  preferredView?: "main" | "settings";
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
    annotationFillShapes: false
  };
}
