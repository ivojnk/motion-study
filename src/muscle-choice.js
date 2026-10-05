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
  panel.setAttribute('aria-label', 'Kies de bedoelde spier');
  panel.innerHTML = '<h3>Kies een spier</h3><div class="muscle-choice-options" role="group" aria-label="Spieren op kleur en symbool"></div><div class="muscle-choice-actions"><button type="button" class="primary" data-choice-confirm disabled>Bevestigen</button><button type="button" class="text-button" data-choice-cancel>Opnieuw</button></div>';
  host.querySelector('.viewer-tools').after(panel);
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
    if (event.key === 'Escape') { event.preventDefault(); cancel(); }
  };
  panel.addEventListener('click', click);
  panel.addEventListener('keydown', keydown);
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
      options.firstElementChild?.focus({ preventScroll: true });
      panel.scrollIntoView({ block: 'nearest', behavior: 'instant' });
    },
    close() { panel.hidden = true; choices = []; chosen = null; },
    dispose() { panel.removeEventListener('click', click); panel.removeEventListener('keydown', keydown); panel.remove(); }
  };
}
