// Project probes for MiniAcc (read-only). MiniAcc has no external dependency; this shows the pattern:
// observe state that is not on the current screen and wait for async changes with a timeout.
const { Session, env, poll } = require('../tools/lib/common');

async function api() {
  const s = new Session(env('MINIACC_URL', 'http://localhost:4100'));
  await s.post('/login', { form: { username: 'manager1', password: env('MINIACC_PASSWORD_MANAGER1') } });
  return s;
}

module.exports = {
  probes: {
    invoice: {
      description: 'Đọc trạng thái 1 hoá đơn theo số HĐ; tuỳ chọn chờ tới khi đạt status.',
      args: '{no, status?, timeoutMs=0}',
      async run(a) {
        const s = await api();
        const r = await poll(async () => {
          const inv = (await s.getJson('/api/invoices')).filter(i => i.no === a.no);
          if (!inv.length) return null;
          return !a.status || inv.some(i => i.status === a.status) ? inv : null;
        }, { timeoutMs: a.timeoutMs || 0, intervalMs: 1000 });
        return { ok: r.ok, waitedMs: r.waitedMs, invoices: r.value || [] };
      },
    },
  },
};
