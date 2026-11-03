# Bug patterns - <project>

Học từ bug cũ (skill `exploratory-testing`, Tư duy cốt lõi #8). Mỗi pattern viết ở dạng TỔNG QUÁT để áp được cho màn hình / kênh nhập khác.
- Ai ghi: `test-basis-analyst` (từ defect history lúc onboarding), `defect-triager` (sau mỗi cycle).
- Ai đọc: `charter-designer` (hạt giống charter), `exploratory-tester` (đầu session, chọn pattern khớp loại màn hình).
- Không chép dữ liệu khách hàng / PII.

## P-01. <Tên pattern ngắn>
- Dev assumption broken: <giả định ngầm bị sai>
- Symptom: <dấu hiệu quan sát được>
- Where to try next: <màn hình / kênh nhập / loại control tương tự>
- Found via: <lăng kính / persona / tour / chiều SFDIPOT / technique>
- Seen in: <BUG ID (run-id), defect ID cũ>
