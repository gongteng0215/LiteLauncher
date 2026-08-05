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

export type SelectionPopupRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

/**
 * Place a popup beside the point that triggered it.  Prefer the lower-right
 * quadrant, then flip each axis independently before clamping to the display.
 * This keeps a popup close to the selection even when it is near a display edge.
 */
export function calculateSelectionPopupBounds(
  point: { x: number; y: number },
  size: Pick<SelectionPopupRect, "width" | "height">,
  workArea: SelectionPopupRect,
  offset = 16
): SelectionPopupRect {
  const width = Math.min(Math.max(1, size.width), Math.max(1, workArea.width));
  const height = Math.min(Math.max(1, size.height), Math.max(1, workArea.height));
  const minX = workArea.x;
  const minY = workArea.y;
  const maxX = workArea.x + workArea.width - width;
  const maxY = workArea.y + workArea.height - height;
  const preferredX = point.x + offset;
  const preferredY = point.y + offset;
  const flippedX = point.x - offset - width;
  const flippedY = point.y - offset - height;

  const x =
    preferredX <= maxX
      ? preferredX
      : flippedX >= minX
        ? flippedX
        : Math.min(Math.max(preferredX, minX), maxX);
  const y =
    preferredY <= maxY
      ? preferredY
      : flippedY >= minY
        ? flippedY
        : Math.min(Math.max(preferredY, minY), maxY);

  return { x, y, width, height };
}

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
