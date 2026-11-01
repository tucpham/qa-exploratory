# External dependencies - <project>

| Dependency | Dùng ở flow | Trên test env | Cách quan sát (probe) | Test double / fault injection | Thời gian xử lý tối đa |
|---|---|---|---|---|---|
| Email (SMTP) | F1 bước 3 | real -> Mailpit | `mail {to, subject}` | - | 1 phút |
| Payment gateway | F2 | sandbox | `http {url: sandbox API}` | `browser_route` cho API phía browser; WireMock nếu gọi từ server | 30 giây |
| Batch đối soát đêm | F3 | trigger thủ công `<lệnh>` | `http {...}` / bảng DB read-only | - | 5 phút |
| ERP | F4 | không có | Không quan sát được -> Out of scope | - | - |
