// Shared helpers for oracles, fixtures, probes and tools. No external dependencies.
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');

// Minimal .env loader: KEY=VALUE per line, # comments, optional quotes. Does not override existing env.
function loadEnv(file = path.join(ROOT, '.env')) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = m[2];
    if (/^(['"]).*\1$/.test(v)) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}

function env(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === '') {
    if (fallback !== undefined) return fallback;
    throw new Error(`Missing env ${name} (set it in .env, see .env.example)`);
  }
  return v;
}

// HTTP session with a cookie jar (single origin). Uses global fetch (Node >= 18).
class Session {
  constructor(base) { this.base = base.replace(/\/$/, ''); this.cookies = {}; }
  url(p) { return /^https?:/.test(p) ? p : this.base + p; }
  cookieHeader() { return Object.entries(this.cookies).map(([k, v]) => `${k}=${v}`).join('; '); }
  store(res) {
    const list = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [res.headers.get('set-cookie')].filter(Boolean);
    for (const c of list) {
      const [kv] = c.split(';'); const i = kv.indexOf('=');
      const k = kv.slice(0, i).trim(); const v = kv.slice(i + 1).trim();
      if (v === '' || /max-age=0/i.test(c)) delete this.cookies[k]; else this.cookies[k] = v;
    }
  }
  async request(method, p, { form, json, headers = {}, redirect = 'manual' } = {}) {
    const h = { ...headers };
    const ck = this.cookieHeader(); if (ck) h.cookie = ck;
    let body;
    if (form) { h['content-type'] = 'application/x-www-form-urlencoded'; body = new URLSearchParams(form).toString(); }
    if (json) { h['content-type'] = 'application/json'; body = JSON.stringify(json); }
    const res = await fetch(this.url(p), { method, headers: h, body, redirect });
    this.store(res);
    return res;
  }
  get(p, o) { return this.request('GET', p, o); }
  post(p, o) { return this.request('POST', p, o); }
  async getJson(p) {
    const r = await this.get(p, { headers: { accept: 'application/json' } });
    if (!r.ok) throw new Error(`GET ${p} -> HTTP ${r.status}`);
    return r.json();
  }
  async getText(p) { const r = await this.get(p); return { status: r.status, text: await r.text(), location: r.headers.get('location') }; }
}

// Poll fn() until it returns a truthy value or timeout. Returns { ok, value, waitedMs, attempts }.
async function poll(fn, { timeoutMs = 30000, intervalMs = 1000 } = {}) {
  const start = Date.now(); let attempts = 0; let last;
  while (true) {
    attempts++;
    try { last = await fn(); } catch (e) { last = undefined; }
    if (last) return { ok: true, value: last, waitedMs: Date.now() - start, attempts };
    if (Date.now() - start + intervalMs > timeoutMs) return { ok: false, value: last, waitedMs: Date.now() - start, attempts };
    await new Promise(r => setTimeout(r, intervalMs));
  }
}

function parseArgs(argv) {
  const pos = []; const opt = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const k = a.slice(2);
      if (argv[i + 1] !== undefined && !argv[i + 1].startsWith('--')) opt[k] = argv[++i]; else opt[k] = true;
    } else pos.push(a);
  }
  return { pos, opt };
}

function loadProjectModule(dir, project) {
  if (!/^[a-z0-9][a-z0-9_-]*$/i.test(project || '')) throw new Error(`Invalid project name: ${project}`);
  const file = path.join(ROOT, dir, `${project}.js`);
  if (!fs.existsSync(file)) throw new Error(`Not found: ${path.relative(ROOT, file)}`);
  return require(file);
}

// Read a value at a dot path: "items.0.status".
function getPath(obj, p) {
  if (!p) return obj;
  return p.split('.').reduce((o, k) => (o == null ? undefined : (Array.isArray(o) && /^\d+$/.test(k) ? o[Number(k)] : o[k])), obj);
}

function printJson(x) { console.log(JSON.stringify(x, null, 2)); }

module.exports = { ROOT, loadEnv, env, Session, poll, parseArgs, loadProjectModule, printJson, getPath };
