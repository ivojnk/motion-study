import './admin.css';
import { startAuthentication, startRegistration } from '@simplewebauthn/browser';

const $ = selector => document.querySelector(selector);
let configured = false;
let busy = false;
const call = async (path, body) => {
  const response = await fetch('/api/owner/' + path, { credentials: 'same-origin', cache: 'no-store',
    ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'unavailable');
  return data;
};
async function state() {
  $('#retry').hidden = true;
  try {
    const data = await call('state');
    configured = data.configured;
    $('#owner-form').hidden = data.authenticated;
    $('#open-dashboard').hidden = !data.authenticated;
    $('#setup-fields').hidden = configured;
    $('#setup-key').required = !configured;
    $('#authenticate').textContent = configured ? 'Inloggen met passkey' : 'Passkey aanmaken';
    $('#status').textContent = data.authenticated ? 'Je bent ingelogd als beheerder.' : configured ? 'Gebruik je passkey om verder te gaan.' : 'Maak je beheerderspasskey aan. De setupcode werkt één keer.';
  } catch { $('#status').textContent = 'Toegang controleren lukt niet. Probeer opnieuw.'; $('#retry').hidden = false; }
}
$('#owner-form').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  busy = true;
  $('#authenticate').disabled = true;
  const kind = configured ? 'login' : 'register';
  const setupKey = configured ? '' : $('#setup-key').value.trim();
  try {
    $('#status').textContent = configured ? 'Bevestig met je passkey.' : 'Bevestig het aanmaken van je passkey.';
    const { options, ceremony } = await call(kind + '/options', { setupKey });
    const response = await (configured ? startAuthentication({ optionsJSON: options }) : startRegistration({ optionsJSON: options }));
    await call(kind + '/finish', { ceremony, response, setupKey });
    $('#setup-key').value = '';
    location.replace('/analytics/');
  } catch (error) {
    $('#status').textContent = ['NotAllowedError', 'AbortError'].includes(error.name) ? 'Passkey geannuleerd. Je kunt opnieuw proberen.' : error.message === 'rate-limit' ? 'Probeer over een minuut opnieuw.' : !configured ? 'Aanmaken lukt niet. Controleer je setupcode en probeer opnieuw.' : 'Inloggen lukt niet. Gebruik de passkey van dit dashboard.';
  } finally { busy = false; $('#authenticate').disabled = false; }
});
$('#retry').addEventListener('click', state);
state();
