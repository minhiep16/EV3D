# -*- coding: utf-8 -*-
"""
gen_group5_class.py - Tạo các sơ đồ lớp miền dữ liệu phân rã (CLASS-01 đến CLASS-08)
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
skinparam classAttributeIconSize 0
"""

class_diagrams = {
    "class_01_overall_domain.puml": f"""@startuml
title SƠ ĐỒ LỚP MIỀN DỮ LIỆU TỔNG THỂ (LEVEL 0 DOMAIN MODEL)
{SKIN_HEADER}

class User {{
    - id: UUID
    - email: String
    - fullName: String
    - role: Role
    - status: UserStatus
}}

class Vehicle {{
    - id: UUID
    - vin: String
    - licensePlate: String
    - modelName: String
    - batteryCapacityKwh: BigDecimal
    - currentBatteryLevel: int
    - currentOdometerKm: BigDecimal
    - status: VehicleStatus
}}

class CoOwnershipGroup {{
    - id: UUID
    - groupCode: String
    - groupName: String
    - maxMembers: int
}}

class OwnershipShare {{
    - id: UUID
    - percentage: BigDecimal
    - capitalContribution: BigDecimal
}}

class Booking {{
    - id: UUID
    - startTime: Instant
    - endTime: Instant
    - status: BookingStatus
}}

class Trip {{
    - id: UUID
    - startedAt: Instant
    - endedAt: Instant
    - energyConsumedKwh: BigDecimal
    - status: TripStatus
}}

class VehicleEnergyInventory {{
    - id: UUID
    - availableEnergyKwh: BigDecimal
    - totalInventoryCost: BigDecimal
    - weightedAverageCostPerKwh: BigDecimal
}}

class Expense {{
    - id: UUID
    - amount: BigDecimal
    - category: ExpenseCategory
    - policy: ExpenseAllocationPolicy
}}

CoOwnershipGroup "1" *-- "many" OwnershipShare
OwnershipShare "many" --> "1" User
Vehicle "1" -- "1" CoOwnershipGroup
Vehicle "1" -- "1" VehicleEnergyInventory
Vehicle "1" *-- "many" Booking
Booking "1" -- "0..1" Trip
User "1" -- "many" Booking
Vehicle "1" *-- "many" Expense

@enduml
""",

    "class_02_auth_user.puml": f"""@startuml
title SƠ ĐỒ LỚP: XÁC THỰC VÀ NGƯỜI DÙNG (CLASS-02)
{SKIN_HEADER}

class User {{
    - id: UUID
    - email: String
    - passwordHash: String
    - fullName: String
    - phoneNumber: String
    - role: Role
    - status: UserStatus
    - createdAt: Instant
    - updatedAt: Instant
    + getAuthorities(): Collection<GrantedAuthority>
}}

enum Role <<enumeration>> {{
    ADMIN
    STAFF
    CO_OWNER
}}

enum UserStatus <<enumeration>> {{
    ACTIVE
    LOCKED
    SUSPENDED
}}

class RefreshToken {{
    - id: UUID
    - token: String
    - expiryDate: Instant
    - revoked: boolean
    - user: User
    + isExpired(): boolean
}}

class UserPrincipal {{
    - id: UUID
    - email: String
    - role: Role
    + fromEntity(user: User): UserPrincipal
}}

User --> Role
User --> UserStatus
RefreshToken --> User : belongsTo
UserPrincipal ..> User : adapts

@enduml
""",

    "class_03_vehicle_ownership.puml": f"""@startuml
title SƠ ĐỒ LỚP: PHƯƠNG TIỆN VÀ NHÓM ĐỒNG SỞ HỮU (CLASS-03)
{SKIN_HEADER}

class Vehicle {{
    - id: UUID
    - vin: String
    - licensePlate: String
    - modelName: String
    - exteriorColor: String
    - batteryCapacityKwh: BigDecimal
    - currentBatteryLevel: int
    - currentOdometerKm: BigDecimal
    - status: VehicleStatus
}}

enum VehicleStatus <<enumeration>> {{
    AVAILABLE
    RESERVED
    IN_USE
    CHARGING
    MAINTENANCE
    DECOMMISSIONED
}}

class CoOwnershipGroup {{
    - id: UUID
    - groupCode: String
    - groupName: String
    - maxMembers: int
    - status: GroupStatus
}}

class GroupMember {{
    - id: UUID
    - memberRole: GroupMemberRole
    - joinedAt: Instant
    - removedAt: Instant
}}

enum GroupMemberRole <<enumeration>> {{
    LEADER
    MEMBER
}}

class OwnershipShare {{
    - id: UUID
    - percentage: BigDecimal
    - capitalContribution: BigDecimal
}}

class OwnershipChangeHistory {{
    - id: UUID
    - changeType: String
    - oldPercentage: BigDecimal
    - newPercentage: BigDecimal
    - recordedAt: Instant
}}

Vehicle --> VehicleStatus
Vehicle "1" -- "1" CoOwnershipGroup
CoOwnershipGroup "1" *-- "many" GroupMember
GroupMember --> GroupMemberRole
GroupMember "1" *-- "many" OwnershipShare
OwnershipShare "1" -- "many" OwnershipChangeHistory

@enduml
""",

    "class_04_booking_trip_handover.puml": f"""@startuml
title SƠ ĐỒ LỚP: ĐẶT LỊCH, BÀN GIAO VÀ CHUYẾN ĐI (CLASS-04)
{SKIN_HEADER}

class Booking {{
    - id: UUID
    - startTime: Instant
    - endTime: Instant
    - status: BookingStatus
    - purpose: String
    - createdAt: Instant
}}

enum BookingStatus <<enumeration>> {{
    PENDING
    CONFIRMED
    COMPLETED
    CANCELLED
}}

class VehicleHandover {{
    - id: UUID
    - startOdometer: BigDecimal
    - startBatteryLevel: int
    - staffSignature: String
    - ownerAcknowledgedAt: Instant
    - status: HandoverStatus
}}

class Trip {{
    - id: UUID
    - startedAt: Instant
    - endedAt: Instant
    - startOdometer: BigDecimal
    - endOdometer: BigDecimal
    - startBatteryLevel: int
    - endBatteryLevel: int
    - energyConsumedKwh: BigDecimal
    - returnRequestedAt: Instant
    - status: TripStatus
}}

enum TripStatus <<enumeration>> {{
    NOT_STARTED
    ACTIVE
    RETURN_REQUESTED
    COMPLETED
}}

class TripExtensionRequest {{
    - id: UUID
    - requestedAdditionalMinutes: int
    - status: ExtensionStatus
    - reason: String
}}

Booking --> BookingStatus
Booking "1" -- "1" VehicleHandover
Booking "1" -- "0..1" Trip
Trip --> TripStatus
Trip "1" *-- "many" TripExtensionRequest

@enduml
""",

    "class_05_inspection_damage_maintenance.puml": f"""@startuml
title SƠ ĐỒ LỚP: KIỂM ĐỊNH KỸ THUẬT VÀ HƯ HỎNG 3D (CLASS-05)
{SKIN_HEADER}

class VehicleInspection {{
    - id: UUID
    - inspectionType: InspectionType
    - overallResult: InspectionResult
    - verifiedOdometer: BigDecimal
    - verifiedBatteryLevel: int
    - inspectedAt: Instant
}}

enum InspectionResult <<enumeration>> {{
    PASSED
    FAILED
    CONDITIONALLY_PASSED
}}

class InspectionItem {{
    - id: UUID
    - itemCode: String
    - itemName: String
    - isPassed: boolean
    - notes: String
}}

class DamageRecord {{
    - id: UUID
    - partCode: String
    - severity: DamageSeverity
    - description: String
    - hotspotX: BigDecimal
    - hotspotY: BigDecimal
    - hotspotZ: BigDecimal
    - status: DamageStatus
    - reportedAt: Instant
}}

enum DamageSeverity <<enumeration>> {{
    LOW
    MEDIUM
    HIGH
}}

enum DamageStatus <<enumeration>> {{
    REPORTED
    IN_PROGRESS
    RESOLVED
}}

class MaintenanceRecord {{
    - id: UUID
    - scheduledAt: Instant
    - completedAt: Instant
    - totalCost: BigDecimal
    - status: MaintenanceStatus
}}

VehicleInspection --> InspectionResult
VehicleInspection "1" *-- "many" InspectionItem
VehicleInspection "1" *-- "many" DamageRecord
DamageRecord --> DamageSeverity
DamageRecord --> DamageStatus
MaintenanceRecord "1" *-- "many" DamageRecord

@enduml
""",

    "class_06_charging_energy_inventory.puml": f"""@startuml
title SƠ ĐỒ LỚP: TRẠM SẠC VÀ KHO NĂNG LƯỢNG WAC (CLASS-06)
{SKIN_HEADER}

class ChargingStation {{
    - id: UUID
    - stationCode: String
    - powerKw: BigDecimal
    - pricePerKwh: BigDecimal
    - status: StationStatus
}}

class ChargingSession {{
    - id: UUID
    - startedAt: Instant
    - endedAt: Instant
    - startBatteryLevel: int
    - endBatteryLevel: int
    - energyDeliveredKwh: BigDecimal
    - storedEnergyKwh: BigDecimal
    - energyLossKwh: BigDecimal
    - sessionCost: BigDecimal
    - status: ChargingSessionStatus
}}

class VehicleEnergyInventory {{
    - id: UUID
    - availableEnergyKwh: BigDecimal
    - totalInventoryCost: BigDecimal
    - weightedAverageCostPerKwh: BigDecimal
    - totalEnergyChargedKwh: BigDecimal
    - totalEnergyConsumedKwh: BigDecimal
    - isReconciliationRequired: boolean
    + recalculateWAC(storedEnergy, tariff): void
}}

class VehicleEnergyTransaction {{
    - id: UUID
    - transactionType: EnergyTxType
    - energyAmountKwh: BigDecimal
    - unitPriceVnd: BigDecimal
    - totalAmountVnd: BigDecimal
    - recordedAt: Instant
}}

enum EnergyTxType <<enumeration>> {{
    CHARGING_INFLOW
    TRIP_CONSUMPTION
    RECONCILIATION_ADJUSTMENT
}}

ChargingStation "1" *-- "many" ChargingSession
VehicleEnergyInventory "1" *-- "many" VehicleEnergyTransaction
VehicleEnergyTransaction --> EnergyTxType
ChargingSession ..> VehicleEnergyInventory : updates

@enduml
""",

    "class_07_finance_expense_payment.puml": f"""@startuml
title SƠ ĐỒ LỚP: CHI PHÍ VÀ THANH TOÁN CÁ NHÂN (CLASS-07)
{SKIN_HEADER}

class Expense {{
    - id: UUID
    - amount: BigDecimal
    - category: ExpenseCategory
    - allocationPolicy: ExpenseAllocationPolicy
    - status: ExpenseStatus
    - invoiceNumber: String
    - createdAt: Instant
}}

enum ExpenseAllocationPolicy <<enumeration>> {{
    USER_RESPONSIBILITY
    OWNERSHIP_RATIO
}}

class ExpenseShare {{
    - id: UUID
    - sharePercentage: BigDecimal
    - shareAmount: BigDecimal
    - status: ShareStatus
    - dueDate: Instant
}}

enum ShareStatus <<enumeration>> {{
    ALLOCATED
    PARTIALLY_PAID
    SETTLED
}}

class PersonalExpensePayment {{
    - id: UUID
    - amount: BigDecimal
    - paymentMethod: String
    - referenceCode: String
    - status: PaymentStatus
    - submittedAt: Instant
    - verifiedAt: Instant
}}

enum PaymentStatus <<enumeration>> {{
    PAYMENT_SUBMITTED
    PAYMENT_VERIFIED
    REJECTED
}}

Expense --> ExpenseAllocationPolicy
Expense "1" *-- "many" ExpenseShare
ExpenseShare --> ShareStatus
ExpenseShare "1" *-- "many" PersonalExpensePayment
PersonalExpensePayment --> PaymentStatus

@enduml
""",

    "class_08_governance_contract_voting_dispute.puml": f"""@startuml
title SƠ ĐỒ LỚP: HỢP ĐỒNG, BIỂU QUYẾT VÀ TRANH CHẤP (CLASS-08)
{SKIN_HEADER}

class CoOwnershipContract {{
    - id: UUID
    - contractNumber: String
    - createdAt: Instant
}}

class CoOwnershipContractVersion {{
    - id: UUID
    - versionNumber: int
    - termsContent: String
    - status: ContractVersionStatus
    - effectiveFrom: Instant
}}

class ContractAcceptance {{
    - id: UUID
    - acceptedAt: Instant
    - digitalSignatureHash: String
}}

class VoteProposal {{
    - id: UUID
    - title: String
    - description: String
    - proposalType: String
    - deadline: Instant
    - status: ProposalStatus
}}

class ProposalVote {{
    - id: UUID
    - voteType: VoteType
    - weight: BigDecimal
    - castAt: Instant
}}

class Dispute {{
    - id: UUID
    - title: String
    - description: String
    - status: DisputeStatus
    - resolutionNotes: String
}}

CoOwnershipContract "1" *-- "many" CoOwnershipContractVersion
CoOwnershipContractVersion "1" *-- "many" ContractAcceptance
VoteProposal "1" *-- "many" ProposalVote

@enduml
"""
}

for name, content in class_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 5 (Class) completed.")
