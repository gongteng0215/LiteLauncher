import { clipboard, shell, type NativeImage } from "electron";
import {
  pushLiteSnapRecentColor,
  type LiteSnapCommitCaptureInput,
  type LiteSnapCommitCaptureResult,
  type LiteSnapDiagnosticOperation,
  type LiteSnapHistorySource
} from "../../shared/litesnap";
import type { LiteSnapCaptureSession } from "./capture-session-types";
import { LiteSnapCaptureImageService } from "./capture-image-service";
import { LiteSnapHistoryStore } from "./history-store";
import { LiteSnapImageStore } from "./image-store";
import { LiteSnapPinWindowManager } from "./pin-window-manager";
import { LiteSnapSettingsStore } from "./settings";

type CommitHooks = {
  cancelCapture(): Promise<boolean>;
  recordDiagnostic(
    operation: LiteSnapDiagnosticOperation,
    status: "success" | "cancelled" | "failed",
    startedAt: number,
    message: string,
    metrics?: Record<string, number | string | boolean>
  ): Promise<void>;
};

export class LiteSnapCaptureCommitService {
  public constructor(
    private readonly settingsStore: LiteSnapSettingsStore,
    private readonly imageStore: LiteSnapImageStore,
    private readonly pinWindowManager: LiteSnapPinWindowManager,
    private readonly historyStore: LiteSnapHistoryStore | null,
    private readonly imageService: LiteSnapCaptureImageService,
    private readonly hooks: CommitHooks
  ) {}

  public async commit(
    session: LiteSnapCaptureSession | null,
    input: LiteSnapCommitCaptureInput
  ): Promise<LiteSnapCommitCaptureResult> {
    if (!session) return { ok: false, message: "LiteSnap capture session is not available." };
    if (!session.sourceImage || session.sourceImage.isEmpty()) {
      return { ok: false, message: "LiteSnap is still preparing the screenshot." };
    }
    const resolved = this.imageService.resolveCommitImage(
      session as LiteSnapCaptureSession & { sourceImage: NativeImage },
      input
    );
    const image = resolved ? this.imageService.normalizeLongCaptureExportSize(session, resolved) : null;
    if (!image || image.isEmpty()) return { ok: false, message: "The current selection is invalid." };

    const operation = session.diagnosticOperation;
    const exportStartedAt = Date.now();
    const metrics = () => ({
      width: image.getSize().width,
      height: image.getSize().height,
      exportMs: Date.now() - exportStartedAt
    });

    if (input.action === "copy") {
      clipboard.writeImage(image);
      await this.recordHistory(image, session.historyEdit ? "history-edit" : "capture-copy");
      session.diagnosticFinalized = true;
      await this.hooks.cancelCapture();
      if (operation !== "long-capture") {
        await this.hooks.recordDiagnostic(operation, "success", session.startedAt, "已复制截图。", metrics());
      }
      return { ok: true, message: "Screenshot copied to the clipboard." };
    }

    if (input.action === "save") {
      try {
        const settings = await this.settingsStore.getSettings();
        session.diagnosticFinalized = true;
        await this.hooks.cancelCapture();
        await new Promise<void>((resolve) => setTimeout(resolve, 0));
        const savedPath = await this.imageStore.saveImage(image, settings);
        this.revealSavedCapture(savedPath);
        await this.recordHistory(image, session.historyEdit ? "history-edit" : "capture-save");
        if (operation !== "long-capture") {
          await this.hooks.recordDiagnostic(operation, "success", session.startedAt, "已保存截图。", metrics());
        }
        return { ok: true, message: `Screenshot saved: ${savedPath}`, savedPath };
      } catch (error) {
        session.diagnosticFinalized = true;
        if (operation !== "long-capture") {
          await this.hooks.recordDiagnostic(operation, "failed", session.startedAt, "保存截图失败。", {});
        }
        return {
          ok: false,
          message: error instanceof Error ? error.message : "Saving the screenshot failed."
        };
      }
    }

    const placement = {
      x: session.display.bounds.x + input.selection.x,
      y: session.display.bounds.y + input.selection.y,
      width: input.selection.width,
      height: input.selection.height
    };
    clipboard.writeImage(image);
    if (!(await this.pinWindowManager.pinImage(image, placement))) {
      return { ok: false, message: "Pinning the screenshot failed." };
    }
    await this.recordHistory(image, session.historyEdit ? "history-edit" : "capture-pin");
    session.diagnosticFinalized = true;
    await this.hooks.cancelCapture();
    if (operation !== "long-capture") {
      await this.hooks.recordDiagnostic(operation, "success", session.startedAt, "已贴图截图。", metrics());
    }
    return { ok: true, message: "Screenshot pinned to the screen and copied to the clipboard." };
  }

  public async recordHistory(image: NativeImage, source: LiteSnapHistorySource): Promise<void> {
    if (!this.historyStore) return;
    try {
      const settings = await this.settingsStore.getSettings();
      if (settings.historyEnabled) await this.historyStore.add(image, source, settings.historyMaxItems);
    } catch (error) {
      console.warn("[litesnap] history record failed", error);
    }
  }

  public async recordRecentColor(
    color: string,
    session: LiteSnapCaptureSession | null
  ): Promise<string[]> {
    const nextColor = color.trim().toLowerCase();
    const settings = await this.settingsStore.getSettings();
    if (!/^#[0-9a-f]{6}$/.test(nextColor)) return settings.recentColors;
    const next = await this.settingsStore.updateSettings({
      recentColors: pushLiteSnapRecentColor(settings.recentColors, nextColor)
    });
    if (session) session.settings = { ...session.settings, recentColors: [...next.recentColors] };
    return next.recentColors;
  }

  public revealSavedCapture(savedPath: string): void {
    setTimeout(() => {
      try {
        shell.showItemInFolder(savedPath);
      } catch {
        // Saving already succeeded; revealing in Explorer is best-effort.
      }
    }, 250);
  }
}
