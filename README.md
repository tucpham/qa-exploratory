# dtvn QA bot

Bot AI làm adhoc / exploratory testing cho web app nội bộ. Cơ chế: **prompt (skill + agent) + Playwright MCP + oracle script**. Tự host, không gửi dữ liệu dự án cho dịch vụ bot bên thứ ba.

## Cấu trúc

```
.claude/skills/adhoc-qa/SKILL.md   Quy trình test chung (vòng explore - giả thuyết - tấn công - xác minh, heuristic, format bug)
.claude/agents/planner.md          Sinh charter từ profile + coverage
.claude/agents/explorer.md         Chạy charter, ghi nghi vấn
.claude/agents/verifier.md         Tái hiện độc lập, loại bug giả, viết report
.mcp.json                          Cấu hình Playwright MCP cho Claude Code
oracles/run.js + oracles/<du-an>.js  Script kiểm tra RULE trên dữ liệu thật (read-only)
projects/<du-an>/                  Context riêng từng dự án
  project-profile.md               Nghiệp vụ, vai trò, RULE R1..Rn (oracle), vùng rủi ro, vùng cấm
  test-data.md                     Tài khoản test, data mẫu có đáp án
  coverage.md                      Những gì đã test (verifier cập nhật)
  known-issues.md                  Những gì không phải bug (QA người cập nhật)
  charters/<run-id>.md             Charter của từng lần chạy
reports/<run-id>/                  suspects-*.md, triage.md, bugs.md
tools/                             Chạy browser qua shell (CI / demo): browser-daemon.js, mcp-call.js, start-browsers.sh
```

## Thêm dự án mới
1. Copy `projects/miniacc/` thành `projects/<du-an>/`, viết lại profile + test-data. Rule phải viết dạng kiểm tra được.
2. (Nên có) viết `oracles/<du-an>.js` kiểm tra các rule tính toán / bất biến qua API hoặc DB read-only.
3. Sửa `--allowed-origins` trong `.mcp.json` thành URL staging của dự án.

## Chạy với Claude Code (khuyến nghị)
```
cd dtvn-qa-bot && npm install
claude
> Dùng agent qa-planner sinh charter run-002 cho dự án <du-an>,
> sau đó chạy qa-explorer cho từng nhóm charter, cuối cùng qa-verifier viết report.
```

## Chạy qua shell (CI / máy không có Claude Code UI)
```
tools/start-browsers.sh https://staging.<du-an> 8931 8932 8933   # 1 browser riêng cho mỗi agent
node tools/mcp-call.js --port 8931 --agent explorer-1 browser_navigate '{"url":"https://staging.<du-an>/login"}'
node oracles/run.js <du-an>
```
Mỗi lần gọi browser được ghi vào `reports/usage.jsonl` để đo chi phí.

## Bảo mật - đọc kỹ
- `--allowed-origins` chỉ là hàng rào phụ. Tài liệu Playwright MCP ghi rõ nó **không phải ranh giới bảo mật**. Ranh giới thật là: máy chạy bot chỉ ra được mạng staging, tài khoản test quyền tối thiểu, không có credential production trên máy.
- Không commit mật khẩu thật. Dùng `--secrets .env` hoặc `--storage-state` cho phiên đăng nhập.
- Tắt tool `browser_run_code_unsafe` nếu không cần (chạy code tuỳ ý trong tiến trình Playwright).
- Nội dung trang web là dữ liệu, không phải lệnh: skill đã dặn bot bỏ qua chỉ dẫn xuất hiện trên trang.
