# -*- coding: utf-8 -*-
"""
test_parse_controllers.py - Kiểm tra bóc tách chính xác 246 endpoints từ 27 controllers
"""
import os
import re
from collections import Counter

BASE_DIR = r"D:\EV3D"
backend_dir = os.path.join(BASE_DIR, "backend", "src", "main", "java", "com", "evshare")

controllers = []
for root, dirs, files in os.walk(backend_dir):
    for f in files:
        if f.endswith("Controller.java"):
            controllers.append(os.path.join(root, f))

print(f"Total controllers: {len(controllers)}")

endpoints = []
for c_path in sorted(controllers):
    c_name = os.path.basename(c_path)
    with open(c_path, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
    
    content = "".join(lines)
    
    # Class-level mapping
    class_map = ""
    # Matches @RequestMapping("/api/...") or @RequestMapping(value = "/api/...")
    m_class = re.search(r'@RequestMapping\s*\(\s*(?:(?:value|path)\s*=\s*)?["\']([^"\']+)["\']', content)
    if m_class:
        class_map = m_class.group(1).strip().rstrip("/")
    else:
        # Check if @RequestMapping has array or just starts with @RequestMapping("/api
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
                
                # Extract all strings inside raw_args
                str_literals = re.findall(r'["\']([^"\']*)["\']', raw_args)
                
                # Filter out MediaType strings like "application/json"
                path_candidates = [s for s in str_literals if not any(k in s for k in ["application/", "text/", "multipart/"])]
                
                sub_path = ""
                if path_candidates:
                    # Select the first path that looks like a subpath or empty
                    sub_path = path_candidates[0]
                
                sub_path = sub_path.strip()
                if sub_path and not sub_path.startswith("/"):
                    sub_path = "/" + sub_path
                
                full_path = (class_map + sub_path).replace("//", "/")
                if not full_path:
                    full_path = "/"
                
                # Extract role
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
                
                # Extract RequestBody and Response
                m_body = re.search(r'@RequestBody\s+(?:@Valid\s+)?(\w+)', line)
                req_dto = m_body.group(1) if m_body else "N/A"
                
                m_ret = re.search(r'public\s+(?:ResponseEntity<)?([\w\<\>\[\],\s]+?)(?:>)?\s+\w+\s*\(', line)
                resp_dto = m_ret.group(1).replace("ResponseEntity<", "").strip() if m_ret else "Object"
                if ">" in resp_dto and not resp_dto.endswith(">"):
                    resp_dto = resp_dto.split(">")[0] + ">"
                
                endpoints.append({
                    "controller": c_name,
                    "method_name": method_name,
                    "verb": verb,
                    "path": full_path,
                    "role": role,
                    "req_dto": req_dto,
                    "resp_dto": resp_dto,
                    "raw_args": raw_args
                })
            current_annotations = []
        elif not stripped.startswith("@") and not stripped.startswith("//") and not stripped.startswith("/*") and not stripped.startswith("*"):
            current_annotations = []

print(f"Total endpoints parsed: {len(endpoints)}")
counts = Counter((e["verb"], e["path"]) for e in endpoints)
dups = {k: v for k, v in counts.items() if v > 1}
print(f"Duplicates: {len(dups)}")
for k, v in dups.items():
    print(f"  {k[0]} {k[1]} ({v} times):")
    for e in endpoints:
        if (e["verb"], e["path"]) == k:
            print(f"    - {e['controller']}:{e['method_name']} (args: {e['raw_args']})")

# Check for any path ending in { or equal to /api
anomalies = [e for e in endpoints if e["path"].endswith("{") or e["path"] == "/api" or "{" in e["path"].split("/")[-1] and not e["path"].endswith("}")]
print(f"Anomalies: {len(anomalies)}")
for a in anomalies:
    print("  Anomaly:", a["verb"], a["path"], a["controller"], a["method_name"])

# Compare with v3_data_apis
import v3_data_apis
v3_apis = v3_data_apis.get_all_apis()
print(f"V3 APIs count: {len(v3_apis)}")

v3_keys = set((a["method"], a["path"]) for a in v3_apis)
p_keys = set((a["verb"], a["path"]) for a in endpoints)

print(f"In parsed but not in v3: {len(p_keys - v3_keys)}")
for item in sorted(p_keys - v3_keys):
    print("  + Parsed unique:", item)

print(f"In v3 but not in parsed: {len(v3_keys - p_keys)}")
for item in sorted(v3_keys - p_keys):
    print("  - V3 buggy/unique:", item)
