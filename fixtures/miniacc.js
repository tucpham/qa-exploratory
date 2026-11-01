// Fixtures for MiniAcc. Uses the same HTTP endpoints as the UI forms (no private API exists).
// Credentials come from .env: MINIACC_URL, MINIACC_PASSWORD_<USERNAME> (e.g. MINIACC_PASSWORD_STAFF1).
const { Session, env } = require('../tools/lib/common');

const base = () => env('MINIACC_URL', 'http://localhost:4100');

async function login(username) {
  const s = new Session(base());
  const r = await s.post('/login', { form: { username, password: env(`MINIACC_PASSWORD_${username.toUpperCase()}`) } });
  if (!s.cookies.sid || /e=1/.test(r.headers.get('location') || '')) throw new Error(`login failed for ${username}`);
  return s;
}

async function createInvoice(s, inv) {
  const r = await s.post('/invoices', { form: inv });
  const loc = r.headers.get('location') || '';
  const m = loc.match(/\/invoices\/(\d+)/);
  if (!m) {
    const html = await r.text();
    const err = (html.match(/class="err">([^<]*)</) || [])[1] || `HTTP ${r.status}`;
    throw new Error(`create ${inv.no} rejected: ${err}`);
  }
  return Number(m[1]);
}

async function approve(s, id) {
  const r = await s.get(`/invoices/${id}/approve`);
  if (!/approved=1/.test(r.headers.get('location') || '')) throw new Error(`approve id ${id} failed (HTTP ${r.status})`);
}

module.exports = {
  fixtures: {
    invoice: {
      description: 'Tạo N hoá đơn ở state pending hoặc approved (qua cùng endpoint của form).',
      args: '{prefix, count=1, state="pending"|"approved", createdBy="staff1", approvedBy="manager2", date="2026-10-15", amount=1000000, rate=10, customer="QA Fixture"}',
      async run(a) {
        const count = Math.min(Number(a.count || 1), 30);
        const creator = await login(a.createdBy || 'staff1');
        const approver = a.state === 'approved' ? await login(a.approvedBy || 'manager2') : null;
        const out = [];
        for (let n = 1; n <= count; n++) {
          const no = `${a.prefix}${String(n).padStart(3, '0')}`;
          const id = await createInvoice(creator, {
            no, customer: a.customer || 'QA Fixture', date: a.date || '2026-10-15',
            amount: String(a.amount ?? 1000000), rate: String(a.rate ?? 10), note: 'fixture',
          });
          if (approver) await approve(approver, id);
          out.push({ id, no, state: approver ? 'approved' : 'pending', url: `${base()}/invoices/${id}` });
        }
        return out;
      },
    },
    find: {
      description: 'Đọc (read-only) các hoá đơn có số bắt đầu bằng prefix.',
      args: '{prefix}',
      writes: false,
      async run(a) {
        const s = await login('manager1');
        const all = await s.getJson('/api/invoices');
        return all.filter(i => !a.prefix || String(i.no).startsWith(a.prefix));
      },
    },
  },
};
