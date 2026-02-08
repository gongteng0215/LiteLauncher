export const IPC_CHANNELS = {
  getInitialItems: "launcher:get-initial-items",
  search: "launcher:search",
  execute: "launcher:execute",
  hide: "launcher:hide",
  getClipItems: "launcher:get-clip-items",
  copyClipItem: "launcher:copy-clip-item",
  deleteClipItem: "launcher:delete-clip-item",
  clearClipItems: "launcher:clear-clip-items",
  focusInput: "launcher:focus-input",
  openPanel: "launcher:open-panel"
} as const;
