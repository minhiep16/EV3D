# -*- coding: utf-8 -*-
"""
generate_remaining_74_usecases.py - Sinh 74 đặc tả Use Case chi tiết cho Phụ lục C
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)
import build_supporting_docs_part2
import v3_data_usecases

major_ids = {uc["id"] for uc in v3_data_usecases.MAJOR_USE_CASES}
print(f"Loaded {len(major_ids)} major UC IDs.")

groups = build_supporting_docs_part2.build_use_case_catalog()

# Danh mục 74 Use Cases còn lại cần đặc tả chi tiết
remaining_specs = []

# Mẫu sinh đặc tả chi tiết dựa trên mã và tên nghiệp vụ
for g_title, ucs in groups:
    group_prefix = g_title.split(".")[0].strip()
    for uc_tuple in ucs:
        uc_id, uc_name, actor, loc, diag, fr, br = uc_tuple
        if uc_id in major_ids:
            continue
            
        # Xác định nội dung nghiệp vụ theo từng Use Case cụ thể
        desc = f"Cho phép {actor} thực hiện nghiệp vụ '{uc_name}' trên hệ thống EVShare 3D, bảo đảm tuân thủ quy tắc {br} và lưu vết kiểm toán đầy đủ."
        priority = "Trung bình (Medium)" if "Tra cứu" in uc_name or "Xem" in uc_name else "Cao (High)"
        trigger = f"{actor} truy cập giao diện tương ứng trên ứng dụng và kích hoạt chức năng '{uc_name}'."
        pre = f"1. {actor} đã đăng nhập và được cấp quyền tương ứng.\n2. Dữ liệu đối tượng liên quan đang ở trạng thái hợp lệ trong CSDL."
        post = f"1. Dữ liệu nghiệp vụ được cập nhật hoặc truy vấn thành công trong CSDL.\n2. Giao diện người dùng hiển thị thông tin phản hồi và cập nhật trạng thái."
        
        main_steps = [
            f"1. {actor} mở giao diện chức năng liên quan trên hệ thống.",
            f"2. Người dùng nhập các thông số cần thiết hoặc chọn đối tượng xử lý cho '{uc_name}'.",
            f"3. Máy khách gửi HTTP request tới endpoint tương ứng của Backend Spring Boot.",
            f"4. Tầng Filter xác thực tính hợp lệ của Bearer Token và kiểm tra quyền hạn {actor}.",
            f"5. Controller tiếp nhận payload và chuyển tới tầng Service xử lý logic nghiệp vụ.",
            f"6. Tầng Service kiểm tra các ràng buộc và quy tắc nghiệp vụ {br}.",
            f"7. Hệ thống thực thi thao tác trên CSDL qua JPA Repository và ghi nhật ký kiểm toán.",
            f"8. Máy chủ trả về HTTP 200 OK (hoặc 201 Created) kèm dữ liệu DTO phản hồi.",
            f"9. Giao diện máy khách cập nhật trạng thái mới và hiển thị thông báo thành công cho {actor}."
        ]
        main_flow = "\n".join(main_steps)
        
        alt_flow = f"2a. Người dùng hủy bỏ thao tác giữa chừng: Hệ thống đóng form và không thay đổi dữ liệu.\n5a. Dữ liệu đang được xử lý đồng thời bởi tiến trình khác: Hệ thống áp dụng khóa lạc quan (Optimistic Locking) để bảo đảm tính nhất quán."
        exception_flow = f"4e. Token hết hạn hoặc không đủ quyền hạn: Hệ thống trả về HTTP 401/403 và điều hướng về trang đăng nhập.\n6e. Vi phạm quy tắc nghiệp vụ {br}: Hệ thống trả về HTTP 400 Bad Request kèm thông báo lỗi chi tiết."
        
        # Tinh chỉnh một số Use Case quan trọng đặc thù
        if "UC-AUTH-03" in uc_id:
            desc = "Cho phép khách vãng lai đăng ký tài khoản thành viên mới trong hệ thống EVShare 3D."
            pre = "Khách vãng lai truy cập trang /register, email chưa tồn tại trong bảng users."
            post = "Tạo bản ghi người dùng mới với trạng thái ACTIVE và vai trò CO_OWNER."
        elif "UC-AUTH-04" in uc_id:
            desc = "Làm mới Access Token khi đã hết hạn thông qua Refresh Token hợp lệ."
            pre = "Trình duyệt đang lưu trữ Refresh Token còn hiệu lực trong CSDL."
            post = "Cấp Access Token mới với thời hạn 24 giờ tiếp theo."
        elif "UC-ADMIN-04" in uc_id:
            desc = "Quản trị viên khóa hoặc mở khóa tài khoản người dùng vi phạm quy chế."
            pre = "Đăng nhập với vai trò ADMIN, tài khoản cần khóa không phải là chính mình."
            post = "Trạng thái người dùng chuyển sang SUSPENDED hoặc ACTIVE."
        elif "UC-BOOK-03" in uc_id:
            desc = "Chủ xe hủy lịch đặt xe hợp lệ trước giờ khởi hành tối thiểu 2 tiếng."
            pre = "Lịch đặt xe ở trạng thái CONFIRMED, thời gian hiện tại cách giờ bắt đầu >= 2 giờ."
            post = "Lịch đặt xe chuyển sang CANCELLED, hoàn trả khung giờ trống cho xe."
        elif "UC-TRIP-06" in uc_id:
            desc = "Chủ xe đang trong chuyến đi gửi yêu cầu gia hạn thời gian sử dụng xe."
            pre = "Chuyến đi đang IN_PROGRESS, thời gian kết thúc ban đầu chưa trôi qua."
            post = "Tạo bản ghi TripExtensionRequest với trạng thái PENDING_CONSENT."
        elif "UC-TRIP-07" in uc_id:
            desc = "Chủ xe có lịch đặt kế tiếp xem xét đồng ý hoặc từ chối yêu cầu gia hạn của người đi trước."
            pre = "Có yêu cầu gia hạn PENDING_CONSENT xung đột với lịch đặt của người dùng này."
            post = "Nếu đồng thuận, lịch của người này được lùi lại và chuyến đi trước được gia hạn."
        elif "UC-FIN-06" in uc_id:
            desc = "Nhân viên tài chính từ chối chứng từ thanh toán demo không hợp lệ kèm lý do."
            pre = "Bản ghi PersonalExpensePayment đang ở trạng thái PAYMENT_SUBMITTED."
            post = "Trạng thái chuyển sang REJECTED, nghĩa vụ nợ ExpenseShare giữ nguyên ALLOCATED."
        elif "UC-VOTE-01" in uc_id:
            desc = "Thành viên tạo đề xuất biểu quyết dân chủ trong nhóm đồng sở hữu xe."
            pre = "Người dùng là thành viên ACTIVE trong nhóm xe, xe không có tranh chấp lớn."
            post = "Tạo bản ghi VoteProposal với trạng thái OPEN và thời hạn biểu quyết."
        elif "UC-VOTE-03" in uc_id:
            desc = "Thành viên bỏ phiếu biểu quyết với trọng số tự động gán bằng tỷ lệ phần trăm vốn sở hữu."
            pre = "Phiên biểu quyết đang OPEN, người dùng chưa bỏ phiếu cho đề xuất này."
            post = "Tạo bản ghi ProposalVote lưu lựa chọn và trọng số phiếu vote."
        elif "UC-VOTE-05" in uc_id:
            desc = "Chủ xe khởi tạo khiếu nại tranh chấp về tổn hại hoặc chi phí sau hành trình."
            pre = "Chuyến đi liên quan đã hoàn tất trong vòng 48 giờ hoặc có sự cố kiểm định."
            post = "Tạo bản ghi Dispute với trạng thái OPEN, kích hoạt quy trình hòa giải."
        elif "UC-VOTE-08" in uc_id:
            desc = "Nhân viên hoặc Admin ban hành quyết định hòa giải và thực thi giải pháp bồi thường."
            pre = "Tranh chấp đang ở trạng thái UNDER_REVIEW, các bên đã trình bày chứng cứ."
            post = "Trạng thái Dispute chuyển RESOLVED, tự động điều chỉnh nghĩa vụ tài chính liên quan."
        elif "UC-CON-03" in uc_id:
            desc = "Thành viên thực hiện ký kết hợp đồng điện tử mô phỏng bằng mã xác thực DEMO."
            pre = "Hợp đồng ở trạng thái PENDING_SIGNATURES, người dùng chưa ký phiên bản này."
            post = "Tạo bản ghi ContractSignature, nếu 100% đã ký thì hợp đồng chuyển FULLY_EXECUTED."
        elif "UC-3D-04" in uc_id:
            desc = "Kích hoạt chế độ X-Ray nhìn xuyên thấu vào cụm cell pin cao áp trong không gian 3D."
            pre = "Mô hình 3D xe đang hiển thị trên Canvas, người dùng chọn chế độ Pin."
            post = "Vỏ xe trở nên trong suốt bán phần, cụm pin phát sáng hiển thị trạng thái SOH/SOC."

        uc_item = {
            "id": uc_id,
            "name": uc_name,
            "primary_actor": actor,
            "secondary_actor": "Hệ thống CSDL",
            "description": desc,
            "priority": priority,
            "trigger": trigger,
            "preconditions": pre,
            "postconditions": post,
            "main_flow": main_flow,
            "alt_flow": alt_flow,
            "exception_flow": exception_flow,
            "business_rules": f"Tuân thủ quy tắc {br} và chính sách hệ thống.",
            "related_fr": f"Yêu cầu chức năng {fr}.",
            "related_tc": f"Ca kiểm thử tương ứng {fr.replace('FR', 'TC')}."
        }
        remaining_specs.append(uc_item)

print(f"Generated {len(remaining_specs)} remaining detailed Use Cases.")

# Ghi vào file v3_data_usecases.py hoàn chỉnh
out_content = f'''# -*- coding: utf-8 -*-
"""
v3_data_usecases.py - Danh mục và chi tiết đặc tả 88 Use Cases chuẩn hóa cho V3
Bao gồm:
- 14 Use Cases đại diện cho Chương 3 (Mục 3.9)
- 74 Use Cases chi tiết cho Phụ lục C
"""

MAJOR_USE_CASES = {repr(v3_data_usecases.MAJOR_USE_CASES)}

REMAINING_USE_CASES = {repr(remaining_specs)}

def get_major_use_cases():
    return MAJOR_USE_CASES

def get_remaining_use_cases():
    return REMAINING_USE_CASES

def get_all_use_cases():
    return MAJOR_USE_CASES + REMAINING_USE_CASES
'''

out_path = os.path.join(BASE_DIR, "v3_data_usecases.py")
with open(out_path, "w", encoding="utf-8") as f:
    f.write(out_content)

print(f"Updated {out_path} successfully. Total UCs: {len(v3_data_usecases.MAJOR_USE_CASES) + len(remaining_specs)}")
