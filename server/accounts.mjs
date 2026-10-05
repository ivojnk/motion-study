import { DatabaseSync } from 'node:sqlite';
import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

const SESSION_SECONDS = 30 * 24 * 60 * 60;
const digest = token => createHash('sha256').update(token).digest('hex');

// A username is deliberately the only credential. Anyone who knows it can enter.
export function createAccounts({ databasePath, origin, now = Date.now, sessionSeconds = SESSION_SECONDS }) {
  const appOrigin = new URL(origin).origin;
  const secure = appOrigin.startsWith('https:');
  const cookieName = secure ? '__Host-motionstudy.session' : 'motionstudy.session';
  if (databasePath !== ':memory:') mkdirSync(dirname(databasePath), { recursive: true, mode: 0o700 });
  const db = new DatabaseSync(databasePath);
  db.exec(`PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);`);
  const attempts = new Map();
  const tokenFrom = request => {
    const value = (request.headers.get('cookie') || '').split(';').map(part => part.trim()).find(part => part.startsWith(cookieName + '='))?.slice(cookieName.length + 1);
    return value && /^[a-f0-9]{64}$/.test(value) ? value : null;
  };
  const cookie = (token, maxAge) => `${cookieName}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure ? '; Secure' : ''}`;
  const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
    status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...extra },
  });
  function userFor(request) {
    const token = tokenFrom(request);
    if (!token) return null;
    const user = db.prepare('SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ?').get(digest(token), now());
    return user ? { id: user.id, username: user.username } : null;
  }
  function allowed(ip) {
    const time = now();
    for (const [key, value] of attempts) if (value.until <= time) attempts.delete(key);
    const value = attempts.get(ip) || { count: 0, until: time + 60_000 };
    if (value.count >= 20 || (!attempts.has(ip) && attempts.size >= 10_000)) return false;
    attempts.set(ip, { ...value, count: value.count + 1 });
    return true;
  }
  async function handle(request, ip = 'local') {
    const path = new URL(request.url).pathname;
    if (path === '/api/account/session' && request.method === 'GET') return json({ user: userFor(request) });
    if (!['/api/account/enter', '/api/account/logout'].includes(path)) return json({ error: 'Deze pagina bestaat niet.' }, 404);
    if (request.method !== 'POST') return json({ error: 'Gebruik POST.' }, 405, { Allow: 'POST' });
    if (request.headers.get('origin') !== appOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Open MotionStudy opnieuw en probeer het nog eens.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Ongeldig verzoek.' }, 415);
    if (path === '/api/account/logout') {
      const token = tokenFrom(request);
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
      return json({ user: null }, 200, { 'Set-Cookie': cookie('', 0) });
    }
    if (!allowed(ip)) return json({ error: 'Even rustig aan. Probeer het over een minuut opnieuw.' }, 429, { 'Retry-After': '60' });
    let body;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text) > 4096) return json({ error: 'Dit verzoek is te groot.' }, 413);
      body = JSON.parse(text);
    } catch { return json({ error: 'Ongeldig verzoek.' }, 400); }
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
    if (!/^[a-z0-9][a-z0-9._-]{1,23}$/.test(username)) return json({ error: 'Gebruik 2 tot 24 letters, cijfers, punten, streepjes of underscores. Begin met een letter of cijfer.' }, 400);
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    const created = !db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    db.prepare('INSERT OR IGNORE INTO users (id, username, created_at) VALUES (?, ?, ?)').run(randomUUID(), username, now());
    const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
    const previous = tokenFrom(request);
    if (previous) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(previous));
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(digest(token), user.id, now() + sessionSeconds * 1000, now());
    return json({ user: { id: user.id, username: user.username }, created }, 200, { 'Set-Cookie': cookie(token, sessionSeconds) });
  }
  return { handle, userFor, close: () => db.close() };
}
