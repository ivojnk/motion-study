export const DAY = 86400000;
export const PROGRESS_KEY = 'motionstudy.progress.v1';
export const SESSION_KEY = 'motionstudy.session.v1';
export const topics = [
  ['basis', 'De taal van het lichaam', 'Richtingen, bewegingen & biomechanica', 'school'],
  ['borst', 'Borst & schouders', 'Van pectoralis tot rotator cuff', 'stretch'],
  ['rug', 'Rug', 'Lats, trapezius & schouderbladen', 'stretch'],
  ['armen', 'Armen', 'Biceps, triceps & elleboogbewegingen', 'barbell'],
  ['core', 'Core', 'Stabiliteit, ademhaling & beweging', 'target'],
  ['heup', 'Heup & bilspieren', 'Glutes, adductoren & heupbewegingen', 'stretch'],
  ['quads', 'Quadriceps', 'Knie-extensie & oefeningskeuze', 'barbell'],
  ['hamstrings', 'Hamstrings', 'Heupstrekking & kniebuiging', 'barbell'],
  ['kuiten', 'Kuiten', 'Gastrocnemius, soleus & de enkel', 'stretch'],
  ['patronen', 'Van anatomie naar beweging', 'Squat, hinge, duwen & trekken', 'arrows'],
  ['groei', 'Waarom spieren groeien', 'Hypertrofie, volume & progressie', 'growth']
].map(([id, title, subtitle, icon]) => ({ id, title, subtitle, icon }));

export function shuffled(items, random = Math.random) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function optionsFor(question, random = Math.random) {
  return shuffled([question.answer, ...shuffled([...new Set(question.distractors)].filter(x => x !== question.answer), random).slice(0, 3)], random);
}
export function readProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem(PROGRESS_KEY) || storage.getItem('lottequiz.v1') || '{}');
    const valid = Object.fromEntries(Object.entries(data.questions || {}).filter(([, entry]) =>
      entry && Number.isInteger(entry.correct) && entry.correct >= 0 && Number.isFinite(entry.due) && Number.isInteger(entry.attempts) && entry.attempts >= entry.correct &&
      Number.isInteger(entry.interval) && entry.interval >= 0 && entry.interval <= 30 && typeof entry.lastCorrect === 'boolean'
    ));
    return { questions: valid, sessions: Array.isArray(data.sessions) ? data.sessions.filter(s => Number.isFinite(s.at) && Number.isFinite(s.correct) && Number.isFinite(s.total)) : [] };
  } catch { return { questions: {}, sessions: [] }; }
}
export function readSession(storage, questions) {
  try {
    const value = JSON.parse(storage.getItem(SESSION_KEY) || storage.getItem('lottequiz.session.v1') || 'null');
    if (!value || !Array.isArray(value.ids) || !value.ids.every(id => questions.has(id)) ||
      !Number.isInteger(value.index) || value.index < 0 || value.index > value.ids.length ||
      !Number.isInteger(value.answered) || value.answered < 0 || value.answered > value.ids.length ||
      !Number.isInteger(value.correct) || value.correct < 0 || value.correct > value.answered ||
      !Array.isArray(value.retryIds) || !value.retryIds.every(id => value.ids.includes(id)) ||
      typeof value.finished !== 'boolean' || !['daily', 'review', ...topics.map(t => t.id)].includes(value.region)) return null;
    const question = questions.get(value.ids[value.index]);
    if (question && (!Array.isArray(value.options) || value.options.length !== 4 ||
      new Set(value.options).size !== 4 || !value.options.includes(question.answer) ||
      !value.options.every(option => option === question.answer || question.distractors.includes(option)) ||
      (value.response !== null && !value.options.includes(value.response)))) return null;
    return value;
  } catch { return null; }
}
export function recordAnswer(progress, id, correct, now = Date.now()) {
  const previous = progress.questions[id] || { correct: 0, attempts: 0, interval: 0 };
  // Practising early is useful, but must not manufacture spaced mastery.
  const early = correct && previous.lastCorrect && previous.due > now;
  const interval = correct ? early ? previous.interval : Math.min(30, previous.interval ? previous.interval * 2 : 1) : 0;
  return { ...progress, questions: { ...progress.questions, [id]: {
    correct: previous.correct + Number(correct), attempts: previous.attempts + 1,
    interval, due: early ? previous.due : now + (correct ? interval * DAY : 10 * 60000), lastCorrect: correct
  } } };
}
export function lessonQueue(questions, progress, { region = 'daily', limit = 10, now = Date.now(), availableMuscles = null } = {}) {
  const pool = questions.filter(q => (region === 'daily' || region === 'review' || q.region === region) &&
    (q.type !== 'recognition' || availableMuscles?.has(q.muscleId)));
  const due = shuffled(pool.filter(q => progress.questions[q.id] && progress.questions[q.id].due <= now));
  const fresh = shuffled(pool.filter(q => !progress.questions[q.id]));
  const future = shuffled(pool.filter(q => progress.questions[q.id]?.due > now));
  if (region === 'review') return due.slice(0, limit);
  return [...due, ...fresh, ...future].slice(0, limit);
}
export function masteryFor(questions, progress) {
  if (!questions.length) return 0;
  return Math.round(100 * questions.filter(q => progress.questions[q.id]?.interval >= 4 && progress.questions[q.id]?.lastCorrect).length / questions.length);
}
