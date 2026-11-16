# -*- coding: utf-8 -*-
"""
fix_puml_and_add_new.py - Xóa cảnh báo PlantUML deprecation và thêm 5 sơ đồ nghiệp vụ ưu tiên
"""
import os
import re

SOURCE_DIR = r"D:\EV3D\docs\graduation-internship-report\final\diagrams\source"

# 1. Xóa 'skinparam handwritten false' khỏi toàn bộ các file .puml
puml_files = [f for f in os.listdir(SOURCE_DIR) if f.endswith(".puml")]
cleaned_count = 0
for f in puml_files:
    fpath = os.path.join(SOURCE_DIR, f)
    with open(fpath, "r", encoding="utf-8") as fp:
        content = fp.read()
    if "skinparam handwritten false" in content:
        new_content = re.sub(r'skinparam\s+handwritten\s+false\s*\n?', '', content)
        with open(fpath, "w", encoding="utf-8") as fp:
            fp.write(new_content)
        cleaned_count += 1

print(f"Removed deprecated 'skinparam handwritten false' from {cleaned_count} PUML files.")

# 2. Khởi tạo 5 sơ đồ nghiệp vụ ưu tiên mới
new_diagrams = {
    # SEQ-21: Gia hạn chuyến đi và xử lý đàm phán xung đột lịch kế tiếp
    "seq_21_trip_extension_negotiation.puml": """@startuml
title SƠ ĐỒ TUẦN TỰ: GIA HẠN CHUYẾN ĐI VÀ ĐÀM PHÁN XUNG ĐỘT (SEQ-21)
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2
skinparam sequenceMessageAlign center

autonumber
actor "Chủ Xe Đang Lái" as Driver
actor "Chủ Xe Có Lịch Kế" as NextOwner
participant "ActiveTripDetailPanel" as UI
participant "TripController" as Controller
participant "TripService" as TripSvc
participant "BookingRepository" as BookingRepo
participant "NotificationService" as NotiSvc
database "MySQL Database" as DB

Driver -> UI : Nhấn "Yêu Cầu Gia Hạn" (+60 phút)
activate UI
UI -> Controller : POST /api/trips/{tripId}/extend/negotiate {extendMinutes: 60}
activate Controller
Controller -> TripSvc : negotiateExtension(tripId, userId, 60)
activate TripSvc

TripSvc -> BookingRepo : findConflictingBookings(vehicleId, currentEnd, newEnd)
BookingRepo -> DB : SELECT * FROM bookings WHERE vehicle_id = ? AND start_time < :newEnd
DB --> BookingRepo : Danh sách lịch bị ảnh hưởng (NextBooking)

alt Không có lịch xung đột liền kề
    TripSvc -> DB : UPDATE bookings SET end_time = :newEnd WHERE id = :bookingId
    TripSvc --> Controller : ExtensionResult (APPROVED, no conflict)
    Controller --> UI : HTTP 200 OK (Gia hạn thành công ngay)
    UI --> Driver : Cập nhật thời gian kết thúc mới trên HUD
else Có lịch người kế tiếp bị ảnh hưởng
    TripSvc -> DB : INSERT INTO trip_extension_requests (trip_id, requested_minutes, status = 'PENDING_CONSENT')
    TripSvc -> NotiSvc : notifyNextBookingOwner(nextOwnerId, requestDetails)
    NotiSvc -> NextOwner : Gửi thông báo đề nghị lùi lịch / đồng thuận
    TripSvc --> Controller : ExtensionResult (PENDING_CONSENT)
    Controller --> UI : HTTP 202 Accepted (Đã gửi yêu cầu đàm phán)
    UI --> Driver : Hiển thị đồng hồ đếm ngược chờ bên kế tiếp phản hồi
    
    NextOwner -> Controller : POST /api/trips/extension-requests/{id}/accept
    Controller -> TripSvc : acceptExtension(requestId, nextOwnerId)
    TripSvc -> DB : UPDATE trip_extension_requests SET status = 'ACCEPTED'
    TripSvc -> DB : UPDATE bookings SET end_time = :newEnd WHERE id = :bookingId
    TripSvc -> DB : UPDATE bookings SET start_time = :adjustedStart WHERE id = :nextBookingId
    TripSvc -> NotiSvc : notifyDriverExtensionApproved(driverId)
    NotiSvc --> Driver : Thông báo: Lịch gia hạn đã được chấp thuận!
end
deactivate TripSvc
deactivate Controller
deactivate UI
@enduml
""",

    # SEQ-22: Khiếu nại tranh chấp và bồi thường hòa giải
    "seq_22_dispute_resolution_compensation.puml": """@startuml
title SƠ ĐỒ TUẦN TỰ: GIẢI QUYẾT KHIẾU NẠI VÀ BỒI THƯỜNG HÒA GIẢI (SEQ-22)
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2
skinparam sequenceMessageAlign center

autonumber
actor "Chủ Xe Khiếu Nại" as Complainant
actor "Nhân Viên Hòa Giải" as Staff
participant "DisputePanel (React)" as UI
participant "DisputeController" as Controller
participant "DisputeService" as Service
participant "ExpenseShareRepository" as ShareRepo
database "MySQL Database" as DB

Complainant -> UI : Tạo khiếu nại về tiền sạc chuyến đi, đính kèm biên lai
activate UI
UI -> Controller : POST /api/disputes {tripId, category: 'BILLING', description, evidenceUrls}
activate Controller
Controller -> Service : createDispute(userId, request)
activate Service
Service -> DB : INSERT INTO disputes (status = 'OPEN', priority = 'MEDIUM')
Service -> DB : INSERT INTO dispute_evidence (dispute_id, file_url)
Service --> Controller : DisputeResponse
Controller --> UI : HTTP 201 Created
UI --> Complainant : Gửi khiếu nại thành công, chờ phân công nhân viên
deactivate UI

Staff -> Controller : PATCH /api/disputes/{id}/assign-staff
Controller -> Service : assignStaffMediator(disputeId, staffId)
Service -> DB : UPDATE disputes SET mediator_staff_id = staffId, status = 'UNDER_INVESTIGATION'

Staff -> Controller : POST /api/disputes/{id}/record-investigation {findings, proposedCompensation}
Controller -> Service : recordInvestigation(disputeId, findings, amount)
Service -> DB : UPDATE disputes SET status = 'INVESTIGATION_COMPLETED', resolution_proposed = ?

Staff -> Controller : POST /api/disputes/{id}/compensation-payment {amount, payer: 'SYSTEM_ADMIN'}
Controller -> Service : executeCompensation(disputeId, staffId, request)
Service -> DB : INSERT INTO dispute_compensation_payments (amount, status = 'COMPLETED')
Service -> ShareRepo : Điều chỉnh giảm nghĩa vụ ExpenseShare của Complainant
Service -> DB : UPDATE expense_shares SET share_amount = share_amount - compensationAmount
Service -> DB : UPDATE disputes SET status = 'RESOLVED', closed_at = now()
Service --> Controller : CompensationResult
Controller --> Staff : HTTP 200 OK (Đã bồi thường và đóng khiếu nại)
deactivate Service
deactivate Controller
@enduml
""",

    # SEQ-23: Từ chối chứng từ thanh toán và nộp lại
    "seq_23_payment_rejection_resubmission.puml": """@startuml
title SƠ ĐỒ TUẦN TỰ: TỪ CHỐI THANH TOÁN VÀ NỘP LẠI MINH CHỨNG (SEQ-23)
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2
skinparam sequenceMessageAlign center

autonumber
actor "Chủ Xe (CO_OWNER)" as CoOwner
actor "Nhân Viên (STAFF)" as Staff
participant "FinanceZonePanel" as UI
participant "PersonalPaymentController" as Controller
participant "PersonalPaymentService" as Service
database "MySQL Database" as DB

Staff -> Controller : POST /api/personal-payments/{id}/verify {verified: false, rejectionReason: 'Biên lai mờ/sai STK'}
activate Controller
Controller -> Service : verifyPayment(paymentId, staffId, request)
activate Service

Service -> DB : UPDATE personal_expense_payments SET status = 'REJECTED', rejection_reason = ?, verified_by = staffId
Service -> DB : UPDATE expense_shares SET status = 'ALLOCATED' (Giữ nguyên khoản nợ chưa thanh toán)
Service --> Controller : PaymentResponse (REJECTED)
deactivate Service
Controller --> Staff : HTTP 200 OK (Đã từ chối thanh toán)
deactivate Controller

CoOwner -> UI : Xem thông báo từ chối thanh toán kèm lý do
activate UI
CoOwner -> UI : Tải lên ảnh biên lai chuyển khoản rõ nét mới, bấm "Nộp Lại"
UI -> Controller : POST /api/expenses/{id}/personal-payments {amount, referenceCode: 'RE-DEMO-02', proofUrl}
activate Controller
Controller -> Service : submitPayment(expenseId, userId, request)
activate Service
Service -> DB : INSERT INTO personal_expense_payments (status = 'PAYMENT_SUBMITTED', retry_count = 1)
Service --> Controller : PaymentResponse (SUBMITTED)
deactivate Service
Controller --> UI : HTTP 201 Created (Đã gửi lại minh chứng thanh toán)
UI --> CoOwner : Chờ nhân viên đối soát lại
deactivate UI
deactivate Controller
@enduml
""",

    # STATE-11: Vòng đời Thư mời Gia nhập nhóm đồng sở hữu
    "state_11_membership_invitation_lifecycle.puml": """@startuml
title VÒNG ĐỜI TRẠNG THÁI THƯ MỜI GIA NHẬP NHÓM ĐỒNG SỞ HỮU (STATE-11)
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

[*] --> PENDING : Trưởng nhóm gửi thư mời gia nhập

PENDING --> CONTRIBUTOR_CONSENT_PENDING : Người được mời chấp thuận sơ bộ,\\nchờ các cổ đông hiện hữu đồng thuận trích vốn
CONTRIBUTOR_CONSENT_PENDING --> SIGNING_PENDING : Đủ 100% cổ đông hiện hữu đồng thuận trích % vốn
CONTRIBUTOR_CONSENT_PENDING --> REJECTED : Có cổ đông từ chối trích vốn

SIGNING_PENDING --> SIGNED : Người được mời ký điều khoản hợp đồng gia nhập
SIGNING_PENDING --> CANCELLED : Hết hạn 7 ngày không ký

SIGNED --> ACTIVATED : Kích hoạt tư cách thành viên, tái cân bằng danh bạ cổ đông
ACTIVATED --> [*]

PENDING --> DECLINED : Người được mời từ chối
PENDING --> EXPIRED : Quá hạn phản hồi (14 ngày)
DECLINED --> [*]
REJECTED --> [*]
EXPIRED --> [*]
CANCELLED --> [*]
@enduml
""",

    # STATE-12: Vòng đời Bồi thường Khiếu nại
    "state_12_dispute_compensation_lifecycle.puml": """@startuml
title VÒNG ĐỜI TRẠNG THÁI BỒI THƯỜNG KHIẾU NẠI TRANH CHẤP (STATE-12)
skinparam backgroundColor #FFFFFF
skinparam defaultFontName "Segoe UI"
skinparam defaultFontSize 11
skinparam roundCorner 8
skinparam shadowing false
skinparam ArrowColor #2C3E50
skinparam ArrowThickness 1.2

[*] --> INITIATED : Nhân viên xác lập mức bồi thường thỏa thuận

INITIATED --> AWAITING_APPROVAL : Trị giá bồi thường > 1.000.000 đ\\n(Cần Admin duyệt)
INITIATED --> APPROVED : Trị giá bồi thường <= 1.000.000 đ\\n(Staff có quyền duyệt)

AWAITING_APPROVAL --> APPROVED : Admin phê duyệt giải ngân
AWAITING_APPROVAL --> REJECTED : Admin bác bỏ phương án bồi thường

APPROVED --> EXECUTED : Thực thi trừ nợ ExpenseShare hoặc giải ngân DEMO
EXECUTED --> ACKNOWLEDGED : Chủ xe xác nhận đã nhận bồi hoàn
ACKNOWLEDGED --> [*]

REJECTED --> [*]
@enduml
"""
}

for name, puml_code in new_diagrams.items():
    fpath = os.path.join(SOURCE_DIR, name)
    with open(fpath, "w", encoding="utf-8") as fp:
        fp.write(puml_code)
    print(f"Created new diagram: {name}")

print("Completed clean-up and new diagram generation.")
