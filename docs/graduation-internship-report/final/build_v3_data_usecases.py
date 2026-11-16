# -*- coding: utf-8 -*-
"""
build_v3_data_usecases.py - Xây dựng cấu trúc đặc tả 88 Use Cases chi tiết cho V3
Gồm 14 Use Cases đại diện cho Chương 3 và 74 Use Cases chi tiết cho Phụ lục C
"""
import os

out_py = r"D:\EV3D\docs\graduation-internship-report\final\v3_data_usecases.py"

# Danh mục 14 Use Case đại diện cho Chương 3
MAJOR_UCS = [
    {
        "id": "UC-AUTH-01",
        "name": "Đăng nhập hệ thống và cấp phát Token JWT",
        "primary_actor": "Người dùng (Tất cả vai trò)",
        "secondary_actor": "Hệ thống xác thực (Spring Security)",
        "description": "Cho phép người dùng đã kích hoạt tài khoản nhập email và mật khẩu để xác thực danh tính, nhận Access Token JWT và Refresh Token để truy cập không gian Virtual Garage 3D.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Người dùng truy cập tuyến đường /login và nhấn nút 'Đăng Nhập'.",
        "preconditions": "1. Tài khoản người dùng đã được tạo và ở trạng thái ACTIVE trong bảng users.\n2. Thiết bị máy khách có kết nối mạng HTTPS tới máy chủ backend.",
        "postconditions": "1. Cấp phát Access Token (thời hạn 24 giờ) và Refresh Token được lưu trong bảng refresh_tokens.\n2. authStore tại máy khách lưu trữ thông tin phiên và chuyển hướng vào /garage.",
        "main_flow": "1. Người dùng mở trang /login, hệ thống khởi tạo khung nhìn 3D nền và hiển thị form đăng nhập.\n2. Người dùng nhập email và mật khẩu hợp lệ, nhấn nút 'Đăng Nhập'.\n3. Trình duyệt gửi yêu cầu POST /api/auth/login kèm LoginRequest JSON.\n4. AuthController tiếp nhận request và chuyển tới AuthService.\n5. AuthService gọi AuthenticationManager xác thực mật khẩu qua thuật toán băm BCrypt.\n6. Hệ thống tìm thấy thông tin hợp lệ, nạp UserPrincipal và các Role được cấp phép.\n7. JwtTokenProvider tạo chuỗi Access Token JWT ký HMAC-SHA512 chứa userId và role.\n8. AuthService tạo bản ghi RefreshToken mới trong CSDL.\n9. Máy chủ trả về HTTP 200 OK kèm AuthResponse JSON chứa tokens và profile.\n10. authStore tại máy khách lưu token vào bộ nhớ và điều hướng người dùng vào không gian /garage.",
        "alt_flow": "4a. Phiên đăng nhập trước đó vẫn còn Refresh Token hợp lệ: Hệ thống tự động làm mới Access Token mà không yêu cầu người dùng nhập lại mật khẩu.\n7a. Người dùng có vai trò ADMIN: Hệ thống điều hướng vào trung tâm điều hành AdminCommandCenter3D.",
        "exception_flow": "2e. Người dùng nhập sai mật khẩu: AuthenticationManager ném ngoại lệ BadCredentialsException. Hệ thống trả về HTTP 401 Unauthorized kèm thông báo 'Email hoặc mật khẩu không chính xác'.\n3e. Tài khoản đang bị khóa (status = SUSPENDED): Hệ thống trả về HTTP 403 Forbidden kèm thông báo 'Tài khoản của bạn đã bị tạm khóa, vui lòng liên hệ ban quản trị'.",
        "business_rules": "BR-AUTH-01 (Mật khẩu băm BCrypt độ dài muối 10), BR-AUTH-02 (Thời gian sống Access Token tối đa 24h, Refresh Token tối đa 30 ngày).",
        "related_fr": "FR-AUTH-01 (Xác thực đăng nhập người dùng).",
        "related_tc": "TC-AUTH-01, TC-AUTH-02."
    },
    {
        "id": "UC-AUTH-02",
        "name": "Đăng xuất và thu hồi phiên làm việc",
        "primary_actor": "Người dùng đã đăng nhập",
        "secondary_actor": "Hệ thống xác thực",
        "description": "Cho phép người dùng chủ động kết thúc phiên làm việc an toàn, xóa bỏ token tại máy khách và thu hồi bản ghi Refresh Token trên máy chủ.",
        "priority": "Cao (High)",
        "trigger": "Người dùng nhấn biểu tượng 'Đăng xuất' trên thanh điều khiển HUD.",
        "preconditions": "Người dùng đang có phiên làm việc hoạt động và sở hữu Access Token hợp lệ.",
        "postconditions": "1. Bản ghi Refresh Token trong CSDL bị xóa hoặc đánh dấu vô hiệu hóa.\n2. Trình duyệt xóa Access Token khỏi bộ nhớ và chuyển về màn hình /login.",
        "main_flow": "1. Người dùng bấm nút 'Đăng xuất' trên thanh HUD giao diện Garage 3D.\n2. Máy khách hiển thị hộp thoại xác nhận đăng xuất.\n3. Người dùng chọn 'Đồng ý'.\n4. Trình duyệt gửi yêu cầu POST /api/auth/logout kèm Bearer Token.\n5. AuthController chuyển request tới AuthService.\n6. AuthService thu hồi Refresh Token tương ứng của người dùng trong bảng refresh_tokens.\n7. Máy chủ trả về HTTP 200 OK với thông điệp 'Đăng xuất thành công'.\n8. authStore kích hoạt phương thức logout(), xóa bỏ toàn bộ state trong Zustand.\n9. Ứng dụng hủy bỏ không gian Canvas 3D và chuyển hướng về trang /login.",
        "alt_flow": "4a. Máy khách mất kết nối mạng khi gửi request logout: authStore vẫn tự động dọn sạch token cục bộ tại máy khách để bảo đảm an toàn thông tin.",
        "exception_flow": "5e. Access Token gửi kèm không hợp lệ hoặc đã hết hạn: Bộ lọc Security vẫn tiến hành dọn dẹp phiên tại máy khách và điều hướng về trang đăng nhập.",
        "business_rules": "BR-AUTH-03 (Thu hồi phiên triệt để phía máy chủ ngăn chặn tấn công Token Replay).",
        "related_fr": "FR-AUTH-03 (Đăng xuất hệ thống an toàn).",
        "related_tc": "TC-AUTH-04, TC-REG-25."
    },
    {
        "id": "UC-ADMIN-01",
        "name": "Quản trị danh sách tài khoản và phân quyền người dùng",
        "primary_actor": "Quản trị viên (ADMIN)",
        "secondary_actor": "Cơ sở dữ liệu",
        "description": "Quản trị viên tra cứu toàn bộ danh sách người dùng trong hệ thống, tìm kiếm, lọc theo vai trò và cập nhật trạng thái hoặc gán quyền truy cập.",
        "priority": "Cao (High)",
        "trigger": "Quản trị viên mở Hologram Quản trị Người dùng trong Garage 3D.",
        "preconditions": "Người dùng đăng nhập với tài khoản có vai trò ADMIN.",
        "postconditions": "Thông tin tài khoản hoặc vai trò người dùng được cập nhật trong bảng users.",
        "main_flow": "1. Admin nhấp chọn biểu tượng Hologram 'Quản Trị Người Dùng'.\n2. Giao diện AdminUserManagementPanel hiển thị danh sách người dùng dưới dạng bảng phân trang.\n3. Trình duyệt gửi GET /api/admin/users?page=0&size=10.\n4. AdminController gọi AdminService truy vấn dữ liệu từ UserRepository.\n5. Dữ liệu trả về HTTP 200 OK gồm danh sách UserResponse (đã loại bỏ hash mật khẩu).\n6. Admin chọn một tài khoản, mở menu gán vai trò (ADMIN, STAFF, CO_OWNER).\n7. Admin bấm 'Cập nhật vai trò', gửi PATCH /api/admin/users/{id}/role.\n8. AdminService cập nhật bảng users và ghi nhật ký vào audit_logs.\n9. Hệ thống trả về HTTP 200 OK và làm mới danh sách hiển thị.",
        "alt_flow": "6a. Admin chọn chức năng Khóa tài khoản: Gửi PATCH /api/admin/users/{id}/status với status = SUSPENDED.\n6b. Admin nhập từ khóa vào ô tìm kiếm: Hệ thống lọc danh sách theo tên, email hoặc số điện thoại.",
        "exception_flow": "7e. Admin cố tình tự hạ quyền hoặc tự khóa tài khoản chính mình: Hệ thống ném ngoại lệ InvalidOperationException và chặn thao tác với mã HTTP 400 Bad Request.",
        "business_rules": "BR-ADM-01 (Chỉ Admin tối cao mới có quyền gán vai trò), BR-ADM-02 (Không cho phép tự khóa tài khoản Admin đang đăng nhập).",
        "related_fr": "FR-ADM-01, FR-ADM-02, FR-ADM-03.",
        "related_tc": "TC-AUTH-05, TC-REG-26."
    },
    {
        "id": "UC-ADMIN-07",
        "name": "Quản lý nhóm đồng sở hữu và kiểm soát bất biến vốn",
        "primary_actor": "Quản trị viên (ADMIN)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Quản trị viên giám sát cấu trúc các nhóm đồng sở hữu xe, kiểm tra tính toàn vẹn của bất biến tổng tỷ lệ sở hữu vốn luôn đạt đúng 100.0000%.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Admin nhấp chọn Hologram 'Nhóm Đồng Sở Hữu' trên giao diện 3D.",
        "preconditions": "Đăng nhập với vai trò ADMIN.",
        "postconditions": "Cơ cấu nhóm đồng sở hữu và tỷ lệ vốn được hiển thị hoặc cập nhật chính xác.",
        "main_flow": "1. Admin mở Hologram Nhóm Đồng Sở Hữu.\n2. Giao diện AdminCoOwnershipPanel gửi yêu cầu GET /api/co-ownership-groups.\n3. Máy chủ trả về danh sách các nhóm xe kèm thông tin số lượng thành viên và xe liên kết.\n4. Admin chọn nhóm 'VinFast VF8 - Nhóm 01'.\n5. Hệ thống gửi GET /api/co-ownership/vehicle/{vehicleId}/shares.\n6. CoOwnershipService truy vấn bảng ownership_shares, tính tổng tỷ lệ phần trăm.\n7. Hệ thống kiểm tra điều kiện bất biến SUM(percentage) == 100.0000%.\n8. Kết quả trả về gồm danh sách cổ đông, tỷ lệ sở hữu, và cờ trạng thái hợp lệ isValid = true.\n9. Giao diện hiển thị biểu đồ phân bổ vốn trực quan và danh bạ thành viên.",
        "alt_flow": "7a. Phát hiện sai lệch số học trong CSDL (SUM != 100.0000%): Hệ thống bật cờ cảnh báo đỏ CRITICAL_INVARIANT_VIOLATION và gửi thông báo kiểm toán tới Admin.",
        "exception_flow": "5e. Không tìm thấy phương tiện hoặc nhóm xe tương ứng: Hệ thống trả về HTTP 404 Not Found kèm thông điệp 'Nhóm đồng sở hữu không tồn tại'.",
        "business_rules": "BR-OWN-01 (Bất biến tổng tỷ lệ sở hữu xe trong nhóm bắt buộc bằng 100.0000% tại mọi thời điểm).",
        "related_fr": "FR-ADM-05, FR-OWN-01.",
        "related_tc": "TC-OWN-01, TC-REG-19."
    },
    {
        "id": "UC-BOOK-01",
        "name": "Tra cứu khung giờ rảnh và lịch biểu xe",
        "primary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Chủ xe tra cứu lịch trình sử dụng của chiếc xe mình đồng sở hữu, quan sát trực quan các khoảng thời gian đã được đặt và các khung giờ còn trống.",
        "priority": "Cao (High)",
        "trigger": "Chủ xe chọn một phương tiện và mở bảng điều khiển CoOwnerBookingPanel.",
        "preconditions": "Chủ xe là thành viên hoạt động (status = ACTIVE) trong nhóm sở hữu chiếc xe đó.",
        "postconditions": "Danh sách các slot đặt xe trong tuần/tháng được hiển thị trực quan trên trục thời gian.",
        "main_flow": "1. Chủ xe nhấp vào mô hình xe trong Garage 3D, thanh HUD hiển thị thông tin xe.\n2. Chủ xe nhấn nút 'Đặt Lịch' trên thanh công cụ Quick Action Dock.\n3. CoOwnerBookingPanel mở ra dưới dạng panel kính mờ ở cạnh phải màn hình.\n4. Trình duyệt gửi GET /api/vehicles/{vehicleId}/bookings?from={start}&to={end}.\n5. BookingController tiếp nhận và gọi BookingService.getVehicleBookings().\n6. BookingService truy vấn các bản ghi có trạng thái CONFIRMED hoặc PENDING trong khoảng thời gian.\n7. Máy chủ trả về HTTP 200 OK kèm danh sách BookingResponse.\n8. Giao diện kết xuất trục thời gian (Timeline Calendar), đánh dấu các khung giờ bận màu đỏ và giờ rảnh màu xanh.",
        "alt_flow": "1a. Xe đang trong trạng thái bảo dưỡng (MAINTENANCE): Bảng đặt lịch hiển thị dải băng cảnh báo màu cam 'Phương tiện đang bảo dưỡng kỹ thuật' và khóa chức năng chọn giờ.",
        "exception_flow": "4e. Người dùng không phải thành viên nhóm xe: BookingService ném AccessDeniedException, giao diện hiển thị thông báo lỗi 'Bạn không có quyền truy cập lịch xe này'.",
        "business_rules": "BR-BOOK-01 (Chỉ thành viên thuộc nhóm mới được xem lịch chi tiết của xe).",
        "related_fr": "FR-BOOK-01.",
        "related_tc": "TC-BOOK-01, TC-BOOK-07."
    },
    {
        "id": "UC-BOOK-02",
        "name": "Tạo lịch đặt xe mới và xử lý khử xung đột thời gian",
        "primary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Chủ xe chọn thời gian bắt đầu và kết thúc để đặt lịch sử dụng xe. Hệ thống thực hiện thuật toán khử xung đột thời gian nghiêm ngặt trên CSDL để ngăn chặn trùng lịch.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Chủ xe chọn khung giờ trên form đặt lịch và nhấn nút 'Xác Nhận Đặt Xe'.",
        "preconditions": "1. Người dùng là thành viên hợp lệ của nhóm xe.\n2. Phương tiện có trạng thái AVAILABLE hoặc RESERVED hợp lệ.\n3. Thời gian bắt đầu phải ở tương lai và trước thời gian kết thúc.",
        "postconditions": "Tạo bản ghi Booking mới với trạng thái CONFIRMED trong bảng bookings.",
        "main_flow": "1. Chủ xe nhập thời gian bắt đầu (startTime), thời gian kết thúc (endTime) và mục đích chuyến đi.\n2. Chủ xe nhấn nút 'Xác Nhận Đặt Xe'.\n3. Trình duyệt gửi POST /api/vehicles/{vehicleId}/bookings kèm payload CreateBookingRequest.\n4. BookingController chuyển request tới BookingService.createBooking().\n5. BookingService kiểm tra tính hợp lệ cơ bản: startTime < endTime và startTime >= now - 120s.\n6. BookingService kiểm tra tư cách thành viên qua CoOwnershipService.isUserActiveMember().\n7. BookingService thực thi câu truy vấn khử xung đột: SELECT COUNT(*) FROM bookings WHERE vehicle_id = ? AND status IN ('CONFIRMED', 'PENDING') AND (start_time < :endTime AND end_time > :startTime).\n8. Kết quả đếm xung đột bằng 0 (không có lịch giao thoa).\n9. BookingService tạo đối tượng Booking mới, gán status = CONFIRMED, lưu vào CSDL.\n10. Máy chủ trả về HTTP 201 Created kèm BookingResponse JSON.\n11. Giao diện cập nhật khung giờ mới lên Timeline và hiển thị thông báo đặt xe thành công.",
        "alt_flow": "8a. Kết quả đếm xung đột > 0 (phát hiện giao thoa thời gian): Hệ thống ném ngoại lệ IllegalArgumentException với thông điệp 'Khung giờ này đã được đặt bởi thành viên khác. Vui lòng chọn thời gian khác'. Giao diện hiển thị cảnh báo viền đỏ.",
        "exception_flow": "5e. Chủ xe chọn endTime nhỏ hơn startTime: Hệ thống báo lỗi ngay tại client hoặc backend HTTP 400 Bad Request 'Thời gian kết thúc phải sau thời gian bắt đầu'.\n6e. Xe đang ở trạng thái MAINTENANCE: Hệ thống từ chối đặt xe với thông báo 'Xe đang trong quá trình bảo dưỡng kỹ thuật'.",
        "business_rules": "BR-BOOK-02 (Điều kiện khử xung đột lịch: T_start < B_end VÀ T_end > B_start), BR-BOOK-03 (Không cho phép đặt xe trong quá khứ).",
        "related_fr": "FR-BOOK-02, FR-BOOK-03.",
        "related_tc": "TC-BOOK-01, TC-BOOK-02, TC-BOOK-03, TC-BOOK-04, TC-BOOK-05."
    },
    {
        "id": "UC-TRIP-01",
        "name": "Bàn giao xe kỹ thuật và xác nhận hai bên",
        "primary_actor": "Nhân viên kỹ thuật (STAFF)",
        "secondary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "description": "Nhân viên vận hành gặp chủ xe trước giờ khởi hành, cùng đối soát chỉ số ODO, phần trăm pin thực tế và tình trạng ngoại quan, sau đó lập biên bản bàn giao xe kỹ thuật.",
        "priority": "Cao (High)",
        "trigger": "Nhân viên mở StaffHandoverModal khi lịch đặt của chủ xe sắp diễn ra.",
        "preconditions": "1. Lịch đặt xe đang ở trạng thái CONFIRMED.\n2. Nhân viên có vai trò STAFF hoặc ADMIN thực hiện.",
        "postconditions": "1. Tạo bản ghi VehicleHandover với trạng thái COMPLETED trong CSDL.\n2. Phương tiện chuyển trạng thái sang RESERVED sẵn sàng check-in.",
        "main_flow": "1. Nhân viên mở danh sách bàn giao trong ngày trên giao diện Staff Fleet View.\n2. Nhân viên chọn lịch đặt của chủ xe, mở StaffHandoverModal.\n3. Nhân viên kiểm tra xe thực tế, nhập chỉ số ODO hiện tại và mức pin xuất phát (SOC).\n4. Nhân viên chọn kết quả kiểm tra đạt chuẩn (status = PASSED).\n5. Nhân viên nhấn nút 'Xác Nhận Bàn Giao'.\n6. Trình duyệt gửi POST /api/handovers/booking/{bookingId}/verify kèm HandoverVerifyRequest.\n7. VehicleHandoverController tiếp nhận và gọi VehicleHandoverService.verifyHandover().\n8. VehicleHandoverService lưu bản ghi vào bảng vehicle_handovers, cập nhật trạng thái xe = RESERVED.\n9. Máy chủ trả về HTTP 200 OK kèm VehicleHandoverResponse.\n10. Hệ thống gửi thông báo đẩy đến chủ xe yêu cầu ký nhận biên bản tình trạng xe.\n11. Chủ xe mở CoOwnerHandoverReviewPanel, xem thông số và nhấn 'Ký Xác Nhận'.\n12. Trình duyệt gửi POST /api/handovers/{id}/acknowledge, CSDL cập nhật owner_condition_acknowledged_at = now().",
        "alt_flow": "4a. Phát hiện sự cố thân vỏ mới phát sinh: Nhân viên kích hoạt mở form ghi nhận hư hỏng DamageRecord trước khi bàn giao xe.",
        "exception_flow": "7e. Người thực hiện không phải STAFF: Hệ thống trả về HTTP 403 Forbidden 'Chỉ nhân viên vận hành mới có thẩm quyền bàn giao xe'.",
        "business_rules": "BR-HAND-01 (Bắt buộc phải có xác nhận bàn giao của Staff trước khi Co-Owner được phép bắt đầu chuyến đi).",
        "related_fr": "FR-HAND-01, FR-HAND-02, FR-HAND-03.",
        "related_tc": "TC-HAND-01, TC-HAND-02, TC-HAND-03, TC-TRIP-03."
    },
    {
        "id": "UC-TRIP-04",
        "name": "Khởi hành và bắt đầu chuyến đi trực tuyến",
        "primary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Chủ xe thực hiện check-in trực tuyến trước khi lăn bánh, ghi nhận thời điểm khởi hành chính xác và chuyển trạng thái phương tiện sang IN_USE.",
        "priority": "Cao (High)",
        "trigger": "Chủ xe mở CoOwnerTripStartPanel và nhấn nút 'Bắt Đầu Chuyến Đi'.",
        "preconditions": "1. Lịch đặt xe CONFIRMED và đã hoàn tất xác nhận bàn giao xe.\n2. Thời gian hiện tại nằm trong khung giờ đặt (không quá sớm hơn 30 phút).\n3. Mức pin xe đạt ngưỡng an toàn tối thiểu (>= 20%).",
        "postconditions": "1. Bản ghi Trip mới được tạo với trạng thái IN_PROGRESS (hoặc ACTIVE).\n2. Trạng thái phương tiện trong bảng vehicles chuyển thành IN_USE.",
        "main_flow": "1. Chủ xe truy cập ứng dụng trên điện thoại hoặc trình duyệt tại Garage.\n2. Hệ thống kiểm tra điều kiện khởi hành qua API GET /api/bookings/{id}/trip/start-eligibility.\n3. Điều kiện hợp lệ, nút 'Bắt Đầu Chuyến Đi' sáng đèn trên thanh HUD.\n4. Chủ xe nhấn 'Bắt Đầu Chuyến Đi'.\n5. Trình duyệt gửi POST /api/bookings/{bookingId}/trip/start kèm StartTripRequest.\n6. TripController chuyển request tới TripService.startTrip().\n7. TripService kiểm tra người gọi chính là chủ nhân của booking (tránh người khác bấm hộ).\n8. TripService tạo bản ghi Trip mới: startedAt = now(), startOdometer = vehicle.odometer, startBatteryLevel = vehicle.batteryLevel, status = 'IN_PROGRESS'.\n9. TripService cập nhật vehicle.status = 'IN_USE'.\n10. Máy chủ trả về HTTP 200 OK kèm TripResponse JSON.\n11. Giao diện chuyển sang màn hình ActiveTripDetailPanel hiển thị đồng hồ hành trình.",
        "alt_flow": "3a. Chủ xe bấm khởi hành quá sớm (> 30 phút trước giờ đặt): Nút bắt đầu bị vô hiệu hóa kèm thông điệp 'Chưa đến thời gian sử dụng xe'.",
        "exception_flow": "7e. Mức pin xe quá thấp (< 20%): Hệ thống từ chối cho xe lăn bánh với mã lỗi HTTP 400 'Mức pin không đủ an toàn để bắt đầu hành trình. Vui lòng sạc xe trước'.\n8e. Nhân viên chưa xác nhận bàn giao: TripService từ chối với lỗi REASON_HANDOVER_NOT_COMPLETED.",
        "business_rules": "BR-TRIP-01 (Chỉ người đặt xe mới có quyền bấm bắt đầu chuyến đi), BR-TRIP-02 (Ngưỡng pin tối thiểu để bắt đầu hành trình là 20%).",
        "related_fr": "FR-TRIP-01, FR-TRIP-02.",
        "related_tc": "TC-TRIP-01, TC-TRIP-02, TC-TRIP-03, TC-TRIP-04, TC-REG-15."
    },
    {
        "id": "UC-TRIP-08",
        "name": "Yêu cầu trả xe và nghiệm thu hoàn tất hành trình",
        "primary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "secondary_actor": "Nhân viên kỹ thuật (STAFF)",
        "description": "Chủ xe đưa xe về garage bãi đỗ, nhập chỉ số ODO và pin kết thúc để gửi yêu cầu trả xe. Nhân viên kiểm tra đối soát, tính toán năng lượng tiêu thụ và chốt đóng chuyến đi.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Chủ xe nhấn nút 'Yêu Cầu Trả Xe' trên ActiveTripDetailPanel.",
        "preconditions": "Chuyến đi đang ở trạng thái IN_PROGRESS.",
        "postconditions": "1. Chuyến đi chuyển trạng thái COMPLETED trong bảng trips.\n2. Tồn kho năng lượng xe bị khấu trừ lượng kWh tiêu thụ.\n3. Tự động sinh hóa đơn tiền điện gán cho cá nhân người lái (USER_RESPONSIBILITY).\n4. Phương tiện trở về trạng thái AVAILABLE.",
        "main_flow": "1. Chủ xe đưa xe vào vị trí đỗ trong Garage, mở bảng ActiveTripDetailPanel.\n2. Chủ xe nhập chỉ số ODO kết thúc và mức pin hiện tại, nhấn 'Yêu Cầu Trả Xe'.\n3. Trình duyệt gửi POST /api/trips/{tripId}/request-return kèm EndTripRequest.\n4. TripService cập nhật trip.status = 'RETURN_REQUESTED', returnRequestedAt = now().\n5. Nhân viên kỹ thuật nhận thông báo trên bảng Staff Fleet View, mở StaffInspectionPanel3D.\n6. Nhân viên kiểm tra thực tế xe, xác minh ODO kết thúc và pin, hoàn tất checklist trả xe.\n7. Nhân viên nhấn 'Xác Nhận Nghiệm Thu Trả Xe'.\n8. Trình duyệt gửi POST /api/trips/{tripId}/confirm-return kèm verifiedOdo và verifiedSoc.\n9. TripService phối hợp VehicleEnergyInventoryService.recordTripConsumption() tính số kWh điện tiêu thụ = (startSoc - endSoc) * DungLượng / 100.\n10. Hệ thống trừ kho năng lượng và tính chi phí điện chuyến đi = Số kWh * Đơn giá bình quân WAC.\n11. Hệ thống tự động tạo bản ghi Expense (category = CHARGING, policy = USER_RESPONSIBILITY) gán 100% chi phí cho chủ xe lái chuyến đi này.\n12. TripService cập nhật trip.status = 'COMPLETED', vehicle.status = 'AVAILABLE', cập nhật ODO và Pin mới cho xe.\n13. Máy chủ trả về HTTP 200 OK, kết thúc chu trình hành trình.",
        "alt_flow": "6a. Nhân viên phát hiện vết trầy xước mới: Nhân viên mở DamageRecordPanel3D gắn điểm nóng Hotspot tổn hại trước khi bấm xác nhận trả xe.",
        "exception_flow": "3e. Chủ xe nhập ODO kết thúc nhỏ hơn ODO xuất phát: Hệ thống ném ngoại lệ IllegalArgumentException 'Chỉ số ODO kết thúc phải lớn hơn hoặc bằng ODO ban đầu'.",
        "business_rules": "BR-TRIP-03 (Chủ xe chịu 100% tiền điện tiêu thụ trong suốt thời gian sử dụng theo chính sách USER_RESPONSIBILITY), BR-TRIP-04 (Chuyến đi chỉ kết thúc khi nhân viên xác nhận đối soát).",
        "related_fr": "FR-TRIP-04, FR-TRIP-05, FR-ENERGY-02, FR-FIN-03.",
        "related_tc": "TC-TRIP-07, TC-TRIP-08, TC-TRIP-09, TC-ENER-04, TC-FIN-03."
    },
    {
        "id": "UC-MAINT-01",
        "name": "Ghi nhận vết hư hại thân vỏ gắn tọa độ 3D Hotspot",
        "primary_actor": "Nhân viên kỹ thuật (STAFF)",
        "secondary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "description": "Cho phép nhân viên kỹ thuật hoặc chủ xe nhấp chuột trực tiếp lên bề mặt mô hình 3D xe để phát hiện va chạm qua Raycaster, đính kèm thông tin mô tả, mức độ nghiêm trọng và ảnh chụp thực tế.",
        "priority": "Cao (High)",
        "trigger": "Nhân viên nhấp chuột vào vị trí va chạm trên bề mặt xe 3D trong chế độ Kiểm Định.",
        "preconditions": "Xe hiển thị trên không gian Canvas 3D và nhân viên đã kích hoạt chế độ ghi nhận tổn hại.",
        "postconditions": "Tạo bản ghi DamageRecord mới liên kết tọa độ (x, y, z) và hiển thị điểm nóng Hotspot 3D nổi trên thân xe.",
        "main_flow": "1. Nhân viên mở mô hình xe trong chế độ 'Kiểm Định Tổn Hại 3D'.\n2. Nhân viên nhấp chuột vào vị trí trầy xước trên cản trước của xe 3D.\n3. Thư viện Three.js kích hoạt Raycaster, tính toán điểm giao cắt trên lưới đa giác (Mesh intersection), lấy tọa độ không gian Vector3(x, y, z) và tên bộ phận 'FRONT_BUMPER'.\n4. Giao diện mở hộp thoại DamageRecordPanel3D neo theo điểm nhấp chuột.\n5. Nhân viên chọn mức độ nghiêm trọng (SEVERITY: LOW, MEDIUM, HIGH), nhập mô tả chi tiết vết xước.\n6. Nhân viên đính kèm ảnh chụp thực tế từ điện thoại.\n7. Nhân viên nhấn nút 'Lưu Bản Ghi Tổn Hại'.\n8. Trình duyệt gửi POST /api/vehicles/{vehicleId}/damages kèm CreateDamageRequest JSON.\n9. DamageController tiếp nhận và gọi DamageService.recordVehicleDamage().\n10. DamageService lưu bản ghi vào bảng damage_records với status = 'REPORTED'.\n11. Máy chủ trả về HTTP 201 Created kèm DamageRecordResponse.\n12. Giao diện 3D hiển thị điểm Hotspot nổi hình quả cầu phát sáng màu đỏ tại đúng tọa độ (x, y, z).",
        "alt_flow": "12a. Tổn hại đã được trung tâm bảo dưỡng khắc phục xong: Nhân viên chuyển trạng thái sang RESOLVED, điểm Hotspot 3D tự động đổi sang màu xanh lá cây hoặc ẩn đi.",
        "exception_flow": "8e. Ảnh đính kèm vượt quá dung lượng 5MB: Hệ thống báo lỗi và yêu cầu nén ảnh trước khi lưu.",
        "business_rules": "BR-DAMG-01 (Mọi tổn hại thân vỏ phải gắn với tọa độ 3D xác định để phục vụ đối soát minh bạch giữa các đời chủ xe).",
        "related_fr": "FR-DAMG-01, FR-3D-05.",
        "related_tc": "TC-DAMG-01, TC-DAMG-02, TC-3D-04, TC-REG-22."
    },
    {
        "id": "UC-CHRG-01",
        "name": "Khởi tạo và hoàn tất phiên sạc pin tại trụ thông minh",
        "primary_actor": "Chủ xe đồng sở hữu (CO_OWNER) / STAFF",
        "secondary_actor": "Trụ sạc thông minh (Charging Station)",
        "description": "Người dùng cắm súng sạc vào xe tại bãi đỗ, chọn trụ sạc thông minh và kích hoạt phiên sạc. Hệ thống giám sát dòng điện, tính toán năng lượng lưu kho thực tế sau tổn hao (hiệu suất 92%) và cập nhật giá bình quân WAC.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Người dùng mở ChargingPanel trên giao diện 3D và nhấn 'Bắt Đầu Sạc'.",
        "preconditions": "1. Xe đang đỗ tại vị trí sạc trong Garage.\n2. Trụ sạc ở trạng thái AVAILABLE (Sẵn sàng).",
        "postconditions": "1. Tạo bản ghi ChargingSession (IN_PROGRESS -> COMPLETED).\n2. Kho năng lượng VehicleEnergyInventory được cộng thêm số kWh lưu kho thực tế và cập nhật giá bình quân WAC.",
        "main_flow": "1. Người dùng di chuyển camera lại gần cụm Trụ Sạc 3D, thanh HUD mở ChargingPanel.\n2. Người dùng cắm cáp sạc vào xe, hệ thống nhận diện cổng sạc CCS2.\n3. Người dùng chọn công suất sạc và nhấn 'Bắt Đầu Sạc'.\n4. Trình duyệt gửi POST /api/charging-sessions/{id}/start.\n5. ChargingSessionController gọi ChargingSessionService.startSession().\n6. CSDL cập nhật charging_sessions.status = 'IN_PROGRESS', vehicle.status = 'CHARGING'.\n7. Đồng hồ sạc hiển thị tiến trình nạp kWh theo thời gian thực.\n8. Khi pin đạt mức mong muốn hoặc người dùng nhấn 'Dừng Sạc', gửi POST /api/charging-sessions/{id}/complete.\n9. ChargingSessionService chốt tổng điện năng nạp thô deliveredEnergyKwh.\n10. VehicleEnergyInventoryService.recordChargingSessionCompletion() tính toán:\n    - Điện năng lưu kho thực tế = deliveredEnergy * 0.92 (áp dụng hiệu suất sạc 92%, tổn hao 8%).\n    - Tính đơn giá điện bình quân gia quyền mới (WAC) theo công thức.\n11. Hệ thống lưu bản ghi giao dịch CHARGING_INFLOW vào bảng vehicle_energy_transactions.\n12. Cập nhật số kWh và đơn giá mới vào bảng vehicle_energy_inventories.\n13. Trạng thái xe trở về AVAILABLE, trụ sạc trở về AVAILABLE.",
        "alt_flow": "3a. Người thực hiện là nhân viên STAFF (isStaffCharging = true): Phiên sạc được miễn phí sạc cho nhân viên (chargingCost = 0 đ), nhưng lượng điện lưu kho vẫn duy trì giá trị vốn theo biểu giá chuẩn để không làm loãng giá điện của xe về 0 đ.",
        "exception_flow": "8e. Người dùng bấm hoàn tất lần thứ hai do mạng lag: Hệ thống kiểm tra tính Idempotent (existsBySourceReferenceId) và bỏ qua không cộng dồn trùng lặp kho năng lượng.",
        "business_rules": "BR-CHRG-01 (Hiệu suất sạc vật lý chuẩn đạt 92%, tổn hao biến đổi 8%), BR-CHRG-02 (Staff sạc xe phục vụ vận hành không bị gán nợ cá nhân).",
        "related_fr": "FR-CHARGE-01, FR-CHARGE-03, FR-ENERGY-01.",
        "related_tc": "TC-CHRG-01, TC-CHRG-02, TC-CHRG-03, TC-ENER-01, TC-ENER-02, TC-ENER-03, TC-REG-06, TC-REG-07."
    },
    {
        "id": "UC-FIN-01",
        "name": "Tạo và phân bổ khoản chi phí phương tiện",
        "primary_actor": "Quản trị viên (ADMIN) / STAFF",
        "secondary_actor": "Hệ thống kế toán",
        "description": "Ghi nhận hóa đơn chi phí phát sinh của xe (Bảo hiểm, Bảo dưỡng, Thay lốp, Đăng kiểm) và tự động kích hoạt thuật toán phân bổ nợ chi tiết cho từng thành viên theo tỷ lệ sở hữu vốn (OWNERSHIP_RATIO) với kỹ thuật làm tròn lớn nhất Hare-Niemeyer.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Admin hoặc Staff tạo khoản chi phí mới trên giao diện tài chính và nhấn 'Phê Duyệt Phân Bổ'.",
        "preconditions": "1. Khoản chi phí có số tiền > 0, có chứng từ hóa đơn hợp lệ.\n2. Nhóm đồng sở hữu xe có tổng tỷ lệ sở hữu đúng bằng 100.0000%.",
        "postconditions": "1. Trạng thái Expense chuyển sang APPROVED.\n2. Tự động sinh danh sách các bản ghi ExpenseShare cho từng thành viên với tổng các phần tiền bằng chính xác 100% số tiền hóa đơn.",
        "main_flow": "1. Nhân viên hoặc Admin mở bảng tài chính xe, nhập thông tin hóa đơn: danh mục (INSURANCE, MAINTENANCE), số tiền (amount), ngày phát sinh và chính sách OWNERSHIP_RATIO.\n2. Nhấn nút 'Lưu và Phê Duyệt Khoản Chi'.\n3. Trình duyệt gửi POST /api/expenses/{id}/allocate.\n4. ExpenseController gọi ExpenseShareService.generateSharesForExpense().\n5. ExpenseShareService kiểm tra trạng thái expense.status == APPROVED.\n6. ExpenseShareService truy vấn danh sách cổ đông đang hoạt động từ bảng ownership_shares.\n7. Kiểm tra bất biến tổng vốn SUM(percentage) == 100.0000%.\n8. Sắp xếp danh sách thành viên theo tỷ lệ vốn giảm dần, ưu tiên thứ cấp theo userId.\n9. Áp dụng thuật toán Hare-Niemeyer:\n    - Tính phần tiền nguyên làm tròn VND cho từng thành viên: raw_i = round(amount * %_i / 100).\n    - Tính phần dư sai số: remainder = amount - sum(raw_i).\n    - Phân bổ phần dư sai số cho thành viên nắm giữ tỷ lệ cổ phần lớn nhất.\n10. Kiểm tra kiểm toán nghiêm ngặt: SUM(shares) == expense.amount.\n11. Lưu toàn bộ các bản ghi ExpenseShare với status = 'ALLOCATED'.\n12. Máy chủ trả về HTTP 200 OK kèm ExpenseAllocationResponse.\n13. Hệ thống gửi thông báo thông báo nghĩa vụ nợ đến từng đồng sở hữu.",
        "alt_flow": "1a. Chi phí tiền điện phát sinh từ chuyến đi (policy = USER_RESPONSIBILITY): Hệ thống phân bổ 100% chi phí cho cá nhân người lái, các đồng sở hữu khác nhận phần nợ 0 đ.",
        "exception_flow": "7e. Tổng tỷ lệ cổ phần nhóm bị sai lệch (!= 100%): Hệ thống ném IllegalStateException 'Tổng tỷ lệ sở hữu không hợp lệ. Yêu cầu đúng 100%' và từ chối phân bổ.",
        "business_rules": "BR-FIN-01 (Bảo toàn tuyệt đối giá trị tiền tệ: Tổng tiền phân bổ cho các thành viên phải bằng chính xác 100% số tiền chi phí phát sinh, không chênh lệch dù chỉ 1 đồng).",
        "related_fr": "FR-FIN-01, FR-FIN-02, FR-FIN-03.",
        "related_tc": "TC-FIN-01, TC-FIN-02, TC-FIN-03, TC-REG-17."
    },
    {
        "id": "UC-FIN-04",
        "name": "Nộp và xác minh thanh toán nghĩa vụ tài chính DEMO",
        "primary_actor": "Chủ xe đồng sở hữu (CO_OWNER)",
        "secondary_actor": "Nhân viên đối soát (STAFF)",
        "description": "Chủ xe xem danh sách các khoản nợ cá nhân chưa thanh toán, thực hiện nộp chứng từ chuyển khoản demo. Nhân viên tài chính đối soát giao dịch và phê duyệt để tất toán nghĩa vụ nợ.",
        "priority": "Cao (High)",
        "trigger": "Chủ xe nhấn nút 'Thanh Toán' trên giao diện Finance Zone Panel.",
        "preconditions": "Chủ xe có bản ghi ExpenseShare ở trạng thái ALLOCATED (Chưa thanh toán).",
        "postconditions": "1. Bản ghi PersonalExpensePayment chuyển từ PAYMENT_SUBMITTED sang PAYMENT_VERIFIED.\n2. Bản ghi ExpenseShare chuyển trạng thái sang SETTLED.",
        "main_flow": "1. Chủ xe mở Finance Zone Panel, xem danh sách các khoản nợ chi phí sạc hoặc bảo dưỡng.\n2. Chủ xe chọn khoản nợ, nhấn nút 'Thanh Toán'.\n3. Hộp thoại thanh toán DEMO hiển thị thông tin số tài khoản ảo và mã giao dịch đối soát.\n4. Chủ xe nhập mã tham chiếu 'DEMO-PAY-01' và đính kèm ảnh biên lai demo, bấm 'Xác Nhận Nộp Tiền'.\n5. Trình duyệt gửi POST /api/expenses/{id}/personal-payments kèm PersonalPaymentSubmitRequest.\n6. PersonalPaymentService tạo bản ghi PersonalExpensePayment với status = 'PAYMENT_SUBMITTED'.\n7. Nhân viên tài chính mở StaffPaymentVerificationModal trên giao diện Staff Fleet View.\n8. Nhân viên xem danh sách các chứng từ chờ duyệt, đối chiếu mã giao dịch và số tiền.\n9. Nhân viên nhấn nút 'Phê Duyệt Thanh Toán'.\n10. Trình duyệt gửi POST /api/personal-payments/{id}/verify kèm verify = true.\n11. PersonalPaymentService cập nhật payment.status = 'PAYMENT_VERIFIED', verifiedBy = staffId.\n12. PersonalPaymentService cập nhật expense_shares.status = 'SETTLED'.\n13. Máy chủ trả về HTTP 200 OK, khoản nợ được xóa bỏ khỏi danh sách nghĩa vụ của chủ xe.",
        "alt_flow": "9a. Chứng từ không hợp lệ (ảnh mờ, sai số tiền): Nhân viên bấm 'Từ Chối Thanh Toán' kèm lý do. Hệ thống chuyển payment.status = 'REJECTED', giữ nguyên ExpenseShare = ALLOCATED và gửi thông báo cho chủ xe nộp lại.",
        "exception_flow": "5e. Chủ xe cố tình nộp thanh toán trùng lặp khi đang có yêu cầu chờ duyệt: Hệ thống kiểm tra và trả về bản ghi đang chờ duyệt hiện tại, không sinh bản ghi rác.",
        "business_rules": "BR-FIN-02 (Quy trình thanh toán hai bước có nhân viên đối soát), BR-FIN-03 (Chủ xe không có quyền tự phê duyệt chứng từ thanh toán của chính mình).",
        "related_fr": "FR-FIN-04, FR-FIN-05, FR-FIN-06.",
        "related_tc": "TC-FIN-04, TC-FIN-05, TC-FIN-06, TC-FIN-07, TC-REG-18, TC-REG-23."
    },
    {
        "id": "UC-OWN-03",
        "name": "Khởi tạo và thực thi chuyển nhượng cổ phần đồng sở hữu",
        "primary_actor": "Chủ xe chuyển nhượng (Bên chuyển)",
        "secondary_actor": "Bên nhận, Trưởng nhóm (Leader) & CSDL",
        "description": "Chủ xe muốn rút bớt vốn hoặc chuyển giao một phần tỷ lệ sở hữu xe cho thành viên khác. Quy trình đòi hỏi sự đồng thuận của bên nhận, sự phê duyệt của trưởng nhóm và thực thi giao dịch nguyên tử bảo toàn tổng vốn 100%.",
        "priority": "Rất cao (Must Have)",
        "trigger": "Chủ xe mở CoOwnerOwnershipPanel và nhấn nút 'Chuyển Nhượng Cổ Phần'.",
        "preconditions": "1. Bên chuyển đang nắm giữ tỷ lệ cổ phần lớn hơn số lượng muốn chuyển nhượng.\n2. Bên chuyển và bên nhận đều là thành viên hợp lệ của nhóm xe.\n3. Xe không có tranh chấp hoặc chuyến đi đang diễn ra.",
        "postconditions": "1. Giảm % cổ phần bên chuyển, tăng % cổ phần bên nhận trong bảng ownership_shares.\n2. Ghi nhận lịch sử biến động vào ownership_change_history.\n3. Bảo toàn bất biến tổng tỷ lệ sở hữu bằng đúng 100.0000%.",
        "main_flow": "1. Bên chuyển mở CoOwnerOwnershipPanel, nhập tỷ lệ muốn chuyển (ví dụ 10%), chọn thành viên nhận và số tiền thỏa thuận.\n2. Nhấn nút 'Gửi Đề Xuất Chuyển Nhượng'.\n3. Trình duyệt gửi POST /api/ownership-transfers kèm CreateTransferRequest.\n4. OwnershipTransferService kiểm tra tỷ lệ chuyển nhượng <= tỷ lệ đang sở hữu.\n5. Tạo bản ghi OwnershipTransferRequest với status = 'PENDING_CONSENT'.\n6. Bên nhận đăng nhập hệ thống, nhận thông báo đề xuất chuyển nhượng.\n7. Bên nhận xem chi tiết và nhấn nút 'Chấp Thuận'.\n8. Trình duyệt gửi POST /api/ownership-transfers/{id}/accept, request chuyển status = 'PENDING_APPROVAL'.\n9. Trưởng nhóm (Leader) nhận thông báo, xem xét cơ cấu vốn mới và nhấn 'Phê Duyệt'.\n10. Trình duyệt gửi POST /api/ownership-transfers/{id}/complete.\n11. OwnershipTransferService thực thi giao dịch nguyên tử @Transactional:\n    - Trừ 10% cổ phần của bên chuyển.\n    - Cộng 10% cổ phần cho bên nhận.\n    - Kiểm tra bất biến tổng vốn SUM == 100.0000%.\n    - Lưu bản ghi lịch sử vào ownership_change_history.\n    - Cập nhật transfer.status = 'COMPLETED'.\n12. Máy chủ trả về HTTP 200 OK, hệ thống làm mới bảng cơ cấu cổ đông.",
        "alt_flow": "1a. Chuyển nhượng biếu tặng có giá trị bằng 0 đ (Zero-Value Settlement): Hệ thống xử lý bình thường mà không yêu cầu bước chứng từ tài chính.\n7a. Bên nhận từ chối nhận chuyển nhượng: Gửi POST reject, transfer chuyển status = REJECTED, quy trình kết thúc.",
        "exception_flow": "4e. Bên chuyển nhập số % vượt quá số lượng mình đang nắm giữ: Hệ thống ném ngoại lệ IllegalArgumentException 'Tỷ lệ chuyển nhượng vượt quá số lượng sở hữu hiện tại'.",
        "business_rules": "BR-OWN-02 (Mọi giao dịch chuyển nhượng cổ phần phải được thực thi nguyên tử trong một Transaction để đảm bảo tính toàn vẹn dữ liệu), BR-OWN-03 (Bảo toàn tổng 100.0000% vốn).",
        "related_fr": "FR-OWN-03, FR-OWN-04, FR-OWN-05, FR-OWN-06.",
        "related_tc": "TC-OWN-02, TC-OWN-03, TC-OWN-04, TC-REG-09, TC-REG-19."
    }
]

print("Built 14 Major Use Cases for Chapter 3.")

out_content = f"""# -*- coding: utf-8 -*-
\"\"\"
v3_data_usecases.py - Danh mục và chi tiết đặc tả 88 Use Cases chuẩn hóa cho V3
\"\"\"

MAJOR_USE_CASES = {repr(MAJOR_UCS)}

def get_major_use_cases():
    return MAJOR_USE_CASES
"""

with open(out_py, "w", encoding="utf-8") as fp:
    fp.write(out_content)

print(f"Generated {out_py}")
