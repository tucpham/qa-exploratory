# Charter history - miniacc

Mỗi dòng là một charter đã chạy. Chỉ **thêm** dòng mới vào cuối, không sửa dòng cũ.
Các dòng run-001 dựng lại từ `charters/run-001.md` và session sheet (run-001 không ghi persona/tour nên persona là suy ra từ cách test; "-" = không có).

| Run | Charter | Mission (tóm tắt) | Type | Persona | Tour | SFDIPOT focus | Heuristic | Tester |
|---|---|---|---|---|---|---|---|---|
| run-001 | C1 | Tấn công VAT/làm tròn khi tạo/sửa (R1, R2, R3) | session | người cẩn thận (suy ra) | - | Function, Data | BVA phần lẻ 0,5; EP thuế suất; form tạo trước | explorer-1 (tester-1) |
| run-001 | C2 | Phá phân quyền duyệt, tự duyệt, sửa sau duyệt (R5, R6, R8) | session | người cố tình phá; admin vs user | - | Function, Interfaces | decision table; URL trực tiếp; tab cũ | explorer-2 (tester-2) |
| run-001 | C3 | Xuyên kỳ khoá 2026-09 (R7) | session | người cố tình phá | - | Time, Function | BVA ngày đầu/cuối tháng; định dạng ngày; form sửa | explorer-1 (tester-1) |
| run-001 | C4 | Nhập CSV số/trùng/dòng lỗi (R11, R4, R3) | session | người dán từ Excel | - | Data, Interfaces | EP định dạng số; dán text vào /import | explorer-2 (tester-2) |
| run-001 | C5 | Đối soát list/detail/báo cáo (R9, R12) | session | người cẩn thận | - | Data, Function | consistency; tổng = cộng dòng (tháng có sẵn dữ liệu) | explorer-1 (tester-1) |
| run-001 | C6 | Bộ lọc ngày + số HĐ duy nhất (R10, R4) | session | người vội (double submit) | - | Function, Data | BVA đầu mút filter; unique key qua form | explorer-2 (tester-2) |
| run-002 | C1 | Confirmation BUG-01/08/09: VAT, R2, R3 qua form sửa và CSV trước | confirmation | người cẩn thận; người vội dán từ Excel | - | Function, Data | BVA phần lẻ <0,5 ở 0/5/8%; half-up vs banker's; CRUD-U | tester-2 |
| run-002 | C2 | Confirmation BUG-02/03: tổng báo cáo 0/1/nhiều dòng, khoá sổ ở luồng sửa, month param lạ | confirmation | kế toán trưởng ngày chốt sổ; người cố tình phá | - | Function, Data, Time, Interfaces | Goldilocks/COUNT số dòng; Beginning/End; All the ways vào kỳ khoá | tester-2 |
| run-002 | C3 | Confirmation BUG-04/06/07: role × action × đường vào, id lạ, người tạo qua CSV, unique full-width | confirmation | nhân viên cố tình phá; kế toán trưởng bận | - | Function, Interfaces, Data | decision table; state table; error guessing id | tester-1 |
| run-002 | C4 | Confirmation BUG-05/10/11: giá trị lân cận parse số/ngày, filter đầu mút × status | confirmation | kế toán dán từ Excel; người cẩn thận | - | Data, Function, Time | BVA lân cận ca lỗi; follow the data; filter × status | tester-1 |
| run-002 | C5 | Recon /periods: bản đồ, state × event kỳ, quyền | recon | người mới; kế toán trưởng cuối tháng | - | Structure, Function, Operations | state × event table; decision table; absence | tester-1 |
| run-002 | C6 | Concurrency staff × manager trên cùng hoá đơn (trang duyệt cũ, tạo trùng đồng thời) | concurrency | kế toán trưởng nhiều tab; nhân viên vội | - | Time, Interfaces, Operations | stale page; interrupt bằng role khác; back/forward | tester-2 |
| run-002 | C7 | Upload file CSV theo thư viện biến thể (encoding, cấu trúc, HTML/công thức) | file | kế toán xuất Excel Windows; người cố tình phá | - | Interfaces, Platform, Data | Goldilocks file; B/M/E dòng lỗi; upload vs dán | tester-1 |
| run-002 | C8 | Fault-injection 500/timeout/offline khi tạo, sửa, import, duyệt | fault-injection | mạng yếu / máy cũ; người vội | - | Platform, Structure, Time | interrupt; error handling; consistency thông báo vs find | tester-2 |
| run-002 | C9 | Freestyle vòng đời hoá đơn → báo cáo; cặp: báo cáo×bookmark, chi tiết×đổi role, lọc×back, Tổng×cực lớn, đã duyệt×reload | freestyle | người mới; màn hình nhỏ/máy cũ | antisocial + all-nighter | Time, Operations, Platform | bookmark/back; absence; đổi tiêu điểm | tester-2 |
