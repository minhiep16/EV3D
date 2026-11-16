# CHƯƠNG 3: KHẢO SÁT VÀ PHÂN TÍCH YÊU CẦU HỆ THỐNG

---

## 3.1. KHẢO SÁT NGHIỆP VỤ VẬN HÀNH XE ĐIỆN ĐỒNG SỞ HỮU

Quá trình phân tích bài toán quản lý xe điện đồng sở hữu cho thấy một vòng đời khép kín bao gồm 4 giai đoạn nghiệp vụ liên hoàn:
1. **Giai đoạn Thiết lập & Quản trị Cổ phần (Co-Ownership Onboarding):** Nhóm các cá nhân cùng góp vốn mua một chiếc xe điện. Hệ thống cần ghi nhận giá trị phương tiện, tỷ lệ vốn góp của từng thành viên, bầu chọn nhóm trưởng (Leader), phát hành hợp đồng điện tử và quản lý việc chuyển nhượng quyền sở hữu khi có sự thay đổi nhân sự.
2. **Giai đoạn Đặt lịch & Chuẩn bị Xe (Scheduling & Pre-Trip Preparation):** Thành viên có nhu cầu di chuyển sẽ đăng ký khung giờ sử dụng trên hệ thống. Hệ thống phải rà soát tự động để bảo đảm xe không rơi vào khung giờ bảo dưỡng và không bị trùng lặp với lịch của thành viên khác. Trước giờ khởi hành, nhân viên kỹ thuật tại trạm sạc/bãi đỗ kiểm tra tình trạng xe, mức pin và xác nhận biên bản bàn giao.
3. **Giai đoạn Vận hành & Di chuyển (Active Trip & Extension):** Thành viên nhận bàn giao xe, kiểm tra lại hiện trạng và kích hoạt chuyến đi. Trong quá trình di chuyển, nếu có nhu cầu phát sinh thêm thời gian, người dùng có thể gửi yêu cầu gia hạn. Nếu khung giờ liền kề đã có người khác đặt trước, hệ thống kích hoạt cơ chế đàm phán đồng thuận.
4. **Giai đoạn Kết thúc & Đối soát Tài chính (Return, Inspection & Settlement):** Thành viên đưa xe về trạm và gửi yêu cầu trả xe. Nhân viên kỹ thuật tiến hành kiểm tra xe theo bảng kiểm tra kỹ thuật (Inspection Checklist), đối chiếu chỉ số đồng hồ ODO và dung lượng pin SOC, ghi nhận các điểm hư hại mới (nếu có). Hệ thống tự động tính toán điện năng tiêu thụ, trừ vào kho tồn năng lượng và lập bảng kê chi phí gửi đến người sử dụng để thanh toán.

---

## 3.2. CÁC TÁC NHÂN CỦA HỆ THỐNG (ACTORS)

Dựa trên mã nguồn xác thực và cấu hình phân quyền Spring Security (`SecurityConfig.java`, `Role.java`), hệ thống xác định 3 tác nhân người dùng chính và 1 tác nhân hệ thống tự động:

1. **Quản Trị Viên (ADMIN):**
   * Đại diện cho ban quản trị nền tảng hoặc đơn vị quản lý vận hành cấp cao.
   * Sở hữu thẩm quyền cao nhất trên toàn hệ thống: quản lý tài khoản người dùng, phê duyệt danh mục xe, khởi tạo và giám sát các nhóm đồng sở hữu, xem báo cáo phân tích hiệu suất và cấu hình hệ thống.
2. **Nhân Viên Điều Hành Kỹ Thuật (STAFF):**
   * Đóng vai trò là đội ngũ kỹ thuật viên trực tiếp tại các trạm garage, bãi đỗ tập trung.
   * Chịu trách nhiệm thực hiện quy trình kiểm tra kỹ thuật xe, ký xác nhận biên bản bàn giao xe (Handover), tiếp nhận và đối soát khi trả xe (Return Verification), ghi nhận hư hỏng 3D, vận hành bảo dưỡng, điều phối nạp sạc và xác minh các chứng từ thanh toán chi phí.
3. **Chủ Đồng Sở Hữu (CO_OWNER):**
   * Là các thành viên trực tiếp góp vốn sở hữu xe điện.
   * Có quyền tương tác trong Virtual Garage 3D, xem thông tin Digital Twin của xe, theo dõi sức khỏe pin, đặt lịch sử dụng, khởi hành chuyến đi, yêu cầu gia hạn, thanh toán chi phí điện năng, tham gia bỏ phiếu biểu quyết, mời thành viên mới và ký kết hợp đồng điện tử.
4. **Tác Nhân Hệ Thống Tự Động (SYSTEM SCHEDULER / ENGINE):**
   * Các tiến trình nền chạy định kỳ (ví dụ: `TripStartNotificationScheduler`, `ChargingProgressService`) tự động kiểm tra thời hạn lịch đặt, cập nhật tiến trình sạc mô phỏng, phát sinh thông báo nhắc nhở và tự động hóa các giao dịch năng lượng.

---

## 3.3. PHÂN QUYỀN CHỨC NĂNG THEO VAI TRÒ (PERMISSION MATRIX)

Bảng 3.1 dưới đây thể hiện ma trận phân quyền chi tiết giữa các vai trò người dùng trong hệ thống. Hệ thống phân định rõ ràng giữa:
* **Khả năng hiển thị giao diện (Frontend Visibility):** Các nút bấm hoặc panel được hiển thị dựa trên trạng thái `user.role` trong Zustand store.
* **Ủy quyền thực thi tại Backend (Backend RBAC Enforced):** Được bảo vệ tuyệt đối bằng các annotation `@PreAuthorize("hasRole('...')")` hoặc logic kiểm tra quyền trong Service Layer.

*Bảng 3.1. Ma trận phân quyền chức năng chi tiết trong hệ thống EVShare 3D.*

| Mã Chức Năng | Tên Chức Năng / Nghiệp Vụ | ADMIN | STAFF | CO_OWNER | Điều Kiện Sở Hữu Xe | Ràng Buộc Kiểm Soát Backend |
| :---: | :--- | :---: | :---: | :---: | :--- | :--- |
| **P-AUTH-01** | Đăng nhập, Làm mới Token, Đăng xuất | Cho phép | Cho phép | Cho phép | Không yêu cầu | Xác thực qua JWT Filter |
| **P-USER-01** | Xem danh sách & Quản lý vai trò người dùng | Cho phép | Từ chối | Từ chối | Toàn hệ thống | `@PreAuthorize("hasRole('ADMIN')")` |
| **P-FLEET-01** | Xem danh mục toàn bộ đội xe hệ thống | Cho phép | Cho phép | Từ chối | Không hạn chế | Endpoint `/api/vehicles` mở cho nhân viên |
| **P-GARAGE-01**| Khám phá Virtual Garage 3D & Digital Twin | Cho phép | Cho phép | Cho phép | Thuộc nhóm xe | CO_OWNER chỉ xem xe mình sở hữu |
| **P-BOOK-01**  | Đặt lịch sử dụng xe (Booking) | Cho phép | Cho phép | Cho phép | Phải là thành viên | Kiểm tra `isUserActiveMemberForVehicle` |
| **P-BOOK-02**  | Hủy lịch đặt xe | Cho phép | Cho phép | Cho phép | Phải là người đặt | Chỉ người tạo hoặc Quản trị viên mới được hủy |
| **P-HAND-01**  | Xác nhận bàn giao xe kỹ thuật | Cho phép | Cho phép | Từ chối | Trạm phụ trách | `@PreAuthorize("hasAnyRole('STAFF','ADMIN')")` |
| **P-HAND-02**  | Ký nhận biên bản bàn giao xe | Từ chối | Từ chối | Cho phép | Người đặt lịch | Chỉ người lái của lịch đặt mới ký nhận |
| **P-TRIP-01**  | Bắt đầu chuyến đi (Start Trip) | Từ chối | Từ chối | Cho phép | Người đặt lịch | Phải có Handover hoàn tất, đúng khung giờ |
| **P-TRIP-02**  | Yêu cầu gia hạn chuyến đi | Từ chối | Từ chối | Cho phép | Đang lái xe | Chuyến đi phải đang ở trạng thái ACTIVE |
| **P-TRIP-03**  | Yêu cầu trả xe (Return Request) | Từ chối | Từ chối | Cho phép | Đang lái xe | Chỉ người sở hữu chuyến đi mới gửi yêu cầu |
| **P-TRIP-04**  | Đối soát & Xác nhận hoàn tất trả xe | Cho phép | Cho phép | Từ chối | Trạm tiếp nhận | `@PreAuthorize("hasAnyRole('STAFF','ADMIN')")` |
| **P-INSP-01**  | Lập biên bản kiểm tra kỹ thuật (Checklist) | Cho phép | Cho phép | Từ chối | Xe tại trạm | Yêu cầu chữ ký nhân viên kỹ thuật |
| **P-DAMG-01**  | Ghi nhận hư hỏng mới & Tọa độ 3D Hotspot | Cho phép | Cho phép | Cho phép | Xe liên quan | Nhân viên xác nhận tính hợp lệ của vết xước |
| **P-DAMG-02**  | Đánh dấu hư hại đã được sửa chữa | Cho phép | Cho phép | Từ chối | Xe sửa xong | Phải đính kèm ghi chú biên bản bảo dưỡng |
| **P-CHRG-01**  | Bắt đầu & Dừng phiên sạc xe | Cho phép | Cho phép | Cho phép | Xe tại trụ sạc | Ghi nhận đúng người thao tác vào CSDL |
| **P-CHRG-02**  | Thực hiện phiên sạc vận hành miễn phí | Cho phép | Cho phép | Từ chối | Xe điều phối | Áp dụng cờ `isStaffCharging = true` |
| **P-ENER-01**  | Xem báo cáo tồn kho năng lượng (WAC) | Cho phép | Cho phép | Cho phép | Xe thuộc nhóm | Đọc dữ liệu từ `VehicleEnergyInventory` |
| **P-FIN-01**   | Khởi tạo & Phê duyệt khoản chi phí chung | Cho phép | Cho phép | Từ chối | Xe liên quan | Áp dụng thuật toán phân bổ Hare-Niemeyer |
| **P-FIN-02**   | Gửi thông tin thanh toán cá nhân (DEMO) | Cho phép | Cho phép | Cho phép | Có khoản nợ | Tạo bản ghi `PAYMENT_SUBMITTED` |
| **P-FIN-03**   | Phê duyệt xác minh thanh toán chi phí | Cho phép | Cho phép | Từ chối | Khoản nợ mở | `@PreAuthorize("hasAnyRole('STAFF','ADMIN')")` |
| **P-OWN-01**   | Chuyển nhượng tỷ lệ sở hữu phương tiện | Từ chối | Từ chối | Cho phép | Có cổ phần | Kiểm tra không vượt quá % đang nắm giữ |
| **P-OWN-02**   | Mời thành viên mới gia nhập nhóm | Cho phép | Từ chối | Cho phép | Leader của nhóm | Nhóm chưa đạt số lượng thành viên tối đa |
| **P-CON-01**   | Xem & Ký hợp đồng điện tử (DEMO) | Cho phép | Từ chối | Cho phép | Thành viên nhóm | Ghi nhận hash chấp thuận `ContractAcceptance` |
| **P-VOTE-01**  | Tạo đề xuất biểu quyết & Bỏ phiếu | Cho phép | Từ chối | Cho phép | Thành viên nhóm | Chỉ bỏ phiếu 1 lần duy nhất cho mỗi đề xuất |
| **P-DISP-01**  | Mở khiếu nại tranh chấp sự cố | Cho phép | Cho phép | Cho phép | Liên quan sự cố | Tạo bản ghi `Dispute` kèm bằng chứng |
| **P-DISP-02**  | Điều tra, Kết luận & Hòa giải tranh chấp | Cho phép | Cho phép | Từ chối | Hồ sơ mở | Nhân viên trực tiếp ghi nhận phương án xử lý |

---

## 3.4. YÊU CẦU CHỨC NĂNG (FUNCTIONAL REQUIREMENTS - FR)

Hệ thống được thiết kế với 19 nhóm yêu cầu chức năng cốt lõi. Mỗi yêu cầu được định danh bằng mã duy nhất, gán mức độ ưu tiên theo chuẩn MoSCoW (Must-have, Should-have, Could-have) và liên kết với mã nguồn minh chứng thực tế:

*Bảng 3.2. Danh mục đặc tả yêu cầu chức năng của hệ thống EVShare 3D.*

| Mã Yêu Cầu | Tên Yêu Cầu Chức Năng | Mô Tả Nghiệp Vụ Chi Tiết | Tác Nhân | Điều Kiện Tiên Quyết | Kết Quả Mong Đợi | Ưu Tiên | Trạng Thái | Bằng Chứng Mã Nguồn |
| :--- | :--- | :--- | :--- | :--- | :--- | :---: | :---: | :--- |
| **FR-AUTH-01** | Xác thực đăng nhập | Xác thực người dùng bằng email và mật khẩu | Mọi tác nhân | Tài khoản đã tồn tại và kích hoạt | Trả về Access Token (JWT) & Refresh Token | MUST | Source-Confirmed | `AuthService.java:login()` |
| **FR-AUTH-02** | Làm mới Access Token | Cấp Access Token mới khi token cũ hết hạn | Người dùng | Có Refresh Token hợp lệ còn hạn trong CSDL | Cấp lại Access Token mới, giữ phiên làm việc | MUST | Source-Confirmed | `AuthController.java:refreshToken()` |
| **FR-AUTH-03** | Đăng xuất hệ thống | Thu hồi phiên làm việc và xóa token bảo mật | Người dùng | Đang đăng nhập hệ thống | Thu hồi Refresh Token, xóa bỏ token ở client | MUST | Source-Confirmed | `AuthService.java:logout()` |
| **FR-USER-01** | Quản lý tài khoản | Danh sách, tìm kiếm và thay đổi vai trò tài khoản | ADMIN | Đăng nhập với quyền ADMIN | Cập nhật thông tin vai trò, trạng thái người dùng | MUST | Source-Confirmed | `AdminController.java:manageUserRole()` |
| **FR-VEH-01**  | Quản lý danh mục xe | Xem chi tiết thông số kỹ thuật, pin và ODO xe | ADMIN / STAFF | Đăng nhập hệ thống | Trả về thông tin đầy đủ của xe kèm màu sơn | MUST | Source-Confirmed | `VehicleService.java:getVehicleById()` |
| **FR-OWN-01**  | Ràng buộc 100% cổ phần | Đảm bảo tổng tỷ lệ sở hữu nhóm luôn đủ 100% | ADMIN / Nhóm | Tạo nhóm hoặc phân bổ lại cổ phần | Ngăn chặn và báo lỗi nếu tổng tỷ lệ khác 100% | MUST | Source-Confirmed | `ExpenseShareService.java:120` |
| **FR-BOOK-01** | Đặt lịch sử dụng xe | Đăng ký khung giờ sử dụng xe trong tương lai | CO_OWNER | Là thành viên hoạt động của xe | Tạo bản ghi Booking mới (CONFIRMED) | MUST | Source-Confirmed | `BookingServiceTest.java` |
| **FR-BOOK-02** | Khử xung đột lịch đặt | Tự động phát hiện và ngăn chặn lịch đặt trùng lấn | Hệ thống | Khung giờ gửi lên bị trùng với lịch khác | Báo lỗi xung đột, từ chối lưu lịch trùng | MUST | Source-Confirmed | `BookingService.java:findConflictingBookings()` |
| **FR-HAND-01** | Bàn giao xe kỹ thuật | Ghi nhận ODO, Pin và biên bản lúc giao xe | STAFF | Lịch đặt đang ở trạng thái CONFIRMED | Lưu VehicleHandover (COMPLETED), chuyển xe RESERVED | MUST | Source-Confirmed | `VehicleHandoverServiceTest.java` |
| **FR-TRIP-01** | Bắt đầu chuyến đi | Kích hoạt chuyến đi di chuyển thực tế | CO_OWNER | Đã bàn giao xe, trong khung giờ cho phép | Tạo bản ghi Trip (ACTIVE), xe chuyển IN_USE | MUST | Source-Confirmed | `TripServiceTest.java` |
| **FR-TRIP-02** | Gia hạn chuyến đi | Tăng thêm thời gian sử dụng trong khi đang lái xe | CO_OWNER | Chuyến đi đang ACTIVE | Gia hạn trực tiếp hoặc mở đàm phán nếu trùng | SHOULD | Source-Confirmed | `TripExtensionService.java` |
| **FR-TRIP-03** | Yêu cầu trả xe | Gửi thông số ODO và Pin kết thúc hành trình | CO_OWNER | Chuyến đi đang ACTIVE | Ghi nhận `returnRequestedAt`, chờ nhân viên duyệt | MUST | Source-Confirmed | `TripService.java:requestTripReturn()` |
| **FR-TRIP-04** | Xác nhận hoàn tất trả xe | Nhân viên đối soát thực tế và chốt chuyến đi | STAFF | Chuyến đi có yêu cầu trả xe | Chốt Trip COMPLETED, kích hoạt trừ tồn kho năng lượng | MUST | Source-Confirmed | `TripService.java:confirmTripReturn()` |
| **FR-INS-01**  | Kiểm tra kỹ thuật xe | Thực hiện checklist kiểm định lốp, đèn, thân vỏ | STAFF | Xe tại trạm điều hành | Lưu bản ghi VehicleInspection kèm kết quả | MUST | Source-Confirmed | `VehicleInspectionService.java` |
| **FR-DAMG-01** | Bản đồ hóa hư hỏng 3D | Gắn điểm Hotspot hư hỏng trực tiếp lên lưới 3D | STAFF / CO_OWNER | Đang trong phiên kiểm tra xe | Lưu DamageRecord, hiển thị điểm cảnh báo 3D nổi | MUST | Source-Confirmed | `DamageControllerTest.java` |
| **FR-MAINT-01**| Quản lý bảo dưỡng | Tạo yêu cầu, biểu quyết và thực thi bảo dưỡng | CO_OWNER / STAFF | Xe đạt mốc bảo dưỡng định kỳ | Chuyển xe MAINTENANCE, hoàn tất cập nhật chi phí | SHOULD | Source-Confirmed | `MaintenanceService.java` |
| **FR-CHARGE-01**| Quản lý nạp sạc pin | Bắt đầu và hoàn tất phiên sạc tại trụ thông minh | Người dùng | Xe kết nối trụ sạc | Lưu ChargingSession, cập nhật % pin cho xe | MUST | Source-Confirmed | `ChargingSessionService.java` |
| **FR-ENERGY-01**| Tồn kho năng lượng WAC | Tính toán tồn kho kWh và giá bình quân gia quyền | Hệ thống | Hoàn tất sạc hoặc hoàn tất chuyến đi | Cập nhật kho điện, tính đến tổn hao sạc vật lý | MUST | Source-Confirmed | `VehicleEnergyInventoryService.java` |
| **FR-FIN-01**  | Phân bổ chi phí trực tiếp| Chia nhỏ chi phí theo tỷ lệ vốn hoặc người lái | Hệ thống | Khoản chi phí được phê duyệt | Tạo các bản ghi ExpenseShare theo thuật toán chuẩn | MUST | Source-Confirmed | `ExpenseShareService.java:generateSharesForExpense()` |
| **FR-FIN-02**  | Thanh toán cá nhân DEMO | Gửi mã đối soát và xác minh thanh toán chi phí | CO_OWNER / STAFF | Có khoản nợ chi phí chưa thanh toán | Tạo PersonalExpensePayment, nhân viên duyệt tất toán | MUST | Source-Confirmed | `PersonalPaymentService.java` |
| **FR-CON-01**  | Hợp đồng đồng sở hữu | Tạo lập phiên bản và ký kết hợp đồng số DEMO | CO_OWNER | Thành viên mới vào nhóm | Kích hoạt hiệu lực hợp đồng khi đủ 100% chữ ký | SHOULD | Source-Confirmed | `CoOwnershipContractService.java` |
| **FR-VOTE-01** | Biểu quyết dân chủ | Tạo đề xuất biểu quyết và kiểm phiếu theo % vốn | CO_OWNER | Thành viên nhóm sở hữu xe | Tự động phê duyệt đề xuất nếu tỷ lệ ủng hộ > 50% | SHOULD | Source-Confirmed | `VoteProposalService.java` |
| **FR-DISP-01** | Quản lý tranh chấp | Mở hồ sơ khiếu nại, tải bằng chứng và hòa giải | CO_OWNER / STAFF | Phát sinh mâu thuẫn về chi phí hoặc lịch | Lưu hồ sơ Dispute, thực thi bồi hoàn DEMO | SHOULD | Source-Confirmed | `DisputeService.java` |
| **FR-3D-01**   | Virtual Garage 3D | Hiển thị không gian 3D, xoay xe, chuyển đổi bục | Mọi tác nhân | Trình duyệt hỗ trợ WebGL 2.0 | Kết xuất mô hình xe chân thực ở 60 FPS | MUST | Source-Confirmed | `EVShareWorld.tsx` |
| **FR-3D-02**   | Chế độ X-Ray Pin 3D | Nhìn xuyên vỏ xe hiển thị khối pin phát sáng | CO_OWNER | Đang xem xe trong Garage | Vỏ xe bán trong suốt, khối pin phát sáng trực quan | SHOULD | Source-Confirmed | `BatteryHealthZone.tsx` |

---

## 3.5. YÊU CẦU PHI CHỨC NĂNG (NON-FUNCTIONAL REQUIREMENTS - NFR)

1. **An Toàn và Bảo Mật (Security - NFR-SEC):**
   * *Mục tiêu thiết kế:* Toàn bộ dữ liệu mật khẩu người dùng phải được băm an toàn bằng thuật toán BCrypt với độ phức tạp cao (work factor 10-12). Cơ chế xác thực sử dụng JSON Web Token chuẩn RFC 7519.
   * *Kết quả đạt được:* Đã hiện thực hóa hoàn chỉnh trong mã nguồn Spring Security (`SecurityConfig.java`), lọc triệt để các truy cập trái quyền theo vai trò (RBAC) và bảo vệ trước tấn công CSRF thông qua cơ chế phi trạng thái (Stateless).
2. **Hiệu Năng Kết Xuất Đồ Họa 3D (Performance - NFR-PERF):**
   * *Mục tiêu thiết kế:* Đạt tốc độ khung hình ổn định xấp xỉ **60 FPS** trong không gian Virtual Garage 3D trên các dòng máy tính tiêu chuẩn; thời gian tương tác phản hồi (INP) $\le 200$ ms; thời gian hiển thị phần tử nội dung lớn nhất (LCP) $\le 2.5$ giây.
   * *Kết quả đạt được:* Đạt cấu trúc kỹ thuật tối ưu thông qua việc nạp trước tài nguyên (`useGLTF.preload`), nạp lười component (`React.lazy`), chia nhỏ gói mã lệnh (Code-splitting) và cơ chế dọn dẹp bộ nhớ tự động (`dispose()`) khi tháo dỡ đối tượng 3D.
3. **Tính Toàn Vẹn và Nhất Quán Dữ Liệu (Data Integrity - NFR-INT):**
   * *Mục tiêu thiết kế:* Đảm bảo 100% các giao dịch thay đổi số dư tài chính, phân bổ chi phí, trừ tồn kho điện và đổi chủ sở hữu phải diễn ra nguyên tử (ACID Compliance).
   * *Kết quả đạt được:* Được bảo đảm tuyệt đối tại tầng Service thông qua annotation `@Transactional`, các khóa ngoại liên kết trong CSDL MySQL và các ràng buộc kiểm tra bất biến (Invariant Validations).
4. **Khả Năng Bảo Trì và Mở Rộng (Maintainability - NFR-MAINT):**
   * *Mục tiêu thiết kế:* Mã nguồn có tính module hóa cao, tuân thủ nguyên tắc SOLID, phân rã độc lập các phân hệ nghiệp vụ.
   * *Kết quả đạt được:* Cấu trúc phân tầng rõ ràng (Controller - Service - Repository - Entity - DTO), lược đồ CSDL được quản lý tiến hóa nhất quán qua 46 tệp script di chuyển Flyway.
5. **Độ Tin Cậy và Xử Lý Lỗi (Reliability & Error Handling - NFR-REL):**
   * *Mục tiêu thiết kế:* Toàn bộ ngoại lệ hệ thống phải được bắt và định dạng chuẩn hóa, không để lộ cấu trúc ngăn xếp (Stack Trace) ra giao diện người dùng.
   * *Kết quả đạt được:* Đã hiện thực hóa lớp xử lý lỗi tập trung `GlobalExceptionHandler` tại backend và các `GarageErrorBoundary`, `PanelErrorBoundary` tại frontend.

---

## 3.6. CÁC QUY TẮC NGHIỆP VỤ CỐT LÕI (BUSINESS RULES - BR)

Dựa trên việc kiểm chứng trực tiếp mã nguồn của hệ thống, EVShare 3D thiết lập và thực thi nghiêm ngặt 20 quy tắc nghiệp vụ bất biến:

* **BR-01 (Quy tắc Toàn vẹn Tỷ lệ Cổ phần):** Tổng tỷ lệ phần trăm sở hữu (`OwnershipShare.percentage`) của tất cả các thành viên đang hoạt động trong một nhóm đối với một chiếc xe phải luôn bằng chính xác **$100.0000\%$**.
* **BR-02 (Quy tắc Một Xe - Một Nhóm Sở Hữu):** Mỗi phương tiện giao thông trong hệ thống chỉ được gắn kết với duy nhất một nhóm đồng sở hữu đang hoạt động tại một thời điểm (được kiểm chứng qua Flyway migration `V13__enforce_one_vehicle_per_co_ownership_group.sql`).
* **BR-03 (Quy tắc Trưởng Nhóm Đại Diện):** Mỗi nhóm đồng sở hữu phải có duy nhất một thành viên nắm giữ vai trò Trưởng nhóm (`GroupMemberRole.LEADER`). Trưởng nhóm có đặc quyền mời thành viên mới và khởi tạo các đề xuất biểu quyết cấp nhóm.
* **BR-04 (Quy tắc Khử Xung Đột Đặt Xe):** Hai lịch đặt xe (`Booking`) của cùng một phương tiện được coi là xung đột nếu có trạng thái `CONFIRMED` hoặc `PENDING` và thỏa mãn điều kiện giao nhau về mặt thời gian:
$$\text{Existing.startTime} < \text{New.endTime} \quad \text{VÀ} \quad \text{Existing.endTime} > \text{New.startTime}$$
* **BR-05 (Quy tắc Thời Gian Không Ở Quá Khứ):** Thời điểm bắt đầu của lịch đặt xe mới phải lớn hơn hoặc bằng thời điểm hiện tại trừ đi độ trễ trôi đồng hồ cho phép (Grace period 120 giây).
* **BR-06 (Quy tắc Chặn Xe Đang Bảo Dưỡng):** Phương tiện đang có trạng thái `VehicleStatus.MAINTENANCE` tuyệt đối không được phép tạo lịch đặt mới.
* **BR-07 (Quy tắc Bàn Giao Kỹ Thuật Độc Lập):** Một chuyến đi chỉ được phép khởi hành khi và chỉ khi đã có biên bản bàn giao (`VehicleHandover`) được ký xác nhận bởi Nhân viên vận hành (`STAFF`) và thành viên lái xe đã xác nhận biên bản tình trạng.
* **BR-08 (Quy tắc Cửa Sổ Bắt Đầu Chuyến Đi):** Thành viên chỉ có thể nhấn nút bắt đầu chuyến đi (`startTrip`) trong cửa sổ thời gian cho phép: sớm nhất trước giờ đặt 30 phút (`START_WINDOW_EARLY_TOLERANCE_MINUTES = 30`) và muộn nhất trước khi lịch đặt kết thúc.
* **BR-09 (Quy tắc Chính Chủ Lịch Đặt):** Chỉ tài khoản thành viên trực tiếp đứng tên trong bản ghi Booking mới có thẩm quyền khởi hành và yêu cầu trả xe cho chuyến đi đó.
* **BR-10 (Quy tắc Đàm Phán Gia Hạn):** Yêu cầu gia hạn chuyến đi chỉ được chấp thuận tự động nếu khung giờ xin thêm hoàn toàn trống. Nếu có người khác đã đặt liền kề, hệ thống bắt buộc phải chuyển sang quy trình đàm phán đồng thuận.
* **BR-11 (Quy tắc Tính Toán Điện Tiêu Thụ):** Điện năng tiêu thụ của chuyến đi được tính toán dựa trên mức sụt giảm của tỷ lệ pin nhân với dung lượng khả dụng của xe:
$$E = (SOC_{start} - SOC_{end}) \times \frac{C_{usable}}{100}$$
Chỉ số ODO kết thúc hành trình bắt buộc phải lớn hơn hoặc bằng chỉ số ODO lúc bàn giao xuất phát ($ODO_{end} \ge ODO_{start}$).
* **BR-12 (Quy tắc Tính Tổn Hao Nạp Sạc):** Điện năng thực tế nạp vào pin chỉ bằng $90\%$ điện năng đo được tại trụ sạc do hiệu suất truyền dẫn vật lý ($\eta = 0.90$). Phần $10\%$ còn lại được ghi nhận vào cột tổn hao năng lượng (`energy_loss_kwh`).
* **BR-13 (Quy tắc Giá Bình Quân Gia Quyền Năng Lượng - WAC):** Đơn giá điện bình quân gia quyền của kho năng lượng xe sau mỗi phiên sạc mới được cập nhật theo công thức:
$$P_{avg}^{new} = \frac{V_{prev} + (E_{stored} \times P_{tariff})}{E_{prev} + E_{stored}}$$
Trong đó: $V_{prev}$ là tổng giá trị tiền điện tồn cũ, $E_{prev}$ là số kWh tồn cũ, $E_{stored}$ là số kWh nạp mới vào pin, và $P_{tariff}$ là đơn giá điện của trụ sạc tại phiên nạp.
* **BR-14 (Quy tắc Sạc Vận Hành Miễn Phí Cho Nhân Viên):** Khi nhân viên kỹ thuật (`STAFF`) thực hiện sạc xe để chuẩn bị phương tiện, phiên sạc được miễn phí tiền sạc cá nhân nhưng năng lượng nạp vào kho vẫn được ghi nhận theo đơn giá quy chuẩn để tránh làm loãng giá trị tiền điện của xe.
* **BR-15 (Quy tắc Phân Bổ Tiền Điện Chuyến Đi):** Chi phí điện năng tiêu thụ phát sinh từ chuyến đi được phân bổ trực tiếp $100\%$ nghĩa vụ tài chính cho người lái chuyến đi đó (`ExpenseAllocationPolicy.USER_RESPONSIBILITY`). Các thành viên đồng sở hữu khác không phải gánh chịu chi phí này.
* **BR-16 (Quy tắc Phân Bổ Chi Phí Thường Niên):** Các khoản chi phí bảo trì định kỳ, bảo hiểm thân vỏ và phí gửi xe chung được phân bổ cho các thành viên theo đúng tỷ lệ phần trăm sở hữu (`OWNERSHIP_RATIO`) ứng dụng thuật toán phần dư Hare-Niemeyer.
* **BR-17 (Quy tắc Xác Minh Thanh Toán Hai Bước):** Thành viên nộp thanh toán chi phí chỉ tạo bản ghi `PAYMENT_SUBMITTED`. Nghĩa vụ tài chính chỉ được xem là hoàn tất (`PAYMENT_VERIFIED` và `SETTLED`) sau khi có sự kiểm tra và phê duyệt của Nhân viên hoặc Quản trị viên. Thành viên không được quyền tự duyệt cho chính mình.
* **BR-18 (Quy tắc Chuyển Nhượng Cổ Phần An Toàn):** Số lượng cổ phần chuyển nhượng không được vượt quá số cổ phần mà người chuyển nhượng đang sở hữu. Giao dịch chuyển nhượng chỉ được thực thi khi nhận đủ sự chấp thuận từ các bên và phải lưu vết lịch sử vào bảng `ownership_change_histories`.
* **BR-19 (Quy tắc Hiệu Lực Hợp Đồng Số):** Một phiên bản hợp đồng đồng sở hữu điện tử chỉ chính thức chuyển sang trạng thái `ACTIVE` khi toàn bộ $100\%$ các thành viên trong nhóm đã hoàn tất thao tác ký số chấp thuận.
* **BR-20 (Quy tắc Biểu Quyết Quá Bán):** Đề xuất biểu quyết tập thể được thông qua khi tỷ lệ phiếu đồng thuận (tính theo trọng số % sở hữu hoặc số lượng thành viên tùy quy chế) đạt trên $50.00\%$ tại thời điểm kết thúc thời gian bình chọn.

---

## 3.7. SƠ ĐỒ USE CASE TỔNG QUÁT HỆ THỐNG

Sơ đồ Use Case tổng quát phản ánh toàn bộ các tương tác giữa 3 tác nhân người dùng với 4 phân hệ lớn của hệ thống EVShare 3D (được thiết kế và lưu trữ chi tiết trong tệp `diagrams/use-case/overall_system_usecase.puml`).

---

## 3.8. SƠ ĐỒ USE CASE PHÂN RÃ THEO PHÂN HỆ

Hệ thống được phân rã thành các sơ đồ Use Case chuyên sâu:
1. **Phân hệ Đặt lịch & Quản lý Chuyến đi:** Bao gồm các Use Case: Xem lịch xe, Đặt lịch sử dụng, Hủy lịch, Khởi hành, Gia hạn chuyến đi, Yêu cầu trả xe.
2. **Phân hệ Bàn giao, Trả xe & Kiểm định:** Bao gồm: Lập biên bản bàn giao, Ký xác nhận tình trạng, Lập checklist kiểm tra kỹ thuật, Đối soát chỉ số ODO/Pin hoàn tất chuyến đi.
3. **Phân hệ Sạc điện & Quản trị Năng lượng:** Bao gồm: Bắt đầu sạc, Dừng sạc, Theo dõi tiến trình nạp pin, Tra cứu tồn kho năng lượng và lịch sử giao dịch kWh.
4. **Phân hệ Tài chính & Phân bổ Chi phí:** Bao gồm: Tạo khoản chi phí, Phân bổ theo tỷ lệ sở hữu, Phân bổ theo người lái, Nộp chứng từ thanh toán DEMO, Xác minh thanh toán.
5. **Phân hệ Quản trị Nhóm, Hợp đồng & Biểu quyết:** Bao gồm: Tạo nhóm, Chuyển nhượng cổ phần, Mời thành viên mới, Ký số hợp đồng, Tạo đề xuất biểu quyết, Bỏ phiếu dân chủ.
6. **Phân hệ Tương tác 3D Virtual Garage:** Bao gồm: Xoay/phóng to xe, Bóc tách từng bộ phận, Bật chế độ X-Ray Pin, Xem và gắn điểm Hotspot hư hại 3D.

---

## 3.9. ĐẶC TẢ USE CASE CHI TIẾT CÁC LUỒNG NGHIỆP VỤ CHÍNH

### 3.9.1. Đặc tả Use Case UC-BOOK-01: Đặt Lịch Sử Dụng Xe (Create Booking)
* **Mã Use Case:** UC-BOOK-01
* **Tên Use Case:** Đặt lịch sử dụng xe điện
* **Tác nhân chính:** Chủ đồng sở hữu (CO_OWNER)
* **Mô tả tóm tắt:** Cho phép thành viên chọn một chiếc xe thuộc nhóm sở hữu của mình và đăng ký khoảng thời gian sử dụng trong tương lai.
* **Điều kiện tiên quyết:**
  1. Người dùng đã đăng nhập thành công với vai trò CO_OWNER.
  2. Người dùng là thành viên đang hoạt động của nhóm đồng sở hữu chiếc xe đó.
  3. Phương tiện đang ở trạng thái sẵn sàng, không trong diện bảo dưỡng (`MAINTENANCE`).
* **Điều kiện sau khi thành công:** Bản ghi Booking mới được lưu vào CSDL với trạng thái `CONFIRMED`; khung giờ được khóa trên lịch chung.
* **Luồng sự kiện chính (Main Success Scenario):**
  1. Người dùng nhấp chọn chiếc xe trong không gian Virtual Garage 3D.
  2. Hệ thống hiển thị thanh thông tin phương tiện và nút chức năng "Đặt Lịch".
  3. Người dùng nhấp "Đặt Lịch", hệ thống mở `CoOwnerBookingPanel` hiển thị trục thời gian trực quan và các khoảng giờ đã có người đặt trước.
  4. Người dùng chọn thời gian bắt đầu (`startTime`), thời gian kết thúc (`endTime`) và nhập mục đích di chuyển.
  5. Người dùng nhấn nút "Xác Nhận Đặt Lịch".
  6. Frontend gửi yêu cầu `POST /api/bookings/vehicle/{vehicleId}` kèm payload JSON.
  7. Backend kiểm tra tính hợp lệ cơ bản: $startTime < endTime$ và $startTime \ge now - 120s$.
  8. Backend kiểm tra quyền thành viên: `isUserActiveMemberForVehicle(userId, vehicleId) == true`.
  9. Backend kiểm tra xung đột thời gian: truy vấn `findConflictingBookings`. Kết quả không có bản ghi xung đột.
  10. Backend lưu bản ghi Booking mới với trạng thái `CONFIRMED`.
  11. Backend trả về mã HTTP 201 Created kèm dữ liệu `BookingResponse`.
  12. Frontend cập nhật thanh tiến trình lịch đặt trên giao diện 3D và hiển thị thông báo thành công.
* **Luồng sự kiện thay thế (Alternative Scenarios):**
  * *9a. Phát hiện xung đột thời gian:* Nếu trong khoảng $[startTime, endTime]$ đã có lịch `CONFIRMED` hoặc `PENDING` khác của xe, backend ném ngoại lệ `IllegalArgumentException("Khung giờ này đã được đặt. Vui lòng chọn thời gian khác.")`, trả về HTTP 400 Bad Request. Giao diện hiển thị cảnh báo đỏ và giữ nguyên form cho người dùng chọn lại giờ.
* **Luồng ngoại lệ (Exception Scenarios):**
  * *8a. Người dùng không thuộc nhóm xe:* Backend ném `AccessDeniedException("Bạn không phải là thành viên hoạt động của nhóm đồng sở hữu xe này.")`, trả về HTTP 403 Forbidden.
  * *6a. Xe đang trong quá trình bảo dưỡng:* Backend từ chối đặt xe với thông báo lỗi `Xe đang trong quá trình bảo dưỡng, không thể đặt lịch mới`.

### 3.9.2. Đặc tả Use Case UC-TRIP-02: Hoàn Tất Trả Xe và Đối Soát Kỹ Thuật (Confirm Return)
* **Mã Use Case:** UC-TRIP-02
* **Tên Use Case:** Xác nhận hoàn tất trả xe và đối soát kỹ thuật
* **Tác nhân chính:** Nhân viên vận hành kỹ thuật (STAFF)
* **Tác nhân phụ:** Chủ đồng sở hữu (CO_OWNER)
* **Mô tả tóm tắt:** Nhân viên kỹ thuật kiểm tra thực tế phương tiện khi xe về trạm, đối chiếu chỉ số ODO, lượng pin, ghi nhận hư hỏng mới (nếu có), chốt kết thúc chuyến đi và kích hoạt động cơ trừ tồn kho năng lượng, tính chi phí.
* **Điều kiện tiên quyết:** Chuyến đi đang ở trạng thái `ACTIVE` và Co-Owner đã gửi yêu cầu trả xe (`returnRequestedAt` đã được ghi nhận).
* **Điều kiện sau khi thành công:** Chuyến đi chuyển trạng thái `COMPLETED`; xe chuyển sang `AVAILABLE`; tồn kho năng lượng được trừ chính xác số kWh tiêu thụ; khoản chi tiền điện được tạo lập và gán nghĩa vụ cho người lái.
* **Luồng sự kiện chính:**
  1. Nhân viên mở danh sách xe tại trạm, chọn xe có chuyến đi đang chờ bàn giao trả.
  2. Nhân viên mở `StaffReturnInspectionModal`, nhập chỉ số ODO thực tế, mức pin SOC thực tế và đánh giá các hạng mục kỹ thuật trong checklist.
  3. Nếu phát hiện trầy xước mới, nhân viên nhấp vào vị trí tương ứng trên mô hình 3D để tạo bản ghi `DamageRecord`.
  4. Nhân viên nhấn nút "Xác Nhận Hoàn Tất Trả Xe".
  5. Frontend gửi yêu cầu `POST /api/trips/{id}/confirm-return`.
  6. Backend kiểm tra quyền: người thực hiện phải có vai trò `STAFF` hoặc `ADMIN`.
  7. Backend kiểm tra tính hợp lệ số đo: $ODO_{verified} \ge ODO_{start}$.
  8. Backend lưu bản ghi kiểm tra kỹ thuật `VehicleInspection` và liên kết với chuyến đi.
  9. Backend cập nhật `Trip`: gán $status = COMPLETED$, $endedAt = now$, lưu chỉ số ODO và pin đối soát.
  10. Backend cập nhật trạng thái xe `Vehicle`: cập nhật ODO mới nhất, pin mới nhất, chuyển trạng thái xe về `AVAILABLE`.
  11. Backend gọi `VehicleEnergyInventoryService.recordTripConsumption`:
      * Tính $E_{consumed} = (SOC_{start} - SOC_{end}) \times C_{usable} / 100$.
      * Trừ lượng điện khả dụng trong kho xe.
      * Áp dụng đơn giá bình quân gia quyền hiện hành để tính thành tiền điện.
      * Lưu giao dịch năng lượng `VehicleEnergyTransaction (TRIP_CONSUMPTION)`.
  12. Backend gọi `ExpenseService`: tạo tự động khoản chi `Expense` loại `CHARGING` với chính sách `USER_RESPONSIBILITY`, tạo `ExpenseShare` gán đúng $100\%$ nghĩa vụ tài chính cho người lái.
  13. Backend gửi thông báo thời gian thực đến Co-Owner về kết quả nghiệm thu và chi phí cần thanh toán.
  14. Backend trả về HTTP 200 OK kèm dữ liệu `TripResponse`.

---

## 3.10. QUY TRÌNH NGHIỆP VỤ (ACTIVITY DIAGRAMS)

Quy trình nghiệp vụ của EVShare 3D được mô hình hóa bằng sơ đồ hoạt động phân làn (Swimlane Activity Diagrams) chi tiết giữa 3 làn: Chủ đồng sở hữu, Nhân viên điều hành và Hệ thống Backend. Các sơ đồ tiêu biểu bao gồm:
1. **Quy trình Đặt lịch và Ngăn ngừa xung đột:** Đã được thể hiện chi tiết tại tệp `diagrams/activity/booking_activity.puml`.
2. **Quy trình Bàn giao, Trả xe và Đối soát năng lượng:** Đã được thể hiện chi tiết tại tệp `diagrams/activity/vehicle_return_and_inspection_activity.puml`.
3. **Quy trình Phân bổ chi phí và Xác minh thanh toán:** Thể hiện dòng chảy từ lúc phát sinh hóa đơn, áp dụng thuật toán phần dư Hare-Niemeyer, thành viên gửi mã thanh toán DEMO, đến lúc nhân viên đối chiếu và phê duyệt dứt điểm nghĩa vụ.

---

## 3.11. ĐÁNH GIÁ TÍNH KHẢ THI CỦA HỆ THỐNG

### 3.11.1. Tính khả thi về mặt kỹ thuật (Technical Feasibility)
Hệ thống hoàn toàn khả thi về mặt kỹ thuật nhờ vào sự trưởng thành vượt bậc của hệ sinh thái công nghệ được lựa chọn:
* Java 21 và Spring Boot 3.3.4 cung cấp nền tảng xử lý đa luồng, quản lý giao dịch và bảo mật doanh nghiệp đã được kiểm chứng trên toàn cầu.
* Three.js (r173) và WebGL 2.0 được hỗ trợ nguyên bản trên $100\%$ các trình duyệt Web hiện đại mà không đòi hỏi cài đặt thêm phần mềm phụ trợ.
* Việc ứng dụng các định dạng chuẩn hóa (GLTF/GLB) và kiến trúc RESTful API JSON bảo đảm sự tương thích và ổn định tuyệt đối giữa client và server.

### 3.11.2. Tính khả thi về mặt vận hành và kinh tế (Operational & Economic Feasibility)
* **Về mặt kinh tế:** Nền tảng giúp tiết kiệm từ 50% đến 75% chi phí sở hữu ô tô cá nhân cho mỗi hộ gia đình tại đô thị thông qua việc chia sẻ nguồn vốn đầu tư và chi phí duy trì.
* **Về mặt vận hành:** Quy trình 3 bên minh bạch (Chủ xe - Nhân viên trạm - Hệ thống tự động) giúp triệt tiêu hoàn toàn các tranh chấp tiềm tàng về tình trạng xe, lịch trình và chi phí điện năng.

### 3.11.3. Các giới hạn thực tiễn của phiên bản hiện tại
Mặc dù hệ thống đã vận hành hoàn chỉnh trên môi trường thử nghiệm, báo cáo xác nhận các giới hạn kỹ thuật cần được tiếp tục hoàn thiện trước khi đưa vào khai thác thương mại quy mô lớn:
1. Chức năng thanh toán đang vận hành ở chế độ mô phỏng **DEMO Mode**, chưa kết nối trực tiếp đến cổng thanh toán ngân hàng tự động (VNPay/VietQR API).
2. Quy trình ký kết hợp đồng số sử dụng chữ ký mô phỏng nội bộ, chưa tích hợp chứng thư số công cộng PKI có giá trị pháp lý theo Luật Giao dịch điện tử.
3. Thông số pin và nạp sạc được tính toán qua mô hình toán phần mềm, chưa kết nối trực tiếp với thiết bị phần cứng vi điều khiển IoT (OBD-II Telemetry) trên xe thực tế.

---

### TÓM TẮT CHƯƠNG 3
Chương 3 đã tiến hành khảo sát và phân tích toàn diện các yêu cầu nghiệp vụ của hệ thống quản lý xe điện đồng sở hữu EVShare 3D. Hệ thống đã xác định rõ nét vai trò, thẩm quyền của 3 tác nhân chính, thiết lập ma trận phân quyền chặt chẽ, đặc tả chi tiết 19 nhóm yêu cầu chức năng, các yêu cầu phi chức năng cùng 20 quy tắc nghiệp vụ bất biến. Các kịch bản Use Case và sơ đồ hoạt động đã mô hình hóa chuẩn xác sự phối hợp nhịp nhàng giữa các thực thể, tạo cơ sở đặc tả đầu vào vững chắc để tiến hành thiết kế kiến trúc chi tiết trong Chương 4.
