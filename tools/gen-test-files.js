#!/usr/bin/env node
// Test file library generator for upload/import features (BVA + EP + error guessing on files).
//
//   node tools/gen-test-files.js projects/<project>/file-specs/<name>.json [--out fixtures/files/<project>/<name>] [--prefix QA-R1-F-]
//
// The spec describes the import format (see projects/_template/file-specs/example.json). Output:
//   <out>/<nn>-<variant>.<csv|xlsx>   one file per variant
//   <out>/manifest.md|json             variant, test technique, hypothesis of expected behaviour, rows
// "expect" is a HYPOTHESIS derived from the spec ("accept", "reject-row", "reject-file", "ask"):
// the tester compares the app with the business rules; "ask" = no rule yet -> Needs clarification.
const fs = require('fs');
const path = require('path');
const { ROOT, parseArgs } = require('./lib/common');
const ff = require('./lib/filefmt');

function pad(n, w = 3) { return String(n).padStart(w, '0'); }
function ymd(d) { return d.toISOString().slice(0, 10); }

function exampleValue(col) {
  if (col.example !== undefined) return col.example;
  switch (col.type) {
    case 'number': return col.min !== undefined ? Math.max(col.min, 1000) : 1000;
    case 'enum': return col.values[0];
    case 'date': return '2026-10-05';
    default: return 'QA sample';
  }
}

function formatDate(iso, fmt) {
  const [y, m, d] = iso.split('-');
  return fmt.replace('YYYY', y).replace('MM', m).replace('DD', d).replace('M', String(+m)).replace('D', String(+d));
}

function buildVariants(spec, prefix) {
  const cols = spec.columns;
  const keyCol = cols.find(c => c.unique) || null;
  const header = cols.map(c => c.name);
  let seq = 0;
  const baseRow = () => {
    seq++;
    return Object.fromEntries(cols.map(c => [c.name, c === keyCol ? `${prefix}${pad(seq, 4)}` : exampleValue(c)]));
  };
  const V = [];
  const add = (id, technique, expect, desc, rows, extra = {}) => V.push({ id, technique, expect, desc, header, rows, ...extra });
  const one = (over) => [{ ...baseRow(), ...over }];

  add('valid-basic', 'EP valid', 'accept', 'File chuẩn 3 dòng hợp lệ', [baseRow(), baseRow(), baseRow()]);
  if (spec.format !== 'xlsx') {
    add('enc-utf8-bom', 'EP encoding', 'accept', 'UTF-8 có BOM (Excel Windows hay lưu kiểu này): BOM không được dính vào tên cột đầu', [baseRow()], { encoding: 'utf8-bom' });
    // Shift_JIS cannot encode Vietnamese diacritics: use Japanese text so the bytes are really non-UTF-8.
    const jp = Object.fromEntries(cols.filter(c => c.type === 'string' && c !== keyCol).map(c => [c.name, '株式会社テスト 東京支店']));
    const sjRow = { ...baseRow(), ...jp };
    if (!Object.keys(jp).length && keyCol) sjRow[keyCol.name] = `${sjRow[keyCol.name]}テスト`; // no free-text column: put JP text in the key
    add('enc-shift_jis', 'EP encoding', 'ask', 'Shift_JIS (Excel tiếng Nhật), text tiếng Nhật: hỗ trợ hay báo lỗi rõ, không được lưu chữ lỗi font', [sjRow], { encoding: 'shift_jis' });
    add('enc-utf16le', 'EP encoding', 'ask', 'UTF-16 LE ("Unicode text" của Excel)', [baseRow()], { encoding: 'utf16le' });
    add('eol-lf', 'EP format', 'accept', 'Xuống dòng LF (Mac/Linux)', [baseRow(), baseRow()], { eol: '\n' });
    add('blank-lines', 'Error guessing', 'accept', 'Dòng trống ở giữa và cuối: bỏ qua, số dòng báo lỗi phải đúng', [baseRow(), null, baseRow(), null]);
    add('trailing-delimiter', 'Error guessing', 'ask', 'Dấu phân cách thừa cuối mỗi dòng', [baseRow()], { trailingDelimiter: true });
  }
  add('header-only', 'BVA 0 rows', 'accept', 'Chỉ có header, 0 dòng: báo 0 bản ghi, không lỗi 500', []);
  add('empty-file', 'BVA empty', 'reject-file', 'File rỗng 0 byte', [], { empty: true });
  add('no-header', 'Error guessing', 'reject-file', 'Thiếu dòng header (dòng dữ liệu đầu bị coi là header?)', [baseRow(), baseRow()], { noHeader: true });
  for (const c of cols.filter(c => c.required)) {
    add(`missing-column-${c.name}`, 'EP invalid structure', 'reject-file', `Thiếu cột bắt buộc ${c.name}`, [baseRow()], { dropColumn: c.name });
  }
  add('extra-column', 'EP structure', 'ask', 'Thừa 1 cột ở cuối', [baseRow()], { extraColumn: 'ghi_chu_them' });
  add('reordered-columns', 'EP structure', 'ask', 'Đảo thứ tự cột (map theo tên hay theo vị trí?)', [baseRow()], { reorder: true });
  add('header-case-space', 'Error guessing', 'ask', 'Header viết hoa + khoảng trắng', [baseRow()], { headerTransform: h => ` ${h.toUpperCase()} ` });

  for (const c of cols) {
    const t = (id, technique, expect, desc, value) => add(`${c.name}-${id}`, technique, expect, `${c.name}: ${desc}`, one({ [c.name]: value }));
    if (c.required) { t('blank', 'EP invalid', 'reject-row', 'để trống (bắt buộc)', ''); t('spaces', 'EP invalid', 'reject-row', 'chỉ khoảng trắng', '   '); }
    if (c.type === 'string' && c !== keyCol) {
      t('unicode', 'EP valid', 'accept', 'tiếng Việt có dấu + tiếng Nhật + emoji', 'Công ty Ánh Dương 株式会社テスト ｶﾀｶﾅ 😀');
      t('quoted-comma', 'Error guessing', 'accept', 'có dấu phẩy trong ngoặc kép (RFC 4180)', 'Công ty A, chi nhánh B');
      t('quoted-newline', 'Error guessing', 'accept', 'có xuống dòng trong ngoặc kép', 'Dòng 1\nDòng 2');
      t('quote-char', 'Error guessing', 'accept', 'có ký tự " bên trong', 'Công ty "ABC"');
      t('html', 'Error guessing (security)', 'accept', 'HTML/script: lưu như text, hiển thị phải escape', '<b>x</b><script>alert(1)</script>');
      t('formula', 'Error guessing (security)', 'ask', 'bắt đầu bằng = (CSV injection): khi export lại phải vô hiệu hoá', '=HYPERLINK("http://example.invalid","x")');
      t('trim', 'Error guessing', 'ask', 'khoảng trắng đầu/cuối', '  QA trim  ');
      if (c.maxLength) {
        t('maxlen', 'BVA', 'accept', `đúng ${c.maxLength} ký tự`, 'A'.repeat(c.maxLength));
        t('maxlen+1', 'BVA', 'reject-row', `${c.maxLength + 1} ký tự`, 'A'.repeat(c.maxLength + 1));
      } else t('long', 'BVA', 'ask', '1000 ký tự', 'A'.repeat(1000));
    }
    if (c.type === 'number') {
      const ex = Number(exampleValue(c));
      if (c.min !== undefined) { t('min', 'BVA', 'accept', `= min ${c.min}`, c.min); t('min-1', 'BVA', 'reject-row', `= min-1 (${c.min - 1})`, c.min - 1); }
      if (c.max !== undefined) { t('max', 'BVA', 'accept', `= max ${c.max}`, c.max); t('max+1', 'BVA', 'reject-row', `= max+1`, c.max + 1); }
      t('zero', 'BVA', c.min !== undefined && c.min > 0 ? 'reject-row' : 'accept', '0', 0);
      t('negative', 'EP invalid', c.min !== undefined && c.min >= 0 ? 'reject-row' : 'accept', 'số âm', -ex);
      t('decimal', 'EP', c.integer ? 'reject-row' : 'accept', 'số thập phân .5', `${ex}.5`);
      t('vn-thousands', 'EP format', 'ask', 'kiểu VN 5.000.000: phải đọc đúng hoặc báo lỗi, KHÔNG lưu thành 5', ex.toLocaleString('de-DE'));
      t('intl-thousands', 'EP format', 'ask', 'kiểu quốc tế 5,000,000', ex.toLocaleString('en-US'));
      t('full-width', 'EP format', 'ask', 'chữ số full-width (IME tiếng Nhật)', ff.toHalfWidth(String(ex)).replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 0xfee0)));
      t('currency', 'Error guessing', 'ask', 'kèm đơn vị tiền', `${ex}đ`);
      t('scientific', 'Error guessing', 'ask', 'dạng 5e6', '5e6');
      t('leading-zero', 'Error guessing', 'ask', 'số 0 ở đầu', `000${ex}`);
      t('huge', 'BVA', 'ask', '999999999999999 (gần giới hạn số nguyên an toàn)', '999999999999999');
      t('text', 'EP invalid', 'reject-row', 'chữ', 'abc');
      t('number-then-text', 'Error guessing', 'reject-row', 'số rồi chữ (parseFloat chỉ lấy 12)', '12abc');
    }
    if (c.type === 'enum') {
      for (const v of c.values) t(`value-${v}`, 'EP valid', 'accept', `giá trị hợp lệ ${v}`, v);
      const bad = typeof c.values[0] === 'number' ? Math.max(...c.values) + 1 : 'INVALID';
      t('invalid', 'EP invalid', 'reject-row', `ngoài danh sách (${bad})`, bad);
      if (typeof c.values[0] === 'number') t('decimal', 'EP invalid', 'reject-row', 'thập phân', `${c.values[c.values.length - 1]}.5`);
    }
    if (c.type === 'date') {
      const iso = String(exampleValue(c)); const y = iso.slice(0, 4); const m = iso.slice(5, 7);
      const last = ymd(new Date(Date.UTC(+y, +m, 0)));
      t('first-day', 'BVA', 'accept', 'ngày đầu tháng', `${y}-${m}-01`);
      t('last-day', 'BVA', 'accept', 'ngày cuối tháng', last);
      t('feb-29-leap', 'BVA', 'accept', '29/02 năm nhuận', '2028-02-29');
      t('feb-29-nonleap', 'BVA', 'reject-row', '29/02 năm không nhuận', '2027-02-29');
      t('day-31-30month', 'BVA', 'reject-row', 'ngày 31 của tháng 30 ngày', `${y}-09-31`);
      for (const [id, fmt] of [['dmy-slash', 'DD/MM/YYYY'], ['ymd-slash', 'YYYY/MM/DD'], ['ymd-nopad', 'YYYY-M-D']]) {
        t(id, 'EP format', 'ask', `định dạng ${fmt}: phải đọc đúng hoặc báo lỗi, không được lách các rule theo ngày`, formatDate(iso, fmt));
      }
      t('jp-era', 'EP format (JP)', 'ask', 'lịch Nhật 令和', `令和${+y - 2018}年${+m}月${+iso.slice(8, 10)}日`);
      t('with-time', 'Error guessing', 'ask', 'kèm giờ (lệch timezone?)', `${iso}T23:30:00+07:00`);
      t('text', 'EP invalid', 'reject-row', 'chữ', 'not-a-date');
    }
  }
  if (keyCol) {
    if (keyCol.maxLength) {
      // keep the namespace prefix so the record is still recognisable as test data
      const fill = n => (prefix + 'K'.repeat(Math.max(0, n - prefix.length))).slice(0, n);
      add(`${keyCol.name}-maxlen`, 'BVA', 'accept', `${keyCol.name}: đúng ${keyCol.maxLength} ký tự`, one({ [keyCol.name]: fill(keyCol.maxLength) }));
      add(`${keyCol.name}-maxlen+1`, 'BVA', 'reject-row', `${keyCol.name}: ${keyCol.maxLength + 1} ký tự`, one({ [keyCol.name]: fill(keyCol.maxLength + 1) }));
    }
    const r1 = baseRow(); const r2 = { ...baseRow(), [keyCol.name]: r1[keyCol.name] };
    add('duplicate-in-file', 'EP invalid', 'reject-row', `Trùng ${keyCol.name} trong cùng file: dòng 2 bị từ chối`, [r1, r2]);
    const r3 = baseRow(); const r4 = { ...baseRow(), [keyCol.name]: String(r3[keyCol.name]).toLowerCase() };
    add('duplicate-case', 'Error guessing', 'ask', `${keyCol.name} khác hoa/thường`, [r3, r4]);
  }
  const bad = {}; for (const c of cols.filter(c => c.required)) { bad[c.name] = ''; break; }
  add('mixed-valid-invalid', 'Error guessing', 'reject-row', 'Dòng 1, 3 hợp lệ, dòng 2 lỗi: dòng hợp lệ lưu hay rollback cả file? dòng lỗi báo đúng số dòng', [baseRow(), { ...baseRow(), ...bad }, baseRow()]);
  // Volume: spec.maxRows = documented limit (BVA on it); otherwise spec.volumeRows (default 100).
  // Mind the per-agent data budget in the profile's forbidden actions before importing large files.
  const volume = spec.maxRows || spec.volumeRows || 100;
  add(spec.maxRows ? 'max-rows' : 'volume', 'BVA volume', 'accept', spec.maxRows ? `${volume} dòng = giới hạn spec` : `${volume} dòng (kiểm hiệu năng/timeout cơ bản)`, Array.from({ length: volume }, baseRow), { large: true });
  if (spec.maxRows) add('max-rows+1', 'BVA volume', 'reject-file', `${spec.maxRows + 1} dòng`, Array.from({ length: spec.maxRows + 1 }, baseRow), { large: true });
  if (spec.format === 'xlsx') {
    add('xlsx-number-as-text', 'EP format', 'ask', 'Ô số lưu dạng text', [baseRow()], { numberAsText: true });
    add('xlsx-two-sheets', 'Error guessing', 'ask', 'Dữ liệu ở sheet 1, sheet 2 có rác: chỉ đọc sheet 1?', [baseRow()], { secondSheet: true });
    add('xlsx-formula', 'Error guessing', 'ask', 'Ô số là công thức =1000*2', [baseRow()], { formulaCell: true });
  }
  return V;
}

function toTable(v, spec) {
  let header = [...v.header];
  let rows = v.rows.map(r => (r === null ? null : header.map(h => r[h])));
  if (v.dropColumn) { const i = header.indexOf(v.dropColumn); header.splice(i, 1); rows = rows.map(r => r && r.filter((_, j) => j !== i)); }
  if (v.extraColumn) { header.push(v.extraColumn); rows = rows.map(r => r && [...r, 'extra']); }
  if (v.reorder) { const idx = header.map((_, i) => i).reverse(); header = idx.map(i => header[i]); rows = rows.map(r => r && idx.map(i => r[i])); }
  if (v.headerTransform) header = header.map(v.headerTransform);
  return { header, rows };
}

async function writeVariant(file, v, spec) {
  if (v.empty) { fs.writeFileSync(file, ''); return; }
  const { header, rows } = toTable(v, spec);
  const table = v.noHeader ? rows : [header, ...rows];
  if (spec.format === 'xlsx') {
    const ExcelJS = require('exceljs');
    const wb = new ExcelJS.Workbook(); const ws = wb.addWorksheet(spec.sheetName || 'Sheet1');
    for (const r of table) {
      if (r === null) { ws.addRow([]); continue; }
      const row = ws.addRow(r.map(x => (v.numberAsText ? String(x ?? '') : x)));
      if (v.formulaCell) spec.columns.forEach((c, i) => { if (c.type === 'number' && row.number > 1) row.getCell(i + 1).value = { formula: '1000*2', result: 2000 }; });
    }
    if (v.secondSheet) wb.addWorksheet('Sheet2').addRow(['rác', 'không', 'phải', 'dữ liệu']);
    await wb.xlsx.writeFile(file);
    return;
  }
  const d = spec.delimiter || ',';
  let text = table.map(r => (r === null ? '' : r.map(x => {
    const s = x == null ? '' : String(x);
    return s.includes(d) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }).join(d) + (v.trailingDelimiter ? d : ''))).join(v.eol || '\r\n') + (v.eol || '\r\n');
  fs.writeFileSync(file, ff.encode(text, v.encoding || spec.encoding || 'utf8'));
}

async function generate(specFile, { out, prefix } = {}) {
  const spec = JSON.parse(fs.readFileSync(specFile, 'utf8'));
  const outDir = out || path.join(ROOT, 'fixtures', 'files', path.basename(path.dirname(path.dirname(path.resolve(specFile)))), spec.name);
  fs.mkdirSync(outDir, { recursive: true });
  const variants = buildVariants(spec, prefix || spec.keyPrefix || 'QA-F-');
  const ext = spec.format === 'xlsx' ? 'xlsx' : (spec.delimiter === '\t' ? 'tsv' : 'csv');
  const manifest = [];
  for (const [i, v] of variants.entries()) {
    const file = path.join(outDir, `${pad(i + 1)}-${v.id}.${ext}`);
    await writeVariant(file, v, spec);
    manifest.push({ file: path.basename(file), variant: v.id, technique: v.technique, expect: v.expect, description: v.desc, rows: v.empty ? 0 : v.rows.filter(Boolean).length, encoding: v.encoding || spec.encoding || 'utf8' });
  }
  fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify({ spec: path.relative(ROOT, path.resolve(specFile)), generatedAt: new Date().toISOString(), variants: manifest }, null, 2));
  const md = [`# Test files - ${spec.name}`, '', `Spec: \`${path.relative(ROOT, path.resolve(specFile))}\`. "Expect" là giả thuyết từ spec; kết luận defect phải dựa vào business rule trong profile. \`ask\` = chưa có rule, ghi Needs clarification nếu app xử lý bất thường.`, '',
    '| File | Technique | Expect | Mô tả | Rows |', '|---|---|---|---|---|',
    ...manifest.map(m => `| ${m.file} | ${m.technique} | ${m.expect} | ${m.description.replace(/\|/g, '/').replace(/\n/g, ' ')} | ${m.rows} |`)].join('\n');
  fs.writeFileSync(path.join(outDir, 'manifest.md'), md + '\n');
  return { outDir, count: manifest.length };
}

module.exports = { generate, buildVariants };

if (require.main === module) {
  const { pos, opt } = parseArgs(process.argv.slice(2));
  if (!pos[0]) { console.error('Usage: node tools/gen-test-files.js <file-spec.json> [--out dir] [--prefix QA-R1-F-]'); process.exit(2); }
  generate(pos[0], opt).then(r => console.log(`${r.count} files -> ${path.relative(ROOT, r.outDir)}`)).catch(e => { console.error(e.message); process.exit(1); });
}
