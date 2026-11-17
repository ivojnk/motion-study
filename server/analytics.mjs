import { createHash, randomBytes } from 'node:crypto';

const DAY_MS = 86_400_000;
const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Amsterdam', year: 'numeric', month: '2-digit', day: '2-digit' });
export const analyticsDay = time => dayFormat.format(new Date(time));
const realAccounts = "username NOT LIKE 'deploy-check-%' AND username != 'cloudflare-browser-check'";
const isTestAccount = username => username.startsWith('deploy-check-') || username === 'cloudflare-browser-check';

export function createAnalytics({ db, now = Date.now, transaction = action => action() }) {
  const columns = db.prepare('PRAGMA table_info(users)').all().map(row => row.name);
  for (const [name, definition] of [['last_active_at', 'INTEGER NOT NULL DEFAULT 0'], ['last_active_day', "TEXT NOT NULL DEFAULT ''"], ['completed_lessons', 'INTEGER NOT NULL DEFAULT 0']]) {
    if (!columns.includes(name)) db.exec(`ALTER TABLE users ADD COLUMN ${name} ${definition}`);
  }
  db.exec(`CREATE TABLE IF NOT EXISTS analytics_meta (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS analytics_daily (day TEXT PRIMARY KEY, active_accounts INTEGER NOT NULL DEFAULT 0, lessons INTEGER NOT NULL DEFAULT 0);
    CREATE TABLE IF NOT EXISTS lesson_receipts (hash TEXT PRIMARY KEY, received_at INTEGER NOT NULL);
    CREATE INDEX IF NOT EXISTS lesson_receipts_expiry ON lesson_receipts(received_at);`);
  db.prepare('INSERT OR IGNORE INTO analytics_meta (key, value) VALUES (?, ?)').run('started_at', String(now()));
  db.prepare('INSERT OR IGNORE INTO analytics_meta (key, value) VALUES (?, ?)').run('receipt_salt', randomBytes(32).toString('hex'));
  const startedAt = Number(db.prepare("SELECT value FROM analytics_meta WHERE key = 'started_at'").get().value);
  const salt = db.prepare("SELECT value FROM analytics_meta WHERE key = 'receipt_salt'").get().value;
  function active(user, time = now()) {
    const day = analyticsDay(time);
    const previous = db.prepare('SELECT last_active_day FROM users WHERE id = ?').get(user.id);
    if (!previous) return;
    db.prepare('UPDATE users SET last_active_at = ?, last_active_day = ? WHERE id = ?').run(time, day, user.id);
    if (previous.last_active_day !== day) db.prepare('INSERT INTO analytics_daily (day, active_accounts) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET active_accounts = active_accounts + 1').run(day);
  }
  function record(user, kind, input = {}) {
    if (!user) return { error: 'unauthorized', status: 401 };
    if (input.accountId !== user.id) return { error: 'account-changed', status: 409 };
    if (!['active', 'lesson'].includes(kind)) return { error: 'invalid-event', status: 400 };
    const time = now();
    if (kind === 'lesson' && (typeof input.id !== 'string' || !/^[a-z0-9:-]{1,120}$/.test(input.id) || !Number.isSafeInteger(input.completedAt) || input.completedAt < startedAt || input.completedAt < time - 30 * DAY_MS || input.completedAt > time + 60_000)) return { error: 'invalid-event', status: 400 };
    if (isTestAccount(user.username)) return { recorded: false, testAccount: true };
    return transaction(() => {
      db.prepare('DELETE FROM lesson_receipts WHERE received_at < ?').run(time - 35 * DAY_MS);
      db.prepare('DELETE FROM analytics_daily WHERE day < ?').run(analyticsDay(time - 90 * DAY_MS));
      active(user, time);
      if (kind === 'active') return { recorded: true };
      const hash = createHash('sha256').update(salt + ':' + user.id + ':' + input.id).digest('hex');
      if (db.prepare('SELECT hash FROM lesson_receipts WHERE hash = ?').get(hash)) return { recorded: false, duplicate: true };
      db.prepare('INSERT INTO lesson_receipts (hash, received_at) VALUES (?, ?)').run(hash, time);
      db.prepare('UPDATE users SET completed_lessons = completed_lessons + 1 WHERE id = ?').run(user.id);
      db.prepare('INSERT INTO analytics_daily (day, lessons) VALUES (?, 1) ON CONFLICT(day) DO UPDATE SET lessons = lessons + 1').run(analyticsDay(input.completedAt));
      return { recorded: true };
    });
  }
  function summary(days = 7) {
    if (![7, 30, 90].includes(days)) days = 7;
    const time = now();
    const calendarNoon = Date.parse(analyticsDay(time) + 'T12:00:00Z');
    const dates = Array.from({ length: days }, (_, index) => analyticsDay(calendarNoon - (days - 1 - index) * DAY_MS));
    const since = dates[0];
    const totals = db.prepare(`SELECT COUNT(*) AS accounts, COALESCE(SUM(completed_lessons), 0) AS lessons, COALESCE(SUM(completed_lessons > 0), 0) AS learners FROM users WHERE ${realAccounts}`).get();
    const activeCount = db.prepare(`SELECT COUNT(*) AS count FROM users WHERE ${realAccounts} AND last_active_day >= ?`).get(since).count;
    const todayCount = db.prepare(`SELECT COUNT(*) AS count FROM users WHERE ${realAccounts} AND last_active_day = ?`).get(analyticsDay(time)).count;
    const registrations = db.prepare(`SELECT created_at FROM users WHERE ${realAccounts}`).all();
    const daily = new Map(db.prepare('SELECT day, active_accounts, lessons FROM analytics_daily WHERE day >= ? ORDER BY day').all(since).map(row => [row.day, row]));
    const newAccounts = new Map();
    for (const { created_at } of registrations) {
      const day = analyticsDay(created_at);
      newAccounts.set(day, (newAccounts.get(day) || 0) + 1);
    }
    const rows = dates.map(day => ({ day, accounts: newAccounts.get(day) || 0,
      activeAccounts: day < analyticsDay(startedAt) ? null : daily.get(day)?.active_accounts || 0,
      lessons: day < analyticsDay(startedAt) ? null : daily.get(day)?.lessons || 0 }));
    return { generatedAt: time, measuredFrom: startedAt, timezone: 'Europe/Amsterdam', days,
      totals: { ...totals, activeAccounts: activeCount, activeToday: todayCount },
      period: { accounts: rows.reduce((sum, row) => sum + row.accounts, 0), lessons: rows.reduce((sum, row) => sum + (row.lessons || 0), 0) }, daily: rows };
  }
  return { record, summary };
}
