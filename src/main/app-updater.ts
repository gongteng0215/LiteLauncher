import { app } from "electron";
import {
  autoUpdater,
  type ProgressInfo,
  type UpdateDownloadedEvent
} from "electron-updater";

import { AppUpdaterStatus } from "../shared/types";

const AUTO_UPDATE_CHECK_DELAY_MS = 12_000;

function truncateText(value: string, maxLength = 600): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!normalized) {
    return "";
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1))}…`;
}

function formatReleaseNotes(releaseNotes: unknown): string | undefined {
  if (typeof releaseNotes === "string") {
    const text = truncateText(releaseNotes);
    return text || undefined;
  }

  if (!Array.isArray(releaseNotes)) {
    return undefined;
  }

  const items = releaseNotes
    .map((entry) => {
      if (!entry || typeof entry !== "object") {
        return "";
      }

      const record = entry as Record<string, unknown>;
      const version =
        typeof record.version === "string" ? record.version.trim() : "";
      const note = typeof record.note === "string" ? record.note : "";
      const text = truncateText(note, 260);
      if (!text) {
        return "";
      }
      return version ? `${version}: ${text}` : text;
    })
    .filter(Boolean);

  if (items.length === 0) {
    return undefined;
  }

  return truncateText(items.join("\n\n"), 800);
}

function detectPortableEnvironment(): boolean {
  const portableDir = String(process.env.PORTABLE_EXECUTABLE_DIR ?? "").trim();
  const portableFile = String(process.env.PORTABLE_EXECUTABLE_FILE ?? "").trim();
  return Boolean(portableDir || portableFile);
}

function isSupportedEnvironment(): boolean {
  if (!app.isPackaged) {
    return false;
  }

  if (process.platform === "darwin") {
    return true;
  }

  if (process.platform !== "win32") {
    return false;
  }

  if (detectPortableEnvironment()) {
    return false;
  }

  return !process.execPath.trim().toLowerCase().endsWith("portable.exe");
}

export type AppUpdaterProvider = {
  getStatus: () => AppUpdaterStatus;
  checkForUpdates: () => Promise<AppUpdaterStatus>;
  installUpdateNow: () => Promise<boolean>;
  scheduleStartupCheck: () => void;
};

export function createAppUpdater(): AppUpdaterProvider {
  const supported = isSupportedEnvironment();
  const currentVersion = app.getVersion();

  let status: AppUpdaterStatus = supported
    ? {
        supported: true,
        phase: "idle",
        currentVersion,
        downloaded: false,
        autoUpdateEnabled: true,
        message: "可检查 GitHub Releases 上的新版本。"
      }
    : {
        supported: false,
        phase: "unsupported",
        currentVersion,
        downloaded: false,
        autoUpdateEnabled: false,
        message:
          !app.isPackaged
            ? "开发环境暂不支持自动更新，请打包后再验证。"
            : process.platform === "darwin"
              ? "当前构建暂未启用自动更新，请确认发布资产包含 latest-mac.yml。"
            : process.platform !== "win32"
              ? "当前仅 Windows NSIS 安装版和 macOS 打包版支持自动更新。"
              : "Portable 版本暂不支持自动更新，请手动下载新版本。"
      };

  let startupCheckScheduled = false;

  const setStatus = (next: Partial<AppUpdaterStatus>): AppUpdaterStatus => {
    status = {
      ...status,
      ...next,
      supported,
      currentVersion,
      autoUpdateEnabled: supported
    };
    return status;
  };

  if (supported) {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on("checking-for-update", () => {
      setStatus({
        phase: "checking",
        downloaded: false,
        progressPercent: undefined,
        message: "正在检查更新…"
      });
    });

    autoUpdater.on("update-available", (info) => {
      setStatus({
        phase: "available",
        updateVersion: info.version,
        downloaded: false,
        releaseNotes: formatReleaseNotes(info.releaseNotes),
        message: `发现新版本 v${info.version}，正在下载更新包。`
      });
    });

    autoUpdater.on("download-progress", (info: ProgressInfo) => {
      const percent = Number.isFinite(info.percent)
        ? Math.max(0, Math.min(100, Math.round(info.percent)))
        : undefined;

      setStatus({
        phase: "downloading",
        progressPercent: percent,
        message:
          percent === undefined
            ? "正在下载更新包…"
            : `正在下载更新包… ${percent}%`
      });
    });

    autoUpdater.on("update-not-available", () => {
      setStatus({
        phase: "not-available",
        downloaded: false,
        progressPercent: undefined,
        releaseNotes: undefined,
        message: "当前已是最新版本。"
      });
    });

    autoUpdater.on("update-downloaded", (event: UpdateDownloadedEvent) => {
      setStatus({
        phase: "downloaded",
        updateVersion: event.version,
        downloaded: true,
        progressPercent: 100,
        releaseNotes: formatReleaseNotes(event.releaseNotes),
        message: `新版本 v${event.version} 已下载完成，重启后即可安装。`
      });
    });

    autoUpdater.on("error", (error, message) => {
      const detail = truncateText(
        typeof message === "string" && message.trim()
          ? message
          : error?.message ?? "检查更新失败"
      );
      setStatus({
        phase: "error",
        downloaded: false,
        progressPercent: undefined,
        message: detail || "检查更新失败"
      });
    });
  }

  const provider: AppUpdaterProvider = {
    getStatus(): AppUpdaterStatus {
      return { ...status };
    },
    async checkForUpdates(): Promise<AppUpdaterStatus> {
      if (!supported) {
        return { ...status };
      }

      try {
        const result = await autoUpdater.checkForUpdates();
        if (result?.isUpdateAvailable && result.downloadPromise) {
          await result.downloadPromise.catch(() => {
            // Updater events already carry the terminal state.
          });
        }
      } catch (error) {
        const detail =
          error instanceof Error && error.message
            ? error.message
            : "检查更新失败";
        setStatus({
          phase: "error",
          downloaded: false,
          progressPercent: undefined,
          message: truncateText(detail)
        });
      }

      return { ...status };
    },
    async installUpdateNow(): Promise<boolean> {
      if (!supported || status.phase !== "downloaded" || !status.downloaded) {
        return false;
      }

      setStatus({
        message: "正在关闭应用并安装更新…"
      });
      autoUpdater.quitAndInstall(false, true);
      return true;
    },
    scheduleStartupCheck(): void {
      if (!supported || startupCheckScheduled) {
        return;
      }

      startupCheckScheduled = true;
      setTimeout(() => {
        void provider.checkForUpdates();
      }, AUTO_UPDATE_CHECK_DELAY_MS);
    }
  };

  return provider;
}
