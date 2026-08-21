import assert from "node:assert/strict";
import test from "node:test";
import {
  createDefaultLiteSnapSettings,
  LITESNAP_ANNOTATION_WIDTH_TOOLS,
  type LiteSnapAnnotationLineWidths,
  type LiteSnapSettings
} from "../shared/litesnap";
import { LiteSnapSettingsStore, normalizeLiteSnapSettings } from "../main/litesnap/settings";

test("LiteSnap migrates one legacy line width to every width-aware tool", () => {
  const normalized = normalizeLiteSnapSettings({ annotationLineWidth: 11 });

  assert.equal(normalized.annotationLineWidth, 11);
  for (const tool of LITESNAP_ANNOTATION_WIDTH_TOOLS) {
    assert.equal(normalized.annotationLineWidths[tool], 11, `${tool} should inherit 11 px`);
  }

  const repeated = normalizeLiteSnapSettings(
    JSON.parse(JSON.stringify(normalized)) as LiteSnapSettings
  );
  assert.deepEqual(repeated, normalized, "persisted maps should not be migrated again");
});

test("LiteSnap merges and clamps independent tool widths without leaking between tools", () => {
  const base = normalizeLiteSnapSettings({ annotationLineWidth: 3 });
  const customized = normalizeLiteSnapSettings(
    {
      annotationTool: "arrow",
      annotationLineWidths: {
        arrow: 14,
        rect: 2
      } as LiteSnapAnnotationLineWidths
    },
    base
  );

  assert.equal(customized.annotationLineWidth, 14, "legacy width follows the active tool");
  assert.equal(customized.annotationLineWidths.arrow, 14);
  assert.equal(customized.annotationLineWidths.rect, 2);
  assert.equal(customized.annotationLineWidths.ellipse, 3);

  const clamped = normalizeLiteSnapSettings(
    {
      annotationLineWidths: {
        rect: 99,
        line: 0,
        pen: "invalid"
      } as unknown as LiteSnapAnnotationLineWidths
    },
    customized
  );
  assert.equal(clamped.annotationLineWidths.rect, 60);
  assert.equal(clamped.annotationLineWidths.line, 1);
  assert.equal(clamped.annotationLineWidths.pen, 3, "invalid values retain the prior tool width");
  assert.equal(clamped.annotationLineWidths.arrow, 14, "unsubmitted tools retain their value");
});

test("LiteSnap settings store returns independent copies of per-tool widths", async () => {
  let raw: string | null = JSON.stringify(createDefaultLiteSnapSettings());
  const database = {
    async getSetting(): Promise<string | null> {
      return raw;
    },
    async setSetting(_key: string, value: string): Promise<void> {
      raw = value;
    }
  };
  const store = new LiteSnapSettingsStore(database as never);

  const first = await store.getSettings();
  first.annotationLineWidths.arrow = 44;
  const second = await store.getSettings();

  assert.equal(second.annotationLineWidths.arrow, 3);
});
