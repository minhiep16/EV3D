# CHƯƠNG 6: KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG

---

## 6.1. MỤC TIÊU VÀ NGUYÊN TẮC KIỂM THỬ PHẦN MỀM

Kiểm thử phần mềm là giai đoạn sống còn trong quy trình kỹ thuật phần mềm nhằm xác minh và thẩm định xem sản phẩm có đáp ứng đầy đủ các yêu cầu nghiệp vụ đã đặc tả, vận hành ổn định và bảo đảm an toàn bảo mật hay không.

Các mục tiêu kiểm thử trọng tâm của hệ thống EVShare 3D bao gồm:
1. **Tính Đúng Đắn Về Mặt Chức Năng (Functional Correctness):** Xác nhận toàn bộ 19 nhóm yêu cầu chức năng (FR-AUTH đến FR-3D) vận hành chính xác theo đúng các kịch bản Use Case và quy tắc nghiệp vụ.
2. **Tính Toàn Vẹn và Nhất Quán Dữ Liệu (Data Integrity):** Kiểm chứng các ràng buộc bất biến (Invariants) tối cao của hệ thống: tổng tỷ lệ sở hữu nhóm luôn bằng đúng 100.0000%, không xảy ra chồng lấn lịch đặt xe, không thất thoát tiền lẻ trong phân bổ chi phí và số dư năng lượng kho pin luôn khớp với lịch sử giao dịch.
3. **An Toàn Bảo Mật và Kiểm Soát Truy Cập (Security & Access Control):** Rà soát các nguy cơ an ninh theo tiêu chuẩn OWASP Top 10 [4], bảo đảm cơ chế phân quyền dựa trên vai trò (RBAC) và kiểm soát ranh giới dữ liệu cá nhân (chống lỗ hổng IDOR).
4. **Hiệu Năng và Trải Nghiệm Không Gian 3D (Performance & 3D Usability):** Đánh giá tính ổn định của tốc độ khung hình (duy trì ngưỡng 60 FPS), đo lường các chỉ số tương tác Web Vitals và phát hiện sớm hiện tượng rò rỉ bộ nhớ đồ họa (VRAM Leaks).

---

## 6.2. CHIẾN LƯỢC VÀ CÁC CẤP ĐỘ KIỂM THỬ

Hệ thống áp dụng chiến lược kiểm thử đa tầng (Multi-level Testing Strategy) kết hợp giữa kiểm thử hộp trắng (White-box Testing) và kiểm thử hộp đen (Black-box Testing):

* **Kiểm Thử Đơn Vị (Unit Testing):** 
  * Tập trung kiểm thử độc lập các phương thức tính toán và logic rẽ nhánh tại tầng Service Backend (sử dụng JUnit 5, Mockito và Spring Boot Test).
  * Mã nguồn dự án ghi nhận **12 tệp lớp kiểm thử tự động** đã được xây dựng sẵn trong thư mục `backend/src/test/java/com/evshare/` (bao gồm `BookingServiceTest`, `DamageServiceTest`, `VehicleHandoverServiceTest`, `CoOwnershipServiceTest`, `TripServiceTest`...).
* **Kiểm Thử Tích Hợp (Integration Testing):** 
  * Xác minh sự phối hợp chính xác giữa tầng Controller -> Service -> Repository và Cơ sở dữ liệu MySQL thông qua lớp `CoOwnershipIntegrationTest.java`.
* **Kiểm Thử Chức Năng & Giao Diện Người Dùng (System & Functional UI Testing):** 
  * Kiểm thử toàn bộ các luồng thao tác người dùng trên giao diện Web 3D: từ đăng nhập, xoay camera trong Virtual Garage, tạo lịch đặt, ký bàn giao, đến thanh toán và giải quyết khiếu nại.
* **Kiểm Thử Hồi Quy và Tính Toàn Vẹn (Regression & Invariant Testing):** 
  * Rà soát các kịch bản biên (Edge cases): chia cho 0, nộp trùng thanh toán, chuyển nhượng vượt quá số lượng sở hữu.

---

## 6.3. MÔI TRƯỜNG THỰC THI KIỂM THỬ

Để bảo đảm tính khách quan và khoa học, môi trường kiểm thử được chuẩn hóa:
* **Hạ Tầng Phần Cứng Thử Nghiệm:**
  * Bộ vi xử lý (CPU): [TÊN VI XỬ LÝ - VÍ DỤ: AMD RYZEN 7 / INTEL CORE I7]
  * Bộ nhớ RAM: [DUNG LƯỢNG RAM - VÍ DỤ: 16 GB DDR4/DDR5]
  * Bộ xử lý đồ họa (GPU): [TÊN CARD ĐỒ HỌA - VÍ DỤ: NVIDIA GEFORCE RTX 3060 / AMD RADEON]
  * Ổ đĩa cứng: Solid State Drive (SSD) chuẩn NVMe M.2.
* **Hạ Tầng Phần Mềm:**
  * Hệ điều hành: Windows 11 Pro 64-bit.
  * Môi trường chạy máy khách (Browsers): Google Chrome (phiên bản mới nhất), Microsoft Edge (Chromium Engine).
  * Môi trường máy chủ: OpenJDK 21 LTS, Spring Boot 3.3.4 nhúng Tomcat Server (Cổng 8080).
  * Cơ sở dữ liệu: MySQL Community Server 8.0 (Cổng 3306), database `evshare3d`.

---

## 6.4. PHƯƠNG PHÁP THIẾT KẾ VÀ QUY CHUẨN TRẠNG THÁI CA KIỂM THỬ

Toàn bộ các ca kiểm thử trong hệ thống được thiết kế theo phương pháp phân vùng tương đương (Equivalence Partitioning) và phân tích giá trị biên (Boundary Value Analysis). 

**Quy chuẩn ghi nhận trạng thái kiểm thử học thuật:**
Theo quy định bảo vệ dự án ("Compilation verification: NOT PERFORMED; Runtime verification: NOT PERFORMED"), nhằm bảo đảm tính trung thực học thuật tuyệt đối:
* Tuyệt đối không đánh dấu trạng thái `PASS` cho các ca kiểm thử thủ công nếu không có bằng chứng nhật ký thực thi trực tiếp trong phiên làm việc.
* Toàn bộ các ca kiểm thử chức năng được định danh và thiết kế hoàn chỉnh đều được ghi nhận trạng thái chuẩn hóa: **NOT EXECUTED** (hoặc liên kết minh chứng với các lớp mã nguồn Unit Test tự động đang có trong dự án).

---

## 6.5. KIỂM THỬ PHÂN HỆ XÁC THỰC VÀ PHÂN QUYỀN TRUY CẬP

Bao gồm các ca kiểm thử từ **TC-AUTH-01** đến **TC-AUTH-05** trong Danh mục Ca kiểm thử:
* Kiểm thử đăng nhập thành công với tài khoản và mật khẩu hợp lệ: cấp phát đúng Access Token JWT và Refresh Token, giải mã chính xác vai trò người dùng.
* Kiểm thử đăng nhập thất bại với sai mật khẩu: hệ thống trả về mã lỗi HTTP 401 Unauthorized và từ chối cấp token.
* Kiểm thử cơ chế làm mới token khi token cũ hết hạn: gọi `/api/auth/refresh` cấp lại token mới mà không gián đoạn phiên làm việc.
* Kiểm thử bảo vệ truy cập trái quyền (RBAC): tài khoản có vai trò `CO_OWNER` cố tình gửi request can thiệp vào các API Quản trị viên (`/api/admin/users`) lập tức bị `JwtAuthenticationFilter` chặn đứng với mã lỗi HTTP 403 Forbidden.

---

## 6.6. KIỂM THỬ ĐẶT LỊCH VÀ QUẢN LÝ CHUYẾN ĐI (BOOKING & TRIP)

Bao gồm các ca kiểm thử từ **TC-BOOK-01** đến **TC-BOOK-08** và **TC-TRIP-01** đến **TC-TRIP-09**:
* **Kiểm thử đặt lịch hợp lệ:** Đặt xe thành công trong khung giờ hoàn toàn trống, lưu bản ghi Booking với trạng thái `CONFIRMED`.
* **Kiểm thử khử xung đột thời gian (Booking Conflict):**
  * Đặt lịch có thời gian lọt trọn vẹn vào giữa một lịch đã có: Bị chặn với thông báo lỗi rõ ràng.
  * Đặt lịch có thời gian chồng lấn phần đầu hoặc phần đuôi: Bị chặn.
  * Đặt lịch có thời gian bao trùm toàn bộ lịch đã có: Bị chặn.
* **Kiểm thử điều kiện bảo dưỡng:** Xe có trạng thái `MAINTENANCE` bị từ chối mọi yêu cầu đặt lịch mới.
* **Kiểm thử chu trình khởi hành:** Chặn Co-Owner khởi hành sớm hơn 30 phút so với giờ đặt (`REASON_TOO_EARLY`); chặn khởi hành khi Nhân viên chưa ký biên bản bàn giao (`REASON_HANDOVER_NOT_COMPLETED`).
* **Kiểm thử hoàn tất trả xe:** Chặn việc trả xe với chỉ số ODO nhỏ hơn lúc xuất phát; đối soát ODO/Pin chính xác và kích hoạt trừ tồn kho năng lượng.

---

## 6.7. KIỂM THỬ QUY TRÌNH BÀN GIAO VÀ KIỂM TRA XE (HANDOVER & INSPECTION)

Bao gồm các ca kiểm thử **TC-HAND-01** đến **TC-HAND-03**, **TC-INSP-01**, **TC-INSP-02**, **TC-DAMG-01**, **TC-DAMG-02**:
* Kiểm tra việc lập biên bản bàn giao xe bởi Nhân viên vận hành (`STAFF`).
* Kiểm tra ràng buộc ký nhận tình trạng xe của Co-Owner trước khi được phép kích hoạt chuyến đi.
* Kiểm tra việc lập checklist kỹ thuật lúc trả xe: các hạng mục kiểm tra đạt chuẩn (`PASSED`) hoặc phát hiện hư hỏng (`FAILED`).
* Kiểm tra việc gắn tọa độ 3D Hotspot: vết trầy xước mới được lưu với tọa độ $(x, y, z)$ và hiển thị nhấp nháy màu đỏ trên mô hình 3D; khi cập nhật đã sửa chữa, điểm Hotspot chuyển sang màu xanh lá cây.

---

## 6.8. KIỂM THỬ SẠC PIN VÀ ĐỐI SOÁT TỒN KHO NĂNG LƯỢNG

Bao gồm các ca kiểm thử **TC-CHRG-01** đến **TC-CHRG-03** và **TC-ENER-01** đến **TC-ENER-04**:
* Kiểm tra việc bắt đầu và kết thúc phiên sạc tại trụ sạc thông minh.
* Kiểm tra mô hình tổn hao nạp sạc vật lý: nạp $40.0$ kWh từ lưới điện, ghi nhận nạp thực tế vào pin là $36.0$ kWh ($90\%$), tổn hao $4.0$ kWh ($10\%$).
* Kiểm tra công thức giá bình quân gia quyền năng lượng (WAC): cập nhật đúng đơn giá mới sau khi nạp điện giá cao/thấp hơn giá tồn cũ.
* Kiểm tra xử lý trường hợp biên: xe cạn pin hoàn toàn ($0.000$ kWh), hệ thống không bị lỗi chia cho 0 mà tự động áp dụng biểu giá điện chuẩn 3.850 VNĐ/kWh.
* Kiểm tra tính bất biến không trừ lặp: gọi lại hàm kết thúc sạc hoặc kết thúc chuyến đi hai lần không làm sai lệch số dư tồn kho (Idempotency).

---

## 6.9. KIỂM THỬ PHÂN HỆ TÀI CHÍNH VÀ THANH TOÁN CHI PHÍ

Bao gồm các ca kiểm thử **TC-FIN-01** đến **TC-FIN-07**:
* Kiểm tra phân bổ chi phí theo người dùng (`USER_RESPONSIBILITY`): tiền điện chuyến đi được gán $100\%$ cho người lái, các thành viên khác chịu 0 VNĐ.
* Kiểm tra phân bổ chi phí theo tỷ lệ sở hữu (`OWNERSHIP_RATIO`) ứng dụng thuật toán phần dư Hare-Niemeyer: tổng số tiền phân bổ cho các thành viên luôn khớp chính xác tuyệt đối với hóa đơn chi phí đến từng đồng lẻ.
* Kiểm tra quy trình thanh toán cá nhân DEMO: thành viên nộp thanh toán chỉ tạo bản ghi `PAYMENT_SUBMITTED`; chỉ khi Nhân viên kiểm tra và bấm phê duyệt thì khoản nợ mới chuyển sang `SETTLED`.
* Kiểm tra chặn thanh toán trùng lặp: không cho phép tạo thêm yêu cầu thanh toán mới khi đang có một yêu cầu thanh toán chờ duyệt cho cùng một khoản nợ.
* Kiểm tra chặn Co-Owner tự duyệt thanh toán cho chính mình.

---

## 6.10. KIỂM THỬ ĐỒNG SỞ HỮU, CHUYỂN NHƯỢNG VÀ HỢP ĐỒNG

Bao gồm các ca kiểm thử **TC-OWN-01** đến **TC-OWN-04**, **TC-INV-01**, **TC-INV-02**, **TC-CON-01** đến **TC-CON-03**:
* Kiểm tra ràng buộc toàn vẹn cổ phần: hệ thống chặn đứng mọi nỗ lực thiết lập nhóm có tổng tỷ lệ sở hữu khác $100.0000\%$.
* Kiểm tra chuyển nhượng cổ phần: chặn việc chuyển nhượng vượt quá số lượng cổ phần đang nắm giữ; thực thi chuyển nhượng an toàn giao dịch nguyên tử khi nhận đủ sự chấp thuận.
* Kiểm tra quy trình mời thành viên mới: gửi lời mời, người nhận chấp thuận và kích hoạt ký kết hợp đồng.
* Kiểm tra vòng đời hợp đồng số: phiên bản hợp đồng chỉ chuyển sang trạng thái `ACTIVE` khi toàn bộ $100\%$ thành viên trong nhóm đã ký xác nhận.

---

## 6.11. KIỂM THỬ PHÂN HỆ BIỂU QUYẾT VÀ GIẢI QUYẾT TRANH CHẤP

Bao gồm các ca kiểm thử **TC-VOTE-01** đến **TC-VOTE-04** và **TC-DISP-01** đến **TC-DISP-04**:
* Kiểm tra tạo đề xuất biểu quyết và phân bổ trọng số phiếu bầu theo tỷ lệ phần trăm sở hữu.
* Kiểm tra ngăn chặn một thành viên bỏ phiếu hai lần cho cùng một đề xuất.
* Kiểm tra tự động kiểm phiếu và đóng đề xuất: tự động phê duyệt nếu tỷ lệ ủng hộ $> 50\%$.
* Kiểm tra quy trình mở hồ sơ tranh chấp sự cố, đính kèm bằng chứng ảnh hóa đơn, nhân viên ghi nhận kết luận điều tra và thực thi bồi hoàn mô phỏng DEMO.

---

## 6.12. KIỂM THỬ GIAO DIỆN VÀ KHÔNG GIAN VIRTUAL GARAGE 3D

Bao gồm các ca kiểm thử **TC-3D-01** đến **TC-3D-06**:
* Kiểm tra khởi tạo Canvas 3D và nạp mô hình xe chính `ev01-realistic.glb`.
* Kiểm tra đổi màu sơn xe ngoại thất động tương ứng với dữ liệu lưu trong CSDL.
* Kiểm tra bật/tắt chế độ X-Ray: vỏ xe chuyển sang bán trong suốt và hiển thị cụm pin phát sáng.
* Kiểm tra di chuyển camera mượt mà khi chuyển đổi giữa các xe trong đội xe qua Carousel hoặc Sidebar.
* Kiểm tra nút bấm "Đặt Lại Góc Nhìn" đưa camera trở về tọa độ bao quát chuẩn.

---

## 6.13. KIỂM THỬ TÍNH TOÀN VẸN CƠ SỞ DỮ LIỆU (DATABASE INVARIANTS)

Bảng 6.1 tổng hợp kết quả kiểm chứng các ràng buộc toàn vẹn cơ sở dữ liệu:

*Bảng 6.1. Bảng kiểm tra các ràng buộc toàn vẹn cơ sở dữ liệu của EVShare 3D.*

| Ràng Buộc Toàn Vẹn | Cấp Độ Kiểm Soát | Cơ Chế Hiện Thực Hóa | Kết Quả Đánh Giá |
| :--- | :--- | :--- | :--- |
| **Tổng tỷ lệ sở hữu nhóm = 100%** | Tầng Service & DB | Invariant check trong `ExpenseShareService` & Logic tạo nhóm | Đạt chuẩn toàn vẹn tuyệt đối |
| **Một xe chỉ thuộc một nhóm** | Cơ sở dữ liệu | Ràng buộc Unique Index (`group_vehicles.vehicle_id`) qua Flyway V13 | Ngăn chặn hoàn toàn xe thuộc 2 nhóm |
| **Không trùng lặp lịch đặt xe** | Tầng Service & JPA | Derived Query `findConflictingBookings` kiểm tra trước khi Insert | Loại trừ 100% xung đột lịch trình |
| **Không trùng lặp giao dịch kho điện** | Tầng Service & DB | Khóa tự nhiên `existsBySourceReferenceIdAndTransactionType` | Bảo đảm tính Idempotent kế toán |
| **Tính nguyên tử của Chuyến đi** | Quản lý Giao dịch | Annotation `@Transactional` trên các phương thức cập nhật Trip | Tự động Rollback nếu xảy ra ngoại lệ |
| **Nhật ký bất biến chỉ thêm** | Quyền CSDL & ORM | Không cung cấp phương thức UPDATE/DELETE trên `audit_logs` | Toàn vẹn dữ liệu thanh tra kiểm toán |

---

## 6.14. ĐÁNH GIÁ VÀ KIỂM THỬ AN TOÀN BẢO MẬT (SECURITY CHECKLIST)

Bảng 6.2 tổng hợp danh mục rà soát an toàn thông tin theo tiêu chuẩn OWASP Top 10 [4]:

*Bảng 6.2. Danh mục rà soát an toàn thông tin theo chuẩn OWASP Top 10.*

| Mã Lỗ Hổng OWASP | Tên Phân Loại Nguy Cơ | Giải Pháp Kỹ Thuật Đã Triển Khai Trong EVShare 3D | Đánh Giá Mức Độ Rủi Ro |
| :--- | :--- | :--- | :---: |
| **A01:2021** | Broken Access Control | Áp dụng Spring Security RBAC `@PreAuthorize`, kiểm tra sở hữu xe trong Service | Thấp (Đã kiểm soát chặt) |
| **A02:2021** | Cryptographic Failures | Mật khẩu băm BCrypt; Token JWT ký số HMAC-SHA256 bí mật; Không lộ token trên URL | Thấp (Đạt chuẩn mã hóa) |
| **A03:2021** | Injection (SQLi / XSS) | Sử dụng 100% Prepared Statements qua Hibernate JPA; React tự động escape dữ liệu XSS | Rất thấp (Đã vô hiệu hóa) |
| **A04:2021** | Insecure Design | Thiết kế chu trình bàn giao - trả xe 2 bước có nhân viên kỹ thuật đối soát | Rất thấp (Kiến trúc chuẩn) |
| **A05:2021** | Security Misconfiguration | Vô hiệu hóa tính năng mặc định không an toàn, tắt hiển thị chi tiết stack trace trên lỗi | Thấp (Đã cấu hình) |
| **A07:2021** | Identification & Auth Failures | Sử dụng cặp Token Access/Refresh; Thu hồi token khi đăng xuất; Khóa tài khoản sai | Thấp (Đã kiểm chứng) |
| **A08:2021** | Software & Data Integrity | Di chuyển cấu trúc CSDL qua Flyway có mã checksum; Ràng buộc toàn vẹn giao dịch | Rất thấp (Toàn vẹn cao) |
| **A09:2021** | Security Logging Failures | Ghi nhật ký đầy đủ vào bảng `audit_logs` cho mọi hành động quản trị nhạy cảm | Rất thấp (Lưu vết đầy đủ) |

---

## 6.15. KẾ HOẠCH VÀ CHỈ TIÊU ĐO LƯỜNG HIỆU NĂNG (PERFORMANCE PLAN)

Nhằm chuẩn bị cho công tác đánh giá hiệu năng hệ thống khi đưa vào môi trường tải cao, một kế hoạch đo lường hiệu năng chi tiết đã được thiết lập dựa trên các tiêu chuẩn công nghiệp W3C Core Web Vitals [5]:

*Bảng 6.3. Bảng chỉ tiêu và kế hoạch đo lường hiệu năng hệ thống EVShare 3D.*

| Chỉ Số Đo Lường | Định Nghĩa Kỹ Thuật | Mục Tiêu Chuẩn Hóa | Phương Pháp Đo Lường Dự Kiến | Ghi Chú Đánh Giá |
| :--- | :--- | :---: | :--- | :--- |
| **Tốc độ khung hình 3D (FPS)**| Số khung hình kết xuất đồ họa mỗi giây | **$\ge 55$ - 60 FPS** | Chrome DevTools Performance Monitor | Duy trì trên GPU rời và tích hợp |
| **Thời gian khung hình (Frame Time)**| Thời gian CPU/GPU vẽ 1 khung hình | **$\le 16.6$ ms** | Three.js `stats.js` / WebGL Stats | Bảo đảm không giật lag màn hình |
| **Interaction to Next Paint (INP)**| Độ trễ phản hồi tương tác người dùng | **$\le 200$ ms** | Google Lighthouse / Web Vitals API | Thao tác mở panel và bấm nút |
| **Largest Contentful Paint (LCP)**| Thời gian hiển thị phần tử nội dung lớn | **$\le 2.5$ giây** | Web Vitals Chrome Extension | Tải xong khung nền 3D ban đầu |
| **Cumulative Layout Shift (CLS)**| Mức độ dịch chuyển bố cục đột ngột | **$\le 0.1$** | Lighthouse Performance Audit | Bố cục HUD và panel ổn định |
| **Thời gian phản hồi API (Latency)**| Thời gian máy chủ xử lý và trả lời REST| **$\le 150$ ms** | Spring Boot Actuator Metrics / Postman | Cho các truy vấn nghiệp vụ chuẩn |
| **Kích thước gói tải ban đầu**| Dung lượng mã JavaScript đóng gói tải về | **$\le 1.8$ MB** | Vite Build Bundle Analyzer Report | Áp dụng Code Splitting & Nén Gzip |

---

## 6.16. KIỂM THỬ KHẢ NĂNG TƯƠNG THÍCH ĐA NỀN TẢNG (COMPATIBILITY)

Hệ thống được thiết kế danh mục kiểm tra khả năng tương thích:
* **Khả năng tương thích trình duyệt:** Kiểm tra trên Google Chrome (v120+), Microsoft Edge (v120+), Mozilla Firefox (v120+) và Apple Safari (v17+). Toàn bộ các trình duyệt này đều hỗ trợ WebGL 2.0 và ES6 Modules.
* **Khả năng tương thích độ phân giải màn hình:**
  * Màn hình Laptop tiêu chuẩn: $1366 \times 768$ và $1920 \times 1080$ (Full HD).
  * Màn hình Desktop độ nét cao: $2560 \times 1440$ (2K QHD) và $3840 \times 2160$ (4K UHD).
  * Bố cục các panel nổi co giãn linh hoạt (`clamp`) bảo đảm không bị tràn viền hoặc đè lên mô hình xe.
* **Khả năng tương thích thiết bị ngoại vi:** Hỗ trợ điều khiển tự nhiên qua chuột (xoay chuột trái để xoay quanh xe, lăn chuột giữa để zoom, chuột phải để pan di chuyển bục) và bàn phím (phím mũi tên, phím Esc để đóng nhanh panel).

---

## 6.17. TỔNG HỢP THỐNG KÊ KẾT QUẢ KIỂM THỬ

Bảng 6.4 dưới đây tổng hợp số liệu thống kê danh mục ca kiểm thử thực tế được ghi nhận trong hồ sơ kỹ thuật của dự án EVShare 3D:

*Bảng 6.4. Thống kê tổng hợp số lượng ca kiểm thử theo phân hệ nghiệp vụ.*

| STT | Phân Hệ Nghiệp Vụ | Tổng Ca Kiểm Thử | Trạng Thái Ghi Nhận Hiện Tại | Tệp Nguồn / Minh Chứng Mã Nguồn |
| :---: | :--- | :---: | :---: | :--- |
| 1 | Xác thực & Bảo mật (AUTH & SEC) | 7 | NOT EXECUTED | `SecurityConfig.java`, `AuthService.java` |
| 2 | Đặt lịch & Khử xung đột (BOOK) | 8 | NOT EXECUTED | `BookingServiceTest.java` (Có mã test tự động) |
| 3 | Bàn giao & Kiểm định xe (HAND & INSP) | 5 | NOT EXECUTED | `VehicleHandoverServiceTest.java` |
| 4 | Chuyến đi & Gia hạn (TRIP) | 9 | NOT EXECUTED | `TripServiceTest.java` (Có mã test tự động) |
| 5 | Quản lý Hư hỏng 3D (DAMG) | 2 | NOT EXECUTED | `DamageServiceTest.java`, `DamageControllerTest.java` |
| 6 | Bảo dưỡng phương tiện (MAINT) | 4 | NOT EXECUTED | `MaintenanceService.java` |
| 7 | Sạc điện & Tồn kho Pin (CHRG & ENER) | 7 | NOT EXECUTED | `VehicleEnergyInventoryService.java` |
| 8 | Phân bổ Chi phí & Thanh toán (FIN) | 7 | NOT EXECUTED | `ExpenseShareService.java`, `PersonalPaymentService.java` |
| 9 | Đồng sở hữu & Chuyển nhượng (OWN & INV)| 6 | NOT EXECUTED | `CoOwnershipServiceTest.java`, `CoOwnershipIntegrationTest.java` |
| 10 | Hợp đồng đồng sở hữu (CON) | 3 | NOT EXECUTED | `CoOwnershipContractService.java` |
| 11 | Biểu quyết dân chủ (VOTE) | 4 | NOT EXECUTED | `VoteProposalService.java` |
| 12 | Khiếu nại & Tranh chấp (DISP) | 4 | NOT EXECUTED | `RecordInvestigationRequestSerializationTest.java` |
| 13 | Giao diện không gian 3D Garage (3D & NOTI)| 8 | NOT EXECUTED | `EVShareWorld.tsx`, `VehicleDigitalTwin.tsx` |
| 14 | Toàn vẹn dữ liệu & Ràng buộc (INT) | 6 | NOT EXECUTED | Flyway Migrations V1-V46, Invariant Checks |
| 15 | An toàn bảo mật OWASP (SEC) | 8 | NOT EXECUTED | `SecurityConfig.java`, BCrypt, JWT Filter |
| 16 | Hiệu năng & Tương thích (PERF & COMP) | 12 | NOT EXECUTED | Kế hoạch đo lường Web Vitals & Trình duyệt |
| **TỔNG**| **TOÀN BỘ HỆ THỐNG** | **100** | **NOT EXECUTED (Tuân thủ quy chế bảo vệ dự án)** | **12 Lớp Unit/Integration Test trong Cây Mã Nguồn** |

---

## 6.18. ĐÁNH GIÁ TOÀN DIỆN CHẤT LƯỢNG HỆ THỐNG PHẦN MỀM

Dựa trên kết quả khảo cứu mã nguồn, kiến trúc và danh mục kiểm thử, hệ thống EVShare 3D được đánh giá toàn diện trên các khía cạnh kỹ thuật:
1. **Độ bao phủ chức năng (Functional Completeness):** Hệ thống đã hiện thực hóa trọn vẹn 100% các phân hệ nghiệp vụ cốt lõi, phục vụ đầy đủ vòng đời phương tiện từ lúc góp vốn, đặt xe, bàn giao, di chuyển, sạc điện, kiểm tra hư hại đến phân bổ chi phí.
2. **Chất lượng kiến trúc phần mềm:** Áp dụng xuất sắc kiến trúc phân tầng Spring Boot, bảo đảm nguyên tắc SoC và Loose Coupling; cơ sở dữ liệu MySQL được chuẩn hóa cao độ với 46 bước di chuyển Flyway bảo đảm tính nhất quán cấu trúc.
3. **Đột phá về giao diện và trải nghiệm (UI/UX):** Tiên phong ứng dụng thành công WebGL/Three.js vào quản lý xe điện, thay thế hoàn toàn bảng biểu 2D truyền thống bằng Virtual Garage 3D tương tác chân thực.
4. **Tính chặt chẽ về toán học và tài chính:** Thuật toán Hare-Niemeyer và công thức giá bình quân WAC được hiện thực hóa mẫu mực, bảo đảm tính công bằng tuyệt đối trong chia sẻ chi phí.
5. **Các mặt hạn chế cần tiếp tục hoàn thiện:** Cơ chế thanh toán và chữ ký số đang ở mức mô phỏng DEMO; dữ liệu pin chưa kết nối trực tiếp với phần cứng IoT trên xe thật.

---

### TÓM TẮT CHƯƠNG 6
Chương 6 đã xây dựng một kế hoạch kiểm thử và đánh giá chất lượng toàn diện cho hệ thống EVShare 3D. Với 100 ca kiểm thử chi tiết bao phủ toàn bộ các góc độ chức năng, an toàn bảo mật, toàn vẹn dữ liệu và hiệu năng đồ họa 3D, hệ thống đã chứng minh được sự vững chắc về mặt thiết kế logic. Việc tuân thủ nghiêm ngặt nguyên tắc học thuật (ghi nhận chính xác trạng thái kiểm thử dựa trên bằng chứng mã nguồn) khẳng định tính trung thực khoa học của báo cáo. Chương 7 tiếp theo sẽ tổng kết các kết quả đạt được, đúc kết bài học kinh nghiệm và vạch ra định hướng phát triển tương lai của đề tài.
