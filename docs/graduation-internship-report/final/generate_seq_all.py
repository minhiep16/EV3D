# -*- coding: utf-8 -*-
"""
generate_seq_all.py - Sinh 20 sơ đồ tuần tự (SEQ-01 đến SEQ-20) cho EVShare 3D
Đảm bảo giải quyết dứt điểm các lỗi thiếu file seq_login_jwt.puml và seq_trip_return_and_inspection.puml
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
skinparam participant {
    BackgroundColor #F8F9FA
    BorderColor #2C3E50
    FontColor #2C3E50
}
skinparam actor {
    BackgroundColor #E8F4F8
    BorderColor #1A5276
}
skinparam database {
    BackgroundColor #FEF9E7
    BorderColor #B7950B
}
"""

def make_puml(title, body):
    return "@startuml\ntitle " + title + "\n" + SKIN_HEADER.strip() + "\n\nautonumber\n" + body.strip() + "\n\n@enduml\n"

seq_diagrams = {}

# SEQ-01
seq_diagrams["seq_01_login_jwt.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: ĐĂNG NHẬP VÀ XÁC THỰC JWT (SEQ-01)",
    """
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

Service --> Controller : AuthResponse (accessToken, refreshToken, user)
deactivate Service
Controller --> UI : HTTP 200 OK + AuthResponse JSON
deactivate Controller

UI -> Store : setTokens(accessToken, refreshToken)
UI -> Store : setUser(userProfile)
UI --> User : Chuyển hướng vào không gian /garage
deactivate UI
"""
)

# SEQ-02
seq_diagrams["seq_02_jwt_protected_api.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: TRUY XUẤT API ĐƯỢC BẢO VỆ BẰNG BEARER TOKEN (SEQ-02)",
    """
actor "Client (Browser)" as Client
participant "JwtAuthenticationFilter" as Filter
participant "JwtTokenProvider" as JwtUtil
participant "UserDetailsService" as UserSvc
participant "SecurityContext" as SecCtx
participant "VehicleController" as Controller
participant "VehicleService" as Service

Client -> Filter : GET /api/vehicles (Header "Authorization: Bearer <token>")
activate Filter

Filter -> Filter : Trích xuất chuỗi JWT từ Authorization header
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
else Token không hợp lệ hoặc hết hạn
    JwtUtil --> Filter : false / ExpiredJwtException
    Filter --> Client : HTTP 401 Unauthorized (Error JSON)
end
deactivate Filter
"""
)

# SEQ-03
seq_diagrams["seq_03_booking_creation_conflict.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: ĐẶT LỊCH XE VÀ XỬ LÝ KHỬ XUNG ĐỘT (SEQ-03)",
    """
actor "Chủ Đồng Sở Hữu" as CoOwner
participant "CoOwnerBookingPanel" as UI
participant "BookingController" as Controller
participant "BookingService" as Service
participant "CoOwnershipService" as OwnershipSvc
participant "BookingRepository" as BookingRepo
database "MySQL Database" as DB

CoOwner -> UI : Chọn xe, chọn startTime & endTime, bấm "Đặt Xe"
activate UI
UI -> Controller : POST /api/bookings/vehicle/{vehicleId}
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
    Service --> Controller : throw IllegalArgumentException("Khung giờ này đã được đặt")
    deactivate Service
    Controller --> UI : HTTP 400 Bad Request {error: "Khung giờ này đã được đặt"}
    deactivate Controller
    UI --> CoOwner : Hiển thị cảnh báo đỏ trên form đặt lịch
end
deactivate UI
"""
)

# SEQ-04
seq_diagrams["seq_04_handover_verification.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: XÁC MINH BÀN GIAO XE KỸ THUẬT (SEQ-04)",
    """
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
"""
)

# SEQ-05
seq_diagrams["seq_05_checkin_odometer_battery.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: KHỞI HÀNH VÀ BẮT ĐẦU CHUYẾN ĐI (SEQ-05)",
    """
actor "Chủ Xe (CO_OWNER)" as CoOwner
participant "TripCheckinUI" as UI
participant "TripController" as Controller
participant "TripService" as Service
participant "VehicleRepository" as VehRepo
database "MySQL Database" as DB

CoOwner -> UI : Nhập ODO hiện tại và % Pin khởi hành, bấm "Bắt Đầu Chuyến Đi"
activate UI
UI -> Controller : POST /api/trips/start {bookingId, startOdometer, startBatteryLevel}
activate Controller

Controller -> Service : startTrip(userId, request)
activate Service

Service -> DB : SELECT * FROM bookings WHERE id = ?
DB --> Service : Booking (CONFIRMED)
Service -> DB : SELECT * FROM vehicles WHERE id = ?
DB --> Service : Vehicle (odometer = 12000, battery = 85)

Service -> Service : Kiểm tra startOdometer >= vehicle.odometer
Service -> Service : Kiểm tra startBatteryLevel >= 20% (Ngưỡng an toàn)

Service -> DB : INSERT INTO trips (booking_id, user_id, start_odometer, start_battery, status = 'IN_PROGRESS', started_at = now())
Service -> VehRepo : UPDATE vehicles SET status = 'IN_USE'
DB --> Service : OK

Service --> Controller : TripResponse (status = IN_PROGRESS)
deactivate Service
Controller --> UI : HTTP 200 OK + TripResponse JSON
deactivate Controller
UI --> CoOwner : Hiển thị màn hình hành trình đang diễn ra
deactivate UI
"""
)

# SEQ-06
seq_diagrams["seq_06_damage_checklist_logging.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: GHI NHẬN KIỂM ĐỊNH TỔN HẠI XE (SEQ-06)",
    """
actor "Nhân Viên (STAFF)" as Staff
participant "InspectionModal" as UI
participant "VehicleInspectionController" as Controller
participant "VehicleInspectionService" as Service
participant "VehicleInspectionDamageRepository" as DamageRepo
database "MySQL Database" as DB

Staff -> UI : Điền checklist kiểm định, chụp ảnh vết xước, bấm "Lưu Kiểm Định"
activate UI
UI -> Controller : POST /api/inspections {vehicleId, inspectionType, checklistItems, damages}
activate Controller

Controller -> Service : createInspection(staffId, request)
activate Service

Service -> DB : INSERT INTO vehicle_inspections (vehicle_id, inspector_id, inspection_type, overall_status)
DB --> Service : inspectionId = 42

loop Mỗi tổn hại trong damages
    Service -> DamageRepo : save(VehicleInspectionDamage)
    DamageRepo -> DB : INSERT INTO vehicle_inspection_damages (inspection_id, part_name, severity, description, photo_url)
end

Service --> Controller : VehicleInspectionResponse
deactivate Service
Controller --> UI : HTTP 201 Created + VehicleInspectionResponse
deactivate UI
"""
)

# SEQ-07
seq_diagrams["seq_07_trip_return_and_inspection.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: TRẢ XE, KIỂM ĐỊNH VÀ ĐỐI SOÁT NĂNG LƯỢNG (SEQ-07)",
    """
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
EnergySvc --> TripSvc : EnergyConsumptionResult (kWhConsumed, totalCost)
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
"""
)

# SEQ-08
seq_diagrams["seq_08_trip_cancellation_refund.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: HỦY ĐẶT LỊCH VÀ GIẢI PHÓNG KHUNG GIỜ (SEQ-08)",
    """
actor "Chủ Xe (CO_OWNER)" as CoOwner
participant "BookingHistoryUI" as UI
participant "BookingController" as Controller
participant "BookingService" as Service
database "MySQL Database" as DB

CoOwner -> UI : Nhấn "Hủy Đặt Lịch" (Trước giờ khởi hành > 2h)
activate UI
UI -> Controller : POST /api/bookings/{id}/cancel {reason}
activate Controller

Controller -> Service : cancelBooking(bookingId, userId, reason)
activate Service

Service -> DB : SELECT * FROM bookings WHERE id = ?
DB --> Service : Booking (status = CONFIRMED)

Service -> Service : Kiểm tra điều kiện hủy (Chưa bắt đầu chuyến đi)
Service -> DB : UPDATE bookings SET status = 'CANCELLED', cancellation_reason = ?
DB --> Service : OK

Service -> DB : UPDATE vehicles SET status = 'AVAILABLE' WHERE id = ?
DB --> Service : OK

Service --> Controller : BookingResponse (status = CANCELLED)
deactivate Service
Controller --> UI : HTTP 200 OK + Message "Hủy lịch thành công"
deactivate Controller
UI --> CoOwner : Cập nhật giao diện lịch trình rảnh
deactivate UI
"""
)

# SEQ-09
seq_diagrams["seq_09_charging_session_start.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: KHỞI TẠO PHIÊN SẠC XE ĐIỆN (SEQ-09)",
    """
actor "Nhân Viên (STAFF)" as Staff
participant "ChargingStationUI" as UI
participant "ChargingSessionController" as Controller
participant "ChargingSessionService" as Service
participant "VehicleRepository" as VehRepo
database "MySQL Database" as DB

Staff -> UI : Cắm súng sạc, nhập thông số trụ sạc, bấm "Bắt Đầu Sạc"
activate UI
UI -> Controller : POST /api/charging/sessions {vehicleId, stationId, startSoc, tariffPerKwh}
activate Controller

Controller -> Service : startChargingSession(staffId, request)
activate Service

Service -> VehRepo : findById(vehicleId)
VehRepo --> Service : Vehicle (status = AVAILABLE)

Service -> DB : INSERT INTO charging_sessions (vehicle_id, station_id, start_soc, tariff, status = 'IN_PROGRESS', started_at = now())
Service -> VehRepo : UPDATE vehicles SET status = 'CHARGING'
DB --> Service : OK

Service --> Controller : ChargingSessionResponse (status = IN_PROGRESS)
deactivate Service
Controller --> UI : HTTP 201 Created
deactivate Controller
UI --> Staff : Hiển thị đồng hồ theo dõi tiến trình sạc
deactivate UI
"""
)

# SEQ-10
seq_diagrams["seq_10_energy_inventory_wac.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: HOÀN TẤT SẠC VÀ TÍNH GIÁ BÌNH QUÂN WAC (SEQ-10)",
    """
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
"""
)

# SEQ-11
seq_diagrams["seq_11_monthly_expense_allocation.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: PHÂN BỔ CHI PHÍ ĐỊNH KỲ THEO TỶ LỆ CỔ PHẦN (SEQ-11)",
    """
actor "Quản Trị Viên (ADMIN)" as Admin
participant "ExpenseAllocationController" as Controller
participant "ExpenseAllocationService" as AllocSvc
participant "CoOwnershipService" as OwnerSvc
participant "ExpenseShareRepository" as ShareRepo
database "MySQL Database" as DB

Admin -> Controller : POST /api/expenses/{id}/allocate
activate Controller
Controller -> AllocSvc : allocateExpense(expenseId)
activate AllocSvc

AllocSvc -> DB : SELECT * FROM expenses WHERE id = ?
DB --> AllocSvc : Expense (category = INSURANCE, amount = 10,000,000, policy = EQUITY_RATIO)

AllocSvc -> OwnerSvc : getActiveOwnershipShares(expense.vehicleId)
activate OwnerSvc
OwnerSvc --> AllocSvc : List<OwnershipShare> [UserA: 40%, UserB: 35%, UserC: 25%]
deactivate OwnerSvc

loop Mỗi thành viên sở hữu
    AllocSvc -> AllocSvc : userShare = totalAmount * (sharePercentage / 100.0)
    AllocSvc -> ShareRepo : save(ExpenseShare(userId, userShare, status = 'PENDING'))
    ShareRepo -> DB : INSERT INTO expense_shares ...
end

AllocSvc -> DB : UPDATE expenses SET status = 'ALLOCATED', allocated_at = now()
DB --> AllocSvc : OK

AllocSvc --> Controller : ExpenseAllocationResult
deactivate AllocSvc
Controller --> Admin : HTTP 200 OK (Phân bổ hoàn tất cho 3 chủ xe)
deactivate Controller
"""
)

# SEQ-12
seq_diagrams["seq_12_equity_ratio_calculation.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: TRUY VẤN VÀ KIỂM ĐỊNH TỔNG CỔ PHẦN ĐỒNG SỞ HỮU (SEQ-12)",
    """
actor "Client" as Client
participant "CoOwnershipController" as Controller
participant "CoOwnershipService" as Service
participant "CoOwnershipRepository" as Repo
database "MySQL Database" as DB

Client -> Controller : GET /api/co-ownership/vehicle/{vehicleId}/shares
activate Controller
Controller -> Service : getVehicleShares(vehicleId)
activate Service

Service -> Repo : findByVehicleIdAndStatus(vehicleId, ACTIVE)
activate Repo
Repo -> DB : SELECT * FROM ownership_shares WHERE vehicle_id = ? AND status = 'ACTIVE'
DB --> Repo : List<OwnershipShare>
Repo --> Service : List<OwnershipShare>
deactivate Repo

Service -> Service : totalRatio = shares.stream().mapToDouble(getPercentage).sum()
alt Math.abs(totalRatio - 100.0000) < 0.0001
    Service --> Controller : OwnershipSummaryResponse (isValid = true, shares)
else Bất biến bị vi phạm (totalRatio != 100.0)
    Service -> Service : Ghi log cảnh báo nghiêm trọng (CRITICAL_INVARIANT_VIOLATION)
    Service --> Controller : OwnershipSummaryResponse (isValid = false, shares)
end
deactivate Service

Controller --> Client : HTTP 200 OK + JSON
deactivate Controller
"""
)

# SEQ-13
seq_diagrams["seq_13_demo_payment_verification.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: NỘP VÀ XÁC MINH THANH TOÁN DEMO (SEQ-13)",
    """
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
"""
)

# SEQ-14
seq_diagrams["seq_14_ownership_transfer.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: CHUYỂN NHƯỢNG CỔ PHẦN ĐỒNG SỞ HỮU (SEQ-14)",
    """
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
"""
)

# SEQ-15
seq_diagrams["seq_15_contract_electronic_signing.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: KÝ ĐIỆN TỬ HỢP ĐỒNG ĐỒNG SỞ HỮU (SEQ-15)",
    """
actor "Chủ Xe (CO_OWNER)" as CoOwner
participant "ContractUI" as UI
participant "ContractController" as Controller
participant "ContractService" as Service
participant "ContractSignatureRepository" as SigRepo
database "MySQL Database" as DB

CoOwner -> UI : Xem điều khoản hợp đồng, nhập mã OTP / chữ ký số, bấm "Ký Hợp Đồng"
activate UI
UI -> Controller : POST /api/contracts/{id}/sign {signatureData, otpCode}
activate Controller

Controller -> Service : signContract(contractId, userId, request)
activate Service

Service -> Service : verifySignatureOtp(userId, otpCode)
Service -> SigRepo : save(ContractSignature(contractId, userId, signatureHash, signedAt = now()))
activate SigRepo
SigRepo -> DB : INSERT INTO contract_signatures ...
deactivate SigRepo

Service -> DB : SELECT COUNT(*) FROM contract_signatures WHERE contract_id = ?
DB --> Service : signedCount
Service -> DB : SELECT COUNT(*) FROM contract_parties WHERE contract_id = ?
DB --> Service : totalParties

alt signedCount == totalParties
    Service -> DB : UPDATE contracts SET status = 'FULLY_EXECUTED', executed_at = now()
    Service --> Controller : ContractResponse (status = FULLY_EXECUTED)
else signedCount < totalParties
    Service -> DB : UPDATE contracts SET status = 'PARTIALLY_SIGNED'
    Service --> Controller : ContractResponse (status = PARTIALLY_SIGNED)
end
deactivate Service

Controller --> UI : HTTP 200 OK + ContractResponse
deactivate Controller
UI --> CoOwner : Thông báo đã hoàn tất ký nhận
deactivate UI
"""
)

# SEQ-16
seq_diagrams["seq_16_smart_contract_simulation.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: MÔ PHỎNG THỰC THI SMART CONTRACT (SEQ-16)",
    """
actor "Hệ Thống (Trigger)" as System
participant "SmartContractExecutionScheduler" as Scheduler
participant "SmartContractSimulatorService" as Service
participant "LedgerBlockRepository" as LedgerRepo
database "MySQL Database" as DB

System -> Scheduler : triggerPeriodicExecution()
activate Scheduler
Scheduler -> Service : executePendingRules()
activate Service

Service -> DB : SELECT * FROM smart_contracts WHERE status = 'ACTIVE'
DB --> Service : List<SmartContract>

loop Mỗi hợp đồng thông minh
    Service -> Service : evaluateCondition(contract.ruleExpression, vehicleData)
    alt Điều kiện thỏa mãn (e.g. Quá hạn thanh toán 7 ngày)
        Service -> Service : executeAction(DISALLOW_BOOKING, vehicleId)
        Service -> Service : generateBlockHash(previousHash, payload, timestamp)
        Service -> LedgerRepo : save(LedgerBlock(blockHash, previousHash, payload))
        LedgerRepo -> DB : INSERT INTO ledger_blocks ...
    end
end

Service --> Scheduler : SimulationResult (executedRulesCount)
deactivate Service
deactivate Scheduler
"""
)

# SEQ-17
seq_diagrams["seq_17_voting_proposal_cast.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: TẠO ĐỀ XUẤT VÀ BỎ PHIẾU BIỂU QUYẾT (SEQ-17)",
    """
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
"""
)

# SEQ-18
seq_diagrams["seq_18_maintenance_scheduling.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: CẢNH BÁO BẢO DƯỠNG VÀ LÊN LỊCH WORK ORDER (SEQ-18)",
    """
actor "Nhân Viên (STAFF)" as Staff
participant "MaintenanceUI" as UI
participant "MaintenanceController" as Controller
participant "MaintenanceService" as Service
participant "VehicleRepository" as VehRepo
database "MySQL Database" as DB

Staff -> UI : Xem cảnh báo mốc 15,000 km, bấm "Tạo Lịch Bảo Dưỡng"
activate UI
UI -> Controller : POST /api/maintenance/records {vehicleId, scheduledDate, description}
activate Controller

Controller -> Service : scheduleMaintenance(staffId, request)
activate Service

Service -> DB : INSERT INTO vehicle_maintenance_records (vehicle_id, status = 'SCHEDULED', scheduled_date = ?)
Service -> VehRepo : UPDATE vehicles SET status = 'MAINTENANCE' WHERE id = ?
DB --> Service : OK

Service --> Controller : MaintenanceRecordResponse
deactivate Service
Controller --> UI : HTTP 201 Created
deactivate UI
"""
)

# SEQ-19
seq_diagrams["seq_19_threejs_loading_caching.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: TẢI TIẾN TRÌNH VÀ BỘ ĐỆM MÔ HÌNH 3D THREE.JS (SEQ-19)",
    """
actor "Người Dùng" as User
participant "Garage3DView (React)" as UI
participant "useGLTF (R3F/Drei)" as Loader
participant "IndexedDB / BrowserCache" as Cache
participant "Static CDN / Backend" as CDN

User -> UI : Truy cập màn hình /garage/3d
activate UI
UI -> Loader : useGLTF('/models/vf8_optimized.glb')
activate Loader

Loader -> Cache : Kiểm tra model cache theo URL & Hash
alt Cache Hit (Đã tải trước đó)
    Cache --> Loader : ArrayBuffer (Model 3D)
else Cache Miss (Tải mới)
    Loader -> CDN : GET /models/vf8_optimized.glb
    CDN --> Loader : 200 OK (Binary stream với OnProgress callback)
    Loader -> Cache : Lưu ArrayBuffer vào IndexedDB
end

Loader -> Loader : GLTFLoader.parse() -> Scene Hierarchy
Loader -> Loader : KTX2Loader giải nén kết cấu GPU Texture (Basis)
Loader --> UI : scene, materials, nodes
deactivate Loader

UI -> UI : Gắn xe vào Three.js Canvas, bật bóng đổ (Shadows)
UI --> User : Hiển thị không gian Garage 3D sống động
deactivate UI
"""
)

# SEQ-20
seq_diagrams["seq_20_hotspot_inspection_interaction.puml"] = make_puml(
    "SƠ ĐỒ TUẦN TỰ: TƯƠNG TÁC TỔN HẠI 3D VỚI RAYCASTING (SEQ-20)",
    """
actor "Người Dùng / Giám Định Viên" as User
participant "GarageCanvas" as Canvas
participant "Three.js Raycaster" as Raycaster
participant "DamageHotspot (React Component)" as Hotspot
participant "InspectionDetailModal" as Modal

User -> Canvas : Di chuột và click vào điểm trên bề mặt xe 3D
activate Canvas
Canvas -> Raycaster : setFromCamera(pointerCoords, camera)
Raycaster -> Canvas : intersectObjects(scene.children, true)
Canvas --> Raycaster : intersects[0] (Point, Mesh: "Bumper_Front")

alt Trúng tọa độ gắn Hotspot đã lưu
    Canvas -> Hotspot : onSelectHotspot(hotspotId)
    activate Hotspot
    Hotspot -> Modal : openDamageDetail(damageInfo)
    deactivate Hotspot
    activate Modal
    Modal --> User : Hiển thị bảng chi tiết vết xước, ảnh thực tế và mức độ nghiêm trọng
    deactivate Modal
else Click vào vị trí mới trong chế độ Tạo Kiểm Định
    Canvas -> Modal : openCreateDamageHotspot(point.x, point.y, point.z, meshName)
    activate Modal
    Modal --> User : Mở form đính kèm thông tin tổn hại tại tọa độ 3D
    deactivate Modal
end
deactivate Canvas
"""
)

# Compatibility Aliases for defects identified in Section 4.7.1 and 4.7.3:
seq_diagrams["seq_login_jwt.puml"] = seq_diagrams["seq_01_login_jwt.puml"]
seq_diagrams["seq_trip_return_and_inspection.puml"] = seq_diagrams["seq_07_trip_return_and_inspection.puml"]

for name, content in seq_diagrams.items():
    file_path = os.path.join(BASE_DIR, name)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print(f"Successfully generated all {len(seq_diagrams)} Sequence diagrams in {BASE_DIR}")
