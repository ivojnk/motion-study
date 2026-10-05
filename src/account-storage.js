export const ACCOUNT_EVENT_KEY = 'motionstudy.active-account';

export function accountStorage(storage, userId) {
  const prefix = 'motionstudy.account.' + userId + '.';
  return {
    getItem: key => storage.getItem(prefix + key),
    setItem: (key, value) => storage.setItem(prefix + key, value),
    removeItem: key => storage.removeItem(prefix + key),
    keyFor: key => prefix + key,
  };
}
