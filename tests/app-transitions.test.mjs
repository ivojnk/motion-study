import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as learning from '../src/learning.js';
import * as progression from '../src/exercise-progression.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
// Execute the app's actual transitions; mock only browser boundaries, not grading/storage logic.
const source = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .split("document.addEventListener('click'")[0]
  .replace(/^import .*;\n/gm, '')
  .replaceAll('import.meta.env.BASE_URL', "'/'") + `
  globalThis.api = { start, answer, next, finish, choosePair, renderLesson, navigate, chooseAnswer, confirmPointSelection, showMuscle,
    read: () => ({ session, game, progress, route, pendingPointSelection }),
    prepare: () => { session = { ...session, prepared: true }; save(); renderLesson(); },
    viewerReady: () => { viewer = { available: new Set(curriculum.cards.map(c => c.id)), select() {}, highlight(...args) { globalThis.lastHighlight = args; }, setIsolated() {} }; },
    lastHighlight: () => globalThis.lastHighlight
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
  const context = { ...learning, ...progression, curriculum, Map, Set, Date, Math, Number, String, JSON, Error, Boolean,
    location: { hash: '' }, navigator: locks ? { locks } : {},
    document: { querySelector, querySelectorAll: () => [] },
    window: { localStorage: storage, scrollTo() {}, matchMedia: () => ({ matches: false }) } };
  vm.createContext(context);
  vm.runInContext(source, context);
  const api = context.api;
  return { ...api, data, storage, html: () => node('#learning').innerHTML, element: node,
    startLesson(region = 'basis', levelId = 'basis:0') { api.start(region, levelId); api.navigate(); api.prepare(); },
    go(hash) { context.location.hash = hash; api.navigate(); },
    play(correct = true) { const session = api.read().session; const q = curriculum.questions.find(q => q.id === session.ids[session.index]); return api.answer(session.options.indexOf(correct ? q.answer : q.distractors[0])); }
  };
}
const xp = instance => learning.gameStats(learning.readGame(instance.storage)).xp;

test('point questions clear isolation, keep answer buttons available and restore controls after grading or navigation', () => {
  const q = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
  const session = { ids: [q.id, q.id], index: 1, correct: 0, answered: 1, retryIds: [], region: q.region,
    options: learning.optionsFor(q), response: null, finished: false, prepared: true, pairingDone: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
  instance.viewerReady();
  instance.element('#isolate').checked = true;
  instance.go('#les/' + q.region);
  assert.equal(instance.element('#isolate').disabled, true);
  assert.equal(instance.element('#isolate').checked, false);
  const answers = [...instance.html().matchAll(/<button[^>]*data-answer="[^"]*"[^>]*>/g)].map(match => match[0]);
  assert.equal(answers.length, 4);
  assert.ok(answers.every(button => !button.includes('disabled')));
  instance.play();
  assert.equal(instance.element('#isolate').disabled, false);
  instance.go('#atlas');
  assert.equal(instance.element('#isolate').disabled, false);
  assert.equal(instance.element('#isolate').checked, false);
});

function pointLesson(locks) {
  const q = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
  const session = { ids: [q.id, q.id, q.id], index: 1, correct: 0, answered: 1, retryIds: [], region: q.region,
    options: learning.optionsFor(q), response: null, finished: false, prepared: true, pairingDone: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }, locks);
  instance.viewerReady(); instance.go('#les/' + q.region);
  return { instance, q };
}

test('a confirmed colour choice grades once without a second confirmation', () => {
  const { instance, q } = pointLesson();
  instance.showMuscle(q.muscleId, 'Target mesh', true);
  instance.showMuscle(q.muscleId, 'Target mesh', true);
  assert.equal(instance.read().session.response, q.answer);
  assert.equal(instance.read().session.answered, 2);
  assert.equal(xp(instance), 5);
  assert.equal(instance.read().pendingPointSelection, null);
});

test('model taps highlight a changeable choice and only confirmation grades it', () => {
  const { instance, q } = pointLesson();
  assert.match(instance.html(), /id="confirm-answer"[^>]*disabled/);
  instance.confirmPointSelection();
  assert.equal(instance.read().session.response, null);
  const wrong = curriculum.cards.find(card => card.id !== q.muscleId);
  instance.showMuscle(wrong.id, 'Original mesh name');
  assert.equal(instance.read().pendingPointSelection.response, wrong.name);
  assert.equal(instance.read().session.response, null);
  assert.equal(instance.read().session.answered, 1);
  assert.equal(xp(instance), 0);
  assert.equal(instance.element('#confirm-answer').disabled, false);
  assert.equal(instance.lastHighlight()[0], wrong.id);
  instance.showMuscle(q.muscleId, 'Target mesh');
  instance.confirmPointSelection(); instance.confirmPointSelection();
  assert.equal(instance.read().session.response, q.answer);
  assert.equal(instance.read().session.answered, 2);
  assert.equal(instance.read().session.correct, 1);
  assert.equal(xp(instance), 5);
  assert.equal(instance.read().pendingPointSelection, null);
});

test('answer button choices use the same preview and confirmation flow', () => {
  const { instance, q } = pointLesson();
  const index = instance.read().session.options.indexOf(q.answer);
  instance.chooseAnswer(index);
  assert.equal(instance.read().session.response, null);
  assert.equal(instance.read().pendingPointSelection.response, q.answer);
  assert.equal(instance.lastHighlight()[0], q.muscleId);
  assert.equal(instance.element('#point-selection-status').textContent, 'Spier geselecteerd.');
  const alternative = instance.read().session.options.findIndex(option => option !== q.answer);
  instance.chooseAnswer(alternative);
  assert.equal(instance.read().pendingPointSelection.response, instance.read().session.options[alternative]);
  assert.equal(instance.read().session.response, null);
  instance.chooseAnswer(index);
  instance.renderLesson();
  assert.match(instance.html(), /class="answer selected" aria-pressed="true"/);
  assert.doesNotMatch(instance.html(), /id="confirm-answer"[^>]*disabled/);
  instance.confirmPointSelection();
  assert.equal(instance.read().session.response, q.answer);
});

test('unmapped mesh taps preview the exact structure and are graded only after confirmation', () => {
  const { instance } = pointLesson();
  instance.showMuscle(null, 'Small anatomical muscle');
  assert.equal(instance.read().session.response, null);
  assert.equal(instance.lastHighlight()[0], null);
  assert.equal(instance.lastHighlight()[1], 'Small anatomical muscle');
  instance.confirmPointSelection();
  assert.equal(instance.read().session.response, 'Small anatomical muscle');
  assert.equal(instance.read().session.correct, 0);
  assert.equal(instance.read().session.retryIds.length, 1);
  assert.equal(xp(instance), 0);
});

test('skip, navigation and reload discard unconfirmed point choices without rewards', () => {
  const { instance, q } = pointLesson();
  instance.showMuscle(q.muscleId);
  const reloaded = app(instance.data); reloaded.viewerReady(); reloaded.go('#les/' + q.region);
  assert.equal(reloaded.read().pendingPointSelection, null);
  assert.equal(reloaded.read().session.response, null);
  instance.go('#atlas');
  assert.equal(instance.read().pendingPointSelection, null);
  instance.confirmPointSelection();
  assert.equal(xp(instance), 0);
  instance.go('#les/' + q.region); instance.showMuscle(q.muscleId); instance.next(true);
  assert.equal(instance.read().pendingPointSelection, null);
  instance.confirmPointSelection();
  assert.equal(instance.read().session.response, null);
  assert.equal(instance.read().session.index, 2);
  assert.equal(xp(instance), 0);
});

test('queued point confirmations award once and cannot grade a replacement question', async () => {
  const locks = controlledLocks();
  const { instance, q } = pointLesson(locks);
  instance.showMuscle(q.muscleId);
  instance.confirmPointSelection(); instance.confirmPointSelection();
  await locks.drain();
  assert.equal(xp(instance), 5);
  assert.equal(instance.read().session.answered, 2);
  const next = pointLesson(locks).instance;
  next.showMuscle(q.muscleId); next.confirmPointSelection(); next.next(true);
  await locks.drain();
  assert.equal(xp(next), 0);
  assert.equal(next.read().session.response, null);
});

test('answer double clicks, feedback reload and result revisits never duplicate rewards', () => {
  let instance = app(); instance.startLesson(); instance.play(); instance.play();
  assert.equal(xp(instance), 5);
  instance = app(instance.data); instance.go('#les/basis/0');
  assert.ok(instance.read().session.response); assert.equal(xp(instance), 5);
  instance.next();
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  const completedXP = instance.read().session.initialCount * 5 + 10;
  assert.equal(xp(instance), completedXP); assert.equal(instance.read().game.completed.join(','), 'basis:0');
  instance.finish(); assert.equal(xp(instance), completedXP);
  instance = app(instance.data); instance.go('#les/basis/0'); assert.equal(xp(instance), completedXP);
});

test('retry success does not pass a failed first attempt and all skips earn nothing', () => {
  const instance = app(); instance.startLesson();
  const count = instance.read().session.initialCount;
  const wrongCount = Math.floor(count * 0.2) + 1;
  for (let index = 0; index < count; index++) { instance.play(index >= wrongCount); instance.next(); }
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  assert.equal(instance.read().session.firstCorrect, count - wrongCount);
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

test('the full question directory is accessible without changing an unfinished lesson or XP', () => {
  const instance = app();
  instance.startLesson();
  const before = JSON.stringify(instance.read().session);
  const beforeXP = xp(instance);
  instance.go('#vragen');
  assert.equal([...instance.html().matchAll(/<li data-search=/g)].length, curriculum.questions.length);
  assert.match(instance.html(), /id="question-search"/);
  assert.match(instance.html(), /pagina 28/);
  assert.equal(JSON.stringify(instance.read().session), before);
  assert.equal(xp(instance), beforeXP);
  instance.go('#les/basis/0');
  assert.equal(JSON.stringify(instance.read().session), before);
});

test('new review sessions select difficulty from the individual question and freeze it through rewards and reload', () => {
  const q = curriculum.questions.find(question => question.type !== 'recognition' && learning.supportsOpenAnswer(question));
  const dueProgress = { questions: { [q.id]: { attempts: 1, correct: 1, interval: 1, due: Date.now() - 1, lastCorrect: true } }, sessions: [] };
  const instance = app({ [learning.PROGRESS_KEY]: JSON.stringify(dueProgress) });
  instance.startLesson('review', null);
  assert.deepEqual(Array.from(instance.read().session.ids), [q.id]);
  assert.deepEqual(Array.from(instance.read().session.exerciseModes), ['open']);
  assert.match(instance.html(), /id="open-answer-form"/);
  instance.play();
  assert.equal(instance.read().progress.questions[q.id].interval, 2);
  assert.equal(instance.read().session.exerciseModes[0], 'open');
  assert.equal(instance.read().progress.questions[q.id].exerciseStats.open.spacedCorrect, 1);
  const restored = app(instance.data);
  restored.go('#les/review');
  assert.equal(restored.read().session.exerciseModes[0], 'open');
  assert.match(restored.html(), /feedback success/);
  assert.equal(xp(restored), 5);
});

test('new anatomy reviews use pointing only after earlier recognition progress', () => {
  const q = curriculum.questions.find(question => question.type === 'recognition' && question.muscleId === 'pectoralis');
  const instance = app({ [learning.PROGRESS_KEY]: JSON.stringify({ questions: {
    [q.id]: { attempts: 1, correct: 1, interval: 1, due: Date.now() - 1, lastCorrect: true }
  }, sessions: [] }) });
  instance.viewerReady();
  instance.startLesson('review', null);
  assert.equal(instance.read().session.ids[0], q.id);
  assert.equal(instance.read().session.exerciseModes[0], 'point');
  assert.match(instance.html(), /id="confirm-answer"/);
  instance.showMuscle(q.muscleId, q.answer);
  assert.equal(instance.read().session.response, null);
  instance.confirmPointSelection();
  assert.equal(instance.read().session.correct, 1);
  assert.equal(instance.read().progress.questions[q.id].lastExercise, 'point');
});
