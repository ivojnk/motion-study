import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lessonMomentum, lessonInterlude } from '../src/lesson-motivation.js';

const attempt = (correct, options = {}) => ({ correct, skipped: false, retry: false, ...options });
const lesson = (options = {}) => ({
  index: 3, initialCount: 6, ids: ['a', 'b', 'c', 'd', 'e', 'f'],
  answerHistory: [attempt(true), attempt(true), attempt(true)],
  dismissedInterludes: [], finished: false, ...options
});

test('momentum describes the current run and longest run across original and retry attempts', () => {
  const answerHistory = [attempt(true), attempt(true), attempt(false), attempt(true), attempt(true), attempt(true, { retry: true }), attempt(false), attempt(true, { retry: true })];
  assert.deepEqual(lessonMomentum({ answerHistory }), { run: 1, bestRun: 3 });
  assert.deepEqual(lessonMomentum({ answerHistory: answerHistory.slice(0, 6) }), { run: 3, bestRun: 3 });
});

test('skipped and malformed attempts break a run even if marked correct', () => {
  assert.deepEqual(lessonMomentum({ answerHistory: [attempt(true), attempt(true, { skipped: true }), attempt(true)] }), { run: 1, bestRun: 1 });
  assert.deepEqual(lessonMomentum({ answerHistory: [attempt(true), null, { correct: 'true' }] }), { run: 0, bestRun: 1 });
  for (const session of [null, {}, { answerHistory: {} }]) assert.deepEqual(lessonMomentum(session), { run: 0, bestRun: 0 });
});

test('halfway appears only at its threshold in lessons of at least six questions', () => {
  assert.equal(lessonInterlude(lesson()).key, 'halfway');
  assert.equal(lessonInterlude(lesson()).title, 'Je hebt je ritme te pakken!');
  assert.equal(lessonInterlude(lesson({ answerHistory: [attempt(false)] })).title, 'Je bent halverwege!');
  assert.equal(lessonInterlude(lesson({ initialCount: 5, ids: ['a', 'b', 'c', 'd', 'e'], index: 2 })), null);
  assert.equal(lessonInterlude(lesson({ index: 2 })), null);
  assert.equal(lessonInterlude(lesson({ index: 4 })), null);
  const oddLesson = lesson({ initialCount: 7, ids: ['a', 'b', 'c', 'd', 'e', 'f', 'g'] });
  assert.equal(lessonInterlude(oddLesson).key, 'halfway');
  assert.match(lessonInterlude(oddLesson).description, /3 van de 7.*Nog 4/);
});

test('retry interlude occurs once before the appended review questions', () => {
  assert.equal(lessonInterlude(lesson({ index: 6 })), null);
  const singleRetry = lesson({ index: 6, ids: ['a', 'b', 'c', 'd', 'e', 'f', 'b'] });
  assert.deepEqual(lessonInterlude(singleRetry), {
    key: 'retry', kind: 'retry', title: 'Nog één oefenronde',
    description: 'Deze vraag krijgt nog één kans. Neem mee wat je net hebt geleerd.', icon: 'refresh'
  });
  const retries = lesson({ index: 6, ids: [...singleRetry.ids, 'c'] });
  assert.match(lessonInterlude(retries).description, /Deze 2 vragen/);
  assert.equal(lessonInterlude({ ...retries, index: 7 }), null);
  assert.equal(lessonInterlude(lesson({ index: 2, initialCount: 2, ids: ['a', 'b', 'a'] })).key, 'retry');
});

test('dismissed interludes survive reload and cannot replay', () => {
  const halfway = lesson({ dismissedInterludes: ['halfway', 'halfway'] });
  assert.equal(lessonInterlude(JSON.parse(JSON.stringify(halfway))), null);
  const retries = lesson({ index: 6, ids: ['a', 'b', 'c', 'd', 'e', 'f', 'a'], dismissedInterludes: ['halfway'] });
  assert.equal(lessonInterlude(retries).key, 'retry');
  assert.equal(lessonInterlude({ ...retries, dismissedInterludes: ['halfway', 'retry'] }), null);
});

test('invalid or complete sessions never show an interlude', () => {
  for (const session of [null, {}, lesson({ finished: true }), lesson({ index: 0 }),
    lesson({ index: -1 }), lesson({ index: 9 }), lesson({ index: 2.5 }),
    lesson({ initialCount: 7 }), lesson({ initialCount: 0 }), lesson({ initialCount: 6.5 })]) {
    assert.equal(lessonInterlude(session), null);
  }
});

test('helpers do not mutate the session or award XP', () => {
  const session = lesson({ xp: 15 });
  const snapshot = JSON.stringify(session);
  assert.deepEqual(Object.keys(lessonMomentum(session)).sort(), ['bestRun', 'run']);
  assert.deepEqual(Object.keys(lessonInterlude(session)).sort(), ['description', 'icon', 'key', 'kind', 'title']);
  assert.equal(JSON.stringify(session), snapshot);
});
