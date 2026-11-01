# Inventory test basis - miniacc-onboard (BẢN NHÁP)

Ngày lập: 2026-11-01. Agent: test-basis-analyst (smoke test).

| # | Type | Nguồn | Ngôn ngữ | Phiên bản / ngày | Kích thước | Đã chuẩn hoá text | Ghi chú |
|---|---|---|---|---|---|---|---|
| S1 | source | `scratchpad/miniacc-src/server.js` (đường dẫn đầy đủ trong `sources.md`) | JavaScript (Express), UI tiếng Việt | không có version; mtime 2026-11-01 12:49; sha1 8576600c | 176 dòng, 1 module | Không cần (text) | Test object, KHÔNG phải test oracle. Mọi rule chỉ từ nguồn này => `Needs confirmation`. |
| S2 | testcase | `scratchpad/miniacc-src/vat-testcases.md` | Tiếng Việt | không có version; mtime 2026-11-01 12:49; sha1 2eac5410 | 4 ví dụ VAT | Không cần (text) | Chỉ có Expected result, KHÔNG có test log / kết quả các cycle => không xác định được TC pass ổn định hay flaky. |
| S3 | url | http://localhost:4100 | - | - | - | - | sources.md ghi KHÔNG dùng. Không truy cập. |

## Không có
- spec / requirement / user story: KHÔNG có. Đây là giới hạn lớn nhất: hầu hết rule chỉ suy ra từ code => `Needs confirmation`.
- defect history, changelog, API spec, DB schema: KHÔNG có. Product risk chỉ suy ra từ test basis issue.

## Module trong S1 (1 file, phân tích toàn bộ)
| Module | Dòng | Nội dung |
|---|---|---|
| Seed / config | 6-16, 25-34 | Test account, kỳ khoá sổ, 8 hoá đơn baseline (in-memory) |
| Tính VAT / tạo bản ghi | 17-24 | Công thức VAT, total, trạng thái mặc định |
| Layout / nav | 36-47 | Menu, hiển thị role |
| Auth / session | 48-64 | Login, cookie session, logout |
| Danh sách + filter | 66-79 | Lọc theo ngày, trạng thái |
| Form + validate | 81-96 | Field hoá đơn, check chung |
| Tạo | 98-105 | |
| Chi tiết | 107-118 | Nút Sửa / Duyệt theo role |
| Sửa | 120-135 | |
| Duyệt | 137-143 | |
| Nhập CSV | 145-160 | |
| Báo cáo doanh thu | 162-170 | |
| Kỳ kế toán | 172-173 | Trang tĩnh |
| API read-only | 175 | GET /api/invoices |

## Spec cũ hơn code?
Không áp dụng (không có spec). TC S2 không ghi ngày/phiên bản; không xác định được TC có cũ hơn code hay không.
