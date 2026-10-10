export function setupRecoveryLoader({ window, document, ...options }) {
  let loading = null;
  document.addEventListener('click', async event => {
    const button = event.target.closest('[data-progress-recovery]');
    if (!button) return;
    try {
      if (!loading) loading = import('./progress-recovery.js').then(module => module.setupProgressRecovery({ window, document, storage: window.localStorage, ...options }));
      const recovery = await loading;
      await recovery.open(button);
    } catch {
      loading = null;
      const dialog = document.querySelector('#progress-recovery');
      document.querySelector('#progress-recovery-status').textContent = 'Herstelcontrole openen lukt niet. Er is niets gewijzigd. Probeer opnieuw.';
      document.querySelector('#progress-recovery-use').disabled = true;
      const close = () => { dialog.close(); button.focus(); };
      document.querySelector('#progress-recovery-close').addEventListener('click', close, { once: true });
      if (!dialog.open) dialog.showModal();
    }
  });
}
