import { test, expect } from '@playwright/test';

test.beforeEach(async ({ context }) => {
  await context.route('https://*.supabase.co/**', route => {
    throw new Error(`Unexpected legacy request: ${new URL(route.request().url()).pathname}`);
  });
});

test('all deep links and refreshes render with security headers', async ({ page, request }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  for (const path of ['/guest/a', '/guest/a2?photo=l1', '/guest/b', '/guest/b2?photo=k1', '/host', '/host/picture?photo=l1']) {
    const response = await page.goto(path);
    expect(response?.status()).toBe(200);
    expect(response?.headers()['x-content-type-options']).toBe('nosniff');
    expect(response?.headers()['content-security-policy']).toContain("frame-ancestors 'none'");
    await expect(page.locator('main')).toBeVisible();
    await page.reload();
    await expect(page.locator('main')).toBeVisible();
  }
  expect(errors).toEqual([]);
  expect((await request.get('/health')).status()).toBe(200);
  const missing = await request.get('/api/does-not-exist');
  expect(missing.status()).toBe(404);
  expect(await missing.json()).toEqual({ error: 'not_found' });
});

test('guest submission and password-protected deletion use the real local Worker', async ({ page }) => {
  await page.goto('/guest/a2?photo=l1&lang=en');
  await expect(page.getByText('Existing gallery comment')).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Comment', exact: true })).toHaveAttribute('maxlength', '2000');
  await page.getByRole('textbox', { name: 'Comment', exact: true }).fill('New visitor comment <script>alert(1)</script>');
  const created = page.waitForResponse(response => response.url().endsWith('/api/comments'));
  await page.getByRole('button', { name: 'Save comment', exact: true }).click();
  expect((await created).status()).toBe(201);
  await expect(page.getByRole('listitem').filter({ hasText: 'New visitor comment' })).toBeVisible();

  let suppliedPassword = 'incorrect';
  const alerts: string[] = [];
  page.on('dialog', async dialog => {
    if (dialog.type() === 'prompt') await dialog.accept(suppliedPassword);
    else { if (dialog.type() === 'alert') alerts.push(dialog.message()); await dialog.accept(); }
  });
  const row = page.getByRole('listitem').filter({ hasText: 'New visitor comment' });
  await row.getByRole('button', { name: 'Delete comment' }).click();
  await expect.poll(() => alerts.length).toBe(1);
  expect(alerts[0]).toContain('password does not match');
  await expect(row).toBeVisible();
  suppliedPassword = 'fixture-only-long-password';
  await row.getByRole('button', { name: 'Delete comment' }).click();
  await expect(row).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('Existing gallery comment')).toBeVisible();
  await expect(page.getByText('New visitor comment <script>alert(1)</script>')).toHaveCount(0);
});

test('dragged positions persist after reloading', async ({ page, request }) => {
  await page.goto('/host/picture?photo=l1&lang=en');
  const comment = page.getByText('Existing gallery comment', { exact: true });
  const bubble = comment.locator('../..');
  await expect(bubble).toBeVisible();
  await comment.scrollIntoViewIfNeeded();
  const box = await comment.boundingBox();
  if (!box) throw new Error('Missing comment bubble');
  const saved = page.waitForResponse(response => response.url().endsWith('/api/positions') && response.request().method() === 'PUT');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await expect(bubble).toHaveCSS('cursor', 'grabbing');
  await page.mouse.move(box.x + box.width / 2 + 30, box.y + box.height / 2 + 30, { steps: 3 });
  await page.mouse.up();
  await expect(bubble).toHaveCSS('cursor', 'grab');
  expect((await saved).status()).toBe(204);
  const { positions } = await (await request.get('/api/gallery?photoId=l1')).json();
  expect(positions).toHaveLength(1);
  await page.reload();
  await expect(bubble).toHaveCSS('left', /px$/);
  await expect.poll(async () => bubble.evaluate(el => parseFloat((el as HTMLElement).style.left))).toBeCloseTo(positions[0].left_pct, 3);
});

test('real WebSockets synchronize creation, deletion, and reconnect without Supabase', async ({ page, context, request }) => {
  const other = await context.newPage();
  await page.goto('/host/picture?photo=l1&lang=en');
  await other.goto('/host/picture?photo=k1&lang=en');
  await expect(page.getByText('Existing gallery comment')).toBeVisible();
  const created = await request.post('/api/comments', { data: { photoId: 'l1', text: 'Realtime visitor' } });
  expect(created.status()).toBe(201);
  const row = await created.json();
  await expect(page.getByText('Realtime visitor')).toBeVisible();
  await expect(other.getByText('Realtime visitor')).toHaveCount(0);
  // A sleeping/offline tab must get the latest snapshot when it reconnects.
  await context.setOffline(true);
  const removed = await request.delete(`/api/comments/${row.id}`, { headers: { 'X-Admin-Password': 'fixture-only-long-password' } });
  expect(removed.status()).toBe(204);
  await context.setOffline(false);
  await expect(page.getByText('Realtime visitor')).toHaveCount(0);
  await expect(page.getByText('Existing gallery comment')).toBeVisible();
  await other.close();
});

test('WebSocket clients cannot publish forged updates and cross-origin connections are rejected', async ({ page, request }) => {
  const response = await request.get('/api/events?photoId=l1', { headers: { Origin: 'https://attacker.example', Upgrade: 'websocket' } });
  expect(response.status()).toBe(403);
  await page.goto('/host');
  const code = await page.evaluate(() => new Promise<number>((resolve, reject) => {
    const url = new URL('/api/events?photoId=l1', location.href);
    url.protocol = 'ws:';
    const socket = new WebSocket(url);
    socket.onopen = () => socket.send('{"type":"delete","id":"forged"}');
    socket.onclose = event => resolve(event.code);
    socket.onerror = () => reject(new Error('WebSocket connection failed'));
  }));
  expect(code).toBe(1008);
});
