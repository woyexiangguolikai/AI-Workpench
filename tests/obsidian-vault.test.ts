/**
 * Obsidian Vault 模块测试
 *
 * 测试 frontmatter 解析纯函数，不涉及文件系统。
 */

import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '../src/lib/obsidian-vault';

describe('parseFrontmatter', () => {
  it('returns empty frontmatter for plain text without frontmatter', () => {
    const result = parseFrontmatter('这是一行普通文本。\n第二行。');

    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe('这是一行普通文本。\n第二行。');
  });

  it('parses simple key-value frontmatter', () => {
    const markdown = `---
title: 测试笔记
date: 2026-08-02
tags: [obsidian, markdown]
---

# 正文内容

这是正文。`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({
      title: '测试笔记',
      date: '2026-08-02',
      tags: ['obsidian', 'markdown'],
    });
    expect(result.content).toContain('# 正文内容');
    expect(result.content).toContain('这是正文。');
  });

  it('parses number and boolean values', () => {
    const markdown = `---
count: 42
active: true
archived: false
empty: null
---

content`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({
      count: 42,
      active: true,
      archived: false,
      empty: null,
    });
  });

  it('parses multi-line list values', () => {
    const markdown = `---
tags:
  - typescript
  - react
  - electron
deps:
  - vitest
  - sql.js
---

text`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({
      tags: ['typescript', 'react', 'electron'],
      deps: ['vitest', 'sql.js'],
    });
  });

  it('handles frontmatter with only opening ---', () => {
    const markdown = `---
missing close

content`;

    const result = parseFrontmatter(markdown);

    // 只有开头没有闭合，视为无 frontmatter
    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe(markdown);
  });

  it('handles empty frontmatter', () => {
    const markdown = `---
---

# 只有正文`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({});
    expect(result.content).toBe('# 只有正文');
  });

  it('handles quoted string values', () => {
    const markdown = `---
title: "包含空格和:冒号的标题"
path: 'C:\\Users\\test'
---

content`;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({
      title: '包含空格和:冒号的标题',
      path: 'C:\\Users\\test',
    });
  });

  it('preserves content after frontmatter without modification', () => {
    const markdown = `---
key: value
---

## 二级标题

- 列表项 1
- 列表项 2

\`\`\`ts
const x = 1;
\`\`\``;

    const result = parseFrontmatter(markdown);

    expect(result.frontmatter).toEqual({ key: 'value' });
    expect(result.content).toContain('## 二级标题');
    expect(result.content).toContain('- 列表项 1');
    expect(result.content).toContain('```ts');
  });
});
