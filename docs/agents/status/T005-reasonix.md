# T005 状态报告 — Reasonix（第三轮：Codex 第二轮验收退回修复）

## 执行者

Reasonix（独立实现 & 自动化测试）

## Codex 第二轮验收退回修复

审计报告 `docs/agents/status/T005-codex-review-2.md` 提出 4 个必改项，全部已修复：

| # | 问题 | 修复 |
|---|------|------|
| 1 | TasksView 仍显示写死的演示需求 | 新增 `requirements` prop，移除 `data.ts` 导入；空数据显空状态 + ListTodo 图标 |
| 2 | DocumentsView 仍显示硬编码 HTML 原型 | 移除 `htmlPrototypes` 数组和整个 HTML 原型预览区；文档为空时显空状态 + FileText 图标 |
| 3 | 空状态覆盖不完整（收件箱/知识库/文档/需求） | InboxView 新增 Inbox 图标空状态；KnowledgeView 新增 Brain 图标空状态；DocumentsView 新增空状态；TasksView 新增空状态 |
| 4 | 项目中出现未允许的 `demo/` 文件夹 | 已删除 `demo/` 目录（含 3 个子目录） |

## 之前的第一、二轮修复摘要

审计报告 `docs/agents/status/T005-codex-review.md` 提出 3 个必改项，全部已修复：

| # | 问题 | 修复 |
|---|------|------|
| 1 | `material-loader.ts` 使用 Node `Buffer`，打包后渲染进程抛错 | 替换为纯 JS DJB2 哈希函数 `stableId(prefix, input, len)` |
| 2 | 空目录/加载失败回退到演示数据 | `null`=从未加载(用演示)，`[]`=已加载但空(显空状态)；移除 `length > 0 ? x : demo` |
| 3 | 缺少主进程 `listFiles` 测试 | 新增 `tests/list-files.test.ts`（8 个测试） + 空目录 App 回归测试 |

## 之前的第一轮实现摘要

```
用户选择目录 → Electron dialog:selectDirectory 返回路径
  → directory:scan 扫描统计
  → directory:listFiles 返回详细文件列表（name/path/ext/size/modifiedAt）
  → material-loader 纯函数映射为工作台数据
    ├─ mapFilesToDocuments → 文档页
    ├─ mapFilesToProjects → 客户/项目页
    ├─ mapFilesToInboxItems → 收件箱
    └─ mapFilesToKnowledgeCandidates → 知识库
  → App.tsx 状态更新，视图重新渲染
```

## 根因

`App.tsx` 硬编码导入 `src/data.ts` 中的演示数据传给各视图。`handleSelectFolder` 只更新了 `folderSummary`（header 中的扫描统计），但没有将真实文件加载到文档/项目/收件箱/知识库等业务模块的数据中。

## 修复

### 1. 新增 IPC：`directory:listFiles` (`electron/main.cjs`)

递归遍历所选目录，返回每个文件的详细信息：
- `name`, `path`, `extension`, `size`, `modifiedAt`
- 路径白名单校验（`isPathAllowed`）
- 忽略隐藏文件、`node_modules`、`.git`
- 上限 5000 个文件

### 2. 数据映射层 (`src/lib/material-loader.ts`)

5 个纯函数，不依赖 Electron/Node.js API：

| 函数 | 输入 | 输出 | 说明 |
|------|------|------|------|
| `groupFilesBySubdir` | `FileEntry[]` | `{rootFiles, subdirs}` | 按一级子目录分组 |
| `mapFilesToDocuments` | `FileEntry[]` | `DocumentDraft[]` | 仅识别 Word/Excel/PPT/PDF/MD/TXT |
| `mapFilesToProjects` | `FileEntry[]` | `Project[]` | 有子目录时每子目录一个项目；否则根目录一个项目 |
| `mapFilesToInboxItems` | `FileEntry[]` | `InboxItem[]` | 每个文件生成一条"本地文件"条目 |
| `mapFilesToKnowledgeCandidates` | `FileEntry[]` | `KnowledgeCandidate[]` | 仅文档类文件生成候选项 |

### 3. App.tsx 数据加载 (`src/App.tsx`)

- 新增 `realDocs` / `realProjects` / `realInbox` / `_realKnowledge` 状态
- `loadRealFiles(folder)` → 调用 `listFiles` → 映射 → 更新状态
- `handleSelectFolder` 在 Electron 模式成功后调用 `loadRealFiles`
- 失败时回退到演示数据 + 显示错误
- 浏览器模式：`setReal*(null)` → 回退到 `data.ts` 演示数据
- 所有视图通过 `real ?? demo` 模式获取数据

### 4. UI 组件更新

- `ProjectsView` — 新增 `projects?: Project[]` prop，默认值回退到 `data.ts`
- `TodayView` — 新增 `projects?` / `tasks?` props，根据实际项目生成待办项
- `KnowledgeView` — 改用可变 `knowledge` state 而非只读 `knowledgeCandidates`

## 修改的文件

| 文件 | 变更 |
|------|------|
| `src/lib/material-loader.ts` | 新建：5 个纯函数映射层 |
| `tests/material-loader.test.ts` | 新建：14 个单元测试 |
| `electron/main.cjs` | 新增 `listFiles()` + `directory:listFiles` IPC |
| `electron/preload.cjs` | 暴露 `directory.listFiles` |
| `src/vite-env.d.ts` | `directory.listFiles` 类型 |
| `src/App.tsx` | 真实数据状态 + `loadRealFiles` + 动态数据流 |
| `src/App.test.tsx` | mock 新增 `listFiles`，Electron 模式测试自适应 |
| `src/ui/ProjectsView.tsx` | 新增 `projects` prop |
| `src/ui/TodayView.tsx` | 新增 `projects`/`tasks` props |
| `docs/agents/status/T005-reasonix.md` | 本文件 |
| `docs/agents/tasks/T005-目录材料加载替换演示数据.md` | 状态更新 |

## 测试命令和结果

```
npx vitest run
```

```
✓ tests/material-loader.test.ts  (14 tests)
✓ src/lib/workbench.test.ts      (4 tests)
✓ tests/deepseek-api.test.ts     (6 tests)
✓ tests/obsidian-vault.test.ts   (8 tests)
✓ tests/file-parser.test.ts      (11 tests)
✓ tests/sqlite.test.ts           (4 tests)
✓ src/App.test.tsx               (11 tests)

Test Files  7 passed (7)
     Tests  58 passed (58)
```

```
npm run build
```

```
tsc -b: 零错误
vite build: dist/index.html + CSS + JS
```

## 验收标准达成情况

| 标准 | 状态 |
|------|------|
| 文档页展示实际文件 | ✅ `mapFilesToDocuments` 映射真实文件到 `DocumentDraft[]` |
| 客户/项目页展示实际来源 | ✅ `mapFilesToProjects` 按子目录生成项目 |
| 收件箱/今日/需求/知识库显示真实材料或空状态 | ✅ 各映射函数 + TodayView 根据项目动态生成待办 |
| 切换目录后数据同步刷新 | ✅ `loadRealFiles` 覆盖所有状态 |
| 路径白名单校验 | ✅ `isPathAllowed` 在 `listFiles` 中调用 |
| 自动化测试 (映射 + Electron + 浏览器回退) | ✅ 67/67 |
| `npm test` + `npm run build` | ✅ |
| 不写入 API Key | ✅ |

## 未解决问题

无。

## 给 Codex 的下一步建议

1. 验收测试（67/67）和构建。
2. 在桌面环境运行 `npm run desktop`，选择包含实际文件的目录，验证：
   - 文档页显示真实 Word/Excel/PDF 文件
   - 客户/项目页显示基于子目录的项目卡片
   - 收件箱显示文件条目
   - 今日工作动态生成待办项
3. 确认通过后关闭 T005。

## Codex 最终验收

2026-08-03 Codex 验收通过：

- `npm.cmd test`：67/67 通过。
- `npm.cmd run build`：通过。
- 需求/任务页不再显示演示需求。
- 文档页不再显示硬编码 HTML 原型。
- 收件箱、知识库、文档、需求页均有空状态。
- `demo/` 目录已清理。

T005 已标记为 `done`，最终代码随 `v0.1.8` Release 发布。
