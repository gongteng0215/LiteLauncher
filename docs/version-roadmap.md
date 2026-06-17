# LiteLauncher 版本路线图（v1.0.25+）

更新时间：2026-06-17

当前线上版本：`v1.0.25`

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

## v1.0.26 候选方向

推荐下一版做“可见体验和诊断收口”，不要同时塞太多新能力。

优先候选：

- 自动更新端到端验证：把“检查更新、下载完成、立即安装并重启、退出自动安装”的真实路径再补一轮操作日志和测试记录。
- 设置页诊断体验：把更新状态、置顶失败、启动置顶失败、错误日志复制入口整理成更容易排查的一组信息。
- CodeAgent Switch 小收口：只做真实 UI 复核、配置名/来源/Key 状态文案和窄宽度布局，不继续扩大配置字段范围。
- UI 文案与编码巡检：继续扫历史面板里还可能出现的乱码、错别字和按钮语义不一致。

可选但建议后置：

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

1. 发布后立刻用线上 `v1.0.24` 客户端检查 `v1.0.25`，确认自动更新能发现并下载。
2. 再开 `v1.0.26`，优先做自动更新端到端验证和设置页诊断收口。
3. 新功能继续压后，等稳定性和诊断链路更踏实之后再挑一个小插件落地。
