# T003-zcode 状态报告

## 执行者

ZCode (前端/UI 客户端)

## 任务

T003：首版 UI 壳与浏览器验证

## 实际完成内容

### 七个主模块（全部实现并通过浏览器验证）

| 模块 | 导航标签 | 核心功能 |
| --- | --- | --- |
| 今日工作 | `today` | 关键指标卡片、今日最该做的事（风险排序）、等待决策卡片（确认制） |
| 统一收件箱 | `inbox` | 一句话需求输入（对话式操作）、AI 识别生成结构化工作卡、收件箱列表 + 置信度 |
| 客户/项目 | `projects` | 项目档案表格、项目详情卡片、新建档案入口 |
| 需求与任务 | `tasks` | 需求池表格（需求、类型、优先级、排期、状态）、甘特图自动排期建议 |
| 文档 | `documents` | 交付文档网格、WPS 打开入口、HTML 原型预览（含导入和预览按钮） |
| 知识库审核 | `knowledge` | 候选知识列表、置信度进度条、采纳/忽略决策按钮 |
| 对账 | `reconciliation` | 月度对账表格（系统金额 vs 随行付金额）、差异高亮、Excel 导入模拟 |
| 设置 | `settings` | DeepSeek API 配置状态、Obsidian Vault 路径、资料目录选择、云端数据提示 |

### 核心交互

1. **对话式操作**：统一收件箱中粘贴一句话需求 → AI 识别生成结构化工作卡
2. **结构化卡片**：需求工作卡包含标题、项目归属、负责人、优先级、DDL、风险提示、待确认问题
3. **目录选择**：顶部栏"选择目录"按钮，浏览器模式下使用演示目录，Electron 下调用原生对话框
4. **甘特图**：任务自动排期建议，颜色编码，依赖关系感知
5. **需求池**：需求表格含类型、优先级、负责人、计划时间、状态
6. **对账导入**：导入本月 Excel（当前使用示例数据），差异自动计算和标记
7. **HTML 原型预览入口**：文档模块中包含两个原型卡片 + "导入 HTML 原型"按钮
8. **知识审核**：采纳/忽略按钮，置信度可视化进度条
9. **Toast 通知**：操作反馈（右下角弹出，2.6 秒自动消失）

### 项目结构

组件按模块拆分到 `src/ui/`：

- `src/ui/TodayView.tsx` — 今日工作
- `src/ui/InboxView.tsx` — 统一收件箱
- `src/ui/ProjectsView.tsx` — 客户/项目
- `src/ui/TasksView.tsx` — 需求与任务（含甘特图）
- `src/ui/DocumentsView.tsx` — 文档 + HTML 原型预览
- `src/ui/KnowledgeView.tsx` — 知识库审核
- `src/ui/ReconciliationView.tsx` — 对账
- `src/ui/SettingsView.tsx` — 设置
- `src/ui/MetricCard.tsx` — 公共指标卡片组件

## 修改的文件

| 文件 | 操作 | 说明 |
| --- | --- | --- |
| `src/App.tsx` | 修改 | 重构为从 `src/ui/` 导入视图组件，精简主文件 |
| `src/ui/TodayView.tsx` | 新建 | 今日工作视图组件 |
| `src/ui/InboxView.tsx` | 新建 | 统一收件箱视图组件 |
| `src/ui/ProjectsView.tsx` | 新建 | 客户/项目视图组件 |
| `src/ui/TasksView.tsx` | 新建 | 需求与任务视图组件（含甘特图） |
| `src/ui/DocumentsView.tsx` | 新建 | 文档视图 + HTML 原型预览 |
| `src/ui/KnowledgeView.tsx` | 新建 | 知识库审核视图组件 |
| `src/ui/ReconciliationView.tsx` | 新建 | 对账视图组件 |
| `src/ui/SettingsView.tsx` | 新建 | 设置视图组件 |
| `src/ui/MetricCard.tsx` | 新建 | 公共指标卡片组件 |
| `src/styles.css` | 修改 | 新增 HTML 原型预览样式和移动端增强 |
| `docs/agents/verification/T003-desktop-1280x720.png` | 新建 | 桌面端截图 (1280×720) |
| `docs/agents/verification/T003-mobile-390x844.png` | 新建 | 移动端截图 (390×844) |

## 测试命令和结果

### `npm.cmd test`

```
Test Files  6 passed (6)
     Tests  38 passed (38)
  Duration  3.57s
```

通过的所有测试文件：
- `src/lib/workbench.test.ts` — 4 tests
- `tests/file-parser.test.ts` — 11 tests
- `tests/deepseek-api.test.ts` — 6 tests
- `tests/obsidian-vault.test.ts` — 8 tests
- `tests/sqlite.test.ts` — 4 tests
- `src/App.test.tsx` — 5 tests（含导航切换、需求工作卡生成、知识审核、对账导入）

### `npm.cmd run build`

```
✓ built in 2.04s
dist/index.html          0.40 kB
dist/assets/index-*.css  9.96 kB
dist/assets/index-*.js  227.70 kB
```

TypeScript 编译和 Vite 生产构建均通过，无错误。

## 截图路径

- `docs/agents/verification/T003-desktop-1280x720.png` — 桌面端（今日工作视图，含侧边栏导航、指标卡片、待办列表、等待决策面板）
- `docs/agents/verification/T003-mobile-390x844.png` — 移动端（今日工作视图，响应式布局，侧边栏转为图标网格）

## 未解决问题

无阻塞问题。已知注意事项：

1. 当前使用本地示例数据（`src/data.ts`），未连接后端数据库 — 这是 T002 已定义的架构，实际数据绑定在后续任务中实现。
2. HTML 原型预览的"预览"按钮当前触发 toast 提示（浏览器模式下无法实际启动外部浏览器）— Electron 环境下可对接 `shell.openExternal`。
3. 目录选择在浏览器预览模式下使用演示目录，Electron 环境下通过 `preload.cjs` 调用原生对话框。

## 给 Codex 的下一步建议

1. ✅ 检查 T003 任务文件状态是否已更新为 `needs_review`
2. ✅ 检查是否只修改了允许范围（`src/ui/`, `src/App.tsx`, `src/styles.css`, `docs/agents/verification/` 等）
3. ✅ 确认未写入 API Key、密码或令牌
4. 运行 `npm.cmd test` 和 `npm.cmd run build` 复验
5. 启动桌面应用 `npm run desktop` 确认基础界面可打开（需 Electron 环境）
6. 核对 T003 截图 `docs/agents/verification/` 是否符合验收要求
7. 通过后标记 T003 为 `done`，进入 Codex 验收和审计阶段
