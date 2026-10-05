import test from 'node:test';
import assert from 'node:assert/strict';
import { setupAppUpdates } from '../src/app-update.js';
import { appVersionPlugin } from '../scripts/app-version-plugin.mjs';

const original = 'a'.repeat(64);
const newer = 'b'.repeat(64);
const tick = () => new Promise(resolve => setImmediate(resolve));
class Node extends EventTarget {
  open = false;
  hidden = false;
  disabled = false;
  textContent = '';
  showModal() { this.open = true; }
  close() { this.open = false; }
}
function harness({ hash = '#leren', version = original, save = () => true } = {}) {
  const nodes = Object.fromEntries(['app-update', 'app-update-confirm', 'app-update-later', 'app-update-status'].map(id => [id, new Node()]));
  const document = new EventTarget();
  document.hidden = false;
  let result = false, otherDialog = false, failure = false, reloads = 0, saves = 0;
  const requests = [];
  document.querySelector = selector => selector === '#result-title' ? result : selector === 'dialog[open]' ? otherDialog || nodes['app-update'].open : nodes[selector.slice(1)];
  const window = new EventTarget();
  window.location = { href: 'https://app.test/study/', hash, reload() { reloads++; } };
  window.setTimeout = setTimeout;
  window.setInterval = () => 1;
  window.clearInterval = () => {};
  window.motionStudyPrepareUpdate = async () => { saves++; return save(); };
  const controller = setupAppUpdates({ window, document, currentVersion: original, base: '/study/', fetch: async (url, options) => {
    requests.push({ url, options });
    if (failure) throw new Error('Offline');
    return { ok: true, json: async () => ({ version }) };
  } });
  return { nodes, window, document, controller, requests, reloads: () => reloads, saves: () => saves,
    version(value) { version = value; }, offline(value) { failure = value; }, result(value) { result = value; }, otherDialog(value) { otherDialog = value; },
    click(id) { nodes[id].dispatchEvent(new Event('click')); },
  };
}

test('only a different valid build triggers the modal; no-store checks respect the app subpath', async () => {
  const h = harness(); await tick();
  assert.equal(h.nodes['app-update'].open, false);
  h.version('not-a-version'); await h.controller.check();
  assert.equal(h.nodes['app-update'].open, false);
  h.version(newer); await h.controller.check();
  assert.equal(h.nodes['app-update'].open, true);
  assert.equal(h.requests[0].url, 'https://app.test/study/app-version.json');
  assert.equal(h.requests[0].options.cache, 'no-store');
  h.controller.dispose();
});

test('updates wait throughout a lesson and appear after the result has rendered', async () => {
  const h = harness({ hash: '#les/basis/0', version: newer }); await tick();
  assert.equal(h.nodes['app-update'].open, false);
  h.document.dispatchEvent(new Event('motionstudy:lesson-completed'));
  assert.equal(h.nodes['app-update'].open, false);
  h.result(true); h.document.dispatchEvent(new Event('motionstudy:lesson-completed'));
  assert.equal(h.nodes['app-update'].open, true);
  h.controller.dispose();
});

test('leaving a lesson allows the modal without stacking another dialog', async () => {
  const h = harness({ hash: '#les/basis/0', version: newer }); await tick();
  h.otherDialog(true); h.window.location.hash = '#leren'; await h.controller.check();
  assert.equal(h.nodes['app-update'].open, false);
  h.otherDialog(false); h.document.dispatchEvent(new Event('close'));
  assert.equal(h.nodes['app-update'].open, true);
  h.controller.dispose();
});

test('Later and Escape dismiss the current update without refreshing; a later release can appear', async () => {
  const h = harness({ version: newer }); await tick();
  const event = new Event('cancel', { cancelable: true }); h.nodes['app-update'].dispatchEvent(event);
  assert.equal(event.defaultPrevented, true);
  await h.controller.check(); assert.equal(h.nodes['app-update'].open, false);
  h.version('c'.repeat(64)); await h.controller.check(); assert.equal(h.nodes['app-update'].open, true);
  h.click('app-update-later'); await h.controller.check();
  assert.equal(h.nodes['app-update'].open, false); assert.equal(h.reloads(), 0); assert.equal(h.saves(), 0);
  h.controller.dispose();
});

test('refresh waits for saving and double clicks cannot refresh twice', async () => {
  let complete;
  const h = harness({ version: newer, save: () => new Promise(resolve => { complete = resolve; }) }); await tick();
  h.click('app-update-confirm'); h.click('app-update-confirm'); await tick();
  assert.equal(h.nodes['app-update-confirm'].disabled, true);
  assert.equal(h.reloads(), 0); assert.equal(h.saves(), 1);
  complete(true); await tick(); assert.equal(h.reloads(), 1);
  h.controller.dispose();
});

test('blocked storage refuses refresh, reports why and allows a successful retry', async () => {
  let saved = false;
  const h = harness({ version: newer, save: () => saved }); await tick();
  h.click('app-update-confirm'); await tick();
  assert.equal(h.reloads(), 0); assert.equal(h.nodes['app-update'].open, true);
  assert.match(h.nodes['app-update-status'].textContent, /voortgang kon niet worden opgeslagen/);
  assert.equal(h.nodes['app-update-confirm'].disabled, false);
  saved = true; h.click('app-update-confirm'); await tick(); assert.equal(h.reloads(), 1);
  h.controller.dispose();
});

test('network failure during update leaves the lesson data and app open', async () => {
  const h = harness({ version: newer }); await tick(); h.offline(true);
  h.click('app-update-confirm'); await tick();
  assert.equal(h.reloads(), 0); assert.equal(h.saves(), 0);
  assert.match(h.nodes['app-update-status'].textContent, /verbinding/);
  h.controller.dispose();
});

test('background checks are paused and returning checks for the latest release', async () => {
  const h = harness(); await tick(); h.document.hidden = true; h.version(newer);
  const count = h.requests.length; await h.controller.check(); assert.equal(h.requests.length, count);
  h.document.hidden = false; h.document.dispatchEvent(new Event('visibilitychange')); await tick();
  assert.equal(h.nodes['app-update'].open, true);
  h.controller.dispose();
});

test('browser history back into a lesson defers an already open update', async () => {
  const h = harness({ version: newer }); await tick();
  assert.equal(h.nodes['app-update'].open, true);
  h.window.location.hash = '#les/basis/0'; h.window.dispatchEvent(new Event('hashchange'));
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(h.nodes['app-update'].open, false);
  h.window.location.hash = '#leren'; h.window.dispatchEvent(new Event('hashchange'));
  await new Promise(resolve => setTimeout(resolve, 5));
  assert.equal(h.nodes['app-update'].open, true);
  h.controller.dispose();
});

test('build fingerprints are reproducible, change with code and match HTML/metadata', () => {
  function build(code) {
    const bundle = { 'index.html': { type: 'asset', source: '<meta name="app-version" content="development" />' }, 'app.js': { type: 'chunk', code } };
    let asset;
    appVersionPlugin().generateBundle.handler.call({ emitFile(file) { asset = file; } }, {}, bundle);
    const { version } = JSON.parse(asset.source);
    assert.ok(bundle['index.html'].source.includes(version));
    return version;
  }
  assert.equal(build('first'), build('first'));
  assert.notEqual(build('first'), build('second'));
});
