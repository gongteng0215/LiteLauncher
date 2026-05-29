# LiteLauncher 工作记录

更新时间：2026-05-28

## 最近完成
- 收口设置页日志展示与 renderer 兜底偏好：错误日志面板进一步压紧为更适合日常排查的紧凑 monospace 区块，并为 pin 相关记录补充可读摘要；同时复核 renderer 搜索结果合并评分时，补上对稳定 `app:startapp:*` Windows Store `id` 的偏好，避免前端回退到较弱的旧结果形态。同步新增 `renderer-startapp-source` 与 `search-section-grid-style` 护栏，并在 `pnpm run build` 后串行完成 `node dist/test/renderer-error-log-source.test.js`、`node dist/test/renderer-startapp-source.test.js`、`node dist/test/search-section-grid-style.test.js`、`node dist/test/launcher-main-flow-regression.test.js`、`node dist/test/windows-app-alias-regression.test.js`、`node dist/test/e2e-search-layout-smoke.test.js` 验证，结果均通过。
- 收口 Windows Store 应用稳定 `id`：在复核同类 StartApps / WindowsApps 流程时，发现 `src/main/catalog.ts` 在“PATH alias 可解析”分支下仍会生成 `command:apps-folder:*` 风格 `id`，而动态搜索已经统一为 `app:startapp:*`，存在在部分机器上再次触发“能搜到但不能置顶”的复发风险。现已抽出 `src/main/windows-startapp.ts` 统一构造 stable `id`，让 catalog 与动态搜索在 PATH alias 正常和缺失两种情况下都保持一致；同步补强 `windows-app-alias-regression` 断言，确认 catalog / dynamic search / AppsFolder 启动链路一致。本轮在 `pnpm run build` 后串行完成 `node dist/test/windows-app-alias-regression.test.js` 验证，结果通过。
- 改善错误日志与真实交互验证：设置页错误日志现在会把 `Pin request rejected / failed` 翻译成更易扫读的中文摘要，直接展示“置顶请求已拒绝 / 置顶保存失败”、项目 `itemId` 与用户可理解的原因；同时把搜索首页 Electron smoke 补强为断言 live `setItemPinned(...)` 返回 `ok=true` 与 `pinned=true`，确认主进程、preload、renderer 和真实窗口交互链路一致。本轮在 `pnpm run build` 后串行完成 `node dist/test/renderer-error-log-source.test.js`、`node dist/test/launcher-main-flow-regression.test.js`、`node dist/test/e2e-search-layout-smoke.test.js` 验证，结果均通过。
- 补强置顶交互反馈：将 `setItemPinned(...)` 改为返回结构化的 `PinToggleResult`，渲染层据此区分“已置顶 / 已取消置顶 / 置顶失败（无效项目、结果过期、保存失败）”，避免只看到一条泛化失败提示；同时新增 `renderer-pinning-status` 回归，确认提示文案与失败原因映射稳定。本轮在已完成的 `pnpm run build` 基础上，串行验证 `node dist/test/renderer-pinning-status.test.js`、`node dist/test/launcher-main-flow-regression.test.js`、`node dist/test/windows-app-alias-regression.test.js`，结果均通过。
- 补强置顶失败可观测性：将主进程 `setItemPinned(...)` 的请求校验抽到 `src/main/pinning.ts`，把空 `itemId` 与 “搜索结果 ID 不在当前 catalog 中” 两类拒绝原因显式区分，并在拒绝或持久化异常时写入 `app_error_logs`，避免再次出现 UI 只提示“置顶失败”但日志无上下文的黑盒情况；同步为 `launcher-main-flow-regression` 增补 `validatePinnedItemRequest(...)` 回归断言，本轮已完成 `pnpm run build`、`pnpm run test:main-flow`、`pnpm run test:windows-alias` 验证，结果均通过。
- 修复微软应用商店版 `Codex` 置顶失败：排查本机 `app_error_logs` 后确认当前“置顶失败”没有单独落错，而是 `setItemPinned(...)` 对动态 `Codex` 搜索结果做 catalog 校验时静默返回 `false`；根因是 `src/main/search.ts` 生成的 WindowsApps 动态应用结果使用了临时 `command:apps-folder:codex` 风格 `id`，与 catalog 中稳定持久的 `app:startapp:codex` 不一致，导致右键置顶找不到同一条 catalog 记录。现已将 WindowsApps / StartApps 动态 `Codex` 结果的 `id` 对齐为 catalog-stable 的 `app:startapp:<alias>`，并补强 `windows-app-alias-regression` 断言，确保商店版 `Codex` 在 PATH alias 正常与缺失两种情况下都能产出可置顶的稳定搜索项；本轮串行完成 `pnpm run test:windows-alias` 与 `pnpm run test:main-flow` 验证，结果均通过。
- 修复微软应用商店版 `Codex` 搜索兜底：确认系统层 `where codex`、`Get-Command codex` 与 `shell:AppsFolder\OpenAI.Codex_2p2nqsd0c76g0!App` 在本机均可解析后，补齐 `src/main/search.ts` 的 `Get-StartApps + Get-AppxPackage` 回退链路，使 LiteLauncher 在当前进程拿不到 PATH alias 时，仍能从 StartApps / WindowsApps 元数据生成 `Codex` 应用搜索结果并通过 AppsFolder 启动；同时新增 `windows-app-alias-regression` 回归用例覆盖“PATH alias 缺失时仍能搜到商店版 Codex”。本轮按仓库约定串行完成 `pnpm run test:windows-alias` 与 `pnpm run test:main-flow` 验证，结果均通过。
- 继续收口 `renderer.ts` 分发壳层：本轮把 `launcher.onOpenPanel(...)` 的内联路由从 `registerEvents()` 中抽成独立的 `handleLauncherOpenPanel(...)` helper，并进一步把 `handleKeydown()` 里 `password / cashflow / plugin` 三段面板模式分支抽成 `handlePanelModeKeydown(...)`；行为保持不变，但 `renderer.ts` 的事件注册与主键盘分发职责继续变薄，后续再拆剩余搜索 / 列表键盘逻辑会更顺手。同步为 `plugin-panel-impls-regression` 增补源码护栏，防止 `openPanel` 路由和 panel-mode keydown 分支回流到大函数内联；本轮仍按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js`，结果 53/53 通过。
- 恢复并完成 `panel-baseline-round2` worktree 收尾：在误删后先从 branch `codex/panel-baseline-round2` 重建 worktree，并把归档的 `working-tree.patch` 重新 apply 回恢复出的 worktree，复核已提交增量与未提交现场；确认其中布局/测试等有效内容已经回填到主线、其余主要是已被主线后续修改覆盖或不再保留的 `renderer.ts` / `plugin-panel-impls.ts` / 测试大块 WIP 后，在 `main` 上补记 merge 关系 `merge: reconcile codex/panel-baseline-round2 into main`，再移除 worktree。最终归档仍保留在 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/`，当前 `git worktree list` 与磁盘 `.worktrees` 均只剩主仓库 `main`。
- 清理 worktree 残留目录并统一文档口径：确认 `.worktrees/renderer-plugin-state-extraction` 只是磁盘残留目录、并非 `git worktree list` 注册中的有效 worktree，已安全删除，避免后续再出现“列表里没有、磁盘上还有旧目录”的混乱状态。
- 安全回填 `Image Base64` round2 结构与轻量 smoke 断言：主线 `src/renderer/plugin-panel-impls.ts` 已把 `图片 Base64` 面板从旧的平铺按钮 + 文本域结构补回为带头部工具条、预览/编辑双栏、上传按钮、拖拽态与本地文件读取 helper 的 round2 结构；同时补齐 `plugin-panel-impls-regression` 对 `webtools-image-base64-header / toolbar / layout / editor / readWebtoolsImageBase64FileAsDataUrl` 的源码护栏，以及 `e2e-plugin-panels-smoke` 对 `ImageBase64 / Colors / Unit / Strings / API / QRCode / UA` 结构可见性的轻量断言；本轮按约定先完成 `pnpm run build`，再串行执行 `node dist/test/plugin-panel-impls-regression.test.js`、`node dist/test/clipboard-workbench-plugin.test.js` 与 `node dist/test/clipboard-workbench-service.test.js`，结果均通过。
- 收口 `renderer.ts` 壳层职责并同步文档口径：本轮再次核对 `src/renderer/index.html` 仍按 `plugin-panel-impls.js` 在前、`renderer.js` 在后的顺序加载；`src/renderer/renderer.ts` 已移除重复的 standalone/password/cashflow 与 WebTools / Hardware 旧实现块，当前主要保留搜索 / 设置壳层、`panelImplsSafe` 分发、通用 DOM / status helper 与少量剩余共享状态；最近又把 `openPanel` 路由与 panel-mode keydown 分支抽成独立 helper。`src/test/plugin-panel-impls-regression.test.ts` 当前共有 53 个源码回归用例，最近一次完成的串行验证仍为 `pnpm run build` 后执行 `node dist/test/plugin-panel-impls-regression.test.js`，结果 53/53 通过。
- 安全回填 `renderer.ts` 插件类型 / runtime state 下沉批次：新增 `src/renderer/plugin-runtime-types.d.ts` 承接 WebTools / Hardware / Cashflow / plugin panel 专属类型声明，并把 `webtools-password / json / url / diff / timestamp / regex / crypto / jwt / strings / colors` 这批已仅供插件面板实现层使用的 runtime state、默认常量与 `tryParseWebtoolsUrl` 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`；同时把 `plugin-panel-impls-regression` 扩展为校验这些类型和状态不再回流主渲染文件，已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证，当前该回归集为 51/51 通过；`renderer.ts` 当前行数已进一步降到约 3,499 行。
- 安全回填 `Colors / QRCode / UA / API / Unit / Strings / URL` 共用面板结构批次：将 `颜色工具`、`二维码生成`、`UA 解析`、`API 调试`、`单位换算`、`字符串工具` 的成熟 round2 面板结构手工回填到主线，包括 `Unit` 结果卡与复制动作、`Strings` 分区与中文动作文案、`Colors` 色板实验室布局、`QRCode` 两栏配置与 Logo 区、`UA` 头部与编辑区、`API` 请求 / 预览 / 响应头壳，以及 `URL` 字段标签中文本地化；同时补齐对应源码回归护栏，防止这些面板回退到旧的松散结构；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Clipboard Workbench / CodeAgent Switch` 收口批次：将 `Clipboard Workbench` 的插件 Enter 行为从 `renderer.ts` 里的旧 refresh 分支收口为 `form.requestSubmit()`，继续让提交逻辑留在 `plugin-panel-impls` 内部；同时为 `Clipboard Workbench` 补齐可见中文文案与 submit 链路源码回归，为 `CodeAgent Switch` 补齐 Enter -> submit 与 form submit -> read 的源码回归；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证，当前该回归集为 48/48 通过。
- 安全回填 `plugin-panel-impls-regression` 覆盖批次：把主线里已经完成下沉、但此前还没被源码回归锁住的 `ImageBase64 / Config / SQL / QRCode / Markdown / UA / API / Cron / Unit / FileHash / PortHelper / HttpMock / Image Prompt` helper 与 runtime state 归属断言补齐到 `src/test/plugin-panel-impls-regression.test.ts`，确保这些实现继续稳定留在 `src/renderer/plugin-panel-impls.ts` 而不是回流 `src/renderer/renderer.ts`；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证，当前该回归集为 46/46 通过。
- 安全回填 `Image Prompt` 基础状态批次：将 `window.__LL_IMAGE_PROMPT_DATA__` 引导、共享产品 / 分组 / 风格 / 智能模板 / 文字设计常量、默认示例状态与生日示例模板，从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，并补齐 `image prompt base state helpers live with plugin-panel-impls instead of renderer` 源码回归，确保 `Image Prompt` 的基础状态和示例数据不再回流主渲染文件；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Hardware Inspector` 小批次 helper / state 迁移：将硬件检测面板的运行时状态、格式化与 diff helper、snapshot apply、refresh / export 执行链路从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把 Enter 行为统一为 `form.requestSubmit()`，继续压平 `renderer.ts` 的插件分发边界；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 收尾下沉插件面板临时状态清理：将 `renderActivePluginPanel` / `setMode` 中分散的 JSON / Diff / Timestamp / Cron / Crypto / JWT / Colors / ImageBase64 / ImagePrompt / Config / SQL / QRCode / Markdown / UA 等 timer / request cleanup 统一收进 `window.__LL_PANEL_IMPLS__.cleanupPluginPanelTransientState(...)`，并把 `Password`、`JSON`、`Timestamp` 剩余共享 helper 一并迁入 `src/renderer/plugin-panel-impls.ts`；`CodeAgent Switch` 的 Enter 也改为 `form.requestSubmit()`，让主渲染继续只保留轻量分发；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 收尾统一剩余 submit-driven 插件 Enter 入口：将 `Cron`、`ImageBase64`、`ImagePrompt`、`Config`、`SQL`、`Unit`、`FileHash`、`PortHelper`、`QRCode`、`Markdown`、`UA`、`API`、`HttpMock` 等仍由 `renderer.ts` 直接调 executor 的 `onEnter`，统一改为 `form.requestSubmit()`，让提交逻辑回到各自面板内部的 submit handler，进一步压平 `renderer.ts` 的插件入口分叉；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `JSON / Regex / Crypto` 与 `Password` 残留 helper 批次迁移：将 JSON 工具的 target / info-state / 结果刷新 / 自动转换 / executor，Regex 工具的 HTML 转义 / flags 规整 / 状态刷新 / 预览刷新，Crypto 工具的算法规整 / 模式判断 / 结果刷新 / target / 自动处理 / process / generateKeys，以及 Password 剩余的 target / 结果表格 helper，从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`；同时把 `JSON`、`Regex`、`Crypto` 插件面板 Enter 动作统一改为 `form.requestSubmit()`，继续保留状态、常量与 timer cleanup 在 `renderer.ts` 不扩批；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `JWT` 小批次 helper 迁移：将 JWT 工具的 command target / 秘钥文案 / 状态文案 / 模式刷新 / 结果刷新 / 自动 parse / 自动 sign / executor 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，继续保留定时器 cleanup 留在 `renderer.ts` 不扩批；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Password` 小批次渲染 helper 迁移：将随机密码工具的结果刷新 helper 与面板生成执行器从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，保持已有 submit handler 入口不变；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。

- 安全回填 `URL` 小批次渲染 helper 迁移：将 URL 解析工具的本地解析 / query rows 回写 / 表单刷新 / 字段工厂等 helper 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，继续保持 `tryParseWebtoolsUrl` 与基础 URL state 常量留在 `renderer.ts` 不扩批；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Timestamp` 小批次渲染 helper 迁移：将时间戳工具的 command target / 结果刷新 / 自动转换 / executor 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，继续保持默认值初始化、时钟刷新与 timer cleanup 留在 `renderer.ts` 不扩批；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Diff` 小批次渲染 helper 迁移：将文本对比工具的 command target / 结果卡片 / 结果刷新 / 自动对比 / executor 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，继续保持计时器清理逻辑留在 `renderer.ts` 不扩批；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Colors` 小批次渲染 helper 迁移：将颜色工具的 command target / preview 刷新 / 自动转换 / executor 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，继续保持计时器清理逻辑留在 `renderer.ts` 不扩批；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Strings` 小批次渲染 helper 迁移：将字符串工具的 command target / executor 从 `src/renderer/renderer.ts` 迁入 `src/renderer/plugin-panel-impls.ts`，同时把插件面板 Enter 动作改为 `form.requestSubmit()`，并补齐源码回归锁定 helper 不再回流；已按串行顺序完成 `pnpm run build` 与 `node dist/test/plugin-panel-impls-regression.test.js` 验证。
- 安全回填 `Clipboard Workbench` 小批次本地化：将原 `codex/panel-baseline-round2` 里相对独立的剪贴板工作台标题、说明、状态消息、面板可见文案与对应测试手工回填到 `main`，避免这部分价值继续埋在大块未提交 WIP 里；已完成 `pnpm run build`、`node dist/test/clipboard-workbench-plugin.test.js`、`node dist/test/clipboard-workbench-service.test.js` 与 `node dist/test/plugin-panel-impls-regression.test.js` 定向验证。
- 完成 `panel-baseline-round2` 剩余改动第二轮复核：在 `Clipboard Workbench` 本地化、`Hardware Inspector` helper/state 下沉，以及 `Image Prompt` 基础状态回填之后，确认剩余 diff 主要集中在 `src/renderer/plugin-panel-impls.ts`、`src/renderer/renderer.ts` 与相关测试的大块未提交 WIP，已随 worktree 现场一起归档，不再继续保留该 worktree。
- 渲染层拆分第六刀落地（7 批次）：将 Cron / ImageBase64 / ImagePrompt / Config / SQL / Unit / Markdown / UA / API / HttpMock / QRCode / FileHash / PortHelper 等插件的状态变量与辅助函数从 `renderer.ts` 迁出到 `plugin-panel-impls.ts`，`renderer.ts` 从约 12,747 行缩减至约 9,049 行（减少约 3,700 行），全量回归与 E2E smoke 持续通过。

- 完成 round 2 已提交增量回填：把原 `codex/panel-baseline-round2` 中已确认有价值的第二轮窄窗口 / 高 DPI 样式与测试改动手工回填到 `main`，包括 `CodeAgent Switch` 1180/860 断点顺序修正、`e2e-launcher-smoke` 的 JSON 标题兼容定位、`e2e-plugin-panels-smoke` 的多插件窄窗口覆盖、`plugin-panel-impls-regression` 的紧凑布局断言补强，以及新增 `src/test/e2e-plugin-panel-layout-smoke.test.ts` 并接入 `test:e2e:smoke`。
- 完成文档与 worktree 再盘点：临时 `codex/panel-baseline-reconcile` worktree 已完成安全回填使命；`panel-baseline-round2` 也已按“恢复核对 -> 补记 merge -> 删除 worktree”的顺序收尾，后续不再作为活跃 worktree 保留。
- 完成插件面板高 DPI / 小窗口首轮基线：为搜索首页补齐收缩与换行样式约束，给 `codeagent-switch`、`clipboard-workbench`、`webtools-password`、`webtools-json`、`webtools-cron` 增加窄窗口断点回归，并把搜索首页与重点插件面板的小窗口不横向溢出检查接入源码断言与 Electron smoke。
- 准备发布 `v1.0.16` 收敛版，应用版本已同步到 `package.json`；本轮主要覆盖插件面板 round2 回填、`renderer.ts` 壳层继续收口、回归护栏扩展，以及发布前完整回归 / smoke 验证。
- 新增默认可见插件 `hardware-inspector`：支持主板、CPU、内存、显卡、硬盘等硬件信息采集，提供变化对比、复制摘要 / JSON、Markdown / HTML 报告导出。
- 新增默认可见插件 `webtools-file-hash`：支持 MD5 / SHA1 / SHA256 / SHA512 文件哈希计算与期望哈希对比。
- 新增默认可见插件 `webtools-port-helper`：支持 TCP / UDP 端口占用查询、PID 定位与释放端口。
- 新增默认可见插件 `webtools-image-prompt`：支持 ChatGPT Images 2.0 产品模板、26 类风格预设切换、12 个智能场景模板、联动模块点选、生日照片 / 周岁模板、文字设计卡片、结构化生日文字、生成与复制图片提示词。
- 新增默认可见插件 `codeagent-switch`：支持 Codex `config.toml` 读取、Provider / Profile 摘要、认证 / env_key / wire_api / 会话风险诊断、环境变量命令复制、Profile 切换 diff 预览、备份后安全写入、备份列表与恢复；完整 Provider 编辑器仍在后续阶段。
- 默认可见插件从 21 个扩展到 26 个，插件列表分页链路继续沿用完整可见集合 + 渲染层分页。
- 插件 Enter 行为配置已补齐到 Hardware / File Hash / Port Helper 等新增插件，默认打开命令由 `test:plugins-visible` 覆盖。
- 完成文档全量口径同步并准备发布 `v1.0.12`，统一默认可见插件为 21 个（含 `webtools-http-mock`）。
- 调整 `HTTP Mock Server` 目录展示策略：默认插件目录仅保留单入口，动作项通过别名查询返回，避免插件分区重复占位。
- 发布 `v1.0.11`，同步 GitHub Release 与英文发布日志。
- 扩展 `test:e2e:smoke`，使用 Playwright 跑通“启动窗口 -> 设置页 -> 搜索并打开 JSON 插件”，并补齐 `API 调试`、`二维码生成`、`配置转换`、`Markdown 预览`、`图片 Base64`、`文本对比` 的插件 UI 冒烟。
- 新增 `test:regression:full`，把现有回归脚本与 UI smoke 串成完整发布前检查链路。
- 增加开发模式 `pnpm dev`：自动编译、主进程自动重启、渲染层自动刷新。
- 启动链路支持 `--replace-instance`，避免旧 Electron 主进程残留导致代码不生效。
- 搜索链路补齐 Windows 命令 / StartApps / WindowsApps 支持，典型场景：`codex`。
- `Codex` 搜索结果改为真实应用项，补齐真实图标、去重与 AppsFolder 启动链路。
- 新增 `test:windows-alias`，覆盖 `codex` 的 catalog / dynamic search / AppsFolder 启动回归。
- 新增 `test:main-flow`，覆盖“搜索命中设置 / 插件 -> 执行打开面板”的主流程回归。
- 前移 `API 调试`、`配置转换`、`SQL 格式化`、`二维码生成` 的小屏关键断点，缓解中等宽度挤压问题。
- 插件原生交互期间暂停自动隐藏，覆盖图片选择、二维码下载、图片下载等动作。
- 多行输入统一为：`Enter` 换行、`Ctrl+Enter` 执行、`Esc` 返回。
- 文档体系重新对齐到当前实现状态。
- 渲染层拆分第一刀落地：插件 ID 与默认可见插件常量从 `renderer.ts` 外置到前置脚本，降低主文件耦合并保持运行链路不变。
- 渲染层拆分第二刀落地：SQL / 配置转换 / 颜色 / 正则 / JWT / 密码等插件面板静态数据从 `renderer.ts` 外置到前置脚本，并保持现有 E2E 冒烟链路稳定通过。
- 渲染层拆分第三刀落地：搜索范围前缀规则外置到前置静态数据脚本，减少主文件静态配置体积。
- 渲染层拆分第四刀落地：插件处理器从硬编码对象改为配置驱动注册（前置 handler 配置脚本 + 主渲染统一 Enter 动作分发），减少重复代码并降低后续接入成本。
- 渲染层实现层拆分完成本轮三步：Diff / Markdown / ImageBase64 / Config / SQL 面板的 apply/render 实现迁出主文件，主渲染改为轻量包装调用，构建与 UI smoke 持续全绿。
- 渲染层实现层拆分第二批完成：Strings / Colors / Qrcode / UA / API 面板的 apply/render 也迁出主文件，主渲染侧统一为包装调用；`pnpm build` 与 `pnpm test:e2e:smoke` 通过。
- 渲染层实现层拆分第三批完成：Password / Cron 面板的 apply/render 迁出 `renderer.ts` 并改为包装调用，类型声明同步到 `global.d.ts`。
- Playwright UI smoke 第四批完成：新增 `密码工具`、`颜色工具`、`SQL 格式化`、`Cron 生成器` 核心交互覆盖，并加入小屏宽度下表单不溢出断言；`pnpm test:e2e:smoke` 通过。
- 渲染层实现层拆分第四批完成：JSON / Timestamp 面板的 apply/render 迁出 `renderer.ts` 并改为包装调用，类型声明同步到 `global.d.ts`。
- Playwright UI smoke 第五批完成：新增 `JSON 工具`、`URL 解析`、`时间戳工具` 核心交互覆盖，并加入同口径小屏断言；`pnpm test:e2e:smoke` 持续通过。
- 渲染层实现层拆分第五批完成：URL 面板的 apply/render 迁出 `renderer.ts` 并改为包装调用，类型声明同步到 `global.d.ts`。
- Playwright UI smoke 第六批完成：新增 `单位换算` 核心交互覆盖，并加入同口径小屏断言；`pnpm test:e2e:smoke` 持续通过。
- 新增插件规划文档 `docs/plugin-ideas-roadmap.md`，沉淀已讨论候选、补充新增候选与落地顺序。
- `HTTP Mock Server` 进入实现阶段：新增主进程插件 `webtools-http-mock`，支持 `start/stop/status` 命令并可启动本地临时接口；当前作为灰度能力注册（默认不可见），待补面板与 E2E。
- `HTTP Mock Server` 第二阶段完成：补齐插件面板编辑（方法/端口/路径/状态码/响应体）、接入 Enter 启动动作，并新增 E2E 覆盖启动 -> 命中 -> 停止全链路；`pnpm test:e2e:smoke` 通过。
- 插件分区可扩展能力上线：补齐插件分区分页（支持超过 20 条持续浏览），并修复主进程 IPC 对插件列表的 `pluginLimit` 截断，改为返回完整可见插件集合由渲染层分页展示。
- 搜索首页布局完成紧凑化：`最近访问`、`置顶`、`插件` 统一使用固定小图标卡片，列数按实际宽度自适应，标题限制两行，置顶标记改为不遮挡内容的小圆点，并新增 Electron 布局 smoke 覆盖。
- 新增默认插件 UI smoke 已补齐：`hardware-inspector`、`webtools-file-hash`、`webtools-port-helper` 纳入 `test:e2e:smoke`，覆盖小窗口不横向溢出、文件哈希真实文件校验、端口查询主流程。
- File Hash / Port Helper 面板实现迁入 `plugin-panel-impls.ts`，主渲染侧改为 `panelImplsSafe` 调用，并新增源码回归防止新增默认插件面板回流到 `renderer.ts`。
- Crypto / JWT delegate 已移除，Diff / Config / SQL handler 已切到 `panelImplsSafe`，五个面板的 apply/render 实现统一落在 `plugin-panel-impls.ts`，源码回归覆盖禁止回流。
- Password / JSON / URL / Timestamp / Cron / Strings / Colors / QRCode / UA / API / HTTP Mock 等轻量 apply/render wrapper 已删除，handler 直接调用 `panelImplsSafe`，源码回归防止 wrapper 回潮。
- Markdown 面板 apply/render 已改为 `panelImplsSafe` 直连，`renderer.ts` 只保留渲染执行 helper；同时为打开插件命令增加 keepOpen 刷新保护，避免面板打开后被搜索列表二次刷新覆盖。
- 图片提示词核心生成器已抽到 `shared/image-prompt-builder` 并接入源码回归；面板实现直接落在 `plugin-panel-impls.ts`，当前按 26 类风格预设切换并联动过滤主体、构图、灯光、材质、环境等模块选项，内置淘宝主图、品牌主视觉、小红书封面、短视频封面、生日照片、宝宝周岁照、美食杂志、App/SaaS、电影海报、旅行宣传、医疗健康、金融商务 12 个智能模板；生日风格支持照片人物说明、周岁模板、年龄 / 祝福语 / 姓名 / 小标签结构化字段；12 个智能模板和 26 类风格预设已绑定 25 套场景化文字设计，面板用文字设计卡片展示字形、颜色、效果、布局、安全区和关键词，提示词会输出文字层级、颜色、效果、布局、安全区和生日文字结构，把文字作为版式元素融入画面而不是后贴字幕；智能模板切换时会重建面板并同步 EXACT 文案、位置、字形、文字设计和结构化文字控件。
- 图片提示词新增场景级文字推荐：创建不同风格默认状态时会自动推荐更合适的文字位置和字形，例如电影海报默认底部片名、SaaS 默认顶部左侧现代黑体、旅行海报默认顶部品牌字标、人像默认底部细字重；同时补了轻量源码 UI 回归，锁住文字设计下拉使用稳定 id、设计卡片展示字形/颜色/布局/安全区，以及生日快捷模板同步结构化年龄。
- Playwright UI smoke 新增 `加密工具` 与 `JWT 调试器` 主流程覆盖，分别验证 MD5 自动输出与示例 JWT 解析。
- 针对 Hardware / File Hash / Port Helper 及相关渲染面板做了 mojibake 扫描，当前未发现明显乱码命中。
- CodeAgent Switch 本轮升级为 Codex 配置管理器：面板顶部加入 Codex / Claude Code / Gemini CLI 工具分组（后两者为规划中），Codex 当前 Provider / Profile / 模型会被明确标注；Provider 支持新增、编辑、删除和 env_key 名称配置，Profile 支持新增、编辑、删除、预览和应用；所有保存/删除动作复用备份、临时文件、重读校验和替换流程，不保存真实 API Key。
- CodeAgent Switch 继续优化配置编辑体验：TOML 解析支持 `[profiles."淘宝1"]` 这类非 ASCII/引号段 profile id，当前 Profile 匹配只比较预设中明确填写的字段，因此“淘宝1”等已选配置会正确高亮；面板改为左侧 Provider/Profile 简略列表、右侧详情页编辑，列表行提供 `selected` 与 `active` 两套状态，新增/编辑/删除都在详情页完成。
- CodeAgent Switch 面板源码完成收尾清理：删除旧的不可达渲染实现和 V2 内未挂载的内联编辑列表构造，源码回归新增断言防止列表行再次塞回 Provider/Profile 编辑器，后续只维护 master-detail 详情页路径。
- CodeAgent Switch 面板继续按 cc switch 方向优化：工具切换改为左侧固定宽度栏，Profile 成为中间主列表，Provider 收敛为紧凑管理条，右侧详情页按配置、切换操作、diff 预览、诊断、备份、环境变量命令和危险区分组；预览/应用/复制/恢复等动作跟随当前选中项展示，并新增源码回归锁住三栏 shell、工具侧栏、Profile 列表、Provider strip 和详情分组结构。
- CodeAgent Switch 细化可扫描性：中间列新增“当前配置”摘要卡，右侧详情页新增只读字段概览网格，列表行和 Provider chip 用独立 `selected` / `active` badge 区分“正在查看”和“当前生效”，减少用户判断当前配置时的跳读成本。
- CodeAgent Switch 修正切换与 Key 配置入口：Profile 列表行直接展示“预览 / 切换”按钮，当前 Profile 的切换按钮显示为“当前”并禁用；Provider 编辑器不再要求手填 `env_key` 名称，而是按 Provider ID 自动生成 `CODEAGENT_<PROVIDER>_API_KEY`，API Key 输入只用于复制本机环境变量设置命令，不会写入配置或保存到插件状态。
- CodeAgent Switch 继续强化“怎么切换”和“不要手输入名字/Key 名”的体验：右侧 Profile 详情页顶部直接提供“预览 / 设为当前”主操作，列表行文案也统一为“设为当前”；Provider 新增时自动预填不冲突 ID，用户先填 Base URL 时会按域名联动生成 Provider ID、显示名称和 `CODEAGENT_<PROVIDER>_API_KEY`，Key 设置独立成块并使用单独复制反馈。
- CodeAgent Switch Key 配置改为直接执行：Provider 详情页的主按钮为“写入系统 Key”，会把临时输入的 API Key 写入 Windows 用户级环境变量并同步当前 LiteLauncher 进程环境，诊断可立即识别；复制命令保留为备选，明文 Key 仍不写入 `config.toml` 或插件状态。
- CodeAgent Switch 修正 Codex 新版 Profile 切换口径：预览和应用现在只管理顶层 `profile = "<profile-id>"`，并清理根部重复的 `model_provider`、`model`、`review_model`、`model_reasoning_effort`、`model_auto_compact_token_limit`，模型参数只保留在 `[profiles.xxx]` 模板段；同时补了中文 Provider 名回归，避免 `淘宝1`、`银河` 这类值在插件链路中再次变成乱码。本机 `C:\Users\lybly\.codex\config.toml` 已备份并清理为顶部仅保留 `profile = "OpenAI"`。
- CodeAgent Switch 对齐官方 Codex 配置参考继续补字段：Provider 详情页新增 `env_key_instructions`、`supports_websockets`、`http_headers`、`env_http_headers`、`query_params`；Profile 详情页新增 `plan_mode_reasoning_effort`、`model_reasoning_summary`、`model_verbosity`、`service_tier`、`web_search`；详情页新增“运行权限”区，可保存 `approval_policy`、`sandbox_mode`、`default_permissions`、`network_access` 和 `[windows] sandbox / sandbox_private_desktop`。保存路径仍走备份、临时文件、重读校验和替换流程，并新增 parser/plugin/source 回归覆盖。

## 当前版本基线

- 应用版本：`v1.0.16`
- 默认可见插件数量：26
- 已开放 WebTools 插件数量：23（原 `webTools` 20 个 + 文件哈希 + 端口助手 + 图片提示词）
- 非 WebTools 默认插件：`cashflow-game`、`hardware-inspector`、`codeagent-switch`
- 开发模式：`pnpm dev`
- 完整回归入口：`pnpm run test:regression:full`
- 搜索首页布局回归：已接入 `pnpm run test:e2e:smoke`
- 新增默认插件与 Crypto / JWT UI smoke：已接入 `pnpm run test:e2e:smoke`
- Windows 应用别名（如 `codex`）已支持搜索与启动

## 当前 worktree 状态

- `E:\AI\LiteLauncher` -> `main`：当前主线 worktree，已经纳入本轮 round 2 已提交的样式 / 测试回填增量，以及新近回填的 `Clipboard Workbench` 本地化批次、`Hardware Inspector` helper/state 下沉批次、`Clipboard Workbench / CodeAgent Switch` Enter 收口批次、`Colors / QRCode / UA / API / Unit / Strings / URL` 共用结构回填批次和 `plugin-panel-impls-regression` 护栏补齐批次；最近一次完成的串行验证结果仍为 `pnpm run build` 通过，随后 `node dist/test/plugin-panel-impls-regression.test.js` 53/53 通过。
- `E:\AI\LiteLauncher` -> `main`：本轮又额外回填了 `Image Base64` 的 round2 面板结构与上传/拖拽链路，并把 `Colors / Unit / Strings / API / QRCode / UA / ImageBase64` 的轻量结构 smoke 断言补进主线测试；这些增量已经通过本轮串行 `build + dist tests` 验证。
- `E:\AI\LiteLauncher` -> `main`：当前主线 `renderer.ts` 已进一步收口为渲染壳层，插件与 standalone 面板实现统一以 `src/renderer/plugin-panel-impls.ts` 为主；`renderer.ts` 当前主要保留搜索 / 设置壳层、`panelImplsSafe` 分发、通用 DOM / status helper 与少量共享状态，行数约 3,499。
- 当前状态结论：`codex/panel-baseline-round2` 已按“恢复现场 -> 复核 branch / patch -> 在 \`main\` 补记 merge 关系 -> 删除 worktree”的顺序完成收尾；其最终现场仍归档在 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/`，包含 `status.txt`、`branch-divergence.txt`、`working-tree.patch` 与 worktree 内备份文件。当前 `git worktree list` 与磁盘 `.worktrees` 都只剩主仓库 `main`。

## 当前主要风险

1. round 2 已提交且可验证的样式 / 测试增量，以及 `Clipboard Workbench` 可独立回填的本地化批次、`Hardware Inspector` 可独立回填的 helper/state 下沉批次，已回填到 `main`；`codex/panel-baseline-round2` 也已在 `main` 上补记 merge 关系并完成 worktree 清理，剩余未提交的 `renderer` / `plugin-panel-impls` 大块 WIP 仅保留归档现场，后续若要追查需基于归档 patch 或主线继续收口。
2. 渲染层执行 helper 与共享状态已大幅迁出，`renderer.ts` 当前剩余的插件尾巴已进一步收敛到状态变量、少量共享常量与 Cashflow / Clipboard 等尚未拆完区域，但仍未完全清空所有历史状态定义。
3. 部分 WebTools 插件虽然可用，但还没有完全达到原版交互齐平。
4. 基于 `dist` 的定向测试如果与 `pnpm run build` 并行执行，会读到旧产物并产生假阳性；后续验证必须采用串行顺序：先 build，再逐个运行 `node dist/test/...`。
5. 仍有历史 UI 文案和编码问题需要持续清理，非本次新增插件范围仍需巡检。
6. Cashflow `cash review` 复盘能力还未真正落地。

## 下一步建议

1. 继续直接在 `main` 上拆分 `src/renderer/renderer.ts` 中剩余插件状态定义与共享边界，把 `panel-baseline-round2` 时代遗留但未继续保留的拆分目标转成主线上的持续收口工作；如需追溯旧现场，可参考 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/working-tree.patch`。
2. 继续拆分 `src/renderer/renderer.ts` 中剩余插件状态定义与尚未迁出的 Clipboard / Cashflow 等区域，参考 `docs/superpowers/plans/2026-05-26-renderer-plugin-state-extraction.md`。
3. 后续继续优先做源码回归 + `pnpm run build`，凡依赖 `dist` 的定向测试都串行执行，smoke / E2E 放到相关批次收尾。
4. 继续做非新增插件范围的 UI 文案与历史编码巡检。
5. 推进 Cashflow `cash review` 复盘模块。
6. 自动更新验证、签名 / 公证统一放到自用阶段低优先级收尾。
