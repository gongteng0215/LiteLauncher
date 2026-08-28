import assert from "node:assert/strict";
import test from "node:test";

import { normalizeHardwareInspectorGpuMemory } from "../main/plugins/hardware-inspector/collector";

const GIB = 1024 ** 3;

test("hardware inspector prefers a 64-bit driver memory value over saturated WMI", () => {
  assert.deepEqual(
    normalizeHardwareInspectorGpuMemory(12 * GIB, "registry-qword", 4 * GIB - 1024 ** 2),
    { adapterRam: 12 * GIB, adapterRamSource: "registry-qword" }
  );
});

test("hardware inspector accepts NVIDIA driver memory as an exact fallback", () => {
  assert.deepEqual(normalizeHardwareInspectorGpuMemory(6 * GIB, "nvidia-smi", 0xffffffff), {
    adapterRam: 6 * GIB,
    adapterRamSource: "nvidia-smi"
  });
});

test("hardware inspector never reports the uint32 WMI ceiling as exact VRAM", () => {
  assert.deepEqual(normalizeHardwareInspectorGpuMemory(null, null, 4 * GIB - 1024 ** 2), {
    adapterRam: null,
    adapterRamSource: "wmi-uint32-limited"
  });
});

test("hardware inspector keeps smaller legacy WMI values as labeled compatibility data", () => {
  assert.deepEqual(normalizeHardwareInspectorGpuMemory(null, null, 2 * GIB), {
    adapterRam: 2 * GIB,
    adapterRamSource: "wmi-uint32"
  });
  assert.deepEqual(normalizeHardwareInspectorGpuMemory(null, null, null), {
    adapterRam: null,
    adapterRamSource: null
  });
});
