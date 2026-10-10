import test from 'node:test';
import assert from 'node:assert/strict';
import curriculum from '../src/data/curriculum.json' with { type: 'json' };
import { PROGRESS_KEY, GAME_KEY, DRAFTS_KEY, SESSION_KEY, recordAnswer, awardXP } from '../src/learning.js';
import { scanProgressRecovery, recoverySnapshot, recoverySummary, stageProgressRecovery, readStagedRecovery, serverRecoveryCandidate, uniqueRecoveryCandidates, RECOVERY_SELECTION_KEY } from '../src/progress-recovery.js';
import { accountStorage } from '../src/account-storage.js';

const question = curriculum.questions[0];
function local(entries = {}) {
  const values = new Map(Object.entries(entries));
  return { values, get length() { return values.size; }, key: index => [...values.keys()][index] ?? null, getItem: key => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value), removeItem: key => values.delete(key) };
}
function data(xp = 5) {
  return { progress: recordAnswer({ questions: {}, sessions: [] }, question.id, true, 1791633600000, 'choice'),
    game: awardXP({ days: {}, completed: [] }, xp, 1791633600000), drafts: {}, session: null };
}
function write(storage, id, value) {
  const target = id ? accountStorage(storage, id) : storage;
  for (const [key, raw] of Object.entries(recoverySnapshot(value))) target.setItem(key, raw);
}

test('read-only scan finds all local account profiles, legacy root data and recovery copies without exporting unrelated storage', () => {
  const storage = local({ 'motionstudy.active-account': 'private-cookie-marker', 'unrelated': 'secret', 'motionstudy.account.a.analytics.queue': 'analytics-secret' });
  write(storage, 'a', data(5)); write(storage, 'b', data(25));
  accountStorage(storage, 'a').setItem('username', 'lotte');
  storage.setItem('lottequiz.v1', JSON.stringify(data(10).progress));
  storage.setItem('motionstudy.game.v1', JSON.stringify(data(10).game));
  accountStorage(storage, 'a').setItem('motionstudy.sync.recovery.v1', JSON.stringify(recoverySnapshot(data(15))));
  const before = [...storage.values];
  const result = scanProgressRecovery(storage, { id: 'a', username: 'lotte' });
  assert.deepEqual([...storage.values], before);
  assert.deepEqual(result.candidates.map(item => item.summary.xp), [25, 15, 10, 5]);
  assert.equal(result.unreadable, 0);
  assert.ok(result.candidates.some(item => item.source === 'lotte'));
  assert.ok(result.candidates.some(item => item.source === 'Oudere versie op dit apparaat'));
  assert.doesNotMatch(JSON.stringify(result), /private-cookie-marker|analytics-secret|unrelated/);
});

test('identical copies become one choice with their sources; empty data is not presented', () => {
  const storage = local(); write(storage, 'a', data()); write(storage, 'b', data());
  write(storage, 'empty', { progress: { questions: {}, sessions: [] }, game: { days: {}, completed: [] }, drafts: {}, session: null });
  const result = scanProgressRecovery(storage);
  assert.equal(result.candidates.length, 1); assert.equal(result.candidates[0].sources.length, 2);
});

test('corrupt records and malicious keys are skipped visibly while valid profiles remain untouched', () => {
  const storage = local(); write(storage, 'good', data(10)); write(storage, 'bad', data(5));
  accountStorage(storage, 'bad').setItem(PROGRESS_KEY, '{invalid');
  accountStorage(storage, 'evil').setItem(PROGRESS_KEY, '{"__proto__":{},"questions":{},"sessions":[]}');
  accountStorage(storage, 'badDraft').setItem(DRAFTS_KEY, '{"broken":{"ids":["unknown"]}}');
  const before = [...storage.values]; const result = scanProgressRecovery(storage);
  assert.equal(result.candidates.length, 1); assert.equal(result.unreadable, 3);
  assert.deepEqual([...storage.values], before);
});

test('unreadable storage throws instead of pretending that no saved progress exists', () => {
  assert.throws(() => scanProgressRecovery({ get length() { throw new Error('storage blocked'); } }), /storage blocked/);
});

test('pre-login staging is learning-only and roundtrips the chosen data independently of the login name', () => {
  const sessionStorage = local(); const chosen = data(35);
  stageProgressRecovery(sessionStorage, chosen);
  assert.deepEqual(readStagedRecovery(sessionStorage), chosen);
  assert.equal(sessionStorage.length, 1);
  assert.doesNotMatch(sessionStorage.getItem(RECOVERY_SELECTION_KEY), /username|accountId|cookie/);
  sessionStorage.removeItem(RECOVERY_SELECTION_KEY);
  assert.equal(readStagedRecovery(sessionStorage), null);
});

test('server candidate uses the same validation and summaries use learning timestamps rather than future review due dates', () => {
  const chosen = data(35);
  chosen.progress.questions[question.id].due = Date.parse('2099-01-01');
  const candidate = serverRecoveryCandidate(recoverySnapshot(chosen), { id: 'a', username: 'lotte' });
  assert.equal(candidate.source, 'Server · lotte');
  assert.equal(candidate.summary.xp, 35);
  assert.ok(recoverySummary(chosen).lastAt < Date.parse('2099-01-01'));
});


test('previous server snapshots and interrupted rollback copies can also be recovered', () => {
  const storage = local();
  const account = accountStorage(storage, 'a');
  account.setItem('motionstudy.sync.server-recovery.v1', JSON.stringify(recoverySnapshot(data(35))));
  account.setItem('motionstudy.sync.rollback.v1', JSON.stringify(recoverySnapshot(data(45))));
  account.setItem('motionstudy.sync.v1', JSON.stringify({ revision: 2, dirty: true, recoveryRequired: true }));
  const result = scanProgressRecovery(storage);
  assert.deepEqual(result.candidates.map(item => item.summary.xp), [45, 35]);
});


test('legacy data remains a separate choice when newer storage exists in the same scope', () => {
  const storage = local();
  write(storage, null, data(45));
  storage.setItem('lottequiz.v1', JSON.stringify(data(15).progress));
  storage.setItem('motionstudy.game.v1', JSON.stringify(data(15).game));
  const result = scanProgressRecovery(storage);
  assert.deepEqual(result.candidates.map(item => item.summary.xp), [45, 15]);
  assert.equal(result.candidates[1].source, 'Oudere versie op dit apparaat');
});


test('adding a server candidate preserves the source labels of already grouped local copies', () => {
  const storage = local(); write(storage, 'a', data()); write(storage, 'b', data());
  const localCandidates = scanProgressRecovery(storage).candidates;
  const combined = uniqueRecoveryCandidates([...localCandidates, serverRecoveryCandidate(recoverySnapshot(data()), { id: 'a', username: 'lotte' })]);
  assert.equal(combined.length, 1);
  assert.equal(combined[0].sources.length, 3);
});
