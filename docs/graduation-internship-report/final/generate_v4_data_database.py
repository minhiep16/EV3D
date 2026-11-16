# -*- coding: utf-8 -*-
"""
generate_v4_data_database.py - Tạo file v4_data_database.py với physical schema chuẩn hóa snake_case,
sửa toàn bộ FK lỗi và cung cấp mô tả nghiệp vụ học thuật chi tiết.
"""
import os
import sys
import re

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)
import v3_data_database

v3_tables = v3_data_database.get_all_tables()
print(f"Loaded {len(v3_tables)} tables from v3.")

def camel_to_snake(name):
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()

# Dictionary of meaningful column descriptions
def get_column_description(col_name, tbl_name, col_type):
    cn = col_name.lower()
    
    if cn == "id": return "Khóa chính định danh duy nhất của bản ghi (UUID v4 / Long Auto-increment)"
    if cn == "created_at": return "Thời điểm tạo bản ghi lần đầu trong hệ thống (UTC ISO 8601 Timestamp)"
    if cn == "updated_at": return "Thời điểm cập nhật bản ghi gần nhất trong hệ thống (UTC Timestamp)"
    if cn == "created_by": return "Khóa ngoại liên kết người dùng tạo bản ghi (FK -> users.id)"
    if cn == "updated_by": return "Khóa ngoại liên kết người dùng cập nhật bản ghi gần nhất (FK -> users.id)"
    if cn == "status": return f"Trạng thái vòng đời của bản ghi trong quy trình nghiệp vụ {tbl_name}"
    if cn == "deleted_at" or cn == "is_deleted": return "Đánh dấu xóa mềm (Soft delete) phục vụ kiểm toán"
    if cn == "version": return "Phiên bản dữ liệu phục vụ khóa lạc quan (Optimistic Locking)"
    
    # Specific fields
    if cn == "user_id": return "Khóa ngoại liên kết tới tài khoản người dùng thực hiện (FK -> users.id)"
    if cn == "vehicle_id": return "Khóa ngoại liên kết tới phương tiện xe điện liên quan (FK -> vehicles.id)"
    if cn == "group_id" or cn == "co_ownership_group_id": return "Khóa ngoại liên kết nhóm đồng sở hữu phương tiện (FK -> co_ownership_groups.id)"
    if cn == "booking_id": return "Khóa ngoại liên kết phiên đặt xe tương ứng (FK -> bookings.id)"
    if cn == "trip_id": return "Khóa ngoại liên kết chuyến đi thực tế của người dùng (FK -> trips.id)"
    if cn == "dispute_id": return "Khóa ngoại liên kết tới hồ sơ khiếu nại tranh chấp (FK -> disputes.id)"
    if cn == "station_id" or cn == "charging_station_id": return "Khóa ngoại liên kết trạm sạc điện EVShare (FK -> charging_stations.id)"
    if cn == "maintenance_id": return "Khóa ngoại liên kết đợt bảo dưỡng sửa chữa xe (FK -> maintenances.id)"
    if cn == "proposal_id" or cn == "vote_proposal_id": return "Khóa ngoại liên kết tới đề xuất biểu quyết chung (FK -> vote_proposals.id)"
    if cn == "contract_id": return "Khóa ngoại liên kết hợp đồng đồng sở hữu mẫu (FK -> co_ownership_contracts.id)"
    if cn == "contract_version_id": return "Khóa ngoại liên kết phiên bản hợp đồng có hiệu lực (FK -> co_ownership_contract_versions.id)"
    
    # False FK fixes
    if cn == "token": return "Chuỗi mã token bảo mật phân cấp dùng trong phiên xác thực JWT hoặc mời tham gia"
    if cn == "state_of_health_percent": return "Chỉ số sức khỏe pin thực tế (SOH %) đo lường theo tiêu chuẩn BMS"
    if cn == "actual_cost": return "Tổng chi phí phát sinh thực tế bằng tiền đồng (VND) sau khi thanh quyết toán"
    if cn in ["percentage", "ownership_percentage", "transferred_percentage", "transfer_percentage"]:
        return "Tỷ lệ phần trăm cổ phần sở hữu xe điện (định dạng phần trăm từ 0.00% đến 100.00%)"
    if cn in ["amount", "cost", "total_cost", "total_amount", "unit_price", "price_per_kwh"]:
        return "Giá trị tài chính bằng đơn vị tiền tệ VND phát sinh trong giao dịch"
    
    if "battery" in cn or "soc" in cn: return "Thông số trạng thái dung lượng pin xe điện (SOC % hoặc kWh)"
    if "odometer" in cn or "km" in cn or "distance" in cn: return "Số đo quãng đường lăn bánh của xe điện (Kilomet)"
    if "email" in cn: return "Địa chỉ thư điện tử xác thực của người dùng"
    if "phone" in cn: return "Số điện thoại liên hệ chính thức"
    if "note" in cn or "description" in cn or "reason" in cn: return "Nội dung văn bản ghi chú chi tiết hoặc giải trình nguyên nhân"
    if "url" in cn or "image" in cn: return "Đường dẫn liên kết URI tới tệp lưu trữ media / ảnh chụp đính kèm"
    
    return f"Trường dữ liệu {cn} lưu trữ thuộc tính nghiệp vụ của {tbl_name}"

def infer_fk_target(col_name):
    cn = col_name.lower()
    # Explicit false FKs
    if any(k in cn for k in ["token", "cost", "percent", "amount", "ratio", "rate", "count", "kwh", "celsius"]):
        return "NO"
    if cn.endswith("_id"):
        target_tbl = cn[:-3] + "s"
        if target_tbl == "userss": target_tbl = "users"
        if target_tbl == "groups": target_tbl = "co_ownership_groups"
        return f"YES (FK -> {target_tbl}.id)"
    if cn in ["created_by", "updated_by", "actor_id", "member_id", "owner_id", "staff_id", "admin_id", "transferor_id", "transferee_id", "assignee_id", "voter_id", "payer_id", "payee_id"]:
        return "YES (FK -> users.id)"
    return "NO"

v4_tables = {}

for tbl_name, tbl_info in v3_tables.items():
    new_cols = []
    for c in tbl_info.get("columns", []):
        snake_name = camel_to_snake(c["name"])
        
        # Check PK
        is_pk = "YES" if snake_name == "id" or c.get("pk") == "YES" else "NO"
        
        # Check FK
        fk_status = infer_fk_target(snake_name)
        
        # Adjust Type
        col_type = c.get("type", "VARCHAR(255)")
        if snake_name in ["state_of_health_percent", "percentage", "ownership_percentage", "transfer_percentage", "transferred_percentage"]:
            col_type = "DECIMAL(5,2)"
        elif snake_name in ["actual_cost", "amount", "total_amount", "total_cost", "unit_price"]:
            col_type = "DECIMAL(14,2)"
        elif snake_name == "token":
            col_type = "VARCHAR(512)"
            
        desc = get_column_description(snake_name, tbl_name, col_type)
        
        new_cols.append({
            "name": snake_name,
            "type": col_type,
            "pk": is_pk,
            "fk": fk_status,
            "nullable": c.get("nullable", "YES"),
            "default": c.get("default", "NULL"),
            "unique": c.get("unique", "NO"),
            "desc": desc
        })
    
    v4_tables[tbl_name] = {
        "name": tbl_name,
        "purpose": tbl_info.get("purpose", f"Lưu trữ dữ liệu phân hệ {tbl_name}"),
        "columns": new_cols
    }

out_file = os.path.join(BASE_DIR, "v4_data_database.py")
with open(out_file, "w", encoding="utf-8") as fp:
    fp.write("# -*- coding: utf-8 -*-\n")
    fp.write('"""\nv4_data_database.py - Từ điển dữ liệu CSDL quan hệ 51 bảng chuẩn hóa snake_case và FK chính xác cho Báo cáo V4\n"""\n\n')
    fp.write("TABLES = {\n")
    for t_name, t_info in sorted(v4_tables.items()):
        fp.write(f'    "{t_name}": {{\n')
        fp.write(f'        "name": "{t_name}",\n')
        fp.write(f'        "purpose": "{t_info["purpose"]}",\n')
        fp.write('        "columns": [\n')
        for c in t_info["columns"]:
            fp.write('            {\n')
            fp.write(f'                "name": "{c["name"]}",\n')
            fp.write(f'                "type": "{c["type"]}",\n')
            fp.write(f'                "pk": "{c["pk"]}",\n')
            fp.write(f'                "fk": "{c["fk"]}",\n')
            fp.write(f'                "nullable": "{c["nullable"]}",\n')
            fp.write(f'                "default": "{c["default"]}",\n')
            fp.write(f'                "unique": "{c["unique"]}",\n')
            fp.write(f'                "desc": "{c["desc"]}"\n')
            fp.write('            },\n')
        fp.write('        ]\n')
        fp.write('    },\n')
    fp.write('}\n\n')
    fp.write("def get_all_tables():\n")
    fp.write("    return TABLES\n")

print(f"Successfully generated {len(v4_tables)} tables in {out_file}")
