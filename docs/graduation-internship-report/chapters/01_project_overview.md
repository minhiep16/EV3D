# CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ ĐƠN VỊ THỰC TẬP

---

## 1.1. GIỚI THIỆU ĐƠN VỊ THỰC TẬP

### 1.1.1. Thông tin chung về doanh nghiệp
* **Tên doanh nghiệp tiếp nhận:** [TÊN DOANH NGHIỆP / CÔNG TY CỔ PHẦN CÔNG NGHỆ THỰC TẬP]
* **Tên giao dịch quốc tế:** [ENTERPRISE INTERNATIONAL TRADING NAME]
* **Địa chỉ trụ sở chính:** [ĐỊA CHỈ TRỤ SỞ DOANH NGHIỆP]
* **Mã số thuế / Giấy phép kinh doanh:** [MÃ SỐ DOANH NGHIỆP]
* **Website / Cổng thông tin:** [WEBSITE DOANH NGHIỆP]

### 1.1.2. Lĩnh vực hoạt động và thế mạnh công nghệ
Đơn vị tiếp nhận thực tập là doanh nghiệp hoạt động chuyên sâu trong lĩnh vực nghiên cứu, thiết kế, phát triển và chuyển giao các giải pháp công nghệ thông tin tiên tiến. Các lĩnh vực kinh doanh trọng tâm bao gồm:
1. Phát triển hệ thống phần mềm doanh nghiệp (Enterprise Web & Cloud Solutions) quy mô lớn trên nền tảng Java/Spring Boot và kiến trúc hướng dịch vụ.
2. Ứng dụng công nghệ đồ họa máy tính tương tác, WebGL, 3D Digital Twin trong quản lý hạ tầng giao thông thông minh và đô thị số.
3. Nghiên cứu và triển khai các nền tảng kinh tế chia sẻ, giải pháp chuyển đổi xanh trong ngành công nghiệp ô tô điện và quản lý hạ tầng trạm sạc.

### 1.1.3. Cơ cấu tổ chức và môi trường phát triển phần mềm
Doanh nghiệp được tổ chức theo mô hình quản trị tinh gọn hiện đại, bao gồm Ban Giám đốc điều hành, Khối Kinh doanh & Tư vấn giải pháp, Khối Đảm bảo chất lượng (QA/QC), và Khối Công nghệ & Kỹ thuật phần mềm. 

Môi trường phát triển phần mềm tại công ty tuân thủ chặt chẽ quy trình công nghệ chuẩn mực:
* **Hạ tầng quản lý phiên bản mã nguồn:** Hệ thống Git nội bộ với chiến lược phân nhánh rõ ràng (Git-flow), tích hợp hệ thống đánh giá mã nguồn chéo (Peer Code Review).
* **Quy trình triển khai:** Áp dụng mô hình tích hợp và phân phối liên tục (CI/CD), tự động hóa đóng gói và kiểm thử hồi quy.
* **Quy chuẩn mã nguồn:** Tuân thủ các nguyên tắc thiết kế mã sạch (Clean Code), kiểm tra an toàn bảo mật mã nguồn tĩnh (SonarQube) và quy tắc kiểm soát phụ thuộc kiến trúc.

### 1.1.4. Bộ phận thực tập và nhiệm vụ được phân công
Sinh viên được tiếp nhận thực tập tại **Phòng Nghiên cứu & Phát triển Giải pháp Số (R&D Software Engineering Department)**. Dưới sự định hướng chuyên môn trực tiếp của Cán bộ hướng dẫn, sinh viên được giao trọng trách nghiên cứu, phân tích nghiệp vụ, thiết kế kiến trúc và trực tiếp tham gia hiện thực hóa dự án **EVShare 3D (Electric Vehicle Co-Ownership Management Platform with Interactive 3D Virtual Garage)**. 

Nhiệm vụ cụ thể bao gồm:
* Khảo sát mô hình kinh tế đồng sở hữu ô tô điện, chuẩn hóa các bài toán nghiệp vụ về chia sẻ chi phí, phòng ngừa xung đột lịch trình và quản lý hư hỏng phương tiện.
* Thiết kế và xây dựng cơ sở dữ liệu quan hệ bảo đảm tính toàn vẹn tuyệt đối (ACID) cho dữ liệu cổ phần tài chính và lịch sử vận hành xe.
* Hiện thực hóa hệ thống Backend RESTful API vững chắc trên nền tảng Spring Boot 3.3.4, tích hợp bảo mật kiểm soát truy cập theo vai trò (RBAC) và JWT.
* Phát triển không gian giao diện 3D tương tác trên trình duyệt (Pure 3D-First Virtual Garage) ứng dụng React Three Fiber và Three.js, hiện thực hóa khái niệm Digital Twin cho xe điện.
* Thiết kế tài liệu kỹ thuật, xây dựng kịch bản kiểm thử và hoàn thiện báo cáo thực tập tốt nghiệp theo chuẩn mực học thuật của nhà trường.

---

## 1.2. BỐI CẢNH THỰC HIỆN ĐỀ TÀI

### 1.2.1. Sự phát triển mạnh mẽ của phương tiện giao thông thuần điện
Trước áp lực biến đổi khí hậu toàn cầu và mục tiêu phát thải ròng bằng "0" (Net Zero) vào năm 2050, ngành công nghiệp giao thông vận tải thế giới nói chung và Việt Nam nói riêng đang chứng kiến làn sóng chuyển dịch thần tốc từ xe sử dụng động cơ đốt trong sang xe thuần điện (Battery Electric Vehicles - BEV) [20]. Xe điện sở hữu những ưu thế vượt trội như không phát thải khí nhà kính tại chỗ, hiệu suất sử dụng năng lượng cao (đạt 85-90% so với mức 20-30% của động cơ nhiệt), chi phí bảo trì định kỳ thấp và khả năng tích hợp sâu rộng các công nghệ số hóa thông minh.

Tuy nhiên, tại các đô thị đông đúc, rào cản lớn nhất đối với việc phổ cập phương tiện điện cá nhân chính là:
1. **Chi phí đầu tư mua xe ban đầu (CapEx) còn tương đối cao**, đặc biệt là giá thành cấu thành từ cụm pin hóa học chiếm tới 30-40% giá trị phương tiện.
2. **Hiệu suất sử dụng thực tế chưa tối ưu:** Phần lớn ô tô cá nhân tại đô thị chỉ vận hành từ 1 đến 2 giờ mỗi ngày (tương đương 5-10% tổng thời gian trong ngày), trong khi 90-95% thời gian còn lại phương tiện nằm yên trong bãi đỗ nhưng chủ xe vẫn phải gánh chịu toàn bộ chi phí khấu hao tài sản, bảo hiểm và phí gửi xe cố định hàng tháng [21].
3. **Áp lực về hạ tầng sạc đô thị:** Không phải người sử dụng nào ở các chung cư cao tầng hoặc nhà phố nhỏ cũng có khả năng lắp đặt trụ sạc gia đình riêng biệt.

### 1.2.2. Xu thế kinh tế chia sẻ và mô hình đồng sở hữu (Fractional Co-Ownership)
Nhằm hóa giải mâu thuẫn giữa chi phí vốn đầu tư lớn và hiệu suất sử dụng thấp, mô hình **Đồng sở hữu tài sản (Co-Ownership)** nổi lên như một giải pháp kinh tế mang tính đột phá. Khác với mô hình thuê xe dịch vụ truyền thống (Car-rental / Car-sharing của bên thứ ba với chi phí thuê biên tương đối đắt đỏ và thiếu tính gắn bó trách nhiệm), mô hình đồng sở hữu cho phép một nhóm từ 2 đến 5 cá nhân (bạn bè, người thân, đồng nghiệp hoặc các hộ gia đình sống cùng khu dân cư) cùng nhau đóng góp vốn theo tỷ lệ phần trăm xác định để sở hữu chung một chiếc xe điện cao cấp:
* Mỗi thành viên đều là chủ sở hữu hợp pháp đối với tài sản tương ứng với phần vốn góp.
* Mọi người được quyền sử dụng xe công bằng theo lịch đăng ký.
* Các chi phí phát sinh như bảo hiểm, bảo dưỡng định kỳ, khấu hao pin và bãi đỗ được chia sẻ minh bạch theo tỷ lệ sở hữu hoặc mức độ lăn bánh thực tế.

### 1.2.3. Khó khăn, thách thức thực tiễn trong quản trị đồng sở hữu
Mặc dù mô hình đồng sở hữu mang lại giá trị kinh tế to lớn, song việc vận hành thực tế thường đối mặt với các xung đột lợi ích sâu sắc nếu thiếu vắng một công cụ quản lý số hóa minh bạch:
1. **Xung đột lịch trình (Scheduling Conflicts):** Tình trạng nhiều thành viên cùng có nhu cầu sử dụng xe vào các khung giờ cao điểm (cuối tuần, dịp lễ tết) hoặc việc một thành viên tự ý kéo dài thời gian di chuyển làm ảnh hưởng nghiêm trọng đến chuyến đi của thành viên kế tiếp.
2. **Thiếu minh bạch trong tình trạng kỹ thuật và trách nhiệm hư hỏng:** Khi phát hiện xe bị trầy xước sơn, nứt kính, móp cản va hoặc giảm sút sức khỏe pin (SOH), rất khó quy kết trách nhiệm thuộc về ai nếu không có quy trình kiểm tra, lập biên bản bàn giao (Check-in/Check-out) chặt chẽ giữa các chuyến đi.
3. **Phức tạp trong hạch toán và phân bổ chi phí năng lượng:** Xe điện tiêu thụ điện năng tích trữ trong pin. Khi một thành viên sạc xe tại trạm công cộng với đơn giá biến động, lượng điện đó được nạp vào pin chung. Người tiếp theo sử dụng xe sẽ tiêu hao lượng điện này. Nếu chỉ chia đều tiền điện theo tháng hoặc theo đầu người thì sẽ dẫn đến bất công nghiêm trọng giữa người đi nhiều và người đi ít.
4. **Trở ngại trong biểu quyết và chuyển nhượng:** Khi cần ra quyết định bảo dưỡng lớn, thay lốp, mua gói bảo hiểm hoặc khi một thành viên muốn rút vốn chuyển nhượng cổ phần cho người khác, việc thu thập chữ ký và đạt được sự đồng thuận thường mất nhiều thời gian và dễ phát sinh tranh chấp pháp lý.

*Hình 1.1 dưới đây thể hiện sơ đồ phân tích các chiều kích bài toán quản trị vận hành trong mô hình đồng sở hữu xe điện.*

```
+-----------------------------------------------------------------------------------+
|               BỐI CẢNH BÀI TOÁN QUẢN TRỊ ĐỒNG SỞ HỮU XE ĐIỆN ĐÔ THỊ               |
+-----------------------------------------------------------------------------------+
       |                                      |                                |
       v                                      v                                v
[GÓC ĐỘ PHƯƠNG TIỆN]               [GÓC ĐỘ CON NGƯỜI / NHÓM]          [GÓC ĐỘ TÀI CHÍNH / VẬN HÀNH]
- Chi phí pin & giá xe cao         - Xung đột khung giờ đặt xe        - Nạp điện chung nhưng đi riêng
- Hiệu suất đỗ tĩnh 90-95%         - Mâu thuẫn khi xe bị trầy xước    - Giá điện sạc biến động theo trụ
- Cần theo dõi SOC/SOH liên tục    - Tranh chấp tỷ lệ biểu quyết      - Phân bổ chi phí thiếu công bằng
       \                                      |                                /
        \-------------------------------------+-------------------------------/
                                              |
                                              v
+-----------------------------------------------------------------------------------+
|     GIẢI PHÁP ĐỀ XUẤT: NỀN TẢNG EVSHARE 3D TÍCH HỢP DIGITAL TWIN VÀ ENGINE QUẢN TRỊ|
+-----------------------------------------------------------------------------------+
```
*Hình 1.1. Sơ đồ bối cảnh bài toán và giải pháp nền tảng EVShare 3D.*

---

## 1.3. LÝ DO CHỌN ĐỀ TÀI

Xuất phát từ bối cảnh thực tiễn nêu trên, đề tài **"Phân tích, thiết kế và xây dựng hệ thống quản lý đồng sở hữu xe điện tích hợp không gian tương tác 3D – EVShare 3D"** được lựa chọn nghiên cứu với các lý do khoa học và thực tiễn mang tính quyết định:

1. **Tính cấp thiết và thực tế:** Đề tài trực tiếp giải quyết "nút thắt cổ chai" về mặt niềm tin và công cụ quản trị trong mô hình đồng sở hữu xe điện đô thị, thúc đẩy quá trình chuyển đổi giao thông xanh một cách bền vững.
2. **Đột phá trong phương thức tương tác người dùng (Pure 3D-First Experience):** 
   * Đa số các phần mềm quản lý vận tải hiện nay đều xây dựng dưới dạng bảng biểu 2D truyền thống (bảng danh sách, form điền liệu khô khan). Người dùng không thể cảm nhận trực quan được tình trạng vật lý của chiếc xe mà mình cùng bỏ tiền mua.
   * EVShare 3D tiên phong chuyển đổi toàn bộ trải nghiệm người dùng vào một **Virtual Garage 3D** tương tác. Người dùng có thể tự do xoay, phóng to xe, bóc tách từng chi tiết thân vỏ, kích hoạt chế độ X-Ray để "nhìn xuyên" vào từng cell pin hóa học, và đánh dấu trực tiếp các điểm hư hỏng (Damage Hotspots) ngay trên bề mặt mô hình 3D thực tế của xe.
3. **Thách thức kỹ thuật cao cấp phù hợp chuyên ngành Kỹ thuật Phần mềm:** Đề tài đòi hỏi sự kết hợp phức tạp giữa:
   * Kỹ thuật lập trình đồ họa WebGL/Three.js thời gian thực trên trình duyệt với hiệu năng cao.
   * Kiến trúc Backend doanh nghiệp mạnh mẽ với Spring Boot, xử lý các giao dịch tài chính phân bổ phức tạp, bảo toàn nguyên tắc ACID và đảm bảo tính bất biến của dữ liệu kế toán.
   * Xây dựng các giải thuật toán học chặt chẽ như thuật toán phân chia phần dư lớn nhất Hare-Niemeyer [22] và công thức bình quân gia quyền tồn kho năng lượng (WAC).

---

## 1.4. PHÁT BIỂU BÀI TOÁN

Hệ thống EVShare 3D cần giải quyết một bài toán tích hợp đa chiều:

> **Xây dựng một hệ sinh thái phần mềm quản trị tập trung, bảo đảm tính minh bạch tuyệt đối về tài chính, thời gian và hiện trạng kỹ thuật cho các nhóm đồng sở hữu xe điện, thông qua việc kết hợp chặt chẽ giữa động cơ quản lý quy trình nghiệp vụ Backend (Spring Boot + MySQL) với không gian mô phỏng Digital Twin 3D tương tác trên Web (React + Three.js).**

Hệ thống phải giải quyết trọn vẹn 5 bài toán con:
1. **Bài toán Quản lý Sở hữu:** Định danh nhóm đồng sở hữu, bảo đảm tổng tỷ lệ cổ phần của các thành viên luôn đạt chính xác $100.00\%$, hỗ trợ quy trình mời thành viên, chuyển nhượng quyền sở hữu nguyên tử và quản lý vòng đời hợp đồng điện tử.
2. **Bài toán Điều phối & Khử xung đột Lịch trình:** Cho phép thành viên đặt lịch trực quan trên trục thời gian; tự động phát hiện và chặn đứng mọi xung đột trùng lấn thời gian trước khi lưu vào CSDL; xử lý quy trình đàm phán gia hạn chuyến đi khi có người đặt liền kề.
3. **Bài toán Chu trình Bàn giao & Kiểm định Kỹ thuật:** Thiết lập quy trình 3 bên chặt chẽ: Nhân viên kiểm định bàn giao -> Chủ xe nhận xe -> Sử dụng -> Chủ xe yêu cầu trả xe -> Nhân viên kiểm tra đối soát hoàn tất. Ghi nhận vị trí hư hỏng bằng tọa độ 3D trên mô hình xe để làm căn cứ quy trách nhiệm và bảo dưỡng.
4. **Bài toán Kế toán Tồn kho Năng lượng:** Quản lý kho điện năng lưu trữ trong pin xe (kWh). Tính toán lượng điện nạp thực tế dựa trên hiệu suất sạc vật lý (tính đến tổn hao nhiệt), tính toán đơn giá điện bình quân gia quyền (WAC) liên tục theo từng phiên sạc, và tự động trừ tồn kho tương ứng với mức tiêu hao của từng chuyến đi.
5. **Bài toán Phân bổ Chi phí Trực tiếp:** Loại bỏ sự phức tạp và rủi ro của mô hình quỹ chung trung gian; chuyển dịch hoàn toàn sang mô hình phân bổ nghĩa vụ chi phí trực tiếp: tiền điện chuyến đi thuộc về người lái (USER_RESPONSIBILITY), chi phí bảo trì thường niên phân bổ theo tỷ lệ sở hữu (OWNERSHIP_RATIO), và kiểm soát quy trình xác minh thanh toán minh bạch.

---

## 1.5. MỤC TIÊU CỦA ĐỀ TÀI

### 1.5.1. Mục tiêu tổng quát
Phân tích, thiết kế và phát triển thành công nền tảng phần mềm Web tương tác 3D hoàn chỉnh mang tên EVShare 3D, đóng vai trò là giải pháp công nghệ toàn diện phục vụ công tác quản trị, vận hành và phân bổ chi phí cho mô hình xe điện đồng sở hữu.

### 1.5.2. Mục tiêu chức năng cụ thể
* **Phân hệ Quản trị hệ thống (ADMIN):** Quản lý tập trung toàn bộ danh mục xe, các nhóm đồng sở hữu, tài khoản người dùng, giám sát báo cáo phân tích hiệu suất và cấu hình hệ thống.
* **Phân hệ Điều hành trạm (STAFF):** Hỗ trợ nhân viên kỹ thuật thực hiện nghiệp vụ bàn giao xe, đối soát kiểm tra kỹ thuật lúc nhận và trả xe, lập biên bản ghi nhận hư hỏng 3D, vận hành bảo dưỡng, quản lý trụ sạc và xác minh thanh toán chi phí.
* **Phân hệ Đồng sở hữu (CO_OWNER):** Cung cấp giao diện tương tác 3D cho phép thành viên khám phá chi tiết xe, theo dõi sức khỏe pin (X-Ray), đặt lịch sử dụng, khởi hành và kết thúc chuyến đi, tham gia biểu quyết tập thể, chuyển nhượng cổ phần, ký hợp đồng điện tử và quản lý nghĩa vụ tài chính cá nhân.

### 1.5.3. Mục tiêu kỹ thuật và kiến trúc
* Xây dựng kiến trúc phân tầng chuẩn mực (Layered Architecture), bảo đảm tính tách biệt mối quan tâm (Separation of Concerns).
* Đạt chuẩn RESTful API với tài liệu đặc tả rõ ràng, xử lý lỗi tập trung qua Controller Advice và mã lỗi chuẩn hóa.
* Tối ưu hóa hiệu năng render đồ họa WebGL, duy trì tốc độ khung hình ổn định ở mức ~60 FPS trên các thiết bị máy tính tiêu chuẩn có card đồ họa tích hợp hoặc rời.
* Cơ sở dữ liệu quan hệ được chuẩn hóa ở mức 3NF, bảo đảm tính toàn vẹn tham chiếu thông qua khóa ngoại, chỉ mục tìm kiếm tối ưu và kiểm soát di chuyển cấu trúc thông qua Flyway Migrations (V1 đến V46).

### 1.5.4. Mục tiêu trải nghiệm người dùng (UX) và an toàn thông tin
* Triển khai mô hình "Pure 3D-First UI": Mọi nghiệp vụ chính diễn ra trực tiếp trong không gian 3D, kết hợp hài hòa giữa các thành phần giao diện không gian (Spatial HUD, Hologram Pins, Floating Panels) và thao tác camera mượt mà.
* Triển khai cơ chế bảo mật xác thực Token kép (Access Token ngắn hạn + Refresh Token lưu an toàn trong CSDL), phòng chống tấn công CSRF, XSS và SQL Injection.

---

## 1.6. ĐỐI TƯỢNG VÀ PHẠM VI NGHIÊN CỨU

### 1.6.1. Đối tượng nghiên cứu
* **Đối tượng nghiệp vụ:** Quy trình quản lý vòng đời phương tiện điện, mô hình hợp đồng kinh tế đồng sở hữu, quy tắc biểu quyết dân chủ, quy trình bàn giao kỹ thuật xe hơi và các phương pháp hạch toán chi phí chia sẻ.
* **Đối tượng công nghệ:** Nền tảng Spring Boot 3.3.4, hệ thống bảo mật Spring Security 6, cơ chế Object-Relational Mapping với Hibernate/JPA, thư viện kết xuất WebGL Three.js (r173), khung làm việc React Three Fiber, hệ quản trị MySQL 8.0 và các định dạng tài nguyên đồ họa 3D (GLTF/GLB).

### 1.6.2. Phạm vi hệ thống và ranh giới hiện thực hóa
* **Về mặt thiết bị và nền tảng:** Ứng dụng chạy trên nền tảng trình duyệt Web hiện đại (Google Chrome, Microsoft Edge, Mozilla Firefox) hỗ trợ WebGL 2.0 trên các thiết bị máy tính để bàn (Desktop) và máy tính xách tay (Laptop).
* **Phạm vi tác nhân:** Hệ thống tập trung phục vụ 3 nhóm tác nhân chính:
  1. Quản trị viên (ADMIN).
  2. Nhân viên điều hành kỹ thuật (STAFF).
  3. Thành viên chủ đồng sở hữu (CO_OWNER).
* **Ranh giới tính năng DEMO (Giới hạn thực tiễn):**
  * *Thanh toán (Financial Mode):* Trong phạm vi đề tài, hệ thống hiện thực hóa quy trình thanh toán cá nhân ở chế độ **DEMO Mode** (`app.financial-mode: DEMO`). Cơ chế này mô phỏng đầy đủ luồng sinh mã đối soát chuyển khoản, gửi ảnh bằng chứng và nhân viên duyệt xác nhận mà không thực hiện kết nối trực tiếp đến cổng thanh toán ngân hàng thương mại thật (VNPay, Napas).
  * *Ký kết hợp đồng điện tử:* Chức năng ký hợp đồng sử dụng cơ chế ký số mô phỏng (Demo Digital Signature) lưu trữ vết chấp thuận và hash dữ liệu trong CSDL, chưa tích hợp chứng thư số công cộng PKI được cấp phép bởi Bộ Thông tin và Truyền thông.
  * *Thông số sạc pin và xe điện:* Các thông số mức pin (SOC), chỉ số lăn bánh (ODO) và tiến trình nạp sạc được tính toán dựa trên các mô hình toán học vật lý lập trình sẵn tại tầng Service của Backend, chưa đấu nối trực tiếp với phần cứng mạch đo vi điều khiển IoT (OBD-II Telemetry) trên xe thật.

---

## 1.7. PHƯƠNG PHÁP THỰC HIỆN

Đề tài áp dụng phương pháp luận phát triển phần mềm lặp và tăng trưởng (Iterative and Incremental Software Engineering Methodology), kết hợp các kỹ thuật phân tích thiết kế hướng đối tượng (OOAD) và chuẩn mô hình hóa UML 2.5.1 [1].

Quy trình thực hiện bao gồm 6 giai đoạn liên hoàn:
1. **Khảo sát và Phân tích Nghiệp vụ:** Thu thập các yêu cầu thực tiễn về đồng sở hữu xe điện; mô hình hóa các dòng chảy nghiệp vụ dưới dạng sơ đồ hoạt động (Activity Diagrams) và ma trận phân quyền.
2. **Thiết kế Kiến trúc và Cơ sở Dữ liệu:** Xây dựng mô hình thực thể quan hệ (ERD), thiết kế chi tiết từ điển dữ liệu; xác lập kiến trúc phân tầng Backend và cấu trúc cây phân cấp component Frontend.
3. **Hiện thực hóa Mã nguồn (Implementation):**
   * Xây dựng Backend: Tạo các Entity JPA, cấu hình các Migration Flyway từ V1 đến V46, hiện thực hóa các Repository, Service tính toán và các REST Controller.
   * Xây dựng Frontend & 3D: Nạp mô hình xe 3D GLB, thiết lập ánh sáng, bục xoay, camera OrbitControls, thiết kế các Panel giao diện không gian đồng bộ trạng thái qua Zustand Store.
4. **Tích hợp và Khử xung đột:** Kết nối giao tiếp bất đồng bộ qua Axios/TanStack Query; xử lý triệt để các tình huống xung đột lịch đặt xe, kiểm soát tính toán giá bình quân gia quyền không để xảy ra chia cho 0.
5. **Kiểm thử và Đánh giá:** Thiết kế danh mục ca kiểm thử toàn diện (Unit Test, Integration Test, Functional Test), rà soát bảo mật OWASP Top 10 [4] và lập kế hoạch đo lường chỉ số hiệu năng Web Vitals [5].
6. **Tổng kết và Viết báo cáo:** Tổng hợp tài liệu kỹ thuật, sơ đồ UML chuẩn hóa, đối chiếu các đóng góp thực tế và hoàn thiện báo cáo tốt nghiệp.

---

## 1.8. KẾ HOẠCH THỰC TẬP VÀ LỘ TRÌNH PHÁT TRIỂN (ROADMAP)

Dự án EVShare 3D được xây dựng qua lộ trình 5 giai đoạn chiến lược rõ ràng:

* **Giai đoạn 1 (Phase 1): Thiết lập Nền tảng Hạ tầng & Kiến trúc Tài chính Lõi**
  * Thiết lập môi trường Java 21, Spring Boot 3.3.4, React 18, Vite và MySQL 8.
  * Xây dựng hệ thống bảng CSDL lõi qua Flyway (V1 - V15).
  * Chuyển đổi mô hình tài chính từ Quỹ chung (Shared Fund) sang mô hình Phân bổ Chi phí Trực tiếp (Direct Expense Allocation) và hạch toán tồn kho năng lượng (V22 - V27).
* **Giai đoạn 2 (Phase 2): Hoàn thiện Quy trình Nghiệp vụ Vận hành Xe**
  * Xây dựng phân hệ Đặt xe (Booking) kèm thuật toán phát hiện và chặn đứng xung đột thời gian.
  * Hoàn thiện chu trình Bàn giao (Handover) và Trả xe (Return Verification) liên kết biên bản kiểm tra kỹ thuật (V28 - V30).
  * Hiện thực hóa quản lý trạm sạc điện, trụ sạc thông minh và tính toán vật lý tổn hao nạp sạc.
* **Giai đoạn 3 (Phase 3): Quản trị Nhóm, Pháp lý & Bảo đảm An toàn Dữ liệu**
  * Hiện thực hóa phân hệ Biểu quyết tập thể (Voting - V33), Hợp đồng điện tử (Contracts - V34), và Chuyển nhượng quyền sở hữu (Transfers - V35).
  * Xây dựng phân hệ Tranh chấp & Hòa giải (Dispute Management - V43, V44).
  * Thiết lập hệ thống ghi vết nhật ký kiểm toán (Audit Logs - V46) và trung tâm thông báo thời gian thực.
* **Giai đoạn 4 (Phase 4): Tối ưu hóa Trải nghiệm Không gian 3D & Hiệu Năng**
  * Tinh chỉnh không gian Virtual Garage 3D, ánh sáng phản xạ, bóng đổ mềm và các bục xoay phương tiện.
  * Hoàn thiện các chế độ bóc tách xe 3D, X-Ray nhìn xuyên cụm pin và gắn điểm Hotspot hư hỏng trực quan.
  * Tối ưu hóa bộ nhớ WebGL, dọn dẹp Geometry/Material khi tháo gỡ component để triệt tiêu hiện tượng rò rỉ bộ nhớ (Memory Leak).
* **Giai đoạn 5 (Phase 5): Kiểm thử Toàn diện, Ổn định và Bàn giao Hệ thống**
  * Rà soát tính toàn vẹn nghiệp vụ (Invariant Check), kiểm thử các kịch bản biên (Edge cases).
  * Biên soạn danh mục ca kiểm thử, hướng dẫn xuất tài liệu và bàn giao sản phẩm.

*Bảng 1.1 dưới đây biểu diễn kế hoạch thực tập tổng thể theo tiến trình các tuần làm việc đề xuất.*

*Bảng 1.1. Kế hoạch và tiến độ thực tập đề xuất (Proposed Internship Gantt Schedule).*

| Tuần | Nội Dung Công Việc Chính | Sản Phẩm Đầu Ra Dự Kiến | Trạng Thái Hoàn Thành |
| :---: | :--- | :--- | :---: |
| **Tuần 1 - 2** | Khảo sát đơn vị thực tập, tiếp nhận bài toán nghiệp vụ, lập kế hoạch thực tập | Đề cương chi tiết đề tài, biên bản khảo sát yêu cầu | Đã hoàn thành |
| **Tuần 3 - 4** | Thiết kế kiến trúc tổng thể, mô hình hóa thực thể CSDL, cấu hình hạ tầng | Bộ sơ đồ ERD, các tệp Migration Flyway V1-V15 | Đã hoàn thành |
| **Tuần 5 - 6** | Hiện thực hóa Backend API lõi: Auth, Security JWT, Quản trị xe và Đồng sở hữu | Module xác thực, phân quyền RBAC, API Quản lý xe | Đã hoàn thành |
| **Tuần 7 - 8** | Xây dựng động cơ Đặt lịch, Khử xung đột và Chu trình Bàn giao - Chuyến đi | Module Booking, Handover, Trip Service hoàn chỉnh | Đã hoàn thành |
| **Tuần 9 - 10** | Hiện thực hóa Quản trị tồn kho năng lượng (WAC) và Động cơ phân bổ chi phí | Module Energy Inventory, Expense Share Allocation | Đã hoàn thành |
| **Tuần 11 - 12** | Xây dựng không gian Virtual Garage 3D trên WebGL (Three.js & R3F) | Cảnh 3D Garage, Model Digital Twin, X-Ray Pin | Đã hoàn thành |
| **Tuần 13 - 14** | Tích hợp giao diện không gian (Spatial HUD), Bóc tách hư hỏng 3D Hotspot | Giao diện điều hành hoàn chỉnh cho Admin, Staff, Co-Owner | Đã hoàn thành |
| **Tuần 15 - 16** | Hoàn thiện Biểu quyết, Hợp đồng, Tranh chấp; Kiểm thử hệ thống và viết Báo cáo | 100 Ca kiểm thử, Bộ tài liệu báo cáo tốt nghiệp hoàn chỉnh | Đã hoàn thành |

---

## 1.9. ĐÓNG GÓP CỦA SINH VIÊN

Thông qua việc khảo cứu và trực tiếp phát triển hệ thống EVShare 3D, sinh viên đã hoàn thành các đóng góp cụ thể được minh chứng trực tiếp bằng mã nguồn dự án:

1. **Về mặt phân tích và thiết kế:**
   * Chuẩn hóa thành công mô hình dữ liệu quan hệ gồm 46 bảng thực thể, xử lý triệt để các bài toán quan hệ nhiều-nhiều phức tạp giữa thành viên, xe, lịch đặt, chuyến đi, tồn kho năng lượng và phân bổ chi phí.
   * Xây dựng bộ hồ sơ thiết kế UML chuẩn mực gồm 10 loại sơ đồ chuyên sâu (Kiến trúc, Use Case, Lớp, Tuần tự, Hoạt động, Máy trạng thái, Thực thể liên kết, Thành phần, Gói và Triển khai).
2. **Về mặt hiện thực hóa Backend:**
   * Xây dựng 27 REST Controller, 25 Service chuyên trách và hơn 60 Repository JPA đáp ứng trọn vẹn nghiệp vụ cho 3 nhóm đối tượng người dùng.
   * Hiện thực hóa thành công **Động cơ Quản trị Tồn kho Năng lượng (VehicleEnergyInventoryService)** áp dụng chuẩn xác công thức giá bình quân gia quyền và bảo toàn tính bất biến không trừ lặp.
   * Hiện thực hóa **Động cơ Phân bổ Chi phí (ExpenseShareService)** tích hợp thuật toán phân chia phần dư lớn nhất Hare-Niemeyer, bảo đảm tổng số tiền phân bổ luôn khớp chính xác tuyệt đối với hóa đơn chi phí đến từng đồng lẻ.
3. **Về mặt hiện thực hóa Frontend & Đồ họa 3D:**
   * Xây dựng thành công ứng dụng Single Page Application tương tác 3D thuần nhất (Pure 3D-First) với React 18 và Three.js r173, tích hợp chuyển động mượt mà của hệ thống Camera điều hướng theo từng bục xe.
   * Hiện thực hóa tính năng số hóa trực quan (Digital Twin): chuyển đổi vật liệu xe theo mã màu thực tế trong CSDL, hiệu ứng X-Ray hiển thị tình trạng pin, và hệ thống gắn nhãn cảnh báo hư hại (Damage Hotspot) trực tiếp trên bề mặt lưới đa giác của xe.
4. **Về mặt kiểm thử và tài liệu hóa:**
   * Thiết kế 100 ca kiểm thử bao phủ toàn bộ các luồng chức năng, an toàn bảo mật và toàn vẹn dữ liệu.
   * Soạn thảo bộ báo cáo thực tập tốt nghiệp đầy đủ, mạch lạc theo đúng quy chuẩn học thuật của Nhà trường.

---

## 1.10. BỐ CỤC CỦA BÁO CÁO

Báo cáo thực tập tốt nghiệp được bố cục thành 7 chương chính và hệ thống các phụ lục kỹ thuật đi kèm:

* **CHƯƠNG 1: TỔNG QUAN VỀ ĐỀ TÀI VÀ ĐƠN VỊ THỰC TẬP:** Giới thiệu đơn vị thực tập, bối cảnh bài toán, lý do chọn đề tài, mục tiêu, phạm vi nghiên cứu, kế hoạch thực hiện và bố cục tài liệu.
* **CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ ÁP DỤNG:** Trình bày chuyên sâu cơ sở lý thuyết về ứng dụng Web, các công nghệ Frontend (React, TypeScript, Three.js, R3F), Backend (Java, Spring Boot, Security, JPA), CSDL MySQL, lý thuyết quản trị pin xe điện và các mẫu thiết kế phần mềm.
* **CHƯƠNG 3: KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU HỆ THỐNG:** Khảo sát nghiệp vụ chi tiết, xác định tác nhân, ma trận phân quyền, đặc tả danh mục yêu cầu chức năng (FR), yêu cầu phi chức năng (NFR), các quy tắc nghiệp vụ (BR) và hệ thống sơ đồ Use Case, Activity.
* **CHƯƠNG 4: PHÂN TÍCH VÀ THIẾT KẾ HỆ THỐNG:** Thiết kế chi tiết kiến trúc tổng thể, kiến trúc Frontend/Backend, thiết kế cơ sở dữ liệu (ERD), từ điển dữ liệu, sơ đồ lớp miền (Class Diagrams), sơ đồ tuần tự (Sequence Diagrams), sơ đồ trạng thái, danh mục API RESTful và thiết kế bảo mật.
* **CHƯƠNG 5: XÂY DỰNG VÀ TRIỂN KHAI HỆ THỐNG:** Trình bày chi tiết quá trình hiện thực hóa các phân hệ chức năng từ mã nguồn thực tế (Admin, Staff, Co-Owner, Booking, Handover, Damage 3D, Charging, Energy Inventory, Finance, Contracts, Voting, Dispute), phân tích các thách thức kỹ thuật và giải pháp giải quyết.
* **CHƯƠNG 6: KIỂM THỬ VÀ ĐÁNH GIÁ HỆ THỐNG:** Trình bày mục tiêu, chiến lược kiểm thử, danh mục các ca kiểm thử chi tiết trên các phân hệ, kiểm thử an toàn bảo mật, kế hoạch đo lường hiệu năng và đánh giá tổng thể hệ thống.
* **CHƯƠNG 7: KẾT LUẬN VÀ HƯỚNG PHÁT TRIỂN:** Tổng kết các kết quả đạt được, đánh giá mức độ đáp ứng mục tiêu, phân tích ưu điểm và các hạn chế kỹ thuật hiện tại, đúc kết bài học kinh nghiệm và vạch ra lộ trình phát triển trong tương lai.
* **PHẦN PHỤ LỤC & TÀI LIỆU THAM KHẢO:** Cung cấp đầy đủ danh mục API, từ điển dữ liệu, đặc tả Use Case, Test Case, trích đoạn mã nguồn lõi, hướng dẫn cài đặt và danh mục tài liệu tham khảo theo chuẩn IEEE.

---

### TÓM TẮT CHƯƠNG 1
Chương 1 đã phác họa bức tranh toàn cảnh về đề tài nghiên cứu và đơn vị thực tập. Bài toán quản trị đồng sở hữu xe điện được định vị là một vấn đề cấp thiết của đô thị thông minh trong thời đại chuyển đổi số và chuyển dịch năng lượng xanh. Để vượt qua các rào cản về niềm tin, xung đột lịch trình và tranh chấp chi phí, dự án EVShare 3D đã được xác lập với mục tiêu xây dựng một nền tảng quản trị tích hợp không gian Web 3D trực quan, ứng dụng các công nghệ kỹ thuật phần mềm tiên tiến nhất trên nền tảng Spring Boot và Three.js. Các chương tiếp theo sẽ đi sâu phân tích cơ sở lý thuyết, kiến trúc kỹ thuật và kết quả hiện thực hóa chi tiết của hệ thống.
