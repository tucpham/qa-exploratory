# Đánh giá run-001 - bot test mù trên MiniAcc (10 bug cài sẵn)

## Cách làm
- App demo `demo/miniacc-app/server.js` có 10 bug cài sẵn (đáp án: `demo/miniacc-app/ANSWER_KEY.md`).
- Trong lúc bot chạy, source app và đáp án được mã hoá và xoá khỏi ổ đĩa; bot chỉ test qua browser + oracle script.
- Pipeline: planner (6 charter) -> explorer-1, explorer-2 chạy song song, mỗi agent 1 browser riêng -> verifier tái hiện độc lập.

## Kết quả so với đáp án

| Bug cài sẵn | Bot tìm ra | Tìm bằng |
|---|---|---|
| B1 VAT làm tròn lên | BUG-01 | UI + oracle |
| B2 Tiền hàng <= 0 | BUG-08 | UI + oracle |
| B3 Thuế suất bất kỳ | BUG-09 | UI + oracle |
| B4 Tự duyệt HĐ của mình | BUG-06 | UI + oracle |
| B5 Nhân viên duyệt qua URL | BUG-04 | UI (thử URL trực tiếp) |
| B6 Sửa HĐ kỳ khoá sổ | BUG-03 | UI |
| B7 Trùng số HĐ ở form tạo | BUG-07 | UI + oracle |
| B8 Báo cáo bỏ sót dòng đầu | BUG-02 | UI + oracle |
| B9 Lọc loại trừ "Đến ngày" | BUG-11 | UI |
| B10 CSV đọc 1.000.000 thành 1 | BUG-05 | UI |

- Tỉ lệ phát hiện: **10/10**
- Bug THẬT ngoài danh sách cài sẵn: **2**
  - BUG-10: nhập CSV không kiểm định dạng ngày nên lách được khoá sổ (ngày "20/09/2026" không bị nhận ra là kỳ 09).
  - E2-09 (để ở mục câu hỏi): CSV có dấu phẩy trong ngoặc kép bị tách sai và báo sai lý do lỗi. Đây là lỗi thật do parser tách theo dấu phẩy đơn giản.
- False positive: **0/11** bug CONFIRMED (đã đối chiếu source).
- Gộp trùng: 14 nghi vấn -> 11 bug.

## Chi phí
| Agent | Lần gọi browser | Ký tự browser trả về | Token (bộ đếm agent) | Thời gian |
|---|---|---|---|---|
| planner | 0 | 0 | ~90k | ~1 phút |
| explorer-1 | 117 | ~195k | ~116k | ~4 phút |
| explorer-2 | 96 | ~258k | ~130k | ~7,5 phút |
| verifier | 85 | ~213k | ~139k | ~5,5 phút |
| **Tổng** | **298** | **~666k** | **~475k** | **~14 phút** (explorer chạy song song) |

Trang MiniAcc nhẹ (snapshot ~1,7-2,7k ký tự/lần). App thật có bảng nhiều dòng sẽ nặng hơn nhiều lần.

## Vì sao kết quả tốt - và vì sao không nên kỳ vọng y vậy ở dự án thật
1. Profile có rule viết rất rõ, gần như 1-1 với vùng có bug. Ở dự án thật, rule thường mơ hồ hoặc thiếu, tỉ lệ phát hiện sẽ thấp hơn.
2. App nhỏ (6 màn hình), bug nông (1-3 bước là lộ). Bug thật hay nằm ở luồng dài, nhiều bước, dữ liệu lớn.
3. Oracle script bắt được 6/10 bug ngay khi có dữ liệu kích hoạt. Đây là phần giá trị nhất: đầu tư oracle tốt thì bot mạnh.
4. Bot vẫn tự tìm ra 2 bug không ai cài, chứng minh vòng "giả thuyết - tấn công" hoạt động thật, không chỉ dò theo checklist.

## Rút kinh nghiệm cho run sau
- Reset dữ liệu trước mỗi lần chạy (bot để lại ~55 hoá đơn test, vài cái đã duyệt sai, không có chức năng huỷ).
- Thêm vào profile: rule về định dạng CSV (ngoặc kép), rule về duyệt HĐ thuộc kỳ khoá - đây là câu hỏi bot đã nêu.
- Chưa cover: màn hình /periods, lọc kết hợp trạng thái.
