# MiniAcc - 10 planted bugs (answer key, hidden from bot)

| ID | Module | Bug | Rule violated |
|---|---|---|---|
| B1 | Tạo/sửa HĐ | VAT làm tròn LÊN (Math.ceil) thay vì làm tròn đến đồng. VD 1.000.001 x 8% = 80.000,08 -> app ra 80.001 | VAT làm tròn đến đồng gần nhất |
| B2 | Tạo/sửa HĐ | Tiền hàng âm hoặc 0 vẫn lưu được | Tiền hàng > 0 |
| B3 | Tạo/sửa HĐ | Thuế suất nhận giá trị bất kỳ (15%, -5%...) | Chỉ 0/5/8/10% |
| B4 | Duyệt HĐ | Kế toán trưởng tự duyệt hoá đơn do chính mình tạo | Người tạo không được tự duyệt |
| B5 | Phân quyền | Nhân viên vào thẳng URL /invoices/:id/approve vẫn duyệt được (chỉ ẩn nút) | Chỉ Kế toán trưởng được duyệt |
| B6 | Kỳ kế toán | Sửa được HĐ thuộc kỳ đã khoá (HD-0903) hoặc đổi ngày HĐ sang kỳ đã khoá | Kỳ đã khoá: không tạo/sửa |
| B7 | Tạo HĐ | Trùng số hoá đơn vẫn tạo được (form tạo; import thì có chặn) | Số HĐ là duy nhất |
| B8 | Báo cáo | Tổng doanh thu bỏ sót dòng đầu tiên (sum slice(1)) | Tổng = sum các dòng |
| B9 | Danh sách | Lọc "Đến ngày" loại trừ chính ngày đó | Lọc bao gồm 2 đầu mút |
| B10 | Nhập CSV | Tiền dạng VN "1.000.000" bị đọc thành 1 | Import chấp nhận định dạng 1.000.000 |
