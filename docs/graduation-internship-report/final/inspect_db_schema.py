# -*- coding: utf-8 -*-
"""
inspect_db_schema.py - Phân tích cấu trúc Flyway và Entity để trích xuất physical schema chuẩn xác
"""
import os
import re

BASE_DIR = r"D:\EV3D"
flyway_dir = os.path.join(BASE_DIR, "backend", "src", "main", "resources", "db", "migration")
migrations = sorted([f for f in os.listdir(flyway_dir) if f.endswith(".sql")])
print(f"Total Flyway migrations: {len(migrations)}")

# Extract table definitions from SQL
tables = {}
for m in migrations:
    m_path = os.path.join(flyway_dir, m)
    with open(m_path, "r", encoding="utf-8", errors="ignore") as fp:
        sql = fp.read()
    
    # Match CREATE TABLE [IF NOT EXISTS] `?(\w+)`?
    create_stmts = re.findall(r'CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?`?(\w+)`?\s*\(([\s\S]*?)\)\s*(?:ENGINE|;)', sql, re.IGNORECASE)
    for tbl_name, body in create_stmts:
        tbl_name_lower = tbl_name.lower()
        if tbl_name_lower not in tables:
            tables[tbl_name_lower] = {"name": tbl_name_lower, "cols": [], "migration": m}
        
        # parse columns
        lines = body.split("\n")
        for line in lines:
            line_str = line.strip().rstrip(",")
            if not line_str or line_str.startswith("--") or line_str.startswith("/*"):
                continue
            if re.match(r'^(PRIMARY\s+KEY|KEY|INDEX|UNIQUE\s+KEY|CONSTRAINT|FOREIGN\s+KEY)', line_str, re.IGNORECASE):
                continue
            
            # Column definition: `col_name` TYPE ...
            m_col = re.match(r'`?(\w+)`?\s+([\w\(\),]+)(.*)', line_str)
            if m_col:
                c_name = m_col.group(1).lower()
                c_type = m_col.group(2).upper()
                rest = m_col.group(3).upper()
                
                is_pk = "YES" if "PRIMARY KEY" in rest or c_name == "id" else "NO"
                is_nullable = "NO" if "NOT NULL" in rest else "YES"
                is_unique = "YES" if "UNIQUE" in rest else "NO"
                
                tables[tbl_name_lower]["cols"].append({
                    "name": c_name,
                    "type": c_type,
                    "pk": is_pk,
                    "nullable": is_nullable,
                    "unique": is_unique,
                    "raw": line_str
                })

print(f"Tables found in migrations: {len(tables)}")
for tname in sorted(tables.keys())[:10]:
    print(f"  {tname}: {len(tables[tname]['cols'])} columns")
