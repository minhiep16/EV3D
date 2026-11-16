# -*- coding: utf-8 -*-
import os
import re

backend_src = r"D:\EV3D\backend\src\main\java\com\evshare"
controllers = []
for root, dirs, files in os.walk(backend_src):
    for f in files:
        if f.endswith("Controller.java"):
            controllers.append(os.path.join(root, f))

print(f"Total Controller files: {len(controllers)}")
endpoints = []

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
            
    # parse methods
    for i, line in enumerate(lines):
        for http_m in ["GetMapping", "PostMapping", "PutMapping", "DeleteMapping", "PatchMapping"]:
            if f"@{http_m}" in line:
                m_path = ""
                # extract path inside annotation
                match_p = re.search(rf'@{http_m}\(\s*(?:value\s*=\s*)?["\']([^"\']*)["\']', line)
                if match_p:
                    m_path = match_p.group(1)
                full_path = (base_path.rstrip("/") + "/" + m_path.lstrip("/")).rstrip("/")
                if not full_path:
                    full_path = "/"
                # find method name
                func_name = ""
                for j in range(i+1, min(i+5, len(lines))):
                    fn_match = re.search(r'public\s+[\w\<\>\,\[\]\s]+\s+(\w+)\s*\(', lines[j])
                    if fn_match:
                        func_name = fn_match.group(1)
                        break
                verb = http_m.replace("Mapping", "").upper()
                endpoints.append((cname, verb, full_path, func_name))

print(f"Total Endpoints found: {len(endpoints)}")
for ep in endpoints:
    print(f"[{ep[1]}] {ep[2]} -> {ep[0]}.{ep[3]}()")
