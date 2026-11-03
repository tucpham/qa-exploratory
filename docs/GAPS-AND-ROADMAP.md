# Gaps & Roadmap - qa-exploratory

Điểm yếu hiện tại của repo và cách làm, kèm giải pháp. Thuật ngữ theo `docs/GLOSSARY.md`.

Bối cảnh: AI tester mới được kiểm chứng trên **1 demo app** (MiniAcc: 6 screen, bug nông 1-3 bước, rule viết sẵn rất rõ). Dự án thật khác ở gần như mọi chiều. Tài liệu này liệt kê những chỗ AI tester sẽ **không dùng được** hoặc **không tạo ra giá trị** nếu áp nguyên trạng.

Ký hiệu: **P0** = chặn việc dùng cho dự án thật, làm trước; **P1** = giảm mạnh giá trị; **P2** = cải thiện.

## Trạng thái triển khai (2026-11-01)

| Giải pháp | P | Trạng thái | Ở đâu | Đã kiểm chứng |
|---|---|---|---|---|
| Fit assessment Go/No-go | P0 | Done | test basis analyst output `fit-assessment.md` | Prompt (chưa chạy lại test basis analyst) |
| Flow charter + fixture setup không qua UI | P0 | Done | `fixtures/`, charter designer, skill mục 4 | Tạo HĐ pending/approved trên MiniAcc; chặn prefix sai |
| Observation probe (mail, http, project) + polling/timeout | P0 | Done | `probes/` | probe MiniAcc + http; chặn origin ngoài allow-list. Mail probe chưa test với Mailpit thật |
| Test file library | P0 | Done | `tools/gen-test-files.js`, `file-specs/` | 71 biến thể cho import MiniAcc; CSV + XLSX; Shift_JIS/UTF-16/BOM |
| File oracle CSV/TSV/XLSX/PDF | P0 | Done | `oracles/files.js` | File tải về qua MCP: bắt NaN, thiếu dòng, tổng sai; XLSX công thức; PDF text |
| Hướng dẫn upload/download trong skill | P0 | Done | skill mục 5 | Download qua MCP thật; phát hiện MCP đổi tên file và `browser_pdf_save` lưu theo cwd |
| Generic oracle | P0 | Done | `oracles/generic.js`, `tools/lib/generic-checks.js`, skill mục 6 | Crawl MiniAcc 2 role, `--follow`, deny-list không bấm `/approve` |
| Data reset bắt buộc + namespace theo cycle | P0 | Done | `run.config.json` reset + healthcheck, namespace `QA-<run>-<agent>-` | Reset MiniAcc qua runner |
| Storage state / MFA TOTP | P0 | Done | `tools/login-state.js`, `tools/totp.js`, `auth.config.js` | 3 role MiniAcc; TOTP đúng RFC 6238 vectors |
| Metrics giá trị | P0 | Done | `tools/metrics.js`, field "Existing TC coverage" | Chạy trên run-001 (khớp 298 call, 11 defect) |
| Multi-role / multi-browser, đổi role trong phiên | P1 | Done | `start-browsers.sh port:state`, `browser_set_storage_state` | Đổi staff1 -> manager1 trong cùng browser |
| Fault injection phía browser | P1 | Done | caps `network`, `browser_route`, `browser_network_state_set` | Route `/report` trả 500 |
| State transition / flow state file | P1 | Done (prompt) | skill mục 3-4, charter designer | Chưa chạy agent thật |
| Intermittent, Duplicate, regression checklist | P1 | Done (prompt) | triager | Chưa chạy agent thật |
| Runner + CI | P1 | Done | `tools/run-cycle.js` | Dry run + chạy thật tới bước generic; bước agent chưa chạy (tốn phí) |
| Export Jira / Backlog / Redmine | P1 | Done (CSV offline) | `tools/export-defects.js` | Export run-001: 11 defect, UTF-8 BOM |
| Pin version | P1 | Done | `package.json`, `.mcp.json` | `npm install`, 9/9 unit test |
| i18n / JP heuristics | P2 | Done | skill mục 3, gen-test-files (full-width, 和暦, Shift_JIS) | Unit test |
| Service virtualization phía server (WireMock/Prism) | P1 | **Chưa** | - | Cần dev dựng trên staging; khai báo trong `external-dependencies.md` |
| Time travel trên staging | P2 | **Chưa** | - | Cần dev hỗ trợ |
| Source isolation bằng permission | P1 | Một phần | Quy định trong test basis analyst + README | Chưa có deny rule tự động |
| Accessibility (axe), canvas/iframe | P2 | **Chưa** | - | - |
| Coverage có cấu trúc (rule × channel × technique) | P2 | Một phần | Format "Covered" của tester | Chưa có parser |
| Gọi API tracker trực tiếp, chống trùng ticket | P1 | **Chưa** | - | Cố ý: chỉ CSV để QA duyệt |

---

## 0. Project fit assessment - kiểm tra TRƯỚC khi nhận dự án

Nhiều dự án sẽ thất bại không phải do AI tester, mà do điều kiện không đủ. Cần một checklist go/no-go (agent onboarding nên tự chấm):

| Điều kiện | Không có thì sao | Bắt buộc? |
|---|---|---|
| Test environment riêng (staging), không phải production | Không chạy | Bắt buộc |
| Test account cho mọi role, đăng nhập tự động được (không captcha, MFA có cách bypass) | Không chạy | Bắt buộc |
| Có thể reset/seed test data | Chạy được 1-2 lần rồi data rác làm sai kết quả | Bắt buộc từ cycle 2 |
| Test basis có business rule (spec, TC, hoặc BA trả lời được) | AI tester chỉ tìm được lỗi chung (500, NaN), giá trị thấp | Nên có |
| Read-only API hoặc DB replica cho automated oracle | Mất phần bắt defect mạnh nhất (6/10 ở run-001) | Nên có |
| App là web chạy trên browser | Mobile native, desktop app: không hỗ trợ | Bắt buộc |
| Dữ liệu trên staging không chứa PII thật (hoặc đã mask) | Rủi ro gửi PII qua LLM | Bắt buộc |
| Khách hàng/PM cho phép dùng AI trên app và tài liệu của họ | Vi phạm hợp đồng / NDA | Bắt buộc |

**Giải pháp**: thêm mục "Fit assessment" vào output của `test-basis-analyst` (Go / Go with limits / No-go + lý do). Dự án "No-go" thì không nên ép dùng.

---

## 1. Business flow nhiều screen, nhiều role (end-to-end)

**Ví dụ thực tế**: đơn mua hàng -> duyệt 2 cấp -> nhập kho -> xuất hoá đơn -> đối soát công nợ; hồ sơ bảo hiểm qua 5 role; wizard đăng ký 7 bước có lưu nháp.

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| Charter hiện tại là "1 mục tiêu hẹp", budget 40 action. Một flow 15 bước x 3 role ăn hết budget chỉ để đi đến bước cần tấn công | Không bao giờ chạm tới bước cuối của flow, nơi hay có defect | Thêm loại **flow charter**: budget riêng (vd 120), mô tả flow từ `business-flows.md`, chỉ định *bước tấn công* | P0 |
| Precondition phải dựng qua UI (tạo đơn, duyệt...) mỗi lần | Tốn budget, chậm, dễ lỗi thao tác | **Test data setup qua API/fixture**: script `fixtures/<project>.js` tạo record ở state bất kỳ (vd "đơn đã duyệt cấp 1"). AI tester chỉ dùng UI ở bước đang test | P0 |
| Đổi role giữa các bước phải logout/login | Mất state, tốn action, dễ đụng session agent khác | Mỗi agent có **nhiều browser context** (1 storage-state / role): `tools/start-browsers.sh` mở nhiều cổng cho 1 agent, mỗi cổng 1 role | P1 |
| Flow dài vượt context của 1 agent | Agent quên dữ liệu ở bước đầu | **Flow state file**: agent ghi ID record, giá trị đã nhập sau mỗi bước vào `reports/<run>/flow-state-<agent>.json`; có thể resume | P1 |
| Chưa có kỹ thuật cho flow | Test ngẫu hứng, bỏ sót transition | Dùng **State Transition Testing**: onboarding sinh state model (state, event, guard); charter designer sinh charter phủ transition không hợp lệ (nhảy cóc, quay lại, làm 2 lần, huỷ giữa chừng, back của browser, mở 2 tab) | P1 |
| Oracle chỉ kiểm từng record, không kiểm toàn flow | Lỗi "số ở bước 5 không khớp bước 1" lọt | **Flow invariant** trong automated oracle: tổng tồn kho trước/sau, công nợ = hoá đơn - thanh toán, audit log đủ bước | P1 |

---

## 2. Phụ thuộc vào hệ thống bên ngoài (DB, hệ thống khác, batch, email...)

**Ví dụ thực tế**: payment gateway, SSO/LDAP, gửi email/SMS/OTP, đồng bộ ERP/core banking, batch chạy đêm, message queue, lưu file lên S3, API thuế điện tử, tỷ giá.

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| AI tester chỉ thấy UI. Kết quả nằm ở hệ thống khác (email đã gửi chưa, ERP nhận đúng chưa) | Không có oracle, không kết luận được | **Observation probe**: script read-only cho từng dependency, chạy giống oracle: đọc mailbox test (Mailpit/MailHog API), bảng outbox/queue, log của stub, API của hệ thống kia trên sandbox. Khai báo trong `external-dependencies.md` | P0 |
| Dependency trên staging không có / không ổn định | Flow chặn giữa chừng, AI tester báo defect giả | Mỗi dependency phân loại: real / sandbox / stub / không có. "Không có" thì charter bỏ flow đó và ghi vào **Out of scope**, không báo defect | P0 |
| Không test được lỗi của bên ngoài (timeout, 500, trả dữ liệu sai, trả chậm) | Bỏ sót nhóm defect error handling, rất hay gặp ở production | **Test double có điều khiển**: service virtualization (WireMock, Mockoon, Prism từ OpenAPI) với endpoint chuyển mode (`/__mode/timeout`). Charter "fault injection" gọi probe để đổi mode rồi test UI | P1 |
| Xử lý bất đồng bộ (job, queue, webhook) | AI tester kiểm ngay khi chưa xử lý xong, báo sai | Probe có **polling + timeout** khai báo trong profile ("job xuất hoá đơn tối đa 2 phút"); triager chờ đủ timeout trước khi Rejected/Confirmed | P1 |
| Batch chạy đêm / cuối tháng | Không đợi được | Staging có endpoint/command trigger job thủ công (cần dev hỗ trợ), khai báo trong profile; nếu không có thì Out of scope | P1 |
| Dữ liệu DB cần đối chiếu nhưng AI tester không được đọc DB | Oracle yếu | **DB read-only replica account**, chỉ cấp cho oracle/probe script, agent không có credential (script đọc từ env) | P1 |
| Rule phụ thuộc thời gian (hết hạn, kỳ, timezone) | Không tạo được tình huống "ngày 31/12" | Staging hỗ trợ **time travel** (biến môi trường/endpoint giả lập ngày), hoặc fixture tạo record với ngày quá khứ/tương lai; profile ghi timezone server vs hiển thị | P2 |

---

## 3. File: upload, import, download, export, verify file

**Ví dụ thực tế**: import Excel 10.000 dòng; xuất báo cáo Excel/PDF/CSV; CSV Shift_JIS cho khách Nhật; hoá đơn PDF có QR; upload ảnh/CMND; zip nhiều file.

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| AI tester tạo file test bằng tay mỗi lần | Thiếu biến thể, không lặp lại được | **Test file library** `fixtures/files/<project>/` sinh bằng script từ `file-artifacts.md`: đúng chuẩn, thiếu cột, thừa cột, đổi thứ tự cột, header sai, BOM, Shift_JIS/UTF-16, xuống dòng CRLF/LF, ô có dấu phẩy/ngoặc kép/xuống dòng, số kiểu VN/quốc tế/full-width (１２３), ngày nhiều định dạng, 0 dòng, 1 dòng, rất nhiều dòng, sát giới hạn kích thước, đuôi file sai MIME, file rỗng, Excel có nhiều sheet/merged cell/công thức | P0 |
| Download xong không ai kiểm nội dung | Defect export (sai số, thiếu dòng, lệch timezone, font lỗi) lọt hoàn toàn | **File oracle** `oracles/files.js`: parse file tải về (CSV, xlsx bằng SheetJS, PDF bằng pdf-parse, zip) và so với API/màn hình: số dòng, tổng, từng giá trị, tên file, encoding, header, format số/ngày, sort, filter đang áp dụng có được giữ không | P0 |
| Playwright MCP: file download lưu vào output dir, upload qua `browser_file_upload` - chưa có hướng dẫn trong skill | Agent không biết cách làm, tốn action thử | Bổ sung skill mục 5: cách upload, cách tìm file đã download, gọi `node oracles/files.js <path> --expect <query>` | P0 |
| Import lớn / chậm | Timeout, AI tester nghĩ là lỗi | Profile ghi thời gian xử lý tối đa; probe polling trạng thái import | P1 |
| Rủi ro security của file | Bỏ sót | Checklist: CSV/formula injection (`=HYPERLINK(...)`), tên file path traversal (`../`), file thực thi đổi đuôi, file rất lớn. Chỉ chạy trên staging, đưa vào charter riêng | P2 |
| Round-trip | Export rồi import lại không giống | Charter "export -> import lại -> so sánh" | P2 |

---

## 4. Test basis và test oracle (gốc của giá trị)

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| Dự án thật rule mơ hồ, thiếu, spec cũ hơn code | AI tester ra toàn "Needs clarification", hoặc báo defect theo spec cũ | Onboarding ghi ngày/version từng nguồn, cảnh báo spec cũ; rule có confidence; chỉ rule Approved mới được dùng kết luận defect | P0 |
| Không có rule thì AI tester gần như không kết luận được gì | Giá trị ~0 với dự án ít tài liệu | **Generic oracle** không cần rule: HTTP 5xx, console error, `NaN/undefined/null/[object Object]` trên UI, i18n key chưa dịch (`label.xxx`), dữ liệu mất sau refresh, cùng giá trị khác nhau giữa list/detail/export, accessibility cơ bản (axe-core). Dựa trên heuristic oracle **HICCUPPS** (consistency with History, Image, Comparable products, Claims, User expectations, Product, Purpose, Statutes) | P0 |
| Spec/TC bằng tiếng Nhật, Excel kiểu Nhật (方眼紙, merged cell) | Onboarding đọc sai | Converter giữ vị trí ô; từ khoá tiếng Nhật đã thêm vào test basis analyst; QA người review | P1 |
| Viết automated oracle cần API/DB đọc | Nhiều dự án không có | Fallback: **UI-scraping oracle** đọc màn hình list/report qua Playwright (chậm hơn nhưng dùng được) | P1 |
| Oracle MiniAcc hard-code password, parse HTML bằng regex | Vỡ khi UI đổi | Credential từ `.env`; ưu tiên API; có self-test với ví dụ có đáp án | P2 |

---

## 5. Test data management

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| Không reset data (run-001 để lại ~55 invoice rác, vài cái duyệt sai) | Cycle sau oracle báo vi phạm cũ, report sai | Bắt buộc **data reset** trước cycle (script/DB snapshot/container), khai báo trong profile; không có thì oracle chỉ xét record của namespace cycle hiện tại | P0 |
| Namespace chỉ theo agent (`QA-E1-`), không theo cycle | Lẫn dữ liệu giữa các cycle | Namespace `QA-<run>-<agent>-` | P1 |
| Staging dùng chung với team khác (dev, QA người, UAT) | AI tester phá dữ liệu người khác, hoặc bị dữ liệu người khác làm nhiễu | Tenant/công ty riêng cho AI tester; khung giờ chạy; forbidden actions rõ | P1 |
| Field có ràng buộc unique / số thứ tự | Tạo trùng, lỗi giả | Fixture sinh giá trị unique | P2 |

---

## 6. Authentication, session, UI phức tạp

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| SSO, MFA/OTP, captcha | AI tester không đăng nhập được | `--storage-state` theo role tạo sẵn bằng script login; TOTP secret trong `.env` để sinh OTP; captcha tắt trên staging (yêu cầu dev) | P0 |
| Session timeout giữa session | Agent hiểu nhầm là defect | Skill: gặp màn hình login giữa chừng -> đăng nhập lại, ghi nhận, không báo defect trừ khi rule về timeout | P1 |
| Bảng lớn, trang nặng | Snapshot hàng chục nghìn ký tự, tốn token, vượt context | Dùng `browser_find`, filter/phân trang trước khi snapshot, đọc số liệu qua oracle/API; cost cap mỗi agent | P1 |
| Canvas, chart, drag-drop, rich text editor, iframe, virtual scroll, date picker tuỳ biến | Accessibility snapshot không thấy nội dung | Screenshot + đọc ảnh; kiểm dữ liệu chart qua API; ghi vào test-object-map loại control để charter designer biết | P2 |
| Nhiều ngôn ngữ / locale (VN, JP, EN) | Bỏ sót defect i18n | Heuristic i18n: full-width, katakana nửa độ rộng, 和暦, định dạng ngày/số theo locale, text tràn layout; chạy charter với từng locale | P2 |

---

## 7. Concurrency, non-determinism, flaky

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| Không test được 2 user cùng sửa 1 record, double submit thật | Bỏ sót race condition (defect nặng ở production) | **Multi-session charter**: 1 agent điều khiển 2 cổng browser cùng lúc; hoặc probe gửi 2 request song song | P1 |
| UI bất đồng bộ (loading, toast tự mất) | AI tester đọc sớm, anomaly giả | Skill: đợi trạng thái ổn định (`browser_wait_for`) trước khi so; triager reproduce 2/2 | P1 |
| Defect chỉ xảy ra thỉnh thoảng | Triager Rejected vì 1/2 | Thêm kết luận **Intermittent** (tái hiện k/n lần) thay vì Rejected | P2 |

---

## 8. Quy trình, vận hành, đo giá trị

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| Chạy bằng prompt gõ tay, run-id tự đặt | Không chạy theo lịch / theo deploy | **Runner** `tools/run-cycle.js` dùng Claude Agent SDK hoặc `claude -p`: đọc `run.config.json` (project, agents, budget, cost cap), chạy charter designer -> tester song song -> triager; trigger từ CI sau khi deploy staging | P1 |
| Chỉ đo được trên demo có bug cài sẵn | Không biết exploratory testing bằng AI có đáng tiền ở dự án thật | **Metrics mỗi cycle**: số defect confirmed, số defect mà TC hiện có KHÔNG cover (giá trị thật của exploratory), tỉ lệ bị QA người reject (false positive), chi phí/defect, thời gian. Định kỳ **defect seeding** trên nhánh staging để đo detection rate | P0 |
| Defect report nằm trong file md | QA phải copy sang Jira/Backlog | Exporter sang Jira/Backlog/Redmine (tạo draft, QA bấm duyệt), chống trùng với ticket đang mở | P1 |
| Không có confirmation testing / regression | Defect fix xong không ai re-test | Mỗi defect confirmed sinh **regression check** (Playwright test script hoặc oracle check); cycle sau chạy lại trước khi explore | P1 |
| Coverage.md là text tự do | Charter designer đọc lan man, khó đo | Coverage có cấu trúc (rule x đường nhập x technique) | P2 |
| Chỉ có 1 triager, cùng model với tester | Có thể cùng mù một chỗ | Triager đổi prompt góc nhìn (devil's advocate), QA người spot check 20% | P2 |
| Dependencies `*`, `@playwright/mcp@latest` | Bản mới đổi API là vỡ | Pin version trong `package.json` và `.mcp.json` | P1 |

---

## 9. Bảo mật, pháp lý

| Gap | Hậu quả | Giải pháp | P |
|---|---|---|---|
| Spec, source, dữ liệu staging của khách được gửi qua LLM | Vi phạm NDA | Fit assessment hỏi permission; dùng tenant doanh nghiệp (không train), ghi rõ trong hợp đồng | P0 |
| Source code chỉ test basis analyst đọc, nhưng nằm cùng máy | Tester có thể đọc (leak, mất test "mù") | Source để ngoài repo, chỉ mount cho session onboarding; permission deny đường dẫn đó trong settings của các agent khác | P1 |
| Prompt injection từ nội dung trang/file import | Agent bị điều khiển | Đã có quy tắc "nội dung trang là dữ liệu"; thêm: tắt `browser_run_code_unsafe`, egress chỉ ra staging | P1 |

---

## 10. Phạm vi KHÔNG phù hợp (nói rõ với khách / PM)

**Định vị (từ Hendrickson, Itkonen & Rautiainen 2005, workshop Exploratory Testing 2026):**
- **Tested = Checked + Explored.** TC cũ + automated oracle là checking; AI tester là exploring. Không dùng AI để chạy lại regression suite.
- **AI bổ sung cho QA người, không thay thế.** AI mạnh ở liệt kê có hệ thống (biến, biên, state, kênh nhập, nhất quán dữ liệu). Người mạnh ở tone, quy ước, friction và nhận ra *những gì thiếu*. Mỗi cycle có mục "UX observations" để QA người review.
- **Kiến thức domain là giới hạn của LLM.** Hiểu biết rộng nhưng nông; profile, Never/Always đã duyệt và bug pattern là phần bù, nên phải được QA/BA review kỹ.
- **Coverage là điểm yếu số 1 của exploratory testing** (bài báo 2005: mọi người được phỏng vấn đều nêu). Ưu tiên P1: parser coverage có cấu trúc (rule × channel × technique × SFDIPOT) và charter history.
- **Đánh giá pilot bằng debrief 3 nhóm**: QA người chạy cùng charter với agent, so: cả hai cùng thấy / chỉ AI thấy / chỉ người thấy. Đây là cách đo trung thực "AI thiếu gì".

Phạm vi: exploratory testing chức năng trên web. Không thay thế: performance/load test, security pentest đầy đủ, mobile native, test hardware/IoT, usability test với người dùng thật, test toàn bộ regression suite. Mỗi profile có mục **Out of scope**.

---

## 11. Roadmap đề xuất

| Giai đoạn | Nội dung | Kết quả |
|---|---|---|
| **Phase 1 - dùng được cho dự án thật (P0)** | Fit assessment; flow charter + fixture setup qua API; observation probe cho dependency; test file library + file oracle + hướng dẫn upload/download trong skill; generic oracle; data reset bắt buộc; storage-state/MFA; metrics giá trị | Chạy được trên 1 dự án pilot có flow + file + dependency |
| **Phase 2 - tăng giá trị (P1)** | Multi-session/multi-role; state transition model; test double có fault injection; runner + CI; exporter Jira/Backlog; regression check từ defect; pin version; cô lập source | Chạy tự động sau mỗi deploy staging |
| **Phase 3 - tối ưu (P2)** | i18n heuristic, coverage có cấu trúc, intermittent, UI phức tạp, security checklist file | Mở rộng nhiều dự án |

**Pilot đề xuất**: chọn 1 dự án đang chạy có (a) staging riêng, (b) bộ TC Excel đã chạy nhiều cycle, (c) defect history, (d) ít nhất 1 flow nhiều role và 1 chức năng import/export. Đo: số defect AI tester tìm mà bộ TC không cover, so với chi phí.
