function createHardwareInspectorMetricGrid(
  items: Array<{ label: string; value: string; changed?: boolean }>
): HTMLDivElement {
  const grid = document.createElement("div");
  grid.className = "hardware-inspector-metric-grid";

  items.forEach((item) => {
    const row = document.createElement("div");
    row.className = "hardware-inspector-metric";
    if (item.changed) {
      row.dataset.changed = "true";
    }
    const label = document.createElement("div");
    label.className = "hardware-inspector-metric-label";
    label.textContent = item.label;
    const value = document.createElement("div");
    value.className = "hardware-inspector-metric-value";
    value.textContent = item.value;
    row.append(label, value);
    grid.appendChild(row);
  });

  return grid;
}

const WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT = 8;
const webtoolsImagePromptExpandedGroups = new Set<WebtoolsImagePromptOptionGroupKey>();
let webtoolsImagePromptStyleGroup: WebtoolsImagePromptStylePresetGroup | "" = "";
let webtoolsImagePromptSmartTemplateId: WebtoolsImagePromptSmartTemplateId | "" = "";

function syncWebtoolsImagePromptSmartTemplateSelection(container: HTMLElement): void {
  container
    .querySelectorAll<HTMLButtonElement>("[data-webtools-image-prompt-smart-template]")
    .forEach((button) => {
      button.dataset.selected = String(button.value === webtoolsImagePromptSmartTemplateId);
    });
}

function createHardwareInspectorSection(
  titleText: string,
  descriptionText?: string
): { section: HTMLDivElement; body: HTMLDivElement } {
  const section = document.createElement("div");
  section.className = "hardware-inspector-section";

  const head = document.createElement("div");
  head.className = "hardware-inspector-section-head";
  const title = document.createElement("h4");
  title.className = "hardware-inspector-section-title";
  title.textContent = titleText;
  head.appendChild(title);

  if (descriptionText) {
    const description = document.createElement("div");
    description.className = "hardware-inspector-section-description";
    description.textContent = descriptionText;
    head.appendChild(description);
  }

  const body = document.createElement("div");
  body.className = "hardware-inspector-section-body";
  section.append(head, body);
  return { section, body };
}

function createHardwareInspectorCard(titleText: string): HTMLDivElement {
  const card = document.createElement("div");
  card.className = "hardware-inspector-card";
  const header = document.createElement("div");
  header.className = "hardware-inspector-card-header";
  const title = document.createElement("div");
  title.className = "hardware-inspector-card-title";
  title.textContent = titleText;
  header.appendChild(title);
  card.appendChild(header);
  return card;
}

function createHardwareInspectorBadge(
  text: string,
  tone: "neutral" | "success" | "warning" | "danger" = "neutral"
): HTMLSpanElement {
  const badge = document.createElement("span");
  badge.className = "hardware-inspector-badge";
  badge.dataset.tone = tone;
  badge.textContent = text;
  return badge;
}

function getHardwareInspectorTemperatureSourceTone(
  source: string | null | undefined
): "neutral" | "success" | "warning" {
  const normalized = source?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return "neutral";
  }
  if (normalized.includes("acpi") || normalized.includes("best effort")) {
    return "warning";
  }
  return "success";
}

function formatHardwareInspectorTemperatureSourceBadge(
  source: string | null | undefined
): string {
  const normalized = source?.trim().toLowerCase() ?? "";
  if (!normalized) {
    return "温度来源不可用";
  }
  if (normalized.includes("acpi")) {
    return "来源: ACPI 热区";
  }
  if (normalized.includes("librehardwaremonitor")) {
    return "来源: LibreHardwareMonitor";
  }
  if (normalized.includes("openhardwaremonitor")) {
    return "来源: OpenHardwareMonitor";
  }
  return "来源: 监控传感器";
}

function createHardwareInspectorTemperatureBadgeRow(
  temperatureCelsius: number | null | undefined,
  temperatureSource: string | null | undefined
): HTMLDivElement {
  const row = document.createElement("div");
  row.className = "hardware-inspector-badge-row";

  const hasTemperature =
    typeof temperatureCelsius === "number" &&
    Number.isFinite(temperatureCelsius) &&
    temperatureCelsius > 0;
  const sourceTone = getHardwareInspectorTemperatureSourceTone(temperatureSource);

  row.appendChild(
    createHardwareInspectorBadge(
      hasTemperature ? "温度已采集" : "温度不可用",
      hasTemperature ? sourceTone : "neutral"
    )
  );

  if (temperatureSource?.trim()) {
    row.appendChild(
      createHardwareInspectorBadge(
        formatHardwareInspectorTemperatureSourceBadge(temperatureSource),
        sourceTone
      )
    );
  }

  return row;
}

function countHardwareInspectorDiskVolumes(disk: HardwareInspectorDisk): number {
  return disk.partitions.reduce((count, partition) => count + partition.volumes.length, 0);
}

function formatHardwareInspectorDriveType(value: number | null | undefined): string {
  switch (value) {
    case 0:
      return "未知";
    case 1:
      return "不可用";
    case 2:
      return "可移动";
    case 3:
      return "本地磁盘";
    case 4:
      return "网络驱动器";
    case 5:
      return "光驱";
    case 6:
      return "RAM 磁盘";
    default:
      return typeof value === "number" && Number.isFinite(value) ? `类型 ${value}` : "不可用";
  }
}

function addHardwareInspectorCardAction(
  card: HTMLDivElement,
  label: string,
  onClick: () => void
): void {
  const header = card.querySelector(".hardware-inspector-card-header");
  if (!(header instanceof HTMLDivElement)) {
    return;
  }

  let actions = header.querySelector(".hardware-inspector-card-actions");
  if (!(actions instanceof HTMLDivElement)) {
    actions = document.createElement("div");
    actions.className = "hardware-inspector-card-actions";
    header.appendChild(actions);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-btn settings-btn-secondary hardware-inspector-inline-btn";
  button.textContent = label;
  button.addEventListener("click", onClick);
  actions.appendChild(button);
}

function addHardwareInspectorInlineAction(
  header: HTMLDivElement,
  actionsClassName: string,
  label: string,
  onClick: () => void
): void {
  let actions = header.querySelector(`.${actionsClassName}`);
  if (!(actions instanceof HTMLDivElement)) {
    actions = document.createElement("div");
    actions.className = actionsClassName;
    header.appendChild(actions);
  }

  const button = document.createElement("button");
  button.type = "button";
  button.className = "settings-btn settings-btn-secondary hardware-inspector-inline-btn";
  button.textContent = label;
  button.addEventListener("click", onClick);
  actions.appendChild(button);
}

async function copyHardwareInspectorDetail(
  title: string,
  lines: string[],
  successText: string
): Promise<void> {
  const content = [title, ...lines].join("\n").trim();
  const ok = await copyTextToClipboard(content);
  setStatus(ok ? successText : "复制失败");
}

function createHardwareInspectorMetricItems(
  items: Array<{ label: string; value: string }>,
  changedLabels: readonly string[] = []
): Array<{ label: string; value: string; changed?: boolean }> {
  const changedSet = new Set(changedLabels);
  return items.map((item) => ({
    ...item,
    changed: changedSet.has(item.label)
  }));
}

function applyHardwareInspectorCardChangeState(
  card: HTMLDivElement,
  labels: readonly string[]
): void {
  if (labels.length === 0) {
    return;
  }

  card.dataset.changed = "true";
  const summary = document.createElement("div");
  summary.className = "hardware-inspector-card-change";
  summary.textContent = `变化：${labels.join("、")}`;
  card.appendChild(summary);
}

window.__LL_PANEL_IMPLS__ = {
  applyHardwareInspectorPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    hardwareInspectorSnapshot = getHardwareInspectorSnapshotFromData(data);
    hardwareInspectorLoading = data?.loading === true;
    hardwareInspectorInfo = typeof data?.info === "string" ? data.info : "";
    hardwareInspectorError = typeof data?.error === "string" ? data.error : "";
  },

  renderHardwareInspectorPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel hardware-inspector-panel";

    const form = document.createElement("form");
    form.className = "settings-form hardware-inspector-form hardware-inspector-shell";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeHardwareInspectorRefresh();
    });

    const header = document.createElement("div");
    header.className = "hardware-inspector-header";
    const titleWrap = document.createElement("div");
    titleWrap.className = "hardware-inspector-title-wrap";
    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "硬件检测";
    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "查看主板、CPU、内存、显卡、硬盘等详细信息";
    titleWrap.append(title, description);

    const actions = document.createElement("div");
    actions.className = "hardware-inspector-actions";

    const refreshButton = document.createElement("button");
    refreshButton.type = "button";
    refreshButton.className = "settings-btn settings-btn-primary";
    refreshButton.textContent = hardwareInspectorLoading ? "刷新中..." : "刷新";
    refreshButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    refreshButton.addEventListener("click", () => {
      void executeHardwareInspectorRefresh();
    });

    const exportMarkdownButton = document.createElement("button");
    exportMarkdownButton.type = "button";
    exportMarkdownButton.className = "settings-btn settings-btn-secondary";
    exportMarkdownButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出 MD";
    exportMarkdownButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportMarkdownButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("markdown");
    });

    const exportHtmlButton = document.createElement("button");
    exportHtmlButton.type = "button";
    exportHtmlButton.className = "settings-btn settings-btn-secondary";
    exportHtmlButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出 HTML";
    exportHtmlButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportHtmlButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("html");
    });

    const copySummaryButton = document.createElement("button");
    copySummaryButton.type = "button";
    copySummaryButton.className = "settings-btn settings-btn-secondary";
    copySummaryButton.textContent = "复制摘要";
    copySummaryButton.disabled = !hardwareInspectorSnapshot;
    copySummaryButton.addEventListener("click", () => {
      if (!hardwareInspectorSnapshot) {
        setStatus("暂无可复制的硬件摘要");
        return;
      }
      void (async () => {
        const ok = await copyTextToClipboard(
          buildHardwareInspectorSummaryText(hardwareInspectorSnapshot)
        );
        setStatus(ok ? "已复制硬件摘要" : "复制失败");
      })();
    });

    const copyJsonButton = document.createElement("button");
    copyJsonButton.type = "button";
    copyJsonButton.className = "settings-btn settings-btn-secondary";
    copyJsonButton.textContent = "复制 JSON";
    copyJsonButton.disabled = !hardwareInspectorSnapshot;
    copyJsonButton.addEventListener("click", () => {
      if (!hardwareInspectorSnapshot) {
        setStatus("暂无可复制的硬件数据");
        return;
      }
      void (async () => {
        const ok = await copyTextToClipboard(
          JSON.stringify(hardwareInspectorSnapshot, null, 2)
        );
        setStatus(ok ? "已复制硬件 JSON" : "复制失败");
      })();
    });

    actions.append(
      refreshButton,
      exportMarkdownButton,
      exportHtmlButton,
      copySummaryButton,
      copyJsonButton
    );
    header.append(titleWrap, actions);
    form.appendChild(header);

    const status = document.createElement("div");
    status.className = "hardware-inspector-status";
    status.dataset.state = hardwareInspectorError
      ? "error"
      : hardwareInspectorLoading
        ? "loading"
        : hardwareInspectorExporting
          ? "loading"
        : hardwareInspectorSnapshot
          ? "ok"
          : "idle";
    status.textContent = hardwareInspectorError
      ? hardwareInspectorError
      : hardwareInspectorLoading
        ? "正在采集硬件信息..."
        : hardwareInspectorExporting
          ? "正在导出硬件报告..."
        : hardwareInspectorInfo || "打开面板后会自动采集一次硬件信息";
    form.appendChild(status);

    if (hardwareInspectorSnapshot) {
      const snapshot = hardwareInspectorSnapshot;
      const diffState = hardwareInspectorDiffState;
      const overviewChangedSet = new Set(diffState?.overviewChangedKeys ?? []);
      const cpuChanges = diffState?.cpuChanges ?? {};
      const memoryChanges = diffState?.memoryChanges ?? {};
      const gpuChanges = diffState?.gpuChanges ?? {};
      const diskChanges = diffState?.diskChanges ?? {};
      const overview = document.createElement("div");
      overview.className = "hardware-inspector-overview";
      const systemName =
        [snapshot.computerSystem.manufacturer, snapshot.computerSystem.model]
          .filter(Boolean)
          .join(" ") || "未知设备";
      const osName =
        [snapshot.operatingSystem.caption, snapshot.operatingSystem.buildNumber]
          .filter(Boolean)
          .join(" / ") || "未知系统";
      const cpuName = snapshot.cpus[0]?.name ?? "未知 CPU";
      const totalMemory = formatHardwareInspectorBytes(
        snapshot.computerSystem.totalPhysicalMemory
      );
      const riskDiskCount = countHardwareInspectorRiskDisks(snapshot);
      const overviewItems: Array<{
        key: string;
        label: string;
        value: string;
        tone?: "success" | "warning" | "danger";
      }> = [
        { key: "device", label: "设备", value: systemName },
        { key: "system", label: "系统", value: osName },
        { key: "cpu", label: "CPU", value: cpuName },
        { key: "totalMemory", label: "总内存", value: totalMemory },
        { key: "gpuCount", label: "显卡", value: `${snapshot.gpus.length} 张` },
        { key: "diskCount", label: "磁盘", value: `${snapshot.disks.length} 块` },
        {
          key: "riskDiskCount",
          label: "风险磁盘",
          value: riskDiskCount > 0 ? `${riskDiskCount} 块` : "无",
          tone: riskDiskCount > 0 ? "danger" : "success"
        }
      ];
      overviewItems.forEach((item) => {
        const card = document.createElement("div");
        card.className = "hardware-inspector-overview-card";
        if (overviewChangedSet.has(item.key)) {
          card.dataset.changed = "true";
        }
        if (item.tone) {
          card.dataset.tone = item.tone;
        }
        const label = document.createElement("div");
        label.className = "hardware-inspector-overview-label";
        label.textContent = item.label;
        const value = document.createElement("div");
        value.className = "hardware-inspector-overview-value";
        value.textContent = item.value;
        card.append(label, value);
        overview.appendChild(card);
      });
      form.appendChild(overview);

      const compare = document.createElement("div");
      compare.className = "hardware-inspector-compare";
      compare.dataset.state = !diffState?.hasBaseline
        ? "first"
        : diffState.hasChanges
          ? "changed"
          : "stable";
      const compareTitle = document.createElement("div");
      compareTitle.className = "hardware-inspector-compare-title";
      compareTitle.textContent = !diffState?.hasBaseline
        ? "变化对比：首次采集"
        : diffState.hasChanges
          ? "变化对比：检测到变化"
          : "变化对比：与上次一致";
      compare.appendChild(compareTitle);
      const compareMeta = document.createElement("div");
      compareMeta.className = "hardware-inspector-compare-meta";
      compareMeta.textContent = diffState?.hasBaseline
        ? `上次：${formatHardwareInspectorDate(diffState.previousCollectedAt)} / 本次：${formatHardwareInspectorDate(diffState.currentCollectedAt)}`
        : `本次：${formatHardwareInspectorDate(snapshot.collectedAt)}`;
      compare.appendChild(compareMeta);
      const compareList = document.createElement("div");
      compareList.className = "hardware-inspector-compare-list";
      (diffState?.summary ?? ["首次采集，下一次刷新将显示变化对比"]).forEach((itemText) => {
        const item = document.createElement("div");
        item.className = "hardware-inspector-compare-item";
        item.textContent = itemText;
        compareList.appendChild(item);
      });
      compare.appendChild(compareList);
      form.appendChild(compare);

      const meta = document.createElement("div");
      meta.className = "hardware-inspector-meta";
      [
        `采集时间 ${formatHardwareInspectorDate(snapshot.collectedAt)}`,
        `启动时间 ${formatHardwareInspectorDate(snapshot.operatingSystem.lastBootUpTime)}`,
        `CPU ${snapshot.cpus.length} 颗`,
        `内存 ${snapshot.memoryModules.length} 条`,
        `显卡 ${snapshot.gpus.length} 张`,
        `磁盘 ${snapshot.disks.length} 块`
      ].forEach((text) => {
        const item = document.createElement("span");
        item.className = "hardware-inspector-meta-item";
        item.textContent = text;
        meta.appendChild(item);
      });
      form.appendChild(meta);

      const cpuSection = createHardwareInspectorSection("CPU", `共 ${snapshot.cpus.length} 颗`);
      snapshot.cpus.forEach((cpu, index) => {
        const card = createHardwareInspectorCard(`处理器 ${index + 1}`);
        const changeLabels = cpuChanges[getHardwareInspectorCpuKey(cpu, index)] ?? [];
        applyHardwareInspectorCardChangeState(card, changeLabels);
        card.appendChild(
          createHardwareInspectorTemperatureBadgeRow(
            cpu.temperatureCelsius,
            cpu.temperatureSource
          )
        );
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "型号", value: formatHardwareInspectorText(cpu.name) },
            { label: "厂商", value: formatHardwareInspectorText(cpu.manufacturer) },
            { label: "插槽", value: formatHardwareInspectorText(cpu.socketDesignation) },
            {
              label: "核心 / 线程",
              value: `${cpu.numberOfCores ?? "?"} / ${cpu.numberOfLogicalProcessors ?? "?"}`
            },
            { label: "最大频率", value: formatHardwareInspectorClockMhz(cpu.maxClockSpeed) },
            { label: "当前频率", value: formatHardwareInspectorClockMhz(cpu.currentClockSpeed) },
            { label: "温度(可选)", value: formatHardwareInspectorTemperature(cpu.temperatureCelsius) },
            { label: "温度来源", value: cpu.temperatureSource || "不可用" },
            { label: "架构", value: formatHardwareInspectorText(cpu.architecture) },
            { label: "位宽", value: cpu.addressWidth ? `${cpu.addressWidth} bit` : "未知" },
            {
              label: "虚拟化",
              value: formatHardwareInspectorBoolean(cpu.virtualizationFirmwareEnabled)
            },
            {
              label: "SLAT",
              value: formatHardwareInspectorBoolean(
                cpu.secondLevelAddressTranslationExtensions
              )
            }
          ], changeLabels))
        );
        cpuSection.body.appendChild(card);
      });
      form.appendChild(cpuSection.section);

      const boardSection = createHardwareInspectorSection("主板 / BIOS");
      const boardCard = createHardwareInspectorCard("主板");
      applyHardwareInspectorCardChangeState(boardCard, diffState?.baseBoardChanges ?? []);
      boardCard.appendChild(
        createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
          { label: "厂商", value: formatHardwareInspectorText(snapshot.baseBoard.manufacturer) },
          { label: "型号", value: formatHardwareInspectorText(snapshot.baseBoard.product) },
          { label: "版本", value: formatHardwareInspectorText(snapshot.baseBoard.version) },
          { label: "序列号", value: formatHardwareInspectorText(snapshot.baseBoard.serialNumber) }
        ], diffState?.baseBoardChanges ?? []))
      );
      const biosCard = createHardwareInspectorCard("BIOS");
      applyHardwareInspectorCardChangeState(biosCard, diffState?.biosChanges ?? []);
      biosCard.appendChild(
        createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
          { label: "厂商", value: formatHardwareInspectorText(snapshot.bios.manufacturer) },
          {
            label: "版本",
            value: formatHardwareInspectorText(snapshot.bios.smbiosBiosVersion || snapshot.bios.version)
          },
          { label: "发布日期", value: formatHardwareInspectorDate(snapshot.bios.releaseDate) },
          { label: "序列号", value: formatHardwareInspectorText(snapshot.bios.serialNumber) }
        ], diffState?.biosChanges ?? []))
      );
      boardSection.body.append(boardCard, biosCard);
      form.appendChild(boardSection.section);

      const memorySection = createHardwareInspectorSection(
        "内存",
        `共 ${snapshot.memoryModules.length} 条`
      );
      snapshot.memoryModules.forEach((memory, index) => {
        const slotName = memory.deviceLocator || memory.bankLabel || `内存 ${index + 1}`;
        const card = createHardwareInspectorCard(slotName);
        const changeLabels = memoryChanges[getHardwareInspectorMemoryKey(memory, index)] ?? [];
        addHardwareInspectorCardAction(card, "复制", () => {
          void copyHardwareInspectorDetail(
            `内存：${slotName}`,
            [
              `容量：${formatHardwareInspectorBytes(memory.capacity)}`,
              `频率：${formatHardwareInspectorClockMhz(
                memory.configuredClockSpeed || memory.speed
              )}`,
              `类型：${formatHardwareInspectorText(memory.memoryType)}`,
              `形态：${formatHardwareInspectorText(memory.formFactor)}`,
              `厂商：${formatHardwareInspectorText(memory.manufacturer)}`,
              `型号：${formatHardwareInspectorText(memory.partNumber)}`,
              `序列号：${formatHardwareInspectorText(memory.serialNumber)}`
            ],
            "已复制内存信息"
          );
        });
        applyHardwareInspectorCardChangeState(card, changeLabels);
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "容量", value: formatHardwareInspectorBytes(memory.capacity) },
            {
              label: "频率",
              value: formatHardwareInspectorClockMhz(
                memory.configuredClockSpeed || memory.speed
              )
            },
            { label: "类型", value: formatHardwareInspectorText(memory.memoryType) },
            { label: "形态", value: formatHardwareInspectorText(memory.formFactor) },
            { label: "厂商", value: formatHardwareInspectorText(memory.manufacturer) },
            { label: "型号", value: formatHardwareInspectorText(memory.partNumber) },
            { label: "序列号", value: formatHardwareInspectorText(memory.serialNumber) }
          ], changeLabels))
        );
        memorySection.body.appendChild(card);
      });
      form.appendChild(memorySection.section);

      const gpuSection = createHardwareInspectorSection(
        "显卡",
        `共 ${snapshot.gpus.length} 张`
      );
      snapshot.gpus.forEach((gpu, index) => {
        const card = createHardwareInspectorCard(gpu.name || `显卡 ${index + 1}`);
        const changeLabels = gpuChanges[getHardwareInspectorGpuKey(gpu, index)] ?? [];
        addHardwareInspectorCardAction(card, "复制", () => {
          void copyHardwareInspectorDetail(
            `显卡：${gpu.name || `显卡 ${index + 1}`}`,
            [
              `厂商：${formatHardwareInspectorText(gpu.manufacturer)}`,
              `视频处理器：${formatHardwareInspectorText(gpu.videoProcessor)}`,
              `显存：${formatHardwareInspectorBytes(gpu.adapterRam)}`,
              `驱动版本：${formatHardwareInspectorText(gpu.driverVersion)}`,
              `驱动日期：${formatHardwareInspectorDate(gpu.driverDate)}`,
              `温度(可选)：${formatHardwareInspectorTemperature(gpu.temperatureCelsius)}`,
              `温度来源：${gpu.temperatureSource || "不可用"}`,
              `分辨率：${formatHardwareInspectorResolution(gpu)}`,
              `状态：${formatHardwareInspectorText(gpu.status)}`
            ],
            "已复制显卡信息"
          );
        });
        applyHardwareInspectorCardChangeState(card, changeLabels);
        card.appendChild(
          createHardwareInspectorTemperatureBadgeRow(
            gpu.temperatureCelsius,
            gpu.temperatureSource
          )
        );
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "厂商", value: formatHardwareInspectorText(gpu.manufacturer) },
            { label: "视频处理器", value: formatHardwareInspectorText(gpu.videoProcessor) },
            { label: "显存", value: formatHardwareInspectorBytes(gpu.adapterRam) },
            { label: "驱动版本", value: formatHardwareInspectorText(gpu.driverVersion) },
            { label: "驱动日期", value: formatHardwareInspectorDate(gpu.driverDate) },
            { label: "温度(可选)", value: formatHardwareInspectorTemperature(gpu.temperatureCelsius) },
            { label: "温度来源", value: gpu.temperatureSource || "不可用" },
            { label: "分辨率", value: formatHardwareInspectorResolution(gpu) },
            { label: "状态", value: formatHardwareInspectorText(gpu.status) }
          ], changeLabels))
        );
        gpuSection.body.appendChild(card);
      });
      form.appendChild(gpuSection.section);

      const diskSection = createHardwareInspectorSection(
        "存储",
        `共 ${snapshot.disks.length} 块`
      );
      snapshot.disks.forEach((disk, index) => {
        const card = createHardwareInspectorCard(disk.model || `磁盘 ${index + 1}`);
        const diskKey = getHardwareInspectorDiskKey(disk, index);
        const changeLabels = diskChanges[diskKey] ?? [];
        addHardwareInspectorCardAction(card, "复制", () => {
          void copyHardwareInspectorDetail(
            `磁盘：${disk.model || `磁盘 ${index + 1}`}`,
            [
              `厂商：${formatHardwareInspectorText(disk.manufacturer)}`,
              `容量：${formatHardwareInspectorBytes(disk.size)}`,
              `媒体类型：${formatHardwareInspectorText(disk.storageMediaType || disk.mediaType)}`,
              `总线：${formatHardwareInspectorText(disk.busType || disk.interfaceType)}`,
              `固件：${formatHardwareInspectorText(
                disk.firmwareVersion || disk.firmwareRevision
              )}`,
              `健康状态：${formatHardwareInspectorText(disk.healthStatus)}`,
              `运行状态：${formatHardwareInspectorText(disk.operationalStatus)}`,
              `预测故障：${formatHardwareInspectorNullableBoolean(
                disk.smartPredictFailure,
                "是",
                "否"
              )}`,
              `预测原因：${
                typeof disk.smartReason === "number" && Number.isFinite(disk.smartReason)
                  ? String(disk.smartReason)
                  : "未知"
              }`,
              `温度：${formatHardwareInspectorTemperature(disk.temperatureCelsius)}`,
              `最高温度：${formatHardwareInspectorTemperature(disk.temperatureMaxCelsius)}`,
              `磨损：${formatHardwareInspectorPercentage(disk.wearPercentage)}`,
              `通电时长：${formatHardwareInspectorHours(disk.powerOnHours)}`,
              `转速：${formatHardwareInspectorRpm(disk.spindleSpeed)}`,
              `逻辑扇区：${formatHardwareInspectorSectorSize(disk.logicalSectorSize)}`,
              `物理扇区：${formatHardwareInspectorSectorSize(disk.physicalSectorSize)}`,
              `序列号：${formatHardwareInspectorText(disk.serialNumber)}`,
              `分区 / 卷：${disk.partitions.length} / ${countHardwareInspectorDiskVolumes(disk)}`
            ],
            "已复制磁盘信息"
          );
        });
        applyHardwareInspectorCardChangeState(card, changeLabels);
        const isRiskDisk = isHardwareInspectorDiskAtRisk(disk);
        card.dataset.healthTone =
          formatHardwareInspectorText(disk.healthStatus) === "未知"
            ? "neutral"
            : isRiskDisk
              ? disk.smartPredictFailure
                ? "danger"
                : "warning"
              : "success";
        const badgeRow = document.createElement("div");
        badgeRow.className = "hardware-inspector-badge-row";
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorText(disk.storageMediaType || disk.mediaType),
            "neutral"
          )
        );
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorText(disk.busType || disk.interfaceType),
            "neutral"
          )
        );
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorText(disk.healthStatus),
            card.dataset.healthTone === "warning" || card.dataset.healthTone === "danger"
              ? (card.dataset.healthTone as "warning" | "danger")
              : card.dataset.healthTone === "success"
                ? "success"
                : "neutral"
          )
        );
        badgeRow.appendChild(
          createHardwareInspectorBadge(
            formatHardwareInspectorNullableBoolean(
              disk.smartPredictFailure,
              "预测故障",
              "未预测故障"
            ),
            disk.smartPredictFailure === true ? "danger" : "neutral"
          )
        );
        card.appendChild(badgeRow);
        card.appendChild(
          createHardwareInspectorMetricGrid(createHardwareInspectorMetricItems([
            { label: "厂商", value: formatHardwareInspectorText(disk.manufacturer) },
            { label: "容量", value: formatHardwareInspectorBytes(disk.size) },
            { label: "媒体类型", value: formatHardwareInspectorText(disk.storageMediaType || disk.mediaType) },
            { label: "总线", value: formatHardwareInspectorText(disk.busType || disk.interfaceType) },
            {
              label: "固件",
              value: formatHardwareInspectorText(disk.firmwareVersion || disk.firmwareRevision)
            },
            { label: "健康状态", value: formatHardwareInspectorText(disk.healthStatus) },
            { label: "运行状态", value: formatHardwareInspectorText(disk.operationalStatus) },
            {
              label: "预测故障",
              value: formatHardwareInspectorNullableBoolean(
                disk.smartPredictFailure,
                "是",
                "否"
              )
            },
            {
              label: "预测原因",
              value:
                typeof disk.smartReason === "number" && Number.isFinite(disk.smartReason)
                  ? String(disk.smartReason)
                  : "未知"
            },
            { label: "温度", value: formatHardwareInspectorTemperature(disk.temperatureCelsius) },
            {
              label: "最高温度",
              value: formatHardwareInspectorTemperature(disk.temperatureMaxCelsius)
            },
            { label: "磨损", value: formatHardwareInspectorPercentage(disk.wearPercentage) },
            { label: "通电时长", value: formatHardwareInspectorHours(disk.powerOnHours) },
            { label: "转速", value: formatHardwareInspectorRpm(disk.spindleSpeed) },
            { label: "逻辑扇区", value: formatHardwareInspectorSectorSize(disk.logicalSectorSize) },
            { label: "物理扇区", value: formatHardwareInspectorSectorSize(disk.physicalSectorSize) },
            {
              label: "槽位",
              value:
                typeof disk.slotNumber === "number" && Number.isFinite(disk.slotNumber)
                  ? String(disk.slotNumber)
                  : "未知"
            },
            {
              label: "机箱槽",
              value:
                typeof disk.enclosureNumber === "number" && Number.isFinite(disk.enclosureNumber)
                  ? String(disk.enclosureNumber)
                  : "未知"
            },
            { label: "用途", value: formatHardwareInspectorText(disk.usage) },
            {
              label: "可加入存储池",
              value: formatHardwareInspectorNullableBoolean(
                disk.canPool,
                "可加入",
                "不可加入"
              )
            },
            { label: "序列号", value: formatHardwareInspectorText(disk.serialNumber) },
            {
              label: "分区数",
              value:
                typeof disk.partitionCount === "number" ? String(disk.partitionCount) : "未知"
            }
          ], changeLabels))
        );

        if (disk.partitions.length > 0) {
          const volumeCount = countHardwareInspectorDiskVolumes(disk);
          const expansionKey = diskKey;
          const isExpanded = hardwareInspectorExpandedDiskKeys.has(expansionKey);
          const partitionSummary = document.createElement("div");
          partitionSummary.className = "hardware-inspector-collapsible-head";
          const partitionMeta = document.createElement("div");
          partitionMeta.className = "hardware-inspector-collapsible-meta";
          partitionMeta.textContent = `分区 ${disk.partitions.length} 个 / 卷 ${volumeCount} 个`;
          const toggleButton = document.createElement("button");
          toggleButton.type = "button";
          toggleButton.className = "settings-btn settings-btn-secondary hardware-inspector-toggle-btn";
          toggleButton.textContent = isExpanded ? "收起分区" : "展开分区";
          toggleButton.addEventListener("click", () => {
            if (hardwareInspectorExpandedDiskKeys.has(expansionKey)) {
              hardwareInspectorExpandedDiskKeys.delete(expansionKey);
            } else {
              hardwareInspectorExpandedDiskKeys.add(expansionKey);
            }
            renderList();
          });
          partitionSummary.append(partitionMeta, toggleButton);
          card.appendChild(partitionSummary);

          const partitionWrap = document.createElement("div");
          partitionWrap.className = "hardware-inspector-sublist";
          partitionWrap.hidden = !isExpanded;
          disk.partitions.forEach((partition) => {
            const partitionNode = document.createElement("div");
            partitionNode.className = "hardware-inspector-subitem";
            const partitionHeader = document.createElement("div");
            partitionHeader.className = "hardware-inspector-subitem-header";
            const partitionTitle = document.createElement("div");
            partitionTitle.className = "hardware-inspector-subitem-title";
            partitionTitle.textContent = partition.name || `分区 ${partition.index ?? "?"}`;
            partitionHeader.appendChild(partitionTitle);
            addHardwareInspectorInlineAction(
              partitionHeader,
              "hardware-inspector-subitem-actions",
              "复制",
              () => {
                void copyHardwareInspectorDetail(
                  `分区：${partition.name || `分区 ${partition.index ?? "?"}`}`,
                  [
                    `容量：${formatHardwareInspectorBytes(partition.size)}`,
                    `类型：${formatHardwareInspectorText(partition.type)}`,
                    `启动分区：${formatHardwareInspectorBoolean(partition.bootPartition)}`,
                    `主分区：${formatHardwareInspectorBoolean(partition.primaryPartition)}`,
                    `卷数量：${partition.volumes.length}`
                  ],
                  "已复制分区信息"
                );
              }
            );
            partitionNode.appendChild(partitionHeader);
            partitionNode.appendChild(
              createHardwareInspectorMetricGrid([
                { label: "容量", value: formatHardwareInspectorBytes(partition.size) },
                { label: "类型", value: formatHardwareInspectorText(partition.type) },
                {
                  label: "启动分区",
                  value: formatHardwareInspectorBoolean(partition.bootPartition)
                },
                {
                  label: "主分区",
                  value: formatHardwareInspectorBoolean(partition.primaryPartition)
                }
              ])
            );

            if (partition.volumes.length > 0) {
              const volumeWrap = document.createElement("div");
              volumeWrap.className = "hardware-inspector-volume-list";
              partition.volumes.forEach((volume) => {
                const volumeNode = document.createElement("div");
                volumeNode.className = "hardware-inspector-volume-item";
                const volumeHeader = document.createElement("div");
                volumeHeader.className = "hardware-inspector-volume-header";
                const head = document.createElement("div");
                head.className = "hardware-inspector-volume-title";
                head.textContent =
                  [volume.deviceId, volume.volumeName].filter(Boolean).join(" / ") || "卷";
                volumeHeader.appendChild(head);
                addHardwareInspectorInlineAction(
                  volumeHeader,
                  "hardware-inspector-volume-actions",
                  "复制",
                  () => {
                    void copyHardwareInspectorDetail(
                      `卷：${[volume.deviceId, volume.volumeName].filter(Boolean).join(" / ") || "卷"}`,
                      [
                        `文件系统：${formatHardwareInspectorText(volume.fileSystem)}`,
                        `总空间：${formatHardwareInspectorBytes(volume.size)}`,
                        `可用空间：${formatHardwareInspectorBytes(volume.freeSpace)}`,
                        `驱动器类型：${formatHardwareInspectorDriveType(volume.driveType)}`
                      ],
                      "已复制卷信息"
                    );
                  }
                );
                volumeNode.appendChild(volumeHeader);
                volumeNode.appendChild(
                  createHardwareInspectorMetricGrid([
                    { label: "文件系统", value: formatHardwareInspectorText(volume.fileSystem) },
                    { label: "总空间", value: formatHardwareInspectorBytes(volume.size) },
                    { label: "可用空间", value: formatHardwareInspectorBytes(volume.freeSpace) },
                    {
                      label: "驱动器类型",
                      value: formatHardwareInspectorDriveType(volume.driveType)
                    }
                  ])
                );
                volumeWrap.appendChild(volumeNode);
              });
              partitionNode.appendChild(volumeWrap);
            }
            partitionWrap.appendChild(partitionNode);
          });
          card.appendChild(partitionWrap);
        }

        diskSection.body.appendChild(card);
      });
      form.appendChild(diskSection.section);
    }

    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    if (!hardwareInspectorSnapshot && !hardwareInspectorLoading && !hardwareInspectorError) {
      queueMicrotask(() => {
        if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
          void executeHardwareInspectorRefresh();
        }
      });
    }
  },

  applyWebtoolsFileHashPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    if (!data) {
      return;
    }

    webtoolsFileHashOutput = "";
    webtoolsFileHashInfo = "";
    webtoolsFileHashError = "";
    webtoolsFileHashSize = "";
    webtoolsFileHashMatched = null;

    if (typeof data.filePath === "string") {
      webtoolsFileHashFilePath = data.filePath;
    }
    if (typeof data.algorithm === "string") {
      webtoolsFileHashAlgorithm = normalizeWebtoolsFileHashAlgorithm(data.algorithm);
    }
    if (typeof data.expectedHash === "string") {
      webtoolsFileHashExpectedHash = data.expectedHash;
    }
    if (typeof data.hash === "string") {
      webtoolsFileHashOutput = data.hash;
    }
    if (typeof data.matched === "boolean") {
      webtoolsFileHashMatched = data.matched;
    } else {
      webtoolsFileHashMatched = null;
    }
    if (typeof data.size === "number" && Number.isFinite(data.size) && data.size >= 0) {
      webtoolsFileHashSize = formatHardwareInspectorBytes(data.size);
    }
    if (typeof data.info === "string") {
      webtoolsFileHashInfo = data.info;
    }
  },

  renderWebtoolsFileHashPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-file-hash-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsFileHashCalculate(form);
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "文件哈希";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "计算文件 MD5 / SHA1 / SHA256 / SHA512 并可校验期望值";

    const pathRow = document.createElement("div");
    pathRow.className = "settings-row webtools-row-full";
    const pathLabel = document.createElement("span");
    pathLabel.className = "settings-row-label";
    pathLabel.textContent = "文件路径";
    const pathInput = document.createElement("input");
    pathInput.className = "settings-value webtools-tool-input webtools-tool-code";
    pathInput.name = "webtoolsFileHashPath";
    pathInput.type = "text";
    pathInput.placeholder = "例如：C:\\\\Users\\\\me\\\\Downloads\\\\file.zip";
    pathInput.addEventListener("input", () => {
      webtoolsFileHashFilePath = pathInput.value;
    });
    const pickButton = document.createElement("button");
    pickButton.type = "button";
    pickButton.className = "settings-btn settings-btn-secondary";
    pickButton.textContent = "选择文件";
    pickButton.addEventListener("click", () => {
      const launcher = getLauncherApi();
      if (!launcher?.pickFilePath) {
        setStatus("当前版本不支持系统文件选择，请手动粘贴文件路径");
        return;
      }

      beginPluginNativeInteraction(20000);
      void launcher
        .pickFilePath()
        .then((selectedPath) => {
          if (typeof selectedPath === "string" && selectedPath.trim()) {
            webtoolsFileHashFilePath = selectedPath.trim();
            webtoolsFileHashError = "";
            webtoolsFileHashInfo = "已选择文件，点击“计算哈希”开始";
          }
        })
        .catch(() => {
          setStatus("打开文件选择器失败");
        })
        .finally(() => {
          schedulePluginNativeInteractionRelease(260);
          refreshWebtoolsFileHashPanelInForm(form);
        });
    });
    pathRow.append(pathLabel, pathInput, pickButton);

    const configRow = document.createElement("div");
    configRow.className = "webtools-tool-bar";

    const algorithmWrap = document.createElement("label");
    algorithmWrap.className = "webtools-tool-bar-group";
    const algorithmLabel = document.createElement("span");
    algorithmLabel.className = "webtools-tool-bar-label";
    algorithmLabel.textContent = "算法";
    const algorithmSelect = document.createElement("select");
    algorithmSelect.className = "settings-number webtools-tool-select";
    algorithmSelect.name = "webtoolsFileHashAlgorithm";
    ["md5", "sha1", "sha256", "sha512"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value.toUpperCase();
      algorithmSelect.appendChild(option);
    });
    algorithmSelect.addEventListener("change", () => {
      webtoolsFileHashAlgorithm = normalizeWebtoolsFileHashAlgorithm(algorithmSelect.value);
    });
    algorithmWrap.append(algorithmLabel, algorithmSelect);

    const expectedWrap = document.createElement("label");
    expectedWrap.className = "webtools-tool-bar-group webtools-file-hash-expected-group";
    const expectedLabel = document.createElement("span");
    expectedLabel.className = "webtools-tool-bar-label";
    expectedLabel.textContent = "期望哈希（可选）";
    const expectedInput = document.createElement("input");
    expectedInput.className = "settings-value webtools-tool-input webtools-tool-code";
    expectedInput.name = "webtoolsFileHashExpected";
    expectedInput.type = "text";
    expectedInput.placeholder = "粘贴用于对比的哈希值";
    expectedInput.addEventListener("input", () => {
      webtoolsFileHashExpectedHash = expectedInput.value;
    });
    expectedWrap.append(expectedLabel, expectedInput);

    configRow.append(algorithmWrap, expectedWrap);

    const outputWrap = document.createElement("label");
    outputWrap.className = "webtools-tool-pane";
    const outputHead = document.createElement("div");
    outputHead.className = "webtools-tool-pane-head";
    const outputTitle = document.createElement("span");
    outputTitle.className = "webtools-tool-pane-title";
    outputTitle.textContent = "哈希结果";
    const fileInfo = document.createElement("span");
    fileInfo.className = "webtools-tool-pane-meta webtools-file-hash-size webtools-tool-code";
    outputHead.append(outputTitle, fileInfo);
    const outputText = document.createElement("textarea");
    outputText.className = "settings-value webtools-textarea webtools-tool-code webtools-file-hash-output";
    outputText.name = "webtoolsFileHashOutput";
    outputText.readOnly = true;
    outputText.spellcheck = false;
    outputWrap.append(outputHead, outputText);

    const verifyLine = document.createElement("div");
    verifyLine.className = "webtools-tool-info webtools-file-hash-verify";

    const infoLine = document.createElement("div");
    infoLine.className = "webtools-tool-info webtools-file-hash-info";

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const calculateButton = document.createElement("button");
    calculateButton.type = "submit";
    calculateButton.className = "settings-btn settings-btn-primary";
    calculateButton.textContent = "计算哈希";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制结果";
    copyButton.addEventListener("click", () => {
      if (!webtoolsFileHashOutput.trim()) {
        setStatus("暂无可复制的哈希结果");
        return;
      }
      void (async () => {
        const copied = await copyTextToClipboard(webtoolsFileHashOutput);
        setStatus(copied ? "已复制哈希结果" : "复制失败");
      })();
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsFileHashFilePath = "";
      webtoolsFileHashExpectedHash = "";
      webtoolsFileHashOutput = "";
      webtoolsFileHashInfo = "";
      webtoolsFileHashError = "";
      webtoolsFileHashSize = "";
      webtoolsFileHashMatched = null;
      refreshWebtoolsFileHashPanelInForm(form);
      setStatus("已清空文件哈希输入");
    });

    actions.append(calculateButton, copyButton, clearButton);

    form.append(
      title,
      description,
      pathRow,
      configRow,
      outputWrap,
      verifyLine,
      infoLine,
      actions
    );
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsFileHashPanelInForm(form);
  },

  applyWebtoolsPortHelperPanelPayload(panel: ActivePluginPanelState): void {
    const data = toRecord(panel.data);
    if (!data) {
      return;
    }

    webtoolsPortHelperRecords = [];
    webtoolsPortHelperError = "";

    if (typeof data.port === "number" && Number.isFinite(data.port)) {
      webtoolsPortHelperPort = String(Math.floor(data.port));
    } else if (typeof data.port === "string" && data.port.trim()) {
      webtoolsPortHelperPort = data.port.trim();
    }
    if (typeof data.protocol === "string") {
      webtoolsPortHelperProtocol = normalizeWebtoolsPortHelperProtocol(data.protocol);
    }
    if (typeof data.pid === "number" && Number.isFinite(data.pid) && data.pid > 0) {
      webtoolsPortHelperPid = String(Math.floor(data.pid));
    } else if (typeof data.pid === "string" && data.pid.trim()) {
      webtoolsPortHelperPid = data.pid.trim();
    }
    if (Array.isArray(data.records)) {
      webtoolsPortHelperRecords = parseWebtoolsPortHelperRecords(data.records);
    }
    if (typeof data.info === "string") {
      webtoolsPortHelperInfo = data.info;
    } else if (panel.message) {
      webtoolsPortHelperInfo = panel.message;
    }
  },

  renderWebtoolsPortHelperPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-port-helper-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsPortHelperAction("query", form);
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "端口助手";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "查看端口占用、定位进程并支持结束占用进程";

    const controls = document.createElement("div");
    controls.className = "webtools-tool-bar webtools-port-helper-controls";

    const portWrap = document.createElement("label");
    portWrap.className = "webtools-tool-bar-group";
    const portLabel = document.createElement("span");
    portLabel.className = "webtools-tool-bar-label";
    portLabel.textContent = "端口";
    const portInput = document.createElement("input");
    portInput.className = "settings-value webtools-tool-input";
    portInput.type = "number";
    portInput.name = "webtoolsPortHelperPort";
    portInput.min = "1";
    portInput.max = "65535";
    portInput.placeholder = "例如 3000（留空=全部）";
    portInput.addEventListener("input", () => {
      webtoolsPortHelperPort = portInput.value;
    });
    portWrap.append(portLabel, portInput);

    const protocolWrap = document.createElement("label");
    protocolWrap.className = "webtools-tool-bar-group";
    const protocolLabel = document.createElement("span");
    protocolLabel.className = "webtools-tool-bar-label";
    protocolLabel.textContent = "协议";
    const protocolSelect = document.createElement("select");
    protocolSelect.className = "settings-number webtools-tool-select";
    protocolSelect.name = "webtoolsPortHelperProtocol";
    [
      { value: "all", label: "TCP + UDP" },
      { value: "tcp", label: "TCP" },
      { value: "udp", label: "UDP" }
    ].forEach((item) => {
      const option = document.createElement("option");
      option.value = item.value;
      option.textContent = item.label;
      protocolSelect.appendChild(option);
    });
    protocolSelect.addEventListener("change", () => {
      webtoolsPortHelperProtocol = normalizeWebtoolsPortHelperProtocol(protocolSelect.value);
    });
    protocolWrap.append(protocolLabel, protocolSelect);

    const pidWrap = document.createElement("label");
    pidWrap.className = "webtools-tool-bar-group";
    const pidLabel = document.createElement("span");
    pidLabel.className = "webtools-tool-bar-label";
    pidLabel.textContent = "PID（可选）";
    const pidInput = document.createElement("input");
    pidInput.className = "settings-value webtools-tool-input";
    pidInput.type = "number";
    pidInput.min = "1";
    pidInput.name = "webtoolsPortHelperPid";
    pidInput.placeholder = "可单独查询/结束进程";
    pidInput.addEventListener("input", () => {
      webtoolsPortHelperPid = pidInput.value;
    });
    pidWrap.append(pidLabel, pidInput);

    controls.append(portWrap, protocolWrap, pidWrap);

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const queryButton = document.createElement("button");
    queryButton.type = "submit";
    queryButton.className = "settings-btn settings-btn-primary";
    queryButton.setAttribute("data-webtools-port-query", "1");
    queryButton.textContent = "查询占用";

    const killButton = document.createElement("button");
    killButton.type = "button";
    killButton.className = "settings-btn settings-btn-secondary";
    killButton.setAttribute("data-webtools-port-kill", "1");
    killButton.textContent = "结束进程";
    killButton.addEventListener("click", () => {
      void executeWebtoolsPortHelperAction("kill", form);
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsPortHelperPort = "";
      webtoolsPortHelperProtocol = "all";
      webtoolsPortHelperPid = "";
      webtoolsPortHelperRecords = [];
      webtoolsPortHelperInfo = "";
      webtoolsPortHelperError = "";
      refreshWebtoolsPortHelperPanelInForm(form);
      setStatus("已清空端口助手输入");
    });

    actions.append(queryButton, killButton, clearButton);

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-port-helper-info";

    const records = document.createElement("div");
    records.className = "webtools-port-helper-results";

    form.append(title, description, controls, actions, info, records);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsPortHelperPanelInForm(form);
  },

  applyWebtoolsPasswordPanelPayload(panel: ActivePluginPanelState): void {
    const optionsRaw = panel.data?.options;
    const parsed = extractWebtoolsPasswordOptionsFromUnknown(optionsRaw);
    webtoolsPasswordOptions = normalizeWebtoolsPasswordOptions(
      parsed,
      webtoolsPasswordOptions
    );
    webtoolsPasswordRows = [];
  },

  renderWebtoolsPasswordPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-password-form webtools-password-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void generateFromWebtoolsPasswordPanel(form, { render: false });
    });

    const hero = document.createElement("h3");
    hero.className = "webtools-password-hero";
    hero.textContent = "随机密码";

    const createOptionRow = (labelText: string): {
      row: HTMLDivElement;
      main: HTMLDivElement;
    } => {
      const row = document.createElement("div");
      row.className = "webtools-password-option";

      const label = document.createElement("div");
      label.className = "webtools-password-option-label";
      label.textContent = labelText;

      const main = document.createElement("div");
      main.className = "webtools-password-option-main";

      row.append(label, main);
      return { row, main };
    };

    const charsRowNodes = createOptionRow("字符选项");
    const charsWrap = document.createElement("div");
    charsWrap.className = "webtools-password-flags";

    const lowerWrap = document.createElement("label");
    lowerWrap.className = "webtools-password-flag";
    const lowerInput = document.createElement("input");
    lowerInput.type = "checkbox";
    lowerInput.name = "webtoolsLowercase";
    lowerInput.className = "password-checkbox";
    lowerInput.checked = webtoolsPasswordOptions.includeLowercase;
    const lowerText = document.createElement("span");
    lowerText.textContent = "小写字母 (a-z)";
    lowerWrap.append(lowerInput, lowerText);

    const upperWrap = document.createElement("label");
    upperWrap.className = "webtools-password-flag";
    const upperInput = document.createElement("input");
    upperInput.type = "checkbox";
    upperInput.name = "webtoolsUppercase";
    upperInput.className = "password-checkbox";
    upperInput.checked = webtoolsPasswordOptions.includeUppercase;
    const upperText = document.createElement("span");
    upperText.textContent = "大写字母 (A-Z)";
    upperWrap.append(upperInput, upperText);

    const digitsWrap = document.createElement("label");
    digitsWrap.className = "webtools-password-flag";
    const digitsInput = document.createElement("input");
    digitsInput.type = "checkbox";
    digitsInput.name = "webtoolsDigits";
    digitsInput.className = "password-checkbox";
    digitsInput.checked = webtoolsPasswordOptions.includeDigits;
    const digitsText = document.createElement("span");
    digitsText.textContent = "数字 (0-9)";
    digitsWrap.append(digitsInput, digitsText);

    charsWrap.append(lowerWrap, upperWrap, digitsWrap);
    charsRowNodes.main.append(charsWrap);

    const symbolsRowNodes = createOptionRow("特殊字符");
    const symbolsWrap = document.createElement("div");
    symbolsWrap.className = "webtools-password-symbols";

    const includeSymbolsWrap = document.createElement("label");
    includeSymbolsWrap.className = "webtools-password-flag";
    const includeSymbolsInput = document.createElement("input");
    includeSymbolsInput.type = "checkbox";
    includeSymbolsInput.name = "webtoolsSymbols";
    includeSymbolsInput.className = "password-checkbox";
    includeSymbolsInput.checked = webtoolsPasswordOptions.includeSymbols;
    const includeSymbolsText = document.createElement("span");
    includeSymbolsText.textContent = "特殊字符";
    includeSymbolsWrap.append(includeSymbolsInput, includeSymbolsText);

    const symbolsInput = document.createElement("input");
    symbolsInput.className = "settings-value webtools-password-symbol-input";
    symbolsInput.type = "text";
    symbolsInput.name = "webtoolsSymbolChars";
    symbolsInput.value = webtoolsPasswordOptions.symbolChars;
    symbolsInput.placeholder = "!@#$%^&*";

    const excludeSimilarWrap = document.createElement("label");
    excludeSimilarWrap.className = "webtools-password-flag";
    const excludeSimilarInput = document.createElement("input");
    excludeSimilarInput.type = "checkbox";
    excludeSimilarInput.name = "webtoolsExcludeSimilar";
    excludeSimilarInput.className = "password-checkbox";
    excludeSimilarInput.checked = webtoolsPasswordOptions.excludeSimilar;
    const excludeSimilarText = document.createElement("span");
    excludeSimilarText.textContent = "排除相似字符";
    excludeSimilarWrap.append(excludeSimilarInput, excludeSimilarText);

    symbolsWrap.append(includeSymbolsWrap, symbolsInput, excludeSimilarWrap);
    symbolsRowNodes.main.append(symbolsWrap);

    const lengthRowNodes = createOptionRow("密码长度");
    const lengthInput = document.createElement("select");
    lengthInput.className = "settings-number webtools-password-length-select";
    lengthInput.name = "webtoolsLength";
    [
      { value: 8, label: "8 位密码 (低强度)" },
      { value: 12, label: "12 位密码 (中强度)" },
      { value: 16, label: "16 位密码 (高强度)" },
      { value: 20, label: "20 位密码 (高强度)" },
      { value: 32, label: "32 位密码 (极高强度)" },
      { value: 64, label: "64 位密码 (极高强度)" }
    ].forEach((entry) => {
      const option = document.createElement("option");
      option.value = String(entry.value);
      option.textContent = entry.label;
      option.selected = entry.value === webtoolsPasswordOptions.length;
      lengthInput.appendChild(option);
    });
    if (lengthInput.selectedIndex === -1) {
      const fallback = document.createElement("option");
      fallback.value = String(webtoolsPasswordOptions.length);
      fallback.textContent = `${webtoolsPasswordOptions.length} 位密码 (自定义)`;
      fallback.selected = true;
      lengthInput.appendChild(fallback);
    }
    const lengthHint = document.createElement("span");
    lengthHint.className = "webtools-password-safe-hint";
    lengthHint.textContent = "密码长度很安全";
    lengthRowNodes.main.append(lengthInput, lengthHint);

    const countRowNodes = createOptionRow("生成数量");
    const countInput = document.createElement("select");
    countInput.className = "settings-number webtools-password-count-select";
    countInput.name = "webtoolsCount";
    [1, 5, 10, 20, 50].forEach((count) => {
      const option = document.createElement("option");
      option.value = String(count);
      option.textContent = String(count);
      option.selected = count === webtoolsPasswordOptions.count;
      countInput.appendChild(option);
    });
    if (countInput.selectedIndex === -1) {
      const fallback = document.createElement("option");
      fallback.value = String(webtoolsPasswordOptions.count);
      fallback.textContent = String(webtoolsPasswordOptions.count);
      fallback.selected = true;
      countInput.appendChild(fallback);
    }
    countRowNodes.main.append(countInput);

    const outputHost = document.createElement("div");
    outputHost.className = "webtools-password-result-host";
    outputHost.appendChild(createWebtoolsPasswordResultTable(webtoolsPasswordRows));

    const generateWrap = document.createElement("div");
    generateWrap.className = "webtools-password-generate-wrap";

    const generateButton = document.createElement("button");
    generateButton.type = "submit";
    generateButton.className = "settings-btn settings-btn-primary webtools-password-generate-btn";
    generateButton.textContent = "生成密码";
    generateWrap.appendChild(generateButton);

    const actions = document.createElement("div");
    actions.className = "settings-actions webtools-password-tools-actions";

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空结果";
    clearButton.addEventListener("click", () => {
      webtoolsPasswordRows = [];
      refreshWebtoolsPasswordResultInForm(form);
      setStatus("已清空密码结果");
    });

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-secondary";
    backButton.textContent = "返回搜索";
    backButton.addEventListener("click", () => {
      backToSearch();
    });

    actions.append(clearButton, backButton);

    form.append(
      hero,
      charsRowNodes.row,
      symbolsRowNodes.row,
      lengthRowNodes.row,
      countRowNodes.row,
      generateWrap,
      outputHost,
      actions
    );
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyWebtoolsJsonPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;

    const input =
      data && typeof data.input === "string"
        ? data.input
        : webtoolsJsonState.input;
    const sourceFormat =
      data &&
      (data.sourceFormat === "json" ||
        data.sourceFormat === "csv" ||
        data.sourceFormat === "text" ||
        data.sourceFormat === "escaped")
        ? data.sourceFormat
        : webtoolsJsonState.sourceFormat;
    const targetFormat =
      data &&
      (data.targetFormat === "json" ||
        data.targetFormat === "csv" ||
        data.targetFormat === "text" ||
        data.targetFormat === "escaped")
        ? data.targetFormat
        : webtoolsJsonState.targetFormat;
    const compressed =
      data && typeof data.compressed === "boolean"
        ? data.compressed
        : webtoolsJsonState.compressed;

    webtoolsJsonState = {
      input,
      output: "",
      info: "",
      valid: null,
      sourceFormat,
      targetFormat,
      compressed
    };
  },

  renderWebtoolsJsonPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "JSON & CSV 实验室";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "支持 JSON/CSV/纯文本/Escaped 双向转换。";

    const form = document.createElement("form");
    form.className = "settings-form webtools-json-form webtools-json-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsJsonConvert(form, { render: false });
    });

    const topActions = document.createElement("div");
    topActions.className = "webtools-json-toolbar";
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsJsonState.input = "";
      webtoolsJsonState.output = "";
      webtoolsJsonState.info = "";
      webtoolsJsonState.valid = null;
      inputArea.value = "";
      outputArea.value = "";
      refreshWebtoolsJsonResultInForm(form);
      setStatus("已清空输入与输出");
    });
    topActions.append(clearButton);

    const converterBar = document.createElement("div");
    converterBar.className = "webtools-json-converter";

    const sourceGroup = document.createElement("label");
    sourceGroup.className = "webtools-json-converter-group";
    const sourceLabel = document.createElement("span");
    sourceLabel.className = "webtools-json-converter-label";
    sourceLabel.textContent = "源格式";
    const sourceSelect = document.createElement("select");
    sourceSelect.className = "settings-number webtools-json-select";
    sourceSelect.name = "webtoolsJsonSource";
    [
      ["text", "纯文本"],
      ["json", "JSON"],
      ["csv", "CSV"],
      ["escaped", "Escaped"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsJsonState.sourceFormat === value;
      sourceSelect.appendChild(option);
    });
    sourceGroup.append(sourceLabel, sourceSelect);

    const swapButton = document.createElement("button");
    swapButton.type = "button";
    swapButton.className = "settings-btn settings-btn-secondary webtools-json-swap";
    swapButton.textContent = "⇅";

    const targetGroup = document.createElement("label");
    targetGroup.className = "webtools-json-converter-group";
    const targetLabel = document.createElement("span");
    targetLabel.className = "webtools-json-converter-label";
    targetLabel.textContent = "目标格式";
    const targetSelect = document.createElement("select");
    targetSelect.className = "settings-number webtools-json-select";
    targetSelect.name = "webtoolsJsonTarget";
    [
      ["json", "JSON"],
      ["csv", "CSV"],
      ["text", "纯文本"],
      ["escaped", "Escaped"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsJsonState.targetFormat === value;
      targetSelect.appendChild(option);
    });
    targetGroup.append(targetLabel, targetSelect);

    const formatHint = document.createElement("div");
    formatHint.className = "webtools-json-route";

    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea webtools-json-textarea";
    inputArea.name = "webtoolsJsonInput";
    inputArea.placeholder = "请输入内容";
    inputArea.value = webtoolsJsonState.input;

    const compressedWrap = document.createElement("label");
    compressedWrap.className = "webtools-password-flag webtools-json-compressed";
    const compressedInput = document.createElement("input");
    compressedInput.type = "checkbox";
    compressedInput.className = "password-checkbox";
    compressedInput.name = "webtoolsJsonCompressed";
    compressedInput.checked = webtoolsJsonState.compressed;
    const compressedText = document.createElement("span");
    compressedText.textContent = "压缩输出 (Minify)";
    compressedWrap.append(compressedInput, compressedText);

    const outputMeta = document.createElement("div");
    outputMeta.className = "webtools-json-pane-controls";
    outputMeta.append(compressedWrap);

    const outputArea = document.createElement("textarea");
    outputArea.className = "settings-value webtools-textarea webtools-json-textarea";
    outputArea.name = "webtoolsJsonOutput";
    outputArea.readOnly = true;
    outputArea.placeholder = "转换后结果";
    outputArea.value = webtoolsJsonState.output;

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className =
      "settings-btn settings-btn-secondary webtools-json-copy-btn";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", () => {
      void (async () => {
        const copied = await copyTextToClipboard(outputArea.value);
        setStatus(copied ? "已复制输出内容" : "复制失败");
      })();
    });
    outputMeta.append(copyButton);

    const updateJsonFormHead = (): void => {
      const source = sourceSelect.value.toUpperCase();
      const target = targetSelect.value.toUpperCase();
      formatHint.textContent = `${source} -> ${target}`;
      compressedWrap.style.display = targetSelect.value === "json" ? "" : "none";
    };

    swapButton.addEventListener("click", () => {
      const source = sourceSelect.value;
      sourceSelect.value = (targetSelect.value || "json") as string;
      targetSelect.value = source as string;

      if (webtoolsJsonState.output.trim()) {
        inputArea.value = webtoolsJsonState.output;
        webtoolsJsonState.output = "";
        outputArea.value = "";
      }
      updateJsonFormHead();
      scheduleWebtoolsJsonAutoConvert(form, true);
    });

    sourceSelect.addEventListener("change", () => {
      updateJsonFormHead();
      scheduleWebtoolsJsonAutoConvert(form, true);
    });
    targetSelect.addEventListener("change", () => {
      updateJsonFormHead();
      scheduleWebtoolsJsonAutoConvert(form, true);
    });
    compressedInput.addEventListener("change", () => {
      scheduleWebtoolsJsonAutoConvert(form, true);
    });
    inputArea.addEventListener("input", () => {
      scheduleWebtoolsJsonAutoConvert(form);
    });
    updateJsonFormHead();

    converterBar.append(sourceGroup, swapButton, targetGroup);

    const editors = document.createElement("div");
    editors.className = "webtools-json-editors";

    const inputPane = document.createElement("section");
    inputPane.className = "webtools-json-pane";
    const inputHead = document.createElement("div");
    inputHead.className = "webtools-json-pane-head";
    const inputTitle = document.createElement("span");
    inputTitle.className = "webtools-json-pane-title";
    inputTitle.textContent = "输入";
    const inputMeta = document.createElement("span");
    inputMeta.className = "webtools-json-pane-meta webtools-json-input-meta";
    inputMeta.textContent = webtoolsJsonState.sourceFormat.toUpperCase();
    inputHead.append(inputTitle, inputMeta);
    const inputError = document.createElement("div");
    inputError.className = "webtools-json-error";
    inputError.hidden = true;
    inputPane.append(inputHead, inputArea, inputError);

    const outputPane = document.createElement("section");
    outputPane.className = "webtools-json-pane";
    const outputHead = document.createElement("div");
    outputHead.className = "webtools-json-pane-head";
    const outputTitle = document.createElement("span");
    outputTitle.className = "webtools-json-pane-title";
    outputTitle.textContent = "输出";
    const outputTitleWrap = document.createElement("div");
    outputTitleWrap.className = "webtools-json-pane-title-wrap";
    const outputMetaText = document.createElement("span");
    outputMetaText.className = "webtools-json-pane-meta webtools-json-output-meta";
    outputMetaText.textContent = webtoolsJsonState.targetFormat.toUpperCase();
    outputTitleWrap.append(outputTitle, outputMetaText);
    outputHead.append(outputTitleWrap, outputMeta);
    outputPane.append(outputHead, outputArea);

    editors.append(inputPane, outputPane);

    const info = document.createElement("div");
    info.className = "webtools-json-info";
    const infoState = buildWebtoolsJsonInfoState();
    info.textContent = infoState.text;
    info.dataset.state = infoState.state;

    form.append(topActions, converterBar, formatHint, editors, info);
    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    scheduleWebtoolsJsonAutoConvert(form, true);
  },

  applyWebtoolsUrlPanelPayload(panel: ActivePluginPanelState): void {
    const input =
      panel.data && typeof panel.data.input === "string"
        ? panel.data.input
        : webtoolsUrlState.input || DEFAULT_WEBTOOLS_URL_INPUT;

    webtoolsUrlState = {
      input: input.trim() || DEFAULT_WEBTOOLS_URL_INPUT,
      info: "",
      valid: null,
      parts: createEmptyWebtoolsUrlParts(),
      queryRows: []
    };

    parseWebtoolsUrlInput(webtoolsUrlState.input);
  },

  renderWebtoolsUrlPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-url-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const inputNode = form.elements.namedItem("webtoolsUrlInput");
      const input = inputNode instanceof HTMLTextAreaElement ? inputNode.value : "";
      parseWebtoolsUrlInput(input);
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
      setStatus(webtoolsUrlState.valid === false ? webtoolsUrlState.info : "URL 解析完成");
    });

    const header = document.createElement("div");
    header.className = "webtools-tool-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "URL 解析";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "输入 URL 后自动拆解，并支持查询参数可视化编辑。";
    titleGroup.append(title, description);

    const toolbar = document.createElement("div");
    toolbar.className = "webtools-tool-toolbar";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制 URL";
    copyButton.addEventListener("click", async () => {
      const value = webtoolsUrlState.input.trim();
      if (!value) {
        setStatus("当前没有可复制的 URL");
        return;
      }
      await navigator.clipboard.writeText(value);
      setStatus("已复制 URL");
    });
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      parseWebtoolsUrlInput("");
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true, syncInput: true });
      setStatus("已清空 URL 输入");
    });
    toolbar.append(copyButton, clearButton);
    header.append(titleGroup, toolbar);

    const inputPane = document.createElement("label");
    inputPane.className = "webtools-tool-pane";
    const inputHead = document.createElement("div");
    inputHead.className = "webtools-tool-pane-head";
    const inputLabel = document.createElement("div");
    inputLabel.className = "webtools-tool-pane-title";
    inputLabel.textContent = "URL";
    const inputMeta = document.createElement("div");
    inputMeta.className = "webtools-tool-pane-meta";
    inputMeta.textContent = "输入后自动解析";
    inputHead.append(inputLabel, inputMeta);
    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea webtools-url-input";
    inputArea.name = "webtoolsUrlInput";
    inputArea.value = webtoolsUrlState.input;
    inputArea.placeholder = "输入 URL";
    inputArea.spellcheck = false;
    inputArea.addEventListener("input", () => {
      parseWebtoolsUrlInput(inputArea.value);
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
      setStatus(webtoolsUrlState.info);
    });
    const inputInfo = document.createElement("div");
    inputInfo.className = "webtools-tool-info webtools-url-info";
    inputPane.append(inputHead, inputArea, inputInfo);

    const partsGrid = document.createElement("div");
    partsGrid.className = "webtools-url-parts-grid";
    partsGrid.append(
      createWebtoolsUrlPartField("Protocol", "protocol"),
      createWebtoolsUrlPartField("Host", "host"),
      createWebtoolsUrlPartField("Port", "port"),
      createWebtoolsUrlPartField("路径", "pathname", true),
      createWebtoolsUrlPartField("查询串", "search", true),
      createWebtoolsUrlPartField("Hash", "hash", true)
    );

    const querySection = document.createElement("section");
    querySection.className = "webtools-url-query-section";
    const queryHead = document.createElement("div");
    queryHead.className = "webtools-url-query-head";
    const queryTitle = document.createElement("h4");
    queryTitle.className = "webtools-url-query-title";
    queryTitle.textContent = "查询参数";
    const addButton = document.createElement("button");
    addButton.type = "button";
    addButton.className = "settings-btn settings-btn-secondary webtools-url-add-btn";
    addButton.textContent = "+ 添加";
    addButton.addEventListener("click", () => {
      webtoolsUrlState.queryRows.push({ key: "", value: "" });
      refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true });
    });
    queryHead.append(queryTitle, addButton);
    const queryHost = document.createElement("div");
    queryHost.className = "webtools-url-query-host";
    querySection.append(queryHead, queryHost);

    form.append(header, inputPane, partsGrid, querySection);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsUrlPanelInForm(form, { rebuildQueryRows: true, syncInput: true });
  },

  applyWebtoolsTimestampPanelPayload(panel: ActivePluginPanelState): void {
    const payloadUnit =
      panel.data && typeof panel.data.unit === "string"
        ? normalizeWebtoolsTimestampUnit(panel.data.unit)
        : webtoolsTimestampUnit;
    webtoolsTimestampUnit = payloadUnit;

    const input =
      panel.data && typeof panel.data.input === "string" ? panel.data.input.trim() : "";
    if (input) {
      if (/^[+-]?\d+$/.test(input)) {
        webtoolsTimestampUnixInput = input;
        if (!(panel.data && typeof panel.data.unit === "string")) {
          webtoolsTimestampUnit = input.length > 10 ? "ms" : "s";
        }
      } else {
        webtoolsTimestampDateInput = input;
      }
    }

    ensureWebtoolsTimestampDefaults();
    webtoolsTimestampDateOutput = "";
    webtoolsTimestampTimestampOutput = "";
    webtoolsTimestampInfo = "";
  },

  renderWebtoolsTimestampPanel(): void {
    clearWebtoolsTimestampClockTimer();
    ensureWebtoolsTimestampDefaults();

    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-timestamp-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "时间戳工具";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "支持时间戳与日期时间双向转换。";

    const form = document.createElement("form");
    form.className = "settings-form webtools-timestamp-form webtools-timestamp-lab";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
    });

    const currentLine = document.createElement("div");
    currentLine.className = "webtools-timestamp-current";
    const currentLocalLabel = document.createElement("span");
    currentLocalLabel.className = "webtools-timestamp-current-label";
    currentLocalLabel.textContent = "当前本地时间:";
    const currentLocalValue = document.createElement("span");
    currentLocalValue.className = "webtools-timestamp-current-value";
    const currentUnixLabel = document.createElement("span");
    currentUnixLabel.className = "webtools-timestamp-current-label";
    currentUnixLabel.textContent = "Unix 时间戳:";
    const currentUnixValue = document.createElement("span");
    currentUnixValue.className = "webtools-timestamp-current-value";
    currentLine.append(
      currentLocalLabel,
      currentLocalValue,
      currentUnixLabel,
      currentUnixValue
    );

    const updateCurrentClock = (): void => {
      if (
        !form.isConnected ||
        mode !== "plugin" ||
        activePluginPanel?.pluginId !== WEBTOOLS_TIMESTAMP_PLUGIN_ID
      ) {
        clearWebtoolsTimestampClockTimer();
        return;
      }
      const now = new Date();
      currentLocalValue.textContent = formatWebtoolsTimestampDate(now);
      currentUnixValue.textContent =
        webtoolsTimestampUnit === "s"
          ? String(Math.floor(now.getTime() / 1000))
          : String(now.getTime());
    };
    updateCurrentClock();
    webtoolsTimestampClockTimer = window.setInterval(updateCurrentClock, 1000);

    const toDateSection = document.createElement("section");
    toDateSection.className = "webtools-timestamp-section";
    const toDateTitle = document.createElement("h4");
    toDateTitle.className = "webtools-timestamp-section-title";
    toDateTitle.textContent = "Unix 时间戳 → 日期字符串";

    const toDateControls = document.createElement("div");
    toDateControls.className = "webtools-timestamp-controls";
    const unixInput = document.createElement("input");
    unixInput.type = "text";
    unixInput.className = "settings-number webtools-timestamp-input";
    unixInput.name = "webtoolsTimestampUnixInput";
    unixInput.placeholder = "例如：1773132180";
    unixInput.value = webtoolsTimestampUnixInput;

    const unitSelect = document.createElement("select");
    unitSelect.className = "settings-number webtools-timestamp-select";
    unitSelect.name = "webtoolsTimestampUnit";
    (
      [
        ["s", "秒 (s)"],
        ["ms", "毫秒 (ms)"]
      ] as const
    ).forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      option.selected = webtoolsTimestampUnit === value;
      unitSelect.appendChild(option);
    });

    const toDateButton = document.createElement("button");
    toDateButton.type = "button";
    toDateButton.className = "settings-btn settings-btn-primary";
    toDateButton.textContent = "转换为日期";
    toDateButton.addEventListener("click", () => {
      webtoolsTimestampUnixInput = unixInput.value;
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
    });

    const nowButton = document.createElement("button");
    nowButton.type = "button";
    nowButton.className = "settings-btn settings-btn-secondary";
    nowButton.textContent = "获取当前";
    nowButton.addEventListener("click", () => {
      webtoolsTimestampUnixInput = getWebtoolsTimestampNowUnix(webtoolsTimestampUnit);
      unixInput.value = webtoolsTimestampUnixInput;
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
      updateCurrentClock();
    });

    toDateControls.append(unixInput, unitSelect, toDateButton, nowButton);

    const toDateResult = document.createElement("div");
    toDateResult.className = "webtools-timestamp-result";
    const toDateResultLabel = document.createElement("label");
    toDateResultLabel.className = "webtools-timestamp-result-label";
    toDateResultLabel.textContent = "日期字符串:";
    const toDateResultValue = document.createElement("input");
    toDateResultValue.type = "text";
    toDateResultValue.readOnly = true;
    toDateResultValue.className = "settings-number webtools-timestamp-result-input";
    toDateResultValue.name = "webtoolsTimestampDateOutput";
    toDateResultValue.value = webtoolsTimestampDateOutput;
    toDateResult.append(toDateResultLabel, toDateResultValue);

    toDateSection.append(toDateTitle, toDateControls, toDateResult);

    const divider = document.createElement("div");
    divider.className = "webtools-timestamp-divider";

    const toTimestampSection = document.createElement("section");
    toTimestampSection.className = "webtools-timestamp-section";
    const toTimestampTitle = document.createElement("h4");
    toTimestampTitle.className = "webtools-timestamp-section-title";
    toTimestampTitle.textContent = "日期字符串 → Unix 时间戳";

    const toTimestampControls = document.createElement("div");
    toTimestampControls.className = "webtools-timestamp-controls";
    const dateInput = document.createElement("input");
    dateInput.type = "text";
    dateInput.className = "settings-number webtools-timestamp-input";
    dateInput.name = "webtoolsTimestampDateInput";
    dateInput.placeholder = "YYYY-MM-DD HH:mm:ss";
    dateInput.value = webtoolsTimestampDateInput;

    const toTimestampButton = document.createElement("button");
    toTimestampButton.type = "button";
    toTimestampButton.className = "settings-btn settings-btn-primary";
    toTimestampButton.textContent = "转换为时间戳";
    toTimestampButton.addEventListener("click", () => {
      webtoolsTimestampDateInput = dateInput.value;
      void executeWebtoolsTimestampAction("toTimestamp", webtoolsTimestampDateInput, {
        render: false,
        form
      });
    });

    toTimestampControls.append(dateInput, toTimestampButton);

    const toTimestampResult = document.createElement("div");
    toTimestampResult.className = "webtools-timestamp-result";
    const toTimestampResultLabel = document.createElement("label");
    toTimestampResultLabel.className = "webtools-timestamp-result-label";
    toTimestampResultLabel.textContent = "Unix 时间戳 (";
    const unitLabel = document.createElement("span");
    unitLabel.dataset.webtoolsTimestampUnitLabel = "1";
    unitLabel.textContent = webtoolsTimestampUnit === "s" ? "秒 (s)" : "毫秒 (ms)";
    toTimestampResultLabel.append(unitLabel, "):");

    const toTimestampResultValue = document.createElement("input");
    toTimestampResultValue.type = "text";
    toTimestampResultValue.readOnly = true;
    toTimestampResultValue.className = "settings-number webtools-timestamp-result-input";
    toTimestampResultValue.name = "webtoolsTimestampTimestampOutput";
    toTimestampResultValue.value = webtoolsTimestampTimestampOutput;
    toTimestampResult.append(toTimestampResultLabel, toTimestampResultValue);

    toTimestampSection.append(toTimestampTitle, toTimestampControls, toTimestampResult);

    const infoLine = document.createElement("div");
    infoLine.className = "webtools-timestamp-info";
    const infoLabel = document.createElement("span");
    infoLabel.className = "webtools-timestamp-info-label";
    infoLabel.textContent = "结果说明:";
    const infoValue = document.createElement("span");
    infoValue.className = "webtools-timestamp-info-value";
    infoValue.textContent = webtoolsTimestampInfo || "-";
    infoLine.append(infoLabel, infoValue);

    unixInput.addEventListener("input", () => {
      webtoolsTimestampUnixInput = unixInput.value;
      scheduleWebtoolsTimestampAutoConvert(form, "toDate");
    });

    dateInput.addEventListener("input", () => {
      webtoolsTimestampDateInput = dateInput.value;
      scheduleWebtoolsTimestampAutoConvert(form, "toTimestamp");
    });

    unitSelect.addEventListener("change", () => {
      webtoolsTimestampUnit = normalizeWebtoolsTimestampUnit(unitSelect.value);
      updateCurrentClock();
      refreshWebtoolsTimestampResultInForm(form);
      void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
        render: false,
        form
      });
      void executeWebtoolsTimestampAction("toTimestamp", webtoolsTimestampDateInput, {
        render: false,
        form
      });
    });

    form.append(currentLine, toDateSection, divider, toTimestampSection, infoLine);
    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    void executeWebtoolsTimestampAction("toDate", webtoolsTimestampUnixInput, {
      render: false,
      form
    });
    void executeWebtoolsTimestampAction("toTimestamp", webtoolsTimestampDateInput, {
      render: false,
      form
    });
  },

  applyWebtoolsRegexPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.pattern === "string") {
      webtoolsRegexPattern = data.pattern;
    }
    if (data && typeof data.flags === "string") {
      webtoolsRegexFlags = data.flags || "g";
    }
    if (data && typeof data.input === "string") {
      webtoolsRegexInput = data.input;
    }
    if (data && typeof data.replacement === "string") {
      webtoolsRegexReplacement = data.replacement;
    }
    if (!webtoolsRegexPattern.trim()) {
      webtoolsRegexPattern = WEBTOOLS_REGEX_DEFAULT_PATTERN;
    }
    if (!webtoolsRegexInput.trim()) {
      webtoolsRegexInput = WEBTOOLS_REGEX_DEFAULT_INPUT;
    }
    webtoolsRegexOutput = "";
    webtoolsRegexInfo = "";
    webtoolsRegexError = "";
    webtoolsRegexHighlightedHtml = "";
    webtoolsRegexRows = [];
  },

  renderWebtoolsRegexPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-regex-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-regex-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
      setStatus(webtoolsRegexError || webtoolsRegexInfo || "已刷新正则结果");
    });

    const header = document.createElement("div");
    header.className = "webtools-tool-header webtools-regex-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title webtools-regex-title";
    title.textContent = activePluginPanel?.title || "正则测试";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "实时匹配高亮，内置常用正则模板。";
    titleGroup.append(title, description);

    const toolbar = document.createElement("div");
    toolbar.className = "webtools-tool-toolbar";
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "settings-btn settings-btn-secondary";
    resetButton.textContent = "重置";
    resetButton.addEventListener("click", () => {
      webtoolsRegexPattern = WEBTOOLS_REGEX_DEFAULT_PATTERN;
      webtoolsRegexFlags = "g";
      webtoolsRegexInput = WEBTOOLS_REGEX_DEFAULT_INPUT;
      webtoolsRegexReplacement = "";

      const patternNode = form.elements.namedItem("webtoolsRegexPattern");
      if (patternNode instanceof HTMLInputElement) {
        patternNode.value = webtoolsRegexPattern;
      }
      const flagsNode = form.elements.namedItem("webtoolsRegexFlags");
      if (flagsNode instanceof HTMLInputElement) {
        flagsNode.value = webtoolsRegexFlags;
      }
      const inputNode = form.elements.namedItem("webtoolsRegexInput");
      if (inputNode instanceof HTMLTextAreaElement) {
        inputNode.value = webtoolsRegexInput;
      }

      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
      setStatus("已重置正则测试");
    });
    toolbar.append(resetButton);
    header.append(titleGroup, toolbar);

    const inputBar = document.createElement("div");
    inputBar.className = "webtools-regex-input-section";
    const line = document.createElement("div");
    line.className = "webtools-regex-input-line";
    const slashLeft = document.createElement("span");
    slashLeft.className = "webtools-regex-slash";
    slashLeft.textContent = "/";
    const patternInput = document.createElement("input");
    patternInput.className = "settings-value webtools-regex-main";
    patternInput.name = "webtoolsRegexPattern";
    patternInput.value = webtoolsRegexPattern;
    patternInput.placeholder = "正则表达式";
    const slashRight = document.createElement("span");
    slashRight.className = "webtools-regex-slash";
    slashRight.textContent = "/";
    const flagsInput = document.createElement("input");
    flagsInput.className = "settings-value webtools-regex-flags";
    flagsInput.type = "text";
    flagsInput.name = "webtoolsRegexFlags";
    flagsInput.value = webtoolsRegexFlags;
    flagsInput.placeholder = "g";
    flagsInput.title = "g, i, m, s, u, y, d";
    line.append(slashLeft, patternInput, slashRight, flagsInput);
    const error = document.createElement("div");
    error.className = "webtools-regex-error";
    error.hidden = true;
    inputBar.append(line, error);

    const templates = document.createElement("div");
    templates.className = "webtools-regex-templates";
    const templatesLabel = document.createElement("span");
    templatesLabel.className = "webtools-regex-templates-label";
    templatesLabel.textContent = "模板";
    templates.appendChild(templatesLabel);
    WEBTOOLS_REGEX_TEMPLATES.forEach((template) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-regex-template-btn";
      button.textContent = template.label;
      button.addEventListener("click", () => {
        webtoolsRegexPattern = template.pattern;
        webtoolsRegexFlags = template.flags;
        patternInput.value = webtoolsRegexPattern;
        flagsInput.value = webtoolsRegexFlags;
        refreshWebtoolsRegexState();
        refreshWebtoolsRegexPreviewInForm(form);
        setStatus(`已应用模板：${template.label}`);
      });
      templates.appendChild(button);
    });

    const layout = document.createElement("div");
    layout.className = "webtools-regex-layout";

    const inputPane = document.createElement("div");
    inputPane.className = "webtools-regex-pane";
    const inputLabel = document.createElement("label");
    inputLabel.className = "webtools-regex-pane-label";
    inputLabel.textContent = "测试文本";
    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea webtools-regex-textarea";
    inputArea.name = "webtoolsRegexInput";
    inputArea.value = webtoolsRegexInput;
    inputArea.placeholder = "输入待测试文本";
    inputPane.append(inputLabel, inputArea);

    const previewPane = document.createElement("div");
    previewPane.className = "webtools-regex-pane";
    const previewLabel = document.createElement("label");
    previewLabel.className = "webtools-regex-pane-label";
    previewLabel.textContent = "匹配结果";
    const previewBox = document.createElement("div");
    previewBox.className = "webtools-regex-highlight-box";
    previewPane.append(previewLabel, previewBox);
    layout.append(inputPane, previewPane);

    const footer = document.createElement("div");
    footer.className = "webtools-regex-footer";
    const info = document.createElement("div");
    info.className = "webtools-regex-info";
    const matchList = document.createElement("div");
    matchList.className = "webtools-regex-match-list";
    footer.append(info, matchList);

    const refresh = () => {
      webtoolsRegexPattern = patternInput.value;
      webtoolsRegexFlags = flagsInput.value || "g";
      webtoolsRegexInput = inputArea.value;
      refreshWebtoolsRegexState();
      refreshWebtoolsRegexPreviewInForm(form);
    };

    patternInput.addEventListener("input", refresh);
    flagsInput.addEventListener("input", refresh);
    inputArea.addEventListener("input", refresh);

    form.append(header, inputBar, templates, layout, footer);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsRegexState();
    refreshWebtoolsRegexPreviewInForm(form);
  },

  applyWebtoolsCryptoPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.algorithm === "string") {
    webtoolsCryptoAlgorithm = normalizeWebtoolsCryptoAlgorithm(data.algorithm);
  }
  if (data && (data.mode === "encrypt" || data.mode === "decrypt")) {
    webtoolsCryptoMode = data.mode;
  }
  if (data && typeof data.input === "string") {
    webtoolsCryptoInput = data.input;
  }
  if (data && typeof data.secretKey === "string") {
    webtoolsCryptoSecret = data.secretKey;
  }
  if (data && typeof data.iv === "string") {
    webtoolsCryptoIv = data.iv;
  }
  if (data && typeof data.publicKey === "string") {
    webtoolsCryptoPublicKey = data.publicKey;
  }
  if (data && typeof data.privateKey === "string") {
    webtoolsCryptoPrivateKey = data.privateKey;
  }
  if (
    data &&
    typeof data.rsaBits === "number" &&
    (data.rsaBits === 1024 || data.rsaBits === 2048 || data.rsaBits === 4096)
  ) {
    webtoolsCryptoRsaBits = data.rsaBits;
  }
  webtoolsCryptoOutput = "";
  webtoolsCryptoInfo = "";
},

  renderWebtoolsCryptoPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-crypto-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-crypto-form webtools-crypto-lab";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsCryptoProcess(form, { render: false });
  });

  const header = document.createElement("div");
  header.className = "webtools-crypto-header";

  const title = document.createElement("h3");
  title.className = "settings-title webtools-crypto-title";
  title.textContent = activePluginPanel?.title || "加密助手";

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-crypto-toolbar";

  const algorithmGroups = [
    { label: "哈希摘要", values: ["MD5", "SHA1", "SHA256", "SHA512"] },
    { label: "对称加密", values: ["AES", "DES"] },
    { label: "非对称 (RSA)", values: ["RSA", "Ed25519"] },
    { label: "编码转换", values: ["Base64", "URL"] }
  ] as const;

  const algorithmPicker = document.createElement("div");
  algorithmPicker.className = "webtools-crypto-picker";
  algorithmPicker.dataset.open = "false";

  const algorithmInput = document.createElement("input");
  algorithmInput.type = "hidden";
  algorithmInput.name = "webtoolsCryptoAlgorithm";
  algorithmInput.value = webtoolsCryptoAlgorithm;

  const algorithmTrigger = document.createElement("button");
  algorithmTrigger.type = "button";
  algorithmTrigger.className = "webtools-crypto-picker-trigger";
  algorithmTrigger.setAttribute("aria-haspopup", "listbox");
  algorithmTrigger.setAttribute("aria-expanded", "false");

  const algorithmTriggerValue = document.createElement("span");
  algorithmTriggerValue.className = "webtools-crypto-picker-value";
  algorithmTriggerValue.textContent = webtoolsCryptoAlgorithm;

  const algorithmTriggerArrow = document.createElement("span");
  algorithmTriggerArrow.className = "webtools-crypto-picker-arrow";
  algorithmTriggerArrow.textContent = "▾";
  algorithmTrigger.append(algorithmTriggerValue, algorithmTriggerArrow);

  const algorithmMenu = document.createElement("div");
  algorithmMenu.className = "webtools-crypto-picker-menu";
  algorithmMenu.setAttribute("role", "listbox");

  let removeAlgorithmOutsideListener: (() => void) | null = null;

  const closeAlgorithmMenu = (): void => {
    algorithmPicker.dataset.open = "false";
    algorithmTrigger.setAttribute("aria-expanded", "false");
    if (removeAlgorithmOutsideListener) {
      removeAlgorithmOutsideListener();
      removeAlgorithmOutsideListener = null;
    }
  };

  const openAlgorithmMenu = (): void => {
    if (algorithmPicker.dataset.open === "true") {
      return;
    }
    algorithmPicker.dataset.open = "true";
    algorithmTrigger.setAttribute("aria-expanded", "true");
    const handleOutsidePointer = (event: PointerEvent): void => {
      const target = event.target;
      if (target instanceof Node && algorithmPicker.contains(target)) {
        return;
      }
      closeAlgorithmMenu();
    };
    document.addEventListener("pointerdown", handleOutsidePointer, true);
    removeAlgorithmOutsideListener = () => {
      document.removeEventListener("pointerdown", handleOutsidePointer, true);
    };
  };

  const setAlgorithmValue = (value: string): void => {
    webtoolsCryptoAlgorithm = normalizeWebtoolsCryptoAlgorithm(value);
    algorithmInput.value = webtoolsCryptoAlgorithm;
    algorithmTriggerValue.textContent = webtoolsCryptoAlgorithm;
    Array.from(
      algorithmMenu.querySelectorAll<HTMLButtonElement>(".webtools-crypto-picker-option")
    ).forEach((button) => {
      button.classList.toggle("active", button.dataset.value === webtoolsCryptoAlgorithm);
    });
  };

  algorithmGroups.forEach((group) => {
    const groupNode = document.createElement("section");
    groupNode.className = "webtools-crypto-picker-group";

    const groupTitle = document.createElement("div");
    groupTitle.className = "webtools-crypto-picker-group-title";
    groupTitle.textContent = group.label;

    const optionList = document.createElement("div");
    optionList.className = "webtools-crypto-picker-option-list";

    group.values.forEach((value) => {
      const optionButton = document.createElement("button");
      optionButton.type = "button";
      optionButton.className = "webtools-crypto-picker-option";
      optionButton.dataset.value = value;
      optionButton.setAttribute("role", "option");
      optionButton.textContent = value;
      optionButton.classList.toggle("active", webtoolsCryptoAlgorithm === value);
      optionButton.addEventListener("click", () => {
        setAlgorithmValue(value);
        closeAlgorithmMenu();
        updateCryptoUiState();
        scheduleWebtoolsCryptoAutoProcess(form, true);
      });
      optionList.appendChild(optionButton);
    });

    groupNode.append(groupTitle, optionList);
    algorithmMenu.appendChild(groupNode);
  });

  algorithmTrigger.addEventListener("click", () => {
    if (algorithmPicker.dataset.open === "true") {
      closeAlgorithmMenu();
      return;
    }
    openAlgorithmMenu();
  });

  algorithmPicker.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeAlgorithmMenu();
      algorithmTrigger.focus();
    }
  });

  algorithmPicker.append(algorithmInput, algorithmTrigger, algorithmMenu);

  const modeInput = document.createElement("input");
  modeInput.type = "hidden";
  modeInput.name = "webtoolsCryptoMode";
  modeInput.value = webtoolsCryptoMode;

  const modeSwitch = document.createElement("div");
  modeSwitch.className = "webtools-crypto-mode-switch";
  const encryptButton = document.createElement("button");
  encryptButton.type = "button";
  encryptButton.className = "webtools-crypto-mode-btn";
  encryptButton.textContent = "加密";
  encryptButton.addEventListener("click", () => {
    modeInput.value = "encrypt";
    webtoolsCryptoMode = "encrypt";
    updateCryptoUiState();
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  const decryptButton = document.createElement("button");
  decryptButton.type = "button";
  decryptButton.className = "webtools-crypto-mode-btn";
  decryptButton.textContent = "解密";
  decryptButton.addEventListener("click", () => {
    modeInput.value = "decrypt";
    webtoolsCryptoMode = "decrypt";
    updateCryptoUiState();
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  modeSwitch.append(encryptButton, decryptButton);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    const inputNode = form.elements.namedItem("webtoolsCryptoInput");
    if (inputNode instanceof HTMLTextAreaElement) {
      inputNode.value = "";
    }
    webtoolsCryptoInput = "";
    webtoolsCryptoOutput = "";
    webtoolsCryptoInfo = "";
    refreshWebtoolsCryptoResultInForm(form);
    setStatus("已清空");
  });

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary webtools-crypto-copy-btn";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(webtoolsCryptoOutput);
      setStatus(copied ? "已复制输出内容" : "复制失败");
    })();
  });

  toolbar.append(algorithmPicker, modeSwitch, clearButton, copyButton);
  header.append(title, toolbar);

  const symmetricConfig = document.createElement("div");
  symmetricConfig.className = "webtools-crypto-config";

  const secretField = document.createElement("label");
  secretField.className = "webtools-crypto-config-item";
  const secretLabel = document.createElement("span");
  secretLabel.className = "webtools-crypto-config-label";
  secretLabel.textContent = "密钥";
  const secretInput = document.createElement("input");
  secretInput.className = "settings-value";
  secretInput.name = "webtoolsCryptoSecret";
  secretInput.value = webtoolsCryptoSecret;
  secretInput.placeholder = "请输入密钥";
  secretField.append(secretLabel, secretInput);

  const ivField = document.createElement("label");
  ivField.className = "webtools-crypto-config-item";
  const ivLabel = document.createElement("span");
  ivLabel.className = "webtools-crypto-config-label";
  ivLabel.textContent = "IV";
  const ivInput = document.createElement("input");
  ivInput.className = "settings-value";
  ivInput.name = "webtoolsCryptoIv";
  ivInput.value = webtoolsCryptoIv;
  ivInput.placeholder = "可选（AES 16字节 / DES 8字节）";
  ivField.append(ivLabel, ivInput);
  symmetricConfig.append(secretField, ivField);

  const asymmetricConfig = document.createElement("div");
  asymmetricConfig.className = "webtools-crypto-config webtools-crypto-asymmetric";

  const rsaBitsField = document.createElement("label");
  rsaBitsField.className = "webtools-crypto-config-item";
  const rsaBitsLabel = document.createElement("span");
  rsaBitsLabel.className = "webtools-crypto-config-label";
  rsaBitsLabel.textContent = "RSA 位数";
  const rsaBitsSelect = document.createElement("select");
  rsaBitsSelect.className = "settings-number";
  rsaBitsSelect.name = "webtoolsCryptoRsaBits";
  [1024, 2048, 4096].forEach((bits) => {
    const option = document.createElement("option");
    option.value = String(bits);
    option.textContent = String(bits);
    option.selected = webtoolsCryptoRsaBits === bits;
    rsaBitsSelect.appendChild(option);
  });
  rsaBitsField.append(rsaBitsLabel, rsaBitsSelect);

  const publicKeyField = document.createElement("label");
  publicKeyField.className = "webtools-crypto-config-item webtools-crypto-config-item-full";
  const publicKeyLabel = document.createElement("span");
  publicKeyLabel.className = "webtools-crypto-config-label";
  publicKeyLabel.textContent = "公钥";
  const publicArea = document.createElement("textarea");
  publicArea.className = "settings-value webtools-textarea webtools-crypto-key-area";
  publicArea.name = "webtoolsCryptoPublicKey";
  publicArea.value = webtoolsCryptoPublicKey;
  publicArea.placeholder = "RSA/Ed25519 公钥";
  publicKeyField.append(publicKeyLabel, publicArea);

  const privateKeyField = document.createElement("label");
  privateKeyField.className = "webtools-crypto-config-item webtools-crypto-config-item-full";
  const privateKeyLabel = document.createElement("span");
  privateKeyLabel.className = "webtools-crypto-config-label";
  privateKeyLabel.textContent = "私钥";
  const privateArea = document.createElement("textarea");
  privateArea.className = "settings-value webtools-textarea webtools-crypto-key-area";
  privateArea.name = "webtoolsCryptoPrivateKey";
  privateArea.value = webtoolsCryptoPrivateKey;
  privateArea.placeholder = "RSA/Ed25519 私钥";
  privateKeyField.append(privateKeyLabel, privateArea);

  const keyActions = document.createElement("div");
  keyActions.className = "webtools-crypto-key-actions";
  const generateKeysButton = document.createElement("button");
  generateKeysButton.type = "button";
  generateKeysButton.className = "settings-btn settings-btn-secondary";
  generateKeysButton.textContent = "生成密钥";
  generateKeysButton.addEventListener("click", () => {
    void (async () => {
      await executeWebtoolsCryptoGenerateKeys(form, { autoEncryptAfterRsaKeys: true });
      updateCryptoUiState();
    })();
  });
  keyActions.append(generateKeysButton);

  asymmetricConfig.append(
    rsaBitsField,
    publicKeyField,
    privateKeyField,
    keyActions
  );

  const editors = document.createElement("div");
  editors.className = "webtools-crypto-editors";

  const inputPane = document.createElement("section");
  inputPane.className = "webtools-crypto-pane";
  const inputPaneLabel = document.createElement("div");
  inputPaneLabel.className = "webtools-crypto-pane-label";
  inputPaneLabel.textContent = "输入";
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-crypto-pane-area";
  inputArea.name = "webtoolsCryptoInput";
  inputArea.value = webtoolsCryptoInput;
  inputArea.placeholder = "输入...";
  inputPane.append(inputPaneLabel, inputArea);

  const outputPane = document.createElement("section");
  outputPane.className = "webtools-crypto-pane";
  const outputPaneLabel = document.createElement("div");
  outputPaneLabel.className = "webtools-crypto-pane-label";
  outputPaneLabel.textContent = "输出";
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-crypto-pane-area";
  outputArea.name = "webtoolsCryptoOutput";
  outputArea.readOnly = true;
  outputArea.value = webtoolsCryptoOutput;
  outputArea.placeholder = "输出...";
  outputPane.append(outputPaneLabel, outputArea);
  editors.append(inputPane, outputPane);

  const info = document.createElement("div");
  info.className = "webtools-crypto-info";
  info.textContent = webtoolsCryptoInfo;
  info.style.display = webtoolsCryptoInfo ? "" : "none";

  const updateCryptoUiState = (): void => {
    const algorithm = normalizeWebtoolsCryptoAlgorithm(algorithmInput.value);
    webtoolsCryptoAlgorithm = algorithm;
    algorithmInput.value = algorithm;
    algorithmTriggerValue.textContent = algorithm;

    const canDecrypt = webtoolsCryptoSupportsDecrypt(algorithm);
    if (!canDecrypt && modeInput.value === "decrypt") {
      modeInput.value = "encrypt";
      webtoolsCryptoMode = "encrypt";
    } else {
      webtoolsCryptoMode = modeInput.value === "decrypt" ? "decrypt" : "encrypt";
    }

    modeSwitch.style.display = canDecrypt ? "" : "none";
    encryptButton.classList.toggle("active", modeInput.value === "encrypt");
    decryptButton.classList.toggle("active", modeInput.value === "decrypt");

    const symmetric = isWebtoolsCryptoSymmetricAlgorithm(algorithm);
    symmetricConfig.style.display = symmetric ? "" : "none";

    const asymmetric = isWebtoolsCryptoAsymmetricAlgorithm(algorithm);
    asymmetricConfig.style.display = asymmetric ? "" : "none";
    rsaBitsField.style.display = algorithm === "RSA" ? "" : "none";
  };

  [
    inputArea,
    secretInput,
    ivInput,
    publicArea,
    privateArea
  ].forEach((node) => {
    node.addEventListener("input", () => {
      scheduleWebtoolsCryptoAutoProcess(form);
    });
  });
  rsaBitsSelect.addEventListener("change", () => {
    webtoolsCryptoRsaBits = Number(rsaBitsSelect.value) || 2048;
    scheduleWebtoolsCryptoAutoProcess(form, true);
  });
  modeInput.addEventListener("change", () => {
    updateCryptoUiState();
  });
  updateCryptoUiState();

  form.append(
    modeInput,
    header,
    symmetricConfig,
    asymmetricConfig,
    editors,
    info
  );
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsCryptoResultInForm(form);
  if (inputArea.value.trim().length > 0) {
    scheduleWebtoolsCryptoAutoProcess(form, true);
  }
},

  applyWebtoolsJwtPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.token === "string") {
    webtoolsJwtToken = data.token;
  }
  if (data && typeof data.header === "string") {
    webtoolsJwtHeader = data.header;
  }
  if (data && typeof data.payload === "string") {
    webtoolsJwtPayload = data.payload;
  }
  if (data && typeof data.secret === "string") {
    webtoolsJwtSecret = data.secret;
  }
  if (data && typeof data.mode === "string") {
    webtoolsJwtMode = data.mode === "jwe" ? "jwe" : "jws";
  }
  if (data && typeof data.algorithm === "string") {
    webtoolsJwtAlgorithm = data.algorithm === "RS256" ? "RS256" : "HS256";
  }
  if (data && typeof data.jweAlg === "string") {
    webtoolsJwtJweAlg = data.jweAlg === "A256KW" ? "A256KW" : "dir";
  }
  if (data && typeof data.jweEnc === "string") {
    webtoolsJwtJweEnc = data.jweEnc === "A128GCM" ? "A128GCM" : "A256GCM";
  }
  if (!webtoolsJwtSecret.trim()) {
    webtoolsJwtSecret = WEBTOOLS_JWT_DEFAULT_SECRET;
  }
  if (
    !webtoolsJwtToken.trim() &&
    !webtoolsJwtHeader.trim() &&
      !webtoolsJwtPayload.trim()
  ) {
    webtoolsJwtToken = WEBTOOLS_JWT_SAMPLE_TOKEN;
    webtoolsJwtHeader = WEBTOOLS_JWT_SAMPLE_HEADER;
    webtoolsJwtPayload = WEBTOOLS_JWT_SAMPLE_PAYLOAD;
    webtoolsJwtMode = "jws";
    webtoolsJwtAlgorithm = "HS256";
  }
  webtoolsJwtVerified = null;
  webtoolsJwtInfo = "";
},

  renderWebtoolsJwtPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-jwt-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-jwt-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsJwtAction("parse", form, { render: false });
  });

  const modeInput = document.createElement("input");
  modeInput.type = "hidden";
  modeInput.name = "webtoolsJwtMode";
  modeInput.value = webtoolsJwtMode;

  const header = document.createElement("div");
  header.className = "webtools-jwt-header";

  const titleGroup = document.createElement("div");
  titleGroup.className = "webtools-jwt-title-group";
  const title = document.createElement("h3");
  title.className = "settings-title webtools-jwt-title";
  title.textContent = activePluginPanel?.title || "JWT 调试器";
  const description = document.createElement("p");
  description.className = "webtools-jwt-subtitle";
  description.textContent =
    activePluginPanel?.subtitle || "支持 JWS/JWE 解析、签名、加密与校验。";
  titleGroup.append(title, description);

  const toolbar = document.createElement("div");
  toolbar.className = "webtools-jwt-toolbar";

  const modeTabs = document.createElement("div");
  modeTabs.className = "webtools-jwt-mode-tabs";
  const jwsModeBtn = document.createElement("button");
  jwsModeBtn.type = "button";
  jwsModeBtn.className = "webtools-jwt-mode-btn";
  jwsModeBtn.dataset.mode = "jws";
  jwsModeBtn.textContent = "JWS (Sign)";
  const jweModeBtn = document.createElement("button");
  jweModeBtn.type = "button";
  jweModeBtn.className = "webtools-jwt-mode-btn";
  jweModeBtn.dataset.mode = "jwe";
  jweModeBtn.textContent = "JWE (Encrypt)";
  modeTabs.append(jwsModeBtn, jweModeBtn);

  const jwsControls = document.createElement("div");
  jwsControls.className = "webtools-jwt-jws-controls";
  const algorithmSelect = document.createElement("select");
  algorithmSelect.className = "settings-number";
  algorithmSelect.name = "webtoolsJwtAlgorithm";
  [
    { value: "HS256", label: "HS256 (HMAC + SHA256)" },
    { value: "RS256", label: "RS256 (RSA + SHA256)" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsJwtAlgorithm === entry.value;
    algorithmSelect.appendChild(option);
  });
  jwsControls.appendChild(algorithmSelect);

  const jweControls = document.createElement("div");
  jweControls.className = "webtools-jwt-jwe-controls";
  const jweAlgSelect = document.createElement("select");
  jweAlgSelect.className = "settings-number";
  jweAlgSelect.name = "webtoolsJwtJweAlg";
  [
    { value: "dir", label: "dir (Direct)" },
    { value: "A256KW", label: "A256KW" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsJwtJweAlg === entry.value;
    jweAlgSelect.appendChild(option);
  });
  const jweEncSelect = document.createElement("select");
  jweEncSelect.className = "settings-number";
  jweEncSelect.name = "webtoolsJwtJweEnc";
  [
    { value: "A256GCM", label: "A256GCM" },
    { value: "A128GCM", label: "A128GCM" }
  ].forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.value;
    option.textContent = entry.label;
    option.selected = webtoolsJwtJweEnc === entry.value;
    jweEncSelect.appendChild(option);
  });
  jweControls.append(jweAlgSelect, jweEncSelect);

  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    webtoolsJwtToken = "";
    webtoolsJwtHeader = "";
    webtoolsJwtPayload = "";
    webtoolsJwtVerified = null;
    webtoolsJwtInfo = "";
    refreshWebtoolsJwtResultInForm(form);
    setStatus("已清空");
  });

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary webtools-jwt-copy-btn";
  copyButton.textContent = "复制";
  copyButton.addEventListener("click", () => {
    void (async () => {
      const copied = await copyTextToClipboard(webtoolsJwtToken);
      setStatus(copied ? "已复制 Token" : "复制失败");
    })();
  });

  toolbar.append(modeTabs, jwsControls, jweControls, clearButton, copyButton);
  header.append(titleGroup, toolbar);

  const body = document.createElement("div");
  body.className = "webtools-jwt-layout";

  const tokenPane = document.createElement("section");
  tokenPane.className = "webtools-jwt-pane webtools-jwt-encoded-pane";
  const tokenLabel = document.createElement("div");
  tokenLabel.className = "webtools-jwt-pane-label";
  tokenLabel.textContent = "编码后的 TOKEN";
  const tokenArea = document.createElement("textarea");
  tokenArea.className = "settings-value webtools-textarea webtools-jwt-token-area";
  tokenArea.name = "webtoolsJwtToken";
  tokenArea.value = webtoolsJwtToken;
  tokenArea.placeholder = "粘贴 JWT/JWE";
  tokenArea.spellcheck = false;
  tokenPane.append(tokenLabel, tokenArea);

  const decodedPane = document.createElement("section");
  decodedPane.className = "webtools-jwt-pane webtools-jwt-decoded";

  const headerSection = document.createElement("section");
  headerSection.className = "webtools-jwt-decoded-section";
  const headerLabel = document.createElement("div");
  headerLabel.className = "webtools-jwt-pane-label webtools-jwt-pane-label-header";
  headerLabel.textContent = "标头 (Header)";
  const headerArea = document.createElement("textarea");
  headerArea.className = "settings-value webtools-textarea webtools-jwt-json-area";
  headerArea.name = "webtoolsJwtHeader";
  headerArea.value = webtoolsJwtHeader;
  headerArea.placeholder = '{"alg":"HS256","typ":"JWT"}';
  headerArea.spellcheck = false;
  headerSection.append(headerLabel, headerArea);

  const payloadSection = document.createElement("section");
  payloadSection.className = "webtools-jwt-decoded-section";
  const payloadLabel = document.createElement("div");
  payloadLabel.className = "webtools-jwt-pane-label webtools-jwt-pane-label-payload";
  payloadLabel.textContent = "载荷 (Payload)";
  const payloadArea = document.createElement("textarea");
  payloadArea.className = "settings-value webtools-textarea webtools-jwt-json-area";
  payloadArea.name = "webtoolsJwtPayload";
  payloadArea.value = webtoolsJwtPayload;
  payloadArea.placeholder = '{"sub":"123","name":"John Doe"}';
  payloadArea.spellcheck = false;
  payloadSection.append(payloadLabel, payloadArea);

  const signatureSection = document.createElement("section");
  signatureSection.className = "webtools-jwt-decoded-section webtools-jwt-signature-section";
  const signatureLabel = document.createElement("div");
  signatureLabel.className = "webtools-jwt-pane-label webtools-jwt-pane-label-signature";
  signatureLabel.textContent = "签名 / 密钥";

  const signatureBody = document.createElement("div");
  signatureBody.className = "webtools-jwt-signature-body";

  const secretField = document.createElement("label");
  secretField.className = "webtools-jwt-secret-field";
  const secretCaption = document.createElement("span");
  secretCaption.className = "webtools-jwt-secret-caption";
  secretCaption.textContent = getWebtoolsJwtSecretLabel(webtoolsJwtMode, webtoolsJwtAlgorithm);
  const secretInput = document.createElement("input");
  secretInput.className = "settings-value webtools-jwt-secret-input";
  secretInput.name = "webtoolsJwtSecret";
  secretInput.value = webtoolsJwtSecret;
  secretInput.placeholder = getWebtoolsJwtSecretPlaceholder(
    webtoolsJwtMode,
    webtoolsJwtAlgorithm,
    webtoolsJwtJweAlg
  );
  secretField.append(secretCaption, secretInput);

  const status = getWebtoolsJwtStatusContent();
  const statusBox = document.createElement("div");
  statusBox.className = "webtools-jwt-status";
  statusBox.dataset.state = status.state;
  const statusText = document.createElement("span");
  statusText.className = "webtools-jwt-status-text";
  statusText.textContent = status.text;
  statusBox.appendChild(statusText);

  const info = document.createElement("div");
  info.className = "webtools-jwt-info";
  info.textContent = webtoolsJwtInfo;
  info.style.display = webtoolsJwtInfo && webtoolsJwtInfo !== status.text ? "" : "none";

  signatureBody.append(secretField, statusBox, info);
  signatureSection.append(signatureLabel, signatureBody);

  const changeMode = (mode: "jws" | "jwe"): void => {
    modeInput.value = mode;
    webtoolsJwtMode = mode;
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtModeUi(form);
    refreshWebtoolsJwtResultInForm(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  };

  jwsModeBtn.addEventListener("click", () => {
    changeMode("jws");
  });
  jweModeBtn.addEventListener("click", () => {
    changeMode("jwe");
  });
  algorithmSelect.addEventListener("change", () => {
    webtoolsJwtAlgorithm = algorithmSelect.value === "RS256" ? "RS256" : "HS256";
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  jweAlgSelect.addEventListener("change", () => {
    webtoolsJwtJweAlg = jweAlgSelect.value === "A256KW" ? "A256KW" : "dir";
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  jweEncSelect.addEventListener("change", () => {
    webtoolsJwtJweEnc = jweEncSelect.value === "A128GCM" ? "A128GCM" : "A256GCM";
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    scheduleWebtoolsJwtAutoSign(form, true);
  });
  tokenArea.addEventListener("input", () => {
    scheduleWebtoolsJwtAutoParse(form);
  });
  tokenArea.addEventListener("blur", () => {
    scheduleWebtoolsJwtAutoParse(form, true);
  });
  headerArea.addEventListener("input", () => {
    scheduleWebtoolsJwtAutoSign(form);
  });
  payloadArea.addEventListener("input", () => {
    scheduleWebtoolsJwtAutoSign(form);
  });
  secretInput.addEventListener("input", () => {
    webtoolsJwtVerified = null;
    refreshWebtoolsJwtResultInForm(form);
    const tokenValue = tokenArea.value.trim();
    if (tokenValue) {
      scheduleWebtoolsJwtAutoParse(form, true);
      return;
    }
    scheduleWebtoolsJwtAutoSign(form);
  });

  decodedPane.append(headerSection, payloadSection, signatureSection);
  body.append(tokenPane, decodedPane);
  form.append(modeInput, header, body);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsJwtResultInForm(form);
  if (tokenArea.value.trim().length > 0) {
    scheduleWebtoolsJwtAutoParse(form, true);
  }
},

  applyWebtoolsDiffPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  webtoolsDiffLeft =
    data && typeof data.left === "string"
      ? data.left
      : "Hello World\nThis is a test of the diff utility.\nSome lines stay the same.";
  webtoolsDiffRight =
    data && typeof data.right === "string"
      ? data.right
      : "Hello Everyone\nThis is a test of the diff engine.\nSome lines stay the same.\nAdded a new line here!";
  webtoolsDiffIgnoreCase =
    data && typeof data.ignoreCase === "boolean"
      ? data.ignoreCase
      : webtoolsDiffIgnoreCase;
  webtoolsDiffIgnoreWhitespace =
    data && typeof data.ignoreWhitespace === "boolean"
      ? data.ignoreWhitespace
      : webtoolsDiffIgnoreWhitespace;
  webtoolsDiffPrettyHtml = "";
  webtoolsDiffSummary = null;
},

  renderWebtoolsDiffPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-diff-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-diff-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsDiffCompare(form, { render: false });
  });

  const header = document.createElement("div");
  header.className = "webtools-diff-header";
  const headerText = document.createElement("div");
  const title = document.createElement("h3");
  title.className = "settings-title";
  title.textContent = activePluginPanel?.title || "文本对比";
  const description = document.createElement("p");
  description.className = "settings-description";
  description.textContent =
    activePluginPanel?.subtitle || "实时比较两段文本并输出高亮差异视图。";
  headerText.append(title, description);
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    webtoolsDiffLeft = "";
    webtoolsDiffRight = "";
    webtoolsDiffPrettyHtml = "";
    webtoolsDiffSummary = null;
    const leftNode = form.elements.namedItem("webtoolsDiffLeft");
    const rightNode = form.elements.namedItem("webtoolsDiffRight");
    if (leftNode instanceof HTMLTextAreaElement) {
      leftNode.value = "";
    }
    if (rightNode instanceof HTMLTextAreaElement) {
      rightNode.value = "";
    }
    refreshWebtoolsDiffResultInForm(form);
    setStatus("已清空文本对比内容");
  });
  header.append(headerText, clearButton);

  const editors = document.createElement("div");
  editors.className = "webtools-diff-editors";

  const leftWrap = document.createElement("label");
  leftWrap.className = "webtools-diff-editor";
  const leftLabel = document.createElement("span");
  leftLabel.className = "settings-row-label";
  leftLabel.textContent = "原文本 (A)";
  const leftArea = document.createElement("textarea");
  leftArea.className = "settings-value webtools-textarea";
  leftArea.name = "webtoolsDiffLeft";
  leftArea.value = webtoolsDiffLeft;
  leftArea.placeholder = "输入左侧文本";
  leftWrap.append(leftLabel, leftArea);

  const rightWrap = document.createElement("label");
  rightWrap.className = "webtools-diff-editor";
  const rightLabel = document.createElement("span");
  rightLabel.className = "settings-row-label";
  rightLabel.textContent = "新文本 (B)";
  const rightArea = document.createElement("textarea");
  rightArea.className = "settings-value webtools-textarea";
  rightArea.name = "webtoolsDiffRight";
  rightArea.value = webtoolsDiffRight;
  rightArea.placeholder = "输入右侧文本";
  rightWrap.append(rightLabel, rightArea);

  editors.append(leftWrap, rightWrap);

  const optionsRow = document.createElement("div");
  optionsRow.className = "webtools-password-flags webtools-diff-options";

  const ignoreCaseWrap = document.createElement("label");
  ignoreCaseWrap.className = "webtools-password-flag";
  const ignoreCaseInput = document.createElement("input");
  ignoreCaseInput.type = "checkbox";
  ignoreCaseInput.name = "webtoolsDiffIgnoreCase";
  ignoreCaseInput.className = "password-checkbox";
  ignoreCaseInput.checked = webtoolsDiffIgnoreCase;
  const ignoreCaseText = document.createElement("span");
  ignoreCaseText.textContent = "忽略大小写";
  ignoreCaseWrap.append(ignoreCaseInput, ignoreCaseText);

  const ignoreWhitespaceWrap = document.createElement("label");
  ignoreWhitespaceWrap.className = "webtools-password-flag";
  const ignoreWhitespaceInput = document.createElement("input");
  ignoreWhitespaceInput.type = "checkbox";
  ignoreWhitespaceInput.name = "webtoolsDiffIgnoreWhitespace";
  ignoreWhitespaceInput.className = "password-checkbox";
  ignoreWhitespaceInput.checked = webtoolsDiffIgnoreWhitespace;
  const ignoreWhitespaceText = document.createElement("span");
  ignoreWhitespaceText.textContent = "忽略空白";
  ignoreWhitespaceWrap.append(ignoreWhitespaceInput, ignoreWhitespaceText);

  optionsRow.append(ignoreCaseWrap, ignoreWhitespaceWrap);

  const summary = document.createElement("div");
  summary.className = "webtools-diff-summary";

  const resultPane = document.createElement("section");
  resultPane.className = "webtools-diff-result";
  const resultLabel = document.createElement("div");
  resultLabel.className = "webtools-diff-result-label";
  resultLabel.textContent = "差异视图";
  const viewer = document.createElement("div");
  viewer.className = "webtools-diff-viewer";
  resultPane.append(resultLabel, viewer);

  [leftArea, rightArea].forEach((node) => {
    node.addEventListener("input", () => {
      scheduleWebtoolsDiffAutoCompare(form);
    });
  });
  [ignoreCaseInput, ignoreWhitespaceInput].forEach((node) => {
    node.addEventListener("change", () => {
      scheduleWebtoolsDiffAutoCompare(form, true);
    });
  });

  form.append(header, editors, optionsRow, summary, resultPane);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsDiffResultInForm(form);
  scheduleWebtoolsDiffAutoCompare(form, true);
},

  applyWebtoolsImageBase64PanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsImageBase64Input = data && typeof data.input === "string" ? data.input : "";
    webtoolsImageBase64DataUrl = "";
    webtoolsImageBase64Raw = "";
    webtoolsImageBase64Mime = "";
    webtoolsImageBase64SizeText = "";
    webtoolsImageBase64Info = "";
    webtoolsImageBase64Error = "";
    webtoolsImageBase64Dragging = false;
    webtoolsImageBase64FileName = "";
  },

  renderWebtoolsImageBase64Panel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-image-base64-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-image-base64-form";

    const previewHost = document.createElement("div");
    previewHost.className = "webtools-image-base64-preview-host";

    const meta = document.createElement("div");
    meta.className = "webtools-image-base64-meta";

    const dropzone = document.createElement("div");
    dropzone.className = "webtools-image-base64-dropzone";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-image-base64-textarea";
    input.name = "webtoolsImageBase64Input";
    input.value = webtoolsImageBase64Input;

    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-image-base64-textarea";
    output.readOnly = true;
    output.value = webtoolsImageBase64DataUrl;
    output.setAttribute("data-webtools-image-base64-output", "1");

    const info = document.createElement("div");
    info.className = "webtools-tool-info";

    const copyRaw = document.createElement("button");
    copyRaw.type = "button";
    copyRaw.className = "settings-btn settings-btn-secondary";
    copyRaw.textContent = "Copy Base64";
    copyRaw.setAttribute("data-webtools-image-copy-raw", "1");

    const copyDataUrl = document.createElement("button");
    copyDataUrl.type = "button";
    copyDataUrl.className = "settings-btn settings-btn-secondary";
    copyDataUrl.textContent = "Copy DataURL";
    copyDataUrl.setAttribute("data-webtools-image-copy-dataurl", "1");

    const download = document.createElement("button");
    download.type = "button";
    download.className = "settings-btn settings-btn-primary";
    download.textContent = "Download";
    download.setAttribute("data-webtools-image-download", "1");

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "settings-btn settings-btn-secondary";
    clear.textContent = "Clear";
    clear.setAttribute("data-webtools-image-clear", "1");

    copyRaw.addEventListener("click", async () => {
      if (!webtoolsImageBase64Raw.trim()) {
        setStatus("No Base64 to copy");
        return;
      }
      await navigator.clipboard.writeText(webtoolsImageBase64Raw);
      setStatus("Copied Base64");
    });

    copyDataUrl.addEventListener("click", async () => {
      if (!webtoolsImageBase64DataUrl.trim()) {
        setStatus("No DataURL to copy");
        return;
      }
      await navigator.clipboard.writeText(webtoolsImageBase64DataUrl);
      setStatus("Copied DataURL");
    });

    download.addEventListener("click", () => {
      beginPluginNativeInteraction(1500);
      if (!webtoolsImageBase64DataUrl.startsWith("data:image/")) {
        schedulePluginNativeInteractionRelease();
        setStatus("No image available");
        return;
      }
      const link = document.createElement("a");
      link.href = webtoolsImageBase64DataUrl;
      link.download = getWebtoolsImageBase64DownloadName();
      link.click();
      schedulePluginNativeInteractionRelease();
      setStatus("Download started");
    });

    clear.addEventListener("click", () => {
      if (webtoolsImageBase64AutoTimer !== null) {
        window.clearTimeout(webtoolsImageBase64AutoTimer);
        webtoolsImageBase64AutoTimer = null;
      }
      webtoolsImageBase64RequestToken += 1;
      webtoolsImageBase64Input = "";
      webtoolsImageBase64DataUrl = "";
      webtoolsImageBase64Raw = "";
      webtoolsImageBase64Mime = "";
      webtoolsImageBase64SizeText = "";
      webtoolsImageBase64Info = "";
      webtoolsImageBase64Error = "";
      webtoolsImageBase64FileName = "";
      input.value = "";
      refreshWebtoolsImageBase64PanelInForm(form);
      setStatus("Cleared");
    });

    input.addEventListener("input", () => {
      webtoolsImageBase64Input = input.value;
      scheduleWebtoolsImageBase64AutoNormalize(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsImageBase64Normalize(input.value, { render: false, form });
    });

    form.append(copyRaw, copyDataUrl, download, clear, previewHost, meta, dropzone, input, info, output);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsImageBase64PanelInForm(form);
    if (webtoolsImageBase64Input.trim()) {
      scheduleWebtoolsImageBase64AutoNormalize(form, true);
    }
  },

  applyWebtoolsImagePromptPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsImagePromptState = normalizeWebtoolsImagePromptState(data);
    webtoolsImagePromptOutput = data && typeof data.output === "string" ? data.output : "";
    webtoolsImagePromptInfo = "";
  },

  renderWebtoolsImagePromptPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-image-prompt-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-image-prompt-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsImagePromptBuild(form, { render: false });
    });

    const header = document.createElement("div");
    header.className = "webtools-image-prompt-header";
    const titleGroup = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "webtools-image-prompt-title";
    title.textContent = activePluginPanel?.title || "图片提示词";
    const description = document.createElement("p");
    description.className = "webtools-image-prompt-description";
    description.textContent =
      activePluginPanel?.subtitle || "点选模块生成 ChatGPT Images 2.0 商业提示词";
    titleGroup.append(title, description);

    const productWrap = document.createElement("label");
    productWrap.className = "webtools-image-prompt-product";
    const productLabel = document.createElement("span");
    productLabel.textContent = "产品";
    const productSelect = document.createElement("select");
    productSelect.name = "webtoolsImagePromptProduct";
    productSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_PRODUCTS.forEach((product) => {
      const option = document.createElement("option");
      option.value = product.id;
      option.textContent = product.label;
      option.selected = webtoolsImagePromptState.productId === product.id;
      productSelect.appendChild(option);
    });
    productSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });
    productWrap.append(productLabel, productSelect);
    header.append(titleGroup, productWrap);

    const updateSelectionFromState = (state: WebtoolsImagePromptState): void => {
      webtoolsImagePromptState = filterWebtoolsImagePromptStateForStyle(state);
      syncWebtoolsImagePromptForm(form, webtoolsImagePromptState);
    };

    const smartTemplateSection = document.createElement("section");
    smartTemplateSection.className =
      "webtools-image-prompt-preset-section webtools-image-prompt-smart-section";
    const smartTemplateTitle = document.createElement("div");
    smartTemplateTitle.className = "webtools-image-prompt-preset-title";
    smartTemplateTitle.textContent = "智能模板";
    const smartTemplateOptions = document.createElement("div");
    smartTemplateOptions.className = "webtools-image-prompt-template-grid";
    WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES.forEach((template) => {
      const templateButton = document.createElement("button");
      templateButton.type = "button";
      templateButton.className = "webtools-image-prompt-template";
      templateButton.dataset.webtoolsImagePromptSmartTemplate = "1";
      templateButton.dataset.selected = String(webtoolsImagePromptSmartTemplateId === template.id);
      templateButton.value = template.id;
      templateButton.title = template.description;
      templateButton.textContent = template.label;
      templateButton.addEventListener("click", () => {
        webtoolsImagePromptRequestToken += 1;
        webtoolsImagePromptSmartTemplateId = template.id;
        syncWebtoolsImagePromptSmartTemplateSelection(smartTemplateOptions);
        const next = createWebtoolsImagePromptSmartTemplateState(template.id);
        next.productId = normalizeWebtoolsImagePromptProductId(productSelect.value);
        const nextPreset = getWebtoolsImagePromptStylePreset(next.stylePresetId);
        webtoolsImagePromptStyleGroup = nextPreset.group;
        webtoolsImagePromptOutput = "";
        updateSelectionFromState(next);
        renderList();
        setStatus(`已套用${template.label}`);
        void executeWebtoolsImagePromptBuild(form, { render: true, state: next });
      });
      smartTemplateOptions.appendChild(templateButton);
    });
    smartTemplateSection.append(smartTemplateTitle, smartTemplateOptions);

    const presetSection = document.createElement("section");
    presetSection.className = "webtools-image-prompt-preset-section";
    const presetTitle = document.createElement("div");
    presetTitle.className = "webtools-image-prompt-preset-title";
    presetTitle.textContent = "风格";
    const styleGroups = Array.from(
      new Set(WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.map((preset) => preset.group))
    );
    const activePreset = getWebtoolsImagePromptStylePreset(webtoolsImagePromptState.stylePresetId);
    if (
      !webtoolsImagePromptStyleGroup ||
      !styleGroups.some((group) => group === webtoolsImagePromptStyleGroup)
    ) {
      webtoolsImagePromptStyleGroup = activePreset.group;
    }
    const presetGroupTabs = document.createElement("div");
    presetGroupTabs.className = "webtools-image-prompt-preset-groups";
    styleGroups.forEach((group) => {
      const groupButton = document.createElement("button");
      groupButton.type = "button";
      groupButton.className = "webtools-image-prompt-preset-group";
      groupButton.name = "webtoolsImagePromptStyleGroup";
      groupButton.value = group;
      groupButton.dataset.selected = String(webtoolsImagePromptStyleGroup === group);
      groupButton.textContent = group;
      groupButton.addEventListener("click", () => {
        webtoolsImagePromptStyleGroup = group;
        renderList();
      });
      presetGroupTabs.appendChild(groupButton);
    });
    const presetOptions = document.createElement("div");
    presetOptions.className = "webtools-image-prompt-preset-options";
    WEBTOOLS_IMAGE_PROMPT_STYLE_PRESETS_FROM_SHARED.filter(
      (preset) => preset.group === webtoolsImagePromptStyleGroup
    ).forEach((preset) => {
      const presetChip = document.createElement("label");
      presetChip.className = "webtools-image-prompt-preset-chip";
      presetChip.dataset.selected = String(webtoolsImagePromptState.stylePresetId === preset.id);
      const input = document.createElement("input");
      input.type = "radio";
      input.name = "webtoolsImagePromptStylePreset";
      input.value = preset.id;
      input.checked = webtoolsImagePromptState.stylePresetId === preset.id;
      input.addEventListener("change", () => {
        if (!input.checked) {
          return;
        }
        webtoolsImagePromptRequestToken += 1;
        const next = createDefaultWebtoolsImagePromptState(preset.id);
        next.productId = normalizeWebtoolsImagePromptProductId(productSelect.value);
        webtoolsImagePromptState = next;
        webtoolsImagePromptStyleGroup = preset.group;
        webtoolsImagePromptSmartTemplateId = "";
        webtoolsImagePromptOutput = "";
        webtoolsImagePromptInfo = "";
        renderList();
        setStatus(`已切换到${preset.label}`);
      });
      const label = document.createElement("strong");
      label.textContent = preset.label;
      const description = document.createElement("span");
      description.textContent = preset.description;
      presetChip.append(input, label, description);
      presetOptions.appendChild(presetChip);
    });
    presetSection.append(presetTitle, presetGroupTabs, presetOptions);

    const grid = document.createElement("div");
    grid.className = "webtools-image-prompt-grid";
    const createChip = (
      name: string,
      value: string,
      selected: boolean,
      onChange?: () => void
    ): HTMLLabelElement => {
      const chip = document.createElement("label");
      chip.className = "webtools-image-prompt-chip";
      chip.dataset.selected = String(selected);
      const input = document.createElement("input");
      input.type = "checkbox";
      input.name = name;
      input.value = value;
      input.checked = selected;
      input.addEventListener("change", () => {
        chip.dataset.selected = String(input.checked);
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        onChange?.();
      });
      const text = document.createElement("span");
      text.textContent = value;
      chip.append(input, text);
      return chip;
    };

    getWebtoolsImagePromptOptionGroupsForStyle(webtoolsImagePromptState.stylePresetId).forEach((group) => {
      const row = document.createElement("section");
      row.className = "webtools-image-prompt-field";
      row.dataset.group = group.key;
      const fieldHead = document.createElement("span");
      fieldHead.className = "webtools-image-prompt-field-head";
      const fieldLabel = document.createElement("strong");
      fieldLabel.textContent = group.label;
      const hint = document.createElement("span");
      hint.textContent = group.description;
      fieldHead.append(fieldLabel, hint);

      const options = document.createElement("div");
      options.className = "webtools-image-prompt-options";
      const selected = new Set(
        getWebtoolsImagePromptSelectedOptions(webtoolsImagePromptState, group.key)
      );
      const categories = group.categories ?? [{ label: "", options: group.options }];
      categories.forEach((category) => {
        const categoryBlock = document.createElement("div");
        categoryBlock.className = "webtools-image-prompt-category";
        if (category.label) {
          const categoryTitle = document.createElement("div");
          categoryTitle.className = "webtools-image-prompt-category-title";
          categoryTitle.textContent = category.label;
          categoryBlock.appendChild(categoryTitle);
        }
        const categoryOptions = document.createElement("div");
        categoryOptions.className = "webtools-image-prompt-options";
        const isExpanded = webtoolsImagePromptExpandedGroups.has(group.key);
        const visibleOptions = isExpanded
          ? category.options
          : compactWebtoolsImagePromptOptions([
              ...category.options.slice(0, WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT),
              ...category.options.filter((option) => selected.has(option))
            ]);
        visibleOptions.forEach((option) => {
          categoryOptions.appendChild(
            createChip(
              `webtoolsImagePromptSelection-${group.key}`,
              option,
              selected.has(option)
            )
          );
        });
        categoryBlock.appendChild(categoryOptions);
        options.appendChild(categoryBlock);
      });
      row.append(fieldHead, options);

      if (group.options.length > WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT) {
        const moreButton = document.createElement("button");
        moreButton.type = "button";
        moreButton.className = "webtools-image-prompt-more";
        moreButton.textContent = webtoolsImagePromptExpandedGroups.has(group.key)
          ? "收起"
          : `更多 ${group.options.length - WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT} 项`;
        moreButton.addEventListener("click", () => {
          if (webtoolsImagePromptExpandedGroups.has(group.key)) {
            webtoolsImagePromptExpandedGroups.delete(group.key);
          } else {
            webtoolsImagePromptExpandedGroups.add(group.key);
          }
          renderList();
        });
        row.appendChild(moreButton);
      }

      if (group.allowCustom && group.key !== "constraints") {
        const customInput = document.createElement("input");
        customInput.type = "text";
        customInput.className =
          "settings-value webtools-tool-input webtools-image-prompt-custom";
        customInput.name = `webtoolsImagePromptCustom-${group.key}`;
        customInput.value = webtoolsImagePromptState.custom[group.key];
        customInput.placeholder = "自定义补充";
        customInput.addEventListener("input", () => {
          webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        });
        row.appendChild(customInput);
      }
      grid.appendChild(row);
    });

    const textBlock = document.createElement("section");
    textBlock.className = "webtools-image-prompt-field webtools-image-prompt-text-block";
    const textHead = document.createElement("span");
    textHead.className = "webtools-image-prompt-field-head";
    const textLabel = document.createElement("strong");
    textLabel.textContent = "文字";
    const textHint = document.createElement("span");
    textHint.textContent = "EXACT 文案、位置、字形、场景化文字设计和出现次数";
    textHead.append(textLabel, textHint);

    const textControls = document.createElement("div");
    textControls.className = "webtools-image-prompt-text-controls";
    const exactInput = document.createElement("input");
    exactInput.type = "text";
    exactInput.name = "webtoolsImagePromptTextExact";
    exactInput.className = "settings-value webtools-tool-input";
    exactInput.placeholder = "例如：降噪黑科技";
    exactInput.value = webtoolsImagePromptState.text.exact;
    exactInput.addEventListener("input", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    const positionSelect = document.createElement("select");
    positionSelect.name = "webtoolsImagePromptTextPosition";
    positionSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.positions.forEach((position) => {
      const option = document.createElement("option");
      option.value = position;
      option.textContent = position;
      option.selected = webtoolsImagePromptState.text.position === position;
      positionSelect.appendChild(option);
    });
    positionSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    const styleSelect = document.createElement("select");
    styleSelect.name = "webtoolsImagePromptTextStyle";
    styleSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.styles.forEach((style) => {
      const option = document.createElement("option");
      option.value = style;
      option.textContent = style;
      option.selected = webtoolsImagePromptState.text.style === style;
      styleSelect.appendChild(option);
    });
    styleSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    const designSelect = document.createElement("select");
    designSelect.name = "webtoolsImagePromptTextDesign";
    designSelect.className = "settings-number webtools-tool-select";
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.designs.forEach((design) => {
      const option = document.createElement("option");
      option.value = design.id;
      option.textContent = design.label;
      option.selected = webtoolsImagePromptState.text.designId === design.id;
      designSelect.appendChild(option);
    });
    designSelect.addEventListener("change", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      renderList();
    });

    const subtitleInput = document.createElement("input");
    subtitleInput.type = "text";
    subtitleInput.name = "webtoolsImagePromptTextSubtitle";
    subtitleInput.className = "settings-value webtools-tool-input";
    subtitleInput.placeholder = "副标题，可留空";
    subtitleInput.value = webtoolsImagePromptState.text.subtitle;
    subtitleInput.addEventListener("input", () => {
      webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
    });

    textControls.append(exactInput, positionSelect, styleSelect, designSelect, subtitleInput);

    const selectedTextDesign = findWebtoolsImagePromptTextDesign(
      webtoolsImagePromptState.text.designId
    );
    const designCard = document.createElement("div");
    designCard.className = "webtools-image-prompt-text-design-card";
    const designCardTitle = document.createElement("strong");
    designCardTitle.textContent = selectedTextDesign.label;
    const designSummary = document.createElement("span");
    designSummary.textContent = selectedTextDesign.summary;
    const designDetails = document.createElement("div");
    designDetails.className = "webtools-image-prompt-text-design-details";
    [
      ["字形", selectedTextDesign.typography],
      ["颜色", selectedTextDesign.color],
      ["效果", selectedTextDesign.effect],
      ["布局", selectedTextDesign.layout],
      ["安全区", selectedTextDesign.safeArea]
    ].forEach(([labelText, valueText]) => {
      const item = document.createElement("span");
      item.textContent = `${labelText}：${valueText}`;
      designDetails.appendChild(item);
    });
    const keywordRow = document.createElement("div");
    keywordRow.className = "webtools-image-prompt-text-design-keywords";
    selectedTextDesign.keywords.forEach((keyword) => {
      const keywordChip = document.createElement("span");
      keywordChip.textContent = keyword;
      keywordRow.appendChild(keywordChip);
    });
    designCard.append(designCardTitle, designSummary, designDetails, keywordRow);

    const textFlags = document.createElement("div");
    textFlags.className = "webtools-image-prompt-options";
    const selectedFlags = new Set(webtoolsImagePromptState.text.flags);
    WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS.flags.forEach((flag) => {
      textFlags.appendChild(
        createChip("webtoolsImagePromptTextFlag", flag, selectedFlags.has(flag))
      );
    });
    textBlock.append(textHead, textControls, designCard, textFlags);
    if (webtoolsImagePromptState.stylePresetId === "birthday-party") {
      const photoControls = document.createElement("div");
      photoControls.className = "webtools-image-prompt-photo-controls";

      const createBirthdayInput = (
        name: string,
        labelText: string,
        placeholder: string,
        value: string
      ): HTMLLabelElement => {
        const wrap = document.createElement("label");
        wrap.className = "webtools-image-prompt-photo-input";
        const label = document.createElement("span");
        label.textContent = labelText;
        const input = document.createElement("input");
        input.type = "text";
        input.name = name;
        input.className = "settings-value webtools-tool-input";
        input.placeholder = placeholder;
        input.value = value;
        input.addEventListener("input", () => {
          webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
        });
        wrap.append(label, input);
        return wrap;
      };

      const photoWrap = document.createElement("label");
      photoWrap.className = "webtools-image-prompt-photo-input";
      const photoLabel = document.createElement("span");
      photoLabel.textContent = "照片 / 人物";
      const photoInput = document.createElement("input");
      photoInput.type = "text";
      photoInput.name = "webtoolsImagePromptPhotoDescription";
      photoInput.className = "settings-value webtools-tool-input";
      photoInput.placeholder = "例如：3岁小女孩，穿白色连衣裙，笑着看镜头";
      photoInput.value = webtoolsImagePromptState.photoDescription;
      photoInput.addEventListener("input", () => {
        webtoolsImagePromptState = collectWebtoolsImagePromptState(form);
      });
      photoWrap.append(photoLabel, photoInput);

      const birthdayFields = document.createElement("div");
      birthdayFields.className = "webtools-image-prompt-birthday-fields";
      birthdayFields.append(
        createBirthdayInput(
          "webtoolsImagePromptTextAge",
          "年龄",
          "例如：3周岁",
          webtoolsImagePromptState.text.age
        ),
        createBirthdayInput(
          "webtoolsImagePromptTextTitle",
          "祝福语",
          "例如：生日快乐",
          webtoolsImagePromptState.text.title
        ),
        createBirthdayInput(
          "webtoolsImagePromptTextName",
          "姓名",
          "可留空",
          webtoolsImagePromptState.text.name
        ),
        createBirthdayInput(
          "webtoolsImagePromptTextLabel",
          "小标签",
          "例如：HAPPY BIRTHDAY",
          webtoolsImagePromptState.text.label
        )
      );

      const birthdayExamples = document.createElement("div");
      birthdayExamples.className = "webtools-image-prompt-birthday-examples";
      WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES.forEach((example) => {
        const exampleChip = document.createElement("button");
        exampleChip.type = "button";
        exampleChip.className = "webtools-image-prompt-template";
        exampleChip.textContent = example.label;
        exampleChip.addEventListener("click", () => {
          webtoolsImagePromptSmartTemplateId = "";
          updateSelectionFromState(cloneWebtoolsImagePromptState(example.state));
          void executeWebtoolsImagePromptBuild(form, { render: false });
        });
        birthdayExamples.appendChild(exampleChip);
      });

      photoControls.append(photoWrap, birthdayFields, birthdayExamples);
      textBlock.appendChild(photoControls);
    }
    grid.appendChild(textBlock);

    const outputBlock = document.createElement("div");
    outputBlock.className = "webtools-image-prompt-output-block";
    const outputHead = document.createElement("div");
    outputHead.className = "webtools-image-prompt-output-head";
    const outputTitle = document.createElement("span");
    outputTitle.textContent = "生成提示词";
    const info = document.createElement("span");
    info.className = "webtools-image-prompt-info";
    outputHead.append(outputTitle, info);
    const output = document.createElement("textarea");
    output.className = "settings-value webtools-textarea webtools-image-prompt-output";
    output.name = "webtoolsImagePromptOutput";
    output.readOnly = true;
    output.value = webtoolsImagePromptOutput;
    outputBlock.append(outputHead, output);

    const actions = document.createElement("div");
    actions.className = "settings-actions webtools-image-prompt-actions";

    const buildButton = document.createElement("button");
    buildButton.type = "submit";
    buildButton.className = "settings-btn settings-btn-primary";
    buildButton.textContent = "生成提示词";

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.dataset.webtoolsImagePromptCopy = "1";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", async () => {
      if (!webtoolsImagePromptOutput.trim()) {
        setStatus("当前没有可复制的提示词");
        return;
      }
      const copied = await copyTextToClipboard(webtoolsImagePromptOutput);
      if (!copied) {
        webtoolsImagePromptInfo = "复制失败";
        refreshWebtoolsImagePromptPanelInForm(form);
        setStatus("复制失败");
        return;
      }

      webtoolsImagePromptInfo = "已复制到剪贴板";
      refreshWebtoolsImagePromptPanelInForm(form);
      copyButton.textContent = "已复制";
      copyButton.dataset.state = "ok";
      const feedbackToken = String(Date.now());
      copyButton.dataset.feedbackToken = feedbackToken;
      window.setTimeout(() => {
        if (copyButton.dataset.feedbackToken !== feedbackToken) {
          return;
        }
        copyButton.textContent = "复制";
        delete copyButton.dataset.state;
        delete copyButton.dataset.feedbackToken;
        copyButton.disabled = !webtoolsImagePromptOutput.trim();
      }, 1200);
      setStatus("已复制图片提示词");
    });

    const exampleButton = document.createElement("button");
    exampleButton.type = "button";
    exampleButton.className = "settings-btn settings-btn-secondary";
    exampleButton.textContent = "耳机示例";
    exampleButton.addEventListener("click", () => {
      webtoolsImagePromptSmartTemplateId = "";
      updateSelectionFromState(cloneWebtoolsImagePromptState(WEBTOOLS_IMAGE_PROMPT_EXAMPLE));
      void executeWebtoolsImagePromptBuild(form, { render: false });
    });

    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      webtoolsImagePromptRequestToken += 1;
      webtoolsImagePromptSmartTemplateId = "";
      updateSelectionFromState(createClearedWebtoolsImagePromptState());
      webtoolsImagePromptOutput = "";
      webtoolsImagePromptInfo = "";
      refreshWebtoolsImagePromptPanelInForm(form);
      setStatus("已清空图片提示词");
    });

    actions.append(buildButton, copyButton, exampleButton, clearButton);
    form.append(header, smartTemplateSection, presetSection, grid, outputBlock, actions);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
    refreshWebtoolsImagePromptPanelInForm(form);
  },

  applyWebtoolsConfigPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.source === "string") {
    webtoolsConfigSource = data.source;
  }
  if (data && typeof data.target === "string") {
    webtoolsConfigTarget = data.target;
  }
  if (data && typeof data.input === "string") {
    webtoolsConfigInput = data.input;
  }
  if (!webtoolsConfigInput.trim()) {
    webtoolsConfigInput = WEBTOOLS_CONFIG_DEFAULT_INPUT;
  }
  webtoolsConfigOutput = data && typeof data.output === "string" ? data.output : "";
  webtoolsConfigInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsConfigError = data && typeof data.error === "string" ? data.error : "";
  if (!webtoolsConfigInfo && !webtoolsConfigError) {
    webtoolsConfigInfo = "输入内容后自动转换";
  }
},

  renderWebtoolsConfigPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-config-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-config-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsConfigConvert(form, { render: false });
  });

  const header = document.createElement("div");
  header.className = "webtools-config-header";
  const headerText = document.createElement("div");
  headerText.className = "webtools-config-header-text";
  const title = document.createElement("h3");
  title.className = "webtools-config-title";
  title.textContent = activePluginPanel?.title || "配置转换";
  const description = document.createElement("p");
  description.className = "webtools-config-subtitle";
  description.textContent =
    activePluginPanel?.subtitle || "YAML / JSON / Properties 双向转换";
  headerText.append(title, description);
  const toolbar = document.createElement("div");
  toolbar.className = "webtools-config-toolbar";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    if (webtoolsConfigAutoTimer !== null) {
      window.clearTimeout(webtoolsConfigAutoTimer);
      webtoolsConfigAutoTimer = null;
    }
    webtoolsConfigRequestToken += 1;
    webtoolsConfigInput = "";
    webtoolsConfigOutput = "";
    webtoolsConfigInfo = "等待输入待转换内容";
    webtoolsConfigError = "";
    const inputNode = form.elements.namedItem("webtoolsConfigInput");
    if (inputNode instanceof HTMLTextAreaElement) {
      inputNode.value = "";
    }
    refreshWebtoolsConfigResultInForm(form);
    setStatus("已清空配置转换内容");
  });
  toolbar.append(clearButton);
  header.append(headerText, toolbar);

  const bar = document.createElement("div");
  bar.className = "webtools-config-bar";

  const sourceRow = document.createElement("label");
  sourceRow.className = "webtools-config-select-wrap";
  const sourceLabel = document.createElement("span");
  sourceLabel.className = "webtools-config-select-label";
  sourceLabel.textContent = "源格式";
  const sourceSelect = document.createElement("select");
  sourceSelect.className = "settings-number webtools-config-select";
  sourceSelect.name = "webtoolsConfigSource";
  WEBTOOLS_CONFIG_FORMAT_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = webtoolsConfigSource === value;
    sourceSelect.appendChild(option);
  });
  sourceRow.append(sourceLabel, sourceSelect);

  const targetRow = document.createElement("label");
  targetRow.className = "webtools-config-select-wrap";
  const targetLabel = document.createElement("span");
  targetLabel.className = "webtools-config-select-label";
  targetLabel.textContent = "目标格式";
  const targetSelect = document.createElement("select");
  targetSelect.className = "settings-number webtools-config-select";
  targetSelect.name = "webtoolsConfigTarget";
  ["properties", "yaml", "json"].forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value.toUpperCase();
    option.selected = webtoolsConfigTarget === value;
    targetSelect.appendChild(option);
  });
  targetRow.append(targetLabel, targetSelect);

  const swapButton = document.createElement("button");
  swapButton.type = "button";
  swapButton.className = "webtools-config-swap";
  swapButton.textContent = "⇅";
  swapButton.addEventListener("click", () => {
    const temp = webtoolsConfigSource;
    webtoolsConfigSource = webtoolsConfigTarget;
    webtoolsConfigTarget = temp;
    sourceSelect.value = webtoolsConfigSource;
    targetSelect.value = webtoolsConfigTarget;
    if (webtoolsConfigOutput.trim() && !webtoolsConfigError) {
      webtoolsConfigInput = webtoolsConfigOutput;
      const inputNode = form.elements.namedItem("webtoolsConfigInput");
      if (inputNode instanceof HTMLTextAreaElement) {
        inputNode.value = webtoolsConfigInput;
      }
    }
    scheduleWebtoolsConfigAutoConvert(form, true);
  });
  bar.append(sourceRow, swapButton, targetRow);

  const editors = document.createElement("div");
  editors.className = "webtools-config-editors";

  const inputRow = document.createElement("div");
  inputRow.className = "webtools-config-editor";
  const inputHead = document.createElement("div");
  inputHead.className = "webtools-config-pane-head";
  const inputLabel = document.createElement("div");
  inputLabel.className = "webtools-config-pane-label";
  inputLabel.dataset.webtoolsConfigInputLabel = "1";
  inputLabel.textContent = "输入";
  const inputMeta = document.createElement("div");
  inputMeta.className = "webtools-config-pane-meta";
  inputMeta.textContent = "输入后自动转换";
  inputHead.append(inputLabel, inputMeta);
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-config-textarea";
  inputArea.name = "webtoolsConfigInput";
  inputArea.value = webtoolsConfigInput;
  inputArea.placeholder = "输入配置内容";
  inputArea.spellcheck = false;
  const error = document.createElement("div");
  error.className = "webtools-config-error";
  error.hidden = true;
  inputRow.append(inputHead, inputArea, error);

  const outputRow = document.createElement("div");
  outputRow.className = "webtools-config-editor";
  const outputHead = document.createElement("div");
  outputHead.className = "webtools-config-pane-head";
  const outputLabel = document.createElement("div");
  outputLabel.className = "webtools-config-pane-label";
  outputLabel.dataset.webtoolsConfigOutputLabel = "1";
  outputLabel.textContent = "输出";
  const outputActions = document.createElement("div");
  outputActions.className = "webtools-config-pane-actions";
  const outputMeta = document.createElement("div");
  outputMeta.className = "webtools-config-pane-meta";
  outputMeta.textContent = "只读";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary webtools-config-copy";
  copyButton.dataset.webtoolsConfigCopy = "1";
  copyButton.textContent = "复制";
  copyButton.hidden = !webtoolsConfigOutput.trim();
  copyButton.addEventListener("click", async () => {
    if (!webtoolsConfigOutput.trim()) {
      setStatus("当前没有可复制内容");
      return;
    }
    const copied = await copyTextToClipboard(webtoolsConfigOutput);
    setStatus(copied ? "已复制配置结果" : "复制配置结果失败");
  });
  outputActions.append(outputMeta, copyButton);
  outputHead.append(outputLabel, outputActions);
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-config-textarea";
  outputArea.name = "webtoolsConfigOutput";
  outputArea.readOnly = true;
  outputArea.value = webtoolsConfigOutput;
  outputArea.placeholder = "转换结果";
  outputArea.spellcheck = false;
  outputRow.append(outputHead, outputArea);
  editors.append(inputRow, outputRow);

  const info = document.createElement("div");
  info.className = "webtools-config-info";

  [sourceSelect, targetSelect].forEach((node) => {
    node.addEventListener("change", () => {
      scheduleWebtoolsConfigAutoConvert(form, true);
    });
  });
  inputArea.addEventListener("input", () => {
    scheduleWebtoolsConfigAutoConvert(form);
  });

  form.append(header, bar, editors, info);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsConfigResultInForm(form);
  scheduleWebtoolsConfigAutoConvert(form, true);
},

  applyWebtoolsSqlPanelPayload(panel: ActivePluginPanelState): void {
  const data = panel.data;
  if (data && typeof data.input === "string") {
    webtoolsSqlInput = data.input;
  }
  if (data && typeof data.dialect === "string") {
    webtoolsSqlDialect = normalizeWebtoolsSqlDialect(data.dialect);
  }
  if (data && typeof data.uppercase === "boolean") {
    webtoolsSqlUppercase = data.uppercase;
  }
  if (data && (typeof data.indent === "number" || typeof data.indent === "string")) {
    webtoolsSqlIndent = normalizeWebtoolsSqlIndent(data.indent);
  }
  webtoolsSqlOutput = data && typeof data.output === "string" ? data.output : "";
  webtoolsSqlInfo = data && typeof data.info === "string" ? data.info : "";
  webtoolsSqlError = data && typeof data.error === "string" ? data.error : "";
  if (!webtoolsSqlInput.trim()) {
    webtoolsSqlInput = WEBTOOLS_SQL_DEFAULT_INPUT;
  }
  if (!webtoolsSqlInfo && !webtoolsSqlError) {
    webtoolsSqlInfo = "输入 SQL 后自动格式化";
  }
},

  renderWebtoolsSqlPanel(): void {
  const panelItem = document.createElement("li");
  panelItem.className = "settings-panel-item";

  const panel = document.createElement("section");
  panel.className = "settings-panel webtools-sql-panel";

  const form = document.createElement("form");
  form.className = "settings-form webtools-sql-form";
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    void executeWebtoolsSqlFormat(form);
  });

  const header = document.createElement("div");
  header.className = "webtools-sql-header";
  const title = document.createElement("h3");
  title.className = "webtools-sql-title";
  title.textContent = activePluginPanel?.title || "SQL 格式化";
  const description = document.createElement("p");
  description.className = "webtools-sql-subtitle";
  description.textContent =
    activePluginPanel?.subtitle || "整理 SQL 语句排版与关键字样式";
  header.append(title, description);

  const bar = document.createElement("div");
  bar.className = "webtools-sql-config";
  const dialectGroup = document.createElement("label");
  dialectGroup.className = "webtools-sql-config-item";
  const dialectLabel = document.createElement("span");
  dialectLabel.className = "webtools-sql-config-label";
  dialectLabel.textContent = "方言";
  const dialectSelect = document.createElement("select");
  dialectSelect.className = "settings-value webtools-sql-config-select";
  dialectSelect.name = "webtoolsSqlDialect";
  WEBTOOLS_SQL_DIALECT_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    option.selected = webtoolsSqlDialect === value;
    dialectSelect.appendChild(option);
  });
  dialectGroup.append(dialectLabel, dialectSelect);

  const indentGroup = document.createElement("label");
  indentGroup.className = "webtools-sql-config-item";
  const indentLabel = document.createElement("span");
  indentLabel.className = "webtools-sql-config-label";
  indentLabel.textContent = "缩进";
  const indentInput = document.createElement("select");
  indentInput.className = "settings-value webtools-sql-config-select";
  indentInput.name = "webtoolsSqlIndent";
  WEBTOOLS_SQL_INDENT_OPTIONS.forEach(({ value, label }) => {
    const option = document.createElement("option");
    option.value = String(value);
    option.textContent = label;
    option.selected = webtoolsSqlIndent === value;
    indentInput.appendChild(option);
  });
  const uppercaseWrap = document.createElement("label");
  uppercaseWrap.className = "webtools-sql-config-toggle";
  const uppercaseInput = document.createElement("input");
  uppercaseInput.type = "checkbox";
  uppercaseInput.className = "password-checkbox";
  uppercaseInput.name = "webtoolsSqlUppercase";
  uppercaseInput.checked = webtoolsSqlUppercase;
  const uppercaseText = document.createElement("span");
  uppercaseText.textContent = "关键字大写";
  uppercaseWrap.append(uppercaseInput, uppercaseText);
  indentGroup.append(indentLabel, indentInput);
  bar.append(dialectGroup, indentGroup, uppercaseWrap);

  const editors = document.createElement("div");
  editors.className = "webtools-sql-editors";

  const inputPane = document.createElement("div");
  inputPane.className = "webtools-sql-pane";
  const inputHead = document.createElement("div");
  inputHead.className = "webtools-sql-pane-header";
  const inputTitle = document.createElement("span");
  inputTitle.className = "webtools-sql-pane-label";
  inputTitle.textContent = "输入 SQL";
  const inputActions = document.createElement("div");
  inputActions.className = "webtools-sql-pane-actions";
  const inputMeta = document.createElement("span");
  inputMeta.className = "webtools-sql-pane-meta";
  inputMeta.textContent = "输入后自动格式化";
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "settings-btn settings-btn-secondary webtools-sql-inline-action";
  clearButton.textContent = "清空";
  clearButton.addEventListener("click", () => {
    if (webtoolsSqlAutoTimer !== null) {
      window.clearTimeout(webtoolsSqlAutoTimer);
      webtoolsSqlAutoTimer = null;
    }
    webtoolsSqlRequestToken += 1;
    webtoolsSqlInput = "";
    webtoolsSqlOutput = "";
    webtoolsSqlInfo = "等待输入 SQL";
    webtoolsSqlError = "";
    inputArea.value = "";
    refreshWebtoolsSqlResultInForm(form);
    setStatus("已清空 SQL 输入");
    inputArea.focus();
  });
  inputActions.append(inputMeta, clearButton);
  inputHead.append(inputTitle, inputActions);
  const inputArea = document.createElement("textarea");
  inputArea.className = "settings-value webtools-textarea webtools-sql-input";
  inputArea.name = "webtoolsSqlInput";
  inputArea.value = webtoolsSqlInput;
  inputArea.placeholder = "输入 SQL";
  inputArea.spellcheck = false;
  const error = document.createElement("div");
  error.className = "webtools-sql-error";
  error.hidden = true;
  inputPane.append(inputHead, inputArea, error);

  const outputPane = document.createElement("div");
  outputPane.className = "webtools-sql-pane";
  const outputHead = document.createElement("div");
  outputHead.className = "webtools-sql-pane-header";
  const outputTitle = document.createElement("span");
  outputTitle.className = "webtools-sql-pane-label";
  outputTitle.textContent = "格式化结果";
  const outputActions = document.createElement("div");
  outputActions.className = "webtools-sql-pane-actions";
  const outputMeta = document.createElement("span");
  outputMeta.className = "webtools-sql-pane-meta";
  outputMeta.textContent = "只读";
  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "settings-btn settings-btn-primary webtools-sql-inline-action";
  copyButton.textContent = "复制";
  copyButton.dataset.webtoolsSqlCopy = "1";
  copyButton.hidden = !webtoolsSqlOutput.trim();
  copyButton.addEventListener("click", async () => {
    if (!webtoolsSqlOutput.trim()) {
      setStatus("暂无可复制的 SQL 结果");
      return;
    }
    await navigator.clipboard.writeText(webtoolsSqlOutput);
    setStatus("已复制格式化结果");
  });
  outputActions.append(outputMeta, copyButton);
  outputHead.append(outputTitle, outputActions);
  const outputArea = document.createElement("textarea");
  outputArea.className = "settings-value webtools-textarea webtools-sql-output";
  outputArea.readOnly = true;
  outputArea.name = "webtoolsSqlOutput";
  outputArea.value = webtoolsSqlOutput;
  outputArea.placeholder = "格式化后输出";
  outputArea.spellcheck = false;
  outputPane.append(outputHead, outputArea);
  editors.append(inputPane, outputPane);

  const info = document.createElement("div");
  info.className = "webtools-tool-info webtools-sql-info";

  [dialectSelect, indentInput, uppercaseInput].forEach((node) => {
    node.addEventListener("change", () => {
      scheduleWebtoolsSqlAutoFormat(form, true);
    });
  });
  inputArea.addEventListener("input", () => {
    scheduleWebtoolsSqlAutoFormat(form);
  });

  form.append(header, bar, editors, info);
  panel.append(form);
  panelItem.appendChild(panel);
  list.appendChild(panelItem);

  refreshWebtoolsSqlResultInForm(form);
  scheduleWebtoolsSqlAutoFormat(form, true);
},

  applyWebtoolsUnitPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.storageValue === "number") {
      webtoolsUnitStorageValue = data.storageValue;
    }
    if (data && typeof data.storageUnit === "string") {
      const normalized = data.storageUnit.toUpperCase();
      if (
        normalized === "B" ||
        normalized === "KB" ||
        normalized === "MB" ||
        normalized === "GB" ||
        normalized === "TB"
      ) {
        webtoolsUnitStorageUnit = normalized;
      }
    }
    if (data && typeof data.pixel === "number") {
      webtoolsUnitPixel = data.pixel;
    }
    if (data && typeof data.rem === "number") {
      webtoolsUnitRem = data.rem;
    }
    if (data && typeof data.basePx === "number") {
      webtoolsUnitBasePx = data.basePx;
    }
    updateWebtoolsUnitStorageFrom(webtoolsUnitStorageUnit, webtoolsUnitStorageValue);
  },

  renderWebtoolsUnitPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-unit-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-unit-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      refreshWebtoolsUnitPanelInForm(form);
      setStatus(webtoolsUnitActiveTab === "storage" ? "容量换算完成" : "px/rem 换算完成");
    });

    const header = document.createElement("div");
    header.className = "webtools-tool-header";
    const titleGroup = document.createElement("div");
    titleGroup.className = "webtools-tool-title-group";
    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "单位换算";
    const description = document.createElement("p");
    description.className = "webtools-tool-subtitle";
    description.textContent =
      activePluginPanel?.subtitle || "存储容量与 px/rem 换算。";
    titleGroup.append(title, description);

    const tabs = document.createElement("div");
    tabs.className = "webtools-unit-tabs";
    [
      { id: "storage" as const, label: "容量换算" },
      { id: "screen" as const, label: "px / rem" }
    ].forEach(({ id, label }) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "webtools-unit-tab";
      button.dataset.active = String(webtoolsUnitActiveTab === id);
      button.textContent = label;
      button.addEventListener("click", () => {
        webtoolsUnitActiveTab = id;
        renderList();
      });
      tabs.appendChild(button);
    });
    header.append(titleGroup, tabs);
    form.appendChild(header);

    if (webtoolsUnitActiveTab === "storage") {
      const stack = document.createElement("div");
      stack.className = "webtools-unit-storage-stack";
      (
        [
          { unit: "B", label: "Byte (B)" },
          { unit: "KB", label: "KB" },
          { unit: "MB", label: "MB" },
          { unit: "GB", label: "GB" },
          { unit: "TB", label: "TB" }
        ] as Array<{ unit: WebtoolsUnitStorageKey; label: string }>
      ).forEach(({ unit, label }) => {
        const field = document.createElement("label");
        field.className = "webtools-unit-field";
        const fieldLabel = document.createElement("div");
        fieldLabel.className = "webtools-unit-field-label";
        fieldLabel.textContent = label;
        const input = document.createElement("input");
        input.className = "settings-value webtools-tool-input webtools-tool-code";
        input.type = "number";
        input.step = "any";
        input.dataset.unitStorage = unit;
        input.addEventListener("input", () => {
          updateWebtoolsUnitStorageFrom(unit, Number(input.value));
          refreshWebtoolsUnitPanelInForm(form);
        });
        field.append(fieldLabel, input);
        stack.appendChild(field);
      });

      const info = document.createElement("div");
      info.className = "webtools-tool-info webtools-unit-info";
      form.append(stack, info);
      panel.append(form);
      panelItem.appendChild(panel);
      list.appendChild(panelItem);
      refreshWebtoolsUnitPanelInForm(form);
      return;
    }

    const screenBox = document.createElement("div");
    screenBox.className = "webtools-unit-screen-box";

    const rootSetup = document.createElement("div");
    rootSetup.className = "webtools-unit-root-setup";
    const rootLabel = document.createElement("label");
    rootLabel.className = "webtools-unit-root-label";
    rootLabel.textContent = "根字号(px)：";
    const baseInput = document.createElement("input");
    baseInput.className = "settings-value webtools-tool-input webtools-unit-root-input";
    baseInput.type = "number";
    baseInput.step = "0.01";
    baseInput.name = "webtoolsUnitBasePx";
    const rootHint = document.createElement("p");
    rootHint.className = "webtools-unit-root-hint";
    rootHint.textContent = "通常浏览器默认根字号为 16px";
    rootSetup.append(rootLabel, baseInput, rootHint);

    const divider = document.createElement("div");
    divider.className = "webtools-unit-divider";

    const dualInput = document.createElement("div");
    dualInput.className = "webtools-unit-dual-input";
    const pxField = document.createElement("label");
    pxField.className = "webtools-unit-field";
    const pxLabel = document.createElement("div");
    pxLabel.className = "webtools-unit-field-label";
    pxLabel.textContent = "Pixel (px)";
    const pxInput = document.createElement("input");
    pxInput.className = "settings-value webtools-tool-input webtools-tool-code";
    pxInput.type = "number";
    pxInput.step = "0.01";
    pxInput.name = "webtoolsUnitPixel";
    pxField.append(pxLabel, pxInput);

    const swapIcon = document.createElement("div");
    swapIcon.className = "webtools-unit-swap-icon";
    swapIcon.textContent = "⇄";

    const remField = document.createElement("label");
    remField.className = "webtools-unit-field";
    const remLabel = document.createElement("div");
    remLabel.className = "webtools-unit-field-label";
    remLabel.textContent = "REM (rem)";
    const remInput = document.createElement("input");
    remInput.className = "settings-value webtools-tool-input webtools-tool-code";
    remInput.type = "number";
    remInput.step = "0.0001";
    remInput.name = "webtoolsUnitRem";
    remField.append(remLabel, remInput);
    dualInput.append(pxField, swapIcon, remField);

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-unit-info";

    baseInput.addEventListener("input", () => {
      updateWebtoolsUnitFromPixel(webtoolsUnitPixel, Number(baseInput.value));
      refreshWebtoolsUnitPanelInForm(form);
    });
    pxInput.addEventListener("input", () => {
      updateWebtoolsUnitFromPixel(Number(pxInput.value), Number(baseInput.value));
      refreshWebtoolsUnitPanelInForm(form);
    });
    remInput.addEventListener("input", () => {
      updateWebtoolsUnitFromRem(Number(remInput.value), Number(baseInput.value));
      refreshWebtoolsUnitPanelInForm(form);
    });

    screenBox.append(rootSetup, divider, dualInput);
    form.append(screenBox, info);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
    refreshWebtoolsUnitPanelInForm(form);
  },

  applyWebtoolsMarkdownPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.input === "string") {
      webtoolsMarkdownInput = data.input;
    }
    webtoolsMarkdownHtml = "";
    webtoolsMarkdownInfo = "";
  },

  renderWebtoolsMarkdownPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";
  
    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-markdown-panel";
  
    const form = document.createElement("form");
    form.className = "settings-form webtools-markdown-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsMarkdownRender(form);
    });
  
    const header = document.createElement("div");
    header.className = "webtools-markdown-header";
    const titleGroup = document.createElement("div");
    const title = document.createElement("h3");
    title.className = "webtools-markdown-title";
    title.textContent = activePluginPanel?.title || "Markdown 预览";
    const description = document.createElement("p");
    description.className = "webtools-markdown-description";
    description.textContent =
      activePluginPanel?.subtitle || "Markdown 转 HTML 实时预览";
    titleGroup.append(title, description);
  
    const toolbar = document.createElement("div");
    toolbar.className = "webtools-markdown-toolbar";
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.dataset.webtoolsMarkdownCopy = "1";
    copyButton.textContent = "复制 HTML";
    copyButton.addEventListener("click", async () => {
      const copied = await copyTextToClipboard(webtoolsMarkdownHtml);
      setStatus(copied ? "已复制 HTML" : "复制 HTML 失败");
    });
    const clearButton = document.createElement("button");
    clearButton.type = "button";
    clearButton.className = "settings-btn settings-btn-secondary";
    clearButton.textContent = "清空";
    clearButton.addEventListener("click", () => {
      if (webtoolsMarkdownAutoTimer !== null) {
        window.clearTimeout(webtoolsMarkdownAutoTimer);
        webtoolsMarkdownAutoTimer = null;
      }
      webtoolsMarkdownRequestToken += 1;
      webtoolsMarkdownInput = "";
      webtoolsMarkdownHtml = "";
      webtoolsMarkdownInfo = "等待输入 Markdown";
      const node = form.elements.namedItem("webtoolsMarkdownInput");
      if (node instanceof HTMLTextAreaElement) {
        node.value = "";
        node.focus();
      }
      refreshWebtoolsMarkdownPanelInForm(form);
      setStatus("已清空 Markdown 内容");
    });
    toolbar.append(copyButton, clearButton);
    header.append(titleGroup, toolbar);
  
    const layout = document.createElement("div");
    layout.className = "webtools-markdown-layout";
  
    const editorPane = document.createElement("div");
    editorPane.className = "webtools-markdown-pane";
    const editorHead = document.createElement("div");
    editorHead.className = "webtools-markdown-pane-head";
    editorHead.textContent = "Markdown 输入";
    const inputArea = document.createElement("textarea");
    inputArea.className = "settings-value webtools-textarea webtools-markdown-editor";
    inputArea.name = "webtoolsMarkdownInput";
    inputArea.value = webtoolsMarkdownInput;
    inputArea.placeholder = "输入 Markdown";
    inputArea.spellcheck = false;
    inputArea.addEventListener("input", () => {
      webtoolsMarkdownInput = inputArea.value;
      scheduleWebtoolsMarkdownAutoRender(form);
    });
    editorPane.append(editorHead, inputArea);
  
    const previewPane = document.createElement("div");
    previewPane.className = "webtools-markdown-pane";
    const previewHead = document.createElement("div");
    previewHead.className = "webtools-markdown-pane-head";
    previewHead.textContent = "实时预览";
    const previewBody = document.createElement("div");
    previewBody.className = "webtools-markdown-preview-body";
    previewBody.dataset.webtoolsMarkdownPreview = "1";
    previewPane.append(previewHead, previewBody);
  
    layout.append(editorPane, previewPane);
  
    const htmlBlock = document.createElement("div");
    htmlBlock.className = "webtools-markdown-html-block";
    const htmlHead = document.createElement("div");
    htmlHead.className = "webtools-markdown-html-head";
    htmlHead.textContent = "HTML 输出";
    const htmlArea = document.createElement("textarea");
    htmlArea.className = "settings-value webtools-textarea webtools-markdown-html";
    htmlArea.name = "webtoolsMarkdownHtml";
    htmlArea.readOnly = true;
    htmlArea.placeholder = "渲染后 HTML";
    const info = document.createElement("div");
    info.className = "webtools-markdown-info";
    htmlBlock.append(htmlHead, htmlArea, info);
  
    form.append(header, layout, htmlBlock);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  
    refreshWebtoolsMarkdownPanelInForm(form);
    scheduleWebtoolsMarkdownAutoRender(form, true);
  },

  applyWebtoolsStringsPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.input === "string") {
      webtoolsStringsInput = data.input;
    }
    if (data && typeof data.caseType === "string") {
      webtoolsStringsCaseType = data.caseType;
    }
    if (data && typeof data.count === "number") {
      webtoolsStringsUuidCount = data.count;
    }
    webtoolsStringsOutput = "";
    webtoolsStringsUuidItems = [];
  },

  renderWebtoolsStringsPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-strings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-strings-form";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-strings-textarea";
    input.name = "webtoolsStringsInput";
    input.value = webtoolsStringsInput;

    const caseType = document.createElement("select");
    caseType.name = "webtoolsStringsCaseType";
    ["camel", "snake", "pascal", "kebab", "upper", "lower"].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      opt.selected = webtoolsStringsCaseType === v;
      caseType.appendChild(opt);
    });

    const count = document.createElement("input");
    count.type = "number";
    count.name = "webtoolsStringsCount";
    count.value = String(webtoolsStringsUuidCount);

    const convert = document.createElement("button");
    convert.type = "button";
    convert.className = "settings-btn settings-btn-primary";
    convert.textContent = "Convert";
    convert.addEventListener("click", () => {
      void executeWebtoolsStringsAction("convert", form);
    });

    const uuid = document.createElement("button");
    uuid.type = "button";
    uuid.className = "settings-btn settings-btn-secondary";
    uuid.textContent = "UUID";
    uuid.addEventListener("click", () => {
      void executeWebtoolsStringsAction("uuid", form);
    });

    form.append(input, caseType, count, convert, uuid);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);
  },

  applyWebtoolsColorsPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.color === "string") {
      webtoolsColorsInput = data.color;
    }
    webtoolsColorsHex = webtoolsColorsInput || "#6c5ce7";
    webtoolsColorsRgb = "";
    webtoolsColorsHsl = "";
    webtoolsColorsShades = [];
  },

  renderWebtoolsColorsPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-colors-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-colors-form webtools-colors-lab";

    const preview = document.createElement("div");
    preview.setAttribute("data-webtools-colors-preview", "1");
    const previewText = document.createElement("span");
    previewText.setAttribute("data-webtools-colors-preview-text", "1");
    preview.appendChild(previewText);

    const picker = document.createElement("input");
    picker.type = "color";
    picker.name = "webtoolsColorsPicker";

    const input = document.createElement("input");
    input.name = "webtoolsColorsInput";
    input.className = "settings-value";

    const hex = document.createElement("div");
    hex.setAttribute("data-webtools-colors-output", "hex");
    const rgb = document.createElement("div");
    rgb.setAttribute("data-webtools-colors-output", "rgb");
    const hsl = document.createElement("div");
    hsl.setAttribute("data-webtools-colors-output", "hsl");

    const shades = document.createElement("div");
    shades.setAttribute("data-webtools-colors-shades", "1");

    picker.addEventListener("input", () => {
      input.value = picker.value;
      void executeWebtoolsColorsConvert(picker.value, { render: false, form });
    });
    input.addEventListener("input", () => {
      scheduleWebtoolsColorsAutoConvert(form, input.value);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsColorsConvert(input.value, { render: false, form });
    });

    form.append(preview, picker, input, hex, rgb, hsl, shades);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsColorsPanelInForm(form);
    scheduleWebtoolsColorsAutoConvert(form, input.value || webtoolsColorsHex, true);
  },

  applyWebtoolsQrcodePanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    webtoolsQrText = data && typeof data.text === "string" ? data.text : "LiteLauncher QR";
    webtoolsQrSize = data && typeof data.size === "number" ? data.size : 300;
    webtoolsQrLevel = data && typeof data.level === "string" ? data.level : "M";
    webtoolsQrDarkColor =
      data && typeof data.darkColor === "string"
        ? normalizeWebtoolsQrcodeColor(data.darkColor, "#102136")
        : "#102136";
    webtoolsQrLightColor =
      data && typeof data.lightColor === "string"
        ? normalizeWebtoolsQrcodeColor(data.lightColor, "#ffffff")
        : "#ffffff";
    webtoolsQrLogoMode =
      data && typeof data.logoMode === "string"
        ? data.logoMode === "text" || data.logoMode === "image"
          ? data.logoMode
          : "none"
        : "none";
    webtoolsQrLogoText = data && typeof data.logoText === "string" ? data.logoText : "";
    webtoolsQrLogoImageDataUrl =
      data && typeof data.logoImageDataUrl === "string" ? data.logoImageDataUrl : "";
    webtoolsQrLogoImageName = "";
    webtoolsQrUrl = "";
    webtoolsQrInfo = "";
  },

  renderWebtoolsQrcodePanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-qrcode-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-qrcode-form";

    const title = document.createElement("h3");
    title.className = "webtools-qrcode-title";
    title.textContent = activePluginPanel?.title || "二维码生成";

    const info = document.createElement("div");
    info.className = "webtools-qrcode-info";

    const text = document.createElement("textarea");
    text.className = "settings-value webtools-textarea webtools-qrcode-textarea";
    text.name = "webtoolsQrText";
    text.value = webtoolsQrText;

    const size = document.createElement("input");
    size.type = "number";
    size.name = "webtoolsQrSize";
    size.value = String(webtoolsQrSize);

    const level = document.createElement("select");
    level.name = "webtoolsQrLevel";
    ["L", "M", "Q", "H"].forEach((v) => {
      const opt = document.createElement("option");
      opt.value = v;
      opt.textContent = v;
      opt.selected = webtoolsQrLevel === v;
      level.appendChild(opt);
    });

    const dark = document.createElement("input");
    dark.type = "color";
    dark.name = "webtoolsQrDarkColor";
    dark.value = webtoolsQrDarkColor;

    const darkValue = document.createElement("span");
    darkValue.setAttribute("data-webtools-qrcode-dark-value", "1");

    const light = document.createElement("input");
    light.type = "color";
    light.name = "webtoolsQrLightColor";
    light.value = webtoolsQrLightColor;

    const lightValue = document.createElement("span");
    lightValue.setAttribute("data-webtools-qrcode-light-value", "1");

    const logoMeta = document.createElement("span");
    logoMeta.className = "webtools-qrcode-logo-meta";
    logoMeta.setAttribute("data-webtools-qrcode-logo-meta", "1");

    const logoMode = document.createElement("select");
    logoMode.name = "webtoolsQrLogoMode";
    [
      ["none", "No Logo"],
      ["text", "Text Logo"],
      ["image", "Image Logo"]
    ].forEach(([value, label]) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = label;
      opt.selected = webtoolsQrLogoMode === value;
      logoMode.appendChild(opt);
    });

    const logoTextField = document.createElement("div");
    logoTextField.setAttribute("data-webtools-qrcode-logo-text-field", "1");
    const logoText = document.createElement("input");
    logoText.name = "webtoolsQrLogoText";
    logoText.value = webtoolsQrLogoText;
    logoTextField.appendChild(logoText);

    const logoImageField = document.createElement("div");
    logoImageField.setAttribute("data-webtools-qrcode-logo-image-field", "1");
    const logoImageName = document.createElement("span");
    logoImageName.className = "webtools-qrcode-logo-image-name";
    logoImageName.setAttribute("data-webtools-qrcode-logo-image-name", "1");
    logoImageField.appendChild(logoImageName);

    const clearLogo = document.createElement("button");
    clearLogo.type = "button";
    clearLogo.className = "settings-btn settings-btn-secondary";
    clearLogo.setAttribute("data-webtools-qrcode-clear-logo", "1");
    clearLogo.textContent = "Clear Logo";
    clearLogo.addEventListener("click", () => {
      if (webtoolsQrLogoMode === "text") {
        webtoolsQrLogoText = "";
        logoText.value = "";
      } else if (webtoolsQrLogoMode === "image") {
        webtoolsQrLogoImageDataUrl = "";
        webtoolsQrLogoImageName = "";
      }
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    const download = document.createElement("button");
    download.type = "button";
    download.className = "settings-btn settings-btn-primary webtools-qrcode-download-btn";
    download.setAttribute("data-webtools-qrcode-download", "1");
    download.textContent = "Download PNG";
    download.addEventListener("click", async () => {
      beginPluginNativeInteraction(1500);
      try {
        await downloadWebtoolsQrcodePng();
        setStatus("QR downloaded");
      } catch (error) {
        const reason = error instanceof Error ? error.message : "Download failed";
        setStatus(reason);
      } finally {
        schedulePluginNativeInteractionRelease();
      }
    });

    const previewHost = document.createElement("div");
    previewHost.className = "webtools-qrcode-preview-host";
    previewHost.setAttribute("data-webtools-qrcode-preview", "1");

    [text, size, level].forEach((node) => {
      node.addEventListener("input", () => {
        scheduleWebtoolsQrcodeAutoGenerate(form);
      });
      node.addEventListener("change", () => {
        scheduleWebtoolsQrcodeAutoGenerate(form, true);
      });
    });

    dark.addEventListener("input", () => {
      webtoolsQrDarkColor = normalizeWebtoolsQrcodeColor(dark.value, "#102136");
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    light.addEventListener("input", () => {
      webtoolsQrLightColor = normalizeWebtoolsQrcodeColor(light.value, "#ffffff");
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    logoMode.addEventListener("change", () => {
      webtoolsQrLogoMode =
        logoMode.value === "text" || logoMode.value === "image" ? logoMode.value : "none";
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form, true);
    });

    logoText.addEventListener("input", () => {
      webtoolsQrLogoText = logoText.value.trim().slice(0, 6);
      refreshWebtoolsQrcodePanelInForm(form);
      scheduleWebtoolsQrcodeAutoGenerate(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsQrcodeGenerateInForm(form);
    });

    form.append(
      title,
      info,
      text,
      size,
      level,
      dark,
      darkValue,
      light,
      lightValue,
      logoMeta,
      logoMode,
      logoTextField,
      logoImageField,
      clearLogo,
      download,
      previewHost
    );
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsQrcodePanelInForm(form);
    scheduleWebtoolsQrcodeAutoGenerate(form, true);
  },

  applyWebtoolsUaPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.ua === "string") {
      webtoolsUaInput = data.ua;
    } else {
      webtoolsUaInput = navigator.userAgent;
    }
    webtoolsUaResult = {};
    webtoolsUaInfo = "";
    webtoolsUaError = "";
  },

  renderWebtoolsUaPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-ua-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-ua-form";

    const input = document.createElement("textarea");
    input.className = "settings-value webtools-textarea webtools-ua-input";
    input.name = "webtoolsUaInput";
    input.value = webtoolsUaInput || navigator.userAgent;

    const info = document.createElement("div");
    info.className = "webtools-ua-info";

    const grid = document.createElement("div");
    grid.className = "webtools-ua-grid";

    const copy = document.createElement("button");
    copy.type = "button";
    copy.className = "settings-btn settings-btn-primary";
    copy.textContent = "Copy";
    copy.setAttribute("data-webtools-ua-copy", "1");

    const current = document.createElement("button");
    current.type = "button";
    current.className = "settings-btn settings-btn-secondary";
    current.textContent = "Current UA";

    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "settings-btn settings-btn-secondary";
    clear.textContent = "Clear";

    current.addEventListener("click", () => {
      input.value = navigator.userAgent;
      scheduleWebtoolsUaAutoParse(form, true);
    });

    clear.addEventListener("click", () => {
      if (webtoolsUaAutoTimer !== null) {
        window.clearTimeout(webtoolsUaAutoTimer);
        webtoolsUaAutoTimer = null;
      }
      webtoolsUaRequestToken += 1;
      webtoolsUaInput = "";
      webtoolsUaResult = {};
      webtoolsUaInfo = "";
      webtoolsUaError = "";
      input.value = "";
      refreshWebtoolsUaResultInForm(form);
      setStatus("Cleared UA input");
    });

    copy.addEventListener("click", async () => {
      const value = input.value.trim();
      if (!value) {
        setStatus("No UA to copy");
        return;
      }
      await navigator.clipboard.writeText(value);
      setStatus("Copied UA");
    });

    input.addEventListener("input", () => {
      webtoolsUaInput = input.value;
      scheduleWebtoolsUaAutoParse(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsUaParse(input.value);
    });

    form.append(current, clear, copy, input, info, grid);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsUaResultInForm(form);
    scheduleWebtoolsUaAutoParse(form, true);
  },

  applyWebtoolsApiPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (data && typeof data.method === "string") {
      webtoolsApiMethod = data.method;
    }
    if (data && typeof data.url === "string") {
      webtoolsApiUrl = data.url;
    }
    if (data && typeof data.bodyType === "string") {
      webtoolsApiBodyType =
        data.bodyType === "text" || data.bodyType === "formdata" ? data.bodyType : "json";
    }
    if (data && typeof data.bodyContent === "string") {
      webtoolsApiBodyContent = data.bodyContent;
    }

    webtoolsApiParams = normalizeWebtoolsApiRows(data?.params);
    webtoolsApiHeaders = normalizeWebtoolsApiRows(data?.headers, [
      { key: "Content-Type", value: "application/json", enabled: true },
      { key: "", value: "", enabled: true }
    ]);
    webtoolsApiFormRows = normalizeWebtoolsApiRows(data?.formRows);
    syncWebtoolsApiContentTypeHeader();

    webtoolsApiResponseStatus = "";
    webtoolsApiResponseBody = "";
    webtoolsApiResponseHeaders = {};
    webtoolsApiResponseTimeMs = 0;
    webtoolsApiResponseSizeText = "";
    webtoolsApiResponseUrl = "";
    webtoolsApiResponseError = "";
    webtoolsApiHasResponse = false;
    webtoolsApiIsLoading = false;
  },

  renderWebtoolsApiPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel webtools-api-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-api-form webtools-tool-panel";

    const title = document.createElement("h3");
    title.className = "webtools-tool-title";
    title.textContent = activePluginPanel?.title || "API 调试";

    const method = document.createElement("select");
    method.className = "settings-value webtools-tool-select webtools-api-method";
    method.name = "webtoolsApiMethod";
    ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"].forEach((m) => {
      const opt = document.createElement("option");
      opt.value = m;
      opt.textContent = m;
      opt.selected = webtoolsApiMethod === m;
      method.appendChild(opt);
    });

    const url = document.createElement("input");
    url.className = "settings-value webtools-tool-input webtools-api-url";
    url.name = "webtoolsApiUrl";
    url.value = webtoolsApiUrl;

    const preview = document.createElement("div");
    preview.className = "webtools-api-preview webtools-tool-code";

    const requestTabs = document.createElement("div");
    requestTabs.className = "webtools-api-tabs";
    [
      ["params", "参数"],
      ["headers", "请求头"],
      ["body", "请求体"]
    ].forEach(([id, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "webtools-api-tab";
      btn.setAttribute("data-api-request-tab", id);
      btn.textContent = label;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        webtoolsApiRequestTab = id as "params" | "headers" | "body";
        refreshWebtoolsApiTabs(form);
      });
      requestTabs.appendChild(btn);
    });

    const requestPanels = document.createElement("div");
    requestPanels.className = "webtools-api-panels";
    const paramsPanel = document.createElement("div");
    paramsPanel.className = "webtools-api-panel-card";
    paramsPanel.setAttribute("data-api-request-panel", "params");
    paramsPanel.appendChild(createWebtoolsApiRowsEditor(form, "params"));

    const headersPanel = document.createElement("div");
    headersPanel.className = "webtools-api-panel-card";
    headersPanel.setAttribute("data-api-request-panel", "headers");
    headersPanel.appendChild(createWebtoolsApiRowsEditor(form, "headers"));

    const bodyPanel = document.createElement("div");
    bodyPanel.className = "webtools-api-panel-card";
    bodyPanel.setAttribute("data-api-request-panel", "body");
    const bodyTypes = document.createElement("div");
    bodyTypes.className = "webtools-api-body-types";
    [
      ["json", "JSON"],
      ["text", "纯文本"],
      ["formdata", "FormData"]
    ].forEach(([value, label]) => {
      const radio = document.createElement("input");
      radio.type = "radio";
      radio.name = "webtoolsApiBodyTypeDisplay";
      radio.value = value;
      radio.checked = webtoolsApiBodyType === value;
      radio.addEventListener("change", () => {
        if (!radio.checked) {
          return;
        }
        webtoolsApiBodyType = value as "json" | "text" | "formdata";
        syncWebtoolsApiContentTypeHeader();
        renderList();
      });
      const text = document.createElement("span");
      text.textContent = label;
      bodyTypes.append(radio, text);
    });

    const bodyTypeInput = document.createElement("input");
    bodyTypeInput.type = "hidden";
    bodyTypeInput.name = "webtoolsApiBodyType";
    bodyTypeInput.value = webtoolsApiBodyType;

    bodyPanel.append(bodyTypeInput, bodyTypes);
    if (webtoolsApiBodyType === "formdata") {
      bodyPanel.appendChild(createWebtoolsApiRowsEditor(form, "formdata"));
    } else {
      const body = document.createElement("textarea");
      body.className = "settings-value webtools-textarea webtools-api-body";
      body.name = "webtoolsApiBody";
      body.value = webtoolsApiBodyContent;
      body.addEventListener("input", () => {
        webtoolsApiBodyContent = body.value;
      });
      bodyPanel.appendChild(body);
    }

    requestPanels.append(paramsPanel, headersPanel, bodyPanel);

    const send = document.createElement("button");
    send.type = "submit";
    send.className = "settings-btn settings-btn-primary webtools-api-send-btn";
    send.textContent = "发送";

    const responseSection = document.createElement("section");
    responseSection.className = "webtools-api-response-section";
    const status = document.createElement("div");
    status.className = "webtools-api-status";
    const time = document.createElement("span");
    time.className = "webtools-api-time";
    const size = document.createElement("span");
    size.className = "webtools-api-size";
    const err = document.createElement("div");
    err.className = "webtools-api-error";
    const responseUrl = document.createElement("div");
    responseUrl.className = "webtools-api-response-url webtools-tool-code";
    const responseTabs = document.createElement("div");
    responseTabs.className = "webtools-api-tabs webtools-api-response-tabs";

    [
      ["body", "响应体"],
      ["headers", "响应头"]
    ].forEach(([id, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "webtools-api-tab";
      btn.setAttribute("data-api-response-tab", id);
      btn.textContent = label;
      btn.addEventListener("click", (event) => {
        event.preventDefault();
        webtoolsApiResponseTab = id as "body" | "headers";
        refreshWebtoolsApiTabs(form);
        refreshWebtoolsApiResponseInForm(form);
      });
      responseTabs.appendChild(btn);
    });

    const responsePanels = document.createElement("div");
    responsePanels.className = "webtools-api-panels webtools-api-response-panels";
    const responseBodyPanel = document.createElement("div");
    responseBodyPanel.className = "webtools-api-panel-card";
    responseBodyPanel.setAttribute("data-api-response-panel", "body");
    const responseBody = document.createElement("pre");
    responseBody.className = "webtools-api-response-body webtools-tool-code";
    responseBodyPanel.appendChild(responseBody);

    const responseHeadersPanel = document.createElement("div");
    responseHeadersPanel.className = "webtools-api-panel-card";
    responseHeadersPanel.setAttribute("data-api-response-panel", "headers");
    const responseHeadersHost = document.createElement("div");
    responseHeadersHost.className = "webtools-api-response-headers-host";
    responseHeadersPanel.appendChild(responseHeadersHost);

    responsePanels.append(responseBodyPanel, responseHeadersPanel);
    responseSection.append(status, time, size, err, responseUrl, responseTabs, responsePanels);

    method.addEventListener("change", () => {
      webtoolsApiMethod = method.value;
      refreshWebtoolsApiMethodUi(form);
    });
    url.addEventListener("input", () => {
      webtoolsApiUrl = url.value;
      refreshWebtoolsApiPreview(form);
    });

    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsApiRequest(form, { render: false });
    });

    form.append(title, method, url, send, preview, requestTabs, requestPanels, responseSection);
    panel.appendChild(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsApiResponseInForm(form);
  },

  applyWebtoolsHttpMockPanelPayload(panel: ActivePluginPanelState): void {
    const data = panel.data;
    if (!data) {
      return;
    }

    if (typeof data.running === "boolean") {
      webtoolsHttpMockRunning = data.running;
    }
    if (typeof data.url === "string") {
      webtoolsHttpMockUrl = data.url;
    }
    if (typeof data.port === "number" && Number.isFinite(data.port)) {
      webtoolsHttpMockPort = Math.min(65535, Math.max(1024, Math.floor(data.port)));
    }
    if (typeof data.path === "string") {
      webtoolsHttpMockPath = normalizeWebtoolsHttpMockPath(data.path);
    }
    if (typeof data.method === "string") {
      webtoolsHttpMockMethod = normalizeWebtoolsHttpMockMethod(data.method);
    }
    if (typeof data.statusCode === "number" && Number.isFinite(data.statusCode)) {
      webtoolsHttpMockStatusCode = Math.min(599, Math.max(100, Math.floor(data.statusCode)));
    }
    if (typeof data.contentType === "string" && data.contentType.trim()) {
      webtoolsHttpMockContentType = data.contentType;
    }
    if (typeof data.body === "string") {
      webtoolsHttpMockBody = data.body;
    }
    if (typeof data.requestCount === "number" && Number.isFinite(data.requestCount)) {
      webtoolsHttpMockRequestCount = Math.max(0, Math.floor(data.requestCount));
    }
    webtoolsHttpMockInfo = panel.message || "";
    webtoolsHttpMockError = "";
  },

  renderWebtoolsHttpMockPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const form = document.createElement("form");
    form.className = "settings-form webtools-http-mock-form webtools-tool-panel";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      void executeWebtoolsHttpMockAction("start", form);
    });

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "HTTP Mock Server";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "本地临时接口模拟（MVP 第二阶段）";

    const row = document.createElement("div");
    row.className = "webtools-url-parts-grid";

    const methodField = document.createElement("label");
    methodField.className = "webtools-url-part";
    const methodLabel = document.createElement("div");
    methodLabel.className = "webtools-url-part-label";
    methodLabel.textContent = "方法";
    const methodSelect = document.createElement("select");
    methodSelect.className = "settings-number webtools-tool-input";
    methodSelect.name = "webtoolsHttpMockMethod";
    ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"].forEach((value) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      methodSelect.appendChild(option);
    });
    methodField.append(methodLabel, methodSelect);

    const portField = document.createElement("label");
    portField.className = "webtools-url-part";
    const portLabel = document.createElement("div");
    portLabel.className = "webtools-url-part-label";
    portLabel.textContent = "端口";
    const portInput = document.createElement("input");
    portInput.className = "settings-value webtools-tool-input";
    portInput.name = "webtoolsHttpMockPort";
    portInput.type = "number";
    portField.append(portLabel, portInput);

    const pathField = document.createElement("label");
    pathField.className = "webtools-url-part webtools-url-part-full";
    const pathLabel = document.createElement("div");
    pathLabel.className = "webtools-url-part-label";
    pathLabel.textContent = "路径";
    const pathInput = document.createElement("input");
    pathInput.className = "settings-value webtools-tool-input";
    pathInput.name = "webtoolsHttpMockPath";
    pathInput.type = "text";
    pathField.append(pathLabel, pathInput);

    const statusField = document.createElement("label");
    statusField.className = "webtools-url-part";
    const statusLabel = document.createElement("div");
    statusLabel.className = "webtools-url-part-label";
    statusLabel.textContent = "状态码";
    const statusInput = document.createElement("input");
    statusInput.className = "settings-value webtools-tool-input";
    statusInput.name = "webtoolsHttpMockStatusCode";
    statusInput.type = "number";
    statusField.append(statusLabel, statusInput);

    const contentTypeField = document.createElement("label");
    contentTypeField.className = "webtools-url-part webtools-url-part-full";
    const contentTypeLabel = document.createElement("div");
    contentTypeLabel.className = "webtools-url-part-label";
    contentTypeLabel.textContent = "Content-Type";
    const contentTypeInput = document.createElement("input");
    contentTypeInput.className = "settings-value webtools-tool-input";
    contentTypeInput.name = "webtoolsHttpMockContentType";
    contentTypeInput.type = "text";
    contentTypeField.append(contentTypeLabel, contentTypeInput);

    row.append(methodField, portField, pathField, statusField, contentTypeField);

    const bodyField = document.createElement("label");
    bodyField.className = "webtools-tool-pane";
    const bodyLabel = document.createElement("div");
    bodyLabel.className = "webtools-tool-pane-title";
    bodyLabel.textContent = "响应 Body";
    const bodyInput = document.createElement("textarea");
    bodyInput.className = "settings-value webtools-textarea";
    bodyInput.name = "webtoolsHttpMockBody";
    bodyInput.spellcheck = false;
    bodyField.append(bodyLabel, bodyInput);

    const runtime = document.createElement("div");
    runtime.className = "webtools-tool-info webtools-http-mock-runtime";

    const count = document.createElement("div");
    count.className = "webtools-tool-info webtools-http-mock-count";

    const info = document.createElement("div");
    info.className = "webtools-tool-info webtools-http-mock-info";

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const startButton = document.createElement("button");
    startButton.type = "button";
    startButton.className = "settings-btn settings-btn-primary";
    startButton.textContent = "启动";
    startButton.setAttribute("data-webtools-http-mock-start", "1");
    startButton.addEventListener("click", () => {
      void executeWebtoolsHttpMockAction("start", form);
    });

    const statusButton = document.createElement("button");
    statusButton.type = "button";
    statusButton.className = "settings-btn settings-btn-secondary";
    statusButton.textContent = "刷新状态";
    statusButton.setAttribute("data-webtools-http-mock-status", "1");
    statusButton.addEventListener("click", () => {
      void executeWebtoolsHttpMockAction("status", form);
    });

    const stopButton = document.createElement("button");
    stopButton.type = "button";
    stopButton.className = "settings-btn settings-btn-secondary";
    stopButton.textContent = "停止";
    stopButton.setAttribute("data-webtools-http-mock-stop", "1");
    stopButton.addEventListener("click", () => {
      void executeWebtoolsHttpMockAction("stop", form);
    });

    const backButton = document.createElement("button");
    backButton.type = "button";
    backButton.className = "settings-btn settings-btn-secondary";
    backButton.textContent = "返回搜索";
    backButton.addEventListener("click", () => {
      backToSearch();
    });

    actions.append(startButton, statusButton, stopButton, backButton);

    form.append(title, description, row, bodyField, runtime, count, info, actions);
    panel.append(form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    refreshWebtoolsHttpMockPanelInForm(form);
  },

  applyWebtoolsCronPanelPayload(panel: ActivePluginPanelState): void {
    if (panel.data && typeof panel.data.expression === "string") {
      webtoolsCronExpression = panel.data.expression;
    }
    webtoolsCronReadable = "";
    webtoolsCronNextRun = "";
    webtoolsCronUpcoming = [];
  },

  renderWebtoolsCronPanel(): void {
    const panelItem = document.createElement("li");
    panelItem.className = "settings-panel-item";

    const panel = document.createElement("section");
    panel.className = "settings-panel";

    const title = document.createElement("h3");
    title.className = "settings-title";
    title.textContent = activePluginPanel?.title || "Cron 生成器";

    const description = document.createElement("p");
    description.className = "settings-description";
    description.textContent =
      activePluginPanel?.subtitle || "定时表达式解析与执行时间预测。";

    const cronPartValues = getWebtoolsCronPartValues(webtoolsCronExpression);

    const form = document.createElement("form");
    form.className = "settings-form webtools-cron-form";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      const node = form.elements.namedItem("webtoolsCronExpression");
      const expression = node instanceof HTMLInputElement ? node.value : "";
      void executeWebtoolsCronAction("parse", expression, {
        render: false,
        form
      });
    });

    const expressionRow = document.createElement("label");
    expressionRow.className = "settings-row webtools-row-full";
    const expressionLabel = document.createElement("span");
    expressionLabel.className = "settings-row-label";
    expressionLabel.textContent = "Cron 表达式";
    const expressionInput = document.createElement("input");
    expressionInput.className = "settings-value";
    expressionInput.name = "webtoolsCronExpression";
    expressionInput.value = webtoolsCronExpression;
    expressionInput.placeholder = "例如: 5 4 * * *";
    expressionInput.addEventListener("input", () => {
      scheduleWebtoolsCronAutoParse(form);
    });
    expressionInput.addEventListener("change", () => {
      scheduleWebtoolsCronAutoParse(form, true);
    });
    const expressionHint = document.createElement("span");
    expressionHint.className = "settings-row-hint";
    expressionHint.textContent = "格式: 分 时 日 月 周";
    expressionRow.append(expressionLabel, expressionInput, expressionHint);

    const readableRow = document.createElement("div");
    readableRow.className = "settings-row webtools-row-full";
    const readableLabel = document.createElement("span");
    readableLabel.className = "settings-row-label";
    readableLabel.textContent = "可读描述";
    const readableValue = document.createElement("div");
    readableValue.className = "settings-value settings-wrap webtools-cron-readable";
    readableValue.textContent = webtoolsCronReadable || "-";
    const readableHint = document.createElement("span");
    readableHint.className = "settings-row-hint webtools-cron-next";
    readableHint.textContent = webtoolsCronNextRun
      ? `下一次: ${webtoolsCronNextRun}`
      : "-";
    readableRow.append(readableLabel, readableValue, readableHint);

    const partsWrap = document.createElement("div");
    partsWrap.className = "webtools-mini-table-wrap";
    const partsTable = document.createElement("table");
    partsTable.className = "webtools-mini-table";
    const partsHead = document.createElement("thead");
    const partsHeadRow = document.createElement("tr");
    ["分", "时", "日", "月", "周"].forEach((name) => {
      const th = document.createElement("th");
      th.textContent = name;
      partsHeadRow.appendChild(th);
    });
    partsHead.appendChild(partsHeadRow);
    const partsBody = document.createElement("tbody");
    const partsBodyRow = document.createElement("tr");
    cronPartValues.forEach((value) => {
      const td = document.createElement("td");
      td.className = "webtools-cron-part-cell";
      td.textContent = value;
      partsBodyRow.appendChild(td);
    });
    partsBody.appendChild(partsBodyRow);
    partsTable.append(partsHead, partsBody);
    partsWrap.appendChild(partsTable);

    const syntaxWrap = document.createElement("div");
    syntaxWrap.className = "webtools-mini-table-wrap";
    const syntaxTable = document.createElement("table");
    syntaxTable.className = "webtools-mini-table";
    const syntaxBody = document.createElement("tbody");
    [
      ["*", "任意值"],
      [",", "列表分隔符"],
      ["-", "数值范围"],
      ["/", "步进值"]
    ].forEach(([symbol, meaning]) => {
      const row = document.createElement("tr");
      const symbolCell = document.createElement("td");
      symbolCell.textContent = symbol;
      const meaningCell = document.createElement("td");
      meaningCell.textContent = meaning;
      row.append(symbolCell, meaningCell);
      syntaxBody.appendChild(row);
    });
    syntaxTable.appendChild(syntaxBody);
    syntaxWrap.appendChild(syntaxTable);

    const actions = document.createElement("div");
    actions.className = "settings-actions";

    const randomButton = document.createElement("button");
    randomButton.type = "button";
    randomButton.className = "settings-btn settings-btn-secondary";
    randomButton.textContent = "随机生成";
    randomButton.addEventListener("click", () => {
      const node = form.elements.namedItem("webtoolsCronExpression");
      const expression = node instanceof HTMLInputElement ? node.value : "";
      void executeWebtoolsCronAction("random", expression, {
        render: false,
        form
      });
    });

    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "settings-btn settings-btn-secondary";
    copyButton.textContent = "复制";
    copyButton.addEventListener("click", () => {
      void (async () => {
        const copied = await copyTextToClipboard(expressionInput.value);
        setStatus(copied ? "已复制 Cron 表达式" : "复制失败");
      })();
    });

    actions.append(randomButton, copyButton);
    form.append(expressionRow, readableRow, partsWrap, syntaxWrap, actions);

    const listWrap = document.createElement("div");
    listWrap.className = "settings-row webtools-row-full";
    const listLabel = document.createElement("span");
    listLabel.className = "settings-row-label";
    listLabel.textContent = "未来 7 次执行";
    const listValue = document.createElement("div");
    listValue.className = "settings-value settings-wrap webtools-cron-upcoming-value";
    listValue.textContent =
      webtoolsCronUpcoming.length > 0 ? webtoolsCronUpcoming.join("\n") : "-";
    listValue.style.whiteSpace = "pre-line";
    listWrap.append(listLabel, listValue);
    form.appendChild(listWrap);

    panel.append(title, description, form);
    panelItem.appendChild(panel);
    list.appendChild(panelItem);

    scheduleWebtoolsCronAutoParse(form, true);
  }
};
