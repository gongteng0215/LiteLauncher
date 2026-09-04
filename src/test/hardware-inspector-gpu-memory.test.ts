import assert from "node:assert/strict";
import test from "node:test";

import {
  classifyHardwareInspectorGpuMemory,
  normalizeHardwareInspectorGpuMemory
} from "../main/plugins/hardware-inspector/collector";
import { resolveHardwareInspectorVendor } from "../main/plugins/hardware-inspector/vendor-resolver";

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

test("hardware inspector distinguishes verified discrete memory from integrated shared memory", () => {
  const nvidiaVendor = resolveHardwareInspectorVendor({
    component: "gpu",
    manufacturer: "NVIDIA"
  });
  assert.deepEqual(
    classifyHardwareInspectorGpuMemory("NVIDIA GeForce RTX 5070 Ti", nvidiaVendor, {
      adapterRam: 12 * GIB,
      adapterRamSource: "registry-qword"
    }),
    {
      memoryKind: "dedicated",
      memoryVerified: true,
      sharedMemoryBytes: null
    }
  );

  const intelVendor = resolveHardwareInspectorVendor({
    component: "gpu",
    manufacturer: "Intel Corporation"
  });
  assert.deepEqual(
    classifyHardwareInspectorGpuMemory("Intel(R) Iris(R) Xe Graphics", intelVendor, {
      adapterRam: 1024 ** 3,
      adapterRamSource: "wmi-uint32"
    }),
    {
      memoryKind: "shared-dynamic",
      memoryVerified: false,
      sharedMemoryBytes: null
    }
  );
});
