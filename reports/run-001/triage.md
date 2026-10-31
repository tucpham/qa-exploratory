# Triage - MiniAcc - run-001

Verifier tái hiện độc lập trên browser cổng 8933 với dữ liệu `QA-V-`, đối chiếu oracle lúc 03:21:32Z. known-issues.md trống nên không có nghi vấn nào bị loại vì trùng known issue.

| ID nghi vấn | Kết luận | Gộp vào | Lý do (1 dòng) |
|---|---|---|---|
| E1-01 | CONFIRMED | BUG-01 | 1.234.561 x 10% ra VAT 123.457 (đúng 123.456) khi tạo, sửa và CSV; oracle xác nhận - R1 |
| E1-02 | CONFIRMED | BUG-08 | Form nhận Tiền hàng 0, -1000, -50 (3/3) - R2 |
| E1-03 | CONFIRMED | BUG-09 | Form nhận thuế suất 7% và 100% (2/2) - R3 |
| E1-04 | CONFIRMED | BUG-03 | Sửa ngày hoá đơn kỳ 10 sang 2026-09-30 / 2026-09-01 lưu được (2/2) - R7 |
| E1-05 | CONFIRMED | BUG-03 | Cùng gốc E1-04 (luồng sửa không kiểm kỳ khoá); verifier tái hiện sửa tiền hoá đơn nằm trong kỳ khoá trên QA-V-001/002 thay vì HD-0903 - R7 |
| E1-06 | CONFIRMED | BUG-02 | Tổng 2026-09 = 9.180.000 (đúng 22.380.000), 2026-10 thiếu đúng dòng đầu 16.500.000 - R9 |
| E2-01 | CONFIRMED | BUG-05 | CSV 5.000.000 -> 5, 1.234.565 -> 1,234, 500.000 -> 500, không báo lỗi - R11 |
| E2-02 | CONFIRMED | BUG-04 (+BUG-06) | staff1 vào /invoices/{id}/approve duyệt được 2/2; phần tự duyệt gộp BUG-06 - R5, R6 |
| E2-03 | CONFIRMED | BUG-06 | manager1 tự duyệt QA-V-M01, M02 (2/2) - R6 |
| E2-04 | CONFIRMED | BUG-07 | Form tạo nhận số trùng "QA-V-002" và " QA-V-003 " (2/2); oracle báo trùng id 38/44, 39/45 - R4 |
| E2-05 | CONFIRMED | BUG-10 | CSV lưu ngày "20/09/2026", "2026-9-30", "15/09/2026" (kỳ khoá) không báo lỗi, trong khi 2026-09-20 bị chặn - R7, R11 |
| E2-06 | CONFIRMED | BUG-11 | Lọc Từ = Đến ra 0 dòng; ngày "Đến" bị loại (2/2) - R10 |
| E2-07 | CONFIRMED | BUG-01 | Phần VAT 500.001 (đúng 500.000) cùng gốc làm tròn lên; việc có nhận tiền lẻ hay không chuyển thành câu hỏi Q2 - R1 |
| E2-08 | CONFIRMED | BUG-02 | Trùng E1-06 - R9 |
| E2-09 | QUESTION | - | Tái hiện được 2/2 (CSV `"QA V, CSV"` báo "Thuế suất không hợp lệ"), nhưng profile không nói CSV phải hỗ trợ trường có ngoặc kép; dòng vẫn bị từ chối và không lưu sai, chỉ có lý do lỗi sai |

Tổng: 14 CONFIRMED (gộp thành 11 bug), 0 REJECTED, 1 QUESTION.

## Câu hỏi cho team (tổng hợp, chưa đủ rule để kết luận bug)
1. (E2-09) CSV có phải hỗ trợ trường có dấu phẩy trong ngoặc kép (chuẩn RFC 4180) không? Nếu không, lỗi dòng nên báo đúng lý do.
2. (E2-07, explorer-1 Q1) Tiền hàng có được phép có phần lẻ không? Form chặn 1000.5 không thông báo, CSV lại nhận 5000000.50 (lưu "5.000.000,5").
3. (explorer-2 Q1) R4 có phân biệt hoa/thường không? CSV nhận "qa-e2-c01" khi đã có "QA-E2-C01".
4. (explorer-2 Q3) Số tiền kiểu quốc tế "5,000,000" có cần hỗ trợ không?
5. (explorer-1 Q3) Duyệt hoá đơn thuộc kỳ đã khoá (HD-0903) có bị cấm không? R7 chỉ nêu tạo/sửa/đổi ngày.
6. (explorer-1 Q4) Đổi ngày RA khỏi kỳ khoá có tính là "sửa hoá đơn có ngày thuộc kỳ đó"? Verifier hiểu là có (đã gộp vào BUG-03, nhưng BUG-03 vẫn đứng vững nhờ các ca sửa trong kỳ và dời vào kỳ).
7. (explorer-1 Q2) Form nhập ngày 30/09/2026 báo "Vui lòng nhập đủ ..." thay vì "Ngày không hợp lệ" - có cần sửa thông báo?
8. (explorer-2 Q4) Manager sửa hoá đơn của staff rồi duyệt có vi phạm R6 không? Hệ thống giữ người tạo ban đầu.
9. Dọn dữ liệu: các hoá đơn bị duyệt sai (QA-E2-A01/A02/A03, QA-V id 44/45, QA-V-M01/M02) và hoá đơn QA nằm trong kỳ 2026-09 (QA-E1-008, QA-V-001, QA-V-002, các dòng CSV ngày sai định dạng) cần team dọn, giao diện không có huỷ duyệt/xoá.
10. Màn hình /periods (Kỳ kế toán) chưa được test.
