import './style.css';
import curriculum from './data/curriculum.json';
import { topics, readProgress, readSession, recordAnswer, lessonQueue, optionsFor, masteryFor, PROGRESS_KEY, SESSION_KEY } from './learning.js';

const $ = selector => document.querySelector(selector);
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const iconNames = { school: 'school', stretch: 'stretching', barbell: 'barbell', target: 'target-arrow', arrows: 'arrows-move', growth: 'chart-bar' };
const icon = name => '<img class="icon" src="' + import.meta.env.BASE_URL + 'icons/' + (iconNames[name] || name) + '.svg" alt="" />';
let storage;
try { storage = window.localStorage; } catch { storage = { getItem() { return null; }, setItem() { throw new Error('Storage blocked'); } }; }
let progress = readProgress(storage);
let session = null;
let viewer = null;
let route = '';
let storageAvailable = true;
const byId = new Map(curriculum.questions.map(q => [q.id, q]));
session = readSession(storage, byId);
function save() {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(progress));
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
function renderHome() {
  intro('Leer het lichaam <em>kennen.</em>', 'Van spiernaam tot beweging: ontdek de atlas en oefen in korte lessen.');
  const answered = Object.keys(progress.questions).length;
  const due = dueCount();
  $('#learning').innerHTML = '<div class="daily-card"><div class="daily-icon">' + icon('sparkles') + '</div><span class="eyebrow">EEN KLEINE STAP, ELKE DAG</span><h2>Je dagelijkse tien.</h2><p>Een mix van nieuwe vragen en wat je al hebt geleerd. Foutje gemaakt? Die komt nog een keer terug.</p><button class="primary" data-start="daily">Start je les ' + icon('arrow-right') + '</button><span class="small">10 vragen · op jouw tempo</span></div>' +
    '<div class="section-heading"><h2>Jouw hoofdstukken</h2><span>' + curriculum.questions.length + ' vragen</span></div>' +
    '<div class="topic-list">' + topics.map(topic => {
      const questions = curriculum.questions.filter(q => q.region === topic.id);
      const learned = questions.filter(q => progress.questions[q.id]).length;
      return '<button class="topic" data-start="' + topic.id + '"><span class="topic-icon">' + icon(topic.icon) + '</span><span class="topic-text"><strong>' + topic.title + '</strong><span>' + topic.subtitle + '</span><progress max="' + questions.length + '" value="' + learned + '" aria-label="' + escape(topic.title) + ': ' + learned + ' van ' + questions.length + ' vragen geoefend"></progress></span><span class="topic-end">' + learned + '/' + questions.length + icon('arrow-right') + '</span></button>';
    }).join('') + '</div><div class="quiet-note">' + answered + ' vragen ontdekt' + (due ? ' · ' + due + ' klaar om te herhalen' : ' · elke herhaling telt') + '</div>';
  resetAtlas();
}
function resetAtlas() {
  $('#muscle-select').disabled = false;
  $('#muscle-select').value = '';
  $('#isolate').checked = false;
  viewer?.setIsolated(false);
  viewer?.select(null);
  $('#orientation').textContent = 'VOORZIJDE';
  $('#selection-card').innerHTML = '<span class="eyebrow">BEGIN MET ONTDEKKEN</span><h3>Tik een spier aan</h3><p>Draai het lichaam en ontdek hoe alles samenwerkt.</p>';
}
function start(region) {
  if (!session || session.region !== region || session.finished) {
    const queue = lessonQueue(curriculum.questions, progress, { region, availableMuscles: viewer?.available });
    session = { region, ids: queue.map(q => q.id), index: 0, correct: 0, answered: 0, retryIds: [], options: [], response: null, finished: false };
    if (queue.length) session.options = optionsFor(queue[0]);
    save();
  }
  const nextHash = '#les/' + region;
  if (location.hash === nextHash) { renderLesson(); window.scrollTo(0, 0); }
  else location.hash = nextHash;
}
function renderLesson() {
  if (!session || session.region !== route.split('/')[1]) { start(route.split('/')[1] || 'daily'); return; }
  if (!session.ids.length) {
    intro('Alles is nog <em>vers.</em>', 'Er zijn nu geen vragen die aan herhaling toe zijn.');
    $('#learning').innerHTML = '<div class="empty-card"><h2>Goed moment voor iets nieuws.</h2><p>Vragen komen na 1, 2, 4 en meer dagen terug. Je kunt intussen een hoofdstuk oefenen.</p><button class="primary" data-start="daily">Start een gemengde les</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';
    resetAtlas(); return;
  }
  if (session.index >= session.ids.length) { finish(); return; }
  const q = byId.get(session.ids[session.index]);
  const title = topics.find(t => t.id === session.region)?.title || (session.region === 'review' ? 'Even opfrissen' : 'Je dagelijkse tien');
  intro(title + '.', 'Oefen de vragen en bekijk daarna de uitleg uit je lesstof.', 'VRAAG ' + (session.index + 1) + ' VAN ' + session.ids.length);
  const response = session.response;
  const isCorrect = response === q.answer;
  const recognitionBlocked = q.type === 'recognition' && !viewer?.available.has(q.muscleId);
  $('#learning').innerHTML = '<div class="lesson-top"><a href="#leren">← Leerpad</a><span>' + session.correct + ' goed</span></div><progress class="lesson-progress" max="' + session.ids.length + '" value="' + session.index + '" aria-label="Lesvoortgang"></progress>' +
    '<article class="question-card"><span class="tag">' + (q.type === 'recognition' ? 'HERKEN DE SPIER' : q.muscleId ? 'SPIERKENNIS' : 'BEGRIJP DE BEWEGING') + '</span><h2 tabindex="-1" id="question-title">' + escape(q.prompt) + '</h2>' +
    (q.type === 'recognition' ? '<p class="question-hint">Bekijk de paarse spier in het 3D-model. Je mag het lichaam draaien en de spier isoleren.</p>' : '') +
    (recognitionBlocked ? '<p role="status">Het 3D-model is nog niet beschikbaar. Wacht even of sla deze vraag over.</p>' : '') +
    '<div class="answers">' + session.options.map((option, i) => '<button data-answer="' + i + '" class="answer ' + (response ? option === q.answer ? 'correct' : option === response ? 'incorrect' : '' : '') + '" ' + (response || recognitionBlocked ? 'disabled' : '') + '><span class="answer-key">' + (i + 1) + '</span><span>' + escape(option) + '</span>' + (response && option === q.answer ? icon('check') : '') + '</button>').join('') + '</div>' +
    (response ? '<div class="feedback ' + (isCorrect ? 'success' : 'retry') + '" role="status"><strong>' + (isCorrect ? 'Ja, die heb je!' : 'Bijna. Deze nemen we nog een keer mee.') + '</strong><p>' + (isCorrect ? escape(q.answer) : 'Het juiste antwoord: ' + escape(q.answer)) + '</p></div>' + sourceMarkup(q.source) + '<button class="primary next-button" id="next-question">' + (session.index + 1 >= session.ids.length ? 'Bekijk je resultaat' : 'Volgende vraag') + icon('arrow-right') + '</button>' : '<button class="text-button" id="skip-question">Deze vraag overslaan</button>') +
    '</article><p class="privacy-note">' + (storageAvailable ? 'Je voortgang wordt alleen in deze browser bewaard.' : 'Opslaan lukt niet. Je voortgang blijft alleen in deze sessie beschikbaar.') + '</p>';
  const card = curriculum.cards.find(c => c.id === q.muscleId);
  $('#muscle-select').disabled = !response;
  if (card) {
    viewer?.select(card.id, card.view, q.type === 'recognition');
    $('#orientation').textContent = card.view === 'back' ? 'ACHTERZIJDE' : card.view === 'side' ? 'ZIJAANZICHT' : 'VOORZIJDE';
    $('#selection-card').innerHTML = !response ? q.type === 'recognition' ? '<span class="eyebrow">KIJK GOED</span><h3>Welke spier is dit?</h3><p>Paars licht de doelspier uit, ook wanneer ze onder een andere spier ligt.</p>' : '<span class="eyebrow">SPIER IN BEELD</span><h3>' + escape(card.name) + '</h3><p>De uitleg zie je na je antwoord.</p>' : cardMarkup(card);
  } else { resetAtlas(); $('#muscle-select').disabled = !response; }
}
function answer(index) {
  if (!session || session.response || session.finished) return;
  const q = byId.get(session.ids[session.index]);
  if (q.type === 'recognition' && !viewer?.available.has(q.muscleId)) return;
  const response = session.options[index];
  if (!response) return;
  const correct = response === q.answer;
  session = { ...session, response, correct: session.correct + Number(correct), answered: session.answered + 1 };
  if (!correct && !session.retryIds.includes(q.id)) session = { ...session, ids: [...session.ids, q.id], retryIds: [...session.retryIds, q.id] };
  progress = recordAnswer(progress, q.id, correct);
  save(); renderLesson();
  $('#next-question').focus();
}
function next(skip = false) {
  if (!session || (!skip && !session.response)) return;
  const index = session.index + 1;
  session = { ...session, index, response: null, options: index < session.ids.length ? optionsFor(byId.get(session.ids[index])) : [] };
  save(); renderLesson();
  $('#question-title')?.focus();
}
function finish() {
  if (!session.finished) {
    session = { ...session, finished: true };
    progress = { ...progress, sessions: [...progress.sessions, { at: Date.now(), correct: session.correct, total: session.answered }].slice(-200) };
    save();
  }
  intro('Weer een beetje <em>wijzer.</em>', 'Kleine stappen worden samen een hoop kennis.', 'LES AFGEROND');
  $('#learning').innerHTML = '<div class="result-card"><span class="result-icon">' + icon('check') + '</span><h2>Les afgerond!</h2><div class="result-score">' + session.correct + '<span> / ' + session.answered + '</span></div><p>Antwoorden goed, inclusief herhalingen.</p><p>' + (session.retryIds.length ? session.retryIds.length === 1 ? 'Eén lastige vraag kwam nog een keer terug. Je ziet die later opnieuw.' : session.retryIds.length + ' lastige vragen kwamen nog een keer terug. Je ziet ze later opnieuw.' : 'Je volgende herhaling staat klaar zodra het tijd is.') + '</p><button class="primary" data-start="daily">Nog een les ' + icon('arrow-right') + '</button><a class="text-link" href="#leren">Terug naar je leerpad</a></div>';
  resetAtlas();
}
function cardMarkup(card) {
  return '<span class="eyebrow">' + escape(topics.find(t => t.id === card.region)?.title || 'SPIER') + '</span><h3>' + escape(card.name) + '</h3><p>' + escape(card.fields.functie || '') + '</p>';
}
function showMuscle(id, originalName) {
  if (route.startsWith('les/') && session && !session.finished && !session.response) return;
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
  $('#learning').innerHTML = '<div class="stats"><div><strong>' + seen + '</strong><span>vragen geoefend</span></div><div><strong>' + progress.sessions.length + '</strong><span>lessen afgerond</span></div><div><strong>' + mastery + '%</strong><span>herhaald beheerst</span></div></div><div class="review-card"><h2>' + (due ? due + ' vragen klaar om op te frissen.' : 'Je herhalingen zijn bijgewerkt.') + '</h2><p>Goed? Dan over 1, 2, 4, 8 en meer dagen opnieuw. Fout? Dan tijdens de les nog een keer, en later weer.</p><button class="primary" data-start="review" ' + (!due ? 'disabled' : '') + '>Start herhaling ' + icon('refresh') + '</button></div><div class="section-heading"><h2>Per hoofdstuk</h2></div><div class="progress-topics">' + topics.map(t => {
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
  if (!route.startsWith('les/') || $('#credits').open || /INPUT|SELECT|TEXTAREA/.test(event.target.tagName)) return;
  if (/^[1-4]$/.test(event.key)) answer(Number(event.key) - 1);
});
$('#muscle-select').addEventListener('change', event => event.target.value ? showMuscle(event.target.value) : resetAtlas());
$('#bones').addEventListener('change', async event => {
  try { await viewer?.showSkeleton(event.target.checked); }
  catch { event.target.checked = false; $('#viewer-status').hidden = false; $('#viewer-status').textContent = 'Skelet laden lukt niet. Zet de schakelaar opnieuw aan om te proberen.'; }
});
$('#isolate').addEventListener('change', event => viewer?.setIsolated(event.target.checked));
window.addEventListener('hashchange', navigate);
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
