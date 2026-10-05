import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { muscleForMesh, extraMuscleGroups } from '../src/data/muscles.js';
import { exerciseRows } from '../src/data/exercise-catalog.js';
import { lengthProfiles } from '../src/data/length-profiles.js';
import { modelAvailable, supportsOpenAnswer, checkOpenAnswer, readSession, SESSION_KEY, optionsFor, levelPath, levelQuestions, DAY } from '../src/learning.js';
import { exerciseForProgress } from '../src/exercise-progression.js';
const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const lookup = new Map(curriculum.questions.map(q => [q.id, q]));
const questions = curriculum.questions.filter(q => q.type === 'model-fact');
const buffer = readFileSync(new URL('../public/models/muscular.glb', import.meta.url));
const model = JSON.parse(buffer.subarray(20, 20 + buffer.readUInt32LE(12)).toString());
const meshes = model.nodes.map(node => node.extras?.za_name || node.name || '');
const available = new Set(meshes.map(name => muscleForMesh(name)?.id).filter(Boolean));

test('all source card fields, 64 exercise rows and 57 graphic profiles have source-faithful 3D knowledge questions', () => {
  const covered = new Set(questions.map(q => q.sourceQuestionId));
  const originalFields = curriculum.cards.filter(card => card.region !== 'verdieping').flatMap(card => Object.keys(card.fields).map(field => card.id + '-' + field));
  assert.equal(originalFields.length, 100);
  for (const id of [...originalFields, ...exerciseRows.map(row => row.sourceQuestionId), ...lengthProfiles.map(profile => profile.id)]) assert.ok(covered.has(id), id);
  assert.equal(questions.length, 346);
  for (const question of questions) {
    const source = lookup.get(question.sourceQuestionId);
    const card = source.muscleId && curriculum.cards.find(card => card.id === source.muscleId);
    assert.equal(question.prompt, card ? source.prompt.replace(card.name, 'de gemarkeerde spier') : source.prompt, question.id);
    assert.equal(question.answer, source.answer, question.id);
    assert.deepEqual(question.distractors, source.distractors, question.id);
    assert.deepEqual(question.source, source.source, question.id);
    assert.equal(modelAvailable(question, available), true, question.id);
    assert.equal(modelAvailable(question, new Set(question.muscleIds.slice(1))), false, question.id);
  }
  assert.deepEqual(new Set(levelPath({completed: []}).filter(level => level.topic.id === 'verdieping').flatMap(level => levelQuestions(curriculum.questions, 'verdieping', level.stage)).map(q => q.id)), new Set(curriculum.questions.filter(q => q.region === 'verdieping').map(q => q.id)));
});

test('all eight added structures and each fiber emphasis match actual licensed atlas meshes', () => {
  assert.equal(curriculum.cards.length, 39);
  assert.equal(checkOpenAnswer(lookup.get('model-name-diaphragm'), 'middenrif').correct, true);
  assert.equal(checkOpenAnswer(lookup.get('model-name-diaphragm'), 'bekkenbodem').correct, false);
  for (const group of extraMuscleGroups) {
    assert.ok(available.has(group.id), group.id);
    const card = curriculum.cards.find(card => card.id === group.id);
    assert.deepEqual(card.source, lookup.get(group.sourceQuestionId).source, group.id);
    assert.ok(lookup.has('model-name-' + group.id), group.id);
  }
  for (const q of curriculum.questions.filter(q => q.highlightPatterns)) {
    for (const [id, parts] of Object.entries(q.highlightPatterns)) {
      assert.ok(q.muscleIds.includes(id), q.id);
      assert.ok(meshes.some(name => muscleForMesh(name)?.id === id && parts.some(part => name.includes(part))), q.id);
      assert.ok(meshes.some(name => muscleForMesh(name)?.id === id && !parts.some(part => name.includes(part))), q.id);
    }
  }
  const inner = lookup.get('model-fact-extra-muscles-inner-role');
  assert.deepEqual(inner.muscleIds, ['diaphragm', 'pelvic-floor', 'transversus', 'multifidus']);
  assert.match(curriculum.cards.find(card => card.id === 'multifidus').fields.functie, /Gezamenlijke taak/);
  assert.deepEqual(lookup.get('model-fact-extra-muscles-rotator-cuff-members').muscleIds, ['supraspinatus', 'infraspinatus', 'teres-minor', 'subscapularis']);
});

test('visual length-profile mapping stays aligned with the actual named source inventory', () => {
  const explicitKeys = ['flat-db','incline-db','decline-db','seated-fly','machine-press','shoulder-press','supported-raise','low-raise','hip-raise','rear-incline','rear-cable','lat-pulldown','cross-row','lat-prayer','kelso','45-shrug','supported-row','chinup-lower','bicep-curl','incline-curl','preacher','spider','tricep-ext','cross-ext','katana','skull','crunch','situp','hanging','sidebend','sidecrunch','45-back','reversehyper','jefferson','woodchop','landmine','russian','highlow','glute-rdl','hipthrust','hipback','kickback','bulgarian','sidekick','legpress','hack','belt','splitquad','leanleg','ham-rdl','ham-back','seatedcurl','lyingcurl','seatedcalf','standingcalf','donkey','hipcalf'];
  for (const [index, key] of explicitKeys.entries()) {
    const row = exerciseRows.find(row => row.key === key);
    const profile = lengthProfiles[index];
    const fact = lookup.get('model-fact-' + profile.id);
    assert.deepEqual(fact.muscleIds, row.muscleIds, profile.name);
    assert.equal(fact.source.page, lookup.get(row.sourceQuestionId).source.page, profile.name);
    assert.ok(fact.hint.includes(profile.name), profile.name);
  }
});

test('model facts retain factual grading, progress-based recall and reload without becoming exercise-name recall', () => {
  for (const question of questions) {
    const modes = ['choice', 'binary', supportsOpenAnswer(question) ? 'open' : 'open-self'];
    assert.equal(exerciseForProgress(question, undefined), 'choice', question.id);
    assert.equal(exerciseForProgress(question, {interval: 1, lastCorrect: true, due: DAY}, {now: DAY}), modes[2], question.id);
    if (supportsOpenAnswer(question)) assert.equal(checkOpenAnswer(question, question.answer).correct, true, question.id);
    const session = { ids: [question.id], index: 0, correct: 0, answered: 0, retryIds: [], region: 'verdieping', options: optionsFor(question), response: null, exerciseModes: [modes[2]], finished: false, prepared: true, openDraft: 'Mijn antwoord' };
    const read = value => readSession({getItem: key => key === SESSION_KEY ? JSON.stringify(value) : null}, lookup);
    assert.equal(read(session)?.openDraft, 'Mijn antwoord', question.id);
    assert.equal(read({...session, exerciseModes: ['recognition-open']}), null, question.id);
  }
});
