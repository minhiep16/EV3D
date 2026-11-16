import glob, os

files = [
    'v5_chapter1.py',
    'v5_chapter3.py',
    'v5_chapter5.py',
    'v5_appendices_narratives.py'
]

keywords = ['microservice', 'vi dịch vụ', 'quỹ chung', 'quỹ bảo trì', 'shared_fund']

for f in files:
    fpath = os.path.join('D:/EV3D/docs/graduation-internship-report/final', f)
    with open(fpath, 'r', encoding='utf-8') as fp:
        lines = fp.readlines()
    for idx, line in enumerate(lines, 1):
        for kw in keywords:
            if kw in line.lower():
                print(f"{f}:{idx} [{kw}] -> {line.strip()[:100]}")
