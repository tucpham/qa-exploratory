# Self-check automated test oracle - miniacc-onboard

Ngày: 2026-11-01. Oracle: `oracles/miniacc-onboard.js`. Script: `projects/miniacc-onboard/_onboarding/self-check.js`.

## Cách chạy
- Offline (không gọi server): `node projects/miniacc-onboard/_onboarding/self-check.js` => **34 pass, 0 fail**.
- `node oracles/run.js miniacc-onboard`: **KHÔNG chạy** trong smoke test này (không gọi URL theo yêu cầu; app có thể không chạy). Đã kiểm module load được.

## Kết quả
| Nhóm | Ca | Kết quả |
|---|---|---|
| Ví dụ có đáp án TC-VAT-4..7 | `expectedVat` cho đúng 1.000.000 / 123.456 / 123.457 / 200.000; hoá đơn đúng không bị báo | PASS 8/8 |
| TBI-01 | VAT làm tròn lên (123.457 cho 1.234.561 @10%) bị báo R1 | PASS |
| Biến thể round half up vs làm tròn lên | 1.001@8%=80, 1.002@5%=50, 1.234.564@10%=123.456, 0% = 0 | PASS 4/4 |
| Baseline test data + footer đúng | 0 violation (22.380.000 / 43.036.000) | PASS |
| TBI-02 | Footer bỏ hoá đơn đầu (9.180.000 / 26.536.000) => R14 x2 | PASS |
| Parse footer vi-VN | "43.036.000" => 43036000; không có footer => null => R14 | PASS 3/3 |
| Từng rule (R2, R5, R6, R7, R8, R10, R12, R13, R20) | dữ liệu vi phạm bị báo đúng rule, không báo thừa | PASS 16/16 |

## Giới hạn đã biết của oracle
- R8 chỉ phát hiện hoá đơn KHÔNG thuộc baseline có ngày trong kỳ khoá. Không phát hiện được việc sửa nội dung một hoá đơn baseline trong kỳ khoá (HD-0903) vì API không có lịch sử thay đổi => kiểm bằng manual-ui (TBI-06).
- Ngày sai định dạng như "2026/09/05" không bị R8 bắt (không nhận ra là kỳ 2026-09) nhưng bị R20 bắt.
- R10 dựa trên bảng role cố định từ seed; user mới (nếu có) sẽ bị coi là role unknown.
- Violation của rule `Needs confirmation` chỉ là anomaly; triager không được kết luận defect cho tới khi rule được duyệt. Mỗi violation có trường `confidence`.
- R14 đọc trang HTML GET /report (read-only). sources.md chỉ liệt kê GET /api/invoices cho oracle => cần QA xác nhận được phép đọc /report.
- Dự đoán khi chạy trên baseline (từ phân tích code, CHƯA quan sát): R14 x2 (TBI-02). R1 không báo trên baseline vì mọi ví dụ seed chia hết.
