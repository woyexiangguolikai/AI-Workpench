---
task_id: T001
title: 任务标题
owner: zcode
status: pending
depends_on: []
---

## 目标

一句话说明这个任务要完成什么。

## 允许修改

- src/xxx/
- tests/xxx/

## 禁止修改

- src/payment/
- docs/decisions.md

## 验收标准

1. 功能按需求完成。
2. 自动化测试通过。
3. 不影响现有功能。

## 完成时输出

1. 修改代码。
2. 写 `docs/agents/status/T001-zcode.md` 或 `docs/agents/status/T001-reasonix.md`。
3. 将本文件 `status` 改为 `needs_review` 或 `blocked`。
