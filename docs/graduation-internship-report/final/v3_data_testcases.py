# -*- coding: utf-8 -*-
"""
v3_data_testcases.py - Cung cấp đầy đủ chính xác 100 test cases
Trạng thái: 100% NOT EXECUTED theo quy chuẩn học thuật
"""
import os
import re

TEST_MD_PATH = r"D:\EV3D\docs\graduation-internship-report\MANUAL_TEST_CASES.md"

def load_test_cases():
    test_cases = []
    if os.path.exists(TEST_MD_PATH):
        with open(TEST_MD_PATH, "r", encoding="utf-8") as fp:
            for line in fp:
                line_s = line.strip()
                if line_s.startswith("|") and "**TC-" in line_s:
                    parts = [p.strip() for p in line_s.strip("|").split("|")]
                    if len(parts) >= 10:
                        tc_id = re.sub(r'[\*\_]', '', parts[0]).strip()
                        req_id = parts[1].strip()
                        name = parts[2].strip()
                        actor = parts[3].strip()
                        pre = parts[4].strip()
                        data = parts[5].strip()
                        steps = parts[6].replace("<br>", "\n").strip()
                        expected = parts[7].replace("<br>", "\n").strip()
                        status = "NOT EXECUTED"
                        evidence = parts[9].strip()
                        test_cases.append({
                            "id": tc_id,
                            "req_id": req_id,
                            "name": name,
                            "actor": actor,
                            "preconditions": pre,
                            "test_data": data,
                            "steps": steps,
                            "expected": expected,
                            "status": status,
                            "evidence": evidence
                        })
                        
    # Bổ sung 31 ca hồi quy nghiệp vụ để đạt chính xác 100 Test Cases theo yêu cầu
    regression_cases = [
        ("TC-REG-01", "FR-UI-01", "Kiểm tra cấu trúc phân cấp thẻ JSX không bị lồng sai thẻ", "Frontend", "Trình duyệt WebGL 2.0", "DOM Hierarchy", "1. Mở màn hình Garage 3D\n2. Kiểm tra DOM Inspector", "Không xuất hiện lỗi React warning về invalid DOM nesting", "StandardPanelShell.tsx"),
        ("TC-REG-02", "FR-TRIP-02", "Ngăn chặn lỗi undefined activeTripFormattedDuration khi chưa có chuyến đi", "CO_OWNER", "Đăng nhập tài khoản không có chuyến đi", "activeTrip = null", "1. Mở Overview Panel\n2. Kiểm tra thuộc tính hiển thị thời lượng", "Hiển thị chuỗi mặc định '--:--' thay vì ném lỗi TypeError undefined", "ActiveTripDetailPanel.tsx"),
        ("TC-REG-03", "FR-VEH-01", "Đồng bộ bộ truy xuất (Accessor) VehicleResponse giữa Frontend và DTO", "Hệ thống", "Gọi API GET /api/vehicles/{id}", "JSON response", "1. Gửi request lấy thông tin xe\n2. Đối chiếu trường currentBatteryLevel và odo", "Các trường camelCase khớp 100% không bị null giá trị", "VehicleResponse.java"),
        ("TC-REG-04", "FR-VEH-02", "Đồng bộ trạng thái xe tức thời giữa CSDL và giao diện 3D", "CO_OWNER / STAFF", "Xe vừa đổi trạng thái sang CHARGING", "vehicleId: EV-01", "1. Bắt đầu phiên sạc\n2. Quan sát màu hào quang và trạng thái trên HUD", "Mô hình xe chuyển màu hiệu ứng sạc, không bị trễ trạng thái cũ AVAILABLE", "VehicleDigitalTwin.tsx"),
        ("TC-REG-05", "FR-UI-02", "Kiểm tra kết xuất mượt mà bảng điều khiển tổng quan CO_OWNER Overview", "CO_OWNER", "Đăng nhập quyền CO_OWNER", "HUD Overview", "1. Tải màn hình /garage\n2. Render CoOwnerQuickActionDock", "Dock nổi ở góc dưới, không bị giật lag khung hình (< 16ms)", "CoOwnerQuickActionDock.tsx"),
        ("TC-REG-06", "FR-FIN-08", "Ngăn chặn phân bổ chi phí sạc trùng lặp cho cùng một phiên sạc", "Hệ thống", "Phiên sạc đã hoàn tất nạp kho", "sessionId: <uuid>", "1. Kích hoạt hoàn tất phiên sạc lần 2", "Kiểm tra existsBySourceReferenceId chặn tạo thêm bản ghi Expense trùng", "ExpenseShareService.java:95"),
        ("TC-REG-07", "FR-CHRG-04", "Kiểm tra quyền sạc phục vụ vận hành của STAFF không bị gán nợ", "STAFF", "Đăng nhập tài khoản STAFF", "isStaffCharging = true", "1. Nhân viên cắm sạc xe\n2. Hoàn tất sạc", "Nạp năng lượng vào kho nhưng personal debt của nhân viên bằng 0 đ", "VehicleEnergyInventoryService.java:181"),
        ("TC-REG-08", "FR-CHRG-05", "Chặn người dùng lạ tự ý bấm dừng phiên sạc xe người khác", "CO_OWNER", "Xe đang được sạc bởi User A", "Token User B", "1. User B gọi POST /api/charging-sessions/{id}/complete", "Trả về HTTP 403 Forbidden hoặc lỗi Unauthorized", "ChargingSessionController.java"),
        ("TC-REG-09", "FR-OWN-07", "Xử lý tất toán chuyển nhượng cổ phần có giá trị bằng 0 (Zero-Value)", "CO_OWNER", "Chuyển nhượng biếu tặng 5% cổ phần (0 đ)", "transferAmount = 0 VND", "1. Khởi tạo chuyển nhượng 0 đ\n2. Thực thi tất toán", "Giao dịch thành công, không bị lỗi chia cho 0 hoặc chặn số tiền rỗng", "OwnershipTransferService.java"),
        ("TC-REG-10", "FR-INV-05", "Kích hoạt tư cách thành viên mới sau khi đủ 100% điều kiện chữ ký", "Hệ thống", "Đủ 100% cổ đông đồng thuận và ký hợp đồng", "invitationId: <uuid>", "1. Hệ thống quét điều kiện kích hoạt", "Tự động đổi trạng thái ACTIVATED, gán quyền truy cập Garage 3D xe", "MembershipInvitationService.java"),
        ("TC-REG-11", "FR-CON-05", "Bảo đảm tính nhất quán phiên bản hợp đồng (Contract Version Consistency)", "Hệ thống", "Tạo phiên bản hợp đồng mới V2", "contractId: <id>", "1. Kích hoạt phiên bản V2", "Phiên bản V1 chuyển sang SUPERSEDED, không thể ký lại phiên bản cũ", "CoOwnershipContractService.java"),
        ("TC-REG-12", "FR-3D-07", "Kiểm tra phục hồi góc nhìn camera mặc định sau khi xoay lật tự do", "Người dùng", "Camera bị xoay lệch xa bục Garage", "Click 'Reset Camera'", "1. Bấm nút Đặt Lại Góc Nhìn", "Camera chuyển động Tween mượt về tọa độ (0, 2.5, 6.0) nhìn thẳng xe", "GarageScene.tsx"),
        ("TC-REG-13", "FR-UI-03", "Ngăn chặn hiện tượng chồng lấn giữa Panel nghiệp vụ và Carousel chọn xe", "STAFF / ADMIN", "Mở StaffVehicleDetailPanel", "Carousel đang hiển thị", "1. Mở panel chi tiết xe\n2. Quan sát vị trí", "Carousel tự động thu gọn hoặc ẩn mờ, không đè lấn nút bấm của panel", "StaffOperationalCarousel.tsx"),
        ("TC-REG-14", "FR-AUTH-06", "Kiểm tra phân quyền chéo vai trò (Cross-Role Authorization Guard)", "CO_OWNER", "Đăng nhập tài khoản CO_OWNER", "URL: /api/staff/approved-work", "1. Gọi API nội bộ của STAFF", "Spring Security chặn với mã HTTP 403 Access Denied", "SecurityConfig.java"),
        ("TC-REG-15", "FR-TRIP-10", "Chặn bắt đầu chuyến đi khi mức pin xe dưới ngưỡng an toàn (< 20%)", "CO_OWNER", "Xe có mức pin 15%", "startTrip request", "1. Gửi request bắt đầu chuyến đi", "Báo lỗi BatteryLevelTooLowException yêu cầu sạc trước khi đi", "TripService.java"),
        ("TC-REG-16", "FR-TRIP-11", "Tự động tính toán lượng điện tiêu thụ thực tế bằng chênh lệch SOC đầu cuối", "Hệ thống", "Start SOC = 80%, End SOC = 60%, Dung lượng = 80 kWh", "Chuyến đi kết thúc", "1. Staff xác nhận ODO và Pin trả", "Tính chính xác consumedEnergy = (80 - 60) * 80 / 100 = 16.0 kWh", "VehicleEnergyModelService.java"),
        ("TC-REG-17", "FR-FIN-09", "Kiểm toán tổng giá trị phân bổ nợ khớp 100% số tiền hóa đơn phát sinh", "Hệ thống", "Hóa đơn bảo hiểm 10.000.000 đ", "Chia 3 cổ đông (40%, 35%, 25%)", "1. Kích hoạt tính toán phân bổ", "Tổng số tiền các bản ghi ExpenseShare cộng lại bằng đúng 10.000.000 đ", "ExpenseShareService.java:228"),
        ("TC-REG-18", "FR-FIN-10", "Chặn duyệt thanh toán khi chứng từ bị nhân viên từ chối", "STAFF", "Thanh toán bị đánh dấu REJECTED", "paymentId: <id>", "1. Cố gắng gọi verify = true lần 2", "Hệ thống từ chối cập nhật trên chứng từ đã bị bác bỏ", "PersonalPaymentService.java"),
        ("TC-REG-19", "FR-OWN-08", "Bảo toàn bất biến tổng tỷ lệ sở hữu bằng đúng 100.0000% sau chuyển nhượng", "Hệ thống", "Nhóm có 3 thành viên: 40%, 35%, 25%", "Chuyển 5% từ User A sang User C", "1. Hoàn tất giao dịch chuyển nhượng", "Tổng tỷ lệ: 35% + 35% + 30% = 100.0000% chính xác", "OwnershipTransferService.java"),
        ("TC-REG-20", "FR-VOTE-05", "Tính đúng tỷ lệ biểu quyết theo trọng số cổ phần nắm giữ", "CO_OWNER", "User A nắm 45% cổ phần bỏ phiếu FOR", "Đề xuất biểu quyết", "1. User A bỏ phiếu thuận", "Tỷ lệ phiếu thuận đạt ngay 45.0000% trên tổng số phiếu bầu", "VoteProposalService.java"),
        ("TC-REG-21", "FR-DISP-05", "Tự động trừ nghĩa vụ tài chính sau khi bồi thường hòa giải được duyệt", "STAFF", "Chủ xe được duyệt bồi hoàn 50.000 đ", "Khoản nợ hiện tại: 85.000 đ", "1. Thực thi bồi thường tranh chấp", "Khoản nợ ExpenseShare tự động giảm xuống còn 35.000 đ", "DisputeService.java"),
        ("TC-REG-22", "FR-3D-08", "Kiểm tra hiệu ứng Raycaster bắt điểm va chạm Mesh không bị trôi lệch", "Người dùng", "Góc nhìn camera 45 độ", "Click tọa độ (x, y)", "1. Nhấp chuột vào nắp ca-pô", "Tọa độ 3D xác định chính xác trên bề mặt Mesh vỏ xe", "DamageHotspots.tsx"),
        ("TC-REG-23", "FR-NOTI-03", "Phát sinh thông báo đẩy khi có đề xuất biểu quyết mới trong nhóm", "CO_OWNER", "Một thành viên vừa tạo VoteProposal", "Sự kiện PROPOSAL_OPENED", "1. Hệ thống lưu bản ghi biểu quyết", "Gửi thông báo đến toàn bộ các đồng sở hữu khác của cùng xe", "NotificationService.java"),
        ("TC-REG-24", "FR-MAINT-05", "Tự động khóa lịch đặt xe khi xe chuyển sang trạng thái MAINTENANCE", "Hệ thống", "Xe có trạng thái MAINTENANCE", "Tạo lịch đặt xe mới", "1. Co-Owner cố gắng đặt xe bảo dưỡng", "Hệ thống chặn không cho phép đặt xe đang bảo dưỡng", "BookingService.java:110"),
        ("TC-REG-25", "FR-SEC-03", "Kiểm tra vô hiệu hóa mã token JWT khi người dùng thực hiện đăng xuất", "Hệ thống", "Người dùng gọi /api/auth/logout", "Refresh token", "1. Gửi request đăng xuất", "Xóa refresh token trong CSDL, không thể dùng token cũ để refresh", "AuthService.java"),
        ("TC-REG-26", "FR-SEC-04", "Bảo vệ thông tin cá nhân: Không để lộ hash mật khẩu trong các API trả về", "Hệ thống", "Gọi API GET /api/admin/users", "UserResponse DTO", "1. Nhận JSON danh sách người dùng", "Trường password không xuất hiện trong payload trả về phía client", "UserResponse.java"),
        ("TC-REG-27", "FR-AI-01", "Kiểm tra xử lý Timeout khi gọi mô hình Trợ lý ảo AI", "CO_OWNER", "Mô hình AI phản hồi quá 10 giây", "Prompt câu hỏi phức tạp", "1. Gửi tin nhắn tới AI\n2. Chờ phản hồi", "Hiển thị thông báo đang bận, không làm treo ứng dụng hay crash giao diện", "AiZonePanel.tsx"),
        ("TC-REG-28", "FR-INS-03", "Kiểm tra giới hạn số lượng ảnh chụp đính kèm trong biên bản kiểm định", "STAFF", "Tải ảnh tổn hại thân vỏ", "12 ảnh JPEG", "1. Chọn tải lên 12 ảnh cùng lúc", "Hệ thống chấp nhận tối đa 10 ảnh đầu tiên, cảnh báo vượt quá giới hạn", "VehicleInspectionController.java"),
        ("TC-REG-29", "FR-DATA-01", "Kiểm tra định dạng ngày giờ chuẩn ISO 8601 UTC trên các trường thời gian", "Hệ thống", "Các DTO trả về thời gian", "createdAt, startTime", "1. Kiểm tra payload JSON các API", "Tất cả các trường ngày giờ đều có đuôi 'Z' hoặc múi giờ UTC chuẩn mực", "JacksonConfig.java"),
        ("TC-REG-30", "FR-DATA-02", "Kiểm tra phân trang kết quả tìm kiếm danh sách lịch sử chuyến đi", "CO_OWNER", "Có hơn 50 bản ghi chuyến đi", "page=0&size=10", "1. Gọi API GET /api/vehicles/{id}/trips?page=0&size=10", "Trả về cấu trúc Page<TripResponse> có totalElements và totalPages chính xác", "TripController.java"),
        ("TC-REG-31", "FR-ERR-01", "Kiểm tra phản hồi thân thiện của GlobalExceptionHandler khi nhận mã lỗi 400", "Hệ thống", "Gửi payload JSON sai cấu trúc", "Request không hợp lệ", "1. Gửi POST với trường email rỗng", "Trả về HTTP 400 Bad Request với format JSON chuẩn: timestamp, status, error, message", "GlobalExceptionHandler.java")
    ]
    
    for r in regression_cases:
        test_cases.append({
            "id": r[0],
            "req_id": r[1],
            "name": r[2],
            "actor": r[3],
            "preconditions": r[4],
            "test_data": r[5],
            "steps": r[6],
            "expected": r[7],
            "status": "NOT EXECUTED",
            "evidence": r[8]
        })
        
    return test_cases[:100]

if __name__ == "__main__":
    tcs = load_test_cases()
    print(f"Total Test Cases loaded: {len(tcs)}")
    print("First TC:", tcs[0]["id"])
    print("100th TC:", tcs[-1]["id"], "-", tcs[-1]["name"])
