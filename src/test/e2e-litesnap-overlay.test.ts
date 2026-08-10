import assert from "node:assert/strict";
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
      .find((page) => page.url().includes("litesnap-long-capture.html"));
    if (controller) {
      await controller.waitForLoadState("domcontentloaded");
      return controller;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("LiteSnap long capture controller should open");
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
  "electron smoke: LiteSnap long capture pauses, resumes, finishes, and cancels deterministically",
  { timeout: 180000 },
  async (t) => {
    if (process.platform !== "win32") {
      t.skip("LiteSnap overlay regression only runs on Windows");
    }

    const testName =
      "electron smoke: LiteSnap long capture pauses, resumes, finishes, and cancels deterministically";
    let session: Awaited<ReturnType<typeof launchE2ESession>> | null = null;
    let overlayPage: Awaited<ReturnType<typeof waitForOverlayWindow>> | null = null;

    try {
      session = await launchE2ESession({
        extraEnv: { LITELAUNCHER_E2E_LONG_CAPTURE_SIMULATION: "1" }
      });
      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");

      let controller = await waitForLongCaptureController(session);
      await session.page.waitForFunction(
        async () => {
          const progress = await window.launcher.liteSnapGetLongCaptureProgress();
          return (progress?.frameCount ?? 0) >= 2;
        },
        undefined,
        { timeout: 15000 }
      );
      await controller.locator("#pause").click();
      await session.page.waitForFunction(
        async () => (await window.launcher.liteSnapGetLongCaptureProgress())?.phase === "paused",
        undefined,
        { timeout: 10000 }
      );
      await controller.locator("#pause").click();
      await session.page.waitForFunction(
        async () => (await window.launcher.liteSnapGetLongCaptureProgress())?.phase === "capturing",
        undefined,
        { timeout: 10000 }
      );
      await controller.locator("#finish").click();
      try {
        await waitForOverlayVisibility(session, true);
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
      await waitForOverlayReady(overlayPage);

      const completed = await session.page.evaluate(async () => {
        const state = await window.launcher.liteSnapGetOverlayState();
        const diagnostics = await window.launcher.liteSnapGetDiagnostics();
        return { state, diagnostics };
      });
      assert.equal(completed.state?.editorMode, true);
      const completeDiagnostic = completed.diagnostics.find(
        (entry) => entry.operation === "long-capture" && entry.status === "success"
      );
      assert.ok(completeDiagnostic, "finished long capture should have a success diagnostic");
      assert.ok(
        Number(completeDiagnostic.metrics.stitchedHeight) > 0,
        "long capture diagnostic should include output height"
      );

      await overlayPage.keyboard.press("Escape");
      await waitForOverlayVisibility(session, false);

      overlayPage = await waitForOverlayWindow(session);
      await waitForOverlayReady(overlayPage);
      await createOverlaySelection(overlayPage);
      await clickOverlayToolbarButton(overlayPage, "long");
      controller = await waitForLongCaptureController(session);
      await controller.locator("#cancel").click();
      await waitForOverlayVisibility(session, false);

      const diagnostics = await session.page.evaluate(() => window.launcher.liteSnapGetDiagnostics());
      assert.ok(
        diagnostics.some(
          (entry) => entry.operation === "long-capture" && entry.status === "cancelled"
        ),
        "cancelled long capture should persist a cancellation diagnostic"
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
