#!/usr/bin/env node
// Log in once per role and save a Playwright storage state, so agents start already authenticated
// (no password in prompts, works with MFA via TOTP, one state file per role for multi-role flows).
//
//   node tools/login-state.js <project> [--role staff1] [--headed]
//
// Reads projects/<project>/auth.config.js:
//   module.exports = {
//     base: 'http://localhost:4100',
//     roles: { staff1: { username: 'staff1', passwordEnv: 'MINIACC_PASSWORD_STAFF1', totpEnv: 'OPTIONAL_TOTP_SECRET' } },
//     async login(page, { base, username, password, otp }) { ... },  // fill the real login form
//     async isLoggedIn(page) { return ... },                          // verify after login
//   };
// Writes .auth/<project>/<role>.storage-state.json (git-ignored). Use with:
//   tools/start-browsers.sh <origin> 8931:.auth/<project>/staff1.storage-state.json ...
const fs = require('fs');
const path = require('path');
const { ROOT, loadEnv, env, parseArgs } = require('./lib/common');
const { totp } = require('./totp');

(async () => {
  loadEnv();
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const project = pos[0];
  if (!project || !/^[a-z0-9][a-z0-9_-]*$/i.test(project)) { console.error('Usage: node tools/login-state.js <project> [--role r] [--headed]'); process.exit(2); }
  const cfg = require(path.join(ROOT, 'projects', project, 'auth.config.js'));
  const outDir = path.join(ROOT, '.auth', project); fs.mkdirSync(outDir, { recursive: true });
  const { chromium } = require('playwright');
  const browser = await chromium.launch({ headless: !opt.headed, channel: process.env.QA_BROWSER_CHANNEL || 'chrome' });
  const roles = opt.role ? [opt.role] : Object.keys(cfg.roles);
  let failed = 0;
  try {
    for (const role of roles) {
      const r = cfg.roles[role]; if (!r) throw new Error(`Unknown role ${role}`);
      const ctx = await browser.newContext(); const page = await ctx.newPage();
      const creds = { base: cfg.base, username: r.username, password: env(r.passwordEnv), otp: r.totpEnv ? () => totp(env(r.totpEnv)) : undefined };
      try {
        await cfg.login(page, creds);
        if (cfg.isLoggedIn && !(await cfg.isLoggedIn(page))) throw new Error('isLoggedIn() returned false');
        const file = path.join(outDir, `${role}.storage-state.json`);
        await ctx.storageState({ path: file });
        console.log(`ok   ${role} -> ${path.relative(ROOT, file)}`);
      } catch (e) { failed++; console.error(`FAIL ${role}: ${e.message.split('\n')[0]}`); }
      await ctx.close();
    }
  } finally { await browser.close(); }
  process.exit(failed ? 1 : 0);
})().catch(e => { console.error('login-state failed: ' + e.message); process.exit(1); });
