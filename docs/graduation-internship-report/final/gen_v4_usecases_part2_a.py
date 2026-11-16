# -*- coding: utf-8 -*-
"""
gen_v4_usecases_part2_a.py - Tạo 20 Use Case CHRG (6), FIN (7), MAINT (7) cho Part 2.
"""

UCS_CHRG_FIN_MAINT = [
    # =========================================================================
    # 7. CHARGING MANAGEMENT & ENERGY INVENTORY (6 UCs)
    # =========================================================================
    {
        "id": "UC-CHRG-01",
        "name": "Khởi tạo và hoàn tất phiên sạc pin tại trụ thông minh",
        "primary_actor": "Đồng sở hữu hoặc Nhân viên vận hành",
        "secondary_actor": "Trụ sạc thông minh IoT, Hệ thống CSDL",
        "description": "Người dùng cắm súng sạc vào xe, quét mã QR trên trụ sạc để khởi động phiên nạp điện thông minh, theo dõi tiến trình và ngắt sạc an toàn khi pin đầy.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng cắm súng sạc vào cổng nạp của xe và nhấn 'Bắt đầu sạc' trên ứng dụng.",
        "preconditions": "Xe đang kết nối vật lý với trụ sạc; trụ sạc ở trạng thái AVAILABLE; tài khoản có quyền nạp điện.",
        "postconditions": "Tạo bản ghi `charging_sessions` ở trạng thái CHARGING; cập nhật trạng thái trụ sạc sang IN_USE.",
        "main_flow": (
            "1. Người dùng đưa xe tới trụ sạc EVShare tại trạm, mở nắp cổng sạc và cắm súng sạc DC/AC vào xe.\n"
            "2. Mở ứng dụng tại màn hình `/charging`, quét mã QR dán trên trụ sạc hoặc chọn trụ sạc trên bản đồ trạm.\n"
            "3. Ứng dụng hiển thị thông tin trụ sạc: Loại súng sạc CCS2, Công suất tối đa 60 kW, Đơn giá 3.850 đ/kWh (BR-CHG-02).\n"
            "4. Người dùng thiết lập giới hạn sạc mục tiêu (ví dụ sạc đến 80% hoặc sạc đầy 100%) và nhấn 'Bắt đầu sạc'.\n"
            "5. Frontend gửi HTTP POST tới `/api/charging-sessions` kèm payload `CreateChargingSessionRequest` (vehicleId, stationId, targetSoc).\n"
            "6. Controller `ChargingSessionController:createChargingSession()` tiếp nhận.\n"
            "7. `ChargingSessionService` phát tín hiệu tới bộ điều khiển trụ sạc thông minh kiểm tra an toàn tiếp địa và điện áp lưới.\n"
            "8. Khi trụ sạc phản hồi sẵn sàng, hệ thống tạo bản ghi trong `charging_sessions`: `start_time = NOW()`, `start_soc = currentSOC`, `status = CHARGING`.\n"
            "9. Cập nhật trạng thái xe thành `CHARGING` và trụ sạc thành `OCCUPIED`.\n"
            "10. Máy chủ trả về HTTP 201 Created kèm mã phiên sạc `sessionId`.\n"
            "11. Giao diện chuyển sang màn hình giám sát sạc pin 3D thời gian thực."
        ),
        "alt_flow": (
            "Tại bước 7, nếu súng sạc chưa được cắm chặt vào cổng nạp: Trụ sạc phát tín hiệu cảnh báo, hệ thống thông báo 'Chưa phát hiện kết nối súng sạc. Vui lòng cắm chặt súng sạc vào xe và thử lại'."
        ),
        "exception_flow": (
            "Tại bước 7, nếu trụ sạc đang bị lỗi kỹ thuật hoặc mất kết nối mạng: Hệ thống trả về HTTP 503 Service Unavailable kèm thông báo 'Trụ sạc tạm ngưng phục vụ. Vui lòng chọn trụ sạc khác lân cận'."
        ),
        "business_rules": "BR-CHG-01, BR-CHG-02",
        "related_fr": "FR-CHG-01",
        "related_tc": "TC-CHG-01"
    },
    {
        "id": "UC-CHRG-02",
        "name": "Theo dõi tiến trình sạc thời gian thực",
        "primary_actor": "Đồng sở hữu, Nhân viên trạm",
        "secondary_actor": "Bộ đo đếm công suất trụ sạc IoT & CSDL",
        "description": "Người dùng giám sát các thông số nạp điện trực tiếp trên giao diện: công suất sạc tức thời (kW), điện áp (V), dòng điện (A), dung lượng pin hiện tại (SOC %), thời gian còn lại ước tính và nhiệt độ khối pin.",
        "priority": "Cao (High)",
        "trigger": "Phiên sạc đang diễn ra (status = CHARGING).",
        "preconditions": "Phiên sạc đang hoạt động bình thường.",
        "postconditions": "Các thông số năng lượng được làm mới liên tục mỗi 5 giây trên `ChargingPanel.tsx`.",
        "main_flow": (
            "1. Người dùng mở màn hình theo dõi sạc `/charging/active`.\n"
            "2. Giao diện định kỳ gửi HTTP GET tới `/api/charging-sessions/active` mỗi 5 giây.\n"
            "3. Controller `ChargingSessionController:getActiveSession()` tiếp nhận.\n"
            "4. Service truy vấn các chỉ số đo đếm tức thời từ thiết bị IoT trụ sạc.\n"
            "5. Dữ liệu trả về: Công suất hiện thời 48.5 kW, Điện áp 395 V, Dòng điện 122 A, Mức pin hiện tại 54% (tăng từ 32%), Thời gian sạc dự kiến còn lại 22 phút, Nhiệt độ pin 31.2°C.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị hoạt ảnh dòng điện nạp vào mô hình xe 3D và biểu đồ công suất sạc theo thời gian."
        ),
        "alt_flow": (
            "Tại bước 5, khi mức pin đạt ngưỡng 80%: Công suất sạc tự động hạ từ 50 kW xuống 15 kW (chế độ bảo vệ tuổi thọ cell pin) và giao diện hiển thị thông báo 'Chuyển sang chế độ sạc chậm bảo vệ pin'."
        ),
        "exception_flow": (
            "Tại bước 5, nếu nhiệt độ pin vượt ngưỡng an toàn (> 45°C): Hệ thống tự động giảm công suất sạc khẩn cấp hoặc ngắt sạc tạm thời để làm mát."
        ),
        "business_rules": "BR-CHG-01",
        "related_fr": "FR-CHG-02",
        "related_tc": "TC-CHG-02"
    },
    {
        "id": "UC-CHRG-03",
        "name": "Dừng và hoàn tất phiên sạc điện",
        "primary_actor": "Đồng sở hữu hoặc Nhân viên kết thúc sạc",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kho năng lượng WAC",
        "description": "Người dùng chủ động nhấn dừng sạc hoặc hệ thống tự ngắt khi pin đạt giới hạn thiết lập. Hệ thống áp dụng hiệu suất nạp 92%, đơn giá EVN 3.850 đ/kWh, tính toán lại giá vốn bình quân gia quyền WAC và cập nhật kho điện.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Dừng sạc' hoặc pin đạt targetSoc thiết lập.",
        "preconditions": "Phiên sạc đang ở trạng thái CHARGING.",
        "postconditions": "Cập nhật `charging_sessions.status = COMPLETED`, cộng năng lượng thực nạp vào kho pin xe, cập nhật đơn giá vốn WAC.",
        "main_flow": (
            "1. Người dùng nhấn nút 'Dừng sạc' trên ứng dụng hoặc rút súng sạc sau khi mở khóa an toàn.\n"
            "2. Frontend gửi HTTP POST tới `/api/charging-sessions/{sessionId}/stop`.\n"
            "3. Controller `ChargingSessionController` chuyển tiếp tới `VehicleEnergyInventoryService:completeChargingSession()`.\n"
            "4. Trụ sạc ngắt nguồn điện cấp, chốt tổng điện năng xuất ra tại trụ: `rawEnergyKwh` (ví dụ: 35.0 kWh).\n"
            "5. Áp dụng quy tắc hiệu suất nạp 92% (BR-CHG-01): `energyAddedKwh = rawEnergyKwh * 0.92` (ví dụ 35.0 * 0.92 = 32.2 kWh thực nạp vào pin).\n"
            "6. Tính chi phí tiền điện theo giá EVN 3.850 đ/kWh (BR-CHG-02): `totalCost = rawEnergyKwh * 3850` (ví dụ 35.0 * 3.850 = 134.750 đ).\n"
            "7. Hệ thống cập nhật kho năng lượng `vehicle_energy_inventories`:\n"
            "   - Cộng dồn lượng điện: `current_energy_kwh += energyAddedKwh`.\n"
            "   - Tính toán lại đơn giá vốn bình quân gia quyền mới (WAC): `newWAC = (oldEnergy * oldWAC + rawEnergy * 3850) / (oldEnergy + rawEnergy)` (BR-CHG-03).\n"
            "8. Ghi bản ghi nhập kho vào bảng `vehicle_energy_transactions` với loại `CHARGING_ADDITION`.\n"
            "9. Cập nhật `charging_sessions`: `end_time = NOW()`, `end_soc = currentSOC`, `energy_kwh = rawEnergyKwh`, `total_cost = totalCost`, `status = COMPLETED`.\n"
            "10. Giải phóng trạng thái trụ sạc về `AVAILABLE` và xe về `AVAILABLE`.\n"
            "11. Máy chủ trả về HTTP 200 OK kèm thông tin hóa đơn sạc điện chi tiết."
        ),
        "alt_flow": (
            "Tại bước 1, nếu pin đạt 100%: Trụ sạc tự động ngắt dòng điện an toàn và gửi thông báo 'Pin đã được sạc đầy 100%. Vui lòng rút súng sạc'."
        ),
        "exception_flow": (
            "Tại bước 1, nếu súng sạc bị rút đột ngột trong khi đang nạp công suất cao: Hệ thống tự động kích hoạt ngắt mạch khẩn cấp và ghi nhận trạng thái kết thúc kèm cảnh báo 'Phiên sạc bị ngắt đột ngột'."
        ),
        "business_rules": "BR-CHG-01, BR-CHG-02, BR-CHG-03",
        "related_fr": "FR-CHG-03, FR-CHG-04",
        "related_tc": "TC-CHG-03"
    },
    {
        "id": "UC-CHRG-04",
        "name": "Tra cứu trạng thái sức khỏe cụm pin (Battery SOH/SOC)",
        "primary_actor": "Đồng sở hữu, Kỹ thuật viên bảo dưỡng",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ quản lý Pin",
        "description": "Người dùng tra cứu các chỉ số sức khỏe suy thoái pin xe điện theo thời gian: tỷ lệ phần trăm sức khỏe SOH (State of Health %), dung lượng khả dụng thực tế (kWh) so với dung lượng thiết kế, chu kỳ sạc xả và nhiệt độ trung bình.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng mở tab 'Sức khỏe Pin' tại trang chi tiết xe.",
        "preconditions": "Phương tiện có bản ghi theo dõi trong bảng `vehicle_battery_health`.",
        "postconditions": "Hiển thị biểu đồ suy thoái SOH theo thời gian và đánh giá mức độ thoái hóa cell pin.",
        "main_flow": (
            "1. Người dùng mở tab 'Pin & Năng lượng' tại `/vehicles/{vehicleId}/battery`.\n"
            "2. Giao diện gửi HTTP GET tới `/api/vehicles/{vehicleId}/battery-health`.\n"
            "3. Controller `BatteryHealthController:getBatteryHealth()` tiếp nhận.\n"
            "4. Service truy vấn bảng `vehicle_battery_health` lấy bản ghi đo đếm gần nhất.\n"
            "5. Dữ liệu trả về: Chỉ số SOH = 96.5%, Dung lượng danh định = 82.0 kWh, Dung lượng khả dụng thực tế = 79.13 kWh, Số chu kỳ sạc xả (Cycle Count) = 142 chu kỳ, Trạng thái cell pin = TỐT (HEALTHY).\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị biểu đồ đường xu hướng suy thoái SOH qua các tháng và đưa ra khuyến nghị sử dụng pin tối ưu (duy trì mức sạc 20% - 80%)."
        ),
        "alt_flow": (
            "Tại bước 5, nếu chỉ số SOH giảm xuống dưới 80%: Hệ thống tự động kích hoạt cảnh báo màu cam và gợi ý đặt lịch kiểm định pin tại xưởng dịch vụ ủy quyền."
        ),
        "exception_flow": (
            "Tại bước 4, nếu xe mới bàn giao chưa có dữ liệu đo đếm BMS: Hệ thống trả về thông số mặc định SOH = 100.0% theo tiêu chuẩn nhà sản xuất."
        ),
        "business_rules": "BR-3D-02",
        "related_fr": "FR-3D-04",
        "related_tc": "TC-CHG-04"
    },
    {
        "id": "UC-CHRG-05",
        "name": "Xem báo cáo kho năng lượng xe (Energy Inventory)",
        "primary_actor": "Đồng sở hữu trong nhóm, Nhân viên kế toán",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng theo dõi trạng thái số dư kho điện tích lũy trong pin xe (kWh), đơn giá vốn bình quân gia quyền hiện hành (WAC VND/kWh) và tổng giá trị tài sản năng lượng đang tồn trữ.",
        "priority": "Cao (High)",
        "trigger": "Người dùng chọn xem 'Kho năng lượng' trong mục Quản lý tài chính xe.",
        "preconditions": "Người dùng là thành viên nhóm sở hữu phương tiện.",
        "postconditions": "Hiển thị bảng cân đối kho điện và biến động giá vốn WAC.",
        "main_flow": (
            "1. Người dùng mở trang `/vehicles/{vehicleId}/energy-inventory`.\n"
            "2. Frontend gửi HTTP GET tới `/api/vehicles/{vehicleId}/energy-inventory`.\n"
            "3. Controller `EnergyInventoryController:getEnergyInventory()` tiếp nhận.\n"
            "4. Service truy vấn bảng `vehicle_energy_inventories` theo `vehicle_id`.\n"
            "5. Dữ liệu trả về: Năng lượng tồn kho thực tế = 65.6 kWh, Đơn giá vốn bình quân gia quyền hiện tại = 3.850 đ/kWh, Tổng giá trị tồn kho = 252.560 đ, Thời điểm cập nhật giá vốn gần nhất.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị thẻ thông tin kho điện trực quan kèm biểu đồ biến động đơn giá WAC qua các lần nạp điện."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp nút 'Xem chi tiết các giao dịch' để chuyển sang xem sổ cái xuất nhập kho năng lượng (UC-CHRG-06)."
        ),
        "exception_flow": (
            "Tại bước 4, nếu kho năng lượng chưa được khởi tạo: Hệ thống tự động tạo bản ghi kho năng lượng mặc định với giá vốn 3.850 đ/kWh."
        ),
        "business_rules": "BR-CHG-03",
        "related_fr": "FR-CHG-04",
        "related_tc": "TC-CHG-05"
    },
    {
        "id": "UC-CHRG-06",
        "name": "Tra cứu lịch sử giao dịch xuất/nhập kho năng lượng",
        "primary_actor": "Đồng sở hữu, Kiểm toán viên nội bộ",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Truy xuất danh sách chi tiết các lần nạp điện (Nhập kho năng lượng) và các chuyến đi đã tiêu thụ điện (Xuất kho năng lượng), bảo đảm tính minh bạch kế toán năng lượng.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng chọn xem 'Sổ cái giao dịch năng lượng' tại `/vehicles/{vehicleId}/energy-transactions`.",
        "preconditions": "Người dùng thuộc nhóm đồng sở hữu phương tiện.",
        "postconditions": "Bảng dữ liệu xuất nhập kho năng lượng được hiển thị chi tiết theo thứ tự thời gian.",
        "main_flow": (
            "1. Người dùng mở trang tra cứu giao dịch năng lượng.\n"
            "2. Frontend gửi HTTP GET tới `/api/vehicles/{vehicleId}/energy-inventory/transactions?page=0&size=15`.\n"
            "3. Controller `EnergyInventoryController:getEnergyTransactions()` tiếp nhận.\n"
            "4. Service truy vấn bảng `vehicle_energy_transactions` sắp xếp giảm dần theo `created_at`.\n"
            "5. Dữ liệu trả về danh sách: Ngày giao dịch, Loại (CHARGING_ADDITION / TRIP_CONSUMPTION), Sản lượng kWh (+ hoặc -), Đơn giá WAC áp dụng, Thành tiền (VND), Số dư kho sau giao dịch.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng nhật ký năng lượng có mã màu: Dòng xanh lá (Nạp điện vào kho), Dòng đỏ (Tiêu hao do chuyến đi)."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể lọc danh sách chỉ xem các phiên sạc pin hoặc chỉ xem các chuyến đi tiêu hao điện."
        ),
        "exception_flow": (
            "Tại bước 4, nếu chưa có giao dịch nào: Hiển thị bảng trống kèm thông báo 'Chưa có biến động kho năng lượng'."
        ),
        "business_rules": "BR-CHG-03",
        "related_fr": "FR-CHG-04",
        "related_tc": "TC-CHG-06"
    },

    # =========================================================================
    # 8. FINANCIAL RECONCILIATION & EXPENSE SHARING (7 UCs)
    # =========================================================================
    {
        "id": "UC-FIN-01",
        "name": "Tạo và phân bổ khoản chi phí phương tiện",
        "primary_actor": "Đồng sở hữu hoặc Nhân viên trạm",
        "secondary_actor": "Hệ thống kế toán tự động và CSDL",
        "description": "Người dùng nhập hóa đơn chi phí chung phát sinh cho xe (Bảo dưỡng định kỳ, Sửa chữa, Đăng kiểm, Mua bảo hiểm, Phí đỗ xe) kèm ảnh chụp hóa đơn GTGT. Hệ thống tự động phân bổ nghĩa vụ nợ theo tỷ lệ sở hữu bằng thuật toán Hare-Niemeyer.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Ghi nhận hóa đơn chi phí' tại màn hình tài chính nhóm.",
        "preconditions": "Chi phí > 200.000 đ bắt buộc đính kèm ảnh chứng từ hợp lệ (BR-EXP-03); người tạo thuộc nhóm xe hoặc có quyền STAFF.",
        "postconditions": "Tạo bản ghi `expenses`, sinh danh sách `expense_shares` cho từng thành viên, bảo toàn tổng tiền chính xác 100%.",
        "main_flow": (
            "1. Người dùng mở hộp thoại `CreateExpenseModal.tsx` tại `/finances/expenses/new`.\n"
            "2. Chọn loại chi phí (BẢO DƯỠNG / SỬA CHỮA / BẢO HIỂM / ĐĂNG KIỂM / KHÁC), nhập số tiền (ví dụ 4.500.000 đ), ngày phát sinh và nội dung chi tiết.\n"
            "3. Tải lên tệp ảnh chứng từ hóa đơn đỏ qua dịch vụ lưu trữ media.\n"
            "4. Người dùng nhấn nút 'Tạo và phân bổ chi phí'. Frontend gửi HTTP POST tới `/api/expenses` kèm payload `CreateExpenseRequest`.\n"
            "5. Controller `ExpenseController:recordExpense()` tiếp nhận.\n"
            "6. `ExpenseService` tạo bản ghi mới trong bảng `expenses` ở trạng thái `PENDING_APPROVAL`.\n"
            "7. Kích hoạt `ExpenseShareService:reconcileExpenseShares()`:\n"
            "   - Truy vấn danh sách tỷ lệ sở hữu của từng thành viên trong bảng `ownership_shares`.\n"
            "   - Áp dụng thuật toán Hare-Niemeyer (Largest Remainder Method) để làm tròn số tiền chính xác tới từng đồng VND (BR-EXP-01).\n"
            "   - Tổng các phần phân bổ: `SUM(share_amount) == expense.total_amount` bảo đảm không thất thoát dù chỉ 1 đồng.\n"
            "8. Tạo các bản ghi `expense_shares` tương ứng cho từng thành viên với trạng thái `UNPAID`.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm thông tin chi phí và bảng phân bổ nợ.\n"
            "10. Hệ thống phát thông báo công nợ mới tới hòm thư của toàn bộ các đồng sở hữu trong nhóm."
        ),
        "alt_flow": (
            "Tại bước 3, nếu khoản chi phí <= 200.000 đ (chi phí nhỏ như tiền rửa xe, bơm lốp): Cho phép người dùng không bắt buộc đính kèm ảnh hóa đơn."
        ),
        "exception_flow": (
            "Tại bước 3, nếu chi phí > 200.000 đ mà không đính kèm ảnh chứng từ: Hệ thống chặn lại và ném `MissingReceiptException` kèm cảnh báo 'Mọi chi phí trên 200.000 đ bắt buộc phải có ảnh chứng từ hóa đơn theo quy chế nhóm'."
        ),
        "business_rules": "BR-EXP-01, BR-EXP-03",
        "related_fr": "FR-EXP-01, FR-EXP-02",
        "related_tc": "TC-EXP-01"
    },
    {
        "id": "UC-FIN-02",
        "name": "Xem tổng hợp nghĩa vụ tài chính cá nhân",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu bảng tổng hợp sao kê tài chính cá nhân: tổng số tiền nợ cần thanh toán, các khoản chi phí năng lượng chuyến đi, các khoản phân bổ bảo dưỡng và hạn thanh toán còn lại.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng mở tab 'Nghĩa vụ tài chính' tại `/finances/my-balance`.",
        "preconditions": "Người dùng đang đăng nhập hệ thống.",
        "postconditions": "Hiển thị tổng số dư nợ và danh sách các khoản phải trả.",
        "main_flow": (
            "1. Người dùng mở trang `/finances/my-balance`.\n"
            "2. Frontend gửi HTTP GET tới `/api/expenses/my-shares`.\n"
            "3. Controller `ExpenseController:getMyExpenseShares()` tiếp nhận.\n"
            "4. Service truy vấn bảng `expense_shares` lọc theo `user_id` và trạng thái `UNPAID`.\n"
            "5. Tính tổng số dư nợ hiện tại: `totalUnpaid = SUM(amount)`.\n"
            "6. Máy chủ trả về danh sách các khoản nợ kèm thời hạn thanh toán (hạn 7 ngày kể từ ngày chốt sao kê theo BR-EXP-04).\n"
            "7. Giao diện hiển thị thẻ tổng nợ màu đỏ nổi bật kèm nút bấm 'Thanh toán ngay'."
        ),
        "alt_flow": (
            "Tại bước 5, nếu tổng nợ = 0 đ: Giao diện hiển thị huy hiệu xanh lá 'Bạn đã hoàn thành 100% nghĩa vụ tài chính. Không có nợ tồn đọng'."
        ),
        "exception_flow": (
            "Tại bước 6, nếu người dùng có khoản nợ quá hạn > 7 ngày: Giao diện hiển thị cảnh báo vi phạm quy chế kèm thông báo khóa quyền đặt xe tạm thời."
        ),
        "business_rules": "BR-EXP-04",
        "related_fr": "FR-EXP-02",
        "related_tc": "TC-EXP-02"
    },
    {
        "id": "UC-FIN-03",
        "name": "Xem chi tiết phân bổ chi phí theo tỷ lệ sở hữu",
        "primary_actor": "Đồng sở hữu trong nhóm, Nhân viên kế toán",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng nhấp vào một hóa đơn chi phí chung bất kỳ để xem bảng tính chi tiết số tiền từng thành viên phải đóng, tỷ lệ % cổ phần áp dụng và phần dư làm tròn theo thuật toán Hare-Niemeyer.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng nhấp vào một dòng hóa đơn trong bảng danh sách chi phí.",
        "preconditions": "Khoản chi phí đã được phân bổ.",
        "postconditions": "Mở bảng chi tiết phân bổ `ExpenseShareBreakdownModal.tsx` minh bạch.",
        "main_flow": (
            "1. Người dùng mở danh sách chi phí xe tại `/finances/expenses`.\n"
            "2. Nhấp chọn một khoản chi phí (ví dụ: Bảo dưỡng 40.000 km - 5.200.000 đ).\n"
            "3. Frontend gửi HTTP GET tới `/api/expenses/{expenseId}/shares`.\n"
            "4. Controller `ExpenseController:getExpenseShares()` tiếp nhận.\n"
            "5. Service truy vấn các bản ghi trong `expense_shares` liên kết với `expenseId`.\n"
            "6. Trả về danh sách từng thành viên: Tên thành viên, Tỷ lệ sở hữu (%), Số tiền lý thuyết, Số tiền sau làm tròn Hare-Niemeyer (VND), Trạng thái thanh toán (PAID / UNPAID).\n"
            "7. Máy chủ trả về HTTP 200 OK.\n"
            "8. Giao diện hiển thị bảng phân bổ rõ ràng, chứng minh tổng cột 'Số tiền sau làm tròn' khớp chính xác 5.200.000 đ."
        ),
        "alt_flow": (
            "Tại bước 8, người dùng có thể nhấp 'Xem ảnh chứng từ' để phóng to xem hóa đơn thanh toán của gara sửa xe."
        ),
        "exception_flow": (
            "Tại bước 3, nếu expenseId không tồn tại: Trả về HTTP 404 Not Found."
        ),
        "business_rules": "BR-EXP-01",
        "related_fr": "FR-EXP-02",
        "related_tc": "TC-EXP-03"
    },
    {
        "id": "UC-FIN-04",
        "name": "Nộp và xác minh thanh toán nghĩa vụ tài chính DEMO",
        "primary_actor": "Đồng sở hữu có nghĩa vụ nợ",
        "secondary_actor": "Cổng thanh toán giả lập / Hệ thống CSDL",
        "description": "Đồng sở hữu thực hiện chuyển khoản thanh toán nghĩa vụ nợ (tiền sạc điện, tiền phân bổ bảo dưỡng, tiền bồi thường trầy xước) qua mã VietQR hoặc chuyển khoản ngân hàng, tải lên biên lai ủy nhiệm chi để chờ đối soát.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Thanh toán nợ' tại bảng nghĩa vụ cá nhân.",
        "preconditions": "Người dùng có ít nhất một khoản nợ ở trạng thái UNPAID.",
        "postconditions": "Tạo bản ghi `personal_expense_payments` ở trạng thái PENDING_VERIFICATION.",
        "main_flow": (
            "1. Người dùng chọn các khoản nợ cần thanh toán (ví dụ: Hóa đơn tiền điện 78.925 đ + Bảo dưỡng 1.300.000 đ = Tổng 1.378.925 đ).\n"
            "2. Nhấn nút 'Tiến hành thanh toán', hệ thống mở màn hình `PaymentSubmissionModal.tsx`.\n"
            "3. Giao diện hiển thị mã VietQR động chứa số tài khoản ngân hàng thụ hưởng của nhóm, số tiền chính xác và cú pháp chuyển khoản `EVSHARE [USER_ID] [EXPENSE_ID]`.\n"
            "4. Người dùng thực hiện chuyển khoản qua ứng dụng ngân hàng di động trên điện thoại.\n"
            "5. Người dùng chụp ảnh màn hình biên lai giao dịch thành công và tải lên hệ thống.\n"
            "6. Người dùng nhấn nút 'Tôi đã chuyển tiền'. Frontend gửi HTTP POST tới `/api/personal-payments` kèm payload `CreatePersonalPaymentRequest` (expenseShareIds, amount, proofImageUrl).\n"
            "7. Controller `PersonalPaymentController:submitPayment()` tiếp nhận.\n"
            "8. Service tạo bản ghi mới trong bảng `personal_expense_payments`: `user_id`, `amount`, `proof_image_url`, `status = PENDING_VERIFICATION`, `created_at = NOW()`.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm mã thanh toán `paymentId`.\n"
            "10. Giao diện cập nhật trạng thái khoản nợ sang 'Đang chờ nhân viên đối soát'."
        ),
        "alt_flow": (
            "Tại bước 3, người dùng có thể chọn phương thức 'Thanh toán bằng số dư Quỹ chung cá nhân' nếu có khoản dư nộp trước đó."
        ),
        "exception_flow": (
            "Tại bước 6, nếu số tiền người dùng khai báo không khớp với tổng các khoản nợ chọn thanh toán: Hệ thống cảnh báo sai lệch số tiền và yêu cầu kiểm tra lại."
        ),
        "business_rules": "BR-EXP-02, BR-EXP-04",
        "related_fr": "FR-EXP-05",
        "related_tc": "TC-EXP-04"
    },
    {
        "id": "UC-FIN-05",
        "name": "Nhân viên xác minh phê duyệt thanh toán",
        "primary_actor": "Nhân viên tài chính / Trực ban trạm (ROLE_STAFF)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kế toán",
        "description": "Nhân viên mở danh sách các khoản thanh toán chờ duyệt, đối chiếu sao kê tài khoản ngân hàng với ảnh chụp biên lai của thành viên và nhấn duyệt gạch nợ. Áp dụng quy tắc nghiêm cấm tự phê duyệt nợ của chính mình (No Self-Approval).",
        "priority": "Bắt buộc (High)",
        "trigger": "Nhân viên mở tab 'Duyệt thanh toán' tại `/staff/payments/pending`.",
        "preconditions": "Nhân viên đăng nhập với quyền STAFF hoặc ADMIN; người duyệt không được là người nợ (payment.userId != staffId theo BR-EXP-02).",
        "postconditions": "Cập nhật `personal_expense_payments.status = VERIFIED`, gạch nợ `expense_shares.status = PAID`.",
        "main_flow": (
            "1. Nhân viên truy cập trang `/staff/payments/pending`.\n"
            "2. Hệ thống hiển thị danh sách các khoản nộp tiền đang chờ duyệt kèm ảnh biên lai thu nhỏ.\n"
            "3. Nhân viên chọn một yêu cầu thanh toán để xem chi tiết đối soát.\n"
            "4. Nhân viên kiểm tra mã giao dịch ngân hàng, số tiền và tên người chuyển trên sao kê thực tế.\n"
            "5. Nhân viên nhấn nút 'Phê duyệt thanh toán'.\n"
            "6. Frontend gửi HTTP POST tới `/api/personal-payments/{paymentId}/verify` kèm Bearer Token của nhân viên.\n"
            "7. Controller `PersonalPaymentController:verifyPayment()` tiếp nhận.\n"
            "8. `PersonalPaymentService` kiểm tra quy tắc No Self-Approval `BR-EXP-02`: nếu `payment.userId == currentPrincipal.id` lập tức ném `SelfApprovalException`.\n"
            "9. Trong giao dịch `@Transactional`, hệ thống thực hiện:\n"
            "   - Cập nhật `personal_expense_payments.status = VERIFIED`, `verified_by = staffId`, `verified_at = NOW()`.\n"
            "   - Cập nhật toàn bộ các bản ghi `expense_shares` liên kết thành `status = PAID`.\n"
            "   - Ghi bản ghi kiểm toán tài chính vào bảng `audit_logs`.\n"
            "10. Máy chủ trả về HTTP 200 OK kèm thông điệp 'Đã duyệt thanh toán thành công'.\n"
            "11. Gửi thông báo xác nhận thanh toán thành công tới ứng dụng của thành viên."
        ),
        "alt_flow": (
            "Tại bước 5, nếu phát hiện biên lai giả mạo hoặc số tiền không vào tài khoản: Nhân viên chuyển sang luồng từ chối thanh toán (UC-FIN-06)."
        ),
        "exception_flow": (
            "Tại bước 8, nếu một nhân viên kiêm đồng sở hữu cố tình tự bấm duyệt thanh toán nợ của chính mình: Hệ thống chặn đứng giao dịch, trả về HTTP 403 Forbidden kèm thông báo 'Vi phạm quy tắc bảo mật: Bạn không được phép tự phê duyệt khoản thanh toán của chính mình'."
        ),
        "business_rules": "BR-EXP-02, BR-SEC-02",
        "related_fr": "FR-EXP-06",
        "related_tc": "TC-EXP-05"
    },
    {
        "id": "UC-FIN-06",
        "name": "Từ chối chứng từ thanh toán không hợp lệ",
        "primary_actor": "Nhân viên tài chính / Quản trị viên",
        "secondary_actor": "Đồng sở hữu nộp tiền, Hệ thống CSDL",
        "description": "Nhân viên từ chối phê duyệt chứng từ thanh toán khi số tiền không khớp, ảnh biên lai mờ/giả mạo hoặc tài khoản nhóm chưa nhận được tiền thực tế.",
        "priority": "Cao (High)",
        "trigger": "Nhân viên nhấn nút 'Từ chối chứng từ' tại màn hình đối soát.",
        "preconditions": "Khoản thanh toán ở trạng thái PENDING_VERIFICATION; nhân viên cung cấp lý do từ chối cụ thể.",
        "postconditions": "Cập nhật `personal_expense_payments.status = REJECTED`, giữ nguyên trạng thái nợ UNPAID của thành viên.",
        "main_flow": (
            "1. Nhân viên xem xét biên lai chuyển khoản và phát hiện số tiền trên biên lai (1.000.000 đ) không khớp với số tiền nợ cần thanh toán (1.378.925 đ).\n"
            "2. Nhân viên nhấn nút 'Từ chối thanh toán'.\n"
            "3. Hệ thống hiển thị hộp thoại `RejectPaymentModal.tsx` yêu cầu nhập lý do từ chối.\n"
            "4. Nhân viên nhập lý do: 'Số tiền chuyển khoản thiếu 378.925 đ so với nghĩa vụ nợ thực tế. Vui lòng chuyển bổ sung hoặc gửi lại biên lai đúng'.\n"
            "5. Frontend gửi HTTP POST tới `/api/personal-payments/{paymentId}/reject` kèm payload lý do.\n"
            "6. Controller `PersonalPaymentController:rejectPayment()` tiếp nhận.\n"
            "7. Service cập nhật `personal_expense_payments.status = REJECTED`, `rejection_reason = reason`, `verified_by = staffId`, `verified_at = NOW()`.\n"
            "8. Các bản ghi nợ trong `expense_shares` vẫn giữ nguyên trạng thái `UNPAID`.\n"
            "9. Máy chủ trả về HTTP 200 OK.\n"
            "10. Hệ thống gửi thông báo cảnh báo màu đỏ tới thành viên yêu cầu thực hiện lại nghĩa vụ thanh toán."
        ),
        "alt_flow": (
            "Tại bước 10, người dùng nhận được thông báo có thể mở lại ứng dụng và nộp lại biên lai thanh toán mới."
        ),
        "exception_flow": (
            "Tại bước 4, nếu nhân viên không nhập lý do từ chối: Hệ thống yêu cầu bắt buộc phải có nội dung giải trình lý do trước khi gửi."
        ),
        "business_rules": "BR-EXP-02",
        "related_fr": "FR-EXP-06",
        "related_tc": "TC-EXP-06"
    },
    {
        "id": "UC-FIN-07",
        "name": "Xem lịch sử thanh toán cá nhân",
        "primary_actor": "Đồng sở hữu trong nhóm",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu toàn bộ các giao dịch thanh toán mình đã thực hiện thành công trong quá khứ kèm mã giao dịch, số tiền và biên lai đã được duyệt.",
        "priority": "Trung bình (Medium)",
        "trigger": "Người dùng chọn tab 'Lịch sử thanh toán' tại `/finances/payment-history`.",
        "preconditions": "Người dùng đang đăng nhập hệ thống.",
        "postconditions": "Hiển thị danh sách các khoản thanh toán lịch sử.",
        "main_flow": (
            "1. Người dùng mở trang `/finances/payment-history`.\n"
            "2. Frontend gửi HTTP GET tới `/api/personal-payments/my-payments`.\n"
            "3. Controller `PersonalPaymentController:getMyPersonalPayments()` tiếp nhận.\n"
            "4. Service truy vấn bảng `personal_expense_payments` lọc theo `user_id` sắp xếp giảm dần theo ngày nộp.\n"
            "5. Dữ liệu trả về: Mã thanh toán, Ngày nộp, Số tiền đã trả (VND), Người duyệt, Ngày duyệt, Trạng thái (VERIFIED / REJECTED).\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị bảng lịch sử thanh toán minh bạch, cho phép tải lại tệp biên lai."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp vào một giao dịch để xem lại danh sách các hóa đơn đã được gạch nợ bởi giao dịch đó."
        ),
        "exception_flow": (
            "Tại bước 4, nếu người dùng chưa từng thanh toán giao dịch nào: Hiển thị bảng trống kèm thông báo 'Chưa có lịch sử thanh toán'."
        ),
        "business_rules": "BR-EXP-04",
        "related_fr": "FR-EXP-05",
        "related_tc": "TC-EXP-07"
    },

    # =========================================================================
    # 9. VEHICLE MAINTENANCE & INSPECTION (7 UCs)
    # =========================================================================
    {
        "id": "UC-MAINT-01",
        "name": "Ghi nhận vết hư hại thân vỏ gắn tọa độ 3D Hotspot",
        "primary_actor": "Nhân viên kiểm định, Đồng sở hữu",
        "secondary_actor": "Three.js Raycaster & CSDL",
        "description": "Người dùng nhấp trực tiếp lên bề mặt thân vỏ xe 3D để định vị tọa độ (x, y, z) của vết trầy xước/móp méo mới phát hiện, chụp ảnh thực tế và lưu vào biên bản kiểm định.",
        "priority": "Bắt buộc (High)",
        "trigger": "Người dùng nhấn nút 'Báo cáo hư hại mới' trên màn hình kiểm định 3D.",
        "preconditions": "Mô hình xe 3D đang hiển thị; người dùng có quyền ghi nhận tổn hại.",
        "postconditions": "Tạo bản ghi `damage_records` lưu tọa độ 3D và ảnh chụp; hiển thị Hotspot mới trên vỏ xe.",
        "main_flow": (
            "1. Người dùng mở màn hình kiểm định xe 3D tại `/inspections/{vehicleId}/record-damage`.\n"
            "2. Hệ thống kích hoạt chế độ bắt điểm va chạm (Damage Pinpoint Mode).\n"
            "3. Người dùng xoay xe 3D và nhấp chuột trái chính xác vào vị trí vết trầy xước trên thân xe (ví dụ: góc cản trước bên phụ).\n"
            "4. Three.js `Raycaster` bắt trúng Mesh thân xe và trích xuất tọa độ không gian chính xác: `point = {x: 1.25, y: 0.62, z: 2.10}`.\n"
            "5. Hệ thống hiển thị điểm đánh dấu tạm thời và mở modal nhập thông tin `DamageReportModal.tsx`.\n"
            "6. Người dùng chọn mức độ nghiêm trọng (TRẦY XƯỚC NHẸ / MÓP MÉO / NỨT VỠ), nhập mô tả chiều dài vết xước (10 cm) và tải lên ảnh chụp thực tế.\n"
            "7. Nhấn 'Lưu vết tổn hại'. Frontend gửi HTTP POST tới `/api/damages` kèm payload `CreateDamageRecordRequest` chứa tọa độ 3D và ảnh.\n"
            "8. Controller `DamageController:recordTripDamage()` tiếp nhận và lưu vào bảng `damage_records`.\n"
            "9. Máy chủ trả về HTTP 201 Created kèm `DamageRecordResponse`.\n"
            "10. Giao diện 3D lập tức kết xuất điểm nóng Hotspot hình cầu màu vàng nhấp nháy tại đúng tọa độ vừa gắn."
        ),
        "alt_flow": (
            "Tại bước 3, nếu người dùng nhấp lệch ra ngoài không gian Garage: Raycaster không bắt được Mesh, hệ thống nhắc nhở 'Vui lòng nhấp trực tiếp lên bề mặt xe'."
        ),
        "exception_flow": (
            "Tại bước 6, nếu người dùng chưa tải lên ảnh chụp bằng chứng: Hệ thống bắt buộc phải có ít nhất 1 ảnh chụp cận cảnh trước khi gửi."
        ),
        "business_rules": "BR-TRIP-04, BR-3D-01",
        "related_fr": "FR-3D-03, FR-TRIP-06",
        "related_tc": "TC-MAINT-01"
    },
    {
        "id": "UC-MAINT-02",
        "name": "Xem danh sách hư hại chưa khắc phục",
        "primary_actor": "Đồng sở hữu, Kỹ thuật viên bảo dưỡng",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Người dùng tra cứu toàn bộ danh sách các điểm trầy xước, móp méo đang tồn tại trên xe chưa được đưa vào xưởng sơn sửa, phục vụ việc theo dõi và lên kế hoạch bảo dưỡng.",
        "priority": "Cao (Medium)",
        "trigger": "Người dùng mở tab 'Tổn hại thân vỏ' tại `/vehicles/{vehicleId}/damages`.",
        "preconditions": "Người dùng thuộc nhóm đồng sở hữu hoặc có quyền STAFF/ADMIN.",
        "postconditions": "Hiển thị danh sách các vết hư hại kèm trạng thái và chi phí dự toán.",
        "main_flow": (
            "1. Người dùng mở trang `/vehicles/{vehicleId}/damages`.\n"
            "2. Frontend gửi HTTP GET tới `/api/damages/vehicle/{vehicleId}?status=UNREPAIRED`.\n"
            "3. Controller `DamageController:getDamagesByVehicle()` tiếp nhận.\n"
            "4. Service truy vấn bảng `damage_records` lọc theo `vehicle_id` và `is_repaired = false`.\n"
            "5. Dữ liệu trả về danh sách: Vị trí bộ phận, Mức độ nghiêm trọng, Ngày phát hiện, Ảnh chụp bằng chứng, Người chịu trách nhiệm, Dự toán chi phí sơn sửa.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị danh sách thẻ card trực quan, khi nhấp vào một thẻ thì mô hình xe 3D bên cạnh tự động xoay camera ngắm thẳng vào vị trí vết tổn hại đó."
        ),
        "alt_flow": (
            "Tại bước 5, nếu xe không có bất kỳ tổn hại nào: Giao diện hiển thị trạng thái hoàn hảo 'Phương tiện ở trạng thái thân vỏ hoàn hảo, không có vết tổn hại'."
        ),
        "exception_flow": (
            "Tại bước 2, nếu vehicleId không tồn tại: Trả về HTTP 404 Not Found."
        ),
        "business_rules": "BR-TRIP-04",
        "related_fr": "FR-3D-03",
        "related_tc": "TC-MAINT-02"
    },
    {
        "id": "UC-MAINT-03",
        "name": "So sánh đối chiếu biên bản kiểm định trước và sau",
        "primary_actor": "Nhân viên kiểm định, Hòa giải viên tranh chấp",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Hiển thị công cụ so sánh trực quan song song (Side-by-Side Comparison) giữa biên bản kiểm định lúc bàn giao xe và biên bản lúc nhận lại xe để xác định chính xác tổn hại phát sinh trong chuyến đi.",
        "priority": "Cao (High)",
        "trigger": "Nhân viên hoặc hòa giải viên nhấp vào nút 'Đối chiếu biên bản chuyến đi'.",
        "preconditions": "Chuyến đi đã hoàn thành và có đủ 2 biên bản kiểm định (bàn giao và hoàn trả).",
        "postconditions": "Hiển thị giao diện so sánh đối chiếu ảnh chụp và thông số kỹ thuật.",
        "main_flow": (
            "1. Người dùng mở màn hình đối chiếu tại `/disputes/compare/{tripId}`.\n"
            "2. Frontend gửi HTTP GET tới `/api/disputes/{id}/investigation-comparison`.\n"
            "3. Controller `DisputeController` tiếp nhận request.\n"
            "4. Service truy vấn biên bản bàn giao ban đầu `handoverInspection` và biên bản trả xe `returnInspection`.\n"
            "5. Dữ liệu trả về cấu trúc so sánh: Số km (Trước vs Sau), Mức pin (Trước vs Sau), Ảnh 4 góc xe (Trước vs Sau), Danh sách các vết tổn hại mới phát hiện.\n"
            "6. Máy chủ trả về HTTP 200 OK.\n"
            "7. Giao diện hiển thị hai cột song song: Cột trái (Tình trạng lúc giao), Cột phải (Tình trạng lúc trả) với các điểm tổn hại mới được highlight màu đỏ nhấp nháy."
        ),
        "alt_flow": (
            "Tại bước 7, người dùng có thể nhấp nút 'Trượt so sánh ảnh' (Image Slider) để kéo thanh trượt so sánh ảnh chụp trước và sau tại cùng một góc chụp."
        ),
        "exception_flow": (
            "Tại bước 4, nếu chuyến đi bị thiếu một trong hai biên bản kiểm định: Hệ thống thông báo 'Không thể đối chiếu do thiếu dữ liệu kiểm định ban đầu'."
        ),
        "business_rules": "BR-TRIP-04, BR-DISP-01",
        "related_fr": "FR-DISP-02",
        "related_tc": "TC-MAINT-03"
    },
    {
        "id": "UC-MAINT-04",
        "name": "Tạo đề xuất bảo dưỡng kỹ thuật định kỳ",
        "primary_actor": "Nhân viên kỹ thuật (ROLE_STAFF)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ biểu quyết",
        "description": "Nhân viên kỹ thuật tạo phiếu đề xuất bảo dưỡng định kỳ (ví dụ mốc 40.000 km) hoặc khắc phục tập hợp các vết trầy xước, ước tính chi phí và thời gian vào xưởng. Nếu chi phí vượt 5.000.000 đ thì tự động kích hoạt quy trình biểu quyết nhóm.",
        "priority": "Bắt buộc (High)",
        "trigger": "Xe đạt mốc km bảo dưỡng định kỳ hoặc nhân viên gom các vết trầy xước cần sửa.",
        "preconditions": "Nhân viên có quyền STAFF; xe thuộc danh mục phụ trách.",
        "postconditions": "Tạo bản ghi `maintenances` ở trạng thái `SCHEDULED` hoặc `AWAITING_APPROVAL`.",
        "main_flow": (
            "1. Nhân viên mở giao diện lập lịch bảo dưỡng `/staff/maintenance/create`.\n"
            "2. Chọn xe điện, loại bảo dưỡng (Định kỳ / Đột xuất / Sơn sửa thân vỏ), ngày dự kiến vào xưởng và xưởng dịch vụ ủy quyền (VinFast Service Center).\n"
            "3. Tích chọn các vết tổn hại trong bảng `damage_records` cần khắc phục trong đợt này.\n"
            "4. Nhập bảng dự toán chi phí chi tiết: Tiền công 800.000 đ, Dầu phanh & lọc gió 1.200.000 đ, Sơn gò thân vỏ 4.500.000 đ -> Tổng chi phí dự kiến = 6.500.000 đ.\n"
            "5. Nhân viên nhấn 'Tạo phiếu bảo dưỡng'. Frontend gửi HTTP POST tới `/api/vehicles/{vehicleId}/maintenance`.\n"
            "6. Controller `MaintenanceController:createMaintenance()` tiếp nhận.\n"
            "7. `MaintenanceService` kiểm tra quy tắc biểu quyết `BR-VOTE-03`: Tổng chi phí dự kiến 6.500.000 đ > 5.000.000 đ.\n"
            "8. Hệ thống tự động khởi tạo một đề xuất biểu quyết trong bảng `vote_proposals` liên kết với đợt bảo dưỡng này.\n"
            "9. Bản ghi `maintenances` được lưu với trạng thái `AWAITING_APPROVAL` (Chờ nhóm đồng sở hữu biểu quyết thông qua).\n"
            "10. Máy chủ trả về HTTP 201 Created. Phát thông báo khẩn tới toàn bộ các đồng sở hữu xe để bỏ phiếu."
        ),
        "alt_flow": (
            "Tại bước 7, nếu tổng chi phí dự kiến <= 5.000.000 đ (ví dụ 2.500.000 đ): Không cần biểu quyết nhóm, phiếu bảo dưỡng chuyển thẳng sang trạng thái `SCHEDULED` và khóa lịch xe."
        ),
        "exception_flow": (
            "Tại bước 2, nếu ngày vào xưởng bảo dưỡng bị trùng với lịch đặt xe đã được xác nhận trước đó: Hệ thống cảnh báo xung đột lịch và yêu cầu nhân viên chọn thời điểm khác hoặc thỏa thuận với người đặt xe."
        ),
        "business_rules": "BR-VOTE-03, BR-BOOK-03",
        "related_fr": "FR-STF-02, FR-VOTE-03",
        "related_tc": "TC-MAINT-04"
    },
    {
        "id": "UC-MAINT-05",
        "name": "Lập lịch và phê duyệt lệnh bảo dưỡng xe",
        "primary_actor": "Trưởng nhóm đồng sở hữu / Quản trị viên",
        "secondary_actor": "Hệ thống CSDL và Lịch biểu",
        "description": "Sau khi đề xuất bảo dưỡng được biểu quyết thông qua hoặc được trưởng nhóm phê duyệt, hệ thống chính thức khóa khung giờ bảo dưỡng trên lịch biểu và chuyển trạng thái lệnh sang sẵn sàng thi công.",
        "priority": "Bắt buộc (High)",
        "trigger": "Đề xuất biểu quyết bảo dưỡng đạt tỷ lệ quá bán (> 50% cổ phần).",
        "preconditions": "Phiếu bảo dưỡng có kết quả biểu quyết PASSED hoặc chi phí dưới ngưỡng.",
        "postconditions": "Khóa lịch đặt xe trên `BookingCalendar` (Maintenance Lock theo BR-BOOK-03).",
        "main_flow": (
            "1. Hệ thống tự động nhận sự kiện `ProposalFinalizedEvent` với kết quả PASSED.\n"
            "2. `MaintenanceService` cập nhật trạng thái phiếu bảo dưỡng từ `AWAITING_APPROVAL` sang `APPROVED`.\n"
            "3. Hệ thống tạo khối thời gian khóa bảo dưỡng (Maintenance Block) trên lịch biểu nhóm từ ngày bắt đầu đến ngày dự kiến hoàn thành.\n"
            "4. Nếu trong khoảng thời gian này có lịch đặt xe nào chưa xác nhận: hệ thống tự động từ chối và thông báo cho người đặt.\n"
            "5. Gửi thông báo tới nhân viên kỹ thuật phụ trách: 'Lệnh bảo dưỡng đã được các đồng sở hữu phê duyệt. Sẵn sàng đưa xe vào xưởng'."
        ),
        "alt_flow": (
            "Tại bước 1, nếu biểu quyết bị REJECTED (các đồng sở hữu không đồng ý với báo giá): Lệnh bảo dưỡng bị hủy bỏ, xe trở về trạng thái bình thường."
        ),
        "exception_flow": (
            "Tại bước 3, nếu lịch biểu bị lỗi ghi CSDL: Giao dịch được rollback và ghi log an toàn."
        ),
        "business_rules": "BR-BOOK-03, BR-VOTE-02",
        "related_fr": "FR-BOOK-03, FR-STF-02",
        "related_tc": "TC-MAINT-05"
    },
    {
        "id": "UC-MAINT-06",
        "name": "Cập nhật tiến độ bảo dưỡng xe tại xưởng",
        "primary_actor": "Nhân viên kỹ thuật (ROLE_STAFF)",
        "secondary_actor": "Hệ thống CSDL",
        "description": "Nhân viên cập nhật trạng thái khi xe chính thức vào xưởng thi công, chụp ảnh quá trình thay thế phụ tùng, cập nhật số tiền hóa đơn phát sinh thực tế so với dự toán.",
        "priority": "Cao (Medium)",
        "trigger": "Xe được đưa vào xưởng dịch vụ và bắt đầu tháo lắp sửa chữa.",
        "preconditions": "Lệnh bảo dưỡng đã được duyệt; xe chuyển giao cho xưởng dịch vụ.",
        "postconditions": "Cập nhật `maintenances.status = IN_PROGRESS`, xe chuyển trạng thái `MAINTENANCE`.",
        "main_flow": (
            "1. Nhân viên đưa xe vào xưởng và mở ứng dụng tại `/staff/maintenance/{id}`.\n"
            "2. Nhấn nút 'Bắt đầu bảo dưỡng'. Frontend gửi HTTP POST tới `/api/maintenance/{id}/start`.\n"
            "3. Controller `MaintenanceController:startMaintenance()` cập nhật trạng thái xe thành `MAINTENANCE` và lệnh thành `IN_PROGRESS`.\n"
            "4. Trong quá trình làm việc, nhân viên cập nhật nhật ký công việc (Work Log): Đã thay dầu phanh, đang sơn sấy cản trước.\n"
            "5. Nhân viên tải lên ảnh chụp phụ tùng mới thay thế.\n"
            "6. Nhập số tiền phát sinh thực tế theo hóa đơn tạm tính của gara: `actualCost = 6.200.000 đ`.\n"
            "7. Hệ thống lưu trữ thông tin cập nhật và gửi thông báo tiến độ tới nhóm đồng sở hữu."
        ),
        "alt_flow": (
            "Tại bước 6, nếu chi phí thực tế phát sinh vượt quá 20% so với dự toán ban đầu: Hệ thống yêu cầu nhân viên nhập văn bản giải trình lý do phát sinh."
        ),
        "exception_flow": (
            "Tại bước 2, nếu xe đang trong chuyến đi chưa trả: Hệ thống không cho phép bắt đầu bảo dưỡng."
        ),
        "business_rules": "BR-BOOK-03",
        "related_fr": "FR-STF-02",
        "related_tc": "TC-MAINT-06"
    },
    {
        "id": "UC-MAINT-07",
        "name": "Nghiệm thu hoàn tất bảo dưỡng và đưa xe về AVAILABLE",
        "primary_actor": "Nhân viên kỹ thuật (ROLE_STAFF)",
        "secondary_actor": "Hệ thống CSDL và Dịch vụ kế toán tự động",
        "description": "Nhân viên kiểm tra chất lượng sửa chữa thực tế, nhập hóa đơn tài chính chính thức, đánh dấu các vết tổn hại 3D đã được khắc phục xong và giải phóng xe trở lại trạng thái AVAILABLE sẵn sàng phục vụ.",
        "priority": "Bắt buộc (High)",
        "trigger": "Xưởng dịch vụ hoàn thành toàn bộ công việc và bàn giao xe cho nhân viên.",
        "preconditions": "Xe đã sửa chữa xong, chạy thử nghiệm an toàn đạt tiêu chuẩn; có hóa đơn thanh toán thực tế.",
        "postconditions": "Cập nhật `maintenances.status = COMPLETED`, `vehicles.status = AVAILABLE`, chuyển vết tổn hại sang `is_repaired = true`, kích hoạt phân bổ chi phí.",
        "main_flow": (
            "1. Nhân viên kiểm tra xe sau sửa chữa, chụp ảnh xe hoàn thiện sạch sẽ.\n"
            "2. Mở ứng dụng tại `/staff/maintenance/{id}/complete`.\n"
            "3. Nhập số tiền hóa đơn quyết toán cuối cùng (ví dụ 6.200.000 đ), số hóa đơn GTGT và tải lên ảnh chụp hóa đơn đỏ.\n"
            "4. Đánh dấu tích hoàn thành cho các vết trầy xước đã sơn sửa trong bảng `damage_records`.\n"
            "5. Nhân viên nhấn 'Nghiệm thu hoàn tất bảo dưỡng'.\n"
            "6. Frontend gửi HTTP POST tới `/api/maintenance/{id}/complete`.\n"
            "7. Controller `MaintenanceController:completeMaintenance()` tiếp nhận.\n"
            "8. Service thực hiện trong `@Transactional`:\n"
            "   - Cập nhật `maintenances.status = COMPLETED`, `completed_at = NOW()`, `actual_cost = 6200000`.\n"
            "   - Cập nhật các bản ghi tổn hại liên quan thành `is_repaired = true` (Hotspot 3D đổi màu xanh lá hoặc ẩn đi).\n"
            "   - Cập nhật trạng thái xe trong bảng `vehicles` trở về `AVAILABLE`.\n"
            "   - Giải phóng khối khóa bảo dưỡng trên lịch biểu nhóm.\n"
            "   - Tự động tạo bản ghi chi phí chung trong bảng `expenses` và kích hoạt thuật toán Hare-Niemeyer phân bổ nghĩa vụ nợ cho các đồng sở hữu (UC-FIN-01).\n"
            "9. Máy chủ trả về HTTP 200 OK.\n"
            "10. Giao diện thông báo 'Bảo dưỡng hoàn tất thành công. Xe đã sẵn sàng cho các chuyến đi tiếp theo'."
        ),
        "alt_flow": (
            "Tại bước 8, nếu đợt bảo dưỡng được thanh toán trực tiếp từ Quỹ bảo trì chung của xe: Hệ thống tự động trừ tiền trong bảng `shared_funds` thay vì gán nợ cá nhân."
        ),
        "exception_flow": (
            "Tại bước 3, nếu nhân viên không tải lên ảnh hóa đơn quyết toán: Hệ thống từ chối hoàn tất theo quy tắc BR-EXP-03."
        ),
        "business_rules": "BR-BOOK-03, BR-EXP-01, BR-EXP-03",
        "related_fr": "FR-STF-03, FR-EXP-01",
        "related_tc": "TC-MAINT-07"
    }
]

print(f"Loaded {len(UCS_CHRG_FIN_MAINT)} use cases in Part 2a.")
