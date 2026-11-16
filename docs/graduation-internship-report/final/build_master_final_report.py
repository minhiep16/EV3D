# -*- coding: utf-8 -*-
"""
build_master_final_report.py - Tổng hợp báo cáo thực tập tốt nghiệp toàn diện EVShare 3D
Bao gồm toàn bộ 7 chương, 81 sơ đồ thiết kế phân rã, công thức toán học và bảng biểu
"""
import os
import re

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report"
CHAPTERS_DIR = os.path.join(BASE_DIR, "chapters")
FINAL_DIR = os.path.join(BASE_DIR, "final")
OUTPUT_MD = os.path.join(FINAL_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_FINAL.md")

def read_chap(filename):
    p = os.path.join(CHAPTERS_DIR, filename)
    with open(p, "r", encoding="utf-8") as f:
        return f.read()

# Đọc các chương sẵn có
fm_content = read_chap("00_front_matter.md")
c1_content = read_chap("01_project_overview.md")
c2_content = read_chap("02_theoretical_background.md")
c3_content = read_chap("03_requirements_analysis.md")
c5_content = read_chap("05_system_implementation.md")
c6_content = read_chap("06_testing_and_evaluation.md")
c7_content = read_chap("07_conclusion.md")
c8_content = read_chap("08_appendices.md")

# Xây dựng danh sách 81 sơ đồ chi tiết cho Chapter 4
diagrams_info = [
    # 4.1 Kiến trúc (ARCH-01 -> ARCH-06)
    ("arch_01_overall_fullstack.png", "ARCH-01", "Kiến trúc tổng thể hệ thống Full-Stack đa tầng", "Full-Stack Enterprise Layered Architecture",
     "Mô tả phân tách rõ rệt giữa 4 tầng: Client SPA (React 18, Three.js), Gateway/Reverse Proxy (Nginx), Backend Application Server (Spring Boot 3.3.4, Java 21 LTS) và CSDL quan hệ MySQL 8.0+. Toàn bộ kết nối được mã hóa TLS/HTTPS."),
    ("arch_02_frontend_components_state.png", "ARCH-02", "Kiến trúc phân tầng Frontend & Quản lý trạng thái", "Frontend Hierarchy & State Management Architecture",
     "Cấu trúc module hóa cao độ: Tầng Scene & View components, Tầng Hooks nghiệp vụ, Tầng lưu trữ Zustand (authStore, worldStore) và Tầng Axios API Client có Interceptor tự động gắn Bearer JWT."),
    ("arch_03_backend_layered.png", "ARCH-03", "Kiến trúc phân tầng Backend Spring Boot", "Backend Layered & Modular Architecture",
     "Mô hình phân tầng doanh nghiệp chuẩn mực: Tầng lọc bảo mật SecurityFilterChain, Tầng 27 REST Controllers, Tầng 25+ Domain Services, Tầng JPA Repositories và Tầng 46 JPA Entities với quản lý giao dịch nguyên tử @Transactional."),
    ("arch_04_security_jwt.png", "ARCH-04", "Kiến trúc xác thực và phân quyền JWT", "JWT Authentication & Security Pipeline",
     "Luồng kiểm soát an ninh truy cập: Client gửi thông tin chứng thực -> AuthController -> AuthenticationManager kiểm tra BCrypt -> JwtTokenProvider phát hành Access Token (24h) và Refresh Token -> Mọi request tiếp theo qua JwtAuthenticationFilter trích xuất Claims và cấp quyền theo vai trò (RBAC: ADMIN, STAFF, CO_OWNER)."),
    ("arch_05_garage_3d_spatial.png", "ARCH-05", "Kiến trúc đồ họa tương tác 3D Three.js", "3D Interactive Digital Twin Architecture",
     "Kiến trúc kết xuất không gian 3D tại máy khách: R3F Canvas, OrbitControls camera, bộ nạp useGLTF tối ưu GPU, Raycaster phát hiện va chạm đa giác (Mesh Picking) phục vụ gắn Hotspot kiểm định tổn hại, cùng kỹ thuật nén KTX2 texture."),
    ("arch_06_finance_energy.png", "ARCH-06", "Kiến trúc tài chính và kho năng lượng WAC", "Finance & Energy Inventory Architecture",
     "Liên kết chặt chẽ giữa phiên sạc điện, kho năng lượng số của xe, công thức giá bình quân gia quyền WAC và hệ thống phân bổ chi phí minh bạch theo tỷ lệ sở hữu vốn (Equity Ratio) và trách nhiệm sử dụng cá nhân."),

    # 4.2 Use Case (UC-01 -> UC-13)
    ("uc_01_overall.png", "UC-01", "Sơ đồ Use Case tổng quan hệ thống EVShare 3D", "System Use Case Overview",
     "Tổng quan toàn bộ tương tác giữa 3 nhóm tác nhân chính: Quản trị viên (ADMIN), Nhân viên vận hành kỹ thuật (STAFF) và Chủ xe đồng sở hữu (CO_OWNER) đối với 7 phân hệ chức năng."),
    ("uc_02_auth_user.png", "UC-02", "Phân hệ Xác thực & Quản lý Thông tin cá nhân", "Authentication & Profile Management",
     "Các ca sử dụng đăng ký tài khoản, đăng nhập JWT, làm mới phiên, đổi mật khẩu, xác thực hồ sơ cá nhân và cấu hình nhận thông báo hệ thống."),
    ("uc_03_admin.png", "UC-03", "Phân hệ Dành cho Quản trị viên (ADMIN)", "Administrator Management Subsystem",
     "Quyền hạn quản trị người dùng, phê duyệt nhóm đồng sở hữu, cấu hình tham số hệ thống, giám sát vận hành toàn cục và giải quyết khiếu nại cấp cao."),
    ("uc_04_staff.png", "UC-04", "Phân hệ Dành cho Nhân viên vận hành (STAFF)", "Operations Staff Subsystem",
     "Quy trình nghiệp vụ thực tế của nhân viên: Bàn giao xe, đối soát ODO/Pin lúc trả xe, lập biên bản kiểm định tổn hại 3D, theo dõi trụ sạc và xác minh thanh toán demo."),
    ("uc_05_co_owner.png", "UC-05", "Phân hệ Dành cho Chủ xe đồng sở hữu (CO_OWNER)", "Co-Owner Self-Service Subsystem",
     "Các ca sử dụng tự phục vụ của chủ xe: Đặt lịch phương tiện, check-in bắt đầu chuyến đi, theo dõi tiêu thụ điện, ký hợp đồng điện tử, biểu quyết dân chủ và nộp chi phí."),
    ("uc_06_booking_trip.png", "UC-06", "Phân hệ Đặt xe & Vận hành Chuyến đi", "Booking & Trip Execution",
     "Chi tiết ca sử dụng đặt xe với thuật toán khử xung đột khung giờ, kiểm tra tư cách thành viên, check-in ODO/Pin khởi hành và gửi yêu cầu trả xe."),
    ("uc_07_handover_return_inspection.png", "UC-07", "Phân hệ Bàn giao, Trả xe & Kiểm định tổn hại", "Handover, Return & Damage Inspection",
     "Quy trình đối soát hai bên giữa nhân viên và chủ xe: Ký biên bản bàn giao, nghiệm thu trả xe, lập biên bản kiểm định và ghi nhận các tổn hại vật lý."),
    ("uc_08_charging_energy.png", "UC-08", "Phân hệ Quản lý Sạc & Kho năng lượng điện", "Charging Sessions & Energy Inventory",
     "Khởi tạo phiên sạc pin, ghi nhận số kWh điện lưới, trừ 10% tổn hao biến đổi nạp pin, cập nhật giá WAC và khấu trừ năng lượng sau mỗi chuyến đi."),
    ("uc_09_finance_payment.png", "UC-09", "Phân hệ Tài chính, Phân bổ chi phí & Thanh toán", "Financial Management & Expense Allocation",
     "Phân bổ chi phí sạc cho cá nhân lái xe, chia đều chi phí bảo dưỡng định kỳ theo tỷ lệ vốn sở hữu, gửi minh chứng chuyển khoản demo và nhân viên xác nhận tất toán."),
    ("uc_10_ownership_transfer_invitation.png", "UC-10", "Phân hệ Mời thành viên & Chuyển nhượng cổ phần", "Invitation & Ownership Transfer",
     "Mời thành viên mới tham gia nhóm đồng sở hữu xe, gửi yêu cầu chuyển nhượng tỷ lệ vốn, bên nhận đồng thuận và trưởng nhóm phê duyệt bảo đảm tổng vốn luôn đạt 100%."),
    ("uc_11_contracts_signatures.png", "UC-11", "Phân hệ Quản lý Hợp đồng & Ký kết điện tử", "Contract Lifecycle & E-Signature",
     "Khởi tạo điều khoản hợp đồng đồng sở hữu xe, lưu trữ lịch sử các phiên bản, gửi mã OTP/ký số điện tử và hệ thống tự động kích hoạt khi 100% thành viên ký nhận."),
    ("uc_12_voting_disputes.png", "UC-12", "Phân hệ Biểu quyết Dân chủ & Giải quyết Tranh chấp", "Democratic Voting & Dispute Resolution",
     "Tạo đề xuất biểu quyết nâng cấp phụ kiện/bảo dưỡng, bỏ phiếu với trọng số tương ứng tỷ lệ vốn sở hữu, tự động đóng phiên khi hết hạn và mở khiếu nại tranh chấp."),
    ("uc_13_garage_3d_digital_twin.png", "UC-13", "Phân hệ Tương tác Garage 3D & Digital Twin", "3D Garage Digital Twin & Hotspots",
     "Tương tác không gian 3D trực quan: Xoay lật xe 360 độ, phóng to thu nhỏ, kiểm tra cụm pin X-Ray, click vào các điểm nóng (Hotspots) để xem chi tiết vết trầy xước."),

    # 4.3 Activity (ACT-01 -> ACT-12)
    ("act_01_login_auth.png", "ACT-01", "Luồng Đăng ký tài khoản và Phân quyền", "User Registration & Role Setup Flow",
     "Luồng nghiệp vụ tiếp nhận form đăng ký, mã hóa mật khẩu BCrypt, kích hoạt tài khoản và gán vai trò ban đầu."),
    ("act_02_booking_conflict.png", "ACT-02", "Luồng Đặt xe và Xử lý Khử xung đột Lịch", "Booking Creation & Conflict Resolution",
     "Luồng kiểm tra bất biến thời gian: Xác thực thời gian bắt đầu trước kết thúc, kiểm tra không giao thoa với lịch đã có (CONFIRMED/PENDING) và lưu đặt xe."),
    ("act_03_handover_inspection.png", "ACT-03", "Luồng Bàn giao Xe & Kiểm định Kỹ thuật", "Handover Verification & Checklist Flow",
     "Nhân viên và chủ xe cùng kiểm tra số đo ODO, mức pin, giấy tờ xe, xác nhận biên bản vật lý và hệ thống chuyển trạng thái xe sang RESERVED."),
    ("act_04_trip_start_extension.png", "ACT-04", "Luồng Khởi hành & Bắt đầu Chuyến đi", "Trip Start & Check-in Flow",
     "Chủ xe thực hiện check-in trực tuyến trước khi lăn bánh, nhập ODO khởi hành và phần trăm pin thực tế, kích hoạt trạng thái chuyến đi IN_PROGRESS."),
    ("act_05_return_and_post_inspection.png", "ACT-05", "Luồng Nghiệm thu Trả xe & Kiểm định Tổn hại", "Trip Return & Post-Inspection Flow",
     "Chủ xe gửi yêu cầu trả xe, nhân viên kỹ thuật kiểm tra hiện trường, lập danh mục tổn hại (nếu có), đối soát năng lượng tiêu thụ và kết thúc chuyến đi."),
    ("act_06_charging_energy_inventory.png", "ACT-06", "Luồng Phiên sạc & Tính giá Năng lượng WAC", "Charging & Energy Inventory WAC Flow",
     "Quy trình cắm sạc pin, chốt số kWh nạp, áp dụng tỷ lệ tổn hao 10%, cập nhật giá vốn bình quân gia quyền WAC vào kho năng lượng xe."),
    ("act_07_expense_allocation_payment.png", "ACT-07", "Luồng Phân bổ Chi phí Định kỳ & Thanh toán", "Expense Allocation & Settlement Flow",
     "Quy trình phân rã chi phí: Chi phí sạc chuyến đi gán 100% cho người dùng lái xe, chi phí chung chia theo tỷ lệ vốn, lập nghĩa vụ nộp tiền và tất toán."),
    ("act_08_ownership_transfer.png", "ACT-08", "Luồng Chuyển nhượng Cổ phần Đồng sở hữu", "Ownership Share Transfer Flow",
     "Bên bán khởi tạo đề nghị chuyển nhượng X% vốn, bên mua bấm đồng thuận, trưởng nhóm duyệt và hệ thống tự động tái cân bằng danh bạ cổ đông trong 1 giao dịch."),
    ("act_09_member_invitation_contract.png", "ACT-09", "Luồng Mời Thành viên & Ký Hợp đồng", "Member Invitation & Contract Signing",
     "Trưởng nhóm gửi thư mời gia nhập nhóm xe, thành viên mới xác nhận đồng ý điều khoản, thực hiện ký số điện tử và hệ thống sinh hợp đồng số có giá trị pháp lý."),
    ("act_10_voting_democracy.png", "ACT-10", "Luồng Biểu quyết Đề xuất theo Trọng số Cổ phần", "Democratic Voting & Weighting Flow",
     "Thành viên đề xuất phương án, hệ thống mở cổng bỏ phiếu, mỗi lá phiếu được nhân với trọng số phần trăm cổ phần của thành viên đó để ra kết quả chung cuộc."),
    ("act_11_dispute_mediation.png", "ACT-11", "Luồng Giải quyết Khiếu nại & Hòa giải Tranh chấp", "Dispute Mediation & Resolution Flow",
     "Thành viên khiếu nại về chi phí sạc hoặc vết xước tổn hại, ban quản trị tiếp nhận, tra cứu lịch sử kiểm định và đưa ra quyết định hòa giải có hiệu lực."),
    ("act_12_gantt_roadmap.png", "ACT-12", "Lộ trình Phát triển Dự án & Tiến độ Triển khai", "Project Implementation Roadmap & Gantt",
     "Kế hoạch triển khai dự án qua 6 giai đoạn phát triển theo mô hình Agile/Scrum: Khảo sát nghiệp vụ, Thiết kế UML, Phát triển Backend, Xây dựng 3D, Kiểm thử và Nghiệm thu."),

    # 4.4 Sequence (SEQ-01 -> SEQ-20)
    ("seq_01_login_jwt.png", "SEQ-01", "Đăng nhập và Xác thực JWT", "Login & JWT Token Generation",
     "Tương tác tuần tự giữa UI, AuthController, AuthService, AuthenticationManager và JwtTokenProvider để cấp Access/Refresh Token an toàn."),
    ("seq_02_jwt_protected_api.png", "SEQ-02", "Truy xuất API bảo vệ bằng Bearer Token", "Protected API Filter & SecurityContext",
     "Quá trình JwtAuthenticationFilter đánh chặn HTTP request, giải mã JWT Claims, nạp UserDetails vào SecurityContextHolder và điều phối tới Controller."),
    ("seq_03_booking_creation_conflict.png", "SEQ-03", "Đặt lịch xe và Khử xung đột", "Booking Creation & Conflict Prevention",
     "Thuật toán kiểm tra xung đột thời gian bằng câu truy vấn SELECT giao thoa khoảng giờ trên CSDL, bảo đảm không cho phép đặt xe trùng lịch."),
    ("seq_04_handover_verification.png", "SEQ-04", "Xác minh Bàn giao xe Kỹ thuật", "Handover Verification Flow",
     "Nhân viên gửi yêu cầu đối soát bàn giao xe, hệ thống cập nhật ODO/Pin xuất phát và Co-Owner ký điện tử xác nhận."),
    ("seq_05_checkin_odometer_battery.png", "SEQ-05", "Khởi hành và Bắt đầu Chuyến đi", "Trip Start & Check-in",
     "Chủ xe gửi dữ liệu check-in ODO và mức pin, hệ thống kiểm tra điều kiện an toàn (Pin >= 20%) và chuyển trạng thái chuyến đi sang IN_PROGRESS."),
    ("seq_06_damage_checklist_logging.png", "SEQ-06", "Ghi nhận Kiểm định Tổn hại Xe", "Damage Checklist & Photo Logging",
     "Nhân viên tải danh mục kiểm định, ảnh chụp thực tế và lưu tọa độ vết trầy xước vào bảng vehicle_inspection_damages."),
    ("seq_07_trip_return_and_inspection.png", "SEQ-07", "Trả xe, Kiểm định và Đối soát Năng lượng", "Trip Return, Technical Inspection & Energy Settlement",
     "Sự phối hợp chặt chẽ giữa TripService, VehicleInspectionService, EnergyInventoryService và ExpenseService để chốt toàn bộ nghĩa vụ kỹ thuật và tài chính khi trả xe."),
    ("seq_08_trip_cancellation_refund.png", "SEQ-08", "Hủy Đặt lịch và Giải phóng Khung giờ", "Booking Cancellation & Slot Release",
     "Chủ xe thực hiện hủy lịch trước giờ khởi hành tối thiểu 2 tiếng, hệ thống cập nhật trạng thái CANCELLED và trả xe về trạng thái AVAILABLE."),
    ("seq_09_charging_session_start.png", "SEQ-09", "Khởi tạo Phiên sạc Xe điện", "Charging Session Start",
     "Nhân viên cắm sạc, chọn trụ sạc, hệ thống ghi nhận phiên sạc IN_PROGRESS và cập nhật trạng thái xe sang CHARGING."),
    ("seq_10_energy_inventory_wac.png", "SEQ-10", "Hoàn tất Sạc và Tính giá Bình quân WAC", "Charging Completion & WAC Calculation",
     "Tính toán lượng điện nạp thực tế sau khi trừ 10% tổn hao, cập nhật đơn giá bình quân gia quyền WAC vào bảng vehicle_energy_inventories."),
    ("seq_11_monthly_expense_allocation.png", "SEQ-11", "Phân bổ Chi phí Định kỳ theo Tỷ lệ Vốn", "Monthly Expense Allocation by Equity",
     "Hệ thống tự động duyệt danh sách cổ đông sở hữu xe, áp dụng tỷ lệ phần trăm vốn để chia nhỏ hóa đơn bảo hiểm/bảo dưỡng định kỳ."),
    ("seq_12_equity_ratio_calculation.png", "SEQ-12", "Truy vấn và Kiểm định Tổng Cổ phần", "Equity Ratio Verification & Invariant Check",
     "Truy vấn toàn bộ cổ phần đang ACTIVE của một xe và kiểm tra tính toàn vẹn bất biến tổng tỷ lệ sở hữu luôn bằng đúng 100.0000%."),
    ("seq_13_demo_payment_verification.png", "SEQ-13", "Nộp và Xác minh Thanh toán Demo", "Demo Payment Submission & Verification",
     "Chủ xe nộp chứng từ chuyển khoản demo, nhân viên tài chính đối soát giao dịch và đánh dấu khoản nợ thành SETTLED."),
    ("seq_14_ownership_transfer.png", "SEQ-14", "Chuyển nhượng Cổ phần Đồng sở hữu", "Ownership Share Transfer Execution",
     "Thực hiện giao dịch nguyên tử @Transactional điều chỉnh giảm cổ phần bên chuyển, tăng cổ phần bên nhận và ghi nhật ký biến động tài sản."),
    ("seq_15_contract_electronic_signing.png", "SEQ-15", "Ký điện tử Hợp đồng Đa bên", "Multi-Party Electronic Contract Signing",
     "Các đồng sở hữu lần lượt ký số bằng mã OTP, hệ thống kiểm đếm số chữ ký hợp lệ và tự động chuyển trạng thái hợp đồng sang FULLY_EXECUTED."),
    ("seq_16_smart_contract_simulation.png", "SEQ-16", "Mô phỏng Thực thi Smart Contract", "Smart Contract Simulation & Ledger Hashing",
     "Bộ lập lịch tự động kích hoạt điều kiện vi phạm hợp đồng (ví dụ quá hạn nộp tiền) và ghi nhận khối sổ cái băm liên kết (LedgerBlock)."),
    ("seq_17_voting_proposal_cast.png", "SEQ-17", "Tạo Đề xuất và Bỏ phiếu Biểu quyết", "Voting Proposal & Weighted Vote Casting",
     "Thành viên bỏ phiếu biểu quyết với trọng số tự động gán bằng chính tỷ lệ phần trăm cổ phần mà cá nhân đó nắm giữ."),
    ("seq_18_maintenance_scheduling.png", "SEQ-18", "Cảnh báo Bảo dưỡng và Lập Lịch", "Maintenance Alert & Work Order Scheduling",
     "Hệ thống phát hiện mốc ODO lũy kế đạt ngưỡng 15.000 km, tạo cảnh báo và hỗ trợ nhân viên lập lệnh bảo dưỡng kỹ thuật."),
    ("seq_19_threejs_loading_caching.png", "SEQ-19", "Tải Tiến trình và Bộ đệm Mô hình 3D", "Three.js 3D Asset Loading & Memory Caching",
     "Quy trình hook useGLTF kiểm tra cache IndexedDB/Browser, tải file nhị phân .glb, giải nén texture GPU KTX2 và đưa vào Scene Graph."),
    ("seq_20_hotspot_inspection_interaction.png", "SEQ-20", "Tương tác Tổn hại 3D với Raycasting", "3D Raycasting & Hotspot Inspection Interaction",
     "Phát tia Raycaster từ camera theo tọa độ chuột, xác định tọa độ giao cắt trên bề mặt Mesh xe và kích hoạt Modal hiển thị chi tiết vết trầy xước."),

    # 4.5 Class (CLASS-01 -> CLASS-08)
    ("class_01_overall_domain.png", "CLASS-01", "Sơ đồ Lớp Tổng quan Mô hình Miền Nghiệp vụ", "Core Domain Class Diagram Overview",
     "Mô hình khái niệm thể hiện mối quan hệ giữa các thực thể cốt lõi: User, Role, Vehicle, CoOwnershipGroup, Booking, Trip, Expense, Contract."),
    ("class_02_auth_user.png", "CLASS-02", "Sơ đồ Lớp Quản lý Người dùng & Xác thực", "User, Role & Authentication Domain Classes",
     "Chi tiết các thuộc tính và phương thức của User, Role, UserPrincipal, RefreshToken, PasswordResetToken và AuditLog."),
    ("class_03_vehicle_ownership.png", "CLASS-03", "Sơ đồ Lớp Đội xe & Nhóm Đồng sở hữu", "Vehicle & Co-Ownership Group Domain Classes",
     "Quan hệ giữa Vehicle, CoOwnershipGroup, GroupMember, OwnershipShare và OwnershipTransferRequest."),
    ("class_04_booking_trip_handover.png", "CLASS-04", "Sơ đồ Lớp Đặt xe, Chuyến đi & Bàn giao", "Booking, Trip & Handover Domain Classes",
     "Cấu trúc dữ liệu và logic liên kết giữa Booking, VehicleHandover, Trip, TripExtensionRequest và OdometerLog."),
    ("class_05_inspection_damage_maintenance.png", "CLASS-05", "Sơ đồ Lớp Giám định Tổn hại & Bảo dưỡng", "Inspection, Damage & Maintenance Domain Classes",
     "Mối liên kết giữa VehicleInspection, VehicleInspectionDamage, DamageHotspot và MaintenanceRecord."),
    ("class_06_charging_energy_inventory.png", "CLASS-06", "Sơ đồ Lớp Phiên sạc & Kho Năng lượng", "Charging Session & Energy Inventory Domain Classes",
     "Cấu trúc lớp quản lý năng lượng: ChargingStation, ChargingSession, VehicleEnergyInventory và VehicleEnergyTransaction."),
    ("class_07_finance_expense_payment.png", "CLASS-07", "Sơ đồ Lớp Tài chính, Chi phí & Quyết toán", "Finance, Expense & Payment Domain Classes",
     "Cấu trúc lớp kế toán và thanh toán: Expense, ExpenseShare, PersonalExpensePayment và ExpenseAllocationPolicy."),
    ("class_08_governance_contract_voting_dispute.png", "CLASS-08", "Sơ đồ Lớp Quản trị, Hợp đồng & Biểu quyết", "Governance, Contract, Voting & Dispute Classes",
     "Mô hình thực thể quản trị tập thể: CoOwnershipContract, ContractSignature, VoteProposal, ProposalVote, Dispute và LedgerBlock."),

    # 4.6 ERD (ERD-01 -> ERD-08)
    ("erd_01_overall_conceptual.png", "ERD-01", "Mô hình Dữ liệu Khái niệm Toàn cục (46 Bảng)", "Global Relational Database Schema ERD",
     "Bản đồ cấu trúc toàn bộ 46 bảng quan hệ CSDL MySQL 8.0+, thể hiện khóa chính (PK), khóa ngoại (FK) và liên kết 1-nhiều, nhiều-nhiều."),
    ("erd_02_auth_users.png", "ERD-02", "Lược đồ Bảng Người dùng & Phân quyền", "Users, Roles & Security Tables Schema",
     "Chi tiết các bảng users, roles, user_roles, refresh_tokens, audit_logs."),
    ("erd_03_vehicles_ownership.png", "ERD-03", "Lược đồ Bảng Phương tiện & Đồng sở hữu", "Vehicles, Groups & Ownership Shares Schema",
     "Chi tiết các bảng vehicles, vehicle_specs, co_ownership_groups, group_members, ownership_shares, ownership_transfer_requests."),
    ("erd_04_bookings_trips_handovers.png", "ERD-04", "Lược đồ Bảng Lịch đặt, Chuyến đi & Bàn giao", "Bookings, Trips & Handovers Schema",
     "Chi tiết các bảng bookings, vehicle_handovers, trips, trip_extension_requests."),
    ("erd_05_inspections_damages.png", "ERD-05", "Lược đồ Bảng Kiểm định Kỹ thuật & Tổn hại", "Inspections & Damage Hotspots Schema",
     "Chi tiết các bảng vehicle_inspections, vehicle_inspection_damages, damage_records."),
    ("erd_06_charging_energy_inventory.png", "ERD-06", "Lược đồ Bảng Trạm sạc & Kho Năng lượng", "Charging Stations & Energy Inventories Schema",
     "Chi tiết các bảng charging_stations, charging_sessions, vehicle_energy_inventories, vehicle_energy_transactions."),
    ("erd_07_expenses_payments.png", "ERD-07", "Lược đồ Bảng Tài chính & Quyết toán Chi phí", "Expenses, Shares & Payments Schema",
     "Chi tiết các bảng expenses, expense_shares, personal_expense_payments."),
    ("erd_08_contracts_voting_disputes.png", "ERD-08", "Lược đồ Bảng Hợp đồng, Biểu quyết & Tranh chấp", "Contracts, Proposals, Disputes & Ledger Schema",
     "Chi tiết các bảng co_ownership_contracts, contract_signatures, vote_proposals, proposal_votes, disputes, ledger_blocks."),

    # 4.7 State Machine (STATE-01 -> STATE-10)
    ("state_01_vehicle_lifecycle.png", "STATE-01", "Vòng đời Trạng thái Phương tiện Kỹ thuật", "Vehicle Technical Lifecycle State Machine",
     "Các trạng thái chuyển dịch của xe: AVAILABLE -> RESERVED -> IN_USE -> CHARGING -> MAINTENANCE -> RETIRED."),
    ("state_02_booking_lifecycle.png", "STATE-02", "Vòng đời Trạng thái Đặt lịch Xe", "Booking Lifecycle State Machine",
     "Vòng đời lịch đặt: PENDING -> CONFIRMED -> IN_PROGRESS -> COMPLETED / CANCELLED."),
    ("state_03_trip_lifecycle.png", "STATE-03", "Vòng đời Trạng thái Chuyến đi", "Trip Lifecycle State Machine",
     "Trạng thái hành trình: SCHEDULED -> IN_PROGRESS -> RETURN_REQUESTED -> COMPLETED."),
    ("state_04_handover_inspection.png", "STATE-04", "Vòng đời Bàn giao & Nghiệm thu Kỹ thuật", "Handover Verification & Technical Inspection Lifecycle",
     "Vòng đời biên bản: PENDING_STAFF -> STAFF_VERIFIED -> OWNER_ACKNOWLEDGED -> COMPLETED."),
    ("state_05_charging_session.png", "STATE-05", "Vòng đời Phiên sạc Điện Thông minh", "Charging Session Lifecycle State Machine",
     "Vòng đời sạc: INITIATED -> IN_PROGRESS -> COMPLETED / FAILED."),
    ("state_06_expense_payment.png", "STATE-06", "Vòng đời Phân bổ Chi phí & Thanh toán", "Expense Share & Payment Lifecycle",
     "Vòng đời nghĩa vụ nợ: DRAFT -> ALLOCATED -> PARTIALLY_PAID -> SETTLED."),
    ("state_07_contract_version.png", "STATE-07", "Vòng đời Phiên bản Hợp đồng Pháp lý", "Contract Version Lifecycle State Machine",
     "Vòng đời hợp đồng: DRAFT -> PENDING_SIGNATURES -> PARTIALLY_SIGNED -> FULLY_EXECUTED -> SUPERSEDED."),
    ("state_08_voting_proposal.png", "STATE-08", "Vòng đời Đề xuất Biểu quyết Dân chủ", "Voting Proposal Lifecycle State Machine",
     "Vòng đời biểu quyết: DRAFT -> OPEN -> VOTING -> PASSED / REJECTED -> EXECUTED."),
    ("state_09_dispute_lifecycle.png", "STATE-09", "Vòng đời Giải quyết Khiếu nại Tranh chấp", "Dispute Resolution Lifecycle State Machine",
     "Vòng đời tranh chấp: OPEN -> UNDER_REVIEW -> RESOLVED / DISMISSED."),
    ("state_10_ownership_transfer.png", "STATE-10", "Vòng đời Chuyển nhượng Cổ phần Sở hữu", "Ownership Share Transfer Lifecycle",
     "Vòng đời chuyển nhượng vốn: INITIATED -> PENDING_CONSENT -> PENDING_APPROVAL -> COMPLETED / REJECTED."),

    # 4.8 Component & Deployment (COMP-01 -> COMP-03, DEPLOY-01)
    ("comp_01_frontend_component_hierarchy.png", "COMP-01", "Cấu trúc Thành phần Phân cấp Frontend React", "Frontend Component Hierarchy",
     "Cấu trúc các khối thành phần React SPA: App, Layout, Roles Navigation, Subsystem Views, Zustand Stores, Three.js Canvas và API Client."),
    ("comp_02_backend_package_dependencies.png", "COMP-02", "Cấu trúc Phụ thuộc Gói Backend Spring Boot", "Backend Package Dependencies",
     "Sự phụ thuộc phân cấp giữa các package: controller, service, repository, model, security, config, dto, exception, util."),
    ("comp_03_garage_3d_spatial_ui.png", "COMP-03", "Cấu trúc Thành phần Không gian 3D Garage UI", "Garage 3D Spatial UI Components",
     "Liên kết nội bộ trong không gian 3D: GarageScene, VehicleModel, CameraRig, DamageHotspots, BatteryXRayView, FloatingOverlays."),
    ("deploy_01_system_deployment.png", "DEPLOY-01", "Sơ đồ Triển khai Hạ tầng Vật lý & Mạng", "Physical System Deployment & Topology",
     "Kiến trúc triển khai vật lý: Client Browsers (WebGL/Wasm), Nginx Load Balancer / Reverse Proxy, Spring Boot Application Cluster, MySQL Database Server và S3/CDN Static Model Storage.")
]

# Tạo nội dung Chapter 4 hoàn chỉnh với hình ảnh nhúng trực tiếp
c4_parts = []
c4_parts.append("# CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG PHÂN RÃ HIERARCHICAL\n")
c4_parts.append("Chương này trình bày toàn bộ phân tích kiến trúc và thiết kế hướng đối tượng của hệ thống EVShare 3D thông qua **81 sơ đồ thiết kế phân rã** chuẩn mực từ Cấp 0 (Tổng thể) đến Cấp 3 (Thực thi chi tiết). Tất cả các sơ đồ đều được mô hình hóa dựa trên mã nguồn thực tế của dự án, bảo đảm tính chân thực, nhất quán và đầy đủ cho báo cáo tốt nghiệp kỹ sư phần mềm.\n")

section_headers = {
    0: "\n## 4.1. THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE DIAGRAMS - ARCH-01 ĐẾN ARCH-06)\n",
    6: "\n## 4.2. MÔ HÌNH HÓA USE CASE PHÂN RÃ (USE CASE DIAGRAMS - UC-01 ĐẾN UC-13)\n",
    19: "\n## 4.3. SƠ ĐỒ HOẠT ĐỘNG NGHIỆP VỤ (ACTIVITY DIAGRAMS - ACT-01 ĐẾN ACT-12)\n",
    31: "\n## 4.4. SƠ ĐỒ TUẦN TỰ TƯƠNG TÁC THÔNG ĐIỆP (SEQUENCE DIAGRAMS - SEQ-01 ĐẾN SEQ-20)\n",
    51: "\n## 4.5. SƠ ĐỒ LỚP THỰC THỂ VÀ MÔ HÌNH MIỀN (CLASS DIAGRAMS - CLASS-01 ĐẾN CLASS-08)\n",
    59: "\n## 4.6. THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ (DATABASE ERD - ERD-01 ĐẾN ERD-08)\n",
    67: "\n## 4.7. SƠ ĐỒ MÁY TRẠNG THÁI VÒNG ĐỜI (STATE MACHINE DIAGRAMS - STATE-01 ĐẾN STATE-10)\n",
    77: "\n## 4.8. SƠ ĐỒ THÀNH PHẦN VÀ TRIỂN KHAI (COMPONENT & DEPLOYMENT - COMP-01 ĐẾN COMP-03, DEPLOY-01)\n"
}

for idx, (png_name, code, title_vi, title_en, desc) in enumerate(diagrams_info):
    if idx in section_headers:
        c4_parts.append(section_headers[idx])
        
    fig_num = f"4.{idx + 1}"
    c4_parts.append(f"### 4.{idx + 1}. {title_vi} ({code})\n")
    c4_parts.append(f"![Hình {fig_num}: {title_vi}](diagrams/rendered/{png_name})\n")
    c4_parts.append(f"**Hình {fig_num}: {title_vi} (*{title_en}*)**\n")
    c4_parts.append(f"\n**Phân tích kỹ thuật & nghiệp vụ:**\n")
    c4_parts.append(f"{desc}\n")
    c4_parts.append(f"- **Mã định danh sơ đồ:** `{code}`\n")
    c4_parts.append(f"- **Tệp hình ảnh kết xuất:** `diagrams/rendered/{png_name}`\n")
    c4_parts.append(f"- **Tệp nguồn mô hình hóa:** `diagrams/source/{png_name.replace('.png', '.puml')}`\n")
    c4_parts.append("\n---\n")

c4_final_content = "\n".join(c4_parts)

# Ghép toàn bộ báo cáo hoàn chỉnh
full_report_parts = [
    fm_content,
    "\n<pagebreak/>\n\n",
    c1_content,
    "\n<pagebreak/>\n\n",
    c2_content,
    "\n<pagebreak/>\n\n",
    c3_content,
    "\n<pagebreak/>\n\n",
    c4_final_content,
    "\n<pagebreak/>\n\n",
    c5_content,
    "\n<pagebreak/>\n\n",
    c6_content,
    "\n<pagebreak/>\n\n",
    c7_content,
    "\n<pagebreak/>\n\n",
    c8_content
]

final_full_markdown = "".join(full_report_parts)

with open(OUTPUT_MD, "w", encoding="utf-8") as f:
    f.write(final_full_markdown)

print(f"Generated {OUTPUT_MD} successfully. Total size: {len(final_full_markdown)} characters.")
