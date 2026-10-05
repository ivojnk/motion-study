import { createServer } from 'node:http';
import { readFile, stat, realpath } from 'node:fs/promises';
import { resolve, sep, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createAccounts } from './accounts.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.glb': 'model/gltf-binary', '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.wasm': 'application/wasm', '.txt': 'text/plain; charset=utf-8' };

export async function startServer({ port = 5173, host = '127.0.0.1', origin = `http://${host}:${port}`, databasePath = resolve(root, '.data/accounts.sqlite'), dev = false, distPath = resolve(root, 'dist') } = {}) {
  const url = new URL(origin);
  if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') throw new Error('Production requires an HTTPS APP_ORIGIN.');
  const accounts = createAccounts({ databasePath, origin });
  let vite = null;
  const server = createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'same-origin');
    res.setHeader('X-Frame-Options', 'DENY');
    if (url.protocol === 'https:') res.setHeader('Strict-Transport-Security', 'max-age=31536000');
    try {
      const requestURL = new URL(req.url, url.origin);
      const pathname = decodeURIComponent(requestURL.pathname);
      if (requestURL.pathname.startsWith('/api/')) {
        const chunks = [];
        let size = 0;
        for await (const chunk of req) {
          size += chunk.length;
          if (size > 4096) { res.writeHead(413, { 'Cache-Control': 'no-store' }); res.end(); return; }
          chunks.push(chunk);
        }
        const request = new Request(requestURL, { method: req.method, headers: req.headers, ...(!['GET', 'HEAD'].includes(req.method) ? { body: Buffer.concat(chunks) } : {}) });
        const response = await accounts.handle(request, req.socket.remoteAddress);
        res.writeHead(response.status, Object.fromEntries(response.headers));
        res.end(await response.text());
        return;
      }
      // The public shell shows the username form. Large atlas assets load after entry.
      const sessionRequest = new Request(requestURL, { headers: req.headers });
      if (/^\/+(models|draco)(\/|$)/.test(pathname) && !accounts.userFor(sessionRequest)) {
        res.writeHead(401, { 'Cache-Control': 'no-store' }); res.end('Vul eerst je gebruikersnaam in.'); return;
      }
      if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
      if (dev) { vite.middlewares(req, res); return; }
      const path = resolve(distPath, '.' + (pathname.endsWith('/') ? pathname + 'index.html' : pathname));
      const realRoot = await realpath(distPath);
      const realFile = await realpath(path);
      if (!realFile.startsWith(realRoot + sep) || !(await stat(realFile)).isFile()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': types[extname(realFile)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : await readFile(realFile));
    } catch (error) {
      res.writeHead(error.code === 'ENOENT' || error instanceof URIError ? 404 : 500);
      res.end('De pagina kon niet worden geladen.');
    }
  });
  if (dev) vite = await (await import('vite')).createServer({ root, server: { middlewareMode: true, ws: { server } }, appType: 'spa' });
  server.requestTimeout = 15_000;
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, resolve); });
  return { server, accounts, close: async () => { await vite?.close(); await new Promise(resolve => server.close(resolve)); accounts.close(); } };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 5173);
  const host = process.env.HOST || '127.0.0.1';
  const app = await startServer({ port, host, origin: process.env.APP_ORIGIN || `http://127.0.0.1:${port}`, databasePath: process.env.ACCOUNTS_DB || resolve(root, '.data/accounts.sqlite'), dev: process.argv.includes('--dev') });
  console.log(`MotionStudy: ${process.env.APP_ORIGIN || `http://127.0.0.1:${port}`}`);
  for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, async () => { await app.close(); process.exit(0); });
}
