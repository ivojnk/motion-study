// Explicit questions for the details found in the repeat cheatsheet audit.
// Keep this batch separate so existing lesson partitions stay unchanged.
const source = (section, page) => ({
  kind: 'course-detail', title: 'Anatomie & Biomechanica · Milo module 6.6', section, page
});

const terminology = [
  ['sternocostalis', 'borst', 'Hoe heten de middelste borstvezels die bij een bovenarmhoek van 90° worden benadrukt?', 'Sternocostalis', ['Pars clavicularis', 'Pars abdominalis', 'Pars acromialis'], ['Pars sternocostalis'], 6],
  ['trapezius-descendens', 'rug', 'Welke Latijnse naam hoort bij het bovenste deel van de trapezius?', 'Descendens', ['Transversa', 'Ascendens', 'Clavicularis'], ['Pars descendens', 'Trapezius pars descendens'], 8],
  ['trapezius-transversa', 'rug', 'Welke Latijnse naam hoort bij het middelste deel van de trapezius?', 'Transversa', ['Descendens', 'Ascendens', 'Clavicularis'], ['Pars transversa', 'Trapezius pars transversa'], 9],
  ['trapezius-ascendens', 'rug', 'Welke Latijnse naam hoort bij het onderste deel van de trapezius?', 'Ascendens', ['Descendens', 'Transversa', 'Clavicularis'], ['Pars ascendens', 'Trapezius pars ascendens'], 9],
  ['rhomboideus-members', 'rug', 'Welke twee spieren worden samen bedoeld met rhomboideus in het cheatsheet?', 'Rhomboideus minor en major', ['Teres minor en major', 'Pectoralis minor en major', 'Gluteus medius en minimus'], ['Rhomboideus minor en rhomboideus major', 'Rhomboideus minor/major', 'Rhomboideus major en minor'], 9]
].map(([id, region, prompt, answer, distractors, acceptedAnswers, page]) => ({
  id: 'course-detail-' + id, region, type: 'choice', prompt, answer, distractors, acceptedAnswers,
  source: source(region, page)
}));

const roles = [
  ['pectoralis', 'Pectoralis major', 'borst', 'Duwspier', 6],
  ['delt-front', 'de voorste kop van de deltoideus', 'borst', 'Duwspier', 6],
  ['delt-mid', 'de middelste kop van de deltoideus', 'borst', 'Duwspier', 6],
  ['delt-back', 'de achterste kop van de deltoideus', 'borst', 'Duwspier', 6],
  ['rotator-block', 'het blok “Rotator cuff (4) + teres major”', 'borst', 'Stabilisator', 7],
  ['serratus', 'Serratus anterior', 'borst', 'Stabilisator', 7],
  ['pec-minor', 'Pectoralis minor', 'borst', 'Duwspier', 7],
  ['lats', 'Latissimus dorsi', 'rug', 'Trekspier', 8],
  ['traps-upper', 'het bovenste deel van de trapezius', 'rug', 'Trekspier', 8],
  ['traps-mid', 'het middelste deel van de trapezius', 'rug', 'Trekspier', 9],
  ['traps-lower', 'het onderste deel van de trapezius', 'rug', 'Trekspier', 9],
  ['rhomboids', 'Rhomboideus minor/major', 'rug', 'Trekspier', 9]
].map(([id, name, region, answer, page]) => ({
  id: 'course-detail-role-' + id, region, type: 'choice',
  prompt: 'Welk rollabel staat in het cheatsheet bij ' + name + '?', answer,
  distractors: ['Duwspier', 'Trekspier', 'Stabilisator', 'Elleboogflexor'].filter(role => role !== answer),
  acceptedAnswers: [answer === 'Duwspier' ? 'Duwende spier' : answer === 'Trekspier' ? 'Trekkende spier' : 'Stabiliserende spier'],
  source: source(region, page)
}));

export const courseDetailQuestions = [
  ...terminology, ...roles,
  {
    id: 'course-detail-outer-core-role', region: 'core', type: 'choice',
    prompt: 'Welke gezamenlijke rol heeft de outer core unit volgens het cheatsheet?',
    answer: 'Beweging en kracht leveren',
    distractors: ['Ademhalingsgebonden stabilisatie en buikdruk opbouwen', 'Uitsluitend de schouderkop in de kom stabiliseren', 'Alleen de elleboog buigen'],
    source: source('Inner en outer core', 11)
  },
  {
    id: 'course-detail-squat-hip-phase', region: 'patronen', type: 'choice',
    prompt: 'Tijdens welke fase van de squat kan beperkte heupmobiliteit je volgens het cheatsheet voorover laten leunen?',
    answer: 'Excentrisch',
    distractors: ['Concentrisch', 'Isometrisch', 'Alleen na afloop van de squat'],
    acceptedAnswers: ['Excentrische fase', 'Tijdens het zakken', 'Zakken', 'Neergaande fase'],
    source: source('Squat en heupmobiliteit', 20)
  }
];
