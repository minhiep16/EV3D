# -*- coding: utf-8 -*-
"""
v4_chapter2.py - Dữ liệu Chương 2: Cơ sở lý thuyết và Nền tảng công nghệ ứng dụng
Bao gồm các trích dẫn tài liệu tham khảo theo định dạng chuẩn IEEE ([1], [2], ..., [32]).
"""

CHAPTER_2 = {
    "title": "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ NỀN TẢNG CÔNG NGHỆ ỨNG DỤNG",
    "intro": (
        "Chương 2 trình bày toàn diện các cơ sở lý thuyết khoa học, phương pháp luận kỹ nghệ phần mềm và các nền tảng công nghệ "
        "tiên tiến được áp dụng trong quá trình phân tích, thiết kế và hiện thực hóa hệ thống EVShare 3D. "
        "Nội dung bao gồm chuẩn mô hình hóa hướng đối tượng UML 2.5, kiến trúc phần mềm đa tầng, nền tảng Spring Boot 3, "
        "thư viện đồ họa không gian ba chiều Three.js / React Three Fiber, cơ chế bảo mật JWT / RBAC và các thuật toán tài chính chuyên sâu."
    ),
    "sections": [
        (
            "2.1. Phương pháp luận kỹ nghệ phần mềm và chuẩn mô hình hóa UML 2.5",
            "Kỹ nghệ phần mềm hiện đại đòi hỏi một quy trình phát triển có tính kỷ luật cao nhằm bảo đảm tính toàn vẹn, độ tin cậy và khả năng bảo trì của hệ thống phức tạp theo tiêu chuẩn ISO/IEC/IEEE 12207 [1]. "
            "Trong đề tài EVShare 3D, phương pháp phân tích và thiết kế hướng đối tượng (Object-Oriented Analysis and Design - OOAD) được áp dụng làm phương pháp luận chủ đạo [3]. "
            "Hệ thống sử dụng chuẩn mô hình hóa Unified Modeling Language (UML) phiên bản 2.5.1 do Object Management Group (OMG) ban hành [2] để trực quan hóa cấu trúc tĩnh và hành vi động của toàn bộ nền tảng [6].\n\n"
            "UML 2.5 cung cấp 14 loại sơ đồ biểu diễn chuẩn mực, trong đó đề tài khai thác sâu sắc 8 loại sơ đồ phân rã cốt lõi:\n"
            "- **Sơ đồ Use Case (Use Case Diagrams):** Phân rã chức năng theo góc nhìn của tác nhân (Actor), phân định ranh giới hệ thống và mối quan hệ include/extend giữa các ca sử dụng [6].\n"
            "- **Sơ đồ Hoạt động (Activity Diagrams):** Mô tả chi tiết luồng xử lý điều khiển và luồng dữ liệu song song qua các làn bơi (swimlanes) giữa Client, Server và CSDL.\n"
            "- **Sơ đồ Tuần tự (Sequence Diagrams):** Mô hình hóa tương tác thông điệp theo trục thời gian thực giữa các đối tượng phân lớp (Controller, Service, Repository), bảo đảm tính nhất quán thông điệp phản hồi [2].\n"
            "- **Sơ đồ Lớp (Class Diagrams):** Định nghĩa cấu trúc các thực thể dữ liệu, phương thức nghiệp vụ, kiểu dữ liệu thuộc tính và các mối quan hệ kết tập (aggregation), liên kết (association) và phụ thuộc (dependency) [3].\n"
            "- **Sơ đồ Thực thể Liên kết (Entity-Relationship Diagrams - ERD):** Mô hình hóa cấu trúc lưu trữ quan hệ mức vật lý của 51 bảng trong hệ quản trị CSDL MySQL [16].\n"
            "- **Sơ đồ Máy trạng thái (State Machine Diagrams):** Mô tả vòng đời hữu hạn (Finite State Machine) của các thực thể nghiệp vụ nhạy cảm như Xe, Lịch đặt, Chuyến đi, Hợp đồng và Khiếu nại [2].\n"
            "- **Sơ đồ Thành phần (Component Diagrams):** Thể hiện sự đóng gói và ranh giới mô-đun hóa giữa các khối phần mềm Frontend, Backend và Engine 3D [4].\n"
            "- **Sơ đồ Triển khai (Deployment Diagrams):** Mô tả kiến trúc nút vật lý, cấu hình mạng và hạ tầng đám mây nơi các thành phần phần mềm được thực thi [10]."
        ),
        (
            "2.2. Kiến trúc ứng dụng Web đa tầng (Multi-tier Architecture) và Clean Architecture",
            "Hệ thống EVShare 3D được thiết kế tuân thủ nghiêm ngặt các nguyên lý kiến trúc sạch (Clean Architecture) của Robert C. Martin [4] và các mẫu kiến trúc ứng dụng doanh nghiệp kinh điển (Enterprise Application Patterns) của Martin Fowler [5]. "
            "Mô hình kiến trúc tách biệt rõ ràng trách nhiệm giữa ba tầng chính (Separation of Concerns):\n\n"
            "1. **Tầng Trình diễn (Presentation Layer - Client SPA):** Phát triển dưới dạng ứng dụng đơn trang (Single Page Application - SPA) bằng React 18 và TypeScript [11], chịu trách nhiệm kết xuất giao diện đồ họa, tiếp nhận tương tác người dùng, xử lý trạng thái cục bộ qua Zustand [13] và điều phối Canvas 3D WebGL [14].\n"
            "2. **Tầng Dịch vụ Nghiệp vụ (Business Logic / Application Layer - Spring Boot):** Đóng gói toàn bộ các quy tắc nghiệp vụ cốt lõi, quản lý giao dịch ACID, phân quyền bảo mật và cung cấp giao diện lập trình ứng dụng RESTful API chuẩn mực [9], [10].\n"
            "3. **Tầng Lưu trữ Dữ liệu (Persistence / Data Access Layer):** Sử dụng Spring Data JPA / Hibernate [15] kết hợp cơ sở dữ liệu quan hệ MySQL 8.0 [16] để quản lý trạng thái dữ liệu bền vững, thực thi các truy vấn tối ưu và khóa lạc quan (Optimistic Locking) chống xung đột đồng thời [5].\n\n"
            "Cách tiếp cận Domain-Driven Design (DDD) [7] giúp hệ thống phân rã thành các miền nghiệp vụ độc lập (Co-ownership, Booking, Charging, Trip, Expense, Voting, Dispute), giảm thiểu mức độ phụ thuộc chéo (coupling) và nâng cao tối đa tính gắn kết nội tại (cohesion) của các mô-đun [8]."
        ),
        (
            "2.3. Nền tảng Backend Spring Boot 3, Java 21 LTS và hệ sinh thái Spring",
            "Tầng Backend của EVShare 3D được xây dựng trên nền tảng Java 21 LTS - phiên bản hỗ trợ dài hạn mới nhất của ngôn ngữ Java [8], kết hợp với khung ứng dụng Spring Boot 3.3.4 [9]. "
            "Java 21 mang lại nhiều cải tiến đột phá về hiệu năng như Virtual Threads (Project Loom), Record Classes và Pattern Matching, giúp tối ưu hóa khả năng xử lý đồng thời hàng nghìn request I/O mạng từ các phiên sạc pin và telemetry xe điện [8], [10].\n\n"
            "Hệ sinh thái Spring cung cấp bộ công cụ toàn diện phục vụ phát triển ứng dụng cấp doanh nghiệp:\n"
            "- **Spring Web (MVC):** Định tuyến và xử lý các yêu cầu HTTP theo mô hình kiến trúc RESTful chuẩn, hỗ trợ tự động tuần tự hóa và giải mã dữ liệu JSON thông qua thư viện Jackson [9].\n"
            "- **Spring Data JPA & Hibernate:** Trừu tượng hóa việc tương tác CSDL, cung cấp cơ chế tự động sinh câu truy vấn SQL thông qua khai báo phương thức Repository, hỗ trợ cơ chế bộ nhớ đệm (Caching) và quản lý giao dịch tường minh `@Transactional` [15].\n"
            "- **Spring Validation (Hibernate Validator):** Thực thi kiểm tra ràng buộc tính toàn vẹn của dữ liệu đầu vào ngay tại tầng DTO bằng các annotation chuẩn JSR-380 (`@NotNull`, `@Size`, `@Email`, `@Min`, `@Max`, `@Future`) [9].\n"
            "- **Flyway Database Migration:** Quản lý lịch sử tiến hóa lược đồ CSDL có kiểm soát phiên bản qua các tệp mã SQL tuần tự từ V1 đến V46, bảo đảm tính nhất quán cấu trúc bảng giữa môi trường phát triển và môi trường triển khai thực tế [16]."
        ),
        (
            "2.4. Công nghệ Frontend: React 18, TypeScript, Tailwind CSS và Quản lý trạng thái Zustand",
            "Tầng Frontend của EVShare 3D được xây dựng dựa trên hệ sinh thái web hiện đại nhằm mang lại trải nghiệm tương tác mượt mà và giao diện phản hồi nhanh (Responsive UI) [11]:\n\n"
            "- **React 18:** Sử dụng mô hình lập trình khai báo (Declarative Programming) dựa trên các Component tái sử dụng cao. Tính năng Concurrent Rendering và cơ chế cập nhật tự động (Automatic Batching) giúp tối ưu hóa hiệu năng render DOM khi nhận luồng dữ liệu thời gian thực từ trạm sạc [11].\n"
            "- **TypeScript:** Ngôn ngữ mở rộng có định kiểu tĩnh (Statically Typed) của JavaScript, giúp phát hiện lỗi cú pháp và kiểu dữ liệu ngay trong quá trình biên dịch (Compile-time), đồng bộ hóa chặt chẽ các cấu trúc DTO giữa Frontend và Backend, giảm thiểu tối đa các lỗi ngoại lệ `TypeError: Cannot read properties of undefined` thường gặp trong mã JavaScript thuần [12].\n"
            "- **Tailwind CSS:** Khung CSS hướng tiện ích (Utility-first CSS Framework) giúp thiết kế giao diện nhanh chóng, nhất quán về bảng màu (Cyan, Navy Blue, Slate), hỗ trợ chế độ tối (Dark Mode) chuyên biệt cho không gian điều khiển Garage công nghệ cao.\n"
            "- **Zustand State Management:** Thư viện quản lý trạng thái máy khách siêu nhẹ, sử dụng cơ chế Hook trực quan không cần lồng ghép Provider phức tạp như Redux [13]. Zustand được áp dụng làm trung tâm điều phối trạng thái của toàn bộ không gian 3D (`worldStore.ts`), lưu trữ các cờ hiệu kích hoạt action (`enterBatteryXrayMode`, `triggerCameraReset`, `resetVehicleYaw`, `selectVehicle`) với chi phí tính toán cực thấp và hiệu năng vượt trội [13]."
        ),
        (
            "2.5. Công nghệ đồ họa không gian ba chiều WebGL 2.0, Three.js và React Three Fiber",
            "Điểm nhấn công nghệ đột phá của đề tài là việc tích hợp mô hình bản sao kỹ thuật số 3D Digital Twin trực tiếp trên trình duyệt Web mà không đòi hỏi người dùng phải cài đặt plugin hoặc ứng dụng mở rộng [14].\n\n"
            "- **WebGL 2.0 (Web Graphics Library):** Tiêu chuẩn đồ họa mở cấp thấp do Khronos Group ban hành, cho phép trình duyệt truy cập trực tiếp vào sức mạnh tính toán song song của bộ xử lý đồ họa (GPU) máy khách thông qua giao diện OpenGL ES 3.0 [14].\n"
            "- **Three.js:** Thư viện JavaScript đồ họa 3D hàng đầu thế giới, trừu tượng hóa các tác vụ phức tạp của WebGL như biên dịch mã Shader (GLSL), quản lý bộ nhớ đệm đỉnh (VBO), ma trận biến đổi không gian (Model-View-Projection Matrix) và kết xuất ánh sáng theo mô hình vật lý PBR (Physically Based Rendering) [14].\n"
            "- **React Three Fiber (R3F):** Trình kết xuất khai báo (Declarative Renderer) đưa toàn bộ hệ thống Scenegraph của Three.js vào vòng đời của React Component. R3F cho phép quản lý các đối tượng hình học (Mesh), vật liệu (Material), camera và ánh sáng như các phần tử JSX thông thường, đồng bộ hóa tự nhiên với trạng thái của ứng dụng [11], [14].\n"
            "- **GLTF / GLB Format (GL Transmission Format):** Chuẩn định dạng tệp 3D nén tối ưu cho môi trường truyền tải Web (thường được ví như 'JPEG của đồ họa 3D'), đóng gói toàn bộ cấu trúc hình học, chất liệu PBR, ảnh vân bề mặt (Textures) và các nút xương phân cấp trong một tệp nhị phân duy nhất, cho phép tải nạp cực nhanh vào bộ nhớ GPU máy khách [14]."
        ),
        (
            "2.6. Cơ chế xác thực phân quyền Token JWT và mô hình kiểm soát truy cập RBAC",
            "Bảo mật và an toàn thông tin là yêu cầu sống còn của một hệ thống quản lý tài sản tài chính và phương tiện giao thông [17]. EVShare 3D triển khai cơ chế xác thực phi trạng thái (Stateless Authentication) dựa trên chuẩn JSON Web Token (RFC 7519) [18] kết hợp với mô hình kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC) [19].\n\n"
            "Cơ chế xác thực vận hành theo kiến trúc cặp Token phân cấp (Dual-Token Architecture):\n"
            "- **Access Token:** Mang đầy đủ các thông tin xác thực (claims: userId, email, role) được ký số mật mã bằng thuật toán HMAC-SHA256 với khóa bí mật máy chủ. Access Token có thời hạn sống ngắn (15 phút) nhằm giảm thiểu rủi ro bị đánh cắp trên đường truyền [18].\n"
            "- **Refresh Token:** Mã định danh ngẫu nhiên có độ dài 512-bit, được lưu trữ an toàn trong CSDL bảng `refresh_tokens` và có thời hạn sống 7 ngày. Refresh Token chỉ được sử dụng tại endpoint duy nhất `/api/auth/refresh` để cấp mới Access Token mà không bắt người dùng phải đăng nhập lại [18].\n"
            "- **Mô hình phân quyền RBAC:** Hệ thống định nghĩa 3 vai trò người dùng chuẩn hóa trong bảng `roles`:\n"
            "  1. `ROLE_ADMIN`: Quản trị viên cấp cao nhất, toàn quyền quản trị tài khoản, kiểm toán CSDL và cấu hình hệ thống.\n"
            "  2. `ROLE_STAFF`: Nhân viên vận hành tại trạm, phụ trách kiểm định, bàn giao xe, sạc điện vận hành và làm hòa giải viên trung gian.\n"
            "  3. `ROLE_CO_OWNER`: Người dùng là thành viên đồng sở hữu phương tiện, được cấp quyền đặt xe, tham gia biểu quyết và quản lý chi phí.\n"
            "Mọi yêu cầu HTTP gửi tới máy chủ đều được `JwtAuthenticationFilter` chặn lại tại tầng cửa ngõ, trích xuất Bearer Token từ Header `Authorization`, xác thực chữ ký và nạp đối tượng `UserPrincipal` vào `SecurityContextHolder` trước khi chuyển tới Controller [9], [17]."
        ),
        (
            "2.7. Thuật toán quản lý kho năng lượng theo giá vốn bình quân gia quyền (WAC)",
            "Trong mô hình đồng sở hữu xe điện, nguồn điện nạp vào pin xe có thể đến từ nhiều nguồn khác nhau với các mức giá biến động (sạc tại trụ nhanh trạm dịch vụ, sạc tại nhà theo biểu giá điện sinh hoạt bậc thang, hoặc sạc từ nguồn điện mặt trời áp mái). "
            "Nếu áp dụng giá cố định hoặc giá ngẫu nhiên, hệ thống sẽ phát sinh mâu thuẫn tài chính nghiêm trọng khi hạch toán chi phí chuyến đi của các thành viên.\n\n"
            "Để giải quyết triệt để bài toán này, đề tài nghiên cứu và áp dụng nguyên lý kế toán hàng tồn kho kinh điển: **Thuật toán Giá vốn bình quân gia quyền (Weighted Average Cost - WAC)** [20] vào quản trị năng lượng xe điện (Energy Inventory Management):\n\n"
            "Mỗi khi phương tiện nạp thêm một lượng điện mới, đơn giá vốn WAC mới của kho điện trong pin được tính toán lại theo công thức toán học chuẩn xác:\n\n"
            "$$\\text{WAC}_{\\text{mới}} = \\frac{E_{\\text{cũ}} \\times \\text{WAC}_{\\text{cũ}} + E_{\\text{nạp}} \\times P_{\\text{nạp}}}{E_{\\text{cũ}} + E_{\\text{nạp}}}$$\n\n"
            "Trong đó:\n"
            "- $E_{\\text{cũ}}$: Lượng điện năng thực tế đang tích lũy trong pin trước thời điểm nạp (kWh).\n"
            "- $\\text{WAC}_{\\text{cũ}}$: Đơn giá vốn bình quân của lượng điện cũ trước thời điểm nạp (VND/kWh).\n"
            "- $E_{\\text{nạp}}$: Lượng điện năng thực tế được nạp thêm vào pin (kWh) sau khi đã nhân với hệ số hiệu suất sạc 92% (BR-CHG-01).\n"
            "- $P_{\\text{nạp}}$: Đơn giá thực tế phải trả của phiên sạc mới (ví dụ đơn giá EVN 3.850 đ/kWh theo BR-CHG-02).\n\n"
            "Khi một thành viên kết thúc chuyến đi và tiêu thụ một lượng điện $\\Delta E$ (kWh), chi phí năng lượng cá nhân phải thanh toán được hạch toán minh bạch: $\\text{Chi phí} = \\Delta E \\times \\text{WAC}_{\\text{hiện hành}}$. "
            "Thuật toán bảo đảm nguyên tắc bảo toàn giá trị vốn tồn kho, loại bỏ hoàn toàn hiện tượng thất thoát tài chính trong nhóm đồng sở hữu [20]."
        ),
        (
            "2.8. Thuật toán làm tròn tài chính phần dư lớn nhất Hare-Niemeyer (Largest Remainder Method)",
            "Một thách thức toán học - kế toán phức tạp khác trong mô hình đồng sở hữu là việc phân bổ các hóa đơn chi phí chung (như phí bảo hiểm 15.000.000 đ hoặc bảo dưỡng 5.235.000 đ) cho các thành viên nắm giữ tỷ lệ cổ phần lẻ (ví dụ: thành viên A sở hữu 33.3333%, B sở hữu 33.3333%, C sở hữu 33.3334%). "
            "Nếu chỉ làm tròn số học thông thường (`Math.round`), tổng số tiền phân bổ sau làm tròn tới hàng đơn vị đồng VND thường bị thừa hoặc thiếu từ 1 đến vài đồng so với hóa đơn gốc, gây mất cân bằng kế toán và vi phạm quy tắc kiểm toán tài chính [21].\n\n"
            "Hệ thống EVShare 3D áp dụng **Phương pháp phần dư lớn nhất Hare-Niemeyer (Largest Remainder Method)** [21] - phương pháp chuẩn mực quốc tế trong phân bổ tài chính và phân chia ghế nghị viện:\n\n"
            "Quy trình thực thi thuật toán gồm 4 bước toán học chặt chẽ:\n"
            "1. **Tính phần nguyên lý thuyết:** Với mỗi thành viên $i$, tính giá trị phần bổ lý thuyết: $S_i = \\text{Tổng tiền} \\times (\\text{Tỷ lệ}_i / 100)$. Lấy phần nguyên nguyên vẹn tới hàng đơn vị đồng: $F_i = \\lfloor S_i \\rfloor$.\n"
            "2. **Tính phần dư phân số:** Tính phần dư thập phân chưa được phân bổ của từng thành viên: $R_i = S_i - F_i$.\n"
            "3. **Tính số tiền còn thiếu:** Tính tổng chênh lệch tiền lẻ còn thiếu so với hóa đơn: $\\Delta = \\text{Tổng tiền} - \\sum F_i$.\n"
            "4. **Phân bổ phần dư ưu tiên:** Sắp xếp danh sách thành viên giảm dần theo phần dư $R_i$. Lấy $\\Delta$ thành viên có phần dư lớn nhất ở đầu danh sách, mỗi thành viên được cộng thêm đúng 1 đồng VND: $F_i' = F_i + 1$.\n\n"
            "Thuật toán bảo đảm bất biến toán học tuyệt đối: $\\sum F_i' = \\text{Tổng tiền hóa đơn gốc}$, giải quyết dứt điểm vấn đề thất thoát tiền tệ trong phân bổ chi phí [21]."
        ),
        (
            "2.9. Tổng quan các giải pháp chia sẻ xe điện tương đương trên thế giới và khoảng trống nghiên cứu",
            "Nghiên cứu khảo sát các nền tảng chia sẻ phương tiện di chuyển hàng đầu trên thế giới hiện nay [22] như Zipcar (Mỹ), ShareNow / Free2Move (Châu Âu) và Turo (Mô hình thuê xe ngang hàng P2P) cho thấy:\n"
            "- Các nền tảng truyền thống tập trung chủ yếu vào mô hình **B2C Car-sharing (Doanh nghiệp cho thuê xe ngắn hạn)** hoặc **P2P Rental (Chủ xe nhàn rỗi cho thuê lại)** [22]. Trong các mô hình này, người dùng chỉ là người thuê dịch vụ đơn thuần, không có quyền sở hữu tài sản phương tiện và không có quyền biểu quyết dân chủ trong các quyết định nâng cấp, bảo dưỡng xe.\n"
            "- Chưa có nền tảng nào cung cấp giải pháp trọn gói cho bài toán **Đồng sở hữu nhóm nhỏ (Co-ownership Group)** với đầy đủ các công cụ pháp lý số hóa: cơ chế ký kết phụ lục hợp đồng điện tử khi có chuyển nhượng cổ phần, biểu quyết theo trọng số cổ phần nắm giữ và quỹ bảo trì tập thể [23].\n"
            "- Về mặt giao diện và trải nghiệm người dùng, 100% các ứng dụng hiện tại chỉ hiển thị thông tin phương tiện dưới dạng ảnh chụp 2D tĩnh hoặc danh sách bảng biểu khô khan [22]. Hoàn toàn chưa có giải pháp nào tích hợp công nghệ **Bản sao kỹ thuật số 3D Digital Twin thời gian thực** cho phép người dùng trực tiếp xoay xe, soi xuyên thấu khối pin (X-Ray) và tương tác gắn điểm nóng tổn hại thân vỏ (3D Hotspots) ngay trên trình duyệt Web [14], [24].\n\n"
            "Đây chính là **khoảng trống công nghệ và thị trường to lớn** mà đề tài EVShare 3D tập trung tiên phong nghiên cứu và giải quyết trọn vẹn trong báo cáo tốt nghiệp này [25]-[32]."
        )
    ]
}

def get_chapter_2():
    return CHAPTER_2
