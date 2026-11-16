# -*- coding: utf-8 -*-
"""
build_supporting_docs_part2.py - Sinh USE_CASE_CATALOG.md, TEST_CASE_CATALOG.md, SOURCE_EVIDENCE_INDEX.md, MISSING_SCREENSHOTS.md
"""
import os
import re

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"

# 1. USE_CASE_CATALOG.md
def build_use_case_catalog():
    out_path = os.path.join(BASE_DIR, "USE_CASE_CATALOG.md")
    
    uc_groups = [
        ("A. Xác thực và quản lý tài khoản", [
            ("UC-AUTH-01", "Đăng nhập hệ thống (Login)", "Người dùng", "Mục 3.9.1", "SEQ-01, ACT-01", "FR-AUTH-01", "BR-AUTH-01"),
            ("UC-AUTH-02", "Đăng xuất hệ thống (Logout)", "Người dùng", "Mục 3.9.1", "SEQ-01", "FR-AUTH-03", "BR-AUTH-02"),
            ("UC-AUTH-03", "Đăng ký tài khoản thành viên (Register)", "Khách vãng lai", "Phụ lục C.1", "ACT-01", "FR-AUTH-01", "BR-AUTH-03"),
            ("UC-AUTH-04", "Làm mới Token xác thực (Refresh Token)", "Hệ thống / User", "Phụ lục C.1", "SEQ-01", "FR-AUTH-02", "BR-AUTH-04"),
            ("UC-AUTH-05", "Xem thông tin hồ sơ cá nhân (View Profile)", "Người dùng", "Phụ lục C.1", "UC-02", "FR-AUTH-04", "BR-AUTH-05"),
            ("UC-AUTH-06", "Cập nhật thông tin hồ sơ cá nhân (Update Profile)", "Người dùng", "Phụ lục C.1", "UC-02", "FR-AUTH-04", "BR-AUTH-05"),
            ("UC-AUTH-07", "Đổi mật khẩu tài khoản (Change Password)", "Người dùng", "Phụ lục C.1", "UC-02", "FR-AUTH-01", "BR-AUTH-01"),
        ]),
        ("B. Quản trị hệ thống (ADMIN)", [
            ("UC-ADMIN-01", "Xem danh sách tài khoản người dùng", "ADMIN", "Mục 3.9.2", "UC-03", "FR-ADM-01", "BR-ADM-01"),
            ("UC-ADMIN-02", "Tìm kiếm và lọc tài khoản người dùng", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-01", "BR-ADM-01"),
            ("UC-ADMIN-03", "Cập nhật vai trò người dùng (Role Assignment)", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-02", "BR-ADM-02"),
            ("UC-ADMIN-04", "Khóa hoặc mở khóa tài khoản người dùng", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-03", "BR-ADM-03"),
            ("UC-ADMIN-05", "Xem danh sách đội xe (Vehicle Fleet Overview)", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-04", "BR-ADM-04"),
            ("UC-ADMIN-06", "Quản lý thông tin phương tiện (Vehicle Management)", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-04", "BR-ADM-04"),
            ("UC-ADMIN-07", "Quản lý nhóm đồng sở hữu xe", "ADMIN", "Mục 3.9.2", "UC-03, CLASS-03", "FR-ADM-05", "BR-ADM-05"),
            ("UC-ADMIN-08", "Xem chi tiết thành viên nhóm đồng sở hữu", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-05", "BR-ADM-05"),
            ("UC-ADMIN-09", "Xem lịch sử biến động tỷ lệ sở hữu (Ownership History)", "ADMIN", "Phụ lục C.2", "CLASS-03", "FR-ADM-06", "BR-ADM-06"),
            ("UC-ADMIN-10", "Xem bảng điều khiển thống kê vận hành (Operational Analytics)", "ADMIN", "Phụ lục C.2", "UC-03", "FR-ADM-07", "BR-ADM-07"),
            ("UC-ADMIN-11", "Tra cứu nhật ký kiểm toán hệ thống (Audit Logs)", "ADMIN", "Phụ lục C.2", "ERD-02", "FR-ADM-08", "BR-ADM-08"),
        ]),
        ("C. Đặt lịch sử dụng xe (Booking)", [
            ("UC-BOOK-01", "Tra cứu khung giờ rảnh của phương tiện", "CO_OWNER", "Mục 3.9.3", "ACT-02", "FR-BOOK-01", "BR-BOOK-01"),
            ("UC-BOOK-02", "Tạo lịch đặt xe mới kèm xử lý khử xung đột", "CO_OWNER", "Mục 3.9.3", "SEQ-03, ACT-02", "FR-BOOK-02", "BR-BOOK-02"),
            ("UC-BOOK-03", "Hủy lịch đặt xe hợp lệ trước giờ khởi hành", "CO_OWNER", "Phụ lục C.3", "SEQ-08", "FR-BOOK-03", "BR-BOOK-03"),
            ("UC-BOOK-04", "Xem lịch sử đặt xe cá nhân", "CO_OWNER", "Phụ lục C.3", "UC-06", "FR-BOOK-01", "BR-BOOK-01"),
        ]),
        ("D. Bàn giao, chuyến đi và trả xe (Trip & Handover)", [
            ("UC-TRIP-01", "Kiểm tra kỹ thuật tiền chuyến đi (Pre-Trip Inspection)", "STAFF / CO_OWNER", "Mục 3.9.4", "ACT-03", "FR-HAND-01", "BR-HAND-01"),
            ("UC-TRIP-02", "Nhân viên xác minh bàn giao xe kỹ thuật", "STAFF", "Mục 3.9.4", "SEQ-04, ACT-03", "FR-HAND-02", "BR-HAND-02"),
            ("UC-TRIP-03", "Co-Owner xem và ký nhận bàn giao xe", "CO_OWNER", "Phụ lục C.4", "SEQ-04", "FR-HAND-03", "BR-HAND-03"),
            ("UC-TRIP-04", "Khởi hành bắt đầu chuyến đi (Start Trip Check-in)", "CO_OWNER", "Mục 3.9.4", "SEQ-05, ACT-04", "FR-TRIP-01", "BR-TRIP-01"),
            ("UC-TRIP-05", "Theo dõi hành trình chuyến đi đang hoạt động", "CO_OWNER", "Phụ lục C.4", "STATE-03", "FR-TRIP-02", "BR-TRIP-02"),
            ("UC-TRIP-06", "Yêu cầu gia hạn thời gian chuyến đi", "CO_OWNER", "Phụ lục C.4", "SEQ-21", "FR-TRIP-03", "BR-TRIP-03"),
            ("UC-TRIP-07", "Đàm phán chấp thuận hoặc từ chối gia hạn chuyến đi", "CO_OWNER kế tiếp", "Phụ lục C.4", "SEQ-21", "FR-TRIP-03", "BR-TRIP-04"),
            ("UC-TRIP-08", "Gửi yêu cầu trả xe kết thúc hành trình", "CO_OWNER", "Mục 3.9.4", "SEQ-07, ACT-05", "FR-TRIP-04", "BR-TRIP-05"),
            ("UC-TRIP-09", "Kiểm định kỹ thuật nghiệm thu trả xe", "STAFF", "Phụ lục C.4", "SEQ-07", "FR-TRIP-05", "BR-TRIP-06"),
            ("UC-TRIP-10", "Nhân viên xác nhận hoàn tất trả xe và chốt chi phí", "STAFF", "Mục 3.9.4", "SEQ-07, ACT-05", "FR-TRIP-05", "BR-TRIP-07"),
            ("UC-TRIP-11", "Xem lịch sử chuyến đi và bàn giao", "CO_OWNER / STAFF", "Phụ lục C.4", "UC-06", "FR-TRIP-01", "BR-TRIP-01"),
        ]),
        ("E. Kiểm tra kỹ thuật và bảo dưỡng (Damage & Maintenance)", [
            ("UC-MAINT-01", "Ghi nhận vết hư hại thân vỏ gắn tọa độ 3D Hotspot", "STAFF", "Mục 3.9.5", "SEQ-06, SEQ-20", "FR-DAMG-01", "BR-DAMG-01"),
            ("UC-MAINT-02", "Xem danh sách hư hại chưa khắc phục", "CO_OWNER / STAFF", "Phụ lục C.5", "UC-07", "FR-DAMG-02", "BR-DAMG-02"),
            ("UC-MAINT-03", "So sánh đối chiếu biên bản kiểm định trước và sau", "STAFF", "Phụ lục C.5", "CLASS-05", "FR-INS-01", "BR-INS-01"),
            ("UC-MAINT-04", "Tạo đề xuất bảo dưỡng kỹ thuật định kỳ", "CO_OWNER / STAFF", "Phụ lục C.5", "SEQ-18", "FR-MAINT-01", "BR-MAINT-01"),
            ("UC-MAINT-05", "Lập lịch và phê duyệt lệnh bảo dưỡng xe", "STAFF / ADMIN", "Phụ lục C.5", "SEQ-18", "FR-MAINT-02", "BR-MAINT-02"),
            ("UC-MAINT-06", "Cập nhật tiến độ bảo dưỡng xe tại xưởng", "STAFF", "Phụ lục C.5", "STATE-10", "FR-MAINT-03", "BR-MAINT-03"),
            ("UC-MAINT-07", "Nghiệm thu hoàn tất bảo dưỡng và đưa xe về AVAILABLE", "STAFF", "Phụ lục C.5", "STATE-01", "FR-MAINT-04", "BR-MAINT-04"),
        ]),
        ("F. Pin, sạc điện và tồn kho năng lượng (Charging & Energy)", [
            ("UC-CHRG-01", "Bắt đầu phiên sạc điện tại trụ thông minh", "CO_OWNER / STAFF", "Mục 3.9.6", "SEQ-09, ACT-06", "FR-CHARGE-01", "BR-CHRG-01"),
            ("UC-CHRG-02", "Theo dõi tiến trình sạc thời gian thực", "CO_OWNER / STAFF", "Phụ lục C.6", "STATE-05", "FR-CHARGE-02", "BR-CHRG-02"),
            ("UC-CHRG-03", "Dừng và hoàn tất phiên sạc điện", "CO_OWNER / STAFF", "Mục 3.9.6", "SEQ-10, ACT-06", "FR-CHARGE-03", "BR-CHRG-03"),
            ("UC-CHRG-04", "Tra cứu trạng thái sức khỏe cụm pin (Battery SOH/SOC)", "CO_OWNER", "Phụ lục C.6", "UC-08", "FR-ENERGY-01", "BR-ENER-01"),
            ("UC-CHRG-05", "Xem báo cáo kho năng lượng xe (Energy Inventory)", "CO_OWNER / ADMIN", "Phụ lục C.6", "SEQ-10, ARCH-06", "FR-ENERGY-02", "BR-ENER-02"),
            ("UC-CHRG-06", "Tra cứu lịch sử giao dịch xuất/nhập kho năng lượng", "ADMIN / STAFF", "Phụ lục C.6", "ERD-06", "FR-ENERGY-03", "BR-ENER-03"),
        ]),
        ("G. Tài chính và thanh toán (Finance & Payments)", [
            ("UC-FIN-01", "Tạo và phê duyệt khoản chi phí phương tiện", "STAFF / ADMIN", "Mục 3.9.7", "SEQ-11, ACT-07", "FR-FIN-01", "BR-FIN-01"),
            ("UC-FIN-02", "Xem tổng hợp nghĩa vụ tài chính cá nhân", "CO_OWNER", "Mục 3.9.7", "UC-09", "FR-FIN-02", "BR-FIN-02"),
            ("UC-FIN-03", "Xem chi tiết phân bổ chi phí theo tỷ lệ sở hữu", "CO_OWNER", "Phụ lục C.7", "SEQ-11", "FR-FIN-03", "BR-FIN-03"),
            ("UC-FIN-04", "Nộp chứng từ thanh toán DEMO", "CO_OWNER", "Mục 3.9.7", "SEQ-13, ACT-07", "FR-FIN-04", "BR-FIN-04"),
            ("UC-FIN-05", "Nhân viên xác minh phê duyệt thanh toán", "STAFF", "Mục 3.9.7", "SEQ-13", "FR-FIN-05", "BR-FIN-05"),
            ("UC-FIN-06", "Từ chối chứng từ thanh toán không hợp lệ", "STAFF", "Phụ lục C.7", "SEQ-23", "FR-FIN-06", "BR-FIN-06"),
            ("UC-FIN-07", "Xem lịch sử thanh toán cá nhân", "CO_OWNER", "Phụ lục C.7", "UC-09", "FR-FIN-07", "BR-FIN-07"),
        ]),
        ("H. Quản lý đồng sở hữu (Co-Ownership)", [
            ("UC-OWN-01", "Xem thông tin nhóm đồng sở hữu xe", "CO_OWNER", "Mục 3.9.8", "UC-05, CLASS-03", "FR-OWN-01", "BR-OWN-01"),
            ("UC-OWN-02", "Xem cơ cấu tỷ lệ phần trăm sở hữu vốn", "CO_OWNER", "Phụ lục C.8", "SEQ-12", "FR-OWN-02", "BR-OWN-02"),
            ("UC-OWN-03", "Khởi tạo đề xuất chuyển nhượng cổ phần", "CO_OWNER", "Mục 3.9.8", "SEQ-14, ACT-08", "FR-OWN-03", "BR-OWN-03"),
            ("UC-OWN-04", "Bên nhận chấp thuận hoặc từ chối chuyển nhượng", "CO_OWNER (Bên nhận)", "Phụ lục C.8", "SEQ-14", "FR-OWN-04", "BR-OWN-04"),
            ("UC-OWN-05", "Trưởng nhóm phê duyệt chuyển nhượng cổ phần", "CO_OWNER (Leader)", "Phụ lục C.8", "SEQ-14", "FR-OWN-05", "BR-OWN-05"),
            ("UC-OWN-06", "Tất toán chuyển nhượng và bảo toàn bất biến vốn 100%", "Hệ thống", "Phụ lục C.8", "SEQ-14, STATE-10", "FR-OWN-06", "BR-OWN-06"),
            ("UC-OWN-07", "Xem lịch sử chuyển nhượng cổ phần", "CO_OWNER", "Phụ lục C.8", "UC-10", "FR-OWN-07", "BR-OWN-07"),
            ("UC-OWN-08", "Gửi thư mời thành viên mới gia nhập nhóm", "CO_OWNER (Leader)", "Mục 3.9.8", "ACT-09, STATE-11", "FR-INV-01", "BR-INV-01"),
            ("UC-OWN-09", "Người được mời xem xét thư mời gia nhập", "User được mời", "Phụ lục C.8", "ACT-09", "FR-INV-02", "BR-INV-02"),
            ("UC-OWN-10", "Cổ đông hiện hữu đồng thuận trích phần vốn góp", "CO_OWNER hiện hữu", "Phụ lục C.8", "STATE-11", "FR-INV-03", "BR-INV-03"),
            ("UC-OWN-11", "Kích hoạt tư cách thành viên mới sau khi đủ điều kiện", "Hệ thống / Leader", "Phụ lục C.8", "STATE-11", "FR-INV-04", "BR-INV-04"),
        ]),
        ("I. Hợp đồng pháp lý (Contracts)", [
            ("UC-CON-01", "Xem hợp đồng đồng sở hữu hiện hành", "CO_OWNER", "Mục 3.9.9", "UC-11", "FR-CON-01", "BR-CON-01"),
            ("UC-CON-02", "Xem dự thảo phiên bản hợp đồng mới", "CO_OWNER", "Phụ lục C.9", "STATE-07", "FR-CON-02", "BR-CON-02"),
            ("UC-CON-03", "Ký kết hợp đồng điện tử mô phỏng (DEMO Signature)", "CO_OWNER", "Mục 3.9.9", "SEQ-15, ACT-09", "FR-CON-03", "BR-CON-03"),
            ("UC-CON-04", "Theo dõi tiến độ chữ ký các bên trong hợp đồng", "CO_OWNER / ADMIN", "Phụ lục C.9", "STATE-07", "FR-CON-04", "BR-CON-04"),
            ("UC-CON-05", "Tra cứu lịch sử các phiên bản hợp đồng", "CO_OWNER / ADMIN", "Phụ lục C.9", "ERD-08", "FR-CON-05", "BR-CON-05"),
        ]),
        ("J. Biểu quyết và tranh chấp (Voting & Disputes)", [
            ("UC-VOTE-01", "Tạo đề xuất biểu quyết tập thể nhóm", "CO_OWNER", "Mục 3.9.10", "SEQ-17, ACT-10", "FR-VOTE-01", "BR-VOTE-01"),
            ("UC-VOTE-02", "Xem danh sách các đề xuất biểu quyết", "CO_OWNER", "Phụ lục C.10", "UC-12", "FR-VOTE-02", "BR-VOTE-02"),
            ("UC-VOTE-03", "Bỏ phiếu biểu quyết theo trọng số vốn", "CO_OWNER", "Mục 3.9.10", "SEQ-17, ACT-10", "FR-VOTE-03", "BR-VOTE-03"),
            ("UC-VOTE-04", "Xem kết quả kiểm phiếu và quyết định thông qua", "CO_OWNER", "Phụ lục C.10", "STATE-08", "FR-VOTE-04", "BR-VOTE-04"),
            ("UC-VOTE-05", "Khởi tạo khiếu nại tranh chấp sau sự cố", "CO_OWNER", "Mục 3.9.10", "SEQ-22, ACT-11", "FR-DISP-01", "BR-DISP-01"),
            ("UC-VOTE-06", "Nộp bổ sung bằng chứng và tin nhắn hòa giải", "CO_OWNER", "Phụ lục C.10", "SEQ-22", "FR-DISP-02", "BR-DISP-02"),
            ("UC-VOTE-07", "Nhân viên tiếp nhận điều tra khiếu nại", "STAFF", "Phụ lục C.10", "SEQ-22", "FR-DISP-03", "BR-DISP-03"),
            ("UC-VOTE-08", "Thực thi giải pháp bồi thường hòa giải", "STAFF / ADMIN", "Phụ lục C.10", "SEQ-22, STATE-12", "FR-DISP-04", "BR-DISP-04"),
            ("UC-VOTE-09", "Xem lịch sử giải quyết tranh chấp", "CO_OWNER / STAFF", "Phụ lục C.10", "UC-12", "FR-DISP-05", "BR-DISP-05"),
        ]),
        ("K. Tương tác không gian 3D Garage (Garage 3D)", [
            ("UC-3D-01", "Chọn và chuyển đổi xe hiển thị trên bục xoay 3D", "Người dùng", "Mục 3.9.11", "UC-13, ARCH-05", "FR-3D-01", "BR-3D-01"),
            ("UC-3D-02", "Xem thông số kỹ thuật xe qua thẻ Hologram 3D", "Người dùng", "Phụ lục C.11", "UC-13", "FR-3D-02", "BR-3D-02"),
            ("UC-3D-03", "Khám phá bóc tách các cụm chi tiết xe 3D", "CO_OWNER", "Phụ lục C.11", "COMP-03", "FR-3D-03", "BR-3D-03"),
            ("UC-3D-04", "Kích hoạt chế độ X-Ray kiểm tra khối pin", "CO_OWNER", "Mục 3.9.11", "UC-13, COMP-03", "FR-3D-04", "BR-3D-04"),
            ("UC-3D-05", "Tương tác nhấp chọn điểm nóng tổn hại 3D", "CO_OWNER / STAFF", "Mục 3.9.11", "SEQ-20, COMP-03", "FR-3D-05", "BR-3D-05"),
            ("UC-3D-06", "Tương tác với khu vực trụ sạc thông minh 3D", "CO_OWNER / STAFF", "Phụ lục C.11", "UC-13", "FR-3D-06", "BR-3D-06"),
            ("UC-3D-07", "Đặt lại góc nhìn camera về vị trí tổng quan chuẩn", "Người dùng", "Phụ lục C.11", "COMP-03", "FR-3D-07", "BR-3D-07"),
        ]),
        ("L. Thông báo và hỗ trợ (Notifications & Support)", [
            ("UC-NOTI-01", "Xem danh sách thông báo thời gian thực", "Người dùng", "Mục 3.9.12", "UC-02", "FR-NOTI-01", "BR-NOTI-01"),
            ("UC-NOTI-02", "Đánh dấu thông báo đã đọc", "Người dùng", "Phụ lục C.12", "UC-02", "FR-NOTI-02", "BR-NOTI-02"),
            ("UC-NOTI-03", "Tra cứu quy chế và đối thoại với Trợ lý ảo AI", "CO_OWNER", "Mục 3.9.12", "COMP-03", "FR-NOTI-03", "BR-NOTI-03"),
        ])
    ]

    lines = [
        "# DANH MỤC TOÀN DIỆN 88 CA SỬ DỤNG (USE CASE CATALOG) — EVSHARE 3D V3\n",
        "**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  ",
        "**Báo cáo:** Báo Cáo Thực Tập Tốt Nghiệp — Phiên Bản Hoàn Thiện V3.0  ",
        "**Nguyên tắc tổ chức:**",
        "- **14 Use Cases đại diện cốt lõi** được đặc tả chi tiết dưới dạng bảng tại **Mục 3.9 (Chương 3)**.",
        "- **74 Use Cases chi tiết còn lại** được đặc tả đầy đủ dưới dạng bảng tại **Phụ lục C**.",
        "- Toàn bộ 88 Use Cases đều được trình bày bằng **bảng Word hai cột kẻ viền native**, không có bảng nào bị thay thế bằng văn bản thô.\n",
        "---\n"
    ]

    total_count = 0
    for g_title, ucs in uc_groups:
        lines.append(f"\n### {g_title}\n")
        lines.append("| STT | Mã Use Case | Tên Use Case | Tác Nhân Chính | Vị Trí Đặc Tả | Sơ Đồ Liên Quan | Yêu Cầu FR | Quy Tắc BR |")
        lines.append("|:---:|:---:|:---|:---|:---:|:---|:---:|:---:|")
        for u in ucs:
            total_count += 1
            lines.append(f"| {total_count} | **{u[0]}** | {u[1]} | `{u[2]}` | **{u[3]}** | {u[4]} | `{u[5]}` | `{u[6]}` |")

    lines.append(f"\n\n---\n**Tổng cộng:** **{total_count} Use Cases** được phân loại khoa học và lập tài liệu đặc tả 100%.\n")

    with open(out_path, "w", encoding="utf-8") as fp:
        fp.write("\n".join(lines))
    print(f"Generated {out_path} with {total_count} use cases.")
    return uc_groups

# 2. TEST_CASE_CATALOG.md
def build_test_case_catalog():
    out_path = os.path.join(BASE_DIR, "TEST_CASE_CATALOG.md")
    src_test_file = r"D:\EV3D\docs\graduation-internship-report\MANUAL_TEST_CASES.md"
    with open(src_test_file, "r", encoding="utf-8") as fp:
        content = fp.read()
        
    header = """# DANH MỤC CA KIỂM THỬ HỆ THỐNG TOÀN DIỆN (SYSTEM TEST CASES CATALOG V3)
**Dự án:** Hệ Thống Quản Lý Đồng Sở Hữu Xe Điện Tích Hợp Không Gian Tương Tác 3D (EVShare 3D)  
**Tài liệu:** Báo Cáo Thực Tập Tốt Nghiệp V3 — Phụ Lục D  
**Nguyên tắc học thuật:** Ghi nhận minh bạch 100 ca kiểm thử ở trạng thái `NOT EXECUTED` (Compilation verification: NOT PERFORMED, Runtime verification: NOT PERFORMED).

---
"""
    with open(out_path, "w", encoding="utf-8") as fp:
        fp.write(header + content)
    print(f"Generated {out_path}")

# 3. MISSING_SCREENSHOTS.md (20 items)
def build_missing_screenshots():
    out_path = os.path.join(BASE_DIR, "MISSING_SCREENSHOTS.md")
    content = """# DANH MỤC KHUNG THU THẬP ẢNH CHỤP GIAO DIỆN (SCREENSHOT CHECKLIST V3)

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
"""
    with open(out_path, "w", encoding="utf-8") as fp:
        fp.write(content)
    print(f"Generated {out_path}")

if __name__ == "__main__":
    build_use_case_catalog()
    build_test_case_catalog()
    build_missing_screenshots()
