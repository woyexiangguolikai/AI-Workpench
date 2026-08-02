/**
 * Obsidian Vault 基础读写模块
 *
 * Obsidian Vault 本质是一个包含 Markdown 文件的目录。
 * 每个 .md 文件可选包含 YAML frontmatter（由 --- 包裹）。
 *
 * 此模块提供无依赖的纯函数用于解析 frontmatter，
 * 以及文件系统操作接口（供 Electron 主进程使用）。
 */

/** 笔记 frontmatter 键值类型 */
export type FrontmatterValue = string | number | boolean | string[] | null;

/** 笔记的 frontmatter 元数据 */
export type Frontmatter = Record<string, FrontmatterValue>;

/** 解析后的笔记内容 */
export interface ParsedNote {
  /** YAML frontmatter 元数据 */
  frontmatter: Frontmatter;
  /** frontmatter 之后的正文内容 */
  content: string;
}

/** 笔记摘要信息 */
export interface NoteInfo {
  /** 文件名（不含路径） */
  name: string;
  /** 完整文件路径 */
  path: string;
  /** 文件修改时间戳 */
  modifiedAt: string;
  /** 标题（从 frontmatter.title 或文件名推断） */
  title: string;
}

/**
 * 解析 Markdown 文件的 YAML frontmatter。
 *
 * Frontmatter 由开头的 `---` 标记开始，到下一个 `---` 标记结束。
 * 如果没有 frontmatter，返回空的 frontmatter 对象和全部原始内容。
 *
 * 这是纯函数，不涉及文件系统操作，便于单元测试。
 *
 * @param raw - Markdown 文件的原始文本内容
 * @returns 解析后的 frontmatter 和正文内容
 */
export function parseFrontmatter(raw: string): ParsedNote {
  const trimmed = raw.trimStart();

  // Frontmatter 必须以 --- 开头
  if (!trimmed.startsWith('---')) {
    return { frontmatter: {}, content: raw };
  }

  // 查找第二个 ---（结束标记）
  const afterFirst = trimmed.slice(3);
  const endIndex = afterFirst.indexOf('\n---');

  if (endIndex === -1) {
    // 只有开头的 --- 没有闭合，视为没有 frontmatter
    return { frontmatter: {}, content: raw };
  }

  const frontmatterRaw = afterFirst.slice(0, endIndex);
  const content = afterFirst.slice(endIndex + 4).trimStart();

  return {
    frontmatter: parseYamlLines(frontmatterRaw),
    content,
  };
}

/**
 * 简易 YAML 行解析器（仅支持键值对、列表和基本类型）。
 *
 * 不依赖完整的 YAML 解析库，只处理 Obsidian frontmatter 常见格式：
 * - key: value（字符串）
 * - key: 123（数字）
 * - key: true / false（布尔值）
 * - key: [a, b, c]（字符串数组）
 * - key: (换行) - item1 (换行) - item2（列表）
 *
 * 故意不引入 js-yaml 等完整解析器以减少依赖。
 * 如需完整 YAML 支持，升级此函数即可。
 *
 * @param raw - frontmatter 的原始文本行
 * @returns 解析后的键值对
 */
function parseYamlLines(raw: string): Frontmatter {
  const result: Frontmatter = {};
  const lines = raw.split('\n');

  let currentKey: string | null = null;
  let currentArray: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // 空行跳过
    if (trimmed === '') continue;

    // 列表项（以 - 开头）
    if (trimmed.startsWith('- ') && currentKey !== null) {
      currentArray.push(trimmed.slice(2).trim());
      continue;
    }

    // 如果有正在收集的数组，先保存
    if (currentKey !== null && currentArray.length > 0) {
      result[currentKey] = currentArray;
      currentKey = null;
      currentArray = [];
    }

    // 键值对
    const colonIndex = trimmed.indexOf(':');
    if (colonIndex === -1) continue;

    const key = trimmed.slice(0, colonIndex).trim();
    const value = trimmed.slice(colonIndex + 1).trim();

    if (value === '') {
      // 可能是多行数组的开始
      currentKey = key;
      currentArray = [];
      continue;
    }

    // 解析值
    result[key] = parseYamlValue(value);
  }

  // 保存最后一个数组（如果有）
  if (currentKey !== null && currentArray.length > 0) {
    result[currentKey] = currentArray;
  }

  return result;
}

/**
 * 解析 YAML 标量值
 */
function parseYamlValue(value: string): FrontmatterValue {
  // null
  if (value === 'null' || value === '~') return null;

  // 布尔值
  if (value === 'true') return true;
  if (value === 'false') return false;

  // 数字
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    const num = Number(value);
    if (!isNaN(num)) return num;
  }

  // 数组 [a, b, c]
  if (value.startsWith('[') && value.endsWith(']')) {
    const inner = value.slice(1, -1).trim();
    if (inner === '') return [];
    return inner.split(',').map((s) => s.trim().replace(/^["']|["']$/g, ''));
  }

  // 去掉引号
  const unquoted = value.replace(/^["']|["']$/g, '');

  return unquoted;
}
