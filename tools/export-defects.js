#!/usr/bin/env node
// Export confirmed defects (reports/<run>/defects.md) to a file the defect tracker can import.
// Offline only: writes a file, never calls the tracker API. QA reviews and imports it.
//
//   node tools/export-defects.js <run-id> [--format jira-csv|backlog-csv|redmine-csv|json] [--project-key QA] [--out file]
//
// Jira: Issues > Import issues from CSV (map Summary, Description, Priority, Labels).
// Backlog: Issues > Import (CSV). Redmine: Issues > Import (CSV, UTF-8).
const fs = require('fs');
const path = require('path');
const { ROOT, parseArgs } = require('./lib/common');
const { writeCsv, encode } = require('./lib/filefmt');

function parse(md) {
  const parts = md.split(/^### /m).slice(1);
  return parts.map(p => {
    const id = (p.match(/^\[?(BUG-\d+)\]?/) || [])[1];
    if (!id) return null;
    const lines = p.split('\n');
    const title = lines[0].replace(/^\[?BUG-\d+\]?\s*/, '').trim();
    const field = name => ((p.match(new RegExp(`^- (?:${name}):\\s*(.+)$`, 'mi')) || [])[1] || '').trim();
    const body = lines.slice(1).join('\n').replace(/\n---\s*$/, '').trim();
    return { id, title, severity: field('Severity|Mức độ'), rule: field('Rule violated|Rule vi phạm|Rule'), body };
  }).filter(Boolean);
}

const PRIORITY = { 'nghiêm trọng': 'Highest', critical: 'Highest', cao: 'High', high: 'High', 'trung bình': 'Medium', medium: 'Medium', thấp: 'Low', low: 'Low' };

function exportDefects(run, opt = {}) {
  const file = path.join(ROOT, 'reports', run, 'defects.md');
  const bugs = parse(fs.readFileSync(file, 'utf8'));
  const fmt = opt.format || 'jira-csv';
  const label = `qa-exploratory-${run}`;
  const summary = b => `[${opt['project-key'] || 'QA'}][${b.id}] ${b.title}`;
  const prio = b => PRIORITY[b.severity.toLowerCase()] || 'Medium';
  if (fmt === 'json') return { ext: 'json', data: Buffer.from(JSON.stringify(bugs.map(b => ({ ...b, priority: prio(b), labels: ['qa-exploratory', label] })), null, 2)) };
  let rows;
  if (fmt === 'jira-csv') rows = [['Summary', 'Issue Type', 'Priority', 'Labels', 'Labels', 'Description'], ...bugs.map(b => [summary(b), 'Bug', prio(b), 'qa-exploratory', label, b.body])];
  else if (fmt === 'backlog-csv') rows = [['Subject', 'Issue Type', 'Priority', 'Description', 'Category'], ...bugs.map(b => [summary(b), 'Bug', prio(b) === 'Highest' || prio(b) === 'High' ? 'High' : prio(b) === 'Low' ? 'Low' : 'Normal', b.body, 'qa-exploratory'])];
  else if (fmt === 'redmine-csv') rows = [['Tracker', 'Subject', 'Priority', 'Description'], ...bugs.map(b => ['Bug', summary(b), prio(b) === 'Highest' ? 'Urgent' : prio(b) === 'Medium' ? 'Normal' : prio(b), b.body])];
  else throw new Error(`Unknown format ${fmt}`);
  // UTF-8 with BOM so Excel / Backlog read Vietnamese and Japanese correctly.
  return { ext: 'csv', data: encode(writeCsv(rows), 'utf8-bom') };
}

module.exports = { parse, exportDefects };

if (require.main === module) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  if (!pos[0]) { console.error('Usage: node tools/export-defects.js <run-id> [--format jira-csv|backlog-csv|redmine-csv|json]'); process.exit(2); }
  const r = exportDefects(pos[0], opt);
  const out = opt.out || path.join(ROOT, 'reports', pos[0], `defects-${opt.format || 'jira-csv'}.${r.ext}`);
  fs.writeFileSync(out, r.data);
  console.log(`wrote ${path.relative(ROOT, out)}`);
}
