# LiteLauncher 工作记录

更新时间：2026-03-29

## 最近完成

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

## 当前版本基线

- 应用版本：`v1.0.12`
- 默认可见插件数量：21
- 已开放 WebTools 插件数量：20
- 开发模式：`pnpm dev`
- 完整回归入口：`pnpm run test:regression:full`
- Windows 应用别名（如 `codex`）已支持搜索与启动

## 当前主要风险

1. 插件面板的小窗口与高 DPI 布局还没有逐项完全回归。
2. 渲染层插件逻辑仍然集中在 `src/renderer/renderer.ts`。
3. 部分 WebTools 插件虽然可用，但还没有完全达到原版交互齐平。
4. 仍有历史 UI 文案和编码问题需要持续清理。
5. Cashflow `cash review` 复盘能力还未真正落地。

## 下一步建议

1. 继续扩展 Playwright UI 回归，补齐剩余 WebTools 插件并完善失败定位日志。
2. 继续拆分 `src/renderer/renderer.ts` 中的剩余插件面板逻辑。
3. 做一次插件面板小屏 / 高 DPI 专项回归。
4. 推进 Cashflow `cash review` 复盘模块。
5. 做一次全仓 UI 文案与编码巡检。
