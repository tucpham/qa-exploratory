#!/usr/bin/env node
// Self-check cho oracles/miniacc-onboard.js - KHÔNG gọi server.
// Chạy: node projects/miniacc-onboard/_onboarding/self-check.js
const path = require('path');
const o = require(path.join(__dirname, '..', '..', '..', 'oracles', 'miniacc-onboard.js'));
let pass = 0, fail = 0;
const t = (name, ok, info = '') => { ok ? pass++ : fail++; console.log(`${ok ? 'PASS' : 'FAIL'} ${name}${info ? ' - ' + info : ''}`); };
const rules = v => v.map(x => x.rule).sort().join(',');

// 1. Ví dụ có đáp án từ TC-VAT-4..7
const TC = [
  { id: 'TC-VAT-4', amount: 10000000, rate: 10, vat: 1000000, total: 11000000 },
  { id: 'TC-VAT-5', amount: 1234561, rate: 10, vat: 123456, total: 1358017 },
  { id: 'TC-VAT-6', amount: 1234565, rate: 10, vat: 123457, total: 1358022 },
  { id: 'TC-VAT-7', amount: 2500000, rate: 8, vat: 200000, total: 2700000 },
];
for (const c of TC) {
  t(`${c.id} expectedVat`, o.expectedVat(c.amount, c.rate) === c.vat, `got ${o.expectedVat(c.amount, c.rate)}, want ${c.vat}`);
  const inv = { id: 1, no: 'QA-SC-1', date: '2026-10-05', amount: c.amount, rate: c.rate, vat: c.vat, total: c.total, status: 'Chờ duyệt', createdBy: 'staff1', approvedBy: null };
  t(`${c.id} correct invoice => no violation`, o.check([inv]).length === 0, rules(o.check([inv])));
}
// Ví dụ TBI-01: VAT làm tròn lên (123.457) phải bị R1 bắt; tổng tương ứng nhất quán nên R2 không báo
{
  const inv = { id: 1, no: 'QA-SC-2', date: '2026-10-05', amount: 1234561, rate: 10, vat: 123457, total: 1358018, status: 'Chờ duyệt', createdBy: 'staff1', approvedBy: null };
  t('TBI-01 ceil VAT => R1', rules(o.check([inv])) === 'R1', rules(o.check([inv])));
}
// Biến thể phân biệt round half up với ceil
t('1.001 @8% => 80', o.expectedVat(1001, 8) === 80);
t('1.002 @5% => 50', o.expectedVat(1002, 5) === 50);
t('1.234.564 @10% => 123.456', o.expectedVat(1234564, 10) === 123456);
t('0% => 0', o.expectedVat(6000000, 0) === 0);

// 2. Baseline test data (test-data.md) với footer báo cáo đúng => không có violation
const B = (id, no, date, amount, rate, status, createdBy, approvedBy) => {
  const vat = amount * rate / 100; return { id, no, customer: 'x', date, amount, rate, vat, total: amount + vat, status, createdBy, approvedBy };
};
const base = [
  B(1, 'HD-0901', '2026-09-05', 12000000, 10, 'Đã duyệt', 'staff1', 'manager1'),
  B(2, 'HD-0902', '2026-09-18', 8500000, 8, 'Đã duyệt', 'staff1', 'manager2'),
  B(3, 'HD-0903', '2026-09-28', 3000000, 10, 'Chờ duyệt', 'staff1', null),
  B(4, 'HD-1001', '2026-10-02', 15000000, 10, 'Đã duyệt', 'staff1', 'manager1'),
  B(5, 'HD-1002', '2026-10-10', 4200000, 8, 'Đã duyệt', 'manager2', 'manager1'),
  B(6, 'HD-1003', '2026-10-15', 20000000, 10, 'Đã duyệt', 'staff1', 'manager2'),
  B(7, 'HD-1004', '2026-10-20', 6000000, 0, 'Chờ duyệt', 'staff1', null),
  B(8, 'HD-1005', '2026-10-25', 9800000, 5, 'Chờ duyệt', 'staff1', null),
];
t('baseline + correct report totals => 0 violations', o.check(base, { '2026-09': 22380000, '2026-10': 43036000 }).length === 0,
  rules(o.check(base, { '2026-09': 22380000, '2026-10': 43036000 })));
// TBI-02: footer bỏ hoá đơn đầu tiên
t('TBI-02 footer missing first invoice => R14 x2', rules(o.check(base, { '2026-09': 9180000, '2026-10': 26536000 })) === 'R14,R14');
t('report unreadable => R14', rules(o.check(base, { '2026-10': null })) === 'R14');

// 3. Parse footer HTML
const html = '<tfoot><tr><th colspan="3">Tổng doanh thu tháng 2026-10</th><th>43.036.000</th></tr></tfoot>';
t('parseReportTotal vi-VN', o.parseReportTotal(html) === 43036000, String(o.parseReportTotal(html)));
t('parseReportTotal no footer => null', o.parseReportTotal('<p>x</p>') === null);

// 4. Từng rule: dữ liệu vi phạm phải bị bắt đúng rule
const ok = { id: 20, no: 'QA-SC-OK', date: '2026-10-05', amount: 1000000, rate: 10, vat: 100000, total: 1100000, status: 'Chờ duyệt', createdBy: 'staff1', approvedBy: null };
const cases = [
  ['R5 amount 0', { amount: 0, vat: 0, total: 0 }, 'R5'],
  ['R5 amount negative', { amount: -1000, vat: -100, total: -1100 }, 'R5'],
  ['R6 rate 15', { rate: 15, vat: 150000, total: 1150000 }, 'R6'],
  ['R2 total wrong', { total: 1100001 }, 'R2'],
  ['R20 date wrong format', { date: '2026/10/05' }, 'R20'],
  ['R20 date impossible', { date: '2026-02-30' }, 'R20'],
  ['R8 new invoice in locked period', { date: '2026-09-15' }, 'R8'],
  ['R8+R20 locked period not baseline, bad format bypass', { date: '2026-09-1x' }, 'R20,R8'],
  ['R10 approved by staff', { status: 'Đã duyệt', approvedBy: 'staff1' }, 'R10'],
  ['R13 approved without approver', { status: 'Đã duyệt', approvedBy: null }, 'R13'],
  ['R13 pending with approver', { approvedBy: 'manager1' }, 'R13'],
  ['R13 unknown status', { status: 'Huỷ' }, 'R13'],
  ['R12 unknown creator', { createdBy: 'ghost' }, 'R12'],
];
for (const [name, patch, want] of cases) { const got = rules(o.check([{ ...ok, ...patch }])); t(name, got === want, `got [${got}] want [${want}]`); }
t('R7 duplicate number', rules(o.check([ok, { ...ok, id: 21 }])) === 'R7');
t('R7 duplicate with spaces', rules(o.check([ok, { ...ok, id: 21, no: ' QA-SC-OK ' }])) === 'R7');
t('R8 baseline HD-0903 in locked period is not a violation', o.check([base[2]]).length === 0);

console.log(`\n${pass} pass, ${fail} fail`);
process.exit(fail ? 1 : 0);
