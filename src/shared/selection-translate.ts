export interface SelectionTranslateSettings {
  /** Whether the global selection-translate hotkey is active. */
  enabled: boolean;
  /** Accelerator registered with Electron globalShortcut, e.g. F2. */
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
    hotkey: "F2",
    restoreClipboard: true,
    dismissOnOutsideClick: true
  };
}

export type SelectionPopupShowOptions = {
  dismissOnOutsideClick?: boolean;
};
