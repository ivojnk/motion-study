import './style.css';
import './study-ui.css';
import './viewer-model-controls.css';
import './install-app.css';
import './app-update.css';
import { setupAppUpdates } from './app-update.js';
import { accountStorage, ACCOUNT_EVENT_KEY } from './account-storage.js';
import { createProgressSync } from './progress-sync.js';
import { setupAppInstall } from './install-app.js';

import { createUsageClient } from './usage-client.js';
import { NOTICE_VERSION } from '../shared/legal.mjs';
import { setupLegalInfo } from './legal-ui.js';
import './legal-ui.css';

setupAppUpdates({ window, document, base: import.meta.env.BASE_URL });
setupAppInstall({ window, document, navigator });
setupLegalInfo({ document });

const $ = selector => document.querySelector(selector);
let currentUser = null;
let entering = false;
let progressSync = null;
let appOpening = false;
function syncStatus(state) {
  const status = $('#progress-sync-status');
  status.hidden = state === 'saved';
  status.textContent = { pending: 'Voortgang opslaan…', offline: 'Geen verbinding. Nieuwe voortgang blijft lokaal totdat opslaan op de server lukt.', conflict: 'Voortgang op een ander apparaat gewijzigd. Kies welke je wilt gebruiken.' }[state] || '';
}
function resolveProgressConflict() {
  const dialog = $('#progress-conflict');
  return new Promise(resolve => {
    let settled = false;
    const buttons = [...dialog.querySelectorAll('[data-progress-choice]')];
    const error = $('#progress-conflict-error');
    error.hidden = true;
    $('#main').inert = true;
    dialog.showModal();
    const finish = choice => {
      if (settled) return;
      settled = true;
      for (const button of buttons) button.disabled = false;
      dialog.close();
      $('#main').inert = false;
      dialog.removeEventListener('click', clicked);
      dialog.removeEventListener('cancel', cancelled);
      resolve(choice);
    };
    const clicked = async event => {
      const choice = event.target.closest('[data-progress-choice]')?.dataset.progressChoice;
      if (!choice || settled) return;
      for (const button of buttons) button.disabled = true;
      try {
        if (choice === 'server') {
          // Download the local learning data before replacing it.
          const { createProgressBackup } = await import('./progress-transfer.js');
          const file = new Blob([JSON.stringify(createProgressBackup(window.motionStudyStorage), null, 2)], { type: 'application/json' });
          const url = URL.createObjectURL(file);
          const link = document.createElement('a');
          link.href = url; link.download = 'motionstudy-herstelkopie.json';
          document.body.append(link); link.click(); link.remove();
          window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
        finish(choice);
      } catch {
        error.textContent = 'Herstelkopie maken mislukt. Je lokale voortgang is behouden. Probeer opnieuw.';
        error.hidden = false;
        for (const button of buttons) button.disabled = false;
      }
    };
    const cancelled = event => { event.preventDefault(); finish('cancel'); };
    dialog.addEventListener('click', clicked);
    dialog.addEventListener('cancel', cancelled);
  });
}
const request = async (path, body) => {
  const response = await fetch('/api/account/' + path, {
    credentials: 'same-origin', cache: 'no-store',
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
  });
  if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Inloggen lukt niet. Probeer later opnieuw.');
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Dat lukt niet. Probeer opnieuw.');
  return data;
};
function broadcast(user) {
  try { localStorage.setItem(ACCOUNT_EVENT_KEY, JSON.stringify({ id: user?.id || null, time: Date.now() })); } catch { /* Session cookies still work without local storage. */ }
}
function showError(message) {
  $('#account-message').textContent = message;
  $('#account-message').hidden = false;
}
async function openApp(user, preferences = {}) {
  if (appOpening) return;
  appOpening = true;
  window.motionStudyAccount = user;
  try {
    const local = accountStorage(localStorage, user.id);
    if ((!local.getItem('motionstudy.progress.v1') && local.getItem('lottequiz.v1')) || (!local.getItem('motionstudy.game.v2') && local.getItem('motionstudy.game.v1'))) {
      const { createProgressBackup } = await import('./progress-transfer.js');
      const backup = createProgressBackup(local);
      const keys = { progress: 'motionstudy.progress.v1', game: 'motionstudy.game.v2', drafts: 'motionstudy.drafts.v2', session: 'motionstudy.session.v2' };
      for (const [name, key] of Object.entries(keys)) if (!local.getItem(key)) local.setItem(key, JSON.stringify(backup.data[name]));
    }
    const withLock = action => navigator.locks ? navigator.locks.request('motionstudy-progress:' + user.id, action) : action();
    progressSync = createProgressSync({ storage: local, accountId: user.id, withLock, onStatus: syncStatus,
      onConflict: resolveProgressConflict, onReload: () => location.reload() });
    // Export during a startup conflict needs the local account scope too.
    window.motionStudyStorage = local;
    await progressSync.initialize();
    window.motionStudyStorage = progressSync.storage;
  } catch (error) {
    appOpening = false;
    progressSync?.stop();
    throw error;
  }
  currentUser = user;
  $('#account-name').textContent = user.username;
  $('#account-controls').hidden = false;
  window.motionStudyAnalytics = createUsageClient({ accountId: user.id, storage: window.motionStudyStorage, enabled: preferences.analytics === true });
  $('#privacy-analytics').checked = preferences.analytics === true;
  $('#privacy-preferences').hidden = false;
  try { await import('./main.js'); }
  catch {
    $('#account-reload').hidden = false;
    throw new Error('De app kon niet laden. Probeer opnieuw.');
  }
  const prepareUpdate = window.motionStudyPrepareUpdate;
  window.motionStudyPrepareUpdate = async () => (await prepareUpdate?.()) !== false && await progressSync.flush();
  $('#account-screen').hidden = true;
  $('#login-install').hidden = true;
  $('#main').hidden = false;
  $('nav').hidden = false;
  $('.skip').hidden = false;
  if (!document.hidden) void window.motionStudyAnalytics.active();
}
async function checkSession() {
  try {
    const { user, preferences } = await request('session');
    if (currentUser && user?.id !== currentUser.id) { $('#main').hidden = true; location.reload(); return; }
    if (user && !currentUser) await openApp(user, preferences);
    else if (!user) {
      $('#account-loading').hidden = true;
      $('#account-form').hidden = false;
      $('#account-username').focus();
    }
  } catch {
    $('#account-loading').hidden = true;
    $('#account-form').hidden = false;
    showError('Voortgang laden mislukt. Controleer je verbinding en probeer opnieuw.');
  }
}
$('#account-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (entering) return;
  if (!$('#account-form').reportValidity()) return;
  entering = true;
  const button = $('#account-submit');
  button.disabled = true;
  button.textContent = 'Inloggen…';
  $('#account-message').hidden = true;
  try {
    const { user, preferences } = await request('enter', { username: $('#account-username').value, acknowledged: $('#account-acknowledgement').checked, noticeVersion: NOTICE_VERSION, analytics: $('#account-analytics').checked });
    broadcast(user);
    await openApp(user, preferences);
    $('#main').focus();
  } catch (error) { showError(error.message === 'Failed to fetch' ? 'Verbinding mislukt. Probeer opnieuw.' : error.message); }
  finally { entering = false; button.disabled = false; button.textContent = 'Verder'; }
});
$('#account-logout').addEventListener('click', async () => {
  const button = $('#account-logout');
  button.disabled = true;
  try {
    await window.motionStudyPrepareUpdate?.();
    await request('logout', {});
    progressSync?.stop();
    $('#main').hidden = true;
    broadcast(null);
    history.replaceState(null, '', '#leren');
    location.reload();
  } catch {
    button.disabled = false;
    $('#logout-message').textContent = 'Uitloggen lukt niet. Probeer opnieuw.';
  }
});
$('#account-reload').addEventListener('click', () => location.reload());
$('#privacy-analytics').addEventListener('change', async event => {
  const input = event.currentTarget;
  const enabled = input.checked;
  const status = $('#privacy-choice-status');
  input.disabled = true;
  if (!enabled) window.motionStudyAnalytics?.setEnabled(false);
  status.textContent = 'Keuze opslaan…';
  try {
    const { preferences } = await request('preferences', { analytics: enabled });
    window.motionStudyAnalytics?.setEnabled(preferences.analytics);
    input.checked = preferences.analytics;
    status.textContent = preferences.analytics ? 'Gebruiksstatistieken staan aan voor deze sessie.' : 'Gebruiksstatistieken staan uit voor deze sessie.';
    if (preferences.analytics) void window.motionStudyAnalytics.active();
  } catch {
    input.checked = false;
    window.motionStudyAnalytics?.setEnabled(false);
    status.textContent = 'Opslaan lukt niet. Deze pagina deelt nu geen statistieken. Probeer opnieuw om je sessiekeuze op te slaan.';
  } finally { input.disabled = false; }
});
document.addEventListener('pointerdown', event => {
  const account = $('#account-controls');
  if (account.open && !account.contains(event.target)) account.open = false;
});
document.addEventListener('keydown', event => {
  const account = $('#account-controls');
  if (event.key === 'Escape' && account.open) {
    account.open = false;
    account.querySelector('summary').focus();
  }
});
$('#account-controls').addEventListener('focusout', event => {
  if (event.relatedTarget && !event.currentTarget.contains(event.relatedTarget)) event.currentTarget.open = false;
});
window.addEventListener('storage', event => {
  if (event.key !== ACCOUNT_EVENT_KEY) return;
  // Reload synchronously so queued lesson writes cannot continue on a different account.
  $('#main').hidden = true;
  history.replaceState(null, '', '#leren');
  location.reload();
});
window.addEventListener('focus', () => { if (currentUser) checkSession(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && currentUser) checkSession(); });
setInterval(() => { if (!document.hidden && currentUser) checkSession(); }, 60_000);
const recordActivity = () => { if (!document.hidden && currentUser) void window.motionStudyAnalytics?.active(); };
window.addEventListener('focus', recordActivity);
document.addEventListener('visibilitychange', recordActivity);
document.addEventListener('pointerdown', recordActivity, { passive: true });
document.addEventListener('keydown', recordActivity);
checkSession();

const refreshServerProgress = () => { if (currentUser && !document.hidden) void progressSync?.refresh(); };
window.addEventListener('online', refreshServerProgress);
window.addEventListener('focus', refreshServerProgress);
document.addEventListener('visibilitychange', refreshServerProgress);
window.addEventListener('pagehide', () => { void progressSync?.flush(); });
setInterval(refreshServerProgress, 30_000);
