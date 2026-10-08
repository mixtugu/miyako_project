import { readFile, readdir } from 'node:fs/promises';
import { queryD1 } from './d1.mjs';

const password = process.env.COMMENT_DELETE_PASSWORD;
if (!password || password.length < 16 || password.includes('replace-with-')) {
  throw new Error('Configure a random COMMENT_DELETE_PASSWORD of at least 16 characters in .dev.vars.');
}
for (const entry of await readdir('dist/assets', { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const content = await readFile(`dist/assets/${entry.name}`, 'utf8');
  if (content.includes(password) || /supabase[.]co|VITE_SUPABASE|supabase-js/.test(content)) {
    throw new Error('The frontend build contains a secret or legacy Supabase connection.');
  }
}
const [tables, violations] = await queryD1("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('comments','comment_positions','import_receipts'); PRAGMA foreign_key_check;");
if (tables.length !== 3 || violations.length) throw new Error('D1 schema is missing or has foreign key violations.');
console.log('Deployment preflight passed: D1 schema, foreign keys, private password, and no frontend Supabase connection.');
