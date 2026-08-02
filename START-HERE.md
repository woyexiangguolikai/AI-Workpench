# 新对话启动指令

在新建的 Codex 对话中，直接复制下面这段：

```text
当前是 Codex + ZCode + Reasonix 三客户端协作模式。

项目目录：D:\Codex Product\AI-Workpench
项目仓库：https://github.com/woyexiangguolikai/AI-Workpench
Git 远端：origin = https://github.com/woyexiangguolikai/AI-Workpench.git

你是中央大脑，负责需求分析、任务拆解、架构设计、代码审查和总编排。
ZCode 负责前端/UI、浏览器验证、文档类产出。
Reasonix 负责独立实现、自动化测试、代码审查和修复。

请先阅读：
1. D:\Codex Product\AI-Workpench\AGENTS.md
2. D:\Codex Product\AI-Workpench\docs\agents\README.md
3. D:\Codex Product\AI-Workpench\docs\agents\decisions.md

然后给我当前任务板状态和下一步建议。
```

如果你希望直接开始某个任务，追加一句：

```text
请先创建第一个任务 T001，并明确由 ZCode 还是 Reasonix 执行。
```
