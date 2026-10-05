import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { startServer } from '../server/index.mjs';

test('HTTP server handles entry/logout, protects atlas assets and never serves database or source files', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'motionstudy-http-'));
  const distPath = join(dir, 'dist');
  await mkdir(join(distPath, 'models'), { recursive: true });
  await writeFile(join(distPath, 'index.html'), '<h1>Username form</h1>');
  await writeFile(join(distPath, 'models', 'test.glb'), 'model');
  await writeFile(join(distPath, 'manifest.webmanifest'), '{"name":"MotionStudy"}');
  await writeFile(join(distPath, 'app-icon.png'), 'png');
  const origin = 'http://127.0.0.1:5173';
  const app = await startServer({ port: 0, origin, databasePath: join(dir, 'accounts.sqlite'), distPath });
  const base = 'http://127.0.0.1:' + app.server.address().port;
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });
  const enter = username => fetch(base + '/api/account/enter', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: JSON.stringify({ username }) });
  assert.match(await (await fetch(base)).text(), /Username form/);
  const manifest = await fetch(base + '/manifest.webmanifest');
  assert.equal(manifest.status, 200);
  assert.equal(manifest.headers.get('content-type'), 'application/manifest+json');
  assert.equal((await manifest.json()).name, 'MotionStudy');
  const icon = await fetch(base + '/app-icon.png');
  assert.equal(icon.status, 200);
  assert.equal(icon.headers.get('content-type'), 'image/png');
  assert.equal((await fetch(base + '/models/test.glb')).status, 401);
  assert.equal((await fetch(base + '/%6dodels/test.glb')).status, 401);
  assert.equal((await fetch(base + '/%2fmodels/test.glb')).status, 401);
  const entered = await enter('test-person');
  assert.equal(entered.status, 200);
  assert.equal(entered.headers.get('cache-control'), 'no-store');
  const cookie = entered.headers.get('set-cookie').split(';')[0];
  const headers = { cookie };
  assert.equal((await (await fetch(base + '/api/account/session', { headers })).json()).user.username, 'test-person');
  assert.equal(await (await fetch(base + '/models/test.glb', { headers })).text(), 'model');
  for (const path of ['/accounts.sqlite', '/server/accounts.mjs', '/%2e%2e%2faccounts.sqlite', '/.env', '/.data/accounts.sqlite']) {
    assert.equal((await fetch(base + path, { headers })).status, 404, path);
  }
  const badOrigin = await fetch(base + '/api/account/logout', { method: 'POST', headers: { ...headers, origin: 'https://evil.example', 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(badOrigin.status, 403);
  assert.equal((await fetch(base + '/api/account/logout', { method: 'POST', headers: { ...headers, origin, 'Content-Type': 'application/json' }, body: '{}' })).status, 200);
  assert.equal((await fetch(base + '/models/test.glb', { headers })).status, 401);
  assert.equal((await (await fetch(base + '/api/account/session', { headers })).json()).user, null);
  assert.equal((await fetch(base + '/api/account/enter', { method: 'POST', headers: { origin, 'Content-Type': 'application/json' }, body: 'x'.repeat(5000) })).status, 413);
});
