# External dependencies - <project>

| Dependency | Dùng ở flow | Trust boundary (dữ liệu từ đâu app không kiểm soát) | Trên test env | Cách quan sát (probe) | Test double / fault injection | Thời gian xử lý tối đa |
|---|---|---|---|---|---|---|
| Email (SMTP) | F1 bước 3 | - | real -> Mailpit | `mail {to, subject}` | - | 1 phút |
| Payment gateway | F2 | Kết quả thanh toán trả về | sandbox | `http {url: sandbox API}` | `browser_route` cho API phía browser; WireMock nếu gọi từ server | 30 giây |
| Batch đối soát đêm | F3 | File đối soát từ ngân hàng | trigger thủ công `<lệnh>` | `http {...}` / bảng DB read-only | - | 5 phút |
| ERP | F4 | Dữ liệu master từ ERP | không có | Không quan sát được -> Out of scope | - | - |

## What If? (charter designer điền / cập nhật)
| Dependency | What if... | App nên làm gì (theo profile) | Đã test ở charter |
|---|---|---|---|
