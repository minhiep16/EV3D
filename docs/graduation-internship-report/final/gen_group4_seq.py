# -*- coding: utf-8 -*-
"""
gen_group4_seq.py - Tạo các sơ đồ tuần tự phân rã (SEQ-01 đến SEQ-20)
Bao gồm sửa chữa dứt điểm lỗi thiếu seq_login_jwt.puml và seq_trip_return_and_inspection.puml
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
skinparam sequenceMessageAlign center
"""

seq_diagrams = {
    # DEFECT FIX 1: seq_login_jwt.puml
    "seq_01_login_jwt.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: ĐĂNG NHẬP VÀ XÁC THỰC JWT (SEQ-01)
{SKIN_HEADER}

autonumber
actor "Người Dùng" as User
participant "AuthScene (React)" as UI
participant "authStore (Zustand)" as Store
participant "AuthController" as Controller
participant "AuthService" as Service
participant "AuthenticationManager" as AuthMgr
participant "JwtTokenProvider" as JwtUtil
participant "RefreshTokenRepository" as TokenRepo
database "MySQL Database" as DB

User -> UI : Nhập email và password, bấm "Đăng Nhập"
activate UI
UI -> Controller : POST /api/auth/login {email, password}
activate Controller
Controller -> Service : login(LoginRequest)
activate Service

Service -> AuthMgr : authenticate(UsernamePasswordAuthenticationToken)
activate AuthMgr
AuthMgr -> DB : Tìm user và kiểm tra BCrypt password
DB --> AuthMgr : UserPrincipal hợp lệ
AuthMgr --> Service : Authentication object
deactivate AuthMgr

Service -> JwtUtil : generateAccessToken(userPrincipal)
activate JwtUtil
JwtUtil --> Service : accessToken (JWT có hạn 24h)
deactivate JwtUtil

Service -> Service : createRefreshToken(userId)
Service -> TokenRepo : save(RefreshToken)
activate TokenRepo
TokenRepo -> DB : INSERT INTO refresh_tokens
DB --> TokenRepo : OK
TokenRepo --> Service : RefreshToken entity
deactivate TokenRepo

Service --> Controller : AuthResponse {accessToken, refreshToken, user}
deactivate Service
Controller --> UI : HTTP 200 OK + AuthResponse JSON
deactivate Controller

UI -> Store : setTokens(accessToken, refreshToken)
UI -> Store : setUser(userProfile)
UI --> User : Chuyển hướng vào không gian /garage
deactivate UI

@enduml
""",

    "seq_02_jwt_protected_api.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: TRUY XUẤT API ĐƯỢC BẢO VỆ BẰNG BEARER TOKEN (SEQ-02)
{SKIN_HEADER}

autonumber
actor "Client (Browser)" as Client
participant "JwtAuthenticationFilter" as Filter
participant "JwtTokenProvider" as JwtUtil
participant "UserDetailsService" as UserSvc
participant "SecurityContext" as SecCtx
participant "VehicleController" as Controller
participant "VehicleService" as Service

Client -> Filter : GET /api/vehicles (Header "Authorization: Bearer <token>")
activate Filter

Filter -> Filter : Trích xuất chuỗi JWT từ header
Filter -> JwtUtil : validateToken(jwt)
activate JwtUtil

alt Token hợp lệ và chưa hết hạn
    JwtUtil --> Filter : true
    Filter -> JwtUtil : getUserIdFromJWT(jwt)
    JwtUtil --> Filter : userId
    deactivate JwtUtil
    
    Filter -> UserSvc : loadUserById(userId)
    activate UserSvc
    UserSvc --> Filter : UserDetails (Role = CO_OWNER)
    deactivate UserSvc
    
    Filter -> SecCtx : setAuthentication(auth)
    Filter -> Controller : getVehicles()
    activate Controller
    Controller -> Service : getAllVehicles()
    activate Service
    Service --> Controller : List<VehicleResponse>
    deactivate Service
    Controller --> Client : HTTP 200 OK + Danh sách xe JSON
    deactivate Controller
else Token không hợp lệ / Hết hạn
    JwtUtil --> Filter : false / ExpiredJwtException
    Filter --> Client : HTTP 401 Unauthorized
end
deactivate Filter

@enduml
""",

    "seq_03_booking_creation_conflict.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: ĐẶT LỊCH XE VÀ XỬ LÝ KHỬ XUNG ĐỘT (SEQ-03)
{SKIN_HEADER}

autonumber
actor "Chủ Đồng Sở Hữu" as CoOwner
participant "CoOwnerBookingPanel" as UI
participant "BookingController" as Controller
participant "BookingService" as Service
participant "CoOwnershipService" as OwnershipSvc
participant "BookingRepository" as BookingRepo
database "MySQL Database" as DB

CoOwner -> UI : Chọn xe, chọn startTime & endTime, bấm "Đặt Xe"
activate UI
UI -> Controller : POST /api/bookings/vehicle/{vehicleId} {startTime, endTime, purpose}
activate Controller

Controller -> Service : createBooking(vehicleId, userId, request)
activate Service

Service -> Service : Kiểm tra startTime < endTime VÀ startTime >= now - 120s
Service -> OwnershipSvc : isUserActiveMemberForVehicle(userId, vehicleId)
activate OwnershipSvc
OwnershipSvc --> Service : true (Thành viên hợp lệ)
deactivate OwnershipSvc

Service -> BookingRepo : findConflictingBookings(vehicleId, startTime, endTime, statuses)
activate BookingRepo
BookingRepo -> DB : SELECT * FROM bookings WHERE vehicle_id = ?\\nAND status IN ('CONFIRMED', 'PENDING')\\nAND (start_time < :endTime AND end_time > :startTime)
DB --> BookingRepo : Danh sách lịch xung đột
BookingRepo --> Service : List<Booking> conflicts
deactivate BookingRepo

alt Không có lịch xung đột (conflicts is empty)
    Service -> BookingRepo : save(new Booking(CONFIRMED))
    activate BookingRepo
    BookingRepo -> DB : INSERT INTO bookings ...
    DB --> BookingRepo : Booking persisted
    BookingRepo --> Service : Booking entity
    deactivate BookingRepo
    
    Service --> Controller : BookingResponse
    Controller --> UI : HTTP 201 Created + BookingResponse JSON
    UI --> CoOwner : Hiển thị thông báo đặt xe thành công
else Phát hiện xung đột thời gian (conflicts NOT empty)
    Service --> Controller : throw IllegalArgumentException\\n("Khung giờ này đã được đặt")
    deactivate Service
    Controller --> UI : HTTP 400 Bad Request {error: "Khung giờ này đã được đặt"}
    deactivate Controller
    UI --> CoOwner : Hiển thị cảnh báo đỏ trên form đặt lịch
end
deactivate UI

@enduml
""",

    "seq_04_handover_verification.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: XÁC MINH BÀN GIAO XE KỸ THUẬT (SEQ-04)
{SKIN_HEADER}

autonumber
actor "Nhân Viên (STAFF)" as Staff
actor "Chủ Xe (CO_OWNER)" as CoOwner
participant "StaffHandoverModal" as Modal
participant "VehicleHandoverController" as Controller
participant "VehicleHandoverService" as Service
participant "VehicleRepository" as VehRepo
database "MySQL Database" as DB

Staff -> Modal : Nhập ODO xuất phát & % Pin xuất phát, bấm "Xác Nhận"
activate Modal
Modal -> Controller : POST /api/handovers/booking/{bookingId}/verify
activate Controller

Controller -> Service : verifyHandover(bookingId, staffId, request)
activate Service

Service -> VehRepo : Cập nhật trạng thái xe = RESERVED
Service -> DB : INSERT INTO vehicle_handovers (status = COMPLETED)
DB --> Service : OK
Service --> Controller : VehicleHandoverResponse
deactivate Service
Controller --> Modal : HTTP 200 OK
deactivate Controller
Modal --> Staff : Bàn giao hoàn tất, chờ Co-Owner ký nhận
deactivate Modal

CoOwner -> Controller : POST /api/handovers/{id}/acknowledge
activate Controller
Controller -> Service : acknowledgeCondition(handoverId, userId)
activate Service
Service -> DB : UPDATE vehicle_handovers SET owner_condition_acknowledged_at = now()
DB --> Service : OK
Service --> Controller : VehicleHandoverResponse
deactivate Service
Controller --> CoOwner : HTTP 200 OK (Ký nhận thành công)
deactivate Controller

@enduml
""",

    # DEFECT FIX 2: seq_trip_return_and_inspection.puml
    "seq_07_trip_return_and_inspection.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: TRẢ XE, KIỂM ĐỊNH VÀ ĐỐI SOÁT NĂNG LƯỢNG (SEQ-07)
{SKIN_HEADER}

autonumber
actor "Chủ Xe (CO_OWNER)" as CoOwner
actor "Nhân Viên (STAFF)" as Staff
participant "TripController" as Controller
participant "TripService" as TripSvc
participant "VehicleInspectionService" as InspSvc
participant "VehicleEnergyInventoryService" as EnergySvc
participant "ExpenseService" as ExpSvc
database "MySQL Database" as DB

CoOwner -> Controller : POST /api/trips/{id}/request-return {endOdometer, endBatteryLevel}
activate Controller
Controller -> TripSvc : requestTripReturn(tripId, userId, request)
activate TripSvc
TripSvc -> DB : UPDATE trips SET status = 'RETURN_REQUESTED', return_requested_at = now()
DB --> TripSvc : OK
TripSvc --> Controller : TripResponse
deactivate TripSvc
Controller --> CoOwner : HTTP 200 OK (Yêu cầu trả xe đã gửi)
deactivate Controller

Staff -> Controller : POST /api/trips/{id}/confirm-return {verifiedOdo, verifiedBattery, checklist}
activate Controller
Controller -> TripSvc : confirmTripReturn(tripId, staffId, request)
activate TripSvc

TripSvc -> InspSvc : createInspection(vehicleId, staffId, checklist)
activate InspSvc
InspSvc -> DB : INSERT INTO vehicle_inspections ...
DB --> InspSvc : VehicleInspection entity
InspSvc --> TripSvc : Inspection result
deactivate InspSvc

TripSvc -> DB : UPDATE trips SET status = 'COMPLETED', ended_at = now()
TripSvc -> DB : UPDATE vehicles SET status = 'AVAILABLE', odometer = ?, battery_level = ?

TripSvc -> EnergySvc : recordTripConsumption(vehicle, startSoc, endSoc, tripId)
activate EnergySvc
EnergySvc -> DB : Trừ số kWh điện tiêu thụ trong vehicle_energy_inventories
EnergySvc -> DB : INSERT INTO vehicle_energy_transactions (TRIP_CONSUMPTION)
EnergySvc --> TripSvc : EnergyConsumptionResult {kWhConsumed, totalCost}
deactivate EnergySvc

TripSvc -> ExpSvc : createTripChargingExpense(vehicle, driverUser, totalCost)
activate ExpSvc
ExpSvc -> DB : INSERT INTO expenses (category = 'CHARGING', policy = 'USER_RESPONSIBILITY')
ExpSvc -> DB : INSERT INTO expense_shares (share_amount = totalCost, status = 'ALLOCATED')
ExpSvc --> TripSvc : Expense created
deactivate ExpSvc

TripSvc --> Controller : TripResponse (Hoàn tất)
deactivate TripSvc
Controller --> Staff : HTTP 200 OK (Đã chốt hoàn tất trả xe)
deactivate Controller

@enduml
""",

    "seq_10_energy_inventory_wac.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: HOÀN TẤT SẠC VÀ TÍNH GIÁ BÌNH QUÂN WAC (SEQ-10)
{SKIN_HEADER}

autonumber
actor "Người Dùng / Staff" as User
participant "ChargingSessionController" as Controller
participant "ChargingSessionService" as ChargeSvc
participant "VehicleEnergyInventoryService" as EnergySvc
database "MySQL Database" as DB

User -> Controller : POST /api/charging/sessions/{id}/complete
activate Controller
Controller -> ChargeSvc : completeSession(sessionId)
activate ChargeSvc

ChargeSvc -> DB : UPDATE charging_sessions SET status = 'COMPLETED', ended_at = now()
ChargeSvc -> DB : UPDATE vehicles SET status = 'AVAILABLE'

ChargeSvc -> EnergySvc : recordChargingSessionCompletion(session)
activate EnergySvc

EnergySvc -> DB : Kiểm tra Idempotency: tồn tại giao dịch CHARGING_INFLOW cho session này chưa?
alt Chưa tồn tại giao dịch
    EnergySvc -> EnergySvc : deliveredEnergy = session.getEnergyDeliveredKwh()
    EnergySvc -> EnergySvc : storedEnergy = deliveredEnergy * 0.90 (Tổn hao 10%)
    EnergySvc -> EnergySvc : addedValue = storedEnergy * tariff
    
    EnergySvc -> DB : SELECT * FROM vehicle_energy_inventories WHERE vehicle_id = ?
    DB --> EnergySvc : prevEnergy, prevValue
    
    EnergySvc -> EnergySvc : newEnergy = prevEnergy + storedEnergy
    EnergySvc -> EnergySvc : newValue = prevValue + addedValue
    EnergySvc -> EnergySvc : newAvgCost = (newEnergy > 0) ? (newValue / newEnergy) : tariff
    
    EnergySvc -> DB : UPDATE vehicle_energy_inventories SET available_energy = newEnergy, total_cost = newValue, weighted_avg_cost = newAvgCost
    EnergySvc -> DB : INSERT INTO vehicle_energy_transactions (CHARGING_INFLOW, storedEnergy, tariff)
    EnergySvc --> ChargeSvc : Updated Inventory
else Đã tồn tại giao dịch (Duplicate request)
    EnergySvc --> ChargeSvc : Bỏ qua, trả về inventory hiện tại
end
deactivate EnergySvc

ChargeSvc --> Controller : ChargingSessionResponse
deactivate ChargeSvc
Controller --> User : HTTP 200 OK (Nạp kho năng lượng thành công)
deactivate Controller

@enduml
""",

    "seq_13_demo_payment_verification.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: NỘP VÀ XÁC MINH THANH TOÁN DEMO (SEQ-13)
{SKIN_HEADER}

autonumber
actor "Chủ Xe (CO_OWNER)" as CoOwner
actor "Nhân Viên (STAFF)" as Staff
participant "PersonalPaymentController" as Controller
participant "PersonalPaymentService" as PaymentSvc
participant "ExpenseShareRepository" as ShareRepo
database "MySQL Database" as DB

CoOwner -> Controller : POST /api/expenses/{id}/personal-payments {amount, referenceCode}
activate Controller
Controller -> PaymentSvc : submitPayment(expenseId, userId, request)
activate PaymentSvc

PaymentSvc -> DB : INSERT INTO personal_expense_payments (status = 'PAYMENT_SUBMITTED')
PaymentSvc --> Controller : PersonalExpensePaymentResponse
deactivate PaymentSvc
Controller --> CoOwner : HTTP 201 Created (Đã gửi chứng từ thanh toán)
deactivate Controller

Staff -> Controller : POST /api/personal-payments/{id}/verify {verified: true}
activate Controller
Controller -> PaymentSvc : verifyPayment(paymentId, staffId, request)
activate PaymentSvc

PaymentSvc -> DB : UPDATE personal_expense_payments SET status = 'PAYMENT_VERIFIED', verified_by = staffId
PaymentSvc -> ShareRepo : findById(expenseShareId)
activate ShareRepo
ShareRepo -> DB : SELECT * FROM expense_shares WHERE id = ?
DB --> ShareRepo : ExpenseShare entity
ShareRepo --> PaymentSvc : ExpenseShare
deactivate ShareRepo

PaymentSvc -> DB : UPDATE expense_shares SET status = 'SETTLED'
PaymentSvc --> Controller : PersonalExpensePaymentResponse (VERIFIED)
deactivate PaymentSvc
Controller --> Staff : HTTP 200 OK (Khoản nợ đã được tất toán)
deactivate Controller

@enduml
""",

    "seq_14_ownership_transfer.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: CHUYỂN NHƯỢNG CỔ PHẦN ĐỒNG SỞ HỮU (SEQ-14)
{SKIN_HEADER}

autonumber
actor "Bên Chuyển" as Seller
actor "Bên Nhận" as Buyer
actor "Trưởng Nhóm" as Leader
participant "CoOwnershipController" as Controller
participant "CoOwnershipService" as Service
database "MySQL Database" as DB

Seller -> Controller : POST /api/co-ownership/transfers {toUserId, percentage}
activate Controller
Controller -> Service : requestTransfer(fromUserId, toUserId, percentage)
activate Service
Service -> DB : INSERT INTO ownership_transfer_requests (status = 'PENDING_CONSENT')
Service --> Controller : TransferResponse
deactivate Service
Controller --> Seller : HTTP 201 Created
deactivate Controller

Buyer -> Controller : POST /api/co-ownership/transfers/{id}/consent {accept: true}
activate Controller
Controller -> Service : consentTransfer(transferId, buyerId)
activate Service
Service -> DB : UPDATE ownership_transfer_requests SET buyer_consented = true
Service --> Controller : OK
deactivate Service
Controller --> Buyer : HTTP 200 OK
deactivate Controller

Leader -> Controller : POST /api/co-ownership/transfers/{id}/approve
activate Controller
Controller -> Service : executeTransfer(transferId, leaderId)
activate Service
note over Service : Giao dịch nguyên tử @Transactional
Service -> DB : Trừ % của Bên Chuyển trong ownership_shares
Service -> DB : Cộng % cho Bên Nhận trong ownership_shares
Service -> DB : Kiểm tra Invariant: SUM(percentage) == 100.0000%
Service -> DB : INSERT INTO ownership_change_histories ...
Service -> DB : UPDATE ownership_transfer_requests SET status = 'COMPLETED'
Service --> Controller : TransferResponse (COMPLETED)
deactivate Service
Controller --> Leader : HTTP 200 OK
deactivate Controller

@enduml
""",

    "seq_17_voting_proposal_cast.puml": f"""@startuml
title SƠ ĐỒ TUẦN TỰ: TẠO ĐỀ XUẤT VÀ BỎ PHIẾU BIỂU QUYẾT (SEQ-17)
{SKIN_HEADER}

autonumber
actor "Người Tạo (Member)" as Proposer
actor "Thành Viên Nhóm" as Voter
participant "VoteProposalController" as Controller
participant "VoteProposalService" as Service
database "MySQL Database" as DB

Proposer -> Controller : POST /api/voting/proposals {title, description, deadline}
activate Controller
Controller -> Service : createProposal(userId, request)
activate Service
Service -> DB : INSERT INTO vote_proposals (status = 'OPEN')
Service --> Controller : VoteProposalResponse
deactivate Service
Controller --> Proposer : HTTP 201 Created
deactivate Controller

Voter -> Controller : POST /api/voting/proposals/{id}/vote {voteType: 'FOR'}
activate Controller
Controller -> Service : castVote(proposalId, voterId, request)
activate Service
Service -> DB : Kiểm tra voterId đã bỏ phiếu cho proposalId chưa?
Service -> DB : Lấy % cổ phần của voterId làm trọng số voteWeight
Service -> DB : INSERT INTO proposal_votes (vote_type = 'FOR', weight = voteWeight)
Service --> Controller : VoteCastResponse
deactivate Service
Controller --> Voter : HTTP 200 OK (Bỏ phiếu thành công)
deactivate Controller

@enduml
"""
}

# Cũng tạo các file sequence phụ với alias tên cũ để tương thích 100%
seq_diagrams["seq_login_jwt.puml"] = seq_diagrams["seq_01_login_jwt.puml"]
seq_diagrams["seq_trip_return_and_inspection.puml"] = seq_diagrams["seq_07_trip_return_and_inspection.puml"]

for name, content in seq_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 4 (Sequence) completed.")
