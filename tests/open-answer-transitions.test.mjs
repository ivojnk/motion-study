import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import * as learning from '../src/learning.js';
import * as progression from '../src/exercise-progression.js';
import * as motivation from '../src/lesson-motivation.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const main = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const source = main.split("document.addEventListener('click'")[0].replace(/^import .*;\n/gm, '').replaceAll('import.meta.env.BASE_URL', "'/'") + `
 globalThis.api = { navigate, renderLesson, next, updateOpenDraft, submitOpenAnswer, selfAssessOpenAnswer, showMuscle,
 read: () => ({ session, game, progress }), viewerReady: () => { viewer = { available: new Set(curriculum.cards.map(c => c.id)), select(...args) { globalThis.selected = args; }, highlight() {}, setIsolated() {} }; }, selected: () => globalThis.selected };`;
function app(data) {
 const nodes = new Map(); const listeners = new Map();
 const node = selector => { if (!nodes.has(selector)) nodes.set(selector, { innerHTML: '', focus() {}, setAttribute() {}, scrollIntoView() {} }); return nodes.get(selector); };
 const fixed = new Set(['#learning', '#intro', '#model-prompt', '#muscle-select', '#isolate', '#orientation', '#selection-card', '.atlas-panel', '#credits']);
 const querySelector = selector => fixed.has(selector) || selector.startsWith('#') && node('#learning').innerHTML.includes(`id="${selector.slice(1)}"`) ? node(selector) : null;
 const storage = { getItem: key => data[key] || null, setItem: (key, value) => { data[key] = value; } };
 const context = { ...learning, ...progression, ...motivation, curriculum, Map, Set, Date, Math, Number, String, JSON, Error, Boolean,
 location: { hash: '' }, navigator: {}, document: { querySelector, querySelectorAll: () => [], addEventListener(type, listener) { listeners.set(type, listener); } },
 window: { localStorage: storage, scrollTo() {}, matchMedia: () => ({ matches: false }) } };
 vm.createContext(context); vm.runInContext(source, context);
 vm.runInContext(main.slice(main.indexOf("document.addEventListener('submit'"), main.indexOf("$('#muscle-select').addEventListener")), context);
 return { ...context.api, data, node, html: () => node('#learning').innerHTML, fire: (type, event) => listeners.get(type)(event), go(hash) { context.location.hash = hash; context.api.navigate(); } };
}
function lesson(q, mode, extra = {}) {
 const session = { ids: [q.id], exerciseModes: [mode], index: 0, initialCount: 1, correct: 0, answered: 0, retryIds: [], region: q.region, options: learning.optionsFor(q), response: null, finished: false, prepared: true, pairingDone: true, ...extra };
 const instance = app({ [learning.SESSION_KEY]: JSON.stringify(session) });
 instance.viewerReady(); instance.go('#les/' + q.region); return instance;
}
const xp = instance => learning.gameStats(learning.readGame({ getItem: key => instance.data[key] || null })).xp;
const short = curriculum.questions.find(q => q.type !== 'recognition' && learning.supportsOpenAnswer(q));
const long = curriculum.questions.find(q => q.type !== 'recognition' && !learning.supportsOpenAnswer(q));
const recognition = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');

test('typing persists draft across reload without grading and leaves numeric shortcuts alone', () => {
 let instance = lesson(short, 'open');
 assert.match(instance.html(), /for="open-answer"/); assert.match(instance.html(), /aria-describedby="open-answer-help"/);
 assert.match(instance.html(), /id="check-open-answer"[^>]*disabled/); assert.doesNotMatch(instance.html(), /data-answer=/);
 instance.fire('input', { target: { id: 'open-answer', value: '1 2 3 mijn antwoord' } });
 let prevented = false; instance.fire('keydown', { target: { tagName: 'INPUT' }, key: '1', preventDefault() { prevented = true; } });
 assert.equal(prevented, false); assert.equal(instance.read().session.response, null); assert.equal(xp(instance), 0);
 instance = app(instance.data); instance.viewerReady(); instance.go('#les/' + short.region);
 assert.equal(instance.read().session.openDraft, '1 2 3 mijn antwoord'); assert.match(instance.html(), /value="1 2 3 mijn antwoord"/);
 instance.next(true); assert.equal(instance.read().session.openDraft, '1 2 3 mijn antwoord'); assert.equal(instance.read().session.index, 0);
});

test('open submission grades normalized answer once and restores feedback correctly', () => {
 let instance = lesson(short, 'open');
 instance.updateOpenDraft('  ' + short.answer.toUpperCase() + '  ');
 let prevented = false; instance.fire('submit', { target: { id: 'open-answer-form' }, preventDefault() { prevented = true; } });
 instance.submitOpenAnswer(); assert.equal(prevented, true); assert.equal(instance.read().session.correct, 1); assert.equal(instance.read().session.answered, 1);
 assert.equal(instance.read().session.firstCorrect, 1); assert.equal(xp(instance), 5); assert.match(instance.html(), /feedback success/);
 instance = app(instance.data); instance.viewerReady(); instance.go('#les/' + short.region); assert.match(instance.html(), /feedback success/); assert.equal(xp(instance), 5);
});

test('wrong open answer adds one assisted retry and never awards first-attempt credit', () => {
 const instance = lesson(short, 'open'); instance.updateOpenDraft('dit is verkeerd'); instance.submitOpenAnswer(); instance.submitOpenAnswer();
 assert.equal(instance.read().session.correct, 0); assert.equal(instance.read().session.firstCorrect, 0); assert.equal(xp(instance), 0);
 assert.equal(instance.read().session.retryIds.length, 1); assert.equal(instance.read().session.ids.length, 2); assert.equal(instance.read().session.exerciseModes[1], 'choice');
 assert.match(instance.html(), /Het juiste antwoord:/); instance.next(); assert.equal(instance.read().session.openDraft, ''); assert.equal(instance.read().session.response, null);
});

test('highlighted-muscle recall exposes no choice/name and suppresses model name taps', () => {
 const instance = lesson(recognition, 'recognition-open');
 assert.doesNotMatch(instance.html(), /data-answer=/); assert.doesNotMatch(instance.html(), new RegExp(recognition.answer));
 assert.doesNotMatch(instance.node('#selection-card').innerHTML, new RegExp(recognition.answer));
 assert.equal(instance.node('#muscle-select').disabled, true); assert.equal(instance.selected()[2], true); assert.equal(instance.selected()[3], true);
 instance.showMuscle(recognition.muscleId, recognition.answer); assert.doesNotMatch(instance.node('#selection-card').innerHTML, new RegExp(recognition.answer));
 instance.updateOpenDraft(recognition.answer); instance.submitOpenAnswer(); assert.equal(instance.read().session.correct, 1); assert.equal(xp(instance), 5);
});

test('long answers reveal model answer before explicit assessment and restore both stages', () => {
 let instance = lesson(long, 'open-self'); assert.match(instance.html(), /<textarea[^>]*maxlength="2000"/);
 const draft = 'Mijn eigen uitleg. '.repeat(30); instance.updateOpenDraft(draft); assert.equal(instance.read().session.openDraft, draft);
 instance.submitOpenAnswer(); assert.equal(instance.read().session.openRevealed, true); assert.equal(instance.read().session.response, null); assert.equal(xp(instance), 0);
 assert.match(instance.html(), /Voorbeeldantwoord/); assert.match(instance.html(), /id="self-assess-correct"/);
 instance = app(instance.data); instance.viewerReady(); instance.go('#les/' + long.region); assert.equal(instance.read().session.openRevealed, true); assert.equal(instance.read().session.openDraft, draft);
 instance.selfAssessOpenAnswer(true); instance.selfAssessOpenAnswer(true); assert.equal(instance.read().session.selfAssessmentCorrect, true); assert.equal(instance.read().session.response, draft.trim()); assert.equal(instance.read().session.correct, 1); assert.equal(xp(instance), 5);
 instance = app(instance.data); instance.viewerReady(); instance.go('#les/' + long.region); assert.match(instance.html(), /feedback success/); assert.equal(xp(instance), 5);
});

test('negative self-assessment stays wrong even when draft matches model answer', () => {
 const instance = lesson(long, 'open-self'); instance.updateOpenDraft(long.answer); instance.submitOpenAnswer(); instance.selfAssessOpenAnswer(false);
 assert.equal(instance.read().session.correct, 0); assert.equal(instance.read().session.selfAssessmentCorrect, false); assert.equal(xp(instance), 0); assert.match(instance.html(), /feedback retry/);
});

test('point keyboard alternatives preview anonymous candidates and do not focus the target', () => {
 const instance = lesson(recognition, 'point'); assert.match(instance.html(), /Bekijk spier 1/);
 assert.equal(instance.selected()[2], false); assert.equal(instance.selected()[3], false);
 const buttonLabels = [...instance.html().matchAll(/<button[^>]*data-answer[^>]*>(.*?)<\/button>/g)].map(match => match[1]);
 assert.equal(buttonLabels.length, 4); assert.ok(buttonLabels.every(label => !label.includes(recognition.answer)));
});

test('a minor spelling error earns XP with canonical spelling feedback that survives reload', () => {
 let instance = lesson(recognition, 'recognition-open');
 assert.match(instance.html(), /Kleine typefouten zijn oké/);
 instance.updateOpenDraft('Pectoraliss major'); instance.submitOpenAnswer();
 assert.equal(instance.read().session.correct, 1); assert.equal(instance.read().session.firstCorrect, 1); assert.equal(instance.read().session.retryIds.length, 0); assert.equal(xp(instance), 5);
 assert.match(instance.html(), /Goed! Kleine typefout\./); assert.match(instance.html(), /<p>Pectoralis major<\/p>/);
 instance = app(instance.data); instance.viewerReady(); instance.go('#les/' + recognition.region);
 assert.match(instance.html(), /Goed! Kleine typefout\./); assert.match(instance.html(), /feedback success/); assert.equal(xp(instance), 5);
 instance.submitOpenAnswer(); assert.equal(xp(instance), 5);
});

test('a different muscle stays wrong rather than receiving typo feedback', () => {
 const instance = lesson(recognition, 'recognition-open');
 instance.updateOpenDraft('Pectoralis minor'); instance.submitOpenAnswer();
 assert.equal(instance.read().session.correct, 0); assert.equal(instance.read().session.firstCorrect, 0); assert.equal(instance.read().session.retryIds.length, 1); assert.equal(xp(instance), 0);
 assert.match(instance.html(), /feedback retry/); assert.doesNotMatch(instance.html(), /Goed! Kleine typefout\./);
});

test('short text recall accepts a small spelling slip without adding a retry', () => {
 const q = curriculum.questions.find(q => q.id === 'pectoralis-aanhechting');
 const instance = lesson(q, 'open');
 instance.updateOpenDraft('Voorkant humeruss'); instance.submitOpenAnswer();
 assert.equal(instance.read().session.correct, 1); assert.equal(instance.read().session.retryIds.length, 0); assert.equal(xp(instance), 5);
 assert.match(instance.html(), /Goed! Kleine typefout\./); assert.match(instance.html(), /<p>Voorkant humerus<\/p>/);
});
