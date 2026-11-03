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
| **Tour / persona** | Cách tổ chức freestyle session theo một "vai" (money, landmark, saboteur, obsessive, back-alley, all-nighter, antisocial; người mới, người vội, người cẩn thận, người cố tình phá, mạng yếu / máy cũ, admin vs user thường...) | skill mục 2.3, 3 |
| **Tư duy cốt lõi (core mindset)** | 8 nguyên tắc luôn bật: tò mò/hoài nghi, nhiều persona, rủi ro trước, dựng model, phá giả định, mỗi session một mục tiêu, đào sâu khi thấy bug, học từ bug cũ | skill `exploratory-testing`, phần Tư duy cốt lõi |
| **Mindset checkpoint** | Ghi đầu session: model, giả định của dev, persona, chiều SFDIPOT, thứ tự rủi ro, bug pattern đã đối chiếu | `notes-<agent>.md` |
| **SFDIPOT** | Heuristic quét chiều rủi ro: Structure, Function, Data, Interfaces, Platform, Operations, Time | skill mục 3 |
| **CRUD heuristic** | Đi hết vòng đời Create, Read, Update, Delete của mỗi đối tượng | skill mục 3 |
| **Goldilocks** | Thử quá ít / vừa / quá nhiều cho input, danh sách, file, số lần thao tác | skill mục 3 |
| **Interrupt** | Cắt ngang hành động ghi dữ liệu (refresh, back, đóng tab, mất mạng, API lỗi, hết phiên) rồi kiểm hậu quả | skill mục 3 |
| **Debrief (PROOF)** | Tổng kết cuối session: Past, Results, Obstacles, Outlook, Feelings | session sheet, skill 2.7 |
| **Bug pattern** | Bài học tổng quát rút từ defect (giả định bị phá, triệu chứng, nơi nên thử tiếp) | `projects/<project>/bug-patterns.md` |
| **Tested = Checked + Explored** | Checking (TC, automated oracle) xác nhận điều đã biết; exploring tìm phần lưới đó không phủ | skill, đầu file |
| **Variable inventory (kiểm kê biến)** | Liệt kê thứ có thể thay đổi: hiển nhiên (field), tinh tế (URL param, thứ tự, định dạng), gián tiếp (số record, state record khác, thời điểm) | skill 2.1 |
| **RCRCRC** | Chọn vùng test: Recent, Core, Risky, Configuration, Repaired, Chronic | skill Tư duy cốt lõi #3 |
| **COUNT / Some-None-All / Beginning-Middle-End** | Heuristic về số lượng, tập con và vị trí phần tử | skill mục 3 |
| **Never / Always** | Bất biến luôn phải giữ / không bao giờ được vi phạm (N1..Nn), chỉ dùng khi BA đã duyệt | profile, skill 6.1 |
| **State table (bảng state × event)** | Dạng bảng của state model; ô chưa rõ kết quả là ý tưởng test | skill 2.1, business-flows.md |
| **Pesticide paradox** | Lặp lại cùng cách test thì ngày càng ít tìm ra bug; chống bằng charter history + đổi persona/tour/heuristic | charter-history.md |
| **Nouns × Verbs** | Ghép ngẫu nhiên (có seed) đối tượng × hành động để phá đường đi quen thuộc | `tools/random-pairs.js` |
| **Recon charter** | Session vẽ bản đồ app thật (màn hình, entity, state, biến, dependency) trước khi tấn công | charter designer |
| **Smoke charter** | Session ngắn sau mỗi deploy: các vùng core + từng bản fix | charter designer |
| **Exploratory regression** | Kiểm bản fix rồi khám phá quanh nó, do tester khác người tìm ra bug | `confirmation` charter |
| **Stopping heuristics** | Dừng một hướng khi: hết câu hỏi, không học thêm, thông tin không dẫn tới hành động, có câu hỏi quan trọng hơn | skill Tư duy cốt lõi #9 |
| **Absence** | Thứ lẽ ra phải có mà không có (xác nhận, audit, validation ở kênh khác, field ở export) | skill 2.4 |
| **UX observation** | Tone / convention / friction / absence không có oracle: cho người review, không phải defect | skill 6.4 |
| **Bug taxonomy (Category)** | Input validation, Boundary, Calculation, Logic, Security, Usability, Compatibility, Syntax, Performance | defect report |
| **Nightmare Headline Game** | Tưởng tượng tiêu đề báo tồi tệ nhất rồi suy ngược ra charter | charter designer |
| **Trust boundary / What If?** | Chỗ app nhận dữ liệu từ nơi nó không kiểm soát; hỏi "nếu nó chậm/lỗi/sai thì sao" | external-dependencies.md |
| **Inattentional blindness** | Càng chú tâm vào thứ đang kiểm càng bỏ sót thứ bất ngờ; chống bằng đổi tiêu điểm có chủ đích | skill 2.4 |
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
