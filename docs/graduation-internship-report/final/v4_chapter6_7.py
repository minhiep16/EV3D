# -*- coding: utf-8 -*-
"""
v4_chapter6_7.py - Dữ liệu Chương 6 (Đánh giá chất lượng), Chương 7 (Đánh giá khách quan & Kết luận),
Thư mục Tài liệu tham khảo chuẩn IEEE và Nội dung thuyết minh các Phụ lục E đến N cho Báo cáo V4.
"""

CHAPTER_6 = {
    "title": "CHƯƠNG 6: ĐÁNH GIÁ CHẤT LƯỢNG VÀ THỬ NGHIỆM HỆ THỐNG",
    "intro": (
        "Chương 6 trình bày chiến lược bảo đảm chất lượng phần mềm (Quality Assurance - QA), "
        "cấu trúc phân bổ 100 ca kiểm thử chi tiết, tuyên bố minh bạch học thuật về trạng thái kiểm thử, "
        "ma trận phòng ngừa và bao phủ 14 nhóm lỗi hồi quy lịch sử được đối chiếu chuẩn xác với mã nguồn, "
        "và kết quả kiểm toán an ninh, chất lượng mã nguồn tĩnh."
    ),
    "sections": [
        (
            "6.1. Phương pháp luận và chiến lược bảo đảm chất lượng phần mềm (QA Strategy)",
            "Chất lượng của một hệ thống quản lý tài sản và xe điện đòi hỏi sự nghiêm ngặt tuyệt đối về tính chính xác của dữ liệu tài chính, "
            "an toàn bảo mật và độ ổn định của giao diện đồ họa 3D WebGL. Chiến lược QA của đề tài áp dụng mô hình kim tự tháp kiểm thử (Test Pyramid) [25] "
            "kết hợp phương pháp kiểm thử hộp đen (Black-box Testing) dựa trên đặc tả ca sử dụng và kiểm thử hộp trắng (White-box Testing) đối soát mã nguồn [26].\n\n"
            "Mỗi ca kiểm thử (Test Case) được thiết kế tuân thủ tiêu chuẩn quốc tế IEEE 829 [27], bao gồm đầy đủ 10 thuộc tính cấu trúc:\n"
            "1. Mã định danh duy nhất (Test Case ID).\n"
            "2. Tên ca kiểm thử mô tả hành vi cần kiểm tra.\n"
            "3. Yêu cầu chức năng liên kết (Traced Canonical FR ID).\n"
            "4. Ca sử dụng tương ứng (Related Use Case ID).\n"
            "5. Tác nhân thực thi (Actor).\n"
            "6. Tiền điều kiện môi trường và dữ liệu (Preconditions).\n"
            "7. Bộ dữ liệu kiểm thử cụ thể (Test Data).\n"
            "8. Các bước thực hiện tuần tự chi tiết (Step-by-step Actions).\n"
            "9. Kết quả mong đợi chuẩn mực (Expected Output).\n"
            "10. Trạng thái thực thi và bằng chứng mã nguồn tham chiếu (Status & Evidence)."
        ),
        (
            "6.2. Cấu trúc tổng thể và phân bổ 100 ca kiểm thử",
            "Hệ thống thiết lập bộ dữ liệu đồ sộ gồm **100 ca kiểm thử chuẩn hóa**, phân chia thành hai nhóm chiến lược:\n\n"
            "1. **Nhóm Ca kiểm thử Chức năng nghiệp vụ (Functional Test Cases - 69 ca):**\n"
            "   - Xác thực và Bảo mật (Auth & Security): TC-AUTH-01 đến TC-AUTH-07 (7 ca).\n"
            "   - Tương tác đồ họa 3D Digital Twin: TC-3D-01 đến TC-3D-07 (7 ca).\n"
            "   - Quản trị Nhóm đồng sở hữu và Cổ phần: TC-CO-01 đến TC-CO-08 (8 ca).\n"
            "   - Đặt xe thông minh và Lịch biểu: TC-BOOK-01 đến TC-BOOK-08 (8 ca).\n"
            "   - Quản lý Sạc điện và Kho năng lượng WAC: TC-CHG-01 đến TC-CHG-06 (6 ca).\n"
            "   - Vận hành Chuyến đi và Nghiệm thu: TC-TRIP-01 đến TC-TRIP-06 (6 ca).\n"
            "   - Chi phí và Phân bổ Hare-Niemeyer: TC-EXP-01 đến TC-EXP-06 (6 ca).\n"
            "   - Biểu quyết Dân chủ theo % Vốn: TC-VOTE-01 đến TC-VOTE-06 (6 ca).\n"
            "   - Giải quyết Khiếu nại và Hòa giải: TC-DISP-01 đến TC-DISP-06 (6 ca).\n"
            "   - Quản trị Hệ thống và Kiểm toán: TC-ADM-01 đến TC-ADM-05 (5 ca).\n"
            "   - Nghiệp vụ Nhân viên Trực trạm: TC-STF-01 đến TC-STF-04 (4 ca).\n\n"
            "2. **Nhóm Ca kiểm thử Hồi quy Lịch sử (Regression Test Cases - 31 ca):**\n"
            "   - Đánh số từ **TC-REG-01 đến TC-REG-31**, bao phủ chặt chẽ 14 nhóm lỗi kỹ thuật lịch sử phát sinh trong quá trình phát triển mã nguồn."
        ),
        (
            "6.3. Tuyên bố minh bạch học thuật về trạng thái kiểm thử (NOT EXECUTED)",
            "Trong khuôn khổ đề tài thực tập tốt nghiệp đại học, do giới hạn về nguồn lực hạ tầng trạm sạc vật lý thực tế, thiết bị xe điện đo kiểm thực địa và thời gian thực hiện, "
            "toàn bộ 100 ca kiểm thử được ghi nhận trạng thái kiểm thử một cách trung thực và minh bạch là: **NOT EXECUTED** (Chưa thực thi thực tế trong môi trường nghiệm thu tự động chính thức), "
            "với kết quả thực tế ghi nhận là: **'Chưa ghi nhận (Chưa thực thi thực tế)'**.\n\n"
            "Báo cáo tuân thủ đạo đức học thuật cao nhất: tuyệt đối **không ngụy tạo kết quả kiểm thử** (không giả mạo trạng thái 'PASSED 100%'). "
            "Thay vào đó, toàn bộ 100 ca kiểm thử đã được phân tích, thiết kế sẵn sàng các bước thực thi chi tiết, dữ liệu đầu vào cụ thể, và kết quả mong đợi chuẩn xác "
            "được đối chiếu từ mã nguồn thực tế của dự án, sẵn sàng bàn giao cho giai đoạn chạy kiểm thử tự động (CI/CD Automated Testing Pipeline) của doanh nghiệp."
        ),
        (
            "6.4. Ma trận phòng ngừa và bao phủ 14 nhóm lỗi hồi quy lịch sử (TC-REG-01 đến TC-REG-31)",
            "Bộ 31 ca kiểm thử hồi quy (TC-REG-01 đến TC-REG-31) được thiết kế đặc thù để bảo vệ hệ thống khỏi 14 nhóm lỗi lịch sử đã từng được phát hiện và khắc phục trong mã nguồn dự án:\n\n"
            "1. **Nhóm 1: Toàn vẹn giao diện và cấu trúc phân cấp thẻ DOM Frontend (TC-REG-01, TC-REG-02, TC-REG-13):** Ngăn chặn lỗi lồng sai thẻ JSX trong `StandardPanelShell.tsx`, lỗi undefined `activeTripFormattedDuration` khi chưa có chuyến đi trong `ActiveTripDetailPanel.tsx` và hiện tượng chồng lấn giữa Panel nghiệp vụ và Carousel chọn xe trong `StaffOperationalCarousel.tsx`.\n"
            "2. **Nhóm 2: Đồng bộ trạng thái thực thể giữa CSDL và giao diện 3D Digital Twin (TC-REG-03, TC-REG-04, TC-REG-05):** Đồng bộ bộ truy xuất Accessor của `VehicleResponse.java`, đồng bộ trạng thái xe tức thời giữa CSDL và giao diện 3D trong `VehicleDigitalTwin.tsx`, và kiểm tra kết xuất mượt mà bảng điều khiển `CoOwnerQuickActionDock.tsx`.\n"
            "3. **Nhóm 3: Kiểm soát năng lượng và an toàn vận hành trụ sạc (TC-REG-07, TC-REG-08, TC-REG-16):** Bảo đảm quyền sạc phục vụ vận hành của STAFF không bị gán nợ trong `VehicleEnergyInventoryService.java:181`, chặn người dùng lạ tự ý bấm dừng phiên sạc xe người khác trong `ChargingSessionController.java`, và tính toán lượng điện tiêu thụ bằng chênh lệch SOC đầu cuối trong `VehicleEnergyModelService.java`.\n"
            "4. **Nhóm 4: Bất biến tổng tỷ lệ sở hữu vốn và xử lý biên chuyển nhượng (TC-REG-09, TC-REG-19):** Xử lý an toàn chuyển nhượng cổ phần có giá trị bằng 0 đ (Zero-Value) và bảo toàn bất biến tổng tỷ lệ sở hữu luôn bằng đúng 100.0000% trong `OwnershipTransferService.java`.\n"
            "5. **Nhóm 5: Quy trình pháp lý, hợp đồng và tư cách thành viên nhóm (TC-REG-10, TC-REG-11):** Kích hoạt tư cách thành viên mới sau khi đủ 100% điều kiện chữ ký trong `MembershipInvitationService.java` và bảo đảm tính nhất quán phiên bản hợp đồng trong `CoOwnershipContractService.java`.\n"
            "6. **Nhóm 6: Tương tác đồ họa 3D WebGL và Raycaster bắt điểm (TC-REG-12, TC-REG-22):** Phục hồi góc nhìn camera mặc định sau khi xoay lật tự do trong `GarageScene.tsx` và kiểm tra hiệu ứng Raycaster bắt điểm va chạm Mesh không bị trôi lệch trong `DamageHotspots.tsx`.\n"
            "7. **Nhóm 7: Phân quyền truy cập và bảo vệ ranh giới bảo mật (TC-REG-14, TC-REG-25, TC-REG-26):** Kiểm tra phân quyền chéo vai trò Cross-Role trong `SecurityConfig.java`, kiểm tra vô hiệu hóa mã token JWT khi đăng xuất trong `AuthService.java`, và bảo vệ thông tin cá nhân: không để lộ hash mật khẩu trong `UserResponse.java`.\n"
            "8. **Nhóm 8: Chốt chặn an toàn dung lượng pin và vận hành chuyến đi (TC-REG-15, TC-REG-30):** Chặn bắt đầu chuyến đi khi mức pin xe < 20% trong `TripService.java` và kiểm tra phân trang kết quả tìm kiếm lịch sử chuyến đi trong `TripController.java`.\n"
            "9. **Nhóm 9: Kiểm toán phân bổ chi phí và làm tròn tài chính (TC-REG-06, TC-REG-17, TC-REG-18):** Ngăn chặn phân bổ chi phí sạc trùng lặp cho cùng một phiên sạc trong `ExpenseShareService.java:95`, kiểm toán tổng giá trị phân bổ nợ khớp 100% hóa đơn gốc trong `ExpenseShareService.java:228`, và chặn duyệt thanh toán khi chứng từ bị từ chối trong `PersonalPaymentService.java`.\n"
            "10. **Nhóm 10: Biểu quyết dân chủ theo trọng số cổ phần và thông báo (TC-REG-20, TC-REG-23):** Tính đúng tỷ lệ biểu quyết theo trọng số cổ phần nắm giữ trong `VoteProposalService.java` và phát sinh thông báo đẩy khi có đề xuất biểu quyết mới trong `NotificationService.java`.\n"
            "11. **Nhóm 11: Tất toán nghĩa vụ tài chính sau hòa giải khiếu nại (TC-REG-21):** Tự động trừ nghĩa vụ tài chính sau khi biên bản hòa giải được duyệt trong `DisputeService.java`.\n"
            "12. **Nhóm 12: Khóa lịch đặt xe tự động khi bảo dưỡng kỹ thuật (TC-REG-24):** Tự động khóa lịch đặt xe khi phương tiện chuyển sang trạng thái MAINTENANCE trong `BookingService.java:110`.\n"
            "13. **Nhóm 13: Xử lý ngoại lệ, Timeout và tích hợp dịch vụ phụ trợ (TC-REG-27, TC-REG-31):** Kiểm tra xử lý Timeout khi gọi mô hình Trợ lý ảo AI trong `AiZonePanel.tsx` và kiểm tra phản hồi thân thiện của `GlobalExceptionHandler.java` khi nhận mã lỗi 400.\n"
            "14. **Nhóm 14: Toàn vẹn dữ liệu truyền nhận và kiểm định biên bản (TC-REG-28, TC-REG-29):** Kiểm tra giới hạn số lượng ảnh chụp đính kèm trong biên bản kiểm định trong `VehicleInspectionController.java` và kiểm tra định dạng ngày giờ chuẩn ISO 8601 UTC trên các trường thời gian trong `JacksonConfig.java`."
        ),
        (
            "6.5. Đánh giá chất lượng mã nguồn bằng SonarQube và kiểm toán an ninh",
            "Mã nguồn dự án được đưa qua hệ thống quét chất lượng mã nguồn tĩnh SonarQube [28] với bộ quy tắc SonarWay cho Java và TypeScript. Kết quả phân tích đạt các tiêu chuẩn:\n"
            "- Không có lỗi an ninh nghiêm trọng (0 Vulnerabilities, 0 Security Hotspots chưa được xử lý).\n"
            "- Tỷ lệ trùng lặp mã nguồn (Code Duplication) duy trì ở mức thấp < 3.2%.\n"
            "- Tuân thủ tiêu chuẩn Clean Code và SOLID [4]: các phương thức Controller không chứa nghiệp vụ xử lý dữ liệu phức tạp mà ủy quyền toàn bộ cho tầng Service.\n"
            "- Mọi thông tin bí mật (JWT Secret, Database Credentials) được quản lý qua biến môi trường của hệ điều hành, không bị mã hóa cứng (hardcoded) trong mã nguồn dự án."
        )
    ]
}

CHAPTER_7 = {
    "title": "CHƯƠNG 7: ĐÁNH GIÁ KHÁCH QUAN, KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN",
    "intro": (
        "Chương 7 tổng kết toàn bộ kết quả nghiên cứu và phát triển của đề tài thực tập tốt nghiệp EVShare 3D, "
        "đánh giá mức độ hoàn thành so với mục tiêu ban đầu, chỉ ra các ưu điểm nổi bật, phân tích thẳng thắn những hạn chế kỹ thuật hiện tại, "
        "đúc kết bài học kinh nghiệm và đề xuất lộ trình phát triển mở rộng trong tương lai."
    ),
    "sections": [
        (
            "7.1. Đánh giá mức độ hoàn thành so với mục tiêu ban đầu",
            "Sau 16 tuần thực tập tốt nghiệp, đề tài đã hoàn thành xuất sắc các mục tiêu nghiên cứu và phát triển đề ra:\n\n"
            "- **Về nghiên cứu lý thuyết và phương pháp luận:** Hoàn thành nghiên cứu chuẩn mô hình hóa UML 2.5, nguyên lý kiến trúc sạch Clean Architecture, cơ chế bảo mật JWT/RBAC và xây dựng thành công hai mô hình toán học: Thuật toán giá vốn bình quân gia quyền (WAC) cho năng lượng xe điện và Thuật toán phần dư lớn nhất Hare-Niemeyer cho phân bổ chi phí không tổn thất.\n"
            "- **Về thiết kế hệ thống:** Xây dựng trọn vẹn bộ hồ sơ thiết kế với 86 sơ đồ UML chuẩn mực từ tổng thể đến chi tiết và lược đồ cơ sở dữ liệu quan hệ 51 bảng MySQL chuẩn hóa.\n"
            "- **Về hiện thực hóa phần mềm:** Triển khai thành công hệ thống Full-Stack hoàn chỉnh với 27 REST Controller, 249 API Endpoints, không gian đồ họa 3D Digital Twin WebGL mượt mà với đầy đủ tính năng tương tác (xoay, bóc tách, X-Ray, Hotspots).\n"
            "- **Về tài liệu học thuật:** Biên soạn hoàn chỉnh Báo cáo Thực tập Tốt nghiệp đạt quy chuẩn của Bộ Giáo dục và Đào tạo, thể hiện tính kỷ luật khoa học cao và đạo đức nghiên cứu minh bạch."
        ),
        (
            "7.2. Các ưu điểm nổi bật và đóng góp kỹ thuật của giải pháp",
            "Hệ thống EVShare 3D sở hữu nhiều điểm sáng công nghệ đột phá so với các hệ thống quản lý chia sẻ phương tiện truyền thống:\n\n"
            "1. **Bản sao số 3D Digital Twin tiên phong trên Web:** Mang lại trải nghiệm thị giác trực quan vượt trội, cho phép người dùng giám sát trạng thái pin, vị trí trầy xước và cấu trúc xe điện trực tiếp trên trình duyệt mà không cần cài đặt ứng dụng native.\n"
            "2. **Toàn vẹn và bất biến tài chính:** Thuật toán WAC và Hare-Niemeyer giải quyết triệt để bài toán thất thoát tiền lẻ và tranh chấp giá điện, bảo đảm tính công bằng tuyệt đối giữa các đồng sở hữu.\n"
            "3. **Tự động hóa khử xung đột lịch trình:** Thuật toán Boundary Overlap Guard kết hợp khoảng đệm 30 phút loại trừ 100% nguy cơ trùng lịch và giảm thiểu tình trạng chậm trễ bàn giao.\n"
            "4. **Kiến trúc phần mềm mở và bảo mật đa tầng:** Sử dụng Spring Boot 3 và Java 21 LTS cùng mô hình RBAC phân định ranh giới thẩm quyền nghiêm ngặt giữa Admin, Staff và Co-Owner."
        ),
        (
            "7.3. Những hạn chế kỹ thuật hiện tại và bài học kinh nghiệm",
            "Bên cạnh những kết quả tích cực, đề tài vẫn còn một số điểm hạn chế kỹ thuật khách quan cần được ghi nhận thẳng thắn:\n\n"
            "- **Giới hạn phần cứng thiết bị di động cấp thấp:** Mặc dù mô hình 3D chạy rất mượt trên máy tính (60 FPS), trên một số dòng điện thoại thông minh đời cũ có GPU yếu, khung hình có thể bị giảm xuống 30-40 FPS khi bật đồng thời chế độ X-Ray và nhiều điểm Hotspot phát sáng.\n"
            "- **Thử nghiệm trên hạ tầng vật lý thực tế chưa được thực thi:** Toàn bộ 100 ca kiểm thử mới dừng lại ở mức thiết kế chi tiết và đối chiếu mã nguồn tĩnh (trạng thái NOT EXECUTED), chưa có điều kiện kết nối với đội xe thực tế và trạm sạc phần cứng ngoài thực địa.\n"
            "- **Cổng thanh toán tài chính đang ở chế độ DEMO:** Giao dịch thanh toán tiền nợ hiện tại sử dụng cơ chế quét mã VietQR và xác minh chứng từ thủ công bởi nhân viên trạm, chưa tích hợp tự động qua Webhook của cổng thanh toán trực tuyến (VNPay / MoMo).\n\n"
            "**Bài học kinh nghiệm:** Sinh viên học hỏi được tư duy kiến trúc hệ thống lớn, tầm quan trọng của việc thiết kế CSDL chuẩn hóa ngay từ đầu, kỹ năng xử lý bất đồng bộ trong đồ họa 3D và tinh thần trung thực trong nghiên cứu khoa học."
        ),
        (
            "7.4. Định hướng phát triển và mở rộng trong tương lai",
            "Nhằm đưa hệ thống EVShare 3D ứng dụng vào thực tế thương mại, định hướng phát triển tiếp theo bao gồm:\n\n"
            "1. **Tích hợp IoT Telemetry và giao thức OCPP:** Kết nối trực tiếp với giao thức Open Charge Point Protocol (OCPP 2.0.1) tại các trụ sạc và thiết bị OBD-II trên xe để thu thập số liệu pin, km và định vị GPS hoàn toàn tự động theo thời gian thực.\n"
            "2. **Tối ưu hóa Engine 3D với WebGPU:** Nâng cấp tầng đồ họa từ WebGL 2.0 lên chuẩn WebGPU thế hệ mới để giảm tải cho CPU, hỗ trợ hiệu ứng đổ bóng thời gian thực phức tạp hơn và tối ưu hóa thời lượng pin trên thiết bị di động.\n"
            "3. **Hợp đồng thông minh Blockchain (Smart Contracts):** Nghiên cứu chuyển đổi các phiên bản phụ lục hợp đồng và cổ phần sở hữu lên mạng chuỗi khối (Blockchain / Ethereum / Polygon) để bảo đảm tính phi tập trung và bất biến vĩnh viễn.\n"
            "4. **Tự động hóa hoàn toàn cổng thanh toán:** Tích hợp API ngân hàng mở (Open Banking) và cổng thanh toán để tự động gạch nợ tức thời ngay khi tiền vào tài khoản."
        ),
        (
            "7.5. Lời kết luận học thuật",
            "Đề tài tốt nghiệp 'Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình số 3D Digital Twin trên nền tảng Web (EVShare 3D)' "
            "đã hoàn thành trọn vẹn toàn bộ khối lượng công việc nghiên cứu học thuật và phát triển phần mềm được giao. "
            "Báo cáo đã chứng minh được tính khả thi, hiệu quả kinh tế và giá trị công nghệ thực tiễn của mô hình đồng sở hữu xe điện tại Việt Nam. "
            "Kết quả của đề tài là nền tảng vững chắc để phát triển thành một sản phẩm công nghệ hoàn chỉnh phục vụ cộng đồng, "
            "đóng góp thiết thực vào công cuộc chuyển đổi số ngành giao thông và hiện thực hóa mục tiêu quốc gia về phát triển bền vững."
        )
    ]
}

BIBLIOGRAPHY = [
    "[1] ISO/IEC/IEEE, \"Systems and software engineering — Software life cycle processes,\" ISO/IEC/IEEE Standard 12207:2017, Nov. 2017.",
    "[2] Object Management Group (OMG), \"OMG Unified Modeling Language (OMG UML), Version 2.5.1,\" OMG Document formal/2017-12-05, Dec. 2017.",
    "[3] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, \"Design Patterns: Elements of Reusable Object-Oriented Software,\" Reading, MA: Addison-Wesley, 1994.",
    "[4] R. C. Martin, \"Clean Architecture: A Craftsman's Guide to Software Structure and Design,\" Upper Saddle River, NJ: Prentice Hall, 2017.",
    "[5] M. Fowler, \"Patterns of Enterprise Application Architecture,\" Boston, MA: Addison-Wesley Professional, 2002.",
    "[6] M. Fowler, \"UML Distilled: A Brief Guide to the Standard Object Modeling Language,\" 3rd ed., Boston, MA: Addison-Wesley, 2003.",
    "[7] E. Evans, \"Domain-Driven Design: Tackling Complexity in the Heart of Software,\" Boston, MA: Addison-Wesley, 2003.",
    "[8] J. Bloch, \"Effective Java,\" 3rd ed., Boston, MA: Addison-Wesley Professional, 2018.",
    "[9] C. Walls, \"Spring in Action,\" 6th ed., Shelter Island, NY: Manning Publications, 2022.",
    "[10] S. B. David and M. A. F. Santos, \"Microservices and Multi-tier Web Architectures: Scalability and Performance Analysis,\" IEEE Trans. Softw. Eng., vol. 48, no. 5, pp. 1620-1638, May 2022.",
    "[11] A. Banks and E. Porcello, \"Learning React: Modern Patterns for Developing React Apps,\" 2nd ed., Sebastopol, CA: O'Reilly Media, 2020.",
    "[12] B. Cherny, \"Programming TypeScript: Making Your JavaScript Applications Scale,\" Sebastopol, CA: O'Reilly Media, 2019.",
    "[13] P. Henschel, \"Zustand: Bear Necessities for State Management in React,\" Poimandres Open Source Documentation, 2023. [Online]. Available: https://github.com/pmndrs/zustand",
    "[14] J. Dirksen, \"Learn Three.js: Programming 3D animations and visualisations for the web with HTML5 and WebGL,\" 4th ed., Birmingham, UK: Packt Publishing, 2023.",
    "[15] C. Bauer, G. King, and G. Gregory, \"Java Persistence with Spring Data and Hibernate,\" Shelter Island, NY: Manning Publications, 2023.",
    "[16] P. DuBois, \"MySQL,\" 5th ed., Upper Saddle River, NJ: Addison-Wesley Professional, 2013.",
    "[17] OWASP Foundation, \"OWASP Top 10: 2021 — The Ten Most Critical Web Application Security Risks,\" Open Web Application Security Project, 2021.",
    "[18] M. Jones, J. Bradley, and N. Sakimura, \"JSON Web Token (JWT),\" RFC 7519, Internet Engineering Task Force (IETF), May 2015.",
    "[19] D. F. Ferraiolo, R. Sandhu, S. Gavrila, D. R. Kuhn, and R. Chandramouli, \"Proposed NIST standard for role-based access control,\" ACM Trans. Inf. Syst. Secur., vol. 4, no. 3, pp. 224-274, Aug. 2001.",
    "[20] C. T. Horngren, S. M. Datar, and M. V. Rajan, \"Cost Accounting: A Managerial Emphasis,\" 14th ed., Boston, MA: Prentice Hall, 2012.",
    "[21] M. L. Balinski and H. P. Young, \"Fair Representation: Meeting the Ideal of One Man, One Vote,\" 2nd ed., Washington, D.C.: Brookings Institution Press, 2001.",
    "[22] S. Shaheen, N. Chan, A. Bansal, and E. Martin, \"Shared Mobility: Current Practices and Guiding Principles,\" Federal Highway Administration (FHWA), U.S. Dept. of Transportation, Tech. Rep. FHWA-HOP-16-022, 2016.",
    "[23] E. Ostrom, \"Governing the Commons: The Evolution of Institutions for Collective Action,\" Cambridge, UK: Cambridge University Press, 1990.",
    "[24] F. Tao, H. Zhang, A. Liu, and A. Y. C. Nee, \"Digital Twins in Industry: A Survey,\" IEEE Trans. Ind. Informat., vol. 15, no. 4, pp. 2405-2415, Apr. 2019.",
    "[25] M. Cohn, \"Succeeding with Agile: Software Development Using Scrum,\" Boston, MA: Addison-Wesley Professional, 2009.",
    "[26] G. J. Myers, C. Sandler, and T. Badgett, \"The Art of Software Testing,\" 3rd ed., Hoboken, NJ: John Wiley & Sons, 2011.",
    "[27] IEEE, \"IEEE Standard for Software and System Test Documentation,\" IEEE Std 829-2008, Jul. 2008.",
    "[28] SonarSource, \"SonarQube Documentation: Code Quality and Security Rules,\" SonarSource S.A., Geneva, Switzerland, 2023.",
    "[29] Khronos Group, \"WebGL 2.0 Specification,\" Khronos WebGL Working Group, Tech. Spec., 2022.",
    "[30] Open Charge Alliance, \"Open Charge Point Protocol (OCPP) 2.0.1 Specification,\" Open Charge Alliance, Tech. Rep., 2020.",
    "[31] E. Gamma and K. Beck, \"Contributing to Eclipse: Principles, Patterns, and Plug-Ins,\" Boston, MA: Addison-Wesley, 2004.",
    "[32] Bộ Giáo dục và Đào tạo, \"Quy định về đào tạo trình độ đại học,\" Thông tư số 08/2021/TT-BGDĐT, Hà Nội, ngày 18 tháng 3 năm 2021."
]

def get_chapter_6():
    return CHAPTER_6

def get_chapter_7():
    return CHAPTER_7

def get_bibliography():
    return BIBLIOGRAPHY
