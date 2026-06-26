# LiteSnap Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add the first shippable LiteSnap slice to LiteLauncher: shared contracts, built-in plugin registration, LiteSnap panel shell, settings plumbing, screenshot command entry, and pinned-image window scaffolding.

**Architecture:** Keep LiteSnap inside the existing built-in plugin system, but move screenshot and pin behavior into dedicated main-process LiteSnap modules. The launcher window remains the control hub, while capture overlay and pin windows are created and managed outside the launcher shell.

**Tech Stack:** Electron, TypeScript, `node:test`, existing built-in plugin registry, preload + IPC bridge, vanilla renderer panel implementations

---

## File Structure

- Create: `src/shared/litesnap.ts`
- Create: `src/main/litesnap/settings.ts`
- Create: `src/main/litesnap/image-store.ts`
- Create: `src/main/litesnap/pin-window-manager.ts`
- Create: `src/main/litesnap/capture-session-manager.ts`
- Create: `src/main/plugins/litesnap/index.ts`
- Create: `src/test/litesnap-plugin-source.test.ts`
- Modify: `src/shared/channels.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/global.d.ts`
- Modify: `src/main/plugins/index.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/renderer/plugin-handler-config.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/test/visible-plugins-regression.test.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`
- Modify: `docs/work.md`
- Modify: `TASKS_LiteLauncher.md`

## Task 1: Lock LiteSnap contracts and plugin registration with failing tests

**Files:**
- Create: `src/test/litesnap-plugin-source.test.ts`
- Modify: `src/test/visible-plugins-regression.test.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Write the failing built-in plugin visibility regression**

```ts
test("LiteSnap is visible by default and opens a plugin panel", async () => {
  const visiblePluginIds = getVisiblePluginIds();
  assert.ok(
    visiblePluginIds.includes("litesnap"),
    "LiteSnap should be visible by default"
  );

  const { window, sent } = createMockWindow();
  const result = await executePluginCommand(
    "litesnap",
    window as never,
    createSelectedItem("litesnap")
  );

  assert.equal(result.ok, true);
  assert.equal(result.keepOpen, true);
  assert.equal(sent[0]?.channel, IPC_CHANNELS.openPanel);
  assert.equal(
    (sent[0]?.payload as { pluginId?: string }).pluginId,
    "litesnap"
  );
});
```

- [ ] **Step 2: Write the failing renderer-boundary regression**

```ts
test("LiteSnap panel is implemented through plugin-panel-impls", () => {
  const rendererSource = fs.readFileSync(rendererPath, "utf8");
  const panelImplsSource = fs.readFileSync(panelImplsPath, "utf8");

  assert.equal(
    rendererSource.includes("function renderLiteSnapPanel"),
    false,
    "LiteSnap panel implementation should not live in renderer.ts"
  );
  assert.match(
    panelImplsSource,
    /\[LITESNAP_PLUGIN_ID\]:\s*createSubmitPluginPanelHandler\(/,
    "LiteSnap should render through panelImplsSafe"
  );
  assert.match(panelImplsSource, /renderLiteSnapPanel\(\): void/);
  assert.match(panelImplsSource, /applyLiteSnapPanelPayload\(panel:/);
});
```

- [ ] **Step 3: Write the failing shared-contract regression**

```ts
test("LiteSnap shared defaults expose Snipaste-compatible first-version shortcuts", async () => {
  const source = fs.readFileSync(sharedLiteSnapPath, "utf8");

  assert.match(source, /export const LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT = "F1"/);
  assert.match(source, /export const LITESNAP_DEFAULT_PIN_SHORTCUT = "F3"/);
  assert.match(source, /export type LiteSnapPanelAction =/);
  assert.match(source, /export interface LiteSnapSettings/);
});
```

- [ ] **Step 4: Run the targeted tests to confirm they fail**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/visible-plugins-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/litesnap-plugin-source.test.js
```

Expected:

- `visible-plugins-regression` fails because `litesnap` is missing
- `plugin-panel-impls-regression` fails because LiteSnap handlers are missing
- `litesnap-plugin-source` fails because `src/shared/litesnap.ts` does not exist yet

- [ ] **Step 5: Commit the failing-test checkpoint**

```bash
git add src/test/visible-plugins-regression.test.ts src/test/plugin-panel-impls-regression.test.ts src/test/litesnap-plugin-source.test.ts
git commit -m "test: add LiteSnap registration regressions"
```

## Task 2: Add shared LiteSnap types and built-in plugin entry

**Files:**
- Create: `src/shared/litesnap.ts`
- Create: `src/main/plugins/litesnap/index.ts`
- Modify: `src/main/plugins/index.ts`
- Modify: `src/main/index.ts`

- [ ] **Step 1: Implement shared LiteSnap defaults and types**

```ts
export const LITESNAP_PLUGIN_ID = "litesnap";
export const LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT = "F1";
export const LITESNAP_DEFAULT_PIN_SHORTCUT = "F3";

export type LiteSnapPanelAction =
  | "open"
  | "start-capture"
  | "pin-from-clipboard"
  | "open-settings";

export interface LiteSnapSettings {
  screenshotShortcut: string;
  pinShortcut: string;
  saveDirectory: string;
  saveFormat: "png" | "jpg";
  postCaptureBehavior: "toolbar" | "copy" | "save" | "pin";
  annotationColor: string;
  annotationLineWidth: number;
  annotationTextSize: number;
}
```

- [ ] **Step 2: Add the LiteSnap built-in plugin**

```ts
export const liteSnapPlugin: LauncherPlugin = {
  id: LITESNAP_PLUGIN_ID,
  name: "截图贴图",
  createCatalogItems() {
    return [createCatalogItem()];
  },
  getQueryItems(query) {
    return matchesAlias(query) ? [createCatalogItem()] : [];
  },
  async execute(optionsText, context): Promise<ExecuteResult> {
    const action = parseLiteSnapAction(optionsText);
    const payload = await liteSnapRuntime.perform(action);
    context.window.webContents.send(IPC_CHANNELS.openPanel, {
      panel: "plugin",
      pluginId: LITESNAP_PLUGIN_ID,
      title: "截图贴图",
      subtitle: "截图、标注、复制、保存与贴图",
      data: payload
    });
    return { ok: true, keepOpen: true, message: payload.statusMessage };
  }
};
```

- [ ] **Step 3: Register LiteSnap in the plugin catalog and default-visible lists**

```ts
import { liteSnapPlugin } from "./litesnap";

const ALL_PLUGINS: LauncherPlugin[] = [
  cashflowGamePlugin,
  hardwareInspectorPlugin,
  clipboardWorkbenchPlugin,
  liteSnapPlugin,
  // ...
];

const DEFAULT_VISIBLE_PLUGIN_IDS = [
  "cashflow-game",
  "hardware-inspector",
  "clipboard-workbench",
  "litesnap",
  // ...
] as const;
```

- [ ] **Step 4: Add LiteSnap to app-level required/default-visible migration lists**

```ts
const REQUIRED_VISIBLE_PLUGIN_IDS = [
  "hardware-inspector",
  "clipboard-workbench",
  "litesnap",
  "codeagent-switch"
] as const;
```

- [ ] **Step 5: Re-run the Task 1 tests until they pass**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/visible-plugins-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/litesnap-plugin-source.test.js
```

Expected:

- LiteSnap appears in visible plugin coverage
- shared LiteSnap contract test passes

- [ ] **Step 6: Commit the shared-contract and registration slice**

```bash
git add src/shared/litesnap.ts src/main/plugins/litesnap/index.ts src/main/plugins/index.ts src/main/index.ts src/test/visible-plugins-regression.test.ts src/test/litesnap-plugin-source.test.ts
git commit -m "feat: add LiteSnap plugin registration"
```

## Task 3: Add preload, IPC, and panel-shell plumbing

**Files:**
- Modify: `src/shared/channels.ts`
- Modify: `src/preload/index.ts`
- Modify: `src/renderer/global.d.ts`
- Modify: `src/main/ipc.ts`
- Modify: `src/renderer/plugin-handler-config.ts`
- Modify: `src/renderer/plugin-panel-impls.ts`
- Modify: `src/test/plugin-panel-impls-regression.test.ts`

- [ ] **Step 1: Extend the IPC channels**

```ts
export const IPC_CHANNELS = {
  // ...
  getLiteSnapSettings: "launcher:get-litesnap-settings",
  setLiteSnapSettings: "launcher:set-litesnap-settings",
  liteSnapStartCapture: "launcher:litesnap-start-capture",
  liteSnapPinClipboard: "launcher:litesnap-pin-clipboard"
} as const;
```

- [ ] **Step 2: Expose LiteSnap bridge methods in preload and renderer globals**

```ts
getLiteSnapSettings(): Promise<LiteSnapSettings> {
  return ipcRenderer.invoke(IPC_CHANNELS.getLiteSnapSettings);
},
setLiteSnapSettings(
  patch: Partial<LiteSnapSettings>
): Promise<LiteSnapSettings> {
  return ipcRenderer.invoke(IPC_CHANNELS.setLiteSnapSettings, patch);
},
liteSnapStartCapture(): Promise<boolean> {
  return ipcRenderer.invoke(IPC_CHANNELS.liteSnapStartCapture);
},
liteSnapPinClipboard(): Promise<boolean> {
  return ipcRenderer.invoke(IPC_CHANNELS.liteSnapPinClipboard);
}
```

- [ ] **Step 3: Register a LiteSnap plugin panel handler**

```ts
{
  pluginId: handlerConstants.LITESNAP_PLUGIN_ID,
  formSelector: "form.litesnap-form",
  enterActionKey: "litesnap-start-capture"
}
```

- [ ] **Step 4: Implement the first LiteSnap panel shell**

```ts
function renderLiteSnapPanel(): void {
  const panel = document.createElement("section");
  panel.className = "settings-panel litesnap-panel";

  const form = document.createElement("form");
  form.className = "settings-form litesnap-form";

  const title = document.createElement("div");
  title.className = "settings-title";
  title.textContent = "截图贴图";

  const startButton = document.createElement("button");
  startButton.type = "button";
  startButton.textContent = "开始截图 (F1)";
  startButton.addEventListener("click", () => {
    void window.launcher.liteSnapStartCapture();
  });

  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.textContent = "贴图到屏幕 (F3)";
  pinButton.addEventListener("click", () => {
    void window.launcher.liteSnapPinClipboard();
  });

  form.append(title, startButton, pinButton);
  panel.appendChild(form);
  renderPluginPanelShell(panel);
}
```

- [ ] **Step 5: Re-run the renderer-boundary regression**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js
```

Expected:

- LiteSnap panel handler and payload wiring now pass source-level regression

- [ ] **Step 6: Commit the panel-shell slice**

```bash
git add src/shared/channels.ts src/preload/index.ts src/renderer/global.d.ts src/main/ipc.ts src/renderer/plugin-handler-config.ts src/renderer/plugin-panel-impls.ts src/test/plugin-panel-impls-regression.test.ts
git commit -m "feat: add LiteSnap launcher panel shell"
```

## Task 4: Add LiteSnap settings storage and runtime scaffolding

**Files:**
- Create: `src/main/litesnap/settings.ts`
- Create: `src/main/litesnap/image-store.ts`
- Create: `src/main/litesnap/capture-session-manager.ts`
- Create: `src/main/litesnap/pin-window-manager.ts`
- Modify: `src/main/index.ts`
- Modify: `src/main/ipc.ts`

- [ ] **Step 1: Implement LiteSnap settings defaults and persistence helpers**

```ts
export function createDefaultLiteSnapSettings(): LiteSnapSettings {
  return {
    screenshotShortcut: LITESNAP_DEFAULT_SCREENSHOT_SHORTCUT,
    pinShortcut: LITESNAP_DEFAULT_PIN_SHORTCUT,
    saveDirectory: "",
    saveFormat: "png",
    postCaptureBehavior: "toolbar",
    annotationColor: "#ff3b30",
    annotationLineWidth: 3,
    annotationTextSize: 16
  };
}
```

- [ ] **Step 2: Add a minimal capture-session manager**

```ts
export class LiteSnapCaptureSessionManager {
  public async startCapture(): Promise<boolean> {
    return true;
  }
}
```

- [ ] **Step 3: Add a minimal pin-window manager**

```ts
export class LiteSnapPinWindowManager {
  public async pinClipboardImage(): Promise<boolean> {
    return false;
  }
}
```

- [ ] **Step 4: Wire LiteSnap runtime into `src/main/index.ts` and `src/main/ipc.ts`**

```ts
ipcMain.handle(IPC_CHANNELS.getLiteSnapSettings, async () => {
  return liteSnapSettingsStore.getSettings();
});

ipcMain.handle(IPC_CHANNELS.liteSnapStartCapture, async () => {
  return liteSnapCaptureSessionManager.startCapture();
});
```

- [ ] **Step 5: Add focused source tests for settings defaults if needed**

```ts
test("LiteSnap settings default to Snipaste-style entry shortcuts", () => {
  assert.equal(createDefaultLiteSnapSettings().screenshotShortcut, "F1");
  assert.equal(createDefaultLiteSnapSettings().pinShortcut, "F3");
});
```

- [ ] **Step 6: Run the focused LiteSnap regression batch**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/litesnap-plugin-source.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/visible-plugins-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js
```

- [ ] **Step 7: Commit the runtime scaffolding slice**

```bash
git add src/main/litesnap/settings.ts src/main/litesnap/image-store.ts src/main/litesnap/capture-session-manager.ts src/main/litesnap/pin-window-manager.ts src/main/index.ts src/main/ipc.ts
git commit -m "feat: scaffold LiteSnap runtime services"
```

## Task 5: Add docs and work log updates for the first LiteSnap slice

**Files:**
- Modify: `docs/work.md`
- Modify: `TASKS_LiteLauncher.md`

- [ ] **Step 1: Update the work log with the LiteSnap architecture slice**

```md
- 启动 LiteSnap 第一批实现：补齐 `src/shared/litesnap.ts` 共享类型、内置插件注册、默认可见插件列表、LiteSnap 面板壳、设置桥接和主进程运行时脚手架，为后续截图 overlay / 贴图窗口 / 标注能力打底。
```

- [ ] **Step 2: Add or update the task list entry for LiteSnap**

```md
| [ ] | LL-236 | LiteSnap 截图贴图插件首版 | P0 | 进行中 | 当前已完成共享类型、插件入口、设置桥接与运行时脚手架，后续继续补截图 overlay、贴图窗口和基础标注 |
```

- [ ] **Step 3: Run the final targeted verification for this slice**

Run:

```powershell
pnpm run build; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/visible-plugins-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/plugin-panel-impls-regression.test.js; if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }; node dist/test/litesnap-plugin-source.test.js
```

- [ ] **Step 4: Commit the docs update**

```bash
git add docs/work.md TASKS_LiteLauncher.md
git commit -m "docs: record LiteSnap implementation kickoff"
```

## Spec Coverage Self-Check

- Built-in plugin entry: Task 1, Task 2, Task 3
- Snipaste-style default shortcuts: Task 1, Task 4
- Dedicated screenshot overlay window flow: Task 4 scaffolds the manager and IPC entry point for the first runtime slice
- Dedicated pin window flow: Task 4 scaffolds the manager and IPC entry point for the first runtime slice
- Basic annotation tools: deferred to the next execution batch after the shared/runtime shell is in place
- LiteSnap settings inside LiteLauncher: Task 3 and Task 4
- Command entry points `snap`, `pin`, `snap settings`: Task 2

The only intentional partial area in this first implementation slice is the full overlay/pin behavior and annotation execution. This plan starts with the foundation required to build and verify those behaviors safely in the next batch.
