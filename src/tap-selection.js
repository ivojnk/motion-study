// Rotation and pinch gestures must never submit a muscle answer.
export function bindTapSelection(canvas, onTap) {
  const pointers = new Set();
  let candidate = null;
  const down = event => {
    pointers.add(event.pointerId);
    if (pointers.size !== 1 || event.button !== 0 || event.isPrimary === false) {
      candidate = null;
      return;
    }
    candidate = { id: event.pointerId, x: event.clientX, y: event.clientY };
  };
  const move = event => {
    if (candidate?.id === event.pointerId && Math.hypot(event.clientX - candidate.x, event.clientY - candidate.y) > 6) candidate = null;
  };
  const up = event => {
    move(event);
    const tap = candidate?.id === event.pointerId && pointers.size === 1;
    candidate = null;
    pointers.delete(event.pointerId);
    if (tap) onTap(event);
  };
  const cancel = event => {
    candidate = null;
    pointers.delete(event.pointerId);
  };
  const handlers = { pointerdown: down, pointermove: move, pointerup: up, pointercancel: cancel, lostpointercapture: cancel };
  for (const [type, handler] of Object.entries(handlers)) canvas.addEventListener(type, handler);
  return () => {
    for (const [type, handler] of Object.entries(handlers)) canvas.removeEventListener(type, handler);
    pointers.clear();
    candidate = null;
  };
}
