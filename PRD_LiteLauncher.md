# 产品需求文档（PRD）：LiteLauncher（基础版 uTools）

## 0. 版本与目标

- **产品名称**：LiteLauncher（暂定）
- **目标平台**：Windows 11（MVP），预留 macOS / Linux 扩展能力
- **技术建议**：Electron + TypeScript + SQLite
- **MVP 目标**：实现「一键唤起 → 输入 → 搜索 → 执行动作」的桌面启动器
- **产品定位**：轻量、高响应、可扩展的效率工具（uTools 基础能力集）

### 核心性能指标
- 热启动唤起时间：≤ 150ms
- 输入后候选列表刷新：≤ 50ms（Top 20）
- 单次动作执行：≤ 300ms（视系统环境）

---

## 1. 用户画像与使用场景

### 1.1 用户画像
- **办公用户**：频繁打开应用、文件夹、文档、网页
- **开发者**：快速打开项目目录、常用工具、脚本

### 1.2 核心使用场景
1. `Alt + Space` → 输入 `ch` → 打开 Chrome  
2. 输入 `work` → 打开 `D:\Work`  
3. 输入 `g ChatGPT` → 浏览器搜索  
4. 输入 `calc 1+2*3` → 复制结果  
5. 输入 `clip` → 查看剪贴板历史  

---

## 2. MVP 功能范围（必须实现）

### 2.1 全局唤起与窗口管理

- 默认快捷键：`Alt + Space`
- 行为规则：
  - 窗口隐藏 → 显示并聚焦输入框
  - 窗口显示 → 隐藏
- 键盘交互：
  - `Enter`：执行选中项
  - `Esc`：清空输入 → 再次 Esc 隐藏窗口
  - `↑ / ↓`：切换候选项
- 窗口特性：
  - 永远置顶（可配置）
  - 当前屏幕居中
  - 无边框窗口

**验收标准**
- 全屏应用下仍可唤起
- 输入框默认自动聚焦

---

### 2.2 搜索框与候选列表

#### 输入框
- 支持中文 / 英文 / 数字 / 符号
- 支持粘贴

#### 候选列表
- 默认显示最近使用项（Top 10）
- 输入后显示匹配结果（Top 20）
- 每项展示：
  - 图标
  - 标题
  - 副标题（路径 / 描述）
  - 类型标识

#### 支持的候选类型（MVP）
- Application（应用）
- Folder（文件夹）
- File（文件）
- Web（网址）
- Command（内置命令）

---

### 2.3 资源索引与数据来源

#### 2.3.1 应用程序索引（Windows）

**来源**
- Start Menu：
  - `%APPDATA%\Microsoft\Windows\Start Menu\Programs`
  - `%PROGRAMDATA%\Microsoft\Windows\Start Menu\Programs`

**索引字段**
- id
- name
- path
- icon
- keywords

**刷新策略**
- 启动时扫描
- 设置页手动「重建索引」

---

#### 2.3.2 文件 / 文件夹索引（MVP）

**策略**
- 用户在设置中指定扫描目录
- 不做全盘索引

**默认索引**
- 文件夹
- 常见文档类型：`.md .txt .pdf .docx .xlsx`

**默认排除**
- `node_modules`
- `.git`
- `target`
- `dist`

**索引字段**
- id
- name
- fullPath
- type（file / folder）
- mtime

---

### 2.4 动作执行（Action）

#### 应用（App）
- 行为：启动应用
- 方法：系统默认方式打开

#### 文件 / 文件夹
- 行为：用系统默认程序打开

#### Web
- 行为：浏览器打开 URL

#### 内置命令（MVP）
- `calc <expr>`：计算表达式并复制结果
- `clip`：打开剪贴板历史
- `settings`：打开设置页
- `exit`：退出应用

执行完成后窗口默认隐藏（可配置）。

---

### 2.5 剪贴板历史（文本版）

- 监听系统剪贴板（仅文本）
- 保存最近 N 条（默认 50）
- 支持：
  - 搜索过滤
  - Enter 复制
  - 删除单条 / 清空全部

---

### 2.6 设置页面

#### 基础设置
- 快捷键设置（冲突检测）
- 开机自启开关

#### 索引设置
- 扫描目录管理
- 排除规则编辑
- 重建索引按钮

#### 行为设置
- 执行后是否隐藏
- 窗口是否置顶
- 候选项数量

---

## 3. 搜索与排序规则

### 3.1 匹配策略
- 前缀匹配
- 子串匹配
- 模糊匹配（fuzzy）
- 历史使用加权
- 最近使用加权

### 3.2 排序评分示例

score = matchScore * 0.7 + usageScore * 0.2 + recencyScore * 0.1


---

## 4. 非功能性需求

### 4.1 性能
- UI 不可阻塞
- 索引与搜索运行在 Worker 线程

### 4.2 稳定性
- 崩溃不丢配置
- 索引可重建

### 4.3 安全
- renderer 禁用 Node
- 所有系统能力走 main 进程
- preload 暴露最小 API

---

## 5. 数据结构设计（SQLite）

### 表结构

#### settings
- key
- value

#### items（统一索引表）
- id
- type
- title
- subtitle
- target
- iconPath
- keywords
- updatedAt

#### usage
- itemId
- count
- lastUsedAt

#### clip_items
- id
- content
- hash
- createdAt

---

## 6. 核心交互流程

### 主流程
1. 快捷键唤起
2. 输入关键字
3. 列表实时更新
4. Enter 执行动作
5. 记录使用历史
6. 窗口隐藏

---

## 7. 项目里程碑（建议）

### Milestone 1
- Electron 骨架
- 全局快捷键
- 输入框 + 列表

### Milestone 2
- 应用索引
- 打开动作
- 使用记录

### Milestone 3
- 文件索引
- 设置页
- 索引重建

### Milestone 4
- 剪贴板历史
- 内置命令

---

## 8. 未来扩展（非 MVP）

- 插件系统（JS）
- OCR / 截图 / 翻译
- AI Tool Calling
- 本地知识库 / RAG

---
