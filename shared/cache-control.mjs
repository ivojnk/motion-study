// Hashed build files never change, so browsers may keep them. The 3D models sit behind a login,
// so only the browser keeps them (private), for a day. Everything else, HTML included, stays fresh.
export function cacheControlFor(pathname, status) {
  if (status !== 200 && status !== 304) return 'no-store';
  if (/^\/assets\//.test(pathname)) return 'public, max-age=31536000, immutable';
  if (/^\/(models|draco)\//.test(pathname)) return 'private, max-age=86400';
  return 'no-store';
}
