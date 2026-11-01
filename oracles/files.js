#!/usr/bin/env node
// File oracle: verify a downloaded/exported file (CSV, TSV, XLSX, PDF, JSON) against expected data.
//
//   node oracles/files.js <file> [--expect expected.json] [--encoding utf8|utf8-bom|shift_jis|...]
//                                [--delimiter ,] [--sheet Name] [--number vn|intl|auto] [--header-row 1]
//                                [--name original_name.csv]   // Playwright MCP may rename the saved file (e.g. "_" -> "-"):
//                                                             // pass the name from "Downloading file <name>" for the fileName check
//
// expected.json (all optional):
//   { "encoding": "utf8-bom", "lineEnding": "CRLF", "fileName": "^invoices_\\d{8}\\.csv$",
//     "columns": ["so_hd","khach_hang","tong"],            // exact header, in order
//     "key": "so_hd",                                        // column used to match rows
//     "rows": [{"so_hd":"HD-1001","tong":1100000}, ...],    // e.g. from API/probe, same scope/filter as the export
//     "rowCount": 3, "totals": {"tong": 3300000},            // column sums
//     "pdfContains": ["Tổng cộng", "3.300.000"] }           // PDF: text that must appear
// Without --expect only generic checks run (encoding, NaN/undefined/mojibake, formula injection, ragged rows).
// Output: JSON { file, format, encoding, rows, checks: [{check, ok, detail}], anomalies: [...] }. Exit 3 if a check fails.
const fs = require('fs');
const path = require('path');
const { parseArgs, printJson } = require('../tools/lib/common');
const ff = require('../tools/lib/filefmt');
const { scanText, isFormulaInjection } = require('../tools/lib/generic-checks');

function same(a, b, numberStyle) {
  if (a === b) return true;
  const na = ff.parseNumber(a, numberStyle); const nb = ff.parseNumber(b, numberStyle);
  if (!Number.isNaN(na) && !Number.isNaN(nb)) return Math.abs(na - nb) < 1e-9;
  return String(a ?? '').trim() === String(b ?? '').trim();
}

async function load(file, opt) {
  const ext = path.extname(file).toLowerCase();
  if (ext === '.xlsx' || ext === '.xlsm') {
    const x = await ff.readXlsx(file, opt.sheet);
    return { format: 'xlsx', table: x.rows.map(r => r.map(v => (v && typeof v === 'object' && 'formula' in v ? v : v))), meta: { sheets: x.sheets, sheet: x.sheet, merged: x.merged } };
  }
  if (ext === '.pdf') {
    const p = await ff.readPdfText(file);
    return { format: 'pdf', text: p.pages.join('\n'), meta: { numPages: p.numPages } };
  }
  const buf = fs.readFileSync(file);
  const encoding = opt.encoding || ff.detectEncoding(buf);
  const text = ff.decode(buf, encoding);
  if (ext === '.json') return { format: 'json', encoding, json: JSON.parse(text), text };
  const delimiter = opt.delimiter || (ext === '.tsv' || (text.split('\t').length > text.split(',').length) ? '\t' : ',');
  const { rows, lineEnding } = ff.parseCsv(text, delimiter);
  return { format: delimiter === '\t' ? 'tsv' : 'csv', encoding, lineEnding, table: rows, text, meta: { delimiter } };
}

async function check(file, opt = {}, expected = {}) {
  const checks = []; const anomalies = [];
  const add = (c, ok, detail) => checks.push({ check: c, ok, detail });
  const L = await load(file, opt);
  const numberStyle = opt.number || expected.numberFormat || 'auto';

  if (expected.fileName) add('fileName', new RegExp(expected.fileName).test(opt.name || path.basename(file)), opt.name || path.basename(file));
  if (expected.encoding && L.encoding) add('encoding', L.encoding === expected.encoding, `actual ${L.encoding}, expected ${expected.encoding}`);
  if (expected.lineEnding && L.lineEnding) add('lineEnding', L.lineEnding === expected.lineEnding, `actual ${L.lineEnding}`);

  if (L.format === 'pdf') {
    for (const t of expected.pdfContains || []) add(`pdfContains:${t}`, L.text.includes(t), L.text.includes(t) ? 'found' : 'missing');
    anomalies.push(...scanText(L.text));
    return { file, format: L.format, meta: L.meta, checks, anomalies, textPreview: L.text.slice(0, 2000) };
  }
  if (L.format === 'json') {
    anomalies.push(...scanText(L.text, { ignore: ['null-literal'] }));
    return { file, format: L.format, encoding: L.encoding, checks, anomalies };
  }

  const headerIdx = Number(opt['header-row'] || expected.headerRow || 1) - 1;
  const table = L.table.filter((r, i) => i <= headerIdx || r.some(v => v !== '' && v != null));
  const header = (table[headerIdx] || []).map(v => String(v ?? '').trim());
  const body = table.slice(headerIdx + 1);
  const rows = body.map(r => Object.fromEntries(header.map((h, i) => [h, r[i] && typeof r[i] === 'object' && 'formula' in r[i] ? r[i].result : r[i]])));

  // generic structure checks
  const ragged = body.map((r, i) => ({ line: i + headerIdx + 2, n: r.length })).filter(x => L.format !== 'xlsx' && x.n !== header.length);
  add('consistentColumnCount', ragged.length === 0, ragged.length ? `${ragged.length} rows with != ${header.length} columns, first: line ${ragged[0].line} has ${ragged[0].n}` : `${header.length} columns`);
  const dupHeader = header.filter((h, i) => header.indexOf(h) !== i);
  if (dupHeader.length) anomalies.push({ type: 'duplicate-header', severity: 'Medium', match: dupHeader.join(',') });
  body.forEach((r, i) => r.forEach((v, c) => {
    if (v && typeof v === 'object' && 'formula' in v) anomalies.push({ type: 'xlsx-formula', severity: 'Low', match: `${header[c]} line ${i + headerIdx + 2}: =${v.formula}` });
    else if (isFormulaInjection(v)) anomalies.push({ type: 'formula-injection', severity: 'High', match: `${header[c]} line ${i + headerIdx + 2}: ${String(v).slice(0, 60)}` });
  }));
  const flat = body.map(r => r.map(v => (v && typeof v === 'object' ? JSON.stringify(v) : String(v ?? ''))).join(' | ')).join('\n');
  anomalies.push(...scanText(header.join(' | ') + '\n' + flat, { ignore: ['null-literal', 'i18n-key'] }));

  // expected-data checks
  if (expected.columns) add('columns', JSON.stringify(header) === JSON.stringify(expected.columns), `actual [${header.join(', ')}]`);
  if (expected.rowCount !== undefined) add('rowCount', rows.length === expected.rowCount, `actual ${rows.length}, expected ${expected.rowCount}`);
  if (expected.rows) {
    const key = expected.key || header[0];
    if (expected.rowCount === undefined) add('rowCount', rows.length === expected.rows.length, `actual ${rows.length}, expected ${expected.rows.length}`);
    const byKey = new Map(rows.map(r => [String(r[key]).trim(), r]));
    const missing = []; const diffs = [];
    for (const e of expected.rows) {
      const a = byKey.get(String(e[key]).trim());
      if (!a) { missing.push(e[key]); continue; }
      for (const [col, v] of Object.entries(e)) if (!same(a[col], v, numberStyle)) diffs.push(`${e[key]}.${col}: file "${a[col]}" vs expected "${v}"`);
    }
    const expKeys = new Set(expected.rows.map(e => String(e[key]).trim()));
    const extra = rows.map(r => String(r[key]).trim()).filter(k => !expKeys.has(k));
    add('missingRows', missing.length === 0, missing.length ? `missing: ${missing.slice(0, 20).join(', ')}` : 'none');
    add('extraRows', extra.length === 0, extra.length ? `extra: ${extra.slice(0, 20).join(', ')}` : 'none');
    add('values', diffs.length === 0, diffs.length ? diffs.slice(0, 30).join('; ') : 'all match');
    const keys = rows.map(r => String(r[key]).trim()); const dup = keys.filter((k, i) => keys.indexOf(k) !== i);
    add('uniqueKey', dup.length === 0, dup.length ? `duplicate ${key}: ${[...new Set(dup)].join(', ')}` : 'unique');
  }
  for (const [col, exp] of Object.entries(expected.totals || {})) {
    const sum = rows.reduce((s, r) => s + (Number.isNaN(ff.parseNumber(r[col], numberStyle)) ? 0 : ff.parseNumber(r[col], numberStyle)), 0);
    add(`total:${col}`, Math.abs(sum - exp) < 1e-6, `sum ${sum}, expected ${exp}`);
  }
  return { file, format: L.format, encoding: L.encoding, lineEnding: L.lineEnding, meta: L.meta, header, rowCount: rows.length, checks, anomalies };
}

module.exports = { check };

if (require.main === module) {
  (async () => {
    const { pos, opt } = parseArgs(process.argv.slice(2));
    if (!pos[0]) { console.error('Usage: node oracles/files.js <file> [--expect expected.json] [--encoding ..] [--sheet ..]'); process.exit(2); }
    const expected = opt.expect ? JSON.parse(fs.readFileSync(opt.expect, 'utf8')) : {};
    const r = await check(pos[0], opt, expected);
    printJson({ checkedAt: new Date().toISOString(), ...r });
    if (r.checks.some(c => !c.ok)) process.exitCode = 3;
  })().catch(e => { console.error('file oracle failed: ' + e.message); process.exit(1); });
}
