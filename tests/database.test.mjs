import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createD1 } from './fixtures/d1.mjs';

test('legacy data remains exact and cascade deletion rolls back on failure', () => {
  const { sqlite } = createD1();
  try {
    const original = "Old p1 comment: 日本語 ' apostrophe\nline break";
    sqlite.prepare('INSERT INTO comments VALUES (?,?,?,?)').run('old-id','p1',original,'2025-01-01T00:00:00+00:00');
    sqlite.exec("INSERT INTO comment_positions VALUES ('old-id','p1',3.25,97.1,NULL)");
    assert.equal(sqlite.prepare('SELECT text FROM comments').get().text,original);
    assert.throws(() => sqlite.exec("INSERT INTO comment_positions VALUES ('missing','l1',50,50,NULL)"), /FOREIGN KEY/);
    sqlite.exec("CREATE TRIGGER prevent_delete BEFORE DELETE ON comments BEGIN SELECT RAISE(ABORT, 'Simulated failure'); END");
    assert.throws(() => sqlite.exec("DELETE FROM comments WHERE id='old-id'"), /Simulated failure/);
    assert.equal(sqlite.prepare('SELECT count(*) AS count FROM comment_positions').get().count,1);
    sqlite.exec("DROP TRIGGER prevent_delete; DELETE FROM comments WHERE id='old-id'");
    assert.equal(sqlite.prepare('SELECT count(*) AS count FROM comment_positions').get().count,0);
    assert.deepEqual(sqlite.prepare('PRAGMA foreign_key_check').all(),[]);
  } finally { sqlite.close(); }
});
