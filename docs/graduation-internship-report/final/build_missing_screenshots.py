# -*- coding: utf-8 -*-
"""
build_missing_screenshots.py - Tạo MISSING_SCREENSHOTS.md với hướng dẫn chụp và chuẩn hóa giao diện
"""
import os

OUTPUT_FILE = r"D:\EV3D\docs\graduation-internship-report\final\MISSING_SCREENSHOTS.md"

content = """# DANH MỤC KHUNG THU THẬP ẢNH CHỤP GIAO DIỆN (UI SCREENSHOT INVENTORY & CAPTURE GUIDE)

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Báo cáo:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản Hoàn Thiện V2.0  
**Nguyên tắc học thuật:** Nghiêm cấm ngụy tạo hình ảnh hoặc dữ liệu kiểm thử. Các vị trí chưa có ảnh thực tế từ môi trường hoạt động trực tiếp phải được giữ nguyên dưới dạng Khung giữ chỗ kỹ thuật (Technical Placeholder) kèm hướng dẫn từng bước để thu thập minh chứng khi nghiệm thu.

---

## 1. Bảng Tổng Hợp Khung Thu Thập Ảnh Chụp Giao Diện

| STT | Mã Giao Diện | Tên Màn Hình / Chức Năng | Phân Hệ / Phân Vai | Đường Dẫn Tuyến Tuyến (URL Route) | Trạng Thái Dữ Liệu Cần Có | Yêu Cầu Che Mờ Thông Tin (Redaction) |
|:---:|:---:|:---|:---|:---|:---|:---|
| 1 | **UI-01** | Màn hình Đăng nhập & Xác thực 3D | Chung / Khách | `/login` | Form đăng nhập với nền 3D Canvas động | Che mờ mật khẩu thực, chỉ hiển thị dấu sao |
| 2 | **UI-02** | Không gian Trưng bày Xe Garage 3D | Chung / All Roles | `/garage/3d` | Xe VinFast VF8 3D xoay 360 độ, bật đèn và bóng | Không có dữ liệu nhạy cảm |
| 3 | **UI-03** | Điểm Nóng Kiểm Định Tổn Hại 3D (Hotspot) | Giám định / CO_OWNER | `/garage/3d?inspect=true` | Các Hotspot đỏ/vàng trên thân xe, mở Modal chi tiết | Che tên người giám định nếu có thông tin cá nhân |
| 4 | **UI-04** | Bảng Điều Khiển Tổng Quan (Dashboard Admin) | ADMIN | `/admin/dashboard` | Thống kê số lượng xe, tổng thành viên, doanh thu | Che số tài khoản ngân hàng thực |
| 5 | **UI-05** | Quản Lý Nhóm Đồng Sở Hữu & Tỷ Lệ Vốn | ADMIN / STAFF | `/co-ownership/groups` | Danh sách nhóm, tỷ lệ sở hữu đạt 100% | Che số điện thoại cá nhân của chủ xe |
| 6 | **UI-06** | Lịch Trình Đặt Xe & Khử Xung Đột Thời Gian | CO_OWNER | `/bookings/schedule` | Lịch dạng Timeline, hiển thị slot rảnh và slot đã đặt | Che thông tin ghi chú cá nhân của người khác |
| 7 | **UI-07** | Biên Bản Bàn Giao Xe Kỹ Thuật (Handover) | STAFF / CO_OWNER | `/handovers/verify` | Form đối soát ODO, % pin khởi hành, chữ ký xác nhận | Che chữ ký số thực tế, hiển thị hash đại diện |
| 8 | **UI-08** | Theo Dõi Hành Trình Chuyến Đi Trực Tiếp | CO_OWNER | `/trips/active` | Đồng hồ hiển thị thời gian, ODO ban đầu, % pin hiện tại | Che tọa độ GPS vị trí nhà riêng |
| 9 | **UI-09** | Nghiệm Thu Trả Xe & Checklist Kỹ Thuật | STAFF | `/trips/return` | Form kiểm tra vỏ xe, nội thất, phụ kiện khi trả | Giữ nguyên các tiêu chí đánh giá kỹ thuật |
| 10 | **UI-10** | Quản Lý Phiên Sạc & Năng Lượng Điện | STAFF / CO_OWNER | `/charging/sessions` | Danh sách phiên sạc, số kWh nạp, giá bình quân WAC | Không yêu cầu che mờ |
| 11 | **UI-11** | Bảng Phân Bổ Chi Phí Định Kỳ Theo Cổ Phần | CO_OWNER | `/expenses/allocation` | Bảng tính chi phí sạc cá nhân và phí chung theo % vốn | Che số thẻ thanh toán quốc tế |
| 12 | **UI-12** | Ký Điện Tử Hợp Đồng Đồng Sở Hữu | CO_OWNER | `/contracts/sign` | Hợp đồng pháp lý, mã OTP xác nhận và tình trạng ký | Che số CCCD/CMND của các bên tham gia |
| 13 | **UI-13** | Biểu Quyết Đề Xuất & Bỏ Phiếu Trọng Số | CO_OWNER | `/voting/proposals` | Danh sách đề xuất, tỷ lệ phiếu ủng hộ theo trọng số % | Che danh tính cử tri nếu đề xuất là bỏ phiếu kín |
| 14 | **UI-14** | Lập Lệnh & Cảnh Báo Bảo Dưỡng Xe | STAFF / ADMIN | `/maintenance/orders` | Danh sách cảnh báo mốc ODO 15.000 km, trạng thái xe | Không yêu cầu che mờ |

---

## 2. Quy Trình Thu Thập Và Định Chuẩn Minh Chứng (Capture Guidelines)

Để đảm bảo tính đồng bộ và chất lượng hình ảnh học thuật khi đưa vào tài liệu:

1. **Độ phân giải chuẩn:** Ảnh chụp phải đạt tối thiểu độ phân giải Full HD (1920x1080) với tỷ lệ khung hình 16:9, xuất file định dạng `.png` không nén để tránh mờ chữ và vỡ nét.
2. **Môi trường trình duyệt:** Khuyến nghị sử dụng trình duyệt Google Chrome hoặc Microsoft Edge ở tỷ lệ thu phóng (Zoom) chính xác 100%, tắt các tiện ích mở rộng gây xáo trộn giao diện (AdBlock, DarkReader,...).
3. **Quy tắc đặt tên file:** 
   - Định dạng chuẩn: `ui_<stt>_<slug_ten_man_hinh>.png`
   - Ví dụ: `ui_01_login_scene.png`, `ui_02_garage_3d_view.png`, `ui_06_booking_timeline.png`.
   - Vị trí lưu trữ: `docs/graduation-internship-report/final/figures/`.
4. **Quy tắc bảo mật và che mờ (Data Redaction):**
   - Không để lộ mật khẩu, mã bí mật JWT, API Key hoặc Private Key trong ảnh chụp hoặc bảng điều khiển Console của trình duyệt.
   - Các trường thông tin định danh cá nhân (PII) như Căn cước công dân (CCCD), số điện thoại di động cá nhân, số tài khoản ngân hàng thực tế phải được che bằng dải màu đen hoặc làm mờ (Blur) tối thiểu 10px.

---

## 3. Khung Giữ Chỗ Mẫu Trong Báo Cáo Học Thuật (Academic Placeholder Template)

Khi một giao diện chưa được chụp từ môi trường thực tế, văn bản báo cáo sử dụng khung chuẩn hóa sau:

```markdown
> [!NOTE] KHUNG THU THẬP ẢNH GIAO DIỆN: [TÊN GIAO DIỆN] (MÃ: UI-XX)
> - Tuyến đường dẫn (Route): `/duong-dan-giao-dien`
> - Tác nhân truy cập (Role): `CO_OWNER` / `STAFF` / `ADMIN`
> - Mục đích minh chứng: Minh họa trực quan thao tác người dùng và phản hồi từ hệ thống.
> - Trạng thái: Đang chờ thu thập trong đợt triển khai nghiệm thu thực tế.
```

Việc duy trì khung giữ chỗ tường minh thay vì tạo dữ liệu giả lập thể hiện đạo đức nghiên cứu và sự nghiêm túc tuyệt đối của đồ án tốt nghiệp kỹ sư phần mềm.
"""

with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated {OUTPUT_FILE}")
