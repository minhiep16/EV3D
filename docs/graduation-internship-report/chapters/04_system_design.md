# CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG

---

## 4.1. KIẾN TRÚC TỔNG THỂ HỆ THỐNG (SYSTEM ARCHITECTURE)

Hệ thống EVShare 3D được thiết kế theo mô hình kiến trúc phân tầng doanh nghiệp (Enterprise Layered Architecture) kết hợp chặt chẽ với động cơ đồ họa không gian 3D WebGL tại phía máy khách. Hệ thống bảo đảm sự phân tách rõ ràng giữa tầng hiển thị (Presentation Tier), tầng logic nghiệp vụ (Application/Business Logic Tier) và tầng lưu trữ dữ liệu bền vững (Persistence Tier).

Sơ đồ kiến trúc tổng thể được biểu diễn trực quan:
* **Tầng Trình Duyệt Máy Khách (Client Tier):** Ứng dụng Single Page Application (SPA) phát triển trên nền tảng React 18, TypeScript và Three.js r173. Toàn bộ logic giao diện, quản lý trạng thái (Zustand) và kết xuất 3D (React Three Fiber) được thực thi cục bộ trên trình duyệt, tận dụng GPU máy khách để duy trì tốc độ 60 FPS.
* **Tầng Trung Gian Truyền Thông (Network & Communication Tier):** Mọi giao tiếp giữa Client và Server được thực hiện qua giao thức HTTPS dưới dạng các thông điệp RESTful API phi trạng thái (Stateless REST/JSON), được bảo vệ bởi Access Token JWT gửi kèm trong header `Authorization: Bearer`.
* **Tầng Máy Chủ Ứng Dụng (Application Server Tier):** Máy chủ Spring Boot 3.3.4 (chạy trên OpenJDK 21 LTS) tiếp nhận các yêu cầu REST, chuyển qua chuỗi lọc bảo mật `JwtAuthenticationFilter`, điều phối qua 27 Controller, thực thi nghiệp vụ thông qua hơn 25 Service chuyên trách, và tương tác với cơ sở dữ liệu qua Spring Data JPA và Hibernate ORM.
* **Tầng Dữ Liệu và Tài Nguyên Tĩnh (Data & Asset Tier):** 
  * Cơ sở dữ liệu quan hệ **MySQL 8.0+** lưu trữ toàn bộ dữ liệu cấu trúc (46 bảng thực thể, tuân thủ nghiêm ngặt nguyên tắc ACID).
  * Kho tài nguyên mô hình 3D (Static Public Assets) lưu trữ các tệp mô hình nhị phân tối ưu hóa định dạng `.glb` (`ev01-realistic.glb`, `ev02-stylized.glb`, `vinfast_vf3.glb`...).

*(Xem chi tiết mã nguồn sơ đồ PlantUML tại tệp `diagrams/architecture/overall_system_architecture.puml`).*

---

## 4.2. KIẾN TRÚC FRONTEND VÀ GIAO DIỆN KHÔNG GIAN 3D (SPATIAL UI)

### 4.2.1. Cấu trúc tổ chức cây thư mục Frontend
Mã nguồn Frontend tại thư mục `frontend/src/` được tổ chức theo module hóa cao độ:
* `components/`: Chứa các component giao diện người dùng, chia nhỏ theo vai trò (`admin/`, `staff/`, `coowner/`, `fleet/`, `common/`) và các thành phần 3D chuyên sâu (`three/vehicles/`, `three/battery/`, `three/booking/`, `three/charging/`, `three/damage/`, `three/zones/`).
* `scenes/`: Chứa các Scene cấp cao đại diện cho các màn hình ứng dụng: `AuthScene.tsx` (Màn hình đăng nhập/đăng ký 3D), `GarageScene.tsx` (Không gian Virtual Garage 3D trung tâm), `OnboardingScene.tsx`, và `StatusScene.tsx`.
* `store/`: Chứa các kho lưu trữ trạng thái toàn cục Zustand:
  * `authStore.ts`: Quản lý thông tin phiên làm việc, dữ liệu người dùng (`user`), token xác thực (`accessToken`, `refreshToken`), và vai trò hiện tại.
  * `worldStore.ts`: Quản lý trạng thái không gian 3D, mã xe đang chọn (`selectedVehicleId`), chế độ xem xe (`vehicleMode`, `vehicleBatteryXrayMode`, `isExplorationMode`), và định danh panel nghiệp vụ đang mở (`activePrimaryPanel`).
* `services/`: Chứa các client gọi API (Axios/TanStack Query): `authApi.ts`, `vehicleApi.ts`, `bookingApi.ts`, `tripApi.ts`, `expenseApi.ts`, `contractApi.ts`...
* `types/`: Chứa toàn bộ các định nghĩa kiểu tĩnh TypeScript đồng bộ với DTO Backend.

### 4.2.2. Kiến trúc phân cấp Scene Graph và Spatial UI
Không gian Virtual Garage 3D được xây dựng dựa trên cây phân cấp đối tượng (Scene Graph):
1. **Lớp Gốc (EVShareWorld):** Khởi tạo thẻ `<Canvas>` của React Three Fiber, thiết lập Camera phối cảnh (`PerspectiveCamera`), ánh sáng môi trường và sàn phản xạ (`MeshReflectorMaterial`).
2. **Lớp Đối Tượng Vật Lý (VehicleDigitalTwin):** Tải mô hình 3D xe thông qua hook `useGLTF`. Khi người dùng chuyển đổi màu xe hoặc bật chế độ X-Ray, component sẽ duyệt qua toàn bộ các nút con (Children Meshes) để thay thế thuộc tính vật liệu (`material.color`, `material.opacity`, `material.transparent`).
3. **Lớp Thẻ Thông Tin Nổi (Spatial Hologram Overlays):** Sử dụng component `<Html>` của thư viện Drei để gắn trực tiếp các khung thông tin React (biển số, mức pin, trạng thái sẵn sàng) neo vào tọa độ không gian phía trên nóc xe.
4. **Lớp Bảng Điều Khiển Nổi (Floating Spatial Panels):** Các bảng điều khiển nghiệp vụ (`CoOwnerBookingPanel`, `FinanceZonePanel`, `StaffVehicleDetailPanel`) được bố trí dưới dạng các panel kính mờ (Glassmorphism) nằm cố định ở cạnh phải màn hình với hiệu ứng làm mờ nền (`backdrop-filter: blur(24px)`), tạo cảm giác hiện đại và không che khuất góc nhìn chính của xe 3D.

---

## 4.3. KIẾN TRÚC PHÂN TẦNG BACKEND (SPRING BOOT)

Mã nguồn Backend tại `backend/src/main/java/com/evshare/` tuân thủ kiến trúc phân tầng nghiêm ngặt:

1. **Tầng Bảo Mật & Bộ Lọc (Security & Filter Layer):**
   * Lớp `JwtAuthenticationFilter` chặn mọi request đến cổng `/api/**`, trích xuất chuỗi JWT từ header `Authorization`, xác thực tính hợp lệ qua `JwtTokenProvider` và nạp đối tượng `UserPrincipal` vào `SecurityContextHolder`.
2. **Tầng Điều Khiển (REST Controller Layer):**
   * Gồm 27 Controller chuyên biệt, chịu trách nhiệm nhận dữ liệu JSON, kiểm tra tính hợp lệ dữ liệu đầu vào thông qua các annotation validation (`@Valid`, `@NotNull`, `@Min`), gọi các Service tương ứng và trả về `ResponseEntity<T>` với mã trạng thái HTTP chuẩn.
3. **Tầng Dịch Vụ Nghiệp Vụ (Service Layer):**
   * Gồm 25+ Service triển khai toàn bộ các thuật toán và quy tắc nghiệp vụ:
     * `BookingService`: Xử lý thuật toán khử xung đột lịch đặt.
     * `VehicleEnergyInventoryService`: Xử lý công thức giá bình quân gia quyền năng lượng (WAC).
     * `ExpenseShareService`: Triển khai thuật toán phần dư lớn nhất Hare-Niemeyer.
     * `PersonalPaymentService`: Kiểm soát quy trình thanh toán cá nhân hai bước.
     * `CoOwnershipContractService`: Quản lý vòng đời hợp đồng số.
4. **Tầng Truy Cập Dữ Liệu (Repository Layer):**
   * Kế thừa giao diện `JpaRepository<T, ID>` của Spring Data JPA, hỗ trợ tự động sinh các câu lệnh truy vấn SQL thông minh, sử dụng cơ chế khóa lạc quan (Optimistic Locking) và phân trang tối ưu.
5. **Tầng Xử Lý Ngoại Lệ Tập Trung (Global Exception Handler):**
   * Lớp `GlobalExceptionHandler` bắt toàn bộ các lỗi nghiệp vụ (`ResourceNotFoundException`, `DuplicateResourceException`, `AccessDeniedException`, `MethodArgumentNotValidException`), định dạng thành một cấu trúc phản hồi lỗi JSON đồng nhất: `timestamp`, `status`, `error`, `message`, `path`.

---

## 4.4. THIẾT KẾ CƠ SỞ DỮ LIỆU QUAN HỆ (ERD)

Lược đồ cơ sở dữ liệu của EVShare 3D gồm **46 bảng thực thể quan hệ** được quản lý tiến hóa thông qua Flyway Migrations (từ V1 đến V46). Để đảm bảo tính rõ ràng và khả năng đọc hiểu học thuật, cấu trúc CSDL được phân rã thành 4 phân miền dữ liệu cốt lõi:

### 4.4.1. Phân miền Người dùng, Phương tiện và Đồng sở hữu (Core Domain)
* `users`: Lưu trữ thông tin tài khoản, email, mật khẩu băm BCrypt, họ tên, số điện thoại, vai trò (`ADMIN`, `STAFF`, `CO_OWNER`) và trạng thái.
* `refresh_tokens`: Lưu trữ các token làm mới phiên đăng nhập gắn với từng người dùng.
* `vehicles`: Lưu trữ thông tin định danh xe: số VIN, biển số, tên dòng xe, màu ngoại thất, dung lượng pin khả dụng (kWh), mức pin hiện tại (SOC), số ODO lũy kế và trạng thái phương tiện (`AVAILABLE`, `IN_USE`, `CHARGING`, `MAINTENANCE`, `RESERVED`).
* `co_ownership_groups`: Định danh các nhóm đồng sở hữu xe, mã nhóm, tên nhóm, số lượng thành viên tối đa và trạng thái nhóm.
* `group_members`: Bảng liên kết nhiều-nhiều giữa nhóm và người dùng, lưu vai trò trong nhóm (`LEADER`, `MEMBER`), trạng thái, thời điểm tham gia và thời điểm rời nhóm (`removed_at`).
* `ownership_shares`: Lưu tỷ lệ phần trăm sở hữu (`percentage` kiểu `DECIMAL(7,4)`) và số tiền vốn góp (`capital_contribution`) của từng thành viên đối với chiếc xe của nhóm.
* `ownership_change_histories`: Ghi nhận nhật ký lịch sử mọi biến động chuyển nhượng và tái phân bổ cổ phần trong nhóm.

### 4.4.2. Phân miền Đặt xe, Chuyến đi, Bàn giao và Kiểm định (Operations Domain)
* `bookings`: Quản lý lịch đặt xe: thời gian bắt đầu (`start_time`), kết thúc (`end_time`), trạng thái (`PENDING`, `CONFIRMED`, `CANCELLED`, `COMPLETED`), mục đích di chuyển.
* `vehicle_handovers`: Lưu biên bản bàn giao xe kỹ thuật: chỉ số ODO xuất phát, mức pin xuất phát, nhân viên bàn giao, thời điểm Co-Owner ký nhận (`owner_condition_acknowledged_at`), và trạng thái bàn giao.
* `trips`: Quản lý chu trình di chuyển thực tế của xe: liên kết 1-1 với `bookings`, thời điểm bắt đầu/kết thúc thực tế, ODO kết thúc, pin kết thúc, lượng điện tiêu thụ (`energy_consumed_kwh`), thời điểm gửi yêu cầu trả xe (`return_requested_at`), nhân viên đối soát trả xe (`return_verified_by_user_id`).
* `trip_extension_requests`: Lưu các yêu cầu xin gia hạn thêm giờ của chuyến đi và tiến trình đàm phán chấp thuận.
* `vehicle_inspections`: Lưu biên bản kiểm tra kỹ thuật tổng thể khi bàn giao hoặc nhận lại xe (kết quả: `PASSED`, `FAILED`, `CONDITIONALLY_PASSED`).
* `vehicle_inspection_items`: Danh mục chi tiết các hạng mục kiểm định thành phần (lốp xe, hệ thống phanh, đèn chiếu sáng, kính chắn gió, nội thất).
* `damage_records`: Quản lý các vết trầy xước, va chạm: vị trí bộ phận (`part_code`), mức độ nghiêm trọng (`severity`), mô tả, tọa độ điểm 3D trên lưới đa giác (`hotspot_x`, `hotspot_y`, `hotspot_z`), trạng thái xử lý (`REPORTED`, `IN_PROGRESS`, `RESOLVED`).

### 4.4.3. Phân miền Năng lượng, Trạm sạc và Tài chính (Energy & Finance Domain)
* `charging_stations`: Lưu danh mục các trụ sạc điện thông minh trong garage: loại cổng cắm, công suất nạp (kW), đơn giá điện mỗi kWh (`price_per_kwh`), trạng thái trụ.
* `charging_sessions`: Quản lý các phiên sạc pin thực tế: thời gian bắt đầu/kết thúc, điện năng nạp thô (`energy_delivered_kwh`), điện năng lưu kho thực tế sau tổn hao (`stored_energy_kwh`), tổn hao điện (`energy_loss_kwh`), chi phí sạc.
* `vehicle_energy_inventories`: Quản trị kho điện tích lũy trong pin xe: số kWh điện khả dụng (`available_energy_kwh`), tổng giá trị tiền điện tồn kho (`total_inventory_cost`), đơn giá điện bình quân gia quyền hiện hành (`weighted_avg_cost_per_kwh`), và cờ yêu cầu đối soát (`is_reconciliation_required`).
* `vehicle_energy_transactions`: Lưu vết toàn bộ các giao dịch xuất/nhập kho năng lượng (loại giao dịch: `CHARGING_INFLOW`, `TRIP_CONSUMPTION`, `RECONCILIATION_ADJUSTMENT`).
* `expenses`: Quản lý các khoản chi phí phát sinh của xe: số tiền (`amount`), danh mục (`CHARGING`, `MAINTENANCE`, `INSURANCE`, `CLEANING`...), chính sách phân bổ (`USER_RESPONSIBILITY`, `OWNERSHIP_RATIO`), trạng thái phê duyệt (`PENDING`, `APPROVED`, `REJECTED`).
* `expense_shares`: Lưu nghĩa vụ chi phí chi tiết phân bổ cho từng cá nhân thành viên: tỷ lệ phân bổ, số tiền phải nộp (`share_amount`), trạng thái thanh toán (`ALLOCATED`, `PARTIALLY_PAID`, `SETTLED`).
* `personal_expense_payments`: Lưu các bản ghi thanh toán cá nhân của thành viên: số tiền, phương thức thanh toán, mã đối soát giao dịch, trạng thái xác minh (`PAYMENT_SUBMITTED`, `PAYMENT_VERIFIED`, `REJECTED`), chế độ tài chính (`DEMO`).

### 4.4.4. Phân miền Pháp lý, Biểu quyết và Tranh chấp (Governance Domain)
* `co_ownership_contracts`: Quản lý hợp đồng đồng sở hữu của từng xe.
* `co_ownership_contract_versions`: Lưu các phiên bản hợp đồng (khi có sự thay đổi cơ cấu cổ đông hoặc điều khoản), trạng thái phiên bản (`DRAFT`, `PENDING_SIGNATURES`, `ACTIVE`, `SUPERSEDED`).
* `contract_acceptances`: Ghi nhận dữ liệu chấp thuận và chữ ký số mô phỏng (DEMO Signature) của từng thành viên đối với phiên bản hợp đồng.
* `vote_proposals`: Quản lý các đề xuất biểu quyết tập thể: tiêu đề, nội dung, loại đề xuất, quy tắc thông qua (`MAJORITY`, `SUPER_MAJORITY`, `UNANIMOUS`), hạn chót bình chọn, trạng thái (`OPEN`, `APPROVED`, `REJECTED`).
* `proposal_votes`: Lưu phiếu bầu của từng thành viên (`FOR`, `AGAINST`, `ABSTAIN`) kèm trọng số biểu quyết.
* `disputes`: Hồ sơ quản lý khiếu nại và tranh chấp: danh mục tranh chấp, mức độ ưu tiên, người khiếu nại, người bị khiếu nại, kết luận điều tra và phương án hòa giải của nhân viên.
* `dispute_evidences`: Danh mục tệp bằng chứng, hóa đơn, ảnh chụp đính kèm hồ sơ tranh chấp.
* `dispute_compensations`: Lưu thông tin bồi hoàn thiệt hại mô phỏng (DEMO Compensation) giữa các bên.
* `audit_logs`: Nhật ký kiểm toán hệ thống, lưu vết mọi thao tác nhạy cảm (tác nhân, hành động, địa chỉ IP, dữ liệu trước và sau thay đổi).

*(Xem chi tiết mã nguồn lược đồ ERD PlantUML tại tệp `diagrams/database/database_erd_overview.puml`).*

---

## 4.5. TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU CHI TIẾT (DATA DICTIONARY)

Dưới đây là đặc tả chi tiết từ điển dữ liệu của các bảng thực thể trọng yếu trong hệ thống EVShare 3D:

*Bảng 4.1. Từ điển dữ liệu bảng `vehicles` (Danh mục phương tiện điện).*

| Tên Cột | Kiểu Dữ Liệu SQL | Khóa Chính | Khóa Ngoại | Cho Phép Null | Giá Trị Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `CHAR(36)` | PK | Không | Không | UUID v4 | Mã định danh duy nhất của xe |
| `vin` | `VARCHAR(50)` | Không | Không | Không | N/A (UNIQUE) | Số khung xe tiêu chuẩn quốc tế |
| `license_plate` | `VARCHAR(20)` | Không | Không | Không | N/A (UNIQUE) | Biển số đăng ký phương tiện |
| `model_name` | `VARCHAR(100)` | Không | Không | Không | N/A | Tên thương mại dòng xe (VD: VF3, EV-01) |
| `exterior_color` | `VARCHAR(50)` | Không | Không | Có | 'BLUE' | Tên màu sơn ngoại thất để ánh xạ 3D |
| `battery_capacity_kwh`| `DECIMAL(8,2)`| Không | Không | Không | 60.00 | Dung lượng pin danh định (kWh) |
| `current_battery_level`| `INT` | Không | Không | Không | 80 | Mức pin hiện tại (SOC từ 0 đến 100%) |
| `current_odometer_km` | `DECIMAL(10,2)`| Không | Không | Không | 0.00 | Tổng số km đã lăn bánh thực tế |
| `status` | `VARCHAR(30)` | Không | Không | Không | 'AVAILABLE' | Trạng thái xe (AVAILABLE, IN_USE...) |
| `created_at` | `TIMESTAMP` | Không | Không | Không | CURRENT_TIMESTAMP | Thời điểm khởi tạo bản ghi |
| `updated_at` | `TIMESTAMP` | Không | Không | Có | CURRENT_TIMESTAMP | Thời điểm cập nhật dữ liệu gần nhất |

*Bảng 4.2. Từ điển dữ liệu bảng `bookings` (Lịch đặt sử dụng xe).*

| Tên Cột | Kiểu Dữ Liệu SQL | Khóa Chính | Khóa Ngoại | Cho Phép Null | Giá Trị Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `CHAR(36)` | PK | Không | Không | UUID v4 | Mã định danh duy nhất của lịch đặt |
| `vehicle_id` | `CHAR(36)` | Không | FK -> vehicles.id | Không | N/A | Mã xe được đặt |
| `user_id` | `CHAR(36)` | Không | FK -> users.id | Không | N/A | Mã thành viên thực hiện đặt xe |
| `start_time` | `TIMESTAMP` | Không | Không | Không | N/A | Thời điểm bắt đầu sử dụng dự kiến |
| `end_time` | `TIMESTAMP` | Không | Không | Không | N/A | Thời điểm kết thúc sử dụng dự kiến |
| `status` | `VARCHAR(30)` | Không | Không | Không | 'CONFIRMED' | Trạng thái (PENDING, CONFIRMED, CANCELLED) |
| `purpose` | `VARCHAR(255)`| Không | Không | Có | NULL | Ghi chú mục đích chuyến đi |
| `created_at` | `TIMESTAMP` | Không | Không | Không | CURRENT_TIMESTAMP | Thời điểm gửi yêu cầu đặt lịch |

*Bảng 4.3. Từ điển dữ liệu bảng `vehicle_energy_inventories` (Kho tồn năng lượng).*

| Tên Cột | Kiểu Dữ Liệu SQL | Khóa Chính | Khóa Ngoại | Cho Phép Null | Giá Trị Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `CHAR(36)` | PK | Không | Không | UUID v4 | Mã định danh kho năng lượng của xe |
| `vehicle_id` | `CHAR(36)` | Không | FK -> vehicles.id | Không | N/A (UNIQUE) | Mỗi xe có duy nhất 1 kho điện |
| `available_energy_kwh`| `DECIMAL(12,3)`| Không | Không | Không | 0.000 | Lượng điện năng khả dụng đang có (kWh) |
| `total_inventory_cost`| `DECIMAL(15,2)`| Không | Không | Không | 0.00 | Tổng giá trị bằng tiền của kho điện (VNĐ) |
| `weighted_avg_cost_per_kwh`| `DECIMAL(10,2)`| Không | Không | Không | 3850.00 | Giá điện bình quân gia quyền (VNĐ/kWh) |
| `total_energy_charged_kwh`| `DECIMAL(12,3)`| Không | Không | Không | 0.000 | Tổng điện nạp lũy kế từ trước đến nay |
| `total_energy_consumed_kwh`| `DECIMAL(12,3)`| Không | Không | Không | 0.000 | Tổng điện đã tiêu thụ cho các chuyến đi |
| `is_reconciliation_required`| `BOOLEAN` | Không | Không | Không | FALSE | Cờ báo hiệu cần nhân viên đối soát giá |

*Bảng 4.4. Từ điển dữ liệu bảng `expenses` (Hóa đơn chi phí phương tiện).*

| Tên Cột | Kiểu Dữ Liệu SQL | Khóa Chính | Khóa Ngoại | Cho Phép Null | Giá Trị Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `CHAR(36)` | PK | Không | Không | UUID v4 | Mã định danh khoản chi |
| `vehicle_id` | `CHAR(36)` | Không | FK -> vehicles.id | Không | N/A | Xe phát sinh chi phí |
| `co_ownership_group_id`| `CHAR(36)` | Không | FK -> co_ownership_groups.id| Có | N/A | Nhóm đồng sở hữu gánh vác chi phí |
| `created_by_user_id`| `CHAR(36)` | Không | FK -> users.id | Không | N/A | Người lập hóa đơn chi phí |
| `responsible_user_id`| `CHAR(36)` | Không | FK -> users.id | Có | NULL | Người chịu trách nhiệm nếu theo cá nhân |
| `amount` | `DECIMAL(15,2)`| Không | Không | Không | N/A | Tổng số tiền chi phí (VNĐ) |
| `category` | `VARCHAR(50)` | Không | Không | Không | N/A | Danh mục (CHARGING, MAINTENANCE...) |
| `allocation_policy` | `VARCHAR(50)` | Không | Không | Không | 'OWNERSHIP_RATIO'| Chính sách chia tiền (USER_RESPONSIBILITY) |
| `status` | `VARCHAR(30)` | Không | Không | Không | 'PENDING' | Trạng thái (PENDING, APPROVED, REJECTED) |

---

## 4.6. THIẾT KẾ SƠ ĐỒ LỚP MIỀN DỮ LIỆU (CLASS DIAGRAMS)

Sơ đồ lớp miền dữ liệu thể hiện các thuộc tính, phương thức và mối liên kết chặt chẽ giữa các lớp đối tượng thực thể trong mã nguồn Java của hệ thống.
*(Xem chi tiết mã nguồn PlantUML tại tệp `diagrams/class/domain_model_overview.puml`).*

Các mối quan hệ cấu trúc then chốt:
1. `CoOwnershipGroup` quan hệ tổng hợp sở hữu ($1 \to N$) với `GroupMember`.
2. Mỗi `GroupMember` sở hữu một hoặc nhiều `OwnershipShare` gắn chặt với một chiếc xe `Vehicle`.
3. `Booking` là gốc kết nối giữa `Vehicle` và `User`, có mối quan hệ $1 \to 1$ chặt chẽ với chuyến đi thực tế `Trip` và biên bản bàn giao `VehicleHandover`.
4. `Expense` chứa danh sách tập hợp các phần bổ chi phí con `ExpenseShare`, mỗi `ExpenseShare` có thể được thanh toán qua nhiều lần bởi các bản ghi `PersonalExpensePayment`.

---

## 4.7. THIẾT KẾ SƠ ĐỒ TUẦN TỰ CÁC LUỒNG NGHIỆP VỤ (SEQUENCE DIAGRAMS)

Các sơ đồ tuần tự được mô hình hóa chi tiết để phản ánh sự tương tác qua lại giữa Người dùng -> Giao diện React/Three.js -> Controller REST -> Service nghiệp vụ -> Repository -> Cơ sở dữ liệu MySQL.

### 4.7.1. Sơ đồ tuần tự Đăng nhập và Xác thực JWT
Mô tả quy trình người dùng gửi thông tin đăng nhập, backend xác thực mật khẩu BCrypt, sinh cặp Token (Access Token JWT + Refresh Token ngẫu nhiên), trả về cho Frontend lưu vào Zustand Store và đính kèm vào các request tiếp theo.
*(Mã nguồn: `diagrams/sequence/seq_login_jwt.puml`).*

### 4.7.2. Sơ đồ tuần tự Đặt lịch và Khử xung đột thời gian
Mô tả chi tiết luồng kiểm tra nghiệp vụ khi Co-Owner yêu cầu đặt xe: kiểm tra thời gian không ở quá khứ, kiểm tra tư cách thành viên, truy vấn `findConflictingBookings` trong DB. Nếu phát hiện trùng lặp, backend ném ngoại lệ và trả về HTTP 400 Bad Request; nếu hợp lệ, lưu bản ghi và cập nhật trực quan trên 3D timeline.
*(Mã nguồn: `diagrams/sequence/seq_booking_creation_conflict.puml`).*

### 4.7.3. Sơ đồ tuần tự Trả xe, Kiểm định và Đối soát Năng lượng
Mô tả quy trình phối hợp giữa Co-Owner gửi yêu cầu trả xe -> Nhân viên kỹ thuật mở biên bản kiểm định -> Đối soát ODO và Pin -> Chốt chuyến đi -> Kích hoạt `VehicleEnergyInventoryService.recordTripConsumption` trừ tồn kho điện -> Tạo tự động khoản nợ tiền điện cá nhân.
*(Mã nguồn: `diagrams/sequence/seq_trip_return_and_inspection.puml`).*

### 4.7.4. Sơ đồ tuần tự Hoàn tất sạc và Cập nhật Tồn kho năng lượng (WAC)
Mô tả quy trình hoàn tất sạc xe: tính toán tổn hao điện vật lý ($10\%$), tính năng lượng nạp thực tế ($90\%$), tính đơn giá bình quân gia quyền mới (WAC), kiểm tra chống nạp trùng lặp (Idempotent Check) và cập nhật bảng `vehicle_energy_inventories`.
*(Mã nguồn: `diagrams/sequence/seq_charging_energy_inventory.puml`).*

---

## 4.8. SƠ ĐỒ HOẠT ĐỘNG PHÂN LÀN CHI TIẾT (SWIMLANE ACTIVITY DIAGRAMS)

Các sơ đồ hoạt động phân làn làm rõ ranh giới trách nhiệm giữa các bên tham gia:
* **Làn Chủ đồng sở hữu (CO_OWNER):** Thực hiện các hành vi yêu cầu dịch vụ (đặt xe, khởi hành, yêu cầu trả xe, nộp tiền).
* **Làn Nhân viên vận hành (STAFF):** Thực hiện các hành vi kiểm định, giám sát vật lý (ký bàn giao, kiểm tra kỹ thuật xe, phê duyệt chứng từ thanh toán).
* **Làn Hệ thống tự động (Backend Engine):** Thực thi các thuật toán kiểm tra tính bất biến, khử xung đột, tính giá WAC và ghi nhật ký giao dịch.

---

## 4.9. THIẾT KẾ SƠ ĐỒ MÁY TRẠNG THÁI (STATE MACHINE DIAGRAMS)

Hệ thống quản lý chặt chẽ vòng đời của các thực thể thông qua các sơ đồ máy trạng thái hữu hạn (Finite State Machines):

1. **Vòng đời Trạng thái Phương tiện (VehicleStatus):**
   * `AVAILABLE`: Xe đang đỗ tại trạm, sẵn sàng phục vụ đặt lịch hoặc nạp sạc.
   * `RESERVED`: Đã có lịch đặt sắp diễn ra hoặc nhân viên đang thực hiện bàn giao.
   * `IN_USE`: Xe đang trong chuyến đi hoạt động thực tế trên đường.
   * `CHARGING`: Xe đang cắm sạc tại trụ sạc thông minh trong garage.
   * `MAINTENANCE`: Xe đang trong diện bảo dưỡng kỹ thuật, khóa toàn bộ việc đặt xe.
   * `DECOMMISSIONED`: Xe đã ngừng khai thác sử dụng.
2. **Vòng đời Lịch Đặt (BookingStatus):**
   * `PENDING` $\to$ `CONFIRMED` $\to$ `COMPLETED` (hoặc `CANCELLED` nếu hủy trước giờ).
3. **Vòng đời Chuyến Đi (TripStatus):**
   * `NOT_STARTED` $\to$ `ACTIVE` $\to$ `RETURN_REQUESTED` $\to$ `COMPLETED`.
4. **Vòng đời Khoản Chi & Thanh Toán (PaymentStatus):**
   * `ALLOCATED` $\to$ `PAYMENT_SUBMITTED` $\to$ `PAYMENT_VERIFIED` $\to$ `SETTLED`.

*(Xem chi tiết mã nguồn tại tệp `diagrams/state-machine/trip_lifecycle.puml`).*

---

## 4.10. THIẾT KẾ RESTFUL API DANH MỤC CHI TIẾT

Hệ thống EVShare 3D cung cấp danh mục API RESTful toàn diện, được nhóm theo 12 phân hệ nghiệp vụ chính:

*Bảng 4.5. Danh mục các Endpoint API RESTful tiêu biểu trong hệ thống EVShare 3D.*

| Phân Hệ | Phương Thức | Đường Dẫn Endpoint | Quyền Hạn (Role) | Request DTO | Response DTO | Mục Đích Nghiệp Vụ |
| :--- | :---: | :--- | :--- | :--- | :--- | :--- |
| **Auth** | `POST` | `/api/auth/login` | Công khai | `LoginRequest` | `AuthResponse` | Đăng nhập hệ thống, cấp Access & Refresh Token |
| **Auth** | `POST` | `/api/auth/refresh` | Công khai | `RefreshTokenRequest` | `AuthResponse` | Cấp mới Access Token khi token cũ hết hạn |
| **Auth** | `POST` | `/api/auth/logout` | Đã đăng nhập | `LogoutRequest` | `ApiResponse` | Đăng xuất và thu hồi Refresh Token trong DB |
| **Vehicle**| `GET` | `/api/vehicles` | Đã đăng nhập | N/A | `List<VehicleResponse>` | Lấy danh sách toàn bộ xe trong garage |
| **Vehicle**| `GET` | `/api/vehicles/{id}` | Đã đăng nhập | N/A | `VehicleResponse` | Lấy chi tiết thông số, pin, ODO của một xe |
| **Booking**| `GET` | `/api/bookings/vehicle/{vehicleId}` | Đã đăng nhập | N/A | `List<BookingResponse>` | Xem lịch đặt của xe theo trục thời gian |
| **Booking**| `POST` | `/api/bookings/vehicle/{vehicleId}` | CO_OWNER | `CreateBookingRequest`| `BookingResponse` | Đặt lịch sử dụng xe (kiểm tra khử xung đột) |
| **Booking**| `POST` | `/api/bookings/{id}/cancel` | Người đặt / ADMIN| N/A | `BookingResponse` | Hủy lịch đặt xe hợp lệ trước giờ khởi hành |
| **Handover**| `POST`| `/api/handovers/booking/{bookingId}/verify` | STAFF / ADMIN | `VerifyHandoverRequest`| `VehicleHandoverResponse`| Nhân viên xác nhận biên bản bàn giao xe |
| **Handover**| `POST`| `/api/handovers/{id}/acknowledge` | CO_OWNER | N/A | `VehicleHandoverResponse`| Co-Owner ký xác nhận hiện trạng xe bàn giao |
| **Trip** | `POST` | `/api/trips/start` | CO_OWNER | `StartTripRequest` | `TripResponse` | Bắt đầu chuyến đi thực tế khi đã đủ điều kiện |
| **Trip** | `POST` | `/api/trips/{id}/extend` | CO_OWNER | `ExtendTripRequest` | `TripResponse` | Yêu cầu gia hạn thêm thời gian sử dụng xe |
| **Trip** | `POST` | `/api/trips/{id}/request-return` | CO_OWNER | `RequestReturnRequest`| `TripResponse` | Gửi yêu cầu trả xe kèm chỉ số ODO và pin |
| **Trip** | `POST` | `/api/trips/{id}/confirm-return` | STAFF / ADMIN | `ConfirmTripReturnRequest`| `TripResponse` | Nhân viên đối soát thực tế và kết thúc chuyến đi |
| **Damage** | `POST` | `/api/damages` | STAFF / CO_OWNER | `CreateDamageRequest` | `DamageRecordResponse` | Ghi nhận hư hỏng mới gắn tọa độ Hotspot 3D |
| **Charging**| `POST`| `/api/charging/sessions/start` | Đã đăng nhập | `StartChargingRequest`| `ChargingSessionResponse`| Cắm sạc và bắt đầu phiên nạp điện tại trụ |
| **Charging**| `POST`| `/api/charging/sessions/{id}/complete`| Đã đăng nhập | N/A | `ChargingSessionResponse`| Hoàn tất sạc, kích hoạt nạp tồn kho năng lượng |
| **Energy** | `GET` | `/api/vehicles/{id}/energy-inventory` | Thành viên nhóm | N/A | `VehicleEnergyInventoryResponse`| Xem tồn kho kWh và giá bình quân gia quyền WAC |
| **Expense**| `POST` | `/api/expenses` | STAFF / ADMIN | `CreateExpenseRequest`| `ExpenseResponse` | Tạo khoản chi phí mới cho xe |
| **Expense**| `POST` | `/api/expenses/{id}/approve` | STAFF / ADMIN | `ExpenseApprovalRequest`| `ExpenseResponse` | Phê duyệt khoản chi và sinh các phân bổ chi phí |
| **Payment**| `POST` | `/api/expenses/{expenseId}/personal-payments`| CO_OWNER | `PersonalPaymentSubmitRequest`| `PersonalExpensePaymentResponse`| Gửi chứng từ thanh toán nợ cá nhân (DEMO) |
| **Payment**| `POST` | `/api/personal-payments/{id}/verify` | STAFF / ADMIN | `PersonalPaymentVerifyRequest`| `PersonalExpensePaymentResponse`| Nhân viên phê duyệt xác nhận đã nhận tiền |
| **Contract**| `POST`| `/api/contracts/{id}/accept` | CO_OWNER | `ContractAcceptanceRequest`| `ContractAcceptanceResponse`| Ký kết chấp thuận hợp đồng đồng sở hữu DEMO |
| **Voting** | `POST` | `/api/voting/proposals` | Thành viên nhóm | `CreateVoteProposalRequest`| `VoteProposalResponse`| Tạo đề xuất biểu quyết tập thể trong nhóm |
| **Voting** | `POST` | `/api/voting/proposals/{id}/vote` | Thành viên nhóm | `CastProposalVoteRequest`| `VoteProposalResponse`| Bỏ phiếu đồng ý hoặc từ chối đề xuất |
| **Dispute**| `POST` | `/api/disputes` | Đã đăng nhập | `CreateDisputeRequest`| `DisputeResponse` | Mở hồ sơ khiếu nại tranh chấp sự cố |

---

## 4.11. THIẾT KẾ BẢO MẬT VÀ TOÀN VẸN HỆ THỐNG

Kiến trúc an toàn thông tin của EVShare 3D được thiết lập theo mô hình phòng thủ nhiều lớp (Defense-in-Depth):
1. **Lớp Lọc Ngoại Vi (Perimeter Filtering):** Cấu hình CORS chặt chẽ tại Spring Security, chỉ cho phép các yêu cầu xuất phát từ các nguồn gốc đáng tin cậy (Trusted Origins). Vô hiệu hóa HTTP Basic Auth và CSRF token do ứng dụng sử dụng cơ chế xác thực Token phi trạng thái.
2. **Lớp Xác Thực & Phân Quyền (Authentication & RBAC):** Mọi endpoint nghiệp vụ (ngoại trừ `/api/auth/**` và tài nguyên tĩnh) đều bắt buộc phải có Bearer Token JWT hợp lệ. Các phương thức nghiệp vụ nhạy cảm được bảo vệ bởi `@PreAuthorize("hasRole('STAFF')")` hoặc `@PreAuthorize("hasRole('ADMIN')")`.
3. **Lớp Kiểm Soát Sở Hữu Dữ Liệu (Data Ownership Authorization):** Tại tầng Service, hệ thống kiểm tra logic chặt chẽ: Co-Owner chỉ được phép xem thông tin, đặt xe và bỏ phiếu cho những chiếc xe thuộc nhóm mà mình là thành viên hoạt động (`isUserActiveMemberForVehicle`).
4. **Lớp Chống Tấn Công Dữ Liệu Đầu Vào (Input Sanitization):** Sử dụng Jakarta Bean Validation (`@NotBlank`, `@Size`, `@Pattern`) để kiểm tra dữ liệu đầu vào; Hibernate ORM sử dụng Prepared Statement tham số hóa 100% các câu truy vấn, loại bỏ hoàn toàn nguy cơ SQL Injection.
5. **Lớp Kiểm Soát Kiểm Toán (Audit Trail):** Mọi hành động quan trọng (đổi quyền người dùng, chuyển nhượng cổ phần, giải quyết tranh chấp) đều được tự động lưu vết vào bảng `audit_logs` với đầy đủ thông tin về tác nhân, địa chỉ IP, hành vi và thời điểm thực thi.

---

## 4.12. THIẾT KẾ GIAO DIỆN VÀ KHÔNG GIAN VIRTUAL GARAGE 3D

Giao diện của EVShare 3D được thiết kế theo trường phái tương tác không gian viễn tưởng hiện đại (Cyberpunk / Sci-Fi Spatial UI):
* **Bảng màu chủ đạo:** Nền tối sâu thẳm (`#050811`, `#071426`) kết hợp với ánh sáng phát quang màu xanh lơ (`#00f2fe`, `#38bdf8`) và vàng cam cảnh báo (`#f59e0b`), tạo độ tương phản cao và làm nổi bật mô hình xe 3D.
* **Bục Trưng Bày Phương Tiện (Vehicle Pedestals):** Các xe trong đội xe được bố trí trên các bục xoay tròn phát sáng. Khi người dùng chọn xe, camera sẽ thực hiện hiệu ứng chuyển động mượt mà (Camera Tweening) lướt đến vị trí bục của chiếc xe đó.
* **Tương Tác Chọn Đối Tượng (Object Picking via Raycasting):** Người dùng có thể nhấp chuột trực tiếp lên các bộ phận của xe (cửa xe, nắp capo, bánh xe) để mở panel bóc tách thông số kỹ thuật hoặc nhấp vào các điểm cảnh báo hư hại (Damage Hotspot) để xem biên bản va chạm.
* **Chế Độ X-Ray Kiểm Tra Pin:** Khi kích hoạt, lớp vật liệu vỏ ngoài của xe chuyển sang trạng thái bán trong suốt (độ mờ đục 25%), hiển thị khối pin phát sáng đa sắc màu bên trong khung gầm xe, phản ánh trực quan trạng thái sức khỏe pin (SOH) và dung lượng pin hiện tại (SOC).

---

## 4.13. THIẾT KẾ SƠ ĐỒ TRIỂN KHAI PHẦN CỨNG VÀ MÁY CHỦ (DEPLOYMENT DIAGRAM)

Sơ đồ triển khai hệ thống phản ánh cấu trúc vật lý của hệ thống trên môi trường máy chủ:
* **Máy Khách (Client Node):** Thiết bị máy tính của người dùng chạy trình duyệt Web hiện đại hỗ trợ WebGL 2.0 (Google Chrome, Microsoft Edge). Trình duyệt tải về gói tĩnh Frontend (HTML, CSS, JavaScript, tệp GLB) và thực thi hoàn toàn trên GPU/CPU máy khách.
* **Máy Chủ Dịch Vụ Ứng Dụng (Application Host Server):**
  * Chạy trên nền tảng Linux hoặc Windows Server với máy ảo Java 21 LTS.
  * Ứng dụng Backend được đóng gói thành một tệp thực thi duy nhất `evshare-backend.jar`, chạy trên máy chủ Web nhúng Tomcat tại cổng `8080`.
  * Có thể thiết lập Reverse Proxy Nginx ở phía trước để tiếp nhận kết nối HTTPS (cổng 443), xử lý chứng chỉ số SSL và điều hướng yêu cầu API vào Tomcat.
* **Máy Chủ Cơ Sở Dữ Liệu (Database Server):**
  * Hệ quản trị MySQL 8.0 lắng nghe tại cổng `3306`, quản lý vùng lưu trữ dữ liệu `evshare3d` trên ổ cứng SSD tốc độ cao.
  * Kết nối giữa Spring Boot và MySQL được duy trì qua hồ kết nối (Connection Pool) HikariCP với cấu hình tối ưu độ trễ.

*(Xem chi tiết mã nguồn sơ đồ PlantUML tại tệp `diagrams/deployment/system_deployment_diagram.puml`).*

---

## 4.14. MA TRẬN TRUY XUẤT NGUỒN GỐC YÊU CẦU (REQUIREMENTS TRACEABILITY MATRIX)

Bảng 4.6 dưới đây thể hiện ma trận liên kết truy xuất hai chiều (Bidirectional Traceability) giữa Yêu cầu chức năng -> Use Case -> Quy tắc nghiệp vụ -> Giao diện UI -> Endpoint API -> Service Backend -> Thực thể JPA -> Ca kiểm thử (Test Case).

*Bảng 4.6. Ma trận truy xuất nguồn gốc yêu cầu của hệ thống EVShare 3D.*

| Mã Yêu Cầu | Mã Use Case | Mã Quy Tắc | Giao Diện Frontend | Endpoint API REST | Service Backend | Thực Thể CSDL (JPA) | Mã Test Case |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **FR-AUTH-01** | UC-AUTH-01 | N/A | `AuthScene.tsx` | `POST /api/auth/login` | `AuthService` | `User`, `RefreshToken` | TC-AUTH-01 |
| **FR-BOOK-01** | UC-BOOK-01 | BR-04, 05 | `CoOwnerBookingPanel.tsx` | `POST /api/bookings/vehicle/{id}`| `BookingService` | `Booking`, `Vehicle` | TC-BOOK-01 |
| **FR-HAND-01** | UC-HAND-01 | BR-07 | `StaffHandoverModal.tsx` | `POST /api/handovers/.../verify` | `VehicleHandoverService` | `VehicleHandover` | TC-HAND-01 |
| **FR-TRIP-01** | UC-TRIP-01 | BR-08, 09 | `CoOwnerTripStartPanel.tsx` | `POST /api/trips/start` | `TripService` | `Trip`, `Booking` | TC-TRIP-01 |
| **FR-TRIP-03** | UC-TRIP-02 | BR-11 | `StaffReturnInspectionModal.tsx`| `POST /api/trips/{id}/confirm-return`| `TripService` | `Trip`, `VehicleInspection` | TC-TRIP-09 |
| **FR-DAMG-01** | UC-DAMG-01 | N/A | `DamageHotspotMarker.tsx` | `POST /api/damages` | `DamageService` | `DamageRecord` | TC-DAMG-01 |
| **FR-CHARGE-01**| UC-CHRG-01 | BR-12 | `ChargingPanel.tsx` | `POST /api/charging/sessions/...`| `ChargingSessionService` | `ChargingSession` | TC-CHRG-01 |
| **FR-ENERGY-01**| UC-ENER-01 | BR-13, 14 | `FinanceZonePanel.tsx` | `GET /api/vehicles/{id}/energy-...` | `VehicleEnergyInventoryService` | `VehicleEnergyInventory` | TC-ENER-02 |
| **FR-FIN-01** | UC-FIN-01 | BR-15, 16 | `FinanceZonePanel.tsx` | `POST /api/expenses/{id}/approve` | `ExpenseShareService` | `Expense`, `ExpenseShare` | TC-FIN-01 |
| **FR-FIN-02** | UC-FIN-02 | BR-17 | `StaffPaymentVerificationModal.tsx`| `POST /api/personal-payments/...` | `PersonalPaymentService` | `PersonalExpensePayment` | TC-FIN-06 |
| **FR-OWN-01** | UC-OWN-01 | BR-01 | `CoOwnerOwnershipPanel.tsx` | `POST /api/co-ownership/groups` | `CoOwnershipService` | `OwnershipShare` | TC-OWN-01 |
| **FR-CON-01** | UC-CON-01 | BR-19 | `CoOwnerContractPanel.tsx` | `POST /api/contracts/{id}/accept`| `CoOwnershipContractService` | `ContractAcceptance` | TC-CON-02 |
| **FR-VOTE-01** | UC-VOTE-01 | BR-20 | `CoOwnerVotingPanel.tsx` | `POST /api/voting/proposals` | `VoteProposalService` | `VoteProposal`, `ProposalVote`| TC-VOTE-01 |

---

### TÓM TẮT CHƯƠNG 4
Chương 4 đã trình bày thiết kế kiến trúc kỹ thuật toàn diện của hệ thống EVShare 3D. Kiến trúc phân tầng doanh nghiệp kết hợp với không gian giao diện 3D Spatial UI đã tạo nên một cấu trúc phần mềm có độ tin cậy và khả năng mở rộng vượt trội. Lược đồ cơ sở dữ liệu 46 bảng được chuẩn hóa, hệ thống từ điển dữ liệu chi tiết, các sơ đồ lớp, sơ đồ tuần tự và danh mục API RESTful được thiết kế chuẩn xác đến từng thuộc tính và mã trạng thái. Toàn bộ các thiết kế này là kim chỉ nam trực tiếp định hình nên quá trình xây dựng và hiện thực hóa hệ thống trong Chương 5.
