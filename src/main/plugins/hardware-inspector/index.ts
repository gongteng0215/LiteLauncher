import { promises as fs } from "node:fs";
import path from "node:path";

import { app, dialog } from "electron";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { LauncherPlugin } from "../types";
import {
  collectHardwareInspectorSnapshot,
  HardwareInspectorSnapshot
} from "./collector";

type HardwareInspectorAction = "open" | "refresh" | "export-report" | "export-html";

interface HardwareInspectorCommand {
  action: HardwareInspectorAction;
}

const PLUGIN_ID = "hardware-inspector";
const TITLE = "硬件检测";
const SUBTITLE = "查看主板、CPU、内存、显卡、硬盘等详细信息";
const QUERY_ALIASES = [
  "hardware",
  "hardware-inspector",
  "hw",
  "spec",
  "systeminfo",
  "硬件",
  "硬件检测",
  "硬件信息",
  "系统信息",
  "主板",
  "cpu",
  "显卡",
  "硬盘",
  "内存",
  "bios"
];

function getIconDataUrl(): string {
  const svg =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">' +
    '<rect width="24" height="24" rx="6" fill="#2563eb"/>' +
    '<rect x="7" y="7" width="10" height="10" rx="2" fill="none" stroke="#fff" stroke-width="2"/>' +
    '<path d="M9 4v3M12 4v3M15 4v3M9 17v3M12 17v3M15 17v3M4 9h3M4 12h3M4 15h3M17 9h3M17 12h3M17 15h3" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>' +
    '</svg>';
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function buildTarget(action: HardwareInspectorAction): string {
  const params = new URLSearchParams();
  params.set("action", action);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseReportDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const dotNetMatch = trimmed.match(/^\/Date\((\d+)(?:[+-]\d+)?\)\/$/);
  if (dotNetMatch) {
    const timestamp = Number(dotNetMatch[1]);
    if (Number.isFinite(timestamp)) {
      return new Date(timestamp);
    }
  }

  const parsed = new Date(trimmed);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatReportDate(value: string | null | undefined): string {
  const parsed = parseReportDate(value);
  if (!parsed) {
    return value?.trim() || "未知";
  }

  return parsed.toLocaleString("zh-CN", { hour12: false });
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

function formatClock(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未知";
  }

  return value >= 1000 ? `${(value / 1000).toFixed(2)} GHz` : `${value} MHz`;
}

function formatBoolean(value: boolean | null | undefined): string {
  if (typeof value !== "boolean") {
    return "鏈煡";
  }

  return value ? "支持" : "不支持";
}

function formatNullableBoolean(
  value: boolean | null | undefined,
  trueText: string,
  falseText: string
): string {
  if (typeof value !== "boolean") {
    return "未知";
  }

  return value ? trueText : falseText;
}

function formatText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "未知";
}

function formatReportFileName(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  const second = String(date.getSeconds()).padStart(2, "0");
  return `LiteLauncher-硬件报告-${year}${month}${day}-${hour}${minute}${second}.md`;
}

function formatReportHtmlFileName(date = new Date()): string {
  return formatReportFileName(date).replace(/\.md$/i, ".html");
}

function formatOptionalText(value: string | null | undefined): string {
  return value && value.trim() ? value.trim() : "不可用";
}

function formatDriveType(value: number | null | undefined): string {
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
      return "RAM 盘";
    default:
      return typeof value === "number" && Number.isFinite(value) ? `类型 ${value}` : "不可用";
  }
}

function formatTemperature(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "不可用";
  }

  return `${value} °C`;
}

function formatRpm(value: number | null | undefined): string {
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

function formatSectorSize(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
    return "未知";
  }

  return `${value} B`;
}

function countDiskVolumes(snapshotDisk: HardwareInspectorSnapshot["disks"][number]): number {
  return snapshotDisk.partitions.reduce(
    (count, partition) => count + partition.volumes.length,
    0
  );
}

function isHealthyStatus(value: string | null | undefined): boolean {
  const normalized = formatText(value).trim().toLowerCase();
  return normalized === "healthy" || normalized === "ok" || normalized === "正常";
}

function isRiskDisk(snapshotDisk: HardwareInspectorSnapshot["disks"][number]): boolean {
  return (
    snapshotDisk.smartPredictFailure === true ||
    (formatText(snapshotDisk.healthStatus) !== "未知" &&
      !isHealthyStatus(snapshotDisk.healthStatus)) ||
    (formatText(snapshotDisk.operationalStatus) !== "未知" &&
      !isHealthyStatus(snapshotDisk.operationalStatus))
  );
}

function buildHardwareReport(snapshot: HardwareInspectorSnapshot): string {
  const systemName =
    [snapshot.computerSystem.manufacturer, snapshot.computerSystem.model]
      .filter(Boolean)
      .join(" ") || "未知设备";
  const riskDiskCount = snapshot.disks.filter((disk) => isRiskDisk(disk)).length;
  const lines: string[] = [
    "# 硬件检测报告",
    "",
    `- 采集时间：${formatReportDate(snapshot.collectedAt)}`,
    `- 设备：${systemName}`,
    `- 系统：${formatText(snapshot.operatingSystem.caption)} / ${formatText(snapshot.operatingSystem.buildNumber)}`,
    `- 启动时间：${formatReportDate(snapshot.operatingSystem.lastBootUpTime)}`,
    `- 总内存：${formatBytes(snapshot.computerSystem.totalPhysicalMemory)}`,
    `- 显卡数量：${snapshot.gpus.length}`,
    `- 磁盘数量：${snapshot.disks.length}`,
    `- 风险磁盘：${riskDiskCount > 0 ? `${riskDiskCount} 块` : "无"}`,
    "",
    "> 温度说明：CPU 温度可能来自 ACPI 热区或本机硬件监控命名空间，仅作参考；GPU 温度仅在系统存在可读监控源时显示。",
    ""
  ];

  lines.push("## CPU", "");
  snapshot.cpus.forEach((cpu, index) => {
    lines.push(`### 处理器 ${index + 1}`);
    lines.push(`- 型号：${formatText(cpu.name)}`);
    lines.push(`- 厂商：${formatText(cpu.manufacturer)}`);
    lines.push(`- 插槽：${formatText(cpu.socketDesignation)}`);
    lines.push(`- 核心 / 线程：${cpu.numberOfCores ?? "?"} / ${cpu.numberOfLogicalProcessors ?? "?"}`);
    lines.push(`- 最大频率：${formatClock(cpu.maxClockSpeed)}`);
    lines.push(`- 当前频率：${formatClock(cpu.currentClockSpeed)}`);
    lines.push(`- 温度(可选)：${formatTemperature(cpu.temperatureCelsius)}`);
    lines.push(`- 温度来源：${formatOptionalText(cpu.temperatureSource)}`);
    lines.push(`- 架构：${formatText(cpu.architecture)}`);
    lines.push(`- 虚拟化：${formatBoolean(cpu.virtualizationFirmwareEnabled)}`);
    lines.push("");
  });

  lines.push("## 主板 / BIOS", "");
  lines.push(`- 主板厂商：${formatText(snapshot.baseBoard.manufacturer)}`);
  lines.push(`- 主板型号：${formatText(snapshot.baseBoard.product)}`);
  lines.push(`- 主板版本：${formatText(snapshot.baseBoard.version)}`);
  lines.push(`- BIOS 厂商：${formatText(snapshot.bios.manufacturer)}`);
  lines.push(`- BIOS 版本：${formatText(snapshot.bios.smbiosBiosVersion || snapshot.bios.version)}`);
  lines.push(`- BIOS 发布日期：${formatReportDate(snapshot.bios.releaseDate)}`);
  lines.push("");

  lines.push("## 内存", "");
  snapshot.memoryModules.forEach((memory, index) => {
    const slot = memory.deviceLocator || memory.bankLabel || `内存 ${index + 1}`;
    lines.push(`### ${slot}`);
    lines.push(`- 容量：${formatBytes(memory.capacity)}`);
    lines.push(`- 频率：${formatClock(memory.configuredClockSpeed || memory.speed)}`);
    lines.push(`- 类型：${formatText(memory.memoryType)}`);
    lines.push(`- 形态：${formatText(memory.formFactor)}`);
    lines.push(`- 厂商：${formatText(memory.manufacturer)}`);
    lines.push(`- 型号：${formatText(memory.partNumber)}`);
    lines.push("");
  });

  lines.push("## 显卡", "");
  snapshot.gpus.forEach((gpu, index) => {
    lines.push(`### 显卡 ${index + 1}`);
    lines.push(`- 名称：${formatText(gpu.name)}`);
    lines.push(`- 厂商：${formatText(gpu.manufacturer)}`);
    lines.push(`- 显存：${formatBytes(gpu.adapterRam)}`);
    lines.push(`- 驱动版本：${formatText(gpu.driverVersion)}`);
    lines.push(`- 驱动日期：${formatReportDate(gpu.driverDate)}`);
    lines.push(`- 视频处理器：${formatText(gpu.videoProcessor)}`);
    lines.push(`- 温度(可选)：${formatTemperature(gpu.temperatureCelsius)}`);
    lines.push(`- 温度来源：${formatOptionalText(gpu.temperatureSource)}`);
    lines.push(`- 状态：${formatText(gpu.status)}`);
    lines.push("");
  });

  lines.push("## 存储", "");
  snapshot.disks.forEach((disk, diskIndex) => {
    lines.push(`### 磁盘 ${diskIndex + 1} - ${formatText(disk.model)}`);
    lines.push(`- 厂商：${formatText(disk.manufacturer)}`);
    lines.push(`- 容量：${formatBytes(disk.size)}`);
    lines.push(`- 媒体类型：${formatText(disk.storageMediaType || disk.mediaType)}`);
    lines.push(`- 总线：${formatText(disk.busType || disk.interfaceType)}`);
    lines.push(`- 健康状态：${formatText(disk.healthStatus)}`);
    lines.push(`- 运行状态：${formatText(disk.operationalStatus)}`);
    lines.push(`- 预测故障：${formatNullableBoolean(disk.smartPredictFailure, "是", "否")}`);
    lines.push(
      `- 预测原因：${
        typeof disk.smartReason === "number" && Number.isFinite(disk.smartReason)
          ? String(disk.smartReason)
          : "未知"
      }`
    );
    lines.push(`- 固件：${formatText(disk.firmwareVersion || disk.firmwareRevision)}`);
    lines.push(`- 转速：${formatRpm(disk.spindleSpeed)}`);
    lines.push(`- 逻辑扇区：${formatSectorSize(disk.logicalSectorSize)}`);
    lines.push(`- 物理扇区：${formatSectorSize(disk.physicalSectorSize)}`);
    lines.push(
      `- 槽位 / 机箱槽：${
        typeof disk.slotNumber === "number" && Number.isFinite(disk.slotNumber)
          ? String(disk.slotNumber)
          : "未知"
      } / ${
        typeof disk.enclosureNumber === "number" && Number.isFinite(disk.enclosureNumber)
          ? String(disk.enclosureNumber)
          : "未知"
      }`
    );
    lines.push(`- 存储池：${formatNullableBoolean(disk.canPool, "可加入", "不可加入")}`);
    lines.push(`- 温度：${formatTemperature(disk.temperatureCelsius)}`);
    lines.push(`- 最高温度：${formatTemperature(disk.temperatureMaxCelsius)}`);
    lines.push(
      `- 磨损：${
        typeof disk.wearPercentage === "number" && Number.isFinite(disk.wearPercentage)
          ? `${disk.wearPercentage}%`
          : "不可用"
      }`
    );
    lines.push(
      `- 通电时长：${
        typeof disk.powerOnHours === "number" && Number.isFinite(disk.powerOnHours)
          ? `${disk.powerOnHours} 小时`
          : "不可用"
      }`
    );
    lines.push(`- 序列号：${formatText(disk.serialNumber)}`);
    if (disk.partitions.length > 0) {
      lines.push(`- 分区 / 卷：${disk.partitions.length} / ${countDiskVolumes(disk)}`);
      disk.partitions.forEach((partition) => {
        lines.push(
          `  - ${formatText(partition.name || `分区 ${partition.index ?? "?"}`)} / ${formatText(partition.type)} / ${formatBytes(partition.size)}`
        );
        partition.volumes.forEach((volume) => {
          lines.push(
            `    - 卷 ${formatText(volume.deviceId)} ${formatText(volume.volumeName)} / ${formatText(volume.fileSystem)} / ${formatBytes(volume.size)} / 剩余 ${formatBytes(volume.freeSpace)}`
          );
        });
      });
    }
    lines.push("");
  });

  return lines.join("\n").trim();
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;");
}

function buildMetricGridHtml(
  items: Array<{ label: string; value: string; tone?: "neutral" | "warning" | "danger" | "success" }>
): string {
  return `
    <div class="metric-grid">
      ${items
        .map(
          (item) => `
        <div class="metric-item" data-tone="${item.tone ?? "neutral"}">
          <div class="metric-label">${escapeHtml(item.label)}</div>
          <div class="metric-value">${escapeHtml(item.value)}</div>
        </div>`
        )
        .join("")}
    </div>
  `;
}

function buildCardHtml(
  title: string,
  body: string,
  options?: { risk?: boolean; badges?: string[] }
): string {
  const badgeHtml =
    options?.badges && options.badges.length > 0
      ? `<div class="badge-row">${options.badges
          .map((badge) => `<span class="badge">${escapeHtml(badge)}</span>`)
          .join("")}</div>`
      : "";

  return `
    <section class="card${options?.risk ? " is-risk" : ""}">
      <h3>${escapeHtml(title)}</h3>
      ${badgeHtml}
      ${body}
    </section>
  `;
}

function buildSectionHtml(
  title: string,
  summaryText: string,
  body: string,
  open = true
): string {
  return `
    <details class="section" ${open ? "open" : ""}>
      <summary>
        <span class="section-title">${escapeHtml(title)}</span>
        <span class="section-summary">${escapeHtml(summaryText)}</span>
      </summary>
      <div class="section-grid">
        ${body}
      </div>
    </details>
  `;
}

function buildHardwareReportHtml(snapshot: HardwareInspectorSnapshot): string {
  const systemName =
    [snapshot.computerSystem.manufacturer, snapshot.computerSystem.model]
      .filter(Boolean)
      .join(" ") || "未知设备";
  const riskDiskCount = snapshot.disks.filter((disk) => isRiskDisk(disk)).length;

  const overviewHtml = `
    <section class="overview">
      ${[
        { label: "设备", value: systemName },
        {
          label: "系统",
          value:
            [snapshot.operatingSystem.caption, snapshot.operatingSystem.buildNumber]
              .filter(Boolean)
              .join(" / ") || "未知"
        },
        { label: "CPU", value: snapshot.cpus[0]?.name ?? "未知 CPU" },
        { label: "总内存", value: formatBytes(snapshot.computerSystem.totalPhysicalMemory) },
        { label: "显卡", value: `${snapshot.gpus.length} 张` },
        { label: "磁盘", value: `${snapshot.disks.length} 块` },
        { label: "风险磁盘", value: riskDiskCount > 0 ? `${riskDiskCount} 块` : "无" }
      ]
        .map(
          (item) => `
        <div class="overview-item">
          <div class="overview-label">${escapeHtml(item.label)}</div>
          <div class="overview-value">${escapeHtml(item.value)}</div>
        </div>`
        )
        .join("")}
    </section>
  `;

  const cpuHtml = snapshot.cpus
    .map((cpu, index) =>
      buildCardHtml(
        `处理器 ${index + 1}`,
        buildMetricGridHtml([
          { label: "型号", value: formatText(cpu.name) },
          { label: "厂商", value: formatText(cpu.manufacturer) },
          { label: "插槽", value: formatText(cpu.socketDesignation) },
          {
            label: "核心 / 线程",
            value: `${cpu.numberOfCores ?? "?"} / ${cpu.numberOfLogicalProcessors ?? "?"}`
          },
          { label: "最大频率", value: formatClock(cpu.maxClockSpeed) },
          { label: "当前频率", value: formatClock(cpu.currentClockSpeed) },
          { label: "温度(可选)", value: formatTemperature(cpu.temperatureCelsius) },
          { label: "温度来源", value: formatOptionalText(cpu.temperatureSource) },
          { label: "架构", value: formatText(cpu.architecture) },
          { label: "虚拟化", value: formatBoolean(cpu.virtualizationFirmwareEnabled) }
        ])
      )
    )
    .join("");

  const memoryHtml = snapshot.memoryModules
    .map((memory, index) =>
      buildCardHtml(
        memory.deviceLocator || memory.bankLabel || `内存 ${index + 1}`,
        buildMetricGridHtml([
          { label: "容量", value: formatBytes(memory.capacity) },
          { label: "频率", value: formatClock(memory.configuredClockSpeed || memory.speed) },
          { label: "类型", value: formatText(memory.memoryType) },
          { label: "形态", value: formatText(memory.formFactor) },
          { label: "厂商", value: formatText(memory.manufacturer) },
          { label: "型号", value: formatText(memory.partNumber) }
        ])
      )
    )
    .join("");

  const gpuHtml = snapshot.gpus
    .map((gpu, index) =>
      buildCardHtml(
        gpu.name || `显卡 ${index + 1}`,
        buildMetricGridHtml([
          { label: "厂商", value: formatText(gpu.manufacturer) },
          { label: "显存", value: formatBytes(gpu.adapterRam) },
          { label: "驱动版本", value: formatText(gpu.driverVersion) },
          { label: "驱动日期", value: formatReportDate(gpu.driverDate) },
          { label: "视频处理器", value: formatText(gpu.videoProcessor) },
          { label: "温度(可选)", value: formatTemperature(gpu.temperatureCelsius) },
          { label: "温度来源", value: formatOptionalText(gpu.temperatureSource) },
          { label: "状态", value: formatText(gpu.status) }
        ])
      )
    )
    .join("");

  const diskHtml = snapshot.disks
    .map((disk, index) => {
      const partitionHtml =
        disk.partitions.length > 0
          ? `
            <details class="sub-details">
              <summary>分区 ${disk.partitions.length} 个 / 卷 ${countDiskVolumes(disk)} 个</summary>
              <div class="sub-list">
                ${disk.partitions
                  .map((partition) => {
                    const volumeHtml =
                      partition.volumes.length > 0
                        ? `
                          <div class="volume-list">
                            ${partition.volumes
                              .map(
                                (volume) => `
                              <div class="volume-item">
                                <div class="sub-title">${escapeHtml(
                                  [formatText(volume.deviceId), formatText(volume.volumeName)]
                                    .filter((text) => text !== "未知")
                                    .join(" / ") || "卷"
                                )}</div>
                                ${buildMetricGridHtml([
                                  { label: "文件系统", value: formatText(volume.fileSystem) },
                                  { label: "总空间", value: formatBytes(volume.size) },
                                  { label: "可用空间", value: formatBytes(volume.freeSpace) },
                                  { label: "驱动器类型", value: formatDriveType(volume.driveType) }
                                ])}
                              </div>`
                              )
                              .join("")}
                          </div>`
                        : "";

                    return `
                      <div class="sub-item">
                        <div class="sub-title">${escapeHtml(
                          formatText(partition.name || `分区 ${partition.index ?? "?"}`)
                        )}</div>
                        ${buildMetricGridHtml([
                          { label: "容量", value: formatBytes(partition.size) },
                          { label: "类型", value: formatText(partition.type) },
                          {
                            label: "启动分区",
                            value: formatBoolean(partition.bootPartition)
                          }
                        ])}
                        ${volumeHtml}
                      </div>`;
                  })
                  .join("")}
              </div>
            </details>`
          : `<div class="muted">未采集到分区信息</div>`;

      return buildCardHtml(
        disk.model || `磁盘 ${index + 1}`,
        buildMetricGridHtml([
          { label: "容量", value: formatBytes(disk.size) },
          { label: "媒体类型", value: formatText(disk.storageMediaType || disk.mediaType) },
          { label: "总线", value: formatText(disk.busType || disk.interfaceType) },
          {
            label: "健康状态",
            value: formatText(disk.healthStatus),
            tone: isRiskDisk(disk) ? "danger" : "success"
          },
          {
            label: "运行状态",
            value: formatText(disk.operationalStatus),
            tone: isRiskDisk(disk) ? "warning" : "success"
          },
          { label: "温度", value: formatTemperature(disk.temperatureCelsius) },
          { label: "最高温度", value: formatTemperature(disk.temperatureMaxCelsius) },
          {
            label: "磨损",
            value:
              typeof disk.wearPercentage === "number" && Number.isFinite(disk.wearPercentage)
                ? `${disk.wearPercentage}%`
                : "不可用"
          },
          {
            label: "通电时长",
            value:
              typeof disk.powerOnHours === "number" && Number.isFinite(disk.powerOnHours)
                ? `${disk.powerOnHours} 小时`
                : "不可用"
          },
          { label: "固件", value: formatText(disk.firmwareVersion || disk.firmwareRevision) },
          { label: "转速", value: formatRpm(disk.spindleSpeed) },
          { label: "逻辑扇区", value: formatSectorSize(disk.logicalSectorSize) },
          { label: "物理扇区", value: formatSectorSize(disk.physicalSectorSize) }
        ]) + partitionHtml,
        {
          risk: isRiskDisk(disk),
          badges: [
            formatText(disk.storageMediaType || disk.mediaType),
            formatText(disk.busType || disk.interfaceType),
            formatText(disk.healthStatus)
          ]
        }
      );
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>LiteLauncher 硬件检测报告</title>
  <style>
    :root { color-scheme: dark; }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 24px;
      background: radial-gradient(circle at top, #1e293b 0, #0f172a 52%, #020617 100%);
      color: #e2e8f0;
      font: 14px/1.5 "Segoe UI", "Microsoft YaHei UI", sans-serif;
    }
    h1, h2, h3, p { margin: 0; }
    .page { display: grid; gap: 18px; max-width: 1360px; margin: 0 auto; }
    .hero {
      display: grid;
      gap: 8px;
      padding: 20px 22px;
      border-radius: 18px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(15, 23, 42, 0.78);
      box-shadow: 0 18px 40px rgba(2, 6, 23, 0.24);
    }
    .hero-title { font-size: 28px; font-weight: 700; color: #f8fafc; }
    .hero-meta { color: rgba(226, 232, 240, 0.8); font-size: 13px; }
    .hero-note {
      margin-top: 4px;
      padding: 10px 12px;
      border-radius: 12px;
      border: 1px solid rgba(125, 211, 252, 0.16);
      background: rgba(15, 35, 52, 0.58);
      color: #cdefff;
      font-size: 12px;
    }
    .overview, .section-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 10px;
    }
    .overview-item, .card {
      padding: 14px;
      border-radius: 14px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(30, 41, 59, 0.78);
    }
    .overview-label, .metric-label { font-size: 12px; color: rgba(226, 232, 240, 0.62); }
    .overview-value {
      margin-top: 6px;
      font-size: 15px;
      font-weight: 700;
      color: #f8fafc;
      overflow-wrap: anywhere;
    }
    .section {
      display: grid;
      gap: 12px;
      padding: 12px;
      border-radius: 16px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.52);
    }
    .section > summary {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      cursor: pointer;
      list-style: none;
    }
    .section > summary::-webkit-details-marker,
    .sub-details > summary::-webkit-details-marker {
      display: none;
    }
    .section-title { font-size: 18px; font-weight: 700; color: #7dd3fc; }
    .section-summary { color: rgba(226, 232, 240, 0.72); font-size: 12px; }
    .section-grid { margin-top: 12px; }
    .card { display: grid; gap: 10px; }
    .card.is-risk {
      border-color: rgba(248, 113, 113, 0.38);
      background: linear-gradient(180deg, rgba(91, 25, 33, 0.18), rgba(30, 41, 59, 0.82) 36%);
    }
    .card h3 {
      font-size: 14px;
      font-weight: 700;
      color: #f8fafc;
      overflow-wrap: anywhere;
    }
    .badge-row { display: flex; flex-wrap: wrap; gap: 6px; }
    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 22px;
      padding: 0 8px;
      border-radius: 999px;
      background: rgba(15, 23, 42, 0.48);
      border: 1px solid rgba(148, 163, 184, 0.16);
      color: rgba(226, 232, 240, 0.9);
      font-size: 11px;
    }
    .metric-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 8px;
    }
    .metric-item {
      padding: 8px 10px;
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.48);
    }
    .metric-item[data-tone="success"] {
      box-shadow: inset 0 0 0 1px rgba(74, 222, 128, 0.22);
      background: rgba(20, 69, 43, 0.32);
    }
    .metric-item[data-tone="warning"] {
      box-shadow: inset 0 0 0 1px rgba(250, 204, 21, 0.22);
      background: rgba(84, 58, 0, 0.28);
    }
    .metric-item[data-tone="danger"] {
      box-shadow: inset 0 0 0 1px rgba(248, 113, 113, 0.22);
      background: rgba(91, 25, 33, 0.3);
    }
    .metric-value {
      margin-top: 4px;
      color: #f8fafc;
      overflow-wrap: anywhere;
      font-family: Consolas, "Courier New", monospace;
      font-size: 12px;
    }
    .sub-details {
      margin-top: 4px;
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.16);
      background: rgba(15, 23, 42, 0.36);
    }
    .sub-details > summary {
      cursor: pointer;
      color: #cdefff;
      font-size: 12px;
      font-weight: 600;
    }
    .sub-list, .volume-list {
      display: grid;
      gap: 8px;
      margin-top: 10px;
    }
    .sub-item, .volume-item {
      padding: 10px;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.14);
      background: rgba(2, 6, 23, 0.28);
    }
    .sub-title {
      margin-bottom: 8px;
      color: #c7e9ff;
      font-weight: 700;
      font-size: 12px;
      overflow-wrap: anywhere;
    }
    .muted {
      color: rgba(226, 232, 240, 0.58);
      font-size: 12px;
    }
    @media (max-width: 760px) {
      body { padding: 14px; }
      .section > summary { flex-direction: column; align-items: flex-start; }
      .metric-grid, .overview, .section-grid { grid-template-columns: minmax(0, 1fr); }
    }
  </style>
</head>
<body>
  <main class="page">
    <section class="hero">
      <div class="hero-title">硬件检测报告</div>
      <div class="hero-meta">采集时间：${escapeHtml(formatReportDate(snapshot.collectedAt))}</div>
      <div class="hero-meta">设备：${escapeHtml(systemName)}</div>
      <div class="hero-meta">系统：${escapeHtml(
        [snapshot.operatingSystem.caption, snapshot.operatingSystem.buildNumber]
          .filter(Boolean)
          .join(" / ") || "未知"
      )}</div>
      <div class="hero-note">温度说明：CPU 温度可能来自 ACPI 热区或本机硬件监控命名空间，仅作参考；GPU 温度仅在系统存在可读监控源时显示。磁盘温度优先使用 Windows 存储可靠性计数器。</div>
    </section>
    ${overviewHtml}
    ${buildSectionHtml("CPU", `共 ${snapshot.cpus.length} 颗`, cpuHtml)}
    ${buildSectionHtml("内存", `共 ${snapshot.memoryModules.length} 条`, memoryHtml)}
    ${buildSectionHtml("显卡", `共 ${snapshot.gpus.length} 张`, gpuHtml)}
    ${buildSectionHtml(
      "存储",
      `共 ${snapshot.disks.length} 块${riskDiskCount > 0 ? ` / 风险 ${riskDiskCount} 块` : ""}`,
      diskHtml
    )}
  </main>
</body>
</html>`;
}
function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: TITLE,
    subtitle: SUBTITLE,
    target: buildTarget("open"),
    iconPath: getIconDataUrl(),
    keywords: [
      "plugin",
      "hardware",
      "systeminfo",
      "cpu",
      "gpu",
      "disk",
      "memory",
      "mainboard",
      "bios",
      "硬件",
      "硬件检测",
      "系统信息",
      "主板",
      "显卡",
      "硬盘",
      "内存"
    ]
  };
}

function parseCommand(optionsText: string | undefined): HardwareInspectorCommand {
  if (!optionsText) {
    return { action: "open" };
  }

  const params = new URLSearchParams(optionsText);
  const action = (params.get("action") ?? "open").trim().toLowerCase();
  return {
    action:
      action === "refresh"
        ? "refresh"
        : action === "export-report"
          ? "export-report"
          : action === "export-html"
            ? "export-html"
            : "open"
  };
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return QUERY_ALIASES.some((alias) => {
    const next = alias.trim().toLowerCase();
    return next ? normalized === next || normalized.startsWith(`${next} `) : false;
  });
}

function buildSummaryInfo(snapshot: HardwareInspectorSnapshot): string {
  const cpu = snapshot.cpus[0]?.name ?? "未知 CPU";
  const board =
    [snapshot.baseBoard.manufacturer, snapshot.baseBoard.product].filter(Boolean).join(" ") ||
    "未知主板";
  const memoryCount = snapshot.memoryModules.length;
  const gpuCount = snapshot.gpus.length;
  const diskCount = snapshot.disks.length;
  return `${cpu} / ${board} / 内存 ${memoryCount} 条 / 显卡 ${gpuCount} 张 / 磁盘 ${diskCount} 块`;
}

async function executeRefresh(): Promise<ExecuteResult> {
  try {
    const snapshot = await collectHardwareInspectorSnapshot();
    return {
      ok: true,
      keepOpen: true,
      message: "硬件信息采集完成",
      data: {
        snapshot,
        info: buildSummaryInfo(snapshot),
        error: ""
      }
    };
  } catch (error) {
    const message =
        error instanceof Error && error.message ? error.message : "硬件信息采集失败";
    return {
      ok: false,
      keepOpen: true,
      message,
      data: {
        error: message
      }
    };
  }
}

async function exportReport(
  context: Parameters<LauncherPlugin["execute"]>[1],
  format: "markdown" | "html"
): Promise<ExecuteResult> {
  try {
    const snapshot = await collectHardwareInspectorSnapshot();
    const report =
      format === "html" ? buildHardwareReportHtml(snapshot) : buildHardwareReport(snapshot);
    const defaultPath = path.join(
      app.getPath("documents"),
      format === "html" ? formatReportHtmlFileName() : formatReportFileName()
    );
    const result = await dialog.showSaveDialog(context.window, {
      title: format === "html" ? "导出硬件 HTML 报告" : "导出硬件 Markdown 报告",
      defaultPath,
      filters: [
        ...(format === "html"
          ? [{ name: "HTML", extensions: ["html"] }]
          : [{ name: "Markdown", extensions: ["md"] }]),
        { name: "文本文件", extensions: ["txt"] }
      ]
    });

    if (result.canceled || !result.filePath) {
      return {
        ok: true,
        keepOpen: true,
        message: format === "html" ? "已取消导出 HTML 报告" : "已取消导出 Markdown 报告",
        data: {
          snapshot,
          info: buildSummaryInfo(snapshot),
          error: ""
        }
      };
    }

    await fs.writeFile(result.filePath, report, "utf8");
    return {
      ok: true,
      keepOpen: true,
      message: `已导出${format === "html" ? " HTML" : " Markdown"}报告：${path.basename(result.filePath)}`,
      data: {
        snapshot,
        info: buildSummaryInfo(snapshot),
        error: "",
        reportPath: result.filePath
      }
    };
  } catch (error) {
    const message =
      error instanceof Error && error.message
        ? error.message
        : format === "html"
          ? "导出硬件 HTML 报告失败"
          : "导出硬件 Markdown 报告失败";
    return {
      ok: false,
      keepOpen: true,
      message,
      data: {
        error: message
      }
    };
  }
}

export const hardwareInspectorPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: TITLE,
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const command = parseCommand(optionsText);

    if (command.action === "open") {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: TITLE,
        subtitle: SUBTITLE,
        data: {
          loading: false,
          info: ""
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: `已打开${TITLE}`
      };
    }

    if (command.action === "refresh") {
      return executeRefresh();
    }

    return exportReport(context, command.action === "export-html" ? "html" : "markdown");
  }
};

