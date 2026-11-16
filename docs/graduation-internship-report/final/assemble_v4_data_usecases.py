# -*- coding: utf-8 -*-
"""
assemble_v4_data_usecases.py - Ghép nối toàn bộ 88 Use Case chi tiết không lặp vào v4_data_usecases.py
"""
import os
import sys

BASE_DIR = r"D:\EV3D\docs\graduation-internship-report\final"
sys.path.append(BASE_DIR)

import gen_v4_usecases_part1
import gen_v4_usecases_part1_b
import gen_v4_usecases_part2_a
import gen_v4_usecases_part2_b

all_ucs = []
all_ucs.extend(gen_v4_usecases_part1.UCS_PART1)
all_ucs.extend(gen_v4_usecases_part1_b.UCS_OWN_CON_BOOK_TRIP)
all_ucs.extend(gen_v4_usecases_part2_a.UCS_CHRG_FIN_MAINT)
all_ucs.extend(gen_v4_usecases_part2_b.UCS_VOTE_ADMIN_NOTI)

print(f"Total Use Cases assembled: {len(all_ucs)}")

# Verify uniqueness of IDs
ids = [u["id"] for u in all_ucs]
assert len(ids) == len(set(ids)), f"Duplicate UC IDs found! {len(ids)} vs {len(set(ids))}"
assert len(all_ucs) == 88, f"Expected 88 Use Cases, got {len(all_ucs)}!"

out_file = os.path.join(BASE_DIR, "v4_data_usecases.py")
with open(out_file, "w", encoding="utf-8") as fp:
    fp.write("# -*- coding: utf-8 -*-\n")
    fp.write('"""\nv4_data_usecases.py - Danh mục 88 Đặc tả Use Case chi tiết chuẩn hóa hoàn toàn cho Báo cáo V4\n')
    fp.write('Loại bỏ 100% mẫu lặp generic. Nhóm 3D (UC-3D-01 đến 07) hoàn toàn Client-side WebGL / Three.js / Zustand.\n')
    fp.write('14 Use Case chính ở Chương 3 (Mục 3.9) và 74 Use Case đầy đủ ở Phụ lục C.\n"""\n\n')
    fp.write("USE_CASES = [\n")
    for u in all_ucs:
        fp.write("    {\n")
        fp.write(f'        "id": "{u["id"]}",\n')
        fp.write(f'        "name": "{u["name"]}",\n')
        fp.write(f'        "primary_actor": "{u["primary_actor"]}",\n')
        fp.write(f'        "secondary_actor": "{u["secondary_actor"]}",\n')
        fp.write(f'        "description": "{u["description"]}",\n')
        fp.write(f'        "priority": "{u["priority"]}",\n')
        fp.write(f'        "trigger": "{u["trigger"]}",\n')
        fp.write(f'        "preconditions": "{u["preconditions"]}",\n')
        fp.write(f'        "postconditions": "{u["postconditions"]}",\n')
        
        main_flow_esc = u["main_flow"].replace('"', '\\"').replace('\n', '\\n')
        fp.write(f'        "main_flow": "{main_flow_esc}",\n')
        
        alt_flow_esc = u["alt_flow"].replace('"', '\\"').replace('\n', '\\n')
        fp.write(f'        "alt_flow": "{alt_flow_esc}",\n')
        
        exc_flow_esc = u["exception_flow"].replace('"', '\\"').replace('\n', '\\n')
        fp.write(f'        "exception_flow": "{exc_flow_esc}",\n')
        
        fp.write(f'        "business_rules": "{u["business_rules"]}",\n')
        fp.write(f'        "related_fr": "{u["related_fr"]}",\n')
        fp.write(f'        "related_tc": "{u["related_tc"]}"\n')
        fp.write("    },\n")
    fp.write("]\n\n")
    fp.write("def get_all_use_cases():\n")
    fp.write("    return USE_CASES\n")

print(f"Successfully wrote {len(all_ucs)} Use Cases to {out_file}")
