import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const curriculum = JSON.parse(fs.readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const source = fs.readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
// Exercise the actual formatter with course data, without browser or grading mocks.
const context = vm.createContext({ curriculum });
vm.runInContext(source.slice(source.indexOf('function highlightedMuscleNames('), source.indexOf('function feedbackMarkup(')) + '\nglobalThis.format = compactMuscleFeedback; globalThis.labels = highlightedMuscleNames;', context);
const format = id => {
  const question = curriculum.questions.find(q => q.id === id);
  assert.ok(question, id);
  return context.format(question, context.labels(question));
};

test('feedback removes repeated muscle names for single muscles, fiber names and groups', () => {
  for (const [id, name, movement] of [
    ['combination-seated-fly', 'Pectoralis major', 'horizontale schouderadductie met licht gebogen elleboog'],
    ['combination-incline-db', 'Pectoralis major · bovenste vezels', 'schouderanteflexie en horizontale adductie, elleboogextensie'],
    ['combination-legpress', 'Rectus femoris', 'heupextensie, knie-extensie en enkelplantairflexie (triple extensie)'],
    ['combination-sidekick', 'Gluteus medius', 'heupabductie']
  ]) {
    const result = format(id);
    assert.ok(result.modelMuscles.includes(name), id);
    assert.equal(result.explanation, movement, id);
    assert.equal([result.answer, result.modelMuscles, result.explanation].join(' ').split(name).length - 1, 1, id);
  }
});

test('feedback retains stabilizers, synergists and different actions within a group', () => {
  const bird = format('combination-birddog');
  assert.ok(bird.modelMuscles.includes('Erector spinae (stabilisator)'));
  assert.equal(bird.explanation, 'been naar achteren, knie gestrekt, arm naar voren en neutrale rug');
  const hold = format('combination-back-hold');
  for (const name of ['Gluteus maximus', 'Biceps femoris', 'Semimembranosus / semitendinosus']) assert.ok(hold.modelMuscles.includes(name + ' (synergist)'));
  assert.equal(hold.explanation, 'heupretroflexie tot neutraal, isometrisch vasthouden');
  const row = format('combination-row');
  assert.ok(row.modelMuscles.includes('Trapezius · midden (retractie)'));
  assert.ok(row.modelMuscles.includes('Rhomboideus (retractie)'));
  assert.ok(row.modelMuscles.includes('Deltoideus · achterste kop (horizontale abductie)'));
  assert.equal(row.explanation, null);
});

test('model facts retain answer meaning without repeating their muscle prefix', () => {
  const result = format('model-fact-extra-muscles-flat-db-profile');
  assert.equal(result.answer, 'horizontale schouderadductie en elleboogextensie');
  assert.equal(result.modelMuscles, 'Pectoralis major');
});

test('formatter keeps meaningful non-muscle headings and original grading facts', () => {
  for (const id of ['combination-pushup', 'combination-front-zombie']) {
    const question = curriculum.questions.find(q => q.id === id);
    const before = JSON.stringify(question);
    assert.equal(format(id).explanation, question.explanation);
    assert.equal(JSON.stringify(question), before);
  }
  const question = { answer: 'Pectoralis major', explanation: 'Controle: houd de romp stabiel', muscleIds: ['pectoralis'] };
  const result = context.format(question, 'Pectoralis major');
  assert.equal(result.modelMuscles, null);
  assert.equal(result.answer, 'Pectoralis major');
  assert.equal(result.explanation, question.explanation);
});
