import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { NOTICE_VERSION } from '../shared/legal.mjs';

const base = process.env.CHECK_ORIGIN || 'http://localhost:8787';
const username = 'deploy-check-' + Date.now().toString(36);
const request = (path, options = {}) => fetch(base + path, { redirect: 'manual', ...options });
const post = (path, body, cookie, origin = base) => request('/api/account/' + path, {
  method: 'POST', headers: { origin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) },
  body: JSON.stringify(body),
});
const userFor = async cookie => (await (await request('/api/account/session', { headers: { cookie } })).json()).user;
const cookieFor = response => response.headers.get('set-cookie').split(';')[0];
const html = await request('/');
assert.equal(html.status, 200);
assert.match(await html.text(), /account-username/);
assert.equal(html.headers.get('x-frame-options'), 'DENY');
assert.equal((await request('/models/muscular.glb')).status, 401);
for (const path of ['/draco/draco_decoder.wasm', '/%6dodels/muscular.glb', '/%2fmodels/muscular.glb']) {
  assert.equal((await request(path)).status, 401, path);
}
assert.equal((await (await request('/api/account/session')).json()).user, null);
assert.equal((await post('enter', { username }, undefined, 'https://evil.example')).status, 403);
assert.equal((await post('enter', { username: 'bad name' })).status, 400);
assert.equal((await post('enter', { username: 'x'.repeat(5000) })).status, 413);
for (const path of ['/analytics/', '/analytics/index.html', '/%61nalytics/', '/%2fanalytics/']) {
  const protectedPage = await request(path);
  assert.equal(protectedPage.status, 302, path);
  assert.equal(protectedPage.headers.get('location'), base + '/beheer/');
}
assert.equal((await request('/api/analytics')).status, 401);
assert.equal((await request('/api/analytics', { headers: { cookie: '__Host-motionstudy_owner=' + 'a'.repeat(64) } })).status, 401);
const entered = await post('enter', { username, acknowledged: true, noticeVersion: NOTICE_VERSION });
assert.equal(entered.status, 200);
assert.equal(entered.headers.get('cache-control'), 'no-store');
assert.match(entered.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
if (base.startsWith('https:')) assert.match(entered.headers.get('set-cookie'), /^__Host-.*; Secure$/);
const first = await entered.json();
assert.equal(first.created, true);
let cookie = cookieFor(entered);
try {
  assert.deepEqual(await userFor(cookie), first.user);
  assert.equal((await request('/api/analytics', { headers: { cookie } })).status, 401);
  const again = await post('enter', { username: username.toUpperCase(), acknowledged: true, noticeVersion: NOTICE_VERSION }, cookie);
  assert.equal(again.status, 200);
  const second = await again.json();
  assert.equal(second.created, false);
  assert.deepEqual(second.user, first.user);
  const oldCookie = cookie;
  cookie = cookieFor(again);
  assert.equal(await userFor(oldCookie), null);
  for (const path of ['/models/muscular.glb', '/models/skeletal.glb', '/draco/draco_decoder.wasm']) {
    const asset = await request(path, { headers: { cookie } });
    assert.equal(asset.status, 200, path);
    assert.equal(asset.headers.get('cache-control'), 'no-store');
    assert.ok((await asset.arrayBuffer()).byteLength > 100_000);
  }
  const missing = ['/server/accounts.mjs', '/server/account-service.mjs', '/.env', '/.data/accounts.sqlite', '/sources/course.txt', '/wrangler.jsonc', '/not-a-page'];
  for (const path of missing) assert.equal((await request(path, { headers: { cookie } })).status, 404, path);
  // Verify that the public build matches the deployed entry point, rather than an older release.
  const local = readFileSync(new URL('../dist/index.html', import.meta.url), 'utf8');
  const remote = await (await request('/')).text();
  for (const asset of local.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)) {
    assert.ok(remote.includes(asset[1]), asset[1]);
    assert.equal((await request(asset[1])).status, 200);
  }
} finally {
  const logout = await post('logout', {}, cookie);
  assert.equal(logout.status, 200);
  assert.equal(await userFor(cookie), null);
  assert.equal((await request('/models/muscular.glb', { headers: { cookie } })).status, 401);
}
console.log('Cloudflare checks passed: current build, persistent account identity, cookie rotation, logout, origin protection, atlas and private-file boundaries.');
