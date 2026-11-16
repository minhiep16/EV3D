# CHƯƠNG 2: CƠ SỞ LÝ THUYẾT VÀ CÔNG NGHỆ ÁP DỤNG

---

## 2.1. TỔNG QUAN ỨNG DỤNG WEB VÀ KIẾN TRÚC CLIENT-SERVER

### 2.1.1. Kiến trúc Client-Server hiện đại
Mô hình Khách - Chủ (Client-Server Architecture) là nền tảng cốt lõi của các hệ thống phần mềm phân tán hiện đại. Trong mô hình này, hệ thống được phân định rõ ràng thành hai thực thể độc lập về mặt chức năng và môi trường thực thi:
1. **Phía Khách (Client Tier):** Đảm nhiệm vai trò giao diện tương tác người dùng, xử lý các thao tác đồ họa, lắng nghe sự kiện đầu vào (chuột, bàn phím) và hiển thị dữ liệu kết quả. Trong EVShare 3D, Client là một ứng dụng Web chạy trực tiếp trong môi trường sandbox của trình duyệt (Browser Sandbox), tận dụng tài nguyên GPU cục bộ để xử lý đồ họa WebGL 3D.
2. **Phía Chủ (Server Tier):** Đảm nhiệm vai trò trung tâm tính toán, thực thi các nghiệp vụ kiểm soát logic phức tạp, xác thực ủy quyền bảo mật, điều phối giao dịch và duy trì tính toàn vẹn của dữ liệu lưu trữ dài hạn trong hệ quản trị cơ sở dữ liệu.

Giao tiếp giữa Client và Server được thực hiện qua giao thức truyền tải siêu văn bản an toàn (HTTPS) theo phương thức phi trạng thái (Stateless Communication).

```
+-----------------------------------------------------------------------------------+
|               SƠ ĐỒ GIAO TIẾP KIẾN TRÚC CLIENT-SERVER & REST API                  |
+-----------------------------------------------------------------------------------+

     [CLIENT TIER: TRÌNH DUYỆT WEB]               [SERVER TIER: SPRING BOOT]
  +-----------------------------------+        +-----------------------------------+
  |  React 18 SPA + Three.js 3D Canvas|        |   Spring Security Filter (JWT)    |
  |  - Spatial UI / 3D Holograms      |        +-----------------------------------+
  |  - Zustand Store (State)          |                          |
  |  - TanStack Query (Data Fetch)    |                          v
  +-----------------------------------+        +-----------------------------------+
                   |                           |    REST Controllers (Endpoints)   |
                   | HTTP Request (JSON)       +-----------------------------------+
                   | [Authorization: Bearer]                     |
                   |-------------------------->                  v
                   |                           +-----------------------------------+
                   |                           |  Service Layer (Business Logic)   |
                   |                           |  - Energy Inventory Engine (WAC)  |
                   |                           |  - Expense Allocation Engine      |
                   |                           +-----------------------------------+
                   |                                             |
                   | HTTP Response (JSON Payload)                v
                   | <Data DTO / Error Details>+-----------------------------------+
                   |<--------------------------|   Spring Data JPA Repositories    |
                                               +-----------------------------------+
                                                                 |
                                                                 v
                                               +-----------------------------------+
                                               |     MySQL Database (InnoDB ACID)  |
                                               +-----------------------------------+
```
*Hình 2.1. Sơ đồ giao tiếp và chu trình xử lý yêu cầu REST API giữa Client và Server.*

### 2.1.2. Ứng dụng đơn trang (Single Page Application - SPA)
EVShare 3D được phát triển theo mô hình Single Page Application (SPA). Khác với các trang web truyền thống nhiều trang (Multi-Page Applications - MPA) vốn phải nạp lại toàn bộ cấu trúc HTML từ máy chủ mỗi khi người dùng chuyển trang hoặc gửi biểu mẫu (gây ra hiện tượng giật màn hình và phá vỡ ngữ cảnh 3D WebGL), SPA chỉ tải một tệp HTML khung duy nhất (`index.html`) kèm theo các gói mã lệnh JavaScript/CSS trong lần truy cập đầu tiên. 

Mọi điều hướng sau đó đều được quản lý tại phía máy khách thông qua bộ định tuyến ảo (Client-side Routing - React Router DOM v7). Khi dữ liệu thay đổi, ứng dụng chỉ gửi các yêu cầu bất đồng bộ (AJAX/Fetch) để lấy dữ liệu thô (JSON), sau đó cập nhật cục bộ vùng giao diện tương ứng mà không làm gián đoạn ngữ cảnh kết xuất đồ họa của WebGL Canvas. Đây là điều kiện tiên quyết giúp trải nghiệm không gian Virtual Garage 3D luôn mượt mà và liền mạch.

### 2.1.3. Phong cách kiến trúc RESTful API
Hệ thống Backend của EVShare 3D tuân thủ nghiêm ngặt phong cách kiến trúc REST (Representational State Transfer) do Roy Fielding đề xuất [17]. Các nguyên tắc REST được áp dụng bao gồm:
* **Định danh tài nguyên rõ ràng:** Mọi thực thể nghiệp vụ (xe, lịch đặt, chuyến đi, khoản chi, hợp đồng) đều được coi là một tài nguyên (Resource) và được định danh duy nhất bằng một đường dẫn định danh URI chuẩn hóa (ví dụ: `/api/vehicles/{id}`, `/api/bookings/{bookingId}`).
* **Sử dụng đúng phương thức HTTP (HTTP Verbs):**
  * `GET`: Đọc và truy vấn thông tin tài nguyên (đảm bảo tính an toàn - Safe và không làm thay đổi trạng thái hệ thống).
  * `POST`: Tạo mới một tài nguyên (ví dụ: tạo lịch đặt, bắt đầu phiên sạc, tạo yêu cầu chuyển nhượng).
  * `PUT` / `PATCH`: Cập nhật toàn bộ hoặc một phần trạng thái tài nguyên.
  * `DELETE`: Thu hồi hoặc xóa mềm tài nguyên.
* **Biểu diễn dữ liệu bằng JSON:** Toàn bộ dữ liệu gửi lên (Request Body) và phản hồi về (Response Body) đều sử dụng định dạng JSON (JavaScript Object Notation) nhẹ, chuẩn hóa, độc lập với ngôn ngữ lập trình.
* **Mã trạng thái HTTP chuẩn mực:** Sử dụng đúng mã HTTP Status Code để phản ánh kết quả xử lý (`200 OK`, `201 Created`, `400 Bad Request`, `401 Unauthorized`, `403 Forbidden`, `404 Not Found`, `409 Conflict`).

---

## 2.2. NỀN TẢNG REACT 18 VÀ KIẾN TRÚC COMPONENT

### 2.2.1. Khái niệm và nguyên lý hoạt động của React
React là thư viện mã nguồn mở hàng đầu thế giới do Meta phát triển nhằm xây dựng giao diện người dùng dựa trên các thành phần (Component-Based UI) [12]. Điểm cốt lõi của React là mô hình lập trình khai báo (Declarative Programming): lập trình viên chỉ cần mô tả giao diện tương ứng với từng trạng thái dữ liệu (State), React sẽ tự động đồng bộ hóa và kết xuất DOM thật một cách tối ưu.

### 2.2.2. Cây cấu trúc Component và luồng dữ liệu đơn hướng
Ứng dụng React trong EVShare 3D được phân rã thành một cây phân cấp các thành phần tái sử dụng (Component Tree). Luồng dữ liệu trong React tuân thủ nguyên tắc một chiều (Unidirectional Data Flow): dữ liệu được truyền từ các component cha xuống component con thông qua thuộc tính (**Props**). Khi cần cập nhật dữ liệu, component con sẽ kích hoạt các hàm phản hồi (Callback Functions) do cha cung cấp.

### 2.2.3. Trạng thái nội tại (State) và React Hooks
Kể từ phiên bản React 16.8, các React Hook đã trở thành phương thức chủ đạo để quản lý trạng thái và vòng đời trong các Functional Component:
* `useState`: Quản lý trạng thái cục bộ của giao diện (ví dụ: cờ đóng/mở panel, giá trị đang gõ trong ô tìm kiếm).
* `useEffect`: Xử lý các hiệu ứng phụ (Side Effects) như lắng nghe sự kiện cửa sổ trình duyệt thay đổi kích thước, thiết lập bộ lắng nghe bàn phím điều khiển xe hoặc đồng bộ trạng thái khi component được gắn kết (Mount) và tháo gỡ (Unmount).
* `useMemo` và `useCallback`: Tối ưu hóa hiệu năng bằng cách ghi nhớ giá trị tính toán và tham chiếu hàm giữa các lần re-render, hạn chế tối đa việc kích hoạt kết xuất lại các component con nặng tính toán trong không gian 3D.
* `useRef`: Giữ tham chiếu trực tiếp đến các đối tượng không kích hoạt render lại, đặc biệt hữu ích khi thao tác với đối tượng Mesh 3D của Three.js, Camera hoặc các bộ điều khiển hiệu ứng chuyển động.

### 2.2.4. Ứng dụng React trong EVShare 3D
Trong dự án EVShare 3D, React đóng vai trò "nhạc trưởng" điều phối:
* Tách biệt các vùng giao diện người dùng chuyên biệt: `AdminCommandCenterPanels`, `StaffGarageFleetSidebar`, `CoOwnerBookingPanel`, `FinanceZonePanel`.
* Đóng gói an toàn các ngoại lệ giao diện thông qua `GarageErrorBoundary` và `PanelErrorBoundary`, ngăn ngừa việc một lỗi hiển thị làm sập toàn bộ Canvas WebGL.
* Kết hợp với **Zustand** làm kho lưu trữ trạng thái toàn cục siêu nhẹ (`authStore`, `worldStore`) quản lý trạng thái đăng nhập, xe đang chọn, góc quay camera hiện thời và chế độ hiển thị (X-Ray, Bóc tách phụ tùng, Hotspot hư hỏng).
* Kết hợp với **TanStack Query** (React Query v5) nhằm quản lý việc gọi API từ xa, tự động lưu bộ nhớ đệm (Cache), tự động làm mới dữ liệu và xử lý các trạng thái nạp dữ liệu (`isLoading`, `isError`).

---

## 2.3. NGÔN NGỮ TYPESCRIPT VÀ TÍNH AN TOÀN TĨNH

### 2.3.1. Khái niệm và nguyên lý hoạt động
TypeScript là ngôn ngữ mã nguồn mở do Microsoft phát triển, là một tập cha có định kiểu tĩnh của JavaScript (Typed Superset of JavaScript) [13]. Mã nguồn TypeScript sẽ được trình biên dịch (`tsc`) chuyển đổi về mã JavaScript thuần để trình duyệt có thể thực thi.

### 2.3.2. Lợi ích kỹ thuật trong EVShare 3D
Việc ứng dụng TypeScript 5.7 trong dự án mang lại các giá trị kỹ thuật cốt lõi:
1. **Kiểm soát kiểu chặt chẽ (Static Type Safety):** Loại bỏ hoàn toàn nhóm lỗi phổ biến trong JavaScript truyền thống như `TypeError: Cannot read properties of undefined`.
2. **Khớp nối DTO đồng nhất giữa Frontend và Backend:** Toàn bộ các cấu trúc dữ liệu trả về từ Spring Boot DTO (như `VehicleResponse`, `BookingResponse`, `ExpenseShareResponse`, `TripEnergyCostResult`) đều được định nghĩa tương ứng chính xác thành các `interface` và `type` TypeScript tại thư mục `src/types/`. Mọi sự thay đổi về tên trường hoặc kiểu dữ liệu ở backend sẽ được cảnh báo ngay ở giai đoạn biên dịch frontend.
3. **Tự động gợi ý mã lệnh (IntelliSense) và hỗ trợ tái cấu trúc:** Hỗ trợ đắc lực cho lập trình viên khi làm việc với các thư viện đồ họa có cấu trúc thuộc tính phức tạp như Three.js và React Three Fiber (ví dụ: các thuộc tính hình học `position={[x, y, z]}`, góc xoay `rotation`, màu sắc `color`).

---

## 2.4. CÔNG CỤ ĐÓNG GÓI VITE

Vite là công cụ phát triển và đóng gói ứng dụng web thế hệ mới do Evan You phát triển [14]. So với các công cụ đóng gói truyền thống như Webpack (vốn phải phân tích và đóng gói toàn bộ cây phụ thuộc đồ sộ trước khi khởi chạy máy chủ phát triển), Vite tạo nên bước đột phá nhờ hai cơ chế:
1. **Tận dụng Native ES Modules (ESM) trên trình duyệt:** Trong môi trường phát triển (Development Mode), Vite không đóng gói trước mà phân phát trực tiếp các module mã nguồn khi trình duyệt yêu cầu, sử dụng `esbuild` viết bằng Go để tiền đóng gói các thư viện ngoài với tốc độ nhanh gấp 10-100 lần công cụ dựa trên JavaScript.
2. **Hot Module Replacement (HMR) tức thời:** Khi lập trình viên sửa một component giao diện hoặc điều chỉnh tọa độ ánh sáng trong scene 3D, Vite chỉ biên dịch lại duy nhất file đó và cập nhật nóng ngay trên trình duyệt mà không cần tải lại toàn bộ trang, giữ nguyên góc nhìn camera và trạng thái đang tương tác của xe.
3. **Đóng gói sản phẩm tối ưu (Production Build):** Khi xuất bản, Vite sử dụng Rollup để phân tách mã (Code Splitting), loại bỏ mã chết (Tree-shaking) và nén mã lệnh tối ưu, cho phép chia tách các panel nghiệp vụ nặng (`StaffVehicleDetailPanel`, `CoOwnerBookingPanel`) thành các đoạn mã nạp lười (`React.lazy`).

---

## 2.5. NỀN TẢNG JAVA 21 VÀ SPRING BOOT 3.3.4

### 2.5.1. Nền tảng Java 21 LTS
Hệ thống Backend của EVShare 3D được xây dựng trên nền tảng Java 21 – phiên bản hỗ trợ dài hạn (Long-Term Support - LTS) hiện đại nhất của hệ sinh thái Java [7]. Java 21 mang lại hiệu năng tối ưu của máy ảo HotSpot JVM cùng các tính năng ngôn ngữ tiên tiến như:
* **Record Types:** Cho phép định nghĩa các đối tượng truyền tải dữ liệu DTO bất biến một cách ngắn gọn, tự động sinh các phương thức `equals()`, `hashCode()`, và `toString()`.
* **Pattern Matching for switch:** Giúp xử lý các biểu thức kiểm tra kiểu và logic phân nhánh theo Enum trạng thái một cách trực quan, an toàn.
* **Sequenced Collections:** Cung cấp giao diện chuẩn mực để thao tác với các phần tử đầu và cuối của tập hợp dữ liệu được sắp thứ tự.

### 2.5.2. Khung ứng dụng Spring Boot 3.3.4
Spring Boot là framework hàng đầu thế giới trong việc phát triển các ứng dụng cấp doanh nghiệp trên nền tảng Spring Framework [8]. Triết lý của Spring Boot là "Convention over Configuration" (Quy ước hơn cấu hình), tự động cấu hình các thành phần dựa trên các thư viện khởi đầu (Starters) có trong `pom.xml`.

Các nguyên lý thiết kế cốt lõi của Spring Boot được hiện thực hóa trong dự án bao gồm:
* **Đảo ngược điều khiển (Inversion of Control - IoC) và Tiêm phụ thuộc (Dependency Injection - DI):** Quản lý toàn bộ vòng đời của các đối tượng (Spring Beans). Các Service và Controller không tự khởi tạo phụ thuộc mà được Spring Container tiêm vào thông qua Constructor Injection, giúp mã nguồn có độ kết dính lỏng lẻo (Loose Coupling) và dễ dàng viết các ca kiểm thử đơn vị độc lập.
* **Kiến trúc phân tầng chuẩn mực (Layered Architecture):**
  * *Tầng Điều Khiển (Controller Layer):* Tiếp nhận HTTP Request, xác thực cú pháp dữ liệu thông qua Jakarta Validation (`@Valid`, `@NotNull`), gọi tầng Service và chuyển đổi kết quả trả về mã phản hồi HTTP chuẩn.
  * *Tầng Nghiệp Vụ (Service Layer):* Chứa đựng toàn bộ logic nghiệp vụ cốt lõi, kiểm tra ràng buộc điều kiện (Business Rules), điều phối giao dịch và gọi các động cơ tính toán.
  * *Tầng Truy Cập Dữ Liệu (Repository Layer):* Kế thừa `JpaRepository` của Spring Data JPA để thực hiện các thao tác đọc ghi cơ sở dữ liệu.

```
+-----------------------------------------------------------------------------------+
|               KIẾN TRÚC PHÂN TẦNG BACKEND SPRING BOOT (LAYERED ARCHITECTURE)      |
+-----------------------------------------------------------------------------------+

                          [CLIENT REQUEST VIA HTTPS / REST]
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 1. TẦNG BẢO MẬT & BỘ LỌC (SECURITY & FILTER LAYER)                                |
|    - JwtAuthenticationFilter: Trích xuất và xác thực Token JWT                     |
|    - SecurityContextHolder: Thiết lập UserPrincipal & Quyền RBAC                   |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 2. TẦNG ĐIỀU KHIỂN (CONTROLLER LAYER - 27 CONTROLLERS)                            |
|    - AuthController, BookingController, TripController, ExpenseController...      |
|    - Xác thực DTO đầu vào (@Valid), Ánh xạ đường dẫn REST (@RequestMapping)       |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 3. TẦNG DỊCH VỤ NGHIỆP VỤ (SERVICE LAYER - 25+ DOMAIN SERVICES)                   |
|    - BookingService: Thuật toán kiểm tra & ngăn ngừa xung đột lịch đặt xe         |
|    - VehicleEnergyInventoryService: Tính giá bình quân gia quyền (WAC)            |
|    - ExpenseShareService: Thuật toán phần dư Hare-Niemeyer phân bổ chi phí        |
|    - Quản lý giao dịch nguyên tử (@Transactional)                                 |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 4. TẦNG TRUY CẬP DỮ LIỆU (REPOSITORY LAYER - SPRING DATA JPA)                     |
|    - UserRepository, VehicleRepository, BookingRepository, TripRepository...      |
|    - Derived Query Methods, Native Queries, Khóa lạc quan (@Version)              |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
| 5. TẦNG CƠ SỞ DỮ LIỆU QUAN HỆ (PERSISTENCE LAYER - MYSQL 8.0)                     |
|    - 46 Bảng thực thể, Khóa chính, Khóa ngoại, Chỉ mục tối ưu, ACID Engine       |
+-----------------------------------------------------------------------------------+
```
*Hình 2.2. Sơ đồ kiến trúc phân tầng chuẩn mực của hệ thống Backend Spring Boot.*

---

## 2.6. SPRING SECURITY 6 VÀ XÁC THỰC BẰNG JSON WEB TOKEN (JWT)

### 2.6.1. Kiến trúc chuỗi bộ lọc bảo mật (Security Filter Chain)
Spring Security 6 áp dụng mô hình cấu hình hướng hàm (Functional Configuration) thông qua `SecurityFilterChain` bean thay thế hoàn toàn cho các lớp cấu hình kế thừa trước đây [9]. Hệ thống thiết lập chế độ quản lý phiên phi trạng thái:
```java
http.sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS));
```
Máy chủ không lưu giữ bất kỳ phiên làm việc (Session) nào trong bộ nhớ RAM, bảo đảm khả năng mở rộng quy mô tải ngang (Horizontal Scalability) dễ dàng.

### 2.6.2. Cơ chế xác thực Token kép (Access Token & Refresh Token)
Để bảo đảm an toàn thông tin theo chuẩn IETF RFC 7519 [6], hệ thống áp dụng cơ chế xác thực kép:
1. **Access Token (JWT):** Được ký số bằng thuật toán mã hóa đối xứng HMAC-SHA256 (`Keys.hmacShaKeyFor`) với khóa bí mật nội bộ. Token chứa các thông tin tự mô tả (Claims): `userId`, `email`, `role`, thời điểm phát hành (`iat`) và thời điểm hết hạn (`exp`). Access Token có thời gian sống ngắn (từ 15 đến 60 phút). Client gửi kèm Token này trong tiêu đề HTTP `Authorization: Bearer <token>` của mỗi yêu cầu.
2. **Refresh Token:** Là một chuỗi định danh ngẫu nhiên UUID được lưu trữ an toàn trong bảng `refresh_tokens` của CSDL MySQL, có thời hạn dài hơn (từ 7 đến 30 ngày). Khi Access Token hết hạn, Client gọi endpoint `/api/auth/refresh` kèm Refresh Token để xin cấp Access Token mới mà không bắt người dùng phải đăng nhập lại. Nếu tài khoản bị phát hiện có dấu hiệu bất thường, Quản trị viên có thể thu hồi (Revoke) Refresh Token trong CSDL để lập tức vô hiệu hóa phiên làm việc của người dùng đó.

### 2.6.3. Kiểm soát truy cập dựa trên vai trò (Role-Based Access Control - RBAC)
Hệ thống định nghĩa 3 vai trò người dùng chuẩn mực trong hệ thống thông qua Enum `Role`:
* `ADMIN`: Toàn quyền quản trị hệ thống, quản lý người dùng, nhóm đồng sở hữu và kiểm tra các cấu hình nhạy cảm.
* `STAFF`: Nhân viên vận hành trạm, có thẩm quyền thực hiện bàn giao xe, kiểm tra kỹ thuật (Checklist), tạo bản ghi hư hại, vận hành trạm sạc và xác minh chứng từ thanh toán.
* `CO_OWNER`: Thành viên sở hữu phương tiện, có quyền đặt lịch, xem sức khỏe xe trong Garage 3D, khởi hành chuyến đi, thanh toán chi phí và tham gia biểu quyết.

---

## 2.7. SPRING DATA JPA VÀ HIBERNATE ORM

### 2.7.1. Công nghệ Ánh xạ Đối tượng - Quan hệ (Object-Relational Mapping - ORM)
Hibernate ORM 6.5 đóng vai trò là nhà cung cấp hiện thực hóa chuẩn Jakarta Persistence API (JPA) [10]. ORM giải quyết bài toán mâu thuẫn trở kháng mô hình (Object-Relational Impedance Mismatch) bằng cách ánh xạ trực tiếp các lớp đối tượng Java (Entities) thành các bảng trong CSDL quan hệ:
* Thuộc tính lớp được ánh xạ thành cột bảng (`@Column`).
* Các mối quan hệ nghiệp vụ giữa các thực thể được mô hình hóa rõ ràng: `@OneToOne`, `@OneToMany`, `@ManyToOne`, `@ManyToMany`.
* Chiến lược tải dữ liệu thông minh: Sử dụng chế độ nạp lười (`FetchType.LAZY`) cho hầu hết các quan hệ để tránh hiện tượng truy vấn quá mức không cần thiết, kết hợp với các truy vấn kết nối chủ động (`JOIN FETCH`) khi cần lấy trọn vẹn dữ liệu tránh lỗi kinh điển $N+1$ Query Problem.

### 2.7.2. Quản lý giao dịch nguyên tử (@Transactional)
Toàn bộ các phương thức thay đổi dữ liệu tại tầng Service của EVShare 3D đều được đặt trong khối quản lý giao dịch `@Transactional`. Khi một thao tác nghiệp vụ phức tạp diễn ra (ví dụ: xác nhận trả xe đòi hỏi cập nhật trạng thái chuyến đi, cập nhật ODO xe, trừ tồn kho điện và tạo hóa đơn chi phí), nếu xảy ra bất kỳ lỗi bất thường (`RuntimeException`), Spring Framework sẽ tự động kích hoạt cơ chế Rollback toàn bộ trạng thái dữ liệu về điểm bắt đầu, ngăn ngừa triệt để tình trạng dữ liệu dở dang hoặc sai lệch số dư tài chính.

---

## 2.8. HỆ QUẢN TRỊ CƠ SỞ DỮ LIỆU MYSQL VÀ BẢO ĐẢM TÍNH ACID

### 2.8.1. Hệ quản trị CSDL quan hệ MySQL 8.0+
MySQL 8.0 là hệ quản trị cơ sở dữ liệu quan hệ mã nguồn mở phổ biến nhất thế giới [11]. EVShare 3D sử dụng engine lưu trữ mặc định **InnoDB**, cung cấp các năng lực kỹ thuật:
* Hỗ trợ đầy đủ ràng buộc khóa ngoại (Foreign Keys) bảo đảm tính toàn vẹn tham chiếu.
* Khóa dữ liệu ở mức dòng (Row-level Locking) nâng cao năng lực phục vụ đồng thời cho các giao dịch đặt lịch và thanh toán.
* Khả năng đánh chỉ mục B-Tree tối ưu trên các cột thường xuyên tìm kiếm và kiểm tra điều kiện lọc (`vehicle_id`, `user_id`, `status`, `start_time`, `end_time`).

### 2.8.2. Bảo đảm 4 thuộc tính ACID
1. **Tính nguyên tử (Atomicity):** Mọi giao dịch nghiệp vụ trong hệ thống hoặc được thực thi trọn vẹn, hoặc hoàn toàn không có hiệu lực.
2. **Tính nhất quán (Consistency):** Dữ liệu trước và sau giao dịch luôn thỏa mãn mọi ràng buộc toàn vẹn của mô hình nghiệp vụ (ví dụ: tổng tỷ lệ sở hữu nhóm luôn bằng đúng 100%, lượng điện khả dụng không được âm).
3. **Tính cô lập (Isolation):** Các giao dịch đồng thời được thực thi độc lập mà không nhìn thấy dữ liệu trung gian chưa commit của nhau (mức cô lập mặc định `READ COMMITTED` hoặc `REPEATABLE READ`).
4. **Tính bền vững (Durability):** Khi một giao dịch đã commit thành công, dữ liệu được ghi cố định vào nhật ký Redo Log và đĩa cứng, bảo đảm an toàn ngay cả khi máy chủ gặp sự cố mất điện đột ngột.

### 2.8.3. Quản lý di chuyển cấu trúc CSDL với Flyway
Hệ thống sử dụng **Flyway** để kiểm soát phiên bản cấu trúc cơ sở dữ liệu (Database Migration Tool). Toàn bộ quá trình tiến hóa của lược đồ CSDL được chia tách thành 46 tệp script SQL có thứ tự từ `V1__init_schema.sql` đến `V46__create_audit_logs.sql`. Mỗi khi ứng dụng khởi động, Flyway sẽ tự động kiểm tra bảng lịch sử `flyway_schema_history` và thực thi các di chuyển mới một cách nhất quán trên mọi môi trường phát triển, loại bỏ hoàn toàn rủi ro sai lệch cấu trúc giữa các máy lập trình viên.

---

## 2.9. CÔNG NGHỆ ĐỒ HỌA THREE.JS VÀ WEBGL

### 2.9.1. Chuẩn đồ họa WebGL 2.0
WebGL (Web Graphics Library) là chuẩn công nghệ đồ họa cho phép kết xuất hình ảnh 2D và 3D tương tác thời gian thực trực tiếp trên trình duyệt Web mà không cần cài đặt bất kỳ tiện ích mở rộng (Plugin) nào [2]. WebGL tận dụng trực tiếp năng lực tính toán song song cực lớn của bộ xử lý đồ họa phần cứng (GPU) thông qua các chương trình Shader viết bằng ngôn ngữ GLSL (OpenGL Shading Language).

### 2.9.2. Thư viện đồ họa Three.js (r173)
Mặc dù WebGL rất mạnh mẽ nhưng lập trình WebGL thuần ở mức thấp đòi hỏi hàng trăm dòng mã lệnh phức tạp chỉ để vẽ một hình học đơn giản. Three.js ra đời như một thư viện trừu tượng hóa bậc cao mạnh mẽ nhất của WebGL [15].

Các khái niệm cơ bản của Three.js được ứng dụng trực tiếp trong Virtual Garage 3D bao gồm:
* **Không gian cảnh (Scene):** Đóng vai trò là đồ thị không gian (Scene Graph) chứa toàn bộ các đối tượng hiển thị (xe, bục xoay, sàn nhà, trụ sạc, ánh sáng).
* **Máy quay (Perspective Camera):** Mô phỏng mắt người nhìn với góc mở thị trường (FOV), tỷ lệ khung hình (Aspect Ratio) và mặt phẳng cắt gần/xa (Near/Far Planes).
* **Bộ kết xuất (WebGLRenderer):** Thực hiện tính toán và vẽ toàn bộ các đối tượng hình học trong Scene thông qua góc nhìn Camera lên phần tử HTML `<canvas>` với cấu hình khử răng cưa (Antialiasing) và mã hóa màu chuẩn sRGB.
* **Hình học (Geometry) và Vật liệu (Material):** Cấu thành nên lưới đa giác (**Mesh**). Trong EVShare 3D, xe sử dụng vật liệu vật lý chân thực `MeshStandardMaterial` và `MeshPhysicalMaterial`, cho phép mô phỏng độ phản xạ ánh sáng kim loại (Metalness), độ nhám bề mặt sơn (Roughness), và hiệu ứng trong suốt (Transmission/Opacity) phục vụ chế độ X-Ray Pin.
* **Ánh sáng (Lighting):** Kết hợp giữa ánh sáng môi trường đa hướng (`AmbientLight`), ánh sáng điểm nhấn phản xạ (`DirectionalLight` mô phỏng ánh đèn trần garage) để tạo khối và bóng đổ mềm.
* **Tương tác dò tia (Raycasting):** Chuyển đổi tọa độ con trỏ chuột 2D trên màn hình thành một tia 3D phóng vào không gian cảnh, xác định chính xác điểm giao cắt với các bộ phận xe để người dùng nhấp chọn bóc tách chi tiết hoặc xác định vị trí hư hại.

```
+-----------------------------------------------------------------------------------+
|               CHU TRÌNH KẾT XUẤT ĐỒ HỌA THREE.JS (RENDERING PIPELINE)             |
+-----------------------------------------------------------------------------------+

   [DỮ LIỆU TÀI NGUYÊN 3D: GLTF/GLB] ---------> [LOADER: useGLTF Cache Manager]
                                                               |
                                                               v
+-----------------------------------------------------------------------------------+
| KHÔNG GIAN CẢNH 3D (SCENE GRAPH)                                                  |
|                                                                                   |
|  +-- Ánh Sáng: AmbientLight + DirectionalLight (Shadows)                         |
|  +-- Môi Trường: Garage Environment Mesh + Hiệu ứng sàn phản chiếu                |
|  +-- Mô Hình Xe (Vehicle Digital Twin Mesh):                                      |
|  |     +-- Thân Vỏ: MeshPhysicalMaterial (Màu sơn động, Metalness, Roughness)    |
|  |     +-- Khối Pin: MeshStandardMaterial (Emission X-Ray Shader)                 |
|  |     +-- Phụ Tùng: Cửa, Nắp Capo, Bánh Xe, Gương chiếu hậu                      |
|  +-- Điểm Đánh Dấu (Spatial Markers): Hologram Pins & 3D Damage Hotspots          |
+-----------------------------------------------------------------------------------+
           |                                                      ^
           v                                                      |
[CAMERA: PerspectiveCamera]                               [TƯƠNG TÁC: Raycaster]
  (Vị trí x, y, z & Góc nhìn OrbitControls)                (Con trỏ chuột -> Tọa độ 3D)
           |                                                      ^
           v                                                      |
+-----------------------------------------------------------------------------------+
| BỘ KẾT XUẤT (WEBGL RENDERER PIPELINE)                                             |
|   - Vertex Shader -> Rasterization -> Fragment Shader -> Depth/Stencil Buffer     |
|   - Tần số quét 60 FPS (requestAnimationFrame Loop)                               |
+-----------------------------------------------------------------------------------+
                                         |
                                         v
            [MÀN HÌNH HIỂN THỊ: HTML5 CANVAS (WEBGL 2.0 CONTEXT)]
```
*Hình 2.3. Sơ đồ chu trình kết xuất đồ họa và phân cấp không gian 3D của Three.js.*

---

## 2.10. CẦU NỐI REACT THREE FIBER VÀ THƯ VIỆN DREI

### 2.10.1. Khung làm việc React Three Fiber (R3F v8)
React Three Fiber là một trình kết xuất (Custom Renderer) của React dành riêng cho Three.js [16]. R3F mang toàn bộ triết lý Component của React vào thế giới 3D:
* Mọi lớp đối tượng Three.js đều trở thành một thẻ JSX hợp lệ (ví dụ: `new THREE.Mesh()` trở thành `<mesh>`, `new THREE.BoxGeometry()` trở thành `<boxGeometry />`).
* Thuộc tính đồ họa được liên kết trực tiếp thông qua Props, tự động cập nhật khi State thay đổi mà không cần lập trình viên phải gọi hàm cập nhật thủ công.
* Cung cấp Hook `useFrame`: Cho phép chèn mã lệnh tính toán logic vào vòng lặp kết xuất mỗi khung hình (Animation Loop 60 FPS), ví dụ như điều khiển góc tự xoay của bục trưng bày xe hoặc hiệu ứng nhấp nháy phát sáng của các điểm cảnh báo hư hỏng.

### 2.10.2. Thư viện tiện ích @react-three/drei
Drei là bộ sưu tập các component và hook trợ giúp chất lượng cao cho R3F:
* `OrbitControls`: Điều khiển xoay, phóng to, thu nhỏ và di chuyển camera quanh chiếc xe một cách tự nhiên với các giới hạn góc xoay mượt mà (Damping).
* `Html`: Thành phần đột phá cho phép "nhúng" trực tiếp các phần tử giao diện HTML/React thông thường vào trong tọa độ của không gian 3D, giúp các nhãn thông tin phương tiện (Hologram Label) luôn bay lơ lửng và đi theo đúng vị trí của chiếc xe trên màn hình.
* `useGLTF`: Quản lý nạp và tự động lưu bộ nhớ đệm (Cache) cho các tệp mô hình 3D định dạng GLB/GLTF.
* `ContactShadows`: Tạo bóng đổ tiếp xúc mềm mại và chân thực dưới gầm xe lên mặt sàn garage mà không đòi hỏi chi phí tính toán bóng đổ sâu (Shadow Map) đắt đỏ của GPU.

---

## 2.11. MÔ HÌNH 3D VÀ QUẢN LÝ TÀI NGUYÊN (DIGITAL TWIN)

### 2.11.1. Khái niệm Bản sao số hóa (Digital Twin)
Trong công nghiệp ô tô hiện đại, Digital Twin là mô hình ảo số hóa đại diện 1:1 cho một thực thể phương tiện vật lý ngoài đời thực. Trong EVShare 3D, Digital Twin của chiếc xe phản ánh tức thời và chính xác các thuộc tính thực tế lưu trong CSDL:
* Biển số xe và số khung (VIN).
* Màu sơn ngoại thất thực tế (thay đổi vật liệu vỏ xe động tương ứng với mã màu lưu trong DB).
* Tỷ lệ phần trăm dung lượng pin hiện tại (SOC) và sức khỏe pin (SOH).
* Vị trí thực tế của các vết trầy xước, nứt vỡ (Damage Records) được định vị bằng các điểm Hotspot 3D nổi trên thân xe.

### 2.11.2. Định dạng mô hình GLTF / GLB và kỹ thuật quản lý tài nguyên
Hệ thống chuẩn hóa việc sử dụng định dạng nhị phân **GLB** (Graphics Language Transmission Format Binary) [3]. GLB đóng gói toàn bộ lưới đỉnh hình học, vật liệu, chất cảm (Textures) và thông tin xương hoạt họa vào một tệp nhị phân duy nhất, tối ưu hóa tốc độ tải qua mạng Internet.

Để ngăn ngừa hiện tượng tràn bộ nhớ GPU khi người dùng xem qua nhiều xe khác nhau trong garage, hệ thống áp dụng kỹ thuật quản lý tài nguyên nghiêm ngặt:
* Sử dụng cơ chế nạp lười (Lazy Loading) thông qua bộ nạp `useGLTF.preload()`.
* Khi một mô hình xe hoặc một panel 3D bị tháo gỡ khỏi Scene, hệ thống kích hoạt hàm dọn dẹp để gọi phương thức `.dispose()` trên toàn bộ đối tượng Geometry, Material và Texture, giải phóng hoàn toàn bộ nhớ VRAM của GPU.

---

## 2.12. CƠ SỞ KỸ THUẬT QUẢN LÝ PHƯƠNG TIỆN ĐIỆN

### 2.12.1. Các thông số đặc thù của xe điện
* **Dung lượng pin (Battery Usable Capacity):** Tổng lượng điện năng khả dụng mà cụm pin có thể lưu trữ và giải phóng, đo bằng Kilowatt-giờ (kWh). Ví dụ: Xe EV-01 có dung lượng danh định 60.0 kWh.
* **Mức nạp pin hiện thời (State of Charge - SOC):** Tỷ lệ phần trăm dung lượng pin còn lại tại một thời điểm so với dung lượng tối đa hiện tại (từ 0% đến 100%).
* **Sức khỏe pin (State of Health - SOH):** Tỷ lệ phần trăm phản ánh mức độ suy thoái hóa học của cụm pin so với thời điểm mới xuất xưởng. Theo thời gian và số chu kỳ nạp xả, dung lượng khả dụng tối đa thực tế sẽ giảm dần.
* **Chỉ số đồng hồ đo quãng đường (Odometer - ODO):** Tổng quãng đường lăn bánh lũy kế của phương tiện, tính bằng Kilômét (km).

### 2.12.2. Phân định rõ ràng giữa Mô hình Toán học phần mềm và Dữ liệu đo xa IoT
Trong khuôn khổ triển khai hiện tại của đề tài, các thông số pin và năng lượng được tính toán chuẩn xác dựa trên các mô hình toán học vật lý được xây dựng tại lớp `VehicleEnergyModelService` và `ChargingProgressService`, chứ chưa kết nối với các thiết bị vi điều khiển đọc dữ liệu từ cổng OBD-II trên xe thật. 

Cụ thể:
* Lượng điện tiêu thụ thực tế của chuyến đi ($E_{consumed}$) được tính toán dựa trên mức chênh lệch pin giữa lúc bàn giao và lúc trả xe:
$$E_{consumed} = \frac{SOC_{start} - SOC_{end}}{100} \times C_{usable} \quad (\text{kWh}) \tag{2.1}$$
* Hiệu suất truyền dẫn nạp sạc vật lý ($\eta_{charging}$) được chuẩn hóa ở mức $90\%$ ($0.90$), phản ánh thực tế $10\%$ năng lượng nạp từ lưới điện bị tiêu tán dưới dạng nhiệt lượng trên dây dẫn và bộ biến đổi dòng (Inverter).

---

## 2.13. CƠ SỞ KHOA HỌC QUẢN TRỊ ĐỒNG SỞ HỮU

### 2.13.1. Ràng buộc bất biến tỷ lệ cổ phần
Trong mô hình đồng sở hữu, mỗi phương tiện được gán duy nhất cho một nhóm đồng sở hữu (`CoOwnershipGroup`). Mỗi thành viên trong nhóm nắm giữ một tỷ lệ phần trăm sở hữu xác định ($P_i$). Hệ thống thiết lập một ràng buộc bất biến nghiệp vụ tối cao (Business Invariant):

$$\sum_{i=1}^{N} P_i = 100.0000\% \tag{2.2}$$

Bất kỳ giao dịch chuyển nhượng, kết nạp thành viên mới hoặc rút vốn nào vi phạm quy tắc này đều bị tầng Service ngăn chặn và phục hồi giao dịch (Rollback) ngay lập tức.

### 2.13.2. Thuật toán phần dư lớn nhất Hare-Niemeyer trong phân bổ tài chính
Khi một khoản chi phí chung phát sinh (ví dụ: hóa đơn bảo hiểm $M = 1.000.000$ VNĐ) cần phân bổ cho các thành viên có tỷ lệ cổ phần lẻ (ví dụ: 3 người cùng sở hữu $33.3333\%$), phép nhân số học thông thường sẽ tạo ra các phần lẻ thập phân. Do đơn vị tiền tệ VNĐ không có tiền xu lẻ dưới 1 đồng, nếu chỉ làm tròn đơn thuần, tổng số tiền thu về từ các thành viên sẽ bị lệch so với tổng hóa đơn ban đầu.

Để khắc phục triệt để vấn đề này, EVShare 3D hiện thực hóa thuật toán phân bổ **Hare-Niemeyer** (Largest Remainder Method) [22]:
1. Tính toán hạn mức thô của mỗi thành viên: $A_i = M \times \frac{P_i}{100}$.
2. Lấy phần nguyên làm tròn xuống của mỗi phần: $S_i = \lfloor A_i \rfloor$.
3. Tính toán tổng số tiền đã phân bổ: $S_{total} = \sum S_i$. Phần dư cần phân bổ là: $R = M - S_{total}$.
4. Sắp xếp danh sách thành viên theo thứ tự giảm dần của phần thập phân $(A_i - S_i)$. Nếu bằng nhau, áp dụng quy tắc phá vỡ hòa (Tie-breaking) dựa trên tỷ lệ sở hữu cao nhất và thứ tự ổn định của mã `userId`.
5. Phân phối lần lượt $1$ đồng cho $R$ thành viên đứng đầu danh sách cho đến khi phần dư triệt tiêu hoàn toàn.

Thuật toán này bảo đảm tính bất biến kế toán: $\sum S_i' \equiv M$ một cách tuyệt đối đến từng đồng.

---

## 2.14. CÁC MẪU THIẾT KẾ PHẦN MỀM ĐƯỢC XÁC THỰC TRONG DỰ ÁN

Mã nguồn của EVShare 3D áp dụng các mẫu thiết kế kinh điển theo tiêu chuẩn của Gang of Four (GoF) [19] và kiến trúc ứng dụng doanh nghiệp của Martin Fowler [18]:

1. **Layered Architecture (Kiến trúc phân tầng):** Phân tách ứng dụng thành Presentation (Controller), Business Logic (Service), và Data Access (Repository).
2. **Repository Pattern:** Trừu tượng hóa tầng truy cập dữ liệu, che giấu các câu lệnh truy vấn SQL phức tạp phía sau các giao diện phương thức hướng đối tượng.
3. **Data Transfer Object (DTO) Pattern:** Đóng gói dữ liệu gửi và nhận qua mạng, che chắn các trường nhạy cảm của Entity (như `passwordHash`), tránh tình trạng lộ lọt dữ liệu hoặc lỗ hổng gán thuộc tính hàng loạt (Mass Assignment Vulnerability).
4. **Dependency Injection (DI) Pattern:** Tách rời việc tạo lập đối tượng khỏi việc sử dụng đối tượng, tăng cường năng lực kiểm thử và bảo trì mã nguồn.
5. **State Pattern:** Mô hình hóa các vòng đời nghiệp vụ phức tạp (Vòng đời Chuyến đi, Lịch đặt, Hợp đồng) thông qua các Enum trạng thái và bảng chuyển dịch trạng thái được kiểm soát chặt chẽ.
6. **Composite / Component-based UI Pattern:** Xây dựng giao diện từ các khối thành phần nhỏ, độc lập và có tính tái sử dụng cao.

---

## 2.15. BẢNG TỔNG HỢP PHIÊN BẢN CÔNG NGHỆ CHÍNH THỨC

Bảng 2.1 dưới đây tổng hợp chi tiết toàn bộ các công nghệ cốt lõi, phiên bản chính thức được kiểm chứng từ tệp cấu hình `backend/pom.xml` và `frontend/package.json` của dự án EVShare 3D.

*Bảng 2.1. Danh mục công nghệ và phiên bản chính thức của dự án EVShare 3D.*

| STT | Tên Công Nghệ / Thư Viện | Phiên Bản | Vai Trò / Phân Loại | Ứng Dụng Cụ Thể Trong Dự Án EVShare 3D |
| :---: | :--- | :---: | :--- | :--- |
| 1 | **Java Platform (JDK)** | **21 (LTS)** | Ngôn ngữ máy chủ Backend | Nền tảng thực thi máy ảo JVM, hỗ trợ Record types, Pattern matching |
| 2 | **Spring Boot** | **3.3.4** | Khung ứng dụng Backend | Quản lý vòng đời Bean, cấu hình tự động, nhúng máy chủ Tomcat |
| 3 | **Spring Security** | **6.3.x** | Khung an toàn & Bảo mật | Xây dựng chuỗi lọc `SecurityFilterChain`, quản lý phân quyền RBAC |
| 4 | **JJWT (io.jsonwebtoken)** | **0.12.6** | Thư viện mã hóa Token | Sinh, ký số HMAC-SHA256 và giải mã xác thực Token JWT |
| 5 | **Spring Data JPA** | **3.3.4** | Tầng trừu tượng hóa dữ liệu | Cung cấp giao diện `JpaRepository`, tự động sinh câu lệnh truy vấn |
| 6 | **Hibernate ORM** | **6.5.x** | Động cơ ánh xạ ORM | Ánh xạ 46 Entity Java sang các bảng quan hệ CSDL MySQL |
| 7 | **MySQL Connector/J** | **8.x** | Trình điều khiển kết nối JDBC | Cầu nối giao tiếp TCP/IP giữa Spring Boot và hệ quản trị MySQL |
| 8 | **Flyway Migration** | **10.x** | Quản lý phiên bản CSDL | Tự động hóa thực thi 46 script SQL di chuyển từ V1 đến V46 |
| 9 | **MySQL Community Server** | **8.0+** | Hệ quản trị CSDL quan hệ | Lưu trữ bền vững dữ liệu thực thể, bảo đảm nguyên tắc giao dịch ACID |
| 10 | **React** | **18.3.1** | Thư viện giao diện Frontend | Khung xây dựng Single Page Application, Concurrent Rendering |
| 11 | **TypeScript** | **5.7.3** | Ngôn ngữ kịch bản tĩnh | Định kiểu tĩnh cho toàn bộ mã nguồn Frontend, đồng bộ kiểu với DTO |
| 12 | **Vite** | **6.1.0** | Công cụ phát triển & Đóng gói | Máy chủ phát triển ESM siêu tốc, HMR tức thời, Rollup bundler |
| 13 | **React Router DOM** | **7.1.5** | Điều hướng máy khách (Routing) | Quản lý định tuyến URL, bảo vệ đường dẫn `ProtectedRoute` |
| 14 | **Three.js** | **0.173.0** | Thư viện đồ họa 3D WebGL | Động cơ dựng hình Scene 3D, Mesh, Camera, Light, Shader, Raycasting |
| 15 | **@react-three/fiber** | **8.17.14** | Trình kết xuất Three.js cho React | Đưa các đối tượng đồ họa 3D của Three.js thành các thẻ JSX React |
| 16 | **@react-three/drei** | **9.121.4** | Thư viện tiện ích trợ giúp 3D | Cung cấp OrbitControls, Html overlay 3D, ContactShadows, useGLTF |
| 17 | **Zustand** | **5.0.3** | Quản lý trạng thái toàn cục | Quản lý tập trung State: xác thực người dùng, chế độ xem xe 3D |
| 18 | **TanStack Query (React Query)**| **5.66.0** | Quản lý truy vấn dữ liệu từ xa | Bộ nhớ đệm API, xử lý bất đồng bộ, tự động đồng bộ hóa dữ liệu |
| 19 | **Lucide React** | **0.475.0** | Thư viện biểu tượng vector | Cung cấp hệ thống Icon hiện đại cho giao diện HUD và các Panel |
| 20 | **Spring Boot Actuator** | **3.3.4** | Giám sát và vận hành hệ thống | Cung cấp các endpoint theo dõi sức khỏe ứng dụng `/api/health` |

---

### TÓM TẮT CHƯƠNG 2
Chương 2 đã cung cấp bức tranh lý thuyết chuyên sâu và toàn diện về các nền tảng công nghệ được áp dụng trong dự án EVShare 3D. Sự kết hợp chặt chẽ giữa kiến trúc Backend doanh nghiệp chuẩn mực (Spring Boot 3.3.4, Spring Security, Hibernate ORM, MySQL 8.0) với công nghệ WebGL tiên tiến hàng đầu trên trình duyệt (React 18, TypeScript, Three.js r173, React Three Fiber) đã tạo ra một nền tảng vững chắc. Các công thức toán học và giải thuật được kiểm chứng (giá bình quân gia quyền WAC, thuật toán Hare-Niemeyer) tạo tiền đề khoa học vững chắc để giải quyết trọn vẹn các yêu cầu bài toán nghiệp vụ sẽ được khảo sát và đặc tả chi tiết trong Chương 3.
