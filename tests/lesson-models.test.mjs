import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { levelQuestions, levelPath, readGame, GAME_KEY } from '../src/learning.js';
import { exerciseForProgress } from '../src/exercise-progression.js';
import { withLessonModels } from '../src/lesson-models.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const muscleChapters = ['borst', 'rug', 'armen', 'core', 'heup', 'quads', 'hamstrings', 'kuiten'];
const fact = (id, muscleId = null, region = 'borst') => ({ id, type: 'choice', region, ...(muscleId ? { muscleId } : {}) });
const recognition = (id, muscleId, region = 'borst') => ({ id, type: 'recognition', muscleId, region });

test('all eight first muscle lessons add one relevant recognition and retain every original question', () => {
  for (const region of muscleChapters) {
    const originals = Object.freeze(levelQuestions(curriculum.questions, region, 0));
    const ids = originals.map(question => question.id);
    const result = withLessonModels(originals, curriculum.questions);
    assert.equal(result.length, 8, region);
    assert.equal(result[0].type, 'recognition', region);
    assert.equal(result[0].region, region);
    assert.ok(originals.some(question => question.muscleId === result[0].muscleId), region);
    assert.equal(exerciseForProgress(result[0], undefined), 'model-choice', region);
    assert.deepEqual(result.slice(1), originals, region);
    assert.equal(new Set(result.map(question => question.id)).size, 8, region);
    assert.deepEqual(originals.map(question => question.id), ids, region);
  }
});

test('lesson partitions, lesson IDs and completed progress remain unchanged', () => {
  const completed = ['basis:0', 'borst:0', 'rug:0', 'core:0'];
  const game = { completed, days: { '2026-10-05': 55 } };
  const pathBefore = levelPath(game);
  const partitionsBefore = pathBefore.map(level =>
    levelQuestions(curriculum.questions, level.topic.id, level.stage).map(question => question.id));
  const curriculumBefore = JSON.stringify(curriculum);
  for (const level of pathBefore) {
    withLessonModels(levelQuestions(curriculum.questions, level.topic.id, level.stage), curriculum.questions);
  }
  assert.deepEqual(levelPath(game), pathBefore);
  assert.deepEqual(pathBefore.map(level =>
    levelQuestions(curriculum.questions, level.topic.id, level.stage).map(question => question.id)), partitionsBefore);
  assert.equal(JSON.stringify(curriculum), curriculumBefore);
  assert.deepEqual(readGame({ getItem: key => key === GAME_KEY ? JSON.stringify(game) : null }), game);
});

test('existing recognition or exercise combinations never gain an additional question', () => {
  for (const model of [recognition('visual', 'pectoralis'),
    { id: 'combination', type: 'exercise-recognition', region: 'borst', muscleIds: ['pectoralis'] }]) {
    const originals = Object.freeze([fact('fact', 'pectoralis'), model]);
    assert.equal(withLessonModels(originals, [recognition('other', 'pectoralis')]), originals);
  }
  const originals = levelQuestions(curriculum.questions, 'borst', 0);
  const enriched = withLessonModels(originals, curriculum.questions);
  assert.equal(withLessonModels(enriched, curriculum.questions), enriched);
});

test('the first available muscle match follows lesson order and stays within its chapter', () => {
  const originals = Object.freeze([fact('first', 'pectoralis'), fact('second', 'delt-front')]);
  const bank = [recognition('wrong-region', 'pectoralis', 'rug'),
    recognition('second-visual', 'delt-front'), recognition('first-visual', 'pectoralis')];
  assert.equal(withLessonModels(originals, bank)[0].id, 'first-visual');
  assert.equal(withLessonModels(originals, bank.slice(0, 2))[0].id, 'second-visual');
});

test('explicit muscle context can supply an existing recognition without replacing the fact', () => {
  const context = Object.freeze({ muscleIds: Object.freeze(['lats', 'biceps']) });
  const original = Object.freeze({ ...fact('row-fact', null, 'rug'), modelContext: context });
  const visual = recognition('lats-visual', 'lats', 'rug');
  const result = withLessonModels(Object.freeze([original]), Object.freeze([visual]));
  assert.deepEqual(result, [visual, original]);
  assert.equal(result[1], original);
});

test('abstract chapters, empty lessons and unavailable recognition retain their existing questions', () => {
  for (const region of ['basis', 'patronen', 'groei', 'combinaties']) {
    const originals = Object.freeze([{ ...fact('abstract', 'pectoralis', region),
      modelContext: { muscleIds: ['pectoralis'] } }]);
    assert.equal(withLessonModels(originals, [recognition('visual', 'pectoralis', region)]), originals);
  }
  const empty = Object.freeze([]);
  assert.equal(withLessonModels(empty, curriculum.questions), empty);
  const missing = Object.freeze([fact('missing', 'unavailable')]);
  assert.equal(withLessonModels(missing, curriculum.questions), missing);
  const abstract = Object.freeze([fact('abstract')]);
  assert.equal(withLessonModels(abstract, curriculum.questions), abstract);
});
