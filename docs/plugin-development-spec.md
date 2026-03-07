# LiteLauncher 插件开发规范

更新时间：2026-03-08
适用版本：LiteLauncher `v1.0.8`

## 1. 目标

本规范用于统一 LiteLauncher 插件开发方式，确保：

1. 结构统一：目录、接口、命令协议一致。
2. 体验一致：搜索命中、面板行为、状态提示一致。
3. 质量可控：插件可测试、可灰度、可回归。

## 2. 目录与命名

每个插件必须独立目录，不允许多个插件写在同一文件。

- 主进程入口：`src/main/plugins/<plugin-id>/index.ts`
- `<plugin-id>` 规则：小写+中划线，例如 `webtools-jwt`
- 导出命名：`<camelName>Plugin`，例如 `webtoolsJwtPlugin`

插件统一在 `src/main/plugins/index.ts` 注册。

## 3. 主进程接口约束

插件必须实现 `LauncherPlugin`：

- `id`：全局唯一
- `name`：插件展示名
- `createCatalogItems()`：空输入时的插件入口项
- `getQueryItems(query)`：查询命中的动态项
- `execute(optionsText, context)`：执行入口，返回 `ExecuteResult`

## 4. LaunchItem 约束

- `id`：稳定且唯一
- `type`：插件命令统一用 `command`
- `target`：统一协议
  - `command:plugin:<plugin-id>?action=<action>&...`
- `title` / `subtitle`：必须可读，优先中文
- `keywords`：覆盖中文关键词 + 英文别名
- `iconPath`：提供有效图标（`data:` 或本地路径）

## 5. 命令协议

### 5.1 目标格式

```text
command:plugin:<plugin-id>?action=<action>&k=v...
```

### 5.2 动作建议

- 必须支持：`open`（打开面板）
- 按需支持：`parse`、`generate`、`convert`、`verify` 等

### 5.3 参数处理

- 在 `execute` 内做完整参数校验
- 参数非法时返回：`ok: false` + 明确错误文案
- 禁止把未捕获异常抛到上层

## 6. 面板协议（Renderer）

打开插件面板统一走 `IPC_CHANNELS.openPanel`：

```ts
{
  panel: "plugin",
  pluginId: string,
  title?: string,
  subtitle?: string,
  message?: string,
  data?: Record<string, unknown>
}
```

渲染层通过 `pluginId` 分发处理器，不新建独立 `BrowserWindow`。

如果插件存在默认示例、默认表达式或默认参数，面板打开后应自动完成首轮渲染，
避免用户进入后看到空白结果区。

## 7. 交互规范

- `Enter`：执行当前插件主动作
- `Esc`：返回搜索页
- 关键结果必须通过状态栏提示成功/失败
- 耗时动作必须提供加载态或处理中反馈
- 默认示例型插件应在进入面板后自动给出首屏结果
- 长结果区可滚动，关键操作提供按钮（如复制）

## 8. 搜索规范

- 至少支持：
  - 英文别名（示例：`wt-jwt`）
  - 中文关键词（示例：`加密`、`密码`）
- 匹配优先级：精确 > 前缀 > 受限模糊
- 长串随机输入不应产生大量误命中

## 9. 图标规范

- 每个插件必须有可识别图标
- 目录入口与搜索结果图标保持一致
- 同类插件建议使用统一尺寸与视觉风格

## 10. 状态与错误处理

- 输入为空：返回可理解提示，不应报错崩溃
- 参数越界：兜底到合法值或提示错误
- 外部依赖异常：给出明确文案并保持面板可继续操作
- 未捕获异常必须进入统一错误日志链路
- 系统能力调用必须返回精确结果，至少区分成功 / 取消 / 失败

## 11. 测试与验收清单

每个插件至少通过以下检查：

1. 空输入下可在插件分区显示。
2. 关键词搜索可命中。
3. `Enter` 可执行主动作。
4. `Esc` 可返回搜索页。
5. 状态提示正确。
6. 图标显示正确。
7. 小屏窗口无关键布局错乱。
8. `pnpm run build` 通过。

## 12. WebTools 系列额外要求

针对 `webtools-*` 插件：

1. 保持 LiteLauncher 原生插件结构，不直接嵌回旧页面。
2. 功能目标与原工具等价，不做功能删减。
3. 每个工具独立模块，禁止“19 工具堆一个文件”。
4. 公共逻辑沉淀到共享模块（参数解析、图标、状态处理）。
5. 迁移完成前默认隐藏，质量通过后再开放可见。
