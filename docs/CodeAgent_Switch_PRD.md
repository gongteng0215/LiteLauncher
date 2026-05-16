# CodeAgent Switch LiteLauncher 插件 PRD

> 版本：V1.2  
> 日期：2026-05-12  
> 文档类型：LiteLauncher 插件产品需求文档  
> 插件名称：CodeAgent Switch  
> 建议插件 ID：`codeagent-switch`  
> 首期重点：Codex 配置读取、Provider/Profile 预设管理、配置诊断、安全切换  
> 后续扩展：Claude Code、Gemini CLI、OpenCode、OpenClaw 等 AI 编程工具配置管理

> 当前实现状态：已接入 LiteLauncher 默认可见插件，支持读取 Codex `config.toml`、展示 Provider / Profile / 模型摘要、配置诊断、环境变量命令复制、Profile 切换 diff 预览、备份后安全写入、备份列表与恢复；当前配置会在列表和详情页中明确标注，Profile 行与详情页顶部都提供“预览 / 设为当前”入口，切换只更新 Codex 新版顶层 `profile` 字段，并清理根部重复模型字段，具体 Provider / 模型 / reasoning 参数保留在 `[profiles.xxx]` 模板段；Provider 新增会自动生成 ID、显示名称和 `env_key` 名称，API Key 可直接写入 Windows 用户级系统环境变量，也可复制命令备选，但不会写入配置或插件状态；已按官方 Codex 配置参考补齐 Provider 高级字段、Profile 高级模型字段和运行权限字段的编辑与保存。

---

## 1. 一句话定位

**CodeAgent Switch 是 LiteLauncher 内置的 AI 编程助手配置切换插件，用于在一个本地面板里安全管理 Codex 的 Provider、中转站、模型、Profile、环境变量提示、配置诊断、备份与切换。**

它不替代 Codex，也不代理模型请求。它解决的是用户手动维护多份 `config.toml` 时的混乱：

- 多个中转站、多个模型、多个 Key 环境变量不好记；
- 不清楚当前 Codex 到底使用哪个 Provider；
- `env_key`、`requires_openai_auth`、`auth.json` 的关系容易混淆；
- 手动复制 `config.toml` 容易写坏 TOML；
- 切换 Provider / Base URL 后，Codex 桌面版、IDE 扩展或 CLI 的会话表现可能不同；
- 需要一个 LiteLauncher 里随手打开的配置检查和切换入口。

---

## 2. 关键定位

本插件只做**本地配置管理**，不做会话迁移和模型调用。

插件必须在首页、切换确认弹窗和切换结果里明确提示：

> 切换 Provider / Base URL / 认证方式后，Codex 桌面版、IDE 扩展或 CLI 中看到的会话可能发生变化。CodeAgent Switch 只切换配置，不合并、不迁移、不修改历史会话。

MVP 只承诺支持 Codex 用户级配置：

```text
~/.codex/config.toml
```

项目级配置仅做检测与风险提示：

```text
<project>/.codex/config.toml
```

如果后续要管理 Claude Code / Gemini CLI，必须通过独立 Adapter 接入，不把多工具逻辑堆进 Codex 实现里。

---

## 3. LiteLauncher 插件形态

### 3.1 插件入口

- 主进程目录：`src/main/plugins/codeagent-switch/index.ts`
- 渲染面板：`src/renderer/plugin-panel-impls.ts`
- 面板分发：`src/renderer/plugin-handler-config.ts`
- 共享逻辑：`src/shared/codeagent-switch/`
- 插件注册：`src/main/plugins/index.ts`
- 可见插件迁移：`src/main/index.ts` 的默认可见插件列表和必显迁移列表
- 回归测试：`src/test/codeagent-switch-*.test.ts`

### 3.2 命令协议

插件统一走 LiteLauncher 现有协议：

```text
command:plugin:codeagent-switch?action=open
command:plugin:codeagent-switch?action=read
command:plugin:codeagent-switch?action=diagnose
command:plugin:codeagent-switch?action=preview&profile=<profile-id>
command:plugin:codeagent-switch?action=apply&profile=<profile-id>
command:plugin:codeagent-switch?action=backups
command:plugin:codeagent-switch?action=restore&backup=<backup-id>
```

所有动作都必须在插件内部校验参数。非法参数返回 `ok: false` 和明确中文错误，不让异常冒泡到主搜索链路。

### 3.3 搜索关键词

目录入口：

- 标题：`CodeAgent Switch`
- 副标题：`Codex 配置切换、Provider 管理、Profile 诊断`
- 关键词：`codex`、`codeagent`、`switch`、`provider`、`profile`、`config`、`toml`、`中转站`、`模型切换`、`配置诊断`、`AI 编程`

动态搜索建议：

- 输入 `codex`：打开插件首页；
- 输入 `codex relay`：展示最近使用的中转站预设；
- 输入 `codex doctor`：直接打开诊断页；
- 输入 `codex profile`：直接打开 Profile 列表；
- 输入 `codex config`：打开配置预览页。

### 3.4 是否默认可见

首版建议默认可见，但必须满足：

1. `src/main/plugins/index.ts` 注册 `codeagent-switch`；
2. `DEFAULT_VISIBLE_PLUGIN_IDS` 包含 `codeagent-switch`；
3. `CURRENT_DEFAULT_VISIBLE_PLUGIN_IDS` 包含 `codeagent-switch`；
4. 如希望老用户升级后自动出现，`REQUIRED_VISIBLE_PLUGIN_IDS` 也要包含 `codeagent-switch`；
5. `test:plugins-visible` 覆盖目录入口、搜索命中、Enter 打开面板。

---

## 4. 用户与场景

### 4.1 核心用户

- 使用 Codex CLI / 桌面版 / IDE 扩展的开发者；
- 有多个 OpenAI-compatible 中转站的用户；
- 经常切换 `model_provider`、`base_url`、`model`、`reasoning_effort` 的用户；
- 不想手动维护多份 `config.toml` 的用户；
- 不清楚 `env_key` 和 OpenAI 登录态区别的用户。

### 4.2 典型场景

场景 A：两个中转站快速切换  
用户有 Relay 1 和 Relay 2，希望从 LiteLauncher 打开插件，选择 Relay 2，看到 diff，确认后备份并写入 `~/.codex/config.toml`。写入范围只包含顶层 `profile = "<profile-id>"`，并会移除旧配置根部重复的 `model_provider`、`model`、`review_model`、`model_reasoning_effort` 等模板字段；实际 Provider、模型和 reasoning 参数由 `[profiles.xxx]` 预设段统一承载。

场景 B：诊断认证方式  
用户不知道配置里同时出现 `env_key` 和 `requires_openai_auth` 是否合理。插件给出诊断：中转站 API Key 模式推荐使用 `env_key`，OpenAI 登录态模式使用 `requires_openai_auth`，同一个 Provider 不建议混用。

场景 C：项目级配置覆盖  
用户当前打开了某个项目目录，项目里有 `.codex/config.toml`。插件提示项目级配置可能覆盖用户级配置，并在切换前显示风险。

场景 D：配置 Key  
用户不想手动维护 `env_key` 名称，也不希望插件保存真实 Key。插件按 Provider ID 或 Base URL 自动生成 `CODEAGENT_<PROVIDER>_API_KEY`，用户只在 Key 设置区临时粘贴 API Key，插件直接写入 Windows 用户级系统环境变量并同步当前进程环境；复制 PowerShell 命令作为备选，保存 Provider 时只写入变量名。

场景 E：解释会话变化  
切换 Provider 后用户发现会话列表不一样。插件解释这是配置上下文变化的正常风险，不承诺会话共用。

---

## 5. 非目标

MVP 阶段不做：

1. 不合并 Codex 会话；
2. 不修改 Codex 历史记录；
3. 不读取或修改 `auth.json` 敏感内容；
4. 不读取用户项目源码；
5. 不保存明文 API Key；
6. 不上传任何配置；
7. 不做代理转发服务；
8. 不内置中转站账号；
9. 不调用模型生成内容；
10. 不承诺所有中转站兼容 Codex Responses API；
11. 不做托盘常驻切换；
12. 不在 MVP 管理 Claude / Gemini；
13. 不做完整 SQLite 配置中心；
14. 不做 VSCode 扩展或独立桌面应用。

---

## 6. 功能范围

### 6.1 MVP 功能

| 模块 | MVP | 说明 |
|---|---:|---|
| Codex 配置读取 | 是 | 读取并解析用户级 `~/.codex/config.toml` |
| 配置路径展示 | 是 | 显示 Windows / macOS / Linux 实际路径 |
| Provider 识别 | 是 | 识别 `[model_providers.<id>]` |
| Profile 识别 | 是 | 识别 `[profiles.<name>]`，并提示 IDE 扩展兼容风险 |
| 本地预设管理 | 是 | 保存 LiteLauncher 管理的 Provider/Profile 预设 |
| 切换前 diff | 是 | 写入前展示顶层 `profile` 变更，以及会被清理的根部重复模型字段 |
| 安全写入 | 是 | 当前已支持 Profile 切换的备份、临时文件、替换、重读校验；更细的失败自动回滚后续补齐 |
| 备份列表 / 恢复 | 是 | 只列出插件创建的备份；恢复前会先备份当前配置 |
| 配置诊断 | 是 | 缺失 Provider、认证冲突、env 不存在、项目级覆盖等 |
| 环境变量写入 | 是 | 直接写入 Windows 用户级环境变量，并同步当前进程环境 |
| 环境变量命令 | 是 | 保留复制命令备选，不保存真实 Key |
| 复制反馈 | 是 | 复制命令、复制 Key 设置命令、复制诊断、复制 diff 都有状态提示 |
| 当前配置标注 | 是 | Profile 列表、Provider strip、当前配置卡和详情页都区分 selected / active |
| 快速切换入口 | 是 | Profile 行与详情页顶部都可“预览 / 设为当前”，当前 Profile 显示为禁用状态 |
| 自动命名 | 是 | 新增 Provider 自动预填不冲突 ID，Base URL 可联动生成 ID、显示名称和 `env_key` 名称 |

### 6.2 V0.2 功能

- 导入旧 `config.toml` 为预设；
- 高级字段保留写入增强；
- Profile 快速模板；
- compact / reasoning 推荐；
- 当前项目目录选择与项目级配置预览；
- 更细的中转站兼容风险提示。

### 6.3 V0.3 功能

- Claude Code Adapter；
- Gemini CLI Adapter；
- 多工具配置页；
- SQLite 配置中心；
- 导出 / 导入配置包；
- 团队模板。

---

## 7. 面板信息架构

MVP 不做多窗口，全部在 LiteLauncher 插件面板内完成。

```text
CodeAgent Switch
├── 首页 Dashboard
│   ├── 当前配置摘要
│   ├── 当前 Provider / Model / Profile
│   ├── 认证方式状态
│   ├── 项目级配置风险
│   └── 快捷动作
├── Provider 预设
│   ├── 中转站列表
│   ├── 新增 / 编辑 / 删除
│   ├── Key 设置（自动变量名 + 写入系统 Key / 复制命令，不保存明文）
│   └── 环境变量命令
├── Profile 预设
│   ├── 模型 / reasoning / compact
│   ├── 绑定 Provider
│   └── 设为当前
├── 预览与切换
│   ├── TOML diff
│   ├── 风险提示
│   └── 确认写入
├── 诊断
│   ├── Error / Warning / Info
│   ├── 修复建议
│   └── 复制诊断报告
└── 备份
    ├── 最近自动备份
    └── 恢复入口（V0.2）
```

### 7.1 首页 Dashboard

首屏必须避免空白，打开后自动读取一次配置并展示：

- 配置路径；
- 文件是否存在；
- 当前 `model_provider`；
- 当前 `model`；
- 当前 `review_model`；
- 当前 reasoning；
- 当前 auth 模式；
- Provider 数量；
- Profile 数量；
- 最近备份时间；
- 诊断结果摘要。

快捷按钮：

- 重新读取；
- 打开配置预览；
- 新建 Provider；
- 新建 Profile；
- 运行诊断；
- 复制环境变量命令。

### 7.2 Provider 预设

字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---:|---:|---|
| id | string | 是 | TOML 中的 provider key |
| name | string | 是 | 展示名称 |
| base_url | string | 是 | 中转站或官方 API 地址 |
| wire_api | enum | 否 | 当前官方口径仅支持 `responses`，省略时默认 `responses` |
| auth_type | enum | 是 | `env_key` / `openai_auth` |
| env_key | string | 条件 | `auth_type=env_key` 时自动生成，格式为 `CODEAGENT_<PROVIDER>_API_KEY` |
| env_key_instructions | string | 否 | Provider 控制台获取 Key 的说明 |
| request_max_retries | number | 否 | 高级字段 |
| stream_max_retries | number | 否 | 高级字段 |
| stream_idle_timeout_ms | number | 否 | 高级字段 |
| supports_websockets | boolean | 否 | Provider 是否支持 websocket |
| http_headers | map | 否 | 固定请求头，界面按 `key=value` 多行编辑 |
| env_http_headers | map | 否 | 从环境变量读取的请求头值 |
| query_params | map | 否 | 固定查询参数 |

约束：

- 不允许保存真实 API Key；
- `env_key` 只保存环境变量名，默认由 Provider ID 或 Base URL 自动生成；
- API Key 输入框只用于写入 Windows 用户级系统环境变量或复制本机环境变量设置命令，不写入配置、不进入插件状态；
- `openai_auth` 只写 `requires_openai_auth = true`；
- 同一个 Provider 不应同时启用 `env_key` 和 `requires_openai_auth`；
- `base_url` 必须是 `http://` 或 `https://`。

### 7.3 Profile 预设

字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---:|---:|---|
| id | string | 是 | 本地预设 ID |
| name | string | 是 | 展示名称 |
| provider_id | string | 是 | 绑定 Provider |
| model | string | 是 | Codex 主模型 |
| review_model | string | 否 | review 模型 |
| model_reasoning_effort | enum | 否 | `low` / `medium` / `high` / `xhigh` |
| plan_mode_reasoning_effort | enum | 否 | Plan 模式 reasoning |
| model_reasoning_summary | enum | 否 | `auto` / `concise` / `detailed` / `none` |
| model_verbosity | enum | 否 | `low` / `medium` / `high` |
| service_tier | enum | 否 | `auto` / `flex` / `fast` |
| web_search | enum | 否 | `disabled` / `cached` / `live` |
| model_auto_compact_token_limit | number | 否 | 自动压缩阈值 |

内置模板：

- 官方登录态：`gpt-5.5` + `requires_openai_auth`；
- 中转站高质量：`gpt-5.5` + `xhigh`；
- 中转站日常：`gpt-5.4` + `high`；
- 快速轻量：较低 reasoning + 更积极 compact；
- Review 专用：单独设置 `review_model`。

### 7.4 运行权限

字段：

| 字段 | 类型 | 必填 | 说明 |
|---|---:|---:|---|
| approval_policy | enum | 否 | `untrusted` / `on-failure` / `on-request` / `never` |
| sandbox_mode | enum | 否 | `read-only` / `workspace-write` / `danger-full-access` |
| default_permissions | enum | 否 | `trusted` / `untrusted` |
| network_access | enum | 否 | `enabled` / `restricted` / `disabled` |
| [windows].sandbox | enum | 否 | Windows 沙箱模式 |
| [windows].sandbox_private_desktop | boolean | 否 | Windows 私有桌面沙箱 |

### 7.5 诊断页

诊断项：

| ID | 级别 | 检查项 | 建议 |
|---|---|---|---|
| D001 | Error | TOML 解析失败 | 显示错误行，禁止写入 |
| D002 | Error | 当前 `model_provider` 不存在 | 选择存在的 Provider 或新建 |
| D003 | Error | Provider 缺少 `base_url` | 补全 URL |
| D004 | Error | `env_key` 与 `requires_openai_auth` 混用 | 二选一 |
| D005 | Warning | `env_key` 当前进程不可见 | 提示重启 LiteLauncher / shell |
| D006 | Warning | 项目级 `.codex/config.toml` 存在 | 提示可能覆盖用户级配置 |
| D007 | Warning | `wire_api` 不是 `responses` | 提示中转站兼容风险 |
| D008 | Warning | Profile 为实验能力 | 提示 IDE 扩展可能不支持 |
| D009 | Info | `auth.json` 存在 | 只提示存在，不读取内容 |
| D010 | Info | 切换 Provider 会影响会话表现 | 固定展示 |

诊断报告可复制，复制后按钮显示短状态，例如“已复制”。

---

## 8. 数据与存储

### 8.1 Codex 配置文件

默认路径：

```text
Windows: C:\Users\<user>\.codex\config.toml
macOS: /Users/<user>/.codex/config.toml
Linux: /home/<user>/.codex/config.toml
```

MVP 读取用户级配置。项目级配置只做检测，可通过用户选择当前项目目录或后续从 LiteLauncher 工作区上下文接入。

### 8.2 插件本地状态

MVP 不引入 SQLite 新表，优先使用 LiteLauncher 现有数据库 `settings` 表保存一个 JSON blob：

```text
setting key: plugin.codeagent-switch.state
```

建议结构：

```json
{
  "version": 1,
  "configPath": "C:\\Users\\name\\.codex\\config.toml",
  "activeProfileId": "relay-1-high",
  "providers": [],
  "profiles": [],
  "lastReadAt": "2026-05-12T10:00:00.000Z",
  "backupKeepCount": 10
}
```

V0.2 如果预设、备份、跨工具数据增多，再迁移到 SQLite 表。

### 8.3 备份路径

备份放在 LiteLauncher userData 目录内，不污染用户 `.codex` 目录：

```text
<userData>/codeagent-switch/backups/codex/config.toml.20260512_103000.bak
```

备份元数据保存在插件 state 中：

```json
{
  "id": "20260512_103000",
  "tool": "codex",
  "sourcePath": "C:\\Users\\name\\.codex\\config.toml",
  "backupPath": "...",
  "profileId": "relay-1-high",
  "createdAt": "2026-05-12T10:30:00.000Z"
}
```

---

## 9. 架构设计

### 9.1 分层

```text
src/main/plugins/codeagent-switch/
├── index.ts              # 插件入口、命令解析、openPanel
├── service.ts            # 读写、备份、诊断编排
├── codex-adapter.ts      # Codex 配置路径、解析、生成、诊断
├── state-store.ts        # LiteLauncher settings JSON 读写
└── types.ts              # 主进程内部类型

src/shared/codeagent-switch/
├── types.ts              # renderer/main 共享类型
├── toml-model.ts         # 标准化配置模型
├── diagnostics.ts        # 诊断规则纯函数
└── prompt.ts             # UI 文案与风险说明

src/renderer/plugin-panel-impls.ts
└── renderCodeAgentSwitchPanel / applyCodeAgentSwitchPanelPayload
```

### 9.2 Adapter 接口

```ts
type ToolAdapter = {
  tool: "codex" | "claude-code" | "gemini-cli";
  getDefaultConfigPath(): string;
  readConfig(path?: string): Promise<ReadConfigResult>;
  diagnose(input: DiagnoseInput): DiagnosticItem[];
  buildPreview(input: SwitchInput): Promise<PreviewResult>;
  applySwitch(input: SwitchInput): Promise<ApplyResult>;
};
```

MVP 只实现 `CodexAdapter`。

### 9.3 TOML 处理策略

MVP 使用“受控字段写入”：

- 读取时解析完整 TOML；
- 写入时只管理 Codex 基础字段、`[history]`、`[model_providers.*]`、`[profiles.*]`；
- 对未知顶层字段和未知表尽量保留；
- 无法安全保留时，必须在 diff 里明确提示；
- 写入后必须重新解析验证。

不要手写脆弱的字符串拼接。需要引入 TOML 解析库时，优先选择能保留结构或足够稳定的库，并通过 fixture 测试覆盖 comments / unknown fields / arrays / nested tables。

### 9.4 写入流程

```text
读取当前 config.toml
→ 解析为标准模型
→ 根据目标 Profile 生成新模型
→ 生成 diff
→ 用户确认
→ 创建备份
→ 写入临时文件
→ 重新解析临时文件
→ 原子替换目标文件
→ 重新读取目标文件
→ 更新 activeProfileId
→ 输出切换结果和风险提示
```

失败处理：

- 解析失败：禁止写入；
- 备份失败：禁止写入；
- 临时文件解析失败：删除临时文件，禁止替换；
- 替换失败：保留原文件，提示错误；
- 替换后验证失败：尝试从备份恢复，并提示用户备份路径。

---

## 10. UI 设计要求

CodeAgent Switch 是开发工具插件，视觉应保持 LiteLauncher 现有插件面板风格：紧凑、清晰、可扫描，不做营销式大卡片。

### 10.1 首屏布局

建议三段式：

1. 顶部工具条：当前状态、重新读取、诊断、备份；
2. 中部两列：左侧 Provider/Profile 简略列表，右侧详情页编辑当前选中的 Provider 或 Profile；
3. 底部：诊断摘要、切换风险、最近操作结果。

小屏降为单列，按钮换行但不能横向溢出。

### 10.2 控件规范

- Provider/Profile 用分段列表或紧凑表格；
- 列表只展示简略信息，编辑、新增、删除、预览、应用都在右侧详情页完成；
- 当前选中项必须有高亮态，当前生效的 Provider / exact Profile 还要有独立 active 标记；
- 风险提示用状态条，不使用大段说明文字铺满首屏；
- `diff` 使用等宽字体；
- 复制类按钮必须有 1-2 秒反馈；
- 危险动作例如恢复备份，需要二次确认；
- 不在界面里展示真实 API Key 输入框。

### 10.3 状态文案

空状态：

```text
未找到 Codex 配置。可以先创建一个 Provider/Profile 预设，写入前会自动备份。
```

切换成功：

```text
已切换到 Relay 2。建议重启 Codex 桌面版 / IDE 扩展，或重新打开 CLI 会话以确保配置生效。
```

会话风险：

```text
Provider、Base URL 或认证方式变化后，历史会话显示可能不同。本插件不会迁移或合并会话。
```

---

## 11. 安全要求

1. 不保存明文 API Key；
2. 不读取 `auth.json` 内容，只检测文件是否存在；
3. 不上传配置；
4. 不读取项目源码；
5. 写入前必须自动备份；
6. 写入必须可回滚；
7. 所有路径必须规范化，禁止写入预期配置路径和备份目录之外的位置；
8. diff 里不得展示真实环境变量值；
9. 错误日志不得写入 API Key、token 或完整 `auth.json` 内容；
10. 中转站 `base_url` 明确标记为用户自担风险配置。

---

## 12. 官方配置字段口径

实现前必须以 OpenAI Codex 官方文档为准：

- Codex Config Reference：`https://developers.openai.com/codex/config-reference`
- Codex Config Basic：`https://developers.openai.com/codex/config-basic`
- Codex Advanced Configuration：`https://developers.openai.com/codex/config-advanced`

当前 PRD 中需要重点对齐的字段：

- `model_provider`
- `model`
- `review_model`
- `model_reasoning_effort`
- `model_auto_compact_token_limit`
- `approval_policy`
- `sandbox_mode`
- `default_permissions`
- `network_access`
- `[windows] sandbox`
- `[windows] sandbox_private_desktop`
- `[history] max_bytes`
- `[model_providers.<id>] base_url`
- `[model_providers.<id>] wire_api`
- `[model_providers.<id>] env_key`
- `[model_providers.<id>] env_key_instructions`
- `[model_providers.<id>] requires_openai_auth`
- `[model_providers.<id>] supports_websockets`
- `[model_providers.<id>.http_headers]`
- `[model_providers.<id>.env_http_headers]`
- `[model_providers.<id>.query_params]`
- `[profiles.<name>]`
- `[profiles.<name>] plan_mode_reasoning_effort`
- `[profiles.<name>] model_reasoning_summary`
- `[profiles.<name>] model_verbosity`
- `[profiles.<name>] service_tier`
- `[profiles.<name>] web_search`

注意事项：

- Profile 在 Codex 中仍可能有实验性或客户端兼容差异；
- IDE 扩展对 Profile 的支持可能与 CLI 不完全一致；
- 项目级配置、用户级配置、CLI 参数和 profile 的优先级必须在实现前再次验证；
- 官方字段变化时，诊断规则和生成器要同步更新。

---

## 13. 测试与验收

### 13.1 文档 / 源码回归

- 插件注册在 `src/main/plugins/index.ts`；
- 默认可见列表包含 `codeagent-switch`；
- 老用户迁移策略覆盖 `codeagent-switch`；
- `plugin-panel-impls-regression.test.ts` 覆盖面板实现不回流到 `renderer.ts`；
- `test:plugins-visible` 覆盖入口搜索和 Enter 打开。

### 13.2 纯函数测试

需要 fixtures：

```text
fixtures/codeagent-switch/
├── empty-config.toml
├── openai-auth.toml
├── relay-env-key.toml
├── multiple-providers.toml
├── profiles.toml
├── unknown-fields.toml
├── invalid.toml
└── project-override.toml
```

覆盖：

- 解析 Provider；
- 解析 Profile；
- 认证冲突诊断；
- 缺失 env 诊断；
- 项目级配置提示；
- diff 生成；
- unknown fields 保留；
- invalid TOML 禁止写入。

### 13.3 主进程测试

- `read` 在配置不存在时返回空状态；
- `diagnose` 不读取 `auth.json` 内容；
- `preview` 不写文件；
- `apply` 写入前创建备份；
- `apply` 写入后能重新解析；
- 写入失败时恢复备份；
- 路径越界被拒绝；
- 复制环境变量命令不包含真实 Key。

### 13.4 UI 验收

- 空输入下插件分区可见；
- 搜索 `codex` 可命中；
- Enter 可打开面板；
- 首页首屏不空；
- 当前选中 Profile 有高亮；
- diff 不横向撑破；
- 小屏窗口无关键布局错乱；
- 复制动作有反馈；
- 切换前必须展示风险提示；
- `Esc` 可返回搜索页。

### 13.5 建议验证命令

按影响范围分层执行，不需要每次都跑 Electron smoke：

```bash
pnpm run build
node dist/test/codeagent-switch-parser.test.js
node dist/test/codeagent-switch-service.test.js
node dist/test/plugin-panel-impls-regression.test.js
node dist/test/visible-plugins-regression.test.js
```

只有改动插件打开链路或布局时，再补：

```bash
pnpm run test:e2e:smoke
```

---

## 14. 开发里程碑

### V0.1：Codex LiteLauncher MVP

目标周期：1-2 周。

范围：

- 插件注册与默认可见；
- Codex 配置读取；
- 首页 Dashboard；
- Provider/Profile 本地预设；
- 诊断规则；
- diff 预览；
- 备份 + 安全写入；
- 环境变量命令生成；
- 复制反馈；
- 核心测试。

不包含：

- 多工具；
- SQLite 新表；
- 备份恢复完整管理；
- 托盘切换；
- 独立桌面版；
- VSCode 扩展。

### V0.2：Codex 完善版

- 备份列表和恢复；
- 导入旧配置；
- 高级字段保留写入增强；
- compact / reasoning 推荐；
- 项目级配置预览；
- 更多 UI 自动化覆盖。

### V0.3：多工具扩展

- Claude Code Adapter；
- Gemini CLI Adapter；
- 多工具配置页；
- SQLite 数据模型；
- 配置包导入导出。

---

## 15. 风险与应对

### 风险 1：写坏用户配置

应对：

- 写入前备份；
- 临时文件验证；
- 原子替换；
- 失败回滚；
- fixture 覆盖 unknown fields；
- 切换前强制 diff。

### 风险 2：官方 Codex 字段变化

应对：

- 实现前重新核对官方文档；
- 字段定义集中在共享层；
- 未识别字段尽量保留；
- 诊断页提示字段可能随 Codex 更新变化。

### 风险 3：用户误以为能共享会话

应对：

- 首页固定提示；
- 切换确认固定提示；
- 切换结果固定提示；
- README 和发布说明明确说明不迁移会话。

### 风险 4：中转站兼容性不稳定

应对：

- `wire_api` 明确展示；
- 旧配置或中转站示例中出现非 `responses` 时给 Warning；
- 不承诺所有中转站可用；
- 错误文案引导用户检查中转站兼容性。

### 风险 5：LiteLauncher 插件越来越多

应对：

- 默认可见需要明确价值；
- 搜索关键词精准，避免噪声命中；
- 面板实现放在 `plugin-panel-impls.ts`，共享逻辑抽到 `src/shared/codeagent-switch/`；
- 测试覆盖默认可见迁移，避免发布后老用户看不到插件。

---

## 16. README 文案建议

```md
### CodeAgent Switch

LiteLauncher 内置的 Codex 配置切换插件。

它可以读取 `~/.codex/config.toml`，管理多个 Provider / 中转站 / Profile，切换前展示 diff，写入前自动备份，并诊断 `env_key`、OpenAI 登录态、项目级配置覆盖和会话变化风险。

插件不会保存明文 API Key，也不会读取 `auth.json` 敏感内容；切换 Provider 后历史会话显示可能不同，插件不合并或迁移会话。
```

---

## 17. 总结

CodeAgent Switch 在 LiteLauncher 里的最佳落地方式不是做一个新的独立产品，而是做成一个高频开发工具插件：

1. 先服务 Codex 用户的真实痛点；
2. 保持本地、安全、可回滚；
3. 用 LiteLauncher 现有插件协议接入搜索、面板、默认可见和回归测试；
4. 把复杂能力收敛到 Adapter 和共享纯函数里；
5. 等 Codex MVP 稳定后，再扩展 Claude Code、Gemini CLI 和多工具配置中心。

---


## 18. 2026-05-12 实现状态更新

当前 CodeAgent Switch 已从“配置读取 + Profile 切换”升级为 Codex 优先的配置管理器：

- 面板顶部新增工具分组：`Codex` 已接入，`Claude Code` / `Gemini CLI` 作为规划中 Adapter 显示。
- Dashboard 会标注当前 `profile`、由 Profile 推导的 Provider、当前模型、review 模型、reasoning，以及 exact / partial 匹配的 Profile。
- Provider 支持新增、编辑、删除；可配置 `id`、`name`、`base_url`、`wire_api`、认证方式、`env_key` 名称和重试字段。
- `env_key` 只保存环境变量名，插件仍不保存真实 API Key；疑似真实 Key 会被共享层校验拦截。
- Profile 支持新增、编辑、删除、预览和应用；应用 Profile 只写顶层 `profile = "<profile-id>"`，并清理根部重复模型字段，具体 Provider / 模型 / reasoning 参数由对应 `[profiles.xxx]` 段保存。
- 删除 Provider 会阻止删除当前 Provider，也会阻止删除仍被 Profile 引用的 Provider。
- TOML 解析和写入支持 `[profiles."淘宝1"]` 这类带引号的非 ASCII profile id；Profile exact 匹配优先使用顶层 `profile`，没有顶层 `profile` 的旧配置才回退比较模板字段；中文 Provider/Profile 名称使用 UTF-8 链路回归覆盖，防止 `淘宝1`、`银河` 等值再次变成 mojibake。
- 面板已改为 master-detail：左侧 Provider/Profile 只展示简略配置摘要，点击后在右侧详情页编辑；选中状态和当前生效状态分开标注。
- 渲染层只保留 master-detail 详情页路径；旧的内联编辑列表和不可达旧面板实现已清理，并用源码回归防止回退。
- 所有写入动作复用安全流程：读取当前配置、生成新 TOML、解析校验、写入临时文件、再次解析、替换目标文件，并在写入前自动备份。
- 面板实现和回归测试已覆盖 `save-provider`、`delete-provider`、`save-profile`、`delete-profile`、active 标注和配置编辑表单入口。

---

## 19. 2026-05-13 UI 优化状态更新

CodeAgent Switch 面板继续向 cc switch 风格靠拢，当前 UI 已调整为更明确的三栏配置管理器：

- 左侧固定宽度工具栏：Codex / Claude Code / Gemini CLI 不再自动拉伸，Codex 为已接入状态，后续工具保留 Adapter 入口。
- 中间列以 Profile 为主列表，Provider 收敛成紧凑管理条，列表只展示简略信息和 selected / active 状态。
- 右侧详情页按功能分组：基础配置、切换操作、diff 预览、诊断、备份、环境变量命令、危险区。
- 预览、应用、复制诊断、刷新备份、恢复备份、删除等动作都跟随当前选中的 Provider/Profile 放到详情页内，减少底部散落区块。
- 中间列新增“当前配置”摘要卡，详情页标题下新增只读字段概览网格，帮助用户在编辑前先确认当前 Provider / Model / Profile / Auth。
- 列表行和 Provider chip 同时支持 `selected` 与 `active` badge，把“正在查看的配置”和“当前生效的配置”视觉分开。
- Profile 列表行直接提供“预览 / 切换”按钮，用户不需要先进入详情页才能切换；当前生效 Profile 的切换按钮显示为“当前”并禁用。
- Provider 编辑器不再让用户手填 `env_key` 名称，而是根据 Provider ID 自动生成 `CODEAGENT_<PROVIDER>_API_KEY`；API Key 输入框只用于复制本机环境变量设置命令，不保存明文 Key。
- 样式上固定工具栏宽度，右侧详情列获得更多空间；窄屏会折叠为单列，避免大面积空白和按钮自动拉伸。
- 源码回归新增布局结构断言，锁住 `codeagent-switch-shell`、`codeagent-switch-tool-sidebar`、`codeagent-switch-profile-list`、`codeagent-switch-provider-strip`、`codeagent-switch-detail-section` 等关键结构，防止后续退回旧布局。
