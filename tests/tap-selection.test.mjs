import test from 'node:test';
import assert from 'node:assert/strict';
import { bindTapSelection } from '../src/tap-selection.js';

function setup() {
  const canvas = new EventTarget();
  const taps = [];
  const dispose = bindTapSelection(canvas, event => taps.push(event.pointerId));
  const send = (type, values = {}) => {
    const event = new Event(type);
    Object.assign(event, { pointerId: 1, button: 0, isPrimary: true, clientX: 20, clientY: 20 }, values);
    canvas.dispatchEvent(event);
  };
  return { taps, send, dispose };
}

test('single finger tap tolerates slight jitter and submits once', () => {
  const { taps, send } = setup();
  send('pointerdown'); send('pointermove', { clientX: 23 }); send('pointerup', { clientX: 23 }); send('pointerup');
  assert.deepEqual(taps, [1]);
});

test('rotation that returns to its start never submits an answer', () => {
  const { taps, send } = setup();
  send('pointerdown'); send('pointermove', { clientX: 60 }); send('pointermove'); send('pointerup');
  assert.deepEqual(taps, []);
});

test('pinch with a stationary second finger never submits, and next tap works', () => {
  const { taps, send } = setup();
  send('pointerdown'); send('pointerdown', { pointerId: 2, isPrimary: false });
  send('pointermove', { clientX: 60 }); send('pointerup'); send('pointerup', { pointerId: 2 });
  assert.deepEqual(taps, []);
  send('pointerdown'); send('pointerup');
  assert.deepEqual(taps, [1]);
});

test('cancelled or lost-capture gestures and non-left buttons cannot select', () => {
  for (const type of ['pointercancel', 'lostpointercapture']) {
    const { taps, send } = setup();
    send('pointerdown'); send(type); send('pointerup');
    send('pointerdown', { button: 2 }); send('pointerup', { button: 2 });
    assert.deepEqual(taps, []);
  }
});

test('a different pointer cannot finish a tap and disposal removes handlers', () => {
  const { taps, send, dispose } = setup();
  send('pointerdown'); send('pointerup', { pointerId: 2 }); send('pointerup');
  assert.deepEqual(taps, []);
  dispose(); send('pointerdown'); send('pointerup');
  assert.deepEqual(taps, []);
});
