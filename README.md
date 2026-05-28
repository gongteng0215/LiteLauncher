# LiteLauncher

Last updated: 2026-05-28  
Version baseline: `v1.0.16`

LiteLauncher is a lightweight desktop launcher built with `Electron + TypeScript + SQLite`.
It focuses on one fast loop: **invoke -> search -> run**.

## English

### Overview

LiteLauncher is a keyboard-first desktop launcher for Windows, with macOS packaging support in the repository.
It combines launcher search, clipboard history, plugin panels, indexing controls, and a growing set of built-in tools under one window.

### Current Capabilities

- Global invoke shortcut with fallback registration
- Unified search for apps, files, folders, web actions, commands, and plugins
- Search sections:
  - empty input: `Recent`, `Pinned`, `Plugins`
  - non-empty input: `Search`, `Pinned`, `Plugins`
- Search loading feedback, debounce, and paging
- Search scope prefixes: `app:`, `cmd:`, `web:`, `plugin:`
- Chinese search support with initials and pinyin fragments
- Windows alias and app activation support:
  - PATH command aliases
  - StartApps / WindowsApps activation
  - example: `codex`
- Result card context menu:
  - Pin / Unpin
  - Run as administrator
  - Open containing folder
- Settings page groups:
  - Search Display
  - Index Scan
  - System
  - Error Logs
- Index controls:
  - Program Files scanning
  - custom scan directories
  - excluded scan directories
  - result include/exclude filters
  - rebuild index without restart
- Unified error log capture from Main / Renderer / IPC / execute flow
- Native dialog / download auto-hide suspension for plugin operations
- Hardware inspection with Markdown / HTML report export
- File hash and port-occupancy helper plugins
- Image Prompt plugin with ChatGPT Images 2.0 prompt generation, style presets, smart scene templates, scannable text design cards, and structured birthday text fields
- CodeAgent Switch plugin for Codex config summaries, active Provider/Profile marking, Provider / Profile add-edit-delete, official advanced/runtime config fields, diagnostics, diff preview, backup-first writes, backup restore, and system environment-variable key setup
- Development watch mode with auto compile, main-process restart, and renderer reload

### Currently Visible Plugins

1. `cashflow-game`
2. `hardware-inspector`
3. `webtools-password`
4. `webtools-cron`
5. `webtools-json`
6. `webtools-crypto`
7. `webtools-jwt`
8. `webtools-timestamp`
9. `webtools-regex`
10. `webtools-strings`
11. `webtools-colors`
12. `webtools-diff`
13. `webtools-http-mock`
14. `webtools-image-base64`
15. `webtools-image-prompt`
16. `webtools-config-convert`
17. `webtools-sql-format`
18. `webtools-unit-convert`
19. `webtools-file-hash`
20. `webtools-port-helper`
21. `webtools-url-parse`
22. `webtools-qrcode`
23. `webtools-markdown`
24. `webtools-ua`
25. `webtools-api-client`
26. `codeagent-switch`

### Common Commands

- `calc 1+2*3` calculate and copy
- `calculator` open system calculator
- `g keyword` web search
- `clip` open clipboard panel
- `settings` open settings panel
- `cashflow` / `cash` / `cf` open Cashflow Lite
- `hardware` / `hw` / `硬件` open hardware inspector
- `wt-json` open JSON tool
- `wt-crypto` open crypto tool
- `wt-jwt` open JWT tool
- `wt-time` open timestamp tool
- `wt-hash` open file hash checker
- `wt-port` open port helper
- `wt-qr` open QR code tool
- `wt-md` open Markdown preview
- `wt-image` / `wt-base64` open image Base64 tool
- `wt-prompt` / `提示词` open image prompt generator
- `codex` open Codex on Windows if installed as a Windows app alias
- `exit` quit app

### Development

Standard build and run:

```bash
pnpm install
pnpm run build
pnpm start
```

Watch mode:

```bash
pnpm dev
```

Type check:

```bash
pnpm run typecheck
```

Regression checks:

```bash
pnpm run test:regression
pnpm run test:e2e:smoke
pnpm run test:regression:full
pnpm run test:cashflow
pnpm run check:encoding
```

### Packaging

Windows:

```powershell
pnpm.cmd run dist:win
pnpm.cmd run dist:win:portable
```

macOS:

```bash
pnpm run dist:mac
pnpm run dist:mac:arm64
pnpm run dist:mac:x64
```

Outputs: `release/`

## 中文

### 项目简介

LiteLauncher 是一个基于 `Electron + TypeScript + SQLite` 的轻量桌面启动器，核心目标是把高频操作压缩到一条统一动作链里：

**唤起 -> 输入 -> 搜索 -> 执行**

当前重点不是继续堆功能数量，而是把搜索稳定性、插件一致性、小屏适配和自动回归做扎实。

### 当前已实现

- 全局快捷键唤起，默认 `Alt+Space`，冲突时自动回退
- 统一搜索应用、文件、文件夹、网页动作、命令和插件
- 搜索分区：
  - 空输入：`最近访问`、`置顶`、`插件`
  - 非空输入：`搜索结果`、`置顶`、`插件`
- 搜索首页分区使用固定小卡片，按窗口实际宽度自适应列数，标题最多两行
- 搜索加载态、输入防抖、结果分页
- 搜索范围前缀：`app:`、`cmd:`、`web:`、`plugin:`
- 中文搜索增强：首字母、拼音片段、别名映射
- Windows 应用别名支持：
  - PATH 命令别名
  - StartApps / WindowsApps 激活
  - 典型示例：`codex`
- 结果卡片右键菜单：
  - 置顶 / 取消置顶
  - 管理员运行
  - 打开所在位置
- 设置页分组：
  - 搜索显示
  - 索引扫描
  - 系统
  - 错误日志
- 索引扫描支持：
  - Program Files
  - 自定义目录
  - 排除目录
  - 结果白名单 / 黑名单目录
  - 不重启重建索引
- 统一错误日志：Main / Renderer / IPC / 执行链路异常都能记录
- 插件原生动作防隐藏：选择文件、下载文件时窗口不会因失焦立即消失
- 硬件检测：查看主板、CPU、内存、显卡、硬盘等信息，并导出 Markdown / HTML 报告
- 文件哈希：计算 MD5 / SHA1 / SHA256 / SHA512，并可对比期望哈希
- 端口助手：查询 TCP / UDP 端口占用、定位 PID，并可释放端口
- 图片提示词：按产品模板生成 ChatGPT Images 2.0 图片提示词，支持 26 类风格预设、12 个智能场景模板、联动模块点选、生日照片 / 周岁模板、文字设计卡片、年龄 / 祝福语 / 姓名结构化字段与复制反馈；生成词会写入文字层级、颜色、效果、布局和安全区，减少“后贴字”感
- CodeAgent Switch：读取 Codex `config.toml`，标注当前 Provider / Profile / 模型摘要，支持 Provider / Profile 新增、编辑、删除与 env_key 名称配置；诊断认证冲突、环境变量缺失、Profile 兼容和会话变化风险；支持 Profile 切换前 diff 预览、所有写入前自动备份、备份列表与恢复，并生成不含真实 Key 的环境变量命令
- 开发模式 `pnpm dev`：自动编译、主进程自动重启、渲染层自动刷新

### 当前默认可见插件（26 个）

1. 富爸爸现金流 `cashflow-game`
2. 硬件检测 `hardware-inspector`
3. 密码工具 `webtools-password`
4. Cron 生成器 `webtools-cron`
5. JSON 工具 `webtools-json`
6. 加密工具 `webtools-crypto`
7. JWT 调试器 `webtools-jwt`
8. 时间戳工具 `webtools-timestamp`
9. 正则工具 `webtools-regex`
10. 字符串工具 `webtools-strings`
11. 颜色工具 `webtools-colors`
12. 文本对比 `webtools-diff`
13. HTTP Mock `webtools-http-mock`
14. 图片 Base64 `webtools-image-base64`
15. 图片提示词 `webtools-image-prompt`
16. 配置转换 `webtools-config-convert`
17. SQL 格式化 `webtools-sql-format`
18. 单位换算 `webtools-unit-convert`
19. 文件哈希 `webtools-file-hash`
20. 端口助手 `webtools-port-helper`
21. URL 解析 `webtools-url-parse`
22. 二维码生成 `webtools-qrcode`
23. Markdown 预览 `webtools-markdown`
24. UA 解析 `webtools-ua`
25. API 调试 `webtools-api-client`
26. CodeAgent Switch `codeagent-switch`

### 常用命令

- `calc 1+2*3`：快速计算并复制
- `calculator`：打开系统计算器
- `g 关键词`：网页搜索
- `clip`：打开剪贴板历史
- `settings`：打开设置页
- `cashflow` / `cash` / `cf` / `现金流`：打开 Cashflow Lite
- `hardware` / `hw` / `硬件`：打开硬件检测
- `wt-json`：打开 JSON 工具
- `wt-crypto`：打开加密工具
- `wt-jwt`：打开 JWT 调试器
- `wt-time`：打开时间戳工具
- `wt-hash`：打开文件哈希工具
- `wt-port`：打开端口助手
- `wt-qr`：打开二维码生成
- `wt-md`：打开 Markdown 预览
- `codex` / `codeagent`：打开 CodeAgent Switch
- `wt-image` / `wt-base64`：打开图片 Base64 工具
- `wt-prompt` / `提示词`：打开图片提示词生成器
- `codex`：在 Windows 上打开 Codex（已安装为应用别名时）
- `exit`：退出应用

### 开发方式

常规启动：

```bash
pnpm install
pnpm run build
pnpm start
```

开发模式：

```bash
pnpm dev
```

类型检查：

```bash
pnpm run typecheck
```

回归检查：

```bash
pnpm run test:regression
pnpm run test:e2e:smoke
pnpm run test:regression:full
pnpm run test:cashflow
pnpm run check:encoding
```

`test:e2e:smoke` 已覆盖搜索首页 `最近访问`、`置顶`、`插件` 三块的紧凑网格对齐，以及主要插件面板的核心 UI 冒烟；新增默认插件 `hardware-inspector`、`webtools-file-hash`、`webtools-port-helper` 已纳入同口径小屏检查，`加密工具` 与 `JWT 调试器` 已补主流程输入输出烟测。

### 当前下一步重点

1. 继续拆分 `src/renderer/renderer.ts` 中的剩余执行 helper 与共享状态逻辑。
2. 继续推进插件面板高 DPI 回归和更细布局断言。
3. 推进 Cashflow `cash review` 与 WebTools 交互收敛。
4. 继续做 UI 文案与历史编码巡检；自动更新验证、签名 / 公证保持低优先级。
