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
      typeof value.finished !== 'boolean' || (value.finished && value.index !== value.ids.length) || !['daily', 'review', ...topics.map(t => t.id)].includes(value.region)) return null;
    if (value.levelId != null && (!topics.some(t => [0, 1, 2].some(stage => value.levelId === t.id + ':' + stage && value.region === t.id && value.stage === stage)) ||
      !Number.isInteger(value.initialCount) || value.initialCount < 1 || value.initialCount > value.ids.length ||
      !Number.isInteger(value.firstCorrect) || value.firstCorrect < 0 || value.firstCorrect > value.initialCount)) return null;
    if (value.xp != null && (!Number.isInteger(value.xp) || value.xp < 0)) return null;
    if (value.matched != null && (!Array.isArray(value.matched) || !value.matched.every(id => typeof id === 'string'))) return null;
    if (value.pairOrder != null && (!Array.isArray(value.pairOrder) || !value.pairOrder.every(id => typeof id === 'string'))) return null;
    const question = questions.get(value.ids[value.index]);
    if (question && (!Array.isArray(value.options) || value.options.length !== 4 ||
      new Set(value.options).size !== 4 || !value.options.includes(question.answer) ||
      !value.options.every(option => option === question.answer || question.distractors.includes(option)) ||
      (value.response !== null && !value.options.includes(value.response) && !(exerciseFor(question, value.index) === 'point' && typeof value.response === 'string' && value.response.length < 200)))) return null;
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

export const GAME_KEY = 'motionstudy.game.v1';
export const DAILY_GOAL = 30;
export function dayKey(now = Date.now()) {
  const date = new Date(now);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function readGame(storage) {
  try {
    const value = JSON.parse(storage.getItem(GAME_KEY) || '{}');
    const days = Object.fromEntries(Object.entries(value.days || {}).filter(([key, xp]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isInteger(xp) && xp >= 0));
    const completed = Array.isArray(value.completed) ? [...new Set(value.completed.filter(id => topics.some(t => [0, 1, 2].some(stage => id === t.id + ':' + stage))))] : [];
    return { days, completed };
  } catch { return { days: {}, completed: [] }; }
}
export function awardXP(game, xp, now = Date.now()) {
  const day = dayKey(now);
  return { ...game, days: { ...game.days, [day]: (game.days[day] || 0) + xp } };
}
export function gameStats(game, now = Date.now()) {
  const today = dayKey(now);
  let cursor = new Date(now);
  cursor.setHours(12, 0, 0, 0);
  if ((game.days[today] || 0) < DAILY_GOAL) cursor.setDate(cursor.getDate() - 1);
  let streak = 0;
  while ((game.days[dayKey(cursor.getTime())] || 0) >= DAILY_GOAL) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { today: game.days[today] || 0, xp: Object.values(game.days).reduce((sum, xp) => sum + xp, 0), streak };
}
export function levelPath(game) {
  const levels = topics.flatMap(topic => ['Ontdekken', 'Oefenen', 'Checkpoint'].map((label, stage) => ({ id: topic.id + ':' + stage, topic, stage, label })));
  const first = levels.findIndex(level => !game.completed.includes(level.id));
  return levels.map((level, index) => ({ ...level, done: game.completed.includes(level.id), locked: first !== -1 && index > first }));
}
export function levelQuestions(questions, region, stage) {
  const pool = questions.filter(q => q.region === region);
  const start = Math.floor(stage * pool.length / 3);
  const end = Math.floor((stage + 1) * pool.length / 3);
  return pool.slice(start, end);
}
export function completeLevel(game, id, correct, total) {
  if (!id || total < 1 || correct / total < 0.8 || !levelPath(game).some(level => level.id === id && !level.locked)) return game;
  return { ...game, completed: [...new Set([...game.completed, id])] };
}
export function exerciseFor(question, index) {
  if (question.type === 'recognition') {
    const surface = ['pectoralis', 'delt-front', 'delt-mid', 'delt-back', 'lats', 'traps-upper', 'biceps', 'triceps', 'rectus-abd', 'glute-max', 'rectus-fem', 'gastrocnemius'];
    return index % 2 && surface.includes(question.muscleId) ? 'point' : 'recognition';
  }
  if (index % 3 === 1) return 'binary';
  return 'choice';
}
export function matchingPairs(cards, region) {
  const pool = cards.filter(card => card.region === region && card.fields.functie);
  const unique = pool.filter((card, index) => pool.findIndex(other => other.fields.functie === card.fields.functie) === index);
  return unique.slice(0, 3).map(card => ({ id: card.id, name: card.name, function: card.fields.functie }));
}

export function binaryResponses(question, options) {
  const claim = options[0];
  return [claim, claim === question.answer ? options.find(option => option !== question.answer) : question.answer];
}
export function varyLesson(queue) {
  if (queue.length < 2) return queue;
  const point = queue.find(q => exerciseFor(q, 1) === 'point');
  if (!point) return queue;
  const remaining = queue.filter(q => q.id !== point.id);
  return [remaining[0], point, ...remaining.slice(1)];
}

export const DRAFTS_KEY = 'motionstudy.drafts.v1';
export function draftKey(session) { return session.levelId || session.region; }
export function readDrafts(storage, questions) {
  try {
    const values = JSON.parse(storage.getItem(DRAFTS_KEY) || '{}');
    return Object.fromEntries(Object.entries(values).flatMap(([key, value]) => {
      const session = readSession({ getItem: () => JSON.stringify(value) }, questions);
      return session && !session.finished && session.ids.length && draftKey(session) === key ? [[key, session]] : [];
    }));
  } catch { return {}; }
}
