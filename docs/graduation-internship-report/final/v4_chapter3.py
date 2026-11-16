# -*- coding: utf-8 -*-
"""
v4_chapter3.py - Dữ liệu Chương 3: Phân tích Yêu cầu và Đặc tả Nghiệp vụ Hệ thống
Tích hợp:
- Bối cảnh nghiệp vụ & Stakeholder
- Yêu cầu chức năng 68 FRs
- Ma trận phân quyền Role Permission Matrix
- Yêu cầu phi chức năng (NFRs)
- Danh mục 42 Quy tắc nghiệp vụ (BRs)
- Luồng nghiệp vụ cốt lõi (User Journey)
- Danh mục 88 Use Cases
- 14 Use Case chính cho Mục 3.9
"""

CHAPTER_3_INTRO = {
    "title": "CHƯƠNG 3: PHÂN TÍCH YÊU CẦU VÀ ĐẶC TẢ NGHIỆP VỤ HỆ THỐNG",
    "intro": (
        "Chương 3 trình bày toàn bộ kết quả phân tích yêu cầu kỹ nghệ phần mềm của hệ thống EVShare 3D theo chuẩn quốc tế. "
        "Nội dung bao gồm phân tích các bên liên quan (Stakeholders), danh mục chuẩn hóa 68 Yêu cầu chức năng (FRs), "
        "Ma trận phân quyền đa cấp (Role Permission Matrix), các Yêu cầu phi chức năng (NFRs), "
        "danh mục chuẩn hóa 42 Quy tắc nghiệp vụ (BRs), luồng trải nghiệm người dùng cốt lõi (User Journey), "
        "và bảng đặc tả chi tiết của 14 Ca sử dụng (Use Cases) trọng tâm nhất của hệ thống."
    ),
    "sections": [
        (
            "3.1. Phân tích bối cảnh nghiệp vụ và các bên liên quan (Stakeholder Analysis)",
            "Hệ thống EVShare 3D được thiết kế phục vụ một hệ sinh thái người dùng đa dạng với các mục tiêu và quyền lợi đan xen:\n\n"
            "1. **Đồng sở hữu (Co-Owners):** Là các cá nhân cùng góp vốn mua và sở hữu phương tiện xe điện. Nhu cầu cốt lõi của họ là có một công cụ đặt xe công bằng, không bị chồng chéo lịch trình, theo dõi minh bạch chi phí tiền điện, tiền bảo dưỡng, tự do chuyển nhượng cổ phần và có tiếng nói bình đẳng trong các quyết định chung thông qua biểu quyết.\n"
            "2. **Nhân viên vận hành tại trạm (Station Staff):** Là lực lượng kỹ thuật trực tiếp tại các trạm xe và trụ sạc. Trách nhiệm của họ là thực hiện kiểm tra an toàn, lập biên bản bàn giao xe kỹ thuật số trước và sau chuyến đi, chụp ảnh ghi nhận vết trầy xước, thực hiện các phiên sạc bảo dưỡng không gán nợ và đóng vai trò hòa giải viên trung gian độc lập khi xảy ra tranh chấp.\n"
            "3. **Quản trị viên hệ thống (System Administrator):** Chịu trách nhiệm bảo đảm tính toàn vẹn của nền tảng, quản lý danh mục đội xe, giám sát bất biến vốn 100% của các nhóm, phân quyền tài khoản và tra cứu nhật ký kiểm toán (Audit Logs) để ngăn chặn gian lận.\n"
            "4. **Xưởng dịch vụ và Đơn vị cung cấp năng lượng (Third-Party Partners):** Các gara sửa chữa ủy quyền của nhà sản xuất (như VinFast Service Center) và đơn vị điện lực EVN cung cấp hạ tầng nguồn điện phục vụ tính toán giá vốn WAC."
        ),
        (
            "3.4. Phân tích yêu cầu phi chức năng (Non-Functional Requirements - NFRs)",
            "Bên cạnh các yêu cầu chức năng, hệ thống EVShare 3D phải đáp ứng các tiêu chuẩn khắt khe về chất lượng phần mềm theo chuẩn ISO/IEC 25010:\n\n"
            "- **Hiệu năng hệ thống (Performance - NFR-PERF):**\n"
            "  + Thời gian phản hồi của các REST API truy vấn dữ liệu thông thường phải đạt dưới 300 ms trong điều kiện mạng tiêu chuẩn.\n"
            "  + Giao diện 3D WebGL phải duy trì tốc độ khung hình tối thiểu 60 FPS trên các thiết bị máy tính cá nhân có card đồ họa tích hợp phổ thông (Intel Iris Xe / AMD Radeon Graphics).\n"
            "  + Thời gian tải nạp ban đầu của tệp mô hình 3D nén GLB phải hoàn tất trong vòng 2.5 giây trên đường truyền băng thông rộng.\n\n"
            "- **Bảo mật và toàn vẹn dữ liệu (Security - NFR-SEC):**\n"
            "  + Mật khẩu người dùng bắt buộc mã hóa một chiều bằng thuật toán BCrypt với độ muối (salt) tự sinh, không thể giải mã ngược.\n"
            "  + Mọi phiên giao tiếp mạng giữa Client và Server bắt buộc mã hóa qua giao thức HTTPS / TLS 1.3.\n"
            "  + Ngăn chặn 100% các lỗ hổng bảo mật phổ biến theo OWASP Top 10: SQL Injection (thông qua JPA Prepared Statements), XSS (thông qua React JSX Escaping), CSRF (thông qua cơ chế Stateless JWT) và IDOR (thông qua kiểm tra sở hữu tài nguyên tại tầng Service).\n\n"
            "- **Độ tin cậy và sẵn sàng (Reliability & Availability - NFR-REL):**\n"
            "  + Hệ thống bảo đảm thời gian hoạt động liên tục (Uptime) đạt tối thiểu 99.5% trong tháng.\n"
            "  + Toàn bộ các thao tác tài chính (chuyển nhượng cổ phần, gạch nợ chi phí) bắt buộc thực thi trong giao dịch ACID với mức cô lập nghiêm ngặt, bảo đảm không bao giờ xảy ra tình trạng sai lệch số dư.\n\n"
            "- **Khả năng mở rộng (Scalability - NFR-SCA):**\n"
            "  + Kiến trúc Backend phi trạng thái (Stateless) cho phép mở rộng quy mô theo chiều ngang (Horizontal Scaling) thông qua việc bổ sung thêm các máy chủ ứng dụng phía sau bộ cân bằng tải (Load Balancer).\n"
            "  + Lược đồ CSDL được tối ưu hóa chỉ mục (Indexes) trên các trường khóa ngoại và các trường thời gian thường xuyên truy vấn.\n\n"
            "- **Tính khả dụng và trải nghiệm người dùng (Usability - NFR-USA):**\n"
            "  + Giao diện thiết kế theo chuẩn Responsive Web Design, tương thích hoàn hảo trên các độ phân giải màn hình từ Desktop (1920x1080) đến Laptop (1366x768) và Tablet.\n"
            "  + Cung cấp cơ chế tự động chuyển đổi sang giao diện 2D tĩnh nếu thiết bị người dùng không hỗ trợ phần cứng WebGL 2.0."
        ),
        (
            "3.5. Ràng buộc thiết kế và kiến trúc hệ thống",
            "Quá trình phân tích và thiết kế hệ thống phải tuân thủ các ràng buộc công nghệ và pháp lý sau:\n"
            "1. **Ràng buộc công nghệ:** Backend bắt buộc sử dụng ngôn ngữ Java 21 LTS và framework Spring Boot 3.3.4; Frontend bắt buộc sử dụng React 18 và TypeScript; CSDL quan hệ bắt buộc sử dụng MySQL 8.0.\n"
            "2. **Ràng buộc định dạng đồ họa:** Toàn bộ mô hình phương tiện 3D phải được tối ưu hóa ở định dạng chuẩn GLTF/GLB với số lượng đa giác (Polygon Count) không vượt quá 150.000 tam giác (triangles) và kích thước tệp nén không vượt quá 15 MB để bảo đảm khả năng tải nhanh trên nền tảng Web.\n"
            "3. **Ràng buộc quy chuẩn kế toán:** Đơn vị tiền tệ chính thức sử dụng trong toàn bộ hệ thống là Đồng Việt Nam (VND). Các phép tính phân bổ chi phí phải được làm tròn tới hàng đơn vị đồng nguyên vẹn, không được lưu trữ số lẻ thập phân đối với tiền tệ thanh toán."
        ),
        (
            "3.7. Phân tích luồng nghiệp vụ cốt lõi (User Journey)",
            "Trải nghiệm vòng đời hoàn chỉnh của một nhóm đồng sở hữu trên nền tảng EVShare 3D bao gồm 5 giai đoạn liên hoàn:\n\n"
            "1. **Giai đoạn 1: Khởi tạo nhóm và Ký kết hợp đồng:** Trưởng nhóm tạo nhóm xe trên hệ thống, mời các thành viên tham gia, thống nhất tỷ lệ cổ phần ban đầu (tổng 100%) và các bên thực hiện ký số điện tử trên bản hợp đồng đồng sở hữu mẫu.\n"
            "2. **Giai đoạn 2: Lập lịch và Đặt xe thông minh:** Thành viên kiểm tra lịch biểu xe, chọn khung giờ trống phù hợp với hạn ngạch tháng, hệ thống kích hoạt thuật toán chống trùng lấn biên và khóa khung giờ đặt xe.\n"
            "3. **Giai đoạn 3: Bàn giao xe và Vận hành chuyến đi:** Đến giờ khởi hành, nhân viên và người nhận xe cùng kiểm tra an toàn, lập biên bản bàn giao số, chụp ảnh hiện trường. Hệ thống kiểm tra pin >= 20% và mở quyền bắt đầu chuyến đi. Trong chuyến đi, người dùng theo dõi tiêu hao năng lượng tức thời qua bảng điều khiển.\n"
            "4. **Giai đoạn 4: Nghiệm thu hoàn trả và Hạch toán tiền điện:** Kết thúc chuyến đi, nhân viên kiểm định lại xe, chốt số km và pin kết thúc. Hệ thống tự động tính điện năng tiêu thụ, nhân với giá vốn WAC của xe để trừ kho năng lượng và sinh hóa đơn chi phí cá nhân cho người lái.\n"
            "5. **Giai đoạn 5: Quản trị chi phí, Biểu quyết và Hòa giải:** Các chi phí bảo dưỡng chung được phân bổ tự động bằng thuật toán Hare-Niemeyer. Các quyết định lớn được đưa ra biểu quyết theo trọng số cổ phần. Khi có va chạm hoặc trễ giờ, phòng hòa giải trực tuyến được kích hoạt để nhân viên độc lập hỗ trợ giải quyết công tâm."
        )
    ]
}

def get_chapter_3_intro():
    return CHAPTER_3_INTRO
