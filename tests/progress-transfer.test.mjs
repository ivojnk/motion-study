import test from 'node:test';
import assert from 'node:assert/strict';
import curriculum from '../src/data/curriculum.json' with { type: 'json' };
import { accountStorage } from '../src/account-storage.js';
import { PROGRESS_KEY, GAME_KEY, DRAFTS_KEY, SESSION_KEY, recordAnswer, readProgress, readGame, readSession, readDrafts, optionsFor, awardXP } from '../src/learning.js';
import { createProgressBackup, parseProgressBackup, restoreProgressBackup, setupProgressTransfer, MAX_BACKUP_BYTES } from '../src/progress-transfer.js';

const question = curriculum.questions.find(question => question.region === 'basis');
const byId = new Map(curriculum.questions.map(question => [question.id, question]));
function storage(entries = {}) {
  const data = new Map(Object.entries(entries));
  return { data, getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}
function fixture() {
  const progress = recordAnswer({ questions: {}, sessions: [] }, question.id, false, 1780000000000, 'choice');
  const game = awardXP({ days: {}, completed: ['basis:0'] }, 35, 1780000000000);
  const session = { region: 'basis', ids: [question.id], index: 0, answered: 0, correct: 0, retryIds: [], finished: false,
    options: optionsFor(question), response: null, exerciseModes: ['open-self'], openDraft: 'Mijn onafgemaakte antwoord',
    openRevealed: false, matched: [], xp: 0 };
  return storage({ [PROGRESS_KEY]: JSON.stringify(progress), [GAME_KEY]: JSON.stringify(game),
    [DRAFTS_KEY]: JSON.stringify({ basis: session }), [SESSION_KEY]: JSON.stringify(session),
    'motionstudy.active-account': 'do-not-export', 'analytics.queue': 'private', 'unrelated': 'keep' });
}

test('backup roundtrip preserves answer history, review planning, XP, completed lessons and unfinished answers', () => {
  const original = fixture();
  const backup = createProgressBackup(original);
  const text = JSON.stringify(backup);
  assert.doesNotMatch(text, /do-not-export|private|unrelated/);
  const imported = parseProgressBackup(text);
  const target = storage({ unrelated: 'keep' });
  restoreProgressBackup(target, imported);
  assert.deepEqual(readProgress(target), readProgress(original));
  assert.deepEqual(readGame(target), readGame(original));
  assert.deepEqual(readSession(target, byId), readSession(original, byId));
  assert.deepEqual(readDrafts(target, byId), readDrafts(original, byId));
  assert.equal(target.getItem('unrelated'), 'keep');
  assert.equal(readSession(target, byId).openDraft, 'Mijn onafgemaakte antwoord');
  assert.ok(readProgress(target).questions[question.id].mistakeReview);
});

test('export migrates old progress and XP keys and an empty backup clears previous progress', () => {
  const original = fixture();
  const legacy = storage({ 'lottequiz.v1': original.getItem(PROGRESS_KEY), 'motionstudy.game.v1': JSON.stringify({ days: { '2026-05-28': 35 }, completed: [] }) });
  const backup = parseProgressBackup(JSON.stringify(createProgressBackup(legacy)));
  assert.equal(backup.progress.questions[question.id].attempts, 1);
  assert.equal(backup.game.days['2026-05-28'], 35);
  restoreProgressBackup(original, parseProgressBackup(JSON.stringify(createProgressBackup(storage()))));
  assert.deepEqual(readProgress(original), { questions: {}, sessions: [] });
  assert.deepEqual(readGame(original), { days: {}, completed: [] });
  assert.equal(readSession(original, byId), null);
  assert.deepEqual(readDrafts(original, byId), {});
});

test('invalid, foreign, future, oversized or partially corrupt files never change stored progress', () => {
  const target = fixture();
  const original = [...target.data];
  const backup = createProgressBackup(target);
  const variations = [
    '{', '{}', 'null', JSON.stringify({ ...backup, app: 'other' }), JSON.stringify({ ...backup, version: 2 }),
    JSON.stringify({ ...backup, data: { ...backup.data, game: { days: { bad: -1 }, completed: [] } } }),
    JSON.stringify({ ...backup, data: { ...backup.data, game: { days: {}, completed: ['basis:0', 'basis:0'] } } }),
    JSON.stringify({ ...backup, data: { ...backup.data, progress: { questions: { bad: { correct: -1 } }, sessions: [] } } }),
    JSON.stringify({ ...backup, data: { ...backup.data, session: { ...backup.data.session, ids: ['unknown'] } } }),
    JSON.stringify({ ...backup, data: { ...backup.data, drafts: { wrong: backup.data.session } } }),
    JSON.stringify({ ...backup, data: { ...backup.data, progress: { questions: {}, sessions: [{ at: 1, total: 1, correct: 2 }] } } }),
    JSON.stringify(backup).replace('"questions":{', '"questions":{"__proto__":{},'),
    ' '.repeat(MAX_BACKUP_BYTES + 1),
  ];
  for (const text of variations) {
    assert.throws(() => restoreProgressBackup(target, parseProgressBackup(text)));
    assert.deepEqual([...target.data], original);
  }
});

test('a failed import rolls back successful writes, including keys that were absent', () => {
  for (const initial of [fixture(), storage({ unrelated: 'keep' })]) {
    const original = [...initial.data];
    const write = initial.setItem;
    initial.setItem = (key, value) => { if (key === DRAFTS_KEY) throw new Error('QuotaExceededError'); write(key, value); };
    assert.throws(() => restoreProgressBackup(initial, createProgressBackup(fixture()).data), /huidige voortgang is behouden/);
    assert.deepEqual([...initial.data], original);
  }
});

test('transfer uses only the selected account and can move progress between account and static editions', () => {
  const local = fixture();
  const first = accountStorage(local, 'first');
  const second = accountStorage(local, 'second');
  const data = createProgressBackup(local).data;
  restoreProgressBackup(first, data);
  assert.deepEqual(createProgressBackup(first).data, data);
  assert.deepEqual(createProgressBackup(second).data, createProgressBackup(storage()).data);
  restoreProgressBackup(first, createProgressBackup(storage()).data);
  assert.deepEqual(createProgressBackup(local).data, data);
});

function ui(store = fixture()) {
  const nodes = new Map();
  const dialog = { handlers: {}, addEventListener(name, action) { this.handlers[name] = action; } };
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector, { hidden: true, value: '', handlers: {}, attributes: {}, focused: false,
      addEventListener(name, action) { this.handlers[name] = action; }, setAttribute(name, value) { this.attributes[name] = value; },
      focus() { this.focused = true; }, click() { this.clicked = true; }, closest() { return dialog; } });
    return nodes.get(selector);
  }
  let exports = []; let reloads = 0; let saves = 0; let locks = 0;
  setupProgressTransfer({ storage: store, document: { querySelector: node, body: { append() {} }, createElement() { return { click() { exports.push(this.download); }, remove() {} }; } },
    window: { Blob, URL: { createObjectURL() { return 'blob:backup'; }, revokeObjectURL() {} }, setTimeout() {} },
    withLock: async action => { locks++; return action(); }, prepareExport: () => { saves++; return true; }, beforeImport: () => true, afterImport: () => { reloads++; } });
  return { node, dialog, store, exports, reloads: () => reloads, saves: () => saves, locks: () => locks,
    click: id => node('#' + id).handlers.click(), file: async text => {
      node('#progress-import-file').files = [{ size: text.length, text: async () => text }];
      await node('#progress-import-file').handlers.change();
    } };
}

test('file selection never writes until confirmed; cancelling and closing discard the pending import', async () => {
  const instance = ui();
  const original = [...instance.store.data];
  const text = JSON.stringify(createProgressBackup(storage()));
  await instance.file(text);
  assert.deepEqual([...instance.store.data], original);
  assert.equal(instance.node('#progress-import-confirmation').hidden, false);
  assert.equal(instance.node('#progress-import-cancel').focused, true);
  instance.click('progress-import-cancel');
  await instance.click('progress-import-confirm');
  assert.deepEqual([...instance.store.data], original);
  await instance.file(text);
  instance.dialog.handlers.close();
  await instance.click('progress-import-confirm');
  assert.deepEqual([...instance.store.data], original);
  await instance.file(text);
  await instance.click('progress-import-confirm');
  assert.deepEqual(readGame(instance.store), { days: {}, completed: [] });
  assert.equal(instance.reloads(), 1);
  assert.equal(instance.locks(), 1);
});

test('export saves under the lesson lock; invalid imports give an accessible error and allow retry', async () => {
  const instance = ui();
  await instance.click('progress-export');
  assert.equal(instance.saves(), 1);
  assert.equal(instance.locks(), 1);
  assert.match(instance.exports[0], /^motionstudy-voortgang-\d{4}-\d{2}-\d{2}\.json$/);
  await instance.file('{}');
  assert.equal(instance.node('#progress-transfer-status').attributes.role, 'alert');
  assert.equal(instance.node('#progress-import-confirmation').hidden, true);
  assert.equal(instance.node('#progress-import').disabled, false);
  await instance.file(JSON.stringify(createProgressBackup(fixture())));
  assert.equal(instance.node('#progress-import-confirmation').hidden, false);
});

test('closing during file reading discards the selection instead of reviving a pending import', async () => {
  const instance = ui();
  let resolve;
  instance.node('#progress-import-file').files = [{ size: 100, text: () => new Promise(done => { resolve = done; }) }];
  const reading = instance.node('#progress-import-file').handlers.change();
  instance.dialog.handlers.close();
  resolve(JSON.stringify(createProgressBackup(fixture())));
  await reading;
  assert.equal(instance.node('#progress-import-confirmation').hidden, true);
  assert.equal(instance.node('#progress-import').disabled, false);
  await instance.click('progress-import-confirm');
  assert.equal(instance.reloads(), 0);
});

test('unreadable storage aborts export instead of downloading an empty backup', () => {
  assert.throws(() => createProgressBackup({ getItem() { throw new Error('Storage blocked'); } }), /Storage blocked/);
});
