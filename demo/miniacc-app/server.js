// Demo accounting app "MiniAcc" - built ONLY to evaluate the exploratory-testing agents.
// Contains intentionally planted bugs. Do not use as reference code.
const express = require('express');
const app = express();
app.use(express.urlencoded({ extended: false }));

const PORT = process.env.PORT || 4100;
const USERS = {
  staff1:   { pw: 'Test@123', name: 'Nguyễn Văn A', role: 'staff' },
  manager1: { pw: 'Test@123', name: 'Trần Thị B',   role: 'manager' },
  manager2: { pw: 'Test@123', name: 'Lê Văn C',     role: 'manager' },
};
const LOCKED_PERIODS = ['2026-09'];
const sessions = {};
let nextId = 1;
const invoices = [];

function vatOf(amount, rate) { return Math.ceil(amount * rate / 100); }
function addInvoice(o) {
  const vat = vatOf(o.amount, o.rate);
  const inv = { id: nextId++, no: o.no, customer: o.customer, date: o.date, amount: o.amount,
    rate: o.rate, vat, total: o.amount + vat, status: o.status || 'Chờ duyệt',
    createdBy: o.createdBy, approvedBy: o.approvedBy || null, note: o.note || '' };
  invoices.push(inv); return inv;
}
[
  ['HD-0901', 'Công ty Ánh Dương', '2026-09-05', 12000000, 10, 'Đã duyệt', 'staff1', 'manager1'],
  ['HD-0902', 'Công ty Biển Xanh', '2026-09-18', 8500000, 8, 'Đã duyệt', 'staff1', 'manager2'],
  ['HD-0903', 'Công ty Sông Hàn', '2026-09-28', 3000000, 10, 'Chờ duyệt', 'staff1', null],
  ['HD-1001', 'Công ty Ánh Dương', '2026-10-02', 15000000, 10, 'Đã duyệt', 'staff1', 'manager1'],
  ['HD-1002', 'Cửa hàng Minh Châu', '2026-10-10', 4200000, 8, 'Đã duyệt', 'manager2', 'manager1'],
  ['HD-1003', 'Công ty Sông Hàn', '2026-10-15', 20000000, 10, 'Đã duyệt', 'staff1', 'manager2'],
  ['HD-1004', 'Công ty Biển Xanh', '2026-10-20', 6000000, 0, 'Chờ duyệt', 'staff1', null],
  ['HD-1005', 'Cửa hàng Minh Châu', '2026-10-25', 9800000, 5, 'Chờ duyệt', 'staff1', null],
].forEach(r => addInvoice({ no: r[0], customer: r[1], date: r[2], amount: r[3], rate: r[4], status: r[5], createdBy: r[6], approvedBy: r[7] }));

const fmt = n => Number(n).toLocaleString('vi-VN');
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const isLocked = d => LOCKED_PERIODS.includes(String(d).slice(0, 7));

function page(user, title, body) {
  return `<!doctype html><html lang="vi"><head><meta charset="utf-8"><title>${title} - MiniAcc</title>
<style>body{font-family:sans-serif;margin:24px;max-width:1000px}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:6px;text-align:left}
nav a{margin-right:12px}.err{color:#b00;font-weight:bold}.ok{color:#070}label{display:block;margin-top:8px}</style></head><body>
<header><h1>MiniAcc - Quản lý hoá đơn</h1>${user ? `<nav><a href="/">Hoá đơn</a><a href="/invoices/new">Tạo hoá đơn</a><a href="/import">Nhập CSV</a><a href="/report">Báo cáo doanh thu</a><a href="/periods">Kỳ kế toán</a>
<span>Đang đăng nhập: ${esc(user.name)} (${user.role === 'manager' ? 'Kế toán trưởng' : 'Nhân viên'}) - <a href="/logout">Đăng xuất</a></span></nav>` : ''}</header>
<main><h2>${title}</h2>${body}</main></body></html>`;
}
function auth(req, res, next) {
  const sid = (req.headers.cookie || '').split(';').map(s => s.trim()).find(s => s.startsWith('sid='));
  const u = sid && sessions[sid.slice(4)];
  if (!u) return res.redirect('/login');
  req.user = { ...USERS[u], username: u }; next();
}

app.get('/login', (req, res) => res.send(page(null, 'Đăng nhập', `<form method="post" action="/login">
<label>Tên đăng nhập <input name="username"></label><label>Mật khẩu <input name="password" type="password"></label>
<button type="submit">Đăng nhập</button></form>${req.query.e ? '<p class="err">Sai tên đăng nhập hoặc mật khẩu</p>' : ''}`)));
app.post('/login', (req, res) => {
  const u = USERS[req.body.username];
  if (!u || u.pw !== req.body.password) return res.redirect('/login?e=1');
  const sid = Math.random().toString(36).slice(2); sessions[sid] = req.body.username;
  res.setHeader('Set-Cookie', `sid=${sid}; HttpOnly; Path=/`); res.redirect('/');
});
app.get('/logout', (req, res) => { res.setHeader('Set-Cookie', 'sid=; Path=/; Max-Age=0'); res.redirect('/login'); });

app.get('/', auth, (req, res) => {
  const { from = '', to = '', status = '' } = req.query;
  let list = invoices.slice();
  if (from) list = list.filter(i => i.date >= from);
  if (to) list = list.filter(i => i.date < to);
  if (status) list = list.filter(i => i.status === status);
  const rows = list.map(i => `<tr><td><a href="/invoices/${i.id}">${esc(i.no)}</a></td><td>${esc(i.customer)}</td><td>${i.date}</td>
<td>${fmt(i.amount)}</td><td>${i.rate}%</td><td>${fmt(i.total)}</td><td>${i.status}</td></tr>`).join('');
  res.send(page(req.user, 'Danh sách hoá đơn', `<form method="get" action="/">
<label>Từ ngày <input type="date" name="from" value="${esc(from)}"></label><label>Đến ngày <input type="date" name="to" value="${esc(to)}"></label>
<label>Trạng thái <select name="status"><option value="">Tất cả</option><option ${status === 'Chờ duyệt' ? 'selected' : ''}>Chờ duyệt</option><option ${status === 'Đã duyệt' ? 'selected' : ''}>Đã duyệt</option></select></label>
<button type="submit">Lọc</button></form><p>Số hoá đơn: ${list.length}</p>
<table><thead><tr><th>Số HĐ</th><th>Khách hàng</th><th>Ngày</th><th>Tiền hàng</th><th>Thuế suất</th><th>Tổng thanh toán</th><th>Trạng thái</th></tr></thead><tbody>${rows}</tbody></table>`));
});

function invoiceForm(action, i = {}, err = '') {
  return `${err ? `<p class="err">${err}</p>` : ''}<form method="post" action="${action}">
<label>Số hoá đơn <input name="no" value="${esc(i.no || '')}"></label>
<label>Khách hàng <input name="customer" value="${esc(i.customer || '')}"></label>
<label>Ngày hoá đơn <input type="date" name="date" value="${esc(i.date || '')}"></label>
<label>Tiền hàng (VNĐ) <input type="number" name="amount" value="${esc(i.amount ?? '')}"></label>
<label>Thuế suất VAT (%) <input type="number" name="rate" value="${esc(i.rate ?? 10)}"></label>
<label>Ghi chú <input name="note" value="${esc(i.note || '')}"></label>
<button type="submit">Lưu hoá đơn</button></form>`;
}
function parseForm(b) { return { no: (b.no || '').trim(), customer: (b.customer || '').trim(), date: b.date, amount: Number(b.amount), rate: Number(b.rate), note: b.note || '' }; }
function basicCheck(d) {
  if (!d.no || !d.customer || !d.date) return 'Vui lòng nhập đủ Số hoá đơn, Khách hàng, Ngày';
  if (Number.isNaN(d.amount) || Number.isNaN(d.rate)) return 'Số tiền hoặc thuế suất không hợp lệ';
  return '';
}

app.get('/invoices/new', auth, (req, res) => res.send(page(req.user, 'Tạo hoá đơn', invoiceForm('/invoices'))));
app.post('/invoices', auth, (req, res) => {
  const d = parseForm(req.body);
  const err = basicCheck(d) || (isLocked(d.date) ? `Kỳ ${d.date.slice(0, 7)} đã khoá sổ, không thể tạo hoá đơn` : '');
  if (err) return res.send(page(req.user, 'Tạo hoá đơn', invoiceForm('/invoices', req.body, err)));
  const inv = addInvoice({ ...d, createdBy: req.user.username });
  res.redirect(`/invoices/${inv.id}?created=1`);
});

app.get('/invoices/:id', auth, (req, res) => {
  const i = invoices.find(x => x.id === Number(req.params.id));
  if (!i) return res.status(404).send(page(req.user, 'Không tìm thấy', '<p>Hoá đơn không tồn tại</p>'));
  const canApprove = req.user.role === 'manager' && i.status === 'Chờ duyệt';
  res.send(page(req.user, `Hoá đơn ${esc(i.no)}`, `${req.query.created ? '<p class="ok">Đã tạo hoá đơn</p>' : ''}${req.query.approved ? '<p class="ok">Đã duyệt hoá đơn</p>' : ''}
<table><tbody><tr><th>Số HĐ</th><td>${esc(i.no)}</td></tr><tr><th>Khách hàng</th><td>${esc(i.customer)}</td></tr><tr><th>Ngày</th><td>${i.date}</td></tr>
<tr><th>Tiền hàng</th><td>${fmt(i.amount)}</td></tr><tr><th>Thuế suất</th><td>${i.rate}%</td></tr><tr><th>Tiền VAT</th><td>${fmt(i.vat)}</td></tr>
<tr><th>Tổng thanh toán</th><td>${fmt(i.total)}</td></tr><tr><th>Trạng thái</th><td>${i.status}</td></tr>
<tr><th>Người tạo</th><td>${USERS[i.createdBy].name}</td></tr><tr><th>Người duyệt</th><td>${i.approvedBy ? USERS[i.approvedBy].name : '-'}</td></tr>
<tr><th>Ghi chú</th><td>${esc(i.note)}</td></tr></tbody></table>
<p><a href="/invoices/${i.id}/edit">Sửa hoá đơn</a> ${canApprove ? `<a href="/invoices/${i.id}/approve">Duyệt hoá đơn</a>` : ''}</p>`));
});

app.get('/invoices/:id/edit', auth, (req, res) => {
  const i = invoices.find(x => x.id === Number(req.params.id));
  if (!i) return res.status(404).send(page(req.user, 'Không tìm thấy', '<p>Hoá đơn không tồn tại</p>'));
  if (i.status === 'Đã duyệt') return res.send(page(req.user, 'Sửa hoá đơn', '<p class="err">Hoá đơn đã duyệt, không thể sửa</p>'));
  res.send(page(req.user, `Sửa hoá đơn ${esc(i.no)}`, invoiceForm(`/invoices/${i.id}/edit`, i)));
});
app.post('/invoices/:id/edit', auth, (req, res) => {
  const i = invoices.find(x => x.id === Number(req.params.id));
  if (!i) return res.status(404).send('Not found');
  if (i.status === 'Đã duyệt') return res.send(page(req.user, 'Sửa hoá đơn', '<p class="err">Hoá đơn đã duyệt, không thể sửa</p>'));
  const d = parseForm(req.body);
  const err = basicCheck(d);
  if (err) return res.send(page(req.user, 'Sửa hoá đơn', invoiceForm(`/invoices/${i.id}/edit`, req.body, err)));
  Object.assign(i, d, { vat: vatOf(d.amount, d.rate) }); i.total = i.amount + i.vat;
  res.redirect(`/invoices/${i.id}`);
});

app.get('/invoices/:id/approve', auth, (req, res) => {
  const i = invoices.find(x => x.id === Number(req.params.id));
  if (!i) return res.status(404).send('Not found');
  if (i.status !== 'Chờ duyệt') return res.send(page(req.user, 'Duyệt hoá đơn', '<p class="err">Hoá đơn không ở trạng thái chờ duyệt</p>'));
  i.status = 'Đã duyệt'; i.approvedBy = req.user.username;
  res.redirect(`/invoices/${i.id}?approved=1`);
});

app.get('/import', auth, (req, res) => res.send(page(req.user, 'Nhập hoá đơn từ CSV', `<p>Dán nội dung CSV, mỗi dòng: so_hd,khach_hang,ngay(YYYY-MM-DD),tien_hang,thue_suat. Dòng đầu là tiêu đề.</p>
<form method="post" action="/import"><label>Nội dung CSV <textarea name="csv" rows="8" cols="80"></textarea></label><button type="submit">Nhập</button></form>`)));
app.post('/import', auth, (req, res) => {
  const lines = (req.body.csv || '').split(/\r?\n/).map(l => l.trim()).filter(Boolean).slice(1);
  const msgs = []; let ok = 0;
  for (const [n, line] of lines.entries()) {
    const [no, customer, date, amount, rate] = line.split(',').map(s => (s || '').trim());
    const d = { no, customer, date, amount: parseFloat(amount), rate: Number(rate) };
    const err = basicCheck(d) || (invoices.some(x => x.no === no) ? `Số hoá đơn ${no} đã tồn tại` : '')
      || (isLocked(date) ? `Kỳ ${String(date).slice(0, 7)} đã khoá sổ` : '')
      || (![0, 5, 8, 10].includes(d.rate) ? 'Thuế suất không hợp lệ' : '') || (d.amount <= 0 ? 'Tiền hàng phải lớn hơn 0' : '');
    if (err) { msgs.push(`Dòng ${n + 2}: ${esc(err)}`); continue; }
    addInvoice({ ...d, createdBy: req.user.username }); ok++;
  }
  res.send(page(req.user, 'Kết quả nhập CSV', `<p class="ok">Đã nhập ${ok} hoá đơn</p><ul>${msgs.map(m => `<li class="err">${m}</li>`).join('')}</ul><p><a href="/">Về danh sách</a></p>`));
});

app.get('/report', auth, (req, res) => {
  const month = req.query.month || '2026-10';
  const list = invoices.filter(i => i.status === 'Đã duyệt' && i.date.startsWith(month));
  const sum = list.slice(1).reduce((s, i) => s + i.total, 0);
  const rows = list.map(i => `<tr><td>${esc(i.no)}</td><td>${esc(i.customer)}</td><td>${i.date}</td><td>${fmt(i.total)}</td></tr>`).join('');
  res.send(page(req.user, 'Báo cáo doanh thu đã duyệt', `<form method="get"><label>Tháng <input type="month" name="month" value="${esc(month)}"></label><button>Xem</button></form>
<table><thead><tr><th>Số HĐ</th><th>Khách hàng</th><th>Ngày</th><th>Tổng thanh toán</th></tr></thead><tbody>${rows}</tbody>
<tfoot><tr><th colspan="3">Tổng doanh thu tháng ${esc(month)}</th><th>${fmt(sum)}</th></tr></tfoot></table>`));
});

app.get('/periods', auth, (req, res) => res.send(page(req.user, 'Kỳ kế toán', `<table><tr><th>Kỳ</th><th>Trạng thái</th></tr>
<tr><td>2026-09</td><td>Đã khoá sổ</td></tr><tr><td>2026-10</td><td>Đang mở</td></tr></table>`)));

app.get('/api/invoices', auth, (req, res) => res.json(invoices));
app.listen(PORT, () => console.log('MiniAcc on http://localhost:' + PORT));
