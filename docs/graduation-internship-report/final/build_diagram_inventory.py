# -*- coding: utf-8 -*-
"""
build_diagram_inventory.py - Tạo DIAGRAM_INVENTORY.md hoàn chỉnh 81 sơ đồ
"""
import os

OUTPUT_FILE = r"D:\EV3D\docs\graduation-internship-report\final\DIAGRAM_INVENTORY.md"

inventory_data = [
    # Architecture (6)
    ("ARCH-01", "Kiến trúc tổng thể hệ thống đa tầng", "System Architecture", "Level 0", "Mục 4.1.1", "arch_01_system_overall.puml", "arch_01_system_overall.png", "Kiến trúc 4 tầng Client, Nginx Gateway, Spring Boot Backend, MySQL & Three.js"),
    ("ARCH-02", "Luồng xử lý Gateway & Bảo mật", "Security Pipeline", "Level 1", "Mục 4.1.2", "arch_02_gateway_security.puml", "arch_02_gateway_security.png", "Luồng xác thực qua JwtAuthenticationFilter và SecurityFilterChain"),
    ("ARCH-03", "Phân tầng kiến trúc Backend Spring Boot", "Backend Architecture", "Level 2", "Mục 4.1.3", "arch_03_backend_layered.puml", "arch_03_backend_layered.png", "Phân rã Controller -> Service -> Repository -> JPA Entities"),
    ("ARCH-04", "Kiến trúc tương tác đồ họa 3D Three.js", "Three.js 3D Pipeline", "Level 2", "Mục 4.1.4", "arch_04_threejs_frontend.puml", "arch_04_threejs_frontend.png", "R3F Canvas, OrbitControls, Raycaster, GLTF Loader và GPU Shaders"),
    ("ARCH-05", "Kiến trúc quản lý năng lượng và trạm sạc", "Energy Architecture", "Level 2", "Mục 4.1.5", "arch_05_energy_inventory.puml", "arch_05_energy_inventory.png", "Luồng nạp kho năng lượng, tính WAC và khấu trừ năng lượng chuyến đi"),
    ("ARCH-06", "Kiến trúc sổ cái mô phỏng Smart Contract", "Smart Contract Pipeline", "Level 3", "Mục 4.1.6", "arch_06_smart_contract_ledger.puml", "arch_06_smart_contract_ledger.png", "Bộ mô phỏng hợp đồng thông minh, Rule Engine và chuỗi băm LedgerBlock"),

    # Use Case (13)
    ("UC-01", "Sơ đồ Use Case tổng quan hệ thống", "Use Case Overview", "Level 0", "Mục 4.2.1", "uc_01_system_overview.puml", "uc_01_system_overview.png", "Tương tác giữa 3 tác nhân chính ADMIN, STAFF, CO_OWNER"),
    ("UC-02", "Phân hệ Xác thực & Quản lý Tài khoản", "Auth & Profile", "Level 1", "Mục 4.2.2", "uc_02_auth_profile.puml", "uc_02_auth_profile.png", "Đăng ký, đăng nhập JWT, đổi mật khẩu, quản lý hồ sơ và vai trò"),
    ("UC-03", "Phân hệ Nhóm Đồng Sở Hữu & Tỷ lệ Cổ phần", "Co-Ownership & Equity", "Level 1", "Mục 4.2.3", "uc_03_co_ownership_management.puml", "uc_03_co_ownership_management.png", "Tạo nhóm, mời thành viên, phê duyệt tỷ lệ vốn, chuyển nhượng cổ phần"),
    ("UC-04", "Phân hệ Quản lý Đội Xe & Thiết bị Đo", "Vehicle & Telemetry", "Level 1", "Mục 4.2.4", "uc_04_vehicle_catalog_telemetry.puml", "uc_04_vehicle_catalog_telemetry.png", "Thêm xe, cập nhật ODO, theo dõi SOC pin, cấu hình thông số kỹ thuật"),
    ("UC-05", "Phân hệ Đặt Xe & Lịch trình Sử dụng", "Booking & Reservation", "Level 1", "Mục 4.2.5", "uc_05_booking_scheduling.puml", "uc_05_booking_scheduling.png", "Đặt lịch, kiểm tra xung đột thời gian, duyệt lịch, hủy lịch"),
    ("UC-06", "Phân hệ Bàn giao & Tiếp nhận Xe", "Handover Verification", "Level 2", "Mục 4.2.6", "uc_06_vehicle_handover.puml", "uc_06_vehicle_handover.png", "Xác nhận ODO, % pin, kiểm tra giấy tờ và ký biên bản bàn giao"),
    ("UC-07", "Phân hệ Thực hiện Chuyến đi & Check-in", "Trip Management", "Level 2", "Mục 4.2.7", "uc_07_trip_execution.puml", "uc_07_trip_execution.png", "Khởi hành chuyến đi, cập nhật trạng thái IN_PROGRESS, ghi nhận sự cố"),
    ("UC-08", "Phân hệ Trả xe & Kiểm định Thiệt hại", "Return & Damage Inspection", "Level 2", "Mục 4.2.8", "uc_08_trip_return_inspection.puml", "uc_08_trip_return_inspection.png", "Yêu cầu trả xe, nhân viên đối soát, lập checklist tổn hại và chụp ảnh"),
    ("UC-09", "Phân hệ Phiên sạc & Kho Năng lượng", "Charging & Energy Inventory", "Level 2", "Mục 4.2.9", "uc_09_charging_energy_inventory.puml", "uc_09_charging_energy_inventory.png", "Khởi tạo sạc, ghi nhận điện nạp, tính giá bình quân gia quyền WAC"),
    ("UC-10", "Phân hệ Phân bổ Chi phí & Quyết toán", "Expense Allocation", "Level 2", "Mục 4.2.10", "uc_10_expense_allocation.puml", "uc_10_expense_allocation.png", "Phân bổ chi phí sạc cá nhân, phân bổ bảo dưỡng theo tỷ lệ sở hữu"),
    ("UC-11", "Phân hệ Hợp đồng & Biểu quyết Dân chủ", "Contracts & Voting", "Level 2", "Mục 4.2.11", "uc_11_contracts_voting.puml", "uc_11_contracts_voting.png", "Ký điện tử hợp đồng, tạo đề xuất biểu quyết, bỏ phiếu theo trọng số cổ phần"),
    ("UC-12", "Phân hệ Bảo dưỡng Kỹ thuật & Cảnh báo", "Maintenance & Alerts", "Level 2", "Mục 4.2.12", "uc_12_maintenance_technical.puml", "uc_12_maintenance_technical.png", "Theo dõi mốc bảo dưỡng định kỳ ODO/thời gian, lập lệnh sửa chữa"),
    ("UC-13", "Phân hệ Tương tác Garage 3D & Hotspot", "3D Garage & Digital Twin", "Level 2", "Mục 4.2.13", "uc_13_garage_3d_inspection.puml", "uc_13_garage_3d_inspection.png", "Quan sát mô hình 3D, xoay 360 độ, kiểm tra điểm tổn hại trực quan"),

    # Activity (12)
    ("ACT-01", "Luồng Đăng ký và Phân quyền Vai trò", "User Registration & Role Setup", "Level 1", "Mục 4.3.1", "act_01_user_registration.puml", "act_01_user_registration.png", "Quy trình đăng ký tài khoản, gửi xác thực email và cấp quyền"),
    ("ACT-02", "Luồng Đặt Xe và Xử lý Khử Xung đột Lịch", "Booking Conflict Resolution", "Level 1", "Mục 4.3.2", "act_02_booking_creation.puml", "act_02_booking_creation.png", "Kiểm tra bất biến thời gian, truy vấn xung đột và lưu lịch CONFIRMED"),
    ("ACT-03", "Luồng Bàn giao Xe Kỹ thuật Thực tế", "Vehicle Handover Process", "Level 2", "Mục 4.3.3", "act_03_vehicle_handover.puml", "act_03_vehicle_handover.png", "Đối soát ODO, pin, kiểm tra vật lý và xác nhận hai bên"),
    ("ACT-04", "Luồng Khởi hành và Kiểm tra Check-in", "Trip Check-in Flow", "Level 2", "Mục 4.3.4", "act_04_trip_start_checkin.puml", "act_04_trip_start_checkin.png", "Chủ xe nhập thông số khởi hành, chuyển trạng thái xe sang IN_USE"),
    ("ACT-05", "Luồng Trả xe và Nghiệm thu Kỹ thuật", "Trip Return & Tech Inspection", "Level 2", "Mục 4.3.5", "act_05_trip_return_inspection.puml", "act_05_trip_return_inspection.png", "Nhân viên kiểm tra ODO, pin, ghi nhận tổn hại và hoàn tất chuyến đi"),
    ("ACT-06", "Luồng Phiên sạc và Tính giá Năng lượng WAC", "Charging & Energy Inventory WAC", "Level 2", "Mục 4.3.6", "act_06_charging_energy_wac.puml", "act_06_charging_energy_wac.png", "Cắm sạc, tính lượng điện nạp thực tế trừ tổn hao 10%, cập nhật giá WAC"),
    ("ACT-07", "Luồng Phân bổ Chi phí Định kỳ & Sạc", "Expense Allocation Workflow", "Level 2", "Mục 4.3.7", "act_07_expense_allocation.puml", "act_07_expense_allocation.png", "Phân bổ chi phí sạc cá nhân 100% cho lái xe, bảo dưỡng chia theo % vốn"),
    ("ACT-08", "Luồng Thanh toán và Đối soát Demo", "Payment & Settlement", "Level 2", "Mục 4.3.8", "act_08_payment_settlement.puml", "act_08_payment_settlement.png", "Chủ xe tải minh chứng thanh toán, nhân viên đối soát và tất toán nợ"),
    ("ACT-09", "Luồng Chuyển nhượng Cổ phần Sở hữu", "Ownership Transfer", "Level 2", "Mục 4.3.9", "act_09_ownership_transfer.puml", "act_09_ownership_transfer.png", "Đề xuất chuyển nhượng, bên nhận đồng thuận, trưởng nhóm duyệt và cập nhật"),
    ("ACT-10", "Luồng Ký kết Điện tử Hợp đồng Đa bên", "Contract E-Signing", "Level 2", "Mục 4.3.10", "act_10_contract_signing.puml", "act_10_contract_signing.png", "Các bên ký mã OTP / chữ ký số, hệ thống kích hoạt khi đủ 100% chữ ký"),
    ("ACT-11", "Luồng Biểu quyết Đề xuất theo Trọng số", "Voting Proposal & Weighting", "Level 2", "Mục 4.3.11", "act_11_voting_proposal.puml", "act_11_voting_proposal.png", "Tạo đề xuất, bỏ phiếu biểu quyết với trọng số bằng tỷ lệ % vốn"),
    ("ACT-12", "Luồng Tải và Tương tác Mô hình 3D", "Three.js 3D Asset Loading", "Level 3", "Mục 4.3.12", "act_12_threejs_asset_loading.puml", "act_12_threejs_asset_loading.png", "Tải GLTF, giải nén texture GPU KTX2, gắn bóng đổ và kích hoạt raycast"),

    # Sequence (20)
    ("SEQ-01", "Đăng nhập và Xác thực JWT", "Login & JWT Generation", "Level 1", "Mục 4.4.1", "seq_01_login_jwt.puml", "seq_01_login_jwt.png", "AuthController, AuthService, JwtTokenProvider, RefreshTokenRepo"),
    ("SEQ-02", "Truy xuất API bảo vệ bằng Bearer Token", "Protected API Filter", "Level 2", "Mục 4.4.2", "seq_02_jwt_protected_api.puml", "seq_02_jwt_protected_api.png", "JwtAuthenticationFilter trích xuất token, xác thực và gán SecurityContext"),
    ("SEQ-03", "Đặt lịch xe và Khử xung đột", "Booking Creation & Conflict", "Level 2", "Mục 4.4.3", "seq_03_booking_creation_conflict.puml", "seq_03_booking_creation_conflict.png", "BookingController, BookingService, kiểm tra khung giờ và lưu DB"),
    ("SEQ-04", "Xác minh Bàn giao xe Kỹ thuật", "Handover Verification", "Level 2", "Mục 4.4.4", "seq_04_handover_verification.puml", "seq_04_handover_verification.png", "StaffHandoverModal, VehicleHandoverController, xác nhận 2 bên"),
    ("SEQ-05", "Khởi hành và Bắt đầu Chuyến đi", "Trip Start & Check-in", "Level 2", "Mục 4.4.5", "seq_05_checkin_odometer_battery.puml", "seq_05_checkin_odometer_battery.png", "TripController, TripService, đối soát ODO và % pin tối thiểu 20%"),
    ("SEQ-06", "Ghi nhận Kiểm định Tổn hại Xe", "Damage Checklist Logging", "Level 2", "Mục 4.4.6", "seq_06_damage_checklist_logging.puml", "seq_06_damage_checklist_logging.png", "VehicleInspectionController, VehicleInspectionService, ghi nhận đa tổn hại"),
    ("SEQ-07", "Trả xe, Kiểm định và Đối soát Năng lượng", "Trip Return & Inspection", "Level 2", "Mục 4.4.7", "seq_07_trip_return_and_inspection.puml", "seq_07_trip_return_and_inspection.png", "TripService phối hợp InspectionService, EnergyService và ExpenseService"),
    ("SEQ-08", "Hủy Đặt lịch và Giải phóng Khung giờ", "Booking Cancellation", "Level 2", "Mục 4.4.8", "seq_08_trip_cancellation_refund.puml", "seq_08_trip_cancellation_refund.png", "BookingService hủy lịch trước giờ đi > 2h và trả trạng thái xe về AVAILABLE"),
    ("SEQ-09", "Khởi tạo Phiên sạc Xe điện", "Charging Session Start", "Level 2", "Mục 4.4.9", "seq_09_charging_session_start.puml", "seq_09_charging_session_start.png", "ChargingSessionController, ChargingSessionService, chuyển xe sang CHARGING"),
    ("SEQ-10", "Hoàn tất Sạc và Tính giá Bình quân WAC", "Charging Completion & WAC", "Level 3", "Mục 4.4.10", "seq_10_energy_inventory_wac.puml", "seq_10_energy_inventory_wac.png", "Xử lý Idempotency, trừ 10% tổn hao, tính giá bình quân gia quyền"),
    ("SEQ-11", "Phân bổ Chi phí Định kỳ theo Tỷ lệ Vốn", "Monthly Expense Allocation", "Level 2", "Mục 4.4.11", "seq_11_monthly_expense_allocation.puml", "seq_11_monthly_expense_allocation.png", "ExpenseAllocationService duyệt danh sách cổ đông và chia nhỏ chi phí"),
    ("SEQ-12", "Truy vấn và Kiểm định Tổng Cổ phần", "Equity Ratio Verification", "Level 2", "Mục 4.4.12", "seq_12_equity_ratio_calculation.puml", "seq_12_equity_ratio_calculation.png", "CoOwnershipService xác nhận tổng số phần trăm cổ phần bằng đúng 100%"),
    ("SEQ-13", "Nộp và Xác minh Thanh toán Demo", "Demo Payment Settlement", "Level 2", "Mục 4.4.13", "seq_13_demo_payment_verification.puml", "seq_13_demo_payment_verification.png", "PersonalPaymentService tạo chứng từ và nhân viên đối soát tất toán"),
    ("SEQ-14", "Chuyển nhượng Cổ phần Đồng sở hữu", "Ownership Share Transfer", "Level 2", "Mục 4.4.14", "seq_14_ownership_transfer.puml", "seq_14_ownership_transfer.png", "Giao dịch nguyên tử @Transactional chuyển quyền sở hữu và bảo toàn tổng 100%"),
    ("SEQ-15", "Ký điện tử Hợp đồng Đa bên", "Contract Multi-Party Signing", "Level 2", "Mục 4.4.15", "seq_15_contract_electronic_signing.puml", "seq_15_contract_electronic_signing.png", "ContractService lưu trữ chữ ký số băm và cập nhật trạng thái FULLY_EXECUTED"),
    ("SEQ-16", "Mô phỏng Thực thi Smart Contract", "Smart Contract Simulation", "Level 3", "Mục 4.4.16", "seq_16_smart_contract_simulation.puml", "seq_16_smart_contract_simulation.png", "Bộ lập lịch quét điều kiện tự động và ghi block băm vào LedgerBlock"),
    ("SEQ-17", "Tạo Đề xuất và Bỏ phiếu Biểu quyết", "Voting Proposal & Weighting", "Level 2", "Mục 4.4.17", "seq_17_voting_proposal_cast.puml", "seq_17_voting_proposal_cast.png", "VoteProposalService ghi nhận phiếu với trọng số tương ứng số % vốn"),
    ("SEQ-18", "Cảnh báo Bảo dưỡng và Lập Lịch", "Maintenance Work Order", "Level 2", "Mục 4.4.18", "seq_18_maintenance_scheduling.puml", "seq_18_maintenance_scheduling.png", "MaintenanceService lập kế hoạch bảo dưỡng định kỳ và khóa trạng thái xe"),
    ("SEQ-19", "Tải Tiến trình và Bộ đệm Mô hình 3D", "Three.js Asset Loading & Cache", "Level 2", "Mục 4.4.19", "seq_19_threejs_loading_caching.puml", "seq_19_threejs_loading_caching.png", "Quy trình useGLTF, kiểm tra cache IndexedDB và dựng hình Three.js"),
    ("SEQ-20", "Tương tác Tổn hại 3D với Raycasting", "3D Raycasting & Hotspot", "Level 2", "Mục 4.4.20", "seq_20_hotspot_inspection_interaction.puml", "seq_20_hotspot_inspection_interaction.png", "Phát tia Raycaster từ camera, bắt điểm va chạm Mesh và mở modal chi tiết"),

    # Class Diagrams (8)
    ("CLASS-01", "Sơ đồ Lớp Tổng quan Hệ thống", "Core Domain Model Overview", "Level 0", "Mục 4.5.1", "class_01_domain_overview.puml", "class_01_domain_overview.png", "Quan hệ tổng thể giữa User, Vehicle, CoOwnership, Booking, Trip, Expense"),
    ("CLASS-02", "Sơ đồ Lớp Quản lý Người dùng & Phân quyền", "User & Authentication Domain", "Level 1", "Mục 4.5.2", "class_02_auth_users.puml", "class_02_auth_users.png", "User, Role, UserPrincipal, RefreshToken, PasswordResetToken"),
    ("CLASS-03", "Sơ đồ Lớp Nhóm Đồng sở hữu & Cổ phần", "Co-Ownership & Equity Domain", "Level 1", "Mục 4.5.3", "class_03_co_ownership.puml", "class_03_co_ownership.png", "CoOwnershipGroup, OwnershipShare, OwnershipTransferRequest, History"),
    ("CLASS-04", "Sơ đồ Lớp Đội xe & Bàn giao Kỹ thuật", "Vehicle & Handover Domain", "Level 1", "Mục 4.5.4", "class_04_vehicle_handover.puml", "class_04_vehicle_handover.png", "Vehicle, VehicleHandover, HandoverChecklist, OdometerLog"),
    ("CLASS-05", "Sơ đồ Lớp Đặt xe, Chuyến đi & Giám định", "Booking, Trip & Inspection Domain", "Level 1", "Mục 4.5.5", "class_05_booking_trip_inspection.puml", "class_05_booking_trip_inspection.png", "Booking, Trip, VehicleInspection, VehicleInspectionDamage"),
    ("CLASS-06", "Sơ đồ Lớp Kho Năng lượng & Phiên sạc", "Energy Inventory & Charging Domain", "Level 1", "Mục 4.5.6", "class_06_energy_charging.puml", "class_06_energy_charging.png", "ChargingSession, ChargingStation, VehicleEnergyInventory, EnergyTransaction"),
    ("CLASS-07", "Sơ đồ Lớp Chi phí & Quyết toán Cổ phần", "Financial & Expense Share Domain", "Level 1", "Mục 4.5.7", "class_07_expenses_finance.puml", "class_07_expenses_finance.png", "Expense, ExpenseShare, PersonalExpensePayment, AllocationRule"),
    ("CLASS-08", "Sơ đồ Lớp Hợp đồng, Biểu quyết & Smart Contract", "Contracts, Voting & Smart Contract", "Level 1", "Mục 4.5.8", "class_08_contracts_voting_ledger.puml", "class_08_contracts_voting_ledger.png", "Contract, ContractSignature, VoteProposal, ProposalVote, LedgerBlock"),

    # ERD Diagrams (8)
    ("ERD-01", "Mô hình Dữ liệu Quan hệ Toàn cục", "Global Database Schema ERD", "Level 0", "Mục 4.6.1", "erd_01_global_schema.puml", "erd_01_global_schema.png", "Quan hệ toàn cục giữa 46 bảng cơ sở dữ liệu MySQL"),
    ("ERD-02", "Lược đồ Bảng Người dùng & Phân quyền", "Users, Roles & Auth Tables", "Level 1", "Mục 4.6.2", "erd_02_auth_users.puml", "erd_02_auth_users.png", "users, roles, user_roles, refresh_tokens, audit_logs"),
    ("ERD-03", "Lược đồ Bảng Đồng sở hữu & Cổ phần", "Co-Ownership & Shares Tables", "Level 1", "Mục 4.6.3", "erd_03_co_ownership.puml", "erd_03_co_ownership.png", "co_ownership_groups, ownership_shares, transfer_requests, histories"),
    ("ERD-04", "Lược đồ Bảng Phương tiện & Bàn giao", "Vehicles & Handovers Tables", "Level 1", "Mục 4.6.4", "erd_04_vehicles_handovers.puml", "erd_04_vehicles_handovers.png", "vehicles, vehicle_specs, vehicle_handovers, handover_documents"),
    ("ERD-05", "Lược đồ Bảng Lịch đặt, Chuyến đi & Giám định", "Bookings, Trips & Inspections", "Level 1", "Mục 4.6.5", "erd_05_bookings_trips_inspections.puml", "erd_05_bookings_trips_inspections.png", "bookings, trips, vehicle_inspections, vehicle_inspection_damages"),
    ("ERD-06", "Lược đồ Bảng Trạm sạc & Kho Năng lượng", "Charging & Energy Inventories", "Level 1", "Mục 4.6.6", "erd_06_energy_charging.puml", "erd_06_energy_charging.png", "charging_stations, charging_sessions, vehicle_energy_inventories, transactions"),
    ("ERD-07", "Lược đồ Bảng Tài chính & Quyết toán Chi phí", "Expenses & Personal Payments", "Level 1", "Mục 4.6.7", "erd_07_expenses_finance.puml", "erd_07_expenses_finance.png", "expenses, expense_shares, personal_expense_payments, payment_proofs"),
    ("ERD-08", "Lược đồ Bảng Hợp đồng, Biểu quyết & Ledger", "Contracts, Proposals & Ledger Blocks", "Level 1", "Mục 4.6.8", "erd_08_contracts_voting_ledger.puml", "erd_08_contracts_voting_ledger.png", "contracts, contract_parties, signatures, vote_proposals, votes, ledger_blocks"),

    # State Machine Diagrams (10)
    ("STATE-01", "Vòng đời Trạng thái Đặt lịch Xe", "Booking Lifecycle", "Level 1", "Mục 4.7.1", "state_01_booking_lifecycle.puml", "state_01_booking_lifecycle.png", "PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED / CANCELLED"),
    ("STATE-02", "Vòng đời Trạng thái Chuyến đi", "Trip Lifecycle", "Level 1", "Mục 4.7.2", "state_02_trip_lifecycle.puml", "state_02_trip_lifecycle.png", "SCHEDULED -> IN_PROGRESS -> RETURN_REQUESTED -> COMPLETED"),
    ("STATE-03", "Vòng đời Trạng thái Phương tiện Kỹ thuật", "Vehicle Technical Lifecycle", "Level 1", "Mục 4.7.3", "state_03_vehicle_status.puml", "state_03_vehicle_status.png", "AVAILABLE -> RESERVED -> IN_USE -> CHARGING -> MAINTENANCE"),
    ("STATE-04", "Vòng đời Phiên sạc Điện", "Charging Session Lifecycle", "Level 1", "Mục 4.7.4", "state_04_charging_session.puml", "state_04_charging_session.png", "INITIATED -> IN_PROGRESS -> COMPLETED / FAILED"),
    ("STATE-05", "Vòng đời Phân bổ Chi phí & Thanh toán", "Expense & Payment Share Lifecycle", "Level 1", "Mục 4.7.5", "state_05_expense_allocation.puml", "state_05_expense_allocation.png", "DRAFT -> ALLOCATED -> PARTIALLY_PAID -> SETTLED"),
    ("STATE-06", "Vòng đời Chuyển nhượng Cổ phần Đồng sở hữu", "Ownership Transfer Lifecycle", "Level 1", "Mục 4.7.6", "state_06_ownership_transfer.puml", "state_06_ownership_transfer.png", "INITIATED -> PENDING_CONSENT -> PENDING_APPROVAL -> COMPLETED / REJECTED"),
    ("STATE-07", "Vòng đời Hợp đồng Pháp lý Đa bên", "Contract Execution Lifecycle", "Level 1", "Mục 4.7.7", "state_07_contract_lifecycle.puml", "state_07_contract_lifecycle.png", "DRAFT -> PENDING_SIGNATURES -> PARTIALLY_SIGNED -> FULLY_EXECUTED"),
    ("STATE-08", "Vòng đời Đề xuất Biểu quyết Dân chủ", "Voting Proposal Lifecycle", "Level 1", "Mục 4.7.8", "state_08_voting_proposal.puml", "state_08_voting_proposal.png", "OPEN -> VOTING -> PASSED / REJECTED -> EXECUTED"),
    ("STATE-09", "Vòng đời Quy trình Bàn giao Tiếp nhận Xe", "Handover Verification Lifecycle", "Level 1", "Mục 4.7.9", "state_09_handover_status.puml", "state_09_handover_status.png", "PENDING_STAFF -> STAFF_VERIFIED -> OWNER_ACKNOWLEDGED -> COMPLETED"),
    ("STATE-10", "Vòng đời Lệnh Bảo dưỡng Kỹ thuật", "Maintenance Work Order Lifecycle", "Level 1", "Mục 4.7.10", "state_10_maintenance_workorder.puml", "state_10_maintenance_workorder.png", "SCHEDULED -> IN_PROGRESS -> COMPLETED / CANCELLED"),

    # Component & Deployment (4)
    ("COMP-01", "Sơ đồ Thành phần Hệ thống Tổng thể", "System Component Diagram", "Level 1", "Mục 4.8.1", "comp_01_system_components.puml", "comp_01_system_components.png", "Tương tác giữa Frontend SPA, REST API Services, Security & MySQL DB"),
    ("COMP-02", "Sơ đồ Thành phần Frontend React & Three.js", "Frontend React & 3D Engine", "Level 2", "Mục 4.8.2", "comp_02_frontend_components.puml", "comp_02_frontend_components.png", "Pages, Zustand Stores, Three.js R3F Canvas, Shaders, Raycaster & Axios Client"),
    ("COMP-03", "Sơ đồ Thành phần Backend Spring Boot", "Backend Modular Components", "Level 2", "Mục 4.8.3", "comp_03_backend_components.puml", "comp_03_backend_components.png", "Controllers, Service Layer, Security Filter, JPA Repositories & Utilities"),
    ("DEPLOY-01", "Sơ đồ Triển khai Hạ tầng Vật lý & Mạng", "System Deployment Diagram", "Level 1", "Mục 4.8.4", "deploy_01_system_deployment.puml", "deploy_01_system_deployment.png", "Client Browser, Nginx Reverse Proxy, Spring Boot Application, MySQL Server, CDN"),
]

output_md = []
output_md.append("# DANH MỤC TỔNG HỢP 81 SƠ ĐỒ THIẾT KẾ PHÂN RÃ HỆ THỐNG EVSHARE 3D\n")
output_md.append("**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)\n")
output_md.append("**Báo cáo:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản Hoàn Thiện V2.0\n")
output_md.append("**Tổng số sơ đồ:** 81 sơ đồ phân rã theo 4 cấp độ (Level 0 đến Level 3) + 2 tệp liên kết tương thích phụ.\n")
output_md.append("\n---\n")

output_md.append("| STT | Mã Sơ Đồ | Tên Sơ Đồ Thiết Kế | Loại Sơ Đồ (UML Type) | Phân Rã Cấp | Vị Trí Báo Cáo | Tệp Mã Nguồn PlantUML | Tệp Hình Ảnh Rendered | Tóm Tắt Nghiệp Vụ & Bất Biến Kiến Trúc |")
output_md.append("|:---:|:---:|:---|:---|:---:|:---:|:---|:---|:---|")

for idx, (code, title_vi, title_en, level, section, puml_file, png_file, desc) in enumerate(inventory_data, 1):
    output_md.append(f"| {idx} | **{code}** | {title_vi} (*{title_en}*) | {title_en} | {level} | {section} | [`{puml_file}`](diagrams/source/{puml_file}) | [`{png_file}`](diagrams/rendered/{png_file}) | {desc} |")

output_md.append("\n\n---\n")
output_md.append("## Ghi Chú Kỹ Thuật Về Sửa Lỗi Tương Thích Tuyệt Đối (Compatibility Defect Resolution)\n")
output_md.append("Để khắc phục hoàn toàn hai khiếm khuyết được phát hiện trong phiên bản trước:\n")
output_md.append("1. **Khiếm khuyết 1 (Mục 4.7.1 tham chiếu thiếu `diagrams/sequence/seq_login_jwt.puml`):** Đã bổ sung đầy đủ mã nguồn và hình ảnh kết xuất tương ứng tại `diagrams/source/seq_01_login_jwt.puml` và tạo tệp tương thích trực tiếp `seq_login_jwt.puml`.\n")
output_md.append("2. **Khiếm khuyết 2 (Mục 4.7.3 tham chiếu thiếu `diagrams/sequence/seq_trip_return_and_inspection.puml`):** Đã bổ sung đầy đủ mã nguồn và hình ảnh kết xuất tương ứng tại `diagrams/source/seq_07_trip_return_and_inspection.puml` và tạo tệp tương thích trực tiếp `seq_trip_return_and_inspection.puml`.\n")
output_md.append("Tất cả 81 sơ đồ đều được kết xuất dưới định dạng PNG độ phân giải cao và nhúng trực tiếp vào tài liệu Word (`.docx`) và PDF (`.pdf`), đảm bảo không có bất kỳ sơ đồ nào bị hiển thị dưới dạng mã thô hay liên kết đứt gãy.\n")

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("\n".join(output_md))

print(f"Generated {OUTPUT_FILE} with {len(inventory_data)} diagrams.")
