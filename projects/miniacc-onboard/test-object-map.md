# Test object map - miniacc-onboard (BẢN NHÁP, lập từ route trong source; chưa xem test environment)

Base URL: http://localhost:4100. Mọi URL trừ /login, /logout cần đăng nhập; chưa đăng nhập => chuyển về /login (server.js:48-53).
Menu (khi đã đăng nhập, mọi role thấy giống nhau): Hoá đơn, Tạo hoá đơn, Nhập CSV, Báo cáo doanh thu, Kỳ kế toán, Đăng xuất; kèm "Đang đăng nhập: <tên> (Kế toán trưởng | Nhân viên)" (server.js:44-45).

| Screen | URL / method | Field (type, required, giới hạn) | Button / link | Role thấy được | Nguồn |
|---|---|---|---|---|---|
| Đăng nhập | GET/POST /login | Tên đăng nhập (text), Mật khẩu (password) | Đăng nhập; lỗi "Sai tên đăng nhập hoặc mật khẩu" | Chưa đăng nhập | server.js:55-63 |
| Đăng xuất | GET /logout | - | - | Mọi role | server.js:64 |
| Danh sách hoá đơn | GET / ?from&to&status | Từ ngày (date), Đến ngày (date), Trạng thái (select: Tất cả / Chờ duyệt / Đã duyệt) | Lọc; link Số HĐ => chi tiết. Hiện "Số hoá đơn: N". Cột: Số HĐ, Khách hàng, Ngày, Tiền hàng, Thuế suất, Tổng thanh toán, Trạng thái (không có cột VAT) | Mọi role, thấy mọi hoá đơn | server.js:66-79 |
| Tạo hoá đơn | GET /invoices/new, POST /invoices | Số hoá đơn (text, bắt buộc), Khách hàng (text, bắt buộc), Ngày hoá đơn (date, bắt buộc, không thuộc kỳ khoá), Tiền hàng VNĐ (number, phải là số), Thuế suất VAT % (number, mặc định 10), Ghi chú (text, tuỳ chọn). Không giới hạn độ dài ở server | Lưu hoá đơn => chuyển sang chi tiết với "Đã tạo hoá đơn" | Mọi role | server.js:81-105 |
| Chi tiết hoá đơn | GET /invoices/:id (id số, 1..8 là baseline) | Số HĐ, Khách hàng, Ngày, Tiền hàng, Thuế suất, Tiền VAT, Tổng thanh toán, Trạng thái, Người tạo, Người duyệt, Ghi chú | "Sửa hoá đơn" (mọi role, mọi trạng thái); "Duyệt hoá đơn" (chỉ manager và khi Chờ duyệt). Id không tồn tại => 404 "Hoá đơn không tồn tại" | Mọi role | server.js:107-118 |
| Sửa hoá đơn | GET/POST /invoices/:id/edit | Như form Tạo, điền sẵn giá trị. Hoá đơn Đã duyệt => "Hoá đơn đã duyệt, không thể sửa" | Lưu hoá đơn => về chi tiết (không có thông báo thành công) | Mọi role (không kiểm người tạo/role) | server.js:120-135 |
| Duyệt hoá đơn | GET /invoices/:id/approve (thao tác GHI qua link) | - | Không ở Chờ duyệt => "Hoá đơn không ở trạng thái chờ duyệt"; thành công => chi tiết với "Đã duyệt hoá đơn" | Link chỉ hiện cho manager; URL truy cập được bởi mọi role (TBI-07) | server.js:137-143 |
| Nhập hoá đơn từ CSV | GET/POST /import | Nội dung CSV (textarea 8x80, dán text, không phải upload file) | Nhập => trang "Kết quả nhập CSV": "Đã nhập K hoá đơn", danh sách "Dòng N: lỗi", link "Về danh sách" | Mọi role | server.js:145-160 |
| Báo cáo doanh thu đã duyệt | GET /report ?month=YYYY-MM (mặc định 2026-10) | Tháng (month) | Xem. Bảng: Số HĐ, Khách hàng, Ngày, Tổng thanh toán; footer "Tổng doanh thu tháng YYYY-MM" | Mọi role | server.js:162-170 |
| Kỳ kế toán | GET /periods | - (bảng tĩnh: 2026-09 Đã khoá sổ, 2026-10 Đang mở) | Không có nút khoá/mở kỳ | Mọi role | server.js:172-173 |
| API danh sách hoá đơn (read-only) | GET /api/invoices | JSON mảng: id, no, customer, date, amount, rate, vat, total, status, createdBy, approvedBy, note | - | Mọi role đã đăng nhập (staff cũng đọc được) | server.js:175 |

## Thông báo (message) đã biết
| Message | Khi nào | Nguồn |
|---|---|---|
| Vui lòng nhập đủ Số hoá đơn, Khách hàng, Ngày | Thiếu field bắt buộc (tạo/sửa/CSV) | server.js:93 |
| Số tiền hoặc thuế suất không hợp lệ | Tiền hàng / thuế không phải số | server.js:94 |
| Kỳ YYYY-MM đã khoá sổ, không thể tạo hoá đơn | Tạo trong kỳ khoá | server.js:101 |
| Kỳ YYYY-MM đã khoá sổ | CSV trong kỳ khoá | server.js:154 |
| Số hoá đơn X đã tồn tại | CSV trùng số | server.js:153 |
| Thuế suất không hợp lệ | CSV thuế ngoài 0/5/8/10 | server.js:155 |
| Tiền hàng phải lớn hơn 0 | CSV tiền <= 0 | server.js:155 |
| Hoá đơn đã duyệt, không thể sửa | Sửa hoá đơn Đã duyệt | server.js:123, :129 |
| Hoá đơn không ở trạng thái chờ duyệt | Duyệt hoá đơn không Chờ duyệt | server.js:140 |
| Đã tạo hoá đơn / Đã duyệt hoá đơn | Thành công | server.js:111 |
