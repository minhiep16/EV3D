# -*- coding: utf-8 -*-
"""
gen_v4_usecases_part1.py - Tạo 45 Use Case đầu tiên (AUTH, 3D, OWN, CON, BOOK, TRIP)
với mô tả nghiệp vụ và kỹ thuật chi tiết 100%, không lặp generic template.
"""

UCS_PART1 = [
    # =========================================================================
    # 1. AUTHENTICATION & ACCESS CONTROL (7 UCs)
    # =========================================================================
    {
        "id": "UC-AUTH-01",
        "name": "Đăng nhập hệ thống và cấp phát Token JWT",
        "primary_actor": "Người dùng (Khách vãng lai / Thành viên)",
        "secondary_actor": "Hệ thống xác thực Spring Security & CSDL",
        "description": "Người dùng nhập thông tin email và mật khẩu để xác thực tài khoản, nhận cặp mã JWT Access Token và Refresh Token để truy cập các dịch vụ được phân quyền.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Đăng nhập' tại màn hình LoginForm.",
        "preconditions": "Tài khoản người dùng đã được kích hoạt trong CSDL; máy khách kết nối internet bình thường.",
        "postconditions": "Cấp cặp Token JWT, lưu trữ Access Token trong bộ nhớ phiên và Refresh Token tại HTTP-Only Cookie / LocalStorage, xác lập Security Context.",
        "main_flow": (
            "1. Người dùng truy cập đường dẫn `/login` và hiển thị màn hình LoginForm.\n"
            "2. Người dùng nhập địa chỉ email và mật khẩu tài khoản, nhấn nút 'Đăng nhập'.\n"
            "3. Ứng dụng Frontend kiểm tra tính hợp lệ cú pháp form và gửi HTTP POST tới endpoint `/api/auth/login` kèm payload `LoginRequest` (email, password).\n"
            "4. Bộ lọc `JwtAuthenticationFilter` cho phép request đi qua tới `AuthController:login()`.\n"
            "5. `AuthService` gọi `AuthenticationManager.authenticate()` để xác thực thông tin đăng nhập.\n"
            "6. Hệ thống đối chiếu hash mật khẩu bằng `BCryptPasswordEncoder` với mã băm lưu tại bảng `users`.\n"
            "7. Khi mật khẩu trùng khớp, `JwtService` sinh mã `Access Token` (thời hạn 15 phút, chứa claim userId, email, role) và `Refresh Token` (thời hạn 7 ngày).\n"
            "8. Bản ghi mới được tạo trong bảng `refresh_tokens` lưu chuỗi token băm, ngày hết hạn và trạng thái revoked = false.\n"
            "9. Máy chủ trả về HTTP 200 OK kèm payload `AuthResponse` chứa access token, refresh token và hồ sơ người dùng.\n"
            "10. Frontend lưu trữ token, cập nhật trạng thái đăng nhập trong `authStore` và điều hướng người dùng tới `/garage`."
        ),
        "alt_flow": (
            "Tại bước 6, nếu tài khoản người dùng có trạng thái LOCKED hoặc INACTIVE: Hệ thống từ chối xác thực, trả về HTTP 403 Forbidden kèm thông báo 'Tài khoản của bạn đã bị tạm khóa. Vui lòng liên hệ quản trị viên'."
        ),
        "exception_flow": (
            "Tại bước 6, nếu email không tồn tại hoặc mật khẩu không khớp: `AuthenticationManager` ném `BadCredentialsException`, Controller trả về HTTP 401 Unauthorized kèm thông báo 'Email hoặc mật khẩu không chính xác'. Giao diện hiển thị cảnh báo đỏ và giữ nguyên trường email."
        ),
        "business_rules": "BR-AUTH-01, BR-AUTH-02, BR-SEC-01",
        "related_fr": "FR-AUTH-02",
        "related_tc": "TC-AUTH-01"
    },
    {
        "id": "UC-AUTH-02",
        "name": "Đăng xuất và thu hồi phiên làm việc",
        "primary_actor": "Người dùng đang đăng nhập",
        "secondary_actor": "Hệ thống xác thực và CSDL",
        "description": "Người dùng chủ động kết thúc phiên làm việc, hệ thống thu hồi Refresh Token trên máy chủ và xóa sạch thông tin xác thực trên trình duyệt máy khách.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấn chọn 'Đăng xuất' trên thanh điều hướng người dùng hoặc menu cài đặt.",
        "preconditions": "Người dùng đang duy trì phiên đăng nhập hợp lệ với Bearer Token.",
        "postconditions": "Refresh Token bị đánh dấu revoked = true trong CSDL, xóa token tại máy khách, điều hướng về màn hình đăng nhập.",
        "main_flow": (
            "1. Người dùng nhấn nút 'Đăng xuất' từ menu tài khoản `UserDropdownMenu.tsx`.\n"
            "2. Hệ thống hiển thị hộp thoại xác nhận 'Bạn có chắc chắn muốn đăng xuất?'. Người dùng nhấn 'Xác nhận'.\n"
            "3. Frontend gửi HTTP POST tới `/api/auth/logout` kèm Bearer Access Token trong Authorization Header và payload chứa Refresh Token hiện thời.\n"
            "4. `JwtAuthenticationFilter` xác thực tính hợp lệ của Access Token và chuyển tiếp request tới `AuthController:logout()`.\n"
            "5. `AuthService` truy vấn bản ghi tương ứng trong bảng `refresh_tokens` và cập nhật trường `revoked = true`, `updated_at = NOW()`.\n"
            "6. Hệ thống ghi nhật ký kiểm toán hành vi đăng xuất vào bảng `audit_logs`.\n"
            "7. Máy chủ trả về HTTP 200 OK với thông điệp 'Đăng xuất thành công'.\n"
            "8. Frontend thực thi action `authStore.logout()`, xóa Access Token và Refresh Token khỏi LocalStorage / SessionStorage.\n"
            "9. Xóa toàn bộ dữ liệu tạm trong Zustand state (thông tin xe, lịch đặt, thông báo).\n"
            "10. Điều hướng trình duyệt về màn hình công khai `/login`."
        ),
        "alt_flow": (
            "Tại bước 3, nếu mạng bị ngắt kết nối: Frontend vẫn chủ động xóa token trong bộ nhớ máy khách và chuyển hướng về trang `/login` để bảo đảm an toàn trên thiết bị người dùng."
        ),
        "exception_flow": (
            "Tại bước 5, nếu Refresh Token không tìm thấy trong CSDL hoặc đã bị thu hồi trước đó: Hệ thống trả về HTTP 400 Bad Request. Frontend vẫn dọn dẹp bộ nhớ máy khách và hoàn tất đăng xuất."
        ),
        "business_rules": "BR-AUTH-02, BR-AUTH-03",
        "related_fr": "FR-AUTH-04",
        "related_tc": "TC-AUTH-04"
    },
    {
        "id": "UC-AUTH-03",
        "name": "Đăng ký tài khoản thành viên (Register)",
        "primary_actor": "Khách vãng lai / Người dùng mới",
        "secondary_actor": "Hệ thống xác thực và CSDL",
        "description": "Người dùng mới điền thông tin đăng ký tài khoản bao gồm họ tên, email, số điện thoại và mật khẩu để tham gia vào hệ sinh thái EVShare.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Đăng ký tài khoản' tại màn hình RegisterForm.",
        "preconditions": "Email và số điện thoại chưa từng được đăng ký trong hệ thống.",
        "postconditions": "Bản ghi người dùng mới được tạo trong bảng `users` với vai trò mặc định `CO_OWNER`.",
        "main_flow": (
            "1. Người dùng truy cập trang `/register` và mở giao diện `RegisterForm.tsx`.\n"
            "2. Người dùng nhập đầy đủ các trường: Họ và tên, Email, Số điện thoại, Mật khẩu và Xác nhận mật khẩu.\n"
            "3. Frontend kiểm tra tính hợp lệ: định dạng email chuẩn RFC 5322, số điện thoại Việt Nam (10 chữ số), mật khẩu thỏa mãn độ phức tạp (chữ hoa, số, ký tự đặc biệt) và khớp mật khẩu xác nhận.\n"
            "4. Người dùng nhấn nút 'Tạo tài khoản'. Frontend gửi HTTP POST tới `/api/auth/register` kèm payload `RegisterRequest`.\n"
            "5. Controller `AuthController:register()` tiếp nhận và kiểm tra ràng buộc DTO bằng Bean Validation `@Valid`.\n"
            "6. `AuthService` kiểm tra sự tồn tại của email qua `UserRepository.existsByEmail()` và số điện thoại qua `UserRepository.existsByPhoneNumber()`.\n"
            "7. Mật khẩu gốc được băm an toàn qua thuật toán `BCryptPasswordEncoder`.\n"
            "8. Tạo thực thể `User` mới với role = `CO_OWNER`, activeStatus = `ACTIVE`, tạo thời điểm created_at = NOW() và lưu vào bảng `users`.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm payload thông tin tài khoản vừa tạo (không bao gồm mật khẩu băm).\n"
            "10. Giao diện thông báo 'Đăng ký tài khoản thành công' và tự động chuyển hướng người dùng sang trang `/login`."
        ),
        "alt_flow": (
            "Tại bước 6, nếu email hoặc số điện thoại đã tồn tại trong CSDL: `AuthService` ném `ResourceAlreadyExistsException`, trả về HTTP 409 Conflict kèm thông báo 'Email hoặc số điện thoại này đã được sử dụng. Vui lòng đăng nhập hoặc chọn thông tin khác'."
        ),
        "exception_flow": (
            "Tại bước 5, nếu dữ liệu không thỏa mãn độ phức tạp mật khẩu hoặc định dạng số điện thoại: Tầng Validation chặn lại và trả về HTTP 400 Bad Request kèm danh sách chi tiết các trường dữ liệu vi phạm. Giao diện hiển thị viền đỏ dưới các ô nhập liệu tương ứng."
        ),
        "business_rules": "BR-AUTH-01, BR-SEC-01",
        "related_fr": "FR-AUTH-01",
        "related_tc": "TC-AUTH-02"
    },
    {
        "id": "UC-AUTH-04",
        "name": "Làm mới Token xác thực (Refresh Token)",
        "primary_actor": "Máy khách ứng dụng Frontend (Tự động kích hoạt)",
        "secondary_actor": "Dịch vụ xác thực JWT và CSDL",
        "description": "Cơ chế tự động cấp mới Access Token khi mã hiện thời hết hạn (15 phút) bằng cách sử dụng Refresh Token hợp lệ mà không làm gián đoạn trải nghiệm người dùng.",
        "priority": "Bắt buộc (High)",
        "trigger": "Axios Interceptor trên máy khách nhận mã phản hồi HTTP 401 từ bất kỳ yêu cầu nghiệp vụ nào.",
        "preconditions": "Refresh Token còn hạn sử dụng, chưa bị đánh dấu thu hồi (revoked = false).",
        "postconditions": "Cấp Access Token mới với hạn dùng 15 phút, cập nhật thời điểm sử dụng gần nhất của Refresh Token.",
        "main_flow": (
            "1. Ứng dụng Frontend gửi yêu cầu nghiệp vụ và nhận phản hồi HTTP 401 Unauthorized do Access Token hết hạn.\n"
            "2. Axios Interceptor `apiClient.ts` chặn phản hồi 401 và đưa request hiện tại vào hàng đợi tạm (Queue).\n"
            "3. Frontend trích xuất Refresh Token đang lưu trữ và gửi HTTP POST tới `/api/auth/refresh` kèm payload `RefreshTokenRequest`.\n"
            "4. Controller `AuthController:refreshToken()` tiếp nhận yêu cầu.\n"
            "5. `AuthService` truy vấn bản ghi token trong bảng `refresh_tokens` bằng chuỗi token nhận được.\n"
            "6. Hệ thống kiểm tra hai điều kiện: token chưa bị thu hồi (`revoked == false`) và thời điểm hết hạn chưa tới (`expiry_date > NOW()`).\n"
            "7. `JwtService` tiến hành sinh mã `Access Token` mới với thời hạn sống 15 phút, giữ nguyên userId và role của người dùng.\n"
            "8. Cập nhật trường `updated_at = NOW()` cho bản ghi Refresh Token trong CSDL.\n"
            "9. Máy chủ trả về HTTP 200 OK kèm mã `accessToken` mới.\n"
            "10. Axios Interceptor cập nhật token mới vào header `Authorization: Bearer <token>` và tự động thực thi lại các request đang nằm chờ trong hàng đợi."
        ),
        "alt_flow": (
            "Tại bước 6, nếu Refresh Token đã hết hạn sử dụng (> 7 ngày): Hệ thống cập nhật `revoked = true` trong CSDL, trả về HTTP 403 Forbidden kèm thông báo 'Phiên làm việc đã hết hạn. Vui lòng đăng nhập lại'."
        ),
        "exception_flow": (
            "Tại bước 5, nếu Refresh Token không tồn tại hoặc chữ ký HMAC không hợp lệ: `AuthService` ném `TokenRefreshException`, trả về HTTP 401. Axios Interceptor xóa sạch toàn bộ token tại máy khách và chuyển hướng người dùng về `/login`."
        ),
        "business_rules": "BR-AUTH-02, BR-AUTH-03",
        "related_fr": "FR-AUTH-03",
        "related_tc": "TC-AUTH-03"
    },
    {
        "id": "UC-AUTH-05",
        "name": "Xem thông tin hồ sơ cá nhân (View Profile)",
        "primary_actor": "Người dùng đang đăng nhập",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ người dùng",
        "description": "Người dùng tra cứu thông tin tài khoản chi tiết của bản thân bao gồm họ tên, email, số điện thoại, vai trò và trạng thái hoạt động.",
        "primary_actor": "Người dùng hệ thống",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng nhấn chọn 'Hồ sơ của tôi' trên thanh điều hướng.",
        "preconditions": "Người dùng đang duy trì phiên đăng nhập hợp lệ với Bearer Token.",
        "postconditions": "Thông tin hồ sơ được hiển thị chi tiết trên giao diện `UserProfilePanel.tsx`.",
        "main_flow": (
            "1. Người dùng mở trang hồ sơ cá nhân `/profile`.\n"
            "2. Giao diện kích hoạt hook `useCurrentUser()` gửi HTTP GET tới `/api/auth/me` kèm Bearer Token.\n"
            "3. `JwtAuthenticationFilter` giải mã token, nạp thông tin `UserPrincipal` vào Spring Security Context Holder.\n"
            "4. Controller `AuthController:getMe()` trích xuất `UserPrincipal` từ annotation `@AuthenticationPrincipal`.\n"
            "5. `UserService` truy vấn chi tiết thực thể `User` từ bảng `users` thông qua khóa chính `userId`.\n"
            "6. Thực thể được chuyển đổi (map) sang `UserResponse` DTO, loại bỏ hoàn toàn mã băm mật khẩu `passwordHash`.\n"
            "7. Máy chủ trả về HTTP 200 OK kèm payload hồ sơ: `id`, `fullName`, `email`, `phoneNumber`, `role`, `activeStatus`, `createdAt`.\n"
            "8. Giao diện hiển thị các trường thông tin trong khung `UserProfilePanel.tsx` kèm huy hiệu định danh vai trò (CO_OWNER / STAFF / ADMIN)."
        ),
        "alt_flow": (
            "Tại bước 5, nếu không tìm thấy bản ghi người dùng trong CSDL: Hệ thống trả về HTTP 404 Not Found kèm thông báo 'Không tìm thấy thông tin tài khoản người dùng'."
        ),
        "exception_flow": (
            "Tại bước 3, nếu Access Token không hợp lệ hoặc hết hạn: Bộ lọc Security chặn request và trả về HTTP 401 Unauthorized. Giao diện kích hoạt luồng Refresh Token tự động."
        ),
        "business_rules": "BR-SEC-01",
        "related_fr": "FR-AUTH-05",
        "related_tc": "TC-AUTH-05"
    },
    {
        "id": "UC-AUTH-06",
        "name": "Cập nhật thông tin hồ sơ cá nhân (Update Profile)",
        "primary_actor": "Người dùng đang đăng nhập",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Cho phép người dùng chỉnh sửa họ tên và số điện thoại liên lạc cá nhân, lưu trữ và ghi nhận cập nhật vào CSDL.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng nhấn nút 'Lưu thay đổi' tại form chỉnh sửa hồ sơ.",
        "preconditions": "Người dùng đang đăng nhập, số điện thoại mới không bị trùng lặp với người dùng khác.",
        "postconditions": "Cập nhật bản ghi trong bảng `users`, phát sinh thông báo thành công.",
        "main_flow": (
            "1. Người dùng mở chế độ chỉnh sửa thông tin tại trang `/profile`.\n"
            "2. Người dùng sửa đổi trường 'Họ và tên' hoặc 'Số điện thoại', nhấn nút 'Lưu cập nhật'.\n"
            "3. Frontend kiểm tra định dạng dữ liệu đầu vào và gửi HTTP PUT tới `/api/users/profile` kèm payload `UpdateProfileRequest`.\n"
            "4. Controller tiếp nhận request và chuyển tới `UserService:updateProfile()`.\n"
            "5. Hệ thống kiểm tra nếu số điện thoại thay đổi: truy vấn `UserRepository.existsByPhoneNumberAndIdNot()` để bảo đảm tính duy nhất.\n"
            "6. Cập nhật các trường `full_name`, `phone_number`, `updated_at = NOW()` của thực thể `User`.\n"
            "7. Lưu thực thể vào CSDL qua `UserRepository.save()` và ghi bản ghi nhật ký kiểm toán `audit_logs`.\n"
            "8. Máy chủ trả về HTTP 200 OK kèm thông tin hồ sơ đã cập nhật `UserResponse`.\n"
            "9. Frontend cập nhật lại dữ liệu hiển thị trên giao diện và hiển thị Toast thông báo 'Cập nhật hồ sơ thành công'."
        ),
        "alt_flow": (
            "Tại bước 5, nếu số điện thoại mới trùng lặp với tài khoản khác trong hệ thống: Hệ thống trả về HTTP 409 Conflict kèm thông báo 'Số điện thoại này đã được đăng ký bởi tài khoản khác'."
        ),
        "exception_flow": (
            "Tại bước 3, nếu định dạng số điện thoại không hợp lệ (ít hơn 10 số hoặc chứa ký tự chữ): Tầng Validation ném lỗi 400 Bad Request, giao diện hiển thị cảnh báo lỗi dưới trường nhập liệu."
        ),
        "business_rules": "BR-SEC-02",
        "related_fr": "FR-AUTH-06",
        "related_tc": "TC-AUTH-06"
    },
    {
        "id": "UC-AUTH-07",
        "name": "Đổi mật khẩu tài khoản (Change Password)",
        "primary_actor": "Người dùng đang đăng nhập",
        "secondary_actor": "Hệ thống xác thực và CSDL",
        "description": "Người dùng thay đổi mật khẩu đăng nhập của mình bằng cách cung cấp mật khẩu hiện tại chính xác và mật khẩu mới an toàn.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng nhấn nút 'Cập nhật mật khẩu' tại màn hình bảo mật tài khoản.",
        "preconditions": "Mật khẩu cũ trùng khớp với mật khẩu đang lưu trữ; mật khẩu mới thỏa mãn yêu cầu bảo mật.",
        "postconditions": "Mã băm mật khẩu mới được lưu vào CSDL, thu hồi toàn bộ Refresh Token cũ để bảo vệ tài khoản.",
        "main_flow": (
            "1. Người dùng mở tab 'Bảo mật' trong trang `/profile`.\n"
            "2. Người dùng nhập: Mật khẩu hiện tại, Mật khẩu mới và Nhập lại mật khẩu mới.\n"
            "3. Frontend kiểm tra mật khẩu mới không được trùng mật khẩu cũ và khớp với trường nhập lại.\n"
            "4. Người dùng nhấn 'Cập nhật mật khẩu'. Frontend gửi HTTP POST tới `/api/auth/change-password` kèm payload `ChangePasswordRequest`.\n"
            "5. Controller tiếp nhận yêu cầu và chuyển tới `AuthService:changePassword()`.\n"
            "6. Hệ thống đối chiếu mật khẩu cũ với `user.getPasswordHash()` bằng `BCryptPasswordEncoder.matches()`.\n"
            "7. Nếu khớp, mật khẩu mới được băm bảo mật bằng BCrypt và gán vào `user.setPasswordHash()`.\n"
            "8. Thu hồi toàn bộ các Refresh Token đang hoạt động của người dùng trong bảng `refresh_tokens` (`revoked = true`).\n"
            "9. Lưu thay đổi vào CSDL và ghi bản ghi `audit_logs`.\n"
            "10. Máy chủ trả về HTTP 200 OK. Frontend thông báo 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại bằng mật khẩu mới' và điều hướng về trang `/login`."
        ),
        "alt_flow": (
            "Tại bước 6, nếu mật khẩu hiện tại không khớp: `AuthService` ném `BadCredentialsException`, trả về HTTP 400 Bad Request kèm thông báo 'Mật khẩu hiện tại không chính xác'."
        ),
        "exception_flow": (
            "Tại bước 3, nếu mật khẩu mới trùng lặp 100% với mật khẩu hiện tại: Hệ thống chặn lại và cảnh báo 'Mật khẩu mới không được trùng với mật khẩu đang sử dụng'."
        ),
        "business_rules": "BR-AUTH-01, BR-AUTH-03, BR-SEC-01",
        "related_fr": "FR-AUTH-06",
        "related_tc": "TC-AUTH-07"
    },

    # =========================================================================
    # 2. 3D DIGITAL TWIN & INTERACTIVE VISUALIZATION (7 UCs)
    # TOÀN BỘ CLIENT-SIDE WEBGL / THREE.JS / R3F / ZUSTAND (KHÔNG GỌI API / CSDL)
    # =========================================================================
    {
        "id": "UC-3D-01",
        "name": "Chọn và chuyển đổi xe hiển thị trên bục xoay 3D",
        "primary_actor": "Người dùng giao diện Garage 3D (Đồng sở hữu / Nhân viên)",
        "secondary_actor": "Three.js Scene Manager & GPU Renderer",
        "description": "Người dùng duyệt danh sách xe điện trong nhóm qua thanh trượt Carousel dưới chân màn hình và nhấp chọn xe để đưa mô hình 3D tương ứng lên bục xoay trung tâm của không gian Garage ảo.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấp vào một thẻ xe trong `CoOwnerQuickActionDock` hoặc xoay thanh cuộn Carousel.",
        "preconditions": "Trình duyệt hỗ trợ WebGL 2.0; tệp mô hình 3D GLB/GLTF của xe đã được tải trước (preloaded) vào bộ nhớ đệm máy khách.",
        "postconditions": "Mô hình xe cũ bị unmount khỏi Scenegraph, mô hình xe mới được render với đầy đủ vật liệu PBR và đổ bóng tại tâm tọa độ (0, 0, 0).",
        "main_flow": (
            "1. Người dùng mở màn hình Garage 3D tại đường dẫn `/garage`.\n"
            "2. Giao diện hiển thị không gian Garage ảo 3D qua R3F Canvas và thanh trượt danh sách xe `CoOwnerQuickActionDock.tsx` ở cạnh đáy màn hình.\n"
            "3. Người dùng nhấp chọn một xe khác trong danh sách (ví dụ chuyển từ VinFast VF8 sang VF9).\n"
            "4. Component kích hoạt Zustand action `worldStore.selectVehicle(vehicleId)` và `setCoOwnerCarouselFocusedIndex(index)`.\n"
            "5. Store cập nhật thuộc tính `selectedVehicleId` trong bộ nhớ state máy khách (không gửi request mạng).\n"
            "6. Trình bao bọc `VehicleDigitalTwin.tsx` phát hiện sự thay đổi ID qua React Hook và kích hoạt hiệu ứng mờ dần (Fade Out) mô hình xe hiện tại.\n"
            "7. Three.js Scenegraph giải phóng bộ nhớ hình học (Geometry.dispose) và vật liệu (Material.dispose) của xe cũ khỏi GPU đệm.\n"
            "8. Hook `useGLTF` tải nạp cấu trúc Mesh và Texture PBR của phương tiện mới từ bộ nhớ Cache trình duyệt.\n"
            "9. Mô hình xe mới được gắn vào tâm bục xoay tại tọa độ (0, 0, 0), kích hoạt hiệu ứng chuyển cảnh mượt mà (Fade In) trong 400ms.\n"
            "10. OrbitControls tự động điều chỉnh khoảng cách ngắm phù hợp với kích thước bao (Bounding Box) của mẫu xe mới."
        ),
        "alt_flow": (
            "Tại bước 8, nếu mô hình xe mới chưa có sẵn trong bộ nhớ đệm: Hệ thống hiển thị hiệu ứng xoay tải nhẹ (Loading Spinner 3D Wireframe) tại bục xoay cho đến khi quá trình parse GLTF hoàn tất."
        ),
        "exception_flow": (
            "Tại bước 8, nếu tệp mô hình 3D bị lỗi tệp hoặc GPU hết bộ nhớ VRAM: Three.js ném ngoại lệ WebGL Error. Hệ thống kích hoạt ErrorBoundary và hiển thị thẻ thông tin xe dạng 2D tĩnh thay thế."
        ),
        "business_rules": "BR-3D-01",
        "related_fr": "FR-3D-01",
        "related_tc": "TC-3D-01"
    },
    {
        "id": "UC-3D-02",
        "name": "Xem thông số kỹ thuật xe qua thẻ Hologram 3D",
        "primary_actor": "Người dùng giao diện Garage 3D",
        "secondary_actor": "React Three Fiber HTML Overlay & Zustand Store",
        "description": "Người dùng kích hoạt chế độ xem thông số để hiển thị các bảng thông tin Hologram 3D lơ lửng xung quanh xe (mức pin SOC, quãng đường còn lại, công suất động cơ, nhiệt độ lốp).",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng nhấn nút 'Bật thẻ thông số kỹ thuật' trên thanh công cụ điều khiển 3D.",
        "preconditions": "Mô hình xe đang hiển thị trên bục xoay trung tâm Garage.",
        "postconditions": "Các thẻ Hologram 3D xuất hiện lơ lửng tại các tọa độ không gian neo (Anchor points) quanh thân xe.",
        "main_flow": (
            "1. Người dùng quan sát mô hình xe 3D trên màn hình `/garage`.\n"
            "2. Người dùng nhấn nút biểu tượng 'Hologram Specs' trên thanh công cụ `FloatingActionControls.tsx`.\n"
            "3. Component kích hoạt Zustand action `worldStore.setExploreHotspotsVisible(true)`.\n"
            "4. R3F Scenegraph mount component `<VehicleTelemetryHolograms />`.\n"
            "5. Hệ thống tính toán ma trận hình chiếu World-to-Screen Matrix cho 4 điểm neo không gian: nắp capo (động cơ), gầm xe (khối pin), lốp trước bên lái (áp suất lốp) và nóc xe (tổng quan).\n"
            "6. Thẻ Hologram kết xuất bằng `@react-three/drei <Html center>` với hiệu ứng CSS backdrop-filter mờ kính và viền phát sáng Cyan.\n"
            "7. Khi người dùng xoay camera bằng chuột, các thẻ Hologram tự động xoay mặt vuông góc với góc nhìn camera (Billboard mode) để bảo đảm chữ luôn dễ đọc.\n"
            "8. Người dùng xem thông tin chi tiết: Dung lượng pin 82 kWh, SOH 96.5%, Tầm hoạt động ước tính 420 km, Áp suất lốp 2.4 bar."
        ),
        "alt_flow": (
            "Tại bước 7, nếu người dùng xoay camera ra quá xa (> 15 mét): Các thẻ Hologram tự động giảm độ mờ (opacity lerp về 0) để không làm rối không gian quan sát toàn cảnh."
        ),
        "exception_flow": (
            "Tại bước 5, nếu ma trận camera bị lỗi chia cho 0 khi thu phóng cực đại: Thẻ Hologram tự động khóa hiển thị ở tọa độ màn hình mặc định để không gây gián đoạn khung hình."
        ),
        "business_rules": "BR-3D-01",
        "related_fr": "FR-3D-01",
        "related_tc": "TC-3D-02"
    },
    {
        "id": "UC-3D-03",
        "name": "Khám phá bóc tách các cụm chi tiết xe 3D",
        "primary_actor": "Người dùng giao diện Garage 3D",
        "secondary_actor": "Three.js Raycaster & Shader Material Engine",
        "description": "Người dùng rê chuột và nhấp chọn từng bộ phận xe (cửa xe, capo, cốp xe, lốp xe) để thực hiện bóc tách, kích hoạt hoạt ảnh mở cửa hoặc xem cấu tạo chi tiết linh kiện bên trong.",
        "primary_actor": "Người dùng giao diện 3D",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng di chuột (Hover) hoặc nhấp chuột (Click) lên bề mặt Mesh của mô hình xe.",
        "preconditions": "Mô hình xe có cấu trúc Mesh phân cấp chuẩn (Hierarchy Nodes: Door_FL, Door_FR, Hood, Trunk, Wheels).",
        "postconditions": "Bộ phận được chọn được highlight đường viền (Outline Effect) và mở bảng điều khiển chi tiết linh kiện.",
        "main_flow": (
            "1. Người dùng di chuyển con trỏ chuột trên vùng Canvas 3D của xe.\n"
            "2. Tại mỗi khung hình render (RequestAnimationFrame), Three.js `Raycaster` phát một tia từ tọa độ chuột (Normalized Device Coordinates) xuyên qua không gian 3D.\n"
            "3. Raycaster kiểm tra va chạm (Intersection) với danh sách Mesh con của mô hình xe.\n"
            "4. Khi con trỏ chuột lướt qua một bộ phận (ví dụ: Cửa trước bên lái `Door_FL`): con trỏ đổi sang dạng pointer, Mesh được gán vật liệu phát sáng nhẹ (Emissive Color #00FFFF).\n"
            "5. Người dùng nhấn chuột trái lên bộ phận đó.\n"
            "6. Hệ thống dispatch Zustand action `selectVehiclePartWithPoint(partName, hitPoint)`.\n"
            "7. Scenegraph kích hoạt hiệu ứng xoay mở cánh cửa góc 45 độ quanh trục bản lề bằng hoạt ảnh nội suy GSAP mượt mà trong 600ms.\n"
            "8. Bảng thông tin linh kiện bên phải hiển thị tên cụm chi tiết: 'Cửa trước bên lái - Vật liệu hợp kim nhôm, kính cường lực cách âm 2 lớp'."
        ),
        "alt_flow": (
            "Tại bước 5, nếu người dùng nhấp đúp (Double-Click) vào khoảng trống không gian Garage: Hoạt ảnh đóng toàn bộ cửa xe được kích hoạt, góc mở trở về 0 độ."
        ),
        "exception_flow": (
            "Tại bước 3, nếu tia Raycaster va chạm đồng thời nhiều Mesh chồng lớp: Thuật toán chọn lọc Mesh có cự ly `distance` gần camera nhất để highlight chính xác bề mặt ngoài cùng."
        ),
        "business_rules": "BR-3D-01",
        "related_fr": "FR-3D-02",
        "related_tc": "TC-3D-03"
    },
    {
        "id": "UC-3D-04",
        "name": "Kích hoạt chế độ X-Ray kiểm tra khối pin",
        "primary_actor": "Đồng sở hữu, Kỹ thuật viên bảo dưỡng",
        "secondary_actor": "Three.js Custom Shader Material & Zustand Store",
        "description": "Người dùng bật chế độ X-Ray để làm mờ toàn bộ vỏ xe ngoại thất, làm nổi bật cụm cell pin dưới gầm xe để kiểm tra cấu trúc mô-đun pin và tình trạng phân bố nhiệt độ.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấn nút 'Chế độ X-Ray Pin' trên thanh công cụ 3D.",
        "preconditions": "Mô hình xe đang hiển thị hoàn chỉnh; Mesh khối pin (`BatteryPackMesh`) nằm bên trong cấu trúc xe.",
        "postconditions": "Vỏ xe chuyển sang vật liệu trong suốt mờ ảo; khối pin phát sáng màu vàng cam với đường bao tế bào cell pin rõ nét.",
        "main_flow": (
            "1. Người dùng đang xem toàn cảnh ngoại thất xe tại `/garage`.\n"
            "2. Người dùng nhấp chọn biểu tượng 'Pin X-Ray' trên bảng điều khiển `FloatingActionControls.tsx`.\n"
            "3. Zustand store nhận action `worldStore.enterBatteryXrayMode()`.\n"
            "4. Thuộc tính `isBatteryXrayMode` trong Store chuyển sang giá trị `true` (xử lý hoàn toàn trong bộ nhớ máy khách, không phát sinh request mạng).\n"
            "5. Hook `useLayoutEffect` duyệt qua toàn bộ các Mesh vỏ thân xe (Body_Panels, Glass, Doors, Hood) và lưu trữ thông số vật liệu gốc vào bộ nhớ đệm máy khách.\n"
            "6. Các Mesh vỏ xe được gán thuộc tính mới: `material.transparent = true`, `material.opacity = 0.15`, `material.depthWrite = false`.\n"
            "7. Mesh khối pin `BatteryPack` dưới sàn xe được kích hoạt hiển thị với màu sắc cam vàng `#FF8C00`, độ phát xạ `emissiveIntensity = 0.8` và gán viền sáng dạ quang (Glow Rim).\n"
            "8. Camera tự động hạ thấp góc nhìn (pitch down) xuống góc 25 độ so với mặt đất để hướng trọng tâm quan sát vào cụm pin gầm xe.\n"
            "9. Thẻ thông số nổi hiển thị thông tin tế bào pin: 96 cell mô-đun nối tiếp, nhiệt độ khối pin 28.5°C, chu kỳ nạp xả 142 cycles."
        ),
        "alt_flow": (
            "Tại bước 2, nếu người dùng nhấn nút lần thứ hai (tắt chế độ X-Ray): Store dispatch `exitBatteryXrayMode()`, toàn bộ vật liệu vỏ xe được khôi phục nguyên vẹn độ mờ đục gốc (opacity = 1.0, transparent = false) trong 300ms."
        ),
        "exception_flow": (
            "Tại bước 6, nếu thiết bị có card đồ họa yếu không hỗ trợ tính năng depthWrite/alpha blending phức tạp: Hệ thống tự động chuyển vỏ xe sang dạng lưới khung dây (Wireframe Material) để duy trì tốc độ 60 FPS mượt mà."
        ),
        "business_rules": "BR-3D-02",
        "related_fr": "FR-3D-04",
        "related_tc": "TC-3D-04"
    },
    {
        "id": "UC-3D-05",
        "name": "Tương tác nhấp chọn điểm nóng tổn hại 3D",
        "primary_actor": "Đồng sở hữu, Nhân viên kiểm định",
        "secondary_actor": "Three.js Raycaster & DamageHotspots Component",
        "description": "Người dùng nhấp vào các điểm đánh dấu Hotspot hình cầu màu đỏ/vàng trên thân vỏ 3D để xem chi tiết vết trầy xước, móp méo kèm ảnh chụp thực tế từ biên bản kiểm định.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấp chuột trái vào một điểm Hotspot phát sáng trên thân xe 3D.",
        "preconditions": "Xe có các bản ghi tổn hại `DamageRecord` đã nạp; các Hotspot 3D được gắn đúng tọa độ (x, y, z) trên bề mặt vỏ xe.",
        "postconditions": "Mở bảng chi tiết tổn hại `DamageDetailModal.tsx` hiển thị ảnh thực địa và mức độ nghiêm trọng.",
        "main_flow": (
            "1. Người dùng bật chế độ hiển thị tổn hại trên màn hình Garage 3D.\n"
            "2. Component `DamageHotspots.tsx` kết xuất các khối cầu phát sáng nhấp nháy (Pulsing Sphere) tại các tọa độ neo 3D (ví dụ: cản trước, cửa sau bên phụ).\n"
            "3. Màu sắc Hotspot phản ánh mức độ: Màu đỏ (hư hỏng nặng), màu vàng (trầy xước nhẹ), màu xanh (đã khắc phục xong).\n"
            "4. Người dùng di chuột tới một Hotspot: Hotspot phóng to 1.3 lần và hiển thị nhãn nổi tóm tắt 'Vết trầy xước cản trước - 15cm'.\n"
            "5. Người dùng nhấn chuột trái vào Hotspot.\n"
            "6. Hệ thống bắt sự kiện click qua Raycaster, lấy định danh `damageId` gắn kèm.\n"
            "7. Camera 3D kích hoạt chuyển động lerp mượt mà phóng to góc nhìn thẳng vào vị trí vết trầy xước đó trong 700ms.\n"
            "8. Giao diện mở bảng chi tiết `DamageDetailModal.tsx` hiển thị: Ảnh chụp cận cảnh, ngày ghi nhận, người lái gây ra, trạng thái bồi thường và dự toán chi phí sơn sửa."
        ),
        "alt_flow": (
            "Tại bước 5, nếu người dùng nhấn nút 'Đóng' trên modal chi tiết: Camera tự động lùi về góc nhìn tổng quan và nhãn nổi biến mất."
        ),
        "exception_flow": (
            "Tại bước 6, nếu tọa độ Hotspot bị che khuất bởi góc khuất của xe: Điểm Hotspot tự động hiển thị với độ mờ 40% (Ghosting) để người dùng biết có điểm tổn hại ở mặt đối diện và chủ động xoay xe."
        ),
        "business_rules": "BR-3D-01",
        "related_fr": "FR-3D-03",
        "related_tc": "TC-3D-05"
    },
    {
        "id": "UC-3D-06",
        "name": "Tương tác với khu vực trụ sạc thông minh 3D",
        "primary_actor": "Đồng sở hữu, Nhân viên trạm",
        "secondary_actor": "Three.js Environment & ChargingStationMesh",
        "description": "Người dùng nhấp vào mô hình trụ sạc điện thông minh trong không gian Garage để xem trạng thái nguồn cấp, kết nối súng sạc ảo và mở bảng điều khiển nạp điện.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng nhấp chuột vào Mesh trụ sạc đặt cạnh xe trong Garage.",
        "preconditions": "Mô hình trụ sạc thông minh hiển thị trong không gian Garage 3D tại tọa độ (-2.5, 0, 1.2).",
        "postconditions": "Hiển thị dây sạc kết nối vào cổng sạc xe và mở thanh công cụ `ChargingStationDock.tsx`.",
        "main_flow": (
            "1. Người dùng quan sát mô hình trụ sạc nhanh DC bên cạnh chiếc xe trong không gian Garage ảo.\n"
            "2. Trụ sạc có dải đèn LED hiển thị trạng thái: Màu xanh lá cây (Sẵn sàng / Khả dụng), Màu xanh dương (Đang sạc), Màu đỏ (Bảo trì).\n"
            "3. Người dùng nhấp chuột lên Mesh trụ sạc.\n"
            "4. Raycaster bắt trúng đối tượng `ChargingStationMesh`.\n"
            "5. Camera kích hoạt góc nhìn cận cảnh Split-View hiển thị đồng thời trụ sạc và cổng nạp điện ở đuôi xe.\n"
            "6. Hoạt ảnh 3D kết nối dây súng sạc từ trụ cắm vào cổng nạp điện của xe được thực thi mượt mà bằng đường cong Bézier Curve 3D.\n"
            "7. Giao diện mở thanh trượt `ChargingStationDock.tsx` hiển thị thông số trụ sạc: Công suất tối đa 60 kW DC, Điện áp 400V, Đơn giá 3.850 đ/kWh.\n"
            "8. Người dùng có thể nhấn nút 'Khởi động phiên sạc' để chuyển tiếp sang quy trình nạp điện nghiệp vụ."
        ),
        "alt_flow": (
            "Tại bước 2, nếu trụ sạc đang ở trạng thái bảo trì (Đèn đỏ): Khi người dùng nhấp chọn, giao diện hiển thị thông báo 'Trụ sạc tạm ngưng phục vụ để kiểm định an toàn lưới điện'."
        ),
        "exception_flow": (
            "Tại bước 6, nếu xe chưa mở nắp cổng sạc: Hệ thống tự động kích hoạt animation mở nắp sạc trước khi luồn dây súng sạc vào cổng."
        ),
        "business_rules": "BR-3D-01",
        "related_fr": "FR-3D-01",
        "related_tc": "TC-3D-06"
    },
    {
        "id": "UC-3D-07",
        "name": "Đặt lại góc nhìn camera về vị trí tổng quan chuẩn",
        "primary_actor": "Người dùng giao diện Garage 3D",
        "secondary_actor": "Three.js OrbitControls & CameraRig",
        "description": "Người dùng đưa góc nhìn camera sau khi đã xoay lật, phóng to thu nhỏ tự do trở về vị trí toàn cảnh mặc định chuẩn xác của Garage ảo chỉ với một thao tác bấm.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấp vào nút biểu tượng 'Reset Camera' trên bảng công cụ điều khiển.",
        "preconditions": "OrbitControls đang được kích hoạt và camera nằm ở góc xoay bất kỳ.",
        "postconditions": "Camera trở về vị trí tọa độ (4.5, 2.2, 4.5), tâm nhìn LookAt về (0.0, 0.75, 0.0), xe xoay thẳng hướng 0 radian.",
        "main_flow": (
            "1. Người dùng đang quan sát xe ở một góc nhìn lệch, quá gần hoặc quá xa sau khi tương tác tự do.\n"
            "2. Người dùng nhấp nút 'Đặt lại góc nhìn' (Camera Reset Icon) tại thanh công cụ `FloatingActionControls.tsx`.\n"
            "3. Component kích hoạt Zustand action `worldStore.triggerCameraReset()` và `resetVehicleYaw()`.\n"
            "4. Thuộc tính `cameraResetNonce` trong Zustand Store tăng lên 1 đơn vị để kích hoạt useEffect lắng nghe trong `CameraRig.tsx`.\n"
            "5. Toàn bộ logic diễn ra 100% tại Client GPU và bộ nhớ JavaScript máy khách, không gửi bất kỳ HTTP request nào tới máy chủ và không thay đổi dữ liệu CSDL.\n"
            "6. Hệ thống sử dụng hàm nội suy `lerp` hoặc thư viện tween để làm mịn quỹ đạo di chuyển của camera trong khoảng thời gian chính xác 800ms.\n"
            "7. Tọa độ vị trí camera `camera.position` dịch chuyển mượt mà từ tọa độ hiện thời về đúng tọa độ mục tiêu: x = 4.5, y = 2.2, z = 4.5.\n"
            "8. Tâm xoay ngắm của điều khiển `orbitControls.target` dịch chuyển từ vị trí hiện thời về đúng tâm xe: x = 0.0, y = 0.75, z = 0.0.\n"
            "9. Góc xoay tự thân của xe `vehicleYaw` xoay mượt mà trở về 0 radian (xe nằm thẳng song song với bục Garage).\n"
            "10. Camera và bục xe ổn định hoàn toàn ở góc phối cảnh 3/4 mặt trước bên lái chuẩn mực, sẵn sàng cho các thao tác tiếp theo."
        ),
        "alt_flow": (
            "Tại bước 6, nếu người dùng đang kích hoạt chế độ X-Ray: Hành động reset camera vẫn đưa góc nhìn về vị trí chuẩn mà không làm mất trạng thái X-Ray của khối pin."
        ),
        "exception_flow": (
            "Tại bước 7, nếu quá trình chuyển động camera bị gián đoạn do người dùng bất ngờ nhấp chuột kéo OrbitControls: Hoạt ảnh tween lập tức dừng lại (kill tween) và trao quyền điều khiển tức thì cho thao tác chuột của người dùng để tránh giật khung hình."
        ),
        "business_rules": "BR-3D-03",
        "related_fr": "FR-3D-07",
        "related_tc": "TC-3D-07"
    }
]

print(f"Loaded {len(UCS_PART1)} use cases in Part 1.")
