# -*- coding: utf-8 -*-
"""
scan_api_and_db_v4.py - Quét và phân tích mã nguồn chi tiết cho V4
"""
import os
import re
from collections import Counter

BASE_DIR = r"D:\EV3D"
backend_dir = os.path.join(BASE_DIR, "backend", "src", "main", "java", "com", "evshare")

print("--- 1. SCANNING CONTROLLERS ---")
controllers = []
for root, dirs, files in os.walk(backend_dir):
    for f in files:
        if f.endswith("Controller.java"):
            controllers.append(os.path.join(root, f))

print(f"Total Controller files: {len(controllers)}")

endpoints = []
for c_path in sorted(controllers):
    c_name = os.path.basename(c_path)
    with open(c_path, "r", encoding="utf-8", errors="ignore") as fp:
        lines = fp.readlines()
    
    content = "".join(lines)
    
    # Class-level mapping
    class_map = ""
    m_class = re.search(r'@RequestMapping\s*\(\s*(?:value\s*=\s*)?["\']([^"\']+)["\']', content)
    if m_class:
        class_map = m_class.group(1).rstrip("/")
        
    # Find methods with mapping annotations
    current_annotations = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("@"):
            current_annotations.append(stripped)
        elif "public " in line and ("(" in line) and any("Mapping" in a for a in current_annotations):
            # Parse method name
            m_meth = re.search(r'public\s+[\w\<\>\[\],\s]+\s+(\w+)\s*\(', line)
            method_name = m_meth.group(1) if m_meth else "unknown"
            
            # Extract mapping info from annotations
            mapping_str = " ".join(current_annotations)
            m_map = re.search(r'@(GetMapping|PostMapping|PutMapping|PatchMapping|DeleteMapping)\s*(?:\(\s*(?:(?:value|path)\s*=\s*)?["\']?([^"\')\s]*)["\']?)?', mapping_str)
            if m_map:
                http_verb = m_map.group(1).replace("Mapping", "").upper()
                sub_path = m_map.group(2) if m_map.group(2) else ""
                sub_path = sub_path.strip("\"' ")
                if sub_path and not sub_path.startswith("/"):
                    sub_path = "/" + sub_path
                full_path = (class_map + sub_path).replace("//", "/")
                if not full_path:
                    full_path = "/"
                
                # Check security role
                role = "AUTHENTICATED"
                if "hasRole('ADMIN')" in mapping_str or "hasAuthority('ROLE_ADMIN')" in mapping_str:
                    role = "ADMIN"
                elif "hasRole('STAFF')" in mapping_str:
                    role = "STAFF"
                elif "hasRole('CO_OWNER')" in mapping_str:
                    role = "CO_OWNER"
                elif "permitAll" in mapping_str or "auth" in full_path.lower():
                    role = "PUBLIC"
                
                endpoints.append({
                    "controller": c_name,
                    "method_name": method_name,
                    "verb": http_verb,
                    "path": full_path,
                    "role": role,
                    "annotations": mapping_str
                })
            current_annotations = []
        elif not stripped.startswith("@") and not stripped.startswith("//") and not stripped.startswith("/*") and not stripped.startswith("*"):
            current_annotations = []

print(f"Total method endpoints parsed: {len(endpoints)}")
distinct_paths = set((e["verb"], e["path"]) for e in endpoints)
print(f"Distinct (verb, path): {len(distinct_paths)}")

counts = Counter((e["verb"], e["path"]) for e in endpoints)
dups = {k: v for k, v in counts.items() if v > 1}
print(f"Duplicate (verb, path) combinations: {len(dups)}")
for k, v in dups.items():
    matching = [e for e in endpoints if e["verb"] == k[0] and e["path"] == k[1]]
    print(f"  {k[0]} {k[1]} ({v} times): {[m['controller'] + ':' + m['method_name'] for m in matching]}")

print("\n--- 2. SCANNING ENTITIES & FLYWAY MIGRATIONS ---")
entity_dir = os.path.join(backend_dir)
entities = []
for root, dirs, files in os.walk(entity_dir):
    for f in files:
        if f.endswith(".java"):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
                head = fp.read(1000)
                if "@Entity" in head or "@Table" in head:
                    entities.append(fpath)

print(f"Total JPA Entity files: {len(entities)}")

flyway_dir = os.path.join(BASE_DIR, "backend", "src", "main", "resources", "db", "migration")
migrations = sorted([f for f in os.listdir(flyway_dir) if f.endswith(".sql")])
print(f"Total Flyway Migration files: {len(migrations)}")
