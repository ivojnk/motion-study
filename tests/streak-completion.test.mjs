import test from 'node:test';
import assert from 'node:assert/strict';
import { animateStreakCompletion, streakMarkup } from '../src/streak-completion.js';
import { dayKey } from '../src/learning.js';

function animation(reduced = false) {
  const frames = new Map();
  const listeners = new Map();
  const motionListeners = new Map();
  const viewListeners = new Map();
  const classes = new Set();
  let id = 0;
  const card = { isConnected: true,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    addEventListener: (type, callback) => listeners.set(type, callback),
    removeEventListener: type => listeners.delete(type) };
  const view = { performance: { now: () => 0 },
    matchMedia: () => ({ matches: reduced, addEventListener: (type, callback) => motionListeners.set(type, callback), removeEventListener: type => motionListeners.delete(type) }),
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: key => frames.delete(key),
    addEventListener: (type, callback) => viewListeners.set(type, callback),
    removeEventListener: type => viewListeners.delete(type) };
  const stop = animateStreakCompletion(card, { window: view });
  return { card, stop, listeners, motionListeners, viewListeners, frames,
    active: () => classes.has('is-igniting'),
    pending: () => frames.size + listeners.size + motionListeners.size + viewListeners.size,
    tick(time) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); } };
}

test('streak animation finishes, clears listeners and never loops', () => {
  const run = animation();
  assert.equal(run.active(), true);
  run.tick(3300); assert.equal(run.active(), true);
  run.tick(3400); assert.equal(run.active(), false);
  assert.equal(run.pending(), 0);
  run.stop(); assert.equal(run.pending(), 0);
});

test('reduced motion shows the final screen immediately', () => {
  const run = animation(true);
  assert.equal(run.active(), false);
  assert.equal(run.pending(), 0);
});

test('keyboard actions, motion changes, navigation and detached cards cancel ignition', () => {
  for (const reason of ['focus', 'motion', 'pagehide', 'detached', 'stop']) {
    const run = animation();
    if (reason === 'focus') {
      run.listeners.get('focusin')({ target: { closest: () => null } });
      assert.equal(run.active(), true);
      run.listeners.get('focusin')({ target: { closest: () => ({}) } });
    } else if (reason === 'motion') run.motionListeners.get('change')();
    else if (reason === 'pagehide') run.viewListeners.get('pagehide')();
    else if (reason === 'detached') { run.card.isConnected = false; run.tick(100); }
    else run.stop();
    assert.equal(run.active(), false, reason);
    assert.equal(run.pending(), 0, reason);
  }
});

test('calendar uses local dates across month boundaries and only real achieved daily goals', () => {
  const now = new Date(2026, 2, 2, 12).getTime();
  const game = { days: { '2026-02-28': 30, '2026-03-01': 29, [dayKey(now)]: 40 } };
  const before = JSON.stringify(game);
  const html = streakMarkup(game, 1, now);
  assert.match(html, /aria-label="1 dag streak"/);
  assert.equal((html.match(/<li /g) || []).length, 7);
  assert.equal((html.match(/class="streak-day is-done/g) || []).length, 2);
  assert.match(html, /2026-02-24: dagdoel niet gehaald/);
  assert.match(html, /2026-03-01: dagdoel niet gehaald/);
  assert.match(html, /2026-03-02: dagdoel gehaald, vandaag/);
  assert.equal(JSON.stringify(game), before);
});
