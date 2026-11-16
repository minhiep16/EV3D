# -*- coding: utf-8 -*-
"""
gen_group2_uc.py - Tạo các sơ đồ Use Case phân rã (UC-01 đến UC-13)
"""
import os

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\source"
os.makedirs(BASE_DIR, exist_ok=True)

SKIN_HEADER = """
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam handwritten false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2
skinparam actorStyle awesome
"""

uc_diagrams = {
    "uc_01_overall.puml": f"""@startuml
title SƠ ĐỒ USE CASE TỔNG QUÁT TOÀN HỆ THỐNG EVSHARE 3D (LEVEL 0)
{SKIN_HEADER}

left to right direction

actor "Quản Trị Viên\\n(ADMIN)" as Admin #D4E6F1
actor "Nhân Viên Điều Hành\\n(STAFF)" as Staff #D1F2EB
actor "Chủ Đồng Sở Hữu\\n(CO_OWNER)" as CoOwner #FCF3CF

package "Hệ Thống EVShare 3D" #F8F9FA {{
    package "Phân Hệ Xác Thực & Tài Khoản" {{
        usecase "Đăng Nhập & Đăng Xuất" as UC_Auth
        usecase "Quản Lý Tài Khoản & Phân Quyền" as UC_UserMgmt
    }}
    package "Phân Hệ Đặt Xe & Vận Hành" {{
        usecase "Đặt Lịch Sử Dụng Xe" as UC_Booking
        usecase "Bàn Giao & Kiểm Tra Xe" as UC_Handover
        usecase "Vận Hành Chuyến Đi & Trả Xe" as UC_Trip
    }}
    package "Phân Hệ Năng Lượng & Trạm Sạc" {{
        usecase "Nạp Sạc Pin Xe Điện" as UC_Charging
        usecase "Quản Trị Tồn Kho Năng Lượng (WAC)" as UC_Energy
    }}
    package "Phân Hệ Tài Chính & Chi Phí" {{
        usecase "Phân Bổ Chi Phí Trực Tiếp" as UC_Expense
        usecase "Thanh Toán Cá Nhân (DEMO)" as UC_Payment
    }}
    package "Phân Hệ Quản Trị Nhóm & Pháp Lý" {{
        usecase "Quản Lý Cổ Phần & Chuyển Nhượng" as UC_Ownership
        usecase "Ký Hợp Đồng Điện Tử (DEMO)" as UC_Contract
        usecase "Biểu Quyết Tập Thể" as UC_Voting
        usecase "Khiếu Nại & Tranh Chấp" as UC_Dispute
    }}
    package "Phân Hệ Không Gian 3D" {{
        usecase "Tương Tác Virtual Garage 3D" as UC_Garage3D
    }}
}}

Admin --> UC_UserMgmt
Admin --> UC_Ownership
Admin --> UC_Dispute
Admin --> UC_Garage3D

Staff --> UC_Handover
Staff --> UC_Charging
Staff --> UC_Expense
Staff --> UC_Dispute
Staff --> UC_Garage3D

CoOwner --> UC_Booking
CoOwner --> UC_Trip
CoOwner --> UC_Charging
CoOwner --> UC_Payment
CoOwner --> UC_Contract
CoOwner --> UC_Voting
CoOwner --> UC_Dispute
CoOwner --> UC_Garage3D

Admin --|> UC_Auth
Staff --|> UC_Auth
CoOwner --|> UC_Auth

@enduml
""",

    "uc_02_auth_user.puml": f"""@startuml
title USE CASE: XÁC THỰC VÀ QUẢN LÝ TÀI KHOẢN (UC-02)
{SKIN_HEADER}

left to right direction

actor "Người Dùng" as User
actor "Quản Trị Viên (ADMIN)" as Admin

package "Phân Hệ Xác Thực & Tài Khoản" #F8F9FA {{
    usecase "Đăng Nhập Hệ Thống" as UC_Login
    usecase "Làm Mới Token (Refresh Token)" as UC_Refresh
    usecase "Đăng Xuất Khỏi Hệ Thống" as UC_Logout
    usecase "Xem Thông Tin Cá Nhân" as UC_ViewProfile
    usecase "Đổi Mật Khẩu" as UC_ChangePass
    usecase "Xem Danh Sách Tài Khoản" as UC_ListUsers
    usecase "Thay Đổi Vai Trò Người Dùng" as UC_ChangeRole
    usecase "Khóa / Mở Khóa Tài Khoản" as UC_LockUser
}}

User --> UC_Login
User --> UC_Logout
User --> UC_ViewProfile
User --> UC_ChangePass
UC_Login ..> UC_Refresh : <<extend>> (Khi hết hạn)

Admin --> UC_ListUsers
Admin --> UC_ChangeRole
Admin --> UC_LockUser
Admin --|> User

@enduml
""",

    "uc_03_admin.puml": f"""@startuml
title USE CASE: QUẢN TRỊ VIÊN VÀ GIÁM SÁT HỆ THỐNG (UC-03)
{SKIN_HEADER}

left to right direction

actor "Quản Trị Viên (ADMIN)" as Admin

package "Trung Tâm Chỉ Huy Quản Trị" #F8F9FA {{
    usecase "Xem Báo Cáo Phân Tích Tổng Thể" as UC_Stats
    usecase "Quản Lý Danh Mục Toàn Đội Xe" as UC_FleetMgmt
    usecase "Khởi Tạo Nhóm Đồng Sở Hữu" as UC_CreateGroup
    usecase "Giám Sát Tỷ Lệ Sở Hữu (100% Invariant)" as UC_MonitorShares
    usecase "Xem Nhật Ký Kiểm Toán (Audit Logs)" as UC_AuditLogs
    usecase "Cấu Hình Tham Số Hệ Thống" as UC_SysConfig
    usecase "Hòa Giải Tranh Chấp Cấp Cao" as UC_AdminDispute
}}

Admin --> UC_Stats
Admin --> UC_FleetMgmt
Admin --> UC_CreateGroup
Admin --> UC_MonitorShares
Admin --> UC_AuditLogs
Admin --> UC_SysConfig
Admin --> UC_AdminDispute

@enduml
""",

    "uc_04_staff.puml": f"""@startuml
title USE CASE: NHÂN VIÊN VẬN HÀNH VÀ ĐIỀU HÀNH BÃI XE (UC-04)
{SKIN_HEADER}

left to right direction

actor "Nhân Viên (STAFF)" as Staff

package "Phân Hệ Điều Hành Kỹ Thuật" #F8F9FA {{
    usecase "Theo Dõi Danh Sách Xe Tại Bãi" as UC_FleetStatus
    usecase "Lập Biên Bản Bàn Giao Xe Kỹ Thuật" as UC_VerifyHandover
    usecase "Kiểm Tra Kỹ Thuật Khi Trả Xe (Checklist)" as UC_Inspection
    usecase "Gắn Điểm Hư Hỏng Mới Trên Mô Hình 3D" as UC_DamageHotspot
    usecase "Thực Hiện Sạc Xe Vận Hành (Miễn Phí)" as UC_StaffCharge
    usecase "Đối Soát & Phê Duyệt Thanh Toán Cá Nhân" as UC_VerifyPayment
    usecase "Điều Tra & Hòa Giải Khiếu Nại Tranh Chấp" as UC_InvestigateDispute
}}

Staff --> UC_FleetStatus
Staff --> UC_VerifyHandover
Staff --> UC_Inspection
Staff --> UC_DamageHotspot
Staff --> UC_StaffCharge
Staff --> UC_VerifyPayment
Staff --> UC_InvestigateDispute

UC_Inspection ..> UC_DamageHotspot : <<include>> (Nếu phát hiện trầy xước)

@enduml
""",

    "uc_05_co_owner.puml": f"""@startuml
title USE CASE: CHỦ ĐỒNG SỞ HỮU VÀ TRẢI NGHIỆM GARAGE (UC-05)
{SKIN_HEADER}

left to right direction

actor "Chủ Đồng Sở Hữu (CO_OWNER)" as CoOwner

package "Không Gian Tương Tác Co-Owner" #F8F9FA {{
    usecase "Khám Phá Xe Trong Virtual Garage 3D" as UC_Explore3D
    usecase "Bật Chế Độ X-Ray Kiểm Tra Pin" as UC_XRay
    usecase "Đặt Lịch Sử Dụng Xe Điện" as UC_BookCar
    usecase "Ký Xác Nhận Biên Bản Bàn Giao Xe" as UC_AckHandover
    usecase "Bắt Đầu Chuyến Đi (Start Trip)" as UC_StartTrip
    usecase "Yêu Cầu Gia Hạn Thêm Giờ" as UC_ExtendTrip
    usecase "Yêu Cầu Trả Xe (Return Request)" as UC_RequestReturn
    usecase "Nộp Thông Tin Thanh Toán Nợ Điện (DEMO)" as UC_PayBill
    usecase "Biểu Quyết Đề Xuất Nhóm" as UC_Vote
}}

CoOwner --> UC_Explore3D
CoOwner --> UC_XRay
CoOwner --> UC_BookCar
CoOwner --> UC_AckHandover
CoOwner --> UC_StartTrip
CoOwner --> UC_ExtendTrip
CoOwner --> UC_RequestReturn
CoOwner --> UC_PayBill
CoOwner --> UC_Vote

UC_Explore3D ..> UC_XRay : <<extend>>
UC_StartTrip ..> UC_AckHandover : <<include>>

@enduml
""",

    "uc_06_booking_trip.puml": f"""@startuml
title USE CASE: ĐẶT LỊCH VÀ QUẢN LÝ CHUYẾN ĐI (UC-06)
{SKIN_HEADER}

left to right direction

actor "CO_OWNER" as CoOwner
actor "STAFF" as Staff
actor "Hệ Thống Tự Động" as System

package "Quản Lý Đặt Lịch & Hành Trình" #F8F9FA {{
    usecase "Xem Lịch Trình Xe Theo Trục Thời Gian" as UC_ViewTimeline
    usecase "Tạo Lịch Đặt Mới (Create Booking)" as UC_CreateBooking
    usecase "Kiểm Tra Khử Xung Đột Thời Gian" as UC_ConflictCheck
    usecase "Hủy Lịch Đặt Hợp Lệ" as UC_CancelBooking
    usecase "Khởi Hành Chuyến Đi" as UC_StartTrip
    usecase "Gia Hạn Chuyến Đi Tự Động (Không Trùng)" as UC_ExtendDirect
    usecase "Gia Hạn Cần Đàm Phán Đồng Thuận" as UC_ExtendNegotiate
    usecase "Gửi Yêu Cầu Trả Xe" as UC_ReqReturn
    usecase "Chốt Hoàn Tất Chuyến Đi" as UC_ConfirmReturn
}}

CoOwner --> UC_ViewTimeline
CoOwner --> UC_CreateBooking
CoOwner --> UC_CancelBooking
CoOwner --> UC_StartTrip
CoOwner --> UC_ExtendDirect
CoOwner --> UC_ExtendNegotiate
CoOwner --> UC_ReqReturn

Staff --> UC_ConfirmReturn
System --> UC_ConflictCheck

UC_CreateBooking ..> UC_ConflictCheck : <<include>>
UC_ExtendDirect ..> UC_ConflictCheck : <<include>>
UC_ReqReturn <.. UC_ConfirmReturn : <<include>>

@enduml
""",

    "uc_07_handover_return_inspection.puml": f"""@startuml
title USE CASE: BÀN GIAO, TRẢ XE VÀ KIỂM TRA KỸ THUẬT (UC-07)
{SKIN_HEADER}

left to right direction

actor "Nhân Viên (STAFF)" as Staff
actor "Chủ Xe (CO_OWNER)" as CoOwner

package "Kiểm Tra & Bàn Giao Kỹ Thuật" #F8F9FA {{
    usecase "Lập Biên Bản Bàn Giao Xe Kỹ Thuật" as UC_GenHandover
    usecase "Ký Xác Nhận Tình Trạng Lúc Nhận Xe" as UC_SignHandover
    usecase "Gửi Chỉ Số ODO & Pin Lúc Đỗ Xe" as UC_SendReturnMetrics
    usecase "Kiểm Tra Checklist Kỹ Thuật Lúc Trả" as UC_Checklist
    usecase "So Sánh Hiện Trạng & Ghi Nhận Hư Hỏng Mới" as UC_CompareDamage
    usecase "Ký Chốt Biên Bản Nghiệm Thu Hoàn Tất" as UC_CloseTrip
}}

Staff --> UC_GenHandover
Staff --> UC_Checklist
Staff --> UC_CompareDamage
Staff --> UC_CloseTrip

CoOwner --> UC_SignHandover
CoOwner --> UC_SendReturnMetrics

UC_GenHandover ..> UC_SignHandover : <<include>>
UC_SendReturnMetrics <.. UC_Checklist : <<include>>
UC_Checklist ..> UC_CompareDamage : <<extend>>
UC_Checklist ..> UC_CloseTrip : <<include>>

@enduml
""",

    "uc_08_charging_energy.puml": f"""@startuml
title USE CASE: NẠP SẠC PIN VÀ TỒN KHO NĂNG LƯỢNG (UC-08)
{SKIN_HEADER}

left to right direction

actor "Người Dùng (CoOwner / Staff)" as User
actor "Nhân Viên (STAFF)" as Staff
actor "Động Cơ Năng Lượng" as Engine

package "Phân Hệ Nạp Sạc & Tồn Kho Điện" #F8F9FA {{
    usecase "Xem Danh Mục Trụ Sạc & Trạng Thái" as UC_ViewStations
    usecase "Cắm Sạc & Bắt Đầu Phiên Sạc" as UC_StartCharge
    usecase "Theo Dõi Tiến Trình Nạp SOC/kWh" as UC_MonitorCharge
    usecase "Hoàn Tất Phiên Sạc Điện" as UC_StopCharge
    usecase "Thực Hiện Phiên Sạc Vận Hành Miễn Phí" as UC_StaffCharge
    usecase "Hạch Toán Tổn Hao Điện 10%" as UC_CalcLoss
    usecase "Cập Nhật Đơn Giá Bình Quân Gia Quyền (WAC)" as UC_UpdateWAC
    usecase "Xuất Kho Điện Tiêu Thụ Chuyến Đi" as UC_DeductTripEnergy
}}

User --> UC_ViewStations
User --> UC_StartCharge
User --> UC_MonitorCharge
User --> UC_StopCharge

Staff --> UC_StaffCharge

Engine --> UC_CalcLoss
Engine --> UC_UpdateWAC
Engine --> UC_DeductTripEnergy

UC_StopCharge ..> UC_CalcLoss : <<include>>
UC_CalcLoss ..> UC_UpdateWAC : <<include>>

@enduml
""",

    "uc_09_finance_payment.puml": f"""@startuml
title USE CASE: QUẢN TRỊ TÀI CHÍNH VÀ THANH TOÁN (UC-09)
{SKIN_HEADER}

left to right direction

actor "Nhân Viên / Admin" as StaffAdmin
actor "Chủ Xe (CO_OWNER)" as CoOwner

package "Tài Chính & Phân Bổ Chi Phí" #F8F9FA {{
    usecase "Tạo Hóa Đơn Chi Phí Phương Tiện" as UC_CreateExp
    usecase "Phân Bổ Theo Người Dùng (USER_RESPONSIBILITY)" as UC_AllocUser
    usecase "Phân Bổ Theo Tỷ Lệ Sở Hữu (Hare-Niemeyer)" as UC_AllocOwnership
    usecase "Xem Bảng Kê Nghĩa Vụ Chi Phí Cá Nhân" as UC_ViewShares
    usecase "Gửi Thông Tin Chuyển Khoản DEMO" as UC_SubmitPay
    usecase "Đối Soát & Xác Minh Thanh Toán Thực Tế" as UC_VerifyPay
    usecase "Tất Toán Nghĩa Vụ Tài Chính (SETTLED)" as UC_Settle
}}

StaffAdmin --> UC_CreateExp
StaffAdmin --> UC_VerifyPay
StaffAdmin --> UC_Settle

CoOwner --> UC_ViewShares
CoOwner --> UC_SubmitPay

UC_CreateExp ..> UC_AllocUser : <<extend>>
UC_CreateExp ..> UC_AllocOwnership : <<extend>>
UC_SubmitPay ..> UC_VerifyPay : <<include>>
UC_VerifyPay ..> UC_Settle : <<include>>

@enduml
""",

    "uc_10_ownership_transfer_invitation.puml": f"""@startuml
title USE CASE: ĐỒNG SỞ HỮU, CHUYỂN NHƯỢNG VÀ MỜI THÀNH VIÊN (UC-10)
{SKIN_HEADER}

left to right direction

actor "Trưởng Nhóm (LEADER)" as Leader
actor "Thành Viên (CO_OWNER)" as Member
actor "Người Được Mời" as Invitee

package "Quản Trị Nhóm Đồng Sở Hữu" #F8F9FA {{
    usecase "Gửi Lời Mời Thành Viên Mới" as UC_Invite
    usecase "Xem Quyền Lợi & Nghĩa Vụ Vốn Góp" as UC_ViewInvite
    usecase "Chấp Nhận Lời Mời Gia Nhập" as UC_AcceptInvite
    usecase "Tạo Yêu Cầu Chuyển Nhượng Cổ Phần" as UC_TransferReq
    usecase "Ký Chấp Thuận Chuyển Nhượng" as UC_ConsentTransfer
    usecase "Cập Nhật Tỷ Lệ Cổ Phần & Lưu Lịch Sử" as UC_ExecTransfer
}}

Leader --> UC_Invite
Invitee --> UC_ViewInvite
Invitee --> UC_AcceptInvite

Member --> UC_TransferReq
Leader --> UC_ConsentTransfer

UC_TransferReq ..> UC_ConsentTransfer : <<include>>
UC_ConsentTransfer ..> UC_ExecTransfer : <<include>>
UC_AcceptInvite ..> UC_ExecTransfer : <<include>>

@enduml
""",

    "uc_11_contracts_signatures.puml": f"""@startuml
title USE CASE: HỢP ĐỒNG ĐỒNG SỞ HỮU VÀ KÝ SỐ MÔ PHỎNG (UC-11)
{SKIN_HEADER}

left to right direction

actor "Hệ Thống Backend" as System
actor "Thành Viên Đồng Sở Hữu" as Member

package "Quản Lý Hợp Đồng Số (DEMO)" #F8F9FA {{
    usecase "Tự Động Sinh Phiên Bản Hợp Đồng Mới (DRAFT)" as UC_GenContract
    usecase "Xem Điều Khoản Pháp Lý Hợp Đồng" as UC_ReadContract
    usecase "Ký Xác Nhận Chấp Thuận Hợp Đồng (DEMO Signature)" as UC_SignContract
    usecase "Kiểm Tra Đủ 100% Chữ Ký Nhóm" as UC_CheckAllSigns
    usecase "Kích Hoạt Hợp Đồng (ACTIVE) & Vô Hiệu Phiên Bản Cũ" as UC_ActivateContract
}}

System --> UC_GenContract
System --> UC_CheckAllSigns
System --> UC_ActivateContract

Member --> UC_ReadContract
Member --> UC_SignContract

UC_GenContract ..> UC_SignContract : <<include>>
UC_SignContract ..> UC_CheckAllSigns : <<include>>
UC_CheckAllSigns ..> UC_ActivateContract : <<include>>

@enduml
""",

    "uc_12_voting_disputes.puml": f"""@startuml
title USE CASE: BIỂU QUYẾT TẬP THỂ VÀ GIẢI QUYẾT TRANH CHẤP (UC-12)
{SKIN_HEADER}

left to right direction

actor "Thành Viên (CO_OWNER)" as Member
actor "Nhân Viên (STAFF)" as Staff

package "Dân Chủ & Giải Quyết Tranh Chấp" #F8F9FA {{
    usecase "Tạo Đề Xuất Biểu Quyết Mới" as UC_CreateVote
    usecase "Bỏ Phiếu Đề Xuất (FOR / AGAINST)" as UC_CastVote
    usecase "Tự Động Kiểm Phiếu Theo Tỷ Lệ Vốn" as UC_TallyVote
    usecase "Mở Hồ Sơ Khiếu Nại Tranh Chấp" as UC_CreateDispute
    usecase "Tải Lên Bằng Chứng Ảnh / Hóa Đơn" as UC_UploadEvidence
    usecase "Điều Tra & Ghi Nhận Kết Luận Hòa Giải" as UC_Investigate
    usecase "Thực Thi Khoản Bồi Hoàn (DEMO Compensation)" as UC_Compensate
}}

Member --> UC_CreateVote
Member --> UC_CastVote
Member --> UC_CreateDispute
Member --> UC_UploadEvidence

Staff --> UC_Investigate
Staff --> UC_Compensate

UC_CreateVote ..> UC_CastVote : <<include>>
UC_CastVote ..> UC_TallyVote : <<include>>
UC_CreateDispute ..> UC_UploadEvidence : <<extend>>
UC_CreateDispute <.. UC_Investigate : <<include>>
UC_Investigate ..> UC_Compensate : <<extend>>

@enduml
""",

    "uc_13_garage_3d_digital_twin.puml": f"""@startuml
title USE CASE: VIRTUAL GARAGE 3D VÀ BẢN SAO SỐ HÓA XE (UC-13)
{SKIN_HEADER}

left to right direction

actor "Người Dùng (Mọi Vai Trò)" as User
actor "Chủ Đồng Sở Hữu" as CoOwner

package "Không Gian Tương Tác 3D (Virtual Garage)" #F8F9FA {{
    usecase "Xoay, Phóng To, Di Chuyển Máy Quay Quanh Xe" as UC_Camera
    usecase "Đặt Lại Góc Nhìn Camera Chuẩn" as UC_ResetCam
    usecase "Xem Nhãn Thông Tin Nổi HUD (Biển Số, Pin)" as UC_HUD
    usecase "Bóc Tách Phụ Tùng Xe (Part Exploration)" as UC_PartExploration
    usecase "Bật Chế Độ X-Ray Nhìn Xuyên Khối Pin" as UC_BatteryXray
    usecase "Xem Các Điểm Cảnh Báo Hư Hỏng 3D (Hotspots)" as UC_ViewDamage3D
    usecase "Chuyển Đổi Nhanh Giữa Các Xe Trong Đội Xe" as UC_SwitchVehicle
}}

User --> UC_Camera
User --> UC_ResetCam
User --> UC_HUD
User --> UC_SwitchVehicle

CoOwner --> UC_PartExploration
CoOwner --> UC_BatteryXray
CoOwner --> UC_ViewDamage3D

UC_Camera ..> UC_ResetCam : <<extend>>

@enduml
"""
}

for name, content in uc_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 2 (Use Case) completed.")
