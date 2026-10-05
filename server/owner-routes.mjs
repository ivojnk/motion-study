import { ownerCookie, ownerToken } from './owner-auth.mjs';

const json = (data, status = 200) => Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } });
export const ownerStub = env => env.OWNER_AUTH.get(env.OWNER_AUTH.idFromName('owner-v1'));
export const hasOwnerSession = (request, env) => ownerStub(env).check(ownerToken(request), new URL(request.url).origin);

async function bodyFor(request) {
  if (!request.body) throw new Error('missing-body');
  const reader = request.body.getReader();
  let bytes = new Uint8Array(0);
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (bytes.byteLength + value.byteLength > 16_384) { await reader.cancel(); throw new Error('too-large'); }
    const combined = new Uint8Array(bytes.byteLength + value.byteLength);
    combined.set(bytes); combined.set(value, bytes.byteLength); bytes = combined;
  }
  const body = JSON.parse(new TextDecoder().decode(bytes));
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new Error('invalid-body');
  return body;
}

export async function ownerRoute(request, env) {
  const path = new URL(request.url).pathname;
  const owner = ownerStub(env);
  if (path === '/api/owner/state' && request.method === 'GET') return json({ configured: await owner.configured(), authenticated: await hasOwnerSession(request, env) });
  const match = /^\/api\/owner\/(register|login)\/(options|finish)$/.exec(path);
  if (!match && path !== '/api/owner/logout') return json({ error: 'Pagina niet gevonden.' }, 404);
  if (request.method !== 'POST') return json({ error: 'Gebruik POST.' }, 405);
  if (request.headers.get('origin') !== env.APP_ORIGIN || request.headers.get('sec-fetch-site') === 'cross-site') return json({ error: 'Ongeldig verzoek.' }, 403);
  if (!request.headers.get('content-type')?.startsWith('application/json')) return json({ error: 'Ongeldig verzoek.' }, 415);
  let body;
  try { body = await bodyFor(request); } catch (error) { return json({ error: 'Ongeldig verzoek.' }, error.message === 'too-large' ? 413 : 400); }
  if (path === '/api/owner/logout') {
    await owner.logout(ownerToken(request));
    const response = json({ authenticated: false });
    response.headers.set('Set-Cookie', ownerCookie(request, '', 0));
    return response;
  }
  const [, kind, action] = match;
  const result = action === 'options' ? await owner.options(kind, env.APP_ORIGIN, body.setupKey) : await owner.finish(kind, env.APP_ORIGIN, body, body.setupKey);
  if (result.error) return json({ error: result.error }, result.error === 'rate-limit' ? 429 : 403);
  if (result.token) {
    const response = json({ authenticated: true });
    response.headers.set('Set-Cookie', ownerCookie(request, result.token));
    return response;
  }
  return json(result);
}
