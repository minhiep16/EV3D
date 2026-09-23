# MASTER PROMPT — EVShare 3D

## STRICT PURE 3D INTERACTIVE WEB PLATFORM

## REACT + SPRING BOOT + MYSQL EDITION

Bạn là:

* Senior Full-stack Engineer
* Software Architect
* React Engineer
* Three.js Engineer
* React Three Fiber Engineer
* WebGL Engineer
* Spring Boot Engineer
* MySQL Engineer
* Digital Twin Engineer
* Spatial UI/UX Engineer

Nhiệm vụ của bạn là xây dựng từ đầu dự án:

# EVShare 3D

**EVShare 3D – Nền tảng thông minh hỗ trợ quản trị và vận hành xe điện đồng sở hữu trên không gian Web 3D tương tác**

Tên tiếng Anh:

> EVShare 3D – Intelligent Web 3D Platform for Electric Vehicle Co-ownership Management and Operations

---

# 1. NGUYÊN TẮC QUAN TRỌNG NHẤT

EVShare 3D phải là:

> PURE 3D FIRST APPLICATION

Sau khi người dùng đăng nhập, nghiệp vụ chính phải diễn ra trực tiếp trong không gian Web 3D.

Không xây dựng theo kiểu:

```text
Sidebar 2D
Dashboard 2D
Table
Calendar 2D
Forms 2D
Charts 2D

+

một model xe 3D
```

Đây KHÔNG phải mục tiêu dự án.

Kiến trúc đúng:

```text
3D WORLD
    ↓
INTERACTIVE 3D OBJECT
    ↓
SPATIAL UI
    ↓
BUSINESS ACTION
    ↓
SPRING BOOT API
    ↓
MYSQL
```

---

# 2. STACK CHÍNH THỨC

## FRONTEND

```text
React
Vite
TypeScript
React Router
Three.js
React Three Fiber
@react-three/drei
Zustand
TanStack Query
React Hook Form
Zod
```

## BACKEND

```text
Java 21+
Spring Boot
Spring Web
Spring Security
Spring Validation
Spring Data JPA
Hibernate
JWT
Flyway
Spring Boot Actuator
```

## DATABASE

```text
MySQL 8+
```

## 3D ASSET

```text
GLB
GLTF
Blender
```

---

# 3. KHÔNG SỬ DỤNG

Không sử dụng:

```text
Next.js
NestJS
Prisma
PostgreSQL
```

Backend phải là:

```text
Spring Boot
+
Spring Data JPA
+
Hibernate
+
Flyway
+
MySQL
```

---

# 4. KIẾN TRÚC TỔNG THỂ

```text
React + Vite
Three.js / React Three Fiber
        ↓
REST API
        ↓
Spring Boot
        ↓
Service Layer
        ↓
Spring Data JPA / Hibernate
        ↓
MySQL
```

---

# 5. PROJECT STRUCTURE

Root:

```text
evshare-3d/
│
├── frontend/
│
├── backend/
│
├── docker-compose.yml
├── README.md
└── docs/
```

Frontend:

```text
frontend/
├── public/
│   ├── models/
│   ├── textures/
│   └── environments/
│
├── src/
│   ├── components/
│   │   ├── three/
│   │   └── spatial-ui/
│   │
│   ├── scenes/
│   ├── features/
│   ├── services/
│   ├── hooks/
│   ├── store/
│   ├── types/
│   ├── routes/
│   ├── utils/
│   ├── App.tsx
│   └── main.tsx
│
├── vite.config.ts
└── package.json
```

Backend:

```text
backend/
├── src/
│   ├── main/
│   │   ├── java/
│   │   │   └── com/evshare/
│   │   │       ├── auth/
│   │   │       ├── user/
│   │   │       ├── vehicle/
│   │   │       ├── ownership/
│   │   │       ├── booking/
│   │   │       ├── trip/
│   │   │       ├── damage/
│   │   │       ├── maintenance/
│   │   │       ├── finance/
│   │   │       ├── voting/
│   │   │       ├── notification/
│   │   │       ├── security/
│   │   │       ├── common/
│   │   │       └── config/
│   │   │
│   │   └── resources/
│   │       ├── application.yml
│   │       └── db/
│   │           └── migration/
│   │
│   └── test/
│
├── pom.xml
└── mvnw
```

---

# 6. BACKEND ARCHITECTURE RULE

Mỗi module phải ưu tiên cấu trúc:

```text
Controller
↓
Service
↓
Repository
↓
Entity
↓
MySQL
```

Có thể thêm:

```text
DTO
Mapper
Validator
Exception
```

Không trả JPA Entity trực tiếp nếu DTO phù hợp hơn.

---

# 7. DATABASE MIGRATION

Không tự động tạo database schema production bằng:

```text
spring.jpa.hibernate.ddl-auto=create
```

hoặc:

```text
update
```

làm cơ chế migration chính.

Sử dụng:

```text
Flyway
```

Migration đặt tại:

```text
backend/src/main/resources/db/migration/
```

Ví dụ:

```text
V1__create_users.sql
V2__create_vehicles.sql
V3__create_ownership.sql
V4__create_bookings.sql
```

Hibernate có thể dùng:

```text
ddl-auto=validate
```

sau khi migration được thiết lập.

---

# 8. MYSQL RULES

ID ưu tiên UUID.

Java:

```java
UUID
```

MySQL có thể lưu:

```text
CHAR(36)
```

hoặc cách phù hợp với implementation.

Tiền phải sử dụng:

```java
BigDecimal
```

Không sử dụng:

```java
double
float
```

cho tiền.

Ví dụ:

```java
private BigDecimal amount;
```

Ownership percentage:

```java
BigDecimal
```

Ví dụ:

```text
40.00
30.00
30.00
```

---

# 9. BUSINESS RULE PHẢI NẰM Ở BACKEND

Các rule sau KHÔNG được chỉ kiểm tra ở React:

```text
Booking conflict
Ownership <= 100%
Voting eligibility
Weighted voting
Expense sharing
Trip state
Check-in permission
Check-out permission
Damage permission
Maintenance state
Role permission
```

React chỉ là presentation + interaction layer.

Spring Boot là source of truth.

---

# 10. AUTHENTICATION

Sử dụng:

```text
Spring Security
JWT Access Token
Refresh Token
BCrypt
Role Based Access Control
```

Roles:

```text
CO_OWNER
STAFF
ADMIN
```

---

# 11. PURE 3D RULE

Sau khi vào:

```text
/garage
```

không sử dụng:

```text
traditional sidebar
traditional dashboard
HTML data table
2D booking calendar
2D voting dashboard
2D finance dashboard
2D analytics page
```

Các nghiệp vụ phải được biểu diễn bằng:

```text
3D Objects
3D Terminals
Spatial Panels
3D Buttons
World-space Text
Holograms
Orbs
Markers
Hotspots
3D Timeline
3D Rings
3D Charts
Spatial Graph
```

---

# 12. HTML INPUT RULE

HTML input chỉ được dùng khi thật sự cần:

```text
email
password
text
date/time
file upload
```

Nhưng input phải được gắn vào:

```text
world-space panel
```

Không biến thành form full-screen 2D.

Có thể sử dụng:

```text
@react-three/drei Html
```

nhưng phải neo theo tọa độ 3D.

---

# 13. MANUAL TEST FIRST

Tôi sẽ test chủ yếu bằng mắt và tương tác.

Sau mỗi Phase, phải cho tôi biết:

```text
Tôi nhìn thấy gì?
Tôi hover đâu?
Tôi click đâu?
Camera phải phản ứng gì?
Object nào highlight?
Dữ liệu nào thay đổi?
API nào được gọi?
Refresh browser thì dữ liệu còn không?
```

---

# HUMAN MANUAL TEST RULE

From now on:

- Do NOT open any browser automatically.
- Do NOT use browser automation.
- Do NOT perform UI interaction testing yourself.
- Do NOT click buttons, forms, 3D objects, or routes in the browser.
- Do NOT visually inspect the application through a browser.

You MAY only perform non-UI technical verification from the terminal, including:
- frontend build
- TypeScript compile
- backend build
- Spring Boot tests
- API checks using terminal tools such as curl
- MySQL connectivity checks
- Flyway migration checks
- automated unit/integration tests

All visual testing and interaction testing will be performed manually by me.

After each phase:
1. implement the feature,
2. run only non-UI technical checks,
3. provide me with a Manual Visual Test Checklist,
4. STOP and wait for my confirmation.

---

# 14. STOP RULE

Sau mỗi Phase:

```text
STOP.
```

Không tự chuyển Phase.

Chỉ tiếp tục khi tôi nói:

```text
Phase XX passed.
Continue Phase YY only.
```

Nếu tôi báo bug:

```text
Fix this bug only.
Do not continue.
```

---

# PHASE 00 — INFRASTRUCTURE FOUNDATION

## Goal

Thiết lập toàn bộ môi trường kỹ thuật.

## Frontend

Tạo:

```text
React
Vite
TypeScript
```

## Backend

Tạo:

```text
Spring Boot
Java 21+
Spring Web
Spring Data JPA
Spring Validation
MySQL Driver
Flyway
Actuator
```

Spring Security có thể cài dependency nhưng chưa cần auth hoàn chỉnh.

## Database

Docker MySQL 8+.

Database:

```text
evshare3d
```

## API

Tạo:

```text
GET /api/health
```

Health phải kiểm tra database thật.

Ví dụ:

```json
{
  "status": "UP",
  "api": "UP",
  "database": "UP"
}
```

## Temporary UI

Phase này được phép 2D.

Hiển thị:

```text
EVShare 3D

Frontend
CONNECTED

Spring Boot API
CONNECTED

MySQL
CONNECTED
```

## Manual Test

```text
[ ] React chạy
[ ] Spring Boot chạy
[ ] MySQL chạy
[ ] React gọi được /api/health
[ ] Database UP
[ ] Tắt MySQL
[ ] Health báo DB lỗi
[ ] Bật MySQL
[ ] Health trở lại UP
```

STOP.

---

# PHASE 01 — 3D AUTHENTICATION

## Database

Tạo User.

Fields:

```text
id
email
passwordHash
fullName
role
status
createdAt
updatedAt
```

Roles:

```text
CO_OWNER
STAFF
ADMIN
```

## Backend

Implement:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
GET /api/auth/me
```

Spring Security + JWT.

## Frontend

Routes:

```text
/login
/register
```

## 3D Login Scene

Có:

```text
AuthenticationWorld
LoginPortal
EVShareLogo
SpatialLoginPanel
CameraRig
Environment
```

Spatial panel:

```text
EVSHARE 3D

EMAIL
[ ...]

PASSWORD
[ ...]

[ LOGIN ]

[ CREATE ACCOUNT ]
```

## Interaction

```text
Hover LOGIN
→ highlight

Click
→ loading animation

Success
→ portal activates
→ camera moves
→ /garage

Fail
→ spatial error
```

## Register

Spatial Register Panel.

Fields:

```text
Full Name
Email
Password
Confirm Password
```

## Manual Test

```text
[ ] /login render 3D
[ ] /register render 3D
[ ] Hover buttons
[ ] Validation
[ ] Register
[ ] MySQL có User
[ ] Duplicate email bị reject
[ ] Login sai
[ ] Login đúng
[ ] JWT hoạt động
[ ] /auth/me hoạt động
[ ] Redirect /garage
```

STOP.

---

# PHASE 02 — PURE 3D WORLD FOUNDATION

## Goal

Tạo không gian chính.

Route:

```text
/garage
```

Tạo:

```text
EVShareWorld
CameraRig
WorldLighting
InteractionManager
GarageFloor
WorldEnvironment
WorldLoader
```

Có:

```text
camera
floor
walls
lighting
shadows
environment
test objects
```

## Interaction

```text
hover
click
select
deselect
orbit
zoom
focus
```

## Manual Test

```text
[ ] /garage render
[ ] Camera rotate
[ ] Zoom
[ ] Hover object
[ ] Highlight
[ ] Click select
[ ] Click background deselect
```

STOP.

---

# PHASE 03 — VIRTUAL GARAGE

Xây các zone:

```text
Vehicle Zone
Charging Zone
Maintenance Zone
Finance Zone
Governance Zone
Analytics Zone
AI Zone
```

Mỗi zone là object 3D thật.

Hover:

```text
highlight
+
world-space label
```

Click:

```text
smooth camera focus
```

Manual Test:

```text
[ ] Tất cả zone render
[ ] Hover từng zone
[ ] Label xuất hiện
[ ] Click zone
[ ] Camera focus đúng
```

STOP.

---

# PHASE 04 — VEHICLE DIGITAL TWIN

Load:

```text
/public/models/ev-car.glb
```

Vehicle phải:

```text
hoverable
selectable
highlightable
focusable
```

Spatial status:

```text
EV01
AVAILABLE
Battery 82%
```

Manual Test:

```text
[ ] Model load
[ ] Hover vehicle
[ ] Click
[ ] Highlight
[ ] Camera focus
[ ] Deselect
```

STOP.

---

# PHASE 05 — VEHICLE BACKEND + MYSQL

## Entity

Vehicle:

```text
id
name
brand
model
year
licensePlate
vin
batteryCapacity
currentBatteryLevel
odometer
status
model3dUrl
createdAt
updatedAt
```

Status:

```text
AVAILABLE
RESERVED
IN_USE
CHARGING
MAINTENANCE
UNAVAILABLE
```

## Backend

Implement:

```text
GET /api/vehicles
GET /api/vehicles/{id}
POST /api/vehicles
PATCH /api/vehicles/{id}
```

Spring Data JPA Repository.

Flyway migration.

## Frontend

Garage phải lấy vehicle từ Spring Boot.

Không hard-code.

Manual Test:

```text
[ ] Seed vehicle MySQL
[ ] Garage load xe
[ ] Spatial status đúng
[ ] Đổi battery DB
[ ] Refresh
[ ] Battery cập nhật
```

STOP.

---

# PHASE 06 — VEHICLE PART INTERACTION

Tạo VehiclePart.

Parts:

```text
Body
Door_FL
Door_FR
Door_RL
Door_RR
Wheel_FL
Wheel_FR
Wheel_RL
Wheel_RR
Battery
Charging_Port
Hood
Trunk
Lights
```

Backend:

```text
GET /api/vehicles/{id}/parts
```

3D:

Hover mesh → highlight.

Click mesh → focus.

Spatial panel:

```text
WHEEL FL
Status: GOOD
```

Manual Test:

```text
[ ] Click wheel
[ ] Wheel highlight
[ ] Camera focus
[ ] Part data đúng
```

STOP.

---

# PHASE 07 — 3D CO-OWNERSHIP

Database:

```text
CoOwnershipGroup
GroupMember
OwnershipShare
```

Business rule:

```text
Active ownership <= 100%
```

Finalized group:

```text
= 100%
```

3D:

```text
             Owner A 40%
                 ●

Owner C 30% ● — EV01 — ● Owner B 30%
```

Owner Orb phải tương tác.

Click Owner:

```text
Owner A
Ownership 40%
Usage 0%
```

Manual Test:

```text
[ ] 3 owner
[ ] 40/30/30
[ ] Total 100
[ ] Invalid >100 rejected
[ ] Owner Orb click
```

STOP.

---

# PHASE 08 — PURE 3D BOOKING

Database:

```text
Booking
```

Fields:

```text
id
vehicleId
userId
startTime
endTime
purpose
status
createdAt
updatedAt
```

Backend phải chống overlap.

3D flow:

```text
Select EV
↓
BOOK VEHICLE
↓
3D Timeline
↓
Select start/end
↓
Spatial confirm
↓
Spring Boot
↓
MySQL
```

Timeline:

```text
08:00 FREE
09:00 FREE
10:00 OWNER B
11:00 OWNER B
12:00 FREE
```

Manual Test:

```text
[ ] Timeline render
[ ] Slot click
[ ] Highlight selected
[ ] Booking success
[ ] Refresh vẫn tồn tại
[ ] Conflict bị reject
```

STOP.

---

# PHASE 09 — PURE 3D CHECK-IN

Database:

```text
CheckIn
VehicleInspection
```

Hotspots:

```text
Body
Front
Rear
Wheel FL
Wheel FR
Wheel RL
Wheel RR
Battery
Charging Port
Lights
Interior
```

Click hotspot:

```text
camera focus
↓
GOOD / WARNING / DAMAGED
```

Progress:

```text
7 / 11 inspected
```

Manual Test:

```text
[ ] Check-in chỉ khi booking hợp lệ
[ ] Hotspot hoạt động
[ ] Camera focus
[ ] Condition lưu
[ ] Progress đúng
[ ] Check-in complete
```

STOP.

---

# PHASE 10 — 3D TRIP START

Database:

```text
Trip
```

Action:

```text
START TRIP
```

Backend phải validate state.

Vehicle:

```text
AVAILABLE/RESERVED
→ IN_USE
```

Spatial data:

```text
TRIP ACTIVE
Start Battery
Start Odometer
Started At
```

Manual Test:

```text
[ ] Start Trip
[ ] Vehicle IN_USE
[ ] Trip ACTIVE
[ ] Refresh giữ trạng thái
```

STOP.

---

# PHASE 11 — TRIP VISUALIZATION

Hiển thị:

```text
Elapsed Time
Distance
Battery Consumption
Trip State
```

Dữ liệu MVP có thể simulation có kiểm soát.

Không giả vờ là telemetry thật.

Manual Test:

```text
[ ] Timer hoạt động
[ ] Data visualization render
[ ] State không mất khi refresh
```

STOP.

---

# PHASE 12 — PURE 3D CHECK-OUT

Database:

```text
CheckOut
```

Flow:

```text
END TRIP
↓
RETURN VEHICLE
↓
CHECK-OUT
```

3D before/after:

```text
BEFORE      AFTER

Battery
91%         48%

Odometer
10200       10278
```

Manual Test:

```text
[ ] End Trip
[ ] Check-out
[ ] Odometer không nhỏ hơn trước
[ ] Battery hợp lệ
[ ] Before/After đúng
```

STOP.

---

# PHASE 13 — 3D DAMAGE MAPPING

Database:

```text
DamageReport
```

Fields:

```text
vehicleId
vehiclePartId
reportedBy
damageType
severity
description

positionX
positionY
positionZ

normalX
normalY
normalZ

imageUrl
status
```

Flow:

```text
REPORT DAMAGE
↓
Click surface
↓
Raycast
↓
Marker Preview
↓
Select Type
↓
Select Severity
↓
Save
```

Types:

```text
SCRATCH
DENT
CRACK
BROKEN
OTHER
```

Severity:

```text
LOW
MEDIUM
HIGH
CRITICAL
```

Manual Test:

```text
[ ] Damage Mode
[ ] Click Door_FL
[ ] Marker đúng vị trí
[ ] Save
[ ] Refresh marker còn
```

STOP.

---

# PHASE 14 — DAMAGE HISTORY

Markers load từ API.

Hover:

```text
Scratch
Medium
```

Click:

```text
Damage Spatial Card
```

Status:

```text
OPEN
IN_REPAIR
RESOLVED
```

Manual Test:

```text
[ ] Multiple markers
[ ] Hover
[ ] Click
[ ] Data đúng
[ ] Camera focus marker
```

STOP.

---

# PHASE 15 — PURE 3D MAINTENANCE

Database:

```text
MaintenanceRequest
MaintenanceRecord
```

Status:

```text
REQUESTED
APPROVED
IN_PROGRESS
COMPLETED
CANCELLED
```

Maintenance Zone phải hoạt động.

Part lỗi:

```text
WHEEL FL
MAINTENANCE REQUIRED
```

Manual Test:

```text
[ ] Damage → Maintenance Request
[ ] Part warning
[ ] Request lưu DB
[ ] Staff update status
```

STOP.

---

# PHASE 16 — X-RAY / BATTERY MODE

Modes:

```text
NORMAL
X_RAY
BATTERY
```

Battery visualization:

```text
SOC
SOH
Temperature
Cycle Count
Status
```

Manual Test:

```text
[ ] Normal
[ ] X-Ray
[ ] Battery
[ ] Camera/model transition
[ ] Data từ backend
```

STOP.

---

# PHASE 17 — PURE 3D CHARGING

Charging Station là 3D object.

Flow:

```text
Click Charger
↓
Select Vehicle
↓
START CHARGING
```

Vehicle:

```text
CHARGING
```

Spatial:

```text
SOC 47%
Target 80%
Power 7.4 kW
```

MVP simulation được phép.

Manual Test:

```text
[ ] Start Charging
[ ] Status CHARGING
[ ] Progress
[ ] Stop Charging
```

STOP.

---

# PHASE 18 — PURE 3D EXPENSE

Database:

```text
Expense
```

Amount:

```java
BigDecimal
```

Types:

```text
CHARGING
MAINTENANCE
INSURANCE
REGISTRATION
CLEANING
PARKING
TOLL
REPAIR
OTHER
```

Finance Zone:

```text
Financial Terminal
```

Expense hiển thị như Orb.

Manual Test:

```text
[ ] Open Finance Terminal
[ ] Expense Orbs
[ ] Click Expense
[ ] Details đúng
```

STOP.

---

# PHASE 19 — 3D COST SHARING

Database:

```text
ExpenseShare
```

Strategies:

```text
BY_OWNERSHIP
BY_USAGE
EQUAL
HYBRID
```

Implement BY_OWNERSHIP trước.

Ví dụ:

```text
10M

40% → 4M
30% → 3M
30% → 3M
```

Visualization phải spatial.

Manual Test:

```text
[ ] Calculation đúng
[ ] Sum shares = expense
[ ] 3D visualization đúng
```

STOP.

---

# PHASE 20 — 3D SHARED FUND

Database:

```text
SharedFund
FundTransaction
```

Amount:

```java
BigDecimal
```

Object:

```text
Shared Fund Core
```

Spatial balance:

```text
Maintenance Fund
25,000,000 VND
```

Manual Test:

```text
[ ] Contribution
[ ] Expense
[ ] Balance đúng
[ ] Transaction Timeline
```

STOP.

---

# PHASE 21 — PURE 3D VOTING

Database:

```text
Proposal
Vote
```

Modes:

```text
ONE_PERSON_ONE_VOTE
WEIGHTED_BY_OWNERSHIP
```

Voting Terminal:

```text
REPLACE BATTERY?

[ YES ]

[ NO ]
```

Backend chống vote hai lần.

Manual Test:

```text
[ ] Vote
[ ] Duplicate reject
[ ] Weighted result đúng
[ ] Result visualization
```

STOP.

---

# PHASE 22 — CONTRACT

Database:

```text
Contract
ContractSignature
```

3D:

```text
Contract Terminal
Holographic Contract Summary
```

Hiển thị:

```text
Contract
Version
Owners
Signature Status
```

Manual Test:

```text
[ ] Contract render
[ ] Signature status
[ ] Sign action
```

STOP.

---

# PHASE 23 — 3D ANALYTICS

Metrics:

```text
Trips
KM
Usage Hours
Battery Consumption
Expenses
Ownership Ratio
Usage Ratio
```

Visualization:

```text
3D Bar
3D Ring
Radial Graph
Spatial Timeline
```

Không chart HTML làm chính.

Manual Test:

```text
[ ] Analytics Core
[ ] Metrics đúng backend
[ ] Switch owner
[ ] Visualization update
```

STOP.

---

# PHASE 24 — FAIRNESS VISUALIZATION

So sánh:

```text
Ownership
vs
Usage
```

Ví dụ:

```text
Owner A

Ownership 40%
Usage 25%
Difference -15%
```

Sử dụng spatial rings.

Manual Test:

```text
[ ] Ratio đúng
[ ] Imbalance nhìn thấy rõ
```

STOP.

---

# PHASE 25 — SMART BOOKING PRIORITY

Backend deterministic algorithm.

Input:

```text
ownership
usage
recent usage
booking history
```

Output:

```text
priority score
recommendation
```

3D Booking Timeline highlight slot đề xuất.

Manual Test:

```text
[ ] Owner dùng ít có priority cao hơn
[ ] Suggested slot highlight
[ ] Conflict vẫn được enforce
```

STOP.

---

# PHASE 26 — 3D AI ASSISTANT

Tạo:

```text
AI Orb
```

AI recommendation phải xuất hiện spatially.

Không cần ML phức tạp ngay.

Có thể bắt đầu deterministic recommendation.

Ví dụ:

```text
Owner A owns 40%
but uses 25%.

Recommend higher booking priority.
```

Manual Test:

```text
[ ] AI Orb click
[ ] Recommendation render
[ ] Data có nguồn từ backend
[ ] Owner liên quan highlight
```

STOP.

---

# PHASE 27 — SPATIAL NOTIFICATIONS

Notifications gắn vào object:

```text
Vehicle
Charging Station
Maintenance Zone
Finance Terminal
Voting Terminal
```

Ví dụ:

```text
!
Maintenance Required
```

Manual Test:

```text
[ ] Trigger event
[ ] Notification đúng object
[ ] Click notification
[ ] Camera focus
```

STOP.

---

# PHASE 28 — STAFF 3D OPERATIONS

Staff vẫn dùng cùng 3D world.

Staff chỉ thấy action có quyền:

```text
Check-in
Check-out
Damage Review
Maintenance
```

Manual Test:

```text
[ ] Staff login
[ ] Permission đúng
[ ] Staff không làm Admin action
```

STOP.

---

# PHASE 29 — ADMIN 3D CONTROL CENTER

Tạo:

```text
Admin Control Core
```

Spatial modules:

```text
User Core
Vehicle Core
Ownership Core
Maintenance Core
Finance Core
Governance Core
```

Không dashboard CRUD truyền thống làm chính.

Manual Test:

```text
[ ] Admin thấy Control Core
[ ] Co-owner không thấy
[ ] CRUD action hoạt động
```

STOP.

---

# PHASE 30 — DISPUTE MANAGEMENT

Database:

```text
DisputeCase
DisputeEvidence
```

Liên kết:

```text
Booking
Trip
Damage
Expense
Vehicle
User
```

3D Evidence Graph.

Manual Test:

```text
[ ] Create Dispute
[ ] Evidence Graph
[ ] Admin Resolve
```

STOP.

---

# PHASE 31 — REPORTING

Tạo:

```text
Report Core
```

Types:

```text
Finance
Usage
Maintenance
Damage
Ownership
```

3D visualization là chính.

Export file được phép.

Manual Test:

```text
[ ] Select report
[ ] Spatial visualization
[ ] Data đúng
[ ] Export
```

STOP.

---

# PHASE 32 — CAMERA POLISH

Camera modes:

```text
Garage Overview
Vehicle Focus
Part Focus
Inspection Orbit
Terminal Focus
Analytics Focus
```

Smooth interpolation.

Có spatial:

```text
BACK TO GARAGE
```

Manual Test:

```text
[ ] Camera smooth
[ ] Không bị kẹt
[ ] Back hoạt động
```

STOP.

---

# PHASE 33 — 3D UX POLISH

Improve:

```text
hover
selection
animation
labels
billboarding
visibility
occlusion
loading
feedback
```

Manual Test:

```text
[ ] Text đọc được
[ ] Hover rõ
[ ] Selected rõ
[ ] Không clutter nghiêm trọng
```

STOP.

---

# PHASE 34 — PERFORMANCE

Kiểm tra:

```text
polygon count
texture size
draw calls
shadows
asset loading
memory
FPS
```

Có thể dùng:

```text
Draco
Meshopt
KTX2
LOD
Instancing
Lazy Loading
```

Manual Test:

```text
[ ] Scene load ổn
[ ] FPS ổn
[ ] Không freeze đáng kể
```

STOP.

---

# PHASE 35 — SECURITY HARDENING

Kiểm tra:

```text
Spring Security
RBAC
JWT expiry
Refresh Token
Ownership permission
Booking permission
Staff permission
Admin permission
```

Manual Test:

```text
[ ] CO_OWNER gọi Admin API → 403
[ ] STAFF sửa ownership → 403
[ ] User sửa booking người khác → reject
```

STOP.

---

# PHASE 36 — ERROR HANDLING

Test:

```text
MySQL offline
Spring Boot offline
Vehicle model load fail
Network timeout
Invalid request
Booking conflict
Invalid ownership
Damage save fail
```

3D world không được crash.

Manual Test:

```text
[ ] API fail
[ ] Scene vẫn render
[ ] Spatial error
[ ] Retry
```

STOP.

---

# PHASE 37 — END-TO-END USER FLOW

Test full flow:

```text
Login
↓
Garage
↓
Vehicle
↓
Ownership
↓
Booking
↓
Check-in
↓
Trip
↓
Check-out
↓
Damage
↓
Maintenance
↓
Charging
↓
Finance
↓
Cost Sharing
↓
Shared Fund
↓
Voting
↓
Analytics
↓
AI
```

Sau login không rời 3D world.

STOP.

---

# PHASE 38 — FINAL DEMO DATA

Seed dữ liệu demo.

Users:

```text
Owner A — 40%
Owner B — 30%
Owner C — 30%
Staff
Admin
```

Vehicle:

```text
EVShare Demo EV
51E-123.45
75 kWh
82%
10,200 km
AVAILABLE
```

Tạo:

```text
Bookings
Trips
Damage
Maintenance
Expenses
Fund
Voting
Analytics
```

STOP.

---

# PHASE 39 — PRESENTATION MODE

Tạo:

```text
DEMO MODE
```

Các điểm trình bày:

```text
1 Ownership
2 Booking
3 Check-in
4 Damage
5 Maintenance
6 Finance
7 Voting
8 Analytics
9 AI
```

Click → camera dẫn đến feature.

STOP.

---

# PHASE 40 — FINAL COMPLETION

Làm:

```text
Bug Fix
Code Cleanup
Build Verification
Flyway Verification
MySQL Verification
README
Demo Accounts
Environment Documentation
Final Manual Test
```

README:

```text
Overview
Architecture
Frontend Setup
Backend Setup
MySQL Setup
Flyway
Environment Variables
How To Run
Demo Accounts
Controls
Feature List
Project Structure
```

Final Definition of Done:

```text
[ ] React build success
[ ] Spring Boot build success
[ ] Flyway migration success
[ ] MySQL success
[ ] Authentication success
[ ] Garage success
[ ] Digital Twin success
[ ] Ownership success
[ ] Booking success
[ ] Check-in success
[ ] Trip success
[ ] Check-out success
[ ] Damage success
[ ] Maintenance success
[ ] Charging success
[ ] Finance success
[ ] Cost Sharing success
[ ] Shared Fund success
[ ] Voting success
[ ] Analytics success
[ ] AI recommendation success
[ ] RBAC success
[ ] Full Demo success
```

---

# FINAL PURE 3D ACCEPTANCE RULE

Trước khi coi một feature là hoàn thành, hãy hỏi:

> Nếu bỏ scene 3D đi thì chức năng này có còn hoạt động gần như một website 2D thông thường không?

Nếu:

```text
YES
```

thì feature chưa đạt Pure 3D.

Phải redesign để phụ thuộc thực sự vào:

```text
3D Object
3D Position
Camera
Raycasting
Spatial UI
Spatial Relationship
Digital Twin
World Interaction
```

---

# OUTPUT FORMAT SAU MỖI PHASE

Sau khi hoàn thành mỗi Phase, trả đúng format:

```text
PHASE COMPLETED

Phase:
XX — ...

Implemented:
- ...

Backend:
- ...

Database:
- ...

API:
- ...

3D Objects:
- ...

3D Interactions:
- ...

Files Created:
- ...

Files Modified:
- ...

How To Run:
- ...

MANUAL TEST CHECKLIST

[ ] ...
[ ] ...
[ ] ...

Expected Result:
...

Known Limitations:
...

STOPPED HERE.
Waiting for manual verification.
```

---

# HUMAN MANUAL TEST RULE

From now on:

- Do NOT open any browser automatically.
- Do NOT use browser automation.
- Do NOT perform UI interaction testing yourself.
- Do NOT click buttons, forms, 3D objects, or routes in the browser.
- Do NOT visually inspect the application through a browser.

You MAY only perform non-UI technical verification from the terminal, including:
- frontend build
- TypeScript compile
- backend build
- Spring Boot tests
- API checks using terminal tools such as curl
- MySQL connectivity checks
- Flyway migration checks
- automated unit/integration tests

All visual testing and interaction testing will be performed manually by the user.

After each phase:
1. implement the feature,
2. run only non-UI technical checks,
3. provide a Manual Visual Test Checklist,
4. STOP and wait for confirmation.

---

# PERMANENT LOCALIZATION RULE

Code / API / Database: English  
UI / 3D labels / messages: Vietnamese

Requirements:
- Keep all source code identifiers, classes, functions, enums, database tables/columns, and API routes in English.
- All user-facing text must be Vietnamese.
- All 3D world-space labels must be Vietnamese.
- All spatial panels, buttons, validation messages, success messages, error messages, notifications, confirmations, and status text must be Vietnamese.
- Do not translate internal enum values or API payload field names.
- Apply this rule to all current and future phases.
