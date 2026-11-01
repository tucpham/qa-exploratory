# Business flows - miniacc-onboard (BẢN NHÁP, suy từ source; chưa có spec xác nhận)

State machine hoá đơn (server.js:21, :141): `(mới) -> Chờ duyệt -> Đã duyệt`. Không có trạng thái Huỷ/Từ chối, không có thao tác mở lại. Chờ duyệt: sửa được; Đã duyệt: không sửa được (R9).

Setup không qua UI: không có API ghi dạng JSON. Có thể setup bằng HTTP POST form (POST /login, POST /invoices, POST /import) hoặc dán CSV ở /import (nhanh nhất cho nhiều hoá đơn). Reset: restart server.

## F1 - Lập hoá đơn -> duyệt -> báo cáo doanh thu
| Bước | Role | Screen | State / dữ liệu chuyển | Setup thay UI |
|---|---|---|---|---|
| 1 | staff (staff1) | Tạo hoá đơn | Tạo => Chờ duyệt, Người tạo = staff1; VAT/Tổng tính (R1, R2) | POST /invoices hoặc CSV |
| 2 | staff | Chi tiết | Kiểm VAT, Tổng; không có nút Duyệt (R10) | - |
| 3 | manager (manager1) | Chi tiết -> Duyệt hoá đơn | Chờ duyệt -> Đã duyệt, Người duyệt = manager1 (R13) | GET /invoices/:id/approve |
| 4 | manager | Sửa hoá đơn | Bị chặn (R9) | - |
| 5 | bất kỳ | Báo cáo doanh thu tháng của ngày hoá đơn | Hoá đơn xuất hiện; footer tăng đúng bằng Tổng (R14) | - |
Precondition: ngày thuộc kỳ mở (2026-10). Rule: R1, R2, R3, R8, R9, R10, R12, R13, R14. Risk: TBI-01, TBI-02, TBI-07.

## F2 - Nhập CSV hàng loạt -> duyệt -> báo cáo
| Bước | Role | Screen | State / dữ liệu chuyển | Setup thay UI |
|---|---|---|---|---|
| 1 | staff | Nhập CSV | Dòng hợp lệ => Chờ duyệt; dòng lỗi báo "Dòng N" (R19) | POST /import |
| 2 | staff | Danh sách, lọc Chờ duyệt | Số hoá đơn tăng đúng K | - |
| 3 | manager | Duyệt từng hoá đơn | Đã duyệt | GET approve |
| 4 | bất kỳ | Báo cáo | Footer = Σ Tổng (R14) | - |
Rule: R1-R8, R12-R14, R19, R20. Risk: TBI-09, TBI-10, TBI-13, TBI-14. So sánh: cùng một dữ liệu nhập qua Form và CSV phải cho cùng kết quả (cùng chấp nhận/từ chối, cùng VAT).

## F3 - Sửa hoá đơn chờ duyệt rồi duyệt
| Bước | Role | Screen | State / dữ liệu chuyển |
|---|---|---|---|
| 1 | staff | Sửa hoá đơn Chờ duyệt (vd HD-1004 hoặc hoá đơn QA tự tạo) | Đổi Tiền hàng/Thuế => VAT/Tổng tính lại (R1, R2); đổi Số HĐ/Ngày => phải qua cùng validate như Tạo (TBI-03..06) |
| 2 | manager | Duyệt | Đã duyệt; sau đó không sửa được (R9) |
Risk: TBI-03, TBI-04, TBI-05, TBI-06, TBI-17 (ai được sửa).

## F4 - Khoá sổ kỳ kế toán
| Bước | Role | Screen | Kỳ vọng |
|---|---|---|---|
| 1 | bất kỳ | Kỳ kế toán | 2026-09 Đã khoá sổ |
| 2 | staff | Tạo / CSV với ngày 2026-09-xx | Bị từ chối (R8) |
| 3 | staff | Sửa hoá đơn kỳ mở đổi ngày sang 2026-09 / sửa HD-0903 | Chưa có rule rõ; code cho phép (TBI-06) |
| 4 | manager | Duyệt HD-0903 (kỳ khoá) | Chưa có rule rõ; code cho phép (câu hỏi BA) |
Không có UI khoá/mở kỳ => không test được thao tác khoá sổ; kỳ khoá cố định trong cấu hình.

## F5 - Phân quyền theo role (cross-cutting)
staff1 vs manager1 trên mọi screen: nút Duyệt (ẩn với staff), URL duyệt trực tiếp (TBI-07), sửa hoá đơn người khác (TBI-17), tự duyệt (TBI-17), đọc /api/invoices.
