import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as learning from '../src/learning.js';
import * as progression from '../src/exercise-progression.js';
import * as motivation from '../src/lesson-motivation.js';
import * as groups from '../src/lesson-groups.js';
import * as lessonModels from '../src/lesson-models.js';
import { choicePalette } from '../src/muscle-choice.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
// Execute the app's actual transitions; mock only browser boundaries, not grading/storage logic.
const source = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .split("document.addEventListener('click'")[0]
  .replace(/^import .*;\n/gm, '')
  .replaceAll('import.meta.env.BASE_URL', "'/'") + `
  globalThis.api = { start, answer, next, finish, choosePair, renderLesson, navigate, chooseAnswer, confirmPointSelection, showMuscle,
    read: () => ({ session, game, progress, route, pendingPointSelection }),
    prepare: () => { session = { ...session, prepared: true }; save(); renderLesson(); },
    viewerReady: (availableIds = curriculum.cards.map(c => c.id)) => { globalThis.viewerCalls = []; viewer = { available: new Set(availableIds),
      select(...args) { globalThis.viewerCalls.push(['select', ...args]); },
      showModelChoices(...args) { globalThis.viewerCalls.push(['model-choice', ...args]); return true; },
      highlight(...args) { globalThis.lastHighlight = args; globalThis.viewerCalls.push(['highlight', ...args]); },
      setPickingEnabled(value) { globalThis.pickingEnabled = value; }, setIsolated(value) { globalThis.viewerIsolation = value; } }; },
    lastHighlight: () => globalThis.lastHighlight,
    pickingEnabled: () => globalThis.pickingEnabled,
    isolated: () => globalThis.viewerIsolation,
    toggleIsolation: value => { $('#isolate').checked = value; viewer?.setIsolated(value); },
    viewerCalls: () => globalThis.viewerCalls
  };`;

function controlledLocks() {
  const queue = [];
  return {
    request(name, action) { assert.equal(name, 'motionstudy-progress'); return new Promise((resolve, reject) => queue.push({ action, resolve, reject })); },
    async drain() { while (queue.length) { const job = queue.shift(); try { job.resolve(await job.action()); } catch (error) { job.reject(error); throw error; } } },
    get pending() { return queue.length; }
  };
}
function app(data = {}, locks, options = {}) {
  const elements = new Map();
  const analyticsEvents = [];
  const events = [];
  const bodyClasses = new Set();
  const node = selector => {
    if (!elements.has(selector)) elements.set(selector, { innerHTML: '', setAttribute() {}, focus() {}, scrollIntoView() {} });
    return elements.get(selector);
  };
  const fixed = new Set(['#learning', '#intro', '#model-prompt', '#muscle-select', '#isolate', '#bones', '#orientation', '#selection-card', '.atlas-panel', '#storage-warning', '#main']);
  const querySelector = selector => {
    if (fixed.has(selector)) return node(selector);
    const html = node('#learning').innerHTML;
    if (selector.startsWith('#') && html.includes(`id="${selector.slice(1)}"`)) return node(selector);
    if (selector === '.question-hint' && html.includes('class="question-hint"')) return node(selector);
    if (selector.startsWith('[data-side=')) return node(selector);
    return null;
  };
  const storage = { getItem: key => data[key] || null, setItem: (key, value) => { if (options.blocked) throw new Error('QuotaExceededError'); data[key] = value; } };
  let reloads = 0;
  const context = { ...learning, ...progression, ...motivation, ...groups, ...lessonModels, choicePalette, curriculum, Map, Set, Date, Math, Number, String, JSON, Error, Boolean, Event,
    location: { hash: '', reload() { reloads++; } }, navigator: locks ? { locks } : {},
    document: { body: { classList: { toggle(name, active) { if (active) bodyClasses.add(name); else bodyClasses.delete(name); } } }, querySelector, querySelectorAll: () => [], dispatchEvent(event) { events.push({ type: event.type, html: node('#learning').innerHTML }); } },
    window: { localStorage: storage, motionStudyAnalytics: { lessonFinished: session => analyticsEvents.push(session) }, scrollTo() {}, matchMedia: () => ({ matches: false }) } };
  vm.createContext(context);
  vm.runInContext(source, context);
  const api = context.api;
  if (!options.modelUnavailable) api.viewerReady();
  return { ...api, data, storage, events, analyticsEvents, prepareUpdate: () => context.window.motionStudyPrepareUpdate(), reloads: () => reloads, focused: () => bodyClasses.has('lesson-focus'), html: () => node('#learning').innerHTML, element: node,
    startLesson(region = 'basis', levelId = 'basis:0') { api.start(region, levelId); api.navigate(); api.prepare(); },
    go(hash) { context.location.hash = hash; api.navigate(); },
    play(correct = true) { const session = api.read().session; const q = curriculum.questions.find(q => q.id === session.ids[session.index]); return api.answer(session.options.indexOf(correct ? q.answer : q.distractors[0])); }
  };
}

test('coaching feedback shows the control point and preserves it after reload', () => {
  const originalCount = curriculum.questions.filter(q => q.region === 'patronen' && q.source.kind !== 'supplement').length;
  const stage = Math.ceil(originalCount / learning.LESSON_SIZE);
  const path = learning.levelPath({ completed: [] });
  const index = path.findIndex(level => level.id === 'patronen:' + stage);
  const instance = app({ [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: path.slice(0, index).map(level => level.id) }) });
  instance.startLesson('patronen', 'patronen:' + stage);
  const question = curriculum.questions.find(q => q.id === instance.read().session.ids[0]);
  assert.equal(question.source.kind, 'supplement');
  instance.play(false);
  assert.ok(instance.html().includes(question.explanation));
  assert.match(instance.html(), /Aanvullend coachingvoorbeeld/);
  const restored = app(instance.data);
  restored.go('#les/patronen/' + stage);
  assert.ok(restored.html().includes(question.explanation));
  restored.go('#vragen');
  assert.match(restored.html(), /Bron en toelichting/);
  assert.match(restored.html(), /https:\/\/pubmed\.ncbi\.nlm\.nih\.gov\/34822352\//);
  assert.match(restored.html(), /Controle: De heup beweegt naar achteren/);
});

test('home practice stays in chapter lessons without standalone 3D shortcuts', () => {
  const instance = app(); instance.go('#leren');
  assert.doesNotMatch(instance.html(), /data-start="(?:combinaties|verdieping)"/);
  assert.match(instance.html(), /data-level="combinaties:0"/);
  assert.match(instance.html(), /data-level="verdieping:0"/);
  const covered = new Set(learning.levelPath({ completed: [] }).flatMap(level =>
    learning.levelQuestions(curriculum.questions, level.topic.id, level.stage).map(question => question.id)));
  assert.deepEqual(curriculum.questions.filter(question => !covered.has(question.id)), []);
});

test('combination practice waits for the atlas, renders the whole group and preserves feedback on reload', () => {
  const instance = app({}, undefined, { modelUnavailable: true });
  instance.go('#leren');
  assert.doesNotMatch(instance.html(), /data-start="(?:combinaties|verdieping)"/);
  instance.start('combinaties'); instance.go('#les/combinaties');
  const state = instance.read();
  assert.equal(state.session.ids.length, 7);
  assert.ok(state.session.ids.every(id => curriculum.questions.find(q => q.id === id).type === 'exercise-recognition'));
  const q = curriculum.questions.find(q => q.id === state.session.ids[0]);
  assert.match(instance.html(), /3D-model laden/);
  instance.chooseAnswer(state.session.options.indexOf(q.answer));
  assert.equal(instance.read().session.answered, 0);
  instance.viewerReady(); instance.renderLesson();
  assert.equal(instance.element('.atlas-panel').hidden, false);
  assert.equal(instance.viewerCalls().at(-1)[0], 'select');
  assert.deepEqual(Array.from(instance.viewerCalls().at(-1)[1]), q.muscleIds);
  assert.ok(!/data-answer="[^"]*"[^>]*disabled/.test(instance.html()));
  assert.equal(instance.element('#muscle-select').disabled, true);
  assert.ok(!instance.element('#selection-card').innerHTML.includes(curriculum.cards.find(c => c.id === q.muscleIds[0]).name));
  instance.showMuscle('pectoralis', 'Pectoralis', true);
  assert.equal(instance.read().session.answered, 0);
  instance.element('#orientation').textContent = 'ZIJAANZICHT';
  instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
  assert.equal(instance.read().session.response, q.answer);
  assert.equal(instance.element('#orientation').textContent, 'ZIJAANZICHT');
  assert.deepEqual(Array.from(instance.lastHighlight()[0]), q.muscleIds);
  assert.ok(instance.element('#selection-card').innerHTML.includes(curriculum.cards.find(c => c.id === q.muscleIds[0]).name));
  const feedbackText = instance.html().replace(/<[^>]*>/g, '').replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, entity => ({ '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"', '&#39;': "'" })[entity]);
  if (q.id === 'combination-row') {
    assert.ok(feedbackText.includes('Rhomboideus (retractie)'));
    assert.ok(feedbackText.includes('Deltoideus · achterste kop (horizontale abductie)'));
  } else assert.ok(feedbackText.includes(q.explanation.split(': ').at(-1)), q.id);
  const restored = app(instance.data);
  restored.viewerReady(); restored.go('#les/combinaties');
  assert.equal(restored.read().session.response, q.answer);
  assert.equal(restored.element('.atlas-panel').hidden, false);
  assert.deepEqual(Array.from(restored.viewerCalls().at(-1)[1]), q.muscleIds);
  restored.next();
  assert.equal(restored.read().session.index, 1);
  assert.equal(restored.element('.atlas-panel').hidden, false);
});

test('combination recall hides the movement hint and labels the answer as an exercise', () => {
  const q = curriculum.questions.find(q => q.type === 'exercise-recognition');
  const session = { ids: [q.id], index: 0, correct: 0, answered: 0, retryIds: [], region: 'combinaties', options: learning.optionsFor(q), response: null, exerciseModes: ['recognition-open'], openDraft: 'Row met ellebogen', finished: false, prepared: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
  instance.viewerReady(); instance.go('#les/combinaties');
  assert.ok(!instance.html().includes(q.hint));
  assert.equal(instance.element('#model-prompt').hidden, true);
  assert.match(instance.html(), /Welke oefening past hierbij\? Typ de naam/);
  assert.match(instance.html(), /Row met ellebogen/);
  assert.equal(instance.element('.atlas-panel').hidden, false);
});
const xp = instance => learning.gameStats(learning.readGame(instance.storage)).xp;

test('every 3D question renders without descriptive hints or muscle names in the model legend', () => {
  const questions = curriculum.questions.filter(learning.usesModel);
  assert.ok(questions.some(q => q.type === 'model-fact'));
  assert.ok(questions.some(q => q.modelContext));
  assert.ok(questions.some(q => q.type === 'exercise-recognition'));
  for (const q of questions) {
    const mode = learning.exerciseFor(q, 0);
    const session = { ids: [q.id], exerciseModes: [mode], index: 0, initialCount: 1,
      correct: 0, answered: 0, retryIds: [], region: 'daily', options: learning.optionsFor(q),
      response: null, finished: false, prepared: true };
    const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
    instance.go('#les/daily');
    assert.doesNotMatch(instance.html(), /class="open-answer-help"/, q.id);
    assert.equal(instance.element('#model-prompt').hidden, true, q.id);
    assert.equal(instance.element('#selection-card').innerHTML, '', q.id);
  }
});

test('3D muscle names and explanations appear in feedback and remain available after reload', () => {
  const questions = [
    curriculum.questions.find(q => q.type === 'model-fact'),
    curriculum.questions.find(q => q.modelContext),
    curriculum.questions.find(q => q.type === 'exercise-recognition')
  ];
  for (const q of questions) {
    assert.ok(q);
    const session = { ids: [q.id], exerciseModes: [learning.exerciseFor(q, 0)], index: 0, initialCount: 1,
      correct: 0, answered: 0, retryIds: [], region: 'daily', options: learning.optionsFor(q),
      response: null, finished: false, prepared: true };
    const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
    instance.go('#les/daily');
    assert.doesNotMatch(instance.html(), /Gemarkeerde spieren:/);
    instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
    const names = (q.muscleIds || q.modelContext.muscleIds).map(id => curriculum.cards.find(card => card.id === id).name);
    assert.match(instance.html(), /Gemarkeerde spieren:/, q.id);
    for (const name of names) assert.ok(instance.html().includes(name), q.id);
    if (q.id === 'combination-row') {
      assert.ok(instance.html().includes('Trapezius · midden (retractie)'));
      assert.ok(instance.html().includes('Rhomboideus (retractie)'));
      assert.ok(instance.html().includes('Deltoideus · achterste kop (horizontale abductie)'));
    } else if (q.explanation) assert.ok(instance.html().includes(q.explanation.split(': ').at(-1)), q.id);
    const restored = app(instance.data);
    restored.go('#les/daily');
    assert.match(restored.html(), /Gemarkeerde spieren:/, q.id);
    assert.equal(restored.read().session.response, q.answer);
  }
});

test('single-muscle exercise feedback names the muscle once and keeps its movement explanation after reload', () => {
  const q = curriculum.questions.find(q => q.id === 'combination-seated-fly');
  const session = { ids: [q.id], exerciseModes: ['recognition'], index: 0, initialCount: 1,
    correct: 0, answered: 0, retryIds: [], region: 'daily', options: learning.optionsFor(q),
    response: null, finished: false, prepared: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
  instance.go('#les/daily');
  instance.chooseAnswer(instance.read().session.options.indexOf(q.answer));
  for (const view of [instance, app(instance.data)]) {
    view.go('#les/daily');
    const feedback = view.html().split('class="lesson-dock success"')[1];
    assert.equal((feedback.match(/Pectoralis major/g) || []).length, 1);
    assert.ok(feedback.includes('horizontale schouderadductie met licht gebogen elleboog'));
    assert.ok(feedback.includes('Seated cable fly'));
  }
});

test('direction definitions hide the atlas in every exercise form and after reload', () => {
  const definitions = curriculum.questions.filter(q => q.region === 'basis' && q.prompt.startsWith('Wat betekent'));
  assert.ok(definitions.some(q => q.id === 'concept-0'));
  for (const q of definitions) {
    for (const mode of progression.availableExercises(q)) {
      const session = { ids: [q.id], exerciseModes: [mode], index: 0, initialCount: 1,
        correct: 0, answered: 0, retryIds: [], region: 'daily', options: learning.optionsFor(q),
        response: null, finished: false, prepared: true, openDraft: '' };
      const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }, undefined, { modelUnavailable: true });
      instance.go('#les/daily');
      assert.equal(instance.element('.atlas-panel').hidden, true, q.id + ': ' + mode);
      assert.equal(instance.element('#model-prompt').hidden, true);
      assert.doesNotMatch(instance.html(), /data-model-question|3D-model laden|Paars markeert/);
      assert.ok(instance.html().includes(q.prompt));
      if (['choice', 'binary'].includes(mode)) {
        instance.chooseAnswer(session.options.indexOf(q.answer));
        assert.equal(instance.read().session.correct, 1, q.id + ': answers without waiting for model');
      }
      const restored = app(instance.data);
      restored.go('#les/daily');
      assert.equal(restored.element('.atlas-panel').hidden, true, q.id + ': restored ' + mode);
      assert.doesNotMatch(restored.html(), /data-model-question|Paars markeert/);
    }
  }
});

for (const mode of ['choice', 'binary']) {
  test('3D context keeps ' + mode + ' grading, loading protection and saved feedback', () => {
    const q = curriculum.questions.find(q => q.id === 'pectoralis-functie');
    const plain = curriculum.questions.find(q => q.type === 'choice' && !learning.usesModel(q));
    const session = { ids: [q.id, plain.id], exerciseModes: [mode, 'choice'], index: 0, initialCount: 2,
      correct: 0, answered: 0, retryIds: [], region: 'daily', options: learning.optionsFor(q),
      response: null, finished: false, prepared: true };
    const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }, undefined, { modelUnavailable: true });
    instance.go('#les/daily');
    assert.match(instance.html(), /3D-model laden/);
    instance.chooseAnswer(session.options.indexOf(q.answer));
    instance.answer(session.options.indexOf(q.answer));
    assert.equal(instance.read().session.answered, 0);
    assert.equal(xp(instance), 0);
    instance.viewerReady(); instance.renderLesson();
    assert.equal(instance.element('.atlas-panel').hidden, false);
    assert.equal(instance.pickingEnabled(), false);
    assert.equal(instance.element('#isolate').disabled, false);
    assert.deepEqual(Array.from(instance.viewerCalls().at(-1)[1]), q.modelContext.muscleIds);
    assert.match(instance.html(), /data-model-question/);
    assert.ok(instance.html().includes(q.prompt));
    instance.showMuscle('pectoralis', 'Pectoralis', true);
    assert.equal(instance.read().session.answered, 0);
    assert.ok(!instance.element('#selection-card').innerHTML.includes('Pectoralis'));
    instance.element('#orientation').textContent = 'ZIJAANZICHT';
    instance.chooseAnswer(session.options.indexOf(q.answer));
    assert.equal(instance.read().session.correct, 1);
    assert.equal(instance.read().session.exerciseModes[0], mode);
    assert.equal(instance.element('#orientation').textContent, 'ZIJAANZICHT');
    assert.deepEqual(Array.from(instance.lastHighlight()[0]), q.modelContext.muscleIds);
    assert.equal(xp(instance), 5);
    const restored = app(instance.data); restored.go('#les/daily');
    assert.equal(restored.read().session.response, q.answer);
    assert.equal(restored.element('.atlas-panel').hidden, false);
    assert.equal(xp(restored), 5);
    restored.next();
    assert.equal(restored.element('.atlas-panel').hidden, true);
    assert.equal(restored.pickingEnabled(), true);
  });
}

test('all eight first muscle lessons include early recognition and preserve their original seven facts', () => {
  const path = learning.levelPath({ completed: [] });
  for (const region of ['borst', 'rug', 'armen', 'core', 'heup', 'quads', 'hamstrings', 'kuiten']) {
    const index = path.findIndex(level => level.topic.id === region);
    const level = path[index];
    const instance = app({ [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: path.slice(0, index).map(level => level.id) }) });
    instance.startLesson(region, level.id);
    const state = instance.read();
    const originals = learning.levelQuestions(curriculum.questions, region, 0);
    assert.equal(state.session.initialCount, 8, region);
    assert.ok(originals.every(q => state.session.ids.includes(q.id)), region);
    assert.ok(state.session.ids.some(id => curriculum.questions.find(q => q.id === id).type === 'recognition'), region);
    assert.equal(instance.element('.atlas-panel').hidden, false, region);
  }
});

test('actual lesson completion reports analytics once and restores its completion time after reload', () => {
  const instance = app();
  instance.startLesson();
  for (let i = 0; i < 20 && !instance.read().session.finished; i++) { instance.play(true); instance.next(); }
  assert.equal(instance.read().session.finished, true);
  assert.equal(instance.analyticsEvents.length, 1);
  assert.ok(Number.isSafeInteger(instance.analyticsEvents[0].finishedAt));
  instance.finish(); instance.finish();
  assert.equal(instance.analyticsEvents.length, 1);
  const restored = app(instance.data);
  assert.equal(restored.read().session.finishedAt, instance.read().session.finishedAt);
  restored.finish();
  assert.equal(restored.analyticsEvents.length, 0);
});

test('confirmed atlas picks preserve the camera and orientation for mapped and unmapped muscles', () => {
  const instance = app();
  instance.viewerReady(); instance.go('#atlas');
  instance.element('#orientation').textContent = 'ZIJAANZICHT';
  const before = instance.viewerCalls().length;
  const card = curriculum.cards.find(card => card.view === 'back');
  instance.showMuscle(card.id, 'Picked mesh', true);
  instance.showMuscle(null, 'Small anatomical muscle', true);
  assert.deepEqual(Array.from(instance.viewerCalls().slice(before), call => Array.from(call)), [
    ['highlight', card.id], ['highlight', null, 'Small anatomical muscle']
  ]);
  assert.equal(instance.element('#orientation').textContent, 'ZIJAANZICHT');
  assert.match(instance.element('#selection-card').innerHTML, /Small anatomical muscle/);
  instance.showMuscle(card.id);
  assert.equal(instance.viewerCalls().at(-1)[0], 'select');
  assert.equal(instance.element('#orientation').textContent, 'ACHTERZIJDE');
});

test('point questions preserve isolation with controls available through grading and navigation', () => {
  const q = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
  const session = { ids: [q.id, q.id], index: 1, correct: 0, answered: 1, retryIds: [], region: q.region,
    options: learning.optionsFor(q), response: null, finished: false, prepared: true, pairingDone: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
  instance.viewerReady();
  instance.element('#isolate').checked = true;
  instance.element('#bones').checked = false;
  instance.go('#les/' + q.region);
  assert.equal(instance.element('#isolate').disabled, false);
  assert.equal(instance.element('#isolate').checked, true);
  const answers = [...instance.html().matchAll(/<button[^>]*data-answer="[^"]*"[^>]*>/g)].map(match => match[0]);
  assert.equal(answers.length, 4);
  assert.ok(answers.every(button => !button.includes('disabled')));
  instance.play();
  assert.equal(instance.element('#isolate').disabled, false);
  instance.go('#atlas');
  assert.equal(instance.element('#isolate').disabled, false);
  assert.equal(instance.element('#isolate').checked, true);
  assert.equal(instance.isolated(), true);
  assert.equal(instance.element('#bones').checked, false);
});

test('model questions preserve both display settings through rendering, feedback, the next question and atlas navigation', () => {
  const plain = curriculum.questions.find(q => q.type === 'choice' && !learning.usesModel(q));
  const recognition = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'biceps');
  const examples = [
    [recognition, 'model-choice'], [recognition, 'point'],
    [curriculum.questions.find(q => q.id === 'pectoralis-functie'), 'choice'],
    [curriculum.questions.find(q => q.type === 'exercise-recognition'), 'recognition'],
    [curriculum.questions.find(q => q.type === 'model-fact'), 'choice']
  ];
  for (const [q, mode] of examples) for (const isolated of [true, false]) {
    const options = learning.optionsFor(q, Math.random, mode);
    const session = { ids: [q.id, plain.id], exerciseModes: [mode, 'choice'], index: 0, initialCount: 2,
      correct: 0, answered: 0, retryIds: [], region: 'daily', options, response: null, finished: false, prepared: true };
    const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
    instance.toggleIsolation(isolated);
    instance.element('#bones').checked = !isolated;
    const assertSettings = () => {
      assert.equal(instance.element('#isolate').disabled, false, mode);
      assert.notEqual(instance.element('#bones').disabled, true, mode);
      assert.equal(instance.element('#isolate').checked, isolated, mode);
      assert.equal(instance.isolated(), isolated, mode);
      assert.equal(instance.element('#bones').checked, !isolated, mode);
    };
    instance.go('#les/daily'); assertSettings();
    instance.renderLesson({ preserveCamera: true }); assertSettings();
    instance.play(); assertSettings();
    instance.next(); assertSettings();
    instance.go('#atlas'); assertSettings();
  }
});

function pointLesson(locks) {
  const q = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
  const session = { ids: [q.id, q.id, q.id], index: 1, correct: 0, answered: 1, retryIds: [], region: q.region,
    options: learning.optionsFor(q), response: null, finished: false, prepared: true, pairingDone: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }, locks);
  instance.viewerReady(); instance.go('#les/' + q.region);
  return { instance, q };
}

test('point grading preserves the camera while showing the correct muscle, and the next question resets it', () => {
  const { instance, q } = pointLesson();
  const before = instance.viewerCalls().length;
  const wrong = curriculum.cards.find(card => card.id !== q.muscleId);
  instance.element('#orientation').textContent = 'ZIJAANZICHT';
  instance.showMuscle(wrong.id, 'Picked mesh', true);
  assert.equal(instance.read().session.response, wrong.name);
  assert.ok(instance.viewerCalls().slice(before).every(call => call[0] === 'highlight'));
  assert.equal(instance.lastHighlight()[0], q.muscleId);
  assert.equal(instance.element('#orientation').textContent, 'ZIJAANZICHT');
  instance.next();
  assert.equal(instance.viewerCalls().at(-1)[0], 'select');
});

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
  assert.match(instance.element('#point-selection-status').textContent, /Je kunt je keuze nog wijzigen/);
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

test('navigation and reload discard unconfirmed point choices, while next cannot skip them', () => {
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
  assert.equal(instance.read().pendingPointSelection.response, q.answer);
  assert.equal(instance.read().session.response, null);
  assert.equal(instance.read().session.index, 1);
  assert.equal(xp(instance), 0);
  instance.confirmPointSelection(); instance.next();
  assert.equal(instance.read().pendingPointSelection, null);
  assert.equal(instance.read().session.index, 2);
  assert.equal(xp(instance), 5);
});

test('queued point confirmations award once and cannot be bypassed before grading', async () => {
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
  assert.equal(next.read().session.index, 1);
  assert.equal(xp(next), 5);
  assert.equal(next.read().session.response, q.answer);
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

test('correcting mistakes unlocks the next lesson while first-attempt score stays separate', () => {
  const instance = app(); instance.startLesson();
  const count = instance.read().session.initialCount;
  const wrongCount = Math.floor(count * 0.2) + 1;
  for (let index = 0; index < count; index++) { instance.play(index >= wrongCount); instance.next(); }
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  assert.equal(instance.read().session.firstCorrect, count - wrongCount);
  assert.equal(instance.read().game.completed.join(','), 'basis:0');
  const skipped = app(); skipped.startLesson();
  const before = skipped.read().session.index;
  skipped.next(); skipped.next(true); skipped.finish();
  assert.equal(skipped.read().session.index, before);
  assert.equal(skipped.read().session.finished, false);
  assert.doesNotMatch(skipped.html(), /skip-question|vraag overslaan/);
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

const homeCard = instance => instance.html().split('<div class="study-status">')[0];
function continueHomeLesson(instance) {
  const card = homeCard(instance);
  const levelId = card.match(/data-level="([^"]+)"/)?.[1];
  instance.start(levelId ? levelId.split(':')[0] : card.match(/data-start="([^"]+)"/)[1], levelId || null);
  instance.navigate();
}

test('the home card resumes an unfinished replay before recommending the next lesson, including after reload', () => {
  const data = { [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: ['basis:0', 'basis:1'] }) };
  let instance = app(data); instance.startLesson('basis', 'basis:1'); instance.play(); instance.next();
  const pending = JSON.stringify(instance.read().session);
  for (const reload of [false, true]) {
    if (reload) instance = app(data);
    instance.go('#leren');
    assert.match(homeCard(instance), /Hoofdstuk 1 · lopende les/);
    assert.match(homeCard(instance), /Les 2 van 15/);
    assert.match(homeCard(instance), /data-level="basis:1">Ga verder/);
    continueHomeLesson(instance);
    assert.equal(instance.read().route, 'les/basis/1');
    assert.equal(JSON.stringify(instance.read().session), pending);
  }
});

test('the home card restores a saved course draft when the active session is finished', () => {
  const data = { [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: ['basis:0', 'basis:1'] }) };
  let instance = app(data); instance.startLesson('basis', 'basis:1'); instance.play();
  const pending = JSON.stringify(instance.read().session);
  instance.startLesson('daily', null);
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  instance = app(data); instance.go('#leren');
  assert.match(homeCard(instance), /data-level="basis:1">Ga verder/);
  continueHomeLesson(instance);
  assert.equal(JSON.stringify(instance.read().session), pending);
});

test('the home card resumes mixed and free chapter practice without replacing their questions', () => {
  for (const region of ['daily', 'basis']) {
    let instance = app(); instance.startLesson(region, null); instance.play(); instance.next();
    const pending = JSON.stringify(instance.read().session);
    instance = app(instance.data); instance.go('#leren');
    assert.match(homeCard(instance), new RegExp('data-start="' + region + '">Ga verder'));
    assert.match(homeCard(instance), /[Ll]opende les/);
    continueHomeLesson(instance);
    assert.equal(JSON.stringify(instance.read().session), pending);
  }
});

test('the home card only recommends the next lesson once the current lesson is finished', () => {
  const instance = app(); instance.go('#leren');
  assert.match(homeCard(instance), /data-level="basis:0">Start les/);
  continueHomeLesson(instance); instance.play();
  const pending = JSON.stringify(instance.read().session);
  instance.go('#leren');
  assert.match(homeCard(instance), /data-level="basis:0">Ga verder/);
  continueHomeLesson(instance);
  assert.equal(JSON.stringify(instance.read().session), pending);
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  instance.go('#leren');
  assert.match(homeCard(instance), /volgende les/);
  assert.match(homeCard(instance), /data-level="basis:1">Start les/);
});

test('stale tabs merge reward and question progress instead of overwriting other tab', () => {
  const data = {}; const first = app(data); const second = app(data);
  first.startLesson(); second.startLesson('daily', null); first.play(); second.play();
  assert.equal(xp(first), 10);
  assert.equal(Object.values(learning.readProgress(first.storage).questions).reduce((total, q) => total + q.attempts, 0), 2);
});

test('async shared Web Locks serialize rewards and suppress duplicate queued answers', async () => {
  const locks = controlledLocks(); const data = {}; const first = app(data, locks); const second = app(data, locks);
  first.startLesson(); second.startLesson('daily', null);
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
  assert.match(instance.html(), /<h2>Spieren<\/h2>/);
});

test('corrupt finished-active session is rejected without restoring unusable quiz', () => {
  const instance = app(); instance.startLesson();
  instance.data[learning.SESSION_KEY] = JSON.stringify({ ...instance.read().session, finished: true });
  assert.equal(app(instance.data).read().session, null);
});

test('async finish runs once and leaves atlas navigation intact', async () => {
  const locks = controlledLocks(); const instance = app({}, locks); instance.startLesson();
  const answered = instance.play(); await locks.drain(); await answered; instance.next();
  const count = instance.read().session.initialCount;
  while (instance.read().session.index < instance.read().session.ids.length) {
    const pending = instance.play(); await locks.drain(); await pending; instance.next();
  }
  const duplicate = instance.finish(); instance.go('#atlas');
  await locks.drain(); await duplicate;
  assert.equal(xp(instance), count * 5 + 10); assert.equal(instance.read().session.finished, true);
  assert.equal(instance.read().route, 'atlas'); assert.match(instance.html(), /<h2>Spieren<\/h2>/);
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
  assert.deepEqual(Array.from(instance.read().session.ids), Array(7).fill(q.id));
  assert.deepEqual(Array.from(instance.read().session.exerciseModes), Array(7).fill('open'));
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


test('questions without model context hide the atlas; visual questions and atlas restore it', () => {
  const visual = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
  const text = curriculum.questions.find(q => q.type === 'choice' && !learning.usesModel(q));
  assert.ok(text);
  const session = { ids: [visual.id, text.id, visual.id], exerciseModes: ['recognition', 'choice', 'point'],
    index: 0, initialCount: 3, correct: 0, answered: 0, retryIds: [], region: visual.region,
    options: learning.optionsFor(visual), response: null, finished: false, prepared: true, pairingDone: true };
  let instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
  instance.viewerReady(); instance.go('#les/' + visual.region);
  assert.equal(instance.element('.atlas-panel').hidden, false);
  assert.doesNotMatch(instance.html(), /skip-question|vraag overslaan/);
  instance.play(); instance.next();
  assert.equal(instance.element('.atlas-panel').hidden, true);
  instance.play();
  assert.equal(instance.element('.atlas-panel').hidden, true);
  instance = app(instance.data); instance.viewerReady(); instance.go('#les/' + visual.region);
  assert.equal(instance.element('.atlas-panel').hidden, true);
  instance.next();
  assert.equal(instance.element('.atlas-panel').hidden, false);
  instance.go('#atlas');
  assert.equal(instance.element('.atlas-panel').hidden, false);
  instance.go('#les/' + visual.region);
  instance.showMuscle(visual.muscleId); instance.confirmPointSelection(); instance.next();
  assert.equal(instance.read().session.finished, true);
  assert.equal(instance.element('.atlas-panel').hidden, true);
  instance.go('#atlas');
  assert.equal(instance.element('.atlas-panel').hidden, false);
});


test('lessons start directly with only the question and progress, and restore navigation after exit', () => {
  const instance = app();
  instance.start('basis', 'basis:0'); instance.navigate();
  assert.equal(instance.read().session.prepared, true);
  assert.equal(instance.focused(), true);
  assert.equal(instance.element('#intro').hidden, true);
  assert.equal(instance.element('#intro').innerHTML, '');
  assert.match(instance.html(), /aria-label="Lesvoortgang"/);
  assert.match(instance.html(), /value="0"/);
  assert.doesNotMatch(instance.html(), /lesson-top|class="tag"|privacy-note|question-hint|class="source"|XP|begin-exercises/);
  instance.play();
  assert.match(instance.html(), /value="1"/);
  assert.doesNotMatch(instance.html(), /class="source"|privacy-note|Bijna|Ja, die heb je/);
  instance.next();
  assert.match(instance.html(), /value="1"/);
  const restored = app(instance.data); restored.go('#les/basis/0');
  assert.equal(restored.focused(), true);
  assert.equal(restored.element('#intro').hidden, true);
  restored.go('#leren');
  assert.equal(restored.focused(), false);
  assert.equal(restored.element('#intro').hidden, false);
  assert.match(restored.element('#intro').innerHTML, /<h1>Leerpad<\/h1>/);
});


test('new lessons retain seven source questions and include early 3D practice without a matching round', () => {
  const instance = app(); instance.viewerReady();
  for (const [region, id] of [['basis', 'basis:0'], ['daily', null], ['armen', null]]) {
    instance.startLesson(region, id);
    const level = learning.levelPath({ completed: [] }).find(level => level.id === id);
    const originals = level ? learning.levelQuestions(curriculum.questions, level.topic.id, level.stage) : [];
    const expected = level ? lessonModels.withLessonModels(originals, curriculum.questions) : new Array(learning.LESSON_SIZE);
    assert.equal(instance.read().session.initialCount, expected.length);
    assert.equal(instance.read().session.ids.length, expected.length);
    assert.ok(originals.every(q => instance.read().session.ids.includes(q.id)));
    assert.ok(instance.html().includes('aria-valuetext="0 van ' + expected.length + ' vragen goed beantwoord"'));
    assert.doesNotMatch(instance.html(), /matching-grid/);
  }
});

test('answer streak resets on mistakes, repeated mistakes keep extending, and all state survives reload', () => {
  let instance = app(); instance.startLesson();
  instance.play(); instance.next(); instance.play(); instance.next();
  assert.equal(instance.read().session.answerStreak, 2);
  assert.equal(instance.read().session.bestAnswerStreak, 2);
  assert.match(instance.html(), /class="lesson-progress" max="7" value="2"/);
  instance.play(false);
  assert.match(instance.html(), /class="lesson-progress" max="7" value="2"/);
  assert.equal(instance.read().session.answerStreak, 0);
  assert.equal(instance.read().session.ids.length, 8);
  assert.match(instance.html(), /0 streak/);
  assert.match(instance.html(), /class="lesson-retries"[^>]*aria-label="\+1 herhaling"/);
  assert.doesNotMatch(instance.html(), /class="lesson-status"/);
  instance = app(instance.data); instance.go('#les/basis/0');
  assert.equal(instance.read().session.bestAnswerStreak, 2);
  assert.equal(instance.read().session.ids.length, 8);
  assert.match(instance.html(), /class="lesson-progress" max="7" value="2"/);
  instance.next();
  assert.match(instance.html(), /class="lesson-progress" max="7" value="2"/);
  while (instance.read().session.index < 7) { instance.play(); instance.next(); }
  instance.play(false);
  assert.equal(instance.read().session.ids.length, 9);
  assert.match(instance.html(), /class="lesson-progress" max="7" value="6"/);
  assert.equal(instance.read().session.answerStreak, 0);
  instance.next();
  assert.equal(instance.read().session.finished, false);
  assert.equal(instance.read().game.completed.length, 0);
  assert.equal(instance.read().session.exerciseModes[8], 'choice');
  instance = app(instance.data); instance.go('#les/basis/0');
  instance.play();
  assert.equal(instance.read().session.answerStreak, 1);
  assert.match(instance.html(), /class="lesson-progress" max="7" value="7"/);
  instance.next();
  assert.equal(instance.read().session.finished, true);
  assert.equal(instance.read().session.correct, 7);
  assert.equal(instance.read().session.firstCorrect, 6);
  assert.equal(instance.read().session.answered, 9);
  assert.equal(instance.read().session.bestAnswerStreak, 4);
  assert.equal(instance.read().game.completed.join(','), 'basis:0');
  assert.match(instance.html(), /beste reeks/);
  assert.match(instance.html(), /6\/7/);
  assert.equal(xp(instance), 45);
  instance.startLesson('basis', 'basis:1');
  assert.equal(instance.read().session.answerStreak, 0);
  assert.equal(instance.read().session.bestAnswerStreak, 0);
});

test('answer streak continues after feedback reload and survives switching between lesson drafts', () => {
  let instance = app(); instance.startLesson(); instance.play();
  instance = app(instance.data); instance.go('#les/basis/0');
  assert.equal(instance.read().session.answerStreak, 1);
  instance.play();
  assert.equal(instance.read().session.answerStreak, 1);
  instance.next(); instance.play();
  assert.equal(instance.read().session.answerStreak, 2);
  instance.startLesson('daily', null); instance.play();
  assert.equal(instance.read().session.answerStreak, 1);
  instance.go('#les/basis/0');
  assert.equal(instance.read().session.answerStreak, 2);
  instance.go('#les/daily');
  assert.equal(instance.read().session.answerStreak, 1);
});


test('installation invitation starts after the lesson result and does not fire for reloads or incomplete lessons', () => {
  let instance = app();
  instance.startLesson();
  instance.finish();
  assert.equal(instance.events.length, 0);
  while (!instance.read().session.finished) { instance.play(); instance.next(); }
  assert.equal(instance.events.length, 1);
  assert.equal(instance.events[0].type, 'motionstudy:lesson-completed');
  assert.match(instance.events[0].html, /id="result-title"/);
  instance.finish();
  assert.equal(instance.events.length, 1);
  instance = app(instance.data);
  instance.go('#les/basis/0');
  assert.equal(instance.events.length, 0);
});

test('an error survives correction and reload, interleaves in the next lesson and advances only once there', () => {
  let instance = app();
  instance.startLesson();
  const failedId = instance.read().session.ids[0];
  instance.play(false); instance.next();
  while (!instance.read().session.finished) { instance.play(true); instance.next(); }
  assert.equal(instance.read().progress.questions[failedId].mistakeReview.successes, 0);
  assert.equal(learning.needsMistakeReview(instance.read().progress.questions[failedId]), true);
  const firstLessonId = instance.read().session.reviewLessonId;
  instance = app(instance.data);
  instance.startLesson('basis', 'basis:1');
  const originals = learning.levelQuestions(curriculum.questions, 'basis', 1).map(q => q.id);
  const ids = Array.from(instance.read().session.ids);
  assert.equal(ids.length, 8);
  assert.ok(originals.every(id => ids.includes(id)));
  assert.equal(ids.filter(id => id === failedId).length, 1);
  while (instance.read().session.ids[instance.read().session.index] !== failedId) { instance.play(true); instance.next(); }
  assert.doesNotMatch(instance.html(), /Eerder fout/);
  instance.play(true);
  assert.equal(instance.read().progress.questions[failedId].mistakeReview.successes, 1);
  assert.notEqual(instance.read().session.reviewLessonId, firstLessonId);
  const laterLessonId = instance.read().session.reviewLessonId;
  instance = app(instance.data); instance.go('#les/basis/1');
  assert.equal(instance.read().session.reviewLessonId, laterLessonId);
  instance.play(true);
  assert.equal(instance.read().progress.questions[failedId].mistakeReview.successes, 1);
  assert.equal(instance.read().session.initialCount, 8);
});


test('a stale tab cannot overwrite newer feedback or lesson position', () => {
  const data = {}; const active = app(data); active.startLesson();
  const stale = app(data); stale.go('#les/basis/0');
  active.play(); active.next();
  const before = JSON.stringify(data);
  stale.prepare();
  assert.equal(JSON.stringify(data), before);
  assert.equal(stale.reloads(), 1);
  const reopened = app(data); reopened.go('#les/basis/0');
  assert.equal(reopened.read().session.index, 1);
  assert.equal(xp(reopened), 5);
});

test('a stale tab cannot grade an answer already saved by another tab', () => {
  const data = {}; const active = app(data); active.startLesson();
  const stale = app(data); stale.go('#les/basis/0');
  active.play();
  const before = JSON.stringify(data);
  stale.play();
  assert.equal(JSON.stringify(data), before);
  assert.equal(stale.reloads(), 1);
  assert.equal(xp(active), 5);
});

test('a stale tab on the same lesson cannot resurrect its completed draft', () => {
  const data = {}; const active = app(data); active.startLesson();
  const stale = app(data); stale.go('#les/basis/0');
  while (!active.read().session.finished) { active.play(); active.next(); }
  const before = JSON.stringify(data);
  stale.prepare();
  assert.equal(JSON.stringify(data), before);
  assert.equal(stale.reloads(), 1);
  assert.equal(learning.readDrafts(active.storage, new Map(curriculum.questions.map(q => [q.id, q])))['basis:0'], undefined);
});

test('storage failures warn visibly and a later successful save keeps in-memory progress', () => {
  const options = { blocked: true }; const instance = app({}, undefined, options);
  instance.startLesson(); instance.play();
  assert.equal(instance.element('#storage-warning').hidden, false);
  assert.equal(instance.read().session.answered, 1);
  options.blocked = false;
  instance.next();
  assert.equal(instance.element('#storage-warning').hidden, true);
  const reopened = app(instance.data);
  assert.equal(reopened.read().session.index, 1);
  assert.equal(xp(reopened), 5);
  assert.equal(Object.values(reopened.read().progress.questions).reduce((sum, q) => sum + q.attempts, 0), 1);
});

test('actual later lessons ask for recall, retire recovered errors and stop appending them', () => {
  const q = curriculum.questions.find(q => q.id === 'concept-3');
  let progress = learning.recordAnswer({ questions: {}, sessions: [] }, q.id, false, 1000, 'choice', { lessonId: 'origin' });
  progress = learning.recordAnswer(progress, q.id, true, 1001, 'choice', { lessonId: 'origin', retry: true });
  progress = learning.recordAnswer(progress, q.id, true, 1002, 'choice', { lessonId: 'later' });
  let instance = app({ [learning.PROGRESS_KEY]: JSON.stringify(progress), [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: ['basis:0'] }) });
  for (const stage of [1, 2]) {
    instance.startLesson('basis', 'basis:' + stage);
    assert.equal(instance.read().session.initialCount, 8);
    while (!instance.read().session.finished) {
      if (instance.read().session.ids[instance.read().session.index] === q.id) {
        assert.equal(instance.read().session.exerciseModes[instance.read().session.index], 'open');
        assert.match(instance.html(), /id="open-answer"/);
        assert.doesNotMatch(instance.html(), /data-answer=/);
      }
      instance.play(true); instance.next();
    }
    instance = app(instance.data);
  }
  assert.equal(learning.needsMistakeReview(instance.read().progress.questions[q.id]), false);
  assert.equal(instance.read().progress.questions[q.id].mistakeReview.successes, 3);
  assert.equal(instance.read().progress.questions[q.id].mistakeReview.recalled, true);
  instance.startLesson('basis', 'basis:3');
  assert.equal(instance.read().session.initialCount, 7);
  assert.ok(!instance.read().session.ids.includes(q.id));
});

test('update preparation preserves exact feedback, mistake memory, XP and unfinished drafts across reload', async () => {
  const instance = app(); instance.startLesson(); instance.play(false); instance.next(); instance.play(true);
  const before = JSON.parse(JSON.stringify(instance.read()));
  instance.go('#leren');
  assert.equal(await instance.prepareUpdate(), true);
  const stored = JSON.stringify(instance.data);
  const restored = app(instance.data); restored.go('#les/basis/0');
  assert.equal(JSON.stringify(restored.read().session), JSON.stringify(before.session));
  assert.equal(JSON.stringify(restored.read().game), JSON.stringify(before.game));
  assert.equal(JSON.stringify(restored.read().progress), JSON.stringify(before.progress));
  assert.equal(JSON.stringify(instance.data), stored);
});

test('update preparation waits behind queued answer rewards in the same Web Lock', async () => {
  const locks = controlledLocks(); const instance = app({}, locks); instance.startLesson();
  const answer = instance.play(); const update = instance.prepareUpdate();
  assert.equal(locks.pending, 2); assert.equal(xp(instance), 0);
  await locks.drain(); await answer; assert.equal(await update, true);
  const restored = app(instance.data);
  assert.equal(restored.read().session.answered, 1); assert.equal(xp(restored), 5);
});

test('update preparation rejects blocked storage and recovers all in-memory progress when storage returns', async () => {
  const options = { blocked: true }; const instance = app({}, undefined, options); instance.startLesson(); instance.play(true);
  assert.equal(await instance.prepareUpdate(), false);
  assert.equal(instance.read().session.answered, 1);
  options.blocked = false; assert.equal(await instance.prepareUpdate(), true);
  const restored = app(instance.data); assert.equal(restored.read().session.answered, 1); assert.equal(xp(restored), 5);
});

test('updating a stale tab cannot overwrite the latest saved lesson or duplicate rewards', async () => {
  const data = {}; const active = app(data); active.startLesson();
  const stale = app(data); stale.go('#les/basis/0');
  active.play(true); active.next(); const stored = JSON.stringify(data);
  assert.equal(await stale.prepareUpdate(), false);
  assert.equal(JSON.stringify(data), stored); assert.equal(stale.reloads(), 1);
});

test('update preparation at the result preserves completion and never grants rewards twice', async () => {
  const instance = app(); instance.startLesson();
  for (let i = 0; i < 20 && !instance.read().session.finished; i++) { instance.play(true); instance.next(); }
  const before = JSON.stringify(instance.data);
  assert.equal(await instance.prepareUpdate(), true); assert.equal(JSON.stringify(instance.data), before);
  const restored = app(instance.data); restored.go('#les/basis/0'); restored.finish();
  assert.equal(JSON.stringify(instance.data), before);
});

for (const mode of ['choice', 'binary']) {
  test('3D knowledge ' + mode + ' gates loading, grades facts and restores precise fiber selection', () => {
    const q = curriculum.questions.find(q => q.id === 'model-fact-extra-muscles-incline-db-profile');
    const session = { ids: [q.id], index: 0, correct: 0, answered: 0, retryIds: [], region: 'verdieping', options: learning.optionsFor(q), response: null, exerciseModes: [mode], finished: false, prepared: true, pairingDone: true };
    const instance = app({[learning.SESSION_KEY]: JSON.stringify(session)}, undefined, {modelUnavailable: true});
    instance.go('#les/verdieping');
    assert.match(instance.html(), /3D-model laden/);
    instance.answer(session.options.indexOf(q.answer));
    assert.equal(instance.read().session.answered, 0);
    instance.viewerReady(); instance.renderLesson();
    assert.equal(instance.pickingEnabled(), false);
    const call = instance.viewerCalls().at(-1);
    assert.deepEqual(Array.from(call[1]), q.muscleIds);
    assert.equal(JSON.stringify(call[5]), JSON.stringify(q.highlightPatterns));
    assert.ok(instance.html().includes(q.prompt));
    instance.chooseAnswer(session.options.indexOf(q.answer));
    assert.equal(instance.read().session.correct, 1);
    assert.equal(xp(instance), 5);
    const restored = app(instance.data); restored.go('#les/verdieping');
    assert.equal(restored.read().session.response, q.answer);
    assert.equal(restored.read().session.exerciseModes[0], mode);
    assert.equal(JSON.stringify(restored.viewerCalls().at(-1)[5]), JSON.stringify(q.highlightPatterns));
    assert.equal(xp(restored), 5);
  });
}

test('single muscle exercise feedback names only the marked fiber subset', () => {
  const q = curriculum.questions.find(q => q.id === 'combination-sidekick');
  const session = { ids: [q.id], index: 0, correct: 0, answered: 0, retryIds: [], region: 'combinaties', options: learning.optionsFor(q), response: null, exerciseModes: ['recognition'], finished: false, prepared: true };
  const instance = app({[learning.SESSION_KEY]: JSON.stringify(session)});
  instance.go('#les/combinaties'); instance.play();
  assert.match(instance.html(), /Gemarkeerde spieren:<\/strong> Gluteus medius<\/p>/);
  assert.ok(!instance.html().includes('Gluteus medius &amp; minimus'));
});

test('four highlighted candidates map anonymous buttons to muscles and preserve camera and order on feedback/reload', () => {
  const q = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'biceps');
  const options = learning.optionsFor(q, Math.random, 'model-choice');
  const ids = learning.modelChoiceCards(options).map(card => card.id);
  const session = { ids: [q.id], exerciseModes: ['model-choice'], index: 0, initialCount: 1,
    correct: 0, answered: 0, retryIds: [], region: 'daily', options,
    response: null, finished: false, prepared: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
  instance.go('#les/daily');
  assert.ok(instance.html().includes('Welke gemarkeerde spier is ' + q.answer + '?'));
  assert.equal(instance.element('#model-prompt').hidden, true);
  assert.equal(instance.element('#model-prompt').textContent, '');
  assert.equal(instance.element('#selection-card').innerHTML, '');
  assert.doesNotMatch(instance.html(), /answer-shortcut|om direct te antwoorden/);
  assert.equal((instance.html().match(/class="answer model-choice-answer/g) || []).length, 4);
  for (const name of options.filter(name => name !== q.answer)) assert.ok(!instance.html().includes(name));
  for (let index = 0; index < 4; index++) assert.ok(instance.html().includes('Spier ' + (index + 1) + ' · ' + choicePalette[index].name));
  assert.deepEqual(Array.from(instance.viewerCalls().at(-1)[1]), ids);
  assert.equal(instance.pickingEnabled(), false);
  assert.equal(instance.element('#isolate').disabled, false);
  instance.element('#orientation').textContent = 'ZIJAANZICHT';
  instance.chooseAnswer(options.indexOf(q.answer));
  assert.equal(instance.read().session.correct, 1);
  assert.equal(instance.viewerCalls().at(-1)[3], true);
  assert.equal(instance.element('#orientation').textContent, 'ZIJAANZICHT');
  assert.ok(instance.element('#selection-card').innerHTML.includes(q.answer));
  const restored = app(instance.data);
  restored.go('#les/daily');
  assert.deepEqual(Array.from(restored.read().session.options), options);
  assert.deepEqual(Array.from(restored.viewerCalls().at(-1)[1]), ids);
  assert.equal(restored.read().session.response, q.answer);
});

test('four-choice answers wait until every candidate is loaded, then incorrect choices retry with regular recognition', () => {
  const q = curriculum.questions.find(q => q.type === 'recognition');
  const options = learning.optionsFor(q, Math.random, 'model-choice');
  const ids = learning.modelChoiceCards(options).map(card => card.id);
  const session = { ids: [q.id], exerciseModes: ['model-choice'], index: 0, initialCount: 1,
    correct: 0, answered: 0, retryIds: [], region: 'daily', options,
    response: null, finished: false, prepared: true };
  const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) }, undefined, { modelUnavailable: true });
  instance.go('#les/daily');
  instance.chooseAnswer(options.indexOf(q.answer));
  assert.equal(instance.read().session.answered, 0);
  instance.viewerReady(ids.filter(id => id === q.muscleId)); instance.renderLesson();
  instance.chooseAnswer(options.indexOf(q.answer));
  assert.equal(instance.read().session.answered, 0);
  assert.match(instance.html(), /Niet alle spieren zijn beschikbaar/);
  instance.viewerReady(); instance.renderLesson();
  instance.chooseAnswer(options.findIndex(option => option !== q.answer));
  assert.equal(instance.read().session.correct, 0);
  instance.next();
  assert.equal(instance.read().session.exerciseModes[instance.read().session.index], 'recognition');
  assert.equal(instance.viewerCalls().at(-1)[0], 'select');
  assert.equal(instance.pickingEnabled(), true);
});

test('each early muscle chapter introduces its added recognition with four highlighted candidates', () => {
  const path = learning.levelPath({ completed: [] });
  for (const region of ['borst', 'rug', 'armen', 'core', 'heup', 'quads', 'hamstrings', 'kuiten']) {
    const index = path.findIndex(level => level.id === region + ':0');
    const instance = app({ [learning.GAME_KEY]: JSON.stringify({ days: {}, completed: path.slice(0, index).map(level => level.id) }) });
    instance.startLesson(region, region + ':0');
    const session = instance.read().session;
    const recognitionIndex = session.ids.findIndex(id => curriculum.questions.find(q => q.id === id).type === 'recognition');
    assert.ok(recognitionIndex >= 0, region);
    assert.equal(session.exerciseModes[recognitionIndex], 'model-choice', region);
    assert.equal(learning.modelChoiceCards(learning.optionsFor(curriculum.questions.find(q => q.id === session.ids[recognitionIndex]), Math.random, 'model-choice')).length, 4);
  }
});
