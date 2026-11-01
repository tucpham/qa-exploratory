// Login automation for MiniAcc (used by tools/login-state.js). Passwords come from .env.
module.exports = {
  base: process.env.MINIACC_URL || 'http://localhost:4100',
  roles: {
    staff1: { username: 'staff1', passwordEnv: 'MINIACC_PASSWORD_STAFF1' },
    manager1: { username: 'manager1', passwordEnv: 'MINIACC_PASSWORD_MANAGER1' },
    manager2: { username: 'manager2', passwordEnv: 'MINIACC_PASSWORD_MANAGER2' },
  },
  async login(page, { base, username, password }) {
    await page.goto(`${base}/login`);
    await page.getByLabel('Tên đăng nhập').fill(username);
    await page.getByLabel('Mật khẩu').fill(password);
    await page.getByRole('button', { name: 'Đăng nhập' }).click();
    await page.waitForLoadState('networkidle');
  },
  async isLoggedIn(page) { return !/\/login/.test(new URL(page.url()).pathname); },
};
