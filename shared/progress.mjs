// Shared by the account API and the browser. Only learning data is synchronized.
export const MAX_PROGRESS_BYTES = 5 * 1024 * 1024;
export const PROGRESS_KEYS = ['motionstudy.progress.v1', 'motionstudy.game.v2', 'motionstudy.drafts.v2', 'motionstudy.session.v2'];
export const progressRequestLimit = pathname => pathname === '/api/account/progress' ? MAX_PROGRESS_BYTES + 4096 : 4096;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
export function validateProgressSnapshot(input) {
  if (!object(input) || Object.keys(input).length !== PROGRESS_KEYS.length || !PROGRESS_KEYS.every(key => Object.hasOwn(input, key))) throw new Error('Ongeldige voortgang.');
  const result = {};
  for (const key of PROGRESS_KEYS) {
    const raw = input[key];
    if (raw !== null && typeof raw !== 'string') throw new Error('Ongeldige voortgang.');
    const value = raw === null ? null : JSON.parse(raw, (name, item) => {
      if (['__proto__', 'constructor', 'prototype'].includes(name)) throw new Error('Ongeldige voortgang.');
      return item;
    });
    if (value !== null && !object(value)) throw new Error('Ongeldige voortgang.');
    if (value && key === PROGRESS_KEYS[0] && (!object(value.questions) || !Array.isArray(value.sessions))) throw new Error('Ongeldige voortgang.');
    if (value && key === PROGRESS_KEYS[1] && (!object(value.days) || !Array.isArray(value.completed))) throw new Error('Ongeldige voortgang.');
    result[key] = raw;
  }
  if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_PROGRESS_BYTES) throw new Error('Voortgang is te groot.');
  return result;
}

// Combines two snapshots so nothing either device learned is dropped.
// Used when two devices saved different progress since their last sync.
const parse = raw => { try { return raw === null ? null : JSON.parse(raw); } catch { return null; } };
const attemptsOf = entry => Number.isInteger(entry?.attempts) ? entry.attempts : -1;
const sessionKey = item => JSON.stringify([item?.at, item?.correct, item?.total, item?.region ?? null, item?.levelId ?? null]);
function mergeLearning(base, extra) {
  const questions = { ...base.questions };
  // One answer history per question: keep the one with more answers (the later one on a tie).
  for (const [id, entry] of Object.entries(extra.questions || {})) {
    const current = questions[id];
    if (!current || attemptsOf(entry) > attemptsOf(current) || (attemptsOf(entry) === attemptsOf(current) && (entry.due || 0) > (current.due || 0))) questions[id] = entry;
  }
  const sessions = new Map();
  for (const item of [...(base.sessions || []), ...(extra.sessions || [])]) sessions.set(sessionKey(item), item);
  return { ...base, ...extra, questions, sessions: [...sessions.values()].sort((a, b) => (a?.at || 0) - (b?.at || 0)) };
}
function mergeGame(base, extra) {
  const days = { ...base.days };
  for (const [day, xp] of Object.entries(extra.days || {})) days[day] = Math.max(days[day] || 0, Number.isFinite(xp) ? xp : 0);
  const merged = { ...base, ...extra, days, completed: [...new Set([...(base.completed || []), ...(extra.completed || [])])] };
  // Any other counters (rewards, streak markers) keep the higher value or both lists.
  for (const [key, value] of Object.entries(base)) {
    if (['days', 'completed'].includes(key)) continue;
    const other = extra[key];
    if (typeof value === 'number' && typeof other === 'number') merged[key] = Math.max(value, other);
    else if (Array.isArray(value) && Array.isArray(other)) merged[key] = [...new Map([...value, ...other].map(item => [JSON.stringify(item), item])).values()];
  }
  return merged;
}
export function mergeProgressSnapshots(current, incoming) {
  const [learning, game, drafts, session] = PROGRESS_KEYS;
  if (!current) return incoming;
  const result = {};
  for (const key of PROGRESS_KEYS) {
    // The open lesson is whatever this device is doing now.
    if (key === session) { result[key] = incoming[key]; continue; }
    const a = parse(current[key]), b = parse(incoming[key]);
    if (a === null || b === null) { result[key] = incoming[key] ?? current[key]; continue; }
    if (key === learning) result[key] = JSON.stringify(mergeLearning(a, b));
    else if (key === game) result[key] = JSON.stringify(mergeGame(a, b));
    else if (key === drafts) result[key] = JSON.stringify({ ...a, ...b });
    else result[key] = incoming[key];
  }
  return validateProgressSnapshot(result);
}
