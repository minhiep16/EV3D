# -*- coding: utf-8 -*-
"""
audit_db_v3.py - Kiểm tra các cột camelCase và lỗi trong v3_data_database
"""
import sys
sys.path.append(r"D:\EV3D\docs\graduation-internship-report\final")
import v3_data_database

tables = v3_data_database.get_all_tables()
print(f"Total tables in v3: {len(tables)}")

camel_cols = []
fk_issues = []

for t_name, t_info in tables.items():
    cols = t_info.get("columns", [])
    for c in cols:
        name = c["name"]
        # Check if camelCase (contains lowercase followed by uppercase)
        if any(name[i].islower() and name[i+1].isupper() for i in range(len(name)-1)):
            camel_cols.append((t_name, name))
        
        # Check suspicious FKs
        if c.get("fk") == "YES" and any(k in name.lower() for k in ["token", "cost", "percent", "amount", "ratio", "rate", "count"]):
            fk_issues.append((t_name, name, c))

print(f"Total camelCase columns found: {len(camel_cols)}")
for t, col in camel_cols[:20]:
    print(f"  {t}: {col}")

print(f"\nSuspicious FK columns: {len(fk_issues)}")
for t, col, c in fk_issues:
    print(f"  {t}: {col} (type: {c['type']}, desc: {c['desc']})")
