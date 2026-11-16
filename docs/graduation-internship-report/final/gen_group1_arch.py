# -*- coding: utf-8 -*-
"""
gen_group1_arch.py - Tạo các sơ đồ kiến trúc hệ thống (ARCH-01 đến ARCH-06)
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

arch_diagrams = {
    "arch_01_overall_fullstack.puml": f"""@startuml
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
    database "MySQL 8.0 Community Database\\n(46 Bảng thực thể, Flyway V1-V46)" as MySQL #FAD7A0
    folder "Static Public 3D Assets\\n(.glb Models: EV01, EV02, VF3)" as StaticAssets #FCF3CF
}}

ORM --> MySQL : JDBC / HikariCP Pool (ACID Enforced)
ThreeEngine ..> StaticAssets : Tải nhị phân useGLTF.preload()
@enduml
""",

    "arch_02_frontend_components_state.puml": f"""@startuml
title KIẾN TRÚC FRONTEND VÀ QUẢN LÝ TRẠNG THÁI ZUSTAND
{SKIN_HEADER}

package "Entry & Router" #EBF5FB {{
    [App.tsx] as App
    [BrowserRouter] as Router
    App --> Router
}}

package "Zustand Global Stores" #FEF9E7 {{
    [authStore.ts] as AuthStore #FAD7A0
    [worldStore.ts] as WorldStore #FAD7A0
}}

package "Scenes" #E8F8F5 {{
    [AuthScene.tsx] as AuthScene
    [GarageScene.tsx] as GarageScene
    [StatusScene.tsx] as StatusScene
}}

package "3D Spatial Components" #EAECEE {{
    [EVShareWorld.tsx] as World3D
    [VehicleDigitalTwin.tsx] as VehicleTwin
    [BatteryHealthZone.tsx] as BatteryZone
    [DamageHotspotMarker.tsx] as Hotspot
    [ChargingStationZone.tsx] as ChargingZone
}}

package "Operational UI Panels" #FADBD8 {{
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

GarageScene --> BookingPanel : activePrimaryPanel
GarageScene --> FinancePanel
GarageScene --> HandoverModal
GarageScene --> ReturnModal
GarageScene --> AdminPanel

BookingPanel ..> WorldStore : Đọc selectedVehicleId
FinancePanel ..> WorldStore : Đọc selectedVehicleId
AuthScene ..> AuthStore : Cập nhật Token khi đăng nhập
BookingPanel ..> AuthStore : Kiểm tra quyền CO_OWNER
@enduml
""",

    "arch_03_backend_layered.puml": f"""@startuml
title KIẾN TRÚC PHÂN TẦNG BACKEND SPRING BOOT
{SKIN_HEADER}

package "Filter & Security Layer" #EBF5FB {{
    [JwtAuthenticationFilter] as JwtFilter
    [SecurityConfig (CORS, CSRF, RBAC)] as SecConfig
}}

package "Controller Layer (REST Endpoints)" #E8F8F5 {{
    [AuthController] as AuthCtrl
    [VehicleController] as VehCtrl
    [BookingController] as BookCtrl
    [TripController] as TripCtrl
    [ExpenseController] as ExpCtrl
    [ChargingSessionController] as ChargeCtrl
}}

package "Service Layer (Business Logic)" #FEF9E7 {{
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

JwtFilter --> SecConfig
SecConfig --> AuthCtrl
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
@enduml
""",

    "arch_04_security_jwt.puml": f"""@startuml
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
Chain -> JwtFilter : doFilterInternal()

alt Token hợp lệ
    JwtFilter -> Provider : validateToken(jwt)
    Provider --> JwtFilter : Valid
    JwtFilter -> Provider : getUserIdFromJWT(jwt)
    Provider --> JwtFilter : userId
    JwtFilter -> UserDetails : loadUserById(userId)
    UserDetails --> JwtFilter : UserPrincipal (Roles)
    JwtFilter -> Context : setAuthentication()
    JwtFilter -> Chain : filterChain.doFilter()
    Chain -> Controller : @PreAuthorize("hasRole('...')")
    Controller --> Client : HTTP 200 OK + JSON
else Token hết hạn / không hợp lệ
    JwtFilter --> Client : HTTP 401 Unauthorized
else Sai quyền truy cập
    Controller --> Client : HTTP 403 Forbidden
end
@enduml
""",

    "arch_05_garage_3d_spatial.puml": f"""@startuml
title KIẾN TRÚC KHÔNG GIAN 3D VÀ CHU TRÌNH RENDER THREE.JS
{SKIN_HEADER}

package "R3F Canvas (React Three Fiber)" #EBF5FB {{
    [PerspectiveCamera] as Camera
    [OrbitControls] as Controls
    [Lighting (Ambient, Directional)] as Lighting
    [MeshReflectorMaterial (Sàn phản xạ)] as Floor
}}

package "Scene Graph Phân Cấp" #E8F8F5 {{
    [Pedestal Group (Bục xe)] as Pedestal
    [Vehicle Group (Cụm xe)] as VehGroup
    [Body Meshes] as BodyMesh
    [Battery Mesh (Emissive)] as BatteryMesh
    [Damage Hotspot Mesh] as HotspotMesh
    [Html Label (HUD)] as HtmlLabel
}}

package "Raycasting & Tương Tác" #FEF9E7 {{
    [Three.js Raycaster] as Raycaster
    [Pointer Events] as Pointer
    [Camera Tween Animation] as CamTween
}}

Camera --> Pedestal
Lighting --> VehGroup
Controls --> Camera
Pedestal *-- VehGroup
VehGroup *-- BodyMesh
VehGroup *-- BatteryMesh
VehGroup *-- HotspotMesh
VehGroup *-- HtmlLabel

Pointer --> Raycaster : Tọa độ chuột (x, y)
Raycaster --> BodyMesh : Bóc tách phụ tùng
Raycaster --> HotspotMesh : Chi tiết hư hỏng
Raycaster --> Pedestal : Chọn xe -> Di chuyển Camera
@enduml
""",

    "arch_06_finance_energy.puml": f"""@startuml
title KIẾN TRÚC PHÂN MIỀN QUẢN TRỊ TÀI CHÍNH VÀ NĂNG LƯỢNG
{SKIN_HEADER}

package "Energy Domain" #E8F8F5 {{
    [ChargingStation] as Station
    [ChargingSession] as Session
    [VehicleEnergyInventory] as Inventory
    [VehicleEnergyTransaction] as EnergyTx
    
    Station --> Session : Cung cấp điện lưới
    Session --> Inventory : Nạp kho điện (Hiệu suất 90%, Tổn hao 10%)
    Inventory --> EnergyTx : Ghi nhật ký CHARGING_INFLOW
}}

package "Trip Operations" #EBF5FB {{
    [Trip] as Trip
    Trip --> Inventory : Xuất kho kWh điện tiêu thụ
    Inventory --> EnergyTx : Ghi nhật ký TRIP_CONSUMPTION
}}

package "Financial Allocation Domain" #FEF9E7 {{
    [Expense] as Expense
    [ExpenseShare] as Share
    [PersonalExpensePayment] as Payment
    
    Trip --> Expense : Tự động sinh hóa đơn sạc điện (USER_RESPONSIBILITY)
    Expense --> Share : Phân bổ 100% cho người lái
    
    [MaintenanceExpense] as MaintExp
    MaintExp --> Share : Phân bổ theo tỷ lệ sở hữu (OWNERSHIP_RATIO)\nứng dụng thuật toán Hare-Niemeyer
    
    Share --> Payment : Thành viên nộp thanh toán (PAYMENT_SUBMITTED)
    Payment --> Share : Nhân viên phê duyệt xác minh (SETTLED)
}}
@enduml
"""
}

for name, content in arch_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 1 (Architecture) completed.")
