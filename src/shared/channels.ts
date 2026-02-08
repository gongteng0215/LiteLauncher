export const IPC_CHANNELS = {
  getInitialItems: "launcher:get-initial-items",
  getRecommendedItems: "launcher:get-recommended-items",
  getPluginItems: "launcher:get-plugin-items",
  search: "launcher:search",
  execute: "launcher:execute",
  hide: "launcher:hide",
  getClipItems: "launcher:get-clip-items",
  copyClipItem: "launcher:copy-clip-item",
  deleteClipItem: "launcher:delete-clip-item",
  clearClipItems: "launcher:clear-clip-items",
  focusInput: "launcher:focus-input",
  openPanel: "launcher:open-panel",
  debugKey: "launcher:debug-key"
} as const;
