# AI-Workpench 三客户端协作规则

## 项目仓库

- GitHub 仓库：https://github.com/woyexiangguolikai/AI-Workpench
- 本地远端：`origin = https://github.com/woyexiangguolikai/AI-Workpench.git`
- 默认分支：`main`

## 总原则

本项目采用 Codex + ZCode + Reasonix 三客户端协作模式。所有状态以项目文件为准，不依赖聊天记录。

## 角色

| 角色 | 职责 |
| --- | --- |
| 用户 | 提供业务目标、确认需求、最终拍板 |
| Codex | 中央大脑：需求分析、任务拆解、架构设计、验收、总编排 |
| ZCode | 前端/UI、浏览器验证、文档/PDF/Word 类产出 |
| Reasonix | 独立实现、自动化测试、代码审查、修复和复盘 |

## 强制流程

1. 先读取 `docs/agents/README.md`。
2. 只执行 `docs/agents/tasks/` 中分配给自己的任务。
3. 每个任务只有一个 `owner`，同一时间只允许一个智能体处理。
4. 只修改任务文件“允许修改”范围内指定的内容。
5. 完成后必须写 `docs/agents/status/<task>-<agent>.md`。
6. 状态只能是 `pending`、`in_progress`、`needs_review`、`done`、`blocked`。
7. Codex 未验收前，任务不能自行关闭。
8. 遇到冲突、测试失败、需求不明确，停止并写 `blocked`。

## 项目目录规范

```text
AI-Workpench/
  AGENTS.md
  START-HERE.md
  docs/
    agents/
      README.md
      decisions.md
      tasks/
        T001-xxx.md
      status/
        T001-zcode.md
  src/
  tests/
```

## Codex 中央大脑职责

- 负责需求澄清、PRD、技术方案和任务拆解。
- 创建 `docs/agents/tasks/T###-xxx.md`，写清 owner、范围、验收标准。
- 负责把任务交给 ZCode 或 Reasonix。
- 负责检查状态文件、运行测试、验收和关闭任务。
- 当其他客户端提交 `needs_review` 时，Codex 决定通过、退回或改派。

## ZCode 职责

- 前端页面、UI 交互、浏览器验证。
- 使用 `browser-use` 做页面测试和截图验证。
- 负责文档类产出：Word、PDF、PPT。
- 只处理 `owner: zcode` 的任务。

## Reasonix 职责

- 后端/全栈独立实现。
- 自动化测试和回归验证。
- 使用内置 `review`、`security-review` 子智能体审查代码。
- 只处理 `owner: reasonix` 的任务。

## 客户端入口

ZCode 无界面执行：

```powershell
node D:\ZCode\resources\glm\zcode.cjs --cwd "D:\Codex Product\AI-Workpench" --prompt "读取 docs/agents/tasks/T001-xxx.md 并完成任务" --mode build --json
```

Reasonix 无界面执行：

```powershell
D:\Reasonix\reasonix-cli.exe run "读取 docs/agents/tasks/T001-xxx.md 并完成任务" --dir "D:\Codex Product\AI-Workpench" --permission-mode build --output-format json
```

## 禁止事项

- 禁止 push、部署、发布、购买服务、修改第三方资源。
- 禁止把 API Key、密码、令牌写入项目文件或报告。
- 禁止两个智能体同时修改同一个文件。
- 禁止未经过 Codex 审查就宣称任务完成。
