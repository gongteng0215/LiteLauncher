import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type UnitAction = "open" | "storage" | "screen";
type StorageUnit = "B" | "KB" | "MB" | "GB" | "TB";
type ScreenSource = "px" | "rem";

interface UnitCommand {
  action: UnitAction;
  storageValue: number;
  storageUnit: StorageUnit;
  pixel: number;
  rem: number;
  basePx: number;
  source: ScreenSource;
}

const PLUGIN_ID = "webtools-unit-convert";
const ACTION_OPEN: UnitAction = "open";
const QUERY_ALIASES = ["wt-unit", "unit-tool", "单位换算", "px", "rem", "容量"];

const STORAGE_FACTORS: Record<StorageUnit, number> = {
  B: 1,
  KB: 1024,
  MB: 1024 ** 2,
  GB: 1024 ** 3,
  TB: 1024 ** 4
};

function buildTarget(command: UnitCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("storageValue", String(command.storageValue));
  params.set("storageUnit", command.storageUnit);
  params.set("pixel", String(command.pixel));
  params.set("rem", String(command.rem));
  params.set("basePx", String(command.basePx));
  params.set("source", command.source);
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseStorageUnit(value: string | null): StorageUnit {
  const normalized = (value ?? "MB").trim().toUpperCase();
  if (normalized === "B" || normalized === "KB" || normalized === "MB" || normalized === "GB" || normalized === "TB") {
    return normalized;
  }
  return "MB";
}

function parseCommand(optionsText: string | undefined): UnitCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      storageValue: 1,
      storageUnit: "MB",
      pixel: 160,
      rem: 10,
      basePx: 16,
      source: "px"
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();

  return {
    action: actionRaw === "storage" || actionRaw === "screen" ? actionRaw : ACTION_OPEN,
    storageValue: Number(params.get("storageValue") ?? "1"),
    storageUnit: parseStorageUnit(params.get("storageUnit")),
    pixel: Number(params.get("pixel") ?? "160"),
    rem: Number(params.get("rem") ?? "10"),
    basePx: Number(params.get("basePx") ?? "16"),
    source: (params.get("source") ?? "px").trim().toLowerCase() === "rem" ? "rem" : "px"
  };
}

function matchesAlias(query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return false;
  }

  return QUERY_ALIASES.some((alias) => {
    const value = alias.trim().toLowerCase();
    return value ? normalized === value || normalized.startsWith(`${value} `) : false;
  });
}

function createCatalogItem(): LaunchItem {
  return {
    id: `plugin:${PLUGIN_ID}`,
    type: "command",
    title: "单位换算",
    subtitle: "存储容量与 px/rem 换算",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(parseCommand(undefined)),
    keywords: ["plugin", "webtools", "unit", "convert", "px", "rem", "容量", "换算"]
  };
}

function normalizeNumber(value: number, fallback: number): number {
  if (!Number.isFinite(value)) {
    return fallback;
  }
  return value;
}

function executeStorage(command: UnitCommand): ExecuteResult {
  const value = normalizeNumber(command.storageValue, 1);
  const unit = command.storageUnit;
  const bytes = value * STORAGE_FACTORS[unit];

  const results = Object.entries(STORAGE_FACTORS).reduce<Record<string, number>>((acc, [key, factor]) => {
    acc[key] = Number((bytes / factor).toFixed(8));
    return acc;
  }, {});

  return {
    ok: true,
    keepOpen: true,
    message: "容量换算完成",
    data: {
      action: "storage",
      input: `${value} ${unit}`,
      values: results
    }
  };
}

function executeScreen(command: UnitCommand): ExecuteResult {
  const basePx = Math.max(1, normalizeNumber(command.basePx, 16));
  let px = normalizeNumber(command.pixel, 160);
  let rem = normalizeNumber(command.rem, 10);

  if (command.source === "px") {
    rem = Number((px / basePx).toFixed(4));
  } else {
    px = Number((rem * basePx).toFixed(2));
  }

  return {
    ok: true,
    keepOpen: true,
    message: "屏幕单位换算完成",
    data: {
      action: "screen",
      px,
      rem,
      basePx
    }
  };
}

export const webtoolsUnitConvertPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "单位换算",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  execute(optionsText, context): ExecuteResult {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "单位换算",
        subtitle: "存储容量与 px/rem 换算",
        data: {
          storageValue: command.storageValue,
          storageUnit: command.storageUnit,
          pixel: command.pixel,
          rem: command.rem,
          basePx: command.basePx,
          source: command.source
        }
      });

      return {
        ok: true,
        keepOpen: true,
        message: "已打开单位换算"
      };
    }

    if (command.action === "storage") {
      return executeStorage(command);
    }

    return executeScreen(command);
  }
};
