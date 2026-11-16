# -*- coding: utf-8 -*-
"""
generate_v5_data_usecases.py - Chuẩn hóa và khắc phục 100% các lỗi tham chiếu trong 88 Use Cases cho Báo cáo V5:
- 14 Use Cases cốt lõi (Mục 3.9) + 74 Use Cases chuyên sâu (Phụ lục C).
- Khắc phục 37 lỗi tham chiếu mã TC không tồn tại: Ánh xạ chuẩn xác về 100 ca kiểm thử thực tế.
- Khắc phục lỗi Notification và AI tham chiếu sai FR-3D-01: Chuyển sang FR-NOTI-01 và FR-AI-01.
- Điều chỉnh nội dung các Use Case Tài chính (UC-FIN-01..07) sang mô hình PHÂN BỔ CHI PHÍ TRỰC TIẾP
  (Direct Expense Allocation), trách nhiệm người lái (USER_RESPONSIBILITY) và thanh toán nợ cá nhân (PersonalPayment DEMO).
- Điều chỉnh UC-3D-07 phản ánh đúng kiến trúc Camera Presets theo vai trò và OrbitControls constraints.
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)

import v4_data_usecases as v4_uc
import v5_data_testcases as v5_tc
import v5_canonical_catalogs as v5_cat

# Mappings for UC reconciliation
UC_UPDATES = {
    # AUTH
    "UC-AUTH-01": {"related_fr": "FR-AUTH-02", "related_tc": "TC-AUTH-01, TC-AUTH-02"},
    "UC-AUTH-02": {"related_fr": "FR-AUTH-04", "related_tc": "TC-AUTH-04, TC-REG-25"},
    "UC-AUTH-03": {"related_fr": "FR-AUTH-01", "related_tc": "TC-AUTH-01"},
    "UC-AUTH-04": {"related_fr": "FR-AUTH-03", "related_tc": "TC-AUTH-03"},
    "UC-AUTH-05": {"related_fr": "FR-AUTH-05", "related_tc": "TC-AUTH-05, TC-SEC-01"},
    "UC-AUTH-06": {"related_fr": "FR-AUTH-06", "related_tc": "TC-AUTH-05, TC-REG-26"},
    "UC-AUTH-07": {"related_fr": "FR-AUTH-06", "related_tc": "TC-AUTH-05, TC-REG-26"},

    # 3D
    "UC-3D-01": {"related_fr": "FR-3D-01", "related_tc": "TC-3D-01, TC-REG-01, TC-REG-04"},
    "UC-3D-02": {"related_fr": "FR-3D-06", "related_tc": "TC-3D-02"},
    "UC-3D-03": {"related_fr": "FR-3D-02", "related_tc": "TC-REG-22"},
    "UC-3D-04": {"related_fr": "FR-3D-04", "related_tc": "TC-3D-04"},
    "UC-3D-05": {"related_fr": "FR-3D-03", "related_tc": "TC-3D-04, TC-DAMG-01"},
    "UC-3D-06": {"related_fr": "FR-3D-05", "related_tc": "TC-3D-05, TC-REG-13"},
    "UC-3D-07": {
        "related_fr": "FR-3D-07",
        "related_tc": "TC-REG-12",
        "description": "Khôi phục góc nhìn camera về vị trí mặc định tùy biến theo vai trò người dùng (CO_OWNER: [3.5, 2.0, 4.5] lệch trái panel-safe; STAFF: góc nhìn đa làn bãi xe đa bay; ADMIN: toàn cảnh Garage vĩ mô). OrbitControls giới hạn góc polar từ 35° đến 82° chống lật sàn và khoảng cách tối thiểu 6.0m chống cắt xuyên thân xe.",
        "main_flow": (
            "1. Người dùng đang ở chế độ xoay tự do hoặc sau khi đóng một bảng chi tiết nghiệp vụ.\n"
            "2. Hệ thống xác định vai trò hiện tại của người dùng (CO_OWNER, STAFF hoặc ADMIN).\n"
            "3. Kích hoạt action triggerCameraReset() trong worldStore.\n"
            "4. Three.js CameraRig thực hiện nội suy Lerp mượt mà đưa camera về tọa độ preset chuẩn của vai trò đó.\n"
            "5. Khôi phục trọng tâm xoay OrbitControls về tâm xe hoặc cụm xe tương ứng."
        )
    },

    # OWN & CON
    "UC-OWN-01": {"related_fr": "FR-CO-01", "related_tc": "TC-OWN-01"},
    "UC-OWN-02": {"related_fr": "FR-CO-04", "related_tc": "TC-OWN-01, TC-REG-05, TC-REG-19"},
    "UC-OWN-03": {"related_fr": "FR-CO-05", "related_tc": "TC-OWN-02, TC-OWN-03"},
    "UC-OWN-04": {"related_fr": "FR-CO-06", "related_tc": "TC-OWN-02"},
    "UC-OWN-05": {"related_fr": "FR-CO-05", "related_tc": "TC-OWN-03"},
    "UC-OWN-06": {"related_fr": "FR-CO-07", "related_tc": "TC-OWN-04, TC-REG-09, TC-REG-19"},
    "UC-OWN-07": {"related_fr": "FR-CO-07", "related_tc": "TC-OWN-04, TC-REG-19"},
    "UC-OWN-08": {"related_fr": "FR-CO-02", "related_tc": "TC-INV-01"},
    "UC-OWN-09": {"related_fr": "FR-CO-02", "related_tc": "TC-INV-01"},
    "UC-OWN-10": {"related_fr": "FR-CO-03", "related_tc": "TC-INV-02, TC-REG-10"},
    "UC-OWN-11": {"related_fr": "FR-CO-03", "related_tc": "TC-INV-02"},

    "UC-CON-01": {"related_fr": "FR-CO-07", "related_tc": "TC-REG-11"},
    "UC-CON-02": {"related_fr": "FR-CO-03", "related_tc": "TC-CON-02"},
    "UC-CON-03": {"related_fr": "FR-CO-03", "related_tc": "TC-CON-02"},
    "UC-CON-04": {"related_fr": "FR-CO-07", "related_tc": "TC-CON-03, TC-REG-11"},
    "UC-CON-05": {"related_fr": "FR-CO-07", "related_tc": "TC-CON-03"},

    # BOOK
    "UC-BOOK-01": {"related_fr": "FR-BOOK-01", "related_tc": "TC-BOOK-01, TC-REG-29"},
    "UC-BOOK-02": {"related_fr": "FR-BOOK-02", "related_tc": "TC-BOOK-02, TC-BOOK-04, TC-BOOK-05, TC-REG-24"},
    "UC-BOOK-03": {"related_fr": "FR-BOOK-05", "related_tc": "TC-BOOK-08"},
    "UC-BOOK-04": {"related_fr": "FR-BOOK-01", "related_tc": "TC-BOOK-01"},

    # TRIP & HANDOVER & INSPECTION
    "UC-TRIP-01": {"related_fr": "FR-BOOK-07", "related_tc": "TC-HAND-01, TC-HAND-02, TC-REG-28"},
    "UC-TRIP-02": {"related_fr": "FR-BOOK-08", "related_tc": "TC-HAND-03"},
    "UC-TRIP-03": {"related_fr": "FR-BOOK-08", "related_tc": "TC-HAND-03"},
    "UC-TRIP-04": {"related_fr": "FR-TRIP-01", "related_tc": "TC-TRIP-01, TC-TRIP-02, TC-TRIP-03, TC-TRIP-04, TC-REG-15"},
    "UC-TRIP-05": {"related_fr": "FR-TRIP-02", "related_tc": "TC-TRIP-05, TC-REG-02, TC-REG-16, TC-REG-30"},
    "UC-TRIP-06": {"related_fr": "FR-BOOK-03", "related_tc": "TC-TRIP-05"},
    "UC-TRIP-07": {"related_fr": "FR-BOOK-04", "related_tc": "TC-TRIP-06"},
    "UC-TRIP-08": {"related_fr": "FR-TRIP-03", "related_tc": "TC-TRIP-07"},
    "UC-TRIP-09": {"related_fr": "FR-TRIP-04", "related_tc": "TC-TRIP-08, TC-INSP-01, TC-INSP-02"},
    "UC-TRIP-10": {"related_fr": "FR-TRIP-05", "related_tc": "TC-TRIP-09, TC-ENER-04"},
    "UC-TRIP-11": {"related_fr": "FR-TRIP-05", "related_tc": "TC-TRIP-09"},

    # CHRG & ENER
    "UC-CHRG-01": {"related_fr": "FR-CHG-01", "related_tc": "TC-CHRG-01"},
    "UC-CHRG-02": {"related_fr": "FR-CHG-02", "related_tc": "TC-CHRG-01"},
    "UC-CHRG-03": {"related_fr": "FR-CHG-03", "related_tc": "TC-CHRG-02, TC-ENER-01, TC-REG-06"},
    "UC-CHRG-04": {"related_fr": "FR-CHG-04", "related_tc": "TC-ENER-02"},
    "UC-CHRG-05": {"related_fr": "FR-CHG-05", "related_tc": "TC-CHRG-03, TC-REG-07"},
    "UC-CHRG-06": {"related_fr": "FR-CHG-06", "related_tc": "TC-REG-08"},

    # FIN (Direct Expense Allocation Architecture)
    "UC-FIN-01": {
        "related_fr": "FR-EXP-01",
        "related_tc": "TC-FIN-01",
        "description": "Ghi nhận hóa đơn chi phí phát sinh chung (Bảo dưỡng, Đăng kiểm, Bảo hiểm, Sửa chữa thân vỏ) kèm chính sách phân bổ trực tiếp.",
        "main_flow": (
            "1. Thành viên hoặc nhân viên mở màn hình tạo chi phí (/expenses/create).\n"
            "2. Nhập thông tin: xe, danh mục chi phí, số tiền nguyên tệ, ngày phát sinh, chính sách phân bổ (OWNERSHIP_RATIO).\n"
            "3. Tải lên ảnh chụp chứng từ hóa đơn đỏ hoặc biên lai hợp lệ.\n"
            "4. Hệ thống kiểm tra hợp lệ, tạo Expense ở trạng thái PENDING_APPROVAL.\n"
            "5. Gửi thông báo tới các đồng sở hữu trong nhóm để xem xét phê duyệt."
        )
    },
    "UC-FIN-02": {
        "related_fr": "FR-EXP-02",
        "related_tc": "TC-FIN-02, TC-REG-17",
        "description": "Hệ thống tự động phân bổ chi phí chung đã duyệt cho các thành viên theo tỷ lệ sở hữu vốn (OWNERSHIP_RATIO), sử dụng thuật toán Hare-Niemeyer bảo đảm khớp 100% đến từng đồng VND.",
        "main_flow": (
            "1. Khoản chi chuyển sang trạng thái APPROVED sau khi được nhóm phê chuẩn.\n"
            "2. ExpenseShareService kích hoạt phương thức generateSharesForExpense().\n"
            "3. Kiểm tra tính bất biến tổng cổ phần nhóm bằng đúng 100.0000%.\n"
            "4. Tính phần nguyên số tiền chia theo tỷ lệ sở hữu, xác định phần dư.\n"
            "5. Phân bổ phần dư 1 VND lần lượt cho thành viên có tỷ lệ cổ phần lớn nhất theo thứ tự ưu tiên xác định.\n"
            "6. Lưu các bản ghi ExpenseShare với trạng thái ALLOCATED, gửi thông báo nghĩa vụ nợ tới từng thành viên."
        )
    },
    "UC-FIN-03": {
        "related_fr": "FR-EXP-03",
        "related_tc": "TC-FIN-03, TC-REG-06",
        "description": "Tự động phân bổ chi phí điện năng tiêu thụ từ chuyến đi trực tiếp cho người lái (USER_RESPONSIBILITY) và ngăn ngừa trùng lặp hóa đơn.",
        "main_flow": (
            "1. Chuyến đi hoàn tất nghiệm thu trả xe, hệ thống ghi nhận sản lượng điện tiêu thụ thực tế (kWh).\n"
            "2. Tính chi phí điện = kWh * đơn giá bình quân WAC hiện hành của kho xe.\n"
            "3. Kiểm tra chống trùng lặp: kiểm tra ExpenseRepository.findByRelatedTripId(trip.getId()).\n"
            "4. Tạo Expense với chính sách USER_RESPONSIBILITY, gán 100% nghĩa vụ cho driver.\n"
            "5. Tạo duy nhất 1 bản ghi ExpenseShare cho người lái, gán trạng thái ALLOCATED."
        )
    },
    "UC-FIN-04": {
        "related_fr": "FR-EXP-05",
        "related_tc": "TC-FIN-04, TC-FIN-05",
        "description": "Thành viên nộp thông tin thanh toán nghĩa vụ nợ cá nhân (tiền điện hoặc chi phí phân bổ) ở chế độ DEMO bằng VietQR và đính kèm ảnh biên lai chuyển tiền.",
        "main_flow": (
            "1. Thành viên truy cập danh mục công nợ cá nhân (/my-obligations).\n"
            "2. Chọn khoản nợ cần thanh toán, hệ thống hiển thị mã VietQR động kèm cú pháp chuyển khoản.\n"
            "3. Thành viên thực hiện chuyển khoản mô phỏng và tải lên ảnh biên lai giao dịch.\n"
            "4. Kiểm tra chống nộp trùng lặp: không cho nộp thêm nếu đang có yêu cầu PAYMENT_SUBMITTED chờ duyệt.\n"
            "5. Lưu PersonalExpensePayment với trạng thái PAYMENT_SUBMITTED, thông báo tới nhân viên trực ban."
        )
    },
    "UC-FIN-05": {
        "related_fr": "FR-EXP-06",
        "related_tc": "TC-FIN-06",
        "description": "Nhân viên trạm kiểm tra, đối soát biên lai chuyển khoản và phê duyệt xác nhận tất toán nghĩa vụ chi phí cá nhân.",
        "main_flow": (
            "1. Nhân viên mở danh sách thanh toán chờ duyệt (/staff/payments/pending).\n"
            "2. Đối chiếu số tiền, nội dung giao dịch và ảnh chụp biên lai của thành viên.\n"
            "3. Kiểm tra quy tắc No Self-Approval: nhân viên không được tự duyệt thanh toán của chính mình.\n"
            "4. Nhân viên bấm 'Xác nhận hợp lệ' (VERIFIED).\n"
            "5. Cập nhật PersonalPayment sang VERIFIED và tự động gạch nợ ExpenseShare sang SETTLED."
        )
    },
    "UC-FIN-06": {
        "related_fr": "FR-EXP-06",
        "related_tc": "TC-FIN-07, TC-REG-18",
        "description": "Chặn hành vi tự phê duyệt thanh toán nợ cá nhân của chính mình (No Self-Approval) và xử lý từ chối biên lai sai lệch.",
        "main_flow": (
            "1. Người dùng có vai trò STAFF cố tình gọi API phê duyệt thanh toán của chính tài khoản mình.\n"
            "2. PersonalPaymentService kiểm tra payment.getUser().getId().equals(principal.getUserId()).\n"
            "3. Hệ thống chặn đứng thao tác, trả về mã lỗi 403 Forbidden kèm thông điệp vi phạm an ninh.\n"
            "4. Nếu biên lai chuyển khoản không hợp lệ hoặc thiếu tiền, nhân viên khác chọn REJECTED kèm lý do."
        )
    },
    "UC-FIN-07": {
        "related_fr": "FR-EXP-04",
        "related_tc": "TC-FIN-04",
        "description": "Tra cứu tổng hợp công nợ chi phí cá nhân, tiến độ thanh toán và lịch sử giao dịch (dữ liệu quỹ chung cũ lưu trữ dạng hồ sơ tham chiếu).",
        "main_flow": (
            "1. Thành viên hoặc nhân viên mở bảng báo cáo tài chính nhóm xe.\n"
            "2. Hệ thống tổng hợp các nghĩa vụ chi phí cá nhân (đã trả và còn nợ) từ bảng expense_shares.\n"
            "3. Hiển thị tách biệt nợ chi phí chung theo % vốn và nợ tiền điện chuyến đi cá nhân.\n"
            "4. Cung cấp khu vực xem lịch sử các khoản đóng góp quỹ cũ (nếu có) dưới dạng hồ sơ lưu trữ tham chiếu minh bạch."
        )
    },

    # MAINT
    "UC-MAINT-01": {"related_fr": "FR-3D-03", "related_tc": "TC-DAMG-02"},
    "UC-MAINT-02": {"related_fr": "FR-3D-03", "related_tc": "TC-DAMG-01"},
    "UC-MAINT-03": {"related_fr": "FR-DISP-02", "related_tc": "TC-DISP-01"},
    "UC-MAINT-04": {"related_fr": "FR-STF-02", "related_tc": "TC-MAINT-01, TC-MAINT-02"},
    "UC-MAINT-05": {"related_fr": "FR-BOOK-03", "related_tc": "TC-REG-24"},
    "UC-MAINT-06": {"related_fr": "FR-STF-02", "related_tc": "TC-MAINT-03"},
    "UC-MAINT-07": {"related_fr": "FR-STF-03", "related_tc": "TC-MAINT-04"},

    # VOTE & DISP
    "UC-VOTE-01": {"related_fr": "FR-VOTE-01", "related_tc": "TC-VOTE-01, TC-REG-23"},
    "UC-VOTE-02": {"related_fr": "FR-VOTE-04", "related_tc": "TC-VOTE-04"},
    "UC-VOTE-03": {"related_fr": "FR-VOTE-02", "related_tc": "TC-VOTE-02, TC-VOTE-03, TC-REG-20"},
    "UC-VOTE-04": {"related_fr": "FR-VOTE-05", "related_tc": "TC-VOTE-04"},
    "UC-VOTE-05": {"related_fr": "FR-DISP-01", "related_tc": "TC-DISP-01"},
    "UC-VOTE-06": {"related_fr": "FR-DISP-04", "related_tc": "TC-DISP-02"},
    "UC-VOTE-07": {"related_fr": "FR-DISP-03", "related_tc": "TC-DISP-03"},
    "UC-VOTE-08": {"related_fr": "FR-DISP-05", "related_tc": "TC-DISP-04, TC-REG-21"},
    "UC-VOTE-09": {"related_fr": "FR-DISP-06", "related_tc": "TC-DISP-04, TC-REG-21"},

    # ADMIN
    "UC-ADMIN-01": {"related_fr": "FR-ADM-02", "related_tc": "TC-REG-03, TC-REG-31"},
    "UC-ADMIN-02": {"related_fr": "FR-ADM-02", "related_tc": "TC-REG-14"},
    "UC-ADMIN-03": {"related_fr": "FR-ADM-02", "related_tc": "TC-REG-14"},
    "UC-ADMIN-04": {"related_fr": "FR-ADM-02", "related_tc": "TC-AUTH-05"},
    "UC-ADMIN-05": {"related_fr": "FR-ADM-01", "related_tc": "TC-REG-03"},
    "UC-ADMIN-06": {"related_fr": "FR-ADM-01", "related_tc": "TC-REG-03"},
    "UC-ADMIN-07": {"related_fr": "FR-CO-01", "related_tc": "TC-OWN-01"},
    "UC-ADMIN-08": {"related_fr": "FR-CO-01", "related_tc": "TC-OWN-01"},
    "UC-ADMIN-09": {"related_fr": "FR-CO-07", "related_tc": "TC-OWN-04"},
    "UC-ADMIN-10": {"related_fr": "FR-ADM-04", "related_tc": "TC-FIN-01"},
    "UC-ADMIN-11": {"related_fr": "FR-ADM-03", "related_tc": "TC-SEC-01"},

    # NOTI & AI (Reconciled to FR-NOTI-01 & FR-AI-01)
    "UC-NOTI-01": {
        "related_fr": "FR-NOTI-01",
        "related_tc": "TC-NOTI-01, TC-REG-23",
        "description": "Hệ thống tự động phát sinh và gửi thông báo đẩy thời gian thực tới các thành viên liên quan khi có lịch đặt xe mới hoặc có đề xuất biểu quyết cần bỏ phiếu."
    },
    "UC-NOTI-02": {
        "related_fr": "FR-NOTI-01",
        "related_tc": "TC-NOTI-02",
        "description": "Người dùng xem danh sách thông báo và thực hiện đánh dấu đã đọc từng thông báo hoặc toàn bộ thông báo."
    },
    "UC-NOTI-03": {
        "related_fr": "FR-AI-01",
        "related_tc": "TC-REG-27",
        "name": "Tra cứu quy chế và hướng dẫn vận hành qua Trợ lý ảo AI",
        "description": "Người dùng gửi câu hỏi qua giao diện Trợ lý ảo AI Assistant để tra cứu quy chế nhóm, hướng dẫn sử dụng tính năng 3D, chính sách chi phí WAC. Hệ thống phản hồi thông minh và xử lý Timeout an toàn khi mô hình bận."
    }
}

def generate_v5_usecases():
    ucs = v4_uc.get_all_use_cases()
    v5_ucs = []
    
    updated_count = 0
    for u in ucs:
        u_id = u["id"]
        u_copy = dict(u)
        
        if u_id in UC_UPDATES:
            upd = UC_UPDATES[u_id]
            for k, val in upd.items():
                u_copy[k] = val
            updated_count += 1
            
        v5_ucs.append(u_copy)

    # Save to v5_data_usecases.py
    out_path = os.path.join(BASE_DIR, "v5_data_usecases.py")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write('"""\n')
        f.write("v5_data_usecases.py - Danh mục 88 Use Cases chuẩn hóa cho Báo cáo V5\n")
        f.write("Khắc phục 100% lỗi tham chiếu TC và FR, chuẩn hóa kiến trúc Phân bổ chi phí trực tiếp.\n")
        f.write('"""\n\n')
        f.write(f"ALL_USE_CASES = {repr(v5_ucs)}\n\n")
        f.write("def get_all_use_cases():\n    return ALL_USE_CASES\n")

    print(f"Generated v5_data_usecases.py with {len(v5_ucs)} Use Cases (reconciled {updated_count} UCs).")

if __name__ == "__main__":
    generate_v5_usecases()
