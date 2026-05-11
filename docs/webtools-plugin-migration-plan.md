# WebTools 插件迁移计划（LiteLauncher）

更新时间：2026-05-12
状态：原 `webTools` 迁移接入完成，新增 WebTools 能力进入收敛阶段

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
- 默认交互和错误链路已统一到主项目规范

### 3.2 当前判断

- 原 `webTools` 迁移接入：完成
- 默认开放：完成
- 功能齐平：进行中
- 新增 WebTools 文案与 E2E：进行中
- 当前重点：交互一致性、小屏适配、自动回归、渲染层拆分

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
4. 先收敛质量，再考虑继续扩展示例和高级能力。

## 6. 当前收敛重点

### 6.1 第一优先级

- 扩展 Playwright UI E2E，优先补高风险插件的真实输入输出断言
- 继续补插件主流程自动回归
- 小屏 / 高 DPI 回归
- 清理新增 WebTools 插件的历史 mojibake 文案

### 6.2 第二优先级

- 拆分 `src/renderer/renderer.ts` 中剩余执行 helper 与共享状态逻辑
- Markdown 面板 apply/render 已直连 `panelImplsSafe`；插件打开后的 keepOpen 二次刷新已加保护
- 收敛 UI 文案与编码问题
- 统一插件公共样式和状态处理

## 7. 下一步建议

1. 做插件面板高 DPI 专项回归，补更细的截图 / 布局断言。
2. 继续推进插件面板注册器与渲染拆分，收敛 `renderer.ts` 剩余执行 helper 与共享状态。
3. 逐项回填 `docs/webtools-parity-checklist.md` 的齐平状态。
