# LiteLauncher

Last updated: 2026-03-29  
Version baseline: `v1.0.12`

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
- Development watch mode with auto compile, main-process restart, and renderer reload

### Currently Visible Plugins

1. `cashflow-game`
2. `webtools-password`
3. `webtools-cron`
4. `webtools-json`
5. `webtools-crypto`
6. `webtools-jwt`
7. `webtools-timestamp`
8. `webtools-strings`
9. `webtools-colors`
10. `webtools-diff`
11. `webtools-http-mock`
12. `webtools-image-base64`
13. `webtools-config-convert`
14. `webtools-sql-format`
15. `webtools-unit-convert`
16. `webtools-regex`
17. `webtools-url-parse`
18. `webtools-qrcode`
19. `webtools-markdown`
20. `webtools-ua`
21. `webtools-api-client`

### Common Commands

- `calc 1+2*3` calculate and copy
- `calculator` open system calculator
- `g keyword` web search
- `clip` open clipboard panel
- `settings` open settings panel
- `cashflow` / `cash` / `cf` open Cashflow Lite
- `wt-json` open JSON tool
- `wt-crypto` open crypto tool
- `wt-jwt` open JWT tool
- `wt-time` open timestamp tool
- `wt-qr` open QR code tool
- `wt-md` open Markdown preview
- `wt-image` / `wt-base64` open image Base64 tool
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
- 开发模式 `pnpm dev`：自动编译、主进程自动重启、渲染层自动刷新

### 当前默认可见插件（21 个）

1. 富爸爸现金流 `cashflow-game`
2. 密码工具 `webtools-password`
3. Cron 生成器 `webtools-cron`
4. JSON 工具 `webtools-json`
5. 加密工具 `webtools-crypto`
6. JWT 调试器 `webtools-jwt`
7. 时间戳工具 `webtools-timestamp`
8. 字符串工具 `webtools-strings`
9. 颜色工具 `webtools-colors`
10. 文本对比 `webtools-diff`
11. HTTP Mock `webtools-http-mock`
12. 图片 Base64 `webtools-image-base64`
13. 配置转换 `webtools-config-convert`
14. SQL 格式化 `webtools-sql-format`
15. 单位换算 `webtools-unit-convert`
16. 正则工具 `webtools-regex`
17. URL 解析 `webtools-url-parse`
18. 二维码生成 `webtools-qrcode`
19. Markdown 预览 `webtools-markdown`
20. UA 解析 `webtools-ua`
21. API 调试 `webtools-api-client`

### 常用命令

- `calc 1+2*3`：快速计算并复制
- `calculator`：打开系统计算器
- `g 关键词`：网页搜索
- `clip`：打开剪贴板历史
- `settings`：打开设置页
- `cashflow` / `cash` / `cf` / `现金流`：打开 Cashflow Lite
- `wt-json`：打开 JSON 工具
- `wt-crypto`：打开加密工具
- `wt-jwt`：打开 JWT 调试器
- `wt-time`：打开时间戳工具
- `wt-qr`：打开二维码生成
- `wt-md`：打开 Markdown 预览
- `wt-image` / `wt-base64`：打开图片 Base64 工具
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

### 当前下一步重点

1. 继续拆分 `src/renderer/renderer.ts` 中的剩余插件面板逻辑。
2. 继续推进插件面板小屏 / 高 DPI 回归。
3. 推进 Cashflow `cash review` 与 WebTools 交互收敛。
4. 测试扩展、自动更新验证、签名 / 公证保持低优先级，放在自用阶段收尾处理。
