import assert from "node:assert/strict";
import test from "node:test";

import { webtoolsTimestampPlugin } from "../main/plugins/webtools-timestamp/index";

type TimestampData = {
  date?: string;
  seconds?: number;
  milliseconds?: number;
  unit?: string;
  output?: string;
};

function runToDate(input: string, unit: "s" | "ms"): TimestampData {
  const result = webtoolsTimestampPlugin.execute(
    `action=toDate&unit=${unit}&input=${encodeURIComponent(input)}`,
    {} as never
  );
  assert.ok(!(result instanceof Promise));
  assert.equal(result.ok, true, result.message);
  return (result.data ?? {}) as TimestampData;
}

test("10-digit value is read as seconds even when the unit says milliseconds", () => {
  const data = runToDate("1782739137", "ms");
  assert.equal(data.unit, "s", "a 10-digit value should be detected as seconds");
  assert.equal(data.seconds, 1782739137);
  assert.equal(data.milliseconds, 1782739137000);
  assert.match(data.date ?? "", /^2026-/, "1782739137s should resolve to a 2026 date");
});

test("13-digit value is read as milliseconds even when the unit says seconds", () => {
  const data = runToDate("1782739137000", "s");
  assert.equal(data.unit, "ms", "a 13-digit value should be detected as milliseconds");
  assert.equal(data.milliseconds, 1782739137000);
  assert.match(data.date ?? "", /^2026-/, "1782739137000ms should resolve to a 2026 date");
});

test("explicit seconds unit still works for a normal seconds timestamp", () => {
  const data = runToDate("1782739137", "s");
  assert.equal(data.unit, "s");
  assert.equal(data.seconds, 1782739137);
});

test("millisecond timestamp round-trips through the date string without losing ms", () => {
  const data = runToDate("1782739960434", "ms");
  assert.equal(data.unit, "ms");
  assert.equal(data.milliseconds, 1782739960434);
  assert.match(data.date ?? "", /\.434$/, "date string should keep the .434 millisecond part");

  const back = webtoolsTimestampPlugin.execute(
    `action=toTimestamp&unit=ms&input=${encodeURIComponent(data.date ?? "")}`,
    {} as never
  );
  assert.ok(!(back instanceof Promise));
  assert.equal((back.data as TimestampData).output, "1782739960434");
});

test("seconds-precision date keeps a clean output without trailing milliseconds", () => {
  const data = runToDate("1782739960", "s");
  assert.ok(!(data.date ?? "").includes("."), "seconds value should not gain a .000 suffix");
});

test("date to timestamp honors the selected output unit", () => {
  const secondsResult = webtoolsTimestampPlugin.execute(
    "action=toTimestamp&unit=s&input=2026-06-29%2021:18:57",
    {} as never
  );
  const msResult = webtoolsTimestampPlugin.execute(
    "action=toTimestamp&unit=ms&input=2026-06-29%2021:18:57",
    {} as never
  );
  assert.ok(!(secondsResult instanceof Promise) && !(msResult instanceof Promise));
  const secondsData = (secondsResult.data ?? {}) as TimestampData;
  const msData = (msResult.data ?? {}) as TimestampData;
  assert.ok(secondsData.output && !secondsData.output.endsWith("000"));
  assert.ok(msData.output && msData.output.endsWith("000"));
  assert.equal(Number(msData.output), Number(secondsData.output) * 1000);
});
