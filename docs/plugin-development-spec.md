# LiteLauncher 插件开发规范

## 1. 目标

本规范用于统一 LiteLauncher 插件的开发方式，保证以下目标：

1. 插件形态一致：目录结构、接口定义、交互方式统一。
2. 用户体验一致：搜索命中、图标、状态提示、键盘行为一致。
3. 质量可控：插件可测试、可回归、可持续迭代。

## 2. 目录与命名

每个插件必须单独目录，不允许多个插件混在一个文件：

1. 主入口：`src/main/plugins/<plugin-id>/index.ts`
2. `plugin-id` 规则：小写 + 中划线，例如 `webtools-password`
3. 导出命名：`<camelName>Plugin`，例如 `webtoolsPasswordPlugin`

插件统一在 `src/main/plugins/index.ts` 注册，按业务优先级排序。

## 3. 插件接口（Main 进程）

插件必须实现 `LauncherPlugin`：

1. `id`: 全局唯一
2. `name`: 用于内部标识
3. `createCatalogItems()`: 返回空输入时展示的入口项
4. `getQueryItems(query)`: 返回命中的动态候选项
5. `execute(optionsText, context)`: 执行动作，返回 `ExecuteResult`

## 4. LaunchItem 约束

每个插件候选项（`LaunchItem`）必须满足：

1. `id` 稳定且唯一（建议包含插件 id 与参数摘要）
2. `type` 固定为 `command`
3. `target` 统一格式：`command:plugin:<plugin-id>?action=<action>&...`
4. `title`/`subtitle` 必须为中文用户可读文本
5. `keywords` 必须覆盖中文关键词 + 常见英文别名
6. `iconPath` 优先提供（data URL 或有效路径）

## 5. 执行动作设计

每个插件至少支持一个动作：

1. `open`: 打开插件面板

按需支持更多动作（例如 `generate`、`convert`、`parse`）：

1. 动作参数使用 query string 传递
2. `execute` 中必须校验参数并做边界处理
3. 无效动作返回 `ok: false` 且给出明确错误信息

## 6. Renderer 面板协议

打开插件面板统一通过：

1. `IPC_CHANNELS.openPanel`
2. payload 格式：
   - `panel: "plugin"`
   - `pluginId: string`
   - `title?: string`
   - `subtitle?: string`
   - `message?: string`
   - `data?: Record<string, unknown>`

渲染层通过 `pluginId` 分发到对应面板渲染器，不允许在 Main 进程拼装 HTML。

## 7. UI 与交互规范

1. Enter：执行当前面板主动作
2. Esc：返回搜索
3. 面板状态文案使用中文，禁止乱码
4. 执行成功/失败必须调用 `setStatus` 给出反馈
5. 长列表结果必须可滚动，重要操作提供按钮（如“复制”）

## 8. 搜索与匹配规范

1. 至少支持：
   - 插件英文别名（如 `wt-pass`）
   - 中文关键字（如 `密码`）
2. 匹配策略：
   - 精确命中优先
   - 前缀命中次之
   - 无意义长串不得误命中
3. 动态候选项需要反映关键参数（长度、数量、是否含符号等）

## 9. 图标规范

1. 每个插件必须有可识别图标，不允许长期使用 `CM` 占位
2. 同一插件在目录入口与搜索结果图标保持一致
3. 图标生成策略需可复用（建议共享工具函数）

## 10. 稳定性与错误处理

1. 参数缺失、类型错误、越界值必须兜底
2. 外部依赖不可用时提供可理解错误提示
3. `execute` 禁止抛未捕获异常到上层

## 11. 测试与验收清单

每个插件至少通过以下检查：

1. 能在空输入插件区展示
2. 关键词检索可命中
3. Enter 可执行主动作
4. Esc 可返回搜索
5. 成功/失败状态提示正确
6. 图标正确显示
7. `pnpm run build` 无报错

## 12. WebTools 19 插件迁移要求

对于 `webtools-*` 系列插件，必须满足：

1. 保持 LiteLauncher 原生插件架构（不直接嵌回原项目页面）
2. 功能与 webTools 对应工具等价，不做删减
3. 每个工具独立面板与执行逻辑
4. 公共逻辑沉淀到 shared（参数解析、状态提示、图标、复制等）
5. 按工具逐个交付并可回归验证
