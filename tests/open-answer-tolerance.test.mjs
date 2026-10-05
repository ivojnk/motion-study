import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { supportsOpenAnswer, isOpenAnswerCorrect, checkOpenAnswer } from '../src/learning.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const concept = (answer, distractors = [], acceptedAnswers = [answer]) => ({ type: 'choice', answer, distractors, acceptedAnswers });
const muscle = (answer, distractors = []) => ({ type: 'recognition', answer, distractors });

test('small missing letters and neighbouring swaps are accepted in concepts and anatomy names', () => {
  const examples = [
    [concept('Acromion'), 'acromon'],
    [concept('Acromion'), 'acormion'],
    [concept('Sleutelbeen'), 'sleutebleen'],
    [concept('Radius'), 'rdius'],
    [concept('Voorkant humerus'), 'voorkant humeruz'],
    [muscle('Pectoralis major', ['Pectoralis minor']), 'pectorails major'],
    [muscle('Biceps brachii', ['Triceps brachii']), 'bcieps'],
    [muscle('Latissimus dorsi'), 'latissimus doris'],
    [muscle('Latissimus dorsi'), 'latissmus doris']
  ];
  for (const [q, response] of examples) assert.ok(isOpenAnswerCorrect(q, response), q.answer + ': ' + response);
});

test('the actual curriculum distractors never become correct through tolerance', () => {
  for (const q of curriculum.questions.filter(supportsOpenAnswer)) {
    assert.ok(isOpenAnswerCorrect(q, q.answer), q.id + ': canonical answer');
    for (const response of q.distractors) assert.equal(isOpenAnswerCorrect(q, response), false, q.id + ': ' + response);
  }
});

test('similar opposites, wrong subtypes and ambiguous missing letters are not accepted', () => {
  const examples = [
    [concept('Adductie', ['Abductie']), 'abductie'],
    [concept('Adductie', ['Abductie']), 'aductie'],
    [concept('Abductie', ['Adductie']), 'aductie'],
    [concept('Concentrisch', ['Excentrisch', 'Isometrisch']), 'excentrisch'],
    [concept('Flexie knie', ['Extensie knie']), 'extensie knie'],
    [concept('Voorkant humerus', ['Buitenkant humerus']), 'achterkant humerus'],
    [muscle('Pectoralis major', ['Pectoralis minor']), 'pectoralis minor'],
    [muscle('Pectoralis major', ['Pectoralis minor']), 'pectoralis minr'],
    [muscle('Pectoralis major', ['Pectoralis minor']), 'pectoralis'],
    [muscle('Deltoideus · voorste kop', ['Deltoideus · achterste kop']), 'achterste deltoideus'],
    [muscle('Deltoideus · voorste kop'), 'deltoideus'],
    [muscle('Gluteus medius & minimus'), 'gluteus medius'],
    [muscle('Gluteus medius', ['Gluteus minimus']), 'gluteus minimis']
  ];
  for (const [q, response] of examples) assert.equal(isOpenAnswerCorrect(q, response), false, q.answer + ': ' + response);
});

test('numerical values, signs, negation and very short answers remain exact', () => {
  const examples = [
    [concept('90 graden'), '80 graden'],
    [concept('-90 graden'), '90 graden'],
    [concept('−90 graden'), '+90 graden'],
    [concept('Niet actief'), 'actief'],
    [concept('Niet actief'), 'wel actief'],
    [concept('Actief'), 'niet actief'],
    [concept('Nee'), 'ne'],
    [concept('A'), 'b']
  ];
  for (const [q, response] of examples) assert.equal(isOpenAnswerCorrect(q, response), false, q.answer + ': ' + response);
  assert.ok(isOpenAnswerCorrect(concept('-90 graden'), '-90 graden'));
});

test('canonical names and vetted aliases retain presentation normalization', () => {
  assert.ok(isOpenAnswerCorrect(muscle('Pectoralis major'), '  M. PECTÓRALIS MAJOR.  '));
  assert.ok(isOpenAnswerCorrect(muscle('Biceps brachii'), 'BICEPS'));
  assert.ok(isOpenAnswerCorrect(muscle('Deltoideus · voorste kop'), 'deltoideus pars clavicularis'));
  assert.equal(isOpenAnswerCorrect(concept('Acromion'), 'acromion of sleutelbeen'), false);
  assert.equal(isOpenAnswerCorrect(concept('Acromion'), ''), false);
  assert.equal(isOpenAnswerCorrect(concept('Acromion'), null), false);
  assert.equal(isOpenAnswerCorrect(concept('Acromion'), 'a'.repeat(201)), false);
});

test('grading identifies a forgiven typo separately from an exact or incorrect response', () => {
  assert.deepEqual(checkOpenAnswer(concept('Acromion'), 'acormion'), { correct: true, typo: true });
  assert.deepEqual(checkOpenAnswer(concept('Acromion'), 'ACRÓMION.'), { correct: true, typo: false });
  assert.deepEqual(checkOpenAnswer(concept('Adductie', ['Abductie']), 'aductie'), { correct: false, typo: false });
});
