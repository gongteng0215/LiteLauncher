import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const rendererPath = path.join(process.cwd(), "src", "renderer", "renderer.ts");
const rendererHtmlPath = path.join(process.cwd(), "src", "renderer", "index.html");
const rendererStylesPath = path.join(process.cwd(), "src", "renderer", "styles.css");
const sharedImagePromptBuilderPath = path.join(
  process.cwd(),
  "src",
  "shared",
  "image-prompt-builder.ts"
);
const copyAssetsPath = path.join(process.cwd(), "scripts", "copy-assets.cjs");
const panelImplsPath = path.join(
  process.cwd(),
  "src",
  "renderer",
  "plugin-panel-impls.ts"
);

function readRendererSource(): string {
  return fs.readFileSync(rendererPath, "utf8");
}

function readPanelImplsSource(): string {
  return fs.readFileSync(panelImplsPath, "utf8");
}

function readRendererHtmlSource(): string {
  return fs.readFileSync(rendererHtmlPath, "utf8");
}

function readRendererStylesSource(): string {
  return fs.readFileSync(rendererStylesPath, "utf8");
}

function readCopyAssetsSource(): string {
  return fs.readFileSync(copyAssetsPath, "utf8");
}

function readSharedImagePromptBuilderSource(): string {
  return fs.readFileSync(sharedImagePromptBuilderPath, "utf8");
}

function extractFunctionSource(source: string, name: string): string {
  const functionIndex = source.indexOf(`function ${name}`);
  assert.notEqual(functionIndex, -1, `${name} should be present`);
  const bodyStart = source.indexOf("{", functionIndex);
  assert.notEqual(bodyStart, -1, `${name} should have a function body`);

  let depth = 0;
  for (let index = bodyStart; index < source.length; index += 1) {
    const char = source[index];
    if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(functionIndex, index + 1);
      }
    }
  }

  assert.fail(`${name} should have a complete function body`);
}

test("new default plugin panels are implemented through plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.equal(
    rendererSource.includes("function renderWebtoolsFileHashPanel"),
    false,
    "File Hash render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function renderWebtoolsPortHelperPanel"),
    false,
    "Port Helper render implementation should live outside renderer.ts"
  );
  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsFileHashPanel/,
    "File Hash handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsFileHashPanelPayload/,
    "File Hash handler should apply payload through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsPortHelperPanel/,
    "Port Helper handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsPortHelperPanelPayload/,
    "Port Helper handler should apply payload through panelImplsSafe"
  );

  assert.match(panelImplsSource, /renderWebtoolsFileHashPanel\(\): void/);
  assert.match(panelImplsSource, /renderWebtoolsPortHelperPanel\(\): void/);
});

test("core webtools panel handlers use plugin-panel-impls without renderer delegates", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const migratedPanels = ["Diff", "Config", "Sql", "Crypto", "Jwt"];

  for (const panelName of migratedPanels) {
    assert.match(
      rendererSource,
      new RegExp(`render:\\s*panelImplsSafe\\.renderWebtools${panelName}Panel`),
      `${panelName} handler should render through panelImplsSafe`
    );
    assert.match(
      rendererSource,
      new RegExp(`onOpen:\\s*panelImplsSafe\\.applyWebtools${panelName}PanelPayload`),
      `${panelName} handler should apply payload through panelImplsSafe`
    );
    assert.equal(
      rendererSource.includes(`function renderWebtools${panelName}Panel`),
      false,
      `${panelName} render implementation should live outside renderer.ts`
    );
    assert.match(
      panelImplsSource,
      new RegExp(`renderWebtools${panelName}Panel\\(\\): void`),
      `${panelName} render implementation should be present in plugin-panel-impls`
    );
  }

  assert.equal(
    panelImplsSource.includes('getPanelDelegate("applyWebtoolsCryptoPanelPayload")'),
    false,
    "Crypto panel should not delegate back to renderer.ts"
  );
  assert.equal(
    panelImplsSource.includes('getPanelDelegate("renderWebtoolsCryptoPanel")'),
    false,
    "Crypto render should not delegate back to renderer.ts"
  );
  assert.equal(
    panelImplsSource.includes('getPanelDelegate("applyWebtoolsJwtPanelPayload")'),
    false,
    "JWT panel should not delegate back to renderer.ts"
  );
  assert.equal(
    panelImplsSource.includes('getPanelDelegate("renderWebtoolsJwtPanel")'),
    false,
    "JWT render should not delegate back to renderer.ts"
  );
  assert.equal(
    rendererSource.includes("window.__LL_PANEL_DELEGATES__"),
    false,
    "renderer.ts should not expose panel delegate callbacks"
  );
});

test("lightweight webtools wrappers are removed from renderer handlers", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();
  const directPanels = [
    "Password",
    "Json",
    "Url",
    "Timestamp",
    "Cron",
    "Strings",
    "Colors",
    "Qrcode",
    "Ua",
    "Api",
    "HttpMock"
  ];

  for (const panelName of directPanels) {
    assert.match(
      rendererSource,
      new RegExp(`render:\\s*panelImplsSafe\\.renderWebtools${panelName}Panel`),
      `${panelName} handler should render directly through panelImplsSafe`
    );
    assert.match(
      rendererSource,
      new RegExp(`onOpen:\\s*panelImplsSafe\\.applyWebtools${panelName}PanelPayload`),
      `${panelName} handler should apply payload directly through panelImplsSafe`
    );
    assert.equal(
      rendererSource.includes(`function renderWebtools${panelName}Panel`),
      false,
      `${panelName} render wrapper should be removed from renderer.ts`
    );
    assert.equal(
      rendererSource.includes(`function applyWebtools${panelName}PanelPayload`),
      false,
      `${panelName} apply wrapper should be removed from renderer.ts`
    );
    assert.match(
      panelImplsSource,
      new RegExp(`renderWebtools${panelName}Panel\\(\\): void`),
      `${panelName} render implementation should stay in plugin-panel-impls`
    );
  }
});

test("markdown panel render/apply lives in plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsMarkdownPanel/,
    "Markdown handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsMarkdownPanelPayload/,
    "Markdown handler should apply payload through panelImplsSafe"
  );
  assert.equal(
    rendererSource.includes("function renderWebtoolsMarkdownPanel"),
    false,
    "Markdown render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function applyWebtoolsMarkdownPanelPayload"),
    false,
    "Markdown apply implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /renderWebtoolsMarkdownPanel\(\): void/,
    "Markdown render implementation should be present in plugin-panel-impls"
  );
});

test("image prompt panel render/apply lives in plugin-panel-impls", () => {
  const rendererSource = readRendererSource();
  const rendererHtmlSource = readRendererHtmlSource();
  const rendererStylesSource = readRendererStylesSource();
  const sharedImagePromptBuilderSource = readSharedImagePromptBuilderSource();
  const copyAssetsSource = readCopyAssetsSource();
  const panelImplsSource = readPanelImplsSource();

  assert.match(
    rendererSource,
    /WEBTOOLS_IMAGE_PROMPT_PLUGIN_ID = "webtools-image-prompt"/,
    "renderer should know the image prompt plugin id"
  );
  assert.match(
    rendererHtmlSource,
    /image-prompt-data\.js/,
    "renderer should load generated shared Image Prompt data before panel implementations"
  );
  assert.match(
    copyAssetsSource,
    /image-prompt-builder/,
    "asset copy step should generate renderer Image Prompt data from the shared builder"
  );
  assert.match(
    copyAssetsSource,
    /smartTemplates/,
    "asset copy step should expose shared Image Prompt smart templates to the renderer"
  );
  assert.match(
    rendererSource,
    /__LL_IMAGE_PROMPT_DATA__/,
    "renderer should read Image Prompt config from the generated shared data global"
  );
  assert.match(
    rendererSource,
    /smartTemplates/,
    "renderer Image Prompt data should include smart templates"
  );
  assert.match(
    rendererSource,
    /designs:\s*WebtoolsImagePromptTextDesign\[\]/,
    "renderer Image Prompt text options should include scene-aware text designs"
  );
  assert.match(
    rendererSource,
    /design:\s*string/,
    "renderer Image Prompt text state should track the selected text design"
  );
  assert.match(
    rendererSource,
    /designId:\s*string/,
    "renderer Image Prompt text state should track a stable text design id"
  );
  assert.match(
    rendererSource,
    /title:\s*string/,
    "renderer Image Prompt text state should track structured birthday title text"
  );
  assert.equal(
    rendererSource.includes("const WEBTOOLS_IMAGE_PROMPT_ALL_STYLE_PRESETS"),
    false,
    "renderer should not maintain a duplicate Image Prompt style preset table"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /group:\s*"商品商业"/,
    "shared Image Prompt style presets should keep broad style groups"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /id:\s*"livestream-commerce"/,
    "shared Image Prompt data should include livestream commerce"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /id:\s*"medical-health"/,
    "shared Image Prompt data should include medical health"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /id:\s*"birthday-party"/,
    "shared Image Prompt data should include birthday party"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /exact:\s*"3周岁生日"/,
    "shared Image Prompt data should preserve birthday age text defaults"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /寿星照片放在画面中央的圆角照片框中/,
    "shared Image Prompt data should preserve birthday photo options"
  );
  assert.match(
    rendererSource,
    /render:\s*panelImplsSafe\.renderWebtoolsImagePromptPanel/,
    "Image Prompt handler should render through panelImplsSafe"
  );
  assert.match(
    rendererSource,
    /onOpen:\s*panelImplsSafe\.applyWebtoolsImagePromptPanelPayload/,
    "Image Prompt handler should apply payload through panelImplsSafe"
  );
  assert.equal(
    rendererSource.includes("function renderWebtoolsImagePromptPanel"),
    false,
    "Image Prompt render implementation should live outside renderer.ts"
  );
  assert.equal(
    rendererSource.includes("function applyWebtoolsImagePromptPanelPayload"),
    false,
    "Image Prompt apply implementation should live outside renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /renderWebtoolsImagePromptPanel\(\): void/,
    "Image Prompt render implementation should be present in plugin-panel-impls"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptSelection-/,
    "Image Prompt panel should render selectable module options"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptStylePreset/,
    "Image Prompt panel should render style preset switching controls"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptStyleGroup/,
    "Image Prompt panel should render broad style group switching controls"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_SMART_TEMPLATES/,
    "Image Prompt panel should render smart template shortcuts"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptSmartTemplateId/,
    "Image Prompt panel should remember the selected smart template"
  );
  assert.match(
    panelImplsSource,
    /templateButton\.dataset\.selected = String\(webtoolsImagePromptSmartTemplateId === template\.id\)/,
    "Image Prompt smart template buttons should expose selected state"
  );
  assert.match(
    panelImplsSource,
    /syncWebtoolsImagePromptSmartTemplateSelection\(smartTemplateOptions\)/,
    "Image Prompt smart template clicks should refresh the visible selected button immediately"
  );
  assert.match(
    rendererStylesSource,
    /\.webtools-image-prompt-template\[data-selected="true"\]/,
    "Image Prompt smart template buttons should have a visible selected style"
  );
  assert.match(
    panelImplsSource,
    /智能模板/,
    "Image Prompt panel should label smart template shortcuts clearly"
  );
  assert.match(
    panelImplsSource,
    /createWebtoolsImagePromptSmartTemplateState/,
    "Image Prompt panel should apply shared smart templates as complete states"
  );
  assert.match(
    rendererSource,
    /state\?:\s*WebtoolsImagePromptState/,
    "Image Prompt build executor should support a direct state override for template shortcuts"
  );
  assert.match(
    panelImplsSource,
    /executeWebtoolsImagePromptBuild\(form,\s*\{[^}]*state:\s*next/s,
    "smart template shortcuts should build from the template state instead of collecting stale form controls"
  );
  {
    const updateSelectionSourceMatch = panelImplsSource.match(
      /const updateSelectionFromState = \(state: WebtoolsImagePromptState\): void => \{[\s\S]*?\n    \};/
    );
    assert.ok(
      updateSelectionSourceMatch,
      "Image Prompt panel should keep a local helper for applying template state to the form"
    );
    const updateSelectionSource = updateSelectionSourceMatch[0];
    assert.doesNotMatch(
      updateSelectionSource,
      /collectWebtoolsImagePromptState\(form\)/,
      "smart template application should not recollect stale visible form controls after syncing template text"
    );
    assert.match(
      updateSelectionSource,
      /filterWebtoolsImagePromptStateForStyle\(state\)/,
      "smart template application should keep the template state as the source of truth"
    );
  }
  assert.match(
    panelImplsSource,
    /updateSelectionFromState\(next\);\s*renderList\(\);[\s\S]*executeWebtoolsImagePromptBuild\(form,\s*\{\s*render:\s*true,\s*state:\s*next\s*\}\)/,
    "smart template clicks should rebuild the panel so text style and design controls follow the selected template"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_VISIBLE_OPTION_LIMIT/,
    "Image Prompt panel should limit visible module options by default"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptExpandedGroups/,
    "Image Prompt panel should allow module option groups to expand"
  );
  assert.match(
    panelImplsSource,
    /更多|收起/,
    "Image Prompt panel should expose more/collapse controls for large option groups"
  );
  assert.match(
    panelImplsSource,
    /getWebtoolsImagePromptOptionGroupsForStyle/,
    "Image Prompt panel should filter module options by the selected style preset"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptInfo = "已复制到剪贴板"/,
    "Image Prompt copy should show a visible copied hint in the output header"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptPhotoDescription/,
    "birthday Image Prompt panel should collect the birthday person's photo description"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextDesign/,
    "Image Prompt panel should expose a scene-aware text design selector"
  );
  assert.match(
    panelImplsSource,
    /webtools-image-prompt-text-design-card/,
    "Image Prompt panel should show the selected text design as a scannable card"
  );
  assert.match(
    panelImplsSource,
    /option\.value = design\.id/,
    "Image Prompt text design selector should use stable design ids as option values"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.typography/,
    "Image Prompt text design card should show typography guidance"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.color/,
    "Image Prompt text design card should show color guidance"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.layout/,
    "Image Prompt text design card should show layout guidance"
  );
  assert.match(
    panelImplsSource,
    /selectedTextDesign\.safeArea/,
    "Image Prompt text design card should show safe-area guidance"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextTitle/,
    "birthday Image Prompt panel should expose a structured title field"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextAge/,
    "birthday Image Prompt panel should expose a structured age field"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextName/,
    "birthday Image Prompt panel should expose a structured name field"
  );
  assert.match(
    panelImplsSource,
    /webtoolsImagePromptTextSubtitle/,
    "Image Prompt panel should expose an optional subtitle field"
  );
  assert.match(
    panelImplsSource,
    /WEBTOOLS_IMAGE_PROMPT_TEXT_OPTIONS\.designs/,
    "Image Prompt panel should populate text design choices from shared data"
  );
  assert.match(
    panelImplsSource,
    /findWebtoolsImagePromptTextDesign/,
    "Image Prompt panel should resolve the selected text design metadata"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /文字设计：/,
    "shared Image Prompt builder should include text design instructions in output prompts"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /文字层级：/,
    "shared Image Prompt builder should include text hierarchy instructions in output prompts"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /生日文字结构：/,
    "shared Image Prompt builder should include structured birthday text instructions"
  );
  assert.match(
    sharedImagePromptBuilderSource,
    /温柔生日标题设计/,
    "shared Image Prompt data should include birthday-specific text design"
  );
  assert.match(
    rendererSource,
    /WEBTOOLS_IMAGE_PROMPT_BIRTHDAY_EXAMPLES/,
    "renderer should define birthday example templates"
  );
  assert.match(
    rendererSource,
    /age:\s*"1周岁"/,
    "birthday example templates should sync one-year age into structured text state"
  );
  assert.match(
    rendererSource,
    /age:\s*"6周岁"/,
    "birthday example templates should sync older child age into structured text state"
  );
  assert.match(
    rendererSource,
    /1周岁宝宝|长辈温馨/,
    "birthday example templates should cover different birthday scenarios"
  );
  assert.match(
    panelImplsSource,
    /copyButton\.textContent = "已复制"/,
    "Image Prompt copy button should acknowledge a successful copy"
  );
  assert.equal(
    panelImplsSource.includes("webtoolsImagePromptSubject"),
    false,
    "Image Prompt panel should not fall back to the old manual subject textarea"
  );
});

test("image prompt style filtering does not recurse into itself", () => {
  const rendererSource = readRendererSource();
  const filterSource = extractFunctionSource(
    rendererSource,
    "filterWebtoolsImagePromptStateForStyle"
  );

  assert.equal(
    filterSource.includes("return filterWebtoolsImagePromptStateForStyle("),
    false,
    "style filtering should return the filtered state instead of recursing"
  );
  assert.match(filterSource, /return next;/);
});

test("image prompt keeps selected style when switching only style groups", () => {
  const rendererSource = readRendererSource();
  const collectSource = extractFunctionSource(rendererSource, "collectWebtoolsImagePromptState");

  assert.match(
    collectSource,
    /webtoolsImagePromptState\.stylePresetId/,
    "collecting image prompt state should fall back to the current style preset"
  );
  assert.doesNotMatch(
    collectSource,
    /stylePresetId:\s*normalizeWebtoolsImagePromptStylePresetId\(stylePresetValue\)/,
    "missing style radio after switching groups should not reset the selected style"
  );
});

test("launch execution skips stale refresh after panel-opening commands", () => {
  const rendererSource = readRendererSource();
  const executeSelectedSource = extractFunctionSource(rendererSource, "executeSelected");

  assert.match(
    rendererSource,
    /function isPanelOpeningLaunchItem\(item: LaunchItem\): boolean/,
    "panel-opening launch items should be detected explicitly"
  );
  assert.match(
    executeSelectedSource,
    /const modeBeforeExecute = mode;/,
    "executeSelected should remember the mode before executing a launch item"
  );
  assert.match(
    executeSelectedSource,
    /const queryBeforeExecute = currentQuery;/,
    "executeSelected should remember the query before executing a launch item"
  );
  assert.match(
    executeSelectedSource,
    /if\s*\(isPanelOpeningLaunchItem\(selected\.item\)\)\s*{\s*return;\s*}/,
    "plugin panel open commands should not refresh the search list after opening"
  );
  assert.match(
    executeSelectedSource,
    /if\s*\(\s*mode !== modeBeforeExecute \|\| currentQuery !== queryBeforeExecute\s*\)\s*{\s*return;\s*}\s*await refreshEntries\(currentQuery\);/s,
    "keepOpen refresh should be skipped after async mode/query changes"
  );
});
