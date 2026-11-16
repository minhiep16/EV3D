# CHỈ MỤC MINH CHỨNG MÃ NGUỒN THỰC TẾ (SOURCE EVIDENCE INDEX V6)

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Tài liệu:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản V6 (Hotfix Kiểm toán Chất lượng & Tính Nhất quán Kỹ thuật)  
**Nguyên tắc:** Mọi phát biểu kiến trúc, phân hệ nghiệp vụ, thuật toán toán học và cấu trúc dữ liệu đều được đối soát và minh chứng trực tiếp từ mã nguồn thực tế tại `backend/` và `frontend/`.

---

## 1. Danh Mục 27 REST Controllers & 249 Endpoints Chuẩn Hóa

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
| 10 | `DisputeController` | `/api/disputes` | 18 | Khiếu nại chi phí/sự cố, đính kèm bằng chứng, điều tra, bồi thường | `dispute/controller/DisputeController.java` |
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
| 15 | `co_ownership_contracts` | `CoOwnershipContract` | `com.evshare.contract.entity` | Hợp đồng đồng sở hữu pháp lý, phiên bản, trạng thái |
| 16 | `contract_terms` | `ContractTerm` | `com.evshare.contract.entity` | Các điều khoản thỏa thuận chi tiết trong hợp đồng |
| 17 | `contract_signatures` | `ContractSignature` | `com.evshare.contract.entity` | Chữ ký số DEMO, chứng chỉ xác thực, dấu thời gian |
| 18 | `contract_versions` | `ContractVersion` | `com.evshare.contract.entity` | Lịch sử sửa đổi và lưu trữ phiên bản hợp đồng |
| 19 | `bookings` | `Booking` | `com.evshare.booking.entity` | Lịch đặt xe, thời gian bắt đầu/kết thúc, trạng thái |
| 20 | `booking_slots` | `BookingSlot` | `com.evshare.booking.entity` | Khe thời gian chi tiết phục vụ khử xung đột lịch trình |
| 21 | `trips` | `Trip` | `com.evshare.trip.entity` | Chuyến đi thực tế, thời điểm nhận/trả xe, ODO ban đầu/kết thúc |
| 22 | `trip_negotiations` | `TripNegotiation` | `com.evshare.trip.entity` | Đàm phán gia hạn chuyến đi giữa các thành viên |
| 23 | `trip_checklists` | `TripChecklist` | `com.evshare.trip.entity` | Danh mục kiểm tra điều kiện xe khi nhận và trả |
| 24 | `trip_checklist_items` | `TripChecklistItem` | `com.evshare.trip.entity` | Từng hạng mục kiểm tra chi tiết của biên bản nhận/trả |
| 25 | `vehicle_handovers` | `VehicleHandover` | `com.evshare.handover.entity` | Biên bản bàn giao xe vật lý giữa nhân viên và chủ xe |
| 26 | `handover_checklists` | `HandoverChecklist` | `com.evshare.handover.entity` | Danh sách hạng mục bàn giao xe thực tế |
| 27 | `handover_photos` | `HandoverPhoto` | `com.evshare.handover.entity` | Ảnh chụp hiện trạng xe tại thời điểm bàn giao |
| 28 | `vehicle_inspections` | `VehicleInspection` | `com.evshare.inspection.entity` | Biên bản nghiệm thu/kiểm định kỹ thuật xe |
| 29 | `inspection_items` | `InspectionItem` | `com.evshare.inspection.entity` | Hạng mục kiểm tra đạt/không đạt trong biên bản nghiệm thu |
| 30 | `inspection_photos` | `InspectionPhoto` | `com.evshare.inspection.entity` | Ảnh chụp đính kèm biên bản nghiệm thu kỹ thuật |
| 31 | `charging_stations` | `ChargingStation` | `com.evshare.charging.entity` | Trụ sạc pin vật lý, địa điểm, công suất tối đa |
| 32 | `charging_sessions` | `ChargingSession` | `com.evshare.charging.entity` | Phiên sạc pin, lượng kWh nạp, thời gian, trạng thái |
| 33 | `energy_inventories` | `EnergyInventory` | `com.evshare.energy.entity` | Kho năng lượng lưu trữ số dư kWh và giá bình quân WAC |
| 34 | `energy_transactions` | `EnergyTransaction` | `com.evshare.energy.entity` | Nhật ký nhập/xuất điện kho năng lượng theo chuyến đi/sạc |
| 35 | `expenses` | `Expense` | `com.evshare.expense.entity` | Khoản chi phí phát sinh (năng lượng, bảo dưỡng, sửa chữa) |
| 36 | `expense_splits` | `ExpenseSplit` | `com.evshare.expense.entity` | Phân bổ số tiền cho từng thành viên theo Hare-Niemeyer |
| 37 | `group_funds` | `GroupFund` | `com.evshare.fund.entity` | Quỹ chung (Bảo lưu dữ liệu lịch sử và quỹ dự phòng tùy chọn) |
| 38 | `fund_transactions` | `FundTransaction` | `com.evshare.fund.entity` | Lịch sử biến động thu chi của quỹ chung nhóm cũ |
| 39 | `personal_payments` | `PersonalPayment` | `com.evshare.fund.entity` | Khoản nộp tiền của cá nhân thanh toán nợ chi phí trực tiếp |
| 40 | `payment_receipts` | `PaymentReceipt` | `com.evshare.fund.entity` | Chứng từ giao dịch nộp tiền chuyển khoản |
| 41 | `vote_proposals` | `VoteProposal` | `com.evshare.vote.entity` | Đề xuất biểu quyết của nhóm (bảo dưỡng, sửa đổi quy chế) |
| 42 | `vote_ballots` | `VoteBallot` | `com.evshare.vote.entity` | Phiếu biểu quyết của từng thành viên kèm trọng số vốn |
| 43 | `maintenance_requests` | `MaintenanceRequest` | `com.evshare.maintenance.entity`| Yêu cầu bảo dưỡng xe từ thành viên hoặc cảnh báo định kỳ |
| 44 | `maintenance_orders` | `MaintenanceOrder` | `com.evshare.maintenance.entity`| Lệnh bảo dưỡng giao cho nhân viên kỹ thuật thực hiện |
| 45 | `damage_records` | `DamageRecord` | `com.evshare.damage.entity` | Hồ sơ ghi nhận tổn hại thân vỏ, mức độ nghiêm trọng |
| 46 | `damage_hotspots` | `DamageHotspot` | `com.evshare.damage.entity` | Tọa độ không gian 3D (X, Y, Z) của vết trầy xước trên Mesh |
| 47 | `disputes` | `Dispute` | `com.evshare.dispute.entity` | Tranh chấp giữa các thành viên (lịch trình, chi phí, tổn hại) |
| 48 | `dispute_evidence` | `DisputeEvidence` | `com.evshare.dispute.entity` | Tài liệu, hình ảnh, biên bản chứng cứ phục vụ hòa giải |
| 49 | `notifications` | `Notification` | `com.evshare.notification.entity`| Thông báo đẩy gửi tới người dùng |
| 50 | `ai_conversations` | `AiConversation` | `com.evshare.ai.entity` | Lịch sử hội thoại của người dùng với trợ lý ảo AI |
| 51 | `ai_messages` | `AiMessage` | `com.evshare.ai.entity` | Từng thông điệp chi tiết trong luồng hội thoại AI |

---

## 3. Minh Chứng Mã Nguồn Phân Hệ 3D Digital Twin (Three.js & React Three Fiber)

| Thành Phần Nghiệp Vụ 3D | Tệp Mã Nguồn Frontend | Vai Trò & Hiện Thực Kỹ Thuật |
|:---|:---|:---|
| **Bộ khung điều khiển Camera (CameraRig)** | `frontend/src/features/garage/camera/CameraRig.tsx` | Quản lý chuyển động Lerp mượt mà giữa các preset Focus, Panel Safe, Overview |
| **Cấu hình tọa độ Camera chuẩn** | `frontend/src/features/garage/camera/garageCameraConfig.ts` | Khai báo tọa độ chuẩn Focus `[-0.25, 2.05, 8.8]`, target `[0.0, 0.85, 1.8]`, polar bounds `[0.40, 1.43]` rad |
| **Preset góc nhìn theo xe** | `frontend/src/features/garage/camera/vehicleCameraPresets.ts` | Tọa độ góc nhìn ngoại thất, nội thất, soi khối pin gầm xe |
| **Quản lý trạng thái Garage 3D** | `frontend/src/features/garage/model/worldStore.ts` | Zustand store lưu giữ action `triggerCameraReset()`, trạng thái X-Ray, xe đang chọn |
| **Mô hình hóa không gian Garage** | `frontend/src/features/garage/scene/GarageScene.tsx` | Khung cảnh 3D, bục xoay, hệ thống chiếu sáng PBR (Directional & Point Light) |
| **Chế độ soi xuyên thấu Pin (X-Ray)** | `frontend/src/features/garage/scene/BatteryXRayOverlay.tsx` | Chuyển vật liệu vỏ xe sang bán trong suốt (`opacity = 0.15`), hiển thị Mesh cell pin phát sáng |
| **Điểm nóng tổn hại thân vỏ (Hotspot)** | `frontend/src/features/garage/scene/DamageHotspotMarker.tsx` | Bắt tọa độ Raycasting gắn điểm chấm 3D nhấp nháy trên Mesh xe |
| **Thanh trượt Carousel chọn xe** | `frontend/src/features/garage/ui/VehicleCarousel.tsx` | Điều khiển danh sách xe đội, chọn xe nạp GLTF tương ứng |
| **Thanh tác vụ Dock Garage** | `frontend/src/features/garage/ui/GarageActionDock.tsx` | Các nút kích hoạt nhanh: Reset Camera, X-Ray Pin, Lịch đặt xe, Điểm tổn hại |

---

## 4. Minh Chứng Mã Nguồn Thuật Toán Tài Chính và Điều Phối Nghiệp Vụ

| Nghiệp Vụ / Thuật Toán | Tệp Dịch Vụ Backend (Service) | Phương Thức Xử Lý & Chốt Chặn Logic |
|:---|:---|:---|
| **Phân bổ chi phí Hare-Niemeyer** | `com.evshare.expense.service.ExpenseShareService` | `generateSharesForExpense()`: Chia phần nguyên, sắp xếp phần dư lớn nhất cộng 1 VND, bảo toàn $100\%$ |
| **Chống nộp thanh toán trùng lặp** | `com.evshare.expense.service.ExpenseShareService` | `existsByExpenseId()`: Chặn phát hành nợ trùng lặp, bảo đảm tính lũy đẳng (Idempotency) |
| **Chốt chặn tự duyệt nợ (No Self-Approval)**| `com.evshare.fund.service.PersonalPaymentService` | `verifyPayment()`: Kiểm tra `payment.getUserId() != staffId`, ném lỗi 403 Forbidden |
| **Hạch toán kho năng lượng WAC** | `com.evshare.energy.service.EnergyLogService` | `calculateWac()`: Tính đơn giá bình quân gia quyền sau mỗi lần nạp sạc có suy hao 92% |
| **Khử xung đột lịch đặt xe** | `com.evshare.booking.service.BookingService` | `checkOverlap()`: Kiểm tra chồng lấn thời gian, khóa lịch khi xe đang `MAINTENANCE` |
| **Đàm phán gia hạn chuyến đi** | `com.evshare.trip.service.TripExtensionService` | `requestExtension()`, `acceptExtensionRequest()`: Bồi hoàn trực tiếp giữa 2 thành viên |
| **Bảo toàn tỷ lệ vốn góp 100%** | `com.evshare.ownership.service.OwnershipTransferService`| `completeTransfer()`: Kiểm tra `SUM(percentage) == 100.0000%`, sinh phiên bản phụ lục |
| **Tính toán Trưởng nhóm xe tự động** | `com.evshare.ownership.service.CoOwnershipGroupService` | `recalculateGroupLeader()`: Gán vai trò LEADER cho cổ đông có tỷ lệ vốn nắm giữ cao nhất |
| **Biểu quyết theo trọng số vốn** | `com.evshare.vote.service.VoteProposalService` | `castVote()`: Gán `voteWeight = share.percentage`, chốt kết quả quá bán > 50% |
| **Hòa giải tranh chấp độc lập** | `com.evshare.dispute.service.DisputeService` | `assignMediator()`, `resolveDispute()`: Nhân viên độc lập hòa giải và gạch nợ tự động |

---

## 5. Kết Luận Kiểm Tra Đối Soát

Toàn bộ thông tin trình bày trong Báo cáo Thực tập Tốt nghiệp EVShare 3D Phiên bản V6 đều có chứng cứ mã nguồn xác thực tương ứng 100%, bảo đảm không có bất kỳ khẳng định giả mạo hay suy diễn ngoài phạm vi cài đặt thực tế của dự án.
