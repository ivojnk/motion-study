import { DurableObject } from 'cloudflare:workers';
import { generateRegistrationOptions, verifyRegistrationResponse, generateAuthenticationOptions, verifyAuthenticationResponse } from '@simplewebauthn/server';

const random = bytes => Array.from(crypto.getRandomValues(new Uint8Array(bytes)), value => value.toString(16).padStart(2, '0')).join('');
const hash = async value => Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))), byte => byte.toString(16).padStart(2, '0')).join('');
const encode = value => btoa(String.fromCharCode(...value)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const decode = value => Uint8Array.from(atob(value.replace(/-/g, '+').replace(/_/g, '/')), char => char.charCodeAt(0));
const cookieName = request => new URL(request.url).protocol === 'https:' ? '__Host-motionstudy_owner' : 'motionstudy_owner';
export const ownerCookie = (request, value, age = 3600) => `${cookieName(request)}=${value}; Path=/; Max-Age=${age}; HttpOnly; SameSite=Strict${new URL(request.url).protocol === 'https:' ? '; Secure' : ''}`;
export const ownerToken = request => /(?:^|;\s*)(?:__Host-motionstudy_owner|motionstudy_owner)=([a-f0-9]{64})(?:;|$)/.exec(request.headers.get('cookie') || '')?.[1] || '';

export class OwnerAuth extends DurableObject {
  constructor(state, env) {
    super(state, env); this.state = state; this.config = env; this.sql = state.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS owner (id INTEGER PRIMARY KEY CHECK(id = 1), credential TEXT NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS ceremonies (id TEXT PRIMARY KEY, kind TEXT NOT NULL, challenge TEXT NOT NULL, origin TEXT NOT NULL, expires INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, origin TEXT NOT NULL, expires INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS attempts (minute INTEGER PRIMARY KEY, count INTEGER NOT NULL)');
  }
  originAllowed(origin) { return origin === this.config.APP_ORIGIN; }
  configured() { return !!this.credential(); }
  credential() { const row = this.sql.exec('SELECT credential FROM owner WHERE id = 1').toArray()[0]; return row ? JSON.parse(row.credential) : null; }
  async setupAllowed(secret) {
    const expected = this.config.OWNER_SETUP_KEY;
    if (this.credential() || typeof expected !== 'string' || expected.length < 32 || typeof secret !== 'string' || secret.length > 256) return false;
    const [actualHash, expectedHash] = await Promise.all([hash(secret), hash(expected)]);
    return crypto.subtle.timingSafeEqual(new TextEncoder().encode(actualHash), new TextEncoder().encode(expectedHash));
  }
  async options(kind, origin, secret = '') {
    if (!this.originAllowed(origin) || !['register', 'login'].includes(kind)) return {error: 'unauthorized'};
    const credential = this.credential();
    if (kind === 'register' ? !await this.setupAllowed(secret) : !credential) return {error: 'not-configured'};
    const minute = Math.floor(Date.now() / 60000);
    const allowed = this.state.storage.transactionSync(() => {
      this.sql.exec('INSERT INTO attempts (minute, count) VALUES (?, 1) ON CONFLICT(minute) DO UPDATE SET count = count + 1', minute);
      return this.sql.exec('SELECT count FROM attempts WHERE minute = ?', minute).toArray()[0].count <= 60;
    });
    if (!allowed) return {error: 'rate-limit'};
    const rpID = new URL(origin).hostname;
    const options = kind === 'register' ? await generateRegistrationOptions({rpName: 'MotionStudy analytics', rpID, userName: 'owner', userDisplayName: 'Eigenaar', attestationType: 'none', authenticatorSelection: {residentKey: 'required', userVerification: 'required'}, supportedAlgorithmIDs: [-7, -257]}) : await generateAuthenticationOptions({rpID, allowCredentials: [{id: credential.id, transports: credential.transports}], userVerification: 'required'});
    const ceremony = random(32);
    this.sql.exec('INSERT INTO ceremonies (id, kind, challenge, origin, expires) VALUES (?, ?, ?, ?, ?)', ceremony, kind, options.challenge, origin, Date.now() + 300000);
    if (!await this.state.storage.getAlarm()) await this.state.storage.setAlarm(Date.now() + 300000);
    return {ceremony, options};
  }
  async finish(kind, origin, input, secret = '') {
    if (!this.originAllowed(origin) || !/^[a-f0-9]{64}$/.test(input?.ceremony) || !input?.response || kind === 'register' && !await this.setupAllowed(secret)) return {error: 'unauthorized'};
    // Redeem once, before signature verification, including concurrent requests.
    const ceremony = this.state.storage.transactionSync(() => {
      const row = this.sql.exec('SELECT * FROM ceremonies WHERE id = ? AND kind = ? AND origin = ? AND expires > ?', input.ceremony, kind, origin, Date.now()).toArray()[0];
      if (row) this.sql.exec('DELETE FROM ceremonies WHERE id = ?', input.ceremony);
      return row;
    });
    if (!ceremony) return {error: 'unauthorized'};
    try {
      const expected = {response: input.response, expectedChallenge: ceremony.challenge, expectedOrigin: origin, expectedRPID: new URL(origin).hostname, requireUserVerification: true};
      let next, previous;
      if (kind === 'register') {
        const result = await verifyRegistrationResponse(expected);
        if (!result.verified || !result.registrationInfo?.userVerified) return {error: 'unauthorized'};
        const credential = result.registrationInfo.credential;
        next = {...credential, publicKey: encode(credential.publicKey)};
      } else {
        previous = this.credential(); if (!previous || input.response.id !== previous.id) return {error: 'unauthorized'};
        const result = await verifyAuthenticationResponse({...expected, credential: {...previous, publicKey: decode(previous.publicKey)}});
        if (!result.verified || !result.authenticationInfo.userVerified) return {error: 'unauthorized'};
        next = {...previous, counter: result.authenticationInfo.newCounter};
      }
      const token = random(32), tokenHash = await hash(token), expires = Date.now() + 3600000;
      const stored = this.state.storage.transactionSync(() => {
        const current = this.credential();
        if (kind === 'register' ? !!current : !current || current.id !== previous.id || current.counter !== previous.counter) return false;
        this.sql.exec('INSERT INTO owner (id, credential) VALUES (1, ?) ON CONFLICT(id) DO UPDATE SET credential = excluded.credential', JSON.stringify(next));
        this.sql.exec('DELETE FROM sessions WHERE expires <= ?', Date.now());
        if (this.sql.exec('SELECT COUNT(*) AS count FROM sessions').toArray()[0].count >= 20) this.sql.exec('DELETE FROM sessions WHERE hash = (SELECT hash FROM sessions ORDER BY expires ASC LIMIT 1)');
        this.sql.exec('INSERT INTO sessions (hash, origin, expires) VALUES (?, ?, ?)', tokenHash, origin, expires);
        return true;
      });
      return stored ? {token, expires} : {error: 'unauthorized'};
    } catch { return {error: 'unauthorized'}; }
  }
  async check(token, origin) {
    if (!this.originAllowed(origin) || !/^[a-f0-9]{64}$/.test(token)) return false;
    return !!this.sql.exec('SELECT hash FROM sessions WHERE hash = ? AND origin = ? AND expires > ?', await hash(token), origin, Date.now()).toArray().length;
  }
  async logout(token) { if (/^[a-f0-9]{64}$/.test(token)) this.sql.exec('DELETE FROM sessions WHERE hash = ?', await hash(token)); }
  async alarm() {
    this.sql.exec('DELETE FROM ceremonies WHERE expires <= ?', Date.now()); this.sql.exec('DELETE FROM sessions WHERE expires <= ?', Date.now()); this.sql.exec('DELETE FROM attempts WHERE minute < ?', Math.floor(Date.now() / 60000) - 1);
    if (this.sql.exec('SELECT 1 FROM ceremonies LIMIT 1').toArray().length || this.sql.exec('SELECT 1 FROM sessions LIMIT 1').toArray().length || this.sql.exec('SELECT 1 FROM attempts LIMIT 1').toArray().length) await this.state.storage.setAlarm(Date.now() + 300000);
  }
}
