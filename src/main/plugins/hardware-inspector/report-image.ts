import { BrowserWindow } from "electron";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";

import { type HardwareInspectorSnapshot } from "./collector";
import { formatHardwareInspectorVendorName } from "./vendor-resolver";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function formatText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "未知";
}

function formatOptional(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "—";
}

function formatBytes(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未知";
  }

  const units = ["B", "KB", "MB", "GB", "TB"];
  let next = value;
  let index = 0;
  while (next >= 1024 && index < units.length - 1) {
    next /= 1024;
    index += 1;
  }

  const digits = next >= 100 ? 0 : next >= 10 ? 1 : 2;
  return `${next.toFixed(digits)} ${units[index]}`;
}

function formatGpuMemory(gpu: HardwareInspectorSnapshot["gpus"][number]): string {
  if (gpu.memoryKind === "shared-dynamic") {
    return "共享 / 动态分配";
  }
  if (gpu.memoryKind === "unavailable") {
    return "无法确认";
  }
  if (gpu.adapterRamSource === "wmi-uint32-limited") {
    return "无法准确读取（旧接口 4 GB 上限）";
  }
  const value = formatBytes(gpu.adapterRam);
  return gpu.memoryKind === "driver-reported" && value !== "未知"
    ? `${value}（未验证）`
    : value;
}

function formatClock(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未知";
  }

  return value >= 1000 ? `${(value / 1000).toFixed(2)} GHz` : `${value} MHz`;
}

function formatBoolean(value: boolean | null | undefined, trueText = "是", falseText = "否"): string {
  if (typeof value !== "boolean") {
    return "未知";
  }

  return value ? trueText : falseText;
}

function formatTemperature(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "不可用";
  }

  return `${value} °C`;
}

function formatPercentage(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "不可用";
  }

  return `${value}%`;
}

function formatHours(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return "不可用";
  }

  return `${Math.round(value)} 小时`;
}

function formatRpm(value: number | null | undefined): string {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value >= 4294967295
  ) {
    return "—";
  }

  return `${Math.round(value)} RPM`;
}

function formatSectorSize(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return `${value} B`;
}

function formatReportDate(value: string | null | undefined): string {
  if (!value?.trim()) {
    return "未知";
  }

  const dotNetMatch = value.trim().match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
  const parsed = dotNetMatch
    ? new Date(Number(dotNetMatch[1]))
    : new Date(value.trim());
  return Number.isNaN(parsed.getTime())
    ? value.trim()
    : parsed.toLocaleString("zh-CN", { hour12: false });
}

function formatGpuResolution(gpu: HardwareInspectorSnapshot["gpus"][number]): string {
  const width = gpu.horizontalResolution;
  const height = gpu.verticalResolution;
  if (
    typeof width !== "number" ||
    typeof height !== "number" ||
    !Number.isFinite(width) ||
    !Number.isFinite(height) ||
    width <= 0 ||
    height <= 0
  ) {
    return "未提供（可能未直连显示器）";
  }

  const refresh =
    typeof gpu.refreshRate === "number" && gpu.refreshRate > 0 ? ` @ ${gpu.refreshRate} Hz` : "";
  return `${width} x ${height}${refresh}`;
}

function formatDiskType(disk: HardwareInspectorSnapshot["disks"][number]): string {
  const media = formatText(disk.storageMediaType || disk.mediaType).toLowerCase();
  if (media.includes("ssd") || media.includes("solid")) {
    return "SSD";
  }
  if (media.includes("hdd") || media.includes("hard")) {
    return "HDD";
  }
  if (
    typeof disk.spindleSpeed === "number" &&
    Number.isFinite(disk.spindleSpeed) &&
    disk.spindleSpeed > 0 &&
    disk.spindleSpeed < 4294967295
  ) {
    return "HDD";
  }
  return formatText(disk.storageMediaType || disk.mediaType);
}

function isSataDisk(disk: HardwareInspectorSnapshot["disks"][number]): boolean {
  const bus = `${disk.busType ?? ""} ${disk.interfaceType ?? ""}`.toLowerCase();
  return bus.includes("sata") || bus.includes("ata") || bus.includes("ide");
}

function isNvmeDisk(disk: HardwareInspectorSnapshot["disks"][number]): boolean {
  const bus = `${disk.busType ?? ""} ${disk.interfaceType ?? ""}`.toLowerCase();
  const model = (disk.model ?? "").toLowerCase();
  return bus.includes("nvme") || model.includes("nvme");
}

function isRiskDisk(disk: HardwareInspectorSnapshot["disks"][number]): boolean {
  const health = formatText(disk.healthStatus).toLowerCase();
  return (
    disk.smartPredictFailure === true ||
    (health !== "未知" && health !== "healthy" && health !== "ok" && health !== "正常")
  );
}

function getDiskDriveLetters(disk: HardwareInspectorSnapshot["disks"][number]): string {
  const letters = disk.partitions.flatMap((partition) =>
    partition.volumes
      .map((volume) => volume.deviceId?.trim())
      .filter((value): value is string => Boolean(value))
  );
  return letters.length > 0 ? letters.join(" / ") : "—";
}

function countDiskVolumes(disk: HardwareInspectorSnapshot["disks"][number]): number {
  return disk.partitions.reduce((count, partition) => count + partition.volumes.length, 0);
}

function countSnapshotVolumes(snapshot: HardwareInspectorSnapshot): number {
  return snapshot.disks.reduce((count, disk) => count + countDiskVolumes(disk), 0);
}

function countSnapshotPartitions(snapshot: HardwareInspectorSnapshot): number {
  return snapshot.disks.reduce((count, disk) => count + disk.partitions.length, 0);
}

function getPrimaryGpuName(snapshot: HardwareInspectorSnapshot): string {
  const discrete = snapshot.gpus.find((gpu) => {
    const name = (gpu.name ?? "").toLowerCase();
    return (
      name &&
      !name.includes("microsoft basic") &&
      !name.includes("remote") &&
      !name.includes("virtual")
    );
  });
  const selected = discrete ?? snapshot.gpus[0];
  return selected
    ? `${formatHardwareInspectorVendorName(selected.vendor, selected.manufacturer)} · ${formatText(selected.name)}`
    : "未知";
}

function getIntegratedGpu(snapshot: HardwareInspectorSnapshot): string {
  const integrated = snapshot.gpus.find((gpu) => {
    const name = (gpu.name ?? "").toLowerCase();
    return (
      name.includes("intel") &&
      (name.includes("graphics") || name.includes("uhd") || name.includes("hd graphics"))
    );
  });
  return integrated
    ? `${formatHardwareInspectorVendorName(integrated.vendor, integrated.manufacturer)} · ${formatText(integrated.name)}`
    : "—";
}

function getMemorySummary(snapshot: HardwareInspectorSnapshot): string {
  const total = formatBytes(snapshot.computerSystem.totalPhysicalMemory);
  const speeds = snapshot.memoryModules
    .map((module) => module.configuredClockSpeed || module.speed)
    .filter((value): value is number => typeof value === "number" && value > 0);
  const uniqueSpeeds = [...new Set(speeds)];
  const speedText =
    uniqueSpeeds.length > 0
      ? ` ${uniqueSpeeds.map((speed) => `${speed} MHz`).join(" / ")}`
      : "";
  const slotText =
    snapshot.memoryModules.length > 0 ? ` / ${snapshot.memoryModules.length} 条` : "";
  return `${total}${speedText}${slotText}`;
}

function getTotalLogicalCores(snapshot: HardwareInspectorSnapshot): number {
  return snapshot.cpus.reduce(
    (sum, cpu) => sum + (cpu.numberOfLogicalProcessors ?? cpu.numberOfCores ?? 0),
    0
  );
}

function buildRecommendations(snapshot: HardwareInspectorSnapshot): string[] {
  const tips: string[] = [];
  const sataDisks = snapshot.disks.filter(isSataDisk);
  const nvmeDisks = snapshot.disks.filter(isNvmeDisk);
  const ssds = snapshot.disks.filter((disk) => formatDiskType(disk) === "SSD");
  const hdds = snapshot.disks.filter((disk) => formatDiskType(disk) === "HDD");
  const riskDisks = snapshot.disks.filter(isRiskDisk);

  if (riskDisks.length > 0) {
    tips.push(
      `检测到 ${riskDisks.length} 块磁盘存在健康风险或 SMART 预警，请尽快备份数据并检查 ${riskDisks
        .map((disk) => formatText(disk.model))
        .join("、")}。`
    );
  }

  if (nvmeDisks.length > 0) {
    tips.push("检测到 NVMe 固态硬盘，系统盘优先安装在 NVMe 接口可获得更高读写速度。");
  }

  if (sataDisks.length > 0) {
    tips.push(
      `当前有 ${sataDisks.length} 块设备走 SATA/ATA 接口；SSD 建议接主板标注的 SATA3（6Gb/s）接口，机械硬盘可接 SATA2 或剩余 SATA3 口。`
    );
  }

  if (ssds.length > 0 && hdds.length > 0) {
    tips.push("若同时存在 SSD 与 HDD，建议将系统与常用软件放在 SSD，大文件和备份放在 HDD。");
  }

  if (snapshot.memoryModules.length === 1 && (snapshot.memoryModules[0]?.capacity ?? 0) > 0) {
    tips.push("当前仅识别到 1 条内存，如需升级可优先补齐同规格双通道内存。");
  }

  const lowFreeVolumes = snapshot.disks.flatMap((disk) =>
    disk.partitions.flatMap((partition) => partition.volumes)
  ).filter((volume) => {
    if (
      typeof volume.size !== "number" ||
      typeof volume.freeSpace !== "number" ||
      volume.size <= 0
    ) {
      return false;
    }
    return volume.freeSpace / volume.size < 0.1;
  });
  if (lowFreeVolumes.length > 0) {
    tips.push(
      `以下卷剩余空间不足 10%：${lowFreeVolumes
        .map((volume) => formatText(volume.deviceId))
        .join("、")}，建议及时清理或扩容。`
    );
  }

  tips.push("主板具体 SATA 口位、数量与优先顺序请结合主板说明书核对，本图仅基于当前系统识别结果。");
  return tips;
}

function buildMetricCards(snapshot: HardwareInspectorSnapshot): string {
  const sataCount = snapshot.disks.filter(isSataDisk).length;
  const nvmeCount = snapshot.disks.filter(isNvmeDisk).length;
  const riskCount = snapshot.disks.filter(isRiskDisk).length;
  const partitionCount = countSnapshotPartitions(snapshot);
  const volumeCount = countSnapshotVolumes(snapshot);

  const items = [
    { label: "总内存", value: formatBytes(snapshot.computerSystem.totalPhysicalMemory), tone: "blue" },
    {
      label: "逻辑处理器",
      value: String(getTotalLogicalCores(snapshot) || "?"),
      tone: "blue"
    },
    { label: "显卡数量", value: String(snapshot.gpus.length), tone: "blue" },
    { label: "磁盘数量", value: String(snapshot.disks.length), tone: "blue" },
    { label: "显示器", value: String(snapshot.displays.length), tone: "blue" },
    { label: "SATA 设备", value: String(sataCount), tone: sataCount > 0 ? "green" : "gray" },
    { label: "NVMe 设备", value: String(nvmeCount), tone: nvmeCount > 0 ? "green" : "gray" },
    {
      label: "分区 / 卷",
      value: `${partitionCount} / ${volumeCount}`,
      tone: "blue"
    },
    {
      label: "风险磁盘",
      value: riskCount > 0 ? `${riskCount} 块` : "无",
      tone: riskCount > 0 ? "red" : "green"
    }
  ];

  return `
    <div class="metric-grid">
      ${items
        .map(
          (item) => `
        <div class="metric-card">
          <div class="metric-label">${escapeHtml(item.label)}</div>
          <div class="metric-value" data-tone="${item.tone}">${escapeHtml(item.value)}</div>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function buildOverviewRows(snapshot: HardwareInspectorSnapshot): string {
  const board =
    [
      formatHardwareInspectorVendorName(snapshot.baseBoard.vendor, snapshot.baseBoard.manufacturer),
      snapshot.baseBoard.product
    ].filter(Boolean).join(" ") ||
    "未知主板";
  const deviceName =
    [
      formatHardwareInspectorVendorName(
        snapshot.computerSystem.vendor,
        snapshot.computerSystem.manufacturer
      ),
      snapshot.computerSystem.model
    ]
      .filter(Boolean)
      .join(" ") || "未知设备";

  const rows: Array<[string, string]> = [
    ["电脑名称", formatText(snapshot.computerSystem.name)],
    ["设备型号", deviceName],
    ["系统类型", formatText(snapshot.computerSystem.systemType)],
    ["主板", board],
    [
      "系统",
      [snapshot.operatingSystem.caption, snapshot.operatingSystem.version, snapshot.operatingSystem.buildNumber]
        .filter(Boolean)
        .join(" / ") || "未知"
    ],
    ["系统架构", formatText(snapshot.operatingSystem.architecture)],
    ["系统安装时间", formatReportDate(snapshot.operatingSystem.installDate)],
    ["最近启动", formatReportDate(snapshot.operatingSystem.lastBootUpTime)],
    [
      "CPU",
      [
        formatText(snapshot.cpus[0]?.name),
        snapshot.cpus[0]?.numberOfCores
          ? `${snapshot.cpus[0].numberOfCores} 核 / ${snapshot.cpus[0].numberOfLogicalProcessors ?? "?"} 线程`
          : ""
      ]
        .filter(Boolean)
        .join(" / ")
    ],
    [
      "BIOS",
      [
        formatText(snapshot.bios.smbiosBiosVersion || snapshot.bios.version),
        formatReportDate(snapshot.bios.releaseDate)
      ]
        .filter((value) => value && value !== "未知")
        .join(" / ") || "未知"
    ],
    ["内存", getMemorySummary(snapshot)],
    ["独显", getPrimaryGpuName(snapshot)],
    ["核显 / 集显", getIntegratedGpu(snapshot)]
  ];

  return rows
    .map(
      ([label, value]) => `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td>${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");
}

function buildBoardRows(snapshot: HardwareInspectorSnapshot): string {
  const rows: Array<[string, string]> = [
    ["主板厂商", formatHardwareInspectorVendorName(snapshot.baseBoard.vendor, snapshot.baseBoard.manufacturer)],
    ["主板型号", formatText(snapshot.baseBoard.product)],
    ["主板版本", formatText(snapshot.baseBoard.version)],
    ["主板序列号", formatOptional(snapshot.baseBoard.serialNumber)],
    ["BIOS 厂商", formatHardwareInspectorVendorName(snapshot.bios.vendor, snapshot.bios.manufacturer)],
    ["BIOS 版本", formatText(snapshot.bios.smbiosBiosVersion || snapshot.bios.version)],
    ["BIOS 发布日期", formatReportDate(snapshot.bios.releaseDate)],
    ["BIOS 序列号", formatOptional(snapshot.bios.serialNumber)]
  ];

  return rows
    .map(
      ([label, value]) => `
      <tr>
        <th>${escapeHtml(label)}</th>
        <td>${escapeHtml(value)}</td>
      </tr>`
    )
    .join("");
}

function buildCpuRows(snapshot: HardwareInspectorSnapshot): string {
  if (snapshot.cpus.length === 0) {
    return `<tr><td colspan="8" class="empty">未识别到 CPU</td></tr>`;
  }

  return snapshot.cpus
    .map(
      (cpu, index) => `
      <tr>
        <td>CPU ${index + 1}</td>
        <td>${escapeHtml(`${formatHardwareInspectorVendorName(cpu.vendor, cpu.manufacturer)} · ${formatText(cpu.name)}`)}</td>
        <td>${escapeHtml(formatText(cpu.socketDesignation))}</td>
        <td>${cpu.numberOfCores ?? "?"} / ${cpu.numberOfLogicalProcessors ?? "?"}</td>
        <td>${escapeHtml(formatClock(cpu.maxClockSpeed))}</td>
        <td>${escapeHtml(formatClock(cpu.currentClockSpeed))}</td>
        <td>${escapeHtml(formatTemperature(cpu.temperatureCelsius))}</td>
        <td>${escapeHtml(formatBoolean(cpu.virtualizationFirmwareEnabled, "支持", "不支持"))}</td>
      </tr>`
    )
    .join("");
}

function buildGpuRows(snapshot: HardwareInspectorSnapshot): string {
  if (snapshot.gpus.length === 0) {
    return `<tr><td colspan="8" class="empty">未识别到显卡</td></tr>`;
  }

  return snapshot.gpus
    .map(
      (gpu, index) => `
      <tr>
        <td>显卡 ${index + 1}</td>
        <td>${escapeHtml(`${formatHardwareInspectorVendorName(gpu.vendor, gpu.manufacturer)} · ${formatText(gpu.name)}`)}</td>
        <td>${escapeHtml(formatGpuMemory(gpu))}</td>
        <td>${escapeHtml(formatText(gpu.driverVersion))}</td>
        <td>${escapeHtml(formatReportDate(gpu.driverDate))}</td>
        <td>${escapeHtml(formatGpuResolution(gpu))}</td>
        <td>${escapeHtml(formatTemperature(gpu.temperatureCelsius))}</td>
        <td>${escapeHtml(formatText(gpu.status))}</td>
      </tr>`
    )
    .join("");
}

function buildMemoryRows(snapshot: HardwareInspectorSnapshot): string {
  if (snapshot.memoryModules.length === 0) {
    return `<tr><td colspan="7" class="empty">未识别到内存条详情</td></tr>`;
  }

  return snapshot.memoryModules
    .map(
      (module, index) => `
      <tr>
        <td>${escapeHtml(formatText(module.deviceLocator || module.bankLabel || `内存 ${index + 1}`))}</td>
        <td>${escapeHtml(formatBytes(module.capacity))}</td>
        <td>${escapeHtml(formatClock(module.configuredClockSpeed || module.speed))}</td>
        <td>${escapeHtml(formatText(module.memoryType))}</td>
        <td>${escapeHtml(formatText(module.formFactor))}</td>
        <td>${escapeHtml(formatHardwareInspectorVendorName(module.vendor, module.manufacturer))}</td>
        <td>${escapeHtml(formatOptional(module.partNumber))}</td>
      </tr>`
    )
    .join("");
}

function buildInterfaceRows(snapshot: HardwareInspectorSnapshot): string {
  const groups = new Map<string, { count: number; example: string }>();

  snapshot.disks.forEach((disk) => {
    const bus = formatText(disk.busType || disk.interfaceType);
    const media = formatDiskType(disk);
    const current = groups.get(bus) ?? { count: 0, example: media };
    current.count += 1;
    if (!current.example || current.example === "未知") {
      current.example = media;
    }
    groups.set(bus, current);
  });

  if (groups.size === 0) {
    return `<tr><td colspan="4" class="empty">未识别到存储接口信息</td></tr>`;
  }

  return [...groups.entries()]
    .map(([bus, info]) => {
      const lowerBus = bus.toLowerCase();
      const rate =
        lowerBus.includes("nvme")
          ? "约 2000~7000 MB/s"
          : lowerBus.includes("sata")
            ? "约 500~550 MB/s"
            : lowerBus.includes("usb")
              ? "视 USB 版本而定"
              : "视接口与设备而定";
      const suggestion =
        lowerBus.includes("nvme")
          ? "优先安装系统盘"
          : lowerBus.includes("sata") && info.example === "SSD"
            ? "适合 SSD 系统盘 / 数据盘"
            : lowerBus.includes("sata")
              ? "适合机械硬盘 / 光驱"
              : "按设备类型选择";

      return `
      <tr>
        <td>${escapeHtml(bus)}</td>
        <td>${info.count}</td>
        <td>${escapeHtml(rate)}</td>
        <td>${escapeHtml(suggestion)}</td>
      </tr>`;
    })
    .join("");
}

function buildStorageRows(snapshot: HardwareInspectorSnapshot): string {
  if (snapshot.disks.length === 0) {
    return `<tr><td colspan="8" class="empty">未识别到磁盘设备</td></tr>`;
  }

  return snapshot.disks
    .map((disk, index) => {
      const usesSata = isSataDisk(disk);
      const risk = isRiskDisk(disk);
      return `
      <tr>
        <td>磁盘 ${typeof disk.index === "number" ? disk.index : index}</td>
        <td>${escapeHtml(formatText(disk.model))}</td>
        <td>${escapeHtml(formatDiskType(disk))}</td>
        <td>${escapeHtml(formatText(disk.busType || disk.interfaceType))}</td>
        <td>${escapeHtml(formatBytes(disk.size))}</td>
        <td>${escapeHtml(getDiskDriveLetters(disk))}</td>
        <td><span class="pill" data-tone="${usesSata ? "yes" : "no"}">${usesSata ? "是" : "否"}</span></td>
        <td><span class="pill" data-tone="${risk ? "danger" : "ok"}">${escapeHtml(formatText(disk.healthStatus))}</span></td>
      </tr>`;
    })
    .join("");
}

function buildDiskHealthRows(snapshot: HardwareInspectorSnapshot): string {
  if (snapshot.disks.length === 0) {
    return `<tr><td colspan="8" class="empty">未识别到磁盘健康信息</td></tr>`;
  }

  return snapshot.disks
    .map((disk, index) => `
      <tr>
        <td>${escapeHtml(formatText(disk.model) || `磁盘 ${index + 1}`)}</td>
        <td>${escapeHtml(formatText(disk.operationalStatus))}</td>
        <td>${escapeHtml(formatBoolean(disk.smartPredictFailure, "是", "否"))}</td>
        <td>${escapeHtml(formatTemperature(disk.temperatureCelsius))}</td>
        <td>${escapeHtml(formatTemperature(disk.temperatureMaxCelsius))}</td>
        <td>${escapeHtml(formatPercentage(disk.wearPercentage))}</td>
        <td>${escapeHtml(formatHours(disk.powerOnHours))}</td>
        <td>${escapeHtml(formatRpm(disk.spindleSpeed))}</td>
      </tr>`)
    .join("");
}

function buildDiskDetailRows(snapshot: HardwareInspectorSnapshot): string {
  if (snapshot.disks.length === 0) {
    return `<tr><td colspan="6" class="empty">未识别到磁盘详情</td></tr>`;
  }

  return snapshot.disks
    .map((disk, index) => `
      <tr>
        <td>${escapeHtml(formatText(disk.model) || `磁盘 ${index + 1}`)}</td>
        <td>${escapeHtml(formatHardwareInspectorVendorName(disk.vendor, disk.manufacturer))}</td>
        <td>${escapeHtml(formatText(disk.firmwareVersion || disk.firmwareRevision))}</td>
        <td>${escapeHtml(formatSectorSize(disk.logicalSectorSize))}</td>
        <td>${escapeHtml(formatSectorSize(disk.physicalSectorSize))}</td>
        <td>${escapeHtml(formatOptional(disk.serialNumber))}</td>
      </tr>`)
    .join("");
}

function buildVolumeRows(snapshot: HardwareInspectorSnapshot): string {
  const rows: string[] = [];

  snapshot.disks.forEach((disk, diskIndex) => {
    const diskLabel = formatText(disk.model) || `磁盘 ${diskIndex + 1}`;
    disk.partitions.forEach((partition, partitionIndex) => {
      const partitionLabel =
        formatText(partition.name) !== "未知"
          ? formatText(partition.name)
          : `分区 ${partition.index ?? partitionIndex + 1}`;

      if (partition.volumes.length === 0) {
        rows.push(`
          <tr>
            <td>${escapeHtml(diskLabel)}</td>
            <td>${escapeHtml(partitionLabel)}</td>
            <td>—</td>
            <td>${escapeHtml(formatBytes(partition.size))}</td>
            <td>—</td>
            <td>—</td>
            <td>${escapeHtml(formatBoolean(partition.bootPartition, "是", "否"))}</td>
          </tr>`);
        return;
      }

      partition.volumes.forEach((volume) => {
        const usedPercent =
          typeof volume.size === "number" &&
          typeof volume.freeSpace === "number" &&
          volume.size > 0
            ? `${Math.max(0, Math.min(100, Math.round((1 - volume.freeSpace / volume.size) * 100)))}%`
            : "—";
        rows.push(`
          <tr>
            <td>${escapeHtml(diskLabel)}</td>
            <td>${escapeHtml(partitionLabel)}</td>
            <td>${escapeHtml(formatText(volume.deviceId))}</td>
            <td>${escapeHtml(formatBytes(volume.size))}</td>
            <td>${escapeHtml(formatBytes(volume.freeSpace))}</td>
            <td>${escapeHtml(usedPercent)}</td>
            <td>${escapeHtml(formatText(volume.fileSystem))}</td>
          </tr>`);
      });
    });
  });

  if (rows.length === 0) {
    return `<tr><td colspan="7" class="empty">未识别到分区或卷信息</td></tr>`;
  }

  return rows.join("");
}

function buildTemperatureRows(snapshot: HardwareInspectorSnapshot): string {
  const rows: Array<[string, string, string, string]> = [];

  snapshot.cpus.forEach((cpu, index) => {
    rows.push([
      `CPU ${index + 1}`,
      formatText(cpu.name),
      formatTemperature(cpu.temperatureCelsius),
      formatOptional(cpu.temperatureSource)
    ]);
  });

  snapshot.gpus.forEach((gpu, index) => {
    rows.push([
      `显卡 ${index + 1}`,
      formatText(gpu.name),
      formatTemperature(gpu.temperatureCelsius),
      formatOptional(gpu.temperatureSource)
    ]);
  });

  snapshot.disks.forEach((disk, index) => {
    rows.push([
      `磁盘 ${index + 1}`,
      formatText(disk.model),
      formatTemperature(disk.temperatureCelsius),
      "存储监控"
    ]);
  });

  if (rows.length === 0) {
    return `<tr><td colspan="4" class="empty">未采集到温度信息</td></tr>`;
  }

  return rows
    .map(
      ([device, name, temp, source]) => `
      <tr>
        <td>${escapeHtml(device)}</td>
        <td>${escapeHtml(name)}</td>
        <td>${escapeHtml(temp)}</td>
        <td>${escapeHtml(source)}</td>
      </tr>`
    )
    .join("");
}

function buildRiskAlertHtml(snapshot: HardwareInspectorSnapshot): string {
  const riskDisks = snapshot.disks.filter(isRiskDisk);
  if (riskDisks.length === 0) {
    return "";
  }

  return `
    <section class="card warn-box">
      <h2>磁盘健康预警</h2>
      <ul class="tips">
        ${riskDisks
          .map(
            (disk) => `
          <li>${escapeHtml(
            `${formatText(disk.model)}：健康 ${formatText(disk.healthStatus)} / 运行 ${formatText(
              disk.operationalStatus
            )} / 预测故障 ${formatBoolean(disk.smartPredictFailure, "是", "否")}`
          )}</li>`
          )
          .join("")}
      </ul>
    </section>
  `;
}

export type HardwareReportImageVariant = "full" | "compact";

function buildCompactSectionsHtml(snapshot: HardwareInspectorSnapshot): string {
  return `
    <section class="card">
      <h2>整机硬件概览</h2>
      <table>
        <tbody>
          ${buildOverviewRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>硬盘与 SATA 占用</h2>
      <table>
        <thead>
          <tr>
            <th>磁盘</th>
            <th>型号</th>
            <th>类型</th>
            <th>接口</th>
            <th>容量</th>
            <th>盘符</th>
            <th>占 SATA</th>
            <th>健康</th>
          </tr>
        </thead>
        <tbody>
          ${buildStorageRows(snapshot)}
        </tbody>
      </table>
    </section>
  `;
}

function buildFullSectionsHtml(snapshot: HardwareInspectorSnapshot): string {
  return `
    <section class="card">
      <h2>整机硬件概览</h2>
      <table>
        <tbody>
          ${buildOverviewRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>主板与 BIOS</h2>
      <table>
        <tbody>
          ${buildBoardRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>处理器详情</h2>
      <table>
        <thead>
          <tr>
            <th>编号</th>
            <th>型号</th>
            <th>插槽</th>
            <th>核心 / 线程</th>
            <th>最大频率</th>
            <th>当前频率</th>
            <th>温度</th>
            <th>虚拟化</th>
          </tr>
        </thead>
        <tbody>
          ${buildCpuRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>显卡详情</h2>
      <table>
        <thead>
          <tr>
            <th>编号</th>
            <th>名称</th>
            <th>显存</th>
            <th>驱动版本</th>
            <th>驱动日期</th>
            <th>分辨率</th>
            <th>温度</th>
            <th>状态</th>
          </tr>
        </thead>
        <tbody>
          ${buildGpuRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>内存条信息</h2>
      <table>
        <thead>
          <tr>
            <th>插槽</th>
            <th>容量</th>
            <th>频率</th>
            <th>类型</th>
            <th>形态</th>
            <th>厂商</th>
            <th>型号</th>
          </tr>
        </thead>
        <tbody>
          ${buildMemoryRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>存储接口汇总</h2>
      <table>
        <thead>
          <tr>
            <th>接口类型</th>
            <th>设备数量</th>
            <th>参考速度</th>
            <th>建议用途</th>
          </tr>
        </thead>
        <tbody>
          ${buildInterfaceRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>硬盘与 SATA 占用</h2>
      <table>
        <thead>
          <tr>
            <th>磁盘</th>
            <th>型号</th>
            <th>类型</th>
            <th>接口</th>
            <th>容量</th>
            <th>盘符</th>
            <th>占 SATA</th>
            <th>健康</th>
          </tr>
        </thead>
        <tbody>
          ${buildStorageRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>磁盘健康与 SMART</h2>
      <table>
        <thead>
          <tr>
            <th>磁盘</th>
            <th>运行状态</th>
            <th>预测故障</th>
            <th>温度</th>
            <th>最高温度</th>
            <th>磨损</th>
            <th>通电时长</th>
            <th>转速</th>
          </tr>
        </thead>
        <tbody>
          ${buildDiskHealthRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>磁盘固件与序列号</h2>
      <table>
        <thead>
          <tr>
            <th>磁盘</th>
            <th>厂商</th>
            <th>固件</th>
            <th>逻辑扇区</th>
            <th>物理扇区</th>
            <th>序列号</th>
          </tr>
        </thead>
        <tbody>
          ${buildDiskDetailRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>分区与卷</h2>
      <table>
        <thead>
          <tr>
            <th>磁盘</th>
            <th>分区</th>
            <th>卷 / 盘符</th>
            <th>总容量</th>
            <th>可用空间</th>
            <th>已用</th>
            <th>文件系统</th>
          </tr>
        </thead>
        <tbody>
          ${buildVolumeRows(snapshot)}
        </tbody>
      </table>
    </section>

    <section class="card">
      <h2>温度与传感器</h2>
      <table>
        <thead>
          <tr>
            <th>设备</th>
            <th>名称</th>
            <th>温度</th>
            <th>来源</th>
          </tr>
        </thead>
        <tbody>
          ${buildTemperatureRows(snapshot)}
        </tbody>
      </table>
    </section>
  `;
}

export function buildHardwareReportImageHtml(
  snapshot: HardwareInspectorSnapshot,
  variant: HardwareReportImageVariant = "full"
): string {
  const board =
    [
      formatHardwareInspectorVendorName(snapshot.baseBoard.vendor, snapshot.baseBoard.manufacturer),
      snapshot.baseBoard.product
    ].filter(Boolean).join(" ") ||
    "未知主板";
  const subtitle = [
    board,
    formatText(snapshot.operatingSystem.caption),
    formatText(snapshot.cpus[0]?.name),
    getPrimaryGpuName(snapshot)
  ]
    .filter((value) => value && value !== "未知")
    .join(" / ");
  const recommendations = buildRecommendations(snapshot);
  const heroTitle = variant === "compact" ? "电脑硬件配置速览" : "电脑硬件配置报告";
  const bodySections =
    variant === "compact"
      ? buildCompactSectionsHtml(snapshot)
      : buildFullSectionsHtml(snapshot);

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <title>硬件配置报告</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 28px;
      background: #edf2f7;
      color: #1f2937;
      font: 14px/1.55 "Microsoft YaHei UI", "Segoe UI", sans-serif;
    }
    .page {
      width: 1024px;
      margin: 0 auto;
      display: grid;
      gap: 18px;
    }
    .hero {
      border-radius: 18px;
      overflow: hidden;
      background: linear-gradient(135deg, #173a63 0%, #245d9b 100%);
      color: #fff;
      padding: 28px 30px;
      box-shadow: 0 16px 36px rgba(23, 58, 99, 0.18);
    }
    .hero h1 {
      margin: 0 0 10px;
      font-size: 30px;
      line-height: 1.2;
      font-weight: 800;
    }
    .hero p {
      margin: 0;
      font-size: 15px;
      color: rgba(255, 255, 255, 0.88);
    }
    .hero .meta {
      margin-top: 12px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.72);
    }
    .card {
      background: #fff;
      border-radius: 16px;
      padding: 18px 20px;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }
    .card h2 {
      margin: 0 0 14px;
      font-size: 18px;
      color: #173a63;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
    }
    .metric-card {
      background: #fff;
      border-radius: 14px;
      padding: 16px 14px;
      text-align: center;
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
    }
    .metric-label {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 8px;
    }
    .metric-value {
      font-size: 24px;
      font-weight: 800;
      line-height: 1.1;
    }
    .metric-value[data-tone="blue"] { color: #2563eb; }
    .metric-value[data-tone="green"] { color: #16a34a; }
    .metric-value[data-tone="red"] { color: #dc2626; }
    .metric-value[data-tone="gray"] { color: #64748b; }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }
    th, td {
      border: 1px solid #dbe5f0;
      padding: 10px 12px;
      vertical-align: top;
      text-align: left;
      word-break: break-word;
    }
    thead th, tbody th {
      background: #eaf4ff;
      color: #173a63;
      font-weight: 700;
    }
    tbody tr:nth-child(even) td {
      background: #f8fbff;
    }
    .empty {
      text-align: center;
      color: #64748b;
    }
    .pill {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 34px;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 700;
    }
    .pill[data-tone="yes"], .pill[data-tone="ok"] {
      background: #dcfce7;
      color: #15803d;
    }
    .pill[data-tone="no"] {
      background: #f1f5f9;
      color: #64748b;
    }
    .pill[data-tone="danger"] {
      background: #fee2e2;
      color: #b91c1c;
    }
    .tips {
      margin: 0;
      padding-left: 20px;
      color: #334155;
    }
    .tips li + li {
      margin-top: 8px;
    }
    .tips-box {
      background: #f0fdf4;
      border: 1px solid #bbf7d0;
      border-radius: 14px;
      padding: 16px 18px;
    }
    .warn-box {
      background: #fff7ed;
      border: 1px solid #fdba74;
    }
    .footer {
      text-align: center;
      color: #64748b;
      font-size: 12px;
      padding-bottom: 8px;
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <h1>${escapeHtml(heroTitle)}</h1>
      <p>${escapeHtml(subtitle)}</p>
      <div class="meta">采集时间：${escapeHtml(formatReportDate(snapshot.collectedAt))} / 启动时间：${escapeHtml(formatReportDate(snapshot.operatingSystem.lastBootUpTime))}</div>
    </section>

    ${buildMetricCards(snapshot)}
    ${buildRiskAlertHtml(snapshot)}

    ${bodySections}

    <section class="card tips-box">
      <h2>建议接法</h2>
      <ol class="tips">
        ${recommendations.map((tip) => `<li>${escapeHtml(tip)}</li>`).join("")}
      </ol>
    </section>

    <div class="footer">数据来源：LiteLauncher 硬件检测 / 基于当前系统 WMI 与存储信息自动整理</div>
  </main>
</body>
</html>`;
}

export async function renderHardwareReportImage(
  snapshot: HardwareInspectorSnapshot,
  variant: HardwareReportImageVariant = "full"
): Promise<Buffer> {
  const html = buildHardwareReportImageHtml(snapshot, variant);
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "ll-hw-img-"));
  const htmlPath = path.join(tempDir, "hardware-report.html");

  const window = new BrowserWindow({
    show: false,
    width: 1080,
    height: 1200,
    backgroundColor: "#edf2f7",
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  });

  try {
    await fs.writeFile(htmlPath, html, "utf8");
    await window.loadFile(htmlPath);
    await window.webContents.executeJavaScript(
      "document.fonts ? document.fonts.ready : Promise.resolve()",
      true
    );

    const contentHeight = await window.webContents.executeJavaScript(
      "Math.max(document.body.scrollHeight, document.documentElement.scrollHeight)",
      true
    );
    const height = Math.min(Math.max(Number(contentHeight) + 24, 600), 20000);
    window.setContentSize(1080, height);
    await new Promise((resolve) => setTimeout(resolve, 120));

    const image = await window.webContents.capturePage();
    return image.toPNG();
  } finally {
    if (!window.isDestroyed()) {
      window.close();
    }
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
