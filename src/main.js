import './style.css';
import curriculum from './data/curriculum.json';
import { topics, readProgress, readSession, recordAnswer, lessonQueue, optionsFor, masteryFor, PROGRESS_KEY, SESSION_KEY, GAME_KEY, DAILY_GOAL, readGame, awardXP, gameStats, levelPath, levelQuestions, completeLevel, exerciseFor, matchingPairs, shuffled, binaryResponses, varyLesson, DRAFTS_KEY, draftKey, readDrafts, isOpenAnswerCorrect, checkOpenAnswer } from './learning.js';
import { lessonMomentum, lessonInterlude } from './lesson-motivation.js';
import { exerciseForProgress, availableExercises } from './exercise-progression.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const iconNames = { school: 'school', stretch: 'stretching', barbell: 'barbell', target: 'target-arrow', arrows: 'arrows-move', growth: 'chart-bar' };
const icon = name => '<img class="icon" src="' + import.meta.env.BASE_URL + 'icons/' + (iconNames[name] || name) + '.svg" alt="" />';
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Storage blocked'); } }; }
let progress = readProgress(storage);
let game = readGame(storage);
let pairSelection = null;
let pairMessage = "";
let pendingPointSelection = null;
let pendingChoiceSelection = null;
let session = null;
let viewer = null;
let route = '';
let storageAvailable = true;
const byId = new Map(curriculum.questions.map(q => [q.id, q]));
let drafts = readDrafts(storage, byId);
session = readSession(storage, byId);
if (session) session = { ...session, exerciseModes: session.exerciseModes || session.ids.map((id, index) => exerciseFor(byId.get(id), index)), levelId: session.levelId || null, matched: session.matched || [], initialCount: session.initialCount || session.ids.length, firstCorrect: session.firstCorrect || 0, xp: session.xp || 0 };
function refreshProgress() {
  if (!storageAvailable) return;
  try {
    if (storage.getItem(PROGRESS_KEY)) progress = readProgress(storage);
    if (storage.getItem(GAME_KEY)) game = readGame(storage);
  } catch { storageAvailable = false; }
}
function withProgressLock(action) {
  return typeof navigator !== 'undefined' && navigator.locks ? navigator.locks.request('motionstudy-progress', action) : action();
}
function save(rewards = false) {
  try {
    if (rewards) {
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
  } catch { storageAvailable = false; }
}
function focusLessonContent() {
  if ($('#interlude-title')) { $('#interlude-title').focus(); return; }
  if ($('#result-title')) { window.scrollTo(0, 0); $('#result-title').focus({ preventScroll: true }); }
  else if (window.matchMedia('(max-width:620px)').matches && document.querySelector('.question-hint')) {
    $('#question-title').focus({ preventScroll: true }); $('.question-card').scrollIntoView({ block: 'start' });
  } else $('#question-title')?.focus();
}
function dueCount() {
  return curriculum.questions.filter(q => progress.questions[q.id]?.due <= Date.now()).length;
}
function sourceMarkup(source) {
  return '<details class="source"><summary>' + icon('book-2') + ' Bron</summary><p>' + escape(source.title) + ' · ' + escape(source.section) + (source.page ? ' · pagina ' + source.page : '') + '</p><a href="' + curriculum.sourceUrl + '" target="_blank" rel="noreferrer">Open de cheatsheet ↗</a></details>';
}
function intro(title, description = '', eyebrow = '') {
  $('#intro').innerHTML = (eyebrow ? '<span class="eyebrow">' + eyebrow + '</span>' : '') + '<h1>' + title + '</h1>' + (description ? '<p>' + description + '</p>' : '');
}
function gameMarkup() {
  const stats = gameStats(game);
  return '<div class="game-bar" aria-label="Je leerbeloningen"><span>' + icon('sparkles') + '<strong>' + stats.xp + ' XP</strong></span><span>' + icon('refresh') + '<strong>' + stats.streak + (stats.streak === 1 ? ' dag streak' : ' dagen streak') + '</strong></span><span>' + game.completed.length + '/33 levels</span></div><div class="goal-card"><div><strong>Dagdoel</strong><span>' + Math.min(stats.today, DAILY_GOAL) + '/' + DAILY_GOAL + ' XP' + (stats.today >= DAILY_GOAL ? ' · gehaald!' : '') + '</span></div><progress max="' + DAILY_GOAL + '" value="' + Math.min(stats.today, DAILY_GOAL) + '" aria-label="Dagdoel in XP"></progress><p>Goed antwoord: 5 XP · les afgerond: 10 XP</p></div>';
}
function renderHome() {
  restoreAtlasLayout();
  intro('Leren');
  const levels = levelPath(game);
  const current = levels.find(level => !level.done);
  const due = dueCount();
  $('#learning').innerHTML = gameMarkup() + '<div class="daily-card"><span class="eyebrow">' + (current ? 'VOLGEND LEVEL' : 'LEERPAD AFGEROND') + '</span><h2>' + (current ? escape(current.topic.title) : 'Alle levels voltooid') + '</h2><p>' + (current ? current.label + ' · level ' + (current.stage + 1) + ' van 3' : '33 van 33 levels') + '</p><button class="primary" ' + (current ? 'data-level="' + current.id + '"' : 'data-start="daily"') + '>' + (session && !session.finished && session.levelId === current?.id ? 'Ga verder' : 'Start') + icon('arrow-right') + '</button></div><a class="atlas-shortcut" href="#atlas">' + icon('stretch') + '<span><strong>3D-atlas</strong><small>Spieren en functies</small></span>' + icon('arrow-right') + '</a><a class="atlas-shortcut" href="#vragen">' + icon('book-2') + '<span><strong>Alle ' + curriculum.questions.length + ' vragen</strong><small>Vragen per hoofdstuk</small></span>' + icon('arrow-right') + '</a><div class="section-heading"><h2>Hoofdstukken</h2><span>11 hoofdstukken · 33 levels</span></div><div class="learning-path">' + topics.map((topic, chapter) => '<section class="path-chapter"><div class="chapter-heading"><span>' + (chapter + 1) + '</span><div><h3>' + topic.title + '</h3><p>' + topic.subtitle + '</p></div></div><ol>' + levels.filter(level => level.topic.id === topic.id).map(level => '<li class="path-step ' + (level.done ? 'done' : level.locked ? 'locked' : 'current') + '"><button class="level-node" data-level="' + level.id + '" ' + (level.locked ? 'disabled' : '') + ' aria-label="' + escape(topic.title + ': ' + level.label + (level.done ? ', voltooid, opnieuw oefenen' : level.locked ? ', vergrendeld' : ', volgend level')) + '">' + (level.done ? icon('check') : level.stage === 2 ? icon('target') : icon(topic.icon)) + '</button><span><strong>' + level.label + '</strong><small>' + (level.done ? 'Voltooid · oefen opnieuw' : level.locked ? 'Rond het vorige level af' : 'Beschikbaar') + '</small></span></li>').join('') + '</ol></section>').join('') + '</div><div class="practice-actions"><button class="primary" data-start="daily">Gemengde les</button><button class="text-button" data-start="review" ' + (!due ? 'disabled' : '') + '>Herhalen (' + due + ')</button></div><p class="privacy-note">Volgend level bij minstens 80% goed op de eerste poging.</p>';
  resetAtlas();
}
function restoreAtlasLayout() {
  const workspace = $('.workspace');
  if (workspace) workspace.append($('.atlas-panel'));
}
function arrangeModelQuestion() {
  restoreAtlasLayout();
  const answers = $('.question-card .answers');
  if (window.matchMedia('(max-width:620px)').matches && $('.question-hint') && answers) {
    answers.before($('.atlas-panel'));
  }
}
function resetAtlas() {
  $('.atlas-panel').hidden = false;
  pendingPointSelection = null;
  restoreAtlasLayout();
  $('#model-prompt')?.setAttribute('hidden', '');
  $('#muscle-select').disabled = false;
  $('#muscle-select').value = '';
  $('#isolate').checked = false;
  $('#isolate').disabled = false;
  viewer?.setIsolated(false);
  viewer?.select(null);
  $('#orientation').textContent = 'VOORZIJDE';
  $('#selection-card').innerHTML = '<h3>Tik een spier aan</h3>';
}
function start(region, levelId = null) {
  pendingChoiceSelection = null;
  pendingPointSelection = null;
  refreshProgress();
  if (levelId && !levelPath(game).some(level => level.id === levelId && !level.locked)) return;
  if (!session || session.region !== region || session.finished || session.levelId !== levelId) {
    save();
    pairSelection = null; pairMessage = '';
    const pending = drafts[levelId || region];
    const stage = levelId ? Number(levelId.split(':')[1]) : null;
    const pool = levelId ? levelQuestions(curriculum.questions, region, stage) : curriculum.questions;
    const queue = varyLesson(levelId ? shuffled(pool) : lessonQueue(pool, progress, { region, availableMuscles: viewer?.available }));
    session = pending ? { ...pending, exerciseModes: pending.exerciseModes || pending.ids.map((id, index) => exerciseFor(byId.get(id), index)), levelId: pending.levelId || null } : { region, levelId, stage, startedAt: Date.now(), answerHistory: [], dismissedInterludes: [], xp: 0, firstCorrect: 0, initialCount: queue.length, exerciseModes: queue.map((q, index) => exerciseForProgress(q, progress.questions[q.id], { index })), openDraft: '', openRevealed: false, selfAssessmentCorrect: null, prepared: false, matched: [], pairingDone: false, ids: queue.map(q => q.id), index: 0, correct: 0, answered: 0, retryIds: [], options: [], response: null, finished: false };
    if (!pending && queue.length) session.options = optionsFor(queue[0]);
    save();
  }
  const nextHash = '#les/' + region + (levelId ? '/' + session.stage : '');
  if (location.hash === nextHash) { renderLesson(); window.scrollTo(0, 0); }
  else location.hash = nextHash;
}
function renderPreparation() {
  const topic = topics.find(t => t.id === session.region);
  const card = curriculum.cards.find(c => c.region === session.region);
  const q = byId.get(session.ids[0]);
  intro(topic ? topic.title : 'Gemengde les');
  $('#learning').innerHTML = '<article class="explore-card lesson-brief"><span class="tag">' + (session.levelId ? ['ONTDEKKEN', 'OEFENEN', 'CHECKPOINT'][session.stage] : 'GEMENGDE LES') + '</span><h2>' + (card ? escape(card.name) : 'Vooraf') + '</h2><p>' + escape(card ? card.fields.functie : q.prompt + ' ' + q.answer) + '</p>' + (card ? '<dl><div><dt>Oorsprong</dt><dd>' + escape(card.fields.oorsprong) + '</dd></div><div><dt>Aanhechting</dt><dd>' + escape(card.fields.aanhechting) + '</dd></div></dl>' : '') + sourceMarkup(card ? card.source : q.source) + '<p class="brief-note">' + session.ids.length + ' vragen</p><button id="begin-exercises" class="primary">Start ' + icon('arrow-right') + '</button></article>';
  resetAtlas();
  if (card) { viewer?.select(card.id, card.view); $('#selection-card').innerHTML = cardMarkup(card); }
  const heading = $('#intro h1');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}
function needsMatching() {
  return session && !session.pairingDone && (session.stage === 1 || (!session.levelId && topics.some(t => t.id === session.region))) && matchingPairs(curriculum.cards, session.region).length >= 2;
}
function renderMatching() {
  const pairs = matchingPairs(curriculum.cards, session.region);
  const ids = pairs.map(pair => pair.id);
  const matched = [...new Set((session.matched || []).filter(id => ids.includes(id)))];
  const orderValid = session.pairOrder?.length === ids.length && new Set(session.pairOrder).size === ids.length && session.pairOrder.every(id => ids.includes(id));
  session = { ...session, matched, pairOrder: orderValid ? session.pairOrder : shuffled(ids) };
  save();
  intro('Koppelen');
  const button = (pair, side) => '<button class="pair-card ' + (session.matched.includes(pair.id) ? 'matched' : pairSelection?.id === pair.id && pairSelection.side === side ? 'selected' : '') + '" data-pair="' + pair.id + '" data-side="' + side + '" aria-pressed="' + (pairSelection?.id === pair.id && pairSelection.side === side) + '" ' + (session.matched.includes(pair.id) ? 'disabled' : '') + '>' + escape(side === 'name' ? pair.name : pair.function) + (session.matched.includes(pair.id) ? ' ✓' : '') + '</button>';
  $('#learning').innerHTML = '<article class="question-card"><h2 tabindex="-1" id="question-title">Koppel spier en functie</h2><div class="matching-grid"><div>' + pairs.map(pair => button(pair, 'name')).join('') + '</div><div>' + session.pairOrder.map(id => pairs.find(pair => pair.id === id)).filter(Boolean).map(pair => button(pair, 'function')).join('') + '</div></div><p class="pair-status" role="status">' + escape(pairMessage || session.matched.length + '/' + pairs.length + ' paren gevonden') + '</p></article>';
  resetAtlas();
}
function choosePair(id, side) {
  if (!pairSelection || pairSelection.side === side) { pairSelection = { id, side }; pairMessage = 'Kies de ' + (side === 'name' ? 'functie.' : 'spier.'); }
  else {
    const correct = pairSelection.id === id;
    pairSelection = null;
    pairMessage = correct ? 'Goed' : 'Onjuist';
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
function openAnswerMarkup(mode, response, blocked) {
  const revealed = mode === 'open-self' && session.openRevealed;
  const help = mode === 'open-self' ? '' : '<p id="open-answer-help" class="open-answer-help">Kleine typefouten zijn oké.</p>';
  return '<div class="answers"><form id="open-answer-form" class="open-answer-form"><label class="open-answer-label" for="open-answer">Jouw antwoord</label>' + (mode === 'open-self' ? '<textarea id="open-answer" class="open-answer-input" rows="4" maxlength="2000" autocomplete="off" ' + (response || revealed || blocked ? 'disabled' : '') + '>' + escape(session.openDraft || response || '') + '</textarea>' : '<input id="open-answer" class="open-answer-input" type="text" maxlength="200" autocomplete="off" spellcheck="false" aria-describedby="open-answer-help" value="' + escape(session.openDraft || response || '') + '" ' + (response || revealed || blocked ? 'disabled' : '') + '>') + help + (!response && !revealed ? '<button id="check-open-answer" type="submit" class="primary" ' + (blocked || !session.openDraft?.trim() ? 'disabled' : '') + '>' + (mode === 'open-self' ? 'Vergelijk' : 'Controleer') + icon('check') + '</button>' : '') + '</form></div>' + (revealed && !response ? '<div class="feedback" role="status"><strong>Antwoord</strong><p>' + escape(byId.get(session.ids[session.index]).answer) + '</p></div>' + sourceMarkup(byId.get(session.ids[session.index]).source) + '<div class="self-assessment-controls"><button class="primary" id="self-assess-correct">Goed ' + icon('check') + '</button><button class="text-button" id="self-assess-retry">Nog oefenen</button></div>' : '');
}
function updateOpenDraft(value) {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || session.openRevealed) return;
  const q = byId.get(session.ids[session.index]);
  if (!isOpenExercise(currentExercise(q))) return;
  session = { ...session, openDraft: value.slice(0, currentExercise(q) === 'open-self' ? 2000 : 200) };
  save();
  const button = $('#check-open-answer');
  if (button) button.disabled = !session.openDraft.trim() || (q.type === 'recognition' && !viewer?.available.has(q.muscleId));
}
function submitOpenAnswer() {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || session.openRevealed) return;
  const q = byId.get(session.ids[session.index]);
  const mode = currentExercise(q);
  if (!isOpenExercise(mode) || !session.openDraft?.trim() || (q.type === 'recognition' && !viewer?.available.has(q.muscleId))) return;
  if (mode === 'open-self') {
    session = { ...session, openRevealed: true };
    save(); renderLesson(); $('#self-assess-correct')?.focus();
  } else answer(null, session.openDraft.trim());
}
function selfAssessOpenAnswer(correct) {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished || !session.openRevealed) return;
  const q = byId.get(session.ids[session.index]);
  if (currentExercise(q) === 'open-self') answer(null, session.openDraft.trim(), correct);
}
function lessonHud() {
  const initialCount = session.initialCount || session.ids.length;
  const inRetry = session.index >= initialCount;
  const total = inRetry ? session.ids.length - initialCount : initialCount;
  const completed = Math.min(total, (inRetry ? session.index - initialCount : session.index) + Number(Boolean(session.response)));
  const momentum = lessonMomentum(session);
  return '<div class="lesson-hud"><div class="lesson-top"><a href="#leren">← Leerpad</a><div class="lesson-status"><span class="lesson-run">' + icon('growth') + momentum.run + ' op rij</span><span class="lesson-xp">' + icon('sparkles') + (session.xp || 0) + ' XP</span></div></div><progress class="lesson-progress" max="' + total + '" value="' + completed + '" aria-label="' + (inRetry ? 'Herhaling' : 'Lesvoortgang') + '"></progress><p class="lesson-progress-label">' + (inRetry ? 'Fouten oefenen' : 'Je les') + ' · ' + completed + '/' + total + '</p></div>';
}
function renderInterlude(interlude) {
  pendingChoiceSelection = null;
  resetAtlas();
  $('.atlas-panel').hidden = true;
  intro(interlude.kind === 'retry' ? 'Nog even <em>oefenen.</em>' : 'Je bent <em>onderweg.</em>', 'Neem je tijd. Je gaat verder wanneer jij klaar bent.', 'EVEN TUSSENDOOR');
  $('#learning').innerHTML = lessonHud() + '<article class="lesson-interlude"><span class="interlude-symbol">' + icon(interlude.icon) + '</span><h2 id="interlude-title" tabindex="-1">' + escape(interlude.title) + '</h2><p>' + escape(interlude.description) + '</p><div class="interlude-progress">' + (interlude.kind === 'retry' ? session.ids.length - session.initialCount + ' vragen om nog eens te oefenen' : session.index + ' van ' + session.initialCount + ' vragen doorlopen') + '</div><button id="continue-interlude" class="primary">' + (interlude.kind === 'retry' ? 'Oefen mijn fouten' : 'Verder met de les') + icon('arrow-right') + '</button></article>';
}
function dismissInterlude() {
  if (!route.startsWith('les/') || !session?.prepared || session.response || session.finished) return;
  const interlude = lessonInterlude(session);
  if (!interlude) return;
  session = { ...session, dismissedInterludes: [...(session.dismissedInterludes || []), interlude.key] };
  save(); renderLesson(); focusLessonContent();
}
function feedbackMarkup(q, isCorrect, answerCheck) {
  const momentum = lessonMomentum(session);
  const title = isCorrect ? answerCheck?.typo ? 'Goed! Let op de spelling.' : momentum.run >= 3 ? momentum.run + ' op rij. Goed bezig!' : 'Goed gedaan!' : 'Deze oefenen we nog even.';
  return '<div class="feedback ' + (isCorrect ? 'success' : 'retry') + ' lesson-feedback" role="status" aria-live="polite"><div class="feedback-heading"><span class="feedback-symbol" aria-hidden="true">' + (isCorrect ? icon('check') : icon('refresh')) + '</span><strong>' + title + '</strong>' + (isCorrect ? '<span class="feedback-reward">+5 XP</span>' : '') + '</div><p>' + (isCorrect ? escape(q.answer) : '<strong>Het juiste antwoord:</strong> ' + escape(q.answer)) + '</p>' + (!isCorrect ? '<p>Lees het antwoord rustig door. Een fout kost je geen XP.</p>' : '') + '</div>' + sourceMarkup(q.source) + '<div class="lesson-actions"><button class="primary next-button" id="next-question">' + (session.index + 1 >= session.ids.length ? 'Bekijk je resultaat' : 'Verder') + icon('arrow-right') + '</button></div>';
}
function renderLesson({ preserveCamera = false } = {}) {
  restoreAtlasLayout();
  const [, region = 'daily', stage] = route.split('/');
  const levelId = stage !== undefined ? region + ':' + stage : null;
  if (!session || session.region !== region || session.levelId !== levelId) { start(region, levelId); return; }
  if (!session.ids.length) {
    intro('Herhalen');
    $('#learning').innerHTML = '<div class="empty-card"><h2>Geen herhalingen klaar</h2><button class="primary" data-start="daily">Start een gemengde les</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';
    resetAtlas(); return;
  }
  if (session.index >= session.ids.length) { finish(); return; }
  if (!session.prepared) { renderPreparation(); return; }
  if (needsMatching()) { renderMatching(); return; }
  const interlude = !session.response && lessonInterlude(session);
  if (interlude) { renderInterlude(interlude); return; }
  const q = byId.get(session.ids[session.index]);
  const title = topics.find(t => t.id === session.region)?.title || (session.region === 'review' ? 'Herhalen' : 'Gemengde les');
  intro(title, '', session.index >= session.initialCount ? 'FOUTEN OEFENEN' : 'VRAAG ' + (session.index + 1) + ' VAN ' + session.initialCount);
  const mode = currentExercise(q);
  if (mode !== 'point' || pendingPointSelection?.questionId !== q.id || pendingPointSelection?.index !== session.index || session.response) pendingPointSelection = null;
  if (pendingChoiceSelection?.questionId !== q.id || pendingChoiceSelection?.index !== session.index || session.response || mode === 'point' || isOpenExercise(mode)) pendingChoiceSelection = null;
  const response = session.response;
  const answerCheck = response && ['open', 'recognition-open'].includes(mode) ? checkOpenAnswer(q, response) : null;
  const isCorrect = mode === 'open-self' ? session.selfAssessmentCorrect === true : answerCheck ? answerCheck.correct : response === q.answer;
  const recognitionBlocked = q.type === 'recognition' && !viewer?.available.has(q.muscleId);
  $('#learning').innerHTML = lessonHud() +
    '<article class="question-card"><span class="tag">' + (mode === 'point' ? 'WIJS DE SPIER AAN' : mode === 'binary' ? 'KLOPT DIT ANTWOORD?' : isOpenExercise(mode) ? 'OPEN VRAAG' : q.type === 'recognition' ? 'HERKEN DE SPIER' : 'MEERKEUZE') + '</span><h2 tabindex="-1" id="question-title">' + escape(mode === 'point' ? 'Wijs ' + q.answer + ' aan.' : mode === 'recognition-open' ? 'Welke spier is paars gemarkeerd?' : q.prompt) + '</h2>' +
    (q.type === 'recognition' ? '<p class="question-hint">' + (mode === 'point' ? 'Tik de spier aan.' : 'Draai het model.') + '</p>' : '') +
    (recognitionBlocked ? '<p role="status">3D-model niet beschikbaar.</p>' : '') +
    (mode === 'binary' ? '<div class="statement"><span>Voorgesteld antwoord</span><p>' + escape(session.options[0]) + '</p></div>' : '') + (isOpenExercise(mode) ? openAnswerMarkup(mode, response, recognitionBlocked) : '<div class="answers">' + (mode === 'binary' ? binaryResponses(q, session.options) : session.options).map((option, i) => '<button data-key="' + (i + 1) + '" data-answer="' + session.options.indexOf(option) + '" class="answer ' + (response ? option === q.answer ? 'correct' : option === response ? 'incorrect' : '' : (mode === 'point' ? pendingPointSelection : pendingChoiceSelection)?.response === option ? 'selected' : '') + '" ' + (!response ? 'aria-pressed="' + ((mode === 'point' ? pendingPointSelection : pendingChoiceSelection)?.response === option) + '" ' : '') + (response || recognitionBlocked ? 'disabled' : '') + '><span class="answer-key">' + (i + 1) + '</span><span>' + (mode === 'binary' ? (i === 0 ? 'Klopt' : 'Klopt niet') : mode === 'point' && !response ? 'Bekijk spier ' + (i + 1) : escape(option)) + '</span>' + (response && option === q.answer ? icon('check') : '') + '</button>').join('') + '</div>') +
    (mode === 'point' && !response ? '<div class="point-confirmation"><p id="point-selection-status" role="status" aria-live="polite">' + (pendingPointSelection ? 'Spier geselecteerd.' : 'Kies een spier.') + '</p><button id="confirm-answer" class="primary" ' + (!pendingPointSelection || recognitionBlocked ? 'disabled' : '') + '>Bevestig antwoord ' + icon('check') + '</button></div>' : '') +
    (!response && !isOpenExercise(mode) && mode !== 'point' ? '<div class="answer-confirmation"><p id="choice-selection-status" role="status">' + (pendingChoiceSelection ? 'Antwoord gekozen. Controleer als je klaar bent.' : 'Kies je antwoord. Je kunt je keuze nog wijzigen.') + '</p><button id="confirm-choice-answer" class="primary" ' + (!pendingChoiceSelection || recognitionBlocked ? 'disabled' : '') + '>Controleer antwoord ' + icon('check') + '</button><span class="answer-shortcut">' + (mode === 'binary' ? '1–2' : '1–4') + ' om te kiezen · Enter om te controleren</span></div>' : '') +
    (response ? feedbackMarkup(q, isCorrect, answerCheck) : session.openRevealed ? '' : '<button class="text-button" id="skip-question">Overslaan</button>') +
    '</article>' + (storageAvailable ? '' : '<p class="privacy-note" role="status">Voortgang niet opgeslagen.</p>');
  const card = curriculum.cards.find(c => c.id === q.muscleId);
  $('#muscle-select').disabled = !response;
  $('#isolate').disabled = mode === 'point' && !response;
  if ($('#isolate').disabled) {
    $('#isolate').checked = false;
    viewer?.setIsolated(false);
  }
  if (card) {
    if (mode === 'point' && pendingPointSelection && !response) viewer?.highlight(pendingPointSelection.muscleId, pendingPointSelection.anatomyName);
    else if (preserveCamera) viewer?.highlight(card.id);
    else viewer?.select(card.id, card.view, q.type === 'recognition' && mode !== 'point', mode !== 'point' || Boolean(response));
    if (!preserveCamera) $('#orientation').textContent = card.view === 'back' ? 'ACHTERZIJDE' : card.view === 'side' ? 'ZIJAANZICHT' : 'VOORZIJDE';
    $('#selection-card').innerHTML = response ? cardMarkup(card) : q.type === 'recognition' || isOpenExercise(mode) ? '' : '<h3>' + escape(card.name) + '</h3>';
  } else { resetAtlas(); $('#muscle-select').disabled = !response; }
  const modelPrompt = $('#model-prompt');
  modelPrompt.hidden = q.type !== 'recognition';
  modelPrompt.textContent = mode === 'point' ? 'Wijs ' + q.answer + ' aan.' : 'Welke spier is paars gemarkeerd?';
  $('.atlas-panel').hidden = q.type !== 'recognition';
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
  $('#point-selection-status').textContent = 'Spier geselecteerd.';
  $('#confirm-answer').disabled = false;
}
function chooseAnswer(index) {
  if (!session || session.response || session.finished) return;
  const q = byId.get(session.ids[session.index]);
  if (currentExercise(q) !== 'point') {
    if (!route.startsWith('les/') || !session.prepared || isOpenExercise(currentExercise(q)) || needsMatching() || lessonInterlude(session) || (q.type === 'recognition' && !viewer?.available.has(q.muscleId))) return;
    const response = session.options[index];
    if (!response || (currentExercise(q) === 'binary' && !binaryResponses(q, session.options).includes(response))) return;
    pendingChoiceSelection = { questionId: q.id, index: session.index, response };
    document.querySelectorAll('[data-answer]').forEach(button => {
      const selected = session.options[Number(button.dataset.answer)] === response;
      button.classList.toggle('selected', selected);
      button.setAttribute('aria-pressed', String(selected));
    });
    $('#choice-selection-status').textContent = 'Antwoord gekozen. Controleer als je klaar bent.';
    $('#confirm-choice-answer').disabled = false;
    return;
  }
  const response = session.options[index];
  const card = curriculum.cards.find(card => card.name === response);
  updatePointSelection(response, card?.id || null);
}
function confirmChoiceSelection() {
  if (!pendingChoiceSelection || !route.startsWith('les/') || !session?.prepared || session.response || session.finished) return;
  const q = byId.get(session.ids[session.index]);
  if (pendingChoiceSelection.questionId !== q.id || pendingChoiceSelection.index !== session.index || currentExercise(q) === 'point' || isOpenExercise(currentExercise(q)) || lessonInterlude(session)) return;
  return answer(session.options.indexOf(pendingChoiceSelection.response));
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
    if (!session || session !== expectedSession || session.index !== expectedIndex || !session.prepared || session.response || session.finished) return;
    const q = byId.get(session.ids[session.index]);
    if (q.type === 'recognition' && !viewer?.available.has(q.muscleId)) return;
    const response = pickedMuscle || session.options[index];
    if (!response) return;
    refreshProgress();
    const mode = currentExercise(q);
    if (mode === 'open-self' && (!session.openRevealed || typeof selfAssessment !== 'boolean')) return;
    const correct = mode === 'open-self' ? selfAssessment : isOpenExercise(mode) ? isOpenAnswerCorrect(q, response) : response === q.answer;
    pendingChoiceSelection = null;
    session = { ...session, answerHistory: [...(session.answerHistory || []), { correct, skipped: false, retry: session.index >= session.initialCount }], response, selfAssessmentCorrect: mode === 'open-self' ? selfAssessment : null, correct: session.correct + Number(correct), answered: session.answered + 1 };
    if (!correct && !session.retryIds.includes(q.id)) session = { ...session, ids: [...session.ids, q.id], exerciseModes: [...(session.exerciseModes || session.ids.map((id, index) => currentExercise(byId.get(id), index))), availableExercises(q)[0]], retryIds: [...session.retryIds, q.id] };
    const xp = correct ? 5 : 0;
    game = awardXP(game, xp);
    session = { ...session, xp: (session.xp || 0) + xp, firstCorrect: (session.firstCorrect || 0) + Number(correct && session.index < (session.initialCount || session.ids.length)) };
    progress = recordAnswer(progress, q.id, correct, Date.now(), mode);
    save(true);
    if (route === expectedRoute) { renderLesson({ preserveCamera: true }); $('#next-question').focus(); }
    else if (route === 'leren') renderHome();
    else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank();
  });
}
function next(skip = false) {
  if (!route.startsWith('les/') || !session || session.finished || (!skip && !session.response)) return;
  pendingChoiceSelection = null;
  if (skip && !session.response) session = { ...session, answerHistory: [...(session.answerHistory || []), { correct: false, skipped: true, retry: session.index >= session.initialCount }] };
  pendingPointSelection = null;
  if (!session || (!skip && !session.response)) return;
  const index = session.index + 1;
  const exerciseModes = session.exerciseModes || session.ids.map((id, slot) => currentExercise(byId.get(id), slot));
  session = { ...session, index, response: null, openDraft: '', openRevealed: false, selfAssessmentCorrect: null, exerciseModes, options: index < session.ids.length ? optionsFor(byId.get(session.ids[index])) : [] };
  save(); renderLesson();
  focusLessonContent();
}
function finish() {
  const ending = session;
  const endingRoute = route;
  return withProgressLock(() => {
    if (session !== ending) return;
    if (!session.finished) {
      refreshProgress();
      const bonus = session.answered > 0 ? 10 : 0;
      game = completeLevel(awardXP(game, bonus), session.levelId, session.firstCorrect || 0, session.initialCount || session.ids.length);
      session = { ...session, finished: true, xp: (session.xp || 0) + bonus };
      progress = { ...progress, sessions: [...progress.sessions, { at: Date.now(), correct: session.correct, total: session.answered }].slice(-200) };
      save(true);
    }
    if (route !== endingRoute) { if (route === 'leren') renderHome(); else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank(); return; }
    const passed = session.levelId && game.completed.includes(session.levelId);
    const stats = gameStats(game);
    intro('Resultaat');
    const nextLevel = levelPath(game).find(level => !level.done);
    restoreAtlasLayout();
    $('#learning').innerHTML = '<div class="result-card celebration"><span class="result-icon">' + icon(passed ? 'target' : 'check') + '</span><h2 id="result-title" tabindex="-1">' + (passed ? 'Level gehaald' : 'Les afgerond') + '</h2><div class="reward-xp">+' + (session.xp || 0) + ' XP</div><div class="result-breakdown"><div><span>Goede antwoorden</span><strong>+' + Math.max(0, (session.xp || 0) - (session.answered > 0 ? 10 : 0)) + ' XP</strong></div><div><span>Les afgerond</span><strong>+' + (session.answered > 0 ? 10 : 0) + ' XP</strong></div><div><span>Beste reeks deze les</span><strong>' + lessonMomentum(session).bestRun + ' op rij</strong></div></div><div class="result-metrics"><span><strong>' + (session.answered ? session.correct + '/' + session.answered : '0') + '</strong> ' + (session.answered ? 'goed met herhalingen' : 'vragen beantwoord') + '</span><span><strong>' + (session.firstCorrect || 0) + '/' + (session.initialCount || session.ids.length) + '</strong> eerste poging</span></div>' + (session.levelId && !passed ? '<p>Minimaal 80% goed op de eerste poging.</p>' : '') + '<div class="goal-result">' + (stats.today >= DAILY_GOAL ? 'Dagdoel gehaald · ' + stats.streak + (stats.streak === 1 ? ' dag streak' : ' dagen streak') : 'Nog ' + (DAILY_GOAL - stats.today) + ' XP tot je dagdoel') + '</div><button class="primary" ' + (session.levelId && !passed ? 'data-level="' + session.levelId + '"' : nextLevel ? 'data-level="' + nextLevel.id + '"' : 'data-start="daily"') + '>' + (session.levelId && !passed ? 'Oefen dit level opnieuw' : 'Volgende les') + icon('arrow-right') + '</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';

    resetAtlas();
    $('.atlas-panel').hidden = true;
    focusLessonContent();
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
    $('#orientation').textContent = card.view === 'back' ? 'ACHTERZIJDE' : card.view === 'side' ? 'ZIJAANZICHT' : 'VOORZIJDE';
  }
  $('#muscle-select').value = card.id;
  $('#selection-card').innerHTML = cardMarkup(card);
  if (route === 'atlas') renderAtlas(card);
}
function renderAtlas(card = null) {
  restoreAtlasLayout();
  intro('3D-atlas');
  if (!card) {
    $('#learning').innerHTML = '<article class="explore-card"><span class="tag">31 SPIERKAARTEN</span><h2>Kies een spier</h2><div class="atlas-muscles">' + curriculum.cards.map(c => '<button class="muscle-chip" data-muscle="' + c.id + '">' + escape(c.name) + '</button>').join('') + '</div></article>'; return;
  }
  $('#learning').innerHTML = '<article class="explore-card"><span class="tag">' + escape(topics.find(t => t.id === card.region).title) + '</span><h2 id="muscle-card-title" tabindex="-1">' + escape(card.name) + '</h2><dl>' + Object.entries(card.fields).map(([field, value]) => '<div><dt>' + escape(field) + '</dt><dd>' + escape(value) + '</dd></div>').join('') + '</dl>' + sourceMarkup(card.source) + '<button class="primary" data-start="' + card.region + '">Oefen dit hoofdstuk ' + icon('arrow-right') + '</button><button class="text-button" id="all-muscles">Alle spierkaarten</button></article>';
}
function renderProgress() {
  restoreAtlasLayout();
  intro('Voortgang');
  const seen = Object.keys(progress.questions).length;
  const due = dueCount();
  const mastery = masteryFor(curriculum.questions, progress);
  $('#learning').innerHTML = gameMarkup() + '<div class="stats"><div><strong>' + seen + '</strong><span>vragen geoefend</span></div><div><strong>' + progress.sessions.length + '</strong><span>lessen afgerond</span></div><div><strong>' + mastery + '%</strong><span>herhaald beheerst</span></div></div><div class="review-card"><h2>' + (due ? due + ' vragen om te herhalen' : 'Geen herhalingen klaar') + '</h2><button class="primary" data-start="review" ' + (!due ? 'disabled' : '') + '>Start herhaling ' + icon('refresh') + '</button></div><div class="section-heading"><h2>Per hoofdstuk</h2></div><div class="progress-topics">' + topics.map(t => {
    const qs = curriculum.questions.filter(q => q.region === t.id);
    const seen = qs.filter(q => progress.questions[q.id]).length;
    return '<div><strong>' + t.title + '</strong><span>' + seen + ' / ' + qs.length + ' geoefend · ' + masteryFor(qs, progress) + '% beheerst</span><progress max="' + qs.length + '" value="' + seen + '" aria-label="' + t.title + ' geoefend"></progress></div>';
  }).join('') + '</div>';
  resetAtlas();
}
function renderQuestionBank() {
  restoreAtlasLayout();
  resetAtlas();
  intro('Vragenbank', curriculum.questions.length + ' vragen · 11 hoofdstukken');
  $('#learning').innerHTML = '<div class="bank-filters"><label for="question-search">Zoeken</label><input id="question-search" type="search" placeholder="Bijvoorbeeld diafragma of deload"><label for="question-chapter">Hoofdstuk</label><select id="question-chapter"><option value="">Alle hoofdstukken</option>' + topics.map(topic => '<option value="' + topic.id + '">' + escape(topic.title) + '</option>').join('') + '</select></div><p id="bank-count" role="status">' + curriculum.questions.length + ' vragen</p><div class="question-bank">' + topics.map(topic => '<details class="bank-chapter" data-chapter="' + topic.id + '"><summary>' + escape(topic.title) + ' · ' + curriculum.questions.filter(q => q.region === topic.id).length + ' vragen</summary><button class="text-button" data-start="' + topic.id + '">Oefen dit hoofdstuk</button><ol>' + curriculum.questions.filter(q => q.region === topic.id).map(q => '<li data-search="' + escape((q.prompt + ' ' + q.answer).toLocaleLowerCase('nl')) + '"><details><summary>' + escape(q.type === 'recognition' ? '3D-herkenning: ' + q.answer : q.prompt) + '</summary><p><strong>Antwoord:</strong> ' + escape(q.answer) + '</p>' + sourceMarkup(q.source) + '</details></li>').join('') + '</ol></details>').join('') + '</div><a class="text-link" href="#leren">Terug naar je leerpad</a>';
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
  pendingChoiceSelection = null;
  pendingPointSelection = null;
  window.scrollTo(0, 0);
  route = location.hash.slice(1) || 'leren';
  document.querySelectorAll('[data-nav]').forEach(a => { const active = a.dataset.nav === route || ((route.startsWith('les/') || route === 'vragen') && a.dataset.nav === 'leren'); a.toggleAttribute('aria-current', active); });
  if (route.startsWith('les/')) renderLesson();
  else if (route === 'atlas') { resetAtlas(); renderAtlas(); }
  else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank();
  else renderHome();
}
document.addEventListener('click', event => {
  if (event.target.closest('.skip')) { event.preventDefault(); $('#main').focus(); $('#main').scrollIntoView({ block: 'start' }); return; }
  const levelButton = event.target.closest('[data-level]');
  if (levelButton && !levelButton.disabled) start(levelButton.dataset.level.split(':')[0], levelButton.dataset.level);
  if (event.target.closest('#begin-exercises')) { session = { ...session, prepared: true }; save(); renderLesson(); focusLessonContent(); }
  const pairButton = event.target.closest('[data-pair]');
  if (pairButton && !pairButton.disabled) choosePair(pairButton.dataset.pair, pairButton.dataset.side);
  const startButton = event.target.closest('[data-start]');
  const answerButton = event.target.closest('[data-answer]');
  const muscleButton = event.target.closest('[data-muscle]');
  const viewButton = event.target.closest('[data-view]');
  if (startButton && !startButton.disabled) start(startButton.dataset.start);
  if (answerButton && !answerButton.disabled) chooseAnswer(Number(answerButton.dataset.answer));
  if (event.target.closest('#confirm-answer:not(:disabled)')) confirmPointSelection();
  if (event.target.closest('#confirm-choice-answer:not(:disabled)')) confirmChoiceSelection();
  if (event.target.closest('#continue-interlude')) dismissInterlude();
  if (event.target.closest('#self-assess-correct')) selfAssessOpenAnswer(true);
  if (event.target.closest('#self-assess-retry')) selfAssessOpenAnswer(false);
  if (muscleButton) { showMuscle(muscleButton.dataset.muscle); $('#muscle-card-title')?.focus(); }
  if (viewButton) { viewer?.view(viewButton.dataset.view); $('#orientation').textContent = { front: 'VOORZIJDE', back: 'ACHTERZIJDE', side: 'ZIJAANZICHT' }[viewButton.dataset.view]; }
  if (event.target.closest('#next-question')) next();
  if (event.target.closest('#skip-question')) next(true);
  if (event.target.closest('#all-muscles')) { resetAtlas(); renderAtlas(); }
  if (event.target.closest('#reset-view')) { viewer?.view('front'); $('#orientation').textContent = 'VOORZIJDE'; }
  if (event.target.closest('#credits-button')) $('#credits').showModal();
  if (event.target.closest('.close-dialog')) $('#credits').close();
});
document.addEventListener('submit', event => { if (event.target.id === 'open-answer-form') { event.preventDefault(); submitOpenAnswer(); } });
document.addEventListener('input', event => {
  if (event.target.id === 'question-search') filterQuestionBank();
  if (event.target.id === 'open-answer') updateOpenDraft(event.target.value);
});
document.addEventListener('change', event => { if (event.target.id === 'question-chapter') filterQuestionBank(); });
document.addEventListener('keydown', event => {
  if (event.repeat && event.key === 'Enter' && route.startsWith('les/') && !/INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) { event.preventDefault(); return; }
  if (event.repeat || event.isComposing || event.altKey || event.ctrlKey || event.metaKey || !session?.prepared || (needsMatching()) || !route.startsWith('les/') || $('#credits').open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (event.key === 'Enter' && event.target.tagName !== 'BUTTON' && event.target.tagName !== 'A') {
    if ($('#continue-interlude')) { event.preventDefault(); dismissInterlude(); }
    else if (session.response) { event.preventDefault(); next(); }
    else if (pendingPointSelection) { event.preventDefault(); confirmPointSelection(); }
    else if (pendingChoiceSelection) { event.preventDefault(); confirmChoiceSelection(); }
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
  catch { event.target.checked = false; $('#viewer-status').hidden = false; $('#viewer-status').textContent = 'Skelet niet geladen. Probeer opnieuw.'; }
});
$('#isolate').addEventListener('change', event => viewer?.setIsolated(event.target.checked));
window.addEventListener('hashchange', navigate);
window.matchMedia('(max-width:620px)').addEventListener('change', arrangeModelQuestion);
window.addEventListener('storage', event => {
  if ([PROGRESS_KEY, GAME_KEY].includes(event.key)) { refreshProgress(); if (route === 'leren') renderHome(); else if (route === 'voortgang') renderProgress();
  else if (route === 'vragen') renderQuestionBank(); }
});
const modelPrompt = document.createElement('p');
modelPrompt.id = 'model-prompt'; modelPrompt.tabIndex = -1; modelPrompt.className = 'model-prompt'; modelPrompt.hidden = true;
$('.atlas-top').after(modelPrompt);
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
    for (const option of $('#muscle-select').options) if (option.value && !viewer.available.has(option.value)) option.disabled = true;
    if (route.startsWith('les/')) renderLesson();
    await viewer.showSkeleton($('#bones').checked);
  } catch {
    $('#viewer-status').hidden = false;
    $('#viewer-status').innerHTML = '3D-model niet geladen. <button id="retry-viewer">Opnieuw proberen</button>';
    $('#retry-viewer').addEventListener('click', () => { viewer?.dispose(); viewer = null; $('#viewer-status').textContent = 'Spieren laden…'; initViewer(); });
  }
}
initViewer();
