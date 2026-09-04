export type HardwareInspectorVendorSource =
  | "manufacturer"
  | "pnp-id"
  | "model"
  | "unknown";

export type HardwareInspectorVendorConfidence =
  | "exact"
  | "alias"
  | "inferred"
  | "unknown";

export interface HardwareInspectorVendorInfo {
  id: string | null;
  displayName: string | null;
  englishName: string | null;
  originalName: string | null;
  source: HardwareInspectorVendorSource;
  confidence: HardwareInspectorVendorConfidence;
}

export type HardwareInspectorVendorComponent =
  | "system"
  | "baseboard"
  | "bios"
  | "cpu"
  | "memory"
  | "gpu"
  | "disk";

interface HardwareInspectorVendorRule {
  id: string;
  displayName: string;
  englishName: string;
  aliases: string[];
  pciVendorIds?: string[];
  diskModelPatterns?: RegExp[];
}

const PLACEHOLDER_MANUFACTURERS = new Set([
  "",
  "standarddiskdrives",
  "standarddiskdrive",
  "tobefilledbyoem",
  "defaultstring",
  "systemmanufacturer",
  "oem",
  "unknown",
  "notspecified",
  "notavailable"
]);

const VENDOR_RULES: HardwareInspectorVendorRule[] = [
  {
    id: "intel",
    displayName: "英特尔",
    englishName: "Intel",
    aliases: ["genuineintel", "intel", "intelcorporation", "intelcorp"],
    pciVendorIds: ["8086"]
  },
  {
    id: "amd",
    displayName: "AMD",
    englishName: "AMD",
    aliases: [
      "authenticamd",
      "amd",
      "advancedmicrodevices",
      "advancedmicrodevicesinc",
      "ati"
    ],
    pciVendorIds: ["1002", "1022"]
  },
  {
    id: "nvidia",
    displayName: "英伟达",
    englishName: "NVIDIA",
    aliases: ["nvidia", "nvidiacorporation"],
    pciVendorIds: ["10de"]
  },
  {
    id: "kingston",
    displayName: "金士顿",
    englishName: "Kingston",
    aliases: ["kingston", "kingstontechnology", "kingstontechnologycompany"]
  },
  {
    id: "samsung",
    displayName: "三星",
    englishName: "Samsung",
    aliases: ["samsung", "samsungelectronics"],
    diskModelPatterns: [/^samsung\b/i, /^mz[a-z0-9]/i]
  },
  {
    id: "sk-hynix",
    displayName: "海力士",
    englishName: "SK hynix",
    aliases: ["skhynix", "hynix", "skhynixsemiconductor"],
    diskModelPatterns: [/^sk\s*hynix\b/i, /^hfs[a-z0-9]/i]
  },
  {
    id: "micron",
    displayName: "美光",
    englishName: "Micron",
    aliases: ["micron", "microntechnology", "microntechnologyinc"],
    diskModelPatterns: [/^micron\b/i]
  },
  {
    id: "crucial",
    displayName: "英睿达",
    englishName: "Crucial",
    aliases: ["crucial", "crucialtechnology"],
    diskModelPatterns: [/^crucial\b/i, /^ct\d+[a-z]/i]
  },
  {
    id: "gigabyte",
    displayName: "技嘉",
    englishName: "GIGABYTE",
    aliases: ["gigabyte", "gigabytetechnology", "gigabytetechnologycoltd"]
  },
  {
    id: "asus",
    displayName: "华硕",
    englishName: "ASUS",
    aliases: ["asus", "asustek", "asustekcomputer", "asustekcomputerinc"]
  },
  {
    id: "msi",
    displayName: "微星",
    englishName: "MSI",
    aliases: ["msi", "microstarinternational", "microstarinternationalcoltd"]
  },
  {
    id: "corsair",
    displayName: "海盗船",
    englishName: "Corsair",
    aliases: ["corsair", "corsairmemory"]
  },
  {
    id: "g-skill",
    displayName: "芝奇",
    englishName: "G.SKILL",
    aliases: ["gskill", "gskillinternational"]
  },
  {
    id: "seagate",
    displayName: "希捷",
    englishName: "Seagate",
    aliases: ["seagate", "seagatetechnology"],
    diskModelPatterns: [/^seagate\b/i, /^st\d+[a-z0-9-]*/i]
  },
  {
    id: "western-digital",
    displayName: "西部数据",
    englishName: "Western Digital",
    aliases: ["westerndigital", "wdc", "wd"],
    diskModelPatterns: [/^wdc\b/i, /^wd\d+[a-z0-9-]*/i, /^western\s+digital\b/i]
  },
  {
    id: "kioxia",
    displayName: "铠侠",
    englishName: "KIOXIA",
    aliases: ["kioxia"],
    diskModelPatterns: [/^kioxia\b/i]
  },
  {
    id: "toshiba",
    displayName: "东芝",
    englishName: "Toshiba",
    aliases: ["toshiba", "toshibacorporation"],
    diskModelPatterns: [/^toshiba\b/i, /^dt\d+[a-z0-9-]*/i]
  },
  {
    id: "plextor",
    displayName: "浦科特",
    englishName: "PLEXTOR",
    aliases: ["plextor"],
    diskModelPatterns: [/^plextor\b/i]
  },
  {
    id: "aigo",
    displayName: "爱国者",
    englishName: "aigo",
    aliases: ["aigo"],
    diskModelPatterns: [/^aigo\b/i]
  }
];

function cleanOriginalName(value: string | null | undefined): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeVendorText(value: string | null | undefined): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function isPlaceholderManufacturer(value: string | null): boolean {
  return PLACEHOLDER_MANUFACTURERS.has(normalizeVendorText(value));
}

function readPciVendorId(value: string | null | undefined): string | null {
  const match = /(?:^|[\\&])VEN_([0-9A-F]{4})(?:&|$)/i.exec(String(value ?? ""));
  return match ? match[1].toLowerCase() : null;
}

function buildVendorInfo(
  rule: HardwareInspectorVendorRule,
  originalName: string | null,
  source: HardwareInspectorVendorSource,
  confidence: HardwareInspectorVendorConfidence
): HardwareInspectorVendorInfo {
  return {
    id: rule.id,
    displayName: rule.displayName,
    englishName: rule.englishName,
    originalName,
    source,
    confidence
  };
}

export function resolveHardwareInspectorVendor(input: {
  component: HardwareInspectorVendorComponent;
  manufacturer?: string | null;
  pnpDeviceId?: string | null;
  model?: string | null;
}): HardwareInspectorVendorInfo {
  const originalName = cleanOriginalName(input.manufacturer);
  const manufacturerKey = normalizeVendorText(originalName);
  if (manufacturerKey && !isPlaceholderManufacturer(originalName)) {
    for (const rule of VENDOR_RULES) {
      const exactAlias = rule.aliases.find((alias) => manufacturerKey === alias);
      if (exactAlias) {
        return buildVendorInfo(rule, originalName, "manufacturer", "exact");
      }
    }
    for (const rule of VENDOR_RULES) {
      const matchedAlias = rule.aliases.find(
        (alias) => alias.length >= 3 && manufacturerKey.includes(alias)
      );
      if (matchedAlias) {
        return buildVendorInfo(rule, originalName, "manufacturer", "alias");
      }
    }
  }

  const pciVendorId = readPciVendorId(input.pnpDeviceId);
  if (pciVendorId) {
    const rule = VENDOR_RULES.find((candidate) =>
      candidate.pciVendorIds?.includes(pciVendorId)
    );
    if (rule) {
      return buildVendorInfo(rule, originalName, "pnp-id", "exact");
    }
  }

  if (input.component === "disk") {
    const model = String(input.model ?? "").trim();
    if (model) {
      const rule = VENDOR_RULES.find((candidate) =>
        candidate.diskModelPatterns?.some((pattern) => pattern.test(model))
      );
      if (rule) {
        return buildVendorInfo(rule, originalName, "model", "inferred");
      }
    }
  }

  const usableOriginal = originalName && !isPlaceholderManufacturer(originalName)
    ? originalName
    : null;
  return {
    id: null,
    displayName: usableOriginal,
    englishName: usableOriginal,
    originalName: usableOriginal,
    source: usableOriginal ? "manufacturer" : "unknown",
    confidence: "unknown"
  };
}

export function formatHardwareInspectorVendorName(
  vendor: HardwareInspectorVendorInfo | null | undefined,
  fallback?: string | null
): string {
  return vendor?.displayName || cleanOriginalName(fallback) || "未提供";
}
