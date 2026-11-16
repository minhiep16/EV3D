# -*- coding: utf-8 -*-
"""
create_v6_chapter2.py - Script to write v6_chapter2.py with perfectly aligned IEEE citations
and Modular Monolith / Layered Architecture terminology.
"""

content = '''# -*- coding: utf-8 -*-
"""
v6_chapter2.py - Nội dung học thuật Chương 2 cho Báo cáo Thực tập Tốt nghiệp V6.
Đồng bộ 100% trích dẫn IEEE với Thư mục tài liệu tham khảo (32 nguồn chuẩn quốc tế).
Chuẩn hóa thuật ngữ: Modular Monolith và Enterprise Layered Architecture.
"""

CHAPTER_2_TITLE = "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ"
CHAPTER_2_INTRO = (
    "Chương 2 trình bày có hệ thống các cơ sở lý luận khoa học, phương pháp luận kỹ nghệ "
    "phần mềm và các nền tảng công nghệ cốt lõi được áp dụng trong quá trình nghiên cứu, "
    "thiết kế và hiện thực hóa hệ thống EVShare 3D. Nội dung bao gồm mô hình kinh tế chia sẻ, "
    "bản sao kỹ thuật số 3D WebGL, kiến trúc phân tầng module hóa (Modular Monolith) trên nền "
    "tảng Spring Boot 3.3.4, hệ quản trị CSDL quan hệ MySQL 8.0, kiểm soát an ninh JWT và RBAC, "
    "cùng hai mô hình toán học giải tích: thuật toán giá vốn bình quân gia quyền (WAC) trong "
    "quản lý kho năng lượng và thuật toán phân bổ chi phí Hare-Niemeyer. Toàn bộ các nền tảng "
    "lý thuyết được đối chiếu chuẩn mực thông qua 32 trích dẫn khoa học theo quy chuẩn IEEE."
)

CHAPTER_2_SECTIONS = [
    (
        "2.1. Tổng quan về mô hình kinh tế chia sẻ và chu trình phát triển phần mềm",
        "Kinh tế chia sẻ (Sharing Economy) là mô hình kinh tế - xã hội dựa trên việc chia sẻ quyền tiếp cận và sử dụng tài nguyên chưa được khai thác hết công suất thay vì sở hữu độc quyền. Để hiện thực hóa các nền tảng kỹ thuật số phục vụ mô hình kinh tế này, dự án tuân thủ nghiêm ngặt quy trình vòng đời phát triển phần mềm theo tiêu chuẩn quốc tế ISO/IEC/IEEE 12207:2017 [1]. Tiêu chuẩn này định hình các tiến trình kỹ nghệ từ thu thập yêu cầu, phân tích kiến trúc, thiết kế, cài đặt đến thẩm định và vận hành hệ thống.\\n\\n"
        "Trong ngành giao thông đô thị, sự phát triển nhanh chóng của các nền tảng chia sẻ xe điện (Car-sharing) đã chứng minh tiềm năng to lớn trong việc giảm áp lực ùn tắc và giảm phát thải khí nhà kính. Tuy nhiên, mô hình vận hành thương mại truyền thống đòi hỏi chi phí quản lý trung gian cao, mở đường cho mô hình liên kết đồng sở hữu dân sự linh hoạt hơn."
    ),
    (
        "2.2. Khái niệm và đặc thù của mô hình Đồng sở hữu phương tiện (Vehicle Co-ownership)",
        "Mô hình **Đồng sở hữu phương tiện (Vehicle Co-ownership)** ra đời như một nhánh phát triển bền vững: một nhóm người dùng tự nguyện liên kết cùng mua chung một phương tiện chất lượng cao. Các thành viên vừa là chủ sở hữu vốn (Equity Owners), vừa là người trực tiếp sử dụng (End Users), chia sẻ trách nhiệm bảo quản và cùng hưởng lợi từ giá trị khấu hao của phương tiện.\\n\\n"
        "Để quản lý mối quan hệ đa phương phức tạp giữa các đồng sở hữu, hệ thống ứng dụng các mẫu thiết kế hướng đối tượng kinh điển (GoF Design Patterns) [3] kết hợp với các mẫu kiến trúc ứng dụng doanh nghiệp chuẩn mực (Patterns of Enterprise Application Architecture - PEAA) [5]. Các mẫu kiến trúc như Unit of Work, Repository và Domain Model bảo đảm việc quản trị phần vốn góp, lập lịch dùng chung và phân định trách nhiệm dân sự diễn ra minh bạch, hạn chế tối đa xung đột nội bộ."
    ),
    (
        "2.3. Đặc tính kỹ thuật của Xe thuần điện (BEV) và Tiêu chuẩn trạm sạc",
        "Xe thuần điện (Battery Electric Vehicle - BEV) sử dụng năng lượng dự trữ trong khối pin hóa học (Lithium-ion / LFP) để cung cấp cho động cơ điện kéo. Sự khác biệt cơ bản giữa xe điện và xe động cơ đốt trong truyền thống (ICE) đặt ra các yêu cầu quản lý kỹ thuật hoàn toàn mới:\\n"
        "1. **Đặc tính sạc pin phi tuyến tính:** Thời gian và công suất nạp pin phụ thuộc vào đường cong sạc (Charging Curve), nhiệt độ khối pin và mức dung lượng hiện thời (SOC - State of Charge).\\n"
        "2. **Tổn hao hiệu suất nạp sạc (Charging Efficiency Loss):** Quá trình nạp năng lượng từ lưới điện xoay chiều (AC) vào pin một chiều (DC) qua bộ sạc trên xe (On-Board Charger) phát sinh tổn thất nhiệt, với hiệu suất trung bình dao động từ 88% đến 94%.\\n"
        "3. **Tiêu chuẩn giao tiếp công nghiệp:** Hệ thống được thiết kế hướng tới khả năng tương thích với giao thức trạm sạc mở OCPP 2.0.1 (Open Charge Point Protocol) [20] và giao thức cổng chẩn đoán trên xe SAE J1962 (OBD-II) [21] cho các kịch bản kết nối phần cứng thực địa trong tương lai."
    ),
    (
        "2.4. Công nghệ Bản sao kỹ thuật số (Digital Twin) và Chuẩn dữ liệu đồ họa 3D",
        "Bản sao kỹ thuật số (Digital Twin) là mô hình ảo hóa phản ánh chính xác trạng thái vật lý, cấu trúc cơ khí và hành vi vận hành của một thực thể thế giới thực. Trong đề tài EVShare 3D, khái niệm Digital Twin được áp dụng ở cấp độ bản sao trực quan và logic (Visual & State Digital Twin) thông qua các tiêu chuẩn đồ họa máy tính hiện đại [19].\\n\\n"
        "Để tối ưu hóa hiệu năng truyền tải và kết xuất trên môi trường Web, toàn bộ mô hình 3D xe điện và không gian Garage được đóng gói theo định dạng chuẩn công nghiệp glTF 2.0 (GL Transmission Format) [18]. Chuẩn glTF 2.0 cho phép nén hình học nhị phân (.bin), cấu trúc cây phân cấp Scenegraph, vật liệu PBR và kết cấu texture tối ưu cho phần cứng WebGL của trình duyệt."
    ),
    (
        "2.5. Nền tảng WebGL, Thư viện Three.js và React Three Fiber (R3F)",
        "WebGL (Web Graphics Library) là chuẩn giao diện lập trình ứng dụng đồ họa JavaScript chạy trực tiếp trên các trình duyệt Web mà không cần cài đặt phần mềm bổ trợ, tận dụng trực tiếp năng lực tính toán song song của bộ xử lý đồ họa (GPU).\\n\\n"
        "**Three.js** là thư viện đồ họa WebGL cấp cao phổ biến nhất thế giới [31], cung cấp hệ thống Scenegraph, Camera, Ánh sáng PBR (Physically Based Rendering), Vật liệu (Materials) và Hình học (Geometries) trực quan.\\n\\n"
        "**React Three Fiber (R3F)** kết hợp sức mạnh Three.js với kiến trúc Concurrent Rendering của React 18 [30]. R3F cho phép khai báo các thực thể 3D dưới dạng React Component tái sử dụng, đồng bộ trạng thái hai chiều với State Store Zustand và tự động điều phối vòng đời render theo tần số quét màn hình (requestAnimationFrame), bảo đảm độ mượt mà 60 FPS."
    ),
    (
        "2.6. Nền tảng Spring Boot 3.3.4, Java 21 LTS và Kiến trúc Modular Monolith",
        "Backend của hệ thống EVShare 3D được xây dựng trên nền tảng Spring Boot 3.3.4 [9] kết hợp với nền tảng Java 21 LTS [8], áp dụng triệt để các thực hành lập trình Java hiện đại (Effective Java) và tận dụng cơ chế Virtual Threads (Project Loom) để nâng cao năng lực phục vụ đồng thời.\\n\\n"
        "**Kiến trúc Phân tầng Module hóa (Modular Monolith):** Thay vì phân tán thành các microservice độc lập gây phức tạp về phân tán giao dịch và độ trễ mạng, hệ thống lựa chọn kiến trúc Modular Monolith chuẩn mực doanh nghiệp [10]. Toàn bộ mã nguồn backend được tổ chức thành 14 phân hệ nghiệp vụ rõ ràng (co-ownership, booking, trip, charging, expense, vote, dispute...), giao tiếp nội bộ qua các Java Interface và sự kiện nghiệp vụ trong cùng một tiến trình JVM duy nhất.\\n\\n"
        "Hệ thống áp dụng các nguyên lý Clean Architecture [4] và Thiết kế hướng miền (Domain-Driven Design - DDD) [7] để phân tách ranh giới giữa Controller, Service, Repository và Entity. Các giao diện lập trình ứng dụng tuân thủ kiến trúc RESTful [11] và định dạng thông báo lỗi theo chuẩn RFC 7807 (Problem Details for HTTP APIs) [12]."
    ),
    (
        "2.7. Hệ quản trị CSDL Quan hệ MySQL 8.0, Chuẩn 3NF và Flyway Migrations",
        "Hệ quản trị CSDL quan hệ MySQL 8.0 được lựa chọn nhờ độ ổn định cao, tính tương thích rộng rãi và công cụ lưu trữ InnoDB hỗ trợ khóa mức dòng (Row-level Locking) và 4 đặc tính ACID [17]. Cấu trúc dữ liệu tuân thủ mô hình quan hệ Codd [15] và sơ đồ thực thể liên kết Peter Chen [16].\\n\\n"
        "Hệ thống áp dụng chuẩn hóa 3NF kết hợp đánh chỉ mục B-Tree Indexing trên các khóa ngoại và cột điều kiện truy vấn. Toàn bộ các thay đổi lược đồ cơ sở dữ liệu được quản lý phiên bản tự động bằng công cụ Flyway Migration [32], loại bỏ hoàn toàn việc chỉnh sửa thủ công và bảo đảm tính nhất quán giữa các môi trường."
    ),
    (
        "2.8. Kiến trúc An toàn Thông tin, Tiêu chuẩn JWT và Phân quyền RBAC",
        "Hệ thống áp dụng kiến trúc bảo mật phi trạng thái (Stateless Security) dựa trên tiêu chuẩn JSON Web Token (RFC 7519) [13] kết hợp với Spring Security 6. Quá trình xác thực sử dụng cơ chế cặp Token (Access Token 15 phút, Refresh Token 7 ngày lưu trữ trong CSDL có cơ chế thu hồi tức thì).\\n\\n"
        "Mô hình kiểm soát truy cập dựa trên vai trò tuân thủ chuẩn RBAC của Viện Tiêu chuẩn và Công nghệ Quốc gia Hoa Kỳ (NIST) [14], phân định ba cấp quyền: Quản trị viên (ROLE_ADMIN), Nhân viên vận hành (ROLE_STAFF) và Đồng sở hữu (ROLE_CO_OWNER). Hệ thống đồng thời thiết lập các lớp bảo vệ chống lại các lỗ hổng bảo mật Web phổ biến theo khuyến nghị của OWASP Top Ten [29] (chống SQL Injection qua Hibernate Parameterized Queries, chống XSS, CSRF và Brute Force)."
    ),
    (
        "2.9. Các mô hình toán học giải tích chuyên sâu trong Hệ thống EVShare 3D",
        "Trong mô hình đồng sở hữu xe điện, sự công bằng và minh bạch về tài chính là yếu tố sống còn. Đề tài nghiên cứu và áp dụng hai mô hình toán học giải tích chuyên sâu:\\n\\n"
        "**Mô hình 1: Thuật toán Giá vốn Bình quân Gia quyền (WAC - Weighted Average Cost) cho Kho Năng lượng**\\n"
        "Khối pin xe điện đóng vai trò như một kho hàng năng lượng. Do đơn giá điện thay đổi theo từng trạm sạc và thời điểm, mỗi lần sạc bổ sung năng lượng với chi phí khác nhau. Giá vốn bình quân của 1 kWh trong pin tại thời điểm $t$ được xác định theo công thức:\\n"
        "$$P_{wac}^{(t)} = \\\\frac{E_{curr} \\\\times P_{wac}^{(t-1)} + \\\\Delta E_{in} \\\\times P_{charge}}{E_{curr} + \\\\Delta E_{in}}$$\\n"
        "Trong đó $E_{curr}$ là mức năng lượng trước khi sạc, $\\\\Delta E_{in}$ là năng lượng nạp thực tế vào pin sau tổn hao hiệu suất 92% ($E_{grid} \\\\times 0.92$), và $P_{charge}$ là đơn giá điện của phiên sạc.\\n\\n"
        "**Mô hình 2: Thuật toán Phân bổ Chi phí Phần dư Lớn nhất Hare-Niemeyer**\\n"
        "Đối với các chi phí bảo dưỡng và vận hành chung, chi phí được phân bổ trực tiếp cho các thành viên theo tỷ lệ sở hữu vốn ($p_i$). Do phép nhân $A \\\\times p_i$ sinh ra số lẻ thập phân, hệ thống áp dụng thuật toán hạn ngạch phần dư lớn nhất Hare-Niemeyer [22]:\\n"
        "- Bước 1: Gán cho mỗi thành viên phần nguyên số tiền $F_i = \\\\lfloor A \\\\times p_i \\\\rfloor$. Tính tổng phần nguyên $\\\\Sigma F = \\\\sum F_i$ và phần dư cần phân bổ $R = A - \\\\Sigma F$.\\n"
        "- Bước 2: Sắp xếp các thành viên theo thứ tự giảm dần của phần thập phân ($A \\\\times p_i - F_i$). Cộng thêm đúng 1 đồng VND lần lượt cho $R$ thành viên đứng đầu danh sách.\\n"
        "Thuật toán bảo đảm tổng nghĩa vụ phân bổ khớp chính xác 100% đến từng đồng VND với hóa đơn thực tế. Khi thành viên thanh toán nợ, hệ thống tích hợp sinh mã thanh toán theo tiêu chuẩn VietQR của Ngân hàng Nhà nước Việt Nam [23]."
    ),
    (
        "2.10. Phương pháp luận Phân tích Thiết kế Hướng đối tượng và Chuẩn Mô hình hóa UML 2.5",
        "Phương pháp luận phân tích và thiết kế hướng đối tượng (OOAD) cung cấp cách tiếp cận khoa học để chuyển hóa các yêu cầu nghiệp vụ phức tạp thành kiến trúc phần mềm hướng module, dễ bảo trì và dễ kiểm thử.\\n\\n"
        "Hệ thống sử dụng chuẩn mô hình hóa Unified Modeling Language phiên bản 2.5 do Tổ chức Quản lý Đối tượng (OMG) ban hành [2] cùng các hướng dẫn thực hành kinh điển của Martin Fowler (UML Distilled) [6] để đặc tả hệ thống toàn diện thông qua 86 sơ đồ thiết kế phân rã theo 8 nhóm mô hình chuẩn mực: Sơ đồ Kiến trúc (ARCH), Sơ đồ Ca sử dụng (UC), Sơ đồ Hoạt động (ACT), Sơ đồ Tuần tự (SEQ), Sơ đồ Lớp (CLASS), Sơ đồ Thực thể CSDL (ERD), Sơ đồ Máy trạng thái (STATE) và Sơ đồ Thành phần & Triển khai (COMP/DEPLOY)."
    )
]

def get_chapter_2_content():
    return CHAPTER_2_TITLE, CHAPTER_2_INTRO, CHAPTER_2_SECTIONS
'''

with open('D:/EV3D/docs/graduation-internship-report/final/v6_chapter2.py', 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully written v6_chapter2.py")
