#!/usr/bin/env node
// Test cycle runner (CI / cron / after each staging deploy):
//   reset test data -> login states -> generic oracle crawl -> browsers -> charter design -> test sessions (parallel)
//   -> defect triage -> metrics -> defect export.
//
//   node tools/run-cycle.js <project> <run-id>              # dry run: print the plan, run nothing
//   node tools/run-cycle.js <project> <run-id> --execute    # run it
//   options: --from <step> / --to <step> (resume or partial run; steps: reset|login|generic|browsers|design|sessions|triage|report)
//
// Config: projects/<project>/run.config.json (template: projects/_template/run.config.json).
// Agents run headless through `claude -p --agent <name>` with an explicit tool allow-list (no bypassPermissions).
const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { ROOT, parseArgs, poll } = require('./lib/common');

// Every agent prompt starts with this so the ad-hoc testing mindset is applied on each run, not only when the model remembers the skill.
const MINDSET = 'Áp dụng phần "Tư duy cốt lõi" của skill exploratory-testing (.claude/skills/exploratory-testing/SKILL.md, đọc nếu chưa có trong context): ' +
  'Tested = Checked + Explored; tò mò và hoài nghi, nhiều persona, rủi ro trước theo RCRCRC, dựng model (kiểm kê biến, entity, bảng state × event, SFDIPOT), phá giả định, mỗi session một mục tiêu, ' +
  'thấy bug thì đào sâu, học từ bug cũ (bug-patterns.md) nhưng không lặp lại chính mình (pesticide paradox), biết khi nào dừng một hướng, thấy cả những gì không có (absence). ';
const STEPS = ['reset', 'login', 'generic', 'browsers', 'design', 'sessions', 'triage', 'report'];
const ALLOWED_TOOLS = [
  'Read', 'Write', 'Edit', 'Glob', 'Grep',
  'Bash(node tools/mcp-call.js:*)', 'Bash(node oracles/run.js:*)', 'Bash(node oracles/files.js:*)', 'Bash(node oracles/generic.js:*)',
  'Bash(node probes/run.js:*)', 'Bash(node fixtures/run.js:*)', 'Bash(node tools/gen-test-files.js:*)', 'Bash(node tools/random-pairs.js:*)', 'Bash(ls:*)', 'Bash(cat:*)',
].join(',');

function claudeCmd(agent, prompt, cfg, budgetKey) {
  const args = ['-p', '--agent', agent, '--allowedTools', ALLOWED_TOOLS, '--output-format', 'json'];
  const budget = cfg.maxBudgetUsd && cfg.maxBudgetUsd[budgetKey];
  if (budget) args.push('--max-budget-usd', String(budget));
  if (cfg.model) args.push('--model', cfg.model);
  args.push(prompt);
  return { cmd: 'claude', args };
}

function show(c) { return [c.cmd, ...c.args.map(a => (/[\s"'(),*]/.test(a) ? JSON.stringify(a) : a))].join(' '); }

async function main() {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const [project, run] = pos;
  if (!project || !run) { console.error('Usage: node tools/run-cycle.js <project> <run-id> [--execute] [--from step]'); process.exit(2); }
  const cfg = JSON.parse(fs.readFileSync(path.join(ROOT, 'projects', project, 'run.config.json'), 'utf8'));
  const exec = !!opt.execute;
  const from = opt.from ? STEPS.indexOf(opt.from) : 0;
  const to = opt.to ? STEPS.indexOf(opt.to) : STEPS.length - 1;
  if (from < 0 || to < 0) throw new Error(`Unknown step ${opt.from || opt.to}`);
  const repDir = path.join(ROOT, 'reports', run);
  const log = path.join(repDir, 'cycle.log');
  if (exec) fs.mkdirSync(repDir, { recursive: true });
  const say = m => { console.log(m); if (exec) fs.appendFileSync(log, `${new Date().toISOString()} ${m}\n`); };
  const env = { ...process.env, QA_RUN: run };
  const daemons = [];

  const sh = (label, cmd, args, extraEnv = {}) => {
    say(`$ ${show({ cmd, args })}`);
    if (!exec) return { status: 0 };
    const r = spawnSync(cmd, args, { cwd: ROOT, env: { ...env, ...extraEnv }, stdio: ['ignore', 'pipe', 'pipe'], encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 });
    fs.writeFileSync(path.join(repDir, `${label}.out.txt`), (r.stdout || '') + (r.stderr ? `\n--- stderr\n${r.stderr}` : ''));
    if (r.status !== 0) throw new Error(`${label} failed (exit ${r.status}), see reports/${run}/${label}.out.txt`);
    return r;
  };
  const shAsync = (label, c, extraEnv = {}) => {
    say(`$ ${show(c)}   &`);
    if (!exec) return Promise.resolve(0);
    return new Promise((resolve, reject) => {
      const out = fs.openSync(path.join(repDir, `${label}.out.txt`), 'w');
      const p = spawn(c.cmd, c.args, { cwd: ROOT, env: { ...env, ...extraEnv }, stdio: ['ignore', out, out] });
      p.on('exit', code => (code === 0 ? resolve(0) : reject(new Error(`${label} exit ${code}, see reports/${run}/${label}.out.txt`))));
    });
  };

  const step = async (name, fn) => {
    if (STEPS.indexOf(name) < from || STEPS.indexOf(name) > to) { say(`- skip ${name} (--from/--to)`); return; }
    say(`\n== ${name}`); await fn();
  };

  try {
    await step('reset', async () => {
      if (!cfg.reset || !cfg.reset.command) { say('! no reset command in run.config.json: oracle results may include data from previous cycles'); return; }
      sh('reset', 'bash', ['-lc', cfg.reset.command]);
      if (cfg.reset.healthcheck && exec) {
        const r = await poll(async () => (await fetch(cfg.reset.healthcheck)).ok, { timeoutMs: (cfg.reset.timeoutSec || 60) * 1000, intervalMs: 1000 });
        if (!r.ok) throw new Error(`healthcheck ${cfg.reset.healthcheck} not OK after reset`);
        say(`healthcheck ok after ${r.waitedMs} ms`);
      }
    });
    await step('login', async () => { if (cfg.loginState !== false) sh('login-state', 'node', ['tools/login-state.js', project]); });
    await step('generic', async () => {
      if (!cfg.genericCrawl) return;
      const r = sh('generic', 'node', ['oracles/generic.js', '--crawl', project]);
      if (exec) fs.writeFileSync(path.join(repDir, 'generic.json'), r.stdout);
    });
    await step('browsers', async () => {
      for (const [agent, b] of Object.entries(cfg.browsers)) {
        const state = b.role ? `.auth/${project}/${b.role}.storage-state.json` : '';
        const args = ['tools/browser-daemon.js', String(b.port), cfg.origin, ...(state ? [state] : [])];
        say(`$ node ${args.join(' ')}   & (${agent})`);
        if (exec) {
          const p = spawn('node', args, { cwd: ROOT, env, stdio: ['ignore', fs.openSync(path.join(repDir, `daemon-${b.port}.log`), 'w'), 'inherit'] });
          daemons.push(p);
        }
      }
      if (exec) await new Promise(r => setTimeout(r, 4000));
    });
    const browsersOf = agent => Object.entries(cfg.browsers).filter(([a]) => a === agent || a.startsWith(`${agent}:`))
      .map(([a, b]) => `cổng ${b.port}${b.role ? ` (role ${b.role}, đã đăng nhập)` : ''}`).join(', ');
    await step('design', async () => {
      const p = MINDSET + `Dự án ${project}, test cycle ${run}. Thiết kế charter vào projects/${project}/charters/${run}.md. ` +
        `Phân nhóm cho đúng các exploratory tester: ${cfg.testers.join(', ')} (tên nhóm = tên tester). ` +
        `Namespace dữ liệu: QA-${run}-<tester>-. ` + (cfg.genericCrawl ? `Đọc anomaly generic ở reports/${run}/generic.json. ` : '') +
        'Nếu có defect cũ chưa đóng trong reports/*/defects.md thì thêm charter confirmation (thăm dò quanh bản fix, giao cho tester khác người đã tìm ra). ' +
        `Đọc và cập nhật projects/${project}/charter-history.md để không lặp lại tổ hợp charter cũ.`;
      sh('charter-design', ...Object.values(claudeCmd('charter-designer', p, cfg, 'design')));
    });
    await step('sessions', async () => {
      await Promise.all(cfg.testers.map(agent => {
        const p = MINDSET + `Dự án ${project}, test cycle ${run}. Bạn là ${agent}. Chạy nhóm charter "${agent}" trong projects/${project}/charters/${run}.md. ` +
          `Browser: ${browsersOf(agent)}, gọi qua node tools/mcp-call.js --port <port> --agent ${agent} --run ${run}. ` +
          `Namespace dữ liệu QA-${run}-${agent}-. Ghi mindset checkpoint vào reports/${run}/notes-${agent}.md trước khi tấn công. ` +
          `Ghi session sheet (anomaly có Category, Covered, Not testable, Open questions, UX observations, Ideas not tried, Debrief PROOF) vào reports/${run}/session-${agent}.md.`;
        return shAsync(agent, claudeCmd('exploratory-tester', p, cfg, 'session'), { QA_AGENT: agent });
      }));
    });
    await step('triage', async () => {
      const v = cfg.triager || 'triager';
      const p = MINDSET + `Dự án ${project}, test cycle ${run}. Triage mọi anomaly trong reports/${run}/session-*.md. ` +
        `Browser: ${browsersOf(v)}, gọi qua node tools/mcp-call.js --port <port> --agent ${v} --run ${run}. Namespace QA-${run}-${v}-. ` +
        `Viết reports/${run}/defects.md, triage.md, regression.md và cập nhật projects/${project}/coverage.md, projects/${project}/bug-patterns.md.`;
      sh('triage', ...Object.values(claudeCmd('defect-triager', p, cfg, 'triage')), { QA_AGENT: v });
    });
    await step('report', async () => {
      sh('metrics', 'node', ['tools/metrics.js', project, run]);
      for (const f of cfg.exportFormats || ['jira-csv']) sh(`export-${f}`, 'node', ['tools/export-defects.js', run, '--format', f]);
    });
    say(exec ? `\nDone. Reports: reports/${run}/` : '\nDry run only. Add --execute to run.');
  } finally {
    for (const d of daemons) d.kill();
  }
}

main().catch(e => { console.error('run-cycle failed: ' + e.message); process.exit(1); });
