// Oracle for MiniAcc - encodes RULES from projects/miniacc/project-profile.md.
// Read-only: logs in with a test account, reads /api/invoices and /report.
const BASE = process.env.MINIACC_URL || 'http://localhost:4100';
const ROLES = { staff1: 'staff', manager1: 'manager', manager2: 'manager' };
const RATES = [0, 5, 8, 10];

async function login() {
  const r = await fetch(`${BASE}/login`, {
    method: 'POST', redirect: 'manual',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: 'username=manager1&password=Test@123',
  });
  return (r.headers.get('set-cookie') || '').split(';')[0];
}
const roundVND = x => Math.floor(x + 0.5); // R1: round half up to the nearest dong

module.exports = async function () {
  const cookie = await login();
  const invoices = await (await fetch(`${BASE}/api/invoices`, { headers: { cookie } })).json();
  const v = [];
  const add = (rule, inv, detail) => v.push({ rule, invoice: inv ? inv.no : null, detail });

  const seen = {};
  for (const i of invoices) {
    const vat = roundVND(i.amount * i.rate / 100);
    if (i.vat !== vat) add('R1', i, `VAT ${i.vat} != expected ${vat} (amount ${i.amount} x ${i.rate}%)`);
    if (i.total !== i.amount + i.vat) add('R1', i, `total ${i.total} != amount + vat ${i.amount + i.vat}`);
    if (!(i.amount > 0)) add('R2', i, `amount ${i.amount} <= 0`);
    if (!RATES.includes(i.rate)) add('R3', i, `rate ${i.rate}% not in 0/5/8/10`);
    (seen[i.no] = seen[i.no] || []).push(i.id);
    if (i.approvedBy && ROLES[i.approvedBy] !== 'manager') add('R5', i, `approved by ${i.approvedBy} (role ${ROLES[i.approvedBy]})`);
    if (i.approvedBy && i.approvedBy === i.createdBy) add('R6', i, `created and approved by ${i.createdBy}`);
  }
  for (const [no, ids] of Object.entries(seen)) if (ids.length > 1) add('R4', { no }, `invoice number used ${ids.length} times (ids ${ids.join(',')})`);

  // R9: report footer total must equal sum of approved invoices of that month
  const months = [...new Set(invoices.map(i => i.date.slice(0, 7)))];
  for (const m of months) {
    const html = await (await fetch(`${BASE}/report?month=${m}`, { headers: { cookie } })).text();
    const match = html.match(/Tổng doanh thu tháng[^<]*<\/th><th>([^<]*)</);
    if (!match) { add('R9', null, `cannot read report total for ${m}`); continue; }
    const shown = Number(match[1].replace(/\./g, ''));
    const expected = invoices.filter(i => i.status === 'Đã duyệt' && i.date.startsWith(m)).reduce((s, i) => s + i.total, 0);
    if (shown !== expected) add('R9', null, `report ${m}: shown ${shown}, expected ${expected}`);
  }
  return v;
};
