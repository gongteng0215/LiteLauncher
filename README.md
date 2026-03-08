# LiteLauncher

Last updated: 2026-03-08
Version baseline: `v1.0.9`

LiteLauncher is a lightweight desktop launcher built with `Electron + TypeScript + SQLite`.
It focuses on one fast loop: **invoke -> search -> run**.

## English

### What It Does

- Global invoke shortcut (`Alt+Space`, with auto fallback if occupied)
- Unified search for apps, files, folders, web actions, and command entries
- Result sections:
  - Empty input: `Recent`, `Pinned`, `Plugins`
  - With input: `Search`, `Pinned`, `Plugins`
- Search loading feedback and result paging for non-empty queries
- Search scope prefixes: `app:`, `cmd:`, `web:`, `plugin:`
- Keyboard-first flow (`Enter` run, `Esc` clear/hide, arrow navigation)
- Grouped settings page: `Search Display`, `Index Scan`, `System`, `Error Logs`
- Context menu on result cards:
  - Pin / Unpin
  - Run as administrator (Windows UAC, with popup/cancel/failure feedback)
  - Open containing folder

### Search Features

- Prefix, substring, and fuzzy matching
- Chinese support with initials and pinyin fragment matching
  - Example: `b` -> `百度`
  - Example: `bai` -> `百度`
- Noisy long random input suppression to reduce irrelevant hits
- Search source expansion:
  - Optional `Program Files` scanning
  - Custom scan directories
  - Excluded scan directories
  - Result include/exclude path filters
  - Rebuild index from Settings without restart

### Built-in Panels

- Clipboard history (`clip`)
- Settings (`settings`)
- Plugin panel framework (`command:plugin:*` routing)
- Unified error log viewer in Settings
- Error capture from Main / Renderer / IPC / execute flow

### Plugins Currently Visible

1. `cashflow-game` (富爸爸现金流)
2. `webtools-password` (密码工具)
3. `webtools-cron` (Cron 生成器)
4. `webtools-json` (JSON 工具)
5. `webtools-crypto` (加密工具)
6. `webtools-jwt` (JWT 调试器)

### Plugin Migration Status

- 19 WebTools plugin folders already exist under `src/main/plugins/`.
- Only the 6 plugins above are exposed in the launcher UI.
- Remaining plugins are hidden by design until parity and UI quality checks are complete.

### Next Focus

1. Finish the first hidden WebTools batch: `timestamp`, `regex`, `url-parse`, `qrcode`
2. Add automated regression for search, settings, and visible plugins
3. Continue splitting plugin panel logic out of `renderer.ts`
4. Implement Cashflow review (`cash review`)

### Common Commands

- `calc 1+2*3` Calculate and copy
- `g keyword` Web search
- `clip` Open clipboard panel
- `settings` Open settings panel
- `cashflow` / `cash` / `cf` / `现金流` Open Cashflow Lite
- `cash stat` Show game stats
- `cash ai` Enable AI mode
- `cash review` Review entry (placeholder)
- `wt-pass` Open password tool
- `wt-cron` Open cron tool
- `wt-json` Open JSON tool
- `wt-crypto` Open crypto tool
- `wt-jwt` Open JWT tool
- `exit` Quit app

### Requirements

- Node.js 22 LTS (recommended)
- pnpm 10+
- Windows 11 (primary target)
- macOS (development and packaging templates supported)

### Development

```bash
pnpm install
pnpm run build
pnpm start
```

Type check:

```bash
pnpm run typecheck
```

Cashflow tests:

```bash
pnpm run test:cashflow
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
Note: Desktop shortcut icon changes take effect after rebuilding and reinstalling.

## 中文

### 项目简介

LiteLauncher 是基于 `Electron + TypeScript + SQLite` 的轻量桌面启动器，核心链路是：**唤起 -> 搜索 -> 执行**。

### 当前已实现

- 全局快捷键唤起（默认 `Alt+Space`，冲突自动回退）
- 统一搜索执行（应用、文件、文件夹、网页、命令）
- 分区展示：`最近访问`、`置顶`、`插件`
- 搜索状态分区保留：`搜索结果` + `置顶` + `插件`
- 输入检索时显示加载反馈，并支持搜索结果分页
- 支持范围前缀过滤：`app:`、`cmd:`、`web:`、`plugin:`
- 图标网格、键盘导航、鼠标点击执行
- 结果卡右键菜单：
  - 置顶/取消置顶
  - 管理员运行（Windows UAC，可区分授权弹出/取消/失败）
  - 打开所在位置
- 中文搜索增强（首字母 + 拼音片段）
- 剪贴板历史面板（搜索、复制、删除、清空）
- 设置面板：
  - 分组布局：搜索展示 / 索引扫描 / 系统 / 错误日志
  - 搜索展示数量
  - 索引扫描源（Program Files / 自定义目录）
  - 排除扫描目录
  - 结果白名单目录 / 黑名单目录
  - 重建索引
  - 开机启动
  - 错误日志查看/清空
- 统一错误日志：Main / Renderer / IPC / 执行链路异常都会记录
- 托盘菜单（显示主窗口、退出）

### 当前对外可见插件

1. 富爸爸现金流（`cashflow-game`）
2. 密码工具（`webtools-password`）
3. Cron 生成器（`webtools-cron`）
4. JSON 工具（`webtools-json`）
5. 加密工具（`webtools-crypto`）
6. JWT 调试器（`webtools-jwt`）

### WebTools 迁移现状

- `src/main/plugins/` 下已创建 19 个 WebTools 插件目录。
- 为保证质量，当前仅开放 6 个插件入口。
- 未完成插件保持隐藏，避免影响主界面稳定性与体验一致性。

### 下一步重点

1. 优先补齐第一批高频隐藏插件：`timestamp`、`regex`、`url-parse`、`qrcode`
2. 建立搜索、设置页、可见插件自动回归
3. 继续拆分 `renderer.ts` 中的插件面板逻辑
4. 落地 Cashflow `cash review` 复盘模块

### 常用输入命令

- `calc 1+2*3`：计算并复制
- `g 关键词`：网页搜索
- `clip`：打开剪贴板历史
- `settings`：打开设置
- `cashflow` / `cash` / `cf` / `现金流`：打开现金流游戏
- `cash stat`：查看统计
- `cash ai`：开启 AI 对战
- `cash review`：复盘入口（占位）
- `wt-pass`：打开密码工具
- `wt-cron`：打开 Cron 工具
- `wt-json`：打开 JSON 工具
- `wt-crypto`：打开加密工具
- `wt-jwt`：打开 JWT 工具
- `exit`：退出程序

### 开发命令

```bash
pnpm install
pnpm run build
pnpm start
pnpm run typecheck
```

Cashflow 回归测试：

```bash
pnpm run test:cashflow
```

### 打包命令

```powershell
pnpm.cmd run pack
pnpm.cmd run dist:win
pnpm.cmd run dist:win:portable
```

macOS（需在 macOS 主机执行）：

```bash
pnpm run dist:mac
pnpm run dist:mac:arm64
pnpm run dist:mac:x64
```

产物目录：`release/`

Windows 安装图标来源：`src/assets/icon.ico`
说明：桌面快捷方式图标更新需要重新打包并重新安装后生效。

## Project Structure

```text
src/
  main/       # 主进程（窗口、IPC、数据库、插件）
  preload/    # 桥接层
  renderer/   # UI 层
  shared/     # 类型与通道
scripts/
  copy-assets.cjs
docs/
  cashflow-game/
```

## 文档索引

- `PRD_LiteLauncher.md`
- `TASKS_LiteLauncher.md`
- `docs/plugin-development-spec.md`
- `docs/webtools-plugin-migration-plan.md`
- `docs/work.md`
- `docs/cashflow-game/cashflow-prd.md`
- `docs/cashflow-game/cashflow-tasks.md`
- `docs/cashflow-game/cashflow-mvp-regression.md`

## License

ISC
