import curriculum from './data/curriculum.json' with { type: 'json' };

export const DAY = 86400000;
export const PROGRESS_KEY = 'motionstudy.progress.v1';
export const SESSION_KEY = 'motionstudy.session.v2';
export const LESSON_SIZE = 7;
export const MISTAKE_REVIEW_SUCCESSES = 3;
export const MISTAKE_REVIEW_LIMIT = 2;
export const EXERCISE_MODES = ['choice', 'binary', 'recognition', 'point', 'open', 'recognition-open', 'open-self'];
const POINTABLE_MUSCLES = new Set(['pectoralis', 'delt-front', 'delt-mid', 'delt-back', 'lats', 'traps-upper', 'biceps', 'triceps', 'rectus-abd', 'glute-max', 'rectus-fem', 'gastrocnemius']);
// Only fixed, short concepts are automatically graded. Explanations use a model
// answer and an explicit learner assessment instead of guessed semantics.
const SHORT_ANSWERS = new Set([
  'Sleutelbeen', 'Acromion', 'Spina scapulae', 'Radius', 'Schaambeen', 'Patellaligament',
  'Voorkant humerus', 'Buitenkant humerus', 'Buitenste sleutelbeen', 'Bovenkant ulna',
  'Gluteaal oppervlak darmbeen', 'Bovenkant femur', 'Onderkant bekken', 'Binnenkant tibia',
  'Spina iliaca anterior inferior', 'Plantairflexie', 'Dorsaalflexie', 'Adductie', 'Abductie',
  'Verticale abductie', 'Verticale adductie', 'Retractie', 'Protractie', 'Exorotatie',
  'Endorotatie', 'Anteflexie heup', 'Extensie knie', 'Flexie knie', 'Extensie wervelkolom',
  'Retroflexie', 'Supinatie', 'Contralaterale rotatie', 'Knie-extensie', 'Isometrisch',
  'Excentrisch', 'Concentrisch', 'Eenzijdig', 'Tweezijdig', 'Extensiemoment', 'Flexiemoment',
  'Rotatiemoment', 'Lateroflexiemoment', 'Verlengde positie', 'Verkorte positie', 'Middenpositie',
  'Subscapularis', 'Latissimus dorsi', 'Transversus abdominis', 'Gluteus medius', 'Rectus femoris',
  'Leg extension', 'Seated leg curl'
]);
const ANATOMY_ALIASES = {
  'Biceps brachii': ['biceps'], 'Triceps brachii': ['triceps'],
  'Rhomboideus': ['rhomboids', 'rhomboidei'],
  'Deltoideus · voorste kop': ['deltoideus anterior', 'voorste deltoideus', 'deltoideus pars clavicularis'],
  'Deltoideus · middelste kop': ['deltoideus lateralis', 'middelste deltoideus', 'deltoideus pars acromialis'],
  'Deltoideus · achterste kop': ['deltoideus posterior', 'achterste deltoideus', 'deltoideus pars spinalis'],
  'Trapezius · boven': ['bovenste trapezius', 'trapezius pars descendens'],
  'Trapezius · midden': ['middelste trapezius', 'trapezius pars transversa'],
  'Trapezius · onder': ['onderste trapezius', 'trapezius pars ascendens'],
  'Externe obliques': ['obliquus externus abdominis'],
  'Interne obliques': ['obliquus internus abdominis'],
  'Gluteus medius & minimus': ['gluteus medius en minimus', 'gluteus medius en gluteus minimus']
};
function normalizedAnswer(value, muscle = false) {
  let result = value.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
  if (muscle) result = result.replace(/^(?:m\.\s*|musculus\s+)/u, '');
  result = result.replace(/([+−-])\s*(?=\d)/gu, sign => sign.trim() === '+' ? ' plus ' : ' minus ');
  return result.replace(/[^\p{L}\p{N}]+/gu, ' ').trim().replace(/\s+/gu, ' ');
}
export function supportsOpenAnswer(question) {
  return typeof question?.answer === 'string' && question.answer.trim().length > 0 &&
    (question.type === 'recognition' || SHORT_ANSWERS.has(question.answer) ||
      (Array.isArray(question.acceptedAnswers) && question.acceptedAnswers.length > 0));
}
// Optimal-string-alignment distance also counts a neighboring letter swap as
// one typing error. Small limits keep this from becoming semantic matching.
function spellingDistance(left, right) {
  const rows = Array.from({ length: left.length + 1 }, (_, row) => Array.from({ length: right.length + 1 }, (_, col) => row ? col ? 0 : row : col));
  for (let row = 1; row <= left.length; row++) {
    for (let col = 1; col <= right.length; col++) {
      rows[row][col] = Math.min(rows[row - 1][col] + 1, rows[row][col - 1] + 1,
        rows[row - 1][col - 1] + Number(left[row - 1] !== right[col - 1]));
      if (row > 1 && col > 1 && left[row - 1] === right[col - 2] && left[row - 2] === right[col - 1]) {
        rows[row][col] = Math.min(rows[row][col], rows[row - 2][col - 2] + 1);
      }
    }
  }
  return rows[left.length][right.length];
}
const PROTECTED_WORDS = new Set([
  'niet', 'geen', 'zonder', 'wel', 'nooit', 'altijd', 'en', 'of',
  'adductie', 'abductie', 'excentrisch', 'concentrisch', 'isometrisch',
  'exorotatie', 'endorotatie', 'medialis', 'lateralis', 'anterior', 'posterior',
  'major', 'minor', 'maximus', 'medius', 'minimus', 'biceps', 'triceps',
  'voorste', 'middelste', 'achterste', 'boven', 'midden', 'onder'
]);
function nearAnswerDistance(response, answer) {
  const actual = response.split(' ');
  const expected = answer.split(' ');
  if (actual.length !== expected.length) return Infinity;
  const budget = answer.replace(/ /g, '').length >= 12 ? 2 : 1;
  let total = 0;
  for (let index = 0; index < expected.length; index++) {
    const target = expected[index];
    const typed = actual[index];
    if (target === typed) continue;
    // Numbers and negations must survive exactly. An already valid but
    // different anatomical term is an answer distinction, not a spelling error.
    if (/\d/u.test(target + typed) || Math.min(target.length, typed.length) < 4 ||
      (PROTECTED_WORDS.has(typed) && typed !== target) || ['niet', 'geen', 'zonder', 'nooit'].includes(target)) return Infinity;
    const tokenBudget = budget === 2 && target.length >= 10 ? 2 : 1;
    if (Math.abs(target.length - typed.length) > tokenBudget) return Infinity;
    const distance = spellingDistance(typed, target);
    if (distance > tokenBudget) return Infinity;
    total += distance;
    if (total > budget) return Infinity;
  }
  return total;
}
export function checkOpenAnswer(question, response) {
  const incorrect = { correct: false, typo: false };
  if (!supportsOpenAnswer(question) || typeof response !== 'string' || response.length > 200) return incorrect;
  const muscle = question.type === 'recognition';
  const normalized = normalizedAnswer(response, muscle);
  if (!normalized) return incorrect;
  const aliases = Array.isArray(question.acceptedAnswers) ? question.acceptedAnswers.filter(value => typeof value === 'string' && value.trim()) : [];
  const answers = [...new Set([question.answer, ...aliases, ...(muscle ? ANATOMY_ALIASES[question.answer] || [] : [])].map(answer => normalizedAnswer(answer, muscle)))];
  if (answers.includes(normalized)) return { correct: true, typo: false };
  const distance = Math.min(...answers.map(answer => nearAnswerDistance(normalized, answer)));
  if (!Number.isFinite(distance)) return incorrect;
  const alternatives = [...SHORT_ANSWERS, ...Object.keys(ANATOMY_ALIASES), ...Object.values(ANATOMY_ALIASES).flat(), ...(question.distractors || [])]
    .filter(value => typeof value === 'string').map(value => normalizedAnswer(value, muscle)).filter(value => !answers.includes(value));
  // Reject real other concepts, including misspellings that could refer to
  // another answer just as closely. For example, 'aductie' is ambiguous.
  if (alternatives.some(answer => answer === normalized || nearAnswerDistance(normalized, answer) <= distance)) return incorrect;
  return { correct: true, typo: true };
}
export function isOpenAnswerCorrect(question, response) {
  return checkOpenAnswer(question, response).correct;
}
function compatibleExercise(question, mode) {
  if (question.type === 'recognition') {
    return ['recognition', 'recognition-open', 'open-self'].includes(mode) || (mode === 'point' && POINTABLE_MUSCLES.has(question.muscleId));
  }
  return ['choice', 'binary', 'open-self'].includes(mode) || (mode === 'open' && supportsOpenAnswer(question));
}
function validExerciseStats(entry) {
  if (entry.lastExercise != null && !EXERCISE_MODES.includes(entry.lastExercise)) return false;
  return entry.exerciseStats == null || (typeof entry.exerciseStats === 'object' && !Array.isArray(entry.exerciseStats) &&
    Object.entries(entry.exerciseStats).every(([mode, stats]) => EXERCISE_MODES.includes(mode) && stats &&
      Number.isInteger(stats.attempts) && stats.attempts >= 0 && Number.isInteger(stats.correct) && stats.correct >= 0 && stats.correct <= stats.attempts &&
      typeof stats.lastCorrect === 'boolean' && Number.isInteger(stats.spacedCorrect) && stats.spacedCorrect >= 0 && stats.spacedCorrect <= stats.correct));
}
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
function validMistakeReview(review) {
  return review && Number.isInteger(review.successes) && review.successes >= 0 && review.successes <= MISTAKE_REVIEW_SUCCESSES &&
    typeof review.recalled === 'boolean' && (review.lastLesson === null || (typeof review.lastLesson === 'string' && review.lastLesson.length > 0 && review.lastLesson.length <= 100)) &&
    Number.isFinite(review.lastPracticedAt) && review.lastPracticedAt >= 0;
}
function mistakeReviewFor(entry) {
  if (!entry) return null;
  if (validMistakeReview(entry.mistakeReview)) return entry.mistakeReview;
  // Earlier versions kept error totals, but no cross-lesson recovery history.
  const recalled = Object.entries(entry.exerciseStats || {}).some(([mode, stats]) =>
    ['open', 'open-self', 'recognition-open'].includes(mode) && stats.spacedCorrect > 0);
  return entry.attempts > entry.correct && !(entry.lastCorrect && entry.interval >= 4 && (!entry.exerciseStats || recalled))
    ? { successes: 0, recalled: false, lastLesson: null, lastPracticedAt: 0 } : null;
}
export function needsMistakeReview(entry) {
  const review = mistakeReviewFor(entry);
  return Boolean(review && (review.successes < MISTAKE_REVIEW_SUCCESSES || !review.recalled));
}
export function mistakeQuestions(questions, progress, { excludeIds = [], limit = MISTAKE_REVIEW_LIMIT, availableMuscles = null } = {}) {
  const excluded = new Set(excludeIds);
  return questions.filter(q => !excluded.has(q.id) && needsMistakeReview(progress.questions[q.id]) &&
    (q.type !== 'recognition' || availableMuscles === null || availableMuscles.has(q.muscleId)))
    .sort((left, right) => mistakeReviewFor(progress.questions[left.id]).lastPracticedAt - mistakeReviewFor(progress.questions[right.id]).lastPracticedAt || left.id.localeCompare(right.id))
    .slice(0, limit);
}
export function interleaveMistakes(queue, questions, progress, options = {}) {
  if (!queue.length) return [];
  const reviews = mistakeQuestions(questions, progress, { ...options, excludeIds: queue.map(q => q.id) });
  // Retain every new question and distribute at most two extra reviews.
  return queue.flatMap((q, index) => [q, ...reviews.filter((_, slot) => index === Math.floor((slot + 1) * queue.length / (reviews.length + 1)))]);
}
export function readProgress(storage) {
  try {
    const data = JSON.parse(storage.getItem(PROGRESS_KEY) || storage.getItem('lottequiz.v1') || '{}');
    const valid = Object.fromEntries(Object.entries(data.questions || {}).filter(([, entry]) =>
      entry && Number.isInteger(entry.correct) && entry.correct >= 0 && Number.isFinite(entry.due) && Number.isInteger(entry.attempts) && entry.attempts >= entry.correct &&
      Number.isInteger(entry.interval) && entry.interval >= 0 && entry.interval <= 30 && typeof entry.lastCorrect === 'boolean' && validExerciseStats(entry)
    ).map(([id, entry]) => {
      const { mistakeReview: ignored, ...rest } = entry;
      const review = mistakeReviewFor(entry);
      return [id, review ? { ...rest, mistakeReview: review } : rest];
    }));
    return { questions: valid, sessions: Array.isArray(data.sessions) ? data.sessions.filter(s => Number.isFinite(s.at) && Number.isFinite(s.correct) && Number.isFinite(s.total)) : [] };
  } catch { return { questions: {}, sessions: [] }; }
}
export function readSession(storage, questions) {
  try {
    const value = JSON.parse(storage.getItem(SESSION_KEY) || 'null');
    if (!value || !Array.isArray(value.ids) || !value.ids.every(id => questions.has(id)) ||
      !Number.isInteger(value.index) || value.index < 0 || value.index > value.ids.length ||
      !Number.isInteger(value.answered) || value.answered < 0 || value.answered > value.ids.length ||
      !Number.isInteger(value.correct) || value.correct < 0 || value.correct > value.answered ||
      !Array.isArray(value.retryIds) || !value.retryIds.every(id => value.ids.includes(id)) ||
      typeof value.finished !== 'boolean' || (value.finished && value.index !== value.ids.length) || !['daily', 'review', ...topics.map(t => t.id)].includes(value.region)) return null;
    if (value.levelId != null && (!levelPath({ completed: [] }).some(level => value.levelId === level.id && value.region === level.topic.id && value.stage === level.stage) ||
      !Number.isInteger(value.initialCount) || value.initialCount < 1 || value.initialCount > value.ids.length ||
      !Number.isInteger(value.firstCorrect) || value.firstCorrect < 0 || value.firstCorrect > value.initialCount)) return null;
    if (['answerStreak', 'bestAnswerStreak'].some(key => value[key] != null && (!Number.isInteger(value[key]) || value[key] < 0 || value[key] > value.correct)) ||
      (value.answerStreak || 0) > (value.bestAnswerStreak || 0)) return null;
    if (value.xp != null && (!Number.isInteger(value.xp) || value.xp < 0)) return null;
    if (value.reviewLessonId != null && (typeof value.reviewLessonId !== 'string' || !value.reviewLessonId.length || value.reviewLessonId.length > 100)) return null;
    if (value.answerHistory != null && (!Array.isArray(value.answerHistory) || value.answerHistory.length > value.ids.length ||
      !value.answerHistory.every(attempt => attempt && typeof attempt.correct === 'boolean' && typeof attempt.skipped === 'boolean' &&
        typeof attempt.retry === 'boolean' && !(attempt.correct && attempt.skipped)))) return null;
    if (value.dismissedInterludes != null && (!Array.isArray(value.dismissedInterludes) || value.dismissedInterludes.length > 2 ||
      new Set(value.dismissedInterludes).size !== value.dismissedInterludes.length ||
      !value.dismissedInterludes.every(key => ['halfway', 'retry'].includes(key)))) return null;
    if (value.matched != null && (!Array.isArray(value.matched) || !value.matched.every(id => typeof id === 'string'))) return null;
    if (value.pairOrder != null && (!Array.isArray(value.pairOrder) || !value.pairOrder.every(id => typeof id === 'string'))) return null;
    if (value.exerciseModes != null && (!Array.isArray(value.exerciseModes) || value.exerciseModes.length !== value.ids.length ||
      !value.exerciseModes.every((mode, index) => EXERCISE_MODES.includes(mode) && compatibleExercise(questions.get(value.ids[index]), mode)))) return null;
    if (value.openDraft != null && typeof value.openDraft !== 'string') return null;
    if (value.openRevealed != null && typeof value.openRevealed !== 'boolean') return null;
    const question = questions.get(value.ids[value.index]);
    const mode = question && (value.exerciseModes?.[value.index] || exerciseFor(question, value.index));
    const open = ['open', 'recognition-open', 'open-self'].includes(mode);
    const responseLimit = mode === 'open-self' ? 2000 : 200;
    if (value.openDraft?.length > responseLimit) return null;
    if (question && (!Array.isArray(value.options) || value.options.length !== 4 ||
      new Set(value.options).size !== 4 || !value.options.includes(question.answer) ||
      !value.options.every(option => option === question.answer || question.distractors.includes(option)) ||
      (value.response !== null && !(typeof value.response === 'string' &&
        (value.options.includes(value.response) || (value.response.length <= responseLimit &&
          (mode === 'point' || (open && value.response.trim().length > 0)))))))) return null;
    if (question && ((!open && value.openDraft) || (value.openRevealed && mode !== 'open-self'))) return null;
    if (value.selfAssessmentCorrect != null && (mode !== 'open-self' || typeof value.selfAssessmentCorrect !== 'boolean' ||
      !value.openRevealed || typeof value.response !== 'string' || !value.response.trim())) return null;
    if (mode === 'open-self' && value.response !== null && typeof value.selfAssessmentCorrect !== 'boolean') return null;
    return value;
  } catch { return null; }
}
export function recordAnswer(progress, id, correct, now = Date.now(), exercise = null, { lessonId = null, retry = false } = {}) {
  const previous = progress.questions[id] || { correct: 0, attempts: 0, interval: 0 };
  // Practising early is useful, but must not manufacture spaced mastery.
  const early = correct && previous.lastCorrect && previous.due > now;
  const interval = correct ? early ? previous.interval : Math.min(30, previous.interval ? previous.interval * 2 : 1) : 0;
  const mode = EXERCISE_MODES.includes(exercise) ? exercise : null;
  const priorReview = mistakeReviewFor(previous);
  const laterSuccess = correct && priorReview && lessonId && !retry && lessonId !== priorReview.lastLesson;
  const mistakeReview = !correct ? { successes: 0, recalled: false, lastLesson: lessonId, lastPracticedAt: now }
    : priorReview ? {
      ...priorReview, lastPracticedAt: now,
      successes: Math.min(MISTAKE_REVIEW_SUCCESSES, priorReview.successes + Number(Boolean(laterSuccess))),
      recalled: priorReview.recalled || Boolean(laterSuccess && ['open', 'open-self', 'recognition-open'].includes(mode)),
      lastLesson: laterSuccess ? lessonId : priorReview.lastLesson
    } : null;
  const priorStats = previous.exerciseStats?.[mode] || { attempts: 0, correct: 0, spacedCorrect: 0 };
  const exerciseProgress = mode ? {
    lastExercise: mode,
    exerciseStats: { ...previous.exerciseStats, [mode]: {
      attempts: priorStats.attempts + 1, correct: priorStats.correct + Number(correct),
      lastCorrect: correct, spacedCorrect: priorStats.spacedCorrect + Number(correct && !early)
    } }
  } : previous.exerciseStats ? { exerciseStats: previous.exerciseStats, lastExercise: previous.lastExercise } : {};
  return { ...progress, questions: { ...progress.questions, [id]: {
    ...exerciseProgress,
    ...(mistakeReview ? { mistakeReview } : {}),
    correct: previous.correct + Number(correct), attempts: previous.attempts + 1,
    interval, due: early ? previous.due : now + (correct ? interval * DAY : 10 * 60000), lastCorrect: correct
  } } };
}
export function lessonQueue(questions, progress, { region = 'daily', limit = LESSON_SIZE, now = Date.now(), availableMuscles = null } = {}) {
  const pool = questions.filter(q => (region === 'daily' || region === 'review' || q.region === region) &&
    (q.type !== 'recognition' || availableMuscles?.has(q.muscleId)));
  const due = shuffled(pool.filter(q => progress.questions[q.id] && progress.questions[q.id].due <= now));
  const fresh = shuffled(pool.filter(q => !progress.questions[q.id]));
  const future = shuffled(pool.filter(q => progress.questions[q.id]?.due > now));
  if (region === 'review') {
    const mistakes = mistakeQuestions(pool, progress, { limit, availableMuscles });
    return [...mistakes, ...due.filter(q => !mistakes.some(mistake => mistake.id === q.id))].slice(0, limit);
  }
  return [...due, ...fresh, ...future].slice(0, limit);
}
export function masteryFor(questions, progress) {
  if (!questions.length) return 0;
  return Math.round(100 * questions.filter(question => {
    const entry = progress.questions[question.id];
    if (!entry || needsMistakeReview(entry) || entry.interval < 4 || !entry.lastCorrect) return false;
    // Legacy records retain their mastery. New adaptive practice must also
    // demonstrate recall on a later, spaced repetition, not just recognition.
    if (!entry.exerciseStats || !Object.keys(entry.exerciseStats).length) return true;
    const recallModes = question.type === 'recognition' ? ['recognition-open'] : ['open', 'open-self'];
    return recallModes.some(mode => entry.exerciseStats[mode]?.spacedCorrect >= 1);
  }).length / questions.length);
}

export const GAME_KEY = 'motionstudy.game.v2';
export const DAILY_GOAL = 30;
export function dayKey(now = Date.now()) {
  const date = new Date(now);
  return [date.getFullYear(), String(date.getMonth() + 1).padStart(2, '0'), String(date.getDate()).padStart(2, '0')].join('-');
}
export function readGame(storage) {
  try {
    const saved = storage.getItem(GAME_KEY);
    const value = JSON.parse(saved || storage.getItem('motionstudy.game.v1') || '{}');
    const days = Object.fromEntries(Object.entries(value.days || {}).filter(([key, xp]) => /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isInteger(xp) && xp >= 0));
    const path = levelPath({ completed: [] });
    const completed = saved ? path.filter(level => Array.isArray(value.completed) && value.completed.includes(level.id)).map(level => level.id) : migrateCompletedLevels(value.completed);
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
export function levelPath(game, questions = curriculum.questions) {
  const levels = topics.flatMap(topic => {
    const count = chapterPools(questions, topic.id).reduce((total, pool) => total + Math.ceil(pool.length / LESSON_SIZE), 0);
    return Array.from({ length: count }, (_, stage) => ({ id: topic.id + ':' + stage, topic, stage, count, label: 'Les ' + (stage + 1) }));
  });
  const first = levels.findIndex(level => !game.completed.includes(level.id));
  return levels.map((level, index) => ({ ...level, done: game.completed.includes(level.id), locked: first !== -1 && index > first }));
}
// Fill a topic's final lesson with earlier material, so it still has seven
// questions. Very small review pools repeat due questions rather than new facts.
export function fillLesson(questions, pool = questions) {
  if (!questions.length) return [];
  const initial = questions.slice(0, LESSON_SIZE);
  const extras = pool.filter(q => !initial.some(first => first.id === q.id));
  const filled = [...initial, ...extras].slice(0, LESSON_SIZE);
  return [...filled, ...Array.from({ length: LESSON_SIZE - filled.length }, (_, index) => filled[index % filled.length])];
}
export function levelQuestions(questions, region, stage) {
  if (!Number.isInteger(stage) || stage < 0) return [];
  let remaining = stage;
  for (const pool of chapterPools(questions, region)) {
    const count = Math.ceil(pool.length / LESSON_SIZE);
    if (remaining < count) {
      const reviewPool = pool[0]?.source?.kind === 'course-detail' ? [...pool, ...questions.filter(q => q.region === region && q.source?.kind !== 'course-detail')] : pool;
      return fillLesson(pool.slice(remaining * LESSON_SIZE, (remaining + 1) * LESSON_SIZE), reviewPool);
    }
    remaining -= count;
  }
  return [];
}
// Start additions after the original chapter's final lesson. Previously completed
// lessons retain their questions, including their existing review fillers.
function chapterPools(questions, region) {
  const pool = questions.filter(q => q.region === region);
  return [pool.filter(q => !['supplement', 'course-detail'].includes(q.source?.kind)), pool.filter(q => q.source?.kind === 'supplement'), pool.filter(q => q.source?.kind === 'course-detail')];
}
function migrateCompletedLevels(completed) {
  if (!Array.isArray(completed)) return [];
  const covered = new Set(topics.flatMap(topic => {
    const pool = curriculum.questions.filter(q => q.region === topic.id && !['supplement', 'course-detail'].includes(q.source?.kind));
    return [0, 1, 2].flatMap(stage => completed.includes(topic.id + ':' + stage)
      ? pool.slice(Math.floor(stage * pool.length / 3), Math.floor((stage + 1) * pool.length / 3)).map(q => q.id) : []);
  }));
  return levelPath({ completed: [] }).filter(level => {
    const originals = levelQuestions(curriculum.questions, level.topic.id, level.stage);
    return originals.length > 0 && originals.every(q => covered.has(q.id));
  }).map(level => level.id);
}
export function completeLevel(game, id, correct, total) {
  if (!id || !Number.isInteger(correct) || !Number.isInteger(total) || total < 1 || correct < total || !levelPath(game).some(level => level.id === id && !level.locked)) return game;
  return { ...game, completed: [...new Set([...game.completed, id])] };
}
export function recordLessonAnswer(session, correct, retryMode) {
  const answerStreak = correct ? (session.answerStreak || 0) + 1 : 0;
  const id = session.ids[session.index];
  return {
    ...session,
    answerHistory: [...(session.answerHistory || []), { correct, skipped: false, retry: session.index >= session.initialCount }],
    correct: session.correct + Number(correct), answered: session.answered + 1,
    firstCorrect: (session.firstCorrect || 0) + Number(correct && session.index < session.initialCount),
    answerStreak, bestAnswerStreak: Math.max(session.bestAnswerStreak || 0, answerStreak),
    ...(!correct ? {
      ids: [...session.ids, id], exerciseModes: [...session.exerciseModes, retryMode],
      retryIds: [...new Set([...session.retryIds, id])]
    } : {})
  };
}
export function exerciseFor(question, index) {
  if (question.type === 'recognition') {
    if (index % 2 && POINTABLE_MUSCLES.has(question.muscleId)) return 'point';
    return 'recognition';
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
  const ordered = [...queue];
  const place = (slot, predicate, excluded = []) => {
    const from = ordered.findIndex((question, index) => !excluded.includes(index) && predicate(question));
    if (slot < ordered.length && from !== -1) [ordered[slot], ordered[from]] = [ordered[from], ordered[slot]];
    return from !== -1;
  };
  const pointing = place(1, question => exerciseFor(question, 1) === 'point');
  const highlighted = place(0, question => question.type === 'recognition', pointing ? [1] : []);
  place(2, supportsOpenAnswer, [...(pointing ? [1] : []), ...(highlighted ? [0] : [])]);
  return ordered;
}

export const DRAFTS_KEY = 'motionstudy.drafts.v2';
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
