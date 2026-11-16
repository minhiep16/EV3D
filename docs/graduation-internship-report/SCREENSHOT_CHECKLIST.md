# DANH MỤC MINH CHỨNG ẢNH CHỤP GIAO DIỆN VÀ HƯỚNG DẪN THU THẬP
## (SCREENSHOT CHECKLIST & CAPTURE GUIDE)
### DỰ ÁN EVSHARE 3D

Tài liệu này cung cấp danh mục chi tiết toàn bộ các ảnh chụp giao diện minh chứng cần thiết cho Báo cáo thực tập tốt nghiệp. Nhằm bảo đảm tính trung thực học thuật tuyệt đối:
* **Không chèn ảnh giả lập hoặc ảnh không có trong hệ thống.**
* Nếu ảnh thực tế chưa được chụp hoặc chưa xuất ra thư mục báo cáo, tài liệu sử dụng cú pháp giữ chỗ chuẩn: `[CHÈN HÌNH MINH CHỨNG TẠI ĐÂY - Mã: <MÃ_HÌNH>]`.
* Khi sinh viên thu thập ảnh thực tế, cần che mờ (redact) các dữ liệu nhạy cảm như mã bí mật, mật khẩu hoặc số điện thoại cá nhân.

---

### BẢNG THEO DÕI VÀ DANH MỤC ẢNH CHỤP THEO PHÂN HỆ

| Mã Minh Chứng | Tên Màn Hình / Nghiệp Vụ | Vai Trò (Role) | Điều Kiện Trạng Thái Hệ Thống | Các Bước Thực Hiện Để Đạt Màn Hình | Tên Tệp Dự Kiến (Lưu tại docs/.../figures/) | Chương Báo Cáo | Ghi Chú Che Mờ Dữ Liệu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **SS-AUTH-01** | Màn hình Đăng Nhập 3D (3D Login Scene) | Khách / Chưa đăng nhập | Hệ thống ở trạng thái ban đầu, WebGL đã khởi tạo xong Canvas | 1. Mở trình duyệt truy cập `http://localhost:5173/login`<br>2. Chờ tải xong mô hình xe nền và form nhập liệu | `figures/authentication/fig_5_1_auth_login.png` | Chương 5 (Mục 5.3) | Che mờ mật khẩu gõ trong ô input |
| **SS-AUTH-02** | Màn hình Đăng Ký Tài Khoản Mới | Khách | Truy cập tab hoặc đường dẫn `/register` | 1. Nhấn nút "Đăng ký thành viên mới" trên giao diện Login<br>2. Form đăng ký mở ra kèm các trường thông tin | `figures/authentication/fig_5_2_auth_register.png` | Chương 5 (Mục 5.3) | Che mờ số CCCD / Điện thoại nếu có |
| **SS-GARAGE-01** | Toàn cảnh Không Gian Garage 3D Tổng Thể | CO_OWNER | Đăng nhập tài khoản `owner1@evshare.com` thành công | 1. Đăng nhập với quyền CO_OWNER<br>2. Hệ thống chuyển hướng vào `/garage`<br>3. Chờ không gian 3D hội tụ góc nhìn bao quát | `figures/garage-3d/fig_5_3_garage_overview.png` | Chương 5 (Mục 5.4) | Giữ nguyên hiển thị thanh HUD |
| **SS-ADMIN-01** | Trung Tâm Chỉ Huy Quản Trị Viên (Admin Center) | ADMIN | Đăng nhập tài khoản `admin@evshare.com` | 1. Đăng nhập tài khoản Admin<br>2. Màn hình Garage hiển thị các nút điều hành cấp cao<br>3. Mở Admin Command Center Panel | `figures/admin/fig_5_4_admin_dashboard.png` | Chương 5 (Mục 5.5) | Che thông tin email cá nhân thành viên |
| **SS-ADMIN-02** | Quản Lý Nhóm Đồng Sở Hữu & Tỷ Lệ Cổ Phần | ADMIN | Đã có nhóm đồng sở hữu trong CSDL | 1. Trong Admin Panel, chọn tab "Nhóm Đồng Sở Hữu"<br>2. Chọn nhóm EV-01 xem biểu đồ phân bổ % sở hữu | `figures/admin/fig_5_5_admin_ownership_groups.png` | Chương 5 (Mục 5.5) | Giữ nguyên tỷ lệ phần trăm phân bổ |
| **SS-ADMIN-03** | Bảng Quản Lý Người Dùng & Phân Quyền | ADMIN | CSDL chứa danh sách tài khoản nhiều vai trò | 1. Chọn tab "Người Dùng"<br>2. Danh sách hiển thị kèm nút thay đổi Role (Admin/Staff/Owner) | `figures/admin/fig_5_6_admin_user_management.png` | Chương 5 (Mục 5.5) | Che cột mật khẩu mã hóa (nếu có) |
| **SS-STAFF-01** | Bảng Chọn Đội Xe & Điều Hành (Staff Fleet View) | STAFF | Đăng nhập tài khoản `staff1@evshare.com` | 1. Truy cập vào `/garage` với vai trò STAFF<br>2. Sidebar bên trái hiển thị danh sách toàn bộ đội xe | `figures/staff/fig_5_7_staff_fleet_sidebar.png` | Chương 5 (Mục 5.6) | Không có dữ liệu nhạy cảm |
| **SS-STAFF-02** | Màn Hình Xác Nhận Bàn Giao Xe (Handover) | STAFF | Xe có lịch đặt sắp diễn ra | 1. Chọn xe có lịch đặt cần bàn giao<br>2. Mở Staff Handover Modal<br>3. Hiển thị form ghi nhận ODO và mức pin bàn giao | `figures/staff/fig_5_8_staff_handover_modal.png` | Chương 5 (Mục 5.6, 5.9) | Giữ nguyên các trường thông số |
| **SS-STAFF-03** | Biên Bản Kiểm Tra Kỹ Thuật Khi Trả Xe | STAFF | Chuyến đi đã gửi yêu cầu trả xe | 1. Chọn chuyến đi có trạng thái RETURN_REQUESTED<br>2. Mở form kiểm tra (Inspection Checklist)<br>3. Đối chiếu chỉ số pin và ODO hoàn tất | `figures/staff/fig_5_9_staff_return_inspection.png` | Chương 5 (Mục 5.9, 5.10) | Giữ nguyên chữ ký ghi nhận của NV |
| **SS-STAFF-04** | Giao Diện Xác Minh Thanh Toán Chi Phí | STAFF | Co-Owner đã gửi chứng từ thanh toán DEMO | 1. Mở Staff Payment Verification Modal<br>2. Hiển thị danh sách các khoản thanh toán chờ xác nhận<br>3. Form xác minh kèm nút "Phê Duyệt Thanh Toán" | `figures/staff/fig_5_10_staff_payment_verify.png` | Chương 5 (Mục 5.13) | Che mã giao dịch ngân hàng thực tế |
| **SS-STAFF-05** | Bảng Điều Hành Tranh Chấp & Hòa Giải | STAFF | Có tranh chấp đang mở (OPEN) | 1. Mở Staff Dispute Dashboard Modal<br>2. Xem danh sách các sự cố khiếu nại và tiến trình hòa giải | `figures/staff/fig_5_11_staff_dispute_dashboard.png` | Chương 5 (Mục 5.19) | Che tên riêng người khiếu nại |
| **SS-OWNER-01** | Bảng Điều Khiển Đặt Lịch Sử Dụng Xe | CO_OWNER | Đã chọn một phương tiện cụ thể | 1. Nhấp chọn mô hình xe trong Garage<br>2. Bấm nút "Đặt Lịch"<br>3. Panel đặt lịch mở ra với trục thời gian trực quan | `figures/co-owner/fig_5_12_owner_booking_panel.png` | Chương 5 (Mục 5.8) | Giữ nguyên các khung giờ hiển thị |
| **SS-OWNER-02** | Giao Diện Chuyến Đi Đang Hoạt Động (Active Trip) | CO_OWNER | Đang có chuyến đi trạng thái ACTIVE | 1. Bắt đầu chuyến đi thành công<br>2. Panel Active Trip hiển thị ODO xuất phát, pin ban đầu và nút Yêu cầu trả xe | `figures/co-owner/fig_5_13_owner_active_trip.png` | Chương 5 (Mục 5.9) | Giữ nguyên thời gian di chuyển |
| **SS-OWNER-03** | Chế Độ Khám Phá Chi Tiết & Bóc Tách Xe 3D | CO_OWNER | Xe đang đỗ tại vị trí bục xoay | 1. Nhấn nút "Khám Phá Xe"<br>2. Camera phóng to chi tiết các bộ phận (Cửa, Nắp capo, Bánh xe) | `figures/co-owner/fig_5_14_owner_vehicle_parts.png` | Chương 5 (Mục 5.7, 5.10) | Không có thông tin nhạy cảm |
| **SS-OWNER-04** | Chế Độ X-Ray Kiểm Tra Trạng Thái Khối Pin | CO_OWNER | Đang trong chế độ khám phá xe | 1. Bật chế độ "X-Ray Battery Mode"<br>2. Vỏ xe chuyển sang hiệu ứng bán trong suốt, khối pin phát sáng xanh | `figures/co-owner/fig_5_15_owner_battery_xray.png` | Chương 5 (Mục 5.11) | Hiển thị rõ thông số SOH/SOC |
| **SS-OWNER-05** | Bảng Quản Lý Phiên Sạc Điện & Trụ Sạc | CO_OWNER / STAFF | Xe đang cắm sạc tại trụ sạc thông minh | 1. Di chuyển camera đến Trụ sạc 3D<br>2. Mở Charging Panel hiển thị dòng điện nạp, kWh tích lũy và đơn giá | `figures/co-owner/fig_5_16_charging_session_panel.png` | Chương 5 (Mục 5.11) | Giữ nguyên biểu đồ dòng điện |
| **SS-OWNER-06** | Bảng Tồn Kho Năng Lượng & Nghĩa Vụ Chi Phí | CO_OWNER | Đã phát sinh chi phí điện chuyến đi | 1. Mở Finance Zone Panel<br>2. Xem bảng tổng hợp tồn kho kWh, giá bình quân và khoản chi cá nhân | `figures/co-owner/fig_5_17_finance_expense_panel.png` | Chương 5 (Mục 5.12, 5.13) | Không có dữ liệu tài khoản thật |
| **SS-OWNER-07** | Màn Hình Ký Hợp Đồng Điện Tử (DEMO Signature) | CO_OWNER | Đang trong tiến trình gia nhập nhóm mới | 1. Mở CoOwnerContractPanel<br>2. Đọc điều khoản hợp đồng đồng sở hữu và thực hiện ký điện tử | `figures/co-owner/fig_5_18_contract_signing.png` | Chương 5 (Mục 5.17) | Giữ nguyên nhãn "DEMO Digital Signature" |
| **SS-OWNER-08** | Giao Diện Biểu Quyết Tập Thể Nhóm Đồng Sở Hữu | CO_OWNER | Có đề xuất biểu quyết đang mở | 1. Mở CoOwnerVotingPanel<br>2. Xem danh sách đề xuất, tỷ lệ phiếu hiện tại và các nút bỏ phiếu (Đồng ý/Từ chối) | `figures/co-owner/fig_5_19_voting_proposal_panel.png` | Chương 5 (Mục 5.18) | Giữ nguyên kết quả kiểm phiếu |
| **SS-OWNER-09** | Trung Tâm Trợ Lý Ảo Thông Minh (AI Zone) | CO_OWNER | Đang ở khu vực Trợ lý ảo trong Garage | 1. Nhấp chọn cụm Hologram AI Assistant<br>2. Panel đối thoại mở ra, nhập câu hỏi về quy chế vận hành xe | `figures/co-owner/fig_5_20_ai_assistant_panel.png` | Chương 5 (Mục 5.20) | Che câu hỏi cá nhân riêng tư |

---

### HƯỚNG DẪN THỰC HIỆN CHỤP VÀ ĐẶT TÊN ẢNH
1. Khởi động ứng dụng theo Hướng dẫn Triển khai (Frontend cổng 5173, Backend cổng 8080).
2. Thiết lập độ phân giải trình duyệt ở chuẩn Full HD (**1920 x 1080**) để đạt tỷ lệ khung hình chuẩn khi đưa vào báo cáo in ấn A4.
3. Sử dụng công cụ chụp ảnh màn hình (Snipping Tool trên Windows hoặc phím tắt `Win + Shift + S`).
4. Lưu tệp ảnh vào đúng thư mục con tương ứng tại `D:\EV3D\docs\graduation-internship-report\figures\...` với định dạng PNG độ nét cao.
5. Sau khi lưu ảnh, mở tệp báo cáo chính và thay thế dòng mã giữ chỗ `[CHÈN HÌNH MINH CHỨNG TẠI ĐÂY - Mã: <MÃ_HÌNH>]` bằng liên kết hình Markdown chuẩn `![Tên hình](./figures/.../tệp_ảnh.png)`.
