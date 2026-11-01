# External dependencies - miniacc-onboard (BẢN NHÁP)

Phân tích server.js: app không gọi hệ thống ngoài nào (không DB, không email/SMS, không payment, không SSO, không file storage, không job/queue).

| Dependency | Dùng ở flow | Trên test env | Cách quan sát | Test double | Ghi chú |
|---|---|---|---|---|---|
| Bộ nhớ trong process (dữ liệu hoá đơn) | Mọi flow | Real (in-memory) | GET /api/invoices (read-only) | Không cần | Restart server = mất dữ liệu tự tạo, về baseline (server.js:13-15, :25-34). Không có persistence => không test được "dữ liệu còn sau restart". |
| Session store trong process | Đăng nhập / đăng xuất | Real (in-memory) | Cookie `sid` | Không | Restart server => mọi phiên mất, agent phải đăng nhập lại. Phiên không hết hạn (không có timeout). |
| Cấu hình kỳ khoá sổ | F4 | Cố định trong code (2026-09) | Trang Kỳ kế toán (tĩnh), kết quả tạo hoá đơn | Không | Không đổi được từ UI => không test được thao tác khoá/mở kỳ. |

Giới hạn: không có external dependency nào cần stub. Không có log/audit trail để quan sát lịch sử sửa/duyệt (chỉ thấy trạng thái hiện tại).
