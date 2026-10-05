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
