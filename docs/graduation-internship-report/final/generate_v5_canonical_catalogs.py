# -*- coding: utf-8 -*-
"""
generate_v5_canonical_catalogs.py - Sinh tập hợp danh mục chuẩn hóa cho Báo cáo V5:
1. Danh mục 70 Yêu cầu chức năng chuẩn hóa (Canonical FRs):
   - Chuẩn hóa FR-EXP-03 và FR-EXP-04: Phản ánh kiến trúc PHÂN BỔ CHI PHÍ TRỰC TIẾP (Direct Expense Allocation),
     trách nhiệm người lái (Driver-Specific Energy Allocation) và phòng chống trùng lặp chi phí (Duplicate Prevention).
   - Tách biệt rõ ràng cơ chế Quỹ chung cũ là dữ liệu lịch sử / dự phòng tùy chọn.
   - Bổ sung FR-NOTI-01 (Thông báo thời gian thực) và FR-AI-01 (Trợ lý ảo AI tra cứu quy chế) để chấm dứt việc
     Notification và AI Use Cases phải tham chiếu sai lệch về FR-3D-01.
   - Loại bỏ các tuyên bố quá mức (ví dụ "60 FPS tuyệt đối", "hoàn hảo").
2. Danh mục 42 Quy tắc nghiệp vụ chuẩn hóa (Canonical BRs):
   - Thay thế BR-EXP-05 thành Quy tắc phòng chống trùng lặp và tính bất biến của phân bổ chi phí
     (Duplicate Expense Prevention & Allocation Idempotency).
3. Ma trận phân quyền đa cấp Role Permission Matrix (11 phân hệ).
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)

import v4_canonical_catalogs as v4_cat

def build_v5_catalogs():
    frs = v4_cat.get_canonical_frs()
    
    # 1. Update FRs
    updated_frs = []
    for f in frs:
        f_copy = dict(f)
        f_id = f_copy["id"]
        
        # Tone down FR-3D-01 60 FPS
        if f_id == "FR-3D-01":
            f_copy["expected"] = "Canvas 3D hiển thị tương tác mượt mà theo cấu hình phần cứng thiết bị, OrbitControls phản hồi tức thì với thao tác chuột và cảm ứng."
        
        # Replace FR-EXP-03 (Shared Fund) with Driver-Specific Energy Allocation & Duplicate Prevention
        if f_id == "FR-EXP-03":
            f_copy["name"] = "Phân bổ chi phí năng lượng sạc theo người lái và chống trùng lặp (Driver Energy Allocation)"
            f_copy["actor"] = "Hệ thống kế toán tự động / Người lái chuyến đi"
            f_copy["description"] = "Tự động kết xuất chi phí điện năng tiêu thụ từ phiên di chuyển theo chính sách USER_RESPONSIBILITY, gán trực tiếp 100% nghĩa vụ nợ cho người lái xe. Thực thi cơ chế lũy đẳng (idempotent), ngăn ngừa tạo trùng lặp hóa đơn chi phí cho cùng một chuyến đi."
            f_copy["preconditions"] = "Chuyến đi đã hoàn tất nghiệm thu trả xe, có ghi nhận lượng điện năng tiêu thụ thực tế."
            f_copy["expected"] = "Tạo Expense với allocationPolicy = USER_RESPONSIBILITY, gán responsibleUser = driver. Không sinh trùng lặp bản ghi nếu đã tồn tại."
            f_copy["source_evidence"] = "ExpenseService.java:createTripEnergyExpense(), ExpenseShareService.java:generateSharesForExpense()"
            
        # Replace FR-EXP-04 (Shared Fund Contribution) with Personal Obligations & Historical Records
        if f_id == "FR-EXP-04":
            f_copy["name"] = "Quản lý nghĩa vụ tài chính cá nhân và tra cứu hồ sơ lịch sử (Personal Obligations & History)"
            f_copy["actor"] = "Đồng sở hữu, Kế toán, Quản trị viên"
            f_copy["description"] = "Cung cấp bảng tổng hợp công nợ chi phí cá nhân theo từng thành viên và từng phương tiện. Phân định rõ nợ từ chi phí chung (theo % vốn) và nợ năng lượng chuyến đi (trách nhiệm người lái). Lưu giữ các bản ghi quỹ chung và đóng góp cũ làm hồ sơ lịch sử tham chiếu minh bạch."
            f_copy["preconditions"] = "Người dùng đã xác thực, có phân quyền truy cập thông tin tài chính của nhóm xe."
            f_copy["expected"] = "Trả về danh sách nghĩa vụ nợ cá nhân, trạng thái SETTLED/UNPAID và lịch sử hạch toán. Dữ liệu quỹ cũ chỉ hiển thị ở chế độ tham chiếu lịch sử."
            f_copy["source_evidence"] = "ExpenseShareService.java:getCostSharingSummary(), PersonalPaymentController.java:getPaymentsForCurrentUser(), SharedFundController.java (Legacy/Historical)"

        updated_frs.append(f_copy)

    # Add FR-NOTI-01 and FR-AI-01
    updated_frs.append({
        "id": "FR-NOTI-01",
        "name": "Thông báo đẩy thời gian thực về biến động lịch xe và tài chính (Real-Time Notification Dispatch)",
        "actor": "Hệ thống điều hành / Người dùng hệ thống",
        "description": "Tự động phát sinh và gửi thông báo thời gian thực tới các thành viên liên quan khi phát sinh sự kiện: có lịch đặt xe mới, yêu cầu đàm phán gia hạn, hóa đơn chi phí phân bổ mới hoặc có đề xuất biểu quyết cần bỏ phiếu.",
        "preconditions": "Sự kiện nghiệp vụ diễn ra thành công (đặt xe, nộp chi phí, tạo biểu quyết).",
        "expected": "Tạo bản ghi Notification cho từng người nhận, cập nhật số lượng thông báo chưa đọc, đẩy tin qua SSE/WebSocket.",
        "priority": "Cao (High)",
        "status": "Hoàn thành đối chiếu mã nguồn",
        "source_evidence": "NotificationController.java:getNotifications(), NotificationService.java:createNotification()"
    })

    updated_frs.append({
        "id": "FR-AI-01",
        "name": "Tra cứu quy chế và giải đáp quy trình đồng sở hữu qua Trợ lý ảo AI (AI Assistant Zone)",
        "actor": "Đồng sở hữu, Thành viên mới, Khách vãng lai",
        "description": "Cung cấp giao diện tương tác thông minh với trợ lý AI, hỗ trợ người dùng tra cứu quy chế nhóm, hướng dẫn sử dụng các tính năng 3D, giải đáp chính sách phân bổ chi phí WAC và hướng dẫn giải quyết khiếu nại.",
        "preconditions": "Người dùng mở ô đối thoại AI Assistant hoặc truy cập khu vực AI Zone trong Garage 3D.",
        "expected": "Phản hồi câu trả lời dựa trên tài liệu quy chế được nạp sẵn, gợi ý câu hỏi liên quan, có cơ chế xử lý Timeout an toàn khi mô hình bận.",
        "priority": "Trung bình (Medium)",
        "status": "Hoàn thành đối chiếu mã nguồn",
        "source_evidence": "AiAssistantController.java:chat(), AiAssistantInstallation.tsx, AiService.java"
    })

    # 2. Update BRs
    brs = v4_cat.get_canonical_brs()
    updated_brs = []
    for b in brs:
        b_copy = dict(b)
        b_id = b_copy["id"]
        
        # Replace BR-EXP-05 (Non-negative fund balance) with Duplicate Prevention & Allocation Idempotency
        if b_id == "BR-EXP-05":
            b_copy["name"] = "Quy tắc phòng chống trùng lặp và tính bất biến phân bổ chi phí (Duplicate Expense Prevention & Allocation Idempotency)"
            b_copy["condition"] = "Một khoản chi phí chỉ được sinh nghĩa vụ phân bổ (ExpenseShare) khi đã ở trạng thái APPROVED. Thao tác phân bổ chi phí là lũy đẳng (idempotent): không được phép tạo trùng lặp ExpenseShare cho cùng một expense_id. Chi phí năng lượng từ một chuyến đi chỉ được kết xuất hóa đơn một lần duy nhất, gán trực tiếp 100% trách nhiệm cho người lái (USER_RESPONSIBILITY). Các bản ghi quỹ chung cũ chỉ lưu trữ dưới dạng hồ sơ lịch sử tham chiếu."
            b_copy["enforcement"] = "Kiểm tra expense.status == APPROVED, kiểm tra expenseShareRepository.existsByExpenseId(expense.getId()), và expenseRepository.findByRelatedTripId(trip.getId())"
            b_copy["source_file"] = "backend/src/main/java/com/evshare/expense/service/ExpenseShareService.java"
            b_copy["related_ucs"] = "UC-FIN-01, UC-FIN-03"

        updated_brs.append(b_copy)

    # 3. Role Permission Matrix
    role_matrix = v4_cat.get_role_permission_matrix()
    updated_matrix = []
    for m in role_matrix:
        m_copy = dict(m)
        if m_copy["module"] == "Ví & Quỹ chung":
            m_copy["module"] = "Ví & Nghĩa vụ chi phí cá nhân"
            m_copy["restrictions"] = "Áp dụng cơ chế phân bổ chi phí trực tiếp (Direct Expense Allocation). CO_OWNER chỉ xem công nợ cá nhân và nộp thanh toán (DEMO VietQR); STAFF đối soát gạch nợ (chặn tự duyệt nợ của chính mình). Dữ liệu quỹ chung cũ chỉ mang tính tham chiếu lịch sử."
            m_copy["source_evidence"] = "ExpenseShareService.java, PersonalPaymentService.java"
        updated_matrix.append(m_copy)

    # Output to v5_canonical_catalogs.py
    out_path = os.path.join(BASE_DIR, "v5_canonical_catalogs.py")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\n')
        f.write("v5_canonical_catalogs.py - Danh mục chuẩn hóa Yêu cầu chức năng (70 FRs), Quy tắc nghiệp vụ (42 BRs)\n")
        f.write("và Ma trận phân quyền Role Permission Matrix cho Báo cáo V5 hoàn thiện.\n")
        f.write('"""\n\n')
        
        f.write(f"CANONICAL_FRS = {repr(updated_frs)}\n\n")
        f.write(f"CANONICAL_BRS = {repr(updated_brs)}\n\n")
        f.write(f"ROLE_PERMISSION_MATRIX = {repr(updated_matrix)}\n\n")
        
        f.write("def get_canonical_frs():\n    return CANONICAL_FRS\n\n")
        f.write("def get_canonical_brs():\n    return CANONICAL_BRS\n\n")
        f.write("def get_role_permission_matrix():\n    return ROLE_PERMISSION_MATRIX\n")

    print(f"Generated v5_canonical_catalogs.py with {len(updated_frs)} FRs, {len(updated_brs)} BRs, {len(updated_matrix)} Role Matrix rows.")

if __name__ == "__main__":
    build_v5_catalogs()
