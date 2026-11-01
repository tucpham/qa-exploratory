# Project profile - miniacc-onboard (BẢN NHÁP do test-basis-analyst sinh, chưa được QA/BA duyệt)

Test basis: source code (chỉ đọc) + 1 bảng testcase VAT. KHÔNG có spec, defect history, changelog. Chi tiết: `_onboarding/inventory.md`, `_onboarding/business-rules-draft.md`, `_onboarding/test-basis-issues.md`.

## Test environment
- URL: http://localhost:4100 (chưa truy cập lúc onboarding)
- Allowed origin(s): http://localhost:4100
- Auth: form login (Tên đăng nhập + Mật khẩu), session cookie `sid`, không MFA. Test account: `test-data.md`.
- Read-only API/DB cho automated test oracle: GET /api/invoices (JSON, cần cookie đăng nhập); GET /report?month=YYYY-MM (HTML, dùng cho R14 - cần QA xác nhận được phép). Oracle: `node oracles/run.js miniacc-onboard`.
- Data reset: dữ liệu in-memory; restart server => về baseline 8 hoá đơn. Chưa có script reset riêng.

## Purpose of the system
MiniAcc: ứng dụng quản lý hoá đơn bán hàng nhỏ. Nhân viên lập hoá đơn (form hoặc nhập CSV), Kế toán trưởng duyệt; báo cáo doanh thu tháng từ hoá đơn đã duyệt; kỳ kế toán có thể bị khoá sổ.

## Roles
| Role | Permissions (theo UI hiện tại, chưa có spec xác nhận) |
|---|---|
| Nhân viên (staff) | Xem danh sách/chi tiết, tạo, sửa hoá đơn Chờ duyệt, nhập CSV, xem báo cáo, xem kỳ kế toán. Không thấy nút Duyệt |
| Kế toán trưởng (manager) | Như Nhân viên + Duyệt hoá đơn Chờ duyệt |

## Terms (domain glossary)
- Tiền hàng: giá trị trước thuế (VNĐ). Thuế suất: % VAT. Tiền VAT: tiền thuế. Tổng thanh toán: Tiền hàng + Tiền VAT.
- Chờ duyệt / Đã duyệt: hai trạng thái hoá đơn.
- Kỳ kế toán: tháng (YYYY-MM). Khoá sổ: kỳ không còn được ghi nhận hoá đơn mới.
- Số tiền hiển thị theo định dạng vi-VN: dấu chấm phân cách hàng nghìn (1.234.561).

## Business rules (test oracle) - mỗi defect phải trích ít nhất 1 rule
- **R1** Tiền VAT = Tiền hàng x Thuế suất / 100, làm tròn đến đồng theo "0,5 làm tròn lên" (round half up): phần lẻ < 0,5 bỏ, >= 0,5 lên 1 đồng. Áp dụng mọi đường lưu hoá đơn (tạo, sửa, nhập CSV). Ví dụ: 10.000.000 @10% => 1.000.000; 1.234.561 @10% => 123.456; 1.234.565 @10% => 123.457; 2.500.000 @8% => 200.000. (Medium, TC-VAT-4..7; automated)
- **R2** Tổng thanh toán = Tiền hàng + Tiền VAT. Ví dụ: 1.234.561 + 123.456 = 1.358.017; 1.234.565 + 123.457 = 1.358.022. (Medium, TC-VAT-4..7; automated)

## Pending confirmation (chưa được QA/BA duyệt, KHÔNG dùng để kết luận defect)
Các rule dưới đây mô tả hành vi suy ra từ test object; anomaly vi phạm chúng triage là `Needs clarification` cho tới khi được duyệt. Chi tiết điều kiện/ví dụ: `_onboarding/business-rules-draft.md`.
- **R3** Số hoá đơn, Khách hàng, Ngày bắt buộc (khoảng trắng đầu/cuối bị bỏ).
- **R4** Tiền hàng, Thuế suất phải là số hợp lệ.
- **R5** Tiền hàng > 0 (hiện chỉ Nhập CSV kiểm).
- **R6** Thuế suất chỉ 0/5/8/10% (hiện chỉ Nhập CSV kiểm).
- **R7** Số hoá đơn duy nhất (hiện chỉ Nhập CSV kiểm).
- **R8** Không tạo hoá đơn có ngày thuộc kỳ khoá sổ (2026-09). Phạm vi với Sửa/Duyệt chưa rõ.
- **R9** Hoá đơn Đã duyệt không sửa được.
- **R10** Chỉ Kế toán trưởng được duyệt.
- **R11** Chỉ hoá đơn Chờ duyệt mới duyệt được.
- **R12** Hoá đơn mới: Chờ duyệt, Người tạo = user đăng nhập, chưa có Người duyệt.
- **R13** Duyệt => Đã duyệt, Người duyệt = người duyệt; trạng thái và Người duyệt luôn nhất quán.
- **R14** Footer "Tổng doanh thu tháng" = tổng Tổng thanh toán của các hoá đơn Đã duyệt trong tháng (đúng bằng tổng các dòng hiển thị). Baseline: 2026-09 = 22.380.000; 2026-10 = 43.036.000.
- **R15** Lọc danh sách: Từ ngày bao gồm; Đến ngày bao gồm hay không chưa chốt.
- **R16** Đăng nhập sai => "Sai tên đăng nhập hoặc mật khẩu".
- **R17** Mọi trang yêu cầu đăng nhập.
- **R18** Đăng xuất kết thúc phiên (phiên cũ không dùng lại được).
- **R19** Nhập CSV: bỏ dòng tiêu đề, nhập từng phần, báo lỗi "Dòng N: lý do" đúng số dòng.
- **R20** Ngày hoá đơn đúng định dạng YYYY-MM-DD và là ngày có thật.
- **R21** Chi tiết hoá đơn hiển thị đủ các field, số tiền khớp API.
- Câu hỏi mở (chưa thành rule): tự duyệt hoá đơn của chính mình; ai được sửa hoá đơn; duyệt hoá đơn thuộc kỳ khoá; Tiền hàng có phải số nguyên.

## Product risks (risk-based testing, ưu tiên)
Không có defect history/changelog; xếp hạng từ test basis issue.
1. Tính VAT làm tròn (R1): TC-VAT-5 là ca phân biệt quy tắc làm tròn; thử thêm các số có phần lẻ < 0,5 ở cả tạo, sửa, CSV. (TBI-01)
2. Báo cáo doanh thu: footer so với tổng các dòng hiển thị, nhiều tháng, tháng có 0/1/nhiều hoá đơn. (TBI-02)
3. Validate không đồng nhất giữa các đường nhập (Tạo vs Sửa vs Nhập CSV): trùng Số HĐ, thuế suất, tiền <= 0, kỳ khoá, định dạng ngày, định dạng số. Heuristic: một check có ở CSV thì thử cùng giá trị ở Tạo và Sửa, và ngược lại. (TBI-03..06, TBI-09, TBI-10)
4. Phân quyền duyệt: nút ẩn với Nhân viên => vào thẳng URL duyệt. (TBI-07, TBI-08)
5. Kỳ khoá sổ qua đường Sửa và Duyệt. (TBI-06)
6. Nhập CSV: định dạng số kiểu VN, dấu phẩy trong tên, dòng trống, thuế trống. (TBI-09, TBI-13, TBI-14)
7. Ngày nhập tự do được hiển thị lại trên danh sách/chi tiết/báo cáo (định dạng, ký tự HTML). (TBI-10)
8. Phiên sau đăng xuất. (TBI-12)
9. Lọc theo khoảng ngày (biên "Đến ngày"). (TBI-11)

## Business flows (chi tiết: business-flows.md)
| Flow | Steps / roles | Setup bằng API/fixture được không |
|---|---|---|
| F1 Lập -> duyệt -> báo cáo | staff tạo, manager duyệt, xem báo cáo | Được: HTTP POST form tạo hoá đơn, URL duyệt |
| F2 Nhập CSV -> duyệt -> báo cáo | staff nhập CSV, manager duyệt | Được: dán CSV / POST /import |
| F3 Sửa chờ duyệt -> duyệt | staff sửa, manager duyệt | Được (POST form) |
| F4 Khoá sổ kỳ | mọi role | Không đổi được kỳ khoá (cố định 2026-09) |
| F5 Phân quyền theo role | staff vs manager | Đăng nhập 2 account |

## External dependencies (chi tiết: external-dependencies.md)
| Dependency | Trên test env | Cách quan sát | Test double |
|---|---|---|---|
| Lưu trữ in-memory (hoá đơn, session) | Real | GET /api/invoices | Không cần; restart = reset |
| Không có email/payment/SSO/job | - | - | - |

## File artifacts (chi tiết: file-artifacts.md)
| Upload/Download | Format, encoding | Phải khớp với |
|---|---|---|
| Nhập CSV (dán text vào /import) | CSV phân tách dấu phẩy, dòng tiêu đề, 5 cột, UTF-8 qua form | Danh sách hoá đơn, GET /api/invoices, VAT theo R1 |
| Download/export | Không có | - |

## Time & non-determinism
- Timezone của server / hiển thị: ngày lưu dạng chuỗi YYYY-MM-DD, không có giờ, không đổi timezone.
- Rule phụ thuộc ngày giờ: kỳ khoá sổ 2026-09 cố định (không theo ngày hiện tại); Báo cáo mặc định tháng 2026-10 (cố định, không theo tháng hiện tại); tháng 2026-11 trở đi không hiện trên trang Kỳ kế toán.
- Xử lý bất đồng bộ (job, queue) và thời gian chờ tối đa: không có; mọi thao tác đồng bộ.
- Dữ liệu dùng chung: mọi agent cùng một kho in-memory; dùng test data namespace (QA-<run>-tester-N-, QA-<run>-triager-). Duyệt/sửa hoá đơn baseline sẽ làm thay đổi đáp án báo cáo.

## Out of scope
- Performance, load; pentest chuyên sâu (chỉ kiểm hiển thị dữ liệu nhập và phân quyền ở mức chức năng); trình duyệt di động.

## Forbidden actions
- Không đăng xuất tài khoản agent khác, không đổi mật khẩu (sources.md).
- Không duyệt/sửa hoá đơn baseline HD-0901..HD-1005 trừ khi charter yêu cầu rõ; ưu tiên tạo hoá đơn QA riêng.
- Chỉ dùng payload HTML vô hại khi thử hiển thị dữ liệu nhập (vd thẻ in đậm), không chạy script.
