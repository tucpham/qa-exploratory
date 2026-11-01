# Glossary - qa-exploratory (ISTQB terminology)

Repo dùng thuật ngữ tiếng Anh theo ISTQB Glossary (CTFL v4.0) và Session-Based Test Management (SBTM). Phần giải thích bằng tiếng Việt.

| Term | Nghĩa trong repo | Nằm ở đâu |
|---|---|---|
| **Test basis** | Mọi tài liệu dùng để phân tích và thiết kế test: spec, user story, test case cũ, defect history, API spec | `projects/<project>/sources.md`, `project-profile.md` |
| **Business rule** (R1..Rn) | Quy định nghiệp vụ dạng testable, là căn cứ kết luận defect | `project-profile.md` |
| **Test oracle** | Nguồn để xác định expected result (business rule, ví dụ có đáp án) | `project-profile.md`, `test-data.md` |
| **Automated test oracle** | Script read-only kiểm business rule trên dữ liệu thật | `oracles/<project>.js` |
| **Test basis issue** | Inconsistency/defect trong test basis (spec vs code, check có ở đường này thiếu ở đường khác), phát hiện bằng static analysis lúc onboarding | `_onboarding/test-basis-issues.md` |
| **Test object / test object map** | App được test / bản đồ screen, form, field, button, role | `test-object-map.md` |
| **Business flow** | Luồng end-to-end nhiều screen, nhiều role | `business-flows.md` |
| **Test charter** | Mục tiêu của 1 exploratory test session (mission + area + test ideas + budget) | `charters/<run-id>.md` |
| **Test session / session budget** | 1 lần thực thi charter; budget = số browser action tối đa (mặc định 40), tương đương timebox trong SBTM | |
| **Test cycle** (test run) | 1 vòng: charter design -> exploratory testing -> defect triage | `reports/<run-id>/` |
| **Test technique** | Kỹ thuật sinh test idea: Boundary Value Analysis (BVA), Equivalence Partitioning (EP), Decision Table Testing, State Transition Testing, Error Guessing, Checklist-based Testing | skill `exploratory-testing` mục 3 |
| **Test heuristic** | Gợi ý kinh nghiệm để sinh test idea (vd "nút bị ẩn thì vào thẳng URL") | skill `exploratory-testing` mục 3 |
| **Session sheet** | Kết quả 1 test session theo SBTM: anomaly, Covered, Not testable, Open questions, Ideas not tried | `session-<tester>.md` |
| **Anomaly** | Điều bất thường exploratory tester quan sát được, chưa xác nhận là defect | `session-*.md` |
| **Defect report** | Báo cáo defect đã xác nhận | `defects.md` |
| **Defect triage** | Phân loại mọi anomaly | `triage.md` |
| **Confirmed / Rejected / Duplicate / Needs clarification** | Kết luận triage: là defect / không phải defect / trùng root cause với defect khác / tái hiện được nhưng test basis không có rule rõ | `triage.md` |
| **Severity / Priority** | Mức ảnh hưởng / mức ưu tiên sửa | `defects.md` |
| **Test coverage** | Những gì đã test (cả pass) | `coverage.md` |
| **Known issues** | Known defect và deviation đã được chấp nhận, agent không báo lại | `known-issues.md` |
| **Product risk / risk-based testing** | Vùng dễ có defect / ưu tiên test theo rủi ro | `project-profile.md` |
| **Test data / baseline test data** | Dữ liệu dùng cho test / dữ liệu seed có sẵn | `test-data.md` |
| **Test data namespace** | Prefix dữ liệu tự tạo theo agent (`QA-<run>-tester-1-`, `QA-<run>-triager-`) | |
| **Test environment** | Staging + test account + test double | `project-profile.md` |
| **Test double (stub, simulator, service virtualization)** | Giả lập external dependency để test lỗi/timeout | `external-dependencies.md` |
| **Test harness** | Hạ tầng chạy test: browser daemon, mcp-call, oracle runner | `tools/`, `oracles/run.js` |
| **Confirmation testing** | Re-test defect sau khi fix | |
| **Regression testing** | Test lại vùng không đổi để chắc không bị ảnh hưởng | |
| **Smoke test** | Test cycle nhỏ để kiểm profile/environment dùng được | |
| **Fit assessment** | Đánh giá Go / Go with limits / No-go trước khi nhận dự án | `_onboarding/fit-assessment.md` |
| **Generic oracle** | Oracle không cần business rule: HTTP 5xx, console error, NaN/undefined, i18n key, mojibake... | `oracles/generic.js`, skill mục 6.2 |
| **Consistency oracle** | Oracle khi sản phẩm tự mâu thuẫn: cùng dữ liệu khác nhau giữa các nơi hiển thị / các con đường, thông báo khác sự thật, mất hoặc nhân bản dữ liệu ngoài ý muốn. Cần bằng chứng cả hai phía | skill mục 6.3 |
| **Developer assumption** | Điều happy path ngầm giả định (đi đúng thứ tự, làm 1 lần, không bị ngắt, 1 người 1 tab, thấy gì xử lý nấy...). Phá giả định là cách chính để sinh test idea | skill mục 2.1-2.2, charter |
| **Tour / persona** | Cách tổ chức freestyle session theo một "vai" (money, saboteur, obsessive, back-alley, all-nighter, antisocial; người dùng vội, power user...) | skill mục 2.3, 3 |
| **Freestyle charter** | Charter mission rộng theo 1 vùng rủi ro + tour/persona, oracle vẫn là rule + consistency | `charters/<run-id>.md` |
| **Session notes** | Model, giả định, ý tưởng đã thử / chưa thử, chuỗi bước chính xác của từng anomaly (SBTM session sheet) | `reports/<run-id>/notes-<agent>.md` |
| **Off-charter** | Phần budget (~20%) tester dùng cho rủi ro phát hiện trên đường đi, ngoài mission | skill mục 2.7 |
| **File oracle** | Kiểm file download/export: encoding, header, số dòng, giá trị, tổng, PDF text, CSV injection | `oracles/files.js` |
| **Fixture (test data setup)** | Script dựng precondition (record ở state bất kỳ) không qua UI | `fixtures/<project>.js` |
| **Observation probe** | Script read-only quan sát kết quả ngoài UI (mailbox, API hệ thống khác, job) có polling + timeout | `probes/` |
| **Test file library** | Bộ file biến thể (encoding, BVA, EP, format) sinh từ file spec | `tools/gen-test-files.js`, `fixtures/files/` |
| **Flow charter** | Charter theo 1 business flow nhiều screen/role, có bước tấn công | `charters/<run-id>.md` |
| **Fault injection** | Giả lập lỗi dependency (500, timeout, offline) bằng `browser_route` / `browser_network_state_set` | skill mục 3 |
| **Intermittent** | Defect reproduce k/n lần | `triage.md` |
| **Regression checklist** | Confirmation test cho từng defect, chạy lại ở cycle sau | `regression.md` |
| **Storage state** | Phiên đăng nhập đã lưu của 1 role | `.auth/<project>/<role>.storage-state.json` |
| **Test log** | Ghi chép từng action và kết quả | `reports/usage.jsonl`, trace |

## Agent roles
| Agent | ISTQB role / hoạt động |
|---|---|
| `test-basis-analyst` | Test Basis Analyst: test analysis + static analysis test basis |
| `charter-designer` | Test Analyst: risk-based test charter design |
| `exploratory-tester` | Exploratory Tester: thực thi test session |
| `defect-triager` | Defect Triage: reproduce, đối chiếu oracle, viết defect report |

## Quy ước đặt tên (từ "bot" sang exploratory testing)
Repo không mô tả một "bot chạy tự động" mà là **quy trình exploratory testing (SBTM)** trong đó các agent đóng từng vai trò, QA/BA giữ quyền duyệt rule và chấp nhận defect. Tên thành phần đặt theo hoạt động test:

| Trước | Hiện tại | Lý do |
|---|---|---|
| repo `dtvn-qa-bot` | `qa-exploratory` | Tên theo loại test, không theo công cụ |
| skill `adhoc-qa` | `exploratory-testing` | Ad hoc testing (ISTQB) là test không có charter/kỹ thuật; repo làm exploratory testing có charter, technique, oracle |
| `qa-onboarder` | `test-basis-analyst` | Hoạt động: test analysis trên test basis |
| `qa-planner` | `charter-designer` | Hoạt động: test charter design (SBTM) |
| `qa-explorer`, instance `explorer-N` | `exploratory-tester`, instance `tester-N` | Vai trò người thực thi test session |
| `qa-verifier`, instance `verifier` | `defect-triager`, instance `triager` | Hoạt động: defect triage |
| `suspects-<agent>.md` | `session-<tester>.md` (session sheet) | Mỗi session có kết quả đầy đủ, không chỉ danh sách nghi vấn |
| `bugs.md` | `defects.md` | Thuật ngữ ISTQB là defect |
| Step runner `planner / explorers / verifier` | `design / sessions / triage` | Theo các pha của test cycle |
| Namespace `QA-E1-`, `QA-V-` | `QA-<run>-tester-N-`, `QA-<run>-triager-` | Theo cycle và vai trò |

Dữ liệu lịch sử của `reports/run-001`, `projects/miniacc/charters/run-001.md` và `reports/usage.jsonl` giữ nguyên tên cũ (`explorer-1`, `QA-E1-...`) vì đó là bản ghi của lần chạy và tên record thật trong app.
