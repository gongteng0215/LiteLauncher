namespace RendererPanelRuntime {

  export const LITESNAP_PANEL_WIDTH_TOOLS = [
    { id: "rect", label: "矩形" },
    { id: "ellipse", label: "椭圆" },
    { id: "line", label: "直线" },
    { id: "arrow", label: "箭头" },
    { id: "pen", label: "画笔" },
    { id: "highlight", label: "荧光笔" },
    { id: "mosaic", label: "马赛克" },
    { id: "blur", label: "模糊" }
  ] as const;

  export type LiteSnapPanelWidthTool = (typeof LITESNAP_PANEL_WIDTH_TOOLS)[number]["id"];
  export type LiteSnapPanelLineWidths = Record<LiteSnapPanelWidthTool, number>;

  export function createLiteSnapPanelLineWidths(width = 3): LiteSnapPanelLineWidths {
    return {
      rect: width,
      ellipse: width,
      line: width,
      arrow: width,
      pen: width,
      highlight: width,
      mosaic: width,
      blur: width
    };
  }

  export interface LiteSnapPanelData {
    settings: {
      screenshotShortcut: string;
      pinShortcut: string;
      colorShortcut: string;
      togglePinClickThroughShortcut: string;
      saveDirectory: string;
      saveFormat: "png" | "jpg";
      postCaptureBehavior: "toolbar" | "copy" | "save" | "pin";
      annotationColor: string;
      annotationLineWidth: number;
      annotationLineWidths: LiteSnapPanelLineWidths;
      annotationTextSize: number;
      annotationTool: string;
      annotationFillShapes: boolean;
      recentColors: string[];
      historyEnabled: boolean;
      historyMaxItems: number;
    };
    statusMessage: string;
    ocrIssue?: "module_missing" | "language_pack";
  }

  export const DEFAULT_LITESNAP_PANEL_DATA: LiteSnapPanelData = {
    settings: {
      screenshotShortcut: "F1",
      pinShortcut: "F3",
      colorShortcut: "",
      togglePinClickThroughShortcut: "Ctrl+Shift+T",
      saveDirectory: "",
      saveFormat: "png",
      postCaptureBehavior: "toolbar",
      annotationColor: "#ff3b30",
      annotationLineWidth: 3,
      annotationLineWidths: createLiteSnapPanelLineWidths(),
      annotationTextSize: 16,
      annotationTool: "select",
      annotationFillShapes: false,
      recentColors: [],
      historyEnabled: true,
      historyMaxItems: 20
    },
    statusMessage: "按 F1 进入截图，主窗口会保持可见，便于截取启动器界面。"
  };

  export let liteSnapPanelData: LiteSnapPanelData = {
    settings: {
      ...DEFAULT_LITESNAP_PANEL_DATA.settings,
      annotationLineWidths: {
        ...DEFAULT_LITESNAP_PANEL_DATA.settings.annotationLineWidths
      }
    },
    statusMessage: DEFAULT_LITESNAP_PANEL_DATA.statusMessage
  };

  export let liteSnapOcrIssue: "module_missing" | "language_pack" | null = null;

  export let liteSnapPanelView: "main" | "settings" | "ocr" | "translate" | "history" | "diagnostics" =
    "main";

  export let liteSnapHistoryItems: Array<{
    id: string;
    filePath: string;
    thumbPath: string | null;
    width: number;
    height: number;
    source: string;
    createdAt: number;
  }> = [];

  export let liteSnapDiagnostics: Array<{
    id: string;
    operation: string;
    status: string;
    createdAt: number;
    durationMs: number;
    metrics: Record<string, number | string | boolean>;
    message: string;
  }> = [];

  export let liteSnapOcrText = "";

  export let liteSnapTranslateSourceText = "";

  export let liteSnapTranslateText = "";

  export let liteSnapOcrProbeSummary = "";

  export let liteSnapOcrProbeIssue: "module_missing" | "language_pack" | null = null;

  export let liteSnapOcrProbeState: {
    ok: boolean;
    moduleLoaded: boolean;
    chineseReady: boolean;
    englishReady: boolean;
  } | null = null;

  export let liteSnapOcrCapabilities: Array<{
    languageTag: "zh-CN" | "en-US";
    capabilityName: string;
    state: string;
    installed: boolean;
  }> | null = null;

  export let liteSnapOcrCacheLoadPromise: Promise<void> | null = null;

  export let liteSnapOcrCacheHydrated = false;

  export function applyLiteSnapOcrProbeResult(
    result: {
      ok: boolean;
      message: string;
      ocrIssue?: "module_missing" | "language_pack";
      moduleLoaded: boolean;
      chineseReady: boolean;
      englishReady: boolean;
      capabilities?: Array<{
        languageTag: "zh-CN" | "en-US";
        capabilityName: string;
        state: string;
        installed: boolean;
      }>;
    },
    options: { persist?: boolean } = {}
  ): void {
    liteSnapOcrProbeState = {
      ok: result.ok,
      moduleLoaded: result.moduleLoaded,
      chineseReady: result.chineseReady,
      englishReady: result.englishReady
    };
    liteSnapOcrProbeSummary = result.message;
    liteSnapOcrProbeIssue = result.ok
      ? null
      : result.ocrIssue ?? inferLiteSnapOcrIssueFromMessage(result.message);
    if (result.capabilities && result.capabilities.length > 0) {
      liteSnapOcrCapabilities = result.capabilities;
    }

    if (options.persist !== false && isLiteSnapOcrRuntimeReady()) {
      void persistLiteSnapOcrProbeCacheIfReady();
    }
  }

  export async function persistLiteSnapOcrProbeCacheIfReady(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapSetOcrProbeCache || !liteSnapOcrProbeState) {
      return;
    }

    if (!isLiteSnapOcrRuntimeReady()) {
      return;
    }

    try {
      await launcher.liteSnapSetOcrProbeCache({
        ready: true,
        summary: liteSnapOcrProbeSummary,
        probeState: { ...liteSnapOcrProbeState },
        capabilities: liteSnapOcrCapabilities ?? undefined,
        checkedAt: Date.now()
      });
    } catch (error) {
      console.warn("[litesnap] OCR probe cache persist failed", error);
    }
  }

  export async function loadLiteSnapOcrProbeCache(): Promise<void> {
    if (liteSnapOcrCacheHydrated) {
      return;
    }

    const launcher = getLauncherApi();
    if (!launcher?.liteSnapGetOcrProbeCache) {
      liteSnapOcrCacheHydrated = true;
      return;
    }

    const previousSummary = liteSnapOcrProbeSummary;
    const previousReady = isLiteSnapOcrRuntimeReady();

    try {
      const cache = await launcher.liteSnapGetOcrProbeCache();
      if (cache?.ready) {
        applyLiteSnapOcrProbeResult(
          {
            ok: cache.probeState.ok,
            message: cache.summary,
            moduleLoaded: cache.probeState.moduleLoaded,
            chineseReady: cache.probeState.chineseReady,
            englishReady: cache.probeState.englishReady,
            capabilities: cache.capabilities
          },
          { persist: false }
        );
      }
    } catch (error) {
      console.warn("[litesnap] OCR probe cache load failed", error);
    } finally {
      liteSnapOcrCacheHydrated = true;
      const stateChanged =
        liteSnapOcrProbeSummary !== previousSummary ||
        isLiteSnapOcrRuntimeReady() !== previousReady;
      if (stateChanged) {
        renderList();
      }
    }
  }

  export function ensureLiteSnapOcrCacheLoaded(): void {
    if (liteSnapOcrCacheLoadPromise) {
      return;
    }

    liteSnapOcrCacheLoadPromise = loadLiteSnapOcrProbeCache();
  }

  export function isLiteSnapOcrRuntimeReady(): boolean {
    if (
      liteSnapOcrProbeState?.moduleLoaded &&
      liteSnapOcrProbeState.chineseReady &&
      liteSnapOcrProbeState.englishReady
    ) {
      return true;
    }

    if (liteSnapOcrProbeState?.ok) {
      return true;
    }

    const summary = liteSnapOcrProbeSummary.trim();
    if (!summary) {
      return false;
    }

    return (
      summary.includes("OCR 检测通过") &&
      summary.includes("中文引擎：可用") &&
      summary.includes("英文引擎：可用")
    );
  }

  export function formatLiteSnapOcrEngineStatus(): string {
    const format = (ready: boolean | undefined): string => {
      if (ready === true) {
        return "已就绪";
      }
      if (ready === false) {
        return "未就绪";
      }
      return "未检测";
    };

    return `中文：${format(liteSnapOcrProbeState?.chineseReady)}；英文：${format(
      liteSnapOcrProbeState?.englishReady
    )}`;
  }

  export function resolveLiteSnapMissingOcrLanguages(): Array<"zh-CN" | "en-US"> {
    if (isLiteSnapOcrRuntimeReady()) {
      return [];
    }

    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    return (
      utils?.resolveMissingOcrCapabilityLanguages?.(
        liteSnapOcrCapabilities,
        liteSnapOcrProbeState
      ) ?? ["zh-CN", "en-US"]
    );
  }

  export function shouldShowLiteSnapOcrInstallAction(): boolean {
    if (isLiteSnapOcrRuntimeReady()) {
      return false;
    }

    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    if (utils?.shouldShowLiteSnapOcrInstallButton) {
      return utils.shouldShowLiteSnapOcrInstallButton(
        liteSnapOcrCapabilities,
        liteSnapOcrProbeState
      );
    }

    return resolveLiteSnapMissingOcrLanguages().length > 0;
  }

  export function formatLiteSnapOcrInstallActionLabel(
    languages: Array<"zh-CN" | "en-US">
  ): string {
    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    return (
      utils?.formatLiteSnapOcrInstallButtonLabel?.(languages) ??
      "一键安装 OCR（中+英）"
    );
  }

  export function normalizeLiteSnapOcrPanelText(text: string): string {
    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    if (utils?.normalizeLiteSnapOcrText) {
      return utils.normalizeLiteSnapOcrText(text);
    }
    return text;
  }

  export function resolveLiteSnapOcrIssue(
    dataRecord: Record<string, unknown> | null,
    statusMessage: string
  ): "module_missing" | "language_pack" | null {
    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    const rawIssue = dataRecord?.ocrIssue;
    if (utils?.isLiteSnapOcrIssue?.(rawIssue)) {
      return rawIssue;
    }
    return utils?.inferLiteSnapOcrIssue?.(statusMessage) ?? null;
  }

  export function relaunchLiteLauncherApp(): void {
    const launcher = getLauncherApi();
    if (!launcher?.relaunchApp) {
      setStatus("请从托盘图标右键完全退出 LiteLauncher，再重新打开。");
      return;
    }
    void launcher.relaunchApp();
  }

  export function createLiteSnapOcrSetupGuideSection(): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "litesnap-ocr-help";

    const title = document.createElement("div");
    title.className = "litesnap-ocr-help-title";
    title.textContent = "Windows OCR 配置指引";
    section.appendChild(title);

    const list = document.createElement("ol");
    list.className = "litesnap-ocr-help-steps";
    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    const steps =
      utils?.WINDOWS_10_OCR_SETUP_STEPS ??
      ([
        "点「一键安装 OCR（中+英）」，在 UAC 提示里选「是」。",
        "等待安装完成，不要关闭弹出的 PowerShell 窗口。",
        "点「重启 LiteLauncher」，再点「检测 OCR」。"
      ] as const);
    for (const step of steps) {
      const item = document.createElement("li");
      item.textContent = step;
      list.appendChild(item);
    }
    section.appendChild(list);

    return section;
  }

  export function buildLiteSnapOcrConfigurationSection(options: {
    resultTextareaId: string;
    includeFailureHelp?: boolean;
  }): HTMLElement[] {
    const missingLanguages = resolveLiteSnapMissingOcrLanguages();
    const showInstallButton = shouldShowLiteSnapOcrInstallAction();
    const installButtonLabel = formatLiteSnapOcrInstallActionLabel(missingLanguages);
    const ocrReady = isLiteSnapOcrRuntimeReady();

    const ocrProbeInfo = createLiteSnapInfoRow(
      "文字识别 (OCR)",
      ocrReady
        ? "系统 OCR 组件已就绪"
        : "Win10/11 可用一键安装系统 OCR 组件（需管理员 UAC）",
      ocrReady
        ? "可直接使用截图文字识别；如有异常请点「检测 OCR」"
        : showInstallButton
          ? `推荐先点「${installButtonLabel}」，装完重启再检测`
          : "点「检测 OCR」查看模块与语言包状态"
    );

    const ocrEngineInfo = createLiteSnapInfoRow(
      "OCR 语言引擎",
      formatLiteSnapOcrEngineStatus(),
      "Windows 本地 OCR 会在已就绪的中文/英文引擎间自动选择"
    );

    const ocrSetupGuide = createLiteSnapOcrSetupGuideSection();

    const ocrProbeResultField = document.createElement("div");
    ocrProbeResultField.className = "settings-field litesnap-ocr-field";

    const ocrProbeResultLabel = document.createElement("label");
    ocrProbeResultLabel.className = "settings-field-label";
    ocrProbeResultLabel.textContent = "检测结果";
    ocrProbeResultLabel.htmlFor = options.resultTextareaId;

    const ocrProbeResultTextarea = document.createElement("textarea");
    ocrProbeResultTextarea.id = options.resultTextareaId;
    ocrProbeResultTextarea.className = "litesnap-ocr-textarea";
    ocrProbeResultTextarea.rows = 5;
    ocrProbeResultTextarea.spellcheck = false;
    ocrProbeResultTextarea.readOnly = true;
    ocrProbeResultTextarea.value = liteSnapOcrProbeSummary;
    ocrProbeResultTextarea.placeholder =
      liteSnapOcrProbeSummary ||
      (isLiteSnapOcrRuntimeReady()
        ? "上次检测已通过，可直接使用 OCR；如需复查请点「检测 OCR」"
        : "点「检测 OCR」查看模块与语言包状态");
    ocrProbeResultField.append(ocrProbeResultLabel, ocrProbeResultTextarea);

    const ocrProbeActions = document.createElement("div");
    ocrProbeActions.className = "settings-actions litesnap-ocr-help-actions";

    if (showInstallButton) {
      const installOcrButton = document.createElement("button");
      installOcrButton.type = "button";
      installOcrButton.className = "settings-btn settings-btn-primary";
      installOcrButton.textContent = installButtonLabel;
      installOcrButton.addEventListener("click", () => {
        void runLiteSnapInstallOcrCapabilities(
          installOcrButton,
          ocrProbeResultTextarea,
          missingLanguages
        );
      });
      ocrProbeActions.appendChild(installOcrButton);
    }

    const ocrProbeButton = document.createElement("button");
    ocrProbeButton.type = "button";
    ocrProbeButton.className = "settings-btn settings-btn-secondary";
    ocrProbeButton.textContent = "检测 OCR";
    ocrProbeButton.addEventListener("click", () => {
      void runLiteSnapSettingsOcrProbe(ocrProbeButton, ocrProbeResultTextarea);
    });

    const relaunchButton = document.createElement("button");
    relaunchButton.type = "button";
    relaunchButton.className = "settings-btn settings-btn-secondary";
    relaunchButton.textContent = "重启 LiteLauncher";
    relaunchButton.addEventListener("click", () => {
      relaunchLiteLauncherApp();
    });

    ocrProbeActions.append(ocrProbeButton, relaunchButton);

    const nodes: HTMLElement[] = [
      ocrProbeInfo,
      ocrEngineInfo,
      ...(ocrReady ? [] : [ocrSetupGuide]),
      ocrProbeResultField,
      ocrProbeActions
    ];

    if (options.includeFailureHelp && liteSnapOcrProbeIssue) {
      nodes.push(createLiteSnapOcrHelpSection(liteSnapOcrProbeIssue));
    }

    return nodes;
  }

  export function createLiteSnapOcrHelpSection(
    issue: "module_missing" | "language_pack"
  ): HTMLDivElement {
    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    const help = utils?.getLiteSnapOcrHelp?.(issue) ?? {
      title: issue === "module_missing" ? "OCR 组件未加载" : "需要安装 Windows OCR 语言包",
      steps: [
        "点「一键安装 OCR（中+英）」，在 UAC 提示里选「是」。",
        "安装完成后点「重启 LiteLauncher」，再点「检测 OCR」。"
      ],
      showRelaunchButton: true
    };

    const section = document.createElement("div");
    section.className = "litesnap-ocr-help";

    const title = document.createElement("div");
    title.className = "litesnap-ocr-help-title";
    title.textContent = help.title;
    section.appendChild(title);

    const list = document.createElement("ol");
    list.className = "litesnap-ocr-help-steps";
    for (const step of help.steps) {
      const item = document.createElement("li");
      item.textContent = step;
      list.appendChild(item);
    }
    section.appendChild(list);

    if (help.showRelaunchButton) {
      const actions = document.createElement("div");
      actions.className = "settings-actions litesnap-ocr-help-actions";

      const relaunchButton = document.createElement("button");
      relaunchButton.type = "button";
      relaunchButton.className = "settings-btn settings-btn-primary";
      relaunchButton.textContent = "重启 LiteLauncher";
      relaunchButton.addEventListener("click", () => {
        relaunchLiteLauncherApp();
      });
      actions.appendChild(relaunchButton);
      section.appendChild(actions);
    }

    return section;
  }

  export function normalizeLiteSnapPanelData(value: unknown): LiteSnapPanelData {
    const record = toRecord(value);
    const settingsRecord = toRecord(record?.settings);

    const recentColors = Array.isArray(settingsRecord?.recentColors)
      ? settingsRecord.recentColors.filter(
          (entry): entry is string => typeof entry === "string"
        )
      : DEFAULT_LITESNAP_PANEL_DATA.settings.recentColors;
    const historyMaxItemsRaw =
      typeof settingsRecord?.historyMaxItems === "number"
        ? settingsRecord.historyMaxItems
        : DEFAULT_LITESNAP_PANEL_DATA.settings.historyMaxItems;
    const annotationLineWidthRaw =
      typeof settingsRecord?.annotationLineWidth === "number"
        ? settingsRecord.annotationLineWidth
        : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationLineWidth;
    const annotationLineWidth = Number.isFinite(annotationLineWidthRaw)
      ? Math.min(60, Math.max(1, Math.round(annotationLineWidthRaw)))
      : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationLineWidth;
    const annotationLineWidthsRecord = toRecord(settingsRecord?.annotationLineWidths);
    const annotationLineWidths = createLiteSnapPanelLineWidths(annotationLineWidth);
    for (const { id } of LITESNAP_PANEL_WIDTH_TOOLS) {
      const rawWidth = annotationLineWidthsRecord?.[id];
      annotationLineWidths[id] =
        typeof rawWidth === "number" && Number.isFinite(rawWidth)
          ? Math.min(60, Math.max(1, Math.round(rawWidth)))
          : annotationLineWidth;
    }

    return {
      settings: {
        screenshotShortcut:
          typeof settingsRecord?.screenshotShortcut === "string"
            ? settingsRecord.screenshotShortcut
            : DEFAULT_LITESNAP_PANEL_DATA.settings.screenshotShortcut,
        pinShortcut:
          typeof settingsRecord?.pinShortcut === "string"
            ? settingsRecord.pinShortcut
            : DEFAULT_LITESNAP_PANEL_DATA.settings.pinShortcut,
        colorShortcut: "",
        togglePinClickThroughShortcut:
          typeof settingsRecord?.togglePinClickThroughShortcut === "string"
            ? settingsRecord.togglePinClickThroughShortcut
            : DEFAULT_LITESNAP_PANEL_DATA.settings.togglePinClickThroughShortcut,
        saveDirectory:
          typeof settingsRecord?.saveDirectory === "string"
            ? settingsRecord.saveDirectory
            : DEFAULT_LITESNAP_PANEL_DATA.settings.saveDirectory,
        saveFormat:
          settingsRecord?.saveFormat === "jpg" ? "jpg" : "png",
        postCaptureBehavior:
          settingsRecord?.postCaptureBehavior === "copy" ||
          settingsRecord?.postCaptureBehavior === "save" ||
          settingsRecord?.postCaptureBehavior === "pin"
            ? settingsRecord.postCaptureBehavior
            : "toolbar",
        annotationColor:
          typeof settingsRecord?.annotationColor === "string"
            ? settingsRecord.annotationColor
            : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationColor,
        annotationLineWidth,
        annotationLineWidths,
        annotationTextSize:
          typeof settingsRecord?.annotationTextSize === "number"
            ? settingsRecord.annotationTextSize
            : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationTextSize,
        annotationTool:
          typeof settingsRecord?.annotationTool === "string"
            ? settingsRecord.annotationTool
            : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationTool,
        annotationFillShapes:
          typeof settingsRecord?.annotationFillShapes === "boolean"
            ? settingsRecord.annotationFillShapes
            : DEFAULT_LITESNAP_PANEL_DATA.settings.annotationFillShapes,
        recentColors,
        historyEnabled:
          typeof settingsRecord?.historyEnabled === "boolean"
            ? settingsRecord.historyEnabled
            : DEFAULT_LITESNAP_PANEL_DATA.settings.historyEnabled,
        historyMaxItems: Number.isFinite(historyMaxItemsRaw)
          ? Math.min(50, Math.max(5, Math.round(historyMaxItemsRaw)))
          : DEFAULT_LITESNAP_PANEL_DATA.settings.historyMaxItems
      },
      statusMessage:
        typeof record?.statusMessage === "string"
          ? record.statusMessage
          : DEFAULT_LITESNAP_PANEL_DATA.statusMessage
    };
  }

  export function buildLiteSnapTarget(
    action:
      | "start-capture"
      | "pin-from-clipboard"
      | "open-settings"
      | "open-history"
      | "open-diagnostics"
      | "start-color-capture"
  ): string {
    const params = new URLSearchParams();
    params.set("action", action);
    return `command:plugin:${LITESNAP_PLUGIN_ID}?${params.toString()}`;
  }

  export function formatLiteSnapPostCaptureBehavior(
    behavior: LiteSnapPanelData["settings"]["postCaptureBehavior"]
  ): string {
    switch (behavior) {
      case "copy":
        return "截图后直接复制";
      case "save":
        return "截图后直接保存";
      case "pin":
        return "截图后直接贴图";
      default:
        return "保留工具条";
    }
  }

  export function createLiteSnapFormSection(children: HTMLElement[]): HTMLDivElement {
    const section = document.createElement("div");
    section.className = "litesnap-form-section";
    section.append(...children);
    return section;
  }

  export function createLiteSnapFieldsGrid(rows: HTMLElement[]): HTMLDivElement {
    const grid = document.createElement("div");
    grid.className = "litesnap-fields-grid";
    for (const row of rows) {
      row.classList.add("litesnap-fields-grid-item");
      grid.appendChild(row);
    }
    return grid;
  }

  export function createLiteSnapInfoRow(
    labelText: string,
    valueText: string,
    hintText?: string
  ): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "settings-row settings-row-textarea settings-row-info";

    const label = document.createElement("div");
    label.className = "settings-row-label";
    label.textContent = labelText;

    const value = document.createElement("div");
    value.className = "settings-value settings-row-info-value";
    value.textContent = valueText;

    row.append(label, value);

    if (hintText) {
      const hint = document.createElement("div");
      hint.className = "settings-row-hint";
      hint.textContent = hintText;
      row.appendChild(hint);
    }

    return row;
  }

  export function createLiteSnapFieldRow(
    labelText: string,
    control: HTMLElement,
    hintText?: string
  ): HTMLDivElement {
    const row = document.createElement("div");
    row.className = "litesnap-settings-field";

    const label = document.createElement("label");
    label.className = "settings-row-label";
    label.textContent = labelText;
    if (control.id) {
      label.htmlFor = control.id;
    }

    row.append(label, control);

    if (hintText) {
      const hint = document.createElement("div");
      hint.className = "settings-row-hint";
      hint.textContent = hintText;
      row.appendChild(hint);
    }

    return row;
  }

  export function createLiteSnapTextInput(
    id: string,
    name: string,
    value: string,
    placeholder = "",
    type = "text"
  ): HTMLInputElement {
    const input = document.createElement("input");
    input.id = id;
    input.name = name;
    input.type = type;
    input.className = "settings-number";
    input.value = value;
    input.placeholder = placeholder;
    return input;
  }

  export function formatLiteSnapShortcutFromEvent(event: KeyboardEvent): string | null {
    const key = event.key;
    if (!key || key === "Control" || key === "Shift" || key === "Alt" || key === "Meta") {
      return null;
    }
    if (key === "Escape") {
      return "";
    }

    const parts: string[] = [];
    if (event.ctrlKey) {
      parts.push("Ctrl");
    }
    if (event.altKey) {
      parts.push("Alt");
    }
    if (event.shiftKey) {
      parts.push("Shift");
    }

    const normalizedKey =
      key.length === 1
        ? key.toUpperCase()
        : key === " "
          ? "Space"
          : key.replace(/^Arrow/, "");
    parts.push(normalizedKey);
    return parts.join("+");
  }

  export function getLiteSnapShortcutValidationError(shortcut: string): string | null {
    const normalized = shortcut.trim();
    if (!normalized) {
      return "快捷键不能为空。";
    }
    if (/\s/.test(normalized)) {
      return "快捷键不能包含空格。";
    }
    if (/^F(?:[1-9]|1[0-9]|2[0-4])$/i.test(normalized)) {
      return null;
    }
    if (normalized.includes("+")) {
      const parts = normalized.split("+").filter(Boolean);
      const key = parts[parts.length - 1] ?? "";
      const modifiers = new Set(parts.slice(0, -1).map((part) => part.toLowerCase()));
      if (!key || modifiers.size === 0) {
        return "组合快捷键需要包含主按键。";
      }
      if (modifiers.has("ctrl") || modifiers.has("alt") || modifiers.has("shift")) {
        return null;
      }
    }
    return "请使用 F1-F24，或 Ctrl/Alt/Shift 组合快捷键。";
  }

  export function createLiteSnapShortcutControl(
    id: string,
    name: string,
    value: string,
    placeholder: string
  ): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "litesnap-settings-inline-control";

    const input = createLiteSnapTextInput(id, name, value, placeholder);

    const recordButton = document.createElement("button");
    recordButton.type = "button";
    recordButton.className =
      "settings-btn settings-btn-secondary litesnap-settings-inline-btn";
    recordButton.textContent = "录制";
    recordButton.addEventListener("click", () => {
      const originalText = recordButton.textContent ?? "录制";
      recordButton.textContent = "按下快捷键...";
      input.focus();

      const onKeyDown = (event: KeyboardEvent): void => {
        event.preventDefault();
        event.stopPropagation();
        const shortcut = formatLiteSnapShortcutFromEvent(event);
        if (shortcut === null) {
          return;
        }
        if (shortcut) {
          const error = getLiteSnapShortcutValidationError(shortcut);
          if (error) {
            setStatus(error);
          } else {
            input.value = shortcut;
          }
        }
        recordButton.textContent = originalText;
        input.removeEventListener("keydown", onKeyDown, true);
      };

      input.addEventListener("keydown", onKeyDown, true);
    });

    wrapper.append(input, recordButton);
    return wrapper;
  }

  export function createLiteSnapDirectoryControl(
    id: string,
    name: string,
    value: string,
    placeholder: string
  ): HTMLDivElement {
    const wrapper = document.createElement("div");
    wrapper.className = "litesnap-settings-inline-control";

    const input = createLiteSnapTextInput(id, name, value, placeholder);

    const pickButton = document.createElement("button");
    pickButton.type = "button";
    pickButton.className =
      "settings-btn settings-btn-secondary litesnap-settings-inline-btn";
    pickButton.textContent = "选择";
    pickButton.addEventListener("click", () => {
      const launcher = getLauncherApi();
      if (!launcher?.pickDirectoryPath) {
        setStatus("当前版本不支持选择文件夹，请手动输入保存目录。");
        return;
      }
      beginPluginNativeInteraction(20000);
      void launcher
        .pickDirectoryPath()
        .then((selectedPath) => {
          if (typeof selectedPath === "string" && selectedPath.trim()) {
            input.value = selectedPath.trim();
          }
        })
        .finally(() => schedulePluginNativeInteractionRelease(260));
    });

    wrapper.append(input, pickButton);
    return wrapper;
  }

  export function createLiteSnapNumberInput(
    id: string,
    name: string,
    value: number,
    min: number,
    max: number
  ): HTMLInputElement {
    const input = document.createElement("input");
    input.id = id;
    input.name = name;
    input.type = "number";
    input.className = "settings-number";
    input.min = String(min);
    input.max = String(max);
    input.step = "1";
    input.value = String(value);
    return input;
  }

  export function createLiteSnapLineWidthsControl(
    values: LiteSnapPanelLineWidths
  ): HTMLDivElement {
    const grid = document.createElement("div");
    grid.id = "litesnap-annotation-line-widths";
    grid.className = "litesnap-tool-width-grid";
    grid.setAttribute("role", "group");
    grid.setAttribute("aria-label", "各工具默认粗细");

    for (const { id, label } of LITESNAP_PANEL_WIDTH_TOOLS) {
      const item = document.createElement("label");
      item.className = "litesnap-tool-width-field";
      item.htmlFor = `litesnap-annotation-line-width-${id}`;

      const name = document.createElement("span");
      name.textContent = label;
      const input = createLiteSnapNumberInput(
        `litesnap-annotation-line-width-${id}`,
        `annotationLineWidth.${id}`,
        values[id],
        1,
        60
      );

      item.append(name, input);
      grid.appendChild(item);
    }

    return grid;
  }

  export function createLiteSnapSelect(
    id: string,
    name: string,
    value: string,
    options: Array<{ value: string; label: string }>
  ): HTMLSelectElement {
    const select = document.createElement("select");
    select.id = id;
    select.name = name;
    select.className = "settings-number";
    for (const option of options) {
      const optionNode = document.createElement("option");
      optionNode.value = option.value;
      optionNode.textContent = option.label;
      optionNode.selected = option.value === value;
      select.appendChild(optionNode);
    }
    return select;
  }

  export function createLiteSnapCheckbox(
    id: string,
    name: string,
    checked: boolean
  ): HTMLInputElement {
    const input = document.createElement("input");
    input.id = id;
    input.name = name;
    input.type = "checkbox";
    input.checked = checked;
    return input;
  }

  export async function runLiteSnapInstallOcrCapabilities(
    installButton: HTMLButtonElement,
    resultTextarea: HTMLTextAreaElement,
    languages: Array<"zh-CN" | "en-US">
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapInstallOcrCapabilities) {
      setStatus("当前版本不支持一键安装，请升级 LiteLauncher 或手动运行 PowerShell。");
      return;
    }

    const installLanguages =
      languages.length > 0 ? languages : resolveLiteSnapMissingOcrLanguages();
    if (installLanguages.length === 0) {
      setStatus("系统 OCR 组件已全部安装，无需重复安装。");
      renderList();
      return;
    }

    const defaultLabel = formatLiteSnapOcrInstallActionLabel(installLanguages);
    const previousLabel = installButton.textContent ?? defaultLabel;
    installButton.disabled = true;
    installButton.textContent = "安装中…";
    resultTextarea.placeholder =
      "正在请求管理员权限并安装 OCR 组件，可能需要几分钟，请勿关闭弹出的 PowerShell 窗口…";
    beginPluginNativeInteraction(1_800_000);

    try {
      const result = await launcher.liteSnapInstallOcrCapabilities(installLanguages);
      const capLines = result.capabilities
        .map(
          (cap) =>
            `${cap.languageTag}: ${cap.installed ? "已安装" : cap.state || "未安装"}`
        )
        .join("\n");
      const zhCap = result.capabilities.find((cap) => cap.languageTag === "zh-CN");
      const enCap = result.capabilities.find((cap) => cap.languageTag === "en-US");
      applyLiteSnapOcrProbeResult({
        ok: result.ok,
        message: [result.message, capLines].filter(Boolean).join("\n"),
        moduleLoaded: liteSnapOcrProbeState?.moduleLoaded ?? true,
        chineseReady: zhCap?.installed ?? liteSnapOcrProbeState?.chineseReady ?? false,
        englishReady: enCap?.installed ?? liteSnapOcrProbeState?.englishReady ?? false,
        capabilities: result.capabilities,
        ocrIssue: result.ok ? undefined : "language_pack"
      });
      resultTextarea.value = liteSnapOcrProbeSummary;
      resultTextarea.placeholder = "";
      setStatus(
        result.cancelled
          ? "已取消管理员授权。"
          : result.ok
            ? "OCR 组件安装完成，请重启 LiteLauncher。"
            : result.message
      );
      renderList();
    } catch (error) {
      console.warn("[litesnap] OCR capability install failed", error);
      liteSnapOcrProbeSummary = "安装失败，请确认已点击 UAC「是」授予管理员权限。";
      liteSnapOcrProbeIssue = "language_pack";
      resultTextarea.value = liteSnapOcrProbeSummary;
      setStatus("OCR 安装失败。");
      renderList();
    } finally {
      installButton.disabled = false;
      installButton.textContent = previousLabel;
      schedulePluginNativeInteractionRelease(260);
    }
  }

  export async function runLiteSnapSettingsOcrProbe(
    probeButton: HTMLButtonElement,
    resultTextarea: HTMLTextAreaElement
  ): Promise<void> {
    const launcher = getLauncherApi();
    const previousLabel = probeButton.textContent ?? "检测 OCR";
    probeButton.disabled = true;
    probeButton.textContent = "检测中…";
    resultTextarea.value = "";
    resultTextarea.placeholder = "正在检测 Windows OCR 模块与语言包…";
    liteSnapOcrProbeIssue = null;
    beginPluginNativeInteraction(25_000);

    if (!launcher?.liteSnapProbeOcr) {
      liteSnapOcrProbeSummary = [
        "当前版本未加载 OCR 检测接口，请先重启 LiteLauncher。",
        "若仍不可用，请确认已安装最新版，并点「一键安装 OCR（中+英）」。"
      ].join("\n");
      liteSnapOcrProbeIssue = "module_missing";
      resultTextarea.value = liteSnapOcrProbeSummary;
      resultTextarea.placeholder = "";
      setStatus("请先重启应用，再试一键安装 OCR。");
      probeButton.disabled = false;
      probeButton.textContent = previousLabel;
      schedulePluginNativeInteractionRelease(260);
      return;
    }

    let shouldRefreshPanel = false;
    try {
      const result = await launcher.liteSnapProbeOcr();
      applyLiteSnapOcrProbeResult(result);
      resultTextarea.value = liteSnapOcrProbeSummary;
      resultTextarea.placeholder = "";
      setStatus(
        result.ok
          ? "OCR 检测通过。"
          : shouldShowLiteSnapOcrInstallAction()
            ? `OCR 检测未通过，请点「${formatLiteSnapOcrInstallActionLabel(
                resolveLiteSnapMissingOcrLanguages()
              )}」或「重启 LiteLauncher」。`
            : "OCR 检测未通过，请点「重启 LiteLauncher」。"
      );
      shouldRefreshPanel = true;
    } catch (error) {
      console.warn("[litesnap] settings OCR probe failed", error);
      liteSnapOcrProbeSummary = [
        "检测失败，请完全退出 LiteLauncher 后重试。",
        "可先点「一键安装 OCR（中+英）」安装系统语言包。"
      ].join("\n");
      liteSnapOcrProbeIssue = "module_missing";
      resultTextarea.value = liteSnapOcrProbeSummary;
      resultTextarea.placeholder = "";
      setStatus("OCR 检测失败，请重试一键安装。");
      shouldRefreshPanel = true;
    } finally {
      probeButton.disabled = false;
      probeButton.textContent = previousLabel;
      schedulePluginNativeInteractionRelease(260);
      if (shouldRefreshPanel) {
        renderList();
      }
    }
  }

  export function inferLiteSnapOcrIssueFromMessage(
    message: string
  ): "module_missing" | "language_pack" | null {
    const utils = window.__LL_LITESNAP_TEXT_UTILS__;
    return utils?.inferLiteSnapOcrIssue?.(message) ?? null;
  }

  export async function saveLiteSnapSettings(form: HTMLFormElement): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("启动器桥接暂不可用。");
      return;
    }

    const submitButton = form.querySelector<HTMLButtonElement>(
      'button[type="submit"]'
    );
    if (submitButton?.disabled) {
      return;
    }

    const formData = new FormData(form);
    const screenshotShortcut = String(formData.get("screenshotShortcut") ?? "").trim();
    const pinShortcut = String(formData.get("pinShortcut") ?? "").trim();
    const togglePinClickThroughShortcut = String(
      formData.get("togglePinClickThroughShortcut") ?? ""
    ).trim();
    const screenshotShortcutError = getLiteSnapShortcutValidationError(screenshotShortcut);
    if (screenshotShortcutError) {
      setStatus(`截图快捷键无效：${screenshotShortcutError}`);
      return;
    }
    const pinShortcutError = getLiteSnapShortcutValidationError(pinShortcut);
    if (pinShortcutError) {
      setStatus(`贴图快捷键无效：${pinShortcutError}`);
      return;
    }
    if (togglePinClickThroughShortcut) {
      const togglePinClickThroughError = getLiteSnapShortcutValidationError(
        togglePinClickThroughShortcut
      );
      if (togglePinClickThroughError) {
        setStatus(`点击穿透快捷键无效：${togglePinClickThroughError}`);
        return;
      }
    }

    const historyMaxItemsRaw = Number(formData.get("historyMaxItems"));
    const historyMaxItems = Number.isFinite(historyMaxItemsRaw)
      ? Math.min(50, Math.max(5, Math.round(historyMaxItemsRaw)))
      : DEFAULT_LITESNAP_PANEL_DATA.settings.historyMaxItems;
    const annotationLineWidths = {
      ...liteSnapPanelData.settings.annotationLineWidths
    };
    for (const { id } of LITESNAP_PANEL_WIDTH_TOOLS) {
      const rawWidth = Number(formData.get(`annotationLineWidth.${id}`));
      annotationLineWidths[id] = Number.isFinite(rawWidth)
        ? Math.min(60, Math.max(1, Math.round(rawWidth)))
        : liteSnapPanelData.settings.annotationLineWidths[id];
    }

    const patch = {
      screenshotShortcut,
      pinShortcut,
      colorShortcut: "",
      togglePinClickThroughShortcut,
      saveDirectory: String(formData.get("saveDirectory") ?? "").trim(),
      saveFormat:
        formData.get("saveFormat") === "jpg" ? "jpg" : "png",
      postCaptureBehavior:
        formData.get("postCaptureBehavior") === "copy" ||
        formData.get("postCaptureBehavior") === "save" ||
        formData.get("postCaptureBehavior") === "pin"
          ? formData.get("postCaptureBehavior")
          : "toolbar",
      annotationColor: String(formData.get("annotationColor") ?? "").trim(),
      annotationLineWidth: liteSnapPanelData.settings.annotationLineWidth,
      annotationLineWidths,
      annotationTextSize: Number(formData.get("annotationTextSize")),
      annotationFillShapes: formData.get("annotationFillShapes") === "on",
      historyEnabled: formData.get("historyEnabled") === "on",
      historyMaxItems
    };

    const previousLabel = submitButton?.textContent ?? "保存设置";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "保存中…";
    }

    try {
      const settings = await launcher.setLiteSnapSettings(patch);
      const shortcutRegistration = toRecord(toRecord(settings)?.shortcutRegistration);
      const statusMessage =
        typeof shortcutRegistration?.message === "string"
          ? `LiteSnap 设置已保存。${shortcutRegistration.message}`
          : "LiteSnap 设置已保存。";
      liteSnapPanelData = normalizeLiteSnapPanelData({
        settings,
        statusMessage
      });
      liteSnapPanelView = "settings";
      setStatus(statusMessage);
      // The form already reflects the values the user just submitted, so a
      // full renderList() rebuild here is unnecessary and would only reset
      // scroll position/focus. Just restore the submit button in place.
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
    } catch (error) {
      console.warn("[litesnap] save settings failed", error);
      setStatus("保存设置失败，请重试。");
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = previousLabel;
      }
    }
  }

  export async function hydrateLiteSnapPanelFromSettings(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.getLiteSnapSettings) {
      return;
    }

    try {
      const settings = await launcher.getLiteSnapSettings();
      liteSnapPanelData = normalizeLiteSnapPanelData({
        ...liteSnapPanelData,
        settings
      });
      if (activePluginPanel?.pluginId === LITESNAP_PLUGIN_ID) {
        renderList();
      }
    } catch {
      // Keep the last known panel state if settings cannot be loaded.
    }
  }

  export async function executeLiteSnapPanelAction(
    action:
      | "start-capture"
      | "pin-from-clipboard"
      | "toggle-pinned-windows"
      | "close-all-pinned-windows"
      | "open-settings"
      | "open-history"
      | "open-diagnostics"
      | "start-color-capture"
  ): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("启动器桥接暂不可用。");
      return;
    }

    if (action === "open-settings") {
      openLiteSnapSettingsView();
      return;
    }

    if (action === "open-history") {
      openLiteSnapHistoryView();
      return;
    }

    if (action === "open-diagnostics") {
      openLiteSnapDiagnosticsView();
      return;
    }

    if (action === "start-capture") {
      const ok = await launcher.liteSnapStartCapture();
      setStatus(ok ? "已进入截图模式，主窗口保持可见。" : "LiteSnap 截图启动失败。");
      return;
    }

    if (action === "start-color-capture") {
      if (!launcher.liteSnapStartColorCapture) {
        setStatus("当前版本暂不支持取色，请升级 LiteLauncher。");
        return;
      }
      const ok = await launcher.liteSnapStartColorCapture();
      setStatus(ok ? "已进入取色模式。" : "LiteSnap 取色启动失败。");
      return;
    }

    if (action === "toggle-pinned-windows") {
      const result = await launcher.liteSnapTogglePinnedWindows();
      if (result.count === 0) {
        setStatus("当前没有打开的贴图窗口。");
      } else {
        setStatus(result.hidden ? `已隐藏 ${result.count} 个贴图。` : `已显示 ${result.count} 个贴图。`);
      }
      return;
    }

    if (action === "close-all-pinned-windows") {
      if (!launcher.liteSnapCloseAllPinnedWindows) {
        setStatus("当前版本暂不支持关闭全部贴图，请升级 LiteLauncher。");
        return;
      }
      const result = await launcher.liteSnapCloseAllPinnedWindows();
      setStatus(
        result.count === 0
          ? "当前没有打开的贴图窗口。"
          : `已关闭 ${result.count} 个贴图。`
      );
      return;
    }

    const ok = await launcher.liteSnapPinClipboard();
    setStatus(ok ? "已尝试将剪贴板图片贴到屏幕。" : "剪贴板里没有可贴图的图片，或贴图功能暂不可用。");
  }

  export function openLiteSnapSettingsView(): void {
    liteSnapPanelView = "settings";
    setStatus("已进入 LiteSnap 设置页。");
    renderList();
  }

  export function openLiteSnapHistoryView(): void {
    liteSnapPanelView = "history";
    setStatus("已进入截图历史。");
    renderList();
    void hydrateLiteSnapHistory();
  }

  export function openLiteSnapDiagnosticsView(): void {
    liteSnapPanelView = "diagnostics";
    setStatus("已进入 LiteSnap 诊断页。");
    renderList();
    void hydrateLiteSnapDiagnostics();
  }

  export function returnToLiteSnapMainView(): void {
    liteSnapPanelView = "main";
    setStatus("已返回 LiteSnap 主页面。");
    renderList();
  }

  export function toLiteSnapFileUrl(filePath: string): string {
    const trimmed = filePath.trim();
    if (!trimmed) {
      return "";
    }
    if (/^(?:file|data|https?):/i.test(trimmed)) {
      return trimmed;
    }
    const normalized = trimmed.replace(/\\/g, "/");
    if (/^[A-Za-z]:\//.test(normalized)) {
      return `file:///${normalized}`;
    }
    if (normalized.startsWith("/")) {
      return `file://${normalized}`;
    }
    return `file:///${normalized}`;
  }

  export function formatLiteSnapHistorySource(source: string): string {
    switch (source) {
      case "capture-copy":
        return "复制";
      case "capture-save":
        return "保存";
      case "capture-pin":
        return "贴图";
      case "clipboard-pin":
        return "剪贴板贴图";
      case "history-edit":
        return "二次编辑";
      default:
        return source;
    }
  }

  export function formatLiteSnapHistoryTime(createdAt: number): string {
    if (!Number.isFinite(createdAt) || createdAt <= 0) {
      return "";
    }
    const date = new Date(createdAt);
    if (Number.isNaN(date.getTime())) {
      return "";
    }
    const now = Date.now();
    const deltaMs = Math.max(0, now - createdAt);
    if (deltaMs < 60_000) {
      return "刚刚";
    }
    if (deltaMs < 3_600_000) {
      return `${Math.floor(deltaMs / 60_000)} 分钟前`;
    }
    if (deltaMs < 86_400_000) {
      return `${Math.floor(deltaMs / 3_600_000)} 小时前`;
    }
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${month}-${day} ${hours}:${minutes}`;
  }

  export async function hydrateLiteSnapHistory(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapListHistory) {
      liteSnapHistoryItems = [];
      return;
    }

    try {
      const items = await launcher.liteSnapListHistory();
      liteSnapHistoryItems = Array.isArray(items)
        ? items.map((item) => ({
            id: item.id,
            filePath: item.filePath,
            thumbPath: item.thumbPath,
            width: item.width,
            height: item.height,
            source: item.source,
            createdAt: item.createdAt
          }))
        : [];
    } catch (error) {
      console.warn("[litesnap] list history failed", error);
      liteSnapHistoryItems = [];
    }

    if (
      activePluginPanel?.pluginId === LITESNAP_PLUGIN_ID &&
      liteSnapPanelView === "history"
    ) {
      renderList();
    }
  }

  export const LITESNAP_DIAGNOSTIC_METRIC_LABELS: Record<string, string> = {
    sampleFrames: "采样帧数",
    changedFrames: "变化帧数",
    acceptedFrames: "接受帧数",
    rejectedFrames: "拒绝帧数",
    lastRejectReason: "最近拒绝原因",
    outputSegments: "输出片段数",
    directionSwitches: "方向切换次数",
    targetWindowMisses: "目标窗口连续丢失次数",
    stitchedHeight: "拼接高度",
    width: "输出宽度",
    physicalWidth: "选区物理宽度",
    physicalHeight: "选区物理高度",
    peakMemoryBytes: "峰值内存估算",
    finishSettleMs: "终帧等待耗时",
    scrollMs: "滚动转发耗时",
    captureMs: "采集耗时",
    stitchMs: "匹配耗时",
    composeMs: "合成耗时",
    exportMs: "保存耗时",
    maskReady: "遮罩已就绪",
    maskState: "遮罩状态",
    capturePath: "截图路径",
    composeReason: "合成失败原因"
  };

  export function formatLiteSnapDiagnostic(entry: (typeof liteSnapDiagnostics)[number]): string {
    const metrics = Object.entries(entry.metrics)
      .map(([key, value]) => `${LITESNAP_DIAGNOSTIC_METRIC_LABELS[key] ?? key}=${value}`)
      .join(" · ");
    return [
      `${entry.operation} / ${entry.status}`,
      `${Math.max(0, Math.round(entry.durationMs))} ms`,
      metrics,
      entry.message
    ]
      .filter(Boolean)
      .join("\n");
  }

  export async function formatLiteSnapDiagnosticsForClipboard(): Promise<string> {
    let version = "unknown";
    try {
      const status = await getLauncherApi()?.getAppUpdaterStatus?.();
      version = status?.currentVersion || version;
    } catch {
      // Diagnostics remain useful even if the updater status is unavailable.
    }
    const system = navigator.userAgent.replace(/\s+/g, " ").trim();
    return [
      "LiteSnap 诊断",
      `应用版本=${version}`,
      `系统信息=${system}`,
      ...liteSnapDiagnostics.map((entry) => `${new Date(entry.createdAt).toISOString()} ${formatLiteSnapDiagnostic(entry).replace(/\n/g, " | ")}`)
    ].join("\n");
  }

  export async function hydrateLiteSnapDiagnostics(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapGetDiagnostics) {
      liteSnapDiagnostics = [];
      return;
    }
    try {
      const entries = await launcher.liteSnapGetDiagnostics();
      liteSnapDiagnostics = Array.isArray(entries) ? entries.map((entry) => ({
        id: entry.id,
        operation: entry.operation,
        status: entry.status,
        createdAt: entry.createdAt,
        durationMs: entry.durationMs,
        metrics: { ...entry.metrics },
        message: entry.message
      })) : [];
    } catch (error) {
      console.warn("[litesnap] list diagnostics failed", error);
      liteSnapDiagnostics = [];
    }
    if (activePluginPanel?.pluginId === LITESNAP_PLUGIN_ID && liteSnapPanelView === "diagnostics") {
      renderList();
    }
  }

  export async function runLiteSnapHistoryEdit(id: string): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapHistoryEdit) {
      setStatus("当前版本暂不支持二次编辑，请升级 LiteLauncher。");
      return;
    }
    try {
      const ok = await launcher.liteSnapHistoryEdit(id);
      if (!ok) {
        setStatus("无法打开该历史截图，请重试。");
        return;
      }
      setStatus("已在编辑器中打开历史截图；导出会新建一条历史记录。");
      backToSearch();
    } catch (error) {
      console.warn("[litesnap] history edit failed", error);
      setStatus("打开历史截图失败，请重试。");
    }
  }

  export async function runLiteSnapCopyDiagnostics(): Promise<void> {
    const copied = await copyTextToClipboard(await formatLiteSnapDiagnosticsForClipboard());
    setStatus(copied ? "已复制诊断信息。" : "复制诊断信息失败，请重试。");
  }

  export async function runLiteSnapClearDiagnostics(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapClearDiagnostics) {
      setStatus("当前版本暂不支持清空诊断，请升级 LiteLauncher。");
      return;
    }
    try {
      await launcher.liteSnapClearDiagnostics();
      liteSnapDiagnostics = [];
      setStatus("已清空 LiteSnap 诊断。");
      if (liteSnapPanelView === "diagnostics") {
        renderList();
      }
    } catch (error) {
      console.warn("[litesnap] clear diagnostics failed", error);
      setStatus("清空诊断失败，请重试。");
    }
  }

  export async function runLiteSnapHistoryCopy(id: string): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapHistoryCopy) {
      setStatus("当前版本暂不支持历史复制，请升级 LiteLauncher。");
      return;
    }
    try {
      const ok = await launcher.liteSnapHistoryCopy(id);
      setStatus(ok ? "已复制历史截图到剪贴板。" : "复制失败，请重试。");
    } catch (error) {
      console.warn("[litesnap] history copy failed", error);
      setStatus("复制失败，请重试。");
    }
  }

  export async function runLiteSnapHistoryPin(id: string): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapHistoryPin) {
      setStatus("当前版本暂不支持历史贴图，请升级 LiteLauncher。");
      return;
    }
    try {
      const ok = await launcher.liteSnapHistoryPin(id);
      setStatus(ok ? "已将历史截图贴到屏幕。" : "贴图失败，请重试。");
    } catch (error) {
      console.warn("[litesnap] history pin failed", error);
      setStatus("贴图失败，请重试。");
    }
  }

  export async function runLiteSnapHistoryDelete(id: string): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapDeleteHistoryItem) {
      setStatus("当前版本暂不支持删除历史，请升级 LiteLauncher。");
      return;
    }
    try {
      const ok = await launcher.liteSnapDeleteHistoryItem(id);
      if (ok) {
        liteSnapHistoryItems = liteSnapHistoryItems.filter((item) => item.id !== id);
        setStatus("已删除该历史记录。");
        if (liteSnapPanelView === "history") {
          renderList();
        }
      } else {
        setStatus("删除失败，请重试。");
      }
    } catch (error) {
      console.warn("[litesnap] history delete failed", error);
      setStatus("删除失败，请重试。");
    }
  }

  export async function runLiteSnapClearHistory(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher?.liteSnapClearHistory) {
      setStatus("当前版本暂不支持清空历史，请升级 LiteLauncher。");
      return;
    }
    try {
      const count = await launcher.liteSnapClearHistory();
      liteSnapHistoryItems = [];
      setStatus(count === 0 ? "历史记录已为空。" : `已清空 ${count} 条历史记录。`);
      if (liteSnapPanelView === "history") {
        renderList();
      }
    } catch (error) {
      console.warn("[litesnap] clear history failed", error);
      setStatus("清空历史失败，请重试。");
    }
  }

  export function applyLiteSnapPanelPayload(panel: unknown): void {
      const panelRecord = toRecord(panel);
      const dataRecord = toRecord(panelRecord?.data ?? panel);
      liteSnapPanelData = normalizeLiteSnapPanelData(dataRecord);
      const statusMessage =
        typeof dataRecord?.statusMessage === "string"
          ? dataRecord.statusMessage
          : liteSnapPanelData.statusMessage;
      liteSnapOcrIssue = resolveLiteSnapOcrIssue(dataRecord, statusMessage);
      if (dataRecord?.preferredView === "ocr") {
        liteSnapPanelView = "ocr";
        const rawOcrText =
          typeof dataRecord?.ocrText === "string" ? dataRecord.ocrText : "";
        liteSnapOcrText = normalizeLiteSnapOcrPanelText(rawOcrText);
      } else if (dataRecord?.preferredView === "translate") {
        liteSnapPanelView = "translate";
        liteSnapTranslateSourceText =
          typeof dataRecord?.translateSourceText === "string"
            ? dataRecord.translateSourceText
            : "";
        liteSnapTranslateText =
          typeof dataRecord?.translateText === "string"
            ? dataRecord.translateText
            : "";
      } else if (dataRecord?.preferredView === "settings") {
        liteSnapPanelView = "settings";
      } else if (dataRecord?.preferredView === "history") {
        liteSnapPanelView = "history";
        void hydrateLiteSnapHistory();
      } else if (dataRecord?.preferredView === "diagnostics") {
        liteSnapPanelView = "diagnostics";
        void hydrateLiteSnapDiagnostics();
      } else {
        liteSnapPanelView = "main";
      }
    }

  export function renderLiteSnapPanel(): void {
      ensureLiteSnapOcrCacheLoaded();

      const panelItem = document.createElement("li");
      panelItem.className = "settings-panel-item";

      const panel = document.createElement("section");
      panel.className = "settings-panel litesnap-panel";

      const title = document.createElement("h3");
      title.className = "settings-title";
      title.textContent = activePluginPanel?.title || "截图贴图";

      const description = document.createElement("p");
      description.className = "settings-description";
      description.textContent =
        activePluginPanel?.subtitle ||
        "快速截图、基础标注、复制、保存与贴图。";

      const form = document.createElement("form");
      form.className = "settings-form litesnap-form";
      form.addEventListener("submit", (event) => {
        event.preventDefault();
        if (liteSnapPanelView === "settings") {
          void saveLiteSnapSettings(form);
        } else if (
          liteSnapPanelView === "ocr" ||
          liteSnapPanelView === "translate" ||
          liteSnapPanelView === "history" ||
          liteSnapPanelView === "diagnostics"
        ) {
          // OCR / translate / history views use explicit buttons; Enter should not start a capture.
        } else {
          void executeLiteSnapPanelAction("start-capture");
        }
      });

      if (liteSnapPanelView === "ocr") {
        const ocrStatusRow = createLiteSnapInfoRow(
          "文字识别",
          liteSnapPanelData.statusMessage || "已识别文字，可编辑后复制。",
          `识别使用 Windows 本地 OCR（中/英引擎自动选择）；${formatLiteSnapOcrEngineStatus()}；可在下方编辑`
        );

        const ocrField = document.createElement("div");
        ocrField.className = "settings-field litesnap-ocr-field";

        const ocrLabel = document.createElement("label");
        ocrLabel.className = "settings-field-label";
        ocrLabel.textContent = "识别结果";
        ocrLabel.htmlFor = "litesnap-ocr-text";

        const ocrTextarea = document.createElement("textarea");
        ocrTextarea.id = "litesnap-ocr-text";
        ocrTextarea.className = "litesnap-ocr-textarea";
        ocrTextarea.rows = 10;
        ocrTextarea.spellcheck = false;
        ocrTextarea.value = liteSnapOcrText;
        if (!liteSnapOcrText.trim()) {
          ocrTextarea.placeholder =
            liteSnapPanelData.statusMessage &&
            liteSnapPanelData.statusMessage !== "已识别文字，可编辑后复制。"
              ? liteSnapPanelData.statusMessage
              : "未识别到文字，请重试或检查 Windows OCR 语言包。";
        }
        ocrTextarea.addEventListener("input", () => {
          liteSnapOcrText = ocrTextarea.value;
        });

        ocrField.append(ocrLabel, ocrTextarea);

        const ocrActions = document.createElement("div");
        ocrActions.className = "litesnap-panel-footer";

        const ocrFailureIssue =
          liteSnapOcrIssue ??
          (!liteSnapOcrText.trim()
            ? inferLiteSnapOcrIssueFromMessage(liteSnapPanelData.statusMessage)
            : null);
        const ocrHelpSection = ocrFailureIssue
          ? createLiteSnapOcrHelpSection(ocrFailureIssue)
          : !liteSnapOcrText.trim()
            ? createLiteSnapOcrSetupGuideSection()
            : null;

        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "settings-btn settings-btn-primary";
        copyButton.textContent = "复制文字";
        copyButton.addEventListener("click", () => {
          const value = ocrTextarea.value;
          void navigator.clipboard
            .writeText(value)
            .then(() => setStatus("已复制识别文字到剪贴板。"))
            .catch(() => setStatus("复制失败，请手动选择文字复制。"));
        });

        const captureAgainButton = document.createElement("button");
        captureAgainButton.type = "button";
        captureAgainButton.className = "settings-btn settings-btn-secondary";
        captureAgainButton.textContent = "重新截图识别";
        captureAgainButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("start-capture");
        });

        const footerSpacer = document.createElement("div");
        footerSpacer.className = "litesnap-panel-footer-spacer";

        const backToMainButton = document.createElement("button");
        backToMainButton.type = "button";
        backToMainButton.className = "settings-btn settings-btn-secondary";
        backToMainButton.textContent = "返回主页面";
        backToMainButton.addEventListener("click", () => {
          returnToLiteSnapMainView();
        });

        const backToSearchButton = document.createElement("button");
        backToSearchButton.type = "button";
        backToSearchButton.className = "settings-btn settings-btn-secondary";
        backToSearchButton.textContent = "返回搜索";
        backToSearchButton.addEventListener("click", () => {
          backToSearch();
        });

        ocrActions.append(
          copyButton,
          captureAgainButton,
          footerSpacer,
          backToMainButton,
          backToSearchButton
        );
        if (ocrHelpSection) {
          form.append(ocrStatusRow, ocrHelpSection, ocrField, ocrActions);
        } else {
          form.append(ocrStatusRow, ocrField, ocrActions);
        }
      } else if (liteSnapPanelView === "translate") {
        const translateStatusRow = createLiteSnapInfoRow(
          "截图翻译",
          liteSnapPanelData.statusMessage || "已翻译为中文，可编辑后复制。",
          "识别使用 Windows 本地 OCR，翻译使用百度翻译 API（英译中）；凭证请在「文本翻译」插件设置。"
        );

        const sourceField = document.createElement("div");
        sourceField.className = "settings-field litesnap-ocr-field";

        const sourceLabel = document.createElement("label");
        sourceLabel.className = "settings-field-label";
        sourceLabel.textContent = "识别原文";
        sourceLabel.htmlFor = "litesnap-translate-source";

        const sourceTextarea = document.createElement("textarea");
        sourceTextarea.id = "litesnap-translate-source";
        sourceTextarea.className = "litesnap-ocr-textarea";
        sourceTextarea.rows = 6;
        sourceTextarea.spellcheck = false;
        sourceTextarea.readOnly = true;
        sourceTextarea.value = liteSnapTranslateSourceText;
        sourceField.append(sourceLabel, sourceTextarea);

        const translateField = document.createElement("div");
        translateField.className = "settings-field litesnap-ocr-field";

        const translateLabel = document.createElement("label");
        translateLabel.className = "settings-field-label";
        translateLabel.textContent = "中文译文";
        translateLabel.htmlFor = "litesnap-translate-text";

        const translateTextarea = document.createElement("textarea");
        translateTextarea.id = "litesnap-translate-text";
        translateTextarea.className = "litesnap-ocr-textarea";
        translateTextarea.rows = 8;
        translateTextarea.spellcheck = false;
        translateTextarea.placeholder =
          liteSnapTranslateText.trim().length > 0
            ? ""
            : "正在在线翻译，请稍候…";
        translateTextarea.value = liteSnapTranslateText;
        translateTextarea.addEventListener("input", () => {
          liteSnapTranslateText = translateTextarea.value;
        });
        translateField.append(translateLabel, translateTextarea);

        const translateActions = document.createElement("div");
        translateActions.className = "litesnap-panel-footer";

        const translateHelpSection =
          liteSnapOcrIssue ??
          (!liteSnapTranslateSourceText.trim()
            ? inferLiteSnapOcrIssueFromMessage(liteSnapPanelData.statusMessage)
            : null);
        const translateOcrHelpSection = translateHelpSection
          ? createLiteSnapOcrHelpSection(translateHelpSection)
          : !liteSnapTranslateSourceText.trim() &&
              inferLiteSnapOcrIssueFromMessage(liteSnapPanelData.statusMessage)
            ? createLiteSnapOcrSetupGuideSection()
            : null;

        const copyTranslationButton = document.createElement("button");
        copyTranslationButton.type = "button";
        copyTranslationButton.className = "settings-btn settings-btn-primary";
        copyTranslationButton.textContent = "复制译文";
        copyTranslationButton.addEventListener("click", () => {
          const value = translateTextarea.value;
          void navigator.clipboard
            .writeText(value)
            .then(() => setStatus("已复制译文到剪贴板。"))
            .catch(() => setStatus("复制失败，请手动选择文字复制。"));
        });

        const captureAgainButton = document.createElement("button");
        captureAgainButton.type = "button";
        captureAgainButton.className = "settings-btn settings-btn-secondary";
        captureAgainButton.textContent = "重新截图翻译";
        captureAgainButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("start-capture");
        });

        const translateFooterSpacer = document.createElement("div");
        translateFooterSpacer.className = "litesnap-panel-footer-spacer";

        const backToMainButton = document.createElement("button");
        backToMainButton.type = "button";
        backToMainButton.className = "settings-btn settings-btn-secondary";
        backToMainButton.textContent = "返回主页面";
        backToMainButton.addEventListener("click", () => {
          returnToLiteSnapMainView();
        });

        const backToSearchButton = document.createElement("button");
        backToSearchButton.type = "button";
        backToSearchButton.className = "settings-btn settings-btn-secondary";
        backToSearchButton.textContent = "返回搜索";
        backToSearchButton.addEventListener("click", () => {
          backToSearch();
        });

        translateActions.append(
          copyTranslationButton,
          captureAgainButton,
          translateFooterSpacer,
          backToMainButton,
          backToSearchButton
        );
        if (translateOcrHelpSection) {
          form.append(
            translateStatusRow,
            translateOcrHelpSection,
            sourceField,
            translateField,
            translateActions
          );
        } else {
          form.append(
            translateStatusRow,
            sourceField,
            translateField,
            translateActions
          );
        }
      } else if (liteSnapPanelView === "settings") {
        const settingsStatusRow = createLiteSnapInfoRow(
          "设置说明",
          "修改后点击保存即可生效",
          "快捷键保存后会立即重新注册；若被占用会显示失败提示"
        );
        const shortcutStatusRow = createLiteSnapInfoRow(
          "快捷键状态",
          liteSnapPanelData.statusMessage,
          "注册失败时会保留旧的可用快捷键"
        );
        const settingsRows = [
          createLiteSnapFieldRow(
            "截图快捷键",
            createLiteSnapShortcutControl(
              "litesnap-screenshot-shortcut",
              "screenshotShortcut",
              liteSnapPanelData.settings.screenshotShortcut,
              "F1"
            ),
            "例如 F1、Ctrl+Alt+S"
          ),
          createLiteSnapFieldRow(
            "贴图快捷键",
            createLiteSnapShortcutControl(
              "litesnap-pin-shortcut",
              "pinShortcut",
              liteSnapPanelData.settings.pinShortcut,
              "F3"
            ),
            "例如 F3、Ctrl+Alt+P"
          ),
          createLiteSnapFieldRow(
            "贴图点击穿透",
            createLiteSnapShortcutControl(
              "litesnap-toggle-pin-click-through",
              "togglePinClickThroughShortcut",
              liteSnapPanelData.settings.togglePinClickThroughShortcut,
              "Ctrl+Shift+T"
            ),
            "可留空关闭；例如 Ctrl+Shift+T"
          ),
          (() => {
            const row = createLiteSnapFieldRow(
              "保存目录",
              createLiteSnapDirectoryControl(
                "litesnap-save-directory",
                "saveDirectory",
                liteSnapPanelData.settings.saveDirectory,
                "留空使用图片/LiteSnap"
              ),
              "留空时保存到系统图片目录下的 LiteSnap 文件夹"
            );
            row.classList.add("litesnap-fields-grid-item--wide");
            return row;
          })(),
          createLiteSnapFieldRow(
            "保存格式",
            createLiteSnapSelect(
              "litesnap-save-format",
              "saveFormat",
              liteSnapPanelData.settings.saveFormat,
              [
                { value: "png", label: "PNG" },
                { value: "jpg", label: "JPG" }
              ]
            )
          ),
          createLiteSnapFieldRow(
            "截图后动作",
            createLiteSnapSelect(
              "litesnap-post-capture",
              "postCaptureBehavior",
              liteSnapPanelData.settings.postCaptureBehavior,
              [
                { value: "toolbar", label: "保留工具条" },
                { value: "copy", label: "截图后直接复制" },
                { value: "save", label: "截图后直接保存" },
                { value: "pin", label: "截图后直接贴图" }
              ]
            )
          ),
          createLiteSnapFieldRow(
            "标注颜色",
            createLiteSnapTextInput(
              "litesnap-annotation-color",
              "annotationColor",
              /^#[0-9a-f]{6}$/i.test(liteSnapPanelData.settings.annotationColor)
                ? liteSnapPanelData.settings.annotationColor
                : "#ff3b30",
              "#ff3b30",
              "color"
            ),
            "点击色块选择默认标注颜色"
          ),
          (() => {
            const row = createLiteSnapFieldRow(
              "各工具默认粗细",
              createLiteSnapLineWidthsControl(
                liteSnapPanelData.settings.annotationLineWidths
              ),
              "范围 1–60 px；八种工具分别保存，切换工具时自动恢复"
            );
            row.classList.add("litesnap-fields-grid-item--wide");
            return row;
          })(),
          createLiteSnapFieldRow(
            "文字大小",
            createLiteSnapNumberInput(
              "litesnap-annotation-text-size",
              "annotationTextSize",
              liteSnapPanelData.settings.annotationTextSize,
              8,
              72
            )
          ),
          createLiteSnapFieldRow(
            "形状填充",
            createLiteSnapCheckbox(
              "litesnap-annotation-fill",
              "annotationFillShapes",
              liteSnapPanelData.settings.annotationFillShapes
            ),
            "开启后矩形/椭圆默认填充颜色"
          ),
          createLiteSnapFieldRow(
            "启用截图历史",
            createLiteSnapCheckbox(
              "litesnap-history-enabled",
              "historyEnabled",
              liteSnapPanelData.settings.historyEnabled
            ),
            "关闭后不再写入截图历史"
          ),
          createLiteSnapFieldRow(
            "历史条数上限",
            createLiteSnapNumberInput(
              "litesnap-history-max-items",
              "historyMaxItems",
              liteSnapPanelData.settings.historyMaxItems,
              5,
              50
            ),
            "范围 5–50，超出部分会自动清理"
          )
        ];

        const ocrConfigurationNodes = buildLiteSnapOcrConfigurationSection({
          resultTextareaId: "litesnap-settings-ocr-probe-result",
          includeFailureHelp: true
        });

        const settingsActions = document.createElement("div");
        settingsActions.className = "litesnap-panel-footer";

        const saveButton = document.createElement("button");
        saveButton.type = "submit";
        saveButton.className = "settings-btn settings-btn-primary";
        saveButton.textContent = "保存设置";

        const resetShortcutsButton = document.createElement("button");
        resetShortcutsButton.type = "button";
        resetShortcutsButton.className = "settings-btn settings-btn-secondary";
        resetShortcutsButton.textContent = "恢复默认快捷键";
        resetShortcutsButton.addEventListener("click", () => {
          const screenshotInput = form.elements.namedItem("screenshotShortcut");
          const pinInput = form.elements.namedItem("pinShortcut");
          const togglePinClickThroughInput = form.elements.namedItem(
            "togglePinClickThroughShortcut"
          );
          if (screenshotInput instanceof HTMLInputElement) {
            screenshotInput.value = "F1";
          }
          if (pinInput instanceof HTMLInputElement) {
            pinInput.value = "F3";
          }
          if (togglePinClickThroughInput instanceof HTMLInputElement) {
            togglePinClickThroughInput.value = "Ctrl+Shift+T";
          }
          setStatus("已填入默认快捷键，点击保存后生效。");
        });

        const settingsFooterSpacer = document.createElement("div");
        settingsFooterSpacer.className = "litesnap-panel-footer-spacer";

        const backToMainButton = document.createElement("button");
        backToMainButton.type = "button";
        backToMainButton.className = "settings-btn settings-btn-secondary";
        backToMainButton.textContent = "返回主页面";
        backToMainButton.addEventListener("click", () => {
          returnToLiteSnapMainView();
        });

        const backToSearchButton = document.createElement("button");
        backToSearchButton.type = "button";
        backToSearchButton.className = "settings-btn settings-btn-secondary";
        backToSearchButton.textContent = "返回搜索";
        backToSearchButton.addEventListener("click", () => {
          backToSearch();
        });

        settingsActions.append(
          saveButton,
          resetShortcutsButton,
          settingsFooterSpacer,
          backToMainButton,
          backToSearchButton
        );
        form.append(
          settingsStatusRow,
          shortcutStatusRow,
          createLiteSnapFormSection(ocrConfigurationNodes),
          createLiteSnapFieldsGrid(settingsRows),
          settingsActions
        );
      } else if (liteSnapPanelView === "diagnostics") {
        const diagnosticsStatus = createLiteSnapInfoRow(
          "LiteSnap 诊断",
          `最近 ${liteSnapDiagnostics.length} 条操作记录（最多保留 20 条）`,
          "仅保存耗时、尺寸、帧数和技术状态；不保存截图、文件路径、OCR 文本或剪贴板内容。"
        );

        const diagnosticsList = document.createElement("div");
        diagnosticsList.className = "litesnap-history-list";
        if (liteSnapDiagnostics.length === 0) {
          const empty = document.createElement("div");
          empty.className = "litesnap-history-empty";
          empty.textContent = "暂无诊断记录。完成一次截图、OCR 或二次编辑后会显示在这里。";
          diagnosticsList.appendChild(empty);
        } else {
          for (const entry of liteSnapDiagnostics) {
            const row = document.createElement("article");
            row.className = "litesnap-history-row";
            const body = document.createElement("div");
            body.className = "litesnap-history-row-body";
            const titleRow = document.createElement("div");
            titleRow.className = "litesnap-history-row-top";
            const operation = document.createElement("span");
            operation.className = "litesnap-history-source";
            operation.textContent = `${entry.operation} · ${entry.status}`;
            const duration = document.createElement("span");
            duration.className = "litesnap-history-size";
            duration.textContent = `${Math.max(0, Math.round(entry.durationMs))} ms`;
            titleRow.append(operation, duration);
            const timestamp = document.createElement("div");
            timestamp.className = "litesnap-history-time";
            timestamp.textContent = formatLiteSnapHistoryTime(entry.createdAt);
            const detail = document.createElement("pre");
            detail.className = "litesnap-history-time";
            detail.style.whiteSpace = "pre-wrap";
            detail.style.margin = "6px 0 0";
            detail.textContent = formatLiteSnapDiagnostic(entry);
            body.append(titleRow, timestamp, detail);
            row.appendChild(body);
            diagnosticsList.appendChild(row);
          }
        }

        const footer = document.createElement("div");
        footer.className = "litesnap-panel-footer";
        const copyButton = document.createElement("button");
        copyButton.type = "button";
        copyButton.className = "settings-btn settings-btn-secondary";
        copyButton.textContent = "复制诊断";
        copyButton.addEventListener("click", () => {
          void runLiteSnapCopyDiagnostics();
        });
        const clearButton = document.createElement("button");
        clearButton.type = "button";
        clearButton.className = "settings-btn settings-btn-secondary";
        clearButton.textContent = "清空诊断";
        clearButton.disabled = liteSnapDiagnostics.length === 0;
        clearButton.addEventListener("click", () => {
          void runLiteSnapClearDiagnostics();
        });
        const spacer = document.createElement("div");
        spacer.className = "litesnap-panel-footer-spacer";
        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "settings-btn settings-btn-secondary";
        backButton.textContent = "返回主页面";
        backButton.addEventListener("click", () => {
          returnToLiteSnapMainView();
        });
        const searchButton = document.createElement("button");
        searchButton.type = "button";
        searchButton.className = "settings-btn settings-btn-secondary";
        searchButton.textContent = "返回搜索";
        searchButton.addEventListener("click", () => {
          backToSearch();
        });
        footer.append(copyButton, clearButton, spacer, backButton, searchButton);
        form.append(diagnosticsStatus, diagnosticsList, footer);
      } else if (liteSnapPanelView === "history") {
        const historyHead = document.createElement("div");
        historyHead.className = "litesnap-history-head";

        const historyTitleGroup = document.createElement("div");
        historyTitleGroup.className = "litesnap-history-title-group";
        const historyTitle = document.createElement("div");
        historyTitle.className = "litesnap-history-title";
        historyTitle.textContent = "截图历史";
        const historyMeta = document.createElement("div");
        historyMeta.className = "litesnap-history-meta";
        historyMeta.textContent = liteSnapPanelData.settings.historyEnabled
          ? `最近 ${liteSnapHistoryItems.length} 条 · 最多保留 ${liteSnapPanelData.settings.historyMaxItems} 条`
          : "历史写入已关闭，仅可管理现有条目";
        historyTitleGroup.append(historyTitle, historyMeta);
        historyHead.appendChild(historyTitleGroup);

        const historyList = document.createElement("div");
        historyList.className = "litesnap-history-list";

        if (liteSnapHistoryItems.length === 0) {
          const empty = document.createElement("div");
          empty.className = "litesnap-history-empty";
          empty.textContent = "暂无截图历史。完成截图后会显示在这里。";
          historyList.appendChild(empty);
        } else {
          for (const item of liteSnapHistoryItems) {
            const row = document.createElement("article");
            row.className = "litesnap-history-row";

            const thumbWrap = document.createElement("div");
            thumbWrap.className = "litesnap-history-thumb-wrap";
            const thumbSrc = toLiteSnapFileUrl(item.thumbPath || item.filePath);
            if (thumbSrc) {
              const thumb = document.createElement("img");
              thumb.className = "litesnap-history-thumb";
              thumb.src = thumbSrc;
              thumb.alt = formatLiteSnapHistorySource(item.source);
              thumb.loading = "lazy";
              thumbWrap.appendChild(thumb);
            }

            const body = document.createElement("div");
            body.className = "litesnap-history-row-body";

            const bodyTop = document.createElement("div");
            bodyTop.className = "litesnap-history-row-top";
            const sourceBadge = document.createElement("span");
            sourceBadge.className = "litesnap-history-source";
            sourceBadge.textContent = formatLiteSnapHistorySource(item.source);
            const sizeText = document.createElement("span");
            sizeText.className = "litesnap-history-size";
            sizeText.textContent = `${item.width}×${item.height}`;
            bodyTop.append(sourceBadge, sizeText);

            const timeText = document.createElement("div");
            timeText.className = "litesnap-history-time";
            timeText.textContent = formatLiteSnapHistoryTime(item.createdAt);

            const itemActions = document.createElement("div");
            itemActions.className = "litesnap-history-row-actions";

            const copyButton = document.createElement("button");
            copyButton.type = "button";
            copyButton.className = "litesnap-history-action";
            copyButton.textContent = "复制";
            copyButton.addEventListener("click", () => {
              void runLiteSnapHistoryCopy(item.id);
            });

            const editButton = document.createElement("button");
            editButton.type = "button";
            editButton.className = "litesnap-history-action";
            editButton.textContent = "编辑";
            editButton.addEventListener("click", () => {
              void runLiteSnapHistoryEdit(item.id);
            });

            const pinButton = document.createElement("button");
            pinButton.type = "button";
            pinButton.className = "litesnap-history-action is-primary";
            pinButton.textContent = "贴图";
            pinButton.addEventListener("click", () => {
              void runLiteSnapHistoryPin(item.id);
            });

            const deleteButton = document.createElement("button");
            deleteButton.type = "button";
            deleteButton.className = "litesnap-history-action is-danger";
            deleteButton.textContent = "删除";
            deleteButton.addEventListener("click", () => {
              void runLiteSnapHistoryDelete(item.id);
            });

            itemActions.append(copyButton, editButton, pinButton, deleteButton);
            body.append(bodyTop, timeText, itemActions);
            row.append(thumbWrap, body);
            historyList.appendChild(row);
          }
        }

        const historyFooter = document.createElement("div");
        historyFooter.className = "litesnap-panel-footer";

        const clearHistoryButton = document.createElement("button");
        clearHistoryButton.type = "button";
        clearHistoryButton.className = "settings-btn settings-btn-secondary";
        clearHistoryButton.textContent = "清空历史";
        clearHistoryButton.disabled = liteSnapHistoryItems.length === 0;
        clearHistoryButton.addEventListener("click", () => {
          void runLiteSnapClearHistory();
        });

        const footerSpacer = document.createElement("div");
        footerSpacer.className = "litesnap-panel-footer-spacer";

        const backToMainButton = document.createElement("button");
        backToMainButton.type = "button";
        backToMainButton.className = "settings-btn settings-btn-secondary";
        backToMainButton.textContent = "返回主页面";
        backToMainButton.addEventListener("click", () => {
          returnToLiteSnapMainView();
        });

        const backToSearchButton = document.createElement("button");
        backToSearchButton.type = "button";
        backToSearchButton.className = "settings-btn settings-btn-secondary";
        backToSearchButton.textContent = "返回搜索";
        backToSearchButton.addEventListener("click", () => {
          backToSearch();
        });

        historyFooter.append(
          clearHistoryButton,
          footerSpacer,
          backToMainButton,
          backToSearchButton
        );
        form.append(historyHead, historyList, historyFooter);
      } else {
        const statusRow = createLiteSnapInfoRow(
          "使用提示",
          "按 F1 进入截图时，主窗口会保持可见，便于截取启动器界面。",
          "也可在设置中调整快捷键、保存目录与截图后动作"
        );
        const saveDirectory = liteSnapPanelData.settings.saveDirectory.trim();
        const settingsRows = [
          createLiteSnapInfoRow(
            "截图快捷键",
            liteSnapPanelData.settings.screenshotShortcut,
            "默认 F1"
          ),
          createLiteSnapInfoRow(
            "贴图快捷键",
            liteSnapPanelData.settings.pinShortcut,
            "默认 F3"
          ),
          createLiteSnapInfoRow(
            "保存格式",
            liteSnapPanelData.settings.saveFormat.toUpperCase(),
            saveDirectory ? `保存目录：${saveDirectory}` : "默认保存到图片/LiteSnap"
          ),
          createLiteSnapInfoRow(
            "截图后动作",
            formatLiteSnapPostCaptureBehavior(
              liteSnapPanelData.settings.postCaptureBehavior
            )
          ),
          createLiteSnapInfoRow(
            "标注预设",
            `${liteSnapPanelData.settings.annotationColor} / 文字 ${liteSnapPanelData.settings.annotationTextSize}px / 八种工具粗细已分别保存`,
            "颜色、各工具粗细、字号和填充会自动记住；框选后恢复上次标注工具"
          )
        ];

        const mainOcrNodes = buildLiteSnapOcrConfigurationSection({
          resultTextareaId: "litesnap-main-ocr-probe-result",
          includeFailureHelp: true
        });

        const primaryActions = document.createElement("div");
        primaryActions.className = "litesnap-action-row litesnap-action-row--primary";

        const captureButton = document.createElement("button");
        captureButton.type = "submit";
        captureButton.className = "settings-btn settings-btn-primary";
        captureButton.textContent = `开始截图 (${liteSnapPanelData.settings.screenshotShortcut})`;

        const pinButton = document.createElement("button");
        pinButton.type = "button";
        pinButton.className = "settings-btn settings-btn-secondary";
        pinButton.textContent = `贴图 (${liteSnapPanelData.settings.pinShortcut})`;
        pinButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("pin-from-clipboard");
        });

        const colorButton = document.createElement("button");
        colorButton.type = "button";
        colorButton.className = "settings-btn settings-btn-secondary";
        colorButton.textContent = "取色";
        colorButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("start-color-capture");
        });

        primaryActions.append(captureButton, pinButton, colorButton);

        const secondaryActions = document.createElement("div");
        secondaryActions.className =
          "litesnap-action-row litesnap-action-row--secondary";

        const historyButton = document.createElement("button");
        historyButton.type = "button";
        historyButton.className = "settings-btn settings-btn-secondary";
        historyButton.textContent = "截图历史";
        historyButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("open-history");
        });

        const diagnosticsButton = document.createElement("button");
        diagnosticsButton.type = "button";
        diagnosticsButton.className = "settings-btn settings-btn-secondary";
        diagnosticsButton.textContent = "性能诊断";
        diagnosticsButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("open-diagnostics");
        });

        const togglePinsButton = document.createElement("button");
        togglePinsButton.type = "button";
        togglePinsButton.className = "settings-btn settings-btn-secondary";
        togglePinsButton.textContent = "隐藏/显示贴图";
        togglePinsButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("toggle-pinned-windows");
        });

        const closeAllPinsButton = document.createElement("button");
        closeAllPinsButton.type = "button";
        closeAllPinsButton.className = "settings-btn settings-btn-secondary";
        closeAllPinsButton.textContent = "关闭全部贴图";
        closeAllPinsButton.addEventListener("click", () => {
          void executeLiteSnapPanelAction("close-all-pinned-windows");
        });

        secondaryActions.append(
          historyButton,
          diagnosticsButton,
          togglePinsButton,
          closeAllPinsButton
        );

        const footer = document.createElement("div");
        footer.className = "litesnap-panel-footer";

        const settingsButton = document.createElement("button");
        settingsButton.type = "button";
        settingsButton.className = "settings-btn settings-btn-secondary";
        settingsButton.textContent = "打开设置";
        settingsButton.addEventListener("click", () => {
          openLiteSnapSettingsView();
        });

        const footerSpacer = document.createElement("div");
        footerSpacer.className = "litesnap-panel-footer-spacer";

        const backButton = document.createElement("button");
        backButton.type = "button";
        backButton.className = "settings-btn settings-btn-secondary";
        backButton.textContent = "返回搜索";
        backButton.addEventListener("click", () => {
          backToSearch();
        });

        footer.append(settingsButton, footerSpacer, backButton);
        form.append(
          statusRow,
          createLiteSnapFormSection(mainOcrNodes),
          createLiteSnapFieldsGrid(settingsRows),
          primaryActions,
          secondaryActions,
          footer
        );
      }

      panel.append(title, description, form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
    }

}
