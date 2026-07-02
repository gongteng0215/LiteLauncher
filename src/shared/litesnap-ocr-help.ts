export type LiteSnapOcrIssue = "module_missing" | "language_pack";

export const WINDOWS_10_OCR_SETUP_STEPS = [
  "点「一键安装 OCR（中+英）」，在 UAC 提示里选「是」授予管理员权限。",
  "等待安装完成（可能需要几分钟，请勿关闭弹出的 PowerShell 窗口）。",
  "点「重启 LiteLauncher」，再点「检测 OCR」。"
] as const;

export interface LiteSnapOcrHelpContent {
  title: string;
  steps: string[];
  showRelaunchButton: boolean;
}

export function isLiteSnapOcrIssue(value: unknown): value is LiteSnapOcrIssue {
  return value === "module_missing" || value === "language_pack";
}

export function inferLiteSnapOcrIssue(message: string): LiteSnapOcrIssue | null {
  const normalized = message.trim();
  if (!normalized) {
    return null;
  }
  if (
    normalized.includes("未加载 Windows OCR") ||
    normalized.includes("OCR 模块") ||
    normalized.includes("recognizeText 不可用") ||
    normalized.includes("native 文件")
  ) {
    return "module_missing";
  }
  if (
    normalized.includes("Windows 设置") ||
    normalized.includes("语言包") ||
    normalized.includes("光学字符识别") ||
    normalized.includes("Windows 已注册 OCR 语言：（无）")
  ) {
    return "language_pack";
  }
  return null;
}

export function getLiteSnapOcrHelp(issue: LiteSnapOcrIssue): LiteSnapOcrHelpContent {
  if (issue === "module_missing") {
    return {
      title: "OCR 组件未加载",
      steps: [
        "完全退出 LiteLauncher（托盘图标右键 → 退出），再重新打开。",
        "若从旧版本升级，请确认已安装最新版。",
        "开发者本地运行：在项目目录执行 pnpm run build 重新编译 native 模块。",
        "若模块已加载但仍无法识别，请点「一键安装 OCR（中+英）」。"
      ],
      showRelaunchButton: true
    };
  }

  return {
    title: "需要安装 Windows OCR 语言包",
    steps: [...WINDOWS_10_OCR_SETUP_STEPS],
    showRelaunchButton: true
  };
}

export interface LiteSnapOcrProbeResult {
  ok: boolean;
  message: string;
  ocrIssue?: LiteSnapOcrIssue;
  moduleLoaded: boolean;
  nativeAddonExists: boolean;
  availableLanguages: string[];
  chineseReady: boolean;
  englishReady: boolean;
  capabilities?: LiteSnapOcrCapabilityInfo[];
}

export type LiteSnapOcrCapabilityLanguage = "zh-CN" | "en-US";

export interface LiteSnapOcrCapabilityInfo {
  languageTag: LiteSnapOcrCapabilityLanguage;
  capabilityName: string;
  state: string;
  installed: boolean;
}

export interface LiteSnapOcrCapabilitiesResult {
  ok: boolean;
  message: string;
  capabilities: LiteSnapOcrCapabilityInfo[];
}

export interface LiteSnapOcrCapabilityInstallResult {
  ok: boolean;
  message: string;
  cancelled?: boolean;
  capabilities: LiteSnapOcrCapabilityInfo[];
}

export interface LiteSnapOcrProbeCache {
  ready: boolean;
  summary: string;
  probeState: {
    ok: boolean;
    moduleLoaded: boolean;
    chineseReady: boolean;
    englishReady: boolean;
  };
  capabilities?: LiteSnapOcrCapabilityInfo[];
  checkedAt: number;
}

export const LITESNAP_OCR_CAPABILITY_DEFAULTS: Record<
  LiteSnapOcrCapabilityLanguage,
  string
> = {
  "zh-CN": "Language.OCR~~~zh-CN~0.0.1.0",
  "en-US": "Language.OCR~~~en-US~0.0.1.0"
};

export const LITESNAP_OCR_SUPPORTED_LANGUAGES: LiteSnapOcrCapabilityLanguage[] = [
  "zh-CN",
  "en-US"
];

export function inferOcrCapabilitiesFromEngineProbe(
  probe: Pick<LiteSnapOcrProbeResult, "chineseReady" | "englishReady">
): LiteSnapOcrCapabilityInfo[] {
  return LITESNAP_OCR_SUPPORTED_LANGUAGES.map((languageTag) => {
    const installed =
      languageTag === "zh-CN" ? probe.chineseReady : probe.englishReady;
    return {
      languageTag,
      capabilityName: LITESNAP_OCR_CAPABILITY_DEFAULTS[languageTag],
      state: installed ? "Installed" : "NotPresent",
      installed
    };
  });
}

export function reconcileOcrCapabilitiesWithProbe(
  capabilities: LiteSnapOcrCapabilityInfo[],
  probe: Pick<LiteSnapOcrProbeResult, "chineseReady" | "englishReady">
): LiteSnapOcrCapabilityInfo[] {
  return capabilities.map((cap) => {
    const ready =
      (cap.languageTag === "zh-CN" && probe.chineseReady) ||
      (cap.languageTag === "en-US" && probe.englishReady);
    if (!ready || cap.installed) {
      return cap;
    }

    return {
      ...cap,
      installed: true,
      state: "Installed"
    };
  });
}

export function resolveMissingOcrCapabilityLanguages(
  capabilities: LiteSnapOcrCapabilityInfo[] | null | undefined,
  probe?: Pick<LiteSnapOcrProbeResult, "chineseReady" | "englishReady"> | null
): LiteSnapOcrCapabilityLanguage[] {
  const reconciled =
    capabilities && capabilities.length > 0 && probe
      ? reconcileOcrCapabilitiesWithProbe(capabilities, probe)
      : capabilities;

  if (!reconciled || reconciled.length === 0) {
    if (probe?.chineseReady && probe?.englishReady) {
      return [];
    }
    return [...LITESNAP_OCR_SUPPORTED_LANGUAGES];
  }

  return reconciled
    .filter((cap) => !cap.installed)
    .map((cap) => cap.languageTag);
}

export function shouldShowLiteSnapOcrInstallButton(
  capabilities: LiteSnapOcrCapabilityInfo[] | null | undefined,
  probe?: Pick<
    LiteSnapOcrProbeResult,
    "ok" | "moduleLoaded" | "chineseReady" | "englishReady"
  > | null
): boolean {
  if (probe?.moduleLoaded && probe.chineseReady && probe.englishReady) {
    return false;
  }

  if (probe?.ok) {
    return false;
  }

  return (
    resolveMissingOcrCapabilityLanguages(capabilities, probe).length > 0
  );
}

export function formatLiteSnapOcrInstallButtonLabel(
  languages: LiteSnapOcrCapabilityLanguage[]
): string {
  if (languages.length === 0) {
    return "";
  }
  if (languages.length >= 2) {
    return "一键安装 OCR（中+英）";
  }
  if (languages[0] === "zh-CN") {
    return "安装 OCR（中文）";
  }
  return "安装 OCR（英文）";
}

function formatReadyLabel(ready: boolean): string {
  return ready ? "可用" : "不可用";
}

export function formatLiteSnapOcrProbeSummary(
  result: LiteSnapOcrProbeResult
): string {
  const lines: string[] = [];
  lines.push(result.message);
  lines.push(
    `OCR 模块：${result.moduleLoaded ? "已加载" : "未加载"}；native 文件：${
      result.nativeAddonExists ? "存在" : "缺失"
    }`
  );

  const languages =
    result.availableLanguages.length > 0
      ? result.availableLanguages.join("、")
      : "（无）";
  lines.push(`Windows 已注册 OCR 语言：${languages}`);
  lines.push(
    `中文引擎：${formatReadyLabel(result.chineseReady)}；英文引擎：${formatReadyLabel(
      result.englishReady
    )}`
  );

  if (result.capabilities && result.capabilities.length > 0) {
    const capSummary = result.capabilities
      .map((cap) => {
        const label = cap.installed
          ? "已安装"
          : cap.state === "NotPresent"
            ? "未安装"
            : cap.state || "未安装";
        return `${cap.languageTag}=${label}`;
      })
      .join("；");
    lines.push(`系统 OCR 组件：${capSummary}`);
  }

  return lines.join("\n");
}
