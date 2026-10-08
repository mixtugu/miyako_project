import assert from 'node:assert/strict';
import { chromium } from '@playwright/test';
import { randomUUID } from 'node:crypto';

const base = process.argv[2];
if (!base || !process.argv.includes('--write-test-comment')) {
  throw new Error('Usage: node --env-file=.dev.vars scripts/smoke-deployment.mjs https://your-worker --write-test-comment');
}
const password = process.env.COMMENT_DELETE_PASSWORD;
if (!password) throw new Error('COMMENT_DELETE_PASSWORD is required to remove the temporary verification comment.');
const browser = await chromium.launch();
let id;
const api = async (path, options = {}) => fetch(new URL(path, base), { ...options, signal: AbortSignal.timeout(20_000) });
try {
  const health = await api('/health');
  assert.equal(health.status, 200);
  assert.equal(await health.text(), 'OK');
  const context = await browser.newContext();
  await context.addInitScript(() => {
    const Original = window.WebSocket;
    window.WebSocket = class extends Original {
      constructor(url, protocols) {
        super(url, protocols);
        this.addEventListener('open', () => { window.__gallerySocketOpen = true; });
      }
    };
  });
  const page = await context.newPage();
  const errors = [], connections = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => connections.push(request.url()));
  page.on('websocket', socket => connections.push(socket.url()));
  for (const path of ['/guest/a', '/guest/b', '/guest/a2?photo=l1', '/guest/b2?photo=k1', '/host', '/host/picture?photo=l1&lang=en']) {
    const response = await page.goto(new URL(path, base).href);
    assert.equal(response.status(), 200);
    assert.match(response.headers()['content-security-policy'], /connect-src 'self'/);
    await page.locator('main').waitFor();
  }
  await page.waitForFunction(() => window.__gallerySocketOpen === true);
  const text = `Migration verification ${randomUUID()}`;
  const created = await api('/api/comments', { method: 'POST', headers: { 'Content-Type': 'application/json', Origin: new URL(base).origin }, body: JSON.stringify({ photoId: 'l1', text }) });
  assert.equal(created.status, 201);
  id = (await created.json()).id;
  await page.getByText(text, { exact: true }).waitFor({ timeout: 15_000 });
  const stored = await api('/api/positions', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ comment_id: id, photo_id: 'l1', top_pct: 50, left_pct: 50 }) });
  assert.equal(stored.status, 204);
  const denied = await api(`/api/comments/${id}`, { method: 'DELETE' });
  assert.equal(denied.status, 401);
  const removed = await api(`/api/comments/${id}`, { method: 'DELETE', headers: { 'X-Admin-Password': password } });
  assert.equal(removed.status, 204);
  await page.getByText(text, { exact: true }).waitFor({ state: 'detached', timeout: 15_000 });
  id = undefined;
  assert.deepEqual(errors, []);
  assert.equal(connections.some(url => /supabase/i.test(url)), false);
  console.log(JSON.stringify({ base, deep_links: 6, live_create_delete: true, position_write: true, unauthorized_delete_blocked: true, supabase_requests: 0, browser_errors: 0, temporary_comment_removed: true }));
} finally {
  if (id) {
    const cleanup = await api(`/api/comments/${id}`, { method: 'DELETE', headers: { 'X-Admin-Password': password } });
    if (!cleanup.ok) console.error(`Temporary verification comment cleanup failed for ID ${id}.`);
  }
  await browser.close();
}
