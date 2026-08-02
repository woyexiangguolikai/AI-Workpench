# T004 状态报告 — Reasonix

## 执行者

Reasonix（独立实现 & 自动化测试）

## 复现结果

在 Electron 桌面版 (`npm run desktop`) 中点击"选择目录"：
1. 原生目录选择框正常弹出 ✅
2. 选择目录后路径更新到 `selectedFolder` 状态 ✅
3. 调用 `addAllowedDir` + `directory.scan` 时，若扫描失败，**仅弹出 2.6 秒 Toast**，用户几乎看不到，界面恢复空白状态 ❌

## 根因

`src/App.tsx` 中 `handleSelectFolder` 的 catch 块（原第 90-92 行）：

```ts
} catch (_) {
  showToast('目录已选择，但扫描失败');
}
```

两个问题：
1. **`catch (_)` 静默丢弃错误详情** — 用户和开发者都无法了解失败原因。
2. **仅用短暂 Toast 提示** — 2.6 秒后消失，`folderSummary` 为 null，用户看到的界面与操作前几乎无差异（仅 topbar 中较小的文件路径文字变化），感觉"没有任何变化"。

## 修复

### 1. 持久化错误状态 (`src/App.tsx`)

- 新增 `folderError` state（`useState<string | null>(null)`）
- catch 块中：`setFolderSummary(null)` + `setFolderError('扫描失败：...')` + 附带具体错误消息的 Toast
- 成功时：`setFolderError(null)` + `setFolderSummary(summary)`
- 取消选择时：不改变 `folderError`（保留原状态）
- header 区域新增红色错误 banner（`role="alert"`），含 AlertTriangle 图标、错误详情和 XCircle 关闭按钮

### 2. CSS 样式 (`src/styles.css`)

新增 `.folder-error` 样式：红色背景、边框、14px 图标、可关闭按钮

### 3. 回归测试 (`src/App.test.tsx`)

新增 6 个测试用例，从原来的 5 个增加到 11 个：

| 测试 | 场景 | 预期 |
|------|------|------|
| Electron 模式：成功选目录 | `mockDesktop` → 点击"选择目录" | 路径更新 + 扫描结果显示 + Toast |
| Electron 模式：取消 | `selectDirectory` 返回 null | 保留原目录不变，无扫描结果，无错误 |
| Electron 模式：扫描失败 | `directory.scan` 抛异常 | 持久化错误 banner 出现 + Toast 提示 |
| 错误可关闭 | 点击错误 banner 的 X 按钮 | 错误消失 |
| 设置页显示目录 | 选目录后切换到设置 | 设置页显示路径和扫描统计 |
| 浏览器预览模式 | 无 `window.desktop` | 演示目录 + 28 文件 |

测试使用 `mockDesktop()` 辅助函数模拟 Electron 的 `window.desktop` API。

## 修改的文件

| 文件 | 变更 |
|------|------|
| `src/App.tsx` | 新增 `folderError` state、导入 `AlertTriangle`/`XCircle`、catch 块暴露错误详情、header 新增持久错误 banner |
| `src/styles.css` | 新增 `.folder-error` / `.error-dismiss` 样式 |
| `src/App.test.tsx` | 新增 6 个回归测试（11 total）、`mockDesktop`/`clearDesktop` 辅助函数 |
| `docs/agents/status/T004-reasonix.md` | 本文件 |
| `docs/agents/tasks/T004-目录选择无变化修复.md` | 状态更新为 `needs_review` |

## 测试命令和结果

```
npx vitest run
```

```
✓ tests/file-parser.test.ts   (11 tests)
✓ tests/deepseek-api.test.ts  (6 tests)
✓ tests/sqlite.test.ts        (4 tests)
✓ tests/obsidian-vault.test.ts (8 tests)
✓ src/lib/workbench.test.ts   (4 tests)
✓ src/App.test.tsx            (11 tests)

Test Files  6 passed (6)
     Tests  44 passed (44)
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
| 桌面版点击"选择目录"后能打开原生目录选择框 | ✅ IPC `dialog:selectDirectory` 正常 |
| 选择已存在目录后，顶部"当前资料目录"立即更新 | ✅ `setSelectedFolder` 在 `applyFolder` 中调用 |
| 目录扫描成功显示文件汇总；失败显示持久化错误 | ✅ `folderError` 红色 banner 含关闭按钮 |
| 取消目录选择时，原有目录保持不变 | ✅ `if (!folder) return` 保持原值 |
| 增加自动化回归测试 | ✅ 11 个测试，覆盖 Electron + 浏览器模式 |
| `npm test` 全部通过 | ✅ 44/44 |
| `npm run build` 通过 | ✅ tsc -b + vite build |
| 不写入 API Key 或密码 | ✅ |

## 未解决问题

无。

## 给 Codex 的下一步建议

1. 验收测试（44/44）和构建。
2. 在桌面环境运行 `npm run desktop` 验证选择目录后错误 banner 显示和关闭行为。
3. 确认通过后关闭 T004。

## Codex 验收结果

2026-08-02 Codex 验收通过：`npm.cmd test` 44/44 通过，`npm.cmd run build` 通过。最终修复将随 `v0.1.7` Release 发布。T004 已标记为 `done`。
