# -*- coding: utf-8 -*-
"""
build_v3_data_database.py - Trích xuất từ điển dữ liệu toàn diện 51 bảng CSDL quan hệ
"""
import os
import re

backend_src = r"D:\EV3D\backend\src\main\java\com\evshare"
out_py = r"D:\EV3D\docs\graduation-internship-report\final\v3_data_database.py"

tables_meta = {
    "users": "Lưu trữ tài khoản người dùng, email, mật khẩu băm BCrypt, họ tên và vai trò",
    "roles": "Lưu trữ danh mục vai trò hệ thống (ADMIN, STAFF, CO_OWNER)",
    "refresh_tokens": "Quản lý mã làm mới phiên đăng nhập JWT (Refresh Token) và thời gian sống",
    "audit_logs": "Nhật ký kiểm toán an ninh và truy vết thao tác của quản trị viên và người dùng",
    "vehicles": "Quản lý danh mục phương tiện xe điện: Biển số, số khung VIN, ODO và trạng thái xe",
    "vehicle_battery_health": "Theo dõi sức khỏe cụm pin: Tỷ lệ SOH, dung lượng khả dụng kWh, số chu kỳ sạc",
    "vehicle_registration_drafts": "Dự thảo hồ sơ đăng ký thông số kỹ thuật xe trước khi đưa vào vận hành",
    "co_ownership_groups": "Định danh nhóm đồng sở hữu phương tiện, quy chế vận hành và số thành viên",
    "group_members": "Bảng liên kết thành viên trong nhóm đồng sở hữu, vai trò (LEADER/MEMBER) và trạng thái",
    "group_vehicles": "Liên kết phương tiện với nhóm đồng sở hữu (quy tắc 1 nhóm sở hữu 1 phương tiện)",
    "group_discovery_settings": "Cấu hình cho phép nhóm hiển thị công khai trên danh bạ để tìm thêm cổ đông",
    "group_invitations": "Quản lý lời mời tham gia nhóm đồng sở hữu xe ban đầu",
    "group_join_requests": "Quản lý đơn xin gia nhập nhóm từ người dùng tự do",
    "ownership_shares": "Lưu tỷ lệ sở hữu vốn (%) của từng thành viên (bất biến tổng bằng đúng 100%)",
    "ownership_change_history": "Nhật ký biến động lịch sử tái phân bổ và chuyển nhượng tỷ lệ sở hữu",
    "ownership_transfer_requests": "Yêu cầu chuyển nhượng cổ phần giữa các thành viên kèm tiến trình đồng thuận",
    "membership_invitations": "Thư mời gia nhập nhóm kèm điều khoản trích vốn cổ đông hiện hữu",
    "membership_withdrawal_requests": "Đơn xin rút lui khỏi nhóm đồng sở hữu xe và phương án giải quyết vốn",
    "bookings": "Quản lý lịch đặt xe của các thành viên, thời gian bắt đầu/kết thúc và mục đích",
    "vehicle_handovers": "Biên bản bàn giao xe kỹ thuật: ODO xuất phát, pin, chữ ký nhân viên và chủ xe",
    "trips": "Quản lý chu trình hành trình di chuyển thực tế, ODO/Pin lúc đi và về, điện năng tiêu thụ",
    "trip_extension_requests": "Yêu cầu xin gia hạn thêm giờ của chuyến đi và tiến trình đàm phán người kế tiếp",
    "vehicle_inspections": "Biên bản kiểm định kỹ thuật tổng thể phương tiện (PASSED / FAILED)",
    "vehicle_inspection_items": "Chi tiết đánh giá từng hạng mục kiểm tra kỹ thuật (lốp, phanh, đèn, kính)",
    "damage_records": "Ghi nhận vết hư hại thân vỏ: Vị trí bộ phận, mức độ, ảnh chụp và tọa độ Hotspot 3D",
    "charging_stations": "Danh mục trụ sạc điện thông minh trong bãi đỗ: Loại cổng, công suất kW, đơn giá",
    "charging_sessions": "Quản lý các phiên sạc pin thực tế: Điện nạp thô, điện lưu kho (92%), tổn hao (8%)",
    "vehicle_energy_inventories": "Kho năng lượng số của xe: Số kWh khả dụng, tổng giá trị vốn, đơn giá bình quân WAC",
    "vehicle_energy_transactions": "Nhật ký giao dịch xuất nhập kho năng lượng: Nạp sạc (INFLOW), chuyến đi (TRIP)",
    "expenses": "Quản lý các khoản chi phí phát sinh: Số tiền, danh mục, chính sách phân bổ",
    "expense_shares": "Nghĩa vụ chi phí chi tiết phân bổ cho từng cá nhân (Hare-Niemeyer rounding)",
    "expense_approvals": "Nhật ký lịch sử phê duyệt khoản chi phí của ban quản trị hoặc nhóm",
    "personal_expense_payments": "Chứng từ nộp thanh toán cá nhân DEMO và nhân viên xác minh tất toán nợ",
    "shared_funds": "Quỹ chung phương tiện (Bảo lưu cấu trúc dữ liệu di sản / chế độ dự phòng)",
    "fund_contributions": "Bản ghi đóng góp quỹ chung của các thành viên (Dữ liệu lịch sử)",
    "fund_transactions": "Bản ghi biến động số dư quỹ chung (Dữ liệu lịch sử)",
    "maintenance_requests": "Lệnh bảo dưỡng sửa chữa: Định kỳ mốc ODO, đột xuất, thay thế phụ tùng",
    "maintenance_approval_votes": "Biểu quyết tập thể thông qua dự toán và kế hoạch bảo dưỡng xe",
    "co_ownership_contracts": "Hợp đồng khung đồng sở hữu phương tiện",
    "co_ownership_contract_versions": "Các phiên bản hợp đồng pháp lý (DRAFT -> ACTIVE -> SUPERSEDED)",
    "contract_acceptances": "Chữ ký điện tử mô phỏng (DEMO Signature) và thời điểm ký của từng chủ xe",
    "vote_proposals": "Đề xuất biểu quyết dân chủ trong nhóm xe: Nội dung, thời hạn, quy tắc MAJORITY",
    "proposal_votes": "Lá phiếu biểu quyết của thành viên (FOR/AGAINST) với trọng số bằng % sở hữu",
    "proposal_vote_eligibility": "Danh sách cử tri hợp lệ và tỷ lệ quyền biểu quyết đối với từng đề xuất",
    "disputes": "Hồ sơ khiếu nại tranh chấp sự cố, phân bổ tiền điện hoặc hư hại thân vỏ",
    "dispute_participants": "Danh sách các bên liên quan tham gia vào quá trình hòa giải khiếu nại",
    "dispute_evidence": "Bằng chứng hóa đơn, biên lai chuyển khoản và ảnh chụp đính kèm hồ sơ khiếu nại",
    "dispute_messages": "Lời thoại trao đổi hòa giải trực tuyến giữa chủ xe và nhân viên điều tra",
    "dispute_compensations": "Phương án và quyết định bồi thường hòa giải được phê duyệt",
    "dispute_compensation_payments": "Bản ghi thực thi chi trả bồi thường mô phỏng (DEMO Compensation)",
    "notifications": "Hệ thống thông báo đẩy gửi đến người dùng theo sự kiện vận hành"
}

# Scan entities
entities_dict = {}

for root, dirs, files in os.walk(backend_src):
    for f in files:
        if f.endswith(".java"):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
                txt = fp.read()
            if "@Entity" in txt:
                tbl_m = re.search(r'@Table\(\s*name\s*=\s*["\']([^"\']*)["\']', txt)
                cname = f.replace(".java", "")
                tbl_name = tbl_m.group(1) if tbl_m else cname.lower()
                
                # Extract fields
                cols = []
                lines = txt.split("\n")
                for i, line in enumerate(lines):
                    field_m = re.search(r'private\s+([\w\<\>\,\[\]]+)\s+(\w+)\s*;', line)
                    if field_m:
                        ftype = field_m.group(1)
                        fname = field_m.group(2)
                        
                        # Look at annotations above field
                        annos = ""
                        for k in range(max(0, i-4), i):
                            annos += lines[k] + " "
                            
                        is_pk = "@Id" in annos
                        is_fk = any(x in annos for x in ["@ManyToOne", "@OneToOne", "@JoinColumn"])
                        nullable = "NO" if ("nullable = false" in annos or "@NotNull" in annos or is_pk) else "YES"
                        unique = "YES" if "unique = true" in annos else "NO"
                        
                        # Map java type to SQL type
                        sql_type = "VARCHAR(255)"
                        if ftype in ["UUID"]: sql_type = "VARCHAR(36)"
                        elif ftype in ["Long", "long"]: sql_type = "BIGINT"
                        elif ftype in ["Integer", "int"]: sql_type = "INT"
                        elif ftype in ["BigDecimal"]: sql_type = "DECIMAL(12,2)"
                        elif ftype in ["Double", "double"]: sql_type = "DOUBLE"
                        elif ftype in ["Boolean", "boolean"]: sql_type = "BOOLEAN"
                        elif ftype in ["Instant", "LocalDateTime"]: sql_type = "DATETIME"
                        elif ftype in ["LocalDate"]: sql_type = "DATE"
                        elif ftype in ["String"] and "description" in fname.lower(): sql_type = "TEXT"
                        
                        cols.append({
                            "name": fname,
                            "type": sql_type,
                            "pk": "YES" if is_pk else "NO",
                            "fk": "YES" if is_fk else "NO",
                            "nullable": nullable,
                            "default": "None" if is_pk else ("0" if "INT" in sql_type else "NULL"),
                            "unique": unique,
                            "desc": f"Trường dữ liệu {fname} của thực thể {cname}"
                        })
                entities_dict[tbl_name] = {
                    "class": cname,
                    "purpose": tables_meta.get(tbl_name, f"Quản lý thực thể {cname} trong hệ thống"),
                    "columns": cols
                }

out_content = f"""# -*- coding: utf-8 -*-
\"\"\"
v3_data_database.py - Từ điển dữ liệu toàn diện 51 bảng CSDL quan hệ MySQL
\"\"\"

TABLES_DATA = {repr(entities_dict)}

def get_all_tables():
    return TABLES_DATA
"""

with open(out_py, "w", encoding="utf-8") as fp:
    fp.write(out_content)

print(f"Generated {out_py} with {len(entities_dict)} database tables.")
