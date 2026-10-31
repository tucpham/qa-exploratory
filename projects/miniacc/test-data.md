# Test data - MiniAcc

## Tài khoản test (chỉ dùng trên staging)
| Username | Mật khẩu | Vai trò |
|---|---|---|
| staff1 | Test@123 | Nhân viên |
| manager1 | Test@123 | Kế toán trưởng |
| manager2 | Test@123 | Kế toán trưởng |

## Kỳ kế toán
- 2026-09: Đã khoá sổ
- 2026-10: Đang mở

## Ví dụ tính VAT có đáp án (R1)
| Tiền hàng | Thuế suất | VAT đúng | Tổng đúng |
|---|---|---|---|
| 10.000.000 | 10% | 1.000.000 | 11.000.000 |
| 1.234.561 | 10% | 123.456 | 1.358.017 |
| 1.234.565 | 10% | 123.457 (0,5 làm tròn lên) | 1.358.022 |
| 2.500.000 | 8% | 200.000 | 2.700.000 |

## Dữ liệu seed có sẵn
- HD-0901, HD-0902 (kỳ 09, đã duyệt), HD-0903 (kỳ 09, chờ duyệt)
- HD-1001 đến HD-1003 (kỳ 10, đã duyệt), HD-1004, HD-1005 (kỳ 10, chờ duyệt)

## Mẫu CSV
```
so_hd,khach_hang,ngay,tien_hang,thue_suat
QA-X-001,Công ty Test,2026-10-05,5000000,10
```
