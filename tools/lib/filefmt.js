// File format helpers: encoding detection, RFC 4180 CSV parse/write, xlsx/pdf reading, number normalisation.
const fs = require('fs');
const path = require('path');
const iconv = require('iconv-lite');

function detectEncoding(buf) {
  if (buf.length >= 3 && buf[0] === 0xef && buf[1] === 0xbb && buf[2] === 0xbf) return 'utf8-bom';
  if (buf.length >= 2 && buf[0] === 0xff && buf[1] === 0xfe) return 'utf16le';
  if (buf.length >= 2 && buf[0] === 0xfe && buf[1] === 0xff) return 'utf16be';
  try { new TextDecoder('utf-8', { fatal: true }).decode(buf); return 'utf8'; } catch { /* not utf8 */ }
  return 'shift_jis'; // most common non-UTF-8 encoding for JP/VN offshore projects; override with --encoding
}

function decode(buf, enc = detectEncoding(buf)) {
  switch (enc) {
    case 'utf8-bom': return buf.subarray(3).toString('utf8');
    case 'utf8': return buf.toString('utf8');
    case 'utf16le': return iconv.decode(buf.subarray(2), 'utf16le');
    case 'utf16be': return iconv.decode(buf.subarray(2), 'utf16be');
    default: return iconv.decode(buf, enc);
  }
}

function encode(text, enc) {
  switch (enc) {
    case 'utf8': return Buffer.from(text, 'utf8');
    case 'utf8-bom': return Buffer.concat([Buffer.from([0xef, 0xbb, 0xbf]), Buffer.from(text, 'utf8')]);
    case 'utf16le': return Buffer.concat([Buffer.from([0xff, 0xfe]), iconv.encode(text, 'utf16le')]);
    default: return iconv.encode(text, enc);
  }
}

// RFC 4180: quoted fields, "" escapes, delimiters/newlines inside quotes. Returns { rows, lineEnding }.
function parseCsv(text, delimiter = ',') {
  const rows = []; let row = []; let f = ''; let q = false; let i = 0;
  const lineEnding = /\r\n/.test(text) ? 'CRLF' : /\n/.test(text) ? 'LF' : 'none';
  while (i < text.length) {
    const c = text[i];
    if (q) {
      if (c === '"') { if (text[i + 1] === '"') { f += '"'; i += 2; continue; } q = false; i++; continue; }
      f += c; i++; continue;
    }
    if (c === '"' && f === '') { q = true; i++; continue; }
    if (c === delimiter) { row.push(f); f = ''; i++; continue; }
    if (c === '\r' && text[i + 1] === '\n') { i++; continue; }
    if (c === '\n' || c === '\r') { row.push(f); rows.push(row); row = []; f = ''; i++; continue; }
    f += c; i++;
  }
  if (f !== '' || row.length) { row.push(f); rows.push(row); }
  return { rows, lineEnding };
}

function csvField(v, delimiter = ',') {
  const s = v == null ? '' : String(v);
  return s.includes(delimiter) || /["\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
function writeCsv(rows, { delimiter = ',', eol = '\r\n' } = {}) {
  return rows.map(r => r.map(v => csvField(v, delimiter)).join(delimiter)).join(eol) + eol;
}

// Number normalisation: "1.000.000" (vn), "1,000,000" (intl), full-width "１２３", "¥1,000", "1 000".
function toHalfWidth(s) { return String(s).replace(/[！-～]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xfee0)).replace(/　/g, ' '); }
function parseNumber(v, style = 'auto') {
  if (typeof v === 'number') return v;
  if (v == null) return NaN;
  let s = toHalfWidth(v).trim().replace(/[\s¥$₫€đ円]|VND|JPY/gi, '');
  if (s === '') return NaN;
  if (style === 'vn' || (style === 'auto' && /^-?\d{1,3}(\.\d{3})+(,\d+)?$/.test(s))) s = s.replace(/\./g, '').replace(',', '.');
  else if (style === 'intl' || (style === 'auto' && /^-?\d{1,3}(,\d{3})+(\.\d+)?$/.test(s))) s = s.replace(/,/g, '');
  return /^-?\d+(\.\d+)?$/.test(s) ? Number(s) : NaN;
}

async function readXlsx(file, sheetName) {
  const ExcelJS = require('exceljs');
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(file);
  const ws = sheetName ? wb.getWorksheet(sheetName) : wb.worksheets[0];
  if (!ws) throw new Error(`Sheet not found: ${sheetName}`);
  const rows = [];
  ws.eachRow({ includeEmpty: true }, r => {
    const vals = [];
    for (let c = 1; c <= ws.columnCount; c++) {
      let v = r.getCell(c).value;
      if (v && typeof v === 'object') {
        if (v.formula !== undefined || v.sharedFormula !== undefined) v = { formula: v.formula || v.sharedFormula, result: v.result };
        else if (v.richText) v = v.richText.map(t => t.text).join('');
        else if (v.text !== undefined) v = v.text;
        else if (v instanceof Date) v = v.toISOString();
      }
      vals.push(v);
    }
    rows.push(vals);
  });
  return { rows, sheets: wb.worksheets.map(w => w.name), sheet: ws.name, merged: Object.keys(ws._merges || {}) };
}

async function readPdfText(file) {
  const pdfjs = await import(path.join(require.resolve('pdfjs-dist/package.json'), '..', 'legacy/build/pdf.mjs'));
  const doc = await pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), useSystemFonts: true, isEvalSupported: false }).promise;
  const pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const c = await (await doc.getPage(p)).getTextContent();
    pages.push(c.items.map(it => it.str + (it.hasEOL ? '\n' : ' ')).join(''));
  }
  return { pages, numPages: doc.numPages };
}

module.exports = { detectEncoding, decode, encode, parseCsv, writeCsv, parseNumber, toHalfWidth, readXlsx, readPdfText };
