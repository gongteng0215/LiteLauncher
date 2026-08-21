import assert from "node:assert/strict";
import test from "node:test";
import type { NativeImage } from "electron";

import { LiteSnapLongCaptureCoordinator } from "../main/litesnap/long-capture-coordinator";

function fakeImage(width: number, height: number): NativeImage {
  const bitmap = Buffer.alloc(width * height * 4, 127);
  return {
    isEmpty: () => false,
    getSize: () => ({ width, height }),
    toBitmap: () => bitmap
  } as unknown as NativeImage;
}

test("long-capture coordinator issues a new token for every session", () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const first = coordinator.createSession(
    { x: 10, y: 10, width: 80, height: 60 },
    fakeImage(80, 60),
    "first"
  );
  const second = coordinator.createSession(
    { x: 10, y: 10, width: 80, height: 60 },
    fakeImage(80, 60),
    "second"
  );

  assert.ok(first && second);
  assert.ok(second.token > first.token);
});

test("long-capture coordinator keeps memory proportional to output segments, not viewport count", () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const session = coordinator.createSession(
    { x: 0, y: 0, width: 100, height: 80 },
    fakeImage(100, 80),
    "memory"
  );
  assert.ok(session);
  for (let index = 0; index < 100; index += 1) {
    session.frames.push({ image: fakeImage(100, 1), appendFrom: 0, appendTo: 1 });
  }
  const estimated = coordinator.estimateMemoryBytes(session);
  const outputBytes = 100 * (80 + 100) * 4;
  const viewportBytes = 100 * 80 * 4;

  assert.ok(estimated >= outputBytes + viewportBytes);
  assert.ok(
    estimated < outputBytes + viewportBytes * 4,
    "one hundred accepted segments must not retain one hundred full viewports"
  );
});

test("long-capture coordinator releases the wheel direction after accepting a frame", () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const session = coordinator.createSession(
    { x: 0, y: 0, width: 100, height: 80 },
    fakeImage(100, 80),
    "direction"
  );
  assert.ok(session);
  session.expectedDirection = "down";
  coordinator.acceptFrame(session, session.currentFrame, "down", 20);

  assert.equal(session.lastDirection, "down");
  assert.equal(session.expectedDirection, null);
});

test("long-capture coordinator records successful user input direction changes", () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const session = coordinator.createSession(
    { x: 0, y: 0, width: 100, height: 80 },
    fakeImage(100, 80),
    "input-direction"
  );
  assert.ok(session);

  coordinator.recordInputDirection(session, "down");
  coordinator.recordInputDirection(session, "down");
  coordinator.recordInputDirection(session, "up");
  coordinator.recordInputDirection(session, "down");

  assert.equal(session.directionSwitches, 2);
  assert.equal(session.lastInputDirection, "down");
});

test("long-capture coordinator confirms the final stable frame before completion", async () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const session = coordinator.createSession(
    { x: 0, y: 0, width: 40, height: 30 },
    fakeImage(40, 30),
    "finish"
  );
  assert.ok(session);
  session.pendingFrame = session.currentFrame;
  let observations = 0;
  const ready = await coordinator.confirmFinalFrame(
    session,
    200,
    1,
    async () => {
      observations += 1;
      if (observations === 2) {
        session.pendingFrame = null;
      }
    },
    () => true
  );

  assert.equal(ready, true);
  assert.equal(observations, 2);
  assert.ok(session.finishSettleMs >= 0);
});

test("long-capture coordinator stops final confirmation after cancellation", async () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const session = coordinator.createSession(
    { x: 0, y: 0, width: 40, height: 30 },
    fakeImage(40, 30),
    "cancel"
  );
  assert.ok(session);
  session.pendingFrame = session.currentFrame;
  const ready = await coordinator.confirmFinalFrame(
    session,
    200,
    1,
    async () => undefined,
    () => false
  );

  assert.equal(ready, false);
});

test("long-capture diagnostics contain anonymous lifecycle and performance metrics", () => {
  const coordinator = new LiteSnapLongCaptureCoordinator();
  const session = coordinator.createSession(
    { x: 0, y: 0, width: 40, height: 30 },
    fakeImage(80, 60),
    "metrics"
  );
  assert.ok(session);
  session.acceptedFrameCount = 4;
  session.rejectedFrameCount = 2;
  session.directionSwitches = 1;
  session.maskFailureReason = "mask-ready-timeout";
  session.lastMatchScore = 3.456;
  session.lastMatchOverlap = 120;
  session.lastMatchAppend = 40;
  session.lastMatchDirection = "down";
  const metrics = coordinator.buildDiagnosticMetrics(session);

  assert.equal(metrics.acceptedFrames, 4);
  assert.equal(metrics.rejectedFrames, 2);
  assert.equal(metrics.directionSwitches, 1);
  assert.equal(metrics.maskState, "mask-ready-timeout");
  assert.equal(metrics.physicalWidth, 80);
  assert.equal(metrics.lastMatchScore, 3.46);
  assert.equal(metrics.lastMatchOverlap, 120);
  assert.equal("filePath" in metrics, false);
  assert.equal("ocrText" in metrics, false);
});
