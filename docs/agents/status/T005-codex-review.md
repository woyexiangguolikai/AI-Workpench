# T005 Codex 验收退回意见

## 状态

未通过，退回 Reasonix 继续修复。

## Codex 复验结果

- `npm.cmd test`：58/58 通过。
- `npm.cmd run build`：通过。
- 实现链路方向正确：`directory:listFiles` → `material-loader` → 工作台数据。

## 必须修复的问题

### 1. 渲染进程不能使用 Node `Buffer`

`src/lib/material-loader.ts` 中使用了 `Buffer.from(...).toString('base64')` 生成 ID。
该模块会被 Vite 打进 React 渲染进程，而 Electron 当前配置为 `contextIsolation: true`、`nodeIntegration: false`，渲染进程没有 Node `Buffer`。

后果：在桌面版选择真实目录后，`loadRealFiles` 会在映射阶段抛出 `Buffer is not defined`，用户仍然看不到真实材料。

要求：

- 使用浏览器安全的稳定 ID 生成方式，例如基于路径的简单哈希或 `encodeURIComponent` 截断，禁止依赖 Node `Buffer`。
- 增加一个在浏览器/jsdom 环境下运行的真实映射测试，确认不依赖 Node 全局对象。

### 2. 空目录和加载失败不能回退到演示数据

当前实现仍存在演示数据回退：

- `App.tsx` 中 `setRealProjects(prjs.length > 0 ? prjs : demoProjects)`；
- `App.tsx` 中 `setKnowledge(kn.length > 0 ? kn : demoKnowledge)`；
- `ProjectsView.tsx` 中 `projects.length > 0 ? projects : demoProjects`。

后果：用户选择了一个空目录，或真实文件加载失败后，客户/项目和知识库仍会显示与所选目录无关的演示内容，不符合 T005 验收标准第 3 条。

要求：

- Electron 模式下只有“尚未选择真实目录”或“浏览器预览模式”才允许使用演示数据。
- 已选择目录但扫描结果为空时，各页面显示真实空状态。
- 已选择目录但加载失败时，显示错误和空状态，不展示演示数据。
- 增加空目录选择测试，断言不出现 `北城医科大学`、`华东国企园区`、`同济医院` 等演示内容。

### 3. 补主进程目录文件列表测试

当前测试只覆盖了 `material-loader` 映射函数和 App 的 mock 行为，没有覆盖 `electron/main.cjs` 中的 `listFiles`。

要求：

- 把目录遍历逻辑提取为可测试的纯函数，或增加主进程侧测试；
- 至少覆盖正常文件、子目录、隐藏文件忽略、路径白名单校验。

## 重新提交流程

修复后：

1. 更新 `docs/agents/status/T005-reasonix.md`，记录本次退回修复内容。
2. 将 `docs/agents/tasks/T005-目录材料加载替换演示数据.md` 状态保持为 `needs_review`。
3. 再次提交 Codex 验收。
