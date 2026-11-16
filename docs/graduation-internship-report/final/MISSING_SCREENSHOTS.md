# DANH MỤC KHUNG THU THẬP ẢNH CHỤP GIAO DIỆN (SCREENSHOT CHECKLIST V3)

**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Quy tắc:** Nghiêm cấm ngụy tạo ảnh chụp hoặc tạo dữ liệu giả. Toàn bộ 20 vị trí giao diện dưới đây được duy trì dưới dạng khung giữ chỗ kỹ thuật chuẩn hóa trong Chương 5 và sẵn sàng cho sinh viên chụp ảnh minh chứng thực tế khi nghiệm thu.

---

| STT | Mã Khung Giữ Chỗ | Tên Màn Hình / Chức Năng | Phân Hệ / Vai Trò | Tuyến Đường Dẫn (URL Route) | Trạng Thái Dữ Liệu Cần Có | Vị Trí Chương 5 | Hướng Dẫn Che Mờ Bảo Mật (PII) |
|:---:|:---:|:---|:---|:---|:---|:---:|:---|
| 1 | **UI-01** | Màn hình Đăng Nhập 3D | Khách / All | `/login` | Form đăng nhập trên nền Canvas 3D | Mục 5.3 | Che mờ mật khẩu gõ thực |
| 2 | **UI-02** | Màn hình Đăng Ký Thành Viên Mới | Khách | `/register` | Form nhập thông tin cá nhân và CCCD | Mục 5.3 | Che mờ số điện thoại cá nhân |
| 3 | **UI-03** | Toàn Cảnh Không Gian Garage 3D | CO_OWNER | `/garage` | Xe VinFast VF8 xoay 360 độ trên bục xoay | Mục 5.4 | Giữ nguyên thanh HUD điều khiển |
| 4 | **UI-04** | Trung Tâm Chỉ Huy Quản Trị (Dashboard Admin) | ADMIN | `/garage` (Role ADMIN) | Ba Hologram: Groups, Users, Analytics | Mục 5.5 | Che email cá nhân thành viên |
| 5 | **UI-05** | Quản Lý Nhóm Đồng Sở Hữu & Tỷ Lệ Vốn | ADMIN | Panel Quản trị Nhóm | Danh sách nhóm, tỷ lệ sở hữu đạt 100% | Mục 5.5 | Giữ nguyên tỷ lệ % phân bổ |
| 6 | **UI-06** | Quản Lý Người Dùng & Phân Quyền Vai Trò | ADMIN | Panel Người Dùng | Danh sách tài khoản, nút gán Role | Mục 5.5 | Che cột hash mật khẩu |
| 7 | **UI-07** | Bảng Chọn Đội Xe & Điều Hành (Fleet View) | STAFF | `/garage` (Role STAFF) | Fleet Hologram & Sidebar danh sách xe | Mục 5.6 | Không có dữ liệu nhạy cảm |
| 8 | **UI-08** | Màn Hình Xác Nhận Bàn Giao Xe (Handover) | STAFF | Modal Bàn Giao | Form nhập ODO và mức pin lúc xuất phát | Mục 5.6, 5.9 | Giữ nguyên thông số ODO/SOC |
| 9 | **UI-09** | Biên Bản Nghiệm Thu Trả Xe & Kỹ Thuật | STAFF | Modal Trả Xe | Checklist lốp, phanh, đèn, kính chắn gió | Mục 5.9, 5.10| Giữ nguyên chữ ký nhân viên |
| 10 | **UI-10** | Xác Minh Thanh Toán Chi Phí Cá Nhân | STAFF | Modal Thanh Toán | Danh sách chứng từ chuyển khoản DEMO | Mục 5.13 | Che số tài khoản ngân hàng thực |
| 11 | **UI-11** | Bảng Điều Hành Tranh Chấp & Hòa Giải | STAFF | Modal Tranh Chấp | Danh sách khiếu nại và kết luận điều tra | Mục 5.19 | Che tên riêng người khiếu nại |
| 12 | **UI-12** | Bảng Đặt Lịch Sử Dụng Xe Trực Quan | CO_OWNER | Panel Đặt Lịch | Trục thời gian Timeline, slot rảnh/bận | Mục 5.8 | Giữ nguyên khung giờ hiển thị |
| 13 | **UI-13** | Theo Dõi Chuyến Đi Đang Hoạt Động (Active Trip)| CO_OWNER | Panel Active Trip | Đồng hồ hành trình, ODO/Pin, nút Trả xe | Mục 5.9 | Giữ nguyên thời gian di chuyển |
| 14 | **UI-14** | Chế Độ Khám Phá & Bóc Tách Chi Tiết Xe 3D | CO_OWNER | Chế độ Khám phá | Camera phóng to cửa, nắp capo, mâm xe | Mục 5.7, 5.10| Không có dữ liệu nhạy cảm |
| 15 | **UI-15** | Chế Độ X-Ray Kiểm Tra Khối Pin Phát Sáng | CO_OWNER | X-Ray Battery Mode | Thân vỏ xe trong suốt, khối pin phát sáng | Mục 5.11 | Hiển thị rõ thông số SOH/SOC |
| 16 | **UI-16** | Bảng Quản Lý Phiên Sạc Điện & Trụ Sạc | CO_OWNER / STAFF | Panel Trụ Sạc 3D | Đồng hồ công suất nạp, kWh, giá tiền | Mục 5.11 | Giữ nguyên biểu đồ dòng điện |
| 17 | **UI-17** | Kho Năng Lượng & Nghĩa Vụ Chi Phí Cá Nhân | CO_OWNER | Finance Zone Panel | Tồn kho kWh, giá WAC, tiền điện chuyến đi | Mục 5.12, 5.13| Không có dữ liệu tài khoản thật |
| 18 | **UI-18** | Ký Kết Hợp Đồng Đồng Sở Hữu Điện Tử (DEMO) | CO_OWNER | Contract Panel | Điều khoản hợp đồng, nút ký số DEMO | Mục 5.17 | Giữ nguyên nhãn DEMO Signature |
| 19 | **UI-19** | Bảng Biểu Quyết Tập Thể Nhóm Đồng Sở Hữu | CO_OWNER | Voting Panel | Danh sách đề xuất, tỷ lệ phiếu thuận/chống | Mục 5.18 | Giữ nguyên kết quả kiểm phiếu |
| 20 | **UI-20** | Khu Vực Trợ Lý Ảo Thông Minh (AI Assistant Zone)| CO_OWNER | AI Zone Panel | Hộp thoại đối thoại tra cứu quy chế vận hành | Mục 5.20 | Che nội dung câu hỏi riêng tư |
