// Copy to fixtures/<project>.js. Fixtures put the app in a precondition state WITHOUT the UI.
// Every writing fixture receives args.prefix (test data namespace) and must use it in every record it creates.
const { Session, env } = require('../tools/lib/common');
module.exports = {
  fixtures: {
    order: {
      description: 'Tạo đơn hàng ở state draft | submitted | approved-level-1',
      args: '{prefix, state="draft", count=1}',
      async run(a) {
        const s = new Session(env('PROJECT_URL'));
        // login via API, create via API, advance state via API ...
        return [];
      },
    },
    find: { description: 'Đọc record theo prefix (read-only)', args: '{prefix}', writes: false, async run(a) { return []; } },
  },
};
