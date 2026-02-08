import fs from "node:fs";
import path from "node:path";

import { LaunchItem } from "../shared/types";

const START_MENU_RELATIVE_PATH = path.join(
  "Microsoft",
  "Windows",
  "Start Menu",
  "Programs"
);

function getStartMenuDirs(): string[] {
  const dirs: string[] = [];
  const appData = process.env.APPDATA;
  const programData = process.env.PROGRAMDATA;

  if (appData) {
    dirs.push(path.join(appData, START_MENU_RELATIVE_PATH));
  }

  if (programData) {
    dirs.push(path.join(programData, START_MENU_RELATIVE_PATH));
  }

  return dirs;
}

function walkShortcutFiles(dirPath: string, result: string[]): void {
  let entries: fs.Dirent[];
  try {
    entries = fs.readdirSync(dirPath, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);

    if (entry.isDirectory()) {
      walkShortcutFiles(fullPath, result);
      continue;
    }

    if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".lnk") {
      result.push(fullPath);
    }
  }
}

function toKeywords(value: string): string[] {
  const baseTokens = value
    .toLowerCase()
    .split(/[\s._\-\\/]+/)
    .filter(Boolean);

  const initials = toPinyinInitialTokens(value);
  const merged = new Set<string>([...baseTokens, ...initials]);
  return Array.from(merged);
}

const PINYIN_BOUNDARIES = [
  "阿",
  "芭",
  "擦",
  "搭",
  "蛾",
  "发",
  "噶",
  "哈",
  "击",
  "喀",
  "垃",
  "妈",
  "拿",
  "哦",
  "啪",
  "期",
  "然",
  "撒",
  "塌",
  "挖",
  "昔",
  "压",
  "匝"
] as const;

const PINYIN_INITIALS = "abcdefghijklmnopqrstuvwxyz"
  .split("")
  .filter((letter) => !"iuv".includes(letter));

function isCjkChar(char: string): boolean {
  return /[\u3400-\u9fff]/.test(char);
}

function cjkToInitial(char: string): string {
  if (!isCjkChar(char)) {
    return "";
  }

  for (let i = PINYIN_BOUNDARIES.length - 1; i >= 0; i -= 1) {
    if (char.localeCompare(PINYIN_BOUNDARIES[i] ?? "", "zh-CN") >= 0) {
      return PINYIN_INITIALS[i] ?? "";
    }
  }

  return "";
}

function toPinyinInitialTokens(value: string): string[] {
  const parts: string[] = [];
  let current = "";

  for (const char of value) {
    const lower = char.toLowerCase();
    if (/[a-z0-9]/.test(lower)) {
      current += lower;
      continue;
    }

    const initial = cjkToInitial(char);
    if (initial) {
      current += initial;
      continue;
    }

    if (current) {
      parts.push(current);
      current = "";
    }
  }

  if (current) {
    parts.push(current);
  }

  const tokens = new Set<string>();
  for (const part of parts) {
    if (!part) {
      continue;
    }

    tokens.add(part);
    if (part.length > 1) {
      tokens.add(part[0] ?? "");
    }
  }

  return Array.from(tokens).filter(Boolean);
}

function commandItem(
  id: string,
  title: string,
  subtitle: string,
  target: string
): LaunchItem {
  return {
    id,
    type: "command",
    title,
    subtitle,
    target,
    keywords: toKeywords(`${title} ${subtitle}`)
  };
}

function createBuiltinItems(): LaunchItem[] {
  return [
    commandItem(
      "command:clip",
      "clip",
      "打开剪贴板历史",
      "command:clip"
    ),
    commandItem(
      "command:settings",
      "settings",
      "打开设置页面",
      "command:settings"
    ),
    commandItem(
      "command:exit",
      "exit",
      "退出 LiteLauncher",
      "command:exit"
    )
  ];
}

function createAppItemsFromStartMenu(): LaunchItem[] {
  const files: string[] = [];
  for (const startMenuDir of getStartMenuDirs()) {
    walkShortcutFiles(startMenuDir, files);
  }

  const appItems: LaunchItem[] = files.map((shortcutPath) => {
    const title = path.basename(shortcutPath, path.extname(shortcutPath));
    return {
      id: `app:${shortcutPath}`,
      type: "application",
      title,
      subtitle: shortcutPath,
      target: shortcutPath,
      keywords: toKeywords(title)
    };
  });

  return appItems;
}

export function buildCatalog(): LaunchItem[] {
  return [...createBuiltinItems(), ...createAppItemsFromStartMenu()];
}
