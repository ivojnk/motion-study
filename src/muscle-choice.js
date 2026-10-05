export const choicePalette = [
  { color: '#0072b2', name: 'Blauw', symbol: '●' },
  { color: '#d55e00', name: 'Oranje', symbol: '▲' },
  { color: '#009e73', name: 'Groen', symbol: '■' },
  { color: '#a447a0', name: 'Roze', symbol: '◆' }
];

export const muscleKey = mesh => mesh.userData.courseMuscleId || mesh.userData.anatomyName;

// Keep distinct anatomical groups, with the nearest visible candidate first.
export function nearbyChoices(samples, limit = 4) {
  const groups = new Map();
  for (const { hit, distance } of samples) {
    if (!hit) continue;
    const key = muscleKey(hit.object);
    if (!key) continue;
    const previous = groups.get(key);
    if (!previous || distance < previous.distance) groups.set(key, { key, hit, distance });
  }
  return [...groups.values()].sort((a, b) => a.distance - b.distance).slice(0, limit);
}

export function createChoicePanel(host, { preview, confirm, cancel }) {
  const panel = document.createElement('section');
  panel.className = 'muscle-choice';
  panel.hidden = true;
  panel.setAttribute('role', 'dialog');
  panel.setAttribute('aria-label', 'Welke spier bedoel je?');
  // Native popovers float above clipping and fullscreen containers without
  // making the model inert. Older browsers retain the fixed-position panel.
  const supportsPopover = typeof panel.showPopover === 'function';
  if (supportsPopover) panel.setAttribute('popover', 'manual');
  panel.innerHTML = '<div class="muscle-choice-heading"><h3>Welke spier bedoel je?</h3><button type="button" class="muscle-choice-close" data-choice-cancel aria-label="Spierkeuze sluiten"><span aria-hidden="true">×</span></button></div><div class="muscle-choice-options" role="group" aria-label="Spieren op kleur en symbool"></div><div class="muscle-choice-actions"><button type="button" class="text-button" data-choice-cancel>Opnieuw</button><button type="button" class="primary" data-choice-confirm disabled>Bevestigen</button></div>';
  host.append(panel);
  const options = panel.querySelector('.muscle-choice-options');
  const confirmButton = panel.querySelector('[data-choice-confirm]');
  let chosen = null;
  let choices = [];
  const click = event => {
    const option = event.target.closest('[data-choice-index]');
    if (option) {
      chosen = Number(option.dataset.choiceIndex);
      options.querySelectorAll('button').forEach((button, index) => button.setAttribute('aria-pressed', String(index === chosen)));
      confirmButton.disabled = false;
      preview(choices[chosen]);
    } else if (event.target.closest('[data-choice-confirm]') && chosen !== null) {
      confirm(choices[chosen]);
    } else if (event.target.closest('[data-choice-cancel]')) cancel();
  };
  const keydown = event => {
    if (panel.hidden || event.key !== 'Escape') return;
    event.preventDefault();
    event.stopPropagation();
    cancel();
  };
  panel.addEventListener('click', click);
  // Escape also cancels after returning focus to the model; do not close its
  // fullscreen dialog at the same time.
  document.addEventListener('keydown', keydown, true);
  return {
    open(nextChoices) {
      choices = nextChoices;
      chosen = null;
      confirmButton.disabled = true;
      options.replaceChildren(...choices.map((choice, index) => {
        const palette = choicePalette[index];
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'muscle-choice-option choice-color-' + index;
        button.dataset.choiceIndex = String(index);
        button.setAttribute('aria-pressed', 'false');
        button.setAttribute('aria-label', palette.name + ', ' + ['cirkel', 'driehoek', 'vierkant', 'ruit'][index]);
        button.innerHTML = '<span class="choice-swatch" aria-hidden="true">' + palette.symbol + '</span><span>' + palette.name + '</span>';
        return button;
      }));
      panel.hidden = false;
      if (supportsPopover) panel.showPopover();
      options.firstElementChild?.focus({ preventScroll: true });
    },
    close() {
      if (supportsPopover && !panel.hidden) panel.hidePopover();
      panel.hidden = true; choices = []; chosen = null;
    },
    dispose() { panel.removeEventListener('click', click); document.removeEventListener('keydown', keydown, true); panel.remove(); }
  };
}
