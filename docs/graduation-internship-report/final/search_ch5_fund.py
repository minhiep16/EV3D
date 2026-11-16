import os

fpath = 'D:/EV3D/docs/graduation-internship-report/final/v5_chapter5.py'
with open(fpath, 'r', encoding='utf-8', errors='ignore') as fp:
    lines = fp.readlines()

keywords = ['quỹ chung', 'quỹ bảo trì', 'shared_fund', 'sharedfund', 'quỹ tập trung']
for idx, line in enumerate(lines, 1):
    for kw in keywords:
        if kw in line.lower():
            print(f"Line {idx} [{kw}]: {line.strip()[:100]}")
