import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { installInstructions, setupInstallNudge } from '../src/install-app.js';

test('installation nudge waits for the path, never covers the result, and opens once', () => {
  const docEvents = new Map();
  const windowEvents = new Map();
  const frames = [];
  const data = {};
  let opens = 0;
  let installed = false;
  let dialogOpen = false;
  const window = {
    location: { hash: '#les/basis/0' },
    localStorage: { getItem: key => data[key], setItem: (key, value) => { data[key] = value; } },
    addEventListener: (type, callback) => windowEvents.set(type, callback),
    requestAnimationFrame: callback => frames.push(callback),
  };
  const document = {
    hidden: false,
    querySelector: () => dialogOpen,
    addEventListener: (type, callback) => docEvents.set(type, callback),
  };
  const navigate = hash => { window.location.hash = hash; windowEvents.get('hashchange')(); frames.splice(0).forEach(callback => callback()); };
  setupInstallNudge({ window, document, openPanel: () => opens++, isInstalled: () => installed });
  docEvents.get('motionstudy:lesson-completed')(); assert.equal(opens, 0);
  navigate('#les/basis/1'); assert.equal(opens, 0);
  dialogOpen = true; navigate('#leren'); assert.equal(opens, 0);
  dialogOpen = false; document.hidden = true; navigate('#leren'); assert.equal(opens, 0);
  document.hidden = false; installed = true; navigate('#leren'); assert.equal(opens, 0);
  installed = false; navigate('#leren'); assert.equal(opens, 1);
  assert.equal(data['motionstudy.install-nudge.v1'], 'seen');
  docEvents.get('motionstudy:lesson-completed')(); navigate('#leren'); assert.equal(opens, 1);
});

test('home-screen guidance covers iPhone, desktop-mode iPad, Android and desktop browsers', () => {
  assert.match(installInstructions({ userAgent: 'iPhone Safari' }).join(' '), /Zet op beginscherm/);
  assert.match(installInstructions({ userAgent: 'Macintosh Safari', platform: 'MacIntel', maxTouchPoints: 5 }).join(' '), /Zet op beginscherm/);
  assert.match(installInstructions({ userAgent: 'Android Chrome' }).join(' '), /App installeren/);
  assert.match(installInstructions({ userAgent: 'Macintosh Version/26 Safari', platform: 'MacIntel', maxTouchPoints: 0 }).join(' '), /Voeg toe aan Dock/);
  assert.match(installInstructions({ userAgent: 'Macintosh Chrome Safari', platform: 'MacIntel' }).join(' '), /Chrome of Edge/);
  assert.match(installInstructions({ userAgent: 'Windows Firefox', platform: 'Win32' }).join(' '), /Chrome of Edge/);
});

test('install manifest launches the app in its own window and icons have their declared PNG dimensions', async () => {
  const manifestURL = new URL('../public/manifest.webmanifest', import.meta.url);
  const manifest = JSON.parse(await readFile(manifestURL, 'utf8'));
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.name, 'MotionStudy');
  assert.equal(manifest.lang, 'nl');
  // Relative URLs must remain in scope both at the root and on a subpath.
  for (const base of ['https://example.test/', 'https://example.test/motion-study/']) {
    const url = new URL('manifest.webmanifest', base);
    assert.equal(new URL(manifest.start_url, url).href, base);
    assert.equal(new URL(manifest.scope, url).href, base);
    assert.equal(new URL(manifest.id, url).href, base);
  }
  assert.ok(manifest.icons.some(icon => icon.sizes === '192x192' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.sizes === '512x512' && icon.purpose === 'any'));
  assert.ok(manifest.icons.some(icon => icon.purpose === 'maskable'));
  for (const icon of [...manifest.icons, { src: 'app-icons/apple-touch-icon.png', sizes: '180x180' }]) {
    const png = await readFile(new URL(icon.src, manifestURL));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
});
