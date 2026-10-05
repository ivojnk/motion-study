const VERSION = /^[a-f0-9]{64}$/;

export function setupAppUpdates({ window, document, fetch = window.fetch.bind(window), base = './', currentVersion = document.querySelector('meta[name="app-version"]')?.content, intervalMs = 60_000 }) {
  const dialog = document.querySelector('#app-update');
  if (!dialog || !VERSION.test(currentVersion || '')) return { check: async () => {}, dispose() {} };
  const update = document.querySelector('#app-update-confirm');
  const later = document.querySelector('#app-update-later');
  const status = document.querySelector('#app-update-status');
  let pending = null;
  let dismissed = null;
  let checking = false;
  let updating = false;
  let disposed = false;
  const endpoint = new URL('app-version.json', new URL(base, window.location.href));
  function show() {
    if (disposed || document.hidden || !pending || pending === dismissed) return;
    if (window.location.hash.startsWith('#les/') && !document.querySelector('#result-title')) {
      if (dialog.open && !updating) dialog.close();
      return;
    }
    if (dialog.open) return;
    if (document.querySelector('dialog[open]')) return;
    status.hidden = true;
    dialog.showModal();
  }
  async function readVersion() {
    const response = await fetch(endpoint.href, { cache: 'no-store', credentials: 'same-origin', signal: AbortSignal.timeout(10_000) });
    if (!response.ok) throw new Error('Version unavailable');
    const { version } = await response.json();
    if (!VERSION.test(version || '')) throw new Error('Invalid version');
    return version;
  }
  async function check() {
    if (disposed || document.hidden || checking || updating) return;
    checking = true;
    try {
      const version = await readVersion();
      pending = version === currentVersion ? null : version;
      if (!pending && dialog.open) dialog.close();
      show();
    } catch { /* Offline or deployment in progress: retry at the next check. */ }
    finally { checking = false; }
  }
  function dismiss() {
    if (updating) return;
    dismissed = pending;
    dialog.close();
  }
  async function apply() {
    if (updating) return;
    updating = true;
    update.disabled = later.disabled = true;
    update.textContent = 'Bijwerken…';
    status.hidden = true;
    try {
      await readVersion();
      const saved = await window.motionStudyPrepareUpdate?.();
      if (saved === false) {
        status.textContent = 'Je voortgang kon niet worden opgeslagen. Probeer opnieuw of kies Later.';
        status.hidden = false;
        return;
      }
      window.location.reload();
    } catch {
      status.textContent = 'Bijwerken lukt nu niet. Controleer je verbinding en probeer opnieuw.';
      status.hidden = false;
    } finally {
      updating = false;
      update.disabled = later.disabled = false;
      update.textContent = 'Bijwerken';
    }
  }
  function cancel(event) {
    event.preventDefault();
    dismiss();
  }
  function stopKeys(event) { event.stopPropagation(); }
  function returned() { show(); void check(); }
  update.addEventListener('click', apply);
  later.addEventListener('click', dismiss);
  dialog.addEventListener('cancel', cancel);
  dialog.addEventListener('keydown', stopKeys);
  document.addEventListener('visibilitychange', returned);
  document.addEventListener('motionstudy:lesson-completed', show);
  document.addEventListener('close', show, true);
  window.addEventListener('focus', returned);
  window.addEventListener('online', returned);
  // Route rendering runs synchronously in main.js before this queued check.
  const routeChanged = () => window.setTimeout(show, 0);
  window.addEventListener('hashchange', routeChanged);
  const timer = window.setInterval(check, intervalMs);
  void check();
  return {
    check,
    dispose() {
      disposed = true;
      window.clearInterval(timer);
      update.removeEventListener('click', apply);
      later.removeEventListener('click', dismiss);
      dialog.removeEventListener('cancel', cancel);
      dialog.removeEventListener('keydown', stopKeys);
      document.removeEventListener('visibilitychange', returned);
      document.removeEventListener('motionstudy:lesson-completed', show);
      document.removeEventListener('close', show, true);
      window.removeEventListener('focus', returned);
      window.removeEventListener('online', returned);
      window.removeEventListener('hashchange', routeChanged);
    },
  };
}
