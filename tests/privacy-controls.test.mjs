import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createHash } from 'node:crypto';
import { createAccountService } from '../server/account-service.mjs';
import { NOTICE_VERSION } from '../shared/legal.mjs';
import { createUsageClient } from '../src/usage-client.js';

const origin = 'https://study.example';
function fixture(t, database) {
  const db = database || new DatabaseSync(':memory:');
  const service = createAccountService({ db, origin });
  t.after(() => db.close());
  const post = (path, body, cookie, requestOrigin = origin) => service.handle(new Request(origin + '/api/' + path, {
    method: 'POST', headers: { origin: requestOrigin, 'content-type': 'application/json', ...(cookie ? { cookie } : {}) }, body: JSON.stringify(body),
  }));
  const enter = async (analytics = false) => {
    const response = await post('account/enter', { username: 'privacy-test', acknowledged: true, noticeVersion: NOTICE_VERSION, analytics });
    assert.equal(response.status, 200);
    return { cookie: response.headers.get('set-cookie').split(';')[0], ...(await response.json()) };
  };
  return { db, service, post, enter };
}

test('login requires current acknowledgement and never treats it as analytics consent', async t => {
  const f = fixture(t);
  for (const fields of [{}, { acknowledged: false, noticeVersion: NOTICE_VERSION }, { acknowledged: true, noticeVersion: 'old' }]) {
    const response = await f.post('account/enter', { username: 'privacy-test', ...fields });
    assert.equal(response.status, 400);
    assert.equal(response.headers.get('set-cookie'), null);
  }
  assert.equal(f.db.prepare('SELECT COUNT(*) AS count FROM users').get().count, 0);
  const entered = await f.enter();
  assert.equal(entered.preferences.analytics, false);
  assert.equal(f.db.prepare('SELECT notice_version FROM sessions').get().notice_version, NOTICE_VERSION);
  const event = await f.post('usage/active', { accountId: entered.user.id }, entered.cookie);
  assert.deepEqual(await event.json(), { recorded: false, disabled: true });
  assert.equal(f.db.prepare('SELECT last_active_at FROM users').get().last_active_at, 0);
});

test('analytics can be enabled then withdrawn without ending the study session', async t => {
  const f = fixture(t);
  const entered = await f.enter();
  assert.equal((await f.post('account/preferences', { analytics: true }, entered.cookie, 'https://other.example')).status, 403);
  assert.equal((await f.post('account/preferences', { analytics: true })).status, 401);
  assert.equal((await f.post('account/preferences', { analytics: 'yes' }, entered.cookie)).status, 400);
  const enabled = await f.post('account/preferences', { analytics: true }, entered.cookie);
  assert.equal((await enabled.json()).preferences.analytics, true);
  assert.equal((await (await f.post('usage/active', { accountId: entered.user.id }, entered.cookie)).json()).recorded, true);
  assert.equal(f.service.analytics.summary().totals.activeToday, 1);
  await f.post('account/preferences', { analytics: false }, entered.cookie);
  const lesson = await f.post('usage/lesson', { accountId: entered.user.id, id: 'lesson:1', completedAt: Date.now() }, entered.cookie);
  assert.equal((await lesson.json()).disabled, true);
  assert.equal(f.service.analytics.summary().totals.lessons, 0);
  const session = await f.service.handle(new Request(origin + '/api/account/session', { headers: { cookie: entered.cookie } }));
  const data = await session.json();
  assert.equal(data.user.id, entered.user.id);
  assert.equal(data.preferences.analytics, false);
});

test('legacy sessions need the new notice without removing accounts', async t => {
  const db = new DatabaseSync(':memory:');
  db.exec('CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL); CREATE TABLE sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);');
  const token = 'a'.repeat(64);
  db.prepare('INSERT INTO users VALUES (?, ?, ?)').run('legacy-id', 'privacy-test', 1);
  db.prepare('INSERT INTO sessions VALUES (?, ?, ?, ?)').run(createHash('sha256').update(token).digest('hex'), 'legacy-id', Date.now() + 10_000, 1);
  const f = fixture(t, db);
  assert.equal(f.service.userFor(new Request(origin, { headers: { cookie: '__Host-motionstudy.session=' + token } })), null);
  assert.equal((await f.enter()).user.id, 'legacy-id');
});

test('a disabled usage client neither sends nor queues events, and withdrawal drops pending events', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  let sent = 0;
  const client = createUsageClient({ accountId: 'id', storage, fetchImpl: async () => { sent++; throw new Error('offline'); } });
  const lesson = { finished: true, answered: 7, startedAt: Date.now() - 1000, finishedAt: Date.now(), region: 'topic', levelId: 'topic:1' };
  client.lessonFinished(lesson);
  await client.active();
  await client.flush();
  assert.equal(sent, 0);
  client.setEnabled(true);
  client.lessonFinished(lesson);
  await client.flush();
  assert.ok(sent > 0);
  const before = sent;
  client.setEnabled(false);
  await client.flush();
  await client.active();
  assert.equal(sent, before);
  assert.deepEqual(JSON.parse([...values.values()][0]), []);
});
