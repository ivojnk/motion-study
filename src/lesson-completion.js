// Presentation only. XP is already awarded and saved by finish().
export function animateLessonCompletion(card, { xp, animate = true, window: view = window } = {}) {
  const count = card.querySelector('.xp-count');
  const metrics = Array.from(card.querySelectorAll('.metric-count'), (element, index) => ({ element, value: Number(element.dataset.countTo), delay: 1000 + index * 150, duration: 440 }));
  const rewards = Array.from(card.querySelectorAll('.breakdown-count'), (element, index) => ({ element, value: Number(element.dataset.countTo), delay: 1520 + index * 220, duration: 480 }));
  const counters = [...metrics, ...rewards].filter(counter => Number.isFinite(counter.value) && counter.value >= 0);
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  let frame = null;
  let stopped = false;
  const settle = () => {
    stopped = true;
    if (frame !== null) view.cancelAnimationFrame(frame);
    card.classList.remove('is-entering');
    if (count) count.textContent = String(xp);
    for (const counter of counters) counter.element.textContent = String(counter.value);
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
  for (const counter of counters) counter.element.textContent = '0';
  // Tabbing into an action skips the visual sequence without delaying navigation.
  card.addEventListener('focusin', settle);
  motion.addEventListener?.('change', settle);
  view.addEventListener('pagehide', settle, { once: true });
  const started = view.performance.now();
  const valueAt = (value, elapsed, delay, duration) => {
    const fraction = Math.min(1, Math.max(0, (elapsed - delay) / duration));
    return Math.round(value * (1 - Math.pow(1 - fraction, 3)));
  };
  const tick = now => {
    if (stopped) return;
    if (!card.isConnected) { settle(); return; }
    const elapsed = now - started;
    for (const counter of counters) counter.element.textContent = String(valueAt(counter.value, elapsed, counter.delay, counter.duration));
    // The main total follows the two saved XP contributions as they arrive.
    const total = rewards.length && rewards.every(reward => counters.includes(reward)) && rewards.reduce((sum, reward) => sum + reward.value, 0) === xp
      ? rewards.reduce((sum, reward) => sum + valueAt(reward.value, elapsed, reward.delay, reward.duration), 0)
      : valueAt(xp, elapsed, 1520, 700);
    count.textContent = String(total);
    if (elapsed < 2900) frame = view.requestAnimationFrame(tick);
    else settle();
  };
  frame = view.requestAnimationFrame(tick);
  return settle;
}
