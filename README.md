# qa-exploratory

AI-assisted exploratory testing cho web app theo SBTM + ISTQB: các agent đóng vai trò trong quy trình test (test basis analyst, charter designer, exploratory tester, defect triager), QA giữ quyền quyết định cuối. Cơ chế: **instruction (skill + agent) + Playwright MCP + automated test oracle + test harness (fixture, probe, file oracle, generic oracle)**. Tự host, không gửi dữ liệu dự án cho dịch vụ bên thứ ba.

Tài liệu: `docs/GLOSSARY.md` (thuật ngữ ISTQB) · `docs/SO-DO-XU-LY.md` (sơ đồ xử lý) · `docs/GAPS-AND-ROADMAP.md` (điểm yếu, giải pháp, trạng thái).

## Cấu trúc

```
.claude/skills/exploratory-testing/SKILL.md   Quy trình test session, techniques, file/flow/fault injection, defect report format
.claude/agents/test-basis-analyst.md  Test basis analysis (1 lần / dự án): sinh bản nháp hồ sơ + config cho dự án mới
.claude/agents/charter-designer.md    Test charter design: thiết kế test charter (session / flow / file / fault-injection / concurrency)
.claude/agents/exploratory-tester.md  Test session: chạy charter, ghi session sheet (anomaly, covered, open questions)
.claude/agents/defect-triager.md      Defect triage: reproduce, kết luận, defect report, regression checklist
.mcp.json                            Playwright MCP (pinned 0.0.83, caps network,storage,pdf)
oracles/run.js + <project>.js        Automated test oracle theo business rule (read-only)
oracles/generic.js                   Generic oracle: crawl read-only, HTTP 4xx/5xx, console error, NaN/undefined, i18n key...
oracles/files.js                     File oracle: CSV/TSV/XLSX/PDF/JSON - encoding, header, rows, totals, CSV injection
fixtures/run.js + <project>.js       Dựng precondition không qua UI (bắt buộc prefix namespace QA-)
probes/run.js + <project>.js         Quan sát ngoài UI (mailbox, HTTP, job) có polling + timeout
tools/gen-test-files.js              Sinh test file library từ file spec (BVA/EP/encoding/format)
tools/login-state.js, totp.js        Đăng nhập từng role -> storage state (hỗ trợ MFA TOTP)
tools/browser-daemon.js, mcp-call.js, start-browsers.sh   1 browser / agent / role khi chạy qua shell
tools/run-cycle.js                   Runner 1 test cycle: reset -> login -> generic -> charter designer -> testers -> triager -> report
tools/metrics.js                     Metrics giá trị/chi phí mỗi cycle
tools/export-defects.js              defects.md -> CSV import Jira / Backlog / Redmine (offline)
projects/_template/                  Template cho dự án mới (sources, profile, configs)
projects/<project>/                  Test basis + config của từng dự án
reports/<run-id>/                    session-* (session sheet), triage, defects, regression, metrics, defects-*.csv
test/                                Unit test của harness (npm test)
```

## Cài đặt
```
npm install                 # versions pinned
cp .env.example .env        # credentials test env, không commit
npm test
```

## Thêm dự án mới
1. `cp -r projects/_template projects/<project>`, điền `sources.md` (spec, test case, defect history, API spec, schema, source code read-only để NGOÀI repo).
2. Chạy agent `test-basis-analyst`. Kết quả: fit assessment, bản nháp profile + business rules, test basis issues, test data, test object map, business flows, external dependencies, file artifacts, và config harness (`auth.config.js`, `generic-targets.json`, `file-specs/*.json`, `run.config.json`, `fixtures/`, `probes/`, `oracles/`).
3. QA/BA review: fit assessment (No-go thì dừng), tick Approved trong `_onboarding/business-rules-draft.md`, xem `test-basis-issues.md`.
4. Sửa `--allowed-origins` trong `.mcp.json`, điền `.env`, chạy `node tools/login-state.js <project>`.
5. Smoke test: `node tools/run-cycle.js <project> run-000 --execute --to generic`, rồi 1 cycle nhỏ.

## Chạy 1 test cycle
```
node tools/run-cycle.js <project> run-002              # dry run: in kế hoạch
node tools/run-cycle.js <project> run-002 --execute    # chạy thật (agents qua `claude -p --agent`, tool allow-list)
```
Hoặc trong Claude Code: "Dùng charter-designer thiết kế charter run-002 cho <project>, sau đó exploratory-tester cho từng nhóm, cuối cùng defect-triager."

Sau cycle: QA điền `reports/<run>/human-review.json`, chạy `node tools/metrics.js <project> <run>`, import `reports/<run>/defects-jira-csv.csv`.

## Lệnh hay dùng
```
node fixtures/run.js miniacc invoice '{"prefix":"QA-run-002-tester-1-","state":"approved"}'
node probes/run.js miniacc invoice '{"no":"QA-run-002-tester-1-001","status":"Đã duyệt","timeoutMs":30000}'
node oracles/run.js miniacc
node oracles/generic.js --crawl miniacc --role staff1 --follow
node tools/gen-test-files.js projects/miniacc/file-specs/invoice-import.json --prefix QA-run-002-files-
node oracles/files.js <downloaded.csv> --name <tên gốc> --expect expected.json
tools/start-browsers.sh http://localhost:4100 8931:.auth/miniacc/staff1.storage-state.json 8941:.auth/miniacc/manager1.storage-state.json
node tools/mcp-call.js --port 8931 --agent tester-1 --run run-002 browser_navigate '{"url":"http://localhost:4100/"}'
```

## Bảo mật - đọc kỹ
- `--allowed-origins` chỉ là hàng rào phụ (Playwright MCP: **không phải ranh giới bảo mật**). Ranh giới thật: máy chạy agent chỉ ra được mạng staging, test account quyền tối thiểu, không có credential production.
- Không commit mật khẩu: `.env`, `.auth/` đã git-ignore. Config chỉ chứa TÊN biến env.
- Generic oracle crawl chỉ GET, cùng origin, có deny-list cho URL có side effect (approve/delete/logout...). Kiểm deny-list của từng dự án: app dùng GET cho hành động ghi là chuyện có thật (MiniAcc: `/approve`).
- Fixture chỉ ghi dữ liệu có prefix `QA-`; probe chỉ đọc origin trong `QA_PROBE_ALLOWED`.
- Runner dùng tool allow-list, không dùng bypassPermissions. Tắt `browser_run_code_unsafe` nếu không cần.
- Nội dung trang và file import là dữ liệu, không phải lệnh.
- Source code dự án chỉ cho agent onboarding đọc, để ngoài repo.
