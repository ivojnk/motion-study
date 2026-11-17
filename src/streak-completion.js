import { DAILY_GOAL, dayKey } from './learning.js';

// Read real calendar days; displaying this screen never awards XP or changes progress.
export function streakMarkup(game, streak, now = Date.now()) {
  const today = new Date(now);
  const week = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(today);
    date.setDate(date.getDate() - 6 + index);
    const key = dayKey(date.getTime());
    const done = (game.days[key] || 0) >= DAILY_GOAL;
    const label = ['Zo', 'Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za'][date.getDay()];
    return '<li class="streak-day' + (done ? ' is-done' : '') + (index === 6 ? ' is-today' : '') + '" aria-label="' + key + ': ' + (done ? 'dagdoel gehaald' : 'dagdoel niet gehaald') + (index === 6 ? ', vandaag' : '') + '"><span>' + label + '</span><span class="streak-day-mark" aria-hidden="true">' + (done ? '<svg viewBox="0 0 24 24"><path d="m6 12 4 4 8-8"/></svg>' : '·') + '</span></li>';
  }).join('');
  const flame = '<svg class="streak-flame" viewBox="0 0 200 240"><defs><linearGradient id="streak-fire" x1="0" y1="1" x2="0.6" y2="0"><stop stop-color="#ff4d34"/><stop offset=".5" stop-color="#ff8b24"/><stop offset="1" stop-color="#ffc45c"/></linearGradient></defs><path class="streak-flame-outer" fill="url(#streak-fire)" d="M101 8C119 51 157 60 153 111C169 103 178 88 178 78C198 110 199 142 191 173C181 210 148 232 101 232C54 232 19 211 10 172C3 140 13 107 40 81C37 105 49 120 60 125C52 78 95 59 101 8Z"/><path class="streak-flame-middle" fill="#ffcf65" d="M107 91C113 121 145 134 148 162C152 191 132 214 104 214C74 214 55 195 55 171C55 149 69 131 83 121C82 141 90 150 96 152C90 130 106 111 107 91Z"/><path class="streak-flame-core" fill="#fff3c7" d="M105 155C110 172 125 181 123 195C122 207 112 214 101 214C89 214 80 206 81 195C82 183 97 174 105 155Z"/></svg>';
  return '<div class="streak-hero"><div class="streak-firework" aria-hidden="true"><span class="streak-shockwave"></span><span class="streak-halo"></span><div class="streak-embers">' + '<i></i>'.repeat(12) + '</div>' + flame + '</div><h2 id="streak-title" tabindex="-1" aria-label="' + streak + (streak === 1 ? ' dag streak' : ' dagen streak') + '"><span class="streak-number" aria-hidden="true"><span>' + streak + '</span></span><span class="streak-label" aria-hidden="true">' + (streak === 1 ? 'dag streak' : 'dagen streak') + '</span></h2><p class="streak-message">' + (streak === 1 ? 'Een mooi begin.' : 'Je houdt het vuur aan.') + '</p></div><div class="streak-calendar"><p>Jouw afgelopen 7 dagen</p><ol aria-label="Dagdoelen van de afgelopen 7 dagen">' + week + '</ol><span class="streak-today">Dagdoel gehaald</span></div>';
}

export function animateStreakCompletion(card, { window: view = window } = {}) {
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let stopped = false;
  const settle = () => {
    stopped = true;
    if (frame !== null) view.cancelAnimationFrame(frame);
    card.classList.remove('is-igniting');
    card.removeEventListener('focusin', onFocus);
    motion.removeEventListener?.('change', settle);
    view.removeEventListener('pagehide', settle);
  };
  // The heading receives initial focus before entry. Keyboard actions skip the motion.
  const onFocus = event => { if (event.target.closest('button, a')) settle(); };
  if (motion.matches) { settle(); return settle; }
  card.classList.add('is-igniting');
  card.addEventListener('focusin', onFocus);
  motion.addEventListener?.('change', settle);
  view.addEventListener('pagehide', settle, { once: true });
  const started = view.performance.now();
  const tick = now => {
    if (stopped) return;
    if (!card.isConnected || now - started >= 3400) { settle(); return; }
    frame = view.requestAnimationFrame(tick);
  };
  frame = view.requestAnimationFrame(tick);
  return settle;
}
