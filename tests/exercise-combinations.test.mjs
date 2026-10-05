import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { exerciseRows, exerciseVariants } from '../src/data/exercise-catalog.js';
import { levelPath } from '../src/learning.js';
import { exerciseCombinationQuestions } from '../src/data/exercise-combinations.js';
import { muscleForMesh } from '../src/data/muscles.js';
import { availableExercises, exerciseForProgress } from '../src/exercise-progression.js';
import { DAY, checkOpenAnswer, modelAvailable, lessonQueue, mistakeQuestions, masteryFor, levelQuestions, readSession, SESSION_KEY, optionsFor } from '../src/learning.js';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const combinations = curriculum.questions.filter(q => q.type === 'exercise-recognition');
const buffer = fs.readFileSync(new URL('../public/models/muscular.glb', import.meta.url));
const model = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
const available = new Set(model.nodes.map(node => muscleForMesh(node.extras?.za_name || node.name || '')?.id).filter(Boolean));

test('all exercise rows and named variants retain course evidence and every highlighted muscle exists in the real atlas', () => {
  assert.equal(exerciseRows.length, 64);
  assert.equal(exerciseVariants.length, 52);
  assert.equal(combinations.length, 118);
  for (const row of [...exerciseRows, ...exerciseVariants]) assert.ok(combinations.some(q => q.sourceQuestionId === row.sourceQuestionId && (row.variant ? q.id === 'combination-' + row.key : true)), row.key);
  assert.deepEqual(combinations, exerciseCombinationQuestions(curriculum.questions));
  for (const q of combinations) {
    assert.ok(q.hint.length > 20);
    assert.ok(q.muscleIds.length >= 1);
    assert.equal(new Set(q.muscleIds).size, q.muscleIds.length);
    assert.ok(q.muscleIds.every(id => available.has(id)), q.id);
    assert.ok(q.muscleIds.every(id => curriculum.cards.some(card => card.id === id)), q.id);
    const fact = curriculum.questions.find(fact => fact.id === q.sourceQuestionId);
    assert.deepEqual(q.source, fact.source);
    assert.equal(q.explanation, fact.answer);
    assert.ok(q.source.page >= 1 && q.source.page <= 28);
  }
  const reached = levelPath({ completed: [] }).filter(level => level.topic.id === 'combinaties').flatMap(level => levelQuestions(curriculum.questions, 'combinaties', level.stage));
  assert.deepEqual(new Set(reached.map(q => q.id)), new Set(combinations.map(q => q.id)));
  assert.deepEqual(levelQuestions(curriculum.questions, 'combinaties', 0).map(q => q.id), ['row', 'pallof', 'legpress', 'legextension', 'rdl', 'legcurl', 'calf'].map(id => 'combination-' + id));
});

test('combination recall grades exercise names and aliases without anatomy-name normalization or pointing', () => {
  for (const q of combinations) {
    assert.deepEqual(availableExercises(q), ['recognition', 'recognition-open']);
    assert.equal(exerciseForProgress(q, undefined), 'recognition');
    assert.equal(exerciseForProgress(q, { interval: 1, lastCorrect: true, due: DAY }, { now: DAY }), 'recognition-open');
    assert.equal(checkOpenAnswer(q, q.answer).correct, true);
    for (const alias of q.acceptedAnswers) assert.equal(checkOpenAnswer(q, alias).correct, true);
    for (const wrong of q.distractors) assert.equal(checkOpenAnswer(q, wrong).correct, false);
    assert.equal(checkOpenAnswer(q, 'musculus ' + q.answer).correct, false);
    assert.equal(masteryFor([q], { questions: { [q.id]: { interval: 4, lastCorrect: true, exerciseStats: { recognition: { spacedCorrect: 3 } } } } }), 0);
    assert.equal(masteryFor([q], { questions: { [q.id]: { interval: 4, lastCorrect: true, exerciseStats: { 'recognition-open': { spacedCorrect: 1 } } } } }), 100);
  }
});

test('mixed lessons and mistake reviews require the entire combination to be loaded', () => {
  const q = combinations[0];
  const partial = new Set(q.muscleIds.slice(1));
  const complete = new Set(q.muscleIds);
  const progress = { questions: { [q.id]: { attempts: 1, correct: 0, interval: 0, lastCorrect: false, due: 0 } }, sessions: [] };
  assert.equal(modelAvailable(q, partial), false);
  assert.equal(modelAvailable(q, complete), true);
  assert.deepEqual(lessonQueue([q], progress, { availableMuscles: partial }), []);
  assert.deepEqual(mistakeQuestions([q], progress, { availableMuscles: partial }), []);
  assert.deepEqual(lessonQueue([q], progress, { availableMuscles: complete }), [q]);
  assert.deepEqual(mistakeQuestions([q], progress, { availableMuscles: complete }), [q]);
});

test('saved combination recall survives reload and rejects incompatible pointing modes', () => {
  const q = combinations[0];
  const session = { ids: [q.id], index: 0, correct: 0, answered: 0, retryIds: [], region: 'combinaties', options: optionsFor(q), response: null, exerciseModes: ['recognition-open'], openDraft: q.answer, finished: false, prepared: true };
  const lookup = new Map(curriculum.questions.map(q => [q.id, q]));
  const read = value => readSession({ getItem: key => key === SESSION_KEY ? JSON.stringify(value) : null }, lookup);
  assert.equal(read(session).openDraft, q.answer);
  assert.equal(read({ ...session, exerciseModes: ['point'] }), null);
  assert.equal(read({ ...session, exerciseModes: ['binary'] }), null);
});
