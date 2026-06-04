type SearchInputKeyLike = {
  key?: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
};

const NON_TYPING_SEARCH_INPUT_KEYS = new Set<string>([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "Left",
  "Right",
  "Up",
  "Down",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  "Escape",
  "Esc",
  "Enter",
  "Return",
  "Tab",
  "Shift",
  "Control",
  "Alt",
  "Meta",
  "CapsLock",
  "NumLock",
  "ScrollLock",
  "Insert"
]);

export function isKeyboardDrivenSearchInputKey(
  event: SearchInputKeyLike | null | undefined
): boolean {
  const key = String(event?.key ?? "").trim();
  if (!key) {
    return false;
  }

  if (event?.metaKey || event?.altKey) {
    return false;
  }

  if (event?.ctrlKey) {
    return ["v", "x", "z", "y", "Backspace", "Delete", "Del"].includes(key);
  }

  if (NON_TYPING_SEARCH_INPUT_KEYS.has(key)) {
    return false;
  }

  return true;
}

export function shouldDebounceSearchRefresh(
  query: string,
  isSearchMode: boolean,
  fromKeyboard: boolean
): boolean {
  if (!isSearchMode) {
    return false;
  }

  if (fromKeyboard) {
    return true;
  }

  return Boolean(query.trim());
}
