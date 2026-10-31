# Suspects - explorer-1 - run-001 (MiniAcc)

Agent: explorer-1 (cổng 8931), prefix dữ liệu QA-E1-. Charter: C1, C3, C5.
Thời gian chạy: khoảng 2026-10-31T03:10Z - 03:14Z (UTC). Oracle (`node oracles/run.js miniacc`) chạy lúc 03:12:26Z và 03:13:34Z.
Hoá đơn đã tạo: 12 (QA-E1-001..009, 011; 005/006/007 là hoá đơn lỗi được hệ thống nhận). Dưới giới hạn 30.

---

### [E1-01] VAT luôn làm tròn LÊN (ceil) thay vì làm tròn đến đồng gần nhất (Hoá đơn - tạo/sửa)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R1 (ví dụ có đáp án trong test-data.md: 1.234.561 x 10% = 123.456)
- Vai trò / tài khoản: staff1
- Bước tái hiện:
  1. Đăng nhập staff1, vào /invoices/new.
  2. Số HĐ QA-E1-008, Khách hàng "QA E1 Test", Ngày 2026-10-08, Tiền hàng 1234561, Thuế suất 10. Lưu.
  3. Xem trang chi tiết.
  4. Lặp lại với QA-E1-009: Tiền hàng 1234565, Thuế suất 8 (VAT thật = 98.765,2).
  5. Sửa QA-E1-001 (/invoices/9/edit) thành 1234561 / 10% và 1234565 / 8%: kết quả giống hệt.
- Dữ liệu nhập: 1234561 x 10%; 1234565 x 8%
- Kết quả mong đợi (theo rule): VAT 123.456, Tổng 1.358.017; VAT 98.765, Tổng 1.333.330
- Kết quả thực tế: "Tiền VAT 123.457", "Tổng thanh toán 1.358.018" (/invoices/23); "Tiền VAT 98.766", "Tổng thanh toán 1.333.331" (/invoices/24). Lỗi xảy ra cả khi tạo và khi sửa.
- Bằng chứng: /invoices/23 (QA-E1-008), /invoices/24 (QA-E1-009), /invoices/9 (QA-E1-001). Oracle 03:12:26Z: "VAT 123457 != expected 123456 (amount 1234561 x 10%)", "VAT 98766 != expected 98765 (amount 1234565 x 8%)". Các ca có phần lẻ >= 0,5 lại cho kết quả đúng (1.234.565 x 10% = 123.457; 10 x 5% = 1; 1.234.570 x 5% = 61.729; 1.234.569 x 8% = 98.766), nên lỗi khó phát hiện nếu chỉ test ca 0,5. Oracle cũng báo lỗi cùng kiểu trên QA-E2-C04 và QA-E2-C12.
- Độ tin cậy: Cao

### [E1-02] Cho phép tạo hoá đơn có Tiền hàng = 0 và Tiền hàng âm (Hoá đơn - tạo)
- Mức độ: Cao
- Rule vi phạm: R2
- Vai trò / tài khoản: staff1
- Bước tái hiện:
  1. Đăng nhập staff1, vào /invoices/new.
  2. QA-E1-005, ngày 2026-10-07, Tiền hàng 0, Thuế suất 10. Lưu.
  3. QA-E1-006, ngày 2026-10-07, Tiền hàng -1000, Thuế suất 10. Lưu.
- Dữ liệu nhập: 0; -1000
- Kết quả mong đợi (theo rule): Bị chặn với thông báo lỗi, không tạo hoá đơn.
- Kết quả thực tế: "Đã tạo hoá đơn". /invoices/16: Tiền hàng "0", VAT "0", Tổng "0". /invoices/17: Tiền hàng "-1.000", VAT "-100", Tổng "-1.100", Trạng thái "Chờ duyệt".
- Bằng chứng: /invoices/16?created=1, /invoices/17?created=1; oracle: "amount 0 <= 0", "amount -1000 <= 0".
- Độ tin cậy: Cao

### [E1-03] Cho phép thuế suất VAT 7% (ngoài 0/5/8/10) (Hoá đơn - tạo)
- Mức độ: Cao
- Rule vi phạm: R3
- Vai trò / tài khoản: staff1
- Bước tái hiện: 1. Đăng nhập staff1, vào /invoices/new. 2. QA-E1-007, ngày 2026-10-07, Tiền hàng 1000, Thuế suất 7 (ô nhập số tự do, không phải dropdown). Lưu.
- Dữ liệu nhập: Thuế suất 7
- Kết quả mong đợi (theo rule): Bị chặn, chỉ nhận 0/5/8/10.
- Kết quả thực tế: "Đã tạo hoá đơn", Thuế suất "7%", VAT "70", Tổng "1.070".
- Bằng chứng: /invoices/18?created=1; oracle: "rate 7% not in 0/5/8/10".
- Độ tin cậy: Cao

### [E1-04] Sửa hoá đơn được dời ngày VÀO kỳ đã khoá sổ 2026-09 (Hoá đơn - sửa)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R7 ("không được đổi ngày hoá đơn vào kỳ đó")
- Vai trò / tài khoản: staff1 (manager1 cũng làm được trên HD-0903, xem E1-05)
- Bước tái hiện:
  1. Đăng nhập staff1, tạo QA-E1-008 ngày 2026-10-08 (/invoices/23).
  2. Vào /invoices/23/edit, đổi Ngày hoá đơn thành 2026-09-30, giữ nguyên các trường khác. Lưu.
- Dữ liệu nhập: Ngày 2026-09-30
- Kết quả mong đợi (theo rule): Bị chặn như khi tạo mới ("Kỳ 2026-09 đã khoá sổ...").
- Kết quả thực tế: Lưu thành công, quay về /invoices/23 với Ngày "2026-09-30". Danh sách cũng hiển thị QA-E1-008 ngày 2026-09-30, "Chờ duyệt".
- Bằng chứng: /invoices/23. Đối chứng: tạo mới ngày 2026-09-01 / 2026-09-15 / 2026-09-30 đều bị chặn với thông báo "Kỳ 2026-09 đã khoá sổ, không thể tạo hoá đơn" (cả staff1 và manager1), nên kiểm tra khoá sổ chỉ có ở luồng tạo mới.
- Độ tin cậy: Cao
- Ghi chú: QA-E1-008 vẫn đang để ngày 2026-09-30 làm bằng chứng.

### [E1-05] Sửa được hoá đơn thuộc kỳ đã khoá sổ (HD-0903) - số tiền và ngày (Hoá đơn - sửa)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R7 ("không được ... sửa hoá đơn có ngày thuộc kỳ đó")
- Vai trò / tài khoản: staff1 và manager1
- Bước tái hiện:
  1. Đăng nhập staff1, vào /invoices/3/edit (HD-0903, ngày 2026-09-28, 3.000.000, Chờ duyệt).
  2. Đổi Tiền hàng thành 3500000, giữ ngày 2026-09-28. Lưu.
  3. Đăng nhập manager1, sửa HD-0903 đổi ngày thành 2026-10-01. Lưu.
  4. manager1 sửa lại ngày thành 2026-09-28, tiền 3000000. Lưu.
- Dữ liệu nhập: Tiền hàng 3500000; Ngày 2026-10-01; Ngày 2026-09-28
- Kết quả mong đợi (theo rule): Mọi lần sửa đều bị chặn vì hoá đơn thuộc kỳ khoá.
- Kết quả thực tế: Cả 3 lần đều lưu thành công. Sau bước 2: Tiền hàng "3.500.000", VAT "350.000", Tổng "3.850.000". Sau bước 3: Ngày "2026-10-01" (hoá đơn thoát khỏi kỳ khoá). Sau bước 4: hoá đơn quay lại kỳ khoá.
- Bằng chứng: /invoices/3. Đã khôi phục HD-0903 về giá trị gốc (2026-09-28, 3.000.000, 10%); người tạo vẫn là "Nguyễn Văn A". Lưu ý: HD-0903 đã bị sửa 3 lần trong lịch sử (nếu app có audit log).
- Độ tin cậy: Cao

### [E1-06] Dòng "Tổng doanh thu tháng" bỏ sót dòng đầu tiên của báo cáo (Báo cáo doanh thu)
- Mức độ: Nghiêm trọng
- Rule vi phạm: R9 ("dòng Tổng = tổng cột Tổng thanh toán của các dòng")
- Vai trò / tài khoản: manager1
- Bước tái hiện:
  1. Đăng nhập manager1, vào /report?month=2026-10 (03:12:55Z).
  2. Cộng cột Tổng thanh toán, so với dòng Tổng.
  3. Lặp lại với /report?month=2026-09.
- Dữ liệu nhập: Tháng 2026-10, 2026-09
- Kết quả mong đợi (theo rule): 2026-10: 16.500.000 + 4.536.000 + 22.000.000 = 43.036.000. 2026-09: 13.200.000 + 9.180.000 = 22.380.000.
- Kết quả thực tế: "Tổng doanh thu tháng 2026-10: 26.536.000" (thiếu đúng 16.500.000, dòng đầu HD-1001). "Tổng doanh thu tháng 2026-09: 9.180.000" (thiếu đúng 13.200.000, dòng đầu HD-0901). Lúc 03:13:29Z (6 dòng, gồm QA-E1-003, QA-E1-004, QA-E2-A01 đã duyệt): tổng thực 47.865.634, màn hình "31.365.634", vẫn thiếu đúng 16.500.000 của dòng đầu. Lỗi kiểu off-by-one khi cộng.
- Bằng chứng: /report?month=2026-10, /report?month=2026-09. Oracle: "report 2026-09: shown 9180000, expected 22380000", "report 2026-10: shown 26536000, expected 43036000" (03:12:26Z) và "shown 31365634, expected 47865634" (03:13:34Z). Dòng tổng và các dòng được xem trong cùng một lần tải trang, nên không phải do explorer-2 thay đổi dữ liệu.
- Độ tin cậy: Cao

---

## Đã cover

C1 - VAT/làm tròn (staff1):
- 4 ví dụ đáp án: 1.234.565 x 10% đúng (123.457 / 1.358.022); 1.234.561 x 10% SAI (E1-01). Không chạy riêng 10.000.000 x 10% và 2.500.000 x 8% (VAT nguyên, không có làm tròn).
- Biên 0,5: 10 x 5% = 1 / 11 đúng; 1.234.570 x 5% = 61.729 đúng; 1.234.569 x 8% = 98.766 đúng; 1.234.575 x 8% = 98.766 đúng.
- Phần lẻ < 0,5: 1.234.565 x 8% SAI (E1-01).
- Sửa hoá đơn chờ duyệt (QA-E1-001) 10% -> 8% -> 5% -> 0% và đổi tiền hàng: VAT/Tổng được tính lại theo giá trị mới (không giữ giá trị cũ), 0% ra VAT 0, Tổng = Tiền hàng đúng. Tổng luôn = Tiền hàng + VAT đã hiển thị.
- R2: 0 và âm được nhận (E1-02). 1000.5: form không lưu, quay lại /invoices/new, không thấy thông báo lỗi (xem câu hỏi). 999.999.999.999 x 10%: VAT 100.000.000.000 (99.999.999.999,9 làm tròn lên, đúng R1), Tổng 1.099.999.999.999 đúng.
- R3: 7% được nhận (E1-03). Chưa thử 10.5, -10, 100, rỗng (hết ngân sách C1).
- Chưa thử nhập "1.234.565" / "1,234,565" ở form (ô Tiền hàng là spinbutton kiểu number).

C3 - Khoá sổ 2026-09:
- Tạo mới 2026-09-01 / 09-15 / 09-30 bị chặn (staff1), 2026-09-30 bị chặn (manager1): ĐÚNG, thông báo rõ ràng.
- Đổi ngày vào kỳ khoá khi sửa: lọt (E1-04). Sửa HD-0903 trong kỳ khoá, đổi ra/vào kỳ: lọt (E1-05).
- Ngày dạng 30/09/2026 và 2026-9-30 ở form: bị từ chối với "Vui lòng nhập đủ Số hoá đơn, Khách hàng, Ngày" (không lách được khoá sổ qua form, nhưng thông báo không đúng lý do). Chưa thử 2026-09-31.
- Manager1 thấy nút "Duyệt hoá đơn" (/invoices/3/approve) trên HD-0903 nhưng KHÔNG bấm (xem câu hỏi).

C5 - Đối soát (manager1):
- Báo cáo 2026-10 (03:12:55Z): chỉ gồm HD-1001..1003, không có HD-1004/1005 hay hoá đơn chờ duyệt: ĐÚNG. Dòng Tổng sai (E1-06).
- Báo cáo 2026-09: chỉ HD-0901, HD-0902, không có HD-0903 và không có QA-E1-008 (chờ duyệt, ngày 09-30): ĐÚNG. Dòng Tổng sai (E1-06).
- Báo cáo 2026-11 (chưa có dữ liệu): bảng trống, Tổng "0", không có NaN/500: ĐÚNG.
- Biên tháng: QA-E1-004 (2026-10-01) và QA-E1-003 (2026-10-31) do staff1 tạo, manager1 duyệt lúc 03:13:2xZ, đều xuất hiện trong báo cáo 2026-10: ĐÚNG.
- R12: Tổng thanh toán của HD-1001..1003, QA-E1-003 (1.296.299), QA-E1-004 (1.333.335) khớp giữa danh sách, chi tiết và báo cáo.
- Không có export trên màn hình báo cáo.

## Câu hỏi cho team
1. Nhập Tiền hàng 1000.5 ở form tạo: form không lưu, không có thông báo lỗi nào trên trang (có thể do validate HTML5 step=1 của ô number). Có cần thông báo rõ không? Trong khi đó luồng của explorer-2 lại lưu được tiền hàng lẻ (QA-E2-C04 hiển thị "5.000.000,5") nên hai luồng đang không nhất quán.
2. Nhập ngày 30/09/2026 hoặc 2026-9-30 báo "Vui lòng nhập đủ Số hoá đơn, Khách hàng, Ngày" dù đã nhập đủ. Có nên báo "Ngày không hợp lệ" không? Danh sách hiện đang chứa QA-E2-C15 "05/10/2026", QA-E2-C16 "20/09/2026", QA-E2-C17 "2026-9-30" (nhiều khả năng từ CSV) - ngày sai định dạng được lưu nguyên văn và có thể lọt qua khoá sổ (để explorer-2 / C4 xác nhận).
3. Duyệt hoá đơn thuộc kỳ đã khoá (HD-0903) có bị cấm không? R7 chỉ nói tạo/sửa/đổi ngày. Manager1 vẫn thấy nút "Duyệt hoá đơn". Tôi chưa bấm vì không hoàn tác được và sẽ làm đổi báo cáo 2026-09.
4. Đổi ngày hoá đơn RA khỏi kỳ khoá (2026-09-28 -> 2026-10-01) có tính là "sửa hoá đơn có ngày thuộc kỳ đó" không? Tôi hiểu là có (đã đưa vào E1-05).
5. Màn hình Kỳ kế toán (/periods) chưa được khám phá: có cho mở/khoá kỳ qua giao diện không, với vai trò nào?
