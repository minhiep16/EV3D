# -*- coding: utf-8 -*-
"""
gen_group7_state.py - Tạo các sơ đồ máy trạng thái hữu hạn (STATE-01 đến STATE-10)
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
"""

state_diagrams = {
    "state_01_vehicle_lifecycle.puml": f"""@startuml
title MÁY TRẠNG THÁI: VÒNG ĐỜI VẬN HÀNH PHƯƠNG TIỆN (STATE-01)
{SKIN_HEADER}

[*] --> AVAILABLE : Khởi tạo xe mới trong hệ thống

AVAILABLE --> RESERVED : Nhân viên xác nhận bàn giao (verifyHandover)
AVAILABLE --> CHARGING : Cắm sạc tại trụ thông minh (startCharging)
AVAILABLE --> MAINTENANCE : Đưa xe vào diện bảo dưỡng định kỳ

RESERVED --> IN_USE : Co-Owner bấm "Bắt Đầu Chuyến Đi"
RESERVED --> AVAILABLE : Hủy lịch đặt hoặc quá hạn bàn giao

IN_USE --> AVAILABLE : Nhân viên đối soát và chốt hoàn tất trả xe

CHARGING --> AVAILABLE : Dừng và hoàn tất phiên sạc

MAINTENANCE --> AVAILABLE : Kỹ thuật viên nghiệm thu sửa chữa hoàn tất

AVAILABLE --> DECOMMISSIONED : Thanh lý hoặc ngừng khai thác
DECOMMISSIONED --> [*]

@enduml
""",

    "state_02_booking_lifecycle.puml": f"""@startuml
title MÁY TRẠNG THÁI: VÒNG ĐỜI LỊCH ĐẶT XE (STATE-02)
{SKIN_HEADER}

[*] --> PENDING : Co-Owner gửi yêu cầu đặt xe

PENDING --> CONFIRMED : Khử xung đột thành công & hệ thống xác nhận
PENDING --> CANCELLED : Xung đột thời gian hoặc lỗi xác thực

CONFIRMED --> COMPLETED : Chuyến đi thực tế đã hoàn tất đối soát trả xe
CONFIRMED --> CANCELLED : Co-Owner / Admin hủy trước giờ khởi hành

COMPLETED --> [*]
CANCELLED --> [*]

@enduml
""",

    "state_03_trip_lifecycle.puml": f"""@startuml
title MÁY TRẠNG THÁI: VÒNG ĐỜI CHUYẾN ĐI DI CHUYỂN (STATE-03)
{SKIN_HEADER}

[*] --> NOT_STARTED : Tạo bản ghi cùng lúc với Booking

NOT_STARTED --> ACTIVE : Co-Owner bấm "Bắt Đầu Đi" [Đã ký nhận Handover]

ACTIVE --> ACTIVE : Gia hạn thành công (Trip Extension)
ACTIVE --> RETURN_REQUESTED : Co-Owner đỗ xe tại trạm và bấm "Yêu Cầu Trả"

RETURN_REQUESTED --> COMPLETED : Staff đối soát ODO/Pin, duyệt Checklist kỹ thuật

COMPLETED --> [*]

@enduml
""",

    "state_04_handover_inspection.puml": f"""@startuml
title MÁY TRẠNG THÁI: BÀN GIAO VÀ KIỂM ĐỊNH KỸ THUẬT (STATE-04)
{SKIN_HEADER}

[*] --> PENDING_VERIFICATION : Khởi tạo trước giờ khởi hành

PENDING_VERIFICATION --> STAFF_VERIFIED : Nhân viên ghi nhận ODO/Pin xuất phát
STAFF_VERIFIED --> COMPLETED : Co-Owner ký xác nhận hiện trạng xe
PENDING_VERIFICATION --> CANCELLED : Lịch đặt xe bị hủy

COMPLETED --> [*]
CANCELLED --> [*]

@enduml
""",

    "state_05_charging_session.puml": f"""@startuml
title MÁY TRẠNG THÁI: PHIÊN SẠC PIN PHƯƠNG TIỆN (STATE-05)
{SKIN_HEADER}

[*] --> INITIALIZING : Cắm súng sạc vào xe

INITIALIZING --> CHARGING : Kích hoạt dòng điện nạp thành công
CHARGING --> COMPLETED : Người dùng bấm dừng hoặc pin đạt 100%
CHARGING --> ABORTED : Mất kết nối trụ sạc hoặc sự cố điện lưới

COMPLETED --> [*]
ABORTED --> [*]

@enduml
""",

    "state_06_expense_payment.puml": f"""@startuml
title MÁY TRẠNG THÁI: KHOẢN CHI VÀ NGHĨA VỤ THANH TOÁN (STATE-06)
{SKIN_HEADER}

[*] --> PENDING_APPROVAL : Tạo khoản chi phí thô

PENDING_APPROVAL --> ALLOCATED : Phê duyệt chi phí & Phân chia nghĩa vụ (Hare-Niemeyer)
PENDING_APPROVAL --> REJECTED : Từ chối hóa đơn sai lệch

ALLOCATED --> PAYMENT_SUBMITTED : Thành viên nộp mã chuyển khoản DEMO
PAYMENT_SUBMITTED --> PAYMENT_VERIFIED : Nhân viên đối soát biến động số dư
PAYMENT_SUBMITTED --> REJECTED : Chứng từ giả mạo / Không nhận được tiền

REJECTED --> ALLOCATED : Cho phép nộp lại mã thanh toán đúng
PAYMENT_VERIFIED --> SETTLED : Tất toán dứt điểm nghĩa vụ tài chính

SETTLED --> [*]

@enduml
""",

    "state_07_contract_version.puml": f"""@startuml
title MÁY TRẠNG THÁI: PHIÊN BẢN HỢP ĐỒNG ĐỒNG SỞ HỮU (STATE-07)
{SKIN_HEADER}

[*] --> DRAFT : Tự động sinh khi có biến động cổ đông/vốn

DRAFT --> PENDING_SIGNATURES : Ban hành dự thảo đến toàn bộ thành viên
PENDING_SIGNATURES --> ACTIVE : Nhận đủ 100% chữ ký số chấp thuận
PENDING_SIGNATURES --> CANCELLED : Đàm phán đổ vỡ hoặc hủy mời

ACTIVE --> SUPERSEDED : Khi có phiên bản hợp đồng mới thay thế
SUPERSEDED --> [*]
CANCELLED --> [*]

@enduml
""",

    "state_08_voting_proposal.puml": f"""@startuml
title MÁY TRẠNG THÁI: ĐỀ XUẤT BIỂU QUYẾT TẬP THỂ (STATE-08)
{SKIN_HEADER}

[*] --> DRAFT : Thành viên soạn thảo đề xuất

DRAFT --> OPEN : Phát động biểu quyết đến nhóm xe
OPEN --> APPROVED : Hết hạn & Tỷ lệ ủng hộ > 50.00%
OPEN --> REJECTED : Hết hạn & Tỷ lệ ủng hộ <= 50.00%
OPEN --> CANCELLED : Người tạo chủ động rút đề xuất

APPROVED --> [*]
REJECTED --> [*]
CANCELLED --> [*]

@enduml
""",

    "state_09_dispute_lifecycle.puml": f"""@startuml
title MÁY TRẠNG THÁI: KHIẾU NẠI VÀ HÒA GIẢI TRANH CHẤP (STATE-09)
{SKIN_HEADER}

[*] --> LODGED : Thành viên nộp hồ sơ khiếu nại

LODGED --> UNDER_INVESTIGATION : Nhân viên tiếp nhận và đối soát nhật ký
UNDER_INVESTIGATION --> RESOLVED : Đạt được thỏa thuận / Bồi thường DEMO
UNDER_INVESTIGATION --> DISMISSED : Bác bỏ do thiếu căn cứ xác đáng

RESOLVED --> [*]
DISMISSED --> [*]

@enduml
""",

    "state_10_ownership_transfer.puml": f"""@startuml
title MÁY TRẠNG THÁI: CHUYỂN NHƯỢNG CỔ PHẦN PHƯƠNG TIỆN (STATE-10)
{SKIN_HEADER}

[*] --> REQUESTED : Bên chuyển gửi đề nghị

REQUESTED --> PENDING_APPROVAL : Bên nhận chấp thuận nhận vốn góp
PENDING_APPROVAL --> COMPLETED : Trưởng nhóm phê duyệt & Cập nhật CSDL
REQUESTED --> CANCELLED : Bên nhận từ chối hoặc Bên chuyển hủy
PENDING_APPROVAL --> CANCELLED : Trưởng nhóm bác bỏ giao dịch

COMPLETED --> [*]
CANCELLED --> [*]

@enduml
"""
}

for name, content in state_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 7 (State Machine) completed.")
