// Presentation only. XP is already awarded and saved by finish().
export function animateLessonCompletion(card, { xp, animate = true, window: view = window } = {}) {
  const count = card.querySelector('.xp-count');
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let stopped = false;
  const settle = () => {
    stopped = true;
    if (frame !== null) view.cancelAnimationFrame(frame);
    card.classList.remove('is-entering');
    if (count) count.textContent = String(xp);
    motion.removeEventListener?.('change', settle);
    card.removeEventListener('focusin', settle);
    view.removeEventListener('pagehide', settle);
  };
  if (!animate || motion.matches || !count || !(xp > 0)) {
    settle();
    return settle;
  }
  card.classList.add('is-entering');
  count.textContent = '0';
  // Tabbing into an action skips the visual sequence without delaying navigation.
  card.addEventListener('focusin', settle);
  motion.addEventListener?.('change', settle);
  view.addEventListener('pagehide', settle, { once: true });
  const started = view.performance.now();
  const tick = now => {
    if (stopped) return;
    if (!card.isConnected) { settle(); return; }
    const elapsed = Math.max(0, (now - started - 850) / 750);
    const fraction = Math.min(1, elapsed);
    count.textContent = String(Math.round(xp * (1 - Math.pow(1 - fraction, 3))));
    if (now - started < 1800) frame = view.requestAnimationFrame(tick);
    else settle();
  };
  frame = view.requestAnimationFrame(tick);
  return settle;
}
