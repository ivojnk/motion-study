import './viewer-fullscreen.css';

// Move the existing panel into a native modal. Its canvas, camera, controls and
// ResizeObserver stay alive, so resizing never resets the current view.
export function setupViewerFullscreen({ document, window, onClose = () => {} }) {
  const panel = document.querySelector('.atlas-panel');
  const button = document.querySelector('#viewer-fullscreen');
  const dialog = document.querySelector('#viewer-fullscreen-dialog');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let placeholder = null;
  let animation = null;
  let closing = false;
  let scrollPositions = [];

  function updateButton(expanded) {
    button.setAttribute('aria-expanded', String(expanded));
    button.setAttribute('aria-label', expanded ? 'Volledig scherm sluiten' : '3D-weergave op volledig scherm');
    button.title = expanded ? 'Volledig scherm sluiten' : 'Volledig scherm';
  }

  function clippedBounds(rect) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const clamp = (value, max) => Math.max(0, Math.min(max, value));
    return `inset(${clamp(rect.top, height)}px ${clamp(width - rect.right, width)}px ${clamp(height - rect.bottom, height)}px ${clamp(rect.left, width)}px round 14px)`;
  }

  function animate(keyframes, duration) {
    animation?.cancel();
    animation = null;
    if (reducedMotion.matches || !dialog.animate) return null;
    animation = dialog.animate(keyframes, { duration, easing: 'cubic-bezier(.2,.8,.2,1)' });
    return animation;
  }

  function restore(restoreFocus) {
    animation?.cancel();
    animation = null;
    placeholder?.replaceWith(panel);
    placeholder = null;
    panel.classList.remove('viewer-expanded');
    dialog.close();
    document.body.classList.remove('viewer-fullscreen-active');
    updateButton(false);
    closing = false;
    for (const { element, top, left } of scrollPositions) {
      element.scrollTop = top;
      element.scrollLeft = left;
    }
    scrollPositions = [];
    onClose();
    if (restoreFocus && button.isConnected && !panel.hidden) button.focus({ preventScroll: true });
  }

  function close({ immediate = false, restoreFocus = true } = {}) {
    if (!dialog.open) return;
    if (immediate) { restore(restoreFocus); return; }
    if (closing) return;
    closing = true;
    const motion = animate([
      { clipPath: 'inset(0 round 0)', opacity: 1 },
      { clipPath: clippedBounds(placeholder.getBoundingClientRect()), opacity: .9 },
    ], 140);
    if (!motion) { restore(restoreFocus); return; }
    motion.finished.then(() => {
      if (animation === motion) restore(restoreFocus);
    }).catch(() => { /* An immediate layout change cancels the closing animation. */ });
  }

  function open() {
    const rect = panel.getBoundingClientRect();
    scrollPositions = [];
    for (let element = panel.parentElement; element; element = element.parentElement) {
      scrollPositions.push({ element, top: element.scrollTop, left: element.scrollLeft });
    }
    placeholder = document.createElement('div');
    placeholder.className = 'viewer-fullscreen-placeholder';
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.height = rect.height + 'px';
    panel.replaceWith(placeholder);
    dialog.append(panel);
    panel.classList.add('viewer-expanded');
    document.body.classList.add('viewer-fullscreen-active');
    updateButton(true);
    dialog.showModal();
    button.focus({ preventScroll: true });
    animate([
      { clipPath: clippedBounds(rect), opacity: .9 },
      { clipPath: 'inset(0 round 0)', opacity: 1 },
    ], 180);
  }

  button.addEventListener('click', () => {
    if (dialog.open) close();
    else open();
  });
  dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
  // A browser-driven close must also put the panel back into the lesson/atlas.
  dialog.addEventListener('close', () => { if (!dialog.open && placeholder) restore(false); });
  return { close, isOpen: () => dialog.open };
}
