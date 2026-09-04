import assert from "node:assert/strict";
import test from "node:test";

import {
  formatHardwareInspectorVendorName,
  resolveHardwareInspectorVendor
} from "../main/plugins/hardware-inspector/vendor-resolver";

test("hardware inspector localizes common CPU, memory and GPU manufacturers", () => {
  assert.equal(
    resolveHardwareInspectorVendor({ component: "cpu", manufacturer: "GenuineIntel" })
      .displayName,
    "英特尔"
  );
  assert.equal(
    resolveHardwareInspectorVendor({ component: "cpu", manufacturer: "AuthenticAMD" })
      .displayName,
    "AMD"
  );
  const kingston = resolveHardwareInspectorVendor({
    component: "memory",
    manufacturer: "Kingston"
  });
  assert.deepEqual(
    {
      id: kingston.id,
      displayName: kingston.displayName,
      englishName: kingston.englishName,
      originalName: kingston.originalName,
      source: kingston.source,
      confidence: kingston.confidence
    },
    {
      id: "kingston",
      displayName: "金士顿",
      englishName: "Kingston",
      originalName: "Kingston",
      source: "manufacturer",
      confidence: "exact"
    }
  );
  assert.equal(
    resolveHardwareInspectorVendor({ component: "gpu", manufacturer: "NVIDIA" })
      .displayName,
    "英伟达"
  );
});

test("hardware inspector resolves common memory and board aliases without network access", () => {
  const cases = [
    ["Samsung Electronics", "三星"],
    ["SK Hynix", "海力士"],
    ["Micron Technology", "美光"],
    ["Crucial", "英睿达"],
    ["Gigabyte Technology Co., Ltd.", "技嘉"],
    ["ASUSTeK COMPUTER INC.", "华硕"],
    ["Micro-Star International Co., Ltd.", "微星"]
  ] as const;
  for (const [manufacturer, expected] of cases) {
    assert.equal(
      resolveHardwareInspectorVendor({ component: "memory", manufacturer }).displayName,
      expected
    );
  }
});

test("hardware inspector uses PCI vendor IDs after missing manufacturer values", () => {
  assert.equal(
    resolveHardwareInspectorVendor({
      component: "gpu",
      manufacturer: null,
      pnpDeviceId: "PCI\\VEN_10DE&DEV_2D57&SUBSYS_00000000"
    }).displayName,
    "英伟达"
  );
  assert.equal(
    resolveHardwareInspectorVendor({
      component: "gpu",
      pnpDeviceId: "PCI\\VEN_8086&DEV_0412"
    }).displayName,
    "英特尔"
  );
});

test("hardware inspector labels safe disk model inference and rejects generic placeholders", () => {
  const seagate = resolveHardwareInspectorVendor({
    component: "disk",
    manufacturer: "(Standard disk drives)",
    model: "ST500DM002-1BD142"
  });
  assert.equal(seagate.displayName, "希捷");
  assert.equal(seagate.source, "model");
  assert.equal(seagate.confidence, "inferred");

  const unknown = resolveHardwareInspectorVendor({
    component: "memory",
    manufacturer: "To Be Filled By O.E.M.",
    model: "99U5403-159.A01LF"
  });
  assert.equal(unknown.displayName, null);
  assert.equal(formatHardwareInspectorVendorName(unknown), "未提供");
});
