# Sources - miniacc-onboard (smoke test của test-basis-analyst)

| Type | Path | Note |
|---|---|---|
| source | /private/tmp/claude-501/-Users-admin-Downloads-dtvn-qa-bot/dfe0de4d-e982-4784-99ad-e883b27b95eb/scratchpad/miniacc-src/server.js | Source app MiniAcc, chỉ đọc |
| testcase | /private/tmp/claude-501/-Users-admin-Downloads-dtvn-qa-bot/dfe0de4d-e982-4784-99ad-e883b27b95eb/scratchpad/miniacc-src/vat-testcases.md | Bảng ví dụ VAT có expected result (từ bộ TC cũ) |
| url | http://localhost:4100 | KHÔNG dùng (app có thể không chạy) |

## Test environment
- URL staging: http://localhost:4100
- Read-only API cho oracle: GET /api/invoices (cần cookie đăng nhập)
- Test account: lấy từ seed trong source

## Forbidden actions
- Không đăng xuất tài khoản agent khác, không đổi mật khẩu.
