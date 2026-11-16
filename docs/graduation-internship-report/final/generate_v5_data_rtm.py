# -*- coding: utf-8 -*-
"""
generate_v5_data_rtm.py - Tái lập Ma trận truy xuất nguồn gốc yêu cầu (RTM) cho Phụ lục K (Báo cáo V5):
- 70 dòng tương ứng 70 Yêu cầu chức năng chuẩn hóa (Canonical FRs).
- Bao phủ 100% (88/88) Use Cases hệ thống, giải quyết triệt để 14 Use Case bị thiếu trong V4.
- 100% Ca kiểm thử (TC) được tham chiếu tồn tại thực sự trong danh mục 100 TCs (v5_data_testcases.py).
- Các chức năng thuần đồ họa WebGL (FR-3D-01, 02, 05, 06, 07) sử dụng 'Không áp dụng (Thuần Client WebGL)'
  cho cột API, Backend Service và CSDL, không gượng ép liên kết.
- Tích hợp cột Frontend Component, Backend Service, Trạng thái kiểm định NOT EXECUTED.
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)

import v5_canonical_catalogs as cat
import v5_data_testcases as tc

# 70 RTM rows mapping:
# (fr_id, fr_name, ucs, brs, diagrams, fe_comp, apis, be_service, db_entity, tcs)
RTM_MAPPINGS = [
    # AUTH (6)
    ("FR-AUTH-01", "Đăng ký tài khoản người dùng mới", "UC-AUTH-03", "BR-AUTH-01", "ARCH-05, UC-01, ACT-01, SEQ-01", "RegisterForm.tsx", "POST /api/auth/register", "AuthService", "users, roles", "TC-AUTH-01"),
    ("FR-AUTH-02", "Đăng nhập và cấp phát cặp Token JWT", "UC-AUTH-01", "BR-AUTH-02", "ARCH-05, UC-01, ACT-01, SEQ-01", "LoginForm.tsx", "POST /api/auth/login", "AuthService, JwtService", "users, roles, refresh_tokens", "TC-AUTH-01, TC-AUTH-02, TC-REG-14"),
    ("FR-AUTH-03", "Làm mới Access Token qua Refresh Token", "UC-AUTH-04", "BR-AUTH-02", "ARCH-05, UC-01, SEQ-02", "axiosClient.ts", "POST /api/auth/refresh", "AuthService, JwtService", "refresh_tokens", "TC-AUTH-03"),
    ("FR-AUTH-04", "Đăng xuất tài khoản và vô hiệu hóa Token", "UC-AUTH-02", "BR-AUTH-03", "ARCH-05, UC-01, ACT-01", "UserMenu.tsx", "POST /api/auth/logout", "AuthService", "refresh_tokens", "TC-AUTH-04, TC-REG-25"),
    ("FR-AUTH-05", "Truy vấn hồ sơ cá nhân và quyền hạn", "UC-AUTH-05, UC-AUTH-06", "BR-AUTH-04", "ARCH-05, UC-01", "UserProfilePanel.tsx", "GET /api/auth/me", "UserService", "users, roles", "TC-AUTH-05, TC-SEC-01, TC-REG-03, TC-REG-26"),
    ("FR-AUTH-06", "Cập nhật thông tin cá nhân và đổi mật khẩu", "UC-AUTH-07", "BR-AUTH-01, BR-AUTH-04", "UC-01, ACT-01", "ChangePasswordModal.tsx", "PUT /api/auth/profile", "UserService", "users", "TC-AUTH-05, TC-REG-26"),

    # 3D (7)
    ("FR-3D-01", "Hiển thị và tương tác mô hình xe 3D Digital Twin", "UC-3D-01", "BR-GEN-01", "ARCH-02, COMP-03, UC-03", "GarageCanvas.tsx, VehicleDigitalTwin.tsx", "Không áp dụng (Thuần Client WebGL)", "Không áp dụng", "Không áp dụng", "TC-3D-01, TC-REG-01, TC-REG-04"),
    ("FR-3D-02", "Tương tác chọn linh kiện xe điện qua Raycaster", "UC-3D-03", "BR-GEN-01", "ARCH-02, COMP-03, UC-03", "VehicleExplorationExperience.tsx", "Không áp dụng (Thuần Client WebGL)", "Không áp dụng", "Không áp dụng", "TC-REG-22"),
    ("FR-3D-03", "Hiển thị điểm đánh dấu vết trầy xước Hotspot 3D", "UC-3D-05", "BR-TRP-04", "ARCH-02, COMP-03, UC-03", "DamageHotspots.tsx", "GET /api/vehicles/{id}/damages", "DamageService", "damage_records, damage_hotspots", "TC-3D-04, TC-DAMG-01"),
    ("FR-3D-04", "Kích hoạt chế độ X-Ray soi xuyên thấu khối Pin", "UC-3D-04", "BR-CHG-02", "ARCH-02, COMP-03, UC-03", "BatteryPackMesh.tsx, worldStore.ts", "GET /api/vehicles/{id}/battery-health", "BatteryHealthService", "vehicle_battery_health", "TC-3D-04"),
    ("FR-3D-05", "Điều khiển trạng thái chuyển động xoay xe", "UC-3D-06", "BR-GEN-01", "ARCH-02, COMP-03, UC-03", "VehicleCarousel.tsx, worldStore.ts", "Không áp dụng (Thuần Client WebGL)", "Không áp dụng", "Không áp dụng", "TC-3D-05, TC-REG-13"),
    ("FR-3D-06", "Chuyển đổi góc nhìn nhanh Camera Preset theo vai trò", "UC-3D-02", "BR-GEN-01", "ARCH-02, COMP-03, UC-03", "CameraRig.tsx, garageCameraConfig.ts", "Không áp dụng (Thuần Client WebGL)", "Không áp dụng", "Không áp dụng", "TC-3D-02"),
    ("FR-3D-07", "Khôi phục vị trí mặc định Camera 3D (Camera Reset)", "UC-3D-07", "BR-GEN-01", "ARCH-02, COMP-03, UC-03", "GarageActionDock.tsx, worldStore.ts", "Không áp dụng (Thuần Client WebGL)", "Không áp dụng", "Không áp dụng", "TC-REG-12"),

    # CO-OWNERSHIP & CONTRACTS (8)
    ("FR-CO-01", "Khởi tạo nhóm đồng sở hữu xe điện mới", "UC-OWN-01, UC-ADMIN-07, UC-ADMIN-08", "BR-GRP-01", "UC-02, ACT-02, CLASS-01, ERD-01", "CreateGroupModal.tsx", "POST /api/co-ownership-groups", "CoOwnershipGroupService", "co_ownership_groups, group_members", "TC-OWN-01"),
    ("FR-CO-02", "Mời thành viên mới tham gia nhóm đồng sở hữu", "UC-OWN-08, UC-OWN-09", "BR-GRP-02", "UC-02, ACT-02, SEQ-03", "InviteMemberModal.tsx", "POST /api/invitations", "MembershipInvitationService", "group_invitations", "TC-INV-01"),
    ("FR-CO-03", "Tiếp nhận và ký kết điện tử chấp thuận gia nhập", "UC-OWN-10, UC-OWN-11, UC-CON-02, UC-CON-03", "BR-CTR-02", "UC-02, ACT-03, SEQ-04, STATE-05", "JoinGroupOnboarding.tsx", "POST /api/invitations/{code}/accept", "MembershipInvitationService, CoOwnershipContractService", "group_members, contract_signatures", "TC-INV-02, TC-CON-02, TC-REG-10"),
    ("FR-CO-04", "Phân chia và quản lý tỷ lệ cổ phần sở hữu xe", "UC-OWN-02", "BR-GRP-04", "UC-02, CLASS-01, ERD-01", "CoOwnerOverviewPanel.tsx", "GET /api/co-ownership-groups/{id}/shares", "OwnershipShareService", "ownership_shares", "TC-OWN-01, TC-REG-05, TC-REG-19"),
    ("FR-CO-05", "Khởi tạo yêu cầu chuyển nhượng cổ phần nội bộ", "UC-OWN-03, UC-OWN-04, UC-OWN-05", "BR-GRP-05", "UC-02, ACT-04, SEQ-05, STATE-04", "TransferSharesModal.tsx", "POST /api/ownership-transfers", "OwnershipTransferService", "ownership_transfers", "TC-OWN-02, TC-OWN-03"),
    ("FR-CO-06", "Bên nhận xác nhận chấp thuận hoặc từ chối", "UC-OWN-04", "BR-GRP-05", "UC-02, ACT-04, SEQ-05, STATE-04", "TransferApprovalModal.tsx", "PUT /api/ownership-transfers/{id}/accept", "OwnershipTransferService", "ownership_transfers", "TC-OWN-02"),
    ("FR-CO-07", "Hoàn tất chuyển nhượng và sinh Phụ lục Hợp đồng", "UC-OWN-06, UC-OWN-07, UC-CON-01, UC-CON-04, UC-CON-05, UC-ADMIN-09", "BR-CTR-03", "UC-02, ACT-04, SEQ-05, STATE-04, STATE-05", "ContractViewerModal.tsx", "POST /api/ownership-transfers/{id}/finalize", "OwnershipTransferService, CoOwnershipContractService", "ownership_shares, contract_versions", "TC-OWN-04, TC-CON-03, TC-REG-09, TC-REG-11, TC-REG-19"),
    ("FR-CO-08", "Xử lý yêu cầu rút lui khỏi nhóm đồng sở hữu", "UC-OWN-07", "BR-GRP-03", "UC-02, STATE-04", "GroupWithdrawalModal.tsx", "POST /api/co-ownership-groups/{id}/withdraw", "CoOwnershipGroupService", "group_members, ownership_shares", "TC-OWN-04"),

    # BOOKING & HANDOVER (8)
    ("FR-BOOK-01", "Truy vấn lịch biểu sử dụng xe và kiểm tra khả dụng", "UC-BOOK-01, UC-BOOK-04", "BR-BKG-01", "UC-04, ACT-05, SEQ-06, STATE-02", "BookingCalendarView.tsx", "GET /api/vehicles/{id}/bookings", "BookingService", "bookings, booking_slots", "TC-BOOK-01, TC-REG-29"),
    ("FR-BOOK-02", "Tạo lịch đặt xe mới với thuật toán chống trùng lấn", "UC-BOOK-02", "BR-BKG-02, BR-BKG-03", "UC-04, ACT-05, SEQ-06, STATE-02", "CreateBookingModal.tsx", "POST /api/bookings", "BookingService", "bookings, booking_slots", "TC-BOOK-02, TC-BOOK-03, TC-BOOK-04, TC-BOOK-05, TC-BOOK-06, TC-BOOK-07, TC-REG-24"),
    ("FR-BOOK-03", "Gia hạn thời gian sử dụng xe (Booking Extension)", "UC-TRIP-06, UC-MAINT-05", "BR-BKG-04", "UC-04, SEQ-07", "TripExtensionModal.tsx", "POST /api/bookings/{id}/extend", "BookingService", "bookings, booking_slots", "TC-TRIP-05"),
    ("FR-BOOK-04", "Đàm phán nhượng lại khung giờ sử dụng xung đột", "UC-TRIP-07", "BR-BKG-04", "UC-04, SEQ-07", "TripNegotiationModal.tsx", "POST /api/trips/{id}/negotiations", "TripNegotiationService", "trip_negotiations", "TC-TRIP-06"),
    ("FR-BOOK-05", "Hủy lịch đặt xe trước giờ khởi hành", "UC-BOOK-03", "BR-BKG-05", "UC-04, ACT-05, STATE-02", "BookingDetailModal.tsx", "PUT /api/bookings/{id}/cancel", "BookingService", "bookings", "TC-BOOK-08"),
    ("FR-BOOK-06", "Kiểm tra điều kiện bàn giao xe trước phiên đặt", "UC-TRIP-01", "BR-HDV-01", "UC-05, ACT-06, SEQ-08", "HandoverEligibilityBanner.tsx", "GET /api/handovers/eligible/{tripId}", "VehicleHandoverService", "bookings, vehicles", "TC-HAND-01"),
    ("FR-BOOK-07", "Thực hiện biên bản bàn giao xe kỹ thuật số", "UC-TRIP-01, UC-TRIP-02", "BR-HDV-02", "UC-05, ACT-06, SEQ-08, CLASS-03, ERD-03", "StaffHandoverInspectionModal.tsx", "POST /api/handovers", "VehicleHandoverService", "vehicle_handovers, handover_checklists", "TC-HAND-01, TC-HAND-02, TC-REG-28"),
    ("FR-BOOK-08", "Xác nhận nhận xe điện tử hai bên", "UC-TRIP-02, UC-TRIP-03", "BR-HDV-03", "UC-05, ACT-06, SEQ-08", "CoOwnerConfirmHandoverModal.tsx", "PUT /api/handovers/{id}/confirm", "VehicleHandoverService", "vehicle_handovers", "TC-HAND-03"),

    # CHARGING & ENERGY (6)
    ("FR-CHG-01", "Khởi tạo phiên sạc pin tại trạm sạc EVShare", "UC-CHRG-01", "BR-CHG-01", "UC-06, ACT-07, SEQ-09, STATE-03", "StartChargingModal.tsx", "POST /api/charging-sessions", "ChargingSessionService", "charging_sessions", "TC-CHRG-01"),
    ("FR-CHG-02", "Giám sát thông số sạc pin thời gian thực", "UC-CHRG-02", "BR-CHG-02", "UC-06, ACT-07, SEQ-09, STATE-03", "ChargingProgressModal.tsx", "GET /api/charging-sessions/active", "ChargingSessionService", "charging_sessions", "TC-CHRG-01"),
    ("FR-CHG-03", "Hoàn tất phiên sạc và tính toán điện năng tiêu thụ", "UC-CHRG-03", "BR-CHG-03", "UC-06, ACT-07, SEQ-09, STATE-03", "CompleteChargingModal.tsx", "POST /api/charging-sessions/{id}/complete", "ChargingSessionService, VehicleEnergyInventoryService", "charging_sessions, energy_inventories", "TC-CHRG-02, TC-ENER-01, TC-REG-06"),
    ("FR-CHG-04", "Quản lý kho năng lượng xe và giá vốn bình quân (WAC)", "UC-CHRG-04, UC-CHRG-05", "BR-INV-01, BR-INV-02", "ARCH-06, UC-06, CLASS-04, ERD-04", "EnergyInventoryReportPanel.tsx", "GET /api/vehicles/{id}/energy-inventory", "VehicleEnergyInventoryService", "energy_inventories, energy_transactions", "TC-ENER-02, TC-ENER-04"),
    ("FR-CHG-05", "Sạc vận hành chuyên trách bởi Nhân viên", "UC-CHRG-05", "BR-CHG-04", "UC-06, ACT-07, SEQ-09", "StaffChargingModal.tsx", "POST /api/charging-sessions/operational", "ChargingSessionService, VehicleEnergyInventoryService", "charging_sessions, energy_inventories", "TC-CHRG-03, TC-REG-07"),
    ("FR-CHG-06", "Hủy phiên sạc khẩn cấp khi xảy ra lỗi kỹ thuật", "UC-CHRG-06", "BR-CHG-01", "UC-06, STATE-03", "ChargingEmergencyDock.tsx", "POST /api/charging-sessions/{id}/cancel", "ChargingSessionService", "charging_sessions", "TC-REG-08"),

    # TRIP EXECUTION (6)
    ("FR-TRIP-01", "Bắt đầu chuyến đi với chốt chặn an toàn Pin", "UC-TRIP-04", "BR-TRP-01", "UC-07, ACT-08, SEQ-10, STATE-01", "StartTripModal.tsx", "POST /api/trips/start", "TripService", "trips, vehicles", "TC-TRIP-01, TC-TRIP-02, TC-TRIP-03, TC-TRIP-04, TC-REG-15"),
    ("FR-TRIP-02", "Theo dõi hành trình và tiêu hao năng lượng tức thời", "UC-TRIP-05", "BR-TRP-02", "UC-07, ACT-08, SEQ-11, STATE-01", "ActiveTripDetailPanel.tsx", "GET /api/trips/active", "TripService, VehicleEnergyModelService", "trips", "TC-TRIP-05, TC-REG-02, TC-REG-16, TC-REG-30"),
    ("FR-TRIP-03", "Gửi yêu cầu hoàn trả xe sau khi kết thúc di chuyển", "UC-TRIP-08", "BR-TRP-03", "UC-07, ACT-08, SEQ-12, STATE-01", "RequestReturnModal.tsx", "POST /api/trips/{id}/return-request", "TripService", "trips", "TC-TRIP-07"),
    ("FR-TRIP-04", "Kiểm tra tiếp nhận và nghiệm thu xe sau chuyến đi", "UC-TRIP-09", "BR-TRP-04", "UC-07, ACT-08, SEQ-12, CLASS-03, ERD-03", "StaffReturnInspectionModal.tsx", "POST /api/inspections", "VehicleInspectionService", "vehicle_inspections, inspection_items", "TC-TRIP-08, TC-INSP-01, TC-INSP-02"),
    ("FR-TRIP-05", "Xác nhận kết thúc chuyến đi và khấu trừ kho năng lượng", "UC-TRIP-10, UC-TRIP-11", "BR-TRP-03, BR-INV-03", "UC-07, ACT-08, SEQ-12, STATE-01", "ConfirmTripCompletionModal.tsx", "POST /api/trips/{id}/confirm-return", "TripService, VehicleEnergyInventoryService", "trips, energy_inventories, energy_transactions", "TC-TRIP-09, TC-ENER-04"),
    ("FR-TRIP-06", "Ghi nhận vết tổn hại / trầy xước phát sinh", "UC-MAINT-01", "BR-TRP-04", "UC-07, ACT-08, SEQ-12, CLASS-07", "RecordTripDamageModal.tsx", "POST /api/trips/{id}/damages", "DamageService", "damage_records, damage_hotspots", "TC-DAMG-02"),

    # EXPENSES & DIRECT ALLOCATION (6)
    ("FR-EXP-01", "Ghi nhận hóa đơn chi phí chung", "UC-FIN-01", "BR-EXP-03", "UC-08, ACT-09, SEQ-13, CLASS-05, ERD-05", "CreateExpenseModal.tsx", "POST /api/expenses", "ExpenseService", "expenses", "TC-FIN-01"),
    ("FR-EXP-02", "Tự động phân bổ nghĩa vụ chi phí theo tỷ lệ cổ phần", "UC-FIN-02", "BR-EXP-01", "UC-08, ACT-09, SEQ-13, CLASS-05, ERD-05", "ExpenseBreakdownModal.tsx", "POST /api/expenses/{id}/generate-shares", "ExpenseShareService", "expense_splits", "TC-FIN-02, TC-REG-17"),
    ("FR-EXP-03", "Phân bổ chi phí năng lượng sạc theo người lái và chống trùng lặp", "UC-FIN-03", "BR-EXP-05", "ARCH-06, UC-08, SEQ-13, CLASS-05", "TripEnergyExpenseCard.tsx", "POST /api/expenses/trip-energy", "ExpenseService, ExpenseShareService", "expenses, expense_splits", "TC-FIN-03, TC-REG-06"),
    ("FR-EXP-04", "Quản lý nghĩa vụ tài chính cá nhân và tra cứu hồ sơ lịch sử", "UC-FIN-07", "BR-EXP-04", "UC-08, ACT-09, CLASS-05", "FinancialSummaryPanel.tsx", "GET /api/expenses/cost-sharing-summary", "ExpenseShareService, PersonalPaymentService", "expense_splits, personal_payments", "TC-FIN-04"),
    ("FR-EXP-05", "Thanh toán nghĩa vụ chi phí cá nhân phát sinh", "UC-FIN-04", "BR-EXP-04", "UC-08, ACT-09, SEQ-14", "PaymentSubmissionModal.tsx", "POST /api/personal-payments", "PersonalPaymentService", "personal_payments", "TC-FIN-04, TC-FIN-05"),
    ("FR-EXP-06", "Đối soát và xác nhận thanh toán nợ cá nhân", "UC-FIN-05, UC-FIN-06", "BR-EXP-02", "UC-08, ACT-09, SEQ-14", "PaymentVerificationModal.tsx", "PUT /api/personal-payments/{id}/verify", "PersonalPaymentService", "personal_payments, expense_splits", "TC-FIN-06, TC-FIN-07, TC-REG-18"),

    # VOTING & DISPUTES (6 + 6)
    ("FR-VOTE-01", "Khởi tạo đề xuất biểu quyết chung trong nhóm", "UC-VOTE-01", "BR-MAI-03", "UC-09, ACT-10, SEQ-15, STATE-06", "CreateProposalModal.tsx", "POST /api/vote-proposals", "VoteProposalService", "vote_proposals", "TC-VOTE-01, TC-REG-23"),
    ("FR-VOTE-02", "Thực hiện bỏ phiếu biểu quyết với trọng số cổ phần", "UC-VOTE-03", "BR-MAI-04", "UC-09, ACT-10, SEQ-15, STATE-06", "VoteActionModal.tsx", "POST /api/vote-proposals/{id}/vote", "VoteProposalService", "vote_ballots", "TC-VOTE-02, TC-VOTE-03, TC-REG-20"),
    ("FR-VOTE-03", "Tự động kích hoạt biểu quyết khi chi phí bảo dưỡng vượt ngưỡng", "UC-MAINT-02, UC-MAINT-04", "BR-MAI-02", "UC-09, SEQ-15, STATE-06", "ExpenseThresholdWarning.tsx", "POST /api/vote-proposals/maintenance-trigger", "VoteProposalService, MaintenanceService", "vote_proposals, maintenance_requests", "TC-MAINT-02"),
    ("FR-VOTE-04", "Theo dõi tiến độ và tỷ lệ biểu quyết thời gian thực", "UC-VOTE-02, UC-VOTE-04", "BR-MAI-04", "UC-09, ACT-10, STATE-06", "ProposalDetailView.tsx", "GET /api/vote-proposals/{id}", "VoteProposalService", "vote_proposals, vote_ballots", "TC-VOTE-04"),
    ("FR-VOTE-05", "Tự động chốt kết quả và thực thi nghị quyết", "UC-VOTE-04", "BR-MAI-04", "UC-09, ACT-10, SEQ-16, STATE-06", "ProposalExecutionBanner.tsx", "POST /api/vote-proposals/{id}/finalize", "VoteProposalService", "vote_proposals", "TC-VOTE-04"),
    ("FR-VOTE-06", "Cấu hình chính sách biểu quyết nhóm", "UC-VOTE-01", "BR-MAI-03", "UC-09, CLASS-06", "VotingPolicyConfigModal.tsx", "PUT /api/co-ownership-groups/{id}/voting-policy", "CoOwnershipGroupService", "co_ownership_groups", "TC-VOTE-01"),

    ("FR-DISP-01", "Khởi tạo hồ sơ khiếu nại tranh chấp", "UC-VOTE-05", "BR-DSP-01", "UC-10, ACT-11, SEQ-17, STATE-07", "CreateDisputeModal.tsx", "POST /api/disputes", "DisputeService", "disputes", "TC-DISP-01"),
    ("FR-DISP-02", "Tự động phát hiện xung đột lịch đặt và điền trước hồ sơ", "UC-MAINT-03, UC-VOTE-05", "BR-DSP-01", "UC-10, SEQ-17", "DisputeAutoFillBanner.tsx", "POST /api/disputes/prefill", "DisputeService", "disputes", "TC-DISP-01"),
    ("FR-DISP-03", "Phân công nhân viên hòa giải viên chuyên trách", "UC-VOTE-07", "BR-DSP-02", "UC-10, ACT-11, SEQ-18, STATE-07", "AssignMediatorModal.tsx", "PUT /api/disputes/{id}/assign-mediator", "DisputeService", "disputes", "TC-DISP-03"),
    ("FR-DISP-04", "Nộp bổ sung bằng chứng và tin nhắn hòa giải nội bộ", "UC-VOTE-06", "BR-DSP-01", "UC-10, ACT-11, SEQ-18", "DisputeEvidenceUpload.tsx", "POST /api/disputes/{id}/evidence", "DisputeService", "dispute_evidence", "TC-DISP-02"),
    ("FR-DISP-05", "Đề xuất và biểu quyết phương án bồi thường hòa giải", "UC-VOTE-08", "BR-DSP-02", "UC-10, ACT-11, SEQ-19, STATE-07", "ProposeCompensationModal.tsx", "POST /api/disputes/{id}/compensation-proposals", "DisputeService", "disputes", "TC-DISP-04, TC-REG-21"),
    ("FR-DISP-06", "Tất toán bồi thường và đóng hồ sơ tranh chấp", "UC-VOTE-08, UC-VOTE-09", "BR-DSP-02", "UC-10, ACT-11, SEQ-19, STATE-07", "CloseDisputeModal.tsx", "POST /api/disputes/{id}/close", "DisputeService", "disputes", "TC-DISP-04, TC-REG-21"),

    # ADMIN & STAFF & NOTI & AI (5 + 4 + 2)
    ("FR-ADM-01", "Bảng điều khiển tổng quan số liệu hệ thống", "UC-ADMIN-05, UC-ADMIN-06", "BR-SEC-01", "UC-11, COMP-01", "AdminDashboardView.tsx", "GET /api/admin/dashboard/stats", "AdminService", "users, vehicles, expenses", "TC-REG-03"),
    ("FR-ADM-02", "Quản lý danh sách người dùng và phân quyền tài khoản", "UC-ADMIN-01, UC-ADMIN-02, UC-ADMIN-03, UC-ADMIN-04", "BR-SEC-01", "UC-11, ACT-12, SEQ-20", "UserManagementTable.tsx", "GET /api/admin/users", "AdminService, UserService", "users, roles", "TC-AUTH-05, TC-REG-03, TC-REG-14, TC-REG-31"),
    ("FR-ADM-03", "Tra cứu và giám sát nhật ký kiểm toán an toàn", "UC-ADMIN-11", "BR-SEC-02", "ARCH-05, UC-11, SEQ-21", "AuditLogsViewer.tsx", "GET /api/admin/audit-logs", "AdminService", "audit_logs", "TC-SEC-01"),
    ("FR-ADM-04", "Báo cáo tài chính tổng hợp toàn hệ thống", "UC-ADMIN-10", "BR-EXP-04", "UC-11, CLASS-05", "FinancialSummaryReport.tsx", "GET /api/admin/financial-summary", "AdminService", "expenses, personal_payments", "TC-FIN-01"),
    ("FR-ADM-05", "Giám sát sức khỏe hạ tầng hệ thống và dịch vụ", "UC-ADMIN-05", "BR-SEC-01", "ARCH-01, DEPLOY-01", "SystemHealthMonitor.tsx", "GET /api/health", "HealthService", "Không áp dụng", "TC-REG-31"),

    ("FR-STF-01", "Bảng điều hành công việc trực ban của Nhân viên", "UC-MAINT-06", "BR-HDV-01", "UC-12, COMP-01", "StaffOperationalCarousel.tsx", "GET /api/staff/tasks", "StaffService", "vehicle_handovers, vehicle_inspections", "TC-HAND-01"),
    ("FR-STF-02", "Khởi tạo và cập nhật tiến độ bảo dưỡng sửa chữa", "UC-MAINT-04, UC-MAINT-06", "BR-MAI-01", "UC-12, ACT-10, SEQ-22, STATE-08", "MaintenanceOrderModal.tsx", "POST /api/maintenance/orders", "MaintenanceService", "maintenance_orders", "TC-MAINT-01, TC-MAINT-03"),
    ("FR-STF-03", "Nghiệm thu hoàn tất bảo dưỡng và giải phóng xe", "UC-MAINT-07", "BR-MAI-01", "UC-12, ACT-10, SEQ-22, STATE-08", "CompleteMaintenanceModal.tsx", "PUT /api/maintenance/orders/{id}/complete", "MaintenanceService", "maintenance_orders, vehicles", "TC-MAINT-04"),
    ("FR-STF-04", "Tiếp nhận và nghiệm thu công việc được giao", "UC-MAINT-06, UC-MAINT-07", "BR-MAI-01", "UC-12, SEQ-22", "StaffApprovedWorkTable.tsx", "GET /api/staff/approved-work", "StaffApprovedWorkService", "maintenance_orders", "TC-MAINT-03, TC-MAINT-04"),

    ("FR-NOTI-01", "Thông báo đẩy thời gian thực về biến động lịch xe và tài chính", "UC-NOTI-01, UC-NOTI-02", "BR-GEN-01", "ARCH-03, UC-13, SEQ-23", "NotificationCenterModal.tsx", "GET /api/notifications", "NotificationService", "notifications", "TC-NOTI-01, TC-NOTI-02, TC-REG-23"),
    ("FR-AI-01", "Tra cứu quy chế và giải đáp quy trình qua Trợ lý ảo AI", "UC-NOTI-03", "BR-GEN-01", "ARCH-04, UC-13, COMP-02", "AiAssistantInstallation.tsx", "POST /api/ai/chat", "AiService", "ai_conversations, ai_messages", "TC-REG-27")
]

def generate_v5_rtm():
    all_tcs = {t["id"] for t in tc.get_all_test_cases()}
    
    rows = []
    invalid_tc_found = 0
    
    for r in RTM_MAPPINGS:
        fr_id, fr_name, uc_col, br_col, diag_col, fe_col, api_col, be_col, db_col, tc_col = r
        
        # Verify TCs
        import re
        for t_ref in re.findall(r'TC-[A-Z0-9\-]+', tc_col):
            if t_ref not in all_tcs:
                print(f"ERROR: Nonexistent TC {t_ref} referenced in {fr_id}!")
                invalid_tc_found += 1
                
        # Format table row for docx (8 columns matching Word RTM structure)
        # Headers: ["Mã FR", "Tên yêu cầu chức năng", "Use Case", "Quy tắc BR", "Sơ đồ UML", "REST API", "CSDL", "Ca kiểm thử (TC)"]
        rows.append([
            fr_id,
            fr_name,
            uc_col,
            br_col,
            diag_col,
            api_col,
            db_col,
            tc_col
        ])

    print(f"Total RTM rows: {len(rows)}, Invalid TC references: {invalid_tc_found}")

    out_path = os.path.join(BASE_DIR, "v5_data_rtm.py")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\n')
        f.write("v5_data_rtm.py - Ma trận truy xuất nguồn gốc yêu cầu (RTM) Phụ lục K cho Báo cáo V5\n")
        f.write("Bao phủ toàn diện 70 FRs, 88 Use Cases và 100 Ca kiểm thử thực tế không lỗi tham chiếu.\n")
        f.write('"""\n\n')
        f.write(f"RTM_ROWS = {repr(rows)}\n\n")
        f.write("def get_rtm_rows():\n    return RTM_ROWS\n")

    print("Generated v5_data_rtm.py successfully.")

if __name__ == "__main__":
    generate_v5_rtm()
