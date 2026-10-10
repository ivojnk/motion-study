import { PROGRESS_KEYS, validateProgressSnapshot } from '../shared/progress.mjs';

export const SYNC_KEY = 'motionstudy.sync.v1';
export const RECOVERY_KEY = 'motionstudy.sync.recovery.v1';
export const SERVER_RECOVERY_KEY = 'motionstudy.sync.server-recovery.v1';
const ROLLBACK_KEY = 'motionstudy.sync.rollback.v1';
const snapshotOf = storage => validateProgressSnapshot(Object.fromEntries(PROGRESS_KEYS.map(key => [key, storage.getItem(key) ?? null])));
const meaningful = snapshot => {
  const values = PROGRESS_KEYS.map(key => JSON.parse(snapshot[key] || 'null'));
  return Boolean(Object.keys(values[0]?.questions || {}).length || values[0]?.sessions?.length ||
    values[1]?.xp || values[1]?.completed?.length || Object.keys(values[1]?.days || {}).length ||
    Object.keys(values[2] || {}).length || values[3]);
};

// Main's synchronous storage interface stays intact. A complete save is uploaded
// after the current JS turn, under the same account lock as lesson writes.
export function createProgressSync({ storage, accountId, initialSnapshot = null, fetchImpl = fetch, withLock = action => action(), onStatus = () => {}, onConflict = async () => 'cancel', onReload = () => {} }) {
  let inFlight = null;
  let stopped = false;
  let initialized = false;
  let conflictPaused = false;
  const meta = () => {
    const value = JSON.parse(storage.getItem(SYNC_KEY) || 'null');
    return value && Number.isSafeInteger(value.revision) && value.revision >= 0 && typeof value.dirty === 'boolean' ? value : null;
  };
  const setMeta = value => storage.setItem(SYNC_KEY, JSON.stringify(value));
  const request = async body => {
    const response = await fetchImpl('/api/account/progress', {
      credentials: 'same-origin', cache: 'no-store', signal: AbortSignal.timeout(15_000),
      headers: { ...(accountId ? { 'X-MotionStudy-Account': accountId } : {}), ...(body ? { 'Content-Type': 'application/json' } : {}) },
      ...(body ? { method: 'POST', body: JSON.stringify(body) } : {}),
    });
    const data = await response.json();
    if (!response.ok && response.status !== 409) throw new Error(data.error || 'Opslaan op de server lukt niet.');
    if (!Number.isSafeInteger(data.revision) || data.revision < 0) throw new Error('Ongeldige serverversie.');
    if (!body || response.status === 409) {
      if (data.snapshot !== null) data.snapshot = validateProgressSnapshot(data.snapshot);
    }
    return { ...data, conflict: response.status === 409 };
  };
  function adopt(remote, dirty = false) {
    // Retain the entire old local snapshot before any partial storage write.
    const local = snapshotOf(storage);
    const snapshot = remote.snapshot || Object.fromEntries(PROGRESS_KEYS.map(key => [key, null]));
    if (JSON.stringify(local) === JSON.stringify(snapshot)) { setMeta({ revision: remote.revision, dirty }); return; }
    storage.setItem(ROLLBACK_KEY, JSON.stringify(local));
    if (meaningful(local)) storage.setItem(RECOVERY_KEY, JSON.stringify(local));
    const previousMeta = storage.getItem(SYNC_KEY);
    // An interrupted adoption must be rolled back from this recovery snapshot.
    setMeta({ revision: meta()?.revision || 0, dirty: true, recoveryRequired: true });
    try {
      writeSnapshot(snapshot);
      setMeta({ revision: remote.revision, dirty });
    } catch (error) {
      writeSnapshot(local);
      if (previousMeta === null) storage.removeItem(SYNC_KEY);
      else storage.setItem(SYNC_KEY, previousMeta);
      throw error;
    }
  }
  function writeSnapshot(snapshot) {
    for (const key of PROGRESS_KEYS) {
      if (snapshot[key] === null) storage.removeItem(key);
      else storage.setItem(key, snapshot[key]);
    }
  }
  function recoverAdoption() {
    const current = meta();
    if (!current?.recoveryRequired) return;
    const recovery = validateProgressSnapshot(JSON.parse(storage.getItem(ROLLBACK_KEY) || storage.getItem(RECOVERY_KEY)));
    writeSnapshot(recovery);
    setMeta({ revision: current.revision, dirty: true });
  }
  async function upload() {
    if (conflictPaused) return false;
    recoverAdoption();
    const current = meta();
    if (!current?.dirty) return true;
    onStatus('pending');
    let submitted = snapshotOf(storage);
    let result = await request({ revision: current.revision, snapshot: submitted });
    if (result.conflict) {
      onStatus('conflict');
      const choice = await onConflict({ local: snapshotOf(storage), remote: result });
      if (stopped || choice === 'cancel') { conflictPaused = true; return false; }
      if (choice === 'server') {
        adopt(result);
        onStatus('saved');
        onReload();
        return true;
      }
      if (choice !== 'local') return false;
      // Explicit replacement still uses CAS; another newer write remains safe.
      setMeta({ revision: result.revision, dirty: true });
      submitted = snapshotOf(storage);
      result = await request({ revision: result.revision, snapshot: submitted });
      if (result.conflict) { onStatus('conflict'); return false; }
    }
    const dirty = JSON.stringify(snapshotOf(storage)) !== JSON.stringify(submitted);
    setMeta({ revision: result.revision, dirty });
    onStatus(dirty ? 'pending' : 'saved');
    return !dirty;
  }
  async function initialize() {
    return withLock(async () => {
      recoverAdoption();
      const current = meta();
      let local = snapshotOf(storage);
      let remote;
      try { remote = await request(); }
      catch (error) {
        // Never invent an empty starting point when the server cannot be read.
        if (initialSnapshot || (!current && !meaningful(local))) throw error;
        if (!current) setMeta({ revision: 0, dirty: true });
        initialized = true;
        onStatus('offline');
        return;
      }
      if (initialSnapshot) {
        if (remote.snapshot) storage.setItem(SERVER_RECOVERY_KEY, JSON.stringify(remote.snapshot));
        adopt({ revision: remote.revision, snapshot: validateProgressSnapshot(initialSnapshot) }, true);
        initialized = true;
        try { await upload(); } catch { onStatus('offline'); }
        return;
      }
      // A browser without Web Locks may have saved while GET was in flight.
      const latest = meta();
      local = snapshotOf(storage);
      if (latest?.dirty || (!latest && meaningful(local))) {
        if (!latest) setMeta({ revision: 0, dirty: true });
        initialized = true;
        try { await upload(); } catch { onStatus('offline'); }
      } else {
        adopt(remote);
        initialized = true;
        onStatus('saved');
      }
    });
  }
  function flush() {
    if (stopped || !initialized || conflictPaused) return Promise.resolve(false);
    if (inFlight) return inFlight;
    inFlight = Promise.resolve(withLock(upload)).catch(() => { onStatus('offline'); return false; }).finally(() => { inFlight = null; });
    return inFlight;
  }
  function changed(key) {
    if (!PROGRESS_KEYS.includes(key)) return;
    const current = meta() || { revision: 0 };
    setMeta({ revision: current.revision, dirty: true });
    queueMicrotask(() => { void flush(); });
  }
  const syncedStorage = {
    ...storage,
    getItem: key => storage.getItem(key),
    setItem(key, value) {
      if (storage.getItem(key) === value) return;
      // Mark dirty before the actual write, so a crash cannot leave a clean cache.
      changed(key);
      storage.setItem(key, value);
    },
    removeItem(key) { changed(key); storage.removeItem(key); },
  };
  async function refresh() {
    if (stopped || !initialized) return false;
    if (meta()?.dirty) return flush();
    if (inFlight) return inFlight;
    inFlight = Promise.resolve(withLock(async () => {
      if (meta()?.dirty) return upload();
      const remote = await request();
      if (meta()?.dirty) return upload();
      if (remote.revision !== meta()?.revision) { adopt(remote); onReload(); }
      onStatus('saved');
      return true;
    })).catch(() => { onStatus('offline'); return false; }).finally(() => { inFlight = null; });
    return inFlight;
  }
  async function replace(snapshot) {
    if (inFlight) await inFlight;
    inFlight = Promise.resolve(withLock(async () => {
      const remote = await request();
      if (remote.snapshot) storage.setItem(SERVER_RECOVERY_KEY, JSON.stringify(remote.snapshot));
      adopt({ revision: remote.revision, snapshot: validateProgressSnapshot(snapshot) }, true);
      conflictPaused = false;
      try { await upload(); } catch { onStatus('offline'); }
      onReload();
    })).finally(() => { inFlight = null; });
    return inFlight;
  }
  return { storage: syncedStorage, initialize, flush, refresh, replace, stop() { stopped = true; } };
}
