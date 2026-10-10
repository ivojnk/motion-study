import { createProgressBackup, parseProgressBackup, restoreProgressBackup, MAX_BACKUP_BYTES } from './progress-transfer.js';
import { topics } from './learning.js';
import { PROGRESS_KEYS } from '../shared/progress.mjs';

export const RECOVERY_SELECTION_KEY = 'motionstudy.recovery.selection.v1';
const LOCAL_RECOVERY_KEY = 'motionstudy.sync.recovery.v1';
const SERVER_RECOVERY_KEY = 'motionstudy.sync.server-recovery.v1';
const ROLLBACK_KEY = 'motionstudy.sync.rollback.v1';
const knownKeys = [...PROGRESS_KEYS, 'lottequiz.v1', 'motionstudy.game.v1', LOCAL_RECOVERY_KEY, SERVER_RECOVERY_KEY, ROLLBACK_KEY];
const names = ['progress', 'game', 'drafts', 'session'];
export const recoverySnapshot = data => Object.fromEntries(PROGRESS_KEYS.map((key, index) => [key, JSON.stringify(data[names[index]])]));
const readerFor = snapshot => ({ getItem: key => snapshot[key] ?? null });

function safeJson(raw) {
  if (new TextEncoder().encode(raw).length > MAX_BACKUP_BYTES) throw new Error('Te groot.');
  return JSON.parse(raw, (key, value) => {
    if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error('Ongeldige gegevens.');
    return value;
  });
}
export function recoverySummary(data) {
  const days = Object.entries(data.game.days);
  const timestamps = [...data.progress.sessions.map(session => session.at), data.session?.startedAt, data.session?.finishedAt,
    ...Object.values(data.drafts).flatMap(draft => [draft.startedAt, draft.finishedAt]),
    ...days.map(([day]) => Date.parse(day + 'T12:00:00Z'))].filter(Number.isFinite);
  return { xp: days.reduce((sum, [, xp]) => sum + xp, 0), completed: data.game.completed.length,
    questions: Object.keys(data.progress.questions).length, drafts: Object.keys(data.drafts).length,
    lastAt: timestamps.length ? Math.max(...timestamps) : null };
}
function hasProgress(data) {
  const summary = recoverySummary(data);
  return Boolean(summary.xp || summary.completed || summary.questions || summary.drafts || data.session || data.progress.sessions.length);
}
function candidateFrom(reader, source, accountId, username) {
  for (const key of knownKeys.filter(key => ![LOCAL_RECOVERY_KEY, SERVER_RECOVERY_KEY, ROLLBACK_KEY].includes(key))) {
    const raw = reader.getItem(key);
    if (raw !== null) safeJson(raw);
  }
  const backup = createProgressBackup(reader);
  const data = parseProgressBackup(JSON.stringify(backup));
  // Don't present corrupted records discarded by the normal startup readers as
  // a successfully recovered version.
  const originalProgress = reader.getItem(PROGRESS_KEYS[0]) || reader.getItem('lottequiz.v1');
  if (originalProgress && Object.keys(safeJson(originalProgress).questions || {}).length !== Object.keys(data.progress.questions).length) throw new Error('Onleesbare voortgang.');
  const rawGame = reader.getItem(PROGRESS_KEYS[1]);
  if (rawGame) {
    const original = safeJson(rawGame);
    if (Object.keys(original.days || {}).length !== Object.keys(data.game.days).length || !Array.isArray(original.completed) || original.completed.length !== data.game.completed.length) throw new Error('Onleesbare voortgang.');
  }
  const rawDrafts = reader.getItem(PROGRESS_KEYS[2]);
  if (rawDrafts && Object.keys(safeJson(rawDrafts) || {}).length !== Object.keys(data.drafts).length) throw new Error('Onleesbare voortgang.');
  const rawSession = reader.getItem(PROGRESS_KEYS[3]);
  if (rawSession && safeJson(rawSession) !== null && !data.session) throw new Error('Onleesbare voortgang.');
  return hasProgress(data) ? { source, accountId, username, data, summary: recoverySummary(data) } : null;
}

// Read only, restricted to known learning keys. Cookies, analytics and other site
// data never become recovery candidates, and original account scopes stay intact.
export function scanProgressRecovery(storage, currentAccount = null) {
  const prefixes = new Set(['']);
  for (let index = 0; index < storage.length; index++) {
    const key = storage.key(index);
    if (!key?.startsWith('motionstudy.account.')) continue;
    const suffix = knownKeys.find(name => key.endsWith('.' + name));
    if (suffix) prefixes.add(key.slice(0, -suffix.length));
  }
  const candidates = [];
  let unreadable = 0;
  let profile = 0;
  for (const prefix of prefixes) {
    const accountId = prefix ? prefix.slice('motionstudy.account.'.length, -1) : null;
    const username = prefix ? storage.getItem(prefix + 'username') || (currentAccount?.id === accountId ? currentAccount.username : null) : null;
    const label = prefix ? username || 'Profiel ' + (++profile) : storage.getItem(PROGRESS_KEYS[0]) || storage.getItem(PROGRESS_KEYS[1]) ? 'Deze app op dit apparaat' : 'Oudere versie op dit apparaat';
    const reader = { getItem: key => storage.getItem(prefix + key) };
    try {
      const candidate = candidateFrom(reader, label, accountId, username);
      if (candidate) candidates.push(candidate);
    } catch { unreadable++; }
    if ((reader.getItem(PROGRESS_KEYS[0]) || reader.getItem(PROGRESS_KEYS[1])) && (reader.getItem('lottequiz.v1') || reader.getItem('motionstudy.game.v1'))) {
      try {
        const legacy = { getItem: key => ['lottequiz.v1', 'motionstudy.game.v1'].includes(key) ? reader.getItem(key) : null };
        const candidate = candidateFrom(legacy, prefix ? label + ' · oudere versie' : 'Oudere versie op dit apparaat', accountId, username);
        if (candidate) candidates.push(candidate);
      } catch { unreadable++; }
    }
    for (const [key, suffix] of [[LOCAL_RECOVERY_KEY, 'herstelkopie'], [SERVER_RECOVERY_KEY, 'vorige serverversie'], [ROLLBACK_KEY, 'onderbroken herstel']]) {
      if (key === ROLLBACK_KEY) {
        try { if (!JSON.parse(storage.getItem(prefix + 'motionstudy.sync.v1') || 'null')?.recoveryRequired) continue; }
        catch { unreadable++; continue; }
      }
      const saved = storage.getItem(prefix + key);
      if (saved) {
        try {
          const candidate = candidateFrom(readerFor(safeJson(saved)), label + ' · ' + suffix, accountId, username);
          if (candidate) candidates.push(candidate);
        } catch { unreadable++; }
      }
    }
  }
  return { candidates: uniqueRecoveryCandidates(candidates), unreadable };
}
export function uniqueRecoveryCandidates(candidates) {
  const unique = new Map();
  for (const candidate of candidates) {
    const fingerprint = JSON.stringify(candidate.data);
    const existing = unique.get(fingerprint);
    const sources = candidate.sources || [candidate.source];
    if (existing) existing.sources = [...new Set([...existing.sources, ...sources])];
    else unique.set(fingerprint, { ...candidate, sources: [...sources] });
  }
  return [...unique.values()].sort((left, right) => right.summary.completed - left.summary.completed || right.summary.xp - left.summary.xp || right.summary.questions - left.summary.questions || (right.summary.lastAt || 0) - (left.summary.lastAt || 0));
}
export function serverRecoveryCandidate(snapshot, account) {
  return candidateFrom(readerFor(snapshot), 'Server · ' + account.username, account.id, account.username);
}
export function stageProgressRecovery(storage, data) {
  const backup = { app: 'motionstudy', version: 1, data };
  parseProgressBackup(JSON.stringify(backup));
  storage.setItem(RECOVERY_SELECTION_KEY, JSON.stringify(backup));
}
export function readStagedRecovery(storage) {
  const raw = storage.getItem(RECOVERY_SELECTION_KEY);
  return raw ? parseProgressBackup(raw) : null;
}

export function setupProgressRecovery({ window, document, storage, getAccount = () => null, getServer = async () => null, restore }) {
  const dialog = document.querySelector('#progress-recovery');
  const list = document.querySelector('#progress-recovery-list');
  const status = document.querySelector('#progress-recovery-status');
  const use = document.querySelector('#progress-recovery-use');
  const closeButton = document.querySelector('#progress-recovery-close');
  const description = document.querySelector('#progress-recovery-description');
  let candidates = [];
  let trigger = null;
  let busy = false;
  let scanId = 0;
  const message = text => { status.textContent = text; };
  function close() { if (busy) return; scanId++; dialog.close(); trigger?.focus(); }
  function render() {
    list.replaceChildren();
    candidates.forEach((candidate, index) => {
      const label = document.createElement('label'); label.className = 'recovery-option';
      const input = document.createElement('input'); input.type = 'radio'; input.name = 'recovery-version'; input.value = String(index);
      const content = document.createElement('span');
      const title = document.createElement('strong'); title.textContent = candidate.sources.join(' · ');
      const details = document.createElement('span');
      details.textContent = `${candidate.summary.xp} XP · ${candidate.summary.completed} ${candidate.summary.completed === 1 ? 'les' : 'lessen'} afgerond · ${candidate.summary.questions} ${candidate.summary.questions === 1 ? 'vraag' : 'vragen'} geoefend`;
      const date = document.createElement('span');
      date.textContent = candidate.summary.lastAt ? 'Laatste leerdag: ' + new Date(candidate.summary.lastAt).toLocaleDateString('nl-NL') : 'Laatste leerdag onbekend';
      content.append(title, details, date);
      const unfinished = candidate.data.session && !candidate.data.session.finished ? candidate.data.session : Object.values(candidate.data.drafts)[0];
      if (unfinished) {
        const lesson = document.createElement('span');
        const topic = topics.find(topic => topic.id === unfinished.region);
        lesson.textContent = 'Nog bezig: ' + (topic?.name || 'een les') + ' · ' + unfinished.answered + ' antwoorden gegeven';
        content.append(lesson);
      }
      label.append(input, content); list.append(label);
    });
    use.disabled = !list.querySelector('input:checked');
  }
  async function open(button) {
    if (busy || dialog.open) return;
    trigger = button;
    const menu = document.querySelector('#account-controls');
    if (menu.contains(button)) { menu.open = false; trigger = menu.querySelector('summary'); }
    trigger.focus(); dialog.showModal();
    use.disabled = true; list.replaceChildren(); message('Voortgang zoeken…');
    const id = ++scanId;
    const account = getAccount();
    description.textContent = account ? `Je keuze vervangt de voortgang van ${account.username}. De andere lokale profielen blijven bewaard.` : 'Kies een versie. Daarna log je in met de gebruikersnaam waarvoor je deze voortgang wilt gebruiken. Die voortgang wordt vervangen.';
    try {
      const scan = scanProgressRecovery(storage, account);
      let found = scan.candidates;
      let serverUnavailable = false;
      if (account) {
        try {
          const remote = await getServer();
          if (remote?.snapshot) {
            const candidate = serverRecoveryCandidate(remote.snapshot, account);
            if (candidate) found = uniqueRecoveryCandidates([...found, candidate]);
          }
        } catch { serverUnavailable = true; }
      }
      if (id !== scanId) return;
      candidates = found;
      render();
      message(candidates.length ? [scan.unreadable ? `${scan.unreadable} opgeslagen versies zijn niet leesbaar.` : '', serverUnavailable ? 'Serverversie niet beschikbaar. Je kunt een lokale versie kiezen.' : ''].filter(Boolean).join(' ') : scan.unreadable ? 'Er staan gegevens op dit apparaat, maar er is geen leesbare voortgang gevonden.' : 'Geen bewaarde voortgang gevonden in deze app op dit apparaat.');
    } catch { message('Deze app kan de opslag niet lezen. Er is niets gewijzigd.'); }
  }
  list.addEventListener('change', () => { use.disabled = false; });
  closeButton.addEventListener('click', close);
  dialog.addEventListener('cancel', event => { event.preventDefault(); if (!busy) close(); });
  use.addEventListener('click', async () => {
    const selected = list.querySelector('input:checked');
    const candidate = selected && candidates[Number(selected.value)];
    if (!candidate || busy) return;
    busy = true; use.disabled = true; closeButton.disabled = true;
    try {
      if (getAccount() || document.querySelector('meta[name="app-edition"]')?.content === 'static') {
        await restore(candidate.data);
      } else {
        stageProgressRecovery(window.sessionStorage, candidate.data);
        busy = false;
        close();
        const input = document.querySelector('#account-username');
        if (candidate.username) input.value = candidate.username;
        const note = document.querySelector('#account-recovery-note');
        note.hidden = false; note.textContent = 'Voortgang gekozen. Log in om hiermee verder te gaan.';
        document.querySelector('#account-recovery-cancel').hidden = false;
        input.focus();
      }
    } catch { message('Herstellen lukt niet. De gevonden versies zijn behouden. Probeer opnieuw.'); use.disabled = false; }
    finally { busy = false; closeButton.disabled = false; }
  });
  return { open };
}

// Reuse the existing validating/rollback importer for the static edition.
export function restoreStaticRecovery(storage, data, withLock) {
  return withLock(() => restoreProgressBackup(storage, data));
}
