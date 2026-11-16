# -*- coding: utf-8 -*-
"""
v5_chapter2.py - Nội dung học thuật Chương 2 cho Báo cáo Thực tập Tốt nghiệp V5.
"""

CHAPTER_2_TITLE = "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ"
CHAPTER_2_INTRO = (
    "Chương 2 trình bày có hệ thống các cơ sở lý luận khoa học, phương pháp luận kỹ nghệ "
    "phần mềm và các nền tảng công nghệ cốt lõi được áp dụng trong quá trình nghiên cứu, "
    "thiết kế và hiện thực hóa hệ thống EVShare 3D. Nội dung bao gồm mô hình kinh tế chia sẻ, "
    "bản sao kỹ thuật số 3D WebGL, kiến trúc vi dịch vụ Spring Boot 3.3.4, hệ quản trị CSDL "
    "MySQL 8.0, kiểm soát an ninh JWT và đặc biệt là hai mô hình toán học giải tích: thuật toán "
    "giá vốn bình quân gia quyền (WAC) trong quản lý kho năng lượng và thuật toán phân bổ chi phí "
    "Hare-Niemeyer. Toàn bộ các nền tảng lý thuyết được đối chiếu chuẩn mực thông qua 32 trích dẫn "
    "khoa học theo quy chuẩn IEEE."
)

CHAPTER_2_SECTIONS = [
    (
        "2.1. Tổng quan về mô hình kinh tế chia sẻ và đồng sở hữu phương tiện",
        "Kinh tế chia sẻ (Sharing Economy) là mô hình kinh tế - xã hội dựa trên việc chia sẻ quyền tiếp cận và sử dụng tài nguyên chưa được khai thác hết công suất thay vì sở hữu độc quyền [1]. Trong ngành giao thông vận tải, sự phát triển nhanh chóng của các nền tảng gọi xe và chia sẻ xe tự lái (Car-sharing) đã chứng minh tiềm năng to lớn trong việc giảm áp lực ùn tắc đô thị và giảm lượng phát thải khí nhà kính [2].\n\n"
        "Tuy nhiên, mô hình Car-sharing thương mại truyền thống thường đòi hỏi vốn đầu tư hạ tầng quy mô lớn và chi phí quản lý vận hành trung gian cao. Mô hình **Đồng sở hữu phương tiện (Vehicle Co-ownership)** ra đời như một nhánh phát triển linh hoạt: một nhóm người dùng tự nguyện liên kết cùng mua chung một phương tiện chất lượng cao [3]. Các thành viên vừa là chủ sở hữu vốn (Equity Owners), vừa là người trực tiếp sử dụng (End Users), chia sẻ trách nhiệm bảo quản và cùng hưởng lợi từ giá trị khấu hao của phương tiện [4]."
    ),
    (
        "2.2. Xu hướng phát triển xe điện và bài toán quản lý kỹ thuật đặc thù",
        "Xe thuần điện (Battery Electric Vehicle - BEV) sử dụng năng lượng dự trữ trong khối pin hóa học (phổ biến là pin Lithium-ion hoặc LFP) để cung cấp cho động cơ điện kéo [5]. Sự khác biệt cơ bản giữa xe điện và xe động cơ đốt trong truyền thống (ICE) đặt ra các yêu cầu quản lý kỹ thuật hoàn toàn mới [6]:\n"
        "1. **Đặc tính sạc pin phi tuyến tính:** Thời gian và công suất nạp pin phụ thuộc vào đường cong sạc (Charging Curve), nhiệt độ khối pin và mức dung lượng hiện thời (SOC - State of Charge) [7].\n"
        "2. **Tổn hao hiệu suất nạp sạc (Charging Efficiency Loss):** Quá trình nạp năng lượng từ lưới điện xoay chiều (AC) vào pin một chiều (DC) thông qua bộ sạc trên xe (On-Board Charger) luôn phát sinh tổn thất nhiệt và biến đổi công suất, với hiệu suất trung bình dao động từ 88% đến 94% [8].\n"
        "3. **Quản lý tình trạng suy thoái pin (SOH - State of Health):** Khối pin xe điện suy giảm dần dung lượng theo thời gian và số chu kỳ sạc/xả. Việc theo dõi chặt chẽ chỉ số SOH là bắt buộc để định giá lại tài sản nhóm và lên kế hoạch thay thế pin định kỳ."
    ),
    (
        "2.3. Khái niệm và kiến trúc bản sao kỹ thuật số 3D (Digital Twin)",
        "Bản sao kỹ thuật số (Digital Twin) là mô hình ảo hóa phản ánh chính xác trạng thái vật lý, cấu trúc cơ khí và hành vi vận hành của một thực thể trong thế giới thực theo thời gian thực [9]. Theo tiêu chuẩn ISO 23247, một hệ thống Digital Twin hoàn chỉnh bao gồm ba thành phần cơ bản: thực thể vật lý (Physical Entity), mô hình số ảo hóa (Virtual Entity) và luồng dữ liệu kết nối hai chiều (Data Connection) [10].\n\n"
        "Trong đề tài EVShare 3D, khái niệm Digital Twin được áp dụng ở cấp độ bản sao trực quan và logic (Visual & State Digital Twin) [11]:\n"
        "- Phản ánh chính xác hình học, màu sắc và cấu trúc bóc tách linh kiện của xe điện bằng mô hình 3D Mesh.\n"
        "- Trực quan hóa tức thời trạng thái pin (SOC), chỉ số ODO, trạng thái cửa mở/đóng và vị trí các vết tổn hại thân vỏ (Damage Hotspots) được ghi nhận trong CSDL [12]."
    ),
    (
        "2.4. Công nghệ WebGL và thư viện đồ họa không gian Three.js / React Three Fiber",
        "WebGL (Web Graphics Library) là chuẩn giao diện lập trình ứng dụng đồ họa JavaScript chạy trực tiếp trên các trình duyệt Web mà không cần cài đặt thêm phần mềm bổ trợ [13]. WebGL tận dụng trực tiếp sức mạnh xử lý song song của bộ xử lý đồ họa (GPU) để kết xuất các khung cảnh 3D phức tạp với hiệu năng cao [14].\n\n"
        "**Three.js** là thư viện đồ họa mã nguồn mở phổ biến nhất được xây dựng trên nền WebGL, cung cấp các lớp trừu tượng mức cao để quản lý Scenegraph, Camera, Ánh sáng PBR (Physically Based Rendering), Vật liệu (Materials) và Hình học (Geometries) [15].\n\n"
        "**React Three Fiber (R3F)** là bộ kết xuất Three.js khai báo (Declarative Renderer) cho hệ sinh thái React. R3F cho phép mô hình hóa các đối tượng 3D dưới dạng các React Component có thể tái sử dụng, đồng bộ trạng thái hai chiều với các State Store (Zustand/Redux) và tối ưu hóa vòng đời render [16]."
    ),
    (
        "2.5. Kiến trúc dịch vụ phân tán hiện đại với Spring Boot và Java 21 LTS",
        "Backend của hệ thống EVShare 3D được xây dựng trên nền tảng Spring Boot 3.3.4 kết hợp với nền tảng Java 21 LTS (Long-Term Support) [17]. Java 21 giới thiệu các cải tiến kiến trúc mang tính đột phá, đặc biệt là Luồng ảo (Virtual Threads - Project Loom), cho phép xử lý hàng chục nghìn kết nối đồng thời với mức tiêu hao bộ nhớ rất thấp [18].\n\n"
        "Hệ thống áp dụng kiến trúc phân tầng doanh nghiệp (Enterprise Layered Architecture) kết hợp các nguyên lý Clean Architecture và Domain-Driven Design (DDD) [19]:\n"
        "- **Tầng Trình bày (Presentation Layer):** Bao gồm 27 REST Controllers tiếp nhận các yêu cầu HTTP/HTTPS, định tuyến và trả về DTO chuẩn hóa.\n"
        "- **Tầng Nghiệp vụ (Business Service Layer):** Thực thi toàn bộ các quy tắc nghiệp vụ cốt lõi, quản lý giao dịch ACID (@Transactional) và tính toán thuật toán.\n"
        "- **Tầng Lưu trữ (Data Access Layer):** Sử dụng Spring Data JPA kết hợp Hibernate ORM để tương tác với CSDL quan hệ.\n\n"
        "*Lưu ý về phạm vi tích hợp IoT:* Trong phạm vi đề tài tốt nghiệp, hệ thống tập trung hoàn thiện tầng phần mềm ứng dụng và các dịch vụ mô phỏng viễn thông (Telemetry Ingress, Charging Progress Simulation). Việc kết nối trực tiếp với phần cứng súng sạc thực địa qua chuẩn OCPP 2.0.1 và cổng OBD-II của xe được hoạch định trong giai đoạn phát triển tiếp theo [20]."
    ),
    (
        "2.6. Thiết kế và tối ưu hóa cơ sở dữ liệu quan hệ MySQL trong môi trường giao dịch cao",
        "Hệ quản trị CSDL quan hệ MySQL 8.0 được lựa chọn nhờ độ ổn định cao, tính tương thích rộng rãi và khả năng tối ưu hóa công cụ lưu trữ InnoDB [21]. InnoDB cung cấp tính năng khóa ở mức dòng (Row-level Locking) và tuân thủ tuyệt đối 4 đặc tính ACID (Atomicity, Consistency, Isolation, Durability) [22].\n\n"
        "Hệ thống áp dụng chiến lược chuẩn hóa dữ liệu mức 3NF kết hợp đánh chỉ mục (B-Tree Indexing) trên các trường thường xuyên truy vấn và sắp xếp (user_id, vehicle_id, start_time, status) [23]. Toàn bộ các thay đổi cấu trúc bảng được kiểm soát phiên bản tự động bằng công cụ Flyway Migration, bảo đảm tính nhất quán giữa môi trường phát triển và môi trường thử nghiệm [24]."
    ),
    (
        "2.7. Cơ chế xác thực và phân quyền bảo mật dựa trên JSON Web Token (JWT) và Spring Security",
        "Hệ thống áp dụng kiến trúc bảo mật phi trạng thái (Stateless Security) dựa trên tiêu chuẩn JSON Web Token (RFC 7519) kết hợp với Spring Security 6 [25]. Quá trình xác thực sử dụng cơ chế cặp Token (Token Pair Mechanism) [26]:\n"
        "- **Access Token:** Mang chữ ký số an toàn (HMAC-SHA256), chứa thông tin định danh và danh sách quyền hạn (Claims), có thời hạn sống ngắn (15 phút) nhằm giảm thiểu rủi ro khi bị lộ lọt.\n"
        "- **Refresh Token:** Lưu trữ bền vững trong CSDL, có thời hạn sống dài hơn (7 ngày), sử dụng để cấp phát Access Token mới mà không yêu cầu người dùng phải đăng nhập lại [27].\n\n"
        "Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) được thực thi chặt chẽ ở cả cấp độ tầng mạng (Filter Chain) và cấp độ phương thức (@PreAuthorize) [28], phân định rõ ba cấp đặc quyền: Quản trị viên (ROLE_ADMIN), Nhân viên vận hành (ROLE_STAFF) và Đồng sở hữu (ROLE_CO_OWNER)."
    ),
    (
        "2.8. Các thuật toán tối ưu hóa tài chính trong phân bổ chi phí năng lượng và vận hành",
        "Trong mô hình đồng sở hữu xe điện, sự công bằng và minh bạch về tài chính là yếu tố sống còn. Đề tài nghiên cứu và áp dụng hai mô hình toán học giải tích chuyên sâu [29]:\n\n"
        "**1. Thuật toán Quản lý Giá vốn Bình quân Gia quyền (Weighted Average Cost - WAC) trong Kho Năng lượng Xe:**\n"
        "Khối pin xe điện đóng vai trò như một kho hàng năng lượng lưu trữ điện năng. Do đơn giá điện sạc thay đổi theo từng thời điểm và từng trụ sạc (giá giờ cao điểm, thấp điểm, sạc nhanh DC hay sạc chậm AC), mỗi đợt nạp sạc sẽ đưa vào pin một lượng điện với mức giá khác nhau [30].\n\n"
        "Để bảo đảm tính chính xác, hệ thống phân định rõ hai đại lượng năng lượng:\n"
        "- Điện năng lưới cấp ra từ trụ sạc: $E_{\\text{grid}}$ (kWh).\n"
        "- Điện năng thực tế nạp vào khối pin sau tổn hao chuyển đổi: $E_{\\text{stored}} = E_{\\text{grid}} \\times \\eta$ (kWh), với $\\eta$ là hiệu suất nạp sạc (mặc định trong hệ thống mô phỏng là $\\eta = 0.92$, tức 92%).\n\n"
        "Chi phí điện lưới của đợt nạp: $C_{\\text{charge}} = E_{\\text{grid}} \\times \\text{tariff}$ (VND), trong đó $\\text{tariff}$ là đơn giá điện áp dụng (được cấu hình tham số mặc định trong hệ thống là 3.850 đ/kWh, hoặc theo đơn giá riêng của từng trụ sạc).\n\n"
        "Đơn giá vốn WAC mới của kho điện trong pin được tính toán lại theo công thức:\n"
        "$$\\text{WAC}_{\\text{mới}} = \\frac{E_{\\text{cũ}} \\times \\text{WAC}_{\\text{cũ}} + C_{\\text{charge}}}{E_{\\text{cũ}} + E_{\\text{stored}}}$$\n\n"
        "Khi thành viên thực hiện chuyến đi và tiêu thụ lượng điện $\\Delta E$ (kWh), chi phí năng lượng của hành trình được tính trực tiếp: $C_{\\text{chuyến đi}} = \\Delta E \\times \\text{WAC}_{\\text{hiện hành}}$. Chi phí này được gán trực tiếp 100% cho người lái chuyến đi đó theo chính sách USER_RESPONSIBILITY, giải quyết triệt để vấn đề người đi ít phải chịu tiền điện cho người đi nhiều.\n\n"
        "**2. Thuật toán Làm tròn Tài chính Phần dư Lớn nhất Hare-Niemeyer (Largest Remainder Method):**\n"
        "Đối với các chi phí vận hành chung (bảo dưỡng, sửa chữa, bảo hiểm, đăng kiểm), chi phí được phân bổ trực tiếp cho các thành viên theo tỷ lệ phần trăm sở hữu vốn ($p_i$) [31]. Phép nhân $A \\times p_i$ thường sinh ra số tiền lẻ thập phân không thể thanh toán bằng tiền đồng Việt Nam (VND).\n\n"
        "Thuật toán Hare-Niemeyer xử lý bài toán này qua hai bước chặt chẽ:\n"
        "- Bước 1: Lấy phần nguyên số tiền phân bổ cho từng thành viên: $F_i = \\lfloor A \\times p_i \\rfloor$, tính tổng đã chia $\\sum F_i$ và phần dư $R = A - \\sum F_i$.\n"
        "- Bước 2: Sắp xếp các thành viên theo thứ tự giảm dần của phần thập phân ($A \\times p_i - F_i$). Cộng thêm 1 đồng VND lần lượt cho $R$ thành viên đứng đầu danh sách [32].\n\n"
        "Thuật toán bảo đảm bất biến toán học: $\\sum F_i' = A$ chính xác 100% đến từng đồng VND, loại bỏ hoàn toàn hiện tượng thất thoát tiền lẻ trong phân bổ tài chính nhóm."
    ),
    (
        "2.9. Phương pháp luận phân tích thiết kế hướng đối tượng (OOAD) và chuẩn mô hình hóa UML 2.5",
        "Phương pháp luận phân tích và thiết kế hướng đối tượng (Object-Oriented Analysis and Design - OOAD) cung cấp cách tiếp cận có hệ thống để chuyển hóa các yêu cầu bài toán nghiệp vụ phức tạp thành kiến trúc phần mềm mô-đun hóa, dễ bảo trì và dễ mở rộng [19].\n\n"
        "Hệ thống sử dụng chuẩn mô hình hóa Unified Modeling Language (UML) phiên bản 2.5 do Tổ chức Quản lý Đối tượng (OMG) ban hành để đặc tả hệ thống toàn diện thông qua 86 sơ đồ thiết kế phân rã theo 8 nhóm mô hình [11]: Sơ đồ Kiến trúc (ARCH), Sơ đồ Ca sử dụng (UC), Sơ đồ Hoạt động (ACT), Sơ đồ Tuần tự (SEQ), Sơ đồ Lớp (CLASS), Sơ đồ Thực thể CSDL (ERD), Sơ đồ Máy trạng thái (STATE) và Sơ đồ Thành phần & Triển khai (COMP/DEPLOY)."
    )
]

def get_chapter_2():
    return {
        "title": CHAPTER_2_TITLE,
        "intro": CHAPTER_2_INTRO,
        "sections": CHAPTER_2_SECTIONS
    }
