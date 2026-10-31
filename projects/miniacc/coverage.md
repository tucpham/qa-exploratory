# Coverage - MiniAcc

## run-001 (2026-10-31, explorer-1, explorer-2, verifier)

Kết quả: 11 bug CONFIRMED (BUG-01..11 trong reports/run-001/bugs.md), 0 rejected, 1 question.

| Vùng | Rule | Đã cover | Kết quả | Chưa cover / gợi ý lần sau |
|---|---|---|---|---|
| Tính VAT, làm tròn | R1 | 4 ví dụ đáp án (trừ 10.000.000 và 2.500.000 chỉ chạy gián tiếp), biên 0,5 ở 5/8/10%, phần lẻ < 0,5, tạo/sửa/CSV, số rất lớn | BUG-01 (ceil) | Retest toàn bộ sau fix; 0% và 5% với phần lẻ < 0,5 |
| Tiền hàng > 0 | R2 | Form: 0, âm, 1000.5, 999.999.999.999; CSV: 0, âm | BUG-08 (form) | Rỗng, khoảng trắng; sửa hoá đơn thành 0/âm |
| Thuế suất | R3 | Form: 7, 100; CSV: 7, 10.5 | BUG-09 (form) | Form: 10.5, -10, rỗng; sửa thuế suất ngoài danh sách |
| Số HĐ duy nhất | R4 | Form tạo trùng, có khoảng trắng; form sửa đổi số trùng; CSV trùng trong file/với HĐ có sẵn/nhập lại | BUG-07 | Hoa/thường qua form (câu hỏi team) |
| Phân quyền duyệt | R5 | staff vào thẳng /invoices/{id}/approve | BUG-04 | Các URL hành động khác với staff |
| Tách biệt nhiệm vụ | R6 | manager tự duyệt (nút + URL), staff tự duyệt qua URL; manager2 duyệt HĐ staff (đúng) | BUG-06 | Manager sửa HĐ của staff rồi duyệt (câu hỏi team) |
| Khoá sổ 2026-09 | R7 | Tạo mới 09-01/15/30 (chặn đúng, staff + manager); sửa dời ngày vào kỳ; sửa tiền HĐ trong kỳ; HD-0903 đổi ra/vào kỳ; CSV ngày sai định dạng | BUG-03, BUG-10 | Duyệt HĐ kỳ khoá (câu hỏi); /periods |
| HĐ đã duyệt không sửa | R8 | Mở edit qua nút/URL (staff, manager); form mở sẵn ở tab cũ rồi lưu | Đúng | - |
| Báo cáo doanh thu | R9 | 2026-09, 2026-10 (nhiều thời điểm), 2026-11 rỗng; chỉ HĐ đã duyệt; biên 10-01, 10-31 | BUG-02 | Không có export; retest dòng Tổng sau fix |
| Bộ lọc ngày | R10 | Từ = Đến, khoảng, vắt kỳ, Từ > Đến, chỉ 1 đầu | BUG-11 | Lọc kết hợp trạng thái |
| Nhập CSV | R11 | 1000000, 1.000.000, 500.000, 1.234.565, 5000000.50, "5,000,000", ngày sai định dạng, thiếu cột, ngoặc kép, file trộn đúng/lỗi | BUG-05, BUG-10 | Hỗ trợ ngoặc kép (câu hỏi), dòng trống, BOM, file lớn |
| Nhất quán số liệu | R12 | HD-1001..1003, QA-E1-003/004: danh sách = chi tiết = báo cáo | Đúng | Kiểm lại sau khi fix BUG-01/05 |
| Kỳ kế toán (/periods) | - | Chưa | - | Ưu tiên lần sau |

Lưu ý dữ liệu sau run-001: còn nhiều hoá đơn QA-E1/QA-E2/QA-V (một số đã duyệt sai, một số nằm trong kỳ 2026-09, ngày sai định dạng). Báo cáo 2026-10 và bộ đếm danh sách đã thay đổi so với seed; lần sau nên reset dữ liệu trước khi chạy.
