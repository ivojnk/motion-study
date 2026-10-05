import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as learning from '../src/learning.js';
import * as progression from '../src/exercise-progression.js';
import * as motivation from '../src/lesson-motivation.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const source = main.split("document.addEventListener('click'")[0]
  .replace(/^import .*;\n/gm, '')
  .replaceAll('import.meta.env.BASE_URL', "'/'") + `
 globalThis.api = { chooseAnswer, confirmChoiceSelection, answer, next, start, navigate, renderLesson, dismissInterlude,
   read: () => ({ session, game, progress, route, pendingChoiceSelection }),
   viewerReady: () => { viewer = { available: new Set(curriculum.cards.map(c => c.id)), select() {}, highlight() {}, setIsolated() {} }; } };`;

function controlledLocks() {
  const queue = [];
  return { request(name, action) { assert.equal(name, 'motionstudy-progress'); return new Promise((resolve, reject) => queue.push({ action, resolve, reject })); },
    async drain() { while (queue.length) { const item = queue.shift(); try { item.resolve(await item.action()); } catch (error) { item.reject(error); throw error; } } } };
}
function app(data = {}, locks) {
  const nodes = new Map(); const listeners = new Map();
  const node = selector => {
    if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', dataset: {}, classList: { toggle() {} }, setAttribute() {}, focus() {}, scrollIntoView() {}, closest() { return null; }, click() {} });
    return nodes.get(selector);
  };
  const fixed = new Set(['#learning', '#intro', '#model-prompt', '#muscle-select', '#isolate', '#orientation', '#selection-card', '.atlas-panel', '#credits']);
  const querySelector = selector => {
    if (fixed.has(selector)) return node(selector);
    const html = node('#learning').innerHTML;
    if (selector.startsWith('#')) {
      const id = selector.slice(1).split(':')[0];
      const markup = html.match(new RegExp('<[^>]*id="' + id + '"[^>]*>'));
      if (!markup) return null;
      const element = node('#' + id);
      if (element.disabled === undefined) element.disabled = /\sdisabled(?:\s|>)/.test(markup[0]);
      element.click = () => { if (id === 'confirm-choice-answer') context.api.confirmChoiceSelection(); else if (id === 'next-question') context.api.next(); else if (id === 'continue-interlude') context.api.dismissInterlude(); };
      return selector.includes(':not(:disabled)') && element.disabled ? null : element;
    }
    const key = selector.match(/^\[data-key="([1-4])"\]/)?.[1];
    if (key) {
      const markup = [...html.matchAll(/<button[^>]*data-key="([^\"]*)"[^>]*>/g)].find(match => match[1] === key)?.[0];
      if (!markup) return null;
      const element = node(selector); element.dataset.answer = markup.match(/data-answer="([^\"]*)"/)[1]; element.disabled = /\sdisabled(?:\s|>)/.test(markup);
      return element;
    }
    return null;
  };
  const storage = { getItem: key => data[key] || null, setItem: (key, value) => { data[key] = value; } };
  const context = { ...learning, ...progression, ...motivation, curriculum, Map, Set, Date, Math, Number, String, JSON, Error, Boolean,
    location: { hash: '' }, navigator: locks ? { locks } : {},
    document: { querySelector, querySelectorAll: () => [], addEventListener(type, listener) { listeners.set(type, listener); } },
    window: { localStorage: storage, scrollTo() {}, matchMedia: () => ({ matches: false }) } };
  vm.createContext(context); vm.runInContext(source, context);
  vm.runInContext(main.slice(main.indexOf("document.addEventListener('click'"), main.indexOf("document.addEventListener('submit'")), context);
  vm.runInContext(main.slice(main.indexOf("document.addEventListener('submit'"), main.indexOf("$('#muscle-select').addEventListener")), context);
  return { ...context.api, data, html: () => node('#learning').innerHTML,
    fire(type, event) { listeners.get(type)(event); }, go(hash) { context.location.hash = hash; context.api.navigate(); } };
}

const q = curriculum.questions.find(question => question.type !== 'recognition');
const recognition = curriculum.questions.find(question => question.type === 'recognition' && question.muscleId === 'pectoralis');
function lesson(question = q, mode = 'choice', locks) {
  const session = { ids: [question.id, question.id], exerciseModes: [mode, mode], index: 0, initialCount: 2, correct: 0, answered: 0, retryIds: [], region: question.region,
    options: learning.optionsFor(question), response: null, finished: false, prepared: true, pairingDone: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }, locks);
  instance.viewerReady(); instance.go('#les/' + question.region); return instance;
}
const xp = instance => learning.gameStats(learning.readGame({ getItem: key => instance.data[key] || null })).xp;

for (const [mode, question] of [['choice', q], ['binary', q], ['recognition', recognition]]) {
  test(mode + ' selection is changeable and only confirmation records an answer', () => {
    const instance = lesson(question, mode);
    assert.match(instance.html(), /id="confirm-choice-answer"[^>]*disabled/);
    instance.confirmChoiceSelection(); assert.equal(instance.read().session.answered, 0);
    instance.chooseAnswer(instance.read().session.options.findIndex(option => option !== question.answer));
    assert.equal(instance.read().session.response, null); assert.equal(xp(instance), 0);
    instance.chooseAnswer(instance.read().session.options.indexOf(question.answer)); instance.renderLesson();
    assert.equal(instance.read().pendingChoiceSelection.response, question.answer);
    assert.match(instance.html(), /answer selected/); assert.match(instance.html(), /aria-pressed="true"/);
    instance.confirmChoiceSelection(); instance.confirmChoiceSelection();
    assert.equal(instance.read().session.response, question.answer); assert.equal(instance.read().session.answered, 1); assert.equal(xp(instance), 5);
  });
}

test('unconfirmed choices disappear on reload and navigation, confirmed feedback survives without rewards', () => {
  let instance = lesson(); instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
  let reloaded = app(instance.data); reloaded.viewerReady(); reloaded.go('#les/' + q.region);
  assert.equal(reloaded.read().pendingChoiceSelection, null); reloaded.confirmChoiceSelection(); assert.equal(xp(reloaded), 0);
  instance.go('#atlas'); assert.equal(instance.read().pendingChoiceSelection, null); instance.confirmChoiceSelection(); assert.equal(xp(instance), 0);
  instance.go('#les/' + q.region); instance.chooseAnswer(instance.read().session.options.indexOf(q.answer)); instance.confirmChoiceSelection();
  reloaded = app(instance.data); reloaded.viewerReady(); reloaded.go('#les/' + q.region);
  assert.equal(reloaded.read().session.response, q.answer); assert.match(reloaded.html(), /feedback success/); reloaded.confirmChoiceSelection(); assert.equal(xp(reloaded), 5);
  reloaded.next(); assert.equal(reloaded.read().pendingChoiceSelection, null); assert.equal(reloaded.read().session.response, null);
});

test('queued duplicate confirmations grant one reward and cannot grade a replacement lesson', async () => {
  const locks = controlledLocks(); const instance = lesson(q, 'choice', locks);
  instance.chooseAnswer(instance.read().session.options.indexOf(q.answer)); instance.confirmChoiceSelection(); instance.confirmChoiceSelection();
  await locks.drain(); assert.equal(xp(instance), 5); assert.equal(instance.read().session.answered, 1);
  const changed = lesson(q, 'choice', locks); changed.chooseAnswer(changed.read().session.options.indexOf(q.answer)); changed.confirmChoiceSelection(); changed.start('daily');
  await locks.drain(); assert.equal(xp(changed), 0); assert.equal(changed.read().session.answered, 0);
});

test('wrong confirmation queues one retry and leaves the question until explicitly continuing', () => {
  const instance = lesson(); instance.chooseAnswer(instance.read().session.options.findIndex(option => option !== q.answer)); instance.confirmChoiceSelection();
  assert.equal(instance.read().session.index, 0); assert.equal(instance.read().session.retryIds.length, 1); assert.equal(xp(instance), 0);
  assert.match(instance.html(), /feedback retry/); assert.match(instance.html(), /Het juiste antwoord:/);
  instance.next(); assert.equal(instance.read().session.index, 1); assert.equal(instance.read().session.response, null);
});

test('numeric shortcuts select, Enter confirms and key repeat cannot skip the feedback', () => {
  const instance = lesson(); const key = String(instance.read().session.options.indexOf(q.answer) + 1);
  const keyboard = (key, extra = {}) => ({ key, target: { tagName: 'BODY', closest() { return null; } }, preventDefault() {}, ...extra });
  instance.fire('keydown', keyboard(key)); assert.equal(instance.read().session.response, null); assert.equal(xp(instance), 0);
  instance.fire('keydown', keyboard('Enter')); assert.equal(instance.read().session.response, q.answer); assert.equal(xp(instance), 5);
  instance.fire('keydown', keyboard('Enter', { repeat: true })); assert.equal(instance.read().session.index, 0);
  instance.fire('keydown', keyboard('Enter')); assert.equal(instance.read().session.index, 1);
});

test('typing and native button activation stay out of global answer shortcuts', () => {
  const instance = lesson(); let prevented = false;
  for (const tagName of ['INPUT', 'TEXTAREA', 'SELECT']) instance.fire('keydown', { key: '1', target: { tagName }, preventDefault() { prevented = true; } });
  assert.equal(prevented, false); assert.equal(instance.read().pendingChoiceSelection, null); assert.equal(xp(instance), 0);
  instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
  instance.fire('keydown', { key: 'Enter', target: { tagName: 'BUTTON', closest() { return this; } }, preventDefault() { prevented = true; } });
  assert.equal(instance.read().session.response, null); assert.equal(prevented, false);
});

function sequentialLesson() {
  const questions = curriculum.questions.filter(question => question.type !== 'recognition').slice(0, 6);
  const session = { ids: questions.map(question => question.id), exerciseModes: questions.map(() => 'choice'), index: 0, initialCount: questions.length,
    correct: 0, answered: 0, retryIds: [], region: 'daily', options: learning.optionsFor(questions[0]), response: null, finished: false,
    prepared: true, pairingDone: true, answerHistory: [], dismissedInterludes: [] };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }); instance.go('#les/daily'); return instance;
}
function confirmCurrent(instance, correct = true) {
  const session = instance.read().session;
  const question = curriculum.questions.find(question => question.id === session.ids[session.index]);
  instance.chooseAnswer(session.options.findIndex(option => correct ? option === question.answer : option !== question.answer)); instance.confirmChoiceSelection();
}

test('halfway waits for feedback continuation, survives reload and dismisses without extra XP', () => {
  let instance = sequentialLesson();
  for (let index = 0; index < 2; index++) { confirmCurrent(instance); instance.next(); }
  confirmCurrent(instance);
  assert.match(instance.html(), /feedback success/); assert.doesNotMatch(instance.html(), /id="continue-interlude"/);
  instance.next(); assert.match(instance.html(), /id="continue-interlude"/); assert.equal(xp(instance), 15);
  instance = app(instance.data); instance.go('#les/daily');
  assert.match(instance.html(), /id="continue-interlude"/); assert.equal(xp(instance), 15);
  instance.dismissInterlude(); instance.dismissInterlude();
  assert.doesNotMatch(instance.html(), /id="continue-interlude"/); assert.equal(instance.read().session.index, 3);
  assert.equal(instance.read().session.answered, 3); assert.equal(xp(instance), 15);
  instance = app(instance.data); instance.go('#les/daily');
  assert.doesNotMatch(instance.html(), /id="continue-interlude"/); assert.equal(xp(instance), 15);
  assert.deepEqual(Array.from(instance.read().session.dismissedInterludes), ['halfway']);
});

test('mistakes keep the original progress total stable and start a separate retry round after original questions', () => {
  let instance = sequentialLesson();
  for (let index = 0; index < 6; index++) {
    instance.dismissInterlude(); confirmCurrent(instance, index !== 0);
    assert.match(instance.html(), /class="lesson-progress" max="6"/);
    assert.equal(instance.read().session.index, index);
    assert.equal(instance.read().session.ids.length, 7);
    instance.next();
  }
  assert.equal(instance.read().session.index, 6); assert.equal(instance.read().session.answered, 6);
  assert.match(instance.html(), /Herkansing/); assert.match(instance.html(), /class="lesson-progress" max="1"[^>]*aria-label="Herhaling"/);
  assert.equal(xp(instance), 25);
  instance = app(instance.data); instance.go('#les/daily'); assert.match(instance.html(), /Herkansing/);
  instance.dismissInterlude(); assert.equal(xp(instance), 25);
  instance = app(instance.data); instance.go('#les/daily'); assert.doesNotMatch(instance.html(), /id="continue-interlude"/);
  confirmCurrent(instance); instance.next();
  assert.equal(instance.read().session.finished, true); assert.equal(instance.read().session.firstCorrect, 5); assert.equal(xp(instance), 40);
});

test('session restore rejects malformed reward history and interlude state while accepting legacy drafts', () => {
  const session = sequentialLesson().read().session;
  const lookup = new Map(curriculum.questions.map(question => [question.id, question]));
  const restore = extra => learning.readSession({ getItem: () => JSON.stringify({ ...session, ...extra }) }, lookup);
  for (const answerHistory of [{}, [null], [{ correct: 'true', skipped: false, retry: false }],
    [{ correct: true, skipped: false }], [{ correct: true, skipped: true, retry: false }],
    Array.from({ length: 7 }, () => ({ correct: true, skipped: false, retry: false }))]) {
    assert.equal(restore({ answerHistory }), null);
  }
  for (const dismissedInterludes of [{}, ['unknown'], ['halfway', 'halfway'], ['halfway', 'retry', 'retry']]) {
    assert.equal(restore({ dismissedInterludes }), null);
  }
  const legacy = { ...session }; delete legacy.answerHistory; delete legacy.dismissedInterludes;
  assert.ok(learning.readSession({ getItem: () => JSON.stringify(legacy) }, lookup));
  assert.ok(restore({ answerHistory: [{ correct: true, skipped: false, retry: false }], dismissedInterludes: ['halfway', 'retry'] }));
});


test('unconfirmed answers cannot be skipped or earn rewards, and reload clears only the selection', () => {
  const instance = lesson();
  instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
  instance.next(true);
  assert.equal(instance.read().session.index, 0);
  assert.equal(instance.read().session.response, null);
  assert.equal(instance.read().session.answered, 0);
  assert.equal(xp(instance), 0);
  assert.doesNotMatch(instance.html(), /id="skip-question"/);
  const restored = app(instance.data); restored.viewerReady(); restored.go('#les/' + q.region);
  assert.equal(restored.read().session.index, 0);
  assert.equal(restored.read().pendingChoiceSelection, null);
  restored.confirmChoiceSelection();
  assert.equal(xp(restored), 0);
});


test('the actual confirmation click handler records a selected answer once', () => {
  const instance = lesson();
  instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
  const click = { target: { closest(selector) { return selector === '#confirm-choice-answer:not(:disabled)' ? {} : null; } } };
  instance.fire('click', click); instance.fire('click', click);
  assert.equal(instance.read().session.response, q.answer);
  assert.equal(instance.read().session.answered, 1);
  assert.equal(xp(instance), 5);
});
