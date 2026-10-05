import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { withModelContexts } from '../src/data/model-contexts.js';
import { muscleForMesh } from '../src/data/muscles.js';
import {
  DAY, SESSION_KEY, checkOpenAnswer, exerciseFor, isModelQuestion, lessonQueue,
  levelQuestions, masteryFor, mistakeQuestions, modelAvailable, modelMuscleIds,
  optionsFor, readSession, supportsOpenAnswer, usesModel, varyLesson
} from '../src/learning.js';
import { availableExercises, exerciseForProgress } from '../src/exercise-progression.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const contexts = curriculum.questions.filter(question => question.modelContext);
const withoutContext = ({ modelContext, ...question }) => question;
const buffer = readFileSync(new URL('../public/models/muscular.glb', import.meta.url));
const model = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
const available = new Set(model.nodes.map(node => muscleForMesh(node.extras?.za_name || node.name || '')?.id).filter(Boolean));

test('atlas metadata regenerates exactly without changing facts, source references or question order', () => {
  const originals = curriculum.questions.map(withoutContext);
  const serialized = JSON.stringify(originals);
  const result = withModelContexts(originals);
  assert.deepEqual(result, curriculum.questions);
  assert.deepEqual(result.map(withoutContext), originals);
  assert.equal(JSON.stringify(originals), serialized);
  assert.deepEqual(withModelContexts(result), result);
  assert.ok(contexts.length > 0);
  for (const question of contexts) {
    assert.equal(question.type, 'choice');
    assert.equal(isModelQuestion(question), false);
    assert.equal(usesModel(question), true);
    assert.ok(['front', 'back', 'side'].includes(question.modelContext.view));
    assert.ok(question.modelContext.hint.trim().length > 20);
    assert.equal(new Set(question.modelContext.muscleIds).size, question.modelContext.muscleIds.length);
    assert.deepEqual(modelMuscleIds(question), question.modelContext.muscleIds);
    for (const id of question.modelContext.muscleIds) {
      assert.ok(available.has(id), question.id + ': missing atlas muscle ' + id);
      assert.ok(curriculum.cards.some(card => card.id === id), question.id + ': missing muscle card ' + id);
    }
  }
});

test('context preserves adaptive exercise modes, answer grading and factual recall mastery', () => {
  for (const question of contexts) {
    const original = withoutContext(question);
    assert.equal(supportsOpenAnswer(question), supportsOpenAnswer(original), question.id);
    assert.deepEqual(availableExercises(question), availableExercises(original), question.id);
    for (const index of [0, 1, 2, 3]) {
      assert.equal(exerciseFor(question, index), exerciseFor(original, index), question.id);
      for (const progress of [undefined, { lastCorrect: true, interval: 1, due: DAY },
        { lastCorrect: true, interval: 4, due: DAY, attempts: 4, correct: 4 }]) {
        assert.equal(exerciseForProgress(question, progress, { index, now: DAY }),
          exerciseForProgress(original, progress, { index, now: DAY }), question.id);
      }
    }
    assert.deepEqual(checkOpenAnswer(question, question.answer), checkOpenAnswer(original, original.answer));
    for (const mode of ['choice', 'open', 'open-self', 'recognition-open']) {
      const progress = { questions: { [question.id]: { lastCorrect: true, interval: 4,
        exerciseStats: { [mode]: { spacedCorrect: 1 } } } } };
      assert.equal(masteryFor([question], progress), masteryFor([original], progress), question.id + ': ' + mode);
    }
  }
});

test('saved choice, binary, short open and self-assessed context answers retain their modes on reload', () => {
  for (const mode of ['choice', 'binary', 'open', 'open-self']) {
    const question = contexts.find(question => mode === 'open' ? supportsOpenAnswer(question) : !supportsOpenAnswer(question));
    assert.ok(question);
    const lookup = new Map([[question.id, question]]);
    const read = session => readSession({ getItem: key => key === SESSION_KEY ? JSON.stringify(session) : null }, lookup);
    const session = { ids: [question.id], exerciseModes: [mode], region: question.region,
      index: 0, answered: 0, correct: 0, retryIds: [], finished: false,
      response: null, options: optionsFor(question),
      openDraft: ['open', 'open-self'].includes(mode) ? 'Een bewaard antwoord' : '' };
    assert.deepEqual(read(session), session, mode);
    const answered = { ...session, response: question.answer,
      ...(mode === 'open-self' ? { openRevealed: true, selfAssessmentCorrect: true } : {}) };
    assert.deepEqual(read(answered), answered, mode);
    assert.equal(read({ ...session, exerciseModes: ['recognition-open'] }), null, mode);
    assert.equal(read({ ...session, exerciseModes: ['point'] }), null, mode);
  }
});

test('context questions require every referenced muscle in lesson and mistake pools', () => {
  const question = contexts.find(question => question.modelContext.muscleIds.length > 1);
  assert.ok(question);
  const complete = new Set(question.modelContext.muscleIds);
  const partial = new Set(question.modelContext.muscleIds.slice(1));
  const progress = { questions: { [question.id]: { attempts: 1, correct: 0, lastCorrect: false, interval: 0, due: 0 } } };
  assert.equal(modelAvailable(question, null), false);
  assert.equal(modelAvailable(question, partial), false);
  assert.equal(modelAvailable(question, complete), true);
  assert.equal(modelAvailable(withoutContext(question), null), true);
  assert.deepEqual(lessonQueue([question], progress, { availableMuscles: partial }), []);
  assert.deepEqual(mistakeQuestions([question], progress, { availableMuscles: partial }), []);
  assert.deepEqual(lessonQueue([question], progress, { availableMuscles: complete }), [question]);
  assert.deepEqual(mistakeQuestions([question], progress, { availableMuscles: complete }), [question]);
});

test('body-direction and sidedness definitions have no model hints, including after re-enrichment', () => {
  const ids = ['concept-0', 'concept-1', 'concept-2', 'concept-3',
    ...['posterieur', 'superieur', 'inferieur', 'distaal', 'lateraal', 'craniaal', 'caudaal', 'unilateraal']
      .map(term => 'extra-basis-' + term)];
  for (const id of ids) {
    const question = curriculum.questions.find(question => question.id === id);
    assert.ok(question, id);
    assert.equal(question.modelContext, undefined, id);
    assert.equal(usesModel(question), false, id);
    assert.equal(modelAvailable(question, null), true, id);
    const stale = { ...question, modelContext: { muscleIds: ['pectoralis'], view: 'front', hint: 'Old hint' } };
    assert.deepEqual(withModelContexts([stale]), [question], id);
  }
});

test('the first basis lesson tests recall without atlas context while preserving every original fact', () => {
  const originals = levelQuestions(curriculum.questions, 'basis', 0);
  const reordered = varyLesson([...originals].reverse());
  assert.ok(reordered.every(question => !usesModel(question)));
  assert.deepEqual(new Set(reordered.map(question => question.id)), new Set(originals.map(question => question.id)));
});
