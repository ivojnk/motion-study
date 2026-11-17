import test from 'node:test';
import assert from 'node:assert/strict';
import { animateLessonCompletion } from '../src/lesson-completion.js';

function animation({ reduced = false, animate = true, xp = 45, metricValues = [7, 7, 7], rewardValues = [35, 10] } = {}) {
  const frames = new Map();
  const listeners = new Map();
  const motionListeners = new Map();
  const windowListeners = new Map();
  const classes = new Set();
  const count = { textContent: String(xp) };
  const metrics = metricValues.map(value => ({ textContent: String(value), dataset: { countTo: String(value) } }));
  const rewards = rewardValues.map(value => ({ textContent: String(value), dataset: { countTo: String(value) } }));
  let id = 0;
  const motion = {
    matches: reduced,
    addEventListener: (type, listener) => motionListeners.set(type, listener),
    removeEventListener: type => motionListeners.delete(type),
  };
  const card = {
    isConnected: true,
    querySelector: () => count,
    querySelectorAll: selector => selector === '.metric-count' ? metrics : rewards,
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    addEventListener: (type, listener) => listeners.set(type, listener),
    removeEventListener: type => listeners.delete(type),
  };
  const view = {
    matchMedia: () => motion,
    performance: { now: () => 0 },
    requestAnimationFrame: callback => { frames.set(++id, callback); return id; },
    cancelAnimationFrame: frame => frames.delete(frame),
    addEventListener: (type, listener) => windowListeners.set(type, listener),
    removeEventListener: type => windowListeners.delete(type),
  };
  const stop = animateLessonCompletion(card, { xp, animate, window: view });
  return { count, metrics, rewards, card, stop, frames, listeners, motionListeners, windowListeners,
    entering: () => classes.has('is-entering'),
    tick(time) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(time)); },
  };
}

test('celebration precedes XP count-up and settles at the saved total', () => {
  const run = animation();
  assert.equal(run.entering(), true);
  run.tick(800); assert.equal(run.count.textContent, '0');
  run.tick(1650); assert.ok(Number(run.count.textContent) > 0 && Number(run.count.textContent) < 45);
  run.tick(2220); assert.equal(run.count.textContent, '45');
  run.tick(2900); assert.equal(run.entering(), false);
  assert.equal(run.frames.size + run.listeners.size + run.motionListeners.size + run.windowListeners.size, 0);
});

test('performance counters arrive in order and the XP total follows the saved contributions', () => {
  const run = animation();
  run.tick(1100);
  assert.ok(Number(run.metrics[0].textContent) > 0);
  assert.deepEqual(run.metrics.slice(1).map(count => count.textContent), ['0', '0']);
  run.tick(1250);
  assert.ok(Number(run.metrics[1].textContent) > 0);
  assert.equal(run.metrics[2].textContent, '0');
  run.tick(1600);
  assert.equal(run.rewards[1].textContent, '0');
  assert.equal(run.count.textContent, run.rewards[0].textContent);
  run.tick(2000);
  assert.deepEqual(run.metrics.map(count => count.textContent), ['7', '7', '7']);
  assert.equal(run.rewards[0].textContent, '35');
  assert.equal(Number(run.count.textContent), run.rewards.reduce((sum, count) => sum + Number(count.textContent), 0));
  run.tick(2900);
  assert.deepEqual(run.rewards.map(count => count.textContent), ['35', '10']);
});

test('reduced motion, restored results, and zero XP show the final result immediately', () => {
  for (const options of [{ reduced: true }, { animate: false }, { xp: 0 }]) {
    const run = animation(options);
    assert.equal(run.entering(), false);
    assert.equal(run.count.textContent, String(options.xp ?? 45));
    assert.equal(run.frames.size, 0);
    assert.deepEqual(run.metrics.map(count => count.textContent), ['7', '7', '7']);
    assert.deepEqual(run.rewards.map(count => count.textContent), ['35', '10']);
  }
});

test('keyboard focus, changed motion preference, and page exit settle and clean up', () => {
  for (const [collection, type] of [['listeners', 'focusin'], ['motionListeners', 'change'], ['windowListeners', 'pagehide']]) {
    const run = animation();
    run[collection].get(type)();
    assert.equal(run.count.textContent, '45');
    assert.equal(run.entering(), false);
    assert.deepEqual(run.metrics.map(count => count.textContent), ['7', '7', '7']);
    assert.deepEqual(run.rewards.map(count => count.textContent), ['35', '10']);
    assert.equal(run.frames.size + run.listeners.size + run.motionListeners.size + run.windowListeners.size, 0);
  }
});

test('zero-valued metrics stay zero and totals without a breakdown still finish correctly', () => {
  const run = animation({ xp: 10, metricValues: [0, 0, 0], rewardValues: [] });
  run.tick(1800);
  assert.deepEqual(run.metrics.map(count => count.textContent), ['0', '0', '0']);
  assert.ok(Number(run.count.textContent) > 0 && Number(run.count.textContent) <= 10);
  run.tick(2900);
  assert.equal(run.count.textContent, '10');
});

test('navigation cancels pending animation and never updates a detached result', () => {
  const run = animation(); run.card.isConnected = false; run.tick(900);
  assert.equal(run.frames.size, 0);
  assert.equal(run.entering(), false);
  run.stop(); run.stop(); assert.equal(run.count.textContent, '45');
});
