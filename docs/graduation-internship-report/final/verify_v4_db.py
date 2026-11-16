# -*- coding: utf-8 -*-
import sys
sys.path.append(r"D:\EV3D\docs\graduation-internship-report\final")
import v4_data_database

tables = v4_data_database.get_all_tables()
print("Total tables:", len(tables))

checks = [
    ("refresh_tokens", "token"),
    ("vehicle_battery_health", "state_of_health_percent"),
    ("vote_proposals", "actual_cost")
]
for tname, cname in checks:
    cols = tables[tname]["columns"]
    c_match = [c for c in cols if c["name"] == cname]
    if c_match:
        c = c_match[0]
        print(f"{tname}.{cname}: pk={c['pk']}, fk={c['fk']}, type={c['type']}")
        print(f"   desc: {c['desc']}")
