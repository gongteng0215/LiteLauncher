# LiteLauncher（最小可用版本）

LiteLauncher 是一个基于 `Electron + TypeScript + SQLite` 的轻量桌面启动器。

当前目标平台：
- Windows 11（最小可用版本）

后续计划：
- macOS / Linux

## 当前已经实现的功能

- 全局唤起窗口（优先 `Alt+Space`，冲突会自动回退快捷键）
- 键盘交互（`Enter`、`Esc`、`Up`、`Down`、`Left`、`Right`）
- 应用索引（Windows 开始菜单）
- 搜索匹配与排序（匹配分 + 使用分 + 最近分）
- 搜索计算在 `Worker` 线程执行
- 动作执行（应用/文件/文件夹/网页）
- 内置命令：`calc`、`clip`、`settings`、`exit`
- 剪贴板历史（仅文本）：搜索、复制、删除、清空
- SQLite 持久化（`settings`、`items`、`usage`、`clip_items`）
- 搜索首页三分区：
  - `最近访问`（最多 20）
  - `推荐`（最多 20）
  - `插件`（最多 20）
- 搜索结果改为图标网格（每行 10 个）
- 系统托盘图标与右键菜单（显示主页面、退出）
- 图标加载容错（无法解析时回退为文字图标，避免坏图占位）

## 当前可直接输入测试

先唤起窗口，然后在输入框测试：

- `ch`：匹配并打开 Chrome（前提是开始菜单有该应用快捷方式）
- `calc 1+2*3`：计算并复制结果
- `g ChatGPT`：浏览器搜索
- `clip`：进入剪贴板历史面板
- `settings`：进入设置面板（当前仅占位）
- `exit`：退出程序

## 搜索与自动检索说明

- 搜索模式下是“输入即检索”，每次输入变化都会自动刷新结果
- 输入为空时展示首页三分区（最近访问/推荐/插件）
- 输入非空时展示“搜索结果”分区
- 点击任一图标会立即执行该项

## 为什么你会感觉“没有自动检索”

当前版本的自动检索范围是有限的，不是“任意内容都能搜到”：

- 目前只做了“开始菜单应用索引”，还没做“自定义目录文件索引”（任务 `T15`~`T17` 未完成）
- 所以输入普通文件名、项目目录名时，常见情况是 0 结果
- 网页搜索目前是命令形式，需要以 `g ` 开头（例如 `g vscode`）
- 如果你刚进入了 `settings` 面板，输入框不会走正常搜索；按一次 `Esc` 回到搜索面板

## 运行方式（pnpm）

环境要求：
- Node.js 22+
- pnpm 10+
- Windows 11

安装依赖：

```bash
pnpm install
```

类型检查：

```bash
pnpm run typecheck
```

构建：

```bash
pnpm run build
```

运行：

```bash
pnpm start
```

或使用一键按键调试启动：

```bash
pnpm run start:debug-keys
```

## 按键调试模式（排查 Enter/Esc 无响应）

开启方式（PowerShell）：

```powershell
$env:LITELAUNCHER_DEBUG_KEYS='1'; pnpm start
```

开启后你会看到两类调试信息：
- 终端日志：主进程捕获到的按键事件（`before-input-event`）
- 窗口右下角调试面板：主进程与渲染层按键日志

可选图标调试（PowerShell）：

```powershell
$env:LITELAUNCHER_DEBUG_ICONS='1'; pnpm start
```

开启后可在终端看到图标解析命中与回退日志（`[debug:icon] ...`）。

如果按下 `Enter`/`Esc` 后终端和面板都没有日志，说明按键没有进入应用窗口（通常是焦点不在该窗口）。

## 常见问题排查

- 底部状态一直不变、列表空白：
  - 如果看到 `渲染脚本未启动，请先彻底退出 LiteLauncher 再重新执行 pnpm start`，说明渲染脚本没有成功运行。
  - 先彻底退出已运行的 LiteLauncher 进程，再执行 `pnpm start`。
- 修改代码后执行 `pnpm start` 但像“没更新”：
  - 开发模式下再次启动会自动刷新已运行实例的渲染页面。
  - 如果仍异常，优先彻底退出后再启动。
- 输入后没有结果：
  - 当前只索引开始菜单应用和内置命令。
  - 普通文件名/目录名检索要等 `T15`~`T17` 完成后才会覆盖。

## 脚本说明

- `pnpm run typecheck`：执行 TypeScript 类型检查（`tsc --noEmit`）
- `pnpm run build`：编译 TypeScript 并复制渲染层静态资源到 `dist/`
- `pnpm start`：先构建再启动 Electron

## 快捷键冲突说明

- 如果 `Alt+Space` 被占用，程序会依次尝试：
  - `Ctrl+Space`
  - `Alt+Shift+Space`
  - `Ctrl+Alt+Space`
- 你也可以手动指定快捷键（PowerShell）：

```powershell
$env:LITELAUNCHER_SHORTCUT='Ctrl+Shift+Space'; pnpm start
```

## 项目结构

```text
src/
  main/       # 主进程：IPC、数据库、索引、动作执行
  preload/    # 预加载桥接层：向渲染层暴露最小能力
  renderer/   # 界面层：输入、列表、交互
  shared/     # 跨进程共享：类型、通道、搜索逻辑
scripts/
  copy-assets.cjs
dist/         # 构建产物
```

## 文档

- 产品需求文档：`PRD_LiteLauncher.md`
- 开发任务清单：`TASKS_LiteLauncher.md`

## 许可证

ISC
