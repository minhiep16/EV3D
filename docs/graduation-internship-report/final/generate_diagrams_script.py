# -*- coding: utf-8 -*-
"""
generate_all_uml_diagrams.py
Tạo lập toàn bộ 80+ mã nguồn PlantUML phân rã đa tầng (Hierarchical Decomposition)
cho hệ thống EVShare 3D và kết xuất (render) thành ảnh PNG chuẩn học thuật.
"""

import os
import sys
import time
import plantuml

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
SOURCE_DIR = os.path.join(BASE_DIR, "diagrams", "source")
RENDERED_DIR = os.path.join(BASE_DIR, "diagrams", "rendered")

os.makedirs(SOURCE_DIR, exist_ok=True)
os.makedirs(RENDERED_DIR, exist_ok=True)

# Khởi tạo client PlantUML
p = plantuml.PlantUML(url='http://www.plantuml.com/plantuml/png/')

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

diagrams = {}

# ==============================================================================
# GROUP 1: ARCHITECTURE DIAGRAMS (ARCH-01 to ARCH-06)
# ==============================================================================

diagrams["arch_01_overall_fullstack.puml"] = f"""@startuml
title KIẾN TRÚC TỔNG THỂ FULL-STACK HỆ THỐNG EVSHARE 3D
{SKIN_HEADER}

package "Client Tier (Trình duyệt Web Khách)" as ClientTier #EBF5FB {{
    [Single Page Application (React 18 + TS)] as ReactApp #D4E6F1
    [Three.js Engine r173 / WebGL 2.0] as ThreeEngine #AED6F1
    [React Three Fiber & Drei Canvas] as R3F #AED6F1
    [Zustand State Store (authStore, worldStore)] as Zustand #D4E6F1
    [TanStack Query & Axios HTTP Client] as ApiClient #D4E6F1
    
    ReactApp --> R3F : Khởi tạo Canvas & Spatial UI
    R3F --> ThreeEngine : Render Scene Graph qua WebGL
    ReactApp --> Zustand : Quản lý trạng thái toàn cục
    ReactApp --> ApiClient : Điều phối truy vấn API
}}

cloud "Mạng Truyền Thông HTTPS (SSL/TLS)" as Network #F4F6F7 {{
    interface "RESTful API JSON / Bearer Token" as RestEndpoint
}}

ApiClient --> RestEndpoint : HTTPS POST/GET/PUT

package "Server Tier (Máy chủ Spring Boot 3.3.4 LTS)" as ServerTier #E8F8F5 {{
    [JwtAuthenticationFilter] as JwtFilter #D1F2EB
    [REST Controllers (27 Controllers)] as Controllers #A3E4D7
    [Service Layer (25+ Services)] as Services #76D7C4
    [Spring Data JPA / Hibernate ORM 6.5] as ORM #48C9B0
    [GlobalExceptionHandler & Auditing] as CommonMod #D1F2EB
    
    RestEndpoint --> JwtFilter : Lọc xác thực Bearer Token
    JwtFilter --> Controllers : Chuyển tiếp Request đã xác thực
    Controllers --> Services : Thực thi Logic Nghiệp Vụ
    Services --> ORM : Thao tác ánh xạ quan hệ
    Services ..> CommonMod : Bắt ngoại lệ tập trung
}}

package "Data & Storage Tier" as DataTier #FEF9E7 {{
    database "MySQL 8.0 Community Database\n(46 Bảng thực thể, Flyway V1-V46)" as MySQL #FAD7A0
    folder "Static Public 3D Assets\n(.glb Models: EV01, EV02, VF3)" as StaticAssets #FCF3CF
}}

ORM --> MySQL : JDBC / HikariCP Pool (ACID Enforced)
ThreeEngine ..> StaticAssets : Tải nhị phân useGLTF.preload()

@enduml
"""

diagrams["arch_02_frontend_components_state.puml"] = f"""@startuml
title KIẾN TRÚC FRONTEND VÀ QUẢN LÝ TRẠNG THÁI ZUSTAND
{SKIN_HEADER}

package "Entry & Router" #EBF5FB {{
    [App.tsx] as App
    [BrowserRouter] as Router
    App --> Router
}}

package "Zustand Global Stores" #FEF9E7 {{
    [authStore.ts] as AuthStore #FAD7A0
    note right of AuthStore
      - user: UserProfile
      - accessToken: string
      - refreshToken: string
      - role: ADMIN | STAFF | CO_OWNER
    end note
    
    [worldStore.ts] as WorldStore #FAD7A0
    note right of WorldStore
      - selectedVehicleId: UUID
      - vehicleMode: NORMAL | EXPLORE
      - vehicleBatteryXrayMode: boolean
      - activePrimaryPanel: PanelType
    end note
}}

package "Scenes" #E8F8F5 {{
    [AuthScene.tsx] as AuthScene
    [GarageScene.tsx] as GarageScene
    [StatusScene.tsx] as StatusScene
    [OnboardingScene.tsx] as OnboardingScene
}}

package "3D Spatial Components" #EAECEE {{
    [EVShareWorld.tsx] as World3D
    [VehicleDigitalTwin.tsx] as VehicleTwin
    [BatteryHealthZone.tsx] as BatteryZone
    [DamageHotspotMarker.tsx] as Hotspot
    [ChargingStationZone.tsx] as ChargingZone
}}

package "Operational UI Panels (Glassmorphism)" #FADBD8 {{
    [CoOwnerBookingPanel.tsx] as BookingPanel
    [FinanceZonePanel.tsx] as FinancePanel
    [StaffHandoverModal.tsx] as HandoverModal
    [StaffReturnInspectionModal.tsx] as ReturnModal
    [AdminCommandCenterPanels.tsx] as AdminPanel
}}

Router --> AuthScene : /login
Router --> GarageScene : /garage
GarageScene --> World3D
World3D --> VehicleTwin
VehicleTwin --> BatteryZone
VehicleTwin --> Hotspot
World3D --> ChargingZone

GarageScene --> BookingPanel : Toggle theo activePrimaryPanel
GarageScene --> FinancePanel
GarageScene --> HandoverModal
GarageScene --> ReturnModal
GarageScene --> AdminPanel

BookingPanel ..> WorldStore : Đọc selectedVehicleId
FinancePanel ..> WorldStore : Đọc selectedVehicleId
AuthScene ..> AuthStore : Cập nhật Token khi đăng nhập
BookingPanel ..> AuthStore : Kiểm tra quyền CO_OWNER

@enduml
"""

diagrams["arch_03_backend_layered.puml"] = f"""@startuml
title KIẾN TRÚC PHÂN TẦNG BACKEND SPRING BOOT
{SKIN_HEADER}

package "Filter & Security Layer" #EBF5FB {{
    [JwtAuthenticationFilter] as JwtFilter
    [SecurityConfig (CORS, CSRF, RBAC)] as SecConfig
    [UserPrincipal] as Principal
}}

package "Controller Layer (REST Endpoints)" #E8F8F5 {{
    [AuthController] as AuthCtrl
    [VehicleController] as VehCtrl
    [BookingController] as BookCtrl
    [TripController] as TripCtrl
    [ExpenseController] as ExpCtrl
    [ChargingSessionController] as ChargeCtrl
}}

package "Service Layer (Business Logic & Transactions)" #FEF9E7 {{
    [AuthService] as AuthSvc
    [BookingService] as BookSvc
    [TripService] as TripSvc
    [VehicleEnergyInventoryService] as EnergySvc
    [ExpenseShareService] as ExpSvc
    [ChargingSessionService] as ChargeSvc
}}

package "Repository Layer (Spring Data JPA)" #EAECEE {{
    [BookingRepository] as BookRepo
    [TripRepository] as TripRepo
    [VehicleRepository] as VehRepo
    [EnergyInventoryRepository] as EnergyRepo
    [ExpenseRepository] as ExpRepo
}}

package "Domain Entity Layer" #D4E6F1 {{
    [Booking Entity] as BookEnt
    [Trip Entity] as TripEnt
    [Vehicle Entity] as VehEnt
    [VehicleEnergyInventory Entity] as EnergyEnt
    [Expense Entity] as ExpEnt
}}

JwtFilter --> SecConfig
SecConfig --> Principal
Principal --> AuthCtrl

AuthCtrl --> AuthSvc
BookCtrl --> BookSvc
TripCtrl --> TripSvc
ExpCtrl --> ExpSvc
ChargeCtrl --> ChargeSvc

BookSvc --> BookRepo : findConflictingBookings()
TripSvc --> TripRepo : save() & verify
TripSvc --> EnergySvc : recordTripConsumption()
EnergySvc --> EnergyRepo
ExpSvc --> ExpRepo : generateSharesForExpense()

BookRepo ..> BookEnt : Thao tác CRUD
TripRepo ..> TripEnt : Thao tác CRUD
VehRepo ..> VehEnt : Thao tác CRUD
EnergyRepo ..> EnergyEnt : Thao tác CRUD
ExpRepo ..> ExpEnt : Thao tác CRUD

@enduml
"""

diagrams["arch_04_security_jwt.puml"] = f"""@startuml
title KIẾN TRÚC BẢO MẬT VÀ CHUỖI LỌC JWT (RBAC)
{SKIN_HEADER}

actor "Client (Browser)" as Client
participant "SecurityFilterChain" as Chain
participant "JwtAuthenticationFilter" as JwtFilter
participant "JwtTokenProvider" as Provider
participant "CustomUserDetailsService" as UserDetails
participant "SecurityContextHolder" as Context
participant "REST Controller" as Controller

Client -> Chain : HTTP Request + Header "Authorization: Bearer <JWT>"
Chain -> JwtFilter : doFilterInternal(request, response, chain)

alt Header chứa Bearer Token hợp lệ
    JwtFilter -> Provider : validateToken(jwt)
    Provider --> JwtFilter : Token hợp lệ (Signature & Expiry OK)
    
    JwtFilter -> Provider : getUserIdFromJWT(jwt)
    Provider --> JwtFilter : userId
    
    JwtFilter -> UserDetails : loadUserById(userId)
    UserDetails --> JwtFilter : UserPrincipal (Roles: ADMIN/STAFF/CO_OWNER)
    
    JwtFilter -> Context : setAuthentication(UsernamePasswordAuthenticationToken)
    JwtFilter -> Chain : filterChain.doFilter()
    Chain -> Controller : @PreAuthorize("hasRole('...')") -> Chấp thuận thực thi
    Controller --> Client : HTTP 200 OK + Payload JSON
else Token hết hạn hoặc không hợp lệ
    JwtFilter -> Provider : validateToken(jwt) -> Ngoại lệ (Expired / Malformed)
    JwtFilter --> Client : HTTP 401 Unauthorized (Error JSON)
else Thiếu quyền truy cập vai trò
    Controller --> Client : HTTP 403 Forbidden (Access Denied)
end

@enduml
"""

diagrams["arch_05_garage_3d_spatial.puml"] = f"""@startuml
title KIẾN TRÚC KHÔNG GIAN 3D VÀ CHU TRÌNH RENDER THREE.JS
{SKIN_HEADER}

package "R3F Canvas (React Three Fiber)" #EBF5FB {{
    [PerspectiveCamera (fov=45)] as Camera #D4E6F1
    [OrbitControls (Damping=0.05)] as Controls #D4E6F1
    [DirectionalLight & AmbientLight] as Lighting #FCF3CF
    [MeshReflectorMaterial (Sàn phản xạ mờ)] as Floor #D5D8DC
}}

package "Scene Graph Phân Cấp (Hierarchical Objects)" #E8F8F5 {{
    [Pedestal Group (Bục xoay tròn)] as Pedestal #A3E4D7
    [Vehicle Group (Cụm xe điện)] as VehGroup #76D7C4
    [Chassis & Body Meshes] as BodyMesh #D1F2EB
    [Battery Pack Mesh (Emissive Material)] as BatteryMesh #FCF3CF
    [Damage Hotspot Mesh (Red Emissive)] as HotspotMesh #FADBD8
    [Html Overlay Billboard (Nhãn thông tin xe)] as HtmlLabel #FEF9E7
}}

package "Raycasting & Interaction Pipeline" #FEF9E7 {{
    [Three.js Raycaster] as Raycaster #FAD7A0
    [Pointer Events (Click / Hover)] as Pointer #FAD7A0
    [Camera Tween Animation] as CamTween #FAD7A0
}}

Camera --> Pedestal : Hướng nhìn máy quay
Lighting --> VehGroup : Chiếu sáng PBR vật lý
Controls --> Camera : Điều khiển xoay/zoom

Pedestal *-- VehGroup
VehGroup *-- BodyMesh
VehGroup *-- BatteryMesh
VehGroup *-- HotspotMesh
VehGroup *-- HtmlLabel

Pointer --> Raycaster : Tọa độ màn hình (x, y)
Raycaster --> BodyMesh : Bóc tách phụ tùng (Part Explore)
Raycaster --> HotspotMesh : Mở DamageDetailModal
Raycaster --> Pedestal : Chọn xe -> Kích hoạt CamTween

@enduml
"""

diagrams["arch_06_finance_energy.puml"] = f"""@startuml
title KIẾN TRÚC PHÂN MIỀN QUẢN TRỊ TÀI CHÍNH VÀ NĂNG LƯỢNG
{SKIN_HEADER}

package "Energy Domain (Quản Trị Kho Năng Lượng)" #E8F8F5 {{
    [ChargingStation] as Station #A3E4D7
    [ChargingSession] as Session #A3E4D7
    [VehicleEnergyInventory] as Inventory #76D7C4
    [VehicleEnergyTransaction] as EnergyTx #76D7C4
    
    Station --> Session : Cung cấp kWh điện lưới
    Session --> Inventory : Nạp kho điện (Hiệu suất 90%, Tổn hao 10%)
    Inventory --> EnergyTx : Ghi nhật ký giao dịch CHARGING_INFLOW
}}

package "Trip Operations (Vận Hành Di Chuyển)" #EBF5FB {{
    [Trip] as Trip #AED6F1
    Trip --> Inventory : Xuất kho kWh điện tiêu thụ chuyến đi
    Inventory --> EnergyTx : Ghi nhật ký TRIP_CONSUMPTION
}}

package "Financial Allocation Domain (Phân Bổ Chi Phí)" #FEF9E7 {{
    [Expense] as Expense #FAD7A0
    [ExpenseShare] as Share #FAD7A0
    [PersonalExpensePayment] as Payment #FCF3CF
    
    Trip --> Expense : Tự động sinh khoản chi sạc điện (USER_RESPONSIBILITY)
    Expense --> Share : Phân bổ 100% cho người lái chuyến đi
    
    [MaintenanceExpense] as MaintExp #FAD7A0
    MaintExp --> Share : Phân bổ theo tỷ lệ sở hữu (OWNERSHIP_RATIO)\nứng dụng thuật toán Hare-Niemeyer
    
    Share --> Payment : Thành viên nộp thanh toán (PAYMENT_SUBMITTED)
    Payment --> Share : Nhân viên phê duyệt xác minh (SETTLED)
}}

@enduml
"""

# Lưu và render nhóm Architecture
for filename, content in diagrams.items():
    filepath = os.path.join(SOURCE_DIR, filename)
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Written: {filename}")

print(f"Total Group 1 architecture diagrams written: {len(diagrams)}")
