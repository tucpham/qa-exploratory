# Project profile - MiniAcc (quản lý hoá đơn bán hàng)

## Môi trường test
- URL: http://localhost:4100 (staging, dữ liệu giả)
- Origin được phép: http://localhost:4100 - không truy cập nơi khác
- API đọc dữ liệu (chỉ dành cho oracle script): GET /api/invoices

## Hệ thống dùng để làm gì
Bộ phận kế toán tạo hoá đơn bán hàng, Kế toán trưởng duyệt. Hoá đơn đã duyệt được tính vào báo cáo doanh thu tháng. Cuối tháng khoá sổ kỳ kế toán.

## Vai trò
| Vai trò | Được làm |
|---|---|
| Nhân viên (staff) | Tạo, sửa hoá đơn chờ duyệt, nhập CSV, xem báo cáo. KHÔNG được duyệt |
| Kế toán trưởng (manager) | Mọi quyền của nhân viên + duyệt hoá đơn |

## Thuật ngữ
- Tiền hàng: giá trị trước thuế. Tiền VAT = Tiền hàng x Thuế suất. Tổng thanh toán = Tiền hàng + Tiền VAT.
- Kỳ kế toán: theo tháng (YYYY-MM). Kỳ "Đã khoá sổ" là kỳ đã chốt số liệu.

## RULE nghiệp vụ (oracle) - mọi bug phải trích ít nhất 1 rule
- **R1** Tiền VAT làm tròn đến đồng gần nhất (0,5 trở lên làm tròn lên, dưới 0,5 làm tròn xuống). Tổng thanh toán = Tiền hàng + Tiền VAT.
- **R2** Tiền hàng phải > 0.
- **R3** Thuế suất VAT chỉ nhận 0%, 5%, 8%, 10%.
- **R4** Số hoá đơn là duy nhất trong toàn hệ thống.
- **R5** Chỉ Kế toán trưởng được duyệt hoá đơn, áp dụng cả khi gọi trực tiếp URL.
- **R6** Người tạo hoá đơn không được tự duyệt hoá đơn của chính mình (tách biệt nhiệm vụ).
- **R7** Kỳ đã khoá sổ: không được tạo, sửa hoá đơn có ngày thuộc kỳ đó, và không được đổi ngày hoá đơn vào kỳ đó.
- **R8** Hoá đơn đã duyệt không được sửa.
- **R9** Báo cáo doanh thu tháng: chỉ gồm hoá đơn đã duyệt của tháng đó; dòng Tổng = tổng cột Tổng thanh toán của các dòng.
- **R10** Bộ lọc ngày ở danh sách bao gồm cả ngày "Từ ngày" và ngày "Đến ngày".
- **R11** Nhập CSV: chấp nhận số tiền dạng 1000000 và dạng có dấu chấm phân cách hàng nghìn kiểu Việt Nam (1.000.000). Dòng lỗi phải báo rõ, không được lưu sai giá trị.
- **R12** Số liệu của 1 hoá đơn phải giống nhau ở danh sách, trang chi tiết và báo cáo.

## Vùng rủi ro cao (ưu tiên)
- Tính VAT và làm tròn (mới sửa ở release này)
- Duyệt hoá đơn và phân quyền
- Khoá sổ kỳ 2026-09
- Nhập CSV (tính năng mới)

## Vùng cấm
- Không đăng xuất tài khoản của agent khác, không đổi mật khẩu.
- Không tạo quá 30 hoá đơn mỗi agent mỗi lần chạy.
- Không sửa/duyệt các hoá đơn seed có mã HD-10xx, trừ khi charter yêu cầu; hãy tự tạo dữ liệu với prefix riêng. (Ngoại lệ: được phép thử trên HD-0903 để kiểm tra R7.)
