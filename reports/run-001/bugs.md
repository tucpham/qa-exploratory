# Bug report - MiniAcc - run-001 (CONFIRMED)

Verifier: agent `verifier` (browser cổng 8933), prefix dữ liệu `QA-V-`. Thời gian: 2026-10-31 khoảng 03:18-03:22 UTC.
Mọi bug dưới đây đã được verifier tự tái hiện từ đầu bằng dữ liệu mới, ít nhất 2/2 lần, và có trích rule trong `project-profile.md`.
Oracle: `node oracles/run.js miniacc` lúc 03:21:32Z (trích dẫn bên dưới). R7, R10, R11 không được oracle kiểm, bằng chứng lấy từ màn hình.

Tóm tắt:

| ID | Tiêu đề | Rule | Mức độ | Gộp từ |
|---|---|---|---|---|
| BUG-01 | VAT làm tròn lên (ceil) thay vì làm tròn đến đồng gần nhất | R1 | Nghiêm trọng | E1-01, E2-07 (phần VAT) |
| BUG-02 | Dòng "Tổng doanh thu tháng" bỏ sót dòng đầu tiên | R9 | Nghiêm trọng | E1-06, E2-08 |
| BUG-03 | Luồng sửa hoá đơn không kiểm tra kỳ khoá sổ | R7 | Nghiêm trọng | E1-04, E1-05 |
| BUG-04 | Nhân viên duyệt được hoá đơn qua URL /invoices/{id}/approve | R5 | Nghiêm trọng | E2-02 (phần R5) |
| BUG-05 | Nhập CSV: số tiền kiểu VN 5.000.000 bị lưu thành 5 | R11 | Nghiêm trọng | E2-01 |
| BUG-06 | Người tạo tự duyệt được hoá đơn của chính mình | R6 | Cao | E2-03, E2-02 (phần R6) |
| BUG-07 | Form tạo hoá đơn không chặn số hoá đơn trùng | R4 | Cao | E2-04 |
| BUG-08 | Form cho phép Tiền hàng = 0 và âm | R2 | Cao | E1-02 |
| BUG-09 | Form cho phép thuế suất ngoài 0/5/8/10% | R3 | Cao | E1-03 |
| BUG-10 | Nhập CSV không kiểm định dạng ngày, lách được kỳ khoá sổ 2026-09 | R7 (phụ R11) | Cao | E2-05 |
| BUG-11 | Bộ lọc danh sách loại trừ ngày "Đến ngày" | R10 | Trung bình | E2-06 |

---

### [BUG-01] VAT luôn làm tròn LÊN (ceil) thay vì làm tròn đến đồng gần nhất (Hoá đơn - tạo, sửa, nhập CSV)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R1 (đáp án có sẵn trong test-data.md: 1.234.561 x 10% = VAT 123.456, Tổng 1.358.017)
- Vai trò / tài khoản: staff1
- Bước tái hiện:
  1. Đăng nhập staff1, vào /invoices/new.
  2. Tạo QA-V-001, Khách "QA V Test", Ngày 2026-10-20, Tiền hàng 1234561, Thuế suất 10. Lưu.
  3. Tạo QA-V-002, Ngày 2026-10-20, Tiền hàng 1234565, Thuế suất 8. Lưu.
  4. Sửa QA-V-005 (/invoices/41/edit) thành Tiền hàng 1234561, Thuế suất 10. Lưu.
  5. Nhập CSV dòng `QA-V-C11,QA V CSV2,2026-10-24,1234561,10`.
- Dữ liệu nhập: 1234561 x 10%; 1234565 x 8% (VAT thật 98.765,2)
- Kết quả mong đợi (theo rule): VAT 123.456 / Tổng 1.358.017; VAT 98.765 / Tổng 1.333.330.
- Kết quả thực tế: /invoices/37 (tạo): "Tiền VAT 123.457", "Tổng thanh toán 1.358.018". /invoices/38 (tạo): "98.766", "1.333.331". /invoices/41 (sửa): "123.457", "1.358.018". /invoices/53 (CSV): Tổng "1.358.018". Phần lẻ < 0,5 cũng bị làm tròn lên; ca 0,5 trở lên ra đúng nên dễ lọt. Cùng gốc: QA-V-C05 (CSV 5000000.50 x 10%) VAT "500.001" thay vì 500.000.
- Bằng chứng: /invoices/37, /invoices/38, /invoices/41, /invoices/53, /invoices/50. Oracle 03:21:32Z: "QA-V-005 VAT 123457 != expected 123456 (amount 1234561 x 10%)", "QA-V-C11 VAT 123457 != expected 123456", "QA-V-C05 VAT 500001 != expected 500000". (QA-V-001/002 sau đó bị sửa số tiền khi test BUG-03 nên oracle không còn liệt kê.)
- Độ tin cậy: Cao (4/4 lần, cả 3 luồng tạo/sửa/CSV)

### [BUG-02] Dòng "Tổng doanh thu tháng" bỏ sót dòng đầu tiên của báo cáo (Báo cáo doanh thu)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R9 ("dòng Tổng = tổng cột Tổng thanh toán của các dòng")
- Vai trò / tài khoản: staff1 (xem báo cáo)
- Bước tái hiện: 1. Mở /report?month=2026-09. 2. Mở /report?month=2026-10. 3. Tự cộng cột Tổng thanh toán, so với dòng Tổng (trong cùng một lần tải trang).
- Dữ liệu nhập: Tháng 2026-09, 2026-10
- Kết quả mong đợi (theo rule): 2026-09: 13.200.000 + 9.180.000 = 22.380.000. 2026-10 (9 dòng lúc 03:20Z): 16.500.000 + 4.536.000 + 22.000.000 + 1.296.299 + 1.333.335 + 3.300.000 + 2.200.000 + 3.300.000 + 4.400.000 = 58.865.634.
- Kết quả thực tế: "Tổng doanh thu tháng 2026-09" = "9.180.000" (thiếu đúng 13.200.000 của dòng đầu HD-0901). "Tổng doanh thu tháng 2026-10" = "42.365.634" (thiếu đúng 16.500.000 của dòng đầu HD-1001).
- Bằng chứng: /report?month=2026-09, /report?month=2026-10. Oracle 03:21:32Z: "report 2026-09: shown 9180000, expected 22380000", "report 2026-10: shown 47865634, expected 64365634" (số tháng 10 tăng do hoá đơn QA-V được duyệt sau đó, chênh lệch vẫn đúng 16.500.000). Lỗi có từ lần chạy oracle đầu tiên của explorer, không do dữ liệu agent thay đổi.
- Độ tin cậy: Cao (2 tháng, nhiều thời điểm)

### [BUG-03] Luồng sửa hoá đơn không kiểm tra kỳ khoá sổ 2026-09 (Hoá đơn - sửa)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R7 ("không được ... sửa hoá đơn có ngày thuộc kỳ đó, và không được đổi ngày hoá đơn vào kỳ đó")
- Vai trò / tài khoản: staff1 (explorer-1 ghi nhận manager1 cũng làm được)
- Bước tái hiện:
  1. staff1 tạo QA-V-001 ngày 2026-10-20 (/invoices/37), QA-V-002 ngày 2026-10-20 (/invoices/38).
  2. /invoices/37/edit: đổi Ngày thành 2026-09-30. Lưu.
  3. /invoices/38/edit: đổi Ngày thành 2026-09-01. Lưu.
  4. /invoices/37/edit (hoá đơn đang thuộc kỳ khoá): đổi Tiền hàng thành 2000000. Lưu.
  5. /invoices/38/edit: đổi Tiền hàng thành 3000000. Lưu.
  6. Đối chứng: tạo mới QA-V-010 ngày 2026-09-15.
- Dữ liệu nhập: Ngày 2026-09-30, 2026-09-01; Tiền hàng 2000000, 3000000
- Kết quả mong đợi (theo rule): Bước 2-5 đều bị chặn như bước 6.
- Kết quả thực tế: Bước 2-5 lưu thành công: /invoices/37 Ngày "2026-09-30", Tiền hàng "2.000.000", Tổng "2.200.000"; /invoices/38 Ngày "2026-09-01", Tiền hàng "3.000.000", Tổng "3.240.000", đều "Chờ duyệt". Bước 6 bị chặn: "Kỳ 2026-09 đã khoá sổ, không thể tạo hoá đơn". Kiểm tra khoá sổ chỉ có ở luồng tạo mới.
- Bằng chứng: /invoices/37, /invoices/38. Explorer-1 tái hiện tương tự trên HD-0903 (sửa tiền, dời ngày ra/vào kỳ) với cả staff1 và manager1.
- Độ tin cậy: Cao (2/2 dời ngày vào kỳ, 2/2 sửa trong kỳ)

### [BUG-04] Nhân viên duyệt được hoá đơn bằng cách vào thẳng URL /invoices/{id}/approve (Duyệt hoá đơn)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R5 ("áp dụng cả khi gọi trực tiếp URL")
- Vai trò / tài khoản: staff1 (Nhân viên)
- Bước tái hiện: 1. Đăng nhập staff1 (trang chi tiết không có nút duyệt). 2. Gõ thẳng http://localhost:4100/invoices/44/approve. 3. Lặp lại với /invoices/45/approve.
- Dữ liệu nhập: không
- Kết quả mong đợi (theo rule): Bị từ chối, trạng thái vẫn "Chờ duyệt".
- Kết quả thực tế: Chuyển tới /invoices/44?approved=1, "Đã duyệt hoá đơn", Trạng thái "Đã duyệt", Người duyệt "Nguyễn Văn A" (staff1). /invoices/45 giống hệt.
- Bằng chứng: /invoices/44 (QA-V-002 bản trùng), /invoices/45 (QA-V-003 bản trùng). Oracle 03:21:32Z: "R5 QA-V-002 approved by staff1 (role staff)", "R5 QA-V-003 approved by staff1 (role staff)". Explorer-2 tái hiện trên hoá đơn do manager1 tạo (QA-E2-A02).
- Độ tin cậy: Cao (2/2)

### [BUG-05] Nhập CSV: số tiền dạng VN có dấu chấm (5.000.000) bị lưu sai thành 5 (Nhập CSV)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R11 ("chấp nhận ... 1.000.000 ... không được lưu sai giá trị")
- Vai trò / tài khoản: staff1
- Bước tái hiện: 1. Vào /import. 2. Dán CSV, bấm "Nhập". 3. Xem danh sách.
- Dữ liệu nhập:
  ```
  so_hd,khach_hang,ngay,tien_hang,thue_suat
  QA-V-C01,QA V CSV,2026-10-23,5.000.000,10
  QA-V-C02,QA V CSV,2026-10-23,1.234.565,10
  ```
  Lần 2: `QA-V-C07,QA V CSV2,2026-10-24,500.000,8`
- Kết quả mong đợi (theo rule): C01 Tiền hàng 5.000.000 / Tổng 5.500.000; C02 1.234.565 / 1.358.022; C07 500.000 / 540.000.
- Kết quả thực tế: Không có lỗi dòng nào cho các dòng này. Danh sách: QA-V-C01 Tiền hàng "5", Tổng "6"; QA-V-C02 Tiền hàng "1,234", Tổng "2,234"; QA-V-C07 Tiền hàng "500", Tổng "540". Dấu chấm bị hiểu là dấu thập phân, lưu sai im lặng.
- Bằng chứng: /invoices/46, /invoices/47, /invoices/51. Oracle 03:21:32Z: "QA-V-C02 VAT 1 != expected 0 (amount 1.234 x 10%)".
- Độ tin cậy: Cao (2 lần nhập, 3 dòng)

### [BUG-06] Người tạo tự duyệt được hoá đơn của chính mình (Duyệt hoá đơn)
- Mức độ: Cao
- Rule vi phạm: R6
- Vai trò / tài khoản: manager1 (và staff1 qua URL, xem BUG-04)
- Bước tái hiện: 1. Đăng nhập manager1. 2. Tạo QA-V-M01 (2026-10-25, 1000000, 10). 3. Ở trang chi tiết bấm "Duyệt hoá đơn" (/invoices/54/approve). 4. Tạo QA-V-M02 (2000000, 10), vào /invoices/55/approve.
- Dữ liệu nhập: QA-V-M01, QA-V-M02 / "QA V Manager" / 2026-10-25
- Kết quả mong đợi (theo rule): Không cho duyệt vì người tạo = người duyệt.
- Kết quả thực tế: Nút "Duyệt hoá đơn" hiện cho người tạo; cả 2 lần "Đã duyệt hoá đơn", Người tạo "Trần Thị B", Người duyệt "Trần Thị B". Staff1 tự duyệt QA-V-002/003 do chính mình tạo cũng thành công (Người tạo = Người duyệt = "Nguyễn Văn A").
- Bằng chứng: /invoices/54, /invoices/55, /invoices/44, /invoices/45. Oracle 03:21:32Z: "R6 QA-V-M01 created and approved by manager1", "R6 QA-V-M02 ...", "R6 QA-V-002 created and approved by staff1", "R6 QA-V-003 ...".
- Độ tin cậy: Cao (2/2 với manager1, 2/2 với staff1)

### [BUG-07] Form tạo hoá đơn không chặn số hoá đơn trùng (Tạo hoá đơn)
- Mức độ: Cao
- Rule vi phạm: R4
- Vai trò / tài khoản: staff1
- Bước tái hiện: 1. /invoices/new: tạo số "QA-V-002" (đã có, id 38), 2026-10-22, 1000000, 10. Lưu. 2. Tạo số " QA-V-003 " (khoảng trắng đầu/cuối, đã có id 39). Lưu.
- Dữ liệu nhập: "QA-V-002"; " QA-V-003 "
- Kết quả mong đợi (theo rule): Cả 2 bị từ chối vì số đã tồn tại.
- Kết quả thực tế: /invoices/44?created=1 "Đã tạo hoá đơn" số "QA-V-002"; /invoices/45?created=1 "Đã tạo hoá đơn" số "QA-V-003" (đã trim nhưng không kiểm trùng). Luồng CSV thì có chặn trùng (theo explorer-2), chỉ form thiếu.
- Bằng chứng: Oracle 03:21:32Z: "R4 QA-V-002 invoice number used 2 times (ids 38,44)", "R4 QA-V-003 invoice number used 2 times (ids 39,45)". Explorer-2 cũng tái hiện ở luồng sửa (đổi số thành HD-1002).
- Độ tin cậy: Cao (2/2)

### [BUG-08] Form cho phép tạo hoá đơn có Tiền hàng = 0 và âm (Tạo hoá đơn)
- Mức độ: Cao
- Rule vi phạm: R2
- Vai trò / tài khoản: staff1
- Bước tái hiện: /invoices/new, ngày 2026-10-20/21, thuế 10, Tiền hàng lần lượt 0 (QA-V-003), -1000 (QA-V-004), -50 (QA-V-006). Lưu.
- Kết quả mong đợi (theo rule): Bị chặn, không tạo hoá đơn.
- Kết quả thực tế: Cả 3 "Đã tạo hoá đơn": /invoices/39 Tiền hàng "0", Tổng "0"; /invoices/40 "-1.000", VAT "-100", Tổng "-1.100"; /invoices/42 "-50", VAT "-5", Tổng "-55"; trạng thái "Chờ duyệt". (CSV thì có chặn "Tiền hàng phải lớn hơn 0" theo explorer-2.)
- Bằng chứng: Oracle 03:21:32Z: "QA-V-003 amount 0 <= 0", "QA-V-004 amount -1000 <= 0", "QA-V-006 amount -50 <= 0".
- Độ tin cậy: Cao (3/3)

### [BUG-09] Form cho phép thuế suất VAT ngoài 0/5/8/10% (Tạo hoá đơn)
- Mức độ: Cao
- Rule vi phạm: R3
- Vai trò / tài khoản: staff1
- Bước tái hiện: /invoices/new, Tiền hàng 1000, Thuế suất 7 (QA-V-005) rồi 100 (QA-V-007). Lưu.
- Kết quả mong đợi (theo rule): Bị chặn.
- Kết quả thực tế: /invoices/41 "Đã tạo hoá đơn", Thuế suất "7%", VAT "70", Tổng "1.070". /invoices/43 Thuế suất "100%", VAT "1.000", Tổng "2.000". (CSV thì có chặn thuế suất 7.)
- Bằng chứng: Oracle 03:21:32Z: "QA-V-007 rate 100% not in 0/5/8/10". (QA-V-005 sau đó được sửa sang 10% để test BUG-01.)
- Độ tin cậy: Cao (2/2)

### [BUG-10] Nhập CSV không kiểm định dạng ngày, lách được kỳ khoá sổ 2026-09 (Nhập CSV)
- Mức độ: Cao
- Rule vi phạm: R7 (phụ: R11 "dòng lỗi phải báo rõ, không được lưu sai giá trị")
- Vai trò / tài khoản: staff1
- Bước tái hiện: Vào /import, dán CSV, bấm "Nhập".
- Dữ liệu nhập:
  ```
  so_hd,khach_hang,ngay,tien_hang,thue_suat
  QA-V-C03,QA V CSV,20/09/2026,1000000,10
  QA-V-C04,QA V CSV,2026-9-30,1000000,10
  ```
  Lần 2: `QA-V-C08,QA V CSV2,15/09/2026,2000000,10` và đối chứng `QA-V-C10,QA V CSV2,2026-09-20,1000000,10`
- Kết quả mong đợi (theo rule): Các dòng có ngày thuộc 2026-09 bị từ chối như dòng 2026-09-20; ngày sai định dạng phải báo lỗi rõ, không lưu.
- Kết quả thực tế: Đối chứng bị chặn: "Dòng 5: Kỳ 2026-09 đã khoá sổ". Nhưng QA-V-C03 lưu Ngày "20/09/2026", QA-V-C04 "2026-9-30", QA-V-C08 "15/09/2026", đều "Chờ duyệt", không báo lỗi. Ngày lưu nguyên chuỗi nên các hoá đơn này cũng sai ở bộ lọc ngày và không rơi vào báo cáo tháng nào (theo explorer-2).
- Bằng chứng: /invoices/48, /invoices/49, /invoices/52; trang kết quả /import.
- Độ tin cậy: Cao (2 lần nhập, 3 dòng)

### [BUG-11] Bộ lọc danh sách loại trừ ngày "Đến ngày" (Danh sách hoá đơn)
- Mức độ: Trung bình
- Rule vi phạm: R10
- Vai trò / tài khoản: staff1
- Bước tái hiện: Mở danh sách với: (1) /?from=2026-10-20&to=2026-10-20 (2) /?from=2026-10-21&to=2026-10-21 (3) /?from=2026-10-20&to=2026-10-22 (4) /?from=2026-10-21&to=2026-10-23.
- Kết quả mong đợi (theo rule): (1) có QA-V-003/004/005 (ngày 2026-10-20). (2) có QA-V-006/007 (2026-10-21). (3) có cả 2 hoá đơn ngày 2026-10-22 (id 44, 45).
- Kết quả thực tế: (1) và (2) không có dòng nào. (3) có QA-V-003/004/005 (ngày Từ được bao gồm) nhưng KHÔNG có 2 hoá đơn ngày 2026-10-22. (4) thì có 2 hoá đơn ngày 2026-10-22. Đầu "Đến ngày" bị loại.
- Bằng chứng: 4 URL trên.
- Độ tin cậy: Cao (2/2 với Từ = Đến, thêm 1 ca khoảng)

---

## Dữ liệu verifier để lại (cần team dọn)
- 19 hoá đơn QA-V- (dưới giới hạn 30): QA-V-001..007, QA-V-002/003 bản trùng (id 44, 45), QA-V-C01..C05, C07, C08, C11, QA-V-M01, M02.
- QA-V-001 (2026-09-30) và QA-V-002 (2026-09-01) đang nằm trong kỳ khoá 2026-09 (bằng chứng BUG-03), chờ duyệt.
- Đã duyệt (ảnh hưởng báo cáo 2026-10): id 44, 45 (staff1 duyệt, bug), QA-V-M01, M02 (tự duyệt, bug). Không có chức năng huỷ duyệt trên giao diện.
- Không đụng tới hoá đơn seed.
