import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { courseDetailQuestions } from '../src/data/course-details.js';
import { levelPath, levelQuestions, readGame, isOpenAnswerCorrect } from '../src/learning.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const details = curriculum.questions.filter(q => q.source.kind === 'course-detail');
const earlier = curriculum.questions.filter(q => q.source.kind !== 'course-detail');
const question = suffix => details.find(q => q.id === 'course-detail-' + suffix);

test('audit additions survive import and recall accepts names without confusing anatomical parts', () => {
  assert.deepEqual(details, courseDetailQuestions);
  assert.equal(details.length, 19);
  assert.equal(isOpenAnswerCorrect(question('sternocostalis'), 'pars sternocostalis'), true);
  assert.equal(isOpenAnswerCorrect(question('sternocostalis'), 'pars clavicularis'), false);
  assert.equal(isOpenAnswerCorrect(question('trapezius-transversa'), 'trapezius pars transversa'), true);
  assert.equal(isOpenAnswerCorrect(question('trapezius-transversa'), 'ascendens'), false);
  assert.equal(isOpenAnswerCorrect(question('rhomboideus-members'), 'rhomboideus minor/major'), true);
  assert.equal(isOpenAnswerCorrect(question('rhomboideus-members'), 'rhomboideus minor'), false);
  assert.equal(isOpenAnswerCorrect(question('squat-hip-phase'), 'tijdens het zakken'), true);
  assert.equal(isOpenAnswerCorrect(question('squat-hip-phase'), 'concentrisch'), false);
  assert.equal(isOpenAnswerCorrect(question('role-serratus'), 'stabiliserende spier'), true);
  assert.equal(isOpenAnswerCorrect(question('role-serratus'), 'duwspier'), false);
});

test('new detail lessons preserve all existing lessons and require their own completion', () => {
  const oldPath = levelPath({ completed: [] }, earlier);
  const oldIds = new Set(oldPath.map(level => level.id));
  const newPath = levelPath({ completed: [...oldIds] });
  for (const level of oldPath) {
    assert.deepEqual(levelQuestions(curriculum.questions, level.topic.id, level.stage), levelQuestions(earlier, level.topic.id, level.stage), level.id);
    assert.equal(newPath.find(current => current.id === level.id).done, true);
  }
  const extra = newPath.filter(level => !oldIds.has(level.id));
  assert.equal(extra.length, 6);
  assert.ok(extra.every(level => !level.done));
  assert.equal(extra.filter(level => !level.locked).length, 1);
  const reached = new Set(extra.flatMap(level => {
    const queue = levelQuestions(curriculum.questions, level.topic.id, level.stage);
    assert.equal(queue.length, 7);
    assert.equal(new Set(queue.map(q => q.id)).size, 7);
    return queue.filter(q => q.source.kind === 'course-detail').map(q => q.id);
  }));
  assert.deepEqual(reached, new Set(details.map(q => q.id)));
});

test('legacy progress cannot treat newly added PDF details as learned', () => {
  const regions = [...new Set(earlier.filter(q => q.region !== 'combinaties').map(q => q.region))];
  const completed = regions.flatMap(region => [0, 1, 2].map(stage => region + ':' + stage));
  const progress = readGame({ getItem: key => key === 'motionstudy.game.v1' ? JSON.stringify({ completed, days: {} }) : null });
  for (const id of progress.completed) {
    const [region, stage] = id.split(':');
    assert.ok(levelQuestions(curriculum.questions, region, Number(stage)).every(q => !q.source.kind));
  }
});
