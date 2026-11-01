# Project profile - <project>

## Test environment
- URL:
- Allowed origin(s):
- Auth: form login / SSO / MFA (cách agent đăng nhập: storage-state, TOTP secret trong .env, MFA tắt cho test account)
- Read-only API/DB cho automated test oracle:
- Data reset: lệnh / script reset test data trước mỗi test cycle (khai báo trong run.config.json)
- Data budget: số record tối đa mỗi agent mỗi cycle

## Purpose of the system
<hệ thống dùng để làm gì, ai dùng>

## Roles
| Role | Permissions |
|---|---|

## Terms (domain glossary)
-

## Business rules (test oracle) - mỗi defect phải trích ít nhất 1 rule (hoặc 1 generic / consistency oracle, xem skill mục 6)
- **R1** ...

## Pending confirmation (chưa được QA/BA duyệt, KHÔNG dùng để kết luận defect)
-

## Product risks (risk-based testing, ưu tiên)
-

## Business flows (chi tiết: business-flows.md)
| Flow | Steps / roles | Setup bằng API/fixture được không |
|---|---|---|

## External dependencies (chi tiết: external-dependencies.md)
| Dependency | Trên test env | Cách quan sát | Test double |
|---|---|---|---|

## File artifacts (chi tiết: file-artifacts.md)
| Upload/Download | Format, encoding | Phải khớp với |
|---|---|---|

## Time & non-determinism
- Timezone của server / hiển thị:
- Rule phụ thuộc ngày giờ:
- Xử lý bất đồng bộ (job, queue) và thời gian chờ tối đa:

## Out of scope
- (performance, security pentest, mobile native... nếu không test)

## Forbidden actions
-
