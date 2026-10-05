import curriculum from './data/curriculum.json' with { type: 'json' };
import { PROGRESS_KEY, GAME_KEY, DRAFTS_KEY, SESSION_KEY, readProgress, readGame, readDrafts, readSession } from './learning.js';

export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;
const keys = { progress: PROGRESS_KEY, game: GAME_KEY, drafts: DRAFTS_KEY, session: SESSION_KEY };
const questions = new Map(curriculum.questions.map(question => [question.id, question]));
const invalidMessage = 'Dit is geen geldig voortgangsbestand voor deze versie van de app.';
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const count = value => Number.isSafeInteger(value) && value >= 0;

export function createProgressBackup(storage, now = new Date()) {
  // The readers also migrate data from older editions. No account or analytics keys.
  // Read outside their fallback handlers so blocked storage cannot look like empty progress.
  const snapshot = new Map([...Object.values(keys), 'lottequiz.v1', 'motionstudy.game.v1']
    .map(key => [key, storage.getItem(key)]));
  const reader = { getItem: key => snapshot.get(key) ?? null };
  return { app: 'motionstudy', version: 1, exportedAt: now.toISOString(), data: {
    progress: readProgress(reader), game: readGame(reader),
    drafts: readDrafts(reader, questions), session: readSession(reader, questions),
  } };
}

export function parseProgressBackup(text) {
  if (new TextEncoder().encode(text).length > MAX_BACKUP_BYTES) throw new Error('Het bestand is te groot. Kies een geëxporteerd voortgangsbestand.');
  let backup;
  try {
    backup = JSON.parse(text, (key, value) => {
      if (['__proto__', 'constructor', 'prototype'].includes(key)) throw new Error(invalidMessage);
      return value;
    });
  } catch { throw new Error(invalidMessage); }
  const data = backup?.data;
  if (backup?.app !== 'motionstudy' || backup.version !== 1 || !object(data) ||
    !object(data.progress) || !object(data.progress.questions) || !Array.isArray(data.progress.sessions) ||
    !object(data.game) || !object(data.game.days) || !Array.isArray(data.game.completed) ||
    !object(data.drafts) || !(data.session === null || object(data.session))) throw new Error(invalidMessage);
  const reader = { getItem: key => {
    const name = Object.keys(keys).find(name => keys[name] === key);
    return name ? JSON.stringify(data[name]) : null;
  } };
  const progress = readProgress(reader);
  const game = readGame(reader);
  const drafts = readDrafts(reader, questions);
  const session = readSession(reader, questions);
  // Unlike normal startup, an import must not silently discard invalid records.
  if (Object.keys(progress.questions).length !== Object.keys(data.progress.questions).length ||
    !Object.keys(data.progress.questions).every(id => questions.has(id)) ||
    progress.sessions.length !== data.progress.sessions.length ||
    !data.progress.sessions.every(item => count(item.correct) && count(item.total) && item.correct <= item.total && Number.isFinite(item.at)) ||
    Object.keys(game.days).length !== Object.keys(data.game.days).length ||
    game.completed.length !== data.game.completed.length ||
    Object.keys(drafts).length !== Object.keys(data.drafts).length ||
    (data.session !== null && !session)) throw new Error(invalidMessage);
  return { progress, game, drafts, session };
}

export function restoreProgressBackup(storage, data) {
  // Validate even callers that do not go through the file picker.
  const valid = parseProgressBackup(JSON.stringify({ app: 'motionstudy', version: 1, data }));
  const previous = Object.fromEntries(Object.values(keys).map(key => [key, storage.getItem(key)]));
  const written = [];
  try {
    for (const [name, key] of Object.entries(keys)) {
      storage.setItem(key, JSON.stringify(valid[name]));
      written.push(key);
    }
  } catch {
    // Restore only successful writes, in reverse order, including absent keys.
    for (const key of written.reverse()) {
      if (previous[key] === null) storage.removeItem(key);
      else storage.setItem(key, previous[key]);
    }
    throw new Error('Importeren is niet gelukt. Je huidige voortgang is behouden.');
  }
}

export function setupProgressTransfer({ window, document, storage, withLock, prepareExport, beforeImport, afterImport }) {
  const $ = selector => document.querySelector(selector);
  const section = $('#progress-transfer');
  if (!section) return;
  const exportButton = $('#progress-export');
  const importButton = $('#progress-import');
  const fileInput = $('#progress-import-file');
  const confirmation = $('#progress-import-confirmation');
  const confirmButton = $('#progress-import-confirm');
  const cancelButton = $('#progress-import-cancel');
  const status = $('#progress-transfer-status');
  let pending = null;
  let busy = false;
  let selection = 0;
  function message(text, error = false) {
    status.setAttribute('role', error ? 'alert' : 'status');
    status.textContent = text;
  }
  function setBusy(value) {
    busy = value;
    for (const button of [exportButton, importButton, confirmButton, cancelButton]) button.disabled = value;
    section.setAttribute('aria-busy', String(value));
  }
  function cancel() {
    selection++;
    pending = null;
    confirmation.hidden = true;
    fileInput.value = '';
  }
  section.hidden = false;
  exportButton.addEventListener('click', async () => {
    if (busy) return;
    setBusy(true);
    try {
      const backup = await withLock(() => {
        if (!prepareExport()) throw new Error('Exporteren is niet gelukt. Controleer of je browser opslag toestaat.');
        return createProgressBackup(storage);
      });
      const blob = new window.Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'motionstudy-voortgang-' + backup.exportedAt.slice(0, 10) + '.json';
      document.body.append(link);
      link.click();
      link.remove();
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      message('Voortgang geëxporteerd.');
    } catch { message('Exporteren is niet gelukt. Controleer of je browser opslag toestaat.', true); }
    finally { setBusy(false); if (section.closest('dialog').open) exportButton.focus(); }
  });
  importButton.addEventListener('click', () => {
    if (busy) return;
    cancel();
    message('');
    fileInput.click();
  });
  fileInput.addEventListener('change', async () => {
    const file = fileInput.files?.[0];
    if (!file || busy) return;
    const attempt = ++selection;
    setBusy(true);
    try {
      if (file.size > MAX_BACKUP_BYTES) throw new Error('Het bestand is te groot. Kies een geëxporteerd voortgangsbestand.');
      const imported = parseProgressBackup(await file.text());
      if (attempt !== selection) return;
      pending = imported;
      confirmation.hidden = false;
      message('Bestand klaar om te importeren.');
    } catch (error) { if (attempt === selection) { cancel(); message(error.message || invalidMessage, true); } }
    finally { setBusy(false); }
    if (pending) cancelButton.focus();
  });
  cancelButton.addEventListener('click', () => { cancel(); message('Import geannuleerd.'); importButton.focus(); });
  confirmButton.addEventListener('click', async () => {
    if (!pending || busy) return;
    const imported = pending;
    setBusy(true);
    try {
      await withLock(() => {
        if (!beforeImport()) throw new Error('De voortgang is in een ander tabblad gewijzigd. Probeer opnieuw.');
        restoreProgressBackup(storage, imported);
      });
      cancel();
      message('Voortgang geïmporteerd.');
      afterImport();
    } catch (error) { message(error.message || 'Importeren is niet gelukt.', true); }
    finally { setBusy(false); }
  });
  section.closest('dialog').addEventListener('close', () => { cancel(); message(''); });
}
