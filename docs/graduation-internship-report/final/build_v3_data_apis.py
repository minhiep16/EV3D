# -*- coding: utf-8 -*-
"""
build_v3_data_apis.py - Trích xuất danh mục 246 RESTful API Endpoints từ 27 Controllers
"""
import os
import re

backend_src = r"D:\EV3D\backend\src\main\java\com\evshare"
out_py = r"D:\EV3D\docs\graduation-internship-report\final\v3_data_apis.py"

controllers = []
for root, dirs, files in os.walk(backend_src):
    for f in files:
        if f.endswith("Controller.java"):
            controllers.append(os.path.join(root, f))

api_list = []
api_idx = 1

controller_roles = {
    "AdminController": "ADMIN",
    "AiAssistantController": "ALL (CO_OWNER, STAFF, ADMIN)",
    "AuthController": "PUBLIC / ALL",
    "BatteryHealthController": "CO_OWNER, STAFF, ADMIN",
    "BookingController": "CO_OWNER, STAFF",
    "ChargingSessionController": "CO_OWNER, STAFF",
    "ChargingStationController": "ALL",
    "CoOwnershipContractController": "CO_OWNER, ADMIN",
    "DamageController": "STAFF, CO_OWNER",
    "DisputeController": "CO_OWNER, STAFF, ADMIN",
    "EnergyInventoryController": "CO_OWNER, ADMIN, STAFF",
    "ExpenseController": "STAFF, ADMIN, CO_OWNER",
    "HealthController": "PUBLIC",
    "MaintenanceController": "CO_OWNER, STAFF, ADMIN",
    "MembershipInvitationController": "CO_OWNER, ADMIN",
    "NotificationController": "AUTHENTICATED",
    "OwnershipTransferController": "CO_OWNER, ADMIN",
    "PersonalPaymentController": "CO_OWNER, STAFF",
    "StaffApprovedWorkController": "STAFF",
    "TripController": "CO_OWNER, STAFF",
    "VehicleController": "AUTHENTICATED",
    "VehicleHandoverController": "STAFF, CO_OWNER",
    "VehicleInspectionController": "STAFF",
    "VoteProposalController": "CO_OWNER",
    "PublicVehicleController": "PUBLIC",
    "PublicShowcaseController": "PUBLIC",
    "TelemetryIngressController": "SYSTEM / IOT"
}

for c in sorted(controllers):
    cname = os.path.basename(c).replace(".java", "")
    with open(c, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
        
    base_path = ""
    for line in lines:
        m = re.search(r'@RequestMapping\(\s*["\']([^"\']*)["\']', line)
        if m:
            base_path = m.group(1)
            break
            
    for i, line in enumerate(lines):
        for http_m in ["GetMapping", "PostMapping", "PutMapping", "DeleteMapping", "PatchMapping"]:
            if f"@{http_m}" in line:
                m_path = ""
                match_p = re.search(rf'@{http_m}\(\s*(?:value\s*=\s*)?["\']([^"\']*)["\']', line)
                if match_p:
                    m_path = match_p.group(1)
                full_path = (base_path.rstrip("/") + "/" + m_path.lstrip("/")).rstrip("/")
                if not full_path:
                    full_path = "/"
                func_name = ""
                for j in range(i+1, min(i+5, len(lines))):
                    fn_match = re.search(r'public\s+[\w\<\>\,\[\]\s]+\s+(\w+)\s*\(', lines[j])
                    if fn_match:
                        func_name = fn_match.group(1)
                        break
                verb = http_m.replace("Mapping", "").upper()
                
                api_id = f"API-{api_idx:03d}"
                role = controller_roles.get(cname, "AUTHENTICATED")
                
                # deduce purpose
                purpose = f"Thực thi phương thức {func_name} trong {cname}"
                if "get" in func_name.lower(): purpose = f"Truy vấn thông tin dữ liệu {full_path}"
                elif "create" in func_name.lower() or "start" in func_name.lower(): purpose = f"Khởi tạo / gửi dữ liệu mới cho {full_path}"
                elif "update" in func_name.lower() or "patch" in verb.lower(): purpose = f"Cập nhật trạng thái đối tượng tại {full_path}"
                elif "delete" in func_name.lower() or "cancel" in func_name.lower(): purpose = f"Hủy / xóa bỏ đối tượng tại {full_path}"
                elif "verify" in func_name.lower(): purpose = f"Xác minh và phê duyệt chứng từ tại {full_path}"
                
                api_list.append({
                    "id": api_id,
                    "method": verb,
                    "path": full_path,
                    "controller": cname,
                    "method_name": func_name,
                    "role": role,
                    "purpose": purpose
                })
                api_idx += 1

out_content = f"""# -*- coding: utf-8 -*-
\"\"\"
v3_data_apis.py - Danh mục 246 RESTful API Endpoints từ 27 Controllers
\"\"\"

APIS_DATA = {repr(api_list)}

def get_all_apis():
    return APIS_DATA
"""

with open(out_py, "w", encoding="utf-8") as fp:
    fp.write(out_content)

print(f"Generated {out_py} with {len(api_list)} API endpoints.")
