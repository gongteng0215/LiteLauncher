namespace RendererPanelRuntime {

  export function formatHardwareInspectorBytes(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return "未知";
    }

    const units = ["B", "KB", "MB", "GB", "TB"];
    let size = value;
    let index = 0;
    while (size >= 1024 && index < units.length - 1) {
      size /= 1024;
      index += 1;
    }

    const digits = size >= 100 ? 0 : size >= 10 ? 1 : 2;
    return `${size.toFixed(digits)} ${units[index]}`;
  }

  export function formatHardwareInspectorGpuMemory(gpu: HardwareInspectorGpu): string {
    if (gpu.adapterRamSource === "wmi-uint32-limited") {
      return "无法准确读取（旧接口 4 GB 上限）";
    }
    return formatHardwareInspectorBytes(gpu.adapterRam);
  }

  export function formatHardwareInspectorGpuMemorySource(gpu: HardwareInspectorGpu): string {
    switch (gpu.adapterRamSource) {
      case "registry-qword":
        return "Windows 驱动 64 位数据";
      case "nvidia-smi":
        return "NVIDIA 驱动";
      case "wmi-uint32":
        return "Windows WMI 兼容值";
      case "wmi-uint32-limited":
        return "Windows WMI 32 位字段（已忽略截断值）";
      default:
        return "不可用";
    }
  }

  export function formatHardwareInspectorClockMhz(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return "未知";
    }
    if (value >= 1000) {
      return `${(value / 1000).toFixed(2)} GHz`;
    }
    return `${value} MHz`;
  }

  export function formatHardwareInspectorRpm(value: number | null | undefined): string {
    if (
      typeof value !== "number" ||
      !Number.isFinite(value) ||
      value <= 0 ||
      value >= 4294967295
    ) {
      return "未知";
    }

    return `${Math.round(value)} RPM`;
  }

  export function formatHardwareInspectorDate(value: string | null | undefined): string {
    if (!value) {
      return "未知";
    }

    const trimmed = value.trim();
    const dotNetMatch = trimmed.match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
    if (dotNetMatch) {
      const timestamp = Number(dotNetMatch[1]);
      if (Number.isFinite(timestamp)) {
        return new Date(timestamp).toLocaleString("zh-CN", {
          hour12: false
        });
      }
    }

    const dmtfMatch = trimmed.match(
      /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(?:\.(\d+))?(?:([+-])(\d{3}))?$/
    );
    if (dmtfMatch) {
      const [, year, month, day, hour, minute, second] = dmtfMatch;
      const parsedDmtf = new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second)
      );
      if (!Number.isNaN(parsedDmtf.getTime())) {
        return parsedDmtf.toLocaleString("zh-CN", {
          hour12: false
        });
      }
    }

    const parsed = new Date(trimmed);
    if (Number.isNaN(parsed.getTime())) {
      return trimmed;
    }

    return parsed.toLocaleString("zh-CN", {
      hour12: false
    });
  }

  export function formatHardwareInspectorBoolean(value: boolean | null | undefined): string {
    if (typeof value !== "boolean") {
      return "未知";
    }
    return value ? "支持" : "不支持";
  }

  export function formatHardwareInspectorNullableBoolean(
    value: boolean | null | undefined,
    trueText: string,
    falseText: string
  ): string {
    if (typeof value !== "boolean") {
      return "未知";
    }

    return value ? trueText : falseText;
  }

  export function formatHardwareInspectorText(value: string | null | undefined): string {
    return value && value.trim() ? value.trim() : "未知";
  }

  export function formatHardwareInspectorSectorSize(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return "未知";
    }

    return `${value} B`;
  }

  export function formatHardwareInspectorTemperature(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      return "不可用";
    }

    return `${value} °C`;
  }

  export function formatHardwareInspectorPercentage(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return "不可用";
    }

    return `${value}%`;
  }

  export function formatHardwareInspectorHours(value: number | null | undefined): string {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
      return "不可用";
    }

    return `${value} 小时`;
  }

  export function isHardwareInspectorDiskAtRisk(disk: HardwareInspectorDisk): boolean {
    const health = formatHardwareInspectorText(disk.healthStatus);
    const operational = formatHardwareInspectorText(disk.operationalStatus);
    return (
      disk.smartPredictFailure === true ||
      health.includes("警告") ||
      health.includes("故障") ||
      operational.includes("预测故障") ||
      operational.includes("错误") ||
      operational.includes("降级")
    );
  }

  export function countHardwareInspectorRiskDisks(snapshot: HardwareInspectorSnapshot): number {
    return snapshot.disks.filter((disk) => isHardwareInspectorDiskAtRisk(disk)).length;
  }

  export function getHardwareInspectorCpuKey(cpu: HardwareInspectorCpu, index: number): string {
    return cpu.processorId || cpu.socketDesignation || cpu.name || `cpu-${index}`;
  }

  export function getHardwareInspectorMemoryKey(
    memory: HardwareInspectorMemoryModule,
    index: number
  ): string {
    return (
      memory.serialNumber ||
      memory.deviceLocator ||
      memory.bankLabel ||
      memory.partNumber ||
      `memory-${index}`
    );
  }

  export function getHardwareInspectorGpuKey(gpu: HardwareInspectorGpu, index: number): string {
    return gpu.pnpDeviceId || gpu.name || `gpu-${index}`;
  }

  export function getHardwareInspectorDiskKey(
    disk: HardwareInspectorDisk,
    index: number
  ): string {
    return (
      disk.deviceId ||
      disk.serialNumber ||
      [disk.model, String(index)].filter(Boolean).join("#") ||
      `disk-${index}`
    );
  }

  export type HardwareInspectorFieldSpec<T> = {
    label: string;
    get: (item: T) => unknown;
  };

  export type HardwareInspectorEntityEntry<T> = {
    item: T;
    index: number;
    name: string;
  };

  export function normalizeHardwareInspectorComparableValue(
    value: unknown
  ): string | number | boolean | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === "string") {
      const trimmed = value.trim();
      return trimmed || null;
    }

    if (typeof value === "number") {
      return Number.isFinite(value) ? value : null;
    }

    if (typeof value === "boolean") {
      return value;
    }

    return JSON.stringify(value);
  }

  export function areHardwareInspectorComparableValuesEqual(a: unknown, b: unknown): boolean {
    return (
      normalizeHardwareInspectorComparableValue(a) ===
      normalizeHardwareInspectorComparableValue(b)
    );
  }

  export function addHardwareInspectorChange(
    target: Record<string, string[]>,
    key: string,
    labels: string[]
  ): void {
    if (labels.length === 0) {
      return;
    }

    target[key] = labels;
  }

  export function collectHardwareInspectorObjectChanges<T>(
    previous: T,
    current: T,
    specs: HardwareInspectorFieldSpec<T>[]
  ): string[] {
    const labels: string[] = [];
    specs.forEach((spec) => {
      if (!areHardwareInspectorComparableValuesEqual(spec.get(previous), spec.get(current))) {
        labels.push(spec.label);
      }
    });
    return labels;
  }

  export function collectHardwareInspectorEntityChanges<T>(
    previousItems: T[],
    currentItems: T[],
    keyOf: (item: T, index: number) => string,
    nameOf: (item: T, index: number) => string,
    specs: HardwareInspectorFieldSpec<T>[],
    prefix: string
  ): { changes: Record<string, string[]>; summary: string[] } {
    const previousMap = new Map<string, HardwareInspectorEntityEntry<T>>();
    previousItems.forEach((item, index) => {
      previousMap.set(keyOf(item, index), {
        item,
        index,
        name: nameOf(item, index)
      });
    });

    const currentMap = new Map<string, HardwareInspectorEntityEntry<T>>();
    currentItems.forEach((item, index) => {
      currentMap.set(keyOf(item, index), {
        item,
        index,
        name: nameOf(item, index)
      });
    });

    const allKeys = new Set<string>([...previousMap.keys(), ...currentMap.keys()]);
    const changes: Record<string, string[]> = {};
    const summary: string[] = [];

    allKeys.forEach((key) => {
      const previousEntry = previousMap.get(key);
      const currentEntry = currentMap.get(key);
      const labels: string[] = [];
      const name = currentEntry?.name || previousEntry?.name || key;

      if (!previousEntry && currentEntry) {
        labels.push("新增");
      } else if (previousEntry && !currentEntry) {
        labels.push("移除");
      } else if (previousEntry && currentEntry) {
        labels.push(
          ...collectHardwareInspectorObjectChanges(
            previousEntry.item,
            currentEntry.item,
            specs
          )
        );
      }

      if (labels.length > 0) {
        addHardwareInspectorChange(changes, key, labels);
        summary.push(`${prefix}${name}：${labels.join("、")}`);
      }
    });

    return { changes, summary };
  }

  export function createHardwareInspectorInitialDiffState(
    snapshot: HardwareInspectorSnapshot
  ): HardwareInspectorDiffState {
    return {
      hasBaseline: false,
      hasChanges: false,
      summary: ["首次采集，下一次刷新将显示变化对比"],
      overviewChangedKeys: [],
      computerSystemChanges: [],
      operatingSystemChanges: [],
      baseBoardChanges: [],
      biosChanges: [],
      cpuChanges: {},
      memoryChanges: {},
      gpuChanges: {},
      diskChanges: {},
      previousCollectedAt: null,
      currentCollectedAt: snapshot.collectedAt
    };
  }

  export function buildHardwareInspectorDiffState(
    previous: HardwareInspectorSnapshot | null,
    current: HardwareInspectorSnapshot
  ): HardwareInspectorDiffState {
    if (!previous) {
      return createHardwareInspectorInitialDiffState(current);
    }

    const overviewChangedKeys = new Set<string>();
    const summary: string[] = [];

    const currentRiskDisks = countHardwareInspectorRiskDisks(current);
    const previousRiskDisks = countHardwareInspectorRiskDisks(previous);
    if (
      !areHardwareInspectorComparableValuesEqual(
        [previous.computerSystem.manufacturer, previous.computerSystem.model].join(" "),
        [current.computerSystem.manufacturer, current.computerSystem.model].join(" ")
      )
    ) {
      overviewChangedKeys.add("device");
      summary.push("设备信息已变化");
    }
    if (
      !areHardwareInspectorComparableValuesEqual(
        [previous.operatingSystem.caption, previous.operatingSystem.buildNumber].join(" / "),
        [current.operatingSystem.caption, current.operatingSystem.buildNumber].join(" / ")
      )
    ) {
      overviewChangedKeys.add("system");
      summary.push("系统版本已变化");
    }
    if (
      !areHardwareInspectorComparableValuesEqual(previous.cpus[0]?.name, current.cpus[0]?.name)
    ) {
      overviewChangedKeys.add("cpu");
      summary.push("CPU 摘要已变化");
    }
    if (
      !areHardwareInspectorComparableValuesEqual(
        previous.computerSystem.totalPhysicalMemory,
        current.computerSystem.totalPhysicalMemory
      )
    ) {
      overviewChangedKeys.add("totalMemory");
      summary.push("总内存已变化");
    }
    if (!areHardwareInspectorComparableValuesEqual(previous.gpus.length, current.gpus.length)) {
      overviewChangedKeys.add("gpuCount");
      summary.push(`显卡数量 ${previous.gpus.length} -> ${current.gpus.length}`);
    }
    if (!areHardwareInspectorComparableValuesEqual(previous.disks.length, current.disks.length)) {
      overviewChangedKeys.add("diskCount");
      summary.push(`磁盘数量 ${previous.disks.length} -> ${current.disks.length}`);
    }
    if (!areHardwareInspectorComparableValuesEqual(previousRiskDisks, currentRiskDisks)) {
      overviewChangedKeys.add("riskDiskCount");
      summary.push(`风险磁盘 ${previousRiskDisks} -> ${currentRiskDisks}`);
    }

    const computerSystemChanges = collectHardwareInspectorObjectChanges(
      previous.computerSystem,
      current.computerSystem,
      [
        { label: "厂商", get: (item) => item.manufacturer },
        { label: "型号", get: (item) => item.model },
        { label: "系统类型", get: (item) => item.systemType },
        { label: "总内存", get: (item) => item.totalPhysicalMemory }
      ]
    );
    if (computerSystemChanges.length > 0) {
      summary.push(`设备信息：${computerSystemChanges.join("、")}`);
    }

    const operatingSystemChanges = collectHardwareInspectorObjectChanges(
      previous.operatingSystem,
      current.operatingSystem,
      [
        { label: "系统名称", get: (item) => item.caption },
        { label: "版本", get: (item) => item.version },
        { label: "构建号", get: (item) => item.buildNumber },
        { label: "架构", get: (item) => item.architecture },
        { label: "启动时间", get: (item) => item.lastBootUpTime }
      ]
    );
    if (operatingSystemChanges.length > 0) {
      summary.push(`系统信息：${operatingSystemChanges.join("、")}`);
    }

    const baseBoardChanges = collectHardwareInspectorObjectChanges(
      previous.baseBoard,
      current.baseBoard,
      [
        { label: "厂商", get: (item) => item.manufacturer },
        { label: "型号", get: (item) => item.product },
        { label: "版本", get: (item) => item.version },
        { label: "序列号", get: (item) => item.serialNumber }
      ]
    );
    if (baseBoardChanges.length > 0) {
      summary.push(`主板信息：${baseBoardChanges.join("、")}`);
    }

    const biosChanges = collectHardwareInspectorObjectChanges(previous.bios, current.bios, [
      { label: "厂商", get: (item) => item.manufacturer },
      { label: "版本", get: (item) => item.smbiosBiosVersion || item.version },
      { label: "发布日期", get: (item) => item.releaseDate },
      { label: "序列号", get: (item) => item.serialNumber }
    ]);
    if (biosChanges.length > 0) {
      summary.push(`BIOS：${biosChanges.join("、")}`);
    }

    const cpuDiff = collectHardwareInspectorEntityChanges(
      previous.cpus,
      current.cpus,
      getHardwareInspectorCpuKey,
      (item, index) => item.name || `处理器 ${index + 1}`,
      [
        { label: "型号", get: (item) => item.name },
        { label: "厂商", get: (item) => item.manufacturer },
        { label: "插槽", get: (item) => item.socketDesignation },
        {
          label: "核心 / 线程",
          get: (item) => `${item.numberOfCores}/${item.numberOfLogicalProcessors}`
        },
        { label: "最大频率", get: (item) => item.maxClockSpeed },
        { label: "温度(可选)", get: (item) => item.temperatureCelsius },
        { label: "温度来源", get: (item) => item.temperatureSource },
        { label: "架构", get: (item) => item.architecture },
        { label: "虚拟化", get: (item) => item.virtualizationFirmwareEnabled },
        { label: "SLAT", get: (item) => item.secondLevelAddressTranslationExtensions }
      ],
      "CPU "
    );

    const memoryDiff = collectHardwareInspectorEntityChanges(
      previous.memoryModules,
      current.memoryModules,
      getHardwareInspectorMemoryKey,
      (item, index) => item.deviceLocator || item.bankLabel || `内存 ${index + 1}`,
      [
        { label: "容量", get: (item) => item.capacity },
        { label: "频率", get: (item) => item.configuredClockSpeed || item.speed },
        { label: "类型", get: (item) => item.memoryType },
        { label: "形态", get: (item) => item.formFactor },
        { label: "厂商", get: (item) => item.manufacturer },
        { label: "型号", get: (item) => item.partNumber },
        { label: "序列号", get: (item) => item.serialNumber }
      ],
      "内存 "
    );

    const gpuDiff = collectHardwareInspectorEntityChanges(
      previous.gpus,
      current.gpus,
      getHardwareInspectorGpuKey,
      (item, index) => item.name || `显卡 ${index + 1}`,
      [
        { label: "名称", get: (item) => item.name },
        { label: "厂商", get: (item) => item.manufacturer },
        { label: "显存", get: (item) => item.adapterRam },
        { label: "驱动版本", get: (item) => item.driverVersion },
        { label: "驱动日期", get: (item) => item.driverDate },
        { label: "视频处理器", get: (item) => item.videoProcessor },
        { label: "温度(可选)", get: (item) => item.temperatureCelsius },
        { label: "温度来源", get: (item) => item.temperatureSource },
        {
          label: "分辨率",
          get: (item) =>
            `${item.horizontalResolution ?? ""}x${item.verticalResolution ?? ""}@${item.refreshRate ?? ""}`
        },
        { label: "状态", get: (item) => item.status }
      ],
      "显卡 "
    );

    const diskDiff = collectHardwareInspectorEntityChanges(
      previous.disks,
      current.disks,
      getHardwareInspectorDiskKey,
      (item, index) => item.model || `磁盘 ${index + 1}`,
      [
        { label: "厂商", get: (item) => item.manufacturer },
        { label: "容量", get: (item) => item.size },
        { label: "媒体类型", get: (item) => item.storageMediaType || item.mediaType },
        { label: "总线", get: (item) => item.busType || item.interfaceType },
        { label: "固件", get: (item) => item.firmwareVersion || item.firmwareRevision },
        { label: "健康状态", get: (item) => item.healthStatus },
        { label: "运行状态", get: (item) => item.operationalStatus },
        { label: "预测故障", get: (item) => item.smartPredictFailure },
        { label: "预测原因", get: (item) => item.smartReason },
        { label: "逻辑扇区", get: (item) => item.logicalSectorSize },
        { label: "物理扇区", get: (item) => item.physicalSectorSize },
        { label: "温度", get: (item) => item.temperatureCelsius },
        { label: "最高温度", get: (item) => item.temperatureMaxCelsius },
        { label: "磨损", get: (item) => item.wearPercentage },
        { label: "通电时长", get: (item) => item.powerOnHours },
        { label: "槽位", get: (item) => item.slotNumber },
        { label: "机箱槽", get: (item) => item.enclosureNumber },
        { label: "用途", get: (item) => item.usage },
        { label: "可加入存储池", get: (item) => item.canPool },
        { label: "序列号", get: (item) => item.serialNumber },
        { label: "分区数", get: (item) => item.partitionCount }
      ],
      "磁盘 "
    );

    summary.push(...cpuDiff.summary, ...memoryDiff.summary, ...gpuDiff.summary, ...diskDiff.summary);

    const limitedSummary = summary.slice(0, 10);
    return {
      hasBaseline: true,
      hasChanges:
        overviewChangedKeys.size > 0 ||
        computerSystemChanges.length > 0 ||
        operatingSystemChanges.length > 0 ||
        baseBoardChanges.length > 0 ||
        biosChanges.length > 0 ||
        Object.keys(cpuDiff.changes).length > 0 ||
        Object.keys(memoryDiff.changes).length > 0 ||
        Object.keys(gpuDiff.changes).length > 0 ||
        Object.keys(diskDiff.changes).length > 0,
      summary: limitedSummary.length > 0 ? limitedSummary : ["与上次采集一致"],
      overviewChangedKeys: [...overviewChangedKeys],
      computerSystemChanges,
      operatingSystemChanges,
      baseBoardChanges,
      biosChanges,
      cpuChanges: cpuDiff.changes,
      memoryChanges: memoryDiff.changes,
      gpuChanges: gpuDiff.changes,
      diskChanges: diskDiff.changes,
      previousCollectedAt: previous.collectedAt,
      currentCollectedAt: current.collectedAt
    };
  }

  export function formatHardwareInspectorResolution(gpu: HardwareInspectorGpu): string {
    if (!gpu.horizontalResolution || !gpu.verticalResolution) {
      return "未提供（可能未直连显示器）";
    }

    const base = `${gpu.horizontalResolution} × ${gpu.verticalResolution}`;
    return gpu.refreshRate ? `${base} @ ${gpu.refreshRate}Hz` : base;
  }

  export function createHardwareInspectorSection(
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

  export function createHardwareInspectorCard(titleText: string): HTMLDivElement {
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

  export function createHardwareInspectorBadge(
    text: string,
    tone: "neutral" | "success" | "warning" | "danger" = "neutral"
  ): HTMLSpanElement {
    const badge = document.createElement("span");
    badge.className = "hardware-inspector-badge";
    badge.dataset.tone = tone;
    badge.textContent = text;
    return badge;
  }

  export function getHardwareInspectorTemperatureSourceTone(
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

  export function formatHardwareInspectorTemperatureSourceBadge(
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

  export function createHardwareInspectorTemperatureBadgeRow(
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

  export function countHardwareInspectorDiskVolumes(disk: HardwareInspectorDisk): number {
    return disk.partitions.reduce((count, partition) => count + partition.volumes.length, 0);
  }

  export function formatHardwareInspectorDriveType(value: number | null | undefined): string {
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

  export function addHardwareInspectorCardAction(
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

  export function addHardwareInspectorInlineAction(
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

  export async function copyHardwareInspectorDetail(
    title: string,
    lines: string[],
    successText: string
  ): Promise<void> {
    const content = [title, ...lines].join("\n").trim();
    const ok = await copyTextToClipboard(content);
    setStatus(ok ? successText : "复制失败");
  }

  export function createHardwareInspectorMetricItems(
    items: Array<{ label: string; value: string }>,
    changedLabels: readonly string[] = []
  ): Array<{ label: string; value: string; changed?: boolean }> {
    const changedSet = new Set(changedLabels);
    return items.map((item) => ({
      ...item,
      changed: changedSet.has(item.label)
    }));
  }

  export function applyHardwareInspectorCardChangeState(
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

  export function applyHardwareInspectorSnapshot(
    snapshot: HardwareInspectorSnapshot,
    infoText?: string,
    options?: { loadPreview?: boolean }
  ): void {
    hardwareInspectorSnapshot = snapshot;
    hardwareInspectorDiffState = buildHardwareInspectorDiffState(
      hardwareInspectorLastSnapshot,
      snapshot
    );
    hardwareInspectorLastSnapshot = snapshot;
    hardwareInspectorInfo =
      infoText && infoText.trim() ? infoText : buildHardwareInspectorSummaryText(snapshot);
    if (options?.loadPreview !== false) {
      void loadHardwareInspectorPreview(hardwareInspectorRequestToken);
    }
  }

  export async function loadHardwareInspectorPreview(requestToken: number): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher || !hardwareInspectorSnapshot) {
      return;
    }

    const previewToken = ++hardwareInspectorPreviewRequestToken;
    hardwareInspectorPreviewLoading = true;
    hardwareInspectorPreviewError = "";
    hardwareInspectorPreviewImageUrl = "";
    if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
      renderList();
    }

    const item: LaunchItem = {
      id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:preview-image`,
      type: "command",
      title: "硬件检测",
      subtitle: "生成硬件配置预览图",
      target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=preview-image`,
      keywords: ["plugin", "hardware", "preview", "硬件", "预览图"]
    };

    try {
      const result = await launcher.execute(item);
      if (
        requestToken !== hardwareInspectorRequestToken ||
        previewToken !== hardwareInspectorPreviewRequestToken
      ) {
        return;
      }

      const data = toRecord(result.data);
      const previewImageDataUrl =
        typeof data?.previewImageDataUrl === "string" ? data.previewImageDataUrl.trim() : "";
      hardwareInspectorPreviewError =
        typeof data?.error === "string" && data.error.trim()
          ? data.error
          : result.ok
            ? ""
            : result.message ?? "生成预览图失败";
      hardwareInspectorPreviewImageUrl =
        previewImageDataUrl && previewImageDataUrl.startsWith("data:image/")
          ? previewImageDataUrl
          : "";
    } catch (error) {
      if (
        requestToken !== hardwareInspectorRequestToken ||
        previewToken !== hardwareInspectorPreviewRequestToken
      ) {
        return;
      }
      hardwareInspectorPreviewError =
        error instanceof Error && error.message ? error.message : "生成预览图失败";
      hardwareInspectorPreviewImageUrl = "";
    } finally {
      if (
        requestToken === hardwareInspectorRequestToken &&
        previewToken === hardwareInspectorPreviewRequestToken
      ) {
        hardwareInspectorPreviewLoading = false;
        if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
          renderList();
        }
      }
    }
  }

  export function createHardwareInspectorPreviewPanel(): HTMLElement {
    const aside = document.createElement("aside");
    aside.className = "hardware-inspector-preview";

    const head = document.createElement("div");
    head.className = "hardware-inspector-preview-head";
    const title = document.createElement("h4");
    title.className = "hardware-inspector-preview-title";
    title.textContent = "配置预览图";
    const hint = document.createElement("p");
    hint.className = "hardware-inspector-preview-hint";
    hint.textContent = "与「导出精简图」相同，采集完成后自动生成";
    head.append(title, hint);

    const frame = document.createElement("div");
    frame.className = "hardware-inspector-preview-frame";
    if (hardwareInspectorPreviewLoading) {
      const loading = document.createElement("div");
      loading.className = "hardware-inspector-preview-placeholder";
      loading.textContent = "正在生成预览图...";
      frame.appendChild(loading);
    } else if (hardwareInspectorPreviewError) {
      const errorNode = document.createElement("div");
      errorNode.className =
        "hardware-inspector-preview-placeholder hardware-inspector-preview-placeholder-error";
      errorNode.textContent = hardwareInspectorPreviewError;
      frame.appendChild(errorNode);
    } else if (hardwareInspectorPreviewImageUrl) {
      const image = document.createElement("img");
      image.className = "hardware-inspector-preview-image";
      image.alt = "硬件配置预览图";
      image.src = hardwareInspectorPreviewImageUrl;
      frame.appendChild(image);
    } else {
      const waiting = document.createElement("div");
      waiting.className = "hardware-inspector-preview-placeholder";
      waiting.textContent = "等待生成预览图...";
      frame.appendChild(waiting);
    }

    const actions = document.createElement("div");
    actions.className = "hardware-inspector-preview-actions";

    const refreshPreviewButton = document.createElement("button");
    refreshPreviewButton.type = "button";
    refreshPreviewButton.className = "settings-btn settings-btn-secondary";
    refreshPreviewButton.textContent = hardwareInspectorPreviewLoading ? "生成中..." : "刷新预览";
    refreshPreviewButton.disabled =
      hardwareInspectorLoading || hardwareInspectorExporting || hardwareInspectorPreviewLoading;
    refreshPreviewButton.addEventListener("click", () => {
      void loadHardwareInspectorPreview(hardwareInspectorRequestToken);
    });

    const exportCompactButton = document.createElement("button");
    exportCompactButton.type = "button";
    exportCompactButton.className = "settings-btn settings-btn-secondary";
    exportCompactButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出精简图";
    exportCompactButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportCompactButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("image-compact");
    });

    const exportFullButton = document.createElement("button");
    exportFullButton.type = "button";
    exportFullButton.className = "settings-btn settings-btn-secondary";
    exportFullButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出长图";
    exportFullButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
    exportFullButton.addEventListener("click", () => {
      void executeHardwareInspectorExportReport("image");
    });

    actions.append(refreshPreviewButton, exportCompactButton, exportFullButton);
    aside.append(head, frame, actions);
    return aside;
  }

  export function getHardwareInspectorSnapshotFromData(
    data: Record<string, unknown> | null
  ): HardwareInspectorSnapshot | null {
    const snapshot = data?.snapshot;
    if (!snapshot || typeof snapshot !== "object") {
      return null;
    }
    return snapshot as HardwareInspectorSnapshot;
  }

  export function buildHardwareInspectorSummaryText(snapshot: HardwareInspectorSnapshot): string {
    const systemName = [snapshot.computerSystem.manufacturer, snapshot.computerSystem.model]
      .filter(Boolean)
      .join(" ");
    const cpuName = snapshot.cpus[0]?.name ?? "未知 CPU";
    const memoryText = formatHardwareInspectorBytes(
      snapshot.computerSystem.totalPhysicalMemory
    );
    return [
      systemName || "未知设备",
      cpuName,
      `内存 ${memoryText}`,
      `显卡 ${snapshot.gpus.length} 张`,
      `磁盘 ${snapshot.disks.length} 块`
    ].join(" / ");
  }

  export async function executeHardwareInspectorRefresh(): Promise<void> {
    const launcher = getLauncherApi();
    if (!launcher) {
      setStatus("桥接层未加载，无法执行硬件检测");
      return;
    }

    const requestToken = ++hardwareInspectorRequestToken;
    hardwareInspectorLoading = true;
    hardwareInspectorError = "";
    hardwareInspectorInfo = "正在采集硬件信息...";
    if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
      renderList();
    }
    setStatus("正在采集硬件信息...");

    const item: LaunchItem = {
      id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:refresh`,
      type: "command",
      title: "硬件检测",
      subtitle: "刷新硬件信息",
      target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=refresh`,
      keywords: ["plugin", "hardware", "systeminfo", "硬件", "刷新"]
    };

    const result = await launcher.execute(item);
    if (requestToken !== hardwareInspectorRequestToken) {
      return;
    }

    hardwareInspectorLoading = false;
    const data = toRecord(result.data);
    const snapshot = getHardwareInspectorSnapshotFromData(data);
    if (snapshot) {
      applyHardwareInspectorSnapshot(
        snapshot,
        typeof data?.info === "string" ? data.info : ""
      );
    } else {
      hardwareInspectorSnapshot = null;
      hardwareInspectorInfo = typeof data?.info === "string" ? data.info : "";
    }

    hardwareInspectorError =
      typeof data?.error === "string" && data.error.trim()
        ? data.error
        : result.ok
          ? ""
          : result.message ?? "硬件信息采集失败";

    setStatus(
      result.message ??
        (result.ok ? "硬件信息采集完成" : hardwareInspectorError || "硬件信息采集失败")
    );
    if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
      renderList();
    }
  }

  export async function executeHardwareInspectorExportReport(
    format: "markdown" | "html" | "image" | "image-compact"
  ): Promise<void> {
    const launcher = getLauncherApi();
    const labelFor = (value: typeof format): string =>
      value === "html"
        ? "HTML"
        : value === "image"
          ? "完整图片"
          : value === "image-compact"
            ? "精简图片"
            : "Markdown";
    if (!launcher) {
      setStatus(`桥接层未加载，无法导出${labelFor(format)}报告`);
      return;
    }

    hardwareInspectorExporting = true;
    hardwareInspectorError = "";
    beginPluginNativeInteraction();
    if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
      renderList();
    }
    const exportLabel = labelFor(format);
    setStatus(`正在导出${exportLabel}报告...`);

    const action =
      format === "html"
        ? "export-html"
        : format === "image"
          ? "export-image"
          : format === "image-compact"
            ? "export-image-compact"
            : "export-report";
    const item: LaunchItem = {
      id: `plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}:${action}`,
      type: "command",
      title: "硬件检测",
      subtitle: `导出硬件${exportLabel}报告`,
      target: `command:plugin:${HARDWARE_INSPECTOR_PLUGIN_ID}?action=${action}`,
      keywords: ["plugin", "hardware", "report", "导出", "硬件报告", format]
    };

    try {
      const result = await launcher.execute(item);
      const data = toRecord(result.data);
      const snapshot = getHardwareInspectorSnapshotFromData(data);
      if (snapshot) {
        applyHardwareInspectorSnapshot(
          snapshot,
          typeof data?.info === "string" ? data.info : "",
          { loadPreview: false }
        );
      }

      hardwareInspectorError =
        typeof data?.error === "string" && data.error.trim()
          ? data.error
          : result.ok
            ? ""
            : result.message ?? `导出${exportLabel}报告失败`;

      setStatus(
        result.message ??
          (result.ok
            ? `${exportLabel}报告已导出`
            : hardwareInspectorError || `导出${exportLabel}报告失败`)
      );
    } finally {
      hardwareInspectorExporting = false;
      schedulePluginNativeInteractionRelease();
      if (mode === "plugin" && activePluginPanel?.pluginId === HARDWARE_INSPECTOR_PLUGIN_ID) {
        renderList();
      }
    }
  }

  export function applyHardwareInspectorPanelPayload(panel: ActivePluginPanelState): void {
      const data = toRecord(panel.data);
      hardwareInspectorLoading = data?.loading === true;
      hardwareInspectorInfo = typeof data?.info === "string" ? data.info : "";
      hardwareInspectorError = typeof data?.error === "string" ? data.error : "";
      const snapshot = getHardwareInspectorSnapshotFromData(data);
      if (snapshot) {
        applyHardwareInspectorSnapshot(snapshot, hardwareInspectorInfo);
        return;
      }

      hardwareInspectorSnapshot = null;
    }

  export function renderHardwareInspectorPanel(): void {
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

      const exportGroup = document.createElement("div");
      exportGroup.className = "hardware-inspector-action-cluster";
      const exportFormat = document.createElement("select");
      exportFormat.className = "settings-value hardware-inspector-action-select";
      exportFormat.setAttribute("aria-label", "导出格式");
      [
        { value: "markdown", label: "Markdown" },
        { value: "html", label: "HTML" },
        { value: "image-compact", label: "精简图" },
        { value: "image", label: "完整长图" }
      ].forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry.value;
        option.textContent = entry.label;
        exportFormat.appendChild(option);
      });
      exportFormat.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
      const exportButton = document.createElement("button");
      exportButton.type = "button";
      exportButton.className = "settings-btn settings-btn-secondary";
      exportButton.textContent = hardwareInspectorExporting ? "导出中..." : "导出";
      exportButton.disabled = hardwareInspectorLoading || hardwareInspectorExporting;
      exportButton.addEventListener("click", () => {
        const format = exportFormat.value as "markdown" | "html" | "image" | "image-compact";
        void executeHardwareInspectorExportReport(format);
      });
      exportGroup.append(exportFormat, exportButton);

      const copyGroup = document.createElement("div");
      copyGroup.className = "hardware-inspector-action-cluster";
      const copyFormat = document.createElement("select");
      copyFormat.className = "settings-value hardware-inspector-action-select";
      copyFormat.setAttribute("aria-label", "复制内容");
      [
        { value: "summary", label: "摘要" },
        { value: "json", label: "JSON" }
      ].forEach((entry) => {
        const option = document.createElement("option");
        option.value = entry.value;
        option.textContent = entry.label;
        copyFormat.appendChild(option);
      });
      copyFormat.disabled = !hardwareInspectorSnapshot;
      const copyButton = document.createElement("button");
      copyButton.type = "button";
      copyButton.className = "settings-btn settings-btn-secondary";
      copyButton.textContent = "复制";
      copyButton.disabled = !hardwareInspectorSnapshot;
      copyButton.addEventListener("click", () => {
        if (!hardwareInspectorSnapshot) {
          setStatus("暂无可复制的硬件信息");
          return;
        }
        void (async () => {
          const copyJson = copyFormat.value === "json";
          const text = copyJson
            ? JSON.stringify(hardwareInspectorSnapshot, null, 2)
            : buildHardwareInspectorSummaryText(hardwareInspectorSnapshot);
          const ok = await copyTextToClipboard(text);
          setStatus(ok ? `已复制硬件${copyJson ? " JSON" : "摘要"}` : "复制失败");
        })();
      });
      copyGroup.append(copyFormat, copyButton);

      actions.append(
        refreshButton,
        exportGroup,
        copyGroup
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
        const body = document.createElement("div");
        body.className = "hardware-inspector-body";
        const main = document.createElement("div");
        main.className = "hardware-inspector-main";
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
        main.appendChild(overview);

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
        main.appendChild(compare);

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
        main.appendChild(meta);

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
        main.appendChild(cpuSection.section);

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
        main.appendChild(boardSection.section);

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
        main.appendChild(memorySection.section);

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
                `显存：${formatHardwareInspectorGpuMemory(gpu)}`,
                `显存来源：${formatHardwareInspectorGpuMemorySource(gpu)}`,
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
              { label: "显存", value: formatHardwareInspectorGpuMemory(gpu) },
              { label: "显存来源", value: formatHardwareInspectorGpuMemorySource(gpu) },
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
        main.appendChild(gpuSection.section);

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
        main.appendChild(diskSection.section);
        body.append(main, createHardwareInspectorPreviewPanel());
        form.appendChild(body);
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
    }

}
