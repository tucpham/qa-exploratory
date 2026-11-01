# Test data - miniacc-onboard (BẢN NHÁP)

## Test account (từ seed trong source, KHÔNG phải production)
| Username | Mật khẩu | Tên hiển thị | Role | Hiển thị trên UI |
|---|---|---|---|---|
| staff1 | Test@123 | Nguyễn Văn A | staff | Nhân viên |
| manager1 | Test@123 | Trần Thị B | manager | Kế toán trưởng |
| manager2 | Test@123 | Lê Văn C | manager | Kế toán trưởng |

Nguồn: server.js:7-11. Đây là mật khẩu seed của môi trường demo. Không đổi mật khẩu (forbidden action). Nên phân agent: tester dùng staff1/manager2, oracle dùng manager1 (đọc).

## Baseline test data (8 hoá đơn seed, in-memory, mất/khôi phục khi restart server)
Nguồn: server.js:25-34. VAT/Tổng tính theo R1/R2 (mọi dòng chia hết nên round half up và làm tròn lên cho cùng kết quả).

| id | Số HĐ | Khách hàng | Ngày | Tiền hàng | Thuế | VAT | Tổng | Trạng thái | Người tạo | Người duyệt |
|---|---|---|---|---|---|---|---|---|---|---|
| 1 | HD-0901 | Công ty Ánh Dương | 2026-09-05 | 12.000.000 | 10% | 1.200.000 | 13.200.000 | Đã duyệt | staff1 | manager1 |
| 2 | HD-0902 | Công ty Biển Xanh | 2026-09-18 | 8.500.000 | 8% | 680.000 | 9.180.000 | Đã duyệt | staff1 | manager2 |
| 3 | HD-0903 | Công ty Sông Hàn | 2026-09-28 | 3.000.000 | 10% | 300.000 | 3.300.000 | Chờ duyệt | staff1 | - |
| 4 | HD-1001 | Công ty Ánh Dương | 2026-10-02 | 15.000.000 | 10% | 1.500.000 | 16.500.000 | Đã duyệt | staff1 | manager1 |
| 5 | HD-1002 | Cửa hàng Minh Châu | 2026-10-10 | 4.200.000 | 8% | 336.000 | 4.536.000 | Đã duyệt | manager2 | manager1 |
| 6 | HD-1003 | Công ty Sông Hàn | 2026-10-15 | 20.000.000 | 10% | 2.000.000 | 22.000.000 | Đã duyệt | staff1 | manager2 |
| 7 | HD-1004 | Công ty Biển Xanh | 2026-10-20 | 6.000.000 | 0% | 0 | 6.000.000 | Chờ duyệt | staff1 | - |
| 8 | HD-1005 | Cửa hàng Minh Châu | 2026-10-25 | 9.800.000 | 5% | 490.000 | 10.290.000 | Chờ duyệt | staff1 | - |

Kỳ kế toán: 2026-09 Đã khoá sổ, 2026-10 Đang mở (server.js:12, :173).

### Đáp án suy ra từ baseline (theo R14, Needs confirmation)
- Báo cáo 2026-09: HD-0901, HD-0902; Tổng doanh thu = 22.380.000.
- Báo cáo 2026-10: HD-1001, HD-1002, HD-1003; Tổng doanh thu = 43.036.000.
- Danh sách lọc Chờ duyệt: 3 hoá đơn (HD-0903, HD-1004, HD-1005); Đã duyệt: 5.

## Ví dụ có đáp án (test oracle, từ TC)
| Nguồn | Tiền hàng | Thuế suất | VAT đúng | Tổng đúng | Rule |
|---|---|---|---|---|---|
| TC-VAT-4 | 10.000.000 | 10% | 1.000.000 | 11.000.000 | R1, R2 |
| TC-VAT-5 | 1.234.561 | 10% | 123.456 | 1.358.017 | R1, R2 (phân biệt round half up với làm tròn lên, TBI-01) |
| TC-VAT-6 | 1.234.565 | 10% | 123.457 (0,5 làm tròn lên) | 1.358.022 | R1, R2 |
| TC-VAT-7 | 2.500.000 | 8% | 200.000 | 2.700.000 | R1, R2 |

### Biến thể đề xuất (suy từ R1, chưa có TC; đáp án tính theo round half up)
| Tiền hàng | Thuế | VAT | Tổng |
|---|---|---|---|
| 1.234.564 | 10% | 123.456 | 1.358.020 |
| 1.001 | 8% | 80 | 1.081 |
| 1.002 | 5% | 50 | 1.052 |
| 1.010 | 5% | 51 (50,5 làm tròn lên) | 1.061 |
| 6.000.000 | 0% | 0 | 6.000.000 |

## Test data namespace
- Hoá đơn tự tạo đặt Số HĐ theo prefix agent: `QA-<run>-tester-N-...` (exploratory tester), `QA-<run>-triager-...` (defect triager). Ngày trong kỳ mở 2026-10 trừ khi đang thử kỳ khoá.
- Dữ liệu dùng chung, in-memory: mọi agent cùng thấy; id tăng dần toàn cục. Không duyệt/sửa hoá đơn baseline trừ khi charter yêu cầu (sẽ làm thay đổi đáp án báo cáo phía trên).
- Reset: restart server MiniAcc (dữ liệu về baseline). Chưa có lệnh reset riêng.
