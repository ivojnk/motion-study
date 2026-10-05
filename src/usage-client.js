const KEY = 'motionstudy.analytics.pending.v1';
const MAX_AGE = 30 * 86_400_000;

export function createUsageClient({ accountId, storage, enabled = false, fetchImpl = fetch, now = Date.now }) {
  let allowed = enabled;
  let flushing = false;
  let lastActive = 0;
  let memory = [];
  let storageAvailable = true;
  const read = () => {
    if (!storageAvailable) return memory;
    try {
      const value = JSON.parse(storage.getItem(KEY) || '[]');
      return Array.isArray(value) ? value.filter(event => event && typeof event.id === 'string' && /^[a-z0-9:-]{1,120}$/.test(event.id) && Number.isSafeInteger(event.completedAt) && event.completedAt >= now() - MAX_AGE).slice(-50) : [];
    } catch { storageAvailable = false; return memory; }
  };
  const write = events => {
    memory = events;
    try { storage.setItem(KEY, JSON.stringify(events)); } catch { storageAvailable = false; }
  };
  async function send(kind, event = {}) {
    if (!allowed) return false;
    try {
      const response = await fetchImpl('/api/usage/' + kind, { method: 'POST', credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId, ...event }) });
      // Invalid/expired events cannot become valid by retrying. Authentication errors can.
      return response.ok || response.status === 400;
    } catch { return false; }
  }
  async function flush() {
    if (!allowed || flushing) return;
    flushing = true;
    try {
      for (const event of read()) {
        if (!await send('lesson', event)) break;
        write(read().filter(item => item.id !== event.id));
      }
    } finally { flushing = false; }
  }
  async function active() {
    if (!allowed || (lastActive && now() - lastActive < 60_000)) return;
    if (await send('active')) lastActive = now();
    await flush();
  }
  function lessonFinished(session) {
    if (!allowed) return;
    if (!session?.finished || !session.answered || !Number.isSafeInteger(session.startedAt) || !Number.isSafeInteger(session.finishedAt)) return;
    const event = { id: `${session.startedAt}:${session.region}:${session.levelId || 'practice'}`, completedAt: session.finishedAt };
    write([...read().filter(item => item.id !== event.id), event].slice(-50));
    void flush();
  }
  function setEnabled(value) {
    allowed = value === true;
    lastActive = 0;
    write([]);
  }
  if (!allowed) write([]);
  return { active, lessonFinished, flush, setEnabled };
}
