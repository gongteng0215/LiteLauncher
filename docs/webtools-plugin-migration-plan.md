# WebTools 插件迁移计划（LiteLauncher）

更新时间：2026-03-29
状态：迁移接入完成，进入功能齐平与收敛阶段

## 1. 背景

原 `webTools` 项目功能完整，但和 LiteLauncher 在架构、交互和视觉上不一致。迁移策略不是“整包搬运”，而是按 LiteLauncher 插件规范逐个落地。

## 2. 目标

1. 20 个工具全部以 LiteLauncher 插件形式实现。
2. 每个工具独立目录、独立执行逻辑、独立面板处理。
3. 统一走 `command:plugin:*` 协议和 `openPanel(panel=plugin)`。
4. 搜索体验、状态提示、键盘行为与 LiteLauncher 主界面一致。

## 3. 当前状态

### 3.1 接入状态

- 20 个 `webtools-*` 插件目录已全部建立
- 20 个插件已全部注册到主进程插件体系
- 20 个插件已全部进入默认可见列表
- 默认交互和错误链路已统一到主项目规范

### 3.2 当前判断

- 迁移接入：完成
- 默认开放：完成
- 功能齐平：进行中
- 当前重点：交互一致性、小屏适配、自动回归、渲染层拆分

## 4. 当前可见插件

1. `webtools-password`
2. `webtools-cron`
3. `webtools-json`
4. `webtools-crypto`
5. `webtools-jwt`
6. `webtools-timestamp`
7. `webtools-strings`
8. `webtools-colors`
9. `webtools-diff`
10. `webtools-http-mock`
11. `webtools-image-base64`
12. `webtools-config-convert`
13. `webtools-sql-format`
14. `webtools-unit-convert`
15. `webtools-regex`
16. `webtools-url-parse`
17. `webtools-qrcode`
18. `webtools-markdown`
19. `webtools-ua`
20. `webtools-api-client`

## 5. 收敛原则

1. 不再用“已开放”代替“已齐平”。
2. 每个插件至少验证主流程、键盘行为、小屏布局、状态反馈。
3. 新能力接入优先考虑 LiteLauncher 的统一交互，而不是直接复刻旧前端结构。
4. 先收敛质量，再考虑继续扩展示例和高级能力。

## 6. 当前收敛重点

### 6.1 第一优先级

- 扩展 Playwright UI E2E
- 继续补插件主流程自动回归
- 小屏 / 高 DPI 回归

### 6.2 第二优先级

- 拆分 `src/renderer/renderer.ts` 中的插件面板逻辑
- 收敛 UI 文案与编码问题
- 统一插件公共样式和状态处理

## 7. 下一步建议

1. 给 `API 调试`、`二维码生成`、`配置转换` 补 UI E2E。
2. 继续推进插件面板注册器与渲染拆分。
3. 逐项回填 `docs/webtools-parity-checklist.md` 的齐平状态。