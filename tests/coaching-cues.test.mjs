import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { coachingQuestions } from '../src/data/coaching-cues.js';
import { levelPath, levelQuestions, readGame, optionsFor } from '../src/learning.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const original = curriculum.questions.filter(q => !q.source.kind);
const additions = curriculum.questions.filter(q => q.source.kind === 'supplement');

test('public coaching questions match the import source and distinguish course facts from applications', () => {
  assert.deepEqual(additions, coachingQuestions(original));
  assert.equal(additions.length, 41);
  const lookup = new Map(original.map(q => [q.id, q]));
  for (const question of additions) {
    assert.equal(question.source.page, undefined, question.id);
    assert.ok(question.explanation.length > 40, question.id);
    assert.equal(optionsFor(question).length, 4, question.id);
    assert.equal(new Set([question.answer, ...question.distractors]).size, 4, question.id);
    for (const reference of question.source.references) assert.ok(reference.url.startsWith('https://'));
    for (const reference of question.source.courseReferences || []) {
      assert.equal(reference.page, lookup.get(reference.questionId).source.page, question.id);
      assert.equal(lookup.get(reference.questionId).region, question.region, question.id);
      assert.match(question.explanation, /^Controle: /, question.id);
    }
  }
  assert.equal(additions.filter(q => q.source.courseReferences).length, 35);
  assert.equal(additions.filter(q => q.region === 'core').length, 8);
  assert.equal(additions.find(q => q.id === 'coaching-squat-valgus').source.courseReferences[0].questionId, 'concept-47');
});

test('added lessons preserve every original lesson including its review fillers', () => {
  const coachingCurriculum = [...original, ...additions];
  const oldPath = levelPath({ completed: [] }, original);
  const newPath = levelPath({ completed: oldPath.map(level => level.id) }, coachingCurriculum);
  for (const level of oldPath) {
    assert.deepEqual(levelQuestions(coachingCurriculum, level.topic.id, level.stage), levelQuestions(original, level.topic.id, level.stage), level.id);
    assert.equal(newPath.find(current => current.id === level.id).done, true);
  }
  const extra = newPath.filter(level => !oldPath.some(old => old.id === level.id));
  assert.equal(extra.length, 7);
  assert.equal(extra.filter(level => !level.locked).length, new Set(extra.map(level => level.topic.id)).size);
  assert.ok(extra.every(level => !level.done));
  assert.deepEqual(new Set(extra.flatMap(level => levelQuestions(coachingCurriculum, level.topic.id, level.stage).map(q => q.id))), new Set(additions.map(q => q.id)));
});

test('legacy completed chapters preserve XP and never mark new coaching material complete', () => {
  const completed = [...new Set(original.filter(q => q.region !== 'combinaties').map(q => q.region))].flatMap(region => [0, 1, 2].map(stage => region + ':' + stage));
  const progress = readGame({ getItem: key => key === 'motionstudy.game.v1' ? JSON.stringify({ completed, days: { '2026-10-05': 55 } }) : null });
  assert.deepEqual(progress.days, { '2026-10-05': 55 });
  assert.equal(progress.completed.length, 88);
  assert.ok(progress.completed.every(id => {
    const [region, stage] = id.split(':');
    return levelQuestions(curriculum.questions, region, Number(stage)).every(q => q.source.kind !== 'supplement');
  }));
});
