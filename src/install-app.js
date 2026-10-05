import { installIcon } from './install-system-icons.js';

// Use the native browser prompt where available, with manual steps elsewhere.
export function installInstructions(navigator) {
  const agent = navigator.userAgent || '';
  const ios = /iPad|iPhone|iPod/.test(agent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  if (ios) return [
    'Open deze pagina in Safari.',
    'Tik op het deelmenu (het vierkant met de pijl omhoog).',
    'Kies ‘Zet op beginscherm’. Staat die optie er niet, tik dan op ‘Wijzig taken’ om hem toe te voegen.',
    'Laat ‘Open als webapp’ aan staan als je die optie ziet en tik op ‘Voeg toe’.',
  ];
  if (/Android/.test(agent)) return [
    'Open deze pagina in Chrome of Samsung Internet.',
    'Open het browsermenu en kies ‘App installeren’ of ‘Toevoegen aan startscherm’.',
    'Bevestig om het app-icoon toe te voegen.',
  ];
  if (/Mac/.test(navigator.platform || '') && /Safari/.test(agent) && !/Chrome|Chromium|Edg/.test(agent)) return [
    'Open het menu ‘Archief’ in Safari.',
    'Kies ‘Voeg toe aan Dock’ en bevestig.',
  ];
  return [
    'Open deze pagina in Chrome of Edge.',
    'Klik op het installatie-icoon in de adresbalk, of kies in het browsermenu de optie om deze pagina als app te installeren.',
    'Bevestig om MotionStudy aan je apps toe te voegen.',
  ];
}

export function setupAppInstall({ window, document, navigator }) {
  const triggers = [...document.querySelectorAll('[data-install-app]')];
  const dialog = document.querySelector('#install-app');
  const confirm = document.querySelector('#install-confirm');
  const instructions = document.querySelector('#install-instructions');
  const status = document.querySelector('#install-status');
  const standalone = window.matchMedia('(display-mode: standalone)');
  const nudgeKey = 'motionstudy.install-nudge.v1';
  let nudgeSeen = false;
  try { nudgeSeen = window.localStorage.getItem(nudgeKey) === 'seen'; } catch { /* Keep the dismissal for this page when storage is blocked. */ }
  let installed = Boolean(navigator.standalone || standalone.matches);
  let pendingPrompt = null;
  let prompting = false;
  let guide = false;
  const howTo = document.querySelector('#install-how-to');
  const back = document.querySelector('#install-back');
  const preview = document.querySelector('#install-preview');
  document.querySelector('[data-install-close]').innerHTML = installIcon('close');
  howTo.insertAdjacentHTML('afterbegin', installIcon('add'));
  back.insertAdjacentHTML('afterbegin', installIcon('back'));
  const update = () => {
    triggers.forEach(button => { button.hidden = installed; });
    confirm.hidden = !pendingPrompt || installed;
    instructions.hidden = !guide || Boolean(pendingPrompt);
    preview.hidden = guide && !pendingPrompt;
    howTo.hidden = Boolean(pendingPrompt) || guide;
    back.hidden = !guide || Boolean(pendingPrompt);
    if (installed && dialog.open) dialog.close();
  };
  const setStatus = message => {
    status.textContent = message;
    status.hidden = !message;
  };
  const openPanel = () => {
    if (installed || dialog.open) return;
    setStatus('');
    guide = false;
    const account = document.querySelector('#account-controls');
    if (account.open) { account.open = false; account.querySelector('summary').focus(); }
    update();
    dialog.showModal();
  };
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  installInstructions(navigator).forEach((text, index) => {
    const step = document.createElement('li');
    const icon = index === 0 ? 'menu' : ios && index === 1 ? 'share' : 'add';
    const symbol = document.createElement('span');
    symbol.className = 'install-step-icon';
    symbol.innerHTML = installIcon(icon);
    const label = document.createElement('div');
    label.textContent = text;
    step.append(symbol, label);
    instructions.append(step);
  });
  triggers.forEach(button => button.addEventListener('click', openPanel));
  document.addEventListener('motionstudy:lesson-completed', () => {
    if (nudgeSeen || installed || document.hidden || document.querySelector('dialog[open]')) return;
    openPanel();
    nudgeSeen = true;
    try { window.localStorage.setItem(nudgeKey, 'seen'); } catch { /* Do not block learning when storage is unavailable. */ }
  });
  document.querySelectorAll('[data-install-close]').forEach(button => button.addEventListener('click', () => dialog.close()));
  howTo.addEventListener('click', () => { guide = true; update(); back.focus(); });
  back.addEventListener('click', () => { guide = false; update(); howTo.focus(); });
  // Keep quiz shortcuts from grading answers behind this modal.
  dialog.addEventListener('keydown', event => event.stopPropagation());
  window.addEventListener('beforeinstallprompt', event => {
    if (installed) return;
    event.preventDefault();
    pendingPrompt = event;
    update();
  });
  confirm.addEventListener('click', async () => {
    if (!pendingPrompt || prompting) return;
    const prompt = pendingPrompt;
    pendingPrompt = null; // Browser install events can only be used once.
    prompting = true;
    confirm.disabled = true;
    try {
      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      guide = outcome !== 'accepted';
      setStatus(outcome === 'accepted'
        ? 'De browser voegt MotionStudy toe aan je apps.'
        : 'Installatie geannuleerd. Je kunt de app later via het browsermenu toevoegen.');
    } catch {
      guide = true;
      setStatus('Installeren lukt nu niet. Probeer de stappen via het browsermenu.');
    } finally {
      prompting = false;
      confirm.disabled = false;
      update();
      if (dialog.open) document.querySelector('[data-install-close]').focus();
    }
  });
  window.addEventListener('appinstalled', () => {
    installed = true;
    pendingPrompt = null;
    update();
  });
  standalone.addEventListener('change', () => {
    installed = Boolean(standalone.matches || navigator.standalone);
    update();
  });
  update();
}
