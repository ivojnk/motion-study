import { DurableObject } from 'cloudflare:workers';
import { createAccountService } from './account-service.mjs';
import { progressRequestLimit } from '../shared/progress.mjs';
import { hasOwnerSession, ownerRoute } from './owner-routes.mjs';
export { OwnerAuth } from './owner-auth.mjs';

export class Accounts extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    const sql = ctx.storage.sql;
    const db = {
      exec: query => sql.exec(query).toArray(),
      prepare: query => ({
        get: (...params) => sql.exec(query, ...params).toArray()[0],
        all: (...params) => sql.exec(query, ...params).toArray(),
        run: (...params) => sql.exec(query, ...params).toArray(),
      }),
    };
    this.accounts = createAccountService({ db, origin: env.APP_ORIGIN, transaction: action => ctx.storage.transactionSync(action) });
  }

  async fetch(request) {
    // Consume the transport body before an early origin/type/logout response.
    // Durable Object fetch streams must not outlive the response.
    let buffered = request;
    if (request.body) {
      const reader = request.body.getReader();
      const chunks = [];
      let size = 0;
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (size + value.byteLength > progressRequestLimit(new URL(request.url).pathname)) {
          await reader.cancel();
          return new Response(JSON.stringify({ error: 'Dit verzoek is te groot.' }), {
            status: 413, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
          });
        }
        chunks.push(value);
        size += value.byteLength;
      }
      const body = new Uint8Array(size);
      let offset = 0;
      for (const chunk of chunks) { body.set(chunk, offset); offset += chunk.byteLength; }
      buffered = new Request(request, { body });
    }
    return this.accounts.handle(buffered, request.headers.get('CF-Connecting-IP') || 'unknown');
  }

  userFor(cookie) {
    return this.accounts.userFor(new Request(this.env.APP_ORIGIN, { headers: { cookie: cookie || '' } }));
  }

  analytics(days) { return this.accounts.analytics.summary(days); }
}

export default {
  async fetch(request, env) {
    let response;
    try {
      const url = new URL(request.url);
      const pathname = decodeURIComponent(url.pathname);
      const accounts = env.ACCOUNTS.get(env.ACCOUNTS.idFromName('accounts-v1'));
      if (url.pathname.startsWith('/api/owner/')) {
        response = await ownerRoute(request, env);
      } else if (pathname === '/api/analytics') {
        response = !await hasOwnerSession(request, env) ? Response.json({ error: 'Log in met je beheerderspasskey.' }, { status: 401 })
          : request.method !== 'GET' ? new Response('Gebruik GET.', { status: 405 })
          : Response.json(await accounts.analytics(Number(url.searchParams.get('days')) || 7));
      } else if (/^\/+analytics(\/|$)/.test(pathname) && !await hasOwnerSession(request, env)) {
        response = Response.redirect(env.APP_ORIGIN + '/beheer/', 302);
      } else if (url.pathname.startsWith('/api/')) {
        response = await accounts.fetch(request);
      } else if (!['GET', 'HEAD'].includes(request.method)) {
        response = new Response('Gebruik GET of HEAD.', { status: 405, headers: { Allow: 'GET, HEAD' } });
      } else if (/^\/+(models|draco)(\/|$)/.test(pathname) && !await accounts.userFor(request.headers.get('cookie'))) {
        response = new Response('Vul eerst je gebruikersnaam in.', { status: 401 });
      } else {
        response = await env.ASSETS.fetch(request);
      }
    } catch (error) {
      response = new Response('De pagina kon niet worden geladen.', { status: error instanceof URIError ? 404 : 500 });
    }
    const secured = new Response(response.body, response);
    secured.headers.set('X-Content-Type-Options', 'nosniff');
    secured.headers.set('Referrer-Policy', 'same-origin');
    secured.headers.set('X-Frame-Options', 'DENY');
    secured.headers.set('Strict-Transport-Security', 'max-age=31536000');
    secured.headers.set('Cache-Control', 'no-store');
    return secured;
  },
};
