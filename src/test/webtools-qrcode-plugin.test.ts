import assert from "node:assert/strict";
import test from "node:test";

import { webtoolsQrcodePlugin } from "../main/plugins/webtools-qrcode/index";

function decodeQrSvg(qrUrl: string): string {
  const base64 = qrUrl.split(",")[1] ?? "";
  return Buffer.from(base64, "base64").toString("utf8");
}

function getViewBoxSize(svg: string): number {
  const matched = svg.match(/viewBox="\s*[\d.+-]+\s+[\d.+-]+\s+([\d.+-]+)\s+[\d.+-]+\s*"/i);
  assert.ok(matched, "QR SVG should expose a viewBox");
  return Number(matched[1]);
}

function getAttr(fragment: string, name: string): number {
  const matched = fragment.match(new RegExp(`${name}="([\\d.+-]+)"`));
  assert.ok(matched, `${name} should exist in fragment`);
  return Number(matched[1]);
}

test("text logo overlay is centered within the QR viewBox units", async () => {
  const result = await webtoolsQrcodePlugin.execute(
    "action=generate&text=hello&size=300&level=M&logoMode=text&logoText=123",
    {} as never
  );
  assert.equal(result.ok, true);
  const qrUrl = (result.data as { qrUrl?: string }).qrUrl ?? "";
  const svg = decodeQrSvg(qrUrl);
  const unit = getViewBoxSize(svg);

  const rect = svg.match(/<g class="qr-logo qr-logo-text">\s*<rect[^>]*>/);
  assert.ok(rect, "text logo should render a backing rect");
  const x = getAttr(rect[0], "x");
  const width = getAttr(rect[0], "width");

  assert.ok(x > 0 && x < unit, "logo rect must sit inside the viewBox, not off-canvas");
  assert.ok(x + width <= unit, "logo rect must not overflow the viewBox");
  assert.ok(
    Math.abs(x + width / 2 - unit / 2) < unit * 0.02,
    "logo rect should be horizontally centered"
  );
  assert.match(svg, /<tspan[^>]*>123<\/tspan>/, "short logo text should render on a single line");
});

test("long logo text wraps onto multiple centered lines that fit the box", async () => {
  const result = await webtoolsQrcodePlugin.execute(
    "action=generate&text=hello&size=300&level=H&logoMode=text&logoText=123412",
    {} as never
  );
  assert.equal(result.ok, true);
  const qrUrl = (result.data as { qrUrl?: string }).qrUrl ?? "";
  const svg = decodeQrSvg(qrUrl);
  const unit = getViewBoxSize(svg);

  const tspans = svg.match(/<tspan[^>]*>[^<]*<\/tspan>/g) ?? [];
  assert.equal(tspans.length, 2, "six characters should wrap onto two lines");
  assert.match(tspans[0], />123</, "first wrapped line should hold the first half");
  assert.match(tspans[1], />412</, "second wrapped line should hold the second half");

  const fontMatch = svg.match(/font-size="([\d.]+)"/);
  assert.ok(fontMatch, "logo text should expose a font-size");
  const fontSize = Number(fontMatch[1]);
  const boxSize = unit * 0.3;
  assert.ok(
    fontSize * 2 * 1.16 <= boxSize,
    "two wrapped lines should fit inside the logo box height"
  );

  tspans.forEach((tspan) => {
    const x = getAttr(tspan, "x");
    assert.ok(
      Math.abs(x - unit / 2) < unit * 0.01,
      "each wrapped line should stay horizontally centered"
    );
  });
});

test("image logo overlay stays inside the QR viewBox units", async () => {
  const pixel = `data:image/png;base64,${Buffer.from("fake-image").toString("base64")}`;
  const result = await webtoolsQrcodePlugin.execute(
    `action=generate&text=hello&size=300&level=H&logoMode=image&logoImageDataUrl=${encodeURIComponent(pixel)}`,
    {} as never
  );
  assert.equal(result.ok, true);
  const qrUrl = (result.data as { qrUrl?: string }).qrUrl ?? "";
  const svg = decodeQrSvg(qrUrl);
  const unit = getViewBoxSize(svg);

  const image = svg.match(/<image[^>]*>/);
  assert.ok(image, "image logo should render an <image> element");
  const x = getAttr(image[0], "x");
  const width = getAttr(image[0], "width");
  assert.ok(x > 0 && x + width <= unit, "image logo must stay within the viewBox");
});

test("no logo mode leaves the QR overlay empty", async () => {
  const result = await webtoolsQrcodePlugin.execute(
    "action=generate&text=hello&size=300&level=M&logoMode=none",
    {} as never
  );
  assert.equal(result.ok, true);
  const qrUrl = (result.data as { qrUrl?: string }).qrUrl ?? "";
  const svg = decodeQrSvg(qrUrl);
  assert.equal(svg.includes("qr-logo"), false, "no-logo QR should not embed an overlay");
});
