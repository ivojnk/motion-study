import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DAY, SESSION_KEY, optionsFor, modelChoiceCards, modelAvailable, readSession, recordAnswer, masteryFor } from '../src/learning.js';
import { exerciseForProgress, availableExercises } from '../src/exercise-progression.js';
import { muscleForMesh } from '../src/data/muscles.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const questions = curriculum.questions.filter(q => q.type === 'recognition');
const lookup = new Map(curriculum.questions.map(q => [q.id, q]));
const buffer = readFileSync(new URL('../public/models/muscular.glb', import.meta.url));
const model = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
const available = new Set(model.nodes.map(node => muscleForMesh(node.extras?.za_name || node.name || '')?.id).filter(Boolean));
const read = session => readSession({ getItem: key => key === SESSION_KEY ? JSON.stringify(session) : null }, lookup);

function draft(q, options = optionsFor(q, Math.random, 'model-choice')) {
  return { ids: [q.id], exerciseModes: ['model-choice'], index: 0, correct: 0, answered: 0,
    retryIds: [], region: q.region, options, response: null, finished: false, prepared: true };
}

test('every muscle can show four real distinct candidates including the target with random target position', () => {
  for (const q of questions) {
    const targetPositions = new Set();
    for (let seed = 1; seed <= 12; seed++) {
      let value = seed;
      const random = () => ((value = (value * 16807) % 2147483647) - 1) / 2147483646;
      const options = optionsFor(q, random, 'model-choice');
      const cards = modelChoiceCards(options);
      assert.equal(cards.length, 4, q.id);
      assert.equal(new Set(cards.map(card => card.id)).size, 4);
      assert.ok(cards.some(card => card.id === q.muscleId), q.id);
      assert.ok(cards.every(card => available.has(card.id)), q.id);
      assert.ok(options.every(option => option === q.answer || q.distractors.includes(option)));
      targetPositions.add(options.indexOf(q.answer));
    }
    assert.ok(targetPositions.size > 1, q.id);
    assert.ok(availableExercises(q).includes('model-choice'));
    assert.equal(exerciseForProgress(q, undefined, { index: 0 }), 'model-choice');
  }
});

test('saved candidate order, answer mapping and exercise mode survive draft and feedback reload', () => {
  for (const q of questions) {
    const session = draft(q);
    assert.deepEqual(read(session), session, q.id);
    const answered = { ...session, response: q.answer };
    assert.deepEqual(read(answered), answered, q.id);
    const wrong = { ...session, response: session.options.find(option => option !== q.answer) };
    assert.deepEqual(read(wrong), wrong, q.id);
    // Existing recognition sessions keep their original form and options.
    const legacy = { ...session, exerciseModes: ['recognition'] };
    assert.deepEqual(read(legacy), legacy, q.id);
  }
});

test('answering requires all four candidate muscles rather than only the target', () => {
  const q = questions[0];
  const session = draft(q);
  const cards = modelChoiceCards(session.options);
  const missing = cards.find(card => card.id !== q.muscleId);
  const partial = new Set(cards.filter(card => card.id !== missing.id).map(card => card.id));
  assert.equal(modelAvailable(q, partial), true);
  assert.equal(modelAvailable(q, partial, session.options, 'model-choice'), false);
  assert.equal(modelAvailable(q, available, session.options, 'model-choice'), true);
  assert.equal(modelAvailable(q, null, session.options, 'model-choice'), false);
  assert.equal(modelChoiceCards([q.answer, q.answer, q.answer, q.answer]), null);
  assert.equal(modelChoiceCards(['Unknown', ...session.options.slice(1)]), null);
  assert.equal(modelAvailable({ type: 'choice', answer: q.answer }, available, session.options, 'model-choice'), false);
  const fact = curriculum.questions.find(q => q.type === 'choice');
  assert.equal(read(draft(fact)), null);
});

test('four-choice successes preserve the existing spaced path and cannot substitute for open recall', () => {
  const q = questions.find(q => q.muscleId === 'pectoralis');
  const first = recordAnswer({ questions: {}, sessions: [] }, q.id, true, 1000, 'model-choice');
  assert.equal(first.questions[q.id].exerciseStats['model-choice'].correct, 1);
  assert.equal(exerciseForProgress(q, first.questions[q.id], { now: 1001, index: 0 }), 'model-choice');
  assert.equal(exerciseForProgress(q, first.questions[q.id], { now: 1000 + DAY, index: 1 }), 'point');
  const assisted = { questions: { [q.id]: { ...first.questions[q.id], interval: 4 } } };
  assert.equal(masteryFor([q], assisted), 0);
});
