import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { DAY, optionsFor, readProgress, readSession, recordAnswer, lessonQueue, masteryFor, topics } from '../src/learning.js';
import { muscles, muscleForMesh } from '../src/data/muscles.js';
const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const provenance = JSON.parse(readFileSync(new URL('../public/models/provenance.json', import.meta.url)));
const serialized = JSON.stringify(curriculum);
test('every question has a unique id, four distinct options and a course reference', () => {
  assert.equal(new Set(curriculum.questions.map(q => q.id)).size, curriculum.questions.length);
  for (const q of curriculum.questions) {
    assert.ok(q.source.title.includes('Milo module 6.6'), q.id);
    assert.ok(q.source.section, q.id);
    const options = optionsFor(q);
    assert.equal(options.length, 4, q.id);
    assert.equal(new Set(options).size, 4, q.id);
    assert.ok(options.includes(q.answer), q.id);
    assert.ok(topics.some(t => t.id === q.region));
  }
});
test('public question bank covers every chapter and includes no private source excerpts', () => {
  for (const topic of topics) assert.ok(curriculum.questions.some(q => q.region === topic.id), topic.id);
  assert.ok(!/"(?:excerpt|anchor|start|end)":/.test(serialized));
  for (const card of curriculum.cards) {
    assert.ok(card.fields.functie, card.id);
    assert.ok(!Object.values(card.fields).some(v => /OEFENING|DUWSPIER|TREKSPIER|STABILISATOR/.test(v)), card.id);
  }
});
test('all muscle recognition groups match real exported meshes, excluding fascia and tendons', () => {
  const buffer = readFileSync(new URL('../public/models/muscular.glb', import.meta.url));
  const json = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
  const names = json.nodes.map(n => n.extras?.za_name).filter(Boolean);
  for (const m of muscles) assert.ok(names.some(name => muscleForMesh(name)?.id === m.id), m.id);
  assert.equal(muscleForMesh('Deltoid fascia.l'), null);
  assert.equal(muscleForMesh('Sciatic bursa of gluteus maximus muscle.r'), null);
  assert.equal(json.skins?.length || 0, 0);
});
test('wrong answers are due after ten minutes, right answers expand intervals and mastery requires repetition', () => {
  const empty = { questions: {}, sessions: [] };
  const first = recordAnswer(empty, 'a', true, 1000);
  assert.deepEqual(empty.questions, {});
  assert.equal(first.questions.a.due, 1000 + DAY);
  const early = recordAnswer(first, 'a', true, 2000);
  assert.equal(early.questions.a.interval, 1);
  assert.equal(early.questions.a.due, first.questions.a.due);
  assert.equal(masteryFor([{id:'a'}], early), 0);
  const second = recordAnswer(first, 'a', true, 1000 + DAY);
  const third = recordAnswer(second, 'a', true, 1000 + 3 * DAY);
  assert.equal(third.questions.a.interval, 4);
  assert.equal(masteryFor([{id:'a'}], third), 100);
  const wrong = recordAnswer(third, 'a', false, 1000 + 7 * DAY);
  assert.equal(wrong.questions.a.interval, 0);
  assert.equal(wrong.questions.a.due, 1000 + 7 * DAY + 600000);
  assert.equal(masteryFor([{id:'a'}], wrong), 0);
});
test('review only uses due questions and recognition requires a loaded muscle group', () => {
  const qs = [{id:'a', region:'rug',type:'choice'}, {id:'b',region:'rug',type:'recognition',muscleId:'lats'}, {id:'c',region:'rug',type:'choice'}];
  const progress = {questions:{a:{due:10}, c:{due:2000}}, sessions:[]};
  assert.deepEqual(lessonQueue(qs, progress, {region:'review',now:100}).map(q=>q.id), ['a']);
  assert.equal(lessonQueue(qs,progress,{region:'rug',now:100}).length,2);
  assert.equal(lessonQueue(qs,progress,{region:'rug',now:100,availableMuscles:new Set(['lats'])}).length,3);
});
test('corrupt storage fails safely and malformed entries do not count as progress', () => {
  assert.deepEqual(readProgress({getItem(){throw Error('blocked')}}), {questions:{},sessions:[]});
  assert.deepEqual(readProgress({getItem(){return 'not JSON'}}), {questions:{},sessions:[]});
  assert.deepEqual(readProgress({getItem(){return '{"questions":{"bad":{"correct":-1,"due":1}}}'}}), {questions:{},sessions:[]});
});

test('redistributed models match immutable upstream provenance hashes', async () => {
  const { createHash } = await import('node:crypto');
  for (const asset of provenance.assets) {
    const data = readFileSync(new URL('../public/models/' + asset.file, import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex'), asset.sha256);
    assert.equal(data.length, asset.bytes);
    assert.ok(asset.source.includes(provenance.upstreamCommit));
  }
});
test('saved lessons restore only valid question options, counters and references', () => {
  const question = curriculum.questions[0];
  const lookup = new Map([[question.id, question]]);
  const session = { ids: [question.id], index: 0, correct: 0, answered: 0, retryIds: [], region: question.region,
    options: optionsFor(question), response: null, finished: false };
  const storage = value => ({ getItem() { return JSON.stringify(value); } });
  assert.deepEqual(readSession(storage(session), lookup), session);
  assert.equal(readSession(storage({ ...session, ids: ['unknown'] }), lookup), null);
  assert.equal(readSession(storage({ ...session, correct: 5 }), lookup), null);
  assert.equal(readSession(storage({ ...session, options: ['bad'] }), lookup), null);
  assert.equal(readSession(storage({ ...session, response: 'not an option' }), lookup), null);
  assert.equal(readSession({ getItem() { throw Error('blocked'); } }, lookup), null);
});

import { readGame, awardXP, gameStats, dayKey, DAILY_GOAL, levelPath, levelQuestions, completeLevel, exerciseFor, matchingPairs, binaryResponses, LESSON_SIZE, fillLesson } from '../src/learning.js';
test('XP calendar streak survives reload, crosses month boundary and expires after missed goal', () => {
  const time = new Date(2026, 9, 1, 12).getTime();
  const empty = { days: {}, completed: [] };
  const game = awardXP(awardXP(empty, DAILY_GOAL, new Date(2026, 8, 30, 12).getTime()), DAILY_GOAL, time);
  assert.deepEqual(empty.days, {});
  assert.equal(gameStats(game, time).streak, 2);
  assert.equal(gameStats(game, new Date(2026, 9, 2, 12).getTime()).streak, 2);
  assert.equal(gameStats(game, new Date(2026, 9, 3, 12).getTime()).streak, 0);
  assert.equal(gameStats(game, time).xp, 60);
  assert.deepEqual(readGame({getItem: () => JSON.stringify(game)}), game);
  assert.equal(dayKey(time), '2026-10-01');
  assert.deepEqual(readGame({getItem: () => '{"days":{"bad":100,"2026-10-01":-2},"completed":["fake"]}'}), empty);
});
test('short lessons cover the whole course and unlock only after every question is corrected', () => {
  const empty = { days: {}, completed: [] };
  assert.equal(levelPath(empty).length, 94);
  assert.equal(levelPath(empty).filter(level => !level.locked).length, 1);
  assert.deepEqual(completeLevel(empty, 'basis:0', 0, 0), empty);
  assert.deepEqual(completeLevel(empty, 'basis:0', NaN, 7), empty);
  assert.deepEqual(completeLevel(empty, 'basis:0', 7, Infinity), empty);
  assert.deepEqual(completeLevel(empty, 'basis:0', 3, 5), empty);
  assert.deepEqual(completeLevel(empty, 'basis:1', 5, 5), empty);
  assert.deepEqual(completeLevel(empty, 'basis:0', 4, 5), empty);
  const first = completeLevel(empty, 'basis:0', 7, 7);
  assert.equal(levelPath(first).find(level => level.id === 'basis:1').locked, false);
  assert.equal(levelPath(first).find(level => level.id === 'basis:2').locked, true);
  assert.equal(completeLevel(first, 'basis:0', 5, 5).completed.length, 1);
  for (const topic of topics) {
    const lessons = levelPath(empty).filter(level => level.topic.id === topic.id);
    const chapter = curriculum.questions.filter(q => q.region === topic.id);
    assert.equal(lessons.length, [undefined, 'course-detail'].reduce((count, kind) => count + Math.ceil(chapter.filter(q => q.source.kind === kind).length / LESSON_SIZE), 0));
    assert.ok(lessons.length > 3);
    const partitions = lessons.flatMap(level => {
      const questions = levelQuestions(curriculum.questions, topic.id, level.stage);
      assert.equal(questions.length, 7);
      assert.equal(new Set(questions.map(q => q.id)).size, 7);
      assert.ok(questions.every(q => q.region === topic.id));
      return questions;
    });
    assert.equal(new Set(partitions.map(q => q.id)).size, curriculum.questions.filter(q => q.region === topic.id).length);
    assert.deepEqual(levelQuestions(curriculum.questions, topic.id, lessons.length), []);
    assert.deepEqual(levelQuestions(curriculum.questions, topic.id, -1), []);
  }
});
test('varied exercise modes and matching functions preserve course-grounded answers', () => {
  assert.equal(exerciseFor({type:'recognition'}, 0), 'recognition');
  assert.equal(exerciseFor({type:'recognition',muscleId:'pectoralis'}, 1), 'point');
  assert.equal(exerciseFor({type:'choice'}, 1), 'binary');
  for (const topic of topics) {
    const pairs = matchingPairs(curriculum.cards, topic.id);
    assert.equal(new Set(pairs.map(pair => pair.function)).size, pairs.length);
    for (const pair of pairs) assert.equal(pair.function, curriculum.cards.find(card => card.id === pair.id).fields.functie);
  }
});

test('true/false grades both possible claims and deep muscles retain visible highlighting', () => {
  const q = { answer: 'Correct', type: 'recognition', muscleId: 'pec-minor' };
  assert.deepEqual(binaryResponses(q, ['Wrong', 'Correct', 'Other', 'Last']), ['Wrong', 'Correct']);
  assert.deepEqual(binaryResponses(q, ['Correct', 'Wrong', 'Other', 'Last']), ['Correct', 'Wrong']);
  assert.equal(exerciseFor(q, 1), 'recognition');
});

test('pointing responses survive storage even when the clicked muscle is not a suggested option', () => {
  const q = curriculum.questions.find(q => q.muscleId === 'pectoralis' && q.type === 'recognition');
  const lookup = new Map([[q.id, q]]);
  const lesson = { ids: [q.id,q.id], index: 1, correct: 0, answered: 1, retryIds: [], region: q.region,
    options: optionsFor(q), response: 'Clicked different muscle', finished: false };
  assert.deepEqual(readSession({getItem: () => JSON.stringify(lesson)}, lookup), lesson);
  assert.equal(readSession({getItem: () => JSON.stringify({...lesson,index:0})}, lookup), null);
});

test('source coverage maps every question and every PDF page without dangling references', () => {
  const ids = new Set(curriculum.questions.map(q => q.id));
  assert.equal(new Set(curriculum.coverage.map(unit => unit.id)).size, curriculum.coverage.length);
  const covered = new Set();
  for (const unit of curriculum.coverage) {
    assert.ok(unit.questionIds.length, unit.id);
    for (const id of unit.questionIds) { assert.ok(ids.has(id), unit.id + ': ' + id); covered.add(id); }
  }
  assert.deepEqual(covered, ids);
  const pages = new Set();
  for (const q of curriculum.questions) {
    assert.ok(Number.isInteger(q.source.page) && q.source.page >= 1 && q.source.page <= 28, q.id);
    pages.add(q.source.page);
  }
  assert.equal(pages.size, 28);
});

test('all 64 exercise rows and 57 visual length profiles are tested explicitly', () => {
  assert.equal(curriculum.coverage.filter(unit => unit.id.endsWith('-target-movement')).length, 64);
  assert.equal(curriculum.questions.filter(q => /^profile-\d+$/.test(q.id)).length, 57);
  const answer = id => curriculum.questions.find(q => q.id === id)?.answer;
  assert.equal(answer('profile-21'), 'Verlengde tot middenpositie');
  assert.equal(answer('profile-27'), 'Middenpositie tot verkorte positie');
  assert.equal(answer('profile-29'), 'Verlengde tot middenpositie');
  assert.equal(answer('ql-maximale rek'), 'Lateroflexie andere zijde');
});


test('old completed thirds migrate only fully covered short lessons and preserve XP', () => {
  const completed = ['basis:0'];
  const days = { '2026-10-05': 55 };
  const stored = { 'motionstudy.game.v1': JSON.stringify({ days, completed }) };
  const storage = { getItem: key => stored[key] || null };
  const migrated = readGame(storage);
  assert.deepEqual(migrated.days, days);
  assert.deepEqual(migrated.completed, ['basis:0', 'basis:1', 'basis:2', 'basis:3']);
  assert.equal(levelPath(migrated).find(level => !level.done).id, 'basis:4');
  stored['motionstudy.game.v1'] = JSON.stringify({ days, completed: topics.flatMap(t => [0, 1, 2].map(stage => t.id + ':' + stage)) });
  assert.equal(readGame(storage).completed.length, 88);
  stored['motionstudy.game.v2'] = JSON.stringify({ days, completed: ['basis:0', 'basis:10', 'fake', 'basis:99'] });
  assert.deepEqual(readGame(storage).completed, ['basis:0', 'basis:10']);
});

test('seven-question review fills only from the due pool and empty review stays empty', () => {
  const pool = curriculum.questions.slice(0, 3);
  const filled = fillLesson(pool);
  assert.equal(filled.length, 7);
  assert.ok(filled.every(q => pool.includes(q)));
  assert.deepEqual(fillLesson([]), []);
});

test('answer streak counters and later lesson stages validate on reload', () => {
  const questions = levelQuestions(curriculum.questions, 'core', 14);
  const question = questions[0];
  const lookup = new Map(questions.map(q => [q.id, q]));
  const session = { ids: questions.map(q => q.id), index: 3, correct: 3, answered: 3, retryIds: [], region: 'core',
    levelId: 'core:14', stage: 14, initialCount: 7, firstCorrect: 3, answerStreak: 3, bestAnswerStreak: 3,
    options: optionsFor(questions[3]), response: null, finished: false };
  const storage = value => ({ getItem: () => JSON.stringify(value) });
  assert.deepEqual(readSession(storage(session), lookup), session);
  for (const counters of [{ answerStreak: -1 }, { answerStreak: 4 }, { bestAnswerStreak: 2 }, { bestAnswerStreak: 3.5 }]) {
    assert.equal(readSession(storage({ ...session, ...counters }), lookup), null);
  }
  const invalidStage = levelPath({ completed: [] }).filter(level => level.topic.id === 'core').length;
  assert.equal(readSession(storage({ ...session, levelId: 'core:' + invalidStage, stage: invalidStage }), lookup), null);
});
