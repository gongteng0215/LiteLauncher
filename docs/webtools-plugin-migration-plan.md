# WebTools 插件迁移计划（LiteLauncher）

更新时间：2026-05-28
状态：原 `webTools` 迁移接入完成，新增能力、功能齐平、高 DPI / 文案 / 回归收敛持续推进

## 1. 背景

原 `webTools` 项目功能完整，但和 LiteLauncher 在架构、交互和视觉上不一致。迁移策略不是“整包搬运”，而是按 LiteLauncher 插件规范逐个落地。

## 2. 目标

1. 原 `webTools` 20 个工具全部以 LiteLauncher 插件形式实现。
2. 每个工具独立目录、独立执行逻辑、独立面板处理。
3. 统一走 `command:plugin:*` 协议和 `openPanel(panel=plugin)`。
4. 搜索体验、状态提示、键盘行为与 LiteLauncher 主界面一致。
5. 新增 WebTools 能力继续按相同规范接入与回归。

## 3. 当前状态

### 3.1 接入状态

- 原 `webTools` 20 个 `webtools-*` 插件目录已全部建立
- 原 `webTools` 20 个插件已全部注册到主进程插件体系
- 原 `webTools` 20 个插件已全部进入默认可见列表
- 新增 `webtools-file-hash`、`webtools-port-helper` 与 `webtools-image-prompt` 已注册并默认可见
- `webtools-http-mock` 已补齐面板、生命周期动作与主流程 E2E
- `webtools-image-prompt` 已补到 26 类风格预设、12 个智能模板与场景化文字设计输出
- 默认交互和错误链路已统一到主项目规范

### 3.2 当前判断

- 原 `webTools` 迁移接入：完成
- 默认开放：完成
- 功能齐平：进行中
- 新增 WebTools 文案与 E2E：进行中
- 小屏 / 高 DPI 首轮基线：完成
- 小屏 / 高 DPI 第二轮方案：已成文，已把已提交的样式 / 测试增量回填主线，剩余未提交 WIP 待整理
- 渲染壳层收口：本轮已继续删除 `renderer.ts` 内重复的插件 / standalone 旧实现块，插件与 standalone 面板实现统一以 `plugin-panel-impls.ts` 为主，`renderer.ts` 继续保留搜索 / 设置壳层与分发总线
- 渲染层状态 / helper 拆分：进行中（剩余插件 cleanup 已统一下沉到 `plugin-panel-impls`，并已新增 `plugin-runtime-types.d.ts` 承接插件专属类型、继续把 plugin runtime state 从 `renderer.ts` 收口到实现层；`renderer.ts` 继续收尾 generic plugin panel 总线边界）
- 当前重点：功能齐平收敛、交互一致性、小屏适配、自动回归、渲染层拆分

### 3.3 文档与 worktree 备注

- 当前仓库活跃 worktree 只剩 `main`
- 本轮已额外清理磁盘残留目录 `.worktrees/renderer-plugin-state-extraction`；它并不属于 `git worktree list` 中的有效 worktree，删除后当前磁盘与 Git 视角的 worktree 状态已重新一致
- 本轮再次核对前置脚本加载顺序：`src/renderer/index.html` 继续先载入 `plugin-constants.js`、`plugin-static-data.js`、`image-prompt-data.js`、`plugin-handler-config.js`、`plugin-panel-impls.js`，最后才载入 `renderer.js`；后续仍应把插件 / standalone 面板实现留在 `plugin-panel-impls.ts`，把 `renderer.ts` 维持为 orchestrator shell
- 原 `codex/panel-baseline-round2` 里第二轮插件面板高 DPI / 小窗口方案文档已同步到主分支：
  - `docs/superpowers/specs/2026-05-16-plugin-panel-high-dpi-round2-design.md`
  - `docs/superpowers/plans/2026-05-16-plugin-panel-high-dpi-round2.md`
- 已从原分支手工回填到 `main` 的已提交增量包括：
  - `test:e2e:smoke` 纳入 `src/test/e2e-plugin-panel-layout-smoke.test.ts`
  - `CodeAgent Switch` 1180/860 断点顺序修正
  - `e2e-launcher-smoke` 对 `JSON & CSV 实验室` 标题的兼容定位
  - `e2e-plugin-panels-smoke` 的多插件窄窗口覆盖
  - `plugin-panel-impls-regression` 的紧凑布局断言补强
- 已从原 worktree 继续手工回填到 `main` 的低风险未提交增量包括：
  - `Clipboard Workbench` 标题、说明、状态消息与面板可见文案的中文本地化
  - `clipboard-workbench-plugin` / `clipboard-workbench-service` / `plugin-panel-impls-regression` 的定向回归断言补齐
  - `Hardware Inspector` 的运行时状态、格式化 / diff helper、snapshot apply、refresh / export 执行链路下沉到 `plugin-panel-impls`
  - `Image Prompt` 的共享引导常量、默认示例状态与生日示例模板下沉到 `plugin-panel-impls`
  - `Image Base64` 的 round2 头部工具条、预览/编辑双栏、上传按钮、拖拽态、本地文件读取 helper 与对应 smoke / 源码断言
  - `plugin-panel-impls-regression` 现已继续补齐 `ImageBase64 / Config / SQL / QRCode / Markdown / UA / API / Cron / Unit / FileHash / PortHelper / HttpMock / Image Prompt` 的 helper / runtime state 归属护栏
  - 该批次仍严格按串行顺序验证：先 `pnpm run build`，再 `node dist/test/plugin-panel-impls-regression.test.js`
- 当前 `plugin-panel-impls-regression` 已扩展到 53 个子测试，最近一次完成的串行验证保持全绿
- 主线又继续收口了一刀 `renderer.ts` 壳层：`launcher.onOpenPanel(...)` 的内联路由已抽成独立 `handleLauncherOpenPanel(...)` helper，`handleKeydown()` 中 `password / cashflow / plugin` 三段 panel-mode 分支也已抽成 `handlePanelModeKeydown(...)`，并补上源码回归防止这些分发逻辑重新塞回大函数；该批次同样按 `pnpm run build` -> `node dist/test/plugin-panel-impls-regression.test.js` 串行验证通过
- 主线已继续安全回填 `Clipboard Workbench / CodeAgent Switch` 的 Enter 收口与源码回归加固：`Clipboard Workbench` 的 Enter 入口现已统一回到表单 submit 链路，`Clipboard Workbench` / `CodeAgent Switch` 都补上了 Enter -> submit 与 submit -> 面板内部 action 的源码断言，并同步补齐 `Clipboard Workbench` 来源标签的更明确中文文案；该批次同样按 `pnpm run build` -> `node dist/test/plugin-panel-impls-regression.test.js` 串行验证通过
- 主线已继续安全回填 `Colors / QRCode / UA / API / Unit / Strings / URL` 的成熟 round2 面板结构：本批把色板实验室、二维码两栏配置、UA 头部编辑区、API 请求 / 预览 / 响应头壳、单位换算结果卡、字符串分区与中文动作文案，以及 URL 字段标签中文本地化同步到 `plugin-panel-impls` 主线实现，并补齐源码回归护栏；该批次同样按 `pnpm run build` -> `node dist/test/plugin-panel-impls-regression.test.js` 串行验证通过
- 主线已继续安全回填一轮 `renderer.ts` 插件类型 / runtime state 下沉：新增 `src/renderer/plugin-runtime-types.d.ts` 承接 WebTools / Hardware / Cashflow / plugin panel 专属类型，并将 `webtools-password / json / url / diff / timestamp / regex / crypto / jwt / strings / colors` 的 runtime state、默认常量与 `tryParseWebtoolsUrl` 迁入 `src/renderer/plugin-panel-impls.ts`；同时把源码回归扩展到检查这些类型和状态不再回流主渲染文件，该批次按 `pnpm run build` -> `node dist/test/plugin-panel-impls-regression.test.js` 串行验证通过，且后续继续扩展到最近一次完成验证的 52/52 全绿
- 临时 `codex/panel-baseline-reconcile` worktree 仅用于安全回填，任务完成后即可移除
- `codex/panel-baseline-round2` 曾被误删，本轮已先从 branch 重新恢复 worktree，并把归档的 `working-tree.patch` 回灌到恢复现场，复核已提交增量与未提交内容
- `codex/panel-baseline-round2` 与 `main` 的分支历史曾按 `git log --left-right --cherry-pick main...codex/panel-baseline-round2` 互有 6 个独有提交；其中测试/布局侧可用增量已经回填到主线，其余未提交现场经复核主要是已被主线后续修改覆盖或不再保留的 `renderer.ts` / `plugin-panel-impls.ts` / 测试大块 WIP
- 已在 `main` 上补记 merge 关系 `merge: reconcile codex/panel-baseline-round2 into main`，随后再把该 worktree 从 Git / 磁盘两侧移除；最终现场归档仍保留在 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/`
- 当前明确结论：可以删除的“没用 worktree”已经清完；`panel-baseline-round2` 也已按“先恢复核对、再 merge、后删除”的顺序收尾，后续直接在主线上继续收口

## 4. 当前可见 WebTools 插件

1. `webtools-password`
2. `webtools-cron`
3. `webtools-json`
4. `webtools-crypto`
5. `webtools-jwt`
6. `webtools-timestamp`
7. `webtools-regex`
8. `webtools-strings`
9. `webtools-colors`
10. `webtools-diff`
11. `webtools-http-mock`
12. `webtools-image-base64`
13. `webtools-image-prompt`
14. `webtools-config-convert`
15. `webtools-sql-format`
16. `webtools-unit-convert`
17. `webtools-file-hash`
18. `webtools-port-helper`
19. `webtools-url-parse`
20. `webtools-qrcode`
21. `webtools-markdown`
22. `webtools-ua`
23. `webtools-api-client`

## 5. 收敛原则

1. 不再用“已开放”代替“已齐平”。
2. 每个插件至少验证主流程、键盘行为、小屏布局、状态反馈。
3. 新能力接入优先考虑 LiteLauncher 的统一交互，而不是直接复刻旧前端结构。
4. 迭代期优先做源码回归与 `pnpm run build`，smoke / E2E 放到相关批次收尾；凡依赖 `dist` 的定向测试必须在 build 之后串行执行，避免读到旧产物。
5. 先收敛质量，再考虑继续扩展示例和高级能力。
6. 文档口径要跟真实状态同步，不拿“规划中”冒充“已完成”。

## 6. 当前收敛重点

### 6.1 第一优先级

- 继续直接在主线整理 `renderer` / `plugin-panel-impls` / 测试的剩余收口工作；如需追溯旧现场，可查看 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/working-tree.patch`
- 扩展 Playwright UI E2E，优先补高风险插件的真实输入输出断言
- 继续补插件主流程自动回归
- 小屏 / 高 DPI 回归
- 清理新增 WebTools 插件的历史 mojibake 文案

### 6.2 第二优先级

- 拆分 `src/renderer/renderer.ts` 中剩余状态定义与共享边界逻辑
- Markdown 面板 apply/render 已直连 `panelImplsSafe`；插件打开后的 keepOpen 二次刷新已加保护
- 为 `webtools-image-prompt` 补面板级 UI 自动化覆盖
- 收敛 UI 文案与编码问题
- 统一插件公共样式和状态处理

## 7. 下一步建议

1. 继续直接在 `main` 上推进 `renderer.ts` / `plugin-panel-impls.ts` 的剩余收口；如需追溯原 `panel-baseline-round2` 的未提交现场，直接查看 `.codex-recovery/worktree-archives/panel-baseline-round2-20260528-142402/working-tree.patch`。
2. 继续推进插件面板注册器与渲染拆分，当前优先收尾 `renderer.ts` 中剩余的 generic plugin panel 打开 / 渲染 / Enter 分发总线，再继续压平共享状态边界。
3. 逐项回填 `docs/webtools-parity-checklist.md` 的齐平状态。
4. 为图片提示词、文件哈希、端口助手补更完整的 UI 自动化或边界断言。
