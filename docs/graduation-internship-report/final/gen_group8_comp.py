# -*- coding: utf-8 -*-
"""
gen_group8_comp.py - Tạo các sơ đồ thành phần và triển khai (COMP-01 đến COMP-03, DEPLOY-01)
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

comp_diagrams = {
    "comp_01_frontend_component_hierarchy.puml": f"""@startuml
title KIẾN TRÚC PHÂN CẤP THÀNH PHẦN FRONTEND REACT 18
{SKIN_HEADER}

package "Root & Layout" #EBF5FB {{
    [App.tsx] as App
    [GarageScene.tsx] as GarageScene
    App *-- GarageScene
}}

package "Three.js 3D WebGL Canvas" #E8F8F5 {{
    [EVShareWorld.tsx] as World3D
    [VehicleDigitalTwin.tsx] as VehicleTwin
    [Pedestal.tsx] as Pedestal
    [DamageHotspotMarker.tsx] as Hotspot
    [BatteryHealthZone.tsx] as BatteryZone
    
    World3D *-- Pedestal
    World3D *-- VehicleTwin
    VehicleTwin *-- Hotspot
    VehicleTwin *-- BatteryZone
}}

package "Spatial UI Floating Panels" #FEF9E7 {{
    [CoOwnerBookingPanel.tsx] as BookingPanel
    [FinanceZonePanel.tsx] as FinancePanel
    [StaffHandoverModal.tsx] as HandoverModal
    [StaffReturnInspectionModal.tsx] as ReturnModal
    [AdminCommandCenterPanels.tsx] as AdminPanel
}}

package "Common UI / HUD" #FADBD8 {{
    [VehicleStatusLabel.tsx] as HUDLabel
    [NotificationBell.tsx] as NotiBell
    [GarageErrorBoundary.tsx] as ErrorBoundary
}}

GarageScene *-- World3D
GarageScene *-- BookingPanel
GarageScene *-- FinancePanel
GarageScene *-- HandoverModal
GarageScene *-- ReturnModal
GarageScene *-- AdminPanel
GarageScene *-- NotiBell
World3D *-- HUDLabel
GarageScene *-- ErrorBoundary

@enduml
""",

    "comp_02_backend_package_dependencies.puml": f"""@startuml
title KIẾN TRÚC GÓI MÃ NGUỒN VÀ PHỤ THUỘC BACKEND SPRING BOOT
{SKIN_HEADER}

package "com.evshare" #F8F9FA {{
    package "config & security" #EBF5FB {{
        [SecurityConfig]
        [JwtTokenProvider]
        [JwtAuthenticationFilter]
    }}
    
    package "user & auth" #D4E6F1 {{
        [AuthService]
        [UserService]
        [UserRepository]
    }}
    
    package "vehicle & ownership" #E8F8F5 {{
        [VehicleService]
        [CoOwnershipService]
        [OwnershipShareRepository]
    }}
    
    package "booking & trip" #D1F2EB {{
        [BookingService]
        [TripService]
        [VehicleHandoverService]
    }}
    
    package "energy & charging" #FEF9E7 {{
        [ChargingSessionService]
        [VehicleEnergyInventoryService]
    }}
    
    package "expense & fund" #FCF3CF {{
        [ExpenseShareService]
        [PersonalPaymentService]
    }}
    
    package "governance" #FADBD8 {{
        [CoOwnershipContractService]
        [VoteProposalService]
        [DisputeService]
    }}
}}

[user & auth] ..> [config & security] : uses
[booking & trip] ..> [vehicle & ownership] : verifies membership
[booking & trip] ..> [user & auth] : links driver
[booking & trip] ..> [energy & charging] : deducts energy
[booking & trip] ..> [expense & fund] : creates charging expense
[energy & charging] ..> [vehicle & ownership] : updates vehicle battery
[expense & fund] ..> [vehicle & ownership] : checks shares
[governance] ..> [vehicle & ownership] : contract & voting

@enduml
""",

    "comp_03_garage_3d_spatial_ui.puml": f"""@startuml
title KIẾN TRÚC GIAO DIỆN KHÔNG GIAN SPATIAL HUD VIRTUAL GARAGE
{SKIN_HEADER}

package "Viewport Canvas 3D" #EBF5FB {{
    [OrbitControls Machine] as Controls
    [Vehicle 3D Mesh] as Mesh
    [Spatial Raycast Collider] as Collider
    [Billboard Label Overlay] as Billboard
}}

package "Screen-Space HUD (2D Panels)" #FEF9E7 {{
    [Glassmorphism Drawer (Right)] as Drawer
    [Operational Carousel (Bottom)] as Carousel
    [Notification Banner (Top)] as TopHUD
    [Reset Camera Floating Button] as ResetBtn
}}

Controls --> Mesh : Xoay quanh tâm xe
Mesh *-- Collider : Đón bắt tọa độ click
Collider --> Drawer : Mở panel chi tiết tương ứng
Carousel --> Mesh : Chuyển đổi bục xe (Pedestal switch)
ResetBtn --> Controls : Đưa camera về góc nhìn chuẩn [0, 2.5, 6]
Billboard --|> Mesh : Bay lơ lửng trên nóc xe

@enduml
""",

    "deploy_01_system_deployment.puml": f"""@startuml
title SƠ ĐỒ TRIỂN KHAI PHẦN CỨNG VÀ MÁY CHỦ (DEPLOYMENT DIAGRAM)
{SKIN_HEADER}

node "Client Desktop / Laptop" as ClientNode #EBF5FB {{
    artifact "Web Browser (Chrome / Edge / Firefox)" as Browser {{
        component "React 18 SPA (JS/HTML/CSS)" as AppClient
        component "WebGL 2.0 / GPU Renderer" as GPU
        component "Local Assets Cache (.glb 3D Models)" as ModelCache
    }}
}}

cloud "HTTPS Network (Port 443)" as Net

node "Application Server (Linux / Windows Host)" as AppServer #E8F8F5 {{
    node "JVM Runtime (OpenJDK 21 LTS)" as JVM {{
        artifact "evshare-backend.jar" as BackendApp {{
            component "Embedded Tomcat Server (Port 8080)" as Tomcat
            component "Spring Boot 3.3.4 Application" as SpringBoot
            component "HikariCP JDBC Connection Pool" as Hikari
        }}
    }}
}}

node "Database Server" as DbServer #FEF9E7 {{
    database "MySQL Community Server 8.0 (Port 3306)" as MySQL {{
        storage "Database: evshare3d" as DBStore
    }}
}}

Browser --> Net : HTTPS REST / JSON
Net --> Tomcat : Reverse Proxy / Direct HTTPS
Tomcat --> SpringBoot
SpringBoot --> Hikari
Hikari --> MySQL : TCP/IP (Port 3306)
MySQL --> DBStore : Read/Write InnoDB Tables

@enduml
"""
}

for name, content in comp_diagrams.items():
    with open(os.path.join(BASE_DIR, name), "w", encoding="utf-8") as f:
        f.write(content)
    print(f"Generated {name}")

print("Group 8 (Component & Deployment) completed.")
