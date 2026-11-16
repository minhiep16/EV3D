# -*- coding: utf-8 -*-
import sys
sys.path.append(r"D:\EV3D\docs\graduation-internship-report\final")
import v3_data_usecases
ucs = v3_data_usecases.get_all_use_cases()

print("First 14 UCs:")
for i, u in enumerate(ucs[:14]):
    print(f"{i+1}. {u['id']}: {u['name']}")

print("\nRemaining 74 UCs:")
for i, u in enumerate(ucs[14:], 15):
    print(f"{i}. {u['id']}: {u['name']}")
