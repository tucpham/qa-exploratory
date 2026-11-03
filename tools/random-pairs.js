#!/usr/bin/env node
// Nouns x Verbs random pairs (Hendrickson, "Explore It!" ch.6) to break habitual paths (pesticide paradox).
// LLM agents cannot produce real randomness, so the pairs come from a seeded PRNG: same seed -> same pairs (reproducible),
// different seed per run/agent -> different paths.
//
//   node tools/random-pairs.js <project> [--n 5] [--seed <text>]
//
// Source of nouns/verbs, in order:
//   1. projects/<project>/nouns-verbs.json  {"nouns": [...], "verbs": [...]}
//   2. first column of markdown tables in projects/<project>/test-object-map.md (nouns) + generic verbs
const fs = require('fs');
const path = require('path');
const { ROOT, parseArgs, printJson } = require('./lib/common');

const GENERIC_VERBS = ['create', 'view', 'edit', 'delete', 'duplicate', 'approve', 'cancel', 'filter', 'sort', 'export',
  'import', 'reload mid-way', 'go back', 'open in 2 tabs', 'repeat twice', 'switch role', 'leave idle', 'bookmark and reopen'];

function hash(str) { let h = 1779033703 ^ str.length; for (let i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = (h << 13) | (h >>> 19); } return h >>> 0; }
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

function nounsFromMap(md) {
  const nouns = new Set();
  for (const line of md.split(/\r?\n/)) {
    const m = line.match(/^\|\s*([^|]+?)\s*\|/);
    if (!m || /^-+$/.test(m[1].replace(/[:\s]/g, '')) ) continue;
    const cell = m[1].replace(/[`*]/g, '').trim();
    if (cell && !/^(screen|màn hình|field|name|tên|id)$/i.test(cell)) nouns.add(cell);
  }
  return [...nouns];
}

function loadVocabulary(project) {
  const dir = path.join(ROOT, 'projects', project);
  const nv = path.join(dir, 'nouns-verbs.json');
  if (fs.existsSync(nv)) { const j = JSON.parse(fs.readFileSync(nv, 'utf8')); return { nouns: j.nouns || [], verbs: j.verbs || GENERIC_VERBS, source: 'nouns-verbs.json' }; }
  const map = path.join(dir, 'test-object-map.md');
  if (fs.existsSync(map)) return { nouns: nounsFromMap(fs.readFileSync(map, 'utf8')), verbs: GENERIC_VERBS, source: 'test-object-map.md' };
  throw new Error(`No nouns-verbs.json or test-object-map.md in projects/${project}`);
}

function pairs({ nouns, verbs }, n, seed) {
  if (!nouns.length || !verbs.length) throw new Error('Empty noun or verb list');
  const rnd = mulberry32(hash(String(seed)));
  const out = []; const seen = new Set();
  const max = Math.min(n, nouns.length * verbs.length);
  while (out.length < max) {
    const p = { verb: verbs[Math.floor(rnd() * verbs.length)], noun: nouns[Math.floor(rnd() * nouns.length)] };
    const k = `${p.verb}|${p.noun}`; if (!seen.has(k)) { seen.add(k); out.push(p); }
  }
  return out;
}

if (require.main === module) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  const [project] = pos;
  if (!project || !/^[a-z0-9][a-z0-9_-]*$/i.test(project)) { console.error('Usage: node tools/random-pairs.js <project> [--n 5] [--seed text]'); process.exit(2); }
  const vocab = loadVocabulary(project);
  const seed = opt.seed || new Date().toISOString();
  printJson({ project, seed, source: vocab.source, pairs: pairs(vocab, Number(opt.n || 5), seed) });
}

module.exports = { pairs, nounsFromMap, GENERIC_VERBS };
