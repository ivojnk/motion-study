import { exerciseRows, exerciseVariants } from './exercise-catalog.js';
import { pickDistractors, similarity, zoneOf } from './distractor-pool.js';
import { muscles } from './muscles.js';

const muscleRegion = new Map(muscles.map(muscle => [muscle.id, muscle.region]));

// Words that only describe equipment or setup, so they don't make two exercises look alike.
const MODIFIERS = new Set(['met', 'single', 'arm', 'one', 'cable', 'standing', 'seated', 'incline', 'decline', 'banded', 'band', 'paused', 'supported', 'hand', 'half', 'kneeling', 'assisted', 'weighted', 'lying', 'chest', 'machine', 'barbell', 'dumbbell', 'box', 'kuiten', 'tegen', 'accent', 'bilaccent', 'hamstringaccent', 'knieaccent', 'heupaccent', 'of', 'en']);
const movementWords = name => new Set(name.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').split(/\s+/).filter(word => word.length > 1 && !MODIFIERS.has(word) && !['db', 'bb', 'kb', 'up'].includes(word)));
// Two exercises look alike when they share a movement word (squat, curl, row, push).
const sameFamily = (a, b) => { const left = movementWords(a); return [...movementWords(b)].some(word => left.has(word)) || similarity(a, b) >= 0.5; };

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
    // Exercises that light up some of the same muscles are the most believable wrong options.
    const overlap = other => other.muscleIds.filter(id => row.muscleIds.includes(id)).length;
    // A variant of the same movement whose muscles contain (or sit inside) this set could also fit, so skip it.
    const twin = other => overlap(other) === Math.min(row.muscleIds.length, other.muscleIds.length) && sameFamily(other.name, row.name);
    const others = catalog.filter(other => other.key !== row.key && other.name !== row.name && !relatedFamily(other) && !twin(other));
    const strong = others.filter(other => overlap(other) * 2 >= Math.min(row.muscleIds.length, other.muscleIds.length)).sort((a, b) => overlap(b) - overlap(a));
    const weak = others.filter(other => !strong.includes(other) && overlap(other) > 0);
    const regions = new Set(row.muscleIds.map(id => muscleRegion.get(id)).filter(Boolean));
    const near = (other, same) => other.muscleIds.some(id => muscleRegion.has(id) && (same ? regions.has(muscleRegion.get(id)) : [...regions].some(region => zoneOf(region) === zoneOf(muscleRegion.get(id)))));
    const unshared = others.filter(other => overlap(other) === 0);
    const sameRegion = unshared.filter(other => near(other, true));
    const sameZone = unshared.filter(other => !sameRegion.includes(other) && near(other, false));
    const rest = unshared.filter(other => !sameRegion.includes(other) && !sameZone.includes(other));
    const distractors = pickDistractors(row.name, [strong, weak, sameRegion, sameZone, rest].map(tier => tier.map(other => other.name)), { limit: 6, ambiguous: 1.01, alike: sameFamily });
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
