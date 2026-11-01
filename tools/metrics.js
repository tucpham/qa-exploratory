#!/usr/bin/env node
// Value metrics for one test cycle - answers "is AI-assisted exploratory testing worth it on this project?"
//
//   node tools/metrics.js <project> <run-id> [--date 2026-10-31]
//
// Reads reports/<run-id>/{session-*.md, triage.md, defects.md, human-review.json?} and reports/usage.jsonl.
// Writes reports/<run-id>/metrics.json + metrics.md and prints the summary.
// Key metric: defects NOT covered by existing test cases ("Existing TC coverage: No") = value exploratory testing adds.
// human-review.json (optional, filled by QA): { "BUG-01": "accepted" | "rejected" | "duplicate-in-tracker" }
const fs = require('fs');
const path = require('path');
const { ROOT, parseArgs, printJson } = require('./lib/common');

const CONCLUSIONS = [
  ['confirmed', /CONFIRMED|XÁC NHẬN/i], ['rejected', /REJECTED|LOẠI/i], ['duplicate', /DUPLICATE/i],
  ['needsClarification', /NEEDS[ -]CLARIFICATION|QUESTION|CẦN HỎI/i], ['intermittent', /INTERMITTENT/i], ['skippedKnown', /KNOWN|SKIP/i],
];

function parseTriage(md) {
  const counts = Object.fromEntries(CONCLUSIONS.map(([k]) => [k, 0])); const rows = [];
  for (const line of md.split('\n')) {
    if (!/^\|/.test(line) || /^\|\s*-/.test(line)) continue;
    const cells = line.split('|').slice(1, -1).map(c => c.trim());
    if (!cells[0] || /^ID/i.test(cells[0])) continue;
    const verdict = cells[1] || '';
    const hit = CONCLUSIONS.find(([, re]) => re.test(verdict));
    if (hit) { counts[hit[0]]++; rows.push({ id: cells[0], verdict: hit[0], mergedInto: cells[2] || '' }); }
  }
  return { counts, rows };
}

function parseBugs(md) {
  const bugs = [];
  const parts = md.split(/^### /m).slice(1);
  for (const p of parts) {
    const id = (p.match(/^\[?(BUG-\d+)\]?/) || [])[1]; if (!id) continue;
    const field = name => ((p.match(new RegExp(`^- (?:${name}):\\s*(.+)$`, 'mi')) || [])[1] || '').trim();
    const cov = field('Existing TC coverage|TC hiện có');
    bugs.push({ id, title: p.split('\n')[0].replace(/^\[?BUG-\d+\]?\s*/, ''), severity: field('Severity|Mức độ'), rule: field('Rule|Rule vi phạm'),
      existingTcCoverage: /^(no|không|chưa)/i.test(cov) ? 'no' : /^(yes|có)/i.test(cov) ? 'yes' : 'unknown' });
  }
  return bugs;
}

function usage(run, date) {
  const f = path.join(ROOT, 'reports', 'usage.jsonl');
  if (!fs.existsSync(f)) return { method: 'none', rows: [] };
  const all = fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean);
  const tagged = all.filter(r => r.run === run);
  if (tagged.length) return { method: 'run-tag', rows: tagged };
  if (date) return { method: `date ${date}`, rows: all.filter(r => String(r.ts).startsWith(date)) };
  return { method: 'untagged (pass --date or set QA_RUN)', rows: [] };
}

function compute(project, run, opt = {}) {
  const dir = path.join(ROOT, 'reports', run);
  if (!fs.existsSync(dir)) throw new Error(`Not found: reports/${run}`);
  const read = f => (fs.existsSync(path.join(dir, f)) ? fs.readFileSync(path.join(dir, f), 'utf8') : '');
  const anomalies = fs.readdirSync(dir).filter(f => /^session-.*\.md$/.test(f))
    .map(f => ({ file: f, count: (read(f).match(/^### \[/gm) || []).length }));
  const triage = parseTriage(read('triage.md'));
  const bugs = parseBugs(read('defects.md'));
  const human = read('human-review.json') ? JSON.parse(read('human-review.json')) : null;
  const u = usage(run, opt.date);
  const perAgent = {};
  for (const r of u.rows) { const a = (perAgent[r.agent] ||= { calls: 0, outChars: 0 }); a.calls++; a.outChars += r.outChars || 0; }
  const calls = u.rows.length;
  const decided = triage.counts.confirmed + triage.counts.rejected;
  const m = {
    project, run, generatedAt: new Date().toISOString(),
    anomalies: { total: anomalies.reduce((s, a) => s + a.count, 0), byFile: anomalies },
    triage: triage.counts,
    defects: {
      total: bugs.length,
      bySeverity: bugs.reduce((o, b) => ((o[b.severity || 'unknown'] = (o[b.severity || 'unknown'] || 0) + 1), o), {}),
      notCoveredByExistingTc: bugs.filter(b => b.existingTcCoverage === 'no').length,
      coveredByExistingTc: bugs.filter(b => b.existingTcCoverage === 'yes').length,
      tcCoverageUnknown: bugs.filter(b => b.existingTcCoverage === 'unknown').length,
    },
    triagePrecision: decided ? +(triage.counts.confirmed / decided).toFixed(2) : null,
    humanReview: human ? {
      reviewed: Object.keys(human).length,
      accepted: Object.values(human).filter(v => v === 'accepted').length,
      falsePositive: Object.values(human).filter(v => v === 'rejected').length,
      alreadyInTracker: Object.values(human).filter(v => v === 'duplicate-in-tracker').length,
    } : 'missing (QA fills reports/<run>/human-review.json)',
    cost: { usageMethod: u.method, browserCalls: calls, browserOutChars: u.rows.reduce((s, r) => s + (r.outChars || 0), 0), perAgent,
      browserCallsPerDefect: bugs.length ? +(calls / bugs.length).toFixed(1) : null },
    bugs,
  };
  return m;
}

function toMd(m) {
  const h = typeof m.humanReview === 'object' ? m.humanReview : null;
  return [`# Metrics - ${m.project} - ${m.run}`, '', `Generated ${m.generatedAt}`, '',
    '| Metric | Value |', '|---|---|',
    `| Anomalies (session sheets) | ${m.anomalies.total} |`,
    `| Triage | ${Object.entries(m.triage).filter(([, v]) => v).map(([k, v]) => `${k} ${v}`).join(', ') || '-'} |`,
    `| Confirmed defects | ${m.defects.total} (${Object.entries(m.defects.bySeverity).map(([k, v]) => `${k} ${v}`).join(', ')}) |`,
    `| **Defects NOT covered by existing TCs** | **${m.defects.notCoveredByExistingTc}** (covered ${m.defects.coveredByExistingTc}, unknown ${m.defects.tcCoverageUnknown}) |`,
    `| Triage precision (confirmed / (confirmed + rejected)) | ${m.triagePrecision ?? '-'} |`,
    `| Human review | ${h ? `accepted ${h.accepted}/${h.reviewed}, false positive ${h.falsePositive}, already in tracker ${h.alreadyInTracker}` : m.humanReview} |`,
    `| Browser calls (${m.cost.usageMethod}) | ${m.cost.browserCalls} (${Object.entries(m.cost.perAgent).map(([k, v]) => `${k} ${v.calls}`).join(', ')}) |`,
    `| Browser calls per defect | ${m.cost.browserCallsPerDefect ?? '-'} |`, ''].join('\n');
}

module.exports = { compute, parseTriage, parseBugs, toMd };

if (require.main === module) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  if (pos.length < 2) { console.error('Usage: node tools/metrics.js <project> <run-id> [--date YYYY-MM-DD]'); process.exit(2); }
  const m = compute(pos[0], pos[1], opt);
  const dir = path.join(ROOT, 'reports', pos[1]);
  fs.writeFileSync(path.join(dir, 'metrics.json'), JSON.stringify(m, null, 2));
  fs.writeFileSync(path.join(dir, 'metrics.md'), toMd(m));
  console.log(toMd(m));
}
