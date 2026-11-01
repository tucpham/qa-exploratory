// Automated test oracle - miniacc-onboard (BẢN NHÁP, sinh bởi test-basis-analyst, chưa được QA/BA duyệt).
// Encodes `automated` rules from projects/miniacc-onboard/_onboarding/business-rules-draft.md.
// Read-only: logs in with a seed test account, reads GET /api/invoices and GET /report?month=YYYY-MM.
// Mỗi violation có `confidence`: chỉ violation của rule Medium/High được dùng làm bằng chứng defect;
// violation của rule `Needs confirmation` là anomaly, cần BA xác nhận rule trước.
const BASE = process.env.MINIACC_ONBOARD_URL || 'http://localhost:4100';
// Test account từ seed (test-data.md), có thể override qua env.
const USER = process.env.MINIACC_ONBOARD_USER || 'manager1';
const PASS = process.env.MINIACC_ONBOARD_PASS || 'Test@123';

const ROLES = { staff1: 'staff', manager1: 'manager', manager2: 'manager' }; // test-data.md
const RATES = [0, 5, 8, 10];                       // R6
const STATUSES = ['Chờ duyệt', 'Đã duyệt'];        // R12, R13
const LOCKED_PERIODS = ['2026-09'];                // R8 (trang Kỳ kế toán)
// Baseline test data có sẵn trong kỳ khoá trước khi khoá sổ (test-data.md) - không tính là vi phạm R8.
const BASELINE_LOCKED_NOS = ['HD-0901', 'HD-0902', 'HD-0903'];

const CONF = {
  R1: 'Medium', R2: 'Medium', R5: 'Needs confirmation', R6: 'Needs confirmation', R7: 'Needs confirmation',
  R8: 'Needs confirmation', R10: 'Needs confirmation', R12: 'Needs confirmation', R13: 'Needs confirmation',
  R14: 'Needs confirmation', R20: 'Needs confirmation',
};

// R1: VAT = amount x rate / 100, round half up to the nearest dong (TC-VAT-4..7).
// Integer arithmetic to avoid float error: round_half_up(n / 100) = floor((n + 50) / 100) for n >= 0.
function expectedVat(amount, rate) {
  const n = Math.round(amount * rate * 1e6) / 1e6; // amount x rate, cleaned of float noise
  return n >= 0 ? Math.floor((n + 50) / 100) : -Math.floor((-n + 50) / 100);
}

function isValidDate(s) {
  if (typeof s !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + 'T00:00:00Z');
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === s;
}

// Pure check: invoices = array from GET /api/invoices; reportTotals = { 'YYYY-MM': number | null } (footer value shown).
function check(invoices, reportTotals = {}) {
  const v = [];
  const add = (rule, inv, detail) => v.push({ rule, confidence: CONF[rule], invoice: inv ? inv.no : null, detail });
  const seen = {};
  for (const i of invoices) {
    if (typeof i.amount === 'number' && typeof i.rate === 'number') {
      const vat = expectedVat(i.amount, i.rate);
      if (i.vat !== vat) add('R1', i, `VAT ${i.vat} != expected ${vat} (amount ${i.amount} x ${i.rate}%, round half up)`);
    }
    if (i.total !== i.amount + i.vat) add('R2', i, `total ${i.total} != amount + vat = ${i.amount + i.vat}`);
    if (!(i.amount > 0)) add('R5', i, `amount ${i.amount} <= 0`);
    if (!RATES.includes(i.rate)) add('R6', i, `rate ${i.rate}% not in 0/5/8/10`);
    const key = String(i.no).trim();
    (seen[key] = seen[key] || []).push(i.id);
    if (!isValidDate(i.date)) add('R20', i, `date "${i.date}" is not a valid YYYY-MM-DD date`);
    if (LOCKED_PERIODS.includes(String(i.date).slice(0, 7)) && !BASELINE_LOCKED_NOS.includes(i.no))
      add('R8', i, `invoice dated ${i.date} is in locked period ${String(i.date).slice(0, 7)} but is not baseline data`);
    if (!STATUSES.includes(i.status)) add('R13', i, `unknown status "${i.status}"`);
    if (i.status === 'Đã duyệt' && !i.approvedBy) add('R13', i, 'status Đã duyệt but no approver');
    if (i.status === 'Chờ duyệt' && i.approvedBy) add('R13', i, `status Chờ duyệt but approvedBy = ${i.approvedBy}`);
    if (i.approvedBy && ROLES[i.approvedBy] !== 'manager') add('R10', i, `approved by ${i.approvedBy} (role ${ROLES[i.approvedBy] || 'unknown'})`);
    if (!ROLES[i.createdBy]) add('R12', i, `createdBy "${i.createdBy}" is not a known user`);
  }
  for (const [no, ids] of Object.entries(seen)) if (ids.length > 1) add('R7', { no }, `invoice number used ${ids.length} times (ids ${ids.join(',')})`);

  for (const [month, shown] of Object.entries(reportTotals)) {
    if (shown === null || Number.isNaN(shown)) { add('R14', null, `cannot read report total for ${month}`); continue; }
    const expected = invoices.filter(i => i.status === 'Đã duyệt' && String(i.date).startsWith(month)).reduce((s, i) => s + i.total, 0);
    if (shown !== expected) add('R14', null, `report ${month}: footer ${shown}, expected sum of approved totals ${expected}`);
  }
  return v;
}

// vi-VN number "43.036.000" / "-1.234,5" -> number
function parseVnNumber(s) { return Number(String(s).trim().replace(/\./g, '').replace(',', '.')); }
function parseReportTotal(html) {
  const m = html.match(/Tổng doanh thu tháng[^<]*<\/th>\s*<th>([^<]*)</);
  return m ? parseVnNumber(m[1]) : null;
}

async function login() {
  const r = await fetch(`${BASE}/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: `username=${encodeURIComponent(USER)}&password=${encodeURIComponent(PASS)}`,
  });
  const cookie = (r.headers.get('set-cookie') || '').split(';')[0];
  if (!cookie.startsWith('sid=') || cookie === 'sid=') throw new Error('login failed');
  return cookie;
}

module.exports = async function () {
  const cookie = await login();
  const invoices = await (await fetch(`${BASE}/api/invoices`, { headers: { cookie } })).json();
  const months = [...new Set(invoices.map(i => String(i.date).slice(0, 7)).filter(m => /^\d{4}-\d{2}$/.test(m)))];
  const reportTotals = {};
  for (const m of months) {
    const html = await (await fetch(`${BASE}/report?month=${m}`, { headers: { cookie } })).text();
    reportTotals[m] = parseReportTotal(html);
  }
  return check(invoices, reportTotals);
};
module.exports.check = check;
module.exports.expectedVat = expectedVat;
module.exports.parseReportTotal = parseReportTotal;
