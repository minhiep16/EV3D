# -*- coding: utf-8 -*-
"""
v4_chapter5.py - Dữ liệu Chương 5: Hiện thực hóa Hệ thống và Kết quả Đạt được
Bao gồm đầy đủ 25 phân hệ hiện thực hóa chi tiết (5.1 đến 5.25),
20 khung giữ chỗ giao diện người dùng (UI-01 đến UI-20) kèm hướng dẫn chụp màn hình,
các trích đoạn mã nguồn thực tế và công thức toán học chuẩn xác.
"""

CHAPTER_5 = {
    "title": "CHƯƠNG 5: HIỆN THỰC HÓA HỆ THỐNG VÀ KẾT QUẢ ĐẠT ĐƯỢC",
    "intro": (
        "Chương 5 trình bày toàn bộ kết quả hiện thực hóa phần mềm thực tế của hệ thống EVShare 3D trên môi trường phát triển. "
        "Nội dung bao gồm cấu trúc tổ chức mã nguồn dự án, chi tiết hiện thực 25 phân hệ công nghệ trọng tâm, "
        "các trích đoạn mã nguồn thực tế đã được kiểm chứng đối chiếu, hiện thực hóa các công thức toán học cốt lõi "
        "(WAC, hiệu suất sạc 92%, giá điện EVN 3.850 đ/kWh, thuật toán Hare-Niemeyer, bất biến vốn 100%), "
        "và 20 khung giữ chỗ giao diện người dùng (UI-01 đến UI-20) kèm quy chuẩn hướng dẫn chụp ảnh minh chứng thực tế."
    ),
    "sections": [
        (
            "5.1. Cấu trúc mã nguồn tổng thể và tổ chức dự án thực tế",
            "Mã nguồn dự án EVShare 3D được tổ chức theo mô hình cấu trúc phân tầng doanh nghiệp chuẩn mực, "
            "tách biệt hoàn toàn giữa ứng dụng máy khách (Frontend React & TypeScript) và máy chủ dịch vụ (Backend Spring Boot & Java 21):\n\n"
            "- **Thư mục Backend (`/backend`):**\n"
            "  + `src/main/java/com/evshare/config`: Chứa các lớp cấu hình hệ thống: `SecurityConfig.java` (Cấu hình Spring Security Filter Chain, CORS, CSRF), `JwtConfig.java`, `JacksonConfig.java` (Cấu hình tuần tự hóa ngày giờ chuẩn ISO 8601 UTC), `WebConfig.java`.\n"
            "  + `src/main/java/com/evshare/security`: Chứa các thành phần bảo mật: `JwtAuthenticationFilter.java`, `JwtService.java`, `UserPrincipal.java`, `CustomUserDetailsService.java`.\n"
            "  + Các gói chức năng nghiệp vụ (Feature Modules): `auth`, `coownership`, `booking`, `charging`, `trip`, `expense`, `voting`, `dispute`, `maintenance`, `damage`, `energy`, `admin`, `notification`, `ai`.\n"
            "  + Mỗi gói chức năng đều tuân thủ cấu trúc 4 tầng phân lớp chuẩn: `controller/` (REST Endpoints), `service/` (Nghiệp vụ cốt lõi), `repository/` (Truy vấn JPA), `entity/` (Thực thể CSDL) và `dto/` (Đối tượng truyền nhận dữ liệu).\n"
            "  + `src/main/resources/db/migration`: Chứa 46 tệp di chuyển lược đồ Flyway SQL tuần tự từ `V1__init_schema.sql` đến `V46__...sql`.\n\n"
            "- **Thư mục Frontend (`/frontend`):**\n"
            "  + `src/components/3d`: Chứa các component đồ họa không gian ba chiều: `GarageScene.tsx`, `VehicleDigitalTwin.tsx`, `CameraRig.tsx`, `DamageHotspots.tsx`, `BatteryPackMesh.tsx`, `ChargingStationMesh.tsx`.\n"
            "  + `src/components/panels`: Chứa các bảng điều khiển nghiệp vụ người dùng: `CoOwnerQuickActionDock.tsx`, `StandardPanelShell.tsx`, `StaffOperationalCarousel.tsx`, `ActiveTripDetailPanel.tsx`, `AiZonePanel.tsx`.\n"
            "  + `src/store`: Chứa các kho lưu trữ trạng thái Zustand: `worldStore.ts` (quản lý 232 actions và trạng thái 3D), `authStore.ts`, `bookingStore.ts`.\n"
            "  + `src/services`: Chứa bộ thư viện giao tiếp mạng Axios `apiClient.ts` tích hợp bộ đánh chặn tự động làm mới JWT (Token Refresh Interceptor)."
        ),
        (
            "5.2. Hiện thực phân hệ Xác thực và Cấp phát Token bảo mật (Auth & JWT Management)",
            "**Mục đích:** Cung cấp dịch vụ đăng ký, đăng nhập, làm mới phiên làm việc và bảo vệ toàn bộ các REST API khỏi truy cập trái phép.\n"
            "**Tác nhân:** Toàn bộ người dùng hệ thống.\n"
            "**Giao diện thực tế:** Màn hình đăng nhập `LoginForm.tsx` và màn hình đăng ký `RegisterForm.tsx` (Liên kết: **UI-01** và **UI-02**).\n"
            "**Luồng xử lý:** Khi người dùng gửi thông tin đăng nhập, `AuthController:login()` tiếp nhận payload `LoginRequest`. `AuthService` kiểm tra mật khẩu bằng `BCryptPasswordEncoder`. Nếu hợp lệ, `JwtService` sinh mã Access Token (15 phút) mang theo claims `{userId, email, role}` và Refresh Token (7 ngày) lưu vào bảng `refresh_tokens`. Tầng máy khách lưu Access Token trong bộ nhớ phiên và tự động gắn vào Header `Authorization: Bearer <token>` cho mọi request tiếp theo.\n"
            "**Trích đoạn mã nguồn thực tế (`AuthService.java`):**\n"
            "```java\n"
            "public AuthResponse login(LoginRequest request) {\n"
            "    Authentication authentication = authenticationManager.authenticate(\n"
            "        new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())\n"
            "    );\n"
            "    UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();\n"
            "    String accessToken = jwtService.generateAccessToken(principal);\n"
            "    RefreshToken refreshToken = refreshTokenService.createRefreshToken(principal.getId());\n"
            "    return new AuthResponse(accessToken, refreshToken.getToken(), userMapper.toDto(principal.getUser()));\n"
            "}\n"
            "```\n"
            "**Khung giữ chỗ giao diện UI-01:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-01: Màn hình Đăng nhập Hệ thống (Login Screen)]\n"
            "*Hướng dẫn chụp:* Truy cập đường dẫn `/login`. Chụp toàn bộ khung form đăng nhập bao gồm trường nhập Email, Mật khẩu, nút Đăng nhập và liên kết Chuyển sang đăng ký.\n\n"
            "**Khung giữ chỗ giao diện UI-02:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-02: Màn hình Đăng ký Thành viên mới (Registration Screen)]\n"
            "*Hướng dẫn chụp:* Truy cập đường dẫn `/register`. Chụp form đăng ký gồm Họ tên, Email, Số điện thoại, Mật khẩu và Xác nhận mật khẩu."
        ),
        (
            "5.3. Hiện thực không gian Garage 3D Digital Twin và Canvas đồ họa WebGL",
            "**Mục đích:** Khởi tạo không gian ảo 3D Garage hiện đại, kết xuất mô hình xe điện chi tiết và thiết lập môi trường ánh sáng PBR chuyên nghiệp.\n"
            "**Tác nhân:** Toàn bộ người dùng truy cập trang chủ Garage.\n"
            "**Giao diện thực tế:** Không gian Garage 3D toàn cảnh `GarageScene.tsx` (Liên kết: **UI-03**).\n"
            "**Hiện thực kỹ thuật:** Sử dụng `@react-three/fiber` để tạo WebGL Canvas với cấu hình `gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}`. Môi trường Garage sử dụng vật liệu phản xạ sàn (Reflective Floor), hệ thống đèn chiếu đa hướng: DirectionalLight giả lập nguồn sáng chính, AmbientLight làm sáng không gian và Spotlight chiếu rọi bục trung tâm. `OrbitControls` được cấu hình giới hạn góc xoay trục dọc (polar angle: 15° đến 85°) để chống góc nhìn xuyên xuống dưới sàn.\n"
            "**Khung giữ chỗ giao diện UI-03:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-03: Không gian Garage 3D Digital Twin Toàn cảnh]\n"
            "*Hướng dẫn chụp:* Đăng nhập vai trò CO_OWNER, mở `/garage`. Chụp toàn màn hình Canvas 3D kết xuất bục xoay xe điện VinFast VF8/VF9, ánh sáng PBR và thanh công cụ điều khiển."
        ),
        (
            "5.4. Hiện thực cơ chế Raycasting tương tác Mesh linh kiện xe điện",
            "**Mục đích:** Cho phép người dùng tương tác trực tiếp bằng chuột lên bề mặt 3D để bóc tách, làm nổi bật và xem chi tiết linh kiện phương tiện.\n"
            "**Giao diện thực tế:** Chế độ khám phá bóc tách linh kiện xe điện `VehicleExplorationExperience.tsx` (Liên kết: **UI-04**).\n"
            "**Hiện thực kỹ thuật:** Trong hàm vòng lặp khung hình `useFrame`, Three.js `Raycaster` phát tia từ vị trí chuột xuyên qua tọa độ chuẩn hóa NDC. Khi tia cắt trúng Mesh (như Cửa trước `Door_FL`, Nắp capo `Hood`), hệ thống thay đổi màu viền phát quang (Emissive highlight). Khi nhấp chuột, Zustand action `selectVehiclePartWithPoint` được dispatch, kích hoạt hoạt ảnh mở cánh cửa 45 độ bằng nội suy GSAP.\n"
            "**Khung giữ chỗ giao diện UI-04:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-04: Khám phá Bóc tách Linh kiện Xe điện 3D]\n"
            "*Hướng dẫn chụp:* Tại `/garage`, di chuột và nhấp chọn cánh cửa xe 3D để kích hoạt hiệu ứng viền phát sáng và cánh cửa mở hé kèm nhãn thông tin linh kiện."
        ),
        (
            "5.5. Hiện thực chế độ X-Ray soi xuyên thấu và Shader vật liệu khối Pin",
            "**Mục đích:** Cho phép người dùng quan sát cấu trúc khối pin dưới gầm xe bằng cách chuyển đổi vật liệu thân vỏ sang trong suốt.\n"
            "**Giao diện thực tế:** Chế độ hiển thị X-Ray cụm Cell Pin `BatteryPackMesh.tsx` (Liên kết: **UI-05**).\n"
            "**Hiện thực kỹ thuật:** Khi người dùng nhấn nút X-Ray trên thanh công cụ, action `worldStore.enterBatteryXrayMode()` được kích hoạt. Toàn bộ Mesh vỏ xe ngoại thất được gán thuộc tính `transparent = true`, `opacity = 0.15`, `depthWrite = false`. Mesh khối pin `BatteryPackMesh` được bật độ phát xạ màu cam rực rỡ `#FF8C00` (`emissiveIntensity = 0.8`), hiển thị rõ ràng 96 cell mô-đun nối tiếp. Toàn bộ logic diễn ra trên GPU Client, không gửi HTTP request.\n"
            "**Khung giữ chỗ giao diện UI-05:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-05: Chế độ X-Ray Soi xuyên thấu Khối Pin Xe điện 3D]\n"
            "*Hướng dẫn chụp:* Nhấn nút biểu tượng 'Pin X-Ray' trên thanh công cụ. Chụp góc nhìn thân xe mờ trong suốt làm nổi bật cụm cell pin phát sáng vàng cam dưới sàn xe."
        ),
        (
            "5.6. Hiện thực hệ thống điểm nóng Hotspots đánh dấu tổn hại thân vỏ 3D",
            "**Mục đích:** Gắn các điểm đánh dấu phát sáng trực tiếp lên bề mặt thân vỏ 3D tương ứng với các vết trầy xước từ biên bản kiểm định.\n"
            "**Giao diện thực tế:** Bản đồ điểm nóng tổn hại thân vỏ 3D `DamageHotspots.tsx` (Liên kết: **UI-06**).\n"
            "**Hiện thực kỹ thuật:** Component `DamageHotspots.tsx` nhận danh sách `DamageRecordResponse` từ Backend (gồm tọa độ 3D x, y, z). Các khối cầu nhấp nháy phát sáng (Pulsing Spheres) được đặt tại đúng tọa độ đó. Khi nhấp vào điểm Hotspot, camera tự động lerp phóng to vào vị trí tổn hại và mở modal chi tiết ảnh chụp thực tế.\n"
            "**Khung giữ chỗ giao diện UI-06:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-06: Bản đồ Điểm nóng Hotspots Đánh dấu Tổn hại Thân vỏ 3D]\n"
            "*Hướng dẫn chụp:* Mở `/vehicles/{id}/damages`. Chụp mô hình xe 3D xuất hiện các điểm cầu màu vàng/đỏ nhấp nháy trên cản trước hoặc cửa xe."
        ),
        (
            "5.7. Hiện thực thanh điều khiển Carousel và chuyển đổi xe trên bục 3D",
            "**Mục đích:** Cho phép đồng sở hữu duyệt qua danh sách các xe trong nhóm và chuyển đổi mẫu xe hiển thị trên bục Garage.\n"
            "**Giao diện thực tế:** Thanh trượt điều khiển Carousel `CoOwnerQuickActionDock.tsx` (Liên kết: **UI-07**).\n"
            "**Hiện thực kỹ thuật:** Component dock nằm cố định ở đáy màn hình, sử dụng Tailwind CSS kính mờ (Backdrop Blur). Khi người dùng nhấp vào thẻ xe khác, Zustand action `selectVehicle` được gọi, xe cũ unmount và giải phóng bộ nhớ (Dispose Geometry/Material), xe mới được nạp mượt mà bằng hiệu ứng Fade In trong 400ms.\n"
            "**Khung giữ chỗ giao diện UI-07:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-07: Thanh trượt Carousel Chọn xe và Bảng điều khiển Tác vụ nhanh]\n"
            "*Hướng dẫn chụp:* Chụp khu vực đáy màn hình Garage 3D hiển thị danh sách thẻ xe kèm các nút bấm tác vụ nhanh: Đặt xe, Sạc pin, Hồ sơ nhóm."
        ),
        (
            "5.8. Hiện thực quy trình Quản lý Nhóm đồng sở hữu và Phân bổ Cổ phần (Co-Ownership)",
            "**Mục đích:** Quản lý cơ cấu nhóm xe, theo dõi danh sách thành viên và tỷ lệ phần trăm sở hữu vốn chính xác.\n"
            "**Giao diện thực tế:** Bảng điều khiển nhóm đồng sở hữu `CoOwnershipManagementPanel.tsx` (Liên kết: **UI-08**).\n"
            "**Hiện thực kỹ thuật:** `CoOwnershipController:getOwnershipShares()` truy vấn bảng `ownership_shares`. Biểu đồ tròn Donut Chart (Recharts) hiển thị tỷ lệ % cổ phần từng thành viên. Hệ thống kiểm tra điều kiện bất biến `SUM(percentage) == 100.0000%` (BR-CO-01).\n"
            "**Khung giữ chỗ giao diện UI-08:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-08: Bảng điều khiển Quản lý Nhóm và Biểu đồ Cơ cấu Cổ phần]\n"
            "*Hướng dẫn chụp:* Truy cập `/co-ownership/groups/{id}`. Chụp bảng thông tin nhóm, danh sách cổ đông kèm biểu đồ tròn phân bổ tỷ lệ sở hữu."
        ),
        (
            "5.9. Hiện thực quy trình Chuyển nhượng Cổ phần và Bảo toàn Bất biến Vốn 100%",
            "**Mục đích:** Xử lý giao dịch mua bán, chuyển dịch cổ phần giữa các thành viên an toàn và phát hành phụ lục hợp đồng tự động.\n"
            "**Giao diện thực tế:** Hộp thoại tạo yêu cầu chuyển nhượng cổ phần `CreateTransferRequestModal.tsx` (Liên kết: **UI-09**).\n"
            "**Hiện thực kỹ thuật:** Trong phương thức `OwnershipTransferService:completeTransfer()`, giao dịch được đặt ở mức cô lập cao `@Transactional`. Số cổ phần bên chuyển bị trừ, bên nhận được cộng tương ứng. Sau đó câu truy vấn `SELECT SUM(percentage)` được thực thi: nếu tổng khác 100.0000% thì toàn bộ giao dịch bị rollback ngay lập tức.\n"
            "**Trích đoạn mã nguồn thực tế (`OwnershipTransferService.java`):**\n"
            "```java\n"
            "@Transactional(isolation = Isolation.SERIALIZABLE)\n"
            "public void completeTransfer(UUID transferId) {\n"
            "    OwnershipTransferRequest request = transferRepository.findById(transferId).orElseThrow();\n"
            "    shareRepository.decreaseShare(request.getVehicleId(), request.getTransferorId(), request.getTransferPercentage());\n"
            "    shareRepository.increaseShare(request.getVehicleId(), request.getTransfereeId(), request.getTransferPercentage());\n"
            "    BigDecimal totalShare = shareRepository.sumPercentageByVehicleId(request.getVehicleId());\n"
            "    if (totalShare.compareTo(new BigDecimal(\"100.0000\")) != 0) {\n"
            "        throw new EquityInvariantViolationException(\"Tổng tỷ lệ sở hữu vi phạm bất biến 100%: \" + totalShare);\n"
            "    }\n"
            "    contractService.generateAppendixVersion(request);\n"
            "    request.setStatus(TransferStatus.COMPLETED);\n"
            "}\n"
            "```\n"
            "**Khung giữ chỗ giao diện UI-09:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-09: Hộp thoại Khởi tạo Yêu cầu Chuyển nhượng Cổ phần]\n"
            "*Hướng dẫn chụp:* Nhấn nút 'Chuyển nhượng cổ phần' tại bảng cổ đông. Chụp hộp thoại nhập bên nhận, tỷ lệ % chuyển nhượng và giá trị thỏa thuận."
        ),
        (
            "5.10. Hiện thực Thư mời gia nhập và Ký kết Hợp đồng điện tử mô phỏng",
            "**Mục đích:** Quy trình tiếp nhận thành viên mới qua email, xem xét điều khoản và ký số điện tử gia nhập nhóm.\n"
            "**Giao diện thực tế:** Cổng tiếp nhận và ký số Onboarding `OnboardingSignModal.tsx` (Liên kết: **UI-10**).\n"
            "**Hiện thực kỹ thuật:** Lời mời có thời hạn 72 giờ (BR-CO-03). Người được mời mở liên kết, xem dự thảo hợp đồng, vẽ chữ ký trên Canvas cảm ứng. Chữ ký được băm SHA-256 lưu vào bảng `contract_acceptances`.\n"
            "**Khung giữ chỗ giao diện UI-10:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-10: Cổng Ký kết Hợp đồng Điện tử Onboarding]\n"
            "*Hướng dẫn chụp:* Mở đường dẫn `/join?code=...`. Chụp màn hình văn bản dự thảo hợp đồng kèm khung vẽ chữ ký điện tử cảm ứng."
        ),
        (
            "5.11. Hiện thực Hệ thống Đặt xe thông minh và Thuật toán Chống trùng lấn biên (Boundary Overlap)",
            "**Mục đích:** Cho phép thành viên đặt lịch sử dụng xe trực quan, tự động loại trừ mọi khả năng trùng lấn khung giờ.\n"
            "**Giao diện thực tế:** Lịch biểu đặt xe trực quan `BookingCalendar.tsx` (Liên kết: **UI-11**).\n"
            "**Hiện thực kỹ thuật:** Thuật toán chống trùng lấn biên thực thi điều kiện logic `StartA < EndB && EndA > StartB` kèm khoảng đệm vệ sinh 30 phút (BR-BOOK-02). Khóa tự động khi xe bảo dưỡng (BR-BOOK-03).\n"
            "**Trích đoạn mã nguồn thực tế (`BookingService.java`):**\n"
            "```java\n"
            "public void validateBookingOverlap(UUID vehicleId, Instant startTime, Instant endTime) {\n"
            "    Instant bufferedStart = startTime.minus(30, ChronoUnit.MINUTES);\n"
            "    Instant bufferedEnd = endTime.plus(30, ChronoUnit.MINUTES);\n"
            "    boolean hasOverlap = bookingRepository.existsOverlappingBooking(vehicleId, bufferedStart, bufferedEnd);\n"
            "    if (hasOverlap) {\n"
            "        throw new BookingConflictException(\"Khung giờ đặt bị trùng lấn hoặc vi phạm khoảng đệm 30 phút!\");\n"
            "    }\n"
            "}\n"
            "```\n"
            "**Khung giữ chỗ giao diện UI-11:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-11: Lịch biểu Đặt xe Tương tác và Khử Xung đột Thời gian]\n"
            "*Hướng dẫn chụp:* Truy cập `/bookings`. Chụp giao diện lưới lịch biểu tuần/tháng với các khối màu xanh (lịch của bạn) và xám (người khác đặt)."
        ),
        (
            "5.12. Hiện thực Quy trình Bàn giao xe hai bên và Kiểm định Kỹ thuật số (Vehicle Handover)",
            "**Mục đích:** Lập biên bản bàn giao xe số trước chuyến đi, kiểm tra an toàn và ký duyệt hai phía.\n"
            "**Giao diện thực tế:** Màn hình lập biên bản bàn giao kỹ thuật số `HandoverInspectionModal.tsx` (Liên kết: **UI-12**).\n"
            "**Hiện thực kỹ thuật:** Kiểm tra pin >= 20% (BR-TRIP-01). Nhân viên nhập số km, pin khởi hành, chụp 4 ảnh góc xe. Thành viên kiểm tra thực tế và ký duyệt. Cấp chìa khóa ảo số (Digital Key).\n"
            "**Khung giữ chỗ giao diện UI-12:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-12: Màn hình Biên bản Bàn giao Xe Kỹ thuật số Hai bên]\n"
            "*Hướng dẫn chụp:* Đăng nhập vai trò STAFF, mở `/staff/handover/{id}`. Chụp form kiểm định kỹ thuật gồm nhập km, pin SOC và 4 ô tải ảnh kiểm định."
        ),
        (
            "5.13. Hiện thực Quản lý Phiên sạc pin và Đo đếm Công suất Trụ sạc thông minh",
            "**Mục đích:** Quản lý quy trình nạp năng lượng tại trụ sạc trạm, theo dõi công suất tức thời và kiểm soát an toàn.\n"
            "**Giao diện thực tế:** Bảng điều khiển nạp điện thời gian thực `ChargingPanel.tsx` (Liên kết: **UI-13**).\n"
            "**Hiện thực kỹ thuật:** Kết nối với trụ sạc IoT, cập nhật công suất sạc (kW), điện áp, dòng điện mỗi 5 giây. Áp dụng hiệu suất sạc 92% (BR-CHG-01) và đơn giá EVN 3.850 đ/kWh (BR-CHG-02).\n"
            "**Khung giữ chỗ giao diện UI-13:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-13: Bảng điều khiển Giám sát Phiên sạc Pin Thời gian thực]\n"
            "*Hướng dẫn chụp:* Tại `/charging/active`, chụp màn hình hiển thị công suất sạc kW tức thời, biểu đồ dòng điện và % pin đang tăng."
        ),
        (
            "5.14. Hiện thực Mô hình Kho năng lượng xe (Energy Inventory) và Thuật toán WAC",
            "**Mục đích:** Quản trị kho điện tích lũy trong pin xe và tính toán đơn giá vốn bình quân gia quyền tự động.\n"
            "**Giao diện thực tế:** Báo cáo kho năng lượng xe `EnergyInventoryView.tsx` (Liên kết: **UI-14**).\n"
            "**Hiện thực kỹ thuật:** Mỗi khi nạp điện hoàn tất, `VehicleEnergyInventoryService:recalculateWAC()` áp dụng công thức toán học WAC chuẩn xác để cập nhật đơn giá vốn vào bảng `vehicle_energy_inventories`.\n"
            "**Trích đoạn mã nguồn thực tế (`VehicleEnergyInventoryService.java`):**\n"
            "```java\n"
            "public void updateInventoryOnCharging(UUID vehicleId, BigDecimal rawEnergyKwh, BigDecimal totalCost) {\n"
            "    BigDecimal netEnergyKwh = rawEnergyKwh.multiply(new BigDecimal(\"0.92\")); // Hiệu suất 92%\n"
            "    VehicleEnergyInventory inv = inventoryRepository.findByVehicleId(vehicleId);\n"
            "    BigDecimal totalValueOld = inv.getCurrentEnergyKwh().multiply(inv.getCurrentWac());\n"
            "    BigDecimal newTotalEnergy = inv.getCurrentEnergyKwh().add(netEnergyKwh);\n"
            "    BigDecimal newWac = totalValueOld.add(totalCost).divide(newTotalEnergy, 4, RoundingMode.HALF_UP);\n"
            "    inv.setCurrentEnergyKwh(newTotalEnergy);\n"
            "    inv.setCurrentWac(newWac);\n"
            "    inventoryRepository.save(inv);\n"
            "}\n"
            "```\n"
            "**Khung giữ chỗ giao diện UI-14:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-14: Báo cáo Kho Năng lượng Xe và Biến động Giá vốn WAC]\n"
            "*Hướng dẫn chụp:* Truy cập `/vehicles/{id}/energy-inventory`. Chụp thẻ hiển thị lượng điện tồn kho (kWh), đơn giá WAC (đ/kWh) và tổng giá trị tồn kho."
        ),
        (
            "5.15. Hiện thực Vận hành Chuyến đi và Chốt chặn An toàn Pin tối thiểu 20%",
            "**Mục đích:** Điều khiển chuyến đi thời gian thực, chốt chặn không cho khởi hành nếu pin xe dưới 20%.\n"
            "**Giao diện thực tế:** Bảng điều khiển hành trình chuyến đi `ActiveTripDetailPanel.tsx` (Liên kết: **UI-15**).\n"
            "**Hiện thực kỹ thuật:** Khi người dùng bấm bắt đầu chuyến đi, `TripService:startTrip()` kiểm tra `currentSOC >= 20.0`. Nếu vi phạm, ném lỗi 400 Bad Request. Trong chuyến đi, tính toán tiêu hao pin và km di chuyển liên tục.\n"
            "**Khung giữ chỗ giao diện UI-15:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-15: Bảng điều khiển Hành trình Chuyến đi Đang hoạt động]\n"
            "*Hướng dẫn chụp:* Bắt đầu một chuyến đi, chụp màn hình hiển thị đồng hồ đếm thời gian, số km đã đi và nút 'Yêu cầu trả xe'."
        ),
        (
            "5.16. Hiện thực Nghiệm thu Trả xe và Tính toán Tiền điện chuyến đi tự động",
            "**Mục đích:** Nghiệm thu xe sau chuyến đi, tính lượng điện tiêu thụ thực tế nhân với đơn giá WAC để sinh hóa đơn cá nhân.\n"
            "**Giao diện thực tế:** Màn hình nghiệm thu hoàn tất chuyến đi `ReturnInspectionModal.tsx` (Liên kết: **UI-16**).\n"
            "**Hiện thực kỹ thuật:** Khi nhân viên xác nhận trả xe qua `TripController:confirmReturn()`, hệ thống tính `deltaSOC = startSOC - endSOC`, tính `energyUsedKwh = deltaSOC * capacity`, nhân với `currentWAC` để trừ kho điện và tạo bản ghi nợ `ExpenseShare` cho người lái.\n"
            "**Khung giữ chỗ giao diện UI-16:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-16: Màn hình Nghiệm thu Trả xe và Hạch toán Tiền điện Tự động]\n"
            "*Hướng dẫn chụp:* Chụp màn hình nhân viên xác nhận hoàn tất trả xe hiển thị mức pin tiêu thụ, số tiền điện tính theo WAC và trạng thái COMPLETED."
        ),
        (
            "5.17. Hiện thực Phân bổ Chi phí chung theo Thuật toán Phần dư lớn nhất Hare-Niemeyer",
            "**Mục đích:** Phân bổ hóa đơn chi phí bảo dưỡng, đăng kiểm cho các thành viên chính xác tới từng đồng VND không thất thoát.\n"
            "**Giao diện thực tế:** Bảng phân bổ chi phí phương tiện `ExpenseShareBreakdownModal.tsx` (Liên kết: **UI-17**).\n"
            "**Hiện thực kỹ thuật:** Thuật toán 4 bước Hare-Niemeyer chia phần nguyên, tính phần dư, sắp xếp giảm dần và bù trừ 1 đồng cho các phần dư lớn nhất, bảo đảm `SUM(shares) == totalExpense`.\n"
            "**Trích đoạn mã nguồn thực tế (`ExpenseShareService.java`):**\n"
            "```java\n"
            "public List<ExpenseShare> reconcileExpenseShares(Expense expense, List<OwnershipShare> shares) {\n"
            "    BigDecimal totalAmount = expense.getTotalAmount();\n"
            "    Map<UUID, BigDecimal> exactAmounts = new HashMap<>();\n"
            "    Map<UUID, Long> flooredAmounts = new HashMap<>();\n"
            "    Map<UUID, BigDecimal> remainders = new HashMap<>();\n"
            "    long sumFloored = 0;\n"
            "    for (OwnershipShare s : shares) {\n"
            "        BigDecimal exact = totalAmount.multiply(s.getPercentage()).divide(new BigDecimal(\"100\"), 4, RoundingMode.HALF_UP);\n"
            "        long floored = exact.longValue();\n"
            "        exactAmounts.put(s.getUserId(), exact);\n"
            "        flooredAmounts.put(s.getUserId(), floored);\n"
            "        remainders.put(s.getUserId(), exact.subtract(BigDecimal.valueOf(floored)));\n"
            "        sumFloored += floored;\n"
            "    }\n"
            "    long deficit = totalAmount.longValue() - sumFloored;\n"
            "    List<UUID> sortedByRemainder = shares.stream()\n"
            "        .map(OwnershipShare::getUserId)\n"
            "        .sorted((u1, u2) -> remainders.get(u2).compareTo(remainders.get(u1)))\n"
            "        .toList();\n"
            "    for (int i = 0; i < deficit; i++) {\n"
            "        UUID uId = sortedByRemainder.get(i);\n"
            "        flooredAmounts.put(uId, flooredAmounts.get(uId) + 1);\n"
            "    }\n"
            "    return buildExpenseShares(expense, flooredAmounts);\n"
            "}\n"
            "```\n"
            "**Khung giữ chỗ giao diện UI-17:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-17: Bảng Phân bổ Chi phí Chi tiết theo Thuật toán Hare-Niemeyer]\n"
            "*Hướng dẫn chụp:* Mở chi tiết một khoản chi phí bảo dưỡng. Chụp bảng tính hiển thị cột Tỷ lệ cổ phần, Số tiền nguyên và cột Số tiền làm tròn khớp tổng 100%."
        ),
        (
            "5.18. Hiện thực Quản lý Quỹ bảo trì chung xe điện (Shared Maintenance Fund)",
            "**Mục đích:** Theo dõi số dư quỹ chung, lịch sử các khoản đóng góp định kỳ và chi trả bảo dưỡng.\n"
            "**Tác nhân:** Các đồng sở hữu trong nhóm.\n"
            "**Hiện thực kỹ thuật:** `SharedFundController` quản lý nạp tiền đóng quỹ và xuất quỹ. Kiểm tra số dư khả dụng không được âm (`balance >= expense.amount`) theo quy tắc BR-EXP-05."
        ),
        (
            "5.19. Hiện thực Nộp và Đối soát Thanh toán Nghĩa vụ Tài chính cá nhân (No Self-Approval)",
            "**Mục đích:** Thành viên chuyển khoản thanh toán nợ cá nhân, nhân viên kiểm tra đối soát gạch nợ. Chặn nghiêm ngặt việc tự phê duyệt nợ của chính mình.\n"
            "**Giao diện thực tế:** Màn hình thanh toán nghĩa vụ nợ `PaymentSubmissionModal.tsx` (Liên kết: **UI-18**).\n"
            "**Hiện thực kỹ thuật:** `PersonalPaymentService:verifyPayment()` kiểm tra `payment.userId != staffId` (BR-EXP-02). Khi duyệt thành công, gạch nợ `expense_shares.status = PAID`.\n"
            "**Khung giữ chỗ giao diện UI-18:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-18: Màn hình Thanh toán Nghĩa vụ Tài chính và Mã VietQR]\n"
            "*Hướng dẫn chụp:* Nhấn 'Thanh toán nợ' tại bảng công nợ. Chụp màn hình hiển thị mã VietQR động, số tiền chính xác và ô tải ảnh biên lai chuyển tiền."
        ),
        (
            "5.20. Hiện thực Lập lịch Bảo dưỡng và Khóa khung giờ sử dụng xe (Maintenance Lock)",
            "**Mục đích:** Lập lệnh bảo dưỡng định kỳ và tự động khóa khung giờ trên lịch biểu nhóm để chống người khác đặt xe trong thời gian xe nằm xưởng.\n"
            "**Tác nhân:** Nhân viên kỹ thuật trạm.\n"
            "**Hiện thực kỹ thuật:** Khi phiếu bảo dưỡng được duyệt, `BookingService` tạo khối khóa `MAINTENANCE` trên lịch biểu xe (BR-BOOK-03)."
        ),
        (
            "5.21. Hiện thực Cơ chế Biểu quyết Dân chủ theo Trọng số Cổ phần (% Equity Voting)",
            "**Mục đích:** Lấy ý kiến tập thể, thành viên bỏ phiếu với trọng số điểm tương ứng chính xác với % cổ phần nắm giữ.\n"
            "**Giao diện thực tế:** Giao diện bỏ phiếu biểu quyết dân chủ `VoteActionModal.tsx` (Liên kết: **UI-19**).\n"
            "**Hiện thực kỹ thuật:** `VoteProposalService:castVote()` gán `voteWeight = share.percentage`. Bỏ phiếu một lần duy nhất không thể sửa đổi (BR-VOTE-05). Ngưỡng thông qua quá bán > 50% (BR-VOTE-02).\n"
            "**Khung giữ chỗ giao diện UI-19:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-19: Giao diện Bỏ phiếu Biểu quyết Dân chủ theo Trọng số Cổ phần]\n"
            "*Hướng dẫn chụp:* Truy cập `/voting/proposals/{id}`. Chụp form bỏ phiếu hiển thị các lựa chọn Đồng ý/Phản đối kèm tỷ lệ trọng số voteWeight của cá nhân."
        ),
        (
            "5.22. Hiện thực Trung tâm Giải quyết Khiếu nại và Hòa giải viên độc lập (Dispute Mediation)",
            "**Mục đích:** Phòng hòa giải trực tuyến, nộp bằng chứng, phân công nhân viên trung gian độc lập và thực thi bồi thường.\n"
            "**Giao diện thực tế:** Phòng hòa giải khiếu nại trực tuyến `DisputeChatRoom.tsx` (Liên kết: **UI-20**).\n"
            "**Hiện thực kỹ thuật:** Tự động phát hiện trả xe muộn điền trước hồ sơ (BR-DISP-01). Hòa giải viên không được là thành viên nhóm xe (BR-DISP-02). Chat thời gian thực qua WebSocket.\n"
            "**Khung giữ chỗ giao diện UI-20:**\n"
            "[KHUNG GIỮ CHỖ GIAO DIỆN UI-20: Phòng Hòa giải Tranh chấp Trực tuyến và Đối chiếu Bằng chứng]\n"
            "*Hướng dẫn chụp:* Mở `/disputes/{id}`. Chụp giao diện phòng hòa giải gồm khung chat trao đổi giữa hai bên, danh sách bằng chứng ảnh chụp và đề xuất bồi thường."
        ),
        (
            "5.23. Hiện thực Bảng điều hành Trực ban của Nhân viên (Staff Dashboard & Operational Carousel)",
            "**Mục đích:** Hỗ trợ nhân viên trạm theo dõi các công việc trực ca cần xử lý: đón xe trả, giao xe đi, các phiên sạc pin vận hành và hồ sơ khiếu nại mới.\n"
            "**Tác nhân:** Nhân viên vận hành (ROLE_STAFF).\n"
            "**Hiện thực kỹ thuật:** `StaffOperationalCarousel.tsx` hiển thị danh sách nhiệm vụ ưu tiên theo thời gian thực, tích hợp bộ lọc trạng thái xe trực ban."
        ),
        (
            "5.24. Hiện thực Bảng điều khiển Quản trị hệ thống và Nhật ký Kiểm toán an toàn (Admin Audit Logs)",
            "**Mục đích:** Cung cấp công cụ quản trị cấp cao cho Admin: xem KPI Dashboard, phân quyền tài khoản và tra cứu nhật ký kiểm toán.\n"
            "**Tác nhân:** Quản trị viên (ROLE_ADMIN).\n"
            "**Hiện thực kỹ thuật:** `AdminController:getAuditLogs()` truy vấn bảng `audit_logs` lưu IP, người thực hiện, hành động và trạng thái JSON trước/sau (BR-SEC-02)."
        ),
        (
            "5.25. Hiện thực Tích hợp Trợ lý ảo AI (AI Zone Panel & Regulatory Lookup)",
            "**Mục đích:** Cung cấp chatbot trợ lý ảo hỗ trợ người dùng tra cứu quy chế nhóm, hướng dẫn sử dụng xe và giải đáp thắc mắc tài chính thông minh.\n"
            "**Tác nhân:** Đồng sở hữu và Người dùng mới.\n"
            "**Hiện thực kỹ thuật:** `AiZonePanel.tsx` giao tiếp với `AiAssistantController:chat()`, áp dụng mô hình RAG (Retrieval-Augmented Generation) nạp tài liệu quy chế nhóm để trả lời chính xác, tránh hiện tượng ảo giác (hallucination)."
        )
    ]
}

def get_chapter_5():
    return CHAPTER_5
