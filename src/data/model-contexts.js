import { muscles, extraMuscleGroups } from './muscles.js';

// Context enriches existing questions without changing their answers, sources,
// order or progress IDs. The atlas shows anatomy in one fixed body position.
const anteriorChain = ['pectoralis', 'iliopsoas', 'rectus-abd', 'oblique-ext', 'oblique-int', 'transversus', 'rectus-fem', 'vasti'];
const posteriorChain = ['gastrocnemius', 'soleus', 'biceps-fem', 'semis', 'glute-max', 'lats', 'erector'];
const context = (muscleIds, view, hint, prompt) => ({ muscleIds, view, hint, ...(prompt ? { prompt } : {}) });

const namedContexts = {
  'extra-basis-anterior-chain': context(anteriorChain, 'front', 'Paars markeert de spiergroepen aan de voorzijde die de cursus tot deze keten rekent.'),
  'extra-basis-posterior-chain': context(posteriorChain, 'back', 'Paars markeert de spiergroepen aan de achterzijde die de cursus tot deze keten rekent.'),
  'extra-basis-goodmorning-chain': context(posteriorChain, 'back', 'Bekijk de gemarkeerde keten van kuiten tot rug. Het model toont de spieren in rust.'),
  'extra-patterns-shared-core': context(['erector'], 'back', 'Paars markeert de rugstrekkers langs de wervelkolom. Bekijk hun ligging tussen bekken en bovenrug.'),
  'extra-patterns-lats-role': context(['lats'], 'back', 'Paars markeert de brede rugspieren. Bekijk hoe ze tussen romp en bovenarmen liggen.'),
  'extra-patterns-row-arm-angle': context(['lats', 'traps-upper', 'traps-mid', 'traps-lower'], 'back', 'Paars markeert lats en trapezius. Vergelijk hun ligging; de row wordt hier niet uitgebeeld.'),
  'extra-patterns-hinge-posterior': context(posteriorChain, 'back', 'Bekijk de gemarkeerde spierketen aan de achterzijde. De hinge-beweging is niet uitgebeeld.'),
  'course-detail-trapezius-descendens': context(['traps-upper'], 'back', 'Paars markeert het bovenste deel van de trapezius.'),
  'course-detail-trapezius-transversa': context(['traps-mid'], 'back', 'Paars markeert het middelste deel van de trapezius.'),
  'course-detail-trapezius-ascendens': context(['traps-lower'], 'back', 'Paars markeert het onderste deel van de trapezius.'),
  'course-detail-rhomboideus-members': context(['rhomboids'], 'back', 'Paars markeert de spiergroep tussen de wervelkolom en de schouderbladen, ook onder andere spieren.'),
  'course-detail-role-rotator-block': context(['supraspinatus', 'infraspinatus', 'teres-minor', 'subscapularis', 'teres-major'], 'back', 'Paars markeert de vier rotator-cuffspieren plus teres major uit dit cursusblok. Draai het model om ze te bekijken.'),
  'course-detail-outer-core-role': context(['rectus-abd', 'oblique-ext', 'oblique-int', 'erector', 'glute-max', 'glute-med', 'lats'], 'front', 'Paars markeert de outer-core-spieren uit de cursus, ook onder andere spieren. Draai het model om hun ligging te bekijken.')
};

const atlasMuscles = new Map([...muscles, ...extraMuscleGroups].map(muscle => [muscle.id, muscle]));
const fieldHints = {
  oorsprong: 'Paars markeert de hele spier. De oorsprong heeft geen aparte markering.',
  aanhechting: 'Paars markeert de hele spier. De aanhechtingsplaats heeft geen aparte markering.',
  functie: 'Bekijk de ligging van de paars gemarkeerde spier. Het model toont geen beweging.',
  'maximale rek': 'Bekijk de ligging van de paars gemarkeerde spier. De rekpositie is niet uitgebeeld.'
};

function contextFor(question) {
  if (question.type !== 'choice') return null;
  if (namedContexts[question.id]) return namedContexts[question.id];
  const roleId = question.id.startsWith('course-detail-role-') ? question.id.slice('course-detail-role-'.length) : null;
  const muscle = atlasMuscles.get(question.muscleId || roleId);
  if (!muscle) return null;
  if (roleId) return context([muscle.id], muscle.view, 'Bekijk de paars gemarkeerde spier en haar ligging voordat je het cursuslabel kiest.');
  const field = question.id.slice(muscle.id.length + 1);
  return fieldHints[field] ? context([muscle.id], muscle.view, fieldHints[field]) : null;
}

export function withModelContexts(questions) {
  // Rebuild metadata so removed contexts cannot survive a repeated enrichment.
  return questions.map(({ modelContext: previousContext, ...question }) => {
    const modelContext = contextFor(question);
    return modelContext ? { ...question, modelContext: { ...modelContext, muscleIds: [...modelContext.muscleIds] } } : question;
  });
}
