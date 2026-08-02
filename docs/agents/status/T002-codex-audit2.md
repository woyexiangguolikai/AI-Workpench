# T002 Codex 第二轮审计报告

## 结论

**不通过，退回 Reasonix 修复。**

## 用户反馈

桌面应用打开后一片空白。

## 根因

`dist/index.html` 生成的是绝对资源路径：

```html
<script type="module" crossorigin src="/assets/index-DsNQiwRG.js"></script>
<link rel="stylesheet" crossorigin href="/assets/index-rREvhxYk.css">
```

Electron 通过 `file:///D:/Codex%20Product/AI-Workpench/dist/index.html` 打开时，`/assets/...` 被解析为 `file:///D:/assets/...`，而实际文件位于：

```text
D:\Codex Product\AI-Workpench\dist\assets\
```

因此 React 脚本和样式均未加载，页面保持空白。

## 修复要求

1. 在 `vite.config.ts` 中设置 `base: './'`。
2. 重新运行 `npm.cmd run build`。
3. 确认 `dist/index.html` 中资源路径变为 `./assets/...`。
4. 运行 `npm.cmd run desktop`，确认桌面窗口显示 AI-Workpench 主界面，而不是空白页。
5. 更新 `docs/agents/status/T002-reasonix.md`，重新提交 `needs_review`。

## 复验标准

- `npm.cmd test` 通过。
- `npm.cmd run build` 通过。
- `dist/index.html` 资源路径为相对路径。
- 桌面应用实际可见主界面。

## Codex 最终复验

2026-08-02 白屏修复验收通过：

- `npm.cmd test`：38/38 通过。
- `npm.cmd run build`：通过。
- `dist/index.html` 已使用 `./assets/...`。
- Chromium 调试协议确认 `#root` 渲染出主界面，包含八个导航和今日工作内容。
- T002 重新标记为 `done`。
