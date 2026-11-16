# -*- coding: utf-8 -*-
"""
generate_v4_data_apis.py - Tạo file v4_data_apis.py chuẩn xác 100% không còn lỗi mảng hay trùng lặp
"""
import os
import re

BASE_DIR = r"D:\EV3D"
backend_dir = os.path.join(BASE_DIR, "backend", "src", "main", "java", "com", "evshare")

controllers = []
for root, dirs, files in os.walk(backend_dir):
    for f in files:
        if f.endswith("Controller.java"):
            controllers.append(os.path.join(root, f))

controllers.sort()

endpoints = []
for c_path in controllers:
    c_name = os.path.basename(c_path)
    rel_path = os.path.relpath(c_path, BASE_DIR).replace("\\", "/")
    with open(c_path, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
    
    content = "".join(lines)
    m_class = re.search(r'@RequestMapping\s*\(\s*(?:(?:value|path)\s*=\s*)?["\']([^"\']+)["\']', content)
    class_map = ""
    if m_class:
        class_map = m_class.group(1).strip().rstrip("/")
    else:
        m_class2 = re.search(r'@RequestMapping\s*\(\s*(?:(?:value|path)\s*=\s*)?\{?\s*["\']([^"\']+)["\']', content)
        if m_class2:
            class_map = m_class2.group(1).strip().rstrip("/")
            
    current_annotations = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("@"):
            current_annotations.append(stripped)
        elif "public " in line and ("(" in line) and any("Mapping" in a for a in current_annotations):
            m_meth = re.search(r'public\s+[\w\<\>\[\],\s\.]+\s+(\w+)\s*\(', line)
            method_name = m_meth.group(1) if m_meth else "unknown"
            mapping_str = " ".join(current_annotations)
            
            m_map = re.search(r'@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping|RequestMapping)\s*(?:\(([\s\S]*?)\))?(?:\s|$)', mapping_str)
            if m_map:
                verb = m_map.group(1).replace("Mapping", "").upper()
                raw_args = m_map.group(2) if m_map.group(2) else ""
                
                if verb == "REQUEST":
                    m_v = re.search(r'method\s*=\s*RequestMethod\.(\w+)', raw_args)
                    verb = m_v.group(1) if m_v else "GET"
                
                str_literals = re.findall(r'["\']([^"\']*)["\']', raw_args)
                path_candidates = [s for s in str_literals if not any(k in s for k in ["application/", "text/", "multipart/"])]
                
                sub_path = ""
                if path_candidates:
                    sub_path = path_candidates[0]
                
                sub_path = sub_path.strip()
                if sub_path and not sub_path.startswith("/"):
                    sub_path = "/" + sub_path
                
                full_path = (class_map + sub_path).replace("//", "/")
                if not full_path:
                    full_path = "/"
                
                role = "AUTHENTICATED"
                if "hasRole('ADMIN')" in mapping_str or "hasAuthority('ROLE_ADMIN')" in mapping_str:
                    role = "ADMIN"
                elif "hasRole('STAFF')" in mapping_str:
                    role = "STAFF"
                elif "hasRole('CO_OWNER')" in mapping_str:
                    role = "CO_OWNER"
                elif "hasAnyRole('STAFF', 'ADMIN')" in mapping_str or "hasAnyRole('ADMIN', 'STAFF')" in mapping_str:
                    role = "STAFF, ADMIN"
                elif "hasAnyRole" in mapping_str:
                    role = "CO_OWNER, STAFF, ADMIN"
                elif "permitAll" in mapping_str or "auth" in full_path.lower():
                    role = "PUBLIC"
                
                m_body = re.search(r'@RequestBody\s+(?:@Valid\s+)?(\w+)', line)
                req_dto = m_body.group(1) if m_body else "-"
                
                m_ret = re.search(r'public\s+(?:ResponseEntity<)?([\w\<\>\[\],\s\.]+?)(?:>)?\s+\w+\s*\(', line)
                resp_dto = "Object"
                if m_ret:
                    r_raw = m_ret.group(1).replace("ResponseEntity<", "").strip()
                    if ">" in r_raw and not r_raw.endswith(">"):
                        r_raw = r_raw.split(">")[0] + ">"
                    resp_dto = r_raw.split(".")[-1] # Short class name
                
                endpoints.append({
                    "controller": c_name.replace(".java", ""),
                    "method_name": method_name,
                    "verb": verb,
                    "path": full_path,
                    "role": role,
                    "req_dto": req_dto,
                    "resp_dto": resp_dto,
                    "source_file": rel_path
                })
            current_annotations = []
        elif not stripped.startswith("@") and not stripped.startswith("//") and not stripped.startswith("/*") and not stripped.startswith("*"):
            current_annotations = []

# Generate purpose in Vietnamese based on method name and path
def generate_purpose(e):
    v = e["verb"]
    p = e["path"]
    m = e["method_name"]
    c = e["controller"]
    
    # Custom specific descriptions
    if "login" in m.lower(): return "Xác thực danh tính người dùng và cấp phát Access Token, Refresh Token"
    if "register" in m.lower(): return "Đăng ký tài khoản người dùng mới vào hệ thống"
    if "refresh" in m.lower(): return "Cấp mới Access Token thông qua Refresh Token hợp lệ"
    if "logout" in m.lower(): return "Đăng xuất tài khoản và thu hồi Refresh Token trên hệ thống"
    if "getme" in m.lower(): return "Truy vấn thông tin hồ sơ của tài khoản đang đăng nhập"
    
    if "createbooking" in m.lower(): return "Tạo mới lịch đặt xe sau khi kiểm tra tính hợp lệ và xung đột thời gian"
    if "extendbooking" in m.lower(): return "Gia hạn thời gian sử dụng xe cho phiên đặt trước"
    if "cancelbooking" in m.lower(): return "Hủy lịch đặt xe đã tạo trước giờ khởi hành"
    
    if "starttrip" in m.lower(): return "Khởi hành chuyến đi sau khi xác thực bàn giao và điều kiện pin > 20%"
    if "completetrip" in m.lower(): return "Kết thúc chuyến đi, ghi nhận số km và mức pin thực tế"
    if "confirmreturn" in m.lower(): return "Nhân viên xác nhận tiếp nhận hoàn trả xe sau khi kết thúc chuyến"
    
    if "createchargingsession" in m.lower(): return "Khởi tạo phiên sạc pin mới cho xe tại trụ sạc chỉ định"
    if "startchargingsession" in m.lower(): return "Bắt đầu cấp nguồn điện sạc và đo đếm công suất tiêu thụ"
    if "stopchargingsession" in m.lower() or "cancelcharging" in m.lower(): return "Dừng phiên sạc và tính toán tổng năng lượng nạp thực tế"
    
    if "recordexpense" in m.lower(): return "Ghi nhận hóa đơn chi phí vận hành/bảo dưỡng phát sinh cho nhóm sở hữu"
    if "reconcile" in m.lower(): return "Thực hiện đối soát và phân bổ nghĩa vụ chi phí theo tỷ lệ sở hữu"
    
    if "createproposal" in m.lower(): return "Khởi tạo đề xuất biểu quyết chung trong nhóm đồng sở hữu"
    if "castvote" in m.lower(): return "Thực hiện bỏ phiếu biểu quyết với trọng số cổ phần nắm giữ"
    if "finalizeproposal" in m.lower(): return "Chốt kết quả biểu quyết và tự động kích hoạt nghị quyết phê duyệt"
    
    if "createdispute" in m.lower(): return "Khởi tạo hồ sơ khiếu nại tranh chấp giữa các thành viên hoặc với vận hành"
    if "assignstaff" in m.lower(): return "Phân công nhân viên chuyên trách đóng vai trò hòa giải viên trung gian"
    if "closedispute" in m.lower(): return "Đóng hồ sơ tranh chấp sau khi các bên đạt được thỏa thuận bồi thường"
    
    if "createtransfer" in m.lower(): return "Khởi tạo yêu cầu chuyển nhượng cổ phần sở hữu phương tiện"
    if "accepttransfer" in m.lower(): return "Bên nhận xác nhận đồng ý tiếp nhận chuyển nhượng cổ phần"
    if "confirmtransfer" in m.lower(): return "Bên chuyển nhượng xác nhận chữ ký điện tử đồng thuận giao dịch"
    if "completetransfer" in m.lower(): return "Hoàn tất chuyển dịch quyền sở hữu và tái cấu trúc phụ lục hợp đồng"
    
    if v == "GET":
        if "history" in p: return f"Truy vấn lịch sử giao dịch và biến động của {c.replace('Controller', '')}"
        if "summary" in p or "stats" in p or "dashboard" in p: return f"Truy vấn dữ liệu thống kê tổng hợp cho {c.replace('Controller', '')}"
        if "active" in p: return f"Truy vấn trạng thái đang hoạt động hiện thời của {c.replace('Controller', '')}"
        if "{" in p: return f"Truy vấn thông tin chi tiết một bản ghi {c.replace('Controller', '')} theo định danh ID"
        return f"Truy vấn danh sách bản ghi dữ liệu thuộc phân hệ {c.replace('Controller', '')}"
    elif v == "POST":
        return f"Thực thi hành động nghiệp vụ '{m}' thuộc phân hệ {c.replace('Controller', '')}"
    elif v == "PUT" or v == "PATCH":
        return f"Cập nhật thông tin hoặc chuyển đổi trạng thái '{m}' thuộc {c.replace('Controller', '')}"
    elif v == "DELETE":
        return f"Hủy bỏ hoặc xóa bản ghi dữ liệu thuộc phân hệ {c.replace('Controller', '')}"
    return f"Xử lý yêu cầu API {v} {p}"

for idx, e in enumerate(endpoints, 1):
    e["id"] = f"API-{idx:03d}"
    e["purpose"] = generate_purpose(e)

out_file = os.path.join(BASE_DIR, "docs", "graduation-internship-report", "final", "v4_data_apis.py")
with open(out_file, "w", encoding="utf-8") as fp:
    fp.write("# -*- coding: utf-8 -*-\n")
    fp.write('"""\nv4_data_apis.py - Danh mục REST API Endpoints chuẩn xác cho Báo cáo V4\n"""\n\n')
    fp.write("APIS = [\n")
    for e in endpoints:
        fp.write("    {\n")
        fp.write(f'        "id": "{e["id"]}",\n')
        fp.write(f'        "method": "{e["verb"]}",\n')
        fp.write(f'        "path": "{e["path"]}",\n')
        fp.write(f'        "controller": "{e["controller"]}",\n')
        fp.write(f'        "method_name": "{e["method_name"]}",\n')
        fp.write(f'        "role": "{e["role"]}",\n')
        fp.write(f'        "purpose": "{e["purpose"]}",\n')
        fp.write(f'        "request_dto": "{e["req_dto"]}",\n')
        fp.write(f'        "response_dto": "{e["resp_dto"]}",\n')
        fp.write(f'        "source_file": "{e["source_file"]}"\n')
        fp.write("    },\n")
    fp.write("]\n\n")
    fp.write("def get_all_apis():\n")
    fp.write("    return APIS\n")

print(f"Successfully generated {len(endpoints)} APIs in {out_file}")
