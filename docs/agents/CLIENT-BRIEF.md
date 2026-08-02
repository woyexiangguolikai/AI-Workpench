# ZCode 与 Reasonix 客户端分工与交接说明

## 使用方式

1. 用户分别让 Reasonix 和 ZCode 读取本文件，再读取各自的任务文件。
2. 同一任务同一时间只允许一个客户端处理。
3. 两个客户端不得同时修改同一个文件。
4. 每个客户端完成后必须写状态文件，并把任务状态改为 `needs_review`。
5. Codex 验收通过前，任务不能关闭。

## 当前任务关系

| 任务 | 标题 | 负责人 | 状态 | 依赖 |
| --- | --- | --- | --- | --- |
| T002 | Electron + React + TypeScript 工程骨架与技术基座 | Reasonix | `done` | T001 |
| T003 | 首版 UI 壳与浏览器验证 | ZCode | `done` | T002 |

执行顺序固定为：

`Reasonix 完成 T002` → `Codex 初步检查` → `ZCode 完成 T003` → `Codex 验收和审计`

ZCode 不能在 Reasonix 提交 T002 前开始，避免修改同一批工程文件。

## Reasonix 负责 T002

Reasonix 的职责：

1. 读取 `docs/agents/README.md`、`docs/agents/CLIENT-BRIEF.md` 和 `docs/agents/tasks/T002-工程骨架与技术基座.md`。
2. 检查当前仓库中已有的临时脚手架，判断是否复用、修正或重建。
3. 搭建 Electron 主进程、React + TypeScript + Vite 前端、SQLite 本地存储、Obsidian Vault 基础读写、DeepSeek API 调用封装、文件解析基础和自动化测试。
4. 确保不读取或写入用户本地文件夹、Obsidian Vault 和第三方系统，不把 API Key 写入项目。
5. 运行 `npm.cmd test` 和 `npm.cmd run build`。
6. 写 `docs/agents/status/T002-reasonix.md`，并把 `T002` 状态改为 `needs_review`。

Reasonix 可直接执行的提示词：

```text
读取 docs/agents/CLIENT-BRIEF.md 和 docs/agents/tasks/T002-工程骨架与技术基座.md，按任务要求审查当前临时脚手架并完成工程骨架、技术基座、自动化测试和构建。完成后写 docs/agents/status/T002-reasonix.md，并把 T002 状态改为 needs_review。不要修改用户资料、Obsidian Vault、API Key 或第三方系统。
```

## ZCode 负责 T003

ZCode 的职责：

1. 等 Reasonix 完成 T002 并提交 `needs_review` 后开始。
2. 读取 `docs/agents/README.md`、`docs/agents/CLIENT-BRIEF.md` 和 `docs/agents/tasks/T003-UI壳与浏览器验证.md`。
3. 在 T002 工程骨架上实现七个主界面：今日工作、统一收件箱、客户/项目、需求与任务、文档、知识库审核、设置。
4. 实现对话式操作、结构化卡片、目录选择、甘特图、需求池、对账导入和 HTML 原型预览入口。
5. 只修改 `T003` 允许范围内的 UI 文件，不实现后端、存储和安全逻辑。
6. 保存桌面和移动端截图到 `docs/agents/verification/`。
7. 写 `docs/agents/status/T003-zcode.md`，并把 `T003` 状态改为 `needs_review`。

ZCode 可直接执行的提示词：

```text
读取 docs/agents/CLIENT-BRIEF.md 和 docs/agents/tasks/T003-UI壳与浏览器验证.md，在 T002 完成的基础上实现首版七个主界面、核心交互和浏览器验证，截图保存到 docs/agents/verification/，完成后写 docs/agents/status/T003-zcode.md，并把 T003 状态改为 needs_review。不要修改后端核心、安全配置或 API Key。
```

## 状态文件要求

状态文件统一放在 `docs/agents/status/`：

- `docs/agents/status/T002-reasonix.md`
- `docs/agents/status/T003-zcode.md`

每个状态文件必须包含：

- 执行者
- 实际完成内容
- 修改的文件
- 测试命令和结果
- 未解决问题
- 给 Codex 的下一步建议

## Codex 验收和审计清单

两个客户端都提交 `needs_review` 后，Codex 负责：

1. 读取两个状态文件。
2. 检查任务文件中的状态是否已更新。
3. 检查是否只修改了允许范围。
4. 检查是否写入 API Key、密码或令牌。
5. 运行 `npm.cmd test` 和 `npm.cmd run build`。
6. 启动桌面应用，确认基础界面可打开。
7. 核对 `T003` 截图是否符合验收要求。
8. 发现问题时退回对应客户端；通过后把任务标记为 `done`。

## 冲突处理

如果发现同一个文件正被另一个客户端修改，立即停止并写：

```text
status: blocked
reason: 文件冲突或任务边界不明确
```
