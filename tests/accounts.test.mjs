import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAccounts } from '../server/accounts.mjs';
import { accountStorage } from '../src/account-storage.js';
import { NOTICE_VERSION } from '../shared/legal.mjs';

const origin = 'http://127.0.0.1:5173';
function request(path, body, cookie, headers = {}) {
  return new Request(origin + '/api/account/' + path, {
    method: body === undefined ? 'GET' : 'POST',
    headers: { ...(body !== undefined ? { origin, 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers },
    ...(body !== undefined ? { body: JSON.stringify(path === 'enter' ? { acknowledged: true, noticeVersion: NOTICE_VERSION, ...body } : body) } : {}),
  });
}
function fixture(t, options = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'motionstudy-accounts-'));
  const databasePath = join(dir, 'accounts.sqlite');
  const service = createAccounts({ databasePath, origin, ...options });
  t.after(() => { service.close(); rmSync(dir, { recursive: true, force: true }); });
  return { service, databasePath };
}
const cookieFrom = response => response.headers.get('set-cookie').split(';')[0];

test('a username creates a durable account and logging in again returns the same account', async t => {
  const { service, databasePath } = fixture(t);
  assert.equal((await (await service.handle(request('session'))).json()).user, null);
  const entered = await service.handle(request('enter', { username: ' Lotte ' }));
  assert.equal(entered.status, 200);
  const first = await entered.json();
  assert.equal(first.created, true);
  assert.equal(first.user.username, 'lotte');
  assert.match(entered.headers.get('set-cookie'), /HttpOnly; SameSite=Lax/);
  assert.equal(service.userFor(request('session', undefined, cookieFrom(entered))).id, first.user.id);
  assert.equal(service.userFor(request('session', undefined, 'motionstudy.session=forged')), null);
  const restarted = createAccounts({ databasePath, origin });
  try {
    assert.equal(restarted.userFor(request('session', undefined, cookieFrom(entered))).id, first.user.id);
    const again = await restarted.handle(request('enter', { username: 'LOTTE' }));
    const second = await again.json();
    assert.equal(second.created, false);
    assert.equal(second.user.id, first.user.id);
  } finally { restarted.close(); }
});

test('logout revokes the session on the server and account switching rotates the cookie', async t => {
  const { service } = fixture(t);
  const first = await service.handle(request('enter', { username: 'lotte' }));
  const firstCookie = cookieFrom(first);
  const second = await service.handle(request('enter', { username: 'ivo' }, firstCookie));
  const secondCookie = cookieFrom(second);
  assert.notEqual(firstCookie, secondCookie);
  assert.equal(service.userFor(request('session', undefined, firstCookie)), null);
  assert.equal(service.userFor(request('session', undefined, secondCookie)).username, 'ivo');
  const logout = await service.handle(request('logout', {}, secondCookie));
  assert.equal(logout.status, 200);
  assert.match(logout.headers.get('set-cookie'), /Max-Age=0/);
  assert.equal(service.userFor(request('session', undefined, secondCookie)), null);
});

test('sessions expire and HTTPS cookies have secure host-only attributes', async t => {
  let time = 1_000;
  const { service } = fixture(t, { now: () => time, sessionSeconds: 10, origin: 'https://study.example' });
  const entered = await service.handle(request('enter', { username: 'lotte' }, undefined, { origin: 'https://study.example' }));
  assert.match(entered.headers.get('set-cookie'), /^__Host-motionstudy.session=.*; Secure$/);
  const cookie = cookieFrom(entered);
  assert.equal(service.userFor(request('session', undefined, cookie)).username, 'lotte');
  time = 11_000;
  assert.equal(service.userFor(request('session', undefined, cookie)), null);
});

test('entry validates usernames, methods, body types and origin, and limits repeated requests', async t => {
  const { service } = fixture(t);
  for (const username of ['', 'a', '<script>', 'bad name', '../secret', 'x'.repeat(25), null]) {
    assert.equal((await service.handle(request('enter', { username }))).status, 400);
  }
  assert.equal((await service.handle(request('enter'))).status, 405);
  assert.equal((await service.handle(request('enter', { username: 'lotte' }, undefined, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await service.handle(request('enter', { username: 'lotte' }, undefined, { origin: '' }))).status, 403);
  assert.equal((await service.handle(request('logout', {}, undefined, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await service.handle(request('enter', { username: 'lotte' }, undefined, { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await service.handle(new Request(origin + '/api/account/enter', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: '{' }))).status, 400);
  assert.equal((await service.handle(request('enter', { username: 'x'.repeat(5000) }))).status, 413);
  for (let i = 0; i < 20; i++) await service.handle(request('enter', { username: '' }), 'other-ip');
  const limited = await service.handle(request('enter', { username: 'lotte' }), 'other-ip');
  assert.equal(limited.status, 429);
  assert.equal(limited.headers.get('retry-after'), '60');
});

test('progress, lesson drafts and legacy keys stay separate for each account', () => {
  const values = new Map([['motionstudy.game.v1', 'legacy']]);
  const storage = { getItem: key => values.get(key) || null, setItem: (key, value) => values.set(key, value) };
  const lotte = accountStorage(storage, 'lotte-id');
  const ivo = accountStorage(storage, 'ivo-id');
  for (const key of ['motionstudy.game.v1', 'motionstudy.progress.v1', 'motionstudy.session.v1', 'motionstudy.drafts.v1', 'lottequiz.v1']) {
    assert.equal(lotte.getItem(key), null);
    lotte.setItem(key, 'lotte-data');
    assert.equal(ivo.getItem(key), null);
    ivo.setItem(key, 'ivo-data');
    assert.equal(lotte.getItem(key), 'lotte-data');
    assert.equal(ivo.getItem(key), 'ivo-data');
    assert.equal(storage.getItem(lotte.keyFor(key)), 'lotte-data');
  }
  assert.equal(storage.getItem('motionstudy.game.v1'), 'legacy');
});
