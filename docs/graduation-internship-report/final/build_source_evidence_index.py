# -*- coding: utf-8 -*-
"""
build_source_evidence_index.py - Tạo SOURCE_EVIDENCE_INDEX.md
Ánh xạ toàn bộ tuyên bố kiến trúc, nghiệp vụ và công thức tới mã nguồn thực tế
"""
import os

OUTPUT_FILE = r"D:\EV3D\docs\graduation-internship-report\final\SOURCE_EVIDENCE_INDEX.md"

content = """# CHỈ MỤC MINH CHỨNG MÃ NGUỒN THỰC TẾ (SOURCE EVIDENCE INDEX)

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Báo cáo:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản Hoàn Thiện V2.0  
**Mục tiêu:** Ánh xạ tường minh từng tuyên bố kiến trúc, mô hình dữ liệu, bất biến nghiệp vụ và công thức tài chính tới các tệp mã nguồn thực tế trong dự án (Backend Java Spring Boot và Frontend React Three.js).

---

## 1. Phân Hệ Xác Thực & Phân Quyền (Authentication & Authorization)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Security Filter** | Cấu hình bộ lọc bảo mật JWT, phân quyền truy cập URL theo vai trò | `backend/src/main/java/com/evshare/config/SecurityConfig.java` |
| **JWT Filter** | Trích xuất token Bearer, giải mã Claims và nạp UserPrincipal vào SecurityContext | `backend/src/main/java/com/evshare/security/JwtAuthenticationFilter.java` |
| **Token Provider** | Sinh Access Token (24h) và Refresh Token, ký HMAC SHA-512 | `backend/src/main/java/com/evshare/security/JwtTokenProvider.java` |
| **Auth Controller** | Xử lý API đăng nhập, đăng ký, refresh token, quên mật khẩu | `backend/src/main/java/com/evshare/controller/AuthController.java` |
| **Auth Service** | Kiểm tra thông tin người dùng qua AuthenticationManager, quản lý Refresh Token | `backend/src/main/java/com/evshare/service/AuthService.java` |
| **User Entity** | Thực thể bảng `users` lưu thông tin định danh, BCrypt hash và vai trò | `backend/src/main/java/com/evshare/model/User.java` |
| **Refresh Token Entity** | Lưu trữ mã làm mới với thời gian sống xác định trong bảng `refresh_tokens` | `backend/src/main/java/com/evshare/model/RefreshToken.java` |
| **Frontend Auth Store** | Quản lý trạng thái đăng nhập, lưu accessToken vào memory và localStorage | `frontend/src/store/authStore.ts` |
| **Auth API Client** | Axios interceptor tự động gắn `Authorization: Bearer <token>` vào request | `frontend/src/services/api.ts` |

---

## 2. Phân Hệ Đồng Sở Hữu & Tỷ Lệ Vốn (Co-Ownership & Equity Ratios)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Co-Ownership Controller** | API quản lý nhóm, cổ phần, đề xuất chuyển nhượng và biểu quyết | `backend/src/main/java/com/evshare/controller/CoOwnershipController.java` |
| **Co-Ownership Service** | Kiểm tra bất biến tổng vốn: $\sum \text{Equity} = 100.0000\%$, xử lý chuyển nhượng nguyên tử | `backend/src/main/java/com/evshare/service/CoOwnershipService.java` |
| **Group Entity** | Thực thể `co_ownership_groups` đại diện nhóm sở hữu phương tiện | `backend/src/main/java/com/evshare/model/CoOwnershipGroup.java` |
| **Ownership Share Entity** | Thực thể `ownership_shares` lưu tỷ lệ phần trăm sở hữu của từng thành viên | `backend/src/main/java/com/evshare/model/OwnershipShare.java` |
| **Transfer Request Entity** | Quản lý vòng đời chuyển nhượng: `INITIATED` -> `CONSENTED` -> `APPROVED` | `backend/src/main/java/com/evshare/model/OwnershipTransferRequest.java` |
| **Frontend Co-Ownership UI**| Giao diện hiển thị danh sách cổ đông, biểu đồ cơ cấu vốn và form chuyển nhượng | `frontend/src/pages/co-owner/CoOwnershipPage.tsx` |

---

## 3. Phân Hệ Quản Lý Phương Tiện & Bàn Giao Kỹ Thuật (Vehicles & Handover)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Vehicle Controller** | API danh mục xe, cập nhật ODO, theo dõi SOC và cấu hình thông số kỹ thuật | `backend/src/main/java/com/evshare/controller/VehicleController.java` |
| **Vehicle Service** | Điều phối trạng thái xe (`AVAILABLE`, `RESERVED`, `IN_USE`, `CHARGING`, `MAINTENANCE`) | `backend/src/main/java/com/evshare/service/VehicleService.java` |
| **Handover Controller** | API nhân viên xác minh ODO, % pin và chủ xe ký nhận bàn giao | `backend/src/main/java/com/evshare/controller/VehicleHandoverController.java` |
| **Handover Service** | Ghi nhận biên bản bàn giao, cập nhật xe sang `RESERVED` trước khởi hành | `backend/src/main/java/com/evshare/service/VehicleHandoverService.java` |
| **Vehicle Entity** | Thực thể `vehicles` lưu biển số, số khung (VIN), dung lượng pin và ODO hiện tại | `backend/src/main/java/com/evshare/model/Vehicle.java` |
| **Vehicle Handover Entity**| Thực thể `vehicle_handovers` lưu chữ ký, biên bản và ảnh bàn giao | `backend/src/main/java/com/evshare/model/VehicleHandover.java` |

---

## 4. Phân Hệ Đặt Lịch, Chuyến Đi & Khử Xung Đột (Booking, Trips & Conflict Resolution)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Booking Controller** | API tạo đặt lịch, hủy lịch và tra cứu khung giờ trống của phương tiện | `backend/src/main/java/com/evshare/controller/BookingController.java` |
| **Booking Service** | Thuật toán khử xung đột: $T_{start} < B_{end} \land T_{end} > B_{start}$ trên trạng thái CONFIRMED | `backend/src/main/java/com/evshare/service/BookingService.java` |
| **Booking Repository** | Truy vấn SQL kiểm tra giao thoa khoảng thời gian sử dụng xe | `backend/src/main/java/com/evshare/repository/BookingRepository.java` |
| **Trip Controller** | API bắt đầu chuyến đi (check-in ODO/pin), yêu cầu trả xe và hoàn tất chuyến | `backend/src/main/java/com/evshare/controller/TripController.java` |
| **Trip Service** | Xử lý vòng đời chuyến đi: `IN_PROGRESS` -> `RETURN_REQUESTED` -> `COMPLETED` | `backend/src/main/java/com/evshare/service/TripService.java` |
| **Trip Entity** | Thực thể `trips` lưu ODO/Pin đầu-cuối, thời gian khởi hành và kết thúc | `backend/src/main/java/com/evshare/model/Trip.java` |

---

## 5. Phân Hệ Kiểm Định Kỹ Thuật & Giám Định Tổn Hại (Inspection & Damages)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Inspection Controller** | API lập biên bản kiểm định khi nhận xe hoặc trước/sau chuyến đi | `backend/src/main/java/com/evshare/controller/VehicleInspectionController.java` |
| **Inspection Service** | Ghi nhận checklist kiểm tra kỹ thuật và liên kết các điểm tổn hại | `backend/src/main/java/com/evshare/service/VehicleInspectionService.java` |
| **Inspection Entity** | Thực thể `vehicle_inspections` lưu kết quả tổng thể và thông tin thanh tra viên | `backend/src/main/java/com/evshare/model/VehicleInspection.java` |
| **Damage Entity** | Thực thể `vehicle_inspection_damages` lưu vị trí bộ phận, mức độ nghiêm trọng, ảnh | `backend/src/main/java/com/evshare/model/VehicleInspectionDamage.java` |

---

## 6. Phân Hệ Phiên Sạc & Kho Năng Lượng WAC (Charging & Energy Inventory)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Charging Controller** | API khởi tạo, cập nhật tiến trình và hoàn tất phiên sạc điện | `backend/src/main/java/com/evshare/controller/ChargingSessionController.java` |
| **Charging Service** | Quản lý trạng thái phiên sạc, kích hoạt nạp kho năng lượng khi sạc xong | `backend/src/main/java/com/evshare/service/ChargingSessionService.java` |
| **Energy Inventory Service**| Triển khai công thức WAC, trừ 10% tổn hao biến đổi: $E_{stored} = E_{delivered} \times 0.90$ | `backend/src/main/java/com/evshare/service/VehicleEnergyInventoryService.java` |
| **Energy Inventory Entity** | Thực thể `vehicle_energy_inventories` lưu điện năng khả dụng và đơn giá bình quân | `backend/src/main/java/com/evshare/model/VehicleEnergyInventory.java` |
| **Energy Transaction Entity**| Thực thể `vehicle_energy_transactions` lưu vết lịch sử INFLOW (sạc) và OUTFLOW (chuyến đi) | `backend/src/main/java/com/evshare/model/VehicleEnergyTransaction.java` |

---

## 7. Phân Hệ Tài Chính, Phân Bổ Chi Phí & Thanh Toán Demo (Expenses & Payments)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Expense Allocation Controller**| API tạo khoản chi phí, phân bổ theo chính sách và theo dõi nghĩa vụ nợ | `backend/src/main/java/com/evshare/controller/ExpenseAllocationController.java` |
| **Expense Allocation Service** | Phân bổ chính xác theo chính sách `EQUITY_RATIO` hoặc `USER_RESPONSIBILITY` | `backend/src/main/java/com/evshare/service/ExpenseAllocationService.java` |
| **Personal Payment Service** | Ghi nhận chứng từ chuyển khoản demo và nhân viên xác minh tất toán | `backend/src/main/java/com/evshare/service/PersonalPaymentService.java` |
| **Expense Entity** | Thực thể `expenses` lưu tổng số tiền, phân loại chi phí, hóa đơn đính kèm | `backend/src/main/java/com/evshare/model/Expense.java` |
| **Expense Share Entity** | Thực thể `expense_shares` lưu phần tiền phải trả của từng chủ sở hữu | `backend/src/main/java/com/evshare/model/ExpenseShare.java` |

---

## 8. Phân Hệ Đồ Họa 3D Tương Tác Three.js & Digital Twin (Frontend 3D)

| Thành Phần Nghiệp Vụ | Mô Tả & Bất Biến Kỹ Thuật | Tệp Mã Nguồn Thực Tế (Source File Path) |
|:---|:---|:---|
| **Garage 3D Scene** | Khung cảnh 3D tích hợp xe điện VinFast VF8, đèn Studio, phản xạ sàn PBR | `frontend/src/components/garage3d/GarageScene.tsx` |
| **Vehicle 3D Model** | Tải mô hình GLB bằng `useGLTF`, tối ưu hóa phân rã bộ phận và GPU mesh | `frontend/src/components/garage3d/VehicleModel.tsx` |
| **Raycaster & Hotspots** | Bắt sự kiện click chuột qua Raycaster, hiển thị điểm nóng kiểm định trực quan | `frontend/src/components/garage3d/DamageHotspots.tsx` |
| **Camera & Controls** | Điều khiển camera quỹ đạo bằng `OrbitControls`, giới hạn góc nhìn và zoom | `frontend/src/components/garage3d/CameraRig.tsx` |
| **Post-Processing** | Hiệu ứng hình ảnh Bloom, SSAO và Color Grading tăng tính chân thực | `frontend/src/components/garage3d/PostProcessing.tsx` |

---

## 9. Cơ Sở Dữ Liệu & Bản Di Chuyển Schema (Flyway Migrations)

Toàn bộ 46 bản di chuyển cấu trúc bảng dữ liệu được kiểm định trực tiếp tại:
- Thư mục nguồn: `backend/src/main/resources/db/migration/`
- Từ `V1__init_schema.sql` đến `V46__add_smart_contract_ledger_and_indexes.sql`.
- Đảm bảo 100% các cột, khóa ngoại, ràng buộc toàn vẹn và chỉ mục đã được tài liệu hóa chính xác trong Báo cáo tốt nghiệp.
"""

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated {OUTPUT_FILE}")
