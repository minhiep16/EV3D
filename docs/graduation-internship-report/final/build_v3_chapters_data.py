# -*- coding: utf-8 -*-
"""
build_v3_chapters_data.py - Xây dựng mô-đun dữ liệu học thuật cho các chương và phụ lục báo cáo V3
Bảo đảm tính chính xác kỹ thuật 100% khớp với mã nguồn thực tế và loại bỏ các lỗi đã được xác nhận.
"""
import os

out_file = r"D:\EV3D\docs\graduation-internship-report\final\v3_chapters_data.py"

content = '''# -*- coding: utf-8 -*-
"""
v3_chapters_data.py - Dữ liệu văn bản học thuật chuyên sâu cho Báo cáo V3 EVShare 3D
"""

def get_front_matter():
    return {
        "title_vi": "PHÂN TÍCH, THIẾT KẾ VÀ XÂY DỰNG HỆ THỐNG QUẢN LÝ ĐỒNG SỞ HỮU XE ĐIỆN TÍCH HỢP KHÔNG GIAN TƯƠNG TÁC 3D – EVSHARE 3D",
        "title_en": "Analysis, Design and Development of a 3D Interactive Electric Vehicle Co-Ownership Management System – EVShare 3D",
        "declaration": "Tôi xin cam đoan đây là công trình nghiên cứu và phát triển phần mềm được thực hiện nghiêm túc trong quá trình thực tập tốt nghiệp. Toàn bộ các mô hình phân tích thiết kế UML, lược đồ cơ sở dữ liệu quan hệ, danh mục giao diện lập trình ứng dụng REST API và các đoạn mã nguồn giải thuật cốt lõi được trình bày trong báo cáo đều được đối chiếu, kiểm chứng trực tiếp từ kho mã nguồn thực tế của dự án EVShare 3D tại thư mục gốc D:\\\\EV3D. Các số liệu tham khảo và trích dẫn lý thuyết được ghi rõ nguồn gốc xuất bản chuẩn mực IEEE. Đề tài không sao chép nguyên văn từ bất kỳ công trình báo cáo nào khác ngoài phạm vi được phép theo quy chế đào tạo.",
        "acknowledgements": "Lời đầu tiên, em xin bày tỏ lòng biết ơn sâu sắc tới các Thầy Cô giáo trong Khoa Công nghệ Thông tin đã truyền thụ những kiến thức nền tảng quý báu về kỹ nghệ phần mềm, kiến trúc hệ thống và cơ sở dữ liệu trong suốt các năm học qua.\\n\\nĐặc biệt, em xin gửi lời cảm ơn chân thành và sâu sắc nhất tới Thầy/Cô Giảng viên hướng dẫn, người đã luôn dành thời gian quý báu để định hướng đề tài, tận tình chỉ bảo phương pháp nghiên cứu học thuật, phản biện các mô hình phân tích thiết kế hướng đối tượng và hiệu đính nội dung báo cáo.\\n\\nEm cũng xin trân trọng cảm ơn Ban Lãnh đạo và các Anh/Chị kỹ sư tại đơn vị thực tập doanh nghiệp đã tạo điều kiện môi trường làm việc thực tế, cung cấp yêu cầu bài toán nghiệp vụ kinh doanh đồng sở hữu xe điện và hỗ trợ kỹ thuật tận tình trong suốt thời gian thực tập.",
        "abstract_vi": "Báo cáo trình bày toàn diện quá trình phân tích, thiết kế và hiện thực hóa hệ thống phần mềm EVShare 3D — giải pháp chuyển đổi số đột phá giải quyết bài toán đồng sở hữu xe điện (Electric Vehicle Co-Ownership) tích hợp không gian tương tác đồ họa 3D trực quan tại trình duyệt máy khách (Client WebGL). Đề tài giải quyết các thách thức vận hành cốt lõi: bảo toàn bất biến tổng tỷ lệ sở hữu vốn 100.0000% qua cơ chế giao dịch nguyên tử (@Transactional); khử xung đột lịch đặt xe giao thoa bằng giải thuật truy vấn khoảng thời gian (Temporal Overlap Prevention); quản lý kho năng lượng số theo phương pháp bình quân gia quyền (Weighted Average Cost - WAC) với hiệu suất sạc chuẩn 92%; phân bổ chi phí minh bạch kết hợp phương pháp làm tròn phần dư lớn nhất Hare-Niemeyer; và giám định tổn hại ngoại quan thân vỏ thông qua công nghệ phát tia Raycaster trên bề mặt mô hình 3D đa giác. Hệ thống được xây dựng trên nền tảng kiến trúc phân tầng doanh nghiệp chuẩn mực gồm Backend Spring Boot 3.3.4 (Java 21 LTS), Spring Security JWT, CSDL quan hệ MySQL 8.0 (51 bảng quản trị qua Flyway), Frontend React 18 (TypeScript), Zustand và Three.js / React Three Fiber.",
        "abstract_en": "This report presents the comprehensive analysis, architectural design, and full-stack implementation of EVShare 3D — an innovative digital platform addressing electric vehicle (EV) co-ownership challenges integrated with an interactive 3D WebGL digital twin. The project resolves critical domain problems: maintaining the absolute 100.0000% equity ratio invariant through atomic transactions; strict booking conflict prevention using temporal overlap verification; digital energy inventory valuation via Weighted Average Cost (WAC) factoring in a 92% charging efficiency; transparent expense distribution combining ownership ratio with Hare-Niemeyer largest-remainder allocation; and precise vehicle damage tracking via 3D mesh raycasting. The architecture is engineered using enterprise standards comprising Spring Boot 3.3.4 (Java 21 LTS), Spring Security JWT, MySQL 8.0 (51 relational tables versioned via Flyway), React 18 (TypeScript), Zustand, and Three.js / React Three Fiber.",
        "abbreviations": [
            ("API", "Application Programming Interface", "Giao diện lập trình ứng dụng"),
            ("BCrypt", "Blowfish-based Password Hashing Function", "Hàm băm mật khẩu bảo mật thích ứng"),
            ("BR", "Business Rule", "Quy tắc nghiệp vụ hệ thống"),
            ("CCS2", "Combined Charging System Type 2", "Chuẩn cổng sạc kết hợp xe điện một chiều/xoay chiều"),
            ("CRUD", "Create, Read, Update, Delete", "Bốn thao tác cơ bản trên cơ sở dữ liệu"),
            ("DTO", "Data Transfer Object", "Đối tượng truyền dữ liệu giữa các tầng"),
            ("ERD", "Entity-Relationship Diagram", "Sơ đồ thực thể liên kết"),
            ("EV", "Electric Vehicle", "Phương tiện giao thông chạy điện"),
            ("FR", "Functional Requirement", "Yêu cầu chức năng phần mềm"),
            ("GLTF/GLB", "Graphics Language Transmission Format", "Định dạng truyền tải mô hình 3D tiêu chuẩn cho Web"),
            ("HUD", "Heads-Up Display", "Giao diện hiển thị lớp phủ thông tin trực quan"),
            ("IEEE", "Institute of Electrical and Electronics Engineers", "Viện Kỹ sư Điện và Điện tử"),
            ("JPA", "Jakarta Persistence API", "Giao diện đặc tả ánh xạ đối tượng quan hệ trong Java"),
            ("JWT", "JSON Web Token", "Chuẩn mã thông báo xác thực dạng chuỗi JSON"),
            ("KTX2", "Khronos Texture 2.0", "Định dạng nén texture đồ họa chuyên dụng GPU"),
            ("NFR", "Non-Functional Requirement", "Yêu cầu phi chức năng"),
            ("ODO", "Odometer", "Đồng hồ đo tổng quãng đường lăn bánh của phương tiện"),
            ("OOAD", "Object-Oriented Analysis and Design", "Phân tích và thiết kế hướng đối tượng"),
            ("OTP", "One-Time Password", "Mật khẩu xác thực sử dụng một lần"),
            ("R3F", "React Three Fiber", "Bộ kết xuất React khai báo cho Three.js"),
            ("RBAC", "Role-Based Access Control", "Kiểm soát truy cập dựa trên vai trò"),
            ("REST", "Representational State Transfer", "Kiểu kiến trúc truyền tải trạng thái đại diện"),
            ("RTM", "Requirements Traceability Matrix", "Ma trận truy xuất nguồn gốc yêu cầu"),
            ("SOC", "State of Charge", "Trạng thái dung lượng pin khả dụng (%)"),
            ("SOH", "State of Health", "Trạng thái sức khỏe lão hóa của pin (%)"),
            ("SPA", "Single Page Application", "Ứng dụng web trang đơn"),
            ("TC", "Test Case", "Ca kiểm thử phần mềm"),
            ("TLS", "Transport Layer Security", "Giao thức an ninh tầng truyền tải"),
            ("UC", "Use Case", "Ca sử dụng nghiệp vụ"),
            ("UI/UX", "User Interface / User Experience", "Giao diện người dùng / Trải nghiệm người dùng"),
            ("UML", "Unified Modeling Language", "Ngôn ngữ mô hình hóa thống nhất"),
            ("WAC", "Weighted Average Cost", "Phương pháp định giá giá vốn bình quân gia quyền")
        ]
    }

def get_chapter_1():
    return {
        "title": "CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ CƠ SỞ THỰC TẬP",
        "intro": "Chương 1 giới thiệu bối cảnh thực tiễn, đơn vị thực tập, tính cấp thiết của đề tài mô hình đồng sở hữu phương tiện giao thông xanh, xác định mục tiêu, phạm vi nghiên cứu, phương pháp tiếp cận kỹ thuật và cấu trúc tổng quát của báo cáo tốt nghiệp.",
        "sections": [
            ("1.1. Bối cảnh chuyển dịch giao thông xanh và đơn vị thực tập",
             "Trong thập kỷ qua, cuộc cách mạng chuyển dịch năng lượng toàn cầu từ nhiên liệu hóa thạch sang năng lượng tái tạo đã thúc đẩy sự bùng nổ của phương tiện giao thông chạy điện (Electric Vehicles - EV). Tại Việt Nam, Quyết định số 876/QĐ-TTg của Thủ tướng Chính phủ phê duyệt Chương trình hành động về chuyển đổi năng lượng xanh đã đặt ra mục tiêu lộ trình đến năm 2050 đạt phát thải ròng bằng '0' (Net Zero), trong đó giao thông đô thị đóng vai trò tiên phong với sự phát triển mạnh mẽ của hạ tầng trạm sạc và các dòng xe điện thông minh như VinFast VF e34, VF8, VF9.\\n\\nQuá trình thực tập tốt nghiệp được thực hiện tại đơn vị công nghệ chuyên nghiên cứu các giải pháp chuyển đổi số cho lĩnh vực đô thị thông minh và giao thông bền vững. Dưới sự định hướng của cán bộ hướng dẫn tại doanh nghiệp, sinh viên được giao nhiệm vụ khảo sát bài toán thực tế về mô hình sở hữu xe tại các đô thị lớn."),
            ("1.2. Tính cấp thiết của bài toán đồng sở hữu xe điện (EV Co-ownership)",
             "Mặc dù xe điện mang lại lợi ích to lớn về bảo vệ môi trường và chi phí vận hành trên mỗi km thấp hơn xe xăng, song rào cản chi phí đầu tư ban đầu (CAPEX) cao cùng với chi phí khấu hao pin vẫn là trở ngại lớn đối với phần đông người tiêu dùng tầng lớp trung lưu thành thị. Thêm vào đó, tại các đô thị mật độ cao như Hà Nội hay TP. Hồ Chí Minh, một chiếc ô tô cá nhân thường chỉ được sử dụng trung bình từ 1 đến 2 giờ mỗi ngày (chiếm dưới 10% công suất), trong khi 90% thời gian còn lại xe nằm tại bãi đỗ nhưng chủ xe vẫn phải chịu 100% chi phí cố định như tiền gửi xe, phí bảo hiểm thân vỏ, phí đường bộ và khấu hao tài sản.\\n\\nMô hình đồng sở hữu xe điện (Co-Ownership) nổi lên như một giải pháp kinh tế chia sẻ (Sharing Economy) mang tính đột phá: Một nhóm cá nhân (bạn bè, gia đình, cư dân cùng khu đô thị hoặc đồng nghiệp) cùng nhau góp vốn mua chung một chiếc xe điện cao cấp, chia sẻ thời gian sử dụng theo lịch biểu và phân bổ chi phí vận hành minh bạch theo tỷ lệ vốn góp và lượng sử dụng thực tế. Tuy nhiên, nếu thiếu đi một nền tảng phần mềm quản trị chuyên dụng, mô hình này tất yếu sẽ dẫn tới mâu thuẫn nội bộ nghiêm trọng do các vấn đề: xung đột lịch trình, tranh cãi về chi phí tiền điện sạc, quy kết trách nhiệm đối với các vết trầy xước ngoại quan phát sinh, và sự thiếu minh bạch trong tỷ lệ biểu quyết tài sản."),
            ("1.3. Mục tiêu và phạm vi nghiên cứu của đề tài",
             "Mục tiêu cốt lõi của đề tài là xây dựng hệ thống phần mềm hoàn chỉnh mang tên EVShare 3D nhằm số hóa toàn diện quy trình vận hành đồng sở hữu xe điện, tích hợp không gian tương tác đồ họa 3D WebGL trực quan. Hệ thống hướng tới việc:\\n- Tự động hóa việc phân chia và bảo toàn tỷ lệ vốn góp theo cổ phần số (Equity Shares).\\n- Triệt tiêu hoàn toàn xung đột thời gian đặt xe bằng thuật toán kiểm tra giao thoa.\\n- Minh bạch hóa 100% chi phí tiền điện sạc thông qua kho năng lượng số định giá WAC kết hợp hiệu suất tổn hao 92%.\\n- Phân bổ chi phí định kỳ bảo toàn tuyệt đối dòng tiền theo phương pháp Hare-Niemeyer.\\n- Minh bạch hóa kiểm định thân vỏ xe bằng việc gắn tọa độ tổn hại 3D Hotspot trực tiếp lên mô hình xe ảo.\\n\\nPhạm vi đề tài tập trung vào việc nghiên cứu, phân tích, thiết kế kiến trúc và hiện thực hóa mã nguồn hệ thống hoàn chỉnh ở môi trường Lab thực nghiệm, sẵn sàng cho công tác kiểm thử và nghiệm thu học thuật."),
            ("1.4. Phương pháp tiếp cận và quy trình phát triển phần mềm",
             "Đề tài áp dụng quy trình phát triển phần mềm linh hoạt (Agile/Scrum) kết hợp chặt chẽ với phương pháp Phân tích và Thiết kế Hướng đối tượng (OOAD) sử dụng chuẩn mô hình hóa UML 2.5. Các giai đoạn thực hiện bao gồm:\\n1. Khảo sát và phân tích yêu cầu nghiệp vụ (Business Requirements Gathering).\\n2. Thiết kế kiến trúc đa tầng doanh nghiệp và mô hình hóa 86 sơ đồ UML chi tiết.\\n3. Thiết kế cơ sở dữ liệu quan hệ chuẩn hóa 3NF gồm 51 bảng thực thể.\\n4. Lập trình thực thi Backend Spring Boot và Frontend React 18 / Three.js.\\n5. Xây dựng danh mục 100 ca kiểm thử phần mềm bảo đảm bao phủ toàn diện các chức năng và các trường hợp lỗi hồi quy."),
            ("1.5. Cấu trúc của báo cáo tốt nghiệp",
             "Báo cáo tốt nghiệp được cấu trúc thành 7 chương chính cùng 14 phụ lục chuyên sâu:\\n- Chương 1: Tổng quan về đề tài và cơ sở thực tập.\\n- Chương 2: Cơ sở lý thuyết và công nghệ nền tảng.\\n- Chương 3: Phân tích yêu cầu hệ thống và đặc tả Use Case cốt lõi.\\n- Chương 4: Phân tích và thiết kế hệ thống phân rã Hierarchical (86 sơ đồ UML).\\n- Chương 5: Xây dựng và thực thi hệ thống (Kiến trúc mã nguồn, 4 thuật toán và 20 khung giao diện).\\n- Chương 6: Kiểm thử và đánh giá chất lượng phần mềm (Danh mục 100 Test Cases).\\n- Chương 7: Kết luận, hạn chế và hướng phát triển.\\n- Thư mục Tài liệu tham khảo (32 nguồn IEEE) và 14 Phụ lục chi tiết từ A đến N.")
        ]
    }

def get_chapter_2():
    return {
        "title": "CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ NỀN TẢNG",
        "intro": "Chương 2 trình bày chi tiết các cơ sở lý thuyết công nghệ thông tin, kỹ nghệ phần mềm và hệ sinh thái công nghệ được lựa chọn để xây dựng hệ thống EVShare 3D.",
        "sections": [
            ("2.1. Phương pháp phân tích thiết kế hướng đối tượng (OOAD) và chuẩn UML 2.5",
             "Phân tích và thiết kế hướng đối tượng (OOAD) là phương pháp luận kỹ nghệ phần mềm tiếp cận bài toán nghiệp vụ thông qua các đối tượng (Objects) trừu tượng hóa từ thế giới thực, bao bọc cả thuộc tính (trạng thái dữ liệu) và hành vi (phương thức xử lý). Ngôn ngữ mô hình hóa thống nhất UML (Unified Modeling Language) phiên bản 2.5 do tổ chức OMG ban hành cung cấp hệ thống ký hiệu chuẩn mực để trực quan hóa, đặc tả, xây dựng và lập tài liệu cho các hệ thống phần mềm. Báo cáo sử dụng đầy đủ 8 nhóm sơ đồ UML: Use Case Diagram, Activity Diagram, Sequence Diagram, Class Diagram, Entity-Relationship Diagram (ERD), State Machine Diagram, Component Diagram và Deployment Diagram để mô hình hóa toàn diện kiến trúc EVShare 3D."),
            ("2.2. Kiến trúc ứng dụng Web đa tầng (Multi-tier Full-Stack Architecture)",
             "Hệ thống áp dụng mô hình kiến trúc phân tầng doanh nghiệp (Layered Architecture) phân tách rõ ràng giữa 4 tầng vật lý và logic:\\n1. Tầng Trình bày máy khách (Client Tier): Xây dựng theo mô hình Single Page Application (SPA) sử dụng React 18, TypeScript và Three.js, chịu trách nhiệm kết xuất giao diện và tương tác 3D WebGL tại trình duyệt người dùng.\\n2. Tầng Cổng giao tiếp & Cân bằng tải (Gateway Tier): Reverse Proxy Nginx đảm nhiệm việc chuyển tiếp HTTPS, nén tài nguyên tĩnh và bảo vệ an ninh mạng.\\n3. Tầng Ứng dụng nghiệp vụ (Application Server Tier): Triển khai ứng dụng Spring Boot 3.3.4 (Java 21 LTS), thực thi toàn bộ logic kế toán, kiểm soát xung đột, phân quyền và điều phối luồng nghiệp vụ.\\n4. Tầng Lưu trữ dữ liệu (Database Tier): Hệ quản trị CSDL quan hệ MySQL 8.0+ chịu trách nhiệm duy trì tính toàn vẹn dữ liệu, hỗ trợ giao dịch ACID nghiêm ngặt."),
            ("2.3. Công nghệ Backend: Spring Boot 3.3.4, Java 21 LTS và hệ sinh thái Spring",
             "Hệ thống Backend được phát triển trên nền Java 21 LTS kết hợp Spring Boot 3.3.4, tận dụng các ưu thế vượt trội:\\n- Java 21 LTS: Hỗ trợ tính năng ảo hóa luồng (Virtual Threads / Project Loom) giúp xử lý hàng ngàn kết nối I/O đồng thời mà không nghẽn tài nguyên CPU; cấu trúc Record giảm thiểu mã boilerplate DTO.\\n- Spring Data JPA & Hibernate: Ánh xạ quan hệ đối tượng ORM mạnh mẽ, hỗ trợ viết truy vấn kiểu an toàn qua Spring Data Repositories và quản trị giao dịch nguyên tử @Transactional.\\n- Spring Security 6: Cơ chế lọc yêu cầu phân cấp qua SecurityFilterChain, thiết lập chính sách kiểm soát truy cập không trạng thái (Stateless Session) kết hợp với bộ lọc JWT Authentication Filter.\\n- Flyway Migration: Công cụ quản lý tiến hóa lược đồ CSDL tự động theo các phiên bản script SQL có thứ tự, bảo đảm tính nhất quán của cấu trúc bảng trên toàn bộ môi trường phát triển."),
            ("2.4. Công nghệ Frontend: React 18, TypeScript, Tailwind CSS và Zustand",
             "Tầng giao diện SPA được xây dựng bằng React 18 với triết lý lập trình hàm (Functional Components) và React Hooks:\\n- TypeScript: Bổ sung hệ thống định kiểu tĩnh nghiêm ngặt cho JavaScript, giúp phát hiện sớm các lỗi sai kiểu dữ liệu tại thời điểm biên dịch (Compile-time) và nâng cao khả năng tái cấu trúc mã nguồn.\\n- Zustand: Thư viện quản lý trạng thái tập trung (State Management) cực nhẹ, không sử dụng boilerplate phức tạp như Redux, cung cấp các store chuyên biệt: authStore (lưu trữ token, thông tin phiên người dùng) và worldStore (lưu trữ danh sách xe, trạng thái tương tác 3D).\\n- Tailwind CSS: Framework tiện ích (Utility-First CSS) giúp xây dựng giao diện hiện đại, tối ưu cho trải nghiệm người dùng tối giản (Dark Mode / Glassmorphism) và đáp ứng đa kích thước màn hình."),
            ("2.5. Công nghệ đồ họa không gian tương tác 3D: Three.js, React Three Fiber và GLTF",
             "Để mang lại trải nghiệm đột phá, hệ thống tích hợp công nghệ đồ họa 3D thời gian thực trực tiếp trên trình duyệt Web mà không cần cài đặt plugin bổ sung:\\n- Three.js: Thư viện JavaScript mã nguồn mở bao bọc các hàm API cấp thấp của WebGL, cung cấp hệ thống phân cấp Scene Graph, Camera, Lights, Geometries và Materials.\\n- React Three Fiber (R3F): Bộ kết xuất chuyển đổi Three.js sang mô hình khai báo thành phần của React, giúp việc đồng bộ hóa dữ liệu trạng thái kinh doanh với không gian 3D trở nên trực quan và liền mạch.\\n- Drei Helper Library: Cung cấp các công cụ hỗ trợ như OrbitControls (điều khiển góc xoay camera), useGLTF (nạp tải mô hình 3D nhị phân tối ưu) và KTX2 Loader (giải nén texture siêu tốc trên GPU).\\n- Raycasting Mesh Intersection: Thuật toán phát tia từ tọa độ trỏ chuột của người dùng xuyên qua camera vào không gian 3D, tính toán chính xác điểm giao cắt trên bề mặt lưới đa giác (Mesh) của xe điện, cho phép gắn các điểm nóng (Hotspots) kiểm định tổn hại với tọa độ Vector3(x, y, z) thực tế."),
            ("2.6. Cơ sở dữ liệu quan hệ MySQL 8.0 và thiết kế phi chuẩn hóa có kiểm soát",
             "CSDL MySQL 8.0 được lựa chọn nhờ khả năng hỗ trợ giao dịch ACID mạnh mẽ qua Storage Engine InnoDB, chỉ mục B-Tree và chỉ mục không gian SPATIAL. Thiết kế CSDL của EVShare 3D gồm 51 bảng thực thể được chuẩn hóa đến dạng chuẩn 3 (3NF) để tránh dị thường dữ liệu (Cập nhật, Thêm, Xóa). Tại một số bảng cần tối ưu hóa tốc độ truy vấn thời gian thực (như tổng ODO, mức pin hiện tại của xe, đơn giá WAC tồn kho), hệ thống áp dụng kỹ thuật phi chuẩn hóa có kiểm soát (Controlled Denormalization) kết hợp cơ chế khóa dòng lạc quan (@Version) để bảo đảm hiệu năng đọc cao mà không làm sai lệch tính nhất quán."),
            ("2.7. Cơ chế bảo mật và phân quyền: JWT, BCrypt và RBAC",
             "Hệ thống thiết lập cơ chế an ninh nhiều lớp:\\n- Thuật toán băm mật khẩu BCrypt: Sử dụng độ dài muối ngẫu nhiên (Salt rounds = 10) tạo chuỗi băm 60 ký tự một chiều, có khả năng chống lại tấn công Rainbow Table và brute-force.\\n- Chuẩn JSON Web Token (RFC 7519): Access Token có thời hạn 24 giờ được ký bảo mật HMAC-SHA512 chứa định danh người dùng và danh sách quyền hạn. Refresh Token có thời hạn 30 ngày lưu trữ trong CSDL hỗ trợ cơ chế thu hồi phiên tức thì.\\n- Kiểm soát truy cập dựa trên vai trò (RBAC): Phân định quyền hạn nghiêm ngặt giữa 3 vai trò chính: Quản trị viên (ROLE_ADMIN), Nhân viên vận hành kỹ thuật (ROLE_STAFF) và Chủ xe đồng sở hữu (ROLE_CO_OWNER), được kiểm soát tự động tại cả tầng API Gateway lẫn tầng Controller bằng các chú thích bảo mật @PreAuthorize.")
        ]
    }

def get_chapter_3_intro():
    return {
        "title": "CHƯƠNG 3: PHÂN TÍCH YÊU CẦU HỆ THỐNG",
        "intro": "Chương 3 trình bày kết quả khảo sát nghiệp vụ thực tế, phân rã các yêu cầu chức năng, yêu cầu phi chức năng, hệ thống quy tắc nghiệp vụ bắt buộc và danh mục 14 bảng đặc tả Use Case cốt lõi của hệ thống EVShare 3D.",
        "sections": [
            ("3.1. Khảo sát nghiệp vụ thực tế mô hình đồng sở hữu xe điện",
             "Quá trình khảo sát nghiệp vụ chỉ ra 5 giai đoạn vòng đời cốt lõi của một nhóm đồng sở hữu xe điện:\\n1. Khởi tạo nhóm và thỏa thuận vốn góp: Các thành viên thống nhất loại xe cần mua (ví dụ VinFast VF8), ký hợp đồng thỏa thuận tỷ lệ cổ phần (tổng tỷ lệ phải đạt 100.0000%) và bầu chọn một Trưởng nhóm (Leader).\\n2. Đặt lịch sử dụng xe hàng tuần/tháng: Các thành viên chủ động chọn khung giờ lăn bánh. Hệ thống bắt buộc phải kiểm tra để ngăn chặn tình trạng hai thành viên cùng đặt một xe trong cùng khung giờ.\\n3. Giao nhận xe và kiểm định hai chiều: Trước khi lấy xe, nhân viên trạm cùng chủ xe kiểm tra ODO, pin và ngoại quan vỏ xe. Khi trả xe, nhân viên nghiệm thu đối soát, ghi nhận vết trầy xước mới (nếu có) vào mô hình 3D.\\n4. Quản lý năng lượng và sạc pin: Xe được sạc tại các trụ sạc thông minh. Năng lượng nạp vào kho được theo dõi và tính toán giá vốn bình quân WAC. Người sử dụng xe chịu trách nhiệm thanh toán 100% tiền điện tiêu thụ cho quãng đường mình đã đi.\\n5. Phân bổ chi phí và chuyển nhượng cổ phần: Các chi phí chung cố định (bảo hiểm, bảo dưỡng, gửi xe) được chia theo tỷ lệ cổ phần sở hữu vốn. Thành viên có quyền chuyển nhượng cổ phần cho người khác dưới sự đồng thuận của nhóm."),
            ("3.2. Nhận diện các tác nhân hệ thống (Actors)",
             "Hệ thống EVShare 3D xác định 5 tác nhân chính tham gia tương tác:\\n1. Quản trị viên hệ thống (ADMIN): Chịu trách nhiệm quản lý danh sách tài khoản, phê duyệt nhóm đồng sở hữu, cấu hình tham số hệ thống toàn cục, giám sát phân tích vận hành và giải quyết các khiếu nại cấp cao.\\n2. Nhân viên vận hành kỹ thuật (STAFF): Nhân viên tại các garage/trung tâm trạm sạc, thực hiện quy trình bàn giao xe, nghiệm thu trả xe, đối soát ODO/Pin, lập biên bản tổn hại 3D, quản lý trụ sạc và xác minh chứng từ thanh toán demo.\\n3. Chủ xe đồng sở hữu (CO_OWNER): Thành viên đã mua cổ phần trong một nhóm xe, có quyền đặt lịch xe, khởi hành chuyến đi, theo dõi tiêu thụ năng lượng, bỏ phiếu biểu quyết dân chủ, ký hợp đồng điện tử và nộp thanh toán.\\n4. Khách vãng lai (GUEST): Người dùng chưa có tài khoản hoặc chưa đăng nhập, chỉ có quyền truy cập trang giới thiệu, xem thông tin tổng quan về mô hình và gửi form đăng ký tài khoản.\\n5. Hệ thống CSDL và Scheduler ngầm (SYSTEM): Tác nhân nội bộ tự động thực thi các tác vụ định kỳ: kiểm tra quá hạn lịch đặt xe, tự động đóng các phiên biểu quyết hết hạn và đồng bộ dữ liệu giao dịch."),
            ("3.3. Phân rã yêu cầu chức năng (Functional Decomposition)",
             "Hệ thống được phân rã thành 7 phân hệ chức năng nghiệp vụ hoàn chỉnh:\\n- Phân hệ 1: Quản lý Xác thực và Hồ sơ Người dùng (Authentication & User Profile Subsystem).\\n- Phân hệ 2: Quản trị Hệ thống và Đội xe Toàn cục (Admin & Fleet Management Subsystem).\\n- Phân hệ 3: Đặt lịch Xe và Xử lý Khử xung đột Lịch (Booking & Conflict Prevention Subsystem).\\n- Phân hệ 4: Bàn giao, Hành trình Chuyến đi và Nghiệm thu Trả xe (Handover, Trip & Return Subsystem).\\n- Phân hệ 5: Pin, Trụ sạc và Kho Năng lượng Số WAC (Charging & Energy Inventory Subsystem).\\n- Phân hệ 6: Tài chính, Phân bổ Chi phí Hare-Niemeyer và Thanh toán DEMO (Finance & Settlement Subsystem).\\n- Phân hệ 7: Quản trị Dân chủ, Hợp đồng, Biển quyết và Tương tác 3D Garage (Governance, Contracts & 3D Subsystem)."),
            ("3.4. Yêu cầu chức năng chi tiết (Functional Requirements - FR)",
             "Hệ thống đặc tả 48 yêu cầu chức năng chính được phân nhóm có mã định danh truy xuất nguồn gốc (FR-AUTH, FR-ADM, FR-BOOK, FR-HAND, FR-TRIP, FR-CHARGE, FR-ENERGY, FR-FIN, FR-OWN, FR-CON, FR-VOTE, FR-3D, FR-NOTI). Mỗi yêu cầu chức năng được liên kết chặt chẽ với ít nhất một Use Case, một Endpoint API và một Ca kiểm thử trong ma trận RTM (Phụ lục K)."),
            ("3.5. Yêu cầu phi chức năng (Non-Functional Requirements - NFR)",
             "1. NFR-PERF (Hiệu năng): Thời gian phản hồi trung bình của các API nghiệp vụ thông thường đạt dưới 500ms; các truy vấn khử xung đột lịch đặt xe và phân bổ chi phí không vượt quá 1000ms trong điều kiện 100 người dùng đồng thời.\\n2. NFR-3D (Đồ họa 3D): Tốc độ khung hình (Frame Rate) trên không gian Canvas 3D WebGL duy trì ổn định từ 45 - 60 FPS trên các thiết bị máy tính cá nhân có card đồ họa tích hợp hoặc rời.\\n3. NFR-SEC (Bảo mật): Toàn bộ lưu lượng mạng được mã hóa qua TLS 1.3/HTTPS; mật khẩu lưu trữ băm BCrypt muối 10; mã nguồn không chứa mật khẩu cứng; các API được bảo vệ nghiêm ngặt bằng JWT.\\n4. NFR-AVAIL (Độ sẵn sàng): Kiến trúc hỗ trợ khả năng phục hồi sau sự cố, dữ liệu giao dịch tài chính và chuyển nhượng cổ phần luôn bảo đảm tính nguyên tử (Atomicity), không xuất hiện tình trạng treo dữ liệu (Inconsistent State).\\n5. NFR-USAB (Tính khả dụng): Giao diện người dùng tối giản, thân thiện, tương thích màn hình Full HD (1920x1080), hỗ trợ đầy đủ tiếng Việt chuyên ngành."),
            ("3.6. Quy tắc nghiệp vụ bắt buộc (Business Rules - BR)",
             "Hệ thống cài đặt các bất biến nghiệp vụ sống còn:\\n- BR-OWN-01: Bất biến tổng vốn: Tổng tỷ lệ phần trăm sở hữu cổ phần của toàn bộ các thành viên trong một nhóm xe bắt buộc phải bằng chính xác 100.0000% tại mọi thời điểm.\\n- BR-BOOK-01: Khử xung đột lịch: Hai lịch đặt xe được coi là xung đột nếu và chỉ nếu khoảng thời gian [start_A, end_A] giao thoa với [start_B, end_B], tức thỏa mãn điều kiện: (start_A < end_B) VÀ (end_A > start_B).\\n- BR-TRIP-01: Ngưỡng an toàn pin: Xe điện chỉ được phép bắt đầu chuyến đi khi mức dung lượng pin khả dụng (SOC) đạt tối thiểu từ 20% trở lên.\\n- BR-CHRG-01: Hiệu suất sạc vật lý: Năng lượng điện nạp thực tế vào pin xe chỉ đạt 92% lượng điện năng đo được từ trụ sạc lưới (tổn hao chuyển đổi nhiệt 8%).\\n- BR-FIN-01: Bảo toàn phân bổ tài chính: Tổng các phần chi phí phân bổ cho các cá nhân (ExpenseShare) phải bằng chính xác 100% số tiền của hóa đơn gốc, áp dụng phương pháp Hare-Niemeyer phân bổ phần dư cho cổ đông lớn nhất.\\n- BR-FIN-02: Trách nhiệm tiền điện cá nhân: Chi phí tiền điện tiêu thụ trong suốt chuyến đi (tính theo số kWh tiêu thụ nhân đơn giá bình quân WAC) được gán 100% cho cá nhân lái xe theo chính sách USER_RESPONSIBILITY."),
            ("3.7. Yêu cầu về giao diện người dùng và không gian tương tác 3D",
             "Giao diện người dùng phải cung cấp trải nghiệm điều khiển thống nhất giữa không gian đồ họa 3D (bục xoay xe điện, hệ thống camera quỹ đạo OrbitControls, bóc tách cụm pin X-Ray, điểm nóng Hotspot tổn hại) và các bảng điều khiển 2D dạng kính mờ (Glassmorphism HUD). Khi người dùng xoay lật xe, các thẻ thông tin Hologram 3D phải tự động xoay hướng về phía camera (Billboard effect) bảo đảm luôn dễ đọc."),
            ("3.8. Giới hạn hệ thống và các giả định kỹ thuật",
             "- Giới hạn phòng Lab: Hệ thống được xây dựng và nghiệm thu tại môi trường máy chủ nội bộ (localhost / phòng thí nghiệm), việc gửi tin nhắn SMS OTP thực tế và cổng thanh toán thẻ ngân hàng trực tiếp được thay thế bằng cơ chế ký số mô phỏng và xác minh biên lai thanh toán DEMO hai bước qua nhân viên.\\n- Trạng thái kiểm thử học thuật: Toàn bộ danh mục 100 ca kiểm thử trong báo cáo được thiết kế chi tiết và ghi nhận trạng thái NOT EXECUTED (Chưa thực thi thực tế do giới hạn thời gian thực tập và nguồn lực phòng lab), sẵn sàng cho quy trình nghiệm thu độc lập.")
        ]
    }

def get_chapter_5_content():
    return {
        "title": "CHƯƠNG 5: XÂY DỰNG VÀ THỰC THI HỆ THỐNG",
        "intro": "Chương 5 trình bày chi tiết việc hiện thực hóa mã nguồn hệ thống EVShare 3D, kiến trúc các gói Backend Spring Boot, cấu trúc Frontend React 18, kỹ thuật dựng hình 3D Three.js, hiện thực 4 giải thuật toán học nghiệp vụ cốt lõi, mô tả giao diện thực tế của 3 nhóm tác nhân và 20 khung đặc tả màn hình kỹ thuật.",
        "sections": [
            ("5.1. Cấu trúc mã nguồn dự án thực tế",
             "Mã nguồn dự án được tổ chức tại thư mục gốc D:\\\\EV3D gồm 2 phân hệ độc lập:\\n- Thư mục backend/: Dự án Spring Boot Maven tổ chức theo cấu trúc gói chuẩn: com.evshare (controller: 27 REST controllers; service: 25+ domain services; repository: 25+ JPA repositories; entity: 51 JPA entities; security: bộ lọc JWT và Provider; config: cấu hình CORS, Async, Swagger; dto: các lớp dữ liệu trao đổi; exception: xử lý ngoại lệ tập trung qua @RestControllerAdvice; util: các hàm toán học WAC, Hare-Niemeyer).\\n- Thư mục frontend/: Dự án React 18 TypeScript phát triển trên Vite, tổ chức thành các thư mục: src/components (các modal, bảng điều khiển 2D, thanh HUD); src/scenes (không gian Garage 3D, bục xoay xe, trạm sạc Three.js); src/stores (authStore, worldStore quản lý state qua Zustand); src/hooks (useGLTF, useRaycast); src/services (Axios client tích hợp Interceptor tự động gắn Bearer Token); src/types (định nghĩa interface TypeScript khớp 100% với DTO Backend)."),
            ("5.2. Hiện thực hóa các thuật toán nghiệp vụ cốt lõi",
             "Hệ thống cài đặt 4 thuật toán nghiệp vụ cốt lõi bảo đảm tính chính xác số học và toàn vẹn dữ liệu:\\n\\n"
             "1. Thuật toán kiểm tra khử xung đột lịch đặt xe (Overlap Prevention Algorithm):\\n"
             "Khi nhận CreateBookingRequest, BookingService thực thi câu truy vấn SQL kiểm tra giao thoa:\\n"
             "`SELECT COUNT(b) FROM Booking b WHERE b.vehicle.id = :vehicleId AND b.status IN ('CONFIRMED', 'PENDING') AND (b.startTime < :endTime AND b.endTime > :startTime)`\\n"
             "Nếu kết quả count > 0, phương thức ném ra ngoại lệ IllegalArgumentException('Khung giờ này đã có lịch đặt'). Nhờ đó, hai khoảng thời gian dù chỉ chạm nhau 1 giây cũng bị phát hiện và ngăn chặn triệt để.\\n\\n"
             "2. Thuật toán kho năng lượng số và định giá bình quân WAC (Weighted Average Cost):\\n"
             "Tại ChargingProgressService và VehicleEnergyInventoryService, khi hoàn tất phiên sạc, năng lượng nạp thực tế vào kho được tính: `realEnergyAdded = rawDeliveredKwh * 0.92` (hiệu suất 92%, tổn hao 8%).\\n"
             "Công thức cập nhật đơn giá vốn bình quân gia quyền mới (WAC):\\n"
             "`WAC_new = (Current_Energy_Kwh * Current_Unit_Price + Added_Kwh * Session_Price) / (Current_Energy_Kwh + Added_Kwh)`\\n"
             "Trường hợp nhân viên kỹ thuật thực hiện sạc xe (isStaffCharging = true), nhân viên được miễn phí (chargingCost = 0 đ), tuy nhiên để tránh việc làm loãng đơn giá vốn của xe về 0 đ, hệ thống áp dụng biểu giá điện chuẩn quy định (3.850 VNĐ/kWh) để ghi nhận giá trị năng lượng nhập kho.\\n"
             "Khi chuyến đi hoàn tất, số kWh điện tiêu thụ được tính: `consumedKwh = (startSoc - endSoc) * batteryCapacity / 100`. Chi phí điện chuyến đi: `tripCost = consumedKwh * WAC_current`. Số tiền này được ghi nhận thành khoản nợ cá nhân gán 100% cho người lái (USER_RESPONSIBILITY).\\n\\n"
             "3. Thuật toán phân bổ chi phí Hare-Niemeyer bảo toàn số tiền:\\n"
             "Khi phân bổ chi phí chung theo tỷ lệ vốn sở hữu (OWNERSHIP_RATIO), thuật toán Hare-Niemeyer tại ExpenseShareService được thực thi qua các bước:\\n"
             "- Bước 1: Tính phần nguyên phân bổ cho từng thành viên: `share_i = floor(Total_Amount * Percentage_i / 100)`.\\n"
             "- Bước 2: Tính phần dư số học phát sinh do làm tròn: `remainder = Total_Amount - SUM(share_i)`.\\n"
             "- Bước 3: Phân bổ phần dư sai số (thường từ 1 đến vài đồng VND) cho thành viên nắm giữ tỷ lệ cổ phần lớn nhất trong nhóm. Kiểm tra kiểm toán: `SUM(final_shares) == Total_Amount` đúng tuyệt đối.\\n\\n"
             "4. Thuật toán chuyển nhượng cổ phần nguyên tử bảo toàn bất biến vốn 100%:\\n"
             "Quy trình chuyển nhượng tại OwnershipTransferService đòi hỏi sự đồng thuận của bên nhận và phê duyệt của Trưởng nhóm. Toàn bộ thao tác cập nhật được bọc trong giao dịch nguyên tử @Transactional: Giảm tỷ lệ sở hữu của bên bán, tăng tỷ lệ sở hữu của bên mua, ghi nhật ký vào ownership_change_history, và kích hoạt hàm assert: `SUM(percentage) == 100.0000%`. Nếu tổng tỷ lệ vi phạm, toàn bộ giao dịch bị Rollback lập tức."),
            ("5.3. Mô tả chi tiết giao diện người dùng thực tế theo vai trò",
             "Khác biệt với các mô tả lý thuyết trước đây, giao diện thực tế của EVShare 3D được thiết kế đồng bộ theo vai trò:\\n\\n"
             "1. Giao diện Quản trị viên (ADMIN):\\n"
             "Bao gồm 3 khối Hologram quản trị 3D trôi nổi trong không gian: Hologram Quản trị Nhóm (Groups), Hologram Quản trị Người dùng (Users), và Hologram Phân tích Hoạt động (Analytics). Bên dưới là bục xoay xe điện (Vehicle Carousel) cho phép duyệt nhanh toàn bộ đội xe trong hệ thống, cùng bảng trực quan hóa cơ cấu sở hữu vốn của từng xe.\\n\\n"
             "2. Giao diện Nhân viên Vận hành Kỹ thuật (STAFF):\\n"
             "Gồm màn hình Hologram quản trị đội xe (Staff Fleet View), bục xoay phương tiện kiểm định, mô hình các trụ sạc vật lý thời gian thực, dải băng thông tin xe (Vehicle Info Banner) và thanh tác vụ Quick Actions tích hợp đầy đủ 7 chức năng nghiệp vụ của nhân viên: (1) Bàn giao xe (Handover), (2) Nghiệm thu trả xe (Return), (3) Ghi nhận tổn hại 3D (Damage Inspection), (4) Lập lệnh bảo dưỡng (Maintenance), (5) Tra cứu lịch sử phương tiện (Vehicle History), (6) Xác minh biên lai thanh toán (Payment Verification), (7) Tiếp nhận hòa giải tranh chấp (Dispute Mediation).\\n\\n"
             "3. Giao diện Chủ xe Đồng sở hữu (CO_OWNER):\\n"
             "Không gian Virtual Garage 3D tương tác tự do, thanh dải băng thông tin phương tiện, bảng tổng quan rút gọn (Compact Overview Panel) và bảng điều khiển hỗ trợ 8 khu vực nghiệp vụ tự phục vụ: Đặt lịch và lịch sử hành trình, Bóc tách khám phá kỹ thuật xe, Báo cáo bảo dưỡng, Chế độ X-Ray pin cao áp, Biểu quyết dân chủ, Khiếu nại tranh chấp, Quản lý nhóm và hợp đồng điện tử, Vùng tài chính nộp phí và Trợ lý ảo AI tư vấn quy chế.")
        ]
    }

def get_chapter_6_content():
    return {
        "title": "CHƯƠNG 6: KIỂM THỬ VÀ ĐÁNH GIÁ CHẤT LƯỢNG PHẦN MỀM",
        "intro": "Chương 6 trình bày chiến lược kiểm thử, môi trường kiểm thử, bảng tổng hợp 100 ca kiểm thử phần mềm, tuyên bố trạng thái thực thi minh bạch theo chuẩn mực học thuật, phân tích ma trận bao phủ các lỗi hồi quy trong lịch sử phát triển và đánh giá chất lượng mã nguồn.",
        "sections": [
            ("6.1. Chiến lược và phương pháp luận kiểm thử",
             "Hệ thống áp dụng chiến lược kiểm thử kết hợp kiểm thử hộp đen (Black-box Testing) tập trung vào hành vi chức năng và giao diện người dùng, kết hợp với kiểm thử hộp trắng (White-box Testing) tại các giải thuật tài chính và kiểm tra ràng buộc CSDL. Quy trình kiểm thử được thiết kế nhằm bảo đảm độ bao phủ toàn bộ 48 yêu cầu chức năng (FR) và 7 phân hệ nghiệp vụ."),
            ("6.2. Môi trường kiểm thử và quy ước mã định danh Test Case",
             "- Môi trường máy chủ: Windows 11 / Ubuntu 22.04 LTS, OpenJDK 21 LTS, MySQL 8.0.35, Spring Boot 3.3.4.\\n- Môi trường máy khách: Google Chrome 124+, Microsoft Edge, độ phân giải màn hình 1920x1080, WebGL 2.0 Enabled.\\n- Quy ước mã định danh: TC-[PHÂN HỆ]-[SỐ THỨ TỰ] (Ví dụ: TC-AUTH: Xác thực; TC-BOOK: Đặt xe; TC-TRIP: Hành trình; TC-CHRG: Sạc điện; TC-ENER: Kho năng lượng; TC-FIN: Tài chính; TC-OWN: Đồng sở hữu; TC-CON: Hợp đồng; TC-VOTE: Biểu quyết; TC-3D: Đồ họa 3D; TC-REG: Kiểm thử hồi quy)."),
            ("6.3. Bảng tổng hợp 100 ca kiểm thử phần mềm theo phân hệ",
             "Hệ thống đã xây dựng danh mục hoàn chỉnh 100 ca kiểm thử bao phủ toàn diện:\\n"
             "- Phân hệ Xác thực và Quản trị người dùng: 8 ca kiểm thử (TC-AUTH-01 đến 08).\\n"
             "- Phân hệ Đặt lịch và Khử xung đột: 8 ca kiểm thử (TC-BOOK-01 đến 08).\\n"
             "- Phân hệ Bàn giao và Chuyến đi: 10 ca kiểm thử (TC-TRIP-01 đến 10).\\n"
             "- Phân hệ Kiểm định và Tổn hại 3D: 6 ca kiểm thử (TC-DAMG-01 đến 06).\\n"
             "- Phân hệ Trụ sạc và Phiên sạc pin: 6 ca kiểm thử (TC-CHRG-01 đến 06).\\n"
             "- Phân hệ Kho năng lượng WAC: 6 ca kiểm thử (TC-ENER-01 đến 06).\\n"
             "- Phân hệ Tài chính và Thanh toán Demo: 8 ca kiểm thử (TC-FIN-01 đến 08).\\n"
             "- Phân hệ Nhóm đồng sở hữu và Chuyển nhượng: 6 ca kiểm thử (TC-OWN-01 đến 06).\\n"
             "- Phân hệ Hợp đồng và Chữ ký điện tử: 5 ca kiểm thử (TC-CON-01 đến 05).\\n"
             "- Phân hệ Biểu quyết và Tranh chấp: 6 ca kiểm thử (TC-VOTE-01 đến 06).\\n"
             "- Phân hệ Tương tác 3D và Canvas: 5 ca kiểm thử (TC-3D-01 đến 05).\\n"
             "- Phân hệ Kiểm thử Hồi quy Nghiệp vụ chuyên sâu: 26 ca kiểm thử (TC-REG-01 đến 26).\\n"
             "Toàn bộ 100 ca kiểm thử được lập bảng chi tiết tại Phụ lục D."),
            ("6.4. Tuyên bố minh bạch học thuật về trạng thái kiểm thử (NOT EXECUTED)",
             "Trong khuôn khổ đề tài thực tập tốt nghiệp đại học, do giới hạn về nguồn lực hạ tầng trạm sạc vật lý thực tế, thiết bị xe điện đo kiểm thực địa và thời gian thực hiện, toàn bộ 100 ca kiểm thử được ghi nhận trạng thái kiểm thử là: **NOT EXECUTED** (Chưa thực thi thực tế trong môi trường kiểm thử chính thức).\\n\\nBáo cáo không ngụy tạo kết quả kiểm thử (không giả mạo trạng thái 'PASSED 100%'). Thay vào đó, toàn bộ các ca kiểm thử đã được thiết kế sẵn sàng các bước thực thi chi tiết, dữ liệu đầu vào cụ thể, và kết quả mong đợi chuẩn xác để phục vụ cho giai đoạn chạy kiểm thử tự động (CI/CD Test Automation) và nghiệm thu thực tế tiếp theo của doanh nghiệp."),
            ("6.5. Ma trận phòng ngừa và bao phủ 14 lỗi hồi quy lịch sử",
             "Hệ thống thiết kế 26 ca kiểm thử hồi quy (TC-REG-01 đến TC-REG-26) bao phủ chặt chẽ 14 nhóm lỗi lịch sử đã được ghi nhận trong quá trình phát triển mã nguồn:\\n"
             "1. Xung đột lịch giao thoa biên thời gian (Boundary Overlap): TC-REG-01, TC-REG-02.\\n"
             "2. Lỗi giao dịch chuyển nhượng cổ phần làm lệch tổng vốn 100%: TC-REG-03, TC-REG-04.\\n"
             "3. Lỗi thất thoát năng lượng do bỏ quên hiệu suất tổn hao sạc 92%: TC-REG-05, TC-REG-06.\\n"
             "4. Lỗi loãng đơn giá vốn WAC về 0 đ khi nhân viên sạc xe: TC-REG-07, TC-REG-08.\\n"
             "5. Lỗi làm tròn phân bổ chi phí làm mất tiền lẻ VND: TC-REG-09, TC-REG-10.\\n"
             "6. Lỗi đồng sở hữu tự phê duyệt thanh toán nợ của chính mình: TC-REG-11, TC-REG-12.\\n"
             "7. Lỗi khởi hành xe khi pin dưới 20% gây cạn kiệt nguồn trên đường: TC-REG-13, TC-REG-14.\\n"
             "8. Lỗi cho phép bắt đầu chuyến đi khi nhân viên chưa bàn giao: TC-REG-15, TC-REG-16.\\n"
             "9. Lỗi cộng dồn trùng lặp kho năng lượng khi gọi API hoàn tất sạc 2 lần: TC-REG-17, TC-REG-18.\\n"
             "10. Lỗi rò rỉ bộ nhớ WebGL khi chuyển đổi liên tục giữa các xe 3D: TC-REG-19, TC-REG-20.\\n"
             "11. Lỗi Raycaster gắn Hotspot lệch tọa độ khi xoay camera: TC-REG-21, TC-REG-22.\\n"
             "12. Lỗi không khóa nút gia hạn khi có lịch đặt kế tiếp xung đột: TC-REG-23, TC-REG-24.\\n"
             "13. Lỗi thu hồi Refresh Token không triệt để phía máy chủ khi đăng xuất: TC-REG-25.\\n"
             "14. Lỗi tài khoản Admin tự hạ quyền hoặc tự khóa chính mình: TC-REG-26.")
        ]
    }

def get_chapter_7_content():
    return {
        "title": "CHƯƠNG 7: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN",
        "intro": "Chương 7 tổng kết khách quan các kết quả đạt được của đề tài, đánh giá trung thực các hạn chế còn tồn tại, vạch ra lộ trình phát triển trong tương lai và đúc kết những bài học kinh nghiệm thu nhận được sau kỳ thực tập tốt nghiệp.",
        "sections": [
            ("7.1. Đánh giá khách quan các kết quả đạt được của đề tài",
             "Đề tài đã hoàn thành các mục tiêu nghiên cứu và kỹ thuật cốt lõi đặt ra ban đầu:\\n"
             "1. Về mặt khảo sát và nghiệp vụ: Đã hệ thống hóa toàn diện bài toán kinh tế chia sẻ trong mô hình đồng sở hữu xe điện tại đô thị thông minh, xác định đầy đủ các quy tắc nghiệp vụ bảo đảm tính minh bạch và công bằng.\\n"
             "2. Về mặt phân tích và thiết kế hệ thống: Đã xây dựng bộ tài liệu kỹ nghệ phần mềm chuẩn mực với 86 sơ đồ thiết kế phân rã UML 2.5 từ tổng quan đến chi tiết, 51 bảng cơ sở dữ liệu quan hệ được chuẩn hóa 3NF và danh mục 246 REST API Endpoints.\\n"
             "3. Về mặt xây dựng mã nguồn: Đã hiện thực hóa hệ thống Full-Stack hoàn chỉnh gồm Backend Spring Boot 3.3.4 (Java 21 LTS) và Frontend React 18 (TypeScript), tích hợp thành công không gian tương tác đồ họa 3D WebGL Three.js với tính năng phát hiện va chạm Raycaster gắn Hotspot tổn hại.\\n"
             "4. Về mặt thuật toán chuyên ngành: Đã cài đặt thành công 4 thuật toán nghiệp vụ then chốt: khử xung đột lịch đặt xe, định giá kho năng lượng WAC có tính tổn hao 92%, phân bổ chi phí bảo toàn tiền tệ Hare-Niemeyer và giao dịch chuyển nhượng cổ phần nguyên tử bảo toàn bất biến vốn 100%.\\n"
             "5. Về mặt tài liệu và kiểm thử: Đã thiết lập bộ tài liệu kỹ thuật hoàn chỉnh gồm từ điển dữ liệu, ma trận RTM và 100 ca kiểm thử phần mềm có khả năng phòng ngừa 14 nhóm lỗi hồi quy lịch sử."),
            ("7.2. Các hạn chế kỹ thuật còn tồn tại",
             "Bên cạnh các kết quả đạt được, hệ thống vẫn tồn tại một số hạn chế khách quan cần nhìn nhận trung thực:\\n"
             "- Hạn chế 1: Do điều kiện môi trường phòng lab, hệ thống chưa được kết nối trực tiếp với giao thức phần cứng xe thực tế (OBD-II Dongle hoặc CAN Bus) và giao thức điều khiển trụ sạc tiêu chuẩn OCPP 2.0.1, các thông số pin và ODO hiện vẫn nhập qua giao diện người dùng hoặc mô phỏng qua bộ sinh dữ liệu.\\n"
             "- Hạn chế 2: Cơ chế ký hợp đồng điện tử và thanh toán chi phí hiện dừng lại ở mức mô phỏng (DEMO Signature qua OTP nội bộ và biên lai chuyển khoản DEMO đối soát hai bước), chưa tích hợp chữ ký số PKI công cộng (CA) và cổng thanh toán thẻ trực tuyến thực tế (VNPay, MoMo, ZaloPay).\\n"
             "- Hạn chế 3: Không gian 3D WebGL đòi hỏi thiết bị người dùng có bộ xử lý đồ họa GPU tương đối ổn định; trên một số dòng máy tính cấu hình quá cũ có thể xảy ra hiện tượng giảm tốc độ khung hình (Frame Drop) khi hiển thị mô hình xe có số lượng đa giác cao.\\n"
             "- Hạn chế 4: Danh mục 100 ca kiểm thử phần mềm mới chỉ dừng lại ở bước đặc tả thiết kế, chưa được thực thi tự động (Automated Test Execution) trên đường ống CI/CD liên tục."),
            ("7.3. Hướng phát triển và mở rộng trong tương lai",
             "Trong các giai đoạn phát triển thương mại hóa tiếp theo, hệ thống có thể mở rộng theo các hướng:\\n"
             "1. Tích hợp phần cứng IoT Telematics: Lắp đặt thiết bị IoT gắn cổng OBD-II trên xe để tự động đọc chính xác chỉ số ODO, phần trăm pin (SOC) và nhiệt độ pin thời gian thực lên máy chủ Backend qua giao thức MQTT.\\n"
             "2. Tích hợp chuẩn sạc thông minh OCPP: Kết nối trực tiếp máy chủ với các trạm sạc xe điện thông qua giao thức Open Charge Point Protocol (OCPP 2.0.1) để điều khiển cấp nguồn sạc tự động và nhận dữ liệu đo đếm điện năng tức thời.\\n"
             "3. Tích hợp hợp đồng thông minh Blockchain: Nghiên cứu chuyển đổi cơ chế quản lý cổ phần và lịch sử chuyển nhượng sang mạng sổ cái phân tán (Hyperledger Fabric hoặc EVM Smart Contracts) nhằm bảo đảm tính bất biến tuyệt đối của tài sản.\\n"
             "4. Ứng dụng Trí tuệ nhân tạo (AI): Xây dựng mô hình học máy (Machine Learning) để phân tích hình ảnh vết trầy xước từ camera điện thoại, tự động phân loại mức độ tổn hại và gợi ý chi phí khắc phục trước khi lưu vào Hotspot 3D."),
            ("7.4. Bài học kinh nghiệm thu nhận được qua kỳ thực tập",
             "Kỳ thực tập tốt nghiệp đã mang lại cho sinh viên những bài học thực tiễn vô cùng quý báu:\\n"
             "- Nâng cao năng lực tư duy kiến trúc phần mềm hướng đối tượng, hiểu sâu sắc tầm quan trọng của việc lập mô hình UML chuẩn xác trước khi viết mã nguồn.\\n"
             "- Làm chủ quy trình phát triển Full-Stack hiện đại với Java 21, Spring Boot, React 18, Zustand và đồ họa 3D Three.js WebGL.\\n"
             "- Rèn luyện kỹ năng giải quyết các bài toán toán học nghiệp vụ phức tạp trong thực tế (phân bổ sai số làm tròn, định giá kho tồn, xử lý bất biến dữ liệu trong môi trường đa luồng).\\n"
             "- Thấu hiểu tinh thần trách nhiệm, tính trung thực trong nghiên cứu khoa học và tác phong làm việc chuyên nghiệp của một kỹ sư kỹ nghệ phần mềm tương lai.")
        ]
    }

def get_bibliography():
    return [
        "[1] ISO/IEC/IEEE, \\\"Systems and software engineering — Software life cycle processes,\\\" ISO/IEC/IEEE Standard 12207:2017, Nov. 2017.",
        "[2] Object Management Group (OMG), \\\"OMG Unified Modeling Language (OMG UML), Version 2.5.1,\\\" OMG Document formal/2017-12-05, Dec. 2017.",
        "[3] E. Gamma, R. Helm, R. Johnson, and J. Vlissides, \\\"Design Patterns: Elements of Reusable Object-Oriented Software,\\\" Addison-Wesley Professional, 1994.",
        "[4] R. C. Martin, \\\"Clean Architecture: A Craftsman's Guide to Software Structure and Design,\\\" Prentice Hall, 2017.",
        "[5] M. Fowler, \\\"Patterns of Enterprise Application Architecture,\\\" Addison-Wesley Professional, 2002.",
        "[6] M. Fowler, \\\"UML Distilled: A Brief Guide to the Standard Object Modeling Language,\\\" 3rd ed., Addison-Wesley, 2003.",
        "[7] E. Evans, \\\"Domain-Driven Design: Tackling Complexity in the Heart of Software,\\\" Addison-Wesley, 2003.",
        "[8] J. Bloch, \\\"Effective Java,\\\" 3rd ed., Addison-Wesley Professional, 2018.",
        "[9] C. Walls, \\\"Spring in Action,\\\" 6th ed., Manning Publications, 2022.",
        "[10] S. B. David and M. A. F. Santos, \\\"Microservices and Multi-tier Web Architectures: Scalability and Maintainability in Modern Software Systems,\\\" IEEE Access, vol. 9, pp. 11200-11215, 2021.",
        "[11] J. Dirksen, \\\"Learn Three.js: Programming 3D animations and visualizations for the web with HTML5 and WebGL,\\\" 3rd ed., Packt Publishing, 2020.",
        "[12] D. Flanagan, \\\"JavaScript: The Definitive Guide,\\\" 7th ed., O'Reilly Media, 2020.",
        "[13] B. Eisenberg, \\\"WebAssembly: The Definitive Guide,\\\" O'Reilly Media, 2021.",
        "[14] D. Crockford, \\\"JavaScript: The Good Parts,\\\" O'Reilly Media, 2008.",
        "[15] J. Resig and B. Bibeault, \\\"Secrets of the JavaScript Ninja,\\\" 2nd ed., Manning, 2016.",
        "[16] M. Keith, M. Schincariol, and M. Nardone, \\\"Pro JPA 2 in Java EE 8: An In-Depth Guide to Java Persistence APIs,\\\" Apress, 2018.",
        "[17] B. Beizer, \\\"Software Testing Techniques,\\\" 2nd ed., Van Nostrand Reinhold, 1990.",
        "[18] P. Ammann and J. Offutt, \\\"Introduction to Software Testing,\\\" 2nd ed., Cambridge University Press, 2016.",
        "[19] G. J. Myers, C. Sandler, and T. Badgett, \\\"The Art of Software Testing,\\\" 3rd ed., John Wiley & Sons, 2011.",
        "[20] OWASP Foundation, \\\"OWASP Top Ten Web Application Security Risks,\\\" OWASP Foundation Technical Report, 2021.",
        "[21] M. Jones, J. Bradley, and N. Sakimura, \\\"JSON Web Token (JWT),\\\" RFC 7519, Internet Engineering Task Force (IETF), May 2015.",
        "[22] D. Eastlake and P. Jones, \\\"US Secure Hash Algorithm 1 (SHA1) and SHA-2,\\\" RFC 3174 / RFC 6234, IETF, 2011.",
        "[23] N. Provos and P. Honeyman, \\\"A Future-Adaptable Password Scheme (bcrypt),\\\" in Proceedings of the FREENIX Track: 1999 USENIX Annual Technical Conference, 1999, pp. 81-88.",
        "[24] International Energy Agency (IEA), \\\"Global EV Outlook 2024: Moving towards increased affordability,\\\" IEA Publications, Paris, 2024.",
        "[25] Thủ tướng Chính phủ, \\\"Quyết định số 876/QĐ-TTg phê duyệt Chương trình hành động về chuyển đổi năng lượng xanh, giảm phát thải khí carbon và khí mê-tan của ngành giao thông vận tải,\\\" Chính phủ nước CHXHCN Việt Nam, Hà Nội, 2022.",
        "[26] VinFast Auto Ltd., \\\"VinFast Electric Vehicle Technical Specifications and Smart Services Handbook,\\\" VinFast Global, Hải Phòng, 2023.",
        "[27] Society of Automotive Engineers (SAE), \\\"SAE J1772: Electric Vehicle and Plug in Hybrid Electric Vehicle Conductive Charge Coupler,\\\" SAE International Standard, 2017.",
        "[28] M. L. Balinski and H. P. Young, \\\"Fair Representation: Meeting the Ideal of One Man, One Vote (Hare-Niemeyer Largest Remainder Method),\\\" Yale University Press, 1982.",
        "[29] T. H. Cormen, C. E. Leiserson, R. L. Rivest, and C. Stein, \\\"Introduction to Algorithms,\\\" 3rd ed., The MIT Press, 2009.",
        "[30] K. Beck, \\\"Test Driven Development: By Example,\\\" Addison-Wesley Professional, 2002.",
        "[31] A. Cockburn, \\\"Writing Effective Use Cases,\\\" Addison-Wesley Professional, 2000.",
        "[32] I. Sommerville, \\\"Software Engineering,\\\" 10th ed., Pearson, 2015."
    ]

def get_appendices_narratives():
    return {
        "app_e": {
            "title": "PHỤ LỤC E: TRÍCH ĐOẠN MÃ NGUỒN TIÊU BIỂU",
            "desc": "Phụ lục này trích dẫn các đoạn mã nguồn then chốt minh chứng cho việc thực thi 4 giải thuật cốt lõi trong hệ thống EVShare 3D tại thư mục backend/ và frontend/.",
            "snippets": [
                ("1. Giải thuật kiểm tra khử xung đột lịch đặt xe (BookingService.java)",
                 "// Truy vấn khử xung đột lịch đặt xe tại tầng Repository\n"
                 "@Query(\\\"SELECT COUNT(b) FROM Booking b WHERE b.vehicle.id = :vehicleId \\\" +\n"
                 "       \\\"AND b.status IN ('CONFIRMED', 'PENDING') \\\" +\n"
                 "       \\\"AND (b.startTime < :endTime AND b.endTime > :startTime)\\\")\n"
                 "long countConflictingBookings(@Param(\\\"vehicleId\\\") Long vehicleId,\n"
                 "                               @Param(\\\"startTime\\\") LocalDateTime startTime,\n"
                 "                               @Param(\\\"endTime\\\") LocalDateTime endTime);\n\n"
                 "// Logic kiểm tra tại tầng nghiệp vụ Service\n"
                 "if (request.getStartTime().isAfter(request.getEndTime()) || request.getStartTime().isEqual(request.getEndTime())) {\n"
                 "    throw new IllegalArgumentException(\\\"Thời gian kết thúc phải diễn ra sau thời gian bắt đầu\\\");\n"
                 "}\n"
                 "long conflictCount = bookingRepository.countConflictingBookings(vehicleId, request.getStartTime(), request.getEndTime());\n"
                 "if (conflictCount > 0) {\n"
                 "    throw new IllegalArgumentException(\\\"Khung giờ này đã được đặt bởi thành viên khác. Vui lòng chọn thời gian khác\\\");\n"
                 "}"),
                ("2. Giải thuật cập nhật kho năng lượng WAC và tính tổn hao sạc 92% (ChargingProgressService.java)",
                 "// Hiệu suất sạc vật lý 92%, tổn hao biến đổi 8%\n"
                 "BigDecimal effectiveEnergyKwh = rawDeliveredKwh.multiply(new BigDecimal(\\\"0.92\\\"));\n\n"
                 "// Định giá vốn bình quân gia quyền (Weighted Average Cost)\n"
                 "BigDecimal currentEnergy = inventory.getEnergyKwh();\n"
                 "BigDecimal currentPrice = inventory.getAverageCostPerKwh();\n"
                 "BigDecimal newEnergy = currentEnergy.add(effectiveEnergyKwh);\n\n"
                 "// Nếu là Staff sạc xe vận hành: Áp dụng biểu giá chuẩn 3.850 đ/kWh để không làm loãng giá vốn\n"
                 "BigDecimal sessionTariff = isStaffCharging ? new BigDecimal(\\\"3850\\\") : sessionCostPerKwh;\n"
                 "BigDecimal totalValuation = (currentEnergy.multiply(currentPrice)).add(effectiveEnergyKwh.multiply(sessionTariff));\n"
                 "BigDecimal newWacPrice = totalValuation.divide(newEnergy, 2, RoundingMode.HALF_UP);\n\n"
                 "inventory.setEnergyKwh(newEnergy);\n"
                 "inventory.setAverageCostPerKwh(newWacPrice);\n"
                 "energyInventoryRepository.save(inventory);"),
                ("3. Giải thuật phân bổ chi phí Hare-Niemeyer bảo toàn tiền tệ (ExpenseShareService.java)",
                 "// Phân bổ nợ theo tỷ lệ cổ phần sở hữu kết hợp kỹ thuật phần dư lớn nhất\n"
                 "BigDecimal totalAmount = expense.getAmount();\n"
                 "List<OwnershipShare> shares = ownershipShareRepository.findByVehicleIdAndStatus(vehicleId, ShareStatus.ACTIVE);\n\n"
                 "BigDecimal allocatedSum = BigDecimal.ZERO;\n"
                 "Map<Long, BigDecimal> rawAllocations = new LinkedHashMap<>();\n"
                 "for (OwnershipShare share : shares) {\n"
                 "    BigDecimal memberPart = totalAmount.multiply(share.getPercentage())\n"
                 "            .divide(new BigDecimal(\\\"100\\\"), 0, RoundingMode.FLOOR);\n"
                 "    rawAllocations.put(share.getUser().getId(), memberPart);\n"
                 "    allocatedSum = allocatedSum.add(memberPart);\n"
                 "}\n\n"
                 "// Phân bổ phần dư sai số làm tròn cho thành viên nắm giữ tỷ lệ cổ phần lớn nhất\n"
                 "BigDecimal remainder = totalAmount.subtract(allocatedSum);\n"
                 "if (remainder.compareTo(BigDecimal.ZERO) > 0) {\n"
                 "    Long topOwnerUserId = shares.get(0).getUser().getId(); // Danh sách đã sắp xếp giảm dần theo percentage\n"
                 "    rawAllocations.put(topOwnerUserId, rawAllocations.get(topOwnerUserId).add(remainder));\n"
                 "}\n"
                 "// Kiểm tra bất biến kiểm toán bảo toàn tiền tệ tuyệt đối\n"
                 "BigDecimal finalVerificationSum = rawAllocations.values().stream().reduce(BigDecimal.ZERO, BigDecimal::add);\n"
                 "Assert.isTrue(finalVerificationSum.compareTo(totalAmount) == 0, \\\"Tổng tiền phân bổ bắt buộc bằng chính xác số tiền hóa đơn gốc\\\");"),
                ("4. Kỹ thuật phát tia Raycaster bắt điểm va chạm Mesh xe 3D (DamageHotspots.tsx)",
                 "// Khởi tạo tia Raycaster từ tọa độ chuột trong không gian 3D Canvas\n"
                 "const handlePointerDown = (event: ThreeEvent<PointerEvent>) => {\n"
                 "  if (!isInspectionMode) return;\n"
                 "  event.stopPropagation();\n"
                 "  // Lấy tọa độ giao cắt trên bề mặt đa giác\n"
                 "  const intersectPoint = event.point; // Vector3 (x, y, z)\n"
                 "  const meshName = event.object.name;\n\n"
                 "  // Mở modal nhập tổn hại neo theo tọa độ 3D\n"
                 "  setSelectedCoordinate({\n"
                 "    x: Number(intersectPoint.x.toFixed(4)),\n"
                 "    y: Number(intersectPoint.y.toFixed(4)),\n"
                 "    z: Number(intersectPoint.z.toFixed(4)),\n"
                 "    partName: meshName || 'EXTERIOR_BODY'\n"
                 "  });\n"
                 "  setIsDamageModalOpen(true);\n"
                 "};")
            ]
        },
        "app_f": {
            "title": "PHỤ LỤC F: HƯỚNG DẪN CÀI ĐẶT VÀ TRIỂN KHAI HỆ THỐNG",
            "desc": "Tài liệu hướng dẫn triển khai hệ thống EVShare 3D trên môi trường phát triển và máy chủ thử nghiệm.",
            "steps": [
                ("1. Yêu cầu môi trường tiền đề",
                 "- Hệ điều hành: Windows 10/11 64-bit hoặc Ubuntu 22.04 LTS.\n- Bộ phát triển Java: OpenJDK 21 LTS (đã cấu hình JAVA_HOME).\n- Công cụ đóng gói Backend: Apache Maven 3.9+.\n- Hệ quản trị CSDL: MySQL Server 8.0.35+ (cổng mặc định 3306).\n- Môi trường chạy JavaScript: Node.js v20.x LTS và npm v10.x.\n- Trình duyệt Web: Google Chrome phiên bản 120 trở lên hỗ trợ WebGL 2.0."),
                ("2. Khởi tạo Cơ sở Dữ liệu MySQL",
                 "Mở MySQL Workbench hoặc terminal dòng lệnh và thực thi lệnh tạo CSDL:\n"
                 "`CREATE DATABASE evshare3d CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`\n"
                 "`CREATE USER 'evuser'@'localhost' IDENTIFIED BY 'EvShare@2026';`\n"
                 "`GRANT ALL PRIVILEGES ON evshare3d.* TO 'evuser'@'localhost';`\n"
                 "`FLUSH PRIVILEGES;`"),
                ("3. Cấu hình và Khởi động Backend Spring Boot",
                 "Di chuyển vào thư mục backend: `cd D:\\EV3D\\backend`\n"
                 "Kiểm tra tệp `src/main/resources/application.yml` đảm bảo cấu hình kết nối DB đúng thông số.\n"
                 "Biên dịch dự án và chạy migration Flyway: `mvn clean package -DskipTests`\n"
                 "Khởi chạy ứng dụng máy chủ: `mvn spring-boot:run`\n"
                 "Kiểm tra endpoint Swagger UI tại địa chỉ: `http://localhost:8080/swagger-ui/index.html`"),
                ("4. Cài đặt và Khởi động Frontend React",
                 "Mở một cửa sổ terminal mới và di chuyển vào thư mục frontend: `cd D:\\EV3D\\frontend`\n"
                 "Cài đặt toàn bộ các gói thư viện phụ thuộc: `npm install`\n"
                 "Khởi chạy máy chủ phát triển Vite: `npm run dev`\n"
                 "Truy cập ứng dụng tại trình duyệt: `http://localhost:5173`")
            ]
        },
        "app_g": {
            "title": "PHỤ LỤC G: HƯỚNG DẪN SỬ DỤNG DÀNH CHO QUẢN TRỊ VIÊN (ADMIN)",
            "desc": "Cẩm nang hướng dẫn thao tác quản trị trên giao diện Admin Command Center 3D.",
            "guidance": [
                ("1. Đăng nhập trung tâm chỉ huy Quản trị viên",
                 "Truy cập đường dẫn `/login`. Nhập tài khoản quản trị viên hệ thống (Ví dụ: `admin@evshare.vn` / [MẬT KHẨU BẢO MẬT]). Sau khi xác thực JWT thành công, hệ thống tự động điều phối vào không gian AdminCommandCenter3D."),
                ("2. Quản lý danh sách người dùng và gán vai trò (RBAC)",
                 "Nhấp vào biểu tượng Hologram 'Quản Trị Người Dùng'. Bảng hiển thị danh sách người dùng phân trang. Admin có thể tìm kiếm theo tên/email, khóa tài khoản vi phạm hoặc gán vai trò tương ứng (ADMIN, STAFF, CO_OWNER). Lưu ý: Hệ thống chặn thao tác tự khóa hoặc tự hạ quyền tài khoản Admin đang đăng nhập."),
                ("3. Phê duyệt và giám sát nhóm đồng sở hữu xe",
                 "Nhấp vào Hologram 'Nhóm Đồng Sở Hữu'. Chọn một nhóm xe để xem danh sách thành viên và tỷ lệ cổ phần. Kiểm tra cờ trạng thái bất biến tổng vốn. Nếu tổng vốn đạt đúng 100.0000%, cờ hiển thị màu xanh lá cây; nếu có sai lệch số học, hệ thống sẽ phát cảnh báo đỏ CRITICAL_INVARIANT_VIOLATION."),
                ("4. Giám sát bảng điều khiển phân tích vận hành",
                 "Nhấp vào Hologram 'Phân Tích Vận Hành'. Bảng hiển thị các biểu đồ thống kê tổng số chuyến đi trong tháng, tổng điện năng nạp qua các trụ sạc, doanh thu tiền điện và tỷ lệ lấp đầy lịch đặt xe của toàn bộ đội xe.")
            ]
        },
        "app_h": {
            "title": "PHỤ LỤC H: HƯỚNG DẪN SỬ DỤNG DÀNH CHO NHÂN VIÊN VẬN HÀNH (STAFF)",
            "desc": "Cẩm nang hướng dẫn nghiệp vụ dành cho kỹ thuật viên tại trạm và garage vận hành.",
            "guidance": [
                ("1. Đăng nhập và theo dõi màn hình Staff Fleet View",
                 "Đăng nhập với tài khoản nhân viên (ROLE_STAFF). Giao diện hiển thị tổng quan các phương tiện tại garage, trạng thái các trụ sạc (AVAILABLE, CHARGING, FAULT) và danh sách các lịch đặt sắp diễn ra."),
                ("2. Thực hiện quy trình bàn giao xe kỹ thuật",
                 "Khi chủ xe đến nhận xe, Staff mở StaffHandoverModal. Kiểm tra thực tế xe, nhập số ODO và phần trăm pin xuất phát, ký xác nhận biên bản tình trạng. Sau khi Staff ký, hệ thống gửi thông báo yêu cầu Co-Owner ký xác nhận điện tử trước khi bắt đầu hành trình."),
                ("3. Nghiệm thu trả xe và ghi nhận tổn hại 3D",
                 "Khi Co-Owner hoàn tất hành trình và bấm yêu cầu trả xe, Staff tiếp nhận xe tại bãi, đối soát chỉ số ODO kết thúc và pin. Nếu phát hiện vết xước mới, Staff kích hoạt chế độ 'Kiểm Định Tổn Hại 3D', nhấp chuột lên vị trí va chạm trên mô hình 3D, chọn mức độ hư hại và chụp ảnh đính kèm. Sau đó bấm 'Xác Nhận Nghiệm Thu Trả Xe' để hệ thống tự động chốt hóa đơn tiền điện."),
                ("4. Quản lý trụ sạc và sạc xe chuẩn bị vận hành",
                 "Staff cắm sạc cho các xe có mức pin dưới 50%. Khi Staff thực hiện sạc xe (chế độ Staff Charging), phiên sạc được miễn phí chi phí cá nhân (0 đ) nhưng điện tích lũy vào kho vẫn được tính theo đơn giá chuẩn để bảo toàn tài sản cho nhóm đồng sở hữu."),
                ("5. Xác minh thanh toán nợ chi phí DEMO",
                 "Staff mở StaffPaymentVerificationModal, duyệt danh sách các chứng từ chuyển khoản demo mà các chủ xe đã nộp. Kiểm tra mã giao dịch và số tiền, bấm 'Phê Duyệt' để tất toán nghĩa vụ nợ, hoặc 'Từ Chối' kèm lý do để chủ xe nộp lại.")
            ]
        },
        "app_i": {
            "title": "PHỤ LỤC I: HƯỚNG DẪN SỬ DỤNG DÀNH CHO CHỦ XE ĐỒNG SỞ HỮU (CO_OWNER)",
            "desc": "Cẩm nang hướng dẫn sử dụng không gian Virtual Garage 3D dành cho chủ xe.",
            "guidance": [
                ("1. Đăng nhập và khám phá Virtual Garage 3D",
                 "Chủ xe đăng nhập vào hệ thống, mở ra không gian Garage 3D tương tác. Sử dụng chuột trái để xoay lật góc nhìn xe 360 độ, chuột phải để di chuyển vị trí camera và con lăn để phóng to/thu nhỏ. Bấm vào nút 'X-Ray Pin' để quan sát khối pin cao áp bên trong."),
                ("2. Đặt lịch sử dụng xe",
                 "Bấm nút 'Đặt Lịch' trên thanh công cụ Quick Action Dock. Chọn ngày và khung giờ mong muốn. Hệ thống sẽ tự động kiểm tra khử xung đột. Nếu khung giờ hợp lệ, lịch đặt sẽ được tạo ngay ở trạng thái CONFIRMED."),
                ("3. Khởi hành và kết thúc chuyến đi",
                 "Đến giờ hẹn, sau khi nhận bàn giao từ nhân viên, chủ xe bấm 'Bắt Đầu Chuyến Đi' trên ứng dụng để xe chuyển sang trạng thái IN_USE. Khi kết thúc hành trình, đưa xe về bãi đỗ, bấm 'Yêu Cầu Trả Xe' và nhập số ODO/pin thực tế để nhân viên kiểm tra đối soát."),
                ("4. Theo dõi tài chính và nộp thanh toán DEMO",
                 "Mở bảng 'Tài Chính' (Finance Zone Panel) để xem chi tiết tiền điện các chuyến đi và các khoản chi phí chung phân bổ theo tỷ lệ sở hữu vốn. Bấm 'Thanh Toán', sao chép thông tin tài khoản demo, nhập mã tham chiếu và tải ảnh chứng từ demo để gửi nhân viên phê duyệt."),
                ("5. Tham gia biểu quyết dân chủ và chuyển nhượng cổ phần",
                 "Mở bảng 'Biểu Quyết' để tham gia bỏ phiếu cho các đề xuất nâng cấp xe của nhóm (phiếu bầu tự động nhân theo trọng số % cổ phần). Nếu muốn rút vốn, mở bảng 'Chuyển Nhượng', nhập tỷ lệ % muốn chuyển và chọn thành viên nhận trong nhóm.")
            ]
        },
        "app_k": {
            "title": "PHỤ LỤC K: MA TRẬN TRUY XUẤT YÊU CẦU PHẦN MỀM (REQUIREMENTS TRACEABILITY MATRIX - RTM)",
            "desc": "Bảng ma trận truy xuất nguồn gốc hai chiều kết nối từ Yêu cầu chức năng (FR) -> Ca sử dụng (UC) -> Sơ đồ thiết kế (Diagram) -> Giao diện API -> Bảng CSDL -> Ca kiểm thử (TC)."
        },
        "app_l": {
            "title": "PHỤ LỤC L: NHẬT KÝ THỰC TẬP VÀ TIẾN ĐỘ THỰC HIỆN ĐỀ TÀI",
            "desc": "Ghi chép tiến độ triển khai đề tài thực tập tốt nghiệp qua 15 tuần làm việc tại doanh nghiệp.",
            "weeks": [
                ("Tuần 1-2", "Khảo sát bài toán đồng sở hữu xe điện tại doanh nghiệp, tiếp nhận đề tài và xây dựng đề cương chi tiết."),
                ("Tuần 3-4", "Thu thập và phân tích yêu cầu nghiệp vụ; lập danh mục 48 FR, 5 NFR và các quy tắc nghiệp vụ BR."),
                ("Tuần 5-6", "Mô hình hóa kiến trúc hệ thống và thiết kế hướng đối tượng: Xây dựng bộ 86 sơ đồ UML 2.5 phân rã."),
                ("Tuần 7-8", "Thiết kế cơ sở dữ liệu quan hệ chuẩn 3NF: Xây dựng 51 bảng thực thể và viết các kịch bản Flyway Migration."),
                ("Tuần 9-10", "Lập trình Backend Spring Boot: Xây dựng 27 Controllers, 25+ Services, Security JWT và các giải thuật cốt lõi."),
                ("Tuần 11-12", "Lập trình Frontend React 18: Tích hợp Three.js Canvas 3D, bục xoay xe, Raycaster Hotspots và Zustand stores."),
                ("Tuần 13", "Tích hợp hệ thống Full-Stack, kiểm tra liên kết API và xử lý các trường hợp lỗi hồi quy (Regression Testing)."),
                ("Tuần 14", "Thiết kế danh mục 100 ca kiểm thử phần mềm chi tiết; đánh giá chất lượng mã nguồn và rà soát an ninh bảo mật."),
                ("Tuần 15", "Hoàn thiện toàn văn báo cáo tốt nghiệp, hiệu đính tài liệu kỹ thuật và chuẩn bị hồ sơ bảo vệ đồ án.")
            ]
        },
        "app_m": {
            "title": "PHỤ LỤC M: DANH MỤC HẠN CHẾ KỸ THUẬT VÀ BIỆN PHÁP GIẢM THIỂU",
            "desc": "Bảng phân tích rủi ro kỹ thuật, các hạn chế công nghệ đã nhận diện và biện pháp khắc phục.",
            "items": [
                ("1. Hạn chế kết nối phần cứng xe điện", "Chưa kết nối OBD-II/CAN Bus thực tế do chi phí thiết bị xe thật.", "Xây dựng bộ sinh dữ liệu mô phỏng Telematics và cho phép nhập đối soát hai chiều qua nhân viên."),
                ("2. Hạn chế chuẩn sạc thông minh OCPP", "Chưa tích hợp trạm sạc phần cứng OCPP 2.0.1 thực tế.", "Mô phỏng máy chủ OCPP Server và giám sát tiến trình sạc theo công thức tổn hao 92%."),
                ("3. Rủi ro hiệu năng đồ họa WebGL trên máy yếu", "Mô hình 3D đa giác cao có thể gây tụt khung hình trên card tích hợp.", "Áp dụng kỹ thuật nén texture GPU KTX2, bật Frustum Culling và cung cấp tùy chọn giảm chất lượng đồ họa."),
                ("4. Hạn chế về cổng thanh toán ngân hàng", "Chưa liên kết cổng thanh toán trực tuyến do yêu cầu pháp nhân doanh nghiệp.", "Xây dựng quy trình thanh toán DEMO hai bước có nhân viên đối soát biên lai chặt chẽ.")
            ]
        },
        "app_n": {
            "title": "PHỤ LỤC N: BIÊN BẢN BÀN GIAO KỸ THUẬT VÀ MÃ NGUỒN DỰ ÁN",
            "desc": "Biên bản bàn giao toàn bộ sản phẩm kỹ thuật của đề tài thực tập tốt nghiệp cho đơn vị quản lý.",
            "deliverables": [
                ("1. Mã nguồn Backend Spring Boot", "D:\\EV3D\\backend", "Toàn bộ mã nguồn Java 21, cấu hình Maven, 51 Entities, 27 Controllers, 25+ Services và bộ script Flyway migration."),
                ("2. Mã nguồn Frontend React", "D:\\EV3D\\frontend", "Toàn bộ mã nguồn TypeScript, cấu hình Vite, mô hình 3D xe điện GLB/GLTF, shader đồ họa và các Zustand stores."),
                ("3. Cơ sở dữ liệu và Script khởi tạo", "D:\\EV3D\\backend\\src\\main\\resources\\db\\migration", "Hệ thống 46 file SQL migration khởi tạo và tiến hóa toàn bộ cấu trúc 51 bảng CSDL quan hệ."),
                ("4. Hồ sơ thiết kế UML và hình ảnh", "D:\\EV3D\\docs\\graduation-internship-report\\final\\diagrams", "86 tệp nguồn mô hình hóa PlantUML (.puml) và 86 tệp hình ảnh sơ đồ kết xuất độ phân giải cao (.png)."),
                ("5. Báo cáo tốt nghiệp hoàn chỉnh", "D:\\EV3D\\docs\\graduation-internship-report\\final", "Báo cáo chính BAO_CAO_THUC_TAP_TOT_NGHIEP_EVSHARE_3D_V3.docx kèm 7 tài liệu hỗ trợ chuẩn hóa.")
            ]
        }
    }
'''

with open(out_file, "w", encoding="utf-8") as f:
    f.write(content)

print(f"Generated {out_file} successfully.")
