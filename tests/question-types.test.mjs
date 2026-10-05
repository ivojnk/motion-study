import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  DAY, supportsOpenAnswer, isOpenAnswerCorrect, checkOpenAnswer, exerciseFor, varyLesson,
  optionsFor, readSession, readDrafts, readProgress, recordAnswer, masteryFor
} from '../src/learning.js';

const curriculum = JSON.parse(readFileSync(new URL('../src/data/curriculum.json', import.meta.url)));
const storage = value => ({ getItem: () => JSON.stringify(value) });
const question = id => curriculum.questions.find(q => q.id === id);
const short = question('delt-mid-oorsprong');
const visual = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'pectoralis');
const long = question('pectoralis-functie');
function session(q, mode, extra = {}) {
  return { ids: [q.id], exerciseModes: [mode], index: 0, correct: 0, answered: 0,
    retryIds: [], region: q.region, options: optionsFor(q), response: null,
    finished: false, ...extra };
}

test('automatic short answers normalize spelling presentation without guessing semantics', () => {
  assert.ok(supportsOpenAnswer(short));
  assert.ok(isOpenAnswerCorrect(short, '  ACRÓMION.  '));
  assert.equal(isOpenAnswerCorrect(short, 'acromion of sleutelbeen'), false);
  assert.equal(isOpenAnswerCorrect(short, 'acro'), false);
  assert.equal(isOpenAnswerCorrect(short, ''), false);
  assert.equal(isOpenAnswerCorrect(short, {}), false);
  assert.equal(isOpenAnswerCorrect(short, 'a'.repeat(201)), false);
  assert.equal(supportsOpenAnswer(long), false);
  assert.equal(isOpenAnswerCorrect(long, long.answer), false);
  assert.equal(supportsOpenAnswer({ answer: 'Je kunt meer tillen', type: 'choice' }), false);
});

test('muscle-name aliases accept vetted equivalences and preserve anatomical distinctions', () => {
  assert.ok(isOpenAnswerCorrect(visual, 'M. PECTORALIS MAJOR'));
  assert.ok(isOpenAnswerCorrect(visual, 'musculus pectoralis major'));
  assert.equal(isOpenAnswerCorrect(visual, 'pectoralis'), false);
  assert.equal(isOpenAnswerCorrect(visual, 'pectoralis minor'), false);
  const biceps = { type: 'recognition', answer: 'Biceps brachii' };
  assert.ok(isOpenAnswerCorrect(biceps, 'biceps'));
  const anterior = { type: 'recognition', answer: 'Deltoideus · voorste kop' };
  assert.ok(isOpenAnswerCorrect(anterior, 'Deltoideus pars clavicularis'));
  assert.equal(isOpenAnswerCorrect(anterior, 'deltoideus'), false);
  assert.equal(isOpenAnswerCorrect(anterior, 'achterste deltoideus'), false);
  assert.equal(isOpenAnswerCorrect({ type: 'recognition', answer: 'Gluteus medius & minimus' }, 'gluteus medius'), false);
  assert.ok(isOpenAnswerCorrect({ type: 'choice', answer: 'Clavicula', acceptedAnswers: ['Sleutelbeen'] }, 'sleutelbeen'));
});

test('legacy exercise mode retains exact positions when restoring existing lessons', () => {
  assert.equal(exerciseFor(visual, 0), 'recognition');
  assert.equal(exerciseFor(visual, 1), 'point');
  assert.equal(exerciseFor(visual, 2), 'recognition');
  assert.equal(exerciseFor(visual, 3), 'point');
  assert.equal(exerciseFor(short, 2), 'choice');
  assert.equal(exerciseFor(long, 2), 'choice');
  assert.equal(exerciseFor({ ...visual, muscleId: 'pec-minor' }, 1), 'recognition');
});

test('varied lesson order includes highlighting, pointing and recall without duplicating questions', () => {
  const secondVisual = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'biceps');
  const queue = [long, short, secondVisual, visual];
  const result = varyLesson(queue);
  assert.deepEqual(queue, [long, short, secondVisual, visual]);
  assert.equal(exerciseFor(result[0], 0), 'recognition');
  assert.equal(exerciseFor(result[1], 1), 'point');
  assert.ok(supportsOpenAnswer(result[2]));
  assert.deepEqual(new Set(result), new Set(queue));
  assert.deepEqual(varyLesson([short]), [short]);
});

test('saved short responses and unfinished drafts survive reload with fixed exercise modes', () => {
  const lookup = new Map([[short.id, short]]);
  const draft = session(short, 'open', { openDraft: 'Acro' });
  assert.deepEqual(readSession(storage(draft), lookup), draft);
  assert.deepEqual(readDrafts(storage({ [short.region]: draft }), lookup), { [short.region]: draft });
  const response = session(short, 'open', { response: 'ACRÓMION' });
  assert.deepEqual(readSession(storage(response), lookup), response);
  assert.ok(isOpenAnswerCorrect(short, readSession(storage(response), lookup).response));
  const incorrect = session(short, 'open', { response: 'Wrong answer' });
  assert.equal(isOpenAnswerCorrect(short, readSession(storage(incorrect), lookup).response), false);
  assert.equal(readSession(storage({ ...draft, openDraft: 'a'.repeat(201) }), lookup), null);
  assert.equal(readSession(storage({ ...draft, exerciseModes: [] }), lookup), null);
  assert.equal(readSession(storage({ ...draft, exerciseModes: ['recognition-open'] }), lookup), null);
  assert.equal(readSession(storage({ ...draft, selfAssessmentCorrect: true }), lookup), null);
});

test('long source answers remain valid in legacy multiple-choice sessions', () => {
  const q = { ...long, answer: 'a'.repeat(500) };
  const lookup = new Map([[q.id, q]]);
  const saved = session(q, 'choice', { response: q.answer });
  assert.deepEqual(readSession(storage(saved), lookup), saved);
});

test('self-assessed open answers require a reveal and explicit learner judgment', () => {
  const lookup = new Map([[long.id, long]]);
  const draft = session(long, 'open-self', { openDraft: 'Een eigen uitleg', openRevealed: true });
  assert.deepEqual(readSession(storage(draft), lookup), draft);
  const assessed = { ...draft, response: draft.openDraft, selfAssessmentCorrect: false };
  assert.deepEqual(readSession(storage(assessed), lookup), assessed);
  assert.equal(readSession(storage({ ...assessed, openRevealed: false }), lookup), null);
  const { selfAssessmentCorrect, ...missingJudgment } = assessed;
  assert.equal(readSession(storage(missingJudgment), lookup), null);
  assert.equal(readSession(storage(session(long, 'open')), lookup), null);
  assert.equal(readSession(storage({ ...assessed, response: '' }), lookup), null);
  const detailed = { ...assessed, openDraft: 'a'.repeat(1000), response: 'a'.repeat(1000) };
  assert.deepEqual(readSession(storage(detailed), lookup), detailed);
  assert.equal(readSession(storage({ ...detailed, openDraft: 'a'.repeat(2001) }), lookup), null);
  assert.equal(readSession(storage({ ...detailed, response: 'a'.repeat(2001) }), lookup), null);
});

test('exercise stats track mode attempts without accelerating spaced progress during early practice', () => {
  const empty = { questions: {}, sessions: [] };
  const first = recordAnswer(empty, short.id, true, 1000, 'choice');
  const early = recordAnswer(first, short.id, true, 2000, 'open');
  assert.deepEqual(early.questions[short.id].exerciseStats.open, { attempts: 1, correct: 1, lastCorrect: true, spacedCorrect: 0 });
  assert.equal(early.questions[short.id].interval, 1);
  const due = recordAnswer(early, short.id, true, 1000 + DAY, 'open');
  assert.equal(due.questions[short.id].exerciseStats.open.spacedCorrect, 1);
  assert.equal(due.questions[short.id].lastExercise, 'open');
  const failed = recordAnswer(due, short.id, false, 1000 + DAY + 10, 'open');
  assert.deepEqual(failed.questions[short.id].exerciseStats.open, { attempts: 3, correct: 2, lastCorrect: false, spacedCorrect: 1 });
  assert.equal(failed.questions[short.id].interval, 0);
  assert.deepEqual(readProgress(storage(failed)), failed);
  assert.deepEqual(empty.questions, {});
  const corrupt = structuredClone(failed);
  corrupt.questions[short.id].exerciseStats.open.correct = 10;
  assert.deepEqual(readProgress(storage(corrupt)).questions, {});
  const legacy = recordAnswer(empty, short.id, true, 1000);
  assert.equal(legacy.questions[short.id].exerciseStats, undefined);
  assert.deepEqual(readProgress(storage(legacy)), legacy);
});


test('typing errors tolerate missing, extra, swapped or replaced letters and identify correction feedback', () => {
  for (const typed of ['acromon', 'acormion', 'acromionn', 'acromion', 'acrómion.', 'acromiun']) {
    const result = checkOpenAnswer(short, typed);
    assert.equal(result.correct, true, typed);
    assert.equal(result.typo, !['acromion', 'acrómion.'].includes(typed), typed);
  }
  for (const typed of ['pectoraliss major', 'pectorails major', 'pectoarlis major', 'pectorlias major', 'pectorials major', 'pectoralis majro']) {
    assert.deepEqual(checkOpenAnswer(visual, typed), { correct: true, typo: true }, typed);
  }
  const lats = curriculum.questions.find(q => q.type === 'recognition' && q.muscleId === 'lats');
  assert.deepEqual(checkOpenAnswer(lats, 'latissmus doris'), { correct: true, typo: true });
  assert.deepEqual(checkOpenAnswer(visual, 'musculus pectoralis major'), { correct: true, typo: false });
  assert.deepEqual(checkOpenAnswer(short, 'acro'), { correct: false, typo: false });
  assert.equal(checkOpenAnswer(visual, 'pectlis major').correct, false);
});

test('typo tolerance rejects other movements, subtype names and ambiguous near matches', () => {
  for (const [correct, incorrect] of [
    ['Adductie', 'Abductie'], ['Adductie', 'aductie'], ['Excentrisch', 'Concentrisch'],
    ['Endorotatie', 'Exorotatie'], ['Flexie knie', 'Extensie knie'],
    ['Pectoralis major', 'pectoralis minor'], ['Pectoralis major', 'pectoralis minr'],
    ['Gluteus medius', 'Gluteus minimus'], ['Gluteus medius', 'gluteus minimis'],
    ['Vastus medialis', 'Vastus lateralis'], ['Deltoideus anterior', 'Deltoideus posterior'],
    ['Biceps brachii', 'Triceps brachii'], ['Trapezius · boven', 'Trapezius onder']
  ]) {
    const q = { type: 'recognition', answer: correct, distractors: [incorrect] };
    assert.deepEqual(checkOpenAnswer(q, incorrect), { correct: false, typo: false }, correct + ' / ' + incorrect);
  }
  assert.equal(checkOpenAnswer({ type: 'recognition', answer: 'Pectoralis major' }, 'pectoralis minor').correct, false);
  assert.equal(checkOpenAnswer(long, 'Retroflexi').correct, false);
});

test('near matches preserve qualifiers, short words, numbers and negations', () => {
  for (const [answer, response] of [
    ['80 graden', '90 graden'], ['-90 graden', '90 graden'], ['90 graden', '-90 graden'], ['Niet buigen', 'buigen'], ['Niet buigen', 'nirt buigen'],
    ['Geen flexie', 'geen extensie'], ['Spier A', 'spier B'], ['Gluteus medius en minimus', 'gluteus medius of minimus']
  ]) {
    assert.equal(checkOpenAnswer({ type: 'recognition', answer }, response).correct, false, answer + ' / ' + response);
  }
  assert.equal(checkOpenAnswer({ type: 'recognition', answer: 'Spier A' }, 'spier a').correct, true);
  assert.equal(checkOpenAnswer(visual, 'pectoralis').correct, false);
});


test('adaptive mastery requires spaced recall while legacy mastery remains intact', () => {
  const easyOnly = recordAnswer(recordAnswer(recordAnswer({ questions: {}, sessions: [] }, short.id, true, 1000, 'choice'), short.id, true, 1000 + DAY, 'binary'), short.id, true, 1000 + 3 * DAY, 'choice');
  assert.equal(easyOnly.questions[short.id].interval, 4);
  assert.equal(masteryFor([short], easyOnly), 0);
  const earlyRecall = recordAnswer(easyOnly, short.id, true, 1000 + 3 * DAY + 10, 'open');
  assert.equal(masteryFor([short], earlyRecall), 0);
  const spacedRecall = recordAnswer(earlyRecall, short.id, true, 1000 + 7 * DAY, 'open');
  assert.equal(masteryFor([short], spacedRecall), 100);
  const selfRecall = recordAnswer(easyOnly, short.id, true, 1000 + 7 * DAY, 'open-self');
  assert.equal(masteryFor([short], selfRecall), 100);
  const legacy = { questions: { [short.id]: { interval: 4, lastCorrect: true } } };
  assert.equal(masteryFor([short], legacy), 100);
  legacy.questions[short.id].exerciseStats = {};
  assert.equal(masteryFor([short], legacy), 100);
  const visualProgress = { questions: { [visual.id]: { interval: 4, lastCorrect: true, exerciseStats: { point: { spacedCorrect: 2 } } } } };
  assert.equal(masteryFor([visual], visualProgress), 0);
  visualProgress.questions[visual.id].exerciseStats['recognition-open'] = { spacedCorrect: 1 };
  assert.equal(masteryFor([visual], visualProgress), 100);
});
