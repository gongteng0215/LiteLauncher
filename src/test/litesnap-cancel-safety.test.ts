import assert from "node:assert/strict";
import test from "node:test";
import { LiteSnapCaptureSessionManager } from "../main/litesnap/capture-session-manager";

function failingSession() {
  const manager = Object.create(LiteSnapCaptureSessionManager.prototype) as any;
  const events: string[] = [];
  Object.assign(manager, {
    session: { mode: "capture", overlayWindow: { isDestroyed: () => false, hide: () => events.push("hide") }, diagnosticFinalized: true, display: {} },
    longCapture: { token: 1, phase: "capturing", startedAt: 0 },
    overlayLifecycle: { park: () => events.push("park") },
    longCaptureWindows: { close: () => events.push("close") },
    longCaptureCoordinator: { clearPoll() {}, buildDiagnosticMetrics: () => ({}) },
    diagnostics: { record: async () => {} },
    emitOverlayStateChanged: async () => {},
    frameCacheService: { warmDisplay() {} }
  });
  return { manager, events };
}

test("native frame exception closes the desktop and prevents another long capture", async () => {
  const { manager, events } = failingSession();
  manager.captureObservedLongCaptureFrame = async () => { throw new Error("native unavailable"); };
  await manager.runLongCaptureObservation(false);
  assert.equal(manager.session, null);
  assert.equal(manager.longCapture, null);
  assert.deepEqual(events, ["park", "hide", "close"]);
  assert.match(manager.longCaptureDisabledReason, /已停用/);
  assert.equal((await manager.startLongCapture({ selection: {} })).ok, false);
});

test("one failed window cleanup does not prevent hiding the mask or closing helpers", async () => {
  const { manager, events } = failingSession();
  manager.overlayLifecycle.park = () => { throw new Error("window API failed"); };
  await manager.cancelCapture();
  assert.deepEqual(events, ["hide", "close"]);
  assert.equal(manager.session, null);
});

test("helper failure disables long capture but stale failure cannot cancel a new session", async () => {
  const { manager, events } = failingSession();
  await manager.handleLongCaptureAuxiliaryWindowClosed(0, true);
  assert.equal(events.length, 0);
  await manager.handleLongCaptureAuxiliaryWindowClosed(1, true);
  assert.match(manager.longCaptureDisabledReason, /控制窗口异常/);
  assert.deepEqual(events, ["park", "hide", "close"]);
});

test("a hung frame releases input after the observation deadline", async (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const { manager, events } = failingSession();
  let finish!: () => void;
  manager.captureObservedLongCaptureFrame = () => new Promise<void>(resolve => { finish = resolve; });
  const observation = manager.runLongCaptureObservation(false);
  t.mock.timers.tick(8000);
  assert.deepEqual(events, ["park", "hide", "close"]);
  assert.match(manager.longCaptureDisabledReason, /无响应/);
  finish();
  await observation;
});

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
  let cancelled = false;
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
    cancelCapture: async () => { cancelled = true; manager.session = null; manager.longCapture = null; }
  });
  assert.deepEqual(await manager.startLongCapture({ selection }), { ok: true });
  assert.equal(manager.startingLongCapture, false);
  manager.longCapture = null;
  manager.imageService.createE2ELongCaptureFrame = () => null;
  const failed = await manager.startLongCapture({ selection });
  assert.equal(failed.ok, false);
  assert.match(failed.message, /原生截图未返回有效画面/);
  assert.equal(cancelled, true);
  assert.match(failed.message, /已停用/);
  assert.equal((await manager.startLongCapture({ selection })).ok, false);
});
