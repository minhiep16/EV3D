# CHỈ MỤC MINH CHỨNG MÃ NGUỒN THỰC TẾ (SOURCE EVIDENCE INDEX V3)

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Tài liệu:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản Hoàn Thiện V3.0  
**Nguyên tắc:** Mọi tuyên bố kiến trúc, nghiệp vụ, thuật toán và cấu trúc dữ liệu đều được đối soát trực tiếp với mã nguồn thực tế tại `backend/` và `frontend/`.

---

## 1. Danh Mục 27 REST Controllers & Phân Hệ Cung Cấp API

| STT | Tên REST Controller | Đường Dẫn Cơ Sở (Base URL) | Số Endpoints | Phân Hệ Nghiệp Vụ Chuyên Trách | Tệp Nguồn Java |
|:---:|:---|:---|:---:|:---|:---|
| 1 | `AdminController` | `/api/admin` | 7 | Quản trị người dùng, gán quyền, thống kê Dashboard, duyệt nhóm | `admin/controller/AdminController.java` |
| 2 | `AiAssistantController` | `/api/ai` | 4 | Trợ lý ảo đối thoại, đề xuất câu hỏi, trạng thái mô hình | `ai/controller/AiAssistantController.java` |
| 3 | `AuthController` | `/api/auth` | 5 | Đăng nhập JWT, đăng ký, làm mới token, đăng xuất, lấy UserInfo | `auth/controller/AuthController.java` |
| 4 | `BatteryHealthController` | `/api/vehicles/{id}/battery-health` | 1 | Tra cứu sức khỏe pin, chu kỳ sạc, suy hao dung lượng | `vehicle/controller/BatteryHealthController.java` |
| 5 | `BookingController` | `/api/vehicles/{id}/bookings`, `/api/bookings` | 3 | Đặt xe, khử xung đột thời gian, hủy lịch, gia hạn nhanh | `booking/controller/BookingController.java` |
| 6 | `ChargingSessionController`| `/api/charging-sessions`, `/api/vehicles/{id}/...`| 7 | Bắt đầu sạc, cập nhật tiến độ, hoàn tất nạp kho WAC | `charging/controller/ChargingSessionController.java`|
| 7 | `ChargingStationController`| `/api/charging-stations` | 2 | Danh mục trụ sạc vật lý trong garage, công suất, đơn giá | `charging/controller/ChargingStationController.java`|
| 8 | `CoOwnershipContractController`| `/api/contracts` | 8 | Quản lý vòng đời hợp đồng, tạo version, ký số DEMO, kích hoạt | `contract/controller/CoOwnershipContractController.java`|
| 9 | `DamageController` | `/api/trips/{id}/damages`, `/api/vehicles/{id}/...`| 4 | Ghi nhận tổn hại thân vỏ, gắn tọa độ 3D Hotspot, tra cứu | `damage/controller/DamageController.java` |
| 10 | `DisputeController` | `/api/disputes` | 17 | Khiếu nại chi phí/sự cố, đính kèm bằng chứng, điều tra, bồi thường | `dispute/controller/DisputeController.java` |
| 11 | `EnergyInventoryController`| `/api/vehicles/{id}/energy-inventory` | 2 | Báo cáo tồn kho kWh điện, giá bình quân WAC, lịch sử giao dịch | `energy/controller/EnergyInventoryController.java` |
| 12 | `ExpenseController` | `/api/expenses`, `/api/vehicles/{id}/expenses`| 7 | Tạo khoản chi, phê duyệt, phân bổ theo vốn hoặc trách nhiệm lái | `expense/controller/ExpenseController.java` |
| 13 | `HealthController` | `/api/health` | 1 | Kiểm tra trạng thái sẵn sàng của máy chủ backend | `common/controller/HealthController.java` |
| 14 | `MaintenanceController` | `/api/maintenance` | 8 | Yêu cầu bảo dưỡng định kỳ/đột xuất, lập lệnh, cập nhật tiến độ | `maintenance/controller/MaintenanceController.java`|
| 15 | `MembershipInvitationController`| `/api/invitations` | 7 | Mời thành viên mới, cổ đông trích vốn, ký hợp đồng gia nhập | `ownership/controller/MembershipInvitationController.java`|
| 16 | `NotificationController` | `/api/notifications` | 4 | Danh sách thông báo thời gian thực, đánh dấu đã đọc | `notification/controller/NotificationController.java`|
| 17 | `OwnershipTransferController`| `/api/ownership-transfers`, `/api/co-ownership/...`| 13 | Đề xuất chuyển nhượng cổ phần, đồng thuận, duyệt, bảo toàn 100% | `ownership/controller/OwnershipTransferController.java`|
| 18 | `PersonalPaymentController`| `/api/personal-payments`, `/api/expenses/{id}/...`| 4 | Nộp chứng từ chuyển khoản DEMO, nhân viên xác minh tất toán nợ | `fund/controller/PersonalPaymentController.java` |
| 19 | `StaffApprovedWorkController`| `/api/staff/approved-work` | 4 | Nhân viên tiếp nhận công việc sửa chữa/bảo dưỡng đã được duyệt | `fleet/controller/StaffApprovedWorkController.java`|
| 20 | `TripController` | `/api/trips`, `/api/bookings/{id}/trip` | 18 | Check-in bắt đầu chuyến đi, đàm phán gia hạn, yêu cầu/chốt trả xe | `trip/controller/TripController.java` |
| 21 | `VehicleController` | `/api/vehicles` | 5 | Danh mục xe, cập nhật ODO/Pin, thông số kỹ thuật, analytics | `vehicle/controller/VehicleController.java` |
| 22 | `VehicleHandoverController`| `/api/handovers` | 3 | Biên bản bàn giao kỹ thuật ODO/Pin, chủ xe ký nhận điều kiện xe | `handover/controller/VehicleHandoverController.java`|
| 23 | `VehicleInspectionController`| `/api/inspections` | 5 | Kiểm định kỹ thuật đạt/không đạt, đánh giá chi tiết checklist | `inspection/controller/VehicleInspectionController.java`|
| 24 | `VoteProposalController` | `/api/vote-proposals` | 8 | Tạo đề xuất biểu quyết, bỏ phiếu theo trọng số vốn, kiểm phiếu | `vote/controller/VoteProposalController.java` |
| 25 | `PublicVehicleController` | `/api/public/vehicles` | 2 | Tra cứu thông tin xe công khai không yêu cầu token đăng nhập | `vehicle/controller/PublicVehicleController.java` |
| 26 | `PublicShowcaseController` | `/api/public/showcase` | 2 | Dữ liệu trình diễn không gian Garage 3D mẫu | `vehicle/controller/PublicShowcaseController.java` |
| 27 | `TelemetryIngressController`| `/api/telemetry/ingress` | 3 | Tiếp nhận dữ liệu viễn thông ODO, pin từ thiết bị mô phỏng | `telemetry/controller/TelemetryIngressController.java`|

---

## 2. Danh Mục 51 Thực Thể Cơ Sở Dữ Liệu Quan Hệ (JPA Entities)

| STT | Tên Bảng CSDL | Tên Lớp JPA Entity | Gói Java (Package) | Mục Đích Lưu Trữ Dữ Liệu |
|:---:|:---|:---|:---|:---|
| 1 | `users` | `User` | `com.evshare.user.entity` | Tài khoản, email, mật khẩu BCrypt, họ tên, vai trò RBAC |
| 2 | `roles` | `Role` | `com.evshare.user.entity` | Enum vai trò hệ thống (ADMIN, STAFF, CO_OWNER) |
| 3 | `refresh_tokens` | `RefreshToken` | `com.evshare.auth.entity` | Mã làm mới phiên đăng nhập gắn với người dùng |
| 4 | `audit_logs` | `AuditLog` | `com.evshare.admin.entity` | Nhật ký kiểm toán thao tác quản trị và an ninh |
| 5 | `vehicles` | `Vehicle` | `com.evshare.vehicle.entity` | Hồ sơ xe: biển số, VIN, ODO lũy kế, SOC pin, trạng thái |
| 6 | `vehicle_battery_health` | `VehicleBatteryHealth` | `com.evshare.vehicle.entity` | Chỉ số SOH, dung lượng khả dụng (kWh), số chu kỳ sạc |
| 7 | `vehicle_registration_drafts`| `VehicleRegistrationDraft`| `com.evshare.vehicle.entity` | Dự thảo hồ sơ đăng ký lưu hành xe |
| 8 | `co_ownership_groups` | `CoOwnershipGroup` | `com.evshare.ownership.entity` | Nhóm đồng sở hữu, tên nhóm, quy chế, số thành viên tối đa |
| 9 | `group_members` | `GroupMember` | `com.evshare.ownership.entity` | Thành viên nhóm, vai trò (LEADER, MEMBER), ngày gia nhập |
| 10 | `group_vehicles` | `GroupVehicle` | `com.evshare.ownership.entity` | Liên kết xe với nhóm đồng sở hữu (quy tắc 1 xe / 1 nhóm) |
| 11 | `group_discovery_settings` | `GroupDiscoverySetting`| `com.evshare.ownership.entity` | Cấu hình cho phép nhóm hiển thị công khai tìm thành viên |
| 12 | `group_invitations` | `GroupInvitation` | `com.evshare.ownership.entity` | Lời mời gia nhập nhóm đồng sở hữu ban đầu |
| 13 | `group_join_requests` | `GroupJoinRequest` | `com.evshare.ownership.entity` | Đơn xin gia nhập nhóm từ người dùng tự do |
| 14 | `ownership_shares` | `OwnershipShare` | `com.evshare.ownership.entity` | Tỷ lệ phần trăm sở hữu vốn của thành viên (Bất biến SUM=100%) |
| 15 | `ownership_change_history` | `OwnershipChangeHistory`| `com.evshare.ownership.entity` | Lịch sử chuyển dịch, tái phân bổ tỷ lệ sở hữu vốn |
| 16 | `ownership_transfer_requests`| `OwnershipTransferRequest`| `com.evshare.ownership.entity`| Yêu cầu chuyển nhượng cổ phần giữa các thành viên |
| 17 | `membership_invitations` | `MembershipInvitation` | `com.evshare.ownership.entity` | Thư mời gia nhập nhóm kèm điều khoản trích vốn cổ đông |
| 18 | `membership_withdrawal_requests`| `MembershipWithdrawalRequest`| `com.evshare.ownership.entity`| Đơn xin rút lui khỏi nhóm đồng sở hữu |
| 19 | `bookings` | `Booking` | `com.evshare.booking.entity` | Lịch đặt xe: thời gian bắt đầu, kết thúc, trạng thái CONFIRMED |
| 20 | `vehicle_handovers` | `VehicleHandover` | `com.evshare.handover.entity` | Biên bản bàn giao kỹ thuật: ODO xuất phát, pin, chữ ký nhận |
| 21 | `trips` | `Trip` | `com.evshare.trip.entity` | Chu trình hành trình: ODO/Pin lúc đi và trả, điện năng tiêu thụ |
| 22 | `trip_extension_requests` | `TripExtensionRequest` | `com.evshare.trip.entity` | Yêu cầu gia hạn chuyến đi và tiến trình đàm phán người kế tiếp |
| 23 | `vehicle_inspections` | `VehicleInspection` | `com.evshare.inspection.entity`| Biên bản kiểm tra kỹ thuật tổng thể (PASSED / FAILED) |
| 24 | `vehicle_inspection_items` | `VehicleInspectionItem`| `com.evshare.inspection.entity`| Chi tiết hạng mục kiểm tra (lốp, phanh, đèn, kính chắn gió) |
| 25 | `damage_records` | `DamageRecord` | `com.evshare.damage.entity` | Vết hư hại thân vỏ: bộ phận, mức độ, tọa độ 3D Hotspot |
| 26 | `charging_stations` | `ChargingStation` | `com.evshare.charging.entity` | Trụ sạc thông minh trong garage: loại cổng, công suất, đơn giá |
| 27 | `charging_sessions` | `ChargingSession` | `com.evshare.charging.entity` | Phiên sạc pin: điện nạp thô, điện lưu kho (92%), tổn hao (8%) |
| 28 | `vehicle_energy_inventories` | `VehicleEnergyInventory`| `com.evshare.energy.entity` | Kho điện của xe: số kWh khả dụng, tổng giá trị, giá bình quân WAC |
| 29 | `vehicle_energy_transactions`| `VehicleEnergyTransaction`| `com.evshare.energy.entity`| Giao dịch nạp sạc (INFLOW) và xuất kho chuyến đi (TRIP_CONSUMPTION)|
| 30 | `expenses` | `Expense` | `com.evshare.expense.entity` | Khoản chi phí phát sinh: số tiền, danh mục, chính sách phân bổ |
| 31 | `expense_shares` | `ExpenseShare` | `com.evshare.expense.entity` | Nghĩa vụ nợ chi tiết của từng chủ sở hữu (Hare-Niemeyer rounding)|
| 32 | `expense_approvals` | `ExpenseApproval` | `com.evshare.expense.entity` | Lịch sử phê duyệt khoản chi phí của ban quản trị |
| 33 | `personal_expense_payments` | `PersonalExpensePayment`| `com.evshare.fund.entity` | Bản ghi thanh toán cá nhân DEMO và nhân viên xác minh |
| 34 | `shared_funds` | `SharedFund` | `com.evshare.fund.entity` | Quỹ chung (Bảo lưu cấu trúc dữ liệu di sản / chế độ dự phòng) |
| 35 | `fund_contributions` | `FundContribution` | `com.evshare.fund.entity` | Đóng góp quỹ chung (Dữ liệu lịch sử) |
| 36 | `fund_transactions` | `FundTransaction` | `com.evshare.fund.entity` | Giao dịch tài chính quỹ chung (Dữ liệu lịch sử) |
| 37 | `maintenance_requests` | `MaintenanceRequest` | `com.evshare.maintenance.entity`| Lệnh bảo dưỡng kỹ thuật: định kỳ, sửa chữa, thay thế phụ tùng |
| 38 | `maintenance_approval_votes`| `MaintenanceApprovalVote`| `com.evshare.maintenance.entity`| Phiếu biểu quyết thông qua kế hoạch bảo dưỡng xe |
| 39 | `co_ownership_contracts` | `CoOwnershipContract` | `com.evshare.contract.entity` | Hợp đồng đồng sở hữu xe gốc |
| 40 | `co_ownership_contract_versions`| `CoOwnershipContractVersion`| `com.evshare.contract.entity`| Phiên bản hợp đồng pháp lý (DRAFT -> ACTIVE -> SUPERSEDED) |
| 41 | `contract_acceptances` | `ContractAcceptance` | `com.evshare.contract.entity` | Chữ ký số mô phỏng (DEMO Signature) và thời điểm ký của chủ xe |
| 42 | `vote_proposals` | `VoteProposal` | `com.evshare.vote.entity` | Đề xuất biểu quyết tập thể: nội dung, quy tắc MAJORITY, hạn chót |
| 43 | `proposal_votes` | `ProposalVote` | `com.evshare.vote.entity` | Phiếu bầu của thành viên (FOR/AGAINST) với trọng số % cổ phần |
| 44 | `proposal_vote_eligibility` | `ProposalVoteEligibility`| `com.evshare.vote.entity` | Danh sách cử tri hợp lệ và tỷ lệ quyền biểu quyết |
| 45 | `disputes` | `Dispute` | `com.evshare.dispute.entity` | Hồ sơ khiếu nại tranh chấp sự cố / tiền điện / tổn hại xe |
| 46 | `dispute_participants` | `DisputeParticipant` | `com.evshare.dispute.entity` | Các bên tham gia vào quá trình tranh chấp |
| 47 | `dispute_evidence` | `DisputeEvidence` | `com.evshare.dispute.entity` | Bằng chứng biên lai, hình ảnh đính kèm hồ sơ khiếu nại |
| 48 | `dispute_messages` | `DisputeMessage` | `com.evshare.dispute.entity` | Lời thoại trao đổi hòa giải giữa chủ xe và nhân viên |
| 49 | `dispute_compensations` | `DisputeCompensation` | `com.evshare.dispute.entity` | Quyết định bồi thường hòa giải được xác lập |
| 50 | `dispute_compensation_payments`| `DisputeCompensationPayment`| `com.evshare.dispute.entity`| Giao dịch chi trả bồi thường mô phỏng (DEMO Compensation) |
| 51 | `notifications` | `Notification` | `com.evshare.notification.entity`| Thông báo hệ thống gửi đến người dùng theo sự kiện |
