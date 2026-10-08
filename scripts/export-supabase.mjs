import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';
import { isCommentId, isPhotoId } from '../shared/validation.ts';

// This one-time, read-only exporter is the only code that contacts Supabase.
const source = process.env.SUPABASE_EXPORT_URL ?? process.env.VITE_SUPABASE_URL;
const key = process.env.SUPABASE_EXPORT_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;
if (!source || !key) throw new Error('Set SUPABASE_EXPORT_URL and SUPABASE_EXPORT_KEY, or load the old .env.');

async function readTable(table, columns, primaryKey) {
  const rows = [];
  let total;
  do {
    const url = new URL(`/rest/v1/${table}`, source);
    url.search = new URLSearchParams({ select: columns, order: `${primaryKey}.asc`, offset: String(rows.length), limit: '500' });
    const response = await fetch(url, { headers: { apikey: key, Prefer: 'count=exact' }, redirect: 'error', signal: AbortSignal.timeout(15_000) });
    if (!response.ok) throw new Error(`Export of ${table} failed (${response.status}).`);
    const range = response.headers.get('content-range');
    const count = Number(range?.split('/')[1]);
    if (!range || !Number.isSafeInteger(count)) throw new Error(`Missing exact count for ${table}.`);
    if (total !== undefined && total !== count) throw new Error(`${table} changed during export. Retry during a quiet period.`);
    total = count;
    const page = await response.json();
    if (!Array.isArray(page) || (!page.length && rows.length < total)) throw new Error(`Incomplete export of ${table}.`);
    rows.push(...page);
  } while (rows.length < total);
  if (rows.length !== total || new Set(rows.map(row => row[primaryKey])).size !== total) throw new Error(`Count/ID mismatch for ${table}.`);
  return rows;
}

async function snapshot() {
  return {
    comments: await readTable('comments', 'id,photo_id,text,created_at', 'id'),
    comment_positions: await readTable('comment_positions', 'comment_id,photo_id,top_pct,left_pct,updated_at', 'comment_id'),
  };
}
const data = await snapshot();
const second = await snapshot();
if (JSON.stringify(data) !== JSON.stringify(second)) throw new Error('Source changed between verification reads. No export written; retry.');
const comments = new Map(data.comments.map(row => [row.id, row]));
for (const row of data.comments) {
  if (!isCommentId(row.id) || !isPhotoId(row.photo_id) || typeof row.text !== 'string' || row.text.includes('\0') || !Number.isFinite(Date.parse(row.created_at))) {
    throw new Error('Unsupported source comment. Inspect privately before migrating.');
  }
}
for (const row of data.comment_positions) {
  if (!comments.has(row.comment_id) || comments.get(row.comment_id).photo_id !== row.photo_id
    || !Number.isFinite(row.top_pct) || !Number.isFinite(row.left_pct)
    || (row.updated_at !== null && !Number.isFinite(Date.parse(row.updated_at)))) {
    throw new Error('Orphaned or invalid source position. No rows have been discarded.');
  }
}
const sha256 = createHash('sha256').update(JSON.stringify(data)).digest('hex');
const output = resolve(process.argv[2] ?? `migration-data/${new Date().toISOString().replaceAll(':', '-')}`);
await mkdir(output, { recursive: true, mode: 0o700 });
const quote = value => value === null ? 'NULL' : typeof value === 'number' ? String(value) : `'${value.replaceAll("'", "''")}'`;
const sql = ['-- Import into an empty gallery database; existing IDs must never be overwritten.'];
for (const table of ['comments', 'comment_positions']) {
  for (const row of data[table]) {
    sql.push(`INSERT INTO ${table} (${Object.keys(row).join(',')}) VALUES (${Object.values(row).map(quote).join(',')});`);
  }
}
sql.push(`INSERT INTO import_receipts (sha256, imported_at, comment_count, position_count) VALUES (${quote(sha256)}, ${quote(new Date().toISOString())}, ${data.comments.length}, ${data.comment_positions.length});`);
await writeFile(`${output}/data.json`, JSON.stringify(data, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
await writeFile(`${output}/import.sql`, sql.join('\n') + '\n', { mode: 0o600, flag: 'wx' });
await writeFile(`${output}/manifest.json`, JSON.stringify({ exported_at: new Date().toISOString(), sha256, comments: data.comments.length, positions: data.comment_positions.length, verification: 'two identical paginated reads with exact counts', credential_scope: key === process.env.VITE_SUPABASE_ANON_KEY ? 'public rows visible to the existing app' : 'provided export credential' }, null, 2) + '\n', { mode: 0o600, flag: 'wx' });
console.log(JSON.stringify({ output, comments: data.comments.length, positions: data.comment_positions.length, sha256 }));
