import { extraMuscleGroups } from './muscles.js';
import { exerciseRows } from './exercise-catalog.js';
import { lengthProfiles } from './length-profiles.js';

export function additionalMuscleCards(questions) {
  return extraMuscleGroups.map(group => {
    const fact = questions.find(q => q.id === group.sourceQuestionId);
    if (!fact?.source) throw new Error('Missing anatomy source: ' + group.sourceQuestionId);
    return { id: group.id, name: group.name, patterns: group.patterns, view: group.view,
      region: 'verdieping', fields: { functie: group.id === 'multifidus' ? 'Onderdeel van de inner core unit. Gezamenlijke taak van deze unit: ' + fact.answer : fact.answer }, source: { ...fact.source } };
  });
}

export function modelKnowledgeQuestions(questions, cards) {
  const sourceQuestions = questions.filter(q => q.type === 'choice' && q.source?.kind !== 'supplement');
  const generated = [];
  const add = (fact, muscleIds, view, hint, highlightPatterns = {}, suffix = '') => {
    if (!fact?.source || !fact.distractors?.length) throw new Error('Missing 3D knowledge source');
    const card = fact.muscleId && cards.find(card => card.id === fact.muscleId);
    const prompt = card ? fact.prompt.replace(card.name, 'de gemarkeerde spier') : fact.prompt;
    const { modelContext, ...sourceFact } = fact;
    generated.push({ ...sourceFact, prompt, id: 'model-fact-' + fact.id + suffix, region: 'verdieping', type: 'model-fact',
      muscleIds, view, hint, highlightPatterns, sourceQuestionId: fact.id, source: { ...fact.source } });
  };
  // All available origin, attachment, function and stretch fields gain a visual
  // recall form, without inventing missing fields from the supplied sheet.
  for (const fact of sourceQuestions.filter(q => q.muscleId)) {
    const card = cards.find(card => card.id === fact.muscleId);
    if (card) add(fact, [card.id], card.view, 'Beantwoord de vraag over de gemarkeerde spier.');
  }
  for (const row of exerciseRows) {
    for (const fact of sourceQuestions.filter(q => q.id === row.sourceQuestionId ||
      q.id.startsWith('extra-muscles-' + row.key + '-') && !q.id.endsWith('-profile'))) {
      add(fact, row.muscleIds, row.view, 'Het model toont het spieraccent bij ' + row.name + '.', row.patterns);
    }
  }
  // The actual 57 graphic profiles are reused exactly, including combined ranges.
  for (const [index, profile] of lengthProfiles.entries()) {
    const row = exerciseRows.filter(row => !['deadbug', 'birddog', 'plank', 'back-hold', 'pallof', 'anti-chop', 'sidehold'].includes(row.key))[index];
    if (!row) throw new Error('Missing length-profile exercise: ' + profile.id);
    const fact = questions.find(q => q.id === profile.id);
    add(fact, row.muscleIds, row.view, 'Paars markeert het spieraccent van ' + profile.name + '. Kies het bijbehorende lengteprofiel.', row.patterns);
  }
  for (const group of extraMuscleGroups) {
    const card = cards.find(card => card.id === group.id);
    const related = group.id === 'multifidus' ? [] : group.id === 'diaphragm' ? sourceQuestions.filter(q => q.id.startsWith('extra-muscles-diaphragm-')) :
      group.id === 'pelvic-floor' ? sourceQuestions.filter(q => q.id.startsWith('extra-muscles-pelvic-') && !/positions|lift/.test(q.id)) :
      sourceQuestions.filter(q => q.id === group.sourceQuestionId);
    for (const fact of related) add(fact, [group.id], card.view, 'De gemarkeerde structuur is ' + group.name + '.');
    const names = cards.filter(other => other.id !== card.id).map(other => other.name);
    generated.push({ id: 'model-name-' + card.id, region: 'verdieping', muscleId: card.id, type: 'recognition',
      prompt: 'Welke spier of structuur is paars gemarkeerd?', answer: card.name, distractors: names,
      acceptedAnswers: group.id === 'diaphragm' ? ['middenrif'] : group.id === 'pelvic-floor' ? ['bekkenbodemspieren'] : [], source: { ...card.source } });
  }
  const units = [
    ['extra-muscles-inner-members', ['diaphragm', 'pelvic-floor', 'transversus', 'multifidus'], 'front'],
    ['extra-muscles-inner-role', ['diaphragm', 'pelvic-floor', 'transversus', 'multifidus'], 'front'],
    ['extra-muscles-outer-members', ['rectus-abd', 'oblique-ext', 'oblique-int', 'erector', 'glute-max', 'glute-med', 'lats'], 'back'],
    ['extra-muscles-outer-role', ['rectus-abd', 'oblique-ext', 'oblique-int', 'erector', 'glute-max', 'glute-med', 'lats'], 'back'],
    ['extra-muscles-breathing-brace', ['diaphragm', 'pelvic-floor', 'transversus', 'multifidus'], 'front'],
    ['extra-muscles-rotator-cuff-members', ['supraspinatus', 'infraspinatus', 'teres-minor', 'subscapularis'], 'back']
  ];
  for (const [id, ids, view] of units) {
    const fact = sourceQuestions.find(q => q.id === id);
    if (fact) add(fact, ids, view, 'De gemarkeerde structuren vormen de groep waarover deze vraag gaat.');
  }
  // Technique questions remain text questions about the named exercise. The
  // atlas supplies anatomy context and does not pretend to demonstrate a fault.
  const patterns = [
    ['squat', ['vasti', 'glute-max', 'glute-med', 'erector'], 'front'],
    ['hinge', ['glute-max', 'biceps-fem', 'semis', 'erector'], 'back'],
    ['bench', ['pectoralis', 'triceps', 'delt-front'], 'front'],
    ['push', ['pectoralis', 'triceps', 'serratus'], 'front'],
    ['row', ['lats', 'traps-mid', 'rhomboids', 'biceps'], 'back'],
    ['vertical-push', ['delt-front', 'triceps', 'serratus'], 'front'],
    ['vertical-pull', ['lats', 'biceps', 'traps-lower'], 'back'],
    ['chin-pull', ['lats', 'biceps', 'traps-lower'], 'back']
  ];
  for (const fact of sourceQuestions.filter(q => q.region === 'patronen')) {
    const pattern = patterns.find(([key]) => fact.id.startsWith('extra-patterns-' + key + '-'));
    if (pattern) add(fact, pattern[1], pattern[2], 'Het model toont betrokken spieren. Beantwoord de techniekvraag volgens de sheet.');
  }
  const ids = generated.map(q => q.id);
  if (new Set(ids).size !== ids.length) throw new Error('Duplicate 3D knowledge question');
  return generated;
}
