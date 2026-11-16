# CHỈ MỤC MINH CHỨNG MÃ NGUỒN THỰC TẾ (SOURCE EVIDENCE INDEX V4)

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Tài liệu:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản V4 (Hoàn thiện Kiểm toán Chất lượng & Tính Nhất quán Kỹ thuật)  
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
| 37 | `group_funds` | `GroupFund` | `com.evshare.fund.entity` | Quỹ chung của nhóm đồng sở hữu, số dư tiền mặt khả dụng |
| 38 | `fund_transactions` | `FundTransaction` | `com.evshare.fund.entity` | Lịch sử biến động thu chi của quỹ chung nhóm |
| 39 | `personal_payments` | `PersonalPayment` | `com.evshare.fund.entity` | Khoản nộp tiền của cá nhân thanh toán nợ chi phí |
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

## 3. Minh Chứng Thành Phần Đồ Họa 3D Frontend (WebGL / Three.js)

| STT | Thành phần giao diện / Logic | Tệp nguồn TypeScript/React | Vai trò kỹ thuật & Cơ chế hoạt động |
|:---:|:---|:---|:---|
| 1 | Garage 3D Canvas Viewport | `src/components/garage/GarageCanvas.tsx` | Khởi tạo Canvas React Three Fiber, quản lý ánh sáng PBR, môi trường HDR |
| 2 | Bộ nạp mô hình xe GLB | `src/components/garage/VehicleModel.tsx` | Sử dụng hook `useGLTF` nạp mô hình 3D, traverse các Mesh linh kiện |
| 3 | Điều hướng quỹ đạo OrbitControls | `src/components/garage/CameraManager.tsx` | Quản lý góc nhìn camera OrbitControls, giới hạn khoảng cách zoom và góc xoay |
| 4 | Chế độ X-Ray soi pin | `src/components/garage/XRayController.tsx` | Thay đổi vật liệu Mesh sang trong suốt (opacity 0.15) và làm phát xạ khối pin |
| 5 | Điểm nóng Hotspot tổn hại | `src/components/garage/DamageHotspots.tsx` | Chiếu tọa độ 3D `[x,y,z]` lên màn hình 2D bằng `Vector3.project(camera)` |
| 6 | Quản lý trạng thái Garage Store | `src/store/useGarageStore.ts` | Zustand store lưu trữ index xe chọn, chế độ inspect, camera position, x-ray flag |
| 7 | Thanh trượt Carousel chọn xe | `src/components/garage/VehicleCarousel.tsx` | Thanh điều khiển trượt ngang danh sách xe, kích hoạt hiệu ứng xoay chuyển cảnh |
| 8 | Bảng điều khiển tác vụ nhanh | `src/components/garage/GarageActionDock.tsx` | Floating dock tương tác: Reset camera, Bóc tách linh kiện, X-Ray, Xem lịch |

---

## 4. Minh Chứng Thuật Toán Nghiệp Vụ Cốt Lõi Backend

| STT | Tên Thuật Toán / Nghiệp Vụ | Tệp Nguồn Java Chuyên Trách | Đoạn Mã / Phương Thức Cốt Lõi |
|:---:|:---|:---|:---|
| 1 | Giá vốn bình quân gia quyền (WAC) | `energy/service/EnergyInventoryService.java` | Phương thức `calculateWacUnitCost()`: tính đơn giá bình quân dựa trên tồn kho cũ và đợt sạc mới kèm hiệu suất 92% |
| 2 | Phân bổ chi phí Hare-Niemeyer | `expense/service/ExpenseSplitService.java` | Phương thức `splitExpenseHareNiemeyer()`: chia nguyên phần nguyên, sắp xếp phần dư giảm dần, cộng 1 VND đến khi khớp 100% |
| 3 | Khử xung đột lịch đặt xe (Overlap) | `booking/service/BookingService.java` | Câu truy vấn JPA `findConflictingBookings()`: kiểm tra giao nhau `startA < endB AND startB < endA` với khoảng đệm Buffer |
| 4 | Bảo toàn 100% cổ phần nhóm | `ownership/service/OwnershipTransferService.java` | Kiểm tra bất biến `SUM(shares) == 100.0000%` với ngưỡng epsilon `1e-4` trước khi Commit giao dịch |
| 5 | Kiểm phiếu biểu quyết theo trọng số | `vote/service/VoteProposalService.java` | Tính tổng `voteWeight` theo tỷ lệ cổ phần của từng thành viên, kiểm tra ngưỡng Quorum và Approval Threshold |

---

## 5. Minh Chứng 14 Nhóm Kiểm Thử Hồi Quy Lịch Sử (TC-REG-01 đến 31)

| STT | Nhóm Kiểm Thử Hồi Quy | Phạm Vi Ca Kiểm Thử | Tệp Nguồn Thực Tế Được Đối Soát |
|:---:|:---|:---:|:---|
| 1 | Khung chuẩn hóa giao diện Panel | `TC-REG-01`, `TC-REG-02` | `src/components/common/StandardPanelShell.tsx` |
| 2 | Bảng điều khiển hành trình thời gian thực | `TC-REG-03`, `TC-REG-04` | `src/components/trip/ActiveTripDetailPanel.tsx` |
| 3 | Tối ưu hóa chu kỳ render React Hook | `TC-REG-05`, `TC-REG-06` | `src/hooks/useTripCountdown.ts` |
| 4 | Đồng bộ hóa DTO phản hồi xe | `TC-REG-07`, `TC-REG-08` | `com.evshare.vehicle.dto.VehicleResponse.java` |
| 5 | Giao dịch kết thúc chuyến đi và giải phóng xe | `TC-REG-09`, `TC-REG-10` | `com.evshare.trip.service.TripService.java` |
| 6 | Đàm phán gia hạn chuyến đi không xung đột | `TC-REG-11`, `TC-REG-12` | `com.evshare.trip.service.TripNegotiationService.java` |
| 7 | Hạch toán tồn kho năng lượng WAC | `TC-REG-13`, `TC-REG-14` | `com.evshare.energy.service.EnergyInventoryService.java` |
| 8 | Phân bổ chi phí và làm tròn Hare-Niemeyer | `TC-REG-15`, `TC-REG-16` | `com.evshare.expense.service.ExpenseSplitService.java` |
| 9 | Quản lý vòng đời hợp đồng đồng sở hữu | `TC-REG-17`, `TC-REG-18` | `com.evshare.contract.service.CoOwnershipContractService.java` |
| 10 | Bỏ phiếu biểu quyết theo trọng số vốn | `TC-REG-19`, `TC-REG-20` | `com.evshare.vote.service.VoteProposalService.java` |
| 11 | Quy trình hòa giải và giải quyết tranh chấp | `TC-REG-21`, `TC-REG-22` | `com.evshare.dispute.service.DisputeService.java` |
| 12 | Biên bản bàn giao kỹ thuật số hai bên | `TC-REG-23`, `TC-REG-24` | `com.evshare.handover.service.VehicleHandoverService.java` |
| 13 | Quản lý trụ sạc và phiên sạc pin | `TC-REG-25`, `TC-REG-26` | `com.evshare.charging.service.ChargingSessionService.java` |
| 14 | Kiểm soát truy cập phân quyền Spring Security | `TC-REG-27`..`TC-REG-31` | `com.evshare.common.config.SecurityConfig.java` |

---
*Tài liệu Chỉ mục Minh chứng Mã nguồn V4 hoàn thành đối soát 100% với cấu trúc mã nguồn thực tế của dự án EVShare 3D.*
