# Coverage - miniacc-onboard

## Đã có TC cũ cover (từ test basis, chưa chạy trong repo)
| Vùng | TC | Nội dung | Kết quả các cycle |
|---|---|---|---|
| Tính VAT + Tổng (R1, R2) | TC-VAT-4..7 (`vat-testcases.md`) | 10.000.000@10%, 1.234.561@10%, 1.234.565@10%, 2.500.000@8% | Không có test log => không biết pass/fail |

Không lặp lại 4 ví dụ trên; exploratory testing đánh vào biến thể xung quanh: thuế 0% và 5% (chưa có TC), phần lẻ < 0,5 và đúng 0,5 ở các thuế suất khác, đường Sửa và Nhập CSV (TC không ghi đường nhập).

Chưa có TC cho mọi vùng khác (R3-R21).

## Test cycle (exploratory testing)
| Run | Charter | Area | Kết quả |
|---|---|---|---|
| (chưa có) | | | |
