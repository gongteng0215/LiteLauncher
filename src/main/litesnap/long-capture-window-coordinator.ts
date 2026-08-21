import { BrowserWindow, type Display } from "electron";

import type { LiteSnapOverlaySelection } from "../../shared/litesnap";
import {
  createLiteSnapLongCaptureController,
  createLiteSnapLongCaptureGuide
} from "./overlay-window";

const GUIDE_BORDER_OUTSET = 4;
const STACK_WATCH_INTERVAL_MS = 750;

export class LiteSnapLongCaptureWindowCoordinator {
  private controllerWindow: BrowserWindow | null = null;
  private guideWindow: BrowserWindow | null = null;
  private stackWatchTimer: NodeJS.Timeout | null = null;
  private maskReady = false;
  private onUnexpectedClose: (() => void) | null = null;
  private readonly expectedCloses = new WeakSet<BrowserWindow>();

  public get controller(): BrowserWindow | null {
    return this.controllerWindow;
  }

  public get guide(): BrowserWindow | null {
    return this.guideWindow;
  }

  public get isMaskReady(): boolean {
    return this.maskReady;
  }

  public open(
    display: Display,
    selection: LiteSnapOverlaySelection,
    onUnexpectedClose?: () => void
  ): void {
    this.stopWatch();
    this.maskReady = false;
    this.onUnexpectedClose = onUnexpectedClose ?? null;
    this.showGuide(display, selection);
    this.showController(display, selection);
  }

  public async revealMask(
    overlayWindow: BrowserWindow,
    isSessionActive: () => boolean
  ): Promise<boolean> {
    if (overlayWindow.isDestroyed() || overlayWindow.webContents.isDestroyed()) {
      return false;
    }
    overlayWindow.setIgnoreMouseEvents(true);
    overlayWindow.setFocusable(false);
    overlayWindow.setOpacity(0);
    overlayWindow.showInactive();
    const ready = await overlayWindow.webContents.executeJavaScript(
      `new Promise((resolve) => {
        const startedAt = Date.now();
        const poll = () => {
          const root = document.getElementById("litesnap-overlay");
          const dim = document.getElementById("litesnap-dim");
          const dimParts = ["top", "right", "bottom", "left"]
            .map((name) => document.getElementById("litesnap-dim-" + name));
          const partsPainted = dimParts.every((part) => {
            if (!part) return false;
            const color = getComputedStyle(part).backgroundColor;
            return color !== "transparent" && color !== "rgba(0, 0, 0, 0)";
          });
          if (
            root?.dataset.longCaptureGuide === "true" &&
            root.dataset.longCaptureMaskReady === "true" &&
            getComputedStyle(root).backgroundImage === "none" &&
            dim &&
            !dim.hidden &&
            partsPainted
          ) {
            requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
            return;
          }
          if (Date.now() - startedAt >= 1500) {
            resolve(false);
            return;
          }
          requestAnimationFrame(poll);
        };
        poll();
      });`,
      true
    ).catch(() => false);
    if (ready !== true || !isSessionActive() || overlayWindow.isDestroyed()) {
      this.maskReady = false;
      if (!overlayWindow.isDestroyed()) {
        overlayWindow.setOpacity(0);
      }
      return false;
    }
    this.maskReady = true;
    overlayWindow.setOpacity(1);
    return true;
  }

  public startWatch(
    overlayWindow: BrowserWindow,
    isSessionActive: () => boolean,
    isScrollRelayInFlight: () => boolean
  ): void {
    this.stopWatch();
    this.stackWatchTimer = setInterval(() => {
      if (!isSessionActive()) {
        this.stopWatch();
        return;
      }
      this.ensureStack(overlayWindow, !isScrollRelayInFlight());
    }, STACK_WATCH_INTERVAL_MS);
    this.stackWatchTimer.unref?.();
  }

  public ensureStack(overlayWindow: BrowserWindow, restoreGuideHitTesting: boolean): void {
    if (this.maskReady && !overlayWindow.isDestroyed()) {
      overlayWindow.setIgnoreMouseEvents(true);
      overlayWindow.setFocusable(false);
      if (!overlayWindow.isAlwaysOnTop()) {
        overlayWindow.setAlwaysOnTop(true, "screen-saver");
      }
      if (!overlayWindow.isVisible()) {
        overlayWindow.showInactive();
      }
      overlayWindow.moveTop();
    }

    const guide = this.guideWindow;
    if (guide && !guide.isDestroyed()) {
      if (restoreGuideHitTesting) {
        guide.setIgnoreMouseEvents(false);
      }
      if (!guide.isAlwaysOnTop()) {
        guide.setAlwaysOnTop(true, "screen-saver");
      }
      if (!guide.isVisible()) {
        guide.showInactive();
      }
      guide.moveTop();
    }

    const controller = this.controllerWindow;
    if (controller && !controller.isDestroyed()) {
      if (!controller.isAlwaysOnTop()) {
        controller.setAlwaysOnTop(true, "screen-saver");
      }
      if (!controller.isVisible()) {
        controller.showInactive();
      }
      controller.moveTop();
    }
  }

  public beginScrollRelay(): BrowserWindow | null {
    const guide = this.guideWindow;
    if (!guide || guide.isDestroyed()) return null;
    // The guide owns focus for Esc. Yield foreground input routing while the
    // native wheel batch runs, otherwise Windows can send it back to the guide.
    guide.setIgnoreMouseEvents(true);
    guide.setFocusable(false);
    return guide;
  }

  public endScrollRelay(guide: BrowserWindow): void {
    if (guide !== this.guideWindow || guide.isDestroyed()) return;
    guide.setFocusable(true);
    guide.setIgnoreMouseEvents(false);
    guide.setAlwaysOnTop(true, "screen-saver");
    guide.show();
    guide.focus();
    guide.moveTop();
  }

  public stopWatch(): void {
    if (this.stackWatchTimer) {
      clearInterval(this.stackWatchTimer);
      this.stackWatchTimer = null;
    }
  }

  public close(): void {
    this.stopWatch();
    this.maskReady = false;
    this.onUnexpectedClose = null;
    const guide = this.guideWindow;
    this.guideWindow = null;
    if (guide && !guide.isDestroyed()) {
      this.expectedCloses.add(guide);
      guide.close();
    }
    const controller = this.controllerWindow;
    this.controllerWindow = null;
    if (controller && !controller.isDestroyed()) {
      this.expectedCloses.add(controller);
      controller.close();
    }
  }

  private showController(display: Display, selection: LiteSnapOverlaySelection): void {
    let controller = this.controllerWindow;
    if (!controller || controller.isDestroyed()) {
      controller = createLiteSnapLongCaptureController(display);
      const createdController = controller;
      this.controllerWindow = createdController;
      createdController.on("closed", () => {
        if (this.controllerWindow === createdController) {
          this.controllerWindow = null;
        }
        if (!this.expectedCloses.delete(createdController)) {
          this.onUnexpectedClose?.();
        }
      });
    }
    const width = 360;
    const height = 132;
    const padding = 12;
    const selectionBounds = {
      x: display.bounds.x + selection.x,
      y: display.bounds.y + selection.y,
      width: selection.width,
      height: selection.height
    };
    const candidates = [
      { x: selectionBounds.x + Math.round((selectionBounds.width - width) / 2), y: selectionBounds.y + selectionBounds.height + padding },
      { x: selectionBounds.x + Math.round((selectionBounds.width - width) / 2), y: selectionBounds.y - height - padding },
      { x: selectionBounds.x + selectionBounds.width + padding, y: selectionBounds.y + Math.round((selectionBounds.height - height) / 2) },
      { x: selectionBounds.x - width - padding, y: selectionBounds.y + Math.round((selectionBounds.height - height) / 2) }
    ];
    const minX = display.workArea.x + padding;
    const minY = display.workArea.y + padding;
    const maxX = display.workArea.x + display.workArea.width - width - padding;
    const maxY = display.workArea.y + display.workArea.height - height - padding;
    const candidate = candidates.find(
      (item) => item.x >= minX && item.x <= maxX && item.y >= minY && item.y <= maxY
    ) ?? candidates[0]!;
    controller.setBounds({
      x: Math.max(minX, Math.min(maxX, candidate.x)),
      y: Math.max(minY, Math.min(maxY, candidate.y)),
      width,
      height
    });
    controller.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    controller.showInactive();
    controller.moveTop();
  }

  private showGuide(display: Display, selection: LiteSnapOverlaySelection): void {
    const bounds = {
      x: display.bounds.x + selection.x,
      y: display.bounds.y + selection.y,
      width: selection.width,
      height: selection.height
    };
    const guideBounds = {
      x: bounds.x - GUIDE_BORDER_OUTSET,
      y: bounds.y - GUIDE_BORDER_OUTSET,
      width: bounds.width + GUIDE_BORDER_OUTSET * 2,
      height: bounds.height + GUIDE_BORDER_OUTSET * 2
    };
    let guide = this.guideWindow;
    if (!guide || guide.isDestroyed()) {
      guide = createLiteSnapLongCaptureGuide(guideBounds);
      const createdGuide = guide;
      this.guideWindow = createdGuide;
      createdGuide.on("closed", () => {
        if (this.guideWindow === createdGuide) {
          this.guideWindow = null;
        }
        if (!this.expectedCloses.delete(createdGuide)) {
          this.onUnexpectedClose?.();
        }
      });
    }
    guide.setBounds({
      x: Math.round(guideBounds.x),
      y: Math.round(guideBounds.y),
      width: Math.max(1, Math.round(guideBounds.width)),
      height: Math.max(1, Math.round(guideBounds.height))
    });
    guide.setIgnoreMouseEvents(false);
    guide.setAlwaysOnTop(true, "screen-saver");
    guide.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
    guide.showInactive();
    guide.focus();
    guide.moveTop();
  }
}
