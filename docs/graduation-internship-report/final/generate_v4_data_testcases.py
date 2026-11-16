# -*- coding: utf-8 -*-
"""
generate_v4_data_testcases.py - Tạo file v4_data_testcases.py chuẩn hóa toàn bộ 100 ca kiểm thử
với liên kết sạch tới Canonical FRs, Canonical UCs, trạng thái NOT EXECUTED và kết quả thực tế 'Chưa ghi nhận'.
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)
import v3_data_testcases

tcs = v3_data_testcases.load_test_cases()
print(f"Loaded {len(tcs)} test cases from v3.")

# Canonical FR ID mapping helper
def fix_req_id(tc_id, current_req):
    prefix = tc_id.split("-")[1]
    num = int(tc_id.split("-")[2])
    
    if prefix == "AUTH":
        fr_num = min(num, 6)
        return f"FR-AUTH-{fr_num:02d}"
    elif prefix == "3D":
        fr_num = min(num, 7)
        return f"FR-3D-{fr_num:02d}"
    elif prefix == "CO":
        fr_num = min(num, 8)
        return f"FR-CO-{fr_num:02d}"
    elif prefix == "BOOK":
        fr_num = min(num, 8)
        return f"FR-BOOK-{fr_num:02d}"
    elif prefix == "CHG":
        fr_num = min(num, 6)
        return f"FR-CHG-{fr_num:02d}"
    elif prefix == "TRIP":
        fr_num = min(num, 6)
        return f"FR-TRIP-{fr_num:02d}"
    elif prefix == "EXP":
        fr_num = min(num, 6)
        return f"FR-EXP-{fr_num:02d}"
    elif prefix == "VOTE":
        fr_num = min(num, 6)
        return f"FR-VOTE-{fr_num:02d}"
    elif prefix == "DISP":
        fr_num = min(num, 6)
        return f"FR-DISP-{fr_num:02d}"
    elif prefix == "ADM":
        fr_num = min(num, 5)
        return f"FR-ADM-{fr_num:02d}"
    elif prefix == "STF":
        fr_num = min(num, 4)
        return f"FR-STF-{fr_num:02d}"
    elif prefix == "REG":
        # Map regression tests to appropriate canonical FRs
        if num in [1, 2, 4, 5, 12, 13, 22, 27]:
            return "FR-3D-01"
        elif num in [3, 26, 29, 31]:
            return "FR-AUTH-05"
        elif num in [6, 7, 8]:
            return "FR-CHG-04"
        elif num in [9, 10, 11, 19]:
            return "FR-CO-07"
        elif num in [14, 25]:
            return "FR-AUTH-02"
        elif num in [15, 16, 30]:
            return "FR-TRIP-01"
        elif num in [17, 18]:
            return "FR-EXP-02"
        elif num in [20, 23]:
            return "FR-VOTE-02"
        elif num in [21]:
            return "FR-DISP-06"
        elif num in [24]:
            return "FR-BOOK-02"
        elif num in [28]:
            return "FR-BOOK-07"
        return "FR-3D-01"
    return current_req

# UC mapping helper
def fix_related_uc(tc_id):
    parts = tc_id.split("-")
    prefix = parts[1]
    num = int(parts[2])
    
    if prefix in ["AUTH", "3D", "CO", "BOOK", "CHG", "TRIP", "EXP", "VOTE", "DISP", "ADM", "STF"]:
        return f"UC-{prefix}-{num:02d}"
    elif prefix == "REG":
        # Regression tests relate to core UCs
        reg_map = {
            1: "UC-3D-01", 2: "UC-TRIP-02", 3: "UC-ADM-01", 4: "UC-3D-01", 5: "UC-3D-01",
            6: "UC-CHG-03", 7: "UC-CHG-05", 8: "UC-CHG-06", 9: "UC-CO-07", 10: "UC-CO-03",
            11: "UC-CO-07", 12: "UC-3D-07", 13: "UC-3D-01", 14: "UC-AUTH-02", 15: "UC-TRIP-01",
            16: "UC-TRIP-02", 17: "UC-EXP-02", 18: "UC-EXP-06", 19: "UC-CO-07", 20: "UC-VOTE-02",
            21: "UC-DISP-06", 22: "UC-3D-03", 23: "UC-VOTE-01", 24: "UC-BOOK-02", 25: "UC-AUTH-04",
            26: "UC-AUTH-05", 27: "UC-3D-01", 28: "UC-BOOK-07", 29: "UC-AUTH-02", 30: "UC-TRIP-02",
            31: "UC-AUTH-01"
        }
        return reg_map.get(num, "UC-3D-01")
    return "UC-AUTH-01"

v4_tcs = []
for t in tcs:
    req_id = fix_req_id(t["id"], t.get("req_id", ""))
    rel_uc = fix_related_uc(t["id"])
    
    v4_tcs.append({
        "id": t["id"],
        "name": t["name"],
        "req_id": req_id,
        "related_uc": rel_uc,
        "actor": t.get("actor", "Người dùng"),
        "priority": "High" if "REG" in t["id"] or int(t["id"].split("-")[2]) <= 3 else "Medium",
        "preconditions": t.get("preconditions", "Môi trường hệ thống sẵn sàng"),
        "test_data": t.get("test_data", "Dữ liệu kiểm thử hợp lệ"),
        "steps": t.get("steps", "1. Thực thi thao tác trên giao diện\n2. Kiểm tra kết quả phản hồi"),
        "expected": t.get("expected", "Hệ thống phản hồi thành công và cập nhật trạng thái"),
        "actual": "Chưa ghi nhận (Chưa thực thi thực tế)",
        "status": "NOT EXECUTED",
        "evidence": "Chưa có (Được đối chiếu từ mã nguồn tham chiếu)",
        "source": t.get("evidence", "Mã nguồn dự án")
    })

out_file = os.path.join(BASE_DIR, "v4_data_testcases.py")
with open(out_file, "w", encoding="utf-8") as fp:
    fp.write("# -*- coding: utf-8 -*-\n")
    fp.write('"""\nv4_data_testcases.py - Danh mục 100 ca kiểm thử chuẩn hóa cho Báo cáo V4\n')
    fp.write('Bao gồm: 69 ca chức năng + 31 ca kiểm thử hồi quy bảo vệ 14 nhóm lỗi lịch sử.\n')
    fp.write('Trạng thái minh bạch học thuật: NOT EXECUTED, Kết quả thực tế: Chưa ghi nhận.\n"""\n\n')
    fp.write("TEST_CASES = [\n")
    for t in v4_tcs:
        fp.write("    {\n")
        fp.write(f'        "id": "{t["id"]}",\n')
        fp.write(f'        "name": "{t["name"]}",\n')
        fp.write(f'        "req_id": "{t["req_id"]}",\n')
        fp.write(f'        "related_uc": "{t["related_uc"]}",\n')
        fp.write(f'        "actor": "{t["actor"]}",\n')
        fp.write(f'        "priority": "{t["priority"]}",\n')
        fp.write(f'        "preconditions": "{t["preconditions"]}",\n')
        fp.write(f'        "test_data": "{t["test_data"]}",\n')
        steps_esc = t["steps"].replace('"', '\\"').replace('\n', '\\n')
        fp.write(f'        "steps": "{steps_esc}",\n')
        exp_esc = t["expected"].replace('"', '\\"').replace('\n', '\\n')
        fp.write(f'        "expected": "{exp_esc}",\n')
        fp.write(f'        "actual": "{t["actual"]}",\n')
        fp.write(f'        "status": "{t["status"]}",\n')
        fp.write(f'        "evidence": "{t["evidence"]}",\n')
        fp.write(f'        "source": "{t["source"]}"\n')
        fp.write("    },\n")
    fp.write("]\n\n")
    fp.write("def get_all_test_cases():\n")
    fp.write("    return TEST_CASES\n")

print(f"Successfully generated {len(v4_tcs)} test cases in {out_file}")
