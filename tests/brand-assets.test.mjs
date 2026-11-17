import test from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { startServer } from '../server/index.mjs';
import { build } from 'vite';

const publicURL = new URL('../public/', import.meta.url);
// Fingerprints captured from the approved B / Leerblad masters, not generated
// from the current public files. Keep the artwork contract independent of the
// ignored design-output directory and of the asset-generation implementation.
const approvedAssets = {
  'brand/motionstudy-horizontal-color.svg': 'af292c024d48fa49550ea67f29ee3fed653f555d4a13bb1d8a3441c0ac6f931b',
  'brand/motionstudy-symbol-color.svg': 'eaf1eccfb65406cac4be5131fe07f9be4f518be357501cfb13d8c60054b538e4',
  'app-icons/icon-192.png': '289caf7ebfe87f9cfc5d46f48da0369655a16a15bab51886bff16812e5b93ee8',
  'app-icons/icon-512.png': '45c8bfd332d94e72025748a26dc5f3a6281335be9909de0edf963ec8227d752e',
  'app-icons/icon-maskable-512.png': '9e47f1412d6d8cca418107a07fe1a8c74caaf43a1682b239bd8f7ae0b9ca5c0b',
  'app-icons/apple-touch-icon.png': '64743b5d074486b0e8864044718b8df87833c49de73c3629445dd023de91d59f',
};

test('production logo and install icons contain the approved Leerblad artwork', async () => {
  for (const [path, fingerprint] of Object.entries(approvedAssets)) {
    const bytes = await readFile(new URL(path, publicURL));
    assert.equal(createHash('sha256').update(bytes).digest('hex'), fingerprint, path);
  }
});

test('production logo masters name the brand and render without external fonts or assets', async () => {
  for (const path of Object.keys(approvedAssets).filter(path => path.endsWith('.svg'))) {
    const svg = await readFile(new URL(path, publicURL), 'utf8');
    assert.match(svg, /role="img"/);
    assert.match(svg, /aria-labelledby="logo-title"/);
    assert.match(svg, /<title id="logo-title">MotionStudy logo<\/title>/);
    assert.doesNotMatch(svg, /<(?:text|image|script|foreignObject)\b|@import|url\(|(?:xlink:)?href=/i);
  }
});

test('each application entry point has an accessible logo home link', async () => {
  for (const path of ['index.html', 'beheer/index.html', 'analytics/index.html']) {
    const html = await readFile(new URL('../' + path, import.meta.url), 'utf8');
    const anchor = html.match(/<a\b[^>]*class="brand"[^>]*>[\s\S]*?<\/a>/)?.[0];
    assert.ok(anchor, path);
    assert.match(anchor, /aria-label="MotionStudy[^\"]*"/, path);
    assert.match(anchor, /brand\/motionstudy-horizontal-color\.svg/, path);
    assert.match(anchor, /alt=""/, path);
    assert.doesNotMatch(anchor, /brand-dot|<span/, path);
  }
});

const metaValue = (html, name) => {
  const tag = [...html.matchAll(/<meta\b[^>]*>/g)].find(([tag]) => tag.includes(`property="${name}"`) || tag.includes(`name="${name}"`))?.[0];
  return tag?.match(/content="([^\"]*)"/)?.[1];
};

test('Vite gives share crawlers absolute PNG URLs and preserves branding under a base path', async () => {
  const config = JSON.parse(await readFile(new URL('../wrangler.jsonc', import.meta.url), 'utf8'));
  const origin = new URL(config.vars.APP_ORIGIN).origin;
  const png = await readFile(new URL('brand/social-share.png', publicURL));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  for (const base of ['/', '/motion-study/']) {
    const result = await build({ root: fileURLToPath(new URL('../', import.meta.url)), base, build: { write: false }, logLevel: 'silent' });
    const output = (Array.isArray(result) ? result : [result]).flatMap(bundle => bundle.output);
    for (const page of ['index.html', 'beheer/index.html', 'analytics/index.html']) {
      const html = output.find(asset => asset.fileName === page)?.source;
      assert.equal(typeof html, 'string', page);
      assert.doesNotMatch(html, /%BASE_URL%/, page);
      for (const [, path] of html.matchAll(/(?:href|src)="([^\"]*(?:brand\/|app-icons\/)[^\"]*)"/g)) {
        assert.ok(path.startsWith(base), `${page}: ${path}`);
        const asset = new URL(path, origin);
        assert.ok((await readFile(new URL(asset.pathname.slice(base.length), publicURL))).byteLength, `${page}: ${path}`);
      }
      if (page !== 'index.html') {
        assert.equal(metaValue(html, 'robots'), 'noindex,nofollow');
        continue;
      }
      const image = new URL(metaValue(html, 'og:image'));
      assert.equal(image.protocol, 'https:');
      assert.equal(image.origin, origin);
      assert.equal(image.pathname, base + 'brand/social-share.png');
      assert.equal(metaValue(html, 'og:image:secure_url'), image.href);
      assert.equal(metaValue(html, 'twitter:image'), image.href);
      assert.equal(metaValue(html, 'twitter:card'), 'summary_large_image');
      assert.equal(metaValue(html, 'og:image:type'), 'image/png');
      assert.equal(metaValue(html, 'og:image:width'), String(png.readUInt32BE(16)));
      assert.equal(metaValue(html, 'og:image:height'), String(png.readUInt32BE(20)));
      assert.ok(metaValue(html, 'og:image:alt')?.includes('MotionStudy'));
      assert.equal(metaValue(html, 'og:url'), origin + base);
      assert.ok(html.includes(`rel="canonical" href="${origin + base}"`));
    }
  }
});

test('favicon and share assets remain publicly available with their real MIME types', async t => {
  const dir = await mkdtemp(join(tmpdir(), 'motionstudy-brand-'));
  const app = await startServer({
    port: 0, origin: 'https://motionstudy.test',
    databasePath: join(dir, 'accounts.sqlite'), distPath: fileURLToPath(publicURL),
  });
  t.after(async () => { await app.close(); await rm(dir, { recursive: true, force: true }); });
  const base = 'http://127.0.0.1:' + app.server.address().port;
  for (const [path, mime] of [
    ['favicon.ico', 'image/vnd.microsoft.icon'],
    ['favicon.svg', 'image/svg+xml'],
    ['app-icons/favicon.ico?v=leerblad-1', 'image/vnd.microsoft.icon'],
    ['app-icons/favicon.svg?v=leerblad-1', 'image/svg+xml'],
    ['app-icons/apple-touch-icon.png', 'image/png'],
    ['brand/motionstudy-horizontal-color.svg', 'image/svg+xml'],
    ['brand/social-share.png?v=leerblad-1', 'image/png'],
  ]) {
    const response = await fetch(base + '/' + path, { redirect: 'manual' });
    assert.equal(response.status, 200, path);
    assert.equal(response.headers.get('content-type'), mime, path);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), await readFile(new URL(path, publicURL)), path);
    const head = await fetch(base + '/' + path, { method: 'HEAD' });
    assert.equal(head.status, 200, path);
    assert.equal(head.headers.get('content-type'), mime, path);
    assert.equal((await head.arrayBuffer()).byteLength, 0, path);
  }
});
