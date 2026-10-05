import './style.css';
import './study-ui.css';
import './viewer-model-controls.css';
import './install-app.css';
import './app-update.css';
import { setupAppUpdates } from './app-update.js';
import { accountStorage, ACCOUNT_EVENT_KEY } from './account-storage.js';
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
  currentUser = user;
  window.motionStudyAccount = user;
  try { window.motionStudyStorage = accountStorage(localStorage, user.id); } catch {
    window.motionStudyStorage = { getItem() { return null; }, setItem() { throw new Error('Storage blocked'); } };
  }
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
    showError('Verbinding mislukt. Probeer opnieuw.');
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
    await request('logout', {});
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
