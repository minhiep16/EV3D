# -*- coding: utf-8 -*-
"""
build_v5_chapter5.py - Sinh dữ liệu Chương 5 cho Báo cáo V5:
- 25 phân hệ chi tiết (5.1 đến 5.25).
- 20 khung giữ chỗ giao diện người dùng UI (UI-01 đến UI-20) kèm hướng dẫn chụp và che mờ PII.
- Mục 5.18: Viết lại hoàn chỉnh theo KIẾN TRÚC PHÂN BỔ CHI PHÍ TRỰC TIẾP (Direct Expense Allocation),
  làm rõ phân bổ theo % vốn (OWNERSHIP_RATIO), chi phí điện theo người lái (USER_RESPONSIBILITY),
  tính lũy đẳng chống trùng lặp chi phí, và phân định quỹ cũ là dữ liệu lịch sử / dự phòng tùy chọn.
- Mục 5.13: Làm rõ các phiên sạc pin và viễn thông hiện được điều khiển bằng mô phỏng phần mềm.
- Mục 5.4, 5.7: Đặc tả chính xác kiến trúc Camera Presets theo vai trò và ràng buộc OrbitControls.
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"

def build_chapter5():
    path = os.path.join(BASE_DIR, "v5_chapter5.py")
    with open(path, "w", encoding="utf-8") as f:
        f.write('''# -*- coding: utf-8 -*-
"""
v5_chapter5.py - Dữ liệu Chương 5: Hiện thực hóa Hệ thống (V5)
"""

CHAPTER_5_TITLE = "CHƯƠNG 5: HIỆN THỰC HÓA HỆ THỐNG VÀ XÂY DỰNG ỨNG DỤNG"
CHAPTER_5_INTRO = (
    "Chương 5 trình bày chi tiết kết quả hiện thực hóa toàn diện 25 phân hệ chức năng của hệ thống "
    "EVShare 3D, từ tầng giao diện người dùng React 18, không gian ba chiều WebGL Three.js / React "
    "Three Fiber đến tầng dịch vụ Spring Boot 3.3.4 (Java 21 LTS) và CSDL quan hệ MySQL 8.0. "
    "Mỗi phân hệ được thuyết minh đầy đủ về mục đích nghiệp vụ, tác nhân tương tác, cấu trúc mã nguồn "
    "thực tế, cơ chế kiểm soát bảo mật và thuật toán cốt lõi. Đặc biệt, chương này làm sáng tỏ kiến trúc "
    "phân bổ chi phí trực tiếp (Direct Expense Allocation), thuật toán quản lý kho năng lượng WAC, "
    "thuật toán Hare-Niemeyer và hệ thống 20 khung giữ chỗ giao diện UI chuẩn mực kèm hướng dẫn kỹ thuật."
)

CHAPTER_5_SECTIONS = [
    (
        "5.1. Kiến trúc Tổng thể và Công nghệ Hiện thực hóa",
        "Hệ thống EVShare 3D được xây dựng dựa trên kiến trúc phân tầng doanh nghiệp hiện đại:\\n"
        "- **Frontend SPA & 3D Engine:** Khởi tạo bằng Vite, React 18, TypeScript, Tailwind CSS kết hợp với Three.js và React Three Fiber (@react-three/fiber, @react-three/drei). Quản lý trạng thái bằng Zustand store phi tập trung.\\n"
        "- **Backend Micro-monolith:** Sử dụng Spring Boot 3.3.4 trên nền tảng Java 21 LTS, tận dụng Virtual Threads để tối ưu hóa khả năng đáp ứng I/O cao.\\n"
        "- **Tầng Dữ liệu:** MySQL 8.0 với công cụ lưu trữ InnoDB, quản lý di chuyển lược đồ qua Flyway."
    ),
    (
        "5.2. Hiện thực Quản lý Người dùng, Định danh và Xác thực JWT",
        "**Mục đích:** Cung cấp cổng xác thực an toàn, cấp phát cặp Token JWT và kiểm soát phiên làm việc phi trạng thái.\\n"
        "**Giao diện thực tế:** Màn hình Đăng nhập `LoginForm.tsx` (Liên kết: **UI-01**) và Đăng ký `RegisterForm.tsx` (Liên kết: **UI-02**).\\n"
        "**Hiện thực kỹ thuật:** `AuthController.java` cung cấp 5 endpoint chuẩn: `/api/auth/register`, `/api/auth/login`, `/api/auth/refresh`, `/api/auth/logout`, `/api/auth/me`. Mật khẩu được mã hóa bằng `BCryptPasswordEncoder` (work factor 10). Access Token ký bằng HMAC-SHA256 (thời hạn 15 phút), Refresh Token lưu trong bảng `refresh_tokens` (thời hạn 7 ngày).\\n"
        "**Khung giữ chỗ giao diện UI-01 và UI-02:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-01: Màn hình Đăng Nhập Hệ thống]\\n"
        "*Hướng dẫn chụp:* Truy cập `/login`. Chụp toàn bộ form đăng nhập gồm trường Email, Mật khẩu, nút Đăng nhập và liên kết Quên mật khẩu. Che mờ mật khẩu gõ thực.\\n\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-02: Màn hình Đăng Ký Thành Viên Mới]\\n"
        "*Hướng dẫn chụp:* Truy cập `/register`. Chụp form đăng ký gồm Họ tên, Email, Số điện thoại, Mật khẩu và ô xác nhận điều khoản. Che mờ số điện thoại cá nhân."
    ),
    (
        "5.3. Khởi tạo Viewport WebGL và Không gian Garage 3D",
        "**Mục đích:** Khởi tạo ngữ cảnh đồ họa không gian ba chiều WebGL 2.0 và kết xuất toàn cảnh Garage xe điện thông minh.\\n"
        "**Giao diện thực tế:** Không gian Garage ảo 3D `GarageScene.tsx` và `GarageCanvas.tsx` (Liên kết: **UI-03**).\\n"
        "**Hiện thực kỹ thuật:** Component `GarageCanvas.tsx` cấu hình thẻ `<Canvas>` với WebGLRenderer, thiết lập hệ màu sRGB và bóng đổ đổ bóng mềm (PCFSoftShadowMap). Môi trường ánh sáng PBR kết hợp giữa DirectionalLight và AmbientLight mô phỏng ánh sáng nhà xưởng.\\n"
        "**Khung giữ chỗ giao diện UI-03:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-03: Toàn cảnh Không gian Garage 3D]\\n"
        "*Hướng dẫn chụp:* Đăng nhập tài khoản CO_OWNER, truy cập `/garage`. Chụp toàn cảnh xe đỗ trong Garage với sàn phản chiếu ánh sáng và thanh HUD điều khiển phía dưới."
    ),
    (
        "5.4. Hiện thực Bóc tách Linh kiện và Tương tác Raycaster 3D",
        "**Mục đích:** Cho phép người dùng bấm chọn từng bộ phận xe điện (cửa xe, nắp capo, cốp sau, bánh xe) để kiểm tra chi tiết cấu tạo cơ khí và tình trạng bảo dưỡng.\\n"
        "**Giao diện thực tế:** Chế độ bóc tách linh kiện `VehicleExplorationExperience.tsx` (Liên kết: **UI-04**).\\n"
        "**Hiện thực kỹ thuật:** Sử dụng Three.js Raycaster để phát hiện va chạm con trỏ chuột lên các Mesh linh kiện. Áp dụng hiệu ứng Outline Highlight màu lục lam (Cyan) và hiển thị thẻ thông tin nổi Tooltip.\\n"
        "**Cấu hình Camera Preset:** Khi mở bảng chi tiết bên phải, camera tự động chuyển sang chế độ panel-safe framing (lệch trái 55-65% chiều rộng khung nhìn, để lộ 35-45% cho bảng dữ liệu mà không bị che khuất). Trọng tâm xoay của OrbitControls được giữ cố định tại tâm xe.\\n"
        "**Khung giữ chỗ giao diện UI-04:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-04: Khám phá Bóc tách Linh kiện Xe điện 3D]\\n"
        "*Hướng dẫn chụp:* Tại `/garage`, nhấn nút 'Bóc tách linh kiện'. Chụp góc nhìn xe với cánh cửa mở ra và nhãn Tooltip hiển thị thông tin kỹ thuật của cửa xe."
    ),
    (
        "5.5. Hiện thực Chế độ X-Ray Soi xuyên thấu Khối Pin Xe điện",
        "**Mục đích:** Giúp chủ xe và kỹ thuật viên quan sát trực quan khối pin đặt dưới gầm xe, theo dõi mức dung lượng (SOC), nhiệt độ và tình trạng suy thoái (SOH).\\n"
        "**Giao diện thực tế:** Chế độ soi pin `BatteryPackMesh.tsx` và `XRayController.tsx` (Liên kết: **UI-05**).\\n"
        "**Hiện thực kỹ thuật:** Khi gọi action `enterBatteryXrayMode()` trong `worldStore.ts`, toàn bộ vật liệu vỏ xe chuyển sang trạng thái trong suốt (`transparent = true`, `opacity = 0.15`). Đồng thời, khối pin `BatteryPackMesh` được làm nổi bật với vật liệu phát xạ màu cam (`emissive = #FF5722`).\\n"
        "**Khung giữ chỗ giao diện UI-05:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-05: Chế độ X-Ray Soi xuyên thấu Khối Pin]\\n"
        "*Hướng dẫn chụp:* Nhấn nút 'Soi pin X-Ray'. Chụp góc nhìn thân xe mờ trong suốt để lộ cụm pin phát sáng cam rực rỡ dưới sàn xe kèm chỉ số SOC %."
    ),
    (
        "5.6. Hiện thực Bản đồ Điểm nóng Tổn hại Thân vỏ 3D (Damage Hotspots)",
        "**Mục đích:** Đánh dấu trực quan các vết trầy xước, móp méo trên bề mặt xe 3D tương ứng với các biên bản ghi nhận ngoài đời thực.\\n"
        "**Giao diện thực tế:** Lớp hiển thị tổn hại `DamageHotspots.tsx` (Liên kết: **UI-06**).\\n"
        "**Hiện thực kỹ thuật:** `DamageHotspots.tsx` nhận danh sách điểm tổn hại từ `DamageController.java` (`GET /api/vehicles/{id}/damages`). Tọa độ không gian 3D `[x, y, z]` được chiếu lên màn hình 2D thông qua phương thức `Vector3.project(camera)`. Nhấn vào điểm nóng sẽ kích hoạt camera tự động zoom mượt mà vào vị trí tổn hại đó.\\n"
        "**Khung giữ chỗ giao diện UI-06:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-06: Bản đồ Điểm nóng Tổn hại Thân vỏ 3D]\\n"
        "*Hướng dẫn chụp:* Chọn một xe có vết xước ghi nhận. Chụp mô hình xe 3D xuất hiện các vòng tròn cảnh báo màu vàng/đỏ nhấp nháy trên thân vỏ."
    ),
    (
        "5.7. Hiện thực Thanh trượt Carousel Chuyển xe và Dock Tác vụ",
        "**Mục đích:** Cung cấp bảng điều khiển nhanh ở đáy màn hình giúp chuyển đổi qua lại giữa các xe trong đội xe và kích hoạt nhanh các chế độ 3D.\\n"
        "**Giao diện thực tế:** Thanh trượt xe `VehicleCarousel.tsx` và thanh dock `GarageActionDock.tsx` (Liên kết: **UI-07**).\\n"
        "**Hiện thực kỹ thuật & Ràng buộc OrbitControls:**\\n"
        "- Khi chọn xe mới, camera chuyển động lướt mượt mà bằng phép nội suy tuyến tính (Lerp).\\n"
        "- OrbitControls được thiết lập các giới hạn bảo vệ: góc polar từ 35° đến 82° (chống lật camera xuống dưới mặt sàn), khoảng cách zoom tối thiểu 6.0m (chống đâm xuyên qua kính lái vào bên trong buồng lái).\\n"
        "- Nút 'Đặt lại góc nhìn' (Camera Reset) kích hoạt action `triggerCameraReset()` đưa camera về preset chuẩn của vai trò người dùng hiện thời.\\n"
        "**Khung giữ chỗ giao diện UI-07:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-07: Thanh trượt Carousel Chọn xe và Dock tác vụ]\\n"
        "*Hướng dẫn chụp:* Chụp khu vực phía dưới màn hình Garage hiển thị các thẻ xe thu nhỏ trong Carousel và các icon thao tác nhanh (Reset, X-Ray, Lịch đặt)."
    ),
    (
        "5.8. Hiện thực Quản lý Nhóm Đồng sở hữu và Phân bổ Cổ phần Vốn",
        "**Mục đích:** Quản lý cơ cấu thành viên nhóm xe, hiển thị biểu đồ Donut tỷ lệ phần trăm sở hữu vốn và thiết lập quy chế nhóm.\\n"
        "**Giao diện thực tế:** Trang quản lý nhóm `CoOwnerOverviewPanel.tsx` (Liên kết: **UI-08**).\\n"
        "**Hiện thực kỹ thuật:** `CoOwnershipGroupController.java` cung cấp API tra cứu thông tin nhóm và cổ phần. Hệ thống giám sát chặt chẽ bất biến toán học: tổng tỷ lệ sở hữu của các thành viên trong nhóm luôn bằng đúng 100.0000% (BR-GRP-04).\\n"
        "**Khung giữ chỗ giao diện UI-08:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-08: Quản lý Nhóm và Biểu đồ Cơ cấu Cổ phần]\\n"
        "*Hướng dẫn chụp:* Truy cập `/co-ownership/groups/{id}`. Chụp bảng danh sách thành viên nhóm kèm biểu đồ tròn phân bổ % cổ phần (tổng đúng 100%)."
    ),
    (
        "5.9. Hiện thực Quy trình Chuyển nhượng Cổ phần Nội bộ và Bảo toàn 100%",
        "**Mục đích:** Cho phép thành viên nhượng lại cổ phần cho người khác trong nhóm với giá thỏa thuận, bảo đảm giao dịch an toàn và minh bạch.\\n"
        "**Giao diện thực tế:** Hộp thoại chuyển nhượng `TransferSharesModal.tsx` (Liên kết: **UI-09**).\\n"
        "**Hiện thực kỹ thuật:** `OwnershipTransferService.java:completeTransfer()` thực hiện giao dịch trong phạm vi `@Transactional`. Sau khi chuyển nhượng, số dư cổ phần được cập nhật và tự động sinh phiên bản phụ lục hợp đồng điện tử mới (BR-GRP-05).\\n"
        "**Khung giữ chỗ giao diện UI-09:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-09: Hộp thoại Khởi tạo Chuyển nhượng Cổ phần]\\n"
        "*Hướng dẫn chụp:* Nhấn 'Chuyển nhượng cổ phần'. Chụp form nhập thành viên nhận, tỷ lệ % muốn chuyển, số tiền thỏa thuận và ô xác nhận."
    ),
    (
        "5.10. Hiện thực Ký kết Hợp đồng Điện tử Onboarding và Kích hoạt Nhóm",
        "**Mục đích:** Cung cấp quy trình gia nhập nhóm số hóa: xem điều khoản hợp đồng và thực hiện ký số điện tử mô phỏng.\\n"
        "**Giao diện thực tế:** Cổng ký hợp đồng gia nhập `JoinGroupOnboarding.tsx` (Liên kết: **UI-10**).\\n"
        "**Hiện thực kỹ thuật:** `MembershipInvitationService.java` xác thực mã mời duy nhất qua API `/api/invitations/{code}/accept`. Chữ ký điện tử mô phỏng (DEMO Digital Signature) được lưu vào bảng `contract_signatures` kèm dấu thời gian và mã băm xác thực (BR-CTR-02).\\n"
        "**Khung giữ chỗ giao diện UI-10:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-10: Cổng Ký kết Hợp đồng Điện tử Onboarding]\\n"
        "*Hướng dẫn chụp:* Mở đường dẫn thư mời `/join?code=...`. Chụp màn hình văn bản quy chế nhóm kèm ô vẽ chữ ký điện tử cảm ứng."
    ),
    (
        "5.11. Hiện thực Lịch biểu Đặt xe Tương tác và Khử Xung đột Biên",
        "**Mục đích:** Cho phép các đồng sở hữu đăng ký khung giờ sử dụng xe, khử triệt để tình trạng trùng lấn lịch trình.\\n"
        "**Giao diện thực tế:** Lịch biểu đặt xe `BookingCalendarView.tsx` (Liên kết: **UI-11**).\\n"
        "**Hiện thực kỹ thuật:** `BookingService:createBooking()` áp dụng thuật toán Boundary Overlap Guard. Kiểm tra xung đột bằng câu truy vấn JPA: `startA < endB AND startB < endA` với khoảng đệm an toàn Buffer 30 phút giữa các phiên đặt (BR-BKG-02).\\n"
        "**Khung giữ chỗ giao diện UI-11:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-11: Lịch biểu Đặt xe Tương tác và Khử Xung đột]\\n"
        "*Hướng dẫn chụp:* Truy cập `/bookings`. Chụp giao diện lịch biểu tuần hiển thị các dải màu lịch xe đã đặt của các thành viên và nút Tạo lịch đặt mới."
    ),
    (
        "5.12. Hiện thực Biên bản Bàn giao Xe Kỹ thuật số Hai bên",
        "**Mục đích:** Số hóa quy trình giao xe vật lý giữa nhân viên trạm và chủ xe: kiểm tra ODO, mức pin, chụp ảnh 4 góc xe và xác nhận điện tử hai bên.\\n"
        "**Giao diện thực tế:** Biên bản bàn giao kỹ thuật số `StaffHandoverInspectionModal.tsx` (Liên kết: **UI-12**).\\n"
        "**Hiện thực kỹ thuật:** `VehicleHandoverService.java` khởi tạo biên bản trong bảng `vehicle_handovers`. Yêu cầu đủ ảnh chụp 4 góc xe (trước, sau, trái, phải) và bắt buộc có xác nhận ký nhận của cả nhân viên và người nhận xe (BR-HDV-02).\\n"
        "**Khung giữ chỗ giao diện UI-12:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-12: Biên bản Bàn giao Xe Kỹ thuật số Hai bên]\\n"
        "*Hướng dẫn chụp:* Tại giao diện STAFF, mở phiên bàn giao xe. Chụp checklist kiểm định ODO, pin, 4 khung tải ảnh góc xe và nút Ký bàn giao."
    ),
    (
        "5.13. Hiện thực Quản lý Trụ sạc và Phiên sạc pin Thời gian thực",
        "**Mục đích:** Quản lý danh mục trụ sạc trong Garage, khởi tạo phiên sạc và cập nhật thông số năng lượng nạp.\\n"
        "**Giao diện thực tế:** Bảng điều khiển sạc pin `ChargingProgressModal.tsx` (Liên kết: **UI-13**).\\n"
        "**Hiện thực kỹ thuật & Phạm vi tích hợp:**\\n"
        "- `ChargingSessionController.java` quản lý vòng đời phiên sạc (CHARGING -> COMPLETED).\\n"
        "- *Làm rõ về cơ chế dữ liệu:* Các thông số dòng điện, điện áp và sản lượng kWh hiện được điều khiển bằng mô phỏng phần mềm thông qua `ChargingProgressService.java` và `TelemetryIngressController.java`. Kiến trúc được thiết kế chuẩn hóa sẵn sàng kết nối giao thức sạc chuẩn OCPP 2.0.1 với phần cứng trụ sạc thực địa trong giai đoạn thương mại hóa tiếp theo.\\n"
        "**Khung giữ chỗ giao diện UI-13:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-13: Bảng điều khiển Giám sát Sạc pin Thời gian thực]\\n"
        "*Hướng dẫn chụp:* Nhấn vào trụ sạc đang hoạt động. Chụp bảng đồng hồ đo công suất sạc tức thời (kW), điện năng nạp (kWh) và thời gian sạc ước tính."
    ),
    (
        "5.14. Hiện thực Quản lý Kho Năng lượng Xe và Hạch toán Giá vốn WAC",
        "**Mục đích:** Quản lý kho lưu trữ điện năng của pin xe điện, tự động tính toán lại đơn giá bình quân gia quyền (WAC) sau mỗi lần nạp sạc.\\n"
        "**Giao diện thực tế:** Báo cáo kho năng lượng `EnergyInventoryReportPanel.tsx` (Liên kết: **UI-14**).\\n"
        "**Hiện thực kỹ thuật:** `VehicleEnergyInventoryService.java` thực thi công thức WAC chuẩn:\\n"
        "$$E_{\\\\text{stored}} = E_{\\\\text{grid}} \\\\times \\\\eta \\\\quad (\\\\eta = 0.92)\\\\quad;\\\\quad C_{\\\\text{charge}} = E_{\\\\text{grid}} \\\\times \\\\text{tariff}$$\\n"
        "$$\\\\text{WAC}_{\\\\text{mới}} = \\\\frac{E_{\\\\text{cũ}} \\\\times \\\\text{WAC}_{\\\\text{cũ}} + C_{\\\\text{charge}}}{E_{\\\\text{cũ}} + E_{\\\\text{stored}}}$$\\n"
        "Đơn giá điện lưới EVN 3.850 đ/kWh và hiệu suất 92% được cài đặt làm tham số cấu hình mô phỏng mặc định (`DEFAULT_ELECTRICITY_TARIFF_VND`, `CHARGING_EFFICIENCY`). Khi nhân viên sạc vận hành, `chargingCost = 0` nhưng đơn giá kho vẫn được bảo toàn để tránh làm loãng giá vốn chuyến đi về 0.\\n"
        "**Khung giữ chỗ giao diện UI-14:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-14: Báo cáo Kho Năng lượng Xe và Đơn giá WAC]\\n"
        "*Hướng dẫn chụp:* Mở `/vehicles/{id}/energy-inventory`. Chụp bảng tổng kết số dư kho năng lượng khả dụng (kWh), giá bình quân WAC (đ/kWh) và lịch sử giao dịch nạp/xả."
    ),
    (
        "5.15. Hiện thực Bảng điều khiển Hành trình Chuyến đi Đang chạy (ActiveTrip Panel)",
        "**Mục đích:** Hỗ trợ người lái theo dõi thời gian thực chuyến đi: đồng hồ đếm ngược thời gian còn lại, quãng đường đã chạy, mức tiêu hao pin và nút xin gia hạn hoặc trả xe.\\n"
        "**Giao diện thực tế:** Bảng điều khiển hành trình `ActiveTripDetailPanel.tsx` (Liên kết: **UI-15**).\\n"
        "**Hiện thực kỹ thuật:** `useTripCountdown.ts` xử lý đếm ngược thời gian thực trên máy khách, cảnh báo khi còn dưới 15 phút. Khởi hành chuyến đi kiểm tra mức pin xe >= 20% (BR-TRP-01).\\n"
        "**Khung giữ chỗ giao diện UI-15:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-15: Bảng điều khiển Hành trình Chuyến đi Đang chạy]\\n"
        "*Hướng dẫn chụp:* Trong chuyến đi đang diễn ra, chụp bảng ActiveTrip hiển thị đồng hồ đếm ngược giờ trả xe, số km đã chạy và các nút chức năng Gia hạn / Trả xe."
    ),
    (
        "5.16. Hiện thực Nghiệm thu Trả xe và Hạch toán Tiền điện Chuyến đi",
        "**Mục đích:** Kết thúc chuyến đi, nhân viên trạm kiểm tra hiện trạng xe, ghi nhận ODO/Pin cuối và tính toán chi phí điện năng tiêu thụ.\\n"
        "**Giao diện thực tế:** Hộp thoại nghiệm thu trả xe `StaffReturnInspectionModal.tsx` (Liên kết: **UI-16**).\\n"
        "**Hiện thực kỹ thuật:** `TripService:confirmReturn()` ghi nhận chỉ số ODO cuối và mức pin kết thúc. Tiền điện chuyến đi được tính tự động: $C_{\\\\text{điện}} = \\\\Delta E \\\\times \\\\text{WAC}$, gán 100% trách nhiệm cho người lái theo chính sách USER_RESPONSIBILITY (BR-TRP-03, BR-INV-03).\\n"
        "**Khung giữ chỗ giao diện UI-16:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-16: Màn hình Nghiệm thu Trả xe và Hạch toán Tiền điện]\\n"
        "*Hướng dẫn chụp:* Mở form nghiệm thu trả xe của STAFF. Chụp các trường ODO kết thúc, mức pin kết thúc, sản lượng kWh tiêu thụ và số tiền điện tạm tính."
    ),
    (
        "5.17. Hiện thực Phân bổ Chi phí Vận hành Chung theo Thuật toán Hare-Niemeyer",
        "**Mục đích:** Phân chia hóa đơn bảo dưỡng, sửa chữa, bảo hiểm cho các thành viên theo tỷ lệ % cổ phần, làm tròn đến từng đồng VND bảo đảm khớp 100% tổng tiền.\\n"
        "**Giao diện thực tế:** Hộp thoại phân bổ chi phí `ExpenseBreakdownModal.tsx` (Liên kết: **UI-17**).\\n"
        "**Hiện thực kỹ thuật:** `ExpenseShareService:calculateOwnershipRatioShares()` chia phần nguyên, sắp xếp phần dư giảm dần và cộng 1 VND cho thành viên có tỷ lệ cổ phần lớn nhất cho đến khi khớp chính xác số tiền hóa đơn gốc (BR-EXP-01).\\n"
        "**Khung giữ chỗ giao diện UI-17:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-17: Bảng Phân bổ Chi phí Chi tiết theo Thuật toán Hare-Niemeyer]\\n"
        "*Hướng dẫn chụp:* Mở chi tiết một khoản chi phí bảo dưỡng. Chụp bảng tính hiển thị cột Tỷ lệ cổ phần, Số tiền nguyên và cột Số tiền làm tròn khớp tổng 100%."
    ),
    (
        "5.18. Hiện thực Cơ chế Phân bổ Chi phí Trực tiếp và Phân định Nghĩa vụ Tài chính Cá nhân (Direct Expense Allocation)",
        "**Mục đích:** Trong kiến trúc tài chính hiện hành của EVShare 3D, hệ thống áp dụng cơ chế **Phân bổ chi phí trực tiếp (Direct Expense Allocation)** thay vì vận hành mô hình Quỹ bảo trì chung tiền trạm (Shared Maintenance Fund). Mọi khoản chi phí sau khi được phê duyệt sẽ được chia nhỏ thành các nghĩa vụ tài chính cá nhân (`ExpenseShare`) gán trực tiếp cho từng thành viên.\\n\\n"
        "**Phân loại chính sách phân bổ:**\\n"
        "1. *Phân bổ theo tỷ lệ cổ phần (`OWNERSHIP_RATIO`):* Áp dụng cho các chi phí cố định, chi phí bảo dưỡng định kỳ, đăng kiểm, bảo hiểm, thay thế linh kiện hao mòn. Sử dụng thuật toán Hare-Niemeyer phân chia đến từng đồng VND, bảo đảm tổng nghĩa vụ phân bổ khớp chính xác 100% với số tiền hóa đơn (`SUM(share_amount) == expense.amount`).\\n"
        "2. *Phân bổ theo trách nhiệm người lái (`USER_RESPONSIBILITY`):* Áp dụng cho chi phí điện năng tiêu thụ trong chuyến đi (`calculateTripEnergyCost`), tiền phạt vi phạm giao thông hoặc tổn hại thân vỏ do lỗi cá nhân trong phiên sử dụng. Toàn bộ 100% chi phí được gán trực tiếp cho người lái chuyến đi đó.\\n"
        "3. *Chính sách hỗn hợp (`USAGE_AND_CAPITAL`):* Kết hợp giữa số km di chuyển thực tế và tỷ lệ vốn sở hữu.\\n\\n"
        "**Phòng chống trùng lặp và tính lũy đẳng (Idempotency):**\\n"
        "- Phương thức `ExpenseShareService:generateSharesForExpense()` kiểm tra `existsByExpenseId()` để chống tạo trùng lặp nghĩa vụ chi phí. Chỉ các khoản chi ở trạng thái `APPROVED` mới được phép sinh nghĩa vụ tài chính.\\n"
        "- Đối với chi phí năng lượng chuyến đi, `ExpenseRepository:findByRelatedTripId()` bảo đảm mỗi chuyến đi chỉ được phát hành duy nhất một hóa đơn năng lượng.\\n\\n"
        "**Minh bạch hóa hồ sơ tài chính lịch sử:**\\n"
        "Các thực thể `SharedFund`, `FundContribution`, `FundTransaction` từ giai đoạn thiết kế ban đầu được lưu giữ trong hệ thống như hồ sơ tham chiếu lịch sử và quỹ dự phòng tùy chọn, không tham gia vào luồng xử lý hạch toán nợ chi phí vận hành hằng ngày."
    ),
    (
        "5.19. Hiện thực Nộp và Đối soát Thanh toán Nghĩa vụ Tài chính cá nhân (No Self-Approval)",
        "**Mục đích:** Thành viên chuyển khoản thanh toán nợ cá nhân, nhân viên kiểm tra đối soát gạch nợ. Chặn nghiêm ngặt việc tự phê duyệt nợ của chính mình.\\n"
        "**Giao diện thực tế:** Màn hình thanh toán nghĩa vụ nợ `PaymentSubmissionModal.tsx` (Liên kết: **UI-18**).\\n"
        "**Hiện thực kỹ thuật:** `PersonalPaymentService:verifyPayment()` kiểm tra `payment.userId != staffId` (BR-EXP-02). Khi duyệt thành công, gạch nợ `expense_shares.status = SETTLED`. Cung cấp mã VietQR động hỗ trợ chuyển khoản chính xác nội dung.\\n"
        "**Khung giữ chỗ giao diện UI-18:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-18: Màn hình Thanh toán Nghĩa vụ Tài chính và Mã VietQR]\\n"
        "*Hướng dẫn chụp:* Nhấn 'Thanh toán nợ' tại bảng công nợ. Chụp màn hình hiển thị mã VietQR động, số tiền chính xác và ô tải ảnh biên lai chuyển tiền. Che mờ số tài khoản ngân hàng thực tế."
    ),
    (
        "5.20. Hiện thực Lập lịch Bảo dưỡng và Khóa khung giờ sử dụng xe (Maintenance Lock)",
        "**Mục đích:** Lập lệnh bảo dưỡng định kỳ và tự động khóa khung giờ trên lịch biểu nhóm để chống người khác đặt xe trong thời gian xe nằm xưởng.\\n"
        "**Tác nhân:** Nhân viên kỹ thuật trạm.\\n"
        "**Hiện thực kỹ thuật:** Khi phiếu bảo dưỡng được duyệt, `BookingService` tạo khối khóa `MAINTENANCE` trên lịch biểu xe (BR-BOOK-03)."
    ),
    (
        "5.21. Hiện thực Cơ chế Biểu quyết Dân chủ theo Trọng số Cổ phần (% Equity Voting)",
        "**Mục đích:** Lấy ý kiến tập thể, thành viên bỏ phiếu với trọng số điểm tương ứng chính xác với % cổ phần nắm giữ.\\n"
        "**Giao diện thực tế:** Giao diện bỏ phiếu biểu quyết dân chủ `VoteActionModal.tsx` (Liên kết: **UI-19**).\\n"
        "**Hiện thực kỹ thuật:** `VoteProposalService:castVote()` gán `voteWeight = share.percentage`. Bỏ phiếu một lần duy nhất không thể sửa đổi (BR-VOTE-05). Ngưỡng thông qua quá bán > 50% (BR-VOTE-02).\\n"
        "**Khung giữ chỗ giao diện UI-19:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-19: Giao diện Bỏ phiếu Biểu quyết Dân chủ theo Trọng số Cổ phần]\\n"
        "*Hướng dẫn chụp:* Truy cập `/voting/proposals/{id}`. Chụp form bỏ phiếu hiển thị các lựa chọn Đồng ý/Phản đối kèm tỷ lệ trọng số voteWeight của cá nhân."
    ),
    (
        "5.22. Hiện thực Trung tâm Giải quyết Khiếu nại và Hòa giải viên độc lập (Dispute Mediation)",
        "**Mục đích:** Phòng hòa giải trực tuyến, nộp bằng chứng, phân công nhân viên trung gian độc lập và thực thi bồi thường.\\n"
        "**Giao diện thực tế:** Phòng hòa giải khiếu nại trực tuyến `DisputeChatRoom.tsx` (Liên kết: **UI-20**).\\n"
        "**Hiện thực kỹ thuật:** Tự động phát hiện trả xe muộn điền trước hồ sơ (BR-DISP-01). Hòa giải viên không được là thành viên nhóm xe (BR-DISP-02). Hỗ trợ nộp ảnh bằng chứng và đối chiếu tổn hại 3D.\\n"
        "**Khung giữ chỗ giao diện UI-20:**\\n"
        "[KHUNG GIỮ CHỖ GIAO DIỆN UI-20: Phòng Hòa giải Tranh chấp Trực tuyến và Đối chiếu Bằng chứng]\\n"
        "*Hướng dẫn chụp:* Mở `/disputes/{id}`. Chụp giao diện phòng hòa giải gồm khung chat trao đổi giữa hai bên, danh sách bằng chứng ảnh chụp và đề xuất bồi thường."
    ),
    (
        "5.23. Hiện thực Bảng điều hành Trực ban của Nhân viên (Staff Dashboard & Operational Carousel)",
        "**Mục đích:** Hỗ trợ nhân viên trạm theo dõi các công việc trực ca cần xử lý: đón xe trả, giao xe đi, các phiên sạc pin vận hành và hồ sơ khiếu nại mới.\\n"
        "**Tác nhân:** Nhân viên vận hành (ROLE_STAFF).\\n"
        "**Hiện thực kỹ thuật:** `StaffOperationalCarousel.tsx` hiển thị danh sách nhiệm vụ ưu tiên theo thời gian thực, tích hợp bộ lọc trạng thái xe trực ban."
    ),
    (
        "5.24. Hiện thực Bảng điều khiển Quản trị hệ thống và Nhật ký Kiểm toán an toàn (Admin Audit Logs)",
        "**Mục đích:** Cung cấp công cụ quản trị cấp cao cho Admin: xem KPI Dashboard, phân quyền tài khoản và tra cứu nhật ký kiểm toán.\\n"
        "**Tác nhân:** Quản trị viên (ROLE_ADMIN).\\n"
        "**Hiện thực kỹ thuật:** `AdminController:getAuditLogs()` truy vấn bảng `audit_logs` lưu IP, người thực hiện, hành động và trạng thái dữ liệu (BR-SEC-02)."
    ),
    (
        "5.25. Hiện thực Tích hợp Trợ lý ảo AI (AI Zone Panel & Regulatory Lookup)",
        "**Mục đích:** Cung cấp chatbot trợ lý ảo hỗ trợ người dùng tra cứu quy chế nhóm, hướng dẫn sử dụng xe và giải đáp thắc mắc tài chính thông minh.\\n"
        "**Tác nhân:** Đồng sở hữu và Người dùng mới.\\n"
        "**Hiện thực kỹ thuật:** `AiZonePanel.tsx` giao tiếp với `AiAssistantController:chat()`, áp dụng mô hình RAG (Retrieval-Augmented Generation) nạp tài liệu quy chế nhóm để trả lời chính xác, có cơ chế xử lý Timeout an toàn khi mô hình bận."
    )
]

def get_chapter_5_content():
    return {
        "title": CHAPTER_5_TITLE,
        "intro": CHAPTER_5_INTRO,
        "sections": CHAPTER_5_SECTIONS
    }
''')
    print("Generated v5_chapter5.py successfully.")

if __name__ == "__main__":
    build_chapter5()
