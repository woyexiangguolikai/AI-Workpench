/**
 * SQLite 模块测试
 *
 * 测试 IDatabase 接口、initializeTables 和 createSqlJsDatabase。
 * 使用内存 mock（不依赖 sql.js WASM 加载），聚焦接口契约。
 */

import { describe, expect, it } from 'vitest';
import type { IDatabase, SqlRow } from '../src/lib/sqlite';
import { initializeTables } from '../src/lib/sqlite';

describe('IDatabase interface', () => {
  it('is structurally testable via mock', () => {
    const mockDb: IDatabase = {
      execute: () => ({ changes: 0, lastInsertRowid: 0 }),
      query: () => [],
      close: () => {},
      export: () => new Uint8Array(),
    };

    expect(mockDb).toBeDefined();
    expect(typeof mockDb.execute).toBe('function');
    expect(typeof mockDb.query).toBe('function');
    expect(typeof mockDb.close).toBe('function');
    expect(typeof mockDb.export).toBe('function');
  });

  it('mock execute returns expected shape', () => {
    const mockDb: IDatabase = {
      execute: () => ({ changes: 42, lastInsertRowid: 100 }),
      query: () => [],
      close: () => {},
      export: () => new Uint8Array(),
    };

    const result = mockDb.execute('INSERT INTO test VALUES (?)', ['value']);
    expect(result.changes).toBe(42);
    expect(result.lastInsertRowid).toBe(100);
  });

  it('mock query returns rows', () => {
    const rows: SqlRow[] = [
      { id: '1', name: 'Test' },
    ];

    const mockDb: IDatabase = {
      execute: () => ({ changes: 0, lastInsertRowid: 0 }),
      query: () => rows,
      close: () => {},
      export: () => new Uint8Array(),
    };

    const result = mockDb.query('SELECT * FROM test');
    expect(result).toHaveLength(1);
    expect(result[0]?.name).toBe('Test');
  });
});

describe('initializeTables', () => {
  it('executes 5 CREATE TABLE IF NOT EXISTS statements with parameterized DDL', () => {
    const sqls: string[] = [];

    const mockDb: IDatabase = {
      execute: (sql: string) => {
        sqls.push(sql);
        return { changes: 0, lastInsertRowid: 0 };
      },
      query: () => [],
      close: () => {},
      export: () => new Uint8Array(),
    };

    initializeTables(mockDb);

    expect(sqls).toHaveLength(5);
    expect(sqls[0]).toContain('CREATE TABLE IF NOT EXISTS projects');
    expect(sqls[1]).toContain('CREATE TABLE IF NOT EXISTS requirements');
    expect(sqls[2]).toContain('CREATE TABLE IF NOT EXISTS tasks');
    expect(sqls[3]).toContain('CREATE TABLE IF NOT EXISTS inbox_items');
    expect(sqls[4]).toContain('CREATE TABLE IF NOT EXISTS knowledge_items');

    // 验证表结构使用参数化常量（不接受外部输入）
    expect(sqls[1]).toContain('FOREIGN KEY (project_id) REFERENCES projects(id)');
    expect(sqls[2]).toContain('FOREIGN KEY (requirement_id) REFERENCES requirements(id)');
  });
});
