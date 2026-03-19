# LiteLauncher 工作记录

更新时间：2026-03-19

## 最近完成
- 新增 `test:e2e:smoke`，使用 Playwright 跑通“启动窗口 -> 设置页 -> 搜索并打开 JSON 插件”的第一版 UI 冒烟。

- 增加开发模式 `pnpm dev`：自动编译、主进程自动重启、渲染层自动刷新。
- 启动链路支持 `--replace-instance`，避免旧 Electron 主进程残留导致代码不生效。
- 搜索链路补齐 Windows 命令 / StartApps / WindowsApps 应用支持，典型场景：`codex`。
- `Codex` 结果改成真实应用项，补齐真实图标路径、结果去重和 AppsFolder 启动链路。
- 新增 `test:windows-alias`，覆盖 `codex` 的 catalog / dynamic search / AppsFolder 启动回归。
- 新增 `test:main-flow`，覆盖“搜索命中设置/插件 -> 执行打开面板”的主流程回归。
- 新增 `test:regression` 聚合脚本，统一跑搜索/主流程/Windows 别名/路径规则/插件可见性回归。
- 前移 `API 调试`、`配置转换`、`SQL 格式化`、`二维码生成` 的小屏关键断点，缓解中等宽度下的挤压问题。
- 图标链路补齐静态图片文件直接转 `data:image/*`，解决 WindowsApps PNG 图标无法显示的问题。
- 插件原生交互期间暂停自动隐藏，覆盖图片选择、二维码下载、图片下载等动作。
- 多行输入统一为：`Enter` 换行、`Ctrl+Enter` 执行、`Esc` 返回。
- `webtools-qrcode` 补齐颜色配置、图片/文字 Logo 和下载行为收口。
- `webtools-markdown` 补齐实时预览、HTML 输出与复制按钮。
- `webtools-api-client` 补齐结构化参数/请求头/请求体切换、响应体/响应头标签页。
- `webtools-ua` 修正 CPU 字段含义，改为“CPU 架构”。
- `webtools-config-convert`、`webtools-sql-format`、`webtools-diff` 等插件继续收口布局和状态提示。
- 统一文档体系重新对齐当前实现状态。

## 当前版本基线

- 应用版本：`v1.0.11`
- 可见插件数量：默认 20（可在设置页按插件 ID 配置）
- 已开放 WebTools 插件数量：19
- 已接入 WebTools 目录数量：19
- 运行命令统一：`pnpm`
- 开发模式：`pnpm dev`
- 设置页已完成分组化
- 搜索索引已支持可配置扫描源与重建
- 搜索索引已支持排除目录
- 搜索结果已支持目录白名单/黑名单过滤
- 错误日志已可在设置页查看与清空
- Windows 应用别名（如 `codex`）已支持搜索与启动

## 已知待处理

1. 小窗口下个别插件布局仍需逐项回归。
2. 渲染层插件逻辑仍集中在 `renderer.ts`，拆分压力还在。
3. WebTools 迁移数量目标已完成，后续重点转为功能齐平、小屏适配、自动回归与逻辑拆分。
4. 搜索扫描规则仍可继续细化（黑名单 / 白名单 / 目录优先级）。
5. Windows 命令 / StartApps / WindowsApps 搜索需要补自动化回归用例。

## 下个迭代建议

1. 补齐插件面板小屏回归与搜索/设置页 E2E。
2. 继续拆分 `renderer.ts` 中的插件面板逻辑。
3. 继续巡检 UI 文案与历史编码风险。
4. 推进 Cashflow `cash review` 复盘模块。
5. 补 `codex` / Windows 应用别名搜索与执行回归测试。
