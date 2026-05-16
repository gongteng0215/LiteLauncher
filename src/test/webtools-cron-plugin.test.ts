import assert from "node:assert/strict";
import test from "node:test";

import { __cronTestUtils } from "../main/plugins/webtools-cron/index";

test("parse returns success state for common weekday schedule", () => {
  const result = __cronTestUtils.parseCronExpression("0 9 * * 1-5");
  assert.equal(result.status, "success");
  assert.equal(result.errorMessage, "");
  assert.equal(result.errorField, "");
  assert.equal(result.templateKey, "weekday-9am");
  assert.match(result.readable, /工作日\s*09:00/);
  assert.equal(result.fieldMeta.length, 5);
  assert.equal(result.upcoming.length, 7);
});

test("readable output formats monthly schedules in plain Chinese", () => {
  const result = __cronTestUtils.parseCronExpression("30 8 1 * *");
  assert.equal(result.readable, "每月 1 日 08:30 执行");
});

test("readable output keeps common workday phrasing natural", () => {
  const result = __cronTestUtils.parseCronExpression("0 9 * * 1,2,3,4,5");
  assert.equal(result.readable, "工作日 09:00 执行");
});

test("readable output falls back to structured phrasing for complex expressions", () => {
  const result = __cronTestUtils.parseCronExpression("15 9-18 * * 1-5");
  assert.match(result.readable, /分钟|小时|周/);
});

test("parse returns field-level error metadata for invalid minute values", () => {
  const result = __cronTestUtils.tryParseCronExpression("70 9 * * *");
  assert.equal(result.status, "error");
  assert.equal(result.errorField, "minute");
  assert.match(result.errorMessage, /分钟|无效值/);
  assert.equal(result.upcoming.length, 0);
});

test("parse returns warning state for every-minute schedules", () => {
  const result = __cronTestUtils.parseCronExpression("* * * * *");
  assert.equal(result.status, "warning");
  assert.match(result.warnings.join(" "), /频率|每分钟/);
});

test("quick preset generation builds a matching expression", () => {
  const preset = __cronTestUtils.applyTemplate("weekday-9am");
  assert.equal(preset.expression, "0 9 * * 1-5");
  assert.equal(preset.templateKey, "weekday-9am");
});
