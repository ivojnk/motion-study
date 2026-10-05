import './style.css';
import './study-ui.css';
import curriculum from './data/curriculum.json';
import { LESSON_SIZE, fillLesson, interleaveMistakes, needsMistakeReview, recordLessonAnswer, topics, readProgress, readSession, recordAnswer, lessonQueue, optionsFor, masteryFor, PROGRESS_KEY, SESSION_KEY, GAME_KEY, DAILY_GOAL, readGame, awardXP, gameStats, levelPath, levelQuestions, completeLevel, exerciseFor, matchingPairs, shuffled, binaryResponses, varyLesson, DRAFTS_KEY, draftKey, readDrafts, isOpenAnswerCorrect, checkOpenAnswer, isModelQuestion, usesModel, modelAvailable, modelMuscleIds, modelChoiceCards } from './learning.js';
import { lessonMomentum, lessonInterlude } from './lesson-motivation.js';
import { exerciseForProgress, availableExercises } from './exercise-progression.js';
import { lessonGroups } from './lesson-groups.js';
import { withLessonModels } from './lesson-models.js';
import { choicePalette } from './muscle-choice.js';
import { setupViewerFullscreen } from './viewer-fullscreen.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const modelChoiceLabel = index => 'Spier ' + (index + 1) + ' · ' + choicePalette[index].name;
const iconNames = { school: 'school', stretch: 'stretching', barbell: 'barbell', target: 'target-arrow', arrows: 'arrows-move', growth: 'chart-bar' };
const icon = name => '<img class="icon" src="' + import.meta.env.BASE_URL + 'icons/' + (iconNames[name] || name) + '.svg" alt="" />';
let storage;
try { storage = window.motionStudyStorage || window.localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Storage blocked'); } }; }
let progress = readProgress(storage);
let game = readGame(storage);
let pairSelection = null;
let pairMessage = "";
let pendingPointSelection = null;
let session = null;
let viewer = null;
let viewerFullscreen = null;
let route = '';
let storageAvailable = true;
const byId = new Map(curriculum.questions.map(q => [q.id, q]));
let drafts = readDrafts(storage, byId);
session = readSession(storage, byId);
if (session) session = { ...session, exerciseModes: session.exerciseModes || session.ids.map((id, index) => exerciseFor(byId.get(id), index)), levelId: session.levelId || null, matched: session.matched || [], initialCount: session.initialCount || session.ids.length, firstCorrect: session.firstCorrect || 0, answerStreak: session.answerStreak || 0, bestAnswerStreak: session.bestAnswerStreak || 0, xp: session.xp || 0 };
// Compare the last saved lesson, even when switching to another lesson.
let savedLesson = session ? { key: draftKey(session), draft: JSON.stringify(drafts[draftKey(session)] || null) } : null;
let reloadingProgress = false;
function storageFailed() {
  storageAvailable = false;
  const warning = $('#storage-warning');
  if (warning) warning.hidden = false;
}
function canSaveLesson() {
  if (reloadingProgress) return false;
  if (!storageAvailable || !savedLesson) return true;
  try {
    const rawDrafts = storage.getItem(DRAFTS_KEY);
    const stored = readDrafts({ getItem: () => rawDrafts }, byId);
    if (JSON.stringify(stored[savedLesson.key] || null) === savedLesson.draft) return true;
    // Another tab updated/completed this lesson. Reload before any stale write or reward.
    reloadingProgress = true;
    const main = $('#main');
    if (main) main.hidden = true;
    location.reload();
    return false;
  } catch { storageFailed(); return true; }
}
function refreshProgress() {
  if (!storageAvailable) return;
  try {
    if (storage.getItem(PROGRESS_KEY)) progress = readProgress(storage);
    if (storage.getItem(GAME_KEY)) game = readGame(storage);
  } catch { storageFailed(); }
}
function withProgressLock(action) {
  return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('motionstudy-progress' + (window.motionStudyAccount ? ':' + window.motionStudyAccount.id : ''), action) : action();
}
function save(rewards = false) {
  if (!canSaveLesson()) return false;
  try {
    if (rewards || !storageAvailable) {
      storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
      storage.setItem(GAME_KEY, JSON.stringify(game));
    } else refreshProgress();
    drafts = storageAvailable ? readDrafts(storage, byId) : drafts;
    if (session) {
      const key = draftKey(session);
      if (!session.finished && session.ids.length) drafts = { ...drafts, [key]: session };
      else drafts = Object.fromEntries(Object.entries(drafts).filter(([id]) => id !== key));
    }
    storage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
    storage.setItem(SESSION_KEY, JSON.stringify(session));
    savedLesson = session ? { key: draftKey(session), draft: JSON.stringify(drafts[draftKey(session)] || null) } : null;
    storageAvailable = true;
    const warning = $('#storage-warning');
    if (warning) warning.hidden = true;
    return true;
  } catch { storageFailed(); return false; }
}
// Use the same account-scoped lock and persistence path as lesson answers.
window.motionStudyPrepareUpdate = () => withProgressLock(() => save());
function focusLessonContent() {
  if ($('#interlude-title')) { $('#interlude-title').focus(); return; }
  if ($('#result-title')) { window.scrollTo(0, 0); $('#result-title').focus({ preventScroll: true }); }
  else if ($('#question-title')) {
    window.scrollTo(0, 0); $('#question-title').focus({ preventScroll: true });
  }
}
function dueCount() {
  return curriculum.questions.filter(q => needsMistakeReview(progress.questions[q.id]) || progress.questions[q.id]?.due <= Date.now()).length;
}
function setLessonFocus(active) {
  document.body?.classList.toggle('lesson-focus', active);
  $('#intro').hidden = active;
}
function lessonRetriesMarkup() {
  const retries = session.ids.length - (session.initialCount || session.ids.length);
  const label = '+' + retries + ' herhaling' + (retries === 1 ? '' : 'en');
  return retries > 0 ? '<span class="lesson-retries" role="status" aria-label="' + label + '" title="' + label + '">' + icon('refresh') + '<strong>+' + retries + '</strong></span>' : '';
}
function lessonProgressMarkup() {
  const total = session.initialCount || session.ids.length;
  const completed = Math.min(total, session.correct);
  return '<div class="lesson-bar"><a href="#leren" class="lesson-close" aria-label="Les sluiten">' + icon('x') + '</a><progress class="lesson-progress" max="' + total + '" value="' + completed + '" aria-label="Lesvoortgang" aria-valuetext="' + completed + ' van ' + total + ' vragen goed beantwoord"></progress><div class="lesson-bar-stats">' + lessonRetriesMarkup() + '<span class="answer-streak" role="status" aria-label="' + (session.answerStreak || 0) + ' antwoorden goed achter elkaar">' + icon('check') + '<strong>' + (session.answerStreak || 0) + ' streak</strong></span></div></div>';
}
function intro(title, description = '') {
  setLessonFocus(false);
  $('#intro').innerHTML = '<h1>' + title + '</h1>' + (description ? '<p>' + description + '</p>' : '');
}
function gameMarkup() {
  const stats = gameStats(game);
  return '<div class="game-bar" aria-label="Je leerbeloningen"><span>' + icon('sparkles') + '<strong>' + stats.xp + ' XP</strong></span><span>' + icon('refresh') + '<strong>' + stats.streak + (stats.streak === 1 ? ' dag streak' : ' dagen streak') + '</strong></span><span>' + game.completed.length + '/' + levelPath(game).length + ' lessen</span></div><div class="goal-card"><div><strong>Dagdoel</strong><span>' + Math.min(stats.today, DAILY_GOAL) + '/' + DAILY_GOAL + ' XP' + (stats.today >= DAILY_GOAL ? ' · gehaald!' : '') + '</span></div><progress max="' + DAILY_GOAL + '" value="' + Math.min(stats.today, DAILY_GOAL) + '" aria-label="Dagdoel in XP"></progress></div>';
}
function renderHome() {
  refreshProgress();
  if (storageAvailable) drafts = readDrafts(storage, byId);
  restoreAtlasLayout();
  intro('Leerpad');
  const levels = levelPath(game);
  const pending = [session, ...levels.filter(level => !level.locked).map(level => drafts[level.id]), ...Object.values(drafts)]
    .find(draft => draft && !draft.finished && draft.ids.length &&
      (!draft.levelId || levels.some(level => level.id === draft.levelId && !level.locked)));
  const current = pending ? levels.find(level => level.id === pending.levelId) : levels.find(level => !level.done);
  const topic = current?.topic || topics.find(topic => topic.id === pending?.region);
  const title = topic?.title || (pending?.region === 'review' ? 'Herhalen' : pending ? 'Gemengde les' : 'Alle hoofdstukken afgerond');
  const lessonLabel = topic ? 'Hoofdstuk ' + (topics.findIndex(item => item.id === topic.id) + 1) + ' · ' + (pending ? 'lopende les' : 'volgende les') : pending ? 'Lopende les' : 'Leerpad afgerond';
  const questionCount = pending?.initialCount || (current ? interleaveMistakes(withLessonModels(levelQuestions(curriculum.questions, current.topic.id, current.stage), curriculum.questions), curriculum.questions, progress).length : LESSON_SIZE);
  const description = (current ? current.label + ' van ' + current.count + ' · ' : '') + (current || pending ? questionCount + ' vragen' : 'Gemengde les');
  const action = current ? 'data-level="' + current.id + '"' : 'data-start="' + (pending?.region || 'daily') + '"';
  const stats = gameStats(game);
  const homeStats = $('#home-stats');
  if (homeStats) {
    homeStats.hidden = false;
    homeStats.innerHTML = '<span class="home-metric metric-streak" title="Dagelijkse streak">' + icon('flame') + '<strong>' + stats.streak + '</strong><span class="visually-hidden"> ' + (stats.streak === 1 ? 'dag' : 'dagen') + ' streak</span></span>' +
      '<span class="home-metric metric-points" title="Verzamelde punten">' + icon('sparkles') + '<strong>' + stats.xp + '</strong><span class="visually-hidden"> verzamelde punten</span></span>';
  }
  const activeTopic = topic || levels.find(level => !level.done)?.topic || topics.at(-1);
  const activeChapter = topics.findIndex(item => item.id === activeTopic.id);
  const chapters = topics.map((topic, chapter) => {
    const chapterLevels = levels.filter(level => level.topic.id === topic.id);
    const completed = chapterLevels.filter(level => level.done).length;
    const lessons = lessonGroups(chapterLevels).map(group => {
      const state = group.done ? 'done' : group.locked ? 'locked' : 'current';
      const level = group.next;
      const resume = !group.locked && !group.done && drafts[draftKey({ region: topic.id, levelId: level.id })];
      const label = resume ? 'Verder' : 'Start';
      return '<li class="path-step ' + state + ' group-' + group.type + '">' +
        '<button class="level-node" data-level="' + level.id + '" ' + (group.locked ? 'disabled' : '') +
        (!group.locked && !group.done ? ' aria-current="step"' : '') +
        ' aria-label="' + escape(topic.title + ': ' + group.label + ', groep ' + (group.index + 1) + ', ' + group.completed + ' van ' + group.lessons.length + ' lessen voltooid' + (group.done ? ', opnieuw oefenen' : group.locked ? ', vergrendeld' : ', volgende: ' + level.label)) + '">' +
        groupProgressMarkup(group) +
        (state === 'current' ? '<span class="level-callout" aria-hidden="true">' + label + '</span>' : '') +
        '<span class="level-symbol" aria-hidden="true">' + icon(group.icon) + '</span></button>' +
        '<span class="level-copy" aria-hidden="true">' + group.label + '</span>' +
        '<span class="level-caption" aria-hidden="true">' + group.completed + '/' + group.lessons.length + ' lessen</span>' + '</li>';
    }).join('');
    return '<details class="path-chapter' + (activeTopic.id === topic.id ? ' active-chapter' : '') + '" ' + (activeTopic.id === topic.id ? 'open' : '') + '>' +
      '<summary class="chapter-heading"><span class="chapter-copy"><span class="chapter-kicker">Hoofdstuk ' + (chapter + 1) + '</span><strong>' + escape(topic.title) + '</strong><small>' + escape(topic.subtitle) + '</small></span>' +
      '<span class="chapter-count" aria-label="' + completed + ' van ' + chapterLevels.length + ' lessen voltooid">' + completed + '/' + chapterLevels.length + '</span>' +
      '<span class="chapter-toggle" aria-hidden="true">' + icon('arrow-right') + '</span></summary>' +
      '<ol aria-label="Lessen in ' + escape(topic.title) + '">' + lessons + '</ol></details>';
  });
  const path = chapters.slice(activeChapter).join('') + (activeChapter ? '<details class="earlier-chapters"><summary>Eerdere hoofdstukken</summary>' + chapters.slice(0, activeChapter).join('') + '</details>' : '');
  $('#learning').innerHTML = '<div class="daily-card home-chapter-header"><span class="eyebrow">' + lessonLabel + '</span><h2>' + escape(title) + '</h2><p>' + description + '</p><button class="primary" ' + action + '>' + (pending ? 'Ga verder' : current ? 'Start les' : 'Gemengde les') + icon('arrow-right') + '</button></div><div class="study-status"><div class="learning-path">' + path + '</div></div>';
  resetAtlas();
  $('.atlas-panel').hidden = true;
}
function groupProgressMarkup(group) {
  const position = degrees => {
    const angle = degrees * Math.PI / 180;
    return (50 + 45 * Math.cos(angle)).toFixed(3) + ' ' + (50 + 45 * Math.sin(angle)).toFixed(3);
  };
  return '<svg class="level-ring" viewBox="0 0 100 100" aria-hidden="true">' + group.lessons.map((lesson, index) => {
    const start = -90 + index * 360 / group.lessons.length + 5;
    const end = -90 + (index + 1) * 360 / group.lessons.length - 5;
    return '<path class="ring-segment' + (lesson.done ? ' filled' : '') + '" d="M ' + position(start) + ' A 45 45 0 0 1 ' + position(end) + '" />';
  }).join('') + '</svg>';
}
function restoreAtlasLayout() {
  viewerFullscreen?.close({ immediate: true, restoreFocus: false });
  const workspace = $('.workspace');
  if (workspace) {
    if (route === 'atlas' && window.matchMedia('(max-width:620px)').matches) workspace.prepend($('.atlas-panel'));
    else workspace.append($('.atlas-panel'));
  }
}
function arrangeModelQuestion() {
  if (viewerFullscreen?.isOpen()) return;
  const choice = $('.muscle-choice[popover]:not([hidden])');
  choice?.hidePopover();
  restoreAtlasLayout();
  const answers = $('.question-card .answers');
  if (!$('.atlas-panel').hidden && answers) {
    answers.before($('.atlas-panel'));
  }
  choice?.showPopover();
}
function setOrientation(direction) {
  $('#orientation').textContent = { front: 'VOORZIJDE', back: 'ACHTERZIJDE', side: 'ZIJAANZICHT' }[direction] || 'VOORZIJDE';
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === direction)));
}
function resetAtlas() {
  pendingPointSelection = null;
  restoreAtlasLayout();
  $('.atlas-panel').hidden = false;
  $('#model-prompt')?.setAttribute('hidden', '');
  $('#muscle-select').disabled = false;
  $('#muscle-select').value = '';
  $('#isolate').disabled = false;
  viewer?.setIsolated($('#isolate').checked);
  viewer?.setPickingEnabled?.(true);
  viewer?.select(null);
  setOrientation('front');
  $('#selection-card').innerHTML = '<h3>Kies een spier</h3>';
}
function start(region, levelId = null) {
  pendingPointSelection = null;
  refreshProgress();
  if (levelId && !levelPath(game).some(level => level.id === levelId && !level.locked)) return;
  if (!session || session.region !== region || session.finished || session.levelId !== levelId) {
    save();
    pairSelection = null; pairMessage = '';
    const pending = drafts[levelId || region];
    const stage = levelId ? Number(levelId.split(':')[1]) : null;
    const pool = levelId ? levelQuestions(curriculum.questions, region, stage) : curriculum.questions;
    const visualPractice = ['combinaties', 'verdieping'].includes(region);
    const availableMuscles = viewer?.available || (visualPractice ? new Set(pool.flatMap(modelMuscleIds)) : undefined);
    const originals = varyLesson(levelId ? shuffled(withLessonModels(pool, curriculum.questions)) : fillLesson(lessonQueue(pool, progress, { region, availableMuscles })));
    const queue = region === 'review' ? originals : interleaveMistakes(originals, visualPractice ? pool.filter(q => q.region === region) : curriculum.questions, progress, levelId ? {} : { availableMuscles: viewer?.available || new Set() });
    session = pending ? { ...pending, exerciseModes: pending.exerciseModes || pending.ids.map((id, index) => exerciseFor(byId.get(id), index)), levelId: pending.levelId || null } : { region, levelId, stage, startedAt: Date.now(), answerHistory: [], dismissedInterludes: [], xp: 0, firstCorrect: 0, answerStreak: 0, bestAnswerStreak: 0, lessonSize: LESSON_SIZE, initialCount: queue.length, exerciseModes: queue.map((q, index) => exerciseForProgress(q, progress.questions[q.id], { index })), openDraft: '', openRevealed: false, selfAssessmentCorrect: null, prepared: false, matched: [], pairingDone: false, ids: queue.map(q => q.id), index: 0, correct: 0, answered: 0, retryIds: [], options: [], response: null, finished: false };
    if (!pending && queue.length) session.options = optionsFor(queue[0], Math.random, session.exerciseModes[0]);
    save();
  }
  const nextHash = '#les/' + region + (levelId ? '/' + session.stage : '');
  if (location.hash === nextHash) { renderLesson(); window.scrollTo(0, 0); }
  else location.hash = nextHash;
}
function needsMatching() {
  return session && !['combinaties', 'verdieping'].includes(session.region) && session.lessonSize !== LESSON_SIZE && !session.pairingDone && (session.stage === 1 || (!session.levelId && topics.some(t => t.id === session.region))) && matchingPairs(curriculum.cards, session.region).length >= 2;
}
function renderMatching() {
  const pairs = matchingPairs(curriculum.cards, session.region);
  const ids = pairs.map(pair => pair.id);
  const matched = [...new Set((session.matched || []).filter(id => ids.includes(id)))];
  const orderValid = session.pairOrder?.length === ids.length && new Set(session.pairOrder).size === ids.length && session.pairOrder.every(id => ids.includes(id));
  session = { ...session, matched, pairOrder: orderValid ? session.pairOrder : shuffled(ids) };
  save();
  setLessonFocus(true);
  $('#intro').innerHTML = '';
  const button = (pair, side) => '<button class="pair-card ' + (session.matched.includes(pair.id) ? 'matched' : pairSelection?.id === pair.id && pairSelection.side === side ? 'selected' : '') + '" data-pair="' + pair.id + '" data-side="' + side + '" aria-pressed="' + (pairSelection?.id === pair.id && pairSelection.side === side) + '" ' + (session.matched.includes(pair.id) ? 'disabled' : '') + '>' + escape(side === 'name' ? pair.name : pair.function) + (session.matched.includes(pair.id) ? ' ✓' : '') + '</button>';
  $('#learning').innerHTML = lessonProgressMarkup() + '<article class="question-card"><h2 tabindex="-1" id="question-title">Koppel spier en functie</h2><div class="matching-grid"><div>' + pairs.map(pair => button(pair, 'name')).join('') + '</div><div>' + session.pairOrder.map(id => pairs.find(pair => pair.id === id)).filter(Boolean).map(pair => button(pair, 'function')).join('') + '</div></div><p class="pair-status" role="status">' + escape(pairMessage || '') + '</p></article>';
  resetAtlas();
  $('.atlas-panel').hidden = true;
}
function choosePair(id, side) {
  if (!pairSelection || pairSelection.side === side) { pairSelection = { id, side }; pairMessage = ''; }
  else {
    const correct = pairSelection.id === id;
    pairSelection = null;
    pairMessage = correct ? 'Goed' : 'Onjuist. Kies een ander paar.';
    if (correct) session = { ...session, matched: [...session.matched, id] };
    if (session.matched.length === matchingPairs(curriculum.cards, session.region).length) {
      session = { ...session, pairingDone: true }; pairMessage = ''; save(); renderLesson(); focusLessonContent(); return;
    }
  }
  save(); renderMatching();
  const sideToFocus = pairSelection?.side === 'name' ? 'function' : 'name';
  document.querySelector('[data-side="' + sideToFocus + '"]:not(:disabled)')?.focus();
}
function currentExercise(question, index = session.index) {
  return session.exerciseModes?.[index] || exerciseForProgress(question, progress.questions[question.id], { index });
}
function isOpenExercise(mode) {
  return ['open', 'recognition-open', 'open-self'].includes(mode);
}
function openAnswerMarkup(mode, response, blocked, question = null) {
  const revealed = mode === 'open-self' && session.openRevealed;
  return '<div class="answers"><form id="open-answer-form" class="open-answer-form"><label class="open-answer-label visually-hidden" for="open-answer">' + (mode === 'recognition-open' ? question?.type === 'exercise-recognition' ? 'Welke oefening past hierbij? Typ de naam.' : 'Welke spier is paars? Typ de naam.' : 'Schrijf je antwoord') + '</label>' + (mode === 'open-self' ? '<textarea id="open-answer" class="open-answer-input" rows="4" maxlength="2000" autocomplete="off" aria-describedby="open-answer-help" ' + (response || revealed || blocked ? 'disabled' : '') + '>' + escape(session.openDraft || response || '') + '</textarea>' : '<input id="open-answer" class="open-answer-input" type="text" maxlength="200" autocomplete="off" spellcheck="false" aria-describedby="open-answer-help" value="' + escape(session.openDraft || response || '') + '" ' + (response || revealed || blocked ? 'disabled' : '') + '>') + '<p id="open-answer-help" class="open-answer-help visually-hidden">' + (mode === 'open-self' ? 'Leg het in je eigen woorden uit. Daarna vergelijk je met het voorbeeldantwoord en beoordeel je jezelf.' : 'Hoofdletters en leestekens maken niet uit. Kleine typefouten zijn oké. Controleer met Enter of de knop hieronder.') + '</p>' + '</form></div>';
}
function openAnswerActionsMarkup(mode, blocked) {
  const revealed = mode === 'open-self' && session.openRevealed;
  return '<div class="lesson-dock">' + (revealed ? '<div class="feedback lesson-feedback" role="status"><strong>Voorbeeldantwoord</strong><p>' + escape(byId.get(session.ids[session.index]).answer) + '</p></div><div class="self-assessment-controls"><button class="primary" id="self-assess-correct">Dit had ik goed ' + icon('check') + '</button><button class="text-button" id="self-assess-retry">Nog oefenen</button></div>' : '<button id="check-open-answer" type="submit" form="open-answer-form" class="primary" ' + (blocked || !session.openDraft?.trim() ? 'disabled' : '') + '>' + (mode === 'open-self' ? 'Vergelijk antwoord' : 'Controleer antwoord') + icon('check') + '</button>') + '</div>';
}
function updateOpenDraft(value) {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || session.openRevealed) return;
  const q = byId.get(session.ids[session.index]);
  if (!isOpenExercise(currentExercise(q))) return;
  session = { ...session, openDraft: value.slice(0, currentExercise(q) === 'open-self' ? 2000 : 200) };
  save();
  const button = $('#check-open-answer');
  if (button) button.disabled = !session.openDraft.trim() || (usesModel(q) && !modelAvailable(q, viewer?.available, session.options, currentExercise(q)));
}
function submitOpenAnswer() {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || session.openRevealed) return;
  const q = byId.get(session.ids[session.index]);
  const mode = currentExercise(q);
  if (!isOpenExercise(mode) || !session.openDraft?.trim() || (usesModel(q) && !modelAvailable(q, viewer?.available, session.options, currentExercise(q)))) return;
  if (mode === 'open-self') {
    session = { ...session, openRevealed: true };
    save(); renderLesson(); $('#self-assess-correct')?.focus({ preventScroll: true });
  } else answer(null, session.openDraft.trim());
}
function selfAssessOpenAnswer(correct) {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || !session.openRevealed) return;
  const q = byId.get(session.ids[session.index]);
  if (currentExercise(q) === 'open-self') answer(null, session.openDraft.trim(), correct);
}
function activeInterlude() { return session?.lessonSize === LESSON_SIZE ? null : lessonInterlude(session); }
function lessonHud() {
  if (session.lessonSize === LESSON_SIZE) return lessonProgressMarkup();
  const initialCount = session.initialCount || session.ids.length;
  const total = initialCount;
  const completed = Math.min(total, session.correct);
  const momentum = lessonMomentum(session);
  return '<div class="lesson-hud"><div class="lesson-top"><a href="#leren">' + icon('arrow-left') + ' Leerpad</a><div class="lesson-status">' + lessonRetriesMarkup() + '<span class="lesson-run">' + icon('growth') + momentum.run + ' op rij</span><span class="lesson-xp">' + icon('sparkles') + (session.xp || 0) + ' XP</span></div></div><progress class="lesson-progress" max="' + total + '" value="' + completed + '" aria-label="Lesvoortgang" aria-valuetext="' + completed + ' van ' + total + ' vragen goed beantwoord"></progress></div>';
}
function renderInterlude(interlude) {
  resetAtlas();
  $('.atlas-panel').hidden = true;
  $('#intro').innerHTML = '';
  $('#learning').innerHTML = lessonHud() + '<article class="lesson-interlude"><span class="interlude-symbol">' + icon(interlude.icon) + '</span><h2 id="interlude-title" tabindex="-1">' + escape(interlude.title) + '</h2><p>' + escape(interlude.description) + '</p><button id="continue-interlude" class="primary">' + (interlude.kind === 'retry' ? 'Herhalen' : 'Verder') + icon('arrow-right') + '</button></article>';
}
function dismissInterlude() {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished) return;
  const interlude = activeInterlude();
  if (!interlude) return;
  session = { ...session, dismissedInterludes: [...(session.dismissedInterludes || []), interlude.key] };
  save(); renderLesson(); focusLessonContent();
}
function highlightedMuscleNames(question) {
  const labels = { 'Clavicular head': 'Pectoralis major · bovenste vezels', 'Abdominal part': 'Pectoralis major · onderste vezels', 'Long head': 'Triceps brachii · lange kop', 'Gluteus medius muscle': 'Gluteus medius' };
  return question.muscleIds.map(id => question.highlightPatterns?.[id]?.length
    ? question.highlightPatterns[id].map(part => labels[part] || curriculum.cards.find(card => card.id === id)?.name).join(', ')
    : curriculum.cards.find(card => card.id === id)?.name).join(', ');
}
function compactMuscleFeedback(question, muscles) {
  const aliases = {
    pectoralis: ['Bovenste borst (pars clavicularis)', 'Onderste borst (pars abdominalis)'],
    'delt-front': ['Voorste deltoideus'], 'delt-mid': ['Middelste deltoideus'], 'delt-back': ['Achterste deltoideus', 'achterste delt'],
    lats: ['Latissimus'], 'traps-upper': ['Bovenste trapezius'], 'traps-mid': ['Middelste trapezius'], 'traps-lower': ['Onderste trapezius'],
    triceps: ['Lange tricepskop'], 'rectus-abd': ['Rectus'], 'oblique-ext': ['Obliques', 'Externe en interne obliques'],
    'oblique-int': ['Obliques', 'Externe en interne obliques'], transversus: ['Transversus'], erector: ['Erector'],
    'glute-max': ['Gluteus'], 'glute-med': ['Gluteus medius'], 'biceps-fem': ['Hamstrings'], semis: ['Semi-spieren', 'Hamstrings'], vasti: ['Vasti']
  };
  const ids = question.muscleIds || question.modelContext?.muscleIds || [];
  const namesFor = id => [curriculum.cards.find(card => card.id === id)?.name, ...(aliases[id] || [])].filter(Boolean).map(name => name.toLocaleLowerCase('nl'));
  const knownNames = [...new Set([...ids.flatMap(namesFor), ...(muscles ? [muscles.toLocaleLowerCase('nl')] : [])])].sort((a, b) => b.length - a.length);
  const withoutNames = text => knownNames.reduce((remaining, name) => remaining.replaceAll(name, ''), text.toLocaleLowerCase('nl')).replace(/\ben\b|[\s,;&/]+/g, '');
  let labels = muscles;
  const compact = text => {
    if (!muscles || !text?.includes(': ')) return text;
    const separator = text.indexOf(': ');
    const heading = text.slice(0, separator);
    const role = heading.match(/(?:,?\s+)met (.+) als (stabilisator|synergisten)$/i);
    const subject = role ? heading.slice(0, role.index) + ', ' + role[1] : heading;
    if (withoutNames(subject) === '') {
      if (role) {
        for (const id of ids.filter(id => namesFor(id).some(name => role[1].toLocaleLowerCase('nl').includes(name)))) {
          const name = curriculum.cards.find(card => card.id === id)?.name;
          const label = name + ' (' + (role[2] === 'synergisten' ? 'synergist' : 'stabilisator') + ')';
          if (!labels.includes(label)) labels = labels.replace(name, label);
        }
      }
      return text.slice(separator + 2);
    }
    return text;
  };
  const answer = compact(question.answer);
  let explanation = compact(question.explanation);
  if (explanation === answer) explanation = null;
  const rowMovements = explanation?.match(/^Middelste trapezius en rhomboideus via (.+), achterste delt via (.+)$/);
  if (muscles && rowMovements && ids.length === 3 && ['traps-mid', 'rhomboids', 'delt-back'].every(id => ids.includes(id))) {
    labels = ids.map(id => curriculum.cards.find(card => card.id === id).name + ' (' + rowMovements[id === 'delt-back' ? 2 : 1] + ')').join(', ');
    explanation = null;
  }
  // When the answer itself already identifies every highlighted muscle, one list is enough.
  if (muscles && ids.length && ids.every(id => namesFor(id).some(name => question.answer.toLocaleLowerCase('nl').includes(name))) && withoutNames(question.answer) === '') labels = null;
  return { modelMuscles: labels, answer, explanation };
}
function feedbackMarkup(q, isCorrect, answerCheck) {
  const momentum = lessonMomentum(session);
  const title = isCorrect ? answerCheck?.typo ? 'Goed! Kleine typefout.' : momentum.run >= 3 ? momentum.run + ' op rij' : 'Goed' : 'Onjuist';
  const muscles = ['exercise-recognition', 'model-fact'].includes(q.type) ? highlightedMuscleNames(q) : q.modelContext ? q.modelContext.muscleIds.map(id => curriculum.cards.find(card => card.id === id)?.name).join(', ') : null;
  const { modelMuscles, answer: displayAnswer, explanation } = compactMuscleFeedback(q, muscles);
  return '<div class="lesson-dock ' + (isCorrect ? 'success' : 'retry') + '"><div class="feedback ' + (isCorrect ? 'success' : 'retry') + ' lesson-feedback" role="status" aria-live="polite"><div class="feedback-heading"><span class="feedback-symbol" aria-hidden="true">' + (isCorrect ? icon('check') : icon('refresh')) + '</span><strong>' + title + '</strong>' + (isCorrect ? '<span class="feedback-reward">+5 XP</span>' : '') + '</div><p>' + (isCorrect ? escape(displayAnswer) : '<strong>Het juiste antwoord:</strong> ' + escape(displayAnswer)) + '</p>' + (modelMuscles ? '<p><strong>Gemarkeerde spieren:</strong> ' + escape(modelMuscles) + '</p>' : '') + (explanation ? '<p>' + escape(explanation) + '</p>' : '') + (q.source.kind === 'supplement' ? '<p>Aanvullend coachingvoorbeeld</p>' : '') + '</div><div class="lesson-actions"><button class="primary next-button" id="next-question">' + (session.index + 1 >= session.ids.length ? 'Bekijk je resultaat' : 'Verder') + icon('arrow-right') + '</button></div></div>';
}
function renderLesson({ preserveCamera = false } = {}) {
  restoreAtlasLayout();
  const [, region = 'daily', stage] = route.split('/');
  const levelId = stage !== undefined ? region + ':' + stage : null;
  if (!session || session.region !== region || session.levelId !== levelId) { start(region, levelId); return; }
  if (!session.ids.length) {
    intro('Geen herhalingen');
    $('#learning').innerHTML = '<div class="empty-card"><button class="primary" data-start="daily">Gemengde les</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';
    resetAtlas(); $('.atlas-panel').hidden = true; return;
  }
  if (session.index >= session.ids.length) { finish(); return; }
  if (!session.prepared) { session = { ...session, prepared: true }; save(); }
  if (needsMatching()) { renderMatching(); return; }
  const interlude = !session.response && activeInterlude();
  if (interlude) { renderInterlude(interlude); return; }
  const q = byId.get(session.ids[session.index]);
  setLessonFocus(true);
  $('#intro').innerHTML = '';
  const mode = currentExercise(q);
  if (mode !== 'point' || pendingPointSelection?.questionId !== q.id || pendingPointSelection?.index !== session.index || session.response) pendingPointSelection = null;
  const response = session.response;
  const answerCheck = response && ['open', 'recognition-open'].includes(mode) ? checkOpenAnswer(q, response) : null;
  const isCorrect = mode === 'open-self' ? session.selfAssessmentCorrect === true : answerCheck ? answerCheck.correct : response === q.answer;
  const recognitionBlocked = !modelAvailable(q, viewer?.available, session.options, currentExercise(q));
  const combination = ['exercise-recognition', 'model-fact'].includes(q.type);
  const modelContext = q.modelContext;
  const modelChoices = mode === 'model-choice' ? modelChoiceCards(session.options) : null;
  viewer?.setPickingEnabled?.(!combination && !modelContext && mode !== 'model-choice');
  $('#learning').innerHTML = lessonHud() +
    '<article class="question-card" data-exercise="' + mode + '"' + (usesModel(q) ? ' data-model-question' : '') + '><h2 tabindex="-1" id="question-title">' + escape(mode === 'model-choice' ? 'Welke gemarkeerde spier is ' + q.answer + '?' : mode === 'point' ? 'Wijs ' + q.answer + ' aan.' : mode === 'recognition-open' && !combination ? 'Welke spier is paars gemarkeerd?' : modelContext?.prompt || q.prompt) + '</h2>' +
    (recognitionBlocked ? '<p role="status">' + (viewer ? 'Niet alle spieren zijn beschikbaar in het 3D-model.' : '3D-model laden…') + '</p>' : '') +
    (mode === 'binary' ? '<div class="statement"><p>' + escape(session.options[0]) + '</p></div>' : '') + (isOpenExercise(mode) ? openAnswerMarkup(mode, response, recognitionBlocked, q) : '<div class="answers">' + (mode === 'binary' ? binaryResponses(q, session.options) : session.options).map((option, i) => '<button data-key="' + (i + 1) + '" data-answer="' + session.options.indexOf(option) + '" class="answer ' + (mode === 'model-choice' ? 'model-choice-answer choice-color-' + i + ' ' : '') + (response ? option === q.answer ? 'correct' : option === response ? 'incorrect' : '' : (mode === 'point' ? pendingPointSelection : null)?.response === option ? 'selected' : '') + '" ' + (!response && mode === 'point' ? 'aria-pressed="' + ((mode === 'point' ? pendingPointSelection : null)?.response === option) + '" ' : '') + (response || recognitionBlocked ? 'disabled' : '') + '><span class="answer-key">' + (i + 1) + '</span><span>' + (mode === 'binary' ? (i === 0 ? 'Klopt' : 'Klopt niet') : mode === 'model-choice' ? '<span class="choice-swatch" aria-hidden="true">' + choicePalette[i].symbol + '</span>' + escape(modelChoiceLabel(i)) : mode === 'point' && !response ? 'Bekijk spier ' + (i + 1) : escape(option)) + '</span>' + (response && option === q.answer ? icon('check') : '') + '</button>').join('') + '</div>') +
    (mode === 'point' && !response ? '<div class="point-confirmation lesson-dock"><p id="point-selection-status" class="visually-hidden" role="status" aria-live="polite">' + (pendingPointSelection ? 'Keuze gemarkeerd. Je kunt je keuze nog wijzigen.' : 'Kies een spier in het model of met een antwoordknop.') + '</p><button id="confirm-answer" class="primary" ' + (!pendingPointSelection || recognitionBlocked ? 'disabled' : '') + '>Bevestig antwoord ' + icon('check') + '</button></div>' : '') +
    (response ? feedbackMarkup(q, isCorrect, answerCheck) : isOpenExercise(mode) ? openAnswerActionsMarkup(mode, recognitionBlocked) : '') +
    '</article>';
  const card = curriculum.cards.find(c => c.id === q.muscleId);
  $('#muscle-select').disabled = !response;
  $('#isolate').disabled = false;
  if (mode === 'model-choice') {
    if (modelChoices) viewer?.showModelChoices?.(modelChoices.map(card => card.id), card?.view || 'front', preserveCamera);
    if (!preserveCamera) setOrientation(card?.view || 'front');
    $('#muscle-select').disabled = true;
    $('#selection-card').innerHTML = response ? '<h3>' + escape(modelChoiceLabel(session.options.indexOf(q.answer))) + '</h3><p>' + escape(q.answer) + '</p>' : '';
  } else if (combination) {
    if (preserveCamera) viewer?.highlight(q.muscleIds, null, q.highlightPatterns);
    else {
      viewer?.select(q.muscleIds, q.view, true, true, q.highlightPatterns);
      setOrientation(q.view);
    }
    $('#muscle-select').disabled = true;
    $('#selection-card').innerHTML = response ? '<h3>Gemarkeerde spieren</h3><p>' + escape(highlightedMuscleNames(q)) + '</p>' : '';
  } else if (modelContext) {
    if (preserveCamera) viewer?.highlight(modelContext.muscleIds);
    else {
      viewer?.select(modelContext.muscleIds, modelContext.view, false);
      setOrientation(modelContext.view);
    }
    $('#muscle-select').disabled = true;
    $('#selection-card').innerHTML = response ? '<h3>Gemarkeerde spieren</h3><p>' + escape(modelContext.muscleIds.map(id => curriculum.cards.find(card => card.id === id)?.name).join(', ')) + '</p>' : '';
  } else if (card) {
    if (mode === 'point' && pendingPointSelection && !response) viewer?.highlight(pendingPointSelection.muscleId, pendingPointSelection.anatomyName);
    else if (preserveCamera) viewer?.highlight(card.id);
    else viewer?.select(card.id, card.view, q.type === 'recognition' && mode !== 'point', mode !== 'point' || Boolean(response));
    if (!preserveCamera) setOrientation(card.view || 'front');
    $('#selection-card').innerHTML = response ? cardMarkup(card) : '';
  } else { resetAtlas(); $('#muscle-select').disabled = !response; }
  const modelPrompt = $('#model-prompt');
  modelPrompt.hidden = true;
  modelPrompt.textContent = '';
  $('.atlas-panel').hidden = !usesModel(q);
  arrangeModelQuestion();
}

function updatePointSelection(response, muscleId, anatomyName = null) {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || needsMatching()) return;
  const q = byId.get(session.ids[session.index]);
  if (currentExercise(q) !== 'point' || !viewer?.available.has(q.muscleId) || !response) return;
  pendingPointSelection = { questionId: q.id, index: session.index, response, muscleId, anatomyName };
  viewer.highlight(muscleId, anatomyName);
  document.querySelectorAll('[data-answer]').forEach(button => {
    const selected = session.options[Number(button.dataset.answer)] === response;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  $('#point-selection-status').textContent = 'Keuze gemarkeerd. Je kunt je keuze nog wijzigen.';
  $('#confirm-answer').disabled = false;
}
function chooseAnswer(index) {
  if (!session || session.response || session.finished) return;
  const q = byId.get(session.ids[session.index]);
  if (currentExercise(q) !== 'point') {
    if (!route.startsWith('les/') || !session.prepared || isOpenExercise(currentExercise(q)) || needsMatching() || activeInterlude() || (usesModel(q) && !modelAvailable(q, viewer?.available, session.options, currentExercise(q)))) return;
    const response = session.options[index];
    if (!response || (currentExercise(q) === 'binary' && !binaryResponses(q, session.options).includes(response))) return;
    return answer(index);
  }
  const response = session.options[index];
  const card = curriculum.cards.find(card => card.name === response);
  updatePointSelection(response, card?.id || null);
}
function confirmPointSelection() {
  if (!pendingPointSelection || !route.startsWith('les/') || !session?.prepared || session.response || session.finished) return;
  const q = byId.get(session.ids[session.index]);
  if (pendingPointSelection.questionId !== q.id || pendingPointSelection.index !== session.index || currentExercise(q) !== 'point') return;
  answer(session.options.indexOf(pendingPointSelection.response), pendingPointSelection.response);
}

function answer(index, pickedMuscle = null, selfAssessment = null) {
  const expectedSession = session;
  const expectedIndex = session?.index;
  const expectedRoute = route;
  return withProgressLock(() => {
    if (!canSaveLesson()) return;
    if (!session || session !== expectedSession || session.index !== expectedIndex || !session.prepared || session.response || session.finished) return;
    const q = byId.get(session.ids[session.index]);
    if (usesModel(q) && !modelAvailable(q, viewer?.available, session.options, currentExercise(q))) return;
    const response = pickedMuscle || session.options[index];
    if (!response) return;
    refreshProgress();
    const mode = currentExercise(q);
    if (mode === 'open-self' && (!session.openRevealed || typeof selfAssessment !== 'boolean')) return;
    const correct = mode === 'open-self' ? selfAssessment : isOpenExercise(mode) ? isOpenAnswerCorrect(q, response) : response === q.answer;
    const retry = session.index >= session.initialCount || session.ids.slice(0, session.index).includes(q.id);
    const reviewLessonId = session.reviewLessonId || globalThis.crypto?.randomUUID?.() || Date.now() + ':' + Math.random();
    session = { ...session, reviewLessonId };
    session = { ...recordLessonAnswer(session, correct, availableExercises(q)[0]), response, selfAssessmentCorrect: mode === 'open-self' ? selfAssessment : null };
    const xp = correct ? 5 : 0;
    game = awardXP(game, xp);
    session = { ...session, xp: (session.xp || 0) + xp };
    progress = recordAnswer(progress, q.id, correct, Date.now(), mode, { lessonId: reviewLessonId, retry });
    save(true);
    if (route === expectedRoute) { renderLesson({ preserveCamera: true }); $('#next-question').focus({ preventScroll: true }); }
    else if (route === 'leren') renderHome();
    else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank();
  });
}
function next() {
  if (!session || !session.response) return;
  pendingPointSelection = null;
  const index = session.index + 1;
  const exerciseModes = session.exerciseModes || session.ids.map((id, slot) => currentExercise(byId.get(id), slot));
  session = { ...session, index, response: null, openDraft: '', openRevealed: false, selfAssessmentCorrect: null, exerciseModes, options: index < session.ids.length ? optionsFor(byId.get(session.ids[index]), Math.random, exerciseModes[index]) : [] };
  save(); renderLesson();
  focusLessonContent();
}
function finish() {
  if (!session || session.index < session.ids.length) return;
  const ending = session;
  const endingRoute = route;
  return withProgressLock(() => {
    if (!canSaveLesson()) return;
    if (session !== ending) return;
    const justFinished = !session.finished;
    if (!session.finished) {
      refreshProgress();
      const bonus = session.answered > 0 ? 10 : 0;
      game = completeLevel(awardXP(game, bonus), session.levelId, session.correct, session.initialCount || session.ids.length);
      session = { ...session, finished: true, finishedAt: Date.now(), xp: (session.xp || 0) + bonus };
      progress = { ...progress, sessions: [...progress.sessions, { at: Date.now(), correct: session.correct, total: session.answered }].slice(-200) };
      save(true);
      window.motionStudyAnalytics?.lessonFinished(session);
    }
    if (route !== endingRoute) { if (route === 'leren') renderHome(); else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank(); return; }
    const passed = session.levelId && game.completed.includes(session.levelId);
    const stats = gameStats(game);
    setLessonFocus(true);
    $('#intro').innerHTML = '';
    const nextLevel = levelPath(game).find(level => !level.done);
    restoreAtlasLayout();
    $('#learning').innerHTML = '<div class="result-card celebration"><span class="result-icon">' + icon(passed ? 'target' : 'check') + '</span><h2 id="result-title" tabindex="-1">' + (passed ? 'Les gehaald' : 'Les afgerond') + '</h2><div class="reward-xp">+' + (session.xp || 0) + ' XP</div><div class="result-breakdown"><div><span>Goede antwoorden</span><strong>+' + Math.max(0, (session.xp || 0) - (session.answered > 0 ? 10 : 0)) + ' XP</strong></div><div><span>Les afgerond</span><strong>+' + (session.answered > 0 ? 10 : 0) + ' XP</strong></div></div><div class="result-metrics"><span><strong>' + session.correct + '/' + session.answered + '</strong> goed met herhalingen</span><span><strong>' + (session.firstCorrect || 0) + '/' + (session.initialCount || session.ids.length) + '</strong> eerste poging</span><span><strong>' + (session.bestAnswerStreak || 0) + '</strong> beste reeks</span></div>' + (session.levelId && !passed ? '<p>Verbeter alle fouten om deze les te halen.</p>' : '') + '<div class="goal-result">' + (stats.today >= DAILY_GOAL ? 'Dagdoel gehaald · ' + stats.streak + (stats.streak === 1 ? ' dag streak' : ' dagen streak') : 'Nog ' + (DAILY_GOAL - stats.today) + ' XP tot je dagdoel') + '</div><button class="primary" ' + (session.levelId && !passed ? 'data-level="' + session.levelId + '"' : nextLevel ? 'data-level="' + nextLevel.id + '"' : 'data-start="daily"') + '>' + (session.levelId && !passed ? 'Oefen deze les opnieuw' : 'Volgende les') + icon('arrow-right') + '</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';

    resetAtlas();
    $('.atlas-panel').hidden = true;
    focusLessonContent();
    if (justFinished && session.answered > 0) document.dispatchEvent?.(new Event('motionstudy:lesson-completed'));
  });
}
function cardMarkup(card) {
  return '<span class="eyebrow">' + escape(topics.find(t => t.id === card.region)?.title || 'SPIER') + '</span><h3>' + escape(card.name) + '</h3><p>' + escape(card.fields.functie || '') + '</p>';
}
function showMuscle(id, originalName, confirmed = false) {
  if (route.startsWith('les/') && session && !session.finished && !session.response) {
    const q = byId.get(session.ids[session.index]);
    if (session.prepared && currentExercise(q) === 'point') {
      const card = curriculum.cards.find(c => c.id === id);
      if (card || originalName) {
        updatePointSelection(card?.name || originalName, id, originalName);
        if (confirmed) confirmPointSelection();
      }
    }
    return;
  }
  const card = curriculum.cards.find(c => c.id === id);
  if (!card) {
    if (confirmed) viewer?.highlight(null, originalName);
    $('#selection-card').innerHTML = '<span class="eyebrow">ANATOMISCHE STRUCTUUR</span><h3>' + escape(originalName || 'Kies een spier') + '</h3><p>Geen spierkaart beschikbaar.</p>'; return;
  }
  if (confirmed) viewer?.highlight(card.id);
  else {
    viewer?.select(card.id, card.view);
    setOrientation(card.view || 'front');
  }
  $('#muscle-select').value = card.id;
  $('#selection-card').innerHTML = cardMarkup(card);
  if (route === 'atlas') renderAtlas(card);
}
function renderAtlas(card = null) {
  restoreAtlasLayout();
  intro('3D-atlas');
  if (!card) {
    $('#learning').innerHTML = '<article class="explore-card"><h2>Spieren</h2><div class="atlas-muscles">' + curriculum.cards.map(c => '<button class="muscle-chip" data-muscle="' + c.id + '">' + escape(c.name) + '</button>').join('') + '</div></article>'; return;
  }
  $('#learning').innerHTML = '<article class="explore-card"><span class="tag">' + escape(topics.find(t => t.id === card.region).title) + '</span><h2 id="muscle-card-title" tabindex="-1">' + escape(card.name) + '</h2><dl>' + Object.entries(card.fields).map(([field, value]) => '<div><dt>' + escape(field) + '</dt><dd>' + escape(value) + '</dd></div>').join('') + '</dl>' + '<button class="primary" data-start="' + card.region + '">Oefen dit hoofdstuk ' + icon('arrow-right') + '</button><button class="text-button" id="all-muscles">Alle spierkaarten</button></article>';
}
function renderProgress() {
  restoreAtlasLayout();
  intro('Voortgang');
  const seen = Object.keys(progress.questions).length;
  const due = dueCount();
  const mastery = masteryFor(curriculum.questions, progress);
  $('#learning').innerHTML = gameMarkup() + '<div class="stats"><div><strong>' + seen + '</strong><span>vragen geoefend</span></div><div><strong>' + progress.sessions.length + '</strong><span>lessen afgerond</span></div><div><strong>' + mastery + '%</strong><span>beheerst</span></div></div><div class="review-card"><h2>' + (due ? due + ' vragen te herhalen' : 'Geen herhalingen') + '</h2><button class="primary" data-start="review" ' + (!due ? 'disabled' : '') + '>Start herhaling ' + icon('refresh') + '</button></div><div class="section-heading"><h2>Per hoofdstuk</h2></div><div class="progress-topics">' + topics.map(t => {
    const qs = curriculum.questions.filter(q => q.region === t.id);
    const seen = qs.filter(q => progress.questions[q.id]).length;
    return '<div><strong>' + t.title + '</strong><span>' + seen + ' / ' + qs.length + ' geoefend · ' + masteryFor(qs, progress) + '% beheerst</span><progress max="' + qs.length + '" value="' + seen + '" aria-label="' + t.title + ' geoefend"></progress></div>';
  }).join('') + '</div>';
  resetAtlas();
  $('.atlas-panel').hidden = true;
}
function renderQuestionBank() {
  restoreAtlasLayout();
  resetAtlas();
  $('.atlas-panel').hidden = true;
  intro('Vragenbank');
  $('#learning').innerHTML = '<div class="bank-filters"><label for="question-search">Zoeken</label><input id="question-search" type="search" placeholder="Spier of onderwerp"><label for="question-chapter">Hoofdstuk</label><select id="question-chapter"><option value="">Alle hoofdstukken</option>' + topics.map(topic => '<option value="' + topic.id + '">' + escape(topic.title) + '</option>').join('') + '</select></div><p id="bank-count" role="status">' + curriculum.questions.length + ' vragen</p><div class="question-bank">' + topics.map(topic => '<details class="bank-chapter" data-chapter="' + topic.id + '"><summary>' + escape(topic.title) + ' · ' + curriculum.questions.filter(q => q.region === topic.id).length + ' vragen</summary><button class="text-button" data-start="' + topic.id + '">Oefen dit hoofdstuk</button><ol>' + curriculum.questions.filter(q => q.region === topic.id).map(q => '<li data-search="' + escape((q.prompt + ' ' + q.answer + ' ' + (q.explanation || '')).toLocaleLowerCase('nl')) + '"><details><summary>' + escape(q.type === 'model-fact' ? '3D: ' + q.prompt : isModelQuestion(q) ? '3D-herkenning: ' + q.answer : q.prompt) + '</summary>' + '<p><strong>Antwoord:</strong> ' + escape(q.answer) + '</p>' + (q.explanation ? '<p>' + escape(q.explanation) + '</p>' : '') + '</details></li>').join('') + '</ol></details>').join('') + '</div><a class="text-link" href="#leren">Terug naar je leerpad</a>';
}
function filterQuestionBank() {
  const query = $('#question-search').value.trim().toLocaleLowerCase('nl');
  const chapter = $('#question-chapter').value;
  let count = 0;
  document.querySelectorAll('.bank-chapter').forEach(section => {
    let visible = 0;
    section.querySelectorAll('[data-search]').forEach(row => {
      row.hidden = Boolean(chapter && section.dataset.chapter !== chapter) || !row.dataset.search.includes(query);
      if (!row.hidden) visible++;
    });
    section.hidden = !visible;
    section.open = Boolean(query || chapter) && Boolean(visible);
    count += visible;
  });
  $('#bank-count').textContent = count ? count + (count === 1 ? ' vraag gevonden' : ' vragen gevonden') : 'Geen vragen gevonden.';
}
function navigate() {
  viewerFullscreen?.close({ immediate: true, restoreFocus: false });
  pendingPointSelection = null;
  window.scrollTo(0, 0);
  route = location.hash.slice(1) || 'leren';
  const homeStats = $('#home-stats');
  if (homeStats) homeStats.hidden = route !== 'leren';
  for (const view of ['home', 'atlas', 'progress', 'bank']) {
    document.body?.classList.toggle(view + '-view', route === ({ home: 'leren', atlas: 'atlas', progress: 'voortgang', bank: 'vragen' })[view]);
  }
  document.querySelectorAll('[data-nav]').forEach(a => { const active = a.dataset.nav === route || (route.startsWith('les/') && a.dataset.nav === 'leren'); if (active) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (route.startsWith('les/')) { renderLesson(); focusLessonContent(); }
  else if (route === 'atlas') { resetAtlas(); renderAtlas(); }
  else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank();
  else renderHome();
}
document.addEventListener('click', event => {
  if (event.target.closest('.skip')) { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView({ block: 'start' }); return; }
  const levelButton = event.target.closest('[data-level]');
  if (levelButton && !levelButton.disabled) start(levelButton.dataset.level.split(':')[0], levelButton.dataset.level);
  const pairButton = event.target.closest('[data-pair]');
  if (pairButton && !pairButton.disabled) choosePair(pairButton.dataset.pair, pairButton.dataset.side);
  const startButton = event.target.closest('[data-start]');
  const answerButton = event.target.closest('[data-answer]');
  const muscleButton = event.target.closest('[data-muscle]');
  const viewButton = event.target.closest('[data-view]');
  if (startButton && !startButton.disabled) start(startButton.dataset.start);
  if (answerButton && !answerButton.disabled) chooseAnswer(Number(answerButton.dataset.answer));
  if (event.target.closest('#confirm-answer:not(:disabled)')) confirmPointSelection();
  if (event.target.closest('#continue-interlude')) dismissInterlude();
  if (event.target.closest('#self-assess-correct')) selfAssessOpenAnswer(true);
  if (event.target.closest('#self-assess-retry')) selfAssessOpenAnswer(false);
  if (muscleButton) { showMuscle(muscleButton.dataset.muscle); $('#muscle-card-title')?.focus(); }
  if (viewButton) { viewer?.view(viewButton.dataset.view); setOrientation(viewButton.dataset.view); }
  if (event.target.closest('#next-question')) next();
  if (event.target.closest('#all-muscles')) { resetAtlas(); renderAtlas(); }
  if (event.target.closest('#reset-view')) { viewer?.view('front'); setOrientation('front'); }
  if (event.target.closest('#credits-button')) {
    $('#account-controls').open = false;
    $('#account-controls > summary').focus();
    $('#credits').showModal();
  }
  if (event.target.closest('#credits .close-dialog')) $('#credits').close();
});
document.addEventListener('submit', event => { if (event.target.id === 'open-answer-form') { event.preventDefault(); submitOpenAnswer(); } });
document.addEventListener('input', event => {
  if (event.target.id === 'question-search') filterQuestionBank();
  if (event.target.id === 'open-answer') updateOpenDraft(event.target.value);
});
document.addEventListener('change', event => { if (event.target.id === 'question-chapter') filterQuestionBank(); });
document.addEventListener('keydown', event => {
  if (event.repeat && event.key === 'Enter' && route.startsWith('les/') && !/INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) { event.preventDefault(); return; }
  if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || !session?.prepared || (needsMatching()) || !route.startsWith('les/') || document.querySelector('dialog[open]') || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (event.key === 'Enter' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') {
    if ($('#continue-interlude')) { event.preventDefault(); dismissInterlude(); }
    else if (session.response) { event.preventDefault(); next(); }
    else if (pendingPointSelection) { event.preventDefault(); confirmPointSelection(); }
    return;
  }
  if (/^[1-4]$/.test(event.key)) {
    const button = document.querySelector('[data-key="' + event.key + '"]');
    if (button && !button.disabled) { event.preventDefault(); chooseAnswer(Number(button.dataset.answer)); }
  }
});
$('#muscle-select').addEventListener('change', event => event.target.value ? showMuscle(event.target.value) : resetAtlas());
$('#bones').addEventListener('change', async event => {
  try { await viewer?.showSkeleton(event.target.checked); }
  catch { event.target.checked = false; $('#viewer-status').hidden = false; $('#viewer-status').textContent = 'Skelet laden mislukt. Zet Skelet tonen opnieuw aan.'; }
});
$('#isolate').addEventListener('change', event => viewer?.setIsolated(event.target.checked));
window.addEventListener('hashchange', navigate);
window.matchMedia('(max-width:620px)').addEventListener('change', arrangeModelQuestion);
window.addEventListener('storage', event => {
  if ([DRAFTS_KEY, SESSION_KEY].map(key => storage.keyFor ? storage.keyFor(key) : key).includes(event.key) && !canSaveLesson()) return;
  if ([PROGRESS_KEY, GAME_KEY].map(key => storage.keyFor ? storage.keyFor(key) : key).includes(event.key)) { refreshProgress(); if (route === 'leren') renderHome(); else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank(); }
});
const modelPrompt = document.createElement('p');
modelPrompt.id = 'model-prompt'; modelPrompt.tabIndex = -1; modelPrompt.className = 'model-prompt'; modelPrompt.hidden = true;
$('.atlas-top').after(modelPrompt);
viewerFullscreen = setupViewerFullscreen({ document, window, onClose: arrangeModelQuestion });
if (session?.levelId && location.hash === '#les/' + session.region) history.replaceState(null, '', location.hash + '/' + session.stage);
navigate();
for (const card of curriculum.cards) {
  const option = document.createElement('option');
  option.value = card.id; option.textContent = card.name; $('#muscle-select').append(option);
}
async function initViewer() {
  try {
    const { createViewer } = await import('./viewer.js');
    viewer = await createViewer($('#body'), showMuscle, () => { $('#viewer-status').hidden = true; });
    viewer.setIsolated($('#isolate').checked);
    for (const option of $('#muscle-select').options) if (option.value && !viewer.available.has(option.value)) option.disabled = true;
    if (route.startsWith('les/')) renderLesson();
    await viewer.showSkeleton($('#bones').checked);
  } catch {
    $('#viewer-status').hidden = false;
    $('#viewer-status').innerHTML = '3D-model laden mislukt. <button id="retry-viewer">Opnieuw proberen</button>';
    $('#retry-viewer').addEventListener('click', () => { viewer?.dispose(); viewer = null; $('#viewer-status').textContent = 'Spieren laden…'; initViewer(); });
  }
}
initViewer();
