import './style.css';
import './study-ui.css';
import { accountStorage, ACCOUNT_EVENT_KEY } from './account-storage.js';

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
async function openApp(user) {
  currentUser = user;
  window.motionStudyAccount = user;
  try { window.motionStudyStorage = accountStorage(localStorage, user.id); } catch {
    window.motionStudyStorage = { getItem() { return null; }, setItem() { throw new Error('Storage blocked'); } };
  }
  $('#account-name').textContent = user.username;
  $('#account-controls').hidden = false;
  await import('./main.js');
  $('#account-screen').hidden = true;
  $('#main').hidden = false;
  $('nav').hidden = false;
  $('.skip').hidden = false;
}
async function checkSession() {
  try {
    const { user } = await request('session');
    if (currentUser && user?.id !== currentUser.id) { $('#main').hidden = true; location.reload(); return; }
    if (user && !currentUser) await openApp(user);
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
  entering = true;
  const button = $('#account-submit');
  button.disabled = true;
  button.textContent = 'Inloggen…';
  $('#account-message').hidden = true;
  try {
    const { user } = await request('enter', { username: $('#account-username').value });
    broadcast(user);
    await openApp(user);
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
    location.reload();
  } catch {
    button.disabled = false;
    $('#logout-message').textContent = 'Uitloggen lukt niet. Probeer opnieuw.';
  }
});
window.addEventListener('storage', event => {
  if (event.key !== ACCOUNT_EVENT_KEY) return;
  // Reload synchronously so queued lesson writes cannot continue on a different account.
  $('#main').hidden = true;
  location.reload();
});
window.addEventListener('focus', () => { if (currentUser) checkSession(); });
document.addEventListener('visibilitychange', () => { if (!document.hidden && currentUser) checkSession(); });
setInterval(() => { if (!document.hidden && currentUser) checkSession(); }, 60_000);
checkSession();
