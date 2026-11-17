import test from 'node:test';
import assert from 'node:assert/strict';
import { animateChapterCompletion } from '../src/chapter-completion.js';

function finale({ reduced = false, hidden = false, loader } = {}) {
  const timers = new Map();
  const motionEvents = new Map();
  const cardEvents = new Map();
  const pageEvents = new Map();
  const documentEvents = new Map();
  const classes = new Set();
  const particles = [];
  let id = 0;
  let loads = 0;
  let resets = 0;
  let canvas = null;
  const cannon = options => particles.push(options);
  cannon.reset = () => resets++;
  const confetti = { create: () => cannon };
  const motion = { matches: reduced, addEventListener: (type, callback) => motionEvents.set(type, callback), removeEventListener: type => motionEvents.delete(type) };
  const document = {
    hidden,
    createElement() { return { setAttribute() {}, remove() { canvas = null; } }; },
    addEventListener: (type, callback) => documentEvents.set(type, callback),
    removeEventListener: type => documentEvents.delete(type),
  };
  const view = {
    document, innerWidth: 390, matchMedia: () => motion,
    getComputedStyle: () => ({ getPropertyValue: () => '#ddb451' }),
    setTimeout: (callback, delay) => { timers.set(++id, { callback, delay }); return id; },
    clearTimeout: id => timers.delete(id),
    addEventListener: (type, callback) => pageEvents.set(type, callback),
    removeEventListener: type => pageEvents.delete(type),
  };
  const card = {
    isConnected: true,
    append: element => { canvas = element; },
    classList: { add: name => classes.add(name), remove: name => classes.delete(name) },
    addEventListener: (type, callback) => cardEvents.set(type, callback),
    removeEventListener: type => cardEvents.delete(type),
  };
  const stop = animateChapterCompletion(card, { window: view, loadConfetti: () => { loads++; return loader ? loader() : Promise.resolve({ default: confetti }); } });
  return { stop, card, document, particles, confetti, motionEvents, cardEvents, pageEvents, documentEvents,
    loads: () => loads, resets: () => resets, canvas: () => canvas,
    celebrating: () => classes.has('chapter-celebrating'),
    pending: () => timers.size,
    listeners: () => motionEvents.size + cardEvents.size + pageEvents.size + documentEvents.size,
    tick(delay) { [...timers].filter(([, timer]) => timer.delay <= delay).forEach(([id, timer]) => { timers.delete(id); timer.callback(); }); },
  };
}

test('chapter finale fires three bounded bursts and cleans up its canvas and listeners', async () => {
  const run = finale(); await Promise.resolve();
  assert.equal(run.celebrating(), true);
  assert.equal(run.canvas().className, 'chapter-confetti');
  assert.equal(run.particles.length, 2);
  run.tick(500); assert.equal(run.particles.length, 4);
  run.tick(1150); assert.equal(run.particles.length, 5);
  assert.equal(run.particles.reduce((sum, options) => sum + options.particleCount, 0), 220);
  assert.deepEqual(run.particles.at(-1).shapes, ['star']);
  run.tick(4500);
  assert.equal(run.celebrating(), false);
  assert.equal(run.canvas(), null);
  assert.equal(run.pending() + run.listeners(), 0);
  assert.equal(run.resets(), 1);
});

test('reduced motion and hidden pages never load or render confetti', () => {
  for (const options of [{ reduced: true }, { hidden: true }]) {
    const run = finale(options);
    assert.equal(run.loads(), 0);
    assert.equal(run.canvas(), null);
    assert.equal(run.pending() + run.listeners(), 0);
  }
});

test('keyboard focus, changed preference, page exit and hidden tabs cancel all effects', async () => {
  for (const [collection, type] of [['cardEvents', 'focusin'], ['motionEvents', 'change'], ['pageEvents', 'pagehide'], ['documentEvents', 'visibilitychange']]) {
    const run = finale(); await Promise.resolve();
    if (type === 'visibilitychange') run.document.hidden = true;
    run[collection].get(type)();
    assert.equal(run.canvas(), null);
    assert.equal(run.pending() + run.listeners(), 0);
    assert.equal(run.celebrating(), false);
  }
});

test('a confetti import resolving after navigation cannot launch a stale celebration', async () => {
  let resolve;
  const run = finale({ loader: () => new Promise(done => { resolve = done; }) });
  run.stop(); resolve({ default: run.confetti }); await Promise.resolve();
  assert.equal(run.canvas(), null);
  assert.equal(run.particles.length, 0);
  assert.equal(run.pending() + run.listeners(), 0);
});

test('a failed decoration import leaves no timers, overlay or listeners behind', async () => {
  const run = finale({ loader: () => Promise.reject(new Error('offline')) });
  await Promise.resolve(); await Promise.resolve();
  assert.equal(run.canvas(), null);
  assert.equal(run.pending() + run.listeners(), 0);
  assert.equal(run.celebrating(), false);
});

test('detached cards cancel before another confetti burst', async () => {
  const run = finale(); await Promise.resolve(); run.card.isConnected = false; run.tick(500);
  assert.equal(run.canvas(), null);
  assert.equal(run.pending() + run.listeners(), 0);
  assert.equal(run.particles.length, 2);
});
