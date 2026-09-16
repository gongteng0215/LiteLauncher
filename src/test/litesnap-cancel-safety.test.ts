import assert from "node:assert/strict";
import test from "node:test";
import { LiteSnapCaptureSessionManager } from "../main/litesnap/capture-session-manager";

test("cancellation releases every input window before slow diagnostics finish", async () => {
  // Exercise the real cancellation method without constructing Electron windows.
  const manager = Object.create(LiteSnapCaptureSessionManager.prototype) as any;
  const events: string[] = [];
  let finishDiagnostics!: () => void;
  const diagnostics = new Promise<void>((resolve) => { finishDiagnostics = resolve; });
  const overlay = { isDestroyed: () => false, hide: () => events.push("hide") };
  Object.assign(manager, {
    session: { overlayWindow: overlay, diagnosticFinalized: true, display: {} },
    longCapture: { startedAt: 0 },
    longCaptureEscapeRegistered: false,
    overlayLifecycle: { park: () => events.push("release-input") },
    longCaptureWindows: { close: () => events.push("close-helpers") },
    longCaptureCoordinator: { clearPoll() {}, buildDiagnosticMetrics: () => ({}) },
    diagnostics: { record: () => diagnostics },
    emitOverlayStateChanged: async () => { events.push("reset-renderer"); },
    frameCacheService: { warmDisplay: () => events.push("warm") }
  });
  const cancellation = manager.cancelCapture();
  assert.equal(manager.session, null);
  assert.equal(manager.longCapture, null);
  assert.deepEqual(events, ["release-input", "hide", "close-helpers", "reset-renderer"]);
  // A new capture during delayed diagnostics must not get reset or hidden.
  manager.session = { captureId: "new" };
  finishDiagnostics();
  assert.equal(await cancellation, true);
  assert.equal(events.length, 4);
});

test("losing a long capture helper cancels instead of recreating windows", async () => {
  const manager = Object.create(LiteSnapCaptureSessionManager.prototype) as any;
  let cancellations = 0;
  manager.longCapture = { token: 7, phase: "finishing" };
  manager.cancelCapture = async () => { cancellations++; };
  await manager.handleLongCaptureAuxiliaryWindowClosed(6);
  assert.equal(cancellations, 0, "stale window events must not cancel another session");
  await manager.handleLongCaptureAuxiliaryWindowClosed(7);
  assert.equal(cancellations, 1, "closing a helper must also escape the finishing phase");
});

test("long capture starts when optional global Escape is unavailable and reports actual frame failures", { skip: process.platform !== "win32" }, async () => {
  const manager = Object.create(LiteSnapCaptureSessionManager.prototype) as any;
  const selection = { x: 0, y: 0, width: 100, height: 100 };
  const image = { isEmpty: () => false };
  let restored = false;
  Object.assign(manager, {
    session: { mode: "capture", display: {}, sourceImage: image, overlayWindow: { isDestroyed: () => true } },
    longCapture: null,
    startingLongCapture: false,
    longCaptureEscapeRegistered: false,
    e2eLongCaptureSimulation: true,
    imageService: {
      normalizeSelection: () => selection,
      cropSelection: () => ({ getSize: () => ({ width: 100, height: 100 }) }),
      createE2ELongCaptureFrame: () => image
    },
    tryRegisterLongCaptureEscape: () => { manager.longCaptureEscapeRegistered = false; },
    longCaptureCoordinator: { createSession: () => ({ token: 1, phase: "capturing" }) },
    longCaptureWindows: { open() {}, revealMask: async () => true, startWatch() {} },
    getOverlayState: async () => null,
    emitOverlayStateChanged: async () => {},
    keepLongCaptureWindowsVisible() {},
    scheduleLongCapturePoll() {},
    restoreOverlayAfterLongCaptureStartFailure: () => { restored = true; }
  });
  assert.deepEqual(await manager.startLongCapture({ selection }), { ok: true });
  assert.equal(manager.startingLongCapture, false);
  manager.longCapture = null;
  manager.imageService.createE2ELongCaptureFrame = () => null;
  const failed = await manager.startLongCapture({ selection });
  assert.equal(failed.ok, false);
  assert.match(failed.message, /原生截图未返回有效画面/);
  assert.equal(restored, true);
});
