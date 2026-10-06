// A bounded, presentation-only finale. Chapter progress is saved before this runs.
export function animateChapterCompletion(card, { window: view = window, loadConfetti = () => import('canvas-confetti') } = {}) {
  const motion = view.matchMedia('(prefers-reduced-motion: reduce)');
  const timers = new Set();
  let stopped = false;
  let cannon = null;
  let canvas = null;
  const stop = () => {
    stopped = true;
    timers.forEach(timer => view.clearTimeout(timer));
    timers.clear();
    cannon?.reset();
    canvas?.remove();
    card.classList.remove('chapter-celebrating');
    card.removeEventListener('focusin', stop);
    motion.removeEventListener?.('change', stop);
    view.removeEventListener('pagehide', stop);
    view.document.removeEventListener('visibilitychange', onVisibility);
  };
  const onVisibility = () => { if (view.document.hidden) stop(); };
  if (motion.matches || view.document.hidden || !card.isConnected) return stop;
  const schedule = (callback, delay) => {
    const timer = view.setTimeout(() => { timers.delete(timer); if (!stopped) callback(); }, delay);
    timers.add(timer);
  };
  card.classList.add('chapter-celebrating');
  card.addEventListener('focusin', stop);
  motion.addEventListener?.('change', stop);
  view.addEventListener('pagehide', stop, { once: true });
  view.document.addEventListener('visibilitychange', onVisibility);
  schedule(stop, 4500);
  loadConfetti().then(({ default: confetti }) => {
    if (stopped || !card.isConnected || motion.matches) return stop();
    canvas = view.document.createElement('canvas');
    canvas.className = 'chapter-confetti';
    canvas.setAttribute('aria-hidden', 'true');
    card.append(canvas);
    cannon = confetti.create(canvas, { resize: true, useWorker: true, disableForReducedMotion: true });
    const style = view.getComputedStyle(card);
    const colors = ['--chapter-gold', '--accent', '--chapter-coral', '--white'].map(token => style.getPropertyValue(token).trim());
    const small = view.innerWidth < 620;
    const burst = (particleCount, options = {}) => {
      if (!card.isConnected) { stop(); return; }
      cannon({ particleCount, colors, spread: 65, startVelocity: small ? 34 : 48,
        ticks: 160, gravity: 1.05, scalar: small ? .85 : 1.1, disableForReducedMotion: true, ...options });
    };
    const fountains = count => {
      burst(count, { angle: 60, origin: { x: 0, y: .62 } });
      burst(count, { angle: 120, origin: { x: 1, y: .62 } });
    };
    fountains(small ? 45 : 80);
    schedule(() => fountains(small ? 35 : 60), 500);
    schedule(() => burst(small ? 60 : 70, { shapes: ['star'], spread: 120,
      startVelocity: small ? 24 : 34, scalar: 1.3, origin: { x: .5, y: .28 } }), 1150);
  }).catch(stop); // Failed decoration must never interrupt the saved result.
  return stop;
}
