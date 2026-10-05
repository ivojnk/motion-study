import { exerciseRows, exerciseVariants } from './exercise-catalog.js';

// Reuse the course's exercise facts and page references. The hint distinguishes
// exercises that train the same muscles; the atlas shows the course's emphasis.
const combinations = [
  ['row', 'Row met ellebogen naar buiten', ['traps-mid', 'rhomboids', 'delt-back'], 'back',
    'Je trekt met de ellebogen van de romp af en brengt de schouderbladen naar elkaar toe.', 'extra-muscles-row-elbows-out', ['row ellebogen naar buiten', 'wide elbow row']],
  ['pallof', 'Pallof press', ['oblique-ext', 'oblique-int', 'transversus'], 'front',
    'Je strekt de armen voor je uit en voorkomt dat de romp meedraait met de kabel.', 'extra-muscles-pallof-profile', ['pallof']],
  ['legpress', 'Leg press', ['rectus-fem', 'vasti'], 'front',
    'Je duwt een platform weg met de voeten; heup en knie strekken.', 'extra-muscles-legpress-profile', ['legpress']],
  ['legextension', 'Leg extension', ['rectus-fem', 'vasti'], 'front',
    'Je strekt alleen de knie tegen weerstand; de heup blijft stil.', 'extra-muscles-leanleg-profile', ['legextension']],
  ['rdl', 'Romanian deadlift', ['biceps-fem', 'semis'], 'back',
    'Je buigt en strekt vanuit de heup met licht gebogen knieën die vrijwel dezelfde hoek houden.', 'extra-muscles-ham-rdl-profile', ['rdl', 'roemeense deadlift']],
  ['legcurl', 'Seated leg curl', ['biceps-fem', 'semis'], 'back',
    'Je zit met gebogen heupen en buigt de knieën tegen weerstand.', 'extra-muscles-seatedcurl-profile', ['zittende leg curl', 'seated hamstring curl']],
  ['calf', 'Standing calf raise', ['soleus', 'gastrocnemius'], 'back',
    'Je staat met gestrekte knieën en duwt de hielen omhoog.', 'extra-muscles-standingcalf-profile', ['staande calf raise', 'standing calf raises']]
];

export function exerciseCombinationQuestions(questions) {
  const legacy = combinations.map(([id, answer, muscleIds, view, hint, sourceId, acceptedAnswers]) => ({
    key: id, name: answer, muscleIds, view, hint, sourceQuestionId: sourceId, acceptedAnswers, patterns: {}
  }));
  const oldSources = new Set(legacy.map(row => row.sourceQuestionId));
  const catalog = [...legacy, ...exerciseRows.filter(row => !oldSources.has(row.sourceQuestionId) || row.key === 'leanleg'), ...exerciseVariants];
  return catalog.map(row => {
    const fact = questions.find(question => question.id === row.sourceQuestionId);
    if (!fact?.source) throw new Error('Missing exercise source: ' + row.sourceQuestionId);
    const relatedFamily = other => other.sourceQuestionId === row.sourceQuestionId && (!other.variant || !row.variant);
    const sameRegion = catalog.filter(other => other.key !== row.key && !relatedFamily(other) && questions.find(q => q.id === other.sourceQuestionId)?.region === fact.region);
    const candidates = [...sameRegion, ...catalog.filter(other => other.key !== row.key && !relatedFamily(other) && !sameRegion.includes(other))];
    const distractors = legacy.includes(row) ? legacy.filter(other => other.key !== row.key).map(other => other.name) : [...new Set(candidates.map(other => other.name))].filter(name => name !== row.name).slice(0, 8);
    return {
      id: 'combination-' + row.key, region: 'combinaties', type: 'exercise-recognition',
      muscleIds: row.muscleIds, highlightPatterns: row.patterns,
      view: row.view, prompt: row.muscleIds.length === 1 ? 'Welke oefening past bij de gemarkeerde spier?' : 'Welke oefening past bij deze spiercombinatie?',
      hint: row.hint, answer: row.name, acceptedAnswers: legacy.includes(row) ? row.acceptedAnswers : [...new Set([...(row.acceptedAnswers || []), row.name.replace(/\bDB\b/g, 'dumbbell').replace(/\bBB\b/g, 'barbell').replace(/\bKB\b/g, 'kettlebell')])].filter(answer => answer !== row.name),
      explanation: fact.answer, sourceQuestionId: row.sourceQuestionId,
      sourceQuestionIds: [row.sourceQuestionId, ...row.muscleIds.map(id => questions.find(q => q.muscleId === id && q.id.endsWith('-functie'))?.id).filter(Boolean)],
      distractors, source: { ...fact.source }
    };
  });
}
