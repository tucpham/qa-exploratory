#!/usr/bin/env node
// Observation probes: READ-ONLY checks of things the UI cannot show (external dependencies,
// async jobs, other systems). Used by exploratory tester / defect triager as evidence, like an automated test oracle.
//
//   node probes/run.js <project> list
//   node probes/run.js <project> <probe> '<json-args>'
//
// Built-in probes (every project):
//   mail  {to?, subject?, text?, since?, timeoutMs?}   -> searches the test mailbox (Mailpit API, env MAILPIT_URL)
//   http  {url, path?, equals?, contains?, timeoutMs?} -> GET JSON/text from an allowed origin and (optionally) waits
//                                                        until the value at dot-path `path` equals/contains the expectation.
//                                                        Allowed origins: env QA_PROBE_ALLOWED (comma-separated).
// Project probes: probes/<project>.js exports { probes: { name: { description, args, run(args) } } }.
// Every probe returns { ok, ... }. ok=false with waitedMs means "not observed within timeout" - NOT automatically a defect:
// the defect triager compares waitedMs with the max processing time declared in the project profile.
const fs = require('fs');
const path = require('path');
const { loadEnv, env, parseArgs, poll, printJson, getPath, ROOT } = require('../tools/lib/common');

function checkAllowed(url) {
  const allowed = (process.env.QA_PROBE_ALLOWED || '').split(',').map(s => s.trim()).filter(Boolean);
  const origin = new URL(url).origin;
  if (!allowed.includes(origin)) throw new Error(`Origin ${origin} not in QA_PROBE_ALLOWED`);
}

const builtins = {
  mail: {
    description: 'Tìm email trong test mailbox (Mailpit). Không xoá, không gửi.',
    args: '{to?, subject?, text?, since? (ISO), timeoutMs=30000}',
    async run(a) {
      const base = env('MAILPIT_URL').replace(/\/$/, '');
      const q = [a.to && `to:"${a.to}"`, a.subject && `subject:"${a.subject}"`, a.text && `"${a.text}"`].filter(Boolean).join(' ');
      const since = a.since ? new Date(a.since) : null;
      const r = await poll(async () => {
        const res = await fetch(`${base}/api/v1/search?query=${encodeURIComponent(q)}&limit=50`);
        if (!res.ok) throw new Error(`Mailpit HTTP ${res.status}`);
        const j = await res.json();
        const msgs = (j.messages || []).filter(m => !since || new Date(m.Created) >= since);
        return msgs.length ? msgs : null;
      }, { timeoutMs: a.timeoutMs ?? 30000, intervalMs: 2000 });
      const messages = (r.value || []).map(m => ({ id: m.ID, created: m.Created, from: m.From && m.From.Address, to: (m.To || []).map(t => t.Address), subject: m.Subject, snippet: m.Snippet }));
      return { ok: r.ok, query: q, waitedMs: r.waitedMs, count: messages.length, messages };
    },
  },
  http: {
    description: 'GET JSON/text từ origin được phép, tuỳ chọn chờ tới khi giá trị khớp.',
    args: '{url, path?, equals?, contains?, timeoutMs=0, headers?}',
    async run(a) {
      checkAllowed(a.url);
      let last;
      const match = v => (a.equals !== undefined ? JSON.stringify(v) === JSON.stringify(a.equals)
        : a.contains !== undefined ? String(typeof v === 'string' ? v : JSON.stringify(v)).includes(a.contains) : true);
      const r = await poll(async () => {
        const res = await fetch(a.url, { headers: a.headers || {} });
        const text = await res.text();
        let body; try { body = JSON.parse(text); } catch { body = text; }
        last = { status: res.status, value: getPath(body, a.path) };
        return res.ok && match(last.value) ? last : null;
      }, { timeoutMs: a.timeoutMs || 0, intervalMs: 1000 });
      return { ok: r.ok, waitedMs: r.waitedMs, attempts: r.attempts, ...last };
    },
  },
};

(async () => {
  loadEnv();
  const { pos } = parseArgs(process.argv.slice(2));
  const [project, name = 'list', raw] = pos;
  if (!project) { console.error('Usage: node probes/run.js <project> <probe|list> [json-args]'); process.exit(2); }
  const file = path.join(ROOT, 'probes', `${project}.js`);
  const own = /^[a-z0-9][a-z0-9_-]*$/i.test(project) && fs.existsSync(file) ? require(file).probes : {};
  const all = { ...builtins, ...own };
  if (name === 'list') { printJson(Object.entries(all).map(([k, p]) => ({ probe: k, description: p.description, args: p.args }))); return; }
  const p = all[name];
  if (!p) throw new Error(`Unknown probe "${name}". Available: ${Object.keys(all).join(', ')}`);
  const args = raw ? JSON.parse(raw) : {};
  const result = await p.run(args);
  printJson({ project, probe: name, args, checkedAt: new Date().toISOString(), ...result });
  if (result.ok === false) process.exitCode = 3;
})().catch(e => { console.error('probe failed: ' + e.message); process.exit(1); });

