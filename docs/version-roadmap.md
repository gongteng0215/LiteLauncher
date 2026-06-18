# LiteLauncher 版本路线图（v1.0.25+）

更新时间：2026-06-18

当前线上版本：`v1.0.26`

## 规划原则

- 优先修复用户已经遇到的问题，再补体验，再做新增能力。
- 每一版保持“够用但不贪多”：一版最好围绕 2-4 个明确主题收口。
- 依赖 `dist` 产物的验证一律按“先 `pnpm run build`，再串行跑 `node dist/test/...`”执行。
- 自动更新和发布链路每一版都要保留可复核的发布日志、Release 资产和客户端检查结果。

## v1.0.25 稳定性补漏版

目标：把 `v1.0.24` 发布后的两个真实使用问题收口成一版小而稳的补丁版，并顺带补齐文档和发布日志。

本版建议范围：

- 修复设置页自动更新说明渲染：GitHub Release 返回的 HTML 更新日志不再以 `<h1>` / `<ul>` / `<code>` 原始标签显示，改为受限富文本渲染并保持紧凑样式。
- 修复动态应用置顶：`Codex` 这类 Windows Store / StartApps / PATH alias 动态解析结果，在置顶保存后不再被 catalog 清洗误判为“当前结果已过期”。
- 补齐置顶和更新说明的源码回归测试，防止后续回退到纯文本渲染或只认静态 catalog ID。
- 更新文档、任务清单和 `v1.0.25` 发布日志草稿。

本版明确不做：

- 新增大型插件。
- 重做 CodeAgent Switch 主界面。
- 大规模拆 `renderer.ts`。
- Cashflow `cash review` 正式实现。

本版发布门槛：

- `pnpm run build`
- `node dist/test/search-section-grid-style.test.js`
- `node dist/test/app-updater-source.test.js`
- `node dist/test/launcher-main-flow-regression.test.js`
- `node dist/test/windows-app-alias-regression.test.js`
- `node dist/test/renderer-pinning-regression.test.js`
- `node dist/test/renderer-pinning-status.test.js`
- `pnpm run check:encoding`
- 发版前至少做一次 Windows NSIS 安装版自动更新检查，确认能从 `v1.0.24` 发现 `v1.0.25`。

## v1.0.26 收口版

目标：把 `v1.0.25` 之后已经完成的稳定性和可见体验改动整理成一版可直接发布的收口版，继续优先修真实使用链路，而不是继续扩功能面。

本版建议范围：

- 自动更新真实链路补证：保留从线上 `v1.0.24` 客户端检查到 `v1.0.25`、读取发布日志、下载完成的端到端验证记录，并补齐配套 E2E 工具能力。
- 设置页诊断收口：更新卡片展示当前版本、目标版本、自动更新开关、最近阶段和诊断信息；错误日志区补“复制日志”，置顶失败与窗口置顶异常优先显示为摘要卡。
- 面板失焦策略收口：`plugin / settings / cashflow` 改为失焦不自动隐藏，仅通过 `Esc`、返回按钮或显式隐藏流程退出；`search / clip` 继续保持 launcher 式失焦隐藏。
- 针对上述行为补齐源码护栏和真实 blur smoke，避免 E2E 因测试环境短路而出现假阳性。

本版明确不做：

- 新增大型插件。
- 扩大 CodeAgent Switch 配置字段范围。
- 大规模拆 `renderer.ts`。
- Cashflow `cash review` 正式实现。

本版发布门槛：

- `pnpm run build`
- `node dist/test/renderer-error-log-source.test.js`
- `node dist/test/search-section-grid-style.test.js`
- `node dist/test/e2e-settings-error-log-smoke.test.js`
- `node dist/test/e2e-test-utils-source.test.js`
- `node dist/test/e2e-launcher-smoke.test.js`
- 至少复核一次 GitHub Release 资产与自动更新元数据完整性

后置候选：

- CodeAgent Switch 小范围 UI 复核与历史文案巡检。
- `JSON Schema Validator` MVP。
- `SQLite` 只读浏览 MVP。
- `Regex Explain` 或 `Cron` 增强二选一。
- Cashflow `cash review`。

## v1.0.27+ 候选池

- OpenAPI 快速客户端生成。
- 环境变量 / Secret 小工具。
- 批量请求执行器。
- TLS / 证书检查器。
- Clipboard Workbench 后续增强。
- macOS 签名、公证和 `.icns` 图标补齐。

## 当前建议执行顺序

1. 先整理并发布 `v1.0.26` 收口版，带上设置页诊断、面板失焦策略和自动更新验证记录。
2. 发版后优先用真实客户端复核一次检查更新链路和 Release 资产完整性。
3. 新功能继续压后，等稳定性和诊断链路更踏实之后再挑一个小插件落地。
