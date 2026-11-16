# CHƯƠNG 7: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN

---

## 7.1. CÁC KẾT QUẢ CHÍNH ĐẠT ĐƯỢC CỦA ĐỀ TÀI

Sau quá trình thực tập, nghiên cứu và phát triển nghiêm túc tại đơn vị thực tập, đề tài **"Phân tích, thiết kế và xây dựng hệ thống quản lý đồng sở hữu xe điện tích hợp không gian tương tác 3D – EVShare 3D"** đã hoàn thành trọn vẹn các nội dung nghiên cứu và đạt được những kết quả cụ thể, mang lại giá trị học thuật và thực tiễn cao:

1. **Về mặt nghiệp vụ và mô hình hóa hệ thống:**
   * Khảo cứu toàn diện và chuẩn hóa thành công mô hình nghiệp vụ đồng sở hữu xe điện đô thị, giải quyết trọn vẹn 5 bài toán cốt lõi: quản trị tỷ lệ sở hữu, khử xung đột lịch trình, chu trình bàn giao - trả xe có kiểm định, hạch toán tồn kho năng lượng và phân bổ chi phí trực tiếp.
   * Xây dựng bộ hồ sơ thiết kế công nghệ phần mềm hoàn chỉnh theo chuẩn UML 2.5.1 [1], bao gồm 10 loại sơ đồ chuyên sâu với 100 ca kiểm thử chức năng và phi chức năng chi tiết.
2. **Về mặt xây dựng hệ thống Backend (Spring Boot 3.3.4 & MySQL 8.0):**
   * Phát triển thành công hệ thống máy chủ dịch vụ mạnh mẽ, vận hành trên nền tảng Java 21 LTS, tích hợp bảo mật kiểm soát truy cập theo vai trò (RBAC) với JSON Web Token chuẩn RFC 7519 [6].
   * Xây dựng và chuẩn hóa lược đồ cơ sở dữ liệu gồm 46 bảng thực thể quan hệ, được phiên bản hóa và kiểm soát di chuyển tự động qua 46 tệp script Flyway Migration.
   * Hiện thực hóa thành công **Động cơ Quản trị Tồn kho Năng lượng (VehicleEnergyInventoryService)** với công thức giá bình quân gia quyền (WAC) liên tục, tính đến tổn hao vật lý nạp sạc (hiệu suất 90%).
   * Hiện thực hóa **Động cơ Phân bổ Chi phí Trực tiếp (ExpenseShareService)** ứng dụng thuật toán phần dư lớn nhất Hare-Niemeyer [22], bảo đảm tính toàn vẹn và công bằng tài chính tuyệt đối giữa các đồng sở hữu.
3. **Về mặt xây dựng Frontend và Đồ họa 3D WebGL (React 18 & Three.js):**
   * Tiên phong xây dựng ứng dụng Single Page Application (SPA) tương tác 3D thuần nhất (Pure 3D-First Experience), đưa toàn bộ các quy trình nghiệp vụ vào không gian Virtual Garage 3D.
   * Hiện thực hóa khái niệm Bản sao số hóa (Digital Twin) cho xe điện: nạp mô hình 3D chuẩn GLB, tự động đổi màu sơn ngoại thất theo dữ liệu thực tế trong CSDL, bóc tách chi tiết từng cụm phụ tùng xe, và chế độ X-Ray nhìn xuyên cụm pin phát sáng.
   * Xây dựng tính năng bản đồ hóa hư hỏng 3D (3D Damage Mapping), cho phép gắn trực tiếp các điểm Hotspot cảnh báo va chạm phát sáng trên bề mặt lưới hình học của xe.
4. **Về mặt an toàn bảo mật và kiểm thử chất lượng:**
   * Áp dụng nguyên tắc phòng thủ theo chiều sâu (Defense-in-Depth), kiểm soát ranh giới dữ liệu cá nhân, chống tấn công SQL Injection và IDOR.
   * Thiết kế danh mục 100 ca kiểm thử bao phủ toàn bộ các luồng chức năng, phân định minh bạch trạng thái kiểm thử học thuật theo đúng quy định bảo vệ dự án.

---

## 7.2. MỨC ĐỘ ĐÁP ỨNG MỤC TIÊU NGHIÊN CỨU BAN ĐẦU

Bảng 7.1 dưới đây so sánh, đối chiếu chi tiết giữa các mục tiêu nghiên cứu đã xác lập tại Chương 1 với các kết quả thực tế đạt được của dự án EVShare 3D:

*Bảng 7.1. Bảng đối chiếu mức độ đáp ứng mục tiêu nghiên cứu của đề tài.*

| Nhóm Mục Tiêu | Mục Tiêu Đặt Ra Ban Đầu (Chương 1) | Kết Quả Thực Tế Đạt Được (Chương 5, 6) | Mức Độ Hoàn Thành |
| :--- | :--- | :--- | :---: |
| **Mục tiêu Chức năng** | Phục vụ đầy đủ 3 nhóm tác nhân: Quản trị viên (ADMIN), Nhân viên vận hành (STAFF), và Chủ đồng sở hữu (CO_OWNER). | Đã hiện thực hóa 27 REST Controller, hoàn thiện đầy đủ giao diện và nghiệp vụ chuyên biệt cho cả 3 vai trò. | **Đạt 100%** |
| **Mục tiêu Đặt xe & Khử xung đột** | Ngăn chặn triệt để tình trạng đặt trùng lặp thời gian sử dụng xe giữa các thành viên. | Động cơ `BookingService` thực thi câu truy vấn `findConflictingBookings` chặn đứng 100% các xung đột chồng lấn thời gian. | **Đạt 100%** |
| **Mục tiêu Chu trình Vận hành** | Thiết lập quy trình bàn giao - trả xe minh bạch gắn liền kiểm tra kỹ thuật. | Hoàn thiện chu trình 8 bước: Bàn giao xe độc lập -> Khởi hành -> Yêu cầu trả xe -> Nhân viên đối soát chốt biên bản kỹ thuật. | **Đạt 100%** |
| **Mục tiêu Tồn kho Năng lượng** | Hạch toán số kWh trong pin và tính đơn giá điện bình quân gia quyền (WAC). | `VehicleEnergyInventoryService` tính toán đúng WAC theo từng phiên sạc nạp, trừ kho chính xác theo chuyến đi. | **Đạt 100%** |
| **Mục tiêu Phân bổ Chi phí** | Phân bổ chi phí trực tiếp, tiền điện thuộc về người lái, phí chung chia theo vốn. | Hiện thực hóa chính sách `USER_RESPONSIBILITY` và `OWNERSHIP_RATIO` với thuật toán phần dư Hare-Niemeyer. | **Đạt 100%** |
| **Mục tiêu Không gian 3D** | Trải nghiệm Virtual Garage 3D thuần nhất, bóc tách phụ tùng, X-Ray Pin, Hotspot hư hỏng. | Tích hợp thành công Three.js r173 và R3F, nạp mô hình GLB tối ưu, hỗ trợ bóc tách chi tiết và gắn điểm hư hại 3D. | **Đạt 100%** |
| **Mục tiêu Tính Toàn Vẹn** | Bảo đảm các bất biến dữ liệu: tổng tỷ lệ sở hữu nhóm = 100%, nguyên tử ACID. | Đạt chuẩn ACID qua `@Transactional`, bảo toàn tuyệt đối nguyên tắc bất biến tổng 100% cổ phần qua kiểm tra tầng Service. | **Đạt 100%** |

---

## 7.3. ƯU ĐIỂM NỔI BẬT CỦA HỆ THỐNG

1. **Đột phá về mặt trải nghiệm người dùng (UX Paradigm Shift):** Khác biệt hoàn toàn với các phần mềm quản lý vận tải truyền thống vốn chỉ là tập hợp các bảng biểu 2D khô khan, EVShare 3D tiên phong số hóa toàn bộ trải nghiệm người dùng vào không gian Virtual Garage 3D tương tác. Người dùng được trực tiếp nhìn thấy, xoay ngắm chiếc xe đồng sở hữu của mình, nhìn xuyên vào khối pin và theo dõi trực quan vị trí hư hỏng.
2. **Kiến trúc phân tầng doanh nghiệp chuẩn mực và bền vững:** Việc tách bạch rõ ràng giữa Frontend (React 18 + Three.js), Backend (Spring Boot 3.3.4 + Spring Security) và CSDL (MySQL 8.0) giúp hệ thống có khả năng bảo trì cao, dễ dàng nâng cấp hoặc thay thế từng thành phần mà không ảnh hưởng đến toàn cục.
3. **Mô hình tài chính minh bạch và công bằng tuyệt đối:** Việc loại bỏ mô hình Quỹ chung cồng kềnh để chuyển sang mô hình Phân bổ Chi phí Trực tiếp, kết hợp với thuật toán Hare-Niemeyer và công thức giá bình quân gia quyền WAC giúp triệt tiêu hoàn toàn các tranh chấp tài chính – vốn là nguyên nhân hàng đầu làm đổ vỡ các mô hình kinh tế chia sẻ.
4. **Quy trình vận hành kỹ thuật chặt chẽ:** Việc phân định rõ ràng giữa hành vi "Yêu cầu trả xe của Co-Owner" và "Xác nhận đối soát kỹ thuật của Nhân viên" giúp bảo vệ tài sản xe điện giá trị cao trước các nguy cơ gian lận chỉ số ODO hoặc che giấu va chạm hư hại.

---

## 7.4. CÁC HẠN CHẾ KỸ THUẬT HIỆN TẠI

Với tinh thần học thuật khách quan và trung thực, báo cáo chỉ rõ các mặt hạn chế kỹ thuật hiện tại của dự án:
1. **Chế độ thanh toán tài chính đang ở mức mô phỏng (DEMO Mode):** Hệ thống hiện tại chỉ mô phỏng luồng thanh toán chuyển khoản nội bộ (sinh mã đối soát, nộp ảnh bằng chứng và nhân viên duyệt) qua cấu hình `app.financial-mode: DEMO`, chưa kết nối trực tiếp với cổng thanh toán ngân hàng tự động (VNPay, VietQR, Napas).
2. **Quy trình ký hợp đồng số chưa tích hợp chứng thư số công cộng PKI:** Chữ ký số trên hợp đồng đồng sở hữu hiện sử dụng cơ chế hash chấp thuận nội bộ (DEMO Digital Signature), chưa tích hợp chữ ký số có giá trị pháp lý chính thức được chứng thực bởi cơ quan chức năng (CA Token / VNPT-CA / Viettel-CA).
3. **Dữ liệu pin và sạc điện dựa trên mô hình toán phần mềm:** Các thông số mức pin (SOC), quãng đường (ODO) và tiến trình nạp sạc được mô phỏng chuẩn xác bằng thuật toán tại tầng Service, chưa kết nối trực tiếp với thiết bị phần cứng vi điều khiển đo xa (IoT Telemetry qua cổng OBD-II) trên phương tiện thực tế.
4. **Yêu cầu phần cứng máy khách đối với đồ họa 3D:** Do ứng dụng chạy Canvas WebGL 3D với vật liệu phản xạ và mô hình đa giác chi tiết, các máy tính văn phòng có cấu hình quá cũ (không hỗ trợ WebGL 2.0 hoặc thiếu card đồ họa) có thể gặp hiện tượng sụt giảm tốc độ khung hình.
5. **Chưa tối ưu hóa hoàn toàn cho thiết bị di động:** Giao diện hệ thống hiện tập trung tối ưu hóa cho màn hình máy tính để bàn (Desktop) và máy tính xách tay (Laptop); trải nghiệm tương tác 3D trên màn hình cảm ứng điện thoại thông minh (Mobile) cần được tiếp tục tinh chỉnh.

---

## 7.5. KIẾN THỨC VÀ KỸ NĂNG TÍCH LŨY QUA KỲ THỰC TẬP

Quá trình thực tập tốt nghiệp và trực tiếp tham gia phát triển dự án EVShare 3D đã giúp sinh viên tích lũy và nâng tầm toàn diện cả về kiến thức học thuật lẫn kỹ năng kỹ thuật thực tiễn:
* **Năng lực phân tích và thiết kế hệ thống:** Nắm vững phương pháp luận phân tích yêu cầu nghiệp vụ thực tế, kỹ thuật mô hình hóa hệ thống bằng chuẩn UML 2.5.1, thiết kế cơ sở dữ liệu quan hệ chuẩn 3NF và xây dựng từ điển dữ liệu chuẩn mực.
* **Kỹ năng phát triển Backend cấp doanh nghiệp:** Làm chủ nền tảng Java 21 LTS, khai thác chuyên sâu các tính năng của Spring Boot 3.3.4, cấu hình chuỗi lọc Spring Security, xác thực phi trạng thái với JWT, tối ưu hóa truy vấn Spring Data JPA / Hibernate ORM và quản lý di chuyển CSDL tự động với Flyway.
* **Kỹ năng lập trình đồ họa Web hiện đại:** Tiếp cận và làm chủ công nghệ đồ họa WebGL tương tác thời gian thực thông qua Three.js và React Three Fiber; hiểu sâu về Scene Graph, Shaders, cơ chế chiếu sáng, vật liệu vật lý chân thực và kỹ thuật dò tia Raycasting.
* **Tư duy kiến trúc và giải thuật tài chính:** Rèn luyện năng lực giải quyết các bài toán biên phức tạp: xây dựng thuật toán phân chia phần dư Hare-Niemeyer, công thức giá bình quân gia quyền tồn kho, và các giải thuật kiểm tra khử xung đột thời gian.
* **Kỹ năng đảm bảo chất lượng phần mềm (QA/QC):** Nắm vững quy trình thiết kế ca kiểm thử chuẩn mực theo phân vùng tương đương và giá trị biên, rà soát lỗ hổng an ninh theo tiêu chuẩn OWASP Top 10 và lập kế hoạch đo lường chỉ số hiệu năng Web Vitals.
* **Kỹ năng làm việc chuyên nghiệp:** Rèn luyện tác phong làm việc kỷ luật, tuân thủ quy chuẩn mã sạch (Clean Code), sử dụng thành thạo hệ thống quản lý phiên bản Git và kỹ năng soạn thảo tài liệu kỹ thuật chuẩn học thuật.

---

## 7.6. ĐỊNH HƯỚNG PHÁT TRIỂN TRONG TƯƠNG LAI

Nhằm đưa nền tảng EVShare 3D từ môi trường thử nghiệm học thuật tiến tới một sản phẩm thương mại hoàn chỉnh (Production-ready Commercial Platform), các hướng phát triển chiến lược trong tương lai được đề xuất bao gồm:

1. **Tích hợp phần cứng đo xa vi điều khiển IoT (Hardware Telemetry Integration):**
   * Kết nối thiết bị phần cứng OBD-II / CAN-Bus gắn trên cổng giao tiếp của xe điện để tự động truyền dữ liệu thực tế thời gian thực (Real-time Telemetry): mức pin SOC chính xác, chỉ số ODO, nhiệt độ khối pin và tọa độ định vị GPS lên máy chủ.
   * Kết nối với các trụ sạc thông minh chuẩn giao tiếp OCPP (Open Charge Point Protocol), tự động kích hoạt và ngắt phiên sạc theo tín hiệu phần cứng.
2. **Tích hợp cổng thanh toán trực tuyến tự động (Commercial Payment Gateway):**
   * Đấu nối với các cổng thanh toán ngân hàng thương mại được cấp phép (VNPay, MoMo, ZaloPay, VietQR API) để tự động hóa hoàn toàn quy trình nộp và tất toán chi phí năng lượng cá nhân qua mã QR động (Dynamic QR Code).
3. **Tích hợp chữ ký số công cộng PKI (Legal Digital Signature):**
   * Hợp tác với các tổ chức cung cấp dịch vụ chứng thực chữ ký số công cộng (VNPT-CA, Viettel-CA, FPT-CA) để tích hợp giải pháp ký số từ xa (Remote Signing), nâng tầm hợp đồng đồng sở hữu điện tử có đầy đủ giá trị pháp lý trước pháp luật.
4. **Phát triển ứng dụng di động đa nền tảng (Mobile Application):**
   * Mở rộng nền tảng sang ứng dụng di động (iOS / Android) sử dụng React Native hoặc Flutter, hỗ trợ tính năng mở khóa xe từ xa (Digital Car Key qua Bluetooth BLE / NFC) và nhận thông báo đẩy tức thời (Push Notifications).
5. **Ứng dụng Trí tuệ Nhân tạo và Học máy (AI & Machine Learning):**
   * Xây dựng mô hình trí tuệ nhân tạo thị giác máy tính (Computer Vision) để tự động nhận diện và phân tích vết trầy xước thân vỏ xe thông qua ảnh chụp biên bản kiểm tra kỹ thuật.
   * Xây dựng thuật toán học máy dự báo nhu cầu di chuyển và khuyến nghị lịch đặt thông minh (Smart Booking Recommendation), giúp tối ưu hóa lịch trình và giảm thiểu xung đột giữa các thành viên.
6. **Triển khai hạ tầng đám mây và tự động hóa CI/CD:**
   * Đóng gói hệ thống dưới dạng Docker Containers, triển khai và điều phối trên hạ tầng đám mây (Kubernetes / AWS / Google Cloud Platform), thiết lập hệ thống giám sát phân tán (Prometheus & Grafana) và quản lý tải tự động (Auto-scaling).

---

## 7.7. KẾT LUẬN CHUNG

Trong bối cảnh đô thị hiện đại đang chuyển mình mạnh mẽ hướng tới các giải pháp giao thông xanh và kinh tế tuần hoàn, việc sở hữu chung phương tiện giao thông thuần điện (EV Co-Ownership) là một xu thế tất yếu của tương lai. Tuy nhiên, sự thành công bền vững của mô hình này phụ thuộc hoàn toàn vào một công cụ quản lý minh bạch, khách quan và đáng tin cậy.

Đề tài **"Phân tích, thiết kế và xây dựng hệ thống quản lý đồng sở hữu xe điện tích hợp không gian tương tác 3D – EVShare 3D"** đã hoàn thành xuất sắc sứ mệnh nghiên cứu khoa học và ứng dụng thực tiễn của một đồ án tốt nghiệp đại học ngành Công nghệ Thông tin. Bằng việc kết hợp hài hòa giữa kiến trúc Backend doanh nghiệp vững chắc (Spring Boot, Spring Security, Hibernate ORM, MySQL) với công nghệ đồ họa không gian tương tác tiên tiến WebGL (React 18, Three.js, React Three Fiber), hệ thống không chỉ giải quyết triệt để các bài toán hóc búa về quản lý lịch trình, đối soát kỹ thuật và phân bổ chi phí năng lượng mà còn mở ra một phương thức tương tác người dùng đột phá, giàu cảm xúc và mang đậm hơi thở công nghệ tương lai.

Dù còn những hạn chế nhất định cần tiếp tục hoàn thiện về mặt kết nối phần cứng và dịch vụ thương mại, kết quả nghiên cứu của đề tài đã đặt nền móng kỹ thuật vững chắc, khẳng định tính đúng đắn của phương pháp luận kỹ thuật phần mềm và minh chứng cho năng lực làm chủ công nghệ cao của sinh viên tốt nghiệp.

---

### TÓM TẮT CHƯƠNG 7
Chương 7 đã tổng kết toàn diện các kết quả nghiên cứu chính đạt được của đề tài, đánh giá mức độ hoàn thành 100% so với các mục tiêu xác lập ban đầu, phân tích sâu sắc các ưu điểm vượt trội cùng các mặt hạn chế kỹ thuật hiện tại. Chương này cũng đúc kết những bài học kinh nghiệm quý báu mà sinh viên đã tích lũy trong suốt kỳ thực tập tốt nghiệp, đồng thời vạch ra một lộ trình phát triển rõ ràng để nâng cấp hệ thống EVShare 3D thành một sản phẩm thương mại hoàn chỉnh trong tương lai.
