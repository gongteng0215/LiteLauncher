import { randomInt, randomUUID } from "node:crypto";

import { IPC_CHANNELS } from "../../../shared/channels";
import { ExecuteResult, LaunchItem } from "../../../shared/types";
import { getWebtoolsIconDataUrl } from "../webtools-shared";
import { LauncherPlugin } from "../types";

type DataMaskAction = "open" | "mask" | "generate";
type FakeDataKind = "name" | "email" | "phone" | "uuid" | "company";

interface DataMaskCommand {
  action: DataMaskAction;
  input: string;
  maskPhone: boolean;
  maskEmail: boolean;
  maskIdCard: boolean;
  fakeKind: FakeDataKind;
  fakeCount: number;
}

const PLUGIN_ID = "webtools-data-mask";
const ACTION_OPEN: DataMaskAction = "open";
const QUERY_ALIASES = [
  "wt-mask",
  "data-mask",
  "脱敏",
  "假数据",
  "测试数据",
  "mask"
];

const DEFAULT_INPUT =
  "联系人：张三，手机 13812345678，邮箱 zhangsan@example.com，身份证 110101199001011234";

const FAKE_NAMES = ["张三", "李四", "王五", "赵六", "陈七", "刘八"];
const FAKE_COMPANIES = ["星河科技", "云杉数据", "北辰软件", "青禾网络", "明途信息"];

function buildTarget(command: DataMaskCommand): string {
  const params = new URLSearchParams();
  params.set("action", command.action);
  params.set("input", command.input);
  params.set("maskPhone", command.maskPhone ? "1" : "0");
  params.set("maskEmail", command.maskEmail ? "1" : "0");
  params.set("maskIdCard", command.maskIdCard ? "1" : "0");
  params.set("fakeKind", command.fakeKind);
  params.set("fakeCount", String(command.fakeCount));
  return `command:plugin:${PLUGIN_ID}?${params.toString()}`;
}

function parseBoolean(value: string | null, fallback = true): boolean {
  if (value === "1" || value === "true") {
    return true;
  }
  if (value === "0" || value === "false") {
    return false;
  }
  return fallback;
}

function parseFakeKind(value: string | null): FakeDataKind {
  const normalized = (value ?? "uuid").trim().toLowerCase();
  if (
    normalized === "name" ||
    normalized === "email" ||
    normalized === "phone" ||
    normalized === "uuid" ||
    normalized === "company"
  ) {
    return normalized;
  }
  return "uuid";
}

function clampCount(value: number): number {
  if (!Number.isFinite(value)) {
    return 5;
  }
  return Math.max(1, Math.min(50, Math.round(value)));
}

function parseCommand(optionsText: string | undefined): DataMaskCommand {
  if (!optionsText) {
    return {
      action: ACTION_OPEN,
      input: DEFAULT_INPUT,
      maskPhone: true,
      maskEmail: true,
      maskIdCard: true,
      fakeKind: "uuid",
      fakeCount: 5
    };
  }

  const params = new URLSearchParams(optionsText);
  const actionRaw = (params.get("action") ?? ACTION_OPEN).trim().toLowerCase();
  const action: DataMaskAction =
    actionRaw === "mask" || actionRaw === "generate" ? actionRaw : ACTION_OPEN;

  return {
    action,
    input: params.get("input") ?? DEFAULT_INPUT,
    maskPhone: parseBoolean(params.get("maskPhone"), true),
    maskEmail: parseBoolean(params.get("maskEmail"), true),
    maskIdCard: parseBoolean(params.get("maskIdCard"), true),
    fakeKind: parseFakeKind(params.get("fakeKind")),
    fakeCount: clampCount(Number(params.get("fakeCount") ?? "5"))
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
    title: "文本脱敏 / 假数据",
    subtitle: "手机号、邮箱、身份证脱敏与测试数据生成",
    iconPath: getWebtoolsIconDataUrl(PLUGIN_ID),
    target: buildTarget(parseCommand(undefined)),
    keywords: ["plugin", "webtools", "mask", "fake", "脱敏", "假数据", "测试"]
  };
}

function maskPhone(value: string): string {
  return value.replace(/(?<!\d)(1[3-9]\d)(\d{4})(\d{4})(?!\d)/g, "$1****$3");
}

function maskEmail(value: string): string {
  return value.replace(
    /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*(@[A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
    "$1***$2"
  );
}

function maskIdCard(value: string): string {
  return value.replace(/(?<!\d)(\d{6})\d{8}(\d{4})(?!\d)/gi, "$1********$2");
}

export function maskSensitiveText(
  input: string,
  options: Pick<DataMaskCommand, "maskPhone" | "maskEmail" | "maskIdCard">
): string {
  let output = input;
  if (options.maskPhone) {
    output = maskPhone(output);
  }
  if (options.maskEmail) {
    output = maskEmail(output);
  }
  if (options.maskIdCard) {
    output = maskIdCard(output);
  }
  return output;
}

function randomPhone(): string {
  const prefix = `1${randomInt(3, 9)}${randomInt(0, 9)}`;
  const suffix = String(randomInt(0, 99999999)).padStart(8, "0");
  return `${prefix}${suffix}`;
}

function randomEmail(index: number): string {
  return `user${index}_${randomInt(100, 999)}@example.com`;
}

export function generateFakeData(kind: FakeDataKind, count: number): string[] {
  const lines: string[] = [];
  for (let index = 0; index < count; index += 1) {
    switch (kind) {
      case "name":
        lines.push(FAKE_NAMES[index % FAKE_NAMES.length] ?? `用户${index + 1}`);
        break;
      case "email":
        lines.push(randomEmail(index + 1));
        break;
      case "phone":
        lines.push(randomPhone());
        break;
      case "company":
        lines.push(FAKE_COMPANIES[index % FAKE_COMPANIES.length] ?? `测试公司${index + 1}`);
        break;
      case "uuid":
      default:
        lines.push(randomUUID());
        break;
    }
  }
  return lines;
}

function executeMask(command: DataMaskCommand): ExecuteResult {
  const output = maskSensitiveText(command.input, command);
  return {
    ok: true,
    keepOpen: true,
    message: "脱敏完成",
    data: {
      output,
      mode: "mask"
    }
  };
}

function executeGenerate(command: DataMaskCommand): ExecuteResult {
  const lines = generateFakeData(command.fakeKind, command.fakeCount);
  return {
    ok: true,
    keepOpen: true,
    message: `已生成 ${lines.length} 条${command.fakeKind} 假数据`,
    data: {
      output: lines.join("\n"),
      mode: "generate",
      fakeKind: command.fakeKind,
      fakeCount: command.fakeCount
    }
  };
}

export const webtoolsDataMaskPlugin: LauncherPlugin = {
  id: PLUGIN_ID,
  name: "文本脱敏 / 假数据",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query: string) {
    if (!matchesAlias(query)) {
      return [];
    }
    return [createCatalogItem()];
  },
  async execute(optionsText, context) {
    const command = parseCommand(optionsText);

    if (command.action === ACTION_OPEN) {
      context.window.webContents.send(IPC_CHANNELS.openPanel, {
        panel: "plugin",
        pluginId: PLUGIN_ID,
        title: "文本脱敏 / 假数据",
        subtitle: "日志分享前脱敏，或一键生成测试数据",
        data: {
          input: command.input,
          maskPhone: command.maskPhone,
          maskEmail: command.maskEmail,
          maskIdCard: command.maskIdCard,
          fakeKind: command.fakeKind,
          fakeCount: command.fakeCount
        }
      });
      return {
        ok: true,
        keepOpen: true,
        message: "已打开文本脱敏 / 假数据"
      };
    }

    if (command.action === "generate") {
      return executeGenerate(command);
    }

    return executeMask(command);
  }
};
