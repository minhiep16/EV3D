# -*- coding: utf-8 -*-
"""
embed_and_build.py
Tự động cập nhật file Markdown với Danh mục Hình vẽ, Bảng biểu và nhúng các sơ đồ PNG,
sau đó gọi trình tạo file Word (.docx) và PDF (.pdf).
"""

import os
import re

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report"
MD_PATH = os.path.join(BASE_DIR, "BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D.md")

with open(MD_PATH, "r", encoding="utf-8") as f:
    text = f.read()

# 1. Bổ sung Danh mục Hình vẽ và Danh mục Bảng biểu vào phần Front Matter (sau Mục lục)
list_of_figures_tables = """
<pagebreak/>

---

## DANH MỤC HÌNH VẼ (LIST OF FIGURES)

| Số Hiệu Hình | Tên Hình Vẽ Minh Họa / Sơ Đồ Kỹ Thuật | Vị Trí Trong Báo Cáo |
| :---: | :--- | :---: |
| **Hình 1.1** | Sơ đồ tiến độ thực hiện đề tài tốt nghiệp (Biểu đồ Gantt) | Chương 1 (Mục 1.8) |
| **Hình 3.1** | Sơ đồ Use Case tổng quát toàn hệ thống EVShare 3D | Chương 3 (Mục 3.7) |
| **Hình 3.2** | Sơ đồ hoạt động phân làn quy trình Đặt lịch sử dụng xe | Chương 3 (Mục 3.10) |
| **Hình 3.3** | Sơ đồ hoạt động phân làn quy trình Trả xe, Kiểm tra kỹ thuật và Đối soát năng lượng | Chương 3 (Mục 3.10) |
| **Hình 4.1** | Sơ đồ kiến trúc tổng thể Full-Stack hệ thống EVShare 3D | Chương 4 (Mục 4.1) |
| **Hình 4.2** | Sơ đồ lớp miền dữ liệu thực thể Java hệ thống EVShare 3D | Chương 4 (Mục 4.6) |
| **Hình 4.3** | Lược đồ thực thể quan hệ cơ sở dữ liệu (ERD) EVShare 3D | Chương 4 (Mục 4.4) |
| **Hình 4.4** | Sơ đồ tuần tự quy trình Đặt lịch và Khử xung đột thời gian | Chương 4 (Mục 4.7) |
| **Hình 4.5** | Sơ đồ tuần tự quy trình Hoàn tất sạc và Cập nhật tồn kho năng lượng WAC | Chương 4 (Mục 4.7) |
| **Hình 4.6** | Sơ đồ máy trạng thái vòng đời chuyến đi và phương tiện | Chương 4 (Mục 4.9) |
| **Hình 4.7** | Sơ đồ kiến trúc bảo mật xác thực JWT và chuỗi lọc Spring Security | Chương 4 (Mục 4.11) |
| **Hình 4.8** | Sơ đồ triển khai phần cứng và hạ tầng máy chủ hệ thống EVShare 3D | Chương 4 (Mục 4.13) |
| **Hình 5.1** | Chu trình 8 bước quản lý vòng đời chuyến đi khép kín | Chương 5 (Mục 5.9) |
| **Hình 5.2** | Giao diện Màn hình Đăng nhập 3D (AuthScene) | Chương 5 (Mục 5.3) |
| **Hình 5.3** | Giao diện Không gian Virtual Garage 3D trên trình duyệt Web | Chương 5 (Mục 5.4) |
| **Hình 5.4** | Giao diện Bảng điều khiển Đặt xe (CoOwnerBookingPanel) | Chương 5 (Mục 5.8) |
| **Hình 5.5** | Giao diện Bóc tách phụ tùng và Chế độ nhìn xuyên Pin X-Ray 3D | Chương 5 (Mục 5.7) |
| **Hình 5.6** | Giao diện Biên bản Bàn giao xe kỹ thuật (StaffHandoverModal) | Chương 5 (Mục 5.6) |
| **Hình 5.7** | Giao diện Kiểm tra kỹ thuật và Gắn điểm hư hỏng 3D Hotspot | Chương 5 (Mục 5.10) |
| **Hình 5.8** | Giao diện Quản lý Khu vực Tài chính và Thanh toán DEMO | Chương 5 (Mục 5.13) |

<pagebreak/>

---

## DANH MỤC BẢNG BIỂU (LIST OF TABLES)

| Số Hiệu Bảng | Tên Bảng Biểu Kỹ Thuật | Vị Trí Trong Báo Cáo |
| :---: | :--- | :---: |
| **Bảng 1.1** | Kế hoạch và tiến độ thực tập đề xuất (Proposed Internship Gantt Schedule) | Chương 1 (Mục 1.8) |
| **Bảng 2.1** | Bảng phân tích so sánh các công nghệ đồ họa 3D trên Web | Chương 2 (Mục 2.9) |
| **Bảng 2.2** | Bảng tổng hợp các thư viện và công nghệ cốt lõi trong hệ thống EVShare 3D | Chương 2 (Mục 2.15) |
| **Bảng 3.1** | Ma trận phân quyền chức năng chi tiết trong hệ thống EVShare 3D | Chương 3 (Mục 3.3) |
| **Bảng 3.2** | Danh mục đặc tả yêu cầu chức năng của hệ thống EVShare 3D | Chương 3 (Mục 3.4) |
| **Bảng 4.1** | Từ điển dữ liệu bảng `vehicles` (Danh mục phương tiện điện) | Chương 4 (Mục 4.5) |
| **Bảng 4.2** | Từ điển dữ liệu bảng `bookings` (Lịch đặt sử dụng xe) | Chương 4 (Mục 4.5) |
| **Bảng 4.3** | Từ điển dữ liệu bảng `vehicle_energy_inventories` (Kho tồn năng lượng) | Chương 4 (Mục 4.5) |
| **Bảng 4.4** | Từ điển dữ liệu bảng `expenses` (Hóa đơn chi phí phương tiện) | Chương 4 (Mục 4.5) |
| **Bảng 4.5** | Danh mục các Endpoint API RESTful tiêu biểu trong hệ thống EVShare 3D | Chương 4 (Mục 4.10) |
| **Bảng 4.6** | Ma trận truy xuất nguồn gốc yêu cầu của hệ thống EVShare 3D | Chương 4 (Mục 4.14) |
| **Bảng 5.1** | Ma trận tổng kết mức độ hoàn thiện các phân hệ của EVShare 3D | Chương 5 (Mục 5.25) |
| **Bảng 6.1** | Bảng kiểm tra các ràng buộc toàn vẹn cơ sở dữ liệu của EVShare 3D | Chương 6 (Mục 6.13) |
| **Bảng 6.2** | Danh mục rà soát an toàn thông tin theo chuẩn OWASP Top 10 | Chương 6 (Mục 6.14) |
| **Bảng 6.3** | Bảng chỉ tiêu và kế hoạch đo lường hiệu năng hệ thống EVShare 3D | Chương 6 (Mục 6.15) |
| **Bảng 6.4** | Thống kê tổng hợp số lượng ca kiểm thử theo phân hệ nghiệp vụ | Chương 6 (Mục 6.17) |
| **Bảng 7.1** | Bảng đối chiếu mức độ đáp ứng mục tiêu nghiên cứu của đề tài | Chương 7 (Mục 7.2) |
| **Bảng B.1** | Từ điển dữ liệu bảng `trips` (Quản lý chu trình di chuyển thực tế) | Phụ lục B |
| **Bảng B.2** | Từ điển dữ liệu bảng `damage_records` (Bản đồ hóa hư hỏng 3D) | Phụ lục B |
"""

# Chèn Danh mục hình vẽ và bảng biểu vào trước "# CHƯƠNG 1:"
if "## DANH MỤC HÌNH VẼ" not in text:
    target_str = "# CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ ĐƠN VỊ THỰC TẬP"
    text = text.replace(target_str, list_of_figures_tables + "\n<pagebreak/>\n\n" + target_str, 1)

# 2. Nhúng Hình 1.1 vào Chương 1 (Mục 1.8)
fig1_1_embed = """
![Hình 1.1: Sơ đồ tiến độ thực hiện đề tài tốt nghiệp (Biểu đồ Gantt)](diagrams/activity/project_gantt_roadmap.png)
*Hình 1.1. Sơ đồ tiến độ thực hiện đề tài tốt nghiệp (Biểu đồ Gantt).*

Hình 1.1 biểu diễn trực quan kế hoạch thực tập tốt nghiệp 16 tuần qua 4 giai đoạn then chốt: Thiết lập nền tảng & thiết kế CSDL (Tuần 1-4); Phát triển Backend cốt lõi & động cơ khử xung đột (Tuần 5-8); Phát triển Virtual Garage 3D & động cơ tài chính (Tuần 9-12); Tích hợp hoàn thiện, thiết kế 100 ca kiểm thử & đóng gói báo cáo (Tuần 13-16).
"""
if "![Hình 1.1" not in text:
    # Chèn sau Bảng 1.1
    b1_1_end = "*Bảng 1.1. Kế hoạch và tiến độ thực tập đề xuất (Proposed Internship Gantt Schedule).*"
    if b1_1_end in text:
        text = text.replace(b1_1_end, b1_1_end + "\n\n" + fig1_1_embed, 1)

# 3. Nhúng Hình 3.1 vào Chương 3 (Mục 3.7)
fig3_1_embed = """
![Hình 3.1: Sơ đồ Use Case tổng quát toàn hệ thống EVShare 3D](diagrams/use-case/overall_system_usecase.png)
*Hình 3.1. Sơ đồ Use Case tổng quát toàn hệ thống EVShare 3D.*

Hình 3.1 mô hình hóa toàn diện các Use Case của 3 tác nhân người dùng (Quản trị viên ADMIN, Nhân viên điều hành STAFF, Chủ đồng sở hữu CO_OWNER) tương tác với 4 phân hệ lớn: Vận hành & Đặt xe, Năng lượng & Trạm sạc, Quản trị tài chính chi phí, và Pháp lý - Hợp đồng - Biểu quyết tập thể.
"""
target_3_1 = "Sơ đồ Use Case tổng quát phản ánh toàn bộ các tương tác giữa 3 tác nhân người dùng với 4 phân hệ lớn của hệ thống EVShare 3D (được thiết kế và lưu trữ chi tiết trong tệp `diagrams/use-case/overall_system_usecase.puml`)."
if target_3_1 in text:
    text = text.replace(target_3_1, fig3_1_embed)

# 4. Nhúng Hình 3.2 và Hình 3.3 vào Chương 3 (Mục 3.10)
fig3_2_embed = """
![Hình 3.2: Sơ đồ hoạt động phân làn quy trình Đặt lịch sử dụng xe](diagrams/activity/booking_activity.png)
*Hình 3.2. Sơ đồ hoạt động phân làn quy trình Đặt lịch sử dụng xe.*

Hình 3.2 thể hiện quy trình phân làn hoạt động (Swimlane Activity) giữa Chủ xe, Giao diện Virtual Garage 3D và Máy chủ Backend. Khi người dùng gửi yêu cầu, backend thực thi tuần tự các bước kiểm tra thời gian không ở quá khứ, kiểm tra quyền sở hữu xe và truy vấn khử xung đột thời gian trong CSDL trước khi tạo bản ghi xác nhận.
"""

fig3_3_embed = """
![Hình 3.3: Sơ đồ hoạt động phân làn quy trình Trả xe, Kiểm tra kỹ thuật và Đối soát năng lượng](diagrams/activity/vehicle_return_and_inspection_activity.png)
*Hình 3.3. Sơ đồ hoạt động phân làn quy trình Trả xe, Kiểm tra kỹ thuật và Đối soát năng lượng.*

Hình 3.3 làm rõ ranh giới trách nhiệm khi kết thúc hành trình: Co-Owner yêu cầu trả xe và cung cấp số ODO/Pin lúc đỗ; Nhân viên trực tiếp kiểm tra xe theo checklist, chụp ảnh và gắn điểm Hotspot 3D nếu có va quẹt; Nhân viên xác nhận hoàn tất sẽ kích hoạt tự động việc trừ kho năng lượng và sinh hóa đơn chi phí điện gán trực tiếp cho người lái.
"""
target_3_2 = "1. **Quy trình Đặt lịch và Ngăn ngừa xung đột:** Đã được thể hiện chi tiết tại tệp `diagrams/activity/booking_activity.puml`."
target_3_3 = "2. **Quy trình Bàn giao, Trả xe và Đối soát năng lượng:** Đã được thể hiện chi tiết tại tệp `diagrams/activity/vehicle_return_and_inspection_activity.puml`."
if target_3_2 in text:
    text = text.replace(target_3_2, "1. **Quy trình Đặt lịch và Ngăn ngừa xung đột:**\n\n" + fig3_2_embed)
if target_3_3 in text:
    text = text.replace(target_3_3, "2. **Quy trình Bàn giao, Trả xe và Đối soát năng lượng:**\n\n" + fig3_3_embed)

# 5. Nhúng Hình 4.1 vào Chương 4 (Mục 4.1)
fig4_1_embed = """
![Hình 4.1: Sơ đồ kiến trúc tổng thể Full-Stack hệ thống EVShare 3D](diagrams/architecture/overall_system_architecture.png)
*Hình 4.1. Sơ đồ kiến trúc tổng thể Full-Stack hệ thống EVShare 3D.*

Hình 4.1 mô tả kiến trúc phân tầng doanh nghiệp kết hợp động cơ 3D WebGL của EVShare 3D. Ứng dụng Single Page Application (React 18 + Three.js) giao tiếp phi trạng thái qua REST API HTTPS với máy chủ Spring Boot 3.3.4 (chạy trên Java 21 LTS), kết nối bền vững với CSDL MySQL 8.0 được quản lý tiến hóa qua 46 tệp di chuyển Flyway.
"""
target_4_1 = "*(Xem chi tiết mã nguồn sơ đồ PlantUML tại tệp `diagrams/architecture/overall_system_architecture.puml`).*"
if target_4_1 in text:
    text = text.replace(target_4_1, fig4_1_embed)

# 6. Nhúng Hình 4.3 vào Chương 4 (Mục 4.4)
fig4_3_embed = """
![Hình 4.3: Lược đồ thực thể quan hệ cơ sở dữ liệu (ERD) EVShare 3D](diagrams/database/database_erd_overview.png)
*Hình 4.3. Lược đồ thực thể quan hệ cơ sở dữ liệu (ERD) EVShare 3D.*

Hình 4.3 biểu diễn lược đồ quan hệ giữa 46 bảng thực thể trong cơ sở dữ liệu MySQL của hệ thống. Cấu trúc bảng tuân thủ chuẩn 3NF, bảo đảm tính toàn vẹn khóa ngoại và ràng buộc chặt chẽ các bất biến tài chính, vận hành.
"""
target_4_3 = "*(Xem chi tiết mã nguồn lược đồ ERD PlantUML tại tệp `diagrams/database/database_erd_overview.puml`).*"
if target_4_3 in text:
    text = text.replace(target_4_3, fig4_3_embed)

# 7. Nhúng Hình 4.2 vào Chương 4 (Mục 4.6)
fig4_2_embed = """
![Hình 4.2: Sơ đồ lớp miền dữ liệu thực thể Java hệ thống EVShare 3D](diagrams/class/domain_model_overview.png)
*Hình 4.2. Sơ đồ lớp miền dữ liệu thực thể Java hệ thống EVShare 3D.*

Hình 4.2 thể hiện sơ đồ lớp miền dữ liệu thực thể Java, các mối liên kết quan hệ 1-Nhiều, Nhiều-1 và 1-1 giữa CoOwnershipGroup, GroupMember, OwnershipShare, Vehicle, Booking, Trip, VehicleEnergyInventory và Expense.
"""
target_4_2 = "*(Xem chi tiết mã nguồn PlantUML tại tệp `diagrams/class/domain_model_overview.puml`).*"
if target_4_2 in text:
    text = text.replace(target_4_2, fig4_2_embed)

# 8. Nhúng Hình 4.4 vào Chương 4 (Mục 4.7.2)
fig4_4_embed = """
![Hình 4.4: Sơ đồ tuần tự quy trình Đặt lịch và Khử xung đột thời gian](diagrams/sequence/seq_booking_creation_conflict.png)
*Hình 4.4. Sơ đồ tuần tự quy trình Đặt lịch và Khử xung đột thời gian.*

Hình 4.4 mô tả chi tiết thông điệp tuần tự trao đổi giữa Co-Owner, Giao diện 3D, BookingController, BookingService, BookingRepository và CSDL MySQL. Khi phát hiện xung đột thời gian, hệ thống lập tức ném ngoại lệ và trả về mã lỗi HTTP 400 Bad Request kèm thông điệp rõ ràng cho người dùng.
"""
target_4_4 = "*(Mã nguồn: `diagrams/sequence/seq_booking_creation_conflict.puml`).*"
if target_4_4 in text:
    text = text.replace(target_4_4, fig4_4_embed)

# 9. Nhúng Hình 4.5 vào Chương 4 (Mục 4.7.4)
fig4_5_embed = """
![Hình 4.5: Sơ đồ tuần tự quy trình Hoàn tất sạc và Cập nhật tồn kho năng lượng WAC](diagrams/sequence/seq_charging_energy_inventory.png)
*Hình 4.5. Sơ đồ tuần tự quy trình Hoàn tất sạc và Cập nhật tồn kho năng lượng WAC.*

Hình 4.5 thể hiện luồng xử lý hoàn tất phiên sạc: tính toán tổn hao vật lý 10%, nạp 90% điện năng vào pin, cập nhật giá bình quân gia quyền (WAC) và áp dụng cơ chế kiểm tra Idempotency chống nạp trùng lặp.
"""
target_4_5 = "*(Mã nguồn: `diagrams/sequence/seq_charging_energy_inventory.puml`).*"
if target_4_5 in text:
    text = text.replace(target_4_5, fig4_5_embed)

# 10. Nhúng Hình 4.6 vào Chương 4 (Mục 4.9)
fig4_6_embed = """
![Hình 4.6: Sơ đồ máy trạng thái vòng đời chuyến đi và phương tiện](diagrams/state-machine/trip_lifecycle.png)
*Hình 4.6. Sơ đồ máy trạng thái vòng đời chuyến đi và phương tiện.*

Hình 4.6 mô hình hóa máy trạng thái hữu hạn kiểm soát sự biến đổi trạng thái của xe (AVAILABLE -> RESERVED -> IN_USE -> AVAILABLE) và lịch trình (CONFIRMED -> ACTIVE -> COMPLETED).
"""
target_4_6 = "*(Xem chi tiết mã nguồn tại tệp `diagrams/state-machine/trip_lifecycle.puml`).*"
if target_4_6 in text:
    text = text.replace(target_4_6, fig4_6_embed)

# 11. Nhúng Hình 4.7 vào Chương 4 (Mục 4.11)
fig4_7_embed = """
![Hình 4.7: Sơ đồ kiến trúc bảo mật xác thực JWT và chuỗi lọc Spring Security](diagrams/architecture/security_jwt_architecture.png)
*Hình 4.7. Sơ đồ kiến trúc bảo mật xác thực JWT và chuỗi lọc Spring Security.*

Hình 4.7 biểu diễn luồng xử lý của chuỗi lọc bảo mật JwtAuthenticationFilter: chặn bắt request, trích xuất chuỗi JWT trong Authorization header, xác thực chữ ký HMAC-SHA256 bí mật và cấp quyền truy cập theo vai trò RBAC.
"""
if "## 4.11. THIẾT KẾ BẢO MẬT VÀ TOÀN VẸN HỆ THỐNG" in text and "![Hình 4.7" not in text:
    text = text.replace("## 4.11. THIẾT KẾ BẢO MẬT VÀ TOÀN VẸN HỆ THỐNG", "## 4.11. THIẾT KẾ BẢO MẬT VÀ TOÀN VẸN HỆ THỐNG\n\n" + fig4_7_embed)

# 12. Nhúng Hình 4.8 vào Chương 4 (Mục 4.13)
fig4_8_embed = """
![Hình 4.8: Sơ đồ triển khai phần cứng và hạ tầng máy chủ hệ thống EVShare 3D](diagrams/deployment/system_deployment_diagram.png)
*Hình 4.8. Sơ đồ triển khai phần cứng và hạ tầng máy chủ hệ thống EVShare 3D.*

Hình 4.8 thể hiện cấu trúc triển khai vật lý giữa Thiết bị máy khách (Client Browser chạy WebGL 2.0), Máy chủ ứng dụng (Tomcat nhúng trong Spring Boot 3.3.4 trên OpenJDK 21) và Máy chủ CSDL (MySQL 8.0 Server).
"""
target_4_8 = "*(Xem chi tiết mã nguồn sơ đồ PlantUML tại tệp `diagrams/deployment/system_deployment_diagram.puml`).*"
if target_4_8 in text:
    text = text.replace(target_4_8, fig4_8_embed)

print(f"Writing enriched markdown to: {MD_PATH}")
with open(MD_PATH, "w", encoding="utf-8") as f:
    f.write(text)

print("Enriched Markdown saved successfully. Size:", len(text), "chars")
