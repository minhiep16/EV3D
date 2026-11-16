# PHẦN PHỤ LỤC TÀI LIỆU (APPENDICES)

---

## PHỤ LỤC A: DANH MỤC API RESTFUL TOÀN HỆ THỐNG

Dưới đây là danh mục tổng hợp toàn bộ 27 Controller và các Endpoint API RESTful chính thức của hệ thống EVShare 3D:

| STT | Phân Hệ | Phương Thức | Đường Dẫn Endpoint | Vai Trò (Role) | Chức Năng Nghiệp Vụ |
| :---: | :--- | :---: | :--- | :--- | :--- |
| 1 | **Auth** | `POST` | `/api/auth/login` | Public | Đăng nhập hệ thống, trả về cặp Token (Access + Refresh) |
| 2 | **Auth** | `POST` | `/api/auth/refresh` | Public | Cấp mới Access Token khi token cũ hết hạn |
| 3 | **Auth** | `POST` | `/api/auth/logout` | Authenticated | Đăng xuất và thu hồi Refresh Token trong DB |
| 4 | **Admin** | `GET` | `/api/admin/stats` | ADMIN | Lấy thống kê tổng thể toàn hệ thống (xe, người dùng, cuốc xe) |
| 5 | **Admin** | `GET` | `/api/admin/users` | ADMIN | Tra cứu danh sách toàn bộ người dùng trong hệ thống |
| 6 | **Admin** | `PUT` | `/api/admin/users/{id}/role` | ADMIN | Phân quyền vai trò mới cho người dùng |
| 7 | **Vehicle** | `GET` | `/api/vehicles` | Authenticated | Lấy danh sách toàn bộ xe trong garage |
| 8 | **Vehicle** | `GET` | `/api/vehicles/{id}` | Authenticated | Lấy chi tiết thông số kỹ thuật, pin và ODO xe |
| 9 | **Battery** | `GET` | `/api/vehicles/{id}/battery-health` | Authenticated | Lấy dữ liệu sức khỏe pin (SOH, cell voltage, chu kỳ sạc) |
| 10 | **Booking** | `GET` | `/api/bookings/vehicle/{vehicleId}` | Authenticated | Xem danh sách các lịch đặt của xe theo trục thời gian |
| 11 | **Booking** | `POST` | `/api/bookings/vehicle/{vehicleId}` | CO_OWNER | Đăng ký lịch đặt xe mới (tự động khử xung đột) |
| 12 | **Booking** | `POST` | `/api/bookings/{id}/cancel` | Owner / ADMIN | Hủy lịch đặt xe hợp lệ trước giờ bắt đầu |
| 13 | **Handover** | `POST` | `/api/handovers/booking/{bookingId}/verify` | STAFF / ADMIN | Nhân viên xác nhận biên bản bàn giao xe kỹ thuật |
| 14 | **Handover** | `POST` | `/api/handovers/{id}/acknowledge` | CO_OWNER | Co-Owner ký nhận hiện trạng xe bàn giao |
| 15 | **Trip** | `POST` | `/api/trips/start` | CO_OWNER | Bắt đầu chuyến đi thực tế (xe chuyển IN_USE) |
| 16 | **Trip** | `POST` | `/api/trips/{id}/extend` | CO_OWNER | Yêu cầu gia hạn thêm thời gian sử dụng chuyến đi |
| 17 | **Trip** | `POST` | `/api/trips/{id}/request-return` | CO_OWNER | Gửi yêu cầu trả xe kèm thông số ODO và Pin kết thúc |
| 18 | **Trip** | `POST` | `/api/trips/{id}/confirm-return` | STAFF / ADMIN | Nhân viên đối soát thực tế và xác nhận hoàn tất trả xe |
| 19 | **Inspection** | `POST` | `/api/inspections` | STAFF / ADMIN | Lưu biên bản kiểm tra kỹ thuật (Checklist lốp, phanh, đèn) |
| 20 | **Damage** | `POST` | `/api/damages` | STAFF / CO_OWNER | Ghi nhận vết hư hại mới gắn tọa độ Hotspot 3D |
| 21 | **Damage** | `GET` | `/api/damages/vehicle/{vehicleId}` | Authenticated | Lấy danh sách toàn bộ vết hư hại của xe |
| 22 | **Maintenance** | `POST` | `/api/maintenance` | CO_OWNER / STAFF | Tạo yêu cầu bảo dưỡng kỹ thuật cho phương tiện |
| 23 | **Maintenance** | `POST` | `/api/maintenance/{id}/approve` | CO_OWNER | Biểu quyết thông qua gói chi phí bảo dưỡng |
| 24 | **Maintenance** | `POST` | `/api/maintenance/{id}/complete` | STAFF / ADMIN | Hoàn tất bảo dưỡng, đưa xe trở lại sẵn sàng hoạt động |
| 25 | **Charging** | `POST` | `/api/charging/sessions/start` | Authenticated | Bắt đầu phiên sạc nạp điện tại trụ thông minh |
| 26 | **Charging** | `POST` | `/api/charging/sessions/{id}/complete`| Authenticated | Hoàn tất phiên sạc, kích hoạt nạp kho năng lượng |
| 27 | **Energy** | `GET` | `/api/vehicles/{id}/energy-inventory` | Thành viên xe | Xem tồn kho kWh và giá bình quân gia quyền WAC |
| 28 | **Energy** | `GET` | `/api/vehicles/{id}/energy-transactions`| Thành viên xe | Xem lịch sử các giao dịch xuất nhập kho điện |
| 29 | **Expense** | `POST` | `/api/expenses` | STAFF / ADMIN | Lập hóa đơn chi phí mới cho xe |
| 30 | **Expense** | `POST` | `/api/expenses/{id}/approve` | STAFF / ADMIN | Phê duyệt khoản chi và sinh các phân bổ chi phí |
| 31 | **Expense** | `GET` | `/api/expenses/vehicle/{vehicleId}/summary`| Thành viên xe | Lấy bảng tổng hợp phân bổ chi phí của xe |
| 32 | **Payment** | `POST` | `/api/expenses/{expenseId}/personal-payments` | CO_OWNER | Gửi thông tin thanh toán nợ cá nhân (DEMO Payment) |
| 33 | **Payment** | `POST` | `/api/personal-payments/{id}/verify` | STAFF / ADMIN | Nhân viên phê duyệt xác minh đã nhận tiền thanh toán |
| 34 | **Ownership** | `GET` | `/api/co-ownership/groups` | Authenticated | Lấy danh sách các nhóm đồng sở hữu xe |
| 35 | **Ownership** | `POST` | `/api/co-ownership/transfers` | CO_OWNER | Tạo yêu cầu chuyển nhượng tỷ lệ sở hữu |
| 36 | **Ownership** | `POST` | `/api/co-ownership/invitations` | Leader nhóm | Gửi lời mời kết nạp thành viên mới vào nhóm |
| 37 | **Contract** | `GET` | `/api/contracts/vehicle/{vehicleId}/active` | Thành viên nhóm | Xem phiên bản hợp đồng đồng sở hữu đang có hiệu lực |
| 38 | **Contract** | `POST` | `/api/contracts/{id}/accept` | CO_OWNER | Ký kết chấp thuận hợp đồng số mô phỏng (DEMO Signature) |
| 39 | **Voting** | `POST` | `/api/voting/proposals` | Thành viên nhóm | Tạo đề xuất biểu quyết dân chủ trong nhóm |
| 40 | **Voting** | `POST` | `/api/voting/proposals/{id}/vote` | Thành viên nhóm | Bỏ phiếu đồng ý hoặc từ chối đề xuất biểu quyết |
| 41 | **Dispute** | `POST` | `/api/disputes` | Authenticated | Mở hồ sơ khiếu nại tranh chấp sự cố |
| 42 | **Dispute** | `POST` | `/api/disputes/{id}/investigate` | STAFF / ADMIN | Ghi nhận kết luận điều tra và phương án hòa giải |
| 43 | **Dispute** | `POST` | `/api/disputes/{id}/compensation/demo-pay`| STAFF / ADMIN | Thực thi bồi thường thiệt hại mô phỏng (DEMO Compensation) |
| 44 | **Notification** | `GET` | `/api/notifications` | Authenticated | Lấy danh sách các thông báo không gian của người dùng |
| 45 | **AI Assistant** | `POST` | `/api/ai/ask` | Authenticated | Hỏi đáp trợ lý ảo thông minh về quy chế và kỹ thuật xe |

---

## PHỤ LỤC B: TỪ ĐIỂN DỮ LIỆU CƠ SỞ DỮ LIỆU CHI TIẾT (BỔ SUNG)

*Bảng B.1. Từ điển dữ liệu bảng `trips` (Quản lý chu trình di chuyển thực tế).*

| Tên Cột | Kiểu Dữ Liệu SQL | Khóa Chính | Khóa Ngoại | Cho Phép Null | Giá Trị Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `CHAR(36)` | PK | Không | Không | UUID v4 | Mã định danh duy nhất chuyến đi |
| `booking_id` | `CHAR(36)` | Không | FK -> bookings.id | Không | N/A (UNIQUE) | Liên kết 1-1 với lịch đặt xe |
| `vehicle_id` | `CHAR(36)` | Không | FK -> vehicles.id | Không | N/A | Xe được sử dụng trong chuyến đi |
| `user_id` | `CHAR(36)` | Không | FK -> users.id | Không | N/A | Người lái xe trực tiếp |
| `started_at` | `TIMESTAMP` | Không | Không | Không | N/A | Thời điểm thực tế bấm bắt đầu đi |
| `ended_at` | `TIMESTAMP` | Không | Không | Có | NULL | Thời điểm thực tế kết thúc chuyến đi |
| `start_odometer` | `DECIMAL(10,2)`| Không | Không | Không | N/A | Số km đồng hồ lúc xuất phát |
| `end_odometer` | `DECIMAL(10,2)`| Không | Không | Có | NULL | Số km đồng hồ lúc trả xe |
| `start_battery_level`| `INT` | Không | Không | Không | N/A | Tỷ lệ pin lúc xuất phát (SOC %) |
| `end_battery_level` | `INT` | Không | Không | Có | NULL | Tỷ lệ pin lúc trả xe (SOC %) |
| `energy_consumed_kwh`| `DECIMAL(8,3)` | Không | Không | Có | NULL | Lượng điện thực tế đã tiêu thụ (kWh) |
| `status` | `VARCHAR(30)` | Không | Không | Không | 'ACTIVE' | Trạng thái (ACTIVE, COMPLETED) |
| `return_requested_at`| `TIMESTAMP` | Không | Không | Có | NULL | Thời điểm Co-Owner yêu cầu trả |
| `return_verified_by_user_id`| `CHAR(36)`| Không | FK -> users.id | Có | NULL | Nhân viên kiểm tra và chốt chuyến đi |

*Bảng B.2. Từ điển dữ liệu bảng `damage_records` (Bản đồ hóa hư hỏng 3D).*

| Tên Cột | Kiểu Dữ Liệu SQL | Khóa Chính | Khóa Ngoại | Cho Phép Null | Giá Trị Mặc Định | Ý Nghĩa Nghiệp Vụ |
| :--- | :--- | :---: | :---: | :---: | :--- | :--- |
| `id` | `CHAR(36)` | PK | Không | Không | UUID v4 | Mã định danh vết hư hại |
| `vehicle_id` | `CHAR(36)` | Không | FK -> vehicles.id | Không | N/A | Xe bị va quẹt, hư hỏng |
| `part_code` | `VARCHAR(50)` | Không | Không | Không | N/A | Mã bộ phận (FRONT_BUMPER, DOOR_FL...) |
| `severity` | `VARCHAR(20)` | Không | Không | Không | 'LOW' | Mức độ nghiêm trọng (LOW, MEDIUM, HIGH) |
| `description` | `VARCHAR(500)`| Không | Không | Không | N/A | Mô tả chi tiết vết xước / va đập |
| `hotspot_x` | `DECIMAL(8,4)` | Không | Không | Có | NULL | Tọa độ không gian trục X trên mô hình 3D |
| `hotspot_y` | `DECIMAL(8,4)` | Không | Không | Có | NULL | Tọa độ không gian trục Y trên mô hình 3D |
| `hotspot_z` | `DECIMAL(8,4)` | Không | Không | Có | NULL | Tọa độ không gian trục Z trên mô hình 3D |
| `status` | `VARCHAR(30)` | Không | Không | Không | 'REPORTED' | Trạng thái (REPORTED, IN_PROGRESS, RESOLVED) |
| `reported_by_user_id`| `CHAR(36)`| Không | FK -> users.id | Không | N/A | Người ghi nhận vết hư hại |

---

## PHỤ LỤC E: TRÍCH ĐOẠN MÃ NGUỒN TIÊU BIỂU CỦA CÁC THUẬT TOÁN LÕI

### E.1. Thuật toán kiểm tra và ngăn chặn xung đột lịch đặt (`BookingService.java`)
```java
// Mã nguồn tại: backend/src/main/java/com/evshare/booking/service/BookingService.java
@Transactional
public BookingResponse createBooking(UUID vehicleId, UUID userId, CreateBookingRequest request) {
    if (!request.getStartTime().isBefore(request.getEndTime())) {
        throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
    }
    if (request.getStartTime().isBefore(Instant.now().minusSeconds(120))) {
        throw new IllegalArgumentException("Không thể đặt xe trong quá khứ.");
    }

    Vehicle vehicle = vehicleRepository.findById(vehicleId)
            .orElseThrow(() -> new ResourceNotFoundException("Xe không tồn tại: " + vehicleId));
    User user = userRepository.findById(userId)
            .orElseThrow(() -> new ResourceNotFoundException("Người dùng không tồn tại: " + userId));

    if (user.getRole() == Role.CO_OWNER && coOwnershipService != null) {
        if (!coOwnershipService.isUserActiveMemberForVehicle(userId, vehicleId)) {
            throw new AccessDeniedException("Bạn không phải là thành viên hoạt động của nhóm đồng sở hữu xe này.");
        }
    }

    if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
        throw new IllegalArgumentException("Xe đang trong quá trình bảo dưỡng, không thể đặt lịch mới.");
    }

    List<Booking> conflicts = bookingRepository.findConflictingBookings(
            vehicleId, request.getStartTime(), request.getEndTime(), ACTIVE_STATUSES);

    if (!conflicts.isEmpty()) {
        log.warn("Booking conflict detected for vehicle {} between {} and {}", vehicleId, request.getStartTime(), request.getEndTime());
        throw new IllegalArgumentException("Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.");
    }

    Booking booking = new Booking(UUID.randomUUID(), vehicle, user, request.getStartTime(), request.getEndTime(),
            BookingStatus.CONFIRMED, request.getPurpose());
    return BookingResponse.fromEntity(bookingRepository.save(booking));
}
```

### E.2. Thuật toán cập nhật giá bình quân gia quyền năng lượng WAC (`VehicleEnergyInventoryService.java`)
```java
// Mã nguồn tại: backend/src/main/java/com/evshare/energy/service/VehicleEnergyInventoryService.java
@Transactional
public VehicleEnergyInventory recordChargingSessionCompletion(ChargingSession session) {
    if (session == null || session.getVehicle() == null) return null;

    // Idempotency: Ngăn chặn hạch toán kho điện trùng lặp hai lần
    if (transactionRepository.existsBySourceReferenceIdAndTransactionType(session.getId(), EnergyTransactionType.CHARGING_INFLOW)) {
        log.info("Charging session {} already accounted. Skipping duplicate inflow.", session.getId());
        return inventoryRepository.findByVehicleId(session.getVehicle().getId()).orElse(null);
    }

    Vehicle vehicle = session.getVehicle();
    VehicleEnergyInventory inventory = getOrCreateInventory(vehicle);

    BigDecimal deliveredEnergy = session.getEnergyDeliveredKwh() != null ? session.getEnergyDeliveredKwh() : BigDecimal.ZERO;
    BigDecimal tariff = (session.getChargingStation() != null && session.getChargingStation().getPricePerKwh() != null)
            ? session.getChargingStation().getPricePerKwh() : DEFAULT_ELECTRICITY_TARIFF_VND;

    // Tính toán tổn hao nạp sạc vật lý (hiệu suất 90%)
    BigDecimal storedEnergy = deliveredEnergy.multiply(ChargingProgressService.CHARGING_EFFICIENCY).setScale(3, RoundingMode.HALF_UP);
    BigDecimal energyLoss = deliveredEnergy.subtract(storedEnergy).max(BigDecimal.ZERO).setScale(3, RoundingMode.HALF_UP);

    BigDecimal prevValue = inventory.getTotalInventoryCost();
    BigDecimal prevEnergy = inventory.getAvailableEnergyKwh();
    BigDecimal energyValueToAdd = storedEnergy.multiply(tariff).setScale(2, RoundingMode.HALF_UP);

    BigDecimal newValue = prevValue.add(energyValueToAdd).max(BigDecimal.ZERO);
    BigDecimal newEnergy = prevEnergy.add(storedEnergy).max(BigDecimal.ZERO);

    // Công thức tính giá bình quân gia quyền (WAC)
    BigDecimal newAvgCost = newEnergy.compareTo(BigDecimal.ZERO) > 0
            ? newValue.divide(newEnergy, 2, RoundingMode.HALF_UP)
            : tariff;

    inventory.setAvailableEnergyKwh(newEnergy);
    inventory.setTotalInventoryCost(newValue);
    inventory.setWeightedAverageCostPerKwh(newAvgCost);
    inventory.setTotalEnergyChargedKwh(inventory.getTotalEnergyChargedKwh().add(deliveredEnergy));
    inventory.setLastChargingSessionId(session.getId());

    return inventoryRepository.save(inventory);
}
```

---

## PHỤ LỤC F: HƯỚNG DẪN CÀI ĐẶT VÀ THIẾT LẬP HỆ THỐNG

### F.1. Yêu cầu môi trường tiền đề (Prerequisites)
1. **Java Development Kit:** Cài đặt OpenJDK 21 LTS trở lên, cấu hình biến môi trường `JAVA_HOME`.
2. **Node.js & npm:** Cài đặt Node.js phiên bản v20.x LTS trở lên.
3. **Apache Maven:** Cài đặt Maven 3.9+ (hoặc sử dụng tệp `mvnw` đi kèm).
4. **Hệ quản trị CSDL:** Cài đặt MySQL Community Server 8.0+.

### F.2. Các bước thiết lập cơ sở dữ liệu (Database Setup)
Khởi động dịch vụ MySQL và thực thi các lệnh tạo cơ sở dữ liệu và người dùng:
```sql
CREATE DATABASE IF NOT EXISTS evshare3d CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'evuser'@'localhost' IDENTIFIED BY 'evpassword';
GRANT ALL PRIVILEGES ON evshare3d.* TO 'evuser'@'localhost';
FLUSH PRIVILEGES;
```

### F.3. Khởi chạy máy chủ Backend (Spring Boot)
Mở cửa sổ dòng lệnh tại thư mục `backend/` và thực thi:
```bash
cd D:\EV3D\backend
# Khởi chạy máy chủ phát triển
mvn spring-boot:run
```
Máy chủ backend sẽ tự động áp dụng 46 bản di chuyển Flyway và lắng nghe tại địa chỉ: `http://localhost:8080`.
Kiểm tra sức khỏe hệ thống: `http://localhost:8080/api/health`.

### F.4. Khởi chạy giao diện Frontend (React + Vite)
Mở cửa sổ dòng lệnh thứ hai tại thư mục `frontend/` và thực thi:
```bash
cd D:\EV3D\frontend
# Cài đặt các gói phụ thuộc
npm install
# Khởi chạy máy chủ phát triển Vite
npm run dev
```
Trình duyệt sẽ mở ứng dụng tại địa chỉ: `http://localhost:5173`.

---

## PHỤ LỤC G: HƯỚNG DẪN THAO TÁC NGƯỜI DÙNG - QUẢN TRỊ VIÊN (ADMIN)

1. **Đăng nhập hệ thống:** Truy cập `http://localhost:5173/login`, nhập tài khoản Quản trị viên: `admin@evshare.com` / `Password@123`.
2. **Truy cập Trung tâm chỉ huy Admin:** Trên giao diện 3D, nhấp vào biểu tượng Khiên quản trị (Admin Center) trên thanh HUD trên cùng.
3. **Quản lý người dùng:** Chọn tab "Người Dùng", tìm kiếm theo email, nhấp nút "Đổi Vai Trò" để phân quyền STAFF hoặc CO_OWNER cho tài khoản tương ứng.
4. **Quản lý Nhóm đồng sở hữu:** Chọn tab "Nhóm Xe", xem cơ cấu phân bổ tỷ lệ sở hữu của các thành viên trên biểu đồ hình quạt, kiểm tra tính toàn vẹn 100% của nhóm.
5. **Xem Báo cáo phân tích:** Chọn tab "Thống Kê", xem các biểu đồ phân tích về tần suất sử dụng xe và lượng điện năng tiêu thụ toàn hệ thống.

---

## PHỤ LỤC H: HƯỚNG DẪN THAO TÁC NGƯỜI DÙNG - NHÂN VIÊN VẬN HÀNH (STAFF)

1. **Đăng nhập:** Đăng nhập tài khoản Nhân viên: `staff1@evshare.com` / `Password@123`.
2. **Điều hướng đội xe:** Sử dụng danh sách xe bên tay trái màn hình (`StaffGarageFleetSidebar`) để lọc và chuyển đổi nhanh giữa các xe trong bãi.
3. **Thực hiện bàn giao xe:** Khi có lịch đặt xe sắp diễn ra, mở `StaffHandoverModal`, nhập chỉ số ODO thực tế và % pin tại trạm, nhấn "Xác Nhận Bàn Giao".
4. **Kiểm tra kỹ thuật lúc trả xe:** Khi chuyến đi hoàn tất yêu cầu trả, mở `StaffReturnInspectionModal`, tích chọn các mục kiểm định đạt chuẩn, chụp ảnh và gắn điểm 3D Hotspot nếu phát hiện trầy xước, nhấn "Hoàn Tất Trả Xe".
5. **Xác minh thanh toán:** Mở `StaffPaymentVerificationModal`, đối chiếu danh sách các khoản nợ đã được Co-Owner chuyển khoản DEMO, bấm "Phê Duyệt" để tất toán nghĩa vụ.

---

## PHỤ LỤC I: HƯỚNG DẪN THAO TÁC NGƯỜI DÙNG - CHỦ ĐỒNG SỞ HỮU (CO_OWNER)

1. **Đăng nhập:** Đăng nhập tài khoản Thành viên: `owner1@evshare.com` / `Password@123`.
2. **Khám phá xe trong Garage 3D:** Sử dụng chuột để xoay quanh xe, phóng to chi tiết. Bấm nút "Khám Phá" trên thanh công cụ đáy màn hình để bóc tách từng cánh cửa, nắp capo. Bấm nút "X-Ray Pin" để nhìn xuyên cấu trúc khối pin phát sáng.
3. **Đặt lịch xe:** Bấm nút "Đặt Lịch", chọn khoảng ngày giờ dự kiến trên trục thời gian, nhập lý do và bấm "Xác Nhận". Hệ thống sẽ khóa khung giờ và hiển thị lịch trực quan.
4. **Bắt đầu và kết thúc chuyến đi:** Khi đến giờ sử dụng và nhân viên đã bàn giao xe, bấm "Bắt Đầu Chuyến Đi". Khi hoàn thành chuyến đi, đỗ xe tại trạm, bấm "Yêu Cầu Trả Xe", nhập chỉ số ODO và pin lúc dừng để nhân viên ra kiểm tra.
5. **Xem tồn kho điện và thanh toán:** Di chuyển camera đến Khu vực Tài chính (Finance Zone), xem số kWh pin còn lại và đơn giá bình quân WAC. Bấm "Thanh Toán" để gửi thông tin chuyển khoản DEMO cho chuyến đi vừa thực hiện.

---

## PHỤ LỤC J: BẢNG KIỂM KÊ TOÀN BỘ SƠ ĐỒ THIẾT KẾ HỆ THỐNG

Hồ sơ thiết kế hệ thống EVShare 3D sở hữu hệ thống sơ đồ UML và kiến trúc chuẩn mực được lưu trữ tại `docs/graduation-internship-report/diagrams/`:

| STT | Mã Sơ Đồ | Tên Sơ Đồ Thiết Kế Kỹ Thuật | Phân Loại Chuẩn | Tệp Nguồn Sơ Đồ |
| :---: | :--- | :--- | :---: | :--- |
| 1 | **ARCH-01** | Kiến trúc tổng thể hệ thống Full-Stack 3D | Architecture | `architecture/overall_system_architecture.puml` |
| 2 | **ARCH-02** | Kiến trúc phân tầng Backend Spring Boot | Architecture | `architecture/backend_layered_architecture.puml` |
| 3 | **ARCH-03** | Kiến trúc bảo mật, chuỗi lọc JWT & RBAC | Architecture | `architecture/security_jwt_architecture.puml` |
| 4 | **ARCH-04** | Chu trình kết xuất đồ họa WebGL Three.js | Architecture | `architecture/threejs_rendering_pipeline.puml` |
| 5 | **UC-ALL** | Sơ đồ Use Case tổng quát toàn hệ thống | Use Case | `use-case/overall_system_usecase.puml` |
| 6 | **ACT-01** | Quy trình hoạt động nghiệp vụ Đặt lịch xe | Activity | `activity/booking_activity.puml` |
| 7 | **ACT-02** | Quy trình Trả xe, Kiểm tra và Đối soát năng lượng | Activity | `activity/vehicle_return_and_inspection_activity.puml` |
| 8 | **SEQ-01** | Sơ đồ tuần tự: Xác thực & Đăng nhập JWT | Sequence | `sequence/seq_login_jwt.puml` |
| 9 | **SEQ-02** | Sơ đồ tuần tự: Đặt lịch và Xử lý xung đột | Sequence | `sequence/seq_booking_creation_conflict.puml` |
| 10 | **SEQ-03** | Sơ đồ tuần tự: Hoàn tất sạc & Tồn kho WAC | Sequence | `sequence/seq_charging_energy_inventory.puml` |
| 11 | **CLASS-01**| Sơ đồ lớp miền dữ liệu tổng thể (Domain Model) | Class | `class/domain_model_overview.puml` |
| 12 | **ERD-01** | Sơ đồ thực thể quan hệ cơ sở dữ liệu tổng quan | Database ERD | `database/database_erd_overview.puml` |
| 13 | **STATE-01**| Sơ đồ máy trạng thái vòng đời chuyến đi | State Machine | `state-machine/trip_lifecycle.puml` |
| 14 | **DEPLOY-01**| Sơ đồ triển khai phần cứng và máy chủ | Deployment | `deployment/system_deployment_diagram.puml` |

---

## PHỤ LỤC L: NHẬT KÝ THỰC TẬP ĐỀ XUẤT (PROPOSED INTERNSHIP DIARY)

*Lưu ý: Nhật ký dưới đây phản ánh tiến trình công việc thực tế được ghi nhận từ cấu trúc mã nguồn dự án. Sinh viên cần điền chính xác ngày tháng cụ thể theo lịch thực tập của Nhà trường trước khi nộp.*

* **Giai đoạn 1 (Tuần 1 - 4): Tiếp nhận đề tài, Khảo sát nghiệp vụ và Thiết kế CSDL**
  * *Nội dung công việc:* Tìm hiểu văn hóa doanh nghiệp, khảo sát quy trình quản lý xe điện đồng sở hữu. Thiết kế lược đồ thực thể quan hệ (ERD), xây dựng 46 tệp script Flyway Migration khởi tạo CSDL MySQL 8.0.
  * *Kết quả:* Lược đồ CSDL chuẩn 3NF, cấu trúc thư mục dự án được thiết lập.
* **Giai đoạn 2 (Tuần 5 - 8): Phát triển Backend lõi và Động cơ Khử xung đột**
  * *Nội dung công việc:* Hiện thực hóa cấu hình Spring Security 6 với JWT, xây dựng các thực thể JPA, Repository và Service cho phân hệ Xe, Người dùng và Đặt lịch (Booking). Triển khai thuật toán phát hiện và ngăn chặn xung đột thời gian đặt lịch.
  * *Kết quả:* API Đăng nhập, API Quản lý xe và Đặt lịch hoạt động ổn định.
* **Giai đoạn 3 (Tuần 9 - 12): Xây dựng Động cơ Tài chính và Không gian Virtual Garage 3D**
  * *Nội dung công việc:* Xây dựng `VehicleEnergyInventoryService` với công thức giá bình quân gia quyền WAC và mô hình tổn hao nạp sạc. Hiện thực hóa thuật toán Hare-Niemeyer phân chia chi phí. Xây dựng không gian 3D Garage trên React Three Fiber và Three.js r173, nạp mô hình Digital Twin GLB.
  * *Kết quả:* Hoàn thành giao diện 3D tương tác 60 FPS, động cơ tài chính vận hành chuẩn xác.
* **Giai đoạn 4 (Tuần 13 - 16): Tích hợp hoàn thiện, Kiểm thử và Viết Báo cáo**
  * *Nội dung công việc:* Tích hợp phân hệ Biểu quyết, Hợp đồng điện tử, Tranh chấp. Xây dựng danh mục 100 ca kiểm thử, tối ưu hóa hiệu năng đồ họa WebGL và hoàn thiện toàn bộ báo cáo tốt nghiệp.
  * *Kết quả:* Sản phẩm phần mềm EVShare 3D hoàn chỉnh và tài liệu báo cáo tốt nghiệp chuẩn mực.

---

## PHỤ LỤC M: DANH SÁCH CÁC GIỚI HẠN KỸ THUẬT ĐÃ KIỂM CHỨNG

1. **Thanh toán trực tuyến:** Đang vận hành ở chế độ mô phỏng (`app.financial-mode: DEMO`), chưa kết nối cổng thanh toán ngân hàng tự động.
2. **Ký số hợp đồng:** Đang áp dụng chữ ký mô phỏng lưu vết hash trong CSDL, chưa tích hợp chứng thư số công cộng PKI.
3. **Dữ liệu vi điều khiển pin xe:** Các chỉ số pin và ODO được mô phỏng qua thuật toán phần mềm, chưa đấu nối trực tiếp với cổng phần cứng vi điều khiển OBD-II trên xe thật.
4. **Thiết bị di động:** Giao diện 3D hiện tập trung tối ưu cho máy tính để bàn (Desktop/Laptop), cần tiếp tục tối ưu hóa cho màn hình cảm ứng điện thoại.

---

## PHỤ LỤC N: DANH MỤC KIỂM TRA BÀN GIAO DỰ ÁN (HANDOVER CHECKLIST)

- [x] Toàn bộ mã nguồn Backend Spring Boot 3.3.4 (Java 21) tại thư mục `backend/`.
- [x] Toàn bộ mã nguồn Frontend React 18, TypeScript, Three.js tại thư mục `frontend/`.
- [x] 46 Tệp script Flyway di chuyển cơ sở dữ liệu từ V1 đến V46 tại `backend/src/main/resources/db/migration/`.
- [x] Tài nguyên mô hình 3D nhị phân định dạng `.glb` tại `frontend/public/models/`.
- [x] Bộ 100 ca kiểm thử chi tiết tại `docs/graduation-internship-report/MANUAL_TEST_CASES.md`.
- [x] Bộ sơ đồ thiết kế hệ thống PlantUML tại `docs/graduation-internship-report/diagrams/`.
- [x] Báo cáo thực tập tốt nghiệp đầy đủ tại `docs/graduation-internship-report/BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md`.
