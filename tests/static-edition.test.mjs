import test from 'node:test';
import assert from 'node:assert/strict';
import { build } from 'vite';
import { fileURLToPath } from 'node:url';

test('static production builds run without account APIs and keep subpath assets and updates usable', async () => {
  for (const base of ['/', '/motion-study/']) {
    const result = await build({
      root: fileURLToPath(new URL('../', import.meta.url)), mode: 'static', base,
      build: { write: false }, logLevel: 'silent',
    });
    const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
    const html = output.find(asset => asset.fileName === 'index.html')?.source;
    assert.equal(typeof html, 'string');
    assert.match(html, /name="app-edition" content="static"/);
    assert.doesNotMatch(html, /id="account-(?:form|screen|logout)"|privacy-analytics|Cloudflare|workers\.dev|%BASE_URL%/);
    assert.match(html, /aria-label="Appmenu"/);
    assert.match(html, /De app verzamelt geen gebruiksstatistieken/);
    assert.match(html, /deze versie zonder account/);
    assert.match(html, /id="progress-export"/);
    assert.match(html, /id="progress-import"/);
    assert.match(html, /Importeren vervangt je huidige voortgang/);
    assert.ok(html.includes(`rel="canonical" href="https://ivojnk.github.io${base}"`));
    assert.ok(html.includes(`href="${base}manifest.webmanifest"`));
    assert.ok(html.includes(`src="${base}app-icons/icon-192.png?v=leerblad-1"`));
    assert.ok(output.some(asset => asset.fileName === '.nojekyll'));
    assert.match(output.find(asset => asset.fileName === 'LICENSE')?.source, /Copyright \(c\) 2026 MotionStudy contributors/);
    assert.match(output.find(asset => asset.fileName === 'ATTRIBUTION.md')?.source, /BodyParts3D/);
    assert.ok(!output.some(asset => /^(analytics|beheer)\//.test(asset.fileName)));
    const version = JSON.parse(output.find(asset => asset.fileName === 'app-version.json').source).version;
    assert.match(version, /^[a-f0-9]{64}$/);
    assert.ok(html.includes(`name="app-version" content="${version}"`));
    const scripts = output.filter(asset => asset.type === 'chunk').map(asset => asset.code).join('\n');
    assert.doesNotMatch(scripts, /\/api\/(?:account|usage|owner|analytics)/);
    assert.match(scripts, /motionstudy\.progress\.v1/);
    assert.match(scripts, /app-version\.json/);
    assert.ok(scripts.includes(base + 'models/'));
  }
});
