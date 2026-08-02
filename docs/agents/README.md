# AI-Workpench 智能体任务板说明

## 项目仓库

- GitHub 仓库：https://github.com/woyexiangguolikai/AI-Workpench
- 本地远端：`origin = https://github.com/woyexiangguolikai/AI-Workpench.git`
- 默认分支：`main`

## 任务生命周期

```text
pending -> in_progress -> needs_review -> done
                          |
                          +-> blocked
```

## 文件命名

- 任务文件：`docs/agents/tasks/T001-简短描述.md`
- 状态文件：`docs/agents/status/T001-zcode.md`
- 状态文件：`docs/agents/status/T001-reasonix.md`

## 任务文件必须包含

```yaml
task_id: T001
title: 一句话标题
owner: zcode
status: pending
depends_on: []
```

然后写清楚：

- 目标
- 允许修改的目录和文件
- 禁止修改的目录和文件
- 验收标准
- 完成时输出什么

## 状态文件必须包含

- 执行者
- 实际完成内容
- 修改的文件
- 测试命令和结果
- 未解决问题
- 给 Codex 的下一步建议

## 交接检查清单

1. 任务文件中的 `status` 是否更新。
2. 状态文件是否写入 `docs/agents/status/`。
3. 是否只修改了允许范围。
4. 是否运行了验收标准要求的测试。
5. 是否没有写入密钥。
6. 是否需要用户或 Codex 确认。

## 冲突处理

如果发现同一个文件正被另一个智能体修改，立即停止，不要覆盖。

在状态文件中写：

```text
status: blocked
reason: 文件冲突或任务边界不明确
```

## 当前客户端交接说明

ZCode 与 Reasonix 的具体职责、执行顺序、提示词、状态文件和验收口径见 `docs/agents/CLIENT-BRIEF.md`。
