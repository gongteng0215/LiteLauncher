export interface SelectionTranslateSettings {
  /** Whether the global selection-translate hotkey is active. */
  enabled: boolean;
  /** Accelerator registered with Electron globalShortcut, e.g. F4. */
  hotkey: string;
  /** Restore the previous clipboard text after capturing the selection. */
  restoreClipboard: boolean;
  /** Close the popup when clicking outside it or when it loses focus. */
  dismissOnOutsideClick: boolean;
}

export type SelectionPopupMode = "dictionary" | "translate" | "empty" | "error";

export interface SelectionPopupDictionaryPayload {
  mode: "dictionary";
  sourceText: string;
  entry: import("./dictionary").DictionaryEntry;
  /** Additional reverse-lookup candidates for Chinese queries. */
  candidates?: import("./dictionary").DictionaryEntry[];
}

export interface SelectionPopupTranslatePayload {
  mode: "translate";
  sourceText: string;
  translatedText: string;
}

export interface SelectionPopupEmptyPayload {
  mode: "empty";
  message: string;
}

export interface SelectionPopupErrorPayload {
  mode: "error";
  message: string;
}

export type SelectionPopupPayload =
  | SelectionPopupDictionaryPayload
  | SelectionPopupTranslatePayload
  | SelectionPopupEmptyPayload
  | SelectionPopupErrorPayload;

export function createDefaultSelectionTranslateSettings(): SelectionTranslateSettings {
  return {
    enabled: true,
    hotkey: "F4",
    restoreClipboard: true,
    dismissOnOutsideClick: true
  };
}

export type SelectionPopupShowOptions = {
  /** Cursor position captured when the selection hotkey was pressed. */
  anchorPoint?: { x: number; y: number };
  dismissOnOutsideClick?: boolean;
  /** Windows that should stay clickable above the dismiss backdrop (e.g. launcher). */
  passthroughWindows?: import("electron").BrowserWindow[];
  onOpen?: () => void;
  onClose?: () => void;
};

export function isPointInBounds(
  point: { x: number; y: number },
  bounds: { x: number; y: number; width: number; height: number }
): boolean {
  return (
    point.x >= bounds.x &&
    point.y >= bounds.y &&
    point.x < bounds.x + bounds.width &&
    point.y < bounds.y + bounds.height
  );
}
