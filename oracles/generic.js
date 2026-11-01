#!/usr/bin/env node
// Generic test oracle - finds anomalies that need NO business rule:
// HTTP >= 400 / 5xx, console errors, uncaught page errors, NaN / undefined / [object Object], untranslated i18n keys,
// stack traces / DB errors shown to users, mojibake, broken images.
//
//   node oracles/generic.js --text snapshot.txt                         # scan a saved snapshot / page text
//   node oracles/generic.js --crawl <project> [--role staff1] [--follow] # visit URLs from projects/<project>/generic-targets.json
//
// generic-targets.json:
//   { "base": "http://localhost:4100",
//     "roles": { "staff1": ".auth/miniacc/staff1.storage-state.json" },   // created by tools/login-state.js
//     "urls": ["/", "/invoices/1", "/report?month=2026-10"],
//     "deny": "approve|delete|logout" ,                                    // never visit (GET with side effects!)
//     "ignore": ["null-literal"] }
// "Failed to load resource" console messages are dropped: same-origin HTTP errors are reported from responses instead.
// Crawl is READ-ONLY by design: GET navigation only, no clicks, no forms, same origin only, deny-list for side-effect URLs.
const fs = require('fs');
const path = require('path');
const { parseArgs, printJson, ROOT } = require('../tools/lib/common');
const { scanText } = require('../tools/lib/generic-checks');

const DEFAULT_DENY = 'logout|log-out|signout|sign-out|delete|remove|destroy|approve|reject|cancel|confirm|submit|reset|send|publish|pay|checkout|/api/';

async function crawl(project, opt) {
  const cfgFile = path.join(ROOT, 'projects', project, 'generic-targets.json');
  const cfg = JSON.parse(fs.readFileSync(cfgFile, 'utf8'));
  const base = new URL(cfg.base);
  const deny = new RegExp([DEFAULT_DENY, cfg.deny].filter(Boolean).join('|'), 'i');
  const roles = opt.role ? [opt.role] : Object.keys(cfg.roles || { anonymous: null });
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: true, channel: process.env.QA_BROWSER_CHANNEL || 'chrome' });
  const results = [];
  try {
    for (const role of roles) {
      const ss = cfg.roles && cfg.roles[role] ? path.join(ROOT, cfg.roles[role]) : undefined;
      const ctx = await browser.newContext(ss ? { storageState: ss } : {});
      const page = await ctx.newPage();
      const queue = [...cfg.urls]; const seen = new Set(); const maxPages = Number(opt.max || cfg.maxPages || 50);
      while (queue.length && seen.size < maxPages) {
        const u = new URL(queue.shift(), base);
        if (u.origin !== base.origin || seen.has(u.href)) continue;
        if (deny.test(u.pathname + u.search)) { results.push({ role, url: u.href, skipped: 'deny-list' }); seen.add(u.href); continue; }
        seen.add(u.href);
        const found = []; const onConsole = m => { if (m.type() === 'error' && !/^Failed to load resource/.test(m.text())) found.push({ type: 'console-error', severity: 'Medium', match: m.text().slice(0, 300) }); };
        const onPageError = e => found.push({ type: 'page-error', severity: 'High', match: String(e.message).slice(0, 300) });
        const onResponse = r => { if (r.status() >= 400 && new URL(r.url()).origin === base.origin) found.push({ type: r.status() >= 500 ? 'http-5xx' : 'http-4xx', severity: r.status() >= 500 ? 'High' : 'Medium', match: `${r.status()} ${r.request().method()} ${r.url()}` }); };
        page.on('console', onConsole); page.on('pageerror', onPageError); page.on('response', onResponse);
        let status = null; let finalUrl = u.href;
        try {
          const resp = await page.goto(u.href, { waitUntil: 'networkidle', timeout: 30000 });
          status = resp && resp.status(); finalUrl = page.url();
          const text = await page.evaluate(() => document.body ? document.body.innerText : '');
          found.push(...scanText(text, { ignore: cfg.ignore || ['null-literal'] }));
          const broken = await page.evaluate(() => [...document.images].filter(i => i.complete && i.naturalWidth === 0).map(i => i.src));
          broken.forEach(src => found.push({ type: 'broken-image', severity: 'Low', match: src }));
          if (opt.follow) {
            const links = await page.evaluate(() => [...document.querySelectorAll('a[href]')].map(a => a.getAttribute('href')));
            for (const l of links) { try { const n = new URL(l, page.url()); if (n.origin === base.origin && !seen.has(n.href)) queue.push(n.href); } catch { /* ignore */ } }
          }
        } catch (e) { found.push({ type: 'navigation-failed', severity: 'High', match: e.message.split('\n')[0] }); }
        page.off('console', onConsole); page.off('pageerror', onPageError); page.off('response', onResponse);
        const redirectedToLogin = /login|signin/i.test(new URL(finalUrl).pathname) && !/login|signin/i.test(u.pathname);
        results.push({ role, url: u.href, status, finalUrl, redirectedToLogin, anomalies: found });
      }
      await ctx.close();
    }
  } finally { await browser.close(); }
  return results;
}

if (require.main === module) {
  (async () => {
    const { opt } = parseArgs(process.argv.slice(2));
    if (opt.text) {
      const text = fs.readFileSync(opt.text, 'utf8');
      printJson({ source: opt.text, anomalies: scanText(text, { ignore: ['null-literal'] }) });
      return;
    }
    if (opt.crawl) {
      const results = await crawl(opt.crawl, opt);
      const pages = results.filter(r => !r.skipped);
      printJson({ project: opt.crawl, checkedAt: new Date().toISOString(), pages: pages.length,
        pagesWithAnomalies: pages.filter(r => r.anomalies.length).length, skipped: results.filter(r => r.skipped).map(r => r.url), results: pages });
      return;
    }
    console.error('Usage: node oracles/generic.js --text <file> | --crawl <project> [--role r] [--follow] [--max 50]'); process.exit(2);
  })().catch(e => { console.error('generic oracle failed: ' + e.message); process.exit(1); });
}

module.exports = { crawl, DEFAULT_DENY };
