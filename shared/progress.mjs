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
