import glob, os

files = glob.glob('D:/EV3D/docs/graduation-internship-report/final/*.py')
keywords = ['vi dịch vụ', 'microservice', 'micro-service']

for f in files:
    with open(f, 'r', encoding='utf-8', errors='ignore') as fp:
        lines = fp.readlines()
    for idx, line in enumerate(lines, 1):
        for kw in keywords:
            if kw in line.lower():
                print(f"{os.path.basename(f)}:{idx} [{kw}] -> {line.strip()[:120]}")
