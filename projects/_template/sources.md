# Nguồn để khởi tạo hồ sơ - <du-an>

Dùng cho agent `test-basis-analyst`. Đường dẫn tương đối với repo hoặc tuyệt đối. Xoá dòng không có.

| Loại | Đường dẫn | Ghi chú / mức tin cậy |
|---|---|---|
| spec | /path/to/spec/*.docx | Bản mới nhất, đã chốt với khách |
| testcase | /path/to/testcases.xlsx | Có cột Expected + kết quả các lần chạy |
| bug | /path/to/jira-export.csv | 12 tháng gần nhất |
| api | /path/to/openapi.yaml | |
| schema | /path/to/migrations/ | Chỉ cấu trúc |
| source | /path/to/app-src/ | CHỈ ĐỌC, chỉ agent khởi tạo được đọc |
| changelog | /path/to/CHANGELOG.md | |
| url | https://staging.<du-an> | Chỉ xem để lập bản đồ màn hình: có / không |

## Môi trường test
- URL staging:
- API đọc dữ liệu cho script đối soát (nếu có):
- Tài khoản test / nơi lấy (fixture, seed):

## Vùng cấm đã biết
-
