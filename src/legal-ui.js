export function setupLegalInfo({ document }) {
  let returnFocus = null;
  function open(dialog, trigger) {
    const account = document.querySelector('#account-controls');
    if (account.contains(trigger)) {
      account.open = false;
      returnFocus = account.querySelector('summary');
    } else returnFocus = trigger;
    returnFocus.focus();
    dialog.showModal();
  }
  document.addEventListener('click', event => {
    const trigger = event.target.closest('[data-legal-dialog]');
    if (trigger) open(document.getElementById(trigger.dataset.legalDialog), trigger);
    const close = event.target.closest('[data-legal-close]');
    if (close) close.closest('dialog').close();
    const next = event.target.closest('[data-legal-switch]');
    if (next) {
      const previous = next.closest('dialog');
      previous.close();
      open(document.getElementById(next.dataset.legalSwitch), returnFocus);
    }
  });
  // Native dialogs restore focus to the focused trigger, including after Escape.
}
