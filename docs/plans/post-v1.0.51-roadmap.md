<!--
  Source of truth for LiteLauncher planning docs.
  Implements roadmap items after v1.0.51.
-->
---
name: Post v1.0.51 Roadmap
overview: v1.0.52 JSON Schema、v1.0.53 Cashflow 复盘、v1.0.54 文本脱敏/假数据，以及文档与回归护栏。
todos:
  - id: v52-json-schema
    content: v1.0.52：JSON Schema 校验器 MVP 插件（注册 + 面板 + 回归测试）
    status: completed
  - id: v53-cash-review
    content: v1.0.53：Cashflow cash review 复盘 V1 + 决策时间线
    status: completed
  - id: v54-pick-plugin
    content: v1.0.54：文本脱敏/假数据生成插件
    status: completed
  - id: docs-roadmap-sync
    content: 同步 docs/version-roadmap.md 与 docs/plans/README.md 到 v1.0.51 基线
    status: completed
  - id: eng-debt-ongoing
    content: 穿插：renderer 瘦身批次、UI 文案巡检、E2E 扩展（不独占发版）
    status: completed
isProject: false
---

# v1.0.51 之后路线图（已落地）

## v1.0.52 — JSON Schema 校验器

- 插件：`webtools-json-schema`
- 主进程：`ajv` 校验，返回 `path` + `message`
- 面板：双栏 Schema / Payload，自动校验

## v1.0.53 — Cashflow 复盘

- `cash review` 打开复盘模式（`review: true` IPC）
- 面板：结算总结（评分 + 建议）、决策时间线、AI 对手摘要

## v1.0.54 — 文本脱敏 / 假数据

- 插件：`webtools-data-mask`
- 脱敏：手机 / 邮箱 / 身份证
- 假数据：姓名、邮箱、手机、UUID、公司名

## 工程护栏

- `webtools-json-schema-plugin.test.ts`
- `webtools-data-mask-plugin.test.ts`
- `cashflow-plugin-contract` 复盘用例
- `plugin-panel-impls-regression` 面板归属断言
