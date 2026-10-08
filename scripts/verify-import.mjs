import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { queryD1 } from './d1.mjs';

if (!process.argv[2]) throw new Error('Usage: node scripts/verify-import.mjs migration-data/<snapshot> [--local]');
const directory = resolve(process.argv[2]);
const source = JSON.parse(await readFile(`${directory}/data.json`, 'utf8'));
const manifest = JSON.parse(await readFile(`${directory}/manifest.json`, 'utf8'));
const [comments, positions, foreignKeys] = await queryD1(`
  SELECT id, photo_id, text, created_at FROM comments ORDER BY id;
  SELECT comment_id, photo_id, top_pct, left_pct, updated_at FROM comment_positions ORDER BY comment_id;
  PRAGMA foreign_key_check;
`, !process.argv.includes('--local'));
const canonical = data => ({
  comments: data.comments.map(({ id, photo_id, text, created_at }) => ({ id, photo_id, text, created_at })),
  comment_positions: data.comment_positions.map(({ comment_id, photo_id, top_pct, left_pct, updated_at }) => ({ comment_id, photo_id, top_pct, left_pct, updated_at })),
});
// Postgres (source) and SQLite (D1) may collate IDs differently, so compare in one shared order.
const byKey = key => (a, b) => (a[key] < b[key] ? -1 : a[key] > b[key] ? 1 : 0);
const ordered = data => ({
  comments: [...data.comments].sort(byKey('id')),
  comment_positions: [...data.comment_positions].sort(byKey('comment_id')),
});
const expected = canonical(source);
const imported = canonical({ comments, comment_positions: positions });
if (foreignKeys.length || JSON.stringify(ordered(expected)) !== JSON.stringify(ordered(imported))) throw new Error('Source and D1 differ. No data was modified by this verification.');
const sha256 = createHash('sha256').update(JSON.stringify(expected)).digest('hex');
if (sha256 !== manifest.sha256) throw new Error('Import checksum mismatch.');
const report = { verified_at: new Date().toISOString(), target: process.argv.includes('--local') ? 'local' : 'remote', comments: comments.length, positions: positions.length, sha256, foreign_key_errors: 0, exact_match: true };
await writeFile(`${directory}/verification-${report.target}.json`, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
console.log(JSON.stringify(report));
