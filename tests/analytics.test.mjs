import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { createAccountService } from '../server/account-service.mjs';
import { analyticsDay } from '../server/analytics.mjs';
import { createUsageClient } from '../src/usage-client.js';
import { NOTICE_VERSION } from '../shared/legal.mjs';

function fixture(t) {
  const db = new DatabaseSync(':memory:');
  let time = Date.parse('2026-10-05T12:00:00Z');
  const origin = 'https://study.example';
  const transaction = action => { db.exec('BEGIN'); try { const result = action(); db.exec('COMMIT'); return result; } catch (error) { db.exec('ROLLBACK'); throw error; } };
  const service = createAccountService({ db, origin, now: () => time, transaction });
  t.after(() => db.close());
  const post = (path, body, cookie, headers = {}) => service.handle(new Request(origin + '/api/' + path, {
    method: 'POST', headers: { origin, 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}), ...headers }, body: JSON.stringify(body),
  }));
  const enter = async username => { const response = await post('account/enter', { username, acknowledged: true, noticeVersion: NOTICE_VERSION, analytics: true }); return { user: (await response.json()).user, cookie: response.headers.get('set-cookie').split(';')[0] }; };
  return { db, service, post, enter, now: () => time, setTime: value => { time = value; } };
}

test('accounts, daily activity and completed lessons count once across retries and days', async t => {
  const f = fixture(t);
  const first = await f.enter('lotte');
  const second = await f.enter('ivo');
  const active = person => f.post('usage/active', { accountId: person.user.id }, person.cookie);
  await active(first); await active(first); await active(second);
  const event = { accountId: first.user.id, id: '1760000000000:basis:basis:0', completedAt: f.now() };
  assert.equal((await (await f.post('usage/lesson', event, first.cookie)).json()).recorded, true);
  assert.equal((await (await f.post('usage/lesson', event, first.cookie)).json()).duplicate, true);
  await f.post('usage/lesson', { ...event, accountId: second.user.id }, second.cookie);
  let report = f.service.analytics.summary(7);
  assert.deepEqual(report.totals, { accounts: 2, lessons: 2, learners: 2, activeAccounts: 2, activeToday: 2 });
  assert.deepEqual(report.daily.at(-1), { day: '2026-10-05', accounts: 2, activeAccounts: 2, lessons: 2 });
  assert.equal(report.daily[0].activeAccounts, null);
  assert.equal(report.daily[0].lessons, null);
  f.setTime(f.now() + 86_400_000);
  await active(first);
  report = f.service.analytics.summary(7);
  assert.equal(report.totals.activeToday, 1);
  assert.equal(report.totals.activeAccounts, 2);
  assert.equal(report.daily.at(-2).activeAccounts, 2);
  assert.equal(report.daily.at(-1).activeAccounts, 1);
  assert.equal(report.totals.lessons, 2);
  const receipts = f.db.prepare('SELECT * FROM lesson_receipts').all();
  assert.equal(receipts.length, 2);
  assert.ok(receipts.every(row => /^[a-f0-9]{64}$/.test(row.hash) && Object.keys(row).length === 2));
  assert.ok(!JSON.stringify(report).includes(first.user.id));
  assert.ok(!JSON.stringify(report).includes('lotte'));
});

test('usage rejects unauthenticated, cross-origin, wrong-account and invalid completion requests', async t => {
  const f = fixture(t);
  const person = await f.enter('lotte');
  const body = { accountId: person.user.id, id: 'attempt:1', completedAt: f.now() };
  assert.equal((await f.post('usage/lesson', body)).status, 401);
  assert.equal((await f.post('usage/lesson', body, person.cookie, { origin: 'https://evil.example' })).status, 403);
  assert.equal((await f.post('usage/lesson', { ...body, accountId: 'different' }, person.cookie)).status, 409);
  for (const event of [{ ...body, completedAt: 0 }, { ...body, completedAt: f.now() + 120_000 }, { ...body, id: '<script>' }, { ...body, id: '' }, null]) assert.equal((await f.post('usage/lesson', event, person.cookie)).status, 400);
  assert.equal(f.service.analytics.summary().totals.lessons, 0);
});

test('test accounts are excluded and historical accounts survive schema migration', async t => {
  const f = fixture(t);
  for (const username of ['deploy-check-test', 'cloudflare-browser-check']) {
    const person = await f.enter(username);
    await f.post('usage/active', { accountId: person.user.id }, person.cookie);
    await f.post('usage/lesson', { accountId: person.user.id, id: 'test:1', completedAt: f.now() }, person.cookie);
  }
  assert.equal(f.service.analytics.summary().totals.accounts, 0);
  assert.equal(f.service.analytics.summary().totals.lessons, 0);
  const legacy = new DatabaseSync(':memory:');
  t.after(() => legacy.close());
  legacy.exec("CREATE TABLE users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL); INSERT INTO users VALUES ('old-id', 'old-user', 12345)");
  const service = createAccountService({ db: legacy, origin: 'https://study.example' });
  assert.equal(service.analytics.summary().totals.accounts, 1);
  assert.equal(service.analytics.summary().totals.lessons, 0);
});

test('Amsterdam midnight and daylight saving produce distinct consecutive calendar days', async t => {
  assert.equal(analyticsDay(Date.parse('2026-10-05T22:30:00Z')), '2026-10-06');
  const f = fixture(t);
  f.setTime(Date.parse('2026-10-27T23:30:00Z'));
  const rows = f.service.analytics.summary(7).daily;
  assert.deepEqual(rows.map(row => row.day), ['2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25', '2026-10-26', '2026-10-27', '2026-10-28']);
});

test('expired receipts and daily rows are pruned while total completed lessons remain', async t => {
  const f = fixture(t);
  let person = await f.enter('lotte');
  const event = { accountId: person.user.id, id: 'original:1', completedAt: f.now() };
  await f.post('usage/lesson', event, person.cookie);
  f.setTime(f.now() + 100 * 86_400_000);
  person = await f.enter('lotte');
  await f.post('usage/active', { accountId: person.user.id }, person.cookie);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM lesson_receipts').get().n, 0);
  assert.equal(f.db.prepare('SELECT COUNT(*) AS n FROM analytics_daily').get().n, 1);
  assert.equal(f.service.analytics.summary().totals.lessons, 1);
  assert.equal((await f.post('usage/lesson', event, person.cookie)).status, 400);
});

test('failed completion reports retry after reload without collecting answers or blocking lessons', async () => {
  const values = new Map();
  const storage = { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) };
  const requests = [];
  let online = false;
  const time = Date.now();
  const fetchImpl = async (path, options) => { requests.push({ path, body: JSON.parse(options.body) }); if (!online) throw new Error('offline'); return { ok: true }; };
  const session = { finished: true, answered: 7, startedAt: time - 1000, finishedAt: time, region: 'basis', levelId: 'basis:0', correct: 7, answers: ['private answer'] };
  const client = createUsageClient({ accountId: 'account-id', enabled: true, storage, fetchImpl, now: () => time });
  client.lessonFinished(session);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(JSON.parse([...values.values()][0]).length, 1);
  online = true;
  await createUsageClient({ accountId: 'account-id', enabled: true, storage, fetchImpl, now: () => time }).active();
  assert.equal(JSON.parse([...values.values()][0]).length, 0);
  assert.ok(!JSON.stringify(requests).includes('private answer'));
  assert.ok(requests.every(request => Object.keys(request.body).every(key => ['accountId', 'id', 'completedAt'].includes(key))));
});

test('usage retains pending events in memory when browser storage cannot write', async () => {
  let online = false;
  let delivered = 0;
  const time = Date.now();
  const client = createUsageClient({ accountId: 'account-id', enabled: true, storage: { getItem: () => null, setItem() { throw new Error('blocked'); } }, now: () => time,
    fetchImpl: async () => { if (!online) throw new Error('offline'); delivered++; return { ok: true }; } });
  client.lessonFinished({ finished: true, answered: 7, startedAt: time, finishedAt: time, region: 'basis' });
  await new Promise(resolve => setImmediate(resolve));
  online = true;
  await client.flush();
  assert.equal(delivered, 1);
});

test('turning statistics off prevents server counting and stops the client queue', async t => {
  const f = fixture(t);
  const person = await f.enter('lotte');
  await f.post('account/preferences', { analytics: false }, person.cookie);
  const response = await f.post('usage/lesson', { accountId: person.user.id, id: 'opt-out:1', completedAt: f.now() }, person.cookie);
  assert.equal((await response.json()).disabled, true);
  assert.equal(f.service.analytics.summary().totals.lessons, 0);
  const values = new Map();
  let requests = 0;
  const client = createUsageClient({ accountId: person.user.id, storage: { getItem: key => values.get(key), setItem: (key, value) => values.set(key, value) }, fetchImpl: async () => { requests++; return { ok: true }; } });
  client.lessonFinished({ finished: true, answered: 7, startedAt: f.now(), finishedAt: f.now(), region: 'basis' });
  await client.active();
  assert.equal(requests, 0);
  assert.ok([...values.values()].every(value => value === '[]'));
});
