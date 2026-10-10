import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { createAnalytics } from './analytics.mjs';
import { NOTICE_VERSION } from '../shared/legal.mjs';
import { MAX_PROGRESS_BYTES, validateProgressSnapshot } from '../shared/progress.mjs';

const SESSION_SECONDS = 30 * 24 * 60 * 60;
const digest = token => createHash('sha256').update(token).digest('hex');

// Shared synchronous account logic for Node SQLite and Cloudflare Durable Objects.
export function createAccountService({ db, origin, now = Date.now, sessionSeconds = SESSION_SECONDS, transaction }) {
  const appOrigin = new URL(origin).origin;
  const secure = appOrigin.startsWith('https:');
  const cookieName = secure ? '__Host-motionstudy.session' : 'motionstudy.session';
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, username TEXT NOT NULL UNIQUE, created_at INTEGER NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL, created_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS sessions_expiry ON sessions(expires_at);
    CREATE TABLE IF NOT EXISTS account_progress (user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE, revision INTEGER NOT NULL, snapshot TEXT NOT NULL, updated_at INTEGER NOT NULL);
  `);
  const sessionColumns = db.prepare('PRAGMA table_info(sessions)').all().map(row => row.name);
  for (const [name, definition] of [['notice_version', "TEXT NOT NULL DEFAULT ''"], ['analytics_allowed', 'INTEGER NOT NULL DEFAULT 0'], ['preferences_updated_at', 'INTEGER NOT NULL DEFAULT 0']]) {
    if (!sessionColumns.includes(name)) db.exec(`ALTER TABLE sessions ADD COLUMN ${name} ${definition}`);
  }
  const analytics = createAnalytics({ db, now, transaction });
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
    const user = db.prepare('SELECT users.id, users.username FROM sessions JOIN users ON users.id = sessions.user_id WHERE token_hash = ? AND expires_at > ? AND notice_version = ?').get(digest(token), now(), NOTICE_VERSION);
    return user ? { id: user.id, username: user.username } : null;
  }
  function preferencesFor(request) {
    const token = tokenFrom(request);
    const session = token && db.prepare('SELECT analytics_allowed FROM sessions WHERE token_hash = ? AND expires_at > ? AND notice_version = ?').get(digest(token), now(), NOTICE_VERSION);
    return { analytics: Boolean(session?.analytics_allowed) };
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
    if (path.startsWith('/api/usage/')) {
      if (request.method !== 'POST') return json({ error: 'Gebruik POST.' }, 405, { Allow: 'POST' });
      if (request.headers.get('origin') !== appOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Ongeldig verzoek.' }, 403);
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Ongeldig verzoek.' }, 415);
      const user = userFor(request);
      if (!user) return json({ error: 'Log opnieuw in.' }, 401);
      let input;
      try { const text = await request.text(); if (Buffer.byteLength(text) > 4096) return json({ error: 'Dit verzoek is te groot.' }, 413); input = JSON.parse(text); }
      catch { return json({ error: 'Ongeldig verzoek.' }, 400); }
      if (!input || typeof input !== 'object' || Array.isArray(input)) return json({ error: 'Ongeldig verzoek.' }, 400);
      if (!preferencesFor(request).analytics) return json({ recorded: false, disabled: true });
      const result = analytics.record(user, path.slice('/api/usage/'.length), input);
      return json(result, result.status || 200);
    }
    if (path === '/api/account/progress') {
      if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Gebruik GET of POST.' }, 405, { Allow: 'GET, POST' });
      if (request.headers.get('sec-fetch-site') === 'cross-site' || (request.method === 'POST' && request.headers.get('origin') !== appOrigin)) return json({ error: 'Ongeldig verzoek.' }, 403);
      const user = userFor(request);
      if (!user) return json({ error: 'Log opnieuw in.' }, 401);
      const expectedAccount = request.headers.get('x-motionstudy-account');
      if (expectedAccount && expectedAccount !== user.id) return json({ error: 'Je account is gewijzigd. Log opnieuw in.' }, 401);
      const read = () => {
        const row = db.prepare('SELECT revision, snapshot, updated_at FROM account_progress WHERE user_id = ?').get(user.id);
        return row ? { revision: row.revision, snapshot: JSON.parse(row.snapshot), updatedAt: row.updated_at } : { revision: 0, snapshot: null, updatedAt: null };
      };
      if (request.method === 'GET') return json(read());
      if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Ongeldig verzoek.' }, 415);
      let input, snapshot;
      try {
        const text = await request.text();
        if (Buffer.byteLength(text) > MAX_PROGRESS_BYTES + 4096) return json({ error: 'Dit verzoek is te groot.' }, 413);
        input = JSON.parse(text);
        if (!Number.isSafeInteger(input?.revision) || input.revision < 0) throw new Error('Ongeldige versie.');
        snapshot = validateProgressSnapshot(input.snapshot);
      } catch { return json({ error: 'Ongeldige voortgang.' }, 400); }
      const write = () => {
        const current = read();
        if (input.revision !== current.revision && JSON.stringify(snapshot) === JSON.stringify(current.snapshot)) return json({ revision: current.revision, updatedAt: current.updatedAt });
        if (input.revision !== current.revision) return json({ ...current, error: 'Voortgang is op een ander apparaat gewijzigd.' }, 409);
        const revision = current.revision + 1;
        const updatedAt = now();
        db.prepare('INSERT INTO account_progress (user_id, revision, snapshot, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id) DO UPDATE SET revision = excluded.revision, snapshot = excluded.snapshot, updated_at = excluded.updated_at').run(user.id, revision, JSON.stringify(snapshot), updatedAt);
        return json({ revision, updatedAt });
      };
      // No await inside this transaction: read/version-check/write are indivisible.
      return transaction ? transaction(write) : write();
    }
    if (path === '/api/account/session' && request.method === 'GET') return json({ user: userFor(request), preferences: preferencesFor(request) });
    if (!['/api/account/enter', '/api/account/logout', '/api/account/preferences'].includes(path)) return json({ error: 'Deze pagina bestaat niet.' }, 404);
    if (request.method !== 'POST') return json({ error: 'Gebruik POST.' }, 405, { Allow: 'POST' });
    if (request.headers.get('origin') !== appOrigin || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Open MotionStudy opnieuw.' }, 403);
    if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Ongeldig verzoek.' }, 415);
    if (path === '/api/account/logout') {
      const token = tokenFrom(request);
      if (token) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(token));
      return json({ user: null }, 200, { 'Set-Cookie': cookie('', 0) });
    }
    if (!allowed(ip)) return json({ error: 'Probeer over een minuut opnieuw.' }, 429, { 'Retry-After': '60' });
    let body;
    try {
      const text = await request.text();
      if (Buffer.byteLength(text) > 4096) return json({ error: 'Dit verzoek is te groot.' }, 413);
      body = JSON.parse(text);
    } catch { return json({ error: 'Ongeldig verzoek.' }, 400); }
    if (path === '/api/account/preferences') {
      if (!userFor(request)) return json({ error: 'Log opnieuw in.' }, 401);
      if (typeof body?.analytics !== 'boolean') return json({ error: 'Kies of je gebruiksstatistieken wilt delen.' }, 400);
      db.prepare('UPDATE sessions SET analytics_allowed = ?, preferences_updated_at = ? WHERE token_hash = ?').run(Number(body.analytics), now(), digest(tokenFrom(request)));
      return json({ preferences: preferencesFor(request) });
    }
    const username = typeof body?.username === 'string' ? body.username.trim().toLowerCase() : '';
    if (!/^[a-z0-9][a-z0-9._-]{1,23}$/.test(username)) return json({ error: 'Gebruik 2 tot 24 letters, cijfers, punten, streepjes of underscores. Begin met een letter of cijfer.' }, 400);
    if (body.acknowledged !== true || body.noticeVersion !== NOTICE_VERSION) return json({ error: 'Vink aan dat je de informatie over inloggen en opslag hebt gelezen.' }, 400);
    if (body.analytics !== undefined && typeof body.analytics !== 'boolean') return json({ error: 'Ongeldige keuze voor gebruiksstatistieken.' }, 400);
    db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(now());
    const created = !db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    db.prepare('INSERT OR IGNORE INTO users (id, username, created_at) VALUES (?, ?, ?)').run(randomUUID(), username, now());
    const user = db.prepare('SELECT id, username FROM users WHERE username = ?').get(username);
    const previous = tokenFrom(request);
    if (previous) db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(digest(previous));
    const token = randomBytes(32).toString('hex');
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at, notice_version, analytics_allowed, preferences_updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)').run(digest(token), user.id, now() + sessionSeconds * 1000, now(), NOTICE_VERSION, Number(body.analytics === true), now());
    return json({ user: { id: user.id, username: user.username }, created, preferences: { analytics: body.analytics === true } }, 200, { 'Set-Cookie': cookie(token, sessionSeconds) });
  }
  return { handle, userFor, analytics, close: () => db.close?.() };
}
