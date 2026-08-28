import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const collectorPath = path.join(
  process.cwd(),
  "src",
  "main",
  "plugins",
  "hardware-inspector",
  "collector.ts"
);
const pluginPath = path.join(
  process.cwd(),
  "src",
  "main",
  "plugins",
  "hardware-inspector",
  "index.ts"
);
const hardwarePanelPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "panel-modules",
  "hardware-panel.ts"
);

test("hardware inspector collector uses cache and fast scan defaults", () => {
  const collectorSource = fs.readFileSync(collectorPath, "utf8");

  assert.match(
    collectorSource,
    /const SNAPSHOT_CACHE_TTL_MS = 60_000;/,
    "hardware inspector should cache snapshots in the main process for a short TTL"
  );
  assert.match(
    collectorSource,
    /export function getCachedHardwareInspectorSnapshot\(\): HardwareInspectorSnapshot \| null/,
    "hardware inspector should expose cached snapshots for fast panel opens"
  );
  assert.match(
    collectorSource,
    /collectHardwareInspectorSnapshot\([\s\S]*options: \{ force\?: boolean \}/,
    "hardware inspector collection should support bypassing the cache on manual refresh"
  );
  assert.match(
    collectorSource,
    /timeout: COLLECTION_TIMEOUT_MS/,
    "hardware inspector collection should fail fast instead of hanging forever"
  );
  assert.doesNotMatch(
    collectorSource,
    /Get-PhysicalDisk \| Get-StorageReliabilityCounter/,
    "hardware inspector fast scan should skip the slow storage reliability counter query"
  );
  assert.doesNotMatch(
    collectorSource,
    /root\/LibreHardwareMonitor/,
    "hardware inspector fast scan should skip slow third-party monitor namespace probes"
  );
  assert.match(
    collectorSource,
    /HardwareInformation\.qwMemorySize/,
    "GPU memory collection should prefer the display driver's 64-bit memory value"
  );
  assert.match(
    collectorSource,
    /--query-gpu=name,memory\.total/,
    "GPU memory collection should use NVIDIA's driver tool as an optional exact fallback"
  );
  assert.match(
    collectorSource,
    /wmi-uint32-limited/,
    "saturated 32-bit WMI memory values should be marked as unreliable instead of shown as 4 GB"
  );
});

test("hardware inspector plugin reuses cached snapshots on open and export", () => {
  const pluginSource = fs.readFileSync(pluginPath, "utf8");
  const panelSource = fs.readFileSync(hardwarePanelPath, "utf8");
  const reportImagePath = path.join(
    process.cwd(),
    "src",
    "main",
    "plugins",
    "hardware-inspector",
    "report-image.ts"
  );
  const reportImageSource = fs.readFileSync(reportImagePath, "utf8");

  assert.match(
    pluginSource,
    /const cachedSnapshot = getCachedHardwareInspectorSnapshot\(\);[\s\S]*snapshot: cachedSnapshot/,
    "hardware inspector open should pass a cached snapshot to the renderer when available"
  );
  assert.match(
    pluginSource,
    /async function executeRefresh\(force = true\)[\s\S]*collectHardwareInspectorSnapshot\(\{ force \}\)/,
    "manual refresh should bypass the cached snapshot"
  );
  assert.match(
    pluginSource,
    /collectHardwareInspectorSnapshot\(\{ force: false \}\)/,
    "export should reuse the cached snapshot instead of rescanning immediately"
  );
  assert.match(
    pluginSource,
    /export-image[\s\S]*renderHardwareReportImage/,
    "hardware inspector should export infographic-style PNG reports"
  );
  assert.match(
    pluginSource,
    /export-image-compact[\s\S]*exportImage\(context, "compact"\)/,
    "hardware inspector should support a compact image export variant"
  );
  assert.match(
    reportImageSource,
    /variant: HardwareReportImageVariant = "full"/,
    "hardware inspector image report should support full and compact variants"
  );
  for (const sectionTitle of [
    "电脑硬件配置报告",
    "电脑硬件配置速览",
    "处理器详情",
    "显卡详情",
    "磁盘健康与 SMART",
    "分区与卷",
    "温度与传感器",
    "建议接法"
  ]) {
    assert.ok(
      reportImageSource.includes(sectionTitle),
      `hardware inspector image report should include the "${sectionTitle}" section`
    );
  }
  assert.match(
    reportImageSource,
    /webContents\.capturePage\(\)/,
    "hardware inspector image export should render HTML in an offscreen window"
  );
  assert.match(
    panelSource,
    /if \(snapshot\) \{[\s\S]*applyHardwareInspectorSnapshot\(snapshot, hardwareInspectorInfo\)/,
    "hardware inspector panel open should apply cached snapshots without forcing a rescan"
  );
  assert.match(
    panelSource,
    /executeHardwareInspectorExportReport\("image"\)/,
    "hardware inspector panel should expose an export image action"
  );
  assert.match(
    panelSource,
    /executeHardwareInspectorExportReport\("image-compact"\)/,
    "hardware inspector panel should expose a compact export image action"
  );
  assert.match(
    pluginSource,
    /preview-image[\s\S]*previewImageDataUrl/,
    "hardware inspector should generate inline preview images for the panel"
  );
  assert.match(
    panelSource,
    /hardware-inspector-preview/,
    "hardware inspector panel should render a right-side preview column"
  );
  assert.match(
    panelSource,
    /loadHardwareInspectorPreview/,
    "hardware inspector panel should load preview images after snapshot collection"
  );
  assert.match(
    panelSource,
    /if \(!hardwareInspectorSnapshot && !hardwareInspectorLoading && !hardwareInspectorError\)/,
    "hardware inspector should only auto-scan when no snapshot is already available"
  );
});
