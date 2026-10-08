import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function createD1() {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys=ON');
  sqlite.exec(readFileSync(new URL('../../migrations/0001_gallery.sql', import.meta.url), 'utf8'));
  const db = {
    prepare(sql) {
      const statement = sqlite.prepare(sql);
      let values = [];
      return {
        bind(...args) { values = args; return this; },
        async all() { return { success: true, results: statement.all(...values).map(row => ({ ...row })) }; },
        async first() { const row = statement.get(...values); return row ? { ...row } : null; },
        async run() { const result = statement.run(...values); return { success: true, meta: { changes: result.changes } }; },
      };
    },
  };
  return { db, sqlite };
}
