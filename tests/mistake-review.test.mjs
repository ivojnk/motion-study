import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { PROGRESS_KEY, DAY, recordAnswer, readProgress, needsMistakeReview, mistakeQuestions, interleaveMistakes, levelQuestions, lessonQueue, masteryFor } from '../src/learning.js';
import { exerciseForProgress } from '../src/exercise-progression.js';
import { accountStorage } from '../src/account-storage.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const empty = () => ({ questions: {}, sessions: [] });
const answer = (progress, correct, lessonId, exercise = 'choice', retry = false, now = 1000) =>
  recordAnswer(progress, 'fact', correct, now, exercise, { lessonId, retry });
const fact = { id: 'fact', type: 'choice', answer: 'Abductie', region: 'basis' };

test('immediate corrections and repeated answers in the originating lesson retain the mistake', () => {
  const failed = answer(empty(), false, 'first');
  let progress = answer(failed, true, 'first', 'choice', true);
  for (let i = 0; i < 7; i++) progress = answer(progress, true, 'first', 'open');
  assert.equal(progress.questions.fact.mistakeReview.successes, 0);
  assert.equal(progress.questions.fact.mistakeReview.recalled, false);
  assert.equal(needsMistakeReview(progress.questions.fact), true);
  assert.equal(failed.questions.fact.correct, 0);
});

test('three later lessons with recall retire a mistake; retries and duplicates count once', () => {
  let progress = answer(answer(empty(), false, 'first'), true, 'first', 'choice', true);
  progress = answer(progress, true, 'second');
  progress = answer(progress, true, 'second', 'open');
  assert.equal(progress.questions.fact.mistakeReview.successes, 1);
  assert.equal(progress.questions.fact.mistakeReview.recalled, false);
  progress = answer(progress, true, 'third', 'open', true);
  assert.equal(progress.questions.fact.mistakeReview.successes, 1);
  progress = answer(progress, true, 'third', 'open');
  assert.equal(needsMistakeReview(progress.questions.fact), true);
  progress = answer(progress, true, 'fourth');
  assert.equal(needsMistakeReview(progress.questions.fact), false);
  assert.equal(progress.questions.fact.interval, 1, 'early practice does not create spaced mastery');
  assert.equal(masteryFor([fact], progress), 0);
  progress = answer(progress, false, 'fifth');
  assert.equal(progress.questions.fact.mistakeReview.successes, 0);
  assert.equal(progress.questions.fact.mistakeReview.recalled, false);
  assert.equal(needsMistakeReview(progress.questions.fact), true);
});

test('assisted success alone never retires mistakes and a new error resets recovery', () => {
  let progress = answer(empty(), false, 'first');
  for (const lesson of ['second', 'third', 'fourth', 'fifth']) progress = answer(progress, true, lesson);
  assert.equal(progress.questions.fact.mistakeReview.successes, 3);
  assert.equal(needsMistakeReview(progress.questions.fact), true);
  progress = answer(progress, false, 'sixth');
  progress = answer(progress, true, 'sixth', 'open', true);
  assert.equal(progress.questions.fact.mistakeReview.successes, 0);
  assert.equal(progress.questions.fact.mistakeReview.recalled, false);
});

test('interleaving adds at most two errors across chapters and preserves every original question', () => {
  const originals = levelQuestions(curriculum.questions, 'rug', 0);
  const mistakes = curriculum.questions.filter(q => !originals.includes(q)).slice(0, 4);
  const progress = mistakes.reduce((result, q, i) => recordAnswer(result, q.id, false, 1000 + i, 'choice', { lessonId: 'old' }), empty());
  const queue = interleaveMistakes(originals, curriculum.questions, progress);
  assert.equal(queue.length, originals.length + 2);
  assert.deepEqual(queue.filter(q => originals.includes(q)), originals);
  assert.deepEqual(queue.filter(q => !originals.includes(q)), mistakes.slice(0, 2));
  assert.ok(queue.indexOf(mistakes[0]) > 0);
  assert.ok(queue.indexOf(mistakes[1]) < queue.length - 1);
  assert.deepEqual(interleaveMistakes([], curriculum.questions, progress), []);
  const includesMistake = [mistakes[0], ...originals];
  const combined = interleaveMistakes(includesMistake, curriculum.questions, progress);
  assert.equal(combined.filter(q => q.id === mistakes[0].id).length, 1);
});

test('the least recently practised mistakes rotate and unavailable model questions are excluded', () => {
  const qs = [{ ...fact, id: 'a' }, { ...fact, id: 'b' }, { id: 'c', type: 'recognition', muscleId: 'lats' }];
  let progress = qs.reduce((result, q, i) => recordAnswer(result, q.id, false, 1000 + i), empty());
  assert.deepEqual(mistakeQuestions(qs, progress).map(q => q.id), ['a', 'b']);
  progress = recordAnswer(progress, 'a', true, 5000, 'choice', { lessonId: 'later' });
  assert.deepEqual(mistakeQuestions(qs, progress).map(q => q.id), ['b', 'c']);
  assert.deepEqual(mistakeQuestions(qs, progress, { availableMuscles: new Set() }).map(q => q.id), ['b', 'a']);
});

test('mistakes corrected today remain available in explicit review without adding unseen facts', () => {
  const qs = [fact, { ...fact, id: 'unseen' }];
  const progress = answer(answer(empty(), false, 'first'), true, 'first', 'choice', true);
  assert.ok(progress.questions.fact.due > 1001);
  assert.deepEqual(lessonQueue(qs, progress, { region: 'review', now: 1001 }), [fact]);
});

test('legacy errors migrate without losing counters, while prior mastered errors remain mastered', () => {
  const legacy = { correct: 2, attempts: 3, interval: 1, due: DAY, lastCorrect: true };
  const mastered = { ...legacy, interval: 4 };
  const progress = readProgress({ getItem: () => JSON.stringify({ questions: { legacy, mastered }, sessions: [] }) });
  assert.equal(progress.questions.legacy.correct, 2);
  assert.equal(needsMistakeReview(progress.questions.legacy), true);
  assert.equal(needsMistakeReview(progress.questions.mastered), false);
  assert.equal(masteryFor([{ id: 'mastered' }], progress), 100);
  for (const review of [{ successes: -1 }, { successes: 100, recalled: true, lastLesson: null, lastPracticedAt: 0 },
    { successes: 3, recalled: true, lastLesson: null, lastPracticedAt: '0' }]) {
    const restored = readProgress({ getItem: () => JSON.stringify({ questions: { fact: { ...legacy, mistakeReview: review } } }) });
    assert.equal(restored.questions.fact.attempts, 3);
    assert.equal(needsMistakeReview(restored.questions.fact), true);
  }
});

test('recovery and lesson identity survive reload and stay isolated per account', () => {
  const data = new Map();
  const storage = { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value) };
  const one = accountStorage(storage, 'one');
  const two = accountStorage(storage, 'two');
  const progress = answer(answer(empty(), false, 'first'), true, 'second', 'open');
  one.setItem(PROGRESS_KEY, JSON.stringify(progress));
  const restored = readProgress(one);
  assert.deepEqual(restored, progress);
  assert.deepEqual(readProgress(two), empty());
  assert.equal(answer(restored, true, 'second').questions.fact.mistakeReview.successes, 1);
});

test('later mistake practice asks for recall and returns to assistance after an error', () => {
  let progress = answer(answer(empty(), false, 'first'), true, 'first', 'choice', true);
  assert.equal(exerciseForProgress(fact, progress.questions.fact, { now: 1001 }), 'choice');
  progress = answer(progress, true, 'second');
  assert.equal(exerciseForProgress(fact, progress.questions.fact, { now: 1001 }), 'open');
  const muscle = { id: 'fact', type: 'recognition', muscleId: 'pectoralis' };
  assert.equal(exerciseForProgress(muscle, progress.questions.fact), 'point');
  progress = answer(progress, true, 'third', 'point');
  assert.equal(exerciseForProgress(muscle, progress.questions.fact), 'recognition-open');
  progress = answer(progress, false, 'fourth', 'open');
  assert.equal(exerciseForProgress(fact, progress.questions.fact), 'choice');
});
