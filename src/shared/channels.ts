export const IPC_CHANNELS = {
  getInitialItems: "launcher:get-initial-items",
  getPinnedItems: "launcher:get-pinned-items",
  getPluginItems: "launcher:get-plugin-items",
  getSearchDisplayConfig: "launcher:get-search-display-config",
  setSearchDisplayConfig: "launcher:set-search-display-config",
  setItemPinned: "launcher:set-item-pinned",
  search: "launcher:search",
  execute: "launcher:execute",
  hide: "launcher:hide",
  getClipItems: "launcher:get-clip-items",
  copyClipItem: "launcher:copy-clip-item",
  deleteClipItem: "launcher:delete-clip-item",
  clearClipItems: "launcher:clear-clip-items",
  focusInput: "launcher:focus-input",
  clearInput: "launcher:clear-input",
  openPanel: "launcher:open-panel",
  debugKey: "launcher:debug-key"
} as const;
