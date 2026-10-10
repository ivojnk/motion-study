import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createAccounts } from '../server/accounts.mjs';
import { createAccountService } from '../server/account-service.mjs';
import { createProgressSync, SYNC_KEY, RECOVERY_KEY, SERVER_RECOVERY_KEY } from '../src/progress-sync.js';
import { PROGRESS_KEYS, MAX_PROGRESS_BYTES } from '../shared/progress.mjs';
import { NOTICE_VERSION } from '../shared/legal.mjs';

const origin = 'https://study.example';
const progress = correct => JSON.stringify({ questions: { 'q-1': { correct, attempts: correct, due: 100, interval: 1, lastCorrect: true } }, sessions: [] });
const snapshot = correct => Object.fromEntries(PROGRESS_KEYS.map((key, index) => [key, index === 0 ? progress(correct) : index === 1 ? JSON.stringify({ days: { '2026-10-10': correct * 5 }, completed: [] }) : index === 2 ? '{}' : 'null']));
function local(initial = {}) {
  const values = new Map(Object.entries(initial));
  return { values, getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function fixture(t) {
  const db = new DatabaseSync(':memory:');
  const service = createAccountService({ db, origin });
  t.after(() => db.close());
  const request = (body, cookie, headers = {}, method = body ? 'POST' : 'GET') => new Request(origin + '/api/account/progress', {
    method, headers: { ...(body ? { origin, 'content-type': 'application/json' } : {}), ...(cookie ? { cookie } : {}), ...headers }, ...(body ? { body: JSON.stringify(body) } : {}),
  });
  async function login(username = 'lotte') {
    const response = await service.handle(new Request(origin + '/api/account/enter', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ username, acknowledged: true, noticeVersion: NOTICE_VERSION }) }));
    return response.headers.get('set-cookie').split(';')[0];
  }
  const client = (cookie, storage, options = {}) => createProgressSync({ storage, fetchImpl: (_, init) => service.handle(request(init.body && JSON.parse(init.body), cookie)), ...options });
  return { db, service, request, login, client };
}

test('server progress is authenticated, account-isolated, bounded and origin protected', async t => {
  const f = fixture(t); const cookie = await f.login();
  assert.equal((await f.service.handle(f.request())).status, 401);
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: snapshot(1) }, cookie, { 'x-motionstudy-account': 'previous-account' }))).status, 401);
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: snapshot(1) }, cookie, { origin: 'https://evil.example' }))).status, 403);
  assert.equal((await f.service.handle(f.request(undefined, cookie, { 'sec-fetch-site': 'cross-site' }))).status, 403);
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: snapshot(1) }, cookie, { 'content-type': 'text/plain' }))).status, 415);
  assert.equal((await f.service.handle(f.request(undefined, cookie, {}, 'DELETE'))).status, 405);
  for (const input of [{ revision: -1, snapshot: snapshot(1) }, { revision: 0, snapshot: {} }, { revision: 0, snapshot: { ...snapshot(1), account: 'other' } }, { revision: 0, snapshot: { ...snapshot(1), [PROGRESS_KEYS[0]]: '{"__proto__":{},"questions":{},"sessions":[]}' } }]) {
    assert.equal((await f.service.handle(f.request(input, cookie))).status, 400);
  }
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: { ...snapshot(1), [PROGRESS_KEYS[2]]: 'x'.repeat(MAX_PROGRESS_BYTES + 4096) } }, cookie))).status, 413);
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: snapshot(1) }, cookie))).status, 200);
  const other = await f.login('ivo');
  assert.deepEqual(await (await f.service.handle(f.request(undefined, other))).json(), { revision: 0, snapshot: null, updatedAt: null });
});

test('server CAS rejects stale snapshots and tolerates a lost successful response', async t => {
  const f = fixture(t); const cookie = await f.login();
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: snapshot(1) }, cookie))).status, 200);
  const stale = await f.service.handle(f.request({ revision: 0, snapshot: snapshot(2) }, cookie));
  assert.equal(stale.status, 409);
  assert.deepEqual((await stale.json()).snapshot, snapshot(1));
  assert.equal((await f.service.handle(f.request({ revision: 0, snapshot: snapshot(1) }, cookie))).status, 200);
  assert.equal((await (await f.service.handle(f.request(undefined, cookie))).json()).revision, 1);
});

test('progress survives database restart and a fresh device restores all four keys', async t => {
  const dir = mkdtempSync(join(tmpdir(), 'motionstudy-sync-')); const databasePath = join(dir, 'accounts.sqlite');
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  let service = createAccounts({ databasePath, origin });
  const entered = await service.handle(new Request(origin + '/api/account/enter', { method: 'POST', headers: { origin, 'content-type': 'application/json' }, body: JSON.stringify({ username: 'lotte', acknowledged: true, noticeVersion: NOTICE_VERSION }) }));
  const cookie = entered.headers.get('set-cookie').split(';')[0];
  const fetchImpl = (_, init) => service.handle(new Request(origin + '/api/account/progress', { ...init, headers: { ...init.headers, cookie, ...(init.method ? { origin } : {}) } }));
  const first = createProgressSync({ storage: local(snapshot(3)), fetchImpl });
  await first.initialize(); first.stop(); service.close();
  service = createAccounts({ databasePath, origin });
  try {
    const secondStorage = local(); const second = createProgressSync({ storage: secondStorage, fetchImpl });
    await second.initialize();
    for (const key of PROGRESS_KEYS) assert.equal(secondStorage.getItem(key), snapshot(3)[key]);
    assert.equal(JSON.parse(secondStorage.getItem(SYNC_KEY)).dirty, false);
  } finally { service.close(); }
});

test('offline saves remain pending across reload and retry without losing newer data', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local(snapshot(1));
  const first = f.client(cookie, storage); await first.initialize(); first.stop();
  let online = false;
  const states = [];
  const second = f.client(cookie, storage, { onStatus: state => states.push(state), fetchImpl: (_, init) => {
    if (!online) throw new Error('offline');
    return f.service.handle(f.request(init.body && JSON.parse(init.body), cookie));
  } });
  await second.initialize();
  second.storage.setItem(PROGRESS_KEYS[0], progress(2));
  assert.equal(await second.flush(), false);
  assert.equal(JSON.parse(storage.getItem(SYNC_KEY)).dirty, true);
  second.stop(); online = true;
  const third = f.client(cookie, storage); await third.initialize();
  assert.equal(JSON.parse(storage.getItem(SYNC_KEY)).dirty, false);
  assert.equal((await (await f.service.handle(f.request(undefined, cookie))).json()).snapshot[PROGRESS_KEYS[0]], progress(2));
  assert.ok(states.includes('offline'));
});

test('an empty fresh device never writes over remote progress; offline fresh startup fails', async t => {
  const f = fixture(t); const cookie = await f.login();
  await f.client(cookie, local(snapshot(4))).initialize();
  const fresh = local(); await f.client(cookie, fresh).initialize();
  assert.equal(fresh.getItem(PROGRESS_KEYS[0]), progress(4));
  assert.equal((await (await f.service.handle(f.request(undefined, cookie))).json()).revision, 1);
  const offline = f.client(cookie, local(), { fetchImpl: async () => { throw new Error('offline'); } });
  await assert.rejects(offline.initialize(), /offline/);
});

test('conflicting pending local progress is retained on cancel and recoverable when server is chosen', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local(snapshot(1));
  const first = f.client(cookie, storage); await first.initialize(); first.stop();
  await f.service.handle(f.request({ revision: 1, snapshot: snapshot(3) }, cookie));
  storage.setItem(PROGRESS_KEYS[0], progress(2));
  storage.setItem(SYNC_KEY, JSON.stringify({ revision: 1, dirty: true }));
  let conflicts = 0;
  const second = f.client(cookie, storage, { onConflict: async () => { conflicts++; return 'cancel'; } });
  await second.initialize(); await second.refresh();
  assert.equal(conflicts, 1); assert.equal(storage.getItem(PROGRESS_KEYS[0]), progress(2)); second.stop();
  const third = f.client(cookie, storage, { onConflict: async () => 'server' });
  await third.initialize();
  assert.equal(storage.getItem(PROGRESS_KEYS[0]), progress(3));
  assert.equal(JSON.parse(storage.getItem(RECOVERY_KEY))[PROGRESS_KEYS[0]], progress(2));
});

test('explicit local choice replaces remote using its current revision', async t => {
  const f = fixture(t); const cookie = await f.login();
  await f.client(cookie, local(snapshot(3))).initialize();
  const storage = local(snapshot(2));
  await f.client(cookie, storage, { onConflict: async () => 'local' }).initialize();
  const remote = await (await f.service.handle(f.request(undefined, cookie))).json();
  assert.equal(remote.revision, 2); assert.deepEqual(remote.snapshot, snapshot(2));
});

test('without Web Locks an answer saved during upload stays dirty and is sent next', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local();
  let release; let hold = false;
  const sync = f.client(cookie, storage, { fetchImpl: async (_, init) => {
    const response = await f.service.handle(f.request(init.body && JSON.parse(init.body), cookie));
    if (hold && init.body) { hold = false; await new Promise(resolve => { release = resolve; }); }
    return response;
  } });
  await sync.initialize(); hold = true;
  sync.storage.setItem(PROGRESS_KEYS[0], progress(1));
  const pending = sync.flush();
  while (!release) await new Promise(resolve => setImmediate(resolve));
  sync.storage.setItem(PROGRESS_KEYS[0], progress(2));
  release(); await pending;
  assert.equal(JSON.parse(storage.getItem(SYNC_KEY)).dirty, true);
  await sync.flush();
  assert.equal((await (await f.service.handle(f.request(undefined, cookie))).json()).snapshot[PROGRESS_KEYS[0]], progress(2));
});

test('clean cached progress refreshes from another device and requests UI reload', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local(snapshot(1)); let reloads = 0;
  const sync = f.client(cookie, storage, { onReload: () => reloads++ }); await sync.initialize();
  await f.service.handle(f.request({ revision: 1, snapshot: snapshot(2) }, cookie));
  await sync.refresh();
  assert.equal(storage.getItem(PROGRESS_KEYS[0]), progress(2)); assert.equal(reloads, 1);
});

test('interrupted adoption restores its saved recovery snapshot before uploading', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local({ ...snapshot(7), [RECOVERY_KEY]: JSON.stringify(snapshot(2)), [SYNC_KEY]: JSON.stringify({ revision: 0, dirty: true, recoveryRequired: true }) });
  await f.client(cookie, storage).initialize();
  assert.equal(storage.getItem(PROGRESS_KEYS[0]), progress(2));
  assert.deepEqual((await (await f.service.handle(f.request(undefined, cookie))).json()).snapshot, snapshot(2));
});

test('an explicitly chosen pre-login recovery replaces server progress and preserves the previous local copy', async t => {
  const f = fixture(t); const cookie = await f.login();
  await f.client(cookie, local(snapshot(1))).initialize();
  const storage = local(snapshot(2));
  const sync = f.client(cookie, storage, { initialSnapshot: snapshot(4) });
  await sync.initialize();
  assert.deepEqual((await (await f.service.handle(f.request(undefined, cookie))).json()).snapshot, snapshot(4));
  assert.deepEqual(JSON.parse(storage.getItem(RECOVERY_KEY)), snapshot(2));
  assert.deepEqual(JSON.parse(storage.getItem(SERVER_RECOVERY_KEY)), snapshot(1));
});

test('logged-in recovery persists a selected snapshot against the current server version and reloads once', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local(snapshot(1)); let reloads = 0;
  const sync = f.client(cookie, storage, { onReload: () => reloads++ }); await sync.initialize();
  await f.service.handle(f.request({ revision: 1, snapshot: snapshot(2) }, cookie));
  await sync.replace(snapshot(4));
  assert.deepEqual((await (await f.service.handle(f.request(undefined, cookie))).json()).snapshot, snapshot(4));
  assert.equal(reloads, 1); assert.deepEqual(JSON.parse(storage.getItem(RECOVERY_KEY)), snapshot(1));
  assert.deepEqual(JSON.parse(storage.getItem(SERVER_RECOVERY_KEY)), snapshot(2));
});

test('offline pre-login replacement does not touch existing local progress or forget the pending selection', async t => {
  const f = fixture(t); const storage = local(snapshot(1));
  const sync = f.client('', storage, { initialSnapshot: snapshot(4), fetchImpl: async () => { throw new Error('offline'); } });
  await assert.rejects(sync.initialize(), /offline/);
  assert.equal(storage.getItem(PROGRESS_KEYS[0]), progress(1));
});


test('normal startup preserves recovery copies when the current cache already matches the server', async t => {
  const f = fixture(t); const cookie = await f.login(); const storage = local(snapshot(1));
  const first = f.client(cookie, storage); await first.initialize();
  await first.replace(snapshot(4)); first.stop();
  const originalCopy = storage.getItem(RECOVERY_KEY);
  await f.client(cookie, storage).initialize();
  assert.equal(storage.getItem(RECOVERY_KEY), originalCopy);
});
