# 划词翻译 + 离线词典 实施方案

## 概述

新增“划词翻译/查词”功能：通过全局快捷键模拟 Ctrl+C 获取选中文本，单词走离线 ECDICT 词典卡片展示，短句/中文走现有百度翻译，结果显示在鼠标附近的悬浮小窗；同时在现有“文本翻译”面板中为单词输入增加词典卡片展示。

## 背景与已确认决策

- 词典数据源：**ECDICT 离线词库**（MIT 协议，`skywind3000/ECDICT`），无需申请 Key，含音标/中英释义/词性/考纲标签，缺点是仅覆盖英文单词，不含中文词/短语查询。
- 划词触发方式：**全局快捷键 + 模拟 Ctrl+C 读取剪贴板**（不做 UI Automation，不做剪贴板监听自动触发）。
- 现状确认（来自代码探查）：
  - 目前没有任何按键模拟能力，`package.json` 无 robotjs/nut-js 等库；仅 `src/main/plugins/clipboard-workbench/paste.ts` 有 PowerShell `SendKeys('^v')` 粘贴的先例，可仿照实现 `^c`。
  - 全局快捷键统一在 `src/main/index.ts` 用 `globalShortcut.register`，参考 `registerLiteSnapGlobalShortcut`（`src/main/index.ts:892`）。
  - 现有 LiteSnap 默认快捷键：`Alt+Space`(启动器)、`F1`(截图)、`F3`(贴图)，新功能默认可用 `F2`，避免冲突，且在设置中可自定义。
  - `LiteDatabase`（`src/main/database.ts`）用 `node:sqlite` `DatabaseSync`；`ClipboardWorkbenchStore` 已有“另开一个独立连接”的先例，无 `ATTACH` 用例——新词典库将采用**独立只读连接**方式接入，不复用/不污染主库。
  - 静态资源通过 `src/assets/` → `scripts/copy-assets.cjs` 的 `copyDirIfExists("src/assets", "dist/assets")` → 打包进 `dist/**`（electron-builder `asar: true`），无需改动脚本。
  - 现有翻译面板：`src/main/plugins/webtools-translate/index.ts` + `src/renderer/plugin-panel-impls.ts`（`webtools-translate` 面板）+ `TranslateSettingsStore`/`translateWithBaidu`，将在此基础上扩展，而不是另起新插件面板。

## 一、离线词典接入

1. **构建词典数据文件**（一次性开发时脚本，产物提交进仓库，不进日常构建流程）
   - 新增 `scripts/build-ecdict-db.cjs`：读取 ECDICT 的 `ecdict.mini.csv`（或裁剪后的常用词子集，推荐 mini 版以控制体积，约几 MB，覆盖中高考/四六级/托福雅思/GRE 常见词），用 `node:sqlite` 的 `DatabaseSync` 建表并写入，字段对齐 ECDICT：`word, phonetic, definition, translation, pos, collins, oxford, tag, bnc, frq, exchange`，并对 `word`（存小写索引列）建索引。
   - 产物：`src/assets/ecdict.db`（只读，随应用一起打包，运行时不写入）。

2. **新增共享类型** `src/shared/dictionary.ts`
   - `DictionaryEntry`：`word, phonetic, translation, definition, pos, tags, collins, oxford, exchange`。
   - IPC 通道常量沿用 `src/shared/channels.ts` 新增 `lookupDictionaryWord: "launcher:lookup-dictionary-word"`。

3. **新增主进程模块** `src/main/dictionary/store.ts`
   - `DictionaryStore` 类：懒加载打开 `dist/assets/ecdict.db` 的独立 `DatabaseSync` 连接（只读，文件不存在则记录一次警告并让 `lookup` 始终返回 `undefined`，不影响其他功能）。
   - `lookup(word: string): DictionaryEntry | undefined`：对输入做 `trim().toLowerCase()` 精确匹配；未命中时按需做一次简单词形还原（去除末尾 `s/es/ing/ed` 再查一次），仍未命中返回 `undefined`。

4. **IPC 接入** `src/main/ipc.ts` / `src/preload/index.ts` / `src/main/index.ts`
   - 新增 `DictionaryProvider` 接口：`lookup(word: string) => Promise<DictionaryEntry | undefined>`，处理方式与现有 `TranslateToolProvider` 一致。
   - `src/main/index.ts` 实例化 `dictionaryStore`，接入 `registerIpcHandlers`。

## 二、划词翻译（全局快捷键弹窗）

1. **模拟复制** `src/main/selection-translate/capture.ts`
   - 仿照 `paste.ts` 的 PowerShell `SendKeys('^c')` 思路：记录当前 `clipboard.readText()` 作为基线 → 执行 `SendKeys('^c')` → 轮询（例如每 30ms，最多 ~400ms）比较剪贴板是否变化 → 拿到新文本即返回；超时未变化则视为“未选中文本”，弹窗提示或静默失败。
   - 为避免污染剪贴板历史/用户原有剪贴板内容：读取到新文本后，短延迟内将剪贴板恢复为基线内容（可配置开关，默认恢复）。

2. **全局快捷键** `src/main/index.ts`
   - 新增 `registerSelectionTranslateShortcut`（参考 `registerLiteSnapGlobalShortcut` 模式），默认快捷键 `F2`，可在设置中修改；触发时：
     1. 调用 `capture.ts` 抓取选中文本。
     2. 判定文本类型：`/^[A-Za-z][A-Za-z'\-]*$/`（单个英文单词，无空格）→ 先查 `DictionaryStore.lookup`；命中则以词典卡片展示，未命中则回退翻译。
     3. 其它情况（短语/句子/中文等）→ 直接调用现有 `translateWithBaidu`。
     4. 将结果发给悬浮弹窗窗口显示。

3. **悬浮结果弹窗** `src/main/selection-translate/popup-window.ts` + `src/renderer/selection-popup.*`
   - 新建独立的小型 `BrowserWindow`（参考 `pin-window-manager.ts` 的 frameless/alwaysOnTop/skipTaskbar 配置），使用独立 `preload`。
   - 定位：`screen.getCursorScreenPoint()` 加偏移，并按目标屏幕 `workArea` 做边界收缩，避免超出屏幕。
   - 内容两种展示态：
     - 词典卡片：单词 + 音标 + 词性 + 中文释义（+ 可选英文释义/标签）。
     - 翻译卡片：原文 + 译文（复用现有翻译结果结构）。
   - 交互：点击弹窗外部区域 / 失焦 / `Esc` 关闭；小尺寸、无边框、不抢占前台应用焦点（`focusable` 视实现设为 `false` 或短时聚焦后失焦即关闭，与 `overlay-window.ts` 的 `setIgnoreMouseEvents` 思路类似，需要为可点击的复制按钮单独处理）。

4. **设置项**：新增 `src/main/selection-translate/settings.ts` 的 `SelectionTranslateSettingsStore`（独立 SQLite 设置键 `selectionTranslateSettings`），字段：`enabled: boolean`、`hotkey: string`（默认 `F2`）。在现有“文本翻译”插件设置视图中追加一个“划词翻译”小节（开关 + 快捷键输入框），复用 `webtools-translate` 面板的设置子视图 UI 风格，避免新增插件面板。

## 三、现有翻译面板增强（单词走词典卡片）

- `src/renderer/plugin-panel-impls.ts` 的 `webtools-translate` 主视图：当 `translateToolSourceText` 判定为单个英文单词时，调用新 `lookupDictionaryWord` IPC；命中则在结果区上方渲染一张词典卡片（音标/释义/词性/标签），未命中或非单词时保持现状（仅百度整句翻译）。

## 四、测试

- 新增 `src/test/dictionary-store-source.test.ts`：源码级断言 `DictionaryStore` 的懒加载/查找/词形还原/未命中回退逻辑存在。
- 新增 `src/test/selection-translate-source.test.ts`：断言 `capture.ts` 的 SendKeys('^c') 脚本、剪贴板恢复逻辑、全局快捷键注册、单词/句子分流逻辑存在。
- 更新 `src/test/webtools-translate-plugin-source.test.ts`：断言设置视图新增“划词翻译”开关/快捷键字段。
- 全部改动完成后：`pnpm run build` + 针对性回归测试；批量改动完成后再跑一次 smoke（遵循 `AGENTS.md` 的验证顺序，不在过程中反复启动 Electron）。

## 待确认/风险点

- 词典库版本用 **mini 精简版**（体积小，覆盖常用词），而非 76 万词条完整版，以控制安装包体积；如果需要完整版覆盖冷门词汇，可以之后换成完整数据文件，代码结构不变。
- 模拟 Ctrl+C 依赖 PowerShell `SendKeys`，对某些以管理员权限运行、或使用 UAC 隔离的前台窗口可能不生效（和现有粘贴功能有同样的已知限制）。
- 弹窗默认快捷键定为 `F2`（当前未被占用），可在设置里改。

## 实施任务清单

| ID | 任务 |
|---|---|
| build-ecdict-db | 编写 `scripts/build-ecdict-db.cjs`，生成 `src/assets/ecdict.db`（ECDICT mini 数据） |
| shared-dictionary-types | 新增 `src/shared/dictionary.ts` 与 `channels.ts` 中的 `lookupDictionaryWord` 通道 |
| dictionary-store | 新增 `src/main/dictionary/store.ts` 的 `DictionaryStore`（独立只读连接、查找、词形还原） |
| dictionary-ipc | 接入 `ipc.ts`/`preload/index.ts` 的 `DictionaryProvider` |
| selection-capture | 新增 `src/main/selection-translate/capture.ts`（SendKeys('^c') + 剪贴板轮询 + 还原） |
| selection-hotkey | 在 `index.ts` 新增划词翻译全局快捷键注册与单词/句子分流逻辑 |
| selection-popup-window | 新增 selection-translate 悬浮弹窗窗口 + preload + 渲染器（词典卡片/翻译卡片两态） |
| selection-settings | 新增 `SelectionTranslateSettingsStore` 并在文本翻译设置视图中加入划词翻译开关/快捷键 |
| panel-dictionary-card | 在 webtools-translate 面板中为单词输入增加词典卡片展示 |
| tests-and-build | 新增/更新回归测试，build + 针对性测试，批次完成后跑一次 smoke |
