# LiteLauncher 计划归档

本目录是 **LiteLauncher 相关开发计划** 的仓库内真相源。  
从 Cursor 本机 `~/.cursor/plans/*.plan.md` 迁入；以后以这里为准，避免计划只留在本机。

相关设计稿仍放在 [`../superpowers/specs/`](../superpowers/specs/)、路线图见 [`../LIstSnap.md`](../LIstSnap.md) 等文档。

## 待完成

（暂无）

## 已完成

| 计划 | 文件 | 说明 |
|------|------|------|
| v1.0.51 之后路线图 | [post-v1.0.51-roadmap.md](./post-v1.0.51-roadmap.md) | JSON Schema / Cashflow 复盘 / 脱敏假数据 / 文档同步 |
| 划词翻译与离线词典 | [selection-translate-dictionary.md](./selection-translate-dictionary.md) | F2 划词 + ECDICT；设计稿另见 [selection-translate-dictionary-design](../superpowers/specs/2026-07-09-selection-translate-dictionary-design.md) |
| LiteSnap 体验三件套 | [litesnap-experience-pack.md](./litesnap-experience-pack.md) | 已随 v1.0.43 发布 |
| 拆分翻译为独立插件 | [split-translate-plugin.md](./split-translate-plugin.md) | `webtools-translate` |
| Cron 动态模板 | [cron-dynamic-templates.md](./cron-dynamic-templates.md) | |
| 主进程与渲染层性能优化 | [main-renderer-perf.md](./main-renderer-perf.md) | |
| Next Optimization Pass | [next-optimization-pass.md](./next-optimization-pass.md) | |
| Performance Followup | [performance-followup.md](./performance-followup.md) | |
| Performance Round Three | [performance-round-three.md](./performance-round-three.md) | |

## 未迁入

以下 Cursor 计划属于 **其它项目**（终端工作台 / LocalQuantLab 等），不放进本仓库：

- 聚宽式策略页体验、Web 研究台 / 第四阶段、后续开发规划（量化）
- Push and advance next-target items、UI density、SFTP 虚拟化等终端客户端计划
- LiteSnap 体验三件套的早期草稿副本（不含跨 DPI；以本目录 `litesnap-experience-pack.md` 为准）

## 维护约定

1. 新开 LiteLauncher 计划时，同步写一份到 `docs/plans/`。
2. 完成后把索引表从「待完成」挪到「已完成」，并在文内 frontmatter `todos` 改 `completed`。
3. 发版说明仍写在 `docs/releases/`。
