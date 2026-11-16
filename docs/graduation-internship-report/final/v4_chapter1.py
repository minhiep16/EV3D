# -*- coding: utf-8 -*-
"""
v4_chapter1.py - Dữ liệu Phần đầu tài liệu (Front Matter) và Chương 1 (10 mục học thuật chi tiết)
với các khung giữ chỗ chuẩn hóa: [HỌ VÀ TÊN SINH VIÊN], [MÃ SỐ SINH VIÊN], v.v.
"""

FRONT_MATTER = {
    "title_vi": "NGHIÊN CỨU, THIẾT KẾ VÀ PHÁT TRIỂN HỆ THỐNG QUẢN LÝ ĐỒNG SỞ HỮU XE ĐIỆN TÍCH HỢP MÔ HÌNH SỐ 3D DIGITAL TWIN TRÊN NỀN TẢNG WEB (EVSHARE 3D)",
    "title_en": "RESEARCH, DESIGN AND DEVELOPMENT OF AN ELECTRIC VEHICLE CO-OWNERSHIP MANAGEMENT PLATFORM INTEGRATED WITH 3D WEB DIGITAL TWIN (EVSHARE 3D)",
    "student_name": "[HỌ VÀ TÊN SINH VIÊN]",
    "student_id": "[MÃ SỐ SINH VIÊN]",
    "class_name": "[LỚP KHÓA HỌC]",
    "academic_supervisor": "[GIẢNG VIÊN HƯỚNG DẪN]",
    "enterprise_supervisor": "[NGƯỜI HƯỚNG DẪN TẠI DOANH NGHIỆP]",
    "enterprise_name": "[CƠ QUAN / DOANH NGHIỆP THỰC TẬP]",
    "faculty": "KHOA CÔNG NGHỆ THÔNG TIN",
    "major": "KỸ THUẬT PHẦN MỀM",
    "year": "2026",
    "location": "Hà Nội"
}

CHAPTER_1 = {
    "title": "CHƯƠNG 1: GIỚI THIỆU TỔNG QUAN VÀ BỐI CẢNH THỰC TẬP TỐT NGHIỆP",
    "intro": (
        "Chương 1 trình bày bối cảnh thực tiễn của đề tài thực tập tốt nghiệp, môi trường doanh nghiệp tiếp nhận thực tập, "
        "tính cấp thiết của bài toán đồng sở hữu xe điện (EV Co-ownership) tại Việt Nam, các mục tiêu nghiên cứu, phạm vi triển khai, "
        "phương pháp luận kỹ thuật và đóng góp thực tiễn của sinh viên trong suốt kỳ thực tập."
    ),
    "sections": [
        (
            "1.1. Giới thiệu tổng quan về đề tài thực tập tốt nghiệp",
            "Đề tài thực tập tốt nghiệp đại học chuyên ngành Kỹ thuật Phần mềm có tên chính thức: "
            "**'Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình số 3D Digital Twin trên nền tảng Web (EVShare 3D)'**.\n\n"
            "Đề tài tập trung giải quyết bài toán giao thoa giữa kinh tế chia sẻ (Sharing Economy), kỹ thuật phần mềm hướng dịch vụ (Service-Oriented Software Engineering) "
            "và công nghệ đồ họa không gian ba chiều thời gian thực (Interactive 3D Web Graphics). Bằng cách kết hợp nền tảng Backend doanh nghiệp Spring Boot "
            "với giao diện SPA React và thư viện Three.js / React Three Fiber, đề tài xây dựng một giải pháp phần mềm toàn diện giúp các nhóm cá nhân "
            "có thể cùng mua chung, quản lý minh bạch lịch trình sử dụng, hạch toán chi phí bảo dưỡng và giám sát trực quan trạng thái kỹ thuật của xe điện thông qua bản sao kỹ thuật số 3D."
        ),
        (
            "1.2. Đơn vị thực tập và môi trường nghiên cứu ứng dụng",
            "Quá trình thực tập tốt nghiệp được thực hiện tại đơn vị: **[CƠ QUAN / DOANH NGHIỆP THỰC TẬP]** "
            "dưới sự hướng dẫn chuyên môn của **[NGƯỜI HƯỚNG DẪN TẠI DOANH NGHIỆP]** và sự định hướng học thuật của **[GIẢNG VIÊN HƯỚNG DẪN]**.\n\n"
            "Đơn vị thực tập là doanh nghiệp hoạt động trong lĩnh vực giải pháp công nghệ giao thông xanh, phát triển hạ tầng trạm sạc xe điện thông minh "
            "và cung cấp các nền tảng số hóa quản lý tài sản phương tiện. Môi trường thực tập trang bị đầy đủ hạ tầng máy chủ nội bộ, mạng cục bộ tốc độ cao, "
            "hệ thống kiểm soát phiên bản Gitlab/GitHub, quy trình tích hợp liên tục CI/CD và quy chế bảo mật thông tin nghiêm ngặt. "
            "Sinh viên được tiếp cận môi trường làm việc chuyên nghiệp, trực tiếp tham gia các buổi họp Scrum Daily, Sprint Planning và Code Review định kỳ."
        ),
        (
            "1.3. Bối cảnh chuyển dịch xe điện và mô hình kinh tế chia sẻ (Shared Mobility)",
            "Trong bối cảnh biến đổi khí hậu toàn cầu và định hướng giảm phát thải ròng bằng 0 (Net Zero) vào năm 2050 theo cam kết của Chính phủ Việt Nam tại COP26, "
            "ngành giao thông vận tải đang chứng kiến làn sóng chuyển dịch mạnh mẽ từ các phương tiện sử dụng nhiên liệu hóa thạch sang xe điện (Electric Vehicles - EV).\n\n"
            "Tuy nhiên, chi phí đầu tư ban đầu để sở hữu một chiếc xe điện thông minh (như VinFast VF8, VF9) vẫn là một rào cản tài chính tương đối lớn đối với đa số người dùng phổ thông. "
            "Bên cạnh đó, hiệu suất sử dụng phương tiện cá nhân tại các đô thị lớn chỉ dao động từ 5% đến 10% thời gian trong ngày (xe nằm bất động tại bãi đỗ hơn 90% thời gian), "
            "gây lãng phí tài sản xã hội và gia tăng áp lực đỗ xe đô thị. Mô hình **Đồng sở hữu (Co-ownership / Fractional Ownership)** nổi lên như một giải pháp đột phá, "
            "cho phép từ 2 đến 10 thành viên cùng góp vốn mua một chiếc xe điện cao cấp, chia sẻ lịch trình sử dụng và phân bổ minh bạch chi phí vận hành theo tỷ lệ sở hữu."
        ),
        (
            "1.4. Đặt vấn đề và tính cấp thiết của đề tài EVShare 3D",
            "Mặc dù mô hình đồng sở hữu mang lại lợi ích kinh tế to lớn, việc triển khai trong thực tế thường gặp phải những bất cập sâu sắc dẫn đến mâu thuẫn giữa các đồng sở hữu:\n"
            "1. **Thiếu công cụ đặt xe và xung đột lịch trình:** Việc sử dụng các bảng tính Excel hoặc nhóm chat rời rạc thường dẫn đến việc đặt xe trùng khung giờ hoặc trả xe muộn làm lỡ kế hoạch của người tiếp theo.\n"
            "2. **Bất cập trong hạch toán và phân bổ chi phí:** Chi phí nạp sạc điện, bảo dưỡng định kỳ, mua bảo hiểm và sửa chữa thân vỏ rất phức tạp; việc thiếu công thức giá vốn bình quân (WAC) và sai lệch làm tròn tiền tệ gây mất niềm tin giữa các thành viên.\n"
            "3. **Mơ hồ về trách nhiệm khi xảy ra tổn hại thân vỏ:** Khi xe bị trầy xước, móp méo, rất khó xác định vết tổn hại phát sinh trong chuyến đi của ai nếu chỉ kiểm tra bằng mắt thường mà không có biên bản bàn giao gắn tọa độ chính xác.\n"
            "4. **Trực quan hóa phương tiện hạn chế:** Người dùng không thể nắm bắt được trạng thái sức khỏe của pin (Battery SOH/SOC), vị trí tổn hại và cấu trúc kỹ thuật của xe nếu chỉ nhìn qua các bảng dữ liệu văn bản 2D khô khan.\n\n"
            "Do đó, việc nghiên cứu và xây dựng nền tảng **EVShare 3D** tích hợp công nghệ bản sao kỹ thuật số 3D Digital Twin trực tiếp trên trình duyệt Web là một đòi hỏi vô cùng cấp thiết, "
            "có ý nghĩa thực tiễn to lớn nhằm thúc đẩy giao thông bền vững tại Việt Nam."
        ),
        (
            "1.5. Mục tiêu nghiên cứu và phạm vi thực hiện của đề tài",
            "**Mục tiêu tổng quát:**\n"
            "Nghiên cứu kiến trúc phần mềm hiện đại và xây dựng hoàn chỉnh hệ thống thông tin quản lý đồng sở hữu xe điện EVShare 3D đạt chuẩn công nghiệp, "
            "cung cấp giao diện trực quan 3D WebGL, tự động hóa quy trình quản trị tài chính, điều phối lịch trình thông minh và hòa giải tranh chấp minh bạch.\n\n"
            "**Mục tiêu cụ thể:**\n"
            "- Xây dựng phân hệ tương tác 3D WebGL với Three.js / React Three Fiber cho phép xoay, thu phóng, bóc tách linh kiện, chế độ X-Ray khối pin và gắn điểm nóng (Hotspots) tổn hại thân vỏ.\n"
            "- Hiện thực hóa thuật toán lập lịch chống trùng lấn biên thời gian (Boundary Overlap Guard) bảo đảm các phiên đặt xe không bao giờ giao thoa.\n"
            "- Xây dựng mô hình kho năng lượng xe (Energy Inventory) với thuật toán giá vốn bình quân gia quyền (WAC) và hệ số tổn hao sạc 92% theo giá điện EVN 3.850 đ/kWh.\n"
            "- Hiện thực hóa thuật toán làm tròn tài chính Hare-Niemeyer bảo đảm tổng số tiền phân bổ nghĩa vụ chi phí luôn khớp chính xác 100% hóa đơn gốc tới từng đồng VND.\n"
            "- Xây dựng cơ chế chuyển nhượng cổ phần giao dịch ACID bảo đảm bất biến tổng tỷ lệ sở hữu luôn bằng đúng 100.0000%.\n"
            "- Hiện thực hóa cơ chế biểu quyết dân chủ theo trọng số cổ phần (% Equity Weighted Voting) và quy trình hòa giải tranh chấp với nhân viên trung gian độc lập.\n\n"
            "**Phạm vi đề tài:**\n"
            "Tập trung nghiên cứu và phát triển phần mềm ứng dụng Web hoàn chỉnh; các thiết bị súng sạc IoT và cảm biến BMS thực tế được giả lập thông qua các API và bộ điều phối dữ liệu telemetry chuẩn xác trong phạm vi môi trường nghiên cứu thực tập."
        ),
        (
            "1.6. Đối tượng nghiên cứu và phương pháp tiếp cận kỹ thuật",
            "**Đối tượng nghiên cứu:**\n"
            "- Mô hình kinh tế chia sẻ tài sản xe điện và các quy chế pháp lý về đồng sở hữu phương tiện cơ giới.\n"
            "- Kiến trúc ứng dụng Web phân lớp chuyên sâu (Controller-Service-Repository) trên nền tảng Spring Boot 3.3.4 và Java 21 LTS.\n"
            "- Công nghệ đồ họa không gian ba chiều WebGL 2.0, thư viện Three.js, React Three Fiber và định dạng tệp 3D nén GLTF/GLB.\n"
            "- Thuật toán tối ưu hóa tài chính: Giá vốn bình quân gia quyền (Weighted Average Cost - WAC), phương pháp phần dư lớn nhất Hare-Niemeyer, thuật toán kiểm tra giao thoa khoảng thời gian (Interval Scheduling).\n\n"
            "**Phương pháp tiếp cận kỹ thuật:**\n"
            "- Phương pháp phân tích và thiết kế hướng đối tượng (OOAD) sử dụng chuẩn mô hình hóa Unified Modeling Language (UML 2.5).\n"
            "- Quy trình phát triển phần mềm lặp linh hoạt (Agile / Scrum) kết hợp kiểm toán chất lượng mã nguồn liên tục (SonarQube).\n"
            "- Phương pháp tiếp cận Clean Architecture và Domain-Driven Design (DDD) phân rã hệ thống thành các module nghiệp vụ độc lập."
        ),
        (
            "1.7. Nhiệm vụ và kế hoạch thực tập chi tiết",
            "Trong thời gian thực tập tốt nghiệp (16 tuần), sinh viên thực hiện các nhiệm vụ cụ thể theo kế hoạch:\n"
            "- **Tuần 1 - Tuần 2:** Khảo sát nghiệp vụ thực tế tại doanh nghiệp, nghiên cứu tài liệu quy chế đồng sở hữu xe điện và đặc tả yêu cầu hệ thống (SRS).\n"
            "- **Tuần 3 - Tuần 4:** Phân tích mô hình hóa hệ thống bằng UML (86 sơ đồ thiết kế) và thiết kế lược đồ cơ sở dữ liệu quan hệ 51 bảng MySQL.\n"
            "- **Tuần 5 - Tuần 8:** Xây dựng tầng Backend Spring Boot, hiện thực hóa 27 REST Controller, 249 API Endpoints, dịch vụ bảo mật JWT và các thuật toán tài chính WAC / Hare-Niemeyer.\n"
            "- **Tuần 9 - Tuần 12:** Phát triển giao diện Frontend React 18, xây dựng không gian Garage 3D Digital Twin với Three.js, bóc tách linh kiện và Hotspots tổn hại.\n"
            "- **Tuần 13 - Tuần 14:** Tích hợp hệ thống Full-Stack, thiết kế 100 ca kiểm thử kiểm tra chất lượng (69 ca chức năng + 31 ca hồi quy lịch sử).\n"
            "- **Tuần 15 - Tuần 16:** Hoàn thiện báo cáo thực tập tốt nghiệp, thực hiện kiểm toán mã nguồn và chuẩn bị bảo vệ đề tài trước hội đồng khoa học."
        ),
        (
            "1.8. Ý nghĩa khoa học, công nghệ và thực tiễn của đề tài",
            "**Ý nghĩa khoa học:**\n"
            "Đóng góp mô hình hóa hệ thống toán học chuẩn xác cho bài toán phân bổ chi phí không tổn thất (Zero-loss financial allocation) "
            "và mô hình quản lý năng lượng giá vốn động (Dynamic WAC Energy Inventory) trong lĩnh vực kinh tế chia sẻ xe điện.\n\n"
            "**Ý nghĩa công nghệ:**\n"
            "Chứng minh tính khả thi và hiệu năng cao của việc nhúng trực tiếp mô hình số 3D Digital Twin có độ phức tạp cao vào ứng dụng Web SPA "
            "mà vẫn duy trì tốc độ khung hình 60 FPS mượt mà trên phần cứng trình duyệt tiêu chuẩn không cần cài đặt phần mềm ngoài.\n\n"
            "**Ý nghĩa thực tiễn:**\n"
            "Cung cấp một giải pháp nền tảng hoàn chỉnh có thể ứng dụng trực tiếp cho các doanh nghiệp kinh doanh dịch vụ giao thông xanh, "
            "giúp giảm thiểu tối đa tranh chấp dân sự giữa các đồng sở hữu và khuyến khích người dân tiếp cận xe điện với chi phí hợp lý."
        ),
        (
            "1.9. Đóng góp cụ thể của sinh viên trong quá trình thực tập",
            "Trong kỳ thực tập tốt nghiệp, sinh viên **[HỌ VÀ TÊN SINH VIÊN]** (MSSV: **[MÃ SỐ SINH VIÊN]**) đã hoàn thành khối lượng công việc nghiên cứu và kỹ thuật độc lập đáng kể:\n"
            "1. Trực tiếp khảo sát và đặc tả toàn diện 68 yêu cầu chức năng (FRs), 42 quy tắc nghiệp vụ (BRs) và 88 ca sử dụng (Use Cases) chuẩn hóa.\n"
            "2. Xây dựng trọn vẹn bộ hồ sơ phân tích thiết kế với **86 sơ đồ UML chuẩn hóa** từ mức kiến trúc tới thực thi chi tiết.\n"
            "3. Thiết kế và chuẩn hóa lược đồ cơ sở dữ liệu quan hệ 51 bảng MySQL với khóa chính, khóa ngoại và ràng buộc toàn vẹn chuẩn xác.\n"
            "4. Triển khai hoàn chỉnh tầng Backend Spring Boot với 27 REST Controllers và 249 API Endpoints bảo mật bằng Spring Security / JWT.\n"
            "5. Phát triển các thành phần giao diện không gian 3D tương tác (Garage 3D, X-Ray mode, Raycaster hotspots, OrbitControls) trên React Three Fiber.\n"
            "6. Thiết lập bộ dữ liệu kiểm thử đồ sộ với 100 ca kiểm thử chi tiết và lập ma trận phòng ngừa 14 nhóm lỗi hồi quy lịch sử.\n"
            "7. Soạn thảo toàn bộ báo cáo thực tập tốt nghiệp chuyên sâu đạt chuẩn quy định học thuật của Bộ Giáo dục và Đào tạo."
        ),
        (
            "1.10. Bố cục cấu trúc của báo cáo thực tập tốt nghiệp",
            "Báo cáo thực tập tốt nghiệp được tổ chức chặt chẽ thành 7 chương nội dung chính cùng các phụ lục kỹ thuật đi kèm:\n"
            "- **Chương 1: Giới thiệu tổng quan và bối cảnh thực tập tốt nghiệp** - Trình bày đơn vị thực tập, bối cảnh, tính cấp thiết, mục tiêu và phạm vi đề tài.\n"
            "- **Chương 2: Cơ sở lý thuyết và nền tảng công nghệ ứng dụng** - Trình bày các nền tảng kỹ thuật Spring Boot, React, Three.js, JWT và các thuật toán tài chính.\n"
            "- **Chương 3: Phân tích yêu cầu và đặc tả nghiệp vụ hệ thống** - Trình bày 68 FRs, 42 BRs, Ma trận phân quyền RBAC và đặc tả 14 Use Case cốt lõi.\n"
            "- **Chương 4: Phân tích và thiết kế hệ thống phân rã** - Trình bày 86 sơ đồ thiết kế UML phân rã từ kiến trúc tổng thể tới chi tiết lớp và CSDL.\n"
            "- **Chương 5: Hiện thực hóa hệ thống và kết quả đạt được** - Trình bày chi tiết 25 phân hệ hiện thực hóa, trích đoạn mã nguồn và 20 khung giữ chỗ giao diện.\n"
            "- **Chương 6: Đánh giá chất lượng và thử nghiệm hệ thống** - Trình bày chiến lược QA, phân bổ 100 ca kiểm thử, tuyên bố minh bạch NOT EXECUTED và ma trận bao phủ 14 nhóm lỗi hồi quy.\n"
            "- **Chương 7: Đánh giá khách quan, kết luận và hướng phát triển** - Đánh giá ưu điểm, hạn chế kỹ thuật, bài học kinh nghiệm và lộ trình mở rộng.\n"
            "- **Tài liệu tham khảo & Phụ lục A đến N** - Cung cấp đầy đủ danh mục 249 API, từ điển dữ liệu 51 bảng, 88 Use Case, 100 Test Case và Ma trận truy xuất yêu cầu RTM."
        )
    ]
}

def get_front_matter():
    return FRONT_MATTER

def get_chapter_1():
    return CHAPTER_1
