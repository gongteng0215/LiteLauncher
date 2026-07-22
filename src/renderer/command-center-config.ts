const COMMAND_CENTER_QUICK_ENTRIES = [
  {
    label: "剪贴板工作台",
    icon: "clipboard",
    action: { type: "plugin", pluginId: "clipboard-workbench" }
  },
  {
    label: "截图贴图",
    icon: "screenshot",
    action: { type: "plugin", pluginId: "litesnap" }
  },
  {
    label: "OCR 识别",
    icon: "scan",
    action: { type: "plugin", pluginId: "litesnap", action: "ocr-panel" }
  },
  {
    label: "划词翻译",
    icon: "translate",
    action: { type: "plugin", pluginId: "webtools-translate" }
  },
  {
    label: "文件哈希",
    icon: "document",
    action: { type: "plugin", pluginId: "webtools-file-hash" }
  },
  {
    label: "二维码生成",
    icon: "qr",
    action: { type: "plugin", pluginId: "webtools-qrcode" }
  },
  {
    label: "URL 解析",
    icon: "link",
    action: { type: "plugin", pluginId: "webtools-url-parse" }
  },
  {
    label: "正则工具",
    icon: "search",
    action: { type: "plugin", pluginId: "webtools-regex" }
  }
];

const COMMAND_CENTER_SYSTEM_ENTRIES = [
  {
    label: "硬件检测",
    icon: "settings",
    action: { type: "plugin", pluginId: "hardware-inspector" }
  },
  {
    label: "端口助手",
    icon: "server",
    action: { type: "plugin", pluginId: "webtools-port-helper" }
  },
  {
    label: "错误日志",
    icon: "error",
    action: { type: "settings", focus: "errors" },
    danger: true
  },
  {
    label: "更新检查",
    icon: "sync",
    action: { type: "settings", focus: "updates" }
  },
  {
    label: "设置中心",
    icon: "settings",
    action: { type: "settings" }
  }
];

const COMMAND_CENTER_FOOTER_ENTRIES = [
  {
    label: "关于 LiteLauncher",
    icon: "info",
    action: { type: "settings", focus: "updates" }
  }
];

const COMMAND_CENTER_SUGGESTIONS = [
  "打开 微信",
  "查 IP 归属",
  "翻译 Hello",
  "OCR 截图",
  "查询端口 80",
  "哈希 文件",
  "JSON 格式化",
  "Markdown 预览"
];

window.__LL_COMMAND_CENTER_CONFIG__ = {
  quickEntries: COMMAND_CENTER_QUICK_ENTRIES,
  systemEntries: COMMAND_CENTER_SYSTEM_ENTRIES,
  footerEntries: COMMAND_CENTER_FOOTER_ENTRIES,
  suggestions: COMMAND_CENTER_SUGGESTIONS
} as NonNullable<typeof window.__LL_COMMAND_CENTER_CONFIG__>;
