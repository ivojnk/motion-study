import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { availableExercises, exerciseForProgress } from '../src/exercise-progression.js';
import { DAY, recordAnswer } from '../src/learning.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const muscle = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
const fact = { id: 'fact', type: 'choice', prompt: 'Wat betekent anterieur?', answer: 'Aan de voorkant', distractors: ['Achter', 'Onder', 'Boven'] };
const empty = () => ({ questions: {}, sessions: [] });

test('every question has assisted and recall forms; deep muscles are never pointing exercises', () => {
  for (const q of curriculum.questions) {
    const modes = availableExercises(q);
    assert.ok(modes.length >= 2, q.id);
    assert.ok(modes.some(mode => ['open', 'open-self', 'recognition-open'].includes(mode)), q.id);
    assert.equal(new Set(modes).size, modes.length, q.id);
    if (['recognition', 'exercise-recognition'].includes(q.type)) assert.equal(modes[0], 'recognition', q.id);
    else assert.deepEqual(modes.slice(0, 2), ['choice', 'binary'], q.id);
  }
  assert.deepEqual(availableExercises(muscle), ['recognition', 'model-choice', 'point', 'recognition-open']);
  assert.deepEqual(availableExercises({ type: 'recognition', muscleId: 'pec-minor' }), ['recognition', 'model-choice', 'recognition-open']);
});

test('fresh and failed facts use assistance independent of lesson position', () => {
  assert.equal(exerciseForProgress(fact, undefined), 'choice');
  assert.equal(exerciseForProgress(fact, undefined, { index: 1 }), 'binary');
  assert.equal(exerciseForProgress(muscle, undefined, { index: 0 }), 'model-choice');
  assert.equal(exerciseForProgress(fact, { interval: 8, lastCorrect: false, due: 0 }), 'choice');
});

test('spaced anatomy practice progresses from recognition to pointing to open recall', () => {
  let progress = recordAnswer(empty(), muscle.id, true, 1000, 'recognition');
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 1001 }), 'model-choice');
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 1000 + DAY }), 'point');
  progress = recordAnswer(progress, muscle.id, true, 1000 + DAY, 'point');
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 1000 + DAY + 1 }), 'point');
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 1000 + 3 * DAY }), 'recognition-open');
  progress = recordAnswer(progress, muscle.id, true, 1000 + 3 * DAY, 'recognition-open');
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 1000 + 3 * DAY + 1 }), 'recognition-open');
  const modes = [0, 1, 2, 3].map(index => exerciseForProgress(muscle, progress.questions[muscle.id], { index, now: 1000 + 7 * DAY }));
  assert.deepEqual(modes, ['recognition-open', 'point', 'recognition-open', 'model-choice']);
});

test('early replay cannot unlock harder forms or manufacture modality mastery', () => {
  let progress = recordAnswer(empty(), muscle.id, true, 1000, 'recognition');
  for (let index = 0; index < 20; index++) progress = recordAnswer(progress, muscle.id, true, 1001 + index, 'recognition');
  assert.equal(progress.questions[muscle.id].interval, 1);
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 5000 }), 'model-choice');
  assert.equal(exerciseForProgress(muscle, progress.questions[muscle.id], { now: 1000 + DAY }), 'point');
  const assistedOnly = { interval: 8, due: 0, lastCorrect: true, exerciseStats: { recognition: { spacedCorrect: 4 } } };
  assert.equal(exerciseForProgress(muscle, assistedOnly, { now: 5000 }), 'point');
});

test('an incorrect hard answer returns to assistance and rebuilds spaced recall', () => {
  let progress = recordAnswer(empty(), fact.id, true, 1000, 'choice');
  const openMode = availableExercises(fact)[2];
  assert.equal(exerciseForProgress(fact, progress.questions[fact.id], { now: 1000 + DAY }), openMode);
  progress = recordAnswer(progress, fact.id, false, 1000 + DAY, openMode);
  assert.equal(exerciseForProgress(fact, progress.questions[fact.id], { now: 1000 + DAY + 600000 }), 'choice');
  progress = recordAnswer(progress, fact.id, true, 1000 + DAY + 600000, 'choice');
  assert.equal(exerciseForProgress(fact, progress.questions[fact.id], { now: 1000 + 2 * DAY + 600000 }), openMode);
});

test('legacy spaced progress still unlocks recall and selections stay in available modes', () => {
  for (const q of curriculum.questions) {
    for (const interval of [0, 1, 2, 4, 8, 16, 30]) {
      for (const index of [0, 1, 2, 3, 4]) {
        assert.ok(availableExercises(q).includes(exerciseForProgress(q, { interval, due: 0, lastCorrect: true }, { index, now: DAY })), q.id);
      }
    }
  }
  assert.equal(exerciseForProgress(muscle, { interval: 2, due: 0, lastCorrect: true }, { now: DAY }), 'recognition-open');
});
