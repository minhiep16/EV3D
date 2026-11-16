# CHƯƠNG 5: XÂY DỰNG VÀ TRIỂN KHAI HỆ THỐNG

---

## 5.1. MÔI TRƯỜNG PHÁT TRIỂN VÀ CẤU HÌNH CÔNG CỤ

Hệ thống EVShare 3D được xây dựng và kiểm chứng thực tế trong môi trường phát triển tiêu chuẩn:
* **Hệ điều hành:** Microsoft Windows 11 Pro 64-bit.
* **Môi trường phát triển tích hợp (IDE):** Visual Studio Code kết hợp các tiện ích mở rộng Spring Boot Tools, Lombok Annotations, ESLint, Prettier và PlantUML.
* **Bộ công cụ phát triển Java (JDK):** OpenJDK 64-Bit Server VM (build 21.0.x LTS).
* **Khung ứng dụng Backend:** Spring Boot 3.3.4, Spring Security 6.3.x, Spring Data JPA / Hibernate ORM 6.5.x.
* **Hệ quản trị cơ sở dữ liệu:** MySQL Community Server 8.0+ kết hợp Flyway Migration 10.x.
* **Nền tảng thực thi JavaScript / Node.js:** Node.js v20.x LTS, npm v10.x.
* **Công cụ đóng gói Frontend:** Vite 6.1.0, TypeScript 5.7.3.
* **Thư viện đồ họa không gian 3D:** Three.js r173, React Three Fiber 8.17.14, @react-three/drei 9.121.4.

---

## 5.2. TỔ CHỨC CẤU TRÚC MÃ NGUỒN DỰ ÁN

Toàn bộ dự án EVShare 3D (thư mục gốc `D:\EV3D`) được phân tách thành hai cây mã nguồn độc lập, sạch sẽ và tuân thủ nguyên tắc module hóa cao độ:

### 5.2.1. Cấu trúc cây thư mục Backend (`backend/`)
```text
backend/
├── pom.xml                                   # Cấu hình phụ thuộc Maven (Java 21, Spring Boot 3.3.4)
└── src/
    ├── main/
    │   ├── java/com/evshare/
    │   │   ├── admin/                        # Phân hệ Quản trị viên (Controller, Service, DTO)
    │   │   ├── ai/                           # Phân hệ Trợ lý ảo AI Zone (Rule-based Knowledge)
    │   │   ├── audit/                        # Phân hệ Nhật ký kiểm toán Audit Logs
    │   │   ├── auth/                         # Xác thực, Đăng nhập, Quản lý Token JWT
    │   │   ├── battery/                      # Quản trị sức khỏe pin (SOH, SOC, Telemetry)
    │   │   ├── booking/                      # Quản lý Đặt lịch & Động cơ khử xung đột thời gian
    │   │   ├── charging/                     # Quản lý Trụ sạc và Phiên sạc pin xe điện
    │   │   ├── common/                       # Xử lý ngoại lệ toàn cục (GlobalExceptionHandler)
    │   │   ├── config/                       # Cấu hình Spring Security, CORS, Password Encoder
    │   │   ├── contract/                     # Quản lý Hợp đồng đồng sở hữu và Chữ ký số DEMO
    │   │   ├── damage/                       # Quản lý Hư hại & Tọa độ 3D Hotspot
    │   │   ├── dispute/                      # Quản lý Khiếu nại, Tranh chấp và Bồi thường DEMO
    │   │   ├── energy/                       # Động cơ Tồn kho Năng lượng & Giá bình quân WAC
    │   │   ├── expense/                      # Phân bổ Chi phí Trực tiếp (Thuật toán Hare-Niemeyer)
    │   │   ├── fund/                         # Xác minh Thanh toán cá nhân (DEMO Payment Mode)
    │   │   ├── handover/                     # Biên bản Bàn giao xe kỹ thuật
    │   │   ├── inspection/                   # Biên bản Kiểm tra kỹ thuật (Checklist lúc giao/trả)
    │   │   ├── maintenance/                  # Quản trị Bảo dưỡng & Phê duyệt chi phí sửa chữa
    │   │   ├── notification/                 # Hệ thống Thông báo không gian thời gian thực
    │   │   ├── ownership/                    # Nhóm đồng sở hữu, Cổ phần, Chuyển nhượng, Lời mời
    │   │   ├── security/                     # Bộ lọc JwtAuthenticationFilter, UserPrincipal
    │   │   ├── trip/                         # Vòng đời Chuyến đi, Gia hạn & Trả xe hoàn tất
    │   │   ├── user/                         # Thực thể Người dùng, Vai trò Role (ADMIN/STAFF/CO_OWNER)
    │   │   ├── vehicle/                      # Danh mục Xe, Digital Twin, Trạng thái phương tiện
    │   │   └── voting/                       # Hệ thống Biểu quyết dân chủ tập thể
    │   └── resources/
    │       ├── application.yml               # Cấu hình kết nối MySQL, JWT Secret, Financial Mode
    │       └── db/migration/                 # 46 Tệp script Flyway di chuyển CSDL (V1 đến V46)
    └── test/                                 # Bộ kiểm thử đơn vị & Tích hợp (12 Test Classes)
```

### 5.2.2. Cấu trúc cây thư mục Frontend (`frontend/`)
```text
frontend/
├── package.json                              # Cấu hình thư viện (React 18, Three.js, R3F, Zustand)
├── vite.config.ts                            # Cấu hình máy chủ phát triển Vite & React Plugin
├── public/
│   └── models/                               # Tài nguyên mô hình 3D nhị phân (.glb)
│       ├── ev01-realistic.glb                # Mô hình xe thực tế EV-01
│       ├── ev02-stylized.glb                 # Mô hình xe EV-02
│       └── vinfast_vf3.glb                   # Mô hình xe VinFast VF3
└── src/
    ├── App.tsx                               # Điểm vào ứng dụng, Định tuyến BrowserRouter
    ├── scenes/                               # Các Scene giao diện chính (AuthScene, GarageScene)
    ├── store/                                # Kho lưu trữ trạng thái toàn cục Zustand (auth, world)
    ├── services/                             # API Clients kết nối RESTful Backend (TanStack Query)
    ├── components/
    │   ├── common/                           # Error Boundary, Toast thông báo, Loading HUD
    │   ├── admin/                            # Các Panel trung tâm chỉ huy Quản trị viên
    │   ├── staff/                            # Các Modal bàn giao, kiểm định, duyệt thanh toán
    │   ├── coowner/                          # Carousel nghiệp vụ Co-Owner, Bảng điều khiển xe
    │   ├── fleet/                            # Sidebar quản lý danh sách đội xe cho Staff
    │   └── three/                            # Các thành phần không gian 3D WebGL
    │       ├── EVShareWorld.tsx              # Canvas 3D gốc, Ánh sáng, Sàn phản xạ
    │       ├── vehicles/                     # Digital Twin xe, Chế độ khám phá, Hotspot hư hỏng
    │       ├── battery/                      # Hiệu ứng X-Ray nhìn xuyên pin phát sáng
    │       ├── booking/                      # CoOwnerBookingPanel với trục thời gian trực quan
    │       ├── charging/                     # Mô hình trụ sạc và bảng điều khiển nạp điện
    │       └── zones/                        # Các khu vực chức năng trong Garage (AI Zone, Finance)
    └── types/                                # Định nghĩa kiểu tĩnh TypeScript đồng bộ với DTO
```

---

## 5.3. XÂY DỰNG HỆ THỐNG XÁC THỰC VÀ ỦY QUYỀN (AUTH & SECURITY)

Hệ thống xác thực được triển khai theo mô hình Token kép phi trạng thái. 

### 5.3.1. Cấu hình chuỗi bộ lọc Spring Security
Tại tệp `backend/src/main/java/com/evshare/config/SecurityConfig.java`, hệ thống thiết lập chuỗi lọc bảo mật:
```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .csrf(AbstractHttpConfigurer::disable)
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/auth/**", "/api/health", "/error").permitAll()
            .requestMatchers("/models/**", "/textures/**", "/environments/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .requestMatchers("/api/staff/**").hasAnyRole("STAFF", "ADMIN")
            .anyRequest().authenticated()
        )
        .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
    return http.build();
}
```

### 5.3.2. Sinh và kiểm tra tính hợp lệ của Token JWT
Lớp `JwtTokenProvider.java` sử dụng thư viện JJWT 0.12.6 để ký số HMAC-SHA256:
```java
public String generateAccessToken(UserPrincipal userPrincipal) {
    Date now = new Date();
    Date expiryDate = new Date(now.getTime() + jwtExpirationInMs);

    return Jwts.builder()
            .subject(userPrincipal.getId().toString())
            .claim("email", userPrincipal.getEmail())
            .claim("role", userPrincipal.getRole().name())
            .issuedAt(now)
            .expiration(expiryDate)
            .signWith(signingKey)
            .compact();
}
```

### 5.3.3. Màn hình Đăng nhập 3D (AuthScene)
Giao diện đăng nhập không sử dụng trang trắng 2D thông thường mà được tích hợp ngay trong một không gian 3D tối giản (`AuthScene.tsx`). Người dùng vừa quan sát mô hình xe điện xoay chậm dưới ánh đèn sân khấu vừa nhập thông tin email và mật khẩu. Khi đăng nhập thành công, token được lưu an toàn vào `authStore` và ứng dụng tự động chuyển hướng vào `/garage`.

---

## 5.4. XÂY DỰNG KHÔNG GIAN VIRTUAL GARAGE 3D

Thành phần trung tâm của hệ thống là `EVShareWorld.tsx` và `GarageScene.tsx`:
1. **Thiết lập Canvas đồ họa:** Thẻ `<Canvas>` được cấu hình với độ sâu màu chuẩn sRGB, chế độ đổ bóng mềm (`shadows`), và góc nhìn máy quay phối cảnh:
```tsx
<Canvas
  camera={{ position: [0, 2.5, 6], fov: 45 }}
  gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
>
  <color attach="background" args={['#050811']} />
  <ambientLight intensity={0.4} />
  <directionalLight position={[10, 15, 10]} intensity={1.2} castShadow />
  <OrbitControls enableDamping dampingFactor={0.05} maxPolarAngle={Math.PI / 2 - 0.05} />
  <Suspense fallback={null}>
    <VehicleDigitalTwin vehicleId={selectedVehicleId} />
  </Suspense>
</Canvas>
```
2. **Bục xoay và Sàn phản xạ (Mesh Reflector):** Bề mặt sàn garage được áp dụng shader phản xạ mờ (`MeshReflectorMaterial`), tạo cảm giác sang trọng và chân thực khi ánh đèn trần và màu sơn xe phản chiếu xuống mặt sàn.
3. **Thẻ Hologram nổi (Spatial HUD):** Nhãn thông tin phương tiện (`VehicleStatusLabel.tsx`) sử dụng `<Html>` của thư viện Drei, bay lơ lửng phía trên nóc xe và tự động xoay hướng về phía mắt người nhìn (Billboard effect), hiển thị biển số xe, % pin và nhãn trạng thái (SẴN SÀNG, ĐANG SỬ DỤNG, ĐANG SẠC).

---

## 5.5. HIỆN THỰC HÓA PHÂN HỆ QUẢN TRỊ VIÊN (ADMIN)

Phân hệ Quản trị viên cung cấp các công cụ điều hành cấp cao thông qua `AdminCommandCenterPanels.tsx` và `AdminController.java`:
* **Quản trị người dùng & Phân quyền:** Cho phép xem toàn bộ danh sách tài khoản trong hệ thống, tìm kiếm theo email/họ tên, khóa tài khoản hoặc thay đổi vai trò (nâng cấp thành STAFF hoặc hạ cấp thành CO_OWNER).
* **Quản lý Nhóm đồng sở hữu:** Khởi tạo các nhóm mới, chỉ định Trưởng nhóm (Leader), gắn kết phương tiện và giám sát biểu đồ tròn tỷ lệ phần trăm sở hữu của từng thành viên để bảo đảm quy tắc bất biến 100%.
* **Báo cáo phân tích hiệu suất (Analytics):** Bảng tổng hợp số lượng chuyến đi, tổng điện năng tiêu thụ toàn đội xe, doanh thu sạc và thống kê các tranh chấp đã được giải quyết.

---

## 5.6. HIỆN THỰC HÓA PHÂN HỆ NHÂN VIÊN ĐIỀU HÀNH (STAFF)

Phân hệ Nhân viên điều hành tập trung vào công tác giám sát kỹ thuật và đối soát vật lý:
* **Sidebar quản lý đội xe (`StaffGarageFleetSidebar.tsx`):** Hiển thị danh sách toàn bộ phương tiện trong garage kèm bộ lọc theo trạng thái (Sẵn sàng, Đang chạy, Đang sạc, Đang bảo dưỡng). Khi nhân viên nhấp chọn một chiếc xe, camera 3D sẽ tự động lướt đến bục của chiếc xe đó.
* **Xác nhận bàn giao xe (`StaffHandoverModal.tsx`):** Nhân viên đối chiếu thông tin người nhận, ghi nhận số ODO xuất phát và mức pin, ký xác nhận để cấp quyền cho Co-Owner khởi hành.
* **Biên bản kiểm tra kỹ thuật (`StaffReturnInspectionModal.tsx`):** Khi xe được trả về trạm, nhân viên thực hiện kiểm tra theo bảng Checklist chi tiết (Lốp, Phanh, Kính, Đèn, Ngoại thất), chụp ảnh hiện trường (nếu có va quẹt) và xác nhận chốt hoàn tất chuyến đi.
* **Phê duyệt thanh toán (`StaffPaymentVerificationModal.tsx`):** Đối soát các giao dịch thanh toán chi phí điện của thành viên, kiểm tra mã tham chiếu giao dịch và bấm nút "Xác Nhận Phê Duyệt" để tất toán khoản nợ.

---

## 5.7. HIỆN THỰC HÓA PHÂN HỆ CHỦ ĐỒNG SỞ HỮU (CO_OWNER)

Phân hệ Co-Owner cung cấp trải nghiệm số hóa toàn diện:
* **Carousel thao tác nghiệp vụ (`CoOwnerOperationalCarousel.tsx`):** Thanh điều hướng nổi hình vòng cung ở đáy màn hình, chứa các lối tắt trực quan: Đặt xe, Khám phá xe, Sức khỏe Pin X-Ray, Lịch sử chuyến đi, Quản lý tài chính, Biểu quyết và Hợp đồng.
* **Chế độ bóc tách phụ tùng (Vehicle Part Exploration):** Cho phép người dùng nhấp vào từng cánh cửa, nắp capo, bánh xe để xem thông số kỹ thuật và lịch sử bảo trì riêng biệt của từng bộ phận.
* **Chế độ nhìn xuyên Pin (Battery X-Ray):** Biến đổi toàn bộ vỏ kim loại của xe thành vật liệu bán trong suốt phát sáng, để lộ khối pin 60 kWh ở gầm xe với các cell pin hiển thị màu sắc tương ứng với mức độ chai pin (SOH).

---

## 5.8. HIỆN THỰC HÓA CHỨC NĂNG ĐẶT LỊCH VÀ KHỬ XUNG ĐỘT (BOOKING)

### 5.8.1. Thuật toán phát hiện và ngăn chặn xung đột thời gian
Tại `BookingService.java`, phương thức `createBooking` thực thi thuật toán kiểm tra nghiêm ngặt:
```java
// 1. Kiểm tra thời gian bắt đầu trước kết thúc và không ở quá khứ
if (!request.getStartTime().isBefore(request.getEndTime())) {
    throw new IllegalArgumentException("Thời gian kết thúc phải sau thời gian bắt đầu.");
}
if (request.getStartTime().isBefore(Instant.now().minusSeconds(120))) {
    throw new IllegalArgumentException("Không thể đặt xe trong quá khứ.");
}

// 2. Kiểm tra tư cách thành viên nhóm xe
if (user.getRole() == Role.CO_OWNER && !coOwnershipService.isUserActiveMemberForVehicle(userId, vehicleId)) {
    throw new AccessDeniedException("Bạn không phải là thành viên hoạt động của nhóm đồng sở hữu xe này.");
}

// 3. Kiểm tra trạng thái bảo dưỡng
if (vehicle.getStatus() == VehicleStatus.MAINTENANCE) {
    throw new IllegalArgumentException("Xe đang trong quá trình bảo dưỡng, không thể đặt lịch mới.");
}

// 4. Truy vấn phát hiện xung đột lịch đặt trong CSDL
List<Booking> conflicts = bookingRepository.findConflictingBookings(
        vehicleId, request.getStartTime(), request.getEndTime(), ACTIVE_STATUSES);

if (!conflicts.isEmpty()) {
    throw new IllegalArgumentException("Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.");
}
```

Tại tầng Repository (`BookingRepository.java`), câu truy vấn Spring Data JPA được tối ưu hóa:
```java
@Query("SELECT b FROM Booking b WHERE b.vehicle.id = :vehicleId " +
       "AND b.status IN :statuses " +
       "AND (b.startTime < :endTime AND b.endTime > :startTime)")
List<Booking> findConflictingBookings(
        @Param("vehicleId") UUID vehicleId,
        @Param("startTime") Instant startTime,
        @Param("endTime") Instant endTime,
        @Param("statuses") List<BookingStatus> statuses);
```

---

## 5.9. CHU TRÌNH BÀN GIAO, KHỞI HÀNH VÀ TRẢ XE HOÀN TẤT

Hệ thống thiết lập một chu trình 8 bước chặt chẽ, phân định rõ ràng giữa việc "Yêu cầu trả xe của Co-Owner" và "Xác nhận đối soát kỹ thuật của Nhân viên":

```
[1. ĐẶT LỊCH THÀNH CÔNG] (Booking CONFIRMED)
           |
           v
[2. NHÂN VIÊN BÀN GIAO] (Staff verifyHandover: ghi nhận ODO/Pin xuất phát)
           |
           v
[3. CO-OWNER KÝ NHẬN] (Owner acknowledgeCondition: xác nhận hiện trạng xe)
           |
           v
[4. KHỞI HÀNH CHUYẾN ĐI] (Co-Owner startTrip: xe chuyển IN_USE, Trip ACTIVE)
           |
           v
[5. DI CHUYỂN & GIA HẠN] (Tùy chọn: requestTripExtension nếu cần thêm giờ)
           |
           v
[6. CO-OWNER YÊU CẦU TRẢ XE] (Co-Owner requestTripReturn: nhập ODO/Pin lúc đỗ xe)
           |
           v
[7. NHÂN VIÊN KIỂM ĐỊNH THỰC TẾ] (Staff lập Checklist kiểm tra kỹ thuật & ghi nhận hư hại mới)
           |
           v
[8. CHỐT HOÀN TẤT CHUYẾN ĐI] (Staff confirmTripReturn: Trip COMPLETED, trừ kho điện, sinh chi phí)
```
*Hình 5.1. Chu trình 8 bước quản lý vòng đời chuyến đi khép kín.*

**Lý do kỹ thuật và nghiệp vụ phân định bước 6 và bước 8:**
Nếu hệ thống cho phép Co-Owner tự bấm "Kết thúc chuyến đi" mà không qua bước kiểm tra của Nhân viên, sẽ phát sinh lỗ hổng gian lận nghiêm trọng: người lái có thể khai man số ODO thấp hơn thực tế để trốn tránh tiền điện, hoặc che giấu các vết va quẹt móp méo thân vỏ vừa gây ra trên đường. Việc bắt buộc Nhân viên kỹ thuật ký xác nhận biên bản đối soát bảo đảm tính khách quan, minh bạch và gắn liền trách nhiệm pháp lý giữa các bên.

---

## 5.10. KIỂM TRA KỸ THUẬT VÀ BẢN ĐỒ HÓA HƯ HỎNG 3D (DAMAGE MAPPING)

### 5.10.1. Điểm cảnh báo hư hỏng không gian (3D Damage Hotspot)
Khi phát hiện vết trầy xước trong quá trình kiểm định, nhân viên nhấp trực tiếp vào vị trí va quẹt trên mô hình 3D. Component `DamageHotspotMarker.tsx` chuyển đổi tọa độ điểm va chạm từ Raycaster thành một điểm neo không gian:
```tsx
<mesh position={[damage.hotspotX, damage.hotspotY, damage.hotspotZ]}>
  <sphereGeometry args={[0.08, 16, 16]} />
  <meshStandardMaterial
    color={damage.status === 'RESOLVED' ? '#22c55e' : '#ef4444'}
    emissive={damage.status === 'RESOLVED' ? '#15803d' : '#b91c1c'}
    emissiveIntensity={1.5}
  />
</mesh>
```
Điểm Hotspot phát sáng nhấp nháy màu đỏ cảnh báo. Khi người dùng nhấp vào điểm này, modal `DamageDetailModal.tsx` mở ra hiển thị hình ảnh chụp hiện trường, mức độ nghiêm trọng (Nhẹ/Trung bình/Nặng), thời điểm phát sinh và nhân viên ghi nhận.

---

## 5.11. QUẢN LÝ PIN VÀ SẠC ĐIỆN PHƯƠNG TIỆN

Hệ thống quản lý chặt chẽ chu trình nạp sạc tại các trụ sạc trong garage thông qua `ChargingSessionService.java`:
1. **Khởi tạo phiên sạc:** Khi cắm sạc, hệ thống tạo bản ghi `ChargingSession` (status = `CHARGING`), ghi nhận thời điểm bắt đầu, mức pin ban đầu và chuyển trạng thái trụ sang `OCCUPIED`.
2. **Tiến trình sạc mô phỏng:** Lớp `ChargingProgressService.java` mô phỏng dòng điện nạp theo thuật toán nạp CC/CV (Constant Current / Constant Voltage) chuẩn của pin Lithium-ion: nạp nhanh từ 20% đến 80% công suất cao, sau đó giảm dần dòng nạp từ 80% đến 100% để bảo vệ tuổi thọ hóa học của cell pin.
3. **Hiệu suất truyền dẫn vật lý:** Hệ thống áp dụng hằng số vật lý:
```java
public static final BigDecimal CHARGING_EFFICIENCY = new BigDecimal("0.90"); // Hiệu suất 90%
```
Khi trụ sạc cấp 40.0 kWh điện lưới, lượng điện thực tế tích lũy vào pin là $40.0 \times 0.90 = 36.0$ kWh. Lượng điện hao phí do nhiệt $4.0$ kWh được lưu vết minh bạch vào cột `energy_loss_kwh`.

---

## 5.12. QUẢN TRỊ TỒN KHO NĂNG LƯỢNG VÀ TÍNH GIÁ BÌNH QUÂN GIA QUYỀN (WAC)

Tại tệp `VehicleEnergyInventoryService.java`, bài toán quản trị kho điện tích lũy trong pin xe được hiện thực hóa chuẩn xác:

### 5.12.1. Công thức cập nhật kho khi hoàn tất phiên sạc (Charging Inflow)
Mỗi khi kết thúc sạc, hệ thống tính toán giá trị điện nạp mới và cập nhật đơn giá bình quân gia quyền theo phương pháp quản trị hàng tồn kho chuẩn:

$$E_{new} = E_{prev} + E_{stored} \tag{5.1}$$

$$V_{new} = V_{prev} + (E_{stored} \times P_{tariff}) \tag{5.2}$$

$$P_{avg}^{new} = \begin{cases} 
\frac{V_{new}}{E_{new}}, & \text{nếu } E_{new} > 0 \\ 
P_{tariff}, & \text{nếu } E_{new} = 0 
\end{cases} \tag{5.3}$$

*Trích đoạn mã nguồn thực tế tại `VehicleEnergyInventoryService.java` (dòng 198 - 204):*
```java
BigDecimal prevValue = inventory.getTotalInventoryCost();
BigDecimal prevEnergy = inventory.getAvailableEnergyKwh();
BigDecimal energyValueToAdd = storedEnergy.multiply(tariff).setScale(2, RoundingMode.HALF_UP);

BigDecimal newValue = prevValue.add(energyValueToAdd).max(BigDecimal.ZERO);
BigDecimal newEnergy = prevEnergy.add(storedEnergy).max(BigDecimal.ZERO);

BigDecimal newAvgCost = newEnergy.compareTo(BigDecimal.ZERO) > 0
        ? newValue.divide(newEnergy, 2, RoundingMode.HALF_UP)
        : tariff;

inventory.setAvailableEnergyKwh(newEnergy);
inventory.setTotalInventoryCost(newValue);
inventory.setWeightedAverageCostPerKwh(newAvgCost);
```

### 5.12.2. Trừ tồn kho năng lượng sau chuyến đi (Trip Consumption)
Khi chuyến đi kết thúc, phương thức `recordTripConsumption` thực hiện xuất kho điện năng tương ứng với lượng kWh tiêu thụ:
* Lượng điện xuất: $E_{consumed} = (SOC_{start} - SOC_{end}) \times C_{usable} / 100$.
* Thành tiền xuất kho: $\text{Chi phí điện} = E_{consumed} \times P_{avg}$ (làm tròn số nguyên VNĐ).
* Tồn kho điện và tổng giá trị còn lại được trừ tương ứng. Cơ chế kiểm tra Idempotency (`existsBySourceReferenceId`) ngăn chặn tuyệt đối việc trừ kho trùng lặp hai lần cho cùng một chuyến đi.

---

## 5.13. QUẢN TRỊ TÀI CHÍNH: PHÂN BỔ CHI PHÍ TRỰC TIẾP VÀ THANH TOÁN DEMO

### 5.13.1. Chuyển đổi mô hình: Phân bổ Chi phí Trực tiếp (Direct Expense Allocation)
Hệ thống EVShare 3D đã chuyển đổi dứt điểm từ mô hình Quỹ chung (Shared Fund) cồng kềnh sang mô hình **Phân bổ Chi phí Trực tiếp**:
* **Tiền điện chuyến đi:** Phân bổ $100\%$ nghĩa vụ tài chính cho người lái (`ExpenseAllocationPolicy.USER_RESPONSIBILITY`). Các đồng sở hữu khác không phải chịu khoản phí này.
* **Chi phí định kỳ (Bảo dưỡng, Bảo hiểm, Bãi đỗ):** Phân bổ theo tỷ lệ sở hữu (`ExpenseAllocationPolicy.OWNERSHIP_RATIO`) ứng dụng thuật toán phần dư lớn nhất Hare-Niemeyer.

### 5.13.2. Thuật toán phần dư Hare-Niemeyer trong phân bổ chi phí
Tại `ExpenseShareService.java`, thuật toán Hare-Niemeyer bảo đảm tổng số tiền phân bổ luôn khớp chính xác tuyệt đối với hóa đơn chi phí:
```java
// Sắp xếp thành viên theo tỷ lệ sở hữu giảm dần, thứ cấp theo userId
activeShares.sort((a, b) -> {
    int cmp = b.getPercentage().compareTo(a.getPercentage());
    if (cmp != 0) return cmp;
    return a.getMember().getUser().getId().compareTo(b.getMember().getUser().getId());
});

BigDecimal allocatedSum = BigDecimal.ZERO;
for (OwnershipShare oShare : activeShares) {
    // 1. Tính toán thô và lấy phần nguyên sàn làm tròn xuống
    BigDecimal rawAmount = expenseAmount.multiply(oShare.getPercentage())
            .divide(new BigDecimal("100"), 2, RoundingMode.FLOOR);
    allocatedSum = allocatedSum.add(rawAmount);
    // ... Khởi tạo ExpenseShare ...
}

// 2. Tính phần dư lẻ do làm tròn: remainder = expenseAmount - allocatedSum
BigDecimal remainder = expenseAmount.subtract(allocatedSum);

// 3. Phân phối phần dư từng đồng lẻ cho các thành viên có phần thập phân lớn nhất
int idx = 0;
while (remainder.compareTo(BigDecimal.ZERO) > 0 && idx < sharesToSave.size()) {
    ExpenseShare targetShare = sharesToSave.get(idx);
    targetShare.setShareAmount(targetShare.getShareAmount().add(new BigDecimal("0.01")));
    remainder = remainder.subtract(new BigDecimal("0.01"));
    idx++;
}
```

### 5.13.3. Quy trình xác minh thanh toán DEMO hai bước
Tại `PersonalPaymentService.java`, quy trình thanh toán cá nhân được vận hành an toàn:
1. **Bước 1: Nộp thông tin thanh toán:** Co-Owner chuyển khoản mô phỏng, nhập mã tham chiếu giao dịch và gửi lên hệ thống. Hệ thống tạo bản ghi `PersonalExpensePayment` với trạng thái `PAYMENT_SUBMITTED`. Lúc này khoản nợ **chưa được xóa**.
2. **Bước 2: Nhân viên xác minh thực tế:** Nhân viên trực trạm kiểm tra số dư tài khoản thực tế, mở modal duyệt và nhấn "Xác Nhận Đã Nhận Tiền". Hệ thống chuyển trạng thái thanh toán sang `PAYMENT_VERIFIED` và tự động cập nhật bản ghi `ExpenseShare` tương ứng sang trạng thái `SETTLED` (Đã tất toán).

---

## 5.14. QUẢN LÝ NHÓM ĐỒNG SỞ HỮU VÀ RÀNG BUỘC CỔ PHẦN

Phân hệ đồng sở hữu (`CoOwnershipService.java`) quản lý vòng đời của nhóm và các thành viên:
* Định danh nhóm thông qua mã `groupCode` duy nhất.
* Bầu chọn Trưởng nhóm (`GroupMemberRole.LEADER`) đại diện pháp lý.
* Kiểm soát chặt chẽ quy tắc bất biến BR-01: mọi thao tác thêm/bớt thành viên hoặc phân bổ lại cổ phần đều phải xác nhận tổng tỷ lệ sở hữu đạt chính xác $100.0000\%$. Nếu sai lệch dù chỉ $0.0001\%$, hệ thống lập tức từ chối và khôi phục trạng thái ban đầu.

---

## 5.15. CHUYỂN NHƯỢNG TỶ LỆ SỞ HỮU PHƯƠNG TIỆN

Khi một thành viên muốn chuyển nhượng một phần hoặc toàn bộ số cổ phần của mình cho thành viên khác:
1. Thành viên mở `TransferModal.tsx`, nhập số lượng cổ phần chuyển nhượng và chọn người nhận.
2. Backend kiểm tra: số cổ phần chuyển nhượng phải $\le$ số cổ phần đang sở hữu.
3. Hệ thống tạo yêu cầu chuyển nhượng `OwnershipTransferRequest` (trạng thái `PENDING_CONSENT`).
4. Khi các bên liên quan và Trưởng nhóm ký xác nhận chấp thuận, hệ thống thực thi giao dịch nguyên tử (`@Transactional`): trừ cổ phần của bên chuyển, cộng cổ phần cho bên nhận và ghi một bản ghi bất biến vào `OwnershipChangeHistory`.

---

## 5.16. MỜI VÀ TIẾP NHẬN THÀNH VIÊN MỚI

Quy trình kết nạp thành viên mới diễn ra qua các bước:
1. Trưởng nhóm gửi lời mời qua email kèm tỷ lệ cổ phần dự kiến trích chuyển từ các thành viên hiện tại.
2. Hệ thống tạo bản ghi `MembershipInvitation` kèm hạn chót phản hồi (thường là 7 ngày).
3. Người được mời đăng nhập vào hệ thống, xem bảng minh họa quyền lợi và nghĩa vụ tài chính.
4. Nếu chấp thuận, người được mời ký xác nhận hợp đồng điện tử và được tự động thêm vào danh sách thành viên hoạt động (`GroupMember`), cấp quyền truy cập vào Virtual Garage 3D của chiếc xe.

---

## 5.17. QUẢN LÝ HỢP ĐỒNG ĐỒNG SỞ HỮU VÀ KÝ SỐ MÔ PHỎNG (DEMO SIGNATURE)

Hệ thống quản lý vòng đời hợp đồng thông qua `CoOwnershipContractService.java`:
* Mỗi khi có biến động về thành viên hoặc tỷ lệ sở hữu, hệ thống tự động sinh một phiên bản hợp đồng mới (`CoOwnershipContractVersion`) ở trạng thái `DRAFT` hoặc `PENDING_SIGNATURES`.
* Các thành viên đọc nội dung điều khoản pháp lý trên `CoOwnerContractPanel.tsx` và bấm nút "Ký Hợp Đồng". Hệ thống lưu vết chữ ký điện tử mô phỏng (gồm mã băm nội dung, thời điểm ký và thông tin định danh) vào bảng `contract_acceptances`.
* Khi $100\%$ các thành viên đã ký chấp thuận, phiên bản hợp đồng tự động chuyển sang trạng thái `ACTIVE`, đồng thời phiên bản hợp đồng cũ được đánh dấu `SUPERSEDED` (Hết hiệu lực).

---

## 5.18. BIỂU QUYẾT TẬP THỂ VÀ THỰC THI NGHỊ QUYẾT NHÓM

Hệ thống biểu quyết dân chủ (`VoteProposalService.java`) giải quyết bài toán ra quyết định tập thể:
* Thành viên khởi tạo đề xuất biểu quyết: ví dụ "Phê duyệt gói bảo dưỡng mốc 20.000 km chi phí 3 triệu đồng" hoặc "Thay mới 4 lốp xe".
* Các thành viên nhóm tiến hành bỏ phiếu (`FOR` - Đồng ý, `AGAINST` - Phản đối, `ABSTAIN` - Bỏ phiếu trắng). Hệ thống tính toán trọng số phiếu bầu dựa trên tỷ lệ phần trăm sở hữu của từng người.
* Khi kết thúc thời gian biểu quyết, nếu tỷ lệ phiếu đồng thuận vượt ngưỡng quy chế ($> 50\%$ hoặc $> 66.6\%$), đề xuất chuyển sang trạng thái `APPROVED` và tự động kích hoạt tạo lệnh công việc tương ứng cho nhân viên kỹ thuật.

---

## 5.19. QUẢN LÝ SỰ CỐ, KHIẾU NẠI VÀ TRANH CHẤP (DISPUTES)

Khi phát sinh xung đột về lịch đặt hoặc sai lệch hóa đơn tiền điện:
1. Thành viên mở `CoOwnerDisputePanel.tsx`, tạo hồ sơ khiếu nại (`Dispute`), phân loại danh mục (Lịch trình, Hóa đơn, Va chạm) và tải lên các tệp bằng chứng hình ảnh.
2. Nhân viên vận hành trạm tiếp nhận hồ sơ trên `StaffDisputeDashboardModal.tsx`, tiến hành điều tra thực tế, đối soát nhật ký hành trình và ghi nhận kết luận điều tra.
3. Nhân viên đề xuất phương án giải quyết (ví dụ: bồi hoàn 50.000 VNĐ tiền điện do trụ sạc nhảy số sai).
4. Hệ thống hỗ trợ thực thi khoản hoàn tiền mô phỏng (`DEMO Compensation Payment`), ghi nhận vào lịch sử và đóng hồ sơ tranh chấp với trạng thái `RESOLVED`.

---

## 5.20. TRUNG TÂM THÔNG BÁO KHÔNG GIAN VÀ TRỢ LÝ ẢO AI ZONE

* **Thông báo không gian (Spatial Notifications):** Khi có sự kiện quan trọng (Lịch đặt mới, Xe đã bàn giao, Hóa đơn tiền điện cần thanh toán, Đề xuất biểu quyết mới), hệ thống tự động sinh bản ghi `Notification`. Trên giao diện 3D, chuông thông báo (`NotificationBell.tsx`) hiển thị chấm đỏ nhấp nháy, kết hợp với các thông báo nổi ngắn hạn (Standard Toast Container).
* **Trợ lý ảo thông minh (AI Zone):** Tại khu vực riêng biệt trong Garage 3D (`AiAssistantInstallation.tsx`), người dùng có thể nhấp chọn mô hình trợ lý ảo Hologram để đặt câu hỏi về quy chế sử dụng xe, hướng dẫn xử lý sự cố hết pin giữa đường hoặc quy định tính tiền điện. Hệ thống xử lý thông qua động cơ đối sánh tri thức luật và tài liệu kỹ thuật xe tích hợp sẵn.

---

## 5.21. BẢO MẬT VÀ TOÀN VẸN DỮ LIỆU THỰC TẾ

Tính toàn vẹn dữ liệu của hệ thống được kiểm chứng qua các cơ chế:
1. **Kiểm tra ranh giới quyền dữ liệu:** Co-Owner chỉ có thể truy xuất và thao tác với xe thuộc nhóm của mình, ngăn chặn triệt để lỗi kiểm soát truy cập đối tượng trực tiếp không an toàn (IDOR).
2. **Chống gửi trùng lặp (Duplicate Submission Protection):** Toàn bộ các API nộp thanh toán, sạc pin và kết thúc chuyến đi đều được kiểm tra tính duy nhất (Idempotency Key), loại bỏ nguy cơ người dùng nhấn đúp chuột làm phát sinh giao dịch nhân đôi.
3. **Bảo tồn tính bất biến của dữ liệu lịch sử:** Các bảng lịch sử (`ownership_change_histories`, `vehicle_energy_transactions`, `audit_logs`) là các bảng chỉ thêm (Append-only), tuyệt đối không hỗ trợ thao tác cập nhật (`UPDATE`) hoặc xóa (`DELETE`), bảo đảm tính toàn vẹn phục vụ công tác thanh tra kiểm toán.

---

## 5.22. TỐI ƯU HÓA HIỆU NĂNG FRONTEND VÀ ĐỒ HỌA 3D

Để bảo đảm ứng dụng 3D vận hành mượt mà trên các thiết bị phổ thông, các giải pháp tối ưu hóa đã được áp dụng:
1. **Tái sử dụng tài nguyên đồ họa:** Chia sẻ chung các đối tượng hình học (`Geometry`) và vật liệu (`Material`) giữa các bục xe và các điểm Hotspot; sử dụng kỹ thuật Instanced Mesh khi vẽ các hàng rào hoặc cột đèn trong garage.
2. **Quản lý bộ nhớ đệm mô hình:** Thư viện `useGLTF` tự động lưu trữ cấu trúc cây xương và lưới đỉnh của tệp GLB trong bộ nhớ RAM, giúp việc chuyển đổi qua lại giữa các xe diễn ra tức thì mà không cần nạp lại qua mạng Internet.
3. **Phân tách mã nguồn (Code Splitting):** Toàn bộ các panel nghiệp vụ nặng (`StaffVehicleDetailPanel`, `CoOwnerBookingPanel`, `FinanceZonePanel`) đều được khai báo dưới dạng `React.lazy()` và bọc trong `<Suspense>`, giúp giảm kích thước gói JavaScript ban đầu (Initial Bundle Size) xuống dưới 1.5 MB, tăng tốc độ tải trang ban đầu.

---

## 5.23. THIẾT KẾ GIAO DIỆN TƯƠNG THÍCH (RESPONSIVE) VÀ TRẢI NGHIỆM NGƯỜI DÙNG

* **Bố cục co giãn linh hoạt:** Các panel nổi được thiết lập độ rộng co giãn thông minh: `width: clamp(440px, 28vw, 495px)`, bảo đảm hiển thị sắc nét trên cả màn hình laptop 14 inch lẫn màn hình máy tính để bàn 27 inch độ phân giải 2K/4K.
* **Xử lý trạng thái tải và rỗng:** Toàn bộ các bảng danh sách và biểu đồ đều được trang bị hiệu ứng bộ nạp xoay xe điện (`EVCarLoader`) và các thông điệp trạng thái rỗng (Empty State) thân thiện bằng tiếng Việt chuẩn mực khi chưa có dữ liệu.
* **Cơ chế đặt lại góc nhìn (Camera Reset):** Bổ sung nút bấm "Đặt Lại Góc Nhìn" trên thanh HUD giúp người dùng lập tức đưa máy quay trở về vị trí bao quát chuẩn nếu vô tình xoay camera vào các góc khuất hoặc bị kẹt góc nhìn.

---

## 5.24. CÁC VẤN ĐỀ KỸ THUẬT GẶP PHẢI VÀ GIẢI PHÁP KHẮC PHỤC THỰC TẾ

Trong quá trình xây dựng hệ thống, sinh viên đã trực tiếp đối mặt và giải quyết thành công nhiều bài toán kỹ thuật phức tạp:

1. **Vấn đề 1: Lỗi phụ thuộc vòng giữa các Spring Service (Circular Dependency)**
   * *Nguyên nhân kỹ thuật:* `BookingService` tiêm phụ thuộc `TripService` để kiểm tra chuyến đi đang chạy, trong khi `TripService` lại tiêm `BookingService` để cập nhật trạng thái lịch đặt xe.
   * *Hậu quả:* Máy chủ Spring Boot bị sập ngay khi khởi động (`BeanCurrentlyInCreationException`).
   * *Giải pháp khắc phục:* Tái cấu trúc mã nguồn, phá vỡ liên kết vòng bằng cách tiêm trực tiếp tầng Repository (`TripRepository` vào `BookingService`) hoặc sử dụng annotation `@Lazy` trên trường tiêm phụ thuộc.
2. **Vấn đề 2: Lỗi chia cho 0 khi tính giá bình quân gia quyền kho điện ban đầu**
   * *Nguyên nhân kỹ thuật:* Khi một chiếc xe mới được đưa vào hệ thống nhưng pin đã cạn kiệt hoàn toàn ($0.000$ kWh), việc thực thi công thức $P_{avg} = V / E$ gây ra lỗi `ArithmeticException: / by zero`.
   * *Hậu quả:* Giao dịch sạc pin đầu tiên bị lỗi và sập ứng dụng.
   * *Giải pháp khắc phục:* Bổ sung điều kiện rẽ nhánh an toàn: nếu tổng năng lượng sau sạc bằng 0, gán đơn giá bình quân bằng đúng biểu giá chuẩn của lưới điện quốc gia (`DEFAULT_ELECTRICITY_TARIFF_VND = 3850.00 VNĐ/kWh`).
3. **Vấn đề 3: Lệch tiền lẻ khi phân bổ chi phí theo tỷ lệ phần trăm sở hữu**
   * *Nguyên nhân kỹ thuật:* Phép chia tỷ lệ phần trăm trên số tiền lớn sinh ra các phần lẻ thập phân. Việc làm tròn số thông thường khiến tổng các phần chia bị thừa hoặc thiếu từ 1 đến 2 đồng so với tổng hóa đơn.
   * *Hậu quả:* Vi phạm nguyên tắc bất biến kế toán của hệ thống tài chính.
   * *Giải pháp khắc phục:* Hiện thực hóa trọn vẹn thuật toán phần dư lớn nhất Hare-Niemeyer tại `ExpenseShareService.java`, cộng phần dư lẻ vào phần nợ của thành viên có tỷ lệ sở hữu cao nhất, bảo đảm tổng số tiền phân bổ luôn khớp chính xác tuyệt đối.
4. **Vấn đề 4: Hiện tượng tràn bộ nhớ GPU (VRAM Memory Leak) khi chuyển đổi xe 3D**
   * *Nguyên nhân kỹ thuật:* Các đối tượng Mesh, Material và Texture cũ của mô hình Three.js không được thu gom rác tự động bởi JavaScript Garbage Collector khi component React unmount.
   * *Hậu quả:* Bộ nhớ VRAM của card đồ họa tăng dần theo thời gian, khiến trình duyệt bị giật lag và cuối cùng làm sập ngữ cảnh WebGL (`WebGL Context Lost`).
   * *Giải pháp khắc phục:* Viết hàm dọn dẹp trong `useEffect cleanup`: duyệt đệ quy toàn bộ cây Scene Graph của xe và gọi phương thức `.dispose()` trên từng Geometry, Material và Texture khi xe bị hủy hiển thị.

---

## 5.25. TỔNG KẾT KẾT QUẢ XÂY DỰNG HỆ THỐNG

Bảng 5.1 dưới đây tổng hợp ma trận đánh giá mức độ hoàn thiện các phân hệ chức năng thực tế của hệ thống EVShare 3D:

*Bảng 5.1. Ma trận tổng kết mức độ hoàn thiện các phân hệ của EVShare 3D.*

| STT | Phân Hệ Chức Năng | Số Lượng API | Số Thực Thể JPA | Trạng Thái Hoàn Thiện | Đánh Giá Mức Độ Đạt Được |
| :---: | :--- | :---: | :---: | :---: | :--- |
| 1 | Xác Thực & Phân Quyền (Auth/Security) | 3 | 2 | Hoàn thành 100% | Đăng nhập JWT, cấp mới token, phân quyền RBAC chặt chẽ |
| 2 | Virtual Garage 3D & Digital Twin | 2 | 2 | Hoàn thành 100% | Không gian 3D tương tác 60 FPS, đổi màu xe động, X-Ray Pin |
| 3 | Đặt Lịch & Khử Xung Đột (Booking) | 3 | 1 | Hoàn thành 100% | Đặt lịch trực quan, thuật toán chặn xung đột thời gian tuyệt đối |
| 4 | Bàn Giao, Chuyến Đi & Trả Xe (Trip) | 6 | 4 | Hoàn thành 100% | Chu trình 8 bước khép kín, nhân viên kiểm định độc lập |
| 5 | Kiểm Tra Kỹ Thuật & Hư Hỏng 3D Hotspot | 3 | 3 | Hoàn thành 100% | Checklist chi tiết, gắn điểm cảnh báo 3D nổi trên thân xe |
| 6 | Sạc Pin & Tồn Kho Năng Lượng (WAC) | 4 | 4 | Hoàn thành 100% | Mô hình tổn hao nạp 10%, tính giá bình quân gia quyền chuẩn xác |
| 7 | Phân Bổ Chi Phí & Thanh Toán DEMO | 4 | 4 | Hoàn thành 100% | Thuật toán Hare-Niemeyer, quy trình xác minh thanh toán 2 bước |
| 8 | Quản Trị Nhóm, Cổ Phần & Chuyển Nhượng | 6 | 5 | Hoàn thành 100% | Bảo toàn bất biến 100% cổ phần, chuyển nhượng nguyên tử |
| 9 | Hợp Đồng Điện Tử (DEMO Signature) | 3 | 3 | Hoàn thành 100% | Quản lý phiên bản hợp đồng, ký số mô phỏng chấp thuận |
| 10 | Biểu Quyết Tập Thể (Voting System) | 3 | 3 | Hoàn thành 100% | Bỏ phiếu dân chủ theo tỷ lệ vốn, tự động kiểm phiếu |
| 11 | Khiếu Nại & Tranh Chấp (Disputes) | 5 | 5 | Hoàn thành 100% | Hồ sơ hòa giải, đính kèm bằng chứng, bồi hoàn DEMO |
| 12 | Thông Báo Không Gian & Trợ Lý AI | 2 | 2 | Hoàn thành 100% | Chuông thông báo thời gian thực, AI Zone giải đáp quy chế |

---

### TÓM TẮT CHƯƠNG 5
Chương 5 đã trình bày một cách toàn diện, sâu sắc và chi tiết quá trình hiện thực hóa hệ thống phần mềm EVShare 3D từ các tệp mã nguồn thực tế. Các giải pháp kỹ thuật cao cấp từ kiến trúc phân tầng Spring Boot, chuỗi lọc bảo mật JWT, quản lý di chuyển CSDL 46 tệp Flyway, đến không gian đồ họa tương tác 3D WebGL với Three.js và React Three Fiber đều được xây dựng chuẩn mực. Các thuật toán nghiệp vụ phức tạp (khử xung đột lịch, giá bình quân năng lượng WAC, phân chia phần dư Hare-Niemeyer) đã giải quyết triệt để các bài toán thực tiễn của mô hình xe điện đồng sở hữu. Chương 6 tiếp theo sẽ trình bày công tác kiểm thử và đánh giá chất lượng toàn diện của hệ thống.
