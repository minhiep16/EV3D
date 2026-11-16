# -*- coding: utf-8 -*-
"""
v5_chapter1.py - Nội dung học thuật Chương 1 cho Báo cáo Thực tập Tốt nghiệp V5.
Tuân thủ nghiêm ngặt:
- Chuẩn hóa các khung giữ chỗ [HỌ VÀ TÊN SINH VIÊN], [MÃ SỐ SINH VIÊN], [TÊN DOANH NGHIỆP THỰC TẬP], v.v.
- Lịch trình thực tập 16 tuần được định vị là kế hoạch đề xuất khoa học.
- Xác định rõ phạm vi ứng dụng: Hệ thống phần mềm Web hoàn chỉnh, các thiết bị súng sạc IoT và viễn thông xe được điều khiển bằng mô phỏng phần mềm.
- Sử dụng văn phong học thuật khách quan, không sử dụng các từ ngữ phóng đại.
"""

CHAPTER_1_TITLE = "CHƯƠNG 1: TỔNG QUAN VỀ CƠ SỞ THỰC TẬP VÀ ĐỀ TÀI NGHIÊN CỨU"
CHAPTER_1_INTRO = (
    "Chương 1 giới thiệu tổng quan về đơn vị tiếp nhận thực tập tốt nghiệp, cơ cấu tổ chức, "
    "lĩnh vực hoạt động và các hướng nghiên cứu công nghệ chủ lực của doanh nghiệp. "
    "Đồng thời, chương này xác lập bối cảnh thực tiễn, tính cấp thiết, mục tiêu, đối tượng, "
    "phạm vi nghiên cứu, phương pháp luận kỹ thuật và kế hoạch thực tập tổng thể của đề tài "
    "Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình "
    "số 3D Digital Twin trên nền tảng Web (EVShare 3D)."
)

CHAPTER_1_SECTIONS = [
    (
        "1.1. Đặt vấn đề và tính cấp thiết của đề tài nghiên cứu",
        "Trong bối cảnh chuyển dịch năng lượng xanh và cam kết giảm phát thải ròng toàn cầu, phương tiện giao thông thuần điện (Battery Electric Vehicles - BEV) đang trở thành giải pháp ưu tiên hàng đầu. Tuy nhiên, rào cản chi phí đầu tư ban đầu lớn, sự lo ngại về tốc độ suy thoái pin (Battery Degradation) và hiệu suất khai thác thấp (trung bình xe cá nhân chỉ hoạt động khoảng 5% thời gian trong ngày) đang là những thách thức không nhỏ.\n\n"
        "Mô hình kinh tế chia sẻ và đồng sở hữu xe điện (EV Co-ownership) nổi lên như một giải pháp đột phá về mặt tài chính và tài nguyên: một nhóm người dùng (từ 3 đến 8 thành viên) cùng góp vốn mua chung một chiếc xe điện, cùng chia sẻ quyền sử dụng theo lịch trình và cùng gánh vác các chi phí vận hành, bảo dưỡng theo tỷ lệ sở hữu vốn.\n\n"
        "Mặc dù mang lại lợi ích kinh tế rõ rệt, việc triển khai đồng sở hữu trong thực tiễn thường gặp phải các xung đột nghiêm trọng:\n"
        "1. **Xung đột lịch trình sử dụng xe:** Việc trao đổi qua tin nhắn hoặc bảng tính thủ công dễ dẫn đến trùng lặp lịch, bất đồng thời gian nhận/trả và tranh chấp quyền ưu tiên.\n"
        "2. **Thiếu minh bạch tài chính:** Rất khó phân định rạch ròi giữa chi phí cố định (bảo dưỡng, bảo hiểm, đăng kiểm) được chia theo tỷ lệ vốn sở hữu với chi phí biến đổi phát sinh theo phiên lái (điện năng tiêu thụ, phí cầu đường, phạt vi phạm) do từng cá nhân chịu trách nhiệm.\n"
        "3. **Khó khăn trong giám sát tình trạng kỹ thuật phương tiện:** Người dùng không có công cụ trực quan để theo dõi từ xa hiện trạng thân vỏ, các vết trầy xước phát sinh qua từng chuyến đi và dung lượng pin khả dụng.\n\n"
        "Từ những bất cập thực tiễn nêu trên, đề tài **'Nghiên cứu, thiết kế và phát triển hệ thống quản lý đồng sở hữu xe điện tích hợp mô hình số 3D Digital Twin trên nền tảng Web (EVShare 3D)'** được đề xuất thực hiện nhằm cung cấp một nền tảng chuyển đổi số toàn diện, kết hợp quản trị nghiệp vụ chặt chẽ với trải nghiệm trực quan không gian ba chiều WebGL."
    ),
    (
        "1.2. Tổng quan về đơn vị tiếp nhận thực tập",
        "Tên cơ sở tiếp nhận thực tập: **[TÊN CƠ QUAN / DOANH NGHIỆP TIẾP NHẬN THỰC TẬP]**\n"
        "Tên giao dịch quốc tế: **[TÊN TIẾNG ANH CỦA DOANH NGHIỆP]**\n"
        "Địa chỉ trụ sở chính: **[ĐỊA CHỈ TRỤ SỞ DOANH NGHIỆP]**\n"
        "Số điện thoại liên hệ: **[SỐ ĐIỆN THOẠI]** | Email: **[EMAIL LIÊN HỆ DOANH NGHIỆP]**\n"
        "Cán bộ hướng dẫn thực tập tại cơ sở: **[HỌ VÀ TÊN CÁN BỘ HƯỚNG DẪN DOANH NGHIỆP]**\n"
        "Chức vụ / Học vị: **[CHỨC VỤ / HỌC VỊ CỦA CÁN BỘ HƯỚNG DẪN]**\n\n"
        "Đơn vị thực tập là doanh nghiệp hoạt động chuyên sâu trong lĩnh vực phát triển phần mềm, tích hợp hệ thống công nghệ thông tin và cung cấp các giải pháp chuyển đổi số thông minh cho ngành giao thông vận tải và năng lượng tái tạo."
    ),
    (
        "1.3. Lịch sử hình thành và cơ cấu tổ chức của doanh nghiệp",
        "Doanh nghiệp được thành lập và phát triển với định hướng đón đầu cuộc cách mạng công nghiệp lần thứ tư, tập trung nghiên cứu ứng dụng điện toán đám mây, kiến trúc phần mềm hướng dịch vụ phân tán, Internet of Things (IoT) và đồ họa tương tác 3D Web.\n\n"
        "Cơ cấu tổ chức của đơn vị được thiết lập theo mô hình ma trận hiện đại, tối ưu hóa sự phối hợp liên chức năng giữa các phòng ban chuyên môn:\n"
        "- **Ban Giám đốc:** Hoạch định chiến lược kinh doanh và chỉ đạo định hướng công nghệ tổng thể.\n"
        "- **Phòng Kỹ thuật & Phát triển Phần mềm (R&D):** Nghiên cứu kiến trúc, phát triển các giải pháp phần mềm lõi backend, frontend và giao diện 3D.\n"
        "- **Phòng Quản lý Chất lượng (QA/QC):** Thiết kế kế hoạch kiểm thử, tự động hóa kiểm thử và kiểm soát chất lượng sản phẩm.\n"
        "- **Phòng Hạ tầng & DevOps:** Vận hành hệ thống máy chủ, triển khai container hóa (Docker, Kubernetes) và giám sát an ninh mạng.\n"
        "- **Phòng Chăm sóc Khách hàng & Triển khai Dự án:** Tiếp nhận phản hồi từ khách hàng và hỗ trợ kỹ thuật thực địa."
    ),
    (
        "1.4. Lĩnh vực hoạt động và các sản phẩm dịch vụ chủ lực",
        "Đơn vị tiếp nhận thực tập tập trung vào ba nhóm dịch vụ và giải pháp công nghệ trọng tâm:\n"
        "1. **Giải pháp phần mềm quản lý vận tải và đội xe thông minh (Fleet Management):** Cung cấp hệ thống giám sát hành trình GPS, quản lý lịch trình bảo dưỡng định kỳ và tối ưu hóa tuyến đường vận chuyển.\n"
        "2. **Hệ thống điều hành trạm sạc xe điện thông minh (EV Charging Management):** Phát triển nền tảng phần mềm quản lý mạng lưới trụ sạc, giám sát điện năng tiêu thụ và điều phối công suất nạp pin.\n"
        "3. **Giải pháp tương tác 3D Web và Bản sao số (3D Web & Digital Twin):** Xây dựng các ứng dụng mô phỏng trực quan thiết bị cơ khí, showroom xe trực tuyến và bảng điều khiển không gian số ba chiều chạy trực tiếp trên trình duyệt Web."
    ),
    (
        "1.5. Vị trí thực tập, vai trò và trách nhiệm được phân công",
        "Trong thời gian thực tập tốt nghiệp tại doanh nghiệp, sinh viên được tiếp nhận vào làm việc tại Phòng Kỹ thuật & Phát triển Phần mềm với vai trò **Kỹ sư Kỹ nghệ Phần mềm Full-Stack (Full-Stack Software Engineering Intern)**.\n\n"
        "Các trách nhiệm và nhiệm vụ kỹ thuật chính được giao bao gồm:\n"
        "- Tham gia khảo sát nghiệp vụ thực tế, phân tích yêu cầu bài toán quản lý đồng sở hữu phương tiện xe điện.\n"
        "- Tham gia thiết kế mô hình phân tích OOAD, xây dựng 86 sơ đồ thiết kế UML 2.5 và thiết kế CSDL quan hệ 51 bảng.\n"
        "- Tham gia hiện thực hóa các dịch vụ backend bằng Spring Boot 3.3.4 (Java 21 LTS), thiết kế RESTful APIs, Spring Security JWT và thuật toán phân bổ tài chính Hare-Niemeyer.\n"
        "- Tham gia phát triển giao diện người dùng Frontend bằng React 18, TypeScript và xây dựng không gian tương tác 3D Garage WebGL sử dụng thư viện Three.js / React Three Fiber.\n"
        "- Xây dựng bộ kịch bản 100 ca kiểm thử (Test Cases), xây dựng ma trận truy xuất nguồn gốc (RTM) và tổng hợp báo cáo kỹ thuật tốt nghiệp."
    ),
    (
        "1.6. Mục tiêu nghiên cứu và phạm vi ứng dụng của đề tài",
        "**Mục tiêu nghiên cứu tổng quát:**\n"
        "Nghiên cứu cơ sở lý thuyết và hiện thực hóa một hệ thống phần mềm hoàn chỉnh giải quyết triệt để ba bài toán cốt lõi của mô hình đồng sở hữu xe điện: khử xung đột lịch trình, minh bạch hóa tài chính trực tiếp và trực quan hóa kỹ thuật bằng bản sao số 3D.\n\n"
        "**Mục tiêu kỹ thuật cụ thể:**\n"
        "- Xây dựng cơ chế đặt xe thông minh với thuật toán khử xung đột biên (Boundary Overlap Guard).\n"
        "- Hiện thực hóa mô hình hạch toán chi phí trực tiếp (Direct Expense Allocation): phân bổ chi phí chung theo % vốn (thuật toán Hare-Niemeyer) và chi phí điện theo trách nhiệm người lái.\n"
        "- Xây dựng không gian Garage 3D WebGL cho phép xoay 360 độ, bóc tách linh kiện, chế độ X-Ray soi pin và tương tác điểm nóng tổn hại thân vỏ.\n\n"
        "**Phạm vi áp dụng của đề tài:**\n"
        "- Về mặt nghiệp vụ: Tập trung vào mô hình đồng sở hữu nhóm nhỏ (Co-ownership Group từ 3 đến 8 người) cùng sở hữu và khai thác xe điện thương mại.\n"
        "- Về mặt công nghệ: Tập trung nghiên cứu và phát triển phần mềm ứng dụng Web hoàn chỉnh; các thiết bị súng sạc IoT và cảm biến viễn thông phần cứng được mô phỏng phần mềm thông qua các dịch vụ Ingress và Simulation Controller, sẵn sàng kết nối giao thức chuẩn (OCPP, MQTT) trong tương lai."
    ),
    (
        "1.7. Kế hoạch và lịch trình thực tập đề xuất (16 tuần)",
        "Quá trình thực tập tốt nghiệp được thiết kế theo lộ trình khoa học 16 tuần, chia làm 4 giai đoạn chính:\n"
        "- **Giai đoạn 1 (Tuần 1 - Tuần 4): Khảo sát, thu thập yêu cầu và phân tích thiết kế hệ thống:**\n"
        "  + Khảo sát nghiệp vụ đồng sở hữu xe điện tại doanh nghiệp, nghiên cứu tài liệu quy chế mẫu.\n"
        "  + Xác lập danh mục 70 Yêu cầu chức năng (FRs), 42 Quy tắc nghiệp vụ (BRs) và ma trận phân quyền Role Permission Matrix.\n"
        "  + Xây dựng 86 sơ đồ thiết kế UML 2.5 phân rã chi tiết.\n"
        "- **Giai đoạn 2 (Tuần 5 - Tuần 9): Thiết kế CSDL và phát triển tầng Backend Spring Boot:**\n"
        "  + Thiết kế lược đồ CSDL quan hệ MySQL 8.0 gồm 51 bảng dữ liệu.\n"
        "  + Hiện thực hóa 27 REST Controllers và 249 API Endpoints bảo mật bằng JWT và Spring Security.\n"
        "  + Hiện thực hóa thuật toán giá vốn WAC nạp kho năng lượng và thuật toán phân bổ chi phí Hare-Niemeyer.\n"
        "- **Giai đoạn 3 (Tuần 10 - Tuần 13): Phát triển Frontend React và Engine đồ họa 3D WebGL:**\n"
        "  + Xây dựng các trang quản trị, đặt lịch, bàn giao, thanh toán nợ cá nhân bằng React 18 và TypeScript.\n"
        "  + Tích hợp mô hình 3D xe điện GLTF/GLB vào React Three Fiber, lập trình quỹ đạo OrbitControls, bóc tách linh kiện và Hotspot tổn hại.\n"
        "- **Giai đoạn 4 (Tuần 14 - Tuần 16): Thiết kế ca kiểm thử, kiểm toán tài liệu và hoàn thiện báo cáo:**\n"
        "  + Xây dựng bộ đặc tả 100 Ca kiểm thử hệ thống (NOT EXECUTED) và lập ma trận truy xuất RTM bao phủ 100% yêu cầu.\n"
        "  + Soát xét, hiệu đính nội dung học thuật, chuẩn hóa trích dẫn IEEE và nghiệm thu báo cáo tốt nghiệp."
    ),
    (
        "1.8. Phương pháp nghiên cứu và quy trình kỹ thuật áp dụng",
        "Đề tài áp dụng kết hợp các phương pháp nghiên cứu khoa học kỹ nghệ phần mềm chuẩn mực:\n"
        "1. **Phương pháp phân tích và thiết kế hướng đối tượng (OOAD):** Sử dụng ngôn ngữ mô hình hóa UML 2.5 để biểu diễn hệ thống từ nhiều góc nhìn: kiến trúc phân tầng, phân rã chức năng (Use Case), quy trình xử lý (Activity), tương tác thời gian (Sequence), cấu trúc dữ liệu (Class, ERD) và vòng đời thực thể (State Machine).\n"
        "2. **Quy trình phát triển phần mềm lặp và gia tăng (Iterative & Incremental):** Phát triển từng phân hệ cốt lõi, thường xuyên đối chiếu với mã nguồn thực tế và kiểm toán tính nhất quán của dữ liệu.\n"
        "3. **Mô hình hóa toán học ứng dụng:** Sử dụng phương pháp giá vốn bình quân gia quyền (WAC) trong kế toán năng lượng và phương pháp phần dư lớn nhất Hare-Niemeyer trong phân bổ tài chính chống thất thoát tiền lẻ."
    ),
    (
        "1.9. Ý nghĩa khoa học và giá trị thực tiễn của đề tài",
        "**Ý nghĩa khoa học:**\n"
        "- Đóng góp một giải pháp kiến trúc phần mềm đa tầng tích hợp giữa hệ thống thông tin quản lý doanh nghiệp (MIS) với engine đồ họa không gian ba chiều WebGL trên cùng một nền tảng Web tiêu chuẩn.\n"
        "- Minh chứng khả năng ứng dụng thành công của các mô hình toán học giải tích tài chính (WAC, Hare-Niemeyer) vào bài toán phân bổ chi phí năng lượng và vận hành trong kinh tế chia sẻ.\n\n"
        "**Giá trị thực tiễn:**\n"
        "- Cung cấp một giải pháp quản lý đồng sở hữu xe điện minh bạch, tự động hóa và tiện ích cho người dùng, thúc đẩy phổ cập phương tiện giao thông xanh tại Việt Nam.\n"
        "- Cung cấp công cụ số hóa cho doanh nghiệp vận hành quản lý các đội xe chia sẻ, giảm thiểu chi phí nhân sự và hạn chế tối đa các tranh chấp pháp lý nội bộ nhóm."
    ),
    (
        "1.10. Bố cục tổng thể của báo cáo thực tập tốt nghiệp",
        "Báo cáo thực tập tốt nghiệp được tổ chức chặt chẽ thành 7 chương nội dung học thuật chính và 14 phụ lục kỹ thuật chi tiết:\n"
        "- **Chương 1:** Tổng quan về cơ sở thực tập và đề tài nghiên cứu.\n"
        "- **Chương 2:** Cơ sở lý thuyết và nền tảng công nghệ.\n"
        "- **Chương 3:** Khảo sát hiện trạng và phân tích yêu cầu hệ thống (70 FRs, 42 BRs, Role Matrix, 14 Core UCs).\n"
        "- **Chương 4:** Phân tích và thiết kế hệ thống phân rã Hierarchical (86 sơ đồ UML nhúng đầy đủ).\n"
        "- **Chương 5:** Hiện thực hóa hệ thống (25 phân hệ chức năng, 20 khung giữ chỗ UI kèm hướng dẫn chụp và che mờ PII).\n"
        "- **Chương 6:** Đảm bảo chất lượng và kiểm thử phần mềm (100 Test Cases minh bạch NOT EXECUTED, ma trận 14 nhóm hồi quy thực tế).\n"
        "- **Chương 7:** Đánh giá khách quan, kết luận và hướng phát triển (6 ưu điểm, 5 hạn chế, roadmap 4 giai đoạn).\n"
        "- **Thư mục Tài liệu tham khảo:** 32 nguồn tài liệu chuẩn IEEE.\n"
        "- **Phụ lục A đến N:** Danh mục 249 REST APIs, từ điển CSDL 51 bảng snake_case, 74 bảng Use Cases chuyên sâu, 100 bảng Test Cases, ma trận RTM và biểu mẫu kỹ thuật số."
    )
]

def get_chapter_1():
    return {
        "title": CHAPTER_1_TITLE,
        "intro": CHAPTER_1_INTRO,
        "sections": CHAPTER_1_SECTIONS
    }

FRONT_MATTER = {
    "title_vi": "NGHIÊN CỨU, THIẾT KẾ VÀ PHÁT TRIỂN HỆ THỐNG QUẢN LÝ ĐỒNG SỞ HỮU XE ĐIỆN TÍCH HỢP MÔ HÌNH SỐ 3D DIGITAL TWIN TRÊN NỀN TẢNG WEB (EVSHARE 3D)",
    "title_en": "RESEARCH, DESIGN AND DEVELOPMENT OF AN ELECTRIC VEHICLE CO-OWNERSHIP MANAGEMENT PLATFORM INTEGRATED WITH 3D WEB DIGITAL TWIN (EVSHARE 3D)",
    "student_name": "[HỌ VÀ TÊN SINH VIÊN]",
    "student_id": "[MÃ SỐ SINH VIÊN]",
    "class_name": "[LỚP KHÓA HỌC]",
    "academic_supervisor": "[GIẢNG VIÊN HƯỚNG DẪN]",
    "enterprise_supervisor": "[NGƯỜI HƯỚNG DẪN TẠI DOANH NGHIỆP]",
    "enterprise_name": "[CƠ QUAN / DOANH NGHIỆP THỰC TẬP]",
    "enterprise_address": "[ĐỊA CHỈ DOANH NGHIỆP THỰC TẬP]",
    "faculty": "KHOA CÔNG NGHỆ THÔNG TIN",
    "major": "KỸ THUẬT PHẦN MỀM",
    "year": "2026",
    "location": "Hà Nội"
}

def get_front_matter():
    return FRONT_MATTER

