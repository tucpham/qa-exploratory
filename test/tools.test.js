// Unit tests for the test harness (no browser, no server). Run: npm test
const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

const ff = require('../tools/lib/filefmt');
const { scanText, isFormulaInjection } = require('../tools/lib/generic-checks');
const { totp } = require('../tools/totp');
const { getPath, poll } = require('../tools/lib/common');
const { parseTriage, parseBugs } = require('../tools/metrics');
const { parse: parseDefects } = require('../tools/export-defects');
const { buildVariants, generate } = require('../tools/gen-test-files');
const { check } = require('../oracles/files');

const tmp = () => fs.mkdtempSync(path.join(os.tmpdir(), 'qa-exploratory-test-'));

test('TOTP matches RFC 6238 SHA1 vectors', () => {
  const secret = Buffer.from('12345678901234567890').toString();
  assert.strictEqual(totp(secret, { time: 59000, digits: 8, raw: true }), '94287082');
  assert.strictEqual(totp(secret, { time: 1111111109000, digits: 8, raw: true }), '07081804');
  assert.strictEqual(totp(secret, { time: 20000000000000, digits: 8, raw: true }), '65353130');
  assert.strictEqual(totp('GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ', { time: 59000, digits: 8 }), '94287082'); // same key, base32
});

test('CSV parser handles RFC 4180 quoting, CRLF and embedded newlines', () => {
  const { rows, lineEnding } = ff.parseCsv('a,b,c\r\n"x, y","he said ""hi""","l1\nl2"\r\n1,,3\r\n');
  assert.strictEqual(lineEnding, 'CRLF');
  assert.deepStrictEqual(rows, [['a', 'b', 'c'], ['x, y', 'he said "hi"', 'l1\nl2'], ['1', '', '3']]);
  assert.deepStrictEqual(ff.parseCsv(ff.writeCsv(rows)).rows, rows);
});

test('encoding detection: BOM, UTF-8, UTF-16, Shift_JIS', () => {
  assert.strictEqual(ff.detectEncoding(ff.encode('Hoá đơn', 'utf8-bom')), 'utf8-bom');
  assert.strictEqual(ff.detectEncoding(ff.encode('Hoá đơn', 'utf8')), 'utf8');
  assert.strictEqual(ff.detectEncoding(ff.encode('テスト', 'utf16le')), 'utf16le');
  const sj = ff.encode('株式会社テスト', 'shift_jis');
  assert.strictEqual(ff.detectEncoding(sj), 'shift_jis');
  assert.strictEqual(ff.decode(sj), '株式会社テスト');
});

test('number parsing: VN, international, full-width, currency', () => {
  assert.strictEqual(ff.parseNumber('1.000.000'), 1000000);
  assert.strictEqual(ff.parseNumber('1,000,000'), 1000000);
  assert.strictEqual(ff.parseNumber('1.234.565,5'), 1234565.5);
  assert.strictEqual(ff.parseNumber('１２３'), 123);
  assert.strictEqual(ff.parseNumber('5000000đ'), 5000000);
  assert.strictEqual(ff.parseNumber('1.5'), 1.5);
  assert.ok(Number.isNaN(ff.parseNumber('12abc')));
});

test('generic checks flag NaN/undefined/i18n keys/stack traces, not normal text', () => {
  const types = scanText('Tổng: NaN đ | undefined | label.invoice.total | TypeError: x is not a function | [object Object]').map(a => a.type);
  for (const t of ['nan', 'undefined', 'i18n-key', 'stack-trace', 'object-object']) assert.ok(types.includes(t), t);
  assert.deepStrictEqual(scanText('Hoá đơn HD-1001 Tổng thanh toán 1.100.000 đ, Nhân viên Nguyễn Văn A'), []);
  assert.ok(isFormulaInjection('=HYPERLINK("x")'));
  assert.ok(isFormulaInjection('+SUM(A1)'));
  assert.ok(!isFormulaInjection('-50000'));
  assert.ok(!isFormulaInjection('Công ty A'));
});

test('getPath and poll', async () => {
  assert.strictEqual(getPath({ a: [{ b: 2 }] }, 'a.0.b'), 2);
  let n = 0;
  const r = await poll(async () => (++n >= 3 ? 'done' : null), { timeoutMs: 2000, intervalMs: 10 });
  assert.ok(r.ok); assert.strictEqual(r.value, 'done'); assert.strictEqual(r.attempts, 3);
  const t = await poll(async () => null, { timeoutMs: 50, intervalMs: 20 });
  assert.ok(!t.ok);
});

test('file oracle compares export with expected rows, totals and encoding', async () => {
  const d = tmp(); const f = path.join(d, 'export.csv');
  fs.writeFileSync(f, ff.encode('so_hd,tong\r\nHD-1,"1.100.000"\r\nHD-2,NaN\r\n', 'utf8-bom'));
  const r = await check(f, {}, { encoding: 'utf8-bom', key: 'so_hd', rows: [{ so_hd: 'HD-1', tong: 1100000 }, { so_hd: 'HD-2', tong: 5 }, { so_hd: 'HD-3', tong: 1 }], totals: { tong: 1100006 } });
  const byName = Object.fromEntries(r.checks.map(c => [c.check, c.ok]));
  assert.strictEqual(byName.encoding, true);
  assert.strictEqual(byName.missingRows, false);
  assert.strictEqual(byName.values, false);
  assert.strictEqual(byName['total:tong'], false);
  assert.ok(r.anomalies.some(a => a.type === 'nan'));
});

test('test file generator covers BVA/EP variants and writes a manifest', async () => {
  const spec = { name: 't', format: 'csv', columns: [
    { name: 'code', type: 'string', required: true, unique: true, maxLength: 10 },
    { name: 'amount', type: 'number', required: true, min: 1, example: 1000 },
    { name: 'rate', type: 'enum', values: [0, 10] },
    { name: 'day', type: 'date', example: '2026-10-05' }] };
  const ids = buildVariants(spec, 'QA-T-').map(v => v.id);
  for (const id of ['valid-basic', 'enc-utf8-bom', 'enc-shift_jis', 'missing-column-code', 'code-maxlen+1', 'amount-min-1', 'amount-vn-thousands', 'rate-invalid', 'day-feb-29-nonleap', 'duplicate-in-file', 'mixed-valid-invalid']) assert.ok(ids.includes(id), id);
  const d = tmp(); const sf = path.join(d, 'spec.json'); fs.writeFileSync(sf, JSON.stringify({ ...spec, volumeRows: 5 }));
  const out = path.join(d, 'out');
  const r = await generate(sf, { out, prefix: 'QA-T-' });
  const m = JSON.parse(fs.readFileSync(path.join(out, 'manifest.json'), 'utf8'));
  assert.strictEqual(m.variants.length, r.count);
  const sj = m.variants.find(v => v.variant === 'enc-shift_jis');
  assert.strictEqual(ff.detectEncoding(fs.readFileSync(path.join(out, sj.file))), 'shift_jis');
});

test('metrics parsers read triage and bug reports', () => {
  const t = parseTriage('| ID | Kết luận | Gộp |\n|---|---|---|\n| E1-01 | CONFIRMED | BUG-01 |\n| E1-02 | REJECTED | - |\n| E2-09 | QUESTION | - |\n| E2-10 | NEEDS CLARIFICATION | - |\n| E2-11 | DUPLICATE | BUG-01 |');
  assert.deepStrictEqual([t.counts.confirmed, t.counts.rejected, t.counts.needsClarification, t.counts.duplicate], [1, 1, 2, 1]);
  const b = parseBugs('### [BUG-01] VAT sai (Hoá đơn)\n- Mức độ: Nghiêm trọng\n- Existing TC coverage: No - không TC nào nhập phần lẻ < 0,5\n\n### [BUG-02] X\n- Severity: High\n- Existing TC coverage: Yes (TC-12)\n');
  assert.deepStrictEqual(b.map(x => [x.id, x.severity, x.existingTcCoverage]), [['BUG-01', 'Nghiêm trọng', 'no'], ['BUG-02', 'High', 'yes']]);
  const e = parseDefects('### [BUG-01] VAT sai\n- Mức độ: Cao\n- Rule vi phạm: R1\n- Bước: 1. a\n---\n');
  assert.strictEqual(e[0].severity, 'Cao'); assert.strictEqual(e[0].rule, 'R1');
});

test('ad-hoc testing mindset is in the skill and preloaded by every testing agent', () => {
  const root = path.join(__dirname, '..');
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const skill = read('.claude/skills/exploratory-testing/SKILL.md');
  for (const s of ['## Tư duy cốt lõi', 'Mindset checkpoint', 'PROOF', 'SFDIPOT', '**CRUD**', '**Goldilocks**', '**Interrupt**', 'landmark tour', 'money tour', 'back-alley', 'Người cố tình phá', 'Mạng yếu / máy cũ', 'bug-patterns.md'])
    assert.ok(skill.includes(s), `skill missing: ${s}`);
  for (const a of ['exploratory-tester', 'charter-designer', 'defect-triager']) {
    const md = read(`.claude/agents/${a}.md`);
    const fm = md.split('---')[1];
    assert.match(fm, /^skills:.*\bexploratory-testing\b/m, `${a} must preload the skill`);
    assert.ok(md.includes('Tư duy cốt lõi'), `${a} must reference the core mindset`);
  }
  assert.ok(read('tools/run-cycle.js').includes('Tư duy cốt lõi'), 'runner prompts must carry the mindset');
  assert.ok(fs.existsSync(path.join(root, 'projects/_template/bug-patterns.md')));
});

test('28 mindset points from Explore It!, Itkonen 2005 and ET 2026 are wired into skill, agents and docs', () => {
  const root = path.join(__dirname, '..');
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const skill = read('.claude/skills/exploratory-testing/SKILL.md');
  for (const s of ['Tested = Checked + Explored', 'Kiểm kê biến', '**COUNT**', '**Some / None / All**', '**Beginning / Middle / End**', 'RCRCRC',
    'Never / Always', 'state × event', 'pesticide paradox', 'Biết khi nào dừng', 'Tính ngược kết quả', 'Đổi tiêu điểm', 'Hỏi câu sâu hơn',
    'Tín hiệu thay cho cảm xúc', 'absence', 'UX observations', 'Nouns × Verbs', 'Back / Forward', 'trust boundary', 'Không tái hiện được',
    'Category:', 'Violate data format rules', 'AI bổ sung cho QA người'])
    assert.ok(skill.includes(s), `skill missing: ${s}`);
  const cd = read('.claude/agents/charter-designer.md');
  for (const s of ['Nightmare Headline', 'charter-history.md', '`recon`', '`smoke`', 'tester khác', 'Explore <target> with <resources> to discover <information>', 'What If?', 'random-pairs'])
    assert.ok(cd.includes(s), `charter-designer missing: ${s}`);
  const tr = read('.claude/agents/defect-triager.md');
  for (const s of ['kiểm soát được mọi biến', 'Category', 'UX OBSERVATION', 'người tìm ra']) assert.ok(tr.includes(s), `triager missing: ${s}`);
  const an = read('.claude/agents/test-basis-analyst.md');
  for (const s of ['Inputs / Processing / Outputs / Questions', 'Never / Always', 'state × event', 'trust boundary', 'RCRCRC']) assert.ok(an.includes(s), `analyst missing: ${s}`);
  const gaps = read('docs/GAPS-AND-ROADMAP.md');
  for (const s of ['Tested = Checked + Explored', 'debrief 3 nhóm', 'Coverage là điểm yếu số 1', 'Kiến thức domain']) assert.ok(gaps.includes(s), `roadmap missing: ${s}`);
  assert.ok(read('projects/_template/project-profile.md').includes('Never / Always'));
  assert.ok(read('projects/_template/external-dependencies.md').includes('Trust boundary'));
  assert.ok(read('tools/run-cycle.js').includes('random-pairs.js'));
});

test('random pairs are reproducible per seed and differ across seeds', () => {
  const { pairs, nounsFromMap } = require('../tools/random-pairs');
  const v = { nouns: ['a', 'b', 'c', 'd'], verbs: ['x', 'y', 'z'] };
  assert.deepStrictEqual(pairs(v, 5, 'run-1'), pairs(v, 5, 'run-1'));
  assert.notDeepStrictEqual(pairs(v, 5, 'run-1'), pairs(v, 5, 'run-2'));
  assert.strictEqual(pairs(v, 50, 's').length, 12);
  assert.deepStrictEqual(nounsFromMap('| Screen | URL |\n|---|---|\n| Hoá đơn | /invoices |\n| Báo cáo | /report |'), ['Hoá đơn', 'Báo cáo']);
});

test('metrics reads category and scores mindset compliance', () => {
  const { parseBugs, mindset } = require('../tools/metrics');
  const b = parseBugs('### [BUG-01] X\n- Severity: High\n- Category: Calculation\n- Rule violated: R1\n- Off-charter: yes\n- Existing TC coverage: No\n');
  assert.strictEqual(b[0].category, 'Calculation'); assert.strictEqual(b[0].rule, 'R1'); assert.strictEqual(b[0].offCharter, true);
  const d = tmp();
  fs.writeFileSync(path.join(d, 'notes-t1.md'), 'Kiểm kê biến; bảng state × event; giả định; persona; SFDIPOT; RCRCRC; Never; bug pattern P-01; khác so với lần trước; lý do dừng');
  fs.writeFileSync(path.join(d, 'session-t1.md'), '## Debrief PROOF\n## UX observations');
  assert.strictEqual(mindset(d).t1.score, '12/12');
});
