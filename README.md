# LiteLauncher

Last updated: 2026-03-19
Version baseline: `v1.0.11`

LiteLauncher is a lightweight desktop launcher built with `Electron + TypeScript + SQLite`.
It focuses on one fast loop: **invoke -> search -> run**.

## English

### What It Does

- Global invoke shortcut (`Alt+Space`, with automatic fallback if occupied)
- Unified search for apps, files, folders, web actions, command entries, and plugins
- Result sections:
  - Empty input: `Recent`, `Pinned`, `Plugins`
  - With input: `Search`, `Pinned`, `Plugins`
- Search loading feedback and paging for non-empty queries
- Search scope prefixes: `app:`, `cmd:`, `web:`, `plugin:`
- Keyboard-first flow (`Enter` run, `Esc` clear/hide, arrow navigation)
- Settings page groups: `Search Display`, `Index Scan`, `System`, `Error Logs`
- Plugin visibility allowlist in Settings (one plugin ID per line, hot-applied)
- Context menu on result cards:
  - Pin / Unpin
  - Run as administrator
  - Open containing folder

### Search Features

- Prefix, substring, and constrained fuzzy matching
- Chinese support with initials and pinyin fragment matching
  - Example: `b` -> `百度`
  - Example: `bai` -> `百度`
- Long noisy random input suppression
- Search source expansion:
  - Optional `Program Files` scanning
  - Custom scan directories
  - Excluded scan directories
  - Result include/exclude path filters
  - Rebuild index from Settings without restart
- Windows command and app alias support:
  - PATH command aliases
  - StartApps / WindowsApps activation
  - Example: `codex`

### Built-in Panels

- Clipboard history (`clip`)
- Settings (`settings`)
- Plugin panel framework (`command:plugin:*` routing)
- Unified error log viewer in Settings
- Error capture from Main / Renderer / IPC / execute flow
- Search result loading state and input debounce
- Native file dialog / download auto-hide suspension for plugin operations

### Plugins Currently Visible

1. `cashflow-game` (富爸爸现金流)
2. `webtools-password` (密码工具)
3. `webtools-cron` (Cron 生成器)
4. `webtools-json` (JSON 工具)
5. `webtools-crypto` (加密工具)
6. `webtools-jwt` (JWT 调试器)
7. `webtools-timestamp` (时间戳工具)
8. `webtools-strings` (字符串工具)
9. `webtools-colors` (颜色工具)
10. `webtools-diff` (文本对比)
11. `webtools-image-base64` (图片 Base64)
12. `webtools-config-convert` (配置转换)
13. `webtools-sql-format` (SQL 格式化)
14. `webtools-unit-convert` (单位换算)
15. `webtools-regex` (正则工具)
16. `webtools-url-parse` (URL 解析)
17. `webtools-qrcode` (二维码生成)
18. `webtools-markdown` (Markdown 预览)
19. `webtools-ua` (UA 解析)
20. `webtools-api-client` (API 调试)

### Plugin Migration Status

- All 19 WebTools plugin folders exist under `src/main/plugins/`.
- All 19 WebTools plugins are exposed in the launcher UI.
- Current focus is no longer migration count, but parity, layout consistency, small-window stability, and regression coverage.

### Common Commands

- `calc 1+2*3` Calculate and copy
- `calculator` Open system calculator
- `g keyword` Web search
- `clip` Open clipboard panel
- `settings` Open settings panel
- `cashflow` / `cash` / `cf` / `现金流` Open Cashflow Lite
- `wt-pass` Open password tool
- `wt-cron` Open cron tool
- `wt-json` Open JSON tool
- `wt-crypto` Open crypto tool
- `wt-jwt` Open JWT tool
- `wt-time` Open timestamp tool
- `wt-regex` Open regex tool
- `wt-url` Open URL parser
- `wt-qr` Open QR code tool
- `wt-md` Open Markdown preview
- `wt-colors` Open color tool
- `wt-image` / `wt-base64` Open image Base64 tool
- `codex` Open Codex on Windows if installed as a Windows app alias
- `exit` Quit app

### Requirements

- Node.js 22 LTS (recommended)
- pnpm 10+
- Windows 11 (primary target)
- macOS (development and packaging templates supported)

### Development

Standard build-and-run:

```bash
pnpm install
pnpm run build
pnpm start
```

Watch mode with auto compile, main-process restart, and renderer reload:

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
pnpm run test:regression:full
pnpm run test:e2e:smoke
pnpm run test:cashflow
pnpm run test:search-settings
pnpm run test:main-flow
pnpm run test:windows-alias
pnpm run test:path-rules
pnpm run test:plugins-visible
pnpm run test:plugin-visibility
pnpm run check:encoding
```

### Packaging

```powershell
pnpm.cmd run pack
pnpm.cmd run dist:win
pnpm.cmd run dist:win:portable
```

On macOS host:

```bash
pnpm run dist:mac
pnpm run dist:mac:arm64
pnpm run dist:mac:x64
```

Outputs: `release/`

Windows package icon source: `src/assets/icon.ico`
Note: desktop shortcut icon changes take effect after rebuilding and reinstalling.

## 中文

### 项目简介

LiteLauncher 是基于 `Electron + TypeScript + SQLite` 的轻量桌面启动器，核心链路是：**唤起 -> 搜索 -> 执行**。

### 当前已实现

- 全局快捷键唤起（默认 `Alt+Space`，冲突自动回退）
- 统一搜索执行（应用、文件、文件夹、网页、命令、插件）
- 分区展示：`最近访问`、`置顶`、`插件`
- 搜索状态分区：`搜索结果` + `置顶` + `插件`
- 输入检索时显示加载反馈，并支持搜索结果分页
- 支持范围前缀过滤：`app:`、`cmd:`、`web:`、`plugin:`
- 图标网格、键盘导航、鼠标点击执行
- 结果卡右键菜单：
  - 置顶/取消置顶
  - 管理员运行
  - 打开所在位置
- 中文搜索增强（首字母 + 拼音片段）
- Windows 命令/应用别名支持：
  - PATH 命令别名
  - StartApps / WindowsApps 应用激活
  - 典型示例：`codex`
- 剪贴板历史面板（搜索、复制、删除、清空）
- 设置面板：
  - 分组布局：搜索展示 / 索引扫描 / 系统 / 错误日志
  - 搜索展示数量
  - 索引扫描源（Program Files / 自定义目录）
  - 排除扫描目录
  - 结果白名单目录 / 黑名单目录
  - 插件可见性白名单（按插件 ID 配置，保存后热更新）
  - 重建索引
  - 开机启动
  - 错误日志查看/清空
- 统一错误日志：Main / Renderer / IPC / 执行链路异常都会记录
- 原生操作防隐藏：插件里打开文件选择框、下载文件时不会因为失焦直接消失
- 托盘菜单（显示主窗口、退出）

### 当前可见插件

1. 富爸爸现金流（`cashflow-game`）
2. 密码工具（`webtools-password`）
3. Cron 生成器（`webtools-cron`）
4. JSON 工具（`webtools-json`）
5. 加密工具（`webtools-crypto`）
6. JWT 调试器（`webtools-jwt`）
7. 时间戳工具（`webtools-timestamp`）
8. 字符串工具（`webtools-strings`）
9. 颜色工具（`webtools-colors`）
10. 文本对比（`webtools-diff`）
11. 图片 Base64（`webtools-image-base64`）
12. 配置转换（`webtools-config-convert`）
13. SQL 格式化（`webtools-sql-format`）
14. 单位换算（`webtools-unit-convert`）
15. 正则工具（`webtools-regex`）
16. URL 解析（`webtools-url-parse`）
17. 二维码生成（`webtools-qrcode`）
18. Markdown 预览（`webtools-markdown`）
19. UA 解析（`webtools-ua`）
20. API 调试（`webtools-api-client`）

### WebTools 迁移现状

- `src/main/plugins/` 下 19 个 WebTools 插件目录已全部接入。
- 当前 19 个 WebTools 插件已全部开放到主界面。
- 当前重点不再是“迁移数量”，而是“功能齐平、交互一致、小屏适配、自动回归”。

### 常用命令

- `calc 1+2*3`：快速计算并复制
- `calculator`：打开系统计算器
- `g 关键词`：网页搜索
- `clip`：打开剪贴板历史
- `settings`：打开设置页
- `cashflow` / `cash` / `cf` / `现金流`：打开现金流游戏
- `wt-pass`：打开密码工具
- `wt-cron`：打开 Cron 工具
- `wt-json`：打开 JSON 工具
- `wt-crypto`：打开加密工具
- `wt-jwt`：打开 JWT 工具
- `wt-time`：打开时间戳工具
- `wt-regex`：打开正则工具
- `wt-url`：打开 URL 解析
- `wt-qr`：打开二维码生成
- `wt-md`：打开 Markdown 预览
- `wt-colors`：打开颜色工具
- `wt-image` / `wt-base64`：打开图片 Base64 工具
- `codex`：在 Windows 下启动 Codex（系统已安装时）
- `exit`：退出应用

### 开发方式

常规构建启动：

```bash
pnpm install
pnpm run build
pnpm start
```

开发模式：

```bash
pnpm dev
```

开发模式支持：

- 监听 `src/main` / `src/preload` / `src/shared`
- 主进程改动自动重启 Electron
- 监听 `src/renderer` / `src/assets`
- 渲染层改动自动刷新窗口

类型检查：

```bash
pnpm run typecheck
```

回归检查：

```bash
pnpm run test:cashflow
pnpm run test:search-settings
pnpm run test:path-rules
pnpm run test:plugins-visible
pnpm run test:plugin-visibility
pnpm run check:encoding
```

### 打包

```powershell
pnpm.cmd run pack
pnpm.cmd run dist:win
pnpm.cmd run dist:win:portable
```

Windows 图标源：`src/assets/icon.ico`
说明：桌面快捷方式图标的变化需要重新构建并重新安装后才能完全生效。
