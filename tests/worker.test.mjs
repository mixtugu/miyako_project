import { test } from 'node:test';
import assert from 'node:assert/strict';
import worker from '../worker/index.ts';
import { createD1 } from './fixtures/d1.mjs';

const password = 'new-private-test-password-12345';
const request = (path, method = 'POST', body, headers = {}) => new Request(`https://gallery.example${path}`, {
  method, headers: { 'Content-Type': 'application/json', Origin: 'https://gallery.example', ...headers },
  body: body === undefined ? undefined : JSON.stringify(body),
});
function setup(t) {
  const { db, sqlite } = createD1();
  t.after(() => sqlite.close());
  const messages = [], tasks = [];
  const env = {
    ASSETS: { fetch: async () => new Response('SPA') }, DB: db, COMMENT_DELETE_PASSWORD: password,
    GALLERY_ROOMS: { idFromName: name => name, get: id => ({ fetch: async () => { messages.push(id); return new Response(null, { status: 204 }); } }) },
  };
  const ctx = { waitUntil: promise => tasks.push(promise) };
  return { env, sqlite, messages, tasks, call: (req, override = {}) => worker.fetch(req, { ...env, ...override }, ctx) };
}

test('unauthorized deletion cannot modify the database', async t => {
  const { call, sqlite } = setup(t);
  sqlite.exec("INSERT INTO comments VALUES ('id','l1','Keep me','2026-01-01')");
  for (const headers of [{}, { 'X-Admin-Password': 'old-public-password' }]) {
    const response = await call(request('/api/comments/id', 'DELETE', undefined, headers));
    assert.equal(response.status, 401);
    assert.equal(response.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal(sqlite.prepare('SELECT count(*) as count FROM comments').get().count, 1);
});

test('creation, position storage, public read, and authorized cascading deletion work', async t => {
  const { call, sqlite, messages, tasks } = setup(t);
  const created = await call(request('/api/comments', 'POST', { photoId: 'l1', text: "  Hello '); DROP TABLE comments; --  ", id: 'forged', created_at: 'forged' }));
  assert.equal(created.status, 201);
  const row = await created.json();
  assert.notEqual(row.id, 'forged');
  assert.equal(row.text, "Hello '); DROP TABLE comments; --");
  assert.equal((await call(request('/api/positions', 'PUT', { comment_id: row.id, photo_id: 'k1', top_pct: 25, left_pct: 75 }))).status, 404);
  assert.equal((await call(request('/api/positions', 'PUT', { comment_id: row.id, photo_id: 'l1', top_pct: 25, left_pct: 75 }))).status, 204);
  const snapshot = await (await call(request('/api/gallery?photoId=l1', 'GET'))).json();
  assert.equal(snapshot.comments[0].text, row.text);
  assert.equal(snapshot.positions[0].left_pct, 75);
  assert.equal(snapshot.nextCursor, null);
  const deleted = await call(request(`/api/comments/${row.id}`, 'DELETE', undefined, { 'X-Admin-Password': password }));
  assert.equal(deleted.status, 204);
  assert.equal(sqlite.prepare('SELECT count(*) as count FROM comment_positions').get().count, 0);
  assert.equal((await call(request(`/api/comments/${row.id}`, 'DELETE', undefined, { 'X-Admin-Password': password }))).status, 404);
  await Promise.all(tasks);
  assert.deepEqual(messages, ['l1', 'l1', 'l1']);
});

test('pagination returns all rows exactly once and isolates artwork', async t => {
  const { call, sqlite } = setup(t);
  const insert = sqlite.prepare('INSERT INTO comments VALUES (?,?,?,?)');
  for (let i = 0; i < 205; i++) insert.run(`id-${String(i).padStart(3,'0')}`, 'l1', 'text', '2026-01-01');
  insert.run('other', 'k1', 'other', '2026-01-01');
  const first = await (await call(request('/api/gallery?photoId=l1', 'GET'))).json();
  const second = await (await call(request(`/api/gallery?photoId=l1&after=${first.nextCursor}`, 'GET'))).json();
  assert.equal(first.comments.length, 200);
  assert.equal(second.comments.length, 5);
  assert.equal(second.nextCursor, null);
  assert.equal(new Set([...first.comments, ...second.comments].map(row => row.id)).size, 205);
});

test('invalid, oversized, non-JSON, and cross-origin inputs are rejected', async t => {
  const { call, sqlite } = setup(t);
  assert.equal((await call(request('/api/comments','POST',{}, { Origin: 'https://attacker.example' }))).status, 403);
  assert.equal((await call(request('/api/events?photoId=l1','GET',undefined, { Origin: 'https://attacker.example' }))).status, 403);
  assert.equal((await call(request('/api/comments','POST',{}, { 'Content-Type': 'text/plain' }))).status, 415);
  assert.equal((await call(request('/api/comments','POST',{text:'x'.repeat(13000)}))).status, 413);
  for (const body of [{photoId:'l9',text:'Hi'},{photoId:'l1',text:' '},{photoId:'l1',text:'x'.repeat(2001)},{photoId:'l1',text:'\0'},null,[]]) {
    assert.equal((await call(request('/api/comments','POST',body))).status,400);
  }
  for (const top of [-1,97,'50',null]) assert.equal((await call(request('/api/positions','PUT',{comment_id:'id',photo_id:'l1',top_pct:top,left_pct:50}))).status,400);
  assert.equal((await call(request('/api/gallery?photoId=l1&after=%27','GET'))).status,400);
  assert.equal(sqlite.prepare('SELECT count(*) as count FROM comments').get().count,0);
});

test('missing security configuration and database errors fail closed without leaking details', async t => {
  const { call } = setup(t);
  const deletion = () => request('/api/comments/id','DELETE',undefined,{'X-Admin-Password':password});
  assert.equal((await call(deletion(),{COMMENT_DELETE_PASSWORD:''})).status,503);
  assert.equal((await call(deletion(),{COMMENT_DELETE_PASSWORD:'short'})).status,503);
  const response = await call(request('/api/gallery?photoId=l1','GET'),{DB:{prepare(){throw new Error('private database detail');}}});
  assert.equal(response.status,503);
  assert.deepEqual(await response.json(),{error:'service_unavailable'});
});

test('committed writes remain successful when live notification fails', async t => {
  const { call, tasks, sqlite } = setup(t);
  const response = await call(request('/api/comments','POST',{photoId:'l1',text:'Persist'}),{
    GALLERY_ROOMS:{idFromName(){throw new Error('Notification unavailable');}},
  });
  assert.equal(response.status,201);
  await Promise.all(tasks);
  assert.equal(sqlite.prepare('SELECT count(*) as count FROM comments').get().count,1);
});

test('health, SPA, API methods and non-upgraded WebSocket requests route correctly', async t => {
  const { call } = setup(t);
  assert.equal(await (await call(new Request('https://gallery.example/health'))).text(),'OK');
  assert.equal(await (await call(new Request('https://gallery.example/host/picture?photo=l1'))).text(),'SPA');
  assert.equal((await call(request('/api/missing','GET'))).status,404);
  assert.equal((await call(request('/api/comments','GET'))).status,405);
  assert.equal((await call(request('/api/events?photoId=l1','GET'))).status,426);
});
