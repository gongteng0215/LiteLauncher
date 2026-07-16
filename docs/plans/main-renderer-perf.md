<!--
  Source of truth for LiteLauncher planning docs.
  Migrated from Cursor plan: 主进程与渲染层性能优化_f6563ffb.plan.md
  Local Cursor copy may still exist under ~/.cursor/plans/ — prefer this repo path.
-->
---
name: 主进程与渲染层性能优化
overview: 修复三类性能/健壮性问题：(1) 主进程中可能导致界面卡死的同步阻塞调用；(2) LiteSnap 截图 overlay 首次冷启动慢的问题；(3) 渲染层不必要的全量重渲染、未防抖解析和监听器悬挂。按风险从高到低分三个阶段独立提交，每阶段都跑 build + 相关回归测试。
todos:
  - id: phase1-icon-timeout
    content: ipc.ts 图标关联 PowerShell 调用加超时+kill 保护
    status: completed
  - id: phase1-search-async
    content: search.ts resolveCommandPath/resolveWindowsStartApp 改为异步 spawn，getDynamicSearchItems 改为 Promise 并更新调用点
    status: completed
  - id: phase1-runasadmin-timeout
    content: actions.ts runAsAdmin 加超时保护
    status: completed
  - id: phase1-saveitems-prepare
    content: database.ts saveItems 循环内复用 prepared statement
    status: completed
  - id: phase1-verify
    content: Phase 1 build + 相关回归测试
    status: completed
  - id: phase2-delay-prewarm
    content: launcher 窗口就绪后延迟静默预热 LiteSnap overlay，更新相关回归断言
    status: completed
  - id: phase2-verify
    content: Phase 2 build + litesnap 相关回归测试
    status: completed
  - id: phase3-settings-save-render
    content: LiteSnap/通用设置保存后避免不必要的全量 renderList
    status: completed
  - id: phase3-json-debounce
    content: JSON 面板 updateJsonStats 加防抖
    status: completed
  - id: phase3-crypto-listener-cleanup
    content: 加密面板 outside-click 监听器接入统一清理
    status: completed
  - id: phase3-hardware-set-cleanup
    content: 硬件检测面板离开时清空 expandedDiskKeys
    status: completed
  - id: phase3-verify
    content: Phase 3 build + 相关回归测试，最后统一跑一次针对性 smoke
    status: completed
isProject: false
---

# 主进程与渲染层性能优化

## 背景

对代码库做了三路排查（主进程阻塞、LiteSnap overlay 启动链路、渲染层重渲染/内存），发现问题分布在搜索、图标解析、目录索引、数据库写入、LiteSnap 截图以及若干渲染面板中。本计划按影响程度分三个阶段推进，阶段之间相互独立，可分批验证/提交。

## Phase 1 — 消除主进程可能"卡死/无响应"的同步阻塞

1. **图标关联查询无超时** — [src/main/ipc.ts](src/main/ipc.ts) 中 `tryReadWindowsAssociatedIconAsDataUrl()`（约 819-895 行）用 `spawn("powershell.exe", ...)` 提取图标，但没有超时/kill 保护，个别系统上可能挂起对应的 IPC 请求。参照 `src/main/litesnap/ocr-capability-installer.ts` 里已有的 `runPowerShellFile` 超时+kill 模式，给这个调用加一个合理超时（如 4-6 秒），超时后 resolve `null` 并写入缓存，避免重复卡住。

2. **搜索时同步阻塞主进程** — [src/main/search.ts](src/main/search.ts) 的 `resolveCommandPath()`（61-110 行）和 `resolveWindowsStartApp()`（182-218 行）用 `spawnSync`（各带 1200/2000/5000ms 超时），在主线程同步等待，输入类似命令的查询时会让整个应用短暂卡顿。改为基于 `spawn` 的异步版本，`getDynamicSearchItems()`（238 行起）改为返回 `Promise`，同步更新三个调用点：
   - [src/main/ipc.ts:1609](src/main/ipc.ts)
   - [src/main/index.ts:1609](src/main/index.ts)
   - [src/main/index.ts:2129](src/main/index.ts)
   这几处调用点均已在 async IPC handler 内，改造成本可控。

3. **管理员权限提权无超时** — [src/main/actions.ts](src/main/actions.ts) 的 `runAsAdmin()`（约 262-337 行）spawn PowerShell 走 UAC 提权但没有超时，用户不确认/取消 UAC 弹窗时对应 IPC 会一直挂起。加一个超时（如 30-60 秒），超时后返回"等待用户确认"状态而不是无限期挂起。

4. **目录写库重复 prepare** — [src/main/database.ts](src/main/database.ts) 的 `saveItems()`（595-642 行）在循环里对每一条目调用 `this.run(...)`，而 `run()`（74 行）内部每次都重新 `this.db.prepare(sql)`。改为在事务开始时 `prepare` 一次 INSERT 语句，循环内复用 `stmt.run(...)`，减少大目录重建/保存时的开销。

## Phase 2 — LiteSnap 截图 overlay 冷启动优化

背景：调查确认 overlay 窗口本身是复用的（`ensureOverlayWindow`，[capture-session-manager.ts:664-683](src/main/litesnap/capture-session-manager.ts)），"overlay ready wait timed out" 主要发生在**冷启动第一次 F1**——overlay HTML/JS 首次加载较慢，同时和首次截屏编码抢主线程/GPU 资源。现有测试 [litesnap-plugin-source.test.ts:772-786](src/test/litesnap-plugin-source.test.ts) 明确禁止在 `createLauncherWindow()` 之前调用 `prewarmOverlay()`（避免拖慢应用启动）。

方案：不在启动瞬间预热，而是在启动完成、launcher 窗口就绪之后，**延迟几秒（如 3-5 秒）再静默预热一次 overlay**（只加载页面，不做截屏/frame cache warm），这样不违反现有回归测试对"启动阶段"的约束，也让用户首次按 F1 时大概率命中热 overlay。

具体改动：
- [src/main/index.ts](src/main/index.ts)：在 launcher 窗口 `ready-to-show`/`did-finish-load` 之后用 `setTimeout` 延迟调用 `liteSnapCaptureSessionManager.prewarmOverlay()`。
- 确认 `prewarmOverlay()`（[capture-session-manager.ts:134-145](src/main/litesnap/capture-session-manager.ts)）本身只等待 `waitForOverlayReady`，不做截屏，符合"轻量预热"要求。
- 更新/新增回归断言：确保新的延迟调用不在 `createLauncherWindow()` 之前（保持现有测试约束的字面意图），同时验证确实调用了 `prewarmOverlay`。

## Phase 3 — 渲染层重渲染/内存/防抖优化

1. **设置保存后全量重渲染** — [src/renderer/plugin-panel-impls.ts:13660-13738](src/renderer/plugin-panel-impls.ts)（`saveLiteSnapSettings`）与 [src/renderer/renderer.ts:2498-2584](src/renderer/renderer.ts)（`saveSettingsFromForm`）保存成功后都调用 `renderList()` 整页重建。改为只在保存导致"可见插件列表/主面板结构"真正变化时才 `renderList()`，否则只更新状态文字（参考 Cron 模板保存 `refreshWebtoolsCronTemplatesInForm` 的轻量局部刷新模式，[plugin-panel-impls.ts:6873-6940](src/renderer/plugin-panel-impls.ts)）。

2. **JSON 面板逐键解析** — [src/renderer/plugin-panel-impls.ts:18180-18240](src/renderer/plugin-panel-impls.ts) 的 `updateJsonStats()` 在 `input` 事件里同步调用，内部 `describePayload`（17567 行起）对大 JSON 做 `JSON.parse`，未做防抖。复用已有的 `scheduleWebtoolsJsonAutoConvert` 防抖模式（220ms），把 `updateJsonStats()` 的调用也接入防抖，只在停止输入一小段时间后才解析统计。

3. **加密面板监听器悬挂** — [src/renderer/plugin-panel-impls.ts:19019-19045](src/renderer/plugin-panel-impls.ts) 的 `removeAlgorithmOutsideListener` 只在用户主动关闭菜单时清理；若菜单打开时面板被外部 `renderList()` 重建，闭包丢失导致 `document` 级 `pointerdown` 监听器悬挂。把清理逻辑接入面板卸载/切换时统一调用的 `cleanupPluginPanelTransientState`（约 14200-14271 行）。

4. **硬件检测面板 Set 不清理** — [src/renderer/plugin-panel-impls.ts:5623](src/renderer/plugin-panel-impls.ts) 的 `hardwareInspectorExpandedDiskKeys` 在离开硬件检测面板时未清空，长会话下小幅增长。在离开面板/切换面板时清空该 Set。

## 验证方式

- 每阶段改完后：先跑受影响文件的源码级回归测试（`src/test/*-source.test.ts`），再 `pnpm run build`，再针对性跑 `node dist/test/<相关文件>.js`（build 与 dist 测试不并行执行，遵循 AGENTS.md 约定）。
- Phase 1、2 涉及主进程行为变化，完成所有阶段后再跑一次有针对性的 smoke（不重复跑多次），避免频繁打断用户。
- 不在这次改动中引入新的 UI 文案或交互变化，只做性能/健壮性修复。

