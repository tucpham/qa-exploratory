# Nghi vấn - explorer-2 - run-001 (MiniAcc)

Charter: C4 (Nhập CSV), C2 (Phân quyền duyệt), C6 (Bộ lọc ngày + số HĐ duy nhất). Prefix dữ liệu: QA-E2-.
Thời gian chạy: 2026-10-31 khoảng 03:08-03:17 UTC. Tổng khoảng 95 lần gọi browser. Đã tạo 18 hoá đơn (11 qua CSV, 7 qua form).

---

### [E2-01] Nhập CSV: số tiền dạng VN có dấu chấm (5.000.000) bị lưu sai thành 5 (Nhập CSV)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R11 (phụ: R12)
- Vai trò / tài khoản: Nhân viên - staff1
- Bước tái hiện: 1. Đăng nhập staff1. 2. Vào "Nhập CSV" (/import). 3. Dán CSV bên dưới, bấm "Nhập". 4. Về danh sách, mở chi tiết các hoá đơn vừa nhập.
- Dữ liệu nhập:
  ```
  so_hd,khach_hang,ngay,tien_hang,thue_suat
  QA-E2-C01,Công ty Test,2026-10-05,5000000,10
  QA-E2-C02,Công ty Test,2026-10-05,5.000.000,10
  QA-E2-C12,Công ty Bậc Nghìn,2026-10-09,1.234.565,10
  QA-E2-C20,Công ty Một Dấu Chấm,2026-10-11,500.000,8
  ```
- Kết quả mong đợi (theo rule): R11 chấp nhận dạng 1.000.000 => QA-E2-C02 lưu Tiền hàng 5.000.000, VAT 500.000, Tổng 5.500.000 (giống QA-E2-C01). QA-E2-C12 lưu 1.234.565 (VAT 123.457, Tổng 1.358.022). QA-E2-C20 lưu 500.000.
- Kết quả thực tế: Trang kết quả báo thành công, không có lỗi cho các dòng này. Danh sách/chi tiết:
  - QA-E2-C01: Tiền hàng "5.000.000", Tổng "5.500.000" (đúng)
  - QA-E2-C02 (/invoices/11): Tiền hàng "5", Tiền VAT "1", Tổng thanh toán "6"
  - QA-E2-C12 (/invoices/19): Tiền hàng "1,234", Tiền VAT "1", Tổng thanh toán "2,234" (lưu thành 1.234 dạng thập phân, oracle: "amount 1.234")
  - QA-E2-C20 (/invoices/29): Tiền hàng "500", Tổng "540"
  Dấu chấm bị hiểu là dấu thập phân (parseFloat), chỉ giữ phần trước dấu chấm đầu tiên/thành số lẻ. Lưu sai giá trị một cách im lặng.
- Bằng chứng: /invoices/11, /invoices/19, /invoices/29; oracle `node oracles/run.js miniacc` lúc 03:11:20Z: "QA-E2-C12 VAT 1 != expected 0 (amount 1.234 x 10%)".
- Độ tin cậy: Cao (tái hiện 3 dòng ở 3 lần nhập khác nhau)

### [E2-02] Nhân viên duyệt được hoá đơn bằng cách vào thẳng URL /invoices/{id}/approve (Duyệt hoá đơn)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R5 (và R6 ở lần thứ 2)
- Vai trò / tài khoản: Nhân viên - staff1
- Bước tái hiện: 1. manager1 tạo QA-E2-A02 (id 31), ghi nhận link "Duyệt hoá đơn" = /invoices/31/approve. 2. Đăng nhập staff1, mở /invoices/31: chỉ có link "Sửa hoá đơn", không có nút duyệt (đúng). 3. Gõ thẳng http://localhost:4100/invoices/31/approve.
- Dữ liệu nhập: không
- Kết quả mong đợi (theo rule): Bị chặn (403/thông báo không có quyền), trạng thái vẫn "Chờ duyệt".
- Kết quả thực tế: Chuyển tới /invoices/31?approved=1, thông báo "Đã duyệt hoá đơn", Trạng thái "Đã duyệt", Người duyệt "Nguyễn Văn A" (staff1). Lặp lại với QA-E2-A03 (id 32, do chính staff1 tạo): cũng duyệt được => staff vừa vi phạm R5 vừa tự duyệt (R6).
- Bằng chứng: /invoices/31, /invoices/32. Oracle 03:14:51Z: "R5 QA-E2-A02 approved by staff1 (role staff)", "R5 QA-E2-A03 approved by staff1", "R6 QA-E2-A03 created and approved by staff1". Hai hoá đơn này hiện xuất hiện trong báo cáo 2026-10 (3.300.000 và 4.400.000).
- Độ tin cậy: Cao

### [E2-03] Kế toán trưởng tự duyệt được hoá đơn do chính mình tạo (Duyệt hoá đơn)
- Mức độ: Cao
- Rule vi phạm: R6
- Vai trò / tài khoản: Kế toán trưởng - manager1
- Bước tái hiện: 1. Đăng nhập manager1. 2. Tạo hoá đơn QA-E2-A01, ngày 2026-10-12, tiền 2.000.000, thuế 10%. 3. Ở trang chi tiết vừa tạo (/invoices/30?created=1) bấm "Duyệt hoá đơn".
- Dữ liệu nhập: QA-E2-A01 / Công ty Manager1 Tạo / 2026-10-12 / 2000000 / 10
- Kết quả mong đợi (theo rule): Nút duyệt bị ẩn/không cho duyệt vì người tạo = người duyệt.
- Kết quả thực tế: Nút "Duyệt hoá đơn" hiển thị ngay cho người tạo; bấm thì "Đã duyệt hoá đơn", Người tạo "Trần Thị B", Người duyệt "Trần Thị B".
- Bằng chứng: /invoices/30; oracle 03:14:51Z: "R6 QA-E2-A01 created and approved by manager1". Đối chứng: manager2 duyệt QA-E2-C13 (do staff1 tạo) thành công - đúng.
- Độ tin cậy: Cao

### [E2-04] Form tạo/sửa không chặn số hoá đơn trùng (Tạo/Sửa hoá đơn)
- Mức độ: Cao
- Rule vi phạm: R4
- Vai trò / tài khoản: Kế toán trưởng - manager1 (form dùng chung với staff)
- Bước tái hiện:
  1. Tạo mới hoá đơn số "QA-E2-A01" (đã tồn tại, id 30), khách "Công ty Trùng Form", 2026-10-14, 1000000, 10% => Lưu.
  2. Tạo mới số " HD-1001 " (có khoảng trắng đầu/cuối) => Lưu.
  3. Sửa QA-E2-C19 (id 28), đổi Số hoá đơn thành "HD-1002" => Lưu.
- Kết quả mong đợi (theo rule): Cả 3 bị từ chối vì số hoá đơn đã tồn tại.
- Kết quả thực tế:
  1. /invoices/33?created=1 "Đã tạo hoá đơn" - 2 hoá đơn cùng số QA-E2-A01 (oracle: "R4 QA-E2-A01 invoice number used 2 times (ids 30,33)").
  2. /invoices/34?created=1 "Đã tạo hoá đơn", Số HĐ hiển thị "HD-1001" (đã trim, trùng seed HD-1001).
  3. /invoices/28 lưu thành công, Số HĐ "HD-1002".
  Lưu ý: nhập CSV thì CÓ chặn trùng ("Dòng 10: Số hoá đơn QA-E2-C01 đã tồn tại", kể cả " QA-E2-C01 " có khoảng trắng) => chỉ form thiếu kiểm tra.
- Bằng chứng: /invoices/33, oracle 03:14:51Z. Để không làm nhiễu đối soát của explorer-1, id 34 đã đổi số thành QA-E2-F02 và id 28 trả lại QA-E2-C19; id 33 (QA-E2-A01 trùng, chờ duyệt) được giữ làm bằng chứng.
- Độ tin cậy: Cao

### [E2-05] Nhập CSV không kiểm tra định dạng ngày - lách được kỳ khoá sổ 2026-09 (Nhập CSV)
- Mức độ: Cao
- Rule vi phạm: R7 (phụ: R11, R10)
- Vai trò / tài khoản: Nhân viên - staff1
- Bước tái hiện: 1. staff1 vào /import. 2. Dán CSV dưới, bấm "Nhập".
- Dữ liệu nhập:
  ```
  so_hd,khach_hang,ngay,tien_hang,thue_suat
  QA-E2-C16,Công ty Ngày VN Kỳ Khoá,20/09/2026,1000000,10
  QA-E2-C17,Công ty Ngày Thiếu Số 0,2026-9-30,1000000,10
  QA-E2-C18,Công ty Ngày Sai,2026-09-31,1000000,10
  ```
  (và lần trước: QA-E2-C15,...,05/10/2026,...)
- Kết quả mong đợi (theo rule): Ngày 20/09/2026 và 2026-9-30 thuộc kỳ 2026-09 đã khoá => phải bị từ chối như dòng "2026-09-20" (hệ thống báo "Kỳ 2026-09 đã khoá sổ"). Ngày sai định dạng phải báo lỗi rõ, không lưu.
- Kết quả thực tế: "Đã nhập 4 hoá đơn", chỉ báo "Dòng 4: Kỳ 2026-09 đã khoá sổ" (2026-09-31). QA-E2-C16 lưu với Ngày "20/09/2026", QA-E2-C17 lưu Ngày "2026-9-30", QA-E2-C15 lưu "05/10/2026" - đều trạng thái "Chờ duyệt". Ngày lưu dạng chuỗi tuỳ ý nên bộ lọc ngày cũng sai: lọc Từ (rỗng) Đến 2026-10-02 trả về QA-E2-C15 ("05/10/2026") và QA-E2-C16; các hoá đơn này cũng không rơi vào tháng nào của báo cáo.
- Bằng chứng: /invoices/26 (C16), /invoices/27 (C17), /invoices/22 (C15); URL lọc /?from=&to=2026-10-02&status=.
- Độ tin cậy: Cao

### [E2-06] Bộ lọc danh sách loại trừ ngày "Đến ngày" (Danh sách hoá đơn)
- Mức độ: Trung bình
- Rule vi phạm: R10
- Vai trò / tài khoản: Kế toán trưởng - manager1 (bộ lọc chung)
- Bước tái hiện: 1. Mở danh sách. 2. Từ ngày = 2026-10-02, Đến ngày = 2026-10-02, bấm "Lọc". 3. Thử Từ 2026-10-02 Đến 2026-10-15. 4. Thử Từ 2026-10-15 Đến 2026-10-16.
- Kết quả mong đợi (theo rule): (2) có HD-1001 (ngày 2026-10-02). (3) có cả HD-1001 và HD-1003 (2026-10-15).
- Kết quả thực tế: (2) "Số hoá đơn: 0". (3) "Số hoá đơn: 20", có HD-1001 nhưng KHÔNG có HD-1003. (4) "Số hoá đơn: 1" chỉ HD-1003 => đầu "Từ" được bao gồm, đầu "Đến" bị loại (so sánh < thay vì <=). Tương tự lọc 2026-10-01..2026-10-31 không có QA-E2-F01 (2026-10-31), lọc 2026-10-31..2026-11-01 thì có.
- Bằng chứng: /?from=2026-10-02&to=2026-10-02&status=, /?from=2026-10-02&to=2026-10-15&status=, /?from=2026-10-15&to=2026-10-16&status=
- Độ tin cậy: Cao

### [E2-07] Nhập CSV: tiền hàng có phần thập phân được chấp nhận, VAT làm tròn sai (Nhập CSV)
- Mức độ: Trung bình
- Rule vi phạm: R1 (phụ: R11)
- Vai trò / tài khoản: Nhân viên - staff1
- Bước tái hiện: Nhập CSV dòng `QA-E2-C04,Công ty Test,2026-10-06,5000000.50,10`.
- Kết quả mong đợi (theo rule): Nếu chấp nhận thì VAT = 5.000.000,5 x 10% = 500.000,05 => làm tròn 500.000, Tổng = Tiền hàng + VAT. (Nếu không chấp nhận số lẻ thì phải báo lỗi dòng.)
- Kết quả thực tế: Lưu thành công; chi tiết /invoices/12: Tiền hàng "5.000.000,5", Tiền VAT "500.001", Tổng thanh toán "5.500.001,5". Tương tự QA-E2-C12 (tiền 1,234): VAT "1" thay vì 0. Có vẻ VAT dùng làm tròn lên (ceil) - cùng gốc với nghi vấn R1 của C1 (oracle cũng báo QA-E1-001 VAT 123457 != 123456).
- Bằng chứng: /invoices/12; oracle 03:11:20Z "QA-E2-C04 VAT 500001 != expected 500000".
- Độ tin cậy: Cao (phần VAT); việc có nên chấp nhận số lẻ thì xem Câu hỏi cho team

### [E2-08] Báo cáo doanh thu: dòng Tổng không cộng dòng đầu tiên (Báo cáo doanh thu) - phát hiện phụ, thuộc C5 của explorer-1
- Mức độ: Cao
- Rule vi phạm: R9
- Vai trò / tài khoản: Kế toán trưởng - manager1
- Bước tái hiện: Mở /report?month=2026-10 (lúc 03:15:57Z), tự cộng cột "Tổng thanh toán".
- Kết quả mong đợi (theo rule): Tổng = 16.500.000 + 4.536.000 + 22.000.000 + 1.296.299 + 1.333.335 + 2.200.000 + 3.300.000 + 4.400.000 = 55.565.634.
- Kết quả thực tế: "Tổng doanh thu tháng 2026-10" = "39.065.634" = thiếu đúng 16.500.000 (dòng đầu HD-1001). Oracle tháng 09: shown 9.180.000, expected 22.380.000 = thiếu 13.200.000 (dòng đầu HD-0901). Đã xảy ra từ lần chạy oracle đầu tiên (03:11:20Z), trước khi explorer-2 duyệt hoá đơn nào.
- Bằng chứng: /report?month=2026-10; oracle 03:11:20Z và 03:14:51Z.
- Độ tin cậy: Cao (có thể trùng với báo cáo của explorer-1)

### [E2-09] Nhập CSV: tên khách có dấu phẩy trong ngoặc kép bị từ chối với lý do sai (Nhập CSV)
- Mức độ: Thấp
- Rule vi phạm: R11 ("Dòng lỗi phải báo rõ")
- Vai trò / tài khoản: Nhân viên - staff1
- Bước tái hiện: Nhập CSV dòng `QA-E2-C11,"Công ty Ánh, Dương",2026-10-09,2000000,10` và `QA-E2-C10,"Công ty TNHH Á, Đông",2026-10-09,1.234.565,10`.
- Kết quả mong đợi (theo rule): Dòng CSV hợp lệ chuẩn (trường có dấu phẩy được bao ngoặc kép) phải được nhập; nếu không hỗ trợ thì báo rõ lý do.
- Kết quả thực tế: "Dòng 2: Thuế suất không hợp lệ" (C11) và "Dòng 13: Số tiền hoặc thuế suất không hợp lệ" (C10) - thuế suất 10 và tiền 2000000 hợp lệ, lý do báo sai do parser tách cột theo dấu phẩy, không xử lý ngoặc kép.
- Bằng chứng: trang kết quả /import sau 2 lần nhập.
- Độ tin cậy: Trung bình (cần team xác nhận CSV có phải hỗ trợ ngoặc kép không)

---

## Đã cover

C4 - Nhập CSV (staff1), 4 lần nhập:
- Đúng: 5000000 lưu đúng 5.000.000 / VAT 500.000; thuế suất 7 và 10.5 bị từ chối ("Thuế suất không hợp lệ"); tiền 0 và -1000000 bị từ chối ("Tiền hàng phải lớn hơn 0"); ngày 2026-09-20 bị từ chối ("Kỳ 2026-09 đã khoá sổ"); 2026-09-31 cũng báo khoá sổ; trùng số trong cùng file, trùng với HĐ đã có (HD-1001), có khoảng trắng " QA-E2-C01 " đều bị chặn; nhập lại nguyên file lần 2 => "Đã nhập 0 hoá đơn", không tạo trùng; dòng thiếu cột bị từ chối; "5,000,000" (ngoặc kép) bị từ chối; file trộn dòng đúng/lỗi: dòng đúng lưu, dòng lỗi liệt kê theo số dòng, không thấy lưu "một nửa".
- Sai: E2-01, E2-05, E2-07, E2-09.
- 10 x 5% (QA-E2-C19): VAT 1, Tổng 11 (0,5 làm tròn lên - đúng R1).

C2 - Phân quyền duyệt:
- Sai: E2-02 (staff duyệt qua URL), E2-03 (manager tự duyệt).
- Đúng: staff1 không thấy nút "Duyệt hoá đơn"; manager2 duyệt HĐ của staff1 được; duyệt lại HĐ đã duyệt qua URL => "Hoá đơn không ở trạng thái chờ duyệt"; mở /invoices/{id}/edit của HĐ đã duyệt (manager1 và staff1) => "Hoá đơn đã duyệt, không thể sửa"; form sửa mở sẵn ở tab cũ, duyệt ở tab khác rồi bấm Lưu => bị chặn, số tiền không đổi; manager1 sửa HĐ của staff1 (QA-E2-C13) thì "Người tạo" vẫn là Nguyễn Văn A.

C6 - Bộ lọc + số HĐ duy nhất:
- Sai: E2-06, E2-04.
- Đúng: đầu "Từ ngày" được bao gồm; Từ > Đến => 0 dòng, không lỗi; lọc vắt kỳ 2026-09-25..2026-10-05 trả về HĐ của cả 2 kỳ (trừ ngày cuối); lọc chỉ "Đến" hoạt động; bấm Lưu 2 lần nhanh khi tạo (QA-E2-F03) chỉ tạo 1 bản ghi.
- Chưa thử qua form: số khác hoa/thường "hd-1001" (qua CSV thì "qa-e2-c01" được nhận - xem câu hỏi).

Ngoài charter (xem lướt): báo cáo 2026-10 (E2-08).

Dữ liệu QA-E2 để lại: QA-E2-C01, C02, C04, C12, C13 (đã duyệt bởi manager2), qa-e2-c01, C15, C16, C17, C19, C20, A01 (đã duyệt, tự duyệt), A02 và A03 (đã duyệt bởi staff1 - bug), A01 bản trùng (id 33), F01 (2026-10-31), F02, F03. Báo cáo 2026-10 hiện gồm A01, A02, A03, C13 của explorer-2.

## Câu hỏi cho team

1. R4 có phân biệt hoa/thường không? CSV đã nhận "qa-e2-c01" trong khi đã có "QA-E2-C01" (/invoices/21). Nếu số HĐ không phân biệt hoa/thường thì đây là bug R4.
2. Tiền hàng có được phép có phần lẻ (5000000.50) không? Nếu không, CSV phải từ chối dòng (E2-07) thay vì lưu "5.000.000,5".
3. Số tiền kiểu quốc tế "5,000,000" có cần hỗ trợ không (R11 chỉ nêu 1000000 và 1.000.000)? Hiện bị từ chối với lỗi chung.
4. Khi manager sửa hoá đơn của staff rồi duyệt, có tính là "người tạo" theo R6 không? Hiện hệ thống giữ người tạo ban đầu và cho manager duyệt.
5. Các hoá đơn bị duyệt sai (A02, A03 bởi staff1; A01 tự duyệt) có cần huỷ duyệt/xoá để không ảnh hưởng báo cáo? Giao diện không có chức năng huỷ duyệt nên explorer-2 không tự dọn được.
6. Khi manager mở hoá đơn do chính mình tạo, nút "Duyệt hoá đơn" vẫn hiện. Sau khi sửa E2-03, có cần ẩn luôn nút này trên giao diện không, hay chỉ cần chặn ở phía server?
