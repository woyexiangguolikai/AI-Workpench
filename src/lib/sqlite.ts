/**
 * SQLite 本地存储抽象层
 *
 * 使用 sql.js（纯 WASM，无原生依赖）替代 better-sqlite3，
 * 消除 Electron ABI 不兼容导致的启动崩溃。
 *
 * 仅在 Electron 主进程中使用，通过类型化 IPC 暴露给渲染进程。
 * 不暴露原始 SQL 接口 —— 所有数据操作通过白名单字段的参数化查询。
 */

/** SQLite 查询参数类型 */
export type SqlParam = string | number | boolean | null;

/** SQLite 查询结果行 */
export type SqlRow = Record<string, SqlParam | undefined>;

/**
 * 数据库连接接口（与 sql.js 兼容的抽象）。
 * 提供参数化查询和事务支持。
 */
export interface IDatabase {
  /** 执行非查询 SQL，返回影响行数 */
  execute(sql: string, params?: SqlParam[]): { changes: number; lastInsertRowid: number };
  /** 执行查询 SQL，返回结果行数组 */
  query(sql: string, params?: SqlParam[]): SqlRow[];
  /** 关闭数据库 */
  close(): void;
  /** 导出数据库为 Uint8Array */
  export(): Uint8Array;
}

/**
 * 使用 sql.js 实现 IDatabase 接口。
 * sql.js 通过 WASM 加载，初始化是异步的。
 *
 * @param SqlJs - sql.js 初始化后的模块
 */
export function createSqlJsDatabase(
  SqlJs: { Database: new (data?: ArrayLike<number> | Buffer | null) => SqlJsDatabase },
  data?: ArrayLike<number> | Buffer | null,
): IDatabase {
  const db = new SqlJs.Database(data);

  db.run('PRAGMA journal_mode = WAL');
  db.run('PRAGMA foreign_keys = ON');

  return {
    execute(sql: string, params: SqlParam[] = []): { changes: number; lastInsertRowid: number } {
      db.run(sql, params);
      // sql.js 不直接返回 changes/lastInsertRowid，使用近似方法
      const changes = db.getRowsModified();
      // 尝试获取 lastInsertRowid
      let lastInsertRowid = 0;
      try {
        const result = db.exec('SELECT last_insert_rowid() as id');
        if (result.length > 0 && result[0].values.length > 0) {
          lastInsertRowid = Number(result[0].values[0][0]) || 0;
        }
      } catch {
        // ignore
      }
      return { changes, lastInsertRowid };
    },

    query(sql: string, params: SqlParam[] = []): SqlRow[] {
      const stmt = db.prepare(sql);
      if (params.length > 0) {
        stmt.bind(params);
      }
      const rows: SqlRow[] = [];
      while (stmt.step()) {
        rows.push(stmt.getAsObject() as SqlRow);
      }
      stmt.free();
      return rows;
    },

    close(): void {
      db.close();
    },

    export(): Uint8Array {
      return db.export();
    },
  };
}

/** sql.js Database 接口（最小类型） */
interface SqlJsDatabase {
  new (data?: ArrayLike<number> | Buffer | null): SqlJsDatabase;
  run(sql: string, params?: SqlParam[]): void;
  exec(sql: string): Array<{ columns: string[]; values: Array<Array<SqlParam>> }>;
  prepare(sql: string): SqlJsStatement;
  export(): Uint8Array;
  close(): void;
  getRowsModified(): number;
}

interface SqlJsStatement {
  bind(params?: SqlParam[]): boolean;
  step(): boolean;
  getAsObject(): Record<string, SqlParam>;
  free(): boolean;
}

/**
 * 初始化应用程序所需的数据库表。
 * 使用参数化 DDL（仅含常量，不接受外部输入）。
 */
export function initializeTables(db: IDatabase): void {
  db.execute(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT DEFAULT '活跃',
      source TEXT DEFAULT '', owner TEXT DEFAULT '', summary TEXT DEFAULT '',
      ddl TEXT DEFAULT '', folder TEXT DEFAULT '', risk TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS requirements (
      id TEXT PRIMARY KEY, project_id TEXT NOT NULL, title TEXT NOT NULL,
      type TEXT DEFAULT '', owner TEXT DEFAULT '', priority TEXT DEFAULT '中',
      plan_start TEXT DEFAULT '', plan_end TEXT DEFAULT '', status TEXT DEFAULT '待开始',
      description TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY, requirement_id TEXT NOT NULL, title TEXT NOT NULL,
      assignee TEXT DEFAULT '', plan_start TEXT DEFAULT '', plan_end TEXT DEFAULT '',
      status TEXT DEFAULT '待开始',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (requirement_id) REFERENCES requirements(id)
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS inbox_items (
      id TEXT PRIMARY KEY, source TEXT DEFAULT '', text TEXT NOT NULL,
      received_at TEXT DEFAULT '', category TEXT DEFAULT '',
      confidence REAL DEFAULT 0, status TEXT DEFAULT '待处理',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);

  db.execute(`
    CREATE TABLE IF NOT EXISTS knowledge_items (
      id TEXT PRIMARY KEY, title TEXT NOT NULL, category TEXT DEFAULT '',
      confidence REAL DEFAULT 0, source TEXT DEFAULT '',
      status TEXT DEFAULT '待审核',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `);
}
