// Login automation per role for tools/login-state.js. Only ENV VARIABLE NAMES here, never secrets.
module.exports = {
  base: process.env.PROJECT_URL || 'https://staging.<project>.example',
  roles: {
    staff: { username: 'qa_staff01', passwordEnv: 'PROJECT_PASSWORD_STAFF' },
    approver: { username: 'qa_approver01', passwordEnv: 'PROJECT_PASSWORD_APPROVER', totpEnv: 'PROJECT_TOTP_APPROVER' },
  },
  async login(page, { base, username, password, otp }) {
    await page.goto(`${base}/login`);
    await page.getByLabel(/user|email|tên đăng nhập|ユーザー/i).fill(username);
    await page.getByLabel(/password|mật khẩu|パスワード/i).fill(password);
    await page.getByRole('button', { name: /log ?in|sign ?in|đăng nhập|ログイン/i }).click();
    if (otp) { // MFA step (TOTP)
      await page.getByLabel(/code|mã|コード/i).fill(otp());
      await page.getByRole('button', { name: /verify|xác nhận|確認/i }).click();
    }
    await page.waitForLoadState('networkidle');
  },
  async isLoggedIn(page) { return !/login|signin/i.test(new URL(page.url()).pathname); },
};
