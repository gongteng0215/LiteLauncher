import fs from "node:fs";
import path from "node:path";
import { NativeImage, nativeImage } from "electron";

const ICON_FILENAMES = ["icon.ico", "icon.png"] as const;

function getIconCandidates(): string[] {
  return ICON_FILENAMES.map((filename) =>
    path.join(__dirname, "../assets", filename)
  );
}

function tryLoadIcon(iconPath: string): NativeImage | null {
  try {
    const icon = nativeImage.createFromPath(iconPath);
    if (icon.isEmpty()) {
      try {
        const buffer = fs.readFileSync(iconPath);
        const fallbackIcon = nativeImage.createFromBuffer(buffer);
        if (!fallbackIcon.isEmpty()) {
          return fallbackIcon;
        }
      } catch {
        // Ignore and fallback to null.
      }
      return null;
    }
    return icon;
  } catch {
    try {
      const buffer = fs.readFileSync(iconPath);
      const fallbackIcon = nativeImage.createFromBuffer(buffer);
      if (!fallbackIcon.isEmpty()) {
        return fallbackIcon;
      }
    } catch {
      // Ignore and fallback to null.
    }
    return null;
  }
}

export function resolveBundledAppIconPath(): string | undefined {
  let firstExistingPath: string | undefined;

  for (const candidate of getIconCandidates()) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    if (!firstExistingPath) {
      firstExistingPath = candidate;
    }

    if (tryLoadIcon(candidate)) {
      return candidate;
    }
  }

  return firstExistingPath;
}

export function loadBundledAppIcon(): NativeImage | null {
  for (const candidate of getIconCandidates()) {
    if (!fs.existsSync(candidate)) {
      continue;
    }

    const icon = tryLoadIcon(candidate);
    if (icon) {
      return icon;
    }
  }

  return null;
}

export function loadBundledTrayIcon(): NativeImage | null {
  const icon = loadBundledAppIcon();
  if (!icon || icon.isEmpty()) {
    return null;
  }

  const resized = icon.resize({ width: 16, height: 16, quality: "best" });
  if (resized.isEmpty()) {
    return icon;
  }

  return resized;
}
