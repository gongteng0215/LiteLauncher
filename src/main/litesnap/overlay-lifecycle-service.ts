import type { BrowserWindow, Display } from "electron";

const OVERLAY_READY_TIMEOUT_MS = 8000;

export class LiteSnapOverlayLifecycleService {
  private readyPromise: Promise<void> | null = null;

  public activate(window: BrowserWindow, display: Display): void {
    window.setBounds(display.bounds);
    window.setFocusable(false);
    window.setIgnoreMouseEvents(true);
    window.setAlwaysOnTop(true, "screen-saver");
    window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  }

  public park(window: BrowserWindow): void {
    window.setContentProtection(false);
    window.setIgnoreMouseEvents(true);
    window.setAlwaysOnTop(false);
    window.setVisibleOnAllWorkspaces(false);
    window.setFocusable(false);
    window.setOpacity(0);
  }

  public showPreparing(window: BrowserWindow): void {
    if (window.isDestroyed()) return;
    window.setIgnoreMouseEvents(true);
    window.setFocusable(false);
    window.setOpacity(0);
    window.show();
    window.moveTop();
  }

  public async prepareRenderer(window: BrowserWindow): Promise<void> {
    if (window.isDestroyed()) return;
    await window.webContents
      .executeJavaScript("window.__LL_LITESNAP_PREPARE_CAPTURE__?.();", true)
      .catch(() => undefined);
  }

  public async showInteractive(window: BrowserWindow): Promise<void> {
    if (window.isDestroyed()) return;
    window.setContentProtection(false);
    window.setIgnoreMouseEvents(false);
    window.setFocusable(true);
    window.show();
    let frameReady = await this.waitForFrameReady(window);
    if (!frameReady) {
      await new Promise<void>((resolve) => setTimeout(resolve, 32));
      frameReady = await this.waitForFrameReady(window);
    }
    if (window.isDestroyed()) return;
    window.setOpacity(1);
    window.focus();
    window.moveTop();
  }

  public waitForReady(window: BrowserWindow): Promise<void> {
    if (window.isDestroyed() || window.webContents.isDestroyed() || !window.webContents.isLoading()) {
      return Promise.resolve();
    }
    const waitForLoad = (): Promise<void> => {
      if (!this.readyPromise) {
        this.readyPromise = new Promise<void>((resolve) => {
          let settled = false;
          const finish = (): void => {
            if (settled) return;
            settled = true;
            if (!window.webContents.isDestroyed()) {
              window.webContents.removeListener("did-finish-load", finish);
              window.webContents.removeListener("did-stop-loading", finish);
              window.webContents.removeListener("did-fail-load", finish);
            }
            this.readyPromise = null;
            resolve();
          };
          if (window.isDestroyed() || window.webContents.isDestroyed() || !window.webContents.isLoading()) {
            finish();
            return;
          }
          window.webContents.once("did-finish-load", finish);
          window.webContents.once("did-stop-loading", finish);
          window.webContents.once("did-fail-load", finish);
        });
      }
      return this.readyPromise;
    };
    return Promise.race([
      waitForLoad(),
      new Promise<void>((resolve) => setTimeout(() => {
        console.warn("[litesnap] overlay ready wait timed out, continuing capture");
        resolve();
      }, OVERLAY_READY_TIMEOUT_MS))
    ]);
  }

  private async waitForFrameReady(window: BrowserWindow): Promise<boolean> {
    if (window.isDestroyed() || window.webContents.isDestroyed()) return false;
    const result = await window.webContents.executeJavaScript(
      `new Promise((resolve) => {
        const settle = () => requestAnimationFrame(() => requestAnimationFrame(() => resolve(true)));
        const start = Date.now();
        const poll = () => {
          const node = document.getElementById("litesnap-overlay");
          if (node && node.dataset.ready === "true") { settle(); return; }
          if (Date.now() - start > 2500) { resolve(false); return; }
          requestAnimationFrame(poll);
        };
        poll();
      });`,
      true
    ).catch(() => false);
    return result === true;
  }
}
