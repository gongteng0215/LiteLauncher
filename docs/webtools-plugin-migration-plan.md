# WebTools 插件迁移计划（LiteLauncher）

更新时间：2026-03-08
状态：进行中

## 1. 背景

`webTools` 原项目功能完整，但与 LiteLauncher 在架构、交互和视觉上不一致。
迁移策略不是“整包搬运”，而是按 LiteLauncher 插件规范逐个落地。

## 2. 目标

1. 19 个工具全部以 LiteLauncher 插件形式实现。
2. 每个工具独立目录、独立执行逻辑、独立面板处理。
3. 统一走 `command:plugin:*` 协议和 `openPanel(panel=plugin)`。
4. 保持主界面搜索与插件体验一致。

## 3. 当前进展

### 3.1 架构进展

- 已创建 19 个 `webtools-*` 插件目录（主进程层）。
- 已接入统一插件索引与执行分发。
- 已启用插件面板模式 `panel=plugin`。
- 已接入统一状态提示与错误日志基线。

### 3.2 可见插件（已对外开放）

1. `webtools-password`
2. `webtools-cron`
3. `webtools-json`
4. `webtools-crypto`
5. `webtools-jwt`

### 3.3 隐藏插件（暂不对外）

1. `webtools-timestamp`
2. `webtools-regex`
3. `webtools-strings`
4. `webtools-colors`
5. `webtools-diff`
6. `webtools-image-base64`
7. `webtools-config-convert`
8. `webtools-sql-format`
9. `webtools-unit-convert`
10. `webtools-url-parse`
11. `webtools-qrcode`
12. `webtools-markdown`
13. `webtools-ua`
14. `webtools-api-client`

## 4. 迁移原则

1. 先保证功能闭环，再开放可见。
2. 先统一交互和样式，再做高级能力。
3. 小步提交，每个插件都可独立回归。
4. 不引入第二套前端框架运行时。

## 5. 分阶段任务

### 阶段 A：基础设施（进行中）

- `WTM-001` 插件面板注册器继续收敛（减少 renderer 硬编码）
- `WTM-002` 插件 UI 公共样式与组件抽取
- `WTM-003` 插件配置持久化约定统一
- `WTM-004` 插件 Enter/Esc 行为一致性校验

### 阶段 B：已开放插件完善（持续优化）

- `WTM-101` 密码工具：基础闭环已完成，继续补齐旧版剩余体验细节
- `WTM-102` Cron 工具：默认示例与自动解析已落地，补小屏回归
- `WTM-103` JSON 工具：自动转换与默认示例已落地，继续收敛布局
- `WTM-104` 加密工具：主要能力已完成，继续补交互细节与回归
- `WTM-105` JWT 工具：JWS/JWE 基础闭环已完成（当前 JWE 仅 `dir`）

### 阶段 C：隐藏插件逐批开放（待办）

- C1（高频）：`timestamp`、`regex`、`url-parse`、`qrcode`
- C2（中频）：`diff`、`strings`、`sql-format`、`unit-convert`
- C3（进阶）：`markdown`、`ua`、`api-client`、`config-convert`、`image-base64`、`colors`

### 阶段 D：质量与发布（待办）

- `WTM-401` 6 个已开放插件自动回归脚本
- `WTM-402` 小屏与高 DPI 布局专项回归
- `WTM-403` 插件性能基线（打开耗时、执行耗时）
- `WTM-404` 文档与截图统一更新

## 6. 验收标准

1. 插件可通过搜索命中并打开。
2. Enter/Esc 行为符合统一规范。
3. 状态提示完整，错误可解释，并接入统一错误日志。
4. 小屏与常规窗口无关键布局错乱。
5. `pnpm run build` 和基础回归通过。

## 7. 当前风险

1. 渲染层单文件体量较大，后续维护成本高。
2. 少量历史字符串存在编码风险，需要持续巡检。
3. 小屏场景的插件布局稳定性仍需加强。

## 8. 下一步（建议执行顺序）

1. 优先推进 C1：开放 `timestamp`、`regex`、`url-parse`、`qrcode`。
2. 补 `WTM-401` + `WTM-402`：先把当前已开放插件与小屏场景回归跑通。
3. 完成 `WTM-001`：继续拆分 renderer 插件面板逻辑。
