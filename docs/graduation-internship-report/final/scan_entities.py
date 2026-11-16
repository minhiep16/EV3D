# -*- coding: utf-8 -*-
import os
import re

backend_src = r"D:\EV3D\backend\src\main\java\com\evshare"
entities = []

for root, dirs, files in os.walk(backend_src):
    for f in files:
        if f.endswith(".java"):
            fpath = os.path.join(root, f)
            with open(fpath, "r", encoding="utf-8", errors="ignore") as fp:
                txt = fp.read()
            if "@Entity" in txt:
                # find table name
                tbl_m = re.search(r'@Table\(\s*name\s*=\s*["\']([^"\']*)["\']', txt)
                tbl_name = tbl_m.group(1) if tbl_m else f.replace(".java", "").lower()
                cname = f.replace(".java", "")
                
                # find fields
                fields = []
                for line in txt.split("\n"):
                    col_m = re.search(r'@Column\(\s*(?:name\s*=\s*["\']([^"\']*)["\'])?', line)
                    field_m = re.search(r'private\s+([\w\<\>\,\[\]]+)\s+(\w+)\s*;', line)
                    if field_m:
                        ftype, fname = field_m.group(1), field_m.group(2)
                        fields.append((fname, ftype))
                entities.append((cname, tbl_name, fields))

print(f"Total JPA Entities found: {len(entities)}")
for e in sorted(entities, key=lambda x: x[1]):
    print(f"Table: {e[1]} -> Class: {e[0]} ({len(e[2])} fields)")
