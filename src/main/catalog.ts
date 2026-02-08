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
  return value
    .toLowerCase()
    .split(/[\s._\-\\/]+/)
    .filter(Boolean);
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
