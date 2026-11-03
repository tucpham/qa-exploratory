# Bug patterns - miniacc

Học từ bug cũ (skill `exploratory-testing`, Tư duy cốt lõi #8). Khởi tạo từ `reports/run-001/defects.md`. Mẫu: `projects/_template/bug-patterns.md`.

## P-01. Làm tròn tiền sai hướng
- Dev assumption broken: "làm tròn" là một phép duy nhất, ai cũng hiểu như nhau.
- Symptom: lệch 1 đơn vị ở VAT / tổng khi phần lẻ < 0,5.
- Where to try next: mọi phép nhân % (thuế, chiết khấu, phí), cùng phép tính ở form sửa, import, report, export.
- Found via: BVA trên phần lẻ sau khi nhân %; test data có đáp án.
- Seen in: BUG-01 (run-001)

## P-02. Tổng / tổng hợp sai biên (off-by-one)
- Dev assumption broken: vòng lặp cộng dồn bắt đầu đúng chỗ.
- Symptom: dòng tổng khác cộng tay các dòng; thường thiếu dòng đầu hoặc cuối.
- Where to try next: mọi dòng tổng, subtotal theo nhóm, tổng ở export, tổng khi có 1 dòng / 0 dòng (Goldilocks).
- Found via: consistency oracle (tổng = cộng các dòng).
- Seen in: BUG-02 (run-001)

## P-03. Validation / quy tắc chỉ có ở một kênh nhập
- Dev assumption broken: dữ liệu chỉ vào qua form tạo.
- Symptom: rule được chặn ở form tạo nhưng lọt qua form sửa, import CSV hoặc URL.
- Where to try next: với mỗi rule, thử create / edit / import / direct URL; field ngày khi đổi định dạng.
- Found via: lăng kính "vào bằng đường khác"; CRUD (Update ít được test).
- Seen in: BUG-03, BUG-10 (run-001)

## P-04. Phân quyền chỉ ở UI (ẩn nút)
- Dev assumption broken: người dùng chỉ làm những gì nút cho phép.
- Symptom: role không có quyền vẫn thực hiện được bằng URL trực tiếp.
- Where to try next: mọi action ghi dữ liệu (approve, delete, export, sửa cấu hình) với từng role; URL GET có side effect.
- Found via: decision table role × action; persona "cố tình phá".
- Seen in: BUG-04 (run-001)

## P-05. Thiếu quy tắc phân tách trách nhiệm
- Dev assumption broken: người tạo và người duyệt luôn khác nhau.
- Symptom: người tạo tự duyệt bản ghi của mình.
- Where to try next: mọi luồng duyệt / xác nhận / hoàn tiền; đổi role giữa phiên bằng storage state.
- Found via: persona admin vs user thường; state transition.
- Seen in: BUG-06 (run-001)

## P-06. Parse số theo locale sai
- Dev assumption broken: số luôn ở dạng quốc tế, không có dấu phân cách hàng nghìn.
- Symptom: `5.000.000` lưu thành `5`; full-width / có đơn vị tiền tệ bị hiểu sai mà không báo lỗi.
- Where to try next: mọi field số ở import, dán từ Excel, form; định dạng ngày theo locale.
- Found via: test file library (định dạng số VN / quốc tế / full-width); persona "người vội" dán dữ liệu.
- Seen in: BUG-05 (run-001)

## P-07. Thiếu ràng buộc cơ bản trên field (unique, min, enum)
- Dev assumption broken: người dùng luôn nhập giá trị hợp lệ.
- Symptom: tạo được giá trị trùng key, 0 / âm, giá trị ngoài danh sách cho phép.
- Where to try next: mọi field có ràng buộc trong spec / schema; thử qua form sửa và import.
- Found via: BVA / EP, Goldilocks (0, âm, rất lớn).
- Seen in: BUG-07, BUG-08, BUG-09 (run-001)

## P-08. Bộ lọc khoảng sai ở đầu mút
- Dev assumption broken: so sánh ngày bao gồm cả ngày cuối (bỏ qua phần giờ).
- Symptom: lọc "Đến ngày" loại trừ bản ghi của chính ngày đó.
- Where to try next: mọi bộ lọc khoảng (ngày, số tiền), report theo kỳ, export theo bộ lọc.
- Found via: BVA trên 2 đầu mút của filter.
- Seen in: BUG-11 (run-001)
