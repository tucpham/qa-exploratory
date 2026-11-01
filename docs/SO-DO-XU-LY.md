# Sơ đồ xử lý - qa-exploratory (exploratory testing)

Tài liệu mô tả **các agent thực hiện exploratory testing như thế nào**, **dựa vào quy định và cơ chế nào để tìm defect mới**, và **cách tự động onboarding một dự án mới**.

- Thuật ngữ theo ISTQB, xem `docs/GLOSSARY.md`.
- Điểm yếu và roadmap: `docs/GAPS-AND-ROADMAP.md`.
- Sơ đồ viết bằng Mermaid: xem trên GitHub/GitLab, VS Code (Markdown Preview Mermaid) hoặc https://mermaid.live.

---

## 0. Thuật ngữ chính

| Term (ISTQB) | Nghĩa ngắn | Trong repo |
|---|---|---|
| Test basis | Spec, TC cũ, defect history... dùng để thiết kế test | `sources.md`, `project-profile.md` |
| Business rule (R1..Rn) | Quy định nghiệp vụ testable, căn cứ kết luận defect | `project-profile.md` |
| Test oracle / Automated test oracle | Nguồn expected result / script read-only kiểm rule trên dữ liệu | `oracles/<project>.js` |
| Test charter | Mục tiêu của 1 exploratory test session | `charters/<run-id>.md` |
| Session budget | Số browser action tối đa / charter (mặc định 40) | |
| Test technique / test heuristic | Kỹ thuật sinh test idea (BVA, EP, State Transition, Error Guessing...) | skill mục 3 |
| Anomaly | Bất thường quan sát được, chưa xác nhận | `session-*.md` |
| Defect triage | Phân loại anomaly: Confirmed / Rejected / Duplicate / Needs clarification | `triage.md` |
| Defect report | Defect đã confirmed | `defects.md` |
| Test coverage / Known issues | Đã test gì / deviation đã được chấp nhận | `coverage.md`, `known-issues.md` |
| Test basis issue | Inconsistency trong test basis tìm ra lúc onboarding | `_onboarding/test-basis-issues.md` |
| Test data namespace | Prefix dữ liệu tự tạo (`QA-<run>-tester-1-`, `QA-<run>-triager-`) | |

Agent: `test-basis-analyst` (Test Basis Analyst), `charter-designer` (Test Analyst), `exploratory-tester` (Exploratory Tester), `defect-triager` (Defect Triage).

---

## 1. Kiến trúc tổng thể

Hệ thống = **instruction (skill + agent) + Playwright MCP (browser automation) + automated test oracle**.

```mermaid
flowchart LR
    subgraph TB["projects/&lt;project&gt;/ - Test basis"]
        P["project-profile.md<br/>roles, business rules R1..Rn,<br/>product risks, forbidden actions"]
        TD["test-data.md<br/>test accounts, examples with expected results"]
        CV["coverage.md"]
        KI["known-issues.md"]
        CL["changelog, test-object-map.md,<br/>business-flows.md"]
    end

    SK["Skill exploratory-testing<br/>safety, session loop,<br/>test techniques, defect report format"]

    subgraph AG["Agents"]
        ON["test-basis-analyst<br/>Test Basis Analyst<br/>(1 lần / dự án)"]
        PL["charter-designer<br/>Test Analyst<br/>3-6 test charters"]
        EX["exploratory-tester x N<br/>Exploratory Tester"]
        VE["defect-triager<br/>Defect Triage"]
    end

    subgraph RT["Test harness"]
        MCP["Playwright MCP<br/>1 browser / agent"]
        OR["Automated test oracle<br/>read-only API/DB"]
        APP[("Test object<br/>(staging)")]
    end

    subgraph OUT["Outputs"]
        CH["Test charters"]
        SU["Anomalies"]
        TR["Triage"]
        BU["Defect reports"]
    end

    ON --> TB
    TB --> PL
    SK --> EX
    SK --> VE
    PL --> CH --> EX
    TB --> EX
    EX <--> MCP <--> APP
    EX --> SU --> VE
    VE <--> MCP
    VE --> OR --> APP
    KI --> VE
    VE --> TR
    VE --> BU
    VE -->|"update"| CV
```

---

## 2. Một test cycle

```mermaid
sequenceDiagram
    autonumber
    actor QA as QA (human)
    participant PL as charter-designer
    participant E1 as exploratory-tester 1
    participant E2 as exploratory-tester 2
    participant VE as defect-triager
    participant APP as Test object
    participant OR as Automated oracle

    QA->>PL: Thiết kế test charter cho run-00X
    PL->>PL: Đọc profile, test data, coverage, known issues, changelog, test basis issues
    PL-->>QA: charters/run-00X.md (C1..C6 + phân nhóm)

    par Test session song song, mỗi agent 1 browser + 1 namespace
        E1->>APP: Nhóm A (QA-{run}-tester-1-...)
        E1-->>E1: session-tester-1.md
    and
        E2->>APP: Nhóm B (QA-{run}-tester-2-...)
        E2-->>E2: session-tester-2.md
    end

    VE->>VE: Đọc mọi anomaly + known issues
    loop Mỗi anomaly
        VE->>APP: Reproduce từ đầu, data mới (QA-{run}-triager-...), 2 lần
        VE->>OR: node oracles/run.js <project>
        OR->>APP: Read API / report
        OR-->>VE: violations (rule, record, detail)
        VE->>VE: Confirmed / Rejected / Duplicate / Needs clarification
    end
    VE-->>QA: defects.md + triage.md + update coverage.md
    QA->>QA: Trả lời Needs clarification -> thêm business rule, cập nhật known issues
```

---

## 3. charter-designer - risk-based test charter design

```mermaid
flowchart TD
    A["Đọc test basis"] --> T{"Có test-basis-issues.md?"}
    T -->|Có| C0["Ưu tiên 0: test basis issue chưa test"]
    T -->|Không| B
    C0 --> B{"Có changelog?"}
    B -->|Có| C1["Ưu tiên 1: module vừa đổi code"]
    B -->|Không| C2
    C1 --> C2["Ưu tiên 2: product risks trong profile"]
    C2 --> C3["Ưu tiên 3: vùng chưa có trong coverage.md"]
    C3 --> D["Phủ đủ test technique:<br/>BVA/EP, authorization, state transition,<br/>data consistency, file import, filter"]
    D --> E["Mỗi charter: 1 mission hẹp gắn 1-3 rule,<br/>role, câu hỏi cần trả lời,<br/>3-6 test idea, session budget 40"]
    E --> F["Phân nhóm cho tester,<br/>ghi rõ phụ thuộc dữ liệu giữa các nhóm"]
```

Charter tốt: *"Tấn công làm tròn VAT khi tạo/sửa hoá đơn (R1, R3)"*. Charter tệ: *"Test module hoá đơn"*.

---

## 4. exploratory-tester - vòng lặp của test session

```mermaid
flowchart TD
    S0["Đọc profile, test data, test object map,<br/>coverage, known issues, charter"] --> S1
    S1["1. EXPLORE<br/>input, button, state, role trên screen"] --> S2
    S2["2. HYPOTHESIS<br/>'Rule nào áp ở đây, làm sao để phá?'"] --> S3
    S3["3. ATTACK<br/>1 biến thể / lần, ghi input chính xác"] --> S4
    S4{"4. CHECK ORACLE<br/>khớp rule / expected result?"}
    S4 -->|Pass| OK["Ghi vào 'Covered' (cả pass)"]
    S4 -->|"Fail, có rule"| S5["5. QUICK RE-RUN từ đầu<br/>loại lỗi thao tác"]
    S4 -->|"Lạ, không có rule"| Q["Open question cho team<br/>KHÔNG kết luận defect"]
    S5 -->|"Reproduced"| S6["6. Ghi anomaly theo format:<br/>rule, steps, input, expected,<br/>actual (trích nguyên văn), evidence"]
    S5 -->|"Không reproduce"| OK
    OK --> B{"Còn session budget?"}
    S6 --> B
    Q --> B
    B -->|Còn| S1
    B -->|Hết| END["session-&lt;agent&gt;.md<br/>+ Covered + Open questions"]
```

Khác scripted testing: không chạy test case cố định. Kết quả lần attack trước quyết định lần sau, nên đi vào các luồng chưa có TC.

---

## 5. Test techniques & heuristics

```mermaid
mindmap
  root((Test ideas))
    BVA / EP
      0, âm, rất lớn
      Phần lẻ sau khi nhân %
      Rỗng, chỉ khoảng trắng
      Ký tự đặc biệt, có dấu, full-width
    Format
      Đầu/cuối tháng, cuối năm
      1.000.000 vs 1,000,000
      dd/mm/yyyy, yyyy-m-d, ngày không tồn tại
    State Transition
      Sửa/xoá/duyệt ở mọi state
      Lặp action: duyệt 2 lần, double submit
      Form cũ ở tab khác
    Decision Table - Authorization
      Nút ẩn thì vào thẳng URL
      Người tạo tự duyệt
    Time / Period
      Tạo/sửa trong kỳ khoá
      Dời ngày vào/ra kỳ khoá
    Data consistency
      List = detail = report = export
      Tổng = cộng các dòng
    Filter
      2 đầu mút
      Từ > Đến, 1 đầu, rỗng
    File import
      Trùng, thiếu cột
      Ngoặc kép, BOM, dòng trống
      Định dạng số/ngày khác
    Error Guessing
      HTTP 500, console error
      NaN / undefined / null
      Mất dữ liệu sau refresh
```

**Công thức tìm defect mới = Business rule × Test technique × Input channel.** Mỗi rule được attack qua *mọi đường dữ liệu vào* (create form, edit form, direct URL, file import, API), với *mọi technique*. Defect hay nằm ở đường mà dev quên áp cùng một check.

---

## 6. defect-triager - defect triage

```mermaid
flowchart TD
    A["Anomaly"] --> B{"Trùng known-issues.md?"}
    B -->|Có| R1["Skip (ghi lý do)"]
    B -->|Không| C["Reproduce từ đầu trên browser riêng,<br/>data mới QA-{run}-triager-, không tin kết quả tester"]
    C --> D{"Reproduced 2/2?"}
    D -->|Không| REJ["REJECTED"]
    D -->|Có| E{"Rule có trong profile<br/>và bị vi phạm thật?"}
    E -->|"Đúng theo rule"| REJ
    E -->|"Không có rule rõ"| QUE["NEEDS CLARIFICATION"]
    E -->|Có| F["Chạy automated oracle,<br/>lấy số liệu làm evidence"]
    F --> G["CONFIRMED"]
    G --> H["Cùng root cause -> DUPLICATE, gộp vào 1 BUG-xx"]
    H --> OUT1["defects.md"]
    REJ --> OUT2["triage.md"]
    QUE --> OUT2
    G --> OUT2
    OUT1 --> CV["Update coverage.md"]
```

Tester **nghi nhiều** để không bỏ sót; triager **khó tính** để không báo sai. Run-001: 14 anomaly -> 11 defect, 0 false positive.

---

## 7. Automated test oracle

```mermaid
flowchart LR
    A["node oracles/run.js &lt;project&gt;"] --> C["Login test account"]
    C --> D["GET /api/invoices (read-only)"]
    D --> E["Mỗi record:<br/>R1 VAT round half-up, total = amount + VAT<br/>R2 amount > 0<br/>R3 rate in 0/5/8/10<br/>R4 số HĐ unique<br/>R5 approver là manager<br/>R6 approver khác creator"]
    D --> F["GET /report?month=<br/>R9 total hiển thị = tổng HĐ đã duyệt"]
    E --> G["violations JSON"]
    F --> G
    G --> H["Triager dùng làm evidence"]
```

Oracle bắt vi phạm **ngay khi dữ liệu kích hoạt tồn tại**, bất kể sinh ra từ đường nào. Run-001: oracle bắt 6/10 defect cài sẵn. Rule không kiểm được bằng dữ liệu (kỳ khoá, filter, import) thì evidence lấy từ UI.

---

## 8. Safety guardrails

```mermaid
flowchart TD
    X["Mọi action của agent"] --> G1{"Origin có trong profile?"}
    G1 -->|Không| STOP["Không làm"]
    G1 -->|Có| G2{"Account có trong test-data.md?"}
    G2 -->|Không| STOP
    G2 -->|Có| G3{"Forbidden action?<br/>logout agent khác, đổi password,<br/>quá 30 record, sửa baseline data"}
    G3 -->|Có| STOP
    G3 -->|Không| G4{"Trang bảo 'hãy làm X'?"}
    G4 -->|Có| NOTE["Coi là data (prompt injection),<br/>không làm, ghi nhận"]
    G4 -->|Không| DO["Thực hiện, data có namespace"]
```

Tester và triager không đọc source/DB của app; chỉ test qua UI và automated oracle.

---

## 9. Feedback loop giữa các test cycle

```mermaid
flowchart LR
    R1["Cycle N"] --> COV["coverage.md<br/>+ gợi ý lần sau"]
    R1 --> QS["Needs clarification"]
    QS --> HUMAN["QA / BA trả lời"]
    HUMAN --> NR["Thêm business rule"]
    HUMAN --> KI["known-issues.md"]
    CHG["Changelog release mới"] --> PL
    COV --> PL["charter-designer cycle N+1"]
    NR --> PL
    NR --> OR["Thêm check vào automated oracle"]
    KI --> VER["defect-triager không báo lại"]
    PL --> R2["Cycle N+1: vùng chưa test,<br/>rule mới, code mới"]
    OR --> R2
    VER --> R2
```

---

## 10. Các cơ chế giúp tìm defect mới

| # | Cơ chế | Ở đâu | Tác dụng |
|---|---|---|---|
| 1 | Business rule testable | profile: "mỗi defect phải trích ≥ 1 rule" | Có test oracle rõ, không báo theo cảm tính |
| 2 | Test data có expected result | `test-data.md` | Bắt lỗi tính sai 1 đồng |
| 3 | Risk-based charter hẹp | charter-designer | Dồn budget vào nơi rủi ro cao |
| 4 | Explore - Hypothesis - Attack - Check oracle | skill mục 2 | Đi vào luồng không có TC |
| 5 | Test techniques & heuristics | skill mục 3 | Sinh biến thể có hệ thống |
| 6 | Rule × mọi input channel | test idea trong charter | Lộ check thiếu ở 1 đường (BUG-03, BUG-04) |
| 7 | Automated test oracle | `oracles/<project>.js` | Quét toàn bộ dữ liệu |
| 8 | Tester nghi nhiều, triager khó tính | 2 agent tách biệt | Recall cao + precision cao |
| 9 | Reproduce 2/2 với data mới | defect-triager | Loại lỗi thao tác, nhiễu từ agent khác |
| 10 | Không có rule => Needs clarification | skill mục 4 | Không báo bừa, giữ phát hiện để thành rule mới |
| 11 | Coverage + known issues | `coverage.md`, `known-issues.md` | Cycle sau chuyển sang vùng mới |
| 12 | Parallel sessions có cô lập | 1 browser + 1 namespace / agent | Nhiều charter cùng lúc, không nhiễu |
| 13 | Test basis issues (static analysis) | test-basis-analyst | Nhắm thẳng vào chỗ spec/code/TC mâu thuẫn |

Run-001 (MiniAcc, 10 defect cài sẵn): tìm 10/10, thêm **2 defect thật không ai cài**:
- **BUG-10**: CSV import không kiểm format ngày, "20/09/2026" lách được kỳ khoá sổ. Kết hợp *format* × *R7* × *CSV channel*.
- **E2-09** (Needs clarification): CSV có dấu phẩy trong ngoặc kép bị tách sai; profile chưa có rule nên không kết luận defect.

---

## 11. Automated onboarding cho dự án mới (test-basis-analyst)

QA chỉ khai báo nguồn trong `projects/<project>/sources.md` (template: `projects/_template/`). Agent phân tích test basis, sinh **bản nháp**, QA/BA review.

```mermaid
flowchart TD
    subgraph SRC["Sources (sources.md)"]
        S1["Spec / user story / design<br/>(docx, pdf, xlsx; VN/JP)"]
        S2["Test cases đã chạy nhiều cycle + test log"]
        S3["Defect history"]
        S4["API spec, DB schema"]
        S5["Source code (read-only)"]
        S6["Staging (view only)"]
        S7["Changelog"]
    end

    SRC --> N["1. Inventory + convert sang text"]
    N --> X1["2a. Spec: phải / không được / chỉ / 必須 / 以上..."]
    N --> X2["2b. TC: Expected result -> rule;<br/>input/expected -> test data;<br/>TC flaky/fail -> product risk"]
    N --> X3["2c. Defect: product risk, regression rule,<br/>Won't fix -> known issues"]
    N --> X4["2d. API/schema: required, enum, unique, state"]
    N --> X5["2e. Source: validation, authorization,<br/>công thức, routes; so sánh MỌI input channel"]
    N --> X6["3-6. Business flows, external dependencies,<br/>file artifacts, time/non-determinism"]

    X1 --> M["7. Cross-check + confidence"]
    X2 --> M
    X3 --> M
    X4 --> M
    X5 --> M
    M --> H1["High: 2 nguồn độc lập"]
    M --> H2["Medium: 1 nguồn spec/TC"]
    M --> H3["Needs confirmation: chỉ code/schema"]
    M --> H4["Inconsistency"]
    H4 --> MT["test-basis-issues.md<br/>= target cho cycle đầu"]

    H1 --> D["8-9. Draft outputs"]
    H2 --> D
    H3 --> D
    X6 --> D
    D --> O1["business-rules-draft.md"]
    D --> O2["test-data.md, test-object-map.md"]
    D --> O3["business-flows.md, external-dependencies.md,<br/>file-artifacts.md"]
    D --> O4["oracles/&lt;project&gt;.js + self-check"]
    O1 --> HU{"QA/BA review<br/>(Approved [x])"}
    MT --> HU
    HU -->|Approved| PF["project-profile.md"]
    HU -->|Sửa| O1
    PF --> SM["Smoke test cycle (budget nhỏ)"]
    SM --> RUN["Test cycle bình thường"]
```

### Ba nguyên tắc
1. **Source code là test object, không phải test oracle.** Rút rule từ code thì defect trong code thành "expected". Ví dụ code dùng `Math.ceil` cho VAT => rule sai "VAT làm tròn lên" => BUG-01 không bao giờ bị phát hiện. Rule chỉ từ code luôn là `Needs confirmation`.
2. **Dùng source để tìm inconsistency**: create kiểm kỳ khoá mà edit không (BUG-03), button kiểm quyền mà URL không (BUG-04), form kiểm ngày mà CSV không (BUG-10).
3. **Giữ blind testing**: chỉ test basis analyst đọc source; profile chỉ chứa rule dạng nghiệp vụ.

### Onboarding khác smoke test thế nào
- **Onboarding** là việc làm 1 lần cho mỗi dự án mới: agent đọc tài liệu, test case, defect history, source để soạn hồ sơ (business rules, test data, flows, dependencies, file specs) và config cho harness. Người duyệt kết quả.
- **Smoke test cycle** sau onboarding là 1 lần chạy nhỏ để kiểm hồ sơ và môi trường dùng được (đăng nhập, reset, crawl generic, 1-2 charter). Đây là bước bắt buộc của quy trình.
- Lần chạy agent onboarding trên MiniAcc trong repo (`projects/miniacc-onboard/`) là **kiểm thử chính agent onboarding** (app có đáp án sẵn nên đo được chất lượng), không phải bước khi onboarding dự án thật.

### Chạy
```
cp -r projects/_template projects/<project>      # điền sources.md
claude
> Dùng agent test-basis-analyst khởi tạo hồ sơ cho <project> theo projects/<project>/sources.md
# QA/BA review _onboarding/business-rules-draft.md và test-basis-issues.md
> Dùng charter-designer thiết kế charter run-001 cho <project>, ưu tiên test-basis-issues.md,
> rồi chạy exploratory-tester cho từng nhóm, cuối cùng defect-triager viết defect report.
```

---

## 12. Test harness cho nghiệp vụ phức tạp

```mermaid
flowchart LR
    subgraph RUN["tools/run-cycle.js"]
        R0["reset test data<br/>+ healthcheck"] --> R1["login-state<br/>storage state / role (MFA TOTP)"]
        R1 --> R2["generic oracle crawl<br/>(GET-only, deny-list)"]
        R2 --> R3["browser daemons<br/>1 cổng / agent / role"]
        R3 --> R4["charter designer -> testers // -> triager<br/>(claude -p --agent, tool allow-list)"]
        R4 --> R5["metrics + export CSV<br/>Jira / Backlog / Redmine"]
    end

    subgraph EXP["Trong 1 test session"]
        F["fixtures/run.js<br/>precondition không qua UI"] --> UI["Playwright MCP<br/>bước cần attack"]
        UI -->|"browser_route / offline"| FI["Fault injection<br/>500, timeout, body sai"]
        UI -->|"browser_set_storage_state<br/>hoặc cổng thứ 2"| MR["Đổi role / concurrency"]
        UI -->|"browser_file_upload"| UP["Test file library<br/>gen-test-files.js"]
        UI -->|"download"| DL["oracles/files.js<br/>CSV/XLSX/PDF vs expected"]
        UI --> PR["probes/run.js<br/>mail, http, job (polling + timeout)"]
        UI --> GO["generic oracle<br/>console, network, NaN..."]
    end
```

| Tình huống thực tế | Cách xử lý |
|---|---|
| Nghiệp vụ đi qua 7 màn hình, 3 role | Flow charter; fixture dựng state tới bước cần test; mỗi role 1 browser đã đăng nhập; flow state file để làm tiếp |
| Kết quả nằm ở email / hệ thống khác / batch | Probe read-only có polling, so với thời gian xử lý tối đa trong profile; không quan sát được thì Out of scope, không đoán |
| Hệ thống bên ngoài lỗi / chậm | `browser_route` trả 500/timeout cho request phía browser; server-side cần stub trên staging |
| Upload / import file | Test file library (encoding, BVA, EP, format, CSV injection) + đếm record thật sau import |
| Download / export | File oracle so file với API/màn hình cùng filter; kiểm encoding, tên file, tổng, PDF text |
| Không có spec rõ | Generic oracle + test basis issues + Needs clarification |
| SSO / MFA | Storage state theo role, TOTP từ `.env` |
| 2 người cùng sửa | Concurrency charter với 2 cổng browser |
