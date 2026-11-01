# File artifacts - miniacc-onboard (BẢN NHÁP)

## Upload / import
| Artifact | Cách đưa vào | Định dạng | Encoding | Cột | Giới hạn | Validate (hiện tại, server.js:147-160) | Phải khớp với |
|---|---|---|---|---|---|---|---|
| CSV hoá đơn | Dán text vào textarea ở /import (KHÔNG phải upload file) | Dòng đầu là tiêu đề (bị bỏ qua, không kiểm tên cột); phân tách bằng dấu phẩy; không hỗ trợ ngoặc kép; dòng trống bị bỏ; xuống dòng LF hoặc CRLF | Form submit (trình duyệt gửi UTF-8). Không có vấn đề BOM vì dán text; nếu dán từ file Excel Shift_JIS/ANSI là vấn đề của trình duyệt | so_hd, khach_hang, ngay (YYYY-MM-DD), tien_hang, thue_suat. Không có cột Ghi chú | Không có giới hạn số dòng trong code; kích thước request phụ thuộc giới hạn mặc định của framework (cần xác nhận) | Bắt buộc 3 cột đầu; tiền/thuế là số; trùng Số HĐ (kể cả trùng trong cùng file); kỳ khoá; thuế 0/5/8/10; tiền > 0. Nhập từng phần: dòng lỗi bỏ qua, dòng đúng vẫn lưu | Hoá đơn xuất hiện ở Danh sách và GET /api/invoices; VAT/Tổng theo R1/R2 giống tạo bằng form |

### Bộ test CSV đề xuất (Số HĐ dùng prefix QA-E1-)
| # | Mục đích | Nội dung dòng dữ liệu (sau dòng tiêu đề) | Kỳ vọng |
|---|---|---|---|
| C1 | Happy path | `QA-E1-C1,Cty Test,2026-10-05,1234561,10` | Nhập 1; VAT 123.456 (R1) |
| C2 | Trùng với hoá đơn có sẵn | `HD-1001,Cty Test,2026-10-05,1000000,10` | Dòng 2: Số hoá đơn HD-1001 đã tồn tại |
| C3 | Trùng trong cùng file | 2 dòng cùng `QA-E1-C3` | Dòng thứ 2 lỗi trùng |
| C4 | Kỳ khoá | `QA-E1-C4,Cty Test,2026-09-30,1000000,10` | Lỗi kỳ 2026-09 đã khoá sổ |
| C5 | Kỳ khoá, sai định dạng ngày | `QA-E1-C5,Cty Test,2026/09/30,1000000,10` | Phải bị từ chối (R20, TBI-10) |
| C6 | Thuế không hợp lệ / trống | `...,1000000,15` và `...,1000000,` | Thuế 15 lỗi; thuế trống: chưa rõ (TBI-09) |
| C7 | Tiền 0 / âm / định dạng VN | `...,0,10`; `...,-5,10`; `...,1.000.000,10` | 0 và âm lỗi; "1.000.000" không được lưu thành 1 đồng (TBI-09) |
| C8 | Khách hàng có dấu phẩy | `QA-E1-C8,"Cty A, CN1",2026-10-05,1000000,10` | Không lệch cột (TBI-14) |
| C9 | Dòng trống xen giữa | tiêu đề, dòng trống, dòng lỗi | Số dòng báo lỗi đúng dòng thực (TBI-13) |
| C10 | Tiếng Việt có dấu, CRLF | `QA-E1-C10,Công ty Đông Á,2026-10-05,1000000,5` với CRLF | Tên khách hàng giữ nguyên dấu |

Check cho file oracle: sau khi nhập, so từng dòng CSV hợp lệ với bản ghi trong GET /api/invoices (no, customer, date, amount, rate, vat, total, status = Chờ duyệt, createdBy = user nhập).

## Download / export
Không có (không có chức năng xuất file). Báo cáo doanh thu chỉ hiển thị HTML.
