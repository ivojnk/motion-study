import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as learning from '../src/learning.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
// Execute the app's actual transitions; mock only browser boundaries, not grading/storage logic.
const source = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .split("document.addEventListener('click'")[0]
  .replace(/^import .*;\n/gm, '')
  .replaceAll('import.meta.env.BASE_URL', "'/'") + `
  globalThis.api = { start, answer, next, finish, choosePair, renderLesson, navigate,
    read: () => ({ session, game, progress, route }),
    prepare: () => { session = { ...session, prepared: true }; save(); renderLesson(); },
    viewerReady: () => { viewer = { available: new Set(curriculum.cards.map(c => c.id)), select() {}, setIsolated() {} }; }
  };`;

function controlledLocks() {
  const queue = [];
  return {
    request(name, action) { assert.equal(name, 'motionstudy-progress'); return new Promise((resolve, reject) => queue.push({ action, resolve, reject })); },
    async drain() { while (queue.length) { const job = queue.shift(); try { job.resolve(await job.action()); } catch (error) { job.reject(error); throw error; } } },
    get pending() { return queue.length; }
  };
}
function app(data = {}, locks) {
  const elements = new Map();
  const node = selector => {
    if (!elements.has(selector)) elements.set(selector, { innerHTML: '', setAttribute() {}, focus() {}, scrollIntoView() {} });
    return elements.get(selector);
  };
  const fixed = new Set(['#learning', '#intro', '#model-prompt', '#muscle-select', '#isolate', '#orientation', '#selection-card', '.atlas-panel']);
  const querySelector = selector => {
    if (fixed.has(selector)) return node(selector);
    const html = node('#learning').innerHTML;
    if (selector.startsWith('#') && html.includes(`id="${selector.slice(1)}"`)) return node(selector);
    if (selector === '.question-hint' && html.includes('class="question-hint"')) return node(selector);
    if (selector.startsWith('[data-side=')) return node(selector);
    return null;
  };
  const storage = { getItem: key => data[key] || null, setItem: (key, value) => { data[key] = value; } };
  const context = { ...learning, curriculum, Map, Set, Date, Math, Number, String, JSON, Error, Boolean,
    location: { hash: '' }, navigator: locks ? { locks } : {},
    document: { querySelector, querySelectorAll: () => [] },
    window: { localStorage: storage, scrollTo() {}, matchMedia: () => ({ matches: false }) } };
  vm.createContext(context);
  vm.runInContext(source, context);
  const api = context.api;
  return { ...api, data, storage, html: () => node('#learning').innerHTML,
    startLesson(region = 'basis', levelId = 'basis:0') { api.start(region, levelId); api.navigate(); api.prepare(); },
    go(hash) { context.location.hash = hash; api.navigate(); },
    play(correct = true) { const session = api.read().session; const q = curriculum.questions.find(q => q.id === session.ids[session.index]); return api.answer(session.options.indexOf(correct ? q.answer : q.distractors[0])); }
  };
}
const xp = instance => learning.gameStats(learning.readGame(instance.storage)).xp;

test('answer double clicks, feedback reload and result revisits never duplicate rewards', () => {
  let instance = app(); instance.startLesson(); instance.play(); instance.play();
  assert.equal(xp(instance), 5);
  instance = app(instance.data); instance.go('#les/basis/0');
  assert.ok(instance.read().session.response); assert.equal(xp(instance), 5);
  instance.next();
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  assert.equal(xp(instance), 40); assert.equal(instance.read().game.completed.join(','), 'basis:0');
  instance.finish(); assert.equal(xp(instance), 40);
  instance = app(instance.data); instance.go('#les/basis/0'); assert.equal(xp(instance), 40);
});

test('retry success does not pass a failed first attempt and all skips earn nothing', () => {
  const instance = app(); instance.startLesson();
  const count = instance.read().session.initialCount;
  for (let index = 0; index < count; index++) { instance.play(index >= 2); instance.next(); }
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  assert.equal(instance.read().session.firstCorrect, count - 2);
  assert.equal(instance.read().game.completed.length, 0);
  const skipped = app(); skipped.startLesson();
  while (!skipped.read().session.finished) skipped.next(true);
  assert.equal(xp(skipped), 0); assert.equal(skipped.read().game.completed.length, 0);
});

test('switching to mixed practice and browser history preserve independent lesson drafts', () => {
  let instance = app(); instance.startLesson(); instance.play(); instance.next();
  const level = JSON.parse(JSON.stringify(instance.read().session));
  instance.start('daily'); instance.navigate(); instance.prepare(); instance.play();
  const mixed = JSON.parse(JSON.stringify(instance.read().session));
  instance.go('#les/basis/0');
  assert.equal(instance.read().session.index, level.index);
  assert.equal(instance.read().session.ids.join(','), level.ids.join(','));
  assert.equal(instance.read().session.prepared, true);
  instance = app(instance.data); instance.go('#les/daily');
  assert.equal(instance.read().session.ids.join(','), mixed.ids.join(','));
  assert.equal(instance.read().session.response, mixed.response);
});

test('stale tabs merge reward and question progress instead of overwriting other tab', () => {
  const data = {}; const first = app(data); const second = app(data);
  first.startLesson(); second.startLesson(); first.play(); second.play();
  assert.equal(xp(first), 10);
  assert.equal(Object.values(learning.readProgress(first.storage).questions).reduce((total, q) => total + q.attempts, 0), 2);
});

test('async shared Web Locks serialize rewards and suppress duplicate queued answers', async () => {
  const locks = controlledLocks(); const data = {}; const first = app(data, locks); const second = app(data, locks);
  first.startLesson(); second.startLesson();
  const requests = [first.play(), first.play(), second.play()];
  assert.equal(xp(first), 0); assert.equal(locks.pending, 3);
  await locks.drain(); await Promise.all(requests);
  assert.equal(xp(first), 10); assert.equal(first.read().session.answered, 1);
  assert.equal(second.read().session.answered, 1);
});

test('queued answer cannot grade a replacement session', async () => {
  const locks = controlledLocks(); const instance = app({}, locks); instance.startLesson();
  const pending = instance.play(); instance.start('daily'); instance.navigate();
  await locks.drain(); await pending;
  assert.equal(xp(instance), 0); assert.equal(instance.read().session.region, 'daily');
  assert.equal(instance.read().session.answered, 0);
});

test('queued answer does not redirect a user who navigated to the atlas', async () => {
  const locks = controlledLocks(); const instance = app({}, locks); instance.startLesson();
  const pending = instance.play(); instance.go('#atlas');
  await locks.drain(); await pending;
  assert.equal(instance.read().route, 'atlas');
  assert.equal(instance.read().session.levelId, 'basis:0');
  assert.match(instance.html(), /31 SPIERKAARTEN/);
});

test('corrupt finished-active session is rejected without restoring unusable quiz', () => {
  const instance = app(); instance.startLesson();
  instance.data[learning.SESSION_KEY] = JSON.stringify({ ...instance.read().session, finished: true });
  assert.equal(app(instance.data).read().session, null);
});

test('async finish runs once and leaves atlas navigation intact', async () => {
  const locks = controlledLocks(); const instance = app({}, locks); instance.startLesson();
  const answered = instance.play(); await locks.drain(); await answered; instance.next();
  while (instance.read().session.index < instance.read().session.ids.length) instance.next(true);
  const duplicate = instance.finish(); instance.go('#atlas');
  await locks.drain(); await duplicate;
  assert.equal(xp(instance), 15); assert.equal(instance.read().session.finished, true);
  assert.equal(instance.read().route, 'atlas'); assert.match(instance.html(), /31 SPIERKAARTEN/);
  assert.equal(learning.readProgress(instance.storage).sessions.length, 1);
});

test('canonical URLs restore the requested stage rather than whichever chapter lesson was active', () => {
  const data = { [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: ['basis:0', 'basis:1'] }) };
  const instance = app(data); instance.startLesson('basis', 'basis:1'); instance.play(); instance.next();
  const first = instance.read().session.ids.join(',');
  instance.start('basis', 'basis:2'); instance.navigate(); instance.prepare();
  assert.equal(instance.read().session.levelId, 'basis:2');
  instance.go('#les/basis/1');
  assert.equal(instance.read().session.levelId, 'basis:1'); assert.equal(instance.read().session.index, 1);
  assert.equal(instance.read().session.ids.join(','), first);
});

test('matching errors and partially restored pairs preserve correct completion state', () => {
  let instance = app(); instance.startLesson('armen', null);
  const pairs = learning.matchingPairs(curriculum.cards, 'armen');
  instance.choosePair(pairs[0].id, 'name'); instance.choosePair(pairs[1].id, 'function');
  assert.equal(instance.read().session.matched.length, 0);
  instance.choosePair(pairs[0].id, 'name'); instance.choosePair(pairs[0].id, 'function');
  instance = app(instance.data); instance.go('#les/armen');
  assert.equal(instance.read().session.matched.join(','), pairs[0].id);
  for (const pair of pairs.slice(1)) { instance.choosePair(pair.id, 'name'); instance.choosePair(pair.id, 'function'); }
  assert.equal(instance.read().session.pairingDone, true);
  assert.equal(instance.read().session.answered, 0); assert.equal(xp(instance), 0);
});

test('same chapter free practice and level routes keep their own drafts through back and forward', () => {
  const instance = app(); instance.startLesson('basis', null); instance.play(); instance.next();
  const free = JSON.parse(JSON.stringify(instance.read().session));
  instance.start('basis', 'basis:0'); instance.navigate(); instance.prepare(); instance.play();
  const level = JSON.parse(JSON.stringify(instance.read().session));
  instance.go('#les/basis');
  assert.equal(instance.read().session.levelId, null);
  assert.equal(instance.read().session.index, free.index);
  assert.equal(instance.read().session.ids.join(','), free.ids.join(','));
  instance.go('#les/basis/0');
  assert.equal(instance.read().session.levelId, 'basis:0');
  assert.equal(instance.read().session.response, level.response);
  assert.equal(instance.read().session.ids.join(','), level.ids.join(','));
});

test('an older tab saving another lesson cannot resurrect a completed lesson draft', () => {
  const data = {}; const finishing = app(data); finishing.startLesson();
  const olderTab = app(data); olderTab.start('daily'); olderTab.navigate(); olderTab.prepare();
  assert.ok(JSON.parse(data[learning.DRAFTS_KEY])['basis:0']);
  while (!finishing.read().session.finished) { finishing.play(); finishing.next(); }
  assert.equal(JSON.parse(data[learning.DRAFTS_KEY])['basis:0'], undefined);
  olderTab.play(); olderTab.next();
  const storedDrafts = JSON.parse(data[learning.DRAFTS_KEY]);
  assert.equal(storedDrafts['basis:0'], undefined);
  assert.ok(storedDrafts.daily);
  assert.equal(learning.readGame(finishing.storage).completed.join(','), 'basis:0');
});
