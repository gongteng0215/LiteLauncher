import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";

import {
  captureE2EFailureArtifacts,
  launchE2ESession
} from "./e2e-test-utils";

type SelectionSnapshot = {
  x: number;
  y: number;
  width: number;
  height: number;
  toolbarVisible: boolean;
};

type NativeScrollFixtureStatus = {
  ready: boolean;
  pid: number;
  bounds: { x: number; y: number; width: number; height: number };
  y: number;
  innerHeight: number;
  scrollHeight: number;
};

async function waitForNativeScrollFixture(
  statusPath: string,
  timeoutMs = 15000
): Promise<NativeScrollFixtureStatus> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    try {
      const value = JSON.parse(await fs.readFile(statusPath, "utf8")) as NativeScrollFixtureStatus;
      if (value.ready && value.pid > 0 && value.scrollHeight > value.innerHeight) {
        return value;
      }
    } catch {
      // The fixture writes atomically and may not have published its first state yet.
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timed out waiting for the external native scroll fixture");
}

async function closeLiteSnapE2ESession(
  session: Awaited<ReturnType<typeof launchE2ESession>>
): Promise<void> {
  await session.page
    .evaluate(() => window.launcher.liteSnapCancelCapture())
    .catch(() => undefined);
  await session.electronApp.evaluate(({ app }) => {
    app.exit(0);
  }).catch(() => undefined);
  await Promise.race([
    session.close(),
    new Promise<void>((resolve) => setTimeout(resolve, 3000))
  ]);
}

async function waitForOverlayWindow(
  session: Awaited<ReturnType<typeof launchE2ESession>>
) {
  const started = await session.page.evaluate(() => window.launcher.liteSnapStartCapture());
  assert.equal(started, true, "LiteSnap capture should start successfully");

  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    const windows = session.electronApp.windows();
    const overlayPage = windows.find((page) => page.url().includes("litesnap-overlay.html"));
    if (overlayPage) {
      await overlayPage.waitForLoadState("domcontentloaded");
      await waitForOverlayVisibility(session, true);
      return overlayPage;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error("LiteSnap overlay window should open");
}

async function waitForLongCaptureController(
  session: Awaited<ReturnType<typeof launchE2ESession>>
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    const controller = session.electronApp
      .windows()
      .filter((page) => !page.isClosed())
      .find((page) => page.url().includes("litesnap-long-capture.html"));
    if (controller) {
      await controller.waitForLoadState("domcontentloaded");
      return controller;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("LiteSnap long capture controller should open");
}

async function waitForLongCaptureGuide(
  session: Awaited<ReturnType<typeof launchE2ESession>>
) {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    const guide = session.electronApp
      .windows()
      .filter((page) => !page.isClosed())
      .find((page) => page.url().includes("litesnap-long-capture-guide.html"));
    if (guide) {
      await guide.waitForLoadState("domcontentloaded");
      return guide;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("LiteSnap long capture selection guide should open");
}

async function waitForOverlayReady(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 45000) {
    const isReady = await overlayPage.evaluate(() => {
      const overlayRoot = document.getElementById("litesnap-overlay") as HTMLElement | null;
      return overlayRoot?.dataset.ready === "true";
    });
    if (isReady) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error("Timed out waiting for LiteSnap overlay ready state");
}

async function readSelectionSnapshot(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>
): Promise<SelectionSnapshot | null> {
  return overlayPage.evaluate(() => {
    const selectionNode =
      document.getElementById("litesnap-selection") as HTMLElement | null;
    const toolbarNode =
      document.getElementById("litesnap-toolbar") as HTMLElement | null;
    if (!selectionNode || selectionNode.hidden) {
      return null;
    }

    const rect = selectionNode.getBoundingClientRect();
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      toolbarVisible: Boolean(toolbarNode && !toolbarNode.hidden)
    };
  });
}

async function waitForOverlayVisibility(
  session: Awaited<ReturnType<typeof launchE2ESession>>,
  expectedVisible: boolean
): Promise<void> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    const currentVisible = await session.electronApp.evaluate(({ BrowserWindow }) => {
      const overlayWindow = BrowserWindow.getAllWindows().find((window) => {
        return (
          !window.isDestroyed() &&
          !window.webContents.isDestroyed() &&
          window.webContents.getURL().includes("litesnap-overlay.html")
        );
      });
      if (!overlayWindow || overlayWindow.isDestroyed()) {
        return false;
      }
      return overlayWindow.isVisible();
    });
    if (currentVisible === expectedVisible) {
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error(
    `Timed out waiting for LiteSnap overlay visibility=${String(expectedVisible)}`
  );
}

async function dispatchOverlayDrag(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>,
  start: { x: number; y: number },
  end: { x: number; y: number }
): Promise<void> {
  await overlayPage.evaluate(
    ({ startPoint, endPoint }) => {
      const overlayRoot = document.getElementById("litesnap-overlay");
      if (!overlayRoot) {
        throw new Error("LiteSnap overlay root is missing");
      }

      const eventInit = (
        point: { x: number; y: number },
        buttons: number
      ): PointerEventInit => ({
        bubbles: true,
        cancelable: true,
        clientX: point.x,
        clientY: point.y,
        pointerId: 1,
        pointerType: "mouse",
        isPrimary: true,
        buttons
      });

      overlayRoot.dispatchEvent(
        new PointerEvent("pointerdown", eventInit(startPoint, 1))
      );
      overlayRoot.dispatchEvent(
        new PointerEvent("pointermove", eventInit(endPoint, 1))
      );
      overlayRoot.dispatchEvent(
        new PointerEvent("pointerup", eventInit(endPoint, 0))
      );
    },
    { startPoint: start, endPoint: end }
  );
}

async function dispatchOverlayDoubleClick(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>,
  point: { x: number; y: number }
): Promise<void> {
  await overlayPage.evaluate((clickPoint) => {
    const overlayRoot = document.getElementById("litesnap-overlay");
    if (!overlayRoot) {
      throw new Error("LiteSnap overlay root is missing");
    }

    overlayRoot.dispatchEvent(
      new MouseEvent("dblclick", {
        bubbles: true,
        cancelable: true,
        clientX: clickPoint.x,
        clientY: clickPoint.y
      })
    );
  }, point);
}

async function clickOverlayToolbarButton(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>,
  action: string
): Promise<void> {
  await overlayPage.evaluate((buttonAction) => {
    const button = document.querySelector<HTMLButtonElement>(
      `button[data-action="${buttonAction}"]`
    );
    if (!button) {
      throw new Error(`LiteSnap toolbar button is missing: ${buttonAction}`);
    }
    button.click();
  }, action);
}

async function waitForSelectionMove(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>,
  previous: SelectionSnapshot
): Promise<SelectionSnapshot> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    const next = await readSelectionSnapshot(overlayPage);
    if (next && (next.x !== previous.x || next.y !== previous.y)) {
      return next;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error("LiteSnap selection should move after dragging inside it");
}

async function waitForSelectionVisible(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>
): Promise<SelectionSnapshot> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 10000) {
    const selection = await readSelectionSnapshot(overlayPage);
    if (selection?.toolbarVisible) {
      return selection;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error("LiteSnap selection should remain visible after pointer release");
}

async function waitForLiteSnapSavedFile(saveDirectory: string): Promise<string> {
  const startedAt = Date.now();
  while (Date.now() - startedAt < 15000) {
    const savedFiles = await fs.readdir(saveDirectory);
    const savedFile = savedFiles.find((fileName) => /^LiteSnap_.*\.png$/i.test(fileName));
    if (savedFile) {
      return savedFile;
    }
    await new Promise((resolve) => setTimeout(resolve, 120));
  }

  throw new Error("LiteSnap save action should write a PNG file before closing");
}

async function createOverlaySelection(
  overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>>
): Promise<SelectionSnapshot> {
  const viewport = await overlayPage.evaluate(() => ({
    width: window.innerWidth,
    height: window.innerHeight
  }));
  assert.ok(
    viewport.width > 0 && viewport.height > 0,
    "overlay window should expose a usable viewport size"
  );

  const dragStart = {
    x: Math.round(viewport.width * 0.2),
    y: Math.round(viewport.height * 0.2)
  };
  const dragEnd = {
    x: Math.round(viewport.width * 0.55),
    y: Math.round(viewport.height * 0.5)
  };

  await dispatchOverlayDrag(overlayPage, dragStart, dragEnd);

  return waitForSelectionVisible(overlayPage);
}

test(
  "electron smoke: LiteSnap selection remains adjustable after pointer release",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap selection remains adjustable after pointer release";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession();
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);

      const initialSelection = await createOverlaySelection(overlayPage);
      assert.ok(initialSelection, "selection should remain visible after pointer release");
      assert.equal(
        initialSelection.toolbarVisible,
        true,
        "toolbar should appear after the first drag finishes"
      );
      const ordinaryCaptureVisuals = await overlayPage.evaluate(() => {
        const root = document.getElementById("litesnap-overlay");
        const dim = document.getElementById("litesnap-dim");
        const dimTop = document.getElementById("litesnap-dim-top");
        const selection = document.getElementById("litesnap-selection");
        return {
          ready: root?.dataset.ready,
          backgroundImage: root ? getComputedStyle(root).backgroundImage : "none",
          dimVisible: Boolean(dim && !dim.hidden),
          dimColor: dimTop ? getComputedStyle(dimTop).backgroundColor : "transparent",
          selectionVisible: Boolean(selection && !selection.hidden),
          selectionBorder: selection ? getComputedStyle(selection).borderTopWidth : "0px"
        };
      });
      assert.equal(ordinaryCaptureVisuals.ready, "true");
      assert.notEqual(ordinaryCaptureVisuals.backgroundImage, "none");
      assert.equal(ordinaryCaptureVisuals.dimVisible, true);
      assert.notEqual(ordinaryCaptureVisuals.dimColor, "rgba(0, 0, 0, 0)");
      assert.equal(ordinaryCaptureVisuals.selectionVisible, true);
      assert.notEqual(ordinaryCaptureVisuals.selectionBorder, "0px");

      const moveStart = {
        x: initialSelection.x + initialSelection.width / 2,
        y: initialSelection.y + initialSelection.height / 2
      };
      const moveEnd = {
        x: moveStart.x + 48,
        y: moveStart.y + 36
      };

      await dispatchOverlayDrag(overlayPage, moveStart, moveEnd);

      const movedSelection = await waitForSelectionMove(overlayPage, initialSelection);
      assert.notEqual(
        movedSelection.x,
        initialSelection.x,
        "selection x should change when dragging inside the selection"
      );
      assert.notEqual(
        movedSelection.y,
        initialSelection.y,
        "selection y should change when dragging inside the selection"
      );

      await overlayPage.keyboard.press("Escape").catch((error) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!message.includes("Target page, context or browser has been closed")) {
          throw error;
        }
      });
      await waitForOverlayVisibility(session, false);
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
    }
  }
);

test(
  "electron smoke: LiteSnap restores the saved drawing tool after selection",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap restores the saved drawing tool after selection";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession();
      await session.page.evaluate(async () => {
        await window.launcher.setLiteSnapSettings({ annotationTool: "arrow" });
      });

      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      assert.equal(
        await overlayPage.evaluate(
          () => document.getElementById("litesnap-overlay")?.dataset.tool
        ),
        "select",
        "capture must begin in selection mode so a region can be created"
      );

      await createOverlaySelection(overlayPage);
      const activeTool = await overlayPage.evaluate(() => ({
        tool: document.getElementById("litesnap-overlay")?.dataset.tool,
        arrowActive: document
          .querySelector('#litesnap-toolbar [data-tool="arrow"]')
          ?.classList.contains("is-active")
      }));
      assert.deepEqual(activeTool, { tool: "arrow", arrowActive: true });

      await overlayPage.keyboard.press("Escape").catch(() => undefined);
      await waitForOverlayVisibility(session, false);
    } catch (error) {
      if (session) {
        await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
    }
  }
);

test(
  "electron smoke: LiteSnap remembers independent widths for each annotation tool",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap remembers independent widths for each annotation tool";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession();
      await session.page.evaluate(async () => {
        const current = await window.launcher.getLiteSnapSettings();
        await window.launcher.setLiteSnapSettings({
          annotationTool: "arrow",
          annotationLineWidth: 14,
          annotationLineWidths: {
            ...current.annotationLineWidths,
            arrow: 14,
            rect: 2
          }
        });
      });

      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      await createOverlaySelection(overlayPage);

      const readWidthControl = async (): Promise<{
        value: string | null;
        label: string | null;
        hidden: boolean;
      }> =>
        overlayPage!.evaluate(() => {
          const slider = document.getElementById("litesnap-width-slider") as HTMLInputElement | null;
          const widths = document.getElementById("litesnap-widths");
          return {
            value: slider?.value ?? null,
            label: document.querySelector(".litesnap-overlay__width-value")?.textContent ?? null,
            hidden: Boolean(widths?.hidden)
          };
        });

      assert.deepEqual(await readWidthControl(), {
        value: "14",
        label: "箭头粗细 14",
        hidden: false
      });

      await overlayPage.locator('[data-tool="rect"]').click();
      assert.deepEqual(await readWidthControl(), {
        value: "2",
        label: "矩形粗细 2",
        hidden: false
      });
      await overlayPage.locator("#litesnap-width-slider").evaluate((node) => {
        const slider = node as HTMLInputElement;
        slider.value = "5";
        slider.dispatchEvent(new Event("input", { bubbles: true }));
      });

      await overlayPage.locator('[data-tool="arrow"]').click();
      assert.equal((await readWidthControl()).value, "14");
      await overlayPage.locator('[data-tool="rect"]').click();
      assert.deepEqual(await readWidthControl(), {
        value: "5",
        label: "矩形粗细 5",
        hidden: false
      });

      await overlayPage.locator('[data-tool="text"]').click();
      assert.equal((await readWidthControl()).hidden, true);
      await overlayPage.locator('[data-tool="number"]').click();
      assert.equal((await readWidthControl()).hidden, true);

      await overlayPage.waitForTimeout(550);
      const savedWidths = await session.page.evaluate(async () => {
        const settings = await window.launcher.getLiteSnapSettings();
        return settings.annotationLineWidths;
      });
      assert.equal(savedWidths.arrow, 14);
      assert.equal(savedWidths.rect, 5);

      await overlayPage.keyboard.press("Escape").catch(() => undefined);
      await waitForOverlayVisibility(session, false);
    } catch (error) {
      if (session) {
        await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
    }
  }
);

test(
  "electron smoke: LiteSnap double click copies the current selection",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap double click copies the current selection";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession();
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);

      const selection = await createOverlaySelection(overlayPage);
      const center = {
        x: selection.x + selection.width / 2,
        y: selection.y + selection.height / 2
      };

      await dispatchOverlayDoubleClick(overlayPage, center);
      await waitForOverlayVisibility(session, false);

      const clipboardState = await session.electronApp.evaluate(({ clipboard }) => {
        const image = clipboard.readImage();
        const size = image.getSize();
        return {
          isEmpty: image.isEmpty(),
          width: size.width,
          height: size.height
        };
      });
      assert.equal(
        clipboardState.isEmpty,
        false,
        "double click should copy the current capture into the clipboard"
      );
      assert.ok(
        clipboardState.width > 0 && clipboardState.height > 0,
        "copied clipboard image should have a visible size"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
    }
  }
);

test(
  "electron smoke: LiteSnap save button writes the current selection to disk",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap save button writes the current selection to disk";
    const saveDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-litesnap-save-")
    );
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession();
      await session.page.evaluate(async (directory) => {
        await window.launcher.setLiteSnapSettings({
          saveDirectory: directory,
          saveFormat: "png"
        });
      }, saveDirectory);

      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);

      await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "save");
      await waitForOverlayVisibility(session, false);
      const savedFile = await waitForLiteSnapSavedFile(saveDirectory);

      assert.match(savedFile, /^LiteSnap_.*\.png$/i);
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
      await fs.rm(saveDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
  }
);

test(
  "electron smoke: LiteSnap history editing preserves the original and creates a new item",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap history editing preserves the original and creates a new item";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession();
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "copy");
      await waitForOverlayVisibility(session, false);

      const historyBefore = await session.page.evaluate(() => window.launcher.liteSnapListHistory());
      assert.ok(historyBefore.length >= 1, "copy should add an original history item");
      const original = historyBefore[0];
      assert.ok(original, "history should expose the original item");

      const opened = await session.page.evaluate((id) => window.launcher.liteSnapHistoryEdit(id), original.id);
      assert.equal(opened, true, "history image should open in the editor");
      await waitForOverlayVisibility(session, true);
      await waitForOverlayReady(overlayPage);

      const editorState = await overlayPage.evaluate(async () => {
        const state = await window.launcher.liteSnapGetOverlayState();
        const longButton = document.querySelector<HTMLButtonElement>('button[data-action="long"]');
        const selection = document.getElementById("litesnap-selection") as HTMLElement | null;
        return {
          editorMode: state?.editorMode,
          longButtonHidden: longButton?.hidden ?? false,
          selectionVisible: Boolean(selection && !selection.hidden)
        };
      });
      assert.deepEqual(editorState, {
        editorMode: true,
        longButtonHidden: true,
        selectionVisible: true
      });

      const editorViewport = await overlayPage.evaluate(() => {
        const root = document.getElementById("litesnap-overlay") as HTMLElement;
        const canvas = document.getElementById("litesnap-canvas") as HTMLCanvasElement;
        root.dispatchEvent(
          new WheelEvent("wheel", {
            bubbles: true,
            cancelable: true,
            ctrlKey: true,
            deltaY: -120,
            clientX: 180,
            clientY: 120
          })
        );
        const pointer = (type: string, x: number, y: number, button: number) =>
          root.dispatchEvent(
            new PointerEvent(type, {
              bubbles: true,
              cancelable: true,
              pointerId: 8,
              pointerType: "mouse",
              isPrimary: true,
              button,
              clientX: x,
              clientY: y
            })
          );
        pointer("pointerdown", 180, 120, 1);
        pointer("pointermove", 216, 148, 1);
        pointer("pointerup", 216, 148, 1);
        return {
          backgroundSize: root.style.backgroundSize,
          transform: canvas.style.transform
        };
      });
      assert.match(editorViewport.backgroundSize, /px/);
      assert.match(editorViewport.transform, /scale\(/);
      assert.match(editorViewport.transform, /translate\(/);

      await overlayPage.evaluate(() => {
        document.querySelector<HTMLButtonElement>('[data-tool="rect"]')?.click();
      });
      await dispatchOverlayDrag(overlayPage, { x: 80, y: 80 }, { x: 200, y: 150 });
      await clickOverlayToolbarButton(overlayPage, "copy");
      await waitForOverlayVisibility(session, false);

      const historyAfter = await session.page.evaluate(() => window.launcher.liteSnapListHistory());
      assert.ok(
        historyAfter.some((item) => item.id === original.id),
        "editing must never overwrite the original history item"
      );
      assert.ok(
        historyAfter.some((item) => item.source === "history-edit"),
        "exporting an edit should create a separate history-edit item"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
    }
  }
);

test(
  "electron smoke: LiteSnap manually scrolled long capture automatically appends, then finishes and cancels",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap manually scrolled long capture automatically appends, then finishes and cancels";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession({
        extraEnv: { LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION: "1" }
      });
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      const longSelection = await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");

      let controller = await waitForLongCaptureController(session);
      let guide = await waitForLongCaptureGuide(session);
      const guideGeometry = await session.electronApp.evaluate(({ BrowserWindow }) => {
        const windows = BrowserWindow.getAllWindows();
        const guideWindow = windows.find((window) =>
          window.webContents.getURL().includes("litesnap-long-capture-guide.html")
        );
        const overlayWindow = windows.find((window) =>
          window.webContents.getURL().includes("litesnap-overlay.html")
        );
        return {
          guide: guideWindow?.getBounds() ?? null,
          overlay: overlayWindow?.getBounds() ?? null
        };
      });
      assert.equal(
        guideGeometry.guide?.x,
        (guideGeometry.overlay?.x ?? 0) + longSelection.x - 4,
        "the guide border must start outside the sampled left edge"
      );
      assert.equal(
        guideGeometry.guide?.y,
        (guideGeometry.overlay?.y ?? 0) + longSelection.y - 4,
        "the guide border must start outside the sampled top edge"
      );
      // The DOM selection includes resize affordances, whereas the native
      // capture selection excludes them. The guide must still extend beyond
      // that visible selection on both axes, placing its dashed edge outside
      // the sampled image.
      assert.ok(
        (guideGeometry.guide?.width ?? 0) > longSelection.width &&
          (guideGeometry.guide?.height ?? 0) > longSelection.height,
        "the guide must extend beyond the selected capture rectangle"
      );
      await session.page.waitForFunction(
        async () => {
          const progress = await window.launcher.liteSnapGetLongCaptureProgress();
          return progress?.phase === "capturing" && progress.frameCount === 1;
        },
        undefined,
        { timeout: 10000 }
      );
      await overlayPage.waitForFunction(() => {
        const root = document.getElementById("litesnap-overlay");
        const dim = document.getElementById("litesnap-dim") as HTMLElement | null;
        return root?.dataset.longCaptureGuide === "true" && Boolean(dim && !dim.hidden);
      });
      const maskState = await overlayPage.evaluate(() => {
        const dim = document.getElementById("litesnap-dim") as HTMLElement | null;
        const dimTop = document.getElementById("litesnap-dim-top") as HTMLElement | null;
        const selection = document.getElementById("litesnap-selection") as HTMLElement | null;
        return {
          dimVisible: Boolean(dim && !dim.hidden),
          dimTopHeight: dimTop?.getBoundingClientRect().height ?? 0,
          selectionDisplay: selection ? getComputedStyle(selection).display : "missing"
        };
      });
      assert.equal(maskState.dimVisible, true, "long capture must keep the outside-area dim mask visible");
      assert.ok(maskState.dimTopHeight > 0, "the area above the long-capture selection should be dimmed");
      assert.equal(
        maskState.selectionDisplay,
        "none",
        "the click-through mask must not duplicate the dedicated dashed guide"
      );
      assert.ok(
        await guide.evaluate(() => {
          const event = new PointerEvent("pointerdown", { bubbles: true, cancelable: true });
          document.querySelector(".guide")?.dispatchEvent(event);
          return event.defaultPrevented;
        }),
        "the dedicated long-capture guide must consume clicks inside the selection"
      );
      const guideHitTestSurface = await guide.evaluate(() => {
        const node = document.querySelector(".guide");
        return node ? getComputedStyle(node).backgroundColor : "";
      });
      assert.notEqual(
        guideHitTestSurface,
        "rgba(0, 0, 0, 0)",
        "the Windows layered guide needs a non-zero alpha hit-test surface to receive wheel events"
      );
      await session.page.waitForTimeout(650);
      const beforeManualAppend = await session.page.evaluate(() =>
        window.launcher.liteSnapGetLongCaptureProgress()
      );
      assert.equal(beforeManualAppend?.frameCount, 1, "long capture must not scroll or append by itself");
      assert.equal(
        await session.page.evaluate(() => window.launcher.liteSnapStartCapture()),
        true,
        "retriggering the screenshot shortcut should be consumed by the active long capture"
      );
      await session.page.waitForTimeout(250);
      const afterShortcutRetrigger = await session.page.evaluate(() =>
        window.launcher.liteSnapGetLongCaptureProgress()
      );
      assert.equal(
        afterShortcutRetrigger?.phase,
        "capturing",
        "retriggering the screenshot shortcut must not dismiss long capture"
      );
      assert.equal(
        afterShortcutRetrigger?.frameCount,
        1,
        "retriggering the screenshot shortcut must preserve the current long-capture session"
      );
      assert.equal(
        await controller.locator("#capture").count(),
        0,
        "the manual controller must not require a capture button"
      );
      // E2E has no real desktop scroll target. The internal bridge advances
      // the synthetic target frame just as a user scroll would in production.
      await session.page.evaluate(() => window.launcher.liteSnapControlLongCapture("capture"));
      await session.page.evaluate(() => window.launcher.liteSnapControlLongCapture("capture"));
      const pendingBeforeFinish = await session.page.evaluate(() =>
        window.launcher.liteSnapGetLongCaptureProgress()
      );
      assert.equal(
        pendingBeforeFinish?.frameCount,
        3,
        "each manually advanced viewport should be committed without waiting for another stable frame"
      );
      const longCaptureWindowState = await session.electronApp.evaluate(({ BrowserWindow }) => {
        const windows = BrowserWindow.getAllWindows();
        const guideWindow = windows.find((window) =>
          window.webContents.getURL().includes("litesnap-long-capture-guide.html")
        );
        const controllerWindow = windows.find((window) =>
          window.webContents.getURL().includes("litesnap-long-capture.html")
        );
        const overlayWindow = windows.find((window) =>
          window.webContents.getURL().includes("litesnap-overlay.html")
        );
        return {
          maskVisible: overlayWindow?.isVisible() ?? false,
          maskOpacity: overlayWindow?.getOpacity() ?? 0,
          guideVisible: guideWindow?.isVisible() ?? false,
          guideAlwaysOnTop: guideWindow?.isAlwaysOnTop() ?? false,
          controllerVisible: controllerWindow?.isVisible() ?? false,
          controllerAlwaysOnTop: controllerWindow?.isAlwaysOnTop() ?? false
        };
      });
      assert.deepEqual(
        longCaptureWindowState,
        {
          maskVisible: true,
          maskOpacity: 1,
          guideVisible: true,
          guideAlwaysOnTop: true,
          controllerVisible: true,
          controllerAlwaysOnTop: true
        },
        "background sampling must keep the selection guide and controller visible above the target"
      );
      const finishClickedAt = Date.now();
      await controller.locator("#finish").click();
      try {
        await waitForOverlayVisibility(session, false);
      } catch (error) {
        const snapshot = await session.page.evaluate(async () => ({
          state: await window.launcher.liteSnapGetOverlayState(),
          progress: await window.launcher.liteSnapGetLongCaptureProgress(),
          diagnostics: await window.launcher.liteSnapGetDiagnostics()
        }));
        throw new Error(
          `long capture did not return to the editor: ${JSON.stringify(snapshot)}; ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      const completed = await session.page.evaluate(async () => {
        const state = await window.launcher.liteSnapGetOverlayState();
        const diagnostics = await window.launcher.liteSnapGetDiagnostics();
        return { state, diagnostics };
      });
      assert.equal(completed.state, null, "finished long capture should save and close without opening an editor");
      assert.ok(
        Date.now() - finishClickedAt < 5000,
        "explicit finish should save verified content promptly without waiting for another frame match"
      );
      const completeDiagnostic = completed.diagnostics.find(
        (entry) => entry.operation === "long-capture" && entry.status === "success"
      );
      assert.ok(completeDiagnostic, "finished long capture should have a success diagnostic");
      assert.ok(
        Number(completeDiagnostic.metrics.stitchedHeight) > longSelection.height * 1.5,
        "finishing immediately must save the already verified stitched content"
      );

      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");
      controller = await waitForLongCaptureController(session);
      guide = await waitForLongCaptureGuide(session);
      // Escape intentionally closes the guide synchronously. Playwright can
      // therefore observe the target being closed before keyboard.press
      // resolves; that is the expected outcome, not a test failure.
      await guide.keyboard.press("Escape").catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        if (!/Target page, context or browser has been closed/i.test(message)) {
          throw error;
        }
      });
      await waitForOverlayVisibility(session, false);

      const diagnostics = await session.page.evaluate(() => window.launcher.liteSnapGetDiagnostics());
      assert.ok(
        diagnostics.some(
          (entry) => entry.operation === "long-capture" && entry.status === "cancelled"
        ),
        "Escape should cancel the long capture and persist a cancellation diagnostic"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
    }
  }
);

test(
  "electron smoke: LiteSnap captures both ends after scrolling from the middle up, then down",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap captures both ends after scrolling from the middle up, then down";
    const saveDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-litesnap-bidirectional-")
    );
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession({
        extraEnv: {
          LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION: "1",
          LITELAUNCHER_E2E_LONG_CAPTURE_START_INDEX: "3"
        }
      });
      await session.page.evaluate(async (directory) => {
        await window.launcher.setLiteSnapSettings({
          saveDirectory: directory,
          saveFormat: "png"
        });
      }, saveDirectory);
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      const selection = await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");
      const controller = await waitForLongCaptureController(session);
      await waitForLongCaptureGuide(session);
      const captureSelection = await overlayPage.evaluate(async () => {
        const state = await window.launcher.liteSnapGetOverlayState();
        return state?.longCaptureSelection ?? null;
      });
      assert.ok(captureSelection, "long capture should expose its logical selection bounds");

      const relayScroll = async (deltaY: number) => {
        const scrolled = await session!.page.evaluate(
          (delta) => window.launcher.liteSnapScrollLongCapture(delta),
          deltaY
        );
        assert.equal(scrolled, true, `synthetic scroll ${deltaY} should move the target`);
        await session!.page.waitForTimeout(700);
      };

      for (let index = 0; index < 3; index += 1) {
        await relayScroll(-120);
      }
      for (let index = 0; index < 6; index += 1) {
        await relayScroll(120);
      }

      await controller.locator("#finish").click();
      await waitForOverlayVisibility(session, false);
      const savedFileName = await waitForLiteSnapSavedFile(saveDirectory);
      const savedPath = path.join(saveDirectory, savedFileName);
      const pixels = await session.electronApp.evaluate(
        ({ nativeImage }, filePath) => {
          const image = nativeImage.createFromPath(filePath);
          const size = image.getSize();
          const bitmap = image.toBitmap();
          let topMarkerPixels = 0;
          let bottomMarkerPixels = 0;
          for (let index = 0; index + 3 < bitmap.length; index += 4) {
            const blue = bitmap[index] ?? 0;
            const green = bitmap[index + 1] ?? 0;
            const red = bitmap[index + 2] ?? 0;
            if (blue > 190 && green < 80 && red > 190) {
              topMarkerPixels += 1;
            }
            if (blue < 80 && green > 190 && red > 190) {
              bottomMarkerPixels += 1;
            }
          }
          return { ...size, topMarkerPixels, bottomMarkerPixels };
        },
        savedPath
      );
      assert.equal(
        pixels.width,
        captureSelection.width,
        "saved long capture should keep the logical selection width"
      );
      assert.ok(pixels.height > selection.height * 4, "bidirectional output should contain the full range");
      assert.ok(pixels.topMarkerPixels > 20, "saved image should contain the synthetic top marker");
      assert.ok(pixels.bottomMarkerPixels > 20, "saved image should contain the synthetic bottom marker");

      const diagnostics = await session.page.evaluate(() => window.launcher.liteSnapGetDiagnostics());
      const completed = diagnostics.find(
        (entry) => entry.operation === "long-capture" && entry.status === "success"
      );
      assert.ok(completed, "bidirectional capture should write a success diagnostic");
      assert.ok(
        Number(completed.metrics.directionSwitches) >= 1,
        "diagnostics should record the upward-to-downward direction switch"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
      await fs.rm(saveDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
  }
);

test(
  "electron smoke: LiteSnap scrolls from top to bottom and back up without losing the bottom",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap scrolls from top to bottom and back up without losing the bottom";
    const saveDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-litesnap-down-up-")
    );
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession({
        extraEnv: { LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION: "1" }
      });
      await session.page.evaluate(async (directory) => {
        await window.launcher.setLiteSnapSettings({
          saveDirectory: directory,
          saveFormat: "png"
        });
      }, saveDirectory);
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      const selection = await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");
      const controller = await waitForLongCaptureController(session);
      await waitForLongCaptureGuide(session);

      const relayScroll = async (deltaY: number) => {
        const scrolled = await session!.page.evaluate(
          (delta) => window.launcher.liteSnapScrollLongCapture(delta),
          deltaY
        );
        assert.equal(scrolled, true, `synthetic scroll ${deltaY} should move the target`);
        await session!.page.waitForTimeout(700);
      };

      for (let index = 0; index < 6; index += 1) {
        await relayScroll(120);
      }
      const atBottom = await session.page.evaluate(() =>
        window.launcher.liteSnapGetLongCaptureProgress()
      );
      assert.ok(atBottom && atBottom.stitchedHeight > selection.height * 4);

      for (let index = 0; index < 6; index += 1) {
        await relayScroll(-120);
      }
      const backAtTop = await session.page.evaluate(() =>
        window.launcher.liteSnapGetLongCaptureProgress()
      );
      assert.equal(
        backAtTop?.stitchedHeight,
        atBottom.stitchedHeight,
        "returning upward through captured content must not shrink or replace the saved bottom range"
      );

      await controller.locator("#finish").click();
      await waitForOverlayVisibility(session, false);
      const savedFileName = await waitForLiteSnapSavedFile(saveDirectory);
      const pixels = await session.electronApp.evaluate(
        ({ nativeImage }, filePath) => {
          const image = nativeImage.createFromPath(filePath);
          const size = image.getSize();
          const bitmap = image.toBitmap();
          let topMarkerPixels = 0;
          let bottomMarkerPixels = 0;
          for (let index = 0; index + 3 < bitmap.length; index += 4) {
            const blue = bitmap[index] ?? 0;
            const green = bitmap[index + 1] ?? 0;
            const red = bitmap[index + 2] ?? 0;
            if (blue > 190 && green < 80 && red > 190) topMarkerPixels += 1;
            if (blue < 80 && green > 190 && red > 190) bottomMarkerPixels += 1;
          }
          return { ...size, topMarkerPixels, bottomMarkerPixels };
        },
        path.join(saveDirectory, savedFileName)
      );
      assert.ok(pixels.height > selection.height * 4);
      assert.ok(pixels.topMarkerPixels > 20);
      assert.ok(pixels.bottomMarkerPixels > 20);

      const diagnostics = await session.page.evaluate(() => window.launcher.liteSnapGetDiagnostics());
      const completed = diagnostics.find(
        (entry) => entry.operation === "long-capture" && entry.status === "success"
      );
      assert.ok(Number(completed?.metrics.directionSwitches) >= 1);
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
      await fs.rm(saveDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
  }
);

test(
  "electron native: LiteSnap captures a real controllable Windows scroll target",
  { timeout: 240000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap native long capture only runs on Windows");
      return;
    }
    if (process.env.LITELAUNCHER_E2E_REAL_LONG_CAPTURE !== "1") {
      t.skip("set LITELAUNCHER_E2E_REAL_LONG_CAPTURE=1 to run the real desktop fixture");
      return;
    }

    const testName =
      "electron native: LiteSnap captures a real controllable Windows scroll target";
    const saveDirectory = await fs.mkdtemp(
      path.join(os.tmpdir(), "litelauncher-litesnap-native-scroll-")
    );
    const fixtureStatusPath = path.join(saveDirectory, "fixture-status.json");
    const fixtureControlPath = path.join(saveDirectory, "fixture-control.txt");
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;
    let fixtureProcess: ChildProcess | null = null;

    try {
      session = await launchE2ESession();
      await session.page.evaluate(async (directory) => {
        await window.launcher.setLiteSnapSettings({
          saveDirectory: directory,
          saveFormat: "png"
        });
      }, saveDirectory);
      const fixtureEnv: NodeJS.ProcessEnv = {
        ...process.env,
        LITELAUNCHER_E2E_SCROLL_FIXTURE_STATUS: fixtureStatusPath,
        LITELAUNCHER_E2E_SCROLL_FIXTURE_CONTROL: fixtureControlPath
      };
      delete fixtureEnv.ELECTRON_RUN_AS_NODE;
      fixtureProcess = spawn(
        path.join(process.cwd(), "node_modules", "electron", "dist", "electron.exe"),
        [path.join(
          process.cwd(),
          "src",
          "test",
          "fixtures",
          "litesnap-native-scroll-fixture.cjs"
        )],
        {
          cwd: process.cwd(),
          env: fixtureEnv,
          stdio: "ignore",
          windowsHide: true
        }
      );
      const initialFixtureStatus = await waitForNativeScrollFixture(fixtureStatusPath);
      // The launcher is created before the external fixture. Explicitly put
      // the fixture back in front before F1 so the real-desktop test always
      // selects and captures that window instead of whichever E2E page last
      // received focus during bootstrap.
      await fs.writeFile(fixtureControlPath, JSON.stringify({ focus: true }), "utf8");
      await new Promise((resolve) => setTimeout(resolve, 500));

      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      const selection = await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");
      const controller = await waitForLongCaptureController(session);
      await waitForLongCaptureGuide(session);
      const captureSelection = await overlayPage.evaluate(async () => {
        const state = await window.launcher.liteSnapGetOverlayState();
        return state?.longCaptureSelection ?? null;
      });
      assert.ok(captureSelection);

      let reachedBottom = false;
      let lastScrollY = initialFixtureStatus.y;
      let nativeScrollAttempts = 0;
      let nativeScrollMoves = 0;
      for (let attempt = 0; attempt < 60; attempt += 1) {
        const didScroll: boolean = await session.page.evaluate(() =>
          window.launcher.liteSnapScrollLongCapture(120)
        );
        nativeScrollAttempts += 1;
        await session.page.waitForTimeout(300);
        let scroll = JSON.parse(
          await fs.readFile(fixtureStatusPath, "utf8")
        ) as NativeScrollFixtureStatus;
        if (didScroll && scroll.y > lastScrollY) {
          nativeScrollMoves += 1;
        } else {
          await fs.writeFile(
            fixtureControlPath,
            JSON.stringify({ scrollBy: 40 }),
            "utf8"
          );
          const controlDeadline = Date.now() + 3000;
          while (Date.now() < controlDeadline) {
            await session.page.waitForTimeout(100);
            scroll = JSON.parse(
              await fs.readFile(fixtureStatusPath, "utf8")
            ) as NativeScrollFixtureStatus;
            if (scroll.y > lastScrollY ||
              scroll.y + scroll.innerHeight >= scroll.scrollHeight - 2) {
              break;
            }
          }
        }
        assert.ok(scroll.y >= lastScrollY, "the controllable target should move downward");
        lastScrollY = scroll.y;
        await session.page.waitForTimeout(550);
        if (scroll.y + scroll.innerHeight >= scroll.scrollHeight - 2) {
          reachedBottom = true;
          break;
        }
      }
      assert.equal(
        reachedBottom,
        true,
        `native wheel input should reach the fixture bottom (last scrollY=${lastScrollY})`
      );

      let reversedUpward = false;
      for (let attempt = 0; attempt < 12; attempt += 1) {
        const previousScrollY = lastScrollY;
        const didScroll: boolean = await session.page.evaluate(() =>
          window.launcher.liteSnapScrollLongCapture(-120)
        );
        nativeScrollAttempts += 1;
        await session.page.waitForTimeout(650);
        const scroll = JSON.parse(
          await fs.readFile(fixtureStatusPath, "utf8")
        ) as NativeScrollFixtureStatus;
        if (didScroll && scroll.y < previousScrollY) {
          nativeScrollMoves += 1;
          lastScrollY = scroll.y;
          reversedUpward = true;
          break;
        }
      }
      assert.equal(reversedUpward, true, "native wheel input should move upward after reaching bottom");

      let returnedToBottom = false;
      for (let attempt = 0; attempt < 20; attempt += 1) {
        const previousScrollY = lastScrollY;
        const didScroll: boolean = await session.page.evaluate(() =>
          window.launcher.liteSnapScrollLongCapture(120)
        );
        nativeScrollAttempts += 1;
        await session.page.waitForTimeout(650);
        const scroll = JSON.parse(
          await fs.readFile(fixtureStatusPath, "utf8")
        ) as NativeScrollFixtureStatus;
        if (didScroll && scroll.y > previousScrollY) {
          nativeScrollMoves += 1;
        }
        lastScrollY = scroll.y;
        if (scroll.y + scroll.innerHeight >= scroll.scrollHeight - 2) {
          returnedToBottom = true;
          break;
        }
      }
      assert.equal(returnedToBottom, true, "native wheel input should return to the fixture bottom");
      await session.page.waitForTimeout(900);
      const beforeFinish = await session.page.evaluate(() =>
        window.launcher.liteSnapGetLongCaptureProgress()
      );
      if (!controller.isClosed()) {
        await controller.locator("#finish").click().catch((error: unknown) => {
          const message = error instanceof Error ? error.message : String(error);
          if (!/Target page, context or browser has been closed/i.test(message)) {
            throw error;
          }
        });
      }
      try {
        await waitForOverlayVisibility(session, false);
      } catch (error) {
        const snapshot = await session.page.evaluate(async () => ({
          progress: await window.launcher.liteSnapGetLongCaptureProgress(),
          diagnostics: await window.launcher.liteSnapGetDiagnostics()
        }));
        throw new Error(
          `native fixture finish failed: before=${JSON.stringify(beforeFinish)} after=${JSON.stringify(snapshot)}; ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }

      let savedFileName: string;
      try {
        savedFileName = await waitForLiteSnapSavedFile(saveDirectory);
      } catch (error) {
        const diagnostics = await session.page.evaluate(() => window.launcher.liteSnapGetDiagnostics());
        throw new Error(
          `native fixture ended without a PNG: before=${JSON.stringify(beforeFinish)} diagnostics=${JSON.stringify(diagnostics)}; ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      }
      const savedPath = path.join(saveDirectory, savedFileName);
      const nativeDiagnostics = await session.page.evaluate(() =>
        window.launcher.liteSnapGetDiagnostics()
      );
      const pixels = await session.electronApp.evaluate(
        ({ nativeImage }, filePath) => {
          const image = nativeImage.createFromPath(filePath);
          const size = image.getSize();
          const bitmap = image.toBitmap();
          let topMarkerPixels = 0;
          let bottomMarkerPixels = 0;
          let purpleGuidePixels = 0;
          for (let index = 0; index + 3 < bitmap.length; index += 4) {
            const blue = bitmap[index] ?? 0;
            const green = bitmap[index + 1] ?? 0;
            const red = bitmap[index + 2] ?? 0;
            if (blue > 210 && green < 45 && red > 210) topMarkerPixels += 1;
            if (blue < 45 && green > 210 && red > 210) bottomMarkerPixels += 1;
            if (blue >= 250 && green >= 94 && green <= 104 && red >= 152 && red <= 162) {
              purpleGuidePixels += 1;
            }
          }
          return { ...size, topMarkerPixels, bottomMarkerPixels, purpleGuidePixels };
        },
        savedPath
      );
      assert.equal(pixels.width, captureSelection.width);
      assert.ok(
        pixels.height > selection.height * 2,
        `native passive output should exceed two viewports: before=${JSON.stringify(beforeFinish)} pixels=${JSON.stringify(pixels)} diagnostics=${JSON.stringify(nativeDiagnostics)}`
      );
      assert.ok(
        pixels.topMarkerPixels > 20,
        `native output should include the top marker: before=${JSON.stringify(beforeFinish)} pixels=${JSON.stringify(pixels)} diagnostics=${JSON.stringify(nativeDiagnostics)}`
      );
      assert.ok(
        pixels.bottomMarkerPixels > 20,
        `native output should include the bottom marker: before=${JSON.stringify(beforeFinish)} pixels=${JSON.stringify(pixels)} diagnostics=${JSON.stringify(nativeDiagnostics)}`
      );
      assert.equal(pixels.purpleGuidePixels, 0, "dashed guide pixels must not enter the saved image");
      assert.ok(nativeScrollAttempts > 0, "the test should exercise the native scroll bridge");
      assert.ok(
        nativeScrollMoves >= 3,
        `the native scroll bridge must move the fixture in both directions (moves=${nativeScrollMoves})`
      );
      const diagnostics = await session.page.evaluate(() => window.launcher.liteSnapGetDiagnostics());
      const completed = diagnostics.find(
        (entry) => entry.operation === "long-capture" && entry.status === "success"
      );
      assert.equal(
        completed?.metrics.capturePath,
        "windows-native-region",
        "the controllable fixture must still use region-level Windows native capture"
      );
      assert.ok(
        Number(completed?.metrics.directionSwitches) >= 1,
        "the real fixture should record the downward-to-upward direction switch"
      );
    } catch (error) {
      if (session) {
        const artifactDir = await captureE2EFailureArtifacts(
          overlayPage ?? session.page,
          testName,
          error,
          session.electronApp
        );
        console.error(`[e2e] failure artifacts saved to ${artifactDir}`);
      }
      throw error;
    } finally {
      if (fixtureProcess && !fixtureProcess.killed) {
        fixtureProcess.kill();
      }
      if (session) {
        await closeLiteSnapE2ESession(session);
      }
      await fs.rm(saveDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
  }
);
