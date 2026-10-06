import './style.css';
import './study-ui.css';
import './viewer-model-controls.css';
import './install-app.css';
import './app-update.css';
import './legal-ui.css';
import { setupAppUpdates } from './app-update.js';
import { setupAppInstall } from './install-app.js';
import { setupLegalInfo } from './legal-ui.js';

setupAppUpdates({ window, document, base: import.meta.env.BASE_URL });
setupAppInstall({ window, document, navigator });
setupLegalInfo({ document });

const menu = document.querySelector('#account-controls');
document.addEventListener('pointerdown', event => {
  if (menu.open && !menu.contains(event.target)) menu.open = false;
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.open) {
    menu.open = false;
    menu.querySelector('summary').focus();
  }
});
menu.addEventListener('focusout', event => {
  if (event.relatedTarget && !menu.contains(event.relatedTarget)) menu.open = false;
});

// main.js uses the previous static edition's localStorage keys directly.
try {
  await import('./main.js');
  document.querySelector('#static-loading').hidden = true;
  menu.hidden = false;
  document.querySelector('#main').hidden = false;
  document.querySelector('nav').hidden = false;
  document.querySelector('.skip').hidden = false;
} catch {
  const status = document.querySelector('#static-loading');
  status.textContent = 'De app kon niet laden. Controleer je verbinding en vernieuw de pagina.';
  status.setAttribute('role', 'alert');
}
