import './style.css';
import curriculum from './data/curriculum.json';
import { topics, readProgress, readSession, recordAnswer, lessonQueue, optionsFor, masteryFor, PROGRESS_KEY, SESSION_KEY, GAME_KEY, DAILY_GOAL, readGame, awardXP, gameStats, levelPath, levelQuestions, completeLevel, exerciseFor, matchingPairs, shuffled, binaryResponses, varyLesson } from './learning.js';

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
let session = null;
let viewer = null;
let route = '';
let storageAvailable = true;
const byId = new Map(curriculum.questions.map(q => [q.id, q]));
session = readSession(storage, byId);
if (session) session = { ...session, matched: session.matched || [], initialCount: session.initialCount || session.ids.length, firstCorrect: session.firstCorrect || 0, xp: session.xp || 0 };
function save() {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    storage.setItem(GAME_KEY, JSON.stringify(game));
    storage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch { storageAvailable = false; }
}
function dueCount() {
  return curriculum.questions.filter(q => progress.questions[q.id]?.due <= Date.now()).length;
}
function sourceMarkup(source) {
  return '<details class="source"><summary>' + icon('book-2') + ' Bron van deze vraag</summary><p>' + escape(source.title) + ' · ' + escape(source.section) + '</p><a href="' + curriculum.sourceUrl + '" target="_blank" rel="noreferrer">Open de cheatsheet ↗</a></details>';
}
function intro(title, description, eyebrow = 'JOUW PERSOONLIJKE LEERPAD') {
  $('#intro').innerHTML = '<span class="eyebrow">' + eyebrow + '</span><h1>' + title + '</h1><p>' + description + '</p>';
}
function gameMarkup() {
  const stats = gameStats(game);
  return '<div class="game-bar" aria-label="Je leerbeloningen"><span>' + icon('sparkles') + '<strong>' + stats.xp + ' XP</strong></span><span>' + icon('refresh') + '<strong>' + stats.streak + (stats.streak === 1 ? ' dag streak' : ' dagen streak') + '</strong></span><span>' + game.completed.length + '/33 levels</span></div><div class="goal-card"><div><strong>Dagdoel</strong><span>' + Math.min(stats.today, DAILY_GOAL) + '/' + DAILY_GOAL + ' XP' + (stats.today >= DAILY_GOAL ? ' · gehaald!' : '') + '</span></div><progress max="' + DAILY_GOAL + '" value="' + Math.min(stats.today, DAILY_GOAL) + '" aria-label="Dagdoel in XP"></progress><p>Goed antwoord: 5 XP. Les afgerond: 10 XP. Haal elke dag je doel voor je streak.</p></div>';
}
function renderHome() {
  intro('Een level dichter bij <em>begrip.</em>', 'Volg je leerpad. Ontdek, oefen en laat zien wat je weet.');
  const levels = levelPath(game);
  const current = levels.find(level => !level.done);
  const due = dueCount();
  $('#learning').innerHTML = gameMarkup() + '<div class="daily-card"><span class="eyebrow">' + (current ? 'JOUW VOLGENDE STAP' : 'LEERPAD AFGEROND') + '</span><h2>' + (current ? escape(current.topic.title) : 'Blijf je kennis oefenen.') + '</h2><p>' + (current ? current.label + ' · level ' + (current.stage + 1) + ' van 3' : 'Je hebt alle checkpoints gehaald. Tijd voor een gemengde les.') + '</p><button class="primary" ' + (current ? 'data-level="' + current.id + '"' : 'data-start="daily"') + '>' + (session && !session.finished && session.levelId === current?.id ? 'Ga verder' : 'Start je level') + icon('arrow-right') + '</button></div><div class="section-heading"><h2>Jouw leerpad</h2><span>11 hoofdstukken · 33 levels</span></div><div class="learning-path">' + topics.map((topic, chapter) => '<section class="path-chapter"><div class="chapter-heading"><span>' + (chapter + 1) + '</span><div><h3>' + topic.title + '</h3><p>' + topic.subtitle + '</p></div></div><ol>' + levels.filter(level => level.topic.id === topic.id).map(level => '<li class="path-step ' + (level.done ? 'done' : level.locked ? 'locked' : 'current') + '"><button class="level-node" data-level="' + level.id + '" ' + (level.locked ? 'disabled' : '') + ' aria-label="' + escape(topic.title + ': ' + level.label + (level.done ? ', voltooid, opnieuw oefenen' : level.locked ? ', vergrendeld' : ', volgende level')) + '">' + (level.done ? icon('check') : level.stage === 2 ? icon('target') : icon(topic.icon)) + '</button><span><strong>' + level.label + '</strong><small>' + (level.done ? 'Voltooid · oefen opnieuw' : level.locked ? 'Rond de vorige level af' : 'Klaar om te starten') + '</small></span></li>').join('') + '</ol></section>').join('') + '</div><div class="practice-actions"><button class="primary" data-start="daily">Gemengde les</button><button class="text-button" data-start="review" ' + (!due ? 'disabled' : '') + '>Herhalen (' + due + ')</button></div><p class="privacy-note">Levels openen bij minstens 80% goed op de eerste poging. De atlas en gemengde lessen blijven vrij toegankelijk.</p>';
  resetAtlas();
}
function resetAtlas() {
  $('#model-prompt')?.setAttribute('hidden', '');
  $('#muscle-select').disabled = false;
  $('#muscle-select').value = '';
  $('#isolate').checked = false;
  viewer?.setIsolated(false);
  viewer?.select(null);
  $('#orientation').textContent = 'VOORZIJDE';
  $('#selection-card').innerHTML = '<span class="eyebrow">BEGIN MET ONTDEKKEN</span><h3>Tik een spier aan</h3><p>Draai het lichaam en ontdek hoe alles samenwerkt.</p>';
}
function start(region, levelId = null) {
  if (levelId && !levelPath(game).some(level => level.id === levelId && !level.locked)) return;
  if (!session || session.region !== region || session.finished || session.levelId !== levelId) {
    pairSelection = null; pairMessage = '';
    const stage = levelId ? Number(levelId.split(':')[1]) : null;
    const pool = levelId ? levelQuestions(curriculum.questions, region, stage) : curriculum.questions;
    const queue = varyLesson(levelId ? shuffled(pool) : lessonQueue(pool, progress, { region, availableMuscles: viewer?.available }));
    session = { region, levelId, stage, startedAt: Date.now(), xp: 0, firstCorrect: 0, initialCount: queue.length, prepared: false, matched: [], pairingDone: false, ids: queue.map(q => q.id), index: 0, correct: 0, answered: 0, retryIds: [], options: [], response: null, finished: false };
    if (queue.length) session.options = optionsFor(queue[0]);
    save();
  }
  const nextHash = '#les/' + region;
  if (location.hash === nextHash) { renderLesson(); window.scrollTo(0, 0); }
  else location.hash = nextHash;
}
function renderPreparation() {
  const topic = topics.find(t => t.id === session.region);
  const card = curriculum.cards.find(c => c.region === session.region);
  const q = byId.get(session.ids[0]);
  intro(topic ? topic.title + '.' : 'Even opwarmen.', 'Eerst een korte uitleg, daarna oefenen.', 'VOOR JE BEGINT');
  $('#learning').innerHTML = '<article class="explore-card lesson-brief"><span class="tag">' + (session.levelId ? ['ONTDEKKEN', 'OEFENEN', 'CHECKPOINT'][session.stage] : 'GEMENGDE LES') + '</span><h2>' + (card ? escape(card.name) : 'Neem dit mee') + '</h2><p>' + escape(card ? card.fields.functie : q.prompt + ' ' + q.answer) + '</p>' + (card ? '<dl><div><dt>Oorsprong</dt><dd>' + escape(card.fields.oorsprong) + '</dd></div><div><dt>Aanhechting</dt><dd>' + escape(card.fields.aanhechting) + '</dd></div></dl>' : '') + sourceMarkup(card ? card.source : q.source) + '<p class="brief-note">' + session.ids.length + ' vragen · 5 XP per goed antwoord · fouten oefen je nog één keer. Overslaan kan, maar telt niet als goed.</p><button id="begin-exercises" class="primary">Ik ben klaar ' + icon('arrow-right') + '</button></article>';
  resetAtlas();
  if (card) { viewer?.select(card.id, card.view); $('#selection-card').innerHTML = cardMarkup(card); }
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
  intro('Wat hoort <em>bij elkaar?</em>', 'Kies een spier en daarna de bijbehorende functie.', 'KOPPEL DE PAREN');
  const button = (pair, side) => '<button class="pair-card ' + (session.matched.includes(pair.id) ? 'matched' : pairSelection?.id === pair.id && pairSelection.side === side ? 'selected' : '') + '" data-pair="' + pair.id + '" data-side="' + side + '" aria-pressed="' + (pairSelection?.id === pair.id && pairSelection.side === side) + '" ' + (session.matched.includes(pair.id) ? 'disabled' : '') + '>' + escape(side === 'name' ? pair.name : pair.function) + (session.matched.includes(pair.id) ? ' ✓' : '') + '</button>';
  $('#learning').innerHTML = '<article class="question-card"><h2 tabindex="-1" id="question-title">Koppel spier en functie</h2><div class="matching-grid"><div>' + pairs.map(pair => button(pair, 'name')).join('') + '</div><div>' + session.pairOrder.map(id => pairs.find(pair => pair.id === id)).filter(Boolean).map(pair => button(pair, 'function')).join('') + '</div></div><p class="pair-status" role="status">' + escape(pairMessage || session.matched.length + '/' + pairs.length + ' paren gevonden') + '</p></article>';
  resetAtlas();
}
function choosePair(id, side) {
  if (!pairSelection || pairSelection.side === side) { pairSelection = { id, side }; pairMessage = 'Kies nu de bijbehorende ' + (side === 'name' ? 'functie.' : 'spier.'); }
  else {
    const correct = pairSelection.id === id;
    pairSelection = null;
    pairMessage = correct ? 'Ja, dit paar klopt!' : 'Deze horen niet bij elkaar. Probeer een ander paar.';
    if (correct) session = { ...session, matched: [...session.matched, id] };
    if (session.matched.length === matchingPairs(curriculum.cards, session.region).length) {
      session = { ...session, pairingDone: true }; pairMessage = ''; save(); renderLesson(); $('#question-title')?.focus(); return;
    }
  }
  save(); renderMatching();
  const sideToFocus = pairSelection?.side === 'name' ? 'function' : 'name';
  document.querySelector('[data-side="' + sideToFocus + '"]:not(:disabled)')?.focus();
}
function renderLesson() {
  if (!session || session.region !== route.split('/')[1]) { start(route.split('/')[1] || 'daily'); return; }
  if (!session.ids.length) {
    intro('Alles is nog <em>vers.</em>', 'Er zijn nu geen vragen die aan herhaling toe zijn.');
    $('#learning').innerHTML = '<div class="empty-card"><h2>Goed moment voor iets nieuws.</h2><p>Vragen komen na 1, 2, 4 en meer dagen terug. Je kunt intussen een hoofdstuk oefenen.</p><button class="primary" data-start="daily">Start een gemengde les</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';
    resetAtlas(); return;
  }
  if (session.index >= session.ids.length) { finish(); return; }
  if (!session.prepared) { renderPreparation(); return; }
  if (needsMatching()) { renderMatching(); return; }
  const q = byId.get(session.ids[session.index]);
  const title = topics.find(t => t.id === session.region)?.title || (session.region === 'review' ? 'Even opfrissen' : 'Je dagelijkse tien');
  intro(title + '.', 'Oefen de vragen en bekijk daarna de uitleg uit je lesstof.', 'VRAAG ' + (session.index + 1) + ' VAN ' + session.ids.length);
  const mode = exerciseFor(q, session.index);
  const response = session.response;
  const isCorrect = response === q.answer;
  const recognitionBlocked = q.type === 'recognition' && !viewer?.available.has(q.muscleId);
  $('#learning').innerHTML = '<div class="lesson-top"><a href="#leren">← Leerpad</a><span>' + session.correct + ' goed · ' + (session.xp || 0) + ' XP</span></div><progress class="lesson-progress" max="' + session.ids.length + '" value="' + session.index + '" aria-label="Lesvoortgang"></progress>' +
    '<article class="question-card"><span class="tag">' + (mode === 'point' ? 'WIJS DE SPIER AAN' : mode === 'binary' ? 'WAAR OF NIET WAAR?' : q.type === 'recognition' ? 'HERKEN DE SPIER' : q.muscleId ? 'SPIERKENNIS' : 'BEGRIJP DE BEWEGING') + '</span><h2 tabindex="-1" id="question-title">' + escape(mode === 'point' ? 'Wijs ' + q.answer + ' aan.' : q.prompt) + '</h2>' +
    (q.type === 'recognition' ? '<p class="question-hint">' + (mode === 'point' ? 'Tik de gevraagde spier aan in het lichaam. Je kunt ook een antwoordknop gebruiken.' : 'Bekijk de paarse spier in het 3D-model. Je mag het lichaam draaien en de spier isoleren.') + '</p>' : '') +
    (recognitionBlocked ? '<p role="status">Het 3D-model is nog niet beschikbaar. Wacht even of sla deze vraag over.</p>' : '') +
    (mode === 'binary' ? '<div class="statement"><span>Stelling</span><p>' + escape(session.options[0]) + '</p></div>' : '') + '<div class="answers">' + (mode === 'binary' ? binaryResponses(q, session.options) : session.options).map((option, i) => '<button data-key="' + (i + 1) + '" data-answer="' + session.options.indexOf(option) + '" class="answer ' + (response ? option === q.answer ? 'correct' : option === response ? 'incorrect' : '' : '') + '" ' + (response || recognitionBlocked ? 'disabled' : '') + '><span class="answer-key">' + (i + 1) + '</span><span>' + (mode === 'binary' ? (i === 0 ? 'Waar' : 'Niet waar') : escape(option)) + '</span>' + (response && option === q.answer ? icon('check') : '') + '</button>').join('') + '</div>' +
    (response ? '<div class="feedback ' + (isCorrect ? 'success' : 'retry') + '" role="status"><strong>' + (isCorrect ? 'Ja, die heb je!' : 'Bijna. Deze nemen we nog een keer mee.') + '</strong><p>' + (isCorrect ? escape(q.answer) : 'Het juiste antwoord: ' + escape(q.answer)) + '</p></div>' + sourceMarkup(q.source) + '<button class="primary next-button" id="next-question">' + (session.index + 1 >= session.ids.length ? 'Bekijk je resultaat' : 'Volgende vraag') + icon('arrow-right') + '</button>' : '<button class="text-button" id="skip-question">Deze vraag overslaan</button>') +
    '</article><p class="privacy-note">' + (storageAvailable ? 'Je voortgang wordt alleen in deze browser bewaard.' : 'Opslaan lukt niet. Je voortgang blijft alleen in deze sessie beschikbaar.') + '</p>';
  const card = curriculum.cards.find(c => c.id === q.muscleId);
  $('#muscle-select').disabled = !response;
  if (card) {
    viewer?.select(card.id, card.view, q.type === 'recognition', mode !== 'point' || Boolean(response));
    $('#orientation').textContent = card.view === 'back' ? 'ACHTERZIJDE' : card.view === 'side' ? 'ZIJAANZICHT' : 'VOORZIJDE';
    $('#selection-card').innerHTML = !response ? q.type === 'recognition' ? '<span class="eyebrow">KIJK GOED</span><h3>' + (mode === 'point' ? 'Waar ligt ' + escape(card.name) + '?' : 'Welke spier is dit?') + '</h3><p>' + (mode === 'point' ? 'Tik een spier aan of gebruik de antwoordknoppen.' : 'Paars licht de doelspier uit, ook wanneer ze onder een andere spier ligt.') + '</p>' : '<span class="eyebrow">SPIER IN BEELD</span><h3>' + escape(card.name) + '</h3><p>De uitleg zie je na je antwoord.</p>' : cardMarkup(card);
  } else { resetAtlas(); $('#muscle-select').disabled = !response; }
  const modelPrompt = $('#model-prompt');
  modelPrompt.hidden = q.type !== 'recognition';
  modelPrompt.textContent = mode === 'point' ? 'Wijs ' + q.answer + ' aan.' : 'Welke spier is paars gemarkeerd?';
}

function answer(index, pickedMuscle = null) {
  if (!session || !session.prepared || session.response || session.finished) return;
  const q = byId.get(session.ids[session.index]);
  if (q.type === 'recognition' && !viewer?.available.has(q.muscleId)) return;
  const response = pickedMuscle || session.options[index];
  if (!response) return;
  const correct = response === q.answer;
  session = { ...session, response, correct: session.correct + Number(correct), answered: session.answered + 1 };
  if (!correct && !session.retryIds.includes(q.id)) session = { ...session, ids: [...session.ids, q.id], retryIds: [...session.retryIds, q.id] };
  const xp = correct ? 5 : 0;
  game = awardXP(game, xp);
  session = { ...session, xp: (session.xp || 0) + xp, firstCorrect: (session.firstCorrect || 0) + Number(correct && session.index < (session.initialCount || session.ids.length)) };
  progress = recordAnswer(progress, q.id, correct);
  save(); renderLesson();
  $('#next-question').focus();
}
function next(skip = false) {
  if (!session || (!skip && !session.response)) return;
  const index = session.index + 1;
  session = { ...session, index, response: null, options: index < session.ids.length ? optionsFor(byId.get(session.ids[index])) : [] };
  save(); renderLesson();
  $('#question-title')?.focus({ preventScroll: true });
  if (window.matchMedia('(max-width:620px)').matches && document.querySelector('.question-hint')) $('.atlas-panel').scrollIntoView({ block: 'start' });
}
function finish() {
  if (!session.finished) {
    const bonus = session.answered > 0 ? 10 : 0;
    game = completeLevel(awardXP(game, bonus), session.levelId, session.firstCorrect || 0, session.initialCount || session.ids.length);
    session = { ...session, finished: true, xp: (session.xp || 0) + bonus };
    progress = { ...progress, sessions: [...progress.sessions, { at: Date.now(), correct: session.correct, total: session.answered }].slice(-200) };
    save();
  }
  const passed = session.levelId && game.completed.includes(session.levelId);
  const stats = gameStats(game);
  intro(passed ? 'Level <em>gehaald!</em>' : 'Goed <em>geoefend.</em>', passed ? 'Je volgende stap is nu open.' : 'Elke poging helpt. Bekijk wat je nu al weet.', 'LES AFGEROND');
  const nextLevel = levelPath(game).find(level => !level.done);
  $('#learning').innerHTML = '<div class="result-card celebration"><span class="result-icon">' + icon(passed ? 'target' : 'check') + '</span><h2>' + (passed ? 'Een stap verder!' : 'Les afgerond!') + '</h2><div class="reward-xp">+' + (session.xp || 0) + ' XP</div><div class="result-metrics"><span><strong>' + session.correct + '/' + session.answered + '</strong> goed met herhalingen</span><span><strong>' + (session.firstCorrect || 0) + '/' + (session.initialCount || session.ids.length) + '</strong> eerste poging</span></div><p>' + (session.levelId && !passed ? 'Voor dit level heb je minstens 80% goed op de eerste poging nodig. Probeer het opnieuw wanneer je er klaar voor bent.' : 'Je kennis groeit. Je herhalingen komen terug zodra het tijd is.') + '</p><div class="goal-result">' + (stats.today >= DAILY_GOAL ? 'Dagdoel gehaald · ' + stats.streak + (stats.streak === 1 ? ' dag streak' : ' dagen streak') : 'Nog ' + (DAILY_GOAL - stats.today) + ' XP tot je dagdoel') + '</div><button class="primary" ' + (session.levelId && !passed ? 'data-level="' + session.levelId + '"' : nextLevel ? 'data-level="' + nextLevel.id + '"' : 'data-start="daily"') + '>' + (session.levelId && !passed ? 'Oefen dit level opnieuw' : 'Volgende les') + icon('arrow-right') + '</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';

  resetAtlas();
}
function cardMarkup(card) {
  return '<span class="eyebrow">' + escape(topics.find(t => t.id === card.region)?.title || 'SPIER') + '</span><h3>' + escape(card.name) + '</h3><p>' + escape(card.fields.functie || '') + '</p>';
}
function showMuscle(id, originalName) {
  if (route.startsWith('les/') && session && !session.finished && !session.response) {
    const q = byId.get(session.ids[session.index]);
    if (session.prepared && exerciseFor(q, session.index) === 'point') {
      const card = curriculum.cards.find(c => c.id === id);
      const index = session.options.indexOf(card?.name);
      if (card) answer(index, card.name);
    }
    return;
  }
  const card = curriculum.cards.find(c => c.id === id);
  if (!card) {
    $('#selection-card').innerHTML = '<span class="eyebrow">ANATOMISCHE STRUCTUUR</span><h3>' + escape(originalName || 'Kies een spier') + '</h3><p>Deze structuur heeft nog geen aparte kaart in de cheatsheet.</p>'; return;
  }
  viewer?.select(card.id, card.view);
  $('#orientation').textContent = card.view === 'back' ? 'ACHTERZIJDE' : card.view === 'side' ? 'ZIJAANZICHT' : 'VOORZIJDE';
  $('#muscle-select').value = card.id;
  $('#selection-card').innerHTML = cardMarkup(card);
  if (route === 'atlas') renderAtlas(card);
}
function renderAtlas(card = null) {
  intro('Ontdek de spieren <em>in 3D.</em>', 'Ontdek een spier in 3D en verbind wat je ziet met wat je moet weten.', 'JOUW ANATOMIE-ATLAS');
  if (!card) {
    $('#learning').innerHTML = '<article class="explore-card"><span class="tag">31 SPIERKAARTEN</span><h2>Van plaatje naar begrip.</h2><p>Kies een spier in het model of in de lijst. Je ziet de functie, oorsprong, aanhechting en maximale rek uit je lesmateriaal.</p><div class="atlas-muscles">' + curriculum.cards.map(c => '<button class="muscle-chip" data-muscle="' + c.id + '">' + escape(c.name) + '</button>').join('') + '</div></article>'; return;
  }
  $('#learning').innerHTML = '<article class="explore-card"><span class="tag">' + escape(topics.find(t => t.id === card.region).title) + '</span><h2>' + escape(card.name) + '</h2><dl>' + Object.entries(card.fields).map(([field, value]) => '<div><dt>' + escape(field) + '</dt><dd>' + escape(value) + '</dd></div>').join('') + '</dl>' + sourceMarkup(card.source) + '<button class="primary" data-start="' + card.region + '">Oefen dit hoofdstuk ' + icon('arrow-right') + '</button><button class="text-button" id="all-muscles">Alle spierkaarten</button></article>';
}
function renderProgress() {
  intro('Kijk eens hoe ver je <em>komt.</em>', 'Bekijk wat je hebt geoefend en welke vragen aan herhaling toe zijn. Vragen die je vaker goed beantwoordt, komen minder snel terug.', 'JOUW VOORTGANG');
  const seen = Object.keys(progress.questions).length;
  const due = dueCount();
  const mastery = masteryFor(curriculum.questions, progress);
  $('#learning').innerHTML = gameMarkup() + '<div class="stats"><div><strong>' + seen + '</strong><span>vragen geoefend</span></div><div><strong>' + progress.sessions.length + '</strong><span>lessen afgerond</span></div><div><strong>' + mastery + '%</strong><span>herhaald beheerst</span></div></div><div class="review-card"><h2>' + (due ? due + ' vragen klaar om op te frissen.' : 'Je herhalingen zijn bijgewerkt.') + '</h2><p>Goed? Dan over 1, 2, 4, 8 en meer dagen opnieuw. Fout? Dan tijdens de les nog een keer, en later weer.</p><button class="primary" data-start="review" ' + (!due ? 'disabled' : '') + '>Start herhaling ' + icon('refresh') + '</button></div><div class="section-heading"><h2>Per hoofdstuk</h2></div><div class="progress-topics">' + topics.map(t => {
    const qs = curriculum.questions.filter(q => q.region === t.id);
    const seen = qs.filter(q => progress.questions[q.id]).length;
    return '<div><strong>' + t.title + '</strong><span>' + seen + ' / ' + qs.length + ' geoefend · ' + masteryFor(qs, progress) + '% beheerst</span><progress max="' + qs.length + '" value="' + seen + '" aria-label="' + t.title + ' geoefend"></progress></div>';
  }).join('') + '</div><p class="privacy-note">Beheerst betekent: minstens drie goede antwoorden met toenemende intervallen, en het laatste antwoord goed. Voortgang is gekoppeld aan deze browser.</p>';
  resetAtlas();
}
function navigate() {
  window.scrollTo(0, 0);
  route = location.hash.slice(1) || 'leren';
  document.querySelectorAll('[data-nav]').forEach(a => { const active = a.dataset.nav === route || (route.startsWith('les/') && a.dataset.nav === 'leren'); a.toggleAttribute('aria-current', active); });
  if (route.startsWith('les/')) renderLesson();
  else if (route === 'atlas') { resetAtlas(); renderAtlas(); }
  else if (route === 'voortgang') renderProgress();
  else renderHome();
}
document.addEventListener('click', event => {
  const levelButton = event.target.closest('[data-level]');
  if (levelButton && !levelButton.disabled) start(levelButton.dataset.level.split(':')[0], levelButton.dataset.level);
  if (event.target.closest('#begin-exercises')) { session = { ...session, prepared: true }; save(); renderLesson(); $('#question-title')?.focus(); }
  const pairButton = event.target.closest('[data-pair]');
  if (pairButton && !pairButton.disabled) choosePair(pairButton.dataset.pair, pairButton.dataset.side);
  const startButton = event.target.closest('[data-start]');
  const answerButton = event.target.closest('[data-answer]');
  const muscleButton = event.target.closest('[data-muscle]');
  const viewButton = event.target.closest('[data-view]');
  if (startButton && !startButton.disabled) start(startButton.dataset.start);
  if (answerButton && !answerButton.disabled) answer(Number(answerButton.dataset.answer));
  if (muscleButton) showMuscle(muscleButton.dataset.muscle);
  if (viewButton) { viewer?.view(viewButton.dataset.view); $('#orientation').textContent = { front: 'VOORZIJDE', back: 'ACHTERZIJDE', side: 'ZIJAANZICHT' }[viewButton.dataset.view]; }
  if (event.target.closest('#next-question')) next();
  if (event.target.closest('#skip-question')) next(true);
  if (event.target.closest('#all-muscles')) { resetAtlas(); renderAtlas(); }
  if (event.target.closest('#reset-view')) { viewer?.view('front'); $('#orientation').textContent = 'VOORZIJDE'; }
  if (event.target.closest('#credits-button')) $('#credits').showModal();
  if (event.target.closest('.close-dialog')) $('#credits').close();
});
document.addEventListener('keydown', event => {
  if (!session?.prepared || (needsMatching()) || !route.startsWith('les/') || $('#credits').open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (/^[1-4]$/.test(event.key)) {
    const button = document.querySelector('[data-key="' + event.key + '"]');
    if (button && !button.disabled) answer(Number(button.dataset.answer));
  }
});
$('#muscle-select').addEventListener('change', event => event.target.value ? showMuscle(event.target.value) : resetAtlas());
$('#bones').addEventListener('change', async event => {
  try { await viewer?.showSkeleton(event.target.checked); }
  catch { event.target.checked = false; $('#viewer-status').hidden = false; $('#viewer-status').textContent = 'Skelet laden lukt niet. Zet de schakelaar opnieuw aan om te proberen.'; }
});
$('#isolate').addEventListener('change', event => viewer?.setIsolated(event.target.checked));
window.addEventListener('hashchange', navigate);
const modelPrompt = document.createElement('p');
modelPrompt.id = 'model-prompt'; modelPrompt.className = 'model-prompt'; modelPrompt.hidden = true;
$('.atlas-top').after(modelPrompt);
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
    $('#viewer-status').innerHTML = 'Het 3D-model kon niet laden. Je kunt de tekstvragen gewoon oefenen. <button id="retry-viewer">Opnieuw proberen</button>';
    $('#retry-viewer').addEventListener('click', () => { viewer?.dispose(); viewer = null; $('#viewer-status').textContent = 'Spieren laden…'; initViewer(); });
  }
}
initViewer();
